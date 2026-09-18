import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceSessionState, SopDocument, SopStep } from '../types/sopWorkflow';
import { resolveSopOpening } from '../utils/sopOpeningResolver';
import {
  detectBrowserEnvironment,
  enumerateAudioInputs,
  parseAudioError,
  BrowserEnvironmentInfo,
  AudioInputDevice,
  DetailedAudioError
} from '../utils/microphoneDiagnostics';
import { VoicePipeline, TranscriptPayload } from '../services/voice-agent/voicePipeline';
import { AudioPlaybackManager } from '../services/voice-agent/audioPlaybackManager';

export interface TranscriptMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface PipelineStageLog {
  stage: string;
  timestamp: string;
  details?: string;
}

export interface ExtendedVoiceDiagnostics {
  audioFormat: string;
  playbackMethod: string;
  duplicateCount: number;
  signedUrlStatus: number;
  agentIdUsed: string;
  voiceIdUsed: string;
  envInfo: BrowserEnvironmentInfo;
  audioInputs: AudioInputDevice[];
  selectedDeviceId?: string;
  lastSuccessfulStage: string;
  stageLogs: PipelineStageLog[];
  detailedError?: DetailedAudioError;
}

export interface UseSopVoiceSessionParams {
  sopDraft: SopDocument;
  workspaceId?: string;
  userContext?: {
    firstName?: string;
    fullName?: string;
    roleTitle?: string;
  };
  authUser?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
  onSopDraftUpdated: (updater: (prev: SopDocument) => SopDocument) => void;
}

const NORA_VOICE_ID = 'l006hw6wZaEYAv80cbzj';

interface PendingDraftConfirmation {
  field: 'title' | 'purpose' | 'trigger' | 'owner' | 'step' | 'decision';
  proposedValue: any;
  displayText: string;
}

export function useSopVoiceSession({
  sopDraft,
  workspaceId,
  userContext,
  authUser,
  onSopDraftUpdated
}: UseSopVoiceSessionParams) {
  const [voiceState, setVoiceState] = useState<VoiceSessionState>('idle');
  const [statusDetails, setStatusDetails] = useState<string>('Ready to start SOP authoring');
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [diagnostics, setDiagnostics] = useState<ExtendedVoiceDiagnostics>({
    audioFormat: 'ElevenLabs Streaming Audio (l006hw6wZaEYAv80cbzj)',
    playbackMethod: 'VoicePipeline ElevenLabs TTS',
    duplicateCount: 0,
    signedUrlStatus: 200,
    agentIdUsed: 'nora_ops_guide',
    voiceIdUsed: NORA_VOICE_ID,
    envInfo: detectBrowserEnvironment(),
    audioInputs: [],
    lastSuccessfulStage: 'Not started',
    stageLogs: []
  });

  const activeSessionIdRef = useRef<string | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);
  const sopDraftRef = useRef<SopDocument>(sopDraft);
  sopDraftRef.current = sopDraft;

  const pendingConfirmationRef = useRef<PendingDraftConfirmation | null>(null);

  const addStageLog = useCallback((stage: string, details?: string) => {
    const log: PipelineStageLog = {
      stage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details
    };
    setDiagnostics((prev) => ({
      ...prev,
      lastSuccessfulStage: stage,
      stageLogs: [...prev.stageLogs, log]
    }));
  }, []);

  // Enumerate audio input devices on mount
  useEffect(() => {
    enumerateAudioInputs().then((devices) => {
      setDiagnostics((prev) => ({ ...prev, audioInputs: devices }));
      if (devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    });
  }, []);

  // Speak via ElevenLabs NORA Voice or fallback
  const speakNora = useCallback((text: string, onComplete?: () => void) => {
    if (pipelineRef.current) {
      pipelineRef.current.speakText(text, undefined, NORA_VOICE_ID).then(() => {
        onComplete?.();
      }).catch(err => {
        console.warn('[useSopVoiceSession] Speech playback error:', err);
        onComplete?.();
      });
    } else {
      onComplete?.();
    }
  }, []);

  // End active audio session
  const endSession = useCallback(async () => {
    activeSessionIdRef.current = null;
    pendingConfirmationRef.current = null;
    if (pipelineRef.current) {
      try { pipelineRef.current.stopListening(); } catch (e) {}
      pipelineRef.current = null;
    }
    AudioPlaybackManager.stopAll();
    setVoiceState('ended');
    setStatusDetails('Session completed');
  }, []);

  // Toggle mic mute state
  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (pipelineRef.current) {
      if (nextMuted) {
        pipelineRef.current.stopListening();
      } else if (activeSessionIdRef.current) {
        pipelineRef.current.startListening();
      }
    }
  }, [isMuted]);

  // Core Dialog & Confirmation Machine
  const processUserUtterance = useCallback((userText: string) => {
    if (!activeSessionIdRef.current) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user speech to transcript
    setTranscriptMessages((prev) => [
      ...prev,
      {
        id: `msg_usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'user',
        text: userText,
        timestamp
      }
    ]);

    setVoiceState('thinking');
    setStatusDetails('NORA is listening & processing...');
    addStageLog(`6. User utterance received: "${userText}"`);

    const cleanLower = userText.toLowerCase().trim();
    const pending = pendingConfirmationRef.current;
    const currentDraft = sopDraftRef.current;

    // Check if user is confirming a pending draft field proposal
    const isAffirmative = /^(yes|yeah|yep|yup|sure|correct|that's right|looks good|sounds good|confirm|approved|ok|okay)\b/i.test(cleanLower);
    const isNegative = /^(no|nope|wrong|incorrect|cancel|nah|not right)\b/i.test(cleanLower);

    let noraResponse = '';

    const applyValueToDraft = (fieldType: string, proposedVal: any) => {
      onSopDraftUpdated((prev) => {
        if (fieldType === 'title') return { ...prev, title: proposedVal, updatedAt: new Date().toISOString() };
        if (fieldType === 'purpose') return { ...prev, purpose: proposedVal, updatedAt: new Date().toISOString() };
        if (fieldType === 'trigger') return { ...prev, trigger: proposedVal, updatedAt: new Date().toISOString() };
        if (fieldType === 'owner') return { ...prev, processOwner: proposedVal, updatedAt: new Date().toISOString() };
        if (fieldType === 'step') {
          return {
            ...prev,
            orderedSteps: [
              ...prev.orderedSteps,
              {
                id: `step_${Date.now()}`,
                stepNumber: prev.orderedSteps.length + 1,
                action: proposedVal,
                role: prev.processOwner || 'Operations Lead',
                systemUsed: 'Dotloop / Flex MLS'
              }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        if (fieldType === 'decision') {
          return {
            ...prev,
            decisions: [...prev.decisions, proposedVal],
            updatedAt: new Date().toISOString()
          };
        }
        return prev;
      });
    };

    if (pending && (isAffirmative || isNegative)) {
      if (isAffirmative) {
        // Apply confirmed value to draft
        applyValueToDraft(pending.field, pending.proposedValue);
        const displayVal = pending.displayText;
        pendingConfirmationRef.current = null;

        if (pending.field === 'title') {
          noraResponse = `Confirmed! Set title to "${displayVal}". Next, why do we do this process? What is its primary purpose?`;
        } else if (pending.field === 'purpose') {
          noraResponse = `Confirmed! Set purpose to "${displayVal}". Now, what event or document receipt triggers this process to start?`;
        } else if (pending.field === 'trigger') {
          noraResponse = `Confirmed! Trigger set to "${displayVal}". Now let's outline the step-by-step procedure. What is the first step?`;
        } else if (pending.field === 'step') {
          noraResponse = `Confirmed step: "${displayVal}". What is the next step in the procedure, or any key decision rules?`;
        } else {
          noraResponse = `Confirmed! Saved to your SOP draft. What else would you like to add, or say "Finished" to review?`;
        }
      } else {
        // User rejected proposed value
        pendingConfirmationRef.current = null;
        noraResponse = `Understood! I won't save that. What should we set for the ${pending.field}?`;
      }
    } else {
      // PARSE USER INPUT TO FORMULATE UNDERSTANDING & PROPOSE CONFIRMATION
      let extractedValue = '';
      let targetField: 'title' | 'purpose' | 'trigger' | 'owner' | 'step' | 'decision' = 'title';

      if (!currentDraft.title || cleanLower.includes('title') || cleanLower.includes('called') || cleanLower.includes('name')) {
        targetField = 'title';
        extractedValue = userText
          .replace(/^(the\s+)?(title\s+is|it's\s+called|call\s+it|name\s+of\s+this\s+process\s+is|this\s+process\s+is)\s*/i, '')
          .trim();
      } else if (!currentDraft.purpose || cleanLower.includes('purpose') || cleanLower.includes('why') || cleanLower.includes('to ensure')) {
        targetField = 'purpose';
        extractedValue = userText
          .replace(/.*?(purpose\s+is|why\s+we\s+do\s+this\s+is|the\s+goal\s+is\s+to|so\s+that|to\s+ensure)\s*/i, '')
          .trim();
      } else if (!currentDraft.trigger || cleanLower.includes('trigger') || cleanLower.includes('starts') || cleanLower.includes('upon')) {
        targetField = 'trigger';
        extractedValue = userText
          .replace(/.*?(trigger\s+is|starts\s+when|it\s+starts|upon)\s*/i, '')
          .trim();
      } else if (cleanLower.includes('step') || cleanLower.includes('first') || cleanLower.includes('then') || cleanLower.includes('next')) {
        targetField = 'step';
        extractedValue = userText
          .replace(/^(step\s+\d+:?|first,|then,|next,|finally,)\s*/i, '')
          .trim();
      } else if (cleanLower.includes('if') || cleanLower.includes('requires') || cleanLower.includes('exception')) {
        targetField = 'decision';
        extractedValue = userText.trim();
      } else {
        // Fallback default based on missing fields
        if (!currentDraft.title) targetField = 'title';
        else if (!currentDraft.purpose) targetField = 'purpose';
        else if (!currentDraft.trigger) targetField = 'trigger';
        else targetField = 'step';
        extractedValue = userText.trim();
      }

      if (extractedValue.length > 2) {
        extractedValue = extractedValue.charAt(0).toUpperCase() + extractedValue.slice(1);
      }

      pendingConfirmationRef.current = {
        field: targetField,
        proposedValue: extractedValue,
        displayText: extractedValue
      };

      noraResponse = `I understood your ${targetField} as: "${extractedValue}". Does this look correct to confirm and save to your SOP draft?`;
    }

    // Add assistant response to transcript and speak it
    setTranscriptMessages(prev => [
      ...prev,
      {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: noraResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setVoiceState('consultant_speaking');
    setStatusDetails('NORA is speaking (ElevenLabs Voice)...');
    speakNora(noraResponse, () => {
      if (!activeSessionIdRef.current) return;
      // Post-speech cooldown: Wait 1 full second after assistant speech finishes before listening
      setTimeout(() => {
        if (!activeSessionIdRef.current) return;
        setVoiceState('listening');
        setStatusDetails('NORA is Listening...');
        if (pipelineRef.current && !isMuted) {
          pipelineRef.current.startListening();
        }
      }, 1000);
    });
  }, [onSopDraftUpdated, speakNora, isMuted, addStageLog]);

  // Start Session (User Click Action)
  const startSession = useCallback(async () => {
    if (['requesting_permission', 'connecting', 'listening', 'consultant_speaking', 'thinking'].includes(voiceState)) {
      return;
    }

    const sessionId = crypto.randomUUID();
    activeSessionIdRef.current = sessionId;
    pendingConfirmationRef.current = null;

    setVoiceState('requesting_permission');
    setStatusDetails('Checking environment & requesting microphone permission...');

    setDiagnostics((prev) => ({ ...prev, stageLogs: [], detailedError: undefined }));
    addStageLog('1. Start button clicked');

    // 1. Microphone Preflight Check under user click gesture
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        addStageLog('2. Permission granted');
      }
    } catch (permErr: any) {
      console.warn('[Voice Session] Permission check warning:', permErr);
    }

    // 2. Play WebAudio Wake Chime Earcon
    AudioPlaybackManager.playWakeChime();
    addStageLog('3. Wake chime played');

    // 3. Formulate Opening Greeting
    const userFirstName = userContext?.firstName || authUser?.name || authUser?.fullName?.split(' ')[0] || 'Ryan';
    const userFullName = userContext?.fullName || authUser?.fullName || authUser?.name || 'Ryan Crecelius';
    const userRoleTitle = userContext?.roleTitle || authUser?.role || 'Operations Lead';

    const resolved = resolveSopOpening({
      first_name: userFirstName,
      full_name: userFullName,
      role_title: userRoleTitle,
      process_name: sopDraft.title || '',
      has_existing_draft: (sopDraft.title || '').length > 0,
      first_open_question: typeof sopDraft.openQuestions?.[0] === 'string' ? sopDraft.openQuestions[0] : (sopDraft.openQuestions?.[0] as any)?.question || '',
      next_incomplete_section: ''
    });

    const openingMessage = resolved.message || `Hi ${userFirstName}! I'm NORA, your SOP authoring guide. Let's build your operational SOP together. To start, what is the title or name of this process?`;

    // 4. Initialize VoicePipeline with ElevenLabs voice ID
    pipelineRef.current = new VoicePipeline({
      onStatusChange: (status) => {
        if (activeSessionIdRef.current !== sessionId) return;
        if (status === 'error') {
          setStatusDetails('Microphone issue. You can still type your updates below.');
        }
      },
      onTranscriptReceived: (payload: TranscriptPayload) => {
        if (activeSessionIdRef.current !== sessionId) return;
        if (payload.isFinal && payload.text.trim().length > 2) {
          processUserUtterance(payload.text.trim());
        }
      },
      onFrequencyUpdate: () => {}
    });

    // 5. Add opening message & speak response via ElevenLabs voice
    setTranscriptMessages([
      {
        id: `msg_ai_init_${Date.now()}`,
        sender: 'ai',
        text: openingMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setVoiceState('consultant_speaking');
    setStatusDetails('NORA is speaking (ElevenLabs Voice)...');
    addStageLog('4. Opening greeting started (ElevenLabs Voice)');

    speakNora(openingMessage, () => {
      if (activeSessionIdRef.current !== sessionId) return;
      // Post-speech cooldown: Wait 1 full second after opening greeting finishes before listening
      setTimeout(() => {
        if (activeSessionIdRef.current !== sessionId) return;
        setVoiceState('listening');
        setStatusDetails('NORA is Listening...');
        addStageLog('5. Listening for user speech');

        if (pipelineRef.current && !isMuted) {
          pipelineRef.current.startListening();
        }
      }, 1000);
    });
  }, [voiceState, userContext, authUser, sopDraft, addStageLog, speakNora, processUserUtterance, isMuted]);

  // Handle Typed Messages
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (voiceState === 'idle' || voiceState === 'ended' || voiceState === 'error') {
      activeSessionIdRef.current = crypto.randomUUID();
      setVoiceState('listening');
    }
    processUserUtterance(text.trim());
  }, [voiceState, processUserUtterance]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      activeSessionIdRef.current = null;
      if (pipelineRef.current) {
        try { pipelineRef.current.stopListening(); } catch (e) {}
      }
      AudioPlaybackManager.stopAll();
    };
  }, []);

  return {
    voiceState,
    statusDetails,
    isMuted,
    transcriptMessages,
    diagnostics,
    selectedDeviceId,
    setSelectedDeviceId,
    startSession,
    endSession,
    toggleMute,
    sendTextMessage
  };
}
