/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';

export function getWebhookIdempotencyKey(provider: string, workspaceId: string, payload: any): string {
  const eventId = payload.eventId || payload.id || '';
  const loopId = payload.loopId || payload.loop?.id || '';
  const documentId = payload.documentId || payload.document?.id || '';
  const eventType = payload.eventType || payload.type || '';
  const timestamp = payload.timestamp || '';

  // Stable seed parameters
  const rawSeed = `${provider}:${workspaceId}:${eventId}:${loopId}:${documentId}:${eventType}:${timestamp}`;
  
  // SHA-256 fallback hash of raw payload if all parameters empty
  if (!eventId && !loopId && !documentId && !eventType) {
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    return `${provider}:${workspaceId}:fallback:${hash}`;
  }

  return createHash('sha256').update(rawSeed).digest('hex');
}

export function isDuplicateWebhook(key: string, dbState: any): boolean {
  if (!dbState.idempotentKeys) {
    dbState.idempotentKeys = [];
  }

  if (dbState.idempotentKeys.includes(key)) {
    return true; // Duplicate!
  }

  dbState.idempotentKeys.push(key);
  return false; // New!
}
