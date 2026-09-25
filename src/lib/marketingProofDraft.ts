import type { UploadedProofAsset } from '../components/marketing/ProofUploadWizard';

export interface MarketingProofDraft {
  proofUrl: string;
  notes: string;
  assets: UploadedProofAsset[];
  savedAt: string;
  savedById: string;
  baseProofVersion: number;
  baseProofUrl: string;
}

/** A later explicit submission/approval consumes the old working draft. */
export function applicableMarketingProofDraft(task: any): MarketingProofDraft | null {
  const draft = task?.routingSnapshot?.proofDraft;
  if (!draft || !Array.isArray(draft.assets) || !draft.savedAt ||
      draft.baseProofVersion !== (task.proofVersion || 0) ||
      draft.baseProofUrl !== (task.proofUrl || '')) return null;
  const savedAt = Date.parse(draft.savedAt);
  if (!Number.isFinite(savedAt)) return null;
  if ((task.reviewHistory || []).some((entry: any) =>
    ['approved', 'proof_submitted'].includes(entry.action) && Date.parse(entry.timestamp) > savedAt)) return null;
  return draft;
}

export function marketingDraftFingerprint(proofUrl: string, notes: string, assets: Array<{ id: string; previewUrl: string }>): string {
  return JSON.stringify({ proofUrl: proofUrl.trim(), notes, assets: assets.map(({ id, previewUrl }) => ({ id, previewUrl })) });
}
