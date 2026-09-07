/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Button Primitive — Phase B1 Foundation
 * Multi-tenant, accessible, state-aware button component.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  onClick?: any;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs rounded-[var(--radius-sm)] gap-1.5';
      case 'lg':
        return 'h-12 px-5 text-sm rounded-[var(--radius-md)] gap-2.5';
      case 'md':
      default:
        return 'h-10 px-4 text-xs rounded-[var(--radius-md)] gap-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white shadow-xs focus:ring-2 focus:ring-[var(--brand-secondary)]/40';
      case 'secondary':
        return 'bg-[var(--sw-surface)] hover:bg-[var(--sw-canvas)] text-[var(--sw-text-primary)] border border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] shadow-xs focus:ring-2 focus:ring-[var(--sw-border-strong)]';
      case 'tertiary':
        return 'bg-transparent hover:bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] focus:ring-2 focus:ring-[var(--sw-border)]';
      case 'danger':
        return 'bg-[var(--state-danger-bg)] hover:bg-red-100 text-[var(--state-danger)] border border-[var(--state-danger)]/20 focus:ring-2 focus:ring-[var(--state-danger)]/40';
    }
  };

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer outline-none active:scale-[0.98] ${
        isDisabled ? 'opacity-45 pointer-events-none' : ''
      } ${fullWidth ? 'w-full' : ''} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
