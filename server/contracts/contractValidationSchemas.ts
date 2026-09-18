/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Validation Engine — Phase 2.1 Hardened Architecture
 * Enforces schema validation, data integrity, prohibited content detection, sensitive data guards, and BIC escalation rules.
 */

import { ContractIntakeSession, ContractValidationIssue } from './contractDomainTypes.js';

export class ContractValidationEngine {

  /**
   * Sensitive data patterns: Bank routing numbers, SSNs, credit cards, passwords.
   */
  private static SENSITIVE_PATTERNS = [
    { code: 'ROUTING_NUMBER', regex: /\b\d{9}\b/g },
    { code: 'BANK_ACCOUNT', regex: /\b\d{8,17}\b/g },
    { code: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { code: 'CREDIT_CARD', regex: /\b(?:\d[ -]*?){13,16}\b/g },
    { code: 'PASSWORD_OR_TOKEN', regex: /(?:password|secret|auth_token|api_key)\s*[:=]\s*\S+/gi }
  ];
  
  /**
   * Run full deterministic validation pass on a contract intake session.
   */
  public static validateSession(session: ContractIntakeSession): {
    isValid: boolean;
    isBlocked: boolean;
    bicReviewRequired: boolean;
    issues: ContractValidationIssue[];
  } {
    const issues: ContractValidationIssue[] = [];
    const timestamp = new Date().toISOString();

    // 0. Sensitive Data Guard (Immediate Rejection)
    const sensitiveFound = this.detectAndSanitizeSensitiveData(session, issues, timestamp);

    // 1. Pilot Scope Check
    if (session.transactionType !== 'residential_resale_buyer_offer') {
      issues.push({
        code: 'UNSUPPORTED_PILOT_TRANSACTION_TYPE',
        severity: 'bic_review_required',
        message: 'Transaction type is outside the buyer resale pilot scope. Human BIC review required.',
        timestamp
      });
    }

    // 2. Property Validation
    if (!session.property || !session.property.streetAddress || !session.property.city || !session.property.postalCode) {
      issues.push({
        code: 'PROPERTY_ADDRESS_MISSING',
        severity: 'blocking',
        fieldPath: 'property.streetAddress',
        message: 'Complete street address, city, and postal code are required.',
        timestamp
      });
    }

    // 3. Buyer Party Validation
    const buyers = session.parties.filter(p => p.role === 'buyer');
    if (buyers.length === 0 || !buyers[0].fullName) {
      issues.push({
        code: 'BUYER_IDENTITY_MISSING',
        severity: 'blocking',
        fieldPath: 'parties.buyer',
        message: 'At least one buyer full name is required for purchase offer drafting.',
        timestamp
      });
    }

    // 4. Financial Terms Validation
    const terms = session.terms;

    if (terms.purchasePriceCents === undefined || terms.purchasePriceCents === null) {
      issues.push({
        code: 'PURCHASE_PRICE_MISSING',
        severity: 'blocking',
        fieldPath: 'terms.purchasePriceCents',
        message: 'Purchase price is required.',
        timestamp
      });
    } else if (terms.purchasePriceCents < 0 || !Number.isInteger(terms.purchasePriceCents)) {
      issues.push({
        code: 'PURCHASE_PRICE_INVALID',
        severity: 'blocking',
        fieldPath: 'terms.purchasePriceCents',
        message: 'Purchase price must be a non-negative integer in cents.',
        timestamp
      });
    }

    if (terms.dueDiligenceFeeCents !== undefined && (terms.dueDiligenceFeeCents < 0 || !Number.isInteger(terms.dueDiligenceFeeCents))) {
      issues.push({
        code: 'DUE_DILIGENCE_FEE_INVALID',
        severity: 'blocking',
        fieldPath: 'terms.dueDiligenceFeeCents',
        message: 'Due diligence fee must be a non-negative integer in cents.',
        timestamp
      });
    }

    if (terms.initialEarnestMoneyCents !== undefined && (terms.initialEarnestMoneyCents < 0 || !Number.isInteger(terms.initialEarnestMoneyCents))) {
      issues.push({
        code: 'INITIAL_EARNEST_MONEY_INVALID',
        severity: 'blocking',
        fieldPath: 'terms.initialEarnestMoneyCents',
        message: 'Initial earnest money must be a non-negative integer in cents.',
        timestamp
      });
    }

    // 5. Date Sequence Integrity
    if (terms.offerDate && terms.settlementDate) {
      if (terms.settlementDate < terms.offerDate) {
        issues.push({
          code: 'SETTLEMENT_DATE_BEFORE_OFFER_DATE',
          severity: 'blocking',
          fieldPath: 'terms.settlementDate',
          message: 'Settlement date cannot precede the offer date.',
          timestamp
        });
      }
    }

    if (terms.dueDiligenceDate && terms.settlementDate) {
      if (terms.dueDiligenceDate > terms.settlementDate) {
        issues.push({
          code: 'DUE_DILIGENCE_DATE_AFTER_SETTLEMENT_DATE',
          severity: 'blocking',
          fieldPath: 'terms.dueDiligenceDate',
          message: 'Due diligence date cannot be after the settlement date.',
          timestamp
        });
      }
    }

    // 6. Form Selection Metadata Verification
    if (session.selectedForms.length === 0) {
      issues.push({
        code: 'FORM_SELECTION_MISSING',
        severity: 'blocking',
        fieldPath: 'selectedForms',
        message: 'Explicit form metadata selection (Joint NC REALTORS / NC Bar Form 2-T metadata) is required.',
        timestamp
      });
    } else {
      const unconfirmedForm = session.selectedForms.find(f => !f.brokerConfirmationStatus);
      if (unconfirmedForm) {
        issues.push({
          code: 'BROKER_FORM_CONFIRMATION_MISSING',
          severity: 'blocking',
          fieldPath: 'selectedForms',
          message: `Broker confirmation required for selected form metadata "${unconfirmedForm.displayName}".`,
          timestamp
        });
      }

      const retiredForm = session.selectedForms.find(f => !f.activeStatus);
      if (retiredForm) {
        issues.push({
          code: 'RETIRED_FORM_SELECTED',
          severity: 'blocking',
          fieldPath: 'selectedForms',
          message: `Form metadata "${retiredForm.displayName}" is marked inactive/retired and cannot be used for new drafts.`,
          timestamp
        });
      }
    }

    // 7. Source Provenance Conflicts & HOA Checks
    if (terms.conflictingHoaInfo) {
      issues.push({
        code: 'HOA_CONFLICTING_INFORMATION',
        severity: 'bic_review_required',
        fieldPath: 'terms.conflictingHoaInfo',
        message: 'Conflicting factual HOA information provided. Escalated for BIC/compliance review.',
        timestamp
      });
    }

    const conflictingSources = session.sources.filter(s => s.conflictStatus === 'conflict_detected');
    if (conflictingSources.length > 0) {
      issues.push({
        code: 'SOURCE_CONFLICT_DETECTED',
        severity: 'bic_review_required',
        message: `Conflicting source values detected across ${conflictingSources.length} fields. BIC review required.`,
        timestamp
      });
    }

    const hoaSources = session.sources.filter(s => s.sourceType === 'hoa_document');
    const unverifiedHoa = hoaSources.find(s => s.verificationStatus !== 'verified');
    if (unverifiedHoa) {
      issues.push({
        code: 'UNVERIFIED_HOA_SOURCE',
        severity: 'bic_review_required',
        message: 'HOA document details are unverified or contain ambiguity. BIC review required.',
        timestamp
      });
    }

    // 8. Prohibited Content Guards
    this.detectProhibitedContent(session, issues, timestamp);

    const isBlocked = issues.some(i => i.severity === 'blocking') || sensitiveFound;
    const bicReviewRequired = issues.some(i => i.severity === 'bic_review_required');
    const isValid = !isBlocked && !bicReviewRequired;

    return {
      isValid,
      isBlocked,
      bicReviewRequired,
      issues
    };
  }

  /**
   * Detects prohibited sensitive financial/auth information and sanitizes session in place.
   */
  public static detectAndSanitizeSensitiveData(
    session: ContractIntakeSession,
    issues: ContractValidationIssue[],
    timestamp: string
  ): boolean {
    const rawText = JSON.stringify(session.terms) + JSON.stringify(session.parties);
    const hasWiring = /wiring\s*instructions|wire\s*transfer|routing\s*number|bank\s*account|\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b|REDACTED_SENSITIVE_DATA/i.test(rawText);

    if (hasWiring) {
      if (!issues.some(i => i.code === 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED')) {
        issues.unshift({
          code: 'SENSITIVE_FINANCIAL_INFORMATION_REJECTED',
          severity: 'blocking',
          message: 'For security, Ask Nest Ops cannot collect or transmit wiring, banking, or authentication information.',
          timestamp
        });
      }

      // Sanitize terms
      if (session.terms?.personalPropertyInclusions) {
        session.terms.personalPropertyInclusions = session.terms.personalPropertyInclusions.map(
          item => item.replace(/wiring\s*instructions|routing\s*number|bank\s*account|\b\d{9}\b|\b\d{8,17}\b/gi, '[REDACTED_SENSITIVE_DATA]')
        );
      }
      return true;
    }
    return false;
  }

  /**
   * Deterministic guard checking for prohibited legal/wiring/e-signature actions.
   */
  private static detectProhibitedContent(
    session: ContractIntakeSession,
    issues: ContractValidationIssue[],
    timestamp: string
  ): void {
    const textTarget = JSON.stringify(session).toLowerCase();

    if (
      textTarget.includes('custom clause') ||
      textTarget.includes('legal advice') ||
      textTarget.includes('interpret covenant') ||
      textTarget.includes('draft special provision')
    ) {
      issues.push({
        code: 'PROHIBITED_ACTION_CUSTOM_CLAUSE',
        severity: 'bic_review_required',
        message: 'Custom legal clause drafting or legal interpretation requested. System cannot generate custom legal language; referred to BIC/Attorney.',
        timestamp
      });
    }

    if (
      textTarget.includes('send for signature') ||
      textTarget.includes('execute contract') ||
      textTarget.includes('sign on behalf of')
    ) {
      issues.push({
        code: 'PROHIBITED_ACTION_SIGNATURE_DELIVERY',
        severity: 'blocking',
        message: 'Direct contract execution or automated e-signature delivery is prohibited.',
        timestamp
      });
    }

    if (textTarget.includes('legallyvalid') || textTarget.includes('compliancepassed')) {
      issues.push({
        code: 'PROHIBITED_LEGAL_CONCLUSION',
        severity: 'blocking',
        message: 'System cannot declare contracts legally valid or make compliance determinations.',
        timestamp
      });
    }
  }
}
