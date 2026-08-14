/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AudioPlaybackManager — Singleton Audio Concurrency Lock & Earcon Chime Manager
 * Aligns Ask Nest Ops Voice Assistant with Siri/Alexa audio operating standards.
 */

class AudioPlaybackManagerSingleton {
  private activeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Stop and destroy any currently playing audio stream or speech synthesis instance.
   * Completely prevents double/overlapping voices.
   */
  public stopAll(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio.src = '';
      } catch (e) {}
      this.activeAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  /**
   * Play a single audio element while stopping all previous playback streams.
   */
  public async playAudio(audio: HTMLAudioElement): Promise<void> {
    this.stopAll();
    this.activeAudio = audio;

    return new Promise((resolve) => {
      audio.onended = () => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
        }
        resolve();
      };
      audio.onerror = () => {
        if (this.activeAudio === audio) {
          this.activeAudio = null;
        }
        resolve();
      };
      audio.play().catch(() => resolve());
    });
  }

  /**
   * Play WebAudio Siri/Alexa-style Wake Chime (Dual-tone Earcon: 440Hz -> 880Hz, 150ms).
   * Confirms to the user that "Hey Nest" wake word was recognized.
   */
  public playWakeChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // First Tone: 440Hz (A4) for 80ms
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Second Tone: 880Hz (A5) for 100ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.07);
      gain2.gain.setValueAtTime(0.15, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.17);
    } catch (e) {
      console.warn('[AudioPlaybackManager] Chime error:', e);
    }
  }
}

export const AudioPlaybackManager = new AudioPlaybackManagerSingleton();
