/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, RefreshCw, AlertTriangle, CheckCircle2, History, GitPullRequest, 
  HelpCircle, Network, Users, FileText, Mail, ArrowRight 
} from 'lucide-react';
import { AuditEvent, Transaction, Listing, Communication } from '../../types/shapework';

interface OperatingMemoryDetailProps {
  transactions: Transaction[];
  listings: Listing[];
  communications: Communication[];
  auditLogs: AuditEvent[];
}

export default function OperatingMemoryDetail({
  transactions = [],
  listings = [],
  communications = [],
  auditLogs = []
}: OperatingMemoryDetailProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'learned' | 'uncertain' | 'graph'>('state');

  // Uncertainty items
  const uncertaintyItems = [
    {
      id: 'unc_1',
      title: 'Low-Confidence Address Match',
      description: 'Incoming email thread referencing "Baker Street disclosures" matches multiple potential properties.',
      evidence: 'Sender: agent-demo@nest-demo.local. Attachment: Baker_disclosures_draft.pdf',
      type: 'Address Conflict',
      status: 'Awaiting Coordinator Decision'
    },
    {
      id: 'unc_2',
      title: 'Conflicting Deal Stage Signals',
      description: 'Buyer agent email states "inspection repairs approved", but Dotloop task status lists "contingency outstanding".',
      evidence: 'Signal conflict detected between Gmail API thread and Dotloop task checklists.',
      type: 'Milestone Conflict',
      status: 'Escalated to Managing Broker'
    },
    {
      id: 'unc_3',
      title: 'Unmapped Contact Identifier',
      description: 'Inbound message from escrow-closer@firsttitle.com requesting wire instructions is not associated with any active roster agent.',
      evidence: 'Sender domain matches Title partner list but is missing explicit deal mapping.',
      type: 'Identity Resolution',
      status: 'Pending Contact Mapping'
    }
  ];

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Header Panel */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-green-soft flex items-center justify-center text-brand-green">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">AI Operating Memory Workspace</h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">Verify the knowledge graphs, ingested email events, and evidence files shapework uses to coordinate operations.</p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-t border-border-subtle/50 pt-4 gap-2">
          {[
            { id: 'state', label: 'Current Knowledge Index', icon: Database },
            { id: 'learned', label: 'Recently Ingested Signals', icon: History },
            { id: 'uncertain', label: 'Uncertainty Queue', icon: HelpCircle },
            { id: 'graph', label: 'Evidence Connection Graph', icon: Network },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isSelected 
                    ? 'bg-brand-green text-white border-transparent shadow-sm'
                    : 'bg-secondary-surface border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        
        {/* Tab 1: Current State */}
        {activeTab === 'state' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left summary cards */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-sm text-text-primary">Indexed Brokerage State Summary</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Active Escrows</span>
                    <span className="text-xl font-bold font-mono text-text-primary block mt-1">{(transactions || []).length}</span>
                  </div>
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Active Listings</span>
                    <span className="text-xl font-bold font-mono text-text-primary block mt-1">{(listings || []).length}</span>
                  </div>
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Open Checklist Tasks</span>
                    <span className="text-xl font-bold font-mono text-text-primary block mt-1">6</span>
                  </div>
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">Waiting-On Items</span>
                    <span className="text-xl font-bold font-mono text-status-attention block mt-1">2</span>
                  </div>
                </div>

                <div className="p-4 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-text-primary">Continuous State Verification</span>
                  <p className="text-[11px] text-text-secondary leading-normal">
                    shapework constantly queries connected endpoints (Rechat CRM, Dotloop transactions, Gmail mailboxes) to synchronize statuses and detect risk variances. If any divergence is detected, shapework escalates an exception to the managing coordinator.
                  </p>
                </div>
              </div>

              {/* Roster assignments knowledge */}
              <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="font-serif font-bold text-sm text-text-primary">Escrow Assignment Directory</h3>
                <div className="border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden text-xs">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 flex justify-between items-center gap-4 hover:bg-stone-50 transition-colors">
                      <div>
                        <span className="font-semibold text-text-primary block">{tx.property_address}</span>
                        <span className="text-[10px] text-text-tertiary">Client: {tx.client_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-secondary-surface border border-border-subtle rounded font-semibold text-[10px]">
                          TC: Diane Ross
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right health column */}
            <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-sm text-text-primary">Pipeline Heartbeat</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle/50">
                  <span className="text-text-secondary font-medium">Webhook Ingestion</span>
                  <span className="text-brand-green font-bold flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" /> Live heartbeat
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle/50">
                  <span className="text-text-secondary font-medium">Gmail API Sync</span>
                  <span className="text-brand-green font-bold font-mono">100% connected</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle/50">
                  <span className="text-text-secondary font-medium">Rechat Synced</span>
                  <span className="text-brand-green font-bold font-mono">Active sync</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle/50">
                  <span className="text-text-secondary font-medium">Active Anomalies</span>
                  <span className="text-status-attention font-bold font-mono">2 flagged</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Last State Scan</span>
                  <span className="text-text-tertiary font-semibold font-mono">Just now</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Recently Ingested */}
        {activeTab === 'learned' && (
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-text-primary">Chronological Knowledge Ingestion Log</h3>
            
            <div className="divide-y divide-border-subtle border border-border-subtle rounded-xl overflow-hidden text-xs">
              {[
                { time: '12:45 PM', type: 'Email Matched', detail: 'Ingested message from Capital Title agent confirming earnest wire deposit received.', deal: '102 Pine Street', rule: 'Rule #14: Earnest Money Verification', confidence: '96%' },
                { time: '11:20 AM', type: 'Document Processed', detail: 'Identified and classified "Seller Disclosures" file signed via Dotloop API.', deal: '742 Evergreen Terrace', rule: 'Rule #2: Disclosure Intake', confidence: '99%' },
                { time: '09:05 AM', type: 'Timeline Sync Exception', detail: 'Identified new appraisal appointment delay scheduled in Gmail calendar.', deal: '908 Colonial Ave', rule: 'Rule #8: Appraisal Delay Flag', confidence: '88%' },
                { time: 'Yesterday', type: 'Stage Auto-Update', detail: 'Automatically updated transaction stage to "Inspection and Repair" following seller signature verification.', deal: '102 Pine Street', rule: 'Rule #4: Inspection Milestone Intake', confidence: '94%' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white hover:bg-stone-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary">{item.type}</span>
                      <span className="text-[10px] text-text-tertiary font-mono">{item.time}</span>
                      <span className="px-1.5 py-0.5 bg-secondary-surface border border-border-subtle rounded text-[9px] font-mono text-text-secondary">{item.deal}</span>
                    </div>
                    <p className="text-text-secondary leading-normal font-medium">{item.detail}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] font-bold text-text-tertiary block uppercase font-mono">{item.rule}</span>
                    <span className="text-[10px] text-brand-green font-bold block mt-0.5">Confidence: {item.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Uncertainty Queue */}
        {activeTab === 'uncertain' && (
          <div className="space-y-4">
            <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
              <h3 className="font-serif font-bold text-sm text-text-primary">Unresolved Knowledge Mismatch Queue</h3>
              <p className="text-[11px] text-text-secondary mt-0.5">These records contain conflicting signals or low confidence scores. Human coordinator input is required to merge or map these entities.</p>
            </div>

            <div className="space-y-4">
              {uncertaintyItems.map((item) => (
                <div key={item.id} className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm hover:border-strong-border transition-all flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-status-attention-soft text-status-attention rounded text-[9px] font-bold uppercase tracking-wider">{item.type}</span>
                      <span className="font-semibold text-text-primary">{item.title}</span>
                    </div>
                    <p className="text-text-secondary leading-normal font-medium">{item.description}</p>
                    <div className="p-2.5 bg-secondary-surface rounded-lg border border-border-subtle/50 font-mono text-[10px] text-text-tertiary">
                      <span className="font-bold text-text-secondary">Extracted Evidence:</span> {item.evidence}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-start sm:items-end shrink-0 gap-2">
                    <span className="text-[10px] text-status-attention font-bold font-mono">{item.status}</span>
                    <button className="px-3 py-1 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg font-bold text-[10px] shadow-xs">
                      Resolve Mismatch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Evidence Graph */}
        {activeTab === 'graph' && (
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif font-bold text-sm text-text-primary">AI Operating Evidence Trace Log</h3>
              <p className="text-[11px] text-text-secondary mt-0.5">Trace how shapework builds certainty. Every automatic update is connected back to raw data, mapping the relationship pathway.</p>
            </div>

            {/* Vertical Flow Graph representing relations */}
            <div className="max-w-2xl mx-auto space-y-4 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
              
              {/* Node 1: Person */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-brand-green-soft border-2 border-brand-green flex items-center justify-center z-10">
                  <Users className="w-2.5 h-2.5 text-brand-green" />
                </div>
                <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary block font-mono">Entity Node: Roster Agent</span>
                  <span className="font-bold text-text-primary text-xs">Alex Carter (Listing Agent)</span>
                  <p className="text-[10px] text-text-secondary">Domain identity: alex.c@nest-demo.local</p>
                </div>
              </div>

              {/* Connector line indicator */}
              <div className="flex justify-center text-text-tertiary">
                <ArrowRight className="w-3.5 h-3.5 rotate-90 shrink-0" />
              </div>

              {/* Node 2: Communication */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-brand-green-soft border-2 border-brand-green flex items-center justify-center z-10">
                  <Mail className="w-2.5 h-2.5 text-brand-green" />
                </div>
                <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary block font-mono">Ingested Signal: Gmail Thread</span>
                  <span className="font-bold text-text-primary text-xs">Email: "Disclosures completed for Baker Street"</span>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    "Hey Diane, seller has completed signatures on the disclosures loop. Let me know when compliance checks it off."
                  </p>
                </div>
              </div>

              {/* Connector line */}
              <div className="flex justify-center text-text-tertiary">
                <ArrowRight className="w-3.5 h-3.5 rotate-90 shrink-0" />
              </div>

              {/* Node 3: Document */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-brand-green-soft border-2 border-brand-green flex items-center justify-center z-10">
                  <FileText className="w-2.5 h-2.5 text-brand-green" />
                </div>
                <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary block font-mono">Associated File: Dotloop Blob</span>
                  <span className="font-bold text-text-primary text-xs">Baker_Street_Seller_Disclosures.pdf</span>
                  <div className="flex items-center justify-between text-[10px] text-text-secondary">
                    <span>99% NLP confidence classification</span>
                    <span className="text-brand-green font-bold">Approved in loop</span>
                  </div>
                </div>
              </div>

              {/* Connector line */}
              <div className="flex justify-center text-text-tertiary">
                <ArrowRight className="w-3.5 h-3.5 rotate-90 shrink-0" />
              </div>

              {/* Node 4: Action */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-brand-green-soft border-2 border-brand-green flex items-center justify-center z-10">
                  <CheckCircle2 className="w-2.5 h-2.5 text-brand-green" />
                </div>
                <div className="p-3.5 bg-brand-green-soft/30 border border-brand-green/20 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-brand-green block font-mono">Resulting Action: Compliance Checkoff</span>
                  <span className="font-bold text-text-primary text-xs">Completed Task: "Verify seller disclosure loop signatures"</span>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Completed by AI Operator at 11:21 AM based on matching signature hash logs. Locked in transaction history.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
