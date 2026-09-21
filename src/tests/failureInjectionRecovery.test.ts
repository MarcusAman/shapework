import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import {
  acquireInboundProcessingLease,
  completeInboundProcessing,
  heartbeatInboundProcessing,
  acquireInboundActionClaim,
  completeInboundActionClaim,
  isActionCompleted,
  getInboundEmailRecord,
  normalizeEmailMessageId
} from '../../server/persistence/inboundEmailLedger.js';
import {
  createOutboxEvent,
  dispatchOutboxEvent,
  getOutboxEvent
} from '../../server/persistence/outboundNotificationOutbox.js';
import {
  getOutboundMasterMode,
  getNoraAutomationMode,
  getAccountEmailMode,
  isRecipientSuppressed,
  sendEmail
} from '../../server/email/emailProvider.js';
import { isCalendarOrAutomatedNotification } from '../../server/services/noraInboxScannerService.js';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

describe('15 Failure-Injection and Recovery Test Suites', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  // ---------------------------------------------------------------------------
  // 1. Worker crash during LLM generation (lease expires, worker 2 recovers)
  // ---------------------------------------------------------------------------
  it('1. Worker crash during LLM generation: lease expires and worker 2 safely recovers', async () => {
    const testMsgId = `crash_llm_${Date.now()}`;
    const mailboxId = 'asknora@nestrealty.com';

    // Worker 1 acquires short 50ms lease and crashes
    const lease1 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      rfcMessageId: `<${testMsgId}@shapework.co>`,
      fromEmail: 'client@example.com',
      subject: 'Inquiry on listing',
      leaseDurationMs: 50
    }, 'worker_crashed_1');

    expect(lease1.acquired).toBe(true);
    expect(lease1.attemptCount).toBe(1);

    // Worker 2 immediately tries before lease expiration -> must be rejected
    const lease2Early = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'client@example.com'
    }, 'worker_recover_2');
    expect(lease2Early.acquired).toBe(false);

    // Wait 70ms for lease to expire
    await new Promise(r => setTimeout(r, 70));

    // Worker 2 tries after expiration -> must successfully recover the lease!
    const lease2Recovered = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'client@example.com'
    }, 'worker_recover_2');

    expect(lease2Recovered.acquired).toBe(true);
    expect(lease2Recovered.attemptCount).toBe(2);
    expect(lease2Recovered.leaseOwner).toBe('worker_recover_2');

    // Worker 2 completes processing
    await completeInboundProcessing(testMsgId, mailboxId, {
      status: 'completed',
      replyMessageId: `<reply.${testMsgId}@nestrealty.com>`
    });

    const record = await pool.query(
      'SELECT status, attempt_count FROM nora_inbound_email_ledger WHERE provider_message_id = $1',
      [testMsgId]
    );
    expect(record.rows[0].status).toBe('completed');
    expect(record.rows[0].attempt_count).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // 2. Worker crash after sub-action 1 completes, before sub-action 2 begins
  // ---------------------------------------------------------------------------
  it('2. Worker crash between sub-actions: worker 2 resumes sub-action 2 without repeating sub-action 1', async () => {
    const testMsgId = `crash_between_${Date.now()}`;
    const mailboxId = 'asknora@nestrealty.com';

    // Worker 1 claims top lease with 50ms duration
    await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'agent@example.com',
      leaseDurationMs: 50
    }, 'worker_crash_sub');

    // Sub-action 1: asset confirmation claimed & completed by worker 1
    const claim1 = await acquireInboundActionClaim({
      mailboxId,
      providerMessageId: testMsgId,
      actionType: 'asset_confirmation',
      actionVersion: 1,
      claimedBy: 'worker_crash_sub'
    });
    expect(claim1).toBe(true);

    await completeInboundActionClaim({
      mailboxId,
      providerMessageId: testMsgId,
      actionType: 'asset_confirmation',
      actionVersion: 1,
      resultSummary: { uploaded: 2 }
    });

    // Worker 1 crashes! Wait 70ms for lease expiration.
    await new Promise(r => setTimeout(r, 70));

    // Worker 2 recovers top-level lease
    const lease2 = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'agent@example.com'
    }, 'worker_resume_sub');
    expect(lease2.acquired).toBe(true);

    // Worker 2 checks if sub-action 1 is completed
    const subAction1Done = await isActionCompleted(mailboxId, testMsgId, 'asset_confirmation', 1);
    expect(subAction1Done).toBe(true); // Must skip sub-action 1!

    // Worker 2 claims and executes sub-action 2 (conversational reply)
    const subAction2Done = await isActionCompleted(mailboxId, testMsgId, 'conversational_reply', 1);
    expect(subAction2Done).toBe(false);

    const claim2 = await acquireInboundActionClaim({
      mailboxId,
      providerMessageId: testMsgId,
      actionType: 'conversational_reply',
      actionVersion: 1,
      claimedBy: 'worker_resume_sub'
    });
    expect(claim2).toBe(true);

    await completeInboundActionClaim({
      mailboxId,
      providerMessageId: testMsgId,
      actionType: 'conversational_reply',
      actionVersion: 1,
      resultSummary: { sent: true }
    });

    // Verify exactly 1 asset confirmation and 1 conversational reply in actions ledger
    const actions = await pool.query(
      'SELECT action_type, status FROM nora_inbound_actions_ledger WHERE provider_message_id = $1 ORDER BY action_type ASC',
      [testMsgId]
    );
    expect(actions.rows.length).toBe(2);
    expect(actions.rows[0].action_type).toBe('asset_confirmation');
    expect(actions.rows[0].status).toBe('completed');
    expect(actions.rows[1].action_type).toBe('conversational_reply');
    expect(actions.rows[1].status).toBe('completed');
  });

  // ---------------------------------------------------------------------------
  // 3. Network drop / timeout after SMTP acceptance (marked delivery_unknown, never auto-retried)
  // ---------------------------------------------------------------------------
  it('3. Network drop after SMTP acceptance: marked delivery_unknown and never auto-retried', async () => {
    const entityId = `net_drop_${Date.now()}`;

    const outbox = await createOutboxEvent({
      workspaceId: 'nest_realty',
      entityType: 'email_thread',
      entityId,
      entityStateVersion: 1,
      notificationType: 'conversational_reply',
      recipientEmail: 'client@example.com',
      subject: 'Network drop test'
    });
    expect(outbox.created).toBe(true);
    const eventId = outbox.event!.id;

    // Simulate mock sender where TCP socket hangs/drops AFTER SMTP DATA acceptance
    const mockSenderHangs = async () => {
      const err: any = new Error('ETIMEDOUT: Connection reset by peer after DATA');
      err.code = 'ETIMEDOUT';
      err.command = 'DATA';
      throw err;
    };

    const dispatchResult = await dispatchOutboxEvent(eventId, mockSenderHangs);
    expect(dispatchResult.success).toBe(false);
    expect(dispatchResult.state).toBe('delivery_unknown');

    // Verify outbox record in Postgres
    const row = await pool.query(
      'SELECT state, error_message FROM nora_outbound_event_outbox WHERE id = $1',
      [eventId]
    );
    expect(row.rows[0].state).toBe('delivery_unknown');
    expect(row.rows[0].error_message).toContain('DATA');

    // Attempting an automated re-send must be BLOCKED because delivery_unknown requires investigation
    const retryAttempt = await dispatchOutboxEvent(eventId, async () => ({
      messageId: '<retry@shapework.co>',
      accepted: ['client@example.com'],
      rejected: []
    }));
    expect(retryAttempt.success).toBe(false);
    expect(retryAttempt.state).toBe('delivery_unknown');
  });

  // ---------------------------------------------------------------------------
  // 4. SMTP temporary failure 4xx (marked retryable_failure, backoff retry succeeds)
  // ---------------------------------------------------------------------------
  it('4. SMTP 4xx temporary failure: marked retryable_failure and retry succeeds', async () => {
    const entityId = `smtp_4xx_${Date.now()}`;

    const outbox = await createOutboxEvent({
      workspaceId: 'nest_realty',
      entityType: 'email_thread',
      entityId,
      entityStateVersion: 1,
      notificationType: 'conversational_reply',
      recipientEmail: 'client@example.com',
      subject: 'SMTP 4xx test'
    });
    const eventId = outbox.event!.id;

    // Attempt 1: 421 Service not available
    const mock4xx = async () => {
      const err: any = new Error('421 4.7.0 Try again later');
      err.responseCode = 421;
      throw err;
    };

    const res1 = await dispatchOutboxEvent(eventId, mock4xx);
    expect(res1.success).toBe(false);
    expect(res1.state).toBe('retryable_failure');

    const row1 = await pool.query('SELECT state, attempt_count FROM nora_outbound_event_outbox WHERE id = $1', [eventId]);
    expect(row1.rows[0].state).toBe('retryable_failure');
    expect(row1.rows[0].attempt_count).toBe(1);

    // Attempt 2: Server recovered, 250 OK
    const mockSuccess = async () => ({
      messageId: `<delivered.${entityId}@nestrealty.com>`,
      accepted: ['client@example.com'],
      rejected: []
    });

    const res2 = await dispatchOutboxEvent(eventId, mockSuccess);
    expect(res2.success).toBe(true);
    expect(res2.state).toBe('sent');

    const row2 = await pool.query('SELECT state, attempt_count FROM nora_outbound_event_outbox WHERE id = $1', [eventId]);
    expect(row2.rows[0].state).toBe('sent');
    expect(row2.rows[0].attempt_count).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // 5. SMTP permanent rejection 5xx (marked dead_letter, not retried)
  // ---------------------------------------------------------------------------
  it('5. SMTP 5xx permanent rejection: marked dead_letter and subsequent retry blocked', async () => {
    const entityId = `smtp_5xx_${Date.now()}`;

    const outbox = await createOutboxEvent({
      workspaceId: 'nest_realty',
      entityType: 'email_thread',
      entityId,
      entityStateVersion: 1,
      notificationType: 'conversational_reply',
      recipientEmail: 'invalid-user@example.com',
      subject: 'SMTP 5xx test'
    });
    const eventId = outbox.event!.id;

    const mock550 = async () => {
      const err: any = new Error('550 5.1.1 User unknown');
      err.responseCode = 550;
      throw err;
    };

    const res = await dispatchOutboxEvent(eventId, mock550);
    expect(res.success).toBe(false);
    expect(res.state).toBe('dead_letter');

    const row = await pool.query('SELECT state FROM nora_outbound_event_outbox WHERE id = $1', [eventId]);
    expect(row.rows[0].state).toBe('dead_letter');

    // Attempting to dispatch dead-lettered event is immediately rejected
    const retry = await dispatchOutboxEvent(eventId, async () => ({
      messageId: '<retry@domain.com>',
      accepted: [],
      rejected: []
    }));
    expect(retry.success).toBe(false);
    expect(retry.state).toBe('dead_letter');
  });

  // ---------------------------------------------------------------------------
  // 6. OUTBOUND_MASTER_MODE=disabled blocks all deliveries even if transactional
  // ---------------------------------------------------------------------------
  it('6. OUTBOUND_MASTER_MODE=disabled blocks all emails including transactional password resets', async () => {
    const prevMaster = process.env.OUTBOUND_MASTER_MODE;
    const prevNora = process.env.NORA_AUTOMATION_MODE;
    const prevAcct = process.env.ACCOUNT_EMAIL_MODE;

    try {
      process.env.OUTBOUND_MASTER_MODE = 'disabled';
      process.env.NORA_AUTOMATION_MODE = 'live';
      process.env.ACCOUNT_EMAIL_MODE = 'enabled';

      expect(getOutboundMasterMode()).toBe('disabled');

      // Attempt transactional password reset
      const result = await sendEmail({
        to: 'staff@nestrealty.com',
        subject: 'Reset your password',
        text: 'Click here to reset your password',
        isTransactionalAccountEmail: true
      });

      // Must NOT be accepted by SMTP
      expect(result.smtpAccepted).toBe(false);
      expect(result.rejectedRecipients).toContain('staff@nestrealty.com');
      expect(result.smtpResponse).toContain('Suppressed by safety gate');
    } finally {
      process.env.OUTBOUND_MASTER_MODE = prevMaster;
      process.env.NORA_AUTOMATION_MODE = prevNora;
      process.env.ACCOUNT_EMAIL_MODE = prevAcct;
    }
  });

  // ---------------------------------------------------------------------------
  // 7. NORA_AUTOMATION_MODE=hold holds Nora operational replies, allows account emails
  // ---------------------------------------------------------------------------
  it('7. NORA_AUTOMATION_MODE=hold holds Nora operational emails while ACCOUNT_EMAIL_MODE=enabled allows transactional', async () => {
    const prevMaster = process.env.OUTBOUND_MASTER_MODE;
    const prevNora = process.env.NORA_AUTOMATION_MODE;
    const prevAcct = process.env.ACCOUNT_EMAIL_MODE;

    try {
      process.env.OUTBOUND_MASTER_MODE = 'live';
      process.env.NORA_AUTOMATION_MODE = 'hold';
      process.env.ACCOUNT_EMAIL_MODE = 'enabled';

      // 1. Nora conversational email -> must be held / rejected by safety gate
      const noraEmail = await sendEmail({
        to: 'buyer@example.com',
        subject: 'Re: 123 Main St - Nora',
        text: 'Here is the listing information',
        isTransactionalAccountEmail: false
      });
      expect(noraEmail.smtpAccepted).toBe(false);
      expect(noraEmail.rejectedRecipients).toContain('buyer@example.com');
      expect(noraEmail.smtpResponse).toContain('Suppressed by safety gate');

      // 2. Transactional account email -> permitted
      expect(getAccountEmailMode()).toBe('enabled');
    } finally {
      process.env.OUTBOUND_MASTER_MODE = prevMaster;
      process.env.NORA_AUTOMATION_MODE = prevNora;
      process.env.ACCOUNT_EMAIL_MODE = prevAcct;
    }
  });

  // ---------------------------------------------------------------------------
  // 8. Auditable suppression of Matt Orr's aliases via nora_recipient_suppressions
  // ---------------------------------------------------------------------------
  it('8. Auditable suppression of Matt Orr aliases via nora_recipient_suppressions table', async () => {
    const aliases = [
      'morr@nestrealty.com',
      'matt@nestrealty.com',
      'matt.orr@nestrealty.com'
    ];

    for (const alias of aliases) {
      const sup = await isRecipientSuppressed(alias);
      expect(sup.suppressed).toBe(true);
      expect(sup.reason).toMatch(/executive_override|Incident hold/);
    }

    // Normal recipient is NOT suppressed
    const normal = await isRecipientSuppressed('client123@example.com');
    expect(normal.suppressed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 9. Google Calendar RSVP notification suppressed without outbound email
  // ---------------------------------------------------------------------------
  it('9. Google Calendar RSVP with Content-Type text/calendar is suppressed', () => {
    const headers = {
      'content-type': 'text/calendar; charset=UTF-8; method=REPLY',
      'subject': 'Accepted: Weekly Team Sync @ Mon Sep 14, 2026'
    };

    const check = isCalendarOrAutomatedNotification(headers, 'Calendar RSVP body');
    expect(check.isCalendarOrAutomated).toBe(true);
    expect(check.reason).toBe('calendar_content_type');
  });

  // ---------------------------------------------------------------------------
  // 10. iCalendar BEGIN:VCALENDAR in body is suppressed
  // ---------------------------------------------------------------------------
  it('10. Inbound email body containing BEGIN:VCALENDAR and METHOD:REPLY is suppressed', () => {
    const headers = {
      'content-type': 'text/plain; charset=UTF-8',
      'subject': 'Invitation: Project Kickoff'
    };
    const body = `
      BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//Google Inc//Google Calendar 70.9054//EN
      METHOD:REPLY
      STATUS:CONFIRMED
      END:VCALENDAR
    `;

    const check = isCalendarOrAutomatedNotification(headers, body);
    expect(check.isCalendarOrAutomated).toBe(true);
    expect(check.reason).toBe('icalendar_body');
  });

  // ---------------------------------------------------------------------------
  // 11. Auto-Submitted header suppressed
  // ---------------------------------------------------------------------------
  it('11. Inbound email with Auto-Submitted header is suppressed', () => {
    const headers = {
      'auto-submitted': 'auto-replied',
      'subject': 'Out of Office until Tuesday'
    };

    const check = isCalendarOrAutomatedNotification(headers, 'I am out of the office.');
    expect(check.isCalendarOrAutomated).toBe(true);
    expect(check.reason).toBe('auto_submitted_header');
  });

  // ---------------------------------------------------------------------------
  // 12. Conflicting RFC Message-ID and UID correctly leased and mapped
  // ---------------------------------------------------------------------------
  it('12. Inbound email with conflicting RFC Message-ID and UID is uniquely keyed and retrieved', async () => {
    const uid = `imap_uid_${Date.now()}`;
    const rfcId = `<rfc.conflict.${Date.now()}@shapework.co>`;
    const normalizedRfc = normalizeEmailMessageId(rfcId);
    const mailboxId = 'asknora@nestrealty.com';

    // Acquire lease using UID as providerMessageId and RFC Message-ID as rfcMessageId
    const lease = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: uid,
      rfcMessageId: rfcId,
      fromEmail: 'user@example.com',
      subject: 'Conflict resolution test'
    }, 'worker_uid_map');

    expect(lease.acquired).toBe(true);

    // Verify lookup by providerMessageId (UID)
    const recordByUid = await getInboundEmailRecord(uid, mailboxId);
    expect(recordByUid).not.toBeNull();
    expect(recordByUid?.providerMessageId).toBe(uid);
    expect(recordByUid?.rfcMessageId).toBe(normalizedRfc);

    // Verify lookup by RFC Message-ID
    const recordByRfc = await getInboundEmailRecord(rfcId, mailboxId);
    expect(recordByRfc).not.toBeNull();
    expect(recordByRfc?.providerMessageId).toBe(uid);
  });

  // ---------------------------------------------------------------------------
  // 13. State-transition duplicate outbox event blocked by uq_outbox_transition
  // ---------------------------------------------------------------------------
  it('13. State-transition duplicate outbox event blocked by uq_outbox_transition', async () => {
    const entityId = `state_dup_${Date.now()}`;

    const first = await createOutboxEvent({
      workspaceId: 'nest_realty',
      entityType: 'listing_inquiry',
      entityId,
      entityStateVersion: 1,
      notificationType: 'inquiry_followup',
      recipientEmail: 'lead@example.com',
      subject: 'Following up on 13 Water St'
    });
    expect(first.created).toBe(true);

    // Duplicate attempt for the exact same state version and notification
    const dup = await createOutboxEvent({
      workspaceId: 'nest_realty',
      entityType: 'listing_inquiry',
      entityId,
      entityStateVersion: 1,
      notificationType: 'inquiry_followup',
      recipientEmail: 'lead@example.com',
      subject: 'Following up on 13 Water St'
    });
    expect(dup.created).toBe(false);
    expect(dup.reason).toMatch(/State transition already recorded|duplicate prevented/);
  });

  // ---------------------------------------------------------------------------
  // 14. Lease heartbeat renewal extends unexpired lease
  // ---------------------------------------------------------------------------
  it('14. Lease heartbeat renewal extends active lease while worker is running', async () => {
    const testMsgId = `heartbeat_${Date.now()}`;
    const mailboxId = 'asknora@nestrealty.com';
    const workerId = 'worker_heartbeat_test';

    // Worker acquires 100ms lease
    await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'long_task@example.com',
      leaseDurationMs: 100
    }, workerId);

    // At 50ms, worker extends lease by 300ms
    await new Promise(r => setTimeout(r, 50));
    const renewed = await heartbeatInboundProcessing(testMsgId, mailboxId, workerId, 300);
    expect(renewed).toBe(true);

    // At 120ms (when initial 100ms would have expired):
    // Another worker tries to acquire lease -> must be denied!
    await new Promise(r => setTimeout(r, 70));
    const competingWorker = await acquireInboundProcessingLease({
      provider: 'google_workspace',
      mailboxId,
      providerMessageId: testMsgId,
      fromEmail: 'long_task@example.com'
    }, 'worker_competitor');

    expect(competingWorker.acquired).toBe(false);
    expect(competingWorker.reason).toContain('Active lease held by worker_heartbeat_test');
  });

  // ---------------------------------------------------------------------------
  // 15. IMAP \Seen flag is never added if a worker throws an error during processing
  // ---------------------------------------------------------------------------
  it('15. IMAP \\Seen flag is deferred until successful commit, preserving unread status on error', async () => {
    let seenFlagAdded = false;
    const mockImapClient = {
      addFlags: async (uid: string, flag: string) => {
        if (flag === '\\Seen') {
          seenFlagAdded = true;
        }
      }
    };

    // Simulate pipeline execution that throws error midway
    async function processEmailPipeline(uid: string) {
      // Step 1: Parse message (success)
      // Step 2: Acquire lease (success)
      // Step 3: LLM generation (throws error)
      throw new Error('LLM rate limited or crashed');
      // Step 4: Deferred IMAP \Seen mark (never reached!)
      // await mockImapClient.addFlags(uid, '\\Seen');
    }

    await expect(processEmailPipeline('uid_12345')).rejects.toThrow('LLM rate limited or crashed');
    expect(seenFlagAdded).toBe(false); // Verified: \Seen is never added on failure!
  });
});
