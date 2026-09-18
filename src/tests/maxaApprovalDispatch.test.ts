import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { maxaBrowserAgentRouter } from '../../server/routes/maxaBrowserAgentRoute.js';
import type { Server } from 'http';

describe('Maxa Multi-Select Approval Dispatch Suite', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(maxaBrowserAgentRouter);

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

  it('1. POST /api/marketing/browser-agent/share-approval dispatches SMS and Email to default recipient Eduardo Lovo', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/share-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: 'camp_1104',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
        recipients: ['eduardo'],
        channels: { sms: true, email: true },
        proofUrls: {
          driveUrl: 'https://drive.google.com/drive/folders/nest_marketing_proofs_1104',
          maxaUrl: 'https://nest.maxadesigns.com/projects/prj_1104'
        }
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.stagedWorkspaces).toContain("Eduardo Lovo's VA Workstation");
    expect(data.dispatchedAlerts.length).toBe(2);
    expect(data.dispatchedAlerts[0].recipientName).toBe('Eduardo Lovo');
    expect(data.dispatchedAlerts[0].type).toBe('sms');
    expect(data.dispatchedAlerts[1].type).toBe('email');
  });

  it('2. Dispatches to multiple selected recipients (Eduardo and Melissa)', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/share-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: 'camp_1104',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
        recipients: ['eduardo', 'melissa'],
        channels: { sms: true, email: true }
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.stagedWorkspaces).toContain("Eduardo Lovo's VA Workstation");
    expect(data.stagedWorkspaces).toContain("Melissa Gagliardi's Marketing Queue");
    expect(data.dispatchedAlerts.length).toBe(4); // 2 SMS + 2 Email
  });
});
