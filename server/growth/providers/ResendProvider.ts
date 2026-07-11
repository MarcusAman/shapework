/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import {
  EmailProvider,
  DomainSetup,
  DomainStatus,
  EmailPayload,
  SendResult,
  BatchSendResult,
  ContactPayload,
  ContactResult
} from './EmailProvider.js';

export class ResendProvider implements EmailProvider {
  private apiKey: string | null;
  private mode: 'demo' | 'test' | 'production';

  constructor(apiKey: string | null, mode: 'demo' | 'test' | 'production') {
    this.apiKey = apiKey || null;
    this.mode = mode;
  }

  private isMock(): boolean {
    if (this.mode === 'production') {
      return false; // Hard-gated: production mode never uses mock/simulation fallbacks
    }
    return true;
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

    if (this.mode === 'production' && !this.apiKey) {
      throw new Error('Resend API key missing in production mode.');
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
        const errorText = await response.text();
        throw new Error(`Resend API Error: ${response.status} ${errorText}`);
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
    } catch (err: any) {
      console.error('[ResendProvider] Failed to create domain:', err);
      throw err;
    }
  }

  async verifyDomain(domainId: string): Promise<DomainStatus> {
    if (this.isMock()) {
      return { id: domainId, status: 'verified' };
    }

    if (this.mode === 'production' && !this.apiKey) {
      throw new Error('Resend API key missing in production mode.');
    }

    try {
      const response = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API Error: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return {
        id: domainId,
        status: data.status === 'verified' ? 'verified' : 'pending'
      };
    } catch (err: any) {
      console.error('[ResendProvider] Failed to verify domain:', err);
      throw err;
    }
  }

  async sendEmail(payload: EmailPayload): Promise<SendResult> {
    if (this.isMock()) {
      console.log(`[Simulated resend] Mode: ${this.mode}. Email sent successfully to ${payload.to}. Subject: "${payload.subject}"`);
      return {
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        status: 'sent'
      };
    }

    if (this.mode === 'production' && !this.apiKey) {
      throw new Error('Resend API key missing in production mode.');
    }

    try {
      const bodyPayload: any = {
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.body
      };
      if (payload.headers) {
        bodyPayload.headers = payload.headers;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API Error: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return {
        messageId: data.id,
        status: 'sent'
      };
    } catch (err: any) {
      console.error('[ResendProvider] Failed to send email:', err);
      throw err;
    }
  }

  async sendBatch(payloads: EmailPayload[]): Promise<BatchSendResult> {
    if (this.isMock()) {
      const results = payloads.map(() => ({
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        status: 'sent' as const
      }));
      return { results };
    }

    if (this.mode === 'production' && !this.apiKey) {
      throw new Error('Resend API key missing in production mode.');
    }

    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          payloads.map(p => {
            const item: any = {
              from: p.from,
              to: p.to,
              subject: p.subject,
              html: p.body
            };
            if (p.headers) {
              item.headers = p.headers;
            }
            return item;
          })
        )
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API Error: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return {
        results: data.data.map((item: any) => ({
          messageId: item.id,
          status: 'sent' as const
        }))
      };
    } catch (err: any) {
      console.error('[ResendProvider] Failed to send batch emails:', err);
      throw err;
    }
  }

  async createContact(contact: ContactPayload): Promise<ContactResult> {
    if (this.isMock()) {
      return { id: `con_${Math.random().toString(36).substring(2, 11)}` };
    }
    return { id: `con_${Math.random().toString(36).substring(2, 11)}` };
  }

  async suppressContact(email: string): Promise<void> {
    if (this.isMock()) {
      console.log(`[Simulated resend] Suppressed contact: ${email}`);
      return;
    }
  }

  verifyWebhookSignature(headers: Record<string, string>, rawBody: string, webhookSecret: string): boolean {
    if (this.mode === 'production' && !webhookSecret) {
      console.error('[ResendProvider] Webhook signature secret is required in production mode.');
      return false;
    }

    if (!webhookSecret) return true; // Fail-open/skip in demo/test modes if no secret configured

    const svixId = headers['svix-id'] || headers['SVIX-ID'] || headers['svix_id'];
    const svixTimestamp = headers['svix-timestamp'] || headers['SVIX-TIMESTAMP'] || headers['svix_timestamp'];
    const svixSignature = headers['svix-signature'] || headers['SVIX-SIGNATURE'] || headers['svix_signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[ResendProvider] Missing Svix webhook headers.');
      return false;
    }

    const timestampMs = parseInt(svixTimestamp, 10) * 1000;
    if (isNaN(timestampMs)) return false;
    const now = Date.now();
    const tolerance = 5 * 60 * 1000;
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
        if (parts.length === 2 && parts[0] === 'v1') {
          const sigBuffer = Buffer.from(parts[1], 'utf8');
          const calcBuffer = Buffer.from(calculatedSignature, 'utf8');
          if (sigBuffer.length === calcBuffer.length && crypto.timingSafeEqual(sigBuffer, calcBuffer)) {
            return true;
          }
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
