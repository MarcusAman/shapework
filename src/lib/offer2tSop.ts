/**
 * Nest Ask Nora — Offer / Form 2-T draft v1 (buyer/offer family).
 * Additive twin of Listing Launch. Checklist + structured draft fields only.
 * No NC REALTORS PDF body text. No auto-send / MLS write / Rechat/Dotloop required for v1.
 * Email safety: this module never triggers outbound mail.
 */

export type Offer2TOffice = 'Wilmington' | 'CB';

export type Offer2TStatus =
  | 'intake'
  | 'agency_wwrea'
  | 'draft_2t'
  | 'disclosures'
  | 'bic_review'
  | 'sign_handoff'
  | 'done';

export const OFFER_2T_STATUS_STEPS: Array<{
  id: Offer2TStatus;
  label: string;
}> = [
  { id: 'intake', label: 'Intake' },
  { id: 'agency_wwrea', label: 'WWREA / Agency' },
  { id: 'draft_2t', label: 'Form 2-T draft' },
  { id: 'disclosures', label: 'Disclosures' },
  { id: 'bic_review', label: 'BIC review' },
  { id: 'sign_handoff', label: 'Sign / Dotloop' },
  { id: 'done', label: 'Done' },
];

export type Offer2TMinFields = {
  propertyAddress: string;
  buyerAgentName: string;
  buyerAgentEmail?: string;
  buyerNames: string;
  offerPrice: string;
  office?: Offer2TOffice;
  earnestMoney?: string;
  dueDiligenceDate?: string;
  closingDate?: string;
  notes?: string;
};

export type Offer2TChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  role?: string;
  phase?: Offer2TStatus;
  notes?: string;
};

export type Offer2TPackageDraft = {
  version: 1;
  kind: 'offer_2t';
  sopId: 'sop_offer_2t_001';
  /** Local path flag: never send outbound email from this flow */
  suppressOutboundEmail: true;
  createdAt: string;
  minFields: Offer2TMinFields;
  checklist: Offer2TChecklistItem[];
  /** ~80–90% structured Form 2-T draft field map (labels only — not PDF text) */
  draftFields: Record<string, string>;
};

/** Nest buyer/offer SOP checklist — separate family from listing_launch. */
export const NEST_OFFER_2T_CHECKLIST_DEFAULTS: Array<
  Omit<Offer2TChecklistItem, 'done'>
> = [
  {
    id: 'wwrea_agency',
    label: 'WWREA / Working With Real Estate Agents acknowledgment on file (buyer side)',
    role: 'buyer_agent',
    phase: 'agency_wwrea',
  },
  {
    id: 'agency_disclosure',
    label: 'Agency status confirmed (buyer agency / dual / designated — Nest SOP note)',
    role: 'buyer_agent',
    phase: 'agency_wwrea',
  },
  {
    id: 'buyer_agreement_basics',
    label: 'Buyer agency agreement basics on file (parties, term, compensation note)',
    role: 'buyer_agent',
    phase: 'agency_wwrea',
  },
  {
    id: 'parties',
    label: 'Form 2-T draft: parties (buyer name(s); seller TBD if unknown)',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'property_address',
    label: 'Form 2-T draft: property address / legal description placeholder',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'purchase_price',
    label: 'Form 2-T draft: purchase price',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'earnest_money',
    label: 'Form 2-T draft: earnest money amount + holder placeholder',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'dd_closing_dates',
    label: 'Form 2-T draft: due diligence / closing dates',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'contingencies',
    label: 'Form 2-T draft: contingencies sketched (financing / appraisal / other)',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'inclusions',
    label: 'Form 2-T draft: inclusions / exclusions / personal property notes',
    role: 'buyer_agent',
    phase: 'draft_2t',
  },
  {
    id: 'disclosures_attachments',
    label: 'Disclosures & attachments checklist started (Nest SOP — not form PDF text)',
    role: 'buyer_agent',
    phase: 'disclosures',
  },
  {
    id: 'hoa_covenants_note',
    label: 'HOA / covenants / lead-based paint flags noted if applicable',
    role: 'buyer_agent',
    phase: 'disclosures',
  },
  {
    id: 'bic_compliance_review',
    label: 'BIC / compliance review queued (human review before any send)',
    role: 'bic',
    phase: 'bic_review',
  },
  {
    id: 'human_review_sign',
    label: 'Human review complete — Dotloop / e-sign handoff (manual; no auto-send)',
    role: 'buyer_agent',
    phase: 'sign_handoff',
  },
];

export const NEST_OFFER_2T_DRAFT_FIELD_DEFAULTS: Record<string, string> = {
  sopId: 'sop_offer_2t_001',
  category: 'offer_2t',
  domain: 'offer_2t',
  partiesBuyers: '',
  partiesSellers: '',
  propertyAddress: '',
  purchasePrice: '',
  earnestMoney: '',
  earnestMoneyHolder: '',
  dueDiligenceDate: '',
  closingDate: '',
  contingencies: '',
  inclusions: '',
  exclusions: '',
  buyerAgent: '',
  office: 'Wilmington',
  reviewLane: 'Intake → WWREA/agency → Form 2-T draft → disclosures → BIC → Dotloop/sign',
  reviewOwner: 'Human (BIC / compliance)',
};

export function buildOffer2TPackageDraft(
  fields: Offer2TMinFields,
  nowIso = new Date().toISOString(),
): Offer2TPackageDraft {
  return {
    version: 1,
    kind: 'offer_2t',
    sopId: 'sop_offer_2t_001',
    suppressOutboundEmail: true,
    createdAt: nowIso,
    minFields: { ...fields },
    checklist: NEST_OFFER_2T_CHECKLIST_DEFAULTS.map((item) => ({
      ...item,
      done: false,
    })),
    draftFields: {
      ...NEST_OFFER_2T_DRAFT_FIELD_DEFAULTS,
      partiesBuyers: fields.buyerNames,
      propertyAddress: fields.propertyAddress,
      purchasePrice: fields.offerPrice,
      earnestMoney: fields.earnestMoney || '',
      dueDiligenceDate: fields.dueDiligenceDate || '',
      closingDate: fields.closingDate || '',
      buyerAgent: fields.buyerAgentEmail
        ? `${fields.buyerAgentName} <${fields.buyerAgentEmail}>`
        : fields.buyerAgentName,
      office: fields.office || 'Wilmington',
    },
  };
}

/**
 * Derive stepper from existing Nest lanes / review state when possible.
 * Prefer reading live task status rather than inventing a parallel board.
 */
export function deriveOffer2TStatus(task: {
  status?: string | null;
  reviewState?: string | null;
  assignedTo?: string | null;
  offer2tStatus?: Offer2TStatus | null;
  isArchived?: boolean;
  checklist?: Offer2TChecklistItem[] | null;
  offerPackageDraft?: Offer2TPackageDraft | null;
}): Offer2TStatus {
  if (task.offer2tStatus) return task.offer2tStatus;
  if (task.isArchived || task.status === 'completed' || task.status === 'delivered') {
    return 'done';
  }
  const status = String(task.status || '').toLowerCase();
  const review = String(task.reviewState || '').toLowerCase();
  if (
    status === 'awaiting_signature' ||
    status === 'sign_handoff' ||
    /dotloop|esign|sign/i.test(String(task.assignedTo || ''))
  ) {
    return 'sign_handoff';
  }
  if (
    status === 'bic_review' ||
    review === 'awaiting_bic' ||
    /bic|compliance/i.test(String(task.assignedTo || ''))
  ) {
    return 'bic_review';
  }
  if (status === 'disclosures' || status === 'disclosure_review') {
    return 'disclosures';
  }
  if (status === 'draft_2t' || status === 'in_progress' || status === 'in_production') {
    return 'draft_2t';
  }
  if (status === 'agency_wwrea' || status === 'agency') {
    return 'agency_wwrea';
  }
  if (status === 'request_received' || status === 'intake_received') {
    return 'intake';
  }
  return 'intake';
}

export function isOffer2TTask(task: {
  category?: string | null;
  domain?: string | null;
  tags?: string[] | null;
  offerPackageDraft?: unknown;
  title?: string | null;
}): boolean {
  if (task.offerPackageDraft) return true;
  const cat = String(task.category || '').toLowerCase();
  const domain = String(task.domain || '').toLowerCase();
  if (cat === 'offer_2t' || domain === 'offer_2t') return true;
  if ((task.tags || []).some((t) => String(t).toLowerCase() === 'offer_2t')) {
    return true;
  }
  return /^(offer\s*\/?\s*2-?t|form\s*2-?t)\s*:/i.test(String(task.title || ''));
}

/** Board/filter exclusion twin of isListingLaunchBoardTask — keep offer_2t out of Marketing/Ops pills. */
export function isOffer2TBoardTask(task: {
  category?: string | null;
  domain?: string | null;
  tags?: string[] | null;
  offerPackageDraft?: unknown;
  title?: string | null;
}): boolean {
  return isOffer2TTask(task);
}

/**
 * Payload for POST /api/marketing/canonical-requests (Ask Nora Offer / 2-T create).
 * CRITICAL: suppressOutboundEmail must be honored by the create path
 * (local gate — do NOT flip OUTBOUND_MASTER_MODE).
 */
export function buildOffer2TIntakePayload(fields: Offer2TMinFields) {
  const draft = buildOffer2TPackageDraft(fields);
  return {
    title: `Offer / 2-T: ${fields.propertyAddress}`,
    propertyAddress: fields.propertyAddress,
    agentName: fields.buyerAgentName,
    agentEmail: fields.buyerAgentEmail || undefined,
    buyerNames: fields.buyerNames,
    offerPrice: fields.offerPrice,
    office: fields.office || 'Wilmington',
    earnestMoney: fields.earnestMoney || undefined,
    dueDate: fields.closingDate || fields.dueDiligenceDate || undefined,
    notes: fields.notes || undefined,
    domain: 'offer_2t',
    category: 'offer_2t',
    tags: ['offer_2t'],
    status: 'request_received',
    offerPackageDraft: draft,
    checklist: draft.checklist,
    offer2tStatus: 'intake' as Offer2TStatus,
    sopId: 'sop_offer_2t_001',
    // Local email gate — offer create is draft+task+status only
    suppressOutboundEmail: true as const,
    skipPhotoRequestEmail: true as const,
    skipAgentNotifyEmail: true as const,
    skipOpsNotifyEmail: true as const,
    source: 'ask_nora_offer_2t_v1',
  };
}

/** Location picker id → Offer office default (Wilmington Mayfaire vs Carolina Beach). */
export function mapLocationIdToOfferOffice(locationId?: string | null): Offer2TOffice {
  const id = String(locationId || '').toLowerCase();
  if (id.includes('carolina') || id === 'carolina_beach_nc' || id === 'cb') return 'CB';
  return 'Wilmington';
}

export type ChatOfferPrefillSource = {
  property?: { streetAddress?: string; city?: string; state?: string };
  terms?: {
    purchasePriceCents?: number;
    dueDiligenceFeeCents?: number;
    initialEarnestMoneyCents?: number;
    settlementDate?: string;
  };
  parties?: Array<{ role?: string; fullName?: string }>;
  notes?: string;
};

/** Map chat/NLP parse → Offer2TMinFields for panel prefill (no outbound). */
export function offerFieldsFromChatParse(
  parsed: ChatOfferPrefillSource,
  office: Offer2TOffice = 'Wilmington'
): Partial<Offer2TMinFields> {
  const buyers = (parsed.parties || [])
    .filter((p) => String(p.role || '').toLowerCase().includes('buyer') && p.fullName)
    .map((p) => String(p.fullName).trim())
    .filter(Boolean);
  const city = parsed.property?.city;
  const addr = parsed.property?.streetAddress
    ? [parsed.property.streetAddress, city, parsed.property.state || (city ? 'NC' : undefined)]
        .filter(Boolean)
        .join(', ')
    : '';
  const price =
    parsed.terms?.purchasePriceCents != null
      ? `$${(parsed.terms.purchasePriceCents / 100).toLocaleString('en-US')}`
      : '';
  const earnest =
    parsed.terms?.initialEarnestMoneyCents != null
      ? `$${(parsed.terms.initialEarnestMoneyCents / 100).toLocaleString('en-US')}`
      : '';
  const noteBits: string[] = [];
  if (parsed.terms?.dueDiligenceFeeCents != null) {
    noteBits.push(`DD fee $${(parsed.terms.dueDiligenceFeeCents / 100).toLocaleString('en-US')}`);
  }
  if (parsed.notes) noteBits.push(parsed.notes);
  return {
    propertyAddress: addr,
    buyerNames: buyers.join('; '),
    offerPrice: price,
    earnestMoney: earnest,
    closingDate: parsed.terms?.settlementDate || '',
    office,
    notes: noteBits.join(' · '),
  };
}

/** True when Ask Nora chat should open Offer / 2-T prefill (not knowledge Q&A). */
export function isOffer2TChatDraftIntent(text: string): boolean {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/\b(what are|explain|rule|ncrec|how does|tell me about)\b/i.test(t) && !/\bdraft\b/i.test(t)) {
    return false;
  }
  return (
    /\bdraft offer\b/i.test(t) ||
    /\b(draft|write|start|create|prefill)\b[\s\S]{0,40}\b(offer|form\s*2-?t|2-t)\b/i.test(t) ||
    /\b(offer|form\s*2-?t|2-t)\b[\s\S]{0,40}\b(draft|write|start|create)\b/i.test(t) ||
    /\bwrite (an |a )?offer\b/i.test(t)
  );
}
