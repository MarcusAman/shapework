/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Nora Inbound Call Task Creation & Suppression Engine
 * Verifies that actionable calls create tasks on the Requests tab assigned to Eduardo/Ann/Melissa,
 * while hang-ups and purely answered on-call Q&A are cleanly suppressed.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  shouldCreateRequestFromCall,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository';

describe('Nora Inbound Call Task Creation & Suppression Engine', () => {
  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  describe('1. Actionable Phone Call Task Generation', () => {
    it('creates a Canonical Marketing Request and child tasks assigned to Eduardo and Ann when caller requests collateral', () => {
      const callPayload = {
        id: 'call_wrightsville_504',
        callerName: 'Sarah Jenkins',
        fromNumber: '+19105550188',
        propertyAddress: '504 Wrightsville Ave, Wilmington, NC',
        durationSeconds: 52,
        transcript: 'Sarah: Hi Nora, I have a new listing at 504 Wrightsville Ave. Please get a double-sided print flyer and install a yard sign post with Coastal Sign Post.',
        summary: 'New listing collateral intake: 8.5x11 flyer and Coastal Sign Post install for 504 Wrightsville Ave.'
      };

      const result = convertCallToCanonicalMarketingRequest(callPayload);

      expect(result.shouldCreate).toBe(true);
      expect(result.suppressed).toBe(false);
      expect(result.request).toBeDefined();
      expect(result.request?.propertyAddress).toBe('504 Wrightsville Ave, Wilmington, NC');
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);

      // Verify Eduardo is assigned to the flyer
      const flyerTask = result.tasks.find(t => t.category === 'print' || t.title.includes('Flyer'));
      expect(flyerTask).toBeDefined();
      expect(flyerTask?.assignedTo).toBe('Eduardo Lovo');
      expect(flyerTask?.status).toBe('request_received');

      // Verify Ann is assigned to the sign post
      const signTask = result.tasks.find(t => t.category === 'signage' || t.title.includes('Sign'));
      expect(signTask).toBeDefined();
      expect(signTask?.assignedTo).toBe('Ann Gunn');
      expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');

      // Verify persistence in repository
      const allRequests = getAllCanonicalMarketingRequests();
      expect(allRequests.some(r => r.id === result.request?.id)).toBe(true);
    });

    it('creates tasks when Nora promises a team handoff (Melissa & Eduardo) during the call', () => {
      const callPayload = {
        id: 'call_lumina_822',
        callerName: 'Matt Orr',
        fromNumber: '+19106128283',
        propertyAddress: '822 Lumina Ave, Wrightsville Beach, NC',
        durationSeconds: 40,
        transcript: 'Matt: Hey Nora, we just locked in the listing on Lumina.\nNora: Fantastic! I will have Melissa and Eduardo get this staged right away for you with presentation slides and flyers.',
        summary: 'Handoff promised to Melissa and Eduardo for 822 Lumina Ave.'
      };

      const result = convertCallToCanonicalMarketingRequest(callPayload);

      expect(result.shouldCreate).toBe(true);
      expect(result.suppressed).toBe(false);
      expect(result.request).toBeDefined();
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);

      const tasks = result.tasks;
      expect(tasks.some(t => t.assignedTo === 'Eduardo Lovo')).toBe(true);
    });
  });

  describe('2. Call Suppression Engine (Hang-ups & Answered On-Call Q&A)', () => {
    it('suppresses task creation for dropped / hang-up calls under 8 seconds', () => {
      const shortCallPayload = {
        id: 'call_hangup_short',
        callerName: 'Unknown Caller',
        fromNumber: '+19105559999',
        durationSeconds: 4,
        transcript: 'Caller: Hello? ... [hung up]',
        summary: 'Call disconnected after 4 seconds.'
      };

      const decision = shouldCreateRequestFromCall(shortCallPayload);
      expect(decision.shouldCreate).toBe(false);
      expect(decision.reason).toContain('hung up');

      const result = convertCallToCanonicalMarketingRequest(shortCallPayload);
      expect(result.shouldCreate).toBe(false);
      expect(result.suppressed).toBe(true);
      expect(result.request).toBeUndefined();
      expect(result.tasks.length).toBe(0);

      // Verify no task was added to repository
      const allTasks = getAllCanonicalMarketingTasks();
      expect(allTasks.some(t => t.notes?.includes('call_hangup_short'))).toBe(false);
    });

    it('suppresses task creation for purely informational Q&A answered on the call', () => {
      const infoCallPayload = {
        id: 'call_office_hours_info',
        callerName: 'Marcus Aman',
        fromNumber: '+12527170595',
        durationSeconds: 22,
        transcript: 'Marcus: Hey Nora, what are the office hours for the Mayfaire HQ?\nNora: Hello Marcus! The Mayfaire HQ is open Monday through Friday, 8:30 AM to 5:30 PM EST.\nMarcus: Great, thanks Nora! Bye.',
        summary: 'Office hours inquiry answered directly on call.',
        call_analysis: {
          custom_analysis_data: {
            answered_on_call: true
          }
        }
      };

      const decision = shouldCreateRequestFromCall(infoCallPayload);
      expect(decision.shouldCreate).toBe(false);
      expect(decision.reason).toContain('Informational question');

      const result = convertCallToCanonicalMarketingRequest(infoCallPayload);
      expect(result.shouldCreate).toBe(false);
      expect(result.suppressed).toBe(true);
      expect(result.request).toBeUndefined();
      expect(result.tasks.length).toBe(0);
    });

    it('suppresses task creation for Form 2-T earnest money deadline inquiry answered on call', () => {
      const emdCallPayload = {
        id: 'call_emd_inquiry',
        callerName: 'Allison Thurston',
        fromNumber: '+19105550177',
        durationSeconds: 30,
        transcript: 'Allison: Hi Nora, how many banking days do we have for earnest money deposit on Form 2-T?\nNora: Under standard NC Form 2-T Paragraph 1(d), initial earnest money must be deposited within 5 banking days of the effective date.\nAllison: Perfect, that is all I needed. Have a good day!',
        summary: 'Form 2-T earnest money banking days question answered directly.'
      };

      const result = convertCallToCanonicalMarketingRequest(emdCallPayload);
      expect(result.shouldCreate).toBe(false);
      expect(result.suppressed).toBe(true);
      expect(result.request).toBeUndefined();
      expect(result.tasks.length).toBe(0);
    });
  });

  describe('3. Retell Custom Analysis Data Integration', () => {
    it('handles custom_analysis_data from Retell webhook with property address and requested assets', () => {
      const retellPayload = {
        id: 'call_retell_webhook_test_101',
        callerName: 'Dawn Thurston',
        fromNumber: '+19105550166',
        propertyAddress: '142 Pelican Watch Way, Carolina Beach, NC',
        durationSeconds: 65,
        transcript: 'Dawn: Nora, I need an 8-slide luxury CMA presentation deck and social story carousel for 142 Pelican Watch Way.\nNora: Absolutely Dawn! I am routing this to Eduardo in marketing production right now.',
        call_analysis: {
          custom_analysis_data: {
            property_address: '142 Pelican Watch Way, Carolina Beach, NC',
            urgency: 'high',
            primary_owner: 'Eduardo Lovo',
            recommended_next_action: 'Generate 8-slide luxury CMA deck and social story'
          }
        }
      };

      const result = convertCallToCanonicalMarketingRequest(retellPayload);

      expect(result.shouldCreate).toBe(true);
      expect(result.request).toBeDefined();
      expect(result.request?.propertyAddress).toBe('142 Pelican Watch Way, Carolina Beach, NC');
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);

      const deckTask = result.tasks.find(t => t.title.includes('Presentation') || t.title.includes('Slides') || t.title.includes('CMA'));
      expect(deckTask).toBeDefined();
      expect(deckTask?.assignedTo).toBe('Eduardo Lovo');
    });
  });
});
