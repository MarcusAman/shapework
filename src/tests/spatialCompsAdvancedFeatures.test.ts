/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Advanced Features Test Suite
 * Tests appraisal-grade comp adjustments, photo inspection drawer, and shareable client portals.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository, LUXURY_PROPERTY_DATABASE } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Advanced Luxury Capabilities Suite', () => {
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

  describe('1. Appraisal-Grade Comp Feature Adjustment Engine', () => {
    it('calculates dollar adjustments for marginal sqft, pool, dock, and golf course premiums', () => {
      const result = PropertyCompsRepository.calculateAppraisalAdjustments('prop_1104_arboretum', {
        sqftRate: 150,
        poolValue: 65000,
        dockValue: 125000,
        golfValue: 50000,
        garageValue: 25000
      });

      expect(result.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(result.marginalSqftRate).toBe(150);
      expect(result.adjustments.length).toBeGreaterThanOrEqual(3);

      // Verify adjustment values on individual comps
      const comp1040 = result.adjustments.find(a => a.compId === 'comp_1040_arboretum');
      expect(comp1040).toBeDefined();
      // Subject (1104 Arboretum) has a pool (+65k) while comp 1040 does not
      expect(comp1040?.poolAdjustment).toBe(65000);
      expect(comp1040?.adjustedIndicatedValue).toBeGreaterThan(1200000);

      expect(result.weightedIndicatedValue).toBeGreaterThan(1150000);
      expect(result.valuationRangeLow).toBeLessThan(result.weightedIndicatedValue);
      expect(result.valuationRangeHigh).toBeGreaterThan(result.weightedIndicatedValue);
      expect(result.appraisalNotes.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/comps/adjustments returns recalculated appraisal matrix with custom rates', async () => {
      const res = await fetch(`${baseUrl}/api/comps/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_742_lumina',
          sqftRate: 200,
          dockValue: 150000
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.adjustments.subjectProperty.id).toBe('prop_742_lumina');
      expect(body.adjustments.marginalSqftRate).toBe(200);
      expect(body.adjustments.dockStandardValue).toBe(150000);
      expect(body.adjustments.weightedIndicatedValue).toBeGreaterThan(1500000);
    });
  });

  describe('2. High-Resolution Architectural Photo Galleries', () => {
    it('verifies properties contain multi-category architectural photos with captions', () => {
      const prop1104 = PropertyCompsRepository.getPropertyById('prop_1104_arboretum');
      expect(prop1104).toBeDefined();
      expect(prop1104?.photos.length).toBeGreaterThanOrEqual(3);
      expect(prop1104?.photos.some(p => p.category === 'exterior')).toBe(true);
      expect(prop1104?.photos.some(p => p.category === 'kitchen')).toBe(true);
      expect(prop1104?.photos.some(p => p.category === 'primary_suite' || p.category === 'pool_outdoor')).toBe(true);
      expect(prop1104?.heroPhoto).toBeDefined();
    });
  });

  describe('3. Shareable Client Dossier Portal (/api/comps/share)', () => {
    it('POST /api/comps/share generates unique private link for high-net-worth clients', async () => {
      const res = await fetch(`${baseUrl}/api/comps/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: 'prop_1104_arboretum',
          clientName: 'Dr. & Mrs. Sterling',
          preparedBy: 'Ryan Crecelius'
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.shareToken).toBeDefined();
      expect(body.shareUrl).toContain('/share/comps/');
      expect(body.dossier.clientName).toBe('Dr. & Mrs. Sterling');
      expect(body.dossier.subjectProperty.id).toBe('prop_1104_arboretum');

      // Retrieve by token
      const getRes = await fetch(`${baseUrl}/api/comps/share/${body.shareToken}`);
      const getBody = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(getBody.success).toBe(true);
      expect(getBody.dossier.shareToken).toBe(body.shareToken);
      expect(getBody.dossier.comps.length).toBeGreaterThan(0);
    });

    it('GET /api/comps/share/:token handles direct property name fallback', async () => {
      const res = await fetch(`${baseUrl}/api/comps/share/1104-arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.dossier.subjectProperty.propertyAddress).toContain('1104 Arboretum');
    });
  });

  describe('4. UI Component Integrity & Exports', () => {
    it('verifies CompAdjustmentMatrix, PropertyVisualInspectionDrawer, and PublicClientCompPortal exist', () => {
      const adjPath = path.resolve(process.cwd(), 'src/components/comps/CompAdjustmentMatrix.tsx');
      const inspectPath = path.resolve(process.cwd(), 'src/components/comps/PropertyVisualInspectionDrawer.tsx');
      const portalPath = path.resolve(process.cwd(), 'src/components/comps/PublicClientCompPortal.tsx');

      expect(fs.existsSync(adjPath)).toBe(true);
      expect(fs.existsSync(inspectPath)).toBe(true);
      expect(fs.existsSync(portalPath)).toBe(true);

      const portalContent = fs.readFileSync(portalPath, 'utf-8');
      expect(portalContent).toContain('PublicClientCompPortal');
      expect(portalContent).toContain('NEST REALTY');
      expect(portalContent).toContain('SpatialCompMap');
      expect(portalContent).toContain('OfferScenarioSimulator');
    });
  });
});
