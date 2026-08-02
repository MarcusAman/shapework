/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, 
  DollarSign, Clock, Users, ShieldAlert, Zap, 
  FileText, Activity, ArrowRight, Brain, Shield, UserCheck
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function BrokerageHealth() {
  const [activeModule, setActiveModule] = useState<'profitability' | 'agentSupport' | 'compliance' | 'closing' | 'launch' | 'communication' | 'integration' | 'capacity'>('profitability');

  const healthSignals = [
    { name: 'Closing Risk', score: 92, status: 'good', desc: '1 closing at risk (appraisal delayed)' },
    { name: 'Listing Launch Readiness', score: 78, status: 'watch', desc: '2 delayed listings (photos missing)' },
    { name: 'Compliance Completeness', score: 88, status: 'good', desc: '3 missing client agreements' },
    { name: 'Agent Support Load', score: 95, status: 'good', desc: 'All high-producers supported' },
    { name: 'Communication Delays', score: 72, status: 'watch', desc: 'Lender unresponsive on Colonial Ave' },
    { name: 'Staff Capacity', score: 85, status: 'good', desc: 'Diane Ross at 92% capacity load' },
    { name: 'Integration Reliability', score: 90, status: 'good', desc: 'Dotloop sync delay (18 hours)' },
    { name: 'AI Work Awaiting Approval', score: 74, status: 'watch', desc: '4 drafts pending coordinator check' }
  ];

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* View Header */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-base font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-green animate-pulse" />
          <span>Brokerage Health Command</span>
        </h1>
        <p className="text-xs text-text-secondary font-medium">
          See where revenue, compliance, people, and workflows need attention. Grounded in critical operational bottlenecks.
        </p>
      </div>

      {/* 1. Health Score Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Score */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Brokerage Health Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-black text-brand-green">84</span>
              <span className="text-xs text-text-tertiary">/100</span>
              <span className="flex items-center gap-0.5 text-xs text-status-healthy font-bold ml-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+2%</span>
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
              Calculated based on real-time transaction delays, missing listing agreements, and coordinator workloads.
            </p>
          </div>

          <div className="pt-3.5 border-t border-border-subtle/50 space-y-2">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Immediate Recommendation</span>
            <div className="p-3 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-text-primary">Resolve Colonial Ave Close Slip</span>
                <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                  Reassign backup support to TC Emma Watson to handle the title wiring verification bottleneck.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weighted Input Signals */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Health Model Inputs</span>
            <span className="text-[10px] font-bold text-brand-green font-mono">Real-time Signals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {healthSignals.map((sig, idx) => (
              <div key={idx} className="p-3 bg-secondary-surface border border-border-subtle rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-secondary truncate pr-1">{sig.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    sig.status === 'good' ? 'bg-status-healthy' : 'bg-status-attention'
                  }`} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-text-primary font-mono">{sig.score}</span>
                  <span className="text-[9px] text-text-tertiary">/100</span>
                </div>
                <p className="text-[8px] text-text-tertiary leading-tight truncate">{sig.desc}</p>
              </div>
            ))}
          </div>

          {/* Trend breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border-subtle/50 text-[11px] font-medium leading-relaxed">
            <div className="flex items-start gap-2 text-text-secondary">
              <CheckCircle className="w-4 h-4 text-status-healthy shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary">What Improved:</span>
                <p className="text-[10px] text-text-tertiary">Seller disclosures on 742 Evergreen were automatically processed & matched.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-text-secondary">
              <AlertTriangle className="w-4 h-4 text-status-attention shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary">What Worsened:</span>
                <p className="text-[10px] text-text-tertiary">Colonial Ave closing date slipped by 10 days due to escrow title delays.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-secondary-surface p-1 rounded-xl border border-border-subtle text-xs font-semibold">
        {(['profitability', 'agentSupport', 'compliance', 'closing', 'launch', 'communication', 'integration', 'capacity'] as const).map((tab) => {
          const tabLabels = {
            profitability: '1. Profitability & Costs',
            agentSupport: '2. Agent Support Radar',
            compliance: '3. Compliance Risk',
            closing: '4. Closing Risk Sweep',
            launch: '5. Listing Launch Readiness',
            communication: '6. Communication Breakdown',
            integration: '7. Integration Reliability',
            capacity: '8. Staff Capacity'
          };
          const isActive = activeModule === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveModule(tab)}
              className={`px-3 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-brand-green shadow-xs border border-border-subtle' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-stone-100'
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Module Panel Content */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm min-h-[380px]">
        
        {/* MODULE 1: Profitability */}
        {activeModule === 'profitability' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Profitability & Operating Costs</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Actionable audit logs tracking duplicate work cycles and pipeline delays.
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-800 leading-normal flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600 shrink-0" />
              <span>{formatCurrency(42800)} in projected revenue is tied to transactions with unresolved operational risk.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border-subtle rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-text-primary">Stale Integrations Waste</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Problem:</strong> Expired Dotloop tokens triggered manual paperwork synchronization cycles.
                  <br /><strong>Impact:</strong> 4.5 hours of manual transcription completed by coordinators.
                  <br /><strong>Trend:</strong> Worsened.
                </p>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-text-tertiary font-mono">Specialist: Integration Agent</span>
                  <button onClick={() => alert("Re-calibrating Dotloop tokens...")} className="px-2.5 py-1 bg-brand-green text-white text-[10px] font-bold rounded-lg hover:bg-brand-green-hover transition-colors">
                    Re-authenticate Dotloop
                  </button>
                </div>
              </div>

              <div className="p-4 border border-border-subtle rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-text-primary">Duplicate Compliance Actions</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong>Problem:</strong> Agent Brooke Agent and TC Diane Ross both uploaded duplicate disclosures.
                  <br /><strong>Impact:</strong> 1.5 hours of duplicative administrative review.
                  <br /><strong>Trend:</strong> Healthy (AI auto-deduplicated).
                </p>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-text-tertiary font-mono">Specialist: Compliance Agent</span>
                  <span className="text-[10px] text-brand-green font-bold">Auto-resolved</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: Agent Support */}
        {activeModule === 'agentSupport' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Agent Support Radar</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Detect which agents are blocked due to outstanding brokerage review cycles.
              </p>
            </div>

            <div className="p-4 border border-border-subtle rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-text-primary">Randy Agent · Westlake Office</h4>
                  <p className="text-text-secondary mt-0.5">Blocked on SkySlope disclosures setup for 908 Colonial Ave.</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold font-mono text-[9px]">Needs Support</span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs">
                <span className="text-[10px] text-text-tertiary font-mono">Specialist: Agent Support Agent</span>
                <button onClick={() => alert("Secure action link dispatched to Randy...")} className="px-3 py-1 bg-brand-green text-white font-bold rounded-lg text-[10px] hover:bg-brand-green-hover transition-colors">
                  Send Secure Checklist Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: Compliance */}
        {activeModule === 'compliance' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Compliance & Post-Settlement Risks</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Prevent post-settlement audits from finding unsigned buyer broker agreements.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>3 Missing Mandated Disclosures Detected</span>
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                102 Pine Street is currently missing the mandatory signed Buyer Agency agreement. Failure to file before settlement blocks commissions distribution.
              </p>
              <div className="pt-2 border-t border-amber-200/50 flex justify-between items-center text-[10px] text-amber-800 font-mono">
                <span>Specialist: Compliance Agent</span>
                <button onClick={() => alert("Outbound document draft request prepared. See Approval Center.")} className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition-colors">
                  Draft Document Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 4: Closing Risk */}
        {activeModule === 'closing' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Closing Risk Sweep</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Analyzes escrows closing in the next 30 days for finance or attorney blockages.
              </p>
            </div>

            <div className="p-4 border border-border-subtle rounded-xl space-y-3">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <h4 className="font-bold text-text-primary">908 Colonial Avenue</h4>
                  <p className="text-text-secondary mt-0.5">Closing attorney flagged 10-day delay due to title document wire clearance holdups.</p>
                </div>
                <span className="px-2 py-0.5 bg-red-50 text-red-800 rounded font-bold font-mono text-[9px]">High Closing Risk</span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs">
                <span className="text-[10px] text-text-tertiary font-mono">Specialist: Closing Risk Agent</span>
                <button onClick={() => alert("Closing Risk Sweep run successfully. State updated to At Risk.")} className="px-3 py-1 bg-brand-green text-white font-bold rounded-lg text-[10px] hover:bg-brand-green-hover transition-colors">
                  Run Closing Risk Sweep
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: Launch Readiness */}
        {activeModule === 'launch' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Listing Launch Readiness</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Check listings scheduled to go active in the MLS this week.
              </p>
            </div>

            <div className="p-4 border border-border-subtle rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-text-primary">742 Evergreen Terrace</h4>
                  <p className="text-text-secondary mt-0.5">Launch date is in 48 hours but photography sync is missing from Google Drive folder.</p>
                </div>
                <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold font-mono rounded text-[9px]">Launch Blocked</span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                <span className="text-[10px] text-text-tertiary font-mono">Specialist: Listing Launch Agent</span>
                <button onClick={() => alert("Photography request dispatched...")} className="px-3 py-1 bg-brand-green text-white font-bold rounded-lg text-[10px] hover:bg-brand-green-hover transition-colors">
                  Send Photographer Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 6: Communication Breakdown */}
        {activeModule === 'communication' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Communication Breakdown</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Identify transaction coordinators waiting over 48 hours for third-party responses.
              </p>
            </div>

            <div className="p-4 border border-border-subtle rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-text-primary">11 Unresolved Operational Open Loops</h4>
                  <p className="text-text-secondary mt-0.5">Lender contact has not responded to closing documents check for Pine Street.</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold font-mono rounded text-[9px]">11 Open Loops</span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                <span className="text-[10px] text-text-tertiary font-mono">Specialist: Follow-Up Drafting Agent</span>
                <button onClick={() => alert("Navigating to Approval Center to review drafts...")} className="px-3 py-1 bg-brand-green text-white font-bold rounded-lg text-[10px] hover:bg-brand-green-hover transition-colors">
                  Review Prepared Follow-Ups
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 7: Integration reliability */}
        {activeModule === 'integration' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Integration Reliability</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Verify webhook health and synchronization heartbeats across Dotloop, SkySlope, and Rechat.
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Dotloop API Credentials Stale</span>
              </div>
              <p className="text-red-800 font-medium">
                SkySlope folders synced successfully. Dotloop returned authentication error 401. Active escrows details are offline.
              </p>
              <div className="pt-2 border-t border-red-200/50 flex justify-between items-center text-[10px] text-red-800 font-mono">
                <span>Specialist: Integration Agent</span>
                <button onClick={() => alert("Syncing integrations handshake...")} className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors">
                  Trigger Credentials Sync
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 8: Staff Capacity */}
        {activeModule === 'capacity' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-text-primary">Staff Capacity Load Optimizer</h3>
              <p className="text-xs text-text-secondary leading-normal">
                Balances transaction and launch coordination assignments based on active volume.
              </p>
            </div>

            <div className="p-4 border border-border-subtle rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-text-primary">Diane Ross · 92% Capacity Limit</h4>
                  <p className="text-text-secondary mt-0.5">Currently managing 9 active escrows with 4 outstanding appraisal tasks.</p>
                </div>
                <span className="px-2 py-0.5 bg-red-50 text-red-800 font-bold font-mono rounded text-[9px]">Overload Danger</span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
                <span className="text-[10px] text-text-tertiary font-mono">Specialist: AI COO Orchestrator</span>
                <button onClick={() => alert("Reassigned Pine Street tasks to Emma Watson...")} className="px-3 py-1 bg-brand-green text-white font-bold rounded-lg text-[10px] hover:bg-brand-green-hover transition-colors">
                  Approve Load Balancing Reassignment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
