import { describe, it, expect, beforeEach, vi } from 'vitest';
import { elevenLabsWebRtcService } from '../services/elevenLabsWebRtcService';

describe('ElevenLabs WebRTC Dual-Mode & Dynamic Tooling Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('elevenLabsWebRtcService initializes with idle state', () => {
    expect(elevenLabsWebRtcService.getState()).toBe('idle');
  });

  it('endSession gracefully resets state to idle', async () => {
    await elevenLabsWebRtcService.endSession();
    expect(elevenLabsWebRtcService.getState()).toBe('idle');
  });

  it('setVolume adjusts audio volume safely when function exists', () => {
    expect(() => elevenLabsWebRtcService.setVolume(0.8)).not.toThrow();
  });
});
