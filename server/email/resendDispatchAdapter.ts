/**
 * Resend Email Dispatch Adapter
 * HTTPS API integration with Resend (https://api.resend.com/emails)
 * Supports live API dispatch when RESEND_API_KEY is present,
 * and fallback demo dispatch mode when RESEND_API_KEY is absent.
 */

import crypto from 'crypto';
import { isAllowedEmailRecipient, ALLOWED_TEST_EMAIL_RECIPIENTS } from './emailProvider.js';

export interface ResendDispatchOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  campaignId?: string;
}

export interface EmailDispatchReceipt {
  receiptId: string;
  resendMessageId: string;
  campaignId: string;
  to: string[];
  from: string;
  subject: string;
  htmlChecksum: string;
  provider: 'resend' | 'resend_demo';
  status: 'delivered' | 'demo_sent' | 'failed';
  timestamp: string;
  error?: string;
}

export async function dispatchEmailViaResend(options: ResendDispatchOptions): Promise<{ success: boolean; receipt: EmailDispatchReceipt }> {
  const apiKey = process.env.RESEND_API_KEY;
  const rawList = Array.isArray(options.to) ? options.to : [options.to];
  const toList = rawList.filter(isAllowedEmailRecipient);

  if (toList.length === 0) {
    console.log(`[Resend Safety Gate] All recipients in [${rawList.join(', ')}] suppressed (not in test whitelist: ${ALLOWED_TEST_EMAIL_RECIPIENTS.join(', ')}).`);
    return {
      success: true,
      receipt: {
        receiptId: 'rcpt_email_suppressed_' + Date.now(),
        resendMessageId: 'suppressed_safe_mode',
        campaignId: options.campaignId || '',
        to: rawList,
        from: options.from || 'Nest Realty <marketing@nestrealty.com>',
        subject: options.subject,
        htmlChecksum: 'sha256_suppressed',
        provider: 'resend_demo',
        status: 'demo_sent',
        timestamp: new Date().toISOString()
      }
    };
  }
  const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || 'Nest Realty <marketing@nestrealty.com>';
  const htmlChecksum = 'sha256_' + crypto.createHash('sha256').update(options.html || '').digest('hex');
  const campaignId = options.campaignId || '';

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: toList,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      });

      const data: any = await response.json();

      if (response.ok && data?.id) {
        const receipt: EmailDispatchReceipt = {
          receiptId: 'rcpt_email_' + Date.now(),
          resendMessageId: data.id,
          campaignId,
          to: toList,
          from: fromAddress,
          subject: options.subject,
          htmlChecksum,
          provider: 'resend',
          status: 'delivered',
          timestamp: new Date().toISOString()
        };
        return { success: true, receipt };
      } else {
        const receipt: EmailDispatchReceipt = {
          receiptId: 'rcpt_email_' + Date.now(),
          resendMessageId: 'failed_' + Date.now(),
          campaignId,
          to: toList,
          from: fromAddress,
          subject: options.subject,
          htmlChecksum,
          provider: 'resend',
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: data?.message || 'Resend API dispatch failed'
        };
        return { success: false, receipt };
      }
    } catch (err: any) {
      const receipt: EmailDispatchReceipt = {
        receiptId: 'rcpt_email_' + Date.now(),
        resendMessageId: 'failed_' + Date.now(),
        campaignId,
        to: toList,
        from: fromAddress,
        subject: options.subject,
        htmlChecksum,
        provider: 'resend',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: err.message
      };
      return { success: false, receipt };
    }
  }

  // Fallback Demo Dispatch Mode when RESEND_API_KEY is not set
  const receipt: EmailDispatchReceipt = {
    receiptId: 'rcpt_email_' + Date.now(),
    resendMessageId: 'resend_msg_demo_' + Date.now().toString(36),
    campaignId,
    to: toList,
    from: fromAddress,
    subject: options.subject,
    htmlChecksum,
    provider: 'resend_demo',
    status: 'demo_sent',
    timestamp: new Date().toISOString()
  };

  return { success: true, receipt };
}
