/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResolvedMarketingCampaign {
  campaignId: string;
  workspaceId: string;
  campaignRevision: number;
  listingSnapshotId: string;
  campaignRecord?: any;
  error?: 'not_found' | 'access_denied';
}

export function resolveMarketingCampaign(
  campaignId: string | null | undefined,
  campaignsStore: any[] = []
): ResolvedMarketingCampaign | null {
  if (!campaignId) return null;

  const campaign = campaignsStore.find(
    (c) => c.id === campaignId || c.id === `campaign_${campaignId}`
  );

  if (!campaign) {
    return {
      campaignId,
      workspaceId: 'nest-realty-demo',
      campaignRevision: 1,
      listingSnapshotId: `snapshot_${campaignId}`,
      error: 'not_found',
    };
  }

  return {
    campaignId: campaign.id,
    workspaceId: campaign.workspaceId || 'nest-realty-demo',
    campaignRevision: campaign.revision || 1,
    listingSnapshotId: campaign.listingSnapshot?.id || `snapshot_${campaign.id}`,
    campaignRecord: campaign,
  };
}

export function assertCampaignIntegrity(
  headerCampaignId: string | undefined,
  assetCampaignId: string | undefined,
  previewCampaignId: string | undefined,
  deliveryCampaignId: string | undefined
): boolean {
  if (!headerCampaignId) return true;
  const ids = [assetCampaignId, previewCampaignId, deliveryCampaignId].filter(Boolean);
  for (const id of ids) {
    if (id !== headerCampaignId) {
      console.error(
        `[DATA INTEGRITY FAILURE] Campaign ID mismatch detected: Header=${headerCampaignId}, target=${id}`
      );
      return false;
    }
  }
  return true;
}
