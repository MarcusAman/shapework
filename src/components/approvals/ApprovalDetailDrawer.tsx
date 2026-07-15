/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldAlert, Check, Shield, FileText, ArrowRight } from 'lucide-react';
import { ApprovalItem } from './ApprovalCenter';

interface ApprovalDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ApprovalItem | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onInspectRecord?: (type: string, id: string) => void;
}

export default function ApprovalDetailDrawer({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  onInspectRecord
}: ApprovalDetailDrawerProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Panel */}
      <div className="w-full max-w-md bg-surface border-l border-border-subtle shadow-xl flex flex-col h-full relative z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-green" />
            <div>
              <h3 className="font-serif font-bold text-sm text-text-primary">Human-in-the-Loop Audit</h3>
              <span className="font-mono text-[9px] text-text-tertiary">ID: {item.id}</span>
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
          
          {/* Action details */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Proposed Action</span>
            <h4 className="font-bold text-sm text-text-primary leading-snug">{item.title}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">{item.evidence}</p>
          </div>

          {/* Telemetry info */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-secondary-surface border border-border-subtle rounded-2xl">
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Proposing Agent</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block">{item.proposingAgent}</span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Target Record</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block truncate">{item.targetRecord}</span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Matching Confidence</span>
              <span className="text-xs font-bold text-brand-green mt-0.5 block font-mono">{Math.round(item.confidence * 100)}%</span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Policy Applied</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block truncate">{item.policyReason.split(' ')[0]}</span>
            </div>
          </div>

          {/* Draft block */}
          {item.draftContent && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Prepared Draft Content</span>
              <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                {item.draftContent}
              </div>
            </div>
          )}

          {/* Before/After values */}
          {item.beforeValue && item.afterValue && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">State Matrix Shift</span>
              <div className="border border-border-subtle rounded-2xl p-4 bg-secondary-surface/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-text-tertiary block font-mono">BEFORE</span>
                  <span className="font-semibold text-text-secondary mt-1 block">{item.beforeValue}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-tertiary" />
                <div className="text-right">
                  <span className="text-[9px] text-text-tertiary block font-mono">AFTER</span>
                  <span className="font-bold text-brand-green mt-1 block">{item.afterValue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Applied Safeguard reason details */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Governance Safeguards Policy</span>
            <div className="flex items-center gap-2.5 p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-mono text-[9px] font-semibold">{item.policyReason}</span>
            </div>
          </div>

          {/* Audit draft preview */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Draft Ledger Hash preview</span>
            <div className="p-3 bg-secondary-surface border border-border-subtle rounded-xl flex items-center gap-2 text-xs font-mono text-text-secondary">
              <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
              <span className="text-[10px] text-brand-green font-semibold truncate">aud_ledger_commit_{item.id}</span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-border-subtle bg-secondary-surface shrink-0 flex gap-2">
          {onInspectRecord && (
            <button
              onClick={() => {
                onInspectRecord(item.recordType, item.targetRecord);
                onClose();
              }}
              className="flex-1 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary text-center py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Inspect Record 360
            </button>
          )}

          <button
            onClick={() => {
              onApprove(item.id);
              onClose();
            }}
            className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white text-center py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Authorize & Execute
          </button>
        </div>

      </div>

    </div>
  );
}
