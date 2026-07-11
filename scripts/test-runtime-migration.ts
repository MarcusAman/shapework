import { migrateLegacyToRuntime, syncRuntimeToLegacy } from '../server/headless/migrationService.js';

function runTests() {
  console.log('--- RUNNING INTEGRATION TESTS FOR RUNTIME MIGRATION ---');

  // 1. Mock DB State Setup
  const mockDbState: any = {
    workItems: [
      {
        id: 'wi_legacy_1',
        workspaceId: 'nest-realty-demo',
        title: 'Legacy Task 1',
        status: 'pending',
        ownerRole: 'operations_lead',
        priority: 'high',
        approvalRequired: true,
        createdAt: new Date().toISOString()
      }
    ],
    actionProposals: [
      {
        id: 'ap_legacy_1',
        workspaceId: 'nest-realty-demo',
        title: 'Send Campaign Email',
        state: 'suggested',
        recipient: 'client@example.com',
        subject: 'Campaign Update',
        body: 'Body text here',
        created_at: new Date().toISOString()
      }
    ],
    shapeworkJobs: [],
    shapeworkJobSteps: [],
    approvals: [],
    outcomes: [],
    receipts: [],
    ownerBriefItems: []
  };

  // 2. Test Legacy-to-Runtime Migration
  console.log('Testing migrateLegacyToRuntime...');
  migrateLegacyToRuntime(mockDbState);

  if (mockDbState.shapeworkJobs.length === 0) {
    throw new Error('Migration failed: no shapeworkJobs created.');
  }
  const job = mockDbState.shapeworkJobs[0];
  console.log('✓ Successfully migrated workItems to shapeworkJobs:', job.id);

  if (mockDbState.approvals.length === 0) {
    throw new Error('Migration failed: no approvals created.');
  }
  const approval = mockDbState.approvals[0];
  console.log('✓ Successfully migrated actionProposals to approvals:', approval.id);

  // 3. Test Idempotency
  console.log('Testing idempotency of migrateLegacyToRuntime...');
  const initialJobCount = mockDbState.shapeworkJobs.length;
  const initialApprovalCount = mockDbState.approvals.length;

  migrateLegacyToRuntime(mockDbState);

  if (mockDbState.shapeworkJobs.length !== initialJobCount) {
    throw new Error('Migration is not idempotent: duplicate jobs created.');
  }
  if (mockDbState.approvals.length !== initialApprovalCount) {
    throw new Error('Migration is not idempotent: duplicate approvals created.');
  }
  console.log('✓ Migration is fully idempotent (no duplicate records generated on re-run).');

  // 4. Test Runtime-to-Legacy Synchronization
  console.log('Testing syncRuntimeToLegacy...');
  // Modify a job status in runtime
  mockDbState.shapeworkJobs[0].status = 'completed';
  
  syncRuntimeToLegacy(mockDbState);

  const syncedWorkItem = mockDbState.workItems.find((w: any) => w.id === 'wi_legacy_1');
  if (!syncedWorkItem || syncedWorkItem.status !== 'completed') {
    throw new Error('Sync failed: workItems status did not update to completed.');
  }
  console.log('✓ Synchronizer successfully projected runtime state back to legacy arrays.');

  console.log('--- ALL RUNTIME MIGRATION TESTS PASSED ---');
}

try {
  runTests();
  process.exit(0);
} catch (error: any) {
  console.error('❌ Integration Tests Failed:', error.message);
  process.exit(1);
}
