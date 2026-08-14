/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 2.1 Hardened Test Suite
 * Comprehensive testing of capability-based BIC authorization, Production Safety Gate,
 * generic workspace isolation, audit integrity, sensitive financial data guards,
 * form versioning, state machine invariants, and idempotency.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContractService } from '../../server/contracts/contractService.js';
import { defaultContractRepository, ProductionSafetyGate } from '../../server/contracts/contractRepository.js';
import { ContractValidationEngine } from '../../server/contracts/contractValidationSchemas.js';
import { ContractStateMachine } from '../../server/contracts/contractStateMachine.js';
import { FormSelectionMetadata } from '../../server/contracts/contractDomainTypes.js';

describe('Contract Copilot Phase 2.1 Hardened Backend Suite', () => {

  const WORKSPACE_A = 'nest-realty-wilmington';
  const WORKSPACE_B = 'nest-realty-raleigh';
  const BROKER_USER_ID = 'usr_broker_123';
  const BIC_USER_ID = 'usr_bic_456';

  const validFormFixture: FormSelectionMetadata = {
    formId: 'DEV-MOCK-RESIDENTIAL-OFFER',
    providerId: 'nc_realtors_nc_bar_joint',
    providerFormId: 'form_2t',
    displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)',
    revisionIdentifier: '2026.07.v1',
    effectiveDate: '2026-07-01',
    activeStatus: true,
    workspaceAvailability: [WORKSPACE_A],
    transactionTypeCompatibility: ['residential_resale_buyer_offer'],
    selectedByUserId: BROKER_USER_ID,
    selectionTimestamp: new Date().toISOString(),
    brokerConfirmationStatus: true,
    attachedVersionHash: 'hash_ver_2026_07_v1',
    disclaimerNote: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT'
  };

  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    delete process.env.APP_MODE;
    delete process.env.NODE_ENV;
    delete process.env.STORAGE_DRIVER;
  });

  afterEach(() => {
    delete process.env.APP_MODE;
    delete process.env.NODE_ENV;
    delete process.env.STORAGE_DRIVER;
  });

  describe('1. Capability-Based BIC Authorization (No Hard-Coded User IDs)', () => {

    it('requires explicit contract_bic_review capability to approve BIC exception review', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'Alice Smith' }],
        property: { streetAddress: '100 Main St', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' },
        actorCapability: 'contract_authoring'
      });

      await ContractService.updateTerms(session.id, WORKSPACE_A, { purchasePriceCents: 50000000 }, [], BROKER_USER_ID, 'contract_authoring');
      await ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, 'contract_authoring');
      await ContractService.selectForms(session.id, WORKSPACE_A, [validFormFixture], BROKER_USER_ID, 'contract_authoring');

      await ContractService.requestBicReview(session.id, WORKSPACE_A, 'Ambiguous HOA terms', BROKER_USER_ID, 'contract_authoring');
      const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(loaded?.status).toBe('bic_review_required');

      // 1. Normal broker without contract_bic_review capability is rejected
      await expect(
        ContractService.requestDraft(session.id, WORKSPACE_A, BROKER_USER_ID, 'contract_authoring')
      ).rejects.toThrow('FORBIDDEN_BIC_CAPABILITY_REQUIRED');

      // 2. Generic admin without contract_bic_review capability is rejected
      await expect(
        ContractService.requestDraft(session.id, WORKSPACE_A, 'usr_generic_admin', 'contract_authoring')
      ).rejects.toThrow('FORBIDDEN_BIC_CAPABILITY_REQUIRED');

      // 3. User with explicit contract_bic_review capability succeeds
      const bicSession = await ContractService.requestDraft(session.id, WORKSPACE_A, BIC_USER_ID, 'contract_bic_review');
      expect(bicSession.status).toBe('broker_review_required');
    });

  });

  describe('2. Production Safety Gate', () => {

    it('fails closed in production mode when no durable database datastore is configured', () => {
      process.env.APP_MODE = 'production';
      process.env.STORAGE_DRIVER = 'local_file';

      expect(() => {
        ProductionSafetyGate.assertProductionSafety();
      }).toThrow('CONTRACT_COPILOT_DISABLED_NO_DURABLE_STORAGE');
    });

    it('passes when durable database driver is configured', () => {
      process.env.APP_MODE = 'production';
      process.env.STORAGE_DRIVER = 'database';

      expect(() => {
        ProductionSafetyGate.assertProductionSafety();
      }).not.toThrow();
    });

  });

  describe('3. Generic Workspace Isolation', () => {

    it('prevents cross-workspace data leakage for sessions, terms, and audit events', async () => {
      const sA = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID
      });

      // 1. Querying from Workspace B returns null
      const lookupB = await defaultContractRepository.findById(sA.id, WORKSPACE_B);
      expect(lookupB).toBeNull();

      // 2. Updating terms from Workspace B fails
      await expect(
        ContractService.updateTerms(sA.id, WORKSPACE_B, { purchasePriceCents: 50000000 }, [], BROKER_USER_ID, 'contract_authoring')
      ).rejects.toThrow('not found');

      // 3. Audit events for Workspace B return empty array
      const auditB = await defaultContractRepository.getAuditEvents(sA.id, WORKSPACE_B);
      expect(auditB).toEqual([]);
    });

    it('rejects form metadata not enabled for target workspace', async () => {
      const sA = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID
      });

      const restrictedForm: FormSelectionMetadata = {
        ...validFormFixture,
        workspaceAvailability: [WORKSPACE_B] // Only available in Raleigh workspace
      };

      await expect(
        ContractService.selectForms(sA.id, WORKSPACE_A, [restrictedForm], BROKER_USER_ID, 'contract_authoring')
      ).rejects.toThrow(`Form metadata '${restrictedForm.displayName}' is not available in workspace '${WORKSPACE_A}'.`);
    });

  });

  describe('4. Sensitive Financial Data Guard', () => {

    it('rejects bank account numbers, routing numbers, and wiring instructions with stable code', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'John Doe' }],
        property: { streetAddress: '100 Beach Rd', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28403' }
      });

      const updated = await ContractService.updateTerms(
        session.id,
        WORKSPACE_A,
        {
          purchasePriceCents: 35000000,
          personalPropertyInclusions: ['Wiring instructions: Bank routing number 123456789 deposit to Account 987654321']
        },
        [],
        BROKER_USER_ID,
        'contract_authoring'
      );

      const validation = ContractValidationEngine.validateSession(updated);
      expect(validation.isBlocked).toBe(true);
      expect(validation.issues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')).toBe(true);
      expect(validation.issues[0].message).toContain('For security, Ask Nest Ops cannot collect or transmit wiring, banking, or authentication information.');

      // Verify value was sanitized and redacted from terms
      expect(updated.terms.personalPropertyInclusions?.[0]).toContain('[REDACTED_SENSITIVE_DATA]');
    });

  });

  describe('5. Form Versioning & Terminology Architecture', () => {

    it('rejects retired form metadata for new draft creation', async () => {
      const sA = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID
      });

      const retiredForm: FormSelectionMetadata = {
        ...validFormFixture,
        activeStatus: false,
        retirementDate: '2026-01-01'
      };

      await expect(
        ContractService.selectForms(sA.id, WORKSPACE_A, [retiredForm], BROKER_USER_ID, 'contract_authoring')
      ).rejects.toThrow('is marked retired/inactive');
    });

    it('preserves historical form-version metadata and attachedVersionHash on existing sessions', async () => {
      const sA = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'Sam Green' }],
        property: { streetAddress: '500 Oak St', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' }
      });

      await ContractService.updateTerms(sA.id, WORKSPACE_A, { purchasePriceCents: 40000000 }, [], BROKER_USER_ID, 'contract_authoring');
      await ContractService.confirmTerms(sA.id, WORKSPACE_A, BROKER_USER_ID, 'contract_authoring');
      await ContractService.selectForms(sA.id, WORKSPACE_A, [validFormFixture], BROKER_USER_ID, 'contract_authoring');
      const validated = await ContractService.validateSession(sA.id, WORKSPACE_A, BROKER_USER_ID, 'contract_authoring');

      expect(validated.draftManifest?.fixtureFormMetadata[0].displayName).toBe('Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)');
      expect(validated.draftManifest?.fixtureFormMetadata[0].attachedVersionHash).toBeDefined();
    });

  });

  describe('6. State Machine Invariants & Independent BIC Resolution', () => {

    it('prohibits erasing unrelated blocking validation issues during BIC review approval', async () => {
      const session = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        parties: [{ id: 'p1', role: 'buyer', fullName: 'Carl Brown' }]
        // Missing property address (blocking issue)
      });

      // Request BIC review for unusual ownership clause
      await ContractService.requestBicReview(session.id, WORKSPACE_A, 'Unusual ownership clause', BROKER_USER_ID, 'contract_authoring');
      const bicSession = await ContractService.getSession(session.id, WORKSPACE_A);
      expect(bicSession?.status).toBe('bic_review_required');

      // Run validation pass to populate issues
      ContractValidationEngine.validateSession(bicSession!);

      // BIC attempts to approve review, but blocking issue (missing property) remains
      const result = ContractStateMachine.transition({
        session: bicSession!,
        targetStatus: 'draft_requested',
        actorUserId: BIC_USER_ID,
        actorCapability: 'contract_bic_review'
      });

      // Session transitions to validation_blocked, NOT draft_requested
      expect(result.updatedSession.status).toBe('validation_blocked');
    });

  });

  describe('7. Service-Layer Idempotency Across Endpoints', () => {

    it('handles duplicate retries cleanly without creating duplicate sessions or audit events', async () => {
      const key = 'idem_key_phase_2_1_test';

      const s1 = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        idempotencyKey: key
      });

      const s2 = await ContractService.createSession({
        workspaceId: WORKSPACE_A,
        requestingUserId: BROKER_USER_ID,
        requestingBrokerId: BROKER_USER_ID,
        idempotencyKey: key
      });

      expect(s1.id).toBe(s2.id);

      const events = await defaultContractRepository.getAuditEvents(s1.id, WORKSPACE_A);
      // Verify audit events are append-only without duplicates
      const uniqueEventIds = new Set(events.map(e => e.id));
      expect(uniqueEventIds.size).toBe(events.length);
    });

  });

});
