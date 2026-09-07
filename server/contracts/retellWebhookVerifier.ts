/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Webhook Signature Verifier — Phase 4A.2 Security Hardening
 * Cryptographically verifies X-Retell-Signature over the RAW HTTP request body.
 * Fails closed in production if API/signing keys are missing.
 * Operates replay protection against stale timestamps.
 */

export { 
  verifyRetellWebhookSignature, 
  generateRetellSignature, 
  RetellWebhookVerifier,
  type VerifyRetellWebhookParams,
  type VerifyRetellWebhookResult
} from '../security/retellWebhookVerifier.js';

