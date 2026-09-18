export interface SOPField {
  id: string;
  name: string;
  description: string;
  dataType: 'text' | 'long_text' | 'number' | 'date' | 'document' | 'choice' | 'person' | 'address';
  required: 'yes' | 'no' | 'conditional';
  conditionalLogic?: string;
  example?: string;
  source?: string;
}

export interface SOPStep {
  id: string;
  stepNumber?: number;
  title: string;
  instruction: string;
  assignedRole: string;
  backupRole?: string;
  type: string;
  evidenceRequired?: string;
  approvalRequired?: boolean;
  expectedDuration?: string;
  connectedTool?: string;
  systemUsed?: string;
  role?: string;
}

export interface SOPDecision {
  id: string;
  title: string;
  condition: string;
  action: string;
}

export interface SOPTemplate {
  id: string;
  sopId?: string;
  title: string;
  department: string;
  ownerRole: string;
  ownerUserId?: string;
  backupRole?: string;
  backupUserId?: string;
  purpose: string;
  expectedOutcome?: string;
  scope: string;
  exclusions?: string;
  tags?: string[];
  triggerType?: string;
  trigger: string;
  requiredInfo?: SOPField[];
  steps: SOPStep[];
  decisions?: SOPDecision[] | string[];
  exceptions?: string[];
  escalationPaths?: string[];
  escalationBehavior?: {
    expectedResponse: string;
    followUpDue: string;
    escalateAfter: string;
    recipientRole: string;
  };
  completionEvidence?: {
    type: string;
    description: string;
  } | string;
  governance?: {
    reviewFrequencyDays: number;
    visibility: 'workspace' | 'public' | 'private';
    trainingRequired: boolean;
  };
  status: 'draft' | 'published';
  version: string;
  author?: string;
  reviewer?: string;
  publisher?: string;
  effectiveDate?: string;
  reviewDate?: string;
  systemsUsed?: string[];
}

export const SOP_TEMPLATES: SOPTemplate[] = [
  {
    id: 'sop_listing_launch_001',
    sopId: 'sop_listing_launch_001',
    title: 'Listing Launch Protocol',
    department: 'Operations',
    ownerRole: 'Transaction Coordinator',
    purpose: 'End-to-end execution protocol for launching residential real estate listings from professional photography to MLS activation and marketing distribution.',
    expectedOutcome: 'A high quality listing launched on MLS with marketing materials complete and broker approval.',
    scope: 'All residential listings launched in Nest Wilmington.',
    exclusions: 'Commercial listings or leases.',
    tags: ['listing', 'marketing', 'launch', 'mls', 'dotloop'],
    triggerType: 'request_received',
    trigger: 'Executed listing agreement signed and returned by seller.',
    steps: [
      { id: 'st_1', stepNumber: 1, title: 'Validate executed Listing Agreement & WWREA', instruction: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'review', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, title: 'Schedule professional media', instruction: 'Schedule HDR photography, floor plan scan, and drone videography.', assignedRole: 'Listing Agent', role: 'Listing Agent', type: 'manual', systemUsed: 'Media Calendar' },
      { id: 'st_3', stepNumber: 3, title: 'Dispatch yard sign & brochure box', instruction: 'Dispatch work order for yard post & brochure box installation.', assignedRole: 'Admin Coordinator', role: 'Admin Coordinator', type: 'tool', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_4', stepNumber: 4, title: 'Install Supra lockbox', instruction: 'Install Bluetooth Supra lockbox on property and verify shackle code.', assignedRole: 'Listing Agent', role: 'Listing Agent', type: 'manual', systemUsed: 'Supra eKEY' },
      { id: 'st_5', stepNumber: 5, title: 'Collect seller disclosures', instruction: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'review', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, title: 'Draft MLS listing', instruction: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'manual', systemUsed: 'NC Regional MLS' },
      { id: 'st_7', stepNumber: 7, title: 'Submit to BIC for compliance approval', instruction: 'Submit listing draft to BIC Ryan Crecelius for compliance review and approval.', assignedRole: 'Broker-in-Charge', role: 'Broker-in-Charge', type: 'approval', systemUsed: 'Compliance Desk' },
      { id: 'st_8', stepNumber: 8, title: 'Generate marketing package', instruction: 'Generate high-resolution property brochure and PDF marketing package.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'tool', systemUsed: 'Shapework Marketing Engine' },
      { id: 'st_9', stepNumber: 9, title: 'Schedule previews and Open House', instruction: 'Schedule Broker Open preview and public Open House dates.', assignedRole: 'Listing Agent', role: 'Listing Agent', type: 'manual', systemUsed: 'ShowingTime' },
      { id: 'st_10', stepNumber: 10, title: 'Activate MLS listing', instruction: 'Change MLS status from Incomplete to Active.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'manual', systemUsed: 'NC Regional MLS' },
      { id: 'st_11', stepNumber: 11, title: 'Trigger Just Listed campaign', instruction: 'Trigger automated Just Listed social media campaign blitz and direct mail.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'tool', systemUsed: 'Shapework Marketing' },
      { id: 'st_12', stepNumber: 12, title: 'Send active MLS link to seller', instruction: 'Email active MLS link and showing instructions to seller.', assignedRole: 'Listing Agent', role: 'Listing Agent', type: 'manual', systemUsed: 'Email / Client Portal' }
    ],
    decisions: ['If septic permit is unavailable, delay MLS activation until county records confirmed.'],
    exceptions: ['Delayed showing listings require formal NC Regional MLS Delayed Showing Addendum.'],
    escalationPaths: ['Escalate property boundary disputes or title issues to BIC Eric Knight.'],
    completionEvidence: {
      type: 'manual',
      description: 'Active MLS # generated, sign installed, lockbox active, marketing flyer dispatched.'
    },
    status: 'published',
    version: '2.0',
    author: 'Melissa (Transaction Coordinator)',
    reviewer: 'Eric Knight — Broker-in-Charge',
    publisher: 'Eric Knight (BIC #278908)'
  },
  {
    id: 'sop_contract_verification_002',
    sopId: 'sop_contract_verification_002',
    title: 'Buyer Contract Verification & EMD Audit Protocol',
    department: 'Compliance',
    ownerRole: 'Broker-in-Charge',
    purpose: 'Auditing executed NC REALTORS® Form 2-T purchase offers, verifying earnest money escrow timelines, and establishing closing compliance ledgers.',
    expectedOutcome: 'Full regulatory compliance with NC REALTORS® Form 2-T, verified earnest money escrow, and clear milestone dates.',
    scope: 'All executed purchase and sale contracts in Nest Realty Wilmington.',
    tags: ['contract', 'audit', 'emd', 'compliance', 'dotloop'],
    trigger: 'Executed Form 2-T Offer to Purchase and Contract received.',
    steps: [
      { id: 'st_1', stepNumber: 1, title: 'Audit Form 2-T execution dates', instruction: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.', assignedRole: 'Broker-in-Charge', role: 'Broker-in-Charge', type: 'review', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, title: 'Verify Initial EMD in trust', instruction: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'review', systemUsed: 'Trust Ledger' },
      { id: 'st_3', stepNumber: 3, title: 'Calculate critical deadlines', instruction: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'manual', systemUsed: 'Basecamp Calendar' },
      { id: 'st_4', stepNumber: 4, title: 'Notify cooperating broker and attorney', instruction: 'Notify cooperating broker and closing attorney with official contract execution package.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'manual', systemUsed: 'Email' },
      { id: 'st_5', stepNumber: 5, title: 'Sync loop in Dotloop', instruction: 'Sync transaction loop in Dotloop and attach escrow trust receipt.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'tool', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, title: 'Draft CDA ledger', instruction: 'Draft Commission Disbursement Authorization (CDA) ledger with broker commission split.', assignedRole: 'Broker-in-Charge', role: 'Broker-in-Charge', type: 'approval', systemUsed: 'CDA Desk' }
    ],
    decisions: ['If EMD is not received within 72h, issue formal 1-business-day notice before contract voidability.'],
    exceptions: ['FHA/VA financing requires mandatory Amendatory Clause addendum.'],
    escalationPaths: ['Direct all earnest money release disputes immediately to BIC Eric Knight.'],
    completionEvidence: {
      type: 'manual',
      description: 'Verified EMD escrow receipt and BIC-approved CDA ledger.'
    },
    status: 'published',
    version: '1.0',
    author: 'Eric Knight (BIC)',
    reviewer: 'Eric Knight — BIC',
    publisher: 'Eric Knight (BIC #278908)'
  },
  {
    id: 'sop_sign_vendor_003',
    sopId: 'sop_sign_vendor_003',
    title: 'Sign Vendor Dispatch & Post Retrieval Protocol',
    department: 'Operations',
    ownerRole: 'Admin Coordinator',
    purpose: 'Standard procedure for ordering yard sign installations, directional placements, rider attachments, and prompt post retrieval upon closing.',
    expectedOutcome: 'High-visibility branded signage installed accurately with riders and timely removal post-closing.',
    scope: 'All listings throughout New Hanover, Brunswick, and Pender counties.',
    tags: ['signage', 'vendor', 'dispatch', 'operations'],
    trigger: 'Listing agreement executed or property status moved to Closed/Expired.',
    steps: [
      { id: 'st_1', stepNumber: 1, title: 'Submit sign dispatch work order', instruction: 'Submit work order ticket with property address, GPS pin, and post type.', assignedRole: 'Admin Coordinator', role: 'Admin Coordinator', type: 'tool', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_2', stepNumber: 2, title: 'Confirm rider attachments', instruction: 'Verify specific riders: Coming Soon, Under Contract, Waterfront, or Agent Rider.', assignedRole: 'Admin Coordinator', role: 'Admin Coordinator', type: 'review', systemUsed: 'Sign Inventory' },
      { id: 'st_3', stepNumber: 3, title: 'Verify post installation photo', instruction: 'Audit installation verification photo from vendor to confirm compliant setback from roadway.', assignedRole: 'Admin Coordinator', role: 'Admin Coordinator', type: 'review', systemUsed: 'Sign Portal' },
      { id: 'st_4', stepNumber: 4, title: 'Schedule post retrieval upon closing', instruction: 'Automate post removal request within 48 hours of settlement recorded in MLS.', assignedRole: 'Admin Coordinator', role: 'Admin Coordinator', type: 'manual', systemUsed: 'Sign Vendor Portal' }
    ],
    decisions: ['If HOA restricts exterior wooden posts, substitute with compliant metal frame sign.'],
    exceptions: ['Downtown Wilmington historic district requires city-approved metal brackets.'],
    escalationPaths: ['Notify Ann Gunn if vendor misses 48-hour SLA.'],
    completionEvidence: {
      type: 'manual',
      description: 'Vendor photo confirmation of installation and completed retrieval receipt.'
    },
    status: 'published',
    version: '1.0',
    author: 'Ann Gunn (Operations Lead)',
    reviewer: 'Eric Knight — BIC',
    publisher: 'Eric Knight (BIC #278908)'
  },
  {
    id: 'sop_marketing_intake_004',
    sopId: 'sop_marketing_intake_004',
    title: 'Marketing Intake & Campaign Dispatch Protocol',
    department: 'Marketing',
    ownerRole: 'Marketing Coordinator',
    purpose: 'Processing agent marketing requests for new listings, open houses, price improvements, and under-contract announcements.',
    expectedOutcome: 'Rapid turnaround of print and digital marketing collaterals within brokerage brand standards.',
    scope: 'All promotional collateral requests submitted by Nest Realty Wilmington brokers.',
    tags: ['marketing', 'campaign', 'social', 'flyers', 'canva'],
    trigger: 'Agent submits marketing request via Marketing Intake Console.',
    steps: [
      { id: 'st_1', stepNumber: 1, title: 'Review request specifications', instruction: 'Review requested collateral types: print flyers, social tiles, postcards, or email blast.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'review', systemUsed: 'Marketing Intake' },
      { id: 'st_2', stepNumber: 2, title: 'Audit agent assets and photos', instruction: 'Ensure high-resolution photos and required NCREC brokerage disclosures are present.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'review', systemUsed: 'Shapework Asset Library' },
      { id: 'st_3', stepNumber: 3, title: 'Generate design proofs', instruction: 'Generate branded collateral templates using Nest Realty brand kit.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'tool', systemUsed: 'Canva / Adobe Suite' },
      { id: 'st_4', stepNumber: 4, title: 'Send proof for agent approval', instruction: 'Route generated proofs to agent for final copy review and sign-off.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'manual', systemUsed: 'Approval Portal' },
      { id: 'st_5', stepNumber: 5, title: 'Dispatch print orders and publish digital assets', instruction: 'Submit print jobs to Coastal Printing and publish scheduled social posts.', assignedRole: 'Marketing Coordinator', role: 'Marketing Coordinator', type: 'tool', systemUsed: 'Coastal Print Portal' }
    ],
    decisions: ['If list price changes exceed 10%, require written agent confirmation before re-printing.'],
    exceptions: ['Rush turnarounds under 24 hours require approval from Melissa Gagliardi.'],
    escalationPaths: ['Escalate copyright or licensing questions to BIC Eric Knight.'],
    completionEvidence: {
      type: 'manual',
      description: 'Agent-approved proofs, print vendor order receipts, and live social campaign links.'
    },
    status: 'published',
    version: '1.0',
    author: 'Melissa Gagliardi (Marketing Coordinator)',
    reviewer: 'Ryan Crecelius',
    publisher: 'Eric Knight (BIC #278908)'
  },
  {
    id: 'sop_buyer_onboarding_005',
    sopId: 'sop_buyer_onboarding_005',
    title: 'Buyer Representation & Agency Onboarding Protocol',
    department: 'Compliance',
    ownerRole: 'Broker-in-Charge',
    purpose: 'Standardized client intake verifying Working With Real Estate Agents (WWREA) disclosure and executing Exclusive Buyer Agency Agreements prior to showing property.',
    expectedOutcome: '100% compliance with NC Real Estate Commission agency disclosure mandates.',
    scope: 'All prospective home buyers represented by Nest Realty Wilmington brokers.',
    tags: ['buyer', 'agency', 'wwrea', 'compliance', 'ncrec'],
    trigger: 'Initial substantial contact with a prospective real estate buyer.',
    steps: [
      { id: 'st_1', stepNumber: 1, title: 'Present and review WWREA disclosure', instruction: 'Present Working With Real Estate Agents (WWREA) brochure at first substantial contact.', assignedRole: 'Selling Agent', role: 'Selling Agent', type: 'review', systemUsed: 'Dotloop / Form 521' },
      { id: 'st_2', stepNumber: 2, title: 'Execute Exclusive Buyer Agency Agreement', instruction: 'Execute NC REALTORS® Form 201 Exclusive Buyer Agency Agreement with clear compensation terms.', assignedRole: 'Selling Agent', role: 'Selling Agent', type: 'manual', systemUsed: 'Dotloop / Form 201' },
      { id: 'st_3', stepNumber: 3, title: 'Verify mortgage pre-approval', instruction: 'Collect lender pre-approval letter or proof of funds for cash purchasers.', assignedRole: 'Selling Agent', role: 'Selling Agent', type: 'review', systemUsed: 'Client Portal' },
      { id: 'st_4', stepNumber: 4, title: 'Submit agency package to BIC', instruction: 'Upload signed agency documents to Dotloop and submit to BIC Eric Knight for compliance review.', assignedRole: 'Transaction Coordinator', role: 'Transaction Coordinator', type: 'approval', systemUsed: 'Dotloop' }
    ],
    decisions: ['If buyer refuses exclusive representation, must execute non-exclusive buyer agency before property tour.'],
    exceptions: ['Unrepresented buyers touring open houses must receive WWREA Unrepresented disclosure.'],
    escalationPaths: ['Direct all agency relationship questions or dual agency conflicts to BIC Eric Knight.'],
    completionEvidence: {
      type: 'manual',
      description: 'Fully executed WWREA acknowledgement and Buyer Agency Agreement in Dotloop.'
    },
    status: 'published',
    version: '1.0',
    author: 'Eric Knight (BIC #278908)',
    reviewer: 'Eric Knight — BIC',
    publisher: 'Eric Knight (BIC #278908)'
  }
];
