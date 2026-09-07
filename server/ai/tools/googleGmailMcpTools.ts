/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleGmailMcpTools
 * Gemini tool definitions and execution handlers for Gmail API (v1).
 */

import { GoogleGmailService } from '../../services/googleGmailService.js';

export const googleGmailFunctionDeclarations = [
  {
    name: 'stage_gmail_draft',
    description: 'Stage an email draft in the Human-in-the-Loop review queue and sync it to Gmail Drafts for broker review before sending.',
    parameters: {
      type: 'OBJECT',
      properties: {
        recipient: {
          type: 'STRING',
          description: 'Recipient email address (e.g. "dave@coastalsignposts.com").'
        },
        recipientName: {
          type: 'STRING',
          description: 'Recipient name (e.g. "Dave Vance (Coastal Sign Post Co.)").'
        },
        subject: {
          type: 'STRING',
          description: 'Email subject line.'
        },
        body: {
          type: 'STRING',
          description: 'Email message content.'
        },
        category: {
          type: 'STRING',
          description: 'Category: "Vendor Coordination", "Contract & Escrow", "Client Follow-up", or "Brokerage Operations".'
        },
        propertyAddress: {
          type: 'STRING',
          description: 'Related property address.'
        }
      },
      required: ['recipient', 'recipientName', 'subject', 'body']
    }
  },
  {
    name: 'send_approved_gmail',
    description: 'Dispatch an approved staged email draft immediately via the Gmail API.',
    parameters: {
      type: 'OBJECT',
      properties: {
        draftId: {
          type: 'STRING',
          description: 'The ID of the staged draft to send.'
        }
      },
      required: ['draftId']
    }
  },
  {
    name: 'search_gmail_threads',
    description: 'Search Gmail messages and threads for client conversations, vendor quotes, or contract receipts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search keyword, sender email, or property address.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'parse_vendor_email_update',
    description: 'Parse an incoming vendor email reply (e.g. photo proof of sign post install or media shoot completion) and automatically mark the corresponding task complete in Shapework.',
    parameters: {
      type: 'OBJECT',
      properties: {
        emailText: {
          type: 'STRING',
          description: 'Full text body of the vendor email.'
        },
        senderEmail: {
          type: 'STRING',
          description: 'The sender email address.'
        }
      },
      required: ['emailText', 'senderEmail']
    }
  }
];

export async function executeGoogleGmailTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'stage_gmail_draft':
      return await GoogleGmailService.stageDraft({
        recipient: args.recipient,
        recipientName: args.recipientName,
        subject: args.subject,
        body: args.body,
        category: args.category,
        propertyAddress: args.propertyAddress,
        workspaceId
      });

    case 'send_approved_gmail':
      return await GoogleGmailService.sendDraft(args.draftId, workspaceId);

    case 'search_gmail_threads':
      return await GoogleGmailService.searchThreads(args.query, workspaceId);

    case 'parse_vendor_email_update':
      return await GoogleGmailService.parseInboundVendorReply({
        emailText: args.emailText,
        senderEmail: args.senderEmail,
        workspaceId
      });

    default:
      throw new Error(`Unknown Google Gmail tool: ${toolName}`);
  }
}
