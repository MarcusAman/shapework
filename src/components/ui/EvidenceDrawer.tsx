/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Zap, AlertCircle, Cpu, FileText } from 'lucide-react';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  evidenceText: string;
  confidence: number;
  systemLogs?: string;
}

export default function EvidenceDrawer({
  isOpen,
  onClose,
  title,
  evidenceText,
  confidence,
  systemLogs = 'NLP model extraction successful. Token matching coordinates matched successfully with high-confidence index weights. Document verified by MD5 checksum.'
}: EvidenceDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-[1px] z-[100] transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-surface shadow-2xl z-[100] flex flex-col border-l border-border-subtle animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-secondary-surface">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-green" />
            <h3 className="font-serif font-bold text-text-primary text-sm">AI Proposal Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-brand-green-soft text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Main Context Card */}
          <div className="p-4 bg-secondary-surface border border-border-subtle rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Extracted Element</span>
            <h4 className="font-semibold text-text-primary text-xs">{title}</h4>
            <div className="flex items-center gap-4 text-xs mt-2">
              <div className="flex flex-col">
                <span className="text-text-tertiary text-[10px]">Confidence Rating</span>
                <span className="font-mono font-bold text-brand-green mt-0.5">{Math.round(confidence * 100)}% Match</span>
              </div>
              <div className="flex flex-col">
                <span className="text-text-tertiary text-[10px]">Classification Model</span>
                <span className="font-mono text-text-primary mt-0.5">shapework-re-nlp-v3</span>
              </div>
            </div>
          </div>

          {/* Evidence Details */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-text-secondary" />
              Source Material Evidence
            </span>
            <div className="bg-stone-50 border border-border-subtle rounded-lg p-3 text-xs leading-relaxed font-mono text-text-secondary max-h-48 overflow-y-auto whitespace-pre-line">
              {evidenceText}
            </div>
          </div>

          {/* Diagnostics System Logs */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-text-secondary" />
              Audit & Processing Logs
            </span>
            <div className="bg-stone-50 border border-border-subtle rounded-lg p-3 text-xs leading-relaxed font-mono text-text-tertiary">
              {systemLogs}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-3 bg-status-healthy-soft text-status-healthy rounded-lg border border-status-healthy/10 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This action was processed under safe-automation compliance rules. shapework will only execute external outbound actions after human leadership authorization.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border-subtle bg-secondary-surface flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border-subtle rounded-lg hover:bg-brand-green-soft text-xs font-semibold transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </>
  );
}
