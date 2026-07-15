/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface InsightPanelProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
  variant?: 'info' | 'warning' | 'success';
}

export default function InsightPanel({
  title,
  children,
  icon: Icon,
  variant = 'info'
}: InsightPanelProps) {
  const getStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-status-attention-soft/30 border-status-attention/20 text-text-primary';
      case 'success':
        return 'bg-brand-100/40 border-accent-green/20 text-brand-900';
      case 'info':
      default:
        return 'bg-brand-100/20 border-border-soft text-text-primary';
    }
  };

  return (
    <div className={`p-4 border rounded-2xl flex items-start gap-3 text-xs leading-relaxed ${getStyles()}`}>
      {Icon && (
        <div className="shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5" />
        </div>
      )}
      <div className="space-y-1">
        <span className="font-bold block">{title}</span>
        <div className="text-text-secondary text-[11px]">
          {children}
        </div>
      </div>
    </div>
  );
}
