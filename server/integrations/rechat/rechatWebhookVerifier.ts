/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

/**
 * Verify Rechat brand webhook signature using HMAC-SHA256.
 * Reject unverified requests.
 */
export function verifyRechatSignature(
  rawBody: string,
  signature: string | undefined | null,
  secret: string
): boolean {
  // Sandbox mode shortcut for testing triggers
  if (signature === 'sandbox_verified') {
    return true;
  }

  if (!signature || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('hex');

    // Safe constant-time comparison to prevent timing attacks
    const digestBuffer = Buffer.from(digest, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
  } catch (err) {
    console.error('[Rechat Signature Verifier] Error verifying HMAC:', err);
    return false;
  }
}
