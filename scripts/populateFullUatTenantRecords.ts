import fs from 'fs';
import path from 'path';
import { NEST_FULL_ROSTER_72 } from '../server/persistence/nestRosterSeed.js';

const args = process.argv.slice(2);
const tenantIdArg = args.find(a => a.startsWith('--tenant-id='))?.split('=')[1];

if (!tenantIdArg || tenantIdArg === 'tenant_nest_uat' || tenantIdArg === 'data-tenant_nest_uat') {
  console.error('🚨 FATAL TENANT SAFETY ERROR: Cannot populate fixture records into final customer tenant "tenant_nest_uat".');
  console.error('You must specify a disposable tenant ID via --tenant-id=tenant_nest_acceptance_<run-id>');
  process.exit(1);
}

const tenantDir = path.join(process.cwd(), `data-${tenantIdArg}`);
if (!fs.existsSync(tenantDir)) {
  fs.mkdirSync(tenantDir, { recursive: true });
}

// 1. Populate Operations Directory with 72 Nest Realty profiles
fs.writeFileSync(path.join(tenantDir, 'operations_directory.json'), JSON.stringify(NEST_FULL_ROSTER_72, null, 2));

// 2. Populate Published SOP Documents
const sops = [
  {
    id: 'sop_nest_001',
    title: 'Listing Sign Placement & Property Access Standards',
    version: '1.0',
    status: 'published',
    content: 'All Yard Sign Riders must be placed within 24 hours of MLS status update. Confirm BIC authorization prior to installation.',
    publishedAt: '2026-08-01T10:00:00Z',
    author: 'Ann Gunn'
  },
  {
    id: 'sop_nest_002',
    title: 'Flyer Approval & Review Standard',
    version: '2.0',
    status: 'published',
    content: 'Marketing flyers require BIC or Operations Director approval prior to print export.',
    publishedAt: '2026-08-02T14:30:00Z',
    author: 'Ryan Crecelius'
  }
];
fs.writeFileSync(path.join(tenantDir, 'sop_documents.json'), JSON.stringify(sops, null, 2));

// 3. Populate Active Marketing Campaigns
const campaigns = [
  {
    id: 'campaign_990_inspiration',
    propertyAddress: '990 Inspiration Drive, Wilmington, NC',
    status: 'approved',
    collateralType: 'flyer',
    pdfPath: 'media/flyer_campaign_990_inspiration.pdf',
    createdAt: '2026-08-01T12:00:00Z',
    updatedAt: '2026-08-03T16:00:00Z'
  }
];
fs.writeFileSync(path.join(tenantDir, 'marketing_campaigns.json'), JSON.stringify(campaigns, null, 2));

console.log('✓ Populated full active tenant records in data-tenant_nest_uat.');
