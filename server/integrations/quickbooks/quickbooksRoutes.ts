/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getQuickBooksConfig } from './quickbooksConfig.js';
import { generateOAuthState, validateOAuthState, exchangeCode, createOAuthClient, activeStates } from './quickbooksOAuth.js';
import { runQuickBooksSync } from './quickbooksSync.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { QuickBooksConnection } from './quickbooksTypes.js';

export function getQuickBooksRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  // Helper to log audit events into dbState
  function logAuditEvent(workspaceId: string, user: string, role: string, desc: string, category: string, impact = 'General') {
    const newAudit = {
      id: `audit_qb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: user,
      user_role: role,
      action_description: desc,
      impact_area: category,
      impact_property: impact,
      rollback_available: false
    };
    if (!dbState.auditEvents) dbState.auditEvents = [];
    dbState.auditEvents = [newAudit, ...dbState.auditEvents];
    return newAudit;
  }

  /**
   * GET /api/integrations/quickbooks/connect
   * Start QuickBooks OAuth 2.0 flow. Generates state and redirects user.
   */
  router.get('/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;

    try {
      const stateToken = generateOAuthState(wsId, userId);
      const oauthClient = createOAuthClient();
      
      // Request only the QuickBooks Online Accounting scope
      const authUrl = oauthClient.authorizeUri({
        scope: ['com.intuit.quickbooks.accounting'],
        state: stateToken
      });

      logAuditEvent(
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        'QuickBooks Online connection OAuth flow started',
        'Integrations',
        'QuickBooks'
      );

      res.json({ url: authUrl });
    } catch (err: any) {
      console.error('[QuickBooks OAuth Connect] Failed to generate URI:', err.message);
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * GET /api/integrations/quickbooks/callback
   * OAuth 2.0 redirect callback endpoint. Receives code, state, and realmId.
   */
  router.get('/callback', requireAuth, async (req, res) => {
    const { code, state, realmId } = req.query;
    const stateStr = String(state || '');
    const codeStr = String(code || '');
    const realmIdStr = String(realmId || '');
    const sessionUserId = (req as any).authUser?.id;
    const stateData = activeStates.get(stateStr);

    if (!stateData || !sessionUserId || sessionUserId !== stateData.userId) {
      console.error('[QuickBooks OAuth Callback] CSRF state validation failed.');
      return res.status(400).send('OAuth CSRF state validation mismatch. Re-authorize QuickBooks connection.');
    }

    if (!validateOAuthState(stateStr, stateData.workspaceId, stateData.userId)) {
      console.error('[QuickBooks OAuth Callback] CSRF state validation failed.');
      return res.status(400).send('OAuth CSRF state validation mismatch. Re-authorize QuickBooks connection.');
    }

    const expectedWsId = stateData.workspaceId;
    const expectedUserId = stateData.userId;

    try {
      // Construct full callback URL to pass to intuit-oauth SDK
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const fullUrl = `${protocol}://${req.headers.host}${req.originalUrl}`;

      const tokenPayload = await exchangeCode(codeStr, fullUrl);

      // Save connection
      if (!dbState.quickbooksConnections) dbState.quickbooksConnections = [];
      
      const existingIdx = dbState.quickbooksConnections.findIndex(
        (c: any) => c.workspaceId === expectedWsId
      );

      const connData: QuickBooksConnection = {
        id: `qb_${expectedWsId}`,
        workspaceId: expectedWsId,
        realmId: realmIdStr,
        environment: getQuickBooksConfig().environment,
        status: 'connected',
        encryptedAccessToken: tokenPayload.encryptedAccessToken,
        encryptedRefreshToken: tokenPayload.encryptedRefreshToken,
        accessTokenExpiresAt: tokenPayload.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokenPayload.refreshTokenExpiresAt,
        connectedByUserId: expectedUserId,
        connectedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        dbState.quickbooksConnections[existingIdx] = connData;
      } else {
        dbState.quickbooksConnections.push(connData);
      }

      // Update registry connection status in dbState
      if (!dbState.integrations) dbState.integrations = [];
      const qboConnector = dbState.integrations.find((i: any) => i.id === 'i_qbo');
      if (qboConnector) {
        qboConnector.connected = true;
        qboConnector.last_sync = new Date().toISOString();
        qboConnector.errors_count = 0;
        qboConnector.recentErrors = [];
      }

      logAuditEvent(
        expectedWsId,
        'System Administrator',
        'Administrator',
        `QuickBooks Online connected successfully (Realm ID: ${realmIdStr})`,
        'Integrations',
        'QuickBooks'
      );

      await persistStateCallback(expectedWsId);

      // Redirect back to integrations page as specified by AC
      res.redirect('/app/integrations?integration=quickbooks&connected=true');
    } catch (err: any) {
      console.error('[QuickBooks OAuth Callback] Code exchange failed:', err.message);
      res.status(500).send(`QuickBooks OAuth Token Exchange Failed: ${err.message}`);
    }
  });

  /**
   * GET /api/integrations/quickbooks/status
   * Fetch current QuickBooks connection status, configuration, and synced metadata.
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    const wsId = (req as any).workspaceId || 'nest-realty-demo';
    
    if (!dbState.quickbooksConnections) dbState.quickbooksConnections = [];
    const connection = dbState.quickbooksConnections.find((c: any) => c.workspaceId === wsId);

    if (!connection) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      realmId: connection.realmId,
      environment: connection.environment,
      status: connection.status,
      lastSyncedAt: connection.lastSyncedAt,
      lastError: connection.lastError,
      plSummary: (connection as any).plSummary || null
    });
  });

  /**
   * POST /api/integrations/quickbooks/sync
   * Trigger QuickBooks read-only synchronization.
   */
  router.post(
    '/sync',
    csrfProtection,
    requireAuth,
    resolveWorkspaceContext,
    requireWorkspaceMembership,
    requirePermission('manage_integrations'),
    async (req, res) => {
      const wsId = (req as any).workspaceId || 'nest-realty-demo';

      if (!dbState.quickbooksConnections) dbState.quickbooksConnections = [];
      const connection = dbState.quickbooksConnections.find((c: any) => c.workspaceId === wsId);

      if (!connection) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No active QuickBooks connection exists for this workspace.'
        });
      }

      try {
        const summary = await runQuickBooksSync(connection, dbState, async () => {
          await persistStateCallback(wsId);
        });

        // Update last sync on registry card
        if (!dbState.integrations) dbState.integrations = [];
        const qboConnector = dbState.integrations.find((i: any) => i.id === 'i_qbo');
        if (qboConnector) {
          qboConnector.last_sync = new Date().toISOString();
          qboConnector.records_synchronized = (qboConnector.records_synchronized || 0) + summary.invoicesChecked + summary.paymentsChecked + summary.depositsChecked;
        }

        await persistStateCallback(wsId);
        res.json({ success: true, summary });
      } catch (err: any) {
        console.error('[QuickBooks Routes Sync] Failed:', err.message);
        
        // Update registry errors
        if (!dbState.integrations) dbState.integrations = [];
        const qboConnector = dbState.integrations.find((i: any) => i.id === 'i_qbo');
        if (qboConnector) {
          qboConnector.errors_count = (qboConnector.errors_count || 0) + 1;
          if (!qboConnector.recentErrors) qboConnector.recentErrors = [];
          qboConnector.recentErrors.unshift(err.message);
        }
        await persistStateCallback(wsId);

        res.status(500).json({
          error: 'Sync Failed',
          message: err.message
        });
      }
    }
  );

  /**
   * POST /api/integrations/quickbooks/disconnect
   * Disconnect and clear QuickBooks tokens.
   */
  router.post(
    '/disconnect',
    csrfProtection,
    requireAuth,
    resolveWorkspaceContext,
    requireWorkspaceMembership,
    requirePermission('manage_integrations'),
    async (req, res) => {
      const wsId = (req as any).workspaceId || 'nest-realty-demo';

      if (!dbState.quickbooksConnections) dbState.quickbooksConnections = [];
      const connectionIdx = dbState.quickbooksConnections.findIndex((c: any) => c.workspaceId === wsId);

      if (connectionIdx < 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No QuickBooks connection found.'
        });
      }

      const connection = dbState.quickbooksConnections[connectionIdx];

      // Remove from connections list
      dbState.quickbooksConnections.splice(connectionIdx, 1);

      // Update registry connection status in dbState
      if (!dbState.integrations) dbState.integrations = [];
      const qboConnector = dbState.integrations.find((i: any) => i.id === 'i_qbo');
      if (qboConnector) {
        qboConnector.connected = false;
        qboConnector.errors_count = 0;
        qboConnector.recentErrors = [];
      }

      // Purge finance signals sourced from QuickBooks for this workspace
      if (dbState.financeSignals) {
        dbState.financeSignals = dbState.financeSignals.filter(
          (s: any) => !(s.workspaceId === wsId && s.sourceSystem === 'quickbooks')
        );
      }

      logAuditEvent(
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        `QuickBooks Online account disconnected (Realm ID: ${connection.realmId})`,
        'Integrations',
        'QuickBooks'
      );

      await persistStateCallback(wsId);
      res.json({ success: true });
    }
  );

  return router;
}
