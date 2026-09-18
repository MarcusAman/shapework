import { describe, it, expect } from 'vitest';
import { getAllCampaigns, getCampaignById, saveCampaign, ListingMarketingCampaign } from '../../server/persistence/marketingCampaignsRepository';

describe('Marketing Requests Table Campaign Selection & Resilience Suite', () => {
  it('1. Repository stores and retrieves dynamically created campaign records', () => {
    const testCamp: any = {
      id: 'campaign_wetland_212_resilience',
      propertyAddress: '212 Wetland Drive, Wilmington NC',
      status: 'needs_attention',
      slaTarget: 'Today 5:00 PM',
      packageType: 'Social Media & Listing Suite',
      request: {
        requestedByName: 'Marcus Aman',
        requestedByRole: 'Broker / Tech Lead',
        channel: 'phone',
        originalRequestText: 'Social media post request for 212 Wetland Drive',
        requestedMaterialTypes: ['social_graphics']
      },
      listingSnapshot: {
        propertyAddress: '212 Wetland Drive',
        city: 'Wilmington',
        state: 'NC',
        listingPrice: 485000,
        listingAgentName: 'Marcus Aman'
      }
    };
    saveCampaign(testCamp);
    const campaigns = getAllCampaigns();
    expect(campaigns.some(c => c.id === 'campaign_wetland_212_resilience')).toBe(true);
  });

  it('2. getCampaignById successfully returns dynamic campaign record with full details', () => {
    const camp = getCampaignById('campaign_wetland_212_resilience');
    expect(camp).toBeDefined();
    expect(camp!.propertyAddress).toContain('212 Wetland');
    expect(camp!.request?.requestedByName).toBe('Marcus Aman');
    expect(camp!.request?.requestedMaterialTypes).toContain('social_graphics');
  });

  it('3. getCampaignById successfully queries campaigns by ID', () => {
    const testCamp: any = {
      id: 'campaign_dock_118_test',
      propertyAddress: '118 Dock Street, Unit 8, Wilmington NC',
      status: 'in_production',
      slaTarget: 'Today 3:00 PM',
      request: {
        requestedByName: 'Agent',
        channel: 'web',
        originalRequestText: 'Listing flyers'
      },
      listingSnapshot: {
        propertyAddress: '118 Dock Street, Unit 8',
        city: 'Wilmington',
        state: 'NC',
        listingPrice: 350000
      }
    };
    saveCampaign(testCamp);
    const found = getCampaignById('campaign_dock_118_test');
    expect(found).toBeDefined();
    expect(found!.propertyAddress).toContain('118 Dock');
  });
});
