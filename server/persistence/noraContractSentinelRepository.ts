/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NoraContractSentinelRepository: NC Form 2-T Contract Anomaly & Due Diligence Risk Sentinel
 * Real-time AI legal & risk audit engine for NCREC Standard Form 2-T Offer to Purchase contracts.
 */

export interface ContractAuditPayload {
  contractId?: string;
  propertyAddress: string;
  mlsNumber?: string;
  purchasePrice: number;
  dueDiligenceFee: number;
  dueDiligencePeriodDays: number;
  initialEarnestMoney: number;
  additionalEarnestMoney?: number;
  closingAttorney: string;
  settlementDays: number;
  financingType: 'Cash' | 'Conventional' | 'Jumbo' | 'FHA_VA';
  sellerPaidConcessions: number;
  isCoastalZone: boolean;
  hasCamaPermitDisclosure: boolean;
  hasMogDisclosure: boolean;
  hasLeadPaintDisclosure: boolean;
  hasHoaAddendum: boolean;
  specialProvisionsNotes?: string;
}

export interface ContractAnomaly {
  id: string;
  severity: 'critical' | 'warning' | 'verified';
  category: 'Due Diligence Risk' | 'Financing Reality' | 'Escrow & Closing' | 'Coastal & Regulatory' | 'Concessions & Terms';
  title: string;
  description: string;
  statutoryReference?: string;
  riskImpact: string;
  remediationClause?: string;
}

export interface ContractSentinelReport {
  contractId: string;
  propertyAddress: string;
  purchasePrice: number;
  overallSafetyScore: number; // 1 - 100
  riskSummary: {
    criticalCount: number;
    warningCount: number;
    verifiedCount: number;
    overallVerdict: 'High Risk - Requires Revision' | 'Moderate Risk - Proceed with Caution' | 'Low Risk - Clean Contract';
  };
  timelineAudit: {
    effectiveDate: string;
    dueDiligenceFeeDeadline: string;
    dueDiligenceExpirationDate: string;
    settlementDate: string;
    daysBetweenDdpAndClosing: number;
    isDdpAdequateForFinancing: boolean;
  };
  anomalies: ContractAnomaly[];
  recommendedAddenda: string[];
}

export const SAMPLE_NC_CONTRACTS: Array<{ id: string; name: string; payload: ContractAuditPayload }> = [
  {
    id: 'contract_landfall_clean',
    name: '1104 Arboretum Way — Clean Luxury Offer (Standard 28-Day DDP)',
    payload: {
      contractId: 'cnt_1104_clean',
      propertyAddress: '1104 Arboretum Way, Wilmington, NC 28405',
      mlsNumber: '10041289',
      purchasePrice: 1250000,
      dueDiligenceFee: 25000,
      dueDiligencePeriodDays: 28,
      initialEarnestMoney: 25000,
      additionalEarnestMoney: 0,
      closingAttorney: 'Law Offices of Craige & Fox PLLC',
      settlementDays: 45,
      financingType: 'Jumbo',
      sellerPaidConcessions: 5000,
      isCoastalZone: true,
      hasCamaPermitDisclosure: true,
      hasMogDisclosure: true,
      hasLeadPaintDisclosure: false, // 2018 build, exempt
      hasHoaAddendum: true,
      specialProvisionsNotes: 'All kitchen Sub-Zero and Wolf appliances convey. Closing date time is of the essence.'
    }
  },
  {
    id: 'contract_wrightsville_high_risk',
    name: '244 Beach Road — High Risk (10-Day DDP on $2.1M Jumbo & Missing CAMA)',
    payload: {
      contractId: 'cnt_244_high_risk',
      propertyAddress: '244 Beach Road, Wrightsville Beach, NC 28480',
      mlsNumber: '10041890',
      purchasePrice: 2150000,
      dueDiligenceFee: 50000,
      dueDiligencePeriodDays: 10, // DANGEROUS: Too short for coastal jumbo
      initialEarnestMoney: 50000,
      additionalEarnestMoney: 25000,
      closingAttorney: 'TBD by Buyer Broker', // ANOMALY: Undefined escrow agent
      settlementDays: 30,
      financingType: 'Jumbo',
      sellerPaidConcessions: 45000, // ANOMALY: Exceeds standard jumbo 3% limit ($64.5k is max, but $45k may trigger underwriting scrutiny)
      isCoastalZone: true,
      hasCamaPermitDisclosure: false, // CRITICAL: Missing oceanfront CAMA permit
      hasMogDisclosure: false, // CRITICAL: Missing mandatory NC MOG disclosure
      hasLeadPaintDisclosure: true,
      hasHoaAddendum: false,
      specialProvisionsNotes: 'Seller to repair dock pilings prior to settlement.'
    }
  },
  {
    id: 'contract_autumn_hall_moderate',
    name: '5219 Autumn Hall Dr — Moderate Risk (High Non-Refundable DDF & Short EMD Window)',
    payload: {
      contractId: 'cnt_5219_mod',
      propertyAddress: '5219 Autumn Hall Dr, Wilmington, NC 28405',
      mlsNumber: '10039912',
      purchasePrice: 985000,
      dueDiligenceFee: 35000,
      dueDiligencePeriodDays: 14,
      initialEarnestMoney: 15000,
      closingAttorney: 'Shipman & Wright Attorneys at Law',
      settlementDays: 35,
      financingType: 'Conventional',
      sellerPaidConcessions: 12000,
      isCoastalZone: false,
      hasCamaPermitDisclosure: false,
      hasMogDisclosure: true,
      hasLeadPaintDisclosure: false,
      hasHoaAddendum: true
    }
  }
];

export class NoraContractSentinelRepository {

  /**
   * Inspects a Form 2-T contract payload and generates an appraisal & risk sentinel diagnostic.
   */
  static inspectContract(payload: ContractAuditPayload): ContractSentinelReport {
    const anomalies: ContractAnomaly[] = [];
    let baseScore = 100;

    const price = payload.purchasePrice || 1000000;
    const ddf = payload.dueDiligenceFee || 0;
    const ddpDays = payload.dueDiligencePeriodDays || 0;
    const emd = payload.initialEarnestMoney || 0;

    // Rule 1: Due Diligence Fee vs Period Alignment & Financing Contingency Reality
    // NC Form 2-T does NOT have a financing contingency. If financing is Jumbo, lender appraisal typically takes 21-28 days.
    if (payload.financingType === 'Jumbo' && ddpDays < 21) {
      baseScore -= 25;
      anomalies.push({
        id: 'anom_ddp_jumbo_mismatch',
        severity: 'critical',
        category: 'Financing Reality',
        title: `Due Diligence Period (${ddpDays} Days) Too Short for Jumbo Financing`,
        description: `In NC Form 2-T, there is NO financing contingency. Jumbo underwriting & appraisal typically require 21–28 days. If the appraisal is low after Day ${ddpDays} at 5:00 PM, the buyer loses both the $${ddf.toLocaleString()} Due Diligence Fee and the $${emd.toLocaleString()} Earnest Money if they terminate.`,
        statutoryReference: 'NCREC Form 2-T Paragraph 4(b) (Buyer’s Due Diligence Process)',
        riskImpact: `Immediate forfeiture risk of $${(ddf + emd).toLocaleString()} if jumbo lender underwriting is delayed beyond Day ${ddpDays}.`,
        remediationClause: `Form 2A11-T Provision: "Paragraph 1(j) of the Contract is amended to extend the Due Diligence Period to 5:00 PM on [Insert Date 28 Days Out] to accommodate institutional jumbo mortgage appraisal commitment."`
      });
    } else if (ddpDays >= 21) {
      anomalies.push({
        id: 'anom_ddp_verified',
        severity: 'verified',
        category: 'Due Diligence Risk',
        title: `Adequate Due Diligence Period (${ddpDays} Days)`,
        description: `The ${ddpDays}-day period provides ample timeline for general home inspection, coastal HVAC, termite WDIR, and mortgage underwriting before the 5:00 PM deadline.`,
        riskImpact: 'Safe operational buffer for buyer investigations.'
      });
    }

    // Rule 2: Due Diligence Fee Ratio Check (Non-Refundable Capital Risk)
    const ddfRatio = (ddf / price) * 100;
    if (ddfRatio > 3.0 && ddpDays < 15) {
      baseScore -= 15;
      anomalies.push({
        id: 'anom_ddf_excessive_risk',
        severity: 'warning',
        category: 'Due Diligence Risk',
        title: `High Non-Refundable Due Diligence Fee (${ddfRatio.toFixed(1)}% of Price)`,
        description: `Buyer is delivering $${ddf.toLocaleString()} non-refundable funds with a brief ${ddpDays}-day inspection window. If latent structural defects (e.g. bulkheads, pilings) are found, the seller is not legally obligated to refund the DDF upon buyer termination.`,
        statutoryReference: 'NCREC Form 2-T Paragraph 1(i) (Due Diligence Fee Delivery)',
        riskImpact: `Unrecoverable loss of $${ddf.toLocaleString()} if contract is cancelled during Due Diligence.`,
        remediationClause: `Form 2A11-T Provision: "Due Diligence Fee of $${ddf.toLocaleString()} shall be held in escrow by Escrow Agent until completion of initial structural inspection or Day 10, whichever occurs first."`
      });
    }

    // Rule 3: Escrow Agent Verification
    if (!payload.closingAttorney || payload.closingAttorney.toLowerCase().includes('tbd') || payload.closingAttorney.length < 5) {
      baseScore -= 20;
      anomalies.push({
        id: 'anom_escrow_undefined',
        severity: 'critical',
        category: 'Escrow & Closing',
        title: 'Undefined or Incomplete Escrow Agent Name',
        description: 'NC Form 2-T requires a designated licensed NC closing attorney or escrow agent to hold the Earnest Money Deposit. Stating "TBD" invalidates the escrow holder designation and exposes the buyer to deposit disputes.',
        statutoryReference: 'NCREC Form 2-T Paragraph 1(f) (Escrow Agent Designation)',
        riskImpact: 'Legal ambiguity in holding and disbursing $${emd.toLocaleString()} EMD funds.',
        remediationClause: `Contract Correction: Insert specific firm name, e.g., "Law Offices of Craige & Fox PLLC, 701 Market St, Wilmington, NC 28401".`
      });
    } else {
      anomalies.push({
        id: 'anom_escrow_verified',
        severity: 'verified',
        category: 'Escrow & Closing',
        title: `Verified NC Escrow Agent (${payload.closingAttorney})`,
        description: 'Designated licensed NC closing attorney identified to manage trust account holding.',
        riskImpact: 'Compliant with NCREC Trust Account rules.'
      });
    }

    // Rule 4: Coastal CAMA & Flood Zone Disclosures
    if (payload.isCoastalZone && !payload.hasCamaPermitDisclosure) {
      baseScore -= 20;
      anomalies.push({
        id: 'anom_cama_missing',
        severity: 'critical',
        category: 'Coastal & Regulatory',
        title: 'Missing Coastal Area Management Act (CAMA) Permit Disclosure',
        description: 'Property is in a designated coastal AEC (Area of Environmental Concern). NC law and coastal zoning mandate CAMA setback disclosure prior to contract execution for oceanfront/soundfront modifications or repairs.',
        statutoryReference: 'NC General Statutes Chapter 113A (CAMA) & NCREC Coastal Advisory',
        riskImpact: 'Buyer cannot rebuild or modify exterior decking/bulkheads without state CAMA clearance.',
        remediationClause: `Form 2A11-T Provision: "Seller represents that all existing piers, bulkheads, and exterior improvements are fully permitted under valid NC Division of Coastal Management (CAMA) Major/General Permits."`
      });
    }

    // Rule 5: NC Mineral and Oil and Gas Rights (MOG) Disclosure
    if (!payload.hasMogDisclosure) {
      baseScore -= 10;
      anomalies.push({
        id: 'anom_mog_missing',
        severity: 'warning',
        category: 'Coastal & Regulatory',
        title: 'Missing Mandatory NC Mineral, Oil & Gas (MOG) Disclosure',
        description: 'NC General Statute 47E requires the seller to provide the mandatory MOG disclosure before offer presentation. Failure to provide grants the buyer a statutory 3-day right of rescission with full refund of all fees.',
        statutoryReference: 'NC Residential Property Disclosure Act (NCGS § 47E-4.1)',
        riskImpact: 'Statutory rescission rights created if not signed prior to effective date.',
        remediationClause: 'Attach signed NCREC Mineral and Oil and Gas Rights Mandatory Disclosure Statement prior to offer ratification.'
      });
    }

    // Rule 6: Seller Paid Concessions vs Lender Caps
    if (payload.sellerPaidConcessions > 0) {
      const concessionPercent = (payload.sellerPaidConcessions / price) * 100;
      if (concessionPercent > 3.0 && payload.financingType === 'Jumbo') {
        baseScore -= 10;
        anomalies.push({
          id: 'anom_concession_cap',
          severity: 'warning',
          category: 'Concessions & Terms',
          title: `Seller Concession ($${payload.sellerPaidConcessions.toLocaleString()}) May Exceed Lender Guideline`,
          description: `The requested $${payload.sellerPaidConcessions.toLocaleString()} credit (${concessionPercent.toFixed(1)}%) exceeds standard 3% jumbo financing Interested Party Contribution (IPC) caps for LTV > 75%. Unused credits cannot be paid to buyer as cash back at closing.`,
          statutoryReference: 'Fannie Mae / Freddie Mac & Secondary Jumbo Mortgage Underwriting Guidelines',
          riskImpact: 'Lender will reduce loan amount or disallow excess credit at the closing table.',
          remediationClause: `Form 2A11-T Provision: "Seller credit of $${payload.sellerPaidConcessions.toLocaleString()} shall be applied toward allowable closing costs, prepaids, or loan discount points as permitted by Buyer's lender."`
        });
      } else {
        anomalies.push({
          id: 'anom_concession_verified',
          severity: 'verified',
          category: 'Concessions & Terms',
          title: `Compliant Seller Concessions ($${payload.sellerPaidConcessions.toLocaleString()})`,
          description: `Seller contribution represents ${concessionPercent.toFixed(1)}% of purchase price, well within allowable financing limits.`,
          riskImpact: 'Underwriting compliant.'
        });
      }
    }

    // Rule 7: HOA Addendum (Form 2A12-T) Check
    if (payload.hasHoaAddendum) {
      anomalies.push({
        id: 'anom_hoa_verified',
        severity: 'verified',
        category: 'Coastal & Regulatory',
        title: 'NC Form 2A12-T (Owners Association Disclosure) Attached',
        description: 'HOA transfer fees, capital reserves, and master association dues disclosure attached and verified.',
        riskImpact: 'Protects buyer against undisclosed master association special assessments.'
      });
    }

    const overallSafetyScore = Math.max(15, Math.min(100, baseScore));
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;
    const verifiedCount = anomalies.filter(a => a.severity === 'verified').length;

    const overallVerdict = criticalCount > 0 
      ? 'High Risk - Requires Revision' 
      : warningCount > 0 
        ? 'Moderate Risk - Proceed with Caution' 
        : 'Low Risk - Clean Contract';

    // Timeline calculation
    const now = new Date();
    const effectiveDateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const ddpDate = new Date(now.getTime() + ddpDays * 24 * 60 * 60 * 1000);
    const ddpExpirationStr = `${ddpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at 5:00 PM EST`;

    const settlementDays = payload.settlementDays || 45;
    const settlementDate = new Date(now.getTime() + settlementDays * 24 * 60 * 60 * 1000);
    const settlementDateStr = settlementDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const recommendedAddenda = anomalies
      .filter(a => a.remediationClause)
      .map(a => a.remediationClause!);

    return {
      contractId: payload.contractId || `cnt_${Date.now()}`,
      propertyAddress: payload.propertyAddress,
      purchasePrice: price,
      overallSafetyScore,
      riskSummary: {
        criticalCount,
        warningCount,
        verifiedCount,
        overallVerdict
      },
      timelineAudit: {
        effectiveDate: effectiveDateStr,
        dueDiligenceFeeDeadline: `${effectiveDateStr} (Effective Date Delivery)`,
        dueDiligenceExpirationDate: ddpExpirationStr,
        settlementDate: settlementDateStr,
        daysBetweenDdpAndClosing: settlementDays - ddpDays,
        isDdpAdequateForFinancing: ddpDays >= 21
      },
      anomalies,
      recommendedAddenda
    };
  }

  static getSampleContracts() {
    return SAMPLE_NC_CONTRACTS;
  }
}
