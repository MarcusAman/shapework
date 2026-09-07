/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Production Durability & Forensic Phase Honesty Verification Suite
 * Validates fail-closed production database rules, multi-step planner durability
 * & resumption without duplicate external writes, and honest evidence labels.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoraConversationStateManager } from '../../server/agent/noraConversationState.js';
import { NoraCommitmentManager } from '../../server/agent/noraCommitmentManager.js';
import { NoraCapabilityPlanner, NoraCapabilityExecutionPlan } from '../../server/agent/noraCapabilityPlanner.js';
import { NoraActionRegistry } from '../../server/agent/noraActionRegistry.js';
import { NoraAttentionEngine } from '../../server/agent/noraAttentionEngine.js';
import {
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest,
  getAllCanonicalMarketingTasks,
  persistTaskToDatabase,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Production Durability & Forensic Honesty Suite', () => {
  const testContext = {
    workspaceId: 'ws_wilmington',
    tenantId: 'tenant_nest_wilmington',
    user: {
      id: 'usr_ryan',
      email: 'ryan@nestrealty.com',
      name: 'Ryan Crecelius',
      role: 'owner' as const
    },
    permissions: ['view_work_queue', 'manage_tasks', 'directory.read', 'view_library', 'edit_library', 'access_developer_tools'],
    channel: 'typed' as const,
    recentActionHistory: [],
    environment: 'development' as const
  };

  it('1. Production Persistence Fail-Closed: Conversation state throws when database driver is missing in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      // Without DB configured in production, saving must throw a fatal configuration error
      expect(() => {
        NoraConversationStateManager.saveConversationState({
          workspaceId: 'ws_wilmington',
          userId: 'usr_ryan',
          sessionId: 'test_prod_session',
          channel: 'typed',
          activeEntities: [],
          collectedFields: {},
          missingFields: [],
          corrections: [],
          suspendedGoals: [],
          recentEvidenceIds: [],
          expiresAt: new Date(Date.now() + 60000).toISOString()
        });
      }).toThrow(/Database persistence driver is required in production environment/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('2. Production Persistence Fail-Closed: Commitment creation throws when database driver is missing in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      expect(() => {
        NoraCommitmentManager.createCommitment({
          workspaceId: 'ws_wilmington',
          userId: 'usr_ryan',
          title: 'Production Commitment Test',
          targetRecordType: 'task',
          targetRecordId: 'task_prod_001',
          conditionType: 'status_still_equals',
          conditionExpression: { description: 'test' },
          owner: 'Ryan Crecelius',
          evaluateAt: new Date(Date.now() + 86400000).toISOString()
        });
      }).toThrow(/Database persistence driver is required in production environment/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('3. Production Persistence Fail-Closed: Marketing task save throws when database driver is missing in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      await expect(persistTaskToDatabase({
        id: 'task_prod_test_001',
        requestId: 'req_prod_001',
        title: 'Prod Test Task',
        assignedTo: 'Melissa Gagliardi',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })).rejects.toThrow(/Database persistence driver is required in production environment/);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('4. Multi-Step Planner Recovery: Resuming a plan skips already completed external writes without re-execution', async () => {
    const plan: NoraCapabilityExecutionPlan = {
      planId: `plan_recovery_test_${Date.now()}`,
      summary: 'Test Multi-Step Plan with recovery',
      workspaceId: 'ws_wilmington',
      userId: 'usr_ryan',
      originatingQuery: 'test query',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      steps: [
        {
          stepId: 'step_1_completed',
          order: 1,
          actionName: 'task.list_pending',
          capability: 'task.create',
          label: 'Completed Read Step',
          description: 'Step already executed previously',
          args: {},
          dependencies: [],
          riskLevel: 'LOW',
          isReadOnly: true,
          requiresConfirmation: false,
          status: 'completed',
          result: {
            success: true,
            actionName: 'task.list_pending',
            status: 'completed',
            data: { previouslyCompleted: true },
            humanReadableSummary: 'Already completed.',
            auditMetadata: {
              actionId: 'act_prev_001',
              timestamp: new Date().toISOString(),
              actorUserId: 'usr_ryan',
              actorRole: 'owner',
              tenantId: 'tenant_nest_wilmington',
              workspaceId: 'ws_wilmington',
              riskLevel: 'LOW',
              verified: true,
              impactArea: 'task.create'
            }
          }
        },
        {
          stepId: 'step_2_pending',
          order: 2,
          actionName: 'task.list_pending',
          capability: 'task.create',
          label: 'Pending Step to Resume',
          description: 'This step should execute on resume',
          args: {},
          dependencies: ['step_1_completed'],
          riskLevel: 'LOW',
          isReadOnly: true,
          requiresConfirmation: false,
          status: 'pending'
        }
      ]
    };

    const execResult = await NoraCapabilityPlanner.executePlan(plan, testContext);

    expect(execResult.allSuccessful).toBe(true);
    expect(execResult.plan.status).toBe('completed');
    expect(plan.steps[0].status).toBe('completed');
    expect(plan.steps[1].status).toBe('completed');
    // Completed step was preserved without error
    expect(plan.steps[0].result?.data?.previouslyCompleted).toBe(true);
  });

  it('5. Phase 7 Verified Document Assistance: Searches approved SOPs and authorized Drive documents with exact citations', async () => {
    const sopAction = NoraActionRegistry.getAction('document.find_approved_sop');
    expect(sopAction).toBeDefined();
    const sopResult = await sopAction!.execute({ query: 'SOP-MKT-008' }, testContext);
    expect(sopResult.success).toBe(true);
    expect(sopResult.data.verificationStatus).toBe('VERIFIED_APPROVED_SOP');

    const driveAction = NoraActionRegistry.getAction('document.find_authorized_drive');
    expect(driveAction).toBeDefined();
    const driveResult = await driveAction!.execute({ documentName: 'Listing Operations Manual' }, testContext);
    expect(driveResult.success).toBe(true);
    expect(driveResult.data.verificationStatus).toBe('AUTHORIZED_DOCUMENT');
    expect(driveResult.data.providerMode).toBe('SANDBOX');

    const sumAction = NoraActionRegistry.getAction('document.summarize_authorized');
    expect(sumAction).toBeDefined();
    const sumResult = await sumAction!.execute({ documentId: 'SOP-MKT-008' }, testContext);
    expect(sumResult.success).toBe(true);
    expect(sumResult.data.verificationStatus).toBe('GROUNDED_SUMMARY');

    const draftAction = NoraActionRegistry.getAction('knowledge.draft_item');
    expect(draftAction).toBeDefined();
    const draftResult = await draftAction!.execute({
      title: 'Waterfront Listing Photography Checklist',
      category: 'marketing',
      summary: 'Guidelines for tidal dock and sunset drone photography',
      proposedSteps: ['Check tide charts', 'Schedule golden hour flight']
    }, testContext);
    expect(draftResult.success).toBe(true);
    expect(draftResult.data.approvalState).toBe('PENDING_BIC_APPROVAL');
    expect(draftResult.data.requiresBicApproval).toBe(true);
  });

  it('6. Phase 5 & 8 BIC Compliance: Attention Engine attaches evidenceType and explicit BIC disclaimers', () => {
    const briefing = NoraAttentionEngine.generateBriefing(testContext, 'Ryan Crecelius');
    expect(briefing.risks.length).toBeGreaterThan(0);
    expect(briefing.risks.every(r => ['VERIFIED_FACT', 'POTENTIAL_RISK', 'MISSING_EVIDENCE', 'HUMAN_REVIEW_REQUIRED'].includes(r.evidenceType))).toBe(true);
    expect(briefing.displayMarkdown).toContain('A licensed North Carolina Broker-in-Charge decides legal and regulatory compliance');
  });

  it('7. Phase 5 Directory Honesty: roster.lookup returns SEEDED provider mode and explicit source provenance', async () => {
    const rosterAction = NoraActionRegistry.getAction('roster.lookup');
    expect(rosterAction).toBeDefined();
    const result = await rosterAction!.execute({ query: 'Chris Brown' }, testContext);
    expect(result.success).toBe(true);
    expect(result.data.source).toBe('SEEDED_DATABASE_ROSTER');
    expect(result.data.providerMode).toBe('SEEDED');
    expect(result.data.verificationStatus).toBe('VERIFIED_ROSTER_RECORD');
  });
});
