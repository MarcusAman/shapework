import { Conversation } from '@elevenlabs/client';
import { VoiceSessionState, SopDocument, SopStep } from '../types/sopWorkflow';

export interface StartInterviewOptions {
  dynamicVariables?: Record<string, string | number | boolean>;
  overrides?: {
    agent?: {
      firstMessage?: string;
      prompt?: {
        prompt?: string;
      };
    };
  };
}

export interface SdkServiceCallbacks {
  onStateChange?: (state: VoiceSessionState, details?: string) => void;
  onTranscriptMessage?: (message: { sender: 'ai' | 'user'; text: string; timestamp: string }) => void;
  onAudioLevel?: (level: number) => void;
  onSopDraftUpdated?: (updater: (prev: SopDocument) => SopDocument) => void;
  onError?: (error: string) => void;
}

export class ElevenLabsSdkService {
  private conversation: any = null;
  private currentState: VoiceSessionState = 'idle';
  private callbacks: SdkServiceCallbacks = {};
  private isStartingOrActive: boolean = false;

  public getState(): VoiceSessionState {
    return this.currentState;
  }

  private setState(state: VoiceSessionState, details?: string) {
    this.currentState = state;
    this.callbacks.onStateChange?.(state, details);
  }

  public async startInterview(
    signedUrl: string,
    callbacks: SdkServiceCallbacks,
    options?: StartInterviewOptions
  ): Promise<void> {
    // Idempotency: Reject duplicate start dispatches while session is active
    if (this.isStartingOrActive && this.conversation) {
      console.warn('[ElevenLabs SDK] Duplicate startInterview request ignored.');
      return;
    }

    this.isStartingOrActive = true;
    this.callbacks = callbacks;
    this.setState('requesting_permission', 'Checking microphone permission...');

    try {
      this.setState('connecting', 'Connecting to AI Operations Consultant Voice Line...');

      const clientTools: Record<string, (params: any) => any> = {
        set_sop_title: (params: { title: string }) => {
          if (params?.title) {
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              title: params.title.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success', title: params.title };
        },

        set_sop_purpose: (params: { purpose: string }) => {
          if (params?.purpose) {
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              purpose: params.purpose.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        set_process_owner: (params: { owner: string }) => {
          if (params?.owner) {
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              processOwner: params.owner.trim(),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_sop_step: (params: { stepNumber?: number; action: string; role?: string; systemUsed?: string }) => {
          if (params?.action) {
            this.callbacks.onSopDraftUpdated?.((sop) => {
              const nextStepNum = params.stepNumber || sop.orderedSteps.length + 1;
              const newStep: SopStep = {
                id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                stepNumber: nextStepNum,
                action: params.action.trim(),
                role: params.role?.trim() || sop.processOwner || 'Operations Lead',
                systemUsed: params.systemUsed?.trim()
              };
              const updatedSteps = [...sop.orderedSteps];
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
            this.callbacks.onSopDraftUpdated?.((sop) => {
              const updatedSteps = sop.orderedSteps.map((s) => {
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
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              decisions: Array.from(new Set([...sop.decisions, params.decision.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_exception: (params: { exception: string }) => {
          if (params?.exception) {
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              exceptions: Array.from(new Set([...sop.exceptions, params.exception.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        add_open_question: (params: { question: string }) => {
          if (params?.question) {
            this.callbacks.onSopDraftUpdated?.((sop) => ({
              ...sop,
              openQuestions: Array.from(new Set([...sop.openQuestions, params.question.trim()])),
              updatedAt: new Date().toISOString()
            }));
          }
          return { status: 'success' };
        },

        mark_question_resolved: (params: { questionIndex: number }) => {
          if (params?.questionIndex !== undefined) {
            this.callbacks.onSopDraftUpdated?.((sop) => {
              const filtered = sop.openQuestions.filter((_, idx) => idx !== params.questionIndex);
              return {
                ...sop,
                openQuestions: filtered,
                updatedAt: new Date().toISOString()
              };
            });
          }
          return { status: 'success' };
        }
      };

      const sessionOptions: any = {
        connectionType: 'websocket',
        dynamicVariables: options?.dynamicVariables,
        overrides: options?.overrides as any,
        clientTools,
        onConnect: () => {
          this.setState('listening', 'Connected to AI Operations Consultant');
        },
        onDisconnect: () => {
          this.isStartingOrActive = false;
          this.setState('ended', 'Interview ended');
        },
        onError: (err: any) => {
          this.isStartingOrActive = false;
          console.error('[ElevenLabs SDK Error]:', err);
          const errMsg = typeof err === 'string' ? err : err?.message || err?.reason || 'Voice session error occurred';
          this.setState('error', errMsg);
          this.callbacks.onError?.(errMsg);
        },
        onModeChange: (mode: { mode: 'speaking' | 'listening' }) => {
          if (mode.mode === 'speaking') {
            this.setState('consultant_speaking', 'AI Operations Consultant speaking...');
          } else {
            this.setState('listening', 'Listening for your response...');
          }
        },
        onMessage: (msg: { message: string; source: 'user' | 'ai' }) => {
          if (msg.message) {
            this.callbacks.onTranscriptMessage?.({
              sender: msg.source === 'ai' ? 'ai' : 'user',
              text: msg.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
          }
        }
      };

      if (signedUrl && (signedUrl.startsWith('wss://') || signedUrl.includes('token=') || signedUrl.includes('signature='))) {
        sessionOptions.signedUrl = signedUrl;
        sessionOptions.connectionType = 'websocket';
      } else if (signedUrl && signedUrl.startsWith('agent_')) {
        sessionOptions.agentId = signedUrl;
        sessionOptions.connectionType = 'websocket';
      } else if (signedUrl) {
        sessionOptions.signedUrl = signedUrl;
        sessionOptions.connectionType = 'websocket';
      } else {
        sessionOptions.agentId = 'agent_3901kyk7pf3he52v8v9fp3m3bhd8';
        sessionOptions.connectionType = 'websocket';
      }

      this.conversation = await Conversation.startSession(sessionOptions);
    } catch (err: any) {
      this.isStartingOrActive = false;
      console.error('[ElevenLabs SDK Start Error]:', err);
      let userFriendlyMsg = err.message || 'Microphone access or network connection failed';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userFriendlyMsg = 'Microphone permission was denied. Please grant microphone access to begin the voice interview.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userFriendlyMsg = 'No microphone device was detected on your computer.';
      }
      this.setState('error', userFriendlyMsg);
      this.callbacks.onError?.(userFriendlyMsg);
    }
  }

  public async setMuted(muted: boolean): Promise<void> {
    if (this.conversation) {
      try {
        this.conversation.setMicMuted(muted);
      } catch (e) {
        await this.conversation.setVolume({ volume: muted ? 0 : 1 });
      }
    }
  }

  public async endInterview(): Promise<void> {
    this.setState('ending', 'Ending session...');
    this.isStartingOrActive = false;
    if (this.conversation) {
      const conv = this.conversation;
      this.conversation = null;
      try {
        conv.setMicMuted(true);
        await conv.endSession().catch(() => {});
      } catch (e) {}
    }
    this.setState('ended', 'Interview completed');
  }
}

export const elevenLabsSdkService = new ElevenLabsSdkService();
