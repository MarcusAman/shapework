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
  GOOGLE_WORKSPACE_SCOPES,
  GOOGLE_CALENDAR_SCOPES
} from './googleOAuth.js';
import { syncGoogleWorkspace } from './googleSync.js';
import { syncGmailIntake, syncGoogleDriveSops, inspectGmailAccount } from './googleIntake.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, AuthenticatedRequest } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';
import { decryptToken } from '../shared/integrationCredentialVault.js';
import { GoogleCalendarDiagnosticService } from '../../services/googleCalendarDiagnosticService.js';
import { CalendarRepository } from '../../persistence/calendarRepository.js';

/**
 * OAuth redirect for Google Workspace. Used by both
 * GET /api/integrations/google/callback and GET /api/auth/google/callback
 * (the redirect URI registered with Google).
 */
export function handleGoogleOAuthCallback(
  dbState: any,
  persistStateCallback: (wsId?: string) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: Response) => {
    const { code, state, error, error_description } = req.query;
    const codeStr = String(code || '').trim();
    const stateStr = String(state || '');

    const appOrigin = process.env.PUBLIC_APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const sendCompletionPage = (status: 'success' | 'error', errorMsg?: string) => {
      const safeError = errorMsg ? escapeHtml(errorMsg) : '';
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
      res.status(status === 'success' ? 200 : 400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Authentication</title>
          <script>
            window.opener?.postMessage({
              type: 'SHAPEWORK_GOOGLE_OAUTH_COMPLETE',
              provider: 'google',
              status: '${status}',
              error: ${safeError ? JSON.stringify(safeError) : 'null'}
            }, ${JSON.stringify(appOrigin)});
            window.close();
          </script>
        </head>
        <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>${status === 'success' ? 'Authentication Successful' : 'Authentication Failed'}</h2>
          <p>${status === 'success' ? 'You can close this window now.' : safeError || 'An unknown error occurred.'}</p>
        </body>
        </html>
      `);
    };

    if (error) {
      console.error(`[Google Callback] OAuth error: ${error} - ${error_description}`);
      return sendCompletionPage('error', String(error_description || error));
    }

    if (!codeStr) {
      return sendCompletionPage('error', 'Missing authorization code.');
    }

    const stateData = googleActiveStates.get(stateStr);
    if (!stateData) {
      console.error('[Google Callback] State validation failed (not found or expired).');
      return sendCompletionPage('error', 'OAuth state validation mismatch. Re-authorize Google connection.');
    }

    const sessionUserId = (req as any).authUser?.id;
    if (sessionUserId !== stateData.userId) {
      console.error('[Google Callback] User mismatch: session user !== state initiator');
      return sendCompletionPage('error', 'Session mismatch. The user completing authorization does not match the initiator.');
    }

    if (!validateGoogleOAuthState(stateStr, stateData.workspaceId, stateData.userId)) {
      return sendCompletionPage('error', 'OAuth state validation mismatch. Re-authorize Google connection.');
    }

    try {
      const result = await exchangeGoogleCode(codeStr, req);

      const store = new IntegrationStateStore(dbState);
      const existingConn = await store.getConnection(stateData.workspaceId, 'google_workspace');
      const preservedRefreshToken = result.encryptedRefreshToken || existingConn?.encryptedRefreshToken;
      const candidate = {
        id: `conn_google_${stateData.workspaceId}`,
        workspaceId: stateData.workspaceId,
        provider: 'google_workspace' as const,
        status: 'connected' as const,
        connectedByUserId: stateData.userId,
        connectedAt: new Date().toISOString(),
        providerAccountId: result.providerAccountId,
        providerAccountEmail: result.email,
        scopes: result.scopes,
        encryptedAccessToken: result.encryptedAccessToken,
        encryptedRefreshToken: preservedRefreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt
      };

      const verification = await verifyGoogleConnection(candidate, dbState, async () => {});
      if (!verification.verified) {
        return sendCompletionPage('error', verification.error || 'Live verification check failed after exchange.');
      }

      await store.upsertConnection(candidate);

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
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const GOOGLE_OAUTH_CALLBACK_PATHS = new Set([
  '/callback',
  '/api/integrations/google/callback',
  '/api/oauth/google/callback',
  '/api/auth/google/callback',
]);

function withoutQueryOrTrailingSlash(value: string): string {
  const bare = value.split('?')[0];
  return bare.length > 1 && bare.endsWith('/') ? bare.slice(0, -1) : bare;
}

function isGoogleOAuthCallback(req: { path?: string; originalUrl?: string }): boolean {
  const path = withoutQueryOrTrailingSlash(req.path || '');
  const original = withoutQueryOrTrailingSlash(req.originalUrl || '');
  return GOOGLE_OAUTH_CALLBACK_PATHS.has(path) || GOOGLE_OAUTH_CALLBACK_PATHS.has(original);
}

export function getGoogleRouter(dbState: any, persistStateCallback: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  // Session plus manage_integrations for every route on this router.
  // The OAuth callback is the only exception; it keeps its state checks.
  router.use((req, res, next) => {
    if (isGoogleOAuthCallback(req)) return next();
    const authed = req as AuthenticatedRequest;
    requireAuth(authed, res, () => {
      void resolveWorkspaceContext(authed, res, () => {
        requireWorkspaceMembership(authed, res, () => {
          requirePermission('manage_integrations')(authed, res, () => {
            csrfProtection(req, res, next);
          });
        });
      });
    });
  });

  /**
   * GET /api/integrations/google/connect (or /api/oauth/google/start)
   * Generates authorization URL for Google Workspace / Calendar.
   */
  router.get(['/connect', '/start'], requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;

    try {
      const stateToken = generateGoogleOAuthState(wsId, userId);
      const config = getGoogleConfig();
      const hasRealCredentials = !!(config.clientId && config.clientSecret && !config.clientId.includes('placeholder') && !config.clientId.includes('mock'));
      
      if (!hasRealCredentials) {
        const mockCode = 'mock_google_oauth_code_123';
        const mockUrl = `${req.protocol}://${req.get('host')}/api/integrations/google/callback?code=${mockCode}&state=${stateToken}`;
        return res.json({ url: mockUrl });
      }

      const isCalendarOnly = req.query.scope === 'calendar' || req.query.profile === 'calendar';
      const targetScopes = isCalendarOnly ? GOOGLE_CALENDAR_SCOPES : GOOGLE_WORKSPACE_SCOPES;
      const loginHint = String(req.query.login_hint || 'AskNora@nestrealty.com');

      const oauth2Client = getOAuthClient(req);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: req.query.prompt === 'select_account' ? 'select_account' : 'consent',
        scope: targetScopes,
        login_hint: loginHint,
        state: stateToken
      });

      logIntegrationAudit(
        dbState,
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        `Google Workspace OAuth flow initiated (${isCalendarOnly ? 'Calendar Scopes' : 'Full Workspace Scopes'}) for ${loginHint}`,
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
   * OAuth redirect callback endpoint. /api/auth/google/callback uses this same handler.
   */
  router.get('/callback', requireAuth, handleGoogleOAuthCallback(dbState, persistStateCallback));

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
   * GET /api/integrations/google/calendar/diagnostics (or /readiness)
   * Evaluates administrative readiness, OAuth grants, and dedicated calendar selection.
   */
  router.get(['/calendar/diagnostics', '/calendar/readiness'], requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington');
    try {
      const report = await GoogleCalendarDiagnosticService.runDiagnostics(wsId, dbState);
      return res.json({ success: true, diagnostics: report });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/integrations/google/calendar/available-calendars
   * Lists available Google Calendars accessible to AskNora.
   */
  router.get('/calendar/available-calendars', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington');
    try {
      const result = await GoogleCalendarDiagnosticService.listAvailableCalendars(wsId, dbState);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/integrations/google/calendar/select-target
   * Persists selected calendar ID, name, role, and timezone.
   */
  router.post('/calendar/select-target', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.body.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington');
    const { selectedCalendarId, selectedCalendarName, accessRole, timezone, autoMeetEnabled, isDedicatedNoraCalendar } = req.body;

    if (!selectedCalendarId || !selectedCalendarName) {
      return res.status(400).json({ success: false, error: 'selectedCalendarId and selectedCalendarName are required.' });
    }

    try {
      const saved = await CalendarRepository.saveCalendarSettings({
        workspaceId: wsId,
        selectedCalendarId,
        selectedCalendarName,
        accessRole: accessRole || 'writer',
        timezone: timezone || 'America/New_York',
        autoMeetEnabled: autoMeetEnabled !== false,
        isDedicatedNoraCalendar: isDedicatedNoraCalendar !== false,
        lastVerifiedAt: new Date().toISOString()
      });

      // Run diagnostics to immediately verify write permissions on selected calendar
      const diagnostics = await GoogleCalendarDiagnosticService.runDiagnostics(wsId, dbState);

      logIntegrationAudit(
        dbState,
        wsId,
        (req as any).authUser!.name,
        (req as any).authUser!.role,
        `Selected dedicated Google Calendar "${selectedCalendarName}" (${selectedCalendarId}) for NORA operations`,
        'Google Calendar'
      );

      await persistStateCallback(wsId);

      return res.json({
        success: true,
        calendarSettings: saved,
        diagnostics
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/integrations/google/calendar/verify-live
   * Executes safe live verification (read-only diagnostic + optional self-deleting test event).
   */
  router.post('/calendar/verify-live', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req: AuthenticatedRequest, res: Response) => {
    const wsId = (req as any).workspace?.id || String(req.body.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington');
    const writeTestEnabled = Boolean(req.body.writeTestEnabled);

    try {
      const result = await GoogleCalendarDiagnosticService.executeLiveVerificationTest(wsId, writeTestEnabled, dbState);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
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

  /**
   * Google Workspace Hub Endpoints for AskNora@nestrealty.com
   */
  router.get('/hub/status', async (req, res) => {
    try {
      const { getGoogleWorkspaceHubStatus } = await import('./googleWorkspaceHubService.js');
      const status = await getGoogleWorkspaceHubStatus();
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ error: 'Hub Status Error', message: err.message });
    }
  });

  router.post('/hub/folders', async (req, res) => {
    try {
      const { linkDriveFolder } = await import('./googleWorkspaceHubService.js');
      const { name, driveFolderId, category, description, autoSync } = req.body;
      if (!name || !driveFolderId) {
        return res.status(400).json({ error: 'Bad Request', message: 'Folder name and driveFolderId are required.' });
      }
      const folder = await linkDriveFolder({ name, driveFolderId, category: category || 'nest_u', description: description || '', autoSync: autoSync !== false });
      res.json({ success: true, folder });
    } catch (err: any) {
      res.status(500).json({ error: 'Link Folder Error', message: err.message });
    }
  });

  router.post('/hub/sync-folder', async (req, res) => {
    try {
      const { syncDriveFolder } = await import('./googleWorkspaceHubService.js');
      const { folderId } = req.body;
      if (!folderId) {
        return res.status(400).json({ error: 'Bad Request', message: 'folderId is required.' });
      }
      const result = await syncDriveFolder(folderId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Sync Folder Error', message: err.message });
    }
  });

  router.post('/hub/process-email', async (req, res) => {
    try {
      const { processInboundGoogleEmail } = await import('./googleWorkspaceHubService.js');
      const host = req.get('host') || 'shapework.co';
      const protocol = req.protocol;
      const baseUrl = process.env.PUBLIC_APP_URL || (host.includes('shapework.co') ? 'https://shapework.co' : `${protocol}://${host}`);
      const result = await processInboundGoogleEmail(req.body, baseUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Inbound Email Processing Error', message: err.message });
    }
  });

  router.post('/hub/export-doc', async (req, res) => {
    try {
      const { exportToGoogleDocs } = await import('./googleWorkspaceHubService.js');
      const { title, content } = req.body;
      const result = await exportToGoogleDocs(title || 'Nest Marketing Manifest', content || '');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Export Doc Error', message: err.message });
    }
  });

  /**
   * Pillar 1: Dynamic Google Drive Folder Scaffolding
   */
  router.get('/drive/scaffolds', async (req, res) => {
    try {
      const { listScaffoldedListingFolders } = await import('./googleDriveScaffolding.js');
      const folders = listScaffoldedListingFolders();
      res.json({ success: true, folders });
    } catch (err: any) {
      res.status(500).json({ error: 'List Scaffolds Error', message: err.message });
    }
  });

  router.post('/drive/scaffold', async (req, res) => {
    try {
      const { scaffoldListingDriveFolder } = await import('./googleDriveScaffolding.js');
      const { propertyAddress, agentName, deliverables } = req.body;
      if (!propertyAddress) {
        return res.status(400).json({ error: 'Bad Request', message: 'propertyAddress is required.' });
      }
      const folder = await scaffoldListingDriveFolder({ propertyAddress, agentName, deliverables });
      res.json({ success: true, folder });
    } catch (err: any) {
      res.status(500).json({ error: 'Drive Scaffold Error', message: err.message });
    }
  });

  /**
   * Pillar 2: Google Calendar Master Ops Sync & Direct Invites
   */
  router.get('/calendar/events', async (req, res) => {
    try {
      const { listMasterCalendarEvents } = await import('./googleCalendarSyncService.js');
      const events = listMasterCalendarEvents();
      res.json({ success: true, events });
    } catch (err: any) {
      res.status(500).json({ error: 'List Calendar Events Error', message: err.message });
    }
  });

  router.post('/calendar/sync-event', async (req, res) => {
    try {
      const { syncEventToGoogleCalendar } = await import('./googleCalendarSyncService.js');
      const { title, description, location, startTime, endTime, eventType, attendees, propertyAddress, sourceTaskId } = req.body;
      if (!title || !location || !startTime || !endTime) {
        return res.status(400).json({ error: 'Bad Request', message: 'Title, location, startTime, and endTime are required.' });
      }
      const result = await syncEventToGoogleCalendar({
        title,
        description: description || '',
        location,
        startTime,
        endTime,
        eventType: eventType || 'general',
        attendees: attendees || [{ email: 'asknora@nestrealty.com', name: 'Nora' }],
        propertyAddress,
        sourceTaskId
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Sync Calendar Event Error', message: err.message });
    }
  });

  /**
   * Pillar 3: Two-Way Google Sheets Pipeline Sync
   */
  router.get('/sheets/metadata', async (req, res) => {
    try {
      const { getMasterSheetMetadata } = await import('./googleSheetsSyncService.js');
      const metadata = getMasterSheetMetadata();
      res.json({ success: true, ...metadata });
    } catch (err: any) {
      res.status(500).json({ error: 'Sheet Metadata Error', message: err.message });
    }
  });

  router.post('/sheets/export', async (req, res) => {
    try {
      const { syncAppToGoogleSheets } = await import('./googleSheetsSyncService.js');
      const { pipelineTasks, vendorOrders } = req.body;
      const sheetState = await syncAppToGoogleSheets({ pipelineTasks, vendorOrders });
      res.json({ success: true, sheetState, message: '✓ Live app state synchronized to Master Google Sheet.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Sheet Export Error', message: err.message });
    }
  });

  router.post('/sheets/pull', async (req, res) => {
    try {
      const { syncGoogleSheetsToApp } = await import('./googleSheetsSyncService.js');
      const { pipelineTasks, vendorOrders } = req.body;
      const result = await syncGoogleSheetsToApp({ pipelineTasks, vendorOrders });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Sheet Pull Error', message: err.message });
    }
  });

  /**
   * Pillar 4: Gmail Vendor Thread Intelligence & Auto-Drafting
   */
  router.get('/gmail/drafts', async (req, res) => {
    try {
      const { listGmailDrafts } = await import('./googleGmailVendorIntelligence.js');
      const drafts = listGmailDrafts();
      res.json({ success: true, drafts });
    } catch (err: any) {
      res.status(500).json({ error: 'List Gmail Drafts Error', message: err.message });
    }
  });

  router.post('/gmail/create-draft', async (req, res) => {
    try {
      const { createGmailDraft } = await import('./googleGmailVendorIntelligence.js');
      const { toEmail, toName, subject, bodyText, category, relatedPropertyAddress, relatedTaskId } = req.body;
      if (!toEmail || !subject || !bodyText) {
        return res.status(400).json({ error: 'Bad Request', message: 'toEmail, subject, and bodyText are required.' });
      }
      const draft = await createGmailDraft({ toEmail, toName: toName || toEmail, subject, bodyText, category, relatedPropertyAddress, relatedTaskId });
      res.json({ success: true, draft });
    } catch (err: any) {
      res.status(500).json({ error: 'Create Draft Error', message: err.message });
    }
  });

  router.post('/gmail/send-draft', async (req, res) => {
    try {
      const { dispatchGmailDraft } = await import('./googleGmailVendorIntelligence.js');
      const { draftId, approvedBy } = req.body;
      if (!draftId) {
        return res.status(400).json({ error: 'Bad Request', message: 'draftId is required.' });
      }
      const result = await dispatchGmailDraft(draftId, approvedBy || 'Melissa Gagliardi (BIC)');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Send Draft Error', message: err.message });
    }
  });

  router.post('/gmail/parse-vendor-reply', async (req, res) => {
    try {
      const { processVendorEmailReply } = await import('./googleGmailVendorIntelligence.js');
      const { fromEmail, fromName, subject, bodyText } = req.body;
      if (!fromEmail || !bodyText) {
        return res.status(400).json({ error: 'Bad Request', message: 'fromEmail and bodyText are required.' });
      }
      const result = await processVendorEmailReply({ fromEmail, fromName, subject: subject || 'Vendor Update', bodyText });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Vendor Reply Parse Error', message: err.message });
    }
  });

  /**
   * Pillar 5: Google Slides Luxury CMA & Listing Presentation Generator
   */
  router.get('/slides/list', async (req, res) => {
    try {
      const { listPresentationDecks } = await import('./googleSlidesService.js');
      const decks = listPresentationDecks();
      res.json({ success: true, decks });
    } catch (err: any) {
      res.status(500).json({ error: 'List Presentation Decks Error', message: err.message });
    }
  });

  router.post('/slides/generate', async (req, res) => {
    try {
      const { generateListingPresentationSlides } = await import('./googleSlidesService.js');
      const { propertyAddress, agentName, agentTitle, listPrice, specs } = req.body;
      if (!propertyAddress) {
        return res.status(400).json({ error: 'Bad Request', message: 'propertyAddress is required.' });
      }
      const deck = await generateListingPresentationSlides({
        propertyAddress,
        agentName,
        agentTitle,
        listPrice,
        specs
      });
      res.json({ success: true, deck, message: `✓ Generated 8-Slide Google Slides Presentation for ${propertyAddress}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Generate Slides Error', message: err.message });
    }
  });

  router.get('/slides/:id', async (req, res) => {
    try {
      const { getPresentationDeck } = await import('./googleSlidesService.js');
      const deck = getPresentationDeck(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: 'Not Found', message: `Presentation deck "${req.params.id}" not found.` });
      }
      res.json({ success: true, deck });
    } catch (err: any) {
      res.status(500).json({ error: 'Get Presentation Deck Error', message: err.message });
    }
  });

  return router;
}
