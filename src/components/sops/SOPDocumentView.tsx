import React, { useState } from 'react';
import { ArrowRight, Link2, ExternalLink, FileText, Download, Eye, EyeOff, Sparkles, Trash2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../ui';

interface SOPDocumentViewProps {
  selectedSop: any;
  setSelectedViewTab: (tab: any) => void;
  selectedRun: any;
  state?: any;
  onDeleteDraft?: (sop: any) => void;
  onDeleteSop?: (sop: any) => void;
}

export default function SOPDocumentView({ selectedSop, setSelectedViewTab, selectedRun, state, onDeleteDraft, onDeleteSop }: SOPDocumentViewProps) {
  const { toast } = useToast();
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!selectedSop) return null;

  const isDraft = selectedSop.status === 'draft' || selectedSop.status === 'under_review';
  const sourceDoc = selectedSop.sourceDocument;

  // Determine admin access (Ryan, Adam, Marcus, Matt, or owner/admin/bic role)
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

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn text-left relative">
      
      {/* Admin Delete Confirmation Modal */}
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
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
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
      <div className="border-b border-stone-200/80 pb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-2xl text-stone-900 tracking-tight leading-tight">{selectedSop.title}</h2>
            {isDraft && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 font-medium mt-1">
            <span>Department: <strong className="text-stone-700 font-semibold">{selectedSop.department || 'Operations'}</strong></span>
            <span>•</span>
            <span>Created By: <strong className="text-stone-700 font-semibold">{selectedSop.createdBy || selectedSop.author || selectedSop.processOwner || 'Nest Team'}</strong></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Delete Action (Drafts for contributors/admins, Published SOPs for Admins Ryan/Adam/Marcus/Matt) */}
          {(isDraft || isAdmin) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={isDraft ? 'Delete this working draft' : 'Admin: Delete published SOP'}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isDraft ? 'Delete Draft' : 'Delete SOP'}</span>
            </button>
          )}
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-xs font-bold">
            v{selectedSop.version}
          </span>
        </div>
      </div>

      {/* Attached Source Document Banner */}
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

          {/* Embedded Document Preview */}
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

      <div className="space-y-5 text-xs text-stone-700 font-medium">
        
        {/* Purpose & Outcome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Purpose</span>
            <p className="leading-relaxed text-stone-800">{selectedSop.purpose}</p>
          </div>
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Expected Outcome</span>
            <p className="leading-relaxed text-stone-800">{selectedSop.expectedOutcome || 'Flawless operational execution and compliance signoff.'}</p>
          </div>
        </div>

        {/* Connected Operations Panel */}
        <div className="space-y-3 pt-3 border-t border-stone-200/80 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Connected Operations</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-stone-50 border border-stone-200/80 rounded-2xl shadow-sm">
            
            {/* Ownership & Backup Coverage */}
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">Seat Allocations</span>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <span className="text-stone-500 block font-medium">Responsible Owner:</span>
                  <button
                    onClick={() => navigateTo('Directory')}
                    className="text-[#00635C] font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.ownerRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.ownerRole === 'operations_manager' || selectedSop.ownerRole === 'operations_lead' || selectedSop.ownerRole === 'triage_operator' ? 'Operations Manager (Ann)' :
                     selectedSop.ownerRole === 'accounting_manager' || selectedSop.ownerRole === 'firm_finance' ? 'Accounting Manager (James)' :
                     selectedSop.ownerRole === 'marketing_manager' || selectedSop.ownerRole === 'marketing_lead' ? 'Marketing Manager (Melissa)' :
                     selectedSop.ownerRole === 'bic' ? 'Broker-in-Charge (Jessica)' :
                     selectedSop.processOwner || selectedSop.ownerRole || 'Admin Coordinator'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="border-t border-stone-200/80 pt-2">
                  <span className="text-stone-500 block font-medium">Backup Coverage:</span>
                  <button
                    onClick={() => navigateTo('Directory')}
                    className="text-[#00635C]/80 font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.backupRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.backupRole === 'operations_manager' || selectedSop.backupRole === 'operations_lead' ? 'Operations Manager (Ann)' :
                     selectedSop.backupRole === 'accounting_manager' ? 'Accounting Manager (James)' :
                     selectedSop.backupRole === 'marketing_manager' ? 'Marketing Manager (Melissa)' :
                     selectedSop.backupRole === 'bic' ? 'Broker-in-Charge (Jessica)' :
                     selectedSop.backupRole || 'Operations Manager (Ann)'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Request Routing Category */}
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">Intake Routing</span>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <span className="text-stone-500 block font-medium">Routing Rule Category:</span>
                  <button
                    onClick={() => navigateTo('Role Map')}
                    className="text-[#00635C] font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5 uppercase"
                  >
                    {selectedSop.relatedCategories?.[0] || selectedSop.trigger || 'manual_start'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight font-medium mt-1">
                  Incoming requests matching this category will prefill this SOP.
                </p>
              </div>
            </div>

            {/* Escalation & SLA Policy */}
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">Escalation Policy</span>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <span className="text-stone-500 block font-medium">Expected Response:</span>
                  <span className="text-amber-800 font-bold block mt-0.5">
                    {selectedSop.escalationBehavior?.expectedResponse || 'Expected within 24h'}
                  </span>
                </div>
                <div className="border-t border-stone-200/80 pt-2">
                  <span className="text-stone-500 block font-medium">Escalation SLA:</span>
                  <button
                    onClick={() => navigateTo('Role Map')}
                    className="text-rose-700 font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.escalationBehavior?.recipientRole === 'owner' || selectedSop.escalationBehavior?.recipientRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.escalationBehavior?.recipientRole === 'operations_lead' || selectedSop.escalationBehavior?.recipientRole === 'operations_manager' ? 'Operations Manager (Ann)' :
                     'Broker-in-Charge (Jessica)'}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scope, Exclusions & Knowledge Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-200/80">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#00635C] block">Scope Limits</span>
            <p className="leading-relaxed text-stone-800">{selectedSop.scope || 'All standard brokerage transactions and office operations.'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#00635C] block">Connected Knowledge Base</span>
            <div className="flex flex-col gap-1 items-start mt-1">
              <button
                onClick={() => navigateTo('Knowledge / SOPs')}
                className="text-[#00635C] font-semibold hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <Link2 className="w-3.5 h-3.5 text-stone-400" />
                {selectedSop.exclusions || 'Authoritative Nest Realty Standard Guidelines'}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Required Fields List */}
        {selectedSop.requiredInfo && selectedSop.requiredInfo.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-stone-200/80">
            <span className="text-[10px] font-bold uppercase text-[#00635C] block">Intake Prerequisites Information</span>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {selectedSop.requiredInfo.map((info: any, idx: number) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-left shadow-sm">
                  <span className="text-stone-900 block font-bold">{info.name}</span>
                  <span className="text-[10px] text-stone-500 uppercase block mt-0.5 font-medium">{info.dataType} | {info.required}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Sequences */}
        <div className="space-y-3 pt-3 border-t border-stone-200/80 text-left">
          <span className="text-[10px] font-bold uppercase text-[#00635C] block">Checklist Actions Step Sequence ({selectedSop.steps?.length || 0})</span>
          <ol className="space-y-3">
            {(selectedSop.steps || []).map((step: any, idx: number) => (
              <li key={idx} className="flex gap-3 items-start p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#00635C] text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <div className="text-left flex-1 min-w-0">
                  <strong className="text-stone-900 font-bold block text-sm">{step.title}</strong>
                  <p className="text-xs text-stone-600 leading-relaxed mt-0.5 font-medium">{step.instruction}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-medium">
                    <span>Role: <strong className="text-stone-800 font-semibold">{step.assignedRole || step.role || selectedSop.processOwner || 'Admin Coordinator'}</strong></span>
                    <span>·</span>
                    <span>Tool / System: <strong className="text-[#00635C] font-semibold">{step.connectedTool || step.systemUsed || 'Rechat'}</strong></span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Logic Rules */}
        {selectedSop.decisions && selectedSop.decisions.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-stone-200/80 text-left">
            <span className="text-[10px] font-bold uppercase text-[#00635C] block">Decisions & Exception Logic</span>
            <div className="space-y-2">
              {selectedSop.decisions.map((dec: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm text-xs">
                  <span className="text-amber-900 block font-bold text-xs uppercase">{dec.title}</span>
                  <p className="text-amber-800 mt-1 font-semibold">IF: {dec.condition}</p>
                  <p className="text-[#00635C] mt-0.5 font-bold">THEN: {dec.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

