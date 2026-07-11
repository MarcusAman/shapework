import { test, expect } from '@playwright/test';
import { ResendEmailProvider, SmsProviderStub, DevLogProvider } from '../../server/notifications/notificationProvider.js';

test('notification provider safety verification under different configs', async () => {
  // 1. DevLogProvider: must always succeed and return msg IDs
  const devProvider = new DevLogProvider();
  
  const devEmailRes = await devProvider.sendEmail({
    to: 'marcus@nestrealty.com',
    subject: 'Dev Test',
    html: '<p>Dev</p>'
  });
  expect(devEmailRes.success).toBe(true);
  expect(devEmailRes.provider).toBe('dev_log_provider');
  expect(devEmailRes.messageId).toBeDefined();

  const devSmsRes = await devProvider.sendSms({
    to: '919-555-0101',
    message: 'Dev SMS'
  });
  expect(devSmsRes.success).toBe(true);
  expect(devSmsRes.provider).toBe('dev_log_provider');
  expect(devSmsRes.messageId).toBeDefined();

  // 2. ResendEmailProvider: must fail safely when API key is missing
  // Temporarily unset key in process.env for the provider constructor
  const origKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  
  const resendProvider = new ResendEmailProvider();
  const resendEmailRes = await resendProvider.sendEmail({
    to: 'marcus@nestrealty.com',
    subject: 'Production Test',
    html: '<p>Production</p>'
  });
  expect(resendEmailRes.success).toBe(false);
  expect(resendEmailRes.error).toContain('Resend API Key not configured');

  // Restore key
  if (origKey) process.env.RESEND_API_KEY = origKey;

  // 3. SmsProviderStub: must fail safely when Twilio config is missing
  const origSid = process.env.TWILIO_ACCOUNT_SID;
  const origToken = process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;

  const smsProvider = new SmsProviderStub();
  const smsRes = await smsProvider.sendSms({
    to: '919-555-0101',
    message: 'Production SMS'
  });
  expect(smsRes.success).toBe(false);
  expect(smsRes.error).toContain('SMS channel not configured');

  // Restore Twilio configs
  if (origSid) process.env.TWILIO_ACCOUNT_SID = origSid;
  if (origToken) process.env.TWILIO_AUTH_TOKEN = origToken;
});
