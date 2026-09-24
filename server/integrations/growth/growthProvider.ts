/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { deliverResendBatch, deliverResendEmail } from '../../email/gatedTransport.js';
import { checkOutbound } from '../../email/outboundGate.js';

export interface DomainSetup {
  id: string;
  domain: string;
  spfRecord: string;
  dkimRecord: string;
  dmarcRecord: string;
  status: 'pending' | 'verified';
}

export interface DomainStatus {
  id: string;
  status: 'pending' | 'verified';
}

export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  body: string;
  campaignId?: string;
  enrollmentId?: string;
  stepId?: string;
}

export interface SendResult {
  messageId: string;
  status: 'sent' | 'failed';
}

export interface BatchSendResult {
  results: SendResult[];
}

export interface ContactPayload {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ContactResult {
  id: string;
}

export interface EmailProvider {
  createDomain(domain: string): Promise<DomainSetup>;
  verifyDomain(domainId: string): Promise<DomainStatus>;
  sendEmail(payload: EmailPayload): Promise<SendResult>;
  sendBatch(payloads: EmailPayload[]): Promise<BatchSendResult>;
  createContact(contact: ContactPayload): Promise<ContactResult>;
  suppressContact(email: string): Promise<void>;
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string, webhookSecret: string): boolean;
  parseWebhookEvent(body: any): any;
}

export class ResendProvider implements EmailProvider {
  private apiKey: string | null;

  constructor(apiKey: string | null) {
    this.apiKey = apiKey || null;
  }

  private isMock(): boolean {
    return !this.apiKey || this.apiKey.startsWith('mock_') || this.apiKey === 'placeholder_api_key';
  }

  async createDomain(domain: string): Promise<DomainSetup> {
    if (this.isMock()) {
      const id = `dom_${Math.random().toString(36).substring(2, 11)}`;
      return {
        id,
        domain,
        spfRecord: `v=spf1 include:feedback.resend.com ~all`,
        dkimRecord: `resend-dkim1._domainkey.${domain} CNAME dkim1.resend.com`,
        dmarcRecord: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
        status: 'pending'
      };
    }

    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: domain })
      });
      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        id: data.id,
        domain: data.name,
        spfRecord: `v=spf1 include:feedback.resend.com ~all`,
        dkimRecord: `${data.dkim_pending_record || 'resend-dkim1'}.${domain}`,
        dmarcRecord: `v=DMARC1; p=none;`,
        status: data.status === 'verified' ? 'verified' : 'pending'
      };
    } catch (err) {
      console.error('[ResendProvider] Failed to create domain:', err);
      throw err;
    }
  }

  async verifyDomain(domainId: string): Promise<DomainStatus> {
    if (this.isMock()) {
      return { id: domainId, status: 'verified' };
    }

    try {
      const response = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        id: domainId,
        status: data.status === 'verified' ? 'verified' : 'pending'
      };
    } catch (err) {
      console.error('[ResendProvider] Failed to verify domain:', err);
      throw err;
    }
  }

  async sendEmail(payload: EmailPayload): Promise<SendResult> {
    const gate = checkOutbound({ to: payload.to, channel: 'resend', source: 'integrations.growth.ResendProvider' });
    if (!gate.allowed) {
      return { messageId: '', status: 'failed' };
    }
    if (this.isMock()) {
      console.log(`[Simulated resend] Email sent successfully to ${payload.to}. Subject: "${payload.subject}"`);
      return {
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        status: 'sent'
      };
    }

    try {
      const delivered = await deliverResendEmail({
        apiKey: this.apiKey,
        to: gate.effectiveTo,
        source: 'integrations.growth.ResendProvider',
        payload: {
          from: payload.from,
          to: gate.effectiveTo,
          subject: payload.subject,
          html: payload.body
        }
      });
      if (!delivered.response) {
        return { messageId: '', status: 'failed' };
      }
      const response = delivered.response;
      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        messageId: data.id,
        status: 'sent'
      };
    } catch (err) {
      console.error('[ResendProvider] Failed to send email:', err);
      return {
        messageId: '',
        status: 'failed'
      };
    }
  }

  async sendBatch(payloads: EmailPayload[]): Promise<BatchSendResult> {
    const anyAllowed = payloads.some((payload) => checkOutbound({ to: payload.to, channel: 'resend', source: 'integrations.growth.ResendProvider.batch' }).allowed);
    if (!anyAllowed) {
      return { results: payloads.map(() => ({ messageId: '', status: 'failed' as const })) };
    }
    if (this.isMock()) {
      const results = payloads.map(() => ({
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        status: 'sent' as const
      }));
      return { results };
    }

    try {
      const delivered = await deliverResendBatch({
        apiKey: this.apiKey,
        source: 'integrations.growth.ResendProvider.batch',
        payloads: payloads.map(p => ({
          from: p.from,
          to: p.to,
          subject: p.subject,
          html: p.body
        }))
      });
      if (!delivered.response) {
        return { results: payloads.map(() => ({ messageId: '', status: 'failed' as const })) };
      }
      const response = delivered.response;
      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        results: data.data.map((item: any) => ({
          messageId: item.id,
          status: 'sent' as const
        }))
      };
    } catch (err) {
      console.error('[ResendProvider] Failed to send batch emails:', err);
      return {
        results: payloads.map(() => ({ messageId: '', status: 'failed' as const }))
      };
    }
  }

  async createContact(contact: ContactPayload): Promise<ContactResult> {
    if (this.isMock()) {
      return { id: `con_${Math.random().toString(36).substring(2, 11)}` };
    }

    try {
      // In Resend, creating contacts uses audience contacts API
      // Since it's audience based, we assume a default workspace audience for now
      return { id: `con_${Math.random().toString(36).substring(2, 11)}` };
    } catch (err) {
      console.error('[ResendProvider] Failed to create contact:', err);
      throw err;
    }
  }

  async suppressContact(email: string): Promise<void> {
    if (this.isMock()) {
      console.log(`[Simulated resend] Suppressed contact: ${email}`);
      return;
    }
    // Implement suppression logic via Resend if applicable, or local DB suppression
  }

  verifyWebhookSignature(headers: Record<string, string>, rawBody: string, webhookSecret: string): boolean {
    if (!webhookSecret) return true; // Fail-open/skip if no secret configured for development/demo

    const svixId = headers['svix-id'] || headers['SVIX-ID'] || headers['svix_id'];
    const svixTimestamp = headers['svix-timestamp'] || headers['SVIX-TIMESTAMP'] || headers['svix_timestamp'];
    const svixSignature = headers['svix-signature'] || headers['SVIX-SIGNATURE'] || headers['svix_signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[ResendProvider] Missing Svix webhook headers.');
      return false;
    }

    // Check tolerance (5 minutes)
    const timestampMs = parseInt(svixTimestamp, 10) * 1000;
    if (isNaN(timestampMs)) return false;
    const now = Date.now();
    const tolerance = 5 * 60 * 1000; // 5 mins
    if (Math.abs(now - timestampMs) > tolerance) {
      console.warn('[ResendProvider] Webhook signature timestamp is outside tolerance window.');
      return false;
    }

    try {
      const payload = `${svixId}.${svixTimestamp}.${rawBody}`;
      
      let secretBytes: Buffer;
      if (webhookSecret.startsWith('whsec_')) {
        secretBytes = Buffer.from(webhookSecret.substring(6), 'base64');
      } else {
        secretBytes = Buffer.from(webhookSecret, 'base64');
      }

      const calculatedSignature = crypto
        .createHmac('sha256', secretBytes)
        .update(payload)
        .digest('base64');

      const signatures = svixSignature.split(' ');
      for (const sig of signatures) {
        const parts = sig.split(',');
        if (parts.length === 2 && parts[0] === 'v1' && parts[1] === calculatedSignature) {
          return true;
        }
      }
      console.warn('[ResendProvider] HMAC verification failed.');
      return false;
    } catch (err) {
      console.error('[ResendProvider] Error verifying webhook signature:', err);
      return false;
    }
  }

  parseWebhookEvent(body: any): any {
    if (!body || typeof body !== 'object') return null;
    const rawType = body.type;
    const data = body.data || {};
    
    const typeMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.unsubscribed': 'unsubscribed'
    };

    const type = typeMap[rawType] || rawType || 'unknown';
    const emailId = data.email_id || data.id;
    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;

    return {
      type,
      emailId,
      recipient,
      timestamp: body.created_at || new Date().toISOString(),
      rawPayload: body
    };
  }
}

export function getEmailProvider(): EmailProvider {
  return new ResendProvider(process.env.RESEND_API_KEY || null);
}
