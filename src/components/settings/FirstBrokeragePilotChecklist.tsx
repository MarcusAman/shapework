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
    <div className="bg-surface border border-border-soft rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto text-left text-xs text-text-secondary leading-normal font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-brand-primary" />
            <span>First Brokerage Pilot Checklist</span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Required checklist for shapework admins before starting live operations.
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-sm font-bold text-brand-primary block">{progressPercent}% Passed</span>
          <span className="text-[10px] text-text-tertiary block font-mono">{completedCount} of {checklist.length} checked</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden select-none">
        <div className="bg-brand-primary h-2 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Checklist items */}
      <div className="divide-y divide-border-subtle/40 border border-border-soft rounded-2xl overflow-hidden bg-white">
        {checklist.map((item) => {
          const isChecked = !!checkedItems[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => handleToggle(item.id)}
              className={`p-3.5 hover:bg-stone-50/50 flex justify-between items-center gap-4 transition-colors cursor-pointer ${
                isChecked ? 'bg-stone-50/10' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="font-bold text-text-primary block">{item.id}. {item.label}</span>
                <p className="text-[11px] text-text-tertiary">{item.desc}</p>
              </div>
              <div className="shrink-0 select-none">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Circle className="w-5 h-5 text-border-medium" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <div className="bg-status-success-soft/30 border border-status-success/20 p-4 rounded-2xl flex gap-3 items-start select-none animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold text-status-success text-xs block">System Ready for Launch</span>
            <span className="text-[11px] text-text-secondary leading-normal block">
              All acceptance criteria met. Brokerage OS is ready to operate live brokerages with full data integrity.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
