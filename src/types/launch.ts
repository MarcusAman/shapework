/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceUser } from './shapework';

export type LaunchReadinessStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "ready_for_review"
  | "approved_for_launch"
  | "live";

export type LaunchReadinessCategory =
  | "workspace"
  | "users_roles"
  | "routing"
  | "compliance"
  | "approvals"
  | "integrations"
  | "data"
  | "work_queue"
  | "audit"
  | "security";

export type LaunchReadinessCheck = {
  id: string;
  workspaceId: string;
  category: LaunchReadinessCategory;
  label: string;
  status: "pass" | "warning" | "fail" | "not_checked";
  requiredForLaunch: boolean;
  blockingReason?: string;
  evidence?: Record<string, unknown>;
  lastCheckedAt?: string;
  fixLink?: string;
};

export type WebhookEndpointConfig = {
  id: string;
  workspaceId: string;
  provider: "apination_dotloop" | "rechat";
  endpointTokenHash: string;
  secretHash?: string;
  status: "active" | "paused" | "revoked";
  createdAt: string;
  rotatedAt?: string;
  lastReceivedAt?: string;
};

export type IntegrationSyncRun = {
  id: string;
  workspaceId: string;
  provider: "rechat" | "apination_dotloop";
  syncType: "baseline" | "incremental" | "manual" | "webhook";
  status: "queued" | "running" | "succeeded" | "failed" | "partial";
  startedAt: string;
  completedAt?: string;
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: Array<{
    code: string;
    messageRedacted: string;
    recordId?: string;
  }>;
  checkpoint?: Record<string, unknown>;
};

export type WorkflowEvaluationResult = {
  workspaceId: string;
  sourceEventId: string;
  matchedRecordId?: string;
  actions: Array<{
    type:
      | "create_work_item"
      | "update_work_item"
      | "create_approval"
      | "create_audit"
      | "mark_needs_review"
      | "no_action";
    reason: string;
    payload: Record<string, unknown>;
    requiresApproval: boolean;
  }>;
  riskLevel: "low" | "medium" | "high";
  summary: string;
};

export type WorkspaceLaunchMode =
  | "manual_first"
  | "integration_first"
  | "hybrid";

export type LaunchWaiver = {
  id: string;
  workspaceId: string;
  readinessCheckId: string;
  waivedByUserId: string;
  reason: string;
  expiresAt?: string;
  createdAt: string;
};
