/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Check, AlertTriangle, ArrowRight, ShieldCheck, FileText, Activity, Layers, Sparkles } from 'lucide-react';
import { EmailMessage } from '../../types/shapework';
import AutoUpdatePolicyBadge from '../ui/AutoUpdatePolicyBadge';

interface EmailProcessingPipelineProps {
  messages: EmailMessage[];
  onProcessMessage: (id: string, selectProperty?: string) => void;
}

export default function EmailProcessingPipeline({
  messages,
  onProcessMessage
}: EmailProcessingPipelineProps) {
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(messages[0]?.id || null);
  const [selectedPropertyOverride, setSelectedPropertyOverride] = useState<string>('');

  const activeMessage = (messages || []).find((m) => m.id === selectedMsgId);

  // Pipeline steps defined in Phase 4
  const pipelineSteps = [
    { num: 1, label: 'Email Ingestion', desc: 'Sync and poll incoming signals' },
    { num: 2, label: 'Sender Audit', desc: 'Match to coordinator or client' },
    { num: 3, label: 'Property Match', desc: 'Spatial address reference checks' },
    { num: 4, label: 'Intent Classification', desc: 'Categorize operational request' },
    { num: 5, label: 'Stage Inference', desc: 'Map timeline or milestone' },
    { num: 6, label: 'Information Check', desc: 'Check for missing compliance logs' },
    { num: 7, label: 'Risk Evaluation', desc: 'Generate risk alerts if flagged' },
    { num: 8, label: 'Action Proposed', desc: 'Draft response or notification' },
    { num: 9, label: 'Approval Filter', desc: 'Check authorization safeguards' },
    { num: 10, label: 'State Synchronizer', desc: 'Push data to active deals list' },
    { num: 11, label: 'Security Audit', desc: 'Log final action to ledger' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Visual Pipeline Step Graph */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Email to Action Pipeline</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">The structural flow of how shapework parses authorized correspondence into brokerage state adjustments.</p>
        </div>

        {/* Step indicator strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-11 gap-3 pt-2">
          {pipelineSteps.map((step) => {
            const isProcessing = activeMessage && activeMessage.status === 'processing';
            const isCompleted = activeMessage && activeMessage.status === 'auto_updated';
            const needsApproval = activeMessage && activeMessage.status === 'needs_approval';
            
            let colorClass = 'bg-secondary-surface text-text-secondary border-border-subtle';
            if (activeMessage) {
              if (step.num <= 5) {
                colorClass = 'bg-brand-green-soft/80 border-brand-green/30 text-brand-green font-bold';
              } else if (step.num <= 8) {
                colorClass = needsApproval 
                  ? 'bg-status-attention-soft border-status-attention/30 text-status-attention font-bold' 
                  : 'bg-brand-green-soft/80 border-brand-green/30 text-brand-green font-bold';
              } else if (step.num >= 9) {
                if (activeMessage.status === 'low_confidence') {
                  colorClass = step.num === 9 ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-secondary-surface text-text-secondary border-border-subtle';
                } else if (isCompleted) {
                  colorClass = 'bg-status-healthy-soft border-status-healthy/30 text-status-healthy font-bold';
                } else if (needsApproval) {
                  colorClass = step.num === 9 ? 'bg-status-attention-soft border-status-attention/30 text-status-attention font-bold' : 'bg-secondary-surface text-text-secondary border-border-subtle';
                }
              }
            }

            return (
              <div 
                key={step.num}
                className={`border rounded-xl p-2.5 text-left flex flex-col justify-between h-20 transition-all ${colorClass}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] opacity-70">Step {step.num}</span>
                  {isCompleted && step.num === 11 && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold truncate leading-tight">{step.label}</h4>
                  <p className="text-[8px] opacity-75 truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Inbox simulator panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[520px]">
        {/* Left Side: Messages list */}
        <div className="border border-border-subtle bg-surface rounded-2xl flex flex-col overflow-hidden shadow-sm lg:col-span-1">
          <div className="px-4 py-3 bg-secondary-surface border-b border-border-subtle shrink-0">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Incoming Message Logs</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
            {(messages || []).map((msg) => {
              const isSelected = msg.id === selectedMsgId;
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMsgId(msg.id);
                    setSelectedPropertyOverride('');
                  }}
                  className={`p-4 cursor-pointer text-left transition-all ${
                    isSelected ? 'bg-brand-green-soft/30 border-l-4 border-brand-green' : 'hover:bg-secondary-surface/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-xs text-text-primary truncate">{msg.sender}</span>
                    <AutoUpdatePolicyBadge status={msg.status} confidence={msg.confidence} />
                  </div>
                  <h4 className="text-[11px] font-bold text-text-secondary mt-1 truncate">{msg.subject}</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5 truncate leading-tight font-mono">{msg.matched_property || 'Unmatched'}</p>
                  <div className="flex justify-between items-center mt-2.5 text-[9px] text-text-tertiary">
                    <span>{new Date(msg.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>Intent: {msg.intent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: AI Ingestion Details */}
        <div className="border border-border-subtle bg-surface rounded-2xl flex flex-col overflow-hidden shadow-sm lg:col-span-2">
          {activeMessage ? (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
              
              {/* Message Header */}
              <div className="pb-4 border-b border-border-subtle flex justify-between items-start gap-4">
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary text-sm">{activeMessage.subject}</h3>
                  </div>
                  <p className="text-xs text-text-secondary">
                    From: <span className="font-mono">{activeMessage.sender_email}</span> ({activeMessage.sender})
                  </p>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-text-tertiary font-mono pt-1">
                    <span className="font-semibold text-brand-green">Processed by:</span>
                    <span className="px-1 py-0.2 rounded bg-secondary-surface border border-border-subtle">Email Triage Agent</span>
                    <span>→</span>
                    <span className="px-1 py-0.2 rounded bg-secondary-surface border border-border-subtle">Transaction Stage Agent</span>
                    <span>→</span>
                    <span className="px-1 py-0.2 rounded bg-secondary-surface border border-border-subtle">Audit Agent</span>
                  </div>
                </div>
                <AutoUpdatePolicyBadge status={activeMessage.status} confidence={activeMessage.confidence} />
              </div>

              {/* Message Body */}
              <div className="p-4 bg-secondary-surface rounded-xl border border-border-subtle text-xs text-text-secondary text-left leading-relaxed whitespace-pre-line font-mono">
                {activeMessage.body}
              </div>

              {/* Extraction Matches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                {/* Column 1: Entities matched */}
                <div className="p-4 bg-surface rounded-xl border border-border-subtle/80 space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Ingest Extraction Matrix</span>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-text-tertiary block">Matched Property</span>
                      {activeMessage.status === 'low_confidence' ? (
                        <div className="space-y-1.5 mt-1">
                          <span className="text-xs font-bold text-status-attention block">Ambiguous Match: Baker Street</span>
                          <select
                            value={selectedPropertyOverride}
                            onChange={(e) => setSelectedPropertyOverride(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-border-strong rounded-lg text-xs focus:outline-none"
                          >
                            <option value="">-- Choose target listing --</option>
                            <option value="221 B Baker Street, Austin TX 78704">221 B Baker Street (Escrow File #382)</option>
                            <option value="122 Baker St, Austin TX 78746">122 Baker St (Active Listing)</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-text-primary mt-0.5 block">{activeMessage.matched_property}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-text-tertiary block">Intent Identified</span>
                      <span className="text-xs font-semibold text-text-primary mt-0.5 block">{activeMessage.intent}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-tertiary block">NLP Confidence</span>
                      <span className="text-xs font-mono font-bold text-brand-green mt-0.5 block">
                        {Math.round(activeMessage.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: State Proposal */}
                <div className="p-4 bg-surface rounded-xl border border-border-subtle/80 space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Proposed Action Plan</span>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-text-tertiary block">Workflow Update</span>
                      <span className="text-xs font-semibold text-text-primary mt-0.5 block">
                        Stage: {activeMessage.stage_update || 'None'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-tertiary block">Next-Step Recommendation</span>
                      <p className="text-xs font-bold text-brand-green leading-snug mt-0.5">{activeMessage.recommended_action}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-tertiary block">Safeguards Policy</span>
                      <span className="text-xs font-semibold mt-0.5 block">
                        {activeMessage.approval_required 
                          ? '🔓 Human approval required (Medium/High Risk)'
                          : '⚡ Auto-update allowed (High Confidence Low Risk)'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingest Decision Explainer */}
              <EmailDecisionExplainer message={activeMessage} />

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border-subtle flex justify-end gap-3 shrink-0">
                {activeMessage.status === 'low_confidence' ? (
                  <button
                    disabled={!selectedPropertyOverride}
                    onClick={() => onProcessMessage(activeMessage.id, selectedPropertyOverride)}
                    className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Resolve Ambiguity & Mark Received
                  </button>
                ) : activeMessage.status === 'needs_approval' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onProcessMessage(activeMessage.id)}
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      Approve & Update Escrow
                    </button>
                    <button
                      onClick={() => setSelectedMsgId(null)}
                      className="px-4 py-2 bg-white border border-border-subtle hover:bg-secondary-surface text-text-secondary text-xs font-bold rounded-lg transition-colors"
                    >
                      Ignore/Dismiss
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-status-healthy">
                    <ShieldCheck className="w-5 h-5" />
                    <span>State synchronized successfully to deal file. Audit log recorded.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-4">
              <Mail className="w-10 h-10 text-brand-green/30 shrink-0" />
              <div>
                <h4 className="font-bold text-text-primary text-sm">Select email message</h4>
                <p className="text-xs text-text-secondary mt-1">Select an item from the log to view AI extraction metadata and execute deal status transitions.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function EmailDecisionExplainer({ message }: { message: EmailMessage }) {
  if (!message) return null;

  const getRuleExplainer = (id: string) => {
    switch (id) {
      case 'em_1':
        return {
          rule: 'Rule #14: Lender Underwriting Clear to Close',
          reason: 'Matched due to sender authority domain verification (coastallending.com) and clear text matching "clear to close" and "102 Pine Street".',
          safeguards: 'Auto-update allowed: NLP confidence score (94%) exceeds the system minimum threshold (90%) for internal stage changes.',
          outcome: 'Deal stage updates to "Clear to Close" in Rechat CRM database.',
          audit: 'Logged: "Lender clear-to-close verified via Sarah from Coastal Lending"'
        };
      case 'em_2':
        return {
          rule: 'Rule #2: Seller Disclosure Submission',
          reason: 'Detected keywords "signed the disclosures" and address reference "Baker Street".',
          safeguards: 'Review required: Address matching confidence is low (62%) due to multiple active properties on Baker Street.',
          outcome: 'Disclosures attached to the resolved target loop once matched by coordinator.',
          audit: 'Logged: "Low-confidence disclosure match resolved manually for Baker Street"'
        };
      case 'em_3':
        return {
          rule: 'Rule #19: External Document Dispatch Proposal',
          reason: 'Title officer requested sending closing documents for seller signature.',
          safeguards: 'Human review required: System policy strictly forbids outbound email dispatch without manual coordinator sign-off.',
          outcome: 'Draft email containing DocuSign guidelines sent to clients.',
          audit: 'Logged: "Closing instruction draft approved and dispatched to client"'
        };
      case 'em_4':
        return {
          rule: 'Rule #12: Escrow Closing Extension Request',
          reason: 'Lender/Title requested 3-day scheduled extension matching address "908 Colonial Ave".',
          safeguards: 'Human approval required: Any material date modification affecting closing estimates requires explicit human coordinator consent.',
          outcome: 'Scheduled closing date updated in Dotloop & calendar notifications synced.',
          audit: 'Logged: "Material closing extension approved for 908 Colonial Ave"'
        };
      case 'em_5':
        return {
          rule: 'Rule #7: Sensitive Compliance Flag Exception',
          reason: 'Detected compliance phrases "foundation cracking" and "refusing to deposit earnest funds".',
          safeguards: 'High risk escalation: Structural issues automatically trigger escrow blocking state and notification to Managing Broker.',
          outcome: 'Transaction marked "blocked" in Command Center; notice dispatched to Frank Miller.',
          audit: 'Logged: "Escrow blocked: slab cracking exception on 742 Evergreen"'
        };
      case 'em_6':
        return {
          rule: 'Rule #5: Roster Member Mapping Exception',
          reason: 'Email sender domain matches Magnolia Lending but sender email is unrecognized.',
          safeguards: 'Approval required: Contact must be manually verified and mapped to Colonial Ave contacts database.',
          outcome: 'New contact record created and linked under Buyer Lender role.',
          audit: 'Logged: "Unrecognized sender Randy mapped to Colonial Ave Lender role"'
        };
      case 'em_7':
        return {
          rule: 'Rule #16: Duplicate Thread Resolution',
          reason: 'Inbound subject matches active Pine Street loop but thread ID is divergent.',
          safeguards: 'Manual verification: Merging loops requires coordinator approval to prevent thread contamination.',
          outcome: 'Conversations merged under unified transaction thread ID.',
          audit: 'Logged: "Merged duplicate Closing Checklist threads on 102 Pine Street"'
        };
      case 'em_8':
        return {
          rule: 'Rule #2: Seller Disclosure Submission',
          reason: 'DocuSign completed subject header parsed containing disclosures label.',
          safeguards: 'Auto-update allowed: High-confidence signature certificate (99%) matching known transaction loop.',
          outcome: 'Lead-Based Paint disclosures PDF automatically attached to deal loop.',
          audit: 'Logged: "Lead disclosures PDF attached automatically to 742 Evergreen loop"'
        };
      case 'em_9':
        return {
          rule: 'Rule #25: Ambiguity Clarification Request',
          reason: 'Agent sent short email stating "Done." without attached files or details.',
          safeguards: 'Action proposal: shapework proposes sending secure link for agent to upload PDF.',
          outcome: 'Draft email reminder queued in coordinator outbox.',
          audit: 'Logged: "Disclosures completion clarification link prepared for Alex Carter"'
        };
      case 'em_10':
        return {
          rule: 'Rule #14: Lender Underwriting Clear to Close',
          reason: 'Apex Mortgage underwriting office sent "clear to close" notification.',
          safeguards: 'Auto-update allowed: Matches known underwriting email address with 97% confidence.',
          outcome: 'Deal stage updated to Clear to Close in database.',
          audit: 'Logged: "Deal stage updated to Clear to Close on 102 Pine Street"'
        };
      default:
        return {
          rule: 'Rule #1: General Correspondence',
          reason: 'Matched by subject keywords and roster email.',
          safeguards: 'Approval required: Low confidence or custom template.',
          outcome: 'Update transaction history.',
          audit: 'Logged: "General correspondence parsed"'
        };
    }
  };

  const exp = getRuleExplainer(message.id);

  return (
    <div className="p-4 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl space-y-3 text-xs leading-relaxed text-text-primary text-left font-sans">
      <div className="flex items-center gap-1.5 text-brand-green font-bold">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>shapework. AI Decision Explainer</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Matched Rule</span>
            <span className="font-bold text-text-primary">{exp.rule}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Matching Logic</span>
            <p className="text-[11px] text-text-secondary leading-normal font-medium">{exp.reason}</p>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Safeguards Policy & Logic</span>
            <p className="text-[11px] text-text-secondary leading-normal font-medium">{exp.safeguards}</p>
          </div>
        </div>

        <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-border-subtle/50 pt-2.5 md:pt-0 md:pl-4">
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Resulting Stage Adjust</span>
            <span className="font-bold text-brand-green">{exp.outcome}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Will record to Audit Log</span>
            <span className="font-semibold text-text-secondary font-mono block text-[10px] break-words">{exp.audit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
