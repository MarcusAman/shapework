/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Team Member Invitation & Password Setup Token Generation
 */

import { describe, it, expect } from 'vitest';
import { isAllowedEmailRecipient, sendWelcomeInvitationEmail } from '../../server/email/emailProvider.js';
import { createAccountSetupToken, verifyAndConsumePasswordResetToken } from '../../server/auth/passwordReset.js';

describe('Team Member Invitation & Email Delivery Suite', () => {
  it('1. Verifies marcus.aman@gmail.com is an authorized recipient for onboarding invites', () => {
    expect(isAllowedEmailRecipient('marcus.aman@gmail.com')).toBe(true);
    expect(isAllowedEmailRecipient('MARCUS.AMAN@GMAIL.COM')).toBe(true);
  });

  it('2. Generates 7-day secure setup token for Marty Supreme (marcus.aman@gmail.com)', async () => {
    const userId = 'usr_marty_supreme_test';
    const rawToken = await createAccountSetupToken(userId);

    expect(rawToken).toBeDefined();
    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64); // 32 bytes in hex

    // Verify token can be verified and consumed
    const resolvedUserId = await verifyAndConsumePasswordResetToken(rawToken);
    expect(resolvedUserId).toBe(userId);
  });

  it('3. Dispatches Apple Light Mode welcome email payload for Marty Supreme', async () => {
    const setupUrl = 'https://shapework.co/reset-password?token=test_raw_token&setup=true&email=marcus.aman%40gmail.com';
    const result = await sendWelcomeInvitationEmail(
      'marcus.aman@gmail.com',
      'Marty Supreme',
      setupUrl,
      'Broker-in-Charge'
    );

    expect(result.success).toBe(true);
    expect(result.setupUrl).toBe(setupUrl);
  });
});
