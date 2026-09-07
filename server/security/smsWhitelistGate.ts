/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Strict Outgoing SMS Safety Gate & Anti-Loop Limiter
 * Enforces recipient whitelist, per-recipient rate limits, duplicate cooldown,
 * and emergency killswitch across all SMS/Twilio channels.
 */

import { maskPhoneNumber } from '../notifications/smsSafety.js';

// Approved developer/tester phone numbers
export const ALLOWED_TEST_SMS_RECIPIENTS = [
  '+19104097120', // Ryan Crecelius (BIC / Owner)
  '+12527170595', // Marcus Aman (Broker / Tech Lead)
  '+19106128283', // Matt Orr (REALTOR®)
  '+19105072047', // Melissa Gagliardi (Marketing Director)
  '+19105550199', // Standard 555 Test Mock
  '+19105550100', // Standard 555 Test Mock
  '+18556127550'  // Nest Twilio Hotline
];

// In-memory rate limiting and deduplication tracker
interface SmsDispatchRecord {
  timestamps: number[];
  lastBodyHash?: string;
  lastSentAt?: number;
}

const dispatchHistoryStore: Map<string, SmsDispatchRecord> = new Map();

// Rate limit parameters
const MAX_SMS_PER_HOUR = 3;
const DUPLICATE_COOLDOWN_MS = 60 * 1000; // 60 seconds

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.trim();
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export interface SmsSafetyCheckResult {
  allowed: boolean;
  reason?: string;
  maskedPhone: string;
  cleanPhone: string;
}

export interface SmsSafetyCheckOptions {
  checkQuietHours?: boolean;
  date?: Date;
  userId?: string;
  recipientPreferences?: {
    smsEnabled?: boolean;
    preferredChannel?: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
  };
}

/**
 * Checks if the specified time is within allowed business hours in America/New_York (default 9:00 AM - 5:00 PM EST).
 */
export function isWithinBusinessHours(input?: Date | {
  date?: Date;
  startHour?: number; // default 9 (9 AM)
  endHour?: number;   // default 17 (5 PM)
  timeZone?: string;  // default 'America/New_York'
}): boolean {
  const options = input instanceof Date ? { date: input } : input;
  const date = options?.date || new Date();
  const startHour = options?.startHour ?? 9;
  const endHour = options?.endHour ?? 17;
  const timeZone = options?.timeZone || 'America/New_York';

  try {
    // 1. Check day of week in target timezone (Monday - Friday only)
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short'
    });
    const dayOfWeek = dayFormatter.format(date);
    if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
      return false;
    }

    // 2. Check hour of day in target timezone (handles daylight saving automatically)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const minutePart = parts.find(p => p.type === 'minute')?.value;
    const currentHour = parseInt(hourPart || '0', 10);
    const currentMinute = parseInt(minutePart || '0', 10);
    const totalMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    return totalMinutes >= startMinutes && totalMinutes < endMinutes;
  } catch (err) {
    const day = date.getUTCDay();
    if (day === 0 || day === 6) return false;
    const utcHour = date.getUTCHours();
    const estHour = (utcHour - 4 + 24) % 24;
    return estHour >= startHour && estHour < endHour;
  }
}

/**
 * Calculates the next eligible business hours window start date/time
 */
export function getNextBusinessHoursWindow(input?: Date | {
  date?: Date;
  startHour?: number;
  timeZone?: string;
}): Date {
  const options = input instanceof Date ? { date: input } : input;
  const fromDate = options?.date || new Date();
  const startHour = options?.startHour ?? 9;
  const timeZone = options?.timeZone || 'America/New_York';

  const candidate = new Date(fromDate.getTime() + 60 * 1000);
  candidate.setMinutes(0, 0, 0);

  for (let i = 0; i < 168; i++) {
    if (isWithinBusinessHours({ date: candidate, startHour, timeZone })) {
      return candidate;
    }
    candidate.setTime(candidate.getTime() + 60 * 60 * 1000);
  }
  return candidate;
}

/**
 * Validates whether an SMS can be safely dispatched to the recipient
 */
export function isAllowedSmsRecipient(
  phone?: string,
  messageBody?: string,
  options?: SmsSafetyCheckOptions
): SmsSafetyCheckResult {
  if (!phone) {
    return { allowed: false, reason: 'Empty recipient phone number', maskedPhone: '', cleanPhone: '' };
  }

  const clean = cleanPhoneNumber(phone);
  const masked = maskPhoneNumber(clean);

  // 1. Recipient Preferences Check
  if (options?.recipientPreferences) {
    const { smsEnabled, preferredChannel } = options.recipientPreferences;
    if (smsEnabled === false || preferredChannel === 'email' || preferredChannel === 'none') {
      return {
        allowed: false,
        reason: `SMS suppressed by recipient preference (channel: ${preferredChannel || 'email_only'})`,
        maskedPhone: masked,
        cleanPhone: clean
      };
    }
  }

  // 2. Quiet Hours Check (Default 9:00 AM - 5:00 PM America/New_York)
  const shouldCheckQuiet = options?.checkQuietHours || process.env.ENFORCE_SMS_QUIET_HOURS === 'true';
  if (shouldCheckQuiet) {
    const inHours = isWithinBusinessHours({
      date: options?.date,
      timeZone: options?.recipientPreferences?.timezone || 'America/New_York'
    });
    if (!inHours) {
      return {
        allowed: false,
        reason: 'SMS suppressed outside business hours (Quiet Hours active in America/New_York)',
        maskedPhone: masked,
        cleanPhone: clean
      };
    }
  }

  // 3. Emergency Global Killswitch
  if (process.env.SMS_KILLSWITCH === 'true' || process.env.SMS_SUPPRESS_ALL === 'true') {
    return {
      allowed: false,
      reason: `Global SMS killswitch active (${masked})`,
      maskedPhone: masked,
      cleanPhone: clean
    };
  }

  // 4. Production vs Non-Production Whitelist Check
  const isProduction = process.env.NODE_ENV === 'production' && process.env.APP_MODE === 'production';
  const customAllowlist = (process.env.SMS_TEST_ALLOWLIST || '')
    .split(',')
    .map(p => cleanPhoneNumber(p.trim()))
    .filter(Boolean);

  const combinedAllowlist = [...ALLOWED_TEST_SMS_RECIPIENTS.map(cleanPhoneNumber), ...customAllowlist];

  // Specific permanent blacklists / real agent protection in dev/test
  const isWhitelisted = combinedAllowlist.includes(clean) || clean.startsWith('+1910555');

  if (!isProduction && !isWhitelisted) {
    return {
      allowed: false,
      reason: `Recipient ${masked} is not on test SMS allowlist (blocked in dev/test mode)`,
      maskedPhone: masked,
      cleanPhone: clean
    };
  }

  // 3. Anti-Loop & Rate Limiting Check
  const now = Date.now();
  const history = dispatchHistoryStore.get(clean) || { timestamps: [] };

  // Prune timestamps older than 1 hour (3,600,000 ms)
  const oneHourAgo = now - 3600000;
  history.timestamps = history.timestamps.filter(t => t > oneHourAgo);

  // Rate limit: max 3 SMS per recipient per hour
  if (history.timestamps.length >= MAX_SMS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Recipient ${masked} exceeded hourly rate limit (${MAX_SMS_PER_HOUR} SMS/hour)`,
      maskedPhone: masked,
      cleanPhone: clean
    };
  }

  // 4. Duplicate Message Cooldown (60s)
  if (messageBody) {
    const bodyHash = hashString(messageBody.trim().toLowerCase());
    if (history.lastBodyHash === bodyHash && history.lastSentAt && (now - history.lastSentAt < DUPLICATE_COOLDOWN_MS)) {
      return {
        allowed: false,
        reason: `Duplicate SMS suppressed for ${masked} (cooldown: ${Math.ceil((DUPLICATE_COOLDOWN_MS - (now - history.lastSentAt)) / 1000)}s remaining)`,
        maskedPhone: masked,
        cleanPhone: clean
      };
    }
  }

  return { allowed: true, maskedPhone: masked, cleanPhone: clean };
}

/**
 * Record a successfully authorized SMS dispatch into the rate limiter history
 */
export function recordSmsDispatch(phone: string, messageBody?: string): void {
  const clean = cleanPhoneNumber(phone);
  const now = Date.now();
  const history = dispatchHistoryStore.get(clean) || { timestamps: [] };
  history.timestamps.push(now);
  history.lastSentAt = now;
  if (messageBody) {
    history.lastBodyHash = hashString(messageBody.trim().toLowerCase());
  }
  dispatchHistoryStore.set(clean, history);
}

/**
 * Reset rate limit store (for testing)
 */
export function resetSmsSafetyStoreForTesting(): void {
  dispatchHistoryStore.clear();
}
