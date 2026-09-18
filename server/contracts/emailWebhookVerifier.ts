/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Email Webhook Verifier — Phase 4A.2 Security Hardening
 * Provider-neutral email webhook signature verifier interface.
 * Fails closed in production if no verified email intake provider is configured.
 */

import crypto from 'crypto';

export class EmailWebhookVerifier {
  public static verifySignature(params: {
    rawBody: string;
    signatureHeader?: string;
    signingSecret?: string;
  }): { valid: boolean; reason?: string } {
    const { rawBody, signatureHeader, signingSecret = process.env.EMAIL_INTAKE_SIGNING_SECRET } = params;
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';

    if (isProduction && (!signingSecret || signingSecret.trim() === '')) {
      const err = new Error('EMAIL_VERIFIER_NOT_CONFIGURED: Production email contract intake is disabled because no authenticated inbound email provider / signing secret is configured.');
      (err as any).code = 'EMAIL_VERIFIER_NOT_CONFIGURED';
      throw err;
    }

    if (!signingSecret) {
      return { valid: false, reason: 'EMAIL_VERIFIER_NOT_CONFIGURED' };
    }

    if (!signatureHeader) {
      return { valid: false, reason: 'MISSING_EMAIL_SIGNATURE_HEADER' };
    }

    const expected = crypto.createHmac('sha256', signingSecret).update(rawBody).digest('hex');
    const bufExpected = Buffer.from(expected, 'hex');
    const bufActual = Buffer.from(signatureHeader, 'hex');

    if (bufExpected.length !== bufActual.length || !crypto.timingSafeEqual(bufExpected, bufActual)) {
      return { valid: false, reason: 'INVALID_EMAIL_SIGNATURE_HMAC_MISMATCH' };
    }

    return { valid: true };
  }
}
