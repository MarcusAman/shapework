/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VoiceDiagnostics — Event Logging & Diagnostic Instrumentation
 */

export type DiagnosticEventType =
  | 'wake_detected'
  | 'voice_session_activated'
  | 'interim_transcript_updated'
  | 'final_segment_received'
  | 'finalization_timer_scheduled'
  | 'finalization_timer_cancelled'
  | 'final_utterance_created'
  | 'turn_dispatch_started'
  | 'turn_committed'
  | 'turn_cancelled'
  | 'duplicate_turn_suppressed'
  | 'intent_selected'
  | 'backend_request_started'
  | 'backend_request_aborted'
  | 'response_accepted'
  | 'response_suppressed'
  | 'assistant_response_received'
  | 'tts_request_started'
  | 'tts_response_received'
  | 'audio_playback_started'
  | 'audio_playback_failed'
  | 'listening_resumed';

export interface DiagnosticEvent {
  type: DiagnosticEventType;
  timestamp: string;
  utteranceId?: string;
  details?: string;
}

class DiagnosticLoggerSingleton {
  private listeners: ((event: DiagnosticEvent) => void)[] = [];
  private history: DiagnosticEvent[] = [];

  public log(type: DiagnosticEventType, utteranceId?: string, details?: string): DiagnosticEvent {
    const event: DiagnosticEvent = {
      type,
      timestamp: new Date().toISOString(),
      utteranceId,
      details
    };
    this.history.push(event);
    if (this.history.length > 200) {
      this.history.shift();
    }
    this.listeners.forEach(fn => {
      try { fn(event); } catch (e) {}
    });
    return event;
  }

  public subscribe(fn: (event: DiagnosticEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  public getHistory(): DiagnosticEvent[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }
}

export const VoiceDiagnostics = new DiagnosticLoggerSingleton();
