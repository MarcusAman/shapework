/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Webhook Signature Verifier — Phase 4A.2 Security Hardening
 * Cryptographically verifies X-Retell-Signature over the RAW HTTP request body.
 * Fails closed in production if API/signing keys are missing.
 * Operates replay protection against stale timestamps.
 */

import crypto from 'crypto';

export class RetellWebhookVerifier {
  /**
   * Generates a valid Retell signature header for testing / fixture generation.
   */
  public static generateTestSignature(rawBody: string, apiKey: string, timestamp: number = Date.now()): string {
    const payload = `${timestamp}.${rawBody}`;
    const hash = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
    return `t=${timestamp},v1=${hash}`;
  }

  /**
   * Cryptographically verifies inbound Retell webhook signature on raw request body.
   */
  public static verifySignature(params: {
    rawBody: string;
    signatureHeader?: string;
    apiKey?: string;
    toleranceSeconds?: number;
  }): { valid: boolean; reason?: string } {
    const { rawBody, signatureHeader, apiKey = process.env.RETELL_API_KEY, toleranceSeconds = 300 } = params;
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';

    // 1. Fail-closed Production Protection
    if (isProduction && (!apiKey || apiKey.trim() === '')) {
      const err = new Error('RETELL_INTEGRATION_NOT_CONFIGURED: Retell API key / webhook signing key is missing in production configuration.');
      (err as any).code = 'RETELL_INTEGRATION_NOT_CONFIGURED';
      throw err;
    }

    if (!apiKey) {
      // In dev mode without key, fail validation safely
      return { valid: false, reason: 'RETELL_API_KEY_NOT_CONFIGURED' };
    }

    if (!signatureHeader || signatureHeader.trim() === '') {
      return { valid: false, reason: 'MISSING_RETELL_SIGNATURE_HEADER' };
    }

    // 2. Parse X-Retell-Signature header (format: t=TIMESTAMP,v1=SIGNATURE_HASH)
    let timestamp = 0;
    let signatureHash = '';

    const parts = signatureHeader.split(',');
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') timestamp = parseInt(value, 10);
      else if (key === 'v1') signatureHash = value;
    }

    if (!timestamp || !signatureHash) {
      return { valid: false, reason: 'MALFORMED_RETELL_SIGNATURE_HEADER' };
    }

    // 3. Replay Protection: Timestamp Tolerance Check
    const now = Date.now();
    const ageSeconds = Math.abs(now - timestamp) / 1000;
    if (ageSeconds > toleranceSeconds) {
      return { valid: false, reason: `SIGNATURE_TIMESTAMP_EXPIRED: Request timestamp age (${Math.round(ageSeconds)}s) exceeds max tolerance (${toleranceSeconds}s).` };
    }

    // 4. Compute Expected HMAC SHA256 Signature over RAW Body
    const expectedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto.createHmac('sha256', apiKey).update(expectedPayload).digest('hex');

    // 5. Constant-time Comparison
    const bufExpected = Buffer.from(expectedHash, 'hex');
    const bufActual = Buffer.from(signatureHash, 'hex');

    if (bufExpected.length !== bufActual.length || !crypto.timingSafeEqual(bufExpected, bufActual)) {
      return { valid: false, reason: 'INVALID_RETELL_SIGNATURE_HMAC_MISMATCH' };
    }

    return { valid: true };
  }
}
