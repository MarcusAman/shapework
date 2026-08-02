import React from 'react';
import { AlertTriangle, RefreshCw, DollarSign, TrendingUp, Layers } from 'lucide-react';

export type PitchStep = 'pitch' | 'aha' | 'pricing' | 'retention' | 'architecture';

interface PitchDemoNavigationProps {
  activeStep: PitchStep;
  onSelectStep: (step: PitchStep) => void;
}

const STEPS: Array<{ id: PitchStep; label: string; icon: React.ElementType }> = [
  { id: 'pitch', label: '1. The Problem', icon: AlertTriangle },
  { id: 'aha', label: '2. Live Operating Loop', icon: RefreshCw },
  { id: 'pricing', label: '3. Commercial Model', icon: DollarSign },
  { id: 'retention', label: '4. Owner ROI', icon: TrendingUp },
  { id: 'architecture', label: '5. Platform', icon: Layers }
];

export default function PitchDemoNavigation({ activeStep, onSelectStep }: PitchDemoNavigationProps) {
  return (
    <nav className="w-full bg-[#F6F7F1] p-1.5 rounded-2xl border border-[#01362D]/10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {STEPS.map(step => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#01362D] text-white shadow-sm'
                  : 'text-[#01362D]/70 hover:text-[#01362D] hover:bg-[#EAECE1]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D0D6BB]' : 'text-[#00635C]'}`} />
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
