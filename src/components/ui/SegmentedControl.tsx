/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical SegmentedControl Primitive — Phase B1 Foundation
 * Compact mutually exclusive view switcher with Apple-like elevation active state.
 */

import React from 'react';

export interface SegmentOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  className = ''
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center p-1 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-md)] select-none ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        const isDisabled = !!opt.disabled;

        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt.id)}
            className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 rounded-[var(--radius-sm)] outline-none cursor-pointer ${
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            } ${
              isDisabled
                ? 'opacity-40 cursor-not-allowed text-[var(--sw-text-muted)]'
                : isActive
                ? 'bg-[var(--sw-surface)] text-[var(--sw-text-primary)] shadow-xs font-bold border border-[var(--sw-border)]'
                : 'text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] border border-transparent'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
