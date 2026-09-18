/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Operational Intake & Routing Engine
 * Verifies that operational requests (office supplies, restock, signs/riders, lockboxes,
 * room reservations, vendor maintenance) route to Ann Gunn (dir_ann_gunn_28) with
 * review owner Ryan Crecelius (dir_ryan_crecelius_6) under published policy pol_ws_wilmington_v17.
 * Also verifies deduplication prevents duplicate tasks for repeat supply calls.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository';
import { canonicalTaskRoutingService, evaluateRoutingDecision } from '../../server/services/canonicalTaskRoutingService';

describe('Operational Intake & Routing Suite (pol_ws_wilmington_v17)', () => {
  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  describe('1. Office Supplies & Restock Intake (Rule 13)', () => {
    it('creates a task assigned to Ann Gunn (dir_ann_gunn_28) for Mayfaire office drinks restock', () => {
      const callPayload = {
        id: 'call_821467a1654aa6f937daea2cbb3',
        callerName: 'Matt Orr',
        fromNumber: '+19106128283',
        propertyAddress: 'Mayfaire Office, Wilmington NC',
        durationSeconds: 49,
        transcript: 'Matt: Hey Nora, can you let Ann know we need more drinks at the Mayfaire office? Some soda and water bottles in the fridge.\nNora: Absolutely Matt, I will make sure Ann Gunn gets the note to restock the drinks at Mayfaire.',
        summary: 'Caller requested Mayfaire office drinks and water bottles restock for Ann Gunn.'
      };

      const result = convertCallToCanonicalMarketingRequest(callPayload);

      expect(result.shouldCreate).toBe(true);
      expect(result.suppressed).toBe(false);
      expect(result.request).toBeDefined();
      expect(result.tasks.length).toBe(1);

      const task = result.tasks[0];
      expect(task.title).toContain('Office Bottled Water');
      expect(task.assignedTo).toBe('Ann Gunn');
      expect(task.category).toBe('operations');
      expect(task.routingRuleId).toBe('rule_pub_14_office_supplies');
      expect(task.assignedToId).toBe('dir_ann_gunn_28');
      expect(task.reviewOwnerId).toBe('dir_ryan_crecelius_6');

      const allTasks = getAllCanonicalMarketingTasks();
      expect(allTasks.some(t => t.id === task.id)).toBe(true);
    });

    it('deduplicates a subsequent call for the same office supply without creating duplicate tasks', () => {
      // First call from Matt Orr
      const call1 = {
        id: 'call_supplies_1',
        callerName: 'Matt Orr',
        fromNumber: '+19106128283',
        propertyAddress: 'Mayfaire Office, Wilmington NC',
        durationSeconds: 30,
        transcript: 'Matt: We are completely out of bottled water in the Mayfaire breakroom.',
        summary: 'Mayfaire breakroom bottled water restock requested.'
      };
      const result1 = convertCallToCanonicalMarketingRequest(call1);
      expect(result1.shouldCreate).toBe(true);
      expect(result1.tasks.length).toBe(1);
      const initialTaskId = result1.tasks[0].id;

      // Second call from Sarah Jenkins for the same supplies at Mayfaire
      const call2 = {
        id: 'call_supplies_2',
        callerName: 'Sarah Jenkins',
        fromNumber: '+19105550188',
        propertyAddress: 'Mayfaire Office, Wilmington NC',
        durationSeconds: 25,
        transcript: 'Sarah: Hey Nora, just checking if anyone ordered water bottles for the Mayfaire office?',
        summary: 'Sarah asking to confirm water bottles restock for Mayfaire.'
      };
      const result2 = convertCallToCanonicalMarketingRequest(call2);
      expect(result2.shouldCreate).toBe(false); // Consolidated!
      expect(result2.suppressed).toBe(true);
      expect(result2.suppressionReason).toBe('DEDUPLICATED_INTO_EXISTING_RESTOCK_ORDER');

      // Verify task count did not increase
      const allTasks = getAllCanonicalMarketingTasks();
      const mayfaireTasks = allTasks.filter(t => t.category === 'operations' || t.title.includes('Mayfaire') || t.title.includes('Water'));
      expect(mayfaireTasks.length).toBe(1);
      expect(mayfaireTasks[0].id).toBe(initialTaskId);
    });
  });

  describe('2. Canonical Routing Service Resolution under pol_ws_wilmington_v17', () => {
    it('routes Yard Sign / Rider requests to Ann Gunn under Rule 11 with SLA 24h', () => {
      const routing = canonicalTaskRoutingService.resolveRoutingSync({
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        category: 'signage',
        deliverableType: 'yard_sign',
        propertyAddress: '1916 Walcott Ave, Wilmington NC'
      });

      expect(routing.matchedRuleId).toBe('rule_pub_12_signs___riders');
      expect(routing.assigneeStaffId).toBe('dir_ann_gunn_28');
      expect(routing.assigneeName).toBe('Ann Gunn');
      expect(routing.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
      expect(routing.reviewOwnerName).toBe('Ryan Crecelius');
      expect(routing.governingSopId).toBe('sop_sign_vendor_004');
      expect(routing.slaHours).toBe(24);
      expect(routing.routingState).toBe('resolved');
    });

    it('routes Lockbox / Key requests to Ann Gunn under Rule 12 with SLA 12h', () => {
      const routing = canonicalTaskRoutingService.resolveRoutingSync({
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        category: 'lockbox',
        deliverableType: 'lockbox_install',
        propertyAddress: '104 S Lumina Ave, Wrightsville Beach NC'
      });

      expect(routing.matchedRuleId).toBe('rule_pub_13_lockboxes___keys');
      expect(routing.assigneeStaffId).toBe('dir_ann_gunn_28');
      expect(routing.assigneeName).toBe('Ann Gunn');
      expect(routing.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
      expect(routing.slaHours).toBe(12);
      expect(routing.routingState).toBe('resolved');
    });

    it('routes Room Reservation requests to Ann Gunn under Rule 14 with SLA 2h', () => {
      const routing = canonicalTaskRoutingService.resolveRoutingSync({
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        category: 'room_reservation',
        deliverableType: 'conference_room',
        propertyAddress: 'Mayfaire Boardroom'
      });

      expect(routing.matchedRuleId).toBe('rule_pub_15_room_reservation');
      expect(routing.assigneeStaffId).toBe('dir_ann_gunn_28');
      expect(routing.assigneeName).toBe('Ann Gunn');
      expect(routing.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
      expect(routing.slaHours).toBe(2);
      expect(routing.routingState).toBe('resolved');
    });

    it('routes Vendor / Maintenance requests to Ann Gunn under Rule 15 with SLA 24h', () => {
      const routing = canonicalTaskRoutingService.resolveRoutingSync({
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        category: 'vendor_maintenance',
        deliverableType: 'hvac_repair',
        propertyAddress: 'Downtown Office Suite 200'
      });

      expect(routing.matchedRuleId).toBe('rule_pub_16_vendor___maintenance');
      expect(routing.assigneeStaffId).toBe('dir_ann_gunn_28');
      expect(routing.assigneeName).toBe('Ann Gunn');
      expect(routing.reviewOwnerStaffId).toBe('dir_ryan_crecelius_6');
      expect(routing.slaHours).toBe(24);
      expect(routing.routingState).toBe('resolved');
    });

    it('routes Flyer / Marketing Collateral requests to Eduardo Lovo under Rule 8', () => {
      const routing = canonicalTaskRoutingService.resolveRoutingSync({
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        category: 'print',
        deliverableType: 'flyer',
        propertyAddress: '307 Wrightsville Ave, Wilmington NC'
      });

      expect(routing.matchedRuleId).toBe('rule_pub_8_marketing_request');
      expect(routing.assigneeName).toBe('Eduardo Lovo');
      expect(routing.reviewOwnerName).toBe('Melissa Gagliardi');
      expect(routing.slaHours).toBe(24);
      expect(routing.routingState).toBe('resolved');
    });
  });

  describe('3. Dynamic Policy-Driven Routing Without Hardcoded Routing Authority', () => {
    it('resolves routing dynamically from active workspace policy without hardcoding Ann, Ryan, Eduardo, Melissa, v17, or numbered rule IDs', () => {
      // Define a custom policy object with version 99, custom rule IDs, and different staff assignments
      const isolatedPolicy = {
        id: 'pol_custom_isolated_v99',
        workspace_id: 'ws_wilmington',
        version: 99,
        status: 'published' as const,
        published_at: '2026-09-07T12:00:00.000Z',
        published_by_staff_id: 'dir_ryan_crecelius_6',
        rules: []
      };

      const isolatedRules = [
        {
          id: 'rule_custom_supplies_999',
          policy_id: 'pol_custom_isolated_v99',
          category: 'office supplies',
          display_name: 'Dynamic Consumables & Office Supplies',
          primary_staff_id: 'dir_melissa_gagliardi_33', // Reassigned to Melissa Gagliardi instead of Ann Gunn
          primary_role_id: 'role_marketing_ops',
          review_staff_id: 'dir_eduardo_lovo_73', // Reviewer reassigned to Eduardo Lovo instead of Ryan Crecelius
          review_role_id: 'role_production_designer',
          governing_sop_id: null,
          sla_hours: 6,
          sla_display: '6 hours',
          status: 'active' as const,
          match_keywords: ['office supplies', 'restock', 'water', 'drinks']
        }
      ];

      const input = {
        workspaceId: 'ws_wilmington',
        channel: 'phone' as const,
        category: 'operations',
        deliverableType: 'water_bottles_and_soda_restock',
        propertyAddress: 'Mayfaire Office, Wilmington NC'
      };

      // Evaluate routing purely against this isolated policy snapshot without touching production policy
      const decision = evaluateRoutingDecision(input, { policy: isolatedPolicy, rules: isolatedRules });

      expect(decision.routingState).toBe('resolved');
      expect(decision.routingPolicyId).toBe('pol_custom_isolated_v99');
      expect(decision.ruleVersion).toBe(99);
      expect(decision.matchedRuleId).toBe('rule_custom_supplies_999');
      // Proves dynamic assignment: Assigned to Melissa Gagliardi because the policy says so, NOT Ann Gunn
      expect(decision.assigneeStaffId).toBe('dir_melissa_gagliardi_33');
      expect(decision.assigneeName).toBe('Melissa Gagliardi');
      // Proves dynamic reviewer: Review owner is Eduardo Lovo because the policy says so, NOT Ryan Crecelius
      expect(decision.reviewOwnerStaffId).toBe('dir_eduardo_lovo_73');
      expect(decision.reviewOwnerName).toBe('Eduardo Lovo');
      // Proves dynamic SLA
      expect(decision.slaHours).toBe(6);
    });
  });
});

