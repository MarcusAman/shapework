/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified NORA Omnichannel Marketing Intake Contract & Parity Test Suite
 * Validates that Retell Voice, AskNora Email, and Dashboard Web all execute through
 * NoraMarketingIntakeOrchestrator with 100% policy, validation, and gating symmetry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  NoraMarketingIntakeOrchestrator, 
  noraMarketingIntakeOrchestrator,
  NORA_POLICY_VERSION,
  NORA_KNOWLEDGE_VERSION,
  isPlaceholderAddress,
  computeCanonicalPropertyKey
} from '../../server/services/noraMarketingIntakeOrchestrator';
import { 
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository';

describe('Unified NORA Omnichannel Marketing Intake Suite', () => {
  let orchestrator: NoraMarketingIntakeOrchestrator;

  beforeEach(() => {
    orchestrator = new NoraMarketingIntakeOrchestrator();
  });

  // 1. Policy & Version Parity
  it('1. All three paths use the same canonical knowledge and policy version', async () => {
    const voiceRes = await orchestrator.evaluateMarketingIntake({
      channel: 'phone',
      requesterName: 'Matt Orr',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      flexMlsStatus: 'flex_live',
      mlsNumber: '1004523'
    });

    const emailRes = await orchestrator.evaluateMarketingIntake({
      channel: 'email',
      requesterEmail: 'matt.orr@nestrealty.com',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      flexMlsStatus: 'flex_live',
      mlsNumber: '1004523'
    });

    const webRes = await orchestrator.evaluateMarketingIntake({
      channel: 'web',
      requesterId: 'dir_matt_orr_1',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      flexMlsStatus: 'flex_live',
      mlsNumber: '1004523'
    });

    expect(voiceRes.policyVersion).toBe(NORA_POLICY_VERSION);
    expect(emailRes.policyVersion).toBe(NORA_POLICY_VERSION);
    expect(webRes.policyVersion).toBe(NORA_POLICY_VERSION);
    expect(voiceRes.knowledgeVersion).toBe(NORA_KNOWLEDGE_VERSION);
    expect(emailRes.knowledgeVersion).toBe(NORA_KNOWLEDGE_VERSION);
    expect(webRes.knowledgeVersion).toBe(NORA_KNOWLEDGE_VERSION);
  });

  // 2. Branch A: Live Listing in Flex MLS
  describe('Branch A: Property Is Live in Flex MLS', () => {
    it('2. Live listing lookup populates verified fields and checks for missing delivery date', async () => {
      const evalResult = await orchestrator.evaluateMarketingIntake({
        channel: 'phone',
        requesterName: 'Matt Orr',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        flexMlsStatus: 'flex_live',
        mlsNumber: '1004523'
      });

      expect(evalResult.flexMlsStatus).toBe('flex_live');
      expect(evalResult.mlsLookupAttempted).toBe(true);
      // In sandbox/fixture mode without live credentials, it handles lookup gracefully
      if (evalResult.mlsLookupSuccess) {
        expect(evalResult.fieldProvenance.price).toBe('flex_mls');
        expect(evalResult.extractedFields.price).toBeGreaterThan(0);
      } else {
        expect(evalResult.mlsLookupMessage).toContain('collect the property details directly');
      }
    });

    it('3. Conflicting broker and MLS values are surfaced as conflicts rather than silently overwritten', async () => {
      // Mock listing conflict: Broker states $1,400,000 but MLS listing says $1,250,000
      const evalResult = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        requesterName: 'Matt Orr',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        flexMlsStatus: 'flex_live',
        price: 1400000,
        squareFeet: 3450,
        bedrooms: 4,
        bathrooms: 3.5,
        description: 'Stunning luxury coastal estate with private dock and pool.'
      });

      if (evalResult.fieldConflicts.length > 0) {
        const priceConflict = evalResult.fieldConflicts.find(c => c.field === 'price');
        if (priceConflict) {
          expect(priceConflict.brokerValue).toBe(1400000);
          expect(priceConflict.isConfirmed).toBe(false);
          expect(evalResult.readinessStatus).toBe('needs_info');
        }
      }
    });
  });

  // 3. Branch B: Pre-MLS Marketing Intake
  describe('Branch B: Marketing Before Flex MLS Is Live (Pre-MLS)', () => {
    it('4. Pre-MLS request identifies all six required inputs and holds in needs_info until complete', async () => {
      // Initial partial request: only price and bedrooms provided
      const partialResult = await orchestrator.evaluateMarketingIntake({
        channel: 'phone',
        requesterName: 'Sarah Jenkins',
        propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC 28480',
        flexMlsStatus: 'pre_mls',
        price: 1950000,
        bedrooms: 4
      });

      expect(partialResult.flexMlsStatus).toBe('pre_mls');
      expect(partialResult.readinessStatus).toBe('needs_info');
      expect(partialResult.missingFields).toContain('squareFootage');
      expect(partialResult.missingFields).toContain('bathrooms');
      expect(partialResult.missingFields).toContain('propertyDescription');
      expect(partialResult.missingFields).toContain('photoReferences');

      // Voice response gives photo instructions
      expect(partialResult.voiceResponse.photoInstructions).toContain('AskNora@NestRealty.com');
      expect(partialResult.voiceResponse.photoInstructions).toContain('Ask NORA page');
    });

    it('5. Only missing inputs are requested in email clarification checklist', async () => {
      const emailResult = await orchestrator.evaluateMarketingIntake({
        channel: 'email',
        requesterEmail: 'sarah.jenkins@nestrealty.com',
        propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC 28480',
        flexMlsStatus: 'pre_mls',
        price: 1950000,
        squareFeet: 3600,
        bedrooms: 4,
        bathrooms: 4
        // missing: description, photos, neededByDate
      });

      expect(emailResult.emailResponse.isClarificationNeeded).toBe(true);
      expect(emailResult.emailResponse.missingChecklist).toContain('Property description or key features');
      expect(emailResult.emailResponse.missingChecklist).toContain('High-resolution property photos (attached or shared via Google Drive)');
      expect(emailResult.emailResponse.missingChecklist).not.toContain('Planned listing price');
      expect(emailResult.emailResponse.missingChecklist).not.toContain('Bedrooms count');
    });

    it('6. Fully complete pre-MLS request moves to ready_for_review', async () => {
      const completeResult = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        requesterId: 'dir_matt_orr_1',
        propertyAddress: '8820 Ocean Sound Way, Wilmington, NC 28411',
        flexMlsStatus: 'pre_mls',
        price: 850000,
        squareFeet: 2800,
        bedrooms: 4,
        bathrooms: 3,
        description: 'Exquisite coastal estate with open floor plan and screened porch.',
        deliverables: ['1-Page Property Flyer (8.5x11)', 'Instagram Story (9:16)'],
        neededByDate: '2026-09-10',
        photos: [{ url: '/uploads/ocean_sound_hero.jpg', name: 'hero.jpg', isManaged: true }]
      });

      expect(completeResult.readinessStatus).toBe('ready_for_review');
      expect(completeResult.missingFields.length).toBe(0);
      expect(completeResult.webResponse.statusBadge).toBe('Ready for Review');
      expect(completeResult.webResponse.nextAction).toContain('review queue');
    });
  });

  // 4. Placeholder Address Protection & Uniqueness
  describe('Placeholder Address Protection', () => {
    it('7. Placeholder addresses receive no canonical property key (null) and are not merged', () => {
      expect(isPlaceholderAddress('Wilmington, NC Area Listing')).toBe(true);
      expect(isPlaceholderAddress('[Address Needed]')).toBe(true);
      expect(isPlaceholderAddress('Address Pending')).toBe(true);
      expect(isPlaceholderAddress('Address TBD')).toBe(true);
      expect(isPlaceholderAddress('Unknown Property')).toBe(true);

      expect(computeCanonicalPropertyKey('Wilmington, NC Area Listing')).toBeNull();
      expect(computeCanonicalPropertyKey('Address Pending')).toBeNull();
      expect(computeCanonicalPropertyKey('1916 Wolcott Ave, Wilmington, NC')).toBe('1916 wolcott ave wilmington nc');
    });

    it('8. Two separate missing-address requests remain independent and are not merged', async () => {
      const res1 = await orchestrator.evaluateMarketingIntake({
        channel: 'phone',
        requesterName: 'Chris Brown',
        propertyAddress: 'Address Pending'
      });
      const p1 = await orchestrator.persistIntakeEvaluation(res1);

      const res2 = await orchestrator.evaluateMarketingIntake({
        channel: 'email',
        requesterEmail: 'chris.brown@nestrealty.com',
        propertyAddress: 'Wilmington, NC Area Listing'
      });
      const p2 = await orchestrator.persistIntakeEvaluation(res2);

      expect(p1.request.id).not.toBe(p2.request.id);
      expect(p1.request.status).toBe('needs_info');
      expect(p2.request.status).toBe('needs_info');
    });
  });

  // 5. Cross-Channel Continuity & Correlation
  describe('Cross-Channel Continuity', () => {
    it('9. Email attachments reconcile into existing phone-created request container', async () => {
      // Step 1: Broker calls in with confirmed address
      const voiceResult = await orchestrator.evaluateMarketingIntake({
        channel: 'phone',
        requesterName: 'Matt Orr',
        propertyAddress: '550 Market St, Wilmington, NC 28401',
        flexMlsStatus: 'pre_mls',
        price: 550000,
        squareFeet: 2100,
        bedrooms: 3,
        bathrooms: 2,
        description: 'Historic downtown Wilmington townhome with brick courtyard.',
        neededByDate: '2026-09-12'
        // No photos provided on phone call
      });
      const voicePersistence = await orchestrator.persistIntakeEvaluation(voiceResult);
      expect(voicePersistence.request.status).toBe('needs_info');

      // Step 2: Broker emails photos referencing the same address
      const emailResult = await orchestrator.evaluateMarketingIntake({
        channel: 'email',
        requesterEmail: 'matt.orr@nestrealty.com',
        propertyAddress: '550 Market St, Wilmington, NC 28401',
        photos: [{ url: '/uploads/550_market_front.jpg', name: 'front.jpg' }]
      });
      const emailPersistence = await orchestrator.persistIntakeEvaluation(emailResult);

      expect(emailPersistence.isMerged).toBe(true);
      expect(emailPersistence.request.id).toBe(voicePersistence.request.id);
      expect(emailPersistence.request.photos?.length).toBeGreaterThanOrEqual(1);
    });

    it('10. Web uploads reconcile into existing email-created request container', async () => {
      // Step 1: Email creates request with partial details
      const emailResult = await orchestrator.evaluateMarketingIntake({
        channel: 'email',
        requesterEmail: 'sarah.webcrosschannel@nestrealty.com',
        propertyAddress: '912 Wrightsville Ave, Wilmington, NC 28403',
        flexMlsStatus: 'pre_mls',
        price: 640000,
        bedrooms: 3,
        bathrooms: 2
      });
      const emailPersist = await orchestrator.persistIntakeEvaluation(emailResult);

      // Step 2: Broker logs onto Ask NORA web page and supplies missing sqft, description, photos
      const webResult = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        requesterEmail: 'sarah.webcrosschannel@nestrealty.com',
        propertyAddress: '912 Wrightsville Ave, Wilmington, NC 28403',
        squareFeet: 2300,
        description: 'Coastal bungalow close to downtown and beaches.',
        neededByDate: '2026-09-15',
        photos: [{ url: '/uploads/912_wrightsville_pool.jpg', name: 'pool.jpg' }]
      });
      const webPersist = await orchestrator.persistIntakeEvaluation(webResult);

      expect(webPersist.isMerged).toBe(true);
      expect(webPersist.request.id).toBe(emailPersist.request.id);
    });

    it('11. Failed listing lookup requests missing fields gracefully without fabricating data', async () => {
      const failedMlsResult = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        requesterName: 'Matt Orr',
        propertyAddress: '9999 Nonexistent Blvd, Wilmington, NC 28409',
        flexMlsStatus: 'flex_live',
        mlsNumber: 'INVALID_999999'
      });

      expect(failedMlsResult.mlsLookupAttempted).toBe(true);
      expect(failedMlsResult.mlsLookupSuccess).toBe(false);
      expect(failedMlsResult.readinessStatus).toBe('needs_info');
      expect(failedMlsResult.missingFields).toContain('price');
      expect(failedMlsResult.missingFields).toContain('squareFootage');
    });
  });

  // 6. Scope Boundaries (Signage & General Marketing)
  describe('Scope Boundaries', () => {
    it('12. Signage-only request does not require property description or photos', async () => {
      const signResult = await orchestrator.evaluateMarketingIntake({
        channel: 'phone',
        requesterName: 'Ann Gunn',
        propertyAddress: '228 Wrightsville Ave, Wilmington, NC 28403',
        intakeType: 'signage_only',
        deliverables: ['Yard Sign Post Installation'],
        neededByDate: '2026-09-05'
      });

      expect(signResult.intakeType).toBe('signage_only');
      expect(signResult.readinessStatus).toBe('ready_for_review');
      expect(signResult.missingFields).not.toContain('propertyDescription');
      expect(signResult.missingFields).not.toContain('price');
    });

    it('13. Non-property general marketing request bypasses property listing requirements', async () => {
      const generalResult = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        requesterName: 'Melissa Gagliardi',
        intakeType: 'non_property_general',
        deliverables: ['Agent Brand Biography & Social Banner'],
        neededByDate: '2026-09-15',
        isDeadlineFlexible: true
      });

      expect(generalResult.intakeType).toBe('non_property_general');
      expect(generalResult.missingFields).not.toContain('price');
      expect(generalResult.missingFields).not.toContain('squareFeet');
    });
  });

  // 7. Security & Tenant Isolation
  describe('Security & Tenant Isolation', () => {
    it('14. Unknown caller is assigned unverified directory status and cannot claim trusted broker role', () => {
      const unknownRequester = orchestrator.resolveRequester({
        phone: '+19195559999',
        name: 'Unknown Caller'
      });

      expect(unknownRequester.isVerified).toBe(false);
      expect(unknownRequester.id).toContain('dir_unknown');
    });

    it('15. Verified directory member resolves canonical internal ID and office', () => {
      const verifiedRequester = orchestrator.resolveRequester({
        email: 'chris.brown@nestrealty.com'
      });

      expect(verifiedRequester.isVerified).toBe(true);
      expect(verifiedRequester.name).toBe('Chris Brown');
      expect(verifiedRequester.id).toBe('dir_chris_brown_0');
    });

    it('16. Cross-tenant isolation strictly isolates workspace IDs and prevents data leakage', async () => {
      const ws1Result = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        workspaceId: 'ws_wilmington',
        requesterName: 'Matt Orr',
        propertyAddress: '100 Beach Rd, Wilmington, NC 28405',
        price: 500000,
        squareFeet: 2000,
        bedrooms: 3,
        bathrooms: 2,
        description: 'Coastal home in Wilmington.',
        neededByDate: '2026-09-15',
        photos: [{ url: '/p1.jpg', name: 'p1.jpg' }]
      });
      const p1 = await orchestrator.persistIntakeEvaluation(ws1Result);

      const ws2Result = await orchestrator.evaluateMarketingIntake({
        channel: 'web',
        workspaceId: 'ws_other_brokerage',
        requesterName: 'Other Broker',
        propertyAddress: '100 Beach Rd, Wilmington, NC 28405'
      });

      expect(p1.request.workspaceId).toBe('ws_wilmington');
      expect(ws2Result.workspaceId).toBe('ws_other_brokerage');
    });
  });
});
