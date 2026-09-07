import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectCognitiveNoiseForQuery,
  getNextRotatingCognitiveNoise,
  resetCognitiveNoiseRotation,
  getCurrentNoiseRotationIndex,
  NORA_ROTATING_NOISE_SEQUENCE,
  NORA_NOISE_ASSETS
} from '../services/voice-agent/audioPlaybackManager.js';

describe('Ask Nora Sound Effects Consecutive Rotation Suite', () => {
  beforeEach(() => {
    resetCognitiveNoiseRotation(0);
  });

  it('1. Verifies all 6 sound effect assets are defined with valid mp3 paths', () => {
    expect(NORA_ROTATING_NOISE_SEQUENCE).toEqual([
      'keyboard_typing',
      'kaching',
      'heaven_harp',
      'jackpot',
      'undertaker',
      'crickets'
    ]);

    NORA_ROTATING_NOISE_SEQUENCE.forEach((key) => {
      const asset = NORA_NOISE_ASSETS[key];
      expect(asset).toBeDefined();
      expect(asset.url).toMatch(/\.mp3$/);
      expect(asset.defaultMaxSeconds).toBeGreaterThanOrEqual(3);
    });
  });

  it('2. Rotates sound effects sequentially on every consecutive question asked', () => {
    // 1st question
    const sound1 = selectCognitiveNoiseForQuery('How many open listings does Sarah Jenkins have?');
    expect(sound1).toBe('keyboard_typing');

    // 2nd question
    const sound2 = selectCognitiveNoiseForQuery('What is our commission on 1104 Arboretum?');
    expect(sound2).toBe('kaching');

    // 3rd question
    const sound3 = selectCognitiveNoiseForQuery('Has BIC approved the contract for 304 Ocean?');
    expect(sound3).toBe('heaven_harp');

    // 4th question
    const sound4 = selectCognitiveNoiseForQuery('Find buyers matched to Landfall listings');
    expect(sound4).toBe('jackpot');

    // 5th question
    const sound5 = selectCognitiveNoiseForQuery('Are there any urgent repair escalations?');
    expect(sound5).toBe('undertaker');

    // 6th question
    const sound6 = selectCognitiveNoiseForQuery('Show empty sign posts in inventory');
    expect(sound6).toBe('crickets');

    // 7th question (Cycles back to start seamlessly)
    const sound7 = selectCognitiveNoiseForQuery('Who is handling open houses this weekend?');
    expect(sound7).toBe('keyboard_typing');

    // 8th question
    const sound8 = selectCognitiveNoiseForQuery('Check closing disclosure fees');
    expect(sound8).toBe('kaching');

    expect(getCurrentNoiseRotationIndex()).toBe(8);
  });

  it('3. getNextRotatingCognitiveNoise returns next sequential sound', () => {
    resetCognitiveNoiseRotation(2);
    expect(getNextRotatingCognitiveNoise()).toBe('heaven_harp');
    expect(getNextRotatingCognitiveNoise()).toBe('jackpot');
  });
});
