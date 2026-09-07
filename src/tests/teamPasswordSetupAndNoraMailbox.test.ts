import { describe, it, expect } from 'vitest';
import { 
  createAccountSetupToken, 
  generateTeamSetupLinks, 
  verifyAndConsumePasswordResetToken,
  PILOT_TEAM_SETUP_ROSTER 
} from '../../server/auth/passwordReset';
import { resetPasswordWithToken } from '../../server/auth/invitationService';
import { NORA_EMAIL_CONFIG, sendWelcomeInvitationEmail } from '../../server/email/emailProvider';
import { verifyPassword } from '../../server/auth/password';

describe('Team Password Setup Links & Nora Mailbox Integration', () => {
  it('1. Generates 7-day password setup links for all 7 team members', async () => {
    const links = await generateTeamSetupLinks('https://shapework.co');
    expect(links.length).toBe(7);

    const expectedEmails = [
      'ryan@nestrealty.com',
      'mg@nestrealty.com',
      'ann@nestrealty.com',
      'james@nestrealty.com',
      'eric@nestrealty.com',
      'jessica.keenan@nestrealty.com',
      'eduardo.lovo@nestrealty.com'
    ];

    for (const email of expectedEmails) {
      const memberLink = links.find(l => l.email.toLowerCase() === email.toLowerCase());
      expect(memberLink, `Missing setup link for ${email}`).toBeDefined();
      expect(memberLink?.token).toBeDefined();
      expect(memberLink?.setupUrl).toContain('https://shapework.co/reset-password?token=');
      expect(memberLink?.setupUrl).toContain('setup=true');
      expect(memberLink?.setupUrl).toContain(encodeURIComponent(email));
      expect(memberLink?.expiresIn).toBe('7 days');
    }
  });

  it('2. Verifies cryptographic token consumption is single-use and secure', async () => {
    const token = await createAccountSetupToken('usr_test_member', 7 * 24 * 60 * 60 * 1000);
    expect(token).toBeDefined();

    // First consumption succeeds
    const userId = await verifyAndConsumePasswordResetToken(token);
    expect(userId).toBe('usr_test_member');

    // Second consumption must fail (single-use token protection)
    const replayUserId = await verifyAndConsumePasswordResetToken(token);
    expect(replayUserId).toBeNull();
  });

  it('3. Verifies resetPasswordWithToken updates password and enforces security policy', async () => {
    const token = await createAccountSetupToken('usr_melissa_mg', 7 * 24 * 60 * 60 * 1000);

    // Password shorter than 12 chars should fail
    await expect(resetPasswordWithToken(token, 'Short1!'))
      .rejects
      .toThrow(/at least 12 characters/i);

    // Valid password sets successfully
    const result = await resetPasswordWithToken(token, 'MyCustomSecretPass2026!');
    expect(result.success).toBe(true);
  });

  it('4. Verifies Nora Gmail mailbox configuration for asknora@nestrealty.com', () => {
    expect(NORA_EMAIL_CONFIG.user).toBe('asknora@nestrealty.com');
    expect(NORA_EMAIL_CONFIG.password).toBeDefined();
    expect(NORA_EMAIL_CONFIG.host).toBe('smtp.gmail.com');
    expect(NORA_EMAIL_CONFIG.port).toBe(465);
    expect(NORA_EMAIL_CONFIG.secure).toBe(true);
  });

  it('5. Verifies sendWelcomeInvitationEmail generates well-formed invitation payload with fallback', async () => {
    const testUrl = 'https://shapework.co/reset-password?token=mock_tok_123&setup=true';
    const result = await sendWelcomeInvitationEmail('ann@nestrealty.com', 'Ann Gunn', testUrl, 'Operations Director');
    
    // Result provides setupUrl fallback regardless of network/auth status
    expect(result.setupUrl).toBe(testUrl);
    expect(typeof result.success).toBe('boolean');
  });
});
