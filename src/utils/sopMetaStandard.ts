/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SOP Meta-Standard (SOP-for-SOPs Definition):
 * Defines canonical role taxonomies, approved real estate & brokerage abbreviations,
 * pass/fail checklist affirmation rules, and dual-lane governance approval paths.
 */

export interface SopAbbreviation {
  abbr: string;
  fullName: string;
  category: 'Licensing & Legal' | 'Contracts & Escrow' | 'Finance & Accounting' | 'Systems & MLS' | 'Operations & Roles';
  definition: string;
  governingBody?: string;
  exampleUsage: string;
}

export const APPROVED_ABBREVIATIONS: Record<string, SopAbbreviation> = {
  'BIC': {
    abbr: 'BIC',
    fullName: 'Broker-in-Charge',
    category: 'Operations & Roles',
    definition: 'Designated broker holding supervisory legal and regulatory accountability for office transactions and compliance.',
    governingBody: 'NCREC',
    exampleUsage: 'Listing documents must be submitted to BIC for regulatory approval within 72 hours.'
  },
  'PB': {
    abbr: 'PB',
    fullName: 'Provisional Broker',
    category: 'Operations & Roles',
    definition: 'Real estate licensee who has completed pre-licensing education but remains under active BIC supervision until post-licensing completion.',
    governingBody: 'NCREC',
    exampleUsage: 'PB transactions require secondary supervision and BIC review prior to binding offer execution.'
  },
  'TC': {
    abbr: 'TC',
    fullName: 'Transaction Coordinator',
    category: 'Operations & Roles',
    definition: 'Administrative lead managing document completeness, closing timeline deadlines, escrow confirmations, and file compliance.',
    exampleUsage: 'The TC uploads executed purchase documents to Dotloop and issues the milestone calendar.'
  },
  'EMD': {
    abbr: 'EMD',
    fullName: 'Earnest Money Deposit',
    category: 'Contracts & Escrow',
    definition: 'Good faith funds submitted by buyer held in statutory escrow trust account pending closing or contract termination.',
    governingBody: 'NCREC Rule 58A .0106 / SCREC',
    exampleUsage: 'Initial EMD must be delivered to the escrow agent within statutory banking days.'
  },
  'DDF': {
    abbr: 'DDF',
    fullName: 'Due Diligence Fee',
    category: 'Contracts & Escrow',
    definition: 'Non-refundable consideration paid directly to seller for exclusive right to investigate property during the due diligence period.',
    governingBody: 'NC REALTORS® Form 2-T',
    exampleUsage: 'DDF check or wire verification must be confirmed upon effective contract date.'
  },
  'CDA': {
    abbr: 'CDA',
    fullName: 'Commission Disbursement Authorization',
    category: 'Finance & Accounting',
    definition: 'Formal accounting directive sent to closing attorney specifying precise commission splits and deductions at closing.',
    exampleUsage: 'Brokerage accounting issues the CDA to the settlement attorney 48 hours prior to closing.'
  },
  'WWREA': {
    abbr: 'WWREA',
    fullName: 'Working With Real Estate Agents Disclosure',
    category: 'Licensing & Legal',
    definition: 'Statutory disclosure explaining agency relationships (Seller Subagent, Buyer Agent, Dual Agent) required at first substantial contact.',
    governingBody: 'NCREC Rule 58A .0104',
    exampleUsage: 'WWREA brochure must be presented and signed at first substantial contact prior to confidential disclosures.'
  },
  'RPOADS': {
    abbr: 'RPOADS',
    fullName: 'Residential Property and Owners\' Association Disclosure Statement',
    category: 'Licensing & Legal',
    definition: 'Statutory seller disclosure detailing property condition, known defects, and HOA obligations.',
    governingBody: 'NC General Statutes Chapter 47E',
    exampleUsage: 'Seller must complete RPOADS without broker alteration prior to marketing publication.'
  },
  'MOG': {
    abbr: 'MOG',
    fullName: 'Mineral and Oil and Gas Rights Mandatory Disclosure Statement',
    category: 'Licensing & Legal',
    definition: 'Statutory disclosure stating whether oil, gas, or mineral rights have been severed from real property.',
    governingBody: 'NC General Statutes Chapter 47E',
    exampleUsage: 'MOG disclosure signed by all titleholders must be attached to the MLS listing.'
  },
  'NCREC': {
    abbr: 'NCREC',
    fullName: 'North Carolina Real Estate Commission',
    category: 'Licensing & Legal',
    definition: 'State licensing authority establishing real estate law, trust account rules, and broker education compliance.',
    governingBody: 'State of North Carolina',
    exampleUsage: 'Trust account reconciliations must adhere to NCREC Rule 58A .0107.'
  },
  'SCREC': {
    abbr: 'SCREC',
    fullName: 'South Carolina Real Estate Commission',
    category: 'Licensing & Legal',
    definition: 'South Carolina state regulatory agency overseeing real estate licensing and mandatory disclosures.',
    governingBody: 'State of South Carolina',
    exampleUsage: 'Cross-border transactions in SC must comply with SCREC trust deposit rules.'
  },
  'VAR': {
    abbr: 'VAR',
    fullName: 'Virginia Association of REALTORS®',
    category: 'Licensing & Legal',
    definition: 'Trade association providing standard legal forms and legal guidance for Virginia transactions.',
    governingBody: 'Virginia Real Estate Board (VREB)',
    exampleUsage: 'Virginia contracts follow VAR standard residential purchase forms.'
  },
  'MLS': {
    abbr: 'MLS',
    fullName: 'Multiple Listing Service',
    category: 'Systems & MLS',
    definition: 'Cooperative digital database used by real estate brokers to share property listing representations and commission agreements.',
    exampleUsage: 'Listings must be entered into the local MLS within 1 business day of public marketing.'
  }
};

export interface CanonicalRoleDefinition {
  title: string;
  department: string;
  defaultReviewLane: 'bic' | 'owner';
  scope: string;
  decisionAuthority: string[];
  escalationTriggers: string[];
}

export const CANONICAL_ROLE_DEFINITIONS: Record<string, CanonicalRoleDefinition> = {
  'Broker-in-Charge': {
    title: 'Broker-in-Charge',
    department: 'Compliance',
    defaultReviewLane: 'bic',
    scope: 'Supervision of all licensed real estate brokerage activities, trust accounting, and regulatory compliance.',
    decisionAuthority: [
      'Approval of all agency agreements, listing agreements, and buyer contracts',
      'Trust account escrow disbursements and dispute handling',
      'Regulatory audit defense and commission inquiry responses',
      'Provisional broker supervision and transaction sign-offs'
    ],
    escalationTriggers: [
      'Contract default or threatened litigation',
      'Earnest money deposit disputes or escrow interpleader',
      'Fair housing or licensing complaints',
      'Material defect disclosure disputes'
    ]
  },
  'Managing Principal': {
    title: 'Managing Principal',
    department: 'Leadership',
    defaultReviewLane: 'owner',
    scope: 'Strategic brokerage direction, executive expenditures, partnership governance, and market expansion.',
    decisionAuthority: [
      'Discretionary capital expenditures and major vendor contracts',
      'Agent commission plan exceptions and recruiting terms',
      'Brand positioning and executive risk management'
    ],
    escalationTriggers: [
      'Unresolved vendor disputes exceeding contract thresholds',
      'Agent termination or offboarding disputes',
      'Budget deviations exceeding quarterly thresholds'
    ]
  },
  'Operations Lead': {
    title: 'Operations Lead',
    department: 'Operations',
    defaultReviewLane: 'owner',
    scope: 'Day-to-day administrative operations, internal workflows, office technology systems, and facility management.',
    decisionAuthority: [
      'Operational tool administration and account provisioning',
      'Office supply and lockbox vendor reorders',
      'Workflow standard operating procedure initial authoring'
    ],
    escalationTriggers: [
      'Office emergency or major facility failure',
      'Software platform outage impacting agent business',
      'Unresolved cross-departmental bottlenecks'
    ]
  },
  'Transaction Coordinator': {
    title: 'Transaction Coordinator',
    department: 'Operations',
    defaultReviewLane: 'bic',
    scope: 'End-to-end file management from contract acceptance to settlement, document audits, and deadline tracking.',
    decisionAuthority: [
      'Dotloop file audit and compliance checklist completion',
      'Closing timeline notification dispatch to clients and attorneys',
      'EMD escrow receipt tracking and missing document chasing'
    ],
    escalationTriggers: [
      'Missing EMD confirmation past statutory banking deadline',
      'Unresolved title or survey defect approaching settlement date',
      'Unsigned statutory disclosures prior to due diligence expiration'
    ]
  },
  'Marketing Lead': {
    title: 'Marketing Lead',
    department: 'Marketing',
    defaultReviewLane: 'owner',
    scope: 'Brand integrity, listing launch marketing collateral, media scheduling, print collateral, and social media campaigns.',
    decisionAuthority: [
      'Approval of listing brochures and digital promotional collateral',
      'Social media calendar scheduling and campaign execution',
      'Vendor media shoot scheduling and package tiers'
    ],
    escalationTriggers: [
      'Agent brand violations or unauthorized marketing collateral',
      'Vendor quality failures on photography or videography',
      'Brand copyright or trademark infringements'
    ]
  },
  'Finance Lead': {
    title: 'Finance Lead',
    department: 'Finance',
    defaultReviewLane: 'owner',
    scope: 'Operating accounting, The Gospel cash flow management, accounts payable, payroll, and 1099 compliance.',
    decisionAuthority: [
      'Accounts payable disbursement according to approved budget',
      'The Gospel master cash sheet reconciliation',
      'Staff payroll processing and tax withholding verification'
    ],
    escalationTriggers: [
      'Cash balance variance against projected burn',
      'Late payment fees or disputed vendor invoices',
      'Tax notice or payroll processing discrepancy'
    ]
  },
  'Admin Coordinator': {
    title: 'Admin Coordinator',
    department: 'Operations',
    defaultReviewLane: 'owner',
    scope: 'Field operations, sign rider deployment, lockbox programming, reception, and meeting room logistics.',
    decisionAuthority: [
      'Field sign vendor dispatch and key inventory checkout',
      'Meeting room reservation approval and hospitality setup',
      'Incoming mail and check logging'
    ],
    escalationTriggers: [
      'Missing lockbox or compromised shackle code',
      'Property sign placement ordinance violation from municipality',
      'Unattended client or urgent visitor escalation'
    ]
  }
};

/**
 * Validation rules for checklist affirmations:
 * Must be written as a pass/fail verification of an outcome, NOT a repetition of the procedure step.
 */
export interface AffirmationValidationResult {
  isValid: boolean;
  issues: string[];
  suggestedImprovement?: string;
}

const REQUIRED_VERIFICATION_PREFIXES = [
  'confirmed',
  'verified',
  'validated',
  'uploaded',
  'executed',
  'approved',
  'signed',
  'reconciled',
  'dispatched',
  'issued',
  'inspected',
  'completed',
  'filed',
  'delivered'
];

export function validateChecklistAffirmation(affirmation: string, procedureAction?: string): AffirmationValidationResult {
  const issues: string[] = [];
  const cleanAffirmation = (affirmation || '').trim();

  if (!cleanAffirmation) {
    return {
      isValid: false,
      issues: ['Checklist affirmation cannot be empty.'],
      suggestedImprovement: 'Confirmed that procedure step completed with evidence verified.'
    };
  }

  if (cleanAffirmation.length < 15) {
    issues.push('Affirmation is too brief; must describe a concrete verifiable state.');
  }

  // Check if it is a lazy copy-paste of the procedure step
  if (procedureAction) {
    const cleanAction = procedureAction.trim().toLowerCase();
    const cleanAff = cleanAffirmation.toLowerCase();
    if (cleanAction === cleanAff) {
      issues.push('Affirmation must not be an identical copy-paste of the procedure instruction.');
    }
  }

  // Verify it contains a confirmation or past-participle verification keyword
  const lowerAff = cleanAffirmation.toLowerCase();
  const startsWithVerification = REQUIRED_VERIFICATION_PREFIXES.some(prefix => lowerAff.startsWith(prefix));
  const containsVerification = REQUIRED_VERIFICATION_PREFIXES.some(prefix => lowerAff.includes(prefix));

  if (!startsWithVerification && !containsVerification) {
    issues.push('Affirmation should begin with or clearly assert a verification state (e.g., "Confirmed...", "Verified...", "Validated...").');
  }

  let suggestedImprovement: string | undefined;
  if (issues.length > 0) {
    if (procedureAction) {
      suggestedImprovement = `Confirmed that ${procedureAction.charAt(0).toLowerCase() + procedureAction.slice(1)} is completed and verified.`;
    } else {
      suggestedImprovement = `Confirmed that ${cleanAffirmation.charAt(0).toLowerCase() + cleanAffirmation.slice(1)}`;
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestedImprovement
  };
}
