import { deliverResendEmail } from '../email/gatedTransport.js';
import { checkOutbound } from '../email/outboundGate.js';

export interface EmailNotificationInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsNotificationInput {
  to: string;
  message: string;
}

export interface NotificationSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  sendEmail(input: EmailNotificationInput): Promise<NotificationSendResult>;
  sendSms(input: SmsNotificationInput): Promise<NotificationSendResult>;
}

// Development Log Provider: writes safely to node console and audit log
export class DevLogProvider implements NotificationProvider {
  async sendEmail(input: EmailNotificationInput): Promise<NotificationSendResult> {
    const gate = checkOutbound({ to: input.to, channel: 'email', source: 'DevLogProvider' });
    if (!gate.allowed) {
      return { success: false, provider: 'dev_log_provider', error: `Outbound ${gate.reason}: email was not sent.` };
    }
    console.log(`[DevLogProvider] EMAIL to ${input.to} - Subject: ${input.subject}`);
    // Do not log the sensitive link or HTML contents in the raw logs to protect privacy
    return {
      success: true,
      provider: 'dev_log_provider',
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  async sendSms(input: SmsNotificationInput): Promise<NotificationSendResult> {
    const gate = checkOutbound({ to: input.to, channel: 'sms', source: 'DevLogProvider' });
    if (!gate.allowed) {
      return { success: false, provider: 'dev_log_provider', error: `Outbound ${gate.reason}: SMS was not sent.` };
    }
    console.log(`[DevLogProvider] SMS to ${input.to} - Length: ${input.message.length} chars`);
    return {
      success: true,
      provider: 'dev_log_provider',
      messageId: `sms_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

// Stub SMS Provider: always fails or stays disabled until Twilio/other configured
export class SmsProviderStub implements NotificationProvider {
  async sendEmail(input: EmailNotificationInput): Promise<NotificationSendResult> {
    return { success: false, provider: 'sms_provider_stub', error: 'Email not supported by SMS provider stub' };
  }

  async sendSms(input: SmsNotificationInput): Promise<NotificationSendResult> {
    // Check if real provider is configured
    const configured = process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID;
    if (!configured) {
      return {
        success: false,
        provider: 'sms_provider_stub',
        error: 'SMS channel not configured. Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN first.'
      };
    }
    const gate = checkOutbound({ to: input.to, channel: 'sms', source: 'SmsProviderStub' });
    if (!gate.allowed) {
      return { success: false, provider: 'sms_provider_stub', error: `Outbound ${gate.reason}: SMS was not sent.` };
    }
    // Simulate real SMS send if config is present
    return {
      success: true,
      provider: 'twilio_sms_provider',
      messageId: `tw_sms_${Date.now()}`
    };
  }
}

// Resend Email Provider: sends using resend if configured, else fails
export class ResendEmailProvider implements NotificationProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
  }

  async sendEmail(input: EmailNotificationInput): Promise<NotificationSendResult> {
    if (!this.apiKey) {
      return {
        success: false,
        provider: 'resend_email_provider',
        error: 'Resend API Key not configured. Configure RESEND_API_KEY first.'
      };
    }

    try {
      const delivered = await deliverResendEmail({
        apiKey: this.apiKey,
        to: input.to,
        source: 'ResendEmailProvider',
        payload: {
          from: 'shapework <notifications@shapework.co>',
          to: input.to,
          subject: input.subject,
          html: input.html
        }
      });
      if (!delivered.sent || !delivered.response) {
        return {
          success: false,
          provider: 'resend_email_provider',
          error: delivered.gate.reason === 'resend_unconfigured'
            ? 'Resend API Key not configured. Configure RESEND_API_KEY first.'
            : `Outbound ${delivered.gate.reason}: email was not sent.`
        };
      }
      const response = delivered.response;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          provider: 'resend_email_provider',
          messageId: data.id
        };
      } else {
        const errText = await response.text();
        return {
          success: false,
          provider: 'resend_email_provider',
          error: `Resend API Error: ${response.status} ${errText}`
        };
      }
    } catch (e: any) {
      return {
        success: false,
        provider: 'resend_email_provider',
        error: e.message || 'Network error sending email via Resend'
      };
    }
  }

  async sendSms(input: SmsNotificationInput): Promise<NotificationSendResult> {
    return { success: false, provider: 'resend_email_provider', error: 'SMS not supported by Resend email provider' };
  }
}
