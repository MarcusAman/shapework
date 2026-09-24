/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Recipient Verification Service
 * Resolves recipients from canonical directory records.
 * Strictly blocks hotline numbers, placeholder emails, and client-side fabricated destinations.
 */

import { isLocalProveAllowlistTo } from '../lib/outboundAllowlistGate';
import { NEST_FULL_ROSTER_77 } from '../../server/persistence/nestRosterSeed';

export interface VerifiedRecipient {
  requesterId?: string;
  name: string;
  firstName: string;
  role: string;
  isAgentOrBroker: boolean;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  maskedEmail: string | null;
  maskedPhone: string | null;
  emailExplanation?: string;
  phoneExplanation?: string;
  avatar: string;
  office?: string;
  status: 'verified' | 'partial' | 'unverified';
}

/**
 * Prohibited destination constants.
 * Under no circumstances should automated outbound communication target these.
 */
export const PROHIBITED_PHONE_NUMBERS = new Set([
  '9105072047',
  '19105072047',
  '+19105072047',
  '8556127550',
  '18556127550',
  '+18556127550'
]);

export const PROHIBITED_EMAIL_DOMAINS = [
  'example.com',
  'placeholder.com',
  'test.com'
];

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
  for (const domain of PROHIBITED_EMAIL_DOMAINS) {
    if (clean.endsWith(`@${domain}`) || clean.endsWith(`.${domain}`)) return true;
  }
  return false;
}

/**
 * Masks an email for display: m•••@nestrealty.com
 */
export function maskEmail(email?: string | null): string | null {
  if (!email || isProhibitedEmail(email)) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const [user, domain] = parts;
  if (user.length <= 1) {
    return `•@${domain}`;
  }
  return `${user.charAt(0)}•••@${domain}`;
}

/**
 * Masks a phone number for display: (910) •••-8283
 */
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

/**
 * Known canonical agent roster directory for Wilmington workspace.
 * Used for authoritative client-side lookup before backend verification.
 */
export const CANONICAL_AGENT_DIRECTORY = [
  {
    id: 'dir_matt_orr_10',
    name: 'Matt Orr',
    firstName: 'Matt',
    email: 'matt.orr@nestrealty.com',
    phone: '(910) 612-8283',
    role: 'Broker',
    personType: 'agent',
    office: 'Mayfaire',
    status: 'active'
  },
  {
    id: 'dir_jessica_keenan_8',
    name: 'Jessica Keenan',
    firstName: 'Jessica',
    email: 'jessica.keenan@nestrealty.com',
    phone: '(910) 368-1507',
    role: 'Broker-in-Charge (BIC)',
    personType: 'agent',
    office: 'Mayfaire',
    status: 'active'
  },
  {
    id: 'dir_eric_knight_5',
    name: 'Eric Knight',
    firstName: 'Eric',
    email: 'eric@nestrealty.com',
    phone: '(910) 367-2253',
    role: 'Broker-in-Charge (BIC)',
    personType: 'agent',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_james_fort_11',
    name: 'James Fort',
    firstName: 'James',
    email: 'james.fort@nestrealty.com',
    phone: '(910) 617-8264',
    role: 'CFO & Finance',
    personType: 'staff',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_marcus_aman',
    name: 'Marcus Aman',
    firstName: 'Marcus',
    email: 'marcus.aman@gmail.com',
    phone: '(252) 717-0595',
    role: 'Broker / Tech Lead',
    personType: 'agent',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_ryan_crecelius_6',
    name: 'Ryan Crecelius',
    firstName: 'Ryan',
    email: 'ryan@nestrealty.com',
    phone: '(910) 409-7120',
    role: 'Owner & Managing Principal',
    personType: 'agent',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_melissa_gagliardi_33',
    name: 'Melissa Gagliardi',
    firstName: 'Melissa',
    email: 'melissa.gagliardi@nestrealty.com',
    phone: '(919) 219-2085',
    role: 'Marketing Director',
    personType: 'staff',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_ann_gunn_28',
    name: 'Ann Gunn',
    firstName: 'Ann',
    email: 'ann@nestrealty.com',
    phone: '(910) 540-3965',
    role: 'Operations Lead & ATC',
    personType: 'staff',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_eduardo_lovo_73',
    name: 'Eduardo Lovo',
    firstName: 'Eduardo',
    email: 'eduardo.lovo@nestrealty.com',
    phone: '(910) 507-2047',
    role: 'Virtual Assistant & Marketing Production',
    personType: 'staff',
    office: 'Remote',
    status: 'active'
  },
  {
    id: 'dir_eric_miller_22',
    name: 'Eric Miller',
    firstName: 'Eric',
    email: 'eric.miller@nestrealty.com',
    phone: '(910) 555-0102',
    role: 'Broker',
    personType: 'agent',
    office: 'Wilmington Downtown',
    status: 'active'
  },
  {
    id: 'dir_dawn_34',
    name: 'Dawn',
    firstName: 'Dawn',
    email: 'dawn@nestrealty.com',
    phone: '(910) 555-0103',
    role: 'Broker',
    personType: 'agent',
    office: 'Mayfaire',
    status: 'active'
  }
];

export interface ResolveRecipientOptions {
  requesterId?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  agentRole?: string | null;
  workspaceId?: string;
}

/**
 * Resolves a canonical recipient record, ensuring verified destinations and filtering out prohibited values.
 */
export function resolveCanonicalRecipient(options: ResolveRecipientOptions): VerifiedRecipient {
  const { requesterId, agentName, agentEmail, agentPhone, agentRole } = options;

  let matched = null;

  // 1. Match by requesterId if available
  if (requesterId) {
    matched = CANONICAL_AGENT_DIRECTORY.find(a => a.id.toLowerCase() === requesterId.toLowerCase());
  }

  // 2. Match by email if valid and not prohibited
  if (!matched && agentEmail && !isProhibitedEmail(agentEmail)) {
    matched = CANONICAL_AGENT_DIRECTORY.find(a => a.email.toLowerCase() === agentEmail.toLowerCase());
  }

  // 3. Match by name
  if (!matched && agentName) {
    const cleanName = agentName.replace(/\(.*?\)/g, '').trim().toLowerCase();
    matched = CANONICAL_AGENT_DIRECTORY.find(a => a.name.toLowerCase() === cleanName);
    if (!matched) {
      matched = CANONICAL_AGENT_DIRECTORY.find(a => cleanName.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(cleanName));
    }
  }

  // Client-directory rows that are not on the Nest roster (prove Gmail, dawn@) are not agents.
  const matchedEmail = String(matched?.email || '').trim();
  const nestDirectoryMatch = Boolean(
    matched &&
    matchedEmail &&
    !isProhibitedEmail(matchedEmail) &&
    NEST_FULL_ROSTER_77.some(
      (member) => String(member.email || '').trim().toLowerCase() === matchedEmail.toLowerCase()
    )
  );
  const directoryPerson = nestDirectoryMatch ? matched : null;
  const proveTo = [agentEmail, matched?.email].find(
    (candidate) => isLocalProveAllowlistTo(candidate) && !isProhibitedEmail(candidate)
  );

  const rawName = directoryPerson
    ? directoryPerson.name
    : (agentName ? agentName.replace(/\(.*?\)/g, '').trim() : 'Agent');
  const firstName = directoryPerson ? directoryPerson.firstName : rawName.split(' ')[0] || 'Agent';
  const rawRole = directoryPerson ? directoryPerson.role : (proveTo ? '' : (agentRole || 'Broker'));
  const roleLower = rawRole.toLowerCase();

  const isAgentOrBroker = directoryPerson
    ? (
      roleLower.includes('broker') ||
      roleLower.includes('agent') ||
      roleLower.includes('realtor') ||
      roleLower.includes('listing specialist') ||
      directoryPerson.personType === 'agent'
    )
    : false;

  let resolvedEmail: string | null = null;
  if (directoryPerson?.email) {
    resolvedEmail = directoryPerson.email;
  } else if (proveTo) {
    resolvedEmail = String(proveTo).trim().toLowerCase();
  }

  const recipientSendable = Boolean(resolvedEmail);
  const emailVerified = recipientSendable && Boolean(resolvedEmail && !isProhibitedEmail(resolvedEmail));
  const maskedEmail = emailVerified ? maskEmail(resolvedEmail) : null;
  const emailExplanation = !emailVerified
    ? 'No verified email address is available for this agent.'
    : undefined;

  // Evaluate Phone — only after the same directory-or-allowlist predicate.
  let resolvedPhone: string | null = null;
  if (directoryPerson && directoryPerson.phone && !isProhibitedPhone(directoryPerson.phone)) {
    resolvedPhone = directoryPerson.phone;
  } else if (directoryPerson && agentPhone && !isProhibitedPhone(agentPhone)) {
    resolvedPhone = agentPhone.trim();
  }

  const phoneVerified = Boolean(resolvedPhone && !isProhibitedPhone(resolvedPhone));
  const maskedPhone = phoneVerified ? maskPhoneNumber(resolvedPhone) : null;
  const phoneExplanation = !phoneVerified
    ? 'No verified mobile number is available for this agent.'
    : undefined;

  const status: 'verified' | 'partial' | 'unverified' =
    emailVerified && phoneVerified ? 'verified' :
    emailVerified || phoneVerified ? 'partial' : 'unverified';

  return {
    requesterId: directoryPerson?.id,
    name: rawName,
    firstName,
    role: rawRole,
    isAgentOrBroker,
    email: resolvedEmail,
    phone: resolvedPhone,
    emailVerified,
    phoneVerified,
    maskedEmail,
    maskedPhone,
    emailExplanation,
    phoneExplanation,
    avatar: rawName.charAt(0).toUpperCase(),
    office: directoryPerson?.office,
    status
  };
}

/**
 * Returns dynamic action button label:
 * - 'Ask Agent' for agents, brokers, listing specialists
 * - 'Ask Requester' for operations leads, VAs, marketing, or general staff
 */
export function getRequesterActionLabel(task?: { agentRole?: string; agentName?: string; category?: string } | null): string {
  if (!task) return 'Ask Agent';
  const role = (task.agentRole || '').toLowerCase();
  const name = (task.agentName || '').toLowerCase();

  const isAgentOrBroker = 
    role.includes('agent') || 
    role.includes('broker') || 
    role.includes('realtor') || 
    role.includes('listing specialist') ||
    name.includes('broker') ||
    name.includes('realtor');

  const isInternalStaff = 
    role.includes('operation') || 
    role.includes('marketing director') || 
    role.includes('virtual assistant') || 
    role.includes('atc') || 
    role.includes('finance') || 
    role.includes('admin');

  if (isInternalStaff && !role.includes('broker')) {
    return 'Ask Requester';
  }

  return isAgentOrBroker ? 'Ask Agent' : 'Ask Requester';
}
