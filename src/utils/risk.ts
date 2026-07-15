/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types/shapework';

/**
 * Calculates the total revenue at risk across active transactions.
 */
export function getRevenueAtRisk(transactions: Transaction[]): number {
  if (!transactions || !Array.isArray(transactions)) return 0;
  return transactions
    .filter(t => t?.risk_level === 'at_risk' || t?.risk_level === 'blocked')
    .reduce((sum, t) => sum + (t?.revenue || 0), 0);
}

/**
 * Returns a CSS color class based on the risk level.
 */
export function getRiskColorClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'blocked':
      return 'text-status-atrisk font-bold';
    case 'at_risk':
      return 'text-status-attention font-bold';
    case 'warning':
      return 'text-status-attention font-semibold';
    case 'healthy':
      return 'text-brand-green font-semibold';
    default:
      return 'text-text-secondary';
  }
}
