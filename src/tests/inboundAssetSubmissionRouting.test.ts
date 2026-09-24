/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Inbound Asset Submission Routing Test Suite
 * 
 * Verifies the 11 key requirements:
 * 1. Intent Classification (Matt Orr's email -> asset_submission, confidence >= 0.95)
 * 2. Signature & Hosted Artwork Filtering
 * 3. Exact Canonical Task & Request Resolution
 * 4. Durable Asset Ingestion without modifying assignee/lane/status
 * 5. Immutable Activity Event Recording
 * 6. Concise Threaded Confirmation with Grammatical Accuracy
 * 7. Deduplication & Idempotency
 * 8. Ambiguous Match Holding
 * 9. No-Match Zero Hallucination
 * 10. Mixed Question + Asset Submission Handling
 * 11. Persistence Failure Safety (Confirmation Suppressed on Failure)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { classifyInboundEmail } from '../../server/services/nora/noraEmailClassifier.js';
import { classifyAttachments } from '../../server/services/nora/attachmentClassifier.js';
import { matchInboundEmailToTask } from '../../server/services/nora/noraTaskMatcher.js';
import { processInboundAssetSubmission } from '../../server/services/nora/noraAssetIngestionService.js';
import {
  formatPhotoCountPhrase,
  composeAssetConfirmation,
  sendAssetSubmissionConfirmation
} from '../../server/services/nora/noraAssetConfirmationService.js';
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getCanonicalMarketingRequestById,
  getCanonicalMarketingTaskById,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';
import { getActivityHistoryForRequest } from '../../server/services/activityHistoryService.js';
import { resetProcessedMessageIdsForTesting } from '../../server/services/nora/noraAssetIngestionService.js';

describe('Nora Inbound Email Asset Submission & Task Linkage', () => {
  beforeEach(async () => {
    resetCanonicalStoreForTesting();
    resetProcessedMessageIdsForTesting();

    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool();
      if (pool) {
        await pool.query(`
          ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
        `).catch(() => {});
      }
    } catch {}

    // Seed test request and tasks for 13 Water Street
    saveCanonicalMarketingRequest({
      id: 'req_call_call_c6bc20d74171f55359a61593297',
      title: '13 Water Street, Wilmington NC',
      propertyAddress: '13 Water Street, Wilmington NC',
      agentName: 'Matt Orr (REALTOR®)',
      agentEmail: 'matt.orr@nestrealty.com',
      channel: 'phone',
      mlsNumber: '1004444444',
      status: 'request_received',
      category: 'open_house',
      taskIds: [
        'task_call_call_c6bc20d74171f55359a61593297_0',
        'task_call_call_c6bc20d74171f55359a61593297_1'
      ],
      photos: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    saveCanonicalMarketingTask({
      id: 'task_call_call_c6bc20d74171f55359a61593297_0',
      requestId: 'req_call_call_c6bc20d74171f55359a61593297',
      workspaceId: 'ws_wilmington',
      title: 'Open House Single-Page Flyer — 13 Water Street',
      status: 'request_received',
      category: 'open_house',
      agentName: 'Matt Orr (REALTOR®)',
      propertyAddress: '13 Water Street, Wilmington NC',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      assignedToRole: 'Marketing Director',
      photos: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    saveCanonicalMarketingTask({
      id: 'task_call_call_c6bc20d74171f55359a61593297_1',
      requestId: 'req_call_call_c6bc20d74171f55359a61593297',
      workspaceId: 'ws_wilmington',
      title: 'Social Media Campaign & Instagram Story — 13 Water Street',
      status: 'request_received',
      category: 'social',
      agentName: 'Matt Orr (REALTOR®)',
      propertyAddress: '13 Water Street, Wilmington NC',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      assignedToRole: 'Marketing Director',
      photos: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  it('1. Correctly classifies Matt Orr\'s "13 Water St Pictures" email as asset_submission (confidence >= 0.95)', () => {
    const classification = classifyInboundEmail(
      'matt.orr@nestrealty.com',
      '13 Water St Pictures',
      'Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.',
      2
    );

    expect(classification.intent).toBe('asset_submission');
    expect(classification.confidence).toBeGreaterThanOrEqual(0.95);
    expect(classification.isAssetSubmission).toBe(true);
    expect(classification.detectedPropertyAddress).toBe('13 Water St');
    expect(classification.detectedDeliverable).toBe('Instagram Story');
  });

  it('2. Distinguishes genuine property attachments from signature & hosted artwork', () => {
    const rawAttachments = [
      {
        filename: 'afa93a505bbcff7db33969681c9674a9-uncropped_scaled_within_1536_1152.webp',
        contentType: 'image/webp',
        sizeBytes: 254800,
        content: Buffer.from('fake_image_bytes_for_property_photo_above_threshold')
      },
      {
        filename: 'image001.png',
        contentType: 'image/png',
        sizeBytes: 4200,
        cid: 'sig_logo_img_001',
        contentDisposition: 'inline'
      }
    ];

    const htmlContent = `
      <div class="email-body">
        <p>Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.</p>
        <div class="gmail_signature">
          <p>Matt Orr | Nest Realty Wilmington</p>
          <img src="cid:sig_logo_img_001" alt="Nest Realty" />
        </div>
      </div>
    `;

    const classified = classifyAttachments(rawAttachments, htmlContent);

    expect(classified.propertyAssets.length).toBe(1);
    expect(classified.propertyAssets[0].filename).toBe('afa93a505bbcff7db33969681c9674a9-uncropped_scaled_within_1536_1152.webp');
    expect(classified.propertyAssets[0].isPropertyAsset).toBe(true);

    expect(classified.signatureAssets.length).toBe(1);
    expect(classified.signatureAssets[0].filename).toBe('image001.png');
    expect(classified.signatureAssets[0].isSignature).toBe(true);
  });

  it('3. Resolves existing 13 Water St task and deliverable accurately', async () => {
    const match = await matchInboundEmailToTask({
      senderEmail: 'matt.orr@nestrealty.com',
      senderName: 'Matt Orr',
      propertyAddressText: '13 Water St',
      deliverableText: 'Instagram Story',
      subject: '13 Water St Pictures',
      bodyText: 'Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.'
    });

    expect(match.status).toBe('EXACT_MATCH');
    expect(match.request).toBeDefined();
    expect(match.request?.id).toBe('req_call_call_c6bc20d74171f55359a61593297');
    expect(match.task).toBeDefined();
    expect(match.task?.id).toBe('task_call_call_c6bc20d74171f55359a61593297_1');
    expect(match.task?.category).toBe('social');
  });

  it('4. Persists photo durably to task and request without altering assignee or status', async () => {
    const result = await processInboundAssetSubmission({
      messageId: '<msg_test_water_st_001@nestrealty.com>',
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      subject: '13 Water St Pictures',
      textContent: 'Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.',
      attachments: [
        {
          filename: '13_water_front_exterior.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 420000,
          content: Buffer.from('test_photo_content_buffer_data_12345')
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('PROCESSED');
    expect(result.addedPhotos.length).toBe(1);

    // Verify task photos
    const updatedTask = getCanonicalMarketingTaskById('task_call_call_c6bc20d74171f55359a61593297_1');
    expect(updatedTask?.photos).toBeDefined();
    expect(updatedTask?.photos?.length).toBe(1);
    expect(updatedTask?.photos?.[0].name).toBe('13_water_front_exterior.jpg');

    // Verify assignee, reviewer, and status were strictly PRESERVED
    expect(updatedTask?.assignedTo).toBe('Melissa Gagliardi');
    expect(updatedTask?.assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(updatedTask?.status).toBe('request_received');

    // Verify request photos
    const updatedReq = getCanonicalMarketingRequestById('req_call_call_c6bc20d74171f55359a61593297');
    expect(updatedReq?.photos).toBeDefined();
    expect(updatedReq?.photos?.length).toBe(1);
    expect(updatedReq?.photos?.[0].name).toBe('13_water_front_exterior.jpg');
  });

  it('5. Records immutable activity event: "Matt Orr added 1 photo by email"', async () => {
    const result = await processInboundAssetSubmission({
      messageId: '<msg_test_activity_event_001@nestrealty.com>',
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      subject: '13 Water St Pictures',
      textContent: 'Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.',
      attachments: [
        {
          filename: 'kitchen_island.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 310000,
          content: Buffer.from('photo_kitchen_island_unique_bytes')
        }
      ]
    });

    expect(result.success).toBe(true);
    const events = await getActivityHistoryForRequest('req_call_call_c6bc20d74171f55359a61593297', 'ws_wilmington');
    const emailEvent = events.find(e => e.eventType === 'photos.received' && (e.metadata?.photoNames as string[] | undefined)?.includes('kitchen_island.jpg'));
    expect(emailEvent).toBeDefined();
    expect(emailEvent?.summary).toBe('Matt Orr added 1 photo by email');
  });

  it('6. Composes concise confirmation with correct grammatical pluralization', () => {
    // 1 photo: "the photo" and pronoun "it"
    const single = composeAssetConfirmation('Matt', '13 Water Street', 'Instagram Story', 1);
    expect(single.plainText).toContain('I received the photo for the 13 Water Street Instagram Story and added it to the existing request.');
    expect(single.plainText).toContain('If you have additional photos, reply to this thread and attach them here.');

    // 2 photos: "2 photos" and pronoun "them"
    const multiple = composeAssetConfirmation('Matt', '13 Water Street', 'Instagram Story', 2);
    expect(multiple.plainText).toContain('I received 2 photos for the 13 Water Street Instagram Story and added them to the existing request.');
    expect(multiple.plainText).toContain('If you have additional photos, reply to this thread and attach them here.');
  });

  it('7. Guarantees deduplication and idempotency on duplicate email delivery', async () => {
    const testMsgId = '<msg_idempotent_test_001@nestrealty.com>';
    const photoBuffer = Buffer.from('identical_binary_buffer_for_idempotency_test');

    const firstRun = await processInboundAssetSubmission({
      messageId: testMsgId,
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      subject: '13 Water St Pictures',
      textContent: 'Here is the photo.',
      attachments: [
        {
          filename: 'living_room.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 150000,
          content: photoBuffer
        }
      ]
    });

    expect(firstRun.success).toBe(true);
    expect(firstRun.addedPhotos.length).toBe(1);

    // Re-run with the same messageId
    const secondRun = await processInboundAssetSubmission({
      messageId: testMsgId,
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      subject: '13 Water St Pictures',
      textContent: 'Here is the photo.',
      attachments: [
        {
          filename: 'living_room.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 150000,
          content: photoBuffer
        }
      ]
    });

    expect(secondRun.success).toBe(true);
    expect(secondRun.status).toBe('ALREADY_PROCESSED');

    // Verify task photos array was not duplicated
    const task = getCanonicalMarketingTaskById('task_call_call_c6bc20d74171f55359a61593297_1');
    const livingRoomPhotos = (task?.photos || []).filter(p => p.name === 'living_room.jpg');
    expect(livingRoomPhotos.length).toBe(1);
  });

  it('8. Holds ambiguous multi-match without guessing and notifies intake owner', async () => {
    // Add a second request for the same property address
    saveCanonicalMarketingRequest({
      id: 'req_duplicate_water_st',
      title: '13 Water Street Duplicate Listing',
      propertyAddress: '13 Water Street, Wilmington NC',
      agentName: 'Ryan Crecelius',
      agentEmail: 'ryan@nestrealty.com',
      channel: 'phone',
      status: 'request_received',
      taskIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const match = await matchInboundEmailToTask({
      senderEmail: 'unknown.broker@nestrealty.com',
      propertyAddressText: '13 Water St',
      deliverableText: 'Flyer'
    });

    expect(match.status).toBe('AMBIGUOUS');
    expect(match.intakeOwner.name).toBe('Melissa Gagliardi');
    expect(match.intakeOwner.role).toBe('Marketing Director');
  });

  it('9. Never creates spurious duplicate tasks on non-matching address (NO_MATCH)', async () => {
    const tasksCountBefore = getAllCanonicalMarketingTasks().length;

    const result = await processInboundAssetSubmission({
      messageId: '<msg_no_match_001@nestrealty.com>',
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      subject: '999 Nonexistent Blvd Pictures',
      textContent: 'Here are the photos for 999 Nonexistent Blvd.',
      attachments: [
        {
          filename: 'exterior.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 200000,
          content: Buffer.from('some_bytes')
        }
      ]
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('NO_MATCH');
    expect(result.intakeOwner.name).toBe('Melissa Gagliardi');

    const tasksCountAfter = getAllCanonicalMarketingTasks().length;
    expect(tasksCountAfter).toBe(tasksCountBefore);
  });

  it('10. Handles mixed question and asset submission gracefully', async () => {
    const classification = classifyInboundEmail(
      'matt.orr@nestrealty.com',
      '13 Water St Pictures & Question',
      'Hi Nora, here is the photo for the 13 Water Street Instagram Story. Also, what is our open house directional signage policy?',
      1
    );

    expect(classification.intent).toBe('mixed_question_and_update');
    expect(classification.isAssetSubmission).toBe(true);

    const confirmation = composeAssetConfirmation(
      'Matt',
      '13 Water Street',
      'Instagram Story',
      1,
      'Directional signs may be placed starting Friday at 5 PM and must be removed by 7 PM on Sunday.'
    );

    expect(confirmation.plainText).toContain('I received the photo for the 13 Water Street Instagram Story');
    expect(confirmation.plainText).toContain('Directional signs may be placed');
  });

  it('11. Suppresses confirmation email if durable persistence fails', async () => {
    const failedResult = {
      success: false,
      status: 'ERROR' as const,
      addedPhotos: [],
      signatureCount: 0,
      message: 'PostgreSQL connection timeout during write',
      intakeOwner: { name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com', role: 'Marketing Director' },
      error: 'Database write failed'
    };

    const outcome = await sendAssetSubmissionConfirmation({
      inboundMessageId: '<msg_db_fail_test@nestrealty.com>',
      senderEmail: 'matt.orr@nestrealty.com',
      senderName: 'Matt Orr',
      originalSubject: '13 Water St Pictures',
      ingestionResult: failedResult
    });

    expect(outcome.success).toBe(false);
    expect(outcome.action).toBe('error');
    expect(outcome.error).toContain('persistence failed');
  });
});
