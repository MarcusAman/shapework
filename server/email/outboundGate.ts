/**
 * Single outbound policy for email, Gmail, Resend, and SMS.
 * APP_MODE, DISABLE_EMAIL_WHITELIST, and EMAIL_TEST_ALLOWLIST do not widen recipients.
 * ALLOW_EXTERNAL_DISPATCH only decides whether allowlisted hold mail skips the queue.
 */
import { EXPLICIT_OUTBOUND_ALLOWLIST } from '../../src/lib/outboundAllowlistGate.js';

export type OutboundChannel = 'email' | 'sms' | 'gmail' | 'resend' | string;

export type CheckOutboundInput = {
  to?: string | string[] | null;
  cc?: string | string[] | null;
  bcc?: string | string[] | null;
  channel?: OutboundChannel | null;
  source?: string | null;
  /** Injected by evaluateDispatch tests. Omit to read OUTBOUND_MASTER_MODE. */
  mode?: string | null;
};

export type CheckOutboundResult = {
  allowed: boolean;
  reason: string;
  effectiveTo: string[];
  effectiveCc: string[];
  effectiveBcc: string[];
};

const ALLOWLIST = new Set(EXPLICIT_OUTBOUND_ALLOWLIST.map((email) => email.toLowerCase()));

export function resolveOutboundMasterMode(override?: string | null): 'disabled' | 'hold' | 'live' {
  const raw = override != null && String(override).trim() !== ''
    ? String(override)
    : process.env.OUTBOUND_MASTER_MODE;
  const mode = String(raw ?? '').trim().toLowerCase();
  if (mode === 'live') return 'live';
  if (mode === 'hold') return 'hold';
  return 'disabled';
}

function listed(value?: string | string[] | null): string[] {
  const raw = Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const email = String(item || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function allowlistedOnly(emails: string[]): string[] {
  return emails.filter((email) => ALLOWLIST.has(email));
}

function empty(reason: string): CheckOutboundResult {
  return { allowed: false, reason, effectiveTo: [], effectiveCc: [], effectiveBcc: [] };
}

export function checkOutbound(input: CheckOutboundInput = {}): CheckOutboundResult {
  const mode = resolveOutboundMasterMode(input.mode);
  const channel = String(input.channel || 'email').toLowerCase();
  const to = listed(input.to);
  const cc = listed(input.cc);
  const bcc = listed(input.bcc);

  if (channel === 'sms') {
    if (mode === 'live') {
      return { allowed: true, reason: 'live', effectiveTo: to, effectiveCc: [], effectiveBcc: [] };
    }
    return empty(mode === 'hold' ? 'held' : 'outbound_disabled');
  }

  if (mode === 'disabled') return empty('outbound_disabled');

  if (mode === 'hold') {
    const effectiveTo = allowlistedOnly(to);
    const effectiveCc = allowlistedOnly(cc);
    const effectiveBcc = allowlistedOnly(bcc);
    if (!effectiveTo.length) return empty('held');
    const skipHoldQueue = process.env.ALLOW_EXTERNAL_DISPATCH === 'true';
    return {
      allowed: skipHoldQueue,
      reason: skipHoldQueue ? 'allowlist' : 'held',
      effectiveTo,
      effectiveCc,
      effectiveBcc,
    };
  }

  if (!to.length) return empty('no_recipient');
  return { allowed: true, reason: 'live', effectiveTo: to, effectiveCc: cc, effectiveBcc: bcc };
}
