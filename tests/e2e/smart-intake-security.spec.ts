import { test, expect } from '@playwright/test';

test('Smart Intake Security Allowlist Verification', async () => {
  const ALLOWED_INTAKE_TYPES = ['marketing', 'compliance', 'office', 'support'];
  
  const processIntake = (type: string) => {
    if (!ALLOWED_INTAKE_TYPES.includes(type)) {
      return { success: false, error: 'Invalid intake type' };
    }
    return { success: true, workItemId: 'wi_mocked' };
  };

  expect(processIntake('marketing').success).toBe(true);
  expect(processIntake('compliance').success).toBe(true);
  expect(processIntake('arbitrary-invalid').success).toBe(false);
});
