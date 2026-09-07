import { describe, it, expect } from 'vitest';
import { googleChatMcpClient } from '../../server/integrations/google/googleChatMcpClient.js';
import { executeGoogleChatTool } from '../../server/ai/tools/googleChatMcpTools.js';

describe('Google Chat Remote MCP Client Suite', () => {
  it('1. Lists standard MCP tools exposed by Google Chat MCP server', async () => {
    const tools = await googleChatMcpClient.listTools();
    expect(tools.length).toBeGreaterThanOrEqual(4);
    expect(tools.some((t: any) => t.name === 'send_message')).toBe(true);
    expect(tools.some((t: any) => t.name === 'list_messages')).toBe(true);
    expect(tools.some((t: any) => t.name === 'search_messages' || t.name === 'search_conversations')).toBe(true);
  });

  it('2. Dispatches send_message tool call with valid structure', async () => {
    const res = await googleChatMcpClient.sendMessage('dm_nora_ai', 'Testing Remote MCP notification broadcast');
    expect(res.isError).toBe(false);
    expect(res.content).toBeDefined();
  });

  it('3. Searches conversations and message history via MCP', async () => {
    const results = await googleChatMcpClient.searchMessages('Nora');
    expect(results).toBeDefined();
  });

  it('4. Executes Google Chat tools via Nora AI tool caller', async () => {
    const sendRes = await executeGoogleChatTool('post_google_chat_message', {
      spaceName: 'dm_nora_ai',
      message: 'Nora AI automated compliance notification'
    });
    expect(sendRes.isError).toBe(false);

    const membersRes = await executeGoogleChatTool('list_google_chat_members', {
      spaceName: 'space_wilmington_all'
    });
    expect(membersRes.isError).toBe(false);
  });
});
