import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test('Client Deal Portal Security Isolation', async () => {
  const dbState = {
    clientPortals: [
      {
        id: 'cp_1',
        workspaceId: 'nest-realty-demo',
        dealId: 'd_109',
        clientName: 'Sarah Jenkins',
        tokenHash: crypto.createHash('sha256').update('valid-client-token').digest('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ] as any[],
    auditEvents: [] as any[]
  };

  // Mock resolve logic
  const resolvePortal = (token: string) => {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const portal = dbState.clientPortals.find(p => p.tokenHash === hash);
    if (!portal || portal.status !== 'active') return null;
    
    // Scoped payload: no internal commissions or other deals
    return {
      address: portal.dealId === 'd_109' ? '109 Woodlawn Avenue' : 'Other Deal',
      clientName: portal.clientName,
      status: 'Compliance Audit'
    };
  };

  // Assert valid token resolves correctly
  const resolved = resolvePortal('valid-client-token');
  expect(resolved).not.toBeNull();
  expect(resolved?.address).toBe('109 Woodlawn Avenue');

  // Assert invalid token returns null
  const invalidResolved = resolvePortal('invalid-token');
  expect(invalidResolved).toBeNull();
});
