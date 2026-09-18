import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Inbox, HelpCircle, Plus, FileText, ArrowRight, UserCheck, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, User, 
  MapPin, Shield, Activity, ListTodo, Check, X, Mail, Phone, Lock, MessageSquare,
  Volume2, VolumeX, Mic, Sparkles, ExternalLink, Trash2, Send, Search, History, MessageCircle,
  Paperclip, Upload, PhoneCall, Globe, Calendar
} from 'lucide-react';
import MorningBriefing from '../command/MorningBriefing';
import ConnectorLogo from '../ui/ConnectorLogo';
import LocationSelectorDropdown, { getStoredLocation, BrokerageLocation } from '../ui/LocationSelectorDropdown';
import { useToast } from '../ui';
import { ContractCopilotCard } from './ContractCopilotCard';
import { CompactContractSummary } from './CompactContractSummary';
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
import { NestOrbVisualizer } from '../shared/NestOrbVisualizer';
import { FormattedMessageContent } from '../shared/FormattedMessageContent';
import { ContactPersonModal, ContactPersonTarget } from './ContactPersonModal';
import { NoraReasoningVisualizer } from './NoraReasoningVisualizer';
import { NoraMeetingClarificationCards } from './NoraMeetingClarificationCards';
import { NoraBrowserAgentDrawer } from './NoraBrowserAgentDrawer';
import { NoraGoogleWorkspaceHub } from './NoraGoogleWorkspaceHub';
import { NoraMorningPulseStudio } from './NoraMorningPulseStudio';
import { NoraTrainingAcademy } from './NoraTrainingAcademy';
import { NoraVideoStudio } from './NoraVideoStudio';
import { NoraSkillsMatrixView } from './NoraSkillsMatrixView';
import { ShowingTimeLockboxHub } from './ShowingTimeLockboxHub';
import ConnectedToolsDrawer from '../integrations/ConnectedToolsDrawer';
import WorthKnowingDashboardModule from '../news/WorthKnowingDashboardModule';

export interface NoraConversationMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  matchedItems?: any[];
  reasoningSteps?: any[];
  thoughtDurationMs?: number;
  actions?: any[];
}

export interface NoraConversationSession {
  id: string;
  title: string;
  category?: string;
  preview: string;
  timestamp: string;
  dateGroup: 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Earlier';
  messages: NoraConversationMessage[];
}

const DEFAULT_CONVERSATION_SESSIONS: NoraConversationSession[] = [
  {
    id: 'sess_1',
    title: 'Listing Launch Protocol & WWREA Rule',
    category: 'SOP & Compliance',
    preview: 'Validated Exclusive Right to Sell, MLS photo schedules, and NCREC agency guidelines.',
    timestamp: '2h ago',
    dateGroup: 'Today',
    messages: [
      {
        id: 'msg_1_1',
        sender: 'user',
        text: 'What are the required compliance steps before launching a new listing in Wilmington?',
        timestamp: '2:15 PM'
      },
      {
        id: 'msg_1_2',
        sender: 'agent',
        text: "To launch a new listing in Wilmington, complete these 3 mandatory steps before MLS syndication:\n\n1. **Executed Listing Agreement & WWREA**: Validated Exclusive Right to Sell Agreement & Working With Real Estate Agents brochure signed in Dotloop.\n2. **Media Production**: Scheduled HDR photography, floor plan scan, and drone media package.\n3. **Sign & Field Dispatch**: Coastal Sign Post Co. work order dispatched for yard post and brochure box.\n\n*Responsible Owner: Melissa Gagliardi (Transaction Coordinator) with BIC supervision.*",
        timestamp: '2:15 PM',
        matchedItems: [
          {
            id: 'sop_listing_launch',
            type: 'Authoritative SOP',
            badge: 'SOP v2.0',
            badgeColor: 'emerald',
            title: 'Listing Launch Protocol',
            subtitle: 'Operations Standard · Melissa Gagliardi',
            actionType: 'open_sop',
            actionLabel: 'Open SOP in Studio',
            actionPayload: { sopId: 'sop_listing_launch' }
          }
        ]
      }
    ]
  },
  {
    id: 'sess_2',
    title: '702 Lumina Ave Marketing Package',
    category: 'Marketing Intake',
    preview: 'Scheduled HDR photography, drafted open house flyer, and queued social card.',
    timestamp: '4h ago',
    dateGroup: 'Today',
    messages: [
      {
        id: 'msg_2_1',
        sender: 'user',
        text: 'Can you check marketing intake status for 702 Lumina Ave?',
        timestamp: '12:30 PM'
      },
      {
        id: 'msg_2_2',
        sender: 'agent',
        text: "Melissa Gagliardi has processed the marketing package for **702 Lumina Ave**:\n\n• **Photography**: Twilight package booked with Apex Media for Thursday at 5:30 PM.\n• **Print & Direct Mail**: Just Listed postcard run prepared in Collateral Studio (500 radius mailers).\n• **Digital Assets**: Instagram story & Facebook carousel queued for Friday launch.",
        timestamp: '12:31 PM',
        matchedItems: [
          {
            id: 'mkt_702_lumina',
            type: 'Marketing Campaign',
            badge: 'In Progress',
            badgeColor: 'blue',
            title: '702 Lumina Ave Launch Collateral',
            subtitle: 'Apex Media & Canva Vector Engine',
            actionType: 'view_task',
            actionLabel: 'View in Marketing Intake'
          }
        ]
      }
    ]
  },
  {
    id: 'sess_3',
    title: 'Form 2-T Due Diligence & EMD Audit',
    category: 'Contract Copilot',
    preview: 'Confirmed $15,000 earnest money trust deposit deadline with First Bank NC.',
    timestamp: 'Yesterday',
    dateGroup: 'Yesterday',
    messages: [
      {
        id: 'msg_3_1',
        sender: 'user',
        text: 'Check due diligence and EMD deposit timeline for the Masonboro Sound contract.',
        timestamp: 'Yesterday 3:45 PM'
      },
      {
        id: 'msg_3_2',
        sender: 'agent',
        text: "For the **Masonboro Sound** contract ($645,000 offer on NC REALTORS® Form 2-T):\n\n• **Earnest Money Deposit ($15,000)**: Must be deposited into First Bank NC escrow within **72 hours** of contract effective date.\n• **Due Diligence Fee ($5,000)**: Paid directly to seller.\n• **Due Diligence Period**: Ends Sept 12, 2026 at 5:00 PM EST.\n\n*BIC Compliance Sign-off: Eric Knight (Verified).* ",
        timestamp: 'Yesterday 3:46 PM',
        matchedItems: [
          {
            id: 'contract_masonboro',
            type: 'Executed Contract',
            badge: 'Form 2-T',
            badgeColor: 'emerald',
            title: 'Masonboro Sound Purchase Agreement',
            subtitle: '$645,000 · First Bank NC Escrow',
            actionType: 'draft_offer',
            actionLabel: 'Inspect Contract Record'
          }
        ]
      }
    ]
  },
  {
    id: 'sess_4',
    title: 'Sign Vendor Post Delivery Escalation',
    category: 'Vendor Dispatch',
    preview: 'Coastal Sign Post Co. work order #4812 dispatched for 304 Ocean Blvd.',
    timestamp: 'Yesterday',
    dateGroup: 'Yesterday',
    messages: [
      {
        id: 'msg_4_1',
        sender: 'user',
        text: 'Did Coastal Sign Post install the yard arm at 304 Ocean Blvd?',
        timestamp: 'Yesterday 11:15 AM'
      },
      {
        id: 'msg_4_2',
        sender: 'agent',
        text: "Yes, Work Order #4812 was completed yesterday at 2:15 PM by **Coastal Sign Post Co.**\n\n• **Installed**: White colonial vinyl post + custom Nest rider + brochure box.\n• **GPS Confirmation**: Front curb coordinates verified.\n• **Responsible Owner**: Ann Gunn (Admin Coordinator).",
        timestamp: 'Yesterday 11:16 AM'
      }
    ]
  },
  {
    id: 'sess_5',
    title: 'Emergency Keybox Access Procedure',
    category: 'SOP & Physical Assets',
    preview: 'Retrieved backup master shackle release code for 114 Shoreline Way.',
    timestamp: 'Aug 15',
    dateGroup: 'Previous 7 Days',
    messages: [
      {
        id: 'msg_5_1',
        sender: 'user',
        text: 'How do I release the lockbox shackle if the Bluetooth eKEY fails?',
        timestamp: 'Aug 15 10:00 AM'
      },
      {
        id: 'msg_5_2',
        sender: 'agent',
        text: "Per Nest Realty's **Emergency Keybox Procedure (v2.0)**:\n\n1. Request the master 4-digit shackle override code from Ann Gunn or access the Supra Master Gateway.\n2. Ensure property address and agent MLS ID are logged for compliance audit.\n3. Replace lockbox battery if blinking red LED persists.",
        timestamp: 'Aug 15 10:01 AM'
      }
    ]
  },
  {
    id: 'sess_6',
    title: 'Buyer Agency Agreement Onboarding',
    category: 'SOP & Compliance',
    preview: 'Reviewed unrepresented buyer disclosure policy per NCREC guidelines.',
    timestamp: 'Aug 14',
    dateGroup: 'Previous 7 Days',
    messages: [
      {
        id: 'msg_6_1',
        sender: 'user',
        text: 'What is the policy when meeting an unrepresented buyer at an open house who wants to make an offer?',
        timestamp: 'Aug 14 4:30 PM'
      },
      {
        id: 'msg_6_2',
        sender: 'agent',
        text: "Under North Carolina Real Estate Commission rules and Nest SOP:\n\n• Present the **Working With Real Estate Agents (WWREA)** disclosure immediately at first substantial contact.\n• Explain unrepresented buyer rights vs dual agency before discussing confidential motivation, pricing, or drafting NC Form 2-T.",
        timestamp: 'Aug 14 4:31 PM'
      }
    ]
  }
];

interface NestOpsHubProps {
  state: any;
  mode?: 'full' | 'search_only' | 'activity_only';
  orbVideoSrc?: string;
  initialShowHistoryDrawer?: boolean;
}

export default function NestOpsHub({ 
  state, 
  mode = 'full', 
  orbVideoSrc = '/nest_orb_2.mp4',
  initialShowHistoryDrawer = false 
}: NestOpsHubProps) {
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
  const [showConnectedToolsDrawer, setShowConnectedToolsDrawer] = useState(false);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [activeAppDetail, setActiveAppDetail] = useState<string | null>(null);

  // Nora Web Research & VM Browser Agent Drawer State
  const [showBrowserVmDrawer, setShowBrowserVmDrawer] = useState(false);
  const [browserVmQuery, setBrowserVmQuery] = useState('NCREC Rule 58A earnest money and due diligence requirements');
  const [browserVmSession, setBrowserVmSession] = useState<any | null>(null);

  // NORA 6-Layer Modular Voice Agent Framework Session
  const voiceAgent = useVoiceAgentSession(undefined, state?.user?.name || 'Ryan');

  // Microphone & Speaker Audio state
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'listening' | 'processing' | 'error'>('idle');
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState<boolean>(false);
  const [activeMatchedItems, setActiveMatchedItems] = useState<any[]>([]);
  const [latestActionCard, setLatestActionCard] = useState<any | null>(null);
  const [activeHubTab, setActiveHubTab] = useState<'assistant' | 'morning_pulse' | 'google_workspace' | 'training_academy' | 'video_studio' | 'skills_matrix' | 'showing_hub' | 'activity'>('assistant');
  
  // Conversation History State (like ChatGPT conversation column)
  const [conversationHistory, setConversationHistory] = useState<NoraConversationSession[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('ask_nest_ops_conversations_v4');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return DEFAULT_CONVERSATION_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(initialShowHistoryDrawer);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Persist conversation history to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ask_nest_ops_conversations_v4', JSON.stringify(conversationHistory));
      }
    } catch {}
  }, [conversationHistory]);

  // Global event listener to open Connected Tools Drawer
  useEffect(() => {
    const handleOpen = () => setShowConnectedToolsDrawer(true);
    window.addEventListener('open-connected-tools-drawer', handleOpen);
    return () => window.removeEventListener('open-connected-tools-drawer', handleOpen);
  }, []);

  const activeSession = conversationHistory.find(s => s.id === activeSessionId) || null;

  const handleSelectSession = (sess: NoraConversationSession) => {
    setActiveSessionId(sess.id);
    if (sess.messages && sess.messages.length > 0) {
      (voiceAgent as any).setTranscriptHistory?.(
        sess.messages.map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp
        }))
      );
    }
  };

  const handleStartNewChat = () => {
    const sessId = activeSessionId || 'session-voice-agent';
    fetch(`/api/calendar/pending-action?sessionId=${encodeURIComponent(sessId)}`, { method: 'DELETE' }).catch(() => {});
    setActiveSessionId(null);
    setChatPrompt('');
    voiceAgent.stopSpeaking();
    voiceAgent.clearHistory();
    setMicState('idle');
    toast.info({
      title: 'New Conversation',
      description: 'Ask Nest Ops is ready for your next question or task.'
    });
  };

  const handleDeleteSession = (e: React.MouseEvent, sessId: string) => {
    e.stopPropagation();
    setConversationHistory(prev => prev.filter(s => s.id !== sessId));
    if (activeSessionId === sessId) {
      setActiveSessionId(null);
      voiceAgent.clearHistory();
    }
    toast.info({
      title: 'Conversation Removed',
      description: 'Session removed from history.'
    });
  };

  const handleClearAllHistory = () => {
    setConversationHistory([]);
    setActiveSessionId(null);
    voiceAgent.clearHistory();
    toast.info({
      title: 'History Cleared',
      description: 'All past conversations have been removed.'
    });
  };

  // Sync active session when NORA produces an AI response in voiceAgent
  useEffect(() => {
    if (activeSessionId && voiceAgent.transcriptHistory.length > 0) {
      const latestTurn = voiceAgent.transcriptHistory[voiceAgent.transcriptHistory.length - 1];
      if (latestTurn && latestTurn.sender === 'agent') {
        const turnItems = (latestTurn.matchedItems && latestTurn.matchedItems.length > 0)
          ? latestTurn.matchedItems
          : voiceAgent.activeMatchedItems;

        setConversationHistory(prev =>
          prev.map(s => {
            if (s.id === activeSessionId) {
              const existingIdx = s.messages.findIndex(m => m.id === latestTurn.id || (m.sender === 'agent' && m.text === latestTurn.text));
              if (existingIdx >= 0) {
                if (turnItems && turnItems.length > 0 && (!s.messages[existingIdx].matchedItems || s.messages[existingIdx].matchedItems.length === 0)) {
                  const updatedMessages = [...s.messages];
                  updatedMessages[existingIdx] = {
                    ...updatedMessages[existingIdx],
                    matchedItems: turnItems,
                    reasoningSteps: latestTurn.reasoningSteps || updatedMessages[existingIdx].reasoningSteps,
                    thoughtDurationMs: latestTurn.thoughtDurationMs || updatedMessages[existingIdx].thoughtDurationMs,
                    actions: latestTurn.actions || updatedMessages[existingIdx].actions
                  };
                  return {
                    ...s,
                    messages: updatedMessages
                  };
                }
                return s;
              } else {
                return {
                  ...s,
                  preview: latestTurn.text.slice(0, 100),
                  messages: [
                    ...s.messages,
                    {
                      id: latestTurn.id || `msg_a_${Date.now()}`,
                      sender: 'agent',
                      text: latestTurn.text,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      matchedItems: turnItems,
                      reasoningSteps: latestTurn.reasoningSteps,
                      thoughtDurationMs: latestTurn.thoughtDurationMs,
                      actions: latestTurn.actions
                    }
                  ]
                };
              }
            }
            return s;
          })
        );
      }
    }
  }, [voiceAgent.transcriptHistory, activeSessionId, voiceAgent.activeMatchedItems]);

  const filteredHistory = conversationHistory.filter(s => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q);
  });

  // Check if the latest turn is awaiting calendar or action confirmation
  const activePendingMeeting = useMemo(() => {
    if (!voiceAgent.transcriptHistory || voiceAgent.transcriptHistory.length === 0) return null;
    const lastMessage = voiceAgent.transcriptHistory[voiceAgent.transcriptHistory.length - 1];
    if (!lastMessage || (lastMessage.sender !== 'agent' && lastMessage.sender !== 'nora')) return null;

    const hasConfirmAction = lastMessage.actions?.some(
      (a: any) => a.id === 'confirm_meeting' || a.actionType === 'confirm_meeting' || a.label?.toLowerCase().includes('confirm')
    );
    const isCalendarDraft = lastMessage.text?.includes('Confirm Google Calendar Meeting') || 
                           lastMessage.text?.includes('Click **Confirm & Schedule**');
    const isAlreadyResolved = lastMessage.text?.includes('Meeting Scheduled Successfully') || 
                              lastMessage.text?.includes('Meeting Scheduling Cancelled') ||
                              lastMessage.text?.includes('🚫 Meeting Scheduling Cancelled');

    if ((hasConfirmAction || isCalendarDraft) && !isAlreadyResolved) {
      const meetingTitleMatch = lastMessage.text?.match(/\*\*Meeting Title\*\*:\s*\*\*([^*]+)\*\*/i);
      const attendeeMatch = lastMessage.text?.match(/\*\*Attendee\*\*:\s*\*\*([^*]+)\*\*/i);
      const dateMatch = lastMessage.text?.match(/\*\*Date\*\*:\s*\*\*([^*]+)\*\*/i);
      const timeMatch = lastMessage.text?.match(/\*\*Time\*\*:\s*\*\*([^*]+)\*\*/i);

      return {
        title: meetingTitleMatch ? meetingTitleMatch[1].trim() : 'Confirm Google Calendar Meeting',
        attendee: attendeeMatch ? attendeeMatch[1].trim() : '',
        date: dateMatch ? dateMatch[1].trim() : 'Tomorrow',
        time: timeMatch ? timeMatch[1].trim() : '',
        confirmAction: lastMessage.actions?.find((a: any) => a.id === 'confirm_meeting' || a.label?.toLowerCase().includes('confirm')) || {
          id: 'confirm_meeting',
          label: 'Confirm & Schedule',
          actionType: 'confirm_meeting'
        },
        cancelAction: lastMessage.actions?.find((a: any) => a.id === 'cancel_meeting' || a.label?.toLowerCase().includes('cancel')) || {
          id: 'cancel_meeting',
          label: 'Cancel',
          actionType: 'cancel_meeting'
        }
      };
    }
    return null;
  }, [voiceAgent.transcriptHistory]);

  // Staff SOP Studio Modal State
  const [selectedSopForStudio, setSelectedSopForStudio] = useState<SopDocument | null>(null);
  const [showSopStudioModal, setShowSopStudioModal] = useState<boolean>(false);

  // Contact Person Modal State
  const [selectedPersonForContact, setSelectedPersonForContact] = useState<ContactPersonTarget | null>(null);
  const [showContactPersonModal, setShowContactPersonModal] = useState<boolean>(false);

  const handleOpenSopStudio = async (sopId?: string, initialTitle?: string) => {
    try {
      // 0. If requested to create a brand new SOP from a missing workflow query
      if (sopId === 'new' || (initialTitle && !sopId)) {
        const cleanTitle = (initialTitle || 'New Operational Workflow Protocol')
          .replace(/^define\s+new\s+sop:?\s*/i, '')
          .trim();
        const newDraftSop: SopDocument = {
          id: `sop_draft_${Date.now()}`,
          tenantId: 'tenant_nest_uat',
          workspaceId: 'ws_wilmington',
          title: cleanTitle,
          purpose: `Standard operating procedure and execution workflow for ${cleanTitle} at Nest Realty.`,
          trigger: `Operational trigger initiating ${cleanTitle}.`,
          processOwner: state?.activeProfile?.name || 'Ryan Crecelius (Owner / BIC)',
          publisher: 'Ryan Crecelius (BIC)',
          participants: ['Listing Agent', 'Transaction Coordinator', 'BIC'],
          prerequisites: ['Completed initial client authorization or intake'],
          requiredInputs: ['Property Address', 'Agent Details', 'Authorized Signatures'],
          orderedSteps: [
            { id: 'st_1', stepNumber: 1, action: `Initiate ${cleanTitle} intake and log record in Nest Ops Hub.`, role: 'Transaction Coordinator', systemUsed: 'Nest Ops Hub' },
            { id: 'st_2', stepNumber: 2, action: 'Verify compliance documents and broker-in-charge requirements.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' },
            { id: 'st_3', stepNumber: 3, action: 'Execute operational deliverables and notify assigned participants.', role: 'Operations Coordinator', systemUsed: 'Internal Console' }
          ],
          decisions: ['If documentation is incomplete, pause and notify process owner.'],
          exceptions: ['Emergency expedited handling requires BIC authorization.'],
          escalationPaths: ['Escalate unresolved blockers to Ryan Crecelius (Owner / BIC).'],
          completionEvidence: 'Completed checklist run, verified documentation, and signed approval.',
          expectedTiming: '24 to 48 hours',
          systemsUsed: ['Dotloop', 'NC Regional MLS', 'Google Workspace'],
          reviewer: 'Jessica Keenan — Broker-in-Charge',
          effectiveDate: new Date().toISOString(),
          reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          openQuestions: [],
          status: 'draft',
          author: state?.activeProfile?.name || 'Ryan Crecelius',
          createdBy: state?.activeProfile?.name || 'Ryan Crecelius',
          aiAssisted: true,
          transcriptRetention: 'sop_only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        };
        setSelectedSopForStudio(newDraftSop);
        setShowSopStudioModal(true);
        toast.info({
          title: 'Define New Workflow',
          description: `Draft template opened in SOP Studio for "${cleanTitle}".`
        });
        return;
      }

      // 1. Direct fetch by ID if sopId is provided
      if (sopId) {
        try {
          const directRes = await fetch(`/api/sops/${sopId}`);
          if (directRes.ok) {
            const data = await directRes.json();
            if (data.sop) {
              setSelectedSopForStudio(data.sop);
              setShowSopStudioModal(true);
              return;
            }
          }
        } catch (err) {}

        try {
          const directDraftRes = await fetch(`/api/sops/drafts/${sopId}`);
          if (directDraftRes.ok) {
            const data = await directDraftRes.json();
            if (data.sop) {
              setSelectedSopForStudio(data.sop);
              setShowSopStudioModal(true);
              return;
            }
          }
        } catch (err) {}
      }

      // 2. Fetch all SOPs from /api/sops
      try {
        const res = await fetch('/api/sops');
        if (res.ok) {
          const data = await res.json();
          const list: SopDocument[] = data.sops || data.drafts || [];
          const found = sopId 
            ? list.find(s => s.id === sopId || s.id.includes(sopId) || (sopId && s.id.toLowerCase().includes(sopId.toLowerCase())))
            : list[0];
          if (found) {
            setSelectedSopForStudio(found);
            setShowSopStudioModal(true);
            return;
          }
        }
      } catch (err) {}

      // 3. Fallback: fetch from /api/sops/drafts
      const draftRes = await fetch('/api/sops/drafts');
      if (draftRes.ok) {
        const data = await draftRes.json();
        const drafts: SopDocument[] = data.drafts || [];
        const found = sopId 
          ? drafts.find(s => s.id === sopId || s.id.includes(sopId))
          : drafts[0];
        if (found) {
          setSelectedSopForStudio(found);
          setShowSopStudioModal(true);
          return;
        }
      }
    } catch (e) {
      console.warn('[SOP Studio Open Error]:', e);
      toast.error({ title: 'Unable to open SOP', description: 'Could not load SOP document.' });
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
        body: JSON.stringify({ publisher: 'Ryan Crecelius — Principal Broker (#291840)' })
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

    // Ensure there is an active conversation session
    let targetSessionId = activeSessionId;
    const userMsg: NoraConversationMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!targetSessionId) {
      targetSessionId = `sess_${Date.now()}`;
      const newSession: NoraConversationSession = {
        id: targetSessionId,
        title: rawText.length > 40 ? rawText.slice(0, 40) + '…' : rawText,
        category: 'Ask Nest Ops',
        preview: rawText,
        timestamp: 'Just Now',
        dateGroup: 'Today',
        messages: [userMsg]
      };
      setActiveSessionId(targetSessionId);
      setConversationHistory(prev => [newSession, ...prev]);
    } else {
      setConversationHistory(prev =>
        prev.map(s => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              preview: rawText,
              timestamp: 'Just Now',
              dateGroup: 'Today',
              messages: [...s.messages, userMsg]
            };
          }
          return s;
        })
      );
    }

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
      if (item.actionPayload?.createNew) {
        handleOpenSopStudio('new', item.actionPayload.title || item.title);
      } else {
        const targetSopId = item.actionPayload?.sopId || item.id;
        handleOpenSopStudio(targetSopId, item.title);
      }
    } else if (item.actionType === 'contact_person') {
      const targetPerson: ContactPersonTarget = {
        name: item.actionPayload?.name || item.title,
        firstName: item.actionPayload?.firstName || (item.actionPayload?.name || item.title).split(' ')[0],
        role: item.actionPayload?.role || item.subtitle?.split('•')?.[0]?.trim() || 'Broker',
        office: item.actionPayload?.office || item.subtitle?.split('•')?.[1]?.trim() || 'Mayfaire Office',
        phone: item.actionPayload?.phone || item.metadata?.Phone || '(910) 507-2047',
        email: item.actionPayload?.email || item.metadata?.Email || 'contact@nestrealty.com'
      };
      setSelectedPersonForContact(targetPerson);
      setShowContactPersonModal(true);
    } else if (item.actionType === 'dispatch_maxa_agent') {
      state.setCurrentTab?.('Marketing');
      toast.success({
        title: '🤖 Nora Maxa Browser Agent Dispatched',
        description: `Compiling collateral for ${item.actionPayload?.propertyAddress || 'property'} and staging in Eduardo's workspace.`
      });
    } else if (item.actionType === 'draft_offer') {
      const offerPrompt = item.actionPayload?.prompt || `Draft offer on ${item.title}`;
      handleAskPrompt(offerPrompt);
    } else if (item.actionType === 'view_task' || item.actionType === 'resolve_issue' || item.actionType === 'open_page') {
      const targetTab = item.actionPayload?.tab;
      const targetType = item.actionPayload?.type;

      if (targetTab) {
        state.setCurrentTab?.(targetTab);
      } else if (targetType === 'marketing') {
        state.setCurrentTab?.('Marketing');
      } else if (targetType === 'sign' || targetType === 'vendor') {
        state.setCurrentTab?.('Tasks');
      } else if (targetType === 'compliance') {
        state.setCurrentTab?.('Approvals');
      } else if (targetType === 'directory') {
        state.setCurrentTab?.('Directory');
      }
      toast.info({
        title: item.title,
        description: item.snippet || 'Navigating to operational workflow.'
      });
    }
  };

  const handleExecuteTurnAction = (action: any) => {
    if (action.actionType === 'confirm_meeting' || action.id === 'confirm_meeting' || action.label?.toLowerCase().includes('confirm')) {
      handleAskPrompt(action.label || 'Confirm & Schedule');
    } else if (action.actionType === 'cancel_meeting' || action.id === 'cancel_meeting' || action.label?.toLowerCase().includes('cancel')) {
      handleAskPrompt(action.label || 'Cancel');
    } else if (action.actionType === 'dispatch_maxa_agent') {
      state.setCurrentTab?.('Marketing');
      toast.success({
        title: '🤖 Nora Maxa Browser Agent Dispatched',
        description: `Compiling collateral for ${action.payload?.propertyAddress || 'property'} and staging in Eduardo's workspace.`
      });
    } else if (action.actionType === 'contact_person') {
      const p = action.payload || {};
      const targetPerson: ContactPersonTarget = {
        name: p.name || action.label.replace('Contact ', ''),
        firstName: p.firstName || (p.name || action.label.replace('Contact ', '')).split(' ')[0],
        role: p.role || 'Broker Associate',
        office: p.office || 'Mayfaire Office',
        phone: p.phone || '(910) 507-2047',
        email: p.email || 'contact@nestrealty.com'
      };
      setSelectedPersonForContact(targetPerson);
      setShowContactPersonModal(true);
    } else if (action.actionType === 'navigate_tab') {
      if (action.payload?.tab) {
        state.setCurrentTab?.(action.payload.tab);
        toast.info({
          title: action.label,
          description: `Navigating to ${action.payload.tab} desk.`
        });
      }
    } else if (action.actionType === 'open_sop') {
      if (action.payload?.createNew) {
        handleOpenSopStudio('new', action.payload.title || 'New Workflow');
      } else {
        handleOpenSopStudio(action.payload?.sopId || 'sop_listing_launch_01', action.payload?.title || 'Listing Protocol');
      }
    } else if (action.actionType === 'draft_offer') {
      handleAskPrompt(`Draft Form 2-T offer on ${action.payload?.address || 'property'}`);
    } else if (action.actionType === 'view_task') {
      if (action.payload?.tab) {
        state.setCurrentTab?.(action.payload.tab);
      }
      toast.info({
        title: action.label,
        description: 'Opening task record.'
      });
    }
  };

  // Multimodal Document & Telephony Hotline States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInspectingDoc, setIsInspectingDoc] = useState(false);
  const [showTelephonyModal, setShowTelephonyModal] = useState(false);
  const [telephonyCalls, setTelephonyCalls] = useState<any[]>([]);
  const [sendingSmsCallId, setSendingSmsCallId] = useState<string | null>(null);

  const loadTelephonyCalls = async () => {
    try {
      const res = await fetch('/api/voice-agent/telephony/calls');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.calls) && data.calls.length > 0) {
          setTelephonyCalls(data.calls);
        }
      }
    } catch (e) {
      console.warn('Failed to load telephony calls:', e);
    }
  };

  const handleSendSmsFollowUp = async (call: any) => {
    try {
      setSendingSmsCallId(call.callId);
      const res = await fetch('/api/voice-agent/telephony/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNumber: call.fromNumber,
          callId: call.callId,
          message: `Nest Ops: Hi ${call.firstName || 'there'}, your request regarding "${call.summary}" has been logged with ticket ID #${call.ticketCreatedId || 'NEST-99'}. Ops lead notified.`
        })
      });
      if (res.ok) {
        setTelephonyCalls(prev => prev.map(c => c.callId === call.callId ? { ...c, smsFollowUpSent: true } : c));
        toast.success({
          title: 'SMS Follow-up Sent',
          description: `Dispatched confirmation to ${call.fromNumber}`
        });
      }
    } catch (err: any) {
      toast.error({ title: 'SMS Failed', description: err.message });
    } finally {
      setSendingSmsCallId(null);
    }
  };

  const handleInspectDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsInspectingDoc(true);
      toast.info({
        title: `Inspecting ${file.name}...`,
        description: 'Analyzing Form 2-T contract terms and BIC compliance rules.'
      });

      const text = await file.text();
      const res = await fetch('/api/voice-agent/inspect-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content: text })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Ensure active conversation session
        let targetSessionId = activeSessionId;
        const userMsg: NoraConversationMessage = {
          id: `msg_doc_u_${Date.now()}`,
          sender: 'user',
          text: `Attached Document: ${file.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const agentMsg: NoraConversationMessage = {
          id: `msg_doc_a_${Date.now()}`,
          sender: 'agent',
          text: result.displayAnalysis || result.spokenSummary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchedItems: result.matchedItems
        };

        if (!targetSessionId) {
          targetSessionId = `sess_${Date.now()}`;
          const newSession: NoraConversationSession = {
            id: targetSessionId,
            title: `Document: ${file.name}`,
            category: 'Contract Inspection',
            preview: result.spokenSummary,
            timestamp: 'Just Now',
            dateGroup: 'Today',
            messages: [userMsg, agentMsg]
          };
          setActiveSessionId(targetSessionId);
          setConversationHistory(prev => [newSession, ...prev]);
        } else {
          setConversationHistory(prev =>
            prev.map(s => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  preview: result.spokenSummary,
                  timestamp: 'Just Now',
                  dateGroup: 'Today',
                  messages: [...s.messages, userMsg, agentMsg]
                };
              }
              return s;
            })
          );
        }

        if (result.matchedItems && result.matchedItems.length > 0) {
          setActiveMatchedItems(result.matchedItems);
        }
        if (result.evidenceCard) {
          setLatestActionCard(result.evidenceCard);
        }

        toast.success({
          title: 'Document Inspection Complete',
          description: `Extracted terms for ${result.extractedFields?.propertyAddress || file.name}`
        });

        speakAssistantResponse(result.spokenSummary);
      }
    } catch (err: any) {
      console.error('Document inspection error:', err);
      toast.error({ title: 'Inspection Failed', description: err.message });
    } finally {
      setIsInspectingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchConnectionStatuses = async () => {
    const sessionToken = typeof window !== 'undefined' ? (localStorage.getItem('shapework_session_token') || localStorage.getItem('token') || '') : '';
    const email = state.activeProfile?.email || 'ryan@nestrealty.com';
    const authHeaders: Record<string, string> = {
      'x-workspace-id': state.workspaceId || 'nest-realty-demo',
      'x-user-role': state.activeProfile?.role || 'regional_leader',
      'x-user-email': email,
      ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : { 'Authorization': `Bearer ${email}` })
    };

    try {
      const gRes = await fetch('/api/integrations/google/status', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (gRes.ok) setGoogleConn(await gRes.json());
    } catch (e) {}

    try {
      const mRes = await fetch('/api/integrations/microsoft/status', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (mRes.ok) setMicrosoftConn(await mRes.json());
    } catch (e) {}

    try {
      const sRes = await fetch('/api/integrations/slack/status', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (sRes.ok) setSlackConn(await sRes.json());
    } catch (e) {}

    try {
      const rRes = await fetch('/api/integrations/rechat/status', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (rRes.ok) setRechatConn(await rRes.json());
    } catch (e) {}

    try {
      const dRes = await fetch('/api/auth/dotloop/status', {
        headers: authHeaders,
        credentials: 'include'
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        setDotloopConn({ connected: dData.status === 'connected' || dData.status === 'demo_connected' || dData.record?.status === 'connected' || dData.record?.status === 'demo_connected' });
      }
    } catch (e) {}

    // Also sync unified OAuth providers matrix
    try {
      const provRes = await fetch('/api/auth/providers');
      if (provRes.ok) {
        const pData = await provRes.json();
        if (pData.providers && Array.isArray(pData.providers)) {
          let count = 0;
          pData.providers.forEach((item: any) => {
            const isConn = item.status === 'connected' || item.status === 'demo_connected';
            if (isConn) count++;
            if (item.provider === 'rechat') setRechatConn({ connected: isConn });
            if (item.provider === 'dotloop') setDotloopConn({ connected: isConn });
            if (item.provider === 'google') setGoogleConn((prev: any) => ({ ...prev, connected: isConn }));
            if (item.provider === 'slack') setSlackConn((prev: any) => ({ ...prev, connected: isConn }));
          });
          setConnectedCount(count);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchConnectionStatuses();
    loadTelephonyCalls();
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

  // Automatically sync micState with voiceAgent turn-taking lifecycle
  useEffect(() => {
    if (voiceAgent.status === 'listening' || voiceAgent.status === 'collecting' || voiceAgent.status === 'finalizing') {
      setMicState('listening');
    } else if (voiceAgent.status === 'thinking') {
      setMicState('processing');
    } else if (voiceAgent.status === 'error') {
      setMicState('error');
    } else if (voiceAgent.status === 'idle' || voiceAgent.status === 'cancelled' || voiceAgent.status === 'speaking') {
      setMicState('idle');
    }
  }, [voiceAgent.status]);

  const startVoiceInput = async (options?: { openDrawer?: boolean }) => {
    stopAssistantSpeaking();
    setMicState('requesting');

    // Explicitly prompt for browser microphone permission on direct user click gesture
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }).catch(async () => {
          // Fallback to baseline audio constraint if hardware fails on advanced audio constraints
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        });

        if (voiceAgent.setMediaStream) {
          voiceAgent.setMediaStream(stream);
        }
      } catch (err: any) {
        console.warn('[Microphone Permission Request Error]:', err);
        setMicState('error');
        setMicErrorMsg(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Microphone access was blocked. Please click the lock or microphone icon in your browser address bar to allow microphone access.'
            : 'Unable to access your microphone. Please check your audio input settings.'
        );
        return;
      }
    }

    if (options?.openDrawer !== false) {
      setShowVoiceDrawer(true);
    }
    voiceAgent.listen();
    setMicState('listening');
  };

  const stopVoiceInput = (manualStop = true) => {
    if (manualStop) {
      voiceAgent.cancel();
    } else {
      voiceAgent.stopListening();
    }
    setMicState('idle');
  };

  const getConnectionDetails = (appId: string) => {
    switch (appId) {
      case 'google_workspace':
      case 'google_calendar':
      case 'google_drive':
        return {
          id: 'google_workspace',
          displayName: 'Google Workspace (asknora@nestrealty.com)',
          shortName: 'Google Workspace',
          accountEmail: 'asknora@nestrealty.com',
          connected: true,
          scopes: googleConn.scopes || ['Gmail (asknora@nestrealty.com)', 'Calendar', 'Drive'],
          lastSync: 'Live',
          access: ['Nora Operational Mailbox (asknora@nestrealty.com)', 'Send automated password setup and welcome notifications', 'Read calendar events to coordinate listing dates', 'Verify document checklists in Google Drive'],
          noAccess: ['Access your personal Google Account password', 'Modify or delete arbitrary files', 'Access payment credentials'],
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
          connected: rechatConn.connected,
          scopes: ['Contacts Read/Write', 'MLS Listings Sync', 'Deals Pipeline'],
          lastSync: rechatConn.connected ? 'Active Sync' : 'N/A',
          access: ['Sync contact details & pipeline status', 'Trigger automated workflow campaigns', 'Active MLS listing sync'],
          noAccess: ['Directly modify password database'],
          connectUrl: '/api/auth/rechat/connect',
          disconnectUrl: '/api/auth/rechat/disconnect',
          syncUrl: '/api/integrations/rechat/sync'
        };
      case 'dotloop':
        return {
          id: 'dotloop',
          displayName: 'Dotloop Transactions',
          shortName: 'Dotloop',
          connected: dotloopConn.connected,
          scopes: ['Loops Read/Write', 'Profiles Read', 'Account Read'],
          lastSync: dotloopConn.connected ? 'Active Sync' : 'N/A',
          access: ['Sync transaction loops and folders', 'Validate MLS and compliance sheets', 'NCREC Form 2-T auditing'],
          noAccess: ['Sign signature documents on your behalf'],
          connectUrl: '/api/auth/dotloop/connect',
          disconnectUrl: '/api/auth/dotloop/disconnect',
          syncUrl: '/api/esignature/dotloop/loops'
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
  const [deadlineIsFlexible, setDeadlineIsFlexible] = useState(false);
  const [property, setProperty] = useState('');
  const [flexMlsStatus, setFlexMlsStatus] = useState<'flex_live' | 'pre_mls' | 'unknown'>('flex_live');
  const [mlsNumber, setMlsNumber] = useState('');
  const [price, setPrice] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>(['1-Page Property Flyer (8.5x11)']);
  const [marketingEvaluation, setMarketingEvaluation] = useState<any | null>(null);
  const [requesterName, setRequesterName] = useState(state.activeProfile?.name || 'Jessica Keenan');
  const [requesterEmail, setRequesterEmail] = useState(state.activeProfile?.email || 'jessica.keenan@nestrealty.com');
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
      const sessionToken = typeof window !== 'undefined' ? (localStorage.getItem('shapework_session_token') || localStorage.getItem('token') || '') : '';
      const email = state.activeProfile?.email || 'ryan@nestrealty.com';
      const res = await fetch('/api/ops/requests', {
        headers: {
          'x-workspace-id': state.workspaceId || 'nest-realty-demo',
          'x-user-role': state.activeProfile?.role || 'regional_leader',
          'x-user-email': email,
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : { 'Authorization': `Bearer ${email}` })
        },
        credentials: 'include'
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

  // Submit Intake Form (Calls Shared NORA Marketing Intake Orchestrator for property/marketing requests)
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !property.trim() && !title.trim()) {
      toast.warning({ title: 'Missing Required Fields', description: 'Please provide request details or property address.' });
      return;
    }

    try {
      // 1. Call Shared Server-Side Marketing Intake Orchestrator
      const marketingRes = await fetch('/api/nora/marketing-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'ws_wilmington',
          'x-user-id': state.activeProfile?.id || 'dir_ryan_crecelius_0',
          'x-user-email': requesterEmail,
          'x-user-name': requesterName
        },
        body: JSON.stringify({
          propertyAddress: property || undefined,
          flexMlsStatus,
          mlsNumber: mlsNumber || undefined,
          deliverables: selectedDeliverables,
          neededByDate: deadline || undefined,
          deadlineIsFlexible,
          price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : undefined,
          squareFootage: squareFootage ? parseFloat(squareFootage.replace(/[^0-9.]/g, '')) : undefined,
          bedrooms: bedrooms ? parseFloat(bedrooms) : undefined,
          bathrooms: bathrooms ? parseFloat(bathrooms) : undefined,
          propertyDescription: description || title,
          notes: `Submitted via Ask NORA Dashboard by ${requesterName} (${requesterEmail}). Urgency: ${urgency}`
        })
      });

      if (marketingRes.ok) {
        const evalData = await marketingRes.json();
        setMarketingEvaluation(evalData);
        toast.success({ 
          title: evalData.readinessStatus === 'ready_for_review' ? 'Marketing Staged for Review' : 'Marketing Intake Captured', 
          description: evalData.webResponse?.nextAction || 'Request submitted successfully.' 
        });
        
        // Refresh requests list
        fetchRequests();
        setShowIntakeModal(false);
      } else {
        // Fallback to standard ops request if marketing route returns error
        const res = await fetch('/api/ops/requests/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': state.workspaceId || 'nest-realty-demo'
          },
          body: JSON.stringify({
            title: title || `${property || 'Listing'} Marketing Request`,
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
          setShowIntakeModal(false);
          fetchRequests();
        }
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
          actorEmail: state.activeProfile?.email || 'jessica.keenan@nestrealty.com',
          actorName: state.activeProfile?.name || 'Jessica Keenan'
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

      {/* Ask Nora Workspace with ChatGPT-style Right Drawer */}
      {(mode === 'search_only' || mode === 'full') && (
        <div className={`relative rounded-3xl transition-all duration-300 ${showHistoryDrawer ? 'xl:pr-96' : 'pr-0'}`}>
          {/* Main Area: Hero vs Active Conversation */}
          <div className="w-full relative z-10">
            {!activeSession ? (
              /* Clean Starter Hero State (NO ongoing chat messages) */
              <div 
                className="max-w-3xl mx-auto space-y-6 pt-8 pb-10 text-center" 
                data-testid="ask-nest-ops-hero"
              >
                {/* Flowing MP4 Orb — Central Interactive & State Visualizer */}
                <div className="relative group flex flex-col items-center">
                  {/* Soft Glowing Orb Anchor Halo */}
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-radial from-[#00635C]/25 via-[#E8C48F]/15 to-transparent blur-3xl pointer-events-none -z-10"
                    style={{
                      animation: 'causticDrift1 20s ease-in-out infinite alternate',
                      willChange: 'transform, opacity'
                    }}
                  />
                  <NestOrbVisualizer
                    size="responsive"
                    testId="ask-nest-ops-orb"
                    state={micState === 'listening' ? 'listening' : micState === 'processing' ? 'processing' : isSpeaking ? 'speaking' : micState === 'error' ? 'error' : 'idle'}
                    videoSrc={orbVideoSrc}
                    interactive={true}
                    onClick={micState === 'listening' ? stopVoiceInput : startVoiceInput}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                  />
                </div>

                {/* Dynamic Copy by Assistant State */}
                {micState === 'idle' && !activeQuery && !activeContractSession && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h2 
                        className="font-serif font-medium text-3xl md:text-4xl text-[#01362D] tracking-tight"
                        data-testid="ask-nest-ops-heading"
                      >
                        Ask Nora
                      </h2>
                      <p className="text-sm text-stone-600 font-sans">
                        Ask anything. Get the work done.
                      </p>
                    </div>

                    {/* 4 Lightweight Default Suggestion Chips */}
                    <div className="flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto pt-1">
                      {[
                        { label: 'What needs my attention?', prompt: 'What needs my attention today?' },
                        { label: 'Write an Offer', prompt: 'I need to write an offer' },
                        { label: 'Check open requests', prompt: 'Check open requests' },
                        { label: 'Summarize today', prompt: 'Summarize today' }
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskPrompt(chip.prompt)}
                          className="px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-stone-200/80 hover:border-[#00635C]/40 rounded-full text-xs font-medium text-stone-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:text-[#00635C]"
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
                    <p className="text-sm italic text-stone-600 max-w-md mx-auto min-h-[24px]">
                      “{voiceAgent.interimTranscript || chatPrompt || 'What needs my attention today?'}”
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
                    className="w-full p-2.5 bg-white/85 backdrop-blur-xl border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-2xl flex items-center gap-3 transition-all hover:border-[#00635C] focus-within:border-[#00635C] focus-within:ring-3 focus-within:ring-[#00635C]/15 focus-within:bg-white"
                  >
                    <input 
                      id="ask-nest-ops-main-input"
                      type="text"
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder="Ask Nora anything..."
                      className="flex-1 bg-transparent border-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none py-1.5 px-2 font-sans"
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleInspectDocument}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 shrink-0 pr-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isInspectingDoc}
                        title="Attach / Inspect Form 2-T Contract or PDF"
                        aria-label="Attach Document"
                        className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-[#00635C] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Paperclip className={`w-4 h-4 ${isInspectingDoc ? 'animate-spin text-[#00635C]' : ''}`} />
                      </button>

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

                  {/* Hands-Free & Tools Status Line */}
                  <div className="text-center pt-3 select-none flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isWakeWordActive;
                        setIsWakeWordActive(nextState);
                        toast.info({
                          title: nextState ? 'Hands-Free Active' : 'Hands-Free Paused',
                          description: nextState ? 'Say "Hey Nest" or "Hey NORA" to speak.' : 'Click mic to talk.'
                        });
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 font-sans cursor-pointer transition-colors inline-flex items-center gap-1.5"
                    >
                      <span className={`w-2 h-2 rounded-full ${micState === 'listening' ? 'bg-rose-500 animate-ping' : isWakeWordActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                      <span>{isWakeWordActive ? '● Hands-free on · Say “Hey Nest” or “Hey NORA”' : 'Hands-free off · Click mic to talk'}</span>
                    </button>
                    <span className="text-stone-300">•</span>
                    <button
                      type="button"
                      onClick={() => setShowConnectedToolsDrawer(true)}
                      className="text-xs text-stone-500 hover:text-[#00635C] font-mono cursor-pointer transition-colors inline-flex items-center gap-1 hover:underline"
                      title="Manage Connected OAuth Tools"
                    >
                      <span>{connectedCount} {connectedCount === 1 ? 'tool' : 'tools'} connected</span>
                      <span className="text-[10px] text-[#00635C] font-bold">↗</span>
                    </button>
                  </div>

                  {/* Nora Quick Action Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-3 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setBrowserVmQuery('NCREC Rule 58A earnest money and due diligence requirements');
                        setShowBrowserVmDrawer(true);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white text-stone-800 hover:text-[#00635C] hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs border border-stone-200"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>🌐 Search Web with VM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskPrompt('What are NCREC rules on earnest money and due diligence?')}
                      className="px-3 py-1.5 rounded-full bg-white text-stone-700 hover:text-[#00635C] hover:bg-stone-50 text-xs font-medium transition cursor-pointer shadow-2xs border border-stone-200"
                    >
                      ⚖️ NCREC Form 2-T Rules
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskPrompt('Look up New Hanover County GIS tax parcels and flood zones')}
                      className="px-3 py-1.5 rounded-full bg-white text-stone-700 hover:text-[#00635C] hover:bg-stone-50 text-xs font-medium transition cursor-pointer shadow-2xs border border-stone-200"
                    >
                      🏛️ New Hanover GIS Tax Map
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskPrompt('Schedule me a meeting')}
                      className="px-3 py-1.5 rounded-full bg-white text-stone-700 hover:text-[#00635C] hover:bg-stone-50 text-xs font-medium transition cursor-pointer shadow-2xs border border-stone-200"
                    >
                      📅 Schedule Meeting
                    </button>
                  </div>

                  {/* Real Estate News & Industry Developments — Worth Knowing Preview */}
                  <div className="pt-6 max-w-2xl mx-auto w-full text-left">
                    <WorthKnowingDashboardModule
                      workspaceId={currentLocation.id}
                      onNavigateNews={() => {
                        if (state && typeof state.setCurrentTab === 'function') {
                          state.setCurrentTab('News');
                        }
                      }}
                      onAskNora={(item) => {
                        handleAskPrompt(`What are the key implications for Nest Realty regarding: "${item.title}"?`);
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Active Ongoing Conversation View with Nora */
              <div className="max-w-3xl mx-auto space-y-6 pt-2 pb-16 text-left animate-fade-in">
                {/* Active Conversation Top Bar */}
                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:text-[#00635C] hover:bg-stone-200 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      title="Back to New Conversation"
                    >
                      <Plus className="w-4 h-4 text-[#00635C]" />
                      <span>New Chat</span>
                    </button>
                    <div className="h-6 w-[1px] bg-stone-200"></div>
                    <NestOrbVisualizer size="sm" customSize={32} state={micState === 'listening' ? 'listening' : micState === 'processing' ? 'processing' : isSpeaking ? 'speaking' : 'idle'} />
                    <div>
                      <h3 className="font-serif font-bold text-sm text-[#01362D]">{activeSession.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ● NORA Active
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{activeSession.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="space-y-4">
                  {activeSession.messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col space-y-1.5 ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[90%] p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#00635C] text-white rounded-br-2xs shadow-xs font-sans font-medium'
                            : 'bg-white border border-stone-200 text-stone-900 shadow-xs rounded-bl-2xs font-sans'
                        }`}
                      >
                        {msg.sender === 'agent' && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-100">
                            <NestOrbVisualizer size="xs" customSize={20} />
                            <span className="font-bold text-xs text-[#01362D]">NORA</span>
                          </div>
                        )}
                        <FormattedMessageContent text={msg.text} isAgent={msg.sender === 'agent'} />

                        {/* Missing Workflow SOP Studio Action Card */}
                        {msg.sender === 'agent' && msg.text.includes('No Established Workflow Found') && (
                          <div className="mt-3 pt-3 border-t border-stone-100">
                            <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-purple-950">Author Workflow in SOP Studio</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                    New Procedure
                                  </span>
                                </div>
                                <p className="text-[11px] text-purple-800/80 mt-0.5 font-sans">
                                  Launch SOP Studio with a drafted template to define steps, roles, and automated tool integrations.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const match = msg.text.match(/\*\*"([^"]+)"\*\*/);
                                  const topic = match ? match[1] : 'Residential Tenant Evictions';
                                  handleOpenSopStudio('new', topic);
                                }}
                                className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                              >
                                <span>Create SOP in Studio</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Nora Meeting Clarification & Booking Cards (Awaiting Details / Staging Only) */}
                        {msg.sender === 'agent' && (
                          ((msg as any).intentType === 'ACTION_DETAILS_REQUIRED' || 
                           (msg as any).intentType === 'CLARIFY_MEETING_SCHEDULE' || 
                           (msg as any).intentType === 'ACTION_AWAITING_CONFIRMATION' || 
                           ((msg as any).meetingWizard && (msg as any).intentType !== 'ACTION_COMPLETED')) &&
                          (msg as any).intentType !== 'ACTION_COMPLETED' &&
                          !msg.text.includes('Google Calendar Meeting Dispatched') &&
                          !msg.text.includes('Scheduled "') &&
                          !msg.text.includes("I've scheduled") &&
                          !msg.text.includes("I have scheduled")
                        ) && (
                          <div className="mt-3 pt-2">
                            <NoraMeetingClarificationCards
                              initialDraft={(msg as any).meetingWizard || {
                                requesterName: (state as any)?.currentUser?.name || 'Ryan Crecelius',
                                targetAudience: msg.text.includes('Wilmington') ? 'all agents and staff in the wilmington office' : (msg.text.includes('Carolina Beach') ? 'Carolina Beach office team' : (msg.text.includes('James Fort') ? 'James Fort' : ''))
                              }}
                              onSendChatMessage={(text) => handleAskPrompt(text)}
                            />
                          </div>
                        )}

                        {/* Nora Autonomous Web Research & VM Browser Agent Card (Apple Light Mode) */}
                        {msg.sender === 'agent' && (msg.text.includes('Verified via Nora Virtual Machine Browser Agent') || msg.text.includes('Chromium 128 Sandbox VM') || (msg as any).intentType === 'WEB_RESEARCH_BROWSER_VM' || (msg as any).webResearchQuery) && (
                          <div className="mt-3 pt-2">
                            <div className="p-3.5 bg-[#FAF9F6] text-stone-900 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5 text-left">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#00635C] border border-emerald-200 flex items-center justify-center shadow-2xs">
                                    <Globe className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold font-serif text-[#01362D] tracking-tight">Live Web Grounding • Chromium Sandbox VM</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <span className="text-[10px] text-stone-500 font-mono">100% Deterministic • Zero Hallucinations</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const searchQ = (msg as any).webResearchQuery || msg.text.replace(/^[#\s*]+/, '').split('\n')[0] || 'NCREC Rule 58A earnest money and due diligence requirements';
                                    setBrowserVmQuery(searchQ);
                                    setShowBrowserVmDrawer(true);
                                  }}
                                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#01362D] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Live VM Trace</span>
                                </button>
                              </div>

                              <div className="p-2.5 bg-white rounded-xl border border-stone-200/90 text-[11px] text-stone-600 font-mono flex items-center justify-between shadow-2xs">
                                <span className="truncate">Source: NCREC Statutory Rulebook & County GIS Portal</span>
                                <span className="text-[#00635C] shrink-0 font-bold">Confidence: 99.8%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Form 2-T Sample Listings Quick Draft */}
                        {msg.sender === 'agent' && msg.text.includes('NC REALTORS® Form 2-T Offer Drafting Copilot') && (
                          <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                            <span className="text-[11px] font-bold text-[#00635C] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Sample Active Listings (Click to Pre-fill Draft)</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { title: '312 Mayfaire Way', price: '$725,000', buyer: 'David & Sarah Miller', emd: '$10,000 EMD / $15,000 DD' },
                                { title: '104 Coastal Drive', price: '$450,000', buyer: 'James Peterson', emd: '$5,000 EMD / $5,000 DD' }
                              ].map((sample, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleAskPrompt(`Draft offer on ${sample.title} for ${sample.buyer} at ${sample.price} with ${sample.emd}`)}
                                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-stone-900 group-hover:text-[#00635C]">{sample.title}</span>
                                    <span className="text-[10px] font-mono font-bold text-emerald-800">{sample.price}</span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 mt-0.5">{sample.buyer} • {sample.emd}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matched Records / Action Cards */}
                        {msg.matchedItems && msg.matchedItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                            <div className="text-[11px] font-bold text-[#00635C] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {msg.matchedItems.some((i: any) => i.type === 'task' || i.type === 'ticket' || i.type === 'transaction')
                                  ? 'Live Operational Records & Workboard Actions'
                                  : 'Matched Operational Knowledge'} ({msg.matchedItems.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {msg.matchedItems.map((item: any, mIdx: number) => (
                                <div key={item.id || mIdx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-white transition-all space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xs text-stone-900">{item.title}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                      item.badgeColor === 'purple'
                                        ? 'bg-purple-100 text-purple-800'
                                        : item.badgeColor === 'amber'
                                          ? 'bg-amber-100 text-amber-800'
                                          : item.badgeColor === 'blue'
                                            ? 'bg-sky-100 text-sky-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {item.badge || item.type}
                                    </span>
                                  </div>
                                  {item.subtitle && <p className="text-[10px] text-stone-500">{item.subtitle}</p>}
                                  {(item.actionText || item.actionLabel) && (
                                    <div className="pt-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleExecuteItemAction(item)}
                                        className="px-2.5 py-1 bg-[#00635C] text-white text-[10px] font-bold rounded-lg hover:bg-[#01362D] cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        <span>{item.actionText || item.actionLabel}</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related SOP Policy Card (Disambiguated from Live Operational Data) */}
                        {msg.relatedSop && (
                          <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-[#00635C]" />
                              <div>
                                <div className="text-[11px] font-bold text-stone-900">{msg.relatedSop.title}</div>
                                <div className="text-[10px] text-stone-600">Owner: {msg.relatedSop.processOwner} • {msg.relatedSop.stepCount} Steps</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenSopStudio(msg.relatedSop.id, msg.relatedSop.title)}
                              className="px-2.5 py-1 bg-[#00635C] text-white text-[10px] font-bold rounded-lg hover:bg-[#01362D] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>View SOP Policy</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {/* Nora Deliberate Cognitive Reasoning Badge & Actions */}
                        {msg.sender === 'agent' && (
                          <NoraReasoningVisualizer
                            reasoningSteps={msg.reasoningSteps}
                            thoughtDurationMs={msg.thoughtDurationMs}
                            actions={msg.actions}
                            onExecuteAction={(act) => handleExecuteTurnAction(act)}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-sans px-1">
                        {msg.sender === 'user' ? (state?.user?.name || 'You') : 'NORA'} • {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {/* Live Reasoning or Typing Animation Bubble */}
                  {voiceAgent.status === 'thinking' && (
                    <div className="flex flex-col space-y-1.5 items-start animate-fadeIn">
                      {voiceAgent.transcriptHistory.filter((m: any) => m.sender === 'user').length <= 1 ? (
                        <div className="max-w-[90%] p-4 rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-xs rounded-bl-2xs font-sans">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-100">
                            <NestOrbVisualizer size="xs" customSize={20} />
                            <span className="font-bold text-xs text-[#01362D]">NORA</span>
                          </div>
                          <NoraReasoningVisualizer isLive={true} activeStage="retrieve" />
                        </div>
                      ) : (
                        <div className="max-w-[90%] p-3.5 rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-xs rounded-bl-2xs font-sans">
                          <div className="flex items-center gap-2.5">
                            <NestOrbVisualizer size="xs" customSize={18} />
                            <div className="flex items-center gap-1.5 py-1 px-1">
                              <span className="w-2 h-2 rounded-full bg-[#00635C] animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-2 h-2 rounded-full bg-[#00635C] animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-2 h-2 rounded-full bg-[#00635C] animate-bounce" />
                            </div>
                            <span className="text-xs font-medium text-stone-500 font-sans ml-1">
                              Nora is thinking...
                            </span>
                          </div>
                        </div>
                      )}
                      <span className="text-[10px] text-stone-400 font-sans px-1">
                        NORA • Thinking...
                      </span>
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer Bar for Instant One-Click Confirmation */}
                {activePendingMeeting && (
                  <div 
                    className="sticky bottom-20 z-20 w-full mb-3 p-3.5 bg-white/95 backdrop-blur-xl border border-emerald-300/80 shadow-[0_12px_40px_rgba(0,99,92,0.16)] rounded-2xl animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                    data-testid="sticky-meeting-action-bar"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-[#00635C] flex items-center justify-center shadow-xs shrink-0 relative">
                        <Calendar className="w-5 h-5 text-[#00635C]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-stone-900 font-sans">
                            {activePendingMeeting.title}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                            Awaiting Confirmation
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-sans mt-0.5">
                          {activePendingMeeting.date} {activePendingMeeting.time ? `• ${activePendingMeeting.time}` : ''} • Google Meet (AskNora@nestrealty.com)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExecuteTurnAction(activePendingMeeting.cancelAction)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-[1.01]"
                        data-testid="sticky-cancel-button"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecuteTurnAction(activePendingMeeting.confirmAction)}
                        className="px-5 py-2.5 bg-[#00635C] hover:bg-[#004d47] active:scale-98 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-[#004d47]"
                        data-testid="sticky-confirm-schedule-button"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Confirm &amp; Schedule</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Follow-up Input Bar */}
                <div className="pt-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatPrompt.trim()) return;
                      handleAskPrompt(chatPrompt.trim());
                    }}
                    className="w-full p-2.5 bg-white/85 backdrop-blur-xl border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-2xl flex items-center gap-3 transition-all hover:border-[#00635C] focus-within:border-[#00635C] focus-within:ring-3 focus-within:ring-[#00635C]/15 focus-within:bg-white"
                  >
                    <input
                      type="text"
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder="Ask NORA a follow-up question..."
                      className="flex-1 bg-transparent border-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none py-1.5 px-2 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isInspectingDoc}
                      title="Attach / Inspect Form 2-T Contract or PDF"
                      aria-label="Attach Document"
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-[#00635C] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Paperclip className={`w-4 h-4 ${isInspectingDoc ? 'animate-spin text-[#00635C]' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={micState === 'listening' ? stopVoiceInput : startVoiceInput}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        micState === 'listening' ? 'bg-rose-600 text-white animate-pulse' : 'bg-stone-50 hover:bg-stone-100 text-[#00635C]'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={!chatPrompt.trim()}
                      className="p-2.5 bg-[#00635C] hover:bg-[#01362D] disabled:opacity-40 text-white rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Right Drawer: Conversation History Column (Under Top Bar) */}
          {showHistoryDrawer ? (
            <aside
              className="fixed top-14 bottom-0 right-0 w-80 sm:w-96 bg-[#FAF9F6] border-l border-stone-200 z-30 shadow-xl flex flex-col font-sans transition-all animate-slide-in-right text-left"
              data-testid="conversation-history-drawer"
            >
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-stone-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#00635C]" />
                    <h3 className="font-serif font-bold text-sm text-[#01362D]">Conversation History</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryDrawer(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Close History Drawer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* + New Conversation Button */}
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="w-full py-2.5 px-4 bg-[#00635C] hover:bg-[#01362D] text-white font-sans text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Conversation</span>
                </button>

                {/* Search History */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search past conversations..."
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#00635C]"
                  />
                </div>
              </div>

              {/* Grouped History List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {['Today', 'Yesterday', 'Previous 7 Days', 'Earlier'].map((groupName) => {
                  const groupItems = filteredHistory.filter(s => s.dateGroup === groupName);
                  if (groupItems.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-1.5">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2">
                        {groupName}
                      </div>

                      <div className="space-y-1">
                        {groupItems.map((sess) => (
                          <div
                            key={sess.id}
                            onClick={() => handleSelectSession(sess)}
                            className={`w-full p-2.5 rounded-xl transition-all border group relative cursor-pointer ${
                              activeSessionId === sess.id
                                ? 'bg-white border-[#00635C] shadow-xs ring-1 ring-[#00635C]/20'
                                : 'bg-transparent border-transparent hover:bg-white hover:border-stone-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-xs text-stone-900 truncate flex-1 font-sans">
                                {sess.title}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                {sess.timestamp}
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 font-sans leading-tight">
                              {sess.preview}
                            </p>

                            {/* Hover Delete Action */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, sess.id)}
                              className="absolute right-2 top-2 p-1 rounded bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredHistory.length === 0 && (
                  <div className="text-center py-10 text-stone-400 text-xs font-sans">
                    No conversations match your search.
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500">
                <span className="font-mono text-[11px]">{conversationHistory.length} Sessions</span>
                {conversationHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="text-stone-400 hover:text-rose-600 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </aside>
          ) : (
            /* Floating Reopen History Trigger */
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className="fixed top-18 right-4 z-30 px-3.5 py-2 bg-white/95 backdrop-blur border border-stone-200 rounded-xl shadow-md text-stone-700 hover:text-[#00635C] hover:border-[#00635C] flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all hover:scale-105"
              title="Open Conversation History"
            >
              <History className="w-4 h-4 text-[#00635C]" />
              <span>Conversation History</span>
              <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {conversationHistory.length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* KPI Neumorphic Row & Activity Dashboard View */}
      {mode === 'activity_only' && (
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
              { id: 'gmail', name: 'Gmail (asknora@)', desc: 'Nora Email Intake', status: 'connected' },
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
              <span className="font-serif font-black text-xs block leading-none">Ask Nora</span>
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
      


      {/* End of Ask Nora Hub Content */}

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
                <h3 className="font-serif font-black text-sm text-[#1e2520]">Ask Nora Intake</h3>
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
                {/* Flex MLS Status Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Flex MLS Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlexMlsStatus('flex_live')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                        flexMlsStatus === 'flex_live'
                          ? 'bg-[var(--sw-green-900)] text-white border-[var(--sw-green-900)] shadow-sm'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Live in MLS
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlexMlsStatus('pre_mls')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                        flexMlsStatus === 'pre_mls'
                          ? 'bg-[var(--sw-green-900)] text-white border-[var(--sw-green-900)] shadow-sm'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      Pre-MLS (Draft)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlexMlsStatus('unknown')}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                        flexMlsStatus === 'unknown'
                          ? 'bg-[var(--sw-green-900)] text-white border-[var(--sw-green-900)] shadow-sm'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      General Ops
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Property Address</label>
                    <input 
                      type="text" 
                      value={property}
                      onChange={(e) => setProperty(e.target.value)}
                      placeholder="e.g. 742 Lumina Ave, Wrightsville Beach"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                      required
                    />
                  </div>
                  {flexMlsStatus === 'flex_live' ? (
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] uppercase text-stone-500 block">MLS Number (Optional)</label>
                      <input 
                        type="text" 
                        value={mlsNumber}
                        onChange={(e) => setMlsNumber(e.target.value)}
                        placeholder="e.g. 1004523"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] uppercase text-stone-500 block">Planned List Price</label>
                      <input 
                        type="text" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. $1,950,000"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Conditional Pre-MLS Specification Inputs */}
                {flexMlsStatus === 'pre_mls' && (
                  <div className="grid grid-cols-3 gap-2 bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/80">
                    <div className="space-y-1">
                      <label className="font-bold text-[9px] uppercase text-stone-500 block">Square Footage</label>
                      <input 
                        type="text" 
                        value={squareFootage}
                        onChange={(e) => setSquareFootage(e.target.value)}
                        placeholder="e.g. 3600"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[9px] uppercase text-stone-500 block">Bedrooms</label>
                      <input 
                        type="number" 
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        placeholder="e.g. 4"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[9px] uppercase text-stone-500 block">Bathrooms</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        placeholder="e.g. 3.5"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Property Description & Highlights</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide key features, finishes, upgrades, or notes for Eduardo & Melissa..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] min-h-[70px] text-xs leading-normal"
                    required
                  />
                </div>

                {/* Deliverables Checkboxes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Requested Deliverables</label>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      '1-Page Property Flyer (8.5x11)',
                      'Instagram Story (9:16)',
                      'Jumbo Direct Mail Postcard',
                      'Feature Sheet Presentation'
                    ].map((deliv) => (
                      <label key={deliv} className="flex items-center gap-2 cursor-pointer text-stone-700">
                        <input
                          type="checkbox"
                          checked={selectedDeliverables.includes(deliv)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeliverables([...selectedDeliverables, deliv]);
                            } else {
                              setSelectedDeliverables(selectedDeliverables.filter(d => d !== deliv));
                            }
                          }}
                          className="rounded text-[var(--sw-green-900)] focus:ring-[var(--sw-green-900)]"
                        />
                        <span>{deliv}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Needed By Date</label>
                    <input 
                      type="date" 
                      value={deadline}
                      disabled={deadlineIsFlexible}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={`w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none text-xs ${deadlineIsFlexible ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-[11px] text-stone-700 font-medium">
                    <input
                      type="checkbox"
                      checked={deadlineIsFlexible}
                      onChange={(e) => setDeadlineIsFlexible(e.target.checked)}
                      className="rounded text-[var(--sw-green-900)] focus:ring-[var(--sw-green-900)]"
                    />
                    <span>Deadline is Flexible</span>
                  </label>
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
                    Submit to Ask NORA
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
                      <span className="text-[9px] text-stone-400 block font-mono">TARGET DUE TIME:</span>
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
                    { id: 'rechat', provider: 'rechat', name: 'Rechat', desc: 'CRM and active MLS listing data.', connected: rechatConn.connected },
                    { id: 'dotloop', provider: 'dotloop', name: 'Dotloop', desc: 'Compliance checks and deal folders.', connected: dotloopConn.connected },
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

      {/* Contact Person Interactive Email & SMS Modal */}
      {showContactPersonModal && selectedPersonForContact && (
        <ContactPersonModal
          isOpen={showContactPersonModal}
          onClose={() => {
            setShowContactPersonModal(false);
            setSelectedPersonForContact(null);
          }}
          person={selectedPersonForContact}
        />
      )}

      {/* Nora Web Research & Chromium Sandbox VM Drawer */}
      <NoraBrowserAgentDrawer
        isOpen={showBrowserVmDrawer}
        onClose={() => setShowBrowserVmDrawer(false)}
        initialQuery={browserVmQuery}
        initialSession={browserVmSession}
        onSendToChat={(text) => handleAskPrompt(text)}
      />

      {/* Telephony & Live Inbound Hotline Modal */}
      {showTelephonyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left font-sans animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00635C]/10 text-[#00635C] flex items-center justify-center font-bold shadow-2xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-stone-900">Inbound Telephony & Retell Hotline</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                      Caller ID Active
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hotline: <strong className="text-stone-700">+1 (910) 507-2047</strong> • Connected to 72 Nest Directory Brokers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTelephonyModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inbound Calls Feed */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-[#E5EFEA]/50 border border-[#00635C]/20 rounded-2xl text-xs text-[#004742] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00635C] shrink-0" />
                  <span>
                    When agents call the hotline, Nora recognizes their number and greets them: <em>"Hello Matt... how are you today? This is Nora..."</em>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {telephonyCalls.map((call) => (
                  <div key={call.callId} className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {call.firstName ? call.firstName[0] : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-stone-900">{call.callerName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/70">
                              {call.fromNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {call.role} • {call.office} • {call.timestamp} ({call.durationSeconds}s)
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {call.callerRecognized ? 'DIRECTORY MATCH' : 'UNREGISTERED'}
                      </span>
                    </div>

                    {/* Summary & Transcript */}
                    <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700 space-y-1.5 font-sans border border-stone-100">
                      {call.conversationGoal && (
                        <p className="text-[11px] font-semibold text-[#00635C]">
                          Goal: {call.conversationGoal}
                        </p>
                      )}
                      <p className="font-medium text-stone-900">
                        <strong>Subject</strong>: {call.summary}
                      </p>
                      <p className="text-[11px] text-stone-600 whitespace-pre-line leading-relaxed font-mono">
                        {call.transcript}
                      </p>
                    </div>

                    {/* Knowledge Used Badges */}
                    {Array.isArray(call.knowledgeUsed) && call.knowledgeUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Knowledge Used:</span>
                        {call.knowledgeUsed.map((k: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] border border-stone-200">
                            <Check className="w-3 h-3 text-[#00635C]" />
                            {k}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* NORA Follow-Up Email Status */}
                    {call.followUpStatus === 'sent' && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-emerald-950">✓ Email Sent</span>
                            {call.followUpSubject && (
                              <span className="text-emerald-800 ml-1.5 font-normal truncate">· {call.followUpSubject}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 shrink-0 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                          {call.followUpRecipient || 'AskNora@nestrealty.com'}
                        </span>
                      </div>
                    )}

                    {call.followUpStatus === 'failed' && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center gap-2 text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Email Delivery Pending · Queued for retry</span>
                      </div>
                    )}

                    {call.followUpStatus === 'suppressed' && (
                      <div className="text-[11px] text-stone-400 italic">
                        Follow-up email suppressed (informational / resolved on call)
                      </div>
                    )}

                    {/* Actions: Send SMS Follow-up */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-stone-500">
                        {call.ticketCreatedId ? `Ticket logged: #${call.ticketCreatedId}` : 'Hotline session'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendSmsFollowUp(call)}
                        disabled={sendingSmsCallId === call.callId || call.smsFollowUpSent}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          call.smsFollowUpSent
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-[#00635C] hover:bg-[#00514B] text-white shadow-2xs'
                        }`}
                      >
                        {sendingSmsCallId === call.callId ? (
                          <span>Sending SMS...</span>
                        ) : call.smsFollowUpSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>SMS Follow-Up Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Send SMS Confirmation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="text-[11px] text-stone-500">
                Webhook endpoint: <code className="font-mono text-stone-700">/api/voice-agent/telephony/inbound-lookup</code>
              </div>
              <button
                type="button"
                onClick={() => setShowTelephonyModal(false)}
                className="px-4 py-2 rounded-xl bg-[#00635C] text-white text-xs font-semibold hover:bg-[#00514B] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Tools & OAuth 2.0 Drawer */}
      <ConnectedToolsDrawer
        isOpen={showConnectedToolsDrawer}
        onClose={() => setShowConnectedToolsDrawer(false)}
        onStatusChange={fetchConnectionStatuses}
      />
    </div>
  );
}
