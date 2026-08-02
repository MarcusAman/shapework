import React, { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle2, UserCheck, FileText, Send, Zap } from 'lucide-react';
import type { NeedsRyanItem } from './adapters';

interface NeedsRyanActionDrawerProps {
  item: NeedsRyanItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (actionType: 'delegate' | 'grant_waiver' | 'request_info' | 'override_resolve', payload: any) => Promise<void>;
  state?: any;
}

export default function NeedsRyanActionDrawer({
  item,
  isOpen,
  onClose,
  onResolve,
  state
}: NeedsRyanActionDrawerProps) {
  const [selectedAction, setSelectedAction] = useState<'delegate' | 'grant_waiver' | 'request_info' | 'override_resolve'>('delegate');
  const [targetPositionId, setTargetPositionId] = useState<string>('operations_manager');
  const [waiverNotes, setWaiverNotes] = useState<string>('Approved operational exception based on current owner review.');
  const [infoNotes, setInfoNotes] = useState<string>('Please provide missing prerequisite documentation before proceeding.');
  const [overrideNotes, setOverrideNotes] = useState<string>('Overriding blocked step and resuming SOP Run.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const positions = state?.model?.positions || [
    { id: 'operations_manager', title: 'Operations Manager', name: 'Ann Gunn' },
    { id: 'marketing_coordinator', title: 'Marketing Coordinator', name: 'Melissa Gagliardi' },
    { id: 'bic', title: 'Broker-in-Charge', name: 'Jessica' },
    { id: 'accounting_manager', title: 'Accounting Manager', name: 'James Fort' }
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let payload: any = { itemId: item.id };
      if (selectedAction === 'delegate') {
        const targetPos = positions.find((p: any) => p.id === targetPositionId);
        payload = { ...payload, targetPositionId, targetOwnerName: targetPos?.name || 'Assigned Owner' };
      } else if (selectedAction === 'grant_waiver') {
        payload = { ...payload, notes: waiverNotes, waiverType: 'policy_override' };
      } else if (selectedAction === 'request_info') {
        payload = { ...payload, notes: infoNotes, status: 'missing_info' };
      } else if (selectedAction === 'override_resolve') {
        payload = { ...payload, notes: overrideNotes, status: 'completed' };
      }

      await onResolve(selectedAction, payload);
      onClose();
    } catch (err) {
      console.error('Failed to submit action:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUrgent = item.urgency === 'urgent';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-hidden flex justify-end backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl bg-[#01241e] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl text-left font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#01362D]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isUrgent ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Ryan Shield Decision Drawer</span>
              <h2 className="text-base font-bold text-white tracking-tight">{item.type}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#D0D6BB]">
          
          {/* Summary Context Box */}
          <div className="p-4 bg-black/30 border border-white/10 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-stone-400 uppercase">Current Handler: <strong className="text-white font-bold">{item.currentHandler}</strong></span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase ${isUrgent ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                SLA: {item.responseWindow}
              </span>
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">{item.reason}</p>
            <div className="p-3 bg-[#01362D]/60 border border-[#00E5C9]/20 rounded-xl space-y-1">
              <span className="text-[9px] font-mono text-[#00E5C9] font-bold uppercase tracking-wider block">Recommended Action</span>
              <p className="text-white/90 text-xs leading-relaxed">{item.recommendedAction}</p>
            </div>
          </div>

          {/* Core Decision Mode Tabs */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold block">Select Decision Action</label>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setSelectedAction('delegate')}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedAction === 'delegate'
                    ? 'bg-[#00E5C9] text-[#01362D] border-[#00E5C9]'
                    : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Reassign & Delegate</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('grant_waiver')}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedAction === 'grant_waiver'
                    ? 'bg-[#00E5C9] text-[#01362D] border-[#00E5C9]'
                    : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Grant Policy Waiver</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('request_info')}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedAction === 'request_info'
                    ? 'bg-[#00E5C9] text-[#01362D] border-[#00E5C9]'
                    : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5'
                }`}
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Request Prerequisite Info</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('override_resolve')}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedAction === 'override_resolve'
                    ? 'bg-[#00E5C9] text-[#01362D] border-[#00E5C9]'
                    : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5'
                }`}
              >
                <Zap className="w-4 h-4 shrink-0" />
                <span>Override & Resolve</span>
              </button>
            </div>
          </div>

          {/* Action-Specific Form Controls */}
          <div className="p-4 bg-black/20 border border-white/10 rounded-2xl space-y-4">
            {selectedAction === 'delegate' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold">Select Position Seat to Reassign</label>
                <select
                  value={targetPositionId}
                  onChange={(e) => setTargetPositionId(e.target.value)}
                  className="w-full p-3 border border-white/15 rounded-xl bg-black/40 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {positions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.name})</option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-400 leading-relaxed font-mono">
                  Reassigns this task to the selected seat and updates the active SOP Run assignee.
                </p>
              </div>
            )}

            {selectedAction === 'grant_waiver' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold">Waiver Justification Notes</label>
                <textarea
                  value={waiverNotes}
                  onChange={(e) => setWaiverNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-white/15 rounded-xl bg-black/40 text-xs text-white focus:outline-none"
                  placeholder="Explain reason for granting exception..."
                />
                <p className="text-[10px] text-amber-300 font-mono">
                  Grants an official owner policy waiver and records an immutable governance exception audit log.
                </p>
              </div>
            )}

            {selectedAction === 'request_info' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold">Prerequisite Information Requested</label>
                <textarea
                  value={infoNotes}
                  onChange={(e) => setInfoNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-white/15 rounded-xl bg-black/40 text-xs text-white focus:outline-none"
                  placeholder="Detail missing information required from requester..."
                />
                <p className="text-[10px] text-stone-400 font-mono">
                  Tags request as missing_info and notifies requester to supply required fields.
                </p>
              </div>
            )}

            {selectedAction === 'override_resolve' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-stone-400 font-bold">Resolution Notes</label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-white/15 rounded-xl bg-black/40 text-xs text-white focus:outline-none"
                  placeholder="Notes explaining step override..."
                />
                <p className="text-[10px] text-emerald-300 font-mono">
                  Unblocks the SOP step, marks the work item resolved, and logs estimated Shield time saved.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#01362D]/50 flex justify-end gap-3 font-mono text-xs font-bold uppercase select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-white/10 hover:bg-white/5 text-white/70 rounded-xl cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#00E5C9] hover:bg-[#00c2ab] text-[#01362D] rounded-xl cursor-pointer transition-all shadow-lg flex items-center gap-1 font-bold"
          >
            {isSubmitting ? 'Executing...' : 'Confirm Decision'}
          </button>
        </div>

      </div>
    </div>
  );
}
