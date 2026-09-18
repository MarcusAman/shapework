import fs from 'fs';
import path from 'path';

const UAT_DIR = path.join(process.cwd(), 'data-tenant_nest_uat');

export function getCleanTenantCounts() {
  const readJson = (filename: string) => {
    const p = path.join(UAT_DIR, filename);
    if (!fs.existsSync(p)) return [];
    try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { return []; }
  };

  const campaigns = readJson('marketing_campaigns.json');
  const staff = readJson('operations_directory.json');
  const sops = readJson('sop_documents.json');
  const oauth = readJson('oauth_tokens.json');
  const telemetry = readJson('boundary_telemetry.json');

  let requestsCount = 0;
  let workItemsCount = 0;
  let assetsCount = 0;
  let receiptsCount = 0;

  campaigns.forEach((c: any) => {
    if (c.request) requestsCount++;
    if (c.assets) assetsCount += Object.keys(c.assets).length;
    if (c.approvalReceipts) receiptsCount += c.approvalReceipts.length;
  });

  return {
    campaigns: campaigns.length,
    requests: requestsCount,
    workItems: workItemsCount,
    assets: assetsCount,
    receipts: receiptsCount,
    communications: 0,
    staff: staff.length,
    orgRelationships: staff.filter((s: any) => s.escalationContactId || s.reportsTo).length,
    sops: sops.length,
    oauthTokens: oauth.length,
    askConversations: 0
  };
}

const countsBefore = getCleanTenantCounts();
console.log('========================================================================');
console.log('CLEAN TENANT INITIAL RECORD COUNTS (tenant_nest_uat)');
console.log('========================================================================');
console.table(countsBefore);

// Check forbidden demo seed strings in UAT data store
const forbiddenStrings = [
  'campaign_990_inspiration',
  'staff_melissa_cooper',
  'demo_connected',
  'tmpl_sop_listing_launch',
  'rcpt_990_inspiration'
];

let leakFound = false;
for (const file of fs.readdirSync(UAT_DIR)) {
  const content = fs.readFileSync(path.join(UAT_DIR, file), 'utf-8');
  for (const s of forbiddenStrings) {
    if (content.includes(s)) {
      console.error(`🚨 LEAK DETECTED: Found forbidden seed string "${s}" in ${file}`);
      leakFound = true;
    }
  }
}

if (!leakFound) {
  console.log('✓ ZERO demo seed data strings detected in tenant_nest_uat files.');
} else {
  console.error('❌ SEED DATA LEAK CHECK FAILED!');
  process.exit(1);
}
