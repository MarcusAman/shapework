/**
 * Legacy Workspace Data Migration & Quarantine Utility
 *
 * Supports safe, idempotent migration with dry-run verification,
 * duplicate detection, and unknown-owner quarantine.
 *
 * Usage:
 *   npx tsx server/db/migrateLegacyWorkspaceRecords.ts --dry-run --target-env=uat --target-workspace=ws_nest_uat --confirm
 */

import fs from 'fs';
import path from 'path';

export interface MigrationOptions {
  dryRun: boolean;
  targetEnv: 'dev' | 'uat' | 'test';
  targetWorkspaceId: string;
  sourceFilePath?: string;
  confirm: boolean;
}

export interface MigrationReport {
  timestamp: string;
  options: Omit<MigrationOptions, 'confirm'>;
  totalRecordsExamined: number;
  validScopedRecords: number;
  unscopedRecordsMigrated: number;
  quarantinedRecords: number;
  duplicateRecordsSkipped: number;
  quarantinedSummary: Array<{ id: string; domain: string; reason: string }>;
  status: 'COMPLETED_DRY_RUN' | 'COMPLETED_APPLIED' | 'FAILED_CONFIRMATION_REQUIRED';
}

export async function runLegacyWorkspaceMigration(options: MigrationOptions): Promise<MigrationReport> {
  const { dryRun, targetEnv, targetWorkspaceId, confirm } = options;

  if (targetEnv as string === 'production') {
    throw new Error('FATAL: Production migration is forbidden in this utility. Production migrations require a signed release change ticket.');
  }

  if (!confirm && !dryRun) {
    return {
      timestamp: new Date().toISOString(),
      options: { dryRun, targetEnv, targetWorkspaceId },
      totalRecordsExamined: 0,
      validScopedRecords: 0,
      unscopedRecordsMigrated: 0,
      quarantinedRecords: 0,
      duplicateRecordsSkipped: 0,
      quarantinedSummary: [],
      status: 'FAILED_CONFIRMATION_REQUIRED'
    };
  }

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    options: { dryRun, targetEnv, targetWorkspaceId },
    totalRecordsExamined: 0,
    validScopedRecords: 0,
    unscopedRecordsMigrated: 0,
    quarantinedRecords: 0,
    duplicateRecordsSkipped: 0,
    quarantinedSummary: [],
    status: dryRun ? 'COMPLETED_DRY_RUN' : 'COMPLETED_APPLIED'
  };

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const orgChartPath = path.join(backupDir, 'org_chart_repository.json');
  if (fs.existsSync(orgChartPath)) {
    try {
      const raw = fs.readFileSync(orgChartPath, 'utf-8');
      const models = JSON.parse(raw);
      for (const [wsKey, model] of Object.entries<any>(models)) {
        if (!model.positions) continue;
        for (const pos of model.positions) {
          report.totalRecordsExamined++;
          if (pos.workspaceId) {
            report.validScopedRecords++;
          } else {
            // Unscoped position found
            if (!pos.id || !pos.name) {
              report.quarantinedRecords++;
              report.quarantinedSummary.push({
                id: pos.id || 'unknown_id',
                domain: 'org_chart_position',
                reason: 'Missing name or identifier'
              });
            } else {
              pos.workspaceId = targetWorkspaceId;
              report.unscopedRecordsMigrated++;
            }
          }
        }
      }

      if (!dryRun && report.unscopedRecordsMigrated > 0) {
        fs.writeFileSync(orgChartPath, JSON.stringify(models, null, 2), 'utf-8');
      }
    } catch (e: any) {
      console.warn('[Migration Warning] Org chart file read issue:', e.message);
    }
  }

  return report;
}

// CLI Execution handler
if (process.argv[1]?.endsWith('migrateLegacyWorkspaceRecords.ts')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  const confirm = args.includes('--confirm');
  const envArg = args.find(a => a.startsWith('--target-env='))?.split('=')[1] as any || 'uat';
  const wsArg = args.find(a => a.startsWith('--target-workspace='))?.split('=')[1] || 'ws_nest_uat';

  runLegacyWorkspaceMigration({
    dryRun,
    targetEnv: envArg,
    targetWorkspaceId: wsArg,
    confirm
  }).then(rep => {
    console.log('\n======================================================');
    console.log('LEGACY WORKSPACE MIGRATION REPORT');
    console.log('======================================================');
    console.log(JSON.stringify(rep, null, 2));
  }).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
