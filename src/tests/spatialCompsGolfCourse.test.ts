/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Golf Course Hole-by-Hole Buffer & Errant Ball Trajectory Heatmap Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Golf Course Fairway & Trajectory Heatmap Suite', () => {
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

  describe('1. Golf Course Fairway Positioning & Trajectory Physics', () => {
    it('calculates fairway landing zone geometry and clearance buffer', () => {
      const golf = PropertyCompsRepository.getGolfCourseProfile('prop_1104_arboretum');

      expect(golf.courseDetails.courseName).toBe('Pete Dye Championship Course');
      expect(golf.courseDetails.holeNumber).toBe(4);
      expect(golf.courseDetails.par).toBe(4);
      expect(golf.courseDetails.holeYardage).toBe(415);
      expect(golf.fairwayGeometry.lateralDistanceFromFairwayCenterlineFeet).toBe(145);
      expect(golf.fairwayGeometry.lateralDistanceFromFairwayCenterlineFeet).toBeGreaterThan(golf.fairwayGeometry.recommendedSafetyThresholdFeet);
      expect(golf.fairwayGeometry.distanceFromChampionshipTeesYards).toBe(260);
      expect(golf.fairwayGeometry.elevationAboveFairwayFeet).toBe(6.5);
    });

    it('scores errant shot exposure as very low risk (12/100) due to dogleg geometry', () => {
      const golf = PropertyCompsRepository.getGolfCourseProfile('prop_1104_arboretum');

      expect(golf.errantBallRiskAssessment.overallRiskScore).toBe(12);
      expect(golf.errantBallRiskAssessment.riskCategory).toContain('Low Exposure');
      expect(golf.errantBallRiskAssessment.sliceVsHookPhysics).toContain('Safe from Right-Hand Slices');
      expect(golf.errantBallRiskAssessment.cartPathLocation).toContain('Opposite');
    });

    it('verifies vegetative pine screen and clubhouse logistics', () => {
      const golf = PropertyCompsRepository.getGolfCourseProfile('prop_1104_arboretum');

      expect(golf.protectiveCanopyAndGlass.maturePineScreenCount).toBe(6);
      expect(golf.protectiveCanopyAndGlass.windowGlassImpactRating).toContain('Category 4');
      expect(golf.clubhouseAndAmenitiesProximity.distanceToDyeClubhouseMiles).toBe(0.6);
      expect(golf.clubhouseAndAmenitiesProximity.cartTransitTimeMinutes).toBe(3);
    });
  });

  describe('2. REST API Endpoints', () => {
    it('GET /api/comps/golf-course/:subjectId returns golf profile payload', async () => {
      const res = await fetch(`${baseUrl}/api/comps/golf-course/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.golfProfile.courseDetails.holeNumber).toBe(4);
      expect(body.golfProfile.errantBallRiskAssessment.overallRiskScore).toBe(12);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies GolfCourseSpatialView.tsx exists and renders fairway schematic elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/GolfCourseSpatialView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Hole #');
      expect(content).toContain('Fairway Buffer & Errant Shot Heatmap');
      expect(content).toContain('Errant Ball Exposure Index');
      expect(content).toContain('Lateral Clearance');
      expect(content).toContain('Canopy Shielding & Trajectory Physics');
    });
  });
});
