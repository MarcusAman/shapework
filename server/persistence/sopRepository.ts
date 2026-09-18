import fs from 'fs';
import path from 'path';
import { SopDocument } from '../../src/types/sopWorkflow';
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
    processOwner: 'Melissa Gagliardi — Marketing & Operations Lead',
    participants: ['Listing Agent', 'Transaction Coordinator', 'Photographer', 'BIC', 'Eduardo Lovo'],
    prerequisites: ['Signed Exclusive Right to Sell Agreement', 'Completed Seller Disclosures (RPOADS/MOG)'],
    requiredInputs: ['Property Address', 'List Price', 'Showing Instructions', 'Access Codes'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Schedule HDR photography, floor plan scan, and drone videography.', role: 'Listing Agent', systemUsed: 'Media Calendar' },
      { id: 'st_3', stepNumber: 3, action: 'Dispatch work order for yard post & brochure box installation.', role: 'Admin Coordinator', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_4', stepNumber: 4, action: 'Install Bluetooth Supra lockbox on property and verify shackle code.', role: 'Listing Agent', systemUsed: 'Supra eKEY' },
      { id: 'st_5', stepNumber: 5, action: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.', role: 'Transaction Coordinator', systemUsed: 'NC Regional MLS' },
      { id: 'st_7', stepNumber: 7, action: 'Submit listing draft to BIC Jessica Keenan / Eric Knight for compliance review and approval.', role: 'Broker-in-Charge', systemUsed: 'Compliance Desk' },
      { id: 'st_8', stepNumber: 8, action: 'Generate high-resolution property brochure and PDF marketing package.', role: 'Marketing Coordinator', systemUsed: 'Shapework Marketing Engine' },
      { id: 'st_9', stepNumber: 9, action: 'Schedule Broker Open preview and public Open House dates.', role: 'Listing Agent', systemUsed: 'ShowingTime' },
      { id: 'st_10', stepNumber: 10, action: 'Change MLS status from Incomplete to Active.', role: 'Transaction Coordinator', systemUsed: 'NC Regional MLS' },
      { id: 'st_11', stepNumber: 11, action: 'Trigger automated Just Listed social media campaign blitz and direct mail.', role: 'Marketing Coordinator', systemUsed: 'Shapework Marketing' },
      { id: 'st_12', stepNumber: 12, action: 'Email active MLS link and showing instructions to seller.', role: 'Listing Agent', systemUsed: 'Email / Client Portal' }
    ],
    decisions: ['If septic permit is unavailable, delay MLS activation until county records confirmed.'],
    exceptions: ['Delayed showing listings require formal NC Regional MLS Delayed Showing Addendum.'],
    escalationPaths: ['Escalate property boundary disputes or title issues to BIC Jessica Keenan.'],
    completionEvidence: 'Active MLS # generated, sign installed, lockbox active, marketing flyer dispatched.',
    expectedTiming: '48 to 72 hours from photo receipt to live MLS status',
    systemsUsed: ['Dotloop', 'NC Regional MLS', 'Sign Inventory Desk', 'Shapework Marketing Engine', 'Supra eKEY'],
    reviewer: 'Jessica Keenan — Broker-in-Charge',
    publisher: 'Jessica Keenan (BIC #226854)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa Gagliardi (Marketing Coordinator)',
    createdBy: 'Melissa Gagliardi',
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
    processOwner: 'Eric Knight — Broker-in-Charge',
    participants: ['Broker-in-Charge', 'Closing Attorney', 'Admin Coordinator', 'Selling Agent'],
    prerequisites: ['Executed Form 2-T Offer & Contract', 'Due Diligence Receipt'],
    requiredInputs: ['Purchase Price', 'Due Diligence Fee', 'Initial EMD Amount', 'Settlement Date', 'Escrow Agent'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours (3 banking days per NCREC Rule 58A .0106).', role: 'Admin Coordinator', systemUsed: 'Trust Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.', role: 'Admin Coordinator', systemUsed: 'Basecamp Calendar' },
      { id: 'st_4', stepNumber: 4, action: 'Notify cooperating broker and closing attorney with official contract execution package.', role: 'Admin Coordinator', systemUsed: 'Email' },
      { id: 'st_5', stepNumber: 5, action: 'Sync transaction loop in Dotloop and attach escrow trust receipt.', role: 'Admin Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft Commission Disbursement Authorization (CDA) ledger with broker commission split.', role: 'Broker-in-Charge', systemUsed: 'CDA Desk' }
    ],
    decisions: ['If EMD is not received within 72h, issue formal 1-business-day notice before contract voidability.'],
    exceptions: ['FHA/VA financing requires mandatory Amendatory Clause addendum.'],
    escalationPaths: ['Direct all earnest money release disputes immediately to BIC Eric Knight.'],
    completionEvidence: 'Verified EMD escrow receipt and BIC-approved CDA ledger.',
    expectedTiming: 'Within 72 hours of contract execution',
    systemsUsed: ['Dotloop', 'Coastal Settlement Law PC', 'CDA Compliance Desk'],
    reviewer: 'Eric Knight — BIC',
    publisher: 'Eric Knight (BIC #278908)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Eric Knight (BIC)',
    createdBy: 'Eric Knight (BIC)',
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
    title: 'Marketing Intake & Campaign Dispatch Protocol',
    purpose: 'Processing agent marketing requests for new listings, open houses, price improvements, and under-contract announcements with autonomous 1-click delegation to Eduardo Lovo.',
    trigger: 'Agent submits marketing request via Marketing Intake Console or asknora@nestrealty.com.',
    processOwner: 'Melissa Gagliardi — Marketing Lead',
    participants: ['Listing Agent', 'Marketing Lead (Melissa Gagliardi)', 'Design Production (Eduardo Lovo)', 'Print Vendor'],
    prerequisites: ['Active or Pending MLS listing', 'High-res photos'],
    requiredInputs: ['Property Address', 'Promotional Event Type', 'Target Mailing Radius', 'Collateral Specifications'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Ingest marketing request parameters (address, event type, demographic target) from email/phone/console.', role: 'Marketing Coordinator', systemUsed: 'Marketing Console' },
      { id: 'st_2', stepNumber: 2, action: 'Auto-generate 300 DPI vector flyers, social cards, and email blasts using Nest brand tokens in Maxa.', role: 'Virtual Assistant (Eduardo Lovo)', systemUsed: 'Nest Design Center (Maxa)' },
      { id: 'st_3', stepNumber: 3, action: 'Submit promotional assets to listing agent for 1-click review and approval.', role: 'Listing Agent', systemUsed: 'Approval Center' },
      { id: 'st_4', stepNumber: 4, action: 'Dispatch print orders to Coastal Print Works for same-day delivery.', role: 'Marketing Coordinator', systemUsed: 'Coastal Print Works' },
      { id: 'st_5', stepNumber: 5, action: 'Launch targeted geo-fenced social advertising campaigns on Meta & Instagram.', role: 'Marketing Coordinator', systemUsed: 'Meta Business Suite' }
    ],
    decisions: ['If luxury tier (> $1M), include custom embossed metallic foil property brochures.'],
    exceptions: ['Rush 24h turnarounds require direct coordinator Slack notification.'],
    escalationPaths: ['Branding non-compliance escalates to Melissa Gagliardi (Marketing Lead).'],
    completionEvidence: 'Dispatched flyer packages and published social campaign analytics.',
    expectedTiming: '24 hours from intake submission',
    systemsUsed: ['Nest Design Center (Maxa)', 'Shapework Marketing Engine', 'Meta Business Suite', 'Coastal Print Works'],
    reviewer: 'Melissa Gagliardi — Marketing Lead',
    publisher: 'Melissa Gagliardi (Marketing Lead)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa Gagliardi',
    createdBy: 'Melissa Gagliardi',
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
    processOwner: 'Ann Gunn — Operations Lead',
    participants: ['Listing Agent', 'Operations Lead (Ann Gunn)'],
    prerequisites: ['Listing Agreement Signed', 'Utility 811 Locate Cleared'],
    requiredInputs: ['Property Address', 'Sign Location Notes', 'Rider Selection (Coming Soon, Waterfront, Pool, Under Contract)'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Submit sign installation work order with property coordinates & 811 locate clearance.', role: 'Admin Coordinator', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_2', stepNumber: 2, action: 'Verify sign post installation photo proof within 24 to 48 business hours.', role: 'Operations Lead (Ann Gunn)', systemUsed: 'Sign Inventory Desk' },
      { id: 'st_3', stepNumber: 3, action: 'Attach rider panels (e.g. Coming Soon, Under Contract, Waterfront, Custom Agent Rider).', role: 'Listing Agent', systemUsed: 'Physical Inventory' },
      { id: 'st_4', stepNumber: 4, action: 'Issue automated sign removal dispatch immediately upon settlement recording.', role: 'Admin Coordinator', systemUsed: 'Sign Inventory Desk' }
    ],
    decisions: ['If HOA prohibits wooden posts, order approved metal frame A-board.'],
    exceptions: ['Damaged posts reported within 24h for free vendor replacement.'],
    escalationPaths: ['Vendor delays > 48h escalate to Ann Gunn (Operations Lead).'],
    completionEvidence: 'Installation photo verified in portal.',
    expectedTiming: '24 to 48 hours for installation; 24 hours for removal',
    systemsUsed: ['Sign Inventory Desk', 'Dotloop'],
    reviewer: 'Ann Gunn — Operations Lead',
    publisher: 'Ann Gunn (Operations Lead)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ann Gunn (Operations Lead)',
    createdBy: 'Ann Gunn',
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
    participants: ['Buyer Agent', 'Prospective Buyer', 'Mortgage Lender', 'BIC'],
    prerequisites: ['Initial Phone or In-Person Consultation'],
    requiredInputs: ['Buyer Contact Info', 'Target Budget Bracket', 'Preferred Locations', 'Pre-Approval Letter'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Present and review NCREC Working with Real Estate Agents disclosure brochure at first substantive contact.', role: 'Buyer Agent', systemUsed: 'NCREC Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Execute Exclusive Buyer Agency Agreement (NC Form 201) prior to writing any purchase offer.', role: 'Buyer Agent', systemUsed: 'Dotloop' },
      { id: 'st_3', stepNumber: 3, action: 'Verify buyer pre-approval letter or proof of funds from a qualified mortgage lender.', role: 'Buyer Agent', systemUsed: 'Lender Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Establish client search criteria and activate NC Regional MLS & Rechat client portal.', role: 'Buyer Agent', systemUsed: 'Rechat CRM' }
    ],
    decisions: ['If buyer refuses agency agreement, offer non-exclusive unrepresented buyer disclosure.'],
    exceptions: ['Dual agency requires explicit Dual Agency Addendum signature.'],
    escalationPaths: ['Agency disclosure questions escalate to BIC Jessica Keenan / Eric Knight.'],
    completionEvidence: 'Signed WWREA and Form 201 stored in Dotloop.',
    expectedTiming: 'Completed prior to first property showing or offer drafting',
    systemsUsed: ['NCREC Forms Portal', 'Dotloop', 'Rechat CRM', 'NC Regional MLS'],
    reviewer: 'Jessica Keenan — BIC',
    publisher: 'Jessica Keenan (BIC #226854)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Jessica Keenan (BIC)',
    createdBy: 'Jessica Keenan (BIC)',
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
    processOwner: 'Eduardo Lovo — Design Production Lead',
    participants: ['Listing Agent', 'Eduardo Lovo (VA / Maxa)', 'Melissa Gagliardi (Marketing Lead)'],
    prerequisites: ['High-res photography assets', 'Active MLS status'],
    requiredInputs: ['Property Address', 'Key Selling Features', 'Listing Price', 'Open House Hours'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Ingest property specs and staging photography from Google Drive asset vault.', role: 'Virtual Assistant', systemUsed: 'Google Drive' },
      { id: 'st_2', stepNumber: 2, action: 'Assemble 9:16 video reels and 3-slide story sequence in Maxa with prominent Nest Realty logo branding.', role: 'Design Lead', systemUsed: 'Nest Design Center (Maxa)' },
      { id: 'st_3', stepNumber: 3, action: 'Verify NCREC advertising compliance: All social posts must clearly display the firm name "Nest Realty Wilmington".', role: 'Marketing Lead', systemUsed: 'Compliance Checklist' },
      { id: 'st_4', stepNumber: 4, action: 'Publish across Nest Instagram, Facebook, and provide agent download link for personal channels.', role: 'Marketing Coordinator', systemUsed: 'Meta Business Suite' }
    ],
    decisions: ['If video footage is missing, generate Ken Burns animated stills from 300 DPI high-res photos.'],
    exceptions: ['Agent custom co-branding requires BIC approval.'],
    escalationPaths: ['Escalate social advertising compliance questions to Melissa Gagliardi.'],
    completionEvidence: 'Published social links and agent asset download package.',
    expectedTiming: 'Within 4 to 8 hours of MLS activation',
    systemsUsed: ['Nest Design Center (Maxa)', 'Meta Business Suite', 'Google Drive'],
    reviewer: 'Melissa Gagliardi — Marketing Lead',
    publisher: 'Melissa Gagliardi',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Eduardo Lovo',
    createdBy: 'Eduardo Lovo',
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
    trigger: 'Intake task assigned to Eduardo Lovo in Marketing Production Hub.',
    processOwner: 'Eduardo Lovo — Virtual Assistant (Design Production)',
    participants: ['Eduardo Lovo', 'Melissa Gagliardi', 'Listing Agent'],
    prerequisites: ['Confirmed MLS data and photo uploads in Google Drive'],
    requiredInputs: ['Property Address', 'Beds/Baths/SqFt', 'Headline Copy', 'Agent Headshot & Contact Info'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Open Nest Design Center (nest.maxadesigns.com) and select authorized Wilmington luxury template.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { id: 'st_2', stepNumber: 2, action: 'Populate property copy, specs, and agent headshot with automatic RGB to CMYK color profile conversion.', role: 'Virtual Assistant', systemUsed: 'Maxa Design Center' },
      { id: 'st_3', stepNumber: 3, action: 'Export 300 DPI high-res PDF with 0.125-inch bleed margins for professional print.', role: 'Virtual Assistant', systemUsed: 'Maxa Engine' },
      { id: 'st_4', stepNumber: 4, action: 'Stage PDF in Google Drive /Print_Ready folder and generate client proof link.', role: 'Virtual Assistant', systemUsed: 'Google Drive' }
    ],
    decisions: ['If listing price exceeds $1.5M, select matte soft-touch 16pt cardstock template.'],
    exceptions: ['Rush turnarounds under 6 hours require direct Slack ping.'],
    escalationPaths: ['Production bottlenecks escalate to Melissa Gagliardi.'],
    completionEvidence: '300 DPI PDF staged in Google Drive with download link.',
    expectedTiming: '2 to 4 hours from intake assignment',
    systemsUsed: ['Nest Design Center (nest.maxadesigns.com)', 'Google Drive', 'Coastal Print Works'],
    reviewer: 'Melissa Gagliardi — Marketing Lead',
    publisher: 'Melissa Gagliardi',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Eduardo Lovo',
    createdBy: 'Eduardo Lovo',
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
    trigger: 'Design collateral exported by Eduardo Lovo.',
    processOwner: 'Melissa Gagliardi — Marketing Lead',
    participants: ['Listing Agent', 'Melissa Gagliardi', 'Eduardo Lovo'],
    prerequisites: ['Completed Maxa proof draft in staging link'],
    requiredInputs: ['Proof URL', 'Agent Email / Phone', 'Deadline for Print Submission'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Send automated SMS & Email notification to listing agent with interactive proof review link.', role: 'Marketing Lead', systemUsed: 'Shapework Marketing Hub' },
      { id: 'st_2', stepNumber: 2, action: 'Capture agent feedback or annotations directly in the review drawer.', role: 'Listing Agent', systemUsed: 'Review Drawer' },
      { id: 'st_3', stepNumber: 3, action: 'If revisions requested, route notes to Eduardo Lovo with 2-hour SLA for revised proof.', role: 'Virtual Assistant', systemUsed: 'Maxa' },
      { id: 'st_4', stepNumber: 4, action: 'Upon agent 1-click approval, trigger automatic print vendor routing to Coastal Print Works.', role: 'Marketing Hub Engine', systemUsed: 'Automated Dispatch' }
    ],
    decisions: ['If agent does not respond within 24 hours, send follow-up reminder SMS.'],
    exceptions: ['Critical price change overrides pending proof with emergency update.'],
    escalationPaths: ['Unresponsive agents on rush listings escalate to Melissa Gagliardi.'],
    completionEvidence: 'Time-stamped agent approval record and dispatched print receipt.',
    expectedTiming: 'Same day proof turnaround',
    systemsUsed: ['Shapework Marketing Hub', 'SMS Provider', 'Coastal Print Works'],
    reviewer: 'Melissa Gagliardi — Marketing Lead',
    publisher: 'Melissa Gagliardi',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa Gagliardi',
    createdBy: 'Melissa Gagliardi',
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
    processOwner: 'Eduardo Lovo — Design Production Lead',
    participants: ['Field Photographer', 'Listing Agent', 'Eduardo Lovo', 'Melissa Gagliardi'],
    prerequisites: ['Scheduled photo shoot completed'],
    requiredInputs: ['Property Address', 'Photographer Delivery Link / Raw Image Attachments'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Scaffold Google Drive property folder hierarchy: 01_HighRes_Print, 02_Web_MLS, 03_Drone_Video, 04_Floorplans.', role: 'Virtual Assistant', systemUsed: 'Google Drive' },
      { id: 'st_2', stepNumber: 2, action: 'Download high-res image package, rename files with address prefix, and resize web assets to under 15MB.', role: 'Virtual Assistant', systemUsed: 'Cloud Storage Engine' },
      { id: 'st_3', stepNumber: 3, action: 'Tag hero shot, primary kitchen, primary bedroom, and waterfront/marsh features.', role: 'Virtual Assistant', systemUsed: 'Metadata Engine' },
      { id: 'st_4', stepNumber: 4, action: 'Notify listing agent and marketing team with clean Google Drive access link.', role: 'Virtual Assistant', systemUsed: 'Email / Slack' }
    ],
    decisions: ['If virtual twilight requested, stage twilight rendering in 01_HighRes_Print.'],
    exceptions: ['Corrupted files must be re-requested from vendor within 2 hours.'],
    escalationPaths: ['Photographer delivery delays escalate to Melissa Gagliardi.'],
    completionEvidence: 'Verified Google Drive folder with organized subdirectories.',
    expectedTiming: '2 hours from photo receipt',
    systemsUsed: ['Google Drive', 'DropBox Ingest Engine', 'Rechat MLS'],
    reviewer: 'Melissa Gagliardi — Marketing Lead',
    publisher: 'Melissa Gagliardi',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Eduardo Lovo',
    createdBy: 'Eduardo Lovo',
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
    processOwner: 'Ann Gunn — Operations Lead',
    participants: ['Listing Agent', 'Operations Lead (Ann Gunn)', 'Showing Agents'],
    prerequisites: ['Listing Agreement Signed', 'Active Supra eKEY Subscription with Cape Fear REALTORS®'],
    requiredInputs: ['Property Address', 'Lockbox Serial Number', 'Shackle Code', 'Showing Instructions'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Check out Supra iBox BT LE lockbox from Wilmington office inventory and verify battery level > 80%.', role: 'Operations Lead (Ann Gunn)', systemUsed: 'ShowingTime & Supra Inventory' },
      { id: 'st_2', stepNumber: 2, action: 'Program shackle code and assign property address in Supra eKEY mobile application.', role: 'Listing Agent', systemUsed: 'Supra eKEY App' },
      { id: 'st_3', stepNumber: 3, action: 'Attach lockbox securely to front door handle, gas meter, or approved railing location with spare house keys and deadbolt key.', role: 'Listing Agent', systemUsed: 'Physical Property' },
      { id: 'st_4', stepNumber: 4, action: 'Input lockbox serial number and showing instructions into ShowingTime and NC Regional MLS.', role: 'Transaction Coordinator', systemUsed: 'ShowingTime / MLS' },
      { id: 'st_5', stepNumber: 5, action: 'Upon settlement and closing, remove lockbox from property within 24 hours and check back into office inventory.', role: 'Listing Agent', systemUsed: 'Nest Inventory Registry' }
    ],
    decisions: ['If property is vacant and HOA allows, placing on front door handle is preferred. For occupied homes with gates, attach to side gas meter or railing.'],
    exceptions: ['If battery is depleted (<20%), swap immediately with fresh unit at Wilmington HQ.'],
    escalationPaths: ['Lost lockboxes or failed shackle codes escalate to Ann Gunn (Operations Lead).'],
    completionEvidence: 'Active lockbox serial logged in ShowingTime with confirmed test open.',
    expectedTiming: '24 hours prior to MLS activation',
    systemsUsed: ['Supra eKEY System', 'ShowingTime', 'NC Regional MLS', 'Nest Inventory Registry'],
    reviewer: 'Ann Gunn — Operations Lead',
    publisher: 'Ann Gunn (Operations Lead)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ann Gunn (Operations Lead)',
    createdBy: 'Ann Gunn',
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
    processOwner: 'Ryan Crecelius — Broker-in-Charge / Owner',
    participants: ['Ryan Crecelius (BIC / Owner)', 'Legal Counsel', 'Brokerage Partners'],
    prerequisites: ['Draft corporate resolution or operating agreement amendment'],
    requiredInputs: ['Partner Entities', 'Capital Contribution', 'Voting Thresholds', 'Compliance Disclosures'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Review proposed operating agreement modifications against North Carolina Real Estate Commission firm licensing rules.', role: 'Broker-in-Charge', systemUsed: 'NCREC Compliance Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Submit draft operating agreement to corporate counsel for partnership law review.', role: 'Managing Partner', systemUsed: 'Legal Review Desk' },
      { id: 'st_3', stepNumber: 3, action: 'Execute signature package via certified e-signature with immutable audit trail.', role: 'Partners', systemUsed: 'Dotloop / DocuSign' },
      { id: 'st_4', stepNumber: 4, action: 'Archive executed operating agreement in secure brokerage corporate records vault.', role: 'BIC', systemUsed: 'Google Drive Corporate Vault' }
    ],
    decisions: ['Material changes to firm ownership require filing updated Form REC 2.04 with NCREC within 10 days.'],
    exceptions: ['Emergency corporate actions require unanimous written consent of managing members.'],
    escalationPaths: ['All corporate governance escalations route directly to Ryan Crecelius.'],
    completionEvidence: 'Executed agreement and timestamped NCREC firm record filing.',
    expectedTiming: '5 to 10 business days',
    systemsUsed: ['NCREC Firm Licensing Portal', 'Dotloop', 'Google Drive Corporate Vault'],
    reviewer: 'Ryan Crecelius — BIC / Owner',
    publisher: 'Ryan Crecelius',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ryan Crecelius',
    createdBy: 'Ryan Crecelius',
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
    processOwner: 'Jessica Keenan & Eric Knight — Brokers-in-Charge',
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
    escalationPaths: ['Any disputed earnest money or due diligence fee release routes to BIC Jessica Keenan / Eric Knight.'],
    completionEvidence: 'Signed contract, escrow receipt, and BIC compliance approval badge in Dotloop.',
    expectedTiming: 'Review completed within 24 hours of offer execution',
    systemsUsed: ['Dotloop', 'NCREC Portal', 'Basecamp Compliance Calendar'],
    reviewer: 'Jessica Keenan — BIC',
    publisher: 'Jessica Keenan',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Jessica Keenan (BIC)',
    createdBy: 'Jessica Keenan',
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
    escalationPaths: ['Undisclosed material facts or disclosure disputes escalate immediately to BIC Jessica Keenan.'],
    completionEvidence: 'Signed RPOADS, MOG, and Lead Paint receipts in Dotloop loop.',
    expectedTiming: 'Completed prior to MLS activation',
    systemsUsed: ['Dotloop', 'NC Regional MLS', 'NCREC Disclosure Portal'],
    reviewer: 'Jessica Keenan — BIC',
    publisher: 'Jessica Keenan',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Jessica Keenan (BIC)',
    createdBy: 'Jessica Keenan',
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
    processOwner: 'Ryan Crecelius & Jessica Keenan — Broker-in-Charge',
    participants: ['All 77 Nest Brokers', 'Brokers-in-Charge', 'NCREC Education Provider'],
    prerequisites: ['Active NC Real Estate Broker License'],
    requiredInputs: ['Broker License Number', 'GENUP/BICUP Course Completion Certificate', 'Elective CE Course Certificate'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Audit broker CE records annually in January: verify 8 CE hours required (4 hours General Update GENUP or BICUP + 4 hours approved elective).', role: 'Operations / BIC', systemUsed: 'NCREC CE Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Send 90-day, 60-day, and 30-day reminders for the strict June 10 midnight CE completion deadline.', role: 'Operations Lead (Ann Gunn)', systemUsed: 'Email / SMS' },
      { id: 'st_3', stepNumber: 3, action: 'Enforce June 30 online license renewal fee payment on ncrec.gov to avoid license expiration.', role: 'Broker-in-Charge', systemUsed: 'NCREC Portal' },
      { id: 'st_4', stepNumber: 4, action: 'If CE is missed by June 10, license automatically changes to Inactive status on July 1; broker is immediately suspended from brokerage transactions until reinstated.', role: 'Broker-in-Charge', systemUsed: 'Nest Compliance Sentinel' }
    ],
    decisions: ['Provisional Brokers (PB) must complete Postlicensing 301, 302, 303 within 18 months of initial licensure.'],
    exceptions: ['First-year brokers renewing for the first time are exempt from CE for their first renewal only.'],
    escalationPaths: ['Inactive license alerts escalate immediately to Ryan Crecelius & Jessica Keenan.'],
    completionEvidence: 'Verified NCREC transcript showing 8 CE credits and renewed license status.',
    expectedTiming: 'CE completed by June 10; renewal fee paid by June 30',
    systemsUsed: ['ncrec.gov Licensing Portal', 'Nest Compliance Sentinel'],
    reviewer: 'Ryan Crecelius — BIC / Owner',
    publisher: 'Ryan Crecelius',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ryan Crecelius',
    createdBy: 'Ryan Crecelius',
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
    processOwner: 'James — Finance & Accounting Lead',
    participants: ['Closing Attorney', 'Listing/Selling Agent', 'Finance Lead (James)', 'BIC'],
    prerequisites: ['Completed Dotloop transaction file with all compliance approvals'],
    requiredInputs: ['Final Sale Price', 'Gross Commission Percentage', 'Agent Split Tier', 'Brokerage Fee / E&O deduction'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Perform Dotloop closing audit: ensure all signatures, disclosures, and MLS change sheets are complete.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Calculate gross commission, brokerage split percentage, and firm technology fee.', role: 'Finance Lead (James)', systemUsed: 'Accounting Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Draft Commission Disbursement Authorization (CDA) and send to BIC Eric Knight for approval.', role: 'Finance Lead', systemUsed: 'CDA Desk' },
      { id: 'st_4', stepNumber: 4, action: 'Deliver approved CDA to closing attorney for direct wire or check disbursement at settlement.', role: 'Finance Lead', systemUsed: 'Secure Email' },
      { id: 'st_5', stepNumber: 5, action: 'Log settlement funds in accounting ledger and disburse direct deposit commission to broker.', role: 'Finance Lead', systemUsed: 'Banking / QuickBooks' }
    ],
    decisions: ['If Dotloop loop is missing any required compliance document, hold CDA until compliant.'],
    exceptions: ['Earnest money held by Nest trust account must be credited against total commission on CDA.'],
    escalationPaths: ['Commission split questions escalate to James (Finance Lead) or BIC Eric Knight.'],
    completionEvidence: 'Signed CDA and bank wire confirmation.',
    expectedTiming: '48 hours prior to scheduled closing',
    systemsUsed: ['Dotloop', 'CDA Desk', 'Coastal Settlement Law PC', 'Accounting Ledger'],
    reviewer: 'Eric Knight — BIC',
    publisher: 'Eric Knight',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'James (Finance Lead)',
    createdBy: 'James',
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
    processOwner: 'Ryan Crecelius — Broker-in-Charge / Owner',
    participants: ['Ryan Crecelius (Owner)', 'Recruiting Lead', 'Candidate Agent'],
    prerequisites: ['Candidate agent MLS production history (12-month trailing volume)'],
    requiredInputs: ['Agent Name', 'Current Brokerage', 'Trailing 12-Month Volume', 'Target Production Goals'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Pull 12-month MLS market share report for Cape Fear region comparing Nest luxury list-to-sale metrics (98.6%).', role: 'Recruiting Lead', systemUsed: 'NC Regional MLS' },
      { id: 'st_2', stepNumber: 2, action: 'Demonstrate Nest tech ecosystem: Maxa 300 DPI design center, Rechat CRM, and Nora AI assistant.', role: 'Owner / Lead', systemUsed: 'Tech Demo Sandbox' },
      { id: 'st_3', stepNumber: 3, action: 'Present customized commission split model and zero-desk-fee structure.', role: 'Owner (Ryan Crecelius)', systemUsed: 'Recruiting Pro Forma' },
      { id: 'st_4', stepNumber: 4, action: 'Issue ICA (Independent Contractor Agreement) and schedule onboarding with Operations.', role: 'Admin Coordinator', systemUsed: 'Dotloop' }
    ],
    decisions: ['If candidate is a high-volume team (> $20M), provide dedicated virtual assistant allocation.'],
    exceptions: ['Transferring active listings requires formal listing transfer agreement from previous firm.'],
    escalationPaths: ['All recruiting proposals route to Ryan Crecelius.'],
    completionEvidence: 'Signed ICA and NCREC broker affiliation notice.',
    expectedTiming: '2 to 3 weeks recruitment pipeline',
    systemsUsed: ['NC Regional MLS', 'Rechat CRM', 'Nest Design Center', 'Dotloop'],
    reviewer: 'Ryan Crecelius — Owner',
    publisher: 'Ryan Crecelius',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ryan Crecelius',
    createdBy: 'Ryan Crecelius',
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
    processOwner: 'James Fort — CFO & Finance',
    participants: ['James Fort (CFO)', 'Operations Lead', 'Submitting Broker'],
    prerequisites: ['Itemized receipts or vendor statement', 'Prior managerial authorization for expenditures > $250'],
    requiredInputs: ['Payee / Vendor Name', 'Expense Category', 'Property Address (if applicable)', 'Amount', 'Proof of Payment'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Review submitted itemized receipt or invoice for valid business purpose and tax line coding.', role: 'Finance Director (James Fort)', systemUsed: 'QuickBooks Online' },
      { id: 'st_2', stepNumber: 2, action: 'Match expense against transaction ledger or approved marketing budget allocation.', role: 'Finance Director', systemUsed: 'CDA / Expense Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Authorize payment and schedule automated ACH bank disbursement.', role: 'Finance Director', systemUsed: 'Banking Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Issue digital payment receipt and update firm operational ledger.', role: 'Operations Lead', systemUsed: 'QuickBooks' }
    ],
    decisions: ['Expenses > $1,000 require secondary approval from Principal Broker Ryan Crecelius.'],
    exceptions: ['Closing gifts must strictly adhere to NCREC compliance guidelines (max $500 value).'],
    escalationPaths: ['Disputed expense claims route to Ryan Crecelius.'],
    completionEvidence: 'Bank transaction confirmation # and settled invoice in QuickBooks.',
    expectedTiming: '2 to 3 business days for payment settlement',
    systemsUsed: ['QuickBooks Online', 'Bank ACH Gateway', 'Dotloop'],
    reviewer: 'James Fort — CFO',
    publisher: 'James Fort',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'James Fort',
    createdBy: 'James Fort',
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
    processOwner: 'Ann Gunn — Operations & ATC Lead',
    participants: ['Ryan Crecelius (Principal Broker)', 'Ann Gunn (Operations Lead)', 'Melissa Gagliardi (Marketing)', 'New Broker'],
    prerequisites: ['Signed ICA', 'Active NCREC license verified in good standing', 'Signed WWREA acknowledgment'],
    requiredInputs: ['Broker Full Legal Name', 'NCREC License #', 'Direct Phone', 'Email Address', 'Headshot Photo', 'Emergency Contact'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'File NCREC Broker Affiliation Notice (Form REC 2.08) and verify active BIC supervisory status.', role: 'Principal Broker (Ryan Crecelius)', systemUsed: 'NCREC Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Provision Google Workspace email, Rechat CRM profile, Dotloop account, and Maxa Design Center credentials.', role: 'Operations Lead (Ann Gunn)', systemUsed: 'Google Admin / Rechat' },
      { id: 'st_3', stepNumber: 3, action: 'Issue office security key fob, assign desk/conference access, and configure Supra eKEY privileges.', role: 'Operations Lead', systemUsed: 'Supra / Facilities' },
      { id: 'st_4', stepNumber: 4, action: 'Create initial branded digital business card, luxury social announcement flyer, and introduce to firm roster.', role: 'Marketing Director (Melissa Gagliardi)', systemUsed: 'Shapework Marketing' },
      { id: 'st_5', stepNumber: 5, action: 'Conduct 60-minute Nest U Tech & Compliance Orientation with Operations Lead.', role: 'Operations Lead (Ann Gunn)', systemUsed: 'Google Meet / Training' }
    ],
    decisions: ['Provisional Brokers (PB) must be paired with dedicated mentor and strict BIC contract pre-approval.'],
    exceptions: ['Dual-firm affiliations are prohibited per Nest Brokerage Policy.'],
    escalationPaths: ['Licensing issues or background flags escalate immediately to Principal Broker Ryan Crecelius.'],
    completionEvidence: 'Completed onboarding checklist, NCREC affiliation confirmation, active tech accounts.',
    expectedTiming: '5 business days from ICA execution to full launch',
    systemsUsed: ['NCREC Portal', 'Google Workspace', 'Rechat CRM', 'Dotloop', 'Maxa', 'Supra eKEY'],
    reviewer: 'Ryan Crecelius — Principal Broker',
    publisher: 'Ryan Crecelius',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Ann Gunn (Operations Lead)',
    createdBy: 'Ann Gunn',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
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
        if (!isTestEnv()) {
          saveAllSops(INITIAL_NEST_SOPS);
        } else {
          memoryCache = { ...INITIAL_NEST_SOPS };
        }
        return { ...INITIAL_NEST_SOPS };
      }
      const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      let mutated = false;
      for (const [id, initialSop] of Object.entries(INITIAL_NEST_SOPS)) {
        if (!parsed[id]) {
          parsed[id] = initialSop;
          mutated = true;
        } else {
          parsed[id] = {
            ...initialSop,
            ...parsed[id],
            publisher: parsed[id].publisher || initialSop.publisher,
            reviewer: parsed[id].reviewer || initialSop.reviewer,
            processOwner: parsed[id].processOwner || initialSop.processOwner,
            author: parsed[id].author || initialSop.author
          };
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
