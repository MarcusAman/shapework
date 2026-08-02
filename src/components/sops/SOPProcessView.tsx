import React from 'react';

interface SOPProcessViewProps {
  selectedSop: any;
}

export default function SOPProcessView({ selectedSop }: SOPProcessViewProps) {
  if (!selectedSop) return null;

  return (
    <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="border-b border-white/10 pb-4 text-left">
        <h3 className="font-serif font-black text-sm uppercase tracking-wider text-white">🌿 Process Flow Sequence Diagram</h3>
        <p className="text-[10px] text-[#D0D6BB]/50 font-mono mt-0.5">Visual checklist connector sequence</p>
      </div>

      <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-emerald-500/20 py-4 select-none">
        {selectedSop.steps.map((step: any, idx: number) => (
          <div key={idx} className="relative ml-16 bg-black/25 border border-white/5 p-4 rounded-3xl text-left space-y-1 hover:border-emerald-500/20 transition-all">
            <div className="absolute -left-16 top-4 w-6 h-6 rounded-full bg-[#00635C] border border-emerald-400/20 text-white flex items-center justify-center font-mono text-[10px] font-bold">
              {idx + 1}
            </div>
            
            <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase text-[#D0D6BB]">{step.type} Gate</span>
            <h4 className="font-serif font-bold text-xs text-white mt-1">{step.title}</h4>
            <p className="text-[10px] text-[#D0D6BB]/60 font-sans leading-relaxed">{step.instruction}</p>
            <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 pt-2">
              <span>Assigned to: <strong className="text-white font-normal">{step.assignedRole}</strong></span>
              <span>Duration: {step.expectedDuration || '1 hour'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
