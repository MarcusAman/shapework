import { describe, expect, it } from 'vitest';
import {
  buildOffer2TIntakePayload,
  buildOffer2TPackageDraft,
  deriveOffer2TStatus,
  isOffer2TBoardTask,
  isOffer2TTask,
  isOffer2TChatDraftIntent,
  mapLocationIdToOfferOffice,
  offerFieldsFromChatParse,
  NEST_OFFER_2T_CHECKLIST_DEFAULTS,
} from '../lib/offer2tSop';

describe('offer2tSop', () => {
  const min = {
    propertyAddress: '456 Harbor St, Wilmington, NC',
    buyerAgentName: 'Test Buyer Agent',
    buyerAgentEmail: 'buyer.agent@example.com',
    buyerNames: 'Jane Buyer; John Buyer',
    offerPrice: '$425,000',
    office: 'Wilmington' as const,
    earnestMoney: '$5,000',
    dueDiligenceDate: '2026-10-15',
    closingDate: '2026-11-20',
    notes: 'v1 offer smoke',
  };

  it('builds SOP draft with sop_offer_2t_001, suppressOutboundEmail, and checklist', () => {
    const draft = buildOffer2TPackageDraft(min, '2026-09-17T05:00:00.000Z');
    expect(draft.kind).toBe('offer_2t');
    expect(draft.sopId).toBe('sop_offer_2t_001');
    expect(draft.suppressOutboundEmail).toBe(true);
    expect(draft.checklist).toHaveLength(NEST_OFFER_2T_CHECKLIST_DEFAULTS.length);
    expect(NEST_OFFER_2T_CHECKLIST_DEFAULTS.length).toBeGreaterThanOrEqual(12);
    expect(draft.checklist.every((c) => c.done === false)).toBe(true);
    expect(draft.draftFields.partiesBuyers).toBe(min.buyerNames);
    expect(draft.draftFields.purchasePrice).toBe(min.offerPrice);
    expect(draft.draftFields.category).toBe('offer_2t');
  });

  it('intake payload uses offer_2t domain/category and skips all outbound email flags', () => {
    const payload = buildOffer2TIntakePayload(min);
    expect(payload.domain).toBe('offer_2t');
    expect(payload.category).toBe('offer_2t');
    expect(payload.tags).toContain('offer_2t');
    expect(payload.status).toBe('request_received');
    expect(payload.sopId).toBe('sop_offer_2t_001');
    expect(payload.source).toBe('ask_nora_offer_2t_v1');
    expect(payload.suppressOutboundEmail).toBe(true);
    expect(payload.skipPhotoRequestEmail).toBe(true);
    expect(payload.skipAgentNotifyEmail).toBe(true);
    expect(payload.skipOpsNotifyEmail).toBe(true);
    expect(payload.offerPackageDraft.suppressOutboundEmail).toBe(true);
    expect(payload.checklist).toHaveLength(NEST_OFFER_2T_CHECKLIST_DEFAULTS.length);
    expect(payload.title).toMatch(/^Offer \/ 2-T:/);
  });

  it('derives stepper from Nest lanes', () => {
    expect(deriveOffer2TStatus({ status: 'request_received' })).toBe('intake');
    expect(deriveOffer2TStatus({ status: 'agency_wwrea' })).toBe('agency_wwrea');
    expect(deriveOffer2TStatus({ status: 'in_progress' })).toBe('draft_2t');
    expect(deriveOffer2TStatus({ status: 'bic_review', assignedTo: 'BIC Review' })).toBe(
      'bic_review',
    );
    expect(deriveOffer2TStatus({ status: 'awaiting_signature' })).toBe('sign_handoff');
    expect(deriveOffer2TStatus({ status: 'completed' })).toBe('done');
  });

  it('recognizes offer_2t tasks and board exclusion helper', () => {
    expect(isOffer2TTask({ category: 'offer_2t' })).toBe(true);
    expect(isOffer2TTask({ domain: 'offer_2t' })).toBe(true);
    expect(isOffer2TTask({ tags: ['offer_2t'] })).toBe(true);
    expect(isOffer2TTask({ title: 'Offer / 2-T: 1 Main' })).toBe(true);
    expect(isOffer2TTask({ title: 'Form 2-T: 1 Main' })).toBe(true);
    expect(isOffer2TTask({ title: 'Flyer Design' })).toBe(false);
    expect(isOffer2TTask({ category: 'listing_launch' })).toBe(false);
    expect(isOffer2TBoardTask({ category: 'offer_2t' })).toBe(true);
    expect(isOffer2TBoardTask({ category: 'marketing' })).toBe(false);
  });

  it('checklist covers WWREA → 2-T fields → disclosures → BIC → sign handoff', () => {
    const ids = NEST_OFFER_2T_CHECKLIST_DEFAULTS.map((c) => c.id);
    expect(ids).toContain('wwrea_agency');
    expect(ids).toContain('buyer_agreement_basics');
    expect(ids).toContain('purchase_price');
    expect(ids).toContain('earnest_money');
    expect(ids).toContain('dd_closing_dates');
    expect(ids).toContain('contingencies');
    expect(ids).toContain('inclusions');
    expect(ids).toContain('disclosures_attachments');
    expect(ids).toContain('bic_compliance_review');
    expect(ids).toContain('human_review_sign');
  });

  it('maps location picker ids to Wilmington / CB office', () => {
    expect(mapLocationIdToOfferOffice('wilmington_nc')).toBe('Wilmington');
    expect(mapLocationIdToOfferOffice('all_locations')).toBe('Wilmington');
    expect(mapLocationIdToOfferOffice('carolina_beach_nc')).toBe('CB');
  });

  it('detects chat draft intents and skips pure knowledge questions', () => {
    expect(isOffer2TChatDraftIntent('Draft offer on 312 Mayfaire Way for David Miller at $725,000')).toBe(true);
    expect(isOffer2TChatDraftIntent('Write an offer for 104 Coastal Drive')).toBe(true);
    expect(isOffer2TChatDraftIntent('What are NCREC rules on earnest money?')).toBe(false);
  });

  it('prefills offer fields from chat parse', () => {
    const fields = offerFieldsFromChatParse(
      {
        property: { streetAddress: '312 Mayfaire Way', city: 'Wilmington', state: 'NC' },
        terms: { purchasePriceCents: 72500000, initialEarnestMoneyCents: 1000000 },
        parties: [
          { role: 'buyer', fullName: 'David Miller' },
          { role: 'buyer', fullName: 'Sarah Miller' },
        ],
      },
      'Wilmington'
    );
    expect(fields.propertyAddress).toContain('312 Mayfaire Way');
    expect(fields.buyerNames).toContain('David Miller');
    expect(fields.offerPrice).toContain('725');
    expect(fields.office).toBe('Wilmington');
  });
});
