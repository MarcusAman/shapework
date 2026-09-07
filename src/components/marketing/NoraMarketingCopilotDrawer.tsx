import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Phone,
  User,
  MapPin,
  Clock,
  Play,
  Pause,
  FileText,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Check,
  Copy,
  ChevronRight
} from 'lucide-react';
import { TelephonyCallItem } from './CallsTableView';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';
import { FormattedMessageContent } from '../shared/FormattedMessageContent';
import { NoraReasoningVisualizer } from '../brokerage-ops/NoraReasoningVisualizer';
import { AudioPlaybackManager, selectCognitiveNoiseForQuery } from '../../services/voice-agent/audioPlaybackManager';

export interface NoraMarketingCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  calls: TelephonyCallItem[];
  campaigns?: any[];
  workItems?: any[];
  onOpenTranscriptDrawer?: (call: TelephonyCallItem) => void;
  onAssignToEduardo?: (call: TelephonyCallItem) => void;
  onSendMessageToRequester?: (call: TelephonyCallItem, data?: any) => void;
  onNavigateToSubtab?: (subtab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'nora';
  text: string;
  timestamp: string;
  matchedCalls?: any[];
  workloadSummary?: any;
  suggestedNextSteps?: any[];
}

export const NoraMarketingCopilotDrawer: React.FC<NoraMarketingCopilotDrawerProps> = ({
  isOpen,
  onClose,
  calls = [],
  campaigns = [],
  workItems = [],
  onOpenTranscriptDrawer,
  onAssignToEduardo,
  onSendMessageToRequester,
  onNavigateToSubtab
}) => {
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'nora',
      text: "Hi Marcus, I'm **Nora**. I'm connected to the entire Marketing Intake Console, telephony call logs, and team production queues.\n\nYou can ask me to **find any intake call**, check **open workloads for Eduardo (VA), Melissa, Ann, or Ryan**, or generate **AI next steps** based on real-time listing tasks.",
      timestamp: 'Just now',
      suggestedNextSteps: [
        {
          id: 's_init_1',
          stepNumber: 1,
          actionTitle: 'Check Eduardo (VA) Open Task Queue',
          description: 'View 4 assigned listing packages staged in the VA Production Hub.',
          actionType: 'open_task',
          actionPayload: { subtab: 'va' }
        },
        {
          id: 's_init_2',
          stepNumber: 2,
          actionTitle: 'Find Call for 1916 Walcott Ave',
          description: "Pull up Matt Orr's inbound marketing request and collateral specifications.",
          actionType: 'open_transcript',
          actionPayload: { query: '1916 Walcott' }
        }
      ]
    }
  ]);

  const [activeAudioCallId, setActiveAudioCallId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [messageModalCall, setMessageModalCall] = useState<TelephonyCallItem | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Start cognitive noise effect (crickets, undertaker, heaven_harp, jackpot, keyboard_typing, kaching)
    const chosenNoise = selectCognitiveNoiseForQuery(query);
    const noisePromise = AudioPlaybackManager.playCognitiveNoise(chosenNoise, 5);
    const deliberationPacingPromise = new Promise(resolve => setTimeout(resolve, 6000));

    let fetchedMessage: ChatMessage | null = null;

    try {
      const res = await fetch('/api/ai/nora/marketing-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          fetchedMessage = {
            id: `nora_${Date.now()}`,
            sender: 'nora',
            text: data.result.answerText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchedCalls: data.result.matchedCalls,
            workloadSummary: data.result.workloadSummary,
            suggestedNextSteps: data.result.suggestedNextSteps
          };
        }
      }
    } catch (err) {
      console.warn('Backend query error, executing client fallback:', err);
    }

    // Await both the cognitive noise / deliberation pacing and the backend data
    await Promise.all([noisePromise, deliberationPacingPromise]);

    if (fetchedMessage) {
      setMessages(prev => [...prev, fetchedMessage!]);
      setIsLoading(false);
      return;
    }

    // Client-side fallback resolution
    const q = query.toLowerCase();
    let matched = calls.filter(c =>
      c.propertyAddress.toLowerCase().includes(q) ||
      c.callerName.toLowerCase().includes(q) ||
      (c.transcript && c.transcript.toLowerCase().includes(q))
    );

    if (q.includes('walcott')) {
      matched = calls.filter(c => c.propertyAddress.includes('Walcott'));
    } else if (q.includes('matt')) {
      matched = calls.filter(c => c.callerName.toLowerCase().includes('matt'));
    }

      if (q.includes('va') || q.includes('eduardo') || q.includes('task') || q.includes('workload')) {
        setMessages(prev => [
          ...prev,
          {
            id: `nora_${Date.now()}`,
            sender: 'nora',
            text: "**Eduardo Lovo (Virtual Assistant)** currently has **4 active production tasks** in his queue:\n\n• **2 In Build** (1104 Arboretum Dr, 304 Ocean Blvd)\n• **1 Proof Staged** (990 Inspiration Dr)\n• **1 Completed** (312 Mayfaire Way)\n\nHere is the detailed task breakdown and recommended operational next steps:",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            workloadSummary: {
              personName: 'Eduardo Lovo',
              personRole: 'Virtual Assistant (Design Production)',
              department: 'Marketing Collateral Production',
              openTaskCount: 4,
              countsByStatus: { inProduction: 2, proofSubmitted: 1, readyForReview: 0, completed: 1 },
              tasks: [
                {
                  id: 'VA-001',
                  title: 'Landfall Golf Villa 4-Asset Suite',
                  propertyAddress: '1104 Arboretum Dr, Wilmington NC',
                  priority: 'High',
                  status: 'In Build',
                  targetSla: 'Today 5:00 PM',
                  deliverables: ['Double-Sided Flyer (8.5x11)', 'Glossy Postcard (6x9)', 'Social Story (9:16)', '1:1 Feed Post']
                },
                {
                  id: 'VA-002',
                  title: 'Oceanfront Luxury 5-Asset Suite',
                  propertyAddress: '304 Ocean Blvd, Topsail Beach NC',
                  priority: 'Urgent',
                  status: 'In Build',
                  targetSla: 'Today 5:00 PM',
                  deliverables: ['Double-Sided Flyer (8.5x11)', 'Direct Mail Postcard (6x9)', 'Social Carousel', 'Sign Rider']
                },
                {
                  id: 'VA-003',
                  title: 'Mayfaire Townhome Open House Blast',
                  propertyAddress: '990 Inspiration Drive, Wilmington NC',
                  priority: 'Normal',
                  status: 'Proof Staged',
                  targetSla: 'Today 4:30 PM',
                  deliverables: ['Feature Flyer (8.5x11)', 'Social Story (9:16)']
                }
              ]
            },
            suggestedNextSteps: [
              {
                id: 'step_fb_1',
                stepNumber: 1,
                actionTitle: 'Inspect 1104 Arboretum Dr in VA Hub',
                description: 'Review 1-click Maxa copy blocks and photo assets staged for Eduardo.',
                actionType: 'open_task',
                actionPayload: { subtab: 'va' }
              },
              {
                id: 'step_fb_2',
                stepNumber: 2,
                actionTitle: 'Send Status Update SMS to Jessica Keenan',
                description: 'Notify Jessica that her Landfall collateral suite is in build.',
                actionType: 'send_message',
                actionPayload: { propertyAddress: '1104 Arboretum Dr' }
              }
            ]
          }
        ]);
      } else if (matched.length > 0) {
        const c = matched[0];
        setMessages(prev => [
          ...prev,
          {
            id: `nora_${Date.now()}`,
            sender: 'nora',
            text: `I found the intake call for **${c.propertyAddress}** from **${c.callerName}**:\n\n• **Received**: ${c.timestamp} (Duration: ${c.duration})\n• **Collateral Requested**: Print Flyer, Property Website, Open House Handouts\n\nHere is the call audio card and 1-click execution actions:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchedCalls: [c],
            suggestedNextSteps: [
              {
                id: 'step_call_fb1',
                stepNumber: 1,
                actionTitle: 'Assign Package to VA Eduardo',
                description: 'Send this collateral request directly to the VA Production Hub.',
                actionType: 'assign_va',
                actionPayload: { call: c }
              },
              {
                id: 'step_call_fb2',
                stepNumber: 2,
                actionTitle: 'View Full Verbatim Transcript',
                description: 'Open the right-hand transcript drawer to review call details.',
                actionType: 'open_transcript',
                actionPayload: { call: c }
              }
            ]
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `nora_${Date.now()}`,
            sender: 'nora',
            text: `I searched across all active marketing calls, campaigns, and task queues for **"${query}"**.\n\nHere are some quick operational actions you can take:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedNextSteps: [
              {
                id: 's_fb_1',
                stepNumber: 1,
                actionTitle: 'View VA Production Hub',
                description: 'Jump to the VA Workspace tab to view active task queue.',
                actionType: 'open_task',
                actionPayload: { subtab: 'va' }
              },
              {
                id: 's_fb_2',
                stepNumber: 2,
                actionTitle: 'Browse All Inbound Calls',
                description: 'Open the Calls log table to filter recent recordings.',
                actionType: 'open_task',
              }
            ]
          }
        ]);
      }
      setIsLoading(false);
  };

  const toggleAudio = (call: any) => {
    if (activeAudioCallId === call.id && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setActiveAudioCallId(call.id);
      setIsPlayingAudio(true);
      if (audioRef.current) {
        audioRef.current.src = call.audioUrl || `/api/marketing/calls/${call.id}/audio`;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans text-left" data-testid="nora-marketing-copilot-drawer">
      {/* Audio player */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
      />

      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
        {/* DRAWER HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#00635C] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-serif font-bold text-lg text-emerald-300 shadow-xs">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">Ask Nora</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Live Operations Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Connected to Marketing Intake, Calls Log, and Team Workloads
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRESET PROMPT CHIPS */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Quick Queries:</span>
          {[
            { label: '📞 1916 Walcott Call', q: 'Find the call for 1916 Walcott Ave' },
            { label: '👤 Eduardo (VA) Tasks', q: 'How many open tasks does Eduardo have?' },
            { label: '📋 Melissa Queue', q: "What's on Melissa's plate today?" },
            { label: '🚧 Ann Sign Tickets', q: "Show me Ann's open sign post tickets" }
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSendQuery(chip.q)}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 hover:text-purple-900 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 shadow-2xs whitespace-nowrap transition cursor-pointer shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* MESSAGE STREAM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#00635C] text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                <FormattedMessageContent text={msg.text} isAgent={msg.sender === 'nora'} />

                {msg.sender === 'nora' && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <NoraReasoningVisualizer
                      thoughtDurationMs={1050}
                    />
                  </div>
                )}

                <div className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {/* MATCHED CALLS CARDS */}
              {msg.matchedCalls && msg.matchedCalls.length > 0 && (
                <div className="w-full max-w-[95%] space-y-2.5">
                  {msg.matchedCalls.map((call) => {
                    const isPlaying = activeAudioCallId === call.id && isPlayingAudio;
                    return (
                      <div
                        key={call.id}
                        className="bg-white border-2 border-[#00635C]/30 rounded-2xl p-4 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                              <MapPin className="w-4 h-4 text-[#00635C]" />
                              <span>{call.propertyAddress}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Caller: <strong>{call.callerName}</strong> ({call.callerPhone || '+1 (910) 507-2047'})
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleAudio(call)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isPlaying
                                ? 'bg-[#00635C] text-white animate-pulse'
                                : 'bg-slate-100 hover:bg-[#00635C] hover:text-white text-slate-700'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
                          </button>
                        </div>

                        {/* Deliverables Tags */}
                        {call.requestedCollateral && call.requestedCollateral.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Deliverables:</span>
                            {call.requestedCollateral.map((cName: string) => (
                              <span
                                key={cName}
                                className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 font-semibold text-[10px] border border-purple-200"
                              >
                                {cName}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenTranscriptDrawer) onOpenTranscriptDrawer(call);
                              onClose();
                            }}
                            className="flex-1 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Transcript</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onAssignToEduardo) onAssignToEduardo(call);
                              if (onNavigateToSubtab) onNavigateToSubtab('va');
                              onClose();
                            }}
                            className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>👤 Assign to VA</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setMessageModalCall(call)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* WORKLOAD SUMMARY CARDS */}
              {msg.workloadSummary && (
                <div className="w-full max-w-[95%] bg-white border-2 border-purple-300 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{msg.workloadSummary.personName}</h4>
                      <p className="text-[11px] text-slate-500">{msg.workloadSummary.personRole}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-xs">
                      {msg.workloadSummary.openTaskCount} Total Tasks
                    </span>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2">
                    {msg.workloadSummary.tasks?.map((t: any) => (
                      <div
                        key={t.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-900 text-[11px]">{t.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                            {t.status}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{t.propertyAddress}</div>
                        <div className="text-[10px] text-slate-500">{t.title} · Due: {t.targetSla}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GEMINI AI SUGGESTED NEXT STEPS (ZERO SPARKLES) */}
              {msg.suggestedNextSteps && msg.suggestedNextSteps.length > 0 && (
                <div className="w-full max-w-[95%] bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00635C]" />
                    <span className="font-bold text-xs text-[#00635C] uppercase tracking-wider">
                      Gemini Recommended Next Steps
                    </span>
                  </div>

                  <div className="space-y-2">
                    {msg.suggestedNextSteps.map((step) => (
                      <div
                        key={step.id}
                        className="bg-white border border-emerald-200/80 rounded-xl p-2.5 flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-[#00635C] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {step.stepNumber}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{step.actionTitle}</div>
                            <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{step.description}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (step.actionType === 'open_task' && onNavigateToSubtab) {
                              onNavigateToSubtab(step.actionPayload?.subtab || 'va');
                              onClose();
                            } else if (step.actionType === 'open_transcript') {
                              if (step.actionPayload?.call && onOpenTranscriptDrawer) {
                                onOpenTranscriptDrawer(step.actionPayload.call);
                              } else if (onNavigateToSubtab) {
                                onNavigateToSubtab('calls');
                              }
                              onClose();
                            } else if (step.actionType === 'assign_va') {
                              if (step.actionPayload?.call && onAssignToEduardo) {
                                onAssignToEduardo(step.actionPayload.call);
                              }
                              if (onNavigateToSubtab) onNavigateToSubtab('va');
                              onClose();
                            }
                          }}
                          className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white font-bold text-[10px] rounded-lg transition shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Execute</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="w-full max-w-[92%] animate-fadeIn">
              <NoraReasoningVisualizer isLive={true} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM QUERY INPUT */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Nora about any call, task, or team member's queue..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] outline-none transition placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 bg-[#00635C] hover:bg-[#004d47] disabled:bg-slate-200 text-white rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* POPUP: SEND MESSAGE MODAL */}
      {messageModalCall && (
        <AskRequesterQuestionsModal
          isOpen={Boolean(messageModalCall)}
          campaign={{
            id: messageModalCall.id,
            propertyAddress: messageModalCall.propertyAddress,
            agentName: messageModalCall.callerName,
            listingSnapshot: {
              listingAgentName: messageModalCall.callerName,
              listingAgentPhone: messageModalCall.callerPhone || '(910) 507-2047',
              listingAgentEmail: 'agent@nestrealty.com',
              propertyAddress: messageModalCall.propertyAddress
            }
          }}
          onClose={() => setMessageModalCall(null)}
          onSendQuestions={(data) => {
            if (onSendMessageToRequester) {
              onSendMessageToRequester(messageModalCall, data);
            }
            setMessageModalCall(null);
          }}
        />
      )}
    </div>
  );
};
