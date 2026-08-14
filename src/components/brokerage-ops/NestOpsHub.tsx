import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Inbox, HelpCircle, Plus, FileText, ArrowRight, UserCheck, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, User, 
  MapPin, Shield, Activity, ListTodo, Check, X, Mail, Phone, Lock, MessageSquare,
  Volume2, VolumeX, Mic, Sparkles, ExternalLink
} from 'lucide-react';
import MorningBriefing from '../command/MorningBriefing';
import ConnectorLogo from '../ui/ConnectorLogo';
import LocationSelectorDropdown, { getStoredLocation, BrokerageLocation } from '../ui/LocationSelectorDropdown';
import { useToast } from '../ui';
import { ContractCopilotCard } from './ContractCopilotCard';
import { CompactContractSummary } from './CompactContractSummary';
import { DemoControlDropdown } from './DemoControlDropdown';
import { PendingIntakesList } from './PendingIntakesList';
import { parseContractPrompt } from '../../utils/contractPromptParser';
import { ContractIntakeSession } from '../../../server/contracts/contractDomainTypes';
import { useElevenLabsConvAi } from '../../hooks/useElevenLabsConvAi';
import { FloatingVoiceCallBar } from './FloatingVoiceCallBar';
import { useVoiceAgentSession } from '../../services/voice-agent/useVoiceAgentSession';
import { AgentHudCard } from '../../services/voice-agent/AgentHudCard';
import { AudioPlaybackManager } from '../../services/voice-agent/audioPlaybackManager';
import { StaffSopStudioModal } from './StaffSopStudioModal';
import { SopDocument } from '../../types/sopWorkflow';

interface NestOpsHubProps {
  state: any;
  mode?: 'full' | 'search_only' | 'activity_only';
  orbVideoSrc?: string;
}

export default function NestOpsHub({ state, mode = 'full', orbVideoSrc = '/nest_ops_orb.mp4' }: NestOpsHubProps) {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<BrokerageLocation>(getStoredLocation);
  const [activeContractSession, setActiveContractSession] = useState<ContractIntakeSession | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [pendingIntakeCount, setPendingIntakeCount] = useState(0);

  useEffect(() => {
    const handleLoc = (e: any) => {
      setCurrentLocation(getStoredLocation());
    };
    window.addEventListener('shapework_location_changed', handleLoc);
    return () => window.removeEventListener('shapework_location_changed', handleLoc);
  }, []);
  const {
    jobs = [],
    steps = [],
    opsAssets = [],
    cameraOffline = false,
    opsCameraEvents = [],
    opsLogs = []
  } = state;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');

  // Integration statuses & Voice Speech recognition state
  const [googleConn, setGoogleConn] = useState<any>({ connected: false });
  const [microsoftConn, setMicrosoftConn] = useState<any>({ connected: false });
  const [slackConn, setSlackConn] = useState<any>({ connected: false });
  const [rechatConn, setRechatConn] = useState<any>({ connected: false });
  const [dotloopConn, setDotloopConn] = useState<any>({ connected: false });
  const [showConnectorPicker, setShowConnectorPicker] = useState(false);
  const [activeAppDetail, setActiveAppDetail] = useState<string | null>(null);

  // Sandy's 6-Layer Modular Voice Agent Framework Session
  const voiceAgent = useVoiceAgentSession(undefined, state?.user?.name || 'Ryan');

  // Microphone & Speaker Audio state
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'listening' | 'processing' | 'error'>('idle');
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<'assistant' | 'activity'>('assistant');
  
  // Slide-out Voice Session Transcript Drawer State
  const [showVoiceDrawer, setShowVoiceDrawer] = useState<boolean>(false);
  const [voiceHistory, setVoiceHistory] = useState<Array<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
  }>>([]);

  // Staff SOP Studio Modal State
  const [selectedSopForStudio, setSelectedSopForStudio] = useState<SopDocument | null>(null);
  const [showSopStudioModal, setShowSopStudioModal] = useState<boolean>(false);

  const handleOpenSopStudio = async (sopId?: string) => {
    try {
      const res = await fetch('/api/sops/drafts');
      if (res.ok) {
        const data = await res.json();
        const drafts: SopDocument[] = data.drafts || [];
        const found = sopId ? drafts.find(s => s.id === sopId) : drafts[0];
        if (found) {
          setSelectedSopForStudio(found);
          setShowSopStudioModal(true);
        }
      }
    } catch (e) {
      console.warn('[SOP Studio Open Error]:', e);
    }
  };

  const handleSaveSopDraft = async (updatedSop: SopDocument) => {
    try {
      await fetch(`/api/sops/drafts/${updatedSop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSop)
      });
      setSelectedSopForStudio(updatedSop);
      toast.success({ title: 'SOP Draft Saved', description: `${updatedSop.title} updated in workspace repository.` });
    } catch (e) {
      console.error(e);
      toast.error({ title: 'Save Failed', description: 'Could not save SOP changes.' });
    }
  };

  const handlePublishSop = async (publishedSop: SopDocument) => {
    try {
      await fetch(`/api/sops/${publishedSop.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publisher: 'Matt Orr — Broker-in-Charge (#281940)' })
      });
      setSelectedSopForStudio(publishedSop);
      toast.success({ title: 'SOP Approved & Published', description: `${publishedSop.title} v${publishedSop.version} is now live operational policy.` });
    } catch (e) {
      console.error(e);
      toast.error({ title: 'Publish Failed', description: 'Could not publish SOP.' });
    }
  };

  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const activeMediaStreamRef = React.useRef<MediaStream | null>(null);
  const hasSpokenAudioRef = React.useRef<boolean>(false);
  const audioAnalyserIntervalRef = React.useRef<any>(null);
  const isContinuousVoiceModeRef = React.useRef<boolean>(false);
  const userStoppedVoiceRef = React.useRef<boolean>(false);
  const silenceTimerRef = React.useRef<any>(null);

  const onSpeechPlaybackFinished = () => {
    setIsSpeaking(false);
    currentAudioRef.current = null;

    if (isContinuousVoiceModeRef.current && !userStoppedVoiceRef.current) {
      setTimeout(() => {
        startVoiceInput();
      }, 600);
    }
  };

  const stopAssistantSpeaking = useCallback(() => {
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
    setIsSpeaking(false);
  }, []);

  // Global Escape key listener to instantly halt assistant speech playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSpeaking) {
        stopAssistantSpeaking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking, stopAssistantSpeaking]);

  const speakAssistantResponse = async (text: string) => {
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;

    // Strict Half-Duplex: Stop speech recognition immediately before playing audio to prevent self-echo
    stopVoiceInput(true);
    stopAssistantSpeaking();

    setIsSpeaking(true);

    try {
      const ttsRes = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceId: 'l006hw6wZaEYAv80cbzj' })
      });

      if (ttsRes.ok) {
        const audioBlob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          onSpeechPlaybackFinished();
        };
        audio.onerror = () => {
          console.warn('[ElevenLabs Audio Playback Warning]');
          onSpeechPlaybackFinished();
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('[ElevenLabs TTS Fetch Error]:', err);
    }

    fallbackWebSpeech(cleanText);
  };

  const fallbackWebSpeech = (cleanText: string) => {
    if (!('speechSynthesis' in window)) {
      onSpeechPlaybackFinished();
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => onSpeechPlaybackFinished();
      utterance.onerror = () => onSpeechPlaybackFinished();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      onSpeechPlaybackFinished();
    }
  };
  const [activeQuery, setActiveQuery] = useState<{
    prompt: string;
    answer: string;
    actionTitle?: string;
    actionTarget?: string;
    actionDetails?: string;
    executed?: boolean;
  } | null>(null);

  const executeContractPrompt = async (promptText: string) => {
    setChatPrompt(promptText);
    const text = promptText.toLowerCase();

    const isContractIntent = text.includes('contract') || text.includes('offer') || text.includes('write') || 
                             text.includes('draft') || text.includes('due diligence') || text.includes('earnest') || 
                             text.includes('buyer') || text.includes('close') || text.includes('closing') || 
                             text.includes('625') || text.includes('725');

    if (isContractIntent) {
      const parsed = parseContractPrompt(promptText);
      const wsId = currentLocation.id || 'nest-realty-wilmington';

      try {
        let currentSess = activeContractSession;
        if (!currentSess) {
          const createRes = await fetch('/api/contracts/intake-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: wsId,
              channel: 'dashboard',
              transactionType: 'residential_resale_buyer_offer',
              property: parsed.property?.streetAddress ? parsed.property : { streetAddress: '123 Main Street', city: 'Wilmington', state: 'NC' },
              parties: parsed.parties.length > 0 ? parsed.parties : [{ id: 'p1', role: 'buyer', fullName: 'Marcus Aman' }, { id: 'p2', role: 'buyer', fullName: 'Elynor Aman' }],
              initialTerms: parsed.terms,
              actorCapability: 'contract_authoring'
            })
          });
          const createData = await createRes.json();
          if (createData.success && createData.session) {
            currentSess = createData.session;
          }
        } else {
          const updateRes = await fetch(`/api/contracts/intake-sessions/${currentSess.id}/terms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: wsId,
              terms: parsed.terms,
              sources: [],
              actorCapability: 'contract_authoring'
            })
          });
          const updateData = await updateRes.json();
          if (updateData.success && updateData.session) {
            currentSess = updateData.session;
          }
        }

        if (currentSess) {
          setActiveContractSession(currentSess);
          const propName = currentSess.property?.streetAddress || '123 Main Street';
          const ans = `Absolutely — I've updated the offer for ${propName}. ${parsed.capturedSummaryText} ${parsed.missingQuestion}`;
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setVoiceHistory(prev => [
            ...prev,
            { id: 'usr-' + Date.now(), sender: 'user', text: promptText, timestamp: timeStr },
            { id: 'ast-' + Date.now(), sender: 'assistant', text: ans, timestamp: timeStr }
          ]);
          setShowVoiceDrawer(true);
          setActiveQuery({ prompt: promptText, answer: ans, executed: true });
          speakAssistantResponse(ans);
          return;
        }
      } catch (err) {
        console.warn('[NestOpsHub] Contract prompt handler error:', err);
      }

      const ansFallback = `Absolutely — I've started the offer. ${parsed.capturedSummaryText} ${parsed.missingQuestion}`;
      setShowVoiceDrawer(true);
      setActiveQuery({ prompt: promptText, answer: ansFallback, executed: true });
      speakAssistantResponse(ansFallback);
    }
  };

  const submittedTranscriptIdsRef = useRef<Set<string>>(new Set());

  interface AskPromptInput {
    text: string;
    source: 'text' | 'voice';
    transcriptId?: string;
  }

  const submitAskNestOpsTurn = async ({ text, source, transcriptId }: AskPromptInput) => {
    const rawText = text.trim();
    if (!rawText) return;

    if (transcriptId && submittedTranscriptIdsRef.current.has(transcriptId)) {
      return;
    }
    if (transcriptId) {
      submittedTranscriptIdsRef.current.add(transcriptId);
    }

    setChatPrompt('');
    voiceAgent.processUtterance(rawText, transcriptId, false, source);
  };

  const handleAskPrompt = (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string' && typeof (e as any).preventDefault === 'function') {
      (e as any).preventDefault();
    }

    const inputText = typeof e === 'string' ? e : chatPrompt;
    submitAskNestOpsTurn({
      text: inputText,
      source: typeof e === 'string' ? 'voice' : 'text'
    });
  };

  const handleExecuteItemAction = (item: any) => {
    if (item.actionType === 'open_sop') {
      handleOpenSopInStudio(item.actionPayload?.sopId);
    } else if (item.actionType === 'contact_person') {
      if (item.actionPayload?.email) {
        window.location.href = `mailto:${item.actionPayload.email}`;
      }
      toast.info({
        title: `Contact: ${item.actionPayload?.name || item.title}`,
        description: `Phone: ${item.actionPayload?.phone || 'On file'} • Email: ${item.actionPayload?.email || 'On file'}`
      });
    } else if (item.actionType === 'draft_offer') {
      state.setCurrentTab?.('Contracts');
      toast.info({
        title: 'NC Form 2-T Offer',
        description: `Opening contract workspace for ${item.title}.`
      });
    } else if (item.actionType === 'resolve_issue' || item.actionType === 'view_task') {
      toast.success({
        title: 'Action Dispatched',
        description: `${item.title}: Action dispatched to responsible team.`
      });
    }
  };

  const fetchConnectionStatuses = async () => {
    try {
      const gRes = await fetch('/api/integrations/google/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (gRes.ok) setGoogleConn(await gRes.json());
    } catch (e) {}

    try {
      const mRes = await fetch('/api/integrations/microsoft/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (mRes.ok) setMicrosoftConn(await mRes.json());
    } catch (e) {}

    try {
      const sRes = await fetch('/api/integrations/slack/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (sRes.ok) setSlackConn(await sRes.json());
    } catch (e) {}

    try {
      const rRes = await fetch('/api/integrations/rechat/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (rRes.ok) setRechatConn(await rRes.json());
    } catch (e) {}

    try {
      const dRes = await fetch('/api/integrations/apination/dotloop/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (dRes.ok) setDotloopConn(await dRes.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchConnectionStatuses();
  }, [state.workspaceId]);

  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(false);

  // Real-Time WebRTC ConvAI Evidence Card Synchronizer Hook
  useEffect(() => {
    const handleVoiceToolExecuted = (e: CustomEvent) => {
      if (e.detail && e.detail.data) {
        const newCard = e.detail.data;
        setLatestActionCard(prev => {
          if (prev && prev.title === newCard.title && prev.details === newCard.details) {
            return prev; // Idempotent suppression of duplicate action card renders
          }
          return newCard;
        });
      }
    };
    window.addEventListener('voice_tool_executed' as any, handleVoiceToolExecuted);
    return () => {
      window.removeEventListener('voice_tool_executed' as any, handleVoiceToolExecuted);
    };
  }, []);

  const startVoiceInput = async (options?: { openDrawer?: boolean }) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState('error');
      setMicErrorMsg('Voice input is not supported in this browser.');
      toast.warning({ title: 'Speech Input Unsupported', description: 'Your browser does not support Web Speech API. Try Chrome or Edge.' });
      setTimeout(() => {
        setMicState('idle');
        setMicErrorMsg(null);
      }, 4000);
      return;
    }

    // Stop assistant speech immediately if user starts talking
    stopAssistantSpeaking();

    setMicState('requesting');
    if (options?.openDrawer !== false) {
      setShowVoiceDrawer(true);
    }
    isContinuousVoiceModeRef.current = true;
    userStoppedVoiceRef.current = false;
    hasSpokenAudioRef.current = false;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        activeMediaStreamRef.current = stream;

        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          if (audioAnalyserIntervalRef.current) clearInterval(audioAnalyserIntervalRef.current);
          audioAnalyserIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            if (sum > 40) {
              hasSpokenAudioRef.current = true;
            }
          }, 100);
        } catch (e) {}
      }
    } catch (permErr: any) {
      console.warn('Microphone permission error:', permErr);
      setMicState('error');
      setMicErrorMsg('Microphone access denied. Please allow microphone permissions.');
      toast.error({ title: 'Microphone Permission Denied', description: 'Please allow microphone access in your browser settings.' });
      setTimeout(() => {
        setMicState('idle');
        setMicErrorMsg(null);
      }, 4000);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setMicState('listening');
      };

      rec.onresult = (event: any) => {
        hasSpokenAudioRef.current = true;
        let liveTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        if (liveTranscript) {
          const lower = liveTranscript.toLowerCase();
          // Check for wake word prefix
          if (
            lower.includes('hey nest') ||
            lower.includes('hi nest') ||
            lower.includes('hey lorena') ||
            lower.includes('hi lorena') ||
            lower.includes('nest ops')
          ) {
            setShowVoiceDrawer(true);
          }
          setChatPrompt(liveTranscript);

          // Silence VAD Auto-Submit: Auto-submit only after genuine speech and 1.2s pause
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (hasSpokenAudioRef.current && !userStoppedVoiceRef.current) {
              stopVoiceInput(false);
            }
          }, 1200);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          setMicState('idle');
          setMicErrorMsg(null);
          return;
        }

        console.error('Speech recognition error:', e);
        setMicState('error');
        const msg = e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition error.';
        setMicErrorMsg(msg);
        toast.error({ title: 'Speech Input Error', description: msg });
        setTimeout(() => {
          setMicState('idle');
          setMicErrorMsg(null);
        }, 4000);
      };

      rec.onend = () => {
        setMicState('idle');
        if (!userStoppedVoiceRef.current && hasSpokenAudioRef.current) {
          stopVoiceInput(false);
        }
      };

      setRecognitionInstance(rec);
      rec.start();
    } catch (err: any) {
      console.error(err);
      setMicState('error');
      setMicErrorMsg('Failed to initialize microphone.');
      toast.error({ title: 'Microphone Error', description: 'Failed to initialize microphone.' });
      setTimeout(() => {
        setMicState('idle');
        setMicErrorMsg(null);
      }, 4000);
    }
  };

  const stopVoiceInput = (manualStop = true) => {
    if (manualStop) {
      isContinuousVoiceModeRef.current = false;
      userStoppedVoiceRef.current = true;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (audioAnalyserIntervalRef.current) {
      clearInterval(audioAnalyserIntervalRef.current);
      audioAnalyserIntervalRef.current = null;
    }

    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach(track => track.stop());
      activeMediaStreamRef.current = null;
    }

    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }
    setMicState('idle');

    // Auto-submit captured speech ONLY if genuine speech was spoken
    setTimeout(() => {
      setChatPrompt(prev => {
        let textToSubmit = prev.trim();
        // Strip "Hey Nest" or "Hey Lorena" wake-word prefix if present
        const strippedText = textToSubmit
          .replace(/^(hey|hi)\s+nest,?\s*/i, '')
          .replace(/^(hey|hi)\s+lorena,?\s*/i, '')
          .trim();

        if (strippedText) {
          textToSubmit = strippedText;
        }

        if (textToSubmit) {
          handleAskPrompt(textToSubmit);
        }
        return textToSubmit;
      });
    }, 200);
  };

  const getConnectionDetails = (appId: string) => {
    switch (appId) {
      case 'google_workspace':
      case 'google_calendar':
      case 'google_drive':
        return {
          id: 'google_workspace',
          displayName: 'Google Workspace',
          shortName: 'Google',
          connected: googleConn.connected,
          scopes: googleConn.scopes || ['Gmail', 'Calendar', 'Drive'],
          lastSync: googleConn.lastSyncedAt ? new Date(googleConn.lastSyncedAt).toLocaleString() : 'Never',
          access: ['Send Gmail notifications', 'Read calendar events to coordinate listing dates', 'Verify document checklists in Google Drive'],
          noAccess: ['Access your Google Account password', 'Modify or delete arbitrary files', 'Access payment credentials'],
          connectUrl: '/api/integrations/google/connect',
          disconnectUrl: '/api/integrations/google/disconnect',
          syncUrl: '/api/integrations/google/sync'
        };
      case 'microsoft_365':
      case 'microsoft_teams':
        return {
          id: 'microsoft_365',
          displayName: 'Microsoft 365 / Outlook',
          shortName: 'Microsoft',
          connected: microsoftConn.connected,
          scopes: microsoftConn.scopes || ['Mail.Read', 'Calendars.Read'],
          lastSync: microsoftConn.lastSyncedAt ? new Date(microsoftConn.lastSyncedAt).toLocaleString() : 'Never',
          access: ['Sync Outlook emails to scan listing contract status', 'Read Outlook calendars'],
          noAccess: ['Access M365 master billing account details', 'Edit Teams channel policies'],
          connectUrl: '/api/integrations/microsoft/connect',
          disconnectUrl: '/api/integrations/microsoft/disconnect',
          syncUrl: '/api/integrations/microsoft/sync'
        };
      case 'slack':
        return {
          id: 'slack',
          displayName: 'Slack Integration',
          shortName: 'Slack',
          connected: slackConn.connected,
          scopes: ['incoming-webhook', 'commands'],
          lastSync: 'Sync active',
          access: ['Post automated alerts on critical transaction exceptions', 'Listen for inline slash commands'],
          noAccess: ['Read private direct messages (DMs)', 'Access channel audit logs'],
          connectUrl: '/api/integrations/slack/connect',
          disconnectUrl: '/api/integrations/slack/disconnect',
          syncUrl: '/api/integrations/slack/sync'
        };
      case 'sms_phone':
        return {
          id: 'sms_phone',
          displayName: 'SMS / Twilio Gateway',
          shortName: 'SMS',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Send SMS texts to listing agents for photography alerts', 'Collect sign install feedback texts'],
          noAccess: ['Read private personal messages'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      case 'rechat':
        return {
          id: 'rechat',
          displayName: 'Rechat CRM',
          shortName: 'Rechat',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Sync contact details & pipeline status', 'Trigger automated workflow campaigns'],
          noAccess: ['Directly modify password database'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      case 'dotloop':
        return {
          id: 'dotloop',
          displayName: 'Dotloop Transactions',
          shortName: 'Dotloop',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Sync transaction loops and folders', 'Validate MLS and compliance sheets'],
          noAccess: ['Sign signature documents on your behalf'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      default:
        return null;
    }
  };

  const handleConnectProvider = async (appId: string) => {
    const details = getConnectionDetails(appId);
    if (!details || !details.connectUrl) {
      toast.info({ title: 'Setup Required', description: 'Twilio config routes are planned but not configured in this environment.' });
      return;
    }

    try {
      const res = await fetch(details.connectUrl + `?workspaceId=${state.workspaceId || 'nest-realty-demo'}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error({ title: 'OAuth Initiation Failed', description: 'Failed to initiate OAuth flow.' });
      }
    } catch (e: any) {
      toast.error({ title: 'OAuth Error', description: 'Error initiating OAuth: ' + e.message });
    }
  };

  const handleDisconnectProvider = async (appId: string) => {
    const details = getConnectionDetails(appId);
    if (!details || !details.disconnectUrl) return;

    if (!window.confirm(`Are you sure you want to disconnect ${details.displayName}?`)) {
      return;
    }

    try {
      const res = await fetch(details.disconnectUrl + `?workspaceId=${state.workspaceId || 'nest-realty-demo'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        toast.success({ title: 'Integration Disconnected', description: `${details.displayName} disconnected successfully.` });
        await fetchConnectionStatuses();
      } else {
        toast.error({ title: 'Disconnect Failed', description: 'Failed to disconnect connection.' });
      }
    } catch (e: any) {
      toast.error({ title: 'Error Disconnecting', description: e.message });
    }
  };

  // Intake Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<any>('normal');
  const [deadline, setDeadline] = useState('');
  const [property, setProperty] = useState('');
  const [requesterName, setRequesterName] = useState(state.activeProfile?.name || 'Sarah Jenkins');
  const [requesterEmail, setRequesterEmail] = useState(state.activeProfile?.email || 'sarah.j@nestrealty.com');
  const [preferredChannel, setPreferredChannel] = useState('dashboard');

  // Request Update State
  const [newStatus, setNewStatus] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Requests from Backend
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/ops/requests', {
        headers: {
          'x-workspace-id': state.workspaceId || 'nest-realty-demo',
          'x-user-role': state.activeProfile?.role || 'regional_leader',
          'x-user-email': state.activeProfile?.email || 'ryan@nestrealty.com'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error('Failed to fetch requests for Nest Ops Hub:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [state.activeProfile, state.workspaceId]);

  // Support Card Trigger Listener
  useEffect(() => {
    const handleOpenIntake = () => {
      setShowIntakeModal(true);
    };
    window.addEventListener('open-intake-modal', handleOpenIntake);
    return () => window.removeEventListener('open-intake-modal', handleOpenIntake);
  }, []);

  // Submit Intake Form
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.warning({ title: 'Missing Required Fields', description: 'Title and Description are required.' });
      return;
    }

    try {
      const res = await fetch('/api/ops/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          title,
          description,
          urgency,
          deadline: deadline || undefined,
          requesterName,
          requesterEmail,
          requesterRole: state.activeProfile?.role || 'agent',
          preferredChannel,
          linkedProperty: property || undefined
        })
      });

      if (res.ok) {
        // Reset Form
        setTitle('');
        setDescription('');
        setProperty('');
        setDeadline('');
        setUrgency('normal');
        setPreferredChannel('dashboard');
        setShowIntakeModal(false);
        setChatPrompt('');
        // Refresh List
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to submit intake request:', err);
    }
  };

  // Update Request properties
  const handleRequestUpdate = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);

    let assignedRole = '';
    if (newOwner === 'Ryan') assignedRole = 'regional_leader';
    else if (newOwner === 'Ann') assignedRole = 'operations_manager';
    else if (newOwner === 'James') assignedRole = 'accounting_manager';
    else if (newOwner === 'Melissa') assignedRole = 'marketing_manager';
    else if (newOwner === 'BIC Demo User') assignedRole = 'bic';
    else assignedRole = 'triage_operator';

    try {
      const res = await fetch(`/api/ops/requests/${selectedRequest.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: newStatus || undefined,
          assignedOwner: newOwner || undefined,
          assignedRole: newOwner ? assignedRole : undefined,
          notes: internalNotes || undefined,
          resolutionSummary: resolutionSummary || undefined,
          escalationLevel: newStatus === 'escalated' ? selectedRequest.escalationLevel + 1 : undefined,
          actorEmail: state.activeProfile?.email || 'sarah.j@nestrealty.com',
          actorName: state.activeProfile?.name || 'Sarah Jenkins'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data.request);
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectRequestForDetail = (req: any) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setNewOwner(req.assignedOwner || '');
    setInternalNotes(req.notes || '');
    setResolutionSummary(req.resolutionSummary || '');
  };

  // Local AI classification simulator details
  const getAIClassificationDetails = (titleText: string, descText: string) => {
    const text = `${titleText} ${descText}`.toLowerCase();
    
    let suggestedOwner = 'Shapework Triage';
    let suggestedRole = 'triage_operator';
    let type = 'General operations';
    let missingInfo = ['No property address specified', 'Awaiting contact confirmation'];
    let sla = '4 business days';

    if (text.includes('sign') || text.includes('rider')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Sign request';
      missingInfo = ['Install location detail', 'Rider text requirements'];
      sla = '2 business days';
    } else if (text.includes('lockbox') || text.includes('keys')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Lockbox request';
      missingInfo = ['Lockbox serial code', 'Access requirements'];
      sla = '2 business days';
    } else if (text.includes('marketing') || text.includes('flyer') || text.includes('postcard')) {
      suggestedOwner = 'Melissa';
      suggestedRole = 'marketing_manager';
      type = 'Marketing request';
      missingInfo = ['Property photos', 'Target audience/listing details'];
      sla = '3 business days';
    } else if (text.includes('compliance') || text.includes('contract') || text.includes('disclosure')) {
      suggestedOwner = 'BIC Demo User';
      suggestedRole = 'bic';
      type = 'Compliance question';
      missingInfo = ['Transaction folder ID', 'Signed checklist link'];
      sla = '1 business day';
    } else if (text.includes('commission') || text.includes('payment') || text.includes('check')) {
      suggestedOwner = 'James';
      suggestedRole = 'accounting_manager';
      type = 'Accounting / commission issue';
      missingInfo = ['Settlement statement (ALTA/CD)', 'QuickBooks invoice ref'];
      sla = '2 business days';
    } else if (text.includes('onboarding') || text.includes('agent')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Agent onboarding';
      missingInfo = ['State license number', 'MLS account details'];
      sla = '2 business days';
    } else if (text.includes('office') || text.includes('room')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Office issue';
      missingInfo = ['Conference room A/B booking logs'];
      sla = '2 business days';
    }

    return {
      type,
      suggestedOwner,
      suggestedRole,
      missingInfo,
      sla
    };
  };

  const liveClassification = getAIClassificationDetails(title, description);

  // Compute Command Center Metrics
  const openWork = jobs.filter((j: any) => j.status !== 'completed').length;
  const overdueWork = jobs.filter((j: any) => j.status === 'overdue' || j.priority === 'critical').length;
  const needsApproval = steps.filter((s: any) => s.status === 'waiting_approval').length;
  const blockedItems = jobs.filter((j: any) => j.status === 'blocked').length;
  const assetExceptions = opsAssets.filter((a: any) => a.status === 'missing' || a.status === 'overdue').length;
  const complianceRisks = jobs.filter((j: any) => j.status !== 'completed' && (j.workflowKey === 'closing_compliance_risk' || j.workflowKey === 'missing_document' || j.workflowKey === 'compliance_chase')).length;

  return (
    <div className="space-y-6 text-[#17231F] font-sans text-xs text-left pt-0">
           {/* Top Header Bar with Navigation Tabs & History Action */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
        {mode === 'full' ? (
          <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => setActiveHubTab('assistant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeHubTab === 'assistant'
                  ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                  : 'text-stone-600 hover:text-[#01362D]'
              }`}
            >
              Ask Nest Ops
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('activity')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeHubTab === 'activity'
                  ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                  : 'text-stone-600 hover:text-[#01362D]'
              }`}
            >
              Activity
            </button>
          </div>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVoiceDrawer(prev => !prev)}
            className="px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-[#00635C] text-stone-700 hover:text-[#00635C] rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <DemoControlDropdown workspaceId={currentLocation.id} onTriggerSuccess={() => {}} />
        </div>
      </div>

      {/* Camera Warning Banner */}
      {cameraOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-sans text-left">
          <div className="space-y-0.5">
            <span className="font-bold text-xs block text-amber-950">Tapo Camera Relay Offline</span>
            <span className="text-[10px] text-amber-800">Tapo TCW-61 credentials loaded, but relay is unreachable.</span>
          </div>
          <button
            onClick={() => state.setCurrentTab('Camera Signals')}
            className="px-2.5 py-1 bg-amber-800 text-white font-bold rounded-lg hover:bg-amber-900 text-[10px] cursor-pointer"
          >
            Inspect Status
          </button>
        </div>
      )}

      {/* Unified Voice-First Ask Nest Ops Assistant Workspace */}
      {(mode === 'search_only' || (mode === 'full' && activeHubTab === 'assistant')) && (
      <div 
        className="max-w-3xl mx-auto space-y-6 pt-10 pb-10 text-center" 
        data-testid="ask-nest-ops-hero"
      >
        {/* Flowing MP4 Orb — Central Interactive & State Visualizer */}
        <div className="relative group flex flex-col items-center">
          <button
            type="button"
            data-testid="ask-nest-ops-orb"
            aria-label="Talk to Ask Nest Ops"
            onClick={micState === 'listening' ? stopVoiceInput : startVoiceInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                micState === 'listening' ? stopVoiceInput() : startVoiceInput();
              }
            }}
            className={`relative rounded-full transition-all duration-500 cursor-pointer overflow-hidden flex items-center justify-center
              w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 shadow-lg shadow-black/5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00635C] focus-visible:ring-offset-2
              ${micState === 'listening' 
                ? 'ring-8 ring-[#00635C]/30 animate-pulse scale-105 shadow-[0_0_36px_rgba(0,99,92,0.3)] motion-reduce:animate-none' 
                : micState === 'processing' 
                  ? 'ring-6 ring-[#00635C]/20 animate-pulse duration-1000 scale-[1.02]' 
                  : isSpeaking 
                    ? 'ring-8 ring-[#00635C]/40 animate-pulse scale-105 shadow-[0_0_40px_rgba(0,99,92,0.35)]' 
                    : micState === 'error'
                      ? 'ring-2 ring-stone-300'
                      : 'ring-2 ring-[#00635C]/20 hover:scale-[1.02] shadow-[0_0_36px_rgba(0,99,92,0.12)]'
              }
            `}
          >
            <video
              src={orbVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              data-testid="orb-video-element"
              className="w-full h-full object-cover rounded-full pointer-events-none motion-reduce:animate-none"
            />
          </button>
        </div>

        {/* Dynamic Copy by Assistant State */}
        {micState === 'idle' && !activeQuery && !activeContractSession && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 
                className="font-serif font-medium text-3xl md:text-4xl text-[#01362D] tracking-tight"
                data-testid="ask-nest-ops-heading"
              >
                Ask Nest Ops
              </h2>
              <p className="text-sm text-stone-600 font-sans">
                Ask a question, find something, or get work done.
              </p>
            </div>

            {/* 4 Lightweight Default Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-1">
              {[
                { label: 'What needs my attention?', prompt: 'What needs my attention today?' },
                { label: 'Summarize today', prompt: 'Summarize today' },
                { label: 'Check open requests', prompt: 'Check open requests' },
                { label: 'Help me with an offer', prompt: 'I need to write an offer' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskPrompt(chip.prompt)}
                  className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-full text-xs font-medium text-stone-800 transition-all cursor-pointer shadow-2xs hover:border-[#00635C] hover:text-[#00635C]"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {micState === 'listening' && (
          <div className="space-y-2 animate-fade-in">
            <h2 className="font-serif font-medium text-2xl text-[#01362D]">
              I’m listening
            </h2>
            <p className="text-sm italic text-stone-600 max-w-md mx-auto">
              “{chatPrompt || 'What needs my attention today?'}”
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => stopVoiceInput(true)}
                className="px-4 py-1.5 rounded-full border border-stone-300 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  stopVoiceInput(true);
                  const inputEl = document.getElementById('ask-nest-ops-main-input');
                  if (inputEl) inputEl.focus();
                }}
                className="px-4 py-1.5 rounded-full border border-stone-300 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 cursor-pointer shadow-2xs"
              >
                Type instead
              </button>
            </div>
          </div>
        )}

        {micState === 'processing' && (
          <div className="space-y-1 animate-fade-in">
            <h2 className="font-serif font-medium text-2xl text-[#01362D] animate-pulse">
              Got it.
            </h2>
            <p className="text-xs text-stone-500 font-sans">One moment…</p>
          </div>
        )}

        {/* Responding & Result Card Display */}
        {activeQuery && (
          <div className="space-y-4 max-w-xl mx-auto text-center animate-fade-in" data-testid="active-ai-answer-surface">
            <p className="text-lg md:text-xl font-serif font-medium text-[#01362D] leading-snug">
              {activeQuery.answer}
            </p>

            {/* Actionable Record Cards (Answer / Show / Do / Ask) */}
            {activeQuery.actionTitle && (
              <div className="p-4 bg-white border border-stone-200/90 rounded-2xl shadow-sm text-left flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm text-[#01362D]">{activeQuery.actionTitle}</h4>
                  <p className="text-xs text-stone-600">{activeQuery.actionDetails}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuery(prev => prev ? { ...prev, executed: true } : null);
                    toast.info({
                      title: 'Action Completed',
                      description: activeQuery.actionDetails || 'Task completed.'
                    });
                  }}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  {activeQuery.executed ? '✓ Completed' : 'Execute action'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contract Intake Summary Card */}
        {activeContractSession && (
          <div className="max-w-xl mx-auto">
            <CompactContractSummary
              session={activeContractSession}
              workspaceId={currentLocation.id}
              onUpdateSession={(updated) => setActiveContractSession(updated)}
              onStartVoice={startVoiceInput}
              isVoiceActive={micState === 'listening'}
              voiceState={micState === 'listening' ? 'listening' : 'idle'}
            />
          </div>
        )}

        {micState === 'error' && (
          <div className="space-y-2 max-w-md mx-auto animate-fade-in">
            <h2 className="font-serif font-medium text-xl text-stone-800">
              I lost the connection.
            </h2>
            <p className="text-xs text-stone-600 font-sans">Your conversation is safe.</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => startVoiceInput()}
                className="px-4 py-1.5 rounded-full bg-[#00635C] text-white text-xs font-medium hover:bg-[#01362D] cursor-pointer shadow-2xs"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  setMicState('idle');
                  const inputEl = document.getElementById('ask-nest-ops-main-input');
                  if (inputEl) inputEl.focus();
                }}
                className="px-4 py-1.5 rounded-full border border-stone-300 text-stone-700 text-xs font-medium bg-white hover:bg-stone-50 cursor-pointer shadow-2xs"
              >
                Type instead
              </button>
            </div>
          </div>
        )}

        {/* Unified Main Input Control Bar */}
        <div className="w-full max-w-xl mx-auto pt-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatPrompt.trim()) return;
              handleAskPrompt(chatPrompt.trim());
            }}
            className="w-full p-2 bg-white border border-stone-300/80 shadow-sm rounded-2xl flex items-center gap-3 transition-all hover:border-[#00635C] focus-within:border-[#00635C] focus-within:ring-2 focus-within:ring-[#00635C]/20"
          >
            <input 
              id="ask-nest-ops-main-input"
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Ask or type anything..."
              className="flex-1 bg-transparent border-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none py-1.5 px-2 font-sans"
            />

            <div className="flex items-center gap-2 shrink-0 pr-1">
              <button
                type="button"
                onClick={micState === 'listening' ? stopVoiceInput : startVoiceInput}
                title="Voice Command"
                aria-label="Toggle Voice Input"
                className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  micState === 'listening' 
                    ? 'bg-rose-600 border-rose-600 text-white animate-pulse' 
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-[#00635C]'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              
              <button
                type="submit"
                title="Send Prompt"
                aria-label="Send Prompt"
                disabled={!chatPrompt.trim()}
                className="p-2.5 bg-[#00635C] hover:bg-[#01362D] disabled:opacity-40 text-white rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          {/* Hands-Free Mode Simple Sentence Case Line */}
          <div className="text-center pt-3 select-none">
            <button
              type="button"
              onClick={() => {
                const nextState = !isWakeWordActive;
                setIsWakeWordActive(nextState);
                toast.info({
                  title: nextState ? 'Hands-Free Active' : 'Hands-Free Paused',
                  description: nextState ? 'Say "Hey Nest" to speak.' : 'Click mic to talk.'
                });
              }}
              className="text-xs text-stone-500 hover:text-stone-800 font-sans cursor-pointer transition-colors inline-flex items-center gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${micState === 'listening' ? 'bg-rose-500 animate-ping' : isWakeWordActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
              <span>{isWakeWordActive ? '● Hands-free on · Say “Hey Nest”' : 'Hands-free off · Click mic to talk'}</span>
            </button>
          </div>

          {/* Lorena Conversational Stage & Synchronized Found Items Projection */}
          {(voiceAgent.transcriptHistory.length > 0 || (voiceAgent.activeMatchedItems && voiceAgent.activeMatchedItems.length > 0)) && (
            <div className="mt-6 pt-4 border-t border-stone-200/80 space-y-4 text-left">
              {/* Turn Transcript Dialogue Preview */}
              {voiceAgent.transcriptHistory.length > 0 && (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {voiceAgent.transcriptHistory.slice(-2).map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-stone-100 text-stone-900 ml-8 font-medium' 
                          : 'bg-emerald-50/80 border border-emerald-200/60 text-emerald-950 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase mb-1 text-stone-500">
                        <span>{msg.sender === 'user' ? 'You' : 'Lorena (Ask Nest Ops)'}</span>
                        {msg.sender === 'agent' && voiceAgent.status === 'speaking' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold normal-case text-[10px]">
                            <Volume2 className="w-3 h-3 animate-pulse" /> Speaking
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Synchronized Found Item Cards Projection */}
              {voiceAgent.activeMatchedItems && voiceAgent.activeMatchedItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Found {voiceAgent.activeMatchedItems.length} Matching Items</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-medium">Click any card to open or take action</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {voiceAgent.activeMatchedItems.map((item: any, idx: number) => (
                      <div 
                        key={item.id || idx}
                        className={`p-4 rounded-2xl bg-white border transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-3 ${
                          voiceAgent.status === 'speaking' && idx === 0
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-stone-200/80 hover:border-emerald-500/60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              item.badgeColor === 'emerald'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.badgeColor === 'blue'
                                ? 'bg-sky-100 text-sky-800'
                                : item.badgeColor === 'amber'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}>
                              {item.badge || item.type}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">Item #{idx + 1}</span>
                          </div>

                          <h4 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                            {item.title}
                          </h4>

                          {item.subtitle && (
                            <p className="text-[11px] font-medium text-stone-500">
                              {item.subtitle}
                            </p>
                          )}

                          {item.snippet && (
                            <p className="text-xs text-stone-600 leading-relaxed pt-1 line-clamp-2">
                              {item.snippet}
                            </p>
                          )}
                        </div>

                        {/* Metadata Pills */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100">
                            {Object.entries(item.metadata).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-stone-50 text-stone-600 border border-stone-100 font-mono">
                                <strong>{k}:</strong> {String(v)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 1-Click Action Button */}
                        {item.actionText && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleExecuteItemAction(item)}
                              className="px-3 py-1.5 bg-[#00635C] hover:bg-[#01362D] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                            >
                              <span>{item.actionText}</span>
                              <ExternalLink className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* KPI Neumorphic Row & Activity Dashboard View */}
      {(mode === 'activity_only' || (mode === 'full' && activeHubTab === 'activity')) && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Tasks', val: openWork, icon: Inbox, trend: 'Active coworker runs' },
          { label: 'Overdue Items', val: overdueWork, icon: Clock, trend: 'Overdue target deadlines', danger: overdueWork > 0 },
          { label: 'Needs Approval', val: needsApproval, icon: UserCheck, trend: 'Human-in-the-loop steps', warning: needsApproval > 0 },
          { label: 'Blocked Runs', val: blockedItems, icon: HelpCircle, trend: 'Requires agent reply', danger: blockedItems > 0 },
          { label: 'Asset Exceptions', val: assetExceptions, icon: AlertTriangle, trend: 'Signs missing/overdue', warning: assetExceptions > 0 },
          { label: 'Compliance Risks', val: complianceRisks, icon: Shield, trend: 'Audits requiring review', warning: complianceRisks > 0 }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="rounded-2xl p-4 flex flex-col justify-between space-y-2.5 transition-all hover:scale-[1.02] bg-[var(--sw-surface)] border border-[var(--sw-border)] shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--sw-text-secondary)]">{kpi.label}</span>
                <div className="p-1.5 rounded-lg bg-[var(--sw-canvas)] border border-[var(--sw-border)]">
                  <Icon className={`w-3.5 h-3.5 ${kpi.danger ? 'text-[var(--state-danger)]' : kpi.warning ? 'text-[var(--state-warning)]' : 'text-[var(--sw-text-secondary)]'}`} />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-3xl font-serif font-black text-[var(--sw-text-primary)] leading-none">{kpi.val}</div>
                <span className="text-[9px] text-[var(--sw-text-secondary)] block font-semibold">{kpi.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Morning Briefing & Next Actions Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningBriefing
          briefing={state.dailyBriefing}
          isGenerating={state.isGeneratingBriefing}
          onGenerate={state.loadBriefing}
          itemsNeedingAttentionCount={state.attentionCount || 0}
          revenueAtRisk={state.revAtRisk || 0}
          decisionsCount={state.decCount || 0}
          primaryActionText="Review outstanding physical asset flags & compliance gaps."
          onNavigateTab={(tab: string) => state.setCurrentTab(tab)}
        />

        {/* Suggested Next Actions */}
        <div 
          className="rounded-[28px] p-6 space-y-4 text-left bg-[var(--sw-surface)] border border-[var(--sw-border)] shadow-sm"
        >
          <h3 className="font-serif text-base font-black text-[var(--sw-text-primary)]">Suggested Next Actions</h3>
          <div className="divide-y divide-stone-100 pr-1 max-h-[300px] overflow-y-auto">
            {opsCameraEvents && opsCameraEvents.filter((e: any) => e.status === 'new' || e.status === 'needs_review').slice(0, 3).map((event: any, idx: number) => (
              <div key={`cam-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-stone-900 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {event.locationName}
                  </span>
                  <p className="text-[11px] text-stone-500">{event.eventDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={() => state.setCurrentTab('Camera Signals')}
                  className="px-3 py-1 bg-[#00635C] hover:bg-[#01362D] text-white font-bold rounded-lg text-[10px] cursor-pointer shrink-0"
                >
                  Inspect Event
                </button>
              </div>
            ))}

            {jobs && jobs.filter((j: any) => j.status === 'blocked' || j.status === 'error').slice(0, 3).map((job: any, idx: number) => (
              <div key={`job-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-stone-900 block flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    {job.title}
                  </span>
                  <p className="text-[11px] text-stone-500">Run ID: {job.id} • {job.status}</p>
                </div>
                <button
                  type="button"
                  onClick={() => state.setCurrentTab('Approvals')}
                  className="px-3 py-1 bg-rose-800 hover:bg-rose-900 text-white font-bold rounded-lg text-[10px] cursor-pointer shrink-0"
                >
                  Resolve Block
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Moved Operational Activity Cards: Connections, Intake Channels & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-4">
        {/* Column 1: Connections Card */}
        <div className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left bg-white border border-stone-200/80 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Connections</h3>
                <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-stone-500 block">Workspace Apps</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-md border border-emerald-200">
                6 Active
              </span>
            </div>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Shapework connects to your brokerage tools to streamline operations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[10px] select-none">
            {[
              { id: 'gmail', name: 'Gmail / Outlook', desc: 'Email intake', status: 'connected' },
              { id: 'calendar', name: 'Calendar', desc: 'Meetings', status: 'connected' },
              { id: 'slack', name: 'Slack', desc: 'Team alerts', status: 'connected' },
              { id: 'teams', name: 'MS Teams', desc: 'Collaboration', status: 'connected' },
              { id: 'sms', name: 'SMS / Phone', desc: 'Mobile texts', status: 'connected' },
              { id: 'drive', name: 'Google Drive', desc: 'Docs & assets', status: 'connected' }
            ].map((tool, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/60 flex items-center gap-2">
                <ConnectorLogo provider={tool.id} size="sm" className="w-5 h-5 rounded-md bg-white border border-stone-200 shrink-0" />
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-bold text-stone-900 truncate text-[9.5px]">{tool.name}</span>
                  <span className="text-[8px] text-emerald-700 font-medium">Connected</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Official Intake Channels */}
        <div className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left bg-white border border-stone-200/80 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base text-stone-900">Official Intake Channels</h3>
            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-stone-500 block">Every request starts here</span>
          </div>
          <div className="py-2 flex flex-col items-center justify-center relative min-h-[180px]">
            <div className="bg-[#00635C] text-white border border-emerald-700/30 rounded-2xl px-4 py-3 text-center z-10 space-y-0.5 shadow-md">
              <span className="font-serif font-black text-xs block leading-none">Ask Nest Ops</span>
              <span className="text-[7.5px] opacity-90 uppercase tracking-widest font-mono block">Central Hub</span>
            </div>
          </div>
        </div>

        {/* Column 3: Recent Activity Requests */}
        <div className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left bg-white border border-stone-200/80 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base text-stone-900">Recent Activity Logs</h3>
            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-stone-500 block">Recent Ops Logins & Runs</span>
          </div>
          <div className="divide-y divide-stone-100 font-sans text-xs">
            {[
              { id: 'mock_1', title: 'Sign request for 123 Oak Island Dr', status: 'in_progress' },
              { id: 'mock_2', title: 'Listing launch assets for 456 River Wynd', status: 'in_progress' },
              { id: 'mock_3', title: 'MLS compliance review – new agent', status: 'needs_info' },
              { id: 'mock_4', title: 'Lockbox not opening – 789 Pine St', status: 'in_progress' }
            ].map((req) => (
              <div key={req.id} className="py-2.5 flex justify-between items-center gap-3">
                <span className="font-bold text-[11px] text-stone-900 truncate">{req.title}</span>
                <span className="px-2 py-0.5 text-[8px] font-bold rounded-md uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {req.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}

      {/* History Slide-Out Right Drawer */}
      {showVoiceDrawer && (
        <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-white border-l border-stone-200 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00635C]" />
              <h3 className="font-serif font-medium text-base text-[#01362D]">History</h3>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopAssistantSpeaking}
                  className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
                  title="Stop speaking (Press Esc)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  Stop Speaking (Esc)
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowVoiceDrawer(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
            {voiceHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-stone-500">
                <Clock className="w-8 h-8 text-stone-300 stroke-1" />
                <p className="font-medium text-xs text-stone-700">No History Yet</p>
                <p className="text-xs">Your prior questions and Nest Ops answers will appear here.</p>
              </div>
            ) : (
              voiceHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col space-y-1 ${
                    item.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      item.sender === 'user'
                        ? 'bg-[#00635C] text-white rounded-br-2xs shadow-xs font-sans'
                        : 'bg-white border border-stone-200 text-stone-800 shadow-xs rounded-bl-2xs font-sans'
                    }`}
                  >
                    <p>{item.text}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans px-1">
                    {item.sender === 'user' ? 'You' : 'Ask Nest Ops'} • {item.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      


      {/* End of Ask Nest Ops Hub Content */}

      {/* Request Intake Form Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowIntakeModal(false)} />
          {/* Modal Card */}
          <div className="relative bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 animate-scale-in text-xs">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#e4decb]/40 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[var(--sw-green-900)]" />
                <h3 className="font-serif font-black text-sm text-[#1e2520]">Ask Nest Ops Intake</h3>
              </div>
              <button onClick={() => setShowIntakeModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--sw-muted)] leading-relaxed mb-4">
              Submit an issue, question, or help request. Nest Ops will route it to the right person and track it through resolution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Form Input fields */}
              <form onSubmit={handleIntakeSubmit} className="space-y-4 md:col-span-3">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Request Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sign install request for 102 Pine Street"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Description / Details</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full background context, needed items, and specifics..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] min-h-[90px] text-xs leading-normal"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Property Address</label>
                    <input 
                      type="text" 
                      value={property}
                      onChange={(e) => setProperty(e.target.value)}
                      placeholder="e.g. 102 Pine Street"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Needed By Date</label>
                    <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Urgency / Priority</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Preferred Channel</label>
                    <select
                      value={preferredChannel}
                      onChange={(e) => setPreferredChannel(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs cursor-pointer"
                    >
                      <option value="dashboard">Dashboard Request Form</option>
                      <option value="email">Ask Nest Ops Email</option>
                      <option value="sms">SMS Hotline</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 select-none">
                  <button 
                    type="button" 
                    onClick={() => setShowIntakeModal(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 font-bold rounded-lg text-xs hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-700)] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Submit Request
                  </button>
                </div>
              </form>

              {/* AI Triage Classification Simulator preview */}
              <div className="md:col-span-2 bg-[#fcfbf7] border border-[#e4decb] rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block flex items-center gap-1.5 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    AI Triage Simulator Preview
                  </span>

                  <div className="space-y-2 leading-relaxed text-[11px] text-stone-600 font-medium">
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">CLASSIFIED CATEGORY:</span>
                      <span className="font-bold text-stone-800 text-xs uppercase">{liveClassification.type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">SUGGESTED OWNER:</span>
                      <span className="font-bold text-[var(--sw-green-900)]">{liveClassification.suggestedOwner} ({liveClassification.suggestedRole.replace(/_/g, ' ')})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">TARGET SLA RESOLUTION:</span>
                      <span className="font-semibold text-stone-700">{liveClassification.sla}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">REQUIRED INFO CHECKLIST:</span>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-stone-500">
                        {liveClassification.missingInfo.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e4decb]/40 pt-3 text-[9px] text-[#8c887d] leading-normal italic">
                  Note: Real AI routing checks title keywords and description contexts on save, matching them to default staff rules.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Request Detail Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setSelectedRequest(null)}
          />
          {/* Drawer content */}
          <div className="relative w-[520px] bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-left z-50 border-l border-stone-200 text-xs text-stone-600">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#e4decb]/40 pb-4 mb-4 select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf2ee] text-[var(--sw-green-900)] flex items-center justify-center font-bold">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-sm text-[#1e2520]">{selectedRequest.title}</h2>
                  <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider font-bold">Request Detail & Management</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6 flex-1">
              {/* Main request properties */}
              <div className="grid grid-cols-2 gap-4 bg-[#fcfbf7] border border-[#e4decb] rounded-2xl p-4 font-mono text-[10px] text-stone-700">
                <div>
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">REQUESTED BY:</span>
                  <span className="font-sans font-bold text-stone-850 block mt-0.5">{selectedRequest.requesterName}</span>
                  <span className="text-[9px] text-stone-400 block">{selectedRequest.requesterEmail}</span>
                </div>
                <div>
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">PROPERTY ADDRESS:</span>
                  <span className="font-sans font-bold text-[var(--sw-green-900)] block mt-0.5">{selectedRequest.linkedProperty || 'None'}</span>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">SOURCE CHANNEL:</span>
                  <span className="font-sans font-bold text-stone-800 uppercase block mt-0.5">{selectedRequest.source}</span>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">CURRENT ASSIGNEE:</span>
                  <span className="font-sans font-bold text-[var(--sw-green-900)] block mt-0.5">
                    {selectedRequest.assignedOwner 
                      ? `${selectedRequest.assignedOwner} (${(selectedRequest.assignedRole || '').replace(/_/g, ' ')})` 
                      : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-stone-500 block select-none">Ingested Content</span>
                <div className="bg-stone-50 border border-stone-150 rounded-xl p-3.5 leading-relaxed text-stone-800 font-medium">
                  {selectedRequest.description}
                </div>
              </div>

              {/* Status and Assignment Form (Operations Only) */}
              <div className="border-t border-[#e4decb]/40 pt-4 space-y-4 select-none">
                <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block">OPERATOR ACTION CONTROLS</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Status Override</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="needs_info">Needs Info</option>
                      <option value="waiting_agent">Waiting on Agent</option>
                      <option value="escalated">Escalated</option>
                      <option value="completed">Completed / Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Assign Owner</label>
                    <select
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="">Unassigned (Triage)</option>
                      <option value="Ann">Ann (Operations Manager)</option>
                      <option value="Ryan">Ryan (Regional Leader / BIC)</option>
                      <option value="Melissa">Melissa (Marketing Manager)</option>
                      <option value="James">James (Accounting Manager)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Internal Operator Logs</label>
                  <textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Input timeline logs, follow-up status, or notes..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none min-h-[60px] leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Resolution Summary (upon Completion)</label>
                  <input 
                    type="text" 
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Briefly state how this issue was resolved..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRequestUpdate}
                  disabled={isUpdating}
                  className="w-full py-2 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-700)] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Save Override Changes'}
                </button>
              </div>

              {/* Timeline & Audit Logs */}
              <div className="border-t border-[#e4decb]/40 pt-4 space-y-3">
                <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block select-none">TIMELINE & ESCALATION PATH</span>
                <div className="relative border-l border-stone-200 pl-4 ml-1.5 space-y-4">
                  <div className="relative text-left">
                    <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-150 border border-emerald-500 flex items-center justify-center font-bold text-emerald-700 text-[8px]">✓</span>
                    <span className="font-bold text-stone-750 block text-[10px]">Ingested from {selectedRequest.source}</span>
                    <span className="text-[9px] text-stone-400 block">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedRequest.notes && (
                    <div className="relative text-left">
                      <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-stone-150 border border-stone-400 flex items-center justify-center font-bold text-stone-600 text-[8px]">•</span>
                      <span className="font-bold text-stone-750 block text-[10px]">Internal Operator Log entry added</span>
                      <p className="text-[9px] text-stone-500 leading-normal mt-0.5 font-medium">{selectedRequest.notes}</p>
                    </div>
                  )}
                  {selectedRequest.resolutionSummary && (
                    <div className="relative text-left">
                      <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-150 border border-emerald-500 flex items-center justify-center font-bold text-emerald-700 text-[8px]">✓</span>
                      <span className="font-bold text-emerald-800 block text-[10px]">Resolution Summary Logged</span>
                      <p className="text-[9px] text-emerald-700 leading-normal mt-0.5 font-medium">{selectedRequest.resolutionSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Connector Picker Modal */}
      {/* Connector Picker Modal */}
      {showConnectorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowConnectorPicker(false)} />
          {/* Modal Container */}
          <div className="relative bg-[#01362D] border border-[rgba(246,247,241,0.12)] rounded-3xl p-6 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col z-50 animate-scale-in text-xs text-white">
            <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D0D6BB]" />
                <h3 className="font-serif font-black text-sm text-white">Add Connected Apps & Brokerage Tools</h3>
              </div>
              <button onClick={() => setShowConnectorPicker(false)} className="text-stone-400 hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#D0D6BB] leading-relaxed mb-4 shrink-0 font-sans font-medium">
              Authorized integrations feed listing launches, signage installs, and compliance pipelines to the Nest Ops hub. Connect your channels below.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-left custom-scrollbar">
              {[
                {
                  title: 'Communication',
                  items: [
                    { id: 'google_workspace', provider: 'gmail', name: 'Gmail', desc: 'Securely sync transaction emails.', connected: googleConn.connected },
                    { id: 'microsoft_365', provider: 'outlook', name: 'Outlook Mail', desc: 'Sync corporate email intake.', connected: microsoftConn.connected },
                    { id: 'slack', provider: 'slack', name: 'Slack', desc: 'Dispatches real-time transaction updates.', connected: slackConn.connected },
                    { id: 'microsoft_365', provider: 'teams', name: 'Microsoft Teams', desc: 'Teams collaborative channels sync.', connected: microsoftConn.connected },
                    { id: 'sms_phone', provider: 'sms', name: 'SMS / Phone', desc: 'Twilio provider notification pipeline.', connected: false }
                  ]
                },
                {
                  title: 'Calendar',
                  items: [
                    { id: 'google_workspace', provider: 'calendar', name: 'Google Calendar', desc: 'Wilmington conference room schedules.', connected: googleConn.connected },
                    { id: 'microsoft_365', provider: 'outlookcalendar', name: 'Outlook Calendar', desc: 'Corporate calendar synchronization.', connected: false }
                  ]
                },
                {
                  title: 'Files',
                  items: [
                    { id: 'google_workspace', provider: 'drive', name: 'Google Drive', desc: 'Hosts shared brokerage templates.', connected: googleConn.connected }
                  ]
                },
                {
                  title: 'Real Estate / Brokerage',
                  items: [
                    { id: 'rechat', provider: 'rechat', name: 'Rechat', desc: 'CRM and active listing data.', connected: false, comingSoon: true },
                    { id: 'dotloop', provider: 'dotloop', name: 'Dotloop', desc: 'Compliance checks and deal folders.', connected: false, comingSoon: true },
                    { id: 'skyslope', provider: 'skyslope', name: 'SkySlope', desc: 'Alternate transaction storage.', connected: false, comingSoon: true },
                    { id: 'brokermint', provider: 'brokermint', name: 'Brokermint', desc: 'Commission management ledger.', connected: false, comingSoon: true },
                    { id: 'mls', provider: 'mls', name: 'MLS Integrations', desc: 'Direct local Wilmington MLS feed.', connected: false, comingSoon: true }
                  ]
                }
              ].map((category) => (
                <div key={category.title} className="space-y-2">
                  <h4 className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB]/60 select-none">
                    {category.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-col justify-between p-3 rounded-2xl bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] hover:bg-[rgba(246,247,241,0.07)] hover:border-[rgba(246,247,241,0.15)] transition-all duration-200"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.1)] flex items-center justify-center font-bold">
                              <ConnectorLogo provider={item.provider} size="sm" className="w-5 h-5" />
                            </div>
                            {item.connected && (
                              <span className="px-1.5 py-0.2 bg-emerald-950/40 text-emerald-350 text-[7.5px] font-bold rounded border border-emerald-850/40 font-mono">
                                ACTIVE
                              </span>
                            )}
                            {item.comingSoon && (
                              <span className="px-1.5 py-0.2 bg-[rgba(208,214,187,0.12)] text-[#D0D6BB] text-[7.5px] font-bold rounded border border-[rgba(208,214,187,0.18)] font-mono">
                                SOON
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-[11px]">{item.name}</span>
                            <p className="text-[10px] text-[#D0D6BB]/70 leading-normal mt-0.5 font-medium">{item.desc}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[rgba(246,247,241,0.06)] mt-3">
                          {item.connected ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowConnectorPicker(false);
                                setActiveAppDetail(item.id);
                              }}
                              className="w-full py-1 bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] text-white hover:bg-[rgba(0,99,92,0.25)] rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                            >
                              Configure
                            </button>
                          ) : item.comingSoon ? (
                            <button
                              disabled
                              type="button"
                              className="w-full py-1 bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.06)] text-white/30 rounded-lg text-[9px] font-bold cursor-not-allowed"
                            >
                              Coming Soon
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setShowConnectorPicker(false);
                                if (item.id === 'sms_phone') {
                                  toast.info({ title: 'Twilio Setup Pending', description: 'SMS config is planned but Twilio integration is pending administrative setup.' });
                                } else {
                                  handleConnectProvider(item.id);
                                }
                              }}
                              className="w-full py-1 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors shadow-sm"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connection Detail Drawer */}
      {activeAppDetail && (() => {
        const details = getConnectionDetails(activeAppDetail);
        if (!details) return null;

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setActiveAppDetail(null)}
            />
            {/* Drawer Container */}
            <div className="relative w-[460px] bg-[#01362D] h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-left z-50 border-l border-[rgba(246,247,241,0.12)] text-xs text-white">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-4 mb-4 select-none">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.05)] border border-[rgba(246,247,241,0.1)] flex items-center justify-center font-bold text-white">
                    <Activity className="w-4 h-4 text-[#D0D6BB]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-black text-sm text-white leading-tight">{details.displayName}</h2>
                    <span className="text-[9px] text-[#D0D6BB] uppercase tracking-wider font-bold">App Connector Details</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveAppDetail(null)}
                  className="p-1 rounded-lg hover:bg-[rgba(246,247,241,0.06)] text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status info */}
              <div className="space-y-6 flex-1 text-left">
                <div className="grid grid-cols-2 gap-4 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-2xl p-4 font-mono text-[10px]">
                  <div>
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider block">CONNECTION STATUS:</span>
                    <span className="font-sans font-bold block mt-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${details.connected ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                      {details.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider block">LAST SYNCHRONIZED:</span>
                    <span className="font-sans font-bold text-[#F6F7F1] block mt-0.5">{details.lastSync}</span>
                  </div>
                </div>

                {/* Scopes & Access */}
                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase text-[#D0D6BB] block select-none">What this app can access:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[#F6F7F1]/85 leading-normal">
                    {details.access.map((acc, idx) => (
                      <li key={idx}>{acc}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase text-[#D0D6BB] block select-none">What this app WILL NOT access:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[#F6F7F1]/60 leading-normal">
                    {details.noAccess.map((noAcc, idx) => (
                      <li key={idx}>{noAcc}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-4 space-y-3 select-none">
                  {details.connected ? (
                    <button
                      onClick={() => {
                        setActiveAppDetail(null);
                        handleDisconnectProvider(details.id);
                      }}
                      className="w-full py-2 bg-rose-900/60 hover:bg-rose-900 border border-rose-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center"
                    >
                      Disconnect app connection
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAppDetail(null);
                        handleConnectProvider(details.id);
                      }}
                      disabled={!details.connectUrl}
                      className={`w-full py-2 font-bold rounded-lg text-xs transition-colors text-center ${
                        details.connectUrl
                          ? 'bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.15)] text-white cursor-pointer'
                          : 'bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.08)] text-white/40 cursor-not-allowed'
                      }`}
                    >
                      Setup Connection
                    </button>
                  )}
                </div>

                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 text-[9px] text-[#D0D6BB]/75 leading-normal italic">
                  Note: OAuth credentials are never stored locally. Disconnecting revokes all workspace access tokens immediately.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* History Slide-Out Right Drawer */}
      {showVoiceDrawer && (
        <div 
          className="fixed inset-y-0 right-0 w-96 max-w-full bg-white border-l border-stone-200 z-50 shadow-2xl flex flex-col font-sans transition-all animate-slide-in-right text-xs"
          data-testid="voice-transcript-drawer"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00635C]" />
              <h3 className="font-serif font-medium text-base text-[#01362D]">History</h3>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopAssistantSpeaking}
                  className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
                  title="Stop speaking (Press Esc)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  Stop Speaking (Esc)
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowVoiceDrawer(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Conversation History Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
            {voiceHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-stone-500">
                <Clock className="w-8 h-8 text-stone-300 stroke-1" />
                <p className="font-medium text-xs text-stone-700">No History Yet</p>
                <p className="text-xs">Your prior questions and Nest Ops answers will appear here.</p>
              </div>
            ) : (
              voiceHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col space-y-1 ${
                    item.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      item.sender === 'user'
                        ? 'bg-[#00635C] text-white rounded-br-2xs shadow-xs font-sans'
                        : 'bg-white border border-stone-200 text-stone-800 shadow-xs rounded-bl-2xs font-sans'
                    }`}
                  >
                    <p>{item.text}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans px-1">
                    {item.sender === 'user' ? 'You' : 'Ask Nest Ops'} • {item.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Staff SOP Studio Interactive Editor & Approval Modal */}
      {showSopStudioModal && selectedSopForStudio && (
        <StaffSopStudioModal
          sop={selectedSopForStudio}
          isOpen={showSopStudioModal}
          onClose={() => setShowSopStudioModal(false)}
          onSave={handleSaveSopDraft}
          onPublish={handlePublishSop}
        />
      )}
    </div>
  );
}
