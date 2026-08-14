/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical EmptyState Primitive — Phase B1 Foundation
 * Clean empty state container with icon, typography, and call to action buttons.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 border border-dashed border-[var(--sw-border)] bg-[var(--sw-canvas)] rounded-[var(--radius-lg)] text-center max-w-lg mx-auto space-y-4 my-6 ${className}`}>
      {Icon && (
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-soft)] flex items-center justify-center text-[var(--brand-primary)] shrink-0 select-none">
          <Icon className="w-5 h-5 text-[var(--brand-primary)]" />
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[var(--sw-text-primary)] tracking-tight font-sans">{title}</h4>
        <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed font-normal max-w-sm">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 pt-2">
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
