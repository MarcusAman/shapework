/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NoraVoiceSessionManager
 * Authoritative, Shared Voice Session Manager for NORA (Nest Operations Realtime Assistant).
 * 
 * Features:
 * - Full WebSocket transport migration using official @elevenlabs/client SDK
 * - Explicit WebRTC rollback support via configuration
 * - Single authoritative turn, speech transcription, and interruption owner
 * - Robust composite event deduplication (solves shared numeric event_id collisions)
 * - Safe client tool dispatch (Directory, Contracts, Form 2-T, SOP Guide, Escalations)
 * - Real-time frequency analysis & Apple Light Mode UI visualization
 */

import { Conversation } from '@elevenlabs/client';
import { getNoraVoiceConfig, NoraTransportMode } from '../config/noraVoiceConfig';

export type NoraSessionStatus = 
  | 'idle' 
  | 'requesting_microphone' 
  | 'requesting_signed_url' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'speaking' 
  | 'interrupted' 
  | 'disconnecting' 
  | 'disconnected' 
  | 'error';

export interface NoraTranscriptEvent {
  id: string;
  sender: 'user' | 'nora' | 'system';
  text: string;
  timestamp: string;
  eventId?: number | string;
  isPartial?: boolean;
  matchedDomain?: string;
  matchedSop?: any;
  matchedItems?: any[];
  evidenceCard?: any;
}

export interface NoraSessionCallbacks {
  onStatusChange?: (status: NoraSessionStatus, details?: string) => void;
  onTranscriptUpdate?: (transcripts: NoraTranscriptEvent[]) => void;
  onAudioFrequencyUpdate?: (bars: number[]) => void;
  onToolExecuted?: (toolName: string, data: any) => void;
  onSopDraftUpdated?: (updater: (prev: any) => any) => void;
  onError?: (errorMessage: string) => void;
}

export interface NoraStartSessionOptions {
  workspaceId?: string;
  tenantId?: string;
  userName?: string;
  userId?: string;
  role?: string;
  activeSop?: any;
  surface?: string;
  transportOverride?: NoraTransportMode;
  dynamicVariables?: Record<string, string | number | boolean>;
}

export class NoraVoiceSessionManager {
  private conversation: any = null;
  private currentStatus: NoraSessionStatus = 'idle';
  private currentStatusDetails: string = 'NORA is ready';
  private activeConversationId: string = '';
  private activeTransport: NoraTransportMode = 'websocket';
  private callbacks: NoraSessionCallbacks = {};
  
  // Deduplicated transcripts store
  private transcriptHistory: NoraTranscriptEvent[] = [];
  private seenEventKeys: Set<string> = new Set();
  
  // Audio analysis & visualization
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  
  // Lifecycle protection
  private isConnectingOrActive: boolean = false;
  private pendingAbortController: AbortController | null = null;
  private isMicMuted: boolean = false;
  private isSpeakerMuted: boolean = false;
  private contextOptions?: any;

  constructor() {
    this.activeTransport = getNoraVoiceConfig().transport;
  }

  public getStatus(): NoraSessionStatus {
    return this.currentStatus;
  }

  public getStatusDetails(): string {
    return this.currentStatusDetails;
  }

  public getTransport(): NoraTransportMode {
    return this.activeTransport;
  }

  public getTranscripts(): NoraTranscriptEvent[] {
    return [...this.transcriptHistory];
  }

  public getConversationId(): string {
    return this.activeConversationId;
  }

  private setStatus(status: NoraSessionStatus, details?: string) {
    this.currentStatus = status;
    if (details) {
      this.currentStatusDetails = details;
    }
    this.callbacks.onStatusChange?.(status, details || this.currentStatusDetails);
  }

  /**
   * Generates a composite deduplication key that guarantees unique identity
   * even when ElevenLabs assigns the same numeric event_id to both user & agent.
   */
  public generateEventKey(
    conversationId: string,
    sender: 'user' | 'nora' | 'system',
    type: string,
    eventIdOrText: string | number
  ): string {
    return `${conversationId}:${sender}:${type}:${eventIdOrText}`;
  }

  /**
   * Adds or updates a transcript event in the message store using composite deduplication.
   */
  public commitTranscriptEvent(event: {
    sender: 'user' | 'nora' | 'system';
    text: string;
    eventId?: number | string;
    isPartial?: boolean;
    matchedDomain?: string;
    matchedSop?: any;
    matchedItems?: any[];
    evidenceCard?: any;
  }): void {
    const textClean = event.text?.trim();
    if (!textClean) return;

    const eventIdOrKey = event.eventId !== undefined ? String(event.eventId) : textClean;
    const dedupeKey = this.generateEventKey(this.activeConversationId, event.sender, event.isPartial ? 'partial' : 'final', eventIdOrKey);

    if (!event.isPartial && this.seenEventKeys.has(dedupeKey)) {
      return; // Exact finalized duplicate suppressed
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `nora_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If updating an in-progress partial from the same sender and eventId
    if (event.isPartial) {
      const lastIdx = this.transcriptHistory.length - 1;
      if (lastIdx >= 0 && this.transcriptHistory[lastIdx].sender === event.sender && this.transcriptHistory[lastIdx].isPartial) {
        this.transcriptHistory[lastIdx].text = textClean;
        this.callbacks.onTranscriptUpdate?.([...this.transcriptHistory]);
        return;
      }
    } else {
      this.seenEventKeys.add(dedupeKey);
      // If previous was partial from same sender, finalize it
      const lastIdx = this.transcriptHistory.length - 1;
      if (lastIdx >= 0 && this.transcriptHistory[lastIdx].sender === event.sender && this.transcriptHistory[lastIdx].isPartial) {
        this.transcriptHistory[lastIdx] = {
          ...this.transcriptHistory[lastIdx],
          text: textClean,
          eventId: event.eventId,
          isPartial: false,
          matchedDomain: event.matchedDomain,
          matchedSop: event.matchedSop,
          matchedItems: event.matchedItems,
          evidenceCard: event.evidenceCard
        };
        this.callbacks.onTranscriptUpdate?.([...this.transcriptHistory]);
        return;
      }
    }

    const transcriptItem: NoraTranscriptEvent = {
      id: newId,
      sender: event.sender,
      text: textClean,
      timestamp: timeStr,
      eventId: event.eventId,
      isPartial: event.isPartial || false,
      matchedDomain: event.matchedDomain,
      matchedSop: event.matchedSop,
      matchedItems: event.matchedItems,
      evidenceCard: event.evidenceCard
    };

    this.transcriptHistory.push(transcriptItem);
    this.callbacks.onTranscriptUpdate?.([...this.transcriptHistory]);
  }

  /**
   * Starts live conversational voice session with ElevenLabs using the configured transport.
   */
  public async startSession(
    callbacks: NoraSessionCallbacks,
    options: NoraStartSessionOptions = {}
  ): Promise<void> {
    // 1. Idempotency protection: Reject duplicate dispatches while session is active
    if (this.isConnectingOrActive && this.conversation) {
      console.warn('[NoraVoiceSessionManager] Duplicate startSession request ignored.');
      return;
    }

    this.callbacks = callbacks;
    this.contextOptions = options;
    this.isConnectingOrActive = true;
    this.activeConversationId = `nora_conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Resolve transport mode
    const config = getNoraVoiceConfig();
    this.activeTransport = options.transportOverride || config.transport;

    // Create abort controller for in-flight requests
    this.pendingAbortController = new AbortController();
    const abortSignal = this.pendingAbortController.signal;

    try {
      this.setStatus('requesting_microphone', 'Checking microphone permission...');

      // Acquire media stream with AEC for clean audio & visualizer
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (abortSignal.aborted) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      this.mediaStream = stream;
      this.startAudioVisualizer(stream);

      // Define real-time client tools bound to active session
      const getAuthHeaders = () => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('shapework_session_token') || localStorage.getItem('token') || '') : '';
        return {
          'Content-Type': 'application/json',
          'x-workspace-id': options.workspaceId || 'ws_wilmington',
          'x-user-role': 'regional_leader',
          'x-user-email': 'ryan@nestrealty.com',
          ...(token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': `Bearer ryan@nestrealty.com` })
        };
      };

      const clientTools: Record<string, (args: any) => Promise<any> | any> = {
        query_directory: async (args: { name?: string; query?: string }) => {
          const searchParam = args.name || args.query || '';
          try {
            const res = await fetch('/api/voice-agent/context-query', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                message: `contact info for ${searchParam}`,
                source: this.activeTransport,
                workspaceId: options.workspaceId || 'ws_wilmington'
              })
            });
            const data = await res.json();
            if (data.evidenceCard) {
              this.callbacks.onToolExecuted?.('query_directory', data.evidenceCard);
            }
            return data.spokenResponse || data.displayResponse || 'Agent contact details located in directory.';
          } catch (e) {
            return 'Could not retrieve directory contact info at this time.';
          }
        },

        get_active_contract: async (args: { address?: string }) => {
          try {
            const res = await fetch('/api/voice-agent/context-query', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                message: `active contract terms ${args.address || ''}`,
                source: this.activeTransport,
                workspaceId: options.workspaceId || 'nest-realty-wilmington'
              })
            });
            const data = await res.json();
            if (data.evidenceCard) {
              this.callbacks.onToolExecuted?.('get_active_contract', data.evidenceCard);
            }
            return data.spokenResponse || data.displayResponse || 'Active contract details retrieved.';
          } catch (e) {
            return 'Contract information currently unavailable.';
          }
        },

        fetch_sop_checklist: async (args: { title?: string }) => {
          try {
            const res = await fetch('/api/voice-agent/context-query', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                message: `SOP checklist for ${args.title || ''}`,
                source: this.activeTransport,
                workspaceId: options.workspaceId || 'nest-realty-wilmington'
              })
            });
            const data = await res.json();
            if (data.evidenceCard) {
              this.callbacks.onToolExecuted?.('fetch_sop_checklist', data.evidenceCard);
            }
            return data.spokenResponse || data.displayResponse || 'SOP checklist loaded.';
          } catch (e) {
            return 'SOP procedure details currently unavailable.';
          }
        },

        draft_form_2t_offer: async (args: { address?: string; price?: number; dueDiligence?: number; emd?: number }) => {
          try {
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
                details: `Form 2-T Draft • Price: $${data.offerDraft.financialTerms?.purchasePrice?.toLocaleString() || args.price} • DD Fee: $${data.offerDraft.financialTerms?.dueDiligenceFee?.toLocaleString() || args.dueDiligence}`,
                dataPoints: data.offerDraft.financialTerms
              };
              this.callbacks.onToolExecuted?.('draft_form_2t_offer', cardData);
            }
            return data.message || 'Form 2-T offer draft generated.';
          } catch (e) {
            return 'Could not draft Form 2-T offer automatically.';
          }
        },

        // SOP Guide Mode Real-time Authoring Tools
        set_sop_title: (params: { title: string }) => {
          if (params?.title) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              title: params.title.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success', title: params.title };
        },

        set_sop_purpose: (params: { purpose: string }) => {
          if (params?.purpose) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              purpose: params.purpose.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        set_process_owner: (params: { owner: string }) => {
          if (params?.owner) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              processOwner: params.owner.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_sop_step: (params: { stepNumber?: number; action: string; role?: string; systemUsed?: string }) => {
          if (params?.action) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => {
              const currentSteps = sop.orderedSteps || [];
              const nextStepNum = params.stepNumber || currentSteps.length + 1;
              const newStep = {
                id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                stepNumber: nextStepNum,
                action: params.action.trim(),
                role: params.role?.trim() || sop.processOwner || 'Operations Lead',
                systemUsed: params.systemUsed?.trim()
              };
              const updatedSteps = [...currentSteps];
              if (params.stepNumber && params.stepNumber <= updatedSteps.length) {
                updatedSteps.splice(params.stepNumber - 1, 0, newStep);
              } else {
                updatedSteps.push(newStep);
              }
              const reindexed = updatedSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
              return {
                ...sop,
                orderedSteps: reindexed,
                updatedAt: new Date().toISOString()
              };
            });
          }
          return { status: 'success' };
        },

        update_sop_step: (params: { stepNumber: number; action?: string; role?: string; systemUsed?: string }) => {
          if (params?.stepNumber) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => {
              const updatedSteps = (sop.orderedSteps || []).map((s: any) => {
                if (s.stepNumber === params.stepNumber) {
                  return {
                    ...s,
                    action: params.action !== undefined ? params.action.trim() : s.action,
                    role: params.role !== undefined ? params.role.trim() : s.role,
                    systemUsed: params.systemUsed !== undefined ? params.systemUsed.trim() : s.systemUsed
                  };
                }
                return s;
              });
              return {
                ...sop,
                orderedSteps: updatedSteps,
                updatedAt: new Date().toISOString()
              };
            });
          }
          return { status: 'success' };
        },

        add_decision: (params: { decision: string }) => {
          if (params?.decision) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              decisions: Array.from(new Set([...(sop.decisions || []), params.decision.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_exception: (params: { exception: string }) => {
          if (params?.exception) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              exceptions: Array.from(new Set([...(sop.exceptions || []), params.exception.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_open_question: (params: { question: string }) => {
          if (params?.question) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => ({
              ...sop,
              openQuestions: Array.from(new Set([...(sop.openQuestions || []), params.question.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        mark_question_resolved: (params: { questionIndex: number }) => {
          if (params?.questionIndex !== undefined) {
            this.callbacks.onSopDraftUpdated?.((sop: any) => {
              const filtered = (sop.openQuestions || []).filter((_: any, idx: number) => idx !== params.questionIndex);
              return {
                ...sop,
                openQuestions: filtered,
                updatedAt: new Date().toISOString()
              };
            });
          }
          return { status: 'success' };
        },

        escalate_to_owner: async (args: { note?: string; urgent?: boolean }) => {
          try {
            const res = await fetch('/api/nora/voice/escalate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: args.note || 'Escalated from NORA live voice session',
                urgent: args.urgent || false,
                workspaceId: options.workspaceId
              })
            });
            const data = await res.json();
            return data.message || 'Escalation ticket generated.';
          } catch (e) {
            return 'Escalation could not be submitted.';
          }
        }
      };

      // Construct session options for @elevenlabs/client SDK
      const sessionOptions: any = {
        clientTools,
        dynamicVariables: {
          user_name: options.userName || 'Ryan',
          workspace_id: options.workspaceId || 'nest-realty-wilmington',
          surface: options.surface || 'ask-nest-ops',
          role: options.role || 'Principal Broker',
          ...(options.dynamicVariables || {})
        },
        onConnect: () => {
          this.setStatus('connected', 'Connected to NORA voice line');
          this.setStatus('listening', 'NORA is listening...');
        },
        onDisconnect: () => {
          this.isConnectingOrActive = false;
          this.setStatus('disconnected', 'Session disconnected');
        },
        onError: (err: any) => {
          this.isConnectingOrActive = false;
          const msg = typeof err === 'string' ? err : err?.message || err?.reason || 'Voice connection exception';
          console.warn('[NORA ElevenLabs Error]:', msg);
          this.setStatus('error', msg);
          this.callbacks.onError?.(msg);
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          if (mode.mode === 'speaking') {
            this.setStatus('speaking', 'NORA is speaking...');
          } else {
            this.setStatus('listening', 'NORA is listening...');
          }
        },
        onMessage: (msg: any) => {
          if (msg && msg.message) {
            const isAi = msg.source === 'ai' || msg.sender === 'ai' || msg.source === 'assistant';
            this.commitTranscriptEvent({
              sender: isAi ? 'nora' : 'user',
              text: msg.message,
              eventId: msg.event_id || msg.id,
              isPartial: false
            });
          }
        }
      };

      // 2. Transport Execution: WebSocket vs WebRTC
      if (this.activeTransport === 'websocket') {
        this.setStatus('requesting_signed_url', 'Requesting secure signed URL...');
        
        // Fetch ephemeral signed URL from server
        const signedRes = await fetch(config.signedUrlEndpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abortSignal
        });

        if (!signedRes.ok) {
          throw new Error(`Failed to authenticate voice session (HTTP ${signedRes.status})`);
        }

        const signedData = await signedRes.json();
        if (!signedData.success || !signedData.signedUrl) {
          throw new Error(signedData.error || 'Server did not return a valid voice signed URL');
        }

        sessionOptions.signedUrl = signedData.signedUrl;
        sessionOptions.connectionType = 'websocket';

        this.setStatus('connecting', 'Establishing secure WebSocket link to NORA...');
      } else {
        // Explicit WebRTC Rollback Path
        this.setStatus('requesting_signed_url', 'Requesting WebRTC conversation token...');

        const tokenRes = await fetch(config.webrtcTokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortSignal
        });

        if (!tokenRes.ok) {
          throw new Error(`Failed to obtain WebRTC token (HTTP ${tokenRes.status})`);
        }

        const tokenData = await tokenRes.json();
        if (!tokenData.success || (!tokenData.conversationToken && !tokenData.signedUrl)) {
          throw new Error(tokenData.error || 'WebRTC token unavailable');
        }

        if (tokenData.conversationToken) {
          sessionOptions.conversationToken = tokenData.conversationToken;
          sessionOptions.connectionType = 'webrtc';
        } else {
          sessionOptions.signedUrl = tokenData.signedUrl;
          sessionOptions.connectionType = 'websocket';
        }

        this.setStatus('connecting', 'Establishing WebRTC session with NORA...');
      }

      if (abortSignal.aborted) {
        return;
      }

      // Initialize official ElevenLabs SDK session
      this.conversation = await Conversation.startSession(sessionOptions);

    } catch (err: any) {
      this.isConnectingOrActive = false;
      this.cleanupMedia();

      if (err.name === 'AbortError') {
        this.setStatus('idle', 'Session start cancelled');
        return;
      }

      let friendlyMsg = err.message || 'Microphone or network connection failed';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg = 'Microphone permission denied. Please enable microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg = 'No microphone device was detected on your computer.';
      }

      this.setStatus('error', friendlyMsg);
      this.callbacks.onError?.(friendlyMsg);
    } finally {
      this.pendingAbortController = null;
    }
  }

  /**
   * Audio Visualizer for 20-bar frequency animation.
   */
  private startAudioVisualizer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      this.audioContext = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      this.analyser = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLoop = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        const bars: number[] = [];
        const step = Math.floor(bufferLength / 20) || 1;

        for (let i = 0; i < 20; i++) {
          const val = dataArray[i * step] || 0;
          const normalized = Math.max(0.08, Math.min(1.0, val / 255));
          bars.push(normalized);
        }

        this.callbacks.onAudioFrequencyUpdate?.(bars);
        this.animFrameId = requestAnimationFrame(updateLoop);
      };

      updateLoop();
    } catch (e) {
      console.warn('[NORA Visualizer Init]:', e);
    }
  }

  /**
   * Dispatches typed user prompt through the unified NORA session.
   */
  public async sendTextMessage(text: string): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    this.commitTranscriptEvent({
      sender: 'user',
      text: cleanText
    });

    if (this.conversation && typeof this.conversation.sendUserMessage === 'function') {
      try {
        this.conversation.sendUserMessage(cleanText);
        return;
      } catch (e) {
        console.warn('[NoraVoiceSessionManager] sendUserMessage SDK fallback:', e);
      }
    }

    // Fallback if not connected to live voice session: query unified context backend
    try {
      this.setStatus('speaking', 'NORA is processing...');
      const sessionToken = typeof window !== 'undefined' ? (localStorage.getItem('shapework_session_token') || localStorage.getItem('token') || '') : '';
      const res = await fetch('/api/voice-agent/context-query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-id': this.contextOptions?.workspaceId || 'ws_wilmington',
          'x-user-role': 'regional_leader',
          'x-user-email': 'ryan@nestrealty.com',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : { 'Authorization': `Bearer ryan@nestrealty.com` })
        },
        credentials: 'include',
        body: JSON.stringify({ message: cleanText })
      });
      const data = await res.json();
      const ans = data.spokenResponse || data.displayResponse || 'I have logged your request into the Nest operations desk.';
      
      this.commitTranscriptEvent({
        sender: 'nora',
        text: ans,
        evidenceCard: data.evidenceCard
      });

      this.setStatus('listening', 'NORA is listening...');
    } catch (err: any) {
      this.commitTranscriptEvent({
        sender: 'nora',
        text: "I've recorded your note in Nest Ops."
      });
      this.setStatus('listening', 'NORA is listening...');
    }
  }

  /**
   * Mute / unmute microphone.
   */
  public setMicMuted(muted: boolean): void {
    this.isMicMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
    if (this.conversation && typeof this.conversation.setMicMuted === 'function') {
      try {
        this.conversation.setMicMuted(muted);
      } catch (e) {}
    }
  }

  /**
   * Mute / unmute output speaker audio.
   */
  public async setSpeakerMuted(muted: boolean): Promise<void> {
    this.isSpeakerMuted = muted;
    if (this.conversation && typeof this.conversation.setVolume === 'function') {
      try {
        await this.conversation.setVolume({ volume: muted ? 0 : 1 });
      } catch (e) {}
    }
  }

  /**
   * Idempotently terminates active NORA voice session and releases all resources.
   */
  public async endSession(): Promise<void> {
    this.setStatus('disconnecting', 'Ending session...');
    this.isConnectingOrActive = false;

    if (this.pendingAbortController) {
      this.pendingAbortController.abort();
      this.pendingAbortController = null;
    }

    if (this.conversation) {
      const conv = this.conversation;
      this.conversation = null;
      try {
        if (typeof conv.setMicMuted === 'function') {
          conv.setMicMuted(true);
        }
        await conv.endSession().catch(() => {});
      } catch (e) {}
    }

    this.cleanupMedia();
    this.setStatus('idle', 'NORA is ready');
  }

  private cleanupMedia() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Resets conversation transcripts and session memory.
   */
  public resetConversation(): void {
    this.transcriptHistory = [];
    this.seenEventKeys.clear();
    this.callbacks.onTranscriptUpdate?.([]);
  }
}

// Export singleton instance
export const noraVoiceSessionManager = new NoraVoiceSessionManager();
