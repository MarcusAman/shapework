/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { safeLower } from '../../utils/string';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStyles = () => {
    switch (safeLower(status)) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'healthy':
        return 'bg-status-healthy-soft text-status-healthy border-status-healthy/10';
      case 'preparing':
      case 'pending':
      case 'suggested':
      case 'awaiting_approval':
      case 'watch':
        return 'bg-status-attention-soft text-status-attention border-status-attention/10';
      case 'blocked':
      case 'at_risk':
      case 'overdue':
      case 'rejected':
      case 'failed':
        return 'bg-status-atrisk-soft text-status-atrisk border-status-atrisk/10';
      case 'draft':
      case 'archived':
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200/55';
    }
  };

  const formatText = () => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border capitalize tracking-wide select-none ${getStyles()}`}>
      {formatText()}
    </span>
  );
}
