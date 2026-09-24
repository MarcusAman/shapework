/**
 * Temporary local-prove send gate. Not an identity.
 *
 * Prod: allowlist is empty. Nest To must directory-resolve.
 * Local kill-off (OUTBOUND_MASTER_MODE=hold): one exact To may send.
 * Live / IMAP restore drops this gate. Hard kill (disabled) does too.
 */

export const EXPLICIT_OUTBOUND_ALLOWLIST = [
  'marcus.aman@gmail.com',
  'marcus@shapework.co',
];

/** Prove To while outbound is held. Not a directory person and not a Nest agent. */
export const LOCAL_PROVE_ALLOWLIST_TO = 'marcus.aman@gmail.com';

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

export function isProductionApp(): boolean {
  const appMode = (readEnv('APP_MODE') || readEnv('APP_ENV')).toLowerCase();
  if (appMode === 'production' || readEnv('IS_PRODUCTION') === 'true') return true;
  return readEnv('NODE_ENV').toLowerCase() === 'production';
}

/** Hold is the temporary kill-off. Live restore and hard kill close the prove gate. */
export function isLocalProveKillOff(): boolean {
  if (isProductionApp()) return false;
  const outbound = (readEnv('OUTBOUND_MASTER_MODE') || readEnv('OUTBOUND_MODE') || 'hold').toLowerCase().trim();
  return outbound === 'hold';
}

/**
 * Exact prove To during local kill-off only.
 * Does not resolve a person and does not apply in prod, live, or disabled.
 */
export function isLocalProveAllowlistTo(email?: string | null): boolean {
  if (!email || !isLocalProveKillOff()) return false;
  return email.trim().toLowerCase() === LOCAL_PROVE_ALLOWLIST_TO;
}
