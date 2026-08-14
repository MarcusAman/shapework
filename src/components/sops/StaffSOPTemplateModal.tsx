import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Send, CheckCircle2, FileText, Sparkles, Layers, ArrowRight,
  Mic, MicOff, RotateCcw, Save, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Volume2, Settings, Terminal, Plus, Trash2
} from 'lucide-react';
import { orgChartService, OrgSop } from '../../services/orgChartService';
import { SopDocument, SopStep, VoiceConsentPreferences } from '../../types/sopWorkflow';
import { calculateSopDraftProgress } from '../../utils/sopDraftProgress';
import { useSopVoiceSession } from '../../hooks/useSopVoiceSession';

interface StaffSOPTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  defaultRoleId?: string;
  onSopCreated?: (sop: OrgSop) => void;
}

export default function StaffSOPTemplateModal({
  isOpen,
  onClose,
  workspaceId,
  defaultRoleId,
  onSopCreated
}: StaffSOPTemplateModalProps) {
  // 1. All Hook Declarations MUST be Unconditional at Top
  const [viewMode, setViewMode] = useState<'studio' | 'review_summary'>('studio');
  const [showDevDiagnostics, setShowDevDiagnostics] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [activeHighlightField, setActiveHighlightField] = useState<string>('title');

  const [consentPrefs, setConsentPrefs] = useState<VoiceConsentPreferences>({
    permissionGranted: false,
    micAccessReason: 'Talk through how the work gets done to create an editable SOP draft',
    retentionChoice: 'sop_only',
    draftVisibility: 'Authorized workspace team members'
  });

  const [authUser, setAuthUser] = useState<{ id?: string; email?: string; name?: string; fullName?: string; role?: string } | null>(null);

  const [sopDraft, setSopDraft] = useState<SopDocument>(() => ({
    id: `sop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: 'tenant_nest_uat',
    workspaceId: workspaceId || 'nest-realty-wilmington',
    title: '',
    purpose: '',
    trigger: '',
    processOwner: 'Ann Gunn',
    participants: ['Ann Gunn'],
    prerequisites: [],
    requiredInputs: [],
    orderedSteps: [],
    decisions: [],
    exceptions: [],
    escalationPaths: [],
    completionEvidence: '',
    expectedTiming: '',
    systemsUsed: [],
    reviewer: 'Eric Knight',
    publisher: 'Unassigned',
    effectiveDate: 'Draft',
    reviewDate: 'Quarterly',
    openQuestions: [],
    status: 'draft',
    author: 'Ann Gunn',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    transcript: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  }));

  const [sopHistory, setSopHistory] = useState<SopDocument[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSopDraftUpdate = useCallback((updater: (prev: SopDocument) => SopDocument) => {
    setSopDraft((prev) => {
      setSopHistory((hist) => [...hist, prev]);
      return updater(prev);
    });
  }, []);

  const voiceSession = useSopVoiceSession({
    workspaceId,
    sopDraft,
    authUser,
    onSopDraftUpdated: handleSopDraftUpdate
  });

  // Highlight active section based on conversation stage
  useEffect(() => {
    if (!sopDraft.title) {
      setActiveHighlightField('title');
    } else if (!sopDraft.purpose) {
      setActiveHighlightField('purpose');
    } else if (sopDraft.orderedSteps.length === 0) {
      setActiveHighlightField('steps');
    } else {
      setActiveHighlightField('review');
    }
  }, [sopDraft.title, sopDraft.purpose, sopDraft.orderedSteps.length]);

  // Effects (Unconditional)
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setAuthUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceSession.transcriptMessages, voiceSession.voiceState]);

  if (!isOpen) return null;

  const progress = calculateSopDraftProgress(sopDraft);

  const handleOpenConsentModal = () => {
    setShowConsentModal(true);
  };

  const handleStartVoiceSession = async () => {
    setShowConsentModal(false);
    setConsentPrefs((prev) => ({ ...prev, permissionGranted: true }));
    await voiceSession.startSession();
  };

  const handleTestSpeaker = async () => {
    setIsTestingSpeaker(true);
    try {
      const audio = new Audio('/nest_ops_orb.mp4');
      audio.volume = 0.5;
      await audio.play().catch(() => {});
      setTimeout(() => setIsTestingSpeaker(false), 600);
    } catch (e) {
      setIsTestingSpeaker(false);
    }
  };

  const handleSendTypedMessage = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    voiceSession.sendTextMessage(text);
  };

  const handleAddManualStep = () => {
    const nextNum = sopDraft.orderedSteps.length + 1;
    const newStep: SopStep = {
      id: `step_${Date.now()}`,
      stepNumber: nextNum,
      action: '',
      role: sopDraft.processOwner || 'Operations Lead',
      systemUsed: ''
    };
    setSopDraft((prev) => ({
      ...prev,
      orderedSteps: [...prev.orderedSteps, newStep],
      updatedAt: new Date().toISOString()
    }));
  };

  const handleRemoveStep = (idx: number) => {
    const filtered = sopDraft.orderedSteps.filter((_, i) => i !== idx);
    const reindexed = filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSopDraft((prev) => ({
      ...prev,
      orderedSteps: reindexed,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sops/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({ sop: sopDraft })
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success) {
        if (onSopCreated && data.sop) {
          onSopCreated({
            id: data.sop.id,
            workspaceId: workspaceId || 'nest-realty-wilmington',
            name: data.sop.title,
            purpose: data.sop.purpose,
            trigger: data.sop.trigger,
            ownerPositionId: data.sop.processOwner,
            steps: data.sop.orderedSteps.map((s: any) => s.action),
            requiredInformation: data.sop.requiredInputs,
            tags: ['Operations', 'Guided'],
            status: 'active',
            createdAt: data.sop.createdAt,
            updatedAt: data.sop.updatedAt
          });
        }
        alert('SOP draft saved successfully!');
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const handlePublishSop = async () => {
    if (!confirm('Publish this SOP as official Nest Realty operational policy?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sops/${sopDraft.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId }
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success && data.sop) {
        setSopDraft(data.sop);
        alert('SOP published and certified successfully!');
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-stone-200/80 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Header Bar (Apple Light Mode) */}
        <div className="px-6 py-4 bg-white/95 border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#00635C] shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-serif font-bold text-stone-900">Build an SOP together</h2>
                <span className="bg-emerald-50 border border-emerald-200/80 text-[#00635C] text-xs px-3 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Lorena ElevenLabs Voice Guide
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                Talk through how the work gets done. Lorena will build an editable SOP draft live as you speak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Progress Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200/80 rounded-xl text-xs text-stone-800 font-semibold shadow-inner">
              <span className="text-[#00635C] font-bold">{progress.percent}%</span>
              <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#00635C] h-full transition-all duration-300" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>

            <button
              onClick={() => setShowDevDiagnostics(!showDevDiagnostics)}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
              title="Toggle Dev Diagnostics"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'studio' ? 'review_summary' : 'studio')}
              className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {viewMode === 'studio' ? <FileText className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              <span>{viewMode === 'studio' ? 'Review draft' : 'Back to audio workspace'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dev Diagnostics Drawer */}
        {showDevDiagnostics && (
          <div className="bg-stone-900 border-b border-stone-800 p-3 text-xs text-stone-300 font-mono space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" /> Dev Diagnostics
                </span>
                <span>State: <strong>{voiceSession.voiceState}</strong></span>
                <span>Voice: <strong>ElevenLabs (l006hw6wZaEYAv80cbzj)</strong></span>
                <span>Frame: <strong>{voiceSession.diagnostics.envInfo.isTopLevel ? 'Top-level Tab' : 'Embedded Iframe'}</strong></span>
              </div>
              <button
                onClick={handleTestSpeaker}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 text-[11px]"
              >
                <Volume2 className="w-3 h-3" />
                <span>{isTestingSpeaker ? 'Testing...' : 'Test speakers'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Pre-Interview Consent Modal Overlay */}
        {showConsentModal && (
          <div className="absolute inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-stone-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200/80">
              <div className="flex items-center gap-2.5 text-stone-900 font-serif font-bold text-lg">
                <ShieldCheck className="w-5 h-5 text-[#00635C]" />
                <span>Before we start talking</span>
              </div>
              <div className="text-xs text-stone-600 space-y-3 leading-relaxed font-medium">
                <p>
                  <strong>Why microphone access is needed:</strong> You can talk through your process out loud, and Lorena will organize your words into an SOP draft.
                </p>
                <p>
                  <strong>Audio privacy:</strong> Your voice stream is processed live to create text. Raw audio files are not saved by default.
                </p>
                <p>
                  <strong>Draft visibility:</strong> Only authorized members of your Nest team can view and edit this draft.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartVoiceSession}
                  className="px-4 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>Allow microphone & start</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        {viewMode === 'studio' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            
            {/* LEFT PANEL: Siri/Alexa Apple Light Mode Voice Console */}
            <div className="lg:col-span-5 border-r border-stone-200/80 p-5 flex flex-col bg-stone-50/70 space-y-4 overflow-hidden">
              
              {/* Hero Siri/Alexa Animated Voice Orb & Soundwave Status */}
              <div className="p-5 bg-white border border-stone-200/80 rounded-3xl flex flex-col items-center justify-center space-y-3 shadow-sm relative overflow-hidden shrink-0">
                
                {/* Glowing Siri/Alexa Style Voice Orb */}
                <div className="relative group flex flex-col items-center my-1">
                  <button
                    type="button"
                    onClick={
                      ['listening', 'consultant_speaking', 'connecting'].includes(voiceSession.voiceState)
                        ? voiceSession.endSession
                        : handleOpenConsentModal
                    }
                    className={`relative rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center
                      w-24 h-24 sm:w-28 sm:h-28 shadow-lg
                      hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,99,92,0.2)]
                      ${voiceSession.voiceState === 'listening'
                        ? 'ring-4 ring-emerald-500/50 animate-pulse shadow-[0_0_30px_rgba(0,99,92,0.3)]'
                        : voiceSession.voiceState === 'consultant_speaking'
                          ? 'ring-4 ring-teal-500/50 animate-pulse shadow-[0_0_30px_rgba(20,184,166,0.3)]'
                          : voiceSession.voiceState === 'connecting'
                            ? 'ring-4 ring-amber-400 animate-pulse'
                            : 'ring-2 ring-stone-200 shadow-sm'
                      }
                    `}
                  >
                    <video
                      src="/nest_ops_orb.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover rounded-full pointer-events-none"
                    />
                  </button>

                  {/* Audio Soundwave Bars Visualizer */}
                  {['listening', 'consultant_speaking'].includes(voiceSession.voiceState) && (
                    <div className="flex items-center gap-1 mt-3">
                      <span className="w-1 h-4 bg-[#00635C] rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1 h-6 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-8 bg-[#00635C] rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="w-1 h-5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-3 bg-[#00635C] rounded-full animate-bounce [animation-delay:0.25s]" />
                    </div>
                  )}

                  {/* Voice Status Badge */}
                  <div className="mt-2 text-xs font-bold text-stone-800 select-none text-center">
                    {voiceSession.voiceState === 'listening' && 'Lorena is Listening...'}
                    {voiceSession.voiceState === 'consultant_speaking' && 'Lorena Speaking (ElevenLabs Voice)...'}
                    {voiceSession.voiceState === 'connecting' && 'Connecting Voice Line...'}
                    {voiceSession.voiceState === 'requesting_permission' && 'Allow Microphone...'}
                    {voiceSession.voiceState === 'error' && (voiceSession.statusDetails || 'Connection Issue')}
                    {voiceSession.voiceState === 'idle' && 'Click Orb to Start Audio Walkthrough'}
                    {voiceSession.voiceState === 'ended' && 'Session Completed — Click Orb to Restart'}
                  </div>
                </div>

                {voiceSession.voiceState === 'error' && (
                  <div className="text-xs text-red-800 bg-red-50 p-3 rounded-2xl border border-red-200 space-y-1 text-center w-full font-medium">
                    <div>{voiceSession.statusDetails}</div>
                  </div>
                )}
              </div>

              {/* Live Conversation Transcript Feed */}
              <div className="flex-1 p-4 bg-white border border-stone-200/80 rounded-2xl overflow-y-auto space-y-3 text-xs leading-relaxed shadow-sm">
                {voiceSession.transcriptMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
                    <Sparkles className="w-8 h-8 text-stone-300" />
                    <p className="italic text-xs font-medium text-stone-500">
                      Lorena will ask one question at a time and build your SOP draft live as you speak.
                    </p>
                    <p className="text-[11px] text-stone-400 font-semibold">
                      Click the glowing Voice Orb above to begin.
                    </p>
                  </div>
                ) : (
                  voiceSession.transcriptMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl max-w-[88%] shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-[#00635C] text-white ml-auto border border-emerald-700/30 font-medium'
                          : 'bg-stone-100 text-stone-900 mr-auto border border-stone-200/80'
                      }`}
                    >
                      <div className={`text-[10px] font-bold mb-1 flex items-center justify-between ${
                        msg.sender === 'user' ? 'text-emerald-100' : 'text-[#00635C]'
                      }`}>
                        <span>{msg.sender === 'user' ? 'You' : 'Lorena (ElevenLabs Voice)'}</span>
                        <span className="opacity-70">{msg.timestamp}</span>
                      </div>
                      <div className="text-xs leading-relaxed font-medium">{msg.text}</div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Voice & Speech Controls */}
              <div className="space-y-2 shrink-0 pt-1">
                {voiceSession.voiceState === 'idle' || voiceSession.voiceState === 'ended' || voiceSession.voiceState === 'error' ? (
                  <button
                    onClick={handleOpenConsentModal}
                    className="w-full py-3 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Audio Walkthrough with Lorena</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={voiceSession.toggleMute}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        voiceSession.isMuted
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-stone-200 text-stone-800 border border-stone-300 hover:bg-stone-300'
                      }`}
                    >
                      {voiceSession.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{voiceSession.isMuted ? 'Muted' : 'Mute'}</span>
                    </button>
                    <button
                      onClick={voiceSession.endSession}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      End Audio Session
                    </button>
                  </div>
                )}

                {/* Type Instead Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTypedMessage()}
                    placeholder="Prefer to type? Enter a question or update..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] font-medium shadow-sm"
                  />
                  <button
                    onClick={handleSendTypedMessage}
                    className="px-3.5 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: SOP Document Draft Workspace (Apple Light Mode Live Form) */}
            <div className="lg:col-span-7 p-6 flex flex-col space-y-5 bg-white text-stone-900 overflow-y-auto">
              
              {/* Draft Progress Header */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between shrink-0 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-stone-800">
                    SOP Draft Progress: <span className="text-[#00635C] font-bold">{progress.label}</span>
                  </span>
                  <div className="w-48 bg-stone-200 h-2 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-[#00635C] h-full transition-all duration-300" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={handlePublishSop}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Publish SOP</span>
                  </button>
                </div>
              </div>

              {/* Section 1: The Basics (Highlighted when active) */}
              <div className={`p-5 rounded-2xl transition-all duration-500 space-y-4 border ${
                activeHighlightField === 'title' || activeHighlightField === 'purpose'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-stone-200/80 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00635C]">1. The Basics</h3>
                  {activeHighlightField === 'title' && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      Active Audio Focus
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Name of this process (Title)</label>
                  <input
                    type="text"
                    value={sopDraft.title}
                    onChange={(e) => setSopDraft({ ...sopDraft, title: e.target.value, updatedAt: new Date().toISOString() })}
                    placeholder="e.g. Commission DA Verification & Escrow Audit Procedure"
                    className="w-full p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:bg-white focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Why do we do this? (Purpose)</label>
                    <textarea
                      rows={2}
                      value={sopDraft.purpose}
                      onChange={(e) => setSopDraft({ ...sopDraft, purpose: e.target.value, updatedAt: new Date().toISOString() })}
                      placeholder="e.g. Ensure net agent splits match NCREC rules and disbursement instructions"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:bg-white focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">When does it start? (Trigger)</label>
                    <textarea
                      rows={2}
                      value={sopDraft.trigger}
                      onChange={(e) => setSopDraft({ ...sopDraft, trigger: e.target.value, updatedAt: new Date().toISOString() })}
                      placeholder="e.g. Upon receiving a DA package from Dotloop"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:bg-white focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Process Owner</label>
                    <input
                      type="text"
                      value={sopDraft.processOwner}
                      onChange={(e) => setSopDraft({ ...sopDraft, processOwner: e.target.value, updatedAt: new Date().toISOString() })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-900 font-semibold focus:outline-none focus:bg-white focus:border-[#00635C] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Compliance Reviewer / BIC</label>
                    <input
                      type="text"
                      value={sopDraft.reviewer}
                      onChange={(e) => setSopDraft({ ...sopDraft, reviewer: e.target.value, updatedAt: new Date().toISOString() })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-900 font-semibold focus:outline-none focus:bg-white focus:border-[#00635C] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Steps Procedure */}
              <div className={`p-5 rounded-2xl transition-all duration-500 space-y-4 border ${
                activeHighlightField === 'steps'
                  ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-stone-200/80 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#00635C]">2. Step-by-Step Procedure</h3>
                  <button
                    onClick={handleAddManualStep}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#00635C] rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                {sopDraft.orderedSteps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500 border border-dashed border-stone-300 rounded-xl bg-stone-50/50 font-medium">
                    No steps added yet. Lorena will populate steps automatically as you speak, or click <strong>Add Step</strong> above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sopDraft.orderedSteps.map((step, idx) => (
                      <div key={step.id || idx} className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl space-y-2 relative group shadow-sm">
                        <div className="flex items-center justify-between text-xs font-bold text-[#00635C]">
                          <span>Step {step.stepNumber || idx + 1}</span>
                          <button
                            onClick={() => handleRemoveStep(idx)}
                            className="text-stone-400 hover:text-rose-600 p-1 rounded"
                            title="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={step.action}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSopDraft((prev) => {
                              const updated = [...prev.orderedSteps];
                              updated[idx] = { ...updated[idx], action: val };
                              return { ...prev, orderedSteps: updated, updatedAt: new Date().toISOString() };
                            });
                          }}
                          placeholder="Describe this step..."
                          className="w-full p-2 bg-white border border-stone-200/80 rounded-lg text-xs text-stone-900 font-medium focus:outline-none focus:border-[#00635C]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Decisions & Exceptions */}
              <div className="p-5 bg-white border border-stone-200/80 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00635C]">3. Decision Rules & Exceptions</h3>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Key Decision Criteria</label>
                  <textarea
                    rows={2}
                    value={sopDraft.decisions.join('\n')}
                    onChange={(e) => setSopDraft({ ...sopDraft, decisions: e.target.value.split('\n').filter(Boolean), updatedAt: new Date().toISOString() })}
                    placeholder="e.g. If earnest money is > $10k, requires Dual-BIC Authorization"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:bg-white focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white text-stone-900 overflow-y-auto space-y-6 flex-1">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">{sopDraft.title || 'Untitled SOP Draft'}</h2>
                <p className="text-xs text-stone-500 mt-1 font-medium">Owner: {sopDraft.processOwner} • Reviewer: {sopDraft.reviewer}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200"
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePublishSop}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Publish SOP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <span className="font-bold text-[#00635C] block uppercase">Purpose</span>
                <p className="text-stone-800 leading-relaxed font-medium">{sopDraft.purpose || 'No purpose recorded yet.'}</p>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <span className="font-bold text-[#00635C] block uppercase">Trigger</span>
                <p className="text-stone-800 leading-relaxed font-medium">{sopDraft.trigger || 'No trigger recorded yet.'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-[#00635C]">Procedure Steps ({sopDraft.orderedSteps.length})</h3>
              {sopDraft.orderedSteps.map((st, i) => (
                <div key={i} className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs font-medium text-stone-900 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#00635C] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{st.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
