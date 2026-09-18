/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Badge Primitive — Phase B1 Foundation
 * Decouples workspace brand badges from semantic system state badges.
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'ai';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = ''
}: BadgeProps) {
  const getSizeClasses = () => {
    return size === 'sm'
      ? 'px-2 py-0.5 text-[9px] gap-1'
      : 'px-2.5 py-0.5 text-[10px] gap-1.5';
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'brand':
        return 'bg-[var(--brand-soft)] text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/20';
      case 'success':
        return 'bg-[var(--state-success-bg)] text-[var(--state-success)] border border-[var(--state-success)]/20';
      case 'warning':
        return 'bg-[var(--state-warning-bg)] text-[var(--state-warning)] border border-[var(--state-warning)]/20';
      case 'danger':
        return 'bg-[var(--state-danger-bg)] text-[var(--state-danger)] border border-[var(--state-danger)]/20';
      case 'info':
        return 'bg-[var(--state-info-bg)] text-[var(--state-info)] border border-[var(--state-info)]/20';
      case 'ai':
        return 'bg-[var(--state-ai-bg)] text-[var(--state-ai)] border border-[var(--state-ai)]/20';
      case 'neutral':
      default:
        return 'bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] border border-[var(--sw-border)]';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-mono uppercase tracking-wider rounded-full border select-none whitespace-nowrap ${getSizeClasses()} ${getVariantClasses()} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
