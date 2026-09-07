/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Autonomous 80% Contract & Listing Agreement Auto-Drafter Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { ContractAutoDrafterService } from '../../server/services/contractAutoDrafterService.js';
import { contractAutoDrafterRouter } from '../../server/routes/contractAutoDrafterRoute.js';
import fs from 'fs';
import path from 'path';

describe('Nora Autonomous 80% Contract & Listing Auto-Drafter Suite', () => {
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

  describe('1. Autonomous County GIS & Deed Harvester (Form 2-T Purchase Offer)', () => {
    it('harvests public county records and compiles an 84% complete NC Form 2-T draft', async () => {
      const session = await ContractAutoDrafterService.dispatchAutoDraftSession({
        subjectPropertyId: 'prop_1104_arboretum',
        agreementType: 'nc_form_2t_offer',
        purchasePrice: 1475000,
        dueDiligenceFee: 25000,
        earnestMoneyDeposit: 25000,
        buyerNames: ['Jonathan Vance', 'Elena Vance']
      });

      expect(session.overallCompletionPercent).toBe(84);
      expect(session.autoVerifiedFieldCount).toBe(26);
      expect(session.totalFieldCount).toBe(31);
      expect(session.remainingAgentFieldsCount).toBe(5);
      expect(session.telemetry.length).toBe(5);

      // Verify Telemetry Steps
      expect(session.telemetry[0].source).toBe('County GIS Portal');
      expect(session.telemetry[0].details).toContain('Parcel PIN');
      expect(session.telemetry[1].source).toBe('Register of Deeds');
      expect(session.telemetry[1].details).toContain('Book');

      // Verify Legal & Financial Form 2-T Payload
      expect(session.form2tData).toBeDefined();
      expect(session.form2tData?.buyerNames).toEqual(['Jonathan Vance', 'Elena Vance']);
      expect(session.form2tData?.sellerNames[0]).toContain('Living Trust');
      expect(session.form2tData?.legalDescription.parcelPin).toContain('NHC-PIN-');
      expect(session.form2tData?.legalDescription.deedBook).toBe('6412');
      expect(session.form2tData?.legalDescription.deedPage).toBe('0842');
      expect(session.form2tData?.purchasePrice).toBe(1475000);
      expect(session.form2tData?.dueDiligenceFee).toBe(25000);
      expect(session.form2tData?.earnestMoneyDeposit).toBe(25000);
      expect(session.form2tData?.balanceAtClosing).toBe(1425000);
      expect(session.form2tData?.dueDiligencePeriodEnd).toContain('5:00 PM EST');
      expect(session.form2tData?.attachedAddenda.some(a => a.code === '2A12-T')).toBe(true);
    });
  });

  describe('2. Autonomous Listing Agreement Harvester (Form 101 Exclusive Listing)', () => {
    it('compiles NC Form 101 with commission splits, deed reference, and seller disclosure checklist', async () => {
      const session = await ContractAutoDrafterService.dispatchAutoDraftSession({
        subjectPropertyId: 'prop_1104_arboretum',
        agreementType: 'nc_form_101_listing'
      });

      expect(session.form101Data).toBeDefined();
      expect(session.form101Data?.totalCommissionPercent).toBe(5.5);
      expect(session.form101Data?.buyerAgentCommissionPercent).toBe(2.5);
      expect(session.form101Data?.sellerDisclosuresRequired.length).toBeGreaterThanOrEqual(2);
      expect(session.form101Data?.sellerDisclosuresRequired.some(d => d.includes('RPOADS'))).toBe(true);
      expect(session.form101Data?.sellerDisclosuresRequired.some(d => d.includes('MOG'))).toBe(true);
    });
  });

  describe('3. REST API Routes Integration', () => {
    it('GET /api/contracts/auto-draft/templates returns supported NC templates', async () => {
      const res = await fetch(`${baseUrl}/api/contracts/auto-draft/templates`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.templates.length).toBeGreaterThanOrEqual(3);
      expect(body.templates[0].code).toContain('NC Standard Form 2-T');
    });

    it('POST /api/contracts/auto-draft/dispatch dispatches harvester and returns draft session', async () => {
      const res = await fetch(`${baseUrl}/api/contracts/auto-draft/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_1104_arboretum',
          agreementType: 'nc_form_2t_offer',
          purchasePrice: 1450000
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.session.draftId).toBeDefined();
      expect(body.session.overallCompletionPercent).toBe(84);

      // Test GET /:draftId
      const getRes = await fetch(`${baseUrl}/api/contracts/auto-draft/${body.session.draftId}`);
      const getBody = await getRes.json();
      expect(getRes.status).toBe(200);
      expect(getBody.session.draftId).toBe(body.session.draftId);

      // Test POST /:draftId/update
      const updateRes = await fetch(`${baseUrl}/api/contracts/auto-draft/${body.session.draftId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'staged_for_esign' })
      });
      const updateBody = await updateRes.json();
      expect(updateRes.status).toBe(200);
      expect(updateBody.session.status).toBe('staged_for_esign');
      expect(updateBody.session.overallCompletionPercent).toBe(100);
    });
  });

  describe('4. Frontend Component File Integrity', () => {
    it('verifies ContractAutoDrafterWorkbench.tsx exists and renders workbench elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/contracts/ContractAutoDrafterWorkbench.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Nora Autonomous 80% Auto-Drafter');
      expect(content).toContain('NC Form 2-T');
      expect(content).toContain('NC Form 101');
      expect(content).toContain('Autonomous Harvester & Public Registry Telemetry');
      expect(content).toContain('Agent Discretion Review');
      expect(content).toContain('Stage into Dotloop / DocuSign');
    });

    it('verifies SpatialCompsView.tsx includes 80% Auto-Drafter subtab', () => {
      const spatialPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompsView.tsx');
      const content = fs.readFileSync(spatialPath, 'utf-8');

      expect(content).toContain('ContractAutoDrafterWorkbench');
      expect(content).toContain('80% Auto-Drafter');
      expect(content).toContain('contract_drafter');
    });
  });
});
