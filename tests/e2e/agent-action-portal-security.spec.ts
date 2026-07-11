import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test('Agent Action Portal Security Isolation', async () => {
  const dbState = {
    agentPortals: [
      {
        id: 'ap_1',
        workspaceId: 'nest-realty-demo',
        agentId: 'agent-44',
        actionId: 'wi_123',
        tokenHash: crypto.createHash('sha256').update('valid-agent-token').digest('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ] as any[],
    workItems: [
      { id: 'wi_123', title: 'Upload MLS Screen', status: 'pending' }
    ] as any[]
  };

  const resolveAgentPortal = (token: string) => {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const portal = dbState.agentPortals.find(p => p.tokenHash === hash);
    if (!portal || portal.status !== 'active') return null;

    const workItem = dbState.workItems.find(wi => wi.id === portal.actionId);
    if (!workItem) return null;

    return {
      id: workItem.id,
      title: workItem.title,
      status: workItem.status
    };
  };

  const resolved = resolveAgentPortal('valid-agent-token');
  expect(resolved).not.toBeNull();
  expect(resolved?.title).toBe('Upload MLS Screen');

  const invalid = resolveAgentPortal('invalid-token');
  expect(invalid).toBeNull();
});
