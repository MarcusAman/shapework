/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getGoogleConfig } from './googleConfig.js';
import { generateGoogleOAuthState, validateGoogleOAuthState, exchangeGoogleCode, getGoogleAccessToken, getOAuthClient, googleActiveStates, verifyGoogleConnection } from './googleOAuth.js';
import { syncGoogleWorkspace } from './googleSync.js';
import { sendGmailEmail } from './gmailClient.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';

export function getGoogleRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  /**
   * GET /api/integrations/google/connect
   * Generates authorization URL for Google Workspace.
   */
  router.get('/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;

    try {
      const stateToken = generateGoogleOAuthState(wsId, userId);
      const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
      const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.GOOGLE_CLIENT_ID);
      if (isMock) {
        const mockCode = 'mock_google_oauth_code_123';
        const mockUrl = `${req.protocol}://${req.get('host')}/api/integrations/google/callback?code=${mockCode}&state=${stateToken}`;
        return res.json({ url: mockUrl });
      }

      const config = getGoogleConfig();
      const oauth2Client = getOAuthClient();

      const scopes = [
        ...config.scopesProfile.split(' '),
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/calendar.freebusy',
        'https://www.googleapis.com/auth/gmail.send'
      ];

      if (req.query.monitoring === 'true') {
        scopes.push('https://www.googleapis.com/auth/gmail.metadata');
      }

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state: stateToken
      });

      logIntegrationAudit(
        dbState,
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        'Google Workspace OAuth flow initiated',
        'Google Workspace'
      );

      res.json({ url: authUrl });
    } catch (err: any) {
      console.error('[Google Connect] Failed to generate OAuth URI:', err.message);
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * GET /api/integrations/google/callback
   * OAuth redirect callback endpoint.
   */
  router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const codeStr = String(code || '');
    const stateStr = String(state || '');

    const stateData = googleActiveStates.get(stateStr);
    const expectedWsId = stateData?.workspaceId || 'nest-realty-demo';
    const expectedUserId = stateData?.userId || 'usr_owner';

    if (!stateStr || !validateGoogleOAuthState(stateStr, expectedWsId, expectedUserId)) {
      console.error('[Google Callback] State validation failed.');
      return res.status(400).send('OAuth state validation mismatch. Re-authorize Google connection.');
    }

    try {
      const result = await exchangeGoogleCode(codeStr);

      const store = new IntegrationStateStore(dbState);
      await store.upsertConnection({
        id: `conn_google_${expectedWsId}`,
        workspaceId: expectedWsId,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: expectedUserId,
        connectedAt: new Date().toISOString(),
        providerAccountId: result.providerAccountId,
        providerAccountEmail: result.email,
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
        `Google Workspace connected by user ${expectedUserId} (${result.email})`,
        'Google Workspace'
      );

      await persistStateCallback(expectedWsId);

      // Redirect to integrations page with connection params
      res.redirect('/app/integrations?integration=google_workspace&connected=true');
    } catch (err: any) {
      console.error('[Google Callback] Token exchange failed:', err.message);
      res.status(500).send(`Failed to exchange Google OAuth authorization token: ${err.message}`);
    }
  });

  /**
   * GET /api/integrations/google/status
   * Returns Google integration connection status.
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);

    try {
      const conn = await store.getConnection(wsId, 'google_workspace');
      if (!conn) {
        const hasEnv = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
        return res.json({ connected: false, status: hasEnv ? 'available_to_connect' : 'missing_env' });
      }

      // Perform a live verification check!
      const verification = await verifyGoogleConnection(conn, dbState, () => persistStateCallback(wsId));
      
      if (verification.verified) {
        conn.status = 'connected';
        delete conn.lastError;
        await persistStateCallback(wsId);

        res.json({
          connected: true,
          status: 'connected',
          providerAccountEmail: verification.email || conn.providerAccountEmail,
          scopes: conn.scopes,
          lastSyncedAt: conn.lastSyncedAt
        });
      } else {
        conn.status = 'expired';
        conn.lastError = verification.error;
        await persistStateCallback(wsId);

        res.json({
          connected: false,
          status: 'expired',
          lastError: verification.error,
          providerAccountEmail: conn.providerAccountEmail,
          scopes: conn.scopes
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/sync
   * Triggers manual synchronization.
   */
  router.post('/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, csrfProtection, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    try {
      await syncGoogleWorkspace(wsId, dbState, () => persistStateCallback(wsId));
      res.json({ success: true, message: 'Google Workspace synced successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Sync Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/disconnect
   * Disconnects Google Workspace integration.
   */
  router.post('/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);

    try {
      const deleted = await store.deleteConnection(wsId, 'google_workspace');
      if (deleted) {
        // Also clear out Google Workspace calendar signals
        if (dbState.workspaceCommunicationSignals) {
          dbState.workspaceCommunicationSignals = dbState.workspaceCommunicationSignals.filter(
            (s: any) => !(s.workspaceId === wsId && s.provider.startsWith('google_'))
          );
        }

        // Also clean up Google sync Work Queue items
        const syncErrorKey = 'integration:google_workspace:sync_error';
        if (dbState.workItems) {
          dbState.workItems = dbState.workItems.filter((wi: any) => wi.relatedId !== syncErrorKey);
        }

        logIntegrationAudit(
          dbState,
          wsId,
          (req as any).authUser!.name,
          (req as any).authUser!.role,
          'Google Workspace disconnected and credentials removed',
          'Google Workspace'
        );

        await persistStateCallback(wsId);
        res.json({ success: true, message: 'Disconnected Google Workspace successfully.' });
      } else {
        res.json({ success: false, message: 'No active Google connection found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Disconnect Error', message: err.message });
    }
  });

  return router;
}
