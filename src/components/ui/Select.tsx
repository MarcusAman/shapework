/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Select Primitive — Phase B1 Foundation
 * Styled dropdown select control with custom chevron and accessibility semantics.
 */

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: any;
  value?: any;
}

export default function Select({
  label,
  options,
  error,
  helperText,
  fullWidth = true,
  id,
  disabled,
  className = '',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-[var(--sw-text-primary)] select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[var(--state-danger)] font-bold ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full h-10 bg-[var(--sw-surface)] text-[var(--sw-text-primary)] text-xs font-medium rounded-[var(--radius-sm)] pl-3.5 pr-9 border appearance-none transition-all outline-none cursor-pointer ${
            error
              ? 'border-[var(--state-danger)] focus:ring-2 focus:ring-[var(--state-danger)]/30'
              : 'border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/30'
          } ${disabled ? 'opacity-45 cursor-not-allowed bg-[var(--sw-canvas)]' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 text-[var(--sw-text-secondary)] pointer-events-none shrink-0" />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-[var(--state-danger)] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--sw-text-secondary)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
