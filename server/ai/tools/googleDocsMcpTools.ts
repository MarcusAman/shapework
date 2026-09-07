/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleDocsMcpTools
 * Gemini tool definitions and execution handlers for Google Docs API (v1).
 */

import { GoogleDocsService } from '../../services/googleDocsService.js';

export const googleDocsFunctionDeclarations = [
  {
    name: 'create_real_estate_google_doc',
    description: 'Generate a polished Google Doc for real estate operations (NC Offer 2-T Brief, Due Diligence Repair Clause Sheet, Listing Pitch Brief, or Brokerage SOP) and automatically save it to Google Drive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Title of the Google Doc.'
        },
        templateType: {
          type: 'STRING',
          description: 'Template type: "nc_offer_2t_brief", "repair_agreement_clause_sheet", "listing_pitch_presentation_brief", or "brokerage_sop_manual".'
        },
        propertyAddress: {
          type: 'STRING',
          description: 'Property address.'
        },
        clientName: {
          type: 'STRING',
          description: 'Buyer or client name.'
        },
        agentName: {
          type: 'STRING',
          description: 'Broker or agent name.'
        },
        agentEmail: {
          type: 'STRING',
          description: 'Broker or agent @nestrealty.com email.'
        },
        customFields: {
          type: 'OBJECT',
          description: 'Key-value pairs for placeholders (e.g. {"{{PURCHASE_PRICE}}": "$1,950,000"}).'
        }
      },
      required: ['title', 'templateType']
    }
  },
  {
    name: 'read_google_doc_content',
    description: 'Read and analyze the text and contract terms inside a Google Doc by its Document ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        documentId: {
          type: 'STRING',
          description: 'The Google Doc document ID.'
        }
      },
      required: ['documentId']
    }
  },
  {
    name: 'merge_google_doc_fields',
    description: 'Replace template tags/placeholders in a Google Doc with real transaction values.',
    parameters: {
      type: 'OBJECT',
      properties: {
        documentId: {
          type: 'STRING',
          description: 'The Google Doc ID.'
        },
        fields: {
          type: 'OBJECT',
          description: 'Object mapping search tags to replacement text.'
        }
      },
      required: ['documentId', 'fields']
    }
  }
];

export async function executeGoogleDocsTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'create_real_estate_google_doc':
      return await GoogleDocsService.createDocument({
        title: args.title,
        templateType: args.templateType,
        propertyAddress: args.propertyAddress,
        clientName: args.clientName,
        agentName: args.agentName,
        agentEmail: args.agentEmail,
        customFields: args.customFields,
        workspaceId
      });

    case 'read_google_doc_content':
      return await GoogleDocsService.getDocumentContent(args.documentId, workspaceId);

    case 'merge_google_doc_fields':
      return await GoogleDocsService.mergeTemplateFields(args.documentId, args.fields, workspaceId);

    default:
      throw new Error(`Unknown Google Docs tool: ${toolName}`);
  }
}
