import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { marketingQuestionsRouter } from './marketingQuestionsRoute.js';
import type { Server } from 'http';

describe('POST /api/marketing/requests/send-questions', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(marketingQuestionsRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('1. Returns 400 if recipient name or contact coordinates are missing', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('2. Rejects hotline (910) 507-2047 and placeholder email with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: 'camp_test_prohibited',
        recipientName: 'Unknown Agent',
        recipientPhone: '(910) 507-2047',
        recipientEmail: 'agent@nestrealty.com',
        channels: ['email', 'sms'],
        message: 'Test message',
        propertyAddress: '123 Fake St'
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('3. Re-resolves canonical Matt Orr and safely saves draft when outbound is disabled', async () => {
    const payload = {
      campaignId: 'camp_test_matt_orr',
      requesterId: 'dir_matt_orr_10',
      recipientName: 'Matt Orr',
      channels: ['sms', 'email'],
      message: 'Could you please confirm the open house schedule for this weekend?',
      selectedQuestions: ['Open-house dates/times'],
      propertyAddress: '100 Matt Way, Wilmington, NC 28403',
      actorName: 'Eduardo Lovo'
    };

    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.outboundDisabled).toBe(true);
    expect(data.mode).toBe('draft_saved');
    expect(data.recipient.name).toBe('Matt Orr');
    expect(data.recipient.maskedEmail).toBe('m•••@nestrealty.com');
    expect(data.recipient.maskedPhone).toBe('(910) •••-8283');
    expect(data.channels.email.status).toBe('draft_saved');
    expect(data.channels.sms.status).toBe('draft_saved');
    expect(data.message).toContain('Outreach draft saved');
  });
});
