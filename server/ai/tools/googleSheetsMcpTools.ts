/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleSheetsMcpTools
 * Gemini tool definitions and execution handlers for Google Sheets API (v4).
 */

import { GoogleSheetsService } from '../../services/googleSheetsService.js';

export const googleSheetsFunctionDeclarations = [
  {
    name: 'query_google_sheets_pipeline',
    description: 'Query the Master Operations Google Spreadsheet across tabs: "Pipeline & Listings", "Vendor Work Orders", or "3-Day Escrow & Trust Compliance".',
    parameters: {
      type: 'OBJECT',
      properties: {
        tabName: {
          type: 'STRING',
          description: 'Tab to query: "Pipeline & Listings", "Vendor Work Orders", or "3-Day Escrow & Trust Compliance".'
        },
        query: {
          type: 'STRING',
          description: 'Search keyword (e.g., property address, agent name, or vendor).'
        }
      },
      required: ['tabName']
    }
  },
  {
    name: 'log_escrow_deposit_to_sheets',
    description: 'Log an earnest money deposit to the 3-Day Escrow & Trust Compliance Google Sheet under NCREC Rule 58A.',
    parameters: {
      type: 'OBJECT',
      properties: {
        transactionId: {
          type: 'STRING',
          description: 'Transaction or closing file ID (e.g., "TX-4010").'
        },
        propertyAddress: {
          type: 'STRING',
          description: 'The property address.'
        },
        amount: {
          type: 'STRING',
          description: 'Earnest money amount (e.g., "$25,000.00").'
        },
        escrowHolder: {
          type: 'STRING',
          description: 'Escrow trust holder (e.g., "Nest Realty Escrow Trust" or closing attorney).'
        },
        deadline: {
          type: 'STRING',
          description: '3-banking day deposit deadline date.'
        }
      },
      required: ['transactionId', 'propertyAddress', 'amount', 'escrowHolder']
    }
  }
];

export async function executeGoogleSheetsTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'query_google_sheets_pipeline': {
      const meta = GoogleSheetsService.getMetadata();
      return {
        spreadsheetUrl: meta.spreadsheetUrl,
        tab: args.tabName,
        metadata: meta
      };
    }

    case 'log_escrow_deposit_to_sheets':
      return await GoogleSheetsService.appendRowToSheet({
        tabName: '3-Day Escrow & Trust Compliance',
        rowValues: [
          args.transactionId,
          args.propertyAddress,
          args.amount,
          args.escrowHolder,
          args.deadline || 'Within 3 Banking Days',
          new Date().toISOString().split('T')[0] + ' (Logged via Nora)',
          'Compliant (Rule 58A)'
        ],
        workspaceId
      });

    default:
      throw new Error(`Unknown Google Sheets tool: ${toolName}`);
  }
}
