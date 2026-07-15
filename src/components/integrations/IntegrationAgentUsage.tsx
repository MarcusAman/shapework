/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu } from 'lucide-react';

interface IntegrationAgentUsageProps {
  agents: string[];
}

export default function IntegrationAgentUsage({ agents }: IntegrationAgentUsageProps) {
  if (agents.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-2 text-xs">
      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">
        Powers Specialist Agents
      </span>
      <div className="flex flex-wrap gap-1">
        {agents.map((agent, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-100 text-brand-900 border border-brand-900/5 text-[9px] font-mono font-medium"
          >
            <Cpu className="w-2.5 h-2.5" />
            <span>{agent}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
