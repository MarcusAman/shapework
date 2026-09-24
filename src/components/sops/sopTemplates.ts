import { StateAddendum, SopCategory, CANONICAL_SOP_CATEGORIES, normalizeSopCategory } from '../../types/sopWorkflow';

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

export interface StepDurationPolicy {
  preset?: '15m' | '30m' | '45m' | '1h' | '2h' | '4h' | '24h' | '48h' | '72h' | 'custom';
  customMinutes?: number;
  rawDisplay?: string;
}

export interface SOPStep {
  id: string;
  stepNumber?: number;
  title: string;
  instruction: string;
  assignedRole: string;
  primaryRole?: string;
  secondaryRole?: string;
  durationPolicy?: StepDurationPolicy;
  affirmationCheck?: string;
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

export interface SOPOwner {
  type: 'person' | 'department';
  name: string;
}

export interface SOPTemplate {
  id: string;
  sopId?: string;
  title: string;
  department: string;
  category?: SopCategory | string;
  stateJurisdiction?: string;
  sopOwner?: SOPOwner;
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
  activationDate?: string;
  reviewDate?: string;
  systemsUsed?: string[];
  isMasterSop?: boolean;
  masterSopId?: string;
  stateAddenda?: Record<string, StateAddendum>;
}

export const SOP_TEMPLATES: SOPTemplate[] = [
  {
    id: 'sop_listing_launch_001',
    sopId: 'sop_listing_launch_001',
    title: 'Listing Launch Protocol',
    department: 'Operations',
    category: 'Transactions',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Transaction Management' },
    ownerRole: 'Transaction Coordinator',
    purpose: 'End-to-end execution protocol for launching residential real estate listings from professional photography to MLS activation and marketing distribution.',
    expectedOutcome: 'A high quality listing launched on MLS with marketing materials complete and broker approval.',
    scope: 'All residential listings launched in Nest Wilmington.',
    exclusions: 'Commercial listings or leases.',
    tags: ['listing', 'marketing', 'launch', 'mls', 'dotloop'],
    triggerType: 'request_received',
    trigger: 'Executed listing agreement signed and returned by seller.',
    steps: [
      {
        id: 'st_1',
        stepNumber: 1,
        title: 'Validate executed Listing Agreement & WWREA',
        instruction: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Transaction Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Exclusive Right to Sell and WWREA are fully executed with all seller signatures confirmed.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_2',
        stepNumber: 2,
        title: 'Schedule professional media',
        instruction: 'Schedule HDR photography, floor plan scan, and drone videography.',
        assignedRole: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Marketing Coordinator',
        role: 'Listing Agent',
        type: 'manual',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'Professional media photoshoot confirmed on scheduling calendar with client notified.',
        systemUsed: 'Media Calendar'
      },
      {
        id: 'st_3',
        stepNumber: 3,
        title: 'Dispatch yard sign & brochure box',
        instruction: 'Dispatch work order for yard post & brochure box installation.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Field Operator',
        role: 'Admin Coordinator',
        type: 'tool',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Yard sign work order ticket submitted to vendor with GPS pin confirmed.',
        systemUsed: 'Sign Inventory Desk'
      },
      {
        id: 'st_4',
        stepNumber: 4,
        title: 'Install Supra lockbox',
        instruction: 'Install Bluetooth Supra lockbox on property and verify shackle code.',
        assignedRole: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Field Operator',
        role: 'Listing Agent',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Lockbox secured on site with active shackle code synced in Supra eKEY.',
        systemUsed: 'Supra eKEY'
      },
      {
        id: 'st_5',
        stepNumber: 5,
        title: 'Collect seller disclosures',
        instruction: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Listing Agent',
        role: 'Transaction Coordinator',
        type: 'review',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'RPOADS and MOG forms validated complete and uploaded to loop.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_6',
        stepNumber: 6,
        title: 'Draft MLS listing',
        instruction: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '2h', rawDisplay: '2h' },
        affirmationCheck: 'MLS draft fields populated, tax records matched, and status saved as Incomplete.',
        systemUsed: 'NC Regional MLS'
      },
      {
        id: 'st_7',
        stepNumber: 7,
        title: 'Submit to BIC for compliance approval',
        instruction: 'Submit listing draft to Broker-in-Charge for compliance review and approval.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Managing Broker',
        role: 'Broker-in-Charge',
        type: 'approval',
        durationPolicy: { preset: '4h', rawDisplay: '4h' },
        affirmationCheck: 'Broker-in-Charge compliance review approved with sign-off recorded.',
        systemUsed: 'Compliance Desk'
      },
      {
        id: 'st_8',
        stepNumber: 8,
        title: 'Generate marketing package',
        instruction: 'Generate high-resolution property brochure and PDF marketing package.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Marketing Lead',
        role: 'Marketing Coordinator',
        type: 'tool',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'Branded property brochure and PDF collaterals generated and approved.',
        systemUsed: 'Shapework Marketing Engine'
      },
      {
        id: 'st_9',
        stepNumber: 9,
        title: 'Schedule previews and Open House',
        instruction: 'Schedule Broker Open preview and public Open House dates.',
        assignedRole: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Listing Specialist',
        role: 'Listing Agent',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Open house dates posted to MLS and ShowingTime schedule.',
        systemUsed: 'ShowingTime'
      },
      {
        id: 'st_10',
        stepNumber: 10,
        title: 'Activate MLS listing',
        instruction: 'Change MLS status from Incomplete to Active.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'MLS status successfully transitioned to Active and public syndication live.',
        systemUsed: 'NC Regional MLS'
      },
      {
        id: 'st_11',
        stepNumber: 11,
        title: 'Trigger Just Listed campaign',
        instruction: 'Trigger automated Just Listed social media campaign blitz and direct mail.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Marketing Lead',
        role: 'Marketing Coordinator',
        type: 'tool',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Digital marketing and postcard order dispatched to print vendor.',
        systemUsed: 'Shapework Marketing'
      },
      {
        id: 'st_12',
        stepNumber: 12,
        title: 'Send active MLS link to seller',
        instruction: 'Email active MLS link and showing instructions to seller.',
        assignedRole: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Transaction Coordinator',
        role: 'Listing Agent',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Seller confirmed receipt of active listing link and showing protocol.',
        systemUsed: 'Email / Client Portal'
      }
    ],
    decisions: ['If septic permit is unavailable, delay MLS activation until county records confirmed.'],
    exceptions: ['Delayed showing listings require formal NC Regional MLS Delayed Showing Addendum.'],
    escalationPaths: ['Escalate property boundary disputes or title issues to Broker-in-Charge.'],
    completionEvidence: {
      type: 'manual',
      description: 'Active MLS # generated, sign installed, lockbox active, marketing flyer dispatched.'
    },
    status: 'published',
    version: '2.0',
    activationDate: '2025-10-12',
    author: 'Transaction Management',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_contract_verification_002',
    sopId: 'sop_contract_verification_002',
    title: 'Buyer Contract Verification & EMD Audit Protocol',
    department: 'Compliance',
    category: 'Transactions',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'person', name: 'Broker-in-Charge' },
    ownerRole: 'Broker-in-Charge',
    purpose: 'Auditing executed NC REALTORS® Form 2-T purchase offers, verifying earnest money escrow timelines, and establishing closing compliance ledgers.',
    expectedOutcome: 'Full regulatory compliance with NC REALTORS® Form 2-T, verified earnest money escrow, and clear milestone dates.',
    scope: 'All executed purchase and sale contracts in Nest Realty Wilmington.',
    tags: ['contract', 'audit', 'emd', 'compliance', 'dotloop'],
    trigger: 'Executed Form 2-T Offer to Purchase and Contract received.',
    steps: [
      {
        id: 'st_1',
        stepNumber: 1,
        title: 'Audit Form 2-T execution dates',
        instruction: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Transaction Coordinator',
        role: 'Broker-in-Charge',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'All buyer and seller initials, dates, and Due Diligence fee delivery confirmed.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_2',
        stepNumber: 2,
        title: 'Verify Initial EMD in trust',
        instruction: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Accounting Manager',
        role: 'Transaction Coordinator',
        type: 'review',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'Escrow receipt verified from closing attorney trust account.',
        systemUsed: 'Trust Ledger'
      },
      {
        id: 'st_3',
        stepNumber: 3,
        title: 'Calculate critical deadlines',
        instruction: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Due Diligence 5:00 PM deadline and settlement dates synced across team calendars.',
        systemUsed: 'Basecamp Calendar'
      },
      {
        id: 'st_4',
        stepNumber: 4,
        title: 'Notify cooperating broker and attorney',
        instruction: 'Notify cooperating broker and closing attorney with official contract execution package.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Selling Agent',
        role: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Closing attorney and lender acknowledged receipt of contract package.',
        systemUsed: 'Email'
      },
      {
        id: 'st_5',
        stepNumber: 5,
        title: 'Sync loop in Dotloop',
        instruction: 'Sync transaction loop in Dotloop and attach escrow trust receipt.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Admin Coordinator',
        role: 'Transaction Coordinator',
        type: 'tool',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Loop checklist tags updated to Under Contract with trust receipt attached.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_6',
        stepNumber: 6,
        title: 'Draft CDA ledger',
        instruction: 'Draft Commission Disbursement Authorization (CDA) ledger with broker commission split.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Accounting Manager',
        role: 'Broker-in-Charge',
        type: 'approval',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'CDA split calculations verified and submitted for final attorney escrow closing.',
        systemUsed: 'CDA Desk'
      }
    ],
    decisions: ['If EMD is not received within 72h, issue formal 1-business-day notice before contract voidability.'],
    exceptions: ['FHA/VA financing requires mandatory Amendatory Clause addendum.'],
    escalationPaths: ['Direct all earnest money release disputes immediately to Broker-in-Charge.'],
    completionEvidence: {
      type: 'manual',
      description: 'Verified EMD escrow receipt and BIC-approved CDA ledger.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2025-11-01',
    author: 'Broker-in-Charge',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_sign_vendor_003',
    sopId: 'sop_sign_vendor_003',
    title: 'Sign Vendor Dispatch & Post Retrieval Protocol',
    department: 'Operations',
    category: 'Vendor',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Field Operations' },
    ownerRole: 'Admin Coordinator',
    purpose: 'Standard procedure for ordering yard sign installations, directional placements, rider attachments, and prompt post retrieval upon closing.',
    expectedOutcome: 'High-visibility branded signage installed accurately with riders and timely removal post-closing.',
    scope: 'All listings throughout New Hanover, Brunswick, and Pender counties.',
    tags: ['signage', 'vendor', 'dispatch', 'operations'],
    trigger: 'Listing agreement executed or property status moved to Closed/Expired.',
    steps: [
      {
        id: 'st_1',
        stepNumber: 1,
        title: 'Submit sign dispatch work order',
        instruction: 'Submit work order ticket with property address, GPS pin, and post type.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Field Operator',
        role: 'Admin Coordinator',
        type: 'tool',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Work order ticket dispatched with exact street coordinates and setback instructions.',
        systemUsed: 'Sign Inventory Desk'
      },
      {
        id: 'st_2',
        stepNumber: 2,
        title: 'Confirm rider attachments',
        instruction: 'Verify specific riders: Coming Soon, Under Contract, Waterfront, or Agent Rider.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Admin Coordinator',
        type: 'review',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Specific rider inventory verified and confirmed on work order.',
        systemUsed: 'Sign Inventory'
      },
      {
        id: 'st_3',
        stepNumber: 3,
        title: 'Verify post installation photo',
        instruction: 'Audit installation verification photo from vendor to confirm compliant setback from roadway.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Field Operator',
        role: 'Admin Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Vendor post photo inspected for municipal setback and visibility compliance.',
        systemUsed: 'Sign Portal'
      },
      {
        id: 'st_4',
        stepNumber: 4,
        title: 'Schedule post retrieval upon closing',
        instruction: 'Automate post removal request within 48 hours of settlement recorded in MLS.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Transaction Coordinator',
        role: 'Admin Coordinator',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Post retrieval scheduled within 48 hours and removal confirmed by vendor.',
        systemUsed: 'Sign Vendor Portal'
      }
    ],
    decisions: ['If HOA restricts exterior wooden posts, substitute with compliant metal frame sign.'],
    exceptions: ['Downtown Wilmington historic district requires city-approved metal brackets.'],
    escalationPaths: ['Notify Operations Lead if vendor misses 48-hour SLA.'],
    completionEvidence: {
      type: 'manual',
      description: 'Vendor photo confirmation of installation and completed retrieval receipt.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2025-11-15',
    author: 'Operations Lead',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_marketing_intake_004',
    sopId: 'sop_marketing_intake_004',
    title: 'Marketing Intake & Campaign Dispatch Protocol',
    department: 'Marketing',
    category: 'Marketing',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Creative & Marketing' },
    ownerRole: 'Marketing Coordinator',
    purpose: 'Processing agent marketing requests for new listings, open houses, price improvements, and under-contract announcements.',
    expectedOutcome: 'Rapid turnaround of print and digital marketing collaterals within brokerage brand standards.',
    scope: 'All promotional collateral requests submitted by Nest Realty Wilmington brokers.',
    tags: ['marketing', 'campaign', 'social', 'flyers', 'canva'],
    trigger: 'Agent submits marketing request via Marketing Intake Console.',
    steps: [
      {
        id: 'st_1',
        stepNumber: 1,
        title: 'Review request specifications',
        instruction: 'Review requested collateral types: print flyers, social tiles, postcards, or email blast.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Marketing Lead',
        role: 'Marketing Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Marketing request verified with all requested assets and target completion date.',
        systemUsed: 'Marketing Intake'
      },
      {
        id: 'st_2',
        stepNumber: 2,
        title: 'Audit agent assets and photos',
        instruction: 'Ensure high-resolution photos and required NCREC brokerage disclosures are present.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Listing Specialist',
        role: 'Marketing Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'High-res photography and mandatory equal housing / NCREC disclosures verified.',
        systemUsed: 'Shapework Asset Library'
      },
      {
        id: 'st_3',
        stepNumber: 3,
        title: 'Generate design proofs',
        instruction: 'Generate branded collateral templates using Nest Realty brand kit.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Marketing Lead',
        role: 'Marketing Coordinator',
        type: 'tool',
        durationPolicy: { preset: '2h', rawDisplay: '2h' },
        affirmationCheck: 'Brand kit typography, color palettes, and photo layouts verified in design proofs.',
        systemUsed: 'Canva / Adobe Suite'
      },
      {
        id: 'st_4',
        stepNumber: 4,
        title: 'Send proof for agent approval',
        instruction: 'Route generated proofs to agent for final copy review and sign-off.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Listing Agent',
        role: 'Marketing Coordinator',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Agent written sign-off received on design proof.',
        systemUsed: 'Approval Portal'
      },
      {
        id: 'st_5',
        stepNumber: 5,
        title: 'Dispatch print orders and publish digital assets',
        instruction: 'Submit print jobs to Coastal Printing and publish scheduled social posts.',
        assignedRole: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Marketing Lead',
        role: 'Marketing Coordinator',
        type: 'tool',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'Print vendor invoice confirmed and social post scheduled with active UTM links.',
        systemUsed: 'Coastal Print Portal'
      }
    ],
    decisions: ['If list price changes exceed 10%, require written agent confirmation before re-printing.'],
    exceptions: ['Rush turnarounds under 24 hours require approval from Marketing Lead.'],
    escalationPaths: ['Escalate copyright or licensing questions to Broker-in-Charge.'],
    completionEvidence: {
      type: 'manual',
      description: 'Agent-approved proofs, print vendor order receipts, and live social campaign links.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2025-12-01',
    author: 'Marketing Lead',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_buyer_onboarding_005',
    sopId: 'sop_buyer_onboarding_005',
    title: 'Buyer Representation & Agency Onboarding Protocol',
    department: 'Compliance',
    category: 'Transactions',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'person', name: 'Broker-in-Charge' },
    ownerRole: 'Broker-in-Charge',
    purpose: 'Standardized client intake verifying Working With Real Estate Agents (WWREA) disclosure and executing Exclusive Buyer Agency Agreements prior to showing property.',
    expectedOutcome: '100% compliance with NC Real Estate Commission agency disclosure mandates.',
    scope: 'All prospective home buyers represented by Nest Realty Wilmington brokers.',
    tags: ['buyer', 'agency', 'wwrea', 'compliance', 'ncrec'],
    trigger: 'Initial substantial contact with a prospective real estate buyer.',
    steps: [
      {
        id: 'st_1',
        stepNumber: 1,
        title: 'Present and review WWREA disclosure',
        instruction: 'Present Working With Real Estate Agents (WWREA) brochure at first substantial contact.',
        assignedRole: 'Selling Agent',
        primaryRole: 'Selling Agent',
        secondaryRole: 'Listing Specialist',
        role: 'Selling Agent',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'WWREA brochure explained and seller/buyer acknowledgment signed at first contact.',
        systemUsed: 'Dotloop / Form 521'
      },
      {
        id: 'st_2',
        stepNumber: 2,
        title: 'Execute Exclusive Buyer Agency Agreement',
        instruction: 'Execute NC REALTORS® Form 201 Exclusive Buyer Agency Agreement with clear compensation terms.',
        assignedRole: 'Selling Agent',
        primaryRole: 'Selling Agent',
        secondaryRole: 'Broker-in-Charge',
        role: 'Selling Agent',
        type: 'manual',
        durationPolicy: { preset: '1h', rawDisplay: '1h' },
        affirmationCheck: 'Form 201 executed with explicit compensation fee percentage and duration dates.',
        systemUsed: 'Dotloop / Form 201'
      },
      {
        id: 'st_3',
        stepNumber: 3,
        title: 'Verify mortgage pre-approval',
        instruction: 'Collect lender pre-approval letter or proof of funds for cash purchasers.',
        assignedRole: 'Selling Agent',
        primaryRole: 'Selling Agent',
        secondaryRole: 'Transaction Coordinator',
        role: 'Selling Agent',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Lender pre-approval letter verified within 60-day expiration window.',
        systemUsed: 'Client Portal'
      },
      {
        id: 'st_4',
        stepNumber: 4,
        title: 'Submit agency package to BIC',
        instruction: 'Upload signed agency documents to Dotloop and submit to Broker-in-Charge for compliance review.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Broker-in-Charge',
        role: 'Transaction Coordinator',
        type: 'approval',
        durationPolicy: { preset: '2h', rawDisplay: '2h' },
        affirmationCheck: 'Broker-in-Charge approved buyer agency documentation in transaction loop.',
        systemUsed: 'Dotloop'
      }
    ],
    decisions: ['If buyer refuses exclusive representation, must execute non-exclusive buyer agency before property tour.'],
    exceptions: ['Unrepresented buyers touring open houses must receive WWREA Unrepresented disclosure.'],
    escalationPaths: ['Direct all agency relationship questions or dual agency conflicts to Broker-in-Charge.'],
    completionEvidence: {
      type: 'manual',
      description: 'Fully executed WWREA acknowledgement and Buyer Agency Agreement in Dotloop.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2026-01-05',
    author: 'Broker-in-Charge',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },

  // -------------------------------------------------------------
  // WAVE 2 CATEGORY STARTER TEMPLATES
  // -------------------------------------------------------------
  {
    id: 'tmpl_finance_cda_001',
    sopId: 'tmpl_finance_cda_001',
    title: 'Commission Disbursement Authorization (CDA) & Invoicing Protocol',
    department: 'Finance',
    category: 'Finance',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Accounting & Escrow' },
    ownerRole: 'Accounting Manager',
    purpose: 'Standard procedure for calculating brokerage splits, franchise fees, agent commissions, and delivering authorized CDAs to closing attorneys.',
    expectedOutcome: 'Zero-error closing commission disbursement delivered 48 hours prior to closing.',
    scope: 'All residential and commercial closings in Nest Realty Wilmington.',
    tags: ['finance', 'cda', 'accounting', 'commission', 'escrow'],
    trigger: 'Final settlement statement or ALTA closing disclosure received from attorney.',
    steps: [
      {
        id: 'st_fin_1',
        stepNumber: 1,
        title: 'Reconcile contract gross commission',
        instruction: 'Compare ALTA settlement statement gross commission against executed listing agreement and Form 2-T.',
        assignedRole: 'Accounting Manager',
        primaryRole: 'Accounting Manager',
        secondaryRole: 'Transaction Coordinator',
        role: 'Accounting Manager',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Gross commission matches executed contract terms without variance.',
        systemUsed: 'Dotloop / QuickBooks'
      },
      {
        id: 'st_fin_2',
        stepNumber: 2,
        title: 'Apply agent split tier & deduction ledger',
        instruction: 'Apply agent annual production tier split, E&O fee deduction, and charitable contributions.',
        assignedRole: 'Accounting Manager',
        primaryRole: 'Accounting Manager',
        secondaryRole: 'Regional Leader',
        role: 'Accounting Manager',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Agent split tier ledger confirmed against current year-to-date production cap.',
        systemUsed: 'CDA Desk'
      },
      {
        id: 'st_fin_3',
        stepNumber: 3,
        title: 'Broker-in-Charge compliance authorization',
        instruction: 'Submit draft CDA to Broker-in-Charge for license status verification and signature signoff.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Accounting Manager',
        role: 'Broker-in-Charge',
        type: 'approval',
        durationPolicy: { preset: '2h', rawDisplay: '2h' },
        affirmationCheck: 'Broker-in-Charge signed CDA authorization letter generated.',
        systemUsed: 'Compliance Desk'
      },
      {
        id: 'st_fin_4',
        stepNumber: 4,
        title: 'Transmit signed CDA to closing attorney',
        instruction: 'Securely transmit executed CDA and brokerage wire instructions to closing attorney paralegal.',
        assignedRole: 'Accounting Manager',
        primaryRole: 'Accounting Manager',
        secondaryRole: 'Transaction Coordinator',
        role: 'Accounting Manager',
        type: 'tool',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Closing attorney paralegal acknowledged receipt of signed CDA and wire instructions.',
        systemUsed: 'Encrypted Mail / Portal'
      }
    ],
    decisions: ['If agent license is inactive with NCREC, commission disbursement must freeze pending BIC review.'],
    exceptions: ['Referral commissions require completed W-9 and Broker-to-Broker Referral Agreement.'],
    escalationPaths: ['Direct split disputes or attorney escrow shortfalls to Regional Leader.'],
    completionEvidence: {
      type: 'manual',
      description: 'BIC-signed CDA and attorney receipt acknowledgement.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2026-01-15',
    author: 'Accounting Manager',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'tmpl_office_facilities_002',
    sopId: 'tmpl_office_facilities_002',
    title: 'Brokerage Key Checkout, Lockbox & Facility Protocol',
    department: 'Operations',
    category: 'Office',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Office Operations' },
    ownerRole: 'Admin Coordinator',
    purpose: 'Managing office security, conference room reservations, physical key logs, and Bluetooth lockbox inventory tracking.',
    expectedOutcome: '100% accountability for brokerage keys, lockboxes, and office access tokens.',
    scope: 'Nest Wilmington office facilities and physical lockbox assets.',
    tags: ['office', 'facilities', 'keys', 'lockbox', 'security'],
    trigger: 'Agent requests physical key checkout or Supra lockbox assignment.',
    steps: [
      {
        id: 'st_off_1',
        stepNumber: 1,
        title: 'Log key checkout in asset registry',
        instruction: 'Record property address, key tag number, agent MLS ID, and expected return date in register.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Operations Lead',
        role: 'Admin Coordinator',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Physical key tag barcode scanned and agent signature logged in checkout tablet.',
        systemUsed: 'Key Tracker Desk'
      },
      {
        id: 'st_off_2',
        stepNumber: 2,
        title: 'Program and transfer Supra lockbox',
        instruction: 'Assign lockbox serial number to listing broker in Supra eKEY portal.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Field Operator',
        role: 'Admin Coordinator',
        type: 'tool',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Supra lockbox serial number paired to agent eKEY profile.',
        systemUsed: 'Supra Portal'
      },
      {
        id: 'st_off_3',
        stepNumber: 3,
        title: 'Inspect returned keys & audit inventory weekly',
        instruction: 'Inspect returned keys, return to secure safe, and perform weekly physical inventory reconcile.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Operations Lead',
        role: 'Admin Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Returned keys verified back in master key safe with zero unaccounted assets.',
        systemUsed: 'Asset Registry'
      }
    ],
    decisions: ['If key is unreturned past 48 hours without notice, trigger automated SMS notification.'],
    exceptions: ['Master keys cannot leave the building without written approval from Operations Lead.'],
    escalationPaths: ['Report lost lockboxes or missing master keys immediately to Broker-in-Charge.'],
    completionEvidence: {
      type: 'manual',
      description: 'Signed digital checkout log and verified return receipt.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2026-01-15',
    author: 'Operations Lead',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'tmpl_systems_provisioning_003',
    sopId: 'tmpl_systems_provisioning_003',
    title: 'Dotloop & Brokerage Tech Stack User Provisioning Protocol',
    department: 'Operations',
    category: 'Systems',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Technology & Integrations' },
    ownerRole: 'Admin Coordinator',
    purpose: 'Provisioning new brokers and staff on Dotloop, Google Workspace, CRM, and MLS compliance portals.',
    expectedOutcome: 'Full software credential activation within 24 hours of broker onboarding.',
    scope: 'All digital systems utilized across Nest Realty Wilmington.',
    tags: ['systems', 'tech', 'dotloop', 'provisioning', 'google_workspace'],
    trigger: 'New agent onboarding approval received from Broker-in-Charge.',
    steps: [
      {
        id: 'st_sys_1',
        stepNumber: 1,
        title: 'Create Google Workspace corporate account',
        instruction: 'Provision agent @nestrealty.com email, 2FA security enforcement, and team groups.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Operations Lead',
        role: 'Admin Coordinator',
        type: 'tool',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Google Workspace account active with mandatory 2-step verification enforced.',
        systemUsed: 'Google Admin Console'
      },
      {
        id: 'st_sys_2',
        stepNumber: 2,
        title: 'Provision Dotloop brokerage profile & templates',
        instruction: 'Add user to Nest Wilmington Dotloop roster and associate NCREC standard document templates.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Transaction Coordinator',
        role: 'Admin Coordinator',
        type: 'tool',
        durationPolicy: { preset: '30m', rawDisplay: '30m' },
        affirmationCheck: 'Dotloop profile provisioned with default NC REALTORS standard document templates.',
        systemUsed: 'Dotloop Admin'
      },
      {
        id: 'st_sys_3',
        stepNumber: 3,
        title: 'Send welcome credentials package',
        instruction: 'Deliver secure single-use password reset link and tech stack setup guide to agent.',
        assignedRole: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Marketing Coordinator',
        role: 'Admin Coordinator',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15m' },
        affirmationCheck: 'Agent verified successful first login and password update.',
        systemUsed: 'Welcome Dispatch'
      }
    ],
    decisions: ['If NCREC broker license is unverified, pause all system provisioning.'],
    exceptions: ['Staff accounts require elevated admin privileges approved by Regional Leader.'],
    escalationPaths: ['Direct account lockouts or security alerts to Technology Integrator.'],
    completionEvidence: {
      type: 'manual',
      description: 'Completed onboarding provisioning checklist with verified login audit.'
    },
    status: 'published',
    version: '1.0',
    activationDate: '2026-01-15',
    author: 'Operations Lead',
    reviewer: 'Regional Leader',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_meta_sop_for_sops_000',
    sopId: 'sop_meta_sop_for_sops_000',
    title: 'SOP Authoring, Governance & Lifecycle Protocol',
    department: 'Operations',
    category: 'Operations',
    stateJurisdiction: 'NC',
    sopOwner: { type: 'department', name: 'Operations & Governance' },
    ownerRole: 'Operations Lead',
    purpose: 'Standardizing the lifecycle of standard operating procedures: approved abbreviations, canonical role definitions, pass/fail checklist affirmations, and dual-lane review governance.',
    expectedOutcome: 'Standardized SOP governance with consistent abbreviations, verified role anonymity, and certified review signoff.',
    scope: 'All standard operating procedures created or maintained within the brokerage.',
    trigger: 'New operational procedure identified, operational debt audited, or annual SOP review triggered.',
    steps: [
      {
        id: 'st_meta_1',
        stepNumber: 1,
        title: 'Validate Terminology Against Approved Abbreviations Registry',
        instruction: 'Cross-reference procedure text against approved abbreviations (BIC, PB, TC, EMD, DDF, CDA, WWREA, RPOADS, MOG, NCREC, SCREC, VAR) to prevent ambiguous nomenclature.',
        assignedRole: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Broker-in-Charge',
        type: 'review',
        durationPolicy: { preset: '15m', rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that all real estate and organizational abbreviations strictly comply with the approved SOP abbreviations registry.',
        systemUsed: 'Shapework Knowledge Library'
      },
      {
        id: 'st_meta_2',
        stepNumber: 2,
        title: 'Enforce Role Anonymity via Automated Role Guard',
        instruction: 'Execute Role Guard linter across all procedural steps, trigger descriptions, and escalation paths to ensure zero personal names are present.',
        assignedRole: 'Operations Lead',
        primaryRole: 'Operations Lead',
        type: 'manual',
        durationPolicy: { preset: '15m', rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that zero individual personal names exist and all assignees use canonical brokerage role titles.',
        systemUsed: 'Role Guard Linter'
      },
      {
        id: 'st_meta_3',
        stepNumber: 3,
        title: 'Author Pass/Fail Execution Affirmations for Verification Checklist',
        instruction: 'Write present-tense verification affirmations for each procedure step, confirming completed condition rather than copying procedural instructions.',
        assignedRole: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30 mins' },
        affirmationCheck: 'Validated that every step has an affirmative pass/fail verification check distinct from procedural instructions.',
        systemUsed: 'SOP Studio'
      },
      {
        id: 'st_meta_4',
        stepNumber: 4,
        title: 'Publish to Drafts for Comment for Peer Review',
        instruction: 'Publish draft procedure to the Drafts for Comment review lane to solicit collaborative feedback and operational notes from staff.',
        assignedRole: 'Operations Lead',
        primaryRole: 'Operations Lead',
        type: 'manual',
        durationPolicy: { preset: '48h', rawDisplay: '48 hrs' },
        affirmationCheck: 'Confirmed that procedure draft is active in Drafts for Comment with notification dispatched to departmental stakeholders.',
        systemUsed: 'Knowledge Library'
      },
      {
        id: 'st_meta_5',
        stepNumber: 5,
        title: 'Route to Dual Review Lane (BIC vs Owner Review)',
        instruction: 'Route compliance, contract, and transaction SOPs to Awaiting BIC Review; route operations, finance, marketing, and systems SOPs to Awaiting Owner Review.',
        assignedRole: 'Operations Lead',
        primaryRole: 'Operations Lead',
        type: 'review',
        durationPolicy: { preset: '24h', rawDisplay: '24 hrs' },
        affirmationCheck: 'Verified that formal review routing matches the categorical governance policy (BIC vs Owner lane).',
        systemUsed: 'Governance Routing Engine'
      },
      {
        id: 'st_meta_6',
        stepNumber: 6,
        title: 'Authorize Publication, Assign Activation Date & Issue Controlled Copy',
        instruction: 'Certifying reviewer executes digital approval, assigns version number and activation date, locking controlled copy with 14-day watermark protection.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Managing Principal',
        type: 'approval',
        durationPolicy: { preset: '1h', rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed that SOP is published with verified activation date, locked version metadata, and controlled copy export protections.',
        systemUsed: 'Knowledge Library'
      }
    ],
    decisions: [
      'If procedure involves legal, licensing, or trust accounting, Broker-in-Charge approval is mandatory.',
      'If procedure requires budget expenditure exceeding discretionary limits, Managing Principal approval is required.'
    ],
    exceptions: ['Emergency procedural updates may be temporarily authorized by BIC pending formal comment period.'],
    escalationPaths: ['Unresolved review disputes escalate to Managing Principal and Broker-in-Charge joint review.'],
    status: 'published',
    version: '1.0',
    activationDate: '2026-01-01',
    author: 'Operations Lead',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  },
  {
    id: 'sop_master_contract_review_031',
    sopId: 'sop_master_contract_review_031',
    title: 'Master Purchase Contract Review & Escrow Due Diligence Protocol',
    department: 'Operations',
    category: 'Transactions',
    stateJurisdiction: 'NC',
    isMasterSop: true,
    stateAddenda: {
      'NC': {
        stateCode: 'NC',
        stateName: 'North Carolina',
        governingCommission: 'North Carolina Real Estate Commission (NCREC)',
        statutoryDepositDeadlineHours: 72,
        escrowTrustRules: 'Initial Earnest Money Deposit (EMD) must be deposited into attorney escrow trust within 3 banking days of contract acceptance per NCREC Rule 58A .0106. Due Diligence Fee (DDF) delivered directly to seller upon effective date.',
        contingencyTimelineRules: {
          dueDiligenceDaysDefault: 14,
          settlementGracePeriodDays: 14,
          notes: 'NC Form 2-T Due Diligence Period provides buyer unilateral right to terminate for any or no reason before 5:00 PM on the Due Diligence Date. No statutory loan contingency exists after D-Day.'
        },
        mandatoryDisclosures: [
          {
            code: 'WWREA',
            title: 'Working With Real Estate Agents Disclosure',
            requiredTiming: 'First substantial contact prior to confidential disclosures',
            statutoryReference: 'NCREC Rule 58A .0104',
            affirmationCheck: 'Confirmed that WWREA disclosure was signed and acknowledged prior to substantive contract negotiation.'
          },
          {
            code: 'RPOADS',
            title: 'Residential Property and Owners\' Association Disclosure Statement',
            requiredTiming: 'Prior to contract offer submission',
            statutoryReference: 'NCGS Chapter 47E',
            affirmationCheck: 'Verified that seller completed all 37 questions of RPOADS without blank entries.'
          },
          {
            code: 'MOG',
            title: 'Mineral and Oil and Gas Rights Mandatory Disclosure Statement',
            requiredTiming: 'Prior to contract offer submission',
            statutoryReference: 'NCGS Chapter 47E',
            affirmationCheck: 'Verified that MOG disclosure is executed by all titleholders and attached to contract file.'
          }
        ],
        stepOverrides: [
          {
            stepNumber: 2,
            actionOverride: 'Verify Initial EMD is deposited in attorney trust account within 72 hours (3 banking days per NCREC Rule 58A .0106) and obtain Escrow Receipt.',
            statutoryReference: 'NCREC Rule 58A .0106',
            affirmationCheckOverride: 'Confirmed EMD deposited in attorney trust within statutory 72-hour banking window with written receipt on file.'
          }
        ]
      },
      'SC': {
        stateCode: 'SC',
        stateName: 'South Carolina',
        governingCommission: 'South Carolina Real Estate Commission (SCREC)',
        statutoryDepositDeadlineHours: 48,
        escrowTrustRules: 'Earnest money must be deposited within 48 hours of contract ratification into broker or attorney escrow trust account, excluding Saturdays, Sundays, and legal bank holidays.',
        contingencyTimelineRules: {
          dueDiligenceDaysDefault: 10,
          inspectionContingencyDaysDefault: 10,
          financingContingencyDaysDefault: 21,
          notes: 'SC standard Form 310 provides Repair Procedure or Due Diligence Option. Financing contingency requires formal loan application notice within specified calendar days.'
        },
        mandatoryDisclosures: [
          {
            code: 'SC_AGENCY',
            title: 'South Carolina Disclosure of Real Estate Brokerage Relationships',
            requiredTiming: 'At first practical opportunity upon substantive contact',
            statutoryReference: 'SC Code § 40-57-350',
            affirmationCheck: 'Confirmed SC Brokerage Relationships disclosure is fully signed by buyer and broker.'
          },
          {
            code: 'SC_RPD',
            title: 'South Carolina Residential Property Condition Disclosure',
            requiredTiming: 'Prior to contract ratification',
            statutoryReference: 'SC Code § 27-50-10 et seq.',
            affirmationCheck: 'Verified that SC Property Condition Disclosure is completed by owner and delivered to purchaser.'
          }
        ],
        stepOverrides: [
          {
            stepNumber: 2,
            actionOverride: 'Verify Initial EMD is delivered and deposited into escrow account within statutory 48 hours of ratification per SCREC rules.',
            statutoryReference: 'SC Code § 40-57-135',
            affirmationCheckOverride: 'Confirmed EMD delivered to escrow trust within SC statutory 48-hour window.'
          }
        ]
      },
      'VA': {
        stateCode: 'VA',
        stateName: 'Virginia',
        governingCommission: 'Virginia Real Estate Board (VREB) / VAR',
        statutoryDepositDeadlineHours: 120,
        escrowTrustRules: 'Escrow agent must deposit earnest money funds into designated escrow trust account within 5 business days of contract ratification pursuant to 18 VAC 135-20-180.',
        contingencyTimelineRules: {
          inspectionContingencyDaysDefault: 10,
          financingContingencyDaysDefault: 21,
          appraisalContingencyDaysDefault: 21,
          notes: 'Virginia NVAR K1336 contracts feature separate Home Inspection, Financing, and Appraisal contingencies. 3-day statutory rescission right applies upon delivery of POA/HOA resale disclosure.'
        },
        mandatoryDisclosures: [
          {
            code: 'VA_RPDA',
            title: 'Virginia Residential Property Disclosure Act Notice',
            requiredTiming: 'Prior to contract execution',
            statutoryReference: 'Code of Virginia § 55.1-700 et seq.',
            affirmationCheck: 'Confirmed Virginia Residential Property Disclosure statement signed and delivered.'
          },
          {
            code: 'VA_POA_HOA',
            title: 'Property Owners\' Association / Condominium Resale Disclosure',
            requiredTiming: 'Delivered within 14 days of ratification',
            statutoryReference: 'Code of Virginia § 55.1-1808',
            affirmationCheck: 'Verified delivery of POA resale package with statutory 3-day buyer cancellation period tracked.'
          }
        ],
        stepOverrides: [
          {
            stepNumber: 2,
            actionOverride: 'Verify Initial EMD is placed into broker/settlement attorney escrow trust within 5 business days of contract acceptance pursuant to Virginia regulations.',
            statutoryReference: '18 VAC 135-20-180',
            affirmationCheckOverride: 'Confirmed EMD deposited within Virginia 5-business-day regulatory escrow window.'
          }
        ]
      }
    },
    sopOwner: { type: 'department', name: 'Transactions & Compliance' },
    ownerRole: 'Broker-in-Charge',
    purpose: 'End-to-end audit protocol for reviewing executed purchase agreements, calculating state-specific contingency timelines, verifying statutory escrow deposit compliance, and initiating transaction intake.',
    expectedOutcome: 'Flawless contract audit certification, timely escrow verification, and zero missed contingency dates.',
    scope: 'All residential purchase agreements received across NC, SC, and VA brokerage operations.',
    trigger: 'Executed purchase offer and contract received from cooperating agent or client.',
    steps: [
      {
        id: 'st_cr_1',
        stepNumber: 1,
        title: 'Audit Contract Execution & Legal Signatures',
        instruction: 'Verify that all buyers and sellers have signed and initialed every page of the purchase agreement and all attached addenda with matching legal names.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Transaction Coordinator',
        type: 'review',
        durationPolicy: { preset: '30m', rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that contract execution dates, seller/buyer signatures, and page initials are 100% complete.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_cr_2',
        stepNumber: 2,
        title: 'Verify Earnest Money Escrow Trust Deposit',
        instruction: 'Confirm that initial earnest money deposit is delivered to designated settlement attorney or broker escrow trust within the statutory banking deadline.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Broker-in-Charge',
        type: 'manual',
        durationPolicy: { preset: '1h', rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed EMD deposited in statutory escrow trust account with written receipt verification on file.',
        systemUsed: 'Escrow Trust Ledger'
      },
      {
        id: 'st_cr_3',
        stepNumber: 3,
        title: 'Calculate State-Specific Contingency Calendar',
        instruction: 'Calculate due diligence expiration, inspection notice deadlines, financing contingency windows, and settlement dates based on governing state jurisdiction.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        type: 'manual',
        durationPolicy: { preset: '30m', rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that contingency milestone calendar is calculated and dispatched to client, agent, and closing attorney.',
        systemUsed: 'Timeline Calculator'
      },
      {
        id: 'st_cr_4',
        stepNumber: 4,
        title: 'Audit Mandatory State Regulatory Disclosures',
        instruction: 'Verify that all state-mandated property disclosures and agency brochures are fully executed without omission and uploaded to transaction file.',
        assignedRole: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Broker-in-Charge',
        type: 'review',
        durationPolicy: { preset: '45m', rawDisplay: '45 mins' },
        affirmationCheck: 'Confirmed that all mandatory state disclosures are signed by all parties and uploaded to compliance repository.',
        systemUsed: 'Dotloop Compliance Desk'
      },
      {
        id: 'st_cr_5',
        stepNumber: 5,
        title: 'Issue Formal File Compliance Sign-off & Attorney Handoff',
        instruction: 'Broker-in-Charge reviews completed intake package, certifies regulatory compliance, and transmits introductory packet to closing attorney.',
        assignedRole: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        type: 'approval',
        durationPolicy: { preset: '30m', rawDisplay: '30 mins' },
        affirmationCheck: 'Validated that file has received Broker-in-Charge compliance certification and closing attorney confirmation.',
        systemUsed: 'Dotloop'
      }
    ],
    decisions: [
      'If earnest money deposit receipt is not received within statutory banking hours, issue immediate 24-hour demand notice.',
      'If mandatory state disclosures are missing at contract acceptance, notify agent immediately to cure before contingency expiration.'
    ],
    exceptions: ['Delayed settlement requires formal written extension agreement executed prior to original settlement date.'],
    escalationPaths: [
      'Escalate missing EMD past statutory window to Broker-in-Charge for legal notice.',
      'Escalate contract discrepancies or uninitialed modifications to Broker-in-Charge.'
    ],
    status: 'published',
    version: '2.0',
    activationDate: '2026-01-01',
    author: 'Broker-in-Charge',
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge'
  }
];

export const SOP_CATEGORY_TEMPLATES = [
  {
    category: 'Agent Onboarding, Training, Support and Retention',
    label: 'Agent Onboarding & Retention',
    description: 'New agent intake, equipment checkout, bio/headshots, mentoring, support desk triage, and retention check-ins.',
    templateId: 'sop_new_agent_onboarding_008',
    defaultOwnerRole: 'Operations Lead',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  {
    category: 'Marketing',
    label: 'Marketing & Brand Strategy',
    description: 'Listing launch marketing, Google review engine, brochures, social blitz, brand guidelines, and client touchpoints.',
    templateId: 'sop_listing_launch_001',
    defaultOwnerRole: 'Marketing Lead',
    defaultDepartment: 'Marketing',
    jurisdiction: 'NC'
  },
  {
    category: 'Finance',
    label: 'Finance & Escrow Accounting',
    description: 'The Gospel cash sheet, payroll processing, accounts payable, credit card management, and 1099 vendor compliance.',
    templateId: 'sop_gospel_cash_cadence_040',
    defaultOwnerRole: 'Finance Lead',
    defaultDepartment: 'Finance',
    jurisdiction: 'NC'
  },
  {
    category: 'Office and Facilities',
    label: 'Office & Facilities',
    description: 'Front desk reception, office maintenance routing, room reservations, inventory restock, and lockbox readiness.',
    templateId: 'sop_office_maintenance_routing_048',
    defaultOwnerRole: 'Admin Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  {
    category: 'Owner / Leadership',
    label: 'Owner & Leadership Governance',
    description: 'Owner escalation matrix, Monday leadership check-ins, weekly briefings, quarterly audits, and agent recruitment.',
    templateId: 'sop_owner_escalation_rights_001',
    defaultOwnerRole: 'Managing Principal',
    defaultDepartment: 'Leadership',
    jurisdiction: 'NC'
  },
  {
    category: 'Events',
    label: 'Events & Sponsorships',
    description: 'Event planning playbooks, weather and cancellation contingency protocols, and post-event lead follow-up.',
    templateId: 'tmpl_event_planning_028',
    defaultOwnerRole: 'Marketing Lead',
    defaultDepartment: 'Marketing',
    jurisdiction: 'NC'
  },
  {
    category: 'Transactions and Compliance',
    label: 'Transactions & Compliance',
    description: 'Master contract review, multi-state addenda, earnest money verification, closing compliance, and commission payouts.',
    templateId: 'sop_master_contract_review_031',
    defaultOwnerRole: 'Broker-in-Charge',
    defaultDepartment: 'Transactions & Compliance',
    jurisdiction: 'NC'
  },
  {
    category: 'Vendors & Systems',
    label: 'Vendors & Systems Administration',
    description: 'Vendor directory, Dotloop/Rechat tech provisioning, software license management, and data backup retention.',
    templateId: 'sop_vendor_directory_053',
    defaultOwnerRole: 'Admin Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  // Legacy Category Compatibility Aliases
  {
    category: 'Transactions',
    label: 'Transactions & Contracts',
    description: 'Listing launch, contract execution audit, due diligence tracking, and closing compliance.',
    templateId: 'sop_listing_launch_001',
    defaultOwnerRole: 'Transaction Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  {
    category: 'Office',
    label: 'Office & Facilities',
    description: 'Key checkout, conference room reservations, supplies management, and facility protocols.',
    templateId: 'sop_office_maintenance_routing_048',
    defaultOwnerRole: 'Admin Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  {
    category: 'Vendor',
    label: 'Vendor Management',
    description: 'Yard sign dispatch, professional photography scheduling, repair dispatch, and inspection coordination.',
    templateId: 'sop_vendor_directory_053',
    defaultOwnerRole: 'Admin Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  },
  {
    category: 'Systems',
    label: 'Systems & Software',
    description: 'Dotloop provisioning, Google Workspace management, CRM routing, and MLS credentials setup.',
    templateId: 'sop_vendor_directory_053',
    defaultOwnerRole: 'Admin Coordinator',
    defaultDepartment: 'Operations',
    jurisdiction: 'NC'
  }
];

export const INITIAL_WILMINGTON_SOPS = SOP_TEMPLATES;
