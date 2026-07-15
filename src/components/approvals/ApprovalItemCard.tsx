/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Mail, ShieldAlert, Check, X, Eye } from 'lucide-react';
import { ApprovalItem } from './ApprovalCenter';
import ApprovalPolicyReason from './ApprovalPolicyReason';

interface ApprovalItemCardProps {
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onInspect: (item: ApprovalItem) => void;
  key?: any;
}

export default function ApprovalItemCard({
  item,
  onApprove,
  onReject,
  onInspect
}: ApprovalItemCardProps) {
  const isHighConfidence = item.confidence >= 0.90;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 hover:border-border-strong hover:shadow-md transition-all flex flex-col justify-between gap-4 text-left font-sans shadow-sm">
      
      {/* Top area: Agent, Confidence, Policy Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-secondary-surface text-text-secondary text-[9px] font-bold font-mono">
            Proposer: {item.proposingAgent}
          </span>
          <span className="text-[10px] text-text-tertiary">•</span>
          <span className={`text-[10px] font-mono font-bold ${isHighConfidence ? 'text-brand-green' : 'text-status-attention'}`}>
            {Math.round(item.confidence * 100)}% Confidence
          </span>
        </div>
        
        {/* Policy Safeguard Reason Badge */}
        <ApprovalPolicyReason policy={item.policyReason} />
      </div>

      {/* Main details */}
      <div className="space-y-2">
        <h4 className="font-serif font-bold text-sm text-text-primary leading-tight">
          {item.title}
        </h4>
        <p className="text-xs text-text-secondary leading-relaxed">
          {item.evidence}
        </p>

        {/* Actionable Content Previews */}
        {item.draftContent && (
          <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl text-[10px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap mt-2">
            {item.draftContent}
          </div>
        )}

        {/* Before / After comparisons */}
        {item.beforeValue && item.afterValue && (
          <div className="grid grid-cols-5 items-center gap-2 p-3 bg-secondary-surface/40 border border-border-subtle/50 rounded-xl text-xs mt-2 w-max max-w-full">
            <span className="col-span-2 text-text-secondary truncate">{item.beforeValue}</span>
            <ArrowRight className="col-span-1 w-3.5 h-3.5 text-text-tertiary justify-self-center shrink-0" />
            <span className="col-span-2 font-bold text-brand-green truncate">{item.afterValue}</span>
          </div>
        )}
      </div>

      {/* Actions toolbar */}
      <div className="flex justify-between items-center border-t border-border-subtle/50 pt-3.5 mt-1 shrink-0">
        <div className="text-[10px] text-text-tertiary font-mono">
          Target Record: <strong className="text-text-secondary">{item.targetRecord}</strong>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onInspect(item)}
            className="flex items-center gap-1 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect Evidence</span>
          </button>
          
          <button
            onClick={() => onReject(item.id)}
            className="flex items-center gap-1 border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => onApprove(item.id)}
            className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Dispatch</span>
          </button>
        </div>
      </div>

    </div>
  );
}
