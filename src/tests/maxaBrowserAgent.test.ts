import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { MaxaBrowserAgentService } from '../../server/services/maxaBrowserAgentService.js';
import { maxaBrowserAgentRouter } from '../../server/routes/maxaBrowserAgentRoute.js';
import type { Server } from 'http';

describe('Nora Autonomous Maxa Browser Agent & VA Review Staging', () => {
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

  it('1. MaxaBrowserAgentService dispatches runs and generates 300 DPI proof package', async () => {
    const run = await MaxaBrowserAgentService.dispatchRun({
      campaignId: 'camp_test_maxa_01',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
      agentName: 'Sarah Jenkins',
      agentPhone: '(910) 555-0199',
      agentEmail: 'sarah@nestrealty.com',
      packageType: 'Luxury Collateral Suite',
      requestedAssets: ['8.5x11 Property Flyer', '9:16 Social Story', '6x9 EDDM Postcard'],
      price: '$895,000',
      bedsBaths: '4 Beds / 3.5 Baths'
    });

    expect(run).toBeDefined();
    expect(run.status).toBe('staged_in_va');
    expect(run.assignedVa).toBe('Eduardo Lovo');
    expect(run.progressPercent).toBe(100);
    expect(run.generatedDeliverables.length).toBe(3);
    expect(run.generatedDeliverables[0].dpi).toBe(300);
    expect(run.ncrecComplianceReport.passed).toBe(true);
    expect(run.googleDriveProofFolderUrl).toContain('nest_marketing_proofs');
  });

  it('2. POST /api/marketing/browser-agent/dispatch validates input and returns live run telemetry', async () => {
    const payload = {
      campaignId: 'camp_api_test_02',
      propertyAddress: '990 Inspiration Drive, Wilmington, NC',
      agentName: 'Melissa Gagliardi',
      agentPhone: '(910) 555-0811',
      agentEmail: 'melissa@nestrealty.com'
    };

    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.run.propertyAddress).toBe('990 Inspiration Drive, Wilmington, NC');
    expect(data.run.assignedVa).toBe('Eduardo Lovo');
    expect(data.run.logs.length).toBeGreaterThan(3);
  });

  it('3. GET /api/marketing/browser-agent/runs/:runId retrieves stored run', async () => {
    const run = await MaxaBrowserAgentService.dispatchRun({
      campaignId: 'camp_get_test',
      propertyAddress: '312 Mayfaire Way',
      agentName: 'Ann Gunn',
      agentPhone: '(910) 555-0377',
      agentEmail: 'ann@nestrealty.com',
      packageType: 'Sign Rider Suite',
      requestedAssets: ['8.5x11 Flyer']
    });

    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/runs/${run.runId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.run.runId).toBe(run.runId);
  });
});
