import { describe, expect, it } from 'vitest';
import {
  ALLOWED_CUSTOMER_WORKBOARD_ROLES,
  isAllowedCustomerWorkboardRole,
} from '../utils/customerWorkboardRoles';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('workboard customer role allowlist (Melissa / marketing)', () => {
  it('includes marketing_director and marketing_coordinator', () => {
    expect(ALLOWED_CUSTOMER_WORKBOARD_ROLES).toContain('marketing_director');
    expect(ALLOWED_CUSTOMER_WORKBOARD_ROLES).toContain('marketing_coordinator');
  });

  it('isAllowedCustomerWorkboardRole allows Melissa marketing_director', () => {
    expect(isAllowedCustomerWorkboardRole('marketing_director')).toBe(true);
    expect(isAllowedCustomerWorkboardRole('marketing_coordinator')).toBe(true);
    expect(isAllowedCustomerWorkboardRole('Marketing_Director')).toBe(true);
  });

  it('still allows core roles and denies empty', () => {
    expect(isAllowedCustomerWorkboardRole('owner')).toBe(true);
    expect(isAllowedCustomerWorkboardRole('agent')).toBe(true);
    expect(isAllowedCustomerWorkboardRole('')).toBe(false);
    expect(isAllowedCustomerWorkboardRole(null)).toBe(false);
  });

  it('allows producer so Eduardo can open Tasks/workboard marketing drawer', () => {
    expect(ALLOWED_CUSTOMER_WORKBOARD_ROLES).toContain('producer');
    expect(isAllowedCustomerWorkboardRole('producer')).toBe(true);
  });

  it('WorkspaceConsole gate uses isAllowedCustomerRole / isAllowedCustomerWorkboardRole (no stale inline list)', () => {
    const src = readFileSync(
      resolve(__dirname, '../components/demo/WorkspaceConsole.tsx'),
      'utf8',
    );
    expect(src).toMatch(/isAllowedCustomer(Role|WorkboardRole)/);
    expect(src).not.toMatch(/const allowedCustomerRoles\s*=/);
  });
});
