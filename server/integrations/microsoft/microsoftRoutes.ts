/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getMicrosoftConfig } from './microsoftConfig.js';
import { generateMicrosoftOAuthState, validateMicrosoftOAuthState, getMicrosoftAuthUrl, exchangeMicrosoftCode, getMicrosoftAccessToken, microsoftActiveStates } from './microsoftOAuth.js';
import { syncMicrosoft365 } from './microsoftSync.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';

export function getMicrosoftRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  /**
   * GET /api/integrations/microsoft/connect
   * Initiates Microsoft 365 OAuth consent flow.
   */
  router.get('/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;

    try {
      const stateToken = generateMicrosoftOAuthState(wsId, userId);
      const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
      const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.MICROSOFT_CLIENT_ID);
      if (isMock) {
        const mockCode = 'mock_microsoft_oauth_code_123';
        const mockUrl = `${req.protocol}://${req.get('host')}/api/integrations/microsoft/callback?code=${mockCode}&state=${stateToken}`;
        return res.json({ url: mockUrl });
      }

      const scopes = [
        'openid',
        'profile',
        'offline_access',
        'User.Read',
        'Mail.Read',
        'Mail.Send',
        'Calendars.ReadBasic',
        'Calendars.Read',
        'ChannelMessage.Read.All',
        'Chat.Read'
      ];

      const authUrl = await getMicrosoftAuthUrl(stateToken, scopes);

      logIntegrationAudit(
        dbState,
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        'Microsoft 365 OAuth flow initiated',
        'Microsoft 365'
      );

      res.json({ url: authUrl });
    } catch (err: any) {
      console.error('[Microsoft Connect] Failed to generate auth URL:', err.message);
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * GET /api/integrations/microsoft/callback
   * Exchange Microsoft OAuth authorization code.
   */
  router.get('/callback', requireAuth, async (req, res) => {
    const { code, state } = req.query;
    const codeStr = String(code || '');
    const stateStr = String(state || '');
    const sessionUserId = (req as any).authUser?.id;
    const stateData = microsoftActiveStates.get(stateStr);

    if (!stateData || !sessionUserId || sessionUserId !== stateData.userId) {
      console.error('[Microsoft Callback] State validation failed.');
      return res.status(400).send('OAuth state validation mismatch. Re-authorize Microsoft connection.');
    }

    if (!validateMicrosoftOAuthState(stateStr, stateData.workspaceId, stateData.userId)) {
      console.error('[Microsoft Callback] State validation failed.');
      return res.status(400).send('OAuth state validation mismatch. Re-authorize Microsoft connection.');
    }

    const expectedWsId = stateData.workspaceId;
    const expectedUserId = stateData.userId;

    try {
      const scopes = [
        'openid',
        'profile',
        'offline_access',
        'User.Read',
        'Mail.Read',
        'Mail.Send',
        'Calendars.ReadBasic',
        'Calendars.Read',
        'ChannelMessage.Read.All',
        'Chat.Read'
      ];

      const result = await exchangeMicrosoftCode(codeStr, scopes);

      const store = new IntegrationStateStore(dbState);
      await store.upsertConnection({
        id: `conn_microsoft_${expectedWsId}`,
        workspaceId: expectedWsId,
        provider: 'microsoft_365',
        status: 'connected',
        connectedByUserId: expectedUserId,
        connectedAt: new Date().toISOString(),
        providerAccountId: result.providerAccountId,
        providerAccountEmail: result.email,
        tenantId: result.tenantId,
        scopes: result.scopes,
        encryptedAccessToken: result.encryptedAccessToken,
        encryptedRefreshToken: result.encryptedRefreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt
      });

      logIntegrationAudit(
        dbState,
        expectedWsId,
        'System Callback',
        'System',
        `Microsoft 365 connected by user ${expectedUserId} (${result.email})`,
        'Microsoft 365'
      );

      await persistStateCallback(expectedWsId);

      res.redirect('/app/integrations?integration=microsoft_365&connected=true');
    } catch (err: any) {
      console.error('[Microsoft Callback] Token exchange failed:', err.message);
      res.status(500).send(`Failed to exchange Microsoft OAuth code: ${err.message}`);
    }
  });

  /**
   * GET /api/integrations/microsoft/status
   * Returns current status of connection.
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);
    try {
      const conn = await store.getConnection(wsId, 'microsoft_365');
      if (!conn) {
        const hasEnv = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
        return res.json({ connected: false, status: hasEnv ? 'available_to_connect' : 'missing_env' });
      }

      res.json({
        connected: conn.status === 'connected',
        status: conn.status,
        providerAccountEmail: conn.providerAccountEmail,
        tenantId: conn.tenantId,
        scopes: conn.scopes,
        lastSyncedAt: conn.lastSyncedAt,
        lastError: conn.lastError
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/microsoft/sync
   * Synchronizes Microsoft data.
   */
  router.post('/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, csrfProtection, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    try {
      await syncMicrosoft365(wsId, dbState, () => persistStateCallback(wsId));
      res.json({ success: true, message: 'Microsoft 365 synced successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Sync Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/microsoft/disconnect
   * Disconnects Microsoft integration.
   */
  router.post('/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);

    try {
      const deleted = await store.deleteConnection(wsId, 'microsoft_365');
      if (deleted) {
        // Also clear out Microsoft 365 communication signals
        if (dbState.workspaceCommunicationSignals) {
          dbState.workspaceCommunicationSignals = dbState.workspaceCommunicationSignals.filter(
            (s: any) => !(s.workspaceId === wsId && (s.provider.startsWith('outlook') || s.provider === 'microsoft_teams'))
          );
        }

        // Also clean up Microsoft sync Work Queue items
        const syncErrorKey = 'integration:microsoft_365:sync_error';
        if (dbState.workItems) {
          dbState.workItems = dbState.workItems.filter((wi: any) => wi.relatedId !== syncErrorKey);
        }

        logIntegrationAudit(
          dbState,
          wsId,
          (req as any).authUser!.name,
          (req as any).authUser!.role,
          'Microsoft 365 disconnected and credentials removed',
          'Microsoft 365'
        );

        await persistStateCallback(wsId);
        res.json({ success: true, message: 'Disconnected Microsoft 365 successfully.' });
      } else {
        res.json({ success: false, message: 'No active Microsoft 365 connection found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Disconnect Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/microsoft/webhooks
   * Microsoft Graph subscription push change-notifications callback receiver.
   */
  router.post('/webhooks', async (req, res) => {
    const { validationToken } = req.query;
    
    // Microsoft Graph subscription verification check
    if (validationToken) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(String(validationToken));
    }

    try {
      // Validate incoming webhook signature or clientState check
      const clientState = req.body?.value?.[0]?.clientState;
      if (clientState !== process.env.INTEGRATION_WEBHOOK_SECRET) {
        console.warn('[Microsoft Webhooks] Invalid webhook clientState received.');
        // Still return 202 to avoid Graph retrying bad requests
        return res.status(202).send('Accepted but ignored: invalid clientState token');
      }

      // Log webhook receipt audit
      logIntegrationAudit(
        dbState,
        'nest-realty-demo',
        'System Webhook Gateway',
        'System',
        `Microsoft Graph webhook notification received and processed`,
        'Microsoft 365'
      );

      // Perform a background sync to update signals based on webhook notification trigger
      syncMicrosoft365('nest-realty-demo', dbState, () => persistStateCallback('nest-realty-demo')).catch((err) => {
        console.error('[Microsoft Webhooks] Background sync failed:', err.message);
      });

      res.status(202).send('Notification received successfully');
    } catch (err: any) {
      console.error('[Microsoft Webhooks] Failed to process webhook notification:', err.message);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
