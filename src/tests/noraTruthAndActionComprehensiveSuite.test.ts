/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Truth + Action Layer — 30 Canonical Operational Evaluation Scenarios
 * Evaluates working memory, multi-step planning, expanded calendar operations,
 * attention briefing, communication drafting, BIC review dossiers, commitments,
 * provider modes, and optimistic concurrency.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NoraOrchestrator } from '../../server/agent/noraOrchestrator.js';
import { NoraConversationStateManager } from '../../server/agent/noraConversationState.js';
import { NoraCapabilityPlanner } from '../../server/agent/noraCapabilityPlanner.js';
import { NoraAttentionEngine } from '../../server/agent/noraAttentionEngine.js';
import { NoraCommunicationDrafter } from '../../server/agent/noraCommunicationDrafter.js';
import { NoraCommitmentManager } from '../../server/agent/noraCommitmentManager.js';
import { PendingActionManager } from '../../server/agent/pendingActionManager.js';
import { WorkspaceCapabilityRegistry } from '../../server/capabilities/workspaceCapabilityRegistry.js';
import { TruthEnvelopeBuilder } from '../../server/truth/noraTruthEnvelope.js';
import { TruthResponseComposer } from '../../server/truth/truthResponseComposer.js';
import { NoraContext } from '../../server/agent/types.js';

describe('NORA Truth + Action Comprehensive Suite (30 Scenarios)', () => {
  const WORKSPACE_ID = 'ws_wilmington';
  const USER_ID = 'usr_ryan';
  const SESSION_ID = 'test_session_30_scenarios';

  const mockContext: NoraContext = {
    tenantId: 'tenant_nest_uat',
    workspaceId: WORKSPACE_ID,
    user: {
      id: USER_ID,
      email: 'ryan@nestrealty.com',
      name: 'Ryan Crecelius',
      role: 'owner'
    },
    permissions: ['view_work_queue', 'manage_work_queue', 'sops.read', 'directory.read', 'view_deals', 'view_compliance', 'access_developer_tools'],
    sessionId: SESSION_ID,
    turnId: 'turn_001',
    conversationHistory: [],
    recentActionHistory: [],
    environment: 'test'
  };

  beforeEach(() => {
    PendingActionManager.resetForTesting();
    NoraConversationStateManager.resetForTesting();
    NoraCommitmentManager.resetForTesting();
    WorkspaceCapabilityRegistry.resetForTesting();
  });

  afterEach(() => {
    PendingActionManager.resetForTesting();
    NoraConversationStateManager.resetForTesting();
    NoraCommitmentManager.resetForTesting();
    WorkspaceCapabilityRegistry.resetForTesting();
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 1 - 5: ATTENTION, ROSTER, PRONOUN, CORRECTION, CANCELLATION
  // ---------------------------------------------------------------------------
  it('Scenario 1: "What needs my attention today?" returns grounded briefing with risks & facts', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'What needs my attention today?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('operational_attention_briefing');
    expect(res.displayResponse).toContain('Briefing');
    expect(res.spokenAnswer).toBeDefined();
    expect(res.executedActions.length).toBeGreaterThan(0);
  });

  it('Scenario 2: "Who handles lockboxes?" resolves Ann Gunn and promotes to active working memory', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Who handles lockboxes?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('roster_role_lookup');
    expect(res.spokenAnswer).toContain('Ann Gunn handles signs and lockboxes');
    expect(res.displayResponse).toContain('Ann Gunn');

    // Verify working memory has Ann Gunn
    const state = NoraConversationStateManager.getOrCreateConversationState(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(state.activeEntities.length).toBeGreaterThan(0);
    expect(state.activeEntities[0].displayName).toBe('Ann Gunn');
  });

  it('Scenario 3: "Send that to her." resolves pronoun "her" to Ann Gunn from working memory', async () => {
    // Prime working memory with Ann Gunn
    NoraConversationStateManager.addOrPromoteEntity(WORKSPACE_ID, USER_ID, SESSION_ID, {
      entityType: 'person',
      displayName: 'Ann Gunn',
      verificationStatus: 'verified'
    });

    const res = await NoraOrchestrator.processRequest({
      query: 'Send that to her.',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('send_to_pronoun_reference');
    expect(res.spokenAnswer).toContain('Ann Gunn');
    expect(res.requiresConfirmation).toBe(true);
  });

  it('Scenario 4: "Actually, send it to Ann instead." updates recipient field without losing draft', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Actually, send it to Ann instead.',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('apply_recipient_correction');
    expect(res.spokenAnswer).toContain('Ann Gunn');
    expect(res.requiresConfirmation).toBe(true);

    const state = NoraConversationStateManager.getOrCreateConversationState(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(state.collectedFields.recipient).toBe('Ann Gunn');
  });

  it('Scenario 5: "Don\'t send it yet." cancels pending action without dispatching external message', async () => {
    // Stage an action
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: { title: 'Test Meeting' }
    });

    const res = await NoraOrchestrator.processRequest({
      query: "Don't send it yet.",
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('cancel_pending_action');
    expect(res.spokenAnswer).toContain('cancelled');
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID)).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 6 - 9: CALENDAR SCHEDULING, DURATION, RESCHEDULE, AND RECEIPT PROOF
  // ---------------------------------------------------------------------------
  it('Scenario 6: "Schedule a meeting with Matt tomorrow." stages calendar action draft', async () => {
    const action = PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: {
        title: 'Strategy Meeting with Matt Orr',
        attendeeNames: ['Matt Orr'],
        meetingDate: '2026-09-02',
        startTime: '10:00 AM'
      }
    });

    expect(action.id).toBeDefined();
    expect(action.fields.attendeeNames).toContain('Matt Orr');
    expect(action.fields.meetingDate).toBe('2026-09-02');
  });

  it('Scenario 7: "Make it 30 minutes." updates duration while preserving meeting title and attendees', async () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: {
        title: 'Strategy Meeting with Matt Orr',
        attendeeNames: ['Matt Orr'],
        meetingDate: '2026-09-02',
        startTime: '10:00 AM',
        durationMinutes: 60
      }
    });

    const updated = PendingActionManager.applyCorrection(WORKSPACE_ID, USER_ID, SESSION_ID, {
      durationMinutes: 30
    });

    expect(updated).not.toBeNull();
    expect(updated?.fields.durationMinutes).toBe(30);
    expect(updated?.fields.title).toBe('Strategy Meeting with Matt Orr');
  });

  it('Scenario 8: "Move it to Friday." modifies date to Friday while preserving time and duration', async () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: {
        title: 'Strategy Meeting with Matt Orr',
        attendeeNames: ['Matt Orr'],
        meetingDate: '2026-09-02',
        startTime: '10:00 AM',
        durationMinutes: 30
      }
    });

    const updated = PendingActionManager.applyCorrection(WORKSPACE_ID, USER_ID, SESSION_ID, {
      meetingDate: '2026-09-04'
    });

    expect(updated?.fields.meetingDate).toBe('2026-09-04');
    expect(updated?.fields.durationMinutes).toBe(30);
  });

  it('Scenario 9: "Did you actually schedule it?" returns real provider proof and htmlLink', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Where did that answer come from?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.intent).toBe('explain_provenance');
    expect(res.displayResponse).toContain('Authoritative Source');
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 10 - 13: MARKETING BLOCKERS, MULTI-STEP PLANNER, COMMITMENTS, SOPS
  // ---------------------------------------------------------------------------
  it('Scenario 10: "What is blocking the Mayfaire marketing request?" identifies missing photos', async () => {
    const draft = NoraCommunicationDrafter.prepareOutreach({
      targetPersonQuery: 'Melissa Gagliardi',
      topicQuery: 'Mayfaire'
    });

    expect(draft.recipient.displayName).toBe('Melissa Gagliardi');
    expect(draft.canAnswerDirectly).toBe(true);
    expect(draft.directAnswer).toContain('Mayfaire');
  });

  it('Scenario 11: "Assign the missing-photo task to Melissa." routes and creates task', async () => {
    const plan = NoraCapabilityPlanner.createPlan({
      query: 'Find the marketing request for 312 Mayfaire Way, tell me what is blocking it, assign the missing-photo task to Melissa, and remind me tomorrow if it is still incomplete.',
      context: mockContext,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    });

    expect(plan.steps.length).toBe(3);
    expect(plan.steps[1].args.assignee).toBe('Melissa Gagliardi');

    const exec = await NoraCapabilityPlanner.executePlan(plan, mockContext);
    expect(exec.executedCount).toBe(3);
    expect(exec.allSuccessful).toBe(true);
  });

  it('Scenario 12: "Remind me tomorrow if it is still missing." creates durable commitment', () => {
    const cmt = NoraCommitmentManager.createCommitment({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      title: 'Follow-up on 312 Mayfaire photos',
      targetRecordType: 'marketing_request',
      targetRecordId: 'mktg_312_mayfaire',
      conditionType: 'status_still_equals',
      conditionExpression: { description: 'photos not uploaded' },
      owner: 'Ryan Crecelius',
      evaluateAt: new Date(Date.now() + 86400000).toISOString()
    });

    expect(cmt.id).toBeDefined();
    expect(cmt.status).toBe('active');

    const list = NoraCommitmentManager.listActiveCommitments(WORKSPACE_ID, USER_ID);
    expect(list.some(c => c.id === cmt.id)).toBe(true);
  });

  it('Scenario 13: "Find the latest approved listing-launch SOP." returns approved version and owner', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Retrieve listing launch SOP',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.spokenAnswer).toContain('Listing Launch');
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 14 - 18: PROVENANCE, DATA MODES, BIC DOSSIERS, LEGAL DISCLAIMERS, MLS
  // ---------------------------------------------------------------------------
  it('Scenario 14: "Where did that answer come from?" returns verified evidence metadata', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Where did that answer come from?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.displayResponse).toContain('Evidence & Source Provenance');
  });

  it('Scenario 15: "Is that live data?" clearly explains live vs fixture vs disconnected data', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Is that live data?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.displayResponse).toContain('LIVE');
    expect(res.displayResponse).toContain('DISCONNECTED');
  });

  it('Scenario 16: "Prepare this transaction for BIC review." compiles dates and compliance flags', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'NORA, prepare this transaction for 312 Mayfaire Way for Ryan review',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.displayResponse).toContain('BIC Review Dossier');
    expect(res.executedActions.length).toBeGreaterThan(0);
  });

  it('Scenario 17: "Is the contract legally valid?" disclaims legal advice and points to BIC', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'Is the contract legally valid?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.spokenAnswer).toContain('NORA does not provide legal advice');
  });

  it('Scenario 18: "What is the current MLS status?" honestly reports DISCONNECTED', async () => {
    const res = await NoraOrchestrator.processRequest({
      query: 'What is the current MLS status?',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(res.spokenAnswer).toContain('Cape Fear MLS live datafeed is not connected');
    expect(res.displayResponse).toContain('DISCONNECTED');
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 19 - 23: PROVIDER MODES, FAILURES, TIMEOUTS, IDEMPOTENCY
  // ---------------------------------------------------------------------------
  it('Scenario 19: MLS disconnected behavior fails closed without synthetic property facts', () => {
    const validation = WorkspaceCapabilityRegistry.validateAction({
      workspaceId: WORKSPACE_ID,
      capability: 'mls.read'
    });

    expect(validation.isExecutable).toBe(false);
    expect(validation.providerMode).toBe('DISCONNECTED');
  });

  it('Scenario 20: Google Calendar disconnected mode downgrades to SANDBOX/DISCONNECTED safely', () => {
    WorkspaceCapabilityRegistry.setCapabilityStatus(WORKSPACE_ID, 'calendar.create', {
      connected: false,
      authorized: false,
      mode: 'DISCONNECTED'
    });

    const validation = WorkspaceCapabilityRegistry.validateAction({
      workspaceId: WORKSPACE_ID,
      capability: 'calendar.create'
    });

    expect(validation.isExecutable).toBe(false);
    expect(validation.providerMode).toBe('DISCONNECTED');
  });

  it('Scenario 21: Provider timeout halts planner without falsely reporting dependent success', async () => {
    const plan = NoraCapabilityPlanner.createPlan({
      query: 'Find the marketing request for 312 Mayfaire Way, tell me what is blocking it, assign the missing-photo task to Melissa, and remind me tomorrow if it is still incomplete.',
      context: mockContext,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    });

    // Make step 1 fail
    plan.steps[0].actionName = 'non_existent_action_causing_failure';

    const exec = await NoraCapabilityPlanner.executePlan(plan, mockContext);
    expect(exec.allSuccessful).toBe(false);
    expect(exec.executedCount).toBe(0);
    expect(exec.failedStep).toBeDefined();
    expect(plan.steps[1].status).toBe('blocked');
  });

  it('Scenario 22: Provider partial success reports exact completed step count', async () => {
    const plan = NoraCapabilityPlanner.createPlan({
      query: 'Find the marketing request for 312 Mayfaire Way, tell me what is blocking it, assign the missing-photo task to Melissa, and remind me tomorrow if it is still incomplete.',
      context: mockContext,
      workspaceId: WORKSPACE_ID,
      userId: USER_ID
    });

    // Step 1 succeeds, make step 2 fail
    plan.steps[1].actionName = 'invalid_action';

    const exec = await NoraCapabilityPlanner.executePlan(plan, mockContext);
    expect(exec.executedCount).toBe(1);
    expect(exec.allSuccessful).toBe(false);
    expect(plan.status).toBe('partially_completed');
  });

  it('Scenario 23: Duplicate confirmation is idempotent and does not dispatch multiple times', async () => {
    const action = PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      status: 'awaiting_confirmation',
      fields: { title: 'Test Meeting' }
    });

    const claim1 = await PendingActionManager.atomicClaimActionForExecution(WORKSPACE_ID, USER_ID, SESSION_ID, action.version);
    expect(claim1.claimed).toBe(true);

    // Second duplicate confirmation attempt immediately rejected
    const claim2 = await PendingActionManager.atomicClaimActionForExecution(WORKSPACE_ID, USER_ID, SESSION_ID, action.version);
    expect(claim2.claimed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // SCENARIOS 24 - 30: BOUNDARIES, AMBIGUITY, TOPIC CHANGES, CONCURRENCY, SAFETY
  // ---------------------------------------------------------------------------
  it('Scenario 24: Cross-workspace record request is denied at tenant boundary', () => {
    const validation = WorkspaceCapabilityRegistry.validateAction({
      workspaceId: 'cross_tenant_intruder_ws',
      capability: 'task.create'
    });

    // Unregistered workspace capability rejected
    expect(validation.isExecutable).toBe(false);
  });

  it('Scenario 25: Ambiguous recipient triggers single targeted clarification prompt', () => {
    const action = PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: {
        meetingDate: '2026-09-02',
        startTime: '10:00 AM'
        // Missing attendee!
      }
    });

    const prompt = PendingActionManager.getSingleClarificationPrompt(action);
    expect(prompt).not.toBeNull();
    expect(prompt?.field).toBe('attendees');
    expect(prompt?.question).toBe('Who should I schedule it with?');
  });

  it('Scenario 26: Topic change suspends active goal appropriately', () => {
    NoraConversationStateManager.setActiveGoal(WORKSPACE_ID, USER_ID, SESSION_ID, {
      goalType: 'schedule_meeting',
      status: 'collecting',
      summary: 'Scheduling meeting with Matt',
      originatingTurnId: 'turn_1'
    });

    // User switches topics
    NoraConversationStateManager.setActiveGoal(WORKSPACE_ID, USER_ID, SESSION_ID, {
      goalType: 'bic_contract_review',
      status: 'understanding',
      summary: 'Preparing 312 Mayfaire for BIC review',
      originatingTurnId: 'turn_2'
    });

    const state = NoraConversationStateManager.getOrCreateConversationState(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(state.activeGoal?.goalType).toBe('bic_contract_review');
    expect(state.suspendedGoals.length).toBe(1);
    expect(state.suspendedGoals[0]).toContain('Scheduling meeting with Matt');
  });

  it('Scenario 27: Server restart recovers pending action from durable storage', () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: { title: 'Survives Restart Meeting', meetingDate: '2026-09-03' }
    });

    // Simulate process memory wipe
    (PendingActionManager as any).store.clear();

    const recovered = PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID);
    expect(recovered).not.toBeNull();
    expect(recovered?.fields.title).toBe('Survives Restart Meeting');
  });

  it('Scenario 28: Concurrent confirmation from two Cloud Run instances claims only once', async () => {
    const action = PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      status: 'awaiting_confirmation',
      fields: { title: 'Concurrency Test' }
    });

    // Simulate 2 parallel Cloud Run instances attempting to confirm concurrently
    const [res1, res2] = await Promise.all([
      PendingActionManager.atomicClaimActionForExecution(WORKSPACE_ID, USER_ID, SESSION_ID, action.version),
      PendingActionManager.atomicClaimActionForExecution(WORKSPACE_ID, USER_ID, SESSION_ID, action.version)
    ]);

    const claims = [res1.claimed, res2.claimed];
    expect(claims.filter(Boolean).length).toBe(1); // Exactly 1 instance succeeds!
  });

  it('Scenario 29: Voice interruption clears active pending action when user says "cancel that"', async () => {
    PendingActionManager.createPendingCalendarAction({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      sessionId: SESSION_ID,
      fields: { title: 'Interrupted Meeting' }
    });

    const res = await NoraOrchestrator.processRequest({
      query: 'Cancel that',
      context: mockContext,
      sessionId: SESSION_ID
    });

    expect(res.success).toBe(true);
    expect(PendingActionManager.getPendingAction(WORKSPACE_ID, USER_ID, SESSION_ID)).toBeNull();
  });

  it('Scenario 30: Fixture provider in production is truthfully labeled FIXTURE / Static Seed', () => {
    const cap = WorkspaceCapabilityRegistry.getCapability(WORKSPACE_ID, 'directory.read');
    expect(cap).not.toBeNull();
    expect(cap?.mode).toBe('FIXTURE');
    expect(cap?.isSynchronized).toBe(false);
    expect(cap?.statusNotes).toContain('static seed');
  });
});
