/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ComponentType<any>;
}

export default function MetricCard({ label, value, subtext, trend, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border-soft p-4 rounded-xl shadow-soft flex flex-col justify-between hover:border-border-medium transition-all">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">{label}</span>
        {Icon && (
          <div className="text-text-tertiary">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5 space-y-1">
        <span className="text-lg font-bold text-text-primary tracking-tight font-mono">{value}</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          {trend && (
            <span className={`font-bold font-mono ${
              trend.direction === 'up' 
                ? 'text-accent-green' 
                : trend.direction === 'down' 
                ? 'text-accent-red' 
                : 'text-text-tertiary'
            }`}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-text-tertiary font-medium">{subtext}</span>
          )}
        </div>
      </div>
    </div>
  );
}
