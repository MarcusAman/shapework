/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Caller Identification Service — Nest Hotline (910) 507-2047
 * Identifies known Nest callers from the canonical Directory data before call answering.
 * Excludes malformed numbers, dates, short numbers, and the NORA hotline itself.
 */

import { NEST_FULL_ROSTER_77, DirectorySeedPerson } from '../persistence/nestRosterSeed.js';

export interface CallerIdentificationResult {
  caller_match_status: 'matched' | 'unknown' | 'ambiguous';
  caller_first_name: string;
  caller_full_name: string;
  caller_directory_member_id: string;
  caller_role: string;
  caller_office: string;
  opening_greeting: string;
  matched_person?: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    title: string;
    role: string;
    office: string;
    email: string;
    phone: string;
  };
  diagnostics: {
    normalized_from_number: string | null;
    raw_from_number_redacted: string;
    workspace_id: string;
    match_count: number;
    exclusion_reason?: string;
  };
}

// Canonical Hotline Number (Must NEVER be matched as a personal individual identity)
export const NEST_HOTLINE_E164 = '+19105072047';
export const NEST_HOTLINE_DIGITS = '9105072047';

// Default Trusted Workspace for Nest Hotline
export const NEST_DEFAULT_WORKSPACE_ID = 'ws_wilmington';

// Disputed directory records (records with conflicting/unverified contact numbers across sources)
export const DISPUTED_DIRECTORY_MEMBER_IDS = new Set<string>([
  'dir_ann_gunn_28' // Disputed between CSV export (910-540-3965), old prompt (hotline), and repo references. Excluded from automatic caller identification until officially confirmed.
]);

/**
 * Redacts a phone number for privacy-compliant server logging.
 * Example: "+19106128283" -> "+1910***8283"
 */
export function redactPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '[REDACTED_BLANK]';
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return '***';
  const prefix = trimmed.slice(0, Math.min(5, Math.floor(trimmed.length / 2)));
  const suffix = trimmed.slice(-4);
  return `${prefix}***${suffix}`;
}

/**
 * Normalizes phone numbers to strict E.164 (+1XXXXXXXXXX for US).
 * Rejects invalid strings, dates (e.g. 4/22/2026), short numbers (e.g. 339007), 9-digit values, or garbage.
 */
export function normalizePhoneNumber(raw?: string | null): {
  valid: boolean;
  e164?: string;
  digits?: string;
  reason?: string;
} {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, reason: 'BLANK_OR_NON_STRING' };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, reason: 'EMPTY_STRING' };
  }

  // Detect dates entered into phone fields (e.g., "4/22/2026", "6/18/2026", "3/30/2026")
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    return { valid: false, reason: 'DATE_ENTERED_INTO_PHONE_FIELD' };
  }

  const digits = trimmed.replace(/\D/g, '');

  // Check for short numbers or invalid lengths
  if (digits.length < 10) {
    return { valid: false, digits, reason: `INSUFFICIENT_DIGITS_COUNT_${digits.length}` };
  }

  if (digits.length === 10) {
    // US Standard 10-digit phone
    return { valid: true, e164: `+1${digits}`, digits };
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    // US 11-digit phone with leading 1
    return { valid: true, e164: `+${digits}`, digits: digits.slice(1) };
  }

  // International or non-standard format
  if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return { valid: true, e164: `+${digits}`, digits };
  }

  return { valid: false, digits, reason: `INVALID_PHONE_DIGITS_LENGTH_${digits.length}` };
}

/**
 * Identifies known Nest callers from the canonical Directory data.
 * Always resolves workspace server-side; ignores untrusted client inputs.
 */
export async function identifyCaller(params: {
  fromNumber?: string | null;
  toNumber?: string | null;
  workspaceId?: string;
  now?: Date;
}): Promise<CallerIdentificationResult> {
  const { fromNumber, workspaceId = NEST_DEFAULT_WORKSPACE_ID } = params;
  const rawRedacted = redactPhoneNumber(fromNumber);

  const genericGreeting = "Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. May I ask who’s calling?";

  // 1. Validate and Normalize Inbound Phone Number
  const norm = normalizePhoneNumber(fromNumber);
  if (!norm.valid || !norm.e164 || !norm.digits) {
    return {
      caller_match_status: 'unknown',
      caller_first_name: '',
      caller_full_name: '',
      caller_directory_member_id: '',
      caller_role: '',
      caller_office: '',
      opening_greeting: genericGreeting,
      diagnostics: {
        normalized_from_number: null,
        raw_from_number_redacted: rawRedacted,
        workspace_id: workspaceId,
        match_count: 0,
        exclusion_reason: norm.reason || 'INVALID_CALLER_PHONE_FORMAT'
      }
    };
  }

  // 2. Exclude the NORA Hotline Itself
  if (norm.e164 === NEST_HOTLINE_E164 || norm.digits === NEST_HOTLINE_DIGITS) {
    return {
      caller_match_status: 'unknown',
      caller_first_name: '',
      caller_full_name: '',
      caller_directory_member_id: '',
      caller_role: '',
      caller_office: '',
      opening_greeting: genericGreeting,
      diagnostics: {
        normalized_from_number: norm.e164,
        raw_from_number_redacted: rawRedacted,
        workspace_id: workspaceId,
        match_count: 0,
        exclusion_reason: 'HOTLINE_SELF_CALL_EXCLUDED'
      }
    };
  }

  // 3. Query Canonical Directory Data Scoped to Workspace
  // Filter out any directory records that have malformed phones or share the hotline
  const candidateMatches: DirectorySeedPerson[] = [];

  for (const person of NEST_FULL_ROSTER_77) {
    // Only search active members
    if (person.status === 'inactive') continue;

    const personNorm = normalizePhoneNumber(person.phone);
    if (!personNorm.valid || !personNorm.e164 || !personNorm.digits) {
      // Exclude invalid phone records in directory
      continue;
    }

    // Exclude records that have the shared hotline as their phone
    if (personNorm.e164 === NEST_HOTLINE_E164 || personNorm.digits === NEST_HOTLINE_DIGITS) {
      continue;
    }

    // Exclude disputed records from automatic caller identification
    if (DISPUTED_DIRECTORY_MEMBER_IDS.has(person.id)) {
      continue;
    }

    // Exact E.164 match or 10-digit exact match
    if (personNorm.e164 === norm.e164 || personNorm.digits === norm.digits) {
      candidateMatches.push(person);
    }
  }

  // 4. Evaluate Match Uniqueness
  if (candidateMatches.length === 0) {
    return {
      caller_match_status: 'unknown',
      caller_first_name: '',
      caller_full_name: '',
      caller_directory_member_id: '',
      caller_role: '',
      caller_office: '',
      opening_greeting: genericGreeting,
      diagnostics: {
        normalized_from_number: norm.e164,
        raw_from_number_redacted: rawRedacted,
        workspace_id: workspaceId,
        match_count: 0,
        exclusion_reason: 'NO_DIRECTORY_MATCH'
      }
    };
  }

  if (candidateMatches.length > 1) {
    // Ambiguous Match (Shared Number among multiple brokers)
    return {
      caller_match_status: 'ambiguous',
      caller_first_name: '',
      caller_full_name: '',
      caller_directory_member_id: '',
      caller_role: '',
      caller_office: '',
      opening_greeting: genericGreeting,
      diagnostics: {
        normalized_from_number: norm.e164,
        raw_from_number_redacted: rawRedacted,
        workspace_id: workspaceId,
        match_count: candidateMatches.length,
        exclusion_reason: 'MULTIPLE_DIRECTORY_MATCHES_SHARED_NUMBER'
      }
    };
  }

  // 5. Unique Match Found
  const matched = candidateMatches[0];
  const firstName = matched.firstName || (matched.displayName ? matched.displayName.split(' ')[0] : 'there');
  const fullName = matched.displayName || `${matched.firstName} ${matched.lastName}`.trim();
  const role = matched.title || matched.role || 'Broker';
  const office = matched.primaryOfficeName || (matched.officeNames && matched.officeNames[0]) || 'Mayfaire';

  const personalizedGreeting = `Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. Is this ${firstName}?`;

  return {
    caller_match_status: 'matched',
    caller_first_name: firstName,
    caller_full_name: fullName,
    caller_directory_member_id: matched.id,
    caller_role: role,
    caller_office: office,
    opening_greeting: personalizedGreeting,
    matched_person: {
      id: matched.id,
      displayName: fullName,
      firstName,
      lastName: matched.lastName,
      title: matched.title,
      role: matched.role,
      office,
      email: matched.email,
      phone: matched.phone
    },
    diagnostics: {
      normalized_from_number: norm.e164,
      raw_from_number_redacted: rawRedacted,
      workspace_id: workspaceId,
      match_count: 1
    }
  };
}
