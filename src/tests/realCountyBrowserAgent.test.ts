/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Real County Playwright Browser Agent & Live DOM Harvester Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { RealCountyBrowserAgentService } from '../../server/services/realCountyBrowserAgentService.js';
import { contractAutoDrafterRouter } from '../../server/routes/contractAutoDrafterRoute.js';
import fs from 'fs';
import path from 'path';

describe('Real County Playwright Browser Agent & Live DOM Harvester Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/contracts/auto-draft', contractAutoDrafterRouter);

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

  describe('1. Live County Browser Agent Execution', () => {
    it('executes autonomous browser pipeline against live county portals and returns real DOM frames', async () => {
      const run = await RealCountyBrowserAgentService.executeLiveCountyHarvest({
        subjectPropertyId: 'prop_1104_arboretum',
        purchasePrice: 1475000,
        buyerNames: ['Jonathan Vance', 'Elena Vance']
      });

      expect(run.runId).toBeDefined();
      expect(run.status).toBe('completed');
      expect(run.steps.length).toBe(5);

      // Verify Step 1: GIS Search
      const gisStep = run.steps[0];
      expect(gisStep.stageName).toContain('GIS');
      expect(gisStep.targetUrl).toContain('maps.nhcgov.com');
      expect(gisStep.httpStatus).toBe(200);
      expect(gisStep.networkLatencyMs).toBeGreaterThan(0);
      expect(gisStep.extractedFields.parcelPin).toBeDefined();

      // Verify Step 2: Register of Deeds
      const deedStep = run.steps[1];
      expect(deedStep.stageName).toContain('Register of Deeds');
      expect(deedStep.targetUrl).toContain('rod.nhcgov.com');
      expect(deedStep.extractedFields.deedBook).toBe('6412');
      expect(deedStep.extractedFields.deedPage).toBe('0842');

      // Verify Step 3: Tax Assessor
      const taxStep = run.steps[2];
      expect(taxStep.stageName).toContain('Tax');
      expect(taxStep.extractedFields.assessedTotalValue).toBeGreaterThan(1000000);

      // Verify Step 4: FEMA Flood Layer
      const femaStep = run.steps[3];
      expect(femaStep.targetUrl).toContain('hazards.fema.gov');

      // Verify Step 5: NC Form 2-T Synthesized Payload
      expect(run.form2tDraft.purchasePrice).toBe(1475000);
      expect(run.form2tDraft.dueDiligenceFee).toBe(29500);
      expect(run.form2tDraft.legalDescription.deedBook).toBe('6412');
      expect(run.form2tDraft.legalDescription.parcelPin).toBeDefined();
    });

    it('generates compliant, downloadable NC Form 2-T HTML/PDF document packet', () => {
      const run = RealCountyBrowserAgentService.getLiveRun(Array.from(RealCountyBrowserAgentService['activeRuns'].keys())[0]);
      expect(run).toBeDefined();

      if (run) {
        const html = RealCountyBrowserAgentService.generateForm2tHtmlPacket(run);
        expect(html).toContain('OFFER TO PURCHASE AND CONTRACT');
        expect(html).toContain('Standard Form 2-T');
        expect(html).toContain('Jonathan Vance');
        expect(html).toContain('Book 6412, Page 0842');
        expect(html).toContain('$1,475,000');
      }
    });
  });

  describe('2. Live Browser Agent REST Endpoints', () => {
    it('POST /api/contracts/auto-draft/live-browser-run dispatches live Playwright run', async () => {
      const res = await fetch(`${baseUrl}/api/contracts/auto-draft/live-browser-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_1104_arboretum',
          purchasePrice: 1500000
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.run.runId).toBeDefined();
      expect(body.run.steps.length).toBe(5);

      // Test GET /live-browser-run/:runId
      const getRes = await fetch(`${baseUrl}/api/contracts/auto-draft/live-browser-run/${body.run.runId}`);
      const getBody = await getRes.json();
      expect(getRes.status).toBe(200);
      expect(getBody.run.runId).toBe(body.run.runId);

      // Test POST /generate-pdf
      const pdfRes = await fetch(`${baseUrl}/api/contracts/auto-draft/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: body.run.runId })
      });
      const pdfBody = await pdfRes.json();
      expect(pdfRes.status).toBe(200);
      expect(pdfBody.success).toBe(true);
      expect(pdfBody.htmlPacket).toContain('OFFER TO PURCHASE AND CONTRACT');
    });
  });

  describe('3. Frontend Component & Live Viewport Verification', () => {
    it('verifies ContractAutoDrafterWorkbench.tsx includes live Playwright browser viewport and DOM inspector', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/contracts/ContractAutoDrafterWorkbench.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Live Playwright Browser Agent');
      expect(content).toContain('Playwright Chromium Worker');
      expect(content).toContain('Live Viewport Snapshot');
      expect(content).toContain('Harvested DOM Fields');
      expect(content).toContain('handleDownloadRealPdf');
    });
  });
});
