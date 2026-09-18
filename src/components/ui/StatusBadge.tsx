/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical StatusBadge Primitive — Phase B1 Foundation
 * Maps status strings to semantic state badges.
 */

import React from 'react';
import Badge from './Badge';
import { safeLower } from '../../utils/string';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, label, size = 'md', className = '' }: StatusBadgeProps) {
  const getVariant = (): 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral' => {
    switch (safeLower(status)) {
      case 'active':
      case 'completed':
      case 'approved':
      case 'healthy':
      case 'ready':
        return 'success';
      case 'preparing':
      case 'pending':
      case 'watch':
      case 'awaiting_approval':
        return 'warning';
      case 'blocked':
      case 'at_risk':
      case 'overdue':
      case 'rejected':
      case 'failed':
      case 'risk':
        return 'danger';
      case 'ai_suggested':
      case 'ai_generated':
      case 'suggested':
      case 'ai':
        return 'ai';
      case 'draft':
      case 'archived':
      default:
        return 'neutral';
    }
  };

  const formattedText = label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Badge variant={getVariant()} size={size} className={className}>
      {formattedText}
    </Badge>
  );
}
