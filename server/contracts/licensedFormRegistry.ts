/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Provider-Neutral Licensed Form Registry — Phase 4A Architecture
 * Stores metadata and version integrity records for authorized North Carolina real estate forms.
 * 
 * COPYRIGHT & SECURITY STRICT BOUNDARY:
 * Stores ONLY metadata, edition dates, version hashes, and provider identifiers.
 * Contains ZERO copyrighted preprinted legal form text, PDF templates, or contract verbiage.
 */

import { FormRegistryEntry } from './licensedFormProviderInterface.js';
import { ContractTransactionType } from './contractDomainTypes.js';
import crypto from 'crypto';

export class LicensedFormRegistry {
  
  private static registryEntries: FormRegistryEntry[] = [
    {
      externalFormId: 'nc_realtors_form_2t_2026_v1',
      canonicalFormCode: 'NC_REALTORS_NC_BAR_FORM_2T',
      formName: 'Form 2-T',
      displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (Transactional Form)',
      editionDate: '2026-07-01',
      effectiveDate: '2026-07-01',
      retirementDate: null,
      jurisdiction: 'NC',
      transactionTypeCompatibility: ['residential_resale_buyer_offer'],
      activeStatus: true,
      providerId: 'lone_wolf_transact',
      providerMetadata: {
        vendorCode: '2T-NC-2026',
        officialLicensor: 'Joint NC REALTORS / North Carolina Bar Association'
      },
      lastSyncTimestamp: '2026-08-01T00:00:00Z',
      attachedVersionHash: crypto.createHash('sha256').update('NC_REALTORS_NC_BAR_FORM_2T_2026_07_01_v1').digest('hex')
    },
    {
      externalFormId: 'nc_realtors_form_2t_2024_retired',
      canonicalFormCode: 'NC_REALTORS_NC_BAR_FORM_2T_RETIRED',
      formName: 'Form 2-T (2024 Edition)',
      displayName: 'Joint NC REALTORS / North Carolina Bar Association Form 2-T (2024 Retired Edition)',
      editionDate: '2024-07-01',
      effectiveDate: '2024-07-01',
      retirementDate: '2026-06-30',
      jurisdiction: 'NC',
      transactionTypeCompatibility: ['residential_resale_buyer_offer'],
      activeStatus: false, // RETIRED
      providerId: 'lone_wolf_transact',
      providerMetadata: {
        vendorCode: '2T-NC-2024-RETIRED',
        officialLicensor: 'Joint NC REALTORS / North Carolina Bar Association'
      },
      lastSyncTimestamp: '2026-06-30T23:59:59Z',
      attachedVersionHash: crypto.createHash('sha256').update('NC_REALTORS_NC_BAR_FORM_2T_2024_07_01_RETIRED').digest('hex')
    }
  ];

  /**
   * Retrieves active, non-retired form metadata for a workspace.
   */
  public static getAvailableForms(workspaceId: string, transactionType?: ContractTransactionType): FormRegistryEntry[] {
    return this.registryEntries.filter(entry => {
      if (!entry.activeStatus) return false;
      if (entry.retirementDate && new Date(entry.retirementDate).getTime() <= Date.now()) return false;
      if (transactionType && !entry.transactionTypeCompatibility.includes(transactionType)) return false;
      return true;
    });
  }

  /**
   * Gets a specific form by canonical code.
   */
  public static getFormByCanonicalCode(canonicalCode: string): FormRegistryEntry | null {
    return this.registryEntries.find(entry => entry.canonicalFormCode === canonicalCode) || null;
  }

  /**
   * Validates form selection for active status and retirement date.
   */
  public static validateFormEntry(entry: FormRegistryEntry): { isValid: boolean; error?: string } {
    if (!entry.activeStatus) {
      return {
        isValid: false,
        error: `RETIRED_FORM_SELECTED: Form metadata '${entry.displayName}' (Edition ${entry.editionDate}) is marked inactive/retired and cannot be used for new drafts.`
      };
    }

    if (entry.retirementDate && new Date(entry.retirementDate).getTime() <= Date.now()) {
      return {
        isValid: false,
        error: `RETIRED_FORM_SELECTED: Form metadata '${entry.displayName}' retired on ${entry.retirementDate} and is no longer authorized for new offers.`
      };
    }

    return { isValid: true };
  }
}
