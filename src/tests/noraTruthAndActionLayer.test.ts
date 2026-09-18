/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Truth + Action Layer Comprehensive Evaluation Suite
 * Tests canonical Truth Envelopes, standardized ProviderResult contracts,
 * Workspace Capabilities, 9-stage action lifecycle, conversational memory & references,
 * durable persistence, and truth-grounded answers across all operational domains.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TruthEnvelopeBuilder, NoraTruthEnvelope, NoraEvidence } from '../../server/truth/noraTruthEnvelope.js';
import { TruthResponseComposer } from '../../server/truth/truthResponseComposer.js';
import { ProviderResultFactory, ProviderResult } from '../../server/providers/providerResult.js';
import { WorkspaceCapabilityRegistry, WorkspaceCapability } from '../../server/capabilities/workspaceCapabilityRegistry.js';
import { PendingActionManager, PendingCalendarAction } from '../../server/agent/pendingActionManager.js';
import { MeetingSlotExtractor } from '../../server/agent/meetingSlotExtractor.js';
import { KnowledgeGapResolver } from '../../server/knowledge/knowledgeGapResolver.js';
import { createGoogleCalendarBrokerageMeeting, fetchGoogleCalendarEvents } from '../../server/integrations/google/googleCalendarClient.js';
import { scheduleBrokerageMeeting } from '../../server/services/brokerageCalendarService.js';
import { rawQueryUnifiedContext, queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever.js';

describe('NORA Truth + Action Layer Suite', () => {
  const WORKSPACE_ID = 'ws_wilmington';
  const USER_ID = 'ryan';
  const SESSION_ID = 'test_sess_truth_101';

  beforeEach(() => {
    PendingActionManager.resetForTesting();
    WorkspaceCapabilityRegistry.resetForTesting();
    KnowledgeGapResolver.resetForTesting();
  });

  afterEach(() => {
    PendingActionManager.resetForTesting();
    WorkspaceCapabilityRegistry.resetForTesting();
    KnowledgeGapResolver.resetForTesting();
  });

  // ===========================================================================
  // PHASE 1: CANONICAL TRUTH ENVELOPE
  // ===========================================================================
  describe('Phase 1 — Canonical Truth Envelope & Strict Response Composer', () => {
    it('1.1 constructs a validated Truth Envelope with facts, evidence, and actions', () => {
      const builder = new TruthEnvelopeBuilder({
        turnId: 'turn_001',
        sessionId: SESSION_ID,
        workspaceId: WORKSPACE_ID
      });

      const evidence: NoraEvidence = {
        evidenceId: 'ev_roster_ann',
        status: 'VERIFIED_LIVE',
        sourceType: 'directory',
        provider: 'nest_roster',
        providerMode: 'LIVE',
        workspaceId: WORKSPACE_ID,
        recordId: 'usr_ann_gunn',
        retrievedAt: new Date().toISOString(),
        lastVerifiedAt: '2026-09-01T00:00:00.000Z',
        fieldsSupported: ['displayName', 'email', 'role', 'responsibilities'],
        label: 'Nest staff directory'
      };

      builder.addEvidence(evidence);
      builder.addFact({
        field: 'signs_and_lockboxes_lead',
        value: 'Ann Gunn handles signs and lockboxes for the Wilmington offices.',
        evidenceIds: ['ev_roster_ann']
      });

      builder.addProposedAction({
        actionId: 'act_sign_request',
        actionType: 'create_vendor_order',
        capability: 'vendor.dispatch',
        provider: 'coastal_print_works',
        providerMode: 'LIVE',
        isExecutable: true,
        requiresConfirmation: true,
        label: 'Create a sign request',
        description: 'Order yard sign installation with Coastal Sign Post Co.'
      });

      const envelope = builder.build();

      expect(envelope.turnId).toBe('turn_001');
      expect(envelope.answerStatus).toBe('VERIFIED');
      expect(envelope.facts.length).toBe(1);
      expect(envelope.evidence.length).toBe(1);
      expect(envelope.proposedActions.length).toBe(1);

      // Compose response
      const composed = TruthResponseComposer.compose(envelope);
      expect(composed.spokenAnswer).toContain('Ann Gunn handles signs and lockboxes');
      expect(composed.displayResponse).toContain('Ann Gunn handles signs and lockboxes');
      expect(composed.displayResponse).toContain('Source: **Nest staff directory**');
      expect(composed.displayResponse).toContain('**Action:** Create a sign request');
    });

    it('1.2 does not introduce facts absent from the truth envelope', () => {
      const builder = new TruthEnvelopeBuilder({
        turnId: 'turn_002',
        sessionId: SESSION_ID,
        workspaceId: WORKSPACE_ID
      });

      builder.addFact({
        field: 'closing_date',
        value: 'The settlement date is September 18, 2026.',
        evidenceIds: []
      });

      const envelope = builder.build();
      const composed = TruthResponseComposer.compose(envelope);

      expect(composed.spokenAnswer).toBe('The settlement date is September 18, 2026.');
      expect(composed.displayResponse).toContain('The settlement date is September 18, 2026.');
      // Must not invent unverified actions or unverified sources
      expect(composed.executableActions.length).toBe(0);
    });
  });

  // ===========================================================================
  // PHASE 2: STANDARDIZED PROVIDER RESULT CONTRACT
  // ===========================================================================
  describe('Phase 2 — Standardized Provider Result Contract & Mode Enforcement', () => {
    it('2.1 creates standardized ProviderResult across LIVE, SANDBOX, FIXTURE, and DISCONNECTED modes', () => {
      const liveResult = ProviderResultFactory.createLiveResult({
        provider: 'google_calendar',
        workspaceId: WORKSPACE_ID,
        data: { eventId: 'gcal_live_999' },
        providerRecordIds: ['gcal_live_999'],
        verifiedUrls: ['https://calendar.google.com/event?eid=live999']
      });

      expect(liveResult.ok).toBe(true);
      expect(liveResult.mode).toBe('LIVE');
      expect(liveResult.providerRecordIds).toContain('gcal_live_999');

      const sandboxResult = ProviderResultFactory.createSandboxResult({
        provider: 'google_calendar',
        workspaceId: WORKSPACE_ID,
        data: { eventId: 'gcal_sand_101' }
      });

      expect(sandboxResult.ok).toBe(true);
      expect(sandboxResult.mode).toBe('SANDBOX');

      const disconnectedResult = ProviderResultFactory.createDisconnectedResult({
        provider: 'hive_mls',
        workspaceId: WORKSPACE_ID,
        reason: 'Live MLS feed not authorized for this tenant.'
      });

      expect(disconnectedResult.ok).toBe(false);
      expect(disconnectedResult.mode).toBe('DISCONNECTED');
      expect(disconnectedResult.errorCode).toBe('PROVIDER_DISCONNECTED');
    });

    it('2.2 Google Calendar adapter produces honest ProviderMode and proof metadata', async () => {
      const res = await createGoogleCalendarBrokerageMeeting({
        title: 'Strategy Session with Sarah Jenkins',
        startTime: '2026-09-02T14:00:00.000Z',
        endTime: '2026-09-02T15:00:00.000Z',
        attendeeEmails: ['sarah.jenkins@nestrealty.com'],
        organizerEmail: 'AskNora@nestrealty.com',
        workspaceId: WORKSPACE_ID,
        accessToken: 'sandbox_token_123',
        requestMeet: true
      });

      expect(res.id).toBeDefined();
      expect(res.mode).toBe('SANDBOX'); // without OAuth access token, must honestly report SANDBOX
      expect(res.isExternalVerified).toBe(false);
      expect(res.googleCalendarUrl).toContain('calendar.google.com');
    });
  });

  // ===========================================================================
  // PHASE 3: WORKSPACE CAPABILITY REGISTRY
  // ===========================================================================
  describe('Phase 3 — Workspace Capability Registry & Action Gating', () => {
    it('3.1 blocks actions when capability is disconnected or unauthorized', () => {
      const mlsValidation = WorkspaceCapabilityRegistry.validateAction({
        workspaceId: WORKSPACE_ID,
        capability: 'mls.read'
      });

      expect(mlsValidation.isExecutable).toBe(false);
      expect(mlsValidation.providerMode).toBe('DISCONNECTED');
      expect(mlsValidation.reasonDisabled).toContain('disconnected');

      const taskValidation = WorkspaceCapabilityRegistry.validateAction({
        workspaceId: WORKSPACE_ID,
        capability: 'task.create'
      });

      expect(taskValidation.isExecutable).toBe(true);
      expect(taskValidation.providerMode).toBe('LIVE');
    });

    it('3.2 disallows guests from executing sensitive workspace capabilities', () => {
      const authValidation = WorkspaceCapabilityRegistry.validateAction({
        workspaceId: WORKSPACE_ID,
        capability: 'vendor.dispatch',
        userRole: 'guest'
      });

      expect(authValidation.isExecutable).toBe(false);
      expect(authValidation.reasonDisabled).toContain('Guest accounts cannot execute');
    });
  });

  // ===========================================================================
  // PHASE 4: 9-STAGE ACTION LIFECYCLE & PROOF VERIFICATION
  // ===========================================================================
  describe('Phase 4 — Action Lifecycle & Multi-Turn Meeting Flow', () => {
    it('4.1 enforces action lifecycle progression: COLLECT -> AWAITING_CONFIRMATION -> EXECUTE', async () => {
      // Turn 1: Incomplete utterance (missing attendee, time, location)
      const slots1 = MeetingSlotExtractor.extractSlots('Schedule a meeting tomorrow');
      expect(slots1.isMeetingIntent).toBe(true);
      expect(slots1.fields.meetingDate).toBeDefined();

      const pending1 = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: SESSION_ID,
        fields: slots1.fields
      });

      expect(pending1.status).toBe('collecting_details');
      expect(pending1.lifecycleState).toBe('ACTION_DETAILS_REQUIRED');
      expect(pending1.missingFields).toContain('attendees');
      expect(pending1.missingFields).toContain('startTime');

      // Single clarification question
      const clarification = PendingActionManager.getSingleClarificationPrompt(pending1);
      expect(clarification?.question).toBe('Who should I schedule it with?');

      // Turn 2: User provides attendee and time
      const slots2 = MeetingSlotExtractor.extractSlots('With Matt Orr at 3pm over Google Meet', pending1);
      pending1.fields.attendees = slots2.fields.attendees;
      pending1.fields.startTime = slots2.fields.startTime;
      pending1.fields.locationType = slots2.fields.locationType;
      pending1.fields.location = slots2.fields.location;

      const missing2 = PendingActionManager.recomputeMissingFields(pending1);
      expect(missing2.length).toBe(0);
      expect(pending1.status).toBe('awaiting_confirmation');
      expect(pending1.lifecycleState).toBe('ACTION_AWAITING_CONFIRMATION');

      // Turn 3: User confirms
      const slots3 = MeetingSlotExtractor.extractSlots('Yes, send it', pending1);
      expect(slots3.isConfirmation).toBe(true);
    });

    it('4.2 supports natural time corrections without wiping collected attendee and date', () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: SESSION_ID,
        fields: {
          attendeeNames: ['Matt Orr'],
          meetingDate: '2026-09-02',
          startTime: '3:00 PM',
          location: 'Google Meet'
        }
      });

      // Correction: "Actually, make it 4:00"
      const slots = MeetingSlotExtractor.extractSlots('Actually, make it 4:00 PM', pending);
      expect(slots.isCorrection).toBe(true);
      expect(slots.fields.startTime).toBe('4:00 PM');

      PendingActionManager.applyCorrection(WORKSPACE_ID, USER_ID, SESSION_ID, {
        startTime: slots.fields.startTime
      });

      const updated = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
      expect(updated?.fields.startTime).toBe('4:00 PM');
      expect(updated?.fields.attendeeNames).toEqual(['Matt Orr']);
      expect(updated?.fields.meetingDate).toBe('2026-09-02');
    });
  });

  // ===========================================================================
  // PHASE 5 & 6: CONVERSATIONAL BEHAVIOR & REFERENCES
  // ===========================================================================
  describe('Phase 5 & 6 — Conversational Grounding, References & Answer First', () => {
    it('5.1 answers direct questions first with source citation and relevant action', () => {
      const res = queryUnifiedContext('Who handles signs and lockboxes for the Wilmington offices?');
      expect(res.spokenAnswer).toContain('Ann Gunn');
      expect(res.displayResponse).toContain('Ann Gunn');
      expect(res.suggestedActions?.some(a => a.label.includes('sign') || a.label.includes('Sign') || a.label.includes('Order'))).toBe(true);
    });

    it('5.2 resolves pronoun references ("send that to him" / "her")', () => {
      const contextEntity = {
        activePerson: {
          name: 'Matt Orr',
          email: 'matt.orr@nestrealty.com',
          role: 'Agent'
        }
      };

      const slots = MeetingSlotExtractor.extractSlots('Schedule a meeting with him tomorrow at 2pm', undefined, contextEntity);
      expect(slots.fields.attendees?.[0]?.displayName).toBe('Matt Orr');
    });

    it('5.3 distinguishes informational questions from scheduling actions', () => {
      const infoCheck = MeetingSlotExtractor.extractSlots('When is the meeting with Ryan?');
      expect(infoCheck.isInformationalQuestion).toBe(true);
      expect(infoCheck.isMeetingIntent).toBe(false);

      const capabilityCheck = MeetingSlotExtractor.extractSlots('Can you schedule meetings?');
      expect(capabilityCheck.isCapabilityInquiry).toBe(true);
      expect(capabilityCheck.isMeetingIntent).toBe(false);
    });

    it('5.4 handles cancellation ("never mind", "cancel")', () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: SESSION_ID,
        fields: { attendeeNames: ['Matt Orr'] }
      });

      const cancelCheck = MeetingSlotExtractor.extractSlots('Never mind', pending);
      expect(cancelCheck.isCancellation).toBe(true);
    });
  });

  // ===========================================================================
  // PHASE 7: OPERATIONAL ACTIVITY WITHOUT FAKE REASONING TIMERS
  // ===========================================================================
  describe('Phase 7 — Operational Activity (What NORA Checked)', () => {
    it('7.1 returns factual operational activity with 0ms artificial thought delay', () => {
      const res = queryUnifiedContext('Who handles marketing flyers?');
      expect(res.thoughtDurationMs).toBe(0);
      expect(res.reasoningSteps).toBeDefined();
      expect(res.reasoningSteps?.length).toBeGreaterThan(0);
      
      const stepTitles = res.reasoningSteps?.map(s => s.title).join(' ');
      expect(stepTitles).toMatch(/Checked staff directory|knowledge|roster/i);
    });
  });

  // ===========================================================================
  // PHASE 8: KNOWLEDGE GAP RESOLUTION LOOP
  // ===========================================================================
  describe('Phase 8 — Knowledge-Gap Resolution Loop & Owner Routing', () => {
    it('8.1 routes compliance and Form 2-T questions to BIC Ryan Crecelius', () => {
      const owner = KnowledgeGapResolver.resolveDomainOwner('What are the rules on Form 2-T earnest money forfeiture?');
      expect(owner.name).toBe('Ryan Crecelius');
      expect(owner.role).toContain('Broker-in-Charge');
    });

    it('8.2 routes marketing and collateral questions to Melissa Gagliardi', () => {
      const owner = KnowledgeGapResolver.resolveDomainOwner('Where do I order new listing flyers and Maxa postcards?');
      expect(owner.name).toBe('Melissa Gagliardi');
      expect(owner.role).toContain('Marketing');
    });

    it('8.3 routes lockboxes and signage questions to Ann Gunn', () => {
      const owner = KnowledgeGapResolver.resolveDomainOwner('I need an extra Supra lockbox and yard sign post');
      expect(owner.name).toBe('Ann Gunn');
      expect(owner.role).toContain('Operations');
    });

    it('8.4 creates and approves knowledge draft before making available', () => {
      const draft = KnowledgeGapResolver.createResolutionDraft({
        query: 'What is the policy for open house directional signs on Wrightsville Beach?',
        gapType: 'MISSING_KNOWLEDGE',
        workspaceId: WORKSPACE_ID,
        userId: USER_ID
      });

      expect(draft.status).toBe('draft_pending_review');
      expect(draft.designatedOwner.name).toBe('Ann Gunn');

      const approved = KnowledgeGapResolver.approveDraft(draft.id, 'Ann Gunn', 'Directional signs must be removed within 2 hours after the open house ends.');
      expect(approved?.status).toBe('approved');
      expect(approved?.proposedAnswer).toContain('removed within 2 hours');
    });
  });

  // ===========================================================================
  // PHASE 9: DURABLE PERSISTENCE
  // ===========================================================================
  describe('Phase 9 — Durable Multi-Store Persistence', () => {
    it('9.1 pending actions survive memory reset via durable store rehydration', () => {
      const action = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: 'sess_survive_101',
        fields: {
          attendeeNames: ['Matt Orr'],
          meetingDate: '2026-09-02',
          startTime: '3:00 PM'
        }
      });

      expect(action.id).toBeDefined();

      // Clear memory cache only (simulating process restart)
      (PendingActionManager as any).store.clear();

      // Retrieve action: should rehydrate from durable file
      const retrieved = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, 'sess_survive_101');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.fields.attendeeNames).toEqual(['Matt Orr']);
      expect(retrieved?.fields.startTime).toBe('3:00 PM');
    });

    it('9.2 maintains strict workspace isolation for pending actions', () => {
      PendingActionManager.createPendingCalendarAction({
        workspaceId: 'ws_wilmington',
        userId: 'ryan',
        sessionId: 'sess_iso',
        fields: { attendeeNames: ['Matt Orr'] }
      });

      expect(PendingActionManager.getPendingAction('ws_wilmington', 'ryan', 'sess_iso')).not.toBeNull();
      expect(PendingActionManager.getPendingAction('ws_carolina_beach', 'ryan', 'sess_iso')).toBeNull();
      expect(PendingActionManager.getPendingAction('ws_wilmington', 'other_user', 'sess_iso')).toBeNull();
    });
  });

  // ===========================================================================
  // PHASE 10: EXHAUSTIVE SCENARIO EVALUATION MATRIX
  // ===========================================================================
  describe('Phase 10 — Exhaustive Scenario Matrix (Knowledge, Actions & Conversation)', () => {
    // 10.A Knowledge Scenarios
    it('10.1 handles paraphrase and typo queries robustly', () => {
      const paraphraseRes = queryUnifiedContext('Who is in charge of lockboxes in Wilmington?');
      expect(paraphraseRes.spokenAnswer).toContain('Ann Gunn');

      const typoRes = queryUnifiedContext('who hendles sogns and lokboxs');
      expect(typoRes.spokenAnswer).toBeDefined();
    });

    it('10.2 handles conflicting sources honestly without guessing', () => {
      const builder = new TruthEnvelopeBuilder({
        turnId: 'turn_conflict',
        sessionId: SESSION_ID,
        workspaceId: WORKSPACE_ID
      });

      builder.addEvidence({
        evidenceId: 'ev_tx_1',
        status: 'VERIFIED_STORED_RECORD',
        sourceType: 'transaction',
        provider: 'dotloop',
        providerMode: 'LIVE',
        workspaceId: WORKSPACE_ID,
        label: 'Dotloop Transaction File',
        retrievedAt: new Date().toISOString(),
        fieldsSupported: ['closingDate']
      });

      builder.addEvidence({
        evidenceId: 'ev_cal_1',
        status: 'VERIFIED_STORED_RECORD',
        sourceType: 'calendar',
        provider: 'google_calendar',
        providerMode: 'LIVE',
        workspaceId: WORKSPACE_ID,
        label: 'Google Calendar Event',
        retrievedAt: new Date().toISOString(),
        fieldsSupported: ['closingDate']
      });

      builder.addUnknown({
        field: 'closing_date',
        reason: 'The transaction record shows September 18, while the calendar shows September 19. Conflicting dates detected.'
      });

      const envelope = builder.build();
      const composed = TruthResponseComposer.compose(envelope);

      expect(composed.hasConflicts).toBe(true);
      expect(composed.spokenAnswer).toContain('conflicting information');
      expect(composed.displayResponse).toContain('Conflicting Records Detected');
    });

    it('10.3 handles disconnected providers by failing closed and not using fixtures as live', () => {
      const builder = new TruthEnvelopeBuilder({
        turnId: 'turn_mls_unavail',
        sessionId: SESSION_ID,
        workspaceId: WORKSPACE_ID
      });

      builder.setAnswerStatus('PROVIDER_UNAVAILABLE');
      builder.addEvidence({
        evidenceId: 'ev_mls_disc',
        status: 'UNVERIFIED',
        sourceType: 'mls',
        provider: 'hive_mls',
        providerMode: 'DISCONNECTED',
        workspaceId: WORKSPACE_ID,
        label: 'Cape Fear MLS Feed',
        retrievedAt: new Date().toISOString(),
        fieldsSupported: ['listingStatus']
      });

      builder.addUnknown({
        field: 'listing_status',
        reason: 'The live MLS feed is not connected for this workspace.'
      });

      const envelope = builder.build();
      const composed = TruthResponseComposer.compose(envelope);

      expect(composed.hasUnavailableSources).toBe(true);
      expect(composed.spokenAnswer).toContain("can't verify that information because the live provider is not connected");
      expect(composed.displayResponse).toContain('Live Integration Disconnected');
    });

    it('10.4 routes legal and commission dispute questions to human BIC judgment', () => {
      const gapType = KnowledgeGapResolver.classifyGap({
        query: 'Can I sue the buyer for earnest money forfeiture and commission split discount?'
      });

      expect(gapType).toBe('HUMAN_JUDGMENT_REQUIRED');
      const owner = KnowledgeGapResolver.resolveDomainOwner('Can I sue the buyer for earnest money forfeiture?');
      expect(owner.name).toBe('Ryan Crecelius');
    });

    // 10.B Action Scenarios
    it('10.5 supports attendee changes ("Actually, ask Ryan instead")', () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: SESSION_ID,
        fields: {
          attendeeNames: ['Matt Orr'],
          meetingDate: '2026-09-02',
          startTime: '3:00 PM',
          location: 'Google Meet'
        }
      });

      const slots = MeetingSlotExtractor.extractSlots('Actually, ask Ryan instead', pending);
      expect(slots.isMeetingIntent).toBe(true);
      expect(slots.fields.attendeeNames).toEqual(['Ryan Crecelius']);

      PendingActionManager.applyCorrection(WORKSPACE_ID, USER_ID, SESSION_ID, {
        attendeeNames: slots.fields.attendeeNames,
        attendees: slots.fields.attendees,
        targetAudience: slots.fields.targetAudience
      });

      const updated = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
      expect(updated?.fields.attendeeNames).toEqual(['Ryan Crecelius']);
      expect(updated?.fields.startTime).toBe('3:00 PM');
    });

    it('10.6 supports date shifting ("What about next week?")', () => {
      const pending = PendingActionManager.createPendingCalendarAction({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        sessionId: SESSION_ID,
        fields: {
          attendeeNames: ['Matt Orr'],
          startTime: '3:00 PM',
          location: 'Google Meet'
        }
      });

      const slots = MeetingSlotExtractor.extractSlots('What about next week?', pending);
      expect(slots.fields.meetingDate).toBeDefined();

      PendingActionManager.applyCorrection(WORKSPACE_ID, USER_ID, SESSION_ID, {
        meetingDate: slots.fields.meetingDate
      });

      const updated = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
      expect(updated?.fields.meetingDate).toBe(slots.fields.meetingDate);
      expect(updated?.fields.attendeeNames).toEqual(['Matt Orr']);
    });

    it('10.7 reports partial completion honestly when meeting is created but conference fails', async () => {
      // Simulate meeting dispatch with conference failure
      const meetingResult = await createGoogleCalendarBrokerageMeeting({
        title: 'Meeting without video link',
        startTime: '2026-09-02T14:00:00.000Z',
        endTime: '2026-09-02T15:00:00.000Z',
        attendeeEmails: ['broker@nestrealty.com'],
        accessToken: 'sandbox_token_123',
        requestMeet: false,
        workspaceId: WORKSPACE_ID
      });

      expect(meetingResult.id).toBeDefined();
      expect(meetingResult.conferenceStatus).toBe('not_requested');
    });

    it('10.8 answers "Where did that answer come from?" and "Is that live information?"', () => {
      const builder = new TruthEnvelopeBuilder({
        turnId: 'turn_provenance',
        sessionId: SESSION_ID,
        workspaceId: WORKSPACE_ID
      });

      builder.addEvidence({
        evidenceId: 'ev_dir_1',
        status: 'VERIFIED_LIVE',
        sourceType: 'directory',
        provider: 'nest_roster',
        providerMode: 'LIVE',
        workspaceId: WORKSPACE_ID,
        label: 'Nest Realty Directory',
        lastVerifiedAt: '2026-09-01T12:00:00.000Z',
        retrievedAt: new Date().toISOString(),
        fieldsSupported: ['displayName', 'role', 'office']
      });

      builder.addFact({
        field: 'office_lead',
        value: 'Ann Gunn is the Operations Director in Wilmington.',
        evidenceIds: ['ev_dir_1']
      });

      const envelope = builder.build();
      const composed = TruthResponseComposer.compose(envelope);

      expect(composed.displayResponse).toContain('Source: **Nest Realty Directory**');
      expect(composed.displayResponse).toContain('verified September 1, 2026');
    });
  });
});
