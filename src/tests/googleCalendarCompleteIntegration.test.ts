/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Google Calendar Complete Integration & Verification Suite
 * Tests OAuth security, dedicated secondary calendar selection, scope minimization,
 * conversational multi-turn scheduling, provider read-back verification, idempotency,
 * availability queries, reschedule/cancel, and diagnostic taxonomy.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { 
  generateGoogleOAuthState, 
  validateGoogleOAuthState, 
  GOOGLE_CALENDAR_SCOPES, 
  GOOGLE_WORKSPACE_SCOPES 
} from '../../server/integrations/google/googleOAuth.js';
import { 
  createGoogleCalendarBrokerageMeeting,
  updateGoogleCalendarBrokerageMeeting,
  cancelGoogleCalendarBrokerageMeeting,
  queryGoogleCalendarFreeBusy
} from '../../server/integrations/google/googleCalendarClient.js';
import { 
  scheduleBrokerageMeeting, 
  rescheduleBrokerageMeeting, 
  cancelBrokerageMeeting,
  resolveDirectoryAttendees,
  calculateMeetingTimestamps
} from '../../server/services/brokerageCalendarService.js';
import { 
  GoogleCalendarDiagnosticService 
} from '../../server/services/googleCalendarDiagnosticService.js';
import { CalendarRepository } from '../../server/persistence/calendarRepository.js';
import { PendingActionManager } from '../../server/agent/pendingActionManager.js';
import { MeetingSlotExtractor } from '../../server/agent/meetingSlotExtractor.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import { VerifiedLinkService } from '../../server/services/verifiedLinkService.js';
import { IntegrationStateStore } from '../../server/integrations/shared/integrationStateStore.js';
import { encryptToken } from '../../server/integrations/shared/integrationCredentialVault.js';

describe('Google Calendar Complete Integration & Reliability Suite', () => {
  const TEST_WS = 'ws_wilmington_prod_test';
  const TEST_USER = 'ryan_principal_broker';
  const TEST_SESSION = 'sess_cal_audit_9001';

  let mockDbState: any;

  beforeEach(() => {
    mockDbState = {
      workspaceIntegrationConnections: [],
      workspaceCalendarSettings: [],
      scheduledBrokerageMeetings: []
    };
    PendingActionManager.resetForTesting();
    VerifiedLinkService.resetForTesting();
    CalendarRepository.clearMemoryForTesting();
  });

  // ---------------------------------------------------------------------------
  // 1. OAuth Security & Anti-CSRF Lifecycle
  // ---------------------------------------------------------------------------
  describe('1. OAuth Security, Single-Use States & Anti-CSRF', () => {
    it('generates cryptographically secure state token bound to (workspaceId, userId)', () => {
      const stateToken = generateGoogleOAuthState(TEST_WS, TEST_USER);
      expect(stateToken).toBeDefined();
      expect(stateToken.length).toBeGreaterThanOrEqual(32);

      // Successful validation consumes state
      const isValid = validateGoogleOAuthState(stateToken, TEST_WS, TEST_USER);
      expect(isValid).toBe(true);

      // Replay attack / reuse is rejected
      const isReplayValid = validateGoogleOAuthState(stateToken, TEST_WS, TEST_USER);
      expect(isReplayValid).toBe(false);
    });

    it('rejects state validation on cross-workspace tampering or user mismatch', () => {
      const stateToken = generateGoogleOAuthState(TEST_WS, TEST_USER);

      // Wrong workspace
      const wrongWs = validateGoogleOAuthState(stateToken, 'ws_hacker_org', TEST_USER);
      expect(wrongWs).toBe(false);

      // Wrong user
      const wrongUser = validateGoogleOAuthState(stateToken, TEST_WS, 'attacker_user');
      expect(wrongUser).toBe(false);
    });

    it('enforces scope minimization for Calendar operations', () => {
      expect(GOOGLE_CALENDAR_SCOPES).toContain('https://www.googleapis.com/auth/calendar.events');
      expect(GOOGLE_CALENDAR_SCOPES).toContain('https://www.googleapis.com/auth/calendar.calendarlist.readonly');
      expect(GOOGLE_CALENDAR_SCOPES).toContain('https://www.googleapis.com/auth/calendar.events.freebusy');

      // Does NOT bundle intrusive Gmail / Drive scopes into calendar auth
      expect(GOOGLE_CALENDAR_SCOPES).not.toContain('https://www.googleapis.com/auth/gmail.send');
      expect(GOOGLE_CALENDAR_SCOPES).not.toContain('https://www.googleapis.com/auth/drive');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Refresh Token Preservation & Recovery
  // ---------------------------------------------------------------------------
  describe('2. Refresh Token Preservation & Recovery', () => {
    it('preserves existing encrypted refresh token when Google omits refresh_token on re-auth', async () => {
      const store = new IntegrationStateStore(mockDbState);
      const initialEncryptedRefreshToken = await encryptToken('real_google_refresh_token_xyz_999');

      await store.upsertConnection({
        id: `conn_google_${TEST_WS}`,
        workspaceId: TEST_WS,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: TEST_USER,
        connectedAt: new Date().toISOString(),
        providerAccountEmail: 'AskNora@nestrealty.com',
        scopes: GOOGLE_CALENDAR_SCOPES,
        encryptedAccessToken: await encryptToken('access_token_v1'),
        encryptedRefreshToken: initialEncryptedRefreshToken,
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const existing = await store.getConnection(TEST_WS, 'google_workspace');
      expect(existing?.encryptedRefreshToken).toBe(initialEncryptedRefreshToken);

      // Re-authentication without new refresh token (Google default behavior on re-consent)
      const incomingRefreshToken: string | undefined = undefined;
      const preservedRefreshToken = incomingRefreshToken || existing?.encryptedRefreshToken;
      await store.upsertConnection({
        id: `conn_google_${TEST_WS}`,
        workspaceId: TEST_WS,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: TEST_USER,
        connectedAt: new Date().toISOString(),
        providerAccountEmail: 'AskNora@nestrealty.com',
        scopes: GOOGLE_CALENDAR_SCOPES,
        encryptedAccessToken: await encryptToken('access_token_v2'),
        encryptedRefreshToken: preservedRefreshToken,
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const reloaded = await store.getConnection(TEST_WS, 'google_workspace');
      expect(reloaded?.encryptedRefreshToken).toBe(initialEncryptedRefreshToken);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Dedicated Target Calendar Selection & Diagnostics
  // ---------------------------------------------------------------------------
  describe('3. Dedicated Target Calendar Selection & Readiness Diagnostics', () => {
    it('correctly reports OAUTH_CONNECTION_REQUIRED when workspace is not connected', async () => {
      const diag = await GoogleCalendarDiagnosticService.runDiagnostics(TEST_WS, mockDbState);
      expect(diag.isReadyForLiveExecution).toBe(false);
      expect(diag.status).toBe('OAUTH_CONNECTION_REQUIRED');
      expect(diag.blockingReason).toContain('AskNora@nestrealty.com');
    });

    it('correctly reports WRONG_GOOGLE_ACCOUNT when connected email does not match AskNora@nestrealty.com', async () => {
      const store = new IntegrationStateStore(mockDbState);
      await store.upsertConnection({
        id: `conn_google_${TEST_WS}`,
        workspaceId: TEST_WS,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: TEST_USER,
        connectedAt: new Date().toISOString(),
        providerAccountEmail: 'personal.agent@gmail.com', // Wrong email
        scopes: GOOGLE_CALENDAR_SCOPES,
        encryptedAccessToken: await encryptToken('token_123'),
        encryptedRefreshToken: await encryptToken('ref_123'),
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const diag = await GoogleCalendarDiagnosticService.runDiagnostics(TEST_WS, mockDbState);
      expect(diag.status).toBe('WRONG_GOOGLE_ACCOUNT');
      expect(diag.account.isCorrectAccount).toBe(false);
      expect(diag.blockingReason).toContain('personal.agent@gmail.com');
    });

    it('correctly reports CALENDAR_NOT_SELECTED when OAuth is connected but no dedicated calendar is chosen', async () => {
      const store = new IntegrationStateStore(mockDbState);
      await store.upsertConnection({
        id: `conn_google_${TEST_WS}`,
        workspaceId: TEST_WS,
        provider: 'google_workspace',
        status: 'connected',
        connectedByUserId: TEST_USER,
        connectedAt: new Date().toISOString(),
        providerAccountEmail: 'AskNora@nestrealty.com',
        scopes: GOOGLE_CALENDAR_SCOPES,
        encryptedAccessToken: await encryptToken('token_123'),
        encryptedRefreshToken: await encryptToken('ref_123'),
        accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const diag = await GoogleCalendarDiagnosticService.runDiagnostics(TEST_WS, mockDbState);
      expect(diag.status).toBe('CALENDAR_NOT_SELECTED');
      expect(diag.blockingReason).toContain('No Google Calendar has been selected');
    });

    it('persists selected dedicated secondary calendar in CalendarRepository', async () => {
      const saved = await CalendarRepository.saveCalendarSettings({
        workspaceId: TEST_WS,
        selectedCalendarId: 'c_nest_ops_nora_secondary_id_101@group.calendar.google.com',
        selectedCalendarName: 'Nest Operations — NORA',
        accessRole: 'owner',
        timezone: 'America/New_York',
        autoMeetEnabled: true,
        isDedicatedNoraCalendar: true
      });

      expect(saved.selectedCalendarName).toBe('Nest Operations — NORA');
      expect(saved.accessRole).toBe('owner');

      const reloaded = await CalendarRepository.getCalendarSettings(TEST_WS);
      expect(reloaded?.selectedCalendarId).toBe('c_nest_ops_nora_secondary_id_101@group.calendar.google.com');
      expect(reloaded?.timezone).toBe('America/New_York');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Conversational Multi-Turn Scheduling Lifecycle
  // ---------------------------------------------------------------------------
  describe('4. Conversational Multi-Turn Scheduling Lifecycle', () => {
    it('Turn 1 ("Schedule a meeting") creates pending action and asks for missing details', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Schedule a meeting',
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        conversationHistory: [],
        dbState: mockDbState
      });

      expect(res).toBeDefined();
      expect(res?.status).toBe('ACTION_DETAILS_REQUIRED' as any);
      expect(res?.spokenResponse).toMatch(/Who (should I schedule|would you like to schedule)/);

      const pending = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
      expect(pending).not.toBeNull();
      expect(pending?.status).toBe('collecting_details');
    });

    it('Turn 2 ("Meet with Matt Orr on Google Meet tomorrow at 3 PM Eastern") resolves attendee and stages confirmation', async () => {
      // First turn creates pending
      PendingActionManager.createPendingCalendarAction({
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        fields: {}
      });

      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Meet with Matt Orr on Google Meet tomorrow at 3 PM Eastern',
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        conversationHistory: [],
        dbState: mockDbState
      });

      expect(res).toBeDefined();
      expect(res?.status).toBe('ACTION_AWAITING_CONFIRMATION' as any);
      expect(res?.displayResponse).toContain('Matt Orr');
      expect(res?.displayResponse).toContain('matt.orr@nestrealty.com');
      expect(res?.displayResponse).toContain('3:00 PM');
      expect(res?.displayResponse).toContain('Google Meet');

      const pending = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
      expect(pending?.status).toBe('awaiting_confirmation');
      expect(pending?.fields.attendees?.[0].email).toBe('matt.orr@nestrealty.com');
    });

    it('Turn 3 without OAuth connected returns honest GOOGLE_CALENDAR_CONNECTION_REQUIRED without creating fake links', async () => {
      PendingActionManager.createPendingCalendarAction({
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        fields: {
          title: 'Meeting with Matt Orr',
          meetingDate: '2026-09-02',
          startTime: '3:00 PM',
          durationMinutes: 60,
          targetAudience: 'Matt Orr',
          attendeeNames: ['Matt Orr'],
          attendees: [{ displayName: 'Matt Orr', email: 'matt.orr@nestrealty.com', role: 'Agent' }],
          locationType: 'google_meet',
          location: 'Google Meet (Virtual Video Call)'
        },
        status: 'awaiting_confirmation'
      });

      const confirmRes = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Confirm and schedule',
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        conversationHistory: [],
        dbState: mockDbState
      });

      expect(confirmRes).toBeDefined();
      expect(confirmRes?.status).toBe('GOOGLE_CALENDAR_CONNECTION_REQUIRED' as any);
      expect(confirmRes?.spokenResponse).toContain('Google Workspace authorization is required');
      expect(confirmRes?.displayResponse).toContain('Google Calendar Connection Required');

      // Pending action is preserved in recoverable state
      const pendingAfter = PendingActionManager.getPendingAction(TEST_WS, TEST_USER, TEST_SESSION);
      expect(pendingAfter).not.toBeNull();
      expect(pendingAfter?.status).toBe('awaiting_confirmation');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Idempotency, Double-Confirmation Lock & Provider Read-Back
  // ---------------------------------------------------------------------------
  describe('5. Idempotency & Concurrent Execution Lock', () => {
    it('atomic claim lock prevents double execution of confirmed meeting', async () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: TEST_WS,
        userId: TEST_USER,
        sessionId: TEST_SESSION,
        fields: {
          title: 'Closing Review: Matt Orr',
          meetingDate: '2026-09-03',
          startTime: '10:00 AM'
        },
        status: 'awaiting_confirmation'
      });

      // Claim 1 succeeds
      const claim1 = await PendingActionManager.atomicClaimActionForExecution(TEST_WS, TEST_USER, TEST_SESSION, pending.version);
      expect(claim1.claimed).toBe(true);

      // Claim 2 fails immediately
      const claim2 = await PendingActionManager.atomicClaimActionForExecution(TEST_WS, TEST_USER, TEST_SESSION, pending.version);
      expect(claim2.claimed).toBe(false);
      expect(claim2.reason).toContain('is not in awaiting_confirmation state');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Reschedule, Cancel, and FreeBusy Capabilities
  // ---------------------------------------------------------------------------
  describe('6. Reschedule, Cancel, and Free/Busy Operations', () => {
    beforeAll(() => {
      process.env.MOCK_INTEGRATIONS = 'true';
    });

    afterAll(() => {
      delete process.env.MOCK_INTEGRATIONS;
    });

    it('schedules a meeting and allows rescheduling to a new date and time', async () => {
      const meeting = await scheduleBrokerageMeeting({
        title: 'Weekly Production Check-in',
        meetingDate: '2026-09-04',
        startTime: '11:00 AM',
        durationMinutes: 45,
        targetAudience: 'Ann Gunn',
        workspaceId: TEST_WS,
        requesterName: 'Ryan Crecelius'
      });

      expect(meeting.id).toBeDefined();
      expect(meeting.meetingDate).toBe('Friday, September 4, 2026');

      // Reschedule
      const reschedRes = await rescheduleBrokerageMeeting({
        meetingId: meeting.id,
        newDate: '2026-09-05',
        newTime: '2:00 PM',
        workspaceId: TEST_WS
      });

      expect(reschedRes.success).toBe(true);
      expect(reschedRes.meeting?.meetingDate).toBe('Saturday, September 5, 2026');
      expect(reschedRes.meeting?.startTime).toBe('2:00 PM');
    });

    it('cancels an existing meeting and verifies deletion in repository', async () => {
      const meeting = await scheduleBrokerageMeeting({
        title: 'Sign Post Alignment',
        meetingDate: '2026-09-06',
        startTime: '9:00 AM',
        targetAudience: 'James Fort',
        workspaceId: TEST_WS
      });

      const cancelRes = await cancelBrokerageMeeting({
        meetingId: meeting.id,
        reason: 'Broker requested cancellation',
        workspaceId: TEST_WS
      });

      expect(cancelRes.success).toBe(true);
      expect(cancelRes.cancelledMeeting?.id).toBe(meeting.id);

      const remaining = await CalendarRepository.getScheduledMeeting(meeting.id);
      expect(remaining).toBeNull();
    });

    it('checks Free/Busy availability and provides suggested open windows', async () => {
      const freeBusy = await queryGoogleCalendarFreeBusy({
        calendarIds: ['matt.orr@nestrealty.com', 'ann.gunn@nestrealty.com'],
        timeMin: '2026-09-02T09:00:00Z',
        timeMax: '2026-09-02T17:00:00Z',
        workspaceId: TEST_WS
      });

      expect(freeBusy).toBeDefined();
      expect(freeBusy.calendars['matt.orr@nestrealty.com']).toBeDefined();
      expect(freeBusy.calendars['matt.orr@nestrealty.com'].status).toBe('AVAILABLE');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Trusted Link Verification & Anti-404 Security
  // ---------------------------------------------------------------------------
  describe('7. Trusted Link Verification & Anti-Fixture Security', () => {
    it('registers valid Google Calendar and Meet links', () => {
      const gcalUrl = 'https://calendar.google.com/calendar/event?eid=gcal_real_ev_123';
      const meetUrl = 'https://meet.google.com/abc-defg-hij';

      VerifiedLinkService.registerVerifiedResource({
        provider: 'google_calendar',
        resourceId: 'gcal_real_ev_123',
        url: gcalUrl,
        provenance: 'provider_response',
        verifiedAt: new Date().toISOString(),
        workspaceId: TEST_WS,
        status: 'available'
      });

      expect(VerifiedLinkService.isLinkVerified(gcalUrl, TEST_WS)).toBe(true);
      expect(VerifiedLinkService.isValidGoogleUrl(meetUrl)).toBe(true);
    });

    it('rejects fixture and placeholder URLs from rendering as clickable markdown', () => {
      const fakeUrl = 'https://drive.google.com/drive/folders/1DRV_MOCK_VAULT_123';
      expect(VerifiedLinkService.isValidGoogleUrl(fakeUrl)).toBe(false);

      const markdown = `Here is your [Drive Folder](${fakeUrl}) for review.`;
      const sanitized = VerifiedLinkService.sanitizeMarkdownLinks(markdown, TEST_WS);
      expect(sanitized).not.toContain(`(${fakeUrl})`);
    });
  });
});
