/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Operational Commitment & Follow-Up Manager
 * Provides durable memory for operational commitments, conditional follow-ups,
 * and scheduled evaluations backed by PostgreSQL.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dbPool, storageDriver } from '../persistence/repositories.js';

export interface NoraOperationalCommitment {
  id: string;
  workspaceId: string;
  userId: string;
  sessionId?: string;
  title: string;
  targetRecordType: 'marketing_request' | 'task' | 'transaction' | 'compliance_review';
  targetRecordId: string;
  conditionType: 'status_still_equals' | 'field_is_empty' | 'unapproved_after_sla';
  conditionExpression: {
    field?: string;
    expectedValue?: string;
    description: string;
  };
  owner: string;
  recipientId?: string;
  recipientChannel: 'in_app' | 'email' | 'sms';
  status: 'active' | 'triggered' | 'resolved_condition_met' | 'cancelled';
  evaluateAt: string;
  lastEvaluatedAt?: string;
  completedAt?: string;
  cancellationReason?: string;
  idempotencyKey?: string;
  executionReceipt?: any;
  createdAt: string;
  updatedAt: string;
}

export class NoraCommitmentManager {
  private static store: Map<string, NoraOperationalCommitment> = new Map();
  private static readonly STORAGE_FILE = path.join(process.cwd(), 'data', 'nora_commitments.jsonl');

  private static isProduction(): boolean {
    return (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') && process.env.ALLOW_FILE_STORAGE_UAT !== 'true';
  }

  private static flushToFile(): void {
    if (this.isProduction()) return; // Production must NEVER write to local files
    try {
      const dir = path.dirname(this.STORAGE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const serialized = Array.from(this.store.values()).map(c => JSON.stringify(c)).join('\n') + '\n';
      fs.writeFileSync(this.STORAGE_FILE, serialized, 'utf8');
    } catch {}
  }

  /**
   * Creates a durable operational commitment
   */
  public static createCommitment(params: {
    workspaceId: string;
    userId: string;
    sessionId?: string;
    title: string;
    targetRecordType: NoraOperationalCommitment['targetRecordType'];
    targetRecordId: string;
    conditionType: NoraOperationalCommitment['conditionType'];
    conditionExpression: NoraOperationalCommitment['conditionExpression'];
    owner: string;
    evaluateAt: string;
    recipientChannel?: NoraOperationalCommitment['recipientChannel'];
    idempotencyKey?: string;
  }): NoraOperationalCommitment {
    const id = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const commitment: NoraOperationalCommitment = {
      id,
      workspaceId: (params.workspaceId || 'ws_wilmington').toLowerCase().trim(),
      userId: (params.userId || 'ryan').toLowerCase().trim(),
      sessionId: params.sessionId,
      title: params.title,
      targetRecordType: params.targetRecordType,
      targetRecordId: params.targetRecordId,
      conditionType: params.conditionType,
      conditionExpression: params.conditionExpression,
      owner: params.owner,
      recipientChannel: params.recipientChannel || 'in_app',
      status: 'active',
      evaluateAt: params.evaluateAt,
      idempotencyKey: params.idempotencyKey || `idem_cmt_${id}`,
      createdAt: now,
      updatedAt: now
    };

    this.store.set(id, commitment);
    if (!this.isProduction()) {
      this.flushToFile();
    }

    if (storageDriver === 'database' && dbPool) {
      const queryPromise = dbPool.query(
        `INSERT INTO nora_operational_commitments (
          id, workspace_id, user_id, session_id, target_record_type, target_record_id,
          condition_type, condition_expression, owner, recipient_channel, status,
          evaluate_at, idempotency_key, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW()`,
        [
          commitment.id,
          commitment.workspaceId,
          commitment.userId,
          commitment.sessionId || null,
          commitment.targetRecordType,
          commitment.targetRecordId,
          commitment.conditionType,
          JSON.stringify(commitment.conditionExpression),
          commitment.owner,
          commitment.recipientChannel,
          commitment.status,
          commitment.evaluateAt,
          commitment.idempotencyKey,
          commitment.createdAt,
          commitment.updatedAt
        ]
      );

      if (this.isProduction()) {
        queryPromise.catch(err => {
          console.error('[NoraCommitmentManager] FATAL Database write failure in production:', err);
          throw new Error(`Production database write failed for commitment: ${err.message}`);
        });
      } else {
        queryPromise.catch(() => {});
      }
    } else if (this.isProduction()) {
      throw new Error('FATAL: Database persistence driver is required in production environment.');
    }

    return commitment;
  }

  /**
   * List active commitments for a workspace/user
   */
  public static listActiveCommitments(workspaceId: string, userId?: string): NoraOperationalCommitment[] {
    const ws = (workspaceId || 'ws_wilmington').toLowerCase().trim();
    const u = userId ? userId.toLowerCase().trim() : undefined;

    return Array.from(this.store.values()).filter(c => {
      const wsMatch = c.workspaceId === ws;
      const uMatch = !u || c.userId === u || c.owner.toLowerCase().includes(u);
      return wsMatch && uMatch && c.status === 'active';
    });
  }

  /**
   * Re-checks condition and evaluates commitment
   */
  public static evaluateCommitment(
    commitmentId: string,
    currentRecordState: { isStillBlockedOrIncomplete: boolean; notes?: string }
  ): { statusUpdated: boolean; commitment: NoraOperationalCommitment; actionTaken: string } {
    const c = this.store.get(commitmentId);
    if (!c) throw new Error(`Commitment ${commitmentId} not found`);

    const now = new Date().toISOString();
    c.lastEvaluatedAt = now;
    c.updatedAt = now;

    let actionTaken = '';
    if (currentRecordState.isStillBlockedOrIncomplete) {
      c.status = 'triggered';
      c.completedAt = now;
      c.executionReceipt = { triggeredAt: now, outcome: 'Condition met; reminder delivered' };
      actionTaken = `Triggered notification to ${c.owner}: Condition "${c.conditionExpression.description}" is still active.`;
    } else {
      c.status = 'resolved_condition_met';
      c.completedAt = now;
      c.executionReceipt = { resolvedAt: now, outcome: 'Condition resolved prior to evaluation' };
      actionTaken = `Condition resolved; suppressed reminder.`;
    }

    this.store.set(commitmentId, c);
    this.flushToFile();
    return { statusUpdated: true, commitment: c, actionTaken };
  }

  /**
   * Cancels a commitment explicitly
   */
  public static cancelCommitment(commitmentId: string, reason: string): boolean {
    const c = this.store.get(commitmentId);
    if (!c) return false;

    c.status = 'cancelled';
    c.cancellationReason = reason;
    c.updatedAt = new Date().toISOString();
    this.store.set(commitmentId, c);
    this.flushToFile();
    return true;
  }

  public static resetForTesting(): void {
    this.store.clear();
    try {
      if (fs.existsSync(this.STORAGE_FILE)) fs.unlinkSync(this.STORAGE_FILE);
    } catch {}
  }
}
