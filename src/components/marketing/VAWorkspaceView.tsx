import React, { useState } from 'react';
import { MarketingWorkItem } from '../../shared/marketingStateModel';

interface VAWorkspaceViewProps {
  workItems: MarketingWorkItem[];
  onOpenItem: (item: MarketingWorkItem) => void;
  onSubmitProof: (workItemId: string, proofUrl: string, notes: string) => void;
}

export const VAWorkspaceView: React.FC<VAWorkspaceViewProps> = ({
  workItems,
  onOpenItem,
  onSubmitProof
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [proofNotes, setProofNotes] = useState<string>('');

  // Filter only items assigned to VA or hybrid QA
  const vaWorkItems = workItems.filter(
    item => item.executorType === 'virtual_assistant' || item.executionMode === 'assign_to_va' || item.executionMode === 'hybrid'
  );

  const activeItem = vaWorkItems.find(i => i.id === selectedItemId) || vaWorkItems[0];

  if (vaWorkItems.length === 0) {
    return (
      <div className="space-y-6 text-left" data-testid="va-empty-state">
        <div className="bg-[#062f28] border border-[#176457]/60 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                VA Workspace
              </span>
              <span className="text-xs text-slate-300">Maria (VA Account)</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#fffdf8] mt-1">VA Workspace</h2>
            <p className="text-xs text-slate-300 mt-0.5">Assigned work and SOP guidance</p>
          </div>
          <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-slate-300">
            <span>📋 Assigned Items: <strong className="text-purple-300 font-bold">0</strong></span>
            <span>| Readiness: <strong className="text-emerald-400 font-bold">100% Certified</strong></span>
          </div>
        </div>

        <div className="bg-[#f6f7f1] text-[#13231e] border border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-md space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center mx-auto text-xl font-bold">
            👤
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-2xl text-[#13231e]">No work assigned to Maria</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Maria is currently certified for:
            </p>
            <div className="inline-block text-left text-xs font-semibold text-slate-700 space-y-1.5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs my-2">
              <div className="flex items-center gap-2 text-emerald-800"><span className="text-emerald-600 font-bold">✓</span> Standard listing flyers</div>
              <div className="flex items-center gap-2 text-emerald-800"><span className="text-emerald-600 font-bold">✓</span> Social graphics</div>
              <div className="flex items-center gap-2 text-emerald-800"><span className="text-emerald-600 font-bold">✓</span> Open-house collateral packages</div>
            </div>
            <p className="text-xs text-slate-500">New assignments will appear here.</p>
          </div>
          <button
            type="button"
            onClick={() => alert('Routing Policies: Automation handles standard drafts. VA (Maria) handles custom requests & QA.')}
            className="px-5 py-2.5 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            View routing policies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* VA Header */}
      <div className="bg-[#062f28] border border-[#176457]/60 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              VA Workspace
            </span>
            <span className="text-xs text-slate-400">Maria (VA Account)</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#fffdf8] mt-1">Assigned Tasks & SOP Guidelines</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Role-restricted view displaying assigned work items, briefs, brand rules, SOP checklists, and proof submission.
          </p>
        </div>

        <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-slate-300">
          <span>📋 Assigned Items: <strong className="text-purple-300 font-bold">{vaWorkItems.length}</strong></span>
          <span>| Readiness: <strong className="text-emerald-400 font-bold">100% Certified</strong></span>
        </div>
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Task List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Work Items</h2>

          {vaWorkItems.map((item) => {
            const isSelected = activeItem && activeItem.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 shadow-sm ${
                  isSelected
                    ? 'bg-[#01251f] border-purple-500/60 ring-1 ring-purple-500/40'
                    : 'bg-[#062f28] border-[#176457]/40 hover:border-[#176457]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                      {item.workType.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-bold text-sm text-[#fffdf8]">{item.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.priority}
                  </span>
                </div>

                <div className="mt-3 bg-[#062f28] border border-[#176457]/40 rounded-lg p-2 text-xs text-slate-300">
                  <span className="text-purple-400 font-semibold">Next Action:</span> {item.nextAction}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Task Detail, SOP & Proof Submission */}
        <div className="lg:col-span-7 space-y-5">
          {activeItem ? (
            <div className="bg-[#062f28] border border-[#176457]/60 rounded-2xl p-6 space-y-5 shadow-lg">
              <div className="border-b border-[#176457]/50 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Active Task Detail</span>
                  <h2 className="text-xl font-bold text-[#fffdf8] mt-1">{activeItem.title}</h2>
                  <p className="text-xs text-slate-300 mt-1">{activeItem.description}</p>
                </div>
                <button
                  onClick={() => onOpenItem(activeItem)}
                  className="px-3 py-1.5 bg-[#176457] hover:bg-[#1a7364] text-[#fffdf8] text-xs font-semibold rounded-lg"
                >
                  Full Brief & Assets →
                </button>
              </div>

              {/* SOP & Brand Guidelines Card */}
              <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl p-4 space-y-3 text-xs">
                <h3 className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
                  <span>📘 Required Standard Operating Procedure (SOP)</span>
                </h3>
                {activeItem.sopTitle ? (
                  <div className="flex items-center justify-between bg-[#062f28] border border-[#176457]/40 rounded-lg p-2.5">
                    <span className="font-semibold text-[#fffdf8]">{activeItem.sopTitle}</span>
                    <a
                      href={activeItem.sopUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      View SOP Document ↗
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No formal SOP attached to this task type.</p>
                )}

                <div className="space-y-1 pt-2">
                  <span className="font-semibold text-slate-300">VA Quality Checklist:</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    <li>Verify brand kit font pairings (Inter Display / Roboto Body)</li>
                    <li>Ensure Nest Realty brokerage disclosure is visible</li>
                    <li>Check image color space matches digital RGB standards</li>
                    <li>Submit proof for HQ Operations review prior to final delivery</li>
                  </ul>
                </div>
              </div>

              {/* Submit Proof Form */}
              <div className="bg-[#01251f] border border-purple-500/40 rounded-xl p-4 space-y-3 text-xs">
                <h3 className="font-bold text-purple-300 text-sm flex items-center gap-2">
                  <span>📤 Submit Work Proof / Draft for Review</span>
                </h3>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Proof Asset URL or Google Drive Link:</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/proof_v2.png"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full bg-[#062f28] text-white border border-[#176457]/60 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-medium">Notes for Reviewer (HQ Operations):</label>
                  <textarea
                    rows={2}
                    placeholder="Updated layout with requested headline adjustment per Sarah's note..."
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    className="w-full bg-[#062f28] text-white border border-[#176457]/60 rounded-lg p-2.5 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  onClick={() => {
                    if (proofUrl.trim()) {
                      onSubmitProof(activeItem.id, proofUrl.trim(), proofNotes.trim());
                      setProofUrl('');
                      setProofNotes('');
                      alert('Proof submitted for review!');
                    }
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl w-full shadow-md transition-all"
                >
                  Submit Proof for Review →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#062f28] border border-[#176457]/40 rounded-2xl p-12 text-center text-slate-400">
              Select a task from the list on the left to view brief and submit proofs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
