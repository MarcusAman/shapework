/**
 * Nest Listing Launch — SOP-aligned helpers (sop_listing_launch_001).
 * Brokerage checklist (agreement → live), not a marketing-only ticket.
 * Checklist / field-map text only. No NC REALTORS PDF body text.
 * Email safety: this module never triggers outbound mail.
 */

import {
  buildListingLaunchFormsPackage,
  listingFormsPackageSummary,
  type NestListingFormDraft,
} from './nestListingFormFieldMaps';

export type ListingLaunchOffice = 'Wilmington' | 'CB';

/** High-level phases derived from sop_listing_launch_001 step groups */
export type ListingLaunchStatus =
  | 'agreement'
  | 'prep'
  | 'mls_bic'
  | 'marketing'
  | 'live'
  | 'done';

export const LISTING_LAUNCH_STATUS_STEPS: Array<{
  id: ListingLaunchStatus;
  label: string;
}> = [
  { id: 'agreement', label: 'Agreement' },
  { id: 'prep', label: 'Prep' },
  { id: 'mls_bic', label: 'MLS / BIC' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'live', label: 'Live' },
  { id: 'done', label: 'Done' },
];

export type ListingLaunchMinFields = {
  propertyAddress: string;
  listingAgentName: string;
  listingAgentEmail?: string;
  office: ListingLaunchOffice;
  targetGoLiveDate?: string;
  mlsNumber?: string;
  notes?: string;
};

export type ListingPackageChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  /** sop_listing_launch_001 owner role */
  role?: string;
  systemUsed?: string;
  phase?: ListingLaunchStatus;
  notes?: string;
};

export type ListingPackageDraft = {
  version: 2;
  kind: 'listing_launch';
  sopId: 'sop_listing_launch_001';
  /** Local path flag: never send outbound email from this flow */
  suppressOutboundEmail: true;
  createdAt: string;
  minFields: ListingLaunchMinFields;
  checklist: ListingPackageChecklistItem[];
  fieldMapDefaults: Record<string, string>;
  /** Metadata-only Form 101 / 140 / WWREA field maps (no PDF body text) */
  formsPackage: NestListingFormDraft[];
  formsPackageSummary: {
    formCount: number;
    filledFieldCount: number;
    blankFieldCount: number;
    codes: string[];
  };
};

/**
 * Ordered steps from Nest SOP Library `sop_listing_launch_001`
 * (Listing Launch Protocol). Roles preserved from published SOP.
 */
export const NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS: Array<
  Omit<ListingPackageChecklistItem, 'done'>
> = [
  {
    id: 'st_1',
    label: 'Validate Exclusive Right to Sell + WWREA in Dotloop',
    role: 'Transaction Coordinator',
    systemUsed: 'Dotloop',
    phase: 'agreement',
  },
  {
    id: 'st_2',
    label: 'Schedule HDR photography, floor plan, and drone',
    role: 'Listing Agent',
    systemUsed: 'Media Calendar',
    phase: 'prep',
  },
  {
    id: 'st_3',
    label: 'Dispatch yard post & brochure box work order',
    role: 'Admin Coordinator',
    systemUsed: 'Sign Inventory Desk',
    phase: 'prep',
  },
  {
    id: 'st_4',
    label: 'Install Supra lockbox and verify shackle code',
    role: 'Listing Agent',
    systemUsed: 'Supra eKEY',
    phase: 'prep',
  },
  {
    id: 'st_5',
    label: 'Collect seller disclosures (RPOADS & MOG) → Dotloop',
    role: 'Transaction Coordinator',
    systemUsed: 'Dotloop',
    phase: 'agreement',
  },
  {
    id: 'st_6',
    label: 'Draft MLS listing (NC Regional MLS — rooms + tax PIN)',
    role: 'Transaction Coordinator',
    systemUsed: 'NC Regional MLS',
    phase: 'mls_bic',
  },
  {
    id: 'st_7',
    label: 'Submit MLS draft to office BIC for compliance approval',
    role: 'Broker-in-Charge',
    systemUsed: 'Compliance Desk',
    phase: 'mls_bic',
  },
  {
    id: 'st_8',
    label: 'Generate brochure / PDF marketing package (Maxa)',
    role: 'Marketing Coordinator',
    systemUsed: 'Nest Design Center / Maxa',
    phase: 'marketing',
  },
  {
    id: 'st_9',
    label: 'Schedule Broker Open + public Open House (ShowingTime)',
    role: 'Listing Agent',
    systemUsed: 'ShowingTime',
    phase: 'live',
  },
  {
    id: 'st_10',
    label: 'Change MLS status Incomplete → Active',
    role: 'Transaction Coordinator',
    systemUsed: 'NC Regional MLS',
    phase: 'live',
  },
  {
    id: 'st_11',
    label: 'Trigger Just Listed social + direct mail',
    role: 'Marketing Coordinator',
    systemUsed: 'Marketing / Maxa',
    phase: 'marketing',
  },
  {
    id: 'st_12',
    label: 'Email seller active MLS link + showing instructions',
    role: 'Listing Agent',
    systemUsed: 'Email / Client Portal',
    phase: 'live',
  },
];

export const NEST_LISTING_FIELD_MAP_DEFAULTS: Record<string, string> = {
  propertyAddress: '',
  office: 'Wilmington',
  listingAgent: '',
  targetGoLive: '',
  mlsNumber: '',
  sopId: 'sop_listing_launch_001',
  processOwner: 'Melissa Gagliardi — Marketing & Operations Lead (SOP)',
  boardLane: 'Tasks → Listing Launch tab',
  category: 'listing_launch',
  domain: 'listing_launch',
};

export function buildListingPackageDraft(
  fields: ListingLaunchMinFields,
  nowIso = new Date().toISOString(),
): ListingPackageDraft {
  const formsPackage = buildListingLaunchFormsPackage({
    propertyAddress: fields.propertyAddress,
    listingAgentName: fields.listingAgentName,
    listingAgentEmail: fields.listingAgentEmail,
    office: fields.office,
    mlsNumber: fields.mlsNumber,
    notes: fields.notes,
  });
  return {
    version: 2,
    kind: 'listing_launch',
    sopId: 'sop_listing_launch_001',
    suppressOutboundEmail: true,
    createdAt: nowIso,
    minFields: { ...fields },
    checklist: NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS.map((item) => ({
      ...item,
      done: false,
    })),
    fieldMapDefaults: {
      ...NEST_LISTING_FIELD_MAP_DEFAULTS,
      propertyAddress: fields.propertyAddress,
      office: fields.office,
      listingAgent: fields.listingAgentEmail
        ? `${fields.listingAgentName} <${fields.listingAgentEmail}>`
        : fields.listingAgentName,
      targetGoLive: fields.targetGoLiveDate || '',
      mlsNumber: fields.mlsNumber || '',
      forms: '101+140+WWREA',
    },
    formsPackage,
    formsPackageSummary: listingFormsPackageSummary(formsPackage),
  };
}

function phaseFromChecklist(checklist?: ListingPackageChecklistItem[] | null): ListingLaunchStatus {
  const items = checklist || [];
  if (!items.length) return 'agreement';
  if (items.every((i) => i.done)) return 'done';
  const order: ListingLaunchStatus[] = ['agreement', 'prep', 'mls_bic', 'marketing', 'live'];
  for (const phase of order) {
    const phaseItems = items.filter((i) => (i.phase || 'agreement') === phase);
    if (phaseItems.length && phaseItems.some((i) => !i.done)) return phase;
  }
  return 'live';
}

/**
 * Derive stepper from checklist phase, explicit status, or Nest task status.
 */
export function deriveListingLaunchStatus(task: {
  status?: string | null;
  reviewState?: string | null;
  assignedTo?: string | null;
  reviewOwnerName?: string | null;
  isArchived?: boolean;
  listingLaunchStatus?: ListingLaunchStatus | null;
  listingPackageDraft?: { checklist?: ListingPackageChecklistItem[] } | null;
}): ListingLaunchStatus {
  if (task.listingLaunchStatus) return task.listingLaunchStatus;
  if (task.isArchived || task.status === 'completed' || task.status === 'delivered' || task.status === 'approved') {
    return 'done';
  }
  if (task.listingPackageDraft?.checklist?.length) {
    return phaseFromChecklist(task.listingPackageDraft.checklist);
  }
  const status = String(task.status || '').toLowerCase();
  if (status === 'in_progress' || status === 'in_production' || status === 'agent_review') {
    return 'mls_bic';
  }
  return 'agreement';
}

export function isListingLaunchTask(task: {
  category?: string | null;
  domain?: string | null;
  tags?: string[] | null;
  listingPackageDraft?: unknown;
  title?: string | null;
  source?: string | null;
}): boolean {
  if (task.listingPackageDraft) return true;
  if (String(task.domain || '').toLowerCase() === 'listing_launch') return true;
  if (String(task.category || '').toLowerCase() === 'listing_launch') return true;
  if (String(task.source || '') === 'ask_nora_listing_launch_v1') return true;
  if ((task.tags || []).some((t) => String(t).toLowerCase() === 'listing_launch')) {
    return true;
  }
  return /^listing launch:/i.test(String(task.title || ''));
}

/**
 * Payload for POST /api/marketing/canonical-requests (same persistence spine).
 * domain=listing_launch so Tasks can filter it off Marketing / Ops tabs.
 * CRITICAL: suppressOutboundEmail must stay honored (local gate — do NOT flip OUTBOUND_MASTER_MODE).
 */
export function buildListingLaunchIntakePayload(fields: ListingLaunchMinFields) {
  const draft = buildListingPackageDraft(fields);
  return {
    title: `Listing Launch: ${fields.propertyAddress}`,
    propertyAddress: fields.propertyAddress,
    agentName: fields.listingAgentName,
    agentEmail: fields.listingAgentEmail || undefined,
    office: fields.office,
    mlsNumber: fields.mlsNumber || undefined,
    dueDate: fields.targetGoLiveDate || undefined,
    notes: fields.notes || undefined,
    category: 'listing_launch',
    domain: 'listing_launch',
    tags: ['listing_launch'],
    // SOP process owner for coordination — not "this is a marketing ticket"
    assignedTo: 'Melissa Gagliardi',
    assignedToId: 'dir_melissa_gagliardi_33',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    status: 'request_received',
    listingPackageDraft: draft,
    listingLaunchStatus: 'agreement' as ListingLaunchStatus,
    sopId: 'sop_listing_launch_001',
    suppressOutboundEmail: true as const,
    skipPhotoRequestEmail: true as const,
    skipAgentNotifyEmail: true as const,
    skipOpsNotifyEmail: true as const,
    source: 'ask_nora_listing_launch_v1',
  };
}

export type { NestListingFormDraft } from './nestListingFormFieldMaps';
