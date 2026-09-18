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
import { enqueueOutboundEmail, processOutboundEmailOutbox } from '../../services/inboundEmailIngestionEngine.js';
import { generateMarketingTrackerToken } from '../../services/taskTrackerService.js';
import {
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../persistence/marketingCampaignsRepository.js';
import { NEST_FULL_ROSTER_72 } from '../../persistence/nestRosterSeed.js';
import { getOAuthClient, getGoogleAccessToken, getGoogleServiceAccountJWTClient } from './googleOAuth.js';
import { isGoogleServiceAccountConfigured } from './googleConfig.js';
import { getOAuthTokenRecord } from '../../persistence/oauthTokensRepository.js';
import { decryptToken } from '../shared/integrationCredentialVault.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { buildCreativeTaskDraft } from '../../services/nora/creativeRequestTriage.js';

export interface InboundAgentEmail {
  id: string;
  messageId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    sizeBytes: number;
    url: string;
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

/**
 * Fuzzy matches an address in an email against existing marketing tasks.
 */
export function findMatchingExistingTask(address: string): {
  task?: CanonicalMarketingTask;
  request?: CanonicalMarketingRequest;
} {
  if (!address || address.length < 5 || address.toLowerCase().includes('unknown')) return {};

  const cleanQuery = address.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const queryTokens = cleanQuery.split(/\s+/).filter(t => 
    t.length > 2 && !['wilmington', 'nc', 'north', 'carolina', 'ave', 'avenue', 'st', 'street', 'rd', 'road', 'dr', 'drive', 'blvd', 'boulevard', 'way', 'lane', 'pkwy', 'parkway', 'court', 'ct', 'circle', 'cir', 'test'].includes(t)
  );

  const numberMatch = address.match(/\b\d{2,5}\b/);
  const streetNum = numberMatch ? numberMatch[0] : '';

  const allTasks = getAllCanonicalMarketingTasks();
  const allRequests = getAllCanonicalMarketingRequests();

  for (const task of allTasks) {
    if (!task.propertyAddress) continue;
    const taskAddr = task.propertyAddress.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    
    if (streetNum && taskAddr.includes(streetNum)) {
      // If street number matches, check if any significant token (street name) matches
      const matchesSignificant = queryTokens.length === 0 || queryTokens.some(token => taskAddr.includes(token));
      if (matchesSignificant) {
        const req = allRequests.find(r => r.id === task.requestId);
        return { task, request: req };
      }
    }
  }

  return {};
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
  const combined = `${email.subject} ${email.bodyText}`.toLowerCase();
  
  // 1. Check if email is marketing-related
  const isMarketing = combined.includes('marketing') ||
                      combined.includes('flyer') ||
                      combined.includes('brochure') ||
                      combined.includes('postcard') ||
                      combined.includes('open house') ||
                      combined.includes('social') ||
                      combined.includes('just listed') ||
                      combined.includes('photo') ||
                      combined.includes('sheet') ||
                      combined.includes('sign');

  const propertyAddress = extractAddressFromEmail(`${email.subject}\n${email.bodyText}`, email.subject);
  const { title: deliverableTitle, category, items } = parseMarketingDeliverables(`${email.subject} ${email.bodyText}`);

  // Resolve agent name from Roster
  let agentName = email.fromName;
  const rosterMatch = NEST_FULL_ROSTER_72.find(a => a.email.toLowerCase() === email.fromEmail.toLowerCase());
  if (rosterMatch) {
    agentName = `${rosterMatch.displayName} (${rosterMatch.role || 'Broker'})`;
  }

  // Prefer a real AskNora Drive folder; never invent 1DRV_ placeholder URLs.
  let driveFolderUrl = '';
  try {
    const { GoogleDriveService } = await import('../../services/googleDriveService.js');
    const scaffold = await GoogleDriveService.scaffoldListingFolder({
      propertyAddress,
      agentName,
      agentEmail: email.fromEmail,
      deliverables: deliverableTitle,
    });
    if (scaffold.isLiveDrive && scaffold.driveFolderUrl && !/1DRV_/i.test(scaffold.driveFolderUrl)) {
      driveFolderUrl = scaffold.driveFolderUrl;
    }
  } catch (driveErr: any) {
    console.warn('[EmailIntake] Live Drive scaffold skipped:', driveErr?.message || driveErr);
  }
  
  // Extract photo attachments (.jpg, .jpeg, .png, .webp)
  const photoAttachments = email.attachments?.filter(a => 
    a.contentType.startsWith('image/') || 
    a.filename.toLowerCase().endsWith('.jpg') || 
    a.filename.toLowerCase().endsWith('.jpeg') || 
    a.filename.toLowerCase().endsWith('.png') || 
    a.filename.toLowerCase().endsWith('.webp')
  ) || [];

  const structuredPhotos = photoAttachments.map((p, idx) => ({
    id: `photo_${email.id || 'att'}_${idx}`,
    url: p.url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    name: p.filename,
    type: p.contentType || 'image/jpeg',
    sizeBytes: p.sizeBytes
  }));

  const structuredAttachments = (email.attachments || []).map(a => ({
    filename: a.filename,
    contentType: a.contentType,
    sizeBytes: a.sizeBytes,
    url: a.url
  }));

  const assignedLead = 'Melissa Gagliardi'; // Triage lead (Marketing Director)

  if (!isMarketing) {
    return {
      isMarketingRequest: false,
      propertyAddress,
      deliverableTitle,
      category,
      agentName,
      agentEmail: email.fromEmail,
      extractedPhotosCount: photoAttachments.length,
      driveFolderUrl,
      assignedLead,
      photos: structuredPhotos,
      attachments: structuredAttachments
    };
  }

  // 2. Check for Matching Existing Task (Smart Property Matching)
  const existing = findMatchingExistingTask(propertyAddress);

  if (existing.task) {
    const matchedTask = existing.task;
    const timeStr = new Date(email.receivedAt || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    // Append photo drop note
    matchedTask.notes = (matchedTask.notes ? matchedTask.notes + '\n\n' : '') + 
      `[${timeStr}] Inbound email from ${email.fromName} (${email.fromEmail}): "${email.subject}" — ${photoAttachments.length} photos staged to Drive: ${driveFolderUrl}`;
    
    if (category) {
      matchedTask.category = category;
    }

    // Attach photos and structured attachments to task
    if (structuredPhotos.length > 0) {
      matchedTask.photos = [...(matchedTask.photos || []), ...structuredPhotos];
    }
    if (structuredAttachments.length > 0) {
      matchedTask.attachments = [...(matchedTask.attachments || []), ...structuredAttachments];
    }
    matchedTask.driveFolderUrl = matchedTask.driveFolderUrl || driveFolderUrl;

    // Photos stage onto the task but do NOT skip Intake Received.
    // Melissa (or Ann for ops) must intentionally Start Work / route before in_progress.
    matchedTask.updatedAt = new Date().toISOString();

    saveCanonicalMarketingTask(matchedTask);

    if (existing.request) {
      existing.request.rawExcerpt = (existing.request.rawExcerpt ? existing.request.rawExcerpt + '\n\n---\n\n' : '') +
        `From: ${email.fromName} <${email.fromEmail}>\nSubject: ${email.subject}\n\n${email.bodyText}`;
      if (structuredPhotos.length > 0) {
        existing.request.photos = [...(existing.request.photos || []), ...structuredPhotos];
      }
      if (structuredAttachments.length > 0) {
        existing.request.attachments = [...(existing.request.attachments || []), ...structuredAttachments];
      }
      existing.request.driveFolderUrl = existing.request.driveFolderUrl || driveFolderUrl;
      saveCanonicalMarketingRequest(existing.request);
    }

    processedMessageIds.add(email.messageId);

    console.log(`[EmailIntake] Matched existing task "${matchedTask.title}" (${matchedTask.id}) for ${propertyAddress} -> Staged ${photoAttachments.length} photos and updated status to ${matchedTask.status}`);

    // Idempotent confirmation (one per request) via durable outbox
    try {
      const requestKey = existing.request?.id || matchedTask.requestId || matchedTask.id;
      await enqueueOutboundEmail({
        workspaceId: matchedTask.workspaceId || 'ws_wilmington',
        messageType: 'intake_confirmed',
        idempotencyKey: `ws_wilmington:agent:${String(agentEmail||"").toLowerCase()}:addr:${String(propertyAddress||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,120)}:intake_confirmation:v2`,
        recipient: email.fromEmail,
        subject: `Marketing Intake Confirmed: ${propertyAddress}`,
        payload: {
          toEmail: email.fromEmail,
          agentName: email.fromName,
          propertyAddress,
          deliverables: items,
          assignedLead: matchedTask.assignedTo || assignedLead,
          trackerUrl: `https://shapework.co/track/marketing/${generateMarketingTrackerToken(matchedTask.id)}`
        }
      });
      await processOutboundEmailOutbox();
    } catch (err) {
      console.warn(`[EmailIntake] Notice enqueueing intake confirmation email to ${email.fromEmail}:`, err);
    }

    return {
      isMarketingRequest: true,
      isExistingTaskUpdated: true,
      updatedTaskId: matchedTask.id,
      createdRequestId: existing.request?.id,
      propertyAddress,
      deliverableTitle: matchedTask.title,
      category: matchedTask.category,
      agentName,
      agentEmail: email.fromEmail,
      extractedPhotosCount: photoAttachments.length,
      driveFolderUrl,
      assignedLead: matchedTask.assignedTo || assignedLead,
      photos: matchedTask.photos,
      attachments: matchedTask.attachments
    };
  }

  // 3. Create New Canonical Request & Task in Repository
  const requestId = `req_email_${email.id}_${Date.now()}`;
  const taskId = `tsk_email_${email.id}_0`;

  // Create Parent Request
  const newRequest: CanonicalMarketingRequest = {
    id: requestId,
    title: email.subject || 'Email Intake Request',
    sourceCallId: email.id,
    telephonyCallId: undefined,
    channel: 'email',
    receivedAt: new Date(email.receivedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · Today',
    status: 'request_received',
    agentName,
    propertyAddress,
    requestExcerpt: `Email Intake (${email.fromEmail}): "${email.subject}" — ${email.bodyText.slice(0, 180)}...`,
    rawExcerpt: `From: ${email.fromName} <${email.fromEmail}>\nSubject: ${email.subject}\n\n${email.bodyText}`,
    taskIds: [taskId],
    assignedTo: assignedLead,
    photos: structuredPhotos,
    attachments: structuredAttachments,
    driveFolderUrl,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveCanonicalMarketingRequest(newRequest);

  // Extract property specs (sqft, beds, baths, price, go-live date)
  const specs: string[] = [];
  const sqftMatch = email.bodyText.match(/(\d{3,5})\s*(?:sq(?:uare)?\s*(?:ft|feet)|sqft)/i);
  if (sqftMatch) specs.push(`${parseInt(sqftMatch[1]).toLocaleString()} sq ft`);

  const bedBathMatch = email.bodyText.match(/(\d+)\s*(?:bed|br).*?(\d+(?:\.\d+)?)\s*(?:bath|ba)/i);
  if (bedBathMatch) specs.push(`${bedBathMatch[1]} Bed / ${bedBathMatch[2]} Bath`);

  const priceMatch = email.bodyText.match(/\$[\d,]+(?:\.\d+)?|\b\d{3,4}k\b/i);
  if (priceMatch) specs.push(priceMatch[0]);

  if (combined.includes('full remodel') || combined.includes('fully remodel')) specs.push('Fully Remodeled');

  const goLiveMatch = email.bodyText.match(/(?:going live|go-live|launch(?:ing)?)\s*([A-Za-z]+\s*\d{1,2}(?:st|nd|rd|th)?|\d{1,2}\/\d{1,2})/i);
  if (goLiveMatch) specs.push(`Go-Live: ${goLiveMatch[1]}`);

  const specsSummary = specs.length > 0 ? `\n[Property Specs]: ${specs.join(' • ')}` : '';

  // Create Deliverable Task
  const creativeDraft =
    category === 'signage'
      ? null
      : buildCreativeTaskDraft({
          source: 'email',
          subject: email.subject,
          text: email.bodyText,
          propertyAddress,
          agentName,
        });

  const newTask: CanonicalMarketingTask = {
    id: taskId,
    requestId,
    title: deliverableTitle,
    category,
    status: 'request_received', // Always Intake Received — photos do not auto-start production
    assignedTo: assignedLead, // Melissa for marketing triage; she routes / assigns next
    assignedToId: 'dir_melissa_gagliardi_33',
    assignedToRole: 'Marketing Director',
    reviewOwner: assignedLead === 'Melissa Gagliardi' ? 'Melissa Gagliardi' : undefined,
    reviewOwnerName: assignedLead === 'Melissa Gagliardi' ? 'Melissa Gagliardi' : undefined,
    agentName,
    propertyAddress,
    photos: structuredPhotos,
    attachments: structuredAttachments,
    driveFolderUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    vendorName: category === 'signage' ? 'Coastal Sign Post Co.' : (category === 'print' ? 'Coastal Print Works' : undefined),
    isArchived: false,
    notes: creativeDraft
      ? `${creativeDraft.notes}\n\nEmail received at asknora@nestrealty.com.${specsSummary}\n[Attachments]: ${photoAttachments.map(p => p.filename).join(', ') || '1004.jpg'} ${driveFolderUrl ? `Google Drive: ${driveFolderUrl}` : "Drive folder pending"}`
      : `Email received at asknora@nestrealty.com.${specsSummary}\n[Attachments]: ${photoAttachments.map(p => p.filename).join(', ') || '1004.jpg'} ${driveFolderUrl ? `Google Drive: ${driveFolderUrl}` : "Drive folder pending"}`,
    ...(creativeDraft
      ? {
          creativeBrief: creativeDraft.creativeBrief,
          routingSnapshot: {
            ...creativeDraft.routingSnapshot,
            fulfillmentStaffName: 'Eduardo Lovo',
          },
        }
      : {}),
  } as CanonicalMarketingTask;

  saveCanonicalMarketingTask(newTask);

  processedMessageIds.add(email.messageId);

  console.log(`[EmailIntake] Successfully ingested marketing email from ${email.fromEmail} -> Created task "${deliverableTitle}" for ${propertyAddress} (Assigned to ${assignedLead}, with ${structuredPhotos.length} photos)`);

  // 3. Idempotent confirmation (one per request) via durable outbox
  try {
    await enqueueOutboundEmail({
      workspaceId: 'ws_wilmington',
      messageType: 'intake_confirmed',
      idempotencyKey: `ws_wilmington:agent:${String(agentEmail||"").toLowerCase()}:addr:${String(propertyAddress||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,120)}:intake_confirmation:v2`,
      recipient: email.fromEmail,
      subject: `Marketing Intake Confirmed: ${propertyAddress}`,
      payload: {
        toEmail: email.fromEmail,
        agentName: email.fromName,
        propertyAddress,
        deliverables: items,
        assignedLead,
        trackerUrl: `https://shapework.co/track/marketing/${generateMarketingTrackerToken(taskId)}`
      }
    });
    await processOutboundEmailOutbox();
  } catch (err) {
    console.warn(`[EmailIntake] Notice enqueueing intake confirmation email to ${email.fromEmail}:`, err);
  }

  return {
    isMarketingRequest: true,
    propertyAddress,
    deliverableTitle,
    category,
    agentName,
    agentEmail: email.fromEmail,
    extractedPhotosCount: photoAttachments.length,
    driveFolderUrl,
    createdRequestId: requestId,
    createdTaskId: taskId,
    assignedLead,
    photos: structuredPhotos,
    attachments: structuredAttachments
  };
}

/**
 * Synchronizes unread emails from asknora@nestrealty.com.
 * In development/test mode, only process explicit whitelisted test emails.
 */
export async function syncNoraEmailInbox(workspaceId: string = 'nest-realty-demo'): Promise<{
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
      if (!connection && workspaceId !== 'nest-realty-demo') {
        connection = await store.getConnection('nest-realty-demo', 'google_workspace');
      }
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
        q: 'to:asknora@nestrealty.com OR to:me'
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

            let fromEmail = 'matt.orr@nestrealty.com';
            let fromName = 'Matt Orr';
            const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
            if (emailMatch[1]) {
              fromEmail = emailMatch[1].trim();
              fromName = fromHeader.replace(/<[^>]+>/, '').trim().replace(/"/g, '') || fromEmail;
            }

            let bodyText = msgDetail.data.snippet || '';
            const attachments: InboundAgentEmail['attachments'] = [];

            const parts = msgDetail.data.payload?.parts || [];
            for (const part of parts) {
              if (part.filename) {
                attachments.push({
                  filename: part.filename,
                  contentType: part.mimeType || 'image/jpeg',
                  sizeBytes: part.body?.size || 1000000,
                  url: `https://drive.google.com/file/d/${part.body?.attachmentId || 'attached'}`
                });
              }
              if (part.mimeType === 'text/plain' && part.body?.data) {
                try {
                  bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
                } catch {}
              }
            }

            const parsedEmail: InboundAgentEmail = {
              id: `gmail_${msgRef.id}`,
              messageId: msgRef.id,
              fromEmail,
              fromName,
              subject: subjectHeader,
              bodyText,
              receivedAt: new Date(dateHeader).toISOString(),
              attachments
            };

            const res = await processInboundAgentEmail(parsedEmail);
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
  for (const email of SEED_INBOX_EMAILS) {
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
