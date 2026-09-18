/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Agentic Architecture — Core Domain Types & Contracts
 * Defines the foundational types for Context, Actions, Execution Plans, Audit Events, and Permissions.
 */

import { z } from 'zod';

export type NoraRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NoraUserContext {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'bic' | 'operations_lead' | 'marketing_coordinator' | 'transaction_coordinator' | 'agent' | 'staff' | 'guest';
  primaryOffice?: string;
  isBrokerInCharge?: boolean;
}

export interface NoraContext {
  user: NoraUserContext;
  tenantId: string;
  workspaceId: string;
  permissions: string[];
  sessionId?: string;
  turnId?: string;
  conversationHistory?: any[];
  activeTransaction?: {
    id: string;
    propertyAddress: string;
    status: string;
    buyers?: string[];
    sellers?: string[];
    purchasePrice?: number;
    dueDiligenceFee?: number;
    earnestMoneyDeposit?: number;
    listingAgent?: string;
  };
  activeSop?: {
    id: string;
    title: string;
    processOwner: string;
    currentStepIndex?: number;
  };
  activePerson?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  recentActionHistory: NoraActionAuditRecord[];
  environment: 'development' | 'production' | 'test';
}

export type NoraActionLifecycleState =
  | 'ACTION_IDENTIFIED'
  | 'ACTION_DETAILS_REQUIRED'
  | 'ACTION_READY_FOR_PREVIEW'
  | 'ACTION_AWAITING_CONFIRMATION'
  | 'ACTION_AUTHORIZING'
  | 'ACTION_EXECUTING'
  | 'ACTION_VERIFYING'
  | 'ACTION_COMPLETED'
  | 'ACTION_PARTIALLY_COMPLETED'
  | 'ACTION_FAILED'
  | 'ACTION_FAILED_RETRYABLE'
  | 'ACTION_FAILED_FINAL'
  | 'ACTION_REAUTH_REQUIRED'
  | 'ACTION_CALENDAR_CONFIGURATION_REQUIRED'
  | 'ACTION_AWAITING_EXTERNAL_COMPLETION'
  | 'ACTION_CANCELLED';

export interface NoraProviderProof {
  provider: string;
  mode: 'LIVE' | 'SANDBOX' | 'FIXTURE' | 'DISCONNECTED';
  providerRecordId?: string;
  verifiedUrl?: string;
  hangoutLink?: string;
  htmlLink?: string;
  providerTimestamp?: string;
  conferenceStatus?: 'confirmed' | 'failed' | 'not_requested';
  rawReceipt?: any;
}

export interface NoraActionResult<TData = any> {
  success: boolean;
  actionName: string;
  status: 'completed' | 'failed' | 'requires_confirmation' | 'unauthorized' | 'verification_failed' | 'loop_detected' | 'idempotent_replay' | 'clarification_required';
  lifecycleState?: NoraActionLifecycleState;
  providerProof?: NoraProviderProof;
  data?: TData;
  humanReadableSummary: string;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  requiresClarification?: boolean;
  clarificationPrompt?: string;
  idempotencyKey?: string;
  auditMetadata: {
    actionId: string;
    timestamp: string;
    actorUserId: string;
    actorRole: string;
    tenantId: string;
    workspaceId: string;
    riskLevel: NoraRiskLevel;
    verified: boolean;
    verificationNotes?: string;
    impactArea: string;
  };
}

export interface NoraActionDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  domain: 'contracts' | 'compliance' | 'marketing' | 'operations' | 'sops' | 'roster' | 'notifications' | 'calendar' | 'document' | 'knowledge';
  riskLevel: NoraRiskLevel;
  requiredPermission?: string;
  requiresConfirmation?: boolean | ((input: TInput, context: NoraContext) => boolean);
  confirmationPrompt?: string | ((input: TInput, context: NoraContext) => string);
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, context: NoraContext) => Promise<Omit<NoraActionResult<TOutput>, 'auditMetadata' | 'actionName'>>;
  verify?: (result: NoraActionResult<TOutput>, context: NoraContext) => Promise<{ verified: boolean; notes?: string }>;
}

export interface NoraPlanStep {
  stepIndex: number;
  actionName: string;
  input: Record<string, any>;
  reasoning: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'requires_confirmation' | 'skipped';
  result?: NoraActionResult;
}

export interface NoraExecutionPlan {
  planId: string;
  intentSummary: string;
  targetGoal: string;
  steps: NoraPlanStep[];
  totalSteps: number;
  completedSteps: number;
  overallStatus: 'planning' | 'in_progress' | 'completed' | 'partial_failure' | 'failed' | 'waiting_confirmation';
  createdAt: string;
  updatedAt: string;
}

export interface NoraActionAuditRecord {
  id: string;
  actionName: string;
  timestamp: string;
  userId: string;
  userRole: string;
  tenantId: string;
  workspaceId: string;
  riskLevel: NoraRiskLevel;
  success: boolean;
  status: string;
  humanReadableSummary: string;
  entityType?: string;
  entityId?: string;
  confirmedByHuman?: boolean;
  error?: string;
}

export interface BrokerageEvent {
  id: string;
  type:
    | 'contract_uploaded'
    | 'contract_dates_extracted'
    | 'bic_review_requested'
    | 'compliance_hold_flagged'
    | 'task_created'
    | 'task_completed'
    | 'vendor_order_dispatched'
    | 'mms_intake_received'
    | 'inbound_call_completed'
    | 'proactive_sweep_executed';
  brokerageId: string;
  tenantId: string;
  workspaceId: string;
  userId?: string;
  entityType: 'transaction' | 'task' | 'contract' | 'vendor_order' | 'sop' | 'compliance_audit';
  entityId: string;
  timestamp: string;
  payload: Record<string, any>;
}
