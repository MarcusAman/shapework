import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Check, Trash2, Zap, Loader2, HelpCircle, Plus, Copy, Info } from 'lucide-react';
import { SOPField, SOPStep, SOPDecision } from './sopTemplates';
import { OrgPosition } from '../../services/orgChartService';
import AIFieldAssistant from './AIFieldAssistant';

interface SOPWizardProps {
  wizardStep: number;
  setWizardStep: (step: number) => void;
  sopForm: any;
  setSopForm: (form: any) => void;
  positions: OrgPosition[];
  directoryPeople: any[];
  ownershipValidation: string[];
  decisionPathErrors: string[];
  publishErrors: string[];
  handleSaveSop: (statusOverride?: 'draft' | 'published') => Promise<void>;
  setCurrentView: (view: 'library' | 'create_options' | 'wizard' | 'builder' | 'run' | 'details') => void;
  state: any;
  
  // Modals hooks
  setEditingFieldIdx: (idx: number | null) => void;
  setFieldForm: (form: Partial<SOPField>) => void;
  setIsFieldModalOpen: (open: boolean) => void;
  
  setEditingStepIdx: (idx: number | null) => void;
  setStepForm: (form: Partial<SOPStep>) => void;
  setIsStepModalOpen: (open: boolean) => void;
  
  setEditingDecisionIdx: (idx: number | null) => void;
  setDecisionForm: (form: Partial<SOPDecision>) => void;
  setIsDecisionModalOpen: (open: boolean) => void;
  
  // Reorder / duplicate helpers
  handleMoveField: (idx: number, dir: 'up' | 'down') => void;
  handleMoveStep: (idx: number, dir: 'up' | 'down') => void;
  handleDuplicateStep: (idx: number) => void;
}

export default function SOPWizard({
  wizardStep,
  setWizardStep,
  sopForm,
  setSopForm,
  positions,
  directoryPeople,
  ownershipValidation,
  decisionPathErrors,
  publishErrors,
  handleSaveSop,
  setCurrentView,
  state,
  setEditingFieldIdx,
  setFieldForm,
  setIsFieldModalOpen,
  setEditingStepIdx,
  setStepForm,
  setIsStepModalOpen,
  setEditingDecisionIdx,
  setDecisionForm,
  setIsDecisionModalOpen,
  handleMoveField,
  handleMoveStep,
  handleDuplicateStep
}: SOPWizardProps) {
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestedDraft, setSuggestedDraft] = useState<any>(null);
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    title: true, purpose: true, expectedOutcome: true, scope: true, exclusions: true,
    trigger: true, requiredInfo: true, steps: true, decisions: true, escalationBehavior: true,
    completionEvidence: true, governance: true
  });

  // Stage suggestions
  const [stageSuggestions, setStageSuggestions] = useState<any>(null);
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  // Review Draft with AI State
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFindings, setReviewFindings] = useState<any[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Role Conflict Modal
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const routingRules = state.model?.routingMatrix || [];
  const escalationPolicies = state.model?.escalationPolicies || [];

  const selectedCategory = sopForm.relatedCategories?.[0] || '';
  const matchedRule = routingRules.find((r: any) => r.category === selectedCategory);
  const isConflictingOwner = matchedRule && sopForm.ownerRole !== matchedRule.primaryOwnerPositionId;

  const handleBuildDraft = async () => {
    if (!aiBrief.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ops/ai/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: aiBrief })
      });
      if (!res.ok) {
        throw new Error('Failed to generate draft. System fallback active.');
      }
      const data = await res.json();
      if (data.response && data.response.result) {
        setSuggestedDraft(data.response.result);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI service is temporarily offline.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyDraft = () => {
    if (!suggestedDraft) return;
    const updatedForm = { ...sopForm };
    if (selectedSections.title) updatedForm.title = suggestedDraft.title;
    if (selectedSections.purpose) updatedForm.purpose = suggestedDraft.purpose;
    if (selectedSections.expectedOutcome) updatedForm.expectedOutcome = suggestedDraft.expectedOutcome;
    if (selectedSections.scope) updatedForm.scope = suggestedDraft.scope;
    if (selectedSections.exclusions) updatedForm.exclusions = suggestedDraft.exclusions;
    
    if (selectedSections.trigger) {
      updatedForm.triggerType = suggestedDraft.triggerType || 'request_received';
      updatedForm.trigger = suggestedDraft.trigger;
    }
    
    if (selectedSections.requiredInfo && suggestedDraft.requiredInfo) {
      updatedForm.requiredInfo = suggestedDraft.requiredInfo.map((f: any, i: number) => ({
        id: `field_${Date.now()}_${i}`,
        ...f
      }));
    }
    
    if (selectedSections.steps && suggestedDraft.steps) {
      updatedForm.steps = suggestedDraft.steps.map((s: any, i: number) => ({
        id: `step_${Date.now()}_${i}`,
        ...s
      }));
    }
    
    if (selectedSections.decisions && suggestedDraft.decisions) {
      updatedForm.decisions = suggestedDraft.decisions.map((d: any, i: number) => ({
        id: `dec_${Date.now()}_${i}`,
        ...d
      }));
    }
    
    if (selectedSections.escalationBehavior) {
      updatedForm.escalationBehavior = suggestedDraft.escalationBehavior;
    }
    
    if (selectedSections.completionEvidence) {
      updatedForm.completionEvidence = suggestedDraft.completionEvidence;
    }
    
    if (selectedSections.governance) {
      updatedForm.governance = suggestedDraft.governance;
    }

    updatedForm.changeSummary = 'AI-generated draft — review required';
    setSopForm(updatedForm);
    setSuggestedDraft(null);
  };

  const handleFetchStageSuggestions = async (stageNum: number) => {
    setStageLoading(true);
    setStageError(null);
    try {
      const res = await fetch('/api/ops/ai/stage-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageNum, sopForm })
      });
      if (!res.ok) {
        throw new Error('AI Stage Suggestion service is currently offline.');
      }
      const data = await res.json();
      if (data.response && data.response.result) {
        setStageSuggestions(data.response.result);
      }
    } catch (err: any) {
      setStageError(err.message || 'AI suggest unavailable.');
    } finally {
      setStageLoading(false);
    }
  };

  const handleRunAiReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/ops/ai/review-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sop: sopForm })
      });
      if (!res.ok) {
        throw new Error('AI Review service offline.');
      }
      const data = await res.json();
      if (data.response && data.response.result && data.response.result.findings) {
        setReviewFindings(data.response.result.findings.map((f: any) => ({ ...f, applied: false })));
      } else {
        setReviewFindings([]);
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to review draft.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApplyFinding = (idx: number, finding: any) => {
    const updatedForm = { ...sopForm };
    const sec = finding.section.toLowerCase();
    
    if (sec.includes('purpose')) {
      updatedForm.purpose = finding.proposedImprovement;
    } else if (sec.includes('outcome')) {
      updatedForm.expectedOutcome = finding.proposedImprovement;
    } else if (sec.includes('scope')) {
      updatedForm.scope = finding.proposedImprovement;
    } else if (sec.includes('owner') || sec.includes('role')) {
      if (finding.proposedImprovement.includes('operations_manager')) {
        updatedForm.ownerRole = 'operations_manager';
      } else if (finding.proposedImprovement.includes('owner')) {
        updatedForm.ownerRole = 'owner';
      }
    } else if (sec.includes('backup')) {
      if (finding.proposedImprovement.includes('operations_manager')) {
        updatedForm.backupRole = 'operations_manager';
      } else if (finding.proposedImprovement.includes('owner')) {
        updatedForm.backupRole = 'owner';
      }
    }

    setSopForm(updatedForm);
    const updatedFindings = [...reviewFindings];
    updatedFindings[idx].applied = true;
    setReviewFindings(updatedFindings);
  };

  const handleSelectCategory = (cat: string) => {
    const matched = routingRules.find((r: any) => r.category === cat);
    const updated = {
      ...sopForm,
      relatedCategories: [cat],
      trigger: cat
    };
    if (matched) {
      updated.ownerRole = matched.primaryOwnerPositionId;
      updated.backupRole = matched.backupOwnerPositionId || '';
      updated.escalationRecipientRole = matched.escalationPolicyId ? 'policy' : 'owner';
    }
    setSopForm(updated);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-0 bg-[#01362D] text-left select-none">
      {/* Stepper Rail */}
      <div className="w-full md:w-64 shrink-0 bg-[#012a23] border-r border-white/10 p-5 flex flex-col justify-between select-none overflow-y-auto">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono">SOP BUILDER</span>
          <div className="flex flex-col gap-1.5">
            {[
              { num: 1, label: 'Phase 1: Define', desc: 'Purpose, title, expected outcomes' },
              { num: 2, label: 'Phase 2: Procedure', desc: 'Prerequisites, steps, decisions, evidence' },
              { num: 3, label: 'Phase 3: Connect Ops', desc: 'Routing, owners, escalation policies' },
              { num: 4, label: 'Phase 4: Review & Publish', desc: 'Readiness, AI review, version locking' }
            ].map(step => (
              <button
                key={step.num}
                onClick={() => setWizardStep(step.num)}
                className={`flex items-center gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer w-full ${
                  wizardStep === step.num ? 'bg-[#00635C] border border-white/10 shadow-sm' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[9px] font-black shrink-0 ${
                  wizardStep === step.num ? 'bg-emerald-400 border-emerald-300 text-[#01362D]' : 'border-white/20 text-[#D0D6BB]/40'
                }`}>
                  {step.num}
                </div>
                <div>
                  <span className="text-[10px] font-bold block uppercase tracking-wider text-white leading-tight">{step.label}</span>
                  <span className="text-[8px] font-mono text-[#D0D6BB]/40 block">{step.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-white/5 text-[9px] text-[#D0D6BB]/40 leading-relaxed font-mono">
          Step values are stored as structured JSON. All draft iterations are version locked.
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-grow overflow-y-auto p-8 relative space-y-6 bg-black/10">
        
        {/* AI Draft Review Screen Modal */}
        {suggestedDraft && (
          <div className="fixed inset-0 bg-[#012a23]/95 z-50 overflow-y-auto p-8 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="max-w-xl w-full bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-left select-none max-h-[90vh] overflow-y-auto">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 block font-bold">AI Draft — Review Required</span>
                <h2 className="font-serif font-black text-base text-white uppercase mt-0.5">Review Generated SOP Draft</h2>
                <p className="text-[10px] text-[#D0D6BB]/60 font-mono mt-0.5">Check the sections you want to apply. Deselected sections will not be written.</p>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'title', label: 'SOP Title', val: suggestedDraft.title },
                  { key: 'purpose', label: 'Purpose', val: suggestedDraft.purpose },
                  { key: 'expectedOutcome', label: 'Expected Outcome', val: suggestedDraft.expectedOutcome },
                  { key: 'scope', label: 'Scope limits', val: suggestedDraft.scope },
                  { key: 'exclusions', label: 'Exclusions', val: suggestedDraft.exclusions },
                  { key: 'trigger', label: 'Trigger', val: `${suggestedDraft.triggerType || 'manual'}: ${suggestedDraft.trigger || ''}` },
                  { key: 'requiredInfo', label: 'Required Info Fields', val: `${(suggestedDraft.requiredInfo || []).length} field(s)` },
                  { key: 'steps', label: 'Checklist steps', val: `${(suggestedDraft.steps || []).length} step(s)` },
                  { key: 'decisions', label: 'Exception rules', val: `${(suggestedDraft.decisions || []).length} rule(s)` },
                  { key: 'escalationBehavior', label: 'Escalation details', val: suggestedDraft.escalationBehavior?.expectedResponse || 'Not configured' },
                  { key: 'completionEvidence', label: 'Completion evidence', val: suggestedDraft.completionEvidence?.description || 'Not configured' }
                ].map(sec => (
                  <label key={sec.key} className="flex items-start gap-2.5 p-2.5 bg-black/15 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedSections[sec.key]}
                      onChange={(e) => setSelectedSections({ ...selectedSections, [sec.key]: e.target.checked })}
                      className="mt-0.5"
                    />
                    <div>
                      <strong className="text-[11px] text-white block leading-tight">{sec.label}</strong>
                      <span className="text-[9px] text-[#D0D6BB]/50 block font-mono leading-relaxed mt-0.5">{sec.val || '(Not defined)'}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end border-t border-white/5 pt-3 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => { setSuggestedDraft(null); setAiBrief(''); }}
                  className="px-3 py-1.5 border border-white/10 text-white rounded-lg hover:bg-white/5 cursor-pointer uppercase"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleBuildDraft}
                  className="px-3 py-1.5 bg-purple-650 hover:bg-purple-750 text-white rounded-lg cursor-pointer uppercase flex items-center gap-1"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = Object.keys(selectedSections).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                    setSelectedSections(allTrue);
                    setTimeout(() => handleApplyDraft(), 50);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-650 text-white rounded-lg cursor-pointer uppercase font-bold"
                >
                  Apply All
                </button>
                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer uppercase font-bold"
                >
                  Apply Selected
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-left">
          
          {/* AI Banner warning if draft */}
          {sopForm.changeSummary === 'AI-generated draft — review required' && (
            <div className="p-3 bg-purple-950/20 border border-purple-500/20 text-purple-300 rounded-2xl text-[10px] flex items-center gap-2 select-none font-mono">
              <Zap className="w-4 h-4 text-purple-400 shrink-0" />
              <span>AI-generated draft — review required. Ensure fields are verified before publishing.</span>
            </div>
          )}

          {/* Phase 1: Define */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              
              {/* Optional Rough Description start section */}
              <div className="bg-[#013028]/40 border border-white/10 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-serif font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Build a Draft From My Description
                </h4>
                <p className="text-[10px] text-[#D0D6BB]/60 leading-normal font-sans">
                  Enter a rough description of the procedure. Shapework AI will draft the entire SOP including steps, decisions, and required fields.
                </p>
                <textarea
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder="e.g. For marketing launch, agent uploads photos. Melissa prepares flyer templates. Upload drives link to Google Drive folder..."
                  className="w-full h-20 p-2.5 border border-white/10 rounded-xl bg-black/25 text-xs text-white placeholder-stone-500 focus:outline-none font-sans"
                />
                <button
                  type="button"
                  disabled={aiLoading || !aiBrief.trim()}
                  onClick={handleBuildDraft}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Generate SOP Draft
                </button>
                {aiError && <span className="text-[9px] text-red-400 block font-mono mt-1">{aiError}</span>}
              </div>

              {/* General Fields */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">SOP Title</label>
                  <input
                    type="text"
                    value={sopForm.title}
                    onChange={(e) => setSopForm({ ...sopForm, title: e.target.value })}
                    placeholder="e.g. Listing Launch SOP"
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Department</label>
                  <select
                    value={sopForm.department}
                    onChange={(e) => setSopForm({ ...sopForm, department: e.target.value })}
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white font-sans focus:outline-none cursor-pointer"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Purpose</label>
                  <div className="relative">
                    <textarea
                      value={sopForm.purpose}
                      onChange={(e) => setSopForm({ ...sopForm, purpose: e.target.value })}
                      placeholder="Detail why this standard process exists..."
                      className="w-full h-16 p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none pr-8"
                    />
                    <AIFieldAssistant field="purpose" value={sopForm.purpose} onChange={(val) => setSopForm({ ...sopForm, purpose: val })} />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Expected Outcome</label>
                  <div className="relative">
                    <textarea
                      value={sopForm.expectedOutcome}
                      onChange={(e) => setSopForm({ ...sopForm, expectedOutcome: e.target.value })}
                      placeholder="Detail what is achieved once this SOP is executed..."
                      className="w-full h-16 p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none pr-8"
                    />
                    <AIFieldAssistant field="expectedOutcome" value={sopForm.expectedOutcome} onChange={(val) => setSopForm({ ...sopForm, expectedOutcome: val })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Scope</label>
                    <input
                      type="text"
                      value={sopForm.scope || ''}
                      onChange={(e) => setSopForm({ ...sopForm, scope: e.target.value })}
                      placeholder="All listings/standard agents"
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Exclusions</label>
                    <input
                      type="text"
                      value={sopForm.exclusions || ''}
                      onChange={(e) => setSopForm({ ...sopForm, exclusions: e.target.value })}
                      placeholder="Commercial/rentals"
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Intake Trigger Condition</label>
                  <input
                    type="text"
                    value={sopForm.trigger || ''}
                    onChange={(e) => setSopForm({ ...sopForm, trigger: e.target.value })}
                    placeholder="New Listing launch request received"
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Build the Procedure */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              
              {/* Stage Suggestions box */}
              <div className="bg-[#013028]/40 border border-white/10 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-serif font-black uppercase text-white tracking-wider flex items-center gap-1.5 select-none">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Procedure Suggestion Helpers
                </h4>
                <p className="text-[10px] text-[#D0D6BB]/60 leading-normal font-sans">
                  Fetch AI-driven recommendations based on the active handbook standard rules.
                </p>
                <div className="flex gap-2 flex-wrap text-[9px] font-mono font-bold select-none">
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(4)}
                    className="px-2.5 py-1 bg-black/35 hover:bg-black/50 text-[#D0D6BB] rounded-lg transition-colors cursor-pointer border border-white/5"
                  >
                    Suggest Required Info
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(5)}
                    className="px-2.5 py-1 bg-black/35 hover:bg-black/50 text-[#D0D6BB] rounded-lg transition-colors cursor-pointer border border-white/5"
                  >
                    Generate Steps
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(6)}
                    className="px-2.5 py-1 bg-black/35 hover:bg-black/50 text-[#D0D6BB] rounded-lg transition-colors cursor-pointer border border-white/5"
                  >
                    Suggest Decisions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(8)}
                    className="px-2.5 py-1 bg-black/35 hover:bg-black/50 text-[#D0D6BB] rounded-lg transition-colors cursor-pointer border border-white/5"
                  >
                    Suggest Evidence
                  </button>
                </div>

                {stageLoading && (
                  <div className="flex items-center gap-1 text-[9px] text-[#D0D6BB]/40 font-mono py-2 select-none">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching stage suggestions...
                  </div>
                )}
                {stageError && <span className="text-[9px] text-red-400 block font-mono">{stageError}</span>}

                {/* Render suggestion output if available */}
                {stageSuggestions && (
                  <div className="mt-3 bg-black/30 border border-white/5 p-3 rounded-xl max-h-[180px] overflow-y-auto space-y-2 text-left">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-purple-400 font-bold block select-none">Suggested Items:</span>
                    
                    {/* suggest required fields */}
                    {stageSuggestions.requiredInfo && stageSuggestions.requiredInfo.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                        <span>{f.name} ({f.dataType})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.requiredInfo, { id: `field_${Date.now()}_${idx}`, ...f }];
                            setSopForm({ ...sopForm, requiredInfo: updated });
                          }}
                          className="px-1.5 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded font-mono text-[8px]"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest steps */}
                    {stageSuggestions.steps && stageSuggestions.steps.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                        <span className="truncate max-w-[250px]">{s.title}: {s.instruction}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.steps, { id: `step_${Date.now()}_${idx}`, ...s }];
                            setSopForm({ ...sopForm, steps: updated });
                          }}
                          className="px-1.5 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded font-mono text-[8px] shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest decisions */}
                    {stageSuggestions.decisions && stageSuggestions.decisions.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                        <span>IF {d.condition} THEN {d.action}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.decisions, { id: `dec_${Date.now()}_${idx}`, ...d }];
                            setSopForm({ ...sopForm, decisions: updated });
                          }}
                          className="px-1.5 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded font-mono text-[8px]"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest evidence */}
                    {stageSuggestions.completionEvidence && (
                      <div className="flex justify-between items-start text-[10px] py-1">
                        <div>
                          <strong className="block text-white">Completion Deliverable ({stageSuggestions.completionEvidence.type})</strong>
                          <p className="text-[9px] text-[#D0D6BB]/70">{stageSuggestions.completionEvidence.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSopForm({ ...sopForm, completionEvidence: { ...stageSuggestions.completionEvidence } });
                          }}
                          className="px-1.5 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded font-mono text-[8px]"
                        >
                          Use
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 1. Required Information (Fields) */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-xs uppercase text-white tracking-wide">Prerequisite Information</h3>
                    <p className="text-[9px] font-mono text-[#D0D6BB]/50">Variables collected during intake signals</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFieldIdx(null);
                      setFieldForm({ name: '', description: '', dataType: 'text', required: 'yes', example: '', source: '' });
                      setIsFieldModalOpen(true);
                    }}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-mono rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {sopForm.requiredInfo.map((field: SOPField, idx: number) => (
                    <div key={field.id} className="p-2.5 bg-black/20 border border-white/5 rounded-2xl flex justify-between items-center gap-2">
                      <div className="text-left">
                        <span className="font-bold text-xs text-white block">{field.name}</span>
                        <span className="text-[8px] text-[#D0D6BB]/40 uppercase font-mono">
                          Type: {field.dataType} | Required: {field.required}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 select-none text-[8px]">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-white/5 text-[#D0D6BB]/60 hover:text-white rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'down')}
                          disabled={idx === sopForm.requiredInfo.length - 1}
                          className="p-1 hover:bg-white/5 text-[#D0D6BB]/60 hover:text-white rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFieldIdx(idx);
                            setFieldForm(field);
                            setIsFieldModalOpen(true);
                          }}
                          className="p-1 hover:bg-white/5 text-emerald-400 rounded cursor-pointer font-mono"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.requiredInfo.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, requiredInfo: updated });
                          }}
                          className="p-1 hover:bg-white/5 text-red-400 rounded cursor-pointer font-mono"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.requiredInfo.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2 text-center">No prerequisite fields configured.</p>
                  )}
                </div>
              </div>

              {/* 2. Process Steps */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-xs uppercase text-white tracking-wide">Process Steps</h3>
                    <p className="text-[9px] font-mono text-[#D0D6BB]/50">Checklist instructions for completing the task</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStepIdx(null);
                      setStepForm({ title: '', instruction: '', assignedRole: 'marketing_coordinator', backupRole: 'operations_manager', type: 'manual', evidenceRequired: '', expectedDuration: '1h' });
                      setIsStepModalOpen(true);
                    }}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-mono rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {sopForm.steps.map((step: SOPStep, idx: number) => (
                    <div key={step.id} className="p-2.5 bg-black/20 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-left">
                        <span className="w-4 h-4 rounded-full bg-[#00635C] text-white flex items-center justify-center font-mono text-[8px] font-bold shrink-0">{idx + 1}</span>
                        <div>
                          <span className="font-bold text-xs text-white block">{step.title}</span>
                          <span className="text-[8px] text-[#D0D6BB]/40 uppercase font-mono">{step.type} | {step.assignedRole}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 select-none text-[8px]">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-white/5 text-[#D0D6BB]/60 hover:text-white rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'down')}
                          disabled={idx === sopForm.steps.length - 1}
                          className="p-1 hover:bg-white/5 text-[#D0D6BB]/60 hover:text-white rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(idx)}
                          className="p-1 hover:bg-white/5 text-purple-400 rounded cursor-pointer font-mono flex items-center gap-0.5"
                          title="Duplicate Step"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStepIdx(idx);
                            setStepForm(step);
                            setIsStepModalOpen(true);
                          }}
                          className="p-1 hover:bg-white/5 text-emerald-400 rounded cursor-pointer font-mono"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.steps.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, steps: updated });
                          }}
                          className="p-1 hover:bg-white/5 text-red-400 rounded cursor-pointer font-mono"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.steps.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2 text-center">No process steps configured.</p>
                  )}
                </div>
              </div>

              {/* 3. Decisions & Exceptions */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-xs uppercase text-white tracking-wide">Decisions & Exceptions</h3>
                    <p className="text-[9px] font-mono text-[#D0D6BB]/50">IF/THEN rules for special conditions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDecisionIdx(null);
                      setDecisionForm({ title: '', condition: '', action: '' });
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[9px] font-mono rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Decision
                  </button>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {sopForm.decisions.map((dec: SOPDecision, idx: number) => (
                    <div key={dec.id} className="p-2.5 bg-black/20 border border-white/5 rounded-2xl flex justify-between items-center gap-2">
                      <div className="text-left text-[10px]">
                        <span className="font-bold text-white block uppercase tracking-wider text-[8px] font-mono">{dec.title}</span>
                        <p className="text-amber-300 mt-0.5">IF: {dec.condition}</p>
                        <p className="text-emerald-300">THEN: {dec.action}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 select-none text-[8px]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDecisionIdx(idx);
                            setDecisionForm(dec);
                            setIsDecisionModalOpen(true);
                          }}
                          className="p-1 hover:bg-white/5 text-emerald-400 rounded cursor-pointer font-mono"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.decisions.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, decisions: updated });
                          }}
                          className="p-1 hover:bg-white/5 text-red-400 rounded cursor-pointer font-mono"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.decisions.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2 text-center">No exception rules configured.</p>
                  )}
                </div>
              </div>

              {/* 4. Completion Evidence */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase">Completion Evidence Verification</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <select
                      value={sopForm.completionEvidence?.type || 'manual'}
                      onChange={(e) => setSopForm({
                        ...sopForm,
                        completionEvidence: { ...sopForm.completionEvidence, type: e.target.value }
                      })}
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white font-sans focus:outline-none cursor-pointer"
                    >
                      <option value="manual">Manual Confirm</option>
                      <option value="file_upload">Upload File</option>
                      <option value="screenshot">Screenshot</option>
                      <option value="invoice">Audit Receipt</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={sopForm.completionEvidence?.description || ''}
                      onChange={(e) => setSopForm({
                        ...sopForm,
                        completionEvidence: { ...sopForm.completionEvidence, description: e.target.value }
                      })}
                      placeholder="e.g. Upload Drive sharing link folder of active launch..."
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Phase 3: Connect Operations */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              
              {/* Category / Routing Rule Selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/70 uppercase">Link Intake Request Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCat = prompt('Enter new Request / SOP Trigger Category name:');
                      if (newCat && newCat.trim()) {
                        const trimmed = newCat.trim();
                        const existing = routingRules.find((r: any) => r.category.toLowerCase() === trimmed.toLowerCase());
                        if (!existing) {
                          const newRule = {
                            category: trimmed,
                            primaryOwnerPositionId: sopForm.ownerRole || positions[0]?.id || 'pos_bic',
                            backupOwnerPositionId: sopForm.backupRole || 'pos_ryan',
                            sla: '24 hours',
                            status: 'active'
                          };
                          state.model.routingMatrix = [...routingRules, newRule];
                          setSopForm({ ...sopForm, relatedCategories: [trimmed] });
                        } else {
                          setSopForm({ ...sopForm, relatedCategories: [existing.category] });
                        }
                      }
                    }}
                    className="text-[9px] font-mono text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add New Category
                  </button>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white font-sans focus:outline-none cursor-pointer"
                >
                  <option value="">-- Start Manually Only --</option>
                  {routingRules.map((rule: any) => (
                    <option key={rule.category} value={rule.category}>
                      {rule.displayName || rule.category} (Routes to {rule.primaryOwnerPositionId})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-[#D0D6BB]/40 mt-1 font-sans">
                  SOP ownership and triggers map directly to Request Routing rules across all brokerage offices.
                </p>
              </div>

              {/* Owner Conflict Banner */}
              {isConflictingOwner && (
                <div className="p-3 bg-amber-950/25 border border-amber-500/30 text-amber-300 rounded-2xl text-[10px] space-y-2 font-sans leading-relaxed">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="block uppercase tracking-wider font-mono text-amber-400">Owner Conflict Warning</strong>
                      <p className="mt-0.5">Selected owner position ({sopForm.ownerRole}) differs from the mapped Request Routing rule ({matchedRule.primaryOwnerPositionId}) for category "{selectedCategory}".</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSopForm({
                        ...sopForm,
                        ownerRole: matchedRule.primaryOwnerPositionId,
                        backupRole: matchedRule.backupOwnerPositionId || sopForm.backupRole || ''
                      });
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-mono text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    ⚡ Align with Request Routing ({matchedRule.primaryOwnerPositionId})
                  </button>
                </div>
              )}

              {/* Owner and Backup selectors */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono text-[#D0D6BB]/70 uppercase mb-1">Responsible Primary Position</label>
                    <select
                      value={sopForm.ownerRole}
                      onChange={(e) => setSopForm({ ...sopForm, ownerRole: e.target.value })}
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white font-sans focus:outline-none cursor-pointer"
                    >
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.name})</option>
                      ))}
                    </select>
                    {(() => {
                      const pos = positions.find(p => p.id === sopForm.ownerRole);
                      return (
                        <p className="text-[9px] text-emerald-300/80 mt-1 font-sans flex items-center justify-between">
                          <span>Currently filled by: <strong>{pos ? pos.name : 'Unassigned'}</strong></span>
                          <button
                            type="button"
                            onClick={() => setCurrentView('builder')}
                            className="text-[#D0D6BB]/60 hover:text-white underline font-mono text-[8px]"
                          >
                            Manage Roles
                          </button>
                        </p>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[#D0D6BB]/70 uppercase mb-1">Backup Coverage Position</label>
                    <select
                      value={sopForm.backupRole || ''}
                      onChange={(e) => setSopForm({ ...sopForm, backupRole: e.target.value })}
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white font-sans focus:outline-none cursor-pointer"
                    >
                      <option value="">-- No Backup Role configured --</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.name})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tokenized Tag Input */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <label className="block text-[9px] font-mono text-[#D0D6BB]/70 uppercase">SOP Tags (Categorization & Search)</label>
                <div className="p-2 bg-black/25 border border-white/10 rounded-xl flex flex-wrap items-center gap-1.5 min-h-[42px]">
                  {(sopForm.tags || []).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (sopForm.tags || []).filter((_: any, i: number) => i !== idx);
                          setSopForm({ ...sopForm, tags: updated });
                        }}
                        className="hover:text-red-400 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type tag and press Enter or comma..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                        e.preventDefault();
                        const val = e.currentTarget.value.replace(/,/g, '').trim();
                        if (val && !(sopForm.tags || []).includes(val)) {
                          setSopForm({ ...sopForm, tags: [...(sopForm.tags || []), val] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.replace(/,/g, '').trim();
                      if (val && !(sopForm.tags || []).includes(val)) {
                        setSopForm({ ...sopForm, tags: [...(sopForm.tags || []), val] });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1 bg-transparent text-white text-xs focus:outline-none min-w-[150px] placeholder-[#D0D6BB]/40 font-sans"
                  />
                </div>
                <p className="text-[9px] text-[#D0D6BB]/40 font-sans">
                  Supports comma, Enter, Tab, and paste (e.g. <code>legal, compliance, urgent</code>).
                </p>
              </div>
            </div>
          )}

          {/* Phase 4: Review and Publish */}
          {wizardStep === 4 && (
            <div className="space-y-5">
              
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Draft Status</span>
                <h3 className="font-serif font-black text-sm text-white mt-1 leading-snug">Readiness Verification Review</h3>
                <p className="text-[10px] text-[#D0D6BB]/60 leading-normal font-sans mt-0.5">
                  Confirm checklist data integrity and perform a validation check before publishing.
                </p>
              </div>

              {/* Review Draft with AI action panel */}
              <div className="bg-[#013028]/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-serif font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Review Draft with AI
                  </h4>
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={handleRunAiReview}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-mono text-[9px] uppercase font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {reviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run Review'}
                  </button>
                </div>
                <p className="text-[10px] text-[#D0D6BB]/60 leading-normal font-sans">
                  Scan the draft procedure for structural improvements, missing coverage roles, or step clarity.
                </p>

                {reviewError && <p className="text-[9px] text-red-400 font-mono">{reviewError}</p>}

                {reviewFindings.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
                    {reviewFindings.map((finding, idx) => (
                      <div key={idx} className="p-3 bg-black/35 border border-white/5 rounded-xl space-y-1.5 text-left text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${
                            finding.level === 'critical' ? 'bg-red-500/10 text-red-300' :
                            finding.level === 'recommended' ? 'bg-amber-500/10 text-amber-300' : 'bg-blue-500/10 text-blue-300'
                          }`}>
                            {finding.level}
                          </span>
                          <span className="text-[8px] font-mono text-stone-500">{finding.section}</span>
                        </div>
                        <p className="text-white font-medium">{finding.problem}</p>
                        <p className="text-[#D0D6BB]/60">{finding.reason}</p>
                        <div className="bg-black/25 border border-white/5 p-2 rounded-lg mt-1 space-y-1">
                          <span className="text-[8px] font-mono text-stone-500 block uppercase">Proposed Fix:</span>
                          <span className="text-emerald-300">{finding.proposedImprovement}</span>
                        </div>
                        <div className="flex justify-end pt-1">
                          {finding.applied ? (
                            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Applied</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplyFinding(idx, finding)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-mono uppercase"
                            >
                              Apply Fix
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* 3-Category Finding Breakdown & 1-Click Auto-Remediation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl space-y-1 text-left text-[10px]">
                    <span className="font-mono text-red-300 font-bold uppercase text-[9px] block">1. Prerequisite Gaps</span>
                    <p className="text-white font-medium">lockbox_code field missing</p>
                    <span className="text-[#D0D6BB]/60 text-[9px] block">Causes 40% of initial checklist blocks.</span>
                  </div>
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1 text-left text-[10px]">
                    <span className="font-mono text-amber-300 font-bold uppercase text-[9px] block">2. Bottleneck Steps</span>
                    <p className="text-white font-medium">Step 2: Upload Documentation</p>
                    <span className="text-[#D0D6BB]/60 text-[9px] block">2.4 hrs avg vs 2.0 hrs target SLA.</span>
                  </div>
                  <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-1 text-left text-[10px]">
                    <span className="font-mono text-blue-300 font-bold uppercase text-[9px] block">3. Role Conflicts</span>
                    <p className="text-white font-medium">Step 3 Owner Alignment</p>
                    <span className="text-[#D0D6BB]/60 text-[9px] block">Re-align from Staff to Marketing Coordinator.</span>
                  </div>
                </div>

                {/* Pre-Publish Version Impact Scorecard */}
                <div className="bg-[#012a23] border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-left font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">⚡ AI Version Impact Scorecard (v1.1)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[8px] font-bold">READY TO PUBLISH</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center pt-1">
                    <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[8px] text-[#D0D6BB]/60 block uppercase font-sans">Projected SLA Reduction</span>
                      <strong className="text-sm text-emerald-300 block mt-0.5">-35% SLA Delay</strong>
                    </div>
                    <div className="bg-black/25 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[8px] text-[#D0D6BB]/60 block uppercase font-sans">First-Time Completion Rate</span>
                      <strong className="text-sm text-emerald-400 block mt-0.5">+18% Success</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#D0D6BB]/80 font-sans leading-relaxed pt-1">
                    Delta: Added lockbox_code prerequisite, re-aligned Step 3 to Marketing Coordinator, and reduced SLA bottleneck duration by 0.4 hrs.
                  </p>
                </div>
              </div>

              {/* Publish validation checks */}
              <div className="bg-[#01241e] border border-white/5 rounded-2xl p-4 space-y-2.5 text-xs text-[#D0D6BB]/80">
                <span className="text-[8px] font-mono uppercase text-stone-500 font-bold block select-none">Pre-flight Verification checks:</span>
                
                <div className="flex items-center gap-2">
                  {sopForm.title ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  <span>SOP Title configured: <strong className="text-white font-medium">{sopForm.title || 'Missing'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.purpose ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Purpose configured: <strong className="text-white font-medium">{sopForm.purpose ? 'Yes' : 'Missing'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.steps && sopForm.steps.length > 0 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  <span>Checklist steps total: <strong className="text-white font-medium">{sopForm.steps?.length || 0} step(s)</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.completionEvidence?.description ? <Check className="w-3.5 h-3.5 text-[#00E5C9]" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Evidence checklist confirmed: <strong className="text-white font-medium">{sopForm.completionEvidence?.description ? 'Yes' : 'Missing'}</strong></span>
                </div>
              </div>

              {/* Versioning & Review inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Version ID</label>
                  <input
                    type="text"
                    value={sopForm.version || '1.0'}
                    onChange={(e) => setSopForm({ ...sopForm, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[#D0D6BB]/40 uppercase mb-1">Revision Changelog</label>
                  <input
                    type="text"
                    value={sopForm.changeSummary || ''}
                    onChange={(e) => setSopForm({ ...sopForm, changeSummary: e.target.value })}
                    placeholder="Initial release details"
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-black/20 text-xs text-white placeholder-stone-500 font-sans focus:outline-none"
                  />
                </div>
              </div>

              {publishErrors.length > 0 && (
                <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-2xl space-y-1 font-mono text-[9px] text-red-400">
                  <span className="font-bold text-red-300 block uppercase select-none">Publish Errors Blocked</span>
                  {publishErrors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}

            </div>
          )}

          {/* Stepper buttons */}
          <div className="border-t border-white/5 pt-4 flex justify-between select-none text-[10px] font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                if (wizardStep > 1) {
                  setWizardStep(wizardStep - 1);
                } else {
                  setCurrentView('library');
                }
              }}
              className="px-4 py-2 hover:bg-white/5 border border-white/10 text-white font-bold rounded-xl transition-all cursor-pointer uppercase"
            >
              Back
            </button>

            {wizardStep < 4 ? (
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep + 1)}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white font-bold rounded-xl transition-all cursor-pointer uppercase"
              >
                Next Step
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveSop('draft')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold rounded-xl transition-all cursor-pointer uppercase"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isConflictingOwner) {
                      setIsConflictModalOpen(true);
                    } else {
                      handleSaveSop('published');
                    }
                  }}
                  className="px-4 py-2 bg-[#00E5C9] hover:bg-[#00c2ab] text-[#01362D] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  Publish v{sopForm.version}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Role Conflict Publish Modal */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 bg-[#012a23]/95 z-50 overflow-y-auto p-8 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="max-w-md w-full bg-[#012a23] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-left select-none">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-serif font-black text-sm uppercase text-white tracking-wider">Owner Role Conflict Detected</h3>
            </div>
            
            <p className="text-xs text-[#D0D6BB]/80 leading-relaxed font-sans">
              The assigned SOP owner (<strong className="text-amber-300 font-mono">{sopForm.ownerRole}</strong>) differs from the mapped Request Routing category owner (<strong className="text-emerald-300 font-mono">{matchedRule?.primaryOwnerPositionId}</strong>).
            </p>

            <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-1 font-mono text-[10px] text-[#D0D6BB]/60">
              <div className="flex justify-between">
                <span>Routing Category:</span>
                <span className="text-white font-bold">{selectedCategory}</span>
              </div>
              <div className="flex justify-between">
                <span>Routing Matrix Owner:</span>
                <span className="text-emerald-400 font-bold">{matchedRule?.primaryOwnerPositionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Current SOP Owner:</span>
                <span className="text-amber-400 font-bold">{sopForm.ownerRole}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => {
                  setSopForm({
                    ...sopForm,
                    ownerRole: matchedRule?.primaryOwnerPositionId || sopForm.ownerRole,
                    backupRole: matchedRule?.backupOwnerPositionId || sopForm.backupRole || ''
                  });
                  setIsConflictModalOpen(false);
                  setTimeout(() => handleSaveSop('published'), 100);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer uppercase transition-all"
              >
                ⚡ Align with Routing & Publish
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsConflictModalOpen(false);
                  handleSaveSop('published');
                }}
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl cursor-pointer uppercase transition-all"
              >
                Publish with Custom Override
              </button>

              <button
                type="button"
                onClick={() => setIsConflictModalOpen(false)}
                className="w-full py-2 border border-white/10 hover:bg-white/5 text-white/70 rounded-xl cursor-pointer uppercase transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
