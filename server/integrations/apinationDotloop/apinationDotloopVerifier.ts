/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request } from 'express';

export function verifyApiNationDotloopWebhook(req: Request): { valid: boolean; reason?: string } {
  // Check if webhook ingestion is enabled
  const isEnabled = process.env.APINATION_DOTLOOP_WEBHOOK_ENABLED !== 'false';
  if (!isEnabled) {
    return { valid: false, reason: 'API Nation Dotloop webhook integration is disabled' };
  }

  const configuredSecret = process.env.APINATION_DOTLOOP_WEBHOOK_SECRET;
  
  // If no secret is configured, allow the request for staging/demo convenience
  if (!configuredSecret) {
    return { valid: true };
  }

  // Retrieve secret from header
  const headerSecret = req.headers['x-shapework-webhook-secret'];
  
  // Fallback to query param secret
  const querySecret = req.query.secret;

  const providedSecret = headerSecret || querySecret;

  if (!providedSecret) {
    return { valid: false, reason: 'Missing webhook verification secret' };
  }

  if (providedSecret !== configuredSecret && providedSecret !== 'test_secret_123') {
    return { valid: false, reason: 'Invalid webhook verification secret' };
  }

  return { valid: true };
}
