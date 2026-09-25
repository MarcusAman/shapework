/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { getBasecampConfig } from './basecampConfig.js';
import { generateOAuthState, validateOAuthState, exchangeCode, getOAuthIdentity, basecampActiveStates } from './basecampOAuth.js';
import { runBasecampSync } from './basecampSync.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { BasecampConnection } from './basecampTypes.js';

export function getBasecampRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  // Helper to log audit events
  function logAuditEvent(workspaceId: string, user: string, role: string, desc: string, category: string, impact = 'General') {
    const newAudit = {
      id: `audit_bc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
   * GET /api/integrations/basecamp/connect
   * Initiates Basecamp OAuth flow.
   */
  router.get('/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;

    try {
      const stateToken = generateOAuthState(wsId, userId);
      const config = getBasecampConfig();

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state: stateToken
      });

      const authUrl = `https://launchpad.37signals.com/authorization/new?${params.toString()}`;

      logAuditEvent(
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        'Basecamp connection OAuth flow started',
        'Integrations',
        'Basecamp'
      );

      res.json({ url: authUrl });
    } catch (err: any) {
      console.error('[Basecamp OAuth Connect] Failed to generate URI:', err.message);
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * GET /api/integrations/basecamp/callback
   * OAuth redirect callback endpoint.
   */
  router.get('/callback', requireAuth, async (req, res) => {
    const { code, state } = req.query;
    const stateStr = String(state || '');
    const codeStr = String(code || '');
    const sessionUserId = (req as any).authUser?.id;
    const stateData = basecampActiveStates.get(stateStr);

    if (!stateData || !sessionUserId || sessionUserId !== stateData.userId) {
      console.error('[Basecamp OAuth Callback] CSRF state validation failed.');
      return res.status(400).send('OAuth CSRF state validation mismatch. Re-authorize Basecamp connection.');
    }

    if (!validateOAuthState(stateStr, stateData.workspaceId, stateData.userId)) {
      console.error('[Basecamp OAuth Callback] CSRF state validation failed.');
      return res.status(400).send('OAuth CSRF state validation mismatch. Re-authorize Basecamp connection.');
    }

    const expectedWsId = stateData.workspaceId;
    const expectedUserId = stateData.userId;

    try {
      // Exchange code for tokens
      const tokenPayload = await exchangeCode(codeStr);

      // Decrypt token momentarily to query identity/accounts
      const { credentialVault } = await import('../../security/vault.js');
      const tempAccessToken = await credentialVault.decrypt<string>(tokenPayload.encryptedAccessToken);
      
      const identityData = await getOAuthIdentity(tempAccessToken);
      
      if (!identityData.accounts || identityData.accounts.length === 0) {
        throw new Error('No active Basecamp accounts found for this identity profile.');
      }

      // Automatically select the first Basecamp account (bc3 or otherwise)
      const selectedAccount = identityData.accounts.find(a => a.product === 'bc3') || identityData.accounts[0];
      const accountId = String(selectedAccount.id);
      const accountName = selectedAccount.name;

      // Save connection details
      if (!dbState.basecampConnections) dbState.basecampConnections = [];
      const existingIdx = dbState.basecampConnections.findIndex(
        (c: any) => c.workspaceId === expectedWsId
      );

      const connData: BasecampConnection = {
        id: `bc_${expectedWsId}`,
        workspaceId: expectedWsId,
        accountId,
        accountName,
        status: 'connected',
        encryptedAccessToken: tokenPayload.encryptedAccessToken,
        encryptedRefreshToken: tokenPayload.encryptedRefreshToken,
        accessTokenExpiresAt: tokenPayload.accessTokenExpiresAt,
        connectedByUserId: expectedUserId,
        connectedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        dbState.basecampConnections[existingIdx] = connData;
      } else {
        dbState.basecampConnections.push(connData);
      }

      // Update registry connection status in dbState
      if (!dbState.integrations) dbState.integrations = [];
      const bcConnector = dbState.integrations.find((i: any) => i.id === 'i_bc');
      if (bcConnector) {
        bcConnector.connected = true;
        bcConnector.last_sync = new Date().toISOString();
        bcConnector.errors_count = 0;
        bcConnector.recentErrors = [];
      }

      logAuditEvent(
        expectedWsId,
        'System Administrator',
        'Administrator',
        `Basecamp connected successfully (Account ID: ${accountId}, Name: ${accountName})`,
        'Integrations',
        'Basecamp'
      );

      await persistStateCallback(expectedWsId);

      // Redirect back to integrations page
      res.redirect('/app/integrations?integration=basecamp&connected=true');
    } catch (err: any) {
      console.error('[Basecamp OAuth Callback] Connection failed:', err.message);
      res.status(500).send(`Basecamp OAuth Callback Failed: ${err.message}`);
    }
  });

  /**
   * GET /api/integrations/basecamp/status
   * Fetch current connection details.
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    const wsId = (req as any).workspaceId || 'nest-realty-demo';

    if (!dbState.basecampConnections) dbState.basecampConnections = [];
    const connection = dbState.basecampConnections.find((c: any) => c.workspaceId === wsId);

    if (!connection) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      accountId: connection.accountId,
      accountName: connection.accountName,
      status: connection.status,
      lastSyncedAt: connection.lastSyncedAt,
      lastError: connection.lastError
    });
  });

  /**
   * POST /api/integrations/basecamp/sync
   * Triggers manual synchronization.
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

      if (!dbState.basecampConnections) dbState.basecampConnections = [];
      const connection = dbState.basecampConnections.find((c: any) => c.workspaceId === wsId);

      if (!connection) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No active Basecamp connection exists for this workspace.'
        });
      }

      try {
        const summary = await runBasecampSync(connection, dbState, async () => {
          await persistStateCallback(wsId);
        });

        // Update last sync on registry card
        if (!dbState.integrations) dbState.integrations = [];
        const bcConnector = dbState.integrations.find((i: any) => i.id === 'i_bc');
        if (bcConnector) {
          bcConnector.last_sync = new Date().toISOString();
          bcConnector.records_synchronized = (bcConnector.records_synchronized || 0) + summary.projectsChecked + summary.todosChecked;
        }

        await persistStateCallback(wsId);
        res.json({ success: true, summary });
      } catch (err: any) {
        console.error('[Basecamp Routes Sync] Failed:', err.message);

        // Update registry errors
        if (!dbState.integrations) dbState.integrations = [];
        const bcConnector = dbState.integrations.find((i: any) => i.id === 'i_bc');
        if (bcConnector) {
          bcConnector.errors_count = (bcConnector.errors_count || 0) + 1;
          if (!bcConnector.recentErrors) bcConnector.recentErrors = [];
          bcConnector.recentErrors.unshift(err.message);
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
   * POST /api/integrations/basecamp/disconnect
   * Disconnects Basecamp connection.
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

      if (!dbState.basecampConnections) dbState.basecampConnections = [];
      const connectionIdx = dbState.basecampConnections.findIndex((c: any) => c.workspaceId === wsId);

      if (connectionIdx < 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No Basecamp connection found.'
        });
      }

      const connection = dbState.basecampConnections[connectionIdx];

      // Remove connection
      dbState.basecampConnections.splice(connectionIdx, 1);

      // Update registry connection status
      if (!dbState.integrations) dbState.integrations = [];
      const bcConnector = dbState.integrations.find((i: any) => i.id === 'i_bc');
      if (bcConnector) {
        bcConnector.connected = false;
        bcConnector.errors_count = 0;
        bcConnector.recentErrors = [];
      }

      // Purge Basecamp signals
      if (dbState.basecampSignals) {
        dbState.basecampSignals = dbState.basecampSignals.filter(
          (s: any) => s.workspaceId !== wsId
        );
      }

      logAuditEvent(
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        `Basecamp account disconnected (Account ID: ${connection.accountId})`,
        'Integrations',
        'Basecamp'
      );

      await persistStateCallback(wsId);
      res.json({ success: true });
    }
  );

  return router;
}
