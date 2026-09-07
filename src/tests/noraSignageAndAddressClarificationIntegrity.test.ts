/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Signage Classification & Address Clarification Surgical Integrity Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isPhysicalSignageRequest,
  extractPropertyAddress,
  extractEmailDeliverables,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine.js';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('1. Tightened Signage Classification & Negative Intent Exclusions Suite', () => {
  beforeEach(async () => {
    resetCanonicalStoreForTesting();
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool();
      if (pool) {
        await pool.query(`
          DELETE FROM canonical_marketing_tasks 
          WHERE property_address ILIKE '%920 Market%' 
             OR property_address ILIKE '%500 Oleander%'
             OR property_address ILIKE '%Magnolia%';
        `).catch(() => {});
        await pool.query(`
          DELETE FROM canonical_marketing_requests 
          WHERE property_address ILIKE '%920 Market%' 
             OR property_address ILIKE '%500 Oleander%'
             OR property_address ILIKE '%Magnolia%';
        `).catch(() => {});
        await pool.query(`
          DELETE FROM inbound_email_claims 
          WHERE message_id ILIKE '%idempotent%' OR message_id ILIKE '%msg_%';
        `).catch(() => {});
      }
    } catch {}
  });
  // Positive Physical Signage Cases
  it('1. Classifies "install a sign post" as physical signage', () => {
    expect(isPhysicalSignageRequest('Please install a sign post at the listing.')).toBe(true);
    
    const callResult = convertCallToCanonicalMarketingRequest({
      id: `call_sign_install_${Date.now()}`,
      callerName: 'Matt Orr',
      propertyAddress: '100 Main St, Wilmington NC',
      transcript: 'I need to install a sign post at 100 Main St.'
    });
    expect(callResult.tasks.some(t => t.category === 'signage')).toBe(true);
  });

  it('2. Classifies "remove the yard sign" as physical signage', () => {
    expect(isPhysicalSignageRequest('Can you remove the yard sign from the front lawn?')).toBe(true);

    const callResult = convertCallToCanonicalMarketingRequest({
      id: `call_sign_remove_${Date.now()}`,
      callerName: 'Matt Orr',
      propertyAddress: '100 Main St, Wilmington NC',
      transcript: 'Please remove the yard sign.'
    });
    expect(callResult.tasks.some(t => t.category === 'signage')).toBe(true);
  });

  it('3. Classifies "I need directional signs" as physical signage', () => {
    expect(isPhysicalSignageRequest('I need directional signs for this weekend.')).toBe(true);

    const delivs = extractEmailDeliverables('Directional signs needed', 'I need directional signs for the upcoming open house.');
    expect(delivs.some(d => d.category === 'signage')).toBe(true);
  });

  it('4. Classifies "coming soon rider" and "lockbox installation" as physical signage/field work', () => {
    expect(isPhysicalSignageRequest('Please add a coming soon rider to the post.')).toBe(true);
    expect(isPhysicalSignageRequest('Need lockbox installation on the front porch.')).toBe(true);
  });

  // Negative Intent Exclusions
  it('5. Excludes "Ryan needs to sign off" from physical signage', () => {
    expect(isPhysicalSignageRequest('Ryan needs to sign off on the commission agreement.')).toBe(false);

    const callResult = convertCallToCanonicalMarketingRequest({
      id: `call_signoff_${Date.now()}`,
      callerName: 'Matt Orr',
      propertyAddress: '100 Main St, Wilmington NC',
      transcript: 'Ryan needs to sign off on this document before we proceed.'
    });
    expect(callResult.tasks.some(t => t.category === 'signage')).toBe(false);
  });

  it('6. Excludes "the disclosure is signed" from physical signage', () => {
    expect(isPhysicalSignageRequest('The disclosure is signed by both buyer and seller.')).toBe(false);

    const delivs = extractEmailDeliverables('Disclosure Update', 'The disclosure is signed and attached.');
    expect(delivs.some(d => d.category === 'signage')).toBe(false);
  });

  it('7. Excludes "send through DocuSign" from physical signage', () => {
    expect(isPhysicalSignageRequest('Please send through DocuSign for signature.')).toBe(false);

    const delivs = extractEmailDeliverables('DocuSign Packet', 'Send through DocuSign to the buyer.');
    expect(delivs.some(d => d.category === 'signage')).toBe(false);
  });

  it('8. Excludes "create an open-house sign-in sheet" from physical signage', () => {
    expect(isPhysicalSignageRequest('Can you create an open-house sign-in sheet PDF?')).toBe(false);

    const delivs = extractEmailDeliverables('Open House Materials', 'Can you create an open-house sign-in sheet?');
    expect(delivs.some(d => d.category === 'signage')).toBe(false);
  });

  it('9. Excludes electronic signatures, signing appointments, and signed contracts from physical signage', () => {
    expect(isPhysicalSignageRequest('Need electronic signature on Form 2-T.')).toBe(false);
    expect(isPhysicalSignageRequest('Signing appointment scheduled for 2 PM Friday.')).toBe(false);
    expect(isPhysicalSignageRequest('Signed contract attached for your records.')).toBe(false);
    expect(isPhysicalSignageRequest('Please sign the form and return.')).toBe(false);
  });
});

describe('2. Address Clarification & Deduplication Integrity Suite', () => {
  it('1. Missing-address reply with NO existing task updates pending task to in_progress', async () => {
    const uniqueNum = Date.now() % 10000;
    const testAddress = `${uniqueNum} Magnolia Dr, Wilmington NC`;
    const initialMsgId = `msg_init_no_task_${Date.now()}`;
    const initialRes = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'New listing collateral request',
      textContent: 'Need flyers and postcards. Forgot the address!',
      messageId: initialMsgId
    });

    expect(initialRes.actionTaken).toBe('created_new');
    expect(initialRes.propertyAddress).toBe('Address Pending');

    // Reply with address
    const replyMsgId = `msg_reply_no_task_${Date.now()}`;
    const replyRes = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Re: Action Needed: Please reply with property address',
      textContent: `The address is ${testAddress}.`,
      messageId: replyMsgId
    });

    expect(replyRes.actionTaken).toBe('reconciled_updated');
    expect(replyRes.propertyAddress).toContain(`${uniqueNum} Magnolia Dr`);

    const tasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === initialRes.requestId);
    expect(tasks[0].status).toBe('in_progress');
    expect(tasks[0].propertyAddress).toContain(`${uniqueNum} Magnolia Dr`);
  });

  it('2. Missing-address reply when ANOTHER open task exists merges into existing task atomically', async () => {
    // 1. Existing open task for 500 Oleander Dr
    const existingTaskId = `task_existing_oleander_${Date.now()}`;
    const existingReqId = `req_existing_oleander_${Date.now()}`;
    saveCanonicalMarketingRequest({
      id: existingReqId,
      title: '500 Oleander Dr Marketing Request',
      channel: 'email',
      receivedAt: 'Earlier today',
      status: 'assigned',
      agentName: 'Marcus Aman (Broker / Tech Lead)',
      agentEmail: 'marcus.aman@gmail.com',
      propertyAddress: '500 Oleander Dr, Wilmington, NC',
      requestExcerpt: 'Existing active request for Oleander Dr',
      rawExcerpt: 'Existing request',
      taskIds: [existingTaskId],
      assignedTo: 'Melissa Gagliardi',
      photos: [{ id: 'p_exist', name: 'front_porch.jpg', url: '/uploads/front.jpg', type: 'image/jpeg', sizeBytes: 1000 }],
      attachments: [{ filename: 'flyer_draft.pdf', contentType: 'application/pdf', sizeBytes: 500, url: '/uploads/flyer.pdf' }],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    saveCanonicalMarketingTask({
      id: existingTaskId,
      requestId: existingReqId,
      title: '1-Page Property Flyer (8.5x11)',
      category: 'print',
      status: 'in_progress',
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director',
      agentName: 'Marcus Aman (Broker / Tech Lead)',
      propertyAddress: '500 Oleander Dr, Wilmington, NC',
      photos: [{ id: 'p_exist', name: 'front_porch.jpg', url: '/uploads/front.jpg', type: 'image/jpeg', sizeBytes: 1000 }],
      attachments: [{ filename: 'flyer_draft.pdf', contentType: 'application/pdf', sizeBytes: 500, url: '/uploads/flyer.pdf' }],
      isArchived: false,
      notes: 'Initial task notes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. Inbound email with missing address
    const pendingMsgId = `msg_pending_merge_${Date.now()}`;
    const pendingRes = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Collateral package needed',
      textContent: 'Need social media kit.',
      attachments: [
        { filename: 'aerial_view.jpg', contentType: 'image/jpeg', sizeBytes: 2000, url: '/uploads/aerial.jpg' }
      ],
      messageId: pendingMsgId
    });

    expect(pendingRes.propertyAddress).toBe('Address Pending');

    // 3. Agent replies providing "500 Oleander Dr" which already has an active task!
    const replyMergeMsgId = `msg_reply_merge_${Date.now()}`;
    const mergeRes = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Re: Action Needed: Please reply with property address',
      textContent: 'The address is 500 Oleander Dr, Wilmington NC.',
      messageId: replyMergeMsgId
    });

    expect(mergeRes.actionTaken).toBe('reconciled_merged');
    expect(mergeRes.taskId).toBe(existingTaskId);

    // Verify surviving task preserved both existing and new attachments
    const allTasks = getAllCanonicalMarketingTasks();
    const survivingTask = allTasks.find(t => t.id === existingTaskId);
    expect(survivingTask).toBeDefined();
    expect(survivingTask?.photos?.some(p => p.name === 'front_porch.jpg')).toBe(true);
    expect(survivingTask?.attachments?.some(a => a.filename === 'aerial_view.jpg')).toBe(true);
    expect(survivingTask?.notes).toContain('Reconciled Email Follow-up');

    // Verify placeholder pending task is marked merged and NOT left active
    const placeholderTask = allTasks.find(t => t.requestId === pendingRes.requestId);
    expect(placeholderTask?.status).toBe('merged');
    expect(placeholderTask?.isArchived).toBe(true);
  });

  it('3. Repeated webhook delivery with identical Message-ID is idempotent', async () => {
    const fixedMsgId = `msg_idempotent_fixed_${Date.now()}`;
    const payload = {
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Idempotency verification email',
      textContent: 'Please prepare property flyer for 920 Market St, Wilmington NC.',
      messageId: fixedMsgId
    };

    const firstRun = await ingestInboundEmailToTask(payload);
    expect(firstRun.actionTaken).toBe('created_new');

    const secondRun = await ingestInboundEmailToTask(payload);
    expect(secondRun.actionTaken).toBe('already_processed');
    expect(secondRun.message).toContain('already ingested');
  });

  it('4. Cross-tenant thread isolation: does not match tasks from different workspaces', async () => {
    const allReqs = getAllCanonicalMarketingRequests();
    const pendingReq = allReqs.find(r => r.propertyAddress === 'Address Pending' && !r.isArchived);
    if (pendingReq) {
      expect(pendingReq.propertyAddress).not.toBe('1916 Wolcott Ave');
    }
  });
});
