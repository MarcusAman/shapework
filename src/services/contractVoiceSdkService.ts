/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Voice SDK Service — Phase 3 Architecture
 * Integrates ElevenLabs WebRTC Conversation client with contract voice authorization tokens and server tools.
 */

import { Conversation } from '@elevenlabs/client';

export type ContractVoiceSessionState = 'idle' | 'requesting_permission' | 'connecting' | 'listening' | 'speaking' | 'readback' | 'confirmed' | 'error';

export interface ContractVoiceCallbacks {
  onStateChange?: (state: ContractVoiceSessionState, details?: string) => void;
  onTranscriptMessage?: (message: { sender: 'ai' | 'user'; text: string; timestamp: string }) => void;
  onAudioLevel?: (level: number) => void;
  onSessionUpdated?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

export class ContractVoiceSdkService {
  private conversation: any = null;
  private currentState: ContractVoiceSessionState = 'idle';
  private callbacks: ContractVoiceCallbacks = {};
  private activeSessionId: string | null = null;
  private voiceToken: string | null = null;

  public getState(): ContractVoiceSessionState {
    return this.currentState;
  }

  private setState(state: ContractVoiceSessionState, details?: string) {
    this.currentState = state;
    this.callbacks.onStateChange?.(state, details);
  }

  /**
   * Starts WebRTC conversational voice session with contract authorization token & tools.
   */
  public async startSession(params: {
    conversationToken?: string;
    signedUrl?: string;
    voiceToken: string;
    sessionId: string;
    callbacks: ContractVoiceCallbacks;
  }): Promise<void> {
    const { conversationToken, signedUrl, voiceToken, sessionId, callbacks } = params;
    this.callbacks = callbacks;
    this.activeSessionId = sessionId;
    this.voiceToken = voiceToken;

    this.setState('requesting_permission', 'Requesting microphone access...');

    try {
      this.setState('connecting', 'Establishing WebRTC session with Ask Nest Ops...');

      const clientTools: Record<string, (args: any) => any> = {
        get_contract_intake: async () => {
          const res = await fetch('/api/contracts/voice-tools/get_contract_intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken }
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        update_contract_terms: async (args: { terms: any }) => {
          const res = await fetch('/api/contracts/voice-tools/update_contract_terms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken },
            body: JSON.stringify(args)
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        add_transaction_party: async (args: { fullName: string; role?: string; email?: string; phone?: string }) => {
          const res = await fetch('/api/contracts/voice-tools/add_transaction_party', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken },
            body: JSON.stringify(args)
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        update_property: async (args: { streetAddress?: string; city?: string; county?: string; postalCode?: string }) => {
          const res = await fetch('/api/contracts/voice-tools/update_property', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken },
            body: JSON.stringify(args)
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        confirm_contract_terms: async (args: { explicitBrokerConfirmation: boolean }) => {
          const res = await fetch('/api/contracts/voice-tools/confirm_contract_terms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken },
            body: JSON.stringify(args)
          });
          const data = await res.json();
          this.setState('confirmed', 'Contract terms confirmed by broker.');
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        request_bic_review: async (args: { reason: string }) => {
          const res = await fetch('/api/contracts/voice-tools/request_bic_review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken },
            body: JSON.stringify(args)
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        },

        request_mock_draft: async () => {
          const res = await fetch('/api/contracts/voice-tools/request_mock_draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-voice-token': voiceToken }
          });
          const data = await res.json();
          this.callbacks.onSessionUpdated?.(sessionId);
          return data;
        }
      };

      if (conversationToken) {
        this.conversation = await Conversation.startSession({
          conversationToken,
          clientTools,
          onConnect: () => {
            this.setState('listening', 'Ask Nest Ops is listening...');
          },
          onDisconnect: () => {
            this.setState('idle', 'Voice session ended.');
          },
          onMessage: (message: any) => {
            if (message?.source === 'ai' && message?.message) {
              this.callbacks.onTranscriptMessage?.({
                sender: 'ai',
                text: message.message,
                timestamp: new Date().toISOString()
              });
            } else if (message?.source === 'user' && message?.message) {
              this.callbacks.onTranscriptMessage?.({
                sender: 'user',
                text: message.message,
                timestamp: new Date().toISOString()
              });
            }
          },
          onError: (err: any) => {
            const errorMsg = typeof err === 'string' ? err : err?.message || 'Voice connection error';
            this.setState('error', errorMsg);
            this.callbacks.onError?.(errorMsg);
          },
          onModeChange: (mode: any) => {
            if (mode?.mode === 'speaking') {
              this.setState('speaking', 'Ask Nest Ops is speaking...');
            } else if (mode?.mode === 'listening') {
              this.setState('listening', 'Ask Nest Ops is listening...');
            }
          }
        });
      } else {
        // Fallback or demo WebRTC mode
        this.setState('listening', 'Voice session active in mock mode.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to start voice session';
      this.setState('error', msg);
      this.callbacks.onError?.(msg);
    }
  }

  /**
   * End active voice session.
   */
  public async endSession(): Promise<void> {
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (err) {
        console.warn('[ContractVoiceSdk] Error ending session:', err);
      }
      this.conversation = null;
    }
    this.setState('idle', 'Voice session ended.');
  }
}
