export type MarketingRequestChannel =
  | 'phone'
  | 'email'
  | 'sms'
  | 'chat'
  | 'website_chatbot'
  | 'manual'
  | 'api';

export type MarketingRequestStatus =
  | 'received'
  | 'interpreting'
  | 'needs_information'
  | 'ready_for_campaign'
  | 'converted_to_campaign'
  | 'cancelled'
  | 'failed';

export type MarketingCampaignState =
  | 'request_received'
  | 'interpreting_request'
  | 'needs_information'
  | 'ready_to_prepare'
  | 'preparing'
  | 'preparation_paused'
  | 'partially_prepared'
  | 'ready_for_review'
  | 'changes_requested'
  | 'partially_approved'
  | 'approved'
  | 'exported'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type MarketingAssetState =
  | 'not_requested'
  | 'waiting'
  | 'preparing'
  | 'validating'
  | 'ready_for_review'
  | 'changes_requested'
  | 'approved'
  | 'failed';

export interface MarketingInformationRequirement {
  id: string;
  field: string;
  label: string;
  prompt: string;
  reason: string;
  affectedMaterialTypes: string[];
  unaffectedMaterialTypes: string[];
  inferredValue?: string;
  resolvedValue?: string;
  status: 'pending' | 'resolved';
}

export interface MarketingRequest {
  id: string;
  workspaceId: string;
  channel: MarketingRequestChannel;
  status: MarketingRequestStatus;
  receivedAt: string;
  requestedDueAt?: string;
  urgency?: 'standard' | 'urgent';

  capturedByAgentId?: string;
  capturedByAgentName?: string;
  capturedByAgentType?:
    | 'phone_agent'
    | 'email_agent'
    | 'chat_agent'
    | 'sms_agent'
    | 'website_chatbot'
    | 'manual_operator';

  requestedByPersonId?: string;
  requestedByName?: string;
  requestedByRole?: string;

  onBehalfOfPersonId?: string;
  onBehalfOfName?: string;
  onBehalfOfRole?: string;

  propertyId?: string;
  listingSnapshotId?: string;

  originalMessageId?: string;
  originalTranscriptId?: string;
  originalConversationId?: string;

  originalRequestText?: string;
  aiSummary?: string;

  requestedMaterialTypes: string[];
  specialInstructions?: string[];

  missingInformation: MarketingInformationRequirement[];

  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignClaim {
  id: string;
  claim: string;
  source: 'listing_snapshot' | 'campaign_brief' | 'human_entered' | 'ai_draft';
  approved: boolean;
  provenanceDetails?: string;
}

export interface MarketingCampaignBrief {
  id: string;
  workspaceId: string;
  campaignId: string;
  requestId: string;
  campaignRevision: number;

  propertyId: string;
  listingSnapshotId: string;

  objective: string;
  requestedMaterialTypes: string[];
  audience?: string[];
  campaignType:
    | 'new_listing'
    | 'open_house'
    | 'price_change'
    | 'sold'
    | 'agent_brand'
    | 'custom';

  deadline?: string;
  specialInstructions: string[];

  approvedClaims: CampaignClaim[];
  pendingClaims: CampaignClaim[];

  approvedPhotoIds: string[];
  brandKitId: string;
  compliancePolicySetId: string;

  assignedReviewerIds: string[];

  createdFromRequestId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingBrandKit {
  id: string;
  workspaceId: string;
  name: string;
  version: string;

  officeName: string;
  brokerageName: string;

  logoAssets: {
    primaryLogoId: string;
    primaryLogoUrl: string;
    reversedLogoId?: string;
    monochromeLogoId?: string;
  };

  colors: {
    forest: string;
    emerald: string;
    pistachio: string;
    mist: string;
    warmWhite: string;
  };

  typography: {
    displayFont: string;
    bodyFont: string;
    fallbackFonts: string[];
  };

  usageRules: string[];
  approvedTemplateIds: string[];

  effectiveAt: string;
  archivedAt?: string;
}

export interface MarketingCompliancePolicySet {
  id: string;
  workspaceId: string;
  officeId?: string;
  stateCode?: string;
  name: string;
  version: string;

  requiredFields: string[];
  requiredDisclosures: string[];
  prohibitedClaims: string[];
  imageRules: string[];
  channelRules: string[];

  requiresBrokerReview: boolean;
  effectiveAt: string;
  archivedAt?: string;
}

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
  reviewerName?: string;
  reviewedAt: string;
  brandKitVersion?: string;
  compliancePolicyVersion?: string;
}

export interface OriginalCommunicationRecord {
  id: string;
  requestId: string;
  type: 'phone_transcript' | 'email_message' | 'chat_conversation' | 'sms_thread' | 'manual_intake';
  subject?: string;
  from: string;
  to: string;
  timestamp: string;
  rawText: string;
  recordingUrl?: string;
  messages?: Array<{
    sender: string;
    timestamp: string;
    content: string;
  }>;
}

export interface CampaignRecordState {
  id: string;
  status: string;
  deliveryStatus?: string;
  approvalReceipt?: any;
  deliveryReceipts?: any[];
  missingInformation?: any;
  assetApprovals?: Record<string, boolean>;
  approvalReceipts?: AssetApprovalReceipt[];
  request?: MarketingRequest;
  campaignBrief?: MarketingCampaignBrief;
  brandKit?: MarketingBrandKit;
  compliancePolicySet?: MarketingCompliancePolicySet;
  originalCommunication?: OriginalCommunicationRecord;
  followUpRequests?: MarketingRequest[];
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

  if (campaign.deliveryStatus === 'delivered' || (campaign.deliveryReceipts && campaign.deliveryReceipts.length > 0)) {
    return 'delivered';
  }
  if (campaign.deliveryStatus === 'exported') {
    return 'exported';
  }

  const requestedAssets = campaign.campaignBrief?.requestedMaterialTypes || ['flyer', 'social', 'postcard', 'sign_rider', 'email'];
  const approvalsCount = campaign.approvalReceipts ? campaign.approvalReceipts.length : (campaign.approvalReceipt ? 1 : 0);

  if (approvalsCount >= requestedAssets.length) {
    return 'approved';
  }
  if (approvalsCount > 0) {
    return 'partially_approved';
  }

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

  if (campaign.missingInformation && (!Array.isArray(campaign.missingInformation) || campaign.missingInformation.length > 0)) {
    return 'needs_information';
  }

  if (campaign.status === 'approved') {
    return 'approved';
  }

  if (campaign.status === 'ready_for_review' || (job && job.status === 'completed')) {
    return 'ready_for_review';
  }

  if (campaign.status === 'needs_information') {
    return 'needs_information';
  }

  return 'ready_to_prepare';
}

export function getDerivedAssetState(
  assetType: string,
  campaign: CampaignRecordState | null,
  job: JobRecordState | null
): MarketingAssetState {
  if (Array.isArray(campaign?.approvalReceipts) && campaign.approvalReceipts.some(r => r.assetId === assetType)) {
    return 'approved';
  }
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

  if (campaign?.status === 'ready_for_review' || campaign?.status === 'approved') {
    return 'ready_for_review';
  }

  return 'waiting';
}

export function getCampaignStatusBadge(state: MarketingCampaignState): {
  label: string;
  badgeClass: string;
} {
  switch (state) {
    case 'request_received':
      return { label: 'Request Received', badgeClass: 'bg-[#1E293B] text-slate-300 border-slate-700' };
    case 'interpreting_request':
      return { label: 'Interpreting Request', badgeClass: 'bg-blue-900/40 text-blue-300 border-blue-500/40' };
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
    case 'partially_approved':
      return { label: 'Partially Approved', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    case 'approved':
      return { label: 'Package Approved', badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50' };
    case 'exported':
      return { label: 'Package Exported', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    case 'delivered':
      return { label: 'Delivered', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'cancelled':
      return { label: 'Cancelled', badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    case 'failed':
      return { label: 'Preparation Failed', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
}

export type MarketingExecutionMode =
  | 'automate'
  | 'automate_with_review'
  | 'assign_to_va'
  | 'assign_to_melissa'
  | 'assign_to_ann'
  | 'assign_to_hq'
  | 'external_vendor'
  | 'hybrid';

export type MarketingExecutorType =
  | 'shapework_automation'
  | 'virtual_assistant'
  | 'melissa'
  | 'ann'
  | 'nest_hq'
  | 'print_vendor'
  | 'other';

export type MarketingPriority =
  | 'needs_triage'
  | 'urgent'
  | 'high'
  | 'standard'
  | 'low';

export type MarketingWorkItemStatus =
  | 'new'
  | 'request_received'
  | 'assigned'
  | 'needs_triage'
  | 'needs_scope'
  | 'ready'
  | 'in_progress'
  | 'waiting_on_agent'
  | 'waiting_on_approval'
  | 'waiting_on_quote'
  | 'waiting_on_vendor'
  | 'agent_review'
  | 'revisions'
  | 'ready_for_review'
  | 'ready_to_send'
  | 'sent'
  | 'printing'
  | 'with_vendor'
  | 'ready_for_pickup'
  | 'physically_delivered'
  | 'approved'
  | 'complete'
  | 'completed'
  | 'archived'
  | 'blocked'
  | 'deferred'
  | 'cancelled';

/**
 * Canonical Marketing Task Lifecycle Status per Melissa's Verified Workflow
 */
export type MarketingTaskStatus =
  | 'request_received'   // New / Unassigned waiting for someone to take ownership
  | 'assigned'           // Assigned to a person (Melissa, Eduardo, Ann), waiting to Start Work
  | 'in_progress'        // Active design / production underway
  | 'agent_review'       // Waiting for agent approval
  | 'revisions'          // Changes requested by agent, waiting for rework
  | 'approved'           // Approved (digital complete/published)
  | 'with_vendor'        // Far right: Approved and dispatched to FastSigns/printer/vendor
  | 'completed'          // Finished
  | 'archived';          // Archived from active board

export type MarketingCategory =
  | 'farming'
  | 'listing_launch'
  | 'open_house'
  | 'social'
  | 'signage'
  | 'print'
  | 'mailer'
  | 'other';

export interface MarketingTaskItem {
  id: string;
  requestId: string;
  requestTitle?: string;
  propertyAddress?: string; // optional (e.g. for Farming, Mailers)
  agentName: string;
  agentRole?: string;
  title: string;
  category: MarketingCategory;
  assignedTo?: string; // e.g. 'Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn', or undefined
  assignedToRole?: string;
  status: MarketingTaskStatus;
  dueAt?: string; // ISO date string e.g. '2026-09-01' or '2027-03-01'
  vendorName?: string; // e.g. 'FastSigns', 'Coastal Sign Post Co.'
  vendorNotes?: string; // e.g. 'Proof approved — waiting on production'
  notes?: string;
  startedAt?: string;
  startedBy?: string;
  completedAt?: string;
  archivedAt?: string;
  isArchived?: boolean;
  approvalHistory?: Array<{
    action: 'sent_for_review' | 'changes_requested' | 'approved' | 'sent_to_vendor' | 'completed' | 'archived';
    performedBy: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingRequestContainer {
  id: string;
  title: string;
  propertyAddress?: string;
  category: MarketingCategory;
  agentName: string;
  agentRole?: string;
  channel: 'phone' | 'email' | 'web' | 'sms' | 'portal' | 'manual';
  requestExcerpt: string;
  tasks: MarketingTaskItem[];
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export type PrintWorkflowStatus =
  | 'not_required'
  | 'specifications_needed'
  | 'quote_required'
  | 'quote_requested'
  | 'quote_received'
  | 'waiting_for_quote_approval'
  | 'approved_for_print'
  | 'sent_to_vendor'
  | 'proof_received'
  | 'proof_approved'
  | 'printing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'physically_delivered'
  | 'cancelled';

export type VAReadinessStatus =
  | 'not_assessed'
  | 'not_ready'
  | 'training_required'
  | 'ready_with_review'
  | 'ready'
  | 'not_applicable';

export type MarketingNoteVisibility =
  | 'requester_visible'
  | 'team_visible'
  | 'melissa_private'
  | 'leadership_only';

export type AutomationLevel =
  | 'manual'
  | 'assist'
  | 'prepare_for_review'
  | 'auto_complete'
  | 'auto_complete_and_deliver';

export interface BasecampReference {
  projectId?: string;
  taskId?: string;
  url?: string;
  sourceSystem?: string;
  owner?: string;
  lastCheckedAt?: string;
  label?: string;
}

export interface MarketingQuote {
  id: string;
  workItemId: string;
  amount: number;
  currency: string;
  vendorId: string;
  vendorName: string;
  status:
    | 'needed'
    | 'requested'
    | 'received'
    | 'sent_for_approval'
    | 'approved'
    | 'declined'
    | 'expired';
  sentVia?: string;
  approvalCommunicationId?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface VAReadiness {
  workstreamId: string;
  status: VAReadinessStatus;
  requiredSopUrl?: string;
  templateAccess: boolean;
  brandKitAccess: boolean;
  platformAccess: boolean;
  sampleWorkReviewed: boolean;
  requiredTraining?: string;
  reviewerId?: string;
  readinessDate?: string;
}

export interface MarketingPrivateNote {
  id: string;
  workItemId?: string;
  requestId?: string;
  authorId: string;
  authorName: string;
  content: string;
  visibility: MarketingNoteVisibility;
  createdAt: string;
}

export interface RoutingPolicyOverride {
  recommendedRoute: MarketingExecutionMode;
  selectedRoute: MarketingExecutionMode;
  changedBy: string;
  reason: string;
  timestamp: string;
}

export interface MarketingWorkItem {
  id: string;
  taskId?: string;
  requestId: string;
  campaignId?: string;
  workType:
    | 'flyer'
    | 'social_graphic'
    | 'email_campaign'
    | 'website_update'
    | 'sop_documentation'
    | 'custom_brochure'
    | 'new_construction_sign'
    | 'print_asset'
    | 'price_quote'
    | 'basecamp_task'
    | 'other';
  title: string;
  propertyAddress?: string;
  description?: string;
  priority: MarketingPriority;
  executionMode: MarketingExecutionMode;
  executorType: MarketingExecutorType;
  executorId?: string;
  executorName?: string;

  requestOwnerId: string; // Melissa by default
  reviewerId?: string;
  approverId?: string;

  status: MarketingWorkItemStatus;
  nextAction: string;
  blockedReason?: string;

  quoteRequired: boolean;
  printRequired: boolean;
  approvalRequired: boolean;

  requestedDueAt?: string;
  internalTargetAt?: string;
  hardDeadline?: string;
  listingDate?: string;
  eventDate?: string;

  printWorkflowStatus?: PrintWorkflowStatus;
  printSpecs?: {
    dimensions?: string;
    paperStock?: string;
    quantity?: number;
    finish?: string;
    vendorName?: string;
    pickupLocation?: string;
    targetDeliveryDate?: string;
  };

  quote?: MarketingQuote;
  vaReadiness?: VAReadiness;
  basecampRef?: BasecampReference;
  sopUrl?: string;
  sopTitle?: string;
  automationLevel?: AutomationLevel;

  routingOverrides?: RoutingPolicyOverride[];
  privateNotes?: MarketingPrivateNote[];

  producedAssetIds?: string[];

  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlanningSnapshot {
  id: string;
  date: string;
  plannedBy: string;
  overdueCount: number;
  dueTodayCount: number;
  waitingCount: number;
  vaAssignedCount: number;
  plannedWorkItemIds: string[];
  notes?: string;
  createdAt: string;
}

