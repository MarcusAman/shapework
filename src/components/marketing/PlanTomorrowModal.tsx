import React, { useState } from 'react';
import { MarketingWorkItem, MarketingPriority, MarketingExecutionMode } from '../../shared/marketingStateModel';

interface PlanTomorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: MarketingWorkItem[];
  onSavePlanningSnapshot: (snapshot: {
    notes: string;
    plannedWorkItemIds: string[];
  }) => void;
  onUpdateWorkItem: (item: MarketingWorkItem) => void;
}

export const PlanTomorrowModal: React.FC<PlanTomorrowModalProps> = ({
  isOpen,
  onClose,
  workItems,
  onSavePlanningSnapshot,
  onUpdateWorkItem
}) => {
  const [planningNotes, setPlanningNotes] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    workItems.map(i => i.id)
  );

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    onSavePlanningSnapshot({
      notes: planningNotes,
      plannedWorkItemIds: selectedIds
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#062f28] border border-[#176457] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#176457]/60 flex items-center justify-between bg-[#01251f]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Afternoon Planning Ritual
              </span>
              <span className="text-xs text-slate-400">Targeting Monday, August 3, 2026</span>
            </div>
            <h2 className="text-xl font-bold text-[#fffdf8] mt-1">Plan Tomorrow's Operating Queue</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Review incomplete work, assign executors, update deadlines, and set clear next actions for tomorrow morning.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/40 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Daily Ritual Notes Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-emerald-300">
              📝 Daily Planning Notes & Directives for Tomorrow:
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Eduardo (VA) needs to focus on 304 Ocean carousel proof first. Eric Anderson sign quote needs client SMS confirmation by 11am..."
              value={planningNotes}
              onChange={(e) => setPlanningNotes(e.target.value)}
              className="w-full bg-[#01251f] text-slate-200 border border-[#176457]/70 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>

          {/* Work Item Review Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#fffdf8] flex items-center justify-between">
              <span>Active Work Items to Schedule for Tomorrow ({workItems.length})</span>
              <span className="text-xs font-normal text-slate-400">{selectedIds.length} selected</span>
            </h3>

            <div className="space-y-2">
              {workItems.map((item) => (
                <div 
                  key={item.id}
                  className={`border rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    selectedIds.includes(item.id)
                      ? 'bg-[#01251f] border-[#176457]'
                      : 'bg-[#062f28]/50 border-[#176457]/30 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                      className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#fffdf8]">{item.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {item.executorType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-slate-300 flex items-center gap-2">
                        <span>Status: <strong className="text-emerald-400">{item.status}</strong></span>
                        <span>| Next Action: <strong className="text-white">{item.nextAction}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.priority}
                      onChange={(e) => onUpdateWorkItem({ ...item, priority: e.target.value as MarketingPriority })}
                      className="bg-[#062f28] text-slate-200 text-xs border border-[#176457]/60 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="standard">Standard</option>
                      <option value="low">Low</option>
                    </select>

                    <select
                      value={item.executionMode}
                      onChange={(e) => onUpdateWorkItem({ ...item, executionMode: e.target.value as MarketingExecutionMode })}
                      className="bg-[#062f28] text-slate-200 text-xs border border-[#176457]/60 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="automate">Automate</option>
                      <option value="automate_with_review">Automate + Review</option>
                      <option value="assign_to_va">Assign to VA</option>
                      <option value="assign_to_melissa">Assign to Melissa</option>
                      <option value="external_vendor">Print Vendor</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#176457]/60 bg-[#01251f] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-slate-800/60"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <span>✓ Commit Tomorrow's Work Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
