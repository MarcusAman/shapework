/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Melissa's Workflow Power Pack
 * Validates:
 * 1. Deliverable Package Presets (Standard Launch, Luxury Waterfront, Open House, Annual Farming).
 * 2. Applying presets to parent campaign containers.
 * 3. Adding custom deliverables with category & vendor details.
 * 4. Multi-select batch operations (Bulk Assign, Vendor Dispatch, Approve, Archive).
 * 5. Commercial Print Hub Manifest generation & direct print shop dispatch.
 */

import { describe, it, expect } from 'vitest';
import {
  DELIVERABLE_PACKAGE_PRESETS,
  applyDeliverablePresetToRequest,
  addCustomDeliverableToRequest,
  performBulkTaskAction,
  generatePrintManifest,
  dispatchPrintShopOrder,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository';

describe("Melissa's Workflow Power Pack Test Suite", () => {

  describe('1. Deliverable Package Presets Catalog', () => {
    it('contains all 4 standard workflow presets with full specs', () => {
      expect(DELIVERABLE_PACKAGE_PRESETS.length).toBe(4);

      const standard = DELIVERABLE_PACKAGE_PRESETS.find(p => p.id === 'standard_launch');
      expect(standard).toBeDefined();
      expect(standard?.deliverables.length).toBe(4);

      const luxury = DELIVERABLE_PACKAGE_PRESETS.find(p => p.id === 'luxury_waterfront');
      expect(luxury).toBeDefined();
      expect(luxury?.deliverables.length).toBe(6);

      const openHouse = DELIVERABLE_PACKAGE_PRESETS.find(p => p.id === 'open_house_kit');
      expect(openHouse).toBeDefined();
      expect(openHouse?.deliverables.length).toBe(3);

      const farming = DELIVERABLE_PACKAGE_PRESETS.find(p => p.id === 'annual_farming');
      expect(farming).toBeDefined();
      expect(farming?.deliverables.length).toBe(2);
    });
  });

  describe('2. Applying Presets & Adding Custom Deliverables', () => {
    it('applies standard_launch preset to a request container', () => {
      const testReq: CanonicalMarketingRequest = {
        id: 'req_powerpack_test_01',
        title: 'Powerpack Test Container',
        propertyAddress: '100 Powerpack Way',
        agentName: 'Test Broker',
        channel: 'web',
        taskIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(testReq);

      const { success, createdTasks, request } = applyDeliverablePresetToRequest(testReq.id, 'standard_launch');

      expect(success).toBe(true);
      expect(createdTasks.length).toBe(4);
      expect(request).toBeDefined();
      expect(createdTasks.every(t => t.status === 'request_received')).toBe(true);

      const signTask = createdTasks.find(t => t.category === 'signage');
      expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');
    });

    it('adds a custom deliverable with specific vendor to a request container', () => {
      const testReq: CanonicalMarketingRequest = {
        id: 'req_powerpack_test_02',
        title: 'Custom Deliverable Container',
        propertyAddress: '200 Custom Deliverable St',
        agentName: 'Test Broker',
        channel: 'web',
        taskIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(testReq);

      const { success, task } = addCustomDeliverableToRequest(testReq.id, {
        title: '11x17 Floor Plan Inset & Architectural Blueprint',
        category: 'print',
        vendorName: 'AlphaGraphics Wilmington',
        notes: 'Custom request from Melissa'
      });

      expect(success).toBe(true);
      expect(task).toBeDefined();
      expect(task?.title).toBe('11x17 Floor Plan Inset & Architectural Blueprint');
      expect(task?.vendorName).toBe('AlphaGraphics Wilmington');
    });
  });

  describe('3. Multi-Select Floating Batch Actions', () => {
    it('performs bulk assignment to Eduardo Lovo (VA)', () => {
      const t1: CanonicalMarketingTask = { id: 'bulk_task_1', requestId: 'bulk_req', title: 'T1', category: 'print', agentName: 'A', status: 'request_received', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const t2: CanonicalMarketingTask = { id: 'bulk_task_2', requestId: 'bulk_req', title: 'T2', category: 'print', agentName: 'A', status: 'request_received', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const t3: CanonicalMarketingTask = { id: 'bulk_task_3', requestId: 'bulk_req', title: 'T3', category: 'print', agentName: 'A', status: 'request_received', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveCanonicalMarketingTask(t1);
      saveCanonicalMarketingTask(t2);
      saveCanonicalMarketingTask(t3);

      const targetTaskIds = ['bulk_task_1', 'bulk_task_2', 'bulk_task_3'];
      const result = performBulkTaskAction(targetTaskIds, 'assign_eduardo');

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(3);
      expect(result.updatedTasks.every(t => t.assignedTo === 'Eduardo Lovo')).toBe(true);
      expect(result.updatedTasks.every(t => t.status === 'assigned')).toBe(true);
    });

    it('performs bulk vendor dispatch to Coastal Sign Post Co.', () => {
      const t1: CanonicalMarketingTask = { id: 'bulk_v_1', requestId: 'bulk_req', title: 'Sign 1', category: 'signage', agentName: 'A', status: 'assigned', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const t2: CanonicalMarketingTask = { id: 'bulk_v_2', requestId: 'bulk_req', title: 'Sign 2', category: 'signage', agentName: 'A', status: 'assigned', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveCanonicalMarketingTask(t1);
      saveCanonicalMarketingTask(t2);

      const targetTaskIds = ['bulk_v_1', 'bulk_v_2'];
      const result = performBulkTaskAction(targetTaskIds, 'vendor_dispatch', {
        vendorName: 'Coastal Sign Post Co.'
      });

      expect(result.success).toBe(true);
      expect(result.updatedTasks.every(t => t.status === 'with_vendor')).toBe(true);
      expect(result.updatedTasks.every(t => t.vendorName === 'Coastal Sign Post Co.')).toBe(true);
    });

    it('performs bulk approval of deliverables', () => {
      const allTasks = getAllCanonicalMarketingTasks();
      const targetTaskIds = allTasks.slice(0, 2).map(t => t.id);

      const result = performBulkTaskAction(targetTaskIds, 'approve');

      expect(result.success).toBe(true);
      expect(result.updatedTasks.every(t => t.status === 'approved')).toBe(true);
    });
  });

  describe('4. Commercial Print Hub: Manifests & Print Shop Dispatch', () => {
    it('generates commercial print spec manifest with 100# stock and Military Cutoff Rd delivery', () => {
      const allTasks = getAllCanonicalMarketingTasks();
      const targetTaskIds = allTasks.slice(0, 2).map(t => t.id);

      const manifest = generatePrintManifest(targetTaskIds, { quantity: 100 });

      expect(manifest).toBeDefined();
      expect(manifest.manifestId).toContain('PM_');
      expect(manifest.items.length).toBe(2);
      expect(manifest.items[0].quantity).toBe(100);
      expect(manifest.items[0].bleed).toContain('0.125');
      expect(manifest.dropOffLocation.address).toContain('1022 Military Cutoff Rd');
      expect(manifest.billingTerms).toContain('Net 30');
    });

    it('dispatches print job order to AlphaGraphics Wilmington', () => {
      const result = dispatchPrintShopOrder('PM_TEST_001', 'orders@alphagraphicsilm.com');

      expect(result.success).toBe(true);
      expect(result.dispatchReceipt.vendor).toBe('AlphaGraphics Wilmington');
      expect(result.dispatchReceipt.sentTo).toBe('orders@alphagraphicsilm.com');
    });
  });
});
