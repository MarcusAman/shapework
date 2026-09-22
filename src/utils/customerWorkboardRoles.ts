/**
 * Customer workboard (/app/workboard) role allowlist.
 * Gate: WorkspaceConsole — rejects with 403 Restricted Access when role missing.
 * Melissa Gagliardi uses marketing_director; coordinators use marketing_coordinator.
 */
export const ALLOWED_CUSTOMER_WORKBOARD_ROLES: readonly string[] = [
  'owner',
  'admin',
  'broker',
  'agent',
  'operations_manager',
  'transaction_coordinator',
  'compliance_officer',
  'staff',
  'guest',
  'marketing_coordinator',
  'marketing_director',
] as const;

export function isAllowedCustomerWorkboardRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return ALLOWED_CUSTOMER_WORKBOARD_ROLES.includes(String(role).trim().toLowerCase());
}

/** Marketing ops roles that should land on Tasks/Calls, not Ask Nora. */
export function isMarketingOpsRole(role: string | undefined | null): boolean {
  const n = String(role || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
  return n === 'marketing_director' || n === 'marketing_coordinator';
}

