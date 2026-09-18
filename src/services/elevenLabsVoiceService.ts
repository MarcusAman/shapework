/**
 * AI Real Estate Operations Consultant Voice Client Service
 * Connects to Conversational AI Voice Agent via WebSocket.
 * Streams microphone PCM audio and plays back AI voice responses
 * while emitting real-time transcript events to the React UI.
 */

export interface VoiceCallbacks {
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error', details?: string) => void;
  onUserTranscript?: (transcript: string, isFinal: boolean) => void;
  onAgentResponse?: (text: string, isFinal: boolean) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: string) => void;
}

export class ElevenLabsVoiceService {
  private socket: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private callbacks: VoiceCallbacks = {};
  private isConnected = false;
  private isMuted = false;
  private agentId: string;
  private voiceId: string;
  private audioQueue: HTMLAudioElement[] = [];

  constructor(
    agentId = (import.meta as any).env?.VITE_ELEVENLABS_AGENT_ID || 'agent_3901kyk7pf3he52v8v9fp3m3bhd8',
    voiceId = (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID || 'l006hw6wZaEYAv80cbzj'
  ) {
    this.agentId = agentId;
    this.voiceId = voiceId;
  }

  public async connect(callbacks: VoiceCallbacks = {}): Promise<void> {
    this.callbacks = callbacks;
    this.callbacks.onStatusChange?.('connecting', 'Connecting to AI Operations Consultant Voice Line...');

    let wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;

    try {
      const res = await fetch('/api/elevenlabs/signed-url');
      if (res.ok) {
        const data = await res.json();
        if (data.signedUrl) {
          wsUrl = data.signedUrl;
        }
      }
    } catch (e) {
      console.warn('[Voice Service] Connecting directly via Agent ID');
    }

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = async () => {
        this.isConnected = true;
        this.callbacks.onStatusChange?.('connected', 'Connected to AI Operations Consultant');
        await this.startMicrophoneStream();
      };

      this.socket.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.socket.onerror = (err) => {
        console.error('[Voice Service] Connection error:', err);
        this.callbacks.onError?.('Voice connection error');
        this.callbacks.onStatusChange?.('error', 'Voice connection error');
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.callbacks.onStatusChange?.('disconnected', 'Session closed');
        this.cleanupAudio();
      };
    } catch (err: any) {
      console.error('[Voice Service] Failed to establish voice connection:', err);
      this.callbacks.onError?.(err.message || 'Failed to start voice call');
      this.callbacks.onStatusChange?.('error', err.message);
    }
  }

  private async startMicrophoneStream(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      
      // Ensure AudioContext is active for playback
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 4096 buffer size, 1 channel in, 1 channel out
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isConnected || this.isMuted || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio level for UI visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.callbacks.onAudioLevel?.(Math.min(100, Math.round(rms * 250)));

        // Convert Float32Array to 16-bit PCM base64
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

        this.socket.send(
          JSON.stringify({
            user_audio_chunk: base64Audio
          })
        );
      };
    } catch (err: any) {
      console.error('[Voice Service] Microphone access error:', err);
      this.callbacks.onError?.('Microphone access denied or unreadable');
    }
  }

  private handleServerMessage(dataStr: string): void {
    try {
      const data = JSON.parse(dataStr);

      // Handle audio response from Voice AI Agent
      if (data.audio_event?.audio_base_64 || data.audio) {
        const audioB64 = data.audio_event?.audio_base_64 || data.audio;
        this.playAudioChunk(audioB64);
      }

      // Handle user speech transcription
      if (data.user_transcription_event?.user_transcript || data.user_transcript) {
        const text = data.user_transcription_event?.user_transcript || data.user_transcript;
        const isFinal = !!(data.user_transcription_event?.is_final ?? true);
        if (text) {
          this.callbacks.onUserTranscript?.(text, isFinal);
        }
      }

      // Handle AI Agent speech response transcription
      if (data.agent_response_event?.agent_response || data.agent_response || data.text) {
        const text = data.agent_response_event?.agent_response || data.agent_response || data.text;
        const isFinal = !!(data.agent_response_event?.is_final ?? true);
        if (text) {
          this.callbacks.onAgentResponse?.(text, isFinal);
        }
      }
    } catch (e) {
      // Audio chunk or string message
    }
  }

  private playAudioChunk(base64Audio: string): void {
    if (!base64Audio) return;
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // 1. Try playing Data URL directly via HTML5 Audio element
      const dataUrl = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(dataUrl);
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If HTML5 Data URL format fails, decode via Web Audio API
          this.playPcmBuffer(base64Audio);
        });
      }
    } catch (err) {
      console.warn('[Voice Service] Audio chunk playback error:', err);
      this.playPcmBuffer(base64Audio);
    }
  }

  private playPcmBuffer(base64Audio: string): void {
    try {
      const audioBytes = this.base64ToArrayBuffer(base64Audio);
      if (!this.audioContext) return;

      this.audioContext.decodeAudioData(
        audioBytes,
        (buffer) => {
          const source = this.audioContext!.createBufferSource();
          source.buffer = buffer;
          source.connect(this.audioContext!.destination);
          source.start(0);
        },
        () => {
          // Raw 16-bit PCM fallback decoding
          try {
            const pcm16 = new Int16Array(audioBytes);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
              float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
            }
            const audioBuffer = this.audioContext!.createBuffer(1, float32.length, 16000);
            audioBuffer.getChannelData(0).set(float32);
            const source = this.audioContext!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext!.destination);
            source.start(0);
          } catch (e) {}
        }
      );
    } catch (e) {}
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.cleanupAudio();
    this.isConnected = false;
    this.callbacks.onStatusChange?.('disconnected', 'Voice session ended');
  }

  private cleanupAudio(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const elevenLabsVoiceService = new ElevenLabsVoiceService();
