/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Nora Email Intake (asknora@nestrealty.com) & Retell Telephony Photo Dispatch
 */

import { describe, it, expect } from 'vitest';
import {
  processInboundAgentEmail,
  extractAddressFromEmail,
  parseMarketingDeliverables,
  syncNoraEmailInbox,
  InboundAgentEmail
} from '../../server/integrations/google/noraEmailIntakeService.js';
import {
  dispatchMissingPhotosNotification,
  normalizeRetellCall
} from '../../server/integrations/marketingCallsService.js';
import {
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Nora Email Intake Service for asknora@nestrealty.com', () => {
  it('1. Extracts property addresses correctly from email text and subject', () => {
    const addr1 = extractAddressFromEmail('Subject: Open House Flyer for 1104 S Live Oak Pkwy\nBody: Hello!');
    expect(addr1).toContain('1104 S Live Oak Pkwy');

    const addr2 = extractAddressFromEmail('Need EDDM postcards for 304 Ocean Blvd, Wrightsville Beach');
    expect(addr2).toContain('304 Ocean Blvd');
  });

  it('2. Parses compound marketing deliverable requests accurately', () => {
    const parse1 = parseMarketingDeliverables('Need an open house flyer and information sheet for our upcoming open house.');
    expect(parse1.title).toBe('Open House Flyer & Information Sheet');
    expect(parse1.category).toBe('open_house');
    expect(parse1.items).toContain('Double-Sided 8.5x11 Open House Flyer');
    expect(parse1.items).toContain('Listing Information Sheet');

    const parse2 = parseMarketingDeliverables('Please create a just listed postcard and story graphics for Instagram.');
    expect(parse2.title).toBe('Just Listed Postcard & Social Graphics');
    expect(parse2.category).toBe('print');
  });

  it('3. Ingests inbound marketing email into Canonical Repository assigned to Melissa Gagliardi first', async () => {
    const testAddr = `7712 S Live Oak Pkwy`;
    const testEmail: InboundAgentEmail = {
      id: `eml_unit_test_${Date.now()}`,
      messageId: `<msg_unit_test_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (REALTOR®)',
      subject: `Open House Flyer & Information Sheet for ${testAddr}`,
      bodyText: `Hi Nora, please prepare an open house flyer and information sheet for ${testAddr}. Attached are 4 photos.`,
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'hero.jpg', contentType: 'image/jpeg', sizeBytes: 4000000, url: 'https://example.com/hero.jpg' },
        { filename: 'kitchen.jpg', contentType: 'image/jpeg', sizeBytes: 3500000, url: 'https://example.com/kitchen.jpg' }
      ]
    };

    const result = await processInboundAgentEmail(testEmail);

    expect(result.isMarketingRequest).toBe(true);
    expect(result.assignedLead).toBe('Melissa Gagliardi');
    expect(result.propertyAddress).toContain('7712 S Live Oak Pkwy');
    expect(result.extractedPhotosCount).toBe(2);
    expect(result.driveFolderUrl).toContain('7712_S_LIVE_OAK_PKWY');

    // Verify task exists in repository
    const tasks = getAllCanonicalMarketingTasks();
    const targetId = result.createdTaskId || result.updatedTaskId;
    const task = tasks.find(t => t.id === targetId);
    expect(task).toBeDefined();
    expect(task?.assignedTo).toBe('Melissa Gagliardi');
    expect(task?.category).toBe('open_house');
  });

  it('4. Successfully runs inbox sync', async () => {
    const syncRes = await syncNoraEmailInbox();
    expect(syncRes.syncedCount).toBeGreaterThan(0);
    expect(Array.isArray(syncRes.results)).toBe(true);
  });
});

describe('Retell Missing Photo Automated Dispatch Workflow (910-507-2047)', () => {
  it('5. Auto-generates Google Drive folder and dispatches SMS + Email to caller', async () => {
    const rawCall = {
      call_id: `call_test_photo_${Date.now()}`,
      from_number: '+19106128283',
      agent_id: 'agent_cdd031880770993e4b11cb9340',
      duration_ms: 38000,
      transcript: 'Matt: Nora, we need an open house flyer and information sheet for 1104 S Live Oak Pkwy.',
      call_analysis: {
        call_summary: 'Matt Orr requesting open house flyer for 1104 S Live Oak Pkwy'
      }
    };

    const normalized = normalizeRetellCall(rawCall);
    expect(normalized.callerName).toBe('Matt Orr (REALTOR®)');
    expect(normalized.propertyAddress).toContain('1104 S Live Oak Pkwy');

    const dispatchResult = await dispatchMissingPhotosNotification(normalized);

    expect(dispatchResult.smsSent).toBe(true);
    expect(dispatchResult.emailSent).toBe(false); // Suppressed for non-whitelisted recipient by safety gate
    expect(dispatchResult.recipientPhone).toBe('+19106128283');
    expect(dispatchResult.recipientEmail).toBe('matt.orr@nestrealty.com');
    expect(dispatchResult.driveFolderUrl).toContain('drive.google.com');
  });
});
