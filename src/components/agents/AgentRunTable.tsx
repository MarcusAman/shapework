/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface AgentRun {
  runId: string;
  agentName: string;
  agentId: string;
  trigger: string;
  recordsScanned: number;
  actionsPrepared: number;
  status: 'completed' | 'failed' | 'running';
  duration: string;
  confidence: string;
}

export const mockAgentRuns: AgentRun[] = [
  {
    runId: 'run_101',
    agentName: "Email Triage Agent",
    agentId: "agent_triage",
    trigger: "Inbound Apex Mortgage mail sync",
    recordsScanned: 1,
    actionsPrepared: 1,
    status: 'completed',
    duration: '0.8s',
    confidence: '94%'
  },
  {
    runId: 'run_102',
    agentName: "Transaction Stage Agent",
    agentId: "agent_stage",
    trigger: "Underwriting milestone calibration scan",
    recordsScanned: 3,
    actionsPrepared: 1,
    status: 'completed',
    duration: '1.4s',
    confidence: '96%'
  },
  {
    runId: 'run_103',
    agentName: "Compliance Agent",
    agentId: "agent_compliance",
    trigger: "DocuSign folder webhook audit",
    recordsScanned: 8,
    actionsPrepared: 2,
    status: 'completed',
    duration: '2.1s',
    confidence: '100%'
  },
  {
    runId: 'run_104',
    agentName: "Listing Launch Agent",
    agentId: "agent_launch",
    trigger: "Daily pre-MLS checklist scan",
    recordsScanned: 4,
    actionsPrepared: 1,
    status: 'completed',
    duration: '1.2s',
    confidence: '78%'
  },
  {
    runId: 'run_105',
    agentName: "Closing Risk Agent",
    agentId: "agent_risk",
    trigger: "Revenue risk index refresh",
    recordsScanned: 9,
    actionsPrepared: 1,
    status: 'completed',
    duration: '1.9s',
    confidence: '96%'
  }
];

interface AgentRunTableProps {
  onInspectRun: (run: AgentRun) => void;
}

export default function AgentRunTable({ onInspectRun }: AgentRunTableProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden font-sans text-left shadow-sm">
      <div className="p-4 border-b border-border-subtle/60 flex justify-between items-center bg-secondary-surface/40">
        <h4 className="font-serif font-bold text-sm text-text-primary">Recent Agent Execution Logs</h4>
        <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider font-semibold">Specialist History</span>
      </div>

      <div className="overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-surface/20 text-[9px] text-text-tertiary uppercase font-mono border-b border-border-subtle font-bold">
              <th className="p-3">Run ID</th>
              <th className="p-3">Specialist Agent</th>
              <th className="p-3">Trigger Event</th>
              <th className="p-3 text-center">Files Scanned</th>
              <th className="p-3 text-center">Actions Prepared</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {mockAgentRuns.map((run) => (
              <tr key={run.runId} className="hover:bg-secondary-surface/20 transition-colors">
                <td className="p-3 font-mono font-semibold text-text-secondary">{run.runId}</td>
                <td className="p-3 font-bold text-text-primary">{run.agentName}</td>
                <td className="p-3 text-text-secondary">{run.trigger}</td>
                <td className="p-3 text-center font-mono text-text-secondary">{run.recordsScanned}</td>
                <td className="p-3 text-center font-mono text-text-secondary">{run.actionsPrepared}</td>
                <td className="p-3 font-mono text-text-tertiary">{run.duration}</td>
                <td className="p-3 font-mono font-semibold text-brand-green">{run.confidence}</td>
                <td className="p-3">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                    run.status === 'completed' ? 'bg-brand-green-soft text-brand-green' : 'bg-status-attention-soft text-status-attention'
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onInspectRun(run)}
                    className="p-1 border border-border-subtle rounded bg-surface hover:bg-secondary-surface text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
