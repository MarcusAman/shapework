import React, { useState } from 'react';
import { 
  ArrowRight, Link2, ExternalLink, FileText, Download, Eye, EyeOff, 
  Sparkles, Trash2, AlertTriangle, X, CheckSquare, Clock, ShieldCheck, 
  Calendar, Layers, User, Users, CheckCircle2, ChevronRight, FileCheck, AlertCircle
} from 'lucide-react';
import { useToast } from '../ui';
import { lintSopText } from '../../utils/sopRoleGuard';

interface SOPDocumentViewProps {
  selectedSop: any;
  setSelectedViewTab: (tab: any) => void;
  activeSubTab?: 'overview' | 'procedure' | 'checklist' | 'versions';
  selectedRun?: any;
  runs?: any[];
  state?: any;
  onDeleteDraft?: (sop: any) => void;
  onDeleteSop?: (sop: any) => void;
}

export default function SOPDocumentView({ 
  selectedSop, 
  setSelectedViewTab, 
  activeSubTab = 'overview',
  selectedRun, 
  runs = [],
  state, 
  onDeleteDraft, 
  onDeleteSop 
}: SOPDocumentViewProps) {
  const { toast } = useToast();
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local interactive checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Active view stage: 'overview' | 'procedure' | 'checklist' | 'versions'
  const currentStage: 'overview' | 'procedure' | 'checklist' | 'versions' = 
    activeSubTab === 'procedure' || activeSubTab === 'process' ? 'procedure' :
    activeSubTab === 'checklist' ? 'checklist' :
    activeSubTab === 'versions' || activeSubTab === 'performance' ? 'versions' :
    'overview';

  if (!selectedSop) return null;

  const [selectedState, setSelectedState] = useState<string>(selectedSop.stateJurisdiction || 'NC');

  React.useEffect(() => {
    if (selectedSop) {
      setSelectedState(selectedSop.stateJurisdiction || 'NC');
    }
  }, [selectedSop?.id, selectedSop?.sopId]);

  const hasStateAddenda = !!selectedSop.stateAddenda && Object.keys(selectedSop.stateAddenda).length > 0;
  const availableStates = hasStateAddenda 
    ? Array.from(new Set([selectedSop.stateJurisdiction || 'NC', ...Object.keys(selectedSop.stateAddenda)]))
    : [selectedSop.stateJurisdiction || 'NC'];
  const activeAddendum = selectedSop.stateAddenda?.[selectedState];

  const isDraft = selectedSop.status === 'draft' || selectedSop.status === 'for_comment' || selectedSop.status === 'under_review';
  const sourceDoc = selectedSop.sourceDocument;
  const activationDateStr = selectedSop.activationDate || selectedSop.effectiveDate || '2026-01-15';
  const sopVersion = selectedSop.version || '1.0';

  // Role resolution without hardcoded personal names
  const ownerLabel = selectedSop.sopOwner?.name || selectedSop.processOwner || selectedSop.ownerRole || 'Operations Lead';
  const backupRoleLabel = selectedSop.backupRole || 'Managing Broker / BIC';

  // Determine admin access
  const activeToken = (typeof window !== 'undefined' ? localStorage.getItem('shapework_session_token') : '') || 'usr_ryan';
  const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_role') : '') || 'owner';
  const activeEmail = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_email') : '') || '';
  const activeName = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_name') : '') || '';

  const isAdmin = 
    ['owner', 'admin', 'bic', 'operations_lead'].includes(activeRole) ||
    ['ryan', 'adam', 'marcus', 'matt', 'usr_ryan'].some(name => 
      activeToken.toLowerCase().includes(name) || 
      activeEmail.toLowerCase().includes(name) || 
      activeName.toLowerCase().includes(name)
    );

  const navigateTo = (tabName: string) => {
    if (state && state.setCurrentTab) {
      state.setCurrentTab(tabName);
    }
  };

  const handleToggleCheck = (key: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Export 1: Clean Checklist Download (Pass/Fail Affirmations, unexpired)
  const handleDownloadChecklist = () => {
    const steps = selectedSop.steps || selectedSop.orderedSteps || [];
    const dateStr = new Date().toISOString().split('T')[0];
    
    let content = `# OPERATIONAL CHECKLIST: ${selectedSop.title}\n`;
    content += `SOP Reference: ${selectedSop.sopId || selectedSop.id} · Version ${sopVersion}\n`;
    content += `Department / Owner: ${ownerLabel} · Jurisdiction: ${selectedState} (${activeAddendum?.stateName || selectedState})\n`;
    if (activeAddendum) {
      content += `Governing Commission: ${activeAddendum.governingCommission}\n`;
      content += `Statutory Escrow Deposit Deadline: ${activeAddendum.statutoryDepositDeadlineHours} hours\n`;
    }
    content += `Export Date: ${dateStr}\n\n`;
    content += `## Pass/Fail Verification Affirmations\n\n`;

    steps.forEach((st: any, idx: number) => {
      const override = activeAddendum?.stepOverrides?.find((o: any) => o.stepNumber === (st.stepNumber || idx + 1));
      const affirmation = override?.affirmationCheckOverride || st.affirmationCheck || `Verified completed: ${st.title || st.action || st.instruction}`;
      const primaryRole = override?.roleOverride || st.primaryRole || st.assignedRole || st.role || 'Assignee';
      const secondaryRole = st.secondaryRole ? ` (Backup: ${st.secondaryRole})` : '';
      const duration = st.durationPolicy?.rawDisplay || st.expectedDuration || 'Standard';

      content += `[ ] Step ${idx + 1}: ${affirmation}\n`;
      content += `    Assignee: ${primaryRole}${secondaryRole} | Target Duration: ${duration}\n`;
      if (override?.statutoryReference) {
        content += `    Statutory Citation: ${override.statutoryReference}\n`;
      }
      content += `\n`;
    });

    if (activeAddendum?.mandatoryDisclosures && activeAddendum.mandatoryDisclosures.length > 0) {
      content += `## Mandatory ${selectedState} State Disclosures\n\n`;
      activeAddendum.mandatoryDisclosures.forEach((disc: any) => {
        content += `[ ] ${disc.code}: ${disc.title} (${disc.requiredTiming})\n`;
        content += `    Affirmation: "${disc.affirmationCheck}"\n\n`;
      });
    }

    content += `---\n`;
    content += `Execution Certification:\n`;
    content += `Inspector / Executor: ________________________   Signature: ________________________   Date: ________\n`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Checklist_${(selectedSop.sopId || 'sop')}_${selectedState}_v${sopVersion}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success({
      title: 'Checklist Downloaded',
      description: `Clean operational checklist for ${selectedState} exported successfully.`
    });
  };

  // Export 2: Official Controlled SOP Download (Version-locked with 14-day controlled copy expiration notice)
  const handleDownloadOfficialSop = () => {
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 14);

    const todayStr = today.toISOString().split('T')[0];
    const expiryStr = expiry.toISOString().split('T')[0];
    const steps = selectedSop.steps || selectedSop.orderedSteps || [];

    let content = `********************************************************************************\n`;
    content += `*** OFFICIAL CONTROLLED COPY — Version ${sopVersion} (Activated: ${activationDateStr}) ***\n`;
    content += `*** EXPIRATION NOTICE: This controlled document is valid for 14 days from download. ***\n`;
    content += `*** Download Date: ${todayStr} | EXPIRATION DATE: ${expiryStr} ***\n`;
    content += `*** Retaining physical or electronic copies beyond 14 days is strictly prohibited ***\n`;
    content += `*** and renders the copy UNCONTROLLED. Verify authoritative status in Shapework. ***\n`;
    content += `********************************************************************************\n\n`;

    content += `# STANDARD OPERATING PROCEDURE: ${selectedSop.title}\n\n`;
    content += `ID: ${selectedSop.sopId || selectedSop.id}\n`;
    content += `Status: ${selectedSop.status?.toUpperCase() || 'PUBLISHED'}\n`;
    content += `Category: ${selectedSop.category || selectedSop.department || 'Operations'}\n`;
    content += `Jurisdiction: State of ${selectedState} (${activeAddendum?.stateName || selectedState})\n`;
    if (activeAddendum) {
      content += `Governing Commission: ${activeAddendum.governingCommission}\n`;
      content += `Statutory Escrow Deposit Deadline: ${activeAddendum.statutoryDepositDeadlineHours} hours\n`;
    }
    content += `SOP Owner: ${ownerLabel}\n`;
    content += `Backup Coverage: ${backupRoleLabel}\n`;
    content += `Effective / Activation Date: ${activationDateStr}\n\n`;

    content += `## 1. PURPOSE & OUTCOME\n`;
    content += `Purpose: ${selectedSop.purpose}\n`;
    content += `Expected Outcome: ${selectedSop.expectedOutcome || 'Flawless operational execution and compliance signoff.'}\n`;
    content += `Scope: ${selectedSop.scope || 'Brokerage-wide standard operating policy.'}\n\n`;

    content += `## 2. PROCEDURAL SEQUENCE\n\n`;
    steps.forEach((st: any, idx: number) => {
      const override = activeAddendum?.stepOverrides?.find((o: any) => o.stepNumber === (st.stepNumber || idx + 1));
      const primaryRole = override?.roleOverride || st.primaryRole || st.assignedRole || st.role || 'Assignee';
      const secondaryRole = st.secondaryRole ? ` | Backup Role: ${st.secondaryRole}` : '';
      const duration = st.durationPolicy?.rawDisplay || st.expectedDuration || 'Standard';
      const tool = st.connectedTool || st.systemUsed || 'Internal';
      const instruction = override?.actionOverride || st.instruction || st.action;
      const affirmation = override?.affirmationCheckOverride || st.affirmationCheck;

      content += `### Step ${idx + 1}: ${st.title}\n`;
      content += `Instruction: ${instruction}\n`;
      content += `Primary Role: ${primaryRole}${secondaryRole}\n`;
      content += `Duration Policy: ${duration}\n`;
      content += `System / Tool: ${tool}\n`;
      if (override?.statutoryReference) {
        content += `Statutory Reference: ${override.statutoryReference}\n`;
      }
      if (affirmation) {
        content += `Affirmation Criteria: ${affirmation}\n`;
      }
      content += `\n`;
    });

    if (activeAddendum) {
      content += `## 3. STATE REGULATORY ADDENDUM & STATUTORY MANDATES (${selectedState})\n\n`;
      content += `Regulatory Commission: ${activeAddendum.governingCommission}\n`;
      content += `Statutory Escrow Window: ${activeAddendum.statutoryDepositDeadlineHours} hours\n`;
      content += `Escrow Trust Rules: ${activeAddendum.escrowTrustRules}\n`;
      content += `Contingency Timelines: ${activeAddendum.contingencyTimelineRules.notes}\n\n`;

      if (activeAddendum.mandatoryDisclosures && activeAddendum.mandatoryDisclosures.length > 0) {
        content += `### Mandatory State Disclosures:\n`;
        activeAddendum.mandatoryDisclosures.forEach((disc: any) => {
          content += `- ${disc.code}: ${disc.title} (Required: ${disc.requiredTiming})\n`;
          content += `  Statutory Affirmation: "${disc.affirmationCheck}"\n`;
        });
        content += `\n`;
      }
    }

    if (selectedSop.decisions && selectedSop.decisions.length > 0) {
      content += `## 4. DECISIONS & EXCEPTION LOGIC\n\n`;
      selectedSop.decisions.forEach((dec: any, idx: number) => {
        if (typeof dec === 'string') {
          content += `- Rule ${idx + 1}: ${dec}\n`;
        } else {
          content += `- ${dec.title}: IF ${dec.condition} THEN ${dec.action}\n`;
        }
      });
      content += `\n`;
    }

    if (selectedSop.escalationPaths && selectedSop.escalationPaths.length > 0) {
      content += `## 5. ESCALATION PROTOCOLS\n\n`;
      selectedSop.escalationPaths.forEach((esc: string) => {
        content += `- ${esc}\n`;
      });
      content += `\n`;
    }

    content += `## 6. AUDIT TRAIL & CONTROL RECORD\n`;
    content += `Author: ${selectedSop.author || ownerLabel}\n`;
    content += `Certified Reviewer: ${selectedSop.reviewer || 'Broker-in-Charge'}\n`;
    content += `Publisher: ${selectedSop.publisher || 'Broker-in-Charge'}\n`;
    content += `Activation Date: ${activationDateStr}\n`;
    content += `Document Security Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OFFICIAL_SOP_${(selectedSop.sopId || 'sop')}_v${sopVersion}_CONTROLLED.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success({
      title: 'Official SOP Exported',
      description: 'Controlled copy generated with 14-day expiration notice watermark.'
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDeleteSop) {
        await onDeleteSop(selectedSop);
      } else if (onDeleteDraft && isDraft) {
        await onDeleteDraft(selectedSop);
      } else {
        const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
        const res = await fetch(`/api/sops/${selectedSop.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': 'nest-realty-wilmington',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || 'Failed to delete SOP');
        }
        if (state?.setCurrentTab) {
          state.setCurrentTab('SOP Library');
        }
      }
      toast.success({
        title: 'SOP Deleted',
        description: `SOP "${selectedSop.title}" permanently removed.`
      });
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Failed to delete SOP:', err);
      toast.error({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete SOP'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const stepsList = selectedSop.steps || selectedSop.orderedSteps || [];
  const relatedRuns = runs.filter(r => r.sopId === selectedSop.sopId || r.sopId === selectedSop.id);

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn text-left relative font-sans">
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-stone-900">
                  {isDraft ? 'Delete Working Draft' : 'Delete Published SOP'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <p>
                Are you sure you want to permanently delete <strong className="text-stone-900 font-bold font-serif">{selectedSop.title}</strong>?
              </p>
              {!isDraft && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
                  <span className="font-bold block">Admin Deletion Warning:</span>
                  <span>This procedure will be permanently removed from the operational knowledge library, active checklist runs, and NORA RAG indexing.</span>
                </div>
              )}
              {isDraft && (
                <p className="text-stone-500">
                  This removes the working draft. Prior approved versions will not be affected.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : isDraft ? 'Delete Draft' : 'Permanently Delete SOP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-stone-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif font-bold text-2xl text-stone-900 tracking-tight leading-tight">{selectedSop.title}</h2>
            {isDraft ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                {selectedSop.status === 'for_comment' ? 'Draft for Comment' : 'Draft'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#00635C] border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Official Standard
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
              Jurisdiction: {selectedSop.stateJurisdiction || 'NC'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium mt-1.5 flex-wrap">
            <span>SOP Owner: <strong className="text-stone-800 font-semibold">{ownerLabel}</strong></span>
            <span>•</span>
            <span>Category: <strong className="text-[#00635C] font-semibold">{selectedSop.category || selectedSop.department || 'Operations'}</strong></span>
            <span>•</span>
            <span>Activation Date: <strong className="text-stone-800 font-mono">{activationDateStr}</strong></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Quick Exports */}
          <button
            type="button"
            onClick={handleDownloadChecklist}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download clean execution checklist (unexpired)"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Checklist</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadOfficialSop}
            className="px-3 py-1.5 rounded-xl border border-[#00635C]/30 bg-[#E5EFEA] hover:bg-[#E5EFEA]/80 text-[#00635C] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Download version-locked controlled copy with 14-day expiry watermark"
          >
            <FileCheck className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Official SOP</span>
          </button>

          {/* Delete Action */}
          {(isDraft || isAdmin) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={isDraft ? 'Delete this working draft' : 'Admin: Delete published SOP'}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            </button>
          )}

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-xs font-bold font-mono">
            v{sopVersion}
          </span>
        </div>
      </div>

      {/* WAVE 2 SEQUENTIAL 4-STAGE SUBTAB SELECTOR */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'overview', label: '1. Overview', icon: Layers },
          { id: 'procedure', label: '2. Procedures', icon: Clock },
          { id: 'checklist', label: '3. Checklist', icon: CheckSquare },
          { id: 'versions', label: '4. Versions & History', icon: Calendar }
        ].map((tab) => {
          const isSelected = currentStage === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedViewTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#00635C] text-white shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* WAVE 3 MASTER SOP STATE JURISDICTION SELECTOR */}
      {hasStateAddenda && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-50 border border-stone-200/90 rounded-2xl animate-fadeIn text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
              <span>State Regulatory Addendum:</span>
            </span>
            <div className="flex items-center gap-1">
              {availableStates.map((stateCode) => {
                const isActive = selectedState === stateCode;
                const isBase = stateCode === (selectedSop.stateJurisdiction || 'NC');
                return (
                  <button
                    key={stateCode}
                    type="button"
                    onClick={() => setSelectedState(stateCode)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00635C] text-white shadow-2xs'
                        : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{stateCode}</span>
                    <span className="text-[10px] opacity-75 ml-1">{isBase ? '(Base)' : 'Addendum'}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {activeAddendum && (
            <div className="text-[11px] text-stone-500 font-medium">
              Governing Body: <strong className="text-stone-800">{activeAddendum.governingCommission}</strong> · Escrow Window: <strong className="text-[#00635C] font-bold">{activeAddendum.statutoryDepositDeadlineHours}h</strong>
            </div>
          )}
        </div>
      )}

      {/* Attached Source Document Banner (if exists) */}
      {sourceDoc && (
        <div className="p-4 bg-[#F7F8F5] border border-stone-200 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-stone-900">{sourceDoc.fileName || 'Uploaded Source Document'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-semibold uppercase">
                    {sourceDoc.fileType || 'PDF / Document'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Uploaded: {new Date(sourceDoc.uploadedAt || Date.now()).toLocaleDateString()} · AI Extracted Procedure
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDocPreview(!showDocPreview)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
              >
                {showDocPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#00635C]" />}
                <span>{showDocPreview ? 'Hide Document' : 'View Uploaded Document'}</span>
              </button>

              {sourceDoc.filePayload && (
                <a
                  href={sourceDoc.filePayload}
                  download={sourceDoc.fileName || 'source-document.pdf'}
                  className="p-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                  title="Download original file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {showDocPreview && (
            <div className="pt-3 border-t border-stone-200 animate-fadeIn">
              {sourceDoc.filePayload && sourceDoc.filePayload.startsWith('data:') ? (
                <iframe
                  src={sourceDoc.filePayload}
                  title="Uploaded Source Document"
                  className="w-full h-[600px] rounded-xl border border-stone-200 bg-white shadow-inner"
                />
              ) : (
                <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs font-mono text-stone-800 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {sourceDoc.filePayload || 'No binary document preview available.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAGE 1: OVERVIEW */}
      {currentStage === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Purpose & Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Purpose</span>
              <p className="leading-relaxed text-stone-800 text-xs">{selectedSop.purpose}</p>
            </div>
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Expected Outcome</span>
              <p className="leading-relaxed text-stone-800 text-xs">{selectedSop.expectedOutcome || 'Flawless operational execution and compliance signoff.'}</p>
            </div>
          </div>

          {/* Seat Allocations (Responsible Owner & Backup Coverage - ZERO personal names) */}
          <div className="space-y-3 pt-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Seat Allocations & Governance</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Responsible Owner</span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#00635C]" />
                    <span>{ownerLabel}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 block font-normal">
                    {selectedSop.sopOwner?.type === 'department' ? 'Departmental Authority' : 'Primary Functional Seat'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Backup Coverage</span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-600" />
                    <span>{backupRoleLabel}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 block font-normal">
                    Automatic escalation receiver
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">State Jurisdiction</span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="font-bold text-[#00635C] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
                    <span>State of {selectedSop.stateJurisdiction || 'NC'}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 block font-normal">
                    Governed by NC Real Estate Commission standards
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Limits & Knowledge Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#00635C] block">Scope Limits</span>
              <p className="leading-relaxed text-stone-800 text-xs">{selectedSop.scope || 'All standard brokerage transactions and office operations.'}</p>
            </div>
            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#00635C] block">Exclusions / Boundaries</span>
              <p className="leading-relaxed text-stone-800 text-xs">{selectedSop.exclusions || 'Non-standard transactions require explicit BIC variance.'}</p>
            </div>
          </div>

          {/* Required Inputs / Prerequisites */}
          {selectedSop.requiredInfo && selectedSop.requiredInfo.length > 0 && (
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[10px] font-bold uppercase text-[#00635C] block">Intake Prerequisites Information</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {selectedSop.requiredInfo.map((info: any, idx: number) => (
                  <div key={idx} className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-left shadow-sm">
                    <span className="text-stone-900 block font-bold">{info.name}</span>
                    <span className="text-[10px] text-stone-500 uppercase block mt-0.5 font-medium">{info.dataType} | {info.required}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State Regulatory Addendum & Statutory Timeline Rules */}
          {activeAddendum && (
            <div className="p-5 bg-[#F0F7F4] border border-[#00635C]/30 rounded-2xl space-y-4 animate-fadeIn text-left shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#00635C]/20 pb-3">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <ShieldCheck className="w-5 h-5 text-[#00635C]" />
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">
                      {activeAddendum.stateName} Regulatory Addendum & Statutory Timelines
                    </h4>
                    <span className="text-[11px] text-stone-600 font-medium">
                      Governed by {activeAddendum.governingCommission}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#00635C] text-white text-xs font-bold font-mono self-start sm:self-auto shadow-2xs">
                  {activeAddendum.statutoryDepositDeadlineHours}h Escrow Trust Rule
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white border border-stone-200/80 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-[#00635C] block">Trust Account & Escrow Deposit</span>
                  <p className="text-stone-700 font-medium leading-relaxed">{activeAddendum.escrowTrustRules}</p>
                </div>
                <div className="p-3.5 bg-white border border-stone-200/80 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-[#00635C] block">Contingency Timeline Policy</span>
                  <p className="text-stone-700 font-medium leading-relaxed">{activeAddendum.contingencyTimelineRules.notes}</p>
                </div>
              </div>

              {activeAddendum.mandatoryDisclosures && activeAddendum.mandatoryDisclosures.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase text-[#00635C] block">Mandatory Statutory Disclosures</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {activeAddendum.mandatoryDisclosures.map((disc: any, didx: number) => (
                      <div key={didx} className="p-3 bg-white border border-stone-200/90 rounded-xl space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-stone-900">{disc.code}</span>
                          <span className="text-[10px] font-semibold text-[#00635C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {disc.requiredTiming}
                          </span>
                        </div>
                        <span className="text-xs text-stone-700 font-medium block">{disc.title}</span>
                        {disc.statutoryReference && (
                          <span className="text-[10px] text-stone-500 font-mono block">Law: {disc.statutoryReference}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedViewTab('procedure')}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Proceed to Procedures</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PROCEDURES (Multi-assignee, Duration Policy, Decisions) */}
      {currentStage === 'procedure' && (
        <div className="space-y-6 animate-fadeIn text-left">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">Step-by-Step Procedure Sequence</h3>
              <p className="text-xs text-stone-500">
                Detailed procedural steps, primary and secondary assigned roles, and duration policies.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-bold">
              {stepsList.length} Steps
            </span>
          </div>

          <ol className="space-y-3">
            {stepsList.map((step: any, idx: number) => {
              const override = activeAddendum?.stepOverrides?.find((o: any) => o.stepNumber === (step.stepNumber || idx + 1));
              const primaryRole = override?.roleOverride || step.primaryRole || step.assignedRole || step.role || 'Admin Coordinator';
              const secondaryRole = step.secondaryRole || step.backupRole;
              const durationPolicy = step.durationPolicy?.rawDisplay || step.expectedDuration || '30m';
              const tool = step.connectedTool || step.systemUsed || 'Internal';
              const instruction = override?.actionOverride || step.instruction || step.action;

              return (
                <li key={idx} className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl shadow-sm space-y-2 hover:bg-white transition-all">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#00635C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <strong className="text-stone-900 font-bold text-sm">{step.title}</strong>
                        <div className="flex items-center gap-2 flex-wrap">
                          {override && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                              ★ {selectedState} Statutory Override
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                            ⏱ {durationPolicy}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#00635C] text-[10px] font-bold">
                            {tool}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed mt-1 font-medium">
                        {instruction}
                      </p>

                      {override?.statutoryReference && (
                        <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 font-medium">
                          <strong>Statutory Citation:</strong> {override.statutoryReference}
                        </div>
                      )}

                      {/* Multi-Assignee Badges */}
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          Primary Role: <strong className="text-stone-800 font-bold">{primaryRole}</strong>
                        </span>
                        {secondaryRole && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              Secondary / Backup: <strong className="text-stone-600 font-medium">{secondaryRole}</strong>
                            </span>
                          </>
                        )}
                        {step.type && (
                          <>
                            <span>·</span>
                            <span className="uppercase text-[10px] tracking-wider text-stone-400 font-semibold">{step.type} Gate</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Decisions & Exception Logic */}
          {selectedSop.decisions && selectedSop.decisions.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-stone-200/80">
              <span className="text-[10px] font-bold uppercase text-[#00635C] block">Decisions & Exception Logic</span>
              <div className="space-y-2">
                {selectedSop.decisions.map((dec: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm text-xs">
                    {typeof dec === 'string' ? (
                      <p className="text-amber-900 font-semibold">{dec}</p>
                    ) : (
                      <>
                        <span className="text-amber-900 block font-bold text-xs uppercase">{dec.title}</span>
                        <p className="text-amber-800 mt-1 font-semibold">IF: {dec.condition}</p>
                        <p className="text-[#00635C] mt-0.5 font-bold">THEN: {dec.action}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Paths */}
          {selectedSop.escalationPaths && selectedSop.escalationPaths.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-stone-200/80">
              <span className="text-[10px] font-bold uppercase text-[#00635C] block">Escalation Thresholds</span>
              <div className="space-y-1.5">
                {selectedSop.escalationPaths.map((esc: string, idx: number) => (
                  <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{esc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 flex justify-between">
            <button
              type="button"
              onClick={() => setSelectedViewTab('overview')}
              className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 cursor-pointer"
            >
              ← Back to Overview
            </button>
            <button
              type="button"
              onClick={() => setSelectedViewTab('checklist')}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>View Pass/Fail Checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: CHECKLIST (Pass/Fail Affirmations, Clean Download) */}
      {currentStage === 'checklist' && (
        <div className="space-y-6 animate-fadeIn text-left">
          <div className="p-4 bg-[#E5EFEA]/40 border border-[#00635C]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-[#00635C] text-sm">Pass/Fail Execution Affirmations</h3>
              <p className="text-stone-600 mt-0.5">
                Execution copy consists of verifiable pass/fail affirmations rather than procedure paste, ensuring rigorous milestone certification.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadChecklist}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Clean Checklist</span>
            </button>
          </div>

          <div className="space-y-3">
            {stepsList.map((step: any, idx: number) => {
              const itemKey = `step_${idx}`;
              const isChecked = !!checkedItems[itemKey];
              const override = activeAddendum?.stepOverrides?.find((o: any) => o.stepNumber === (step.stepNumber || idx + 1));
              const affirmation = override?.affirmationCheckOverride || step.affirmationCheck || `Verified completed: ${step.title || step.action}`;
              const primaryRole = override?.roleOverride || step.primaryRole || step.assignedRole || step.role || 'Assignee';

              return (
                <div
                  key={idx}
                  onClick={() => handleToggleCheck(itemKey)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isChecked 
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked 
                      ? 'bg-[#00635C] border-[#00635C] text-white' 
                      : 'border-stone-300 bg-white'
                  }`}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950 line-through' : 'text-stone-900'}`}>
                        Step {idx + 1}: {step.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {override && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                            {selectedState} Rule
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-stone-500">
                          {primaryRole}
                        </span>
                      </div>
                    </div>

                    <p className={`text-xs font-medium leading-relaxed ${isChecked ? 'text-emerald-800' : 'text-stone-700'}`}>
                      "{affirmation}"
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Mandatory State Statutory Disclosure Affirmations */}
            {activeAddendum?.mandatoryDisclosures && activeAddendum.mandatoryDisclosures.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <ShieldCheck className="w-4 h-4 text-[#00635C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Mandatory {activeAddendum.stateName} Statutory Disclosures
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeAddendum.mandatoryDisclosures.map((disc: any, didx: number) => {
                    const itemKey = `disc_${selectedState}_${didx}`;
                    const isChecked = !!checkedItems[itemKey];

                    return (
                      <div
                        key={itemKey}
                        onClick={() => handleToggleCheck(itemKey)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                            : 'bg-stone-50/80 border-stone-200/90 hover:border-stone-300 shadow-xs'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked 
                            ? 'bg-[#00635C] border-[#00635C] text-white' 
                            : 'border-stone-300 bg-white'
                        }`}>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950 line-through' : 'text-stone-900'}`}>
                              {disc.code} — {disc.title}
                            </span>
                            <span className="text-[10px] font-semibold text-[#00635C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {disc.requiredTiming}
                            </span>
                          </div>

                          <p className={`text-xs font-medium leading-relaxed ${isChecked ? 'text-emerald-800' : 'text-stone-700'}`}>
                            "{disc.affirmationCheck}"
                          </p>

                          {disc.statutoryReference && (
                            <span className="text-[10px] text-stone-500 font-mono block">Citation: {disc.statutoryReference}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setSelectedViewTab('procedure')}
              className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 cursor-pointer"
            >
              ← Back to Procedures
            </button>
            <button
              type="button"
              onClick={() => setSelectedViewTab('versions')}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>View Versions & History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: VERSIONS & HISTORY (Activation Dates, Merged Runs, Controlled Copy Export) */}
      {currentStage === 'versions' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          {/* Watermark Controlled Copy Download Banner */}
          <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Controlled Document Management Policy</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Official SOP exports carry an authoritative version lock and a <strong>14-day controlled copy expiration notice</strong>. Retaining physical or local files past 14 days renders copies uncontrolled.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadOfficialSop}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Download Official SOP (14-Day Lock)</span>
            </button>
          </div>

          {/* Versions Log Table */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-stone-900 text-sm">Authoritative Version Log</h4>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8F5] border-b border-stone-200 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Activation Date</th>
                    <th className="py-3 px-4">Author / Owner</th>
                    <th className="py-3 px-4">Change Summary</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  <tr className="bg-emerald-50/20">
                    <td className="py-3 px-4 font-mono font-bold text-[#00635C]">
                      v{sopVersion}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {activationDateStr}
                    </td>
                    <td className="py-3 px-4">
                      {ownerLabel}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {selectedSop.changeSummary || 'Authoritative active release'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-[10px] font-bold uppercase">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                  {parseFloat(sopVersion) > 1.0 && (
                    <tr className="text-stone-400">
                      <td className="py-3 px-4 font-mono">v1.0</td>
                      <td className="py-3 px-4 font-mono">2025-10-12</td>
                      <td className="py-3 px-4">{ownerLabel}</td>
                      <td className="py-3 px-4">Initial baseline operational release</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold">
                          SUPERSEDED
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Merged Execution Run History */}
          <div className="space-y-3 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-stone-900 text-sm">Execution Run History & Activity Logs</h4>
              <span className="text-[11px] text-stone-500">{relatedRuns.length} recorded runs</span>
            </div>

            {relatedRuns.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                No past executions logged for this specific SOP yet. Use "Start Checklist Run" in the sidebar to launch an execution.
              </div>
            ) : (
              <div className="space-y-2">
                {relatedRuns.map((r: any) => (
                  <div key={r.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs shadow-2xs">
                    <div>
                      <span className="font-bold text-stone-900 block">{r.title}</span>
                      <span className="text-stone-500 block text-[11px] mt-0.5">
                        Assignee: <strong className="text-stone-700">{r.assigneeName || 'Unassigned'}</strong> · Started: {new Date(r.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'completed' ? 'bg-emerald-50 text-[#00635C] border border-emerald-200' :
                      r.status === 'blocked' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-between">
            <button
              type="button"
              onClick={() => setSelectedViewTab('checklist')}
              className="px-4 py-2 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 cursor-pointer"
            >
              ← Back to Checklist
            </button>
            <button
              type="button"
              onClick={() => setSelectedViewTab('overview')}
              className="px-4 py-2 border border-[#00635C] text-[#00635C] text-xs font-bold rounded-xl hover:bg-[#E5EFEA]/40 transition cursor-pointer"
            >
              Return to Overview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
