/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical IconButton Primitive — Phase B1 Foundation
 * Accessible, square/circular icon button with mandatory aria-label.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label'?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: any;
}

export default function IconButton({
  icon,
  'aria-label': ariaLabel,
  variant = 'secondary',
  size = 'md',
  shape = 'square',
  loading = false,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const isDisabled = disabled || loading;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'lg':
        return 'w-12 h-12 text-base';
      case 'md':
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white shadow-xs focus:ring-2 focus:ring-[var(--brand-secondary)]/40';
      case 'secondary':
        return 'bg-[var(--sw-surface)] hover:bg-[var(--sw-canvas)] text-[var(--sw-text-primary)] border border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] shadow-xs focus:ring-2 focus:ring-[var(--sw-border-strong)]';
      case 'ghost':
        return 'bg-transparent hover:bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] focus:ring-2 focus:ring-[var(--sw-border)]';
      case 'danger':
        return 'bg-[var(--state-danger-bg)] hover:bg-red-100 text-[var(--state-danger)] border border-[var(--state-danger)]/20 focus:ring-2 focus:ring-[var(--state-danger)]/40';
    }
  };

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer outline-none active:scale-95 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-sm)]'
      } ${isDisabled ? 'opacity-45 pointer-events-none' : ''} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
    </button>
  );
}
