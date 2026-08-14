/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * VoicePipeline — STT, Audio Analyser, Wake Detection, Utterance Lifecycle, Echo Suppression & STOP Command Interruption
 */

import { AudioPlaybackManager } from './audioPlaybackManager';
import { VoiceDiagnostics } from './voiceDiagnostics';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'follow_up' | 'interrupted' | 'error';

export interface TranscriptPayload {
  text: string;
  utteranceId: string;
  isFinal: boolean;
  isWakeOnly: boolean;
}

export interface VoicePipelineCallbacks {
  onStatusChange: (status: AgentState) => void;
  onWakeDetected?: (utteranceId: string) => void;
  onTranscriptReceived: (payload: TranscriptPayload) => void;
  onFrequencyUpdate: (bars: number[]) => void;
  onUserInterrupted?: () => void;
}

export class VoicePipeline {
  private callbacks: VoicePipelineCallbacks;
  private currentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: any = null;
  private recognition: any = null;
  private stopRecognition: any = null;
  private isSpeaking = false;
  private lastSpeakingEndTime = 0;
  private lastSpokenTexts: Set<string> = new Set();
  private currentUtteranceId: string | null = null;
  private hasPlayedWakeChimeForUtterance = false;

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

  public async startListening(): Promise<void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.callbacks.onStatusChange('error');
      return;
    }

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
        this.callbacks.onStatusChange('listening');
      };

      rec.onresult = (event: any) => {

        let liveText = '';
        let isFinal = false;

        const startIdx = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = startIdx; i < event.results.length; i++) {
          liveText += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }

        const trimmed = liveText.trim();
        if (!trimmed) return;

        const cleanWords = trimmed.split(/\s+/).filter(w => w.length > 0);
        if (cleanWords.length === 0) return;

        // Spoken Interruption (Barge-in): If user speaks while assistant is talking, yield immediately
        if (this.isSpeaking && cleanWords.length > 0) {
          this.stopSpeakingAudio();
          if (this.callbacks.onUserInterrupted) {
            this.callbacks.onUserInterrupted();
          }
        }

        const uttId = this.getUtteranceId();

        // Self-Echo Filter: Discard transcripts matching recently spoken assistant audio
        if (this.isSelfEcho(trimmed)) {
          VoiceDiagnostics.log('duplicate_turn_suppressed', uttId, `Self-Echo Filter: ${trimmed}`);
          return;
        }

        const lower = trimmed.toLowerCase();
        const wakePhrases = ['hey nest', 'hi nest', 'hey lorena', 'nest ops', 'nest'];
        const isWakePhrase = wakePhrases.includes(lower);
        const startsWithWakePhrase = wakePhrases.some(p => lower.startsWith(p));

        // Wake Phrase Earcon & State Activation
        if ((isWakePhrase || startsWithWakePhrase) && !this.hasPlayedWakeChimeForUtterance) {
          this.hasPlayedWakeChimeForUtterance = true;
          AudioPlaybackManager.playWakeChime();
          VoiceDiagnostics.log('wake_detected', uttId, trimmed);
          if (this.callbacks.onWakeDetected) {
            this.callbacks.onWakeDetected(uttId);
          }
        }

        // Instant trigger on wake phrase alone OR final speech transcript
        if (isFinal || isWakePhrase) {
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          this.callbacks.onTranscriptReceived({
            text: trimmed,
            utteranceId: uttId,
            isFinal: true,
            isWakeOnly: isWakePhrase
          });

          this.resetUtteranceId();
          if (isWakePhrase) {
            try { rec.stop(); } catch (e) {}
          }
        } else {
          // Smart Silence VAD Auto-Submit Timer for continuous speech
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.isSpeaking || (Date.now() - this.lastSpeakingEndTime < 1000)) return;
            const finalUttId = this.getUtteranceId();
            this.callbacks.onTranscriptReceived({
              text: trimmed,
              utteranceId: finalUttId,
              isFinal: true,
              isWakeOnly: false
            });
            this.resetUtteranceId();
            this.stopListening();
          }, 1200);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          this.callbacks.onStatusChange('idle');
          return;
        }
        this.callbacks.onStatusChange('error');
      };

      rec.onend = () => {
        this.callbacks.onStatusChange('idle');
      };

      this.recognition = rec;
      rec.start();
    } catch (e) {
      console.warn('[VoicePipeline Start Error]:', e);
      this.callbacks.onStatusChange('error');
    }
  }

  public stopListening(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try { 
        this.recognition.onresult = null;
        this.recognition.abort(); 
      } catch (e) {}
      this.recognition = null;
    }
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
          this.callbacks.onStatusChange('interrupted');
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
        this.callbacks.onStatusChange('idle');
        VoiceDiagnostics.log('listening_resumed', utteranceId);

        // Defer resuming main listening by 350ms to allow room audio reverberation to dissipate
        setTimeout(() => {
          if (!this.isSpeaking) {
            this.startListening();
          }
        }, 350);
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

        // Barge-in Interruption Detection: If user speaks loudly (> 600 sum) while Lorena is speaking
        if (sum > 600 && this.isSpeaking) {
          this.stopAudioPlayback();
          if (this.callbacks.onUserInterrupted) {
            this.callbacks.onUserInterrupted();
          }
          this.callbacks.onStatusChange('interrupted');
        }

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
