/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ActiveRunDrawer
 * Interactive Execution Canvas & Evidence Capture for Active SOP Runs.
 * In Apple Light Mode (#FFFFFF / #F7F8F5).
 */

import React, { useState } from 'react';
import {
  X, CheckCircle2, AlertTriangle, Clock, Play, User, ExternalLink,
  ShieldCheck, Upload, FileText, CheckSquare, Square, AlertOctagon,
  ArrowRight, Sparkles, Building, ChevronRight, HelpCircle,
  Truck, Camera, Key
} from 'lucide-react';
import type { SopRunRecord, SopRunStepRecord } from '../../../server/persistence/sopRunRepository';
import { useToast } from '../ui';

interface ActiveRunDrawerProps {
  run: SopRunRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStepCompleted: (runId: string, stepId: string, evidenceData: any) => Promise<void>;
  onStepReopened: (runId: string, stepId: string) => Promise<void>;
  onEscalateBottleneck: (runId: string, data: any) => Promise<void>;
}

export default function ActiveRunDrawer({
  run,
  isOpen,
  onClose,
  onStepCompleted,
  onStepReopened,
  onEscalateBottleneck
}: ActiveRunDrawerProps) {
  const { toast } = useToast();
  const [selectedStep, setSelectedStep] = useState<SopRunStepRecord | null>(null);
  const [evidenceType, setEvidenceType] = useState<'url_link' | 'mls_number' | 'photo_upload' | 'text_note' | 'confirmation'>('url_link');
  const [evidenceValue, setEvidenceValue] = useState('');
  const [stepNotes, setStepNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  if (!isOpen || !run) return null;

  const isCompleted = run.status === 'completed' || run.progressPercent === 100;
  const isAtRisk = run.status === 'at_risk';

  const handleOpenEvidenceModal = (step: SopRunStepRecord) => {
    if (step.status === 'completed') {
      // Prompt to reopen
      if (window.confirm(`Step ${step.stepNumber} is already completed. Reopen this step?`)) {
        onStepReopened(run.id, step.id);
      }
      return;
    }
    setSelectedStep(step);
    setEvidenceValue(step.evidenceValue || '');
    setStepNotes(step.notes || '');
    setEvidenceType(step.evidenceType || 'url_link');
  };

  const handleSaveStepCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStep) return;
    setIsSubmitting(true);
    try {
      await onStepCompleted(run.id, selectedStep.id, {
        evidenceType,
        evidenceValue: evidenceValue.trim() || 'Verified step execution in platform.',
        notes: stepNotes.trim()
      });
      setSelectedStep(null);
      setEvidenceValue('');
      setStepNotes('');
    } catch (err) {
      console.error('Failed to complete step:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEscalation = async () => {
    if (!escalateReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onEscalateBottleneck(run.id, {
        stepNumber: run.currentStepNumber,
        stepAction: run.steps.find(s => s.stepNumber === run.currentStepNumber)?.action,
        reason: escalateReason,
        assignedTo: run.assigneeName
      });
      setShowEscalateModal(false);
      setEscalateReason('');
    } catch (err) {
      console.error('Failed to escalate bottleneck:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[540px] lg:w-[620px] bg-white border-l border-stone-200/90 shadow-2xl flex flex-col animate-slideInRight text-xs">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white/95 border-b border-stone-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-50 text-[#00635C] border border-emerald-200'
          }`}>
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isCompleted 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : isAtRisk 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-50 text-[#00635C] border border-emerald-200'
              }`}>
                {isCompleted ? '100% Completed' : isAtRisk ? 'SLA Delay / At Risk' : 'Active Run'}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">v{run.sopVersion}.0</span>
            </div>
            <h2 className="text-base font-serif font-bold text-stone-900 mt-0.5 truncate max-w-[340px]">
              {run.propertyAddress}
            </h2>
            <p className="text-[11px] text-stone-500 font-medium truncate">
              {run.title} • Assignee: <strong className="text-stone-700">{run.assigneeName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress & Health Bar */}
      <div className="px-6 py-3.5 bg-[#F7F8F5] border-b border-stone-200/80 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">{run.progressPercent}% Complete</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-600">
              {run.steps.filter(s => s.status === 'completed').length} of {run.totalSteps} Steps
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={() => setShowEscalateModal(true)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                title="Escalate bottleneck delay to process owner"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Escalate Delay</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted ? 'bg-emerald-600' : isAtRisk ? 'bg-rose-500' : 'bg-[#00635C]'
            }`}
            style={{ width: `${Math.max(5, run.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Step Execution Checklist Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {run.steps.map((step) => {
          const isStepDone = step.status === 'completed';
          const isCurrent = step.stepNumber === run.currentStepNumber && !isStepDone;

          return (
            <div
              key={step.id}
              onClick={() => handleOpenEvidenceModal(step)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isStepDone
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : isCurrent
                    ? 'bg-white border-2 border-emerald-500 shadow-sm ring-4 ring-emerald-500/10'
                    : 'bg-[#F7F8F5]/80 border-stone-200/80 hover:bg-stone-100/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button className="mt-0.5 shrink-0 text-[#00635C]">
                    {isStepDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs ${isStepDone ? 'text-emerald-900 line-through' : 'text-stone-900'}`}>
                        Step {step.stepNumber} • {step.role}
                      </span>
                      {step.systemUsed && (
                        <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded text-[10px] font-mono">
                          {step.systemUsed}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${isStepDone ? 'text-stone-500 line-through' : 'text-stone-700'}`}>
                      {step.action}
                    </p>

                    {/* Evidence & Completion Metadata */}
                    {isStepDone && (
                      <div className="pt-2 mt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-3 text-[11px] text-emerald-800">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed by {step.completedByName}</span>
                        </span>
                        {step.completedAt && (
                          <span className="text-emerald-700/80 font-mono text-[10px]">
                            {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {step.evidenceValue && (
                          <span className="bg-white/80 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] truncate max-w-[280px]">
                            Proof: {step.evidenceValue}
                          </span>
                        )}
                      </div>
                    )}

                    {!isStepDone && isCurrent && (
                      <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-[#00635C] font-semibold">
                        <span>Click to log evidence & check off step</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {!isStepDone && step.systemUsed?.toLowerCase().includes('sign') && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch('/api/vendors/orders/dispatch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  workspaceId: 'nest-realty-wilmington',
                                  vendorType: 'coastal_sign_post',
                                  propertyAddress: run.propertyAddress,
                                  sopRunId: run.id,
                                  sopStepNumber: step.stepNumber,
                                  details: { rider1: 'Coming Soon', brochureBox: true },
                                  cost: 75.00,
                                  createdBy: 'Operations Coordinator'
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                toast.success({ title: 'Dispatched', description: `Work order #${data.order.vendorOrderId} dispatched.` });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-semibold transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-700" />
                          <span>Dispatch Coastal Sign Post ($75)</span>
                        </button>
                      </div>
                    )}

                    {!isStepDone && step.systemUsed?.toLowerCase().includes('media') && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch('/api/vendors/orders/dispatch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  workspaceId: 'nest-realty-wilmington',
                                  vendorType: 'hdr_media',
                                  propertyAddress: run.propertyAddress,
                                  sopRunId: run.id,
                                  sopStepNumber: step.stepNumber,
                                  details: { packageTier: 'Pro Plus (HDR + Drone 4K + 2D Floor Plan)' },
                                  cost: 275.00,
                                  createdBy: 'Operations Coordinator'
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                toast.success({ title: 'Booked', description: `Media shoot #${data.order.vendorOrderId} scheduled.` });
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-semibold transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-purple-700" />
                          <span>Book Cape Fear Media Shoot ($275)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Completion Certificate when 100% done */}
        {isCompleted && (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <h4 className="font-serif font-bold text-emerald-900 text-sm">
              Procedure Complete & Audited
            </h4>
            <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
              All {run.totalSteps} steps executed in compliance with published Nest Realty policy. Recorded in brokerage compliance archive.
            </p>
          </div>
        )}
      </div>

      {/* Step Completion & Evidence Modal */}
      {selectedStep && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider block">
                  Verify Step {selectedStep.stepNumber} Completion
                </span>
                <h3 className="font-serif font-bold text-stone-900 text-sm mt-0.5">
                  {selectedStep.role}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-700 text-xs bg-[#F7F8F5] p-3 rounded-xl border border-stone-200/80 leading-relaxed">
              {selectedStep.action}
            </p>

            <form onSubmit={handleSaveStepCompletion} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Evidence Proof Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceType('url_link')}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      evidenceType === 'url_link' ? 'bg-[#00635C] text-white border-[#00635C]' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Dotloop / Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceType('mls_number')}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      evidenceType === 'mls_number' ? 'bg-[#00635C] text-white border-[#00635C]' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>MLS # / ID</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  {evidenceType === 'url_link' ? 'Document / Loop URL:' : 'MLS # or Confirmation Reference:'}
                </label>
                <input
                  type="text"
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  placeholder={evidenceType === 'url_link' ? 'https://dotloop.com/loop/...' : 'e.g. MLS #10048291 or Order #CSP-8492'}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Execution Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={stepNotes}
                  onChange={(e) => setStepNotes(e.target.value)}
                  placeholder="Additional context or notes regarding this step..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Step Complete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottleneck Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Escalate Bottleneck / Vendor Delay</span>
            </div>

            <p className="text-stone-600 text-xs leading-relaxed">
              This creates an urgent operational ticket in the Work Queue assigned to <strong className="text-stone-900">{run.assigneeName}</strong> to unblock this property run.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Delay Reason / Blocked Item:
              </label>
              <textarea
                rows={3}
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="e.g. Photography vendor delayed by rain; need BIC authorization to extend MLS coming-soon timeline."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                disabled={isSubmitting || !escalateReason.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Create Bottleneck Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
