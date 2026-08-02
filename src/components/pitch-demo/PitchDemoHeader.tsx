import React from 'react';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';

interface PitchDemoHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export default function PitchDemoHeader({ soundEnabled, onToggleSound, onClose }: PitchDemoHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#01362D]/10">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-serif italic text-[#00635C] font-bold">Shapework</span>
          <span className="text-[#01362D]/30">•</span>
          <span className="text-xs font-medium uppercase tracking-wider text-[#01362D]/60">Product Demonstration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#01362D] tracking-tight">
          Brokerage operating system
        </h1>
        <p className="text-sm text-[#01362D]/70 max-w-2xl leading-relaxed">
          See how a request moves from intake to ownership, action, and resolution without disrupting your team.
        </p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <button
          onClick={onToggleSound}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#F6F7F1] hover:bg-[#EAECE1] text-[#01362D] rounded-full text-xs font-medium border border-[#01362D]/15 transition-all cursor-pointer"
          title={soundEnabled ? 'Disable Audio Effects' : 'Enable Audio Effects'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00635C]" /> : <VolumeX className="w-4 h-4 text-[#01362D]/50" />}
          <span>Audio {soundEnabled ? 'On' : 'Off'}</span>
        </button>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-[#01362D] hover:bg-[#004d40] text-white rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to App</span>
        </button>
      </div>
    </header>
  );
}
