import { test, expect } from '@playwright/test';
import { runOwnerShieldForWorkItem, evaluateOwnerShieldRules } from '../../server/headless/ownerShield';

test('Owner Shield Heuristics and Explainability Logging', async () => {
  const dbState: any = {
    workItems: [],
    ownerShieldDecisions: []
  };

  const workItem = {
    id: 'wi_1',
    ownerRole: 'owner',
    priority: 'low',
    type: 'general',
    status: 'pending'
  };

  // Run Owner Shield evaluation
  const decision = runOwnerShieldForWorkItem(dbState, workItem);

  // Assert decision explains itself clearly
  expect(decision.decision).toBe('deflected');
  expect(decision.rulesTriggered).toContain('owner_low_priority_deflect');
  expect(decision.confidence).toBe(0.95);
  expect(dbState.ownerShieldDecisions).toHaveLength(1);

  // Evaluate metrics blending
  const metrics = evaluateOwnerShieldRules(dbState);
  expect(metrics.routedToStaffCount).toBeGreaterThan(4); // base 4 + 1 deflected = 5
});
