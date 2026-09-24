import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import pg from 'pg';
import {
  acquireInboundProcessingLease,
  completeInboundProcessing,
  acquireInboundActionClaim,
  completeInboundActionClaim,
  getInboundEmailRecord
} from '../../server/persistence/inboundEmailLedger.js';
import {
  createOutboxEvent,
  dispatchOutboxEvent,
  getOutboxEvent
} from '../../server/persistence/outboundNotificationOutbox.js';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

describe('Multi-Process Email Idempotency & Concurrency Verification', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  // ---------------------------------------------------------------------------
  // LEVEL 1: In-Process High-Concurrency (20 concurrent workers)
  // ---------------------------------------------------------------------------
  describe('Level 1: In-Process High-Concurrency (20 Workers)', () => {
    it('1. Exactly 1 of 20 concurrent workers acquires top-level inbound lease on PostgreSQL', async () => {
      const testMsgId = `lvl1_lease_${Date.now()}`;
      const rfcId = `<${testMsgId}@shapework.co>`;

      const workers = Array.from({ length: 20 }, (_, i) => i + 1);

      // Launch 20 concurrent lease acquisition attempts simultaneously
      const results = await Promise.all(
        workers.map(workerNum =>
          acquireInboundProcessingLease(
            {
              provider: 'google_workspace',
              mailboxId: 'asknora@nestrealty.com',
              providerMessageId: testMsgId,
              rfcMessageId: rfcId,
              fromEmail: 'marcus@shapework.co',
              subject: 'Level 1 20-worker concurrency test',
              intent: 'conversational_question'
            },
            `worker_${workerNum}`,
            30000
          )
        )
      );

      const acquired = results.filter(r => r.acquired);
      const rejected = results.filter(r => !r.acquired);

      expect(acquired.length).toBe(1);
      expect(rejected.length).toBe(19);

      // Verify PostgreSQL ledger state
      const dbRow = await pool.query(
        'SELECT * FROM nora_inbound_email_ledger WHERE provider_message_id = $1',
        [testMsgId]
      );
      expect(dbRow.rows.length).toBe(1);
      expect(dbRow.rows[0].status).toBe('processing');
      expect(dbRow.rows[0].lease_owner).toBe(acquired[0].leaseOwner);
      expect(Number(dbRow.rows[0].attempt_count)).toBe(1);

      // Complete the lease
      await completeInboundProcessing(testMsgId, 'asknora@nestrealty.com', {
        status: 'completed',
        replyMessageId: `<reply.${testMsgId}@nestrealty.com>`
      });

      // Subsequent attempt must be rejected because status is completed
      const postComplete = await acquireInboundProcessingLease(
        {
          provider: 'google_workspace',
          mailboxId: 'asknora@nestrealty.com',
          providerMessageId: testMsgId,
          fromEmail: 'marcus@shapework.co'
        },
        'worker_post_complete'
      );
      expect(postComplete.acquired).toBe(false);
      expect(postComplete.reason).toContain('finalized');
    });

    it('2. Exactly 1 of 20 concurrent workers acquires fine-grained sub-action claim', async () => {
      const testMsgId = `lvl1_action_${Date.now()}`;
      const actionType = 'conversational_reply';

      const workers = Array.from({ length: 20 }, (_, i) => i + 1);

      // Launch 20 concurrent sub-action claim attempts
      const results = await Promise.all(
        workers.map(workerNum =>
          acquireInboundActionClaim({
            mailboxId: 'asknora@nestrealty.com',
            providerMessageId: testMsgId,
            actionType,
            actionVersion: 1,
            claimedBy: `action_worker_${workerNum}`
          })
        )
      );

      const successful = results.filter(Boolean);
      const denied = results.filter(r => !r);

      expect(successful.length).toBe(1);
      expect(denied.length).toBe(19);

      // Verify PostgreSQL sub-action ledger
      const dbRows = await pool.query(
        'SELECT * FROM nora_inbound_actions_ledger WHERE provider_message_id = $1 AND action_type = $2',
        [testMsgId, actionType]
      );
      expect(dbRows.rows.length).toBe(1);
      expect(dbRows.rows[0].status).toBe('processing');

      // Complete the sub-action
      await completeInboundActionClaim({
        mailboxId: 'asknora@nestrealty.com',
        providerMessageId: testMsgId,
        actionType,
        actionVersion: 1,
        resultSummary: { success: true, processedAt: new Date().toISOString() }
      });

      const updatedRow = await pool.query(
        'SELECT * FROM nora_inbound_actions_ledger WHERE provider_message_id = $1 AND action_type = $2',
        [testMsgId, actionType]
      );
      expect(updatedRow.rows[0].status).toBe('completed');
    });

    it('3. Exactly 1 of 20 concurrent workers creates an outbox event (state-transition unique constraint)', async () => {
      const entityId = `lvl1_outbox_${Date.now()}`;

      const workers = Array.from({ length: 20 }, (_, i) => i + 1);

      const results = await Promise.all(
        workers.map(workerNum =>
          createOutboxEvent({
            workspaceId: 'nest_realty',
            entityType: 'email_thread',
            entityId,
            entityStateVersion: 1,
            notificationType: 'conversational_reply',
            recipientEmail: 'marcus@shapework.co',
            recipientName: 'Marcus Aman',
            subject: 'Level 1 Outbox Concurrency Test',
            payload: { text: `Hello from worker ${workerNum}` }
          })
        )
      );

      const created = results.filter(r => r.created);
      const conflicts = results.filter(r => !r.created);

      expect(created.length).toBe(1);
      expect(conflicts.length).toBe(19);

      // Verify that the conflict reason clearly indicates state transition duplicate
      for (const conflict of conflicts) {
        expect(conflict.reason).toMatch(/State transition already recorded|duplicate prevented/);
      }

      // Verify exactly 1 record in Postgres
      const outboxRows = await pool.query(
        'SELECT * FROM nora_outbound_event_outbox WHERE entity_id = $1',
        [entityId]
      );
      expect(outboxRows.rows.length).toBe(1);
      expect(outboxRows.rows[0].state).toBe('pending');
    });
  });

  // ---------------------------------------------------------------------------
  // LEVEL 2: Multi-Process Concurrency (5 Independent OS Child Processes)
  // ---------------------------------------------------------------------------
  describe('Level 2: Multi-Process OS Concurrency (5 Independent Child Processes)', () => {
    it('Spawns 5 independent Node processes simultaneously competing for the same PostgreSQL lease & outbox event', async () => {
      const multiProcessTestId = `mp_test_${Date.now()}`;
      const rootDir = process.cwd();

      // Script each child process will execute
      const childWorkerScript = `
        import { acquireInboundProcessingLease } from './server/persistence/inboundEmailLedger.js';
        import { createOutboxEvent } from './server/persistence/outboundNotificationOutbox.js';
        import { getDbPool } from './server/persistence/repositories.js';

        async function main() {
          const testId = '${multiProcessTestId}';
          const pid = process.pid;

          // 1. Compete for inbound lease
          const leaseRes = await acquireInboundProcessingLease({
            provider: 'google_workspace',
            mailboxId: 'asknora@nestrealty.com',
            providerMessageId: testId,
            rfcMessageId: '<' + testId + '@shapework.co>',
            fromEmail: 'marcus@shapework.co',
            subject: 'Multi-process OS test',
            intent: 'conversational_question'
          }, 'proc_' + pid, 60000);

          // 2. Compete for outbound outbox event
          const outboxRes = await createOutboxEvent({
            workspaceId: 'nest_realty',
            entityType: 'multi_process_lead',
            entityId: testId,
            entityStateVersion: 1,
            notificationType: 'lead_confirmation',
            recipientEmail: 'marcus@shapework.co',
            recipientName: 'Marcus Aman',
            subject: 'Multi-process test outbox',
            payload: { text: 'Dispatched by PID ' + pid }
          });

          // Close connection pool to cleanly exit
          const pool = getDbPool();
          if (pool) {
            await pool.end();
          }

          console.log('RESULT_JSON:' + JSON.stringify({
            pid,
            leaseAcquired: leaseRes.acquired,
            outboxCreated: outboxRes.created
          }));
          process.exit(0);
        }

        main().catch(err => {
          console.error('WORKER_ERROR:', err);
          process.exit(1);
        });
      `;

      // Helper function to run child process
      function spawnWorker(): Promise<{ pid: number; leaseAcquired: boolean; outboxCreated: boolean }> {
        return new Promise((resolve, reject) => {
          const env = {
            ...process.env,
            DATABASE_URL: TEST_DB_URL,
            NODE_ENV: 'test',
            OUTBOUND_MASTER_MODE: 'disabled',
            NORA_AUTOMATION_MODE: 'hold'
          };

          const cp = spawn('npx', ['tsx', '-e', childWorkerScript], {
            cwd: rootDir,
            env,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let stdout = '';
          let stderr = '';

          cp.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          cp.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          cp.on('close', (code) => {
            if (code !== 0) {
              return reject(new Error(`Child process failed with code ${code}: ${stderr}`));
            }
            const match = stdout.match(/RESULT_JSON:(.*)/);
            if (!match) {
              return reject(new Error(`Child process produced no valid result JSON: ${stdout} ${stderr}`));
            }
            try {
              const parsed = JSON.parse(match[1]);
              resolve(parsed);
            } catch (err: any) {
              reject(new Error(`Failed to parse result JSON: ${err.message}`));
            }
          });
        });
      }

      // Launch 5 child processes concurrently!
      const workerPromises = [
        spawnWorker(),
        spawnWorker(),
        spawnWorker(),
        spawnWorker(),
        spawnWorker()
      ];

      const workerResults = await Promise.all(workerPromises);
      console.log('[Level 2 Proof] 5 Child Processes Results:', JSON.stringify(workerResults, null, 2));

      expect(workerResults.length).toBe(5);

      // Verify lease mutual exclusion across separate OS processes
      const leaseAcquisitions = workerResults.filter(w => w.leaseAcquired);
      const leaseRejections = workerResults.filter(w => !w.leaseAcquired);

      expect(leaseAcquisitions.length).toBe(1);
      expect(leaseRejections.length).toBe(4);

      // Verify outbox mutual exclusion across separate OS processes
      const outboxCreations = workerResults.filter(w => w.outboxCreated);
      const outboxConflicts = workerResults.filter(w => !w.outboxCreated);

      expect(outboxCreations.length).toBe(1);
      expect(outboxConflicts.length).toBe(4);

      // Verify PostgreSQL ledger database records
      const leaseRows = await pool.query(
        'SELECT * FROM nora_inbound_email_ledger WHERE provider_message_id = $1',
        [multiProcessTestId]
      );
      expect(leaseRows.rows.length).toBe(1);
      expect(leaseRows.rows[0].status).toBe('processing');
      expect(leaseRows.rows[0].lease_owner).toBe(`proc_${leaseAcquisitions[0].pid}`);

      const outboxRows = await pool.query(
        'SELECT * FROM nora_outbound_event_outbox WHERE entity_id = $1',
        [multiProcessTestId]
      );
      expect(outboxRows.rows.length).toBe(1);
      expect(outboxRows.rows[0].state).toBe('pending');
    });

    it('Mixed email with photos and question: triggers exactly 1 asset confirmation and 1 conversational reply across competing workers', async () => {
      const mixedMsgId = `mixed_msg_${Date.now()}`;
      const mailboxId = 'asknora@nestrealty.com';
      const sender = 'marcus@shapework.co';

      // 1. Worker 1 acquires top-level lease
      const lease1 = await acquireInboundProcessingLease({
        provider: 'google_workspace',
        mailboxId,
        providerMessageId: mixedMsgId,
        rfcMessageId: `<${mixedMsgId}@shapework.co>`,
        fromEmail: sender,
        subject: 'Here are the listing photos and what is the open house time?',
        intent: 'conversational_question'
      }, 'worker_1', 30000);
      expect(lease1.acquired).toBe(true);

      // 2. Sub-action 1: Asset Confirmation
      const claimPhoto1 = await acquireInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'asset_confirmation',
        actionVersion: 1,
        claimedBy: 'worker_1'
      });
      expect(claimPhoto1).toBe(true);

      // Competing worker 2 tries to claim asset confirmation - must be rejected
      const claimPhoto2 = await acquireInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'asset_confirmation',
        actionVersion: 1,
        claimedBy: 'worker_2'
      });
      expect(claimPhoto2).toBe(false);

      // Create outbox event for asset confirmation
      const outboxPhoto1 = await createOutboxEvent({
        workspaceId: 'nest_realty',
        entityType: 'inbound_email',
        entityId: mixedMsgId,
        entityStateVersion: 1,
        notificationType: 'asset_confirmation',
        recipientEmail: sender,
        subject: 'Photos Received - Nora'
      });
      expect(outboxPhoto1.created).toBe(true);

      // Complete sub-action 1
      await completeInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'asset_confirmation',
        actionVersion: 1,
        resultSummary: { filesCount: 3 }
      });

      // 3. Sub-action 2: Conversational Question Reply
      const claimReply1 = await acquireInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'conversational_reply',
        actionVersion: 1,
        claimedBy: 'worker_1'
      });
      expect(claimReply1).toBe(true);

      // Competing worker 2 tries to claim conversational reply - must be rejected
      const claimReply2 = await acquireInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'conversational_reply',
        actionVersion: 1,
        claimedBy: 'worker_2'
      });
      expect(claimReply2).toBe(false);

      // Create outbox event for conversational reply
      const outboxReply1 = await createOutboxEvent({
        workspaceId: 'nest_realty',
        entityType: 'inbound_email',
        entityId: mixedMsgId,
        entityStateVersion: 1,
        notificationType: 'conversational_reply',
        recipientEmail: sender,
        subject: 'Re: Open house time - Nora'
      });
      expect(outboxReply1.created).toBe(true);

      // Complete sub-action 2
      await completeInboundActionClaim({
        mailboxId,
        providerMessageId: mixedMsgId,
        actionType: 'conversational_reply',
        actionVersion: 1,
        resultSummary: { answered: true }
      });

      // 4. Competing worker tries to create duplicate outbox entries for both
      const dupPhoto = await createOutboxEvent({
        workspaceId: 'nest_realty',
        entityType: 'inbound_email',
        entityId: mixedMsgId,
        entityStateVersion: 1,
        notificationType: 'asset_confirmation',
        recipientEmail: sender,
        subject: 'Photos Received - Nora (DUPLICATE)'
      });
      expect(dupPhoto.created).toBe(false);

      const dupReply = await createOutboxEvent({
        workspaceId: 'nest_realty',
        entityType: 'inbound_email',
        entityId: mixedMsgId,
        entityStateVersion: 1,
        notificationType: 'conversational_reply',
        recipientEmail: sender,
        subject: 'Re: Open house time - Nora (DUPLICATE)'
      });
      expect(dupReply.created).toBe(false);

      // 5. Verify Postgres outbox has EXACTLY 1 asset confirmation and EXACTLY 1 conversational reply
      const allOutboxRows = await pool.query(
        'SELECT notification_type, state FROM nora_outbound_event_outbox WHERE entity_id = $1 ORDER BY notification_type ASC',
        [mixedMsgId]
      );
      expect(allOutboxRows.rows.length).toBe(2);
      expect(allOutboxRows.rows[0].notification_type).toBe('asset_confirmation');
      expect(allOutboxRows.rows[1].notification_type).toBe('conversational_reply');

      // Complete top-level lease
      await completeInboundProcessing(mixedMsgId, mailboxId, {
        status: 'completed',
        replyMessageId: outboxReply1.event?.deterministicRfcMessageId
      });

      const finalLedger = await pool.query(
        'SELECT status FROM nora_inbound_email_ledger WHERE provider_message_id = $1',
        [mixedMsgId]
      );
      expect(finalLedger.rows[0].status).toBe('completed');
    });
  });
});
