import { test, expect } from '@playwright/test';
import { isPrivateAddress, validateWebhookUrl } from '../../server/headless/webhookDispatcher';

test('Webhook Dispatcher SSRF Safeguards', async () => {
  // Test private address checks
  expect(isPrivateAddress('localhost')).toBe(true);
  expect(isPrivateAddress('127.0.0.1')).toBe(true);
  expect(isPrivateAddress('192.168.1.1')).toBe(true);
  expect(isPrivateAddress('10.0.0.15')).toBe(true);
  expect(isPrivateAddress('169.254.169.254')).toBe(true);
  expect(isPrivateAddress('google.com')).toBe(false);

  // Set environment to mock production validation behavior
  process.env.APP_MODE = 'production';
  expect(validateWebhookUrl('http://127.0.0.1/callback')).toBe(false);
  expect(validateWebhookUrl('https://api.stripe.com/callback')).toBe(true);

  // Restore dev mode
  process.env.APP_MODE = 'development';
});
