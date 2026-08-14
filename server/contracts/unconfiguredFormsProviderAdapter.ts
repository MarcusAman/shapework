/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unconfigured Forms Provider Adapter — Phase 4A Architecture
 * Fail-closed default adapter used when no third-party licensed forms provider is configured.
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
import { ContractTransactionType } from './contractDomainTypes.js';

export class UnconfiguredFormsProviderAdapter implements ILicensedContractFormProvider {
  public readonly providerId = 'unconfigured';
  public readonly providerName = 'Unconfigured Licensed Forms Provider';

  public isConfigured(_workspaceId: string): boolean {
    return false;
  }

  private failClosed(action: string): never {
    throw new Error(
      `LICENSED_FORMS_PROVIDER_NOT_CONFIGURED: Unable to perform '${action}'. No licensed forms provider (e.g. Lone Wolf Transactions / zipForm Edition) is configured. Production contract draft generation cannot proceed without an authorized, licensed forms provider integration.`
    );
  }

  public async getAvailableForms(_workspaceId: string, _transactionType?: ContractTransactionType): Promise<FormRegistryEntry[]> {
    return [];
  }

  public async getFormMetadata(_formId: string, _workspaceId: string): Promise<FormRegistryEntry | null> {
    return null;
  }

  public async getCurrentFormVersion(_canonicalFormCode: string, _workspaceId: string): Promise<FormRegistryEntry | null> {
    return null;
  }

  public async createDraftTransaction(_params: CreateDraftTransactionParams): Promise<DraftTransactionResult> {
    this.failClosed('createDraftTransaction');
  }

  public async populateAuthorizedFields(_params: PopulateFieldsParams): Promise<PopulateFieldsResult> {
    this.failClosed('populateAuthorizedFields');
  }

  public async getDraftPreview(_transactionId: string, _workspaceId: string): Promise<DraftPreviewResult> {
    this.failClosed('getDraftPreview');
  }

  public async getProviderTransactionStatus(_transactionId: string, _workspaceId: string): Promise<ProviderTransactionStatusResult> {
    this.failClosed('getProviderTransactionStatus');
  }
}
