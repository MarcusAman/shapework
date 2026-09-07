/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps 8-Page Maxa Luxury CMA Presentation Deck Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps 8-Page Luxury CMA Deck Suite', () => {
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

  describe('1. 8-Page Luxury CMA Deck Synthesis Engine', () => {
    it('synthesizes complete 8-page presentation model with pricing corridor and net sheet', () => {
      const deck = PropertyCompsRepository.generateCmaDeckPayload(
        'prop_1104_arboretum',
        'Harrison & Claire Vance',
        'Ryan Crecelius, Managing Broker'
      );

      expect(deck.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(deck.clientName).toBe('Harrison & Claire Vance');
      expect(deck.agentName).toContain('Ryan Crecelius');
      expect(deck.brokerageName).toBe('Nest Realty Wilmington');

      // Page 2: Pricing corridor & Executive Memo
      expect(deck.valuationTargetRange.recommendedListPrice).toBe(1250000);
      expect(deck.valuationTargetRange.conservativePrice).toBeLessThan(deck.valuationTargetRange.recommendedListPrice);
      expect(deck.executiveMemo.bodyParagraphs.length).toBeGreaterThanOrEqual(3);

      // Page 3: Spatial Context & Isochrones
      expect(deck.spatialContext.totalNearbySales).toBeGreaterThanOrEqual(3);
      expect(deck.spatialContext.isochrones.beachMinutes).toBeDefined();

      // Page 4: Comparable Matrix
      expect(deck.comparableMatrix.length).toBeGreaterThanOrEqual(3);
      expect(deck.comparableMatrix[0].soldPrice).toBeGreaterThan(0);

      // Page 5: Appraisal Adjustments
      expect(deck.appraisalAdjustments.length).toBeGreaterThanOrEqual(3);
      expect(deck.appraisalAdjustments[0].adjustedIndicatedValue).toBeGreaterThan(1000000);

      // Page 6: Micro Trends
      expect(deck.microMarketTrends.annualAppreciationPercent).toBeDefined();
      expect(deck.microMarketTrends.priceTrajectory.length).toBeGreaterThanOrEqual(4);

      // Page 7: Flood Risk
      expect(deck.floodAndElevationRisk.femaZone).toContain('Zone X');
      expect(deck.floodAndElevationRisk.groundElevationFeet).toBeGreaterThanOrEqual(25);

      // Page 8: Seller Net Sheet
      expect(deck.sellerNetProceedsSheet.grossSalePrice).toBe(1250000);
      expect(deck.sellerNetProceedsSheet.brokerageCommission).toBe(62500); // 5%
      expect(deck.sellerNetProceedsSheet.ncExciseTax).toBe(2500); // $1 per $500
      expect(deck.sellerNetProceedsSheet.estimatedSellerNet).toBeGreaterThan(1150000);
      expect(deck.sellerNetProceedsSheet.netProceedsPercent).toBeGreaterThan(90);
    });

    it('POST /api/comps/generate-cma-deck returns complete 8-page deck payload', async () => {
      const res = await fetch(`${baseUrl}/api/comps/generate-cma-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_742_lumina',
          clientName: 'Robert & Elena Sterling'
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.deck.subjectProperty.id).toBe('prop_742_lumina');
      expect(body.deck.clientName).toBe('Robert & Elena Sterling');
      expect(body.deck.floodAndElevationRisk.femaZone).toContain('Zone AE');
    });
  });

  describe('2. Frontend Component File Integrity', () => {
    it('verifies LuxuryCmaBookletModal exists and exports component with print layout', () => {
      const modalPath = path.resolve(process.cwd(), 'src/components/comps/LuxuryCmaBookletModal.tsx');
      expect(fs.existsSync(modalPath)).toBe(true);

      const content = fs.readFileSync(modalPath, 'utf-8');
      expect(content).toContain('LuxuryCmaBookletModal');
      expect(content).toContain('Print / Export 300 DPI PDF');
      expect(content).toContain('PAGE 1: COVER PRESENTATION');
      expect(content).toContain('PAGE 8: SELLER NET PROCEEDS');
    });
  });
});
