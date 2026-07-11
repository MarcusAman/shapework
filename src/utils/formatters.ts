/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as a currency string (e.g. 42800 -> "$42,800").
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formats a number as a string with commas (e.g. 1234567 -> "1,234,567").
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Formats a decimal number as a percentage string (e.g. 0.82 -> "82%").
 */
export function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  // If the value is > 1 (e.g., 82 instead of 0.82), we check and format accordingly.
  const percentage = value <= 1 && value > 0 ? value * 100 : value;
  return `${Math.round(percentage)}%`;
}
