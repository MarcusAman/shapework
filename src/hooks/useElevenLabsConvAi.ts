import { useState, useEffect, useRef, useCallback } from 'react';

export type ConvAiStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'error';

export interface ConvAiTranscriptItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface UseElevenLabsConvAiReturn {
  status: ConvAiStatus;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  frequencyData: number[];
  transcriptHistory: ConvAiTranscriptItem[];
  latestActionCard: {
    title: string;
    target: string;
    details: string;
  } | null;
  startSession: () => Promise<void>;
  stopSession: () => void;
  toggleMicMute: () => void;
  toggleSpeakerMute: () => void;
  sendTextMessage: (text: string) => Promise<void>;
}

export function useElevenLabsConvAi(): UseElevenLabsConvAiReturn {
  const [status, setStatus] = useState<ConvAiStatus>('idle');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(20).fill(0.05));
  const [transcriptHistory, setTranscriptHistory] = useState<ConvAiTranscriptItem[]>([]);
  const [latestActionCard, setLatestActionCard] = useState<{ title: string; target: string; details: string } | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  }, []);

  const startAnalyser = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateFrequency = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const step = Math.floor(dataArray.length / 20) || 1;

        for (let i = 0; i < 20; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          const normalized = Math.max(0.08, Math.min(1.0, val / 255));
          bars.push(normalized);
        }

        setFrequencyData(bars);

        // Barge-in Interruption Detection: If user speaks loudly (> 600 sum) while NORA is speaking
        if (sum > 600 && isSpeakingRef.current) {
          console.log('[ConvAI Barge-In] User interrupted NORA speaking!');
          stopAudioPlayback();
          setStatus('interrupted');
          setTimeout(() => {
            setStatus('listening');
          }, 400);
        }

        animFrameRef.current = requestAnimationFrame(updateFrequency);
      };

      updateFrequency();
    } catch (e) {
      console.warn('[ConvAI WebAudio Analyser Error]:', e);
    }
  }, [stopAudioPlayback]);

  const speakNoraText = useCallback(async (text: string) => {
    if (isSpeakerMuted) return;
    stopAudioPlayback();
    isSpeakingRef.current = true;
    setStatus('speaking');

    try {
      const ttsRes = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: 'l006hw6wZaEYAv80cbzj' })
      });

      if (ttsRes.ok) {
        const audioBlob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          isSpeakingRef.current = false;
          currentAudioRef.current = null;
          setStatus('listening');
        };

        audio.onerror = () => {
          isSpeakingRef.current = false;
          currentAudioRef.current = null;
          setStatus('listening');
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('[ConvAI Audio Playback Error]:', e);
    }

    isSpeakingRef.current = false;
    setStatus('listening');
  }, [isSpeakerMuted, stopAudioPlayback]);

  const processUserQuery = useCallback(async (promptText: string) => {
    const cleanPrompt = promptText.replace(/^(hey|hi)\s+nest,?\s*/i, '').trim() || promptText;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTranscriptHistory(prev => [
      ...prev,
      { id: 'usr-' + Date.now(), sender: 'user', text: cleanPrompt, timestamp: timeStr }
    ]);

    setStatus('thinking');

    try {
      let toolName = 'general_query';
      const lower = cleanPrompt.toLowerCase();
      if (lower.includes('offer') || lower.includes('contract') || lower.includes('write')) {
        toolName = 'write_offer';
      } else if (lower.includes('attention') || lower.includes('today')) {
        toolName = 'check_attention_items';
      } else if (lower.includes('pipeline') || lower.includes('stuck')) {
        toolName = 'query_pipeline';
      }

      const toolRes = await fetch('/api/elevenlabs/agent-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, promptText: cleanPrompt })
      });

      const toolData = await toolRes.json();
      const ansText = toolData.resultText || `Analyzed brokerage operations for "${cleanPrompt}".`;

      if (toolData.actionPayload) {
        setLatestActionCard(toolData.actionPayload);
      }

      setTranscriptHistory(prev => [
        ...prev,
        { id: 'ast-' + Date.now(), sender: 'assistant', text: ansText, timestamp: timeStr }
      ]);

      await speakNoraText(ansText);
    } catch (e) {
      console.warn('[ConvAI Response Error]:', e);
      const fallbackAns = "I've logged your request into the Nest Realty operations queue.";
      setTranscriptHistory(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: fallbackAns,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      await speakNoraText(fallbackAns);
    }
  }, [speakNoraText]);

  const startSession = useCallback(async () => {
    setStatus('connecting');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
        startAnalyser(stream);
      }
      setStatus('listening');
    } catch (err) {
      console.error('[ConvAI Start Session Mic Access Error]:', err);
      setStatus('error');
    }
  }, [startAnalyser]);

  const stopSession = useCallback(() => {
    stopAudioPlayback();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setStatus('idle');
  }, [stopAudioPlayback]);

  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(t => {
          t.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const toggleSpeakerMute = useCallback(() => {
    setIsSpeakerMuted(prev => {
      const next = !prev;
      if (next) {
        stopAudioPlayback();
      }
      return next;
    });
  }, [stopAudioPlayback]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    status,
    isMicMuted,
    isSpeakerMuted,
    frequencyData,
    transcriptHistory,
    latestActionCard,
    startSession,
    stopSession,
    toggleMicMute,
    toggleSpeakerMute,
    sendTextMessage: processUserQuery
  };
}
