/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  CanonicalMarketingRequest,
  CanonicalMarketingTask,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks
} from '../persistence/marketingCampaignsRepository.js';
import {
  sendMarketingIntakeConfirmationEmail,
  isAllowedEmailRecipient
} from '../email/emailProvider.js';
import {
  getResponsibleDepartmentOwner
} from '../policies/departmentNotificationPolicyEngine.js';

export const emailInboundWebhookRouter = express.Router();

// Known agent directory lookup for automatic phone and role enrichment
const KNOWN_AGENTS: Record<string, { name: string; phone: string; role: string }> = {
  'marcus.aman@gmail.com': { name: 'Marcus Aman', phone: '+12527170595', role: 'Broker / Tech Lead' },
  'marcus@shapework.co': { name: 'Marcus Aman', phone: '+12527170595', role: 'Broker / Tech Lead' },
  'matt.orr@nestrealty.com': { name: 'Matt Orr', phone: '+19106128283', role: 'Broker' },
  'melissa.gagliardi@nestrealty.com': { name: 'Melissa Gagliardi', phone: '+19105072047', role: 'Marketing Director' },
  'melissa@nestrealty.com': { name: 'Melissa Gagliardi', phone: '+19105072047', role: 'Marketing Director' },
  'eduardo@nestrealty.com': { name: 'Eduardo Lovo', phone: '+19105072047', role: 'Virtual Assistant / Maxa Lead' },
  'ann.gunn@nestrealty.com': { name: 'Ann Gunn', phone: '+19105072047', role: 'Operations & Signage Lead' },
  'ryan@nestrealty.com': { name: 'Ryan Crecelius', phone: '+19104097120', role: 'BIC / Principal Broker' }
};

/**
 * Extracts sender name and clean email from headers like:
 * "Marcus Aman <marcus.aman@gmail.com>" or "marcus.aman@gmail.com"
 */
function parseSender(fromStr?: string): { name: string; email: string } {
  if (!fromStr) {
    return { name: 'Matt Orr (Broker)', email: 'matt.orr@nestrealty.com' };
  }
  const match = fromStr.match(/(?:["']?([^"']+)["']?\s*)?<([^>]+)>/);
  if (match) {
    const rawName = (match[1] || '').trim();
    const email = match[2].trim().toLowerCase();
    const known = KNOWN_AGENTS[email];
    return {
      name: known?.name || rawName || email.split('@')[0],
      email
    };
  }
  const email = fromStr.trim().toLowerCase();
  const known = KNOWN_AGENTS[email];
  return {
    name: known?.name || email.split('@')[0],
    email
  };
}

/**
 * Parses potential property address from subject or body text
 */
function extractPropertyAddress(subject?: string, body?: string): string {
  const combined = `${subject || ''} ${body || ''}`;
  
  if (/wolcott/i.test(combined)) {
    return '1916 Wolcott Ave, Wilmington, NC';
  }
  if (/live\s*oak/i.test(combined)) {
    return '1104 S Live Oak Pkwy, Wilmington, NC';
  }
  if (/forest\s*hills/i.test(combined)) {
    return '704 Forest Hills Dr, Wilmington, NC';
  }
  if (/lumina/i.test(combined)) {
    return '914 South Lumina Ave, Wrightsville Beach, NC';
  }
  if (/wetland/i.test(combined)) {
    return '212 Wetland Drive, Wilmington, NC';
  }

  // Regex address matcher: e.g. "123 Main St"
  const addressMatch = combined.match(/\b\d{1,5}\s+[A-Za-z0-9\.\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Boulevard|Blvd|Lane|Ln|Court|Ct|Way|Parkway|Pkwy|Circle|Cir)\b/i);
  if (addressMatch) {
    let addr = addressMatch[0].trim();
    if (!addr.toLowerCase().includes('nc') && !addr.toLowerCase().includes('wilmington')) {
      addr += ', Wilmington, NC';
    }
    return addr;
  }

  return subject?.replace(/marketing\s+request/i, '').trim() || 'Wilmington NC Area Listing';
}

/**
 * GET /api/webhooks/email/health
 * Diagnostics endpoint to verify zero-OAuth webhook status
 */
emailInboundWebhookRouter.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    provider: 'universal_inbound_email_parser',
    inboundAddress: 'AskNora@nestrealty.com',
    authType: 'zero_oauth_forwarding_webhook',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/webhooks/email/inbound & POST /api/email/inbound
 * Universal Inbound Webhook Parser (SendGrid, Postmark, Mailgun, Cloudflare Email Routing, or Direct JSON)
 */
async function handleInboundEmail(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const fromRaw = body.from || body.From || body.sender || body['from-email'] || req.headers['x-forwarded-for-email'];
    const toRaw = body.to || body.To || body.recipient || 'AskNora@nestrealty.com';
    const subject = (body.subject || body.Subject || 'New Marketing Collateral Request').trim();
    const textContent = (body.text || body.Text || body['body-plain'] || body['stripped-text'] || body.html || body.Html || '').toString().trim();
    
    const { name: agentName, email: agentEmail } = parseSender(typeof fromRaw === 'string' ? fromRaw : undefined);
    const knownProfile = KNOWN_AGENTS[agentEmail];
    const agentPhone = knownProfile?.phone || '+12527170595';
    const agentRole = knownProfile?.role || 'Broker';
    const propertyAddress = extractPropertyAddress(subject, textContent);
    const cleanAddressKey = propertyAddress.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

    // Extract raw attachments from multipart or JSON
    const rawAttachments: Array<{ filename: string; contentType: string; content?: Buffer | string; sizeBytes?: number; url?: string }> = [];

    if (Array.isArray((req as any).files)) {
      for (let i = 0; i < (req as any).files.length; i++) {
        const file = (req as any).files[i];
        rawAttachments.push({
          filename: file.originalname || `attachment_${i + 1}.jpg`,
          contentType: file.mimetype || 'image/jpeg',
          content: file.buffer,
          sizeBytes: file.size || 3840000
        });
      }
    }

    if (Array.isArray(body.attachments)) {
      body.attachments.forEach((att: any, idx: number) => {
        rawAttachments.push({
          filename: att.name || att.filename || att.Filename || `attachment_${idx + 1}.jpg`,
          contentType: att.contentType || att.type || att.ContentType || 'image/jpeg',
          content: att.content || att.Content || att.base64Data,
          sizeBytes: att.sizeBytes || att.length || 3840000,
          url: att.url
        });
      });
    }

    if (typeof fromRaw !== 'string' || !fromRaw.trim()) return res.status(400).json({ success: false, error: 'Sender required' });
    const headers = body.headers || body.Headers || {};
    const header = (name: string) => Array.isArray(headers)
      ? headers.find((h: any) => String(h.Name || h.name).toLowerCase() === name.toLowerCase())?.Value || headers.find((h: any) => String(h.Name || h.name).toLowerCase() === name.toLowerCase())?.value
      : Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
    const { ingestInboundEmailToTask } = await import('../services/inboundEmailIngestionEngine.js');
    const result = await ingestInboundEmailToTask({
      from: typeof fromRaw === 'string' ? fromRaw : 'matt.orr@nestrealty.com',
      to: typeof toRaw === 'string' ? toRaw : 'AskNora@nestrealty.com',
      subject,
      textContent,
      htmlContent: (body.html || body.Html || '').toString(),
      messageId: body.messageId || body.MessageID || body['Message-Id'] || header('Message-ID'),
      threadId: body.threadId || body.ThreadID,
      inReplyTo: body.inReplyTo || body['In-Reply-To'] || header('In-Reply-To'),
      references: body.references || body.References || header('References'),
      workspaceId: (req as any).workspaceId || process.env.NORA_WORKSPACE_ID || 'ws_wilmington',
      mailboxId: 'asknora@nestrealty.com',
      provider: 'email_webhook',
      attachments: rawAttachments
    });
    const { getNotificationCcEmail } = await import('../policies/departmentNotificationPolicyEngine.js');
    const ccRecipient = getNotificationCcEmail({ assignee: result.assignedTo });

    return res.status(result.success ? 200 : 422).json({
      ...result,
      ccRecipient,
      taskIds: [result.taskId]
    });
  } catch (err: any) {
    console.error('[Email Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to parse inbound email' });
  }
}

emailInboundWebhookRouter.post('/inbound', handleInboundEmail);
emailInboundWebhookRouter.post('/', handleInboundEmail);
