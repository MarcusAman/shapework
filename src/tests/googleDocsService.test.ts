import { describe, it, expect } from 'vitest';
import { GoogleDocsService, NC_DOC_TEMPLATES } from '../../server/services/googleDocsService.js';
import { executeGoogleDocsTool } from '../../server/ai/tools/googleDocsMcpTools.js';

describe('Google Docs API (v1) Service Suite', () => {
  it('1. Provides all 4 pre-styled North Carolina real estate templates', () => {
    const templates = GoogleDocsService.getTemplates();
    expect(templates.length).toBe(4);
    expect(templates.some(t => t.id === 'nc_offer_2t_brief')).toBe(true);
    expect(templates.some(t => t.id === 'repair_agreement_clause_sheet')).toBe(true);
    expect(templates.some(t => t.id === 'listing_pitch_presentation_brief')).toBe(true);
    expect(templates.some(t => t.id === 'brokerage_sop_manual')).toBe(true);
  });

  it('2. Creates a styled NC Form 2-T Offer Summary Brief Google Doc', async () => {
    const doc = await GoogleDocsService.createDocument({
      title: 'Offer Summary - 104 Live Oak Dr (Jenkins)',
      templateType: 'nc_offer_2t_brief',
      propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC',
      clientName: 'Michael & Sarah Jenkins',
      agentName: 'Ryan Crecelius',
      agentEmail: 'ryan@nestrealty.com',
      customFields: {
        '{{PURCHASE_PRICE}}': '$1,925,000',
        '{{DUE_DILIGENCE_FEE}}': '$20,000'
      }
    });

    expect(doc.documentId).toBeDefined();
    expect(doc.title).toContain('104 Live Oak Dr');
    expect(doc.documentUrl).toContain(doc.documentId);
    expect(doc.contentSummary).toContain('104 Live Oak Dr');
    expect(doc.contentSummary).toContain('$1,925,000');
  });

  it('3. Creates a Due Diligence Repair Agreement Clause Sheet', async () => {
    const doc = await GoogleDocsService.createDocument({
      title: 'Repair Agreement - 518 Chestnut St',
      templateType: 'repair_agreement_clause_sheet',
      propertyAddress: '518 Chestnut St, Wilmington NC',
      clientName: 'Laura Campbell',
      agentName: 'Ann Gunn',
      agentEmail: 'ann.gunn@nestrealty.com'
    });

    expect(doc.documentId).toBeDefined();
    expect(doc.contentSummary).toContain('518 Chestnut St');
    expect(doc.contentSummary).toContain('HVAC');
  });

  it('4. Merges template tags and placeholders into existing document', async () => {
    const mergeRes = await GoogleDocsService.mergeTemplateFields('doc_sample_123', {
      '{{SETTLEMENT_DATE}}': 'November 1, 2026',
      '{{PURCHASE_PRICE}}': '$2,100,000'
    });

    expect(mergeRes.success).toBe(true);
    expect(mergeRes.replacedCount).toBe(2);
  });

  it('5. Executes Google Docs tools via Nora AI tool caller', async () => {
    const toolDoc = await executeGoogleDocsTool('create_real_estate_google_doc', {
      title: 'Listing Brief - 304 Ocean Blvd',
      templateType: 'listing_pitch_presentation_brief',
      propertyAddress: '304 Ocean Blvd, Wrightsville Beach NC',
      agentName: 'Ryan Crecelius',
      agentEmail: 'ryan@nestrealty.com'
    });

    expect(toolDoc.documentId).toBeDefined();
    expect(toolDoc.title).toBe('Listing Brief - 304 Ocean Blvd');

    const contentRes = await executeGoogleDocsTool('read_google_doc_content', {
      documentId: toolDoc.documentId
    });

    expect(contentRes.title).toBeDefined();
    expect(contentRes.body).toBeDefined();
  });
});
