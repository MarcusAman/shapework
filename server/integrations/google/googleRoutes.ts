/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { getGoogleConfig } from './googleConfig.js';
import { 
  generateGoogleOAuthState, 
  validateGoogleOAuthState, 
  exchangeGoogleCode, 
  getOAuthClient, 
  googleActiveStates, 
  verifyGoogleConnection,
  GOOGLE_WORKSPACE_SCOPES
} from './googleOAuth.js';
import { syncGoogleWorkspace } from './googleSync.js';
import { syncGmailIntake, syncGoogleDriveSops, inspectGmailAccount } from './googleIntake.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, AuthenticatedRequest } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';
import { decryptToken } from '../shared/integrationCredentialVault.js';

export function getGoogleRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  /**
   * GET /api/integrations/google/connect (or /api/oauth/google/start)
   * Generates authorization URL for Google Workspace.
   */
  router.get(['/connect', '/start'], requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
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

      const oauth2Client = getOAuthClient();
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: GOOGLE_WORKSPACE_SCOPES,
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
   * GET /api/integrations/google/callback (or /api/oauth/google/callback)
   * OAuth redirect callback endpoint.
   */
  router.get('/callback', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { code, state, error, error_description } = req.query;
    const codeStr = String(code || '');
    const stateStr = String(state || '');
    
    const appOrigin = process.env.PUBLIC_APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    // Helper to send popup completion message and close
    const sendCompletionPage = (status: 'success' | 'error', errorMsg?: string) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Authentication</title>
          <script>
            window.opener?.postMessage({
              type: 'SHAPEWORK_GOOGLE_OAUTH_COMPLETE',
              provider: 'google',
              status: '${status}',
              error: ${errorMsg ? JSON.stringify(errorMsg) : 'null'}
            }, ${JSON.stringify(appOrigin)});
            window.close();
          </script>
        </head>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>${status === 'success' ? 'Authentication Successful' : 'Authentication Failed'}</h2>
          <p>${status === 'success' ? 'You can close this window now.' : errorMsg || 'An unknown error occurred.'}</p>
        </body>
        </html>
      `);
    };

    if (error) {
      console.error(`[Google Callback] OAuth error: ${error} - ${error_description}`);
      return sendCompletionPage('error', String(error_description || error));
    }

    const stateData = googleActiveStates.get(stateStr);
    if (!stateData) {
      console.error('[Google Callback] State validation failed (not found or expired).');
      return sendCompletionPage('error', 'OAuth state validation mismatch. Re-authorize Google connection.');
    }

    // Verify session user matches OAuth initiator
    const sessionUserId = (req as any).authUser?.id;
    if (sessionUserId !== stateData.userId) {
      console.error('[Google Callback] User mismatch: session user !== state initiator');
      return sendCompletionPage('error', 'Session mismatch. The user completing authorization does not match the initiator.');
    }

    // Consume the state token to prevent reuse/replay attacks
    validateGoogleOAuthState(stateStr, stateData.workspaceId, stateData.userId);

    try {
      const result = await exchangeGoogleCode(codeStr);

      const store = new IntegrationStateStore(dbState);
      const conn = await store.upsertConnection({
        id: `conn_google_${stateData.workspaceId}`,
        workspaceId: stateData.workspaceId,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: stateData.userId,
        connectedAt: new Date().toISOString(),
        providerAccountId: result.providerAccountId,
        providerAccountEmail: result.email,
        scopes: result.scopes,
        encryptedAccessToken: result.encryptedAccessToken,
        encryptedRefreshToken: result.encryptedRefreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt
      });

      // Perform a real health verification check immediately to prove it works
      const verification = await verifyGoogleConnection(conn, dbState, () => persistStateCallback(stateData.workspaceId));
      if (!verification.verified) {
        conn.status = 'error';
        conn.lastError = verification.error || 'Live verification check failed after exchange.';
        await persistStateCallback(stateData.workspaceId);
        return sendCompletionPage('error', conn.lastError);
      }

      logIntegrationAudit(
        dbState,
        stateData.workspaceId,
        'System Callback',
        'System',
        `Google Workspace connected by user ${stateData.userId} (${result.email})`,
        'Google Workspace'
      );

      await persistStateCallback(stateData.workspaceId);
      sendCompletionPage('success');
    } catch (err: any) {
      console.error('[Google Callback] Token exchange failed:', err.message);
      sendCompletionPage('error', `Failed to exchange Google OAuth authorization token: ${err.message}`);
    }
  });

  /**
   * GET /api/integrations/google/status
   * Returns Google integration connection status.
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);

    try {
      const conn = await store.getConnection(wsId, 'google_workspace');
      if (!conn) {
        const hasEnv = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
        return res.json({ connected: false, status: hasEnv ? 'available_to_connect' : 'missing_env' });
      }

      const verification = await verifyGoogleConnection(conn, dbState, () => persistStateCallback(wsId));
      
      if (verification.verified) {
        conn.status = 'connected';
        delete conn.lastError;
        await persistStateCallback(wsId);

        // Perform live mailbox inspection
        let inspectionInfo = {
          mailboxType: 'primary',
          authenticatedEmail: conn.providerAccountEmail || 'AskNestOps@nestrealty.com',
          notes: 'Authenticated directly as the primary Ask Nest Ops inbox.'
        };

        try {
          const accToken = await decryptToken(conn.encryptedAccessToken);
          const inspectRes = await inspectGmailAccount(accToken);
          inspectionInfo = {
            mailboxType: inspectRes.mailboxType,
            authenticatedEmail: inspectRes.authenticatedEmail,
            notes: inspectRes.notes
          };
        } catch (insErr) {
          console.warn('[Status] Mailbox configuration inspection warning:', insErr);
        }

        res.json({
          connected: true,
          status: 'connected',
          providerAccountEmail: verification.email || conn.providerAccountEmail,
          scopes: conn.scopes,
          lastSyncedAt: conn.lastSyncedAt,
          capabilities: verification.capabilities,
          missingPermissions: verification.missingPermissions,
          mailboxInspection: inspectionInfo
        });
      } else {
        conn.status = 'error';
        conn.lastError = verification.error;
        await persistStateCallback(wsId);

        res.json({
          connected: false,
          status: 'error',
          lastError: verification.error,
          providerAccountEmail: conn.providerAccountEmail,
          scopes: conn.scopes,
          capabilities: verification.capabilities,
          missingPermissions: verification.missingPermissions
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/verify
   * Performs an explicit authenticated verify connection health check.
   */
  router.post('/verify', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || 'nest-realty-demo';
    const store = new IntegrationStateStore(dbState);

    try {
      const conn = await store.getConnection(wsId, 'google_workspace');
      if (!conn) {
        return res.status(404).json({ connected: false, error: 'No active Google connection found.' });
      }

      const verification = await verifyGoogleConnection(conn, dbState, () => persistStateCallback(wsId));
      
      res.json({
        connected: verification.verified,
        providerEmail: verification.email || conn.providerAccountEmail || '',
        capabilities: verification.capabilities,
        grantedScopes: conn.scopes,
        lastVerifiedAt: new Date().toISOString(),
        error: verification.error
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Verification failed', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/sync
   * Triggers manual synchronization.
   */
  router.post('/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    try {
      // 1. Sync Calendar & baseline
      await syncGoogleWorkspace(wsId, dbState, () => persistStateCallback(wsId));
      // 2. Sync Gmail Intake
      const intakeRes = await syncGmailIntake(wsId, dbState, () => persistStateCallback(wsId));
      
      res.json({ 
        success: true, 
        message: 'Google Workspace synced successfully.',
        gmailProcessed: intakeRes.processed,
        gmailErrors: intakeRes.errors
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Sync Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/intake
   * Explicitly triggers Gmail intake.
   */
  router.post('/intake', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || 'nest-realty-demo';
    try {
      const result = await syncGmailIntake(wsId, dbState, () => persistStateCallback(wsId));
      res.json({ success: true, message: `Processed ${result.processed} new messages.`, result });
    } catch (err: any) {
      res.status(500).json({ error: 'Intake Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/drive/index
   * Indexes SOP documents from Google Drive.
   */
  router.post('/drive/index', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || 'nest-realty-demo';
    const { folderName } = req.body;
    try {
      const result = await syncGoogleDriveSops(wsId, folderName || 'SOPs & Guidelines', dbState, () => persistStateCallback(wsId));
      res.json({ success: true, message: `Indexed ${result.indexed} SOP files successfully.`, result });
    } catch (err: any) {
      res.status(500).json({ error: 'Drive Indexing Error', message: err.message });
    }
  });

  /**
   * POST /api/integrations/google/disconnect
   * Disconnects Google Workspace integration.
   */
  router.post('/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const store = new IntegrationStateStore(dbState);

    try {
      const conn = await store.getConnection(wsId, 'google_workspace');
      if (conn) {
        // Attempt Google token revocation if configured
        try {
          const oauth2Client = getOAuthClient();
          if (conn.encryptedAccessToken) {
            const accToken = await decryptToken(conn.encryptedAccessToken);
            await oauth2Client.revokeToken(accToken);
          }
          if (conn.encryptedRefreshToken) {
            const refToken = await decryptToken(conn.encryptedRefreshToken);
            await oauth2Client.revokeToken(refToken);
          }
        } catch (revErr: any) {
          console.warn('[Google Disconnect] Token revocation failed (expected if token was already revoked/expired):', revErr.message);
        }

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
      } else {
        res.json({ success: false, message: 'No active Google connection found.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Disconnect Error', message: err.message });
    }
  });

  return router;
}
