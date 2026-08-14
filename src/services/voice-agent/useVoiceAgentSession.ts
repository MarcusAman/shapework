/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useVoiceAgentSession — Sole Owner & Dispatcher of Voice Agent Turns
 */

import { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import { agentRuntimeReducer, initialRuntimeState, AgentState } from './agentRuntimeReducer';
import { VoicePipeline, TranscriptPayload } from './voicePipeline';
import { processUserUtterance } from './transcriptRouter';
import { AgentPersonaConfig, noraNestOpsConfig } from './agentPromptSpec';
import { VoiceDiagnostics } from './voiceDiagnostics';
import { AudioPlaybackManager } from './audioPlaybackManager';

export function useVoiceAgentSession(personaConfig: AgentPersonaConfig = noraNestOpsConfig, userName: string = 'Ryan') {
  const [state, dispatch] = useReducer(agentRuntimeReducer, {
    ...initialRuntimeState,
    agentName: personaConfig.name
  });

  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(20).fill(0.08));
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [latestActionCard, setLatestActionCard] = useState<{ title: string; target: string; details: string } | null>(null);
  const [activeMatchedItems, setActiveMatchedItems] = useState<any[]>([]);

  const pipelineRef = useRef<VoicePipeline | null>(null);
  const processedUtteranceIdsRef = useRef<Set<string>>(new Set());
  const sessionMemoryRef = useRef<Record<string, any>>({});
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const activeTurnIdRef = useRef<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const isSpeakerMutedRef = useRef(isSpeakerMuted);
  isSpeakerMutedRef.current = isSpeakerMuted;

  const processUtterance = useCallback(async (
    utterance: string, 
    utteranceId?: string, 
    isWakeOnly: boolean = false, 
    source: 'voice' | 'text' = 'voice',
    isFinal: boolean = true
  ) => {
    // Enforcement Guard: Partial transcripts are DISPLAY ONLY and must NEVER execute business routing.
    if (!isFinal) {
      return;
    }

    const targetUttId = utteranceId || ('utt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

    // Cancel any previous in-flight request for superseded turns
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      VoiceDiagnostics.log('backend_request_aborted', activeTurnIdRef.current || undefined, 'Superseded by new turn');
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    activeTurnIdRef.current = targetUttId;

    // Idempotency Check — Suppress Duplicate Turns
    if (processedUtteranceIdsRef.current.has(targetUttId)) {
      VoiceDiagnostics.log('duplicate_turn_suppressed', targetUttId, utterance);
      return;
    }
    processedUtteranceIdsRef.current.add(targetUttId);

    VoiceDiagnostics.log('turn_dispatch_started', targetUttId, `${source}: ${utterance}`);

    // Clear ephemeral interim text upon turn commit
    dispatch({ type: 'CLEAR_INTERIM_TRANSCRIPT' });

    const cleanUtterance = utterance
      .replace(/^(hey|hi)\s+nest,?\s*/i, '')
      .replace(/^(hey|hi)\s+nora,?\s*/i, '')
      .replace(/^ask\s+nora,?\s*/i, '')
      .trim() || utterance;
    let result = processUserUtterance(utterance, stateRef.current, userName, targetUttId);

    VoiceDiagnostics.log('intent_selected', targetUttId, `Intent: ${result.intentType} | Category: ${result.category}`);

    // 1. Pure Wake Word Handler ("Hey Nest", "Hey NORA")
    if (isWakeOnly || result.intentType === 'WAKE_WORD_ONLY') {
      VoiceDiagnostics.log('voice_session_activated', targetUttId, 'Pure Wake Phrase');
      AudioPlaybackManager.playWakeChime();

      dispatch({ type: 'SET_STATUS', payload: 'listening' });
      return;
    }

    // 2. Standard User Turn Dispatch — Commit single user turn bubble
    dispatch({ type: 'ADD_TRANSCRIPT', payload: { sender: 'user', text: cleanUtterance } });
    dispatch({ type: 'SET_STATUS', payload: 'thinking' });

    let spokenText = result.spokenResponse;
    let displayText = result.displayResponse;

    // Call unified context query backend endpoint with multi-turn session memory
    try {
      VoiceDiagnostics.log('backend_request_started', targetUttId, `POST /api/voice-agent/context-query: "${cleanUtterance}"`);
      const apiRes = await fetch('/api/voice-agent/context-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({ 
          message: cleanUtterance,
          sessionId: 'session-voice-agent',
          source,
          conversationHistory: stateRef.current.transcriptHistory,
          utteranceId: targetUttId,
          sessionMemory: sessionMemoryRef.current
        })
      });

      // Guard: Check if turn was superseded during fetch
      if (activeTurnIdRef.current !== targetUttId) {
        VoiceDiagnostics.log('response_suppressed', targetUttId, 'Turn was superseded during network roundtrip');
        return;
      }

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        VoiceDiagnostics.log('assistant_response_received', targetUttId, apiData.spokenResponse || apiData.spokenAnswer);

        if (apiData.updatedMemory) {
          sessionMemoryRef.current = apiData.updatedMemory;
        }

        if (apiData.spokenResponse || apiData.spokenAnswer) {
          spokenText = apiData.spokenResponse || apiData.spokenAnswer;
        }
        if (apiData.displayResponse) {
          displayText = apiData.displayResponse;
        } else {
          displayText = spokenText;
        }
        if (apiData.evidenceCard) {
          result.actionCard = apiData.evidenceCard;
        }
        if (apiData.matchedItems && Array.isArray(apiData.matchedItems)) {
          setActiveMatchedItems(apiData.matchedItems);
        }
        VoiceDiagnostics.log('response_accepted', targetUttId, displayText);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        VoiceDiagnostics.log('backend_request_aborted', targetUttId, 'Fetch aborted by AbortController');
        return;
      }
      console.warn('[Unified Context Query Warning]:', e);
    }

    // Secondary turn check after body parsing
    if (activeTurnIdRef.current !== targetUttId) {
      VoiceDiagnostics.log('response_suppressed', targetUttId, 'Turn superseded after parsing');
      return;
    }

    if (result.actionCard) {
      setLatestActionCard(result.actionCard);
    }

    if (result.proposal) {
      dispatch({ type: 'SET_PROPOSAL', payload: result.proposal });
    } else if (result.intentType === 'CONFIRM_PROPOSAL') {
      dispatch({ type: 'CONFIRM_PROPOSAL' });
    } else if (result.intentType === 'REJECT_PROPOSAL') {
      dispatch({ type: 'REJECT_PROPOSAL' });
    }

    dispatch({ type: 'ADD_TRANSCRIPT', payload: { sender: 'agent', text: displayText } });

    // Voice input automatically triggers ElevenLabs TTS playback
    if (source === 'voice' && pipelineRef.current && !isSpeakerMutedRef.current) {
      await pipelineRef.current.speakText(spokenText, targetUttId);
    } else {
      dispatch({ type: 'SET_STATUS', payload: 'idle' });
    }
  }, [userName]);

  useEffect(() => {
    const pipeline = new VoicePipeline({
      onStatusChange: (status: AgentState) => {
        dispatch({ type: 'SET_STATUS', payload: status });
      },
      onWakeDetected: (uttId: string) => {
        VoiceDiagnostics.log('wake_detected', uttId);
      },
      onInterimUpdate: (payload) => {
        dispatch({ type: 'SET_INTERIM_TRANSCRIPT', payload: payload.text });
      },
      onTranscriptReceived: (payload: TranscriptPayload) => {
        if (!payload.isFinal) return;
        VoiceDiagnostics.log('final_utterance_created', payload.utteranceId, payload.text);
        processUtterance(payload.text, payload.utteranceId, payload.isWakeOnly, 'voice', payload.isFinal);
      },
      onFrequencyUpdate: (bars: number[]) => {
        setFrequencyBars(bars);
      },
      onUserInterrupted: () => {
        dispatch({ type: 'SET_STATUS', payload: 'interrupted' });
      },
      onSpeechStarted: (uttId: string) => {
        // Immediate in-flight abort & audio halt upon user speech onset
        if (activeAbortControllerRef.current) {
          activeAbortControllerRef.current.abort();
          activeAbortControllerRef.current = null;
          VoiceDiagnostics.log('backend_request_aborted', activeTurnIdRef.current || undefined, 'Aborted immediately upon speech start');
        }
        activeTurnIdRef.current = null;
      }
    });

    pipelineRef.current = pipeline;

    return () => {
      pipeline.destroy();
    };
  }, [processUtterance]);

  const listen = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.startListening();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stopListening();
    }
  }, []);

  const cancel = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    activeTurnIdRef.current = null;
    dispatch({ type: 'CLEAR_INTERIM_TRANSCRIPT' });
    dispatch({ type: 'SET_STATUS', payload: 'cancelled' });
    if (pipelineRef.current) {
      pipelineRef.current.cancelCurrentTurn();
      pipelineRef.current.stopAudioPlayback();
    }
    setTimeout(() => {
      dispatch({ type: 'SET_STATUS', payload: 'idle' });
    }, 120);
  }, []);

  const commitImmediately = useCallback((reason: string = 'user_explicit_submit') => {
    if (pipelineRef.current) {
      pipelineRef.current.commitCurrentTurn(reason);
    }
  }, []);

  const speak = useCallback((text: string, uttId?: string) => {
    if (pipelineRef.current) {
      pipelineRef.current.speakText(text, uttId);
    }
  }, []);

  const confirmProposal = useCallback(() => {
    if (state.pendingProposal) {
      const msg = `Confirmed! Executed ${state.pendingProposal.summary}.`;
      dispatch({ type: 'CONFIRM_PROPOSAL' });
      dispatch({ type: 'ADD_TRANSCRIPT', payload: { sender: 'agent', text: msg } });
      speak(msg);
    }
  }, [state.pendingProposal, speak]);

  const rejectProposal = useCallback(() => {
    if (state.pendingProposal) {
      const msg = 'Cancelled proposal.';
      dispatch({ type: 'REJECT_PROPOSAL' });
      dispatch({ type: 'ADD_TRANSCRIPT', payload: { sender: 'agent', text: msg } });
      speak(msg);
    }
  }, [state.pendingProposal, speak]);

  const STORAGE_KEY = 'nest_ops_nora_history';

  // Hydrate history from localStorage on initial mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch({ type: 'LOAD_TRANSCRIPTS', payload: parsed });
          }
        }
      }
    } catch (e) {
      console.warn('[useVoiceAgentSession] Failed to load history from localStorage:', e);
    }
  }, []);

  // Synchronize history to localStorage whenever transcriptHistory updates
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (state.transcriptHistory.length > 0) {
          const toSave = state.transcriptHistory.slice(-50);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
      } catch (e) {
        console.warn('[useVoiceAgentSession] Failed to persist history:', e);
      }
    }
  }, [state.transcriptHistory]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_TRANSCRIPTS' });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }, []);

  const stopSpeaking = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stopAudioPlayback();
    }
    dispatch({ type: 'SET_STATUS', payload: 'idle' });
  }, []);

  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  const toggleSpeakerMute = useCallback(() => {
    setIsSpeakerMuted(prev => {
      const next = !prev;
      if (next && pipelineRef.current) {
        pipelineRef.current.stopAudioPlayback();
      }
      return next;
    });
  }, []);

  return {
    agentName: state.agentName,
    status: state.status,
    interimTranscript: state.interimTranscript,
    isListening: state.status === 'listening' || state.status === 'collecting' || state.status === 'finalizing',
    isSpeaking: state.status === 'speaking',
    transcriptHistory: state.transcriptHistory,
    pendingProposal: state.pendingProposal,
    latestActionCard,
    activeMatchedItems,
    setActiveMatchedItems,
    frequencyBars,
    isMicMuted,
    isSpeakerMuted,
    listen,
    stopListening,
    cancel,
    commitImmediately,
    speak,
    stopSpeaking,
    clearHistory,
    processUtterance,
    confirmProposal,
    rejectProposal,
    toggleMicMute,
    toggleSpeakerMute
  };
}
