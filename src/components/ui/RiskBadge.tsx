/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RiskBadgeProps {
  level: 'healthy' | 'watch' | 'at_risk' | 'blocked';
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const getStyles = () => {
    switch (level) {
      case 'healthy':
        return 'bg-status-healthy-soft text-status-healthy border-status-healthy/10';
      case 'watch':
        return 'bg-status-attention-soft text-status-attention border-status-attention/15';
      case 'at_risk':
        return 'bg-status-atrisk-soft text-status-atrisk border-status-atrisk/15';
      case 'blocked':
        return 'bg-status-atrisk text-white border-transparent';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getLabel = () => {
    switch (level) {
      case 'at_risk':
        return 'At Risk';
      default:
        return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border tracking-wide select-none capitalize ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
