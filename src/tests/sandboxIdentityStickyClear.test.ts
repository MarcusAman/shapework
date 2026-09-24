/**
 * Harness: sandbox identity sticky clear + switcher dedupe + workboard role gate.
 * LOCAL DEV only — proves Melissa password login wins over Matt sticky overlay.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  clearSandboxIdentity,
  clearSandboxIdentityForPasswordLogin,
  isAllowedCustomerRole,
  uniqueProfilesByEmail,
  ALLOWED_CUSTOMER_ROLES,
  DENIED_CUSTOMER_ROLES,
  SANDBOX_IDENTITY_STORAGE_KEYS,
} from '../utils/sandboxIdentity';

const ROOT = join(__dirname, '../..');

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

describe('sandboxIdentity — clear sticky store', () => {
  let store: Record<string, string>;
  let sessionStore: Record<string, string>;

  beforeEach(() => {
    store = {
      shapework_session_token: 'matt.orr@nestrealty.com',
      shapework_active_profile_id: 'usr_matt_full',
      shapework_active_user_email: 'matt.orr@nestrealty.com',
      shapework_demo_access: '1',
      token: 'usr_matt_full',
    };
    sessionStore = { shapework_demo_access: '1' };

    const ls = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    const ss = {
      getItem: (k: string) => (k in sessionStore ? sessionStore[k] : null),
      setItem: (k: string, v: string) => {
        sessionStore[k] = String(v);
      },
      removeItem: (k: string) => {
        delete sessionStore[k];
      },
    };

    vi.stubGlobal('window', { localStorage: ls, sessionStorage: ss });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clearSandboxIdentity removes sticky keys and sets shapework_logged_out', () => {
    clearSandboxIdentity();
    for (const key of SANDBOX_IDENTITY_STORAGE_KEYS) {
      expect(store[key], `expected ${key} cleared`).toBeUndefined();
    }
    expect(sessionStore.shapework_logged_out).toBe('true');
    expect(sessionStore.shapework_demo_access).toBeUndefined();
  });

  it('clearSandboxIdentityForPasswordLogin clears sticky without leaving logged_out flag', () => {
    sessionStore.shapework_logged_out = 'true';
    clearSandboxIdentityForPasswordLogin();
    expect(store.shapework_session_token).toBeUndefined();
    expect(store.shapework_active_profile_id).toBeUndefined();
    expect(sessionStore.shapework_logged_out).toBeUndefined();
  });

  it('Return-to-Login path in WorkspaceConsole invokes clearSandboxIdentity', () => {
    const src = readSrc('src/components/demo/WorkspaceConsole.tsx');
    expect(src).toMatch(/clearSandboxIdentity/);
    expect(src).not.toMatch(/onClick=\{\(\)\s*=>\s*\{\s*window\.location\.pathname\s*=\s*'\/login';\s*\}\}/);
  });

  it('PublicLogin clears sandbox identity on password login success', () => {
    const src = readSrc('src/components/public/PublicLogin.tsx');
    expect(src).toMatch(/clearSandboxIdentityForPasswordLogin|clearSandboxIdentity/);
  });
});

describe('sandboxIdentity — uniqueProfilesByEmail (switcher)', () => {
  it('dedupes multiple seed rows per person by email (keep first)', () => {
    const profiles = [
      { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus', role: 'admin' },
      { id: 'usr_marcus_nest', email: 'marcus@nestrealty.com', name: 'Marcus Aman', role: 'admin' },
      { id: 'usr_melissa_mg', email: 'mg@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_director' },
      { id: 'usr_melissa', email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_director' },
      { id: 'usr_melissa_full', email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_director' },
      { id: 'usr_melissa_dup', email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator' },
      { id: 'usr_matt_full', email: 'matt.orr@nestrealty.com', name: 'Matt Orr', role: 'agent' },
      { id: 'usr_matt_nest', email: 'matt@nestrealty.com', name: 'Matt Orr', role: 'agent' },
      { id: 'usr_matt_dup', email: 'matt.orr@nestrealty.com', name: 'Matt Orr', role: 'bic' },
      { id: 'usr_eric', email: 'eric@nestrealty.com', name: 'Eric Knight', role: 'bic' },
      { id: 'usr_eric_full', email: 'eric.knight@nestrealty.com', name: 'Eric Knight', role: 'bic' },
      { id: 'usr_ann', email: 'ann@nestrealty.com', name: 'Ann Gunn', role: 'operations_lead' },
      { id: 'usr_james', email: 'james@nestrealty.com', name: 'James Fort', role: 'transaction_coordinator' },
      { id: 'usr_eduardo', email: 'eduardo@nestrealty.com', name: 'Eduardo Lovo', role: 'producer' },
    ];

    const unique = uniqueProfilesByEmail(profiles);
    const emails = unique.map((p) => p.email!.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
    // Same-email dupes collapsed
    expect(emails.filter((e) => e === 'melissa.gagliardi@nestrealty.com')).toHaveLength(1);
    expect(emails.filter((e) => e === 'matt.orr@nestrealty.com')).toHaveLength(1);
    // First Melissa full kept as marketing_director
    expect(unique.find((p) => p.email === 'melissa.gagliardi@nestrealty.com')?.role).toBe('marketing_director');
    // First Matt kept as agent (not dup bic)
    expect(unique.find((p) => p.email === 'matt.orr@nestrealty.com')?.role).toBe('agent');
  });

  it('WorkspaceConsole switcher maps uniqueProfilesByEmail(profiles)', () => {
    const src = readSrc('src/components/demo/WorkspaceConsole.tsx');
    expect(src).toMatch(/uniqueProfilesByEmail/);
  });
});

describe('sandboxIdentity — allowedCustomerRoles workboard gate', () => {
  it('marketing_director and marketing_coordinator are allowed (Melissa → 200)', () => {
    expect(isAllowedCustomerRole('marketing_director')).toBe(true);
    expect(isAllowedCustomerRole('marketing_coordinator')).toBe(true);
    expect(ALLOWED_CUSTOMER_ROLES).toContain('marketing_director');
    expect(ALLOWED_CUSTOMER_ROLES).toContain('marketing_coordinator');
  });

  it('bic is denied (Matt/bic or Eric → 403)', () => {
    expect(isAllowedCustomerRole('bic')).toBe(false);
  });

  it('WorkspaceConsole uses isAllowedCustomerRole / ALLOWED_CUSTOMER_ROLES including marketing_director', () => {
    const src = readSrc('src/components/demo/WorkspaceConsole.tsx');
    expect(src).toMatch(/isAllowedCustomerRole/);
    const util = readSrc('src/utils/sandboxIdentity.ts');
    expect(util).toMatch(/marketing_director/);
    expect(util).toMatch(/marketing_coordinator/);
  });

  it('Melissa password-login session role maps to allowed workboard', () => {
    // Simulate post-login session user after sticky clear
    const melissaSession = {
      id: 'usr_melissa_full',
      email: 'melissa.gagliardi@nestrealty.com',
      name: 'Melissa Gagliardi',
      role: 'marketing_director',
    };
    expect(isAllowedCustomerRole(melissaSession.role)).toBe(true);
  });

  it('Matt sticky overlay identity with bic is denied', () => {
    const mattSticky = {
      id: 'usr_matt_full',
      email: 'matt.orr@nestrealty.com',
      name: 'Matt Orr',
      role: 'bic',
    };
    expect(isAllowedCustomerRole(mattSticky.role)).toBe(false);
  });
});

describe('sandboxIdentity — Feature Lab Melissa role seed', () => {
  it('SEEDED_USERS Melissa variants are marketing_director (Nest title)', () => {
    const src = readSrc('server/auth/auth.ts');
    // All three Melissa seed rows should be marketing_director after fix
    const melissaLines = src
      .split('\n')
      .filter((l) => /melissa\.gagliardi@nestrealty\.com|email: 'melissa@nestrealty\.com'|email: 'mg@nestrealty\.com'/.test(l));
    expect(melissaLines.length).toBeGreaterThanOrEqual(1);
    // Role on those objects (same line or nearby) — assert file-level
    expect(src).toMatch(/email: 'melissa\.gagliardi@nestrealty\.com',\s*name: 'Melissa Gagliardi',\s*role: 'marketing_director'/);
    expect(src).toMatch(/email: 'melissa@nestrealty\.com',\s*name: 'Melissa Gagliardi',\s*role: 'marketing_director'/);
    expect(src).toMatch(/email: 'mg@nestrealty\.com',\s*name: 'Melissa Gagliardi',\s*role: 'marketing_director'/);
  });
});


describe("workboard role allowlist", () => {
  it("allows marketing_director and marketing_coordinator", () => {
    expect(isAllowedCustomerRole("marketing_director")).toBe(true);
    expect(isAllowedCustomerRole("Marketing Director")).toBe(true);
    expect(isAllowedCustomerRole("marketing_coordinator")).toBe(true);
  });
  it("denies bic", () => {
    expect(isAllowedCustomerRole("bic")).toBe(false);
  });
  it("allows producer (Eduardo) on marketing tasks workboard — drawer/upload/submit", () => {
    expect(isAllowedCustomerRole("producer")).toBe(true);
    expect(ALLOWED_CUSTOMER_ROLES).toContain("producer");
    expect(DENIED_CUSTOMER_ROLES).not.toContain("producer");
  });
});
