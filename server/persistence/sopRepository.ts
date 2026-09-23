import fs from 'fs';
import path from 'path';
import { SopDocument, SopCategory, CANONICAL_SOP_CATEGORIES, normalizeSopCategory } from '../../src/types/sopWorkflow';
import { sanitizeSopRoles } from '../../src/utils/sopRoleGuard';
import { sopAuthoringRequestRepository } from './sopAuthoringRequestRepository';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const STORAGE_PATH = path.join(BACKUP_DIR, 'sops_repository.json');

export const CANONICAL_WILMINGTON_WORKSPACE = 'ws_wilmington';
export const CANONICAL_WILMINGTON_TENANT = 'tenant_nest_uat';

export const WILMINGTON_WORKSPACE_ALIASES = new Set([
  'ws_wilmington',
  'nest-realty-wilmington',
  'tenant_nest',
  'tenant_nest_uat'
]);

export function isWilmingtonWorkspace(id?: string | null): boolean {
  if (!id) return false;
  return WILMINGTON_WORKSPACE_ALIASES.has(id.trim());
}

export function canonicalizeWorkspaceId(rawId?: string | null): string {
  if (!rawId) return CANONICAL_WILMINGTON_WORKSPACE;
  const trimmed = rawId.trim();
  if (WILMINGTON_WORKSPACE_ALIASES.has(trimmed)) {
    return CANONICAL_WILMINGTON_WORKSPACE;
  }
  return trimmed;
}

export const INITIAL_NEST_SOPS: Record<string, SopDocument> = {
  'sop_listing_launch_001': {
    id: 'sop_listing_launch_001',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Listing Launch Protocol',
    purpose: 'End-to-end execution protocol for launching residential real estate listings from professional photography to MLS activation and marketing distribution.',
    trigger: 'Executed listing agreement signed and returned by seller.',
    processOwner: 'Marketing Lead',
    sopOwner: { type: 'department', name: 'Marketing & Operations' },
    category: 'Marketing',
    stateJurisdiction: 'NC',
    participants: ['Listing Agent', 'Transaction Coordinator', 'Photographer', 'Broker-in-Charge', 'Field Operator'],
    prerequisites: ['Signed Exclusive Right to Sell Agreement', 'Completed Seller Disclosures (RPOADS/MOG)'],
    requiredInputs: ['Property Address', 'List Price', 'Showing Instructions', 'Access Codes'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.', role: 'Transaction Coordinator', primaryRole: 'Transaction Coordinator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Exclusive Right to Sell Listing Agreement & WWREA validated in Dotloop.', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Schedule HDR photography, floor plan scan, and drone videography.', role: 'Listing Agent', primaryRole: 'Listing Agent', durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' }, affirmationCheck: 'HDR photography, floor plan scan, and drone videography scheduled on calendar.', systemUsed: 'Media Calendar' },
      { id: 'st_3', stepNumber: 3, action: 'Dispatch work order for yard post & brochure box installation.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Work order dispatched for yard post and brochure box installation.', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_4', stepNumber: 4, action: 'Install Bluetooth Supra lockbox on property and verify shackle code.', role: 'Listing Agent', primaryRole: 'Listing Agent', secondaryRole: 'Field Operator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Bluetooth Supra lockbox installed on property and shackle code verified.', systemUsed: 'Supra eKEY' },
      { id: 'st_5', stepNumber: 5, action: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.', role: 'Transaction Coordinator', primaryRole: 'Transaction Coordinator', durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' }, affirmationCheck: 'Seller Property Disclosures (RPOADS & MOG) collected and uploaded to Dotloop.', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.', role: 'Transaction Coordinator', primaryRole: 'Transaction Coordinator', secondaryRole: 'Listing Agent', durationPolicy: { preset: '2h', customMinutes: 120, rawDisplay: '2 hrs' }, affirmationCheck: 'MLS listing drafted with accurate room dimensions and tax PIN.', systemUsed: 'NC Regional MLS' },
      { id: 'st_7', stepNumber: 7, action: 'Submit listing draft to Broker-in-Charge for compliance review and approval.', role: 'Broker-in-Charge', primaryRole: 'Broker-in-Charge', durationPolicy: { preset: '2h', customMinutes: 120, rawDisplay: '2 hrs' }, affirmationCheck: 'Listing draft approved by Broker-in-Charge for regulatory compliance.', systemUsed: 'Compliance Desk' },
      { id: 'st_8', stepNumber: 8, action: 'Generate high-resolution property brochure and PDF marketing package.', role: 'Marketing Coordinator', primaryRole: 'Marketing Coordinator', durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' }, affirmationCheck: 'High-resolution property brochure and PDF marketing package generated.', systemUsed: 'Shapework Marketing Engine' },
      { id: 'st_9', stepNumber: 9, action: 'Schedule Broker Open preview and public Open House dates.', role: 'Listing Agent', primaryRole: 'Listing Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Broker Open preview and public Open House dates scheduled in ShowingTime.', systemUsed: 'ShowingTime' },
      { id: 'st_10', stepNumber: 10, action: 'Change MLS status from Incomplete to Active.', role: 'Transaction Coordinator', primaryRole: 'Transaction Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'MLS status successfully changed from Incomplete to Active.', systemUsed: 'NC Regional MLS' },
      { id: 'st_11', stepNumber: 11, action: 'Trigger automated Just Listed social media campaign blitz and direct mail.', role: 'Marketing Coordinator', primaryRole: 'Marketing Coordinator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Just Listed social media campaign blitz and direct mail order triggered.', systemUsed: 'Shapework Marketing' },
      { id: 'st_12', stepNumber: 12, action: 'Email active MLS link and showing instructions to seller.', role: 'Listing Agent', primaryRole: 'Listing Agent', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Active MLS link and verified showing instructions emailed to seller.', systemUsed: 'Email / Client Portal' }
    ],
    decisions: ['If septic permit is unavailable, delay MLS activation until county records confirmed.'],
    exceptions: ['Delayed showing listings require formal NC Regional MLS Delayed Showing Addendum.'],
    escalationPaths: ['Escalate property boundary disputes or title issues to Broker-in-Charge.'],
    completionEvidence: 'Active MLS # generated, sign installed, lockbox active, marketing flyer dispatched.',
    expectedTiming: '48 to 72 hours from photo receipt to live MLS status',
    systemsUsed: ['Dotloop', 'NC Regional MLS', 'Sign Inventory Desk', 'Shapework Marketing Engine', 'Supra eKEY'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Marketing Coordinator',
    createdBy: 'Marketing Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 2
  },
  'sop_contract_verification_002': {
    id: 'sop_contract_verification_002',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Buyer Contract Verification & EMD Audit Protocol',
    purpose: 'Auditing executed NC REALTORS® Form 2-T purchase offers, verifying earnest money escrow timelines, and establishing closing compliance ledgers.',
    trigger: 'Executed Form 2-T Offer to Purchase and Contract received.',
    processOwner: 'Broker-in-Charge',
    sopOwner: { type: 'department', name: 'Transactions & Compliance' },
    category: 'Transactions and compliance',
    stateJurisdiction: 'NC',
    participants: ['Broker-in-Charge', 'Closing Attorney', 'Admin Coordinator', 'Selling Agent'],
    prerequisites: ['Executed Form 2-T Offer & Contract', 'Due Diligence Receipt'],
    requiredInputs: ['Purchase Price', 'Due Diligence Fee', 'Initial EMD Amount', 'Settlement Date', 'Escrow Agent'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.', role: 'Broker-in-Charge', primaryRole: 'Broker-in-Charge', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Form 2-T execution dates, signature initials, and DD fee receipt audited.', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours (3 banking days per NCREC Rule 58A .0106).', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', secondaryRole: 'Broker-in-Charge', durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' }, affirmationCheck: 'EMD confirmed deposited in attorney escrow trust within 72h statutory window.', systemUsed: 'Trust Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Critical milestone dates (Due Diligence & Settlement) confirmed and scheduled.', systemUsed: 'Basecamp Calendar' },
      { id: 'st_4', stepNumber: 4, action: 'Notify cooperating broker and closing attorney with official contract execution package.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Official contract execution package sent to cooperating broker and closing attorney.', systemUsed: 'Email' },
      { id: 'st_5', stepNumber: 5, action: 'Sync transaction loop in Dotloop and attach escrow trust receipt.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Transaction loop synced in Dotloop with escrow trust receipt attached.', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft Commission Disbursement Authorization (CDA) ledger with broker commission split.', role: 'Broker-in-Charge', primaryRole: 'Broker-in-Charge', durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' }, affirmationCheck: 'CDA ledger drafted with verified commission split and firm compliance check.', systemUsed: 'CDA Desk' }
    ],
    decisions: ['If EMD is not received within 72h, issue formal 1-business-day notice before contract voidability.'],
    exceptions: ['FHA/VA financing requires mandatory Amendatory Clause addendum.'],
    escalationPaths: ['Direct all earnest money release disputes immediately to Broker-in-Charge.'],
    completionEvidence: 'Verified EMD escrow receipt and BIC-approved CDA ledger.',
    expectedTiming: 'Within 72 hours of contract execution',
    systemsUsed: ['Dotloop', 'Coastal Settlement Law PC', 'CDA Compliance Desk'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_marketing_intake_003': {
    id: 'sop_marketing_intake_003',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Marketing Requests',
    purpose: 'Processing agent marketing requests for new listings, open houses, price improvements, and under-contract announcements with autonomous 1-click delegation to Virtual Design Assistant.',
    trigger: 'Agent submits marketing request via Marketing Intake Console or asknora@nestrealty.com.',
    processOwner: 'Marketing Lead',
    sopOwner: { type: 'department', name: 'Marketing & Operations' },
    category: 'Marketing',
    stateJurisdiction: 'NC',
    participants: ['Listing Agent', 'Marketing Lead', 'Virtual Design Assistant', 'Print Vendor'],
    prerequisites: ['Active or Pending MLS listing', 'High-res photos'],
    requiredInputs: ['Property Address', 'Promotional Event Type', 'Target Mailing Radius', 'Collateral Specifications'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Ingest marketing request parameters (address, event type, demographic target) from email/phone/console.', role: 'Marketing Coordinator', primaryRole: 'Marketing Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Marketing request parameters accurately ingested and categorized.', systemUsed: 'Marketing Console' },
      { id: 'st_2', stepNumber: 2, action: 'Auto-generate 300 DPI vector flyers, social cards, and email blasts using Nest brand tokens in Maxa.', role: 'Virtual Design Assistant', primaryRole: 'Virtual Design Assistant', durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' }, affirmationCheck: '300 DPI vector flyers, social cards, and email blasts drafted to brand spec.', systemUsed: 'Nest Design Center (Maxa)' },
      { id: 'st_3', stepNumber: 3, action: 'Submit promotional assets to listing agent for 1-click review and approval.', role: 'Listing Agent', primaryRole: 'Listing Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Promotional collateral reviewed and approved by listing agent.', systemUsed: 'Approval Center' },
      { id: 'st_4', stepNumber: 4, action: 'Dispatch print orders to print vendor for same-day delivery.', role: 'Marketing Coordinator', primaryRole: 'Marketing Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Print orders dispatched to print vendor with delivery confirmation.', systemUsed: 'Coastal Print Works' },
      { id: 'st_5', stepNumber: 5, action: 'Launch targeted geo-fenced social advertising campaigns on Meta & Instagram.', role: 'Marketing Coordinator', primaryRole: 'Marketing Coordinator', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Targeted geo-fenced social advertising campaigns activated.', systemUsed: 'Meta Business Suite' }
    ],
    decisions: ['If luxury tier (> $1M), include custom embossed metallic foil property brochures.'],
    exceptions: ['Rush 24h turnarounds require direct coordinator notification.'],
    escalationPaths: ['Branding non-compliance escalates to Marketing Lead.'],
    completionEvidence: 'Dispatched flyer packages and published social campaign analytics.',
    expectedTiming: '24 hours from intake submission',
    systemsUsed: ['Nest Design Center (Maxa)', 'Shapework Marketing Engine', 'Meta Business Suite', 'Coastal Print Works'],
    reviewer: 'Marketing Lead',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Marketing Coordinator',
    createdBy: 'Marketing Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_sign_vendor_004': {
    id: 'sop_sign_vendor_004',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Sign Vendor Dispatch & Post Retrieval Protocol',
    purpose: 'Standardized protocol for ordering real estate yard post installations, directional arrows, custom rider panels, and post removals upon closing.',
    trigger: 'New active listing launch or closed transaction.',
    processOwner: 'Operations Lead',
    sopOwner: { type: 'department', name: 'Office and facilities' },
    category: 'Office and facilities',
    stateJurisdiction: 'NC',
    participants: ['Listing Agent', 'Operations Lead', 'Sign Vendor Specialist'],
    prerequisites: ['Listing Agreement Signed', 'Utility 811 Locate Cleared'],
    requiredInputs: ['Property Address', 'Sign Location Notes', 'Rider Selection (Coming Soon, Waterfront, Pool, Under Contract)'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Submit sign installation work order with property coordinates & 811 locate clearance.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Work order submitted with 811 locate clearance verified.', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_2', stepNumber: 2, action: 'Verify sign post installation photo proof within 24 to 48 business hours.', role: 'Operations Lead', primaryRole: 'Operations Lead', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Photo proof of post installation verified in sign inventory ledger.', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_3', stepNumber: 3, action: 'Attach rider panels (e.g. Coming Soon, Under Contract, Waterfront, Custom Agent Rider).', role: 'Listing Agent', primaryRole: 'Listing Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Appropriate rider panels attached to post.', systemUsed: 'Physical Inventory' },
      { id: 'st_4', stepNumber: 4, action: 'Issue automated sign removal dispatch immediately upon settlement recording.', role: 'Admin Coordinator', primaryRole: 'Admin Coordinator', durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' }, affirmationCheck: 'Removal dispatch issued upon settlement recording confirmation.', systemUsed: 'Sign Inventory Desk' }
    ],
    decisions: ['If HOA prohibits wooden posts, order approved metal frame A-board.'],
    exceptions: ['Damaged posts reported within 24h for free vendor replacement.'],
    escalationPaths: ['Vendor delays > 48h escalate to Operations Lead.'],
    completionEvidence: 'Installation photo verified in portal.',
    expectedTiming: '24 to 48 hours for installation; 24 hours for removal',
    systemsUsed: ['Sign Inventory Desk', 'Dotloop'],
    reviewer: 'Operations Lead',
    publisher: 'Operations Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_buyer_onboarding_005': {
    id: 'sop_buyer_onboarding_005',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Buyer Representation & Agency Onboarding Protocol',
    purpose: 'Onboarding prospective home buyers in compliance with North Carolina Real Estate Commission (NCREC) agency disclosure laws, Working With Real Estate Agents (WWREA), and Form 201.',
    trigger: 'First substantive contact with prospective real estate buyer.',
    processOwner: 'Brokerage Associate',
    sopOwner: { type: 'department', name: 'Agent Onboarding, Training, Support and Retention' },
    category: 'Agent Onboarding, Training, Support and Retention',
    stateJurisdiction: 'NC',
    participants: ['Buyer Agent', 'Prospective Buyer', 'Mortgage Lender', 'Broker-in-Charge'],
    prerequisites: ['Initial Phone or In-Person Consultation'],
    requiredInputs: ['Buyer Contact Info', 'Target Budget Bracket', 'Preferred Locations', 'Pre-Approval Letter'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Present and review NCREC Working with Real Estate Agents disclosure brochure at first substantive contact.', role: 'Buyer Agent', primaryRole: 'Buyer Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'NCREC WWREA disclosure presented and reviewed at first substantive contact.', systemUsed: 'NCREC Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Execute Exclusive Buyer Agency Agreement (NC Form 201) prior to writing any purchase offer.', role: 'Buyer Agent', primaryRole: 'Buyer Agent', durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' }, affirmationCheck: 'Exclusive Buyer Agency Agreement (NC Form 201) executed prior to offer drafting.', systemUsed: 'Dotloop' },
      { id: 'st_3', stepNumber: 3, action: 'Verify buyer pre-approval letter or proof of funds from a qualified mortgage lender.', role: 'Buyer Agent', primaryRole: 'Buyer Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Pre-approval letter or proof of funds verified from qualified lender.', systemUsed: 'Lender Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Establish client search criteria and activate NC Regional MLS & Rechat client portal.', role: 'Buyer Agent', primaryRole: 'Buyer Agent', durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' }, affirmationCheck: 'Client search criteria and portal activated in MLS and CRM.', systemUsed: 'Rechat CRM' }
    ],
    decisions: ['If buyer refuses agency agreement, offer non-exclusive unrepresented buyer disclosure.'],
    exceptions: ['Dual agency requires explicit Dual Agency Addendum signature.'],
    escalationPaths: ['Agency disclosure questions escalate to Broker-in-Charge.'],
    completionEvidence: 'Signed WWREA and Form 201 stored in Dotloop.',
    expectedTiming: 'Completed prior to first property showing or offer drafting',
    systemsUsed: ['NCREC Forms Portal', 'Dotloop', 'Rechat CRM', 'NC Regional MLS'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_social_media_blitz_006': {
    id: 'sop_social_media_blitz_006',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Social Media Reel & Story Campaign Blitz Protocol',
    purpose: 'Deploying multi-platform short-form video reels, 9:16 Instagram Stories, and high-impact carousel graphics with mandatory brokerage name identification per NCREC advertising rules.',
    trigger: 'Listing status changes to Active, Price Improvement, or Open House.',
    processOwner: 'Design Production Lead',
    category: 'Marketing',
    participants: ['Listing Agent', 'Virtual Assistant (Design Production)', 'Marketing Lead'],
    prerequisites: ['High-res photography assets', 'Active MLS status'],
    requiredInputs: ['Property Address', 'Key Selling Features', 'Listing Price', 'Open House Hours'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Ingest property specs and staging photography from asset vault.', role: 'Virtual Assistant', systemUsed: 'Cloud Storage' },
      { id: 'st_2', stepNumber: 2, action: 'Assemble 9:16 video reels and 3-slide story sequence in Maxa with prominent Nest Realty logo branding.', role: 'Design Production Lead', systemUsed: 'Nest Design Center (Maxa)' },
      { id: 'st_3', stepNumber: 3, action: 'Verify NCREC advertising compliance: All social posts must clearly display the firm name "Nest Realty Wilmington".', role: 'Marketing Lead', systemUsed: 'Compliance Checklist' },
      { id: 'st_4', stepNumber: 4, action: 'Publish across Nest Instagram, Facebook, and provide agent download link for personal channels.', role: 'Marketing Coordinator', systemUsed: 'Meta Business Suite' }
    ],
    decisions: ['If video footage is missing, generate Ken Burns animated stills from 300 DPI high-res photos.'],
    exceptions: ['Agent custom co-branding requires BIC approval.'],
    escalationPaths: ['Escalate social advertising compliance questions to Marketing Lead.'],
    completionEvidence: 'Published social links and agent asset download package.',
    expectedTiming: 'Within 4 to 8 hours of MLS activation',
    systemsUsed: ['Nest Design Center (Maxa)', 'Meta Business Suite', 'Cloud Storage'],
    reviewer: 'Marketing Lead',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Virtual Assistant',
    createdBy: 'Virtual Assistant',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_maxa_collateral_007': {
    id: 'sop_maxa_collateral_007',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Autonomous Maxa Collateral Production & 300 DPI Export Protocol',
    purpose: 'Generating press-ready 300 DPI print flyers, trifold luxury brochures, and digital flipbooks using Nest Realty brand guidelines in Maxa.',
    trigger: 'Intake task assigned to Virtual Assistant in Marketing Production Hub.',
    processOwner: 'Virtual Assistant (Design Production)',
    category: 'Marketing',
    participants: ['Virtual Assistant', 'Marketing Lead', 'Listing Agent'],
    prerequisites: ['Confirmed MLS data and photo uploads in asset vault'],
    requiredInputs: ['Property Address', 'Beds/Baths/SqFt', 'Headline Copy', 'Agent Headshot & Contact Info'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Open Nest Design Center (nest.maxadesigns.com) and select authorized Wilmington luxury template.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { id: 'st_2', stepNumber: 2, action: 'Populate property copy, specs, and agent headshot with automatic RGB to CMYK color profile conversion.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { id: 'st_3', stepNumber: 3, action: 'Export 300 DPI high-res PDF with 0.125-inch bleed margins for professional print.', role: 'Virtual Assistant', systemUsed: 'Maxa Engine' },
      { id: 'st_4', stepNumber: 4, action: 'Stage PDF in /Print_Ready folder and generate client proof link.', role: 'Virtual Assistant', systemUsed: 'Cloud Storage' }
    ],
    decisions: ['If listing price exceeds $1.5M, select matte soft-touch 16pt cardstock template.'],
    exceptions: ['Rush turnarounds under 6 hours require direct ping.'],
    escalationPaths: ['Production bottlenecks escalate to Marketing Lead.'],
    completionEvidence: '300 DPI PDF staged with download link.',
    expectedTiming: '2 to 4 hours from intake assignment',
    systemsUsed: ['Nest Design Center (nest.maxadesigns.com)', 'Cloud Storage', 'Coastal Print Works'],
    reviewer: 'Marketing Lead',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Virtual Assistant',
    createdBy: 'Virtual Assistant',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_proof_review_approval_008': {
    id: 'sop_proof_review_approval_008',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Proof Review, Revisions & Agent 1-Click Approval Protocol',
    purpose: 'Delivering design proofs to listing agents, capturing revision feedback, and securing 1-click approvals prior to vendor print dispatch.',
    trigger: 'Design collateral exported by Virtual Assistant.',
    processOwner: 'Marketing Lead',
    category: 'Marketing',
    participants: ['Listing Agent', 'Marketing Lead', 'Virtual Assistant'],
    prerequisites: ['Completed Maxa proof draft in staging link'],
    requiredInputs: ['Proof URL', 'Agent Email / Phone', 'Deadline for Print Submission'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Send automated SMS & Email notification to listing agent with interactive proof review link.', role: 'Marketing Lead', systemUsed: 'Shapework Marketing Hub' },
      { id: 'st_2', stepNumber: 2, action: 'Capture agent feedback or annotations directly in the review drawer.', role: 'Listing Agent', systemUsed: 'Review Drawer' },
      { id: 'st_3', stepNumber: 3, action: 'If revisions requested, route notes to Virtual Assistant with 2-hour SLA for revised proof.', role: 'Virtual Assistant', systemUsed: 'Maxa' },
      { id: 'st_4', stepNumber: 4, action: 'Upon agent 1-click approval, trigger automatic print vendor routing to Coastal Print Works.', role: 'Marketing Hub Engine', systemUsed: 'Automated Dispatch' }
    ],
    decisions: ['If agent does not respond within 24 hours, send follow-up reminder SMS.'],
    exceptions: ['Critical price change overrides pending proof with emergency update.'],
    escalationPaths: ['Unresponsive agents on rush listings escalate to Marketing Lead.'],
    completionEvidence: 'Time-stamped agent approval record and dispatched print receipt.',
    expectedTiming: 'Same day proof turnaround',
    systemsUsed: ['Shapework Marketing Hub', 'SMS Provider', 'Coastal Print Works'],
    reviewer: 'Marketing Lead',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Marketing Lead',
    createdBy: 'Marketing Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_field_media_staging_009': {
    id: 'sop_field_media_staging_009',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Professional Field Media Ingestion & Staging Protocol',
    purpose: 'Ingesting professional HDR photography, drone 4K video, floor plans, and MMS field drops into structured Google Drive vaults.',
    trigger: 'Photographer delivers media delivery link or field agent sends MMS to asknora@nestrealty.com.',
    processOwner: 'Design Production Lead',
    category: 'Marketing',
    participants: ['Field Photographer', 'Listing Agent', 'Virtual Assistant', 'Marketing Lead'],
    prerequisites: ['Scheduled photo shoot completed'],
    requiredInputs: ['Property Address', 'Photographer Delivery Link / Raw Image Attachments'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Scaffold property folder hierarchy: 01_HighRes_Print, 02_Web_MLS, 03_Drone_Video, 04_Floorplans.', role: 'Virtual Assistant', systemUsed: 'Cloud Storage' },
      { id: 'st_2', stepNumber: 2, action: 'Download high-res image package, rename files with address prefix, and resize web assets to under 15MB.', role: 'Virtual Assistant', systemUsed: 'Cloud Storage Engine' },
      { id: 'st_3', stepNumber: 3, action: 'Tag hero shot, primary kitchen, primary bedroom, and waterfront/marsh features.', role: 'Virtual Assistant', systemUsed: 'Metadata Engine' },
      { id: 'st_4', stepNumber: 4, action: 'Notify listing agent and marketing team with clean access link.', role: 'Virtual Assistant', systemUsed: 'Email / Slack' }
    ],
    decisions: ['If virtual twilight requested, stage twilight rendering in 01_HighRes_Print.'],
    exceptions: ['Corrupted files must be re-requested from vendor within 2 hours.'],
    escalationPaths: ['Photographer delivery delays escalate to Marketing Lead.'],
    completionEvidence: 'Verified property folder with organized subdirectories.',
    expectedTiming: '2 hours from photo receipt',
    systemsUsed: ['Cloud Storage', 'DropBox Ingest Engine', 'Rechat MLS'],
    reviewer: 'Marketing Lead',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Virtual Assistant',
    createdBy: 'Virtual Assistant',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_lockbox_placement_010': {
    id: 'sop_lockbox_placement_010',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Lockbox & Supra eKEY Placement and Access Protocol (SOP-OPS-003)',
    purpose: 'Standard operating procedure for checking out, programming, placing Bluetooth Supra iBox BT LE lockboxes on residential listings, and logging access history.',
    trigger: 'Executed listing agreement signed or lockbox assignment requested in Nest Ops.',
    processOwner: 'Operations Lead',
    category: 'Office and Facilities',
    participants: ['Listing Agent', 'Operations Lead', 'Showing Agents'],
    prerequisites: ['Listing Agreement Signed', 'Active Supra eKEY Subscription with Cape Fear REALTORS®'],
    requiredInputs: ['Property Address', 'Lockbox Serial Number', 'Shackle Code', 'Showing Instructions'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Check out Supra iBox BT LE lockbox from Wilmington office inventory and verify battery level > 80%.', role: 'Operations Lead', systemUsed: 'ShowingTime & Supra Inventory' },
      { id: 'st_2', stepNumber: 2, action: 'Program shackle code and assign property address in Supra eKEY mobile application.', role: 'Listing Agent', systemUsed: 'Supra eKEY App' },
      { id: 'st_3', stepNumber: 3, action: 'Attach lockbox securely to front door handle, gas meter, or approved railing location with spare house keys and deadbolt key.', role: 'Listing Agent', systemUsed: 'Physical Property' },
      { id: 'st_4', stepNumber: 4, action: 'Input lockbox serial number and showing instructions into ShowingTime and NC Regional MLS.', role: 'Transaction Coordinator', systemUsed: 'ShowingTime / MLS' },
      { id: 'st_5', stepNumber: 5, action: 'Upon settlement and closing, remove lockbox from property within 24 hours and check back into office inventory.', role: 'Listing Agent', systemUsed: 'Nest Inventory Registry' }
    ],
    decisions: ['If property is vacant and HOA allows, placing on front door handle is preferred. For occupied homes with gates, attach to side gas meter or railing.'],
    exceptions: ['If battery is depleted (<20%), swap immediately with fresh unit at Wilmington HQ.'],
    escalationPaths: ['Lost lockboxes or failed shackle codes escalate to Operations Lead.'],
    completionEvidence: 'Active lockbox serial logged in ShowingTime with confirmed test open.',
    expectedTiming: '24 hours prior to MLS activation',
    systemsUsed: ['Supra eKEY System', 'ShowingTime', 'NC Regional MLS', 'Nest Inventory Registry'],
    reviewer: 'Operations Lead',
    publisher: 'Operations Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_operating_agreement_011': {
    id: 'sop_operating_agreement_011',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Brokerage Operating Agreement & Compliance Review Protocol',
    purpose: 'Governing brokerage entity agreements, multi-owner equity terms, compliance review escalations, and high-value corporate operations.',
    trigger: 'Operating agreement updates, equity partner changes, or BIC compliance review triggers.',
    processOwner: 'Managing Principal / Broker-in-Charge',
    category: 'Owner / Leadership',
    participants: ['Broker-in-Charge', 'Legal Counsel', 'Brokerage Partners'],
    prerequisites: ['Draft corporate resolution or operating agreement amendment'],
    requiredInputs: ['Partner Entities', 'Capital Contribution', 'Voting Thresholds', 'Compliance Disclosures'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Review proposed operating agreement modifications against North Carolina Real Estate Commission firm licensing rules.', role: 'Broker-in-Charge', systemUsed: 'NCREC Compliance Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Submit draft operating agreement to corporate counsel for partnership law review.', role: 'Managing Partner', systemUsed: 'Legal Review Desk' },
      { id: 'st_3', stepNumber: 3, action: 'Execute signature package via certified e-signature with immutable audit trail.', role: 'Partners', systemUsed: 'Dotloop / DocuSign' },
      { id: 'st_4', stepNumber: 4, action: 'Archive executed operating agreement in secure brokerage corporate records vault.', role: 'Broker-in-Charge', systemUsed: 'Corporate Vault' }
    ],
    decisions: ['Material changes to firm ownership require filing updated Form REC 2.04 with NCREC within 10 days.'],
    exceptions: ['Emergency corporate actions require unanimous written consent of managing members.'],
    escalationPaths: ['All corporate governance escalations route directly to Managing Principal.'],
    completionEvidence: 'Executed agreement and timestamped NCREC firm record filing.',
    expectedTiming: '5 to 10 business days',
    systemsUsed: ['NCREC Firm Licensing Portal', 'Dotloop', 'Corporate Vault'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Managing Principal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Managing Principal',
    createdBy: 'Managing Principal',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_form_2t_review_012': {
    id: 'sop_form_2t_review_012',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Form 2-T Offer to Purchase & Contract Review, DD Fee & EMD Handling Protocol',
    purpose: 'Comprehensive protocol for reviewing NC REALTORS® Form 2-T Offer to Purchase contracts, checking essential provisions, calculating Due Diligence periods, and managing Earnest Money Deposits.',
    trigger: 'Submission or receipt of NC REALTORS® Form 2-T purchase offer.',
    processOwner: 'Broker-in-Charge',
    category: 'Transactions and Compliance',
    participants: ['Buyer Agent', 'Listing Agent', 'Broker-in-Charge', 'Closing Attorney'],
    prerequisites: ['Executed Form 2-T contract and standard addenda'],
    requiredInputs: ['Purchase Price', 'Due Diligence Fee Amount & Date', 'Initial EMD & Escrow Agent', 'Settlement Date', 'Property Description'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Inspect Paragraph 1: Verify full legal names of all buyers and sellers matching deed/tax records.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Inspect Paragraph 1(d): Verify Due Diligence Fee is delivered to Seller by Due Diligence delivery date with signed receipt.', role: 'Broker Agent', systemUsed: 'Trust Receipt' },
      { id: 'st_3', stepNumber: 3, action: 'Inspect Paragraph 1(d): Verify Initial Earnest Money Deposit is payable to Escrow Agent and deposited within 3 banking days of contract formation (NCREC Rule 58A .0106).', role: 'Broker-in-Charge', systemUsed: 'Trust Account Ledger' },
      { id: 'st_4', stepNumber: 4, action: 'Calculate Due Diligence Period expiration (5:00 PM on specified date) — time is of the essence.', role: 'Transaction Coordinator', systemUsed: 'Basecamp Calendar' },
      { id: 'st_5', stepNumber: 5, action: 'Ensure all required addenda (Lead-Based Paint, HOA Addendum 2A12-T, FHA/VA 2A4-T) are attached and signed.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' }
    ],
    decisions: ['If DD fee is not paid on time, seller may provide 1 business day written notice before terminating contract.'],
    exceptions: ['Personal checks for EMD must clear before closing disbursement.'],
    escalationPaths: ['Any disputed earnest money or due diligence fee release routes to Broker-in-Charge.'],
    completionEvidence: 'Signed contract, escrow receipt, and BIC compliance approval badge in Dotloop.',
    expectedTiming: 'Review completed within 24 hours of offer execution',
    systemsUsed: ['Dotloop', 'NCREC Portal', 'Basecamp Compliance Calendar'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_property_disclosures_013': {
    id: 'sop_property_disclosures_013',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Mandatory Property Disclosures Protocol (RPOADS, MOG, Lead-Based Paint)',
    purpose: 'Ensuring timely delivery and execution of the North Carolina Residential Property and Owners Association Disclosure Statement (RPOADS), Mineral and Oil and Gas Rights Mandatory Disclosure Statement (MOG), and Lead-Based Paint disclosures per NCGS § 47E.',
    trigger: 'Listing agreement execution or prior to buyer submitting offer on residential real property.',
    processOwner: 'Broker-in-Charge Compliance Desk',
    category: 'Transactions and Compliance',
    participants: ['Listing Broker', 'Seller', 'Buyer Broker', 'Buyer'],
    prerequisites: ['Residential property listing agreement'],
    requiredInputs: ['Property Address', 'Seller Disclosures', 'Year Built (to check pre-1978 lead paint)'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Furnish official NCREC RPOADS form to Seller to complete all 37 questions honestly without broker coaching.', role: 'Listing Broker', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Furnish official NCREC MOG disclosure form to Seller to disclose severed or leased subsurface mineral, oil, or gas rights.', role: 'Listing Broker', systemUsed: 'Dotloop' },
      { id: 'st_3', stepNumber: 3, action: 'If home was built prior to 1978, furnish Federal Lead-Based Paint Disclosure and EPA "Protect Your Family From Lead in Your Home" pamphlet.', role: 'Listing Broker', systemUsed: 'Dotloop' },
      { id: 'st_4', stepNumber: 4, action: 'Upload signed disclosure package to MLS as public attachment prior to first showing.', role: 'Listing Broker', systemUsed: 'NC Regional MLS' },
      { id: 'st_5', stepNumber: 5, action: 'Ensure Buyer signs receipt of disclosures prior to or simultaneously with submitting Form 2-T offer to prevent statutory 3-day right of rescission under NCGS § 47E-5.', role: 'Buyer Broker', systemUsed: 'Dotloop' }
    ],
    decisions: ['If disclosures are not delivered prior to offer acceptance, buyer has statutory right to cancel contract within 3 calendar days with full refund of all earnest money and due diligence fees.'],
    exceptions: ['Transfers pursuant to court order, foreclosure, estate administration, or new construction are exempt under NCGS § 47E-2.'],
    escalationPaths: ['Undisclosed material facts or disclosure disputes escalate immediately to Broker-in-Charge.'],
    completionEvidence: 'Signed RPOADS, MOG, and Lead Paint receipts in Dotloop loop.',
    expectedTiming: 'Completed prior to MLS activation',
    systemsUsed: ['Dotloop', 'NC Regional MLS', 'NCREC Disclosure Portal'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_broker_ce_renewal_014': {
    id: 'sop_broker_ce_renewal_014',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Broker Continuing Education (CE) & June 10 License Renewal Tracking Protocol',
    purpose: 'Tracking and auditing annual North Carolina Real Estate Commission (NCREC) continuing education credits, BICUP/GENUP requirements, and the June 10 CE deadline & June 30 license renewal deadline.',
    trigger: 'Annual NCREC licensing cycle (July 1 to June 30).',
    processOwner: 'Broker-in-Charge',
    category: 'Agent Onboarding, Training, Support and Retention',
    participants: ['All 77 Nest Brokers', 'Brokers-in-Charge', 'NCREC Education Provider'],
    prerequisites: ['Active NC Real Estate Broker License'],
    requiredInputs: ['Broker License Number', 'GENUP/BICUP Course Completion Certificate', 'Elective CE Course Certificate'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Audit broker CE records annually in January: verify 8 CE hours required (4 hours General Update GENUP or BICUP + 4 hours approved elective).', role: 'Operations / BIC', systemUsed: 'NCREC CE Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Send 90-day, 60-day, and 30-day reminders for the strict June 10 midnight CE completion deadline.', role: 'Operations Lead', systemUsed: 'Email / SMS' },
      { id: 'st_3', stepNumber: 3, action: 'Enforce June 30 online license renewal fee payment on ncrec.gov to avoid license expiration.', role: 'Broker-in-Charge', systemUsed: 'NCREC Portal' },
      { id: 'st_4', stepNumber: 4, action: 'If CE is missed by June 10, license automatically changes to Inactive status on July 1; broker is immediately suspended from brokerage transactions until reinstated.', role: 'Broker-in-Charge', systemUsed: 'Nest Compliance Sentinel' }
    ],
    decisions: ['Provisional Brokers (PB) must complete Postlicensing 301, 302, 303 within 18 months of initial licensure.'],
    exceptions: ['First-year brokers renewing for the first time are exempt from CE for their first renewal only.'],
    escalationPaths: ['Inactive license alerts escalate immediately to Broker-in-Charge.'],
    completionEvidence: 'Verified NCREC transcript showing 8 CE credits and renewed license status.',
    expectedTiming: 'CE completed by June 10; renewal fee paid by June 30',
    systemsUsed: ['ncrec.gov Licensing Portal', 'Nest Compliance Sentinel'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_commission_disbursement_015': {
    id: 'sop_commission_disbursement_015',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Commission Disbursement Authorization (CDA) & Accounting Protocol',
    purpose: 'Reviewing closing settlement statements (ALTA / Closing Disclosure), drafting Commission Disbursement Authorizations (CDA), and processing agent commission splits.',
    trigger: 'Settlement date scheduled or preliminary Closing Disclosure received from closing attorney.',
    processOwner: 'Finance Lead',
    category: 'Finance',
    participants: ['Closing Attorney', 'Listing/Selling Agent', 'Finance Lead', 'Broker-in-Charge'],
    prerequisites: ['Completed Dotloop transaction file with all compliance approvals'],
    requiredInputs: ['Final Sale Price', 'Gross Commission Percentage', 'Agent Split Tier', 'Brokerage Fee / E&O deduction'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Perform Dotloop closing audit: ensure all signatures, disclosures, and MLS change sheets are complete.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Calculate gross commission, brokerage split percentage, and firm technology fee.', role: 'Finance Lead', systemUsed: 'Accounting Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Draft Commission Disbursement Authorization (CDA) and send to Broker-in-Charge for approval.', role: 'Finance Lead', systemUsed: 'CDA Desk' },
      { id: 'st_4', stepNumber: 4, action: 'Deliver approved CDA to closing attorney for direct wire or check disbursement at settlement.', role: 'Finance Lead', systemUsed: 'Secure Email' },
      { id: 'st_5', stepNumber: 5, action: 'Log settlement funds in accounting ledger and disburse direct deposit commission to broker.', role: 'Finance Lead', systemUsed: 'Banking / Accounting' }
    ],
    decisions: ['If Dotloop loop is missing any required compliance document, hold CDA until compliant.'],
    exceptions: ['Earnest money held by Nest trust account must be credited against total commission on CDA.'],
    escalationPaths: ['Commission split questions escalate to Finance Lead or Broker-in-Charge.'],
    completionEvidence: 'Signed CDA and bank wire confirmation.',
    expectedTiming: '48 hours prior to scheduled closing',
    systemsUsed: ['Dotloop', 'CDA Desk', 'Coastal Settlement Law PC', 'Accounting Ledger'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Finance Lead',
    createdBy: 'Finance Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_recruiting_market_share_016': {
    id: 'sop_recruiting_market_share_016',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Competitive Market Share & Agent Recruiting Grounding Protocol',
    purpose: 'Standard operating framework for prospective agent recruiting, presenting Nest technology value proposition (Maxa, Rechat, Nora AI), and sharing market share analytics.',
    trigger: 'Recruiting consultation scheduled or agent inquiry received.',
    processOwner: 'Executive Leader',
    category: 'Owner / Leadership',
    participants: ['Executive Leader', 'Recruiting Lead', 'Candidate Agent'],
    prerequisites: ['Candidate agent MLS production history (12-month trailing volume)'],
    requiredInputs: ['Agent Name', 'Current Brokerage', 'Trailing 12-Month Volume', 'Target Production Goals'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Pull 12-month MLS market share report for Cape Fear region comparing Nest luxury list-to-sale metrics (98.6%).', role: 'Recruiting Lead', systemUsed: 'NC Regional MLS' },
      { id: 'st_2', stepNumber: 2, action: 'Demonstrate Nest tech ecosystem: Maxa 300 DPI design center, Rechat CRM, and Nora AI assistant.', role: 'Executive Leader', systemUsed: 'Tech Demo Sandbox' },
      { id: 'st_3', stepNumber: 3, action: 'Present customized commission split model and zero-desk-fee structure.', role: 'Executive Leader', systemUsed: 'Recruiting Pro Forma' },
      { id: 'st_4', stepNumber: 4, action: 'Issue ICA (Independent Contractor Agreement) and schedule onboarding with Operations.', role: 'Admin Coordinator', systemUsed: 'Dotloop' }
    ],
    decisions: ['If candidate is a high-volume team (> $20M), provide dedicated virtual assistant allocation.'],
    exceptions: ['Transferring active listings requires formal listing transfer agreement from previous firm.'],
    escalationPaths: ['All recruiting proposals route to Executive Leader.'],
    completionEvidence: 'Signed ICA and NCREC broker affiliation notice.',
    expectedTiming: '2 to 3 weeks recruitment pipeline',
    systemsUsed: ['NC Regional MLS', 'Rechat CRM', 'Nest Design Center', 'Dotloop'],
    reviewer: 'Executive Leader',
    publisher: 'Executive Leader',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Executive Leader',
    createdBy: 'Executive Leader',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_expense_reimbursement_017': {
    id: 'sop_expense_reimbursement_017',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Brokerage Expense Reimbursement & Vendor Invoicing Protocol',
    purpose: 'Auditing, authorizing, and executing agent expense reimbursements and external vendor invoice settlements in compliance with firm budget allocations.',
    trigger: 'Vendor invoice received or agent reimbursement form submitted with proof receipts.',
    processOwner: 'Finance Lead',
    category: 'Finance',
    participants: ['Finance Lead', 'Operations Lead', 'Submitting Broker'],
    prerequisites: ['Itemized receipts or vendor statement', 'Prior managerial authorization for expenditures > $250'],
    requiredInputs: ['Payee / Vendor Name', 'Expense Category', 'Property Address (if applicable)', 'Amount', 'Proof of Payment'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Review submitted itemized receipt or invoice for valid business purpose and tax line coding.', role: 'Finance Lead', systemUsed: 'Accounting Online' },
      { id: 'st_2', stepNumber: 2, action: 'Match expense against transaction ledger or approved marketing budget allocation.', role: 'Finance Lead', systemUsed: 'CDA / Expense Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Authorize payment and schedule automated ACH bank disbursement.', role: 'Finance Lead', systemUsed: 'Banking Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Issue digital payment receipt and update firm operational ledger.', role: 'Operations Lead', systemUsed: 'Accounting' }
    ],
    decisions: ['Expenses > $1,000 require secondary approval from Broker-in-Charge.'],
    exceptions: ['Closing gifts must strictly adhere to NCREC compliance guidelines (max $500 value).'],
    escalationPaths: ['Disputed expense claims route to Broker-in-Charge.'],
    completionEvidence: 'Bank transaction confirmation # and settled invoice in accounting.',
    expectedTiming: '2 to 3 business days for payment settlement',
    systemsUsed: ['Accounting Online', 'Bank ACH Gateway', 'Dotloop'],
    reviewer: 'Finance Lead',
    publisher: 'Finance Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Finance Lead',
    createdBy: 'Finance Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_broker_onboarding_018': {
    id: 'sop_broker_onboarding_018',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'New Broker Affiliation & Tech Onboarding Protocol',
    purpose: 'Standard onboarding workflow for newly affiliated brokers: licensing verification, tech setup (Rechat, Maxa, Dotloop, Nora AI), facilities access, and orientation.',
    trigger: 'Executed Independent Contractor Agreement (ICA) signed by new broker and BIC.',
    processOwner: 'Operations Lead',
    category: 'Agent Onboarding, Training, Support and Retention',
    participants: ['Broker-in-Charge', 'Operations Lead', 'Marketing Lead', 'New Broker'],
    prerequisites: ['Signed ICA', 'Active NCREC license verified in good standing', 'Signed WWREA acknowledgment'],
    requiredInputs: ['Broker Full Legal Name', 'NCREC License #', 'Direct Phone', 'Email Address', 'Headshot Photo', 'Emergency Contact'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'File NCREC Broker Affiliation Notice (Form REC 2.08) and verify active BIC supervisory status.', role: 'Broker-in-Charge', systemUsed: 'NCREC Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Provision Google Workspace email, Rechat CRM profile, Dotloop account, and Maxa Design Center credentials.', role: 'Operations Lead', systemUsed: 'Google Admin / Rechat' },
      { id: 'st_3', stepNumber: 3, action: 'Issue office security key fob, assign desk/conference access, and configure Supra eKEY privileges.', role: 'Operations Lead', systemUsed: 'Supra / Facilities' },
      { id: 'st_4', stepNumber: 4, action: 'Create initial branded digital business card, luxury social announcement flyer, and introduce to firm roster.', role: 'Marketing Lead', systemUsed: 'Shapework Marketing' },
      { id: 'st_5', stepNumber: 5, action: 'Conduct 60-minute Nest U Tech & Compliance Orientation with Operations Lead.', role: 'Operations Lead', systemUsed: 'Training' }
    ],
    decisions: ['Provisional Brokers (PB) must be paired with dedicated mentor and strict BIC contract pre-approval.'],
    exceptions: ['Dual-firm affiliations are prohibited per Nest Brokerage Policy.'],
    escalationPaths: ['Licensing issues or background flags escalate immediately to Broker-in-Charge.'],
    completionEvidence: 'Completed onboarding checklist, NCREC affiliation confirmation, active tech accounts.',
    expectedTiming: '5 business days from ICA execution to full launch',
    systemsUsed: ['NCREC Portal', 'Google Workspace', 'Rechat CRM', 'Dotloop', 'Maxa', 'Supra eKEY'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  },
  'sop_meta_sop_for_sops_000': {
    id: 'sop_meta_sop_for_sops_000',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'SOP Authoring, Governance & Lifecycle Protocol',
    purpose: 'Standardizing the lifecycle of standard operating procedures: approved abbreviations, canonical role definitions, pass/fail checklist affirmations, and dual-lane review governance.',
    trigger: 'New operational procedure identified, operational debt audited, or annual SOP review triggered.',
    processOwner: 'Operations Lead',
    sopOwner: { type: 'department', name: 'Operations & Governance' },
    category: 'Operations & Compliance',
    stateJurisdiction: 'NC',
    participants: ['Operations Lead', 'Broker-in-Charge', 'Managing Principal', 'Transaction Coordinator'],
    prerequisites: ['Operational workflow identified', 'Review lane determined (BIC vs Owner)'],
    requiredInputs: ['Procedure Name', 'Category', 'Target State Jurisdiction', 'Primary Role', 'Step Sequence'],
    orderedSteps: [
      {
        id: 'st_meta_1',
        stepNumber: 1,
        title: 'Validate Terminology Against Approved Abbreviations Registry',
        action: 'Cross-reference procedure text against approved abbreviations (BIC, PB, TC, EMD, DDF, CDA, WWREA, RPOADS, MOG, NCREC, SCREC, VAR) to prevent ambiguous nomenclature.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that all real estate and organizational abbreviations strictly comply with the approved SOP abbreviations registry.',
        systemUsed: 'Shapework Knowledge Library'
      },
      {
        id: 'st_meta_2',
        stepNumber: 2,
        title: 'Enforce Role Anonymity via Automated Role Guard',
        action: 'Execute Role Guard linter across all procedural steps, trigger descriptions, and escalation paths to ensure zero personal names are present.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that zero individual personal names exist and all assignees use canonical brokerage role titles.',
        systemUsed: 'Role Guard Linter'
      },
      {
        id: 'st_meta_3',
        stepNumber: 3,
        title: 'Author Pass/Fail Execution Affirmations for Verification Checklist',
        action: 'Write present-tense verification affirmations for each procedure step, confirming completed condition rather than copying procedural instructions.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Transaction Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Validated that every step has an affirmative pass/fail verification check distinct from procedural instructions.',
        systemUsed: 'SOP Studio'
      },
      {
        id: 'st_meta_4',
        stepNumber: 4,
        title: 'Publish to Drafts for Comment for Peer Review',
        action: 'Publish draft procedure to the Drafts for Comment review lane to solicit collaborative feedback and operational notes from staff.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '48h', customMinutes: 2880, rawDisplay: '48 hrs' },
        affirmationCheck: 'Confirmed that procedure draft is active in Drafts for Comment with notification dispatched to departmental stakeholders.',
        systemUsed: 'Knowledge Library'
      },
      {
        id: 'st_meta_5',
        stepNumber: 5,
        title: 'Route to Dual Review Lane (BIC vs Owner Review)',
        action: 'Route compliance, contract, and transaction SOPs to Awaiting BIC Review; route operations, finance, marketing, and systems SOPs to Awaiting Owner Review.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '24h', customMinutes: 1440, rawDisplay: '24 hrs' },
        affirmationCheck: 'Verified that formal review routing matches the categorical governance policy (BIC vs Owner lane).',
        systemUsed: 'Governance Routing Engine'
      },
      {
        id: 'st_meta_6',
        stepNumber: 6,
        title: 'Authorize Publication, Assign Activation Date & Issue Controlled Copy',
        action: 'Certifying reviewer executes digital approval, assigns version number and activation date, locking controlled copy with 14-day watermark protection.',
        role: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Managing Principal',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
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
    completionEvidence: 'SOP published to active Knowledge Library with activation date and certified reviewer signoff.',
    expectedTiming: '3 to 5 business days from draft initiation to official publication',
    systemsUsed: ['Shapework Knowledge Library', 'Role Guard Linter', 'SOP Studio'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_master_contract_review_031': {
    id: 'sop_master_contract_review_031',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Master Purchase Contract Review & Escrow Due Diligence Protocol',
    purpose: 'End-to-end audit protocol for reviewing executed purchase agreements, calculating state-specific contingency timelines, verifying statutory escrow deposit compliance, and initiating transaction intake.',
    trigger: 'Executed purchase offer and contract received from cooperating agent or client.',
    processOwner: 'Broker-in-Charge',
    sopOwner: { type: 'department', name: 'Transactions & Compliance' },
    category: 'Transactions and compliance',
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
    participants: ['Broker-in-Charge', 'Transaction Coordinator', 'Closing Attorney', 'Selling Agent'],
    prerequisites: ['Executed purchase agreement signed by all buyers and sellers', 'Initial escrow deposit check or wire receipt'],
    requiredInputs: ['Purchase Price', 'EMD Amount', 'Due Diligence / Inspection Expiration', 'Settlement Date', 'Closing Attorney'],
    orderedSteps: [
      {
        id: 'st_cr_1',
        stepNumber: 1,
        title: 'Audit Contract Execution & Legal Signatures',
        action: 'Verify that all buyers and sellers have signed and initialed every page of the purchase agreement and all attached addenda with matching legal names.',
        role: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Transaction Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that contract execution dates, seller/buyer signatures, and page initials are 100% complete.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_cr_2',
        stepNumber: 2,
        title: 'Verify Earnest Money Escrow Trust Deposit',
        action: 'Confirm that initial earnest money deposit is delivered to designated settlement attorney or broker escrow trust within the statutory banking deadline.',
        role: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed EMD deposited in statutory escrow trust account with written receipt verification on file.',
        systemUsed: 'Escrow Trust Ledger'
      },
      {
        id: 'st_cr_3',
        stepNumber: 3,
        title: 'Calculate State-Specific Contingency Calendar',
        action: 'Calculate due diligence expiration, inspection notice deadlines, financing contingency windows, and settlement dates based on governing state jurisdiction.',
        role: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that contingency milestone calendar is calculated and dispatched to client, agent, and closing attorney.',
        systemUsed: 'Timeline Calculator'
      },
      {
        id: 'st_cr_4',
        stepNumber: 4,
        title: 'Audit Mandatory State Regulatory Disclosures',
        action: 'Verify that all state-mandated property disclosures and agency brochures are fully executed without omission and uploaded to transaction file.',
        role: 'Transaction Coordinator',
        primaryRole: 'Transaction Coordinator',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' },
        affirmationCheck: 'Confirmed that all mandatory state disclosures are signed by all parties and uploaded to compliance repository.',
        systemUsed: 'Dotloop Compliance Desk'
      },
      {
        id: 'st_cr_5',
        stepNumber: 5,
        title: 'Issue Formal File Compliance Sign-off & Attorney Handoff',
        action: 'Broker-in-Charge reviews completed intake package, certifies regulatory compliance, and transmits introductory packet to closing attorney.',
        role: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
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
    completionEvidence: 'Signed contract audit checklist, verified escrow trust receipt, and attorney opening confirmation.',
    expectedTiming: 'Within 24 hours of binding contract acceptance',
    systemsUsed: ['Dotloop', 'Escrow Trust Ledger', 'Timeline Calculator'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Broker-in-Charge',
    createdBy: 'Broker-in-Charge',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 2
  },
  'sop_owner_escalation_rights_001': {
    id: 'sop_owner_escalation_rights_001',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Owner Decision & Escalation Rights Matrix',
    purpose: 'Establishing clear authority limits, spending thresholds, litigation escalation, and partnership governance between Managing Principals and operational leads.',
    trigger: 'Operational variance, budget expenditure request, partnership matter, or high-risk dispute identified.',
    processOwner: 'Managing Principal',
    sopOwner: { type: 'department', name: 'Executive Leadership' },
    category: 'Owner / leadership',
    stateJurisdiction: 'NC',
    participants: ['Managing Principal', 'Broker-in-Charge', 'Operations Lead', 'Finance Lead'],
    prerequisites: ['Matter classification identified', 'Current budget status reviewed'],
    requiredInputs: ['Variance Description', 'Financial Impact', 'Urgency Level', 'Proposed Resolution'],
    orderedSteps: [
      {
        id: 'st_own_1',
        stepNumber: 1,
        title: 'Assess Operational vs Executive Governance Scope',
        action: 'Determine whether inquiry falls within routine departmental operations or triggers executive threshold.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that matter scope was formally evaluated against the executive authority matrix.',
        systemUsed: 'Governance Matrix'
      },
      {
        id: 'st_own_2',
        stepNumber: 2,
        title: 'Enforce Financial Discretionary Expenditure Thresholds',
        action: 'Flag any unbudgeted capital expense or single-invoice purchase exceeding $2,500 for mandatory Managing Principal review and sign-off.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        secondaryRole: 'Managing Principal',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that all expenditures over $2,500 have explicit digital approval from Managing Principal before release.',
        systemUsed: 'Bill Pay Desk'
      },
      {
        id: 'st_own_3',
        stepNumber: 3,
        title: 'Triage Agent Commission Split & Recruiting Concessions',
        action: 'Review non-standard commission plan variations or recruiting incentive requests with Managing Principal.',
        role: 'Managing Principal',
        primaryRole: 'Managing Principal',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed that commission split exceptions are documented in written addenda signed by Managing Principal.',
        systemUsed: 'Roster Management'
      },
      {
        id: 'st_own_4',
        stepNumber: 4,
        title: 'Escalate Regulatory Inquiries & Threat of Litigation',
        action: 'Notify Managing Principal and Broker-in-Charge immediately within 2 hours of any formal commission audit or attorney demand letter.',
        role: 'Broker-in-Charge',
        primaryRole: 'Broker-in-Charge',
        secondaryRole: 'Managing Principal',
        durationPolicy: { preset: '2h', customMinutes: 120, rawDisplay: '2 hrs' },
        affirmationCheck: 'Verified that regulatory notices and legal demands are dispatched to executive leadership within statutory 2-hour window.',
        systemUsed: 'Executive Escalation Channel'
      },
      {
        id: 'st_own_5',
        stepNumber: 5,
        title: 'Log Executive Resolution in Governance Record',
        action: 'Record final executive determination, budget variance authorization, or legal response in the permanent governance archive.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that executive resolution is archived with timestamped justification and stakeholder notification.',
        systemUsed: 'Governance Repository'
      }
    ],
    decisions: [
      'Expenditures under $2,500 within approved quarterly budget may be authorized by Operations Lead or Finance Lead.',
      'Any settlement offer or legal agreement requires unanimous consent of Managing Principal and Broker-in-Charge.'
    ],
    exceptions: ['Emergency office repairs compromising safety or property security may be initiated immediately up to $5,000.'],
    escalationPaths: ['Direct phone escalation to Managing Principal for catastrophic events or media inquiries.'],
    completionEvidence: 'Signed authorization record, executive log entry, or legal response file.',
    expectedTiming: '24 hours for standard variances; 2 hours for urgent legal matters',
    systemsUsed: ['Governance Matrix', 'Bill Pay Desk', 'Executive Escalation Channel'],
    reviewer: 'Managing Principal',
    publisher: 'Managing Principal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_agent_support_routing_002': {
    id: 'sop_agent_support_routing_002',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Agent Question Triage & Support Desk',
    purpose: 'Standardized routing workflow for agent operational, marketing, and compliance questions between self-service AI, staff coordinators, and BIC.',
    trigger: 'Inbound broker inquiry submitted via support desk, chat channel, or office reception.',
    processOwner: 'Operations Lead',
    sopOwner: { type: 'department', name: 'Agent Services' },
    category: 'Agent Onboarding, Training, Support and Retention',
    stateJurisdiction: 'NC',
    participants: ['Operations Lead', 'Broker-in-Charge', 'Marketing Lead', 'Finance Lead', 'Admin Coordinator'],
    prerequisites: ['Support ticket or inquiry intake recorded'],
    requiredInputs: ['Agent Name', 'Inquiry Category', 'Urgency Level', 'Property / File Link'],
    orderedSteps: [
      {
        id: 'st_sup_1',
        stepNumber: 1,
        title: 'Ingest Inbound Agent Inquiry via Support Desk',
        action: 'Log incoming agent question into support desk and classify by category: Transactions/Compliance, Marketing, Finance/CDA, Tools/Tech, or Office Facilities.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that ticket is logged with category classification and initial response target assigned.',
        systemUsed: 'Support Desk'
      },
      {
        id: 'st_sup_2',
        stepNumber: 2,
        title: 'Route Compliance & Legal Questions to Compliance Desk',
        action: 'Route contract interpretation, disclosure questions, earnest money disputes, and license questions directly to Broker-in-Charge.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that all compliance-related questions are immediately routed to Broker-in-Charge queue.',
        systemUsed: 'Compliance Desk'
      },
      {
        id: 'st_sup_3',
        stepNumber: 3,
        title: 'Route Marketing Collateral & Listing Launch Requests to Marketing Lead',
        action: 'Direct requests for property brochures, social media blitzes, open house flyers, and custom brand graphics to Marketing Lead.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Marketing Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that marketing requests are routed to Marketing Lead with listing agreement verified.',
        systemUsed: 'Marketing Intake'
      },
      {
        id: 'st_sup_4',
        stepNumber: 4,
        title: 'Route Commission & Disbursement Inquiries to Finance Lead',
        action: 'Forward CDA requests, commission ledger verifications, and 1099 tax inquiries to Finance Lead.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Finance Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that commission and payment inquiries are routed to Finance Lead with closing statement attached.',
        systemUsed: 'Finance Desk'
      },
      {
        id: 'st_sup_5',
        stepNumber: 5,
        title: 'Resolve Routine Administrative & Tool Inquiries',
        action: 'Address lockbox checkouts, key access, Dotloop invitations, Google Workspace passwords, and conference room reservations.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that routine administrative inquiry is resolved and ticket closed with resolution notes.',
        systemUsed: 'Help Desk'
      }
    ],
    decisions: [
      'If inquiry is an active contract deadline emergency, page Broker-in-Charge directly via phone.',
      'If question has a standard documented answer in Knowledge Library, provide deep link to governing SOP.'
    ],
    exceptions: ['After-hours urgent compliance matters route to designated on-call Broker-in-Charge cell.'],
    escalationPaths: ['Unresolved tickets pending over 4 hours escalate to Operations Lead for immediate intervention.'],
    completionEvidence: 'Closed support ticket with verified agent confirmation and satisfaction rating.',
    expectedTiming: 'First response within 30 minutes; full resolution within 4 business hours',
    systemsUsed: ['Support Desk', 'Compliance Desk', 'Marketing Intake', 'Finance Desk'],
    reviewer: 'Operations Lead',
    publisher: 'Broker-in-Charge',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_gospel_cash_cadence_040': {
    id: 'sop_gospel_cash_cadence_040',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'The Gospel Cash Sheet Update & Review Cadence',
    purpose: 'Maintaining and reconciling the brokerage master cash flow forecasting model (The Gospel) on a rigorous 48-hour cadence and upon every contract milestone.',
    trigger: '48-hour scheduled cadence, new contract accepted, or closing settlement completed.',
    processOwner: 'Finance Lead',
    sopOwner: { type: 'department', name: 'Finance' },
    category: 'Finance',
    stateJurisdiction: 'NC',
    participants: ['Finance Lead', 'Managing Principal', 'Transaction Coordinator'],
    prerequisites: ['Bank operating balance feed', 'Active pending transaction ledger'],
    requiredInputs: ['Operating Account Cash Balance', 'Pending Closings List', 'Accounts Payable Schedule', 'Projected Commission Splits'],
    orderedSteps: [
      {
        id: 'st_gosp_1',
        stepNumber: 1,
        title: 'Ingest New Executed Contracts into The Gospel Pipeline',
        action: 'Extract ratified purchase contracts from Dotloop and populate purchase price, closing date, company dollar, and agent split into master cash sheet.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that all newly ratified contracts are entered into The Gospel with company dollar calculated.',
        systemUsed: 'The Gospel / Dotloop'
      },
      {
        id: 'st_gosp_2',
        stepNumber: 2,
        title: 'Update Settlement Dates & Projected Commission Inflows',
        action: 'Review pending closing schedule with Transaction Coordinator to capture any delayed settlement dates or closing credits.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        secondaryRole: 'Transaction Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that closing calendar dates in The Gospel match attorney settlement schedules exactly.',
        systemUsed: 'The Gospel'
      },
      {
        id: 'st_gosp_3',
        stepNumber: 3,
        title: 'Reconcile Operating Bank Account Balances Against Weekly Projections',
        action: 'Log actual bank operating balance, cross-checking cleared checks, payroll drafts, and recurring subscription debits.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' },
        affirmationCheck: 'Confirmed bank operating balance reconciled to the penny against projected cash disbursements.',
        systemUsed: 'Online Banking / Ledger'
      },
      {
        id: 'st_gosp_4',
        stepNumber: 4,
        title: 'Review 30-60-90 Day Cash Runway & Anticipated Tax Liabilities',
        action: 'Calculate rolling 30, 60, and 90-day cash projections factoring in estimated quarterly tax payments, franchise fees, and lease obligations.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        secondaryRole: 'Managing Principal',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Validated that rolling cash runway projections are current with tax and lease liabilities accounted for.',
        systemUsed: 'The Gospel'
      },
      {
        id: 'st_gosp_5',
        stepNumber: 5,
        title: 'Issue Executive Cash Summary to Leadership',
        action: 'Publish concise bi-weekly cash summary report to Managing Principal highlighting runway, upcoming revenue peaks, and liquidity.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed executive cash summary delivered to Managing Principal with runway indicators verified.',
        systemUsed: 'Executive Reporting'
      }
    ],
    decisions: [
      'If 30-day projected operating cash falls below 60 days of fixed overhead, schedule emergency budget review with Managing Principal.',
      'If closing date extends past month-end, roll projected commission receipt to subsequent month forecast.'
    ],
    exceptions: ['Major unexpected capital expenses require real-time model re-forecasting prior to expenditure commitment.'],
    escalationPaths: ['Cash variance exceeding 10% from projection escalates to Managing Principal within 24 hours.'],
    completionEvidence: 'Reconciled master Gospel sheet, verified bank statement balance, and executive summary dispatch.',
    expectedTiming: 'Updated every 48 hours; full reconciliation completed every Monday and Friday morning',
    systemsUsed: ['The Gospel Spreadsheet', 'Online Banking Ledger', 'Dotloop Pipeline'],
    reviewer: 'Managing Principal',
    publisher: 'Managing Principal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Finance Lead',
    createdBy: 'Finance Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 2
  },
  'sop_payroll_processing_045': {
    id: 'sop_payroll_processing_045',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Staff Payroll Processing & Direct Deposit Protocol',
    purpose: 'End-to-end bi-weekly payroll calculation, salary and hourly timesheet audit, W-2 tax withholding verification, and direct deposit funding.',
    trigger: 'Bi-weekly payroll cycle due date (3 business days prior to payroll deposit date).',
    processOwner: 'Finance Lead',
    sopOwner: { type: 'department', name: 'Finance' },
    category: 'Finance',
    stateJurisdiction: 'NC',
    participants: ['Finance Lead', 'Managing Principal', 'Operations Lead'],
    prerequisites: ['Approved staff timesheets', 'Operating bank account funding confirmation'],
    requiredInputs: ['Hourly Timesheets', 'Salaried Staff Roster', 'Bonus / Commission Authorizations', 'Benefit Deductions'],
    orderedSteps: [
      {
        id: 'st_pay_1',
        stepNumber: 1,
        title: 'Collect & Audit Bi-Weekly Hourly Timesheets and Overtime Logs',
        action: 'Review all hourly employee timesheets for approved supervisor sign-offs, verified lunch breaks, and overtime hours.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' },
        affirmationCheck: 'Confirmed that all timesheets have supervisor approvals and overtime hours verified.',
        systemUsed: 'Time & Attendance System'
      },
      {
        id: 'st_pay_2',
        stepNumber: 2,
        title: 'Calculate Net Pay, W-2 Withholdings, and Benefit Deductions in Payroll Engine',
        action: 'Enter audited hours into payroll system, verify federal and NC state withholding tax tables, and confirm health benefit deductions.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Verified that net pay calculations, W-2 tax withholdings, and benefit deductions match statutory rates.',
        systemUsed: 'Payroll Engine'
      },
      {
        id: 'st_pay_3',
        stepNumber: 3,
        title: 'Conduct Pre-Funding Payroll Audit for Salary Changes or Bonuses',
        action: 'Generate preview payroll register report and audit line-by-line against previous pay cycle to catch any unintended variances.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Audited pre-funding payroll register report line-by-line against previous cycle with zero discrepancies.',
        systemUsed: 'Payroll Engine'
      },
      {
        id: 'st_pay_4',
        stepNumber: 4,
        title: 'Obtain Executive Authorization & Funding Approval from Managing Principal',
        action: 'Submit draft payroll register to Managing Principal for formal authorization prior to initiating bank funding wire.',
        role: 'Managing Principal',
        primaryRole: 'Managing Principal',
        secondaryRole: 'Finance Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed Managing Principal written authorization received for total payroll funding amount.',
        systemUsed: 'Executive Approvals Desk'
      },
      {
        id: 'st_pay_5',
        stepNumber: 5,
        title: 'Initiate Direct Deposit ACH Transfer 48 Hours Prior to Pay Date',
        action: 'Execute ACH direct deposit batch transmission in payroll portal before the 5:00 PM banking cut-off 2 banking days before pay date.',
        role: 'Finance Lead',
        primaryRole: 'Finance Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed direct deposit ACH batch transmitted and accepted by banking network before cut-off time.',
        systemUsed: 'Payroll Portal / ACH Network'
      }
    ],
    decisions: [
      'If timesheet has unapproved hours at payroll cut-off, contact department lead immediately; pay based on standard scheduled hours pending cure.',
      'Any off-cycle bonus or salary adjustment must have written Managing Principal authorization.'
    ],
    exceptions: ['Banking holiday falling on pay date requires direct deposit submission 1 business day earlier.'],
    escalationPaths: ['ACH funding failure or bank rejection escalates immediately to Managing Principal and banking representative.'],
    completionEvidence: 'Accepted ACH direct deposit confirmation report and payroll journal voucher.',
    expectedTiming: 'Completed every other Tuesday by 3:00 PM EST for Friday pay date',
    systemsUsed: ['Time & Attendance Portal', 'Payroll Processing Engine', 'ACH Bank Clearing'],
    reviewer: 'Managing Principal',
    publisher: 'Managing Principal',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Finance Lead',
    createdBy: 'Finance Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_sign_lockbox_readiness_047': {
    id: 'sop_sign_lockbox_readiness_047',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Sign, Lockbox, and Field Inventory Readiness Protocol',
    purpose: 'Standardized audit, maintenance, and checkout workflow for yard sign posts, brochure boxes, Bluetooth Supra lockboxes, and rider inventory.',
    trigger: 'Sign or lockbox returned from closed listing, field inventory reorder point reached, or new listing dispatch requested.',
    processOwner: 'Admin Coordinator',
    sopOwner: { type: 'department', name: 'Office Operations' },
    category: 'Office and facilities',
    stateJurisdiction: 'NC',
    participants: ['Admin Coordinator', 'Field Operator', 'Listing Agent'],
    prerequisites: ['Returned field equipment logged into depot'],
    requiredInputs: ['Property Address', 'Equipment Type', 'Lockbox Serial #', 'Shackle Code', 'Condition Status'],
    orderedSteps: [
      {
        id: 'st_inv_1',
        stepNumber: 1,
        title: 'Ingest Returned Signs and Lockboxes into Field Inventory Desk',
        action: 'Log serial numbers of returned Supra lockboxes and physical condition of yard sign posts upon return from property.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that returned hardware serial numbers and post conditions are logged in inventory tracker.',
        systemUsed: 'Field Inventory Desk'
      },
      {
        id: 'st_inv_2',
        stepNumber: 2,
        title: 'Clean & Inspect Sign Hardware, Posts, and Brochure Boxes',
        action: 'Wipe down signs, clean brochure boxes, inspect wooden/metal posts for weather damage, and repaint or discard compromised units.',
        role: 'Field Operator',
        primaryRole: 'Field Operator',
        secondaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that all yard sign posts are cleaned, inspected for structural integrity, and stored in ready racks.',
        systemUsed: 'Depot Maintenance'
      },
      {
        id: 'st_inv_3',
        stepNumber: 3,
        title: 'Reset Supra Bluetooth Lockbox Shackle & Verify Battery Life',
        action: 'Test Bluetooth connectivity via Supra eKEY app, verify battery voltage is above 80%, and verify shackle release with master code.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed Supra lockbox shackle operation verified and battery level tested above 80%.',
        systemUsed: 'Supra eKEY App'
      },
      {
        id: 'st_inv_4',
        stepNumber: 4,
        title: 'Maintain Safe Buffer of Directional and Status Riders',
        action: 'Audit stock of Under Contract, Coming Soon, Just Listed, Open House, and Pool/Waterfront riders; reorder when buffer drops below 5 units.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that all rider types meet minimum 5-unit buffer threshold or reorders placed with sign vendor.',
        systemUsed: 'Sign Inventory Desk'
      },
      {
        id: 'st_inv_5',
        stepNumber: 5,
        title: 'Dispatch Field Equipment for Active Listing Launches',
        action: 'Package clean yard post, verified lockbox, and selected riders for field installer or listing agent checkout with property tag attached.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed equipment package checked out to listing property address in field inventory management system.',
        systemUsed: 'Field Inventory Desk'
      }
    ],
    decisions: [
      'If lockbox battery is below 80% or fails Bluetooth connection test, take lockbox out of service and replace battery.',
      'If yard post is cracked or warped, retire post immediately to maintain luxury brand presentation standard.'
    ],
    exceptions: ['Emergency same-day sign placements may be picked up directly by listing agent from depot staging area.'],
    escalationPaths: ['Lockbox serial number mismatch or stolen lockbox escalates to Operations Lead and local Board of REALTORS®.'],
    completionEvidence: 'Completed field checkout ticket, verified Supra test log, and ready-rack inventory count.',
    expectedTiming: 'Returned equipment processed within 24 hours of retrieval',
    systemsUsed: ['Field Inventory Desk', 'Supra eKEY App', 'Sign Depot Log'],
    reviewer: 'Operations Lead',
    publisher: 'Operations Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Admin Coordinator',
    createdBy: 'Admin Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  }
,
  'sop_new_agent_onboarding_008': {
    id: 'sop_new_agent_onboarding_008',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'New Agent Onboarding',
    purpose: 'End-to-end operational roadmap for onboarding new real estate brokers into Nest Realty, from ICA execution and NCREC license transfer to tech stack provisioning, headshots, bio publication, welcome kit presentation, and 30-day mentorship check-ins.',
    trigger: 'Prospective broker executes Independent Contractor Affiliation Agreement.',
    processOwner: 'Operations Lead',
    sopOwner: { type: 'department', name: 'Agent Services & Operations' },
    category: 'Agent Onboarding, Training, Support and Retention',
    stateJurisdiction: 'NC',
    participants: ['Operations Lead', 'Admin Coordinator', 'Marketing Lead', 'Broker-in-Charge', 'Managing Principal', 'New Broker'],
    prerequisites: ['Active NC Real Estate Broker License or approved provisional application', 'Signed Independent Contractor Agreement'],
    requiredInputs: ['Broker Legal Name', 'NCREC License Number', 'Preferred Email Alias', 'Mobile Phone', 'Designated Mentor'],
    orderedSteps: [
      {
        id: 'st_onb_1',
        stepNumber: 1,
        title: 'Independent Contractor Agreement & W-9 Intake',
        action: 'Audit executed Independent Contractor Agreement (ICA), Brokerage Policy manual sign-off, and IRS Form W-9 in Dotloop compliance folder.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that executed Independent Contractor Agreement, policy manual sign-off, and Form W-9 are filed in broker records.',
        systemUsed: 'Dotloop'
      },
      {
        id: 'st_onb_2',
        stepNumber: 2,
        title: 'NCREC License Affiliation & Board Membership Verification',
        action: 'Submit online BIC broker affiliation transfer on ncrec.gov and confirm active member roster entry with Cape Fear REALTORS® (CFR) and NC Regional MLS.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Verified that NCREC license transfer is processed under Nest firm license and MLS board membership is confirmed active.',
        systemUsed: 'ncrec.gov / MLS Desk'
      },
      {
        id: 'st_onb_3',
        stepNumber: 3,
        title: 'Enterprise Tech Stack & Platform Provisioning',
        action: 'Provision Google Workspace corporate account (@nestrealty.com), Dotloop member profile, Rechat CRM seat, and ShowingTime credentials per SOP-09.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed that Nest Google Workspace, Dotloop, Rechat, and ShowingTime accounts are provisioned and broker login is verified.',
        systemUsed: 'Google Workspace / Rechat'
      },
      {
        id: 'st_onb_4',
        stepNumber: 4,
        title: 'Professional Headshot & Website Bio Publication',
        action: 'Collect high-resolution headshot file (or schedule preferred photographer session), edit professional agent biography, and publish profile to public Nest website directory.',
        role: 'Marketing Lead',
        primaryRole: 'Marketing Lead',
        durationPolicy: { preset: '45m', customMinutes: 45, rawDisplay: '45 mins' },
        affirmationCheck: 'Verified that approved professional headshot and standardized biography are published to Nest Realty agent directory.',
        systemUsed: 'Nest Roster Manager'
      },
      {
        id: 'st_onb_5',
        stepNumber: 5,
        title: 'Custom Signage & Name Rider Order Dispatch',
        action: 'Place work order with approved signage vendor for official Nest yard panels, custom agent name riders, and directional arrows per SOP-11/18.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that yard signage and personalized name riders are ordered with vendor tracking number logged.',
        systemUsed: 'Sign Inventory Desk'
      },
      {
        id: 'st_onb_6',
        stepNumber: 6,
        title: 'Welcome Kit Presentation & Facility Key Fob Issuance',
        action: 'Assemble branded Nest welcome kit, program 24/7 key fob building access, and assign dedicated desk or collaborative flex workspace per SOP-12.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that Nest branded welcome kit is delivered and facility electronic key fob access is tested.',
        systemUsed: 'Facility Access Controller'
      },
      {
        id: 'st_onb_7',
        stepNumber: 7,
        title: 'Public Brokerage Welcome Announcement Campaign',
        action: 'Design and publish "Welcome to Nest" spotlight announcement across social media channels, internal community, and local market newsletter.',
        role: 'Marketing Lead',
        primaryRole: 'Marketing Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that new agent social media announcement tiles and newsletter spotlight are dispatched.',
        systemUsed: 'Meta Business Suite'
      },
      {
        id: 'st_onb_8',
        stepNumber: 8,
        title: '30-Day Mentorship Roadmap & Leadership Check-In',
        action: 'Schedule 7-day, 14-day, and 30-day coaching check-ins with Managing Principal and connect new broker with assigned peer mentor.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Managing Principal',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that 30-day onboarding milestones and peer mentorship meetings are scheduled on calendar.',
        systemUsed: 'Google Calendar'
      }
    ],
    decisions: [
      'If broker is a Provisional Broker (PB), assign dedicated supervising mentor and register for Postlicensing tracking.',
      'If broker transfers from another brokerage with active listings, coordinate formal listing transfer addenda with BIC.'
    ],
    exceptions: ['Experienced top producers may opt for accelerated tech setup and customized marketing collateral package.'],
    escalationPaths: ['Licensing delays or background discrepancies escalate immediately to Broker-in-Charge.'],
    completionEvidence: 'Fully executed ICA, active NCREC affiliation, live website profile, issued key fob, and scheduled 30-day check-in.',
    expectedTiming: 'Complete onboarding sequence within 5 business days of contract execution',
    systemsUsed: ['Dotloop', 'ncrec.gov', 'Google Workspace', 'Rechat CRM', 'Nest Roster Manager'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Operations Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Operations Lead',
    createdBy: 'Operations Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_agent_signage_accountability_011': {
    id: 'sop_agent_signage_accountability_011',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Agent Signage, Rider & Field Equipment Accountability Protocol',
    purpose: 'Comprehensive governance unifying new agent yard signage and name rider procurement (SOP-11) with ongoing field placement compliance, electronic lockbox accountability, and departure recovery standards (SOP-18).',
    trigger: 'New broker onboarding, new custom rider request, property listing launch, or quarterly equipment audit.',
    processOwner: 'Admin Coordinator',
    sopOwner: { type: 'department', name: 'Office Operations' },
    category: 'Agent Onboarding, Training, Support and Retention',
    stateJurisdiction: 'NC',
    participants: ['Admin Coordinator', 'Operations Lead', 'Listing Agent', 'Field Operator', 'Finance Lead'],
    prerequisites: ['Active agent affiliation', 'Verified NCREC license number'],
    requiredInputs: ['Broker Name', 'Mobile Phone', 'Rider Quantity', 'Lockbox Serial Numbers', 'Property Address'],
    orderedSteps: [
      {
        id: 'st_sgn_1',
        stepNumber: 1,
        title: 'Signage & Rider Specification Compliance Audit',
        action: 'Audit agent name spelling, license status, and phone format against NCREC advertising rules and Nest Brand Standards before dispatching print orders.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that sign rider typography, agent name spelling, and phone number comply with NCREC advertising mandates and brand standards.',
        systemUsed: 'Sign Procurement Desk'
      },
      {
        id: 'st_sgn_2',
        stepNumber: 2,
        title: 'Field Hardware Allocation & Serial Ledger Check-Out',
        action: 'Assign official Nest yard posts, generic riders (Coming Soon, Under Contract), and Bluetooth Supra lockboxes; record serial numbers and shackle codes in master asset ledger.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that Supra lockbox serials, shackle codes, and sign post counts are recorded in the master asset registry.',
        systemUsed: 'Master Inventory Sheet'
      },
      {
        id: 'st_sgn_3',
        stepNumber: 3,
        title: 'Field Placement & Municipal Code Compliance',
        action: 'Enforce installation of yard and directional signs strictly within private property boundaries and in full compliance with municipal right-of-way regulations and HOA bylaws.',
        role: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Field Operator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that signage is installed in accordance with local municipal right-of-way rules and private property easements.',
        systemUsed: 'Supra eKEY / City Guidelines'
      },
      {
        id: 'st_sgn_4',
        stepNumber: 4,
        title: 'Quarterly Equipment Condition Audit & 48h Remediation Nudges',
        action: 'Conduct periodic physical and digital audits of field signs; issue 48-hour correction notices to brokers for faded panels, damaged posts, or unauthorized unbranded riders.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that field equipment condition is audited and 48-hour remediation notifications are issued for non-compliant signs.',
        systemUsed: 'Audit Tracker'
      },
      {
        id: 'st_sgn_5',
        stepNumber: 5,
        title: 'Post-Closing Equipment Retrieval & Buffer Restock',
        action: 'Ensure all yard posts, name riders, and Supra lockboxes are removed from sold properties within 48 hours of deed recordation and returned to inventory buffer.',
        role: 'Listing Agent',
        primaryRole: 'Listing Agent',
        secondaryRole: 'Field Operator',
        durationPolicy: { preset: '1h', customMinutes: 60, rawDisplay: '1 hr' },
        affirmationCheck: 'Confirmed that all field equipment is retrieved and checked back into office storage within 48 hours of closing.',
        systemUsed: 'Dotloop / Inventory Desk'
      },
      {
        id: 'st_sgn_6',
        stepNumber: 6,
        title: 'Agent Departure Reconciliation & Hardware Recovery',
        action: 'Upon broker separation or license transfer, reconcile master asset ledger; enforce mandatory return of all brokerage sign posts, riders, and lockboxes within 5 business days or assess replacement charge against final commission.',
        role: 'Operations Lead',
        primaryRole: 'Operations Lead',
        secondaryRole: 'Finance Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that all assigned brokerage field equipment is recovered and inspected or replacement balance is reconciled on final CDA.',
        systemUsed: 'Asset Ledger / CDA Desk'
      }
    ],
    decisions: [
      'If directional signs are placed in municipal right-of-way and confiscated, broker is responsible for retrieval fees or replacement costs.',
      'If Supra lockbox is not returned within 5 business days of departure, assess standard replacement fee on agent settlement ledger.'
    ],
    exceptions: ['Custom metal rider packages purchased directly by agent remain agent property upon departure.'],
    escalationPaths: ['Unreturned lockbox disputes escalate to Broker-in-Charge and Managing Principal.'],
    completionEvidence: 'Signed equipment checkout agreement, updated inventory ledger, and return audit sign-off.',
    expectedTiming: 'Riders delivered within 7 business days; post-close equipment retrieved within 48 hours',
    systemsUsed: ['Sign Procurement Desk', 'Supra eKEY', 'Master Inventory Sheet', 'CDA Desk'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Operations Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Admin Coordinator',
    createdBy: 'Admin Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_google_reviews_engine_025': {
    id: 'sop_google_reviews_engine_025',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Google Reviews',
    purpose: 'Systematic protocol to capture verified 5-star Google client reviews at the psychological peak of client satisfaction following transaction closing, manage review sentiment triage, and repurpose testimonials for brand marketing.',
    trigger: 'Transaction closing confirmed and settlement statement finalized in Dotloop.',
    processOwner: 'Marketing Lead',
    sopOwner: { type: 'department', name: 'Marketing & Brand' },
    category: 'Marketing',
    stateJurisdiction: 'NC',
    participants: ['Marketing Lead', 'Marketing Coordinator', 'Listing Agent', 'Selling Agent', 'Broker-in-Charge'],
    prerequisites: ['Closed transaction loop in Dotloop', 'Confirmed client email and mobile phone number'],
    requiredInputs: ['Client Name', 'Property Address', 'Closing Date', 'Agent Name', 'Client Phone', 'Client Email'],
    orderedSteps: [
      {
        id: 'st_rev_1',
        stepNumber: 1,
        title: 'Post-Closing Sentiment & Contact Verification',
        action: 'Review closed transaction file with Closing Agent or Transaction Coordinator within 24 hours of closing to confirm client satisfaction and verify primary email and mobile phone.',
        role: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        secondaryRole: 'Transaction Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that client contact details are verified and positive closing experience is confirmed with transaction team.',
        systemUsed: 'Dotloop / CRM'
      },
      {
        id: 'st_rev_2',
        stepNumber: 2,
        title: 'Multi-Channel Review Invitation Dispatch',
        action: 'Dispatch personalized direct review invitation containing direct Google Review shortlink via SMS and personalized email signed by the agent.',
        role: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that personalized Google Review request is dispatched via SMS and email with verified rating link.',
        systemUsed: 'Shapework Marketing Engine'
      },
      {
        id: 'st_rev_3',
        stepNumber: 3,
        title: 'Review Submission Monitoring & 5-Day Nudge Automation',
        action: 'Monitor Google Business Profile API for review submission; if unsubmitted after 5 business days, trigger polite automated SMS reminder signed by agent.',
        role: 'Marketing Coordinator',
        primaryRole: 'Marketing Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that review submission status is monitored and automated 5-day polite reminder is queued.',
        systemUsed: 'CRM Pipeline'
      },
      {
        id: 'st_rev_4',
        stepNumber: 4,
        title: 'Public Appreciation Response & Sentiment Triage',
        action: 'Publish personalized appreciation reply on Google Business Profile within 24 hours of review publication; immediately flag and escalate any rating under 4 stars to Broker-in-Charge before responding.',
        role: 'Marketing Lead',
        primaryRole: 'Marketing Lead',
        secondaryRole: 'Broker-in-Charge',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that public Google appreciation response is published within 24 hours and any sub-4-star reviews are escalated to Broker-in-Charge.',
        systemUsed: 'Google Business Profile Manager'
      },
      {
        id: 'st_rev_5',
        stepNumber: 5,
        title: 'Testimonial Extraction & Social Spotlight Repurposing',
        action: 'Extract key quote excerpts from 5-star reviews, format branded testimonial social graphics in Maxa/Canva, and schedule publication across marketing channels per SOP-26.',
        role: 'Marketing Lead',
        primaryRole: 'Marketing Lead',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that branded testimonial social graphic is created and scheduled across marketing channels.',
        systemUsed: 'Nest Design Center (Maxa)'
      }
    ],
    decisions: [
      'If client experienced significant closing friction or delays, consult with agent and BIC before sending automated review request.',
      'If negative review (1 to 3 stars) is received, BIC makes immediate direct client phone outreach within 4 hours.'
    ],
    exceptions: ['Clients who explicitly opt out of communications are immediately suppressed from review campaigns.'],
    escalationPaths: ['Any negative public review or client complaint escalates immediately to Broker-in-Charge and Managing Principal.'],
    completionEvidence: 'Published Google review link, documented GBP response, and branded testimonial asset archive.',
    expectedTiming: 'Initial review request sent within 24 hours of closing; response posted within 24 hours of review',
    systemsUsed: ['Google Business Profile Manager', 'Dotloop', 'Shapework Marketing Engine', 'Nest Design Center (Maxa)'],
    reviewer: 'Broker-in-Charge',
    publisher: 'Marketing Lead',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Marketing Lead',
    createdBy: 'Marketing Lead',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_office_maintenance_routing_048': {
    id: 'sop_office_maintenance_routing_048',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Office Maintenance & Repair',
    purpose: 'Operational procedure resolving the bystander effect ("the lightbulb problem") by providing clear ticket intake, responsibility classification (landlord vs. tenant), rapid vendor dispatch, and strict financial authority limits for office facility maintenance.',
    trigger: 'Facility defect, damaged equipment, burned-out lighting, HVAC failure, plumbing leak, or safety hazard identified at Mayfaire or Carolina Beach offices.',
    processOwner: 'Admin Coordinator',
    sopOwner: { type: 'department', name: 'Office Operations' },
    category: 'Office and Facilities',
    stateJurisdiction: 'NC',
    participants: ['Admin Coordinator', 'Operations Lead', 'Managing Principal', 'Facility Contractor', 'Property Landlord'],
    prerequisites: ['Active facility lease', 'Authorized commercial vendor directory (SOP-53)'],
    requiredInputs: ['Office Location (Mayfaire vs Carolina Beach)', 'Defect Description', 'Photo Evidence', 'Priority Level'],
    orderedSteps: [
      {
        id: 'st_maint_1',
        stepNumber: 1,
        title: 'Zero-Friction Incident Intake & Hazard Classification',
        action: 'Ingest defect report via ticket, photo, or Slack; classify urgency: Priority 1 (Immediate Safety/Security Hazard), Priority 2 (Essential Operational Impairment), Priority 3 (Routine Cosmetic/Amenity Maintenance).',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that maintenance issue is logged with photographic documentation and urgency priority assigned.',
        systemUsed: 'Facility Maintenance Desk'
      },
      {
        id: 'st_maint_2',
        stepNumber: 2,
        title: 'Commercial Lease Obligation Assessment (Landlord vs Tenant)',
        action: 'Audit commercial lease terms for Mayfaire or Carolina Beach to determine whether repair obligation rests with building landlord/property management (HVAC, structural, exterior roof/doors, core plumbing) or Nest tenant improvements (interior lighting, furniture, fixtures, appliances).',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that commercial lease terms are audited to establish tenant versus landlord repair liability.',
        systemUsed: 'Commercial Lease Repository'
      },
      {
        id: 'st_maint_3',
        stepNumber: 3,
        title: 'Financial Threshold Authorization Check',
        action: 'Apply standard financial authorization limits: repairs up to $500 approved immediately by Admin Coordinator; repairs between $500 and $2,500 approved by Operations Lead; expenditures exceeding $2,500 or major facility alterations escalated to Managing Principal per SOP-01.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        secondaryRole: 'Operations Lead',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that cost estimate is obtained and financial approval is secured from designated authority tier.',
        systemUsed: 'Expense Approval Desk'
      },
      {
        id: 'st_maint_4',
        stepNumber: 4,
        title: 'Approved Vendor Dispatch & Access Coordination',
        action: 'Dispatch vetted commercial contractor from approved Vendor Directory (SOP-53); schedule repair outside peak client meeting hours and coordinate vendor building key or escort access.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Verified that approved commercial vendor is dispatched with work order scope and building access window confirmed.',
        systemUsed: 'Vendor Directory (SOP-53)'
      },
      {
        id: 'st_maint_5',
        stepNumber: 5,
        title: 'Physical Work Inspection & Ticket Resolution',
        action: 'Inspect completed repair in person; confirm workspace is clean, safe, and fully operational; archive invoice in accounts payable; close maintenance ticket.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that completed repair is inspected in person, workspace is left clean, and vendor invoice is routed to accounts payable.',
        systemUsed: 'Facility Maintenance Desk'
      }
    ],
    decisions: [
      'If issue involves water intrusion or gas smell, immediately evacuate area and dispatch emergency property manager contact.',
      'If landlord fails to remediate structural or HVAC defect within lease cure period, escalate to Managing Principal for legal notice.'
    ],
    exceptions: ['Routine consumable replenishment (lightbulbs, air filters) handled directly from office supply inventory.'],
    escalationPaths: ['Facility hazards or landlord non-responsiveness escalate directly to Managing Principal.'],
    completionEvidence: 'Completed maintenance ticket, before/after photo documentation, and verified contractor invoice.',
    expectedTiming: 'Priority 1 dispatched within 1 hour; Priority 2 within 24 hours; Priority 3 within 5 business days',
    systemsUsed: ['Facility Maintenance Desk', 'Commercial Lease Repository', 'Vendor Directory', 'QuickBooks'],
    reviewer: 'Operations Lead',
    publisher: 'Admin Coordinator',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Admin Coordinator',
    createdBy: 'Admin Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  },
  'sop_front_desk_hospitality_050': {
    id: 'sop_front_desk_hospitality_050',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Front Desk, Reception & Hospitality Procedures',
    purpose: 'Standard operating procedure ensuring a premier, white-glove hospitality experience for all clients, visitors, and brokers visiting Nest Realty offices, establishing immaculate lobby staging, prompt telephone etiquette, secure package/check intake, and dependable opening/closing routines.',
    trigger: 'Daily office operating hours (8:30 AM to 5:00 PM Monday through Friday), visitor arrival, or phone contact.',
    processOwner: 'Admin Coordinator',
    sopOwner: { type: 'department', name: 'Office Operations' },
    category: 'Office and Facilities',
    stateJurisdiction: 'NC',
    participants: ['Admin Coordinator', 'Operations Lead', 'Visiting Clients', 'Brokers', 'Delivery Personnel'],
    prerequisites: ['Active facility security credentials', 'Reception console access'],
    requiredInputs: ['Visitor Name', 'Host Broker', 'Delivery Vendor', 'Telephone Caller Inquiries'],
    orderedSteps: [
      {
        id: 'st_rec_1',
        stepNumber: 1,
        title: 'Morning Facility Opening & Atmosphere Staging (8:30 AM)',
        action: 'Arrive at 8:30 AM; disarm alarm; unlock main entry doors; power on ambient lobby lighting; initiate soft background jazz/ambient playlist; brew fresh coffee at hospitality station; inspect conference rooms to ensure tables are sanitized and chairs straight.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that lobby music is streaming, fresh coffee is prepared, conference rooms are staged, and main entry doors are unlocked by 8:30 AM.',
        systemUsed: 'Facility Checklist'
      },
      {
        id: 'st_rec_2',
        stepNumber: 2,
        title: 'First-Impression Visitor Greeting & Hospitality Protocol',
        action: 'Greet every client, guest, or visiting broker within 15 seconds of entry with warm professional greeting; offer sparkling water, artisanal coffee, or tea; escort visitor to designated conference room or lounge and notify meeting host immediately.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that guest is greeted within 15 seconds, beverage hospitality is offered, and host broker is notified.',
        systemUsed: 'Front Desk Reception Desk'
      },
      {
        id: 'st_rec_3',
        stepNumber: 3,
        title: 'Standardized Telephone Answering & Call Routing',
        action: 'Answer all incoming telephone inquiries by the third ring using canonical greeting: "Good morning/afternoon, thank you for calling Nest Realty, this is [Role/Title], how may I direct your call?"; accurately route caller or take detailed message in accordance with SOP-02.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Confirmed that telephone is answered by third ring with standardized Nest greeting and transferred cleanly.',
        systemUsed: 'Phone Switchboard / Rechat'
      },
      {
        id: 'st_rec_4',
        stepNumber: 4,
        title: 'Secure Mail, Package & Earnest Money Check Intake',
        action: 'Ingest daily USPS, FedEx, and UPS deliveries; log packages; receive physical earnest money or due diligence fee checks; immediately photograph checks, notify transaction coordinator, and store checks in locked fireproof safe per NCREC Rule 58A .0106.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '15m', customMinutes: 15, rawDisplay: '15 mins' },
        affirmationCheck: 'Verified that deliveries are logged, packages sorted, and escrow checks secured in fireproof safe with transaction team notified.',
        systemUsed: 'Mail Log / Escrow Safe'
      },
      {
        id: 'st_rec_5',
        stepNumber: 5,
        title: 'Evening Closing, Reset & Facility Lockdown (5:00 PM)',
        action: 'At 5:00 PM, verify all conference rooms and client restrooms are restocked and tidy; clean coffee station and espresso machine; power down non-essential monitors and lights; verify all exterior entrances are deadbolted and locked; arm building security alarm system.',
        role: 'Admin Coordinator',
        primaryRole: 'Admin Coordinator',
        durationPolicy: { preset: '30m', customMinutes: 30, rawDisplay: '30 mins' },
        affirmationCheck: 'Confirmed that office is fully reset, coffee station cleaned, exterior doors deadbolted, and security alarm armed at 5:00 PM.',
        systemUsed: 'Security Alarm Panel'
      }
    ],
    decisions: [
      'If visitor arrives unexpectedly without an appointment, seat in reception lounge and contact Broker-in-Charge or on-duty broker.',
      'If earnest money check is delivered without clear property address, contact transaction coordinator before accepting custody.'
    ],
    exceptions: ['Evening events extending beyond 5:00 PM require event organizer to execute dedicated lockup checklist per SOP-28.'],
    escalationPaths: ['Security disturbances, unauthorized access, or suspicious packages escalate immediately to Managing Principal and local authorities.'],
    completionEvidence: 'Completed morning/evening facility opening checklists, visitor intake logs, and delivery sign-offs.',
    expectedTiming: 'Continuous coverage from 8:30 AM to 5:00 PM business days',
    systemsUsed: ['Facility Checklist', 'Front Desk Reception Desk', 'Phone Switchboard', 'Security Alarm Panel'],
    reviewer: 'Operations Lead',
    publisher: 'Admin Coordinator',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    activationDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Admin Coordinator',
    createdBy: 'Admin Coordinator',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    version: 1
  }
};

const isTestEnv = (): boolean => {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST) || Boolean(process.env.TEST);
};

let memoryCache: Record<string, SopDocument> | null = null;

function ensureStorageDir(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeSopMap(data: Record<string, SopDocument>): Record<string, SopDocument> {
  const cleaned: Record<string, SopDocument> = {};
  for (const [key, sop] of Object.entries(data)) {
    const isTestDraftArtifact =
      key.startsWith('sop_unapproved_secret_') ||
      key.startsWith('sop_pub_verified_') ||
      key.startsWith('sop_custom_open_house_') ||
      key.startsWith('sop_studio_') ||
      key.startsWith('sop_da_audit_') ||
      key.startsWith('sop_draft_test_') ||
      (sop?.title && (
        sop.title.includes('Unapproved Draft') ||
        sop.title.includes('Commission Policy 17') ||
        sop.title.includes('Emergency Keybox Procedure 17') ||
        sop.title.includes('Luxury Waterfront Open House Protocol 17') ||
        sop.title.includes('Brokerage Aerial Drone Inspection Protocol 17')
      ));

    if (!isTestDraftArtifact) {
      cleaned[key] = sop;
    }
  }
  return cleaned;
}

function loadAllSops(): Record<string, SopDocument> {
  if (isTestEnv() && memoryCache) {
    return { ...memoryCache };
  }
  ensureStorageDir();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (!fs.existsSync(STORAGE_PATH)) {
        const cleanSeeds = Object.fromEntries(
          Object.entries(INITIAL_NEST_SOPS).map(([k, v]) => [k, sanitizeSopRoles(v)])
        );
        if (!isTestEnv()) {
          saveAllSops(cleanSeeds);
        } else {
          memoryCache = { ...cleanSeeds };
        }
        return { ...cleanSeeds };
      }
      const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      let mutated = false;
      for (const [id, initialSop] of Object.entries(INITIAL_NEST_SOPS)) {
        const cleanInitial = sanitizeSopRoles(initialSop);
        if (!parsed[id]) {
          parsed[id] = cleanInitial;
          mutated = true;
        } else {
          parsed[id] = {
            ...parsed[id],
            ...cleanInitial,
            publisher: cleanInitial.publisher || parsed[id].publisher,
            reviewer: cleanInitial.reviewer || parsed[id].reviewer,
            processOwner: cleanInitial.processOwner || parsed[id].processOwner,
            author: cleanInitial.author || parsed[id].author,
            orderedSteps: cleanInitial.orderedSteps || parsed[id].orderedSteps,
            participants: cleanInitial.participants || parsed[id].participants,
            escalationPaths: cleanInitial.escalationPaths || parsed[id].escalationPaths
          };
          mutated = true;
        }
      }
      for (const key of Object.keys(parsed)) {
        parsed[key] = sanitizeSopRoles(parsed[key]);
        if (parsed[key]) {
          parsed[key].category = normalizeSopCategory(parsed[key].category);
        }
      }
      if (mutated && !isTestEnv()) {
        saveAllSops(parsed);
      }
      memoryCache = parsed;
      return parsed;
    } catch {
      if (attempt === 2) {
        return memoryCache ? { ...memoryCache } : { ...INITIAL_NEST_SOPS };
      }
    }
  }
  return memoryCache ? { ...memoryCache } : { ...INITIAL_NEST_SOPS };
}

function saveAllSops(data: Record<string, SopDocument>): void {
  memoryCache = { ...data };
  if (isTestEnv()) {
    return;
  }
  ensureStorageDir();
  const cleanData = sanitizeSopMap(data);
  const tmpPath = `${STORAGE_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(cleanData, null, 2), 'utf8');
    fs.renameSync(tmpPath, STORAGE_PATH);
  } catch {
    try {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(cleanData, null, 2), 'utf8');
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch {}
  }
}

export const sopRepository = {
  async saveDraft(sop: SopDocument): Promise<SopDocument> {
    const { dbPool } = await import('./repositories.js');
    const canonicalWs = canonicalizeWorkspaceId(sop.workspaceId);
    const tenantId = sop.tenantId || CANONICAL_WILMINGTON_TENANT;
    const now = new Date().toISOString();
    const status = sop.status || 'draft';

    if (dbPool) {
      const res = await dbPool.query(`
        INSERT INTO sop_drafts (
          id, workspace_id, tenant_id, title, purpose, trigger, process_owner, reviewer,
          status, version, ordered_steps, systems_used, completion_evidence, expected_timing, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          purpose = EXCLUDED.purpose,
          trigger = EXCLUDED.trigger,
          process_owner = EXCLUDED.process_owner,
          reviewer = EXCLUDED.reviewer,
          status = EXCLUDED.status,
          version = EXCLUDED.version,
          ordered_steps = EXCLUDED.ordered_steps,
          systems_used = EXCLUDED.systems_used,
          completion_evidence = EXCLUDED.completion_evidence,
          expected_timing = EXCLUDED.expected_timing,
          updated_at = NOW()
        RETURNING *;
      `, [
        sop.id,
        canonicalWs,
        tenantId,
        sop.title,
        sop.purpose || '',
        sop.trigger || '',
        sop.processOwner || 'Staff Member',
        sop.reviewer || null,
        status,
        String(sop.version || 1),
        JSON.stringify(sop.orderedSteps || []),
        sop.systemsUsed || [],
        sop.completionEvidence || null,
        sop.expectedTiming || null
      ]);

      const row = res.rows[0];
      const savedDoc = {
        id: row.id,
        workspaceId: row.workspace_id,
        tenantId: row.tenant_id,
        title: row.title,
        purpose: row.purpose,
        trigger: row.trigger,
        processOwner: row.process_owner,
        reviewer: row.reviewer,
        status: row.status,
        version: parseInt(row.version, 10) || 1,
        orderedSteps: Array.isArray(row.ordered_steps) ? row.ordered_steps : (typeof row.ordered_steps === 'string' ? JSON.parse(row.ordered_steps) : []),
        systemsUsed: row.systems_used || [],
        completionEvidence: row.completion_evidence,
        expectedTiming: row.expected_timing,
        createdAt: row.created_at?.toISOString?.() || now,
        updatedAt: row.updated_at?.toISOString?.() || now
      } as SopDocument;

      try {
        const all = loadAllSops();
        all[sop.id] = savedDoc;
        saveAllSops(all);
      } catch {}

      return savedDoc;
    }

    const all = loadAllSops();
    const existing = all[sop.id];

    const updatedSop: SopDocument = {
      ...sop,
      workspaceId: canonicalWs,
      tenantId,
      status,
      aiAssisted: true,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
      version: existing ? existing.version : 1
    };

    all[sop.id] = updatedSop;
    saveAllSops(all);
    return updatedSop;
  },

  async getDraftById(id: string, tenantId: string): Promise<SopDocument | null> {
    const { dbPool } = await import('./repositories.js');
    const isWilm = isWilmingtonWorkspace(tenantId);

    if (dbPool) {
      const res = await dbPool.query(
        'SELECT * FROM sop_drafts WHERE id = $1 AND (tenant_id = $2 OR workspace_id = $2 OR ($3 = true AND (workspace_id = $4 OR tenant_id = $5)))',
        [id, tenantId, isWilm, CANONICAL_WILMINGTON_WORKSPACE, CANONICAL_WILMINGTON_TENANT]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      const initial = INITIAL_NEST_SOPS[row.id];
      return {
        ...(initial || {}),
        id: row.id,
        workspaceId: row.workspace_id,
        tenantId: row.tenant_id,
        title: row.title,
        purpose: row.purpose,
        trigger: row.trigger,
        processOwner: row.process_owner,
        reviewer: row.reviewer,
        status: row.status,
        version: parseInt(row.version, 10) || 1,
        orderedSteps: Array.isArray(row.ordered_steps) ? row.ordered_steps : (typeof row.ordered_steps === 'string' ? JSON.parse(row.ordered_steps) : []),
        systemsUsed: row.systems_used || [],
        completionEvidence: row.completion_evidence,
        expectedTiming: row.expected_timing,
        createdAt: row.created_at?.toISOString?.() || new Date().toISOString(),
        updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString()
      } as SopDocument;
    }

    const all = loadAllSops();
    const item = all[id];
    if (!item) return null;
    
    if (isWilm) {
      if (isWilmingtonWorkspace(item.tenantId) || isWilmingtonWorkspace(item.workspaceId)) {
        return item;
      }
    }
    
    if (item.tenantId !== tenantId && item.workspaceId !== tenantId) {
      return null;
    }
    return item;
  },

  getSopById(id: string, tenantId: string): SopDocument | null {
    const all = loadAllSops();
    const item = all[id];
    if (!item) return null;
    const isWilm = isWilmingtonWorkspace(tenantId);
    if (isWilm) {
      if (isWilmingtonWorkspace(item.tenantId) || isWilmingtonWorkspace(item.workspaceId)) {
        return item;
      }
    }
    if (item.tenantId !== tenantId && item.workspaceId !== tenantId) {
      return null;
    }
    return item;
  },

  listDraftsSync(tenantId: string, workspaceId: string): SopDocument[] {
    const all = loadAllSops();
    const isWilm = isWilmingtonWorkspace(tenantId) || isWilmingtonWorkspace(workspaceId);
    
    return Object.values(all).filter((s) => {
      if (isWilm) {
        return isWilmingtonWorkspace(s.workspaceId) || isWilmingtonWorkspace(s.tenantId);
      }
      return s.tenantId === tenantId || s.workspaceId === workspaceId;
    });
  },

  async listDrafts(tenantId: string, workspaceId: string): Promise<SopDocument[]> {
    const { dbPool } = await import('./repositories.js');
    const isWilm = isWilmingtonWorkspace(tenantId) || isWilmingtonWorkspace(workspaceId);

    if (dbPool) {
      let res = await dbPool.query(
        'SELECT * FROM sop_drafts WHERE (workspace_id = $1 OR tenant_id = $2 OR ($3 = true AND (workspace_id = $4 OR tenant_id = $5))) ORDER BY updated_at DESC',
        [workspaceId, tenantId, isWilm, CANONICAL_WILMINGTON_WORKSPACE, CANONICAL_WILMINGTON_TENANT]
      );
      
      if (res.rows.length === 0 && isWilm) {
        for (const initial of Object.values(INITIAL_NEST_SOPS)) {
          try {
            await this.saveDraft({ ...initial, workspaceId: CANONICAL_WILMINGTON_WORKSPACE, tenantId: CANONICAL_WILMINGTON_TENANT });
          } catch {}
        }
        res = await dbPool.query(
          'SELECT * FROM sop_drafts WHERE (workspace_id = $1 OR tenant_id = $2 OR ($3 = true AND (workspace_id = $4 OR tenant_id = $5))) ORDER BY updated_at DESC',
          [workspaceId, tenantId, isWilm, CANONICAL_WILMINGTON_WORKSPACE, CANONICAL_WILMINGTON_TENANT]
        );
      }

      return res.rows.map(row => {
        const initial = INITIAL_NEST_SOPS[row.id];
        return {
          ...(initial || {}),
          id: row.id,
          workspaceId: row.workspace_id,
          tenantId: row.tenant_id,
          title: row.title,
          purpose: row.purpose,
          trigger: row.trigger,
          processOwner: row.process_owner,
          reviewer: row.reviewer,
          status: row.status,
          version: parseInt(row.version, 10) || 1,
          orderedSteps: Array.isArray(row.ordered_steps) ? row.ordered_steps : (typeof row.ordered_steps === 'string' ? JSON.parse(row.ordered_steps) : []),
          systemsUsed: row.systems_used || [],
          completionEvidence: row.completion_evidence,
          expectedTiming: row.expected_timing,
          createdAt: row.created_at?.toISOString?.() || new Date().toISOString(),
          updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString()
        };
      }) as SopDocument[];
    }

    return this.listDraftsSync(tenantId, workspaceId);
  },

  async publishSop(id: string, tenantId: string, publisherUser: string): Promise<SopDocument> {
    const { dbPool } = await import('./repositories.js');
    if (dbPool) {
      try {
        const existing = await this.getDraftById(id, tenantId);
        if (existing) {
          const now = new Date().toISOString();
          const res = await dbPool.query(`
            UPDATE sop_drafts
            SET status = 'published', reviewer = $1, version = version + 1, updated_at = NOW()
            WHERE id = $2 AND (tenant_id = $3 OR workspace_id = $3 OR ($4 = true AND (workspace_id = $5 OR tenant_id = $6)))
            RETURNING *;
          `, [publisherUser, id, tenantId, isWilmingtonWorkspace(tenantId), CANONICAL_WILMINGTON_WORKSPACE, CANONICAL_WILMINGTON_TENANT]);

          await dbPool.query(`
            INSERT INTO sop_audits (id, workspace_id, timestamp, action, sop_id, performed_by, reason, snapshot)
            VALUES ($1, $2, NOW(), 'publish_sop', $3, $4, 'Published via governance lifecycle', $5);
          `, [`audit_pub_${Date.now()}`, existing.workspaceId || CANONICAL_WILMINGTON_WORKSPACE, id, publisherUser, JSON.stringify(res.rows[0])]);

          const row = res.rows[0];
          const publishedDoc = {
            id: row.id,
            workspaceId: row.workspace_id,
            tenantId: row.tenant_id,
            title: row.title,
            purpose: row.purpose,
            trigger: row.trigger,
            processOwner: row.process_owner,
            reviewer: row.reviewer,
            status: row.status,
            version: parseInt(row.version, 10) || 1,
            orderedSteps: Array.isArray(row.ordered_steps) ? row.ordered_steps : (typeof row.ordered_steps === 'string' ? JSON.parse(row.ordered_steps) : []),
            systemsUsed: row.systems_used || [],
            completionEvidence: row.completion_evidence,
            expectedTiming: row.expected_timing,
            createdAt: row.created_at?.toISOString?.() || now,
            updatedAt: row.updated_at?.toISOString?.() || now
          } as SopDocument;

          try {
            const all = loadAllSops();
            all[id] = publishedDoc;
            saveAllSops(all);
          } catch {}

          return publishedDoc;
        }
      } catch (err) {
        console.warn('[publishSop DB fallback to file]:', err);
      }
    }

    const all = loadAllSops();
    const existing = all[id];
    if (!existing) {
      throw new Error(`SOP with ID ${id} not found.`);
    }
    const isWilm = isWilmingtonWorkspace(tenantId);
    if (!isWilm && existing.tenantId !== tenantId && existing.workspaceId !== tenantId) {
      throw new Error(`Unauthorized: SOP belongs to another tenant.`);
    }

    const now = new Date().toISOString();

    const previousPublished = Object.values(all).find(
      (s) => (s.workspaceId === existing.workspaceId || (isWilm && isWilmingtonWorkspace(s.workspaceId))) &&
             s.title === existing.title && s.status === 'published' && s.id !== existing.id
    );

    if (previousPublished) {
      all[previousPublished.id] = {
        ...previousPublished,
        status: 'archived',
        updatedAt: now
      };
    }

    const publishedSop: SopDocument = {
      ...existing,
      status: 'published',
      publisher: publisherUser,
      effectiveDate: now,
      updatedAt: now,
      version: existing.version + 1,
      previousVersionId: previousPublished ? previousPublished.id : undefined
    };

    all[id] = publishedSop;
    saveAllSops(all);
    return publishedSop;
  },

  async deleteSop(id: string, tenantId: string, user: string = 'system', allowPublished: boolean = true): Promise<boolean> {
    const { dbPool } = await import('./repositories.js');
    if (dbPool) {
      const existing = (await this.getDraftById(id, tenantId)) || (await this.getSopById(id, tenantId));
      if (!existing) throw new Error(`SOP with ID "${id}" not found.`);
      if (!allowPublished && existing.status !== 'draft') {
        throw new Error(`Governance violation: Cannot delete SOP with status "${existing.status}". Only Draft SOPs may be deleted.`);
      }

      await dbPool.query(
        'DELETE FROM sop_drafts WHERE id = $1 AND (tenant_id = $2 OR workspace_id = $2 OR ($3 = true AND (workspace_id = $4 OR tenant_id = $5)))',
        [id, tenantId, isWilmingtonWorkspace(tenantId), CANONICAL_WILMINGTON_WORKSPACE, CANONICAL_WILMINGTON_TENANT]
      );

      const action = existing.status === 'published' ? 'delete_published_sop' : 'delete_draft';
      const reason = existing.status === 'published' ? 'Deleted published SOP by authorized administrator' : 'Deleted draft SOP';

      await dbPool.query(`
        INSERT INTO sop_audits (id, workspace_id, timestamp, action, sop_id, performed_by, reason)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6);
      `, [`audit_del_${Date.now()}`, existing.workspaceId || CANONICAL_WILMINGTON_WORKSPACE, action, id, user, reason]);

      try {
        await sopAuthoringRequestRepository.handleDraftDeleted(id, user);
      } catch (e) {
        console.error('Failed to notify authoring request repository of draft deletion:', e);
      }

      try {
        const all = loadAllSops();
        delete all[id];
        saveAllSops(all);
      } catch {}

      return true;
    }

    const all = loadAllSops();
    const existing = all[id];
    if (!existing) {
      throw new Error(`SOP with ID "${id}" not found.`);
    }
    const isWilm = isWilmingtonWorkspace(tenantId);
    if (!isWilm && existing.tenantId && tenantId && existing.tenantId !== tenantId && existing.workspaceId !== tenantId) {
      throw new Error(`Unauthorized: SOP belongs to another tenant.`);
    }
    if (!allowPublished && existing.status !== 'draft') {
      throw new Error(`Governance violation: Cannot delete SOP with status "${existing.status}". Only Draft SOPs may be deleted.`);
    }

    delete all[id];
    saveAllSops(all);

    try {
      await sopAuthoringRequestRepository.handleDraftDeleted(id, user);
    } catch (e) {
      console.error('Failed to notify authoring request repository of draft deletion:', e);
    }

    if (!isTestEnv()) {
      const auditPath = path.join(BACKUP_DIR, 'sop_audit.json');
      try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        let audits: any[] = [];
        if (fs.existsSync(auditPath)) {
          audits = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
        }
        audits.push({
          id: `audit_sop_${Date.now()}`,
          sopId: id,
          title: existing.title,
          action: existing.status === 'published' ? 'delete_published_sop' : 'delete_draft',
          performedBy: user,
          tenantId,
          workspaceId: existing.workspaceId,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(auditPath, JSON.stringify(audits, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to log SOP deletion audit:', err);
      }
    }

    return true;
  },

  async deleteDraft(id: string, tenantId: string, user: string = 'system', allowPublished: boolean = false): Promise<boolean> {
    return this.deleteSop(id, tenantId, user, allowPublished);
  }
};
