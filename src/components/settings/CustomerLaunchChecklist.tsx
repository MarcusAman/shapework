/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface CustomerLaunchChecklistProps {
  onNavigateToTab?: (tabId: string) => void;
}

export default function CustomerLaunchChecklist({ onNavigateToTab }: CustomerLaunchChecklistProps) {
  // Setup checked state for checklist items
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
    1: true, // Workspace created
    2: true, // Staff configured
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
    15: false
  });

  const checklist = [
    { id: 1, label: 'Workspace created', desc: 'Tenant workspace activated in database registry', target: 'data' },
    { id: 2, label: 'Staff roles configured', desc: 'Ownership mappings assigned to transaction desks', target: 'data' },
    { id: 3, label: 'Routing rules configured', desc: 'Assigned request types to roles with Sla metrics', target: 'data' },
    { id: 4, label: 'Compliance checklist configured', desc: 'Uploaded mandatory closing files templates', target: 'data' },
    { id: 5, label: 'Rechat connected', desc: 'Production OAuth credentials authorized and stored', target: 'data' },
    { id: 6, label: 'Rechat baseline sync completed', desc: 'Seeded initial agent records and active transaction files', target: 'data' },
    { id: 7, label: 'Dotloop/API Nation webhook configured', desc: 'Ingestion URL mapped in API Nation settings drawer', target: 'data' },
    { id: 8, label: 'Dotloop test event received', desc: 'Verified normalizations and masked receipt payloads', target: 'qa' },
    { id: 9, label: 'Agent roster imported', desc: 'Roster directory uploaded in CSV format', target: 'data' },
    { id: 10, label: 'Active deals imported/synced', desc: 'Active escrow portfolios compiled in registry', target: 'data' },
    { id: 11, label: 'Work Queue reviewed', desc: 'Verified that triage tasks show real persisted data', target: 'data' },
    { id: 12, label: 'Approval rules configured', desc: 'Enabled approval gates for Twilio/Rechat writebacks', target: 'governance' },
    { id: 13, label: 'Secure links tested', desc: 'Dispatched and submitted a mock clarification dossier', target: 'links' },
    { id: 14, label: 'Audit verified', desc: 'Inspected immutable operations logs ledger', target: 'data' },
    { id: 15, label: 'Customer launch approved', desc: 'Obtained operational sign-off from brokerage primary owner', target: 'data' }
  ];

  const handleToggle = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="bg-surface border border-border-soft rounded-3xl p-6 shadow-card space-y-6 max-w-4xl mx-auto text-left text-xs text-text-secondary leading-normal font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-brand-primary" />
            <span>Customer Onboarding & Launch Checklist</span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Complete the compliance checks below before launching the tenant workspace.
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-sm font-bold text-brand-primary block">{progressPercent}% Done</span>
          <span className="text-[10px] text-text-tertiary block font-mono">{completedCount} of {checklist.length} tasks completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden select-none">
        <div className="bg-brand-primary h-2 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Checklist grid */}
      <div className="divide-y divide-border-subtle/40 border border-border-soft rounded-2xl overflow-hidden bg-white">
        {checklist.map((item) => {
          const isChecked = !!checkedItems[item.id];
          return (
            <div 
              key={item.id} 
              className={`p-3.5 hover:bg-stone-50/50 flex justify-between items-center gap-4 transition-colors ${
                isChecked ? 'bg-stone-50/10' : ''
              }`}
            >
              
              <div 
                onClick={() => handleToggle(item.id)}
                className="flex items-start gap-3 cursor-pointer flex-1"
              >
                <div className="mt-0.5 shrink-0 select-none">
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-tertiary" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className={`font-semibold text-xs block ${isChecked ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                    {item.id}. {item.label}
                  </span>
                  <p className="text-[10px] text-text-tertiary font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Jump to config button */}
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab(item.target)}
                  className="px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-border-soft rounded text-[9px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer select-none"
                >
                  <span>Configure</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
