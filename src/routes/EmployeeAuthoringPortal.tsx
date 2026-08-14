import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, CheckCircle2, ShieldCheck, FileText, Send, Save, ArrowLeft,
  Compass, Plus, Trash2, HelpCircle, ChevronRight, AlertCircle, Sparkles, Volume2
} from 'lucide-react';
import { SopDocument, SopStep } from '../types/sopWorkflow';
import { calculateSopDraftProgress } from '../utils/sopDraftProgress';
import { useSopVoiceSession } from '../hooks/useSopVoiceSession';
import { SopAuthoringRequest } from '../../server/persistence/sopAuthoringRequestRepository';

interface EmployeeAuthoringPortalProps {
  invitationToken: string;
  onClose?: () => void;
}

export function EmployeeAuthoringPortal({ invitationToken, onClose }: EmployeeAuthoringPortalProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authoringReq, setAuthoringReq] = useState<SopAuthoringRequest | null>(null);
  const [viewMode, setViewMode] = useState<'welcome' | 'discovery_mapping' | 'authoring_studio' | 'review_submit'>('welcome');

  // Role Discovery state
  const [discoveredProcesses, setDiscoveredProcesses] = useState<string[]>([
    'Commission DA Verification & Escrow Audit Procedure',
    'Pre-MLS Listing Document Intake & Compliance Audit',
    'Earnest Money Escrow Payout Reconciliation'
  ]);
  const [newProcessName, setNewProcessName] = useState('');
  const [selectedProcessName, setSelectedProcessName] = useState('');

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
    publisher: 'Unassigned',
    effectiveDate: 'Draft',
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

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Load invitation token data
  useEffect(() => {
    async function loadToken() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sops/authoring-requests/by-token/${invitationToken}`);
        const data = await res.json();
        if (data.success && data.request) {
          setAuthoringReq(data.request);
          setSelectedProcessName(data.request.processName || '');

          if (data.starterDraft) {
            setSopDraft(data.starterDraft);
          } else {
            setSopDraft((prev) => ({
              ...prev,
              title: data.request.processName || '',
              purpose: data.request.processContext || '',
              processOwner: data.request.employeeName,
              author: data.request.employeeName,
              reviewer: data.request.reviewerName || 'Ryan Crecelius'
            }));
          }

          if (data.request.assignmentType === 'role_discovery') {
            setViewMode('discovery_mapping');
          } else {
            setViewMode('welcome');
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
      setTimeout(() => setIsSaved(false), 2000);
      return next;
    });
  }, []);

  const voiceSession = useSopVoiceSession({
    sopDraft,
    workspaceId: authoringReq?.workspaceId,
    userContext: {
      firstName: authoringReq?.employeeName.split(' ')[0],
      fullName: authoringReq?.employeeName,
      roleTitle: authoringReq?.employeeRole
    },
    onSopDraftUpdated: handleSopDraftUpdate
  });

  const progress = calculateSopDraftProgress(sopDraft);

  const handleSubmitToReviewer = async () => {
    if (!authoringReq) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sops/authoring-requests/${authoringReq.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopDraft })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01362D] text-[#FFFDF8] flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D0D6BB] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#D0D6BB]">Opening secure SOP authoring portal...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#01362D] text-[#FFFDF8] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#FFFDF8] text-stone-900 p-6 rounded-3xl space-y-4 shadow-2xl text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold">Invitation Not Available</h2>
          <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-[#00635C] text-[#FFFDF8] font-bold rounded-xl text-xs">
            Return to Nest Operations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01362D] text-[#FFFDF8] flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-[#00635C]/60 flex items-center justify-between shrink-0 bg-[#01362D]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00635C] text-[#FFFDF8] flex items-center justify-center font-bold text-sm">
            N
          </div>
          <div>
            <h1 className="text-base font-bold">Nest SOP Authoring Portal</h1>
            <p className="text-xs text-[#D0D6BB]/80">
              Welcome, {authoringReq?.employeeName} • Requested by {authoringReq?.requestedByName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved just now
            </span>
          )}
          {onClose && (
            <button onClick={onClose} className="px-3 py-1.5 bg-[#00635C]/50 hover:bg-[#00635C] text-[#FFFDF8] rounded-xl text-xs">
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Main Experience Body */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="max-w-4xl w-full space-y-6">

          {/* SUBMITTED SUCCESS VIEW */}
          {submittedSuccess ? (
            <div className="bg-[#FFFDF8] text-stone-900 rounded-3xl p-8 shadow-2xl text-center space-y-4 max-w-lg mx-auto my-12">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">SOP Submitted for Review!</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Thank you, {authoringReq?.employeeName.split(' ')[0]}. Your SOP draft for <strong>{sopDraft.title}</strong> has been sent to <strong>{authoringReq?.reviewerName}</strong> for review.
              </p>
              <div className="p-3 bg-[#F6F7F1] border border-stone-200 rounded-xl text-xs text-stone-700">
                You can return using your secure invitation link anytime to check review progress.
              </div>
            </div>
          ) : (
            <>
              {/* WELCOME / LANDING EXPERIENCE */}
              {viewMode === 'welcome' && (
                <div className="bg-[#FFFDF8] text-stone-900 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  
                  {/* Inline Reviewer Feedback Banner (If changes requested) */}
                  {authoringReq?.status === 'changes_requested' && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5 text-xs text-amber-900">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Changes Requested by {authoringReq.reviewerName}</span>
                      </div>
                      <p className="text-amber-800/90 leading-relaxed font-medium">
                        "{authoringReq.reviewNotes || 'Please review open questions and clarify step details.'}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-[#00635C]/10 text-[#00635C] rounded-full text-xs font-bold inline-block">
                      SOP Self-Authoring Request
                    </span>
                    <h2 className="text-2xl font-bold text-[#01362D]">
                      Hi, {authoringReq?.employeeName.split(' ')[0]}.
                    </h2>
                    <p className="text-sm text-stone-700 font-medium">
                      You know this process better than anyone.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F6F7F1] border border-stone-200 rounded-2xl space-y-3 text-xs text-stone-700 leading-relaxed">
                    <p>
                      {authoringReq?.requestedByName} asked you to document the <strong>{authoringReq?.processName}</strong>.
                    </p>
                    <p>
                      I’ll ask one question at a time and build a draft while we talk. You can stop, make changes, type instead, and come back later.
                    </p>
                    <p className="font-semibold text-[#00635C]">
                      Nothing will be published until your team reviews it.
                    </p>
                  </div>

                  {/* Microphone Precheck & Selector */}
                  <div className="p-4 bg-[#FFFDF8] border border-stone-300/80 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-[#00635C]" /> Microphone Test
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        voiceSession.diagnostics.liveLevelResult?.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {voiceSession.diagnostics.liveLevelResult?.isLive ? 'Your microphone is ready' : 'Ready to test'}
                      </span>
                    </div>

                    {voiceSession.diagnostics.audioInputs.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-600">Select Input:</span>
                        <select
                          value={voiceSession.selectedDeviceId}
                          onChange={(e) => voiceSession.setSelectedDeviceId(e.target.value)}
                          className="p-1.5 bg-[#F6F7F1] border border-stone-300 rounded-lg text-xs font-medium text-stone-900"
                        >
                          {voiceSession.diagnostics.audioInputs.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Action Choices */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setViewMode('authoring_studio')}
                      className="flex-1 py-3 px-5 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start talking</span>
                    </button>
                    <button
                      onClick={() => setViewMode('authoring_studio')}
                      className="flex-1 py-3 px-5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Type instead</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ROLE DISCOVERY MAPPING VIEW */}
              {viewMode === 'discovery_mapping' && (
                <div className="bg-[#FFFDF8] text-stone-900 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#01362D]">Role-Based Process Discovery</h2>
                    <p className="text-xs text-stone-600 mt-1">
                      {authoringReq?.requestedByName} asked us to capture the important work you handle. Let’s identify the recurring processes people rely on you to complete.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Processes Owned by {authoringReq?.employeeName}
                    </label>

                    {discoveredProcesses.map((proc, idx) => (
                      <div key={idx} className="p-3 bg-[#F6F7F1] border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-900">{proc}</span>
                        <button
                          onClick={() => {
                            setSelectedProcessName(proc);
                            setSopDraft((prev) => ({ ...prev, title: proc }));
                            setViewMode('authoring_studio');
                          }}
                          className="px-3 py-1 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>Document this</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProcessName}
                      onChange={(e) => setNewProcessName(e.target.value)}
                      placeholder="Add another process you handle regularly..."
                      className="flex-1 p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs"
                    />
                    <button
                      onClick={() => {
                        if (newProcessName.trim()) {
                          setDiscoveredProcesses([...discoveredProcesses, newProcessName.trim()]);
                          setNewProcessName('');
                        }
                      }}
                      className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 font-bold text-xs rounded-xl"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              {/* AUTHORING STUDIO (Voice + Editor) */}
              {viewMode === 'authoring_studio' && (
                <div className="bg-[#FFFDF8] text-stone-900 rounded-3xl p-6 shadow-2xl space-y-6">
                  
                  {/* Top Progress Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Documenting Process</div>
                      <h2 className="text-base font-bold text-[#01362D]">{sopDraft.title || 'Untitled SOP'}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#00635C] bg-[#00635C]/10 px-3 py-1 rounded-full">
                        {progress.label} ({progress.percent}%)
                      </span>
                      <button
                        onClick={() => setViewMode('review_submit')}
                        className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Review & Submit
                      </button>
                    </div>
                  </div>

                  {/* Silence Auto-Pause Banner */}
                  {voiceSession.isSilentTimeout && (
                    <div className="p-3 bg-[#00635C]/10 border border-[#00635C]/30 rounded-2xl flex items-center justify-between text-xs text-[#00635C]">
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4 text-[#00635C]" />
                        <span>Still there? Microphone auto-paused to save your progress. Click <strong>Start talking</strong> whenever you're ready.</span>
                      </div>
                      <button
                        onClick={() => voiceSession.setIsSilentTimeout(false)}
                        className="text-[11px] font-bold underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Voice Controller Card */}
                  <div className="p-4 bg-[#F6F7F1] border border-stone-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        voiceSession.voiceState === 'listening' ? 'bg-emerald-500 animate-pulse' :
                        voiceSession.voiceState === 'consultant_speaking' ? 'bg-blue-500 animate-pulse' : 'bg-stone-400'
                      }`} />
                      <span className="text-xs font-semibold text-stone-800">
                        {voiceSession.voiceState === 'listening' ? 'Guide is listening...' :
                         voiceSession.voiceState === 'consultant_speaking' ? 'Guide is speaking...' : 'Voice Guide Ready'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {voiceSession.voiceState === 'idle' || voiceSession.voiceState === 'ended' ? (
                        <button
                          onClick={voiceSession.startSession}
                          className="px-4 py-2 bg-[#00635C] text-[#FFFDF8] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                        >
                          <Mic className="w-3.5 h-3.5" /> Start talking
                        </button>
                      ) : (
                        <button
                          onClick={voiceSession.endSession}
                          className="px-4 py-2 bg-red-800 text-white font-bold text-xs rounded-xl"
                        >
                          Pause guide
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Structured Form Fields */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Process Name</label>
                      <input
                        type="text"
                        value={sopDraft.title}
                        onChange={(e) => setSopDraft({ ...sopDraft, title: e.target.value, updatedAt: new Date().toISOString() })}
                        className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Why do we do this? (Purpose)</label>
                        <textarea
                          rows={2}
                          value={sopDraft.purpose}
                          onChange={(e) => setSopDraft({ ...sopDraft, purpose: e.target.value, updatedAt: new Date().toISOString() })}
                          className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">When does it start? (Trigger)</label>
                        <textarea
                          rows={2}
                          value={sopDraft.trigger}
                          onChange={(e) => setSopDraft({ ...sopDraft, trigger: e.target.value, updatedAt: new Date().toISOString() })}
                          className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#00635C] uppercase tracking-wider text-[11px]">Steps</h3>
                        <button
                          onClick={() => {
                            setSopDraft({
                              ...sopDraft,
                              orderedSteps: [
                                ...sopDraft.orderedSteps,
                                { id: `step_${Date.now()}`, stepNumber: sopDraft.orderedSteps.length + 1, action: 'Describe next step...', role: authoringReq?.employeeName || 'Operations Lead' }
                              ]
                            });
                          }}
                          className="px-3 py-1 bg-stone-200 hover:bg-stone-300 font-semibold text-stone-800 rounded-lg text-xs"
                        >
                          + Add Step
                        </button>
                      </div>

                      {sopDraft.orderedSteps.map((step, idx) => (
                        <div key={step.id} className="p-3 bg-[#F6F7F1] border border-stone-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-stone-800">
                            <span>Step {idx + 1}</span>
                          </div>
                          <input
                            type="text"
                            value={step.action}
                            onChange={(e) => {
                              const updated = [...sopDraft.orderedSteps];
                              updated[idx].action = e.target.value;
                              setSopDraft({ ...sopDraft, orderedSteps: updated });
                            }}
                            className="w-full p-2 bg-[#FFFDF8] border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYEE REVIEW & SUBMISSION VIEW */}
              {viewMode === 'review_submit' && (
                <div className="bg-[#FFFDF8] text-stone-900 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#01362D]">Review Your SOP Draft</h2>
                    <p className="text-xs text-stone-600 mt-1">
                      Check your answers below. Once you submit, <strong>{authoringReq?.reviewerName}</strong> will review and approve it.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs bg-[#F6F7F1] p-4 border border-stone-200 rounded-2xl">
                    <div><strong>Title:</strong> {sopDraft.title || 'Untitled'}</div>
                    <div><strong>Purpose:</strong> {sopDraft.purpose || 'Not specified'}</div>
                    <div><strong>Trigger:</strong> {sopDraft.trigger || 'Not specified'}</div>
                    <div><strong>Steps Count:</strong> {sopDraft.orderedSteps.length}</div>
                    <div><strong>Open Questions:</strong> {sopDraft.openQuestions.length}</div>
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                    <button
                      onClick={() => setViewMode('authoring_studio')}
                      className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl"
                    >
                      Keep editing
                    </button>

                    <button
                      onClick={handleSubmitToReviewer}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Send to my reviewer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
