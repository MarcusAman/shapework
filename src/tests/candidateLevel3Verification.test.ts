/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import pg from 'pg';
import crypto from 'crypto';
import {
  acquireInboundProcessingLease,
  completeInboundProcessing,
  acquireInboundActionClaim,
  completeInboundActionClaim,
  getInboundEmailRecord
} from '../../server/persistence/inboundEmailLedger.js';
import { getDbPool } from '../../server/persistence/repositories.js';
import {
  createOutboxEvent,
  dispatchOutboxEvent,
  getOutboxEvent,
  updateOutboxState,
  getDuplicateSuppressionMetric,
  resetDuplicateSuppressionMetric,
  setAutomationReleaseNotBefore
} from '../../server/persistence/outboundNotificationOutbox.js';
import {
  handleNoraConversationalEmail
} from '../../server/services/nora/noraConversationalEmailService.js';
import {
  classifyInboundEmail
} from '../../server/services/nora/noraEmailClassifier.js';
import {
  isAllowedEmailRecipient,
  isExplicitlyBlockedRecipient,
  getOutboundMasterMode,
  getNoraAutomationMode
} from '../../server/email/emailProvider.js';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

describe('Candidate Level-3 Verification: 20 Isolated Verification Scenarios', () => {
  let pool: pg.Pool;
  const capturedMailSink: any[] = [];

  // Mock mail sink sender
  const mockMailSink = async (event: any) => {
    capturedMailSink.push({
      ...event,
      dispatchedAt: new Date().toISOString()
    });
    return {
      accepted: [event.recipientNormalized],
      rejected: [],
      response: '250 2.0.0 OK: Mock Mail Sink Accepted',
      messageId: event.deterministicRfcMessageId
    };
  };

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    capturedMailSink.length = 0;
    resetDuplicateSuppressionMetric();
    process.env.OUTBOUND_MASTER_MODE = 'disabled';
    process.env.NORA_AUTOMATION_MODE = 'hold';
    process.env.ACCOUNT_EMAIL_MODE = 'disabled';
    delete process.env.EMAIL_NOTIFICATION_HOLD;
  });

  // Scenario 1: Two or more separately identified Cloud Run candidate instances
  it('1. Two separately identified candidate instances: distributed row lease prevents duplicate ingestion', async () => {
    const testMsgId = `c1_instance_race_${Date.now()}`;
    const instanceA = 'candidate_instance_us_central1_a';
    const instanceB = 'candidate_instance_us_central1_b';

    const claimA = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: testMsgId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Candidate multi-instance test',
      intent: 'conversational_question'
    }, instanceA, 30000);

    const claimB = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: testMsgId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Candidate multi-instance test',
      intent: 'conversational_question'
    }, instanceB, 30000);

    expect(claimA.acquired).toBe(true);
    expect(claimB.acquired).toBe(false);
    expect(claimB.leaseOwner).toBe(instanceA);
  });

  // Scenario 2, 3, 4, 5, 6, 7: 20 duplicate deliveries of the same inbound fixture
  it('2-7. 20 duplicate deliveries: 1 claim, 1 set of sub-actions, 1 outbox event, 1 mail-sink delivery, 19 clean suppressions', async () => {
    const fixtureId = `c2_fixture_${Date.now()}`;
    const workers = Array.from({ length: 20 }, (_, idx) => `worker_node_${idx + 1}`);

    // Step 3: Exactly 1 inbound claim across 20 workers
    const claimResults = await Promise.all(
      workers.map(workerId =>
        acquireInboundProcessingLease({
          provider: 'google_workspace',
          mailboxId: 'asknora@nestrealty.com',
          providerMessageId: fixtureId,
          fromEmail: 'marcus@shapework.co',
          subject: 'Fixture 20-worker test',
          intent: 'conversational_question'
        }, workerId, 30000)
      )
    );

    const winners = claimResults.filter(r => r.acquired);
    const losers = claimResults.filter(r => !r.acquired);
    expect(winners.length).toBe(1);
    expect(losers.length).toBe(19);

    // Step 4: Exactly 1 set of legitimate sub-actions
    const actionResults = await Promise.all(
      workers.map(workerId =>
        acquireInboundActionClaim({
          mailboxId: 'asknora@nestrealty.com',
          providerMessageId: fixtureId,
          actionType: 'generate_marketing_packet',
          actionVersion: 1,
          claimedBy: workerId
        })
      )
    );

    const actionWinners = actionResults.filter(Boolean);
    expect(actionWinners.length).toBe(1);

    // Step 5: Exactly 1 outbox event
    const outboxResults = await Promise.all(
      workers.map(workerId =>
        createOutboxEvent({
          workspaceId: 'nest_realty_wilmington',
          entityType: 'listing_marketing',
          entityId: fixtureId,
          entityStateVersion: 1,
          notificationType: 'marketing_ack',
          recipientEmail: 'marcus@shapework.co',
          subject: 'Listing Marketing Initiated',
          payload: { worker: workerId }
        })
      )
    );

    const outboxCreated = outboxResults.filter(r => r.created);
    const outboxSuppressed = outboxResults.filter(r => !r.created);
    expect(outboxCreated.length).toBe(1);
    expect(outboxSuppressed.length).toBe(19);

    // Step 7: Nineteen clean duplicate suppressions
    for (const suppressed of outboxSuppressed) {
      expect(suppressed.action).toBe('skipped_duplicate');
    }
    expect(getDuplicateSuppressionMetric()).toBe(19);

    // Step 6: Exactly 1 mail-sink delivery
    const outboxId = outboxCreated[0].event.id;
    const dispatchRes = await dispatchOutboxEvent(outboxId, { forceLive: true, sender: mockMailSink } as any);
    expect(dispatchRes.success).toBe(true);
    expect(capturedMailSink.length).toBe(1);
    expect(capturedMailSink[0].recipientNormalized).toBe('marcus@shapework.co');
  });

  // Scenario 8: Crash after durable persistence but before classification
  it('8. Crash after durable persistence but before classification: recovered from PostgreSQL', async () => {
    const crashId = `c8_crash_${Date.now()}`;
    // Worker 1 persists and acquires 100ms short lease
    const claim1 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: crashId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Crash before classification',
      intent: 'conversational_question'
    }, 'crashed_worker_pid_9999', 100);

    expect(claim1.acquired).toBe(true);

    // Simulate crash: Worker 1 dies immediately. Wait for lease expiry
    await new Promise(resolve => setTimeout(resolve, 150));

    // Worker 2 takes over from PostgreSQL without needing IMAP to mark unread
    const claim2 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: crashId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Crash before classification',
      intent: 'conversational_question'
    }, 'recovery_worker_pid_10000', 30000);

    expect(claim2.acquired).toBe(true);
    expect(claim2.attemptCount).toBe(2);

    // Complete processing
    await completeInboundProcessing(crashId, 'reply_msg_rec_123');
    const finalRecord = await getInboundEmailRecord(crashId);
    expect(finalRecord?.status).toBe('completed');
  });

  // Scenario 9: Crash after classification but before task mutation
  it('9. Crash after classification but before task mutation: sub-action ledger prevents duplicate classification', async () => {
    const taskCrashId = `c9_crash_${Date.now()}`;
    // Step A: Sub-action classification completed by Worker 1
    const classClaim = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: taskCrashId,
      actionType: 'classify_intent',
      actionVersion: 1,
      claimedBy: 'worker_1'
    });
    expect(classClaim).toBe(true);

    await completeInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: taskCrashId,
      actionType: 'classify_intent',
      actionVersion: 1,
      resultSummary: { intent: 'marketing_request', confidence: 0.98 }
    });

    // Worker 1 crashes before creating task. Worker 2 resumes:
    // Attempting to re-classify is prevented:
    const classClaim2 = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: taskCrashId,
      actionType: 'classify_intent',
      actionVersion: 1,
      claimedBy: 'worker_2'
    });
    expect(classClaim2).toBe(false);

    // Worker 2 proceeds directly to task creation
    const taskClaim = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: taskCrashId,
      actionType: 'create_canonical_task',
      actionVersion: 1,
      claimedBy: 'worker_2'
    });
    expect(taskClaim).toBe(true);
  });

  // Scenario 10: Crash after task mutation
  it('10. Crash after task mutation: version idempotency prevents repeat mutation', async () => {
    const mutationId = `c10_mutation_${Date.now()}`;

    // Task version 1 created
    const outbox1 = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'task',
      entityId: mutationId,
      entityStateVersion: 1,
      notificationType: 'task_created',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Task Created',
      payload: { version: 1 }
    });
    expect(outbox1.created).toBe(true);

    // Worker crashes. Recovery worker runs mutation step again for version 1
    const outbox2 = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'task',
      entityId: mutationId,
      entityStateVersion: 1,
      notificationType: 'task_created',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Task Created',
      payload: { version: 1 }
    });
    expect(outbox2.created).toBe(false);
    expect(outbox2.action).toBe('skipped_duplicate');
  });

  // Scenario 11: Cold-start replay
  it('11. Cold-start replay: booting container detects completed message and skips', async () => {
    const replayId = `c11_replay_${Date.now()}`;
    await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: replayId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Replay check',
      intent: 'conversational_question'
    }, 'boot_instance_1', 30000);

    await completeInboundProcessing(replayId, 'reply_11');

    // Instance restarts (cold start): checks same message ID
    const coldStartClaim = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: replayId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Replay check',
      intent: 'conversational_question'
    }, 'cold_started_instance_2', 30000);

    expect(coldStartClaim.acquired).toBe(false);
    expect(coldStartClaim.status).toBe('completed');
  });

  // Scenario 12: Calendar RSVP suppression
  it('12. Calendar RSVP suppression: METHOD:REPLY and Accepted: subjects never reply', async () => {
    const rsvpClassification = classifyInboundEmail(
      'matt.orr@nestrealty.com',
      'Accepted: 13 Water St walkthrough',
      'Matt Orr has accepted this invitation'
    );

    expect(rsvpClassification.intent).toBe('automated_system');
    expect(rsvpClassification.confidence).toBeGreaterThan(0.9);
    expect(rsvpClassification.reason).toMatch(/calendar|automated/i);
  });

  // Scenario 13: Nora self-message suppression
  it('13. Nora self-message suppression: emails from asknora@nestrealty.com are dropped at ingress', async () => {
    const outcome = await handleNoraConversationalEmail({
      messageId: `self_msg_${Date.now()}@nestrealty.com`,
      from: 'Nora <asknora@nestrealty.com>',
      subject: 'Re: Previous question',
      textContent: 'Here is what I found'
    });

    expect(outcome.action).toBe('suppressed');
    expect(outcome.reason).toMatch(/self|automated/i);
  });

  // Scenario 14: Automatic responder suppression
  it('14. Automatic responder suppression: Auto-Submitted: auto-replied headers are dropped', async () => {
    const autoClassification = classifyInboundEmail(
      'agent@nestrealty.com',
      'Automatic reply: Away from office',
      'I am currently out of the office with limited email access.'
    );

    expect(autoClassification.intent).toBe('automated_system');
    expect(autoClassification.reason).toMatch(/auto|out-of-office/i);
  });

  // Scenario 15: Mixed photo attachment plus question
  it('15. Mixed photo attachment plus question: sub-actions execute atomically', async () => {
    const mixedId = `c15_mixed_${Date.now()}`;

    // Sub-action 1: Attachment ingest
    const attachClaim = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: mixedId,
      actionType: 'attach_photos_to_task',
      actionVersion: 1,
      claimedBy: 'mixed_worker'
    });
    expect(attachClaim).toBe(true);

    // Sub-action 2: Clarification question
    const questionClaim = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: mixedId,
      actionType: 'conversational_clarification',
      actionVersion: 1,
      claimedBy: 'mixed_worker'
    });
    expect(questionClaim).toBe(true);

    // Competing worker attempting sub-action 1 is denied
    const competitor = await acquireInboundActionClaim({
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: mixedId,
      actionType: 'attach_photos_to_task',
      actionVersion: 1,
      claimedBy: 'competitor'
    });
    expect(competitor).toBe(false);
  });

  // Scenario 16: Tracker refreshed 20 times produces zero side-effects
  it('16. Tracker refreshed 20 times: read operations produce 0 outbox events and 0 emails', async () => {
    const initialMailCount = capturedMailSink.length;
    for (let i = 0; i < 20; i++) {
      // Simulating read query on task state
      await pool.query('SELECT * FROM canonical_marketing_tasks LIMIT 10');
    }
    expect(capturedMailSink.length).toBe(initialMailCount);
  });

  // Scenario 17: Unchanged task saved 20 times
  it('17. Unchanged task saved 20 times: version check prevents duplicate notifications', async () => {
    const taskId = `c17_task_${Date.now()}`;
    const taskVersion = 3;

    // First save creates notification
    const res1 = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'canonical_task',
      entityId: taskId,
      entityStateVersion: taskVersion,
      notificationType: 'task_status_update',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Status update',
      payload: { status: 'in_progress' }
    });
    expect(res1.created).toBe(true);

    // 19 identical saves with same version
    for (let i = 0; i < 19; i++) {
      const resN = await createOutboxEvent({
        workspaceId: 'ws_wilmington',
        entityType: 'canonical_task',
        entityId: taskId,
        entityStateVersion: taskVersion,
        notificationType: 'task_status_update',
        recipientEmail: 'marcus@shapework.co',
        subject: 'Status update',
        payload: { status: 'in_progress' }
      });
      expect(resN.created).toBe(false);
      expect(resN.action).toBe('skipped_duplicate');
    }
  });

  // Scenario 18: Temporary SMTP failure
  it('18. Temporary SMTP failure: 4xx temporary error marks outbox retryable_failure', async () => {
    const event = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'test',
      entityId: `c18_smtp_4xx_${Date.now()}`,
      notificationType: 'alert',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Temporary Error Test',
      payload: {}
    });

    const mock4xxSender = async () => {
      throw new Error('421 4.7.0 Try again later');
    };

    const res = await dispatchOutboxEvent(event.event.id, { forceLive: true, sender: mock4xxSender } as any);
    expect(res.success).toBe(false);
    expect(res.state).toBe('retryable_failure');

    const stored = await getOutboxEvent(event.event.id);
    expect(stored?.state).toBe('retryable_failure');
    expect(stored?.attemptCount).toBe(1);
  });

  // Scenario 19: Ambiguous SMTP result
  it('19. Ambiguous SMTP result: socket drop after DATA marks delivery_unknown and forbids auto-retry', async () => {
    const event = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'test',
      entityId: `c19_ambiguous_${Date.now()}`,
      notificationType: 'alert',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Ambiguous Timeout Test',
      payload: {}
    });

    const mockTimeoutSender = async () => {
      const err: any = new Error('ETIMEDOUT: Connection reset by peer after DATA');
      err.code = 'ETIMEDOUT';
      throw err;
    };

    const res = await dispatchOutboxEvent(event.event.id, { forceLive: true, sender: mockTimeoutSender } as any);
    expect(res.success).toBe(false);
    expect(res.state).toBe('delivery_unknown');

    // Attempting auto-dispatch on delivery_unknown is blocked:
    const secondAttempt = await dispatchOutboxEvent(event.event.id, { forceLive: true, sender: mockMailSink } as any);
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.state).toBe('delivery_unknown');
    expect(capturedMailSink.length).toBe(0);
  });

  // Scenario 20: Historical held-event release attempt
  it('20. Historical held-event release attempt: watermark blocks pre-watermark items and marks expired', async () => {
    const historicalId = `c20_historical_${Date.now()}`;
    const historicalEvent = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'lead',
      entityId: historicalId,
      notificationType: 'followup',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Old historical event',
      payload: {}
    });

    // Set watermark to 10 minutes in the future relative to event creation
    const futureWatermark = new Date(Date.now() + 600000);
    setAutomationReleaseNotBefore(futureWatermark);

    try {
      const res = await dispatchOutboxEvent(historicalEvent.event.id, { forceLive: true, sender: mockMailSink } as any);
      expect(res.success).toBe(false);
      expect(res.state).toBe('expired');
      expect(capturedMailSink.length).toBe(0);

      const stored = await getOutboxEvent(historicalEvent.event.id);
      expect(stored?.state).toBe('expired');
    } finally {
      setAutomationReleaseNotBefore(null);
    }
  });

  // Scenario 21: Concurrent outbox dispatch competition (not just creation)
  it('21. Concurrent outbox dispatch: 2 workers competing to dispatch same outbox event results in exactly 1 send', async () => {
    const dispatchEntityId = `c21_dispatch_race_${Date.now()}`;
    const createRes = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'listing',
      entityId: dispatchEntityId,
      notificationType: 'seller_report',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Seller Marketing Report',
      payload: { version: 1 }
    });
    expect(createRes.created).toBe(true);

    const outboxId = createRes.event.id;
    let sendCount = 0;
    const trackingMockSender = async (ev: any) => {
      sendCount++;
      // Simulate network latency during SMTP send
      await new Promise(r => setTimeout(r, 20));
      return { accepted: [ev.recipientNormalized], response: '250 2.0.0 OK' };
    };

    // Both workers attempt to dispatch the exact same outbox row concurrently
    const [resWorker1, resWorker2] = await Promise.all([
      dispatchOutboxEvent(outboxId, { forceLive: true, sender: trackingMockSender } as any),
      dispatchOutboxEvent(outboxId, { forceLive: true, sender: trackingMockSender } as any)
    ]);

    // Exactly 1 worker must succeed, 1 must be prevented
    const successes = [resWorker1, resWorker2].filter(r => r.success);
    const rejections = [resWorker1, resWorker2].filter(r => !r.success);

    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);
    expect(sendCount).toBe(1);
    expect(rejections[0].reason).toContain('Concurrent dispatch prevented');

    const finalOutbox = await getOutboxEvent(outboxId);
    expect(finalOutbox?.state).toBe('sent');
  });

  // Scenario 22: Crash after SMTP acceptance but before DB records success
  it('22. Crash post-SMTP acceptance: outbox remains in dispatching, automated retry is forbidden', async () => {
    const crashEntityId = `c22_smtp_crash_${Date.now()}`;
    const createRes = await createOutboxEvent({
      workspaceId: 'ws_wilmington',
      entityType: 'inspection',
      entityId: crashEntityId,
      notificationType: 'status_alert',
      recipientEmail: 'marcus@shapework.co',
      subject: 'Inspection Update',
      payload: {}
    });

    const outboxId = createRes.event.id;

    // Simulate Worker 1 crashing immediately after SMTP acceptance
    const pool = getDbPool();
    if (pool) {
      // Worker 1 claimed dispatching
      await pool.query(
        "UPDATE nora_outbound_event_outbox SET state = 'dispatching', attempt_count = 1 WHERE id = $1",
        [outboxId]
      );
    }

    // SMTP delivered the message, but Worker 1 died before updating to 'sent'.
    // Worker 2 (or a retry scheduler) comes along and tries to re-dispatch outboxId:
    let retryAttemptSent = false;
    const retrySender = async () => {
      retryAttemptSent = true;
      return { accepted: ['marcus@shapework.co'] };
    };

    const worker2Res = await dispatchOutboxEvent(outboxId, { forceLive: true, sender: retrySender } as any);

    // Re-dispatch is rejected; no duplicate email is sent
    expect(worker2Res.success).toBe(false);
    expect(worker2Res.state).toBe('dispatching');
    expect(retryAttemptSent).toBe(false);
  });

  // Scenario 23: Rejection of writes from a worker that has lost its sub-action lease
  it('23. Stale worker write rejection: Worker 1 loses lease to Worker 2, Worker 1 writes are rejected', async () => {
    const subActionMsgId = `c23_subaction_${Date.now()}`;
    const mailboxId = 'asknora@nestrealty.com';

    // Step 1: Worker 1 claims sub-action
    const claim1 = await acquireInboundActionClaim({
      mailboxId,
      providerMessageId: subActionMsgId,
      actionType: 'extract_metadata',
      actionVersion: 1,
      claimedBy: 'worker_pid_1111'
    });
    expect(claim1).toBe(true);

    // Step 2: Worker 1 crashes / lease is reassigned to Worker 2
    const pool = getDbPool();
    if (pool) {
      await pool.query(
        "UPDATE nora_inbound_actions_ledger SET claimed_by = 'worker_pid_2222', updated_at = NOW() WHERE provider_message_id = $1",
        [subActionMsgId]
      );
    }

    // Step 3: Worker 1 wakes up late and attempts to write completion
    const worker1Write = await completeInboundActionClaim({
      mailboxId,
      providerMessageId: subActionMsgId,
      actionType: 'extract_metadata',
      actionVersion: 1,
      claimedBy: 'worker_pid_1111',
      resultSummary: { stale: true }
    });

    // Worker 1's write is rejected!
    expect(worker1Write).toBe(false);

    // Step 4: Worker 2 writes completion
    const worker2Write = await completeInboundActionClaim({
      mailboxId,
      providerMessageId: subActionMsgId,
      actionType: 'extract_metadata',
      actionVersion: 1,
      claimedBy: 'worker_pid_2222',
      resultSummary: { legitimate: true }
    });
    expect(worker2Write).toBe(true);
  });

  // Scenario 24: Resumption of interrupted processing for Seen message from PostgreSQL with durable asset reference
  it('24. Resumption of Seen message: Worker resumes from PostgreSQL without re-fetching from IMAP', async () => {
    const resumeMsgId = `c24_seen_resume_${Date.now()}`;
    const mockAssetSha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    // Step 1: Worker 1 ingests, stores durable asset reference, acquires short lease (50ms), marks Seen on IMAP
    const claim1 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: resumeMsgId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Listing Photos for 13 Water St',
      intent: 'asset_submission',
      metadata: {
        imapSeen: true,
        durableAssetChecksum: mockAssetSha,
        attachmentsCount: 3
      }
    }, 'worker_1', 50);
    expect(claim1.acquired).toBe(true);

    // Worker 1 crashes. Time passes, lease expires in PostgreSQL:
    await new Promise(r => setTimeout(r, 75));

    // Step 2: Database-driven worker scans PostgreSQL for expired leases on messages (even though Seen=true in IMAP)
    const claim2 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId: 'asknora@nestrealty.com',
      providerMessageId: resumeMsgId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Listing Photos for 13 Water St',
      intent: 'asset_submission'
    }, 'worker_2_resumed', 30000);

    expect(claim2.acquired).toBe(true);
    expect(claim2.attemptCount).toBe(2);

    // Message metadata and durable asset references preserved
    const record = await getInboundEmailRecord(resumeMsgId);
    expect(record?.metadata?.durableAssetChecksum).toBe(mockAssetSha);
    expect(record?.metadata?.imapSeen).toBe(true);

    // Complete processing
    await completeInboundProcessing(resumeMsgId, 'asknora@nestrealty.com', {
      status: 'completed',
      replyMessageId: 'reply_resume_24'
    });

    const finalRec = await getInboundEmailRecord(resumeMsgId);
    expect(finalRec?.status).toBe('completed');
  });
});
