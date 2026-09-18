/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite for Google Calendar Self-Healing OAuth & Resilient Recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isGoogleAuthError, generateGoogleCalendarWebUrl } from '../../server/integrations/google/googleCalendarClient.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import { PendingActionManager } from '../../server/agent/pendingActionManager.js';

describe('Google Calendar Self-Healing OAuth & Resilient Recovery Suite', () => {
  const TEST_WS = 'ws_wilmington';
  const TEST_USER = 'ryan';
  const TEST_SESSION = 'test-gcal-recovery-session';

  beforeEach(() => {
    PendingActionManager.clearPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
  });

  it('1. isGoogleAuthError correctly detects all OAuth credential and expiry error variations', () => {
    expect(isGoogleAuthError({ message: 'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.' })).toBe(true);
    expect(isGoogleAuthError({ message: 'invalid_grant: Bad Request' })).toBe(true);
    expect(isGoogleAuthError({ message: 'Invalid Credentials' })).toBe(true);
    expect(isGoogleAuthError({ code: 401, message: 'Unauthorized' })).toBe(true);
    expect(isGoogleAuthError({ status: 401, message: 'Token expired' })).toBe(true);
    expect(isGoogleAuthError({ message: 'Rate limit exceeded: quota exceeded' })).toBe(false);
    expect(isGoogleAuthError(null)).toBe(false);
  });

  it('2. generateGoogleCalendarWebUrl generates valid pre-filled web calendar URLs', () => {
    const url = generateGoogleCalendarWebUrl({
      title: 'Strategy Session: Matt Orr',
      description: 'Discuss Mayfaire Q3 listing pipeline',
      location: 'Google Meet (Virtual Video Call)',
      startTime: '2026-09-02T14:00:00.000Z',
      endTime: '2026-09-02T15:00:00.000Z',
      attendeeEmails: ['matt.orr@nestrealty.com', 'asknora@nestrealty.com']
    });

    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(url).toContain('text=Strategy+Session%3A+Matt+Orr');
    expect(url).toContain('add=matt.orr%40nestrealty.com%2Casknora%40nestrealty.com');
  });

  it('3. Grounding service preserves pending meeting and renders Resilient Recovery Card when OAuth needs authorization', async () => {
    // 1. Create pending meeting action
    const pending = PendingActionManager.createPendingCalendarAction({
      workspaceId: TEST_WS,
      userId: TEST_USER,
      sessionId: TEST_SESSION,
      channel: 'typed_chat',
      fields: {
        title: 'Meeting with Matt Orr',
        targetAudience: 'Matt Orr',
        attendeeNames: ['Matt Orr'],
        attendeeEmails: ['matt.orr@nestrealty.com'],
        meetingDate: 'Tomorrow',
        startTime: '2:00 PM',
        durationMinutes: 45,
        location: 'Google Meet (Virtual Video Call)',
        locationType: 'google_meet'
      }
    });

    pending.status = 'awaiting_confirmation';
    pending.lifecycleState = 'ACTION_AWAITING_CONFIRMATION';
    PendingActionManager.savePendingAction(pending);

    // 2. User confirms meeting scheduling ("yes confirm and schedule on google meet")
    const res = await NoraDatabaseGroundingService.handlePendingCalendarActionWorkflow({
      query: 'yes confirm and schedule on google meet',
      workspaceId: TEST_WS,
      userId: TEST_USER,
      sessionId: TEST_SESSION
    });

    expect(res).toBeDefined();
    expect(res?.status).toBe('GOOGLE_CALENDAR_CONNECTION_REQUIRED');
    expect(res?.displayResponse).toContain('Google Calendar Connection Required');
    expect(res?.displayResponse).toContain('AskNora@nestrealty.com');
    expect(res?.displayResponse).toContain('Connect Google Workspace (AskNora@nestrealty.com)');
    expect(res?.displayResponse).toContain('Open Event Draft in Google Calendar ↗');
    expect(res?.displayResponse).not.toContain('Google Calendar API execution failed: Request had invalid authentication credentials');

    // 3. Verify pending meeting was preserved so it can be resumed after OAuth
    const preserved = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
    expect(preserved).toBeDefined();
    expect(preserved?.status).toBe('awaiting_confirmation');
    expect(preserved?.error).toBe('GOOGLE_WORKSPACE_REAUTH_REQUIRED');
    expect(preserved?.fields.title).toBe('Meeting with Matt Orr');
  });
});
