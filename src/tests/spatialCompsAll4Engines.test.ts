/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 4 Next-Gen Spatial Intelligence Engines Test Suite:
 * 1. Direct Mail & USPS EDDM Route Mapper
 * 2. Solar Exposure & Pool Sunlight Simulator
 * 3. Lot Topography & Setbacks Viewer
 * 4. Micro-Climate & Coastal Wind Intelligence
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps 4 Next-Gen Intelligence Engines Suite', () => {
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

  describe('1. Direct Mail & USPS EDDM Engine', () => {
    it('calculates USPS carrier routes, 250 spatial neighbors and print pricing', () => {
      const campaign = PropertyCompsRepository.getDirectMailCampaignProfile('prop_1104_arboretum');

      expect(campaign.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(campaign.carrierRoutes.length).toBe(2);
      expect(campaign.metrics.totalRecipients).toBe(250);
      expect(campaign.metrics.totalCostPerCard).toBeCloseTo(0.602, 2);
      expect(campaign.metrics.totalCampaignCost).toBeCloseTo(150.50, 1);
    });

    it('POST /api/comps/direct-mail/dispatch returns print queue confirmation', async () => {
      const res = await fetch(`${baseUrl}/api/comps/direct-mail/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: 'prop_1104_arboretum', size: '6x9_oversized' })
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.orderConfirmationNumber).toContain('EDDM-NC-');
      expect(body.recipients).toBe(250);
    });
  });

  describe('2. Solar Exposure & Pool Sunlight Simulator', () => {
    it('simulates diurnal solar altitude and pool sunlight percentages', () => {
      const summerData = PropertyCompsRepository.getSolarExposureProfile('prop_1104_arboretum', { season: 'summer', timeHour: 14 });
      const winterData = PropertyCompsRepository.getSolarExposureProfile('prop_1104_arboretum', { season: 'winter', timeHour: 14 });

      expect(summerData.currentSunMetrics.solarAltitudeDegrees).toBeGreaterThan(winterData.currentSunMetrics.solarAltitudeDegrees);
      expect(summerData.currentSunMetrics.poolSunlightCoveragePercent).toBe(95);
      expect(summerData.hourlySunPath.length).toBe(13);
      expect(summerData.solarRoofCapacity.estimatedAnnualElectricSavings).toBe(2850);
    });

    it('GET /api/comps/solar-exposure/:subjectId returns payload via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/solar-exposure/prop_1104_arboretum?season=summer&hour=13`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.solarProfile.currentSunMetrics.poolSunlightCoveragePercent).toBeGreaterThan(70);
    });
  });

  describe('3. Lot Topography & Setbacks Viewer', () => {
    it('computes lot dimensions, setbacks, buildable footprint and slope grading', () => {
      const topo = PropertyCompsRepository.getLotTopographyProfile('prop_1104_arboretum');

      expect(topo.lotDimensions.frontageFeet).toBe(120);
      expect(topo.lotDimensions.depthFeet).toBe(165);
      expect(topo.setbacks.frontYardFeet).toBe(30);
      expect(topo.setbacks.rearYardFeet).toBe(25);
      expect(topo.buildableFootprintSqFt).toBe(9900);
      expect(topo.topographyAndGrading.slopePercentage).toBe(1.4);
      expect(topo.preservationCanopy.matureLiveOaksCount).toBe(4);
    });

    it('GET /api/comps/lot-topography/:subjectId returns topography via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/lot-topography/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.topography.buildableFootprintSqFt).toBe(9900);
    });
  });

  describe('4. Micro-Climate & Coastal Wind Intelligence', () => {
    it('synthesizes seasonal wind rose vectors, sea breeze cooling and storm shelter', () => {
      const micro = PropertyCompsRepository.getMicroClimateProfile('prop_1104_arboretum');

      expect(micro.windRosePatterns.length).toBe(4);
      const summerWind = micro.windRosePatterns.find(w => w.season.includes('Summer'))!;
      expect(summerWind.prevailingDirection).toContain('South-Southwest');
      expect(summerWind.seaBreezeCoolingEffectDeltaF).toBe(-4.5);
      expect(micro.stormProtectionShielding.hurricaneSurgeTopographicSafetyMarginFeet).toBe(24.5);
    });

    it('GET /api/comps/micro-climate/:subjectId returns microclimate via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/micro-climate/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.microClimate.summerSeaBreezeCoolingDeltaF).toBe(4.5);
    });
  });

  describe('5. Component Files Integrity', () => {
    it('verifies all 4 view component files exist on disk', () => {
      const components = [
        'DirectMailWorksheetView.tsx',
        'SolarExposureSimulatorView.tsx',
        'LotTopographyAndSetbacksView.tsx',
        'MicroClimateAndWindView.tsx'
      ];

      for (const comp of components) {
        const filePath = path.resolve(process.cwd(), 'src/components/comps', comp);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });
  });
});
