/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite for Provider-Neutral MLS Adapter & NCRMLS Audit Contract
 */

import { describe, it, expect } from 'vitest';
import { NoraMlsProviderAdapter } from '../../server/integrations/mls/mlsProviderAdapter.js';

describe('NORA Provider-Neutral MLS Adapter Suite', () => {
  it('1. Correctly reports LICENSE_REQUIRED when no NCRMLS API credentials are configured', async () => {
    const adapter = new NoraMlsProviderAdapter();
    const status = await adapter.getCapabilityStatus();
    const conn = await adapter.testConnection();

    expect(status).toBe('LICENSE_REQUIRED');
    expect(conn.evidence.connected).toBe(false);
    expect(conn.evidence.providerMode).toBe('LICENSE_REQUIRED');
    expect(conn.evidence.exactBlocker).toContain('MLS_LICENSE_OR_CREDENTIALS_REQUIRED');
  });

  it('2. Distinguishes fixture listings with explicit SANDBOX_FIXTURE permitted-use tags', async () => {
    const adapter = new NoraMlsProviderAdapter();
    const search = await adapter.searchListings({ limit: 5 });

    expect(search.success).toBe(true);
    expect(search.data?.length).toBeGreaterThan(0);

    for (const listing of (search.data || [])) {
      expect(listing.providerMode).toBe('FIXTURE');
      expect(listing.permittedUse).toBe('SANDBOX_FIXTURE');
      expect(listing.evidenceStatus).toBe('FIXTURE');
      expect(listing.mlsNumber).toBeDefined();
      expect(listing.propertyAddress).toBeDefined();
      expect(listing.listPrice).toBeGreaterThan(0);
    }
  });

  it('3. Searches listings by address query and filters by price/bedrooms', async () => {
    const adapter = new NoraMlsProviderAdapter();
    
    // Address match
    const liveOakSearch = await adapter.searchListings({ address: 'Live Oak' });
    expect(liveOakSearch.data?.length).toBe(1);
    expect(liveOakSearch.data![0].propertyAddress).toContain('1104 S Live Oak');

    // Price filter
    const luxurySearch = await adapter.searchListings({ minPrice: 1000000 });
    expect(luxurySearch.data?.length).toBe(1);
    expect(luxurySearch.data![0].propertyAddress).toContain('820 Soundview');
  });

  it('4. Retrieves specific listing by MLS Number or record ID', async () => {
    const adapter = new NoraMlsProviderAdapter();
    const byMls = await adapter.getListingById('100458921');
    expect(byMls.data).toBeDefined();
    expect(byMls.data?.listingAgent).toContain('Matt Orr');

    const byRecordId = await adapter.getListingById('mls_100461208');
    expect(byRecordId.data).toBeDefined();
    expect(byRecordId.data?.propertyAddress).toContain('212 Wetland');
  });

  it('5. Retrieves RESO Data Dictionary 2.0 metadata specification', async () => {
    const adapter = new NoraMlsProviderAdapter();
    const meta = await adapter.getMetadata();

    expect(meta.success).toBe(true);
    expect(meta.data?.providerName).toContain('NCRMLS');
    expect(meta.data?.version).toContain('RESO Data Dictionary 2.0');
    expect(meta.data?.availableResources).toContain('Property');
    expect(meta.data?.availableResources).toContain('Member');
  });
});
