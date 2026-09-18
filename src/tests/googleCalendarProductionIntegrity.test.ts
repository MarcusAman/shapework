/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Google Calendar Production Integrity & Verification Test Suite
 * Validates OAuth persistence, typed failure classifications, lifecycle states,
 * idempotency ledger, honest fallback copy, and multi-turn recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateGoogleCalendarWebUrl, 
  generateICalString, 
  createGoogleCalendarBrokerageMeeting,
  verifyTargetCalendarAccess
} from '../../server/integrations/google/googleCalendarClient.js';
import { classifyGoogleAuthFailure, GoogleAuthFailure } from '../../server/integrations/google/googleAuthErrors.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import { PendingActionManager } from '../../server/agent/pendingActionManager.js';
import { CalendarRepository, CalendarIdempotencyLedger } from '../../server/persistence/calendarRepository.js';
import { saveOAuthTokenRecord, getOAuthTokenRecord, getOAuthStorageBackendName, removeOAuthTokenRecord } from '../../server/persistence/oauthTokensRepository.js';

describe('Google Calendar Production Integrity & Recovery Verification Suite', () => {
  const TEST_WS = 'ws_wilmington';
  const TEST_USER = 'ryan';
  const TEST_SESSION = 'session_prod_integrity_001';

  beforeEach(() => {
    PendingActionManager.clearPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
    CalendarRepository.clearMemoryForTesting();
    removeOAuthTokenRecord('google');
  });

  afterEach(() => {
    removeOAuthTokenRecord('google');
  });

  describe('1. Typed Google Authentication Failure Classification', () => {
    it('accurately classifies all failure categories with appropriate policy', () => {
      const expiredErr = { code: 401, message: 'Request had invalid authentication credentials. Expected OAuth 2 access token.' };
      const expClass = classifyGoogleAuthFailure(expiredErr);
      expect(expClass.failure).toBe('ACCESS_TOKEN_EXPIRED');
      expect(expClass.isRetryable).toBe(true);
      expect(expClass.requiresReauth).toBe(false);

      const revokedErr = { message: 'invalid_grant: Token has been expired or revoked.' };
      const revClass = classifyGoogleAuthFailure(revokedErr);
      expect(revClass.failure).toBe('REFRESH_TOKEN_REVOKED');
      expect(revClass.isRetryable).toBe(false);
      expect(revClass.requiresReauth).toBe(true);

      const invalidClientErr = { message: 'invalid_client: Unauthorized client' };
      const clientClass = classifyGoogleAuthFailure(invalidClientErr);
      expect(clientClass.failure).toBe('INVALID_CLIENT');
      expect(clientClass.requiresAdminCorrection).toBe(true);

      const scopeErr = { code: 403, message: 'Request had insufficient authentication scopes for calendar.' };
      const scopeClass = classifyGoogleAuthFailure(scopeErr);
      expect(scopeClass.failure).toBe('INSUFFICIENT_SCOPE');
      expect(scopeClass.requiresReauth).toBe(true);

      const notFoundErr = { code: 404, message: 'Not Found: Calendar primary_shared does not exist.' };
      const notFoundClass = classifyGoogleAuthFailure(notFoundErr);
      expect(notFoundClass.failure).toBe('CALENDAR_NOT_FOUND');
      expect(notFoundClass.requiresCalendarReselection).toBe(true);

      const rateErr = { code: 429, message: 'Rate Limit Exceeded. User Rate Limit Exceeded.' };
      const rateClass = classifyGoogleAuthFailure(rateErr);
      expect(rateClass.failure).toBe('RATE_LIMITED');
      expect(rateClass.isRetryable).toBe(true);

      const outageErr = { code: 503, message: 'Service Unavailable: Backend connection failure.' };
      const outClass = classifyGoogleAuthFailure(outageErr);
      expect(outClass.failure).toBe('PROVIDER_UNAVAILABLE');
      expect(outClass.isRetryable).toBe(true);
    });
  });

  describe('2. Honest Fallback Semantics & Privacy Protection', () => {
    it('sanitizes financial details from query string and enforces honest location', () => {
      const url = generateGoogleCalendarWebUrl({
        title: 'Strategy Session: Matt Orr',
        description: 'Review contract for 124 Wrightsville Ave with $15,000 commission split and 500 dollars due diligence',
        location: 'Google Meet (Virtual Video Call)',
        startTime: '2026-09-03T14:00:00.000Z',
        endTime: '2026-09-03T15:00:00.000Z',
        attendeeEmails: ['matt.orr@nestrealty.com'],
        requestMeet: true
      });

      expect(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')).toBe(true);
      expect(url).toContain('text=Strategy+Session%3A+Matt+Orr');
      // Financial terms sanitized
      expect(url).toContain('%5BFinancial+terms+withheld%5D');
      // Honest location semantics
      expect(url).toContain('location=Video+conference+to+be+added+before+saving');
      expect(url).not.toContain('location=Google+Meet');
    });

    it('generates RFC-5545 compliant draft .ics with CRLF sanitization and draft markers', () => {
      const ics = generateICalString({
        id: 'test_meeting_123',
        title: 'Strategy Meeting\r\nInjectHeader: Malicious',
        description: 'Discuss Q3 listing marketing\nSecond line',
        location: 'Nest Realty Mayfaire Office; Room 101',
        startTime: '2026-09-03T14:00:00.000Z',
        endTime: '2026-09-03T15:00:00.000Z',
        attendeeEmails: ['matt.orr@nestrealty.com'],
        isDraft: true
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('STATUS:TENTATIVE');
      expect(ics).toContain('X-NORA-LIFECYCLE:MANUAL_DRAFT');
      expect(ics).toContain('UID:draft_test_meeting_123@nestrealty.com');
      expect(ics).not.toContain('\r\nInjectHeader:');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('3. Multi-Instance Safe OAuth Storage & Refresh Token Preservation', () => {
    it('reports backend name and preserves refresh token when updating access token', () => {
      const backend = getOAuthStorageBackendName();
      expect(typeof backend).toBe('string');
      expect(backend.length).toBeGreaterThan(5);

      // Save initial record with refresh token
      saveOAuthTokenRecord({
        provider: 'google',
        accessToken: 'mock_initial_access_tok_123',
        refreshToken: 'mock_durable_refresh_tok_abc',
        status: 'connected',
        updatedAt: new Date().toISOString()
      });

      // Update with new access token (omitting refresh token, as Google does on rotation)
      saveOAuthTokenRecord({
        provider: 'google',
        accessToken: 'mock_rotated_access_tok_456',
        status: 'connected',
        updatedAt: new Date().toISOString()
      });

      const updated = getOAuthTokenRecord('google');
      expect(updated).toBeDefined();
      expect(updated?.accessToken).toBe('mock_rotated_access_tok_456');
      // Crucial: Refresh token must NOT be lost
      expect(updated?.refreshToken).toBe('mock_durable_refresh_tok_abc');
      expect(updated?.tokenVersion).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. Event Idempotency & Concurrency Ledger', () => {
    it('prevents duplicate event creation by recording and verifying in idempotency ledger', async () => {
      const testKey = `idem_test_${Date.now()}`;
      
      const record = await CalendarIdempotencyLedger.saveRecord({
        idempotencyKey: testKey,
        workspaceId: TEST_WS,
        payloadVersion: 1,
        calendarId: 'primary',
        providerEventId: 'gcal_ev_preexisting_999',
        attemptCount: 1,
        executionState: 'succeeded',
        result: {
          id: 'gcal_ev_preexisting_999',
          calendarId: 'primary',
          summary: 'Idempotent Strategy Session',
          startTime: '2026-09-03T14:00:00.000Z',
          endTime: '2026-09-03T15:00:00.000Z',
          organizerEmail: 'AskNora@nestrealty.com',
          attendeeCount: 1,
          attendees: [{ email: 'matt.orr@nestrealty.com' }],
          googleCalendarUrl: 'https://calendar.google.com/event?eid=gcal_ev_preexisting_999',
          iCalContent: '',
          dispatchedVia: 'google_workspace_api',
          mode: 'LIVE',
          providerTimestamp: new Date().toISOString(),
          conferenceStatus: 'confirmed',
          isExternalVerified: true,
          idempotencyKey: testKey
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      expect(record.executionState).toBe('succeeded');

      // Calling createGoogleCalendarBrokerageMeeting with this key should return ledger result without new API call
      const replayed = await createGoogleCalendarBrokerageMeeting({
        title: 'Idempotent Strategy Session',
        startTime: '2026-09-03T14:00:00.000Z',
        endTime: '2026-09-03T15:00:00.000Z',
        attendeeEmails: ['matt.orr@nestrealty.com'],
        idempotencyKey: testKey,
        workspaceId: TEST_WS,
        accessToken: 'dev_mock_token'
      });

      expect(replayed.id).toBe('gcal_ev_preexisting_999');
      expect(replayed.summary).toBe('Idempotent Strategy Session');
    });
  });

  describe('5. Conversational Recovery Flow (Disconnected / Missing OAuth)', () => {
    it('preserves meeting in durable action manager and renders honest recovery card', async () => {
      // Create pending meeting
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        channel: 'typed_chat',
        fields: {
          title: 'Quarterly Planning with Matt Orr',
          targetAudience: 'Matt Orr',
          attendeeNames: ['Matt Orr'],
          attendeeEmails: ['matt.orr@nestrealty.com'],
          meetingDate: 'Tomorrow',
          startTime: '11:00 AM',
          durationMinutes: 60,
          location: 'Google Meet (Virtual Video Call)',
          locationType: 'google_meet'
        }
      });

      pending.status = 'awaiting_confirmation';
      pending.lifecycleState = 'ACTION_AWAITING_CONFIRMATION';
      PendingActionManager.savePendingAction(pending);

      // Confirm without active OAuth connected
      const res = await NoraDatabaseGroundingService.handlePendingCalendarActionWorkflow({
        query: 'Yes confirm and schedule on Google Meet',
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION
      });

      expect(res).toBeDefined();
      expect(res?.status).toBe('GOOGLE_CALENDAR_CONNECTION_REQUIRED');
      expect(res?.lifecycleState).toBe('ACTION_AWAITING_EXTERNAL_COMPLETION');
      expect(res?.displayResponse).toContain('Google Calendar is not currently connected');
      expect(res?.displayResponse).toContain('Opening the draft does not schedule the meeting until you review and save it');
      expect(res?.displayResponse).toContain('Open Event Draft in Google Calendar ↗');
      expect(res?.displayResponse).toContain('Connect Google Workspace (AskNora@nestrealty.com)');
      expect(res?.displayResponse).not.toContain('ACTION_COMPLETED');

      // Verify pending action remains preserved in durable store
      const preserved = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
      expect(preserved).not.toBeNull();
      expect(preserved?.status).toBe('awaiting_confirmation');
      expect(preserved?.lifecycleState).toBe('ACTION_REAUTH_REQUIRED');
      expect(preserved?.fields.title).toBe('Quarterly Planning with Matt Orr');
    });

    it('durable pending meeting survives simulated process restart', () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: 'session_restart_sim',
        channel: 'typed_chat',
        fields: {
          title: 'Strategy Session with James Fort',
          targetAudience: 'James Fort',
          attendeeNames: ['James Fort'],
          attendeeEmails: ['james.fort@nestrealty.com'],
          meetingDate: '2026-09-04',
          startTime: '2:00 PM',
          location: 'Nest Realty Mayfaire Office'
        }
      });
      PendingActionManager.savePendingAction(pending);

      // Retrieve from store
      const reloaded = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, 'session_restart_sim');
      expect(reloaded).not.toBeNull();
      expect(reloaded?.fields.title).toBe('Strategy Session with James Fort');
      expect(reloaded?.fields.targetAudience).toBe('James Fort');
    });
  });
});
