/**
 * Sandbox identity sticky-store helpers (LOCAL DEV overlay).
 * handleRoleSwitch writes profile email/id into shapework_session_token;
 * password login and Return-to-Login must clear that sticky so real auth wins.
 */

export const SANDBOX_IDENTITY_STORAGE_KEYS = [
  'shapework_session_token',
  'shapework_active_profile_id',
  'shapework_active_user_email',
  'shapework_demo_access',
  'token',
] as const;

export const SANDBOX_IDENTITY_SESSION_KEYS = [
  'shapework_demo_access',
] as const;

/** Roles permitted on the customer workboard (WorkspaceConsole gate). */
export const ALLOWED_CUSTOMER_ROLES: readonly string[] = [
  'owner',
  'admin',
  'broker',
  'agent',
  'operations_manager',
  'operations_lead',
  'transaction_coordinator',
  'compliance_officer',
  'compliance_partner',
  'staff',
  'guest',
  'marketing_coordinator',
  'marketing_director',
  'listing_coordinator',
  'events',
  'producer',
];

/** Roles that must remain denied on the customer workboard. */
export const DENIED_CUSTOMER_ROLES: readonly string[] = [
  'bic',
  'shapework_operator',
  'maintenance',
];

export function isAllowedCustomerRole(role: string | undefined | null): boolean {
  if (!role) return false;
  // Accept marketing_director and display forms like "Marketing Director"
  const normalized = String(role).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (DENIED_CUSTOMER_ROLES.includes(normalized)) return false;
  return ALLOWED_CUSTOMER_ROLES.includes(normalized);
}

export type ProfileLike = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

/**
 * One switcher row per person: prefer unique email (case-insensitive);
 * if email missing, fall back to id; keep first occurrence.
 */
export function uniqueProfilesByEmail<T extends ProfileLike>(profiles: T[]): T[] {
  if (!Array.isArray(profiles) || profiles.length === 0) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of profiles) {
    const email = (p?.email || '').toString().trim().toLowerCase();
    const key = email || (p?.id ? `id:${p.id}` : '');
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

type StorageLike = {
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
};

function getLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Clears sandbox sticky identity so password login / Return-to-Login
 * cannot be remapped by a prior handleRoleSwitch overlay.
 */
export function clearSandboxIdentity(options?: { markLoggedOut?: boolean }): void {
  const markLoggedOut = options?.markLoggedOut !== false;
  const ls = getLocalStorage();
  const ss = getSessionStorage();

  if (ls) {
    for (const key of SANDBOX_IDENTITY_STORAGE_KEYS) {
      try {
        ls.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }

  if (ss) {
    for (const key of SANDBOX_IDENTITY_SESSION_KEYS) {
      try {
        ss.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    if (markLoggedOut) {
      try {
        ss.setItem('shapework_logged_out', 'true');
      } catch {
        /* ignore */
      }
    }
  }
}

/** Clear sticky before writing a real password-login session (do not mark logged out). */
export function clearSandboxIdentityForPasswordLogin(): void {
  clearSandboxIdentity({ markLoggedOut: false });
  const ss = getSessionStorage();
  if (ss) {
    try {
      ss.removeItem('shapework_logged_out');
    } catch {
      /* ignore */
    }
  }
}
