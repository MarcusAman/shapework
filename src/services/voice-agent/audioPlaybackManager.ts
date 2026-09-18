/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AudioPlaybackManager — Singleton Audio Concurrency Lock & Earcon / Cognitive Noise Manager
 * Aligns Ask Nest Ops Voice Assistant with Siri/Alexa audio operating standards.
 */

export type NoraNoiseKey = 
  | 'crickets' 
  | 'undertaker' 
  | 'heaven_harp' 
  | 'jackpot' 
  | 'keyboard_typing' 
  | 'kaching';

export interface NoraNoiseMetadata {
  key: NoraNoiseKey;
  label: string;
  url: string;
  defaultMaxSeconds: number;
}

export const NORA_NOISE_ASSETS: Record<NoraNoiseKey, NoraNoiseMetadata> = {
  crickets: {
    key: 'crickets',
    label: 'Crickets (Quiet / No Result)',
    url: '/assets/crickets.mp3',
    defaultMaxSeconds: 5
  },
  undertaker: {
    key: 'undertaker',
    label: 'Undertaker (Urgent / Escalation)',
    url: '/assets/Undertaker.mp3',
    defaultMaxSeconds: 5
  },
  heaven_harp: {
    key: 'heaven_harp',
    label: 'Heaven Harp (Compliance / BIC Approved)',
    url: '/assets/Heaven_Harp.mp3',
    defaultMaxSeconds: 5
  },
  jackpot: {
    key: 'jackpot',
    label: 'Jackpot (Win / Lead Match)',
    url: '/assets/Jackpot.mp3',
    defaultMaxSeconds: 4
  },
  keyboard_typing: {
    key: 'keyboard_typing',
    label: 'Keyboard Typing (Calculating / Reasoning)',
    url: '/assets/Keyboard_typing.mp3',
    defaultMaxSeconds: 4
  },
  kaching: {
    key: 'kaching',
    label: 'KaChing (Financials / Commission)',
    url: '/assets/KaChing.mp3',
    defaultMaxSeconds: 3
  }
};

export const NORA_ROTATING_NOISE_SEQUENCE: NoraNoiseKey[] = [
  'keyboard_typing',
  'kaching',
  'heaven_harp',
  'jackpot',
  'undertaker',
  'crickets'
];

let globalNoiseRotationIndex = 0;

/**
 * Rotates the sound effect every time a question is asked to Nora.
 * Sequentially cycles through: Keyboard Typing -> KaChing -> Heaven Harp -> Jackpot -> Undertaker -> Crickets.
 */
export function selectCognitiveNoiseForQuery(query?: string): NoraNoiseKey {
  const chosenNoise = NORA_ROTATING_NOISE_SEQUENCE[globalNoiseRotationIndex % NORA_ROTATING_NOISE_SEQUENCE.length];
  globalNoiseRotationIndex++;
  return chosenNoise;
}

export function getNextRotatingCognitiveNoise(): NoraNoiseKey {
  return selectCognitiveNoiseForQuery();
}

export function resetCognitiveNoiseRotation(index: number = 0): void {
  globalNoiseRotationIndex = index;
}

export function getCurrentNoiseRotationIndex(): number {
  return globalNoiseRotationIndex;
}

class AudioPlaybackManagerSingleton {
  private activeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private activeTimer: any = null;

  /**
   * Stop and destroy any currently playing audio stream or speech synthesis instance.
   * Completely prevents double/overlapping voices.
   */
  public stopAll(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

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
   * Play a cognitive noise effect (crickets, undertaker, heaven_harp, jackpot, keyboard_typing, kaching).
   * Runs for up to maxDurationSeconds (default 5s) or ends naturally if the sound is shorter,
   * after which Nora delivers the grounded results.
   */
  public async playCognitiveNoise(
    selectedSound?: NoraNoiseKey | string,
    maxDurationSeconds: number = 5
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    this.stopAll();

    const normalizedKey = (selectedSound || getNextRotatingCognitiveNoise()).toLowerCase().trim() as NoraNoiseKey;
    const meta = NORA_NOISE_ASSETS[normalizedKey] || NORA_NOISE_ASSETS.keyboard_typing;
    const soundUrl = meta.url;
    const maxSec = Math.min(5, Math.max(1, maxDurationSeconds || meta.defaultMaxSeconds || 5));

    return new Promise((resolve) => {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.7;
        this.activeAudio = audio;

        let isCompleted = false;

        const finalizePlayback = () => {
          if (isCompleted) return;
          isCompleted = true;
          if (this.activeTimer) {
            clearTimeout(this.activeTimer);
            this.activeTimer = null;
          }
          if (this.activeAudio === audio) {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) {}
            this.activeAudio = null;
          }
          resolve();
        };

        // Strict 5s maximum ceiling (or shorter if sound naturally finishes earlier)
        this.activeTimer = setTimeout(() => {
          try {
            if (audio && !audio.paused && audio.volume > 0.1) {
              audio.volume = Math.max(0, audio.volume - 0.3);
            }
          } catch (e) {}
          finalizePlayback();
        }, maxSec * 1000);

        audio.onended = () => finalizePlayback();
        audio.onerror = (e) => {
          console.warn('[AudioPlaybackManager] Noise audio playback error on URL:', soundUrl, e);
          finalizePlayback();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[AudioPlaybackManager] Noise play blocked/failed:', soundUrl, err);
            // Even if autoplay was blocked by browser policy, let timer complete smoothly
          });
        }
      } catch (e) {
        resolve();
      }
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
