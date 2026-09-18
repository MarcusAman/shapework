/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Nora Meeting Clarification Cards & Google Workspace Email Verification
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  NEST_FULL_ROSTER_77, 
  NEST_FULL_ROSTER_72 
} from '../../server/persistence/nestRosterSeed.js';
import { 
  scanAndResolveGoogleWorkspaceEmail,
  resolveDirectoryAttendees,
  scheduleBrokerageMeeting 
} from '../../server/services/brokerageCalendarService.js';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter.js';
import { initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer.js';

describe('Nora Meeting Clarification Cards & Google Workspace Directory Verification', () => {
  const origMock = process.env.MOCK_INTEGRATIONS;

  beforeAll(() => {
    process.env.MOCK_INTEGRATIONS = 'true';
  });

  afterAll(() => {
    if (origMock !== undefined) {
      process.env.MOCK_INTEGRATIONS = origMock;
    } else {
      delete process.env.MOCK_INTEGRATIONS;
    }
  });

  describe('1. Nest Google Workspace Directory (77 Members Verification)', () => {
    it('verifies all 77 directory members have valid @nestrealty.com Google Workspace emails', () => {
      expect(NEST_FULL_ROSTER_77.length).toBe(77);
      expect(NEST_FULL_ROSTER_72.length).toBe(77);

      const invalidEmails = NEST_FULL_ROSTER_77.filter(p => !p.email.toLowerCase().endsWith('@nestrealty.com'));
      expect(invalidEmails.length).toBe(0);

      const activeCount = NEST_FULL_ROSTER_77.filter(p => p.status === 'active').length;
      const needsReviewCount = NEST_FULL_ROSTER_77.filter(p => p.status === 'needs_review').length;
      expect(activeCount).toBe(75);
      expect(needsReviewCount).toBe(2);
    });

    it('verifies secondary personal emails are preserved for brokers who use team/external emails', () => {
      const desiree = NEST_FULL_ROSTER_77.find(p => p.displayName === 'Desiree Whalen');
      expect(desiree).toBeDefined();
      expect(desiree?.email).toBe('desiree.whalen@nestrealty.com');
      expect(desiree?.secondaryEmail).toBe('Desiree@whalenteamrealty.com');

      const meghan = NEST_FULL_ROSTER_77.find(p => p.displayName === 'Meghan Bowes Alber');
      expect(meghan?.email).toBe('meghan.alber@nestrealty.com');
      expect(meghan?.secondaryEmail).toBe('closings@coasttoclose.com');
    });

    it('scanAndResolveGoogleWorkspaceEmail resolves and formats Google Workspace emails dynamically', () => {
      const res1 = scanAndResolveGoogleWorkspaceEmail({
        displayName: 'Desiree Whalen',
        email: 'Desiree@whalenteamrealty.com'
      });
      expect(res1.primaryEmail).toBe('desiree.whalen@nestrealty.com');
      expect(res1.isGoogleWorkspaceVerified).toBe(true);

      const res2 = scanAndResolveGoogleWorkspaceEmail({
        displayName: 'James Fort',
        email: 'jfort@nestrealty.com'
      });
      expect(res2.primaryEmail).toBe('jfort@nestrealty.com');
      expect(res2.isGoogleWorkspaceVerified).toBe(true);
    });
  });

  describe('2. Ask Nora Chat Intent Classification & /grill-me Clarification Trigger', () => {
    it('triggers CLARIFY_MEETING_SCHEDULE when user gives partial input ("schedule an in-office meeting")', () => {
      const result = processUserUtterance('schedule an in-office meeting', initialRuntimeState, 'Ryan');
      expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
      expect(result.meetingWizard).toBeDefined();
      expect(result.displayResponse).toContain('AskNora@nestrealty.com');
    });

    it('triggers CLARIFY_MEETING_SCHEDULE with audience prefilled when user says "schedule an all-hands meeting"', () => {
      const result = processUserUtterance('schedule an all-hands meeting', initialRuntimeState, 'Ryan');
      expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
      expect(result.meetingWizard?.targetAudience).toBe('ALL wilmington, carolina beach office');
    });

    it('triggers SCHEDULE_BROKERAGE_MEETING when all details are provided ("schedule a meeting with James Fort next Tuesday at 10 AM")', () => {
      const result = processUserUtterance('schedule a meeting with James Fort next Tuesday at 10 AM at Mayfaire', initialRuntimeState, 'Ryan');
      expect(result.intentType).toBe('SCHEDULE_BROKERAGE_MEETING');
      expect(result.meetingWizard?.targetAudience).toBe('James Fort');
      expect(result.meetingWizard?.meetingDate).toBe('next Tuesday');
      expect(result.meetingWizard?.startTime).toBe('10:00 AM');
      expect(result.meetingWizard?.location).toContain('Mayfaire');
    });

    it('affirmatively responds to calendar capability question without blocking on SOPs', () => {
      const prompt = 'and do you have the capability to send out a google calendar invite to all of them from your AskNora@nestrealty.com email address?';
      const result = processUserUtterance(prompt, initialRuntimeState, 'Ryan');
      expect(result.intentType).toBe('CLARIFY_MEETING_SCHEDULE');
      expect(result.spokenResponse).toContain('Yes, absolutely!');
      expect(result.displayResponse).toContain('AskNora@nestrealty.com');
      expect(result.meetingWizard?.targetAudience).toBe('ALL wilmington, carolina beach office');
    });

    it('synthesizes real-time dynamic action plan for unscripted operational requests', () => {
      const result = processUserUtterance('can you help coordinate a new agent welcome orientation dinner?', initialRuntimeState, 'Ryan');
      expect(result.intentType).toBe('AUTONOMOUS_ACTION_PLAN');
      expect(result.displayResponse).toContain('Dynamic Operational Execution Plan');
      expect(result.displayResponse).not.toContain('No Established Workflow Found');
    });
  });

  describe('3. Roster Resolution & Meeting Dispatch with 77 Members', () => {
    it('resolves all 77 members when requesting all offices', () => {
      const res = resolveDirectoryAttendees({ targetAudience: 'ALL wilmington, carolina beach office' });
      expect(res.attendees.length).toBe(77);
      expect(res.emails.length).toBe(77);
      expect(res.emails.every(e => e.endsWith('@nestrealty.com'))).toBe(true);
    });

    it('successfully dispatches meeting record with 77 Google Workspace emails', async () => {
      const meeting = await scheduleBrokerageMeeting({
        title: 'Fall 2026 Production Kickoff',
        meetingDate: '2026-09-15',
        startTime: '10:00 AM',
        targetAudience: 'ALL wilmington, carolina beach office',
        requesterName: 'Ryan Crecelius'
      });

      expect(meeting.attendeeCount).toBe(77);
      expect(meeting.organizerEmail).toBe('AskNora@nestrealty.com');
      expect(meeting.googleCalendarUrl).toContain('calendar.google.com');
      expect(meeting.iCalContent).toContain('ORGANIZER;CN=Nora (Ask Nest Ops):mailto:AskNora@nestrealty.com');
    });
  });
});
