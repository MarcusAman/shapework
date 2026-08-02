/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, ShieldCheck, AlertCircle } from 'lucide-react';

export default function FirstBrokeragePilotChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    1: true, // Workspace created
    2: true, // Roles assigned
    3: true, // Role ownership map reviewed
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: true, // Rechat integration status reviewed (we saw connected!)
    13: true, // Dotloop status reviewed
    14: true, // External actions approval-gated
    15: false
  });

  const checklist = [
    { id: 1, label: 'Workspace created', desc: 'Active workspace registered manually or via setup wizard.' },
    { id: 2, label: 'Roles assigned', desc: 'Configured profiles for Owner, Operations, TC, and Marketing.' },
    { id: 3, label: 'Role ownership map reviewed', desc: 'Operations Lead reviewed mappings for all core responsibilities.' },
    { id: 4, label: 'Manual import templates tested', desc: 'Validated agent roster and CSV transaction layouts.' },
    { id: 5, label: 'Active transactions imported', desc: 'Imported transactions backlog ledger into workspace data.' },
    { id: 6, label: 'Marketing request form tested', desc: 'Validated missing information triggers on form submission.' },
    { id: 7, label: 'Compliance checklist configured', desc: 'Tied mandatory documents to transaction checklists.' },
    { id: 8, label: 'Work Queue item created', desc: 'Confirmed a compliance gap automatically created a triage task.' },
    { id: 9, label: 'Approval Center tested', desc: 'Verified dispatch reminders require explicit click authorization.' },
    { id: 10, label: 'Weekly Owner Brief generated', desc: 'Confirmed owner Console aggregated stats and saved hours.' },
    { id: 11, label: 'Audit Trail verified', desc: 'Operations logs compiled and stamped to immutable list.' },
    { id: 12, label: 'Rechat integration status reviewed', desc: 'OAuth keys configured and checked connected.' },
    { id: 13, label: 'Dotloop/API Nation status reviewed', desc: 'Webhook endpoints verified.' },
    { id: 14, label: 'External actions approval-gated', desc: 'Outbound signals confirmed as locked under approvals.' },
    { id: 15, label: 'Owner signoff received', desc: 'Completed executive review and signed off workspace live.' }
  ];

  const handleToggle = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto text-left text-xs text-slate-700 leading-normal font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>First Brokerage Pilot Checklist</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Required checklist for shapework admins before starting live operations.
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-sm font-bold text-emerald-700 block">{progressPercent}% Passed</span>
          <span className="text-[10px] text-slate-500 block font-mono">{completedCount} of {checklist.length} checked</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden select-none border border-slate-200">
        <div className="bg-emerald-600 h-2 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Checklist items */}
      <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
        {checklist.map((item) => {
          const isChecked = !!checkedItems[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => handleToggle(item.id)}
              className={`p-3.5 hover:bg-slate-100/80 flex justify-between items-center gap-4 transition-colors cursor-pointer ${
                isChecked ? 'bg-white' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">{item.id}. {item.label}</span>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
              </div>
              <div className="shrink-0 select-none">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex gap-3 items-start select-none animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-900 text-xs block">System Ready for Launch</span>
            <span className="text-[11px] text-emerald-800 leading-normal block">
              All acceptance criteria met. Brokerage OS is ready to operate live brokerages with full data integrity.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
