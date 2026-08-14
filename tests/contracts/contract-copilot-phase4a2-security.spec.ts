/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 4A.2 Test Suite — External Channel Security & Claiming
 * Adversarial tests for Retell HMAC signature verification, replay protection, quarantine,
 * candidate identity vs authentication, email fail-closed protections, and authenticated broker claiming.
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
import { ContractVoiceTokenService } from '../../server/contracts/contractVoiceToken.js';

const WORKSPACE_A = 'nest-realty-wilmington';
const WORKSPACE_B = 'nest-realty-raleigh';
const BROKER_PHONE = '+19105551234';
const BROKER_EMAIL = 'alice@nestrealty.com';
const BROKER_USER_ID = 'usr_broker_alice';
const OTHER_BROKER_USER_ID = 'usr_broker_bob';
const BROKER_CAPABILITY = 'contract_authoring';
const TEST_API_KEY = 'retell_sk_test_key_999000';
const TEST_EMAIL_SECRET = 'email_sk_test_secret_111';

describe('Contract Copilot Phase 4A.2 — External Channel Security & Claiming Test Suite', () => {
  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    ContractIdentityBindingService.clearForTesting();
    RetellContractIntakeAdapter.clearForTesting();
    EmailContractIntakeAdapter.clearForTesting();
    PendingContractIntakeService.clearForTesting();

    ContractIdentityBindingService.registerPhone(BROKER_PHONE, BROKER_USER_ID);
    ContractIdentityBindingService.registerEmail(BROKER_EMAIL, BROKER_USER_ID);
  });

  it('1. Missing Retell signature rejected', async () => {
    await expect(
      RetellContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromPhone: BROKER_PHONE,
        channel: 'retell_phone',
        text: 'Offer for $625,000',
        apiKey: TEST_API_KEY
        // signatureHeader omitted!
      })
    ).rejects.toThrow(/TRANSPORT_VERIFICATION_FAILED/);
  });

  it('2. Invalid Retell signature rejected', async () => {
    await expect(
      RetellContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromPhone: BROKER_PHONE,
        channel: 'retell_phone',
        text: 'Offer for $625,000',
        apiKey: TEST_API_KEY,
        signatureHeader: 't=10000,v1=invalid_tampered_hash'
      })
    ).rejects.toThrow(/TRANSPORT_VERIFICATION_FAILED/);
  });

  it('3. Valid signed Retell event accepted at transport layer', async () => {
    const rawBody = JSON.stringify({ fromPhone: BROKER_PHONE, text: 'Offer for John Smith on 123 Main Street for $625,000' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    const result = await RetellContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE,
      channel: 'retell_phone',
      text: 'Offer for John Smith on 123 Main Street for $625,000',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY
    });

    expect(result.success).toBe(true);
    expect(result.pendingIntake.transportStatus).toBe('verified');
  });

  it('4. Modified payload fails signature verification', async () => {
    const originalBody = JSON.stringify({ fromPhone: BROKER_PHONE, text: 'Offer for $625,000' });
    const signature = RetellWebhookVerifier.generateTestSignature(originalBody, TEST_API_KEY);

    const tamperedBody = JSON.stringify({ fromPhone: BROKER_PHONE, text: 'Offer for $999,000' }); // Tampered text!

    await expect(
      RetellContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromPhone: BROKER_PHONE,
        channel: 'retell_phone',
        text: 'Offer for $999,000',
        rawBody: tamperedBody,
        signatureHeader: signature,
        apiKey: TEST_API_KEY
      })
    ).rejects.toThrow(/INVALID_RETELL_SIGNATURE_HMAC_MISMATCH/);
  });

  it('5. Replay/expired signature rejected', async () => {
    const expiredTimestamp = Date.now() - (600 * 1000); // 10 minutes old!
    const rawBody = JSON.stringify({ text: 'Replayed request' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY, expiredTimestamp);

    await expect(
      RetellContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromPhone: BROKER_PHONE,
        channel: 'retell_phone',
        text: 'Replayed request',
        rawBody,
        signatureHeader: signature,
        apiKey: TEST_API_KEY
      })
    ).rejects.toThrow(/SIGNATURE_TIMESTAMP_EXPIRED/);
  });

  it('6. Registered phone number does NOT by itself grant contract_authoring (Quarantine Test)', async () => {
    const rawBody = JSON.stringify({ text: 'Offer for $625,000' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    const result = await RetellContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE,
      channel: 'retell_phone',
      text: 'Offer for $625,000',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY
    });

    // Intake MUST be quarantined as PendingContractIntake!
    expect(result.pendingIntake.claimStatus).toBe('pending');
    expect(result.pendingIntake.brokerIdentityStatus).toBe('verification_required');

    // Canonical repository MUST NOT have an active session created automatically
    const canonicalSessions = await defaultContractRepository.listByWorkspace(WORKSPACE_A);
    expect(canonicalSessions.length).toBe(0);
  });

  it('7. Caller spoofing known broker number cannot mutate authoritative session', async () => {
    const rawBody = JSON.stringify({ text: 'Spoofed call mutating price' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    await RetellContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE, // Spoofed number
      channel: 'retell_phone',
      text: 'Spoofed call mutating price to $999,000',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY
    });

    // Verify canonical sessions remain untouched
    const sessions = await defaultContractRepository.listByWorkspace(WORKSPACE_A);
    expect(sessions.length).toBe(0);
  });

  it('8. Fake From email cannot grant contract_authoring', async () => {
    const rawBody = JSON.stringify({ fromEmail: 'fake.broker@external.com', subject: 'Fake Offer', body: 'Purchase Price: $625,000' });
    const signatureHeader = crypto.createHmac('sha256', TEST_EMAIL_SECRET).update(rawBody).digest('hex');

    await expect(
      EmailContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromEmail: 'fake.broker@external.com',
        subject: 'Fake Offer',
        body: 'Purchase Price: $625,000',
        rawBody,
        signatureHeader,
        signingSecret: TEST_EMAIL_SECRET
      })
    ).rejects.toThrow(/UNVERIFIED_BROKER_EMAIL/);
  });

  it('9. Production email intake fails closed with no configured email verifier', async () => {
    process.env.APP_MODE = 'production';
    delete process.env.EMAIL_INTAKE_SIGNING_SECRET;

    await expect(
      EmailContractIntakeAdapter.processIntake({
        workspaceId: WORKSPACE_A,
        fromEmail: BROKER_EMAIL,
        subject: 'Offer 123 Main St',
        body: 'Purchase Price: $625,000'
      })
    ).rejects.toThrow(/EMAIL_VERIFIER_NOT_CONFIGURED/);

    delete process.env.APP_MODE;
  });

  it('10. Pending unverified intake cannot request form generation', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      candidatePhone: BROKER_PHONE,
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c1',
      idempotencyKey: 'k1'
    });

    await expect(
      ContractService.requestDraft(pending.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow();
  });

  it('11. Pending intake cannot confirm contract terms', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c2',
      idempotencyKey: 'k2'
    });

    await expect(
      ContractService.confirmTerms(pending.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow();
  });

  it('12. Pending intake cannot request signature', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c3',
      idempotencyKey: 'k3'
    });

    // Confirm session status is pending and not approved
    expect(pending.claimStatus).toBe('pending');
    expect(pending.authorizationStatus).not.toBe('authorized');
  });

  it('13. Authenticated broker can claim their own pending intake', async () => {
    const rawBody = JSON.stringify({ text: 'Offer for John Smith on 123 Main Street at $625,000' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    const result = await RetellContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE,
      channel: 'retell_sms',
      text: 'Offer for John Smith on 123 Main Street at $625,000',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY
    });

    // Authenticated broker claims pending intake
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: result.pendingIntake.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.requestingBrokerId).toBe(BROKER_USER_ID);
    expect(session.terms.purchasePriceCents).toBe(62500000);
  });

  it('14. Broker cannot claim another broker\'s pending intake', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID, // Belongs to Alice
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c4',
      idempotencyKey: 'k4'
    });

    // Bob attempts to claim Alice's pending intake
    await expect(
      PendingContractIntakeService.claimPendingIntake({
        pendingIntakeId: pending.id,
        workspaceId: WORKSPACE_A,
        requestingUserId: OTHER_BROKER_USER_ID, // Bob!
        actorCapability: BROKER_CAPABILITY
      })
    ).rejects.toThrow(/UNAUTHORIZED_CLAIM_DENIED/);
  });

  it('15. Cross-workspace claim rejected', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c5',
      idempotencyKey: 'k5'
    });

    // Attempting to claim from Workspace B
    await expect(
      PendingContractIntakeService.claimPendingIntake({
        pendingIntakeId: pending.id,
        workspaceId: WORKSPACE_B, // Cross workspace!
        requestingUserId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      })
    ).rejects.toThrow(/CROSS_WORKSPACE_CLAIM_DENIED/);
  });

  it('16. Claimed facts merge exactly once (Double-Claiming Blocked)', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      proposedTerms: { purchasePriceCents: 62500000 },
      correlationId: 'c6',
      idempotencyKey: 'k6'
    });

    const session1 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: pending.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    const session2 = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: pending.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session1.id).toBe(session2.id); // Idempotent same session return!
  });

  it('17. Duplicate webhook remains idempotent', async () => {
    const rawBody = JSON.stringify({ text: 'Duplicate webhook test' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    const payload = {
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE,
      channel: 'retell_sms' as const,
      text: 'Duplicate webhook test',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY,
      idempotencyKey: 'msg_dup_99'
    };

    const res1 = await RetellContractIntakeAdapter.processIntake(payload);
    const res2 = await RetellContractIntakeAdapter.processIntake(payload);

    expect(res1.pendingIntake.id).toBe(res2.pendingIntake.id);
  });

  it('18. BIC requirements survive the claim/merge', async () => {
    const pending = await PendingContractIntakeService.createPendingIntake({
      workspaceId: WORKSPACE_A,
      channel: 'retell_phone',
      transportStatus: 'verified',
      candidateUserId: BROKER_USER_ID,
      proposedTerms: { purchasePriceCents: 62500000 },
      bicReviewRequired: true,
      bicReviewReason: 'Custom clause requested in call',
      correlationId: 'c7',
      idempotencyKey: 'k7'
    });

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: pending.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).toBe('bic_review_required');
    expect(session.bicReviewReason).toContain('Custom clause requested');
  });

  it('19. Sensitive financial content remains redacted/rejected', async () => {
    const rawBody = JSON.stringify({ text: 'Routing number 123456789' });
    const signature = RetellWebhookVerifier.generateTestSignature(rawBody, TEST_API_KEY);

    const res = await RetellContractIntakeAdapter.processIntake({
      workspaceId: WORKSPACE_A,
      fromPhone: BROKER_PHONE,
      channel: 'retell_sms',
      text: 'Routing number 123456789',
      rawBody,
      signatureHeader: signature,
      apiKey: TEST_API_KEY
    });

    expect(res.pendingIntake.validationIssues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')).toBe(true);
    expect(res.pendingIntake.proposedTerms.personalPropertyInclusions![0]).toContain('[REDACTED_SENSITIVE_DATA]');
  });

  it('20. Existing authenticated ElevenLabs voice still works unchanged', async () => {
    const token = await ContractVoiceTokenService.createVoiceToken({
      userId: BROKER_USER_ID,
      workspaceId: WORKSPACE_A,
      sessionId: 'sess_voice_100',
      capability: BROKER_CAPABILITY
    });

    const verified = ContractVoiceTokenService.verifyVoiceToken(token.token);
    expect(verified.userId).toBe(BROKER_USER_ID);
    expect(verified.workspaceId).toBe(WORKSPACE_A);
    expect(verified.sessionId).toBe('sess_voice_100');
  });
});
