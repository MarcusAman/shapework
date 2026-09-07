/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Brokerage Market Share & In-House Buyer Matching Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Brokerage Market Share & In-House Buyer Cross-Match Suite', () => {
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

  describe('1. Submarket Brokerage Market Share Intelligence', () => {
    it('calculates Nest Realty as #1 market share leader in luxury coastal transactions', () => {
      const share = PropertyCompsRepository.getBrokerageMarketShare('all');

      expect(share.nestRealtyMarketRank).toBe('#1 Luxury Brokerage');
      expect(share.nestRealtyVolume).toBeGreaterThan(50000000);
      expect(share.nestRealtySharePercent).toBeGreaterThan(30);
      expect(share.velocityDeltaDays).toBe(13); // 11d vs 24d
      expect(share.leaderboard.length).toBeGreaterThanOrEqual(4);
      expect(share.leaderboard[0].isNestRealty).toBe(true);
    });

    it('GET /api/comps/brokerage-share returns competitive leaderboard', async () => {
      const res = await fetch(`${baseUrl}/api/comps/brokerage-share?neighborhood=Landfall`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.shareData.leaderboard[0].brokerageName).toContain('Nest Realty');
    });
  });

  describe('2. In-House Luxury Buyer Cross-Matching Engine', () => {
    it('cross-matches Landfall (1104 Arboretum) with high match scores for Vance Family and Dr. Alston', () => {
      const matches = PropertyCompsRepository.findInHouseBuyerMatches('prop_1104_arboretum');

      expect(matches.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(matches.totalMatchedBuyers).toBeGreaterThanOrEqual(3);
      expect(matches.matchedBuyers.length).toBeGreaterThanOrEqual(4);

      const topBuyer = matches.matchedBuyers[0];
      expect(topBuyer.matchScore).toBeGreaterThanOrEqual(90);
      expect(topBuyer.matchReasons?.length).toBeGreaterThanOrEqual(2);
      expect(topBuyer.representingAgent).toBeDefined();
    });

    it('GET /api/comps/buyer-matches/:subjectId returns ranked in-house buyers', async () => {
      const res = await fetch(`${baseUrl}/api/comps/buyer-matches/prop_742_lumina`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.matchedBuyers.length).toBeGreaterThanOrEqual(4);
    });

    it('POST /api/comps/dispatch-preview simulates private off-market preview alerts', async () => {
      const res = await fetch(`${baseUrl}/api/comps/dispatch-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_1104_arboretum'
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.totalAlertsSent).toBeGreaterThanOrEqual(2);
      expect(body.dispatchedReceipts[0].status).toBe('SENT');
      expect(body.dispatchedReceipts[0].messageSnippet).toContain('Nora flagged a 98% in-house match');
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies InHouseBuyerMatchView and BrokerageMarketShareView exist and export components', () => {
      const matchPath = path.resolve(process.cwd(), 'src/components/comps/InHouseBuyerMatchView.tsx');
      const sharePath = path.resolve(process.cwd(), 'src/components/comps/BrokerageMarketShareView.tsx');

      expect(fs.existsSync(matchPath)).toBe(true);
      expect(fs.existsSync(sharePath)).toBe(true);

      const matchContent = fs.readFileSync(matchPath, 'utf-8');
      expect(matchContent).toContain('InHouseBuyerMatchView');
      expect(matchContent).toContain('Broadcast Private Preview');

      const shareContent = fs.readFileSync(sharePath, 'utf-8');
      expect(shareContent).toContain('BrokerageMarketShareView');
      expect(shareContent).toContain('Leaderboard');
    });
  });
});
