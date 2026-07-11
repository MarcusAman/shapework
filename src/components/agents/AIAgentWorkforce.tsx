/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, Settings, Sparkles, RefreshCw, Cpu, 
  Check, Lock, Play, Layers, MessageSquare, AlertTriangle, Eye, Shield, Users, Building, Plus
} from 'lucide-react';
import { AgentDefinition, AgentRun, AgentEvent, AgentGovernancePolicy } from '../../types/shapework';
import AgentDetailDrawer from './AgentDetailDrawer';
import AgentEventStream from './AgentEventStream';
import AgentHandoffFlow from './AgentHandoffFlow';
import AgentSimulationPanel from './AgentSimulationPanel';
import AgentRunTable, { AgentRun as RunData } from './AgentRunTable';
import AgentRunInspector from './AgentRunInspector';
import AgentPolicyMatrix from './AgentPolicyMatrix';

interface AIAgentWorkforceProps {
  agents: AgentDefinition[];
  runs: AgentRun[];
  events: AgentEvent[];
  governancePolicy: AgentGovernancePolicy;
  onUpdatePolicy: (policy: Partial<AgentGovernancePolicy>) => void;
  onTriggerSimulation: (scenarioId: string) => void;
  onTriggerRunAgent: (agentId: string) => void;
  activeSection?: 'workforce' | 'runs' | 'governance';
  state?: any;
}

export default function AIAgentWorkforce({
  agents = [],
  runs = [],
  events = [],
  governancePolicy,
  onUpdatePolicy,
  onTriggerSimulation,
  onTriggerRunAgent,
  activeSection = 'workforce',
  state
}: AIAgentWorkforceProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Inspector states
  const [selectedRun, setSelectedRun] = useState<RunData | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const getStatusColor = (status: AgentDefinition['status']) => {
    switch (status) {
      case 'monitoring':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/50';
      case 'running':
        return 'bg-blue-50 text-blue-800 border-blue-200/50';
      case 'needs_approval':
        return 'bg-amber-50 text-amber-800 border-amber-200/50';
      case 'blocked':
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200/50';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200/50';
    }
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
    }, 1000);
  };

  const handleInspectRun = (run: RunData) => {
    setSelectedRun(run);
    setInspectorOpen(true);
  };

  const isProd = true; // Always display the human-focused workforce map

  // Production human-focused view
  if (isProd) {
    const staffList = state?.profiles || [];
    
    // Define standard roles and current owners
    const ownershipMap = [
      { 
        role: "Owner / Broker of Record", 
        description: "Final signatory authority, dispute resolution, financial payouts, and close-of-escrow compliance overrides.", 
        owner: staffList.find((p: any) => p.role === 'owner') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "None (Final Authority)",
        decisionRights: "Veto rights on commission cuts, legal settlements, and compliance exceptions.",
        ownerWorthy: "Legal disputes, commission cuts, large vendor agreements, and compliance waivers.",
        staffOwned: "Routine marketing, scheduling, closing checklists, sign inventory.",
        toolOwnership: "QuickBooks (P&L Overseer)"
      },
      { 
        role: "Operations", 
        description: "Workflow configuration, tool audits, vendor controls, and office facilities maintenance routing.", 
        owner: staffList.find((p: any) => p.role === 'operations_lead') || { name: "Vacant", email: "-" },
        backup: "Owner",
        escalationPath: "Owner",
        decisionRights: "Manage facilities maintenance, configure routing rules, audit transaction files.",
        ownerWorthy: "Unresolved vendor disputes or budget overrides.",
        staffOwned: "Triage, routine maintenance logs, tool status syncs.",
        toolOwnership: "Google Calendar, Google Drive, Basecamp"
      },
      { 
        role: "Marketing", 
        description: "Flyers and brochures design, sign inventory tracking, client review follow-up, and open house asset design.", 
        owner: staffList.find((p: any) => p.role === 'marketing_coordinator') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Operations Lead",
        decisionRights: "Release non-launch marketing graphics, request agent bio verification.",
        ownerWorthy: "Approval of outbound external ad budgets.",
        staffOwned: "Social media drafting, open house flyer prep.",
        toolOwnership: "Rechat Design Center"
      },
      { 
        role: "Transaction Processing / Accounting", 
        description: "Commission/payment preparation, ledger audits, fee calculations, QuickBooks payout entries.", 
        owner: staffList.find((p: any) => p.role === 'transaction_coordinator') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Owner",
        decisionRights: "Commission/payment preparation, ledger audits, fee calculations.",
        ownerWorthy: "Commission rate disputes or discount waivers.",
        staffOwned: "Routine ledger entries, bank reconciliations.",
        toolOwnership: "QuickBooks, QuickBooks Merchant Services"
      },
      { 
        role: "Events", 
        description: "Organizing team events, managing local outreach schedules, client events planning.", 
        owner: staffList.find((p: any) => p.role === 'events') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Operations Lead",
        decisionRights: "Organizing team events, client event schedules.",
        ownerWorthy: "Event venue contracts and vendor payouts > $1,000.",
        staffOwned: "Event invitations, catering scheduling.",
        toolOwnership: "Google Calendar"
      },
      { 
        role: "Maintenance / Supplies", 
        description: "Lockbox deployments, sign installations, supplies purchasing, conference room readiness.", 
        owner: staffList.find((p: any) => p.role === 'maintenance') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Operations Lead",
        decisionRights: "Lockbox deployments, sign installations, supply checks.",
        ownerWorthy: "Major office facility repairs (> $500).",
        staffOwned: "Yard sign installations, printer toner orders.",
        toolOwnership: "Basecamp"
      },
      { 
        role: "Compliance", 
        description: "Audit contract documents, inspect signatures, flag file omissions, request missing paperwork.", 
        owner: staffList.find((p: any) => p.role === 'compliance_partner') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Owner",
        decisionRights: "Audit contract documents, flag omissions, request paperwork.",
        ownerWorthy: "Agent refusal to submit document after multiple chases.",
        staffOwned: "Standard file completeness checklists.",
        toolOwnership: "Dotloop, Rechat"
      },
      { 
        role: "Agent Support", 
        description: "New agent onboarding collections, system provisioning, training coordination, SOP lookups.", 
        owner: staffList.find((p: any) => p.role === 'agent_support') || { name: "Vacant", email: "-" },
        backup: "Operations Lead",
        escalationPath: "Operations Lead",
        decisionRights: "New agent onboarding collections, system provisioning, SOP lookups.",
        ownerWorthy: "Agent onboarding exceptions or contractual negotiations.",
        staffOwned: "SOP lookups, software login setup.",
        toolOwnership: "Google Drive (SOPs)"
      }
    ];

    const vacantRoles = ownershipMap.filter(m => m.owner.name === "Vacant" || m.owner.name === "Vacant / Needs Assignment" || m.owner.name === "-");

    return (
      <div className="space-y-6 text-left font-sans animate-fade-in pb-10 select-text">
        
        {/* Page Header */}
        <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 select-none flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">
              Brokerage Directory & Ownership Map
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Assigned personnel, escalations, and unassigned coverage gaps across active operational roles.
            </p>
          </div>
          <span className="bg-brand-soft/20 text-brand-primary border border-brand-primary/10 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono">
            {staffList.length} Active Staff members
          </span>
        </div>

        {/* Vacant Responsibility Alerts */}
        {vacantRoles.length > 0 && (
          <div className="alert-card warning flex items-center gap-3 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-950 text-xs">Vacant Responsibility Alert</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                The following key operating roles are vacant and require staff assignment: 
                <strong> {vacantRoles.map(r => r.role).join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Staff list & Ownership Map */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Staff directory */}
            <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
              <div className="h-12 border-b border-border-soft px-4 flex items-center justify-between bg-surface-muted select-none">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Active Staff Directory
                </span>
                <button
                  onClick={() => alert("Add new staff member flow opens here")}
                  className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Staff Member
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-text-tertiary border-b border-border-soft/60 font-mono text-[9px] uppercase select-none">
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/60 font-medium">
                    {staffList.map((member: any) => (
                      <tr key={member.id} className="hover:bg-stone-50/40">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-[10px] font-semibold font-mono">
                              {member.name.charAt(0)}
                            </div>
                            <span className="font-bold text-text-primary">{member.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-text-secondary select-all font-mono text-[10px]">{member.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-stone-100 border border-border-soft rounded capitalize text-text-secondary">
                            {member.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold rounded uppercase">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ownership Map list */}
            <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
              <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted select-none">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Role Ownership & Responsibilities Map
                </span>
              </div>
              <div className="divide-y divide-border-soft">
                {ownershipMap.map((map) => (
                  <div key={map.role} className="p-4 flex flex-col hover:bg-stone-50/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-bold text-text-primary block text-xs">{map.role}</span>
                        <p className="text-[11px] text-text-secondary font-medium leading-relaxed max-w-xl">{map.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {map.owner.name === 'Vacant' || map.owner.name === '-' ? (
                          <span className="px-2 py-0.5 bg-risk-red-soft text-risk-red text-[9px] font-bold rounded border border-risk-red/10 uppercase select-none">
                            Vacant / Needs Assignment
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-text-primary block text-xs">{map.owner.name}</span>
                            <span className="text-[10px] text-text-tertiary block font-mono">{map.owner.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-border-soft/50 text-[10px] text-text-secondary font-mono">
                      <div>
                        <span className="text-[8px] uppercase text-text-tertiary font-bold block">Backup Owner</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.backup}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-text-tertiary font-bold block">Escalation Path</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.escalationPath}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-text-tertiary font-bold block">Tool Scope</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.toolOwnership}</span>
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <span className="text-[8px] uppercase text-text-tertiary font-bold block">Decision Rights</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.decisionRights}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-soft/20 text-[10px] text-text-secondary font-mono">
                      <div>
                        <span className="text-[8px] uppercase text-emerald-800 font-bold block">What goes to owner</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.ownerWorthy}</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase text-amber-800 font-bold block">What stays with staff</span>
                        <span className="text-text-primary font-sans mt-0.5 block">{map.staffOwned}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Escalation map & coverage checks */}
          <div className="space-y-6 select-none">
            
            {/* Escalation Path details */}
            <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-4">
              <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block">
                Escalation Hierarchy
              </span>
              <div className="space-y-3.5 text-xs text-text-secondary">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <p className="font-medium">
                    <strong>Transaction Coordinator disputes</strong> escalate immediately to the <strong>Operations Lead</strong> or <strong>Broker of Record</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <p className="font-medium">
                    <strong>Compliance waivers</strong> must be approved explicitly by the <strong>Broker of Record</strong> using single-use secure links.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                  <p className="font-medium">
                    Routine client-deflection alerts are resolved automatically at the staff level without owner intervention.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  }

  // Conditional rendering based on activeSection
  if (activeSection === 'runs') {
    return (
      <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2">
            <AgentRunTable onInspectRun={handleInspectRun} />
          </div>
          <div className="xl:col-span-1">
            <AgentEventStream events={events} />
          </div>
        </div>

        {/* Historical Run Inspector Drawer */}
        <AgentRunInspector 
          run={selectedRun} 
          onClose={() => {
            setInspectorOpen(false);
            setSelectedRun(null);
          }} 
        />
      </div>
    );
  }

  if (activeSection === 'governance') {
    return (
      <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2">
            <AgentPolicyMatrix />
          </div>
          <div className="xl:col-span-1">
            <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Safeguards Center</span>
                </h4>
                <p className="text-[11px] text-text-secondary">Enforce security limits and automated agent boundaries.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Global Automation Pause */}
                <div className="flex items-center justify-between p-3 bg-secondary-surface border border-border-subtle rounded-xl">
                  <div>
                    <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider font-mono">Global Automation Pause</span>
                    <p className="text-[10px] text-text-secondary leading-normal">Place all specialist actions into manual approval queue.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governancePolicy.globalAutomationPause}
                    onChange={(e) => onUpdatePolicy({ globalAutomationPause: e.target.checked })}
                    className="w-4 h-4 accent-brand-green"
                  />
                </div>

                {/* Require External Msg approval */}
                <div className="flex items-center justify-between p-3 bg-secondary-surface border border-border-subtle rounded-xl">
                  <div>
                    <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider font-mono">Block External Messages</span>
                    <p className="text-[10px] text-text-secondary leading-normal">Verify outbound email drafts before dispatch.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governancePolicy.requireApprovalExternalMessages}
                    onChange={(e) => onUpdatePolicy({ requireApprovalExternalMessages: e.target.checked })}
                    className="w-4 h-4 accent-brand-green"
                  />
                </div>

                {/* Require Compliance checks approval */}
                <div className="flex items-center justify-between p-3 bg-secondary-surface border border-border-subtle rounded-xl">
                  <div>
                    <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider font-mono">Gated Compliance Exceptions</span>
                    <p className="text-[10px] text-text-secondary leading-normal">Require broker override signature for waivers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governancePolicy.requireApprovalComplianceSensitive}
                    onChange={(e) => onUpdatePolicy({ requireApprovalComplianceSensitive: e.target.checked })}
                    className="w-4 h-4 accent-brand-green"
                  />
                </div>

                {/* Require Material deal term checks */}
                <div className="flex items-center justify-between p-3 bg-secondary-surface border border-border-subtle rounded-xl">
                  <div>
                    <span className="font-bold text-text-primary block text-[11px] uppercase tracking-wider font-mono">Gated Material Changes</span>
                    <p className="text-[10px] text-text-secondary leading-normal">Approval required for price or escrow deadline moves.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governancePolicy.requireApprovalMaterialChanges}
                    onChange={(e) => onUpdatePolicy({ requireApprovalMaterialChanges: e.target.checked })}
                    className="w-4 h-4 accent-brand-green"
                  />
                </div>

                {/* Confidence Threshold slider */}
                <div className="space-y-1.5 p-3 bg-secondary-surface border border-border-subtle rounded-xl">
                  <div className="flex justify-between font-mono font-bold text-[10px] uppercase text-text-primary">
                    <span>Low-Confidence Threshold</span>
                    <span className="text-brand-green">{governancePolicy.lowConfidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="95"
                    value={governancePolicy.lowConfidenceThreshold}
                    onChange={(e) => onUpdatePolicy({ lowConfidenceThreshold: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-green"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Workforce Directory view
  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* 1. Workforce Overview Dashboard Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">MONITORING</span>
          <strong className="text-sm font-bold text-text-primary mt-1 block">5 Agents</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">RUNS TODAY</span>
          <strong className="text-sm font-bold text-text-primary mt-1 block">24 runs</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">FINDINGS</span>
          <strong className="text-sm font-bold text-text-primary mt-1 block">11 flagged</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">PREPARED</span>
          <strong className="text-sm font-bold text-text-primary mt-1 block">8 actions</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">AUTO-EXEC</span>
          <strong className="text-sm font-bold text-brand-green mt-1 block">4 synced</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">WAITING</span>
          <strong className="text-sm font-bold text-status-attention mt-1 block">4 Gated</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center">
          <span className="text-[9px] text-text-tertiary block font-mono uppercase">AUDIT LOGS</span>
          <strong className="text-sm font-bold text-text-primary mt-1 block">128 logged</strong>
        </div>
        <div className="p-3 bg-surface border border-border-subtle rounded-xl text-center bg-red-50/40 border-red-100">
          <span className="text-[9px] text-red-800 block font-mono uppercase">BLOCKERS</span>
          <strong className="text-sm font-bold text-red-600 mt-1 block">1 Timeout</strong>
        </div>
      </div>

      {/* Grid: 3-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Agent Directory & Cascade logs */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Handoff Flow Diagram */}
          <AgentHandoffFlow />

          {/* Core Specialists Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Specialist Workforce Directory</h3>
                <p className="text-[11px] text-text-secondary mt-0.5">Specialist operational workers operating within strict safety boundaries.</p>
              </div>
              <span className="bg-secondary-surface text-text-secondary px-2.5 py-0.5 rounded text-[10px] font-bold border border-border-subtle font-mono">
                {agents.length} Active Specialists
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 hover:border-strong-border transition-all flex flex-col justify-between shadow-sm"
                >
                  {/* Title & Status */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-wider block">
                          {agent.role}
                        </span>
                        <h4 className="font-serif font-bold text-text-primary text-sm mt-0.5">{agent.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase shrink-0 ${getStatusColor(agent.status)}`}>
                        {agent.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 font-medium">
                      {agent.mission}
                    </p>
                  </div>

                  {/* Operational stats */}
                  <div className="grid grid-cols-3 gap-2 bg-secondary-surface p-3 rounded-xl border border-border-subtle/80 text-[10px] font-mono text-text-secondary">
                    <div className="space-y-0.5">
                      <span className="text-text-tertiary block text-[9px]">Prepared Today</span>
                      <strong className="text-text-primary">{agent.actions_prepared_today}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-text-tertiary block text-[9px]">Completed Today</span>
                      <strong className="text-text-primary">{agent.actions_completed_today}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-text-tertiary block text-[9px]">Awaiting Appr</span>
                      <strong className={agent.items_requiring_approval > 0 ? "text-status-attention font-bold animate-pulse" : "text-text-primary"}>
                        {agent.items_requiring_approval}
                      </strong>
                    </div>
                  </div>

                  {/* Metadata labels */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-text-secondary">
                      <span>Permission Level:</span>
                      <span className="font-mono font-semibold uppercase text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded">
                        {agent.permission_level.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Confidence Range:</span>
                      <span className="font-mono text-text-primary font-medium">{agent.confidence_range}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Last Ingestion Run:</span>
                      <span className="text-text-primary">{agent.last_run}</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle/60 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedAgent(agent);
                        setDetailOpen(true);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 border border-border-subtle rounded-lg hover:bg-secondary-surface text-[10px] font-bold text-text-secondary uppercase tracking-wider transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => onTriggerRunAgent(agent.id)}
                      className="flex items-center justify-center gap-1 py-1.5 bg-brand-green-soft text-brand-green border border-brand-green/10 rounded-lg hover:bg-brand-green hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Run</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAgent(agent);
                        setDetailOpen(true);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 border border-border-subtle rounded-lg hover:bg-secondary-surface text-[10px] font-bold text-text-secondary uppercase tracking-wider transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Config</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Event Timeline, Simulations */}
        <div className="space-y-6">
          {/* Simulation Panel */}
          <AgentSimulationPanel onTriggerSimulation={onTriggerSimulation} />

          {/* Event Stream */}
          <AgentEventStream events={events} />
        </div>
      </div>

      {/* Detail Slide Drawer */}
      <AgentDetailDrawer
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        runs={runs}
        onTriggerRun={(id) => {
          onTriggerRunAgent(id);
          setDetailOpen(false);
          setSelectedAgent(null);
        }}
      />

      {/* Historical Run Inspector Drawer */}
      <AgentRunInspector 
        run={selectedRun} 
        onClose={() => {
          setInspectorOpen(false);
          setSelectedRun(null);
        }} 
      />

    </div>
  );
}
