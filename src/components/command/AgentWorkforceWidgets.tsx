/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Layers, Clock, TrendingUp } from 'lucide-react';
import { AgentDefinition } from '../../types/shapework';

interface AgentWorkforceWidgetsProps {
  agents: AgentDefinition[];
}

export default function AgentWorkforceWidgets({ agents = [] }: AgentWorkforceWidgetsProps) {
  const monitoringCount = agents.filter((a) => a.status === 'monitoring').length;
  const needApprovalCount = agents.filter((a) => a.status === 'needs_approval').length;
  const errorCount = agents.filter((a) => a.status === 'error' || a.status === 'blocked').length;

  const totalPrepared = agents.reduce((acc, curr) => acc + curr.actions_prepared_today, 0);
  const totalCompleted = agents.reduce((acc, curr) => acc + curr.actions_completed_today, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left font-sans">
      
      {/* Active Agents Summary */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-brand-green">
          <Cpu className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Active Agents Status</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
            <span className="text-[10px] text-emerald-800 font-bold block">Monitoring</span>
            <span className="text-base font-bold text-emerald-700 font-mono mt-1 block">{monitoringCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50/40 border border-amber-100/50 rounded-xl">
            <span className="text-[10px] text-amber-800 font-bold block">Need Appr</span>
            <span className="text-base font-bold text-amber-700 font-mono mt-1 block">{needApprovalCount}</span>
          </div>
          <div className="p-2.5 bg-red-50/40 border border-red-100/50 rounded-xl">
            <span className="text-[10px] text-red-800 font-bold block">Errors</span>
            <span className="text-base font-bold text-red-700 font-mono mt-1 block">{errorCount}</span>
          </div>
        </div>
        <p className="text-[10px] text-text-tertiary">
          Specialists running in background loops. Global policies active.
        </p>
      </div>

      {/* Agent Work Prepared Summary */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-brand-green">
          <Layers className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Agent Work Prepared</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 bg-secondary-surface border border-border-subtle rounded-lg">
            <span className="text-[9px] text-text-tertiary block">Queued Today</span>
            <span className="text-sm font-bold font-mono text-text-primary mt-0.5 block">{totalPrepared} Actions</span>
          </div>
          <div className="p-2 bg-secondary-surface border border-border-subtle rounded-lg">
            <span className="text-[9px] text-text-tertiary block">Auto-Executed</span>
            <span className="text-sm font-bold font-mono text-brand-green mt-0.5 block">{totalCompleted} Actions</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[9px] text-text-tertiary font-mono pt-1">
          <span>• 1 stage change proposed</span>
          <span>• 1 compliance waiver flagged</span>
        </div>
      </div>

      {/* Agent Impact Summary */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-brand-green">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Workforce ROI Impact</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 bg-secondary-surface border border-border-subtle rounded-lg">
            <span className="text-[9px] text-text-tertiary block">Admin Load Saved</span>
            <span className="text-sm font-bold font-mono text-brand-green mt-0.5 block">28 Hours</span>
          </div>
          <div className="p-2 bg-secondary-surface border border-border-subtle rounded-lg">
            <span className="text-[9px] text-text-tertiary block">Checks Avoided</span>
            <span className="text-sm font-bold font-mono text-text-primary mt-0.5 block">124 Audits</span>
          </div>
        </div>
        <p className="text-[9px] text-text-tertiary leading-normal">
          Calculated load reallocation metrics for Sarah Jenkins (COO).
        </p>
      </div>

    </div>
  );
}
