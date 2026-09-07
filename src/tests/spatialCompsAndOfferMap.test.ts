/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps & Offer Intelligence Test Suite
 * Tests geospatial radius queries, NC Form 2-T offer simulation, and API endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository, LUXURY_PROPERTY_DATABASE } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';
import { initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps & Offer Intelligence Engine Suite', () => {
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

  describe('1. PropertyCompsRepository Geospatial & Valuation Math', () => {
    it('calculates accurate Haversine spatial distances in miles', () => {
      // 1104 Arboretum (34.2389, -77.8214) to 1118 Arboretum (34.2375, -77.8228) is ~0.13 miles
      const distance = PropertyCompsRepository.calculateDistanceMiles(
        34.2389, -77.8214,
        34.2375, -77.8228
      );
      expect(distance).toBeGreaterThan(0.05);
      expect(distance).toBeLessThan(0.3);
    });

    it('returns subject properties and finds spatial comps within radius', () => {
      const subjects = PropertyCompsRepository.getSubjectProperties();
      expect(subjects.length).toBeGreaterThanOrEqual(3);
      expect(subjects.some(s => s.id === 'prop_1104_arboretum')).toBe(true);
      expect(subjects.some(s => s.id === 'prop_742_lumina')).toBe(true);

      const result = PropertyCompsRepository.findSpatialComps({
        subjectId: 'prop_1104_arboretum',
        radiusMiles: 3.0
      });

      expect(result.subjectProperty.propertyAddress).toContain('1104 Arboretum');
      expect(result.comps.length).toBeGreaterThanOrEqual(3);
      expect(result.comps[0].distanceMiles).toBeDefined();
      expect(result.comps[0].distanceMiles).toBeLessThanOrEqual(result.comps[1].distanceMiles);
      expect(result.summary.avgPrice).toBeGreaterThan(500000);
      expect(result.summary.avgPricePerSqFt).toBeGreaterThan(200);
    });

    it('simulates NC Form 2-T offer scenario with NCREC 5:00 PM EST Due Diligence rule', () => {
      const analysis = PropertyCompsRepository.analyzeOfferScenario({
        subjectPropertyId: 'prop_1104_arboretum',
        proposedOfferPrice: 1250000,
        proposedDueDiligenceFee: 25000,
        dueDiligenceDays: 14,
        proposedEarnestMoney: 25000,
        closingDays: 30
      });

      expect(analysis.proposedOfferPrice).toBe(1250000);
      expect(analysis.proposedPricePerSqFt).toBe(362);
      expect(analysis.dueDiligencePercent).toBe(2.0);
      expect(analysis.competitivenessScore).toBeGreaterThanOrEqual(50);
      expect(analysis.dueDiligenceDeadlineStr).toContain('5:00 PM EST');
      expect(analysis.estimatedSellerNetProceeds).toBeGreaterThan(1150000);
      expect(analysis.strategicNotes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('2. Express REST API Endpoints (/api/comps)', () => {
    it('GET /api/comps/properties returns subject properties and complete database', async () => {
      const res = await fetch(`${baseUrl}/api/comps/properties`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.subjects.length).toBeGreaterThanOrEqual(3);
      expect(body.totalInventory).toBe(LUXURY_PROPERTY_DATABASE.length);
    });

    it('GET /api/comps/spatial performs radius queries with summary analytics', async () => {
      const res = await fetch(`${baseUrl}/api/comps/spatial?subjectId=prop_1104_arboretum&radiusMiles=3.0`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(body.comps.length).toBeGreaterThan(0);
      expect(body.summary.totalComps).toBe(body.comps.length);
    });

    it('POST /api/comps/offer-analysis calculates live offer competitiveness score', async () => {
      const res = await fetch(`${baseUrl}/api/comps/offer-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_742_lumina',
          proposedOfferPrice: 1950000,
          proposedDueDiligenceFee: 40000,
          dueDiligenceDays: 14,
          proposedEarnestMoney: 40000,
          closingDays: 30
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.analysis.subjectProperty.id).toBe('prop_742_lumina');
      expect(body.analysis.competitivenessScore).toBeGreaterThanOrEqual(50);
      expect(body.analysis.estimatedSellerNetProceeds).toBeGreaterThan(1800000);
    });

    it('POST /api/comps/generate-dossier produces client-ready comparative market dossier', async () => {
      const res = await fetch(`${baseUrl}/api/comps/generate-dossier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectPropertyId: 'prop_1104_arboretum' })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.dossier.title).toContain('Nest Realty Luxury Comparative Market Dossier');
      expect(body.dossier.executiveValuationRecommendation.recommendedTarget).toContain('$1,250,000');
    });
  });

  describe('3. Nora Omnichannel Voice & Chat Integration', () => {
    it('handles "show spatial comps for 1104 Arboretum" with map projection and action chips', () => {
      const baseState = { ...initialRuntimeState };
      const result = processUserUtterance('Show spatial comps for 1104 Arboretum', baseState, 'Ryan');

      expect(result.intentType).toBe('SPATIAL_COMPS_QUERY');
      expect(result.spokenResponse).toContain('Spatial Comps and Offer Intelligence Map');
      expect(result.displayResponse).toContain('1104 Arboretum Dr');
      expect(result.suggestedActions?.some(a => a.actionType === 'VIEW_SPATIAL_COMPS')).toBe(true);
      expect(result.suggestedActions?.some(a => a.actionType === 'SIMULATE_OFFER')).toBe(true);
    });
  });

  describe('4. Frontend UI Components Verification', () => {
    it('verifies SpatialCompsView, SpatialCompMap, CompMetricsMatrix, and OfferScenarioSimulator files exist and export cleanly', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompsView.tsx');
      const mapPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompMap.tsx');
      const matrixPath = path.resolve(process.cwd(), 'src/components/comps/CompMetricsMatrix.tsx');
      const simPath = path.resolve(process.cwd(), 'src/components/comps/OfferScenarioSimulator.tsx');
      const dossierPath = path.resolve(process.cwd(), 'src/components/comps/NoraStrategyDossier.tsx');

      expect(fs.existsSync(viewPath)).toBe(true);
      expect(fs.existsSync(mapPath)).toBe(true);
      expect(fs.existsSync(matrixPath)).toBe(true);
      expect(fs.existsSync(simPath)).toBe(true);
      expect(fs.existsSync(dossierPath)).toBe(true);

      const viewContent = fs.readFileSync(viewPath, 'utf-8');
      expect(viewContent).toContain('SpatialCompMap');
      expect(viewContent).toContain('CompMetricsMatrix');
      expect(viewContent).toContain('OfferScenarioSimulator');
      expect(viewContent).toContain('NoraStrategyDossier');
      expect(viewContent).toContain('isPresentationMode');
    });
  });
});
