import { describe, expect, it } from 'vitest';
import {
  buildListingLaunchIntakePayload,
  buildListingPackageDraft,
  deriveListingLaunchStatus,
  isListingLaunchTask,
  NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS,
} from '../lib/listingLaunchSop';

describe('listingLaunchSop', () => {
  const min = {
    propertyAddress: '123 Market St, Wilmington, NC',
    listingAgentName: 'Test Agent',
    listingAgentEmail: 'agent@example.com',
    office: 'Wilmington' as const,
    targetGoLiveDate: '2026-10-01',
    mlsNumber: '100200',
    notes: 'v1.1 smoke',
  };

  it('builds SOP draft with 12 sop_listing_launch_001 steps and email suppress', () => {
    const draft = buildListingPackageDraft(min, '2026-09-17T04:00:00.000Z');
    expect(draft.kind).toBe('listing_launch');
    expect(draft.sopId).toBe('sop_listing_launch_001');
    expect(draft.version).toBe(2);
    expect(draft.suppressOutboundEmail).toBe(true);
    expect(draft.checklist).toHaveLength(12);
    expect(NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS).toHaveLength(12);
    expect(draft.checklist.every((c) => c.done === false)).toBe(true);
    expect(draft.checklist[0].id).toBe('st_1');
    expect(draft.checklist[0].systemUsed).toBe('Dotloop');
    expect(draft.fieldMapDefaults.domain).toBe('listing_launch');
    expect(draft.formsPackage).toHaveLength(3);
    expect(draft.formsPackage.map((f) => f.canonicalFormCode)).toEqual([
      'NC_REALTORS_FORM_101',
      'NC_REALTORS_FORM_140',
      'NCREC_WWREA',
    ]);
    expect(draft.formsPackageSummary.formCount).toBe(3);
    expect(draft.formsPackage[0].fieldMap.propertyAddress).toBe(min.propertyAddress);
    expect(draft.formsPackage[0].fieldMap.listingAgent).toBe(min.listingAgentName);
    // human/Dotloop fields stay blank (no invented seller names)
    expect(draft.formsPackage[0].fieldMap.sellerNames).toBe('');
    expect(draft.formsPackage.every((f) => Object.keys(f.fieldMap).length > 0)).toBe(true);
  });

  it('intake payload is listing_launch domain (not marketing) with outbound flags off', () => {
    const payload = buildListingLaunchIntakePayload(min);
    expect(payload.category).toBe('listing_launch');
    expect(payload.domain).toBe('listing_launch');
    expect(payload.status).toBe('request_received');
    expect(payload.sopId).toBe('sop_listing_launch_001');
    expect(payload.listingLaunchStatus).toBe('agreement');
    expect(payload.suppressOutboundEmail).toBe(true);
    expect(payload.skipPhotoRequestEmail).toBe(true);
    expect(payload.skipAgentNotifyEmail).toBe(true);
    expect(payload.skipOpsNotifyEmail).toBe(true);
  });

  it('derives phases from checklist progress', () => {
    const draft = buildListingPackageDraft(min);
    expect(deriveListingLaunchStatus({ listingPackageDraft: draft })).toBe('agreement');
    draft.checklist = draft.checklist.map((c) =>
      c.phase === 'agreement' ? { ...c, done: true } : c,
    );
    expect(deriveListingLaunchStatus({ listingPackageDraft: draft })).toBe('prep');
    expect(deriveListingLaunchStatus({ status: 'completed' })).toBe('done');
  });

  it('recognizes listing launch tasks', () => {
    expect(isListingLaunchTask({ category: 'listing_launch' })).toBe(true);
    expect(isListingLaunchTask({ domain: 'listing_launch' })).toBe(true);
    expect(isListingLaunchTask({ tags: ['listing_launch'] })).toBe(true);
    expect(isListingLaunchTask({ title: 'Listing Launch: 1 Main' })).toBe(true);
    expect(isListingLaunchTask({ title: 'Flyer Design', category: 'print' })).toBe(false);
  });
});
