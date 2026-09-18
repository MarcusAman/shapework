/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Checkbox Primitive — Phase B1 Foundation
 * Accessible checkbox input with custom styled box and focus state.
 */

import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  className?: string;
}

export default function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  id,
  className = '',
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-start gap-2.5 select-none cursor-pointer group ${
        disabled ? 'opacity-45 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center shrink-0 mt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
            checked
              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-2xs'
              : 'bg-[var(--sw-surface)] border-[var(--sw-border-strong)] group-hover:border-[var(--brand-secondary)]'
          } peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-secondary)]/40`}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs font-semibold text-[var(--sw-text-primary)]">{label}</span>}
          {description && <span className="text-[11px] text-[var(--sw-text-secondary)]">{description}</span>}
        </div>
      )}
    </label>
  );
}
