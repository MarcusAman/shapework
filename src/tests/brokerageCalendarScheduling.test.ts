/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Brokerage Calendar Meeting Scheduling & Directory Resolution Test Suite
 * Tests Google Workspace Calendar integration via AskNora@nestrealty.com.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { 
  resolveDirectoryAttendees, 
  scheduleBrokerageMeeting, 
  getAllScheduledBrokerageMeetings,
  calculateMeetingTimestamps
} from '../../server/services/brokerageCalendarService.js';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute.js';

describe('Nora Google Workspace Calendar Scheduler Suite', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  const origMock = process.env.MOCK_INTEGRATIONS;

  beforeAll(async () => {
    process.env.MOCK_INTEGRATIONS = 'true';
    app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

    app.post('/api/calendar/brokerage-meeting', async (req, res) => {
      try {
        const result = await scheduleBrokerageMeeting(req.body || {});
        return res.json({ success: true, meeting: result });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get('/api/calendar/brokerage-meetings', (req, res) => {
      const meetings = getAllScheduledBrokerageMeetings();
      return res.json({ success: true, meetings, count: meetings.length });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (origMock !== undefined) {
      process.env.MOCK_INTEGRATIONS = origMock;
    } else {
      delete process.env.MOCK_INTEGRATIONS;
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Directory Attendee Resolution', () => {
    it('resolves a specific person by name: "James Fort"', () => {
      const result = resolveDirectoryAttendees({ targetAudience: 'meeting with James Fort' });
      expect(result.attendees.length).toBeGreaterThanOrEqual(1);
      expect(result.attendees.some(a => a.displayName.includes('James Fort') || a.lastName.includes('Fort'))).toBe(true);
      expect(result.emails.some(e => e.includes('fort') || e.includes('james'))).toBe(true);
      expect(result.resolvedScopeDescription).toContain('James Fort');
    });

    it('resolves office-specific scope: "all agents and staff in the wilmington office"', () => {
      const result = resolveDirectoryAttendees({ targetAudience: 'all agents and staff in the wilmington office' });
      expect(result.attendees.length).toBeGreaterThanOrEqual(10);
      expect(result.resolvedScopeDescription).toContain('Wilmington (Mayfaire) Office');
      expect(result.emails.length).toBe(result.attendees.length);
    });

    it('resolves office-specific scope: "Carolina Beach office"', () => {
      const result = resolveDirectoryAttendees({ targetAudience: 'Carolina Beach office team' });
      expect(result.attendees.length).toBeGreaterThanOrEqual(1);
      expect(result.resolvedScopeDescription).toContain('Carolina Beach Office');
    });

    it('resolves all-hands scope: "meeting with ALL wilmington, carolina beach office"', () => {
      const result = resolveDirectoryAttendees({ targetAudience: 'meeting with ALL wilmington, carolina beach office' });
      expect(result.attendees.length).toBeGreaterThanOrEqual(50);
      expect(result.resolvedScopeDescription).toContain('All Brokers & Staff across Wilmington (Mayfaire) and Carolina Beach offices');
    });

    it('resolves leadership team: "leadership"', () => {
      const result = resolveDirectoryAttendees({ targetAudience: 'Nest leadership team' });
      expect(result.attendees.length).toBeGreaterThanOrEqual(2);
      expect(result.resolvedScopeDescription).toContain('Nest Leadership Team');
    });
  });

  describe('2. Timestamp & Date Calculation with Eastern Timezone', () => {
    it('calculates future dates accurately', () => {
      const result = calculateMeetingTimestamps({
        meetingDate: '2026-09-09',
        startTime: '10:00 AM',
        durationMinutes: 90
      });
      expect(result.startIso).toBeDefined();
      expect(result.endIso).toBeDefined();
      expect(result.displayDate).toContain('September 9, 2026');
      expect(result.displayTime).toContain('10:00 AM');
    });
  });

  describe('3. End-to-End Meeting Scheduling & Google Calendar Dispatch', () => {
    it('schedules an in-office all-hands meeting from AskNora@nestrealty.com', async () => {
      const meeting = await scheduleBrokerageMeeting({
        title: 'Q3 In-Office All-Hands & Production Strategy',
        meetingDate: '2026-09-09',
        startTime: '10:00 AM',
        durationMinutes: 60,
        location: 'Nest Realty Mayfaire Office (Large Training Room)',
        targetAudience: 'ALL wilmington, carolina beach office',
        requesterName: 'Ryan Crecelius',
        notes: 'Review Q3 market share metrics, Maxa flyer templates, and Coastal Sign Post workflows.'
      });

      expect(meeting.id).toBeDefined();
      expect(meeting.organizerEmail).toBe('AskNora@nestrealty.com');
      expect(meeting.requesterName).toBe('Ryan Crecelius');
      expect(meeting.attendeeCount).toBeGreaterThanOrEqual(50);
      expect(meeting.googleCalendarUrl).toContain('calendar.google.com');
      expect(meeting.googleCalendarUrl).toContain('action=TEMPLATE');
      expect(meeting.iCalContent).toContain('BEGIN:VCALENDAR');
      expect(meeting.iCalContent).toContain('ORGANIZER;CN=Nora (Ask Nest Ops):mailto:AskNora@nestrealty.com');
      expect(meeting.spokenConfirmation).toContain('Ryan');
      expect(meeting.spokenConfirmation).toContain('AskNora@nestrealty.com');

      const all = getAllScheduledBrokerageMeetings();
      expect(all.some(m => m.id === meeting.id)).toBe(true);
    });

    it('schedules a 1-on-1 strategy meeting with James Fort', async () => {
      const meeting = await scheduleBrokerageMeeting({
        meetingDate: 'next Tuesday',
        startTime: '2:00 PM',
        targetAudience: 'James Fort',
        requesterName: 'Ryan Crecelius'
      });

      expect(meeting.title).toContain('James Fort');
      expect(meeting.attendees.some(a => a.displayName.includes('James Fort'))).toBe(true);
      expect(meeting.spokenConfirmation).toContain('James Fort');
      expect(meeting.spokenConfirmation).toContain('AskNora@nestrealty.com');
    });
  });

  describe('4. Telephony Webhook Tool: POST /api/retell/tools/schedule-meeting', () => {
    it('rejects tool call from Retell AI Voice Hotline with 403 fail-closed calendar protection', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Mayfaire Agent Mastermind',
          meetingDate: '2026-09-15',
          startTime: '11:00 AM',
          durationMinutes: 60,
          location: 'Mayfaire Office',
          targetAudience: 'all agents in the wilmington office',
          callerName: 'Ryan Crecelius',
          notes: 'Fall marketing rollout and Friends of Nest mailing schedule.'
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('UNAUTHORIZED_CALENDAR_ACTION');
      expect(data.message).toContain('requires an authenticated session');
    });
  });

  describe('5. App REST Endpoints: /api/calendar/brokerage-meetings', () => {
    it('GET /api/calendar/brokerage-meetings returns scheduled meetings list', async () => {
      const res = await fetch(`${baseUrl}/api/calendar/brokerage-meetings`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.meetings)).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(1);
    });
  });
});
