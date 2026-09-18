/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ambient Acoustic Soundscape & Traffic Decibel Overlay Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { PropertyCompsRepository } from '../../server/persistence/propertyCompsRepository.js';
import { propertyCompsRouter } from '../../server/routes/propertyCompsRoute.js';
import fs from 'fs';
import path from 'path';

describe('Spatial Comps Ambient Acoustic Soundscape Suite', () => {
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

  describe('1. Ambient Decibel Modeling & Attenuation Physics', () => {
    it('calculates baseline ambient noise (38.2 dBA) and 94/100 sanctuary score', () => {
      const sound = PropertyCompsRepository.getAcousticSoundscapeProfile('prop_1104_arboretum');

      expect(sound.baselineAmbientDba).toBe(38.2);
      expect(sound.dayNightAverageLevelDnlDba).toBe(41.5);
      expect(sound.sanctuaryScore).toBe(94);
      expect(sound.epaGuidelineBenchmarkDba).toBe(55.0);
    });

    it('models diurnal sound levels with nighttime acoustic stillness (32.5 dBA)', () => {
      const sound = PropertyCompsRepository.getAcousticSoundscapeProfile('prop_1104_arboretum');

      expect(sound.diurnalSoundProfile.length).toBe(4);
      const night = sound.diurnalSoundProfile.find(p => p.period.includes('Night'))!;
      expect(night.avgDba).toBe(32.5);
      expect(night.tranquilRating).toContain('Pristine');
    });

    it('calculates corridor distance attenuation and natural berm/canopy buffers', () => {
      const sound = PropertyCompsRepository.getAcousticSoundscapeProfile('prop_1104_arboretum');

      expect(sound.corridorDistanceAndAttenuation.length).toBe(3);
      const militaryCutoff = sound.corridorDistanceAndAttenuation.find(c => c.corridorName.includes('Military'))!;
      expect(militaryCutoff.distanceMiles).toBe(1.4);
      expect(militaryCutoff.attenuationReductionDba).toBe(-28.5);

      expect(sound.naturalSoundBuffers.canopyNoiseReductionDba).toBe(-8.5);
      expect(sound.naturalSoundBuffers.bermNoiseReductionDba).toBe(-12.0);
      expect(sound.naturalSoundBuffers.interiorSoundLevelDba).toBeLessThan(26.0);
    });
  });

  describe('2. REST API Endpoints', () => {
    it('GET /api/comps/acoustic-soundscape/:subjectId returns acoustic soundscape payload', async () => {
      const res = await fetch(`${baseUrl}/api/comps/acoustic-soundscape/prop_1104_arboretum`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.soundscape.baselineAmbientDba).toBe(38.2);
      expect(body.soundscape.sanctuaryScore).toBe(94);
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies AcousticSoundscapeView.tsx exists and renders decibel modeling elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/comps/AcousticSoundscapeView.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Ambient Acoustic Soundscape & Noise Overlay');
      expect(content).toContain('Acoustic Sanctuary Score');
      expect(content).toContain('Baseline Ambient Level');
      expect(content).toContain('Diurnal Sound Level Curve (dBA)');
      expect(content).toContain('Arterial Corridor Distance & Noise Attenuation');
    });
  });
});
