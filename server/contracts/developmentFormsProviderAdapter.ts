/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Development Forms Provider Adapter — Phase 4A Architecture
 * Adapter wrapping MockContractFormProvider for development and testing environments only.
 * 
 * FAIL-CLOSED GUARD:
 * Rejects execution if invoked in production mode (APP_MODE === 'production' or NODE_ENV === 'production').
 */

import {
  ILicensedContractFormProvider,
  FormRegistryEntry,
  CreateDraftTransactionParams,
  DraftTransactionResult,
  PopulateFieldsParams,
  PopulateFieldsResult,
  DraftPreviewResult,
  ProviderTransactionStatusResult
} from './licensedFormProviderInterface.js';
import { LicensedFormRegistry } from './licensedFormRegistry.js';
import { ContractFormsConfigService } from './contractFormsConfig.js';
import { ContractTransactionType } from './contractDomainTypes.js';

export class DevelopmentFormsProviderAdapter implements ILicensedContractFormProvider {
  public readonly providerId = 'mock_dev';
  public readonly providerName = 'Shapework Development Mock Forms Adapter';

  public isConfigured(workspaceId: string): boolean {
    if (ContractFormsConfigService.isProductionEnvironment()) {
      return false;
    }
    return true;
  }

  private assertNotProduction(action: string, workspaceId: string): void {
    if (ContractFormsConfigService.isProductionEnvironment()) {
      throw new Error(
        `LICENSED_FORMS_PROVIDER_NOT_CONFIGURED: Development mock forms adapter cannot execute '${action}' in production mode for workspace '${workspaceId}'. An authorized, licensed forms provider integration (e.g. Lone Wolf Transactions) is required.`
      );
    }
  }

  public async getAvailableForms(workspaceId: string, transactionType?: ContractTransactionType): Promise<FormRegistryEntry[]> {
    return LicensedFormRegistry.getAvailableForms(workspaceId, transactionType);
  }

  public async getFormMetadata(formId: string, workspaceId: string): Promise<FormRegistryEntry | null> {
    const forms = LicensedFormRegistry.getAvailableForms(workspaceId);
    return forms.find(f => f.externalFormId === formId || f.canonicalFormCode === formId) || null;
  }

  public async getCurrentFormVersion(canonicalFormCode: string, workspaceId: string): Promise<FormRegistryEntry | null> {
    return LicensedFormRegistry.getFormByCanonicalCode(canonicalFormCode);
  }

  public async createDraftTransaction(params: CreateDraftTransactionParams): Promise<DraftTransactionResult> {
    this.assertNotProduction('createDraftTransaction', params.workspaceId);

    const formEntry = LicensedFormRegistry.getFormByCanonicalCode(params.canonicalFormCode) || LicensedFormRegistry.getAvailableForms(params.workspaceId)[0];
    const timestamp = new Date().toISOString();

    return {
      success: true,
      providerTransactionId: `mock_tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      providerId: this.providerId,
      formEntry,
      createdTimestamp: timestamp,
      status: 'draft_created',
      notes: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT'
    };
  }

  public async populateAuthorizedFields(params: PopulateFieldsParams): Promise<PopulateFieldsResult> {
    this.assertNotProduction('populateAuthorizedFields', params.workspaceId);

    const keys = Object.keys(params.fieldMap || {});
    return {
      success: true,
      providerTransactionId: params.providerTransactionId,
      populatedFieldCount: keys.length,
      unmappedFields: [],
      lastUpdatedTimestamp: new Date().toISOString()
    };
  }

  public async getDraftPreview(transactionId: string, workspaceId: string): Promise<DraftPreviewResult> {
    this.assertNotProduction('getDraftPreview', workspaceId);

    return {
      success: true,
      providerTransactionId: transactionId,
      previewUrl: `/api/contracts/mock-preview/${transactionId}`,
      previewStatus: 'ready',
      disclaimer: 'NON-EXECUTABLE DEVELOPMENT FIXTURE — NOT A CONTRACT'
    };
  }

  public async getProviderTransactionStatus(transactionId: string, workspaceId: string): Promise<ProviderTransactionStatusResult> {
    this.assertNotProduction('getProviderTransactionStatus', workspaceId);

    return {
      providerTransactionId: transactionId,
      status: 'draft',
      lastSyncedTimestamp: new Date().toISOString(),
      providerMetadata: { mock: true, environment: 'development' }
    };
  }
}
