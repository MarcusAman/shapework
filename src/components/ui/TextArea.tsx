/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical TextArea Primitive — Phase B1 Foundation
 * Multi-line input with light surface, focus ring, and accessibility semantics.
 */

import React, { useId } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  rows?: number;
  required?: boolean;
  onChange?: any;
  value?: any;
}

export default function TextArea({
  label,
  error,
  helperText,
  fullWidth = true,
  id,
  disabled,
  rows = 4,
  className = '',
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-[var(--sw-text-primary)] select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[var(--state-danger)] font-bold ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full bg-[var(--sw-surface)] text-[var(--sw-text-primary)] placeholder-[var(--sw-text-muted)] text-xs font-medium rounded-[var(--radius-sm)] p-3 border transition-all outline-none resize-y ${
          error
            ? 'border-[var(--state-danger)] focus:ring-2 focus:ring-[var(--state-danger)]/30'
            : 'border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/30'
        } ${disabled ? 'opacity-45 cursor-not-allowed bg-[var(--sw-canvas)]' : ''} ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-[11px] font-medium text-[var(--state-danger)] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--sw-text-secondary)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
