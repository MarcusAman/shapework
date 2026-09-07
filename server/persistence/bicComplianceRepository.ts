/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Broker-in-Charge (BIC) Legal Compliance & Trust Account Repository
 * Manages NCREC 3-Day Banking Rule verification, mandatory RPOADS/MOG disclosure audits,
 * June 10 annual CE license renewal countdowns, and Dotloop file compliance approvals.
 */

export interface TrustAccountDepositItem {
  id: string;
  transactionAddress: string;
  mlsNumber: string;
  brokerName: string;
  brokerPhone: string;
  brokerEmail: string;
  listingAgent?: string;
  effectiveDate: string; // YYYY-MM-DD
  depositDeadlineDate: string; // 3 banking days from effective date
  hoursRemaining: number;
  earnestMoneyAmount: number;
  dueDiligenceAmount: number;
  escrowHolder: string; // e.g. "First Bank NC (Trust Acct #****4819)" or "Craige & Fox, PLLC"
  status: 'deposit_verified' | 'pending_escrow_receipt' | 'urgent_deadline_today' | 'action_required';
  checkNumber?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface DisclosureAuditItem {
  id: string;
  transactionAddress: string;
  mlsNumber: string;
  listingAgent: string;
  buyerAgent: string;
  offerDate: string;
  rpoadsStatus: 'verified_prior_to_offer' | 'missing_buyer_signature' | 'not_provided_to_buyer';
  mogStatus: 'verified_prior_to_offer' | 'missing_buyer_signature' | 'not_provided_to_buyer';
  leadPaintStatus?: 'not_applicable' | 'verified_signed' | 'missing';
  statutoryRescissionRisk: boolean; // True if buyer has 3-day right to cancel under NCGS § 47E-5
  riskSummary: string;
  dotloopFolderUrl: string;
}

export interface BrokerCeStatusItem {
  id: string;
  brokerName: string;
  licenseNumber: string;
  licenseType: 'Broker' | 'Broker-in-Charge' | 'Provisional Broker';
  email: string;
  phone: string;
  bicupOrGenupCompleted: boolean; // 4 hrs mandatory
  electiveHoursCompleted: number; // 4 hrs required
  postlicensingCompleted?: boolean; // Required for Provisional Brokers (301, 302, 303)
  totalHours: number; // 8 required
  isFullyCompliant: boolean;
  deadlineDate: string; // June 10, 2027
  daysUntilDeadline: number;
  warningLevel: 'compliant' | 'elective_pending' | 'urgent_incomplete';
}

export interface BicAuditSummary {
  totalActiveContracts: number;
  trustAccountCompliantCount: number;
  trustAccountUrgentCount: number;
  missingDisclosuresCount: number;
  ceCompliantBrokersCount: number;
  cePendingBrokersCount: number;
  totalBrokerCount: number;
  pendingBicFileApprovals: number;
}

export class BicComplianceRepository {
  private static trustAccountQueue: TrustAccountDepositItem[] = [
    {
      id: 'esc_1104_arboretum',
      transactionAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      mlsNumber: '100412891',
      brokerName: 'Sarah Jenkins',
      brokerPhone: '(910) 555-8120',
      brokerEmail: 'sjenkins@nestrealty.com',
      effectiveDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      depositDeadlineDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
      hoursRemaining: 18,
      earnestMoneyAmount: 25000,
      dueDiligenceAmount: 35000,
      escrowHolder: 'First Bank NC (Nest Trust Acct #****4819)',
      status: 'urgent_deadline_today',
      checkNumber: 'CHK #4190'
    },
    {
      id: 'esc_702_lumina',
      transactionAddress: '702 S Lumina Ave, Wrightsville Beach, NC 28480',
      mlsNumber: '100438102',
      brokerName: 'Carter Vance',
      brokerPhone: '(910) 555-9431',
      brokerEmail: 'cvance@nestrealty.com',
      effectiveDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
      depositDeadlineDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
      hoursRemaining: 6,
      earnestMoneyAmount: 45000,
      dueDiligenceAmount: 50000,
      escrowHolder: 'Craige & Fox, PLLC (Closing Attorney Escrow)',
      status: 'pending_escrow_receipt',
      checkNumber: 'Wire Ref #WF-99412'
    },
    {
      id: 'esc_2210_bayview',
      transactionAddress: '2210 Bayview Dr, Wilmington, NC 28405',
      mlsNumber: '100449120',
      brokerName: 'Elena Rostova',
      brokerPhone: '(910) 555-3290',
      brokerEmail: 'elena@nestrealty.com',
      effectiveDate: new Date(Date.now() - 72 * 3600 * 1000).toISOString().split('T')[0],
      depositDeadlineDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString().split('T')[0],
      hoursRemaining: 0,
      earnestMoneyAmount: 18750,
      dueDiligenceAmount: 25000,
      escrowHolder: 'First Bank NC (Nest Trust Acct #****4819)',
      status: 'deposit_verified',
      checkNumber: 'CHK #1082',
      verifiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      verifiedBy: 'Ryan Crecelius (BIC)'
    },
    {
      id: 'esc_412_mayfaire',
      transactionAddress: '412 Mayfaire Way, Wilmington, NC 28405',
      mlsNumber: '100452109',
      brokerName: 'Marcus Sterling',
      brokerPhone: '(910) 555-6712',
      brokerEmail: 'msterling@nestrealty.com',
      effectiveDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString().split('T')[0],
      depositDeadlineDate: new Date(Date.now() + 60 * 3600 * 1000).toISOString().split('T')[0],
      hoursRemaining: 44,
      earnestMoneyAmount: 15000,
      dueDiligenceAmount: 20000,
      escrowHolder: 'Shipman & Wright, LLP (Escrow)',
      status: 'pending_escrow_receipt',
      checkNumber: 'CHK #7712'
    }
  ];

  private static disclosureAudits: DisclosureAuditItem[] = [
    {
      id: 'disc_1104_arboretum',
      transactionAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      mlsNumber: '100412891',
      listingAgent: 'Sarah Jenkins (Nest)',
      buyerAgent: 'Dave Miller (Intracoastal)',
      offerDate: '2026-08-21',
      rpoadsStatus: 'missing_buyer_signature',
      mogStatus: 'verified_prior_to_offer',
      leadPaintStatus: 'not_applicable',
      statutoryRescissionRisk: true,
      riskSummary: 'RPOADS signed by Seller on 8/10 but Buyer signature block is blank in Dotloop. Buyer has statutory 3-day right to cancel after receipt under NCGS § 47E-5.',
      dotloopFolderUrl: 'https://dotloop.com/loop/LP-90812'
    },
    {
      id: 'disc_702_lumina',
      transactionAddress: '702 S Lumina Ave, Wrightsville Beach, NC 28480',
      mlsNumber: '100438102',
      listingAgent: 'Carter Vance (Nest)',
      buyerAgent: 'Rachel Hayes (Sothebys)',
      offerDate: '2026-08-20',
      rpoadsStatus: 'verified_prior_to_offer',
      mogStatus: 'verified_prior_to_offer',
      leadPaintStatus: 'verified_signed',
      statutoryRescissionRisk: false,
      riskSummary: 'All mandatory disclosures signed and timestamped prior to offer submission. Zero rescission liability.',
      dotloopFolderUrl: 'https://dotloop.com/loop/LP-90411'
    },
    {
      id: 'disc_514_front_st',
      transactionAddress: '514 S Front St, Historic Downtown Wilmington, NC 28401',
      mlsNumber: '100481022',
      listingAgent: 'Marcus Sterling (Nest)',
      buyerAgent: 'Ken Adams (Sea Coast)',
      offerDate: '2026-08-22',
      rpoadsStatus: 'not_provided_to_buyer',
      mogStatus: 'missing_buyer_signature',
      leadPaintStatus: 'missing',
      statutoryRescissionRisk: true,
      riskSummary: 'Built in 1924: Federal Lead-Based Paint Disclosure missing. MOG lacks buyer initial. High regulatory penalty risk.',
      dotloopFolderUrl: 'https://dotloop.com/loop/LP-91104'
    }
  ];

  private static ceRoster: BrokerCeStatusItem[] = [
    {
      id: 'ce_ryan_crecelius',
      brokerName: 'Ryan Crecelius',
      licenseNumber: 'NC-249018',
      licenseType: 'Broker-in-Charge',
      email: 'ryan@nestrealty.com',
      phone: '(910) 555-0100',
      bicupOrGenupCompleted: true,
      electiveHoursCompleted: 4,
      totalHours: 8,
      isFullyCompliant: true,
      deadlineDate: '2027-06-10',
      daysUntilDeadline: 291,
      warningLevel: 'compliant'
    },
    {
      id: 'ce_sarah_jenkins',
      brokerName: 'Sarah Jenkins',
      licenseNumber: 'NC-312904',
      licenseType: 'Broker',
      email: 'sjenkins@nestrealty.com',
      phone: '(910) 555-8120',
      bicupOrGenupCompleted: true,
      electiveHoursCompleted: 2,
      totalHours: 6,
      isFullyCompliant: false,
      deadlineDate: '2027-06-10',
      daysUntilDeadline: 291,
      warningLevel: 'elective_pending'
    },
    {
      id: 'ce_carter_vance',
      brokerName: 'Carter Vance',
      licenseNumber: 'NC-289011',
      licenseType: 'Broker',
      email: 'cvance@nestrealty.com',
      phone: '(910) 555-9431',
      bicupOrGenupCompleted: false,
      electiveHoursCompleted: 0,
      totalHours: 0,
      isFullyCompliant: false,
      deadlineDate: '2027-06-10',
      daysUntilDeadline: 291,
      warningLevel: 'urgent_incomplete'
    },
    {
      id: 'ce_elena_rostova',
      brokerName: 'Elena Rostova',
      licenseNumber: 'NC-341908',
      licenseType: 'Provisional Broker',
      email: 'elena@nestrealty.com',
      phone: '(910) 555-3290',
      bicupOrGenupCompleted: true,
      electiveHoursCompleted: 4,
      postlicensingCompleted: false, // Provisional Broker Postlicensing 302 pending
      totalHours: 8,
      isFullyCompliant: false,
      deadlineDate: '2027-06-10',
      daysUntilDeadline: 291,
      warningLevel: 'urgent_incomplete'
    },
    {
      id: 'ce_marcus_sterling',
      brokerName: 'Marcus Sterling',
      licenseNumber: 'NC-298412',
      licenseType: 'Broker',
      email: 'msterling@nestrealty.com',
      phone: '(910) 555-6712',
      bicupOrGenupCompleted: false,
      electiveHoursCompleted: 4,
      totalHours: 4,
      isFullyCompliant: false,
      deadlineDate: '2027-06-10',
      daysUntilDeadline: 291,
      warningLevel: 'urgent_incomplete'
    }
  ];

  /**
   * Returns executive audit summary KPIs for the Broker-in-Charge
   */
  public static getAuditSummary(): BicAuditSummary {
    const trustUrgent = this.trustAccountQueue.filter(t => t.status === 'urgent_deadline_today' || t.status === 'pending_escrow_receipt').length;
    const discMissing = this.disclosureAudits.filter(d => d.statutoryRescissionRisk).length;
    const ceCompliant = 58; // 58 out of 72 brokers up to date
    const cePending = 14;

    return {
      totalActiveContracts: 16,
      trustAccountCompliantCount: this.trustAccountQueue.filter(t => t.status === 'deposit_verified').length,
      trustAccountUrgentCount: trustUrgent,
      missingDisclosuresCount: discMissing,
      ceCompliantBrokersCount: ceCompliant,
      cePendingBrokersCount: cePending,
      totalBrokerCount: 72,
      pendingBicFileApprovals: 6
    };
  }

  /**
   * Retrieves all active trust account / earnest money deposit items
   */
  public static getTrustAccountQueue(): TrustAccountDepositItem[] {
    return [...this.trustAccountQueue];
  }

  /**
   * Retrieves all mandatory disclosure audit items
   */
  public static getDisclosureAudits(): DisclosureAuditItem[] {
    return [...this.disclosureAudits];
  }

  /**
   * Retrieves CE license status across brokers
   */
  public static getCeRoster(filter?: { warningLevel?: string }): BrokerCeStatusItem[] {
    let result = [...this.ceRoster];
    if (filter?.warningLevel && filter.warningLevel !== 'all') {
      result = result.filter(b => b.warningLevel === filter.warningLevel);
    }
    return result;
  }

  /**
   * Verifies an earnest money deposit into the trust account
   */
  public static verifyTrustDeposit(depositId: string, verifiedBy: string = 'Ryan Crecelius (BIC)'): TrustAccountDepositItem | null {
    const item = this.trustAccountQueue.find(t => t.id === depositId);
    if (!item) return null;

    item.status = 'deposit_verified';
    item.verifiedAt = new Date().toISOString();
    item.verifiedBy = verifiedBy;
    return item;
  }

  /**
   * Dispatches an automated legal reminder SMS/Email to an agent regarding compliance
   */
  public static dispatchAgentNudge(options: {
    brokerName: string;
    propertyAddress: string;
    issueType: 'earnest_money_3day' | 'missing_rpoads' | 'ce_credits';
  }): {
    success: boolean;
    smsMessage: string;
    dispatchedTo: string;
    timestamp: string;
  } {
    let smsMessage = '';
    if (options.issueType === 'earnest_money_3day') {
      smsMessage = `Hi ${options.brokerName.split(' ')[0]}, this is Ryan Crecelius. NCREC Rule 58A .0116 requires earnest money on ${options.propertyAddress.split(',')[0]} to be deposited within 3 banking days. Please confirm First Bank NC deposit or attorney escrow receipt today.`;
    } else if (options.issueType === 'missing_rpoads') {
      smsMessage = `Hi ${options.brokerName.split(' ')[0]}, urgent BIC compliance note from Ryan: RPOADS/MOG signature block is incomplete on ${options.propertyAddress.split(',')[0]}. Under NCGS § 47E-5, buyer has a 3-day right of rescission until this is signed. Please update in Dotloop.`;
    } else {
      smsMessage = `Hi ${options.brokerName.split(' ')[0]}, friendly reminder from Ryan at Nest: NCREC annual CE credits (GENUP/BICUP + Elective) are due before June 10 to maintain active license status. Let me know if you need our approved course links.`;
    }

    return {
      success: true,
      smsMessage,
      dispatchedTo: options.brokerName,
      timestamp: new Date().toISOString()
    };
  }
}
