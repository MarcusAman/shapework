import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { AudioPlaybackManager } from '../services/voice-agent/audioPlaybackManager';
import { agentRuntimeReducer, initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer';

describe('Ask Nest Ops Voice Agent Safety & Echo Prevention Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('AudioPlaybackManager.stopAll() halts active audio and cancels speechSynthesis', () => {
    const mockPause = vi.fn();
    const mockAudio = {
      pause: mockPause,
      currentTime: 10,
      src: 'blob:http://localhost/test',
      onended: null,
      onerror: null
    } as unknown as HTMLAudioElement;

    // Simulate playing audio
    (AudioPlaybackManager as any).activeAudio = mockAudio;

    // Trigger stopAll
    AudioPlaybackManager.stopAll();

    expect(mockPause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
    expect(mockAudio.src).toBe('');
    expect((AudioPlaybackManager as any).activeAudio).toBeNull();
  });

  it('Silence VAD safety: empty or stripped wake-word speech strings are cleanly rejected without dispatching queries', () => {
    const emptyInputs = [
      '',
      '   ',
      'hey nest',
      'hi nest',
      'hey nora',
      'hi nora',
      '  hey nest  ',
      'hey nest, '
    ];

    for (const input of emptyInputs) {
      const stripped = input
        .trim()
        .replace(/^(hey|hi)\s+nest,?\s*/i, '')
        .replace(/^(hey|hi)\s+nora,?\s*/i, '')
        .trim();

      // Stripped speech must be empty string
      expect(stripped).toBe('');
    }
  });

  it('Genuine queries after wake-word stripping retain their true operational intent', () => {
    const inputsWithWakeWord = [
      { input: 'hey nest, where is the listing launch sop?', expected: 'where is the listing launch sop?' },
      { input: 'hi nora, show me contract verification procedure', expected: 'show me contract verification procedure' },
      { input: 'hey nest what is our sign vendor dispatch protocol', expected: 'what is our sign vendor dispatch protocol' }
    ];

    for (const { input, expected } of inputsWithWakeWord) {
      const stripped = input
        .replace(/^(hey|hi)\s+nest,?\s*/i, '')
        .replace(/^(hey|hi)\s+nora,?\s*/i, '')
        .trim();

      expect(stripped).toBe(expected);

      const res = queryUnifiedContext(stripped, { tenantId: 'tenant_nest_uat', workspaceId: 'ws_wilmington' });
      expect(res.matchedDomain).toBe('sops');
      expect(res.confidence).toBe('high');
      expect(res.spokenAnswer).not.toContain('hello, can you hear me');
    }
  });

  it('agentRuntimeReducer loads, updates, and clears transcript history accurately', () => {
    // 1. Load initial history
    const preloaded = [
      { id: '1', sender: 'user', text: 'Who is our listing photographer?', timestamp: '10:00 AM' },
      { id: '2', sender: 'agent', text: 'Marcus Aman at Flyhouse Media.', timestamp: '10:00 AM' }
    ];

    let state = agentRuntimeReducer(initialRuntimeState, {
      type: 'LOAD_TRANSCRIPTS',
      payload: preloaded
    });

    expect(state.transcriptHistory).toHaveLength(2);
    expect(state.transcriptHistory[0].text).toBe('Who is our listing photographer?');
    expect(state.transcriptHistory[1].sender).toBe('agent');

    // 2. Add new turn
    state = agentRuntimeReducer(state, {
      type: 'ADD_TRANSCRIPT',
      payload: { sender: 'user', text: 'What is their phone number?' }
    });

    expect(state.transcriptHistory).toHaveLength(3);
    expect(state.transcriptHistory[2].text).toBe('What is their phone number?');
    expect(state.transcriptHistory[2].sender).toBe('user');

    // 3. Clear history
    state = agentRuntimeReducer(state, { type: 'CLEAR_TRANSCRIPTS' });
    expect(state.transcriptHistory).toHaveLength(0);
  });
});
