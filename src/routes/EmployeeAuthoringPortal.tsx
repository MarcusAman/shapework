import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, CheckCircle2, ShieldCheck, FileText, Send, Save, ArrowLeft,
  Compass, Plus, Trash2, HelpCircle, ChevronRight, AlertCircle, Sparkles, Volume2,
  Check, ArrowRight, Eye, Edit3, Flag, Building2, User, Clock, AlertTriangle, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SopDocument, SopStep } from '../types/sopWorkflow';
import { calculateSopDraftProgress } from '../utils/sopDraftProgress';
import { useSopVoiceSession } from '../hooks/useSopVoiceSession';
import type { SopAuthoringRequest } from '../../server/persistence/sopAuthoringRequestRepository';

interface EmployeeAuthoringPortalProps {
  invitationToken: string;
  onClose?: () => void;
}

const INTERVIEW_SECTIONS = [
  { id: 1, title: '1. Process Basics', desc: 'Name, trigger, owner, and purpose' },
  { id: 2, title: '2. Prerequisites & Inputs', desc: 'Required client info, tools, and systems' },
  { id: 3, title: '3. Procedural Steps', desc: 'Ordered step-by-step instructions' },
  { id: 4, title: '4. Decisions & Exceptions', desc: 'Branching logic and escalation rules' },
  { id: 5, title: '5. Compliance & Risk', desc: 'NCREC rules, disclosures, and BIC review' },
  { id: 6, title: '6. Completion & Handoff', desc: 'Evidence of completion and record storage' },
  { id: 7, title: '7. Review & Flags', desc: 'Review cadence and uncertainty flags' }
];

export function EmployeeAuthoringPortal({ invitationToken, onClose }: EmployeeAuthoringPortalProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authoringReq, setAuthoringReq] = useState<SopAuthoringRequest | null>(null);
  const [viewMode, setViewMode] = useState<'welcome' | 'authoring_studio' | 'preview_submit'>('welcome');
  const [currentSection, setCurrentSection] = useState(1);

  // SOP Draft State
  const [sopDraft, setSopDraft] = useState<SopDocument>({
    id: `sop_emp_${Date.now()}`,
    tenantId: 'tenant_nest_uat',
    workspaceId: 'nest-realty-wilmington',
    title: '',
    purpose: '',
    trigger: '',
    processOwner: '',
    participants: [],
    prerequisites: [],
    requiredInputs: [],
    orderedSteps: [],
    decisions: [],
    exceptions: [],
    escalationPaths: [],
    completionEvidence: '',
    expectedTiming: '',
    systemsUsed: [],
    reviewer: '',
    publisher: 'Unassigned (Broker Owner Approval Required)',
    effectiveDate: 'Pending Approval',
    reviewDate: 'Quarterly',
    openQuestions: [],
    status: 'draft',
    author: '',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    transcript: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  });

  // Uncertainty flags
  const [uncertaintyFlags, setUncertaintyFlags] = useState<{
    needsOwnerDecision: boolean;
    needsBicReview: boolean;
    needsOpsClarification: boolean;
    missingSourceDocument: boolean;
    notes: string;
  }>({
    needsOwnerDecision: false,
    needsBicReview: false,
    needsOpsClarification: false,
    missingSourceDocument: false,
    notes: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [newStepRole, setNewStepRole] = useState('');
  const [newStepSystem, setNewStepSystem] = useState('');
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');

  // Load invitation token data
  useEffect(() => {
    async function loadToken() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sops/authoring-requests/by-token/${invitationToken}`);
        const data = await res.json();
        if (data.success && data.request) {
          setAuthoringReq(data.request);

          if (data.starterDraft) {
            setSopDraft(data.starterDraft);
          } else {
            setSopDraft((prev) => ({
              ...prev,
              title: data.request.processName || '',
              purpose: data.request.processContext || '',
              processOwner: data.request.processOwnerName || data.request.employeeName,
              author: data.request.employeeName,
              reviewer: data.request.reviewerName || 'Ryan Crecelius',
              systemsUsed: data.request.applicableRoles || []
            }));
          }

          if (data.request.requiresBicReview) {
            setUncertaintyFlags(prev => ({ ...prev, needsBicReview: true }));
          }
        } else {
          setErrorMsg(data.error || 'Invalid or expired invitation link.');
        }
      } catch (e) {
        setErrorMsg('Unable to connect to Nest Operations.');
      } finally {
        setLoading(false);
      }
    }
    loadToken();
  }, [invitationToken]);

  const handleSopDraftUpdate = useCallback((updater: (prev: SopDocument) => SopDocument) => {
    setSopDraft((prev) => {
      const next = updater(prev);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      return next;
    });
  }, []);

  const voiceSession = useSopVoiceSession({
    sopDraft,
    workspaceId: authoringReq?.workspaceId,
    userContext: {
      firstName: authoringReq?.employeeName?.split(' ')[0],
      fullName: authoringReq?.employeeName,
      roleTitle: authoringReq?.employeeRole
    },
    onSopDraftUpdated: handleSopDraftUpdate
  });

  const progress = calculateSopDraftProgress(sopDraft);

  const handleSaveDraft = async () => {
    setIsSaved(true);
    try {
      await fetch('/api/sops/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sopDraft,
          notes: uncertaintyFlags.notes
        })
      });
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleSubmitToReviewer = async () => {
    if (!authoringReq) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sops/authoring-requests/${authoringReq.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopDraft: {
            ...sopDraft,
            openQuestions: [
              ...sopDraft.openQuestions,
              ...(uncertaintyFlags.needsOwnerDecision ? ['FLAG: Needs owner decision'] : []),
              ...(uncertaintyFlags.needsBicReview ? ['FLAG: Needs BIC compliance review'] : []),
              ...(uncertaintyFlags.needsOpsClarification ? ['FLAG: Needs operational clarification'] : []),
              ...(uncertaintyFlags.missingSourceDocument ? ['FLAG: Missing source document'] : []),
              ...(uncertaintyFlags.notes ? [`Notes: ${uncertaintyFlags.notes}`] : [])
            ]
          }
        })
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success) {
        setSubmittedSuccess(true);
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    if (!newStepText.trim()) return;
    const newStep: SopStep = {
      id: `st_${Date.now()}`,
      stepNumber: (sopDraft.orderedSteps?.length || 0) + 1,
      action: newStepText.trim(),
      role: newStepRole.trim() || authoringReq?.employeeRole || 'Operations Staff',
      systemUsed: newStepSystem.trim() || undefined
    };
    handleSopDraftUpdate(prev => ({
      ...prev,
      orderedSteps: [...(prev.orderedSteps || []), newStep]
    }));
    setNewStepText('');
    setNewStepSystem('');
  };

  const removeStep = (index: number) => {
    handleSopDraftUpdate(prev => {
      const updated = (prev.orderedSteps || []).filter((_, i) => i !== index);
      return {
        ...prev,
        orderedSteps: updated.map((st, i) => ({ ...st, stepNumber: i + 1 }))
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] text-stone-700 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#00635C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Opening Nest SOP Authoring Studio...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] text-stone-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 rounded-2xl shadow-sm space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-lg font-serif font-bold text-stone-900">Invitation Link Unavailable</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white font-semibold rounded-xl text-xs transition-colors">
            Return to Nest Operations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-stone-900 flex flex-col font-sans selection:bg-[#E5EFEA] selection:text-[#00635C]">
      
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00635C] text-white flex items-center justify-center font-serif font-bold text-base shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold tracking-tight text-stone-900 text-sm">NEST REALTY</span>
              <span className="text-[11px] text-stone-400 font-medium">•</span>
              <span className="text-[11px] font-semibold text-[#00635C] bg-[#E5EFEA] px-2 py-0.5 rounded-full">SOP Studio</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium truncate max-w-md">
              {authoringReq?.processName || 'Standard Operating Procedure'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Draft Saved
            </span>
          )}

          {viewMode !== 'preview_submit' && !submittedSuccess && (
            <button
              onClick={() => setViewMode('preview_submit')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview & Submit</span>
            </button>
          )}

          {viewMode === 'preview_submit' && !submittedSuccess && (
            <button
              onClick={() => setViewMode('authoring_studio')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Back to Editor</span>
            </button>
          )}

          {onClose && (
            <button onClick={onClose} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors">
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Main Experience Body */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
        <div className="max-w-5xl w-full space-y-6">

          {/* SUBMITTED SUCCESS VIEW */}
          {submittedSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white text-stone-900 rounded-2xl border border-stone-200 p-8 shadow-sm text-center space-y-4 max-w-lg mx-auto my-12"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900">SOP Submitted for Review!</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Thank you, <strong className="text-stone-800">{authoringReq?.employeeName}</strong>. Your documented SOP draft for <strong className="text-stone-800">{sopDraft.title}</strong> has been submitted to <strong className="text-stone-800">{authoringReq?.reviewerName || 'Ryan Crecelius'}</strong>.
              </p>
              
              {authoringReq?.requiresBicReview && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Compliance Review Required</span>
                  </div>
                  This procedure contains compliance-sensitive elements and will receive BIC verification from {authoringReq.bicReviewerName || 'Eric Knight (BIC)'} before final owner publication.
                </div>
              )}

              <div className="p-3 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-600">
                You can return using your invitation link anytime to view status updates and comments.
              </div>
            </motion.div>
          ) : (
            <>
              {/* WELCOME / LANDING EXPERIENCE */}
              {viewMode === 'welcome' && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
                  
                  {/* Inline Reviewer Feedback Banner (If changes requested) */}
                  {authoringReq?.status === 'changes_requested' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                      <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Changes Requested by {authoringReq.reviewerName}</span>
                      </div>
                      <p className="text-amber-800 leading-relaxed font-medium">
                        "{authoringReq.reviewNotes || 'Please review open questions and clarify step details.'}"
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5EFEA] text-[#00635C] text-[11px] font-semibold tracking-wide uppercase mb-3">
                      Staff SOP Contribution
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900">
                      Hello, {authoringReq?.employeeName?.split(' ')[0]}.
                    </h2>
                    <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                      Ryan Crecelius has requested your operational insight to document the authoritative standard procedure for <strong className="text-stone-800">{authoringReq?.processName}</strong>.
                    </p>
                  </div>

                  {/* Context Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#F7F8F5] border border-stone-200/80 space-y-2">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#00635C]" />
                        <span>Why Document This?</span>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {authoringReq?.processContext || 'To establish a clear, repeatable standard across all Nest Realty agents and staff, minimizing delays and compliance friction.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F7F8F5] border border-stone-200/80 space-y-2">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#00635C]" />
                        <span>Review & Governance Chain</span>
                      </div>
                      <div className="text-xs text-stone-700 space-y-1">
                        <div>• Primary Contributor: <strong className="text-stone-900">{authoringReq?.employeeName}</strong></div>
                        <div>• Reviewer: <strong className="text-stone-900">{authoringReq?.reviewerName || 'Ryan Crecelius'}</strong></div>
                        {authoringReq?.requiresBicReview && (
                          <div>• BIC Compliance: <strong className="text-stone-900">{authoringReq.bicReviewerName || 'Eric Knight (BIC)'}</strong></div>
                        )}
                        <div>• Final Publication: <strong className="text-stone-900">Ryan Crecelius (Owner)</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Documenting Options */}
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                      How would you like to document this process?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setViewMode('authoring_studio');
                          voiceSession.startSession();
                        }}
                        className="p-5 rounded-xl border-2 border-[#00635C]/30 bg-[#E5EFEA]/30 hover:bg-[#E5EFEA]/60 hover:border-[#00635C] text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-[#00635C] text-white flex items-center justify-center shadow-sm">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="font-serif font-bold text-stone-900 text-base">
                            NORA Voice Guide (Recommended)
                          </div>
                          <p className="text-stone-600 text-xs leading-relaxed">
                            Have a natural conversation with NORA. NORA asks 1 question at a time and automatically drafts your structured procedure in real-time.
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#00635C]">
                          <span>Start with NORA Voice</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>

                      <button
                        onClick={() => setViewMode('authoring_studio')}
                        className="p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                            <Edit3 className="w-5 h-5" />
                          </div>
                          <div className="font-serif font-bold text-stone-900 text-base">
                            Type / Self-Draft
                          </div>
                          <p className="text-stone-600 text-xs leading-relaxed">
                            Fill in each section at your own pace using the structured SOP editor with step-by-step guidance.
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                          <span>Open Standard Editor</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AUTHORING STUDIO EXPERIENCE */}
              {viewMode === 'authoring_studio' && (
                <div className="space-y-6">

                  {/* NORA Voice Companion Bar */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${
                        voiceSession.voiceState === 'listening' || voiceSession.voiceState === 'consultant_speaking'
                          ? 'bg-emerald-600 animate-pulse'
                          : 'bg-[#00635C]'
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-sm">NORA SOP Guide</span>
                          <span className="text-[10px] font-semibold bg-[#E5EFEA] text-[#00635C] px-2 py-0.5 rounded-full uppercase">
                            {voiceSession.voiceState === 'listening' ? 'Listening...' : voiceSession.voiceState === 'consultant_speaking' ? 'NORA Speaking...' : 'Voice Ready'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {voiceSession.statusDetails || 'Speak naturally or type answers below. Changes auto-save.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {voiceSession.voiceState === 'idle' || voiceSession.voiceState === 'ended' || voiceSession.voiceState === 'error' ? (
                        <button
                          onClick={voiceSession.startSession}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Mic className="w-4 h-4" />
                          <span>Talk with NORA</span>
                        </button>
                      ) : (
                        <button
                          onClick={voiceSession.endSession}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <MicOff className="w-4 h-4" />
                          <span>End Voice Session</span>
                        </button>
                      )}

                      <button
                        onClick={handleSaveDraft}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Draft</span>
                      </button>
                    </div>
                  </div>

                  {/* Section Navigator Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {INTERVIEW_SECTIONS.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setCurrentSection(sec.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                          currentSection === sec.id
                            ? 'bg-[#00635C] text-white shadow-sm'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {sec.title}
                      </button>
                    ))}
                  </div>

                  {/* Main Section Content Card */}
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
                    
                    {/* Section 1: Process Basics */}
                    {currentSection === 1 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">1. Process Basics</h3>
                          <p className="text-xs text-stone-500">Define the exact title, trigger event, purpose, and who owns the procedure.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Process Title</label>
                          <input
                            type="text"
                            value={sopDraft.title}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Commission DA Verification & Escrow Audit Procedure"
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Purpose / Why We Do This</label>
                          <textarea
                            rows={3}
                            value={sopDraft.purpose}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, purpose: e.target.value }))}
                            placeholder="Describe what outcome this procedure ensures (e.g. timely payout, NCREC compliance, error prevention)."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Trigger Event (When does this start?)</label>
                            <input
                              type="text"
                              value={sopDraft.trigger}
                              onChange={(e) => handleSopDraftUpdate(p => ({ ...p, trigger: e.target.value }))}
                              placeholder="e.g. When closing attorney sends final settlement statement"
                              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Primary Process Owner</label>
                            <input
                              type="text"
                              value={sopDraft.processOwner}
                              onChange={(e) => handleSopDraftUpdate(p => ({ ...p, processOwner: e.target.value }))}
                              placeholder="e.g. Melissa Gagliardi (Marketing & Ops)"
                              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 2: Prerequisites & Inputs */}
                    {currentSection === 2 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">2. Prerequisites & Systems</h3>
                          <p className="text-xs text-stone-500">List what information, forms, and software tools are needed before starting.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Systems & Portals Used</label>
                          <input
                            type="text"
                            value={(sopDraft.systemsUsed || []).join(', ')}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, systemsUsed: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            placeholder="e.g. Dotloop, QuickBooks, NC Regional MLS, Coastal Sign Post Co."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                          <p className="text-[11px] text-stone-500 mt-1">Separate multiple systems with commas.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Required Inputs & Pre-Conditions</label>
                          <textarea
                            rows={3}
                            value={(sopDraft.requiredInputs || []).join('\n')}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, requiredInputs: e.target.value.split('\n').filter(Boolean) }))}
                            placeholder="One required item per line (e.g. Executed Form 201, CDA signed by seller, MLS #)."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 3: Procedural Steps */}
                    {currentSection === 3 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-serif font-bold text-stone-900">3. Procedural Steps</h3>
                            <p className="text-xs text-stone-500">Document the exact chronological steps to execute this procedure.</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-[#E5EFEA] text-[#00635C] rounded-full">
                            {sopDraft.orderedSteps?.length || 0} Steps
                          </span>
                        </div>

                        {/* Existing Steps List */}
                        <div className="space-y-3">
                          {(sopDraft.orderedSteps || []).map((step, idx) => (
                            <div key={step.id || idx} className="p-3.5 rounded-xl bg-[#F7F8F5] border border-stone-200 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-6 h-6 rounded-full bg-[#00635C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                  {step.stepNumber || idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-stone-900 font-medium leading-relaxed">
                                    {step.action}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-500 font-medium">
                                    {step.role && <span>Role: <strong className="text-stone-700">{step.role}</strong></span>}
                                    {step.systemUsed && <span>Tool: <strong className="text-stone-700">{step.systemUsed}</strong></span>}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeStep(idx)}
                                className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Step Input */}
                        <div className="p-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/50 space-y-3">
                          <label className="block text-xs font-semibold text-stone-700">Add Next Step</label>
                          <textarea
                            rows={2}
                            value={newStepText}
                            onChange={(e) => setNewStepText(e.target.value)}
                            placeholder="Describe what action is performed in this step..."
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={newStepRole}
                              onChange={(e) => setNewStepRole(e.target.value)}
                              placeholder="Assigned Role (e.g. Transaction Coordinator)"
                              className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900"
                            />
                            <input
                              type="text"
                              value={newStepSystem}
                              onChange={(e) => setNewStepSystem(e.target.value)}
                              placeholder="Tool / System (e.g. Dotloop)"
                              className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addStep}
                            disabled={!newStepText.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Step</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Decisions & Exceptions */}
                    {currentSection === 4 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">4. Decisions & Exceptions</h3>
                          <p className="text-xs text-stone-500">Document 'if/then' branch rules and what to do when standard flow fails.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Decision Rules (If / Then)</label>
                          <textarea
                            rows={3}
                            value={(sopDraft.decisions || []).join('\n')}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, decisions: e.target.value.split('\n').filter(Boolean) }))}
                            placeholder="e.g. If earnest money is held by buyer attorney instead of Nest trust, obtain escrow acknowledgment letter."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Exceptions & Escalation Paths</label>
                          <textarea
                            rows={3}
                            value={(sopDraft.exceptions || []).join('\n')}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, exceptions: e.target.value.split('\n').filter(Boolean) }))}
                            placeholder="e.g. Disputed earnest money or commission shortages escalate directly to Eric Knight (BIC)."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 5: Compliance & Risk */}
                    {currentSection === 5 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">5. Compliance, Disclosures & Risk</h3>
                          <p className="text-xs text-stone-500">Identify NCREC rules, trust fund accounting, and compliance requirements.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={uncertaintyFlags.needsBicReview}
                              onChange={(e) => setUncertaintyFlags(p => ({ ...p, needsBicReview: e.target.checked }))}
                              className="mt-0.5 rounded border-amber-300 text-amber-700 focus:ring-amber-600"
                            />
                            <div>
                              <span className="text-xs font-bold text-amber-900">
                                This SOP is compliance-sensitive and requires BIC verification
                              </span>
                              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                                Enable if this procedure touches trust funds / EMD, agency disclosures, contract forms, or NCREC regulatory reporting.
                              </p>
                            </div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Compliance & Risk Notes</label>
                          <textarea
                            rows={3}
                            value={uncertaintyFlags.notes}
                            onChange={(e) => setUncertaintyFlags(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Describe any legal, regulatory, or policy requirements..."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 6: Completion & Records */}
                    {currentSection === 6 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">6. Completion Evidence & Records</h3>
                          <p className="text-xs text-stone-500">Define what proves the procedure is complete and where records are retained.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Proof of Completion</label>
                          <textarea
                            rows={3}
                            value={sopDraft.completionEvidence}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, completionEvidence: e.target.value }))}
                            placeholder="e.g. Signed CDA receipt uploaded to Dotloop and marked archived in QuickBooks."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Expected Timing / SLA</label>
                          <input
                            type="text"
                            value={sopDraft.expectedTiming}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, expectedTiming: e.target.value }))}
                            placeholder="e.g. Within 24 hours of settlement statement receipt"
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 7: Review Cadence & Flags */}
                    {currentSection === 7 && (
                      <div className="space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h3 className="text-base font-serif font-bold text-stone-900">7. Review Cadence & Uncertainty Flags</h3>
                          <p className="text-xs text-stone-500">Flag items you are unsure about so Ryan or Matt Orr can make a determination.</p>
                        </div>

                        {/* Uncertainty Flag Checkboxes */}
                        <div className="p-4 rounded-xl bg-[#F7F8F5] border border-stone-200 space-y-3">
                          <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                            Flag for Reviewer Attention
                          </div>
                          
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
                            <input
                              type="checkbox"
                              checked={uncertaintyFlags.needsOwnerDecision}
                              onChange={(e) => setUncertaintyFlags(p => ({ ...p, needsOwnerDecision: e.target.checked }))}
                              className="rounded border-stone-300 text-[#00635C] focus:ring-[#00635C]"
                            />
                            <span>Needs Ryan / Owner decision on policy or authority</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
                            <input
                              type="checkbox"
                              checked={uncertaintyFlags.needsOpsClarification}
                              onChange={(e) => setUncertaintyFlags(p => ({ ...p, needsOpsClarification: e.target.checked }))}
                              className="rounded border-stone-300 text-[#00635C] focus:ring-[#00635C]"
                            />
                            <span>Needs operational clarification on role handoff</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
                            <input
                              type="checkbox"
                              checked={uncertaintyFlags.missingSourceDocument}
                              onChange={(e) => setUncertaintyFlags(p => ({ ...p, missingSourceDocument: e.target.checked }))}
                              className="rounded border-stone-300 text-[#00635C] focus:ring-[#00635C]"
                            />
                            <span>Missing source document or template link</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Open Questions for Reviewer</label>
                          <textarea
                            rows={3}
                            value={(sopDraft.openQuestions || []).join('\n')}
                            onChange={(e) => handleSopDraftUpdate(p => ({ ...p, openQuestions: e.target.value.split('\n').filter(Boolean) }))}
                            placeholder="List any questions or items that need Ryan's guidance..."
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Section Navigation Footer */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={currentSection === 1}
                        onClick={() => setCurrentSection(c => Math.max(1, c - 1))}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                      >
                        Previous Section
                      </button>

                      {currentSection < 7 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentSection(c => Math.min(7, c + 1))}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <span>Next Section</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setViewMode('preview_submit')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review & Submit SOP</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PREVIEW & SUBMIT EXPERIENCE */}
              {viewMode === 'preview_submit' && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="border-b border-stone-200 pb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5EFEA] text-[#00635C] text-[11px] font-semibold uppercase mb-2">
                        Ready for Submission
                      </div>
                      <h2 className="text-xl font-serif font-bold text-stone-900">
                        {sopDraft.title || 'Untitled Standard Operating Procedure'}
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        Authored by {authoringReq?.employeeName} • Reviewer: {authoringReq?.reviewerName || 'Ryan Crecelius'}
                      </p>
                    </div>

                    <button
                      onClick={handleSubmitToReviewer}
                      disabled={isSubmitting || !sopDraft.title}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit to Ryan for Review'}</span>
                    </button>
                  </div>

                  {/* Summary Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F7F8F5] border border-stone-200 text-xs">
                    <div>
                      <span className="text-stone-500 block">Trigger:</span>
                      <strong className="text-stone-900">{sopDraft.trigger || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Owner:</span>
                      <strong className="text-stone-900">{sopDraft.processOwner || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Expected Timing:</span>
                      <strong className="text-stone-900">{sopDraft.expectedTiming || 'Not specified'}</strong>
                    </div>
                  </div>

                  {/* Purpose */}
                  {sopDraft.purpose && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Purpose</h4>
                      <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                        {sopDraft.purpose}
                      </p>
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Procedural Steps ({sopDraft.orderedSteps?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {(sopDraft.orderedSteps || []).map((st, i) => (
                        <div key={st.id || i} className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs">
                          <div className="w-5 h-5 rounded-full bg-[#00635C] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {st.stepNumber || i + 1}
                          </div>
                          <div>
                            <p className="text-stone-900 font-medium">{st.action}</p>
                            {(st.role || st.systemUsed) && (
                              <div className="flex gap-3 text-[11px] text-stone-500 mt-1">
                                {st.role && <span>Role: {st.role}</span>}
                                {st.systemUsed && <span>Tool: {st.systemUsed}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Governance Notice */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-blue-950">Governance Policy:</strong>
                      <p className="mt-0.5 leading-relaxed text-blue-800 text-[11px]">
                        As a staff contributor, submitting this draft sends it to Ryan Crecelius and the designated review chain for formal verification. Once approved, Ryan will publish it as authoritative Nest policy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Page Footer */}
      <footer className="h-10 bg-white border-t border-stone-200 flex items-center justify-between px-6 text-[11px] text-stone-400 shrink-0">
        <span>shapework. SOP Studio • Nest Realty Wilmington</span>
        <span>Secure Contributor Portal</span>
      </footer>
    </div>
  );
}
