/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VoicePipeline — STT, Multi-Segment Aggregation, Adaptive Endpointing, Audio Analyser, Wake Detection, Utterance Lifecycle, Echo Suppression & STOP Command Interruption
 */

import { AudioPlaybackManager } from './audioPlaybackManager';
import { VoiceDiagnostics } from './voiceDiagnostics';
import type { AgentState } from './agentRuntimeReducer';

export type { AgentState };

export interface TranscriptPayload {
  text: string;
  utteranceId: string;
  isFinal: boolean;
  isWakeOnly: boolean;
}

export interface InterimUpdatePayload {
  text: string;
  interimOnly: string;
  utteranceId: string;
}

export interface VoicePipelineCallbacks {
  onStatusChange: (status: AgentState) => void;
  onWakeDetected?: (utteranceId: string) => void;
  onInterimUpdate?: (payload: InterimUpdatePayload) => void;
  onTranscriptReceived: (payload: TranscriptPayload) => void;
  onFrequencyUpdate: (bars: number[]) => void;
  onUserInterrupted?: () => void;
  onSpeechStarted?: (utteranceId: string) => void;
}

/**
 * Determines whether a recognized speech fragment is an obviously incomplete conversational prelude
 * or ends with a dangling continuation token, requiring an extended silence window before finalization.
 */
export function isLikelyIncompleteUtterance(text: string): boolean {
  const clean = text.toLowerCase().replace(/[*#_`.,?!]/g, '').trim();
  if (!clean) return true;

  const incompletePrefixes = [
    'can you',
    'could you',
    'would you',
    'will you',
    'please',
    'i need',
    'i want',
    'help me',
    'can you help me',
    'can you help me find',
    'help me find',
    'can you find',
    'could you find',
    'i need to find',
    'i need to check',
    'how do i find',
    'where do i find',
    'do you know',
    'what is the',
    'where can i',
    'how do i',
    'tell me about',
    'who is the',
    'show me',
    'find the',
    'what is',
    'where is',
    'how is',
    'who is',
    'which is',
    'can we',
    'could we',
    'should we'
  ];

  const words = clean.split(/\s+/).filter(Boolean);

  // If the entire utterance matches an incomplete prelude exactly
  if (incompletePrefixes.some(p => clean === p)) {
    return true;
  }

  // If the utterance begins with an incomplete prelude and has 6 words or fewer without specific domain keywords
  const domainKeywords = [
    'sop', 'protocol', 'procedure', 'policy', 'contract', 'listing', 'cda', 'roster', 
    'agent', 'vendor', 'escrow', 'phone', 'number', 'email', 'contact', 'address', 'office', 'cell'
  ];
  const hasDomainKeyword = domainKeywords.some(k => clean.includes(k));
  if (words.length <= 6 && !hasDomainKeyword && incompletePrefixes.some(p => clean.startsWith(p))) {
    return true;
  }

  // Trailing grammatical continuations (conjunctions, prepositions, determiners, transitive verbs)
  const lastWord = words[words.length - 1];
  const trailingContinuations = new Set([
    'and', 'or', 'but', 'for', 'with', 'to', 'about', 'in', 'on', 'at',
    'the', 'a', 'an', 'of', 'by', 'from', 'as', 'into', 'like', 'through',
    'after', 'before', 'between', 'under', 'during', 'without', 'because',
    'find', 'check', 'get', 'see', 'show', 'look', 'view', 'open', 'draft', 'send', 'prepare'
  ]);

  if (trailingContinuations.has(lastWord)) {
    return true;
  }

  return false;
}

export class VoicePipeline {
  private callbacks: VoicePipelineCallbacks;
  private currentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private recognition: any = null;
  private stopRecognition: any = null;
  private isSpeaking = false;
  private lastSpeakingEndTime = 0;
  private lastSpokenTexts: Set<string> = new Set();
  private currentUtteranceId: string | null = null;
  private hasPlayedWakeChimeForUtterance = false;

  // Lifecycle & Session State Flags
  private isListeningActive = false;
  private isExplicitStopRequested = false;
  private isCancelRequested = false;
  private fatalErrorOccurred = false;
  private restartAttempts = 0;
  private lastRestartTimestamp = 0;

  // Authoritative Turn & Aggregation Buffer State
  private finalizedSegments: string[] = [];
  private currentInterimText: string = '';
  private finalizationTimer: any = null;
  private isTurnCommitted = false;
  private lastSpeechTimestamp = 0;

  constructor(callbacks: VoicePipelineCallbacks) {
    this.callbacks = callbacks;
  }

  public getUtteranceId(): string {
    if (!this.currentUtteranceId) {
      this.currentUtteranceId = 'utt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }
    return this.currentUtteranceId;
  }

  public resetUtteranceId(): void {
    this.currentUtteranceId = null;
    this.hasPlayedWakeChimeForUtterance = false;
    this.finalizedSegments = [];
    this.currentInterimText = '';
    this.isTurnCommitted = false;
  }

  private clearFinalizationTimer(): void {
    if (this.finalizationTimer) {
      clearTimeout(this.finalizationTimer);
      this.finalizationTimer = null;
      VoiceDiagnostics.log('finalization_timer_cancelled', this.currentUtteranceId || undefined);
    }
  }

  private isSelfEcho(text: string): boolean {
    const clean = text.toLowerCase().replace(/[*#_`.,?!]/g, '').trim();
    if (!clean) return false;

    // Direct match against recently spoken text
    if (this.lastSpokenTexts.has(clean)) return true;

    // Check if recognized text is contained inside any recently spoken assistant text
    for (const spoken of this.lastSpokenTexts) {
      if (spoken.length >= 4 && (spoken.includes(clean) || clean.includes(spoken))) {
        return true;
      }
    }

    // Common system fallback phrases that might be transcribed from speaker output
    const echoPhrases = [
      'searched authorized nest records',
      'authorized nest records',
      'searched authorized nurse records',
      'do you have',
      'searched',
      'can you hear me can you help me',
      'yes i can hear you'
    ];
    if (echoPhrases.some(p => clean.includes(p))) {
      return true;
    }

    return false;
  }

  /**
   * Authoritative Turn Commit: Single authoritative exit path.
   */
  public commitCurrentTurn(reason: string = 'adaptive_silence'): void {
    this.clearFinalizationTimer();

    if (this.isTurnCommitted) {
      return;
    }

    const segmentsText = this.finalizedSegments.filter(Boolean).join(' ').trim();
    const interimText = this.currentInterimText.trim();
    const combined = [segmentsText, interimText].filter(Boolean).join(' ').trim();

    if (!combined) {
      this.resetUtteranceId();
      this.callbacks.onStatusChange('idle');
      return;
    }

    const uttId = this.getUtteranceId();
    this.isTurnCommitted = true;

    VoiceDiagnostics.log('turn_committed', uttId, `Reason: ${reason} | Text: "${combined}"`);

    const lower = combined.toLowerCase();
    const wakePhrases = ['hey nest', 'hi nest', 'hey nora', 'hi nora', 'ask nora', 'nest ops', 'nest'];
    const isWakePhrase = wakePhrases.includes(lower);

    this.callbacks.onStatusChange('finalizing');

    this.callbacks.onTranscriptReceived({
      text: combined,
      utteranceId: uttId,
      isFinal: true,
      isWakeOnly: isWakePhrase
    });

    this.resetUtteranceId();
  }

  /**
   * Cancel and discard uncommitted speech turn completely.
   */
  public cancelCurrentTurn(): void {
    this.isCancelRequested = true;
    this.clearFinalizationTimer();
    const uttId = this.currentUtteranceId;
    this.resetUtteranceId();
    VoiceDiagnostics.log('turn_cancelled', uttId || undefined, 'Reason: cancel | User explicitly cancelled uncommitted turn');
    this.callbacks.onStatusChange('idle');
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public setMediaStream(stream: MediaStream): void {
    this.mediaStream = stream;
    this.setupAudioAnalyser(stream);
  }

  public async startListening(): Promise<void> {
    const SpeechRecognition = (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.callbacks.onStatusChange('error');
      return;
    }

    this.isListeningActive = true;
    this.isCancelRequested = false;
    this.isExplicitStopRequested = false;
    this.fatalErrorOccurred = false;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !this.mediaStream) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          this.mediaStream = stream;
          this.setupAudioAnalyser(stream);
        } catch (e) {
          console.warn('[VoicePipeline getUserMedia warning]:', e);
        }
      }

      if (this.recognition) {
        try { this.recognition.abort(); } catch (e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        this.restartAttempts = 0;
        if (this.finalizedSegments.length > 0 || this.currentInterimText.length > 0) {
          this.callbacks.onStatusChange('collecting');
        } else {
          this.callbacks.onStatusChange('listening');
        }
      };

      rec.onspeechstart = () => {
        const uttId = this.getUtteranceId();
        if (this.callbacks.onSpeechStarted) {
          this.callbacks.onSpeechStarted(uttId);
        }
      };

      rec.onsoundstart = () => {
        const uttId = this.getUtteranceId();
        if (this.callbacks.onSpeechStarted) {
          this.callbacks.onSpeechStarted(uttId);
        }
      };

      rec.onresult = (event: any) => {
        // Strict Acoustic Echo & Playback Guard: Drop input while NORA is speaking or during 600ms tail cooldown
        if (this.isSpeaking || (Date.now() - this.lastSpeakingEndTime < 600)) {
          return;
        }

        const uttId = this.getUtteranceId();
        this.lastSpeechTimestamp = Date.now();

        // Notify speech start so in-flight requests and stale TTS audio are immediately aborted!
        if (this.callbacks.onSpeechStarted) {
          this.callbacks.onSpeechStarted(uttId);
        }

        let newSessionFinalSegments: string[] = [];
        let liveInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            if (transcriptChunk.trim()) {
              newSessionFinalSegments.push(transcriptChunk.trim());
            }
          } else {
            liveInterim += ' ' + transcriptChunk;
          }
        }

        // Deduplicate and merge segments across restarts without duplicate concatenation
        const mergedFinal = Array.from(new Set([...this.finalizedSegments, ...newSessionFinalSegments])).filter(Boolean);
        this.finalizedSegments = mergedFinal;
        this.currentInterimText = liveInterim.trim();

        const accumulatedText = [...this.finalizedSegments, this.currentInterimText]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (!accumulatedText) return;

        // Self-Echo Filter: Discard transcripts matching recently spoken assistant audio
        if (this.isSelfEcho(accumulatedText)) {
          VoiceDiagnostics.log('duplicate_turn_suppressed', uttId, `Self-Echo Filter: ${accumulatedText}`);
          return;
        }

        const lower = accumulatedText.toLowerCase();
        const wakePhrases = ['hey nest', 'hi nest', 'hey nora', 'hi nora', 'ask nora', 'nest ops', 'nest'];
        const isWakePhrase = wakePhrases.includes(lower);
        const startsWithWakePhrase = wakePhrases.some(p => lower.startsWith(p));

        // Wake Phrase Earcon & State Activation
        if ((isWakePhrase || startsWithWakePhrase) && !this.hasPlayedWakeChimeForUtterance) {
          this.hasPlayedWakeChimeForUtterance = true;
          AudioPlaybackManager.playWakeChime();
          VoiceDiagnostics.log('wake_detected', uttId, accumulatedText);
          if (this.callbacks.onWakeDetected) {
            this.callbacks.onWakeDetected(uttId);
          }
        }

        // Pure wake phrase triggers immediate activation
        if (isWakePhrase) {
          this.commitCurrentTurn('wake_phrase_only');
          return;
        }

        // Broadcast interim presentation update (DISPLAY ONLY — NEVER COMMITS MESSAGE OR BACKEND)
        this.callbacks.onStatusChange('collecting');
        if (this.callbacks.onInterimUpdate) {
          this.callbacks.onInterimUpdate({
            text: accumulatedText,
            interimOnly: this.currentInterimText,
            utteranceId: uttId
          });
        }
        VoiceDiagnostics.log('interim_transcript_updated', uttId, accumulatedText);

        // Adaptive Endpointing: Calculate silence window based on incomplete preludes
        this.clearFinalizationTimer();

        const isIncomplete = isLikelyIncompleteUtterance(accumulatedText);
        // Extended endpointing for incomplete preludes (2,000ms), standard endpointing for normal speech (1,200ms)
        const endpointDelayMs = isIncomplete ? 2000 : 1200;

        VoiceDiagnostics.log(
          'finalization_timer_scheduled', 
          uttId, 
          `Delay: ${endpointDelayMs}ms | IncompletePrelude: ${isIncomplete} | Text: "${accumulatedText}"`
        );

        this.finalizationTimer = setTimeout(() => {
          if (this.isSpeaking || (Date.now() - this.lastSpeakingEndTime < 600)) return;
          this.commitCurrentTurn('adaptive_silence');
        }, endpointDelayMs);
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech') {
          // If no speech, return to idle without error unless a turn was in progress
          if (!this.finalizedSegments.length && !this.currentInterimText) {
            this.callbacks.onStatusChange('idle');
          }
          return;
        }
        if (e.error === 'aborted') {
          return;
        }
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          this.fatalErrorOccurred = true;
          this.isListeningActive = false;
          VoiceDiagnostics.log('fatal_recognition_error' as any, this.currentUtteranceId || undefined, `Error: ${e.error}`);
          this.callbacks.onStatusChange('error');
        }
      };

      rec.onend = () => {
        VoiceDiagnostics.log('recognition_session_ended' as any, this.currentUtteranceId || undefined, `ListeningActive: ${this.isListeningActive} | CancelRequested: ${this.isCancelRequested} | ExplicitStop: ${this.isExplicitStopRequested}`);

        // 1. User explicitly cancelled -> discard and go idle
        if (this.isCancelRequested) {
          this.resetUtteranceId();
          this.callbacks.onStatusChange('idle');
          return;
        }

        // 2. User explicitly clicked stop/send -> commit buffered turn immediately
        if (this.isExplicitStopRequested) {
          this.isExplicitStopRequested = false;
          if (this.finalizedSegments.length > 0 || this.currentInterimText.length > 0) {
            this.commitCurrentTurn('explicit_stop');
          } else {
            this.callbacks.onStatusChange('idle');
          }
          return;
        }

        // 3. Spontaneous/Browser-triggered session end while listening is active:
        // DO NOT COMMIT TURN PREMATURELY!
        // Preserve buffered segments, keep endpoint timer running, and restart recognition safely.
        if (this.isListeningActive && !this.fatalErrorOccurred && !this.isSpeaking) {
          const bufferedText = [...this.finalizedSegments, this.currentInterimText].filter(Boolean).join(' ').trim();

          // If buffered text exists and no endpointing timer is active, schedule one
          if (bufferedText && !this.finalizationTimer) {
            const isIncomplete = isLikelyIncompleteUtterance(bufferedText);
            const endpointDelayMs = isIncomplete ? 2000 : 1200;
            this.finalizationTimer = setTimeout(() => {
              if (this.isSpeaking || (Date.now() - this.lastSpeakingEndTime < 600)) return;
              this.commitCurrentTurn('adaptive_silence');
            }, endpointDelayMs);
          }

          // Debounced safe automatic restart
          const now = Date.now();
          if (now - this.lastRestartTimestamp < 1000) {
            this.restartAttempts++;
          } else {
            this.restartAttempts = 1;
          }
          this.lastRestartTimestamp = now;

          if (this.restartAttempts <= 5) {
            try {
              rec.start();
              VoiceDiagnostics.log('recognition_restarted' as any, this.currentUtteranceId || undefined, `Attempt: ${this.restartAttempts} | PreservedBuffer: "${bufferedText}"`);
            } catch (err) {
              console.warn('[VoicePipeline Safe Restart Warning]:', err);
            }
          } else {
            VoiceDiagnostics.log('restart_limit_reached' as any, this.currentUtteranceId || undefined, `Preserving buffer for adaptive endpointing`);
          }
        } else if (!this.isSpeaking) {
          this.callbacks.onStatusChange('idle');
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (e) {
      console.warn('[VoicePipeline Start Error]:', e);
      this.callbacks.onStatusChange('error');
    }
  }

  public stopListening(explicitSubmit: boolean = false): void {
    this.isListeningActive = false;
    this.clearFinalizationTimer();
    
    if (explicitSubmit) {
      this.commitCurrentTurn('explicit_submit');
    } else {
      this.isExplicitStopRequested = true;
      if (this.finalizedSegments.length > 0 || this.currentInterimText.length > 0) {
        this.commitCurrentTurn('explicit_stop');
      }
    }

    if (this.recognition) {
      try { 
        this.recognition.onresult = null;
        this.recognition.abort(); 
      } catch (e) {}
      this.recognition = null;
    }
    this.resetUtteranceId();
    this.callbacks.onStatusChange('idle');
  }

  /**
   * Dedicated STOP command listener that runs ONLY while agent is speaking.
   * If the user says "STOP", "stop speaking", "pause", "be quiet", "cancel", "shut up",
   * audio playback is instantly halted.
   */
  private startStopCommandListener(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (this.stopRecognition) {
        try { this.stopRecognition.abort(); } catch (e) {}
      }

      const stopRec = new SpeechRecognition();
      stopRec.continuous = true;
      stopRec.interimResults = true;
      stopRec.lang = 'en-US';

      stopRec.onresult = (event: any) => {
        if (!this.isSpeaking) return;

        let liveText = '';
        const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIdx; i < event.results.length; i++) {
          liveText += event.results[i][0].transcript;
        }

        const lower = liveText.trim().toLowerCase();
        const stopKeywords = ['stop', 'stop speaking', 'pause', 'be quiet', 'shut up', 'cancel', 'halt', 'quiet'];
        
        const heardStop = stopKeywords.some(kw => lower === kw || lower.includes(kw));
        if (heardStop) {
          VoiceDiagnostics.log('user_interrupted_stop_command' as any, this.getUtteranceId(), lower);
          this.stopAudioPlayback();
          this.stopStopCommandListener();
          if (this.callbacks.onUserInterrupted) {
            this.callbacks.onUserInterrupted();
          }
          this.callbacks.onStatusChange('cancelled');
        }
      };

      stopRec.onerror = () => {};
      stopRec.onend = () => {};

      this.stopRecognition = stopRec;
      stopRec.start();
    } catch (e) {
      console.warn('[StopCommandListener Error]:', e);
    }
  }

  private stopStopCommandListener(): void {
    if (this.stopRecognition) {
      try {
        this.stopRecognition.onresult = null;
        this.stopRecognition.abort();
      } catch (e) {}
      this.stopRecognition = null;
    }
  }

  public async speakText(text: string, utteranceId?: string, voiceId = 'l006hw6wZaEYAv80cbzj'): Promise<void> {
    this.stopAudioPlayback();
    this.stopListening(); // Mute main query mic while speaking!
    this.isSpeaking = true;
    this.callbacks.onStatusChange('speaking');

    // Activate dedicated listener that ONLY checks for the word "STOP"
    this.startStopCommandListener();

    const cleanText = text.replace(/[*#_`]/g, '').trim();
    const cleanLower = cleanText.toLowerCase();

    // Cache clean text and fragments in lastSpokenTexts to block self-echo
    this.lastSpokenTexts.add(cleanLower);
    cleanLower.split(/[.,?!;:]/).forEach(chunk => {
      const trimmedChunk = chunk.trim();
      if (trimmedChunk.length >= 4) {
        this.lastSpokenTexts.add(trimmedChunk);
      }
    });

    if (this.lastSpokenTexts.size > 20) {
      const arr = Array.from(this.lastSpokenTexts);
      this.lastSpokenTexts = new Set(arr.slice(-15));
    }

    VoiceDiagnostics.log('tts_request_started', utteranceId, cleanText);

    try {
      const res = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceId })
      });

      if (res.ok) {
        VoiceDiagnostics.log('tts_response_received', utteranceId);
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        VoiceDiagnostics.log('audio_playback_started', utteranceId);
        await AudioPlaybackManager.playAudio(audio);

        this.stopStopCommandListener();
        this.isSpeaking = false;
        this.lastSpeakingEndTime = Date.now();
        this.currentAudio = null;
        this.stopListening();
        this.callbacks.onStatusChange('idle');
        VoiceDiagnostics.log('turn_completed', utteranceId, 'Microphone turned off following assistant response');
        return;
      } else {
        VoiceDiagnostics.log('audio_playback_failed', utteranceId, `HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.warn('[VoicePipeline TTS Error]:', e);
      VoiceDiagnostics.log('audio_playback_failed', utteranceId, e?.message || 'Network error');
    }

    this.stopStopCommandListener();
    this.isSpeaking = false;
    this.lastSpeakingEndTime = Date.now();
    this.stopListening();
    this.callbacks.onStatusChange('idle');
  }

  public stopAudioPlayback(): void {
    AudioPlaybackManager.stopAll();
    this.stopStopCommandListener();
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    this.isSpeaking = false;
    this.lastSpeakingEndTime = Date.now();
  }

  private setupAudioAnalyser(stream: MediaStream): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      this.audioContext = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      this.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const step = Math.floor(dataArray.length / 20) || 1;

        for (let i = 0; i < 20; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          bars.push(Math.max(0.08, Math.min(1.0, val / 255)));
        }

        this.callbacks.onFrequencyUpdate(bars);

        this.animFrameId = requestAnimationFrame(update);
      };

      update();
    } catch (e) {
      console.warn('[VoicePipeline AudioAnalyser Error]:', e);
    }
  }

  public destroy(): void {
    this.stopAudioPlayback();
    this.stopListening();
    this.stopStopCommandListener();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
