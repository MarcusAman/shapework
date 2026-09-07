/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Waterfront, Boat Slip & Deepwater Navigation Corridor Analyzer Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Waterfront Navigation Corridor Suite', () => {
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

  describe('1. Bathymetry, Boat Lift & Navigation Corridor Calculations', () => {
    it('calculates Mean Low Water (5.5ft) and Mean High Water (9.8ft) tidal depths', () => {
      const nav = PropertyCompsRepository.getWaterfrontNavigationProfile('prop_1104_arboretum');

      expect(nav.tidalBathymetry.meanLowWaterDepthFeet).toBe(5.5);
      expect(nav.tidalBathymetry.meanHighWaterDepthFeet).toBe(9.8);
      expect(nav.tidalBathymetry.averageTidalSwingFeet).toBe(4.3);
      expect(nav.tidalBathymetry.allTideNavigable).toBe(true);
    });

    it('verifies 24,000 lb boat lift capacity, PWC lifts and CAMA permit', () => {
      const nav = PropertyCompsRepository.getWaterfrontNavigationProfile('prop_1104_arboretum');

      expect(nav.dockAndLiftSpecifications.boatLiftWeightCapacityLbs).toBe(24000);
      expect(nav.dockAndLiftSpecifications.maxVesselLengthFeet).toBe(48);
      expect(nav.dockAndLiftSpecifications.pwcLiftsCount).toBe(2);
      expect(nav.dockAndLiftSpecifications.camaPermitNumber).toContain('CAMA-MAJ-');
    });

    it('calculates 14-minute Masonboro Inlet transit time and bridge clearance', () => {
      const nav = PropertyCompsRepository.getWaterfrontNavigationProfile('prop_1104_arboretum');

      expect(nav.navigationCorridor.transitToMasonboroInletMinutes).toBe(14);
      expect(nav.navigationCorridor.distanceToMasonboroInletNauticalMiles).toBe(3.2);
      expect(nav.bridgeAndClearanceRestrictions.fixedBridgeRestrictions).toContain('None');
      expect(nav.bridgeAndClearanceRestrictions.overheadPowerLinesClearanceFeet).toBe(68);
      expect(nav.bridgeAndClearanceRestrictions.sailboatMastSafe).toBe(true);
    });
  });

  describe('2. REST API Endpoints', () => {
    it('GET /api/comps/waterfront-navigation/:subjectId returns deepwater marine payload', async () => {
      const res = await fetch(`${baseUrl}/api/comps/waterfront-navigation/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.navProfile.tidalBathymetry.meanLowWaterDepthFeet).toBe(5.5);
      expect(body.navProfile.dockAndLiftSpecifications.boatLiftWeightCapacityLbs).toBe(24000);
      expect(body.navProfile.navigationCorridor.transitToMasonboroInletMinutes).toBe(14);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies WaterfrontNavigationSpatialView.tsx exists and renders navigation metrics', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/WaterfrontNavigationSpatialView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Waterfront, Boat Slip & Deepwater Navigation Corridor');
      expect(content).toContain('Mean Low Water Depth (MLW)');
      expect(content).toContain('Boat Lift Capacity');
      expect(content).toContain('Masonboro Inlet Transit');
      expect(content).toContain('Pier, Boat Lift & CAMA Compliance');
    });
  });
});
