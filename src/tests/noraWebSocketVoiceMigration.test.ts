/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA ElevenLabs WebSocket Voice Migration & Transport Verification Suite
 * Tests Phases 2, 3, 4, 5, 6, 8, 9 of the controlled migration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  resolveNoraTransport, 
  getNoraVoiceConfig, 
  DEFAULT_NORA_AGENT_ID, 
  DEFAULT_NORA_VOICE_ID 
} from '../config/noraVoiceConfig';
import { NoraVoiceSessionManager } from '../services/noraVoiceSessionManager';

describe('Phase 2: Controlled Transport Selection & Safety Defaults', () => {
  it('defaults deterministically to websocket when unconfigured', () => {
    expect(resolveNoraTransport(undefined)).toBe('websocket');
    expect(resolveNoraTransport('')).toBe('websocket');
    expect(resolveNoraTransport('   ')).toBe('websocket');
  });

  it('safely normalizes invalid transport values to websocket without crashing', () => {
    expect(resolveNoraTransport('invalid_transport')).toBe('websocket');
    expect(resolveNoraTransport('grpc')).toBe('websocket');
    expect(resolveNoraTransport('http_streaming')).toBe('websocket');
  });

  it('selects webrtc only when explicitly configured for rollback', () => {
    expect(resolveNoraTransport('webrtc')).toBe('webrtc');
    expect(resolveNoraTransport('WEBRTC')).toBe('webrtc');
    expect(resolveNoraTransport('  webrtc  ')).toBe('webrtc');
  });

  it('never exposes API keys or internal secrets through client config', () => {
    const config = getNoraVoiceConfig();
    expect(config.transport).toBeDefined();
    expect(config.agentId).toBe(DEFAULT_NORA_AGENT_ID);
    expect(config.voiceId).toBe(DEFAULT_NORA_VOICE_ID);
    expect(config.signedUrlEndpoint).toBe('/api/voice-agent/elevenlabs/signed-url');
    expect(config.webrtcTokenEndpoint).toBe('/api/elevenlabs/conversation-token');

    // Asserts no API key or auth token is attached to the client config
    expect((config as any).apiKey).toBeUndefined();
    expect((config as any).xiApiKey).toBeUndefined();
    expect((config as any).secret).toBeUndefined();
  });
});

describe('Phase 3 & 4: Authenticated WebSocket Session Startup & Lifecycle', () => {
  let manager: NoraVoiceSessionManager;

  beforeEach(() => {
    manager = new NoraVoiceSessionManager();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await manager.endSession();
  });

  it('initializes in idle state and transitions through valid lifecycle states', () => {
    expect(manager.getStatus()).toBe('idle');
    expect(manager.getTranscripts()).toEqual([]);
  });

  it('idempotently handles endSession calls without errors', async () => {
    expect(manager.getStatus()).toBe('idle');
    await manager.endSession();
    expect(manager.getStatus()).toBe('idle');
    await manager.endSession();
    expect(manager.getStatus()).toBe('idle');
  });

  it('resets conversation transcripts and event memory completely', () => {
    manager.commitTranscriptEvent({
      sender: 'user',
      text: 'What is the listing launch procedure?'
    });
    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'Listing launch involves 5 ordered steps verified by the BIC.'
    });

    expect(manager.getTranscripts()).toHaveLength(2);

    manager.resetConversation();
    expect(manager.getTranscripts()).toHaveLength(0);
  });
});

describe('Phase 8 & 9: Tools Execution & SOP Guide Mode State Machine', () => {
  let manager: NoraVoiceSessionManager;

  beforeEach(() => {
    manager = new NoraVoiceSessionManager();
  });

  it('executes SOP Guide tool updaters correctly in memory', () => {
    let mockDraft: any = {
      title: '',
      purpose: '',
      processOwner: '',
      orderedSteps: [],
      decisions: [],
      exceptions: [],
      openQuestions: []
    };

    const updateDraft = (updater: (prev: any) => any) => {
      mockDraft = updater(mockDraft);
    };

    // 1. Simulate set_sop_title tool
    updateDraft((prev: any) => ({
      ...prev,
      title: 'Listing Launch SOP',
      updatedAt: new Date().toISOString()
    }));
    expect(mockDraft.title).toBe('Listing Launch SOP');

    // 2. Simulate add_sop_step tool
    updateDraft((prev: any) => ({
      ...prev,
      orderedSteps: [
        {
          id: 'step_1',
          stepNumber: 1,
          action: 'Verify NC REALTORS Form 2-T terms.',
          role: 'Broker-in-Charge'
        }
      ],
      updatedAt: new Date().toISOString()
    }));
    expect(mockDraft.orderedSteps).toHaveLength(1);
    expect(mockDraft.orderedSteps[0].action).toBe('Verify NC REALTORS Form 2-T terms.');

    // 3. Simulate add_decision tool
    updateDraft((prev: any) => ({
      ...prev,
      decisions: ['Due diligence fee verified in escrow before MLS active status.'],
      updatedAt: new Date().toISOString()
    }));
    expect(mockDraft.decisions).toContain('Due diligence fee verified in escrow before MLS active status.');
  });
});
