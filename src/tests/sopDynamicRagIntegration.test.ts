import { describe, it, expect, beforeEach } from 'vitest';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { sopRepository } from '../../server/persistence/sopRepository';
import { SopDocument } from '../types/sopWorkflow';

describe('Staff SOP Template Dynamic RAG & NORA Voice Integration', () => {
  const tenantId = 'tenant_nest_uat';
  const workspaceId = 'ws_wilmington';

  it('retrieves pre-seeded Listing Launch SOP by exact and natural query', () => {
    const res = queryUnifiedContext("Where's the listing launch SOP?", { tenantId, workspaceId });
    
    expect(res.matchedDomain).toBe('sops');
    expect(res.confidence).toBe('high');
    expect(res.spokenAnswer).toContain('Listing Launch Protocol');
    expect(res.spokenAnswer).toContain('Melissa — Transaction Coordinator');
    expect(res.displayResponse).toContain('Listing Launch Protocol');
    expect(res.displayResponse).toContain('12. **Listing Agent**');
    expect(res.evidenceCard).toBeDefined();
    expect(res.evidenceCard?.deepLinkUrl).toContain('/app/ask-nest-ops?tab=sops&sopId=sop_listing_launch_001');
    expect(res.evidenceCard?.title).toContain('Listing Launch Protocol');
  });

  it('retrieves Buyer Contract Verification SOP with BIC review steps', () => {
    const res = queryUnifiedContext('What is the contract verification and EMD audit procedure?', { tenantId, workspaceId });

    expect(res.matchedDomain).toBe('sops');
    expect(res.spokenAnswer).toContain('Buyer Contract Verification');
    expect(res.spokenAnswer).toContain('Eric Knight');
    expect(res.displayResponse).toContain('Earnest Money Deposit');
    expect(res.evidenceCard?.deepLinkUrl).toContain('sop_contract_verification_002');
  });

  it('retrieves Sign Vendor Dispatch SOP', () => {
    const res = queryUnifiedContext('How do we order sign vendor post installations?', { tenantId, workspaceId });

    expect(res.matchedDomain).toBe('sops');
    expect(res.spokenAnswer).toContain('Sign Vendor Dispatch');
    expect(res.evidenceCard?.deepLinkUrl).toContain('sop_sign_vendor_004');
  });

  it('retrieves general catalog overview when asked broadly about SOP handbooks', () => {
    const res = queryUnifiedContext('Show me all active standard operating procedures', { tenantId, workspaceId });

    expect(res.matchedDomain).toBe('sops');
    expect(res.spokenAnswer).toContain('approved operational procedures');
    expect(res.displayResponse).toContain('Listing Launch Protocol');
    expect(res.displayResponse).toContain('Buyer Contract Verification');
    expect(res.evidenceCard?.deepLinkUrl).toBe('/app/ask-nest-ops?tab=sops');
  });

  it('strictly isolates RAG retrieval to published-only policies and reflects newly published SOPs', async () => {
    const customSopId = `sop_custom_open_house_${Date.now()}`;
    const customTitle = `Luxury Waterfront Open House Protocol ${Date.now()}`;
    const customDraftSop: SopDocument = {
      id: customSopId,
      tenantId,
      workspaceId,
      title: customTitle,
      purpose: 'Standard staging and catering procedures for waterfront open house events.',
      trigger: 'Listing priced above 1.5 million dollars entering active market status.',
      processOwner: 'Sarah Jenkins — Luxury Associate',
      participants: ['Listing Agent', 'Catering Vendor', 'Security'],
      prerequisites: ['Active MLS Listing', 'BIC Approval'],
      requiredInputs: ['Property Address', 'Gate Code', 'Catering Budget'],
      orderedSteps: [
        { id: 'st_1', stepNumber: 1, action: 'Arrange valet parking and professional catering.', role: 'Listing Agent', systemUsed: 'Vendor Concierge' },
        { id: 'st_2', stepNumber: 2, action: 'Deploy iPad kiosk with digital buyer check-in registration.', role: 'Host Associate', systemUsed: 'Shapework Kiosk' }
      ],
      decisions: ['If rain forecasted, deploy indoor shoe coverings.'],
      exceptions: ['Gated communities require advance guardhouse clearance.'],
      escalationPaths: ['Security incidents escalate to BIC.'],
      completionEvidence: 'Buyer check-in roster exported to CRM.',
      expectedTiming: '2 hours prior to event start',
      systemsUsed: ['Shapework Kiosk', 'Vendor Concierge'],
      reviewer: 'Eric Knight — BIC',
      publisher: '',
      effectiveDate: '',
      reviewDate: '',
      openQuestions: [],
      status: 'draft',
      author: 'Sarah Jenkins',
      aiAssisted: true,
      transcriptRetention: 'sop_only',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    // 1. Save draft into repository
    await sopRepository.saveDraft(customDraftSop);

    // 2. Query Unified Context Engine — draft MUST NOT be returned as active policy
    const draftRes = queryUnifiedContext(`What is the ${customTitle} procedure?`, { tenantId, workspaceId });
    if (draftRes.matchedDomain === 'sops' && draftRes.evidenceCard?.title) {
      expect(draftRes.evidenceCard.title).not.toBe(customTitle);
    }

    // 3. Publish the SOP
    await sopRepository.publishSop(customSopId, tenantId, 'Ryan Crecelius (Owner)');

    // 4. Query again — published SOP MUST now be immediately retrieved
    const pubRes = queryUnifiedContext(`What is the ${customTitle} procedure?`, { tenantId, workspaceId });
    expect(pubRes.matchedDomain).toBe('sops');
    expect(pubRes.spokenAnswer).toContain(customTitle);
    expect(pubRes.evidenceCard?.deepLinkUrl).toContain(customSopId);
  });

  it('strictly isolates SOP retrieval across tenants', () => {
    const resOtherTenant = queryUnifiedContext('What is the Listing Launch protocol?', {
      tenantId: 'tenant_other_unauthorized',
      workspaceId: 'ws_other'
    });

    // Other tenant should not have access to Nest UAT SOPs
    expect(resOtherTenant.spokenAnswer).not.toContain('Listing Launch Protocol');
  });
});
