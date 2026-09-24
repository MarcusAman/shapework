/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';

export function getSlackRouter(dbState: any, persistStateCallback?: (wsId?: string) => Promise<void>): Router {
  const router = Router();

  // Helper to log audit events into dbState.
  function logServerAuditEvent(workspaceId: string, user: string, role: string, desc: string, category: string, impact = 'General') {
    const newAudit = {
      id: `audit_slack_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
   * GET /api/integrations/slack/status
   */
  router.get('/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    const wsId = (req as any).workspaceId || 'nest-realty-demo';
    
    if (!dbState.integrations) dbState.integrations = [];
    const slackConnector = dbState.integrations.find((i: any) => i.id === 'i_slack');

    if (!slackConnector || !slackConnector.connected) {
      return res.json({ 
        connected: false, 
        status: 'available_to_connect'
      });
    }

    res.json({
      connected: true,
      status: 'connected',
      lastSyncedAt: slackConnector.last_sync || new Date().toISOString(),
      recordsSynchronized: slackConnector.records_synchronized || 0,
      errorsCount: slackConnector.errors_count || 0
    });
  });

  /**
   * GET /api/integrations/slack/connect
   * Start mock OAuth web flow redirecting to mock callback.
   */
  router.get('/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const redirectUrl = `/api/integrations/slack/callback?workspaceId=${wsId}`;
    res.json({ url: redirectUrl });
  });

  /**
   * GET /api/integrations/slack/callback
   */
  // Slack has no OAuth state issuance. The callback is session-gated instead.
  router.get('/callback', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = String(req.query.workspaceId || 'nest-realty-demo');
    
    if (!dbState.integrations) dbState.integrations = [];
    let slackConnector = dbState.integrations.find((i: any) => i.id === 'i_slack');

    if (!slackConnector) {
      slackConnector = {
        id: 'i_slack',
        name: 'Slack',
        connected: false,
        last_sync: 'Never',
        permissions_granted: [],
        records_synchronized: 0,
        errors_count: 0
      };
      dbState.integrations.push(slackConnector);
    }

    slackConnector.connected = true;
    slackConnector.last_sync = new Date().toISOString();
    slackConnector.errors_count = 0;
    slackConnector.recentErrors = [];

    logServerAuditEvent(
      wsId,
      'System Administrator',
      'Administrator',
      'Slack connected successfully via OAuth 2.0',
      'Integrations',
      'Slack'
    );

    if (persistStateCallback) {
      await persistStateCallback(wsId);
    }

    res.redirect('/demo?tab=Integrations');
  });

  /**
   * POST /api/integrations/slack/sync
   */
  router.post('/sync', csrfProtection, requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = (req as any).workspaceId || 'nest-realty-demo';
    const user = (req as any).authUser;

    if (!dbState.integrations) dbState.integrations = [];
    const slackConnector = dbState.integrations.find((i: any) => i.id === 'i_slack');

    if (!slackConnector || !slackConnector.connected) {
      return res.status(400).json({ error: 'Integration Not Connected', message: 'Slack is not connected.' });
    }

    // Simulate syncing: increment records synced
    slackConnector.last_sync = new Date().toISOString();
    slackConnector.records_synchronized = (slackConnector.records_synchronized || 0) + 12;

    logServerAuditEvent(
      wsId,
      user?.name || 'System User',
      user?.role || 'User',
      'Slack channel synchronization completed: synced 12 new messages',
      'Integrations',
      'Slack'
    );

    if (persistStateCallback) {
      await persistStateCallback(wsId);
    }

    res.json({
      success: true,
      message: 'Slack synchronized successfully.',
      recordsSynchronized: slackConnector.records_synchronized
    });
  });

  /**
   * POST /api/integrations/slack/disconnect
   */
  router.post('/disconnect', csrfProtection, requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), async (req, res) => {
    const wsId = (req as any).workspaceId || 'nest-realty-demo';
    const user = (req as any).authUser;

    if (!dbState.integrations) dbState.integrations = [];
    const slackConnector = dbState.integrations.find((i: any) => i.id === 'i_slack');

    if (slackConnector) {
      slackConnector.connected = false;
      slackConnector.last_sync = 'Never';
      slackConnector.records_synchronized = 0;
    }

    logServerAuditEvent(
      wsId,
      user?.name || 'System User',
      user?.role || 'User',
      'Slack integration disconnected',
      'Integrations',
      'Slack'
    );

    if (persistStateCallback) {
      await persistStateCallback(wsId);
    }

    res.json({ success: true, message: 'Slack disconnected successfully.' });
  });

  /**
   * POST /api/integrations/slack/webhook
   */
  router.post('/webhook', (req, res) => {
    res.json({ success: true, message: 'Webhook received.' });
  });

  return router;
}
