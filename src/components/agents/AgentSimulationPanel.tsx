/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Zap, AlertCircle, RefreshCw } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  desc: string;
  agent: string;
}

interface AgentSimulationPanelProps {
  onTriggerSimulation: (id: string) => void;
}

export default function AgentSimulationPanel({ onTriggerSimulation }: AgentSimulationPanelProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const scenarios: Scenario[] = [
    {
      id: 'sim_clear_to_close',
      name: 'Lender Clear to Close Email',
      desc: 'Simulate Apex Mortgage clear-to-close email for 102 Pine St. Auto-prompts transition to closing prep.',
      agent: 'Transaction Stage Agent'
    },
    {
      id: 'sim_low_confidence',
      name: 'Low-Confidence Agent Update Match',
      desc: 'Simulate ambiguous email update attachment from Randy Agent. Triggers manual decision-approval queue.',
      agent: 'Agent Support Agent'
    },
    {
      id: 'sim_docusign_fail',
      name: 'DocuSign API Sync Timeout',
      desc: 'Simulate webhook handshake fail. Flags stale integration connection and logs $400 estimated cost waste.',
      agent: 'Integration Health Agent'
    },
    {
      id: 'sim_listing_photos_blocked',
      name: 'Listing Launch Photo Block',
      desc: 'Simulate launch countdown in 48 hours for 104 Maple Ave with missing vendor photos. Blocks stage.',
      agent: 'Listing Launch Agent'
    },
    {
      id: 'sim_attorney_closing_change',
      name: 'Attorney Closing Date Move',
      desc: 'Simulate legal update email shifting closing date. Triggers closing risk sweep and alerts Sarah COO.',
      agent: 'Closing Risk Agent'
    },
    {
      id: 'sim_agent_support_load',
      name: 'Agent Support Overload Spike',
      desc: 'Simulate high-volume operational queries from Randy Agent. Recommends helper TC assignment.',
      agent: 'Agent Support Agent'
    },
    {
      id: 'sim_missing_compliance',
      name: 'Missing Buyer Agency Agreement',
      desc: 'Simulate contract signature scan without signed Buyer Agency disclosure. Triggers audit warning.',
      agent: 'Compliance Agent'
    },
    {
      id: 'sim_overnight_briefing',
      name: 'Overnight AI Briefing Sweep',
      desc: 'Run daily morning operations scan. Crawls active transaction files and constructs briefs.',
      agent: 'AI COO Orchestrator'
    }
  ];

  const handleRun = (id: string) => {
    setActiveScenario(id);
    setIsSimulating(true);
    onTriggerSimulation(id);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand-green" />
            <span>Agent Operations Simulator</span>
          </h4>
          <p className="text-[11px] text-text-secondary">Inject real-world signals to watch specialist agent cascade loops.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.id;
          return (
            <div
              key={sc.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-3 ${
                isActive && isSimulating
                  ? 'border-brand-green bg-brand-green-soft/30 shadow-md ring-1 ring-brand-green/20'
                  : 'border-border-subtle bg-secondary-surface hover:border-strong-border'
              }`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-text-primary leading-tight">{sc.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-[9px] font-mono text-text-tertiary">
                    {sc.agent}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed font-medium">{sc.desc}</p>
              </div>

              <button
                onClick={() => handleRun(sc.id)}
                disabled={isSimulating}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                {isActive && isSimulating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Executing Scenario...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Trigger Simulation</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
