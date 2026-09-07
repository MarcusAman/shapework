/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical TextInput Primitive — Phase B1 Foundation
 * Light surface, accessible label association, focus ring, and error handling.
 */

import React, { useId } from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  onChange?: any;
  value?: any;
}

export default function TextInput({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  id,
  disabled,
  className = '',
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--sw-text-primary)] select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-[var(--state-danger)] font-bold ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[var(--sw-text-secondary)] pointer-events-none shrink-0">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full h-10 bg-[var(--sw-surface)] text-[var(--sw-text-primary)] placeholder-[var(--sw-text-muted)] text-xs font-medium rounded-[var(--radius-sm)] border transition-all outline-none ${
            icon ? 'pl-9 pr-3.5' : 'px-3.5'
          } ${
            error
              ? 'border-[var(--state-danger)] focus:ring-2 focus:ring-[var(--state-danger)]/30'
              : 'border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/30'
          } ${disabled ? 'opacity-45 cursor-not-allowed bg-[var(--sw-canvas)]' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-[var(--state-danger)] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--sw-text-secondary)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
