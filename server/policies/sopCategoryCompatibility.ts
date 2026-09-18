/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Category-to-SOP Compatibility Matrix & Integrity Validator
 * 
 * Ensures that governing SOPs bound to routing policy rules genuinely apply to
 * the deliverable category. Rejects cross-department contamination (e.g. stamping
 * a listing-launch or collateral SOP onto technology, signage, compliance, or accounting tasks).
 */

import { sopRepository } from '../persistence/sopRepository.js';

export interface SopCompatibilityValidationResult {
  valid: boolean;
  sopId?: string;
  sopTitle?: string;
  sopVersion?: string;
  sopCategory?: string;
  allowedCategories?: string[];
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Authoritative mapping of published SOP IDs to their allowed routing categories.
 * Normalizes all category strings to lowercase.
 */
export const SOP_CATEGORY_COMPATIBILITY_MAP: Record<string, {
  title: string;
  allowedCategories: string[];
  primaryDepartment: string;
}> = {
  // 1. Listing Launch Protocol
  'sop_listing_launch_001': {
    title: 'Listing Launch Protocol',
    allowedCategories: [
      'marketing',
      'marketing request',
      'listing marketing',
      'listing_marketing',
      'marketing_collateral'
    ],
    primaryDepartment: 'Marketing'
  },

  // 2. Form 2-T Contract Review & Buyer Compliance
  'sop_contract_verification_002': {
    title: 'Buyer Contract Verification & EMD Audit Protocol',
    allowedCategories: [
      'contracts',
      'compliance',
      'broker-in-charge question',
      'contract / transaction issue',
      'form_2t'
    ],
    primaryDepartment: 'Compliance & Legal'
  },
  'sop_form_2t_review_012': {
    title: 'Form 2-T Contract Review & EMD Audit Protocol',
    allowedCategories: [
      'contracts',
      'compliance',
      'broker-in-charge question',
      'contract / transaction issue',
      'form_2t'
    ],
    primaryDepartment: 'Compliance & Legal'
  },

  // 3. Marketing Intake & Campaign Dispatch
  'sop_marketing_intake_003': {
    title: 'Marketing Intake & Campaign Dispatch Protocol',
    allowedCategories: [
      'marketing',
      'marketing request',
      'listing marketing',
      'marketing_collateral',
      'print',
      'social',
      'flyer',
      'brochure'
    ],
    primaryDepartment: 'Marketing'
  },

  // 4. Yard Sign Vendor Dispatch & Post Retrieval
  'sop_sign_vendor_004': {
    title: 'Sign Vendor Dispatch & Post Retrieval Protocol',
    allowedCategories: [
      'signage',
      'signs / riders',
      'yard_post',
      'sign_post'
    ],
    primaryDepartment: 'Operations'
  },

  // 5. Buyer Representation & WWREA Agency Onboarding
  'sop_buyer_onboarding_005': {
    title: 'Buyer Representation & Agency Onboarding Protocol',
    allowedCategories: [
      'operations',
      'agent question',
      'buyer_onboarding',
      'agency'
    ],
    primaryDepartment: 'Operations'
  },

  // 6. Social Media Reels & Story Blitz
  'sop_social_media_blitz_006': {
    title: 'Social Media Reel & Story Campaign Blitz Protocol',
    allowedCategories: [
      'marketing',
      'social',
      'marketing_collateral',
      'marketing request'
    ],
    primaryDepartment: 'Marketing'
  },

  // 7. Maxa Design Center Collateral
  'sop_maxa_collateral_007': {
    title: 'Autonomous Maxa Collateral Production & 300 DPI Export Protocol',
    allowedCategories: [
      'marketing',
      'marketing_collateral',
      'print',
      'marketing request'
    ],
    primaryDepartment: 'Marketing'
  },

  // 8. Proof Review & Revisions
  'sop_proof_review_approval_008': {
    title: 'Proof Review, Revisions & Agent 1-Click Approval Protocol',
    allowedCategories: [
      'marketing',
      'marketing_collateral',
      'marketing request'
    ],
    primaryDepartment: 'Marketing'
  },

  // 9. Commission Disbursement Authorization (CDA)
  'sop_commission_disbursement_015': {
    title: 'Commission Disbursement Authorization (CDA) Protocol',
    allowedCategories: [
      'accounting',
      'accounting / commissions',
      'payables / bills / receipts',
      'finance'
    ],
    primaryDepartment: 'Accounting & Finance'
  }
};

/**
 * Returns true if the given SOP ID is authorized to govern the specified category.
 */
export function isSopCompatibleWithCategory(sopId: string, category: string): boolean {
  if (!sopId || !category) return false;
  const config = SOP_CATEGORY_COMPATIBILITY_MAP[sopId];
  if (!config) return false;

  const normalizedCategory = category.toLowerCase().trim();
  return config.allowedCategories.some(cat => cat.toLowerCase() === normalizedCategory);
}

/**
 * Validates whether a candidate SOP association is structurally and semantically valid.
 * Checks:
 * 1. Does the SOP ID exist in repository?
 * 2. Is the SOP in 'published' status?
 * 3. Does the SOP belong to the target workspace or an authorized alias?
 * 4. Is the SOP compatible with the deliverable category?
 */
export function validateSopCompatibility(
  sopId: string | undefined | null,
  category: string,
  workspaceId: string = 'ws_wilmington'
): SopCompatibilityValidationResult {
  if (!sopId) {
    return {
      valid: false,
      errorCode: 'NO_SOP_ASSIGNED',
      errorMessage: `Category "${category}" has no governing SOP assigned.`
    };
  }

  // 1. Check compatibility map
  const compatibilityConfig = SOP_CATEGORY_COMPATIBILITY_MAP[sopId];
  if (!compatibilityConfig) {
    // Check if it exists in sopRepository at all
    const sopDoc = sopRepository.getSopById(sopId, workspaceId);
    if (!sopDoc) {
      return {
        valid: false,
        sopId,
        errorCode: 'SOP_NOT_FOUND',
        errorMessage: `SOP "${sopId}" does not exist in SOP repository.`
      };
    }

    // If it exists in repository but not in compatibility map, verify status
    if (sopDoc.status !== 'published') {
      return {
        valid: false,
        sopId,
        sopTitle: sopDoc.title,
        errorCode: 'SOP_NOT_PUBLISHED',
        errorMessage: `SOP "${sopDoc.title}" (${sopId}) is in "${sopDoc.status}" state, not published.`
      };
    }

    // Fail safe: unmapped SOP
    return {
      valid: false,
      sopId,
      sopTitle: sopDoc.title,
      errorCode: 'SOP_CATEGORY_INCOMPATIBLE',
      errorMessage: `SOP "${sopDoc.title}" (${sopId}) has no declared category compatibility for "${category}".`
    };
  }

  // 2. Verify allowed category match
  const normalizedCategory = category.toLowerCase().trim();
  const isMatch = compatibilityConfig.allowedCategories.some(
    cat => cat.toLowerCase() === normalizedCategory
  );

  if (!isMatch) {
    return {
      valid: false,
      sopId,
      sopTitle: compatibilityConfig.title,
      allowedCategories: compatibilityConfig.allowedCategories,
      errorCode: 'CATEGORY_SOP_MISMATCH',
      errorMessage: `Category "${category}" cannot be governed by "${compatibilityConfig.title}" (${sopId}). Allowed categories: ${compatibilityConfig.allowedCategories.join(', ')}.`
    };
  }

  // 3. Verify existence and published status in repository
  const sopDoc = sopRepository.getSopById(sopId, workspaceId);
  if (!sopDoc) {
    return {
      valid: false,
      sopId,
      sopTitle: compatibilityConfig.title,
      errorCode: 'SOP_NOT_FOUND_IN_WORKSPACE',
      errorMessage: `SOP "${sopId}" is not available in workspace "${workspaceId}".`
    };
  }

  if (sopDoc.status !== 'published') {
    return {
      valid: false,
      sopId,
      sopTitle: sopDoc.title,
      sopVersion: String(sopDoc.version || '1'),
      errorCode: 'SOP_NOT_PUBLISHED',
      errorMessage: `SOP "${sopDoc.title}" (${sopId}) is "${sopDoc.status}", only published SOPs may govern routing.`
    };
  }

  return {
    valid: true,
    sopId,
    sopTitle: sopDoc.title,
    sopVersion: String(sopDoc.version || '1'),
    sopCategory: sopDoc.purpose,
    allowedCategories: compatibilityConfig.allowedCategories
  };
}

/**
 * Dynamically registers category compatibility for a newly published SOP.
 * Used during testing or local policy publication workflows.
 */
export function registerSopCategoryCompatibility(
  sopId: string,
  details: {
    title: string;
    allowedCategories: string[];
    primaryDepartment: string;
  }
): void {
  SOP_CATEGORY_COMPATIBILITY_MAP[sopId] = details;
}
