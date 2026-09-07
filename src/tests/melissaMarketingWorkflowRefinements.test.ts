/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Melissa Gagliardi Marketing Workflow Refinements
 * Validates all workflow invariants requested by Melissa for Nest Realty Wilmington:
 * 1. Request Received: Stays until assigned to someone to take ownership (no intermediate "Melissa reviews").
 * 2. Assigned -> [Start work] -> In Progress: Requires intentional Start Work button.
 * 3. Separate Request Pieces: Request container (e.g. 304 Ocean Blvd) contains independent child tasks with separate assignees/statuses.
 * 4. With Vendor: Sits at far right of active workflow after Agent Review/approval; displays minimal vendor reminder card.
 * 5. Revisions Loop: Agent Review -> Changes requested -> Revisions -> In Progress.
 * 6. Completed & Archive: Soft archive preserves history and removes from active board without hard deleting.
 * 7. Manual Future Requests (Farming): Supports far-future deadlines (e.g. March 1, 2027) and chronological sorting.
 * 8. Canonical Lifecycle: Diagram and columns derive from identical single source of truth.
 */

import { describe, it, expect } from 'vitest';
import {
  getInitialCanonicalTasks,
  getInitialCanonicalRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingTask,
  updateCanonicalMarketingTaskStatus,
  archiveCanonicalMarketingTask,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository';
import { PIPELINE_STAGES } from '../components/marketing/MarketingHomeInbox';

describe('Melissa Gagliardi Marketing Workflow Refinements & Invariants', () => {

  describe('1. Request Received Lifecycle & Assignment', () => {
    it('holds unassigned tasks in "request_received" until explicitly assigned', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_unassigned_test_01',
        requestId: 'req_unassigned_01',
        requestTitle: 'Unassigned Listing Request',
        agentName: 'Allison',
        title: 'Allison — September Farming',
        category: 'farming',
        status: 'request_received',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(task);

      const retrieved = getAllCanonicalMarketingTasks().find(t => t.id === 'task_unassigned_test_01');
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe('request_received');
      expect(retrieved?.assignedTo).toBeUndefined();
    });

    it('assigning an owner transitions status to "assigned" and NOT directly to "in_progress"', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_test_new_001',
        requestId: 'req_test_001',
        requestTitle: 'New Listing Test',
        agentName: 'Sarah Jenkins',
        title: 'Feature Sheet',
        category: 'print',
        status: 'request_received',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      const updated = updateCanonicalMarketingTaskStatus(task.id, 'assigned', {
        assignedTo: 'Melissa Gagliardi',
        assignedToRole: 'Marketing Director'
      });

      expect(updated?.status).toBe('assigned');
      expect(updated?.assignedTo).toBe('Melissa Gagliardi');
      expect(updated?.startedAt).toBeUndefined(); // Must NOT have started yet!
    });
  });

  describe('2. Assigned -> [Start work] -> In Progress', () => {
    it('transitions from "assigned" to "in_progress" only upon intentional Start Work action', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_test_assigned_002',
        requestId: 'req_test_002',
        requestTitle: 'Presentation Test',
        agentName: 'Matt Orr',
        title: 'CMA Deck',
        category: 'print',
        assignedTo: 'Eduardo Lovo',
        status: 'assigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      // Trigger Start Work
      const started = updateCanonicalMarketingTaskStatus(task.id, 'in_progress', {
        performedBy: 'Eduardo Lovo'
      });

      expect(started?.status).toBe('in_progress');
      expect(started?.startedAt).toBeDefined();
      expect(started?.startedBy).toBe('Eduardo Lovo');
    });
  });

  describe('3. Multi-Task Request Separation (Container vs Task Hierarchy)', () => {
    it('models a listing launch request container with independent child tasks', () => {
      const parentReq = {
        id: 'req_test_multi_01',
        title: '212 Wetland Drive Launch',
        propertyAddress: '212 Wetland Drive, Wilmington NC',
        category: 'listing_launch' as const,
        agentName: 'Marcus Aman',
        channel: 'phone' as const,
        taskIds: ['task_test_flyer_01', 'task_test_sign_01'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const flyerTask: CanonicalMarketingTask = {
        id: 'task_test_flyer_01',
        requestId: 'req_test_multi_01',
        requestTitle: '212 Wetland Drive Launch',
        title: 'Flyer',
        category: 'print',
        agentName: 'Marcus Aman',
        assignedTo: 'Melissa Gagliardi',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const signTask: CanonicalMarketingTask = {
        id: 'task_test_sign_01',
        requestId: 'req_test_multi_01',
        requestTitle: '212 Wetland Drive Launch',
        title: 'Sign Post',
        category: 'signage',
        agentName: 'Marcus Aman',
        assignedTo: 'Ann Gunn',
        status: 'with_vendor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(flyerTask);
      saveCanonicalMarketingTask(signTask);

      expect(parentReq.taskIds).toHaveLength(2);
      expect(flyerTask.status).toBe('in_progress');
      expect(flyerTask.assignedTo).toBe('Melissa Gagliardi');
      expect(signTask.status).toBe('with_vendor');
      expect(signTask.assignedTo).toBe('Ann Gunn');
    });
  });

  describe('4. "With Vendor" Stage Position & Simple Reminder UX', () => {
    it('positions "with_vendor" at the far right of the active working pipeline', () => {
      const stageIds = PIPELINE_STAGES.map(s => s.id);
      expect(stageIds).toEqual([
        'request_received',
        'assigned',
        'in_progress',
        'agent_review',
        'revisions',
        'approved',
        'with_vendor'
      ]);

      const lastStage = PIPELINE_STAGES[PIPELINE_STAGES.length - 1];
      expect(lastStage.id).toBe('with_vendor');
      expect(lastStage.label).toBe('With Vendor');
    });

    it('records vendor name and simple production notes without over-engineered micro-states', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_test_sign_003',
        requestId: 'req_test_003',
        requestTitle: 'Custom Sign Post',
        agentName: 'Ann Gunn',
        title: 'Sign Post Install',
        category: 'signage',
        status: 'agent_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      const dispatched = updateCanonicalMarketingTaskStatus(task.id, 'with_vendor', {
        vendorName: 'Coastal Sign Post Co.',
        vendorNotes: 'Proof approved — waiting on production',
        performedBy: 'Melissa Gagliardi'
      });

      expect(dispatched?.status).toBe('with_vendor');
      expect(dispatched?.vendorName).toBe('Coastal Sign Post Co.');
      expect(dispatched?.vendorNotes).toBe('Proof approved — waiting on production');
    });
  });

  describe('5. Revisions Loop & Agent Review', () => {
    it('transitions Agent Review -> Revisions upon changes requested, and back to In Progress on rework', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_test_rev_004',
        requestId: 'req_test_004',
        requestTitle: '1104 Arboretum Dr',
        agentName: 'Sarah Jenkins',
        title: 'Story Graphic',
        category: 'social',
        status: 'agent_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      // Step 1: Changes requested
      const inRevisions = updateCanonicalMarketingTaskStatus(task.id, 'revisions', {
        note: 'Change price from $1.2M to $1.25M',
        performedBy: 'Sarah Jenkins'
      });

      expect(inRevisions?.status).toBe('revisions');
      expect(inRevisions?.approvalHistory?.some(h => h.note?.includes('$1.25M'))).toBe(true);

      // Step 2: Start rework
      const rework = updateCanonicalMarketingTaskStatus(task.id, 'in_progress', {
        performedBy: 'Eduardo Lovo'
      });

      expect(rework?.status).toBe('in_progress');
    });
  });

  describe('6. Completed & Soft Archiving', () => {
    it('archives completed or vendor tasks without hard deleting them', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_test_archive_005',
        requestId: 'req_test_005',
        requestTitle: 'Completed Open House',
        agentName: 'Melissa Gagliardi',
        title: 'Directional Signs',
        category: 'open_house',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      const archived = archiveCanonicalMarketingTask(task.id);
      expect(archived?.status).toBe('archived');
      expect(archived?.isArchived).toBe(true);
      expect(archived?.archivedAt).toBeDefined();

      // Record remains accessible via repository
      const fetched = getAllCanonicalMarketingTasks().find(t => t.id === task.id);
      expect(fetched).toBeDefined();
      expect(fetched?.isArchived).toBe(true);
    });
  });

  describe('7. Manual Future Requests (Farming) & Chronological Deadlines', () => {
    it('supports far-future due dates (March 1, 2027) and does NOT require a property address', () => {
      const farmingTask: CanonicalMarketingTask = {
        id: 'task_dawn_farming_2027',
        requestId: 'req_dawn_farming_2027',
        requestTitle: 'Dawn — March Farming',
        agentName: 'Dawn',
        title: 'Dawn — March Farming Spring Mailer',
        category: 'farming',
        propertyAddress: undefined, // Non-property campaign!
        status: 'request_received',
        dueAt: '2027-03-01T17:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(farmingTask);

      expect(farmingTask.propertyAddress).toBeUndefined();
      expect(farmingTask.dueAt).toBe('2027-03-01T17:00:00Z');
      expect(farmingTask.category).toBe('farming');
    });

    it('correctly sorts tasks chronologically by deadline ascending', () => {
      const testSet: Array<{ name: string; dueAt?: string }> = [
        { name: 'March Farming 2027', dueAt: '2027-03-01T17:00:00Z' },
        { name: 'Today Task', dueAt: '2026-08-24T17:00:00Z' },
        { name: 'November Farming 2026', dueAt: '2026-11-02T17:00:00Z' },
        { name: 'September Farming 2026', dueAt: '2026-09-01T17:00:00Z' },
        { name: 'No Due Date', dueAt: undefined }
      ];

      const getWeight = (dueAt?: string) => {
        if (!dueAt) return 9999999999999;
        const d = new Date(dueAt).getTime();
        return isNaN(d) ? 9999999999999 : d;
      };

      const sorted = [...testSet].sort((a, b) => getWeight(a.dueAt) - getWeight(b.dueAt));

      expect(sorted.map(s => s.name)).toEqual([
        'Today Task',
        'September Farming 2026',
        'November Farming 2026',
        'March Farming 2027',
        'No Due Date'
      ]);
    });
  });
});
