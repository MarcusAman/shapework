import { test, expect } from '@playwright/test';
import { deriveCampaignProjection, assertCampaignInvariants } from '../../src/shared/marketingProjection';

test.describe('Marketing Campaign State Invariants Unit & Integration', () => {
  test('enforces count hierarchy: approved <= reviewable <= rendered <= requested', async () => {
    const mockCampaign = {
      id: 'campaign_990_inspiration',
      campaignBrief: {
        requestedMaterialTypes: ['flyer', 'social', 'postcard', 'sign_rider', 'email']
      },
      approvalReceipts: [
        { assetId: 'flyer', assetVersion: 1, checksum: 'sha256_123', reviewerName: 'Ryan Crecelius' }
      ]
    };

    const projection = deriveCampaignProjection(mockCampaign);

    expect(projection.approvedAssetCount).toBeLessThanOrEqual(projection.reviewableAssetCount);
    expect(projection.reviewableAssetCount).toBeLessThanOrEqual(projection.renderedAssetCount);
    expect(projection.renderedAssetCount).toBeLessThanOrEqual(projection.requestedAssetCount);
    expect(assertCampaignInvariants(projection)).toBe(true);
  });

  test('prevents campaign state from being approved when unapproved assets remain', async () => {
    const mockCampaign = {
      id: 'campaign_990_inspiration',
      campaignBrief: {
        requestedMaterialTypes: ['flyer', 'social', 'postcard', 'sign_rider', 'email']
      },
      approvalReceipts: [
        { assetId: 'flyer', assetVersion: 1, checksum: 'sha256_123' }
      ]
    };

    const projection = deriveCampaignProjection(mockCampaign);
    expect(projection.campaignState).not.toBe('approved');
    expect(projection.campaignState).toBe('partially_approved');
  });
});
