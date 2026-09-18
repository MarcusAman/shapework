/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Phase 4A.3 Test Suite — Broker Demo UX & Demo Fixture Safety
 * Verifies demo fixture mechanism, production fail-closed controls, pending intake quarantine,
 * authenticated claiming, multi-channel continuity, BIC review presentation, and e-sign prohibition.
 */

import crypto from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ContractService } from '../../server/contracts/contractService.js';
import { defaultContractRepository } from '../../server/contracts/contractRepository.js';
import { ContractIdentityBindingService } from '../../server/contracts/contractIdentityBinding.js';
import { PendingContractIntakeService } from '../../server/contracts/pendingContractIntake.js';
import { ContractDemoFixtureService } from '../../server/contracts/contractDemoFixtures.js';
import { LicensedFormRegistry } from '../../server/contracts/licensedFormRegistry.js';

const WORKSPACE_A = 'nest-realty-wilmington';
const WORKSPACE_B = 'nest-realty-raleigh';
const BROKER_PHONE = '+19105551234';
const BROKER_EMAIL = 'alice@nestrealty.com';
const BROKER_USER_ID = 'usr_broker_alice';
const OTHER_BROKER_USER_ID = 'usr_broker_bob';
const BROKER_CAPABILITY = 'contract_authoring';

describe('Contract Copilot Phase 4A.3 — Broker Demo UX & Safety Test Suite', () => {
  beforeEach(() => {
    defaultContractRepository.clearForTesting();
    ContractIdentityBindingService.clearForTesting();
    PendingContractIntakeService.clearForTesting();

    process.env.CONTRACT_COPILOT_DEMO_MODE = 'true';
    delete process.env.APP_MODE;

    ContractIdentityBindingService.registerPhone(BROKER_PHONE, BROKER_USER_ID);
    ContractIdentityBindingService.registerEmail(BROKER_EMAIL, BROKER_USER_ID);
  });

  it('1. Broker sees only their pending intakes', async () => {
    await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);
    await ContractDemoFixtureService.createDemoFixture('scenario_b_phone', WORKSPACE_A, OTHER_BROKER_USER_ID);

    const aliceList = await PendingContractIntakeService.listPendingByBroker(BROKER_USER_ID, WORKSPACE_A);
    expect(aliceList.length).toBe(1);
    expect(aliceList[0].candidateUserId).toBe(BROKER_USER_ID);
  });

  it('2. Cross-workspace pending intake never renders', async () => {
    await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_B, BROKER_USER_ID);

    const aliceWorkspaceAList = await PendingContractIntakeService.listPendingByBroker(BROKER_USER_ID, WORKSPACE_A);
    expect(aliceWorkspaceAList.length).toBe(0);
  });

  it('3. Review shows sanitized facts without raw webhook payloads', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    expect(fixture.proposedTerms.purchasePriceCents).toBe(72500000);
    expect(fixture.proposedProperty?.streetAddress).toBe('123 Ocean View Drive');
    expect(fixture.proposedParties?.length).toBe(2);
    expect((fixture as any).rawPayload).toBeUndefined(); // Zero raw webhook payloads exposed
  });

  it('4. Claim uses authenticated backend flow', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.requestingBrokerId).toBe(BROKER_USER_ID);
    expect(session.terms.purchasePriceCents).toBe(72500000);
  });

  it('5. Claimed intake opens canonical session', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    const loaded = await ContractService.getSession(session.id, WORKSPACE_A);
    expect(loaded?.id).toBe(session.id);
  });

  it('6. SMS → dashboard continuity', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Update terms via dashboard
    const updated = await ContractService.updateTerms(
      session.id,
      WORKSPACE_A,
      { sellerConcessionCents: 750000 },
      [],
      BROKER_USER_ID,
      BROKER_CAPABILITY
    );

    expect(updated.id).toBe(session.id);
    expect(updated.terms.sellerConcessionCents).toBe(750000);
  });

  it('7. Phone → ElevenLabs voice continuity', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_b_phone', WORKSPACE_A, BROKER_USER_ID);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Voice tool update on the same session
    const voiceUpdated = await ContractService.updateTerms(
      session.id,
      WORKSPACE_A,
      { dueDiligenceDate: '2026-08-20', settlementDate: '2026-09-18' },
      [],
      BROKER_USER_ID,
      BROKER_CAPABILITY
    );

    expect(voiceUpdated.id).toBe(session.id);
    expect(voiceUpdated.terms.settlementDate).toBe('2026-09-18');
  });

  it('8. Corrected closing date updates same session', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    // Correct closing date from Sep 18 to Sep 22
    const corrected = await ContractService.updateTerms(
      session.id,
      WORKSPACE_A,
      { settlementDate: '2026-09-22' },
      [],
      BROKER_USER_ID,
      BROKER_CAPABILITY
    );

    expect(corrected.id).toBe(session.id);
    expect(corrected.terms.settlementDate).toBe('2026-09-22');
  });

  it('9. Custom clause displays BIC review', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_c_bic', WORKSPACE_A, BROKER_USER_ID);

    expect(fixture.bicReviewRequired).toBe(true);
    expect(fixture.bicReviewReason).toContain('Custom contract clause');

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).toBe('bic_review_required');
  });

  it('10. HOA conflict displays BIC review', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_d_hoa', WORKSPACE_A, BROKER_USER_ID);

    expect(fixture.bicReviewRequired).toBe(true);
    expect(fixture.bicReviewReason).toContain('Conflicting HOA information');

    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).toBe('bic_review_required');
  });

  it('11. Sensitive information is not displayed', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_e_sensitive', WORKSPACE_A, BROKER_USER_ID);

    expect(fixture.validationIssues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')).toBe(true);
    expect(fixture.proposedTerms.personalPropertyInclusions![0]).toContain('[REDACTED_SENSITIVE_DATA]');
  });

  it('12. Provider-not-connected state displays correctly without manufacturing Form 2-T', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    session.property = { streetAddress: '123 Ocean View Dr', city: 'Wilmington', county: 'New Hanover', state: 'NC', postalCode: '28401' };
    await defaultContractRepository.save(session);

    await ContractService.updateTerms(
      session.id,
      WORKSPACE_A,
      { offerDate: '2026-08-01', dueDiligenceDate: '2026-08-20', settlementDate: '2026-09-18' },
      [],
      BROKER_USER_ID,
      BROKER_CAPABILITY
    );

    await ContractService.confirmTerms(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY);

    const formEntry = LicensedFormRegistry.getFormByCanonicalCode('NC_REALTORS_NC_BAR_FORM_2T')!;
    const selectedForm = {
      ...formEntry,
      selectedByUserId: BROKER_USER_ID,
      selectionTimestamp: new Date().toISOString(),
      brokerConfirmationStatus: true,
      disclaimerNote: 'Selection of licensed form metadata only.'
    };

    await ContractService.selectForms(session.id, WORKSPACE_A, [selectedForm], BROKER_USER_ID, BROKER_CAPABILITY);

    // In production without provider, validation & draft generation fails closed
    process.env.APP_MODE = 'production';
    process.env.STORAGE_DRIVER = 'database';
    await expect(
      ContractService.validateSession(session.id, WORKSPACE_A, BROKER_USER_ID, BROKER_CAPABILITY)
    ).rejects.toThrow(/LICENSED_FORMS_PROVIDER_NOT_CONFIGURED/);

    delete process.env.APP_MODE;
    delete process.env.STORAGE_DRIVER;
  });

  it('13. Demo fixture endpoint unavailable in production mode', async () => {
    process.env.APP_MODE = 'production';

    await expect(
      ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID)
    ).rejects.toThrow(/DEMO_FIXTURES_DISABLED_IN_PRODUCTION/);

    delete process.env.APP_MODE;
  });

  it('14. Demo fixture requires explicit demo-mode configuration', async () => {
    delete process.env.CONTRACT_COPILOT_DEMO_MODE;
    delete process.env.ENABLE_CONTRACT_DEMO_MODE;
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    await expect(
      ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID)
    ).rejects.toThrow(/DEMO_MODE_NOT_ENABLED/);

    process.env.NODE_ENV = oldNodeEnv;
    process.env.CONTRACT_COPILOT_DEMO_MODE = 'true';
  });

  it('15. Demo fixture cannot bypass broker claim', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);

    expect(fixture.claimStatus).toBe('pending');

    // Canonical sessions repository has NOT been mutated directly by fixture creation
    const canonicalSessions = await defaultContractRepository.listByWorkspace(WORKSPACE_A);
    expect(canonicalSessions.length).toBe(0);
  });

  it('16. No e-sign or send action exists', async () => {
    const fixture = await ContractDemoFixtureService.createDemoFixture('scenario_a_sms', WORKSPACE_A, BROKER_USER_ID);
    const session = await PendingContractIntakeService.claimPendingIntake({
      pendingIntakeId: fixture.id,
      workspaceId: WORKSPACE_A,
      requestingUserId: BROKER_USER_ID,
      actorCapability: BROKER_CAPABILITY
    });

    expect(session.status).not.toBe('broker_approved');
  });
});
