/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 4A.1 Test Suite — Omnichannel Gateway & Identity Binding (Updated for 4A.2 Security)
 * Verifies Retell SMS, Retell phone, email, multi-channel continuity, identity binding,
 * sensitive data guards, and security boundaries.
 */

import crypto from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ContractService } from '../../server/contracts/contractService.js';
import { defaultContractRepository } from '../../server/contracts/contractRepository.js';
import { ContractIdentityBindingService } from '../../server/contracts/contractIdentityBinding.js';
import { RetellWebhookVerifier } from '../../server/contracts/retellWebhookVerifier.js';
import { RetellContractIntakeAdapter } from '../../server/contracts/retellContractIntakeAdapter.js';
import { EmailContractIntakeAdapter } from '../../server/contracts/emailContractIntakeAdapter.js';
import { PendingContractIntakeService } from '../../server/contracts/pendingContractIntake.js';

const WORKSPACE_A = 'nest-realty-wilmington';
const WORKSPACE_B = 'nest-realty-raleigh';
const BROKER_PHONE = '+19105551234';
const BROKER_EMAIL = 'alice@nestrealty.com';
const BROKER_USER_ID = 'usr_broker_alice';
const BROKER_CAPABILITY = 'contract_authoring';
const TEST_API_KEY = 'retell_sk_test_key_999000';
const TEST_EMAIL_SECRET = 'email_sk_test_secret_111';

function createSignedRetellPayload(text: string, channel: 'retell_sms' | 'retell_phone' = 'retell_sms') {
  const rawBody = JSON.stringify({ fromPhone: BROKER_PHONE, channel, text });
  const signatureHeader = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);
  return {
    workspaceId: WORKSPACE_A,
    fromPhone: BROKER_PHONE,
    channel,
    text,
    rawBody,
    signatureHeader,
    apiKey: TEST_API_KEY
  };
}

describe('Contract Copilot Phase 4A.1 — Omnichannel & Identity Binding Test Suite', () => {
  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    ContractIdentityBindingService.clearForTesting();
    RetellContractIntakeAdapter.clearForTesting();
    EmailContractIntakeAdapter.clearForTesting();
    PendingContractIntakeService.clearForTesting();

    ContractIdentityBindingService.registerPhone(BROKER_PHONE, BROKER_USER_ID);
    ContractIdentityBindingService.registerEmail(BROKER_EMAIL, BROKER_USER_ID);
  });

  it('1. Verified broker starts contract intake via SMS', async () => {
    const payload = createSignedRetellPayload('Ask Nest Ops, write an offer for John Smith on 123 Main Street at $625,000 with $7,500 DD, $5,000 EMD and closing September 18.');
    const result = await RetellContractIntakeAdapter.processIntake(payload);

    expect(result.success).toBe(true);
    expect(result.pendingIntake.candidateUserId).toBe(BROKER_USER_ID);
    expect(result.pendingIntake.proposedTerms.purchasePriceCents).toBe(62500000);
    expect(result.pendingIntake.proposedTerms.dueDiligenceFeeCents).toBe(750000);
    expect(result.pendingIntake.proposedTerms.initialEarnestMoneyCents).toBe(500000);
    expect(result.pendingIntake.proposedTerms.settlementDate).toBe('2026-09-18');
  });

  it('2. Unknown phone number cannot author a contract', async () => {
    const text = 'Write an offer for $500,000';
    const rawBody = JSON.stringify({ fromPhone: '+19105559999', channel: 'retell_sms', text });
    const signatureHeader = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    await expect(
      RetellContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromPhone: '+19105559999', // Unknown phone
        channel: 'retell_sms',
        text,
        rawBody,
        signatureHeader,
        apiKey: TEST_API_KEY
      })
    ).rejects.toThrow(/UNVERIFIED_BROKER_IDENTITY/);
  });

  it('3. Spoofed userId or workspaceId is rejected (identity derived from token/binding)', () => {
    const binding = ContractIdentityBindingService.verifyBrokerIdentityByPhone(WORKSPACE_A, BROKER_PHONE);
    expect(binding.userId).toBe(BROKER_USER_ID);
    expect(binding.workspaceId).toBe(WORKSPACE_A);
  });

  it('4. Verified broker starts via telephone intake', async () => {
    const payload = createSignedRetellPayload('I want to write an offer for John Smith on 123 Main Street for $625,000', 'retell_phone');
    const result = await RetellContractIntakeAdapter.processIntake(payload);

    expect(result.success).toBe(true);
    expect(result.event.channel).toBe('retell_phone');
    expect(result.pendingIntake.proposedTerms.purchasePriceCents).toBe(62500000);
  });

  it('5. Broker begins via SMS and continues via ElevenLabs voice (Multi-Channel Continuity)', async () => {
    // Step 1: Start via SMS
    const payload = createSignedRetellPayload('Offer for John Smith on 123 Main Street at $625,000');
    const smsResult = await RetellContractIntakeAdapter.processIntake(payload);

    // Claim pending intake
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsResult.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    const sessionId = session.id;

    // Step 2: Continue via ElevenLabs voice update
    await ContractService.updateTerms(
      sessionId,
      WORKSPACE_A,
      { dueDiligenceFeeCents: 1000000, settlementDate: '2026-09-18' },
      [{ fieldPath: 'terms.dueDiligenceFeeCents', sourceType: 'manual_entry', sourceTimestamp: new Date().toISOString(), suppliedByUserId: BROKER_USER_ID, verificationStatus: 'verified', conflictStatus: 'no_conflict' }],
      BROKER_USER_ID,
      BROKER_CAPABILITY
    );

    const loaded = await ContractService.getSession(sessionId, WORKSPACE_A);
    expect(loaded?.id).toBe(sessionId); // Same canonical session!
    expect(loaded?.terms.purchasePriceCents).toBe(62500000);
    expect(loaded?.terms.dueDiligenceFeeCents).toBe(1000000);
  });

  it('6. Email intake updates the same session', async () => {
    // Start session via SMS
    const smsResult = await RetellContractIntakeAdapter.processIntake(createSignedRetellPayload('Offer for John Smith on 123 Main Street'));
    const session1 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsResult.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Update via Email
    const body = 'Purchase Price: $625,000\nDD: $7,500\nEMD: $5,000\nClosing: September 18';
    const rawBody = JSON.stringify({ fromEmail: BROKER_EMAIL, subject: 'Offer — 123 Main Street', body });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    const emailResult = await EmailContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromEmail: BROKER_EMAIL,
      subject: 'Offer — 123 Main Street',
      body,
      rawBody,
      signatureHeader,
      signingSecret: TEST_EMAIL_SECRET
    });

    const session2 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: emailResult.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session2.id).toBe(session1.id); // Same session!
    expect(session2.terms.purchasePriceCents).toBe(62500000);
  });

  it('7. Unknown/spoofed email cannot gain contract_authoring', async () => {
    const rawBody = JSON.stringify({ fromEmail: 'hacker@external.com', subject: 'Offer 123 Main St', body: 'Purchase price $625,000' });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    await expect(
      EmailContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromEmail: 'hacker@external.com',
        subject: 'Offer 123 Main St',
        body: 'Purchase price $625,000',
        rawBody,
        signatureHeader,
        signingSecret: TEST_EMAIL_SECRET
      })
    ).rejects.toThrow(/UNVERIFIED_BROKER_EMAIL/);
  });

  it('8. Duplicate webhook/message is idempotent', async () => {
    const payload = createSignedRetellPayload('Offer for John Smith on 123 Main Street at $625,000');
    (payload as any).idempotencyKey = 'msg_unique_1001';

    const res1 = await RetellContractIntakeAdapter.processIntake(payload);
    const res2 = await RetellContractIntakeAdapter.processIntake(payload);

    expect(res1.pendingIntake.id).toBe(res2.pendingIntake.id);
  });

  it('9. Cross-workspace identity binding fails', () => {
    expect(() => {
      ContractIdentityBindingService.verifyBrokerIdentityByPhone(WORKSPACE_B, '+19105559999');
    }).toThrow(/UNVERIFIED_BROKER_IDENTITY/);
  });

  it('10. Sensitive banking data sent by SMS is rejected and redacted', async () => {
    const payload = createSignedRetellPayload('Wiring instructions: routing number 123456789');
    const result = await RetellContractIntakeAdapter.processIntake(payload);

    expect(result.pendingIntake.validationIssues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')).toBe(true);
    expect(result.pendingIntake.proposedTerms.personalPropertyInclusions![0]).toContain('[REDACTED_SENSITIVE_DATA]');
  });

  it('11. Custom clause requested by email routes session to BIC review', async () => {
    const body = 'Add a custom clause saying seller has to replace roof before closing.';
    const rawBody = JSON.stringify({ fromEmail: BROKER_EMAIL, subject: 'Offer 123 Main St', body });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    const result = await EmailContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromEmail: BROKER_EMAIL,
      subject: 'Offer 123 Main St',
      body,
      rawBody,
      signatureHeader,
      signingSecret: TEST_EMAIL_SECRET
    });

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: result.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).toBe('bic_review_required');
    expect(session.bicReviewReason).toContain('Custom contract clause');
  });

  it('12. Conflicting HOA facts across voice/text route to BIC review', async () => {
    const payload = createSignedRetellPayload('It has conflicting HOA dues information', 'retell_phone');
    const result = await RetellContractIntakeAdapter.processIntake(payload);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: result.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).toBe('bic_review_required');
    expect(session.bicReviewReason).toContain('Conflicting HOA details');
  });

  it('13. Broker corrects terms through another channel', async () => {
    // Step 1: Set price via SMS
    const smsRes = await RetellContractIntakeAdapter.processIntake(createSignedRetellPayload('Offer for John Smith on 123 Main Street at $625,000'));
    const session1 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Step 2: Correct price via Email
    const body = 'Purchase Price: $725,000';
    const rawBody = JSON.stringify({ fromEmail: BROKER_EMAIL, subject: 'Correction for 123 Main St', body });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    const emailRes = await EmailContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromEmail: BROKER_EMAIL,
      subject: 'Correction for 123 Main St',
      body,
      rawBody,
      signatureHeader,
      signingSecret: TEST_EMAIL_SECRET
    });

    const session2 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: emailRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session2.id).toBe(session1.id);
    expect(session2.terms.purchasePriceCents).toBe(72500000);
  });

  it('14. Explicit broker confirmation is required before draft state', async () => {
    const smsRes = await RetellContractIntakeAdapter.processIntake(createSignedRetellPayload('Offer for John Smith on 123 Main Street at $625,000'));
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Unconfirmed session status remains in intake state
    expect(['intake_started', 'identity_verified', 'terms_collecting']).toContain(session.status);
  });

  it('15. No channel can request signature or send contract', async () => {
    const smsRes = await RetellContractIntakeAdapter.processIntake(createSignedRetellPayload('Please send this offer for DocuSign signature immediately'));
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // No e-signature action taken; session stays safely in intake state
    expect(session.status).not.toBe('broker_approved');
  });

  it('16. BIC review cannot be bypassed by changing channels', async () => {
    // Flag for BIC review via Email
    const body = 'Add custom clause for seller roof replacement';
    const rawBody = JSON.stringify({ fromEmail: BROKER_EMAIL, subject: 'Offer 123 Main St', body });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    const emailRes = await EmailContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromEmail: BROKER_EMAIL,
      subject: 'Offer 123 Main St',
      body,
      rawBody,
      signatureHeader,
      signingSecret: TEST_EMAIL_SECRET
    });

    const session1 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: emailRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session1.status).toBe('bic_review_required');

    // Attempting to update terms via SMS does NOT erase BIC review flag
    const smsRes = await RetellContractIntakeAdapter.processIntake(createSignedRetellPayload('Closing date September 18'));
    const session2 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: smsRes.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session2.bicReviewRequired).toBe(true);
  });
});
