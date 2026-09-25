import { createHash } from 'node:crypto';
import { applicableMarketingProofDraft } from '../../src/lib/marketingProofDraft.js';
import { getDurableAssetByFilenameAsync } from '../persistence/durableAssetRepository.js';
import { currentMarketingProofAssets, internalProofFilename, type MarketingProofAssetRef } from './askNoraDriveDelivery.js';

export type PreparedMarketingProof = {
  proofUrl: string;
  notes?: string;
  assets: MarketingProofAssetRef[];
  consumedDraftSavedAt?: string;
};

const assetUrl = (asset: any): string => String(asset?.url || asset?.previewUrl || asset?.downloadUrl || asset?.fileUrl || '').trim();

/** Read an applicable draft only during an explicit submit/approve action. No task mutation or sends. */
export async function prepareMarketingProofAssets(task: any, input: {
  proofUrl?: string | null; notes?: string; assets?: any[];
} = {}): Promise<PreparedMarketingProof> {
  const requested = String(input.proofUrl || '').trim();
  const draft = applicableMarketingProofDraft(task);
  const explicitAssets = Array.isArray(input.assets);
  const draftUrl = String(draft?.proofUrl || (draft?.assets?.[0] && assetUrl(draft.assets[0])) || '').trim();
  const useDraft = Boolean(draft && (!requested || requested === draftUrl));
  const proofUrl = requested || (explicitAssets ? assetUrl(input.assets?.[0]) : useDraft ? draftUrl : '') || String(task.proofUrl || '').trim();
  const selected = explicitAssets ? input.assets! : useDraft ? draft!.assets : currentMarketingProofAssets(task, proofUrl);
  const candidates = [{ url: proofUrl }, ...selected].filter(value => internalProofFilename(assetUrl(value)));
  if (selected.some(value => !internalProofFilename(assetUrl(value)))) throw new Error('Every selected proof file must be a durable task asset.');
  const canonicalRefs = [task.proofUrl, ...(task.proofHistory || []).flatMap((entry: any) => [entry.proofUrl, ...(entry.assets || []).map(assetUrl)])];
  const assets: MarketingProofAssetRef[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const filename = internalProofFilename(assetUrl(candidate))!;
    if (seen.has(filename)) continue;
    seen.add(filename);
    const asset = await getDurableAssetByFilenameAsync(filename, { workspaceId: task.workspaceId, taskId: task.id });
    const belongs = asset?.taskId === task.id || (!asset?.taskId && canonicalRefs.some(url => internalProofFilename(url) === filename));
    if (!asset || asset.workspaceId !== task.workspaceId || !belongs) throw new Error('A selected proof file is unavailable in this task and workspace.');
    const pinned = selected.find(value => internalProofFilename(assetUrl(value)) === filename);
    if (pinned?.assetId && pinned.assetId !== asset.id) throw new Error('A selected proof file changed. Reload the task before submitting.');
    const bytes = Buffer.from(asset.dataBase64 || '', 'base64');
    if (!bytes.length || createHash('sha256').update(bytes).digest('hex') !== asset.sha256Checksum ||
        (pinned?.sha256Checksum && pinned.sha256Checksum !== asset.sha256Checksum)) throw new Error('A selected proof file failed its integrity check.');
    assets.push({ assetId: asset.id, url: asset.url || assetUrl(candidate), filename: asset.filename,
      contentType: asset.contentType || 'application/octet-stream', sha256Checksum: asset.sha256Checksum });
  }
  return { proofUrl, notes: input.notes ?? (useDraft ? draft?.notes : undefined), assets,
    ...(useDraft ? { consumedDraftSavedAt: draft!.savedAt } : {}) };
}

export function sameMarketingProofAssets(left: MarketingProofAssetRef[] = [], right: MarketingProofAssetRef[] = []): boolean {
  const identity = (values: MarketingProofAssetRef[]) => values.map(value => [value.assetId, value.url, value.sha256Checksum]);
  return JSON.stringify(identity(left)) === JSON.stringify(identity(right));
}

/** A temporary verdict view; callers persist the real task only after their existing role/proof gates. */
export function marketingProofPreviewTask(task: any, prepared: PreparedMarketingProof): any {
  const changed = task.proofUrl !== prepared.proofUrl || !sameMarketingProofAssets(currentMarketingProofAssets(task), prepared.assets);
  const version = (task.proofVersion || 0) + (changed ? 1 : 0);
  return { ...task, proofUrl: prepared.proofUrl, proofVersion: version,
    proofHistory: [...(task.proofHistory || []), { version, proofUrl: prepared.proofUrl, assets: prepared.assets }] };
}
