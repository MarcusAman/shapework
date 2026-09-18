/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, 
  DollarSign, Clock, Users, ShieldAlert, Zap, 
  FileText, Activity, ArrowRight, Brain, Shield, UserCheck,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function BrokerageHealth() {
  const [activeModule, setActiveModule] = useState<'profitability' | 'agentSupport' | 'compliance' | 'closing' | 'launch' | 'communication' | 'integration' | 'capacity'>('profitability');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const triggerAction = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

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
    <div className="space-y-6 text-left font-sans animate-fade-in pb-12 max-w-[1400px] mx-auto">
      
      {/* View Header */}
      <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base font-bold text-[var(--sw-text-primary)] uppercase tracking-wider flex items-center gap-2 font-serif">
              <Activity className="w-5 h-5 text-[var(--brand-primary)] animate-pulse" />
              <span>Brokerage Health Command</span>
            </h1>
            <p className="text-xs text-[var(--sw-text-secondary)] font-medium">
              Real-time operational vitals across revenue, compliance, capacity, and workflow bottlenecks.
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ALL SYSTEMS HEALTHY (84/100)</span>
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. Health Score Model */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Score */}
        <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[var(--sw-text-tertiary)] uppercase tracking-wider block font-mono">
              Brokerage Health Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-black text-[var(--brand-primary)]">84</span>
              <span className="text-sm text-[var(--sw-text-tertiary)] font-bold">/100</span>
              <span className="flex items-center gap-0.5 text-xs text-emerald-700 font-bold ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+2% vs last week</span>
              </span>
            </div>
            <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed pt-1">
              Calculated across 8 core signals: transaction closing friction, mandatory disclosures, coordinator capacity, and integrations.
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--sw-border)] space-y-2">
            <span className="text-[9px] font-bold text-[var(--sw-text-tertiary)] uppercase tracking-wider block font-mono">
              Immediate Recommendation
            </span>
            <div className="p-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-xl flex items-start gap-2.5 shadow-2xs">
              <Zap className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[var(--sw-text-primary)]">Resolve Colonial Ave Escrow Slip</span>
                <p className="text-[11px] text-[var(--sw-text-secondary)] leading-relaxed">
                  Reassign backup support to TC Emma Watson to handle the title wiring verification bottleneck.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weighted Input Signals */}
        <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[var(--sw-text-tertiary)] uppercase tracking-wider font-mono">
              Live Health Model Inputs
            </span>
            <span className="text-[10px] font-bold text-[var(--brand-primary)] font-mono">
              8 Real-time Signals
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {healthSignals.map((sig, idx) => (
              <div key={idx} className="p-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[var(--sw-text-secondary)] truncate pr-1">{sig.name}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    sig.status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-[var(--sw-text-primary)] font-mono">{sig.score}</span>
                  <span className="text-[9px] text-[var(--sw-text-tertiary)]">/100</span>
                </div>
                <p className="text-[9px] text-[var(--sw-text-tertiary)] leading-tight truncate">{sig.desc}</p>
              </div>
            ))}
          </div>

          {/* Trend breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--sw-border)] text-xs font-medium leading-relaxed">
            <div className="flex items-start gap-2 text-[var(--sw-text-secondary)]">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--sw-text-primary)]">What Improved:</span>
                <p className="text-[11px] text-[var(--sw-text-secondary)]">Seller disclosures on 742 Evergreen were automatically processed & matched.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[var(--sw-text-secondary)]">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--sw-text-primary)]">What Needs Attention:</span>
                <p className="text-[11px] text-[var(--sw-text-secondary)]">Colonial Ave closing date slipped by 10 days due to escrow title delays.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-[var(--sw-border)] text-xs font-semibold shadow-2xs">
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
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                isActive 
                  ? 'bg-white text-[var(--brand-primary)] shadow-xs border border-[var(--sw-border)]' 
                  : 'text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] hover:bg-stone-200/60'
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Module Panel Content */}
      <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-xs min-h-[360px]">
        
        {/* MODULE 1: Profitability */}
        {activeModule === 'profitability' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Profitability & Operating Costs</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Actionable audit logs tracking duplicate work cycles and pipeline delays.
              </p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-900 leading-normal flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formatCurrency(42800)} in projected commission revenue is tied to transactions with pending operational risk.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-2 bg-[var(--sw-surface)] shadow-2xs">
                <h4 className="font-bold text-xs text-[var(--sw-text-primary)]">Stale Integrations Waste</h4>
                <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed">
                  <strong>Problem:</strong> Expired Dotloop tokens triggered manual paperwork synchronization cycles.
                  <br /><strong>Impact:</strong> 4.5 hours of manual transcription completed by coordinators.
                  <br /><strong>Trend:</strong> Worsened.
                </p>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Integration Agent</span>
                  <button 
                    onClick={() => triggerAction("Dotloop authorization token refreshed & synchronized.")} 
                    className="px-3 py-1.5 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  >
                    Re-authenticate Dotloop
                  </button>
                </div>
              </div>

              <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-2 bg-[var(--sw-surface)] shadow-2xs">
                <h4 className="font-bold text-xs text-[var(--sw-text-primary)]">Duplicate Compliance Actions</h4>
                <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed">
                  <strong>Problem:</strong> Agent Brooke Agent and TC Diane Ross both uploaded duplicate disclosures.
                  <br /><strong>Impact:</strong> 1.5 hours of duplicative administrative review.
                  <br /><strong>Trend:</strong> Healthy (AI auto-deduplicated).
                </p>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Compliance Agent</span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Auto-resolved</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: Agent Support */}
        {activeModule === 'agentSupport' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Agent Support Radar</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Detect which agents are blocked due to outstanding brokerage review cycles.
              </p>
            </div>

            <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-3 bg-[var(--sw-surface)] shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-[var(--sw-text-primary)]">Randy Agent · Westlake Office</h4>
                  <p className="text-[var(--sw-text-secondary)] mt-0.5">Blocked on SkySlope disclosures setup for 908 Colonial Ave.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-bold font-mono text-[9px]">Needs Support</span>
              </div>
              <div className="pt-2 border-t border-[var(--sw-border)] flex justify-between items-center text-xs">
                <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Agent Support Agent</span>
                <button 
                  onClick={() => triggerAction("Secure document checklist link dispatched to Randy via SMS & Email.")} 
                  className="px-3 py-1.5 bg-[var(--brand-primary)] text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Compliance & Post-Settlement Risks</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Prevent post-settlement audits from finding unsigned buyer broker agreements.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>3 Missing Mandated Disclosures Detected</span>
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                102 Pine Street is currently missing the mandatory signed Buyer Agency agreement. Failure to file before settlement blocks commissions distribution.
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-xs">
                <span className="text-[10px] text-amber-900 font-mono">Specialist: Compliance Agent</span>
                <button 
                  onClick={() => triggerAction("Document request drafted and dispatched to buyer agent.")} 
                  className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-bold hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Closing Risk Sweep</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Analyzes escrows closing in the next 30 days for finance or attorney blockages.
              </p>
            </div>

            <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-3 bg-[var(--sw-surface)] shadow-2xs">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <h4 className="font-bold text-[var(--sw-text-primary)]">908 Colonial Avenue</h4>
                  <p className="text-[var(--sw-text-secondary)] mt-0.5">Closing attorney flagged 10-day delay due to title document wire clearance holdups.</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-full font-bold font-mono text-[9px]">High Closing Risk</span>
              </div>
              <div className="pt-2 border-t border-[var(--sw-border)] flex justify-between items-center text-xs">
                <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Closing Risk Agent</span>
                <button 
                  onClick={() => triggerAction("Closing Risk Sweep completed. Attorney follow-up flagged.")} 
                  className="px-3 py-1.5 bg-[var(--brand-primary)] text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Listing Launch Readiness</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Check listings scheduled to go active in the MLS this week.
              </p>
            </div>

            <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-3 text-xs bg-[var(--sw-surface)] shadow-2xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[var(--sw-text-primary)]">742 Evergreen Terrace</h4>
                  <p className="text-[var(--sw-text-secondary)] mt-0.5">Launch date is in 48 hours but photography sync is missing from Google Drive folder.</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-full font-bold font-mono text-[9px]">Launch Blocked</span>
              </div>
              <div className="pt-2 border-t border-[var(--sw-border)] flex justify-between items-center">
                <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Listing Launch Agent</span>
                <button 
                  onClick={() => triggerAction("Photographer reminder dispatched to Coastal Media Co.")} 
                  className="px-3 py-1.5 bg-[var(--brand-primary)] text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Communication Breakdown</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Identify transaction coordinators waiting over 48 hours for third-party responses.
              </p>
            </div>

            <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-3 text-xs bg-[var(--sw-surface)] shadow-2xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[var(--sw-text-primary)]">11 Unresolved Operational Open Loops</h4>
                  <p className="text-[var(--sw-text-secondary)] mt-0.5">Lender contact has not responded to closing documents check for Pine Street.</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-bold font-mono text-[9px]">11 Open Loops</span>
              </div>
              <div className="pt-2 border-t border-[var(--sw-border)] flex justify-between items-center">
                <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: Follow-Up Drafting Agent</span>
                <button 
                  onClick={() => triggerAction("Follow-up draft queued for coordinator review.")} 
                  className="px-3 py-1.5 bg-[var(--brand-primary)] text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Integration Reliability</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Verify webhook health and synchronization heartbeats across Dotloop, SkySlope, and Rechat.
              </p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Dotloop API Credentials Stale</span>
              </div>
              <p className="text-rose-800 font-medium">
                SkySlope folders synced successfully. Dotloop returned authentication error 401. Active escrows details are offline.
              </p>
              <div className="pt-2 border-t border-rose-200/60 flex justify-between items-center text-xs">
                <span className="text-[10px] text-rose-900 font-mono">Specialist: Integration Agent</span>
                <button 
                  onClick={() => triggerAction("Credentials sync triggered. Handshake initiated.")} 
                  className="px-3 py-1.5 bg-rose-700 text-white rounded-lg font-bold hover:bg-rose-800 transition-colors cursor-pointer shadow-2xs"
                >
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
              <h3 className="font-serif font-bold text-base text-[var(--sw-text-primary)]">Staff Capacity Load Optimizer</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] leading-normal">
                Balances transaction and launch coordination assignments based on active volume.
              </p>
            </div>

            <div className="p-4 border border-[var(--sw-border)] rounded-xl space-y-3 text-xs bg-[var(--sw-surface)] shadow-2xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-[var(--sw-text-primary)]">Diane Ross · 92% Capacity Limit</h4>
                  <p className="text-[var(--sw-text-secondary)] mt-0.5">Currently managing 9 active escrows with 4 outstanding appraisal tasks.</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-900 border border-rose-200 rounded-full font-bold font-mono text-[9px]">Overload Danger</span>
              </div>
              <div className="pt-2 border-t border-[var(--sw-border)] flex justify-between items-center">
                <span className="text-[10px] text-[var(--sw-text-tertiary)] font-mono">Specialist: AI COO Orchestrator</span>
                <button 
                  onClick={() => triggerAction("Pine Street escrow tasks reassigned to Emma Watson.")} 
                  className="px-3 py-1.5 bg-[var(--brand-primary)] text-white font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                >
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
