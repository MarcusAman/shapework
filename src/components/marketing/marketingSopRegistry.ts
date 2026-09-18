/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarketingSopDefinition {
  id: string;
  code: string;
  title: string;
  department: string;
  ownerRole: string;
  ownerName: string;
  purpose: string;
  trigger: string;
  expectedTiming: string;
  systemsUsed: string[];
  orderedSteps: {
    stepNumber: number;
    title: string;
    action: string;
    role: string;
    systemUsed: string;
  }[];
  qualityChecklist: string[];
  complianceNotes: string;
  completionEvidence: string;
}

export const MARKETING_SOPS: Record<string, MarketingSopDefinition> = {
  'SOP-MKT-001': {
    id: 'sop_marketing_intake_001',
    code: 'SOP-MKT-001',
    title: 'Marketing Intake & Campaign Dispatch Protocol',
    department: 'Marketing',
    ownerRole: 'Marketing Director',
    ownerName: 'Melissa Gagliardi',
    purpose: 'End-to-end processing of agent marketing requests for new listings, price improvements, open houses, and under-contract collateral.',
    trigger: 'Listing marketing request received via Ask Nest Ops telephony voice or Marketing Intake portal.',
    expectedTiming: '24 hours from intake submission',
    systemsUsed: ['Ask Nest Ops Voice AI', 'Nest Design Center (Maxa)', 'Basecamp', 'Dotloop'],
    orderedSteps: [
      { stepNumber: 1, title: 'Intake Ingestion & Verification', action: 'Ingest property address, list price, photo gallery, and requested collateral package specs.', role: 'Marketing Director', systemUsed: 'Marketing Console' },
      { stepNumber: 2, title: 'AI Copy & Headline Drafting', action: 'Auto-generate tailored property headlines, body copy, and open house hooks using Nest brand tone.', role: 'Marketing AI Engine', systemUsed: 'Nora AI' },
      { stepNumber: 3, title: 'Autonomous Maxa Staging Dispatch', action: 'Stage 300 DPI vector flyers, social story carousels, and EDDM postcards in Eduardo\'s VA workstation.', role: 'Nora Browser Agent', systemUsed: 'Maxa Design Center' },
      { stepNumber: 4, title: 'Proof Package Dispatch', action: 'Compile staged proofs and notify listing agent for 1-click review and approval.', role: 'Marketing Director', systemUsed: 'Approval Center' }
    ],
    qualityChecklist: [
      'Verify property address and list price match NC Regional MLS',
      'Ensure high-resolution photography is attached (≥300 DPI)',
      'Confirm requested deliverable formats (Flyer, Story, Postcard)',
      'Validate listing agent contact phone, email, and license number'
    ],
    complianceNotes: 'Mandatory NCREC broker disclosure and Equal Housing Opportunity logo required on all public assets.',
    completionEvidence: 'Dispatched proof package URL and agent approval confirmation receipt.'
  },

  'SOP-MKT-002': {
    id: 'sop_marketing_intake_002',
    code: 'SOP-MKT-002',
    title: 'Social Media Reel & Story Campaign Blitz Protocol',
    department: 'Marketing',
    ownerRole: 'Marketing Director',
    ownerName: 'Melissa Gagliardi',
    purpose: 'Rapid authoring, rendering, and scheduling of 9:16 vertical video reels and 3-slide story carousels for Instagram and Facebook.',
    trigger: 'Agent requests social blitz or new listing launch.',
    expectedTiming: '12 hours from photo receipt',
    systemsUsed: ['Nest Design Center (Maxa)', 'Meta Business Suite', 'Canva'],
    orderedSteps: [
      { stepNumber: 1, title: 'Curate Hero Visuals', action: 'Select top 3-5 high-impact exterior, primary living, and kitchen photography assets.', role: 'Marketing Director', systemUsed: 'Photo Library' },
      { stepNumber: 2, title: 'Format 9:16 Vertical Story', action: 'Populate 1080x1920 3-slide carousel in Nest Maxa with animated hooks and price badges.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { stepNumber: 3, title: 'Compile Geo-Fenced Ad Copy', action: 'Draft caption with open house schedule, neighborhood highlights, and MLS link.', role: 'Marketing Director', systemUsed: 'Meta Suite' }
    ],
    qualityChecklist: [
      'Confirm 9:16 aspect ratio (1080x1920 px) with safe zone margins',
      'Verify open house date, hours, and agent handle are visible',
      'Check audio track royalty clearance and brand color grading'
    ],
    complianceNotes: 'All social media ads must state brokerage firm name "Nest Realty Wilmington" in the primary caption.',
    completionEvidence: 'Published social campaign links and scheduled Meta ad receipts.'
  },

  'SOP-MKT-003': {
    id: 'sop_marketing_intake_003',
    code: 'SOP-MKT-003',
    title: 'Autonomous Maxa Collateral Production & 300 DPI Export Protocol',
    department: 'Production',
    ownerRole: 'Virtual Assistant',
    ownerName: 'Eduardo Lovo',
    purpose: 'Precision graphic production of double-sided property flyers, 9:16 story reels, and direct mail postcards in the Nest Design Center (Maxa).',
    trigger: 'Campaign enters In Production queue or Maxa Browser Agent completes staging.',
    expectedTiming: '4 to 6 hours from assignment',
    systemsUsed: ['Nest Design Center (Maxa)', 'Google Drive Proofs', 'Shapework Production Console'],
    orderedSteps: [
      { stepNumber: 1, title: 'Open Task Workstation', action: 'Access listing details, high-res photos, and Maxa template deep-links in slide-over workstation.', role: 'Virtual Assistant', systemUsed: 'Workstation Drawer' },
      { stepNumber: 2, title: 'Populate Maxa Templates', action: 'Insert photo placements, headline, bedroom/bath specs, price, and agent headshot into Design Center.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { stepNumber: 3, title: 'Audit 300 DPI Export', action: 'Export print-ready vector PDF with crop marks, 300 DPI rasterization, and USPS clear zones.', role: 'Virtual Assistant', systemUsed: 'Maxa Exporter' },
      { stepNumber: 4, title: 'Stage Work Proof for Review', action: 'Upload compiled deliverables to Google Drive and submit proof URL for final approval.', role: 'Virtual Assistant', systemUsed: 'Proof Staging Desk' }
    ],
    qualityChecklist: [
      'Verify photo resolution is ≥300 DPI on all print deliverables',
      'Confirm Nest Realty logo clear space guidelines and brand teal palette (#00635C)',
      'Ensure NC Real Estate Commission broker name and license are visible',
      'Verify Equal Housing Opportunity logo is placed on all public flyers',
      'Check USPS 6x9 postcard addressing clear zone meets postal specifications'
    ],
    complianceNotes: 'Zero-tolerance for truncated MLS disclosures, unverified square footage, or missing license numbers.',
    completionEvidence: 'Google Drive folder link containing 300 DPI PDF flyer, PNG social story, and print postcard.'
  },

  'SOP-MKT-004': {
    id: 'sop_marketing_intake_004',
    code: 'SOP-MKT-004',
    title: 'Brand SOP Quality & NCREC Compliance Verification Protocol',
    department: 'Quality & Compliance',
    ownerRole: 'Virtual Assistant',
    ownerName: 'Eduardo Lovo',
    purpose: 'Pre-flight quality assurance and regulatory compliance verification on all marketing deliverables before agent dispatch.',
    trigger: 'Deliverables staged in production workspace.',
    expectedTiming: '15 minutes per collateral package',
    systemsUsed: ['Compliance Audit Engine', 'NCREC Portal', 'Shapework QA Suite'],
    orderedSteps: [
      { stepNumber: 1, title: 'Legal Identity Audit', action: 'Verify firm name "Nest Realty Wilmington", agent license, and BIC name.', role: 'Virtual Assistant', systemUsed: 'Compliance Desk' },
      { stepNumber: 2, title: 'Color & Typography Pre-flight', action: 'Validate brand font hierarchy, hex colors (#00635C, #E5EFEA), and vector clarity.', role: 'Virtual Assistant', systemUsed: 'Maxa Inspector' },
      { stepNumber: 3, title: 'Issue Quality Sign-off', action: 'Mark 5-point quality checklist verified and transition status to Ready for Review.', role: 'Virtual Assistant', systemUsed: 'Workstation Drawer' }
    ],
    qualityChecklist: [
      '100% compliance with Nest Brand Standards Manual',
      'NCREC Rule 58A.0105 compliance (clear identification of firm)',
      'Accurate tax parcel / PIN and MLS listing number'
    ],
    complianceNotes: 'North Carolina Real Estate Commission rules require all print and online ads to prominently display the firm name.',
    completionEvidence: 'Completed 5-point QA checklist signed off by production operator.'
  },

  'SOP-REV-001': {
    id: 'sop_marketing_review_001',
    code: 'SOP-REV-001',
    title: 'Agent Collateral Review & 1-Click Approval Delivery Protocol',
    department: 'Marketing',
    ownerRole: 'Marketing Director',
    ownerName: 'Melissa Gagliardi',
    purpose: 'Streamlined proof dispatch to listing agents via SMS/email with interactive 1-click approval and automated print vendor routing.',
    trigger: 'Production VA submits verified proof package.',
    expectedTiming: '2 hours from proof submission',
    systemsUsed: ['Ask Nest Ops SMS Engine', 'Twilio SMS', 'Coastal Print Works API'],
    orderedSteps: [
      { stepNumber: 1, title: 'Inspect Staged Deliverables', action: 'Review 8.5x11 flyer, 9:16 story, and 6x9 postcard proofs in Review Drawer.', role: 'Marketing Director', systemUsed: 'Review Console' },
      { stepNumber: 2, title: 'Dispatch Agent Review Link', action: 'Send 1-click proof approval link to listing agent via SMS and email.', role: 'Marketing Director', systemUsed: 'Twilio Gateway' },
      { stepNumber: 3, title: 'Approve & Trigger Vendor Print', action: 'On approval, auto-dispatch high-res PDF to Coastal Print Works for same-day delivery.', role: 'Marketing Director', systemUsed: 'Print Vendor Portal' }
    ],
    qualityChecklist: [
      'Verify agent phone and email receipt delivery confirmation',
      'Ensure 1-click approval link resolves with full thumbnail previews',
      'Confirm print vendor job ticket includes delivery address and rush deadline'
    ],
    complianceNotes: 'Agent approval required prior to physical print production unless pre-authorized.',
    completionEvidence: 'Agent approval timestamp and print vendor confirmation invoice.'
  },

  'SOP-OPS-001': {
    id: 'sop_office_ops_001',
    code: 'SOP-OPS-001',
    title: 'Coastal Sign Post Co. Yard Post & Custom Rider Dispatch Protocol',
    department: 'Operations & Facilities',
    ownerRole: 'Signs & Operations (ATC)',
    ownerName: 'Ann Gunn',
    purpose: 'Ordering, coordinate verification, rider customization, and installation tracking for yard sign posts across New Hanover, Brunswick, and Pender counties.',
    trigger: 'Listing agreement executed or agent requests sign installation.',
    expectedTiming: 'Same-day dispatch; installation within 24 to 48 hours',
    systemsUsed: ['Coastal Sign Post Co. Portal', 'Google Maps API', 'Dotloop'],
    orderedSteps: [
      { stepNumber: 1, title: 'Validate Property Coordinates', action: 'Verify parcel coordinates, HOA sign restrictions, and underground utility marking requirements (811).', role: 'Signs & Operations Lead', systemUsed: 'Google Maps' },
      { stepNumber: 2, title: 'Dispatch Vendor Work Order', action: 'Issue installation ticket to Coastal Sign Post Co. specifying post style, custom agent rider, and brochure box.', role: 'Signs & Operations Lead', systemUsed: 'Vendor Portal' },
      { stepNumber: 3, title: 'Confirm Installation & Photo Proof', action: 'Verify vendor completion photo and update listing record with sign status.', role: 'Signs & Operations Lead', systemUsed: 'Sign Post Tracker' }
    ],
    qualityChecklist: [
      'Verify HOA covenants regarding yard signs before dispatch',
      'Ensure correct custom rider text (e.g. "Coming Soon", "Waterfront", "Open Sunday")',
      'Confirm brochure box is stocked with high-res printed flyers'
    ],
    complianceNotes: 'City of Wilmington and NCDOT right-of-way setbacks must be strictly observed.',
    completionEvidence: 'Coastal Sign Post Co. work order # and on-site completion photograph.'
  },

  'SOP-OPS-002': {
    id: 'sop_office_ops_002',
    code: 'SOP-OPS-002',
    title: 'Supra Lockbox & Showing Access Management Protocol',
    department: 'Operations & Facilities',
    ownerRole: 'Signs & Operations (ATC)',
    ownerName: 'Ann Gunn',
    purpose: 'Assignment, shackle code verification, Bluetooth pairing, and ShowingTime integration for Supra eKEY lockboxes.',
    trigger: 'New listing scheduled for photography or MLS activation.',
    expectedTiming: '24 hours prior to MLS active status',
    systemsUsed: ['Supra WEB', 'ShowingTime', 'NC Regional MLS'],
    orderedSteps: [
      { stepNumber: 1, title: 'Assign Lockbox Serial Number', action: 'Check out lockbox from office inventory and log serial number to listing PIN.', role: 'Signs & Operations Lead', systemUsed: 'Lockbox Inventory Desk' },
      { stepNumber: 2, title: 'Configure ShowingTime Callbacks', action: 'Program access hours (8:00 AM - 8:00 PM) and seller confirmation requirements.', role: 'Signs & Operations Lead', systemUsed: 'ShowingTime' },
      { stepNumber: 3, title: 'Verify Shackle & Key Placement', action: 'Confirm physical lockbox attached to exterior door or gas meter with spare key set inside.', role: 'Listing Agent / Operations', systemUsed: 'Supra eKEY' }
    ],
    qualityChecklist: [
      'Verify shackle code opens cleanly before leaving office',
      'Confirm Bluetooth key battery health is >80%',
      'Ensure ShowingTime instructions match seller showing preferences'
    ],
    complianceNotes: 'Lockbox access must require active NC Real Estate Broker license or licensed affiliate.',
    completionEvidence: 'Supra lockbox serial # linked to MLS listing and ShowingTime active status.'
  },

  'SOP-GOV-001': {
    id: 'sop_owner_governance_001',
    code: 'SOP-GOV-001',
    title: 'Brokerage Operations & Weekly Owner Digest Governance Protocol',
    department: 'Executive Governance',
    ownerRole: 'Principal Broker / Owner',
    ownerName: 'Ryan Crecelius',
    purpose: 'Executive oversight, SLA tracking, agent NPS scoring, operational bottleneck resolution, and automated weekly production reporting.',
    trigger: 'Weekly scheduled governance cycle (every Monday at 8:00 AM EST).',
    expectedTiming: 'Weekly recurring execution',
    systemsUsed: ['Shapework Executive Console', 'SendGrid Email API', 'Retell Telephony Analytics'],
    orderedSteps: [
      { stepNumber: 1, title: 'Aggregate Production Metrics', action: 'Compile SLA compliance %, average turnaround times, and completed marketing packages.', role: 'Owner / Executive Lead', systemUsed: 'Analytics Engine' },
      { stepNumber: 2, title: 'Review Quality Audits & Exceptions', action: 'Inspect any flagged NCREC non-compliance items or delayed vendor sign installations.', role: 'Principal Broker', systemUsed: 'Governance Desk' },
      { stepNumber: 3, title: 'Dispatch Weekly Owner Digest', action: 'Automate executive digest distribution to brokerage partners and leadership.', role: 'Principal Broker', systemUsed: 'Owner Digest Engine' }
    ],
    qualityChecklist: [
      'Verify 100% of marketing packages meet 24h turnaround target',
      'Review agent NPS feedback ratings and coordinator responsiveness',
      'Ensure zero unresolved regulatory compliance flags'
    ],
    complianceNotes: 'Principal broker maintains ultimate supervision over brokerage advertising and trust accounting.',
    completionEvidence: 'Weekly Owner Digest email distribution receipt and executive scorecard archive.'
  },

  'SOP-BIC-001': {
    id: 'sop_bic_compliance_001',
    code: 'SOP-BIC-001',
    title: 'NCREC Advertising & Form 2-T Contract Compliance Audit Protocol',
    department: 'Brokerage Compliance',
    ownerRole: 'Broker-in-Charge (BIC)',
    ownerName: 'Matt Orr / Eric Knight / Jessica Keenan',
    purpose: 'Regulatory compliance review of marketing representations, NC REALTORS® Form 2-T offers, and earnest money trust ledgers.',
    trigger: 'Marketing collateral containing price claims submitted, or executed purchase offer received.',
    expectedTiming: '4 hours for marketing approval; 72 hours for EMD trust deposit audit',
    systemsUsed: ['Dotloop', 'NCREC Portal', 'Compliance Desk'],
    orderedSteps: [
      { stepNumber: 1, title: 'Audit Advertising Disclosures', action: 'Verify firm identification, broker license numbers, and truthful representation of property attributes.', role: 'Broker-in-Charge', systemUsed: 'Compliance Desk' },
      { stepNumber: 2, title: 'Execute Form 2-T Verification', action: 'Audit purchase offer execution dates, due diligence fee delivery, and earnest money escrow trust ledger.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' },
      { stepNumber: 3, title: 'Issue Compliance Certification', action: 'Sign off on advertising or transaction loop CDA disbursement authorization.', role: 'Broker-in-Charge', systemUsed: 'CDA Desk' }
    ],
    qualityChecklist: [
      'Verify strict compliance with NCREC Rule 58A.0105',
      'Confirm Initial EMD deposited into trust escrow within 3 banking days',
      'Ensure WWREA disclosure signed prior to first substantial contact'
    ],
    complianceNotes: 'Mandatory BIC oversight under North Carolina General Statutes Chapter 93A.',
    completionEvidence: 'BIC compliance stamp on MLS listing file and approved CDA ledger.'
  }
};

/**
 * Maps team member name to their primary governing SOPs
 */
export function getTeamMemberSops(memberName: string): MarketingSopDefinition[] {
  const name = (memberName || '').toLowerCase();

  if (name.includes('eduardo')) {
    return [MARKETING_SOPS['SOP-MKT-003'], MARKETING_SOPS['SOP-MKT-004']];
  }
  if (name.includes('melissa')) {
    return [MARKETING_SOPS['SOP-MKT-001'], MARKETING_SOPS['SOP-MKT-002'], MARKETING_SOPS['SOP-REV-001']];
  }
  if (name.includes('ann')) {
    return [MARKETING_SOPS['SOP-OPS-001'], MARKETING_SOPS['SOP-OPS-002']];
  }
  if (name.includes('ryan')) {
    return [MARKETING_SOPS['SOP-GOV-001'], MARKETING_SOPS['SOP-MKT-001']];
  }
  if (name.includes('jessica') || name.includes('eric') || name.includes('matt') || name.includes('bic')) {
    return [MARKETING_SOPS['SOP-BIC-001'], MARKETING_SOPS['SOP-MKT-004']];
  }

  // Default fallback to general marketing intake
  return [MARKETING_SOPS['SOP-MKT-001'], MARKETING_SOPS['SOP-MKT-003']];
}

/**
 * Maps campaign package or request type to its specific governing SOP
 */
export function getCampaignGoverningSop(packageType: string, requestType?: string): MarketingSopDefinition {
  const pkg = (packageType || '').toLowerCase();
  const req = (requestType || '').toLowerCase();

  if (pkg.includes('sign') || req.includes('sign') || req.includes('lockbox')) {
    return MARKETING_SOPS['SOP-OPS-001'];
  }
  if (pkg.includes('luxury') || pkg.includes('collateral') || pkg.includes('flyer') || pkg.includes('postcard') || pkg.includes('print')) {
    return MARKETING_SOPS['SOP-MKT-003'];
  }
  if (pkg.includes('social') || pkg.includes('reel') || req.includes('social')) {
    return MARKETING_SOPS['SOP-MKT-002'];
  }
  if (pkg.includes('compliance') || req.includes('contract') || req.includes('audit')) {
    return MARKETING_SOPS['SOP-BIC-001'];
  }

  return MARKETING_SOPS['SOP-MKT-001'];
}
