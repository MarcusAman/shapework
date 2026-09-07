import { describe, it, expect } from 'vitest';
import {
  extractPropertyAddress,
  parseSender,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine.js';
import {
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingTaskById
} from '../../server/persistence/marketingCampaignsRepository.js';
import { scanAskNoraInbox } from '../../server/services/noraInboxScannerService.js';

describe('Zero-OAuth Nora Inbox Scanner & Ingestion Engine Test Suite', () => {
  it('1. Accurately extracts property addresses and sender details from email metadata', () => {
    const sender1 = parseSender('Marcus Aman <marcus.aman@gmail.com>');
    expect(sender1.name).toBe('Marcus Aman');
    expect(sender1.email).toBe('marcus.aman@gmail.com');
    expect(sender1.phone).toBe('+12527170595');

    const sender2 = parseSender('matt.orr@nestrealty.com');
    expect(sender2.name).toBe('Matt Orr');
    expect(sender2.email).toBe('matt.orr@nestrealty.com');

    const addr1 = extractPropertyAddress('1920 Wolcott Ave Marketing Request', 'Please prepare flyers.');
    expect(addr1).toContain('1920 Wolcott Ave');

    const addr2 = extractPropertyAddress('New listing collateral needed', 'Property located at 704 Forest Hills Dr, Wilmington, NC.');
    expect(addr2).toContain('704 Forest Hills Dr');
  });

  let lastCreatedFlyerTaskId: string = '';

  it('2. Ingests an inbound email with photo attachments and creates a canonical request & task in the store', async () => {
    const testImageBuffer = Buffer.from('fake-jpeg-image-bytes-1004');
    const result = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'AskNora@nestrealty.com',
      subject: '1920 Wolcott Ave Marketing Flyer Request',
      textContent: 'Hi Nora, please prepare listing flyers for 1920 Wolcott Ave. Photo attached.',
      attachments: [
        {
          filename: '1004.jpg',
          contentType: 'image/jpeg',
          content: testImageBuffer,
          sizeBytes: 3840000
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.assignedTo).toBe('Melissa Gagliardi');
    expect(result.ccRecipient).toBe('melissa.gagliardi@nestrealty.com');
    expect(result.photosCount).toBeGreaterThanOrEqual(1);

    lastCreatedFlyerTaskId = result.taskId;
    const task = getCanonicalMarketingTaskById(result.taskId);
    expect(task).toBeDefined();
    expect(task?.title).toBe('1-Page Property Flyer (8.5x11)');
    expect(task?.photos?.length).toBeGreaterThanOrEqual(1);
    expect(task?.photos?.[0].name).toBe('1004.jpg');
  });

  it('3. Ingests a signage installation request and routes directly to Ann Gunn (ann.gunn@nestrealty.com)', async () => {
    const result = await ingestInboundEmailToTask({
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'AskNora@nestrealty.com',
      subject: '212 Wetland Drive Yard Sign Post & Rider Request',
      textContent: 'Please install yard post and rider at 212 Wetland Drive by Friday.',
      attachments: []
    });

    expect(result.success).toBe(true);
    expect(result.assignedTo).toBe('Ann Gunn');
    expect(result.ccRecipient).toBe('ann.gunn@nestrealty.com');

    const task = getCanonicalMarketingTaskById(result.taskId);
    expect(task).toBeDefined();
    expect(task?.category).toBe('signage');
    expect(task?.assignedTo).toBe('Ann Gunn');
  });

  it('4. Successfully queries all canonical tasks and verifies newly created tasks appear on the table queue', () => {
    const allTasks = getAllCanonicalMarketingTasks();
    expect(allTasks.length).toBeGreaterThan(0);
    
    const wolcottTask = allTasks.find(t => t.id === lastCreatedFlyerTaskId);
    expect(wolcottTask).toBeDefined();
    expect(wolcottTask?.assignedTo).toBe('Melissa Gagliardi');
  });

  it('5. Safe scanAskNoraInbox execution without crashing during unit tests', async () => {
    const scanResult = await scanAskNoraInbox();
    expect(scanResult).toBeDefined();
    expect(Array.isArray(scanResult.results)).toBe(true);
    expect(Array.isArray(scanResult.errors)).toBe(true);
  });
});
