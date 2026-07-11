/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export default function EmptyState({
  title = "No records found",
  description = "There are no items matching this segment in the active Nest Realty workspace.",
  icon,
  actionButton
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle/80 rounded-2xl bg-stone-50/20 max-w-md mx-auto my-6 font-sans">
      <div className="w-12 h-12 rounded-xl bg-secondary-surface border border-border-subtle flex items-center justify-center text-text-tertiary shadow-sm mb-4">
        {icon || <Layers className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-bold text-text-primary leading-snug">{title}</h3>
      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed max-w-[280px]">
        {description}
      </p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  );
}
