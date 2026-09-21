/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Melissa Production Feedback Corrections Test Suite:
 * 1. BIC Office Mapping (Mayfaire = Eric Knight, Carolina Beach = Jessica Keenan).
 * 2. James Fort Custom Sign Ingestion, Non-Fabricated Due Date, and Missing-Info Acknowledgment.
 * 3. Multi-Deliverable Decomposition, Independent Assignees, and Parent Aggregate Reporting.
 */

import { describe, it, expect } from 'vitest';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever.js';
import { CANONICAL_AGENT_DIRECTORY } from '../../src/services/canonicalRecipientService.js';
import {
  isInformationalQuery,
  shouldCreateRequestFromCall
} from '../../server/persistence/marketingCampaignsRepository.js';
import {
  normalizeMarketingDeliverables
} from '../../server/services/noraMarketingIntakeOrchestrator.js';
import {
  extractEmailDeliverables,
  isCustomSignageRequest,
  ingestInboundEmailToTask,
  memoryOutbox
} from '../../server/services/inboundEmailIngestionEngine.js';
import { extractCleanBrief } from '../../src/components/marketing/TaskRequestDetailModal.js';

describe('Melissa Production Feedback Corrections', () => {

  describe('1. BIC Office Mapping & Informational Query Suppression', () => {
    it('maps Mayfaire BIC to Eric Knight and Carolina Beach BIC to Jessica Keenan in canonical directory', () => {
      const eric = CANONICAL_AGENT_DIRECTORY.find(m => m.name === 'Eric Knight');
      expect(eric).toBeDefined();
      expect(eric?.office).toBe('Mayfaire');
      expect(eric?.isBic).toBe(true);

      const jessica = CANONICAL_AGENT_DIRECTORY.find(m => m.name === 'Jessica Keenan');
      expect(jessica).toBeDefined();
      expect(jessica?.office).toBe('Carolina Beach');
      expect(jessica?.isBic).toBe(true);
    });

    it('returns Eric Knight for Mayfaire BIC queries in unified context retriever', () => {
      const queries = [
        'Who is the BIC of Mayfaire?',
        'Who is the Broker-in-Charge at Mayfair?',
        'Mayfaire office BIC'
      ];

      for (const q of queries) {
        const result = queryUnifiedContext(q);
        expect(result.spokenAnswer).toContain('Eric Knight');
        expect(result.spokenAnswer).toContain('Mayfaire');
        expect(result.spokenAnswer).not.toContain('Jessica Keenan is the Broker-in-Charge of Mayfaire');
      }
    });

    it('returns Jessica Keenan for Carolina Beach BIC queries in unified context retriever', () => {
      const queries = [
        'Who is the BIC of Carolina Beach?',
        'Who is the Broker-in-Charge for CB office?',
        'Carolina Beach BIC'
      ];

      for (const q of queries) {
        const result = queryUnifiedContext(q);
        expect(result.spokenAnswer).toContain('Jessica Keenan');
        expect(result.spokenAnswer).toContain('Carolina Beach');
      }
    });

    it('suppresses marketing task creation for informational BIC queries', () => {
      const bicQuestions = [
        'Who is the BIC of Mayfaire?',
        'Who is our broker in charge?',
        'Can you tell me who the BIC is for Carolina Beach?',
        'Who runs the Mayfaire office?'
      ];

      for (const q of bicQuestions) {
        expect(isInformationalQuery(q)).toBe(true);
        const decision = shouldCreateRequestFromCall(q);
        expect(decision.shouldCreate).toBe(false);
        expect(decision.reason).toContain('Informational question answered directly on call');
      }
    });
  });

  describe('2. James Fort Custom Sign Ingestion & Missing Info Acknowledgment', () => {
    it('identifies custom signage request and extracts 1 fulfillment task', () => {
      const subject = 'Urgent sign request';
      const body = 'Hi Nora,\nWe need a custom sign designed, printed, picked up, and installed at Rocky Point ASAP.\nThanks, James';
      
      expect(isCustomSignageRequest(`${subject} ${body}`)).toBe(true);

      const deliverables = extractEmailDeliverables(subject, body);
      expect(deliverables.length).toBe(1);
      expect(deliverables[0].title).toBe('Custom sign design & printing — Rocky Point');
      expect(deliverables[0].category).toBe('signage');
      expect(deliverables[0].assignedTo).toBe('Melissa Gagliardi');
    });

    it('does not fabricate due date (+48h) and displays Requested: ASAP', () => {
      const request: any = {
        id: 'req_test_sign_1',
        title: 'Custom sign design & printing — Rocky Point',
        propertyAddress: 'Rocky Point',
        requestExcerpt: 'Need a custom sign designed, printed, picked up, and installed at Rocky Point ASAP.',
        createdAt: '2026-09-11T14:00:00.000Z',
        status: 'request_received'
      };

      const task: any = {
        id: 'tsk_test_sign_1',
        title: 'Custom sign design & printing — Rocky Point',
        category: 'signage',
        status: 'request_received',
        notes: 'Timing: ASAP'
      };

      const brief = extractCleanBrief(request, task);
      expect(brief.dueDate).toBe('ASAP');
      expect(brief.dueDate).not.toBe('2026-09-13T14:00:00.000Z');
    });

    it('enqueues intake_missing_info_acknowledgment in durable outbox for custom signs', async () => {
      const emailPayload = {
        workspaceId: 'ws_wilmington',
        mailboxId: 'asknora@nestrealty.com',
        to: 'AskNora@nestrealty.com',
        from: 'James Fort <james.fort@nestrealty.com>',
        messageId: `<test-james-fort-${Date.now()}@mail.gmail.com>`,
        threadId: `th_james_fort_${Date.now()}`,
        subject: 'Urgent sign request',
        textContent: 'Need a custom sign designed, printed, and installed at Rocky Point ASAP.',
        receivedAt: new Date().toISOString(),
        authResults: { dmarcPass: true }
      };

      const result = await ingestInboundEmailToTask(emailPayload);
      expect(result.success).toBe(true);

      // Verify outbox entry in DB or memory
      const { dbPool, storageDriver } = await import('../../server/persistence/repositories.js');
      let customSignEntry: any = null;
      if (storageDriver === 'database' && dbPool) {
        const res = await dbPool.query(
          `SELECT * FROM outbound_email_outbox WHERE message_type = 'intake_missing_info_acknowledgment' AND recipient = 'james.fort@nestrealty.com'`
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          customSignEntry = {
            messageType: row.message_type,
            recipient: row.recipient,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
          };
        }
      }
      if (!customSignEntry) {
        customSignEntry = Array.from(memoryOutbox.values()).find(e => 
          e.messageType === 'intake_missing_info_acknowledgment' &&
          e.recipient === 'james.fort@nestrealty.com'
        );
      }

      expect(customSignEntry).toBeDefined();
      expect(customSignEntry?.payload.timing).toBe('ASAP');
      expect(customSignEntry?.payload.location).toBe('Rocky Point');
    });
  });

  describe('3. Multi-Deliverable Decomposition', () => {
    it('decomposes compound request "social post and flyer" into 2 distinct deliverables', () => {
      const result = normalizeMarketingDeliverables(
        ['social post and flyer'],
        'Agent wants a single-page flyer and social post'
      );

      expect(result.deliverables.length).toBe(2);
      expect(result.deliverables).toContain('Single-Page Flyer');
      expect(result.deliverables).toContain('Social Media Post & Graphics');
    });

    it('decomposes "flyer + brochure + email campaign" into multiple distinct deliverables', () => {
      const result = normalizeMarketingDeliverables(
        ['property flyer, brochure, and email campaign']
      );

      expect(result.deliverables.length).toBeGreaterThanOrEqual(2);
      expect(result.deliverables.some(d => d.includes('Flyer') || d.includes('Brochure'))).toBe(true);
      expect(result.deliverables.some(d => d.includes('Email'))).toBe(true);
    });

    it('keeps custom sign design, print, and installation as 1 fulfillment task', () => {
      const result = normalizeMarketingDeliverables(
        ['Custom sign design, printing, pickup, delivery, and installation at Rocky Point']
      );

      expect(result.deliverables.length).toBe(1);
    });

    it('creates separate child tasks with deterministic IDs for multi-deliverable inbound emails', async () => {
      const testTimestamp = Date.now();
      const emailPayload = {
        workspaceId: 'ws_wilmington',
        mailboxId: 'asknora@nestrealty.com',
        to: 'AskNora@nestrealty.com',
        from: 'Matt Orr <matt.orr@nestrealty.com>',
        messageId: `<test-multi-deliv-${testTimestamp}@mail.gmail.com>`,
        threadId: `th_multi_${testTimestamp}`,
        subject: `${testTimestamp} Pelican Point Way Marketing Materials`,
        textContent: `Hi Nora, please prepare a property flyer and a social media post for ${testTimestamp} Pelican Point Way.`,
        receivedAt: new Date().toISOString(),
        authResults: { dmarcPass: true }
      };

      const result = await ingestInboundEmailToTask(emailPayload);
      expect(result.success).toBe(true);
      expect(result.tasks).toBeDefined();
      expect(result.tasks!.length).toBe(2);

      const [flyerTask, socialTask] = result.tasks!;
      expect(flyerTask.id).not.toBe(socialTask.id);
      expect(flyerTask.category).toBe('print');
      expect(socialTask.category).toBe('social');
    });
  });

});
