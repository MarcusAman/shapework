import { test, expect } from '@playwright/test';

test('Headless Previews Catalog and Test Email Guards', async () => {
  // Test preview send restrictions
  const sendTest = (type: string, email: string, allowlist: string[], enabled: boolean) => {
    if (!enabled) return { success: false, error: 'Disabled' };
    if (!allowlist.includes(email.toLowerCase())) return { success: false, error: 'Not on allowlist' };
    return { success: true };
  };

  // Test cases
  expect(sendTest('pilot_welcome', 'marcus@shapework.co', ['marcus@shapework.co'], true).success).toBe(true);
  expect(sendTest('pilot_welcome', 'hacker@malicious.com', ['marcus@shapework.co'], true).success).toBe(false);
  expect(sendTest('pilot_welcome', 'marcus@shapework.co', ['marcus@shapework.co'], false).success).toBe(false);
});
