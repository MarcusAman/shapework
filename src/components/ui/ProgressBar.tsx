/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical ProgressBar Primitive — Phase B3 Foundation
 * Accessible capacity & progress bar supporting ARIA values and semantic threshold states.
 */

import React, { useId } from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  min = 0,
  label,
  showPercentage = true,
  variant,
  size = 'md',
  className = ''
}: ProgressBarProps) {
  const labelId = useId();
  const percentage = Math.min(Math.max(Math.round(((value - min) / (max - min)) * 100), 0), 100);

  // Auto-detect warning/danger threshold if variant not explicitly provided
  const resolvedVariant = variant || (percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'brand');

  const getBarColorClasses = () => {
    switch (resolvedVariant) {
      case 'success':
        return 'bg-[var(--state-success)]';
      case 'warning':
        return 'bg-[var(--state-warning)]';
      case 'danger':
        return 'bg-[var(--state-danger)]';
      case 'brand':
        return 'bg-[var(--brand-primary)]';
      case 'default':
      default:
        return 'bg-[var(--sw-text-primary)]';
    }
  };

  const getHeightClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      case 'md':
      default:
        return 'h-2';
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left select-none ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--sw-text-primary)]">
          {label && <span id={labelId}>{label}</span>}
          {showPercentage && (
            <span className="font-mono font-bold text-[11px] text-[var(--sw-text-secondary)]">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className={`w-full bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-full overflow-hidden ${getHeightClasses()}`}
      >
        <div
          style={{ width: `${percentage}%` }}
          className={`h-full transition-all duration-300 rounded-full ${getBarColorClasses()}`}
        />
      </div>
    </div>
  );
}
