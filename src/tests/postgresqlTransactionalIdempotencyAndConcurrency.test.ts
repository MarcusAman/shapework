import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import {
  claimInboundEmail,
  completeInboundEmailProcessing,
  failInboundEmailProcessing,
  enqueueOutboundEmail,
  processOutboundEmailOutbox,
  processAndValidateAttachment,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine';
import {
  resetCanonicalStoreForTesting,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  persistRequestToDatabase,
  persistTaskToDatabase
} from '../../server/persistence/marketingCampaignsRepository';

describe('PostgreSQL Transactional Idempotency & Multi-Instance Concurrency Suite', () => {
  beforeAll(async () => {
    const { getDbPool } = await import('../../server/persistence/repositories.js');
    const pool = getDbPool();
    if (pool) {
      await pool.query(`
        INSERT INTO directory_people (
          id, workspace_id, first_name, last_name, display_name, email, phone,
          title, role, status, is_broker_in_charge, source
        ) VALUES (
          'dir_sarah_jenkins_test', 'ws_wilmington', 'Sarah', 'Jenkins', 'Sarah Jenkins',
          'sarah.jenkins@nestrealty.com', '+19105551234', 'Broker', 'Broker', 'active', false, 'test_seed'
        )
        ON CONFLICT (id) DO UPDATE SET 
          email = EXCLUDED.email, 
          status = 'active',
          workspace_id = 'ws_wilmington';
      `).catch(() => {});
    }
  });

  beforeEach(async () => {
    resetCanonicalStoreForTesting();
    vi.clearAllMocks();

    const { getDbPool } = await import('../../server/persistence/repositories.js');
    const pool = getDbPool();
    if (pool) {
      await pool.query(`
        DELETE FROM canonical_marketing_tasks 
        WHERE property_address ILIKE '%850 Wrightsville%' 
           OR property_address ILIKE '%742 Evergreen%'
           OR agent_name ILIKE '%Sarah%';
      `).catch(() => {});
      await pool.query(`
        DELETE FROM canonical_marketing_requests 
        WHERE property_address ILIKE '%850 Wrightsville%' 
           OR property_address ILIKE '%742 Evergreen%'
           OR agent_email ILIKE '%sarah.jenkins%';
      `).catch(() => {});
      await pool.query(`
        DELETE FROM inbound_email_claims 
        WHERE message_id LIKE 'msg_concurrent_%'
           OR message_id LIKE 'msg_thread_%'
           OR message_id LIKE 'msg_sarah_%'
           OR message_id LIKE 'msg_crash_%';
      `).catch(() => {});
    }
  });

  it('1. Two simultaneous deliveries of the same message create exactly one processing claim', async () => {
    const messageId = 'msg_concurrent_001_' + Date.now();
    const workspaceId = 'ws_wilmington';
    const mailboxId = 'asknora@nestrealty.com';
    const provider = 'google_workspace';
    const senderEmail = 'matt.orr@nestrealty.com';

    // Simulate two concurrent Cloud Run instances racing to claim the same inbound message
    const [instance1Claim, instance2Claim] = await Promise.all([
      claimInboundEmail({
        workspaceId,
        provider,
        mailboxId,
        messageId,
        senderEmail
      }),
      claimInboundEmail({
        workspaceId,
        provider,
        mailboxId,
        messageId,
        senderEmail
      })
    ]);

    // Exactly one instance must successfully claim; the second must be rejected
    const claimCount = (instance1Claim.claimed ? 1 : 0) + (instance2Claim.claimed ? 1 : 0);
    expect(claimCount).toBe(1);
    expect(instance1Claim.claimed !== instance2Claim.claimed).toBe(true);
  });

  it('2. Simultaneous identical webhook deliveries produce exactly one task mutation and no duplicate tasks', async () => {
    const messageId = 'msg_concurrent_task_mutation_' + Date.now();
    const payload = {
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      to: 'asknora@nestrealty.com',
      subject: 'Flyer Request for 850 Wrightsville Sound Way',
      textContent: 'Please create a 1-page flyer for 850 Wrightsville Sound Way with attached exterior photo',
      messageId,
      workspaceId: 'ws_wilmington'
    };

    // Dispatch two concurrent ingestions for the same message
    const [res1, res2] = await Promise.all([
      ingestInboundEmailToTask(payload),
      ingestInboundEmailToTask(payload)
    ]);

    // One must create a new task, the second must be blocked by idempotency
    const results = [res1, res2];
    const createdCount = results.filter(r => r.actionTaken === 'created_new').length;
    const duplicateBlockedCount = results.filter(r => r.actionTaken === 'already_processed').length;

    expect(createdCount).toBe(1);
    expect(duplicateBlockedCount).toBe(1);

    const allTasks = getAllCanonicalMarketingTasks();
    const wrightsvilleTasks = allTasks.filter(t => t.propertyAddress?.includes('850 Wrightsville Sound'));
    expect(wrightsvilleTasks.length).toBe(1);
  });

  it('3. Two different messages in the same thread reconcile safely into the same surviving container', async () => {
    const threadId = 'thread_reconciliation_abc_' + Date.now();
    
    // Step 1: Initial email missing address creates needs_info task
    const msg1Res = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'asknora@nestrealty.com',
      subject: 'New Listing Marketing Collateral',
      textContent: 'Please create flyer and social kit for my new listing coming on Friday.',
      messageId: 'msg_thread_01_' + Date.now(),
      threadId,
      workspaceId: 'ws_wilmington'
    });

    expect(msg1Res.actionTaken).toBe('created_new');
    expect(msg1Res.propertyAddress).toBe('Address Pending');

    // Step 2: Second email in the thread supplies the street address
    const msg2Res = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'asknora@nestrealty.com',
      subject: 'Re: New Listing Marketing Collateral',
      textContent: 'The address is 742 Evergreen Terrace, Wilmington NC.',
      messageId: 'msg_thread_02_' + Date.now(),
      threadId,
      workspaceId: 'ws_wilmington'
    });

    expect(msg2Res.actionTaken).toBe('reconciled_updated');
    expect(msg2Res.propertyAddress).toBe('742 Evergreen Terrace, Wilmington, NC');

    const allRequests = getAllCanonicalMarketingRequests();
    const evergreenRequests = allRequests.filter(r => !r.isArchived && r.status !== 'merged' && r.propertyAddress?.includes('742 Evergreen'));
    expect(evergreenRequests.length).toBe(1);
    expect(evergreenRequests[0].propertyAddress).toBe('742 Evergreen Terrace, Wilmington, NC');
  });

  it('4. Crash after claiming can be safely recovered once lease expires or status is marked failed', async () => {
    const messageId = 'msg_crash_recovery_' + Date.now();
    const workspaceId = 'ws_wilmington';
    const mailboxId = 'asknora@nestrealty.com';
    const provider = 'google_workspace';
    const senderEmail = 'crash.test@nestrealty.com';

    // Instance 1 claims the message
    const initialClaim = await claimInboundEmail({
      workspaceId,
      provider,
      mailboxId,
      messageId,
      senderEmail
    });
    expect(initialClaim.claimed).toBe(true);

    // Immediate second claim during active lease must be rejected
    const activeLeaseClaim = await claimInboundEmail({
      workspaceId,
      provider,
      mailboxId,
      messageId,
      senderEmail
    });
    expect(activeLeaseClaim.claimed).toBe(false);

    // Simulate process crash / failure handler marking failed
    await failInboundEmailProcessing({
      workspaceId,
      provider,
      mailboxId,
      messageId,
      errorCode: 'ERR_PROCESS_TERMINATED'
    });

    // Recovery worker re-attempts claim
    const recoveryClaim = await claimInboundEmail({
      workspaceId,
      provider,
      mailboxId,
      messageId,
      senderEmail
    });
    expect(recoveryClaim.claimed).toBe(true);
    expect(recoveryClaim.isReattempt).toBe(true);
  });

  it('5. Two outbox workers cannot double-send the same pending outbox notification', async () => {
    const idempotencyKey = 'outbox_test_key_' + Date.now();
    const workspaceId = 'ws_wilmington';

    // Enqueue an outbox entry
    const enqueueRes = await enqueueOutboundEmail({
      workspaceId,
      messageType: 'intake_confirmed',
      idempotencyKey,
      recipient: 'marcus.aman@gmail.com',
      subject: 'Marketing Intake Confirmed: 100 Main St',
      payload: {
        toEmail: 'marcus.aman@gmail.com',
        agentName: 'Marcus Aman',
        propertyAddress: '100 Main St, Wilmington, NC',
        deliverables: ['Property Flyer'],
        assignedLead: 'Melissa Gagliardi (Marketing Director)'
      }
    });
    expect(enqueueRes.enqueued).toBe(true);

    // Duplicate enqueue with same stable key is rejected
    const duplicateEnqueue = await enqueueOutboundEmail({
      workspaceId,
      messageType: 'intake_confirmed',
      idempotencyKey,
      recipient: 'marcus.aman@gmail.com',
      subject: 'Marketing Intake Confirmed: 100 Main St',
      payload: {
        toEmail: 'marcus.aman@gmail.com',
        agentName: 'Marcus Aman',
        propertyAddress: '100 Main St, Wilmington, NC',
        deliverables: ['Property Flyer'],
        assignedLead: 'Melissa Gagliardi (Marketing Director)'
      }
    });
    expect(duplicateEnqueue.enqueued).toBe(false);

    // Simulate concurrent outbox worker runs
    const [dispatched1, dispatched2] = await Promise.all([
      processOutboundEmailOutbox(),
      processOutboundEmailOutbox()
    ]);

    // Exactly one worker sends the email
    expect(dispatched1 + dispatched2).toBe(1);
  });

  it('6. Separate threads from the same sender receive separate clarification emails with stable non-colliding keys', async () => {
    const agentEmail = 'sarah.jenkins@nestrealty.com';

    // Thread 1: Property 1 missing address
    const req1 = await ingestInboundEmailToTask({
      from: `Sarah Jenkins <${agentEmail}>`,
      to: 'asknora@nestrealty.com',
      subject: 'Flyer for my new waterfront listing',
      textContent: 'Need marketing package for waterfront home.',
      messageId: 'msg_sarah_prop1_' + Date.now(),
      threadId: 'thread_sarah_prop1',
      workspaceId: 'ws_wilmington'
    });
    expect(req1.actionTaken).toBe('created_new');
    expect(req1.propertyAddress).toBe('Address Pending');

    // Thread 2: Property 2 missing address from the SAME agent (should not be suppressed by time bucket)
    const req2 = await ingestInboundEmailToTask({
      from: `Sarah Jenkins <${agentEmail}>`,
      to: 'asknora@nestrealty.com',
      subject: 'Sign post for my downtown listing',
      textContent: 'Need sign post installed downtown.',
      messageId: 'msg_sarah_prop2_' + Date.now(),
      threadId: 'thread_sarah_prop2',
      workspaceId: 'ws_wilmington'
    });
    expect(req2.actionTaken).toBe('created_new');
    expect(req2.propertyAddress).toBe('Address Pending');

    // Both requests exist as independent needs_info containers
    const allRequests = getAllCanonicalMarketingRequests();
    const sarahPending = allRequests.filter(r => r.agentEmail?.includes('sarah.jenkins') && r.status === 'needs_info');
    expect(sarahPending.length).toBe(2);
  });

  it('7. Attachment validation enforces size limit and sha256 byte identity', () => {
    // Valid image attachment
    const validBuf = Buffer.from('fake-image-bytes-data-12345');
    const validAtt = processAndValidateAttachment({
      filename: 'front_exterior.jpg',
      contentType: 'image/jpeg',
      content: validBuf
    }, 'google_workspace', 'msg_att_test_01');

    expect(validAtt.valid).toBe(true);
    expect(validAtt.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(validAtt.id).toContain('sha256:');

    // Oversized attachment (>25MB)
    const oversizedAtt = processAndValidateAttachment({
      filename: 'giant_archive.zip',
      sizeBytes: 30 * 1024 * 1024
    }, 'google_workspace', 'msg_att_test_02');

    expect(oversizedAtt.valid).toBe(false);
    expect(oversizedAtt.hash).toBe('invalid_size');
  });
});
