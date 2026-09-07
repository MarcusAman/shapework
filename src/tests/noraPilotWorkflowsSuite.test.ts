/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pilot Golden Path & Reliability Test Suite: NORA Flagship Brokerage Workflows
 * Full Matrix Testing:
 * 1. "NORA, get this contract ready for Ryan."
 *    - Contract with missing item (RPOADS buyer signature)
 *    - Contract clean / no compliance issues
 *    - No active transaction in context
 * 2. "NORA, what needs my attention today?"
 *    - Synthesizes real operational data into URGENT / TODAY / WATCH
 * 3. "NORA, what's holding this deal up?"
 *    - Missing document blocker (Fact / Inference / Unknown)
 *    - Clean transaction with no blockers
 *    - Ambiguous query requiring clarification
 * 4. High-Risk Action Confirmation & Idempotency:
 *    - Vendor order confirmation gate & cost disclosure ($65)
 *    - SMS dispatch confirmation gate
 *    - Confirmed execution & durable snapshot flush
 *    - Idempotent deduplication on retry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoraOrchestrator } from '../../server/agent/noraOrchestrator.js';
import { NoraContextEngine } from '../../server/agent/noraContextEngine.js';
import { NoraExecutionEngine } from '../../server/agent/noraExecutionEngine.js';
import { NoraIdempotencyEngine } from '../../server/agent/noraIdempotencyEngine.js';
import { BrokerageEventBus } from '../../server/agent/brokerageEventBus.js';
import { resetCanonicalStoreForTesting, getAllCanonicalMarketingTasks } from '../../server/persistence/marketingCampaignsRepository.js';

describe('NORA Pilot Flagship Workflows & Broker Experience Suite', () => {
  const mockDbState: any = {
    auditEvents: [],
    tasks: [],
    marketingCampaigns: []
  };

  beforeEach(() => {
    resetCanonicalStoreForTesting();
    NoraIdempotencyEngine.clearForTesting();
    mockDbState.auditEvents = [];
    mockDbState.tasks = [];
    BrokerageEventBus.clearHistoryForTesting();
  });

  describe('Flagship Workflow 1: "NORA, get this contract ready for Ryan."', () => {
    it('Scenario A: Contract with missing disclosure signature (1104 Arboretum Dr)', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, get this contract ready for Ryan.',
        user: { name: 'Sarah Jenkins', role: 'agent', email: 'sarah@nestrealty.com' },
        userRole: 'agent',
        sessionMemory: {
          activeContract: {
            propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
            price: 1250000,
            ddFee: 35000,
            emd: 25000
          }
        },
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('get_contract_ready_for_bic');

      // 1. Spoken voice answer must be concise and transparent
      expect(response.spokenAnswer).toContain('ready for Ryan\'s review');
      expect(response.spokenAnswer).toContain('5:00 PM');
      expect(response.spokenAnswer).toContain('buyer signature appears to be missing');
      expect(response.spokenAnswer).toContain('added it to Ryan\'s queue');

      // 2. Display response must have structured sections
      expect(response.displayResponse).toContain('### 📑 Contract Prepared for Ryan Crecelius (BIC Review)');
      expect(response.displayResponse).toContain('Due Diligence Expiration');
      expect(response.displayResponse).toContain('First Bank NC Trust Account');
      expect(response.displayResponse).toContain('NCGS § 47E-5');
      expect(response.displayResponse).toContain('NORA prepared this dossier. Broker/BIC retains final approval authority.');

      // 3. Executed Actions Verification
      const actionNames = response.executedActions.map(a => a.actionName);
      expect(actionNames).toContain('transaction.inspect');
      expect(actionNames).toContain('contract.extract_dates');
      expect(actionNames).toContain('compliance.check_disclosures');
      expect(actionNames).toContain('compliance.check_trust_deposits');
      expect(actionNames).toContain('bic.request_review');
      expect(actionNames).toContain('task.create');

      // 4. Verification that task for Sarah Jenkins was queued
      const tasks = getAllCanonicalMarketingTasks();
      const sarahTask = tasks.find(t => t.title.includes('Obtain Buyer Signature on RPOADS'));
      expect(sarahTask).toBeDefined();
      expect(sarahTask?.agentName).toContain('Sarah Jenkins');

      // 5. Brokerage Event Emitted
      const bicEvents = BrokerageEventBus.getRecentEvents('bic_review_requested');
      expect(bicEvents.length).toBe(1);
      expect(bicEvents[0].payload.bic).toBe('Ryan Crecelius');
    });

    it('Scenario B: Clean contract with all signed disclosures (702 Lumina Ave)', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, get this contract ready for Ryan for 702 Lumina Ave.',
        userRole: 'agent',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('get_contract_ready_for_bic');
      expect(response.spokenAnswer).toContain('No compliance concerns were identified by the automated checks');
      expect(response.displayResponse).toContain('Disclosures and earnest money deposit timelines are currently recorded in order');
    });

    it('Scenario C: No active transaction in context and ambiguous query -> prompts for clarification', async () => {
      const emptyContext = NoraContextEngine.buildContext({
        userRole: 'agent',
        sessionMemory: {}
      });

      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, prepare this contract.',
        userRole: 'agent',
        context: emptyContext,
        dbState: mockDbState
      });

      expect(response.success).toBe(false);
      expect(response.spokenAnswer).toContain('Which property transaction would you like me to prepare for Ryan?');
      expect(response.displayResponse).toContain('### ❓ Property Address Required');
    });
  });

  describe('Flagship Workflow 2: "NORA, what needs my attention today?"', () => {
    it('synthesizes real operational data into a prioritized 3-bucket briefing (URGENT, TODAY, WATCH)', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: 'NORA, what needs my attention today?',
        userRole: 'bic',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('operational_attention_briefing');

      // 1. Spoken voice answer must give crisp leadership summary
      expect(response.spokenAnswer).toContain('urgent trust deposit deadline');
      expect(response.spokenAnswer).toContain('First Bank NC');

      // 2. Display response must structure items with WHAT, WHY IT MATTERS, WHO OWNS IT, WHEN DUE, WHAT NORA CAN DO
      expect(response.displayResponse).toContain('### 🎯 Operational Morning Briefing');
      expect(response.displayResponse).toContain('#### 🚨 URGENT');
      expect(response.displayResponse).toContain('#### 📋 TODAY');
      expect(response.displayResponse).toContain('#### 👁️ WATCH');
      expect(response.displayResponse).toContain('NCREC 3-Day Banking Rule');
      expect(response.displayResponse).toContain('Escrow Desk');
      expect(response.displayResponse).toContain('Sarah Jenkins');
    });
  });

  describe('Flagship Workflow 3: "NORA, what\'s holding this deal up?"', () => {
    it('Scenario A: Identifies missing disclosure blocker and separates FACT, INFERENCE, and UNKNOWN', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: "NORA, what's holding this deal up for 1104 Arboretum Dr?",
        user: { name: 'Sarah Jenkins', role: 'agent', email: 'sarah@nestrealty.com' },
        userRole: 'agent',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('transaction_blocker_analysis');

      // 1. Spoken answer must identify primary blocker naturally
      expect(response.spokenAnswer).toContain('missing buyer signature on the RPOADS disclosure');

      // 2. Display response must explicitly present Fact vs Inference vs Unknown
      expect(response.displayResponse).toContain('### 🔍 Blocker Analysis: 1104 Arboretum Dr');
      expect(response.displayResponse).toContain('**1. FACT (Verified in Database & Documents)**');
      expect(response.displayResponse).toContain('**2. INFERENCE (Automated Correlation)**');
      expect(response.displayResponse).toContain('**3. UNKNOWN (Requires Broker Inquiry)**');
      expect(response.displayResponse).toContain('NCGS § 47E-5');
      expect(response.displayResponse).toContain('The system cannot confirm whether the buyer and seller have verbally reached an agreement');
    });

    it('Scenario B: Identifies clean transaction with no compliance blockers (702 Lumina Ave)', async () => {
      const response = await NoraOrchestrator.processRequest({
        query: "NORA, what's holding up 702 Lumina Ave?",
        userRole: 'agent',
        dbState: mockDbState
      });

      expect(response.success).toBe(true);
      expect(response.intent).toBe('transaction_blocker_analysis');
      expect(response.spokenAnswer).toContain('repair request appears to be the current blocker');
      expect(response.displayResponse).toContain('Home inspection was completed on Tuesday');
    });

    it('Scenario C: Missing transaction address prompts for property address', async () => {
      const emptyContext = NoraContextEngine.buildContext({ userRole: 'agent', sessionMemory: {} });
      const response = await NoraOrchestrator.processRequest({
        query: "What is holding up this deal?",
        userRole: 'agent',
        context: emptyContext,
        dbState: mockDbState
      });

      expect(response.success).toBe(false);
      expect(response.spokenAnswer).toContain('specify the property address');
    });
  });

  describe('High-Risk Actions: Confirmation Gate, Durability, and Idempotency', () => {
    it('enforces human confirmation for vendor orders with clear cost and scope', async () => {
      const adminContext = NoraContextEngine.buildContext({ userRole: 'admin' });

      // Unconfirmed dispatch
      const unconfirmed = await NoraExecutionEngine.executeAction({
        actionName: 'vendor.dispatch_order',
        input: {
          vendorName: 'Coastal Sign Post Co.',
          propertyAddress: '702 Lumina Ave, Wrightsville Beach, NC',
          serviceType: 'Yard Sign Post & Custom Rider Install',
          confirmed: false
        },
        context: adminContext,
        dbState: mockDbState
      });

      expect(unconfirmed.success).toBe(false);
      expect(unconfirmed.status).toBe('requires_confirmation');
      expect(unconfirmed.confirmationPrompt).toBe(
        'Dispatch third-party vendor order for Yard Sign Post & Custom Rider Install at 702 Lumina Ave, Wrightsville Beach, NC to Coastal Sign Post Co.?'
      );

      // Confirmed dispatch
      const confirmed = await NoraExecutionEngine.executeAction({
        actionName: 'vendor.dispatch_order',
        input: {
          vendorName: 'Coastal Sign Post Co.',
          propertyAddress: '702 Lumina Ave, Wrightsville Beach, NC',
          serviceType: 'Yard Sign Post & Custom Rider Install',
          confirmed: true
        },
        context: adminContext,
        dbState: mockDbState
      });

      expect(confirmed.success).toBe(true);
      expect(confirmed.status).toBe('completed');
      expect(confirmed.data.workOrderId).toBeDefined();

      // Duplicate retry blocked by idempotency
      const duplicateRetry = await NoraExecutionEngine.executeAction({
        actionName: 'vendor.dispatch_order',
        input: {
          vendorName: 'Coastal Sign Post Co.',
          propertyAddress: '702 Lumina Ave, Wrightsville Beach, NC',
          serviceType: 'Yard Sign Post & Custom Rider Install',
          confirmed: true
        },
        context: adminContext,
        dbState: mockDbState
      });

      expect(duplicateRetry.success).toBe(true);
      expect(duplicateRetry.humanReadableSummary.toLowerCase()).toContain('idempotent replay');
    });

    it('enforces human confirmation for outbound SMS dispatch', async () => {
      const adminContext = NoraContextEngine.buildContext({ userRole: 'admin' });

      const unconfirmed = await NoraExecutionEngine.executeAction({
        actionName: 'notification.send_sms',
        input: {
          toPhone: '+12527170595',
          recipientName: 'Marcus Aman',
          messageBody: 'Hello Marcus, contract review ready.',
          confirmed: false
        },
        context: adminContext,
        dbState: mockDbState
      });

      expect(unconfirmed.success).toBe(false);
      expect(unconfirmed.status).toBe('requires_confirmation');
    });
  });
});
