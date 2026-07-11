/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership } from '../auth/auth.js';

export function getPlannedIntegrationsRouter(dbState: any): Router {
  const router = Router();

  // Helper handler to return 501
  const plannedStubHandler = (req: any, res: any) => {
    res.status(501).json({
      error: 'Not Implemented',
      message: 'This integration path config is planned but not fully implemented yet.',
      provider: req.baseUrl.split('/').pop() || 'unknown'
    });
  };

  // Plaid stubs
  router.post('/plaid/link-token', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/plaid/exchange-public-token', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.get('/plaid/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    const isEnvConfigured = !!process.env.PLAID_CLIENT_ID && !!process.env.PLAID_SECRET;
    res.json({ connected: false, status: isEnvConfigured ? 'missing_routes' : 'missing_env' });
  });
  router.post('/plaid/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/plaid/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/plaid/webhook', plannedStubHandler);

  // API Nation standalone stubs
  router.get('/api-nation/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    res.json({ connected: false, status: 'missing_routes' });
  });
  router.all('/api-nation/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/api-nation/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/api-nation/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);

  // Zapier stubs
  router.get('/zapier/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    res.json({ connected: false, status: 'missing_routes' });
  });
  router.post('/zapier/generate-webhook', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/zapier/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);

  // Google Business Profile stubs
  router.get('/google-business-profile/connect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.get('/google-business-profile/callback', plannedStubHandler);
  router.get('/google-business-profile/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    res.json({ connected: false, status: 'planned' });
  });
  router.post('/google-business-profile/sync', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/google-business-profile/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);

  // SMTP Email stubs
  router.get('/email/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    res.json({ connected: false, status: 'available_to_connect' });
  });
  router.all('/email/configure', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/email/test', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/email/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);

  // SMS Provider stubs
  router.get('/sms/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    res.json({ connected: false, status: 'missing_routes' });
  });
  router.all('/sms/configure', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/sms/test', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/sms/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/sms/webhook', plannedStubHandler);

  // Resend stubs / status
  router.get('/resend/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
    const wsId = String(req.query.workspaceId || req.headers['x-workspace-id'] || 'nest-realty-demo');
    const isEnvConfigured = !!process.env.RESEND_API_KEY && !!process.env.RESEND_WEBHOOK_SECRET;

    if (!isEnvConfigured) {
      return res.json({ connected: false, status: 'missing_env' });
    }

    const domains = dbState?.sendingDomains || [];
    const workspaceDomains = domains.filter((d: any) => d.workspaceId === wsId);
    const hasVerifiedDomain = workspaceDomains.some((d: any) => d.status === 'verified');

    if (hasVerifiedDomain) {
      return res.json({
        connected: true,
        status: 'connected',
        domainsCount: workspaceDomains.length,
        verifiedDomainsCount: workspaceDomains.filter((d: any) => d.status === 'verified').length
      });
    }

    return res.json({ connected: false, status: 'available_to_connect' });
  });

  router.post('/resend/configure-domain', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/resend/verify-domain', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/resend/test-send', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);
  router.post('/resend/disconnect', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, plannedStubHandler);

  return router;
}
