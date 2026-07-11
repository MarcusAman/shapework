/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiNationDotloopEvent } from './apinationDotloopTypes';

// Helpers to mask PII securely
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '(***) ***-****';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***-***-****';
  return `(***) ***-${cleaned.slice(-4)}`;
}

export function maskName(name?: string): string {
  if (!name) return '***';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p.length > 0 ? `${p[0]}***` : '').join(' ');
}

export function maskAddress(address?: string): string {
  if (!address) return '***';
  const parts = address.trim().split(/\s+/);
  if (parts.length <= 1) return '***';
  // Keep the number, mask the rest
  const number = parts[0];
  const rest = parts.slice(1).map(p => p.length > 0 ? `${p[0]}***` : '').join(' ');
  return `${number} ${rest}`;
}

export function normalizeApiNationDotloopPayload(raw: any): ApiNationDotloopEvent {
  const payload = raw || {};
  const id = payload.id || `evt_dl_${Math.random().toString(36).substring(2, 9)}`;
  const eventType = payload.eventType || payload.event_type || 'unknown';
  
  // Extract loop parameters
  const loopId = String(payload.loopId || payload.loop_id || '');
  const loopName = String(payload.loopName || payload.loop_name || '');
  const loopStatus = String(payload.loopStatus || payload.loop_status || payload.status || '');
  const transactionType = String(payload.transactionType || payload.transaction_type || '');

  // Extract participant parameters
  const participantName = payload.participantName || payload.participant_name || '';
  const participantRole = payload.participantRole || payload.participant_role || '';

  // Extract contact parameters
  const contactName = payload.contactName || payload.contact_name || '';

  // Extract document parameters
  const documentName = payload.documentName || payload.document_name || payload.fileName || payload.file_name || '';
  const documentStatus = payload.documentStatus || payload.document_status || '';

  // Determine the channel based on payload properties
  let channel: ApiNationDotloopEvent['channel'] = 'unknown';
  const ch = String(payload.channel || '').toLowerCase();
  
  if (ch.includes('contacts') || contactName) {
    channel = 'contact_created_or_updated';
  } else if (ch.includes('participant') || participantName) {
    channel = 'participant_created_or_updated';
  } else if (ch.includes('document') || documentName) {
    channel = 'document_created_or_updated';
  } else if (ch.includes('loop') || loopName) {
    channel = 'loop_created_or_updated';
  }

  // Redact raw payload of sensitive PII (emails/phones/keys)
  const rawPayloadRedacted: Record<string, unknown> = {};
  for (const key in payload) {
    const val = payload[key];
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email')) {
      rawPayloadRedacted[key] = maskEmail(String(val));
    } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      rawPayloadRedacted[key] = maskPhone(String(val));
    } else if (lowerKey.includes('address') && !lowerKey.includes('email')) {
      rawPayloadRedacted[key] = maskAddress(String(val));
    } else if (lowerKey.includes('name') && (lowerKey.includes('client') || lowerKey.includes('buyer') || lowerKey.includes('seller') || lowerKey.includes('participant'))) {
      rawPayloadRedacted[key] = maskName(String(val));
    } else if (lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('key')) {
      rawPayloadRedacted[key] = '[REDACTED]';
    } else {
      rawPayloadRedacted[key] = val;
    }
  }

  // Address masking
  const propertyAddressMasked = loopName ? maskAddress(loopName) : undefined;

  return {
    id,
    source: 'apination_dotloop',
    channel,
    receivedAt: new Date().toISOString(),
    eventType,
    loopId: loopId || undefined,
    loopName: loopName || undefined,
    loopStatus: loopStatus || undefined,
    transactionType: transactionType || undefined,
    propertyAddressMasked,
    participantName: participantName ? maskName(participantName) : undefined,
    participantRole: participantRole || undefined,
    contactName: contactName ? maskName(contactName) : undefined,
    documentName: documentName || undefined,
    documentStatus: documentStatus || undefined,
    rawPayloadRedacted,
    matchStatus: 'needs_review', // Default to review for safety
    auditEventIds: []
  };
}
