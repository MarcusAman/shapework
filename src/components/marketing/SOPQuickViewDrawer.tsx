/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Check
} from 'lucide-react';
import { MarketingSopDefinition } from './marketingSopRegistry';

export interface SOPQuickViewDrawerProps {
  sop: MarketingSopDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSopLibrary?: (sopId: string) => void;
}

export const SOPQuickViewDrawer: React.FC<SOPQuickViewDrawerProps> = ({
  sop,
  isOpen,
  onClose,
  onNavigateToSopLibrary
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sop) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6 animate-in slide-in-from-right duration-300 text-left">
          
          {/* Header Bar */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#00635C] text-white shadow-2xs">
                  {sop.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {sop.department}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  v2.0 • Authoritative
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-tight">
                {sop.title}
              </h2>

              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>Process Owner: <strong className="text-slate-800 font-semibold">{sop.ownerName}</strong> ({sop.ownerRole})</span>
                <span>•</span>
                <span>SLA: <strong className="text-slate-800 font-semibold">{sop.expectedTiming}</strong></span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Close SOP Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Purpose & Trigger Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Operational Purpose
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {sop.purpose}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-[#00635C] shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600">
                <strong className="text-slate-900 font-semibold">Initiation Trigger: </strong>
                {sop.trigger}
              </div>
            </div>
          </div>

          {/* Systems & Tools Used */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              Integrated Systems & Tools
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sop.systemsUsed.map((sys, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5"
                >
                  <Layers className="w-3 h-3 text-[#00635C]" />
                  <span>{sys}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-Step Execution Sequence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-emerald-100 text-[#00635C] flex items-center justify-center text-xs font-bold">✓</span>
                <span>Step-by-Step Execution Sequence</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{sop.orderedSteps.length} Steps</span>
            </div>

            <div className="space-y-2.5">
              {sop.orderedSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs hover:border-[#00635C]/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00635C] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {step.stepNumber}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{step.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {step.systemUsed}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    {step.action}
                  </p>

                  <div className="pl-7 pt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span>Role: <strong className="text-slate-700">{step.role}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Quality Assurance Checklist */}
          <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200/80">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                <span>Brand SOP Quality Checklist</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                100% Verification Required
              </span>
            </div>

            <div className="space-y-1.5">
              {sop.qualityChecklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>

            {sop.complianceNotes && (
              <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 italic">
                <strong>Compliance Note:</strong> {sop.complianceNotes}
              </div>
            )}
          </div>

          {/* Completion Evidence */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900 font-bold block mb-0.5">Required Completion Evidence</strong>
              <span>{sop.completionEvidence}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              Governing Protocol • Nest Realty Wilmington
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>

              {onNavigateToSopLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToSopLibrary(sop.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in SOP Library ↗</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
