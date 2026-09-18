/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ElevenLabs WebRTC Voice Service — Full Bidirectional ConvAI Streaming
 * Integrates ElevenLabs WebRTC client with real-time server tool execution and UI evidence card synchronization.
 */

import { Conversation } from '@elevenlabs/client';

export type WebRtcSessionState = 'idle' | 'requesting_permission' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error';

export interface WebRtcCallbacks {
  onStateChange?: (state: WebRtcSessionState, details?: string) => void;
  onTranscriptMessage?: (message: { sender: 'ai' | 'user'; text: string; timestamp: string }) => void;
  onAudioLevel?: (level: number) => void;
  onToolExecuted?: (toolName: string, resultData: any) => void;
  onError?: (error: string) => void;
}

export class ElevenLabsWebRtcService {
  private conversation: any = null;
  private currentState: WebRtcSessionState = 'idle';
  private callbacks: WebRtcCallbacks = {};

  public getState(): WebRtcSessionState {
    return this.currentState;
  }

  private setState(state: WebRtcSessionState, details?: string) {
    this.currentState = state;
    this.callbacks.onStateChange?.(state, details);
  }

  /**
   * Starts live bidirectional WebRTC session with ElevenLabs ConvAI agent.
   */
  public async startSession(params: {
    agentId?: string;
    callbacks: WebRtcCallbacks;
  }): Promise<void> {
    this.callbacks = params.callbacks;

    try {
      this.setState('requesting_permission', 'Requesting microphone access...');

      // Fetch signed conversation token from server
      const tokenRes = await fetch('/api/elevenlabs/conversation-token', { method: 'POST' });
      if (!tokenRes.ok) {
        throw new Error(`Failed to obtain ElevenLabs token: HTTP ${tokenRes.status}`);
      }
      const { conversationToken } = await tokenRes.json();

      this.setState('connecting', 'Establishing WebRTC session with Ask Nest Ops...');

      // Define real-time client-side tools registered directly with WebRTC session
      const clientTools: Record<string, (args: any) => Promise<any>> = {
        query_directory: async (args: { name?: string; query?: string }) => {
          const searchParam = args.name || args.query || '';
          const res = await fetch('/api/voice-agent/context-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `contact info for ${searchParam}`, source: 'webrtc' })
          });
          const data = await res.json();
          if (data.evidenceCard) {
            window.dispatchEvent(new CustomEvent('voice_tool_executed', { detail: { toolName: 'query_directory', data: data.evidenceCard } }));
            this.callbacks.onToolExecuted?.('query_directory', data.evidenceCard);
          }
          return data.spokenResponse || data.displayResponse || 'Agent contact details located.';
        },

        get_active_contract: async (args: { address?: string }) => {
          const res = await fetch('/api/voice-agent/context-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `active contract terms ${args.address || ''}`, source: 'webrtc' })
          });
          const data = await res.json();
          if (data.evidenceCard) {
            window.dispatchEvent(new CustomEvent('voice_tool_executed', { detail: { toolName: 'get_active_contract', data: data.evidenceCard } }));
            this.callbacks.onToolExecuted?.('get_active_contract', data.evidenceCard);
          }
          return data.spokenResponse || data.displayResponse || 'Contract details retrieved.';
        },

        fetch_sop_checklist: async (args: { title?: string }) => {
          const res = await fetch('/api/voice-agent/context-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `SOP checklist for ${args.title || ''}`, source: 'webrtc' })
          });
          const data = await res.json();
          if (data.evidenceCard) {
            window.dispatchEvent(new CustomEvent('voice_tool_executed', { detail: { toolName: 'fetch_sop_checklist', data: data.evidenceCard } }));
            this.callbacks.onToolExecuted?.('fetch_sop_checklist', data.evidenceCard);
          }
          return data.spokenResponse || data.displayResponse || 'SOP checklist loaded.';
        },

        draft_form_2t_offer: async (args: { address?: string; price?: number; dueDiligence?: number; emd?: number }) => {
          const res = await fetch('/api/contracts/form-2t/draft-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyAddress: args.address || '312 Mayfaire Way, Wilmington NC 28405',
              purchasePrice: args.price || 725000,
              dueDiligenceFee: args.dueDiligence || 15000,
              initialEmd: args.emd || 10000
            })
          });
          const data = await res.json();
          if (data.offerDraft) {
            const cardData = {
              title: 'NC REALTORS® Form 2-T Offer Draft',
              target: 'Contract Copilot Desk',
              details: `Form 2-T Draft • Price: ${data.offerDraft.financialTerms.purchasePrice} • DD Fee: ${data.offerDraft.financialTerms.dueDiligenceFee} (${data.offerDraft.financialTerms.dueDiligencePercent})`,
              deepLinkUrl: '/app/ask-nest-ops?tab=contracts',
              dataPoints: data.offerDraft.financialTerms
            };
            window.dispatchEvent(new CustomEvent('voice_tool_executed', { detail: { toolName: 'draft_form_2t_offer', data: cardData } }));
            this.callbacks.onToolExecuted?.('draft_form_2t_offer', cardData);
          }
          return data.message || 'Form 2-T offer draft generated.';
        }
      };

      // Initialize ElevenLabs WebRTC / Rollback Conversation Client
      const sessionOptions: any = {
        clientTools,
        onConnect: () => {
          this.setState('connected', 'Live WebRTC voice session connected.');
        },
        onDisconnect: () => {
          this.setState('idle', 'WebRTC session disconnected.');
        },
        onMessage: (msg: { message: string; source: string }) => {
          if (msg && msg.message) {
            this.callbacks.onTranscriptMessage?.({
              sender: msg.source === 'ai' ? 'ai' : 'user',
              text: msg.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        },
        onError: (err: any) => {
          const msg = typeof err === 'string' ? err : err?.message || 'WebRTC Error';
          this.setState('error', msg);
          this.callbacks.onError?.(msg);
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          this.setState(mode.mode === 'speaking' ? 'speaking' : 'listening');
        }
      };

      if (conversationToken) {
        sessionOptions.conversationToken = conversationToken;
        sessionOptions.connectionType = 'webrtc';
      } else {
        sessionOptions.agentId = params.agentId || 'agent_3901kyk7pf3he52v8v9fp3m3bhd8';
      }

      this.conversation = await Conversation.startSession(sessionOptions);

    } catch (err: any) {
      console.warn('[WebRTC ConvAI Session Error]:', err);
      this.setState('error', err?.message || 'Failed to establish WebRTC voice session.');
      this.callbacks.onError?.(err?.message || 'Failed to establish WebRTC voice session.');
    }
  }

  /**
   * Ends current WebRTC session.
   */
  public async endSession(): Promise<void> {
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (e) {}
      this.conversation = null;
    }
    this.setState('idle');
  }

  /**
   * Toggles microphone mute during WebRTC call.
   */
  public setVolume(volume: number): void {
    if (this.conversation && typeof this.conversation.setVolume === 'function') {
      this.conversation.setVolume({ volume });
    }
  }
}

export const elevenLabsWebRtcService = new ElevenLabsWebRtcService();
