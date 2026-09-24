/**
 * Outbound allowlist gate (temporary kill-off).
 *
 * Who may receive SMTP when they are not a Nest directory person.
 * Production and hard kill (OUTBOUND_MASTER_MODE=disabled) fail closed:
 * the effective allowlist is empty and a directory record is required.
 * Hold keeps the explicit list. This is not a second mailer.
 */

export const EXPLICIT_OUTBOUND_ALLOWLIST = [
  'marcus.aman@gmail.com',
  'marcus@shapework.co',
];

function readEnv(name: string): string {
  if (typeof process === 'undefined' || !process.env) return '';
  switch (name) {
    case 'NODE_ENV':
      return process.env.NODE_ENV || '';
    case 'APP_MODE':
      return process.env.APP_MODE || '';
    case 'APP_ENV':
      return process.env.APP_ENV || '';
    case 'IS_PRODUCTION':
      return process.env.IS_PRODUCTION || '';
    case 'OUTBOUND_MASTER_MODE':
      return process.env.OUTBOUND_MASTER_MODE || '';
    case 'OUTBOUND_MODE':
      return process.env.OUTBOUND_MODE || '';
    case 'EMAIL_TEST_ALLOWLIST':
      return process.env.EMAIL_TEST_ALLOWLIST || '';
    default:
      return '';
  }
}

/** Prod or outbound kill: no allowlist bypass. Directory is required. */
export function isOutboundAllowlistFailClosed(): boolean {
  const appMode = (readEnv('APP_MODE') || readEnv('APP_ENV')).toLowerCase();
  if (appMode === 'production' || readEnv('IS_PRODUCTION') === 'true') return true;
  if (readEnv('NODE_ENV').toLowerCase() === 'production') return true;
  const outbound = (readEnv('OUTBOUND_MASTER_MODE') || readEnv('OUTBOUND_MODE')).toLowerCase().trim();
  return outbound === 'disabled';
}

/** Exact addresses that may pass the allowlist gate. Empty when fail-closed. */
export function explicitOutboundAllowlist(): string[] {
  if (isOutboundAllowlistFailClosed()) return [];
  const envAllowlist = readEnv('EMAIL_TEST_ALLOWLIST')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return [...EXPLICIT_OUTBOUND_ALLOWLIST.map((entry) => entry.toLowerCase()), ...envAllowlist];
}

/** Exact To match. Does not allow every address when live/production bypasses SMTP whitelist. */
export function isExactOutboundAllowlistHit(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return explicitOutboundAllowlist().includes(normalized);
}
