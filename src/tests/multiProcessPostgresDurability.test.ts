import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

describe('Multi-Process Isolated PostgreSQL Durability & Fail-Closed Suite', () => {
  const rootDir = process.cwd();

  // Helper to run code in an isolated Node child process
  function runInIsolatedProcess(scriptContent: string, envOverrides: Record<string, string> = {}) {
    const combinedEnv = {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      PERSISTENCE_DRIVER: 'postgres',
      STORAGE_DRIVER: 'database',
      APP_ENV: 'production',
      NODE_ENV: 'production',
      ...envOverrides
    };

    const res = spawnSync('npx', ['tsx', '-e', scriptContent], {
      cwd: rootDir,
      env: combinedEnv,
      encoding: 'utf-8',
      timeout: 15000
    });

    return res;
  }

  it('Phase 1 -> Phase 2: Process A writes preferences & staff absence; independent Process B reads from PostgreSQL', () => {
    const testUserId = `usr_durability_${Date.now()}`;
    const testStaffMelissa = `dir_staff_melissa_${Date.now()}`;
    const testStaffAnn = `dir_staff_ann_${Date.now()}`;

    // 1. Process A writes notification preferences and configures staff absence in PostgreSQL
    const processAScript = `
      import { saveUserNotificationPreferencesAsync } from './server/persistence/notificationPreferencesRepository.js';
      import { updateStaffMemberProfileAsync, setStaffMemberAbsenceAsync } from './server/persistence/operationsDirectoryRepository.js';

      async function run() {
        // Save notification preferences
        await saveUserNotificationPreferencesAsync({
          userId: '${testUserId}',
          workspaceId: 'ws_wilmington',
          emailEnabled: true,
          smsEnabled: false,
          preferredChannel: 'email',
          quietHoursStart: '20:30',
          quietHoursEnd: '06:30',
          timezone: 'America/New_York'
        });

        // Create Ann profile
        await updateStaffMemberProfileAsync('${testStaffAnn}', {
          id: '${testStaffAnn}',
          workspaceId: 'ws_wilmington',
          fullName: 'Ann Backup Gunn',
          title: 'Operations Coordinator',
          role: 'operations_coordinator',
          email: '${testStaffAnn}@nestrealty.com',
          phone: '+19105557788',
          avatarUrl: '',
          activeWorkloadCount: 1,
          maxWorkloadCapacity: 10,
          skills: ['Postcards'],
          status: 'active'
        });

        // Create Melissa profile
        await updateStaffMemberProfileAsync('${testStaffMelissa}', {
          id: '${testStaffMelissa}',
          workspaceId: 'ws_wilmington',
          fullName: 'Melissa OOO Gagliardi',
          title: 'Marketing Director',
          role: 'marketing_specialist',
          email: '${testStaffMelissa}@nestrealty.com',
          phone: '+19105559988',
          avatarUrl: '',
          activeWorkloadCount: 2,
          maxWorkloadCapacity: 10,
          skills: ['Flyers'],
          status: 'active'
        });

        // Set Melissa absence with Ann as backup
        await setStaffMemberAbsenceAsync('${testStaffMelissa}', true, '${testStaffAnn}', 'Annual conference trip');

        console.log('PROCESS_A_COMPLETE');
        process.exit(0);
      }

      run().catch(err => {
        console.error('PROCESS_A_FAILED:', err);
        process.exit(1);
      });
    `;

    const resA = runInIsolatedProcess(processAScript);
    expect(resA.status).toBe(0);
    expect(resA.stdout).toContain('PROCESS_A_COMPLETE');

    // 2. Process B is an independent Node OS process with fresh memory, connecting to PostgreSQL
    const processBScript = `
      import { getUserNotificationPreferencesAsync } from './server/persistence/notificationPreferencesRepository.js';
      import { getAllStaffMembersAsync } from './server/persistence/operationsDirectoryRepository.js';

      async function run() {
        const prefs = await getUserNotificationPreferencesAsync('${testUserId}');
        if (!prefs) {
          throw new Error('Preferences not found in PostgreSQL');
        }

        const staffList = await getAllStaffMembersAsync();
        const melissa = staffList.find(s => s.id === '${testStaffMelissa}');
        if (!melissa) {
          throw new Error('Staff Melissa not found in PostgreSQL');
        }

        console.log('VERIFIED_PREFS:' + JSON.stringify(prefs));
        console.log('VERIFIED_STAFF:' + JSON.stringify({
          status: melissa.status,
          backupStaffId: melissa.backupStaffId,
          backupStaffName: melissa.backupStaffName,
          outOfOfficeReason: melissa.outOfOfficeReason
        }));
        process.exit(0);
      }

      run().catch(err => {
        console.error('PROCESS_B_FAILED:', err);
        process.exit(1);
      });
    `;

    const resB = runInIsolatedProcess(processBScript);
    expect(resB.status).toBe(0);
    expect(resB.stdout).toContain('VERIFIED_PREFS:');
    expect(resB.stdout).toContain(`"userId":"${testUserId}"`);
    expect(resB.stdout).toContain('"emailEnabled":true');
    expect(resB.stdout).toContain('"smsEnabled":false');
    expect(resB.stdout).toContain('"quietHoursStart":"20:30"');
    expect(resB.stdout).toContain('"quietHoursEnd":"06:30"');

    expect(resB.stdout).toContain('VERIFIED_STAFF:');
    expect(resB.stdout).toContain('"status":"out_of_office"');
    expect(resB.stdout).toContain(`"backupStaffId":"${testStaffAnn}"`);
    expect(resB.stdout).toContain('"backupStaffName":"Ann Backup Gunn"');
    expect(resB.stdout).toContain('"outOfOfficeReason":"Annual conference trip"');
  });

  it('Phase 3 -> Phase 4: Multi-process design review proof lifecycle persists across independent processes', () => {
    const taskId = `tsk_durability_proof_${Date.now()}`;
    const reqId = `req_durability_proof_${Date.now()}`;

    // Process 1: Creates request and task, submits Proof v1
    const p1Script = `
      import {
        saveCanonicalMarketingRequest,
        saveCanonicalMarketingTask,
        submitCanonicalMarketingTaskProof
      } from './server/persistence/marketingCampaignsRepository.js';

      async function run() {
        saveCanonicalMarketingRequest({
          id: '${reqId}',
          title: 'Durability Listing Package',
          channel: 'web',
          status: 'in_progress',
          taskIds: ['${taskId}'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        saveCanonicalMarketingTask({
          id: '${taskId}',
          requestId: '${reqId}',
          title: 'Flyer Design',
          status: 'in_progress',
          assignedTo: 'Eduardo Lovo',
          assignedToId: 'staff_eduardo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        submitCanonicalMarketingTaskProof(
          '${taskId}',
          'https://storage.googleapis.com/proofs/flyer_v1.pdf',
          'Initial proof draft',
          { id: 'staff_eduardo', name: 'Eduardo Lovo' }
        );

        console.log('PROCESS_1_PROOF_SUBMITTED');
        process.exit(0);
      }
      run().catch(e => { console.error(e); process.exit(1); });
    `;
    const res1 = runInIsolatedProcess(p1Script);
    expect(res1.status).toBe(0);
    expect(res1.stdout).toContain('PROCESS_1_PROOF_SUBMITTED');

    // Process 2: Reviewer requests revisions with required feedback note
    const p2Script = `
      import {
        getCanonicalMarketingTaskById,
        requestCanonicalMarketingTaskRevisions
      } from './server/persistence/marketingCampaignsRepository.js';

      async function run() {
        const t = getCanonicalMarketingTaskById('${taskId}');
        if (!t) throw new Error('Task not found');
        if (t.status !== 'in_progress' || t.reviewState !== 'awaiting_review') {
          throw new Error('Unexpected task state before review: ' + t.status + ' / ' + t.reviewState);
        }

        requestCanonicalMarketingTaskRevisions(
          '${taskId}',
          'Please update headline font and price tag',
          { id: 'staff_melissa', name: 'Melissa Gagliardi' }
        );

        console.log('PROCESS_2_REVISIONS_REQUESTED');
        process.exit(0);
      }
      run().catch(e => { console.error(e); process.exit(1); });
    `;
    const res2 = runInIsolatedProcess(p2Script);
    expect(res2.status).toBe(0);
    expect(res2.stdout).toContain('PROCESS_2_REVISIONS_REQUESTED');

    // Process 3: Producer sees revisions_requested (status remains in_progress!), resubmits proof v2
    const p3Script = `
      import {
        getCanonicalMarketingTaskById,
        submitCanonicalMarketingTaskProof
      } from './server/persistence/marketingCampaignsRepository.js';

      async function run() {
        const t = getCanonicalMarketingTaskById('${taskId}');
        if (!t) throw new Error('Task not found');
        if (t.status !== 'in_progress' || t.reviewState !== 'revisions_requested') {
          throw new Error('Task must remain in_progress under revisions_requested: ' + t.status + ' / ' + t.reviewState);
        }

        submitCanonicalMarketingTaskProof(
          '${taskId}',
          'https://storage.googleapis.com/proofs/flyer_v2.pdf',
          'Addressed headline font and price tag',
          { id: 'staff_eduardo', name: 'Eduardo Lovo' }
        );

        console.log('PROCESS_3_PROOF_V2_SUBMITTED');
        process.exit(0);
      }
      run().catch(e => { console.error(e); process.exit(1); });
    `;
    const res3 = runInIsolatedProcess(p3Script);
    expect(res3.status).toBe(0);
    expect(res3.stdout).toContain('PROCESS_3_PROOF_V2_SUBMITTED');

    // Process 4: Reviewer verifies history and approves proof
    const p4Script = `
      import {
        getCanonicalMarketingTaskById,
        approveCanonicalMarketingTaskProof
      } from './server/persistence/marketingCampaignsRepository.js';

      async function run() {
        const t = getCanonicalMarketingTaskById('${taskId}');
        if (!t) throw new Error('Task not found');
        if (t.proofVersion !== 2) throw new Error('Proof version expected 2, got: ' + t.proofVersion);
        if (t.reviewState !== 'awaiting_review') throw new Error('Expected awaiting_review, got: ' + t.reviewState);

        approveCanonicalMarketingTaskProof(
          '${taskId}',
          'Looks great! Approved.',
          { id: 'staff_melissa', name: 'Melissa Gagliardi' }
        );

        const approved = getCanonicalMarketingTaskById('${taskId}');
        console.log('PROCESS_4_APPROVED:' + JSON.stringify({
          status: approved.status,
          reviewState: approved.reviewState,
          proofVersion: approved.proofVersion,
          proofHistoryCount: approved.proofHistory?.length,
          reviewHistoryCount: approved.reviewHistory?.length
        }));
        process.exit(0);
      }
      run().catch(e => { console.error(e); process.exit(1); });
    `;
    const res4 = runInIsolatedProcess(p4Script);
    expect(res4.status).toBe(0);
    expect(res4.stdout).toContain('PROCESS_4_APPROVED:');
    expect(res4.stdout).toContain('"status":"in_progress"');
    expect(res4.stdout).toContain('"reviewState":"approved"');
    expect(res4.stdout).toContain('"proofVersion":2');
    expect(res4.stdout).toContain('"proofHistoryCount":2');
  });

  it('Fail-Closed Enforcement: Throws immediately on DB connection failure without writing fallback files', () => {
    const invalidDbUrl = 'postgres://marcusaman@127.0.0.1:54329/invalid_port_fail_closed';
    const sentinelId = `usr_fail_closed_sentinel_${Date.now()}`;

    const failClosedScript = `
      import { saveUserNotificationPreferencesAsync } from './server/persistence/notificationPreferencesRepository.js';

      async function run() {
        try {
          await saveUserNotificationPreferencesAsync({
            userId: '${sentinelId}',
            emailEnabled: true,
            smsEnabled: true,
            preferredChannel: 'both',
            quietHoursStart: '21:00',
            quietHoursEnd: '08:00',
            timezone: 'America/New_York'
          });
          console.log('UNEXPECTED_SUCCESS');
          process.exit(1);
        } catch (err) {
          console.log('EXPECTED_DB_FAILURE:' + (err.message || err));
          process.exit(0);
        }
      }

      run();
    `;

    const res = runInIsolatedProcess(failClosedScript, { DATABASE_URL: invalidDbUrl });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('EXPECTED_DB_FAILURE:');
    expect(res.stdout).not.toContain('UNEXPECTED_SUCCESS');

    // Confirm that the sentinel was NEVER written to local disk fallback files
    const localFile = path.join(rootDir, 'data', 'user_notification_preferences.json');
    if (fs.existsSync(localFile)) {
      const contents = fs.readFileSync(localFile, 'utf-8');
      expect(contents).not.toContain(sentinelId);
    }
  });
});
