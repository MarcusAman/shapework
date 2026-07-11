/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badgeCount?: number;
  actions?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, badgeCount, actions }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-4 pb-2 border-b border-border-soft/40">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">{title}</h3>
        {badgeCount !== undefined && (
          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-brand-100 text-brand-900 rounded-full font-mono select-none">
            {badgeCount}
          </span>
        )}
        {subtitle && (
          <span className="text-[10px] text-text-tertiary font-medium">| {subtitle}</span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
