/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Email Intake, Photo Attachment Ingestion, and Periodic Polling Test Suite
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  processInboundAgentEmail, 
  extractAddressFromEmail, 
  parseMarketingDeliverables,
  startNoraEmailPollingLoop,
  InboundAgentEmail
} from '../../server/integrations/google/noraEmailIntakeService.js';
import { 
  getAllCanonicalMarketingRequests, 
  getAllCanonicalMarketingTasks, 
  saveCanonicalMarketingRequest, 
  saveCanonicalMarketingTask,
  getCanonicalMarketingRequestById,
  getCanonicalMarketingTaskById,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Nora Email Intake & Photo Attachment Ingestion Suite', () => {
  beforeAll(() => {
    resetCanonicalStoreForTesting();
  });

  it('1. Correctly extracts property address from email subject and body', () => {
    const addr1 = extractAddressFromEmail(
      "Hi Nora,\n\nI need a flyer for 1916 Wolcott Ave. 3 bed 2 bath.",
      "1916 Wolcott Ave Marketing Request"
    );
    expect(addr1).toContain('1916 Wolcott Ave');

    const addr2 = extractAddressFromEmail(
      "Hi Nora,\nOpen house this weekend at 1104 S Live Oak Pkwy in Wilmington.",
      "Open House Flyer & Information Sheet for 1104 S Live Oak Pkwy"
    );
    expect(addr2).toContain('1104 S Live Oak Pkwy');
  });

  it('2. Ingests 1916 Wolcott Avenue email, creates task, and attaches 1004.jpg photo and Drive folder', async () => {
    const email: InboundAgentEmail = {
      id: `eml_test_wolcott_${Date.now()}`,
      messageId: `<test_msg_wolcott_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (Broker)',
      subject: '1916 Wolcott Ave Marketing Request',
      bodyText: "Hi Nora,\n\nI need a 1 page flyer for this new listing. It's 1400 sq ft, 3 bed 2 bath, fully remodeled. Listing price $560,000. Going live September 24.\n\nPicture is attached.\n1004.jpg",
      receivedAt: new Date().toISOString(),
      attachments: [
        {
          filename: '1004.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 3840000,
          url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    };

    const res = await processInboundAgentEmail(email);
    expect(res.isMarketingRequest).toBe(true);
    expect(res.propertyAddress).toContain('1916 Wolcott');
    expect(res.extractedPhotosCount).toBe(1);
    expect(res.driveFolderUrl || '').not.toMatch(/1DRV_/);
    expect(!res.driveFolderUrl || res.driveFolderUrl.startsWith('https://drive.google.com/drive/folders/')).toBe(true);
    expect(res.photos).toBeDefined();
    expect(res.photos?.length).toBeGreaterThanOrEqual(1);
    expect(res.photos?.[0].name).toBe('1004.jpg');
    expect(res.photos?.[0].url).toMatch(/(?:images\.unsplash\.com|\/uploads\/1004\.jpg|\/images\/properties\/)/);

    // Verify stored in repository
    if (res.createdRequestId) {
      const storedReq = getCanonicalMarketingRequestById(res.createdRequestId);
      expect(storedReq).toBeDefined();
      expect(storedReq?.photos?.length).toBeGreaterThanOrEqual(1);
      expect(storedReq?.photos?.[0].name).toBe('1004.jpg');
      expect(storedReq?.driveFolderUrl || '').not.toMatch(/1DRV_/);
    }

    const targetTaskId = res.updatedTaskId || res.createdTaskId;
    if (targetTaskId) {
      const storedTask = getCanonicalMarketingTaskById(targetTaskId);
      expect(storedTask).toBeDefined();
      expect(storedTask?.photos?.length).toBeGreaterThanOrEqual(1);
      expect(storedTask?.photos?.[0].name).toBe('1004.jpg');
      expect(['in_progress', 'ready_for_review', 'needs_info', 'request_received']).toContain(storedTask?.status);
    }
  });

  it('3. Ingests multi-photo and PDF attachments', async () => {
    const email: InboundAgentEmail = {
      id: `eml_test_ocean_${Date.now()}`,
      messageId: `<test_msg_ocean_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (Broker)',
      subject: 'Open House Flyer for 8820 Ocean Sound Way',
      bodyText: 'Open house this weekend at 8820 Ocean Sound Way. $875,000. 4 Bed 3.5 Bath.',
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'hero.png', contentType: 'image/png', sizeBytes: 4200000, url: 'https://images.unsplash.com/photo-1600596542815' },
        { filename: 'kitchen.jpg', contentType: 'image/jpeg', sizeBytes: 3100000, url: 'https://images.unsplash.com/photo-1600585154' },
        { filename: 'floorplan.pdf', contentType: 'application/pdf', sizeBytes: 1500000, url: 'https://drive.google.com/file/d/floorplan_1' }
      ]
    };

    const res = await processInboundAgentEmail(email);
    expect(res.isMarketingRequest).toBe(true);
    expect(res.extractedPhotosCount).toBe(2); // 2 images
    expect(res.attachments?.length).toBe(3); // 2 images + 1 PDF
    expect(res.photos?.some(p => p.name === 'hero.png')).toBe(true);
    expect(res.attachments?.some(a => a.filename === 'floorplan.pdf')).toBe(true);
  });

  it('4. Appends new photos when a follow-up email arrives for an existing property task', async () => {
    const addr = '999 Test Suite Way, Wilmington, NC';
    // Initial email
    const email1: InboundAgentEmail = {
      id: `eml_test_initial_${Date.now()}`,
      messageId: `<test_msg_init_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (Broker)',
      subject: `New Listing: ${addr}`,
      bodyText: `Need flyers for ${addr}.`,
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'front_facade.jpg', contentType: 'image/jpeg', sizeBytes: 2500000, url: 'https://images.unsplash.com/photo-1' }
      ]
    };

    const res1 = await processInboundAgentEmail(email1);
    expect(res1.isExistingTaskUpdated).toBeUndefined();
    expect(res1.createdTaskId).toBeDefined();

    // Follow-up email with additional photo
    const email2: InboundAgentEmail = {
      id: `eml_test_followup_${Date.now()}`,
      messageId: `<test_msg_follow_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (Broker)',
      subject: `More photos for ${addr}`,
      bodyText: `Here is the backyard photo for ${addr}.`,
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'backyard_patio.jpg', contentType: 'image/jpeg', sizeBytes: 3100000, url: 'https://images.unsplash.com/photo-2' }
      ]
    };

    const res2 = await processInboundAgentEmail(email2);
    expect(res2.isExistingTaskUpdated).toBe(true);
    expect(res2.updatedTaskId).toBe(res1.createdTaskId);

    const task = getCanonicalMarketingTaskById(res1.createdTaskId!);
    expect(task).toBeDefined();
    expect(task?.photos?.length).toBe(2);
    expect(task?.photos?.some(p => p.name === 'front_facade.jpg')).toBe(true);
    expect(task?.photos?.some(p => p.name === 'backyard_patio.jpg')).toBe(true);
  });

  it('5. Verifies existing canonical store data contains 1916 Wolcott with attached photo', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const testPath = path.join(process.cwd(), 'server', 'data', 'canonical_marketing_store_test.json');
    const defaultPath = path.join(process.cwd(), 'server', 'data', 'canonical_marketing_store.json');
    const filePath = fs.existsSync(testPath) ? testPath : defaultPath;
    let rawData: any = { requests: [], tasks: [] };
    try {
      rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (_) {}

    const repoRequests = await getAllCanonicalMarketingRequests();
    const repoTasks = await getAllCanonicalMarketingTasks();

    const wolcottReq = repoRequests.find((r: any) => r.id === 'req_email_eml_matt_orr_1916_wolcott_1788276923998' || r.propertyAddress?.includes('1916 Wolcott')) ||
      rawData.requests.find((r: any) => r.id === 'req_email_eml_matt_orr_1916_wolcott_1788276923998' || r.propertyAddress?.includes('1916 Wolcott'));
    
    expect(wolcottReq).toBeDefined();
    expect(wolcottReq?.photos).toBeDefined();
    expect(wolcottReq?.photos?.length).toBeGreaterThanOrEqual(1);
    expect(wolcottReq?.photos?.[0].name).toBe('1004.jpg');
    expect(wolcottReq?.driveFolderUrl || '').not.toMatch(/1DRV_/);

    const wolcottTask = repoTasks.find((t: any) => t.id === 'tsk_email_eml_matt_orr_1916_wolcott_0' || t.propertyAddress?.includes('1916 Wolcott')) ||
      rawData.tasks.find((t: any) => t.id === 'tsk_email_eml_matt_orr_1916_wolcott_0' || t.propertyAddress?.includes('1916 Wolcott'));
    expect(wolcottTask).toBeDefined();
    expect(wolcottTask?.photos).toBeDefined();
    expect(wolcottTask?.photos?.length).toBeGreaterThanOrEqual(1);
    expect(wolcottTask?.photos?.[0].name).toBe('1004.jpg');
  });

  it('6. Starts background email polling loop safely', () => {
    expect(() => startNoraEmailPollingLoop(30000)).not.toThrow();
  });
});
