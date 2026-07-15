/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonStateProps {
  rows?: number;
  className?: string;
}

export default function SkeletonState({ rows = 4, className = '' }: SkeletonStateProps) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 items-center">
          <div className="w-10 h-10 rounded-lg bg-border-soft shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2.5 bg-border-soft rounded w-2/5" />
            <div className="h-2 bg-border-soft rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
