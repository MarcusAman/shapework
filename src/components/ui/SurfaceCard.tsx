/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Card / SurfaceCard Primitive — Phase B1 Foundation
 * Restrained Apple-like productivity surface consuming Layer 1 Core UI tokens.
 */

import React from 'react';

export interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export default function SurfaceCard({
  children,
  className = '',
  elevated = false,
  interactive = false,
  onClick
}: SurfaceCardProps) {
  const isClickable = interactive || !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-[var(--radius-md)] p-5 transition-all duration-150 text-[var(--sw-text-primary)] ${
        elevated ? 'shadow-[var(--sw-shadow-raised)]' : 'shadow-[var(--sw-shadow-soft)]'
      } ${
        isClickable
          ? 'cursor-pointer hover:border-[var(--sw-border-strong)] hover:shadow-[var(--sw-shadow-raised)] active:scale-[0.99]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Canonical Card Alias
export { SurfaceCard as Card };
