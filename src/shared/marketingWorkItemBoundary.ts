/**
 * Boundary validator and normalizer for Marketing Work Items.
 * Enforces strict runtime data-integrity at API / repository intake boundaries.
 */

export type MarketingWorkType =
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
  | 'other'
  | 'legacy_unclassified';

export type MarketingWorkItemStatus =
  | 'new'
  | 'needs_triage'
  | 'needs_scope'
  | 'ready'
  | 'in_progress'
  | 'waiting_on_agent'
  | 'waiting_on_approval'
  | 'waiting_on_quote'
  | 'waiting_on_vendor'
  | 'ready_for_review'
  | 'ready_to_send'
  | 'sent'
  | 'printing'
  | 'ready_for_pickup'
  | 'physically_delivered'
  | 'complete'
  | 'blocked'
  | 'deferred'
  | 'cancelled';

export interface MarketingWorkItem {
  id: string;
  domain: 'marketing';
  workType: MarketingWorkType;
  status: MarketingWorkItemStatus;
  title: string;
  requestId: string;
  campaignId?: string;
  priority?: string;
  executionMode?: string;
  executorType?: string;
  requestedDueAt?: string;
  nextAction?: string;
  isLegacyUnclassified?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  item?: MarketingWorkItem;
  errors: string[];
  action: 'accepted' | 'normalized_legacy' | 'rejected';
}

const VALID_WORK_TYPES = new Set<string>([
  'flyer',
  'social_graphic',
  'email_campaign',
  'website_update',
  'sop_documentation',
  'custom_brochure',
  'new_construction_sign',
  'print_asset',
  'price_quote',
  'basecamp_task',
  'other',
  'legacy_unclassified'
]);

const VALID_STATUSES = new Set<string>([
  'new',
  'needs_triage',
  'needs_scope',
  'ready',
  'in_progress',
  'waiting_on_agent',
  'waiting_on_approval',
  'waiting_on_quote',
  'waiting_on_vendor',
  'ready_for_review',
  'ready_to_send',
  'sent',
  'printing',
  'ready_for_pickup',
  'physically_delivered',
  'complete',
  'blocked',
  'deferred',
  'cancelled'
]);

/**
 * Validates and normalizes work items entering the Marketing domain boundary.
 */
export function validateAndNormalizeMarketingWorkItem(raw: any): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Record is not an object'], action: 'rejected' };
  }

  // Reject non-marketing domain records explicitly
  if (raw.domain && raw.domain !== 'marketing') {
    return { valid: false, errors: [`Non-marketing domain: ${raw.domain}`], action: 'rejected' };
  }

  if (!raw.id) errors.push('Missing id');
  if (!raw.title) errors.push('Missing title');
  if (!raw.requestId && !raw.id) errors.push('Missing requestId');

  if (errors.length > 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Marketing Boundary Validation Error]', errors, raw);
    }
    return { valid: false, errors, action: 'rejected' };
  }

  // Handle workType validation and explicit legacy classification
  let workType: MarketingWorkType = raw.workType;
  let isLegacyUnclassified = false;
  let action: 'accepted' | 'normalized_legacy' | 'rejected' = 'accepted';

  if (!workType || !VALID_WORK_TYPES.has(workType)) {
    // If it's a documented legacy record lacking workType, mark explicitly as legacy_unclassified
    workType = 'legacy_unclassified';
    isLegacyUnclassified = true;
    action = 'normalized_legacy';
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[Marketing Boundary] Record ${raw.id} normalized as explicit legacy_unclassified`);
    }
  }

  let status: MarketingWorkItemStatus = raw.status;
  if (!status || !VALID_STATUSES.has(status)) {
    status = 'in_progress';
  }

  const normalized: MarketingWorkItem = {
    id: String(raw.id),
    domain: 'marketing',
    workType,
    status,
    title: String(raw.title),
    requestId: String(raw.requestId || raw.id),
    campaignId: raw.campaignId,
    priority: raw.priority || 'standard',
    executionMode: raw.executionMode || 'automate',
    executorType: raw.executorType || 'shapework_automation',
    requestedDueAt: raw.requestedDueAt,
    nextAction: raw.nextAction || 'Review Work Item',
    isLegacyUnclassified
  };

  return {
    valid: true,
    item: normalized,
    errors: [],
    action
  };
}

/**
 * Displays human-readable label for work types without fabricating task categories.
 */
export function getWorkTypeDisplayLabel(workType: MarketingWorkType): string {
  if (workType === 'legacy_unclassified') {
    return 'Unclassified legacy work item';
  }
  return String(workType).replace(/_/g, ' ');
}
