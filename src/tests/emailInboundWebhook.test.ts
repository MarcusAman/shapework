import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { emailInboundWebhookRouter } from '../../server/routes/emailInboundWebhookRouter.js';
import {
  getCanonicalMarketingRequestById,
  getCanonicalMarketingTaskById,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Zero-OAuth Universal Inbound Email Webhook Test Suite', () => {
  let app: express.Express;

  beforeEach(async () => {
    resetCanonicalStoreForTesting();
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool();
      if (pool) {
        await pool.query(`
          DELETE FROM canonical_marketing_tasks 
          WHERE property_address ILIKE '%1914 Wolcott%' 
             OR property_address ILIKE '%704 Forest Hills%';
        `).catch(() => {});
        await pool.query(`
          DELETE FROM canonical_marketing_requests 
          WHERE property_address ILIKE '%1914 Wolcott%' 
             OR property_address ILIKE '%704 Forest Hills%';
        `).catch(() => {});
      }
    } catch {}

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/webhooks/email', emailInboundWebhookRouter);
  });

  it('1. Verifies the Zero-OAuth Inbound Email Webhook health endpoint returns healthy status', async () => {
    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'GET',
        url: '/health',
        headers: {}
      };
      const mockRes: any = {
        json: (data: any) => resolve({ status: 200, body: data }),
        status: (s: number) => ({
          json: (data: any) => resolve({ status: s, body: data })
        })
      };
      (emailInboundWebhookRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.body.status).toBe('healthy');
    expect(res.body.authType).toBe('zero_oauth_forwarding_webhook');
    expect(res.body.inboundAddress).toBe('AskNora@nestrealty.com');
  });

  it('2. Successfully ingests inbound email from marcus.aman@gmail.com for 1914 Wolcott Ave and creates request & task with 1004.jpg', async () => {
    const payload = {
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'AskNora@nestrealty.com',
      subject: '1914 Wolcott Ave Marketing Request',
      text: 'Hi Nora, I need a 1 page flyer for this new listing. 1400 sq ft, 3 bed 2 bath, fully remodeled, $560,000. Going live Sep 24. Picture is attached.',
      attachments: [
        {
          filename: '1004.jpg',
          type: 'image/jpeg',
          sizeBytes: 3840000,
          url: '/images/properties/1916_wolcott_1004.jpg'
        }
      ]
    };

    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/inbound',
        body: payload,
        headers: { 'content-type': 'application/json' }
      };
      const mockRes: any = {
        status: (s: number) => ({
          json: (data: any) => resolve({ status: s, body: data })
        }),
        json: (data: any) => resolve({ status: 200, body: data })
      };
      (emailInboundWebhookRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.propertyAddress).toContain('1914 Wolcott Ave');
    expect(res.body.agentEmail).toBe('marcus.aman@gmail.com');
    expect(res.body.agentName).toBe('Marcus Aman');
    expect(res.body.photosCount).toBeGreaterThanOrEqual(1);

    // Verify Ingested Canonical Request
    const createdReq = getCanonicalMarketingRequestById(res.body.requestId);
    expect(createdReq).toBeDefined();
    expect(createdReq?.agentEmail).toBe('marcus.aman@gmail.com');
    expect(createdReq?.photos).toBeDefined();
    expect(createdReq?.photos![0].name).toBe('1004.jpg');
    expect(createdReq?.photos![0].url).toContain('1004.jpg');
    expect(createdReq?.photos![0].driveUrl).toContain('1-Vph9XRJ6LCjllp9A0g5Y0M227lWack');

    // Verify Ingested Canonical Task
    const createdTask = getCanonicalMarketingTaskById(res.body.taskIds[0]);
    expect(createdTask).toBeDefined();
    expect(createdTask?.title).toBe('1-Page Property Flyer (8.5x11)');
    expect(createdTask?.assignedTo).toBe('Melissa Gagliardi');
    expect(createdTask?.photos).toBeDefined();
    expect(createdTask?.photos![0].url).toContain('1004.jpg');
  });

  it('3. Ingests base64 encoded photo attachments seamlessly without OAuth tokens', async () => {
    // 1x1 transparent GIF / JPEG test base64
    const sampleBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const payload = {
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      to: 'AskNora@nestrealty.com',
      subject: '704 Forest Hills Dr Marketing Request',
      text: 'Please prepare the marketing collateral suite for 704 Forest Hills Dr.',
      attachments: [
        {
          name: 'forest_hills_hero.jpg',
          type: 'image/jpeg',
          sizeBytes: 1024,
          content: sampleBase64
        }
      ]
    };

    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/inbound',
        body: payload,
        headers: { 'content-type': 'application/json' }
      };
      const mockRes: any = {
        status: (s: number) => ({
          json: (data: any) => resolve({ status: s, body: data })
        }),
        json: (data: any) => resolve({ status: 200, body: data })
      };
      (emailInboundWebhookRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.propertyAddress).toContain('704 Forest Hills Dr');
    expect(res.body.agentEmail).toBe('matt.orr@nestrealty.com');
    expect(res.body.photosCount).toBe(1);

    const createdReq = getCanonicalMarketingRequestById(res.body.requestId);
    expect(createdReq).toBeDefined();
    expect(createdReq?.photos![0].name).toBe('forest_hills_hero.jpg');
    expect(createdReq?.photos![0].url).toContain('forest_hills_hero.jpg');
  });
});
