/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Development-Only Demo Fixture Subsystem — Phase 4A.3 Architecture
 * Creates controlled, quarantined PendingContractIntake demo scenarios for product demonstrations.
 * 
 * SAFETY GAURD:
 * - Fails closed in production environments.
 * - Requires explicit CONTRACT_COPILOT_DEMO_MODE=true configuration.
 * - Quarantined records CANNOT bypass authenticated broker claiming.
 */

import { PendingContractIntakeService, PendingContractIntake } from './pendingContractIntake.js';
import { ContractIdentityBindingService } from './contractIdentityBinding.js';

export type DemoScenarioKey = 'scenario_a_sms' | 'scenario_b_phone' | 'scenario_c_bic' | 'scenario_d_hoa' | 'scenario_e_sensitive';

export class ContractDemoFixtureService {
  /**
   * Asserts that demo mode is active and safe.
   */
  public static assertDemoModeAllowed(): void {
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    const isDemoEnabled = process.env.CONTRACT_COPILOT_DEMO_MODE === 'true' || 
                          process.env.ENABLE_CONTRACT_DEMO_MODE === 'true' || 
                          process.env.NODE_ENV === 'test';

    if (isProduction) {
      const err = new Error('DEMO_FIXTURES_DISABLED_IN_PRODUCTION: Demo fixtures are strictly forbidden in production environments.');
      (err as any).code = 'DEMO_FIXTURES_DISABLED_IN_PRODUCTION';
      throw err;
    }

    if (!isDemoEnabled) {
      const err = new Error('DEMO_MODE_NOT_ENABLED: Demo mode requires explicit CONTRACT_COPILOT_DEMO_MODE=true environment configuration.');
      (err as any).code = 'DEMO_MODE_NOT_ENABLED';
      throw err;
    }
  }

  /**
   * Generates a quarantined PendingContractIntake demo scenario record.
   */
  public static async createDemoFixture(scenario: DemoScenarioKey, workspaceId: string = 'nest-realty-wilmington', brokerUserId: string = 'usr_broker_alice'): Promise<PendingContractIntake> {
    this.assertDemoModeAllowed();

    // Ensure candidate identity exists
    ContractIdentityBindingService.registerPhone('+19105551234', brokerUserId);
    ContractIdentityBindingService.registerEmail('alice@nestrealty.com', brokerUserId);

    const correlationId = `demo_corr_${scenario}_${Date.now()}`;
    const idempotencyKey = `demo_idemp_${scenario}_${Date.now()}`;

    switch (scenario) {
      case 'scenario_a_sms':
        return await PendingContractIntakeService.createPendingIntake({
          workspaceId,
          channel: 'retell_sms',
          transportStatus: 'verified',
          candidateUserId: brokerUserId,
          candidatePhone: '+19105551234',
          proposedTerms: {
            purchasePriceCents: 72500000,
            dueDiligenceFeeCents: 750000,
            initialEarnestMoneyCents: 500000,
            settlementDate: '2026-09-18',
            dueDiligenceDate: '2026-08-20',
            financingType: 'conventional',
            sellerConcessionsCents: 500000
          },
          proposedProperty: {
            streetAddress: '123 Ocean View Drive',
            city: 'Wilmington',
            county: 'New Hanover',
            state: 'NC',
            postalCode: '28401'
          },
          proposedParties: [
            { id: `p_demo_1`, role: 'buyer', fullName: 'John Smith' },
            { id: `p_demo_2`, role: 'buyer', fullName: 'Jane Smith' }
          ],
          correlationId,
          idempotencyKey
        });

      case 'scenario_b_phone':
        return await PendingContractIntakeService.createPendingIntake({
          workspaceId,
          channel: 'retell_phone',
          transportStatus: 'verified',
          candidateUserId: brokerUserId,
          candidatePhone: '+19105551234',
          proposedTerms: {
            purchasePriceCents: 62500000,
            dueDiligenceFeeCents: 1000000
          },
          proposedProperty: {
            streetAddress: '456 Wrightsville Ave',
            city: 'Wilmington',
            county: 'New Hanover',
            state: 'NC',
            postalCode: '28403'
          },
          proposedParties: [
            { id: `p_demo_3`, role: 'buyer', fullName: 'Marcus Aman' }
          ],
          correlationId,
          idempotencyKey
        });

      case 'scenario_c_bic':
        return await PendingContractIntakeService.createPendingIntake({
          workspaceId,
          channel: 'email',
          transportStatus: 'verified',
          candidateUserId: brokerUserId,
          candidateEmail: 'alice@nestrealty.com',
          proposedTerms: {
            purchasePriceCents: 65000000,
            dueDiligenceFeeCents: 500000,
            initialEarnestMoneyCents: 500000,
            settlementDate: '2026-10-01'
          },
          proposedProperty: {
            streetAddress: '789 Market Street',
            city: 'Wilmington',
            county: 'New Hanover',
            state: 'NC',
            postalCode: '28401'
          },
          bicReviewRequired: true,
          bicReviewReason: 'Custom contract clause requested via email: "Seller agrees to replace entire roof prior to closing."',
          correlationId,
          idempotencyKey
        });

      case 'scenario_d_hoa':
        return await PendingContractIntakeService.createPendingIntake({
          workspaceId,
          channel: 'retell_phone',
          transportStatus: 'verified',
          candidateUserId: brokerUserId,
          candidatePhone: '+19105551234',
          proposedTerms: {
            purchasePriceCents: 62500000,
            hoaStatusKnown: true,
            associationName: 'Wilmington Beach HOA',
            hoaAnnualFeeCents: 240000,
            conflictingHoaInfo: true
          },
          proposedProperty: {
            streetAddress: '101 Soundview Drive',
            city: 'Wrightsville Beach',
            county: 'New Hanover',
            state: 'NC',
            postalCode: '28480'
          },
          bicReviewRequired: true,
          bicReviewReason: 'Conflicting HOA information: Phone caller stated $2,400/yr dues, while listing notes specify $4,800/yr.',
          correlationId,
          idempotencyKey
        });

      case 'scenario_e_sensitive':
        return await PendingContractIntakeService.createPendingIntake({
          workspaceId,
          channel: 'retell_sms',
          transportStatus: 'verified',
          candidateUserId: brokerUserId,
          candidatePhone: '+19105551234',
          proposedTerms: {
            purchasePriceCents: 62500000,
            personalPropertyInclusions: ['Wiring instructions: Routing [REDACTED_SENSITIVE_DATA], Acct [REDACTED_SENSITIVE_DATA]']
          },
          proposedProperty: {
            streetAddress: '202 Carolina Beach Ave',
            city: 'Carolina Beach',
            county: 'New Hanover',
            state: 'NC',
            postalCode: '28428'
          },
          validationIssues: [
            {
              code: 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED',
              severity: 'critical',
              fieldPath: 'terms.personalPropertyInclusions',
              message: 'Sensitive banking or wiring details detected and redacted in-place.',
              timestamp: new Date().toISOString()
            }
          ],
          correlationId,
          idempotencyKey
        });

      default:
        throw new Error(`UNKNOWN_DEMO_SCENARIO: Scenario '${scenario}' is not recognized.`);
    }
  }
}
