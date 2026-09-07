/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Historical Permitting & Tax Assessment Intelligence Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Historical Tax & Permits Intelligence Suite', () => {
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

  describe('1. Tax Assessment Progression & Permits Synthesis', () => {
    it('synthesizes 5-year assessment progression and parcel details', () => {
      const profile = PropertyCompsRepository.getTaxAndPermitProfile('prop_1104_arboretum');

      expect(profile.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(profile.countyTaxRecord.countyName).toBe('New Hanover County');
      expect(profile.countyTaxRecord.parcelId).toContain('NHC-PIN');
      expect(profile.countyTaxRecord.currentAssessedValue).toBeGreaterThan(1000000);
      expect(profile.countyTaxRecord.assessmentToMarketRatioPercent).toBeGreaterThan(90);

      // 5-Year progression check
      expect(profile.countyTaxRecord.historicalAssessments.length).toBe(5);
      expect(profile.countyTaxRecord.historicalAssessments[0].taxYear).toBe(2022);
      expect(profile.countyTaxRecord.historicalAssessments[4].taxYear).toBe(2026);
      expect(profile.countyTaxRecord.historicalAssessments[4].totalAssessedValue)
        .toBeGreaterThan(profile.countyTaxRecord.historicalAssessments[0].totalAssessedValue);
    });

    it('synthesizes verified building permits ledger and capital improvements total', () => {
      const profile = PropertyCompsRepository.getTaxAndPermitProfile('prop_1104_arboretum');

      expect(profile.buildingPermitsLedger.length).toBeGreaterThanOrEqual(4);
      
      const hvacPermit = profile.buildingPermitsLedger.find(p => p.category === 'HVAC');
      const roofPermit = profile.buildingPermitsLedger.find(p => p.category === 'Roof');
      const poolPermit = profile.buildingPermitsLedger.find(p => p.category === 'Pool & Outdoor');

      expect(hvacPermit).toBeDefined();
      expect(hvacPermit?.estimatedCost).toBe(28500);
      expect(roofPermit?.estimatedCost).toBe(42000);
      expect(poolPermit?.estimatedCost).toBe(85000);

      // Total Capital Upgrades ($28.5k + $42k + $85k = $155.5k)
      expect(profile.capitalImprovementsSummary.totalInvestedSinceBuild).toBe(155500);
      expect(profile.capitalImprovementsSummary.majorUpgradesCount).toBe(3);
    });

    it('evaluates submarket effective tax benchmarks and mechanical lifespans', () => {
      const profile = PropertyCompsRepository.getTaxAndPermitProfile('prop_1104_arboretum');

      expect(profile.submarketTaxComparisons.length).toBeGreaterThanOrEqual(4);
      expect(profile.submarketTaxComparisons.some(s => s.jurisdiction.includes('Landfall'))).toBe(true);
      expect(profile.submarketTaxComparisons.some(s => s.jurisdiction.includes('Wrightsville'))).toBe(true);

      // Mechanical lifespans
      expect(profile.mechanicalLifespanStatus.roofSystem.remainingLifeYears).toBe(28);
      expect(profile.mechanicalLifespanStatus.hvacSystem.remainingLifeYears).toBe(13);
      expect(profile.mechanicalLifespanStatus.poolSystem.remainingLifeYears).toBe(18);
    });

    it('GET /api/comps/tax-and-permits/:subjectId returns profile via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/tax-and-permits/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.profile.countyTaxRecord.parcelId).toBeDefined();
      expect(body.profile.capitalImprovementsSummary.totalInvestedSinceBuild).toBe(155500);
    });
  });

  describe('2. Frontend Component File Integrity', () => {
    it('verifies TaxAndPermitsView exists and renders assessment and permit sections', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/TaxAndPermitsView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Historical Permitting & Tax Assessment Intelligence');
      expect(content).toContain('5-Year County Assessment Progression');
      expect(content).toContain('Verified Municipal Building Permits & Capital Improvements');
      expect(content).toContain('Major Mechanical Systems & Warranty Status');
    });
  });
});
