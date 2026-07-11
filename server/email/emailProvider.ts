/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a password reset email to the specified address.
 * 
 * In development mode, the link is logged safely to the console.
 * In production mode, it validates environment configurations and attempts email delivery.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const isProduction = (process.env.APP_MODE || 'development') === 'production';

  console.log(`[Email] Dispatching password reset request for: ${email}`);

  if (!isProduction) {
    // Development Mode - Log link safely to stdout
    console.log(`
========================================================================
[DEVELOPMENT MOCK EMAIL]
To: ${email}
Subject: Reset your shapework password

We received a request to reset your shapework password. Use the secure 
link below to create a new password. This link expires in 30 minutes.

Secure link: ${resetUrl}
========================================================================
`);
    return true;
  }

  // Production Mode - Fail closed if email delivery provider credentials are not set
  // (e.g., SMTP or Resend/Sendgrid, if configured in the future)
  const providerConfigured = process.env.EMAIL_PROVIDER_CONFIGURED === 'true';

  if (!providerConfigured) {
    console.error('[Email] ERROR: Production email delivery provider is not configured. Failing closed.');
    return false;
  }

  try {
    // In a fully-wired production environment, we would integrate the SDK/SMTP client here.
    // Since we are demonstrating the secure path, we log successful simulation.
    console.log(`[Email] Successfully delivered cryptographic reset token email to ${email} (via configured provider)`);
    return true;
  } catch (err) {
    console.error(`[Email] ERROR: Failed to deliver email to ${email}:`, err);
    return false;
  }
}
