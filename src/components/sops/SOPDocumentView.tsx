import React from 'react';
import { ArrowRight, Link2, ExternalLink } from 'lucide-react';

interface SOPDocumentViewProps {
  selectedSop: any;
  setSelectedViewTab: (tab: any) => void;
  selectedRun: any;
  state?: any;
  onDeleteDraft?: (sop: any) => void;
}

export default function SOPDocumentView({ selectedSop, setSelectedViewTab, selectedRun, state, onDeleteDraft }: SOPDocumentViewProps) {
  if (!selectedSop) return null;

  const isDraft = selectedSop.status === 'draft' || selectedSop.status === 'under_review';

  const navigateTo = (tabName: string) => {
    if (state && state.setCurrentTab) {
      state.setCurrentTab(tabName);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this draft? This removes the working draft. Published SOPs and prior approved versions are not affected.')) {
      return;
    }
    if (onDeleteDraft) {
      onDeleteDraft(selectedSop);
    } else {
      try {
        await fetch(`/api/sops/drafts/${selectedSop.id}`, { method: 'DELETE' });
        if (state?.setCurrentTab) {
          state.setCurrentTab('SOP Library');
        }
      } catch (err) {
        console.error('Failed to delete draft:', err);
      }
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn text-left">
      
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
          <span className="text-xs text-stone-500 font-medium mt-1 block">Department: {selectedSop.department}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isDraft && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Delete this working draft"
            >
              <span>Delete Draft</span>
            </button>
          )}
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-xs font-bold">
            v{selectedSop.version}
          </span>
        </div>
      </div>

      <div className="space-y-5 text-xs text-stone-700 font-medium">
        
        {/* Purpose & Outcome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Purpose</span>
            <p className="leading-relaxed text-stone-800">{selectedSop.purpose}</p>
          </div>
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] block">Expected Outcome</span>
            <p className="leading-relaxed text-stone-800">{selectedSop.expectedOutcome}</p>
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
                     selectedSop.ownerRole === 'accounting_manager' ? 'Accounting Manager (James)' :
                     selectedSop.ownerRole === 'marketing_manager' ? 'Marketing Manager (Melissa)' :
                     selectedSop.ownerRole === 'bic' ? 'Broker-in-Charge (Jessica)' :
                     selectedSop.ownerRole || 'Unassigned'}
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
                     selectedSop.backupRole || 'None'}
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
                     'Regional Leader (Ryan)'}
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
            <p className="leading-relaxed text-stone-800">{selectedSop.scope || 'All standard transactions'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#00635C] block">Connected Knowledge Base</span>
            <div className="flex flex-col gap-1 items-start mt-1">
              <button
                onClick={() => navigateTo('Knowledge / SOPs')}
                className="text-[#00635C] font-semibold hover:underline cursor-pointer flex items-center gap-1 text-xs"
              >
                <Link2 className="w-3.5 h-3.5 text-stone-400" />
                {selectedSop.exclusions || 'Listing Launch Operational Standard Guidelines'}
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
          <span className="text-[10px] font-bold uppercase text-[#00635C] block">Checklist Actions Step Sequence</span>
          <ol className="space-y-3">
            {selectedSop.steps.map((step: any, idx: number) => (
              <li key={idx} className="flex gap-3 items-start p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl shadow-sm">
                <span className="w-6 h-6 rounded-full bg-[#00635C] text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <div className="text-left">
                  <strong className="text-stone-900 font-bold block text-sm">{step.title}</strong>
                  <p className="text-xs text-stone-600 leading-relaxed mt-0.5 font-medium">{step.instruction}</p>
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

