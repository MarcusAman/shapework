import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { createHeadlessAction, resolveHeadlessAction, completeHeadlessAction } from '../../server/headless/headlessActionRules';

test('Headless Actions Token Deep Security Heuristics', async () => {
  const dbState = {
    headlessActions: [] as any[],
    auditEvents: [] as any[]
  };

  // 1. Create a secure action
  const { token, action } = createHeadlessAction(
    dbState,
    'tenant-a',
    'complete_work_item',
    'work_item',
    'wi_abc123',
    { recipientStaffMemberId: 'staff-99' }
  );

  // Assert token hash matches SHA-256
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  expect(action.secureTokenHash).toBe(hash);

  // 2. Resolve token (transitions to clicked)
  const resolved = resolveHeadlessAction(dbState, token);
  expect(resolved).not.toBeNull();
  expect(resolved?.workspaceId).toBe('tenant-a');
  expect(resolved?.status).toBe('clicked');

  // 3. Complete action
  const completed = completeHeadlessAction(dbState, token);
  expect(completed).toBe(true);

  // 4. Double completion / reuse must fail
  const resolvedAgain = resolveHeadlessAction(dbState, token);
  expect(resolvedAgain).toBeNull();
});
