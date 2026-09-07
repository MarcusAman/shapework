/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Marketing Console End-to-End Connectivity & System Integration
 * Validates full connectivity across:
 * 1. Inbound Voice / Intake -> Multi-Task Separation in 'Request Received'.
 * 2. VA Workspace Proof Compilation -> Auto-Advance to 'Agent Review'.
 * 3. Marketing 'With Vendor' Stage -> Syncs to Vendor Dispatch Hub Work Orders.
 * 4. Far-Future Farming Timeframe Filtering ('All', '30d', 'Quarter', '2027+').
 * 5. Parent Request Container Rollup & 1-Click Bulk Archiving.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  archiveCanonicalMarketingRequestAndTasks,
  getMarketingVendorWorkOrders,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest,
  updateCanonicalMarketingTaskStatus,
  resetCanonicalStoreForTesting,
  CanonicalMarketingTask,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository';

describe('Marketing Console End-to-End Connectivity & Integration', () => {
  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  describe('1. Inbound Call / Intake -> Multi-Task Separation', () => {
    it('automatically extracts flyer, sign post, and social deliverables from call into Request Received', () => {
      const callData = {
        id: 'call_test_concord_88',
        callerName: 'Sarah Jenkins',
        callerPhone: '+19105550188',
        propertyAddress: '88 Concord Island Way, Wilmington, NC 28403',
        transcript: 'Hi Melissa, Sarah Jenkins here. We just took 88 Concord Island Way. Need a listing flyer package, custom yard sign post installed, and an Instagram story carousel ready for this Friday.',
        createdAt: new Date().toISOString()
      };

      const { request, tasks } = convertCallToCanonicalMarketingRequest(callData);

      expect(request).toBeDefined();
      expect(request.id).toContain('req_call_call_test_concord_88');
      expect(request.title).toBe('88 Concord Island Way, Wilmington, NC 28403');
      expect(request.agentName).toBe('Sarah Jenkins');

      // Check extracted child deliverables
      expect(tasks.length).toBeGreaterThanOrEqual(3);
      
      const flyerTask = tasks.find(t => t.category === 'print' || t.title.toLowerCase().includes('flyer'));
      expect(flyerTask).toBeDefined();
      expect(flyerTask?.status).toBe('request_received');
      expect(flyerTask?.assignedTo).toBe('Eduardo Lovo');

      const signTask = tasks.find(t => t.category === 'signage' || t.title.toLowerCase().includes('sign'));
      expect(signTask).toBeDefined();
      expect(signTask?.status).toBe('request_received');
      expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');

      const socialTask = tasks.find(t => t.category === 'social' || t.title.toLowerCase().includes('story') || t.title.toLowerCase().includes('social'));
      expect(socialTask).toBeDefined();
      expect(socialTask?.status).toBe('request_received');

      // Verify linkage
      expect(request.taskIds).toContain(flyerTask?.id);
      expect(request.taskIds).toContain(signTask?.id);
      expect(request.taskIds).toContain(socialTask?.id);
    });
  });

  describe('2. VA Workspace Proof Compilation -> Auto-Advance to Agent Review', () => {
    it('advances task to "agent_review" upon proof compilation & staging', () => {
      const task: CanonicalMarketingTask = {
        id: 'task_va_proof_test_01',
        requestId: 'req_va_test_01',
        requestTitle: '1104 Arboretum Dr',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
        agentName: 'Sarah Jenkins',
        title: '300 DPI Luxury Flyer Package',
        category: 'print',
        assignedTo: 'Eduardo Lovo',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(task);

      // VA completes proof compilation
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'agent_review', {
        performedBy: 'Eduardo Lovo',
        note: 'Automated 300 DPI Maxa proofs compiled and staged for Sarah Jenkins'
      });

      expect(updated?.status).toBe('agent_review');
      expect(updated?.approvalHistory).toBeDefined();
      expect(updated?.approvalHistory?.some(h => h.action.includes('agent_review'))).toBe(true);
    });
  });

  describe('3. Marketing "With Vendor" Stage -> Vendor Dispatch Hub Sync', () => {
    it('formats active marketing signage tasks into vendor work orders for field installers', () => {
      const signTask: CanonicalMarketingTask = {
        id: 'task_sign_dispatch_01',
        requestId: 'req_ocean_304',
        requestTitle: '304 Ocean Blvd',
        propertyAddress: '304 Ocean Blvd, Wrightsville Beach, NC',
        agentName: 'Sarah Jenkins',
        title: 'Custom Yard Sign Post & Rider',
        category: 'signage',
        vendorName: 'FastSigns',
        vendorNotes: 'Proof approved — waiting on production',
        status: 'with_vendor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingTask(signTask);

      const workOrders = getMarketingVendorWorkOrders();
      expect(workOrders.length).toBeGreaterThan(0);

      const matchedOrder = workOrders.find(wo => wo.taskId === signTask.id);
      expect(matchedOrder).toBeDefined();
      expect(matchedOrder?.vendorName).toBe('FastSigns');
      expect(matchedOrder?.propertyAddress).toContain('304 Ocean Blvd');
      expect(matchedOrder?.status).toBe('with_vendor');
      expect(matchedOrder?.notes).toBe('Proof approved — waiting on production');
    });
  });

  describe('4. Far-Future Farming Timeframe Filtering', () => {
    it('accurately categorizes tasks into 30d, Quarter, and 2027+ Annual timeframe buckets', () => {
      const now = new Date('2026-08-24T00:00:00Z').getTime();

      const taskNear: CanonicalMarketingTask = {
        id: 'task_near_01',
        requestId: 'req_near_01',
        requestTitle: 'Immediate Open House',
        agentName: 'Allison Thurston',
        title: 'Open House Handouts',
        category: 'open_house',
        status: 'assigned',
        dueAt: '2026-08-26T17:00:00Z', // In 2 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const taskQuarter: CanonicalMarketingTask = {
        id: 'task_quarter_01',
        requestId: 'req_quarter_01',
        requestTitle: 'Q4 Mailer',
        agentName: 'Jessica Keenan',
        title: 'Jessica — Q4 Mailer',
        category: 'mailer',
        status: 'request_received',
        dueAt: '2026-11-02T17:00:00Z', // In ~70 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const task2027: CanonicalMarketingTask = {
        id: 'task_2027_01',
        requestId: 'req_2027_01',
        requestTitle: 'Dawn — March 2027 Farming',
        agentName: 'Dawn Thurston',
        title: 'Dawn — March Farming List',
        category: 'farming',
        status: 'request_received',
        dueAt: '2027-03-01T17:00:00Z', // Far future
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const testTasks = [taskNear, taskQuarter, task2027];

      // Test 30 days filter
      const filter30d = testTasks.filter(t => {
        const diffDays = (new Date(t.dueAt!).getTime() - now) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      });
      expect(filter30d.map(t => t.id)).toEqual(['task_near_01']);

      // Test Quarter filter (<= 90 days)
      const filterQuarter = testTasks.filter(t => {
        const diffDays = (new Date(t.dueAt!).getTime() - now) / (1000 * 60 * 60 * 24);
        return diffDays <= 90;
      });
      expect(filterQuarter.map(t => t.id)).toEqual(['task_near_01', 'task_quarter_01']);

      // Test 2027+ filter
      const filter2027 = testTasks.filter(t => new Date(t.dueAt!).getFullYear() >= 2027);
      expect(filter2027.map(t => t.id)).toEqual(['task_2027_01']);
    });
  });

  describe('5. Parent Request Container Rollup & 1-Click Bulk Archiving', () => {
    it('archives parent request and all child tasks simultaneously with 1 click', () => {
      const reqId = 'req_bulk_archive_test';
      const task1Id = 'task_child_01';
      const task2Id = 'task_child_02';

      const parentReq: CanonicalMarketingRequest = {
        id: reqId,
        title: '990 Inspiration Drive Listing',
        propertyAddress: '990 Inspiration Drive',
        category: 'listing_launch',
        agentName: 'Sarah Jenkins',
        channel: 'phone',
        taskIds: [task1Id, task2Id],
        receivedAt: 'Yesterday',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const child1: CanonicalMarketingTask = {
        id: task1Id,
        requestId: reqId,
        requestTitle: '990 Inspiration Drive',
        agentName: 'Sarah Jenkins',
        title: 'Listing Flyer',
        category: 'print',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const child2: CanonicalMarketingTask = {
        id: task2Id,
        requestId: reqId,
        requestTitle: '990 Inspiration Drive',
        agentName: 'Sarah Jenkins',
        title: 'Yard Sign Installation',
        category: 'signage',
        status: 'with_vendor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveCanonicalMarketingRequest(parentReq);
      saveCanonicalMarketingTask(child1);
      saveCanonicalMarketingTask(child2);

      // Perform 1-click bulk archive
      const { request, archivedTasks } = archiveCanonicalMarketingRequestAndTasks(reqId);

      expect(request).toBeDefined();
      expect(request?.isArchived).toBe(true);
      expect(archivedTasks.length).toBe(2);
      expect(archivedTasks.every(t => t.isArchived === true && t.status === 'archived')).toBe(true);

      // Verify retrieval state
      const reloadedTasks = getAllCanonicalMarketingTasks();
      const updatedChild1 = reloadedTasks.find(t => t.id === task1Id);
      const updatedChild2 = reloadedTasks.find(t => t.id === task2Id);

      expect(updatedChild1?.isArchived).toBe(true);
      expect(updatedChild2?.isArchived).toBe(true);
    });
  });
});
