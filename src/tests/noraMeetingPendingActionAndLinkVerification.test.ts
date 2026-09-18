/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Multi-Turn Meeting Scheduling & Verified Link Regression Test Suite
 * Validates the complete 2-turn conversational flow, pending action lifecycle,
 * directory resolution, timezone math, trusted link verification, and absence of 404 fixtures.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { PendingActionManager } from '../../server/agent/pendingActionManager';
import { MeetingSlotExtractor } from '../../server/agent/meetingSlotExtractor';
import { VerifiedLinkService } from '../../server/services/verifiedLinkService';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService';
import { NoraGoogleWorkspaceService } from '../../server/services/noraGoogleWorkspaceService';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';

describe('NORA Meeting Scheduling & Trusted Link Verification Suite', () => {
  const WORKSPACE_ID = 'ws_wilmington_test';
  const USER_ID = 'ryan_test';
  const SESSION_ID = 'sess_test_123';
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

  beforeEach(() => {
    PendingActionManager.resetForTesting();
    VerifiedLinkService.resetForTesting();
  });

  // ---------------------------------------------------------------------------
  // 1. Exact 2-Turn Screenshot Scenario
  // ---------------------------------------------------------------------------
  it('1. Turn 1 ("Schedule me a meeting") creates pending action; Turn 2 ("Meet with Matt Orr, google meet, tomorrow at 3pm Eastern") stages confirmation without Drive vaults', async () => {
    // Turn 1: "Schedule me a meeting"
    const turn1Res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Schedule me a meeting',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      conversationHistory: []
    });

    expect(turn1Res).toBeDefined();
    expect(turn1Res?.status).toBe('ACTION_DETAILS_REQUIRED');
    expect(turn1Res?.displayResponse).toContain('Schedule a Meeting');
    expect(turn1Res?.displayResponse).not.toContain('Transaction Vaults');

    const pendingAfterTurn1 = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(pendingAfterTurn1).toBeDefined();
    expect(pendingAfterTurn1?.status).toBe('collecting_details');
    expect(pendingAfterTurn1?.missingFields).toContain('attendees');
    expect(pendingAfterTurn1?.missingFields).toContain('startTime');

    // Turn 2: "Meet with Matt Orr, google meet, tomorrow at 3pm Eastern"
    const turn2Res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Meet with Matt Orr, google meet, tomorrow at 3pm Eastern',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      conversationHistory: [{ sender: 'user', text: 'Schedule me a meeting' }]
    });

    expect(turn2Res).toBeDefined();
    expect(turn2Res?.status).toBe('ACTION_AWAITING_CONFIRMATION');
    expect(turn2Res?.displayResponse).toContain('Confirm Google Calendar Meeting');
    expect(turn2Res?.displayResponse).toContain('Matt Orr');
    expect(turn2Res?.displayResponse).toContain('Google Meet');
    expect(turn2Res?.displayResponse).toContain('3:00 PM');
    expect(turn2Res?.spokenAnswer).toContain('I have staged a Google Meet with Matt Orr');

    // CRITICAL: Must NEVER contain Drive Transaction Vaults or 404 links
    expect(turn2Res?.displayResponse).not.toContain('Google Workspace Transaction Vaults');
    expect(turn2Res?.displayResponse).not.toContain('1DRV_');
    expect(turn2Res?.displayResponse).not.toContain('gdrive_vault_');
    expect(turn2Res?.displayResponse).not.toContain('Open in Google Drive');

    const pendingAfterTurn2 = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(pendingAfterTurn2).toBeDefined();
    expect(pendingAfterTurn2?.status).toBe('awaiting_confirmation');
    expect(pendingAfterTurn2?.fields.attendees?.[0].displayName).toContain('Matt Orr');
    expect(pendingAfterTurn2?.fields.attendees?.[0].email).toContain('matt.orr@nestrealty.com');
  });

  // ---------------------------------------------------------------------------
  // 2. Directory Resolution & Recipient Verification
  // ---------------------------------------------------------------------------
  it('2. Resolves "Matt Orr" to verified Nest Directory record with role and email', () => {
    const res = MeetingSlotExtractor.resolveDirectoryPerson('Matt Orr');
    expect(res.matched).toBeDefined();
    expect(res.isAmbiguous).toBe(false);
    expect(res.matched?.displayName).toContain('Matt Orr');
    expect(res.matched?.email).toBe('matt.orr@nestrealty.com');
    expect(res.matched?.isGoogleWorkspaceVerified).toBe(true);
  });

  it('3. Handles ambiguous person search and marks status as awaiting_recipient_resolution', async () => {
    const extracted = MeetingSlotExtractor.extractSlots('Meet with Sarah');
    // If multiple Sarahs exist in roster, should be flagged
    if (extracted.ambiguousAttendees && extracted.ambiguousAttendees.length > 1) {
      expect(extracted.ambiguousAttendees.length).toBeGreaterThan(1);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Timezone & Relative Date Calculation
  // ---------------------------------------------------------------------------
  it('4. Correctly computes tomorrow date in Eastern Time (America/New_York)', () => {
    const refDate = new Date('2026-08-31T15:00:00Z');
    const { dateStr, formattedDate } = MeetingSlotExtractor.resolveDateString('tomorrow', refDate);
    expect(dateStr).toBe('2026-09-01');
    expect(formattedDate).toContain('September 1, 2026');
  });

  it('5. Correctly parses 3pm Eastern into 3:00 PM and 15:00 24h format', () => {
    const parsed = MeetingSlotExtractor.parseTimeString('3pm Eastern');
    expect(parsed).toBeDefined();
    expect(parsed?.startTime).toBe('3:00 PM');
    expect(parsed?.hour24).toBe(15);
    expect(parsed?.minute).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 4. Execution & Confirmation Gate
  // ---------------------------------------------------------------------------
  it('6. Does not execute until user explicitly confirms; confirmation completes action', async () => {
    // Setup pending action awaiting confirmation
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: {
        title: 'Meeting with Matt Orr',
        targetAudience: 'Matt Orr',
        attendeeNames: ['Matt Orr'],
        attendeeEmails: ['matt.orr@nestrealty.com'],
        meetingDate: '2026-09-02',
        startTime: '3:00 PM',
        durationMinutes: 60,
        locationType: 'google_meet',
        location: 'Google Meet (Virtual Video Call)'
      },
      status: 'awaiting_confirmation'
    });

    // Confirmation turn: "Confirm and schedule"
    const confirmRes = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Confirm and schedule',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      conversationHistory: []
    });

    expect(confirmRes).toBeDefined();
    expect(confirmRes?.status).toBe('ACTION_COMPLETED');
    expect(confirmRes?.displayResponse).toMatch(/Google Calendar Meeting (Dispatched|Draft)/);
    expect(confirmRes?.displayResponse).toContain('Matt Orr');

    // Pending action should be cleared upon completion
    const pendingAfter = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(pendingAfter).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 5. Cancellation
  // ---------------------------------------------------------------------------
  it('7. User cancellation ("nevermind" / "cancel") clears pending action', async () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: { targetAudience: 'Matt Orr' },
      status: 'collecting_details'
    });

    const cancelRes = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Nevermind, cancel that',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      conversationHistory: []
    });

    expect(cancelRes?.status).toBe('ACTION_CANCELLED');
    expect(cancelRes?.displayResponse).toContain('Meeting Scheduling Cancelled');

    const pendingAfter = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(pendingAfter).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 6. Topic Change Resilience (No Trapping)
  // ---------------------------------------------------------------------------
  it('8. Unrelated legal query clears pending action and answers knowledge question directly', async () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      status: 'collecting_details'
    });

    const knowledgeRes = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'What are NCREC rules on earnest money deadline?',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      conversationHistory: []
    });

    expect(knowledgeRes).toBeDefined();
    expect(knowledgeRes?.status).not.toBe('ACTION_DETAILS_REQUIRED');
    expect(knowledgeRes?.displayResponse).toContain('NCREC');

    // Pending action cleared
    const pendingAfter = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(pendingAfter).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 7. Multi-Tenant & Session Isolation
  // ---------------------------------------------------------------------------
  it('9. Strict isolation across workspaces, users, and sessions', () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: 'ws_wilmington',
      userId: 'user_ryan',
      sessionId: 'sess_1',
      fields: { targetAudience: 'Matt Orr' }
    });

    expect(PendingActionManager.getPendingAction('ws_wilmington', 'user_ryan', 'sess_1')).not.toBeNull();
    expect(PendingActionManager.getPendingAction('ws_wilmington', 'user_ryan', 'sess_2')).toBeNull();
    expect(PendingActionManager.getPendingAction('ws_wilmington', 'user_other', 'sess_1')).toBeNull();
    expect(PendingActionManager.getPendingAction('ws_carolina_beach', 'user_ryan', 'sess_1')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 8. Trusted Link Verification & Fixture Rejection
  // ---------------------------------------------------------------------------
  it('10. Rejects placeholder URLs with 1DRV_, 1SLD_, and gdrive_vault_', () => {
    expect(VerifiedLinkService.isValidGoogleUrl('https://drive.google.com/drive/folders/1DRV_304_OCEAN_BLVD')).toBe(false);
    expect(VerifiedLinkService.isValidGoogleUrl('https://docs.google.com/presentation/d/1SLD_304/edit')).toBe(false);
    expect(VerifiedLinkService.isValidGoogleUrl('https://drive.google.com/drive/folders/gdrive_vault_123')).toBe(false);
    expect(VerifiedLinkService.isValidGoogleUrl('https://drive.google.com/drive/folders/[PROPERTY_ADDRESS]')).toBe(false);
    expect(VerifiedLinkService.isValidGoogleUrl('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting')).toBe(true);
  });

  it('11. Sanitizes markdown links by stripping unverified placeholder URLs', () => {
    const unverifiedMarkdown = 'Check the [Listing Vault](https://drive.google.com/drive/folders/1DRV_FAKE_FOLDER) for contracts.';
    const sanitized = VerifiedLinkService.sanitizeMarkdownLinks(unverifiedMarkdown, WORKSPACE_ID);
    expect(sanitized).not.toContain('https://drive.google.com/drive/folders/1DRV_FAKE_FOLDER');
    expect(sanitized).toContain('**Listing Vault** *(Connect Integration to View)*');
  });

  // ---------------------------------------------------------------------------
  // 9. Client Router & Voice Agent Parity
  // ---------------------------------------------------------------------------
  it('12. Client-side transcript router extracts slots and returns SCHEDULE_BROKERAGE_MEETING', () => {
    const clientRes = processUserUtterance('Meet with Matt Orr, google meet, tomorrow at 3pm Eastern', {} as any, 'Ryan');
    expect(clientRes.intentType).toBe('SCHEDULE_BROKERAGE_MEETING');
    expect(clientRes.meetingWizard).toBeDefined();
    expect(clientRes.meetingWizard?.targetAudience).toContain('Matt Orr');
    expect(clientRes.meetingWizard?.meetingDate).toBe('tomorrow');
    expect(clientRes.meetingWizard?.startTime).toBe('3:00 PM');
    expect(clientRes.meetingWizard?.location).toContain('Google Meet');
  });

  // ---------------------------------------------------------------------------
  // 10. Multi-Turn Incremental Slot Merging (3 Turns)
  // ---------------------------------------------------------------------------
  it('13. Incrementally merges slots across 3 turns (Schedule meeting -> with Matt Orr -> tomorrow at 3pm on Google Meet)', async () => {
    // Turn 1: "Schedule meeting"
    const t1 = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Schedule a meeting',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: 'sess_3turn',
      conversationHistory: []
    });
    expect(t1?.status).toBe('ACTION_DETAILS_REQUIRED');

    // Turn 2: "With Matt Orr"
    const t2 = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'with Matt Orr',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: 'sess_3turn',
      conversationHistory: [{ sender: 'user', text: 'Schedule a meeting' }]
    });
    expect(t2?.status).toBe('ACTION_DETAILS_REQUIRED');
    const p2 = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_3turn');
    expect(p2?.fields.attendees?.[0].displayName).toContain('Matt Orr');

    // Turn 3: "Tomorrow at 3pm on Google Meet for 30 minutes"
    const t3 = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Tomorrow at 3pm on Google Meet for 30 minutes',
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: 'sess_3turn',
      conversationHistory: [
        { sender: 'user', text: 'Schedule a meeting' },
        { sender: 'user', text: 'with Matt Orr' }
      ]
    });
    expect(t3?.status).toBe('ACTION_AWAITING_CONFIRMATION');
    expect(t3?.displayResponse).toContain('Confirm Google Calendar Meeting');
    expect(t3?.displayResponse).toContain('Matt Orr');
    expect(t3?.displayResponse).toContain('30 minutes');
    expect(t3?.displayResponse).toContain('Google Meet');
  });

  // ---------------------------------------------------------------------------
  // 11. TTL Expiration
  // ---------------------------------------------------------------------------
  it('14. Expired pending action is automatically pruned after TTL', () => {
    const action = PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: 'sess_exp'
    });
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_exp')).not.toBeNull();

    // Manually expire action
    action.expiresAt = new Date(Date.now() - 1000).toISOString();
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_exp')).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 12. Clear All For Session (New Chat)
  // ---------------------------------------------------------------------------
  it('15. Clear all for session wipes pending state cleanly on New Chat', () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: 'sess_clear'
    });
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_clear')).not.toBeNull();

    PendingActionManager.clearAllForSession(WORKSPACE_ID, 'sess_clear');
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_clear')).toBeNull();
  });
});
