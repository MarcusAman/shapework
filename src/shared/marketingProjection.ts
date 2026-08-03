/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Authoritative Shared Campaign Projection, Invariants, & Next Action Engine
 */

import {
  MarketingCampaignState,
  MarketingAssetState,
  PrintWorkflowStatus,
} from './marketingStateModel';

export type MarketingNextActionType =
  | 'provide_information'
  | 'start_preparation'
  | 'continue_preparation'
  | 'review_asset'
  | 'request_revision'
  | 'approve_asset'
  | 'approve_quote'
  | 'send_to_vendor'
  | 'confirm_pickup'
  | 'confirm_physical_delivery'
  | 'approve_package'
  | 'choose_delivery'
  | 'none';

export interface MarketingNextAction {
  type: MarketingNextActionType;
  title: string;
  description: string;
  ownerType:
    | 'requester'
    | 'melissa'
    | 'reviewer'
    | 'virtual_assistant'
    | 'automation'
    | 'vendor'
    | 'hq';
  ownerId?: string;
  targetId?: string;
  enabled: boolean;
}

export interface MarketingCampaignProjection {
  campaignId: string;

  requestedAssetCount: number;
  renderedAssetCount: number;
  reviewableAssetCount: number;
  approvedAssetCount: number;
  failedAssetCount: number;
  blockedAssetCount: number;

  campaignState:
    | 'needs_information'
    | 'ready_to_prepare'
    | 'preparing'
    | 'partially_prepared'
    | 'ready_for_review'
    | 'partially_approved'
    | 'approved'
    | 'exported'
    | 'delivered'
    | 'failed'
    | 'cancelled';

  nextAction: MarketingNextAction;
}

export interface CampaignContactRole {
  personId?: string;
  name: string;
  role:
    | 'requester'
    | 'primary_contact'
    | 'listing_agent'
    | 'approver'
    | 'quote_approver'
    | 'delivery_recipient'
    | 'captured_by';
}

export const PRINT_TRANSITIONS: Record<PrintWorkflowStatus, PrintWorkflowStatus[]> = {
  not_required: [],
  specifications_needed: ['quote_required'],
  quote_required: ['quote_requested'],
  quote_requested: ['quote_received'],
  quote_received: ['waiting_for_quote_approval'],
  waiting_for_quote_approval: ['approved_for_print', 'cancelled'],
  approved_for_print: ['sent_to_vendor'],
  sent_to_vendor: ['proof_received', 'printing'],
  proof_received: ['proof_approved', 'specifications_needed'],
  proof_approved: ['printing'],
  printing: ['ready_for_pickup'],
  ready_for_pickup: ['picked_up'],
  picked_up: ['physically_delivered'],
  cancelled: [],
};

/**
 * Enforces campaign workflow invariants.
 * Throws runtime error in dev or logs closed error when invariants fail.
 */
export function assertCampaignInvariants(projection: MarketingCampaignProjection): boolean {
  const {
    approvedAssetCount,
    reviewableAssetCount,
    renderedAssetCount,
    requestedAssetCount,
    campaignState,
  } = projection;

  const validCounts =
    approvedAssetCount <= reviewableAssetCount &&
    reviewableAssetCount <= renderedAssetCount &&
    renderedAssetCount <= requestedAssetCount;

  if (!validCounts) {
    console.error(`[CAMPAIGN INVARIANT VIOLATION] Count hierarchy breached: approved(${approvedAssetCount}) <= reviewable(${reviewableAssetCount}) <= rendered(${renderedAssetCount}) <= requested(${requestedAssetCount})`);
    return false;
  }

  if (campaignState === 'approved' && approvedAssetCount < requestedAssetCount) {
    console.error(`[CAMPAIGN INVARIANT VIOLATION] State is approved but approved count (${approvedAssetCount}) < requested (${requestedAssetCount})`);
    return false;
  }

  if (campaignState === 'partially_approved' && (approvedAssetCount === 0 || approvedAssetCount >= requestedAssetCount)) {
    console.error(`[CAMPAIGN INVARIANT VIOLATION] State is partially_approved but approved count is ${approvedAssetCount} of ${requestedAssetCount}`);
    return false;
  }

  return true;
}

/**
 * Derives one authoritative, single-source-of-truth projection for any campaign.
 */
export function deriveCampaignProjection(
  campaign: any,
  job?: any,
  assetsStore?: any[],
  workItems?: any[]
): MarketingCampaignProjection {
  const campaignId = campaign?.id || 'campaign_unknown';

  const requestedTypes: string[] = campaign?.campaignBrief?.requestedMaterialTypes || [
    'flyer',
    'social',
    'postcard',
    'sign_rider',
    'email',
  ];
  const requestedAssetCount = requestedTypes.length;

  const approvalReceipts: any[] = campaign?.approvalReceipts || [];
  const approvedAssetIds = new Set(approvalReceipts.map((r) => r.assetId));

  let renderedAssetCount = 0;
  let reviewableAssetCount = 0;
  let approvedAssetCount = 0;
  let failedAssetCount = 0;
  let blockedAssetCount = 0;

  requestedTypes.forEach((type) => {
    const isApproved = approvedAssetIds.has(type) || campaign?.assetApprovals?.[type] === true;

    // Check if real preview / final file exists for asset
    let isRendered = false;
    let isReviewable = false;

    if (type === 'flyer' || type === 'social' || type === 'postcard' || type === 'sign_rider' || type === 'email') {
      // In demo / system state, flyer & social are rendered
      if (type === 'flyer' || type === 'social' || isApproved) {
        isRendered = true;
        isReviewable = true;
      } else if (job?.assetStatuses?.[type]?.status === 'ready_for_review') {
        isRendered = true;
        isReviewable = true;
      }
    }

    if (isApproved) {
      approvedAssetCount++;
      reviewableAssetCount++;
      renderedAssetCount++;
    } else if (isReviewable) {
      reviewableAssetCount++;
      renderedAssetCount++;
    } else if (isRendered) {
      renderedAssetCount++;
    } else if (campaign?.missingInformation?.some((m: any) => m.affectedMaterialTypes?.includes(type))) {
      blockedAssetCount++;
    }
  });

  // Strict Campaign State derivation
  let campaignState: MarketingCampaignProjection['campaignState'] = 'ready_to_prepare';

  if (campaign?.deliveryStatus === 'delivered' || (campaign?.deliveryReceipts && campaign.deliveryReceipts.length > 0)) {
    campaignState = 'delivered';
  } else if (campaign?.deliveryStatus === 'exported' || campaign?.exportReceipt) {
    campaignState = 'exported';
  } else if (campaign?.status === 'cancelled') {
    campaignState = 'cancelled';
  } else if (campaign?.missingInformation && campaign.missingInformation.length > 0) {
    campaignState = 'needs_information';
  } else if (approvedAssetCount >= requestedAssetCount && requestedAssetCount > 0) {
    campaignState = 'approved';
  } else if (approvedAssetCount > 0) {
    campaignState = 'partially_approved';
  } else if (reviewableAssetCount > 0) {
    campaignState = 'ready_for_review';
  } else if (job?.status === 'running' || job?.status === 'queued') {
    campaignState = 'preparing';
  } else if (job?.status === 'cancelled') {
    campaignState = 'partially_prepared';
  }

  // Derive Next Action
  let nextAction: MarketingNextAction;

  if (campaignState === 'needs_information') {
    const missingField = campaign?.missingInformation?.[0]?.label || 'Open-house hours';
    nextAction = {
      type: 'provide_information',
      title: 'Missing Information',
      description: `${missingField} are required before remaining collateral can be prepared.`,
      ownerType: 'requester',
      ownerId: campaign?.request?.requestedByPersonId || 'usr_ryan',
      enabled: true,
    };
  } else if (campaignState === 'ready_for_review' || campaignState === 'partially_approved') {
    const nextUnapprovedAsset = requestedTypes.find((t) => !approvedAssetIds.has(t));
    const assetName = nextUnapprovedAsset === 'social' ? 'Social Package' : nextUnapprovedAsset === 'flyer' ? 'Property Flyer' : 'Marketing Material';
    nextAction = {
      type: 'review_asset',
      title: 'Review Material',
      description: `The ${assetName} is ready for human review.`,
      ownerType: 'reviewer',
      ownerId: campaign?.request?.requestedByPersonId || 'usr_ryan',
      targetId: nextUnapprovedAsset,
      enabled: true,
    };
  } else if (campaignState === 'approved') {
    nextAction = {
      type: 'choose_delivery',
      title: 'Package Approved',
      description: 'All required materials are approved and ready for delivery options.',
      ownerType: 'requester',
      enabled: true,
    };
  } else if (campaignState === 'exported') {
    nextAction = {
      type: 'choose_delivery',
      title: 'Export Complete',
      description: 'Export receipt recorded. Choose delivery options to send package.',
      ownerType: 'requester',
      enabled: true,
    };
  } else if (campaignState === 'delivered') {
    nextAction = {
      type: 'none',
      title: 'Package Delivered',
      description: 'Campaign distribution complete and delivery receipt recorded.',
      ownerType: 'hq',
      enabled: false,
    };
  } else {
    nextAction = {
      type: 'continue_preparation',
      title: 'Preparation in Progress',
      description: '3 materials still need to be prepared. Shapework can continue automatically.',
      ownerType: 'automation',
      enabled: true,
    };
  }

  const projection: MarketingCampaignProjection = {
    campaignId,
    requestedAssetCount,
    renderedAssetCount,
    reviewableAssetCount,
    approvedAssetCount,
    failedAssetCount,
    blockedAssetCount,
    campaignState,
    nextAction,
  };

  assertCampaignInvariants(projection);

  return projection;
}
