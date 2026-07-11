/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Cpu, Shield, Clock, Terminal, CheckCircle, Database } from 'lucide-react';
import { AgentRun } from './AgentRunTable';

interface AgentRunInspectorProps {
  run: AgentRun | null;
  onClose: () => void;
}

export default function AgentRunInspector({ run, onClose }: AgentRunInspectorProps) {
  if (!run) return null;

  // Custom reasoning chains based on agentId
  const getReasoningSteps = () => {
    switch (run.agentId) {
      case 'agent_triage':
        return [
          { step: "Signal Ingestion", desc: "Sync Gmail mailbox, download message body text.", tool: "gmail_connector" },
          { step: "Intent Classification", desc: "Analyze semantic structure to extract closing updates.", tool: "nlp_intent_parser" },
          { step: "Entity Linkage", desc: "Verify lender address is associated with 102 Pine Street escrow file.", tool: "contacts_db_search" }
        ];
      case 'agent_stage':
        return [
          { step: "Milestone Scan", desc: "Retrieve active underwriting milestone checklists.", tool: "transaction_stage_indexer" },
          { step: "Evidence Extraction", desc: "Scan clear-to-close statements against underwriting directives.", tool: "ocr_evidence_extraction" },
          { step: "Governance Compliance Check", desc: "Trigger milestone update proposal and review permission matrix.", tool: "governance_policy_evaluator" }
        ];
      case 'agent_compliance':
        return [
          { step: "Webhook Handshake", desc: "Ingest DocuSign envelop event logs.", tool: "docusign_connector" },
          { step: "Disclosure Parsing", desc: "Scan signature tags on Buyer Broker agreements.", tool: "ocr_signature_validator" },
          { step: "Exception Logging", desc: "Log compliance exception for missing files.", tool: "ledger_compliance_recorder" }
        ];
      default:
        return [
          { step: "Database Refresh", desc: "Query sync status for connected repositories.", tool: "webhook_heartbeat_check" },
          { step: "Calibrate Metrics", desc: "Update health scores and revenue exposure models.", tool: "risk_scoring_calculator" }
        ];
    }
  };

  const steps = getReasoningSteps();

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer */}
      <div className="w-full max-w-md bg-surface border-l border-border-subtle shadow-xl flex flex-col h-full relative z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-green" />
            <div>
              <h3 className="font-serif font-bold text-sm text-text-primary">Agent Trace Inspector</h3>
              <span className="font-mono text-[9px] text-text-tertiary">Run ID: {run.runId}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-subtle p-1.5 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
          
          {/* Run Header Info */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block font-mono">Specialist Execution</span>
            <h4 className="font-bold text-sm text-text-primary">{run.agentName}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Trigger: {run.trigger}
            </p>
          </div>

          {/* Reasoning Trace Steps */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Execution Steps & Reasoning Chains</span>
            
            <div className="space-y-4 relative border-l border-border-subtle pl-4 ml-2.5">
              {steps.map((st, idx) => (
                <div key={idx} className="relative text-xs space-y-1">
                  <div className="w-2 h-2 rounded-full bg-brand-green absolute -left-[20px] top-1 border-2 border-surface shadow-sm" />
                  
                  <div className="flex justify-between items-center text-[9px] text-text-tertiary font-mono">
                    <span>STEP {idx + 1}: {st.step}</span>
                    <span className="bg-secondary-surface border border-border-subtle px-1.5 py-0.2 rounded font-semibold text-[8px]">{st.tool}</span>
                  </div>
                  
                  <h5 className="font-bold text-text-primary leading-tight">{st.step}</h5>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tool outputs */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Trace Logs Terminal</span>
            <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-1 text-[10px] font-mono text-stone-300 leading-relaxed overflow-x-auto text-left">
              <div>[INFO] Ingesting parameters for {run.agentId}</div>
              <div>[OK] Connection to broker active.</div>
              <div>[OK] Parsed {run.recordsScanned} records in {run.duration}.</div>
              <div>[OK] Prepared {run.actionsPrepared} actions. Match Confidence: {run.confidence}.</div>
              <div className="text-brand-green">[SUCCESS] Run finalized with 0 warnings.</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-subtle bg-secondary-surface shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-center py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Close Trace
          </button>
        </div>

      </div>

    </div>
  );
}
