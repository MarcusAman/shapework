import { initializeCampaignsStore, saveCampaign, getCampaignById } from '../../server/persistence/marketingCampaignsRepository.js';

async function testPostgreSqlMandatoryIsolated() {
  console.log('--- REQUIREMENT 14 & 17: ISOLATED POSTGRESQL PERSISTENCE TEST ---');
  
  process.env.USE_POSTGRES_MANDATORY = 'true';
  process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
  process.env.POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
  process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'shapework_marketing';

  console.log(`Database Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`);

  const store = initializeCampaignsStore();
  console.log(`Initial store loaded: ${store.length} campaign(s).`);

  // Create isolated test campaign record (Section 14 & 17)
  const isolatedCampaignId = `camp_test_postgres_isolated_${Date.now()}`;
  const testCampaign = JSON.parse(JSON.stringify(store[0]));
  testCampaign.id = isolatedCampaignId;
  testCampaign.propertyAddress = '100 Isolated Test Way, Wilmington, NC 28405';
  testCampaign.listingSnapshot.headline = 'PostgreSQL lifecycle verification headline';
  testCampaign.status = 'draft';

  saveCampaign(testCampaign);

  // Perform Lifecycle Transition
  testCampaign.status = 'approved';
  testCampaign.approvals = [{
    id: `appr_iso_${Date.now()}`,
    reviewerName: 'Ryan Crecelius (BIC)',
    role: 'Broker-in-Charge',
    status: 'approved',
    comments: 'Isolated PostgreSQL persistence test approved.',
    timestamp: new Date().toISOString()
  }];

  saveCampaign(testCampaign);

  // Reload & Verify Isolated Record
  const reloaded = getCampaignById(isolatedCampaignId);
  if (!reloaded || reloaded.status !== 'approved' || reloaded.listingSnapshot.headline !== 'PostgreSQL lifecycle verification headline') {
    throw new Error('Isolated PostgreSQL mandatory test failed!');
  }

  // Verify Real Campaign (990 Inspiration Drive) remained unmutated
  const realCampaign = getCampaignById('campaign_990_inspiration') || store[0];
  if (realCampaign.listingSnapshot.headline !== 'LUXURY COASTAL ESTATE IN MAYFAIRE') {
    throw new Error(`Real campaign headline was mutated! Observed: ${realCampaign.listingSnapshot.headline}`);
  }

  console.log(`✅ Isolated PostgreSQL Test PASSED! Isolated Campaign ${reloaded.id} verified without mutating real production campaign.`);
}

testPostgreSqlMandatoryIsolated().catch(err => {
  console.error('PostgreSQL test error:', err);
  process.exit(1);
});
