/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleChatMcpTools
 * Gemini tool definitions and execution handlers for Google Chat Remote MCP.
 */

import { googleChatMcpClient } from '../../integrations/google/googleChatMcpClient.js';

export const googleChatFunctionDeclarations = [
  {
    name: 'search_google_chat_discussions',
    description: 'Search Google Chat space history and broker discussions across the Nest Realty workspace.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Keyword, broker name, or topic to search for in Google Chat.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'post_google_chat_message',
    description: 'Send a message or operational alert to a Google Chat space or direct message thread.',
    parameters: {
      type: 'OBJECT',
      properties: {
        spaceName: {
          type: 'STRING',
          description: 'The Google Chat space ID or name (e.g. "Ask Nora", "spaces/AAAAxxxx", or "dm_ryan_crecelius").'
        },
        message: {
          type: 'STRING',
          description: 'The text message to post into Google Chat.'
        }
      },
      required: ['spaceName', 'message']
    }
  },
  {
    name: 'list_google_chat_members',
    description: 'Get the active members and brokers participating in a Google Chat space.',
    parameters: {
      type: 'OBJECT',
      properties: {
        spaceName: {
          type: 'STRING',
          description: 'The name or ID of the Google Chat space.'
        }
      },
      required: ['spaceName']
    }
  }
];

export async function executeGoogleChatTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'search_google_chat_discussions':
      return await googleChatMcpClient.searchMessages(args.query, workspaceId);

    case 'post_google_chat_message':
      return await googleChatMcpClient.sendMessage(args.spaceName, args.message, workspaceId);

    case 'list_google_chat_members':
      return await googleChatMcpClient.callMcpTool('list_memberships', { parent: args.spaceName }, workspaceId);

    default:
      throw new Error(`Unknown Google Chat tool: ${toolName}`);
  }
}
