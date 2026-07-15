/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface IntegrationSetupChecklistProps {
  checklist: string[];
}

export default function IntegrationSetupChecklist({ checklist }: IntegrationSetupChecklistProps) {
  if (!checklist || checklist.length === 0) return null;

  return (
    <div className="space-y-2 text-xs">
      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">
        Setup & Credentials Checklist
      </span>
      <div className="border border-border-soft rounded-xl bg-surface divide-y divide-border-soft overflow-hidden">
        {checklist.map((step, idx) => (
          <div key={idx} className="p-3 flex items-start gap-2.5 hover:bg-surface-subtle transition-colors">
            {idx === 0 ? (
              <CheckSquare className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
            )}
            <span className={`text-[11px] leading-relaxed ${idx === 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
