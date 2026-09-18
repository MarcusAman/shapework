/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Commission Disbursement Authorization (CDA) & Escrow Audit Domain Types
 */

export interface ClosingAttorneyInfo {
  firmName: string;
  attorneyName: string;
  email: string;
  phone: string;
  escrowAccountRef: string;
}

export interface CdaAgentSplit {
  agentName: string;
  role: 'listing_agent' | 'selling_agent';
  splitPercent: number; // e.g. 70.0
  grossPayoutCents: number;
  adminFeeDeductionCents: number;
  netPayoutCents: number;
}

export interface CommissionDisbursementAuthorization {
  id: string;
  workspaceId: string;
  propertyAddress: string;
  sellerName: string;
  buyerName: string;
  closingDate: string;
  salePriceCents: number;
  totalGrossCommissionPercent: number; // e.g. 6.0
  totalGrossCommissionCents: number;
  
  // Splits
  listingSideCommissionCents: number;
  sellingSideCommissionCents: number;
  listingAgent: CdaAgentSplit;
  sellingAgent: CdaAgentSplit;
  firmRetainedCommissionCents: number;
  
  // Escrow & EMD Trust Audit
  emdAmountCents: number;
  emdTrustStatus: 'verified' | 'missing_receipt' | 'pending_bank_clearing';
  emdHeldBy: string;
  closingAttorney: ClosingAttorneyInfo;
  
  // BIC Compliance & Sign-off
  bicReviewStatus: 'approved_signed' | 'pending_emd_audit' | 'requires_bic_review';
  bicSignature: {
    signedBy: string;
    bicLicenseNumber: string;
    signedTimestamp: string;
  } | null;
  createdAt: string;
}

export function calculateCdaSplits(params: {
  salePriceCents: number;
  totalCommissionPercent: number; // e.g. 6.0
  listingAgentSplitPercent?: number; // default 70%
  sellingAgentSplitPercent?: number; // default 70%
  adminFeeCents?: number; // default $495 ($49500)
  emdAmountCents?: number;
  emdTrustStatus?: 'verified' | 'missing_receipt' | 'pending_bank_clearing';
  propertyAddress?: string;
  closingAttorney?: Partial<ClosingAttorneyInfo>;
}): CommissionDisbursementAuthorization {
  const salePrice = params.salePriceCents || 72500000; // $725,000
  const grossPercent = params.totalCommissionPercent || 6.0;
  const totalGrossCents = Math.round(salePrice * (grossPercent / 100)); // $43,500
  
  // 50/50 split between listing and selling side of commission
  const listingSideCents = Math.round(totalGrossCents / 2); // $21,750
  const sellingSideCents = Math.round(totalGrossCents / 2); // $21,750
  
  const listingSplitPct = params.listingAgentSplitPercent ?? 70;
  const sellingSplitPct = params.sellingAgentSplitPercent ?? 70;
  const adminFee = params.adminFeeCents ?? 49500; // $495.00
  
  const listingGross = Math.round(listingSideCents * (listingSplitPct / 100)); // $15,225
  const sellingGross = Math.round(sellingSideCents * (sellingSplitPct / 100)); // $15,225
  
  const listingNet = listingGross - adminFee; // $14,730
  const sellingNet = sellingGross - adminFee; // $14,730
  
  const listingRetained = listingSideCents - listingGross + adminFee;
  const sellingRetained = sellingSideCents - sellingGross + adminFee;
  const totalFirmRetained = listingRetained + sellingRetained;

  const emdStatus = params.emdTrustStatus ?? 'verified';
  const bicStatus = emdStatus === 'verified' ? 'approved_signed' : 'pending_emd_audit';

  return {
    id: `cda-${Date.now()}`,
    workspaceId: 'nest-realty-wilmington',
    propertyAddress: params.propertyAddress || '312 Mayfaire Way, Wilmington, NC 28405',
    sellerName: 'David & Sarah Miller',
    buyerName: 'James & Amanda Vance',
    closingDate: '2026-10-15',
    salePriceCents: salePrice,
    totalGrossCommissionPercent: grossPercent,
    totalGrossCommissionCents: totalGrossCents,
    listingSideCommissionCents: listingSideCents,
    sellingSideCommissionCents: sellingSideCents,
    listingAgent: {
      agentName: 'Marcus Aman',
      role: 'listing_agent',
      splitPercent: listingSplitPct,
      grossPayoutCents: listingGross,
      adminFeeDeductionCents: adminFee,
      netPayoutCents: listingNet,
    },
    sellingAgent: {
      agentName: 'Elena Rostova',
      role: 'selling_agent',
      splitPercent: sellingSplitPct,
      grossPayoutCents: sellingGross,
      adminFeeDeductionCents: adminFee,
      netPayoutCents: sellingNet,
    },
    firmRetainedCommissionCents: totalFirmRetained,
    emdAmountCents: params.emdAmountCents || 1000000, // $10,000
    emdTrustStatus: emdStatus,
    emdHeldBy: 'Shipman & Wright, LLP (Closing Attorney Trust)',
    closingAttorney: {
      firmName: params.closingAttorney?.firmName || 'Shipman & Wright, LLP',
      attorneyName: params.closingAttorney?.attorneyName || 'Gary K. Shipman, Esq.',
      email: params.closingAttorney?.email || 'closings@shipmanlaw.com',
      phone: params.closingAttorney?.phone || '(910) 762-1990',
      escrowAccountRef: params.closingAttorney?.escrowAccountRef || 'IOLTA Trust #482910-NC',
    },
    bicReviewStatus: bicStatus,
    bicSignature: bicStatus === 'approved_signed' ? {
      signedBy: 'Eric Knight (BIC)',
      bicLicenseNumber: 'NC REALTORS® BIC #278908',
      signedTimestamp: new Date().toISOString(),
    } : null,
    createdAt: new Date().toISOString(),
  };
}
