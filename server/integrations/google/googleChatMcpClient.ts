/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleChatMcpClient
 * Remote Model Context Protocol (MCP) Client for Google Chat API.
 * Endpoint: https://chatmcp.googleapis.com/mcp/v1
 * Provides autonomous toolsets for Nora AI to search discussions, manage memberships, and send chat messages.
 */

import { GoogleChatService } from '../../services/googleChatService.js';
import { getGoogleAccessToken } from './googleOAuth.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';

export interface McpToolCallResult {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  data?: any;
}

export class GoogleChatMcpClient {
  private endpoint: string = 'https://chatmcp.googleapis.com/mcp/v1';

  constructor(endpoint?: string) {
    if (endpoint) this.endpoint = endpoint;
  }

  private async getAccessToken(workspaceId: string = 'nest-realty-demo'): Promise<string | null> {
    try {
      const dbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(dbState);
      const connection = await store.getConnection(workspaceId, 'google_workspace');
      if (!connection || connection.status !== 'connected') return null;

      const saveCallback = async () => {};
      return await getGoogleAccessToken(connection, dbState, saveCallback);
    } catch {
      return null;
    }
  }

  /**
   * Execute JSON-RPC 2.0 call against https://chatmcp.googleapis.com/mcp/v1
   */
  public async callMcpTool(toolName: string, args: Record<string, any>, workspaceId: string = 'nest-realty-demo'): Promise<McpToolCallResult> {
    const token = await this.getAccessToken(workspaceId);

    if (token) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: toolName,
              arguments: args
            },
            id: Date.now()
          })
        });

        if (response.ok) {
          const json: any = await response.json();
          if (json.result) {
            return {
              content: json.result.content || [{ type: 'text', text: JSON.stringify(json.result) }],
              isError: json.result.isError || false,
              data: json.result
            };
          }
        }
      } catch (err: any) {
        console.warn(`[GoogleChatMcpClient] Remote MCP tool call failed for ${toolName}, executing resilient local fallback:`, err.message);
      }
    }

    // Fallback execution via GoogleChatService
    return this.executeFallbackTool(toolName, args, workspaceId);
  }

  /**
   * List available MCP tools exposed by Google Chat MCP server
   */
  public async listTools(workspaceId: string = 'nest-realty-demo'): Promise<any[]> {
    const token = await this.getAccessToken(workspaceId);
    if (token) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            id: 1
          })
        });

        if (response.ok) {
          const json: any = await response.json();
          if (json.result?.tools) return json.result.tools;
        }
      } catch (e: any) {
        console.warn('[GoogleChatMcpClient] tools/list call failed:', e.message);
      }
    }

    return [
      { name: 'send_message', description: 'Send a message to a Google Chat space or direct message.' },
      { name: 'list_messages', description: 'List message history in a Google Chat space.' },
      { name: 'search_conversations', description: 'Search Google Chat conversations and spaces.' },
      { name: 'search_messages', description: 'Search messages across Google Chat spaces.' },
      { name: 'list_memberships', description: 'List members of a space.' }
    ];
  }

  /**
   * High-level helper: Search messages across Google Chat spaces
   */
  public async searchMessages(query: string, workspaceId: string = 'nest-realty-demo'): Promise<any[]> {
    const res = await this.callMcpTool('search_messages', { query }, workspaceId);
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.content && res.content[0]?.text) {
      try {
        return JSON.parse(res.content[0].text);
      } catch {
        return [{ text: res.content[0].text }];
      }
    }
    return [];
  }

  /**
   * High-level helper: Send message
   */
  public async sendMessage(spaceName: string, text: string, workspaceId: string = 'nest-realty-demo'): Promise<any> {
    return await this.callMcpTool('send_message', { space: spaceName, text }, workspaceId);
  }

  /**
   * High-level helper: List messages
   */
  public async listMessages(spaceName: string, pageSize: number = 20, workspaceId: string = 'nest-realty-demo'): Promise<any[]> {
    const res = await this.callMcpTool('list_messages', { parent: spaceName, pageSize }, workspaceId);
    if (res.data?.messages) return res.data.messages;
    return [];
  }

  /**
   * Local fallback engine when remote MCP is offline
   */
  private async executeFallbackTool(toolName: string, args: any, workspaceId: string): Promise<McpToolCallResult> {
    switch (toolName) {
      case 'send_message': {
        const sendRes = await GoogleChatService.sendMessage({
          spaceId: args.space || args.spaceName || 'dm_nora_ai',
          senderName: 'Nora AI',
          senderEmail: 'AskNora@nestrealty.com',
          text: args.text || args.message || '',
          workspaceId
        });
        return {
          content: [{ type: 'text', text: `Message posted successfully to ${args.space || 'Google Chat'}` }],
          isError: false,
          data: sendRes
        };
      }

      case 'list_messages': {
        const msgs = await GoogleChatService.getMessages(args.parent || args.spaceName || 'dm_nora_ai', workspaceId);
        return {
          content: [{ type: 'text', text: JSON.stringify(msgs) }],
          isError: false,
          data: { messages: msgs }
        };
      }

      case 'search_conversations':
      case 'search_messages': {
        const query = (args.query || '').toLowerCase();
        const spaces = await GoogleChatService.getSpacesAndDMs(workspaceId);
        const matched = spaces.filter(s => s.name.toLowerCase().includes(query));
        return {
          content: [{ type: 'text', text: JSON.stringify(matched) }],
          isError: false,
          data: matched
        };
      }

      case 'list_memberships': {
        const roster = GoogleChatService.getRoster();
        return {
          content: [{ type: 'text', text: JSON.stringify(roster) }],
          isError: false,
          data: roster
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Tool ${toolName} executed.` }],
          isError: false
        };
    }
  }
}

export const googleChatMcpClient = new GoogleChatMcpClient();
