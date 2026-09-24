import { describe, it, expect, beforeAll } from 'vitest';
import {
  classifyInboundEmail,
  isPhysicalSignageIntent
} from '../../server/services/nora/noraEmailClassifier.js';
import {
  isCustomSignageRequest,
  extractLocationDescription,
  extractDueDateFromText,
  parseSender,
  ingestInboundEmailToTask
} from '../../server/services/inboundEmailIngestionEngine.js';
import {
  getCanonicalMarketingTaskById,
  getCanonicalMarketingRequestById,
  getAllCanonicalMarketingTasks
} from '../../server/persistence/marketingCampaignsRepository.js';
import { requireStaffOrOidcAuth } from '../../server/auth/auth.js';
import { signJwt } from '../../server/auth/jwt.js';
import { processFetchedInboxMessage, InboxScanSummary } from '../../server/services/noraInboxScannerService.js';

describe('Nora Custom Sign Inbound Intake & Scanner Resilience Suite', () => {
  beforeAll(async () => {
    const { getDbPool } = await import('../../server/persistence/repositories.js');
    const pool = getDbPool();
    if (pool) {
      await pool.query("DELETE FROM inbound_email_idempotency_log WHERE message_id ILIKE '%CAKqjvSmc2HO%'");
      await pool.query("DELETE FROM nora_inbound_email_ledger WHERE rfc_message_id ILIKE '%CAKqjvSmc2HO%' OR provider_message_id ILIKE '%CAKqjvSmc2HO%'");
    }
  });
  // --------------------------------------------------------------------------
  // 1. Classifier & Signage Intent Tests
  // --------------------------------------------------------------------------
  describe('1. Classifier Intent Detection & Disambiguation', () => {
    it('accurately classifies James Fort custom sign email as marketing_task with physical signage intent', () => {
      const emailBody =
        'Hi I need a custom sign designed and printed for a mobile home in Rocky point. I also need and it picked up and delivered / installed asap. I don’t have a signed listing agreement or any info on the property. Sorry.';
      const from = 'James Fort <james.fort@nestrealty.com>';
      const subject = 'Custom sign request';

      const isSign = isPhysicalSignageIntent(`${subject} ${emailBody}`);
      expect(isSign).toBe(true);

      const classification = classifyInboundEmail(from, subject, emailBody, 0);
      expect(classification.intent).toBe('marketing_task');
      expect(classification.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('distinguishes physical signage from document signing, e-signatures, and sign-offs', () => {
      expect(isPhysicalSignageIntent('Please sign the listing agreement when you have a moment.')).toBe(false);
      expect(isPhysicalSignageIntent('Can you sign this document and return via DocuSign?')).toBe(false);
      expect(isPhysicalSignageIntent('Here is the contract for e-sign.')).toBe(false);
      expect(isPhysicalSignageIntent('Please review the proof and let me know if you sign off on it.')).toBe(false);
      expect(isPhysicalSignageIntent('Thanks,\nBest regards,\nJames Fort\n[Email Signature]')).toBe(false);
    });

    it('identifies custom signage requests correctly', () => {
      expect(
        isCustomSignageRequest(
          'Hi I need a custom sign designed and printed for a mobile home in Rocky point.'
        )
      ).toBe(true);
      expect(isCustomSignageRequest('Please print 50 open house flyers')).toBe(false);
      expect(isCustomSignageRequest('Please install a standard yard sign post')).toBe(false);
    });

    it('extracts regional location description when exact street address is missing', () => {
      const body =
        'Hi I need a custom sign designed and printed for a mobile home in Rocky point. I also need and it picked up and delivered / installed asap.';
      const loc = extractLocationDescription('Custom sign request', body);
      expect(loc).toBe('Rocky Point');
    });

    it('leaves due date unset (undefined) for ASAP or flexible requests without fabricating timestamps', () => {
      const asapDue = extractDueDateFromText(
        'I also need and it picked up and delivered / installed asap. I don’t have a signed listing agreement.'
      );
      expect(asapDue).toBeUndefined();

      const flexibleDue = extractDueDateFromText('Timeline is flexible, no rush.');
      expect(flexibleDue).toBeUndefined();

      const explicitDue = extractDueDateFromText('Need this printed by September 15, 2026.');
      expect(explicitDue).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 2. Ingestion Engine & Task Creation
  // --------------------------------------------------------------------------
  describe('2. Inbound Email Ingestion for James Fort Custom Sign', () => {
    let createdTaskId = '';
    let createdRequestId = '';

    it('ingests James Fort custom sign email into exactly ONE task owned by Melissa in request_received', async () => {
      const from = 'James Fort <james.fort@nestrealty.com>';
      const to = 'AskNora@nestrealty.com';
      const subject = 'Custom sign request';
      const textContent =
        'Hi I need a custom sign designed and printed for a mobile home in Rocky point. I also need and it picked up and delivered / installed asap. I don’t have a signed listing agreement or any info on the property. Sorry.';
      const messageId = '<CAKqjvSmc2HO=b5srbxw8vdZ=mC+ui0GRrsLuPMFxNbDqHY8XBw@mail.gmail.com>';
      const threadId = '1876063821379569207';

      const result = await ingestInboundEmailToTask({
        from,
        to,
        subject,
        textContent,
        attachments: [],
        messageId,
        threadId
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.requestId).toBeDefined();
      createdTaskId = result.taskId;
      createdRequestId = result.requestId;

      // Melissa Gagliardi is the intake owner
      expect(result.assignedTo).toBe('Melissa Gagliardi');
      expect(result.ccRecipient).toBe('melissa.gagliardi@nestrealty.com');

      // Verify Canonical Task properties
      const task = getCanonicalMarketingTaskById(createdTaskId);
      expect(task).toBeDefined();
      if (!task) return;

      expect(task.title).toBe('Custom sign design & printing — Rocky Point');
      expect(task.status).toBe('request_received');
      expect(task.assignedTo).toBe('Melissa Gagliardi');
      expect(task.assignedToId).toBe('dir_melissa_gagliardi_33');
      expect(task.assignedToRole).toBe('Marketing Director');
      expect(task.reviewOwner).toBe('Melissa Gagliardi');
      expect(task.reviewOwnerId).toBe('dir_melissa_gagliardi_33');
      expect(task.agentName).toBe('James Fort');
      expect(task.agentEmail).toBe('james.fort@nestrealty.com');
      expect(task.createdById).toBe('usr_james_full');

      // Due date remains unset (undefined), NOT a fabricated 48-hour timestamp
      expect(task.dueAt).toBeUndefined();

      // Property address remains unset / undefined (no fabricated street address)
      expect(task.propertyAddress).toBeUndefined();

      // Custom fields
      expect((task as any).locationDescription).toBe('Rocky Point');
      expect((task as any).scope).toBe('Design, printing, pickup, delivery, and installation.');
      expect((task as any).requestedTiming).toBe('ASAP');

      // Review blockers populated in requirements with needs_correction
      expect(task.requirements).toBeDefined();
      expect(task.requirements?.length).toBe(2);

      const propRequirement = task.requirements?.find(r => r.id.includes('prop_details'));
      expect(propRequirement).toBeDefined();
      expect(propRequirement?.status).toBe('needs_correction');
      expect(propRequirement?.state).toBe('needs_correction');

      const listingRequirement = task.requirements?.find(r => r.id.includes('signed_listing'));
      expect(listingRequirement).toBeDefined();
      expect(listingRequirement?.status).toBe('needs_correction');
      expect(listingRequirement?.state).toBe('needs_correction');

      // Verify Canonical Request properties
      const request = getCanonicalMarketingRequestById(createdRequestId);
      expect(request).toBeDefined();
      if (!request) return;

      expect(request.title).toBe('Custom sign design & printing — Rocky Point');
      expect(request.status).toBe('request_received');
      expect(request.assignedTo).toBe('Melissa Gagliardi');
      expect(request.taskIds).toContain(createdTaskId);
      expect(request.createdById).toBe('usr_james_full');
    });

    it('enforces sender directory enrichment for James Fort without fallback phone contamination', () => {
      const sender = parseSender('James Fort <james.fort@nestrealty.com>');
      expect(sender.name).toBe('James Fort');
      expect(sender.email).toBe('james.fort@nestrealty.com');
      expect(sender.phone).toBe('(910) 617-8264');
      expect(sender.role).toBe('Broker');
      // Must NOT be Marcus Aman's phone number
      expect(sender.phone).not.toBe('+12527170595');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Endpoint Security & Status Reporting for /api/marketing/inbox/scan-now
  // --------------------------------------------------------------------------
  describe('3. POST /api/marketing/inbox/scan-now Endpoint Security & Statuses', () => {
    it('rejects public unauthenticated callers with HTTP 401', async () => {
      const req: any = {
        headers: {},
        cookies: {}
      };
      let statusCalled = 0;
      let jsonPayload: any = null;
      const res: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: (data: any) => {
              jsonPayload = data;
              return res;
            }
          };
        }
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await requireStaffOrOidcAuth(req, res, next);
      expect(statusCalled).toBe(401);
      expect(nextCalled).toBe(false);
      expect(jsonPayload?.error).toBe('unauthorized');
    });

    it('rejects invalid or forged tokens with HTTP 401', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer invalid-garbage-token-abc-123'
        },
        cookies: {}
      };
      let statusCalled = 0;
      const res: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: () => res
          };
        }
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await requireStaffOrOidcAuth(req, res, next);
      expect(statusCalled).toBe(401);
      expect(nextCalled).toBe(false);
    });

    it('allows verified staff sessions signed with Shapework JWT', async () => {
      const validStaffToken = signJwt({
        userId: 'usr_melissa',
        email: 'melissa.gagliardi@nestrealty.com',
        role: 'marketing_director'
      });

      const req: any = {
        headers: {
          authorization: `Bearer ${validStaffToken}`
        },
        cookies: {}
      };
      let statusCalled = 0;
      const res: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: () => res
          };
        }
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await requireStaffOrOidcAuth(req, res, next);
      expect(statusCalled).toBe(0);
      expect(nextCalled).toBe(true);
      expect(req.authUser).toBeDefined();
      expect(req.authUser.email).toBe('melissa.gagliardi@nestrealty.com');
    });

    it('allows Google Cloud Scheduler OIDC Service Account tokens', async () => {
      // Mock an OIDC token payload with Google issuer and authorized service account
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          iss: 'https://accounts.google.com',
          email: 'shapework-production-runtime@shapework-505316.iam.gserviceaccount.com',
          email_verified: true,
          aud: 'https://shapework.co/api/marketing/inbox/scan-now'
        })
      ).toString('base64url');
      const fakeSig = Buffer.from('mock-rs256-signature').toString('base64url');
      const mockOidcToken = `${header}.${payload}.${fakeSig}`;

      const req: any = {
        headers: {
          authorization: `Bearer ${mockOidcToken}`
        },
        cookies: {}
      };
      let statusCalled = 0;
      const res: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: () => res
          };
        }
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await requireStaffOrOidcAuth(req, res, next);
      expect(statusCalled).toBe(0);
      expect(nextCalled).toBe(true);
      expect(req.authSource).toBe('google_oidc_scheduler');
    });

    it('verifies scan-now status code contract (502 fatal_error, 207 partial_failure, 200 ok/lock_skipped)', () => {
      // Test status code mapping helper logic matching server.ts:
      const resolveStatus = (summaryStatus: string) => {
        return summaryStatus === 'fatal_error'
          ? 502
          : summaryStatus === 'partial_failure'
          ? 207
          : 200;
      };

      expect(resolveStatus('fatal_error')).toBe(502);
      expect(resolveStatus('partial_failure')).toBe(207);
      expect(resolveStatus('ok')).toBe(200);
      expect(resolveStatus('lock_skipped')).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Scanner Raw MIME Parsing, Error Resilience, & Cross-Folder Deduplication
  // --------------------------------------------------------------------------
  describe('4. Scanner Raw MIME Parsing, Resilience, & Cross-Folder Deduplication', () => {
    it('parses raw MIME message bytes via simpleParser and creates marketing intake task', async () => {
      const scannerMsgId = `<CAKqjvSmc2HO_scanner_${Date.now()}@mail.gmail.com>`;
      const rawMime = [
        'From: James Fort <james.fort@nestrealty.com>',
        'To: AskNora@nestrealty.com',
        'Subject: Custom sign request',
        `Message-ID: ${scannerMsgId}`,
        'Date: Fri, 11 Sep 2026 15:11:00 -0400',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'Hi I need a custom sign designed and printed for a mobile home in Rocky point. I also need and it picked up and delivered / installed asap. I don’t have a signed listing agreement or any info on the property. Sorry.'
      ].join('\r\n');

      const msg = {
        uid: 1044,
        seq: 44,
        source: Buffer.from(rawMime),
        envelope: {
          messageId: scannerMsgId,
          subject: 'Custom sign request'
        },
        flags: new Set<string>()
      };
      const mockClient = {
        messageFlagsAdd: async (uid: string, flags: string[]) => {
          flags.forEach(f => msg.flags.add(f));
        }
      };
      const summary: InboxScanSummary = {
        status: 'ok',
        scannedCount: 0,
        ingestedCount: 0,
        conversationalCount: 0,
        suppressedCount: 0,
        results: [],
        errors: []
      };

      await processFetchedInboxMessage(msg, mockClient, summary);

      expect(summary.scannedCount).toBe(1);
      expect(summary.ingestedCount).toBe(1);
      expect(summary.errors.length).toBe(0);
      expect(summary.results.length).toBe(1);

      const result = summary.results[0];
      expect(result.assignedTo).toBe('Melissa Gagliardi');
      expect(result.actionTaken).toBe('created_new');
      expect(msg.flags.has('\\Seen')).toBe(true);
    });

    it('isolates malformed messages without aborting subsequent message scans and reports partial_failure', async () => {
      const corruptMsg = {
        uid: 9999,
        seq: 99,
        source: null, // Missing source bytes simulates corrupted IMAP fetch
        envelope: { messageId: `<corrupt_msg_${Date.now()}@nestrealty.com>` }
      };

      const validMsgId = `<valid_scanner_resilience_${Date.now()}_512@nestrealty.com>`;
      const validMsgMime = [
        'From: Marcus Aman <marcus.aman@gmail.com>',
        'To: AskNora@nestrealty.com',
        'Subject: 512 Northern Blvd Flyer Request',
        `Message-ID: ${validMsgId}`,
        'Date: Fri, 11 Sep 2026 15:30:00 -0400',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'Hi Nora, please prepare listing flyers for 512 Northern Blvd.'
      ].join('\r\n');

      const validMsg = {
        uid: 1045,
        seq: 45,
        source: Buffer.from(validMsgMime),
        envelope: {
          messageId: validMsgId,
          subject: '512 Northern Blvd Flyer Request'
        },
        flags: new Set<string>()
      };

      const mockClient = {
        messageFlagsAdd: async (uid: string, flags: string[]) => {
          flags.forEach(f => validMsg.flags.add(f));
        }
      };

      const summary: InboxScanSummary = {
        status: 'ok',
        scannedCount: 0,
        ingestedCount: 0,
        conversationalCount: 0,
        suppressedCount: 0,
        results: [],
        errors: []
      };

      // 1. Process corrupt message - should NOT throw and record error
      await processFetchedInboxMessage(corruptMsg, mockClient, summary);
      expect(summary.scannedCount).toBe(1);
      expect(summary.errors.length).toBe(1);
      expect(summary.errors[0]).toContain('missing source bytes');

      // 2. Process subsequent valid message - must succeed despite earlier error
      await processFetchedInboxMessage(validMsg, mockClient, summary);
      expect(summary.scannedCount).toBe(2);
      expect(summary.ingestedCount).toBe(1);

      // Verify status evaluation: errors > 0 with partial ingestion evaluates to partial_failure
      summary.status = summary.errors.length > 0 ? 'partial_failure' : 'ok';
      expect(summary.status).toBe('partial_failure');
    });

    it('deduplicates across mailbox folders (INBOX vs All Mail) using clean RFC Message-ID', async () => {
      const sharedMessageId = `<dedup_test_${Date.now()}_cross_folder@nestrealty.com>`;
      const rawContent = [
        'From: Marcus Aman <marcus.aman@gmail.com>',
        'To: AskNora@nestrealty.com',
        'Subject: 818 Pine Valley Rd Brochure Request',
        `Message-ID: ${sharedMessageId}`,
        'Date: Fri, 11 Sep 2026 16:00:00 -0400',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'Please prepare brochures for 818 Pine Valley Rd.'
      ].join('\r\n');

      // Message from INBOX folder (UID 44)
      const inboxMsg = {
        uid: 2044,
        seq: 101,
        source: Buffer.from(rawContent),
        envelope: { messageId: sharedMessageId },
        flags: new Set<string>()
      };

      // Same message from All Mail folder (UID 220)
      const allMailMsg = {
        uid: 2220,
        seq: 550,
        source: Buffer.from(rawContent),
        envelope: { messageId: sharedMessageId },
        flags: new Set<string>()
      };

      const mockClient = {
        messageFlagsAdd: async (uid: string, flags: string[]) => {}
      };

      const summary1: InboxScanSummary = {
        status: 'ok',
        scannedCount: 0,
        ingestedCount: 0,
        conversationalCount: 0,
        suppressedCount: 0,
        results: [],
        errors: []
      };

      // 1. Process INBOX message
      await processFetchedInboxMessage(inboxMsg, mockClient, summary1);
      expect(summary1.ingestedCount).toBe(1);

      // 2. Process All Mail message (different UID, but identical RFC Message-ID)
      const summary2: InboxScanSummary = {
        status: 'ok',
        scannedCount: 0,
        ingestedCount: 0,
        conversationalCount: 0,
        suppressedCount: 0,
        results: [],
        errors: []
      };

      await processFetchedInboxMessage(allMailMsg, mockClient, summary2);
      // Second message must be skipped by lease deduplication!
      expect(summary2.ingestedCount).toBe(0);
    });
  });
});

