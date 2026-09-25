/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Inbound Email Clarification, Deliverable Parsing & Telephony Classification Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractPropertyAddress,
  extractDueDateFromText,
  extractEmailDeliverables,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine.js';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('1. Inbound Email Address Extraction & Clarification Suite', () => {
  beforeEach(async () => {
    resetCanonicalStoreForTesting();
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool();
      if (pool) {
        await pool.query(`
          DELETE FROM canonical_marketing_tasks 
          WHERE property_address ILIKE '%880 Wrightsville%' 
             OR property_address ILIKE '%550 Market%';
        `).catch(() => {});
        await pool.query(`
          DELETE FROM canonical_marketing_requests 
          WHERE property_address ILIKE '%880 Wrightsville%' 
             OR property_address ILIKE '%550 Market%';
        `).catch(() => {});
      }
    } catch {}
  });

  it('1. Returns empty string when email has no street address (never hardcoded 1916 Wolcott)', () => {
    const textNoAddr1 = 'Hey Nora - I have a new listing... i need marketing materials for it... and a social media kit. I need it by 09/14/26. image is attached.';
    const addr1 = extractPropertyAddress('New listing', textNoAddr1);
    expect(addr1).toBe('');

    const textNoAddr2 = 'Hey - i have a listing for September 11th and I need marketing flyer, social media posts for it.';
    const addr2 = extractPropertyAddress('New listing coming soon', textNoAddr2);
    expect(addr2).toBe('');
  });

  it('2. Extracts real street address accurately when present', () => {
    const textWithAddr = 'Please prepare marketing flyers for 450 Oleander Dr, Wilmington NC by Friday.';
    const addr = extractPropertyAddress('Marketing Request', textWithAddr);
    expect(addr).toContain('450 Oleander Dr');
    expect(addr).toContain('Wilmington, NC');
  });

  it('3. Parses explicit deadlines (09/14/26, September 11th) into valid ISO dates', () => {
    const isoDate1 = extractDueDateFromText('I need it by 09/14/26 image is attached');
    const parsed1 = new Date(isoDate1);
    expect(parsed1.getUTCFullYear()).toBe(2026);
    expect(parsed1.getUTCMonth()).toBe(8); // 0-indexed: 8 is September
    expect(parsed1.getUTCDate()).toBe(14);

    const isoDate2 = extractDueDateFromText('Hey - i have a listing for September 11th and I need marketing flyer');
    const parsed2 = new Date(isoDate2);
    expect(parsed2.getUTCFullYear()).toBe(2026);
    expect(parsed2.getUTCMonth()).toBe(8);
    expect(parsed2.getUTCDate()).toBe(11);
  });

  it('4. Dynamically extracts deliverables from email body', () => {
    const delivs = extractEmailDeliverables('New listing', 'i need marketing materials for it... and a social media kit');
    const titles = delivs.map(d => d.title);
    expect(titles).toContain('1-Page Property Flyer (8.5x11)');
    expect(titles).toContain('3-Slide Social Story Carousel & Graphics');
  });

  it('5. Keeps email without an address in Melissa intake without a phantom address', async () => {
    const msgId = `msg_test_no_addr_${Date.now()}`;
    const result = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'New listing without address test',
      textContent: 'Hey Nora - I have a new listing... i need marketing materials for it... and a social media kit. I need it by 09/14/26. image attached.',
      messageId: msgId
    });

    expect(result.success).toBe(true);
    expect(result.propertyAddress).toBe('Address Pending');

    const reqs = getAllCanonicalMarketingRequests();
    const createdReq = reqs.find(r => r.id === result.requestId);
    expect(createdReq).toBeDefined();
    expect(createdReq?.status).toBe('request_received');
    expect(createdReq?.title).toContain('[Address Needed]');
    expect(createdReq?.propertyAddress).toBe('Address Pending');

    const tasks = getAllCanonicalMarketingTasks();
    const createdTasks = tasks.filter(t => t.requestId === result.requestId);
    expect(createdTasks.length).toBe(2); // Flyer + Social Story
    expect(createdTasks.every(task => task.status === 'request_received' && task.assignedTo === 'Melissa Gagliardi')).toBe(true);
    expect(createdTasks.every(task => task.reviewOwnerName === 'Melissa Gagliardi')).toBe(true);
  });

  it('6. Reconciles existing Address Pending request when agent replies with address', async () => {
    // 1. Initial email with no address
    const initialMsgId = `msg_initial_${Date.now()}`;
    const initialResult = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Listing launch next week',
      textContent: 'Need flyers and social story.',
      messageId: initialMsgId
    });
    expect(initialResult.propertyAddress).toBe('Address Pending');

    // 2. Reply email providing address
    const replyMsgId = `msg_reply_${Date.now()}`;
    const replyResult = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      subject: 'Re: Action Needed: Please reply with property address',
      textContent: 'The address is 880 Wrightsville Ave, Wilmington NC.',
      messageId: replyMsgId
    });

    expect(replyResult.success).toBe(true);
    expect(replyResult.propertyAddress).toContain('880 Wrightsville Ave');

    const reqs = getAllCanonicalMarketingRequests();
    const reconciledReq = reqs.find(r => r.id === initialResult.requestId);
    expect(reconciledReq?.propertyAddress).toContain('880 Wrightsville Ave');
    expect(reconciledReq?.status).toBe('request_received');

    const tasks = getAllCanonicalMarketingTasks();
    const reconciledTasks = tasks.filter(t => t.requestId === initialResult.requestId);
    expect(reconciledTasks[0].status).toBe('request_received');
    expect(reconciledTasks[0].assignedTo).toBe('Melissa Gagliardi');
    expect(reconciledTasks[0].reviewOwnerName).toBe('Melissa Gagliardi');
    expect(reconciledTasks[0].propertyAddress).toContain('880 Wrightsville Ave');
  });
});

describe('2. Telephony Signage Classification & Safe Fallbacks', () => {
  it('1. Phone call asking for a sign classifies under Signage assigned to Ann Gunn', () => {
    const callPayload = {
      id: `call_sign_test_${Date.now()}`,
      callerName: 'Matt Orr',
      propertyAddress: '1916 Wolcott Ave, Wilmington NC',
      transcript: 'Hi Nora, I called asking for a sign for my listing at 1916 Wolcott Ave.',
      summary: 'Caller asking for a sign for 1916 Wolcott Ave.'
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);
    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);

    const signTask = result.tasks.find(t => t.category === 'signage');
    expect(signTask).toBeDefined();
    expect(signTask?.title).toContain('Yard Sign Post');
    expect(signTask?.assignedTo).toBe('Ann Gunn');
  });

  it('2. Phone call with unspecified general inquiry falls back to General Marketing & Listing Intake (not Open House Flyer)', () => {
    const callPayload = {
      id: `call_general_test_${Date.now()}`,
      callerName: 'Sarah Jenkins',
      propertyAddress: '550 Market St, Wilmington NC',
      transcript: 'Hi Nora, I have a quick question about my new property at 550 Market St.',
      summary: 'General property check-in.'
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);
    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBe(1);

    const fallbackTask = result.tasks[0];
    expect(fallbackTask.title).toBe('General Marketing & Listing Intake');
    expect(fallbackTask.category).toBe('listing_launch');
    expect(fallbackTask.assignedTo).toBe('Melissa Gagliardi');
  });
});
