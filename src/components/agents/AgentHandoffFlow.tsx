/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, ArrowRight, Shield, Mail, Activity, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function AgentHandoffFlow() {
  const steps = [
    {
      agent: 'AI COO Orchestrator',
      action: 'Classify Email Signal',
      desc: 'Lender email arrives regarding finance milestone',
      icon: Shield,
      color: 'border-brand-green bg-brand-green-soft text-brand-green'
    },
    {
      agent: 'Email Triage Agent',
      action: 'Match Property & Ingest',
      desc: 'Resolves 102 Pine St in Operating Memory',
      icon: Mail,
      color: 'border-blue-500 bg-blue-50 text-blue-600'
    },
    {
      agent: 'Transaction Stage Agent',
      action: 'Evaluate Contingency',
      desc: 'Prepares Underwriting stage update proposal',
      icon: Activity,
      color: 'border-purple-500 bg-purple-50 text-purple-600'
    },
    {
      agent: 'Closing Risk Agent',
      action: 'Update Risk Index',
      desc: 'Adjusts deal delay coefficient down to 0%',
      icon: AlertCircle,
      color: 'border-amber-500 bg-amber-50 text-amber-600'
    },
    {
      agent: 'Audit Agent',
      action: 'Commit Immutable Event',
      desc: 'Creates ledger hash verification tx_102',
      icon: FileSpreadsheet,
      color: 'border-slate-500 bg-slate-50 text-slate-600'
    }
  ];

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">How work gets routed</h4>
          <p className="text-[11px] text-text-secondary">Visual routing flow for incoming transaction updates.</p>
        </div>
        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-brand-green-soft text-brand-green border border-brand-green/20">
          Active Pipeline: Stage Audit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative pt-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.agent} className="flex md:flex-col items-center md:items-stretch gap-3 md:gap-2 relative group">
              {/* Card wrapper */}
              <div className={`flex-1 p-4 border rounded-xl space-y-2 text-xs transition-all hover:shadow-md ${s.color}`}>
                <div className="flex items-center gap-1.5 font-bold">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.agent}</span>
                </div>
                <div className="text-[11px] font-semibold text-text-primary">{s.action}</div>
                <p className="text-[10px] text-text-secondary leading-normal">{s.desc}</p>
              </div>

              {/* Connecting arrow (only between items) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center bg-white rounded-full border border-border-subtle shadow-sm text-text-tertiary">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
