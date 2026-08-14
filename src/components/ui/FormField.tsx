/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Form Composition System — Phase B2 Foundation
 * FormField, FormGroup, FieldLabel, FieldDescription, FieldError primitives.
 * Automatically manages accessible ID association, descriptions, and aria-invalid error states.
 */

import React, { useId, createContext, useContext } from 'react';

interface FormFieldContextValue {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
  required?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField component');
  }
  return context;
}

export interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ children, error, required = false, className = '' }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = `form-field-${generatedId}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const hasError = !!error;

  return (
    <FormFieldContext.Provider value={{ fieldId, descriptionId, errorId, hasError, required }}>
      <div className={`flex flex-col gap-1.5 w-full text-left ${className}`}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

export interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function FormGroup({ children, title, description, className = '' }: FormGroupProps) {
  return (
    <div className={`space-y-4 text-left ${className}`}>
      {(title || description) && (
        <div className="border-b border-[var(--sw-border)] pb-2 mb-3 space-y-0.5">
          {title && <h4 className="text-sm font-bold text-[var(--sw-text-primary)]">{title}</h4>}
          {description && <p className="text-xs text-[var(--sw-text-secondary)]">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function FieldLabel({ children, className = '' }: FieldLabelProps) {
  const { fieldId, required } = useFormField();

  return (
    <label
      htmlFor={fieldId}
      className={`text-xs font-semibold text-[var(--sw-text-primary)] select-none inline-flex items-center gap-1 ${className}`}
    >
      <span>{children}</span>
      {required && <span className="text-[var(--state-danger)] font-bold">*</span>}
    </label>
  );
}

export interface FieldDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function FieldDescription({ children, className = '' }: FieldDescriptionProps) {
  const { descriptionId } = useFormField();

  return (
    <p id={descriptionId} className={`text-[11px] text-[var(--sw-text-secondary)] mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export interface FieldErrorProps {
  children?: React.ReactNode;
  className?: string;
}

export function FieldError({ children, className = '' }: FieldErrorProps) {
  const { errorId, hasError } = useFormField();

  if (!hasError && !children) return null;

  return (
    <p id={errorId} role="alert" className={`text-[11px] font-medium text-[var(--state-danger)] mt-0.5 ${className}`}>
      {children}
    </p>
  );
}
