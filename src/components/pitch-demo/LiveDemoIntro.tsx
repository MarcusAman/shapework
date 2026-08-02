import React, { useState } from 'react';
import { Phone, Copy, Check, Play } from 'lucide-react';

interface LiveDemoIntroProps {
  phoneNumber: string;
  onSimulate: () => void;
  onCopySuccess: () => void;
}

export default function LiveDemoIntro({ phoneNumber, onSimulate, onCopySuccess }: LiveDemoIntroProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber.replace(/[^+\d]/g, ''));
    setCopied(true);
    onCopySuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F7F1] border border-[#01362D]/10 rounded-full text-xs font-semibold text-[#00635C]">
            <span className="w-2 h-2 rounded-full bg-[#00635C]"></span>
            <span>Live Demonstration</span>
          </div>
          <h2 className="text-xl font-bold text-[#01362D] tracking-tight">
            Test the operating loop live
          </h2>
          <p className="text-xs sm:text-sm text-[#01362D]/70 leading-relaxed">
            Call, text, or choose a sample request. Shapework will understand the issue, find the responsible owner, and prepare the next action.
          </p>
        </div>

        {/* Clean Warm White Phone Card */}
        <div className="bg-[#F6F7F1] border border-[#01362D]/15 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#01362D] text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#01362D]/60 block">Call or text</span>
              <span className="text-base font-bold text-[#01362D] tracking-tight font-mono">{phoneNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-[#01362D]/10 sm:pl-4">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FFFDF8] text-[#01362D] rounded-xl text-xs font-medium border border-[#01362D]/15 transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00635C]" /> : <Copy className="w-3.5 h-3.5 text-[#01362D]/60" />}
              <span>{copied ? 'Copied' : 'Copy number'}</span>
            </button>

            <button
              onClick={onSimulate}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#00635C] hover:bg-[#01362D] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start sample</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
