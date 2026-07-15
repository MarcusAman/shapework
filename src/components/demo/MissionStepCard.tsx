/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Shield, HelpCircle, ArrowRight, Layers, FileText } from 'lucide-react';
import BrandIcon from '../ui/BrandIcon';

interface StepData {
  stepNumber: number;
  title: string;
  agent: string;
  system: 'gmail' | 'rechat' | 'docusign' | 'gdrive' | 'system';
  description: string;
  details: string;
  evidence?: string;
  confidence?: number;
  policy?: string;
  changeDescription?: string;
  auditId?: string;
}

interface MissionStepCardProps {
  step: StepData;
}

export default function MissionStepCard({ step }: MissionStepCardProps) {
  const isHighConfidence = step.confidence && step.confidence >= 0.90;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between text-left">
      <div className="space-y-3.5">
        
        {/* Header: Agent, System badge */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border-subtle bg-secondary-surface flex items-center justify-center shrink-0 shadow-sm">
              <BrandIcon name={step.system} className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Activating Specialist</span>
              <h4 className="text-xs font-bold text-text-primary mt-0.5">{step.agent}</h4>
            </div>
          </div>

          {step.confidence !== undefined && (
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              isHighConfidence ? 'bg-brand-green-soft text-brand-green' : 'bg-status-attention-soft text-status-attention'
            }`}>
              {Math.round(step.confidence * 100)}% Match
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Step {step.stepNumber}: {step.title}</span>
          <p className="text-xs font-semibold text-text-secondary leading-normal">{step.description}</p>
        </div>

        {/* Text Details */}
        <p className="text-[11px] text-text-secondary leading-relaxed">
          {step.details}
        </p>

        {/* Evidence */}
        {step.evidence && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Ingested Text Evidence</span>
            <pre className="p-3 bg-stone-50 border border-border-subtle rounded-xl text-[10px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap italic">
              {step.evidence}
            </pre>
          </div>
        )}

        {/* State changes */}
        {step.changeDescription && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Workspace Operations Adjustments</span>
            <div className="p-2.5 bg-brand-green-soft/20 border border-brand-green/10 rounded-xl text-[10px] text-brand-green font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>{step.changeDescription}</span>
            </div>
          </div>
        )}

        {/* Policy constraint */}
        {step.policy && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Active Governance Rule</span>
            <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{step.policy}</span>
            </div>
          </div>
        )}

      </div>

      {/* Audit indicator */}
      {step.auditId && (
        <div className="pt-3 border-t border-border-subtle/50 flex items-center justify-between text-[9px] text-text-tertiary font-mono">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-brand-green" />
            Audit Ledger reference:
          </span>
          <span className="font-semibold text-brand-green">{step.auditId}</span>
        </div>
      )}

    </div>
  );
}
