import { describe, expect, it } from 'vitest';
import { LicensedFormRegistry } from '../../server/contracts/licensedFormRegistry';
import {
  buildListingLaunchFormsPackage,
  NEST_LISTING_FORM_CODES,
} from '../lib/nestListingFormFieldMaps';

describe('Nest listing forms registry (101 / 140 / WWREA)', () => {
  it('registers active Form 101, 140, and WWREA with fieldMapSchema (no body text)', () => {
    for (const code of [
      'NC_REALTORS_FORM_101',
      'NC_REALTORS_FORM_140',
      'NCREC_WWREA',
    ]) {
      const entry = LicensedFormRegistry.getFormByCanonicalCode(code);
      expect(entry).toBeTruthy();
      expect(entry!.activeStatus).toBe(true);
      expect(entry!.jurisdiction).toBe('NC');
      expect(entry!.fieldMapSchema!.length).toBeGreaterThan(3);
      // copyright boundary: schema has labels/keys only
      for (const f of entry!.fieldMapSchema!) {
        expect(f.key).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(f.label.toLowerCase()).not.toMatch(/hereby agree|in consideration of|paragraph \d/);
      }
    }
  });

  it('lists listing forms for residential_resale_listing and keeps 2-T on buyer offer', () => {
    const listing = LicensedFormRegistry.getAvailableForms('ws_wilmington', 'residential_resale_listing');
    const codes = listing.map((e) => e.canonicalFormCode);
    expect(codes).toContain('NC_REALTORS_FORM_101');
    expect(codes).toContain('NC_REALTORS_FORM_140');
    expect(codes).toContain('NCREC_WWREA');
    expect(codes).not.toContain('NC_REALTORS_NC_BAR_FORM_2T');

    const offer = LicensedFormRegistry.getAvailableForms('ws_wilmington', 'residential_resale_buyer_offer');
    const offerCodes = offer.map((e) => e.canonicalFormCode);
    expect(offerCodes).toContain('NC_REALTORS_NC_BAR_FORM_2T');
    expect(offerCodes).toContain('NCREC_WWREA');
    expect(offerCodes).not.toContain('NC_REALTORS_FORM_101');
  });

  it('getListingLaunchFormCodes matches frontend nest listing form codes', () => {
    expect(LicensedFormRegistry.getListingLaunchFormCodes()).toEqual([...NEST_LISTING_FORM_CODES]);
  });

  it('frontend forms package prefills Nest-known fields only', () => {
    const forms = buildListingLaunchFormsPackage({
      propertyAddress: '9 Oak St, Wilmington, NC',
      listingAgentName: 'Alex Agent',
      listingAgentEmail: 'alex@nestrealty.com',
      office: 'Wilmington',
      mlsNumber: '999',
    });
    expect(forms).toHaveLength(3);
    const form101 = forms.find((f) => f.canonicalFormCode === 'NC_REALTORS_FORM_101')!;
    expect(form101.fieldMap.propertyAddress).toBe('9 Oak St, Wilmington, NC');
    expect(form101.fieldMap.listingAgent).toBe('Alex Agent');
    expect(form101.fieldMap.mlsNumber).toBe('999');
    expect(form101.fieldMap.sellerNames).toBe('');
    expect(form101.fieldMap.listPrice).toBe('');
  });
});
