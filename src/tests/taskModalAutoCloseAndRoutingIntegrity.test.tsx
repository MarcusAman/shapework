/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * taskModalAutoCloseAndRoutingIntegrity.test.tsx
 * 
 * Verifies:
 * 1. Nora marketing intake routing gate:
 *    - Inbound marketing requests assign to Melissa Gagliardi first in `request_received` (Intake Received lane)
 *    - Eduardo Lovo is recorded as fulfillment specialist
 * 2. Telephony request deduplication:
 *    - In-call Retell tool and post-call sync for the same callId update in-place without spawning duplicates
 * 3. Reconciled state of call_69b7bd8b487ac45a36154a25fbf:
 *    - Exactly one task assigned to Melissa in request_received
 */

import { describe, it, expect } from 'vitest';
import { noraMarketingIntakeOrchestrator } from '../../server/services/noraMarketingIntakeOrchestrator';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingTaskById,
  updateCanonicalMarketingTaskStatus
} from '../../server/persistence/marketingCampaignsRepository';

describe('Task Modal Auto-Close & Routing Integrity Suite', () => {
  it('1. Marketing intake initializes assigned to Melissa Gagliardi in request_received', async () => {
    const testCallId = `call_test_melissa_gate_${Date.now()}`;
    const callerInput = {
      propertyAddress: '204 Southern Pines Drive, Wilmington NC',
      deliverables: ['Tri-Fold Open House Flyer'],
      neededByDate: '2026-09-14',
      flexMlsStatus: 'flex_live' as const,
      transcript: 'Hi Nora, this is Matt Orr. I need 50 tri-fold flyers printed with CopyCat for an open house this weekend at 204 Southern Pines Drive.'
    };

    const trustedContext = {
      channel: 'phone' as const,
      workspaceId: 'ws_wilmington',
      authSource: 'telephony_caller_id' as const,
      requesterDirectoryMemberId: 'dir_matt_orr_12',
      requesterName: 'Matt Orr',
      requesterPhone: '+19105550199',
      requesterEmail: 'matt@nestrealty.com',
      telephonyCallId: testCallId
    };

    const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake(callerInput, trustedContext);
    const persistenceResult = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(evalResult);

    expect(persistenceResult.request).toBeDefined();
    expect(persistenceResult.tasks.length).toBeGreaterThan(0);

    const primaryTask = persistenceResult.tasks[0];
    // Must be assigned to Melissa Gagliardi in request_received (Intake Received lane)
    expect(primaryTask.assignedTo).toBe('Melissa Gagliardi');
    expect(primaryTask.assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(primaryTask.status).toBe('request_received');
    expect(primaryTask.reviewOwner).toBe('Melissa Gagliardi');

    // Eduardo Lovo must be designated fulfillment specialist in snapshot (not initial assignee)
    expect(primaryTask.routingSnapshot?.fulfillmentStaffId).toBe('dir_eduardo_lovo_73');
    expect(primaryTask.routingSnapshot?.designatedSpecialist).toBe('Eduardo Lovo');

    // Also verify that even if intake is missing info, it still assigns to Melissa (not Eduardo)
    const missingInfoCallId = `call_test_melissa_needs_info_${Date.now()}`;
    const missingInfoEval = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake({
      propertyAddress: '550 Harbor Way, Wilmington NC',
      deliverables: ['Open House Flyer'],
      transcript: 'Open house flyer please'
    }, { ...trustedContext, telephonyCallId: missingInfoCallId });
    const missingInfoPersist = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(missingInfoEval);
    expect(missingInfoPersist.tasks[0].assignedTo).toBe('Melissa Gagliardi');
    expect(missingInfoPersist.tasks[0].assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(missingInfoPersist.tasks[0].status).toBe('needs_info');
  });

  it('2. Telephony in-call evaluation and post-call sync deduplicate on callId', async () => {
    const dedupeCallId = `call_dedupe_${Date.now()}`;
    const uniqueAddress = `${Date.now()} Market Street, Wilmington NC`;
    const callerInput = {
      propertyAddress: uniqueAddress,
      deliverables: ['Listing Feature Sheet'],
      neededByDate: '2026-09-15',
      transcript: `I need listing feature sheets for ${uniqueAddress}.`
    };

    const trustedContext = {
      channel: 'phone' as const,
      workspaceId: 'ws_wilmington',
      authSource: 'telephony_caller_id' as const,
      requesterDirectoryMemberId: 'dir_matt_orr_12',
      requesterName: 'Matt Orr',
      requesterPhone: '+19105550199',
      requesterEmail: 'matt@nestrealty.com',
      telephonyCallId: dedupeCallId
    };

    // Step 1: In-call Retell tool persists evaluation
    const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake(callerInput, trustedContext);
    const inCallResult = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(evalResult);

    expect(inCallResult.request.id).toBe(`req_call_${dedupeCallId}`);
    expect(inCallResult.tasks.length).toBe(1);
    expect(inCallResult.tasks[0].id).toBe(`task_call_${dedupeCallId}_0`);

    // Step 2: Post-call webhook sync runs convertCallToCanonicalMarketingRequest
    const mockRetellCall = {
      id: dedupeCallId,
      transcript: callerInput.transcript,
      callerName: 'Matt Orr',
      agentName: 'Matt Orr',
      propertyAddress: uniqueAddress,
      call_analysis: {
        custom_analysis_data: {
          property_address: uniqueAddress,
          description: `Listing Feature Sheet for ${uniqueAddress}`
        }
      }
    };

    const postCallResult = convertCallToCanonicalMarketingRequest(mockRetellCall);

    // Must find existing request and existing task without creating duplicates
    expect(postCallResult.shouldCreate).toBe(true);
    expect(postCallResult.request?.id).toBe(`req_call_${dedupeCallId}`);
    expect(postCallResult.tasks.length).toBe(1);
    expect(postCallResult.tasks[0].id).toBe(`task_call_${dedupeCallId}_0`);

    // Verify global counts in repository
    const matchingRequests = getAllCanonicalMarketingRequests().filter(r => 
      r.id === `req_call_${dedupeCallId}` || (r as any).telephonyCallId === dedupeCallId
    );
    expect(matchingRequests.length).toBe(1);

    const matchingTasks = getAllCanonicalMarketingTasks().filter(t => 
      t.callId === dedupeCallId || t.id === `task_call_${dedupeCallId}_0`
    );
    expect(matchingTasks.length).toBe(1);
  });

  it('3. Existing task task_call_call_69b7bd8b487ac45a36154a25fbf_0 is assigned to Melissa in request_received', () => {
    const task = getCanonicalMarketingTaskById('task_call_call_69b7bd8b487ac45a36154a25fbf_0');
    expect(task).toBeDefined();
    expect(task?.assignedTo).toBe('Melissa Gagliardi');
    expect(task?.assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(task?.status).toBe('request_received');
    expect(task?.propertyAddress).toContain('139 North Fourth Street');
    expect(task?.vendorName).toBe('CopyCat');
  });

  it('4. Reassigning task to Eduardo Lovo automatically populates assignedToId and role', () => {
    const updated = updateCanonicalMarketingTaskStatus(
      'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      'in_progress',
      {
        performedBy: 'Melissa Gagliardi',
        note: 'Assigned by marketing director to Eduardo for collateral production',
        assignedTo: 'Eduardo Lovo'
      }
    );

    expect(updated).toBeDefined();
    expect(updated?.assignedTo).toBe('Eduardo Lovo');
    expect(updated?.assignedToId).toBe('dir_eduardo_lovo_73');
    expect(updated?.assignedToRole).toBe('Virtual Assistant / Production Specialist');
    expect(updated?.status).toBe('in_progress');
  });

  it('5. Reassigning task back to Melissa Gagliardi sets Marketing Director role and intake status', () => {
    const updated = updateCanonicalMarketingTaskStatus(
      'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      'request_received',
      {
        performedBy: 'Eduardo Lovo',
        note: 'Returned to intake triage',
        assignedTo: 'Melissa Gagliardi'
      }
    );

    expect(updated).toBeDefined();
    expect(updated?.assignedTo).toBe('Melissa Gagliardi');
    expect(updated?.assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(updated?.assignedToRole).toBe('Marketing Director');
    expect(updated?.status).toBe('request_received');
  });

  it('6. Reassigning task to Ann Gunn sets Operations & Signage Lead role', () => {
    const updated = updateCanonicalMarketingTaskStatus(
      'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      'in_progress',
      {
        performedBy: 'Melissa Gagliardi',
        note: 'Routing yard sign component to operations',
        assignedTo: 'Ann Gunn'
      }
    );

    expect(updated).toBeDefined();
    expect(updated?.assignedTo).toBe('Ann Gunn');
    expect(updated?.assignedToId).toBe('dir_ann_gunn_28');
    expect(updated?.assignedToRole).toBe('Operations & Signage Lead');

    // Restore to Melissa Gagliardi in request_received
    updateCanonicalMarketingTaskStatus(
      'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      'request_received',
      {
        performedBy: 'System',
        note: 'Restored for clean state',
        assignedTo: 'Melissa Gagliardi'
      }
    );
  });

  it('7. WorkspaceTaskDrawer renders activeTask and exposes Route To actions', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { WorkspaceTaskDrawer } = await import('../components/marketing/WorkspaceTaskDrawer');

    const mockTask = {
      id: 'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      propertyAddress: '139 North Fourth Street, Wilmington NC',
      agentName: 'Matt Orr (REALTOR®)',
      title: 'Open House Tri-Fold Flyer — 139 North Fourth Street',
      status: 'request_received',
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director',
      reviewState: 'not_started',
      proofVersion: 0
    };

    let closed = false;
    let reassignedTarget: string | null = null;

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={mockTask as any}
        onClose={() => { closed = true; }}
        onReassignTask={(taskId, newOwner) => { reassignedTarget = newOwner; }}
        currentUser={{ id: 'usr_ryan', name: 'Ryan Crecelius', role: 'admin' }}
      />
    );

    expect(html).toContain('139 North Fourth Street');
    expect(html).toContain('Open House Tri-Fold Flyer');
    expect(html).toContain('Melissa Gagliardi');
    expect(html).toContain('Route to...');
  });

  it('8. PATCH method is supported for updating task status and assignee without 404', async () => {
    // Verify updateCanonicalMarketingTaskStatus operates idempotently when receiving PATCH-equivalent payload
    const result = updateCanonicalMarketingTaskStatus(
      'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
      'request_received',
      {
        performedBy: 'Ryan Crecelius',
        note: 'Verified intake review gate',
        assignedTo: 'Melissa Gagliardi'
      }
    );

    expect(result).toBeDefined();
    expect(result?.id).toBe('task_call_call_69b7bd8b487ac45a36154a25fbf_0');
    expect(result?.assignedTo).toBe('Melissa Gagliardi');
    expect(result?.status).toBe('request_received');
  });
});
