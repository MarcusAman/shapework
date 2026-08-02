import React from 'react';
import { FileText, Camera, Key, Wrench, ChevronRight } from 'lucide-react';

export type ScenarioId = 'disclosure' | 'emd' | 'camera' | 'repair';

interface ScenarioItem {
  id: ScenarioId;
  title: string;
  preview: string;
  icon: React.ElementType;
}

const SCENARIOS: ScenarioItem[] = [
  {
    id: 'disclosure',
    title: 'Lead paint disclosure',
    preview: 'Agent needs signed Lead-Based Paint Disclosure PDF sent via SMS at a walkthrough.',
    icon: FileText
  },
  {
    id: 'emd',
    title: 'Earnest-money deposit',
    preview: 'Agent submits a $5,000 deposit check photo for escrow logging.',
    icon: Camera
  },
  {
    id: 'camera',
    title: 'Lockbox access',
    preview: 'Storage sensor detects Lockbox checkout for an active listing.',
    icon: Key
  },
  {
    id: 'repair',
    title: 'Emergency repair',
    preview: 'Agent requests urgent plumbing dispatch following a buyer inspection leak.',
    icon: Wrench
  }
];

interface ScenarioSelectorProps {
  selectedScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
}

export default function ScenarioSelector({ selectedScenario, onSelectScenario }: ScenarioSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#01362D]/60">
          Sample scenarios
        </h3>
        <span className="text-xs text-[#01362D]/50">Click any card to test the loop</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {SCENARIOS.map(item => {
          const Icon = item.icon;
          const isSelected = selectedScenario === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectScenario(item.id)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-[#EAECE1] border-[#00635C] text-[#01362D] shadow-xs ring-1 ring-[#00635C]/30'
                  : 'bg-[#FFFDF8] border-[#01362D]/15 text-[#01362D]/80 hover:bg-[#F6F7F1] hover:border-[#01362D]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-[#00635C] text-white' : 'bg-[#F6F7F1] text-[#00635C] border border-[#01362D]/10'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-[#01362D]">{item.title}</span>
              </div>

              <p className="text-xs text-[#01362D]/70 leading-relaxed line-clamp-2">
                {item.preview}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs font-semibold text-[#00635C]">
                <span>Run scenario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
