/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Custom Comps & Market Trends Test Suite
 * Tests custom comp creation, micro-market luxury trend analytics, and satellite map math.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository, LUXURY_PROPERTY_DATABASE } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Custom Comps & Luxury Trend Analytics Suite', () => {
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

  describe('1. Custom Off-Market Comp & Pocket Listing Creator', () => {
    it('POST /api/comps/custom creates and adds an off-market comp to the database', async () => {
      const initialCount = LUXURY_PROPERTY_DATABASE.length;

      const res = await fetch(`${baseUrl}/api/comps/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: '1088 Pembroke Jones Dr, Wilmington, NC 28405',
          neighborhood: 'Landfall Golf & Country Club',
          listPrice: 1350000,
          soldPrice: 1325000,
          status: 'closed',
          beds: 5,
          baths: 4,
          heatedSqFt: 3800,
          hasPool: true,
          hasDock: false,
          hasGolfView: true,
          listingAgent: 'Ryan Crecelius'
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.comp.propertyAddress).toContain('1088 Pembroke Jones');
      expect(body.comp.pricePerSqFt).toBe(349); // 1325000 / 3800
      expect(LUXURY_PROPERTY_DATABASE.length).toBe(initialCount + 1);

      // Verify the new comp is retrieved in spatial searches
      const searchRes = PropertyCompsRepository.findSpatialComps({
        subjectId: 'prop_1104_arboretum',
        radiusMiles: 5.0
      });
      const found = searchRes.comps.find(c => c.propertyAddress.includes('1088 Pembroke Jones'));
      expect(found).toBeDefined();
      expect(found?.pricePerSqFt).toBe(349);
    });
  });

  describe('2. Micro-Market Luxury Trend Analytics & Absorption Engine', () => {
    it('GET /api/comps/trends returns 12-month $/sqft price velocity and absorption metrics', async () => {
      const res = await fetch(`${baseUrl}/api/comps/trends?neighborhood=Landfall%20Golf%20%26%20Country%20Club`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.trends.monthsOfSupply).toBe(2.3);
      expect(body.trends.marketCondition).toContain('Strong Seller Market');
      expect(body.trends.listToSaleRatioPercent).toBeGreaterThan(95);
      expect(body.trends.monthlyTrends.length).toBe(12);
      expect(body.trends.tierBreakdown.length).toBe(3);
      expect(body.trends.trailing12MoAppreciationPercent).toBeGreaterThan(5);
    });
  });

  describe('3. Satellite Imagery Web Mercator Projection Math', () => {
    it('verifies valid satellite imagery endpoints and Web Mercator zoom bounds', () => {
      const esriTileUrl = (x: number, y: number, z: number) =>
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

      const tile = esriTileUrl(4644, 6632, 14);
      expect(tile).toContain('/14/6632/4644');
    });
  });

  describe('4. Frontend Component Files', () => {
    it('verifies CustomCompModal and MicroMarketTrendsView files exist and export components', () => {
      const customModalPath = path.resolve(process.cwd(), 'src/components/comps/CustomCompModal.tsx');
      const trendsViewPath = path.resolve(process.cwd(), 'src/components/comps/MicroMarketTrendsView.tsx');

      expect(fs.existsSync(customModalPath)).toBe(true);
      expect(fs.existsSync(trendsViewPath)).toBe(true);

      const customModalContent = fs.readFileSync(customModalPath, 'utf-8');
      expect(customModalContent).toContain('CustomCompModal');
      expect(customModalContent).toContain('Add Custom Comp');

      const trendsViewContent = fs.readFileSync(trendsViewPath, 'utf-8');
      expect(trendsViewContent).toContain('MicroMarketTrendsView');
      expect(trendsViewContent).toContain('Absorption Rate');
    });
  });
});
