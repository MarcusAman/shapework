/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA ElevenLabs Voice Configuration & Transport Selection
 * Governs WebSocket (default UAT) vs WebRTC (explicit rollback) transport modes.
 */

export type NoraTransportMode = 'websocket' | 'webrtc';

export interface NoraTransportConfig {
  transport: NoraTransportMode;
  agentId: string;
  voiceId: string;
  signedUrlEndpoint: string;
  webrtcTokenEndpoint: string;
  isWebSocket: boolean;
  isWebRtc: boolean;
}

export const DEFAULT_NORA_AGENT_ID = 'agent_3901kyk7pf3he52v8v9fp3m3bhd8';
export const DEFAULT_NORA_VOICE_ID = 'l006hw6wZaEYAv80cbzj';

/**
 * Resolves the active NORA voice transport mode.
 * Defaults deterministically to 'websocket'.
 * Allows explicit rollback to 'webrtc' only when configured.
 */
export function resolveNoraTransport(rawConfig?: string): NoraTransportMode {
  const normalized = (rawConfig || '').trim().toLowerCase();
  if (normalized === 'webrtc') {
    return 'webrtc';
  }
  // Default to WebSocket
  return 'websocket';
}

/**
 * Retrieves client-side NORA voice transport configuration.
 * Never exposes secrets to the client.
 */
export function getNoraVoiceConfig(): NoraTransportConfig {
  // Read Vite client environment or fallback
  const clientEnvTransport = typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env.VITE_NORA_ELEVENLABS_TRANSPORT
    : undefined;

  const transport = resolveNoraTransport(clientEnvTransport);

  const agentId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID) 
    || DEFAULT_NORA_AGENT_ID;

  const voiceId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID) 
    || DEFAULT_NORA_VOICE_ID;

  return {
    transport,
    agentId,
    voiceId,
    signedUrlEndpoint: '/api/voice-agent/elevenlabs/signed-url',
    webrtcTokenEndpoint: '/api/elevenlabs/conversation-token',
    isWebSocket: transport === 'websocket',
    isWebRtc: transport === 'webrtc'
  };
}
