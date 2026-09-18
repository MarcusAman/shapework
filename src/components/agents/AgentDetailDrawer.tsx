/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Play, ShieldAlert, CheckCircle2, ClipboardList, Database, Clock, HelpCircle } from 'lucide-react';
import { AgentDefinition, AgentRun } from '../../types/shapework';

interface AgentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentDefinition | null;
  runs: AgentRun[];
  onTriggerRun?: (id: string) => void;
}

export default function AgentDetailDrawer({
  isOpen,
  onClose,
  agent,
  runs,
  onTriggerRun
}: AgentDetailDrawerProps) {
  if (!isOpen || !agent) return null;

  const agentRuns = (runs || []).filter((r) => r.agentId === agent.id);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden text-left" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className="pointer-events-auto w-screen max-w-2xl transform bg-surface border-l border-border-subtle shadow-2xl transition-all duration-300 ease-in-out">
            <div className="flex h-full flex-col overflow-y-scroll bg-surface">
              {/* Header */}
              <div className="bg-secondary-surface p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-green uppercase tracking-wider block">
                    {agent.role} • {agent.permission_level.replace('_', ' ')}
                  </span>
                  <h2 className="text-base font-serif font-bold text-text-primary mt-1">{agent.name}</h2>
                </div>
                <div className="flex items-center gap-3">
                  {onTriggerRun && (
                    <button
                      onClick={() => onTriggerRun(agent.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Specialist</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 border border-border-subtle hover:bg-secondary-surface rounded-lg text-text-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Mission Section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Mission</span>
                  <div className="p-4 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl">
                    <p className="text-xs text-text-primary leading-relaxed font-semibold">{agent.mission}</p>
                  </div>
                </div>

                {/* Sources & Tools */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-secondary-surface border border-border-subtle rounded-xl space-y-2">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Watched Sources</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.watched_sources.map((src) => (
                        <span key={src} className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-[10px] font-medium text-text-primary">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-secondary-surface border border-border-subtle rounded-xl space-y-2">
                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Connected System Tools</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.connected_tools.map((tool) => (
                        <span key={tool} className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-[10px] font-medium text-text-primary">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Automation Rules Grid */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Operating Bounds & Governance</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Auto-safe */}
                    <div className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-xl space-y-2">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Auto-Safe</span>
                      </span>
                      <ul className="space-y-1 list-disc pl-4 text-[11px] text-emerald-900 leading-normal">
                        {agent.can_do_automatically.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Requires Approval */}
                    <div className="p-4 border border-amber-100 bg-amber-50/20 rounded-xl space-y-2">
                      <span className="font-bold text-amber-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Approval Required</span>
                      </span>
                      <ul className="space-y-1 list-disc pl-4 text-[11px] text-amber-900 leading-normal">
                        {agent.requires_approval.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Never Does */}
                    <div className="p-4 border border-red-100 bg-red-50/20 rounded-xl space-y-2">
                      <span className="font-bold text-red-800 flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Policy Blocked</span>
                      </span>
                      <ul className="space-y-1 list-disc pl-4 text-[11px] text-red-900 leading-normal">
                        {agent.never_does.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Playbook Steps */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Operational Playbook Checklist</span>
                  <div className="border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden text-xs">
                    {agent.playbook.steps.map((step, idx) => (
                      <div key={idx} className="p-3.5 bg-secondary-surface flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-surface border border-border-subtle flex items-center justify-center font-mono font-bold text-[10px] text-brand-green shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-text-primary leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Runs History */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Recent Execution Telemetry</span>
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {agentRuns.length > 0 ? (
                      agentRuns.map((run, index) => (
                        <div key={index} className="p-4 bg-secondary-surface border border-border-subtle rounded-xl space-y-2.5 text-xs">
                          <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
                            <span className="font-mono font-bold text-brand-green">{run.runId}</span>
                            <span className="font-mono text-text-tertiary">
                              {new Date(run.startedAt).toLocaleDateString()} {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[10px] text-text-secondary">
                            <div>Scanned: <strong className="text-text-primary">{run.recordsScanned} files</strong></div>
                            <div>Prepared: <strong className="text-text-primary">{run.actionsPrepared}</strong></div>
                            <div>Executed: <strong className="text-text-primary">{run.actionsExecuted}</strong></div>
                            <div>Gated approvals: <strong className="text-text-primary">{run.approvalsRequired}</strong></div>
                          </div>
                          {run.evidence && (
                            <div className="pt-2 border-t border-border-subtle/30 text-[11px] text-text-secondary leading-normal">
                              <strong>Evidentiary Ingest:</strong> <span className="italic">"{run.evidence}"</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-text-tertiary italic">No run history recorded for this specialist agent.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
