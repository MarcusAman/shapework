/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Agent MMS Text-to-Request Service
 * Validates:
 * 1. Matching sender phone to verified Nest Agent Directory (Sarah Jenkins, Matt Orr, Dawn Thurston).
 * 2. Ingesting & categorizing texted property photos.
 * 3. Transcribing voice notes and extracting child deliverables (Flyer, Sign Post, Social Carousel).
 * 4. Auto-creating parent Request container and child tasks in 'Request Received'.
 * 5. Sending automated SMS confirmation receipt.
 */

import { describe, it, expect } from 'vitest';
import { MmsTextToRequestService } from '../../server/services/mmsTextToRequestService';

describe('Agent MMS Text-to-Request Bot & Omnichannel Ingest', () => {

  describe('1. Agent Directory Matching by Phone Number', () => {
    it('matches Sarah Jenkins by phone number (+19105550188)', () => {
      const broker = MmsTextToRequestService.resolveBrokerByPhone('+19105550188');
      expect(broker.name).toBe('Sarah Jenkins');
      expect(broker.email).toBe('sarah.jenkins@nestrealty.com');
      expect(broker.headshotUrl).toBeDefined();
    });

    it('matches Matt Orr by phone number (+19105550144)', () => {
      const broker = MmsTextToRequestService.resolveBrokerByPhone('+19105550144');
      expect(broker.name).toBe('Matt Orr');
      expect(broker.role).toBe('Senior Associate Broker');
    });

    it('provides a graceful fallback for unlisted phone numbers', () => {
      const broker = MmsTextToRequestService.resolveBrokerByPhone('+19105559999');
      expect(broker.name).toBe('Nest Listing Broker');
      expect(broker.phone).toBe('+19105559999');
    });
  });

  describe('2. Inbound MMS Ingestion & Autonomous Request Creation', () => {
    it('processes MMS with photos and voice memo, creating parent request + child deliverables', async () => {
      const payload = {
        messageId: 'mms_test_wrightsville_01',
        fromPhone: '+19105550188', // Sarah Jenkins
        body: '304 Ocean Blvd launch package! Photos attached. Need flyer, yard sign post with Coastal Sign Post, and social story ready for this weekend.',
        audioVoiceMemoUrl: 'https://actions.google.com/sounds/v1/speech/hello.ogg',
        mediaUrls: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90'
        ]
      };

      const result = await MmsTextToRequestService.processInboundMms(payload);

      // Verify MMS record
      expect(result.mmsRecord).toBeDefined();
      expect(result.mmsRecord.agentName).toBe('Sarah Jenkins');
      expect(result.mmsRecord.photos.length).toBe(2);
      expect(result.mmsRecord.voiceMemoTranscript).toBeDefined();
      expect(result.mmsRecord.smsReceiptSent).toBe(true);

      // Verify parent request
      expect(result.request).toBeDefined();
      expect(result.request.propertyAddress).toContain('304 Ocean Blvd');
      expect(result.request.agentName).toBe('Sarah Jenkins');

      // Verify child tasks
      expect(result.tasks.length).toBe(3);
      expect(result.tasks.every(t => t.status === 'request_received')).toBe(true);

      const flyerTask = result.tasks.find(t => t.category === 'print');
      expect(flyerTask).toBeDefined();

      const signTask = result.tasks.find(t => t.category === 'signage');
      expect(signTask).toBeDefined();
      expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');

      const socialTask = result.tasks.find(t => t.category === 'social');
      expect(socialTask).toBeDefined();
    });
  });

  describe('3. MMS Message Store Retrieval', () => {
    it('retrieves all incoming MMS messages for Calls & Messages tab', () => {
      const records = MmsTextToRequestService.getAllMmsRecords();
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].photos).toBeDefined();
      expect(records[0].extractedDeliverables.length).toBeGreaterThan(0);
    });
  });
});
