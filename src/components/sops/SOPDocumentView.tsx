import React from 'react';
import { ArrowRight, Link2, ExternalLink } from 'lucide-react';

interface SOPDocumentViewProps {
  selectedSop: any;
  setSelectedViewTab: (tab: any) => void;
  selectedRun: any;
  state?: any;
}

export default function SOPDocumentView({ selectedSop, setSelectedViewTab, selectedRun, state }: SOPDocumentViewProps) {
  if (!selectedSop) return null;

  const navigateTo = (tabName: string) => {
    if (state && state.setCurrentTab) {
      state.setCurrentTab(tabName);
    }
  };

  return (
    <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex justify-between items-start">
        <div>
          <h2 className="font-serif font-black text-xl text-white uppercase tracking-tight leading-tight">{selectedSop.title}</h2>
          <span className="text-[10px] font-mono text-[#D0D6BB]/50 mt-1 block">Department: {selectedSop.department}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[8px] font-mono uppercase">v{selectedSop.version}</span>
      </div>

      <div className="space-y-4 text-xs text-[#D0D6BB]/80">
        
        {/* Purpose & Outcome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Purpose</span>
            <p className="leading-relaxed font-sans">{selectedSop.purpose}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Expected Outcome</span>
            <p className="leading-relaxed font-sans">{selectedSop.expectedOutcome}</p>
          </div>
        </div>

        {/* Connected Operations panel */}
        <div className="space-y-3 pt-3 border-t border-white/5 text-left">
          <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Connected Operations</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/20 border border-white/10 rounded-2xl">
            
            {/* Ownership & Backup Coverage */}
            <div>
              <span className="text-[9px] font-mono uppercase text-stone-500 block">Seat Allocations</span>
              <div className="mt-2 space-y-2 text-[10px]">
                <div>
                  <span className="text-[#D0D6BB]/40 block font-sans">Responsible Owner:</span>
                  <button
                    onClick={() => navigateTo('Directory')}
                    className="font-mono text-emerald-400 font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.ownerRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.ownerRole === 'operations_manager' || selectedSop.ownerRole === 'operations_lead' || selectedSop.ownerRole === 'triage_operator' ? 'Operations Manager (Ann)' :
                     selectedSop.ownerRole === 'accounting_manager' ? 'Accounting Manager (James)' :
                     selectedSop.ownerRole === 'marketing_manager' ? 'Marketing Manager (Melissa)' :
                     selectedSop.ownerRole === 'bic' ? 'Broker-in-Charge (Jessica)' :
                     selectedSop.ownerRole || 'Unassigned'}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="border-t border-white/5 pt-1.5">
                  <span className="text-[#D0D6BB]/40 block font-sans">Backup Coverage:</span>
                  <button
                    onClick={() => navigateTo('Directory')}
                    className="font-mono text-emerald-400/80 hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.backupRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.backupRole === 'operations_manager' || selectedSop.backupRole === 'operations_lead' ? 'Operations Manager (Ann)' :
                     selectedSop.backupRole === 'accounting_manager' ? 'Accounting Manager (James)' :
                     selectedSop.backupRole === 'marketing_manager' ? 'Marketing Manager (Melissa)' :
                     selectedSop.backupRole === 'bic' ? 'Broker-in-Charge (Jessica)' :
                     selectedSop.backupRole || 'None'}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Request Routing Category */}
            <div>
              <span className="text-[9px] font-mono uppercase text-stone-500 block">Intake Routing</span>
              <div className="mt-2 space-y-2 text-[10px]">
                <div>
                  <span className="text-[#D0D6BB]/40 block font-sans">Routing Rule Category:</span>
                  <button
                    onClick={() => navigateTo('Role Map')}
                    className="font-mono text-emerald-400 font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5 uppercase"
                  >
                    {selectedSop.relatedCategories?.[0] || selectedSop.trigger || 'manual_start'}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p className="text-[8px] text-[#D0D6BB]/50 leading-tight font-sans mt-1">
                  Incoming requests matching this category will prefill this SOP.
                </p>
              </div>
            </div>

            {/* Escalation & SLA Policy */}
            <div>
              <span className="text-[9px] font-mono uppercase text-stone-500 block">Escalation Policy</span>
              <div className="mt-2 space-y-2 text-[10px]">
                <div>
                  <span className="text-[#D0D6BB]/40 block font-sans">Expected Response:</span>
                  <span className="font-mono text-amber-300 font-bold block mt-0.5">
                    {selectedSop.escalationBehavior?.expectedResponse || 'Expected within 24h'}
                  </span>
                </div>
                <div className="border-t border-white/5 pt-1.5">
                  <span className="text-[#D0D6BB]/40 block font-sans">Escalation SLA:</span>
                  <button
                    onClick={() => navigateTo('Role Map')}
                    className="font-mono text-red-400 font-bold hover:underline cursor-pointer text-left flex items-center gap-1 mt-0.5"
                  >
                    {selectedSop.escalationBehavior?.recipientRole === 'owner' || selectedSop.escalationBehavior?.recipientRole === 'regional_leader' ? 'Regional Leader (Ryan)' :
                     selectedSop.escalationBehavior?.recipientRole === 'operations_lead' || selectedSop.escalationBehavior?.recipientRole === 'operations_manager' ? 'Operations Manager (Ann)' :
                     'Regional Leader (Ryan)'}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scope, Exclusions & Knowledge Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Scope Limits</span>
            <p className="leading-relaxed font-sans">{selectedSop.scope || 'All standard transactions'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Connected Knowledge Base</span>
            <div className="flex flex-col gap-1 items-start mt-1">
              <button
                onClick={() => navigateTo('Knowledge / SOPs')}
                className="font-mono text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 text-[10px]"
              >
                <Link2 className="w-3 h-3 text-[#D0D6BB]/60" />
                {selectedSop.exclusions || 'Listing Launch Operational Standard Guidelines'}
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Required Fields list */}
        {selectedSop.requiredInfo && selectedSop.requiredInfo.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/5">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Intake Prerequisites Information</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {selectedSop.requiredInfo.map((info: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-black/20 border border-white/5 rounded-xl text-left">
                  <span className="text-white block font-sans font-semibold">{info.name}</span>
                  <span className="text-[8px] text-[#D0D6BB]/40 uppercase block mt-0.5">{info.dataType} | {info.required}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Sequences */}
        <div className="space-y-3 pt-3 border-t border-white/5 text-left">
          <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">checklist actions step sequence</span>
          <ol className="space-y-3">
            {selectedSop.steps.map((step: any, idx: number) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-black/25 text-white flex items-center justify-center font-mono text-[9px] font-bold shrink-0">{idx + 1}</span>
                <div className="text-left">
                  <strong className="text-white font-semibold block text-xs">{step.title}</strong>
                  <p className="text-[10px] text-[#D0D6BB]/60 leading-normal font-sans mt-0.5">{step.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Logic Rules */}
        {selectedSop.decisions && selectedSop.decisions.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/5 text-left">
            <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block">Decisions & Exception Logic</span>
            <div className="space-y-2">
              {selectedSop.decisions.map((dec: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-[#01241e] border border-white/5 rounded-xl">
                  <span className="text-white block font-bold text-[10px] uppercase font-mono">{dec.title}</span>
                  <p className="text-amber-300 mt-0.5 font-medium">IF: {dec.condition}</p>
                  <p className="text-emerald-300 mt-0.5">THEN: {dec.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
