/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical MetricTile & MetricGroup Primitives — Phase B3 Foundation
 * Restrained Apple-like productivity stat display with clear numeric hierarchy,
 * light surfaces, and semantic state decoupling.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricTileProps {
  value: React.ReactNode;
  label: string;
  sublabel?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'ai';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MetricTile({
  value,
  label,
  sublabel,
  trend,
  trendDirection,
  variant = 'default',
  icon,
  onClick,
  className = ''
}: MetricTileProps) {
  const isClickable = !!onClick;

  const getVariantIndicator = () => {
    switch (variant) {
      case 'success':
        return 'text-[var(--state-success)] bg-[var(--state-success-bg)]';
      case 'warning':
        return 'text-[var(--state-warning)] bg-[var(--state-warning-bg)]';
      case 'danger':
        return 'text-[var(--state-danger)] bg-[var(--state-danger-bg)]';
      case 'ai':
        return 'text-[var(--state-ai)] bg-[var(--state-ai-bg)]';
      case 'default':
      default:
        return 'text-[var(--sw-text-secondary)] bg-[var(--sw-canvas)]';
    }
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpRight className="w-3.5 h-3.5" />;
    if (trendDirection === 'down') return <ArrowDownRight className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-[var(--radius-md)] p-4 sm:p-5 shadow-[var(--sw-shadow-soft)] transition-all duration-150 flex flex-col justify-between text-left ${
        isClickable ? 'cursor-pointer hover:border-[var(--sw-border-strong)] hover:shadow-[var(--sw-shadow-raised)] active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-[var(--sw-text-secondary)]">{label}</span>
        {icon && (
          <div className={`p-2 rounded-[var(--radius-sm)] shrink-0 ${getVariantIndicator()}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 flex-wrap mt-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-[var(--sw-text-primary)] tracking-tight font-sans">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trendDirection === 'up'
                ? 'text-[var(--state-success)] bg-[var(--state-success-bg)]'
                : trendDirection === 'down'
                ? 'text-[var(--state-danger)] bg-[var(--state-danger-bg)]'
                : 'text-[var(--sw-text-secondary)] bg-[var(--sw-canvas)]'
            }`}
          >
            {getTrendIcon()}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {sublabel && (
        <p className="text-[11px] text-[var(--sw-text-secondary)] mt-2 font-normal">
          {sublabel}
        </p>
      )}
    </div>
  );
}

export interface MetricGroupProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGroup({ children, columns = 3, className = '' }: MetricGroupProps) {
  const getColClasses = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={`grid gap-4 ${getColClasses()} ${className}`}>
      {children}
    </div>
  );
}
