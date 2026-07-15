/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function SurfaceCard({ children, className = '', onClick }: SurfaceCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border-soft rounded-2xl p-5 shadow-soft hover:border-border-medium transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-[1px]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
