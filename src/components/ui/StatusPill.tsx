/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { safeLower } from '../../utils/string';

interface StatusPillProps {
  status: string;
}

export default function StatusPill({ status }: StatusPillProps) {
  const getStyles = () => {
    switch (safeLower(status)) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'healthy':
      case 'connected_demo':
      case 'connected':
        return 'bg-brand-100 text-accent-green border-accent-green/10';
      case 'preparing':
      case 'pending':
      case 'suggested':
      case 'awaiting_approval':
      case 'oauth_ready':
      case 'api_key_ready':
      case 'webhook_ready':
      case 'watch':
        return 'bg-status-attention-soft text-status-attention border-status-attention/10';
      case 'error':
      case 'failed':
      case 'blocked':
      case 'at_risk':
      case 'rejected':
        return 'bg-status-atrisk-soft text-accent-red border-status-atrisk/10';
      default:
        return 'bg-secondary-surface text-text-secondary border-border-soft';
    }
  };

  return (
    <span className={`inline-block px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider select-none font-mono ${getStyles()}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
