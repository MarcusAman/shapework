import React, { useState } from 'react';
import { Check, AlertTriangle, Upload } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Run Header status */}
      <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 select-none">
          <div>
            <span className="text-[8px] font-mono text-[#D0D6BB]/50 uppercase tracking-widest block">RUN CHECKLIST</span>
            <h3 className="font-serif font-black text-sm text-white">{selectedRun.title}</h3>
          </div>
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-black ${
            selectedRun.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {selectedRun.status}
          </span>
        </div>

        {/* Interactive checklist steps */}
        <div className="space-y-4">
          {selectedSop.steps.map((step: any, idx: number) => {
            const isCompleted = selectedRun.completedSteps?.includes(step.id);
            const isBlocked = selectedRun.blockedSteps?.includes(step.id);
            const noteText = selectedRun.stepNotes?.[step.id] || '';
            const evidenceVal = selectedRun.stepEvidence?.[step.id] || '';

            return (
              <div 
                key={step.id} 
                className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row justify-between gap-4 ${
                  isCompleted 
                    ? 'bg-emerald-950/15 border-emerald-500/15 opacity-70' 
                    : (isBlocked ? 'bg-red-950/20 border-red-500/20' : 'bg-black/25 border-white/10')
                }`}
              >
                <div className="space-y-2 text-left flex-grow">
                  <div className="flex items-center gap-2 select-none">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-black/45 text-[#D0D6BB]/50'
                    }`}>
                      {idx + 1}
                    </span>
                    <h4 className={`font-serif font-bold text-xs ${isCompleted ? 'text-emerald-300 line-through' : 'text-white'}`}>{step.title}</h4>
                  </div>
                  <p className="text-[11px] text-[#D0D6BB]/70 leading-relaxed pl-7">{step.instruction}</p>

                  {/* Inline step notes */}
                  <div className="pl-7 pt-2 select-text space-y-2">
                    <input
                      type="text"
                      defaultValue={noteText}
                      onBlur={(e) => {
                        const notes = { ...(selectedRun.stepNotes || {}) };
                        notes[step.id] = e.target.value;
                        handleUpdateRun({ ...selectedRun, stepNotes: notes });
                      }}
                      placeholder="Add logging notes or links for this step..."
                      className="w-full bg-black/20 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none placeholder-stone-600 font-sans"
                    />

                    {/* Evidence Attachment Requirement */}
                    {step.evidenceRequired && (
                      <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                        <span className="text-[8px] font-mono uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10 block w-max select-none">
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
                            className="flex-grow bg-black/20 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none placeholder-stone-600 font-sans"
                          />
                          <button
                            onClick={() => {
                              const evidence = { ...(selectedRun.stepEvidence || {}) };
                              evidence[step.id] = evidenceInputs[step.id] || '';
                              handleUpdateRun({ ...selectedRun, stepEvidence: evidence });
                            }}
                            className="px-3 py-1 bg-[#10b981]/25 hover:bg-[#10b981]/40 border border-[#10b981]/30 rounded-lg text-[9px] text-[#34d399] font-mono transition-all cursor-pointer whitespace-nowrap"
                          >
                            Add Evidence Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="shrink-0 flex flex-col justify-center items-end gap-2 select-none">
                  {!isCompleted ? (
                    <div className="flex flex-col gap-1.5 w-full md:w-auto">
                      <button
                        onClick={() => handleStepAction(idx, 'complete', step.evidenceRequired ? (evidenceInputs[step.id] || 'evidence_link_complete') : undefined)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Complete
                      </button>
                      <button
                        onClick={() => handleStepAction(idx, 'block')}
                        className="px-3 py-1 bg-red-650 hover:bg-red-750 text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Block
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStepAction(idx, 'reset')}
                      className="text-[9px] text-[#D0D6BB]/40 hover:text-white font-mono uppercase tracking-wider font-bold underline cursor-pointer"
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

      {/* Timeline History */}
      <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-xl space-y-3">
        <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/50 uppercase tracking-widest block text-left font-mono">Run Timeline History Log</span>
        <div className="space-y-2 select-text text-left text-[10px] font-mono">
          {(selectedRun.timeline || []).map((t: any, i: number) => (
            <div key={i} className="flex justify-between border-b border-white/5 py-1">
              <span className="text-[#D0D6BB]/60">{new Date(t.timestamp).toLocaleTimeString()}</span>
              <span className="font-bold text-white">{t.actor}</span>
              <span className="text-emerald-400">{t.action}</span>
              <span className="text-stone-500 shrink-0 max-w-[200px] truncate">{t.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step level negative feedback */}
      {selectedRun.status === 'completed' && (
        <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/50 uppercase tracking-widest block text-left">Helpfulness Rating System</span>
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
