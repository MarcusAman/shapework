/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * On-demand SLA scan. Cloud Scheduler uses
 * POST /api/internal/jobs/evaluate-task-slas (INTERNAL_JOB_KEY), not this route.
 */

import { Router } from 'express';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission } from '../auth/auth.js';
import { csrfProtection } from '../auth/csrf.js';

export function getOnDemandSlaRouter(): Router {
  const router = Router();

  router.post('/evaluate-all', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), csrfProtection, async (req, res) => {
    try {
      const { runSlaGuardrailCheck, getSlaGuardrailSummary } = await import('../services/taskSlaGuardrailService.js');
      const result = await runSlaGuardrailCheck();
      const summary = getSlaGuardrailSummary();
      return res.json({ success: true, result, summary });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
