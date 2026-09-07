/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleDriveMcpTools
 * Gemini tool definitions and execution handlers for Google Drive API v3.
 */

import { GoogleDriveService } from '../../services/googleDriveService.js';

export const googleDriveFunctionDeclarations = [
  {
    name: 'search_google_drive',
    description: 'Search Google Drive for brokerage policy documents, SOPs, listing packages, signed disclosures, and templates.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The search keywords or file name.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'scaffold_listing_drive_folder',
    description: 'Create a new organized Google Drive folder for a property listing with standard media, disclosures, and flyer subfolders, shared with the listing agent.',
    parameters: {
      type: 'OBJECT',
      properties: {
        propertyAddress: {
          type: 'STRING',
          description: 'The property address (e.g., "104 Live Oak Dr, Wrightsville Beach NC").'
        },
        agentName: {
          type: 'STRING',
          description: 'The listing agent full name.'
        },
        agentEmail: {
          type: 'STRING',
          description: 'The listing agent @nestrealty.com email address.'
        },
        deliverables: {
          type: 'STRING',
          description: 'Comma-separated deliverables list.'
        }
      },
      required: ['propertyAddress', 'agentName', 'agentEmail']
    }
  }
];

export async function executeGoogleDriveTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'search_google_drive':
      return await GoogleDriveService.searchDriveDocuments(args.query, workspaceId);

    case 'scaffold_listing_drive_folder':
      return await GoogleDriveService.scaffoldListingFolder({
        propertyAddress: args.propertyAddress,
        agentName: args.agentName,
        agentEmail: args.agentEmail,
        deliverables: args.deliverables,
        workspaceId
      });

    default:
      throw new Error(`Unknown Google Drive tool: ${toolName}`);
  }
}
