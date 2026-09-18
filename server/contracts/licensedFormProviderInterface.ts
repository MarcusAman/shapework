/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Licensed Contract Form Provider Interface — Phase 4A Architecture
 * Provider-neutral abstraction for populating current, licensed North Carolina real estate forms
 * through authorized forms platforms (e.g. Lone Wolf Transactions / zipForm Edition).
 * 
 * CRITICAL DISCLAIMS & CONSTRAINTS:
 * - NO copyrighted preprinted form text is persisted or stored in this repository.
 * - System fails closed with LICENSED_FORMS_PROVIDER_NOT_CONFIGURED if no licensed provider is active in production.
 * - Development mock provider operates ONLY when NODE_ENV !== 'production' and APP_MODE !== 'production'.
 */

import { ContractTransactionType, ContractIntakeSession } from './contractDomainTypes.js';

export interface FormRegistryEntry {
  externalFormId: string; // e.g. 'lw_form_2t_2026_v1'
  canonicalFormCode: string; // e.g. 'NC_REALTORS_NC_BAR_FORM_2T'
  formName: string; // e.g. 'Form 2-T'
  displayName: string; // 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)'
  editionDate: string; // e.g. '2026-07-01'
  effectiveDate: string; // e.g. '2026-07-01'
  retirementDate?: string | null;
  jurisdiction: string; // 'NC'
  transactionTypeCompatibility: ContractTransactionType[];
  activeStatus: boolean;
  providerId: string; // e.g. 'lone_wolf_transact' | 'zipform_edition' | 'mock_dev'
  providerMetadata: Record<string, any>;
  lastSyncTimestamp: string;
  attachedVersionHash: string;
}

export interface CreateDraftTransactionParams {
  sessionId: string;
  workspaceId: string;
  requestingBrokerId: string;
  canonicalFormCode: string;
  transactionType: ContractTransactionType;
  propertyAddress: string;
}

export interface DraftTransactionResult {
  success: boolean;
  providerTransactionId: string;
  providerId: string;
  formEntry: FormRegistryEntry;
  createdTimestamp: string;
  status: string;
  notes?: string;
}

export interface PopulateFieldsParams {
  providerTransactionId: string;
  workspaceId: string;
  sessionId: string;
  fieldMap: Record<string, any>;
}

export interface PopulateFieldsResult {
  success: boolean;
  providerTransactionId: string;
  populatedFieldCount: number;
  unmappedFields: string[];
  lastUpdatedTimestamp: string;
}

export interface DraftPreviewResult {
  success: boolean;
  providerTransactionId: string;
  previewUrl?: string;
  previewStatus: 'ready' | 'pending' | 'unavailable';
  disclaimer: string;
}

export interface ProviderTransactionStatusResult {
  providerTransactionId: string;
  status: 'draft' | 'under_review' | 'locked' | 'unknown';
  lastSyncedTimestamp: string;
  providerMetadata: Record<string, any>;
}

export interface ILicensedContractFormProvider {
  readonly providerId: string;
  readonly providerName: string;

  isConfigured(workspaceId: string): boolean;
  getAvailableForms(workspaceId: string, transactionType?: ContractTransactionType): Promise<FormRegistryEntry[]>;
  getFormMetadata(formId: string, workspaceId: string): Promise<FormRegistryEntry | null>;
  getCurrentFormVersion(canonicalFormCode: string, workspaceId: string): Promise<FormRegistryEntry | null>;
  createDraftTransaction(params: CreateDraftTransactionParams): Promise<DraftTransactionResult>;
  populateAuthorizedFields(params: PopulateFieldsParams): Promise<PopulateFieldsResult>;
  getDraftPreview(transactionId: string, workspaceId: string): Promise<DraftPreviewResult>;
  getProviderTransactionStatus(transactionId: string, workspaceId: string): Promise<ProviderTransactionStatusResult>;
}
