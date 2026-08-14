/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mock Contract Form Provider — Phase 2.1 Hardened Architecture
 * Provider-neutral mock adapter that generates non-executable draft manifests for development and testing.
 * 
 * DISCLAIMER: NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT.
 */

import { ContractIntakeSession, MockDraftManifest, FormSelectionMetadata } from './contractDomainTypes.js';
import crypto from 'crypto';

export class MockContractFormProvider {
  
  /**
   * Generates a non-executable draft manifest for a validated contract session.
   */
  public static generateMockDraftManifest(session: ContractIntakeSession): MockDraftManifest {
    const timestamp = new Date().toISOString();

    const fixtureForms: FormSelectionMetadata[] = session.selectedForms.length > 0 
      ? session.selectedForms 
      : [{
          formId: 'DEV-MOCK-RESIDENTIAL-OFFER',
          providerId: 'nc_realtors_nc_bar_joint',
          providerFormId: 'form_2t',
          displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)',
          revisionIdentifier: '2026.07.v1',
          effectiveDate: '2026-07-01',
          activeStatus: true,
          workspaceAvailability: [session.workspaceId],
          transactionTypeCompatibility: ['residential_resale_buyer_offer'],
          selectedByUserId: session.requestingBrokerId,
          selectionTimestamp: timestamp,
          brokerConfirmationStatus: true,
          attachedVersionHash: crypto.createHash('sha256').update(`DEV-MOCK-RESIDENTIAL-OFFER-2026.07.v1-${session.workspaceId}`).digest('hex'),
          disclaimerNote: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT'
        }];

    const fieldValues: Record<string, any> = {
      propertyAddress: session.property ? `${session.property.streetAddress}, ${session.property.city}, NC ${session.property.postalCode}` : '',
      county: session.property?.county || '',
      buyerNames: session.parties.filter(p => p.role === 'buyer').map(p => p.fullName).join(' & '),
      sellerNames: session.parties.filter(p => p.role === 'seller').map(p => p.fullName).join(' & ') || 'Unspecified Seller of Record',
      purchasePriceCents: session.terms.purchasePriceCents || 0,
      dueDiligenceFeeCents: session.terms.dueDiligenceFeeCents || 0,
      initialEarnestMoneyCents: session.terms.initialEarnestMoneyCents || 0,
      additionalEarnestMoneyCents: session.terms.additionalEarnestMoneyCents || 0,
      offerDate: session.terms.offerDate || '',
      dueDiligenceDate: session.terms.dueDiligenceDate || '',
      settlementDate: session.terms.settlementDate || '',
      financingCategory: session.terms.financingCategory || 'cash',
      personalPropertyInclusions: session.terms.personalPropertyInclusions || [],
      personalPropertyExclusions: session.terms.personalPropertyExclusions || []
    };

    const missingFieldList: string[] = [];
    if (!fieldValues.propertyAddress) missingFieldList.push('propertyAddress');
    if (!fieldValues.buyerNames) missingFieldList.push('buyerNames');
    if (!fieldValues.purchasePriceCents) missingFieldList.push('purchasePriceCents');

    const blockingIssueList: string[] = session.validationIssues
      .filter(i => i.severity === 'blocking')
      .map(i => `${i.code}: ${i.message}`);

    const rawString = JSON.stringify({ sessionId: session.id, fieldValues, timestamp });
    const manifestHash = crypto.createHash('sha256').update(rawString).digest('hex');

    return {
      sessionId: session.id,
      mockProviderName: 'Shapework Mock Forms Provider (Development Fixture)',
      fixtureFormMetadata: fixtureForms,
      fieldValues,
      missingFieldList,
      blockingIssueList,
      formRevisionMetadata: '2026.07.v1',
      generatedTimestamp: timestamp,
      manifestHash,
      disclaimer: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT'
    };
  }
}
