/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: NORA Agentic Architecture & Action Layer
 * Comprehensive tests for Action Registry, Context Engine, Execution Engine,
 * Multi-Step Orchestrator Workflows, Authorization Gates, Verification, and Event Bus.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoraActionRegistry } from '../../server/agent/noraActionRegistry.js';
import { NoraContextEngine } from '../../server/agent/noraContextEngine.js';
import { NoraExecutionEngine } from '../../server/agent/noraExecutionEngine.js';
import { NoraOrchestrator } from '../../server/agent/noraOrchestrator.js';
import { BrokerageEventBus } from '../../server/agent/brokerageEventBus.js';
import { resetCanonicalStoreForTesting } from '../../server/persistence/marketingCampaignsRepository.js';

describe('NORA Agentic Architecture & Brokerage Intelligence Layer', () => {
  const mockDbState: any = {
    auditEvents: [],
    tasks: [],
    marketingCampaigns: []
  };

  beforeEach(() => {
    resetCanonicalStoreForTesting();
    mockDbState.auditEvents = [];
    mockDbState.tasks = [];
    BrokerageEventBus.clearHistoryForTesting();
  });

  describe('1. Action Registry & Permission Scoping', () => {
    it('has all 15 core high-value, safe, controlled actions registered', () => {
      const actions = NoraActionRegistry.listActions();
      expect(actions.length).toBeGreaterThanOrEqual(15);

      const actionNames = actions.map(a => a.name);
      expect(actionNames).toContain('sop.retrieve');
      expect(actionNames).toContain('sop.summarize');
      expect(actionNames).toContain('transaction.inspect');
      expect(actionNames).toContain('contract.extract_dates');
      expect(actionNames).toContain('compliance.check_disclosures');
      expect(actionNames).toContain('compliance.check_trust_deposits');
      expect(actionNames).toContain('task.create');
      expect(actionNames).toContain('task.assign');
      expect(actionNames).toContain('task.list_pending');
      expect(actionNames).toContain('vendor.dispatch_order');
      expect(actionNames).toContain('marketing.generate_collateral');
      expect(actionNames).toContain('bic.request_review');
      expect(actionNames).toContain('roster.lookup');
      expect(actionNames).toContain('notification.send_sms');
      expect(actionNames).toContain('operations.proactive_sweep');
    });

    it('filters available actions based on user role and permissions', () => {
      const agentContext = NoraContextEngine.buildContext({ userRole: 'agent' });
      const availableToAgent = NoraActionRegistry.getAvailableActionsForContext(agentContext).map(a => a.name);
      
      // Agents have read and standard permissions, but lack approve_actions (e.g. sending SMS without approval)
      expect(availableToAgent).toContain('sop.retrieve');
      expect(availableToAgent).toContain('roster.lookup');
      expect(availableToAgent).not.toContain('notification.send_sms');

      const adminContext = NoraContextEngine.buildContext({ userRole: 'admin' });
      const availableToAdmin = NoraActionRegistry.getAvailableActionsForContext(adminContext).map(a => a.name);
      expect(availableToAdmin).toContain('notification.send_sms');
      expect(availableToAdmin).toContain('vendor.dispatch_order');
    });
  });

  describe('2. Context Engine Assembly & Tenant Isolation', () => {
    it('assembles a unified, typed NoraContext with user, role, permissions, and active memory', () => {
      const context = NoraContextEngine.buildContext({
        user: { id: 'dir_jessica_keenan_8', name: 'Jessica Keenan', role: 'agent', email: 'jessica.keenan@nestrealty.com' },
        tenantId: 'tenant_nest_uat',
        workspaceId: 'ws_wilmington',
        sessionMemory: {
          activeContract: {
            propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
            price: 1250000,
            ddFee: 35000,
            emd: 25000
          }
        }
      });

      expect(context.user.name).toBe('Jessica Keenan');
      expect(context.tenantId).toBe('tenant_nest_uat');
      expect(context.workspaceId).toBe('ws_wilmington');
      expect(context.activeTransaction?.propertyAddress).toBe('1104 Arboretum Dr, Wilmington, NC');
      expect(context.activeTransaction?.purchasePrice).toBe(1250000);
      expect(context.permissions.length).toBeGreaterThan(0);
    });
  });

  describe('3. Execution Engine: Authorization, Confirmation Gates & Verification', () => {
    it('blocks unauthorized action execution outside the LLM', async () => {
      // Guest context lacks approve_actions
      const guestContext = NoraContextEngine.buildContext({ userRole: 'guest' });
      const result = await NoraExecutionEngine.executeAction({
        actionName: 'notification.send_sms',
        input: { toPhone: '+12527170595', recipientName: 'Marcus Aman', messageBody: 'Test' },
        context: guestContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('unauthorized');
      expect(result.error).toContain('lacks required permission');
      expect(mockDbState.auditEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('enforces human confirmation gate for HIGH risk actions when unconfirmed', async () => {
      const adminContext = NoraContextEngine.buildContext({ userRole: 'admin' });
      const result = await NoraExecutionEngine.executeAction({
        actionName: 'notification.send_sms',
        input: { toPhone: '+12527170595', recipientName: 'Marcus Aman', messageBody: 'Test dispatch', confirmed: false },
        context: adminContext,
        dbState: mockDbState
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('requires_confirmation');
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationPrompt).toContain('Would you like me to send this SMS');
    });

    it('executes and verifies LOW risk actions with complete audit logging', async () => {
      const context = NoraContextEngine.buildContext({ userRole: 'bic' });
      const result = await NoraExecutionEngine.executeAction({
        actionName: 'contract.extract_dates',
        input: { effectiveDate: '2026-08-20', dueDiligenceDays: 14, propertyAddress: '1104 Arboretum Dr' },
        context,
        dbState: mockDbState
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.data.dueDiligenceExpiration).toContain('5:00 PM EST');
      expect(result.auditMetadata.verified).toBe(true);
      expect(mockDbState.auditEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Multi-Step Orchestrator Workflows', () => {
    it('Workflow 1: "NORA, get this contract ready for Ryan."', async () => {
      const context = NoraContextEngine.buildContext({
        userRole: 'agent',
        sessionMemory: {
          activeContract: { propertyAddress: '1104 Arboretum Dr, Wilmington, NC', price: 1250000 }
        }
      });

      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, get this contract ready for Ryan.',
        userRole: 'agent',
        context,
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('get_contract_ready_for_bic');
      expect(response.executedActions.length).toBeGreaterThanOrEqual(4);

      // Verify specific actions were executed in sequence
      const actionNames = response.executedActions.map(a => a.actionName);
      expect(actionNames).toContain('transaction.inspect');
      expect(actionNames).toContain('contract.extract_dates');
      expect(actionNames).toContain('compliance.check_disclosures');
      expect(actionNames).toContain('bic.request_review');

      expect(response.spokenAnswer).toContain('ready for Ryan\'s review');
      expect(response.displayResponse).toContain('Ryan Crecelius');

      // Verify event was emitted to event bus
      const recentEvents = BrokerageEventBus.getRecentEvents('bic_review_requested');
      expect(recentEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('Workflow 2: "NORA, what needs my attention today?"', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: "NORA, what needs my attention today?",
        userRole: 'bic',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('operational_attention_briefing');
      expect(response.executedActions.length).toBe(3);

      const actionNames = response.executedActions.map(a => a.actionName);
      expect(actionNames).toContain('compliance.check_trust_deposits');
      expect(actionNames).toContain('compliance.check_disclosures');
      expect(actionNames).toContain('task.list_pending');

      expect(response.displayResponse).toContain('Operational Morning Briefing');
    });

    it('Workflow 3: "NORA, onboard this new agent."', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, onboard this new agent.',
        userRole: 'operations_lead',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('agent_onboarding');
      expect(response.executedActions.length).toBeGreaterThanOrEqual(5);

      const actionNames = response.executedActions.map(a => a.actionName);
      expect(actionNames).toContain('sop.retrieve');
      expect(actionNames).toContain('roster.lookup');
      expect(actionNames).toContain('task.create');

      expect(response.displayResponse).toContain('New Broker Onboarding Protocol');
    });

    it('Workflow 4: "NORA, what is holding this transaction up?"', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: "NORA, what's holding this transaction up?",
        userRole: 'agent',
        sessionMemory: {
          activeContract: { propertyAddress: '1104 Arboretum Dr, Wilmington, NC', price: 1250000 }
        },
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('transaction_blocker_analysis');
      expect(response.executedActions.length).toBeGreaterThanOrEqual(3);
      expect(response.displayResponse).toContain('Blocker Analysis');
    });

    it('Workflow 5: "NORA, get me ready for my next step."', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, get me ready for my next step.',
        userRole: 'marketing_coordinator',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('next_step_guidance');
      expect(response.displayResponse).toContain('Next Step Guidance');
    });
  });

  describe('5. Brokerage Event Bus', () => {
    it('publishes events and delivers them to subscribed handlers', async () => {
      let receivedEvent: any = null;

      BrokerageEventBus.subscribe('task_created', (event) => {
        receivedEvent = event;
      });

      const emitted = await BrokerageEventBus.emit({
        type: 'task_created',
        brokerageId: 'nest_realty_wilmington',
        tenantId: 'tenant_nest_uat',
        workspaceId: 'ws_wilmington',
        entityType: 'task',
        entityId: 'task_test_999',
        payload: { title: 'Install Sign Post', assignee: 'Ann Gunn' }
      });

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent.entityId).toBe('task_test_999');
      expect(receivedEvent.payload.assignee).toBe('Ann Gunn');
      expect(emitted.id).toBeDefined();
    });
  });
});
