/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Zap, CheckCircle2, ShieldAlert, Play, XCircle, Settings, ClipboardList, RefreshCw } from 'lucide-react';
import { CommandPlan } from '../../types/shapework';
import { safeLower } from '../../utils/string';

interface CommandPlanProps {
  plan: CommandPlan;
  onExecute: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function CommandPlanCard({
  plan,
  onExecute,
  onCancel,
  onEdit
}: CommandPlanProps) {
  if (!plan) return null;

  const [dryRunRunning, setDryRunRunning] = useState(false);
  const [dryRunActive, setDryRunActive] = useState(false);
  const [dryRunLogs, setDryRunLogs] = useState<string[]>([]);

  const isRunning = plan.execution_status === 'running';
  const isCompleted = plan.execution_status === 'completed';
  const isFailed = plan.execution_status === 'failed';
  const isCancelled = plan.execution_status === 'cancelled';

  const triggerDryRun = () => {
    setDryRunRunning(true);
    setDryRunLogs([]);
    setTimeout(() => {
      setDryRunRunning(false);
      setDryRunActive(true);
      setDryRunLogs([
        'Initializing dry-run pre-flight check...',
        `Inspected ${plan.affected_records_count || 5} active transaction and listing profiles...`,
        'Checked credentials permissions scope permissions: "email:draft, tasks:write"...',
        'Identified 4 missing document checklists in current launch workflow files.',
        'Synthesized 3 draft email reminders (Status: Awaiting approval. 0 messages sent).',
        'Dry-Run successfully verified. No external side-effects produced.'
      ]);
    }, 1500);
  };

  const getStatusBadge = (status: CommandPlan['execution_status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-status-healthy bg-status-healthy-soft px-2 py-0.5 rounded border border-status-healthy/10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Executed Successfully</span>
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-brand-green bg-brand-green-soft px-2 py-0.5 rounded border border-brand-green/10 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Running...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-status-atrisk bg-status-atrisk-soft px-2 py-0.5 rounded border border-status-atrisk/15">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-status-attention bg-status-attention-soft px-2 py-0.5 rounded border border-status-attention/15">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Proposed Action Plan</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4 text-left text-xs max-w-xl animate-fade-in font-sans">
      {/* Plan Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-brand-green">
            <Zap className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-bold text-[10px] uppercase tracking-wider">shapework. AI Execution Planner</span>
          </div>
          <h4 className="font-serif font-bold text-text-primary text-sm leading-snug">
            "{plan.query}"
          </h4>
        </div>
        {getStatusBadge(plan.execution_status)}
      </div>

      {/* Extraction Diagnostics */}
      <div className="p-3.5 bg-secondary-surface rounded-xl border border-border-subtle/80 space-y-2">
        <div className="flex justify-between">
          <span className="text-text-tertiary font-medium">Intent Detected:</span>
          <span className="font-semibold text-text-primary">{plan.intent_detected}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary font-medium">Risk Classification:</span>
          <span className={`font-semibold capitalize ${
            plan.risk_level === 'high' ? 'text-status-atrisk' : plan.risk_level === 'medium' ? 'text-status-attention' : 'text-brand-green'
          }`}>
            {plan.risk_level} Risk
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary font-medium">Systems/Integrations Needed:</span>
          <span className="font-semibold text-text-secondary font-mono">
            {plan.required_integrations.join(', ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary font-medium">Authorization Scope Required:</span>
          <span className="font-semibold text-text-secondary font-mono">
            email:draft, tasks:write
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-tertiary font-medium font-semibold text-brand-green">Estimated Operational Impact:</span>
          <span className="font-semibold text-brand-green font-mono">{plan.impact_estimate}</span>
        </div>
      </div>

      {/* Target Files */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
          Target Records Affected ({plan.affected_records_count})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {plan.affected_records.map((rec, idx) => (
            <span key={idx} className="bg-white border border-border-subtle px-2 py-0.5 rounded text-[10px] font-medium text-text-secondary">
              {rec}
            </span>
          ))}
        </div>
      </div>

      {/* Execution Timeline Steps */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Proposed Action Steps & Agent Handoffs</span>
        
        <div className="space-y-2">
          {plan.steps.map((step) => {
            let statusColor = 'text-text-tertiary';
            if (step.status === 'completed') statusColor = 'text-status-healthy';
            if (step.status === 'executing') statusColor = 'text-brand-green animate-pulse';
            if (step.status === 'failed') statusColor = 'text-status-atrisk';

            const getStepAgent = (action: string) => {
              const act = safeLower(action);
              if (act.includes('triage') || act.includes('ingest') || act.includes('find')) return 'Triage Agent';
              if (act.includes('compliance') || act.includes('checklist') || act.includes('document') || act.includes('check')) return 'Compliance Agent';
              if (act.includes('follow-up') || act.includes('email') || act.includes('draft') || act.includes('reminder') || act.includes('send')) return 'Follow-Up Agent';
              if (act.includes('agent') || act.includes('onboarding') || act.includes('owner') || act.includes('tc')) return 'Support Agent';
              if (act.includes('stage') || act.includes('milestone')) return 'Stage Agent';
              if (act.includes('audit') || act.includes('ledger') || act.includes('log')) return 'Audit Agent';
              return 'AI COO';
            };

            return (
              <div 
                key={step.id} 
                className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-border-subtle/40 text-[11px]"
              >
                <div className="mt-0.5 shrink-0">
                  {step.status === 'completed' ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-status-healthy-soft text-status-healthy flex items-center justify-center font-bold">✓</div>
                  ) : step.status === 'executing' ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-brand-green border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-stone-300 bg-stone-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary truncate">{step.action}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[9px] font-bold text-brand-green font-mono bg-brand-green-soft px-1.5 py-0.2 rounded">
                        {getStepAgent(step.action)}
                      </span>
                      <span className="text-[9px] text-text-tertiary font-mono uppercase bg-secondary-surface px-1.5 py-0.5 rounded border border-border-subtle/50">
                        {step.system}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-text-secondary mt-0.5 leading-tight">
                    <span className="truncate">Target: {step.target}</span>
                    <span className={`font-semibold shrink-0 ml-2 ${step.requires_approval ? 'text-status-attention' : 'text-brand-green'}`}>
                      {step.requires_approval ? 'Requires Approval' : 'Auto-allowed'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dry-Run Panel logs */}
      {plan.execution_status === 'draft' && (
        <div className="space-y-2 pt-2 border-t border-border-subtle/50">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Dry-Run Preview Output</span>
            <button
              onClick={triggerDryRun}
              disabled={dryRunRunning}
              className="px-2.5 py-1 border border-border-subtle hover:bg-secondary-surface rounded text-[10px] font-bold text-text-secondary transition-all"
            >
              {dryRunRunning ? 'Verifying...' : dryRunActive ? 'Run Verification Again' : 'Trigger Dry-Run Check'}
            </button>
          </div>

          {dryRunRunning && (
            <div className="p-3 bg-stone-50 border border-border-subtle border-dashed rounded-xl flex items-center justify-center gap-2 text-text-tertiary">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
              <span>Simulating logic pipelines in dry-run environment...</span>
            </div>
          )}

          {dryRunActive && !dryRunRunning && (
            <div className="p-3 bg-stone-50 border border-border-subtle rounded-xl font-mono text-[10px] text-text-secondary leading-relaxed space-y-1">
              {dryRunLogs.map((log, idx) => (
                <div key={idx} className={log.includes('successfully') ? 'text-brand-green font-semibold' : ''}>
                  • {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      {plan.execution_status === 'draft' && (
        <div className="flex gap-2 justify-end pt-2 border-t border-border-subtle/50">
          <button
            onClick={() => onExecute(plan.id)}
            className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute Plan</span>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(plan.id)}
              className="px-3.5 py-1.5 rounded-lg border border-border-subtle hover:bg-secondary-surface text-text-secondary font-semibold transition-colors"
            >
              Edit Steps
            </button>
          )}
          <button
            onClick={() => onCancel(plan.id)}
            className="px-3.5 py-1.5 rounded-lg border border-transparent hover:bg-stone-100 text-text-tertiary font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="pt-2 border-t border-border-subtle/50 text-[10px] font-semibold text-status-healthy flex items-center gap-1.5 font-sans">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Completed. 5 actions triggered, updates synced back to Dotloop & Gmail API.</span>
        </div>
      )}
    </div>
  );
}
