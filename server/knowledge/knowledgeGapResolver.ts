/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Knowledge-Gap Resolution Engine
 * Deterministic classification and routing of ungrounded questions to designated domain owners.
 * 
 * Governing Principles:
 * 1. When NORA lacks approved knowledge, determine the gap classification.
 * 2. Do not automatically suggest a new SOP.
 * 3. Route to the correct owner:
 *    - BIC (Ryan Crecelius) for compliance/contracts/risk
 *    - Ann Gunn for operational/onboarding/signs/lockboxes
 *    - Melissa Gagliardi for marketing/branding/collateral
 *    - Ryan Crecelius for brokerage-level decisions
 * 4. Save the resolution as a draft knowledge item.
 * 5. Require the designated owner to approve it before NORA uses it.
 */

export type KnowledgeGapType =
  | 'MISSING_KNOWLEDGE'
  | 'MISSING_CONTEXT'
  | 'PROVIDER_FAILURE'
  | 'PERMISSION_FAILURE'
  | 'CONFLICTING_EVIDENCE'
  | 'HUMAN_JUDGMENT_REQUIRED';

export interface KnowledgeOwner {
  name: string;
  role: string;
  email: string;
  domain: string;
}

export const DESIGNATED_KNOWLEDGE_OWNERS: Record<string, KnowledgeOwner> = {
  bic_compliance: {
    name: 'Ryan Crecelius',
    role: 'Broker-in-Charge & Principal Broker',
    email: 'ryan@nestrealty.com',
    domain: 'Compliance, Contracts, Trust Accounts, Risk Management & NCREC Rules'
  },
  operations_onboarding: {
    name: 'Ann Gunn',
    role: 'Director of Operations & Office Lead',
    email: 'ann.gunn@nestrealty.com',
    domain: 'Office Operations, Signs, Lockboxes, Facility Access & Onboarding'
  },
  marketing_creative: {
    name: 'Melissa Gagliardi',
    role: 'Marketing Director',
    email: 'melissa@nestrealty.com',
    domain: 'Marketing Collateral, Maxa Templates, Brand Standards & Social Media'
  },
  brokerage_leadership: {
    name: 'Ryan Crecelius',
    role: 'Brokerage Owner & Principal',
    email: 'ryan@nestrealty.com',
    domain: 'Brokerage Policy, Splits, Legal Inquiries & Strategic Decisions'
  }
};

export interface KnowledgeGapResolutionDraft {
  id: string;
  gapType: KnowledgeGapType;
  inquiryQuery: string;
  inquiryContext?: Record<string, any>;
  workspaceId: string;
  userId: string;
  designatedOwner: KnowledgeOwner;
  status: 'draft_pending_review' | 'approved' | 'rejected';
  proposedAnswer?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export class KnowledgeGapResolver {
  private static draftResolutions: KnowledgeGapResolutionDraft[] = [];

  /**
   * Classify the inquiry's knowledge gap
   */
  public static classifyGap(params: {
    query: string;
    hasProviderError?: boolean;
    isUnauthorized?: boolean;
    hasConflict?: boolean;
    missingContextParam?: string;
  }): KnowledgeGapType {
    if (params.hasProviderError) return 'PROVIDER_FAILURE';
    if (params.isUnauthorized) return 'PERMISSION_FAILURE';
    if (params.hasConflict) return 'CONFLICTING_EVIDENCE';
    if (params.missingContextParam) return 'MISSING_CONTEXT';

    const qLower = params.query.toLowerCase();
    
    // Check if requires legal / broker discretion
    if (
      qLower.includes('can i sue') ||
      qLower.includes('legal advice') ||
      qLower.includes('dispute') ||
      qLower.includes('commission split discount') ||
      qLower.includes('earnest money forfeiture') ||
      qLower.includes('ethical violation')
    ) {
      return 'HUMAN_JUDGMENT_REQUIRED';
    }

    return 'MISSING_KNOWLEDGE';
  }

  /**
   * Determine the authoritative owner for a given inquiry domain
   */
  public static resolveDomainOwner(query: string, domain?: string): KnowledgeOwner {
    const qLower = (query || '').toLowerCase();
    const dLower = (domain || '').toLowerCase();

    // 1. Compliance, Legal, Form 2-T, Trust Accounts, Disclosures -> BIC (Ryan)
    if (
      dLower === 'contracts' ||
      dLower === 'compliance' ||
      dLower === 'legal' ||
      qLower.includes('form 2-t') ||
      qLower.includes('ncrec') ||
      qLower.includes('trust account') ||
      qLower.includes('earnest money') ||
      qLower.includes('due diligence') ||
      qLower.includes('rpoads') ||
      qLower.includes('working with real estate agents') ||
      qLower.includes('disclosure') ||
      qLower.includes('bic') ||
      qLower.includes('legal')
    ) {
      return DESIGNATED_KNOWLEDGE_OWNERS.bic_compliance;
    }

    // 2. Marketing, Collateral, Flyers, Social, Maxa -> Melissa
    if (
      dLower === 'marketing' ||
      qLower.includes('flyer') ||
      qLower.includes('brochure') ||
      qLower.includes('maxa') ||
      qLower.includes('postcard') ||
      qLower.includes('social media') ||
      qLower.includes('instagram') ||
      qLower.includes('print') ||
      qLower.includes('video studio')
    ) {
      return DESIGNATED_KNOWLEDGE_OWNERS.marketing_creative;
    }

    // 3. Operations, Signs, Lockboxes, Keycard, Office -> Ann Gunn
    if (
      dLower === 'operations' ||
      qLower.includes('sign') ||
      qLower.includes('lockbox') ||
      qLower.includes('supra') ||
      qLower.includes('key') ||
      qLower.includes('office') ||
      qLower.includes('supplies') ||
      qLower.includes('onboard') ||
      qLower.includes('parking')
    ) {
      return DESIGNATED_KNOWLEDGE_OWNERS.operations_onboarding;
    }

    // 4. Default: Brokerage Leadership (Ryan Crecelius)
    return DESIGNATED_KNOWLEDGE_OWNERS.brokerage_leadership;
  }

  /**
   * Creates a draft knowledge gap resolution item
   */
  public static createResolutionDraft(params: {
    query: string;
    gapType: KnowledgeGapType;
    workspaceId: string;
    userId: string;
    inquiryContext?: Record<string, any>;
    proposedAnswer?: string;
  }): KnowledgeGapResolutionDraft {
    const owner = this.resolveDomainOwner(params.query);
    const draft: KnowledgeGapResolutionDraft = {
      id: `kgap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      gapType: params.gapType,
      inquiryQuery: params.query,
      inquiryContext: params.inquiryContext,
      workspaceId: params.workspaceId || 'ws_wilmington',
      userId: params.userId || 'ryan',
      designatedOwner: owner,
      status: 'draft_pending_review',
      proposedAnswer: params.proposedAnswer,
      createdAt: new Date().toISOString()
    };

    this.draftResolutions.unshift(draft);
    return draft;
  }

  /**
   * Approves a knowledge draft (Only makes knowledge available after approval)
   */
  public static approveDraft(draftId: string, reviewedBy: string, finalizedAnswer?: string): KnowledgeGapResolutionDraft | null {
    const draft = this.draftResolutions.find(d => d.id === draftId);
    if (!draft) return null;

    draft.status = 'approved';
    draft.reviewedBy = reviewedBy;
    draft.reviewedAt = new Date().toISOString();
    if (finalizedAnswer) {
      draft.proposedAnswer = finalizedAnswer;
    }

    return draft;
  }

  public static getDrafts(workspaceId: string = 'ws_wilmington'): KnowledgeGapResolutionDraft[] {
    return this.draftResolutions.filter(d => d.workspaceId === workspaceId);
  }

  public static resetForTesting(): void {
    this.draftResolutions = [];
  }
}
