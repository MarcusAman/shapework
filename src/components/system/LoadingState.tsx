/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingStateProps {
  rows?: number;
  compact?: boolean;
}

export default function LoadingState({ rows = 3, compact = false }: LoadingStateProps) {
  return (
    <div className="w-full space-y-4 py-4 font-sans text-left">
      {Array.from({ length: rows }).map((_, idx) => (
        <div 
          key={idx} 
          className={`bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3 animate-pulse ${
            compact ? 'py-3' : 'py-5'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-stone-100 rounded-md w-1/3" />
            <div className="h-3 bg-stone-100 rounded-md w-12" />
          </div>
          <div className="h-3 bg-stone-100 rounded-md w-5/6" />
          {!compact && (
            <div className="flex gap-2 pt-1">
              <div className="h-6 bg-stone-100 rounded-lg w-20" />
              <div className="h-6 bg-stone-100 rounded-lg w-16" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
