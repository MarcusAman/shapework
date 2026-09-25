import type { CanonicalMarketingTask } from '../persistence/marketingCampaignsRepository.js';
import { getMarketingPortalDbPool } from './marketingPortalAccess.js';

const proofFields = ['proofUrl', 'proofVersion', 'proofHistory', 'proofNotes', 'reviewState', 'reviewHistory',
  'approvalHistory', 'status', 'reviewOwnerId', 'reviewOwnerName', 'coveringStaffId', 'coveringStaffName', 'agentEmail', 'updatedAt'] as const;

export function captureMarketingProofState(task: CanonicalMarketingTask): Record<string, any> {
  return Object.fromEntries(proofFields.map(field => [field, (task as any)[field] === undefined
    ? undefined : JSON.parse(JSON.stringify((task as any)[field]))]));
}

async function saveProofCache(task: CanonicalMarketingTask): Promise<void> {
  const { saveCanonicalMarketingTask } = await import('../persistence/marketingCampaignsRepository.js');
  saveCanonicalMarketingTask(task, { persistDatabase: false });
}

/** Save approval before SMTP, without overwriting portal notes, uploads or receipts. */
export async function persistMarketingProofApproval(task: CanonicalMarketingTask, expectedVersion: number,
  options: { consumedDraftSavedAt?: string; submission?: boolean; previousProofState?: Record<string, any> } = {}): Promise<void> {
  let db: ReturnType<typeof getMarketingPortalDbPool>;
  try { db = getMarketingPortalDbPool(); }
  catch (error) {
    if (options.previousProofState) {
      Object.assign(task, options.previousProofState);
      await saveProofCache(task);
    }
    throw error;
  }
  if (!db) {
    if (options.consumedDraftSavedAt && task.routingSnapshot?.proofDraft?.savedAt === options.consumedDraftSavedAt) {
      const draft = task.routingSnapshot.proofDraft;
      delete task.routingSnapshot.proofDraft;
      try { await saveProofCache(task); }
      catch (error) { task.routingSnapshot.proofDraft = draft; throw error; }
    }
    return;
  }
  try {
    const result = await db.query(`UPDATE canonical_marketing_tasks SET
    proof_url = $3, proof_version = $4, proof_history = $5::jsonb,
    review_state = $6, review_history = $7::jsonb, approval_history = $8::jsonb,
    agent_email = COALESCE(NULLIF(agent_email, ''), $9),
    routing_snapshot = CASE WHEN $11::text IS NOT NULL AND routing_snapshot->'proofDraft'->>'savedAt' = $11
      THEN routing_snapshot - 'proofDraft' ELSE routing_snapshot END,
    proof_notes = COALESCE($12, proof_notes),
    status = CASE WHEN $13::boolean THEN $14 ELSE status END,
    review_owner_id = CASE WHEN $13::boolean THEN COALESCE($15, review_owner_id) ELSE review_owner_id END,
    review_owner_name = CASE WHEN $13::boolean THEN COALESCE($16, review_owner_name) ELSE review_owner_name END,
    covering_staff_id = CASE WHEN $13::boolean THEN COALESCE($17, covering_staff_id) ELSE covering_staff_id END,
    covering_staff_name = CASE WHEN $13::boolean THEN COALESCE($18, covering_staff_name) ELSE covering_staff_name END,
    updated_at = NOW()
    WHERE id = $1 AND workspace_id = $2 AND COALESCE(proof_version, 0) = $10
      AND COALESCE(is_archived, false) = false
    RETURNING routing_snapshot`, [
    task.id, task.workspaceId, task.proofUrl || null, task.proofVersion || 0,
    JSON.stringify(task.proofHistory || []), task.reviewState,
    JSON.stringify(task.reviewHistory || []), JSON.stringify(task.approvalHistory || []),
    task.agentEmail || null, expectedVersion, options.consumedDraftSavedAt || null, task.proofNotes ?? null,
    Boolean(options.submission), task.status, task.reviewOwnerId || null, task.reviewOwnerName || null,
    task.coveringStaffId || null, task.coveringStaffName || null,
  ]);
    if (!result.rows[0]) throw new Error('The proof changed before approval was saved. Refresh and review the current proof.');
    task.routingSnapshot = result.rows[0].routing_snapshot || {};
  } catch (error) {
    // Repository transitions currently mutate the shared cache before their awaited DB write.
    // Restore durable state (or the pre-transition snapshot if DB is unavailable) so a retry
    // does not keep comparing a fictitious incremented version against the real database.
    if (options.previousProofState) Object.assign(task, options.previousProofState);
    try {
      const latest = await db.query(`SELECT proof_url, proof_version, proof_history, proof_notes, review_state,
        review_history, approval_history, status, review_owner_id, review_owner_name, covering_staff_id,
        covering_staff_name, agent_email, routing_snapshot, updated_at FROM canonical_marketing_tasks
        WHERE id = $1 AND workspace_id = $2`, [task.id, task.workspaceId]);
      if (latest.rows[0]) {
        for (const [key, value] of Object.entries(latest.rows[0])) {
          (task as any)[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value instanceof Date ? value.toISOString() : value;
        }
      }
    } catch { /* Keep the pre-transition cache snapshot while storage is unavailable. */ }
    await saveProofCache(task);
    throw error;
  }
}
