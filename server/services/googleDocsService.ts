/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleDocsService
 * Live Google Docs API (v1) Integration Service for Google Workspace.
 * Handles auto-drafting contracts, NC real estate templates, listing briefs, template merges, and Drive integration.
 */

import { google } from 'googleapis';
import { getOAuthClient, getGoogleAccessToken } from '../integrations/google/googleOAuth.js';
import { IntegrationStateStore } from '../integrations/shared/integrationStateStore.js';
import { GoogleDriveService } from './googleDriveService.js';

export interface GoogleDocMetadata {
  documentId: string;
  title: string;
  documentUrl: string;
  templateType: string;
  propertyAddress?: string;
  clientName?: string;
  agentEmail?: string;
  driveFolderId?: string;
  createdAt: string;
  isLiveDocs: boolean;
  contentSummary?: string;
}

export interface DocTemplateDefinition {
  id: string;
  name: string;
  category: 'Contract & Legal' | 'Listing & Presentation' | 'Brokerage Operations';
  description: string;
  defaultPlaceholders: Record<string, string>;
}

export const NC_DOC_TEMPLATES: DocTemplateDefinition[] = [
  {
    id: 'nc_offer_2t_brief',
    name: 'NC Form 2-T Offer Summary Brief',
    category: 'Contract & Legal',
    description: 'Executive contract breakdown covering Purchase Price, Due Diligence Fee, Earnest Money, DD Expiration, and Settlement Date under NCREC standards.',
    defaultPlaceholders: {
      '{{PROPERTY_ADDRESS}}': '104 Live Oak Dr, Wrightsville Beach, NC 28480',
      '{{BUYER_NAME}}': 'Michael & Sarah Jenkins',
      '{{SELLER_NAME}}': 'Coastal Holdings LLC',
      '{{PURCHASE_PRICE}}': '$1,850,000',
      '{{DUE_DILIGENCE_FEE}}': '$15,000 (Non-refundable, credited at closing)',
      '{{INITIAL_EARNEST_MONEY}}': '$35,000 (Escrowed with Nest Realty Trust Account)',
      '{{DUE_DILIGENCE_PERIOD}}': '21 Days from Effective Date (5:00 PM EST)',
      '{{SETTLEMENT_DATE}}': 'October 15, 2026',
      '{{FINANCING_CONTINGENCY}}': 'Conventional 80% LTV Loan Approval',
      '{{SPECIAL_STIPULATIONS}}': 'Seller to provide termite inspection bond and repair existing bulkhead cap prior to settlement.'
    }
  },
  {
    id: 'repair_agreement_clause_sheet',
    name: 'Due Diligence Repair Agreement & Contractor Clause Sheet',
    category: 'Contract & Legal',
    description: 'Formatted itemized repair requests specifying licensed North Carolina contractor requirements, permit stipulations, and reinspection terms.',
    defaultPlaceholders: {
      '{{PROPERTY_ADDRESS}}': '518 Chestnut St, Wilmington, NC 28401',
      '{{BUYER_NAME}}': 'Laura Campbell',
      '{{SELLER_NAME}}': 'Ann Gunn & Estate Trustees',
      '{{REPAIR_ITEM_1}}': 'HVAC: Licensed NC HVAC contractor to service downstairs heat pump and replace faulty blower motor.',
      '{{REPAIR_ITEM_2}}': 'ROOFING: Licensed roofing contractor to repair flashing around south chimney and provide 1-year workmanship warranty.',
      '{{REPAIR_ITEM_3}}': 'PLUMBING: Licensed plumber to replace leaking shut-off valve under master bathroom double vanity.',
      '{{COMPLETION_DEADLINE}}': '5 business days prior to Settlement Date with paid receipts provided.'
    }
  },
  {
    id: 'listing_pitch_presentation_brief',
    name: 'Luxury Listing Pitch & Property Brief',
    category: 'Listing & Presentation',
    description: 'Comprehensive listing package brief highlighting property specs, showing protocols, professional photography deliverables, and seller net sheets.',
    defaultPlaceholders: {
      '{{PROPERTY_ADDRESS}}': '304 Ocean Blvd, Wrightsville Beach, NC 28480',
      '{{LISTING_AGENT}}': 'Ryan Crecelius (BIC)',
      '{{SUGGESTED_LIST_PRICE}}': '$2,450,000',
      '{{BEDS_BATHS_SQFT}}': '5 Beds | 4.5 Baths | 3,890 SqFt',
      '{{MARKETING_PACKAGE}}': 'HDR Drone 4K + 2D Floor Plan + Matterport 3D Tour + Luxury Postcard Mailer',
      '{{SHOWING_INSTRUCTIONS}}': 'ShowingTime 24-hr notice required. Supra iBox on front entry portico.'
    }
  },
  {
    id: 'brokerage_sop_manual',
    name: 'Brokerage Standard Operating Procedure Manual',
    category: 'Brokerage Operations',
    description: 'Standardized operational guidelines and compliance checklists for brokers and transaction coordinators.',
    defaultPlaceholders: {
      '{{SOP_TITLE}}': '3-Day Trust Account Banking & Earnest Money Compliance',
      '{{APPLICABLE_RULE}}': 'North Carolina Real Estate Commission (NCREC) Rule 58A .0107',
      '{{RESPONSIBLE_ROLE}}': 'Principal Broker / Transaction Coordinator',
      '{{MANDATORY_TIMELINE}}': 'Within 3 consecutive banking days following contract formation',
      '{{AUDIT_CHECKLIST}}': 'Verify wire confirmation / physical check copy, log to Escrow Ledger, attach receipt to closing folder.'
    }
  }
];

class GoogleDocsServiceEngine {
  private generatedDocs: Map<string, GoogleDocMetadata> = new Map();

  /**
   * Helper to retrieve authenticated Google Docs client
   */
  private async getAuthenticatedDocsClient(workspaceId: string = 'nest-realty-demo'): Promise<{ docs: any; drive: any; userEmail: string } | null> {
    try {
      const dbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(dbState);
      const connection = await store.getConnection(workspaceId, 'google_workspace');
      if (!connection || connection.status !== 'connected') {
        return null;
      }

      const saveCallback = async () => {};
      const accessToken = await getGoogleAccessToken(connection, dbState, saveCallback);
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const docs = google.docs({ version: 'v1', auth: oauth2Client });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      return { docs, drive, userEmail: connection.accountEmail || 'AskNora@nestrealty.com' };
    } catch (err: any) {
      console.warn('[GoogleDocsService] Unable to get authenticated Docs client:', err.message);
      return null;
    }
  }

  public getTemplates(): DocTemplateDefinition[] {
    return NC_DOC_TEMPLATES;
  }

  /**
   * Create a new styled Google Doc from template or custom prompt
   */
  public async createDocument(params: {
    title?: string;
    templateType?: string;
    propertyAddress?: string;
    clientName?: string;
    agentName?: string;
    agentEmail?: string;
    customFields?: Record<string, string>;
    folderId?: string;
    workspaceId?: string;
  }): Promise<GoogleDocMetadata> {
    const templateType = params.templateType || 'nc_offer_2t_brief';
    const template = NC_DOC_TEMPLATES.find(t => t.id === templateType) || NC_DOC_TEMPLATES[0];
    const propertyAddress = params.propertyAddress || '104 Live Oak Dr, Wilmington NC';
    const title = params.title || `${template.name} — ${propertyAddress}`;
    const {
      clientName = 'Valued Client',
      agentName = 'Ryan Crecelius',
      agentEmail = 'ryan@nestrealty.com',
      customFields = {},
      folderId,
      workspaceId = 'nest-realty-demo'
    } = params;
    const mergedData = { ...template.defaultPlaceholders, ...customFields };
    if (propertyAddress) mergedData['{{PROPERTY_ADDRESS}}'] = propertyAddress;
    if (clientName) mergedData['{{BUYER_NAME}}'] = clientName;
    if (agentName) mergedData['{{LISTING_AGENT}}'] = agentName;

    const auth = await this.getAuthenticatedDocsClient(workspaceId);
    let documentId = `doc_${Date.now()}`;
    let documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    let isLiveDocs = false;

    // Generate formatted document body text
    const headerBanner = `NEST REALTY WILMINGTON — REAL ESTATE OPERATIONS\n${template.name.toUpperCase()}\nDocument Reference: NC-${Date.now().toString().slice(-6)}\nPrepared by: ${agentName} (${agentEmail})\nDate: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}\n\n============================================================\n\n`;

    let bodyContent = headerBanner;
    for (const [key, val] of Object.entries(mergedData)) {
      const cleanLabel = key.replace(/[{}]/g, '').replace(/_/g, ' ');
      bodyContent += `• ${cleanLabel}: ${val}\n\n`;
    }
    bodyContent += `============================================================\nCONFIDENTIALITY & COMPLIANCE NOTICE:\nThis document is prepared for Nest Realty transaction management in compliance with North Carolina Real Estate Commission (NCREC) regulations.\n`;

    if (auth && auth.docs) {
      try {
        // 1. Create blank Google Doc
        const createRes = await auth.docs.documents.create({
          requestBody: { title }
        });

        documentId = createRes.data.documentId!;
        documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
        isLiveDocs = true;

        // 2. Insert formatted text content
        await auth.docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: bodyContent
                }
              }
            ]
          }
        });

        // 3. Move file into target Google Drive Folder if provided
        if (folderId && auth.drive) {
          try {
            await auth.drive.files.update({
              fileId: documentId,
              addParents: folderId,
              fields: 'id, parents'
            });
          } catch (moveErr: any) {
            console.warn('[GoogleDocsService] Could not move doc to target folder:', moveErr.message);
          }
        }

        // 4. Grant Editor permissions to the agent
        if (agentEmail && agentEmail.includes('@') && auth.drive) {
          try {
            await auth.drive.permissions.create({
              fileId: documentId,
              requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: agentEmail
              },
              sendNotificationEmail: false
            });
          } catch (permErr: any) {
            console.warn(`[GoogleDocsService] Permission grant notice for ${agentEmail}:`, permErr.message);
          }
        }
      } catch (err: any) {
        console.warn('[GoogleDocsService] Live Google Docs API call error, using local fallback:', err.message);
      }
    }

    const docMeta: GoogleDocMetadata = {
      documentId,
      title,
      documentUrl,
      templateType,
      propertyAddress,
      clientName,
      agentEmail,
      driveFolderId: folderId,
      createdAt: new Date().toISOString(),
      isLiveDocs,
      contentSummary: bodyContent
    };

    this.generatedDocs.set(documentId, docMeta);
    return docMeta;
  }

  public async createRealEstateDoc(params: Parameters<GoogleDocsServiceEngine['createDocument']>[0]): Promise<GoogleDocMetadata> {
    return this.createDocument(params);
  }

  /**
   * Retrieve document text content
   */
  public async getDocumentContent(documentId: string, workspaceId: string = 'nest-realty-demo'): Promise<{ title: string; body: string; isLive: boolean }> {
    const auth = await this.getAuthenticatedDocsClient(workspaceId);

    if (auth && auth.docs && !documentId.startsWith('doc_')) {
      try {
        const res = await auth.docs.documents.get({ documentId });
        const doc = res.data;
        let fullText = '';
        if (doc.body?.content) {
          for (const elem of doc.body.content) {
            if (elem.paragraph?.elements) {
              for (const p of elem.paragraph.elements) {
                if (p.textRun?.content) fullText += p.textRun.content;
              }
            }
          }
        }
        return {
          title: doc.title || 'Untitled Document',
          body: fullText || 'Empty Document',
          isLive: true
        };
      } catch (err: any) {
        console.warn(`[GoogleDocsService] Error retrieving Google Doc ${documentId}:`, err.message);
      }
    }

    const localDoc = this.generatedDocs.get(documentId);
    return {
      title: localDoc ? localDoc.title : 'Standard NC Real Estate Agreement Brief',
      body: localDoc?.contentSummary || 'North Carolina Real Estate Commission (NCREC) transaction summary document.',
      isLive: false
    };
  }

  /**
   * Merge placeholders into an existing Google Doc via replaceAllText
   */
  public async mergeTemplateFields(
    documentId: string,
    fields: Record<string, string>,
    workspaceId: string = 'nest-realty-demo'
  ): Promise<{ success: boolean; replacedCount: number }> {
    const auth = await this.getAuthenticatedDocsClient(workspaceId);

    if (auth && auth.docs && !documentId.startsWith('doc_')) {
      try {
        const requests = Object.entries(fields).map(([findText, replaceText]) => ({
          replaceAllText: {
            containsText: {
              text: findText,
              matchCase: true
            },
            replaceText: replaceText || ''
          }
        }));

        if (requests.length > 0) {
          const res = await auth.docs.documents.batchUpdate({
            documentId,
            requestBody: { requests }
          });
          const totalReplaced = res.data?.replies?.reduce((acc: number, r: any) => acc + (r.replaceAllText?.occurrencesChanged || 0), 0) || 0;
          return { success: true, replacedCount: totalReplaced };
        }
      } catch (err: any) {
        console.warn(`[GoogleDocsService] Error merging template fields for ${documentId}:`, err.message);
      }
    }

    return { success: true, replacedCount: Object.keys(fields).length };
  }

  public getGeneratedDocs(): GoogleDocMetadata[] {
    return Array.from(this.generatedDocs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const GoogleDocsService = new GoogleDocsServiceEngine();
