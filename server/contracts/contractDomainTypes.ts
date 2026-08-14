/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Domain Types — Phase 2.1 Hardened Architecture
 * Target Scope: Wilmington / Coastal NC Buyer Resale Pilot (nest-realty-wilmington)
 */

export type ContractTransactionType = 
  | 'residential_resale_buyer_offer'
  | 'unsupported_pilot_type';

export type ContractRepresentationSide = 'buyer' | 'seller' | 'dual_unsupported';

export type ContractChannel = 'web' | 'retell' | 'retell_phone' | 'elevenlabs' | 'sms' | 'email';

export type ContractSessionStatus =
  | 'intake_started'
  | 'identity_verified'
  | 'terms_collecting'
  | 'terms_confirmation_required'
  | 'form_selection_required'
  | 'validation_required'
  | 'validation_blocked'
  | 'bic_review_required'
  | 'draft_requested'
  | 'draft_ready'
  | 'broker_review_required'
  | 'broker_approved'
  | 'cancelled';

export type TechnicalValidationStatus =
  | 'unvalidated'
  | 'valid'
  | 'invalid'
  | 'blocked';

export type BrokerApprovalStatus = 'pending' | 'approved' | 'rejected';

export type PartyRole = 'buyer' | 'seller' | 'buyer_agent' | 'listing_agent' | 'closing_attorney' | 'lender';

export interface TransactionParty {
  id: string;
  role: PartyRole;
  fullName: string;
  email?: string;
  phone?: string;
  entityType?: 'individual' | 'llc' | 'corporation' | 'trust';
  signingCapacity?: string;
}

export interface ContractProperty {
  streetAddress: string;
  city: string;
  county: string;
  state: 'NC';
  postalCode: string;
  mlsId?: string;
  parcelId?: string;
  legalDescriptionSourceRef?: string;
}

export interface ContractTerms {
  // Monetary values stored in safe integer cents
  purchasePriceCents?: number;
  dueDiligenceFeeCents?: number;
  initialEarnestMoneyCents?: number;
  additionalEarnestMoneyCents?: number;
  sellerConcessionCents?: number;

  // Dates in ISO YYYY-MM-DD calendar format
  offerDate?: string;
  dueDiligenceDate?: string;
  settlementDate?: string;

  financingCategory?: 'cash' | 'conventional' | 'fha' | 'va' | 'usda' | 'seller_financing_unsupported';
  personalPropertyInclusions?: string[];
  personalPropertyExclusions?: string[];

  // Factual HOA / Owners' Association details
  hoaStatusKnown?: boolean;
  associationName?: string;
  hoaAnnualFeeCents?: number;
  knownSpecialAssessmentsCents?: number;
  hoaSourceRef?: string;
  conflictingHoaInfo?: boolean;
}

export type SourceType =
  | 'broker_statement'
  | 'mls_record'
  | 'seller_disclosure'
  | 'hoa_document'
  | 'transaction_system'
  | 'uploaded_document'
  | 'manual_entry';

export interface SourceReference {
  fieldPath: string;
  sourceType: SourceType;
  sourceId?: string;
  sourceDocName?: string;
  sourceTimestamp: string;
  suppliedByUserId: string;
  verificationStatus: 'unverified' | 'verified' | 'disputed';
  conflictStatus: 'no_conflict' | 'conflict_detected';
  factualNotes?: string;
}

export interface FormSelectionMetadata {
  formId?: string;
  providerId: string; // e.g., 'nc_realtors_nc_bar_joint'
  providerFormId?: string; // e.g., 'form_2t'
  displayName: string; // 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)'
  revisionIdentifier?: string;
  effectiveDate?: string;
  retirementDate?: string;
  activeStatus: boolean;
  workspaceAvailability?: string[]; // Allowed workspace IDs
  transactionTypeCompatibility?: ContractTransactionType[];
  selectedByUserId?: string;
  selectionTimestamp?: string;
  brokerConfirmationStatus: boolean;
  attachedVersionHash?: string;
  disclaimerNote?: string;
}

export interface ContractAuditEvent {
  id: string;
  actorUserId: string;
  actorCapability: string;
  workspaceId: string;
  sessionId: string;
  eventType: string;
  previousStatus?: ContractSessionStatus;
  newStatus: ContractSessionStatus;
  timestamp: string;
  requestCorrelationId?: string;
  idempotencyKey?: string;
  changedFieldNames?: string[];
  reasonCodes?: string[];
  sourceChannel: ContractChannel;
}

export interface ContractValidationIssue {
  code: string;
  severity: 'blocking' | 'warning' | 'bic_review_required';
  fieldPath?: string;
  message: string;
  timestamp: string;
}

export interface MockDraftManifest {
  sessionId: string;
  mockProviderName: string;
  fixtureFormMetadata: FormSelectionMetadata[];
  fieldValues: Record<string, any>;
  missingFieldList: string[];
  blockingIssueList: string[];
  formRevisionMetadata: string;
  generatedTimestamp: string;
  manifestHash: string;
  disclaimer: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT';
}

export interface ContractIntakeSession {
  id: string;
  workspaceId: string;
  officeId: string;
  opsRequestId?: string;
  requestingUserId: string;
  requestingBrokerId: string;
  channel: ContractChannel;
  transactionType: ContractTransactionType;
  representationSide: ContractRepresentationSide;
  status: ContractSessionStatus;
  technicalValidationStatus: TechnicalValidationStatus;
  bicReviewRequired: boolean;
  bicReviewReason?: string;
  brokerApprovalStatus: BrokerApprovalStatus;
  idempotencyKey?: string;

  parties: TransactionParty[];
  property?: ContractProperty;
  terms: ContractTerms;
  sources: SourceReference[];
  selectedForms: FormSelectionMetadata[];
  validationIssues: ContractValidationIssue[];
  draftManifest?: MockDraftManifest;

  createdAt: string;
  updatedAt: string;
  version: number;
}
