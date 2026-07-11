/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldAlert, CheckCircle, ArrowRight, Shield, FileText } from 'lucide-react';
import { LiveEvent } from '../../data/demoLiveEvents';
import BrandIcon from '../ui/BrandIcon';

interface LiveEventDetailDrawerProps {
  event: LiveEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRecord?: (type: string, id: string) => void;
}

export default function LiveEventDetailDrawer({
  event,
  isOpen,
  onClose,
  onNavigateToRecord
}: LiveEventDetailDrawerProps) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Slide-over panel */}
      <div className="w-full max-w-md bg-surface border-l border-border-subtle shadow-xl flex flex-col h-full relative z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-border-subtle bg-surface flex items-center justify-center shadow-sm">
              <BrandIcon name={event.source} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-text-primary">Event Inspection</h3>
              <span className="font-mono text-[9px] text-text-tertiary">ID: {event.id}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-subtle p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
          
          {/* Main summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Operational Trigger</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                event.status === 'completed' ? 'bg-brand-green-soft text-brand-green' : 'bg-status-attention-soft text-status-attention'
              }`}>
                {event.status}
              </span>
            </div>
            <h4 className="font-bold text-sm text-text-primary leading-snug">
              {event.trigger}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Verification Telemetry */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-secondary-surface border border-border-subtle/80 rounded-2xl">
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Running Agent</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block">{event.agentName}</span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Target Record</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block truncate">{event.recordName}</span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Confidence Rating</span>
              <span className={`text-xs font-bold mt-0.5 block font-mono ${event.confidence >= 0.90 ? 'text-brand-green' : 'text-status-attention'}`}>
                {Math.round(event.confidence * 100)}% Match
              </span>
            </div>
            <div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block">Risk Severity</span>
              <span className="text-xs font-bold text-text-primary mt-0.5 block capitalize">{event.riskLevel}</span>
            </div>
          </div>

          {/* Evidence quote */}
          {event.evidenceQuote && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Source Material Evidence</span>
              <div className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap italic">
                "{event.evidenceQuote}"
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          {event.beforeValue && event.afterValue && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">State Transition Matrix</span>
              <div className="border border-border-subtle rounded-2xl p-4 bg-secondary-surface/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-text-tertiary block font-mono">BEFORE</span>
                  <span className="font-semibold text-text-secondary mt-1 block">{event.beforeValue}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-tertiary" />
                <div className="text-right">
                  <span className="text-[9px] text-text-tertiary block font-mono">AFTER</span>
                  <span className="font-bold text-brand-green mt-1 block">{event.afterValue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Applied safeguards */}
          {event.policyName && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Applied Safeguards Policy</span>
              <div className="flex items-center gap-2 p-3 bg-brand-green-soft/30 border border-brand-green/10 rounded-xl text-xs text-brand-green">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="font-mono text-[10px] font-semibold">{event.policyName}</span>
              </div>
            </div>
          )}

          {/* Reversibility details */}
          {event.auditId && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Audit Log Reference</span>
              <div className="flex items-center gap-2 p-3 bg-secondary-surface border border-border-subtle rounded-xl text-xs font-mono text-text-secondary">
                <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
                <span className="text-[10px] text-brand-green font-semibold truncate">{event.auditId}</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border-subtle bg-secondary-surface shrink-0 flex gap-2">
          {onNavigateToRecord && (
            <button
              onClick={() => onNavigateToRecord(event.recordType, event.recordName)}
              className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white text-center py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Open Record 360 Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-border-subtle rounded-xl text-xs bg-surface font-semibold text-text-secondary hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>

      </div>

    </div>
  );
}
