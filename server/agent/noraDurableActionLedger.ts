/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Durable Action Ledger
 * Synchronous, durable persistence and restart-proof idempotency tracking
 * for HIGH-risk actions (vendor dispatches, external SMS).
 * Supports PostgreSQL table 'nora_durable_actions' with local JSONL file fallback.
 */

import fs from 'fs';
import path from 'path';
import { dbPool, storageDriver } from '../persistence/repositories.js';
import { NoraActionResult } from './types.js';

export interface DurableActionRecord {
  id: string;
  requestId: string;
  idempotencyKey: string;
  authenticatedUserId: string;
  tenantId: string;
  workspaceId: string;
  actionName: string;
  entityId?: string;
  normalizedArgs: Record<string, any>;
  externalProviderId?: string;
  executionTimestamp: string;
  verificationStatus: boolean;
  finalResultStatus: string;
  humanReadableSummary: string;
  cachedResult?: NoraActionResult;
}

export class NoraDurableActionLedger {
  private static readonly LEDGER_FILE_DIR = path.join(process.cwd(), 'data');
  private static readonly LEDGER_FILE_PATH = path.join(process.cwd(), 'data', 'nora_durable_actions.jsonl');
  private static inMemoryStore: Map<string, DurableActionRecord> = new Map();

  private static ensureStorageDir() {
    try {
      if (!fs.existsSync(this.LEDGER_FILE_DIR)) {
        fs.mkdirSync(this.LEDGER_FILE_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[Durable Action Ledger] Failed to create data dir:', err);
    }
  }

  /**
   * Clears in-memory ledger for isolated unit tests.
   */
  public static clearForTesting() {
    this.inMemoryStore.clear();
    try {
      if (fs.existsSync(this.LEDGER_FILE_PATH)) {
        fs.unlinkSync(this.LEDGER_FILE_PATH);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Finds an existing action record by its deterministic idempotency key.
   */
  public static async findAction(idempotencyKey: string): Promise<DurableActionRecord | null> {
    // 1. Check in-memory store
    if (this.inMemoryStore.has(idempotencyKey)) {
      return this.inMemoryStore.get(idempotencyKey)!;
    }

    // 2. Check PostgreSQL if database driver active
    if (storageDriver === 'database' && dbPool) {
      try {
        const res = await dbPool.query(
          `SELECT * FROM nora_durable_actions WHERE idempotency_key = $1 LIMIT 1`,
          [idempotencyKey]
        );
        if (res.rows && res.rows.length > 0) {
          const row = res.rows[0];
          const record: DurableActionRecord = {
            id: row.id,
            requestId: row.request_id,
            idempotencyKey: row.idempotency_key,
            authenticatedUserId: row.authenticated_user_id,
            tenantId: row.tenant_id,
            workspaceId: row.workspace_id,
            actionName: row.action_name,
            entityId: row.entity_id,
            normalizedArgs: typeof row.normalized_args === 'string' ? JSON.parse(row.normalized_args) : row.normalized_args,
            externalProviderId: row.external_provider_id,
            executionTimestamp: row.execution_timestamp?.toISOString ? row.execution_timestamp.toISOString() : String(row.execution_timestamp),
            verificationStatus: Boolean(row.verification_status),
            finalResultStatus: row.final_result_status,
            humanReadableSummary: row.human_readable_summary || 'Previously recorded action'
          };
          this.inMemoryStore.set(idempotencyKey, record);
          return record;
        }
      } catch (dbErr) {
        console.warn('[Durable Action Ledger] PostgreSQL lookup failed, checking file fallback:', dbErr);
      }
    }

    // 3. Check JSONL file fallback
    try {
      if (fs.existsSync(this.LEDGER_FILE_PATH)) {
        const content = fs.readFileSync(this.LEDGER_FILE_PATH, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line) as DurableActionRecord;
            if (entry.idempotencyKey === idempotencyKey) {
              this.inMemoryStore.set(idempotencyKey, entry);
              return entry;
            }
          } catch {
            // ignore corrupt line
          }
        }
      }
    } catch (fsErr) {
      console.warn('[Durable Action Ledger] File lookup error:', fsErr);
    }

    return null;
  }

  /**
   * Persists an action execution record durably before reporting success.
   */
  public static async recordAction(record: DurableActionRecord): Promise<void> {
    // 1. Update in-memory map
    this.inMemoryStore.set(record.idempotencyKey, record);

    // 2. Append to durable JSONL file
    try {
      this.ensureStorageDir();
      const serialized = JSON.stringify(record) + '\n';
      fs.appendFileSync(this.LEDGER_FILE_PATH, serialized, 'utf-8');
    } catch (fsErr) {
      console.warn('[Durable Action Ledger] Failed to append to file ledger:', fsErr);
    }

    // 3. Write to PostgreSQL if active
    if (storageDriver === 'database' && dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO nora_durable_actions (
            id, request_id, idempotency_key, authenticated_user_id, tenant_id, workspace_id,
            action_name, entity_id, normalized_args, external_provider_id,
            execution_timestamp, verification_status, final_result_status, human_readable_summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (idempotency_key) DO NOTHING`,
          [
            record.id,
            record.requestId,
            record.idempotencyKey,
            record.authenticatedUserId,
            record.tenantId,
            record.workspaceId,
            record.actionName,
            record.entityId || null,
            JSON.stringify(record.normalizedArgs),
            record.externalProviderId || null,
            record.executionTimestamp,
            record.verificationStatus,
            record.finalResultStatus,
            record.humanReadableSummary
          ]
        );
      } catch (dbErr) {
        console.warn('[Durable Action Ledger] Failed to insert into PostgreSQL table:', dbErr);
      }
    }
  }
}
