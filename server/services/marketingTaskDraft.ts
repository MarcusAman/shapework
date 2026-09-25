import { resolveMarketingApproveNotifyCapabilities, type MarketingGateActor } from '../../src/lib/marketingApproveNotifyCapabilities.js';
import { validateProofUrl } from '../../src/utils/assetInspection.js';
import type { MarketingProofDraft } from '../../src/lib/marketingProofDraft.js';

export class MarketingDraftError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface MarketingDraftDependencies {
  loadTask: (taskId: string, workspaceId: string) => Promise<any>;
  getAssetById: (id: string, scope: { workspaceId: string; taskId: string }) => Promise<any>;
  getAssetByFilename: (filename: string, scope: { workspaceId: string; taskId: string }) => Promise<any>;
  persistDraft: (task: any, draft: MarketingProofDraft) => Promise<any>;
}

function uploadFilename(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;
  try {
    const name = decodeURIComponent(url.slice('/uploads/'.length));
    return name && !/[\\/\x00?#]/.test(name) && !['.', '..'].includes(name) ? name : null;
  } catch { return null; }
}

async function defaultDependencies(): Promise<MarketingDraftDependencies> {
  const [{ getMarketingPortalDbPool, hydrateMarketingPortalTask }, repository, assets] = await Promise.all([
    import('./marketingPortalAccess.js'),
    import('../persistence/marketingCampaignsRepository.js'),
    import('../persistence/durableAssetRepository.js'),
  ]);
  return {
    loadTask: async (id, workspaceId) => {
      const pool = getMarketingPortalDbPool();
      if (!pool) return repository.getCanonicalMarketingTaskById(id);
      const result = await pool.query('SELECT * FROM canonical_marketing_tasks WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
      return result.rows[0] ? hydrateMarketingPortalTask(result.rows[0]) : null;
    },
    getAssetById: assets.getDurableAssetByIdAsync,
    getAssetByFilename: assets.getDurableAssetByFilenameAsync,
    persistDraft: async (task, draft) => {
      const pool = getMarketingPortalDbPool();
      const saved = pool ? await persistMarketingProofDraft(task, draft, pool) : {
        ...task, routingSnapshot: { ...task.routingSnapshot, proofDraft: draft }, updatedAt: draft.savedAt,
      };
      // Only refresh after the durable write succeeds; never fire a stale full-row DB save.
      if (pool) {
        const cached = repository.getCanonicalMarketingTaskById(task.id);
        if (cached?.workspaceId === task.workspaceId) {
          cached.routingSnapshot = saved.routingSnapshot;
          cached.updatedAt = saved.updatedAt;
        }
      } else repository.saveCanonicalMarketingTask(saved, { persistDatabase: false });
      return saved;
    },
  };
}

/** One narrow update preserves assignments, review history, portal capabilities and delivery receipts. */
export async function persistMarketingProofDraft(task: any, draft: MarketingProofDraft, pool: { query: (...args: any[]) => Promise<any> }): Promise<any> {
  const result = await pool.query(`UPDATE canonical_marketing_tasks
    SET routing_snapshot = jsonb_set(COALESCE(routing_snapshot, '{}'::jsonb), '{proofDraft}', $3::jsonb), updated_at = NOW()
    WHERE id = $1 AND workspace_id = $2
      AND COALESCE(proof_version, 0) = $4 AND COALESCE(proof_url, '') = $5
      AND assigned_to_id IS NOT DISTINCT FROM $6 AND review_owner_id IS NOT DISTINCT FROM $7
      AND routing_snapshot->'proofDraft'->>'savedAt' IS NOT DISTINCT FROM $8
      AND COALESCE(is_archived, FALSE) = FALSE AND COALESCE(status, '') NOT IN ('completed', 'archived')
    RETURNING *`, [task.id, task.workspaceId, JSON.stringify(draft), task.proofVersion || 0, task.proofUrl || '', task.assignedToId || null, task.reviewOwnerId || null, task.routingSnapshot?.proofDraft?.savedAt || null]);
  if (!result.rows[0]) throw new MarketingDraftError(409, 'This task changed while saving. Reopen it before saving the draft again.');
  return Object.fromEntries(Object.entries(result.rows[0]).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
    value instanceof Date ? value.toISOString() : value,
  ]));
}

export async function saveMarketingTaskDraft(args: {
  taskId: string; workspaceId: string; actor: MarketingGateActor; input: any;
}, dependencies?: MarketingDraftDependencies): Promise<any> {
  if (!args.actor?.id || !args.workspaceId) throw new MarketingDraftError(401, 'Authentication and workspace are required.');
  const deps = dependencies || await defaultDependencies();
  const task = await deps.loadTask(args.taskId, args.workspaceId);
  if (!task || task.workspaceId !== args.workspaceId) throw new MarketingDraftError(404, 'Task not found.');
  if (!resolveMarketingApproveNotifyCapabilities(args.actor, task).canUpload) {
    throw new MarketingDraftError(403, 'Only the assigned producer or reviewer may save this draft.');
  }
  if (task.isArchived || ['completed', 'archived'].includes(task.status)) throw new MarketingDraftError(409, 'This task is closed. Reopen it before changing its draft.');
  const { proofUrl = '', notes = '', stagedAssets = [], baseProofVersion, baseProofUrl, expectedDraftSavedAt } = args.input || {};
  if (typeof proofUrl !== 'string' || typeof notes !== 'string' || notes.length > 50000 || !Array.isArray(stagedAssets) || stagedAssets.length > 30) {
    throw new MarketingDraftError(400, 'Provide a proof link, notes and at most 30 uploaded files.');
  }
  if (!Number.isInteger(baseProofVersion) || baseProofVersion < 0 || typeof baseProofUrl !== 'string' ||
    !(expectedDraftSavedAt === null || typeof expectedDraftSavedAt === 'string')) {
    throw new MarketingDraftError(400, 'Reopen this task to load its saved draft before editing.');
  }
  if (baseProofVersion !== (task.proofVersion || 0) || baseProofUrl !== (task.proofUrl || '') ||
    expectedDraftSavedAt !== (task.routingSnapshot?.proofDraft?.savedAt || null)) {
    throw new MarketingDraftError(409, 'Someone changed this task or draft. Your edits are still here; reopen the task before saving again.');
  }
  const scope = { workspaceId: args.workspaceId, taskId: task.id };
  const existingRefs = [task.proofUrl, ...(task.proofHistory || []).map((p: any) => p.proofUrl),
    ...(task.routingSnapshot?.proofDraft?.assets || []).map((a: any) => a.previewUrl)];
  const validateAsset = (asset: any) => {
    if (!asset || asset.workspaceId !== args.workspaceId ||
      (asset.taskId ? asset.taskId !== task.id : !existingRefs.includes(asset.url)) || !uploadFilename(asset.url || '')) {
      throw new MarketingDraftError(400, 'An uploaded file is missing or does not belong to this task.');
    }
    return asset;
  };
  const savedAt = new Date(Math.max(Date.now(), (Date.parse(expectedDraftSavedAt || '') || 0) + 1)).toISOString();
  const assets: MarketingProofDraft['assets'] = [];
  for (const input of stagedAssets) {
    if (!input || typeof input.id !== 'string') throw new MarketingDraftError(400, 'Every uploaded file must have a saved asset ID.');
    const asset = validateAsset(await deps.getAssetById(input.id, scope));
    if (assets.some(a => a.id === asset.id)) continue;
    assets.push({
      id: asset.id, previewUrl: asset.url, fileName: asset.filename, mimeType: asset.contentType,
      fileSizeBytes: asset.sizeBytes, deliverableName: String(input.deliverableName || task.title).slice(0, 250),
      width: Number(input.width) > 0 ? Number(input.width) : null,
      height: Number(input.height) > 0 ? Number(input.height) : null,
      aspectRatio: typeof input.aspectRatio === 'string' ? input.aspectRatio.slice(0, 80) : null,
      orientation: ['portrait', 'landscape', 'square'].includes(input.orientation) ? input.orientation : 'unknown',
      dpi: Number(input.dpi) > 0 ? Number(input.dpi) : null, dpiVerified: input.dpiVerified === true,
      dpiLabel: typeof input.dpiLabel === 'string' ? input.dpiLabel.slice(0, 250) : 'DPI could not be verified from this file.',
      pageCount: Math.max(1, Number(input.pageCount) || 1),
      validationStatus: ['matches', 'warning'].includes(input.validationStatus) ? input.validationStatus : 'unverified',
      validationMessage: String(input.validationMessage || '').slice(0, 500),
      uploadedBy: String(args.actor.name || args.actor.email || args.actor.id), uploadedById: args.actor.id!,
      uploadedAt: savedAt, version: (task.proofVersion || 0) + 1,
    });
  }
  let cleanProof = proofUrl.trim();
  if (cleanProof) {
    const filename = uploadFilename(cleanProof);
    if (filename) cleanProof = validateAsset(await deps.getAssetByFilename(filename, scope)).url;
    else {
      const checked = validateProofUrl(cleanProof);
      if (!checked.valid || !/^https:\/\//i.test(checked.normalizedUrl || cleanProof)) throw new MarketingDraftError(400, 'Use a saved upload or a valid secure proof link.');
      cleanProof = checked.normalizedUrl || cleanProof;
    }
  }
  return deps.persistDraft(task, { proofUrl: cleanProof, notes, assets, savedAt, savedById: args.actor.id!,
    baseProofVersion: task.proofVersion || 0, baseProofUrl: task.proofUrl || '' });
}
