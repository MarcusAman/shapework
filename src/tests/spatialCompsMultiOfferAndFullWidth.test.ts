/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Multi-Offer Bidding War & Full-Width Map Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Multi-Offer & Full-Width Map Capabilities Suite', () => {
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

  describe('1. Multi-Offer Bidding War Evaluation Engine', () => {
    it('compares multiple competing buyer offers and ranks them by risk-adjusted net yield', () => {
      const result = PropertyCompsRepository.compareMultipleOffers('prop_1104_arboretum');

      expect(result.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(result.totalOffers).toBeGreaterThanOrEqual(3);
      expect(result.offers.length).toBeGreaterThanOrEqual(3);

      const cashOffer = result.offers.find((o: any) => o.financingType === 'All Cash');
      const convOffer = result.offers.find((o: any) => o.financingType === 'Conventional 20%');

      expect(cashOffer).toBeDefined();
      expect(convOffer).toBeDefined();

      // Cash offer has higher certainty score
      expect(cashOffer.closingCertaintyScore).toBeGreaterThan(convOffer.closingCertaintyScore);
      expect(cashOffer.estimatedSellerNetProceeds).toBeGreaterThan(1150000);
      expect(result.topRecommendedOfferId).toBeDefined();
      expect(result.topOfferReasoning).toContain('Recommend');
      expect(result.executiveSummaryNotes.length).toBeGreaterThanOrEqual(3);
    });

    it('GET /api/comps/multi-offer/:subjectId returns evaluated competing offers', async () => {
      const res = await fetch(`${baseUrl}/api/comps/multi-offer/prop_742_lumina`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.comparison.subjectProperty.id).toBe('prop_742_lumina');
      expect(body.comparison.offers.length).toBeGreaterThanOrEqual(3);
      expect(body.comparison.offers[0].rank).toBe(1);
    });

    it('POST /api/comps/multi-offer/compare evaluates custom incoming buyer offers', async () => {
      const customOffers = [
        {
          id: 'offer_custom_1',
          buyerName: 'Arthur & Beatrice Pendelton',
          offerPrice: 1300000,
          dueDiligenceFee: 50000,
          dueDiligenceDays: 5,
          earnestMoney: 25000,
          financingType: 'All Cash',
          contingencies: 'No Contingencies (As-Is)',
          sellerConcessions: 0,
          closingDays: 10,
          brokerRepresenting: 'Nest Realty Wilmington'
        },
        {
          id: 'offer_custom_2',
          buyerName: 'David & Kimberly Clark',
          offerPrice: 1350000,
          dueDiligenceFee: 15000,
          dueDiligenceDays: 21,
          earnestMoney: 15000,
          financingType: 'Jumbo Loan 10%',
          contingencies: 'Financing & Appraisal',
          sellerConcessions: 10000,
          closingDays: 45,
          brokerRepresenting: 'Coldwell Banker Sea Coast Advantage'
        }
      ];

      const res = await fetch(`${baseUrl}/api/comps/multi-offer/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_1104_arboretum',
          offers: customOffers
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.comparison.totalOffers).toBe(2);
      // Cash offer should win due to rapid closing and high certainty
      expect(body.comparison.offers[0].buyerName).toBe('Arthur & Beatrice Pendelton');
      expect(body.comparison.offers[0].closingCertaintyScore).toBeGreaterThan(85);
    });
  });

  describe('2. Full-Width Map Canvas & Floating Pods Component Verification', () => {
    it('verifies MultiOfferMatrix and updated SpatialCompMap exist with floating glass panels', () => {
      const multiOfferPath = path.resolve(process.cwd(), 'src/components/comps/MultiOfferMatrix.tsx');
      const mapPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompMap.tsx');

      expect(fs.existsSync(multiOfferPath)).toBe(true);
      expect(fs.existsSync(mapPath)).toBe(true);

      const mapContent = fs.readFileSync(mapPath, 'utf-8');
      expect(mapContent).toContain('SpatialCompMap');
      expect(mapContent).toContain('backdrop-blur-md');
      expect(mapContent).toContain('isDrawerOpen');

      const multiOfferContent = fs.readFileSync(multiOfferPath, 'utf-8');
      expect(multiOfferContent).toContain('MultiOfferMatrix');
      expect(multiOfferContent).toContain('Closing Certainty');
      expect(multiOfferContent).toContain('Seller Net');
    });
  });
});
