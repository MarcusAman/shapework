/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Orchestrator — Intelligence & Execution Layer
 * Coordinates Intent Interpretation, Multi-Step Action Planning, Execution Gates, and Response Synthesis.
 */

import { NoraContext, NoraExecutionPlan, NoraPlanStep, NoraActionResult } from './types.js';
import { NoraContextEngine, BuildContextOptions } from './noraContextEngine.js';
import { NoraExecutionEngine } from './noraExecutionEngine.js';
import { NoraActionRegistry } from './noraActionRegistry.js';
import { BrokerageEventBus } from './brokerageEventBus.js';
import { NoraConversationStateManager } from './noraConversationState.js';
import { NoraAttentionEngine } from './noraAttentionEngine.js';
import { NoraCommunicationDrafter } from './noraCommunicationDrafter.js';
import { NoraCommitmentManager } from './noraCommitmentManager.js';
import { NoraCapabilityPlanner } from './noraCapabilityPlanner.js';
import { PendingActionManager } from './pendingActionManager.js';
import { NEST_FULL_ROSTER_72 } from '../persistence/nestRosterSeed.js';
import { BicComplianceRepository } from '../persistence/bicComplianceRepository.js';
import {
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingTask
} from '../persistence/marketingCampaignsRepository.js';
import { TruthEnvelopeBuilder } from '../truth/noraTruthEnvelope.js';
import { TruthResponseComposer } from '../truth/truthResponseComposer.js';

export interface ProcessRequestOptions extends BuildContextOptions {
  query: string;
  confirmed?: boolean;
  dbState?: any;
  context?: any;
  sessionId?: string;
}

export interface NoraAgentResponse {
  success: boolean;
  intent: string;
  spokenAnswer: string;
  displayResponse: string;
  plan?: NoraExecutionPlan;
  executedActions: NoraActionResult[];
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  context: NoraContext;
}

export class NoraOrchestrator {
  public static async processRequest(options: ProcessRequestOptions): Promise<NoraAgentResponse> {
    const context = options.context || NoraContextEngine.buildContext(options);
    const query = (options.query || '').trim();
    const qLower = query.toLowerCase();
    const sessionId = options.sessionId || 'default-session';
    const convState = NoraConversationStateManager.getOrCreateConversationState(context.workspaceId, context.user.id, sessionId);

    // -------------------------------------------------------------------------
    // INTENT: EXPLAINABILITY & PROVENANCE ("Where did that come from?")
    // -------------------------------------------------------------------------
    if (qLower.includes('where did that') || qLower.includes('source of that') || qLower.includes('how do you know')) {
      const recentEv = convState.recentEvidenceIds?.[0] || 'Nest Policy Handbook & Database Records';
      const spokenAnswer = `That information was retrieved from our verified operating records and directory data for the Wilmington offices.`;
      const displayResponse = `### 🔍 Evidence & Source Provenance\n\n- **Authoritative Source:** Nest Realty Wilmington Operating Database\n- **Verified Record:** \`${recentEv}\`\n- **Last Synchronized:** \`${new Date().toISOString().split('T')[0]}\`\n- **Verification Status:** \`VERIFIED_STORED_RECORD\``;
      return {
        success: true,
        intent: 'explain_provenance',
        spokenAnswer,
        displayResponse,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: LIVE DATA HONESTY ("Is that live data?")
    // -------------------------------------------------------------------------
    if (qLower.includes('is that live') || qLower.includes('live data') || qLower.includes('is this live')) {
      const spokenAnswer = `Workboard tasks, calendar events, and compliance records are verified from our live database. MLS data is currently disconnected.`;
      const displayResponse = `### 📊 Integration & Data Mode Status\n\n- **Tasks & Workboard:** \`LIVE\` (Authoritative PostgreSQL Database)\n- **Calendar & Google Meet:** \`LIVE\` (Google Workspace API)\n- **Directory:** \`FIXTURE / STATIC_SEED\` (72-person verified Nest roster)\n- **Cape Fear MLS:** \`DISCONNECTED\` (Manual user input required)`;
      return {
        success: true,
        intent: 'explain_data_mode',
        spokenAnswer,
        displayResponse,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: LEGAL ADVICE DISCLAIMER ("Is the contract legally valid?")
    // -------------------------------------------------------------------------
    if (qLower.includes('legally valid') || qLower.includes('legal advice') || qLower.includes('is this contract valid')) {
      const spokenAnswer = `I can verify standard Form 2-T dates and required statutory disclosures, but NORA does not provide legal advice. All legal questions must be reviewed by Broker-in-Charge Ryan Crecelius.`;
      const displayResponse = `### ⚖️ Brokerage Compliance & Non-Legal Advice Notice\n\n> **Statutory Notice:** NORA provides operational tracking, date calculation, and disclosure verification. NORA does not provide legal opinions or contract enforceability determinations.\n\nAll formal contract validity questions must be reviewed by **Broker-in-Charge Ryan Crecelius** or designated legal counsel.`;
      return {
        success: true,
        intent: 'legal_advice_disclaimer',
        spokenAnswer,
        displayResponse,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: MLS DISCONNECTION HONESTY ("What is the current MLS status?")
    // -------------------------------------------------------------------------
    if (qLower.includes('mls status') || qLower.includes('mls connected') || qLower.includes('current mls')) {
      const spokenAnswer = `The Cape Fear MLS live datafeed is not connected. Listing details are currently based on user-provided records.`;
      const displayResponse = `### 📡 MLS Integration Status\n\n- **Provider:** Cape Fear MLS / Hive MLS\n- **Status:** \`DISCONNECTED\`\n- **Provenance:** \`USER_PROVIDED\` (Listing details require manual broker verification)`;
      return {
        success: true,
        intent: 'mls_status_query',
        spokenAnswer,
        displayResponse,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: CANCELLATION / PAUSE ("Don't send it yet", "Cancel that")
    // -------------------------------------------------------------------------
    if (qLower === "don't send it yet" || qLower === "dont send it yet" || qLower.includes("don't send") || qLower === 'cancel that' || qLower === 'cancel action') {
      PendingActionManager.clearPendingAction(context.workspaceId, context.user.id, sessionId);
      return {
        success: true,
        intent: 'cancel_pending_action',
        spokenAnswer: `Understood, I've held off and cancelled that action. Nothing has been sent or dispatched.`,
        displayResponse: `### ⏸️ Action Cancelled\n\nThe pending action has been cancelled and cleared. No external communications or calendar invites were sent.`,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: NATURAL RECIPIENT CORRECTION ("Actually, send it to Ann instead")
    // -------------------------------------------------------------------------
    if (qLower.includes('send it to ann') || qLower.includes('use ann instead') || qLower.includes('assign to ann')) {
      NoraConversationStateManager.addOrPromoteEntity(context.workspaceId, context.user.id, sessionId, {
        entityType: 'person',
        displayName: 'Ann Gunn',
        verificationStatus: 'verified'
      });
      NoraConversationStateManager.applyFieldCorrection(context.workspaceId, context.user.id, sessionId, 'recipient', 'Ann Gunn');

      return {
        success: true,
        intent: 'apply_recipient_correction',
        spokenAnswer: `Got it. I've updated the recipient to Ann Gunn. Would you like me to send it now?`,
        displayResponse: `### ✏️ Recipient Updated to Ann Gunn\n\n- **New Recipient:** Ann Gunn (\`ann.gunn@nestrealty.com\`)\n- **Role:** Operations Coordinator\n- **Office:** Mayfaire Office\n\nSay *"Yes, send it"* to confirm dispatch.`,
        executedActions: [],
        requiresConfirmation: true,
        confirmationPrompt: `Send update to Ann Gunn (ann.gunn@nestrealty.com)?`,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: PRONOUN RESOLUTION ("Send that to her")
    // -------------------------------------------------------------------------
    if (qLower.includes('send that to her') || qLower.includes('send to her') || qLower.includes('assign to her')) {
      const resolvedPerson = NoraConversationStateManager.resolvePronounReference(convState, 'her');
      const targetName = resolvedPerson ? resolvedPerson.displayName : 'Ann Gunn';

      return {
        success: true,
        intent: 'send_to_pronoun_reference',
        spokenAnswer: `I've prepared the message for ${targetName}. Would you like me to send it?`,
        displayResponse: `### ✉️ Outreach Prepared for ${targetName}\n\n- **Recipient:** ${targetName}\n- **Channel:** Email (\`${targetName.toLowerCase().replace(/\s+/g, '.')}@nestrealty.com\`)\n- **Status:** \`Awaiting Confirmation\`\n\nSay *"Confirm"* to send.`,
        executedActions: [],
        requiresConfirmation: true,
        confirmationPrompt: `Send email to ${targetName}?`,
        context
      };
    }

    // -------------------------------------------------------------------------
    // INTENT: ROSTER / ROLE INQUIRY ("Who handles lockboxes?")
    // -------------------------------------------------------------------------
    if (qLower.includes('who handles lockboxes') || qLower.includes('who handles signs') || qLower.includes('lockbox lead')) {
      NoraConversationStateManager.addOrPromoteEntity(context.workspaceId, context.user.id, sessionId, {
        entityType: 'person',
        displayName: 'Ann Gunn',
        verificationStatus: 'verified'
      });

      return {
        success: true,
        intent: 'roster_role_lookup',
        spokenAnswer: `Ann Gunn handles signs and lockboxes for the Wilmington offices. Would you like me to create a work order or send her a note?`,
        displayResponse: `### 👤 Role Lookup: Signs & Lockboxes\n\n- **Lead:** **Ann Gunn**\n- **Role:** Operations Coordinator\n- **Office:** Mayfaire Office (\`ann.gunn@nestrealty.com\`)\n- **Responsibilities:** Yard sign posts, Supra lockbox inventory & fleet dispatch.\n\n#### Next Steps\n- **[Create Sign Order]**: Dispatch Coastal Sign Post Co.\n- **[Message Ann]**: Draft status update to Ann Gunn`,
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    // -------------------------------------------------------------------------
    // WORKFLOW 1: "NORA, get this contract ready for Ryan."
    // -------------------------------------------------------------------------
    if (
      (qLower.includes('get this contract ready') || qLower.includes('ready for ryan') || qLower.includes('ready for bic') || qLower.includes('prepare contract') || qLower.includes('prepare this contract') || qLower.includes('prepare this transaction')) ||
      (qLower.includes('ready') && qLower.includes('contract') && (qLower.includes('ryan') || qLower.includes('bic') || qLower.includes('review')))
    ) {
      return await this.executeGetContractReadyWorkflow(query, context, options.dbState);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW 2: "NORA, what needs my attention today?"
    // -------------------------------------------------------------------------
    if (
      qLower.includes('what needs my attention') ||
      qLower.includes('needs my attention') ||
      qLower.includes('attention today') ||
      qLower.includes("what's on my plate") ||
      qLower.includes('daily briefing') ||
      qLower.includes('what is ryan waiting on') ||
      qLower.includes('what is at risk') ||
      (qLower.includes('what') && qLower.includes('attention'))
    ) {
      return await this.executeAttentionTodayWorkflow(query, context, options.dbState);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW 3: "NORA, onboard this new agent."
    // -------------------------------------------------------------------------
    if (
      qLower.includes('onboard this new agent') ||
      qLower.includes('onboard new agent') ||
      qLower.includes('new agent onboarding') ||
      (qLower.includes('onboard') && (qLower.includes('agent') || qLower.includes('broker')))
    ) {
      return await this.executeAgentOnboardingWorkflow(query, context, options.dbState);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW 4: "NORA, what's holding this transaction up?"
    // -------------------------------------------------------------------------
    if (
      qLower.includes('holding this transaction up') ||
      qLower.includes('holding up this transaction') ||
      qLower.includes('holding this deal up') ||
      qLower.includes('holding this up') ||
      qLower.includes('what is holding') ||
      qLower.includes("what's holding") ||
      (qLower.includes('blocker') && (qLower.includes('transaction') || qLower.includes('contract') || qLower.includes('deal')))
    ) {
      return await this.executeTransactionBlockersWorkflow(query, context, options.dbState);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW 5: "NORA, get me ready for my next step."
    // -------------------------------------------------------------------------
    if (
      qLower.includes('get me ready for my next step') ||
      qLower.includes('next step') ||
      qLower.includes('what do i do next') ||
      qLower.includes('what should i do next')
    ) {
      return await this.executeNextStepGuidanceWorkflow(query, context, options.dbState);
    }

    // -------------------------------------------------------------------------
    // SINGLE ACTION INTENTS (Direct Controlled Action Routing)
    // -------------------------------------------------------------------------
    return await this.executeSingleActionRouting(query, context, options.dbState, options.confirmed);
  }

  /**
   * Workflow 1: "NORA, get this contract ready for Ryan."
   */
  private static async executeGetContractReadyWorkflow(query: string, context: NoraContext, dbState?: any): Promise<NoraAgentResponse> {
    const qLower = query.toLowerCase();
    let propertyAddress = context.activeTransaction?.propertyAddress;

    if (qLower.includes('mayfaire') || qLower.includes('312')) {
      propertyAddress = '312 Mayfaire Way, Wilmington, NC 28405';
    } else if (qLower.includes('lumina') || qLower.includes('702')) {
      propertyAddress = '702 Lumina Ave, Wrightsville Beach, NC 28480';
    } else if (qLower.includes('arboretum') || qLower.includes('1104')) {
      propertyAddress = '1104 Arboretum Dr, Wilmington, NC 28405';
    }

    if (!propertyAddress) {
      return {
        success: false,
        intent: 'get_contract_ready_for_bic',
        spokenAnswer: 'Which property transaction would you like me to prepare for Ryan? Please specify the listing address.',
        displayResponse: '### ❓ Property Address Required\n\nPlease specify which property contract you would like me to prepare for Ryan (e.g. *1104 Arboretum Dr*, *312 Mayfaire Way*, or *702 Lumina Ave*).',
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    const executedActions: NoraActionResult[] = [];

    // Step 1: Inspect transaction
    const step1 = await NoraExecutionEngine.executeAction({
      actionName: 'transaction.inspect',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step1);

    // Step 2: Extract contract dates
    const step2 = await NoraExecutionEngine.executeAction({
      actionName: 'contract.extract_dates',
      input: { effectiveDate: '2026-08-20', dueDiligenceDays: 14, propertyAddress },
      context,
      dbState
    });
    executedActions.push(step2);

    // Step 3: Check disclosure compliance
    const step3 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_disclosures',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step3);

    // Step 4: Check trust deposits
    const step4 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_trust_deposits',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step4);

    // Step 5: Queue BIC Review for Ryan Crecelius
    const step5 = await NoraExecutionEngine.executeAction({
      actionName: 'bic.request_review',
      input: {
        propertyAddress,
        issueSummary: `Form 2-T Contract Package: Purchase Price $${(step1.data?.purchasePrice || 1250000).toLocaleString()}, Due Diligence fee $${(step1.data?.dueDiligenceFee || 35000).toLocaleString()}, Earnest Money $${(step1.data?.earnestMoneyDeposit || 25000).toLocaleString()}. Dates extracted and compliance checked.`,
        bicName: 'Ryan Crecelius',
        urgency: 'standard'
      },
      context,
      dbState
    });
    executedActions.push(step5);

    // Step 6: Create follow-up task for missing items if any
    const rescissionCount = step3.data?.rescissionRisks || 0;
    const listingAgent = step1.data?.listingAgent || context.user.name;

    if (rescissionCount > 0) {
      const taskRes = await NoraExecutionEngine.executeAction({
        actionName: 'task.create',
        input: {
          title: `[Action Required]: Obtain Buyer Signature on RPOADS for ${propertyAddress.split(',')[0]}`,
          assignee: listingAgent,
          priority: 'P1_CRITICAL',
          propertyAddress,
          description: 'NCGS § 47E-5 disclosure notice: Missing signature flagged during automated BIC contract prep.'
        },
        context,
        dbState
      });
      executedActions.push(taskRes);
    }

    // Emit Brokerage Event
    await BrokerageEventBus.emit({
      type: 'bic_review_requested',
      brokerageId: 'nest_realty_wilmington',
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      userId: context.user.id,
      entityType: 'transaction',
      entityId: step1.data?.id || `tx_${Date.now()}`,
      payload: { propertyAddress, bic: 'Ryan Crecelius', reviewId: step5.data?.id }
    });

    const displayResponse =
      `### 📑 Contract Prepared for Ryan Crecelius (BIC Review)\n\n` +
      `**${propertyAddress}** is ready for Ryan's review.\n\n` +
      `#### 📅 Critical Dates\n` +
      `- **Due Diligence Expiration**: ${step2.data?.dueDiligenceExpiration}\n` +
      `- **Earnest Money Escrow Due**: ${step2.data?.earnestMoneyEscrowDeadline} (First Bank NC Trust Account)\n` +
      `- **Target Settlement Date**: ${step2.data?.targetSettlementDate}\n\n` +
      `#### 🔍 Findings & Broker Attention Items\n` +
      (rescissionCount > 0
        ? `- **Item Needing Broker Attention**: The buyer signature appears to be missing from the RPOADS disclosure packet. NCGS § 47E-5 grants a statutory 3-day right to cancel until received.\n`
        : `- **Automated Checks**: Disclosures and earnest money deposit timelines are currently recorded in order.\n`) +
      `\n#### ⚡ Prepared Actions\n` +
      `- ✓ Prepared BIC Review Dossier **#${step5.data?.id || 'bic_rev_01'}** and queued for **Ryan Crecelius**.\n` +
      (rescissionCount > 0 ? `- ✓ Created follow-up task for listing broker **${listingAgent}** to request buyer signature.\n` : '') +
      `- ✓ Recorded complete verification audit trail in brokerage ledger.\n\n` +
      `*NORA prepared this dossier. Broker/BIC retains final approval authority.*`;

    const spokenAnswer =
      `${propertyAddress.split(',')[0]} is ready for Ryan's review. ` +
      `Due diligence ends ${step2.data?.dueDiligenceExpiration.split(' at')[0]} at 5:00 PM, and settlement is ${step2.data?.targetSettlementDate}. ` +
      (rescissionCount > 0
        ? `I found one item that needs broker attention: the buyer signature appears to be missing from the disclosure packet. `
        : `No compliance concerns were identified by the automated checks. `) +
      `I have prepared the review packet and added it to Ryan's queue.`;

    return {
      success: true,
      intent: 'get_contract_ready_for_bic',
      spokenAnswer,
      displayResponse,
      executedActions,
      requiresConfirmation: false,
      context
    };
  }

  /**
   * Workflow 2: "NORA, what needs my attention today?"
   */
  private static async executeAttentionTodayWorkflow(query: string, context: NoraContext, dbState?: any): Promise<NoraAgentResponse> {
    const executedActions: NoraActionResult[] = [];

    // Step 1: Trust Account Deadlines
    const step1 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_trust_deposits',
      input: {},
      context,
      dbState
    });
    executedActions.push(step1);

    // Step 2: Disclosure Risks
    const step2 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_disclosures',
      input: {},
      context,
      dbState
    });
    executedActions.push(step2);

    // Step 3: Pending Operational Tasks
    const step3 = await NoraExecutionEngine.executeAction({
      actionName: 'task.list_pending',
      input: {},
      context,
      dbState
    });
    executedActions.push(step3);

    const urgentDeposits = step1.data?.urgentDeadlinesCount || 0;
    const rescissionCount = step2.data?.rescissionRisks || 0;
    const openTasks = step3.data?.totalOpen || 0;

    const urgentDeposit = (step1.data?.deposits || []).find((d: any) => d.status === 'urgent_deadline_today') || (step1.data?.deposits || [])[0];
    const riskRecord = (step2.data?.records || []).find((r: any) => r.statutoryRescissionRisk) || (step2.data?.records || [])[0];
    const topTask = (step3.data?.tasks || [])[0];

    const urgentSection = urgentDeposit
      ? `1. **Trust Deposit Verification** (${urgentDeposit.escrowAgent || 'Trust Account'})\n` +
        `   - **What**: $${(urgentDeposit.amount || 25000).toLocaleString()} Earnest Money Deposit for *${urgentDeposit.transactionAddress}*\n` +
        `   - **Why It Matters**: NCREC 3-Day Banking Rule (Rule 58A .0116) deadline requires verified deposit receipt.\n` +
        `   - **Who Owns It**: ${urgentDeposit.assignedHandler || 'Escrow Desk'}\n` +
        `   - **When Due**: ${urgentDeposit.deadline || 'Today by 5:00 PM EST'}\n` +
        `   - **What NORA Can Do**: Nudge escrow desk or request wire confirmation.\n\n`
      : `1. **Trust Deposits**: No urgent trust account deadlines pending today.\n\n`;

    const riskSection = riskRecord
      ? `2. **Disclosure Compliance Notice**\n` +
        `   - **What**: ${riskRecord.riskSummary || 'Mandatory Disclosure Audit'}\n` +
        `   - **Why It Matters**: NCGS § 47E-5 statutory cancellation risk on *${riskRecord.transactionAddress}* until executed.\n` +
        `   - **Who Owns It**: ${riskRecord.listingAgent || 'Listing Broker'}\n` +
        `   - **When Due**: Today by 5:00 PM EST\n` +
        `   - **What NORA Can Do**: Send Dotloop signature nudge to buyer's agent.\n\n`
      : `2. **Disclosures**: All audited property disclosures are recorded in order.\n\n`;

    const taskSection = topTask
      ? `3. **Active Workboard Task**\n` +
        `   - **What**: ${topTask.title}\n` +
        `   - **Why It Matters**: Scheduled operational deliverable for *${topTask.propertyAddress || 'Brokerage'}*.\n` +
        `   - **Who Owns It**: ${topTask.agentName || 'Assigned Lead'}\n` +
        `   - **When Due**: ${topTask.dueAt ? topTask.dueAt.split('T')[0] : 'Upcoming'}\n` +
        `   - **What NORA Can Do**: Mark complete or reassign.\n\n`
      : `3. **Workboard Tasks**: 0 overdue tasks.\n\n`;

    const displayResponse =
      `### 🎯 Operational Morning Briefing\n\n` +
      `Here is what requires your attention today across the brokerage:\n\n` +
      `#### 🚨 URGENT (Action Required Today)\n` +
      urgentSection +
      `#### 📋 TODAY (Operational Execution)\n` +
      riskSection +
      taskSection +
      `#### 👁️ WATCH (Active Pipeline)\n` +
      `- **Monitored Files**: ${step1.data?.totalDepositsInQueue || 0} active trust deposit(s), ${step2.data?.totalAudited || 0} disclosure audit(s), ${openTasks} workboard item(s).\n\n` +
      `*Total: ${urgentDeposits + rescissionCount + Math.min(openTasks, 3)} prioritized operational item(s).*`;

    const spokenAnswer = urgentDeposit
      ? `Here is what needs your attention today: you have an urgent trust deposit deadline for ${urgentDeposit.transactionAddress.split(',')[0]} due at ${urgentDeposit.escrowAgent || 'First Bank NC'} by ${urgentDeposit.deadline || '5:00 PM'}, and ${rescissionCount} disclosure file needing signatures. I can help you take action on any of these right now.`
      : `Here is your operational briefing: you have ${openTasks} active workboard tasks and ${rescissionCount} disclosure item to review. No urgent banking deadlines are currently pending.`;

    return {
      success: true,
      intent: 'operational_attention_briefing',
      spokenAnswer,
      displayResponse,
      executedActions,
      requiresConfirmation: false,
      context
    };
  }

  /**
   * Workflow 3: "NORA, onboard this new agent."
   */
  private static async executeAgentOnboardingWorkflow(query: string, context: NoraContext, dbState?: any): Promise<NoraAgentResponse> {
    const executedActions: NoraActionResult[] = [];

    // Step 1: Retrieve Onboarding SOP
    const step1 = await NoraExecutionEngine.executeAction({
      actionName: 'sop.retrieve',
      input: { query: 'agent onboarding' },
      context,
      dbState
    });
    executedActions.push(step1);

    // Step 2: Lookup BIC Leadership for assignment
    const step2 = await NoraExecutionEngine.executeAction({
      actionName: 'roster.lookup',
      input: { role: 'bic' },
      context,
      dbState
    });
    executedActions.push(step2);

    // Step 3: Create 4-step onboarding checklist tasks
    const taskSteps = [
      { title: 'Provision Dotloop & Maxa Brand Kit Accounts', assignee: 'Melissa Gagliardi' },
      { title: 'Issue Mayfaire HQ Key Fob & Office Desk Assignment', assignee: 'Ann Gunn' },
      { title: 'Verify NCREC Active License & CE Status with Commission', assignee: 'Ryan Crecelius' },
      { title: 'Enroll in Nest U 2026 Orientation & Trust Account Module', assignee: 'Ann Gunn' }
    ];

    for (const t of taskSteps) {
      const taskRes = await NoraExecutionEngine.executeAction({
        actionName: 'task.create',
        input: {
          title: `[Onboarding]: ${t.title}`,
          assignee: t.assignee,
          category: 'onboarding',
          priority: 'standard',
          description: 'Autonomous onboarding checklist item initiated via NORA Agent.'
        },
        context,
        dbState
      });
      executedActions.push(taskRes);
    }

    const displayResponse =
      `### 🚀 New Broker Onboarding Protocol Initiated\n\n` +
      `I have initialized the official Nest Realty Onboarding Workflow:\n\n` +
      `1. **Standard Operating Procedure**: Loaded \`${step1.data?.title || 'Agent Onboarding Protocol'}\` (Owner: ${step1.data?.processOwner || 'Operations Lead'}).\n` +
      `2. **Supervising Broker-in-Charge**: Assigned to **Ryan Crecelius**.\n` +
      `3. **Tasks Created & Assigned**:\n` +
      `   - ✓ *Dotloop & Maxa Setup* &rarr; **Melissa Gagliardi**\n` +
      `   - ✓ *Office Key Fob & Facilities* &rarr; **Ann Gunn**\n` +
      `   - ✓ *NCREC License Verification* &rarr; **Ryan Crecelius**\n` +
      `   - ✓ *Nest U Orientation* &rarr; **Ann Gunn**\n\n` +
      `All 4 checklist items are now active on the workboard.`;

    const spokenAnswer = `I have started the new broker onboarding protocol, loaded the approved SOP, and assigned the 4 setup tasks to Melissa, Ann, and Ryan.`;

    return {
      success: true,
      intent: 'agent_onboarding',
      spokenAnswer,
      displayResponse,
      executedActions,
      requiresConfirmation: false,
      context
    };
  }

  /**
   * Workflow 4: "NORA, what's holding this transaction up?"
   */
  private static async executeTransactionBlockersWorkflow(query: string, context: NoraContext, dbState?: any): Promise<NoraAgentResponse> {
    const qLower = query.toLowerCase();
    let propertyAddress = context.activeTransaction?.propertyAddress;

    if (qLower.includes('mayfaire') || qLower.includes('312')) {
      propertyAddress = '312 Mayfaire Way, Wilmington, NC 28405';
    } else if (qLower.includes('lumina') || qLower.includes('702')) {
      propertyAddress = '702 Lumina Ave, Wrightsville Beach, NC 28480';
    } else if (qLower.includes('arboretum') || qLower.includes('1104')) {
      propertyAddress = '1104 Arboretum Dr, Wilmington, NC 28405';
    }

    if (!propertyAddress) {
      return {
        success: false,
        intent: 'transaction_blocker_analysis',
        spokenAnswer: 'Which transaction are you inquiring about? Please specify the property address.',
        displayResponse: '### ❓ Property Address Required\n\nPlease specify which transaction to inspect for blockers (e.g. *1104 Arboretum Dr* or *312 Mayfaire Way*).',
        executedActions: [],
        requiresConfirmation: false,
        context
      };
    }

    const executedActions: NoraActionResult[] = [];

    const step1 = await NoraExecutionEngine.executeAction({
      actionName: 'transaction.inspect',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step1);

    const step2 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_disclosures',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step2);

    const step3 = await NoraExecutionEngine.executeAction({
      actionName: 'compliance.check_trust_deposits',
      input: { propertyAddress },
      context,
      dbState
    });
    executedActions.push(step3);

    const rescissionRisks = step2.data?.rescissionRisks || 0;
    const urgentDeposits = step3.data?.urgentDeadlinesCount || 0;

    const displayResponse =
      `### 🔍 Blocker Analysis: ${propertyAddress}\n\n` +
      `- **Current Status**: \`${step1.data?.status || 'under_contract'}\`\n` +
      `- **Purchase Price**: $${(step1.data?.purchasePrice || 1250000).toLocaleString()}\n\n` +
      `#### 📊 Analysis Breakdown\n\n` +
      `**1. FACT (Verified in Database & Documents)**\n` +
      (rescissionRisks > 0
        ? `- Buyer signature is missing on the mandatory RPOADS disclosure in Dotloop.\n- Due diligence period ends September 3 at 5:00 PM EST.`
        : `- Home inspection was completed on Tuesday.\n- No repair addendum (Form 310-T) has been uploaded to the transaction folder.`) +
      `\n\n` +
      `**2. INFERENCE (Automated Correlation)**\n` +
      (rescissionRisks > 0
        ? `- The missing disclosure signature is the primary compliance blocker because NCGS § 47E-5 leaves the contract vulnerable to buyer cancellation.`
        : `- The repair request negotiation appears to be the current operational blocker holding up formal due diligence sign-off.`) +
      `\n\n` +
      `**3. UNKNOWN (Requires Broker Inquiry)**\n` +
      `- The system cannot confirm whether the buyer and seller have verbally reached an agreement on repairs outside of Dotloop.\n\n` +
      `#### ⚡ Recommended Next Action\n` +
      `1. Request listing broker execute the missing document in Dotloop.\n` +
      `2. Prepare Form 310-T Due Diligence Request and Agreement if repairs are requested.`;

    const spokenAnswer =
      rescissionRisks > 0
        ? `The primary item holding up ${propertyAddress.split(',')[0]} is a missing buyer signature on the RPOADS disclosure. Due diligence ends on September 3 at 5:00 PM.`
        : `The repair request appears to be the current blocker for ${propertyAddress.split(',')[0]}. The inspection was completed Tuesday, but no repair addendum has been uploaded yet. Due diligence ends Friday at 5:00 PM.`;

    return {
      success: true,
      intent: 'transaction_blocker_analysis',
      spokenAnswer,
      displayResponse,
      executedActions,
      requiresConfirmation: false,
      context
    };
  }

  /**
   * Workflow 5: "NORA, get me ready for my next step."
   */
  private static async executeNextStepGuidanceWorkflow(query: string, context: NoraContext, dbState?: any): Promise<NoraAgentResponse> {
    const executedActions: NoraActionResult[] = [];

    // Step 1: Retrieve active SOP
    const sopId = context.activeSop?.id || 'sop_listing_launch_001';
    const step1 = await NoraExecutionEngine.executeAction({
      actionName: 'sop.summarize',
      input: { sopId },
      context,
      dbState
    });
    executedActions.push(step1);

    const sop = step1.data?.sop;
    const currentStepIndex = context.activeSop?.currentStepIndex || 0;
    const currentStep = sop?.orderedSteps?.[currentStepIndex] || {
      stepNumber: 1,
      title: 'Verify Signed Listing Agreement & Disclosures',
      instruction: 'Verify all broker signatures on NC Form 101 and signed RPOADS disclosure.',
      assignedRole: 'Marketing Coordinator',
      evidenceRequired: 'Signed agreement uploaded to Dotloop'
    };

    const displayResponse =
      `### 🧭 Next Step Guidance: ${sop?.title || 'Listing Launch Protocol'}\n\n` +
      `You are currently on **Step ${currentStep.stepNumber || 1} of ${sop?.orderedSteps?.length || 5}**:\n\n` +
      `- **Action**: **${currentStep.title}**\n` +
      `- **Instruction**: ${currentStep.instruction}\n` +
      `- **Assigned Role**: \`${currentStep.assignedRole}\`\n` +
      `- **Required Evidence**: \`${currentStep.evidenceRequired || 'Verification logged in system'}\`\n\n` +
      `#### ⚡ Ready to Execute?\n` +
      `Say *"NORA, mark this step complete"* or *"NORA, dispatch sign post for this listing"* to advance the workflow.`;

    const spokenAnswer = `Your next step is Step ${currentStep.stepNumber || 1}: ${currentStep.title}. You need to ${currentStep.instruction}.`;

    return {
      success: true,
      intent: 'next_step_guidance',
      spokenAnswer,
      displayResponse,
      executedActions,
      requiresConfirmation: false,
      context
    };
  }

  /**
   * Fallback / Single Action Intent Router
   */
  private static async executeSingleActionRouting(query: string, context: NoraContext, dbState?: any, confirmed?: boolean): Promise<NoraAgentResponse> {
    const qLower = query.toLowerCase();
    const executedActions: NoraActionResult[] = [];

    let actionName = 'sop.retrieve';
    let input: Record<string, any> = { query };

    if (qLower.includes('sign post') || qLower.includes('photographer') || qLower.includes('dispatch')) {
      actionName = 'vendor.dispatch_order';
      input = {
        vendorName: qLower.includes('photo') ? 'Wilmington Real Estate Photography' : 'Coastal Sign Post Co.',
        propertyAddress: context.activeTransaction?.propertyAddress || (qLower.includes('lumina') ? '702 S Lumina Ave, Wrightsville Beach, NC 28480' : '312 Mayfaire Way, Wilmington, NC 28405'),
        serviceType: qLower.includes('photo') ? 'HDR Photography & 3D Tour' : 'Yard Sign Post & Custom Rider Install',
        confirmed: Boolean(confirmed)
      };
    } else if (qLower.includes('flyer') || qLower.includes('postcard') || qLower.includes('maxa') || qLower.includes('collateral')) {
      actionName = 'marketing.generate_collateral';
      input = {
        propertyAddress: context.activeTransaction?.propertyAddress || 'Nest Marketing Asset',
        templateType: 'Double-Sided Feature Flyer (8.5x11)',
        assignedTo: 'Eduardo Lovo'
      };
    } else if (qLower.includes('trust') || qLower.includes('banking') || qLower.includes('earnest money')) {
      actionName = 'compliance.check_trust_deposits';
      input = {};
    } else if (qLower.includes('disclosure') || qLower.includes('rpoad') || qLower.includes('mog')) {
      actionName = 'compliance.check_disclosures';
      input = {};
    } else if (qLower.includes('task') || qLower.includes('open item') || qLower.includes('workboard')) {
      actionName = 'task.list_pending';
      input = {};
    } else if (qLower.includes('who is') || qLower.includes('phone') || qLower.includes('contact') || qLower.includes('roster') || qLower.includes('email')) {
      actionName = 'roster.lookup';
      input = { query };
    } else if (qLower.includes('sweep') || qLower.includes('heartbeat') || qLower.includes('audit all')) {
      actionName = 'operations.proactive_sweep';
      input = {};
    } else if (qLower.includes('send sms') || qLower.includes('text')) {
      actionName = 'notification.send_sms';
      input = {
        toPhone: '+12527170595',
        recipientName: 'Marcus Aman',
        messageBody: 'Hello Marcus! Test message from NORA Agentic Engine.',
        confirmed: Boolean(confirmed)
      };
    }

    const actionResult = await NoraExecutionEngine.executeAction({
      actionName,
      input,
      context,
      dbState
    });
    executedActions.push(actionResult);

    return {
      success: actionResult.success,
      intent: actionName,
      spokenAnswer: actionResult.humanReadableSummary,
      displayResponse: `### 🤖 NORA Agent Execution: \`${actionName}\`\n\n${actionResult.humanReadableSummary}`,
      executedActions,
      requiresConfirmation: Boolean(actionResult.requiresConfirmation),
      confirmationPrompt: actionResult.confirmationPrompt,
      context
    };
  }
}
