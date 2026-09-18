/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SMS Whitelist Safety Gate & Anti-Loop Limiter Test Suite
 * Validates suppression of Julie Brown (+19102282720), unlisted numbers,
 * rate limiting, duplicate message cooldown, and emergency killswitch.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  isAllowedSmsRecipient, 
  recordSmsDispatch, 
  resetSmsSafetyStoreForTesting,
  ALLOWED_TEST_SMS_RECIPIENTS 
} from '../../server/security/smsWhitelistGate.js';

describe('Strict Outgoing SMS Whitelist Safety Gate & Anti-Loop Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'development';
    delete process.env.SMS_KILLSWITCH;
    delete process.env.SMS_SUPPRESS_ALL;
    delete process.env.SMS_TEST_ALLOWLIST;
    resetSmsSafetyStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ---------------------------------------------------------------------------
  // 1. Julie Brown & Non-Whitelisted Suppression
  // ---------------------------------------------------------------------------
  it('1. Strictly suppresses real agent Julie Brown (+19102282720) in dev and test environments', () => {
    const julieCheck = isAllowedSmsRecipient('+19102282720', 'Marketing questions for 124 Wrightsville Ave');
    expect(julieCheck.allowed).toBe(false);
    expect(julieCheck.reason).toContain('not on test SMS allowlist');
    expect(julieCheck.maskedPhone).toBe('***-***-2720');
  });

  it('2. Strictly suppresses random unlisted numbers', () => {
    const randomCheck = isAllowedSmsRecipient('+19195551234', 'Hello there');
    expect(randomCheck.allowed).toBe(false);
    expect(randomCheck.reason).toContain('not on test SMS allowlist');
  });

  // ---------------------------------------------------------------------------
  // 2. Approved Whitelisted Test Recipients
  // ---------------------------------------------------------------------------
  it('3. Permits approved developer test numbers (Ryan +19104097120, Matt +12527170595, 555 mocks)', () => {
    const ryanCheck = isAllowedSmsRecipient('+19104097120', 'Test SMS 1');
    expect(ryanCheck.allowed).toBe(true);

    const mattCheck = isAllowedSmsRecipient('+12527170595', 'Test SMS 2');
    expect(mattCheck.allowed).toBe(true);

    const dummyCheck = isAllowedSmsRecipient('+19105550199', 'Test SMS 3');
    expect(dummyCheck.allowed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 3. Anti-Loop Hourly Rate Limiting
  // ---------------------------------------------------------------------------
  it('4. Enforces max 3 SMS per recipient per hour anti-loop limit', () => {
    const testNum = '+19104097120';

    // 1st SMS
    expect(isAllowedSmsRecipient(testNum, 'Msg 1').allowed).toBe(true);
    recordSmsDispatch(testNum, 'Msg 1');

    // 2nd SMS
    expect(isAllowedSmsRecipient(testNum, 'Msg 2').allowed).toBe(true);
    recordSmsDispatch(testNum, 'Msg 2');

    // 3rd SMS
    expect(isAllowedSmsRecipient(testNum, 'Msg 3').allowed).toBe(true);
    recordSmsDispatch(testNum, 'Msg 3');

    // 4th SMS - MUST BE BLOCKED
    const fourthCheck = isAllowedSmsRecipient(testNum, 'Msg 4');
    expect(fourthCheck.allowed).toBe(false);
    expect(fourthCheck.reason).toContain('exceeded hourly rate limit');
  });

  // ---------------------------------------------------------------------------
  // 4. Duplicate Message Cooldown (60 seconds)
  // ---------------------------------------------------------------------------
  it('5. Suppresses exact duplicate text messages within 60-second cooldown', () => {
    const testNum = '+12527170595';
    const sameMsg = 'Your open house flyer is ready for review.';

    // 1st Send
    expect(isAllowedSmsRecipient(testNum, sameMsg).allowed).toBe(true);
    recordSmsDispatch(testNum, sameMsg);

    // Immediate duplicate send
    const dupCheck = isAllowedSmsRecipient(testNum, sameMsg);
    expect(dupCheck.allowed).toBe(false);
    expect(dupCheck.reason).toContain('Duplicate SMS suppressed');

    // Different message text is allowed
    const diffCheck = isAllowedSmsRecipient(testNum, 'A different message update');
    expect(diffCheck.allowed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 5. Emergency Killswitch
  // ---------------------------------------------------------------------------
  it('6. Emergency killswitch (SMS_KILLSWITCH=true) immediately blocks all dispatch globally', () => {
    process.env.SMS_KILLSWITCH = 'true';

    const ryanCheck = isAllowedSmsRecipient('+19104097120', 'Urgent update');
    expect(ryanCheck.allowed).toBe(false);
    expect(ryanCheck.reason).toContain('killswitch active');

    const mattCheck = isAllowedSmsRecipient('+12527170595', 'Urgent update');
    expect(mattCheck.allowed).toBe(false);
    expect(mattCheck.reason).toContain('killswitch active');
  });

  // ---------------------------------------------------------------------------
  // 6. Custom Environment Whitelist
  // ---------------------------------------------------------------------------
  it('7. Dynamically incorporates SMS_TEST_ALLOWLIST environment variable', () => {
    process.env.SMS_TEST_ALLOWLIST = '+19199998888, +19198887777';

    const customCheck = isAllowedSmsRecipient('+19199998888', 'Hello custom');
    expect(customCheck.allowed).toBe(true);

    const nonCustom = isAllowedSmsRecipient('+19191112222', 'Hello unlisted');
    expect(nonCustom.allowed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 7. Full Service Protection: sendFourPointFollowUp for Julie Brown
  // ---------------------------------------------------------------------------
  it('8. sendFourPointFollowUp suppresses SMS and Email for Julie Brown (+19102282720)', async () => {
    const { sendFourPointFollowUp } = await import('../../server/services/taskTrackerService.js');
    const julieCall = {
      id: 'call_julie_test_1',
      callerName: 'Julie Brown (REALTOR®)',
      phone: '+19102282720',
      propertyAddress: '124 Wrightsville Ave',
      requestedDeliverables: ['Double-Sided 8.5x11 Property Flyer'],
      duration: '2 min',
      call_summary: 'Julie Brown requesting marketing materials'
    } as any;

    const res = await sendFourPointFollowUp(julieCall, 'https://localhost:3049');
    expect(res.smsSent).toBe(false);
    expect(res.emailSent).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 8. Full Service Protection: dispatchMissingPhotosNotification for Julie Brown
  // ---------------------------------------------------------------------------
  it('9. dispatchMissingPhotosNotification suppresses SMS for Julie Brown (+19102282720)', async () => {
    const { dispatchMissingPhotosNotification } = await import('../../server/integrations/marketingCallsService.js');
    const julieCall = {
      id: 'call_julie_test_2',
      callerName: 'Julie Brown (REALTOR®)',
      phone: '+19102282720',
      propertyAddress: '124 Wrightsville Ave',
      brokerDetails: {
        email: 'julie.brown@nestrealty.com'
      }
    } as any;

    const res = await dispatchMissingPhotosNotification(julieCall);
    expect(res.smsSent).toBe(false);
    expect(res.emailSent).toBe(false);
  });
});

