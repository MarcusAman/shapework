/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Sparkles, Check, X, ShieldAlert } from 'lucide-react';

interface DealStageUpdateCardProps {
  propertyName: string;
  currentStage: string;
  proposedStage: string;
  confidence: number;
  evidenceQuote: string;
  automationRule: string;
  onApprove: () => void;
  onReject: () => void;
  onEditStage?: (stage: string) => void;
}

export default function DealStageUpdateCard({
  propertyName,
  currentStage,
  proposedStage,
  confidence,
  evidenceQuote,
  automationRule,
  onApprove,
  onReject,
  onEditStage
}: DealStageUpdateCardProps) {
  const isHighConfidence = confidence >= 0.90;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 space-y-4 shadow-sm text-left">
      {/* Title / Property name & Confidence */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block">Proposed Stage Update</span>
          <h4 className="font-semibold text-xs text-text-primary mt-0.5">{propertyName}</h4>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
          isHighConfidence 
            ? 'bg-brand-green-soft text-brand-green' 
            : 'bg-status-attention-soft text-status-attention'
        }`}>
          {Math.round(confidence * 100)}% Confidence
        </div>
      </div>

      {/* Transition indicator */}
      <div className="bg-secondary-surface border border-border-subtle/50 rounded-xl p-3 flex items-center justify-around gap-2 text-center text-xs">
        <div>
          <span className="text-[9px] text-text-tertiary uppercase tracking-wider block font-semibold">Current Stage</span>
          <span className="font-semibold text-text-secondary mt-1 block">{currentStage}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0" />
        <div>
          <span className="text-[9px] text-brand-green uppercase tracking-wider block font-bold">Proposed Stage</span>
          <span className="font-bold text-brand-green mt-1 block">{proposedStage}</span>
        </div>
      </div>

      {/* Evidence Quote */}
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Extracted Evidence</span>
        <blockquote className="border-l-2 border-border-subtle pl-2.5 py-0.5 text-[11px] text-text-secondary italic leading-relaxed whitespace-normal">
          "{evidenceQuote}"
        </blockquote>
      </div>

      {/* Automation Rule details */}
      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary pt-1 border-t border-border-subtle/30 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-brand-green shrink-0" />
        <span>Rule: {automationRule}</span>
      </div>

      {/* Agent & Playbook telemetry */}
      <div className="p-2.5 bg-secondary-surface border border-border-subtle rounded-xl text-[10px] text-text-secondary space-y-1 leading-normal font-mono">
        <div>• <strong>Proposing Agent:</strong> Transaction Stage Agent</div>
        <div>• <strong>Playbook:</strong> Clear to Close Email Playbook</div>
        <div>• <strong>Approval Policy:</strong> Gated by Governance Policy</div>
        <div>• <strong>Audit Reference:</strong> <span className="text-brand-green">audit_stage_update_pine_st</span></div>
      </div>

      {/* Action Controls */}
      <div className="flex gap-2 justify-between items-center pt-2">
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve Update</span>
          </button>
          
          <button
            onClick={onReject}
            className="flex items-center gap-1 border border-border-subtle rounded-lg bg-surface hover:bg-secondary-surface text-text-secondary px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>
        
        {onEditStage && (
          <button
            onClick={() => onEditStage(proposedStage)}
            className="text-[10px] text-text-tertiary hover:text-text-secondary underline"
          >
            Modify Stage
          </button>
        )}
      </div>
    </div>
  );
}
