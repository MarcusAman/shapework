import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
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
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 border border-dashed border-border-soft bg-stone-50/50 rounded-2xl text-center max-w-lg mx-auto space-y-4 my-6">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-brand-soft/20 flex items-center justify-center text-brand-primary shrink-0 select-none">
          <Icon className="w-5 h-5 text-brand-primary" />
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed font-medium max-w-sm">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 pt-2">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-border-soft bg-white hover:bg-stone-50 text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
