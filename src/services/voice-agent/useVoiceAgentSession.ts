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
import { AudioPlaybackManager, selectCognitiveNoiseForQuery } from './audioPlaybackManager';
import { triggerConfettiBurst } from '../../utils/confetti';

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

    // 0. Deduplication Guard
    if (processedUtteranceIdsRef.current.has(targetUttId)) {
      VoiceDiagnostics.log('duplicate_ignored', targetUttId, 'Duplicate utteranceId');
      return;
    }
    processedUtteranceIdsRef.current.add(targetUttId);
    activeTurnIdRef.current = targetUttId;

    // Abort any prior in-flight query fetch to maintain strict turn ownership
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    const cleanUtterance = utterance.trim();
    if (!cleanUtterance) return;

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

    // 3. Cognitive Noise & Deliberation Pacing:
    // Only applied on the initial voice turn; subsequent turns load cleanly and instantly without sound loops.
    const userTurnCount = (stateRef.current.transcriptHistory.filter(m => m.sender === 'user').length);
    const isFirstUserTurn = userTurnCount <= 1;

    const chosenNoise = selectCognitiveNoiseForQuery(cleanUtterance);
    const noisePromise = (!isSpeakerMutedRef.current && isFirstUserTurn && source === 'voice') 
      ? AudioPlaybackManager.playCognitiveNoise(chosenNoise, 3)
      : Promise.resolve();

    // No artificial delay for subsequent turns or text chat; respond in real-time
    const deliberationPacingPromise = (isFirstUserTurn && source === 'voice')
      ? new Promise(resolve => setTimeout(resolve, 1000))
      : Promise.resolve();

    let spokenText = result.spokenResponse;
    let displayText = result.displayResponse;
    let apiData: any = null;

    // 5. Query Unified Grounding Engine in Parallel
    const fetchPromise = (async () => {
      try {
        VoiceDiagnostics.log('backend_request_started', targetUttId, `POST /api/voice-agent/context-query: "${cleanUtterance}"`);
        const sessionToken = typeof window !== 'undefined' ? (localStorage.getItem('shapework_session_token') || localStorage.getItem('token') || '') : '';
        const apiRes = await fetch('/api/voice-agent/context-query', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-workspace-id': 'nest-realty-demo',
            'x-user-role': 'regional_leader',
            'x-user-email': 'ryan@nestrealty.com',
            ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : { 'Authorization': `Bearer ryan@nestrealty.com` })
          },
          credentials: 'include',
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
          apiData = await apiRes.json();
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
          } else if (result.matchedItems && Array.isArray(result.matchedItems)) {
            setActiveMatchedItems(result.matchedItems);
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
    })();

    // Await backend data, sound playback (up to 5s), AND minimum deliberation pacing (3.3s)
    await Promise.all([fetchPromise, noisePromise, deliberationPacingPromise]);

    // Secondary turn check after body parsing and sound playback
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

    const turnMatchedItems = (apiData && Array.isArray(apiData.matchedItems) && apiData.matchedItems.length > 0)
      ? apiData.matchedItems
      : (result.matchedItems || []);

    // 5. Deliver Nora's Grounded Results & Trigger Confetti Pop
    dispatch({ 
      type: 'ADD_TRANSCRIPT', 
      payload: { 
        sender: 'agent', 
        text: displayText,
        matchedItems: turnMatchedItems,
        relatedSop: apiData?.relatedSop || null,
        reasoningSteps: apiData?.reasoningSteps || (result as any)?.reasoningSteps || undefined,
        thoughtDurationMs: apiData?.thoughtDurationMs || 1050,
        actions: apiData?.suggestedActions || apiData?.actions || undefined,
        intentType: apiData?.status || result.intentType,
        meetingWizard: apiData?.meetingWizard || result.meetingWizard || undefined
      } 
    });

    // Joyful confetti pop on first initial turn only
    if (isFirstUserTurn) {
      triggerConfettiBurst();
    }

    // Voice input automatically triggers ElevenLabs TTS playback
    if (source === 'voice' && pipelineRef.current && !isSpeakerMutedRef.current) {
      await pipelineRef.current.speakText(spokenText, targetUttId);
    } else {
      if (pipelineRef.current) {
        pipelineRef.current.stopListening();
      }
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

  const setMediaStream = useCallback((stream: MediaStream) => {
    if (pipelineRef.current) {
      pipelineRef.current.setMediaStream(stream);
    }
  }, []);

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
  // Start with clean transcript history on initial mount unless explicitly requested
  useEffect(() => {
    // Fresh session on mount
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
    toggleSpeakerMute,
    setMediaStream
  };
}
