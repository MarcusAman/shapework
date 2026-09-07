/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Webhook Signature Verifier
 * Cryptographically verifies X-Retell-Signature over the RAW HTTP request body.
 * Header format: v={timestamp},d={hex_digest}
 * Message: rawBody + timestamp
 * HMAC key: Retell API key (or RETELL_WEBHOOK_SECRET)
 * 
 * Fails closed in production if API/signing keys are missing.
 * Enforces 5-minute replay tolerance window.
 * Uses timing-safe HMAC-SHA256 comparison to prevent side-channel attacks.
 */

import crypto from 'crypto';

export interface VerifyRetellWebhookParams {
  rawBody: string | Buffer;
  signatureHeader?: string;
  apiKey?: string;
  toleranceMs?: number;
}

export interface VerifyRetellWebhookResult {
  valid: boolean;
  reason?: string;
  timestamp?: number;
}

/**
 * Generates a valid Retell webhook signature header (v={timestamp},d={digest}).
 */
export function generateRetellSignature(
  rawBody: string | Buffer,
  apiKey: string,
  timestamp: number = Date.now()
): string {
  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
  const payload = `${bodyStr}${timestamp}`;
  const hash = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
  return `v=${timestamp},d=${hash}`;
}

/**
 * Cryptographically verifies an inbound Retell webhook request signature.
 */
export function verifyRetellWebhookSignature(
  params: VerifyRetellWebhookParams
): VerifyRetellWebhookResult {
  const rawBodyStr = Buffer.isBuffer(params.rawBody)
    ? params.rawBody.toString('utf8')
    : String(params.rawBody ?? '');

  // RETELL_API_KEY is the single authoritative signing credential for Retell webhooks.
  // Unrelated or arbitrary secrets like RETELL_WEBHOOK_SECRET must NOT be used as fallbacks.
  const apiKey = params.apiKey || process.env.RETELL_API_KEY;
  const signatureHeader = params.signatureHeader;
  const toleranceMs = params.toleranceMs ?? 5 * 60 * 1000; // 5 minutes (300,000 ms)

  const isProduction = process.env.APP_MODE === 'production' || 
                       process.env.APP_ENV === 'production' || 
                       process.env.NODE_ENV === 'production';

  // 1. Fail-closed in production if Retell key is unconfigured
  if (isProduction && (!apiKey || apiKey.trim() === '')) {
    const err = new Error('RETELL_INTEGRATION_NOT_CONFIGURED: Retell API key (RETELL_API_KEY) is missing in production configuration.');
    (err as any).code = 'RETELL_INTEGRATION_NOT_CONFIGURED';
    throw err;
  }

  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, reason: 'MISSING_RETELL_API_KEY' };
  }

  if (!signatureHeader || signatureHeader.trim() === '') {
    return { valid: false, reason: 'MISSING_RETELL_SIGNATURE_HEADER' };
  }

  // 2. Parse X-Retell-Signature header
  // Standard format: v={timestamp},d={digest}
  // Legacy format:   t={timestamp},v1={digest}
  let timestamp: number | null = null;
  let signatureHash = '';
  let isLegacyFormat = false;

  const parts = signatureHeader.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    if (key === 'v') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) timestamp = parsed;
    } else if (key === 't') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        timestamp = parsed;
        isLegacyFormat = true;
      }
    } else if (key === 'd') {
      signatureHash = value;
    } else if (key === 'v1') {
      signatureHash = value;
      isLegacyFormat = true;
    }
  }

  if (timestamp === null || !signatureHash) {
    return { valid: false, reason: 'MALFORMED_RETELL_SIGNATURE_HEADER' };
  }

  // Normalize timestamp to milliseconds if given in seconds
  const timestampMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;

  // 3. Replay Protection: 5-minute tolerance check
  const now = Date.now();
  const ageMs = Math.abs(now - timestampMs);
  if (ageMs > toleranceMs) {
    return {
      valid: false,
      reason: `SIGNATURE_TIMESTAMP_EXPIRED: Request timestamp age (${Math.round(ageMs / 1000)}s) exceeds max tolerance (${Math.round(toleranceMs / 1000)}s).`,
      timestamp: timestampMs
    };
  }

  // 4. Compute Expected HMAC SHA-256 Signature over RAW Body
  // Retell official standard: rawBody + timestamp
  const expectedPayload = `${rawBodyStr}${timestamp}`;
  const expectedHash = crypto.createHmac('sha256', apiKey).update(expectedPayload).digest('hex');

  // 5. Constant-time comparison
  const bufActual = Buffer.from(signatureHash, 'hex');
  const bufExpected = Buffer.from(expectedHash, 'hex');

  let match = false;
  if (bufActual.length === bufExpected.length && crypto.timingSafeEqual(bufActual, bufExpected)) {
    match = true;
  } else if (isLegacyFormat) {
    // Backward compatibility for legacy test fixture format: timestamp.rawBody
    const legacyPayload = `${timestamp}.${rawBodyStr}`;
    const legacyExpectedHash = crypto.createHmac('sha256', apiKey).update(legacyPayload).digest('hex');
    const bufLegacyExpected = Buffer.from(legacyExpectedHash, 'hex');
    if (bufActual.length === bufLegacyExpected.length && crypto.timingSafeEqual(bufActual, bufLegacyExpected)) {
      match = true;
    }
  }

  if (!match) {
    return { valid: false, reason: 'INVALID_RETELL_SIGNATURE_HMAC_MISMATCH', timestamp: timestampMs };
  }

  return { valid: true, timestamp: timestampMs };
}

/**
 * Legacy compatibility wrapper class
 */
export class RetellWebhookVerifier {
  public static generateTestSignature(rawBody: string, apiKey: string, timestamp: number = Date.now()): string {
    const payload = `${timestamp}.${rawBody}`;
    const hash = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
    return `t=${timestamp},v1=${hash}`;
  }

  public static verifySignature(params: {
    rawBody: string;
    signatureHeader?: string;
    apiKey?: string;
    toleranceSeconds?: number;
  }): { valid: boolean; reason?: string } {
    const toleranceMs = params.toleranceSeconds ? params.toleranceSeconds * 1000 : undefined;
    return verifyRetellWebhookSignature({
      rawBody: params.rawBody,
      signatureHeader: params.signatureHeader,
      apiKey: params.apiKey,
      toleranceMs
    });
  }
}
