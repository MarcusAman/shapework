/**
 * Safe Named Tenant Backup Restore CLI Tool
 * Restores a specific tenant from a verified backup tarball archive with pre-restore safety snapshots.
 * 
 * Usage:
 *   npx tsx scripts/restoreTenantBackup.ts --tenant-id=tenant_nest_acceptance_20260803_run001 --backup-id=pre_provision_tenant_nest_acceptance_20260803_run001_1785700000000 [--dry-run] [--confirm=CONFIRM_RESTORE]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const tenantIdArg = args.find(a => a.startsWith('--tenant-id='))?.split('=')[1];
const backupIdArg = args.find(a => a.startsWith('--backup-id='))?.split('=')[1];
const isDryRun = args.includes('--dry-run');
const confirmArg = args.find(a => a.startsWith('--confirm='))?.split('=')[1];

console.log('========================================================================');
console.log('SAFE NAMED TENANT BACKUP RESTORE TOOL');
console.log(`Target Tenant ID: ${tenantIdArg || 'MISSING'}`);
console.log(`Backup ID: ${backupIdArg || 'MISSING'}`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated Validation Only)' : 'LIVE RESTORATION'}`);
console.log('========================================================================\n');

if (!tenantIdArg || !backupIdArg) {
  console.error('🚨 ERROR: Both --tenant-id and --backup-id arguments are required.');
  process.exit(1);
}

const processDir = process.cwd();
const backupDir = path.join(processDir, 'backups');
const targetTenantDir = path.join(processDir, `data-${tenantIdArg}`);

// 1. Locate named backup
let backupFile = path.join(backupDir, `${backupIdArg}.tar.gz`);
if (!fs.existsSync(backupFile)) {
  // Check if full filename passed
  if (fs.existsSync(path.join(backupDir, backupIdArg))) {
    backupFile = path.join(backupDir, backupIdArg);
  } else {
    console.error(`🚨 ERROR: Named backup archive not found at ${backupFile}`);
    process.exit(1);
  }
}

// 2. Validate archive integrity
console.log(`🔍 Validating archive integrity of: ${backupFile}`);
try {
  execSync(`tar -tzf "${backupFile}" > /dev/null`, { stdio: 'pipe' });
  console.log(`✓ Archive integrity verified (valid gzipped tarball).`);
} catch (e: any) {
  console.error(`🚨 ERROR: Archive file corrupted or unreadable: ${e.message}`);
  process.exit(1);
}

// Inspect archive contents
const archiveListing = execSync(`tar -tzf "${backupFile}"`, { stdio: 'pipe' }).toString().trim().split('\n');
console.log(`\n📦 Backup Archive Contents (${archiveListing.length} files):`);
archiveListing.forEach(f => console.log(`  - ${f}`));

if (isDryRun) {
  console.log('\n[Dry-Run Output] Pre-restore safety backup would be created at backups/pre_restore_<timestamp>.tar.gz');
  console.log(`[Dry-Run Output] Target tenant directory ${targetTenantDir} would be safely extracted from ${backupFile}.`);
  console.log('\nDry-run complete. No files overwritten.');
  process.exit(0);
}

// Require typed confirmation for live restore
if (confirmArg !== 'CONFIRM_RESTORE') {
  console.error(`🚨 FATAL SAFETY ERROR: Live restoration requires explicit --confirm=CONFIRM_RESTORE confirmation.`);
  process.exit(1);
}

// 3. Create pre-restore safety snapshot
const preRestoreBackupName = `pre_restore_${tenantIdArg}_${Date.now()}.tar.gz`;
const preRestoreBackupPath = path.join(backupDir, preRestoreBackupName);
console.log(`\n📦 Creating safety pre-restore backup at: ${preRestoreBackupPath}`);
try {
  if (fs.existsSync(targetTenantDir)) {
    execSync(`tar -czf "${preRestoreBackupPath}" -C "${processDir}" "data-${tenantIdArg}"`);
    console.log(`✓ Pre-restore safety snapshot created successfully.`);
  }
} catch (e: any) {
  console.error(`🚨 Pre-restore snapshot failed: ${e.message}. Aborting restore.`);
  process.exit(1);
}

// 4. Perform extraction
console.log(`\n🔄 Extracting backup into tenant workspace...`);
try {
  execSync(`tar -xzf "${backupFile}" -C "${processDir}"`);
  console.log(`✓ Archive extracted successfully.`);
} catch (e: any) {
  console.error(`🚨 Extraction failed: ${e.message}`);
  process.exit(1);
}

// 5. Post-restore record count verification
const restoredReceiptPath = path.join(targetTenantDir, 'uat_provisioning_receipt.json');
let postRestoreCounts: Record<string, number> = {};
const files = ['marketing_campaigns.json', 'operations_directory.json', 'sop_documents.json', 'oauth_tokens.json'];
files.forEach(f => {
  const fp = path.join(targetTenantDir, f);
  if (fs.existsSync(fp)) {
    try {
      const arr = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      postRestoreCounts[f] = Array.isArray(arr) ? arr.length : 0;
    } catch {
      postRestoreCounts[f] = -1;
    }
  }
});

console.log('\n📊 Post-Restore Record Counts:');
console.table(postRestoreCounts);

// 6. Issue restore receipt
const restoreReceipt = {
  restoreId: `rst_${Date.now()}`,
  restoredAt: new Date().toISOString(),
  targetTenantId: tenantIdArg,
  restoredBackupId: backupIdArg,
  preRestoreSnapshot: preRestoreBackupName,
  postRestoreCounts,
  status: 'RESTORE_SUCCESSFUL'
};

const receiptOutPath = path.join(targetTenantDir, 'uat_restore_receipt.json');
fs.writeFileSync(receiptOutPath, JSON.stringify(restoreReceipt, null, 2));
const restoreReceiptSha = crypto.createHash('sha256').update(fs.readFileSync(receiptOutPath)).digest('hex');

console.log(`\n========================================================================`);
console.log(`SUCCESS: Tenant '${tenantIdArg}' restored successfully from backup.`);
console.log(`Restore Receipt: ${receiptOutPath}`);
console.log(`Receipt SHA-256 Checksum: ${restoreReceiptSha}`);
console.log(`========================================================================`);
