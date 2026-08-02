import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';

interface OutcomeSummaryProps {
  summaryItems: string[];
  onNextScenario: () => void;
}

export default function OutcomeSummary({ summaryItems, onNextScenario }: OutcomeSummaryProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <div className="p-6 bg-[#EAECE1] border border-[#00635C]/30 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#01362D]/10 pb-3">
        <div className="flex items-center gap-2 text-[#01362D]">
          <CheckCircle2 className="w-5 h-5 text-[#00635C]" />
          <div>
            <h3 className="text-base font-bold">Request resolved</h3>
            <p className="text-xs text-[#01362D]/70">Business outcome achieved without operational friction</p>
          </div>
        </div>

        {/* Feedback Widget */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-[#01362D]/70 font-medium">Was this helpful?</span>
          <button
            onClick={() => setFeedback('up')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              feedback === 'up' ? 'bg-[#00635C] text-white border-[#00635C]' : 'bg-[#FFFDF8] text-[#01362D]/70 border-[#01362D]/15 hover:bg-white'
            }`}
            title="Yes, helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFeedback('down')}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              feedback === 'down' ? 'bg-rose-700 text-white border-rose-700' : 'bg-[#FFFDF8] text-[#01362D]/70 border-[#01362D]/15 hover:bg-white'
            }`}
            title="Needs improvement"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Outcome Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#01362D]">
        {summaryItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00635C] shrink-0"></span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNextScenario}
          className="flex items-center gap-2 px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <span>Try another scenario</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
