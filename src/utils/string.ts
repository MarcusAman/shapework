/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const safeString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const safeLower = (value: unknown): string => {
  return safeString(value).toLowerCase();
};

export const safeUpper = (value: unknown): string => {
  return safeString(value).toUpperCase();
};

export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const safeText = (value: unknown, fallback = "—"): string =>
  value === null || value === undefined || value === "" ? fallback : String(value);

export const safeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};
