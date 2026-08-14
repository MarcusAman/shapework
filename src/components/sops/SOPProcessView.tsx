import React from 'react';

interface SOPProcessViewProps {
  selectedSop: any;
}

export default function SOPProcessView({ selectedSop }: SOPProcessViewProps) {
  if (!selectedSop) return null;

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
      <div className="border-b border-stone-200/80 pb-4 text-left">
        <h3 className="font-serif font-bold text-lg text-stone-900 tracking-wide">🌿 Process Flow Sequence Diagram</h3>
        <p className="text-xs text-stone-500 font-medium mt-0.5">Visual checklist connector sequence</p>
      </div>

      <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-emerald-200 py-2 select-none">
        {selectedSop.steps.map((step: any, idx: number) => (
          <div key={idx} className="relative ml-14 bg-stone-50 border border-stone-200/80 p-5 rounded-2xl text-left space-y-2 hover:bg-white transition-all shadow-sm">
            <div className="absolute -left-14 top-4 w-7 h-7 rounded-full bg-[#00635C] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {idx + 1}
            </div>
            
            <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase text-[#00635C] inline-block">
              {step.type} Gate
            </span>
            <h4 className="font-serif font-bold text-sm text-stone-900 mt-1">{step.title}</h4>
            <p className="text-xs text-stone-600 font-medium leading-relaxed">{step.instruction}</p>
            <div className="flex justify-between items-center text-xs font-medium text-stone-500 pt-2 border-t border-stone-200/60">
              <span>Assigned to: <strong className="text-stone-900 font-bold">{step.assignedRole}</strong></span>
              <span>Duration: {step.expectedDuration || '1 hour'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

