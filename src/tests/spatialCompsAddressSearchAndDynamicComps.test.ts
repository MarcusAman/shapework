/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Spatial Comps Address Omnibox Search & Dynamic Geocoding Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Address Search & Dynamic Geocoding Suite', () => {
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

  describe('1. Address Autocomplete Suggestions Engine', () => {
    it('returns default subject properties when query is empty', () => {
      const suggestions = PropertyCompsRepository.getAddressSuggestions('');
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      expect(suggestions[0].address).toContain('Arboretum');
    });

    it('matches partial addresses across coastal subdivisions', () => {
      const suggestions = PropertyCompsRepository.getAddressSuggestions('Pembroke');
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0].address).toContain('Pembroke Jones');
      expect(suggestions[0].neighborhood).toContain('Landfall');
    });

    it('GET /api/comps/address-search returns autocomplete suggestions', async () => {
      const res = await fetch(`${baseUrl}/api/comps/address-search?q=Lumina`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.suggestions.length).toBeGreaterThanOrEqual(1);
      expect(body.suggestions[0].address).toContain('Lumina');
    });
  });

  describe('2. Dynamic Address Geocoding & Comps Synthesis', () => {
    it('resolves existing property and generates spatial comps', () => {
      const result = PropertyCompsRepository.resolveAddressSearch('1104 Arboretum');
      expect(result.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(result.comps.length).toBeGreaterThanOrEqual(3);
      expect(result.isNewSubjectGenerated).toBe(false);
    });

    it('synthesizes new subject property for novel address and dynamically computes nearby comps', () => {
      const result = PropertyCompsRepository.resolveAddressSearch('1510 Pembroke Jones Dr, Wilmington, NC 28405');

      expect(result.subjectProperty.propertyAddress).toContain('1510 Pembroke Jones');
      expect(result.subjectProperty.neighborhood).toContain('Landfall');
      expect(result.subjectProperty.listPrice).toBeGreaterThan(1000000);
      expect(result.subjectProperty.coordinates.lat).toBeCloseTo(34.238, 1);
      expect(result.comps.length).toBeGreaterThanOrEqual(2);
      expect(result.isNewSubjectGenerated).toBe(true);
    });

    it('POST /api/comps/resolve-address resolves custom address via REST endpoint', async () => {
      const res = await fetch(`${baseUrl}/api/comps/resolve-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressQuery: '2209 Ocean Walk, Wrightsville Beach, NC'
        })
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.subjectProperty.neighborhood).toContain('Wrightsville Beach');
      expect(body.comps.length).toBeGreaterThanOrEqual(1);
    });

    it('accurately resolves subdivision and neighborhood names like Autumn Hall, Porters Neck, and Figure Eight', () => {
      const autumn = PropertyCompsRepository.resolveAddressSearch('Autumn Hall');
      expect(autumn.subjectProperty.neighborhood).toContain('Autumn Hall');
      expect(autumn.subjectProperty.coordinates.lat).toBeCloseTo(34.2425, 2);
      expect(autumn.subjectProperty.coordinates.lng).toBeCloseTo(-77.8345, 2);

      const porters = PropertyCompsRepository.resolveAddressSearch('Porters Neck');
      expect(porters.subjectProperty.neighborhood).toContain('Porters Neck');
      expect(porters.subjectProperty.coordinates.lat).toBeCloseTo(34.3050, 2);

      const figureEight = PropertyCompsRepository.resolveAddressSearch('Figure Eight Island');
      expect(figureEight.subjectProperty.neighborhood).toContain('Figure Eight Island');
      expect(figureEight.subjectProperty.coordinates.lat).toBeCloseTo(34.2750, 2);
    });
  });

  describe('3. Frontend Component Verification', () => {
    it('verifies SpatialCompMap includes Omnibox input and address search handling', () => {
      const mapPath = path.resolve(process.cwd(), 'src/components/comps/SpatialCompMap.tsx');
      expect(fs.existsSync(mapPath)).toBe(true);

      const content = fs.readFileSync(mapPath, 'utf-8');
      expect(content).toContain('Search any address');
      expect(content).toContain('handleSelectAddress');
      expect(content).toContain('onAddressResolved');
    });
  });
});
