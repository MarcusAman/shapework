/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * School District & Academic Ratings Intelligence Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps School District & Academic Ratings Suite', () => {
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

  describe('1. School District & Academic Profile Synthesis', () => {
    it('synthesizes assigned public schools with GreatSchools ratings and test proficiencies', () => {
      const profile = PropertyCompsRepository.getSchoolDistrictProfile('prop_1104_arboretum');

      expect(profile.subjectProperty.id).toBe('prop_1104_arboretum');
      expect(profile.publicSchools.length).toBe(3);

      const elem = profile.publicSchools.find(s => s.level === 'Elementary School')!;
      const middle = profile.publicSchools.find(s => s.level === 'Middle School')!;
      const high = profile.publicSchools.find(s => s.level === 'High School')!;

      // Elementary: Wrightsville Beach Elementary (10/10)
      expect(elem.schoolName).toContain('Wrightsville Beach');
      expect(elem.greatSchoolsRating).toBe(10);
      expect(elem.mathProficiencyPercent).toBeGreaterThan(90);
      expect(elem.readingProficiencyPercent).toBeGreaterThan(90);

      // Middle: Noble Middle (9/10)
      expect(middle.schoolName).toContain('Noble');
      expect(middle.greatSchoolsRating).toBe(9);

      // High: Hoggard High (9/10, IB World School)
      expect(high.schoolName).toContain('Hoggard');
      expect(high.greatSchoolsRating).toBe(9);
      expect(high.highlights.some(h => h.includes('International Baccalaureate'))).toBe(true);
    });

    it('synthesizes premier private academies and tuition metrics', () => {
      const profile = PropertyCompsRepository.getSchoolDistrictProfile('prop_1104_arboretum');

      expect(profile.privateAcademies.length).toBeGreaterThanOrEqual(3);

      const cfa = profile.privateAcademies.find(s => s.schoolName.includes('Cape Fear Academy'))!;
      expect(cfa).toBeDefined();
      expect(cfa.nicheRating).toBe('A+');
      expect(cfa.annualTuition).toBe(19800);
      expect(cfa.studentTeacherRatio).toBe('9:1');
    });

    it('synthesizes bus route logistics and commute times', () => {
      const profile = PropertyCompsRepository.getSchoolDistrictProfile('prop_1104_arboretum');

      const elem = profile.publicSchools[0];
      expect(elem.busRoute.routeNumber).toBe('NHCS Bus #412');
      expect(elem.busRoute.pickupTime).toBeDefined();
      expect(elem.busRoute.dropoffTime).toBeDefined();
      expect(elem.distanceMiles).toBeLessThan(3.0);
    });

    it('GET /api/comps/school-district/:subjectId returns profile via REST', async () => {
      const res = await fetch(`${baseUrl}/api/comps/school-district/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.profile.districtSummary.averagePublicRating).toBeGreaterThanOrEqual(9);
    });
  });

  describe('2. Frontend Component File Integrity', () => {
    it('verifies SchoolDistrictView exists and contains academic and bus route sections', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/SchoolDistrictView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('School District & Academic Ratings Overlay');
      expect(content).toContain('Assigned NHCS Public Schools');
      expect(content).toContain('Premier Private Academies');
    });
  });
});
