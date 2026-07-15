/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, ShieldCheck, Cpu, Database, FileText } from 'lucide-react';
import MissionStepCard from './MissionStepCard';
import MissionImpactPanel from './MissionImpactPanel';

interface PlaybackStep {
  stepNumber: number;
  title: string;
  agent: string;
  system: 'gmail' | 'rechat' | 'docusign' | 'gdrive' | 'system';
  description: string;
  details: string;
  evidence?: string;
  confidence?: number;
  policy?: string;
  changeDescription?: string;
  auditId?: string;
}

const playbackSteps: PlaybackStep[] = [
  {
    stepNumber: 1,
    title: "Email Ingestion",
    agent: "Email Triage Agent",
    system: "gmail",
    description: "Inbound correspondence detected on Apex Mortgage channels.",
    details: "Triage scanner syncs mail stream and identifies new lender-inbox message. Subject: 'Pine Street Clear to Close Updates'.",
    evidence: "From: loan-officer@apexmortgage.com\nBody: 'Underwriting approved clear to close on Pine Street. Scheduling closing session.'",
    confidence: 0.98
  },
  {
    stepNumber: 2,
    title: "Sender Identity Audit",
    agent: "Email Triage Agent",
    system: "rechat",
    description: "Sender matched to verified mortgage coordinator contact record.",
    details: "Audit lookup scans contacts database and maps loan-officer@apexmortgage.com to active lender entity 'Apex Mortgage Corp'.",
    confidence: 1.0
  },
  {
    stepNumber: 3,
    title: "Property Reference Matching",
    agent: "Email Triage Agent",
    system: "rechat",
    description: "Address entity matched to active transaction.",
    details: "Checks name strings and resolves 'Pine Street' to transaction file '102 Pine Street' (Escrow ID: tx_102).",
    confidence: 0.96
  },
  {
    stepNumber: 4,
    title: "Milestone Stage Inference",
    agent: "Transaction Stage Agent",
    system: "system",
    description: "Milestone change proposed: Underwriting → Closing Prep.",
    details: "Analyzes intent classification matrices. Underwriting approved clear-to-close email signals that all loan contingencies are satisfied.",
    confidence: 0.94,
    changeDescription: "Proposed Stage update: Under Contract → Closing Prep"
  },
  {
    stepNumber: 5,
    title: "Governance Safeguards Check",
    agent: "AI COO Orchestrator",
    system: "system",
    description: "Automation policy allows stage transition without manual approval.",
    details: "Evaluates brokerage safeguards: Rule #4 permits stage changes automatically when matching confidence is above 90%.",
    policy: "Milestone Auto-Sync Policy (>90% confidence)"
  },
  {
    stepNumber: 6,
    title: "Work Prepared & Gated",
    agent: "Follow-Up Drafting Agent",
    system: "gmail",
    description: "Internal update executed. External drafts placed in Approval Center.",
    details: "Drafts client update email notification. External message is Gated by policy for coordinator approval, preventing unverified outgoing messages.",
    policy: "Client-Facing Message Safeguard Policy",
    changeDescription: "Gated draft email created: 'Closing details notice to buyer Alice'"
  },
  {
    stepNumber: 7,
    title: "Closing Risk Re-calculation",
    agent: "Closing Risk Agent",
    system: "system",
    description: "Projected revenue risk updated. Risk status set to Healthy.",
    details: "De-escalates transaction threat levels. Cleared underwriting satisfies the closing contingency, securing $11,200 closing commissions.",
    changeDescription: "Revenue at Risk: -$11,200 (Risk updated to Healthy)"
  },
  {
    stepNumber: 8,
    title: "Immutable Ledger Logging",
    agent: "Audit Agent",
    system: "system",
    description: "Audit ledger entry recorded with evidence hashes.",
    details: "Commit actions to ledger. Saved before/after stages, trigger email raw string, and policy override flags.",
    auditId: "aud_stage_update_pine_st"
  }
];

export default function MissionPlayback() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTimer, setPlaybackTimer] = useState<NodeJS.Timeout | null>(null);

  const activeStep = playbackSteps[currentStepIdx];
  const progressPercent = ((currentStepIdx + 1) / playbackSteps.length) * 100;

  const handleNext = () => {
    if (currentStepIdx < playbackSteps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Fast playback simulation for demo
      handleNext();
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm space-y-6 text-left font-sans">
      
      {/* Replay Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block font-mono">Autopilot Replay Engine</span>
          <h3 className="font-serif font-bold text-base text-text-primary mt-1">Clear to Close Autopilot Simulation</h3>
          <p className="text-[11px] text-text-secondary mt-0.5">Traces how shapework processes an underwriting approval into stage transitions and risk reductions.</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Autopilot'}</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentStepIdx === playbackSteps.length - 1}
            className="flex items-center gap-1 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary disabled:opacity-50 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary p-2 rounded-xl transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
          <span>Step {activeStep.stepNumber} of {playbackSteps.length}: {activeStep.title}</span>
          <span>{Math.round(progressPercent)}% Done</span>
        </div>
        <div className="w-full bg-secondary-surface h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-brand-green h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid: Details on Left, Impact on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step details card */}
        <div className="lg:col-span-2">
          <MissionStepCard step={activeStep} />
        </div>

        {/* Live operational impact panel */}
        <div className="lg:col-span-1">
          <MissionImpactPanel currentStep={activeStep.stepNumber} />
        </div>

      </div>

    </div>
  );
}
