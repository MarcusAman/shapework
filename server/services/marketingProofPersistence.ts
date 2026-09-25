import type { CanonicalMarketingTask } from '../persistence/marketingCampaignsRepository.js';
import { getMarketingPortalDbPool } from './marketingPortalAccess.js';

/** Save approval before SMTP, without overwriting portal notes, uploads or receipts. */
export async function persistMarketingProofApproval(task: CanonicalMarketingTask, expectedVersion: number): Promise<void> {
  const db = getMarketingPortalDbPool();
  if (!db) return; // The local-only save already wrote the development store.
  const result = await db.query(`UPDATE canonical_marketing_tasks SET
    proof_url = $3, proof_version = $4, proof_history = $5::jsonb,
    review_state = $6, review_history = $7::jsonb, approval_history = $8::jsonb,
    agent_email = COALESCE(NULLIF(agent_email, ''), $9), updated_at = NOW()
    WHERE id = $1 AND workspace_id = $2 AND COALESCE(proof_version, 0) = $10
      AND COALESCE(is_archived, false) = false
    RETURNING routing_snapshot`, [
    task.id, task.workspaceId, task.proofUrl || null, task.proofVersion || 0,
    JSON.stringify(task.proofHistory || []), task.reviewState,
    JSON.stringify(task.reviewHistory || []), JSON.stringify(task.approvalHistory || []),
    task.agentEmail || null, expectedVersion,
  ]);
  if (!result.rows[0]) throw new Error('The proof changed before approval was saved. Refresh and review the current proof.');
  task.routingSnapshot = result.rows[0].routing_snapshot || {};
}
