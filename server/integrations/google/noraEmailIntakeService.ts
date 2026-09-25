/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Email Intake Service for asknora@nestrealty.com
 * 
 * Monitors the asknora@nestrealty.com inbox for incoming agent requests:
 * 1. Scans email subject, body text, and attachments
 * 2. Detects marketing collateral requests (flyers, brochures, social carousels, postcards)
 * 3. Extracts property address, specs, and photos
 * 4. Ingests into Canonical Marketing Repository assigned to Melissa Gagliardi (Marketing Director)
 *    with 1-click delegation to Eduardo Lovo (VA / Maxa Lead)
 * 5. Sends automatic intake confirmation back to the agent via asknora@nestrealty.com
 */

import { google } from 'googleapis';
import { NORA_EMAIL_CONFIG } from '../../email/emailProvider.js';
import { ingestInboundEmailToTask } from '../../services/inboundEmailIngestionEngine.js';
import { getAllCanonicalMarketingRequests, getAllCanonicalMarketingTasks } from '../../persistence/marketingCampaignsRepository.js';
import { findEmailReplyTarget } from '../../services/noraEmailReplyLifecycle.js';
import { getOAuthClient, getGoogleAccessToken, getGoogleServiceAccountJWTClient } from './googleOAuth.js';
import { isGoogleServiceAccountConfigured } from './googleConfig.js';
import { getOAuthTokenRecord } from '../../persistence/oauthTokensRepository.js';
import { decryptToken } from '../shared/integrationCredentialVault.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';

export interface InboundAgentEmail {
  id: string;
  messageId: string;
  workspaceId?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string | string[];
  fromEmail: string;
  fromName: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    sizeBytes: number;
    url?: string;
    content?: Buffer | string;
    buffer?: Buffer;
    base64Data?: string;
  }>;
}

export interface EmailIntakeResult {
  isMarketingRequest: boolean;
  propertyAddress: string;
  deliverableTitle: string;
  category?: string;
  agentName: string;
  agentEmail: string;
  extractedPhotosCount: number;
  driveFolderUrl?: string;
  createdRequestId?: string;
  createdTaskId?: string;
  isExistingTaskUpdated?: boolean;
  updatedTaskId?: string;
  assignedLead?: string;
  photos?: Array<{ id: string; url: string; name?: string; type?: string; sizeBytes?: number }>;
  attachments?: Array<{ filename: string; contentType: string; sizeBytes?: number; url: string }>;
}

/**
 * In-memory set of already processed message IDs to prevent duplicate tasks.
 */
export const processedMessageIds = new Set<string>();

/** Compatibility lookup requires an explicit requester and tenant; unscoped matching is forbidden. */
export function findMatchingExistingTask(address: string, scope?: { workspaceId: string; senderEmail: string }) {
  if (!scope) return {};
  const matched = findEmailReplyTarget({ ...scope, propertyAddress: address, subject: 'Re: Marketing request', text: '',
    hasAttachments: true, requests: getAllCanonicalMarketingRequests(), tasks: getAllCanonicalMarketingTasks() });
  return matched ? { task: matched.tasks[0], request: matched.request } : {};
}

/**
 * Known simulated inbound emails to asknora@nestrealty.com for development, demo, and testing.
 */
const SEED_INBOX_EMAILS: InboundAgentEmail[] = [
  {
    id: 'eml_matt_orr_1916_wolcott',
    messageId: '<msg_matt_orr_1916_wolcott_ave@nestrealty.com>',
    fromEmail: 'matt.orr@nestrealty.com',
    fromName: 'Matt Orr (REALTOR®)',
    subject: '1916 Wolcott Ave Marketing Request',
    bodyText: `Hi Nora,\n\nI need a 1 page flyer for this new listing. Just introducing the house. It's 1400 square feet, 3 bed 2 bath, full remodeled. I'm listing it for $560,000. Going live September 24.\n\nPicture is attached.\n1004.jpg`,
    receivedAt: '2026-08-31T14:24:00.000Z',
    attachments: [
      {
        filename: '1004.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 3840000,
        url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
      }
    ]
  },
  {
    id: 'eml_matt_orr_live_oak',
    messageId: '<msg_matt_orr_1104_live_oak@nestrealty.com>',
    fromEmail: 'matt.orr@nestrealty.com',
    fromName: 'Matt Orr (REALTOR®)',
    subject: 'Open House Flyer & Information Sheet for 1104 S Live Oak Pkwy',
    bodyText: `Hi Nora & Melissa,\n\nI have an open house this Saturday from 1-4 PM at 1104 S Live Oak Pkwy in Wilmington.\n\nCould you please put together a double-sided 8.5x11 open house flyer and an information sheet with features? I've attached 6 high-res photos (exterior, kitchen, master suite) and the floorplan.\n\nPrice: $875,000\nBeds: 4 | Baths: 3.5\n\nThanks!\nMatt Orr\nNest Realty Mayfaire\n(252) 717-0595`,
    receivedAt: new Date(Date.now() - 3600000).toISOString(),
    attachments: [
      { filename: 'hero_exterior.jpg', contentType: 'image/jpeg', sizeBytes: 4829100, url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
      { filename: 'chef_kitchen.jpg', contentType: 'image/jpeg', sizeBytes: 3912000, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
      { filename: 'primary_suite.jpg', contentType: 'image/jpeg', sizeBytes: 3410000, url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80' },
      { filename: 'floorplan_sheet.pdf', contentType: 'application/pdf', sizeBytes: 1200000, url: 'https://drive.google.com/file/d/1_sample_floorplan/view' }
    ]
  }
];

export function extractAddressFromEmail(text: string, subject?: string): string {
  const addressRegex = /\b\d{2,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:Blvd|Boulevard|Lane|Ln|Road|Rd|Street|St|Way|Dr|Drive|Ave|Avenue|Pkwy|Parkway|Court|Ct|Circle|Cir|Terrace|Ter|Plaza|Plz|Loop)\b/i;

  if (subject) {
    const subMatch = subject.match(addressRegex);
    if (subMatch) {
      let raw = subMatch[0].trim();
      if (!raw.toLowerCase().includes('wilmington') && !raw.toLowerCase().includes('beach')) {
        raw += ', Wilmington, NC';
      }
      return raw;
    }
  }

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(addressRegex);
    if (match) {
      let raw = match[0].trim();
      if (!raw.toLowerCase().includes('wilmington') && !raw.toLowerCase().includes('beach')) {
        raw += ', Wilmington, NC';
      }
      return raw;
    }
  }

  return '';
}

export function parseMarketingDeliverables(text: string): {
  title: string;
  category: 'print' | 'digital' | 'social' | 'signage' | 'open_house';
  items: string[];
} {
  const lower = text.toLowerCase();
  const items: string[] = [];
  let category: 'print' | 'digital' | 'social' | 'signage' | 'open_house' = 'print';

  if (lower.includes('open house flyer') && lower.includes('information sheet')) {
    items.push('Double-Sided 8.5x11 Open House Flyer', 'Listing Information Sheet');
    category = 'open_house';
    return { title: 'Open House Flyer & Information Sheet', category, items };
  }

  if (lower.includes('open house')) {
    items.push('8.5x11 Open House Flyer', 'Feature Sheet Handout');
    category = 'open_house';
    return { title: 'Open House Flyer & Information Sheet', category, items };
  }

  if (lower.includes('1 page flyer') || lower.includes('1-page flyer') || lower.includes('one page flyer') || lower.includes('flyer')) {
    items.push('1-Page Property Flyer (8.5x11)');
    category = 'print';
    return { title: '1-Page Property Flyer (8.5x11)', category, items };
  }

  if (lower.includes('brochure') || lower.includes('booklet') || lower.includes('4-page')) {
    items.push('4-Page Premium Listing Brochure (11x17 Folded)');
    category = 'print';
    return { title: '4-Page Premium Listing Brochure', category, items };
  }

  if (lower.includes('postcard') || lower.includes('direct mail') || lower.includes('just listed') || lower.includes('eddm')) {
    items.push('6x9 Jumbo Just Listed Postcard', '9:16 Social Story Carousel');
    category = 'print';
    return { title: 'Just Listed Postcard & Social Graphics', category, items };
  }

  if (lower.includes('social') || lower.includes('instagram') || lower.includes('story')) {
    items.push('9:16 Story Carousel (3 Slides)', 'Square Feed Post');
    category = 'social';
    return { title: 'Social Media Launch Pack', category, items };
  }

  if (lower.includes('sign') || lower.includes('post') || lower.includes('rider')) {
    items.push('4x4 Vinyl Post Installation', 'Rider Panel');
    category = 'signage';
    return { title: 'Yard Sign Post & Rider Order', category, items };
  }

  items.push('8.5x11 Property Flyer (300 DPI)', 'Social Media Graphic');
  return { title: 'Listing Launch Collateral Suite', category: 'print', items };
}

/**
 * Processes a single inbound email to asknora@nestrealty.com.
 */
export async function processInboundAgentEmail(email: InboundAgentEmail): Promise<EmailIntakeResult> {
  // Gmail and IMAP share the same durable identity, lifecycle and outbox rules.
  // New marketing tasks use status: 'request_received' and Melissa reviews every intake.
  const result = await ingestInboundEmailToTask({
    workspaceId: email.workspaceId || 'ws_wilmington', provider: 'gmail_api',
    mailboxId: 'asknora@nestrealty.com', from: `${email.fromName} <${email.fromEmail}>`,
    subject: email.subject, textContent: email.bodyText, messageId: email.messageId,
    threadId: email.threadId, inReplyTo: email.inReplyTo, references: email.references,
    attachments: (email.attachments || []).map(att => ({ ...att, content: att.content || att.buffer || att.base64Data })),
  });
  if (!result.success) throw new Error(result.error || result.message || 'Email intake failed');
  processedMessageIds.add(email.messageId);
  const existing = result.actionTaken === 'reconciled_updated' || result.actionTaken === 'reconciled_merged';
  return {
    isMarketingRequest: Boolean(result.taskId && result.actionTaken !== 'already_processed'),
    propertyAddress: result.propertyAddress || '', deliverableTitle: result.task?.title || email.subject,
    category: result.task?.category, agentName: result.agentName || email.fromName, agentEmail: email.fromEmail,
    extractedPhotosCount: result.photosCount || 0, driveFolderUrl: result.driveFolderUrl || '',
    createdRequestId: result.requestId, createdTaskId: existing ? undefined : result.taskId,
    isExistingTaskUpdated: existing ? true : undefined, updatedTaskId: existing ? result.taskId : undefined,
    assignedLead: result.task?.assignedTo || result.assignedTo || 'Melissa Gagliardi',
    photos: result.task?.photos, attachments: result.task?.attachments,
  };
}

/**
 * Synchronizes unread emails from asknora@nestrealty.com.
 * In development/test mode, only process explicit whitelisted test emails.
 */
export async function syncNoraEmailInbox(workspaceId: string = 'ws_wilmington'): Promise<{
  syncedCount: number;
  newRequestsCount: number;
  results: EmailIntakeResult[];
}> {
  if (process.env.MAINTENANCE_MODE === 'true') {
    console.log('[EmailIntake] Maintenance mode active. Inbox sync paused without claiming messages.');
    return { syncedCount: 0, newRequestsCount: 0, results: [] };
  }

  console.log(`[EmailIntake] Syncing asknora@nestrealty.com inbox... (Sender: ${NORA_EMAIL_CONFIG.user})`);

  const results: EmailIntakeResult[] = [];
  let newRequestsCount = 0;

  // 1. Live Gmail API Attempt if Google Workspace is authenticated
  try {
    let accessToken: string | null = null;

    // Check Google Workspace Enterprise Service Account first
    if (isGoogleServiceAccountConfigured()) {
      try {
        const jwtClient = getGoogleServiceAccountJWTClient('AskNora@nestrealty.com', [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify'
        ]);
        if (jwtClient) {
          const tokenRes = await jwtClient.getAccessToken();
          if (tokenRes && tokenRes.token) {
            accessToken = tokenRes.token;
          }
        }
      } catch (jwtErr: any) {
        // Fall back to OAuth token
      }
    }

    if (!accessToken) {
      const effectiveDbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(effectiveDbState);
      let connection = await store.getConnection(workspaceId, 'google_workspace');

      const oauthRec = getOAuthTokenRecord('google');

      if (connection && connection.status === 'connected' && connection.encryptedAccessToken) {
        accessToken = await getGoogleAccessToken(connection, effectiveDbState, async () => {});
      } else if (oauthRec && oauthRec.status === 'connected' && oauthRec.accessToken) {
        try {
          accessToken = await decryptToken(oauthRec.accessToken);
        } catch {
          accessToken = oauthRec.accessToken;
        }
      }
    }

    if (accessToken && !accessToken.startsWith('dev_mock_')) {
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 15,
        q: 'is:unread (to:asknora@nestrealty.com OR to:me)'
      });

      if (listRes.data.messages && listRes.data.messages.length > 0) {
        for (const msgRef of listRes.data.messages) {
          if (!msgRef.id || processedMessageIds.has(msgRef.id)) continue;

          try {
            const msgDetail = await gmail.users.messages.get({
              userId: 'me',
              id: msgRef.id,
              format: 'full'
            });

            const headers = msgDetail.data.payload?.headers || [];
            const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
            const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
            const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || new Date().toISOString();

            let fromEmail = '';
            let fromName = '';
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
            if (emailMatch[1]) {
              fromEmail = emailMatch[1].trim();
              fromName = fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || fromEmail;
            }

            let bodyText = msgDetail.data.snippet || '';
            const attachments: InboundAgentEmail['attachments'] = [];

            if (!fromEmail) throw new Error('Inbound email has no sender');
            const readParts = async (parts: any[]): Promise<void> => {
              for (const part of parts) {
                if (part.parts) await readParts(part.parts);
                if (part.filename) {
                  let data = part.body?.data;
                  if (!data && part.body?.attachmentId) {
                    const attachment = await gmail.users.messages.attachments.get({
                      userId: 'me', messageId: msgRef.id!, id: part.body.attachmentId,
                    });
                    data = attachment.data.data;
                  }
                  if (!data) throw new Error(`Attachment bytes unavailable: ${part.filename}`);
                  const content = Buffer.from(data, 'base64url');
                  attachments.push({ filename: part.filename, contentType: part.mimeType || 'application/octet-stream',
                    sizeBytes: content.length, content });
                } else if (part.mimeType === 'text/plain' && part.body?.data) {
                  bodyText = Buffer.from(part.body.data, 'base64url').toString('utf8');
                }
              }
            };
            await readParts([msgDetail.data.payload]);

            const parsedEmail: InboundAgentEmail = {
              id: `gmail_${msgRef.id}`,
              messageId: headers.find(h => h.name?.toLowerCase() === 'message-id')?.value || msgRef.id,
              workspaceId, threadId: msgDetail.data.threadId || undefined,
              inReplyTo: headers.find(h => h.name?.toLowerCase() === 'in-reply-to')?.value,
              references: headers.find(h => h.name?.toLowerCase() === 'references')?.value,
              fromEmail,
              fromName,
              subject: subjectHeader,
              bodyText,
              receivedAt: new Date(dateHeader).toISOString(),
              attachments
            };

            const res = await processInboundAgentEmail(parsedEmail);
            processedMessageIds.add(msgRef.id);
            await gmail.users.messages.modify({ userId: 'me', id: msgRef.id, requestBody: { removeLabelIds: ['UNREAD'] } });
            results.push(res);
            if (res.isMarketingRequest) newRequestsCount++;
          } catch (e) {
            console.warn(`[EmailIntake] Failed to parse message ${msgRef.id}:`, e);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[EmailIntake] Live Gmail sync notice (falling back to seeds):', err.message);
  }

  // 2. Process seed/simulated inbox emails (including Matt Orr's Wolcott Ave request)
  for (const email of process.env.NODE_ENV === 'test' ? SEED_INBOX_EMAILS : []) {
    if (!processedMessageIds.has(email.messageId)) {
      const res = await processInboundAgentEmail(email);
      results.push(res);
      if (res.isMarketingRequest) {
        newRequestsCount++;
      }
    }
  }

  return {
    syncedCount: results.length,
    newRequestsCount,
    results
  };
}

/**
 * Starts continuous background polling loop (runs every 60 seconds).
 */
let pollingInterval: NodeJS.Timeout | null = null;

export function startNoraEmailPollingLoop(intervalMs: number = 60000) {
  if (pollingInterval) return;
  console.log(`[EmailIntake] Starting background inbox monitor for asknora@nestrealty.com (interval: ${intervalMs / 1000}s)`);

  // Immediate initial sync on boot
  syncNoraEmailInbox().catch(err => console.warn('[EmailIntake] Initial startup sync error:', err));

  pollingInterval = setInterval(async () => {
    try {
      await syncNoraEmailInbox();
    } catch (err) {
      console.warn('[EmailIntake] Periodic sync notice:', err);
    }
  }, intervalMs);
}
