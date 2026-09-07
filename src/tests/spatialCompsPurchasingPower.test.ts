/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HNW Jumbo Mortgage & Buyer Purchasing Power Matrix Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps HNW Jumbo Mortgage & Purchasing Power Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/comps', propertyCompsRouter);

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

  describe('1. Mortgage Amortization & P&I Calculation Math', () => {
    it('calculates accurate monthly P&I for $1,000,000 loan at 6.25% (30-year)', () => {
      const pi = PropertyCompsRepository.calculateMonthlyPI(1000000, 6.25, 30);
      // Monthly payment for $1.0M at 6.25% is approx $6,157
      expect(pi).toBeGreaterThan(6100);
      expect(pi).toBeLessThan(6200);
    });

    it('calculates 15-year fixed payment accurately', () => {
      const pi15 = PropertyCompsRepository.calculateMonthlyPI(1000000, 5.75, 15);
      // 15-year payment for $1.0M at 5.75% is approx $8,304
      expect(pi15).toBeGreaterThan(8200);
      expect(pi15).toBeLessThan(8400);
    });

    it('returns 0 for zero principal loan', () => {
      expect(PropertyCompsRepository.calculateMonthlyPI(0, 6.5, 30)).toBe(0);
    });
  });

  describe('2. Purchasing Power Matrix Synthesis', () => {
    it('generates rate sensitivity grid (5.75% - 7.25%) with progressive monthly outlay', () => {
      const matrix = PropertyCompsRepository.calculatePurchasingPowerMatrix('prop_1104_arboretum', {
        customInterestRate: 6.25,
        customDownPaymentPercent: 20
      });

      expect(matrix.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(matrix.rateTiers.length).toBe(7);

      // Verify lower rates produce lower monthly P&I
      const rate575 = matrix.rateTiers.find(t => t.ratePercent === 5.75)!;
      const rate725 = matrix.rateTiers.find(t => t.ratePercent === 7.25)!;

      expect(rate575.monthlyPI).toBeLessThan(rate725.monthlyPI);
      expect(rate575.monthlySavingsVsBaseline).toBeGreaterThan(0);
    });

    it('generates 4 down payment scenarios with cash-to-close calculations', () => {
      const matrix = PropertyCompsRepository.calculatePurchasingPowerMatrix('prop_1104_arboretum');

      expect(matrix.downPaymentTiers.length).toBe(4);
      
      const tier10 = matrix.downPaymentTiers.find(t => t.downPaymentPercent === 10)!;
      const tier20 = matrix.downPaymentTiers.find(t => t.downPaymentPercent === 20)!;
      const tierCash = matrix.downPaymentTiers.find(t => t.downPaymentPercent === 100)!;

      expect(tier10.monthlyPMI).toBeGreaterThan(0); // PMI on 10% down
      expect(tier20.monthlyPMI).toBe(0); // No PMI on 20% down
      expect(tierCash.monthlyPI).toBe(0); // No debt service on all-cash
      expect(tierCash.netCashToClose).toBeGreaterThan(1250000);
    });

    it('GET /api/comps/purchasing-power/:subjectId returns matrix payload via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/purchasing-power/prop_1104_arboretum?rate=6.5&downPayment=25`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.matrix.benchmarkRate).toBe(6.5);
      expect(body.matrix.escrowComponents.monthlyHoaDues).toBeGreaterThan(0);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies PurchasingPowerMatrixView exists and contains underwriting sections', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/PurchasingPowerMatrixView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Interest Rate Sensitivity Grid');
      expect(content).toContain('Itemized Monthly Housing Outlay');
      expect(content).toContain('Estimated Cash-to-Close Settlement Sheet');
    });
  });
});
