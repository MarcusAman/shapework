/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Play, FileText, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { AgentEvent } from '../../types/shapework';

interface AgentEventStreamProps {
  events: AgentEvent[];
}

export default function AgentEventStream({ events }: AgentEventStreamProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto-safe':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
      case 'approval required':
      case 'needs human review':
        return 'bg-amber-50 text-amber-800 border-amber-200/50';
      case 'blocked by policy':
        return 'bg-red-50 text-red-800 border-red-200/50';
      case 'compliance-sensitive':
        return 'bg-purple-50 text-purple-800 border-purple-200/50';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200/50';
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4 text-left">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">Agent Operation Event Stream</h4>
        <p className="text-[11px] text-text-secondary">Chronological audit ledger of specialist background agent runs.</p>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {events && events.length > 0 ? (
          [...events]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((e) => (
              <div key={e.id} className="p-4 bg-secondary-surface border border-border-subtle rounded-xl space-y-2.5 text-xs">
                {/* Meta Header */}
                <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-border-subtle/50">
                  <div className="flex items-center gap-1.5 text-text-secondary font-mono font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span>•</span>
                    <span className="font-bold text-text-primary capitalize">{e.trigger}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getStatusBadge(e.approvalStatus)}`}>
                    {e.approvalStatus}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider block">Inspected Records</span>
                    <p className="font-medium text-text-primary text-[11px]">{e.recordsInspected.join(', ')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase text-text-tertiary tracking-wider block">Findings</span>
                    <p className="text-text-secondary text-[11px] leading-relaxed">{e.findings.join(' • ')}</p>
                  </div>
                </div>

                {/* Recommendation & Handoff Action */}
                <div className="pt-2 border-t border-border-subtle/30 flex justify-between items-center flex-wrap gap-2 font-mono text-[10px] text-text-secondary">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-brand-green" />
                    <span>Rec: <strong className="text-text-primary">{e.recommendedAction}</strong></span>
                  </div>
                  {e.auditEventId && (
                    <span className="text-text-tertiary">
                      Audit logged: <span className="font-bold text-brand-green hover:underline cursor-pointer">{e.auditEventId}</span>
                    </span>
                  )}
                </div>
              </div>
            ))
        ) : (
          <p className="text-center text-xs text-text-tertiary italic py-6">No agent events logged in stream.</p>
        )}
      </div>
    </div>
  );
}
