/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Polygon / Lasso Drawing & Ray-Casting Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Polygon & Ray-Casting Filter Suite', () => {
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

  describe('1. Ray-Casting Point-in-Polygon Engine', () => {
    const squarePolygon = [
      { lat: 34.2000, lng: -77.8500 },
      { lat: 34.2000, lng: -77.8000 },
      { lat: 34.2500, lng: -77.8000 },
      { lat: 34.2500, lng: -77.8500 }
    ];

    it('returns true for coordinate strictly inside polygon boundary', () => {
      const insidePoint = { lat: 34.2250, lng: -77.8250 };
      expect(PropertyCompsRepository.isPointInPolygon(insidePoint, squarePolygon)).toBe(true);
    });

    it('returns false for coordinate strictly outside polygon boundary', () => {
      const outsidePoint = { lat: 34.3000, lng: -77.7000 };
      expect(PropertyCompsRepository.isPointInPolygon(outsidePoint, squarePolygon)).toBe(false);
    });

    it('returns false for degenerate or empty polygons', () => {
      expect(PropertyCompsRepository.isPointInPolygon({ lat: 34.2, lng: -77.8 }, [])).toBe(false);
      expect(PropertyCompsRepository.isPointInPolygon({ lat: 34.2, lng: -77.8 }, [{ lat: 34.2, lng: -77.8 }])).toBe(false);
    });
  });

  describe('2. Micro-Zone Polygon Filter & Statistics', () => {
    // Polygon covering Landfall Country Club area
    const landfallPolygon = [
      { lat: 34.2300, lng: -77.8400 },
      { lat: 34.2300, lng: -77.8000 },
      { lat: 34.2600, lng: -77.8000 },
      { lat: 34.2600, lng: -77.8400 }
    ];

    it('filters database properties to only those inside the custom boundary', () => {
      const result = PropertyCompsRepository.filterCompsByPolygon('prop_1104_arboretum', landfallPolygon);

      expect(result.isPolygonActive).toBe(true);
      expect(result.isSubjectInside).toBe(true);
      expect(result.comps.length).toBeGreaterThanOrEqual(1);

      // Verify all filtered comps are inside the polygon
      for (const comp of result.comps) {
        expect(PropertyCompsRepository.isPointInPolygon(comp.coordinates, landfallPolygon)).toBe(true);
      }

      // Summary micro-zone metrics
      expect(result.summary.totalPropertiesInside).toBeGreaterThanOrEqual(2);
      expect(result.summary.avgPrice).toBeGreaterThan(500000);
      expect(result.summary.avgPricePerSqFt).toBeGreaterThan(200);
      expect(result.summary.avgDaysOnMarket).toBeGreaterThan(0);
    });

    it('POST /api/comps/polygon-filter returns filtered comps and micro-zone stats', async () => {
      const res = await fetch(`${baseUrl}/api/comps/polygon-filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: 'prop_1104_arboretum',
          polygon: landfallPolygon
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.isPolygonActive).toBe(true);
      expect(body.summary.totalPropertiesInside).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies SpatialCompMap includes polygon drawing mode controls and handlers', () => {
      const mapPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompMap.tsx');
      expect(fs.existsSync(mapPath)).toBe(true);

      const content = fs.readFileSync(mapPath, 'utf-8');
      expect(content).toContain('isDrawingMode');
      expect(content).toContain('handleCompletePolygon');
      expect(content).toContain('handleClearPolygon');
      expect(content).toContain('onPolygonFilterChange');
      expect(content).toContain('Custom Micro-Zone');
    });
  });
});
