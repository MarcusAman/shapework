/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent PostgreSQL Ledger for NORA Follow-Up Emails
 * Guarantees idempotency, audit trail, and retrieval of outbound knowledge emails.
 */

import { dbPool, storageDriver, getDbPool, getStorageDriver } from './repositories.js';
import { convertKeysToCamel } from './databaseRepositories.js';
import { PersistedFollowUpEmail, NoraFollowUpStatus, NoraChannel } from '../services/nora/noraOutcomeTypes.js';

let inMemoryFollowUps: PersistedFollowUpEmail[] = [];

export function purgeFollowUpEmailsInMemory(): void {
  inMemoryFollowUps = [];
}

function mapRowToPersistedFollowUp(row: any): PersistedFollowUpEmail {
  const camel = convertKeysToCamel(row);
  return {
    id: camel.id,
    conversationId: camel.conversationId,
    conversationChannel: (camel.conversationChannel || 'voice') as NoraChannel,
    idempotencyKey: camel.idempotencyKey,
    recipientEmail: camel.recipientEmail,
    recipientName: camel.recipientName,
    representedAgentId: camel.representedAgentId || undefined,
    callerName: camel.callerName || undefined,
    callerPhone: camel.callerPhone || undefined,
    intent: camel.intent || undefined,
    subject: camel.subject,
    bodyText: camel.bodyText,
    bodyHtml: camel.bodyHtml,
    status: (camel.status || 'pending') as NoraFollowUpStatus,
    errorMessage: camel.errorMessage || undefined,
    messageId: camel.messageId || undefined,
    knowledgeAssertionIds: Array.isArray(camel.knowledgeAssertionIds) 
      ? camel.knowledgeAssertionIds 
      : (typeof camel.knowledgeAssertionIds === 'string' ? JSON.parse(camel.knowledgeAssertionIds) : []),
    sopCodes: Array.isArray(camel.sopCodes) 
      ? camel.sopCodes 
      : (typeof camel.sopCodes === 'string' ? JSON.parse(camel.sopCodes) : []),
    resourceUrls: Array.isArray(camel.resourceUrls) 
      ? camel.resourceUrls 
      : (typeof camel.resourceUrls === 'string' ? JSON.parse(camel.resourceUrls) : []),
    warnings: Array.isArray(camel.warnings) 
      ? camel.warnings 
      : (typeof camel.warnings === 'string' ? JSON.parse(camel.warnings) : []),
    metadata: camel.metadata || {},
    sentAt: camel.sentAt ? new Date(camel.sentAt).toISOString() : undefined,
    createdAt: camel.createdAt ? new Date(camel.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: camel.updatedAt ? new Date(camel.updatedAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Persists a follow-up email record to PostgreSQL `nora_followup_emails`.
 */
export async function saveFollowUpEmailAsync(
  record: PersistedFollowUpEmail,
  executor?: any
): Promise<PersistedFollowUpEmail> {
  const now = new Date().toISOString();
  const normalized: PersistedFollowUpEmail = {
    ...record,
    createdAt: record.createdAt || now,
    updatedAt: now
  };

  // 1. Update in-memory cache
  const idx = inMemoryFollowUps.findIndex(f => f.id === normalized.id || f.idempotencyKey === normalized.idempotencyKey);
  if (idx >= 0) {
    inMemoryFollowUps[idx] = normalized;
  } else {
    inMemoryFollowUps.unshift(normalized);
  }

  // 2. Query PostgreSQL if database driver is active
  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);

  if (isDb) {
    const query = `
      INSERT INTO nora_followup_emails (
        id, conversation_id, conversation_channel, idempotency_key,
        recipient_email, recipient_name, represented_agent_id, caller_name,
        caller_phone, intent, subject, body_text, body_html, status,
        error_message, message_id, knowledge_assertion_ids, sop_codes,
        resource_urls, warnings, metadata, sent_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24
      )
      ON CONFLICT (idempotency_key) DO UPDATE SET
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message,
        message_id = EXCLUDED.message_id,
        sent_at = EXCLUDED.sent_at,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    const params = [
      normalized.id,
      normalized.conversationId,
      normalized.conversationChannel,
      normalized.idempotencyKey,
      normalized.recipientEmail,
      normalized.recipientName,
      normalized.representedAgentId || null,
      normalized.callerName || null,
      normalized.callerPhone || null,
      normalized.intent || null,
      normalized.subject,
      normalized.bodyText,
      normalized.bodyHtml,
      normalized.status,
      normalized.errorMessage || null,
      normalized.messageId || null,
      JSON.stringify(normalized.knowledgeAssertionIds || []),
      JSON.stringify(normalized.sopCodes || []),
      JSON.stringify(normalized.resourceUrls || []),
      JSON.stringify(normalized.warnings || []),
      JSON.stringify(normalized.metadata || {}),
      normalized.sentAt ? new Date(normalized.sentAt) : null,
      new Date(normalized.createdAt),
      new Date(normalized.updatedAt)
    ];

    try {
      const res = await db.query(query, params);
      if (res.rows && res.rows[0]) {
        return mapRowToPersistedFollowUp(res.rows[0]);
      }
    } catch (err: any) {
      console.warn('[noraFollowUpRepository] Error persisting follow-up email to PostgreSQL:', err.message);
      // If error occurs, in-memory record is still preserved
    }
  }

  return normalized;
}

/**
 * Checks whether a follow-up with this idempotency key already exists.
 */
export async function getFollowUpEmailByIdempotencyKeyAsync(
  idempotencyKey: string,
  executor?: any
): Promise<PersistedFollowUpEmail | null> {
  if (!idempotencyKey) return null;

  // 1. Check in-memory
  const mem = inMemoryFollowUps.find(f => f.idempotencyKey === idempotencyKey);
  if (mem) return mem;

  // 2. Check Database
  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);

  if (isDb) {
    try {
      const res = await db.query(
        'SELECT * FROM nora_followup_emails WHERE idempotency_key = $1 LIMIT 1',
        [idempotencyKey]
      );
      if (res.rows && res.rows.length > 0) {
        const item = mapRowToPersistedFollowUp(res.rows[0]);
        // Populate cache
        if (!inMemoryFollowUps.some(f => f.id === item.id)) {
          inMemoryFollowUps.unshift(item);
        }
        return item;
      }
    } catch (err: any) {
      console.warn('[noraFollowUpRepository] Error querying follow-up by idempotency key:', err.message);
    }
  }

  return null;
}

/**
 * Retrieves follow-ups for a conversation.
 */
export async function getFollowUpEmailsByConversationIdAsync(
  conversationId: string,
  executor?: any
): Promise<PersistedFollowUpEmail[]> {
  if (!conversationId) return [];

  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);

  if (isDb) {
    try {
      const res = await db.query(
        'SELECT * FROM nora_followup_emails WHERE conversation_id = $1 ORDER BY created_at DESC',
        [conversationId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(mapRowToPersistedFollowUp);
      }
    } catch (err: any) {
      console.warn('[noraFollowUpRepository] Error querying follow-ups by conversationId:', err.message);
    }
  }

  return inMemoryFollowUps.filter(f => f.conversationId === conversationId);
}
