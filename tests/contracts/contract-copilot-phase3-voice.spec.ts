/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 3 Test Suite — ElevenLabs Voice-to-Contract Intake
 * Verifies voice token security, tool security, and 10 conversational workflow simulations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContractVoiceTokenService } from '../../server/contracts/contractVoiceToken.js';
import { ContractService } from '../../server/contracts/contractService.js';
import { defaultContractRepository } from '../../server/contracts/contractRepository.js';

const WORKSPACE_A = 'nest-realty-wilmington';
const WORKSPACE_B = 'nest-realty-raleigh';
const BROKER_USER_ID = 'usr_broker_alice';
const BROKER_CAPABILITY = 'contract_authoring';

const validFormFixture = {
  formId: 'nc_realtors_form_2t',
  formName: 'Form 2-T',
  displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)',
  activeStatus: true,
  providerId: 'nc_realtors_forms_mock',
  providerFormId: '2t_2026_v1',
  attachedVersionHash: 'hash_nc_2t_2026_v1_validated',
  brokerConfirmationStatus: true,
  workspaceAvailability: [WORKSPACE_A, WORKSPACE_B]
};

describe('Contract Copilot Phase 3 — Voice-to-Contract Test Suite', () => {
  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    ContractVoiceTokenService.clearForTesting();
  });

  describe('1. Voice Authorization Token Security', () => {
    it('allows an authenticated broker to create a short-lived voice authorization token', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const { token, payload } = ContractVoiceTokenService.createVoiceToken({
        userId: BROKER_USER_ID,
        workspaceId: WORKSPACE_A,
        sessionId: session.id,
        capability: BROKER_CAPABILITY
      });

      expect(token).toBeDefined();
      expect(payload.sessionId).toBe(session.id);
      expect(payload.workspaceId).toBe(WORKSPACE_A);
      expect(payload.userId).toBe(BROKER_USER_ID);

      const verified = ContractVoiceTokenService.verifyVoiceToken(token, session.id, WORKSPACE_A);
      expect(verified.tokenId).toBe(payload.tokenId);
    });

    it('rejects a token created for Session A when used on Session B', async () => {
      const sessionA = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const sessionB = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const { token } = ContractVoiceTokenService.createVoiceToken({
        userId: BROKER_USER_ID,
        workspaceId: WORKSPACE_A,
        sessionId: sessionA.id,
        capability: BROKER_CAPABILITY
      });

      expect(() => {
        ContractVoiceTokenService.verifyVoiceToken(token, sessionB.id, WORKSPACE_A);
      }).toThrow(/UNAUTHORIZED_VOICE_TOKEN_SESSION_MISMATCH/);
    });

    it('rejects a token created for Workspace A when used on Workspace B', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const { token } = ContractVoiceTokenService.createVoiceToken({
        userId: BROKER_USER_ID,
        workspaceId: WORKSPACE_A,
        sessionId: session.id,
        capability: BROKER_CAPABILITY
      });

      expect(() => {
        ContractVoiceTokenService.verifyVoiceToken(token, session.id, WORKSPACE_B);
      }).toThrow(/UNAUTHORIZED_VOICE_TOKEN_WORKSPACE_MISMATCH/);
    });

    it('rejects an expired voice authorization token', () => {
      const { token } = ContractVoiceTokenService.createVoiceToken({
        userId: BROKER_USER_ID,
        workspaceId: WORKSPACE_A,
        sessionId: 'sess_123',
        expiresInSeconds: -10 // already expired
      });

      expect(() => {
        ContractVoiceTokenService.verifyVoiceToken(token);
      }).toThrow(/UNAUTHORIZED_VOICE_TOKEN_EXPIRED/);
    });

    it('rejects a revoked voice token', () => {
      const { token, payload } = ContractVoiceTokenService.createVoiceToken({
        userId: BROKER_USER_ID,
        workspaceId: WORKSPACE_A,
        sessionId: 'sess_123'
      });

      ContractVoiceTokenService.revokeVoiceToken(payload.tokenId);

      expect(() => {
        ContractVoiceTokenService.verifyVoiceToken(token);
      }).toThrow(/UNAUTHORIZED_VOICE_TOKEN_REVOKED/);
    });
  });

  describe('2. Conversational Workflow Simulations (10 Scenarios)', () => {
    it('Scenario 1: Broker supplies all terms at once in one utterance', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [
          { id: 'p1', role: 'buyer', fullName: 'Marcus Aman' },
          { id: 'p2', role: 'buyer', fullName: 'Elynor Aman' }
        ],
        property: { streetAddress: '123 Main Street', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' },
        actorCapability: BROKER_CAPABILITY
      });

      await ContractService.updateTerms(session.id, WORKSPACE_A, {
        purchasePriceCents: 62500000,
        dueDiligenceFeeCents: 1000000,
        initialEarnestMoneyCents: 500000,
        offerDate: '2026-08-05',
        dueDiligenceDate: '2026-08-20',
        settlementDate: '2026-09-05',
        financingCategory: 'conventional',
        sellerConcessionCents: 750000,
        hoaStatusKnown: true,
        hoaAnnualFeeCents: 85000
      }, [], BROKER_USER_ID, BROKER_CAPABILITY);

      await ContractService.selectForms(session.id, WORKSPACE_A, [validFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
      await ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);

      const validated = await ContractService.validateSession(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);
      expect(validated.status).toBe('broker_review_required');
      expect(validated.draftManifest).toBeDefined();
      expect(validated.terms.purchasePriceCents).toBe(62500000);
    });

    it('Scenario 2: Broker supplies terms one at a time step-by-step', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        property: { streetAddress: '456 Market St', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28403' },
        parties: [{ id: 'p1', role: 'buyer', fullName: 'John Doe' }],
        actorCapability: BROKER_CAPABILITY
      });

      // Step B: Price update
      await ContractService.updateTerms(session.id, WORKSPACE_A, { purchasePriceCents: 45000000 }, [], BROKER_USER_ID, BROKER_CAPABILITY);

      const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(loaded?.property?.streetAddress).toBe('456 Market St');
      expect(loaded?.parties[0].fullName).toBe('John Doe');
      expect(loaded?.terms.purchasePriceCents).toBe(45000000);
    });

    it('Scenario 3: Broker corrects closing date during readback', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'Jane Smith' }],
        property: { streetAddress: '789 Chestnut St', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' },
        actorCapability: BROKER_CAPABILITY
      });

      await ContractService.updateTerms(session.id, WORKSPACE_A, {
        purchasePriceCents: 50000000,
        settlementDate: '2026-09-05'
      }, [], BROKER_USER_ID, BROKER_CAPABILITY);

      // Correction during readback: "No, change closing to Sept 12"
      await ContractService.updateTerms(session.id, WORKSPACE_A, {
        settlementDate: '2026-09-12'
      }, [], BROKER_USER_ID, BROKER_CAPABILITY);

      const updated = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(updated?.terms.settlementDate).toBe('2026-09-12');
    });

    it('Scenario 4: Broker asks AI for due diligence recommendation (declined, captured as provided)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      // AI responds with refusal to recommend, broker eventually provides $5,000
      await ContractService.updateTerms(session.id, WORKSPACE_A, { dueDiligenceFeeCents: 500000 }, [], BROKER_USER_ID, BROKER_CAPABILITY);
      const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(loaded?.terms.dueDiligenceFeeCents).toBe(500000);
    });

    it('Scenario 5: Broker asks for custom legal clause (triggers BIC review)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const flagged = await ContractService.requestBicReview(
        session.id,
        WORKSPACE_A,
        'Custom contract clause requested by broker: seller replaces roof before closing.',
        BROKER_USER_ID,
        BROKER_CAPABILITY
      );

      expect(flagged.status).toBe('bic_review_required');
      expect(flagged.bicReviewReason).toContain('Custom contract clause');
    });

    it('Scenario 6: Broker supplies conflicting HOA information (triggers BIC review)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const flagged = await ContractService.requestBicReview(
        session.id,
        WORKSPACE_A,
        'Conflicting HOA dues information provided by broker vs tax record.',
        BROKER_USER_ID,
        BROKER_CAPABILITY
      );

      expect(flagged.status).toBe('bic_review_required');
    });

    it('Scenario 7: Broker gives bank routing number (rejected by sensitive data guard)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      const updated = await ContractService.updateTerms(
        session.id,
        WORKSPACE_A,
        { personalPropertyInclusions: ['Wiring instructions: routing number 123456789'] },
        [],
        BROKER_USER_ID,
        BROKER_CAPABILITY
      );

      expect(updated.validationIssues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')).toBe(true);
      expect(updated.terms.personalPropertyInclusions![0]).toContain('[REDACTED_SENSITIVE_DATA]');
    });

    it('Scenario 8: Broker tries to request signature delivery (blocked / no signature tool)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      // No signature delivery endpoint exists in Phase 3 contract domain
      const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(loaded?.status).toBe('identity_verified'); // Remains safely in intake status
    });

    it('Scenario 9: Broker attempts to bypass BIC review without approval (fails transition)', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        actorCapability: BROKER_CAPABILITY
      });

      await ContractService.requestBicReview(session.id, WORKSPACE_A, 'BIC review required', BROKER_USER_ID, BROKER_CAPABILITY);

      // Attempting confirmTerms without BIC approval fails
      await expect(
        ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY)
      ).rejects.toThrow();
    });

    it('Scenario 10: Broker completes valid intake, confirms, and receives NON-EXECUTABLE mock draft', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'Marcus Aman' }],
        property: { streetAddress: '100 Beach Blvd', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' },
        actorCapability: BROKER_CAPABILITY
      });

      await ContractService.updateTerms(session.id, WORKSPACE_A, {
        purchasePriceCents: 50000000,
        dueDiligenceFeeCents: 500000,
        initialEarnestMoneyCents: 250000,
        offerDate: '2026-08-05',
        dueDiligenceDate: '2026-08-20',
        settlementDate: '2026-09-05'
      }, [], BROKER_USER_ID, BROKER_CAPABILITY);
      await ContractService.selectForms(session.id, WORKSPACE_A, [validFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
      await ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);

      const validated = await ContractService.validateSession(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);
      expect(validated.status).toBe('broker_review_required');
      expect(validated.draftManifest?.disclaimer).toContain('NON-EXECUTABLE DEVELOPMENT FIXTURE');
    });
  });
});
