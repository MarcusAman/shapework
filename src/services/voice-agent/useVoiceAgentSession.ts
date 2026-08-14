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

    // Idempotency Check — Suppress Duplicate Turns
    if (processedUtteranceIdsRef.current.has(targetUttId)) {
      VoiceDiagnostics.log('duplicate_turn_suppressed', targetUttId, utterance);
      return;
    }
    processedUtteranceIdsRef.current.add(targetUttId);

    VoiceDiagnostics.log('turn_dispatch_started', targetUttId, `${source}: ${utterance}`);

    const cleanUtterance = utterance
      .replace(/^(hey|hi)\s+nest,?\s*/i, '')
      .replace(/^(hey|hi)\s+nora,?\s*/i, '')
      .replace(/^ask\s+nora,?\s*/i, '')
      .replace(/^(hey|hi)\s+lorena,?\s*/i, '')
      .trim() || utterance;
    let result = processUserUtterance(utterance, stateRef.current, userName, targetUttId);

    // 1. Pure Wake Word Handler ("Hey Nest", "Hey NORA")
    if (isWakeOnly || result.intentType === 'WAKE_WORD_ONLY') {
      VoiceDiagnostics.log('voice_session_activated', targetUttId, 'Pure Wake Phrase');
      AudioPlaybackManager.playWakeChime();

      dispatch({ type: 'SET_STATUS', payload: 'listening' });
      return;
    }

    // 2. Standard User Turn Dispatch
    dispatch({ type: 'ADD_TRANSCRIPT', payload: { sender: 'user', text: cleanUtterance } });
    dispatch({ type: 'SET_STATUS', payload: 'thinking' });

    let spokenText = result.spokenResponse;
    let displayText = result.displayResponse;

    // Call unified context query backend endpoint with multi-turn session memory
    try {
      const apiRes = await fetch('/api/voice-agent/context-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: cleanUtterance,
          sessionId: 'session-voice-agent',
          source,
          conversationHistory: stateRef.current.transcriptHistory,
          utteranceId: targetUttId,
          sessionMemory: sessionMemoryRef.current
        })
      });
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
      }
    } catch (e) {
      console.warn('[Unified Context Query Warning]:', e);
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
    speak,
    processUtterance,
    confirmProposal,
    rejectProposal,
    toggleMicMute,
    toggleSpeakerMute
  };
}
