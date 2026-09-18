/**
 * Safe Nest Realty UAT Tenant Provisioner
 * Supports isolated acceptance tenants without destroying existing UAT data.
 * 
 * Usage:
 *   npx tsx scripts/provisionNestUatTenant.ts --tenant-id=tenant_nest_acceptance_20260803_run001 [--dry-run] [--overwrite] [--confirm=CONFIRM_PROVISION_RESET] [--run-id=RUN123]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const tenantIdArg = args.find(a => a.startsWith('--tenant-id='))?.split('=')[1] || 'tenant_nest_uat';
const runIdArg = args.find(a => a.startsWith('--run-id='))?.split('=')[1] || `run_${Date.now()}`;
const isDryRun = args.includes('--dry-run');
const isOverwrite = args.includes('--overwrite');
const confirmArg = args.find(a => a.startsWith('--confirm='))?.split('=')[1];

console.log(`========================================================================`);
console.log(`NEST REALTY SAFE UAT TENANT PROVISIONER`);
console.log(`Target Tenant ID: ${tenantIdArg}`);
console.log(`Run ID: ${runIdArg}`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (No disk writes)' : 'LIVE PROVISIONING'}`);
console.log(`========================================================================\n`);

const targetDir = path.join(process.cwd(), `data-${tenantIdArg}`);
const backupDir = path.join(process.cwd(), 'backups');

// Safety Check 1: Existing tenant protection
if (fs.existsSync(targetDir) && !isDryRun) {
  if (!isOverwrite || confirmArg !== 'CONFIRM_PROVISION_RESET') {
    console.error(`🚨 FATAL SAFETY ERROR: Tenant workspace '${tenantIdArg}' already exists at ${targetDir}.`);
    console.error(`To safely reset/overwrite, you MUST pass both --overwrite AND --confirm=CONFIRM_PROVISION_RESET.`);
    console.error(`Aborting provisioning to protect tenant data.`);
    process.exit(1);
  }

  // Backup existing directory before approved overwrite
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupTar = path.join(backupDir, `pre_provision_${tenantIdArg}_${Date.now()}.tar.gz`);
  console.log(`📦 Creating safety backup of existing tenant data at: ${backupTar}`);
  try {
    execSync(`tar -czf "${backupTar}" -C "${process.cwd()}" "data-${tenantIdArg}"`);
    console.log(`✓ Backup created successfully.`);
  } catch (e: any) {
    console.error(`🚨 Backup creation failed: ${e.message}. Aborting overwrite.`);
    process.exit(1);
  }
}

// Clean state schema initialization
const cleanStateFiles: Record<string, any> = {
  'marketing_campaigns.json': [],
  'operations_directory.json': [],
  'sop_documents.json': [],
  'oauth_tokens.json': [],
  'boundary_telemetry.json': [],
  'quickbooks_ledger.json': []
};

const receiptData = {
  tenantId: tenantIdArg,
  runId: runIdArg,
  provisionedAt: new Date().toISOString(),
  initialCampaignCount: 0,
  initialStaffCount: 0,
  initialSopCount: 0,
  initialOAuthTokenCount: 0,
  architecture: 'REQUEST_SCOPED_MULTITENANT_LOCAL_FILE_PERSISTENCE',
  status: 'CLEAN_UAT_PROVISIONED_EMPTY'
};

if (isDryRun) {
  console.log('[Dry-Run Output] Target directory to create:', targetDir);
  console.log('[Dry-Run Output] Clean state files to seed:');
  Object.keys(cleanStateFiles).forEach(file => console.log(`  - ${file}: [] (0 records)`));
  console.log('[Dry-Run Output] Audit Receipt:', JSON.stringify(receiptData, null, 2));
  console.log('\nDry-run complete. No files modified.');
  process.exit(0);
}

// Live Provisioning
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

for (const [filename, content] of Object.entries(cleanStateFiles)) {
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  console.log(`✓ Seeded clean tenant file: ${filename}`);
}

const receiptPath = path.join(targetDir, 'uat_provisioning_receipt.json');
fs.writeFileSync(receiptPath, JSON.stringify(receiptData, null, 2));
const receiptSha256 = crypto.createHash('sha256').update(fs.readFileSync(receiptPath)).digest('hex');

console.log(`✓ Generated immutable audit receipt: uat_provisioning_receipt.json`);
console.log(`✓ Receipt SHA-256 Checksum: ${receiptSha256}`);

console.log(`\n========================================================================`);
console.log(`SUCCESS: Clean tenant '${tenantIdArg}' provisioned successfully!`);
console.log(`Location: ${targetDir}`);
console.log(`Receipt Checksum: ${receiptSha256}`);
console.log(`========================================================================`);
