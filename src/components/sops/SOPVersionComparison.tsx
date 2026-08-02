import React from 'react';
import { X, Check } from 'lucide-react';

interface VersionComparisonProps {
  versionA: any;
  versionB: any;
  onClose: () => void;
}

export default function SOPVersionComparison({ versionA, versionB, onClose }: VersionComparisonProps) {
  if (!versionA || !versionB) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#012a23] border border-white/15 rounded-3xl p-6 max-w-4xl w-full h-[85vh] flex flex-col justify-between shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div>
            <h3 className="font-serif font-black text-sm uppercase text-white tracking-wide">Version Comparison</h3>
            <p className="text-[10px] font-mono text-[#D0D6BB]/60">Comparing v{versionA.version} vs v{versionB.version}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg border border-white/10 text-stone-400 hover:text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto my-4 grid grid-cols-2 gap-6 pr-2">
          {/* Version A column */}
          <div className="space-y-4 text-xs text-left">
            <div className="p-4 bg-black/15 border border-white/5 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[8px] font-mono uppercase font-bold">Version {versionA.version}</span>
              <h4 className="font-serif font-black text-sm text-white">{versionA.title}</h4>
              <p className="text-[10px] text-[#D0D6BB]/70 font-sans italic">{versionA.purpose}</p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block font-bold">Ownership Roles</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/10 p-3 rounded-xl">
                <div>
                  <span className="text-[#D0D6BB]/50 block">Owner</span>
                  <span className="text-white font-medium">{versionA.ownerRole}</span>
                </div>
                <div>
                  <span className="text-[#D0D6BB]/50 block">Backup</span>
                  <span className="text-white font-medium">{versionA.backupRole || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block font-bold">Checklist Steps ({versionA.steps?.length || 0})</span>
              <div className="space-y-1.5">
                {(versionA.steps || []).map((step: any, idx: number) => (
                  <div key={step.id || idx} className="p-2.5 bg-black/15 border border-white/5 rounded-xl text-left">
                    <span className="font-mono text-[9px] text-[#D0D6BB]/45 block">STEP {idx + 1} - {step.type}</span>
                    <strong className="text-white text-[11px] block">{step.title}</strong>
                    <span className="text-[9px] text-[#D0D6BB]/60 font-sans leading-normal block mt-0.5">{step.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Version B column */}
          <div className="space-y-4 text-xs text-left">
            <div className="p-4 bg-black/15 border border-white/5 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[8px] font-mono uppercase font-bold">Version {versionB.version}</span>
              <h4 className="font-serif font-black text-sm text-white">{versionB.title}</h4>
              <p className="text-[10px] text-[#D0D6BB]/70 font-sans italic">{versionB.purpose}</p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block font-bold">Ownership Roles</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/10 p-3 rounded-xl">
                <div>
                  <span className="text-[#D0D6BB]/50 block">Owner</span>
                  <span className="text-white font-medium">{versionB.ownerRole}</span>
                </div>
                <div>
                  <span className="text-[#D0D6BB]/50 block">Backup</span>
                  <span className="text-white font-medium">{versionB.backupRole || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase text-[#D0D6BB]/40 block font-bold">Checklist Steps ({versionB.steps?.length || 0})</span>
              <div className="space-y-1.5">
                {(versionB.steps || []).map((step: any, idx: number) => {
                  const stepMatch = versionA.steps?.find((s: any) => s.id === step.id);
                  const isModified = stepMatch && (stepMatch.title !== step.title || stepMatch.instruction !== step.instruction);
                  const isNew = !stepMatch;

                  return (
                    <div 
                      key={step.id || idx} 
                      className={`p-2.5 border rounded-xl text-left ${
                        isNew ? 'bg-emerald-950/20 border-emerald-500/25' : (isModified ? 'bg-amber-950/20 border-amber-500/25' : 'bg-black/15 border-white/5')
                      }`}
                    >
                      <span className="font-mono text-[9px] text-[#D0D6BB]/45 block">
                        STEP {idx + 1} - {step.type} {isNew && '(NEW)'} {isModified && '(EDITED)'}
                      </span>
                      <strong className="text-white text-[11px] block">{step.title}</strong>
                      <span className="text-[9px] text-[#D0D6BB]/60 font-sans leading-normal block mt-0.5">{step.instruction}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
