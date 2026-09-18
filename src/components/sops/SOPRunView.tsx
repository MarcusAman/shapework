import React, { useState } from 'react';
import { Check, AlertTriangle, Upload, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';
import HelpfulnessFeedback from '../shared/HelpfulnessFeedback';

interface SOPRunViewProps {
  selectedRun: any;
  selectedSop: any;
  handleStepAction: (stepIndex: number, action: 'complete' | 'block' | 'reset', evidenceFile?: string, noteText?: string) => Promise<void>;
  handleUpdateRun: (updatedRun: any) => Promise<void>;
}

export default function SOPRunView({ selectedRun, selectedSop, handleStepAction, handleUpdateRun }: SOPRunViewProps) {
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});

  if (!selectedRun || !selectedSop) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Run Header Status Card */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-stone-200/80 pb-4 select-none">
          <div>
            <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider block">RUN CHECKLIST</span>
            <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">{selectedRun.title}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm ${
            selectedRun.status === 'completed'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-emerald-50 text-[#00635C] border border-emerald-200'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#00635C] animate-pulse" />
            {selectedRun.status}
          </span>
        </div>

        {/* Interactive Checklist Steps */}
        <div className="space-y-4 pt-2">
          {selectedSop.steps.map((step: any, idx: number) => {
            const isCompleted = selectedRun.completedSteps?.includes(step.id);
            const isBlocked = selectedRun.blockedSteps?.includes(step.id);
            const noteText = selectedRun.stepNotes?.[step.id] || '';
            const evidenceVal = selectedRun.stepEvidence?.[step.id] || '';

            return (
              <div 
                key={step.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between gap-4 ${
                  isCompleted 
                    ? 'bg-emerald-50/80 border-emerald-200/90 shadow-sm' 
                    : isBlocked 
                      ? 'bg-rose-50/80 border-rose-200 shadow-sm' 
                      : 'bg-stone-50/70 border-stone-200/80 hover:bg-white shadow-sm'
                }`}
              >
                <div className="space-y-2.5 text-left flex-grow">
                  <div className="flex items-center gap-2.5 select-none">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCompleted 
                        ? 'bg-[#00635C] text-white shadow-sm' 
                        : isBlocked
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-stone-200 text-stone-700 font-mono'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <h4 className={`font-serif font-bold text-sm ${isCompleted ? 'text-emerald-900 line-through' : 'text-stone-900'}`}>
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed pl-8 font-medium">{step.instruction}</p>

                  {/* Inline Step Notes & Evidence */}
                  <div className="pl-8 pt-2 select-text space-y-2.5">
                    <input
                      type="text"
                      defaultValue={noteText}
                      onBlur={(e) => {
                        const notes = { ...(selectedRun.stepNotes || {}) };
                        notes[step.id] = e.target.value;
                        handleUpdateRun({ ...selectedRun, stepNotes: notes });
                      }}
                      placeholder="Add logging notes or links for this step..."
                      className="w-full bg-white border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#00635C] placeholder-stone-400 font-medium shadow-sm"
                    />

                    {/* Evidence Attachment Requirement */}
                    {step.evidenceRequired && (
                      <div className="space-y-2 pt-2 border-t border-stone-200/80">
                        <span className="text-[10px] font-bold uppercase text-[#00635C] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                          Evidence Required: {step.evidenceRequired}
                        </span>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter deliverable URL link (e.g. Google Drive, MLS listing URL)..."
                            value={evidenceInputs[step.id] !== undefined ? evidenceInputs[step.id] : evidenceVal}
                            onChange={(e) => setEvidenceInputs({ ...evidenceInputs, [step.id]: e.target.value })}
                            onBlur={(e) => {
                              const evidence = { ...(selectedRun.stepEvidence || {}) };
                              evidence[step.id] = e.target.value;
                              handleUpdateRun({ ...selectedRun, stepEvidence: evidence });
                            }}
                            className="flex-grow bg-white border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#00635C] placeholder-stone-400 font-medium shadow-sm"
                          />
                          <button
                            onClick={() => {
                              const evidence = { ...(selectedRun.stepEvidence || {}) };
                              evidence[step.id] = evidenceInputs[step.id] || '';
                              handleUpdateRun({ ...selectedRun, stepEvidence: evidence });
                            }}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs text-[#00635C] font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm"
                          >
                            Add Evidence Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="shrink-0 flex flex-col justify-center items-end gap-2 select-none">
                  {!isCompleted ? (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleStepAction(idx, 'complete', step.evidenceRequired ? (evidenceInputs[step.id] || 'evidence_link_complete') : undefined)}
                        className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Complete
                      </button>
                      <button
                        onClick={() => handleStepAction(idx, 'block')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center shadow-sm"
                      >
                        Block
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStepAction(idx, 'reset')}
                      className="text-xs text-stone-500 hover:text-stone-900 font-semibold underline cursor-pointer transition-colors"
                    >
                      Reset Step
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline History Card */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-3">
        <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider block text-left">Run Timeline History Log</span>
        <div className="space-y-2 select-text text-left text-xs font-medium">
          {(selectedRun.timeline || []).map((t: any, i: number) => (
            <div key={i} className="flex justify-between border-b border-stone-100 py-2">
              <span className="text-stone-500">{new Date(t.timestamp).toLocaleTimeString()}</span>
              <span className="font-bold text-stone-900">{t.actor}</span>
              <span className="text-[#00635C] font-semibold">{t.action}</span>
              <span className="text-stone-500 shrink-0 max-w-[200px] truncate">{t.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Level Feedback */}
      {selectedRun.status === 'completed' && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider block text-left">Helpfulness Rating System</span>
          <HelpfulnessFeedback
            objectType="sop_run"
            objectId={selectedRun.id}
            compact={false}
          />
        </div>
      )}
    </div>
  );
}

