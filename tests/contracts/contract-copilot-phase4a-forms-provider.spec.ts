/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 4A Test Suite — Licensed Forms Provider Readiness & Adapter Architecture
 * Verifies fail-closed production behavior, form registry metadata enforcement, audit safety, and isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContractService } from '../../server/contracts/contractService.js';
import { defaultContractRepository } from '../../server/contracts/contractRepository.js';
import { ContractFormsConfigService } from '../../server/contracts/contractFormsConfig.js';
import { LicensedFormRegistry } from '../../server/contracts/licensedFormRegistry.js';
import { LicensedFormProviderFactory } from '../../server/contracts/licensedFormProviderFactory.js';
import { UnconfiguredFormsProviderAdapter } from '../../server/contracts/unconfiguredFormsProviderAdapter.js';
import { DevelopmentFormsProviderAdapter } from '../../server/contracts/developmentFormsProviderAdapter.js';

const WORKSPACE_A = 'nest-realty-wilmington';
const WORKSPACE_B = 'nest-realty-raleigh';
const BROKER_USER_ID = 'usr_broker_alice';
const BROKER_CAPABILITY = 'contract_authoring';

const validCurrentFormFixture = {
  formId: 'nc_realtors_form_2t',
  formName: 'Form 2-T',
  displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)',
  activeStatus: true,
  providerId: 'lone_wolf_transact',
  providerFormId: '2t_2026_v1',
  attachedVersionHash: 'hash_nc_2t_2026_v1_validated',
  brokerConfirmationStatus: true,
  workspaceAvailability: [WORKSPACE_A]
};

const retiredFormFixture = {
  formId: 'nc_realtors_form_2t_retired_2024',
  formName: 'Form 2-T (2024)',
  displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (2024 Retired)',
  activeStatus: false, // RETIRED
  providerId: 'lone_wolf_transact',
  providerFormId: '2t_2024_retired',
  attachedVersionHash: 'hash_nc_2t_2024_retired',
  brokerConfirmationStatus: true,
  workspaceAvailability: [WORKSPACE_A]
};

describe('Contract Copilot Phase 4A — Licensed Forms Provider Readiness Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('1. Unconfigured licensed provider fails closed in production mode', () => {
    process.env.APP_MODE = 'production';
    process.env.FORMS_PROVIDER = 'unconfigured';

    expect(() => {
      ContractFormsConfigService.assertLicensedFormsProviderConfigured(WORKSPACE_A);
    }).toThrow(/LICENSED_FORMS_PROVIDER_NOT_CONFIGURED/);

    const adapter = LicensedFormProviderFactory.getProvider(WORKSPACE_A);
    expect(adapter).toBeInstanceOf(UnconfiguredFormsProviderAdapter);
  });

  it('2. Development mock cannot be used accidentally in production mode', async () => {
    process.env.APP_MODE = 'production';
    process.env.FORMS_PROVIDER = 'mock_dev';

    expect(() => {
      ContractFormsConfigService.assertLicensedFormsProviderConfigured(WORKSPACE_A);
    }).toThrow(/LICENSED_FORMS_PROVIDER_NOT_CONFIGURED/);

    const devAdapter = new DevelopmentFormsProviderAdapter();
    expect(devAdapter.isConfigured(WORKSPACE_A)).toBe(false);

    await expect(
      devAdapter.createDraftTransaction({
        sessionId: 'sess_1',
        workspaceId: WORKSPACE_A,
        requestingBrokerId: BROKER_USER_ID,
        canonicalFormCode: 'NC_REALTORS_NC_BAR_FORM_2T',
        transactionType: 'residential_resale_buyer_offer',
        propertyAddress: '100 Main St'
      })
    ).rejects.toThrow(/LICENSED_FORMS_PROVIDER_NOT_CONFIGURED/);
  });

  it('3. Current active form version is accepted by form registry', () => {
    const entry = LicensedFormRegistry.getFormByCanonicalCode('NC_REALTORS_NC_BAR_FORM_2T');
    expect(entry).toBeDefined();
    expect(entry?.activeStatus).toBe(true);

    const validation = LicensedFormRegistry.validateFormEntry(entry!);
    expect(validation.isValid).toBe(true);
  });

  it('4. Retired or unsupported form version is blocked', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    await expect(
      ContractService.selectForms(session.id, WORKSPACE_A, [retiredFormFixture], BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow(/marked retired\/inactive/);
  });

  it('5. Broker explicit form selection is recorded on session', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    const updated = await ContractService.selectForms(session.id, WORKSPACE_A, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
    expect(updated.selectedForms.length).toBe(1);
    expect(updated.selectedForms[0].displayName).toContain('Joint NC REALTORS / North Carolina Bar Association Form 2-T');
  });

  it('6. Cross-workspace form metadata access is blocked', async () => {
    const sessionB = await ContractService.createSession({
      workspaceId: WORKSPACE_B,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // validCurrentFormFixture is available only in WORKSPACE_A
    await expect(
      ContractService.selectForms(sessionB.id, WORKSPACE_B, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow(/not available in workspace/);
  });

  it('7. Form selection emits an append-only audit event', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    await ContractService.selectForms(session.id, WORKSPACE_A, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
    const auditEvents = await defaultContractRepository.getAuditEvents(session.id, WORKSPACE_A);

    const selectionEvt = auditEvents.find(e => e.eventType === 'CONTRACT_SESSION_FORM_SELECTION_UPDATED');
    expect(selectionEvt).toBeDefined();
    expect(selectionEvt?.workspaceId).toBe(WORKSPACE_A);
  });

  it('8. Provider credentials never appear in audit events', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    await ContractService.selectForms(session.id, WORKSPACE_A, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
    const auditEvents = await defaultContractRepository.getAuditEvents(session.id, WORKSPACE_A);

    for (const evt of auditEvents) {
      const json = JSON.stringify(evt);
      expect(json).not.toContain('LONE_WOLF_CLIENT_SECRET');
      expect(json).not.toContain('ZIPFORM_PARTNER_API_KEY');
      expect(json).not.toContain('sk_');
    }
  });

  it('9. No copyrighted preprinted form text is stored in registry entries', () => {
    const available = LicensedFormRegistry.getAvailableForms(WORKSPACE_A);
    for (const entry of available) {
      const json = JSON.stringify(entry);
      expect(json).not.toContain('Buyer and Seller agree that');
      expect(json).not.toContain('SHALL BE PAID TO SELLER');
      expect(json).not.toContain('PROPERTY DISCLOSURE STATEMENT');
    }
  });

  it('10. BIC escalation blocks draft generation when required', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    await ContractService.requestBicReview(session.id, WORKSPACE_A, 'Conflicting terms', BROKER_USER_ID, BROKER_CAPABILITY);

    await expect(
      ContractService.requestDraft(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow(/FORBIDDEN_BIC_CAPABILITY_REQUIRED/);
  });

  it('11. Missing form selection blocks draft generation', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      parties: [{ id: 'p1', role: 'buyer', fullName: 'Alice Smith' }],
      property: { streetAddress: '100 Main St', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' },
      actorCapability: BROKER_CAPABILITY
    });

    await ContractService.updateTerms(session.id, WORKSPACE_A, { purchasePriceCents: 50000000 }, [], BROKER_USER_ID, BROKER_CAPABILITY);
    await ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);
    
    // No selectedForms added
    const validated = await ContractService.validateSession(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);
    expect(validated.status).toBe('validation_blocked');
    expect(validated.validationIssues.some(i => i.code === 'FORM_SELECTION_MISSING')).toBe(true);
  });

  it('12. Repeated provider selection operations are idempotent', async () => {
    const session = await ContractService.createSession({
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      requestingBrokerId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    await ContractService.selectForms(session.id, WORKSPACE_A, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);
    await ContractService.selectForms(session.id, WORKSPACE_A, [validCurrentFormFixture], BROKER_USER_ID, BROKER_CAPABILITY);

    const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
    expect(loaded?.selectedForms.length).toBe(1);
  });
});
