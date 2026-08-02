export type MarketingCampaignState =
  | 'needs_information'
  | 'ready_to_prepare'
  | 'preparing'
  | 'preparation_paused'
  | 'partially_prepared'
  | 'ready_for_review'
  | 'changes_requested'
  | 'approved'
  | 'exported'
  | 'delivered'
  | 'failed';

export type MarketingAssetState =
  | 'not_started'
  | 'preparing'
  | 'validating'
  | 'ready_for_review'
  | 'changes_requested'
  | 'approved'
  | 'failed';

export interface AssetApprovalReceipt {
  approvalId: string;
  workspaceId: string;
  campaignId: string;
  campaignRevision: number;
  assetId: string;
  assetVersion: number;
  artifactChecksum: string;
  previewChecksum: string;
  reviewerUserId: string;
  reviewedAt: string;
}

export interface CampaignClaim {
  value: string;
  source: 'listing_snapshot' | 'campaign_brief' | 'human_entered' | 'ai_draft';
  approved: boolean;
}

export interface CampaignRecordState {
  id: string;
  status: string;
  deliveryStatus?: string;
  approvalReceipt?: any;
  deliveryReceipts?: any[];
  missingInformation?: {
    field: string;
    prompt: string;
  };
  assetApprovals?: Record<string, boolean>;
  approvalReceipts?: AssetApprovalReceipt[];
}

export interface JobRecordState {
  id: string;
  status: string;
  completedMaterialsCount: number;
  totalMaterialsCount: number;
  inputRequired?: any;
  assetStatuses?: Record<string, { status: string; error?: string }>;
}

export function getDerivedCampaignState(
  campaign: CampaignRecordState | null,
  job: JobRecordState | null
): MarketingCampaignState {
  if (!campaign) return 'ready_to_prepare';

  // Explicit delivery status
  if (campaign.deliveryStatus === 'delivered' || (campaign.deliveryReceipts && campaign.deliveryReceipts.length > 0)) {
    return 'delivered';
  }
  if (campaign.deliveryStatus === 'exported') {
    return 'exported';
  }

  // Explicit approval status
  if (campaign.status === 'approved' || campaign.approvalReceipt) {
    return 'approved';
  }

  // Active Job Statuses
  if (job) {
    if (job.status === 'waiting_for_input' || job.inputRequired) {
      return 'needs_information';
    }
    if (job.status === 'running' || job.status === 'queued') {
      return 'preparing';
    }
    if (job.status === 'cancelled') {
      return 'partially_prepared';
    }
    if (job.status === 'failed') {
      return 'preparation_paused';
    }
  }

  if (campaign.missingInformation) {
    return 'needs_information';
  }

  if (campaign.status === 'ready_for_review' || (job && job.status === 'completed')) {
    return 'ready_for_review';
  }

  return 'ready_to_prepare';
}

export function getDerivedAssetState(
  assetType: string,
  campaign: CampaignRecordState | null,
  job: JobRecordState | null
): MarketingAssetState {
  if (campaign?.assetApprovals && campaign.assetApprovals[assetType]) {
    return 'approved';
  }

  if (job?.assetStatuses && job.assetStatuses[assetType]) {
    const st = job.assetStatuses[assetType].status;
    if (st === 'ready_for_preview' || st === 'rendered' || st === 'ready_for_review') {
      return 'ready_for_review';
    }
    if (st === 'rendering' || st === 'preparing') {
      return 'preparing';
    }
    if (st === 'validating') {
      return 'validating';
    }
    if (st === 'needs_attention') {
      return 'changes_requested';
    }
    if (st === 'failed') {
      return 'failed';
    }
  }

  if (campaign?.status === 'approved') {
    return 'approved';
  }

  if (campaign?.status === 'ready_for_review') {
    return 'ready_for_review';
  }

  return 'not_started';
}

export function getCampaignStatusBadge(state: MarketingCampaignState): {
  label: string;
  badgeClass: string;
} {
  switch (state) {
    case 'needs_information':
      return { label: 'Needs Information', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'ready_to_prepare':
      return { label: 'Ready to Prepare', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    case 'preparing':
      return { label: 'Preparing Package', badgeClass: 'bg-[#176457] text-emerald-200 border-emerald-400/40' };
    case 'preparation_paused':
      return { label: 'Preparation Paused', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    case 'partially_prepared':
      return { label: 'Partially Prepared', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'ready_for_review':
      return { label: 'Ready for Review', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'changes_requested':
      return { label: 'Changes Requested', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'approved':
      return { label: 'Package Approved', badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50' };
    case 'exported':
      return { label: 'Package Exported', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    case 'delivered':
      return { label: 'Delivered', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'failed':
      return { label: 'Preparation Failed', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
}
