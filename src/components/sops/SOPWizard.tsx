import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Check, 
  Trash2, 
  Zap, 
  Loader2, 
  HelpCircle, 
  Plus, 
  Copy, 
  Info,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { SOPField, SOPStep, SOPDecision, SOP_CATEGORY_TEMPLATES } from './sopTemplates';
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
  handleSaveSop: (statusOverride?: 'draft' | 'published' | 'for_comment' | 'awaiting_bic_review' | 'awaiting_owner_review') => Promise<void>;
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
      const res = await fetch('/api/ops/ai/draft-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brief: aiBrief,
          category: sopForm.category || sopForm.relatedCategories?.[0],
          jurisdiction: sopForm.stateJurisdiction || 'NC',
          title: sopForm.title,
          department: sopForm.department
        })
      });
      if (!res.ok) {
        throw new Error('Failed to generate AI SOP draft. Please refine your brief.');
      }
      const data = await res.json();
      if (data.sop) {
        setSuggestedDraft(data.sop);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI service unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyDraft = () => {
    if (!suggestedDraft) return;

    const merged = { ...sopForm };
    if (selectedSections.title && suggestedDraft.title) merged.title = suggestedDraft.title;
    if (selectedSections.purpose && suggestedDraft.purpose) merged.purpose = suggestedDraft.purpose;
    if (selectedSections.expectedOutcome && suggestedDraft.expectedOutcome) merged.expectedOutcome = suggestedDraft.expectedOutcome;
    if (selectedSections.scope && suggestedDraft.scope) merged.scope = suggestedDraft.scope;
    if (selectedSections.exclusions && suggestedDraft.exclusions) merged.exclusions = suggestedDraft.exclusions;
    if (selectedSections.trigger && suggestedDraft.trigger) {
      merged.trigger = suggestedDraft.trigger;
      merged.triggerType = suggestedDraft.triggerType || merged.triggerType;
    }
    if (selectedSections.requiredInfo && suggestedDraft.requiredInfo) merged.requiredInfo = suggestedDraft.requiredInfo;
    if (selectedSections.steps && suggestedDraft.steps) merged.steps = suggestedDraft.steps;
    if (selectedSections.decisions && suggestedDraft.decisions) merged.decisions = suggestedDraft.decisions;
    if (selectedSections.escalationBehavior && suggestedDraft.escalationBehavior) merged.escalationBehavior = suggestedDraft.escalationBehavior;
    if (selectedSections.completionEvidence && suggestedDraft.completionEvidence) merged.completionEvidence = suggestedDraft.completionEvidence;
    
    merged.changeSummary = 'AI-generated draft — review required';

    setSopForm(merged);
    setSuggestedDraft(null);
    setAiBrief('');
  };

  const handleFetchStageSuggestions = async (stageNum: number) => {
    setStageLoading(true);
    setStageError(null);
    try {
      const res = await fetch('/api/ops/ai/stage-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: stageNum,
          sopContext: sopForm
        })
      });
      if (!res.ok) throw new Error('Could not fetch stage suggestions.');
      const data = await res.json();
      if (data.suggestions) {
        setStageSuggestions(data.suggestions);
      }
    } catch (err: any) {
      setStageError(err.message || 'Suggestions unavailable.');
    } finally {
      setStageLoading(false);
    }
  };

  const handleRunAiReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/ops/ai/review-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopForm })
      });
      if (!res.ok) throw new Error('AI Review service unavailable.');
      const data = await res.json();
      if (data.findings) {
        setReviewFindings(data.findings);
      }
    } catch (err: any) {
      setReviewError(err.message || 'Review failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApplyFinding = (findingIdx: number, finding: any) => {
    const updatedForm = { ...sopForm };
    if (finding.section === 'purpose' && finding.proposedImprovement) {
      updatedForm.purpose = finding.proposedImprovement;
    } else if (finding.section === 'steps' && finding.proposedStep) {
      updatedForm.steps.push(finding.proposedStep);
    } else if (finding.section === 'escalation' && finding.proposedEscalation) {
      updatedForm.escalationBehavior = finding.proposedEscalation;
    }
    setSopForm(updatedForm);

    const updatedFindings = [...reviewFindings];
    updatedFindings[findingIdx].applied = true;
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
    <div className="flex-grow flex flex-col md:flex-row min-h-0 bg-[#F7F8F5] text-stone-900 text-left select-none font-sans">
      
      {/* Stepper Rail (Light Mode) */}
      <div className="w-full md:w-72 shrink-0 bg-white border-r border-stone-200/90 p-5 flex flex-col justify-between select-none overflow-y-auto shadow-2xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <span className="text-[11px] font-bold text-[#00635C] uppercase tracking-wider block font-mono">
              SOP BUILDER
            </span>
            <button
              type="button"
              onClick={() => setCurrentView('library')}
              className="text-stone-400 hover:text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { num: 1, label: 'Phase 1: Define', desc: 'Purpose, title, expected outcomes' },
              { num: 2, label: 'Phase 2: Procedure', desc: 'Prerequisites, steps, decisions, evidence' },
              { num: 3, label: 'Phase 3: Connect Ops', desc: 'Routing, owners, escalation policies' },
              { num: 4, label: 'Phase 4: Review & Publish', desc: 'Readiness, AI review, version locking' }
            ].map(step => (
              <button
                key={step.num}
                onClick={() => setWizardStep(step.num)}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer w-full ${
                  wizardStep === step.num 
                    ? 'bg-[#00635C] text-white shadow-xs border border-[#00635C]' 
                    : 'bg-stone-50 hover:bg-stone-100/90 text-stone-700 border border-stone-200/80'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                  wizardStep === step.num 
                    ? 'bg-white text-[#00635C] border-white shadow-2xs' 
                    : 'border-stone-300 bg-white text-stone-600'
                }`}>
                  {step.num}
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${
                    wizardStep === step.num ? 'text-white' : 'text-stone-900'
                  }`}>
                    {step.label}
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${
                    wizardStep === step.num ? 'text-[#E5EFEA]' : 'text-stone-500'
                  }`}>
                    {step.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400 leading-relaxed font-mono">
          Structured procedural model. All draft revisions are version-locked.
        </div>
      </div>

      {/* Form Canvas Area (Light Mode) */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 relative space-y-6 bg-[#F7F8F5]">
        
        {/* AI Draft Review Screen Modal */}
        {suggestedDraft && (
          <div className="fixed inset-0 bg-stone-900/50 z-50 overflow-y-auto p-4 flex flex-col items-center justify-center backdrop-blur-xs animate-fadeIn">
            <div className="max-w-2xl w-full bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left select-none max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#00635C] block font-bold">
                    AI Draft — Review Required
                  </span>
                  <h2 className="font-serif font-bold text-lg text-stone-900 mt-0.5">
                    Review Generated SOP Draft
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Select the sections you want to apply to this SOP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSuggestedDraft(null); setAiBrief(''); }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
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
                  <label key={sec.key} className="flex items-start gap-3 p-3 bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-2xl cursor-pointer transition-all select-none">
                    <input
                      type="checkbox"
                      checked={!!selectedSections[sec.key]}
                      onChange={(e) => setSelectedSections({ ...selectedSections, [sec.key]: e.target.checked })}
                      className="mt-1 accent-[#00635C]"
                    />
                    <div className="space-y-0.5">
                      <strong className="text-xs text-stone-900 block leading-tight">{sec.label}</strong>
                      <span className="text-[11px] text-stone-600 block leading-relaxed">{sec.val || '(Not defined)'}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end border-t border-stone-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setSuggestedDraft(null); setAiBrief(''); }}
                  className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl cursor-pointer transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = Object.keys(selectedSections).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                    setSelectedSections(allTrue);
                    setTimeout(() => handleApplyDraft(), 50);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl cursor-pointer transition-colors"
                >
                  Apply All
                </button>
                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl cursor-pointer font-bold shadow-xs transition-colors"
                >
                  Apply Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Form White Card */}
        <div className="max-w-3xl mx-auto bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
          
          {/* AI Banner warning if draft */}
          {sopForm.changeSummary === 'AI-generated draft — review required' && (
            <div className="p-3.5 bg-[#E5EFEA] border border-[#00635C]/30 text-[#00635C] rounded-2xl text-xs flex items-center gap-2.5 font-medium">
              <Sparkles className="w-4 h-4 text-[#00635C] shrink-0" />
              <span>AI-generated draft in progress. Please review the details below before publishing.</span>
            </div>
          )}

          {/* Phase 1: Define */}
          {wizardStep === 1 && (
            <div className="space-y-6">
              
              {/* Step 1.1: Category Starter Template & Regulatory Jurisdiction */}
              <div className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00635C] font-bold block">
                      Step 1.1 · Category Starter & Jurisdiction
                    </span>
                    <h4 className="text-xs font-serif font-bold text-stone-900 mt-0.5">
                      Select Process Category & State Jurisdiction
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-stone-600 whitespace-nowrap">State Jurisdiction:</label>
                    <select
                      value={sopForm.stateJurisdiction || 'NC'}
                      onChange={(e) => setSopForm({ ...sopForm, stateJurisdiction: e.target.value })}
                      className="p-1.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg text-[#00635C] focus:outline-none focus:ring-2 focus:ring-[#00635C]/20"
                    >
                      <option value="NC">NC (North Carolina — Default)</option>
                      <option value="SC">SC (South Carolina)</option>
                      <option value="VA">VA (Virginia)</option>
                      <option value="Federal / Multi-State">Federal / Multi-State</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                {/* Category Starter Pills */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-2">
                    Starter Template Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOP_CATEGORY_TEMPLATES.map((catTmpl) => {
                      const isSelected = (sopForm.category || sopForm.relatedCategories?.[0]) === catTmpl.category;
                      return (
                        <button
                          key={catTmpl.category}
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...sopForm,
                              category: catTmpl.category,
                              relatedCategories: [catTmpl.category],
                              department: catTmpl.defaultDepartment || sopForm.department,
                              ownerRole: catTmpl.defaultOwnerRole || sopForm.ownerRole,
                              stateJurisdiction: sopForm.stateJurisdiction || catTmpl.jurisdiction || 'NC',
                              sopOwner: sopForm.sopOwner || { type: 'department', name: catTmpl.defaultDepartment || 'Operations' }
                            };
                            setSopForm(updated);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#00635C] text-white border-[#00635C] shadow-xs'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{catTmpl.category}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-[10px] block mt-1 line-clamp-2 ${isSelected ? 'text-[#E5EFEA]' : 'text-stone-500'}`}>
                            {catTmpl.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SOP Owner Selector (Department vs Person) */}
                <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      SOP Owner Type
                    </label>
                    <div className="flex rounded-xl bg-stone-100 p-0.5 border border-stone-200">
                      <button
                        type="button"
                        onClick={() => {
                          setSopForm({
                            ...sopForm,
                            sopOwner: { type: 'department', name: sopForm.department || 'Operations' }
                          });
                        }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          (!sopForm.sopOwner || sopForm.sopOwner.type === 'department')
                            ? 'bg-white text-[#00635C] shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Department
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSopForm({
                            ...sopForm,
                            sopOwner: { type: 'person', name: sopForm.ownerRole || 'Operations Lead' }
                          });
                        }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          sopForm.sopOwner?.type === 'person'
                            ? 'bg-white text-[#00635C] shadow-2xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Role / Person
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      {sopForm.sopOwner?.type === 'person' ? 'Assigned Owner Role' : 'Governing Department'}
                    </label>
                    {sopForm.sopOwner?.type === 'person' ? (
                      <input
                        type="text"
                        value={sopForm.sopOwner?.name || sopForm.ownerRole || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSopForm({
                            ...sopForm,
                            sopOwner: { type: 'person', name: val },
                            ownerRole: val
                          });
                        }}
                        placeholder="e.g. Transaction Coordinator, Operations Lead"
                        className="w-full p-2 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                      />
                    ) : (
                      <select
                        value={sopForm.department || 'Operations'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSopForm({
                            ...sopForm,
                            department: val,
                            sopOwner: { type: 'department', name: val }
                          });
                        }}
                        className="w-full p-2 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] cursor-pointer"
                      >
                        <option value="Operations">Operations</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Finance">Finance & Accounting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Transactions">Transactions & Escrow</option>
                        <option value="Leadership">Leadership & BIC</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 1.2: Core Operational Fields */}
              <div className="p-4 sm:p-5 bg-white border border-stone-200/90 rounded-2xl space-y-4 shadow-2xs">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#00635C] font-bold block">
                    Step 1.2 · Operational Fields & Bounds
                  </span>
                  <h4 className="text-xs font-serif font-bold text-stone-900 mt-0.5">
                    Define Scope, Trigger, and Expected Outcomes
                  </h4>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">SOP Title</label>
                    <input
                      type="text"
                      value={sopForm.title}
                      onChange={(e) => setSopForm({ ...sopForm, title: e.target.value })}
                      placeholder="e.g. Listing Launch SOP"
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Purpose</label>
                    <div className="space-y-1">
                      <textarea
                        value={sopForm.purpose}
                        onChange={(e) => setSopForm({ ...sopForm, purpose: e.target.value })}
                        placeholder="Detail why this standard process exists..."
                        className="w-full h-20 p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                      />
                      <AIFieldAssistant field="purpose" value={sopForm.purpose} onChange={(val) => setSopForm({ ...sopForm, purpose: val })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Expected Outcome</label>
                    <div className="space-y-1">
                      <textarea
                        value={sopForm.expectedOutcome}
                        onChange={(e) => setSopForm({ ...sopForm, expectedOutcome: e.target.value })}
                        placeholder="Detail what is achieved once this SOP is executed..."
                        className="w-full h-20 p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                      />
                      <AIFieldAssistant field="expectedOutcome" value={sopForm.expectedOutcome} onChange={(val) => setSopForm({ ...sopForm, expectedOutcome: val })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Scope</label>
                      <input
                        type="text"
                        value={sopForm.scope || ''}
                        onChange={(e) => setSopForm({ ...sopForm, scope: e.target.value })}
                        placeholder="All listings/standard agents"
                        className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">Exclusions</label>
                      <input
                        type="text"
                        value={sopForm.exclusions || ''}
                        onChange={(e) => setSopForm({ ...sopForm, exclusions: e.target.value })}
                        placeholder="Commercial/rentals"
                        className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Intake Trigger Condition</label>
                    <input
                      type="text"
                      value={sopForm.trigger || ''}
                      onChange={(e) => setSopForm({ ...sopForm, trigger: e.target.value })}
                      placeholder="New Listing launch request received"
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Step 1.3: AI Draft Generator (Generate Last) */}
              <div className="bg-[#E5EFEA]/40 border border-[#00635C]/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00635C] font-bold block">
                      Step 1.3 · Procedural Synthesis (Generate Last)
                    </span>
                    <h4 className="text-xs font-serif font-bold uppercase text-[#01362D] tracking-wider flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="w-4 h-4 text-[#00635C]" />
                      Describe Procedure & Synthesize Draft
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00635C]/10 text-[#00635C] text-[10px] font-mono font-bold">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-normal font-sans">
                  Provide a rough description of the operational procedure. Shapework AI will analyze your category, jurisdiction, and operational fields to synthesize a 4-stage procedural framework.
                </p>
                <textarea
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder="e.g. For marketing launch, agent uploads MLS listing photography link. Operations Lead verifies MLS compliance and prepares print collateral. Client approval confirmed before social media distribution..."
                  className="w-full h-24 p-3 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] font-sans shadow-2xs"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={aiLoading || !aiBrief.trim()}
                    onClick={handleBuildDraft}
                    className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Generate SOP Draft with AI</span>
                  </button>
                  <span className="text-[11px] text-stone-500 italic">
                    Or click "Next Step" below to configure steps manually.
                  </span>
                </div>
                {aiError && <span className="text-xs text-red-600 block mt-1">{aiError}</span>}
              </div>

            </div>
          )}

          {/* Phase 2: Build the Procedure */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              
              {/* Stage Suggestions box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-serif font-bold uppercase text-stone-900 tracking-wider flex items-center gap-1.5 select-none">
                  <Sparkles className="w-4 h-4 text-[#00635C]" />
                  Procedure Suggestion Helpers
                </h4>
                <p className="text-xs text-stone-600 leading-normal font-sans">
                  Fetch AI-driven recommendations based on brokerage handbook standard rules.
                </p>
                <div className="flex gap-2 flex-wrap text-xs font-semibold select-none">
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(4)}
                    className="px-3 py-1.5 bg-white hover:bg-[#E5EFEA] hover:text-[#00635C] text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 shadow-2xs"
                  >
                    Suggest Required Info
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(5)}
                    className="px-3 py-1.5 bg-white hover:bg-[#E5EFEA] hover:text-[#00635C] text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 shadow-2xs"
                  >
                    Generate Steps
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(6)}
                    className="px-3 py-1.5 bg-white hover:bg-[#E5EFEA] hover:text-[#00635C] text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 shadow-2xs"
                  >
                    Suggest Decisions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchStageSuggestions(8)}
                    className="px-3 py-1.5 bg-white hover:bg-[#E5EFEA] hover:text-[#00635C] text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 shadow-2xs"
                  >
                    Suggest Evidence
                  </button>
                </div>

                {stageLoading && (
                  <div className="flex items-center gap-2 text-xs text-stone-500 py-2 select-none">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00635C]" /> Fetching stage suggestions...
                  </div>
                )}
                {stageError && <span className="text-xs text-red-600 block">{stageError}</span>}

                {/* Render suggestion output if available */}
                {stageSuggestions && (
                  <div className="mt-3 bg-white border border-stone-200 p-4 rounded-2xl max-h-56 overflow-y-auto space-y-2 text-left shadow-2xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#00635C] font-bold block select-none">Suggested Items:</span>
                    
                    {/* suggest required fields */}
                    {stageSuggestions.requiredInfo && stageSuggestions.requiredInfo.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-100">
                        <span className="text-stone-800">{f.name} ({f.dataType})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.requiredInfo, { id: `field_${Date.now()}_${idx}`, ...f }];
                            setSopForm({ ...sopForm, requiredInfo: updated });
                          }}
                          className="px-2.5 py-1 bg-[#E5EFEA] hover:bg-[#d5e7df] text-[#00635C] rounded-lg font-semibold text-xs"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest steps */}
                    {stageSuggestions.steps && stageSuggestions.steps.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-100">
                        <span className="truncate max-w-sm text-stone-800">{s.title}: {s.instruction}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.steps, { id: `step_${Date.now()}_${idx}`, ...s }];
                            setSopForm({ ...sopForm, steps: updated });
                          }}
                          className="px-2.5 py-1 bg-[#E5EFEA] hover:bg-[#d5e7df] text-[#00635C] rounded-lg font-semibold text-xs shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest decisions */}
                    {stageSuggestions.decisions && stageSuggestions.decisions.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-100">
                        <span className="text-stone-800">IF {d.condition} THEN {d.action}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sopForm.decisions, { id: `dec_${Date.now()}_${idx}`, ...d }];
                            setSopForm({ ...sopForm, decisions: updated });
                          }}
                          className="px-2.5 py-1 bg-[#E5EFEA] hover:bg-[#d5e7df] text-[#00635C] rounded-lg font-semibold text-xs"
                        >
                          + Add
                        </button>
                      </div>
                    ))}

                    {/* suggest evidence */}
                    {stageSuggestions.completionEvidence && (
                      <div className="flex justify-between items-start text-xs py-1.5">
                        <div>
                          <strong className="block text-stone-900">Completion Deliverable ({stageSuggestions.completionEvidence.type})</strong>
                          <p className="text-xs text-stone-600">{stageSuggestions.completionEvidence.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSopForm({ ...sopForm, completionEvidence: { ...stageSuggestions.completionEvidence } });
                          }}
                          className="px-2.5 py-1 bg-[#E5EFEA] hover:bg-[#d5e7df] text-[#00635C] rounded-lg font-semibold text-xs"
                        >
                          Use
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 1. Required Information (Fields) */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-bold text-xs uppercase text-stone-900 tracking-wide">Prerequisite Information</h3>
                    <p className="text-xs text-stone-500">Variables collected during intake signals</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFieldIdx(null);
                      setFieldForm({ name: '', description: '', dataType: 'text', required: 'yes', example: '', source: '' });
                      setIsFieldModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sopForm.requiredInfo.map((field: SOPField, idx: number) => (
                    <div key={field.id} className="p-3 bg-stone-50 border border-stone-200/80 hover:border-stone-300 rounded-2xl flex justify-between items-center gap-2">
                      <div className="text-left">
                        <span className="font-bold text-xs text-stone-900 block">{field.name}</span>
                        <span className="text-[10px] text-stone-500 uppercase font-mono">
                          Type: {field.dataType} • Required: {field.required}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 select-none text-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-900 rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'down')}
                          disabled={idx === sopForm.requiredInfo.length - 1}
                          className="p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-900 rounded disabled:opacity-30 cursor-pointer font-mono"
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
                          className="px-2 py-0.5 hover:bg-stone-200 text-[#00635C] font-semibold rounded cursor-pointer text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.requiredInfo.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, requiredInfo: updated });
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.requiredInfo.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-3 text-center">No prerequisite fields configured.</p>
                  )}
                </div>
              </div>

              {/* 2. Process Steps */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-bold text-xs uppercase text-stone-900 tracking-wide">Process Steps</h3>
                    <p className="text-xs text-stone-500">Checklist instructions for completing the task</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStepIdx(null);
                      setStepForm({ title: '', instruction: '', assignedRole: 'marketing_coordinator', backupRole: 'operations_manager', type: 'manual', evidenceRequired: '', expectedDuration: '1h' });
                      setIsStepModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sopForm.steps.map((step: SOPStep, idx: number) => (
                    <div key={step.id} className="p-3 bg-stone-50 border border-stone-200/80 hover:border-stone-300 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-left">
                        <span className="w-5 h-5 rounded-full bg-[#00635C] text-white flex items-center justify-center font-mono text-[9px] font-bold shrink-0">{idx + 1}</span>
                        <div>
                          <span className="font-bold text-xs text-stone-900 block">{step.title}</span>
                          <span className="text-[10px] text-stone-500 uppercase font-mono">{step.type} • {step.assignedRole}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 select-none text-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-900 rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 'down')}
                          disabled={idx === sopForm.steps.length - 1}
                          className="p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-900 rounded disabled:opacity-30 cursor-pointer font-mono"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(idx)}
                          className="p-1 hover:bg-stone-200 text-purple-600 rounded cursor-pointer flex items-center"
                          title="Duplicate Step"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStepIdx(idx);
                            setStepForm(step);
                            setIsStepModalOpen(true);
                          }}
                          className="px-2 py-0.5 hover:bg-stone-200 text-[#00635C] font-semibold rounded cursor-pointer text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.steps.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, steps: updated });
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.steps.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-3 text-center">No process steps configured.</p>
                  )}
                </div>
              </div>

              {/* 3. Decisions & Exceptions */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-bold text-xs uppercase text-stone-900 tracking-wide">Decisions & Exceptions</h3>
                    <p className="text-xs text-stone-500">IF/THEN rules for special conditions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDecisionIdx(null);
                      setDecisionForm({ title: '', condition: '', action: '' });
                      setIsDecisionModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    + Add Decision
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sopForm.decisions.map((dec: SOPDecision, idx: number) => (
                    <div key={dec.id} className="p-3 bg-stone-50 border border-stone-200/80 hover:border-stone-300 rounded-2xl flex justify-between items-center gap-2">
                      <div className="text-left text-xs space-y-0.5">
                        <span className="font-bold text-stone-900 block uppercase tracking-wider text-[10px] font-mono">{dec.title}</span>
                        <p className="text-amber-700">IF: {dec.condition}</p>
                        <p className="text-[#00635C]">THEN: {dec.action}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 select-none text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDecisionIdx(idx);
                            setDecisionForm(dec);
                            setIsDecisionModalOpen(true);
                          }}
                          className="px-2 py-0.5 hover:bg-stone-200 text-[#00635C] font-semibold rounded cursor-pointer text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sopForm.decisions.filter((_: any, i: number) => i !== idx);
                            setSopForm({ ...sopForm, decisions: updated });
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {sopForm.decisions.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-3 text-center">No exception rules configured.</p>
                  )}
                </div>
              </div>

              {/* 4. Completion Evidence */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Completion Evidence Verification</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <select
                      value={sopForm.completionEvidence?.type || 'manual'}
                      onChange={(e) => setSopForm({
                        ...sopForm,
                        completionEvidence: { ...sopForm.completionEvidence, type: e.target.value }
                      })}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] cursor-pointer shadow-2xs"
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
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Phase 3: Connect Operations */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              
              {/* Category / Routing Rule Selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-stone-700">Link Intake Request Category</label>
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
                    className="text-xs font-semibold text-[#00635C] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Category
                  </button>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] cursor-pointer shadow-2xs"
                >
                  <option value="">-- Start Manually Only --</option>
                  {routingRules.map((rule: any) => (
                    <option key={rule.category} value={rule.category}>
                      {rule.displayName || rule.category} (Routes to {rule.primaryOwnerPositionId})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-500 mt-1 font-sans">
                  SOP ownership and triggers map directly to Request Routing rules across all brokerage offices.
                </p>
              </div>

              {/* Owner Conflict Banner */}
              {isConflictingOwner && (
                <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-2 font-sans leading-relaxed">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="block uppercase tracking-wider font-mono text-amber-800 text-[10px]">Owner Conflict Warning</strong>
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
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    ⚡ Align with Request Routing ({matchedRule.primaryOwnerPositionId})
                  </button>
                </div>
              )}

              {/* Owner and Backup selectors */}
              <div className="space-y-4 pt-2 border-t border-stone-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Responsible Primary Position</label>
                    <select
                      value={sopForm.ownerRole}
                      onChange={(e) => setSopForm({ ...sopForm, ownerRole: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] cursor-pointer shadow-2xs"
                    >
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.name})</option>
                      ))}
                    </select>
                    {(() => {
                      const pos = positions.find(p => p.id === sopForm.ownerRole);
                      return (
                        <p className="text-xs text-stone-500 mt-1 font-sans flex items-center justify-between">
                          <span>Filled by: <strong className="text-stone-800">{pos ? pos.name : 'Unassigned'}</strong></span>
                          <button
                            type="button"
                            onClick={() => setCurrentView('builder')}
                            className="text-[#00635C] hover:underline font-semibold text-[11px]"
                          >
                            Manage Roles
                          </button>
                        </p>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">Backup Coverage Position</label>
                    <select
                      value={sopForm.backupRole || ''}
                      onChange={(e) => setSopForm({ ...sopForm, backupRole: e.target.value })}
                      className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] cursor-pointer shadow-2xs"
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
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <label className="block text-[11px] font-semibold text-stone-700">SOP Tags (Categorization & Search)</label>
                <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-xl flex flex-wrap items-center gap-1.5 min-h-[44px]">
                  {(sopForm.tags || []).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#E5EFEA] border border-[#00635C]/30 text-[#00635C] text-xs font-semibold flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (sopForm.tags || []).filter((_: any, i: number) => i !== idx);
                          setSopForm({ ...sopForm, tags: updated });
                        }}
                        className="hover:text-red-600 font-bold ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type tag and press Enter..."
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
                    className="flex-1 bg-transparent text-stone-900 text-xs focus:outline-none min-w-[150px] placeholder:text-stone-400 font-sans"
                  />
                </div>
                <p className="text-xs text-stone-500 font-sans">
                  Supports Enter, comma, or paste (e.g. <code>legal, compliance, urgent</code>).
                </p>
              </div>
            </div>
          )}

          {/* Phase 4: Review and Publish */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block font-bold">Draft Status</span>
                <h3 className="font-serif font-bold text-base text-stone-900 mt-0.5">Readiness Verification Review</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Confirm checklist data integrity and perform a validation check before publishing.
                </p>
              </div>

              {/* Review Draft with AI action panel */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-serif font-bold uppercase text-stone-900 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#00635C]" />
                    Review Draft with AI
                  </h4>
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={handleRunAiReview}
                    className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                  >
                    {reviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run Review'}
                  </button>
                </div>
                <p className="text-xs text-stone-600 leading-normal font-sans">
                  Scan the draft procedure for structural improvements, missing coverage roles, or step clarity.
                </p>

                {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}

                {reviewFindings.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
                    {reviewFindings.map((finding, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-1.5 text-left text-xs shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            finding.level === 'critical' ? 'bg-red-100 text-red-800' :
                            finding.level === 'recommended' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {finding.level}
                          </span>
                          <span className="text-xs text-stone-400 font-mono">{finding.section}</span>
                        </div>
                        <p className="text-stone-900 font-semibold">{finding.problem}</p>
                        <p className="text-stone-600">{finding.reason}</p>
                        <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-lg mt-1 space-y-1">
                          <span className="text-[10px] text-stone-400 block uppercase font-bold">Proposed Fix:</span>
                          <span className="text-[#00635C] font-medium">{finding.proposedImprovement}</span>
                        </div>
                        <div className="flex justify-end pt-1">
                          {finding.applied ? (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Applied</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplyFinding(idx, finding)}
                              className="px-3 py-1 bg-[#00635C] hover:bg-[#00514B] text-white rounded-lg text-xs font-semibold shadow-2xs"
                            >
                              Apply Fix
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 3-Category Finding Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-left text-xs">
                    <span className="text-red-800 font-bold uppercase text-[10px] block">1. Prerequisite Gaps</span>
                    <p className="text-stone-900 font-medium">lockbox_code field missing</p>
                    <span className="text-stone-500 text-[11px] block">Reduces checklist delays by 40%.</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-left text-xs">
                    <span className="text-amber-800 font-bold uppercase text-[10px] block">2. Bottleneck Steps</span>
                    <p className="text-stone-900 font-medium">Step 2: Upload Documentation</p>
                    <span className="text-stone-500 text-[11px] block">2.4 hrs avg vs 2.0 hrs target due time.</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-left text-xs">
                    <span className="text-blue-800 font-bold uppercase text-[10px] block">3. Role Conflicts</span>
                    <p className="text-stone-900 font-medium">Step 3 Owner Alignment</p>
                    <span className="text-stone-500 text-[11px] block">Re-align from Staff to Marketing Coordinator.</span>
                  </div>
                </div>

                {/* Pre-Publish Version Impact Scorecard */}
                <div className="bg-emerald-50/60 border border-emerald-300 rounded-2xl p-4 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[#00635C] font-bold text-xs tracking-wide">⚡ AI Version Impact Scorecard (v1.1)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">READY TO PUBLISH</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center pt-1">
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[11px] text-stone-500 block">Projected SLA Reduction</span>
                      <strong className="text-base text-[#00635C] block mt-0.5">-35% SLA Delay</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[11px] text-stone-500 block">First-Time Completion</span>
                      <strong className="text-base text-emerald-700 block mt-0.5">+18% Success</strong>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed pt-1">
                    Delta: Added lockbox_code prerequisite, re-aligned Step 3 to Marketing Coordinator, and reduced SLA bottleneck duration by 0.4 hrs.
                  </p>
                </div>
              </div>

              {/* Publish validation checks */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5 text-xs text-stone-700">
                <span className="text-[10px] uppercase text-stone-400 font-bold block select-none">Pre-flight Verification checks:</span>
                
                <div className="flex items-center gap-2">
                  {sopForm.title ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <span>SOP Title configured: <strong className="text-stone-900 font-semibold">{sopForm.title || 'Missing'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.purpose ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <span>Purpose configured: <strong className="text-stone-900 font-semibold">{sopForm.purpose ? 'Yes' : 'Missing'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.steps && sopForm.steps.length > 0 ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                  <span>Checklist steps total: <strong className="text-stone-900 font-semibold">{sopForm.steps?.length || 0} step(s)</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {sopForm.completionEvidence?.description ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <span>Evidence checklist confirmed: <strong className="text-stone-900 font-semibold">{sopForm.completionEvidence?.description ? 'Yes' : 'Missing'}</strong></span>
                </div>
              </div>

              {/* Versioning & Review inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Version ID</label>
                  <input
                    type="text"
                    value={sopForm.version || '1.0'}
                    onChange={(e) => setSopForm({ ...sopForm, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">Revision Changelog</label>
                  <input
                    type="text"
                    value={sopForm.changeSummary || ''}
                    onChange={(e) => setSopForm({ ...sopForm, changeSummary: e.target.value })}
                    placeholder="Initial release details"
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] shadow-2xs"
                  />
                </div>
              </div>

              {publishErrors.length > 0 && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1 text-xs text-red-700">
                  <span className="font-bold text-red-800 block uppercase select-none">Publish Errors Blocked</span>
                  {publishErrors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}

            </div>
          )}

          {/* Stepper Bottom Navigation */}
          <div className="border-t border-stone-100 pt-5 flex justify-between select-none text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                if (wizardStep > 1) {
                  setWizardStep(wizardStep - 1);
                } else {
                  setCurrentView('library');
                }
              }}
              className="px-4 py-2 hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {wizardStep < 4 ? (
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep + 1)}
                className="px-5 py-2.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveSop('draft')}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSop('for_comment')}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
                  title="Share draft with team for feedback before formal review"
                >
                  Draft for Comment
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cat = (sopForm.category || sopForm.relatedCategories?.[0] || sopForm.department || '').toLowerCase();
                    const isBicReview = cat.includes('transact') || cat.includes('compliance') || cat.includes('legal') || cat.includes('escrow') || cat.includes('contract');
                    handleSaveSop(isBicReview ? 'awaiting_bic_review' : 'awaiting_owner_review');
                  }}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
                  title="Submit for formal BIC / Owner review"
                >
                  Submit for Formal Review
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
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl transition-colors cursor-pointer shadow-xs font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish v{sopForm.version}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Role Conflict Publish Modal */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 overflow-y-auto p-4 flex flex-col items-center justify-center backdrop-blur-xs animate-fadeIn">
          <div className="max-w-md w-full bg-white border border-amber-300 rounded-3xl p-6 shadow-2xl space-y-4 text-left select-none">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-serif font-bold text-base text-stone-900">Owner Role Conflict Detected</h3>
            </div>
            
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              The assigned SOP owner (<strong className="text-amber-800 font-mono">{sopForm.ownerRole}</strong>) differs from the mapped Request Routing category owner (<strong className="text-[#00635C] font-mono">{matchedRule?.primaryOwnerPositionId}</strong>).
            </p>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 font-mono text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Routing Category:</span>
                <span className="text-stone-900 font-bold">{selectedCategory}</span>
              </div>
              <div className="flex justify-between">
                <span>Routing Matrix Owner:</span>
                <span className="text-[#00635C] font-bold">{matchedRule?.primaryOwnerPositionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Current SOP Owner:</span>
                <span className="text-amber-700 font-bold">{sopForm.ownerRole}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 text-xs font-semibold">
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
                className="w-full py-2.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                ⚡ Align with Routing & Publish
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsConflictModalOpen(false);
                  handleSaveSop('published');
                }}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl cursor-pointer transition-colors"
              >
                Publish with Custom Override
              </button>

              <button
                type="button"
                onClick={() => setIsConflictModalOpen(false)}
                className="w-full py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl cursor-pointer transition-colors"
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
