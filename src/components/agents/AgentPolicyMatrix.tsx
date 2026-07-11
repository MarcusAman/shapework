/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

interface PolicyRow {
  agentName: string;
  actionClass: string;
  confidenceThreshold: number;
  autoExecute: boolean;
  requiresHuman: boolean;
  status: 'active' | 'evaluating';
}

const mockPolicies: PolicyRow[] = [
  {
    agentName: "Email Triage Agent",
    actionClass: "Record entity matching",
    confidenceThreshold: 90,
    autoExecute: true,
    requiresHuman: false,
    status: 'active'
  },
  {
    agentName: "Transaction Stage Agent",
    actionClass: "Stage transitions updates",
    confidenceThreshold: 90,
    autoExecute: true,
    requiresHuman: true, // Needs check if below 90%
    status: 'active'
  },
  {
    agentName: "Compliance Agent",
    actionClass: "Disclosures signature parsing",
    confidenceThreshold: 95,
    autoExecute: false,
    requiresHuman: true,
    status: 'active'
  },
  {
    agentName: "Follow-Up Drafting Agent",
    actionClass: "External client correspondence drafts",
    confidenceThreshold: 100,
    autoExecute: false,
    requiresHuman: true, // Safeguard policy forces human check for all client-facing messages
    status: 'active'
  },
  {
    agentName: "Closing Risk Agent",
    actionClass: "Revenue risk de-escalations",
    confidenceThreshold: 85,
    autoExecute: true,
    requiresHuman: false,
    status: 'active'
  }
];

export default function AgentPolicyMatrix() {
  return (
    <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden font-sans text-left shadow-sm">
      <div className="p-4 border-b border-border-subtle/60 flex justify-between items-center bg-secondary-surface/40">
        <h4 className="font-serif font-bold text-sm text-text-primary">Grounded Automation Safeguard Matrix</h4>
        <span className="text-[10px] text-brand-green font-mono uppercase tracking-wider font-semibold">Active Rules</span>
      </div>

      <div className="overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-surface/20 text-[9px] text-text-tertiary uppercase font-mono border-b border-border-subtle font-bold">
              <th className="p-3">Specialist Agent</th>
              <th className="p-3">Action Class</th>
              <th className="p-3 text-center">Confidence Gating Threshold</th>
              <th className="p-3 text-center">Auto-Execute allowed</th>
              <th className="p-3 text-center">Human Approval Gate</th>
              <th className="p-3 text-right">Verification Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {mockPolicies.map((pol, idx) => (
              <tr key={idx} className="hover:bg-secondary-surface/20 transition-colors">
                <td className="p-3 font-bold text-text-primary">{pol.agentName}</td>
                <td className="p-3 text-text-secondary">{pol.actionClass}</td>
                <td className="p-3 text-center font-mono font-semibold text-text-secondary">{pol.confidenceThreshold}%</td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-4.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                    pol.autoExecute ? 'text-brand-green bg-brand-green-soft' : 'text-text-tertiary bg-stone-100'
                  }`}>
                    {pol.autoExecute ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-block w-4.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                    pol.requiresHuman ? 'text-status-attention bg-status-attention-soft' : 'text-text-tertiary bg-stone-100'
                  }`}>
                    {pol.requiresHuman ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-3 text-right text-text-tertiary font-mono text-[10px]">
                  {pol.requiresHuman ? 'Human-in-the-Loop check' : 'Auto-Safe Rule'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
