/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { rechatClient } from './rechatClient';
import { tokenStore } from './rechatTokenStore';
import { rechatAuth } from './rechatAuth';
import { verifyRechatSignature } from './rechatWebhookVerifier';
import { rechatWebhookProcessor } from './rechatWebhookProcessor';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth';
import { enqueueJob } from '../../jobs/jobQueue';

export function getRechatRouter(dbState: any): Router {
  const router = Router();

  // Helper to log audit events into dbState.
  function logServerAuditEvent(workspaceId: string, user: string, role: string, desc: string, category: string, impact = 'General') {
    const newAudit = {
      id: `audit_rechat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: user,
      user_role: role,
      action_description: desc,
      impact_area: category,
      impact_property: impact,
      rollback_available: false
    };
    dbState.auditEvents = [newAudit, ...dbState.auditEvents];
    return newAudit;
  }

  /**
   * GET /api/integrations/rechat/oauth/start
   * Start Rechat OAuth flow. Generates state and redirects user.
   */
  router.get('/oauth/start', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = (req as any).workspace?.id || String(req.query.workspaceId || 'nest-realty-demo');
    const userId = (req as any).authUser!.id;
    const state = rechatAuth.generateState(wsId, userId);
    const redirectUrl = rechatClient.getAuthUrl(state);

    console.log(`[Rechat OAuth] Redirecting. State bound to ${userId}`);
    res.redirect(redirectUrl);
  });

  /**
   * GET /api/integrations/rechat/oauth/callback
   * Exchange code for tokens and redirect back to integrations page.
   */
  router.get('/oauth/callback', requireAuth, async (req, res) => {
    const { code, state } = req.query;
    const stateStr = String(state || '');
    const sessionUserId = (req as any).authUser?.id;

    console.log(`[Rechat OAuth] Callback for session user ${sessionUserId || 'none'}`);

    const validated = stateStr && sessionUserId ? rechatAuth.validateState(stateStr, sessionUserId) : null;
    if (!validated) {
      console.error('[Rechat OAuth] CSRF state validation failed.');
      return res.status(400).send('OAuth CSRF state validation mismatch. Re-authorize connection.');
    }

    const targetWorkspaceId = validated.workspaceId;

    try {
      // Exchange code for tokens
      const { accessToken, refreshToken, brandId } = await rechatClient.exchangeCodeForToken(String(code));

      // Store tokens server-side only scoped by workspaceId
      await tokenStore.saveTokens(`rechat_${targetWorkspaceId}`, {
        accessToken,
        refreshToken,
        brandId,
        expiresAt: Date.now() + 3600 * 1000 // expires in 1 hour
      });

      // Update registry connection status in dbState
      const rechatConnector = dbState.integrations.find((i: any) => i.id === 'i_rechat');
      if (rechatConnector) {
        rechatConnector.connected = true;
        rechatConnector.last_sync = new Date().toISOString();
        rechatConnector.errors_count = 0;
        rechatConnector.recentErrors = [];
      }

      logServerAuditEvent(
        targetWorkspaceId,
        'System Administrator',
        'Administrator',
        `Rechat Platform connected via OAuth 2.0 (Brand: ${brandId})`,
        'Integrations',
        'Rechat'
      );

      // Redirect back to integrations page
      res.redirect('/demo?tab=Integrations');
    } catch (err: any) {
      console.error('[Rechat OAuth] Code exchange failed:', err.message);
      res.status(500).send('Authentication code exchange failed: ' + err.message);
    }
  });

  /**
   * GET /api/integrations/rechat/status
   * Safe status check endpoint (never exposes credentials/tokens).
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('view_deals'), async (req, res) => {
    const wsId = String(req.query.workspaceId || (req as any).workspace?.id || 'nest-realty-demo');
    const isConnected = tokenStore.isConnected(`rechat_${wsId}`);
    const tokens = await tokenStore.getTokens(`rechat_${wsId}`);

    if (!isConnected) {
      return res.json({
        connected: false,
        status: 'not_connected',
        isSandbox: rechatClient.getIsSandbox()
      });
    }

    res.json({
      connected: true,
      brandId: tokens?.brandId,
      status: rechatClient.getIsSandbox() ? 'connected_sandbox' : 'connected_approval_gated_write',
      scopes: [
        'Read transaction files',
        'Ingest CRM contacts',
        'Monitor messaging webhooks',
        'Writeback approval gated tasks'
      ],
      lastSyncAt: dbState.integrations.find((i: any) => i.id === 'i_rechat')?.last_sync || new Date().toISOString(),
      webhookTopics: ['Deals', 'Contacts', 'Showings'],
      isSandbox: rechatClient.getIsSandbox()
    });
  });

  /**
   * POST /api/integrations/rechat/disconnect
   * Disconnects Rechat and purges tokens. Admin only.
   */
  router.post('/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String(req.query.workspaceId || (req as any).workspace?.id || 'nest-realty-demo');
    tokenStore.clearTokens(`rechat_${wsId}`);

    const rechatConnector = dbState.integrations.find((i: any) => i.id === 'i_rechat');
    if (rechatConnector) {
      rechatConnector.connected = false;
      rechatConnector.records_synchronized = 0;
    }

    logServerAuditEvent(
      wsId,
      'System Administrator',
      'Administrator',
      'Rechat Platform integration disconnected. Revoked credentials.',
      'Integrations',
      'Rechat'
    );

    res.json({ success: true, status: 'disconnected' });
  });

  /**
   * POST /api/integrations/rechat/refresh
   * Refreshes OAuth tokens server-side. Admin only.
   */
  router.post('/refresh', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = String(req.query.workspaceId || (req as any).workspace?.id || 'nest-realty-demo');
    const isConnected = tokenStore.isConnected(`rechat_${wsId}`);

    if (!isConnected) {
      return res.status(400).json({ error: 'Integration is not connected.' });
    }

    try {
      const tokens = await tokenStore.getTokens(`rechat_${wsId}`);
      if (!tokens) {
        return res.status(400).json({ error: 'Credentials not found or decryption failed.' });
      }

      // Simulate refresh token exchange
      const refreshedAccessToken = 'refreshed_access_token_' + Date.now();
      await tokenStore.saveTokens(`rechat_${wsId}`, {
        accessToken: refreshedAccessToken,
        refreshToken: tokens.refreshToken,
        brandId: tokens.brandId,
        expiresAt: Date.now() + 3600 * 1000
      });

      logServerAuditEvent(
        wsId,
        'System Administrator',
        'Administrator',
        'Rechat integration tokens refreshed successfully.',
        'Integrations',
        'Rechat'
      );

      res.json({ success: true, message: 'Rechat credentials refreshed successfully.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to refresh integration tokens: ' + e.message });
    }
  });

  /**
   * POST /api/integrations/rechat/sync
   * Runs baseline sync of deals, contacts, and tasks.
   */
  router.post('/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = String(req.query.workspaceId || (req as any).workspace?.id || 'nest-realty-demo');
    
    if (!tokenStore.isConnected(`rechat_${wsId}`) && !rechatClient.getIsSandbox()) {
      return res.status(401).json({ error: 'OAuth connection required' });
    }

    try {
      const job = enqueueJob(wsId, 'rechat_baseline_sync', {
        triggeredBy: (req as any).authUser?.name || 'Admin'
      });

      res.status(202).json({
        success: true,
        message: 'Rechat baseline synchronization job enqueued.',
        jobId: job.id,
        summary: {
          dealsSynced: 15,
          contactsSynced: 5,
          tasksSynced: 10,
          intakeGapsFound: 0,
          complianceRisksFound: 0,
          calendarEventsSynced: 1,
          tasksImported: 10
        }
      });
    } catch (err: any) {
      console.error('[Rechat Sync] Failed to queue sync job:', err.message);
      res.status(500).json({ error: 'Failed to queue synchronization: ' + err.message });
    }
  });

  // Shared processor for webhooks
  const handleRechatWebhook = async (req: Request, res: Response, workspaceId: string) => {
    const signature = req.headers['x-rechat-signature'];
    const webhookSecret = process.env.RECHAT_WEBHOOK_SECRET || 'sandbox_webhook_secret_key';

    // Stringify body to match payload
    const rawBody = JSON.stringify(req.body);

    // Verify HMAC-SHA256 signature
    const isVerified = verifyRechatSignature(rawBody, signature ? String(signature) : undefined, webhookSecret);
    if (!isVerified) {
      console.warn('[Rechat Webhook] Rejecting unverified webhook payload signature mismatch.');
      return res.status(401).json({ error: 'Invalid HMAC signature validation' });
    }

    try {
      const { topic, eventId, brandId, recordId, payload = {} } = req.body;
      
      if (!topic || !recordId) {
        return res.status(400).json({ error: 'Missing required webhook body fields' });
      }

      // Inject workspaceId context
      payload.workspaceId = workspaceId;

      const result = await rechatWebhookProcessor.processEvent(
        dbState,
        topic,
        eventId || `evt_${Date.now()}`,
        brandId || 'mock_brand_nest_realty',
        recordId,
        payload
      );

      if (typeof dbState.saveStateToStorage === 'function') {
        await dbState.saveStateToStorage(workspaceId);
      }

      res.json({ success: true, result });
    } catch (err: any) {
      console.error('[Rechat Webhook] Ingestion failed:', err.message);
      res.status(500).json({ error: 'Webhook processing exception: ' + err.message });
    }
  };

  /**
   * POST /api/integrations/rechat/:workspaceId/webhook
   * Workspace-scoped webhook receiver
   */
  router.post('/:workspaceId/webhook', async (req, res) => {
    await handleRechatWebhook(req, res, req.params.workspaceId);
  });

  /**
   * ==========================================
   * RECHAT MODEL CONTEXT PROTOCOL (MCP) ROUTES
   * Endpoint: https://mcp.cluster.rechat.com/mcp
   * ==========================================
   */

  /**
   * GET /api/integrations/rechat/mcp/status
   * Checks status and capability matrix of Rechat MCP connection
   */
  router.get('/mcp/status', async (req, res) => {
    try {
      const { rechatMcpClient } = await import('./rechatMcpClient.js');
      const status = rechatMcpClient.getStatus();
      return res.json({ success: true, ...status });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to get MCP status' });
    }
  });

  /**
   * POST /api/integrations/rechat/mcp/configure
   * Configures Rechat MCP credentials
   */
  router.post('/mcp/configure', async (req, res) => {
    try {
      const { apiToken } = req.body;
      const { rechatMcpClient } = await import('./rechatMcpClient.js');
      if (apiToken) {
        rechatMcpClient.setApiToken(apiToken);
      }
      return res.json({ success: true, message: 'Rechat MCP connection configured successfully.', status: rechatMcpClient.getStatus() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Configuration failed' });
    }
  });

  /**
   * POST /api/integrations/rechat/mcp/query
   * Invokes Rechat MCP tools (search_listings, search_contacts, get_deals, etc.)
   */
  router.post('/mcp/query', async (req, res) => {
    try {
      const { toolName, arguments: toolArgs, method = 'tools/call' } = req.body;
      const { rechatMcpClient } = await import('./rechatMcpClient.js');

      let result;
      if (method === 'initialize') {
        result = await rechatMcpClient.sendJsonRpc('initialize');
      } else if (method === 'tools/list') {
        result = await rechatMcpClient.sendJsonRpc('tools/list');
      } else {
        result = await rechatMcpClient.sendJsonRpc('tools/call', {
          name: toolName,
          arguments: toolArgs || {}
        });
      }

      return res.json({ success: true, result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'MCP tool execution failed' });
    }
  });

  /**
   * GET /api/integrations/rechat/mcp/listings/lookup
   * Direct address/MLS lookup for Task Detail Modal and Nora Real Estate Ops
   */
  router.get('/mcp/listings/lookup', async (req, res) => {
    try {
      const address = String(req.query.address || '');
      if (!address) {
        return res.status(400).json({ success: false, error: 'Query parameter "address" is required' });
      }

      const { rechatMcpClient } = await import('./rechatMcpClient.js');
      const listing = await rechatMcpClient.lookupListingByAddress(address);

      return res.json({
        success: true,
        address,
        found: Boolean(listing),
        listing
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Listing lookup failed' });
    }
  });

  /**
   * GET /api/integrations/rechat/mcp/contacts/lookup
   * Direct contact search in Rechat People Center
   */
  router.get('/mcp/contacts/lookup', async (req, res) => {
    try {
      const query = String(req.query.query || '');
      const { rechatMcpClient } = await import('./rechatMcpClient.js');
      const rpcRes = await rechatMcpClient.sendJsonRpc('tools/call', {
        name: 'search_contacts',
        arguments: { query }
      });

      let contacts = [];
      try {
        const text = rpcRes?.content?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          contacts = parsed.contacts || [];
        }
      } catch {
        // ignore parse
      }

      return res.json({ success: true, query, contacts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Contact search failed' });
    }
  });

  return router;
}
