/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server-side Canonical Recipient Verification Service
 * Resolves recipients directly from database / canonical directory.
 * Strictly blocks hotline numbers, placeholder emails, and client-supplied overrides.
 */

import { getDbPool, storageDriver } from '../persistence/repositories.js';
import { NEST_FULL_ROSTER_77 } from '../persistence/nestRosterSeed.js';

export interface VerifiedRecipientServer {
  id: string;
  name: string;
  firstName: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  maskedEmail: string | null;
  maskedPhone: string | null;
  role: string;
  isAgentOrBroker: boolean;
  workspaceId: string;
}

export const PROHIBITED_PHONE_NUMBERS = new Set([
  '9105072047',
  '19105072047',
  '+19105072047',
  '8556127550',
  '18556127550',
  '+18556127550'
]);

export const PROHIBITED_EMAIL_EXACT = new Set([
  'agent@nestrealty.com',
  'test@example.com',
  'placeholder@nestrealty.com',
  'user@example.com'
]);

export function cleanDigits(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function isHotlineNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = cleanDigits(phone);
  return digits === '9105072047' || digits === '19105072047';
}

export function isProhibitedPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const digits = cleanDigits(phone);
  if (!digits || digits.length < 10) return true;
  return PROHIBITED_PHONE_NUMBERS.has(digits);
}

export function isProhibitedEmail(email?: string | null): boolean {
  if (!email) return true;
  const clean = email.trim().toLowerCase();
  if (PROHIBITED_EMAIL_EXACT.has(clean)) return true;
  if (!clean.includes('@') || !clean.includes('.')) return true;
  if (clean.endsWith('@example.com') || clean.endsWith('.example.com') || clean.includes('placeholder')) return true;
  return false;
}

export function maskEmail(email?: string | null): string | null {
  if (!email || isProhibitedEmail(email)) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const [user, domain] = parts;
  if (user.length <= 1) return `•@${domain}`;
  return `${user.charAt(0)}•••@${domain}`;
}

export function maskPhoneNumber(phone?: string | null): string | null {
  if (!phone || isProhibitedPhone(phone)) return null;
  const digits = cleanDigits(phone);
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const last4 = digits.slice(6);
    return `(${area}) •••-${last4}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4);
    const last4 = digits.slice(7);
    return `(${area}) •••-${last4}`;
  }
  return '•••-•••-••••';
}

const WILMINGTON_WORKSPACE_ALIASES = new Set([
  'ws_wilmington',
  'nest-realty-wilmington',
  'nest-realty-demo',
  'tenant_nest',
  'tenant_nest_uat',
  'active-brokerage',
  'default'
]);

/**
 * Server-side canonical resolution of recipient from task/request ID or directory lookup.
 * Re-validates against database and rejects client overrides.
 */
export async function resolveServerCanonicalRecipient(options: {
  requesterId?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  workspaceId?: string;
}): Promise<VerifiedRecipientServer | null> {
  const targetWs = options.workspaceId || 'ws_wilmington';
  const isWilmington = WILMINGTON_WORKSPACE_ALIASES.has(targetWs);

  // 1. Try DB lookup first if available
  const pool = getDbPool();
  if (storageDriver === 'database' && pool) {
    try {
      let query = `
        SELECT id, display_name, first_name, last_name, email, phone, role, workspace_id
        FROM directory_people
        WHERE status NOT IN ('inactive', 'departed')
      `;
      const params: any[] = [];

      if (options.requesterId) {
        params.push(options.requesterId.toLowerCase());
        query += ` AND LOWER(id) = $${params.length}`;
      } else if (options.requesterEmail && !isProhibitedEmail(options.requesterEmail)) {
        params.push(options.requesterEmail.trim().toLowerCase());
        query += ` AND LOWER(email) = $${params.length}`;
      } else if (options.requesterName) {
        const clean = options.requesterName.replace(/\(.*?\)/g, '').trim().toLowerCase();
        params.push(clean);
        query += ` AND (LOWER(display_name) = $${params.length} OR LOWER(CONCAT(first_name, ' ', last_name)) = $${params.length})`;
      }

      if (params.length > 0) {
        const dbRes = await pool.query(query, params);
        if (dbRes.rows.length >= 1) {
          const row = dbRes.rows[0];
          // Check workspace scope
          if (!isWilmington && row.workspace_id !== targetWs) {
            console.warn(`[Server Recipient] Cross-workspace recipient access rejected for ${row.email}`);
            return null;
          }

          const rawPhone = row.phone;
          const rawEmail = row.email;
          const phoneValid = !isProhibitedPhone(rawPhone);
          const emailValid = !isProhibitedEmail(rawEmail);

          return {
            id: row.id,
            name: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            firstName: row.first_name || (row.display_name || '').split(' ')[0] || 'Agent',
            email: emailValid ? rawEmail : null,
            phone: phoneValid ? rawPhone : null,
            emailVerified: emailValid,
            phoneVerified: phoneValid,
            maskedEmail: emailValid ? maskEmail(rawEmail) : null,
            maskedPhone: phoneValid ? maskPhoneNumber(rawPhone) : null,
            role: row.role || 'Broker',
            isAgentOrBroker: (row.role || '').toLowerCase().includes('broker') || (row.role || '').toLowerCase().includes('agent'),
            workspaceId: row.workspace_id || targetWs
          };
        }
      }
    } catch (dbErr) {
      console.warn('[Server Recipient] DB lookup warning:', dbErr);
    }
  }

  // 2. Lookup in NEST_FULL_ROSTER_77
  let matched: any = null;
  if (options.requesterId) {
    matched = NEST_FULL_ROSTER_77.find(m => m.id.toLowerCase() === options.requesterId!.toLowerCase());
  }
  if (!matched && options.requesterEmail && !isProhibitedEmail(options.requesterEmail)) {
    matched = NEST_FULL_ROSTER_77.find(m => m.email.toLowerCase() === options.requesterEmail!.trim().toLowerCase());
  }
  if (!matched && options.requesterName) {
    const clean = options.requesterName.replace(/\(.*?\)/g, '').trim().toLowerCase();
    matched = NEST_FULL_ROSTER_77.find(m => m.displayName.toLowerCase() === clean || `${m.firstName} ${m.lastName}`.toLowerCase() === clean);
  }

  if (matched) {
    const rawPhone = matched.phone;
    const rawEmail = matched.email;
    const phoneValid = !isProhibitedPhone(rawPhone);
    const emailValid = !isProhibitedEmail(rawEmail);

    return {
      id: matched.id,
      name: matched.displayName || `${matched.firstName} ${matched.lastName}`.trim(),
      firstName: matched.firstName || (matched.displayName || '').split(' ')[0] || 'Agent',
      email: emailValid ? rawEmail : null,
      phone: phoneValid ? rawPhone : null,
      emailVerified: emailValid,
      phoneVerified: phoneValid,
      maskedEmail: emailValid ? maskEmail(rawEmail) : null,
      maskedPhone: phoneValid ? maskPhoneNumber(rawPhone) : null,
      role: matched.role || matched.title || 'Broker',
      isAgentOrBroker: true,
      workspaceId: matched.workspaceId || targetWs
    };
  }

  // Directory miss. Prove Gmail is not a Nest agent and is not inserted here.
  return null;
}
