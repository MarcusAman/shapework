/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info } from 'lucide-react';

export default function DemoDataNotice() {
  return (
    <div className="bg-surface border-b border-border-soft px-6 py-2.5 text-left font-sans select-none shrink-0 flex items-center justify-between gap-3 text-[11px] text-text-secondary leading-normal">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-brand-900 shrink-0" />
        <span className="font-medium">
          Synthetic data only · No production connections active.
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] uppercase tracking-wider bg-brand-100 text-brand-900 px-1.5 py-0.2 rounded font-semibold shrink-0 select-none">
          Sandbox Mode
        </span>
      </div>
    </div>
  );
}
