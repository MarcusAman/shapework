/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { elevenLabsSdkService } from '../src/services/elevenLabsSdkService';

describe('SOP Voice Session Idempotency & Teardown Suite', () => {
  beforeEach(async () => {
    await elevenLabsSdkService.endInterview();
    vi.restoreAllMocks();
  });

  it('1. Ignores duplicate startInterview dispatches when session is starting or active', async () => {
    const onStateChange = vi.fn();
    
    // Simulate active session
    (elevenLabsSdkService as any).isStartingOrActive = true;
    (elevenLabsSdkService as any).conversation = { endSession: vi.fn() };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await elevenLabsSdkService.startInterview('wss://mock', { onStateChange });

    expect(warnSpy).toHaveBeenCalledWith('[ElevenLabs SDK] Duplicate startInterview request ignored.');
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('2. Safely handles multiple endInterview calls without throw or warning', async () => {
    (elevenLabsSdkService as any).conversation = {
      setMicMuted: vi.fn(),
      endSession: vi.fn().mockResolvedValue(undefined)
    };

    // First end call
    await elevenLabsSdkService.endInterview();
    expect(elevenLabsSdkService.getState()).toBe('ended');

    // Second end call should be completely idempotent
    await elevenLabsSdkService.endInterview();
    expect(elevenLabsSdkService.getState()).toBe('ended');
  });

  it('3. Mutes mic track before invoking endSession on teardown', async () => {
    const setMicMutedSpy = vi.fn();
    const endSessionSpy = vi.fn().mockResolvedValue(undefined);

    (elevenLabsSdkService as any).conversation = {
      setMicMuted: setMicMutedSpy,
      endSession: endSessionSpy
    };

    await elevenLabsSdkService.endInterview();

    expect(setMicMutedSpy).toHaveBeenCalledWith(true);
    expect(endSessionSpy).toHaveBeenCalledTimes(1);
  });
});
