/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Skeleton & LoadingState Primitives — Phase B3 Foundation
 * Neutral loading geometry placeholders using Shapework core tokens
 * with reduced-motion support.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  className = ''
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-[var(--radius-md)]';
      case 'text':
      default:
        return 'rounded-[var(--radius-sm)]';
    }
  };

  return (
    <div
      style={{ width, height }}
      className={`bg-[var(--sw-canvas)] border border-[var(--sw-border)]/50 animate-pulse motion-reduce:animate-none ${getVariantClasses()} ${className}`}
      aria-hidden="true"
    />
  );
}

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading records...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-3 ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
      <p className="text-xs font-medium text-[var(--sw-text-secondary)]">{message}</p>
    </div>
  );
}
