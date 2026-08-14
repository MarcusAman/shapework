import fs from 'fs';
import path from 'path';
import { SopDocument } from '../../src/types/sopWorkflow';
import { sopAuthoringRequestRepository } from './sopAuthoringRequestRepository';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const STORAGE_PATH = path.join(BACKUP_DIR, 'sops_repository.json');

const INITIAL_NEST_SOPS: Record<string, SopDocument> = {
  'sop_listing_launch_001': {
    id: 'sop_listing_launch_001',
    tenantId: 'tenant_nest_uat',
    workspaceId: 'ws_wilmington',
    title: 'Listing Launch Protocol',
    purpose: 'End-to-end execution protocol for launching residential real estate listings from professional photography to MLS activation and marketing distribution.',
    trigger: 'Executed listing agreement signed and returned by seller.',
    processOwner: 'Melissa — Transaction Coordinator',
    participants: ['Listing Agent', 'Transaction Coordinator', 'Photographer', 'BIC'],
    prerequisites: ['Signed Exclusive Right to Sell Agreement', 'Completed Seller Disclosures (RPOADS/MOG)'],
    requiredInputs: ['Property Address', 'List Price', 'Showing Instructions', 'Access Codes'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Schedule HDR photography, floor plan scan, and drone videography.', role: 'Listing Agent', systemUsed: 'Media Calendar' },
      { id: 'st_3', stepNumber: 3, action: 'Dispatch Coastal Sign Post Co. work order for yard post & brochure box installation.', role: 'Admin Coordinator', systemUsed: 'Sign Vendor Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Install Bluetooth Supra lockbox on property and verify shackle code.', role: 'Listing Agent', systemUsed: 'Supra eKEY' },
      { id: 'st_5', stepNumber: 5, action: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.', role: 'Transaction Coordinator', systemUsed: 'NC Regional MLS' },
      { id: 'st_7', stepNumber: 7, action: 'Submit listing draft to BIC Matt Orr for compliance review and approval.', role: 'Broker-in-Charge', systemUsed: 'Compliance Desk' },
      { id: 'st_8', stepNumber: 8, action: 'Generate high-resolution property brochure and PDF marketing package.', role: 'Marketing Coordinator', systemUsed: 'Shapework Marketing Engine' },
      { id: 'st_9', stepNumber: 9, action: 'Schedule Broker Open preview and public Open House dates.', role: 'Listing Agent', systemUsed: 'ShowingTime' },
      { id: 'st_10', stepNumber: 10, action: 'Change MLS status from Incomplete to Active.', role: 'Transaction Coordinator', systemUsed: 'NC Regional MLS' },
      { id: 'st_11', stepNumber: 11, action: 'Trigger automated Just Listed social media campaign blitz and direct mail.', role: 'Marketing Coordinator', systemUsed: 'Shapework Marketing' },
      { id: 'st_12', stepNumber: 12, action: 'Email active MLS link and showing instructions to seller.', role: 'Listing Agent', systemUsed: 'Email / Client Portal' }
    ],
    decisions: ['If septic permit is unavailable, delay MLS activation until county records confirmed.'],
    exceptions: ['Delayed showing listings require formal NC Regional MLS Delayed Showing Addendum.'],
    escalationPaths: ['Escalate property boundary disputes or title issues to BIC Matt Orr.'],
    completionEvidence: 'Active MLS # generated, sign installed, lockbox active, marketing flyer dispatched.',
    expectedTiming: '48 to 72 hours from photo receipt to live MLS status',
    systemsUsed: ['Dotloop', 'NC Regional MLS', 'Coastal Sign Post Co.', 'Shapework Marketing Engine', 'Supra eKEY'],
    reviewer: 'Matt Orr — Broker-in-Charge',
    publisher: 'Matt Orr (BIC #281940)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa (Transaction Coordinator)',
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
    processOwner: 'Matt Orr — Broker-in-Charge',
    participants: ['Broker-in-Charge', 'Closing Attorney', 'Transaction Coordinator', 'Selling Agent'],
    prerequisites: ['Executed Form 2-T Offer & Contract', 'Due Diligence Receipt'],
    requiredInputs: ['Purchase Price', 'Due Diligence Fee', 'Initial EMD Amount', 'Settlement Date', 'Escrow Agent'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.', role: 'Broker-in-Charge', systemUsed: 'Dotloop' },
      { id: 'st_2', stepNumber: 2, action: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours.', role: 'Transaction Coordinator', systemUsed: 'Trust Ledger' },
      { id: 'st_3', stepNumber: 3, action: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.', role: 'Transaction Coordinator', systemUsed: 'Basecamp Calendar' },
      { id: 'st_4', stepNumber: 4, action: 'Notify cooperating broker and closing attorney with official contract execution package.', role: 'Transaction Coordinator', systemUsed: 'Email' },
      { id: 'st_5', stepNumber: 5, action: 'Sync transaction loop in Dotloop and attach escrow trust receipt.', role: 'Transaction Coordinator', systemUsed: 'Dotloop' },
      { id: 'st_6', stepNumber: 6, action: 'Draft Commission Disbursement Authorization (CDA) ledger with broker commission split.', role: 'Broker-in-Charge', systemUsed: 'CDA Desk' }
    ],
    decisions: ['If EMD is not received within 72h, issue formal 1-business-day notice before contract voidability.'],
    exceptions: ['FHA/VA financing requires mandatory Amendatory Clause addendum.'],
    escalationPaths: ['Direct all earnest money release disputes immediately to BIC Matt Orr.'],
    completionEvidence: 'Verified EMD escrow receipt and BIC-approved CDA ledger.',
    expectedTiming: 'Within 72 hours of contract execution',
    systemsUsed: ['Dotloop', 'Coastal Settlement Law PC', 'CDA Compliance Desk'],
    reviewer: 'Matt Orr — BIC',
    publisher: 'Matt Orr (BIC #281940)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Matt Orr (BIC)',
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
    purpose: 'Processing agent marketing requests for new listings, open houses, price improvements, and under-contract announcements.',
    trigger: 'Agent submits marketing request via Marketing Intake Console.',
    processOwner: 'Marketing Coordinator',
    participants: ['Listing Agent', 'Marketing Coordinator', 'Print Vendor'],
    prerequisites: ['Active or Pending MLS listing', 'High-res photos'],
    requiredInputs: ['Property Address', 'Promotional Event Type', 'Target Mailing Radius'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Ingest marketing request parameters (address, event type, demographic target).', role: 'Marketing Coordinator', systemUsed: 'Marketing Console' },
      { id: 'st_2', stepNumber: 2, action: 'Auto-generate 300 DPI vector flyers, social cards, and email blasts using Nest brand tokens.', role: 'Marketing Coordinator', systemUsed: 'Shapework Marketing Engine' },
      { id: 'st_3', stepNumber: 3, action: 'Submit promotional assets to listing agent for 1-click review and approval.', role: 'Listing Agent', systemUsed: 'Approval Center' },
      { id: 'st_4', stepNumber: 4, action: 'Dispatch print orders to Coastal Print Works for same-day delivery.', role: 'Marketing Coordinator', systemUsed: 'Coastal Print Works' },
      { id: 'st_5', stepNumber: 5, action: 'Launch targeted geo-fenced social advertising campaigns.', role: 'Marketing Coordinator', systemUsed: 'Meta Business Suite' }
    ],
    decisions: ['If luxury tier (> $1M), include custom embossed metallic foil property brochures.'],
    exceptions: ['Rush 24h turnarounds require direct coordinator Slack notification.'],
    escalationPaths: ['Branding non-compliance escalates to Melissa (Marketing Lead).'],
    completionEvidence: 'Dispatched flyer packages and published social campaign analytics.',
    expectedTiming: '24 hours from intake submission',
    systemsUsed: ['Shapework Marketing Engine', 'Meta Business Suite', 'Coastal Print Works'],
    reviewer: 'Melissa — Marketing Lead',
    publisher: 'Melissa (Marketing Lead)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa',
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
    purpose: 'Standardized protocol for ordering real estate yard post installations, directional arrows, and post removals upon closing.',
    trigger: 'New active listing launch or closed transaction.',
    processOwner: 'Admin Coordinator',
    participants: ['Listing Agent', 'Admin Coordinator', 'Coastal Sign Post Co.'],
    prerequisites: ['Listing Agreement Signed', 'Utility 811 Locate Cleared'],
    requiredInputs: ['Property Address', 'Sign Location Notes', 'Rider Selection'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Submit sign installation work order with property coordinates & 811 locate.', role: 'Admin Coordinator', systemUsed: 'Sign Vendor Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Verify sign post installation photo within 48 business hours.', role: 'Admin Coordinator', systemUsed: 'Coastal Post Portal' },
      { id: 'st_3', stepNumber: 3, action: 'Attach rider panels (e.g. Coming Soon, Under Contract, Waterfront).', role: 'Listing Agent', systemUsed: 'Physical Inventory' },
      { id: 'st_4', stepNumber: 4, action: 'Issue automated sign removal dispatch immediately upon settlement recording.', role: 'Admin Coordinator', systemUsed: 'Sign Vendor Portal' }
    ],
    decisions: ['If HOA prohibits wooden posts, order approved metal frame A-board.'],
    exceptions: ['Damaged posts reported within 24h for free vendor replacement.'],
    escalationPaths: ['Vendor delays > 48h escalate to Admin Coordinator.'],
    completionEvidence: 'Vendor completion photo verified in portal.',
    expectedTiming: '24 to 48 hours for installation; 24 hours for removal',
    systemsUsed: ['Coastal Sign Post Co. Portal', 'Dotloop'],
    reviewer: 'Melissa — Operations',
    publisher: 'Melissa (Operations Lead)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Melissa',
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
    purpose: 'Onboarding prospective home buyers in compliance with North Carolina Real Estate Commission (NCREC) agency disclosure laws.',
    trigger: 'First substantive contact with prospective real estate buyer.',
    processOwner: 'Brokerage Associate',
    participants: ['Buyer Agent', 'Prospective Buyer', 'Mortgage Lender'],
    prerequisites: ['Initial Phone or In-Person Consultation'],
    requiredInputs: ['Buyer Contact Info', 'Target Budget Bracket', 'Preferred Locations'],
    orderedSteps: [
      { id: 'st_1', stepNumber: 1, action: 'Present and review NCREC Working with Real Estate Agents disclosure brochure at first substantive contact.', role: 'Buyer Agent', systemUsed: 'NCREC Portal' },
      { id: 'st_2', stepNumber: 2, action: 'Execute Exclusive Buyer Agency Agreement (Form 201) prior to writing any purchase offer.', role: 'Buyer Agent', systemUsed: 'Dotloop' },
      { id: 'st_3', stepNumber: 3, action: 'Verify buyer pre-approval letter or proof of funds from a qualified mortgage lender.', role: 'Buyer Agent', systemUsed: 'Lender Portal' },
      { id: 'st_4', stepNumber: 4, action: 'Establish client search criteria and activate NC Regional MLS client portal.', role: 'Buyer Agent', systemUsed: 'NC Regional MLS' }
    ],
    decisions: ['If buyer refuses agency agreement, offer non-exclusive unrepresented buyer disclosure.'],
    exceptions: ['Dual agency requires explicit Dual Agency Addendum signature.'],
    escalationPaths: ['Agency disclosure questions escalate to BIC Matt Orr.'],
    completionEvidence: 'Signed WWREA and Form 201 stored in Dotloop.',
    expectedTiming: 'Completed prior to first property showing or offer drafting',
    systemsUsed: ['NCREC Forms Portal', 'Dotloop', 'NC Regional MLS'],
    reviewer: 'Matt Orr — BIC',
    publisher: 'Matt Orr (BIC #281940)',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    reviewDate: '2026-12-31T00:00:00.000Z',
    openQuestions: [],
    status: 'published',
    author: 'Matt Orr (BIC)',
    aiAssisted: true,
    transcriptRetention: 'sop_only',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1
  }
};

function ensureStorageDir(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadAllSops(): Record<string, SopDocument> {
  ensureStorageDir();
  if (!fs.existsSync(STORAGE_PATH)) {
    saveAllSops(INITIAL_NEST_SOPS);
    return { ...INITIAL_NEST_SOPS };
  }
  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
    const parsed = JSON.parse(raw) || {};
    // Ensure all base initial SOPs exist
    let mutated = false;
    for (const [k, v] of Object.entries(INITIAL_NEST_SOPS)) {
      if (!parsed[k]) {
        parsed[k] = v;
        mutated = true;
      }
    }
    if (mutated) {
      saveAllSops(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('[SopRepository] Error loading sops store:', err);
    return { ...INITIAL_NEST_SOPS };
  }
}

function saveAllSops(data: Record<string, SopDocument>): void {
  ensureStorageDir();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export const sopRepository = {
  async saveDraft(sop: SopDocument): Promise<SopDocument> {
    const all = loadAllSops();
    const existing = all[sop.id];
    
    const now = new Date().toISOString();
    const updatedSop: SopDocument = {
      ...sop,
      status: sop.status === 'published' ? 'published' : 'draft', // Enforce draft status unless explicitly published via publish boundary
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
    const all = loadAllSops();
    const item = all[id];
    if (!item) return null;
    if (item.tenantId !== tenantId) return null; // Strict tenant boundary
    return item;
  },

  listDraftsSync(tenantId: string, workspaceId: string): SopDocument[] {
    const all = loadAllSops();
    return Object.values(all).filter(
      (s) => s.tenantId === tenantId && s.workspaceId === workspaceId
    );
  },

  async listDrafts(tenantId: string, workspaceId: string): Promise<SopDocument[]> {
    return this.listDraftsSync(tenantId, workspaceId);
  },

  async publishSop(id: string, tenantId: string, publisherUser: string): Promise<SopDocument> {
    const all = loadAllSops();
    const existing = all[id];
    if (!existing) {
      throw new Error(`SOP with ID ${id} not found.`);
    }
    if (existing.tenantId !== tenantId) {
      throw new Error(`Unauthorized: SOP belongs to another tenant.`);
    }

    const now = new Date().toISOString();

    // If an existing published SOP is being replaced, archive it
    const previousPublished = Object.values(all).find(
      (s) => s.workspaceId === existing.workspaceId && s.title === existing.title && s.status === 'published' && s.id !== existing.id
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

  async deleteDraft(id: string, tenantId: string, user: string = 'system'): Promise<boolean> {
    const all = loadAllSops();
    const existing = all[id];
    if (!existing) {
      throw new Error(`SOP with ID "${id}" not found.`);
    }
    if (existing.tenantId !== tenantId) {
      throw new Error(`Unauthorized: SOP belongs to another tenant.`);
    }
    if (existing.status !== 'draft') {
      throw new Error(`Governance violation: Cannot delete SOP with status "${existing.status}". Only Draft SOPs may be deleted.`);
    }

    delete all[id];
    saveAllSops(all);

    // Safeguard SOP Authoring Request references so they never become orphaned
    try {
      await sopAuthoringRequestRepository.handleDraftDeleted(id, user);
    } catch (e) {
      console.error('Failed to notify authoring request repository of draft deletion:', e);
    }

    // Save audit log
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
        action: 'delete_draft',
        performedBy: user,
        tenantId,
        workspaceId: existing.workspaceId,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(auditPath, JSON.stringify(audits, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to log SOP deletion audit:', err);
    }

    return true;
  }
};

