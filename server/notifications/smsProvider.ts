import { logNotificationAudit } from './notificationTypes.js';
import { maskPhoneNumber } from './smsSafety.js';

export type SmsProviderMode = 'disabled' | 'dev_log' | 'test_allowlist' | 'production';

export async function sendSmsNotification(
  dbState: any,
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = (process.env.SMS_PROVIDER || 'disabled') as SmsProviderMode;
  const allowlistStr = process.env.SMS_TEST_ALLOWLIST || '';
  const allowlist = allowlistStr.split(',').map(num => num.trim()).filter(Boolean);
  const fromNumber = process.env.SMS_FROM_NUMBER || '';

  // Mask target phone for audit logging using our safety module
  const maskedTo = maskPhoneNumber(to);

  const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';

  if (isProduction && provider === 'dev_log') {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `SMS to ${maskedTo} failed: dev_log provider mode is blocked in production.`,
      'notifications'
    );
    return { success: false, error: 'dev_log mode is not allowed in production.' };
  }

  if (provider === 'disabled') {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `SMS to ${maskedTo} suppressed: SMS provider is disabled.`,
      'notifications'
    );
    return { success: false, error: 'SMS provider is disabled.' };
  }

  if (provider === 'dev_log') {
    console.log(`[DevLogProvider] SMS to ${maskedTo} - Length: ${body.length} chars\nBody: ${body}`);
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `SMS preview printed to console for ${maskedTo} (dev_log mode).`,
      'notifications'
    );
    return { success: true, messageId: `msg_dev_${Date.now()}` };
  }

  if (provider === 'test_allowlist') {
    if (!allowlist.includes(to)) {
      logNotificationAudit(
        dbState,
        'System',
        'system',
        `SMS to ${maskedTo} suppressed: Number is not on SMS_TEST_ALLOWLIST.`,
        'notifications'
      );
      return { success: false, error: 'Recipient not on test allowlist.' };
    }
    // Proceed to dispatching via Twilio if allowlisted
  }

  // Twilio HTTP request dispatch
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken) {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `SMS to ${maskedTo} failed: Twilio credentials not configured.`,
      'notifications'
    );
    return { success: false, error: 'Twilio credentials not configured.' };
  }

  try {
    const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', to);
    params.append('Body', body);
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else if (fromNumber) {
      params.append('From', fromNumber);
    } else {
      throw new Error('Neither Twilio MessagingServiceSid nor SMS_FROM_NUMBER is configured.');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json() as any;

    if (response.ok) {
      logNotificationAudit(
        dbState,
        'System',
        'system',
        `SMS sent successfully to ${maskedTo} (Twilio Msg SID: ${data.sid})`,
        'notifications'
      );
      return { success: true, messageId: data.sid };
    } else {
      const errMessage = data.message || `Twilio HTTP status ${response.status}`;
      logNotificationAudit(
        dbState,
        'System',
        'system',
        `SMS dispatch failed to ${maskedTo}: ${errMessage}`,
        'notifications'
      );
      return { success: false, error: errMessage };
    }
  } catch (err: any) {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `SMS dispatch error to ${maskedTo}: ${err.message}`,
      'notifications'
    );
    return { success: false, error: err.message };
  }
}
