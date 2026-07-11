/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JobType =
  | "rechat_baseline_sync"
  | "rechat_incremental_sync"
  | "dotloop_webhook_process"
  | "record_match"
  | "workflow_evaluate"
  | "approval_execute"
  | "launch_readiness_check"
  | "audit_write";

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "retrying"
  | "dead_letter";

export interface Job {
  id: string;
  workspaceId: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  lastErrorRedacted?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}
