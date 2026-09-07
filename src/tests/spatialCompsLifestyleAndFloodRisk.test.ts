/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Lifestyle Isochrones & FEMA Flood Risk Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Lifestyle Isochrones & FEMA Flood Risk Suite', () => {
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

  describe('1. FEMA Flood Zone, Elevation & Coastal Risk Intelligence', () => {
    it('accurately resolves Landfall (1104 Arboretum) as Zone X (Minimal Risk) with high ground elevation', () => {
      const profile = PropertyCompsRepository.getCoastalRiskProfile('prop_1104_arboretum');

      expect(profile.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(profile.femaFloodZone).toContain('Zone X');
      expect(profile.isFloodInsuranceMandatory).toBe(false);
      expect(profile.groundElevationFeet).toBeGreaterThanOrEqual(25);
      expect(profile.freeboardMarginFeet).toBeGreaterThan(0);
      expect(profile.insuranceEstimates.totalAnnualInsurance).toBeGreaterThan(5000);
      expect(profile.riskSummaryNotes.length).toBeGreaterThanOrEqual(3);
    });

    it('accurately resolves Wrightsville Beach (742 Lumina) as Zone AE with mandatory flood insurance', () => {
      const profile = PropertyCompsRepository.getCoastalRiskProfile('prop_742_lumina');

      expect(profile.subjectProperty.id).toBe('prop_742_lumina');
      expect(profile.femaFloodZone).toContain('Zone AE');
      expect(profile.isFloodInsuranceMandatory).toBe(true);
      expect(profile.stormSurgeRiskLevel).toBe('High');
      expect(profile.evacuationZone).toContain('Zone A');
      expect(profile.insuranceEstimates.floodInsuranceNfipAnnual).toBeGreaterThan(2000);
    });

    it('GET /api/comps/flood-risk/:subjectId returns risk profile and insurance estimates', async () => {
      const res = await fetch(`${baseUrl}/api/comps/flood-risk/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.riskProfile.femaFloodZone).toContain('Zone X');
      expect(body.riskProfile.insuranceEstimates.homeownersHazardAnnual).toBeGreaterThan(2000);
    });
  });

  describe('2. Coastal Lifestyle Landmarks & Isochrones', () => {
    it('calculates exact drive times and distances to key luxury landmarks', () => {
      const profile = PropertyCompsRepository.getCoastalRiskProfile('prop_1104_arboretum');

      expect(profile.lifestyleLandmarks.length).toBeGreaterThanOrEqual(4);

      const beach = profile.lifestyleLandmarks.find((lm: any) => lm.name.includes('Wrightsville Beach'));
      const airport = profile.lifestyleLandmarks.find((lm: any) => lm.name.includes('Airport'));

      expect(beach).toBeDefined();
      expect(airport).toBeDefined();
      expect(beach?.driveTimeMinutes).toBeLessThan(15);
      expect(airport?.distanceMiles).toBeGreaterThan(5);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies CoastalRiskIntelligenceView exists and exports component', () => {
      const riskViewPath = path.resolve(process.cwd(), 'src/components/comps/CoastalRiskIntelligenceView.tsx');
      expect(fs.existsSync(riskViewPath)).toBe(true);

      const content = fs.readFileSync(riskViewPath, 'utf-8');
      expect(content).toContain('CoastalRiskIntelligenceView');
      expect(content).toContain('FEMA Flood Zone');
      expect(content).toContain('Wind & Hail');
    });
  });
});
