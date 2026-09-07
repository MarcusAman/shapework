/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Final Pilot Safety Check Test Suite
 * Rigorous validation of:
 * 1. Zero Demo / Fixture Leakage in Production Logic
 * 2. Record-Level Transaction Authorization (Agent vs Leadership)
 * 3. High-Risk Action Durability (PostgreSQL / JSONL Ledger)
 * 4. Persistent Idempotency Across Simulated Process Restarts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoraActionRegistry } from '../../server/agent/noraActionRegistry.js';
import { NoraContextEngine } from '../../server/agent/noraContextEngine.js';
import { NoraExecutionEngine } from '../../server/agent/noraExecutionEngine.js';
import { NoraIdempotencyEngine } from '../../server/agent/noraIdempotencyEngine.js';
import { NoraDurableActionLedger } from '../../server/agent/noraDurableActionLedger.js';
import { resetCanonicalStoreForTesting } from '../../server/persistence/marketingCampaignsRepository.js';

describe('NORA Final Pilot Safety Check Suite', () => {
  const mockDbState: any = {
    auditEvents: [],
    tasks: []
  };

  beforeEach(() => {
    resetCanonicalStoreForTesting();
    NoraIdempotencyEngine.clearForTesting();
    NoraDurableActionLedger.clearForTesting();
    mockDbState.auditEvents = [];
    mockDbState.tasks = [];
  });

  describe('1. Zero Demo / Fixture Leakage in Production Logic', () => {
    it('does not fall back to 1104 Arboretum Dr when transaction.inspect is called without an address', async () => {
      const context = NoraContextEngine.buildContext({
        userRole: 'agent',
        sessionMemory: {}
      });

      const result = await NoraExecutionEngine.executeAction({
        actionName: 'transaction.inspect',
        input: {},
        context,
        dbState: mockDbState
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing property address');
    });

    it('does not fabricate prices or addresses in activeTransaction builder when sessionMemory is empty', () => {
      const context = NoraContextEngine.buildContext({
        userRole: 'agent',
        sessionMemory: {}
      });

      expect(context.activeTransaction).toBeUndefined();
    });
  });

  describe('2. Record-Level Transaction Authorization', () => {
    it('allows an agent to inspect their own assigned listing', async () => {
      const sarahContext = NoraContextEngine.buildContext({
        user: { name: 'Sarah Jenkins', role: 'agent', email: 'sarah@nestrealty.com' }
      });

      const result = await NoraExecutionEngine.executeAction({
        actionName: 'transaction.inspect',
        input: { propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405' },
        context: sarahContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.data.listingAgent).toContain('Sarah Jenkins');
    });

    it('blocks an agent from inspecting another agent\'s private listing (Carter Vance)', async () => {
      const sarahContext = NoraContextEngine.buildContext({
        user: { name: 'Sarah Jenkins', role: 'agent', email: 'sarah@nestrealty.com' }
      });

      // 702 S Lumina Ave is listed by Carter Vance
      const result = await NoraExecutionEngine.executeAction({
        actionName: 'transaction.inspect',
        input: { propertyAddress: '702 S Lumina Ave, Wrightsville Beach, NC 28480' },
        context: sarahContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('unauthorized');
      expect(result.error).toContain('Record-level authorization denied');
      expect(result.humanReadableSummary).toContain('You are not listed as an assigned agent');
    });

    it('allows BIC / Leadership roles full office-wide visibility across all deals', async () => {
      const ryanBicContext = NoraContextEngine.buildContext({
        user: { name: 'Ryan Crecelius', role: 'bic', email: 'ryan@nestrealty.com' }
      });

      // BIC inspects Carter Vance's listing at 702 S Lumina Ave
      const result = await NoraExecutionEngine.executeAction({
        actionName: 'transaction.inspect',
        input: { propertyAddress: '702 S Lumina Ave, Wrightsville Beach, NC 28480' },
        context: ryanBicContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.data.propertyAddress).toContain('702 S Lumina Ave');
    });

    it('scopes compliance disclosure checks to agent\'s assigned files only', async () => {
      const sarahContext = NoraContextEngine.buildContext({
        user: { name: 'Sarah Jenkins', role: 'agent', email: 'sarah@nestrealty.com' }
      });

      const result = await NoraExecutionEngine.executeAction({
        actionName: 'compliance.check_disclosures',
        input: {},
        context: sarahContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(true);
      // All returned records must be Sarah's listings
      for (const record of result.data.records) {
        expect(record.listingAgent).toContain('Sarah Jenkins');
      }
    });
  });

  describe('3. High-Risk Durability & Persistent Idempotency Across Restarts', () => {
    it('persists HIGH-risk actions to the durable ledger and blocks duplicate dispatches across process restarts', async () => {
      const adminContext = NoraContextEngine.buildContext({
        user: { name: 'Ann Gunn', role: 'operations_lead', email: 'ann@nestrealty.com' }
      });

      const orderInput = {
        vendorName: 'Coastal Sign Post Co.',
        propertyAddress: '312 Mayfaire Way, Wilmington, NC',
        serviceType: 'Sign Post & Rider',
        confirmed: true
      };

      // 1. First Execution
      const firstResult = await NoraExecutionEngine.executeAction({
        actionName: 'vendor.dispatch_order',
        input: orderInput,
        context: adminContext,
        dbState: mockDbState
      });

      expect(firstResult.success).toBe(true);
      expect(firstResult.status).toBe('completed');
      expect(firstResult.idempotencyKey).toBeDefined();

      // 2. SIMULATE PROCESS / CONTAINER RESTART: Clear fast in-memory runtime cache
      NoraIdempotencyEngine.clearForTesting();

      // Verify that runtime memory cache is now empty
      expect(NoraIdempotencyEngine.getCachedResult(firstResult.idempotencyKey!)).toBeNull();

      // 3. Second Execution Attempt (Post-Restart)
      const secondResult = await NoraExecutionEngine.executeAction({
        actionName: 'vendor.dispatch_order',
        input: orderInput,
        context: adminContext,
        dbState: mockDbState
      });

      // The durable persistent ledger must intercept and return the replay without re-dispatching
      expect(secondResult.success).toBe(true);
      expect(secondResult.humanReadableSummary).toContain('Persistent idempotent replay');
    });

    it('allows separate SMS messages with different contents to be sent without false duplicate blocking', async () => {
      const adminContext = NoraContextEngine.buildContext({ userRole: 'admin' });

      // First SMS
      const firstSMS = await NoraExecutionEngine.executeAction({
        actionName: 'notification.send_sms',
        input: {
          toPhone: '+12527170595',
          recipientName: 'Marcus Aman',
          messageBody: 'Initial contract review notice.',
          confirmed: true
        },
        context: adminContext,
        dbState: mockDbState
      });
      expect(firstSMS.success).toBe(true);

      // Second DIFFERENT SMS to same recipient
      const secondSMS = await NoraExecutionEngine.executeAction({
        actionName: 'notification.send_sms',
        input: {
          toPhone: '+12527170595',
          recipientName: 'Marcus Aman',
          messageBody: 'Follow-up: Wire receipt confirmed at First Bank NC.',
          confirmed: true
        },
        context: adminContext,
        dbState: mockDbState
      });

      // Must NOT be blocked by idempotency because messageBody is distinct
      expect(secondSMS.success).toBe(true);
      expect(secondSMS.idempotencyKey).not.toBe(firstSMS.idempotencyKey);
      expect(secondSMS.humanReadableSummary).not.toContain('replay');
    });
  });
});
