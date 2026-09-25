import { Router } from 'express';
import { MarketingDraftError, saveMarketingTaskDraft } from '../services/marketingTaskDraft.js';

/** Mount behind requireAuth, resolveWorkspaceContext and requireWorkspaceMembership. */
export function createMarketingTaskDraftRouter(saveDraft = saveMarketingTaskDraft) {
  const router = Router();
  router.post('/:id/draft', async (req: any, res) => {
    const actor = req.authUser || req.user;
    if (!actor?.id || !req.workspace?.id) return res.status(401).json({ success: false, error: 'Authentication and workspace are required.' });
    try {
      const task = await saveDraft({ taskId: req.params.id, workspaceId: req.workspace.id, actor, input: req.body });
      return res.json({ success: true, task });
    } catch (error) {
      const status = error instanceof MarketingDraftError ? error.status : 503;
      return res.status(status).json({ success: false, error: status === 503 ? 'Draft could not be saved. Please try again.' : (error as Error).message });
    }
  });
  return router;
}
