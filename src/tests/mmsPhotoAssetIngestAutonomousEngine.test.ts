/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { MmsTextToRequestService } from '../../server/services/mmsTextToRequestService';
import {
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks
} from '../../server/persistence/marketingCampaignsRepository';

describe('Field Agent Mobile MMS & Photo Asset Ingest Autonomous Engine Suite', () => {
  it('1. End-to-end MMS ingest executes Drive scaffolding, Maxa run, Google Slides, Sign Post, and Multi-Link SMS receipt', async () => {
    const payload = {
      messageId: 'mms_test_lumina_beach_01',
      fromPhone: '+19105550188', // Sarah Jenkins
      body: '420 South Lumina Ave, Wrightsville Beach NC — $2,195,000 (5 Beds / 4.5 Baths). Just texted over the photos! Need print flyers, yard sign post, 3-slide story, and Google Slides presentation deck.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90'
      ],
      audioVoiceMemoUrl: 'https://actions.google.com/sounds/v1/speech/hello.ogg'
    };

    const result = await MmsTextToRequestService.processInboundMms(payload);

    // 1. Verify Broker Resolution
    expect(result.mmsRecord.agentName).toBe('Sarah Jenkins');
    expect(result.mmsRecord.agentRole).toBe('Listing Specialist');
    expect(result.mmsRecord.photos.length).toBe(3);

    // 2. Verify Google Drive Scaffolding
    expect(result.mmsRecord.driveFolderUrl).toContain('https://drive.google.com/drive/folders/');

    // 3. Verify Google Slides CMA Deck
    expect(result.mmsRecord.googleSlidesUrl).toContain('https://docs.google.com/presentation/d/');

    // 4. Verify Coastal Sign Post Work Order
    expect(result.mmsRecord.signPostTicketId).toBeDefined();
    expect(result.mmsRecord.signPostTicketId).toContain('SIGN-');

    // 5. Verify Maxa Autonomous Browser Agent
    expect(result.mmsRecord.maxaRunId).toBeDefined();

    // 6. Verify Canonical Request & Tasks in 'request_received'
    expect(result.request.id).toBeDefined();
    expect(result.request.channel).toBe('phone');
    expect(result.tasks.length).toBeGreaterThanOrEqual(4);

    const printTask = result.tasks.find(t => t.category === 'print');
    expect(printTask).toBeDefined();
    expect(printTask?.status).toBe('request_received');

    const signTask = result.tasks.find(t => t.category === 'signage');
    expect(signTask).toBeDefined();
    expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');

    const slidesTask = result.tasks.find(t => t.title.includes('Google Slides') || t.title.includes('Presentation'));
    expect(slidesTask).toBeDefined();

    // 7. Verify Multi-Link SMS Receipt
    expect(result.mmsRecord.smsReceiptSent).toBe(true);
    expect(result.mmsRecord.smsReceiptBody).toContain('Google Drive Asset Pack:');
    expect(result.mmsRecord.smsReceiptBody).toContain('8-Slide Google Slides Deck:');
    expect(result.mmsRecord.smsReceiptBody).toContain('Coastal Sign Post:');
    expect(result.mmsRecord.smsReceiptBody).toContain('Track Live:');
  });

  it('2. Retrieves all stored MMS records with full telemetry', () => {
    const records = MmsTextToRequestService.getAllMmsRecords();
    expect(records.length).toBeGreaterThanOrEqual(1);
    const first = records[0];
    expect(first.agentName).toBeDefined();
    expect(first.driveFolderUrl).toBeDefined();
  });
});
