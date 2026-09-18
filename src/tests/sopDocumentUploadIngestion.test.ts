import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AICopilotService } from '../../server/ai/aiCopilotService';

describe('SOP Document Upload & AI Ingestion Service', () => {
  const sampleDocumentText = `
Title: Wilmington Waterfront Listing Onboarding SOP
Department: Marketing & Listing Operations
Process Owner: Marketing Coordinator
Purpose: Ensure seamless intake, professional photography scheduling, and MLS live activation for luxury waterfront listings.
Trigger: Executed Exclusive Right to Sell Agreement uploaded to Dotloop.

Step 1: Verify executed listing agreement and lead paint disclosure in Dotloop.
Step 2: Order professional photography and drone twilight shoot within 24 hours.
Step 3: Draft MLS listing in NC Regional MLS and submit for Broker-in-Charge compliance review.
Step 4: Publish active status and distribute social media announcement assets.

If: Professional photography is delayed due to weather
Then: Notify listing agent immediately and adjust MLS target launch date.

Escalation: If listing documents are incomplete after 48 hours, escalate to BIC Ryan Crecelius.
Prerequisites: Signed listing agreement and completed intake questionnaire.
Required Inputs: Property Address, List Price, Lockbox Code
`;

  it('extracts a structured SOP from plain text / markdown document content', async () => {
    const dbState: any = { opsSops: [], aiAuditLogs: [] };
    const persistFn = async () => {};

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      sampleDocumentText,
      'Waterfront_Listing_Guide.md'
    );

    expect(result.success).toBe(true);
    expect(result.mode).toBe('create');
    expect(result.sop).toBeDefined();

    const sop = result.sop;
    expect(sop.title).toBe('Wilmington Waterfront Listing Onboarding SOP');
    expect(sop.department).toBe('Marketing & Listing Operations');
    expect(sop.processOwner).toBe('Marketing Coordinator');
    expect(sop.orderedSteps.length).toBe(4);

    // Verify step roles and systems detection
    expect(sop.orderedSteps[0].role).toBe('Marketing Coordinator');
    expect(sop.orderedSteps[0].systemUsed).toBe('Dotloop');
    expect(sop.orderedSteps[2].role).toBe('Broker-in-Charge');
    expect(sop.orderedSteps[2].systemUsed).toBe('NC Regional MLS');

    expect(sop.decisions.length).toBeGreaterThan(0);
    expect(sop.status).toBe('draft');
    expect(sop.aiAssisted).toBe(true);
    expect(sop.changeSummary).toContain('Waterfront_Listing_Guide.md');
  });

  it('updates and merges revisions onto an existing SOP when update mode is used', async () => {
    const dbState: any = { opsSops: [], aiAuditLogs: [] };
    const persistFn = async () => {};

    const existingSop = {
      id: 'sop_listing_launch_001',
      sopId: 'sop_listing_launch_001',
      title: 'Existing Listing Launch Process',
      department: 'Marketing',
      ownerRole: 'marketing_coordinator',
      version: 1,
      orderedSteps: [
        { id: 'st_1', stepNumber: 1, action: 'Legacy intake step', role: 'Marketing Coordinator', systemUsed: 'Dotloop' }
      ]
    };

    const updateDocText = `
Title: Updated Listing Launch Process 2026
Department: Marketing & Growth
Step 1: Review signed agreement in Dotloop.
Step 2: Schedule drone shoot and order yard signage.
Step 3: Obtain BIC signoff on MLS draft.
`;

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      updateDocText,
      'Listing_Launch_Rev_2026.docx',
      existingSop
    );

    expect(result.success).toBe(true);
    expect(result.mode).toBe('update');
    expect(result.sop.id).toBe('sop_listing_launch_001');
    expect(result.sop.version).toBe(2);
    expect(result.sop.orderedSteps.length).toBe(3);
    expect(result.sop.changeSummary).toContain('Listing_Launch_Rev_2026.docx');
  });

  it('verifies SOPDocumentUploadModal component exists and is exported', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/sops/SOPDocumentUploadModal.tsx');
    expect(fs.existsSync(modalPath)).toBe(true);
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('Upload SOP Document');
    expect(content).toContain('Create New SOP');
    expect(content).toContain('Update Existing');
    expect(content).toContain('Auto-Detect');
    expect(content).toContain('Create & Publish SOP');
    expect(content).toContain('Advanced: Open in SOP Builder');
    expect(content).toContain('Save as Draft');
  });

  it('verifies SOPLibrary and SOPStudio integrate SOPDocumentUploadModal and Knowledge Library buttons', () => {
    const studioPath = path.resolve(process.cwd(), 'src/components/sops/SOPStudio.tsx');
    const studioContent = fs.readFileSync(studioPath, 'utf-8');

    expect(studioContent).toContain('SOPDocumentUploadModal');
    expect(studioContent).toContain('isUploadModalOpen');
    expect(studioContent).toContain('onOpenUploadModal');
    expect(studioContent).toContain('Back to Knowledge Library');

    const topBarPath = path.resolve(process.cwd(), 'src/components/layout/TopBar.tsx');
    const topBarContent = fs.readFileSync(topBarPath, 'utf-8');

    expect(topBarContent).toContain('Knowledge Library');
    expect(topBarContent).toContain('Upload SOP Document');
  });

  it('generates an intelligent authoritative SOP title from content for generic filenames', async () => {
    const dbState: any = { opsSops: [] };
    const persistFn = async () => {};

    const openHouseDoc = `
Department: Marketing & Field Operations
Process Owner: Marketing Coordinator
Purpose: Ensure seamless open house staging, directional signage, photography, and social media blast.
Step 1: Coordinate with listing agent on open house date and lockbox access.
Step 2: Dispatch digital open house flyer to agent database.
Step 3: Place 6 directional signs at high-traffic intersections 2 hours prior to start.
`;

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      openHouseDoc,
      'Copy of Nest Realty SOP Guides for Nora.pdf'
    );

    expect(result.success).toBe(true);
    expect(result.mode).toBe('create');
    // Verifies title is intelligently named based on content, not raw "Copy of Nest Realty SOP Guides for Nora"
    expect(result.sop.title).toBe('Open House Preparation & Media Protocol');
    expect(result.sop.processOwner).toBe('Marketing Coordinator');
  });

  it('auto-detects an existing SOP match when content corresponds to a procedure in the library', async () => {
    const existingListingLaunch = {
      id: 'sop_listing_launch',
      sopId: 'sop_listing_launch',
      title: 'Listing Launch Protocol',
      department: 'Operations',
      version: 2,
      orderedSteps: [{ id: 's1', stepNumber: 1, action: 'Initial review', role: 'Listing Agent', systemUsed: 'Dotloop' }]
    };

    const dbState: any = {
      opsSops: [existingListingLaunch]
    };
    const persistFn = async () => {};

    const revisionDoc = `
Listing Launch Protocol revisions for 2026.
Step 1: Check listing agreement in Dotloop.
Step 2: Order drone and twilight photography package.
Step 3: Submit MLS draft for BIC review.
`;

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      revisionDoc,
      'Listing_Launch_Notes.txt'
    );

    expect(result.matchedExistingSopId).toBe('sop_listing_launch');
    expect(result.sop.id).toBe('sop_listing_launch');
    expect(result.sop.version).toBe(3);
  });

  it('filters out horizontal divider lines (e.g. --------------------) from becoming checklist steps', async () => {
    const dbState: any = { opsSops: [] };
    const persistFn = async () => {};

    const documentWithDividers = `
Title: Marketing Launch Request SOP
Department: Marketing & Design
Process Owner: Marketing Coordinator
Purpose: Standard launch process for marketing collateral.

Step 1: Customizing & exporting the postcard flyer
Step 2: --------------------------------------------------
Step 3: Accessing Campaigns in Rechat & Selecting Audience
Step 4: Uploading Artwork & Validating Mailing Lists
Step 5: __________________________________________________
Step 6: Submit final proof to BIC for marketing compliance signoff
`;

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      documentWithDividers,
      'Marketing_Launch.txt'
    );

    expect(result.success).toBe(true);
    expect(result.sop.orderedSteps.length).toBe(4);
    expect(result.sop.orderedSteps[0].action).toContain('Customizing & exporting');
    expect(result.sop.orderedSteps[1].action).toContain('Accessing Campaigns in Rechat');
    expect(result.sop.orderedSteps[2].action).toContain('Uploading Artwork');
    expect(result.sop.orderedSteps[3].action).toContain('Submit final proof');

    // Ensure none of the steps contain only dashes or divider characters
    result.sop.orderedSteps.forEach((st: any) => {
      expect(st.action).not.toMatch(/^[-_=\*\.\s~#]+$/);
    });
  });

  it('accurately maps Rechat tool, marketing role, and attaches sourceDocument payload', async () => {
    const dbState: any = { opsSops: [] };
    const persistFn = async () => {};

    const marketingDoc = `
Title: Postcard Marketing Blitz Procedure
Purpose: Dispatch promotional direct mailers for newly listed properties.
Step 1: Customizing & exporting the postcard flyer in Canva.
Step 2: Accessing Campaigns in Rechat & Selecting Audience.
Step 3: Uploading Artwork & Validating Mailing Lists.
Step 4: Dispatch Coastal Sign Post installation order.
Step 5: Submit completed proof for BIC compliance review.
`;

    const result = await AICopilotService.extractSopFromDocument(
      dbState,
      persistFn,
      'nest-realty-wilmington',
      'ryan@nestrealty.com',
      marketingDoc,
      'Marketing_SOP_Guide.pdf'
    );

    expect(result.success).toBe(true);
    const sop = result.sop;

    // Step 1: Canva & Marketing
    expect(sop.orderedSteps[0].systemUsed).toBe('Canva');
    expect(sop.orderedSteps[0].role).toBe('Marketing Coordinator');

    // Step 2: Rechat & Marketing Coordinator (NOT Dotloop or Transaction Coordinator!)
    expect(sop.orderedSteps[1].systemUsed).toBe('Rechat');
    expect(sop.orderedSteps[1].role).toBe('Marketing Coordinator');

    // Step 3: Rechat artwork/mailing
    expect(sop.orderedSteps[2].systemUsed).toBe('Rechat');

    // Step 4: Coastal Sign Post Co.
    expect(sop.orderedSteps[3].systemUsed).toBe('Coastal Sign Post Co.');

    // Step 5: Broker-in-Charge
    expect(sop.orderedSteps[4].role).toBe('Broker-in-Charge');

    // Source document payload preservation
    expect(sop.sourceDocument).toBeDefined();
    expect(sop.sourceDocument.fileName).toBe('Marketing_SOP_Guide.pdf');
    expect(sop.sourceDocument.fileType).toBe('pdf');
    expect(sop.sourceDocument.filePayload).toBeDefined();
  });
});


