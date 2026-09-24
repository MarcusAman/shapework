/**
 * Durable intake tombstones — archive/delete must write these; absence of a task row is not enough.
 */
import { getDbPool } from './repositories.js';
import { normalizePropertyAddress } from '../services/propertyAddressNormalizer.js';

export type TombstoneState = 'live' | 'tombstoned';

export interface IntakeTombstone {
  workspaceId: string;
  scopeKey: string;
  state: TombstoneState;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadIds: string[];
  messageIds: string[];
  doNotReingest: boolean;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const memoryTombstones = new Map<string, IntakeTombstone>();

export function buildTombstoneScopeKey(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadId?: string | null;
}): string {
  const ws = (input.workspaceId || 'ws_wilmington').trim().toLowerCase();
  if (input.requestId) return `${ws}:req:${input.requestId.trim()}`;
  if (input.threadId) return `${ws}:thread:${input.threadId.trim().toLowerCase()}`;
  const addr = (input.propertyAddress || '').trim();
  if (addr) {
    const n = normalizePropertyAddress(addr);
    return `${ws}:addr:${n.searchKey || n.normalized || addr.toLowerCase()}`;
  }
  throw new Error('tombstone scope requires requestId, threadId, or propertyAddress');
}

export async function ensureIntakeTombstoneTable(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS intake_tombstones (
      scope_key TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('live','tombstoned')),
      request_id TEXT,
      property_address TEXT,
      thread_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      message_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      do_not_reingest BOOLEAN NOT NULL DEFAULT TRUE,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_intake_tombstones_ws_state ON intake_tombstones(workspace_id, state);
  `);
}

function rowToTombstone(row: any): IntakeTombstone {
  return {
    workspaceId: row.workspace_id,
    scopeKey: row.scope_key,
    state: row.state,
    requestId: row.request_id,
    propertyAddress: row.property_address,
    threadIds: Array.isArray(row.thread_ids) ? row.thread_ids : [],
    messageIds: Array.isArray(row.message_ids) ? row.message_ids : [],
    doNotReingest: row.do_not_reingest !== false,
    reason: row.reason,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
}

export async function upsertTombstone(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadIds?: string[];
  messageIds?: string[];
  reason?: string;
}): Promise<IntakeTombstone> {
  const workspaceId = input.workspaceId || 'ws_wilmington';
  const scopeKey = buildTombstoneScopeKey({
    workspaceId,
    requestId: input.requestId,
    propertyAddress: input.propertyAddress
  });
  const now = new Date().toISOString();
  const existing = memoryTombstones.get(scopeKey);
  const tomb: IntakeTombstone = {
    workspaceId,
    scopeKey,
    state: 'tombstoned',
    requestId: input.requestId || existing?.requestId || null,
    propertyAddress: input.propertyAddress || existing?.propertyAddress || null,
    threadIds: Array.from(new Set([...(existing?.threadIds || []), ...(input.threadIds || [])])),
    messageIds: Array.from(new Set([...(existing?.messageIds || []), ...(input.messageIds || [])])),
    doNotReingest: true,
    reason: input.reason || existing?.reason || 'archived',
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  memoryTombstones.set(scopeKey, tomb);

  const pool = getDbPool();
  if (pool) {
    try {
      await ensureIntakeTombstoneTable();
      await pool.query(
        `INSERT INTO intake_tombstones (
           scope_key, workspace_id, state, request_id, property_address,
           thread_ids, message_ids, do_not_reingest, reason, created_at, updated_at
         ) VALUES ($1,$2,'tombstoned',$3,$4,$5::jsonb,$6::jsonb,TRUE,$7,NOW(),NOW())
         ON CONFLICT (scope_key) DO UPDATE SET
           state = 'tombstoned',
           request_id = COALESCE(EXCLUDED.request_id, intake_tombstones.request_id),
           property_address = COALESCE(EXCLUDED.property_address, intake_tombstones.property_address),
           thread_ids = (
             SELECT jsonb_agg(DISTINCT v) FROM jsonb_array_elements(
               COALESCE(intake_tombstones.thread_ids, '[]'::jsonb) || EXCLUDED.thread_ids
             ) AS v
           ),
           message_ids = (
             SELECT jsonb_agg(DISTINCT v) FROM jsonb_array_elements(
               COALESCE(intake_tombstones.message_ids, '[]'::jsonb) || EXCLUDED.message_ids
             ) AS v
           ),
           do_not_reingest = TRUE,
           reason = COALESCE(EXCLUDED.reason, intake_tombstones.reason),
           updated_at = NOW()`,
        [
          scopeKey,
          workspaceId,
          tomb.requestId,
          tomb.propertyAddress,
          JSON.stringify(tomb.threadIds),
          JSON.stringify(tomb.messageIds),
          tomb.reason
        ]
      );
    } catch (err: any) {
      console.warn('[intakeTombstone] persist failed; memory tombstone retained:', err?.message || err);
    }
  }
  return tomb;
}

export async function isTombstoned(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadId?: string | null;
  messageId?: string | null;
}): Promise<IntakeTombstone | null> {
  const workspaceId = input.workspaceId || 'ws_wilmington';
  const keys: string[] = [];
  try {
    if (input.requestId) keys.push(buildTombstoneScopeKey({ workspaceId, requestId: input.requestId }));
  } catch {}
  try {
    if (input.propertyAddress) keys.push(buildTombstoneScopeKey({ workspaceId, propertyAddress: input.propertyAddress }));
  } catch {}
  try {
    if (input.threadId) keys.push(buildTombstoneScopeKey({ workspaceId, threadId: input.threadId }));
  } catch {}

  for (const k of keys) {
    const mem = memoryTombstones.get(k);
    if (mem?.state === 'tombstoned') return mem;
  }

  // message-id / thread / address scan in memory (scope may be request-keyed)
  let addrKey: string | null = null;
  try {
    if (input.propertyAddress) addrKey = buildTombstoneScopeKey({ workspaceId, propertyAddress: input.propertyAddress });
  } catch {}
  for (const mem of memoryTombstones.values()) {
    if (mem.state !== 'tombstoned') continue;
    if (input.messageId && mem.messageIds.map(m => m.toLowerCase()).includes(input.messageId.toLowerCase())) return mem;
    if (input.threadId && mem.threadIds.map(t => t.toLowerCase()).includes(input.threadId.toLowerCase())) return mem;
    if (input.propertyAddress && mem.propertyAddress) {
      try {
        const memAddrKey = buildTombstoneScopeKey({ workspaceId: mem.workspaceId, propertyAddress: mem.propertyAddress });
        if (addrKey && memAddrKey === addrKey) return mem;
      } catch {}
    }
  }

  const pool = getDbPool();
  if (!pool) return null;
  try {
    await ensureIntakeTombstoneTable();
    if (keys.length) {
      const res = await pool.query(
        `SELECT * FROM intake_tombstones WHERE state = 'tombstoned' AND scope_key = ANY($1::text[]) LIMIT 1`,
        [keys]
      );
      if (res.rows[0]) {
        const t = rowToTombstone(res.rows[0]);
        memoryTombstones.set(t.scopeKey, t);
        return t;
      }
    }
    if (input.messageId || input.threadId) {
      const res = await pool.query(
        `SELECT * FROM intake_tombstones
         WHERE state = 'tombstoned' AND workspace_id = $1
           AND (
             ($2::text IS NOT NULL AND message_ids @> to_jsonb($2::text))
             OR ($3::text IS NOT NULL AND thread_ids @> to_jsonb($3::text))
           )
         LIMIT 1`,
        [workspaceId, input.messageId || null, input.threadId || null]
      );
      if (res.rows[0]) {
        const t = rowToTombstone(res.rows[0]);
        memoryTombstones.set(t.scopeKey, t);
        return t;
      }
    }
  } catch (err: any) {
    console.warn('[intakeTombstone] lookup failed:', err?.message || err);
  }
  return null;
}

export async function cancelOutboxForTombstoneScope(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
}): Promise<{ emailOutboxCancelled: number; noraOutboxCancelled: number; idempotencySuperseded: number }> {
  const pool = getDbPool();
  const workspaceId = input.workspaceId || 'ws_wilmington';
  let emailOutboxCancelled = 0;
  let noraOutboxCancelled = 0;
  let idempotencySuperseded = 0;
  if (!pool) return { emailOutboxCancelled, noraOutboxCancelled, idempotencySuperseded };
  const addr = (input.propertyAddress || '').trim();
  const addrNeedle = addr ? `%${addr.split(',')[0].trim()}%` : null;
  try {
    if (addrNeedle) {
      const r1 = await pool.query(
        `UPDATE outbound_email_outbox
         SET status = 'cancelled', updated_at = NOW(), last_error_code = 'tombstoned'
         WHERE workspace_id = $1 AND status IN ('pending','sending','failed')
           AND (subject ILIKE $2 OR payload::text ILIKE $2 OR idempotency_key ILIKE $2)`,
        [workspaceId, addrNeedle]
      );
      emailOutboxCancelled += r1.rowCount || 0;
      const r2 = await pool.query(
        `UPDATE nora_outbound_event_outbox
         SET state = 'cancelled', updated_at = NOW(), error_message = 'tombstoned'
         WHERE workspace_id = $1 AND state IN ('pending','retryable_failure')
           AND (subject ILIKE $2 OR payload::text ILIKE $2 OR idempotency_key ILIKE $2 OR ($3::text IS NOT NULL AND entity_id = $3))`,
        [workspaceId, addrNeedle, input.requestId || null]
      );
      noraOutboxCancelled += r2.rowCount || 0;
    }
    if (input.requestId) {
      const r3 = await pool.query(
        `UPDATE inbound_email_idempotency_log
         SET processing_status = 'superseded', updated_at = NOW(), last_error_code = COALESCE(last_error_code, 'tombstoned')
         WHERE request_id = $1 AND processing_status IN ('completed','processing','claimed','pending')`,
        [input.requestId]
      );
      idempotencySuperseded += r3.rowCount || 0;
    }
  } catch (err: any) {
    console.warn('[intakeTombstone] outbox cancel failed:', err?.message || err);
  }
  return { emailOutboxCancelled, noraOutboxCancelled, idempotencySuperseded };
}


export async function tombstoneIntakeScope(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadIds?: string[];
  messageIds?: string[];
  reason?: string;
}): Promise<IntakeTombstone> {
  const tomb = await upsertTombstone(input);
  await cancelOutboxForTombstoneScope({
    workspaceId: input.workspaceId,
    requestId: input.requestId,
    propertyAddress: input.propertyAddress,
  });
  return tomb;
}

export async function removeTombstone(input: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadId?: string | null;
}): Promise<void> {
  const workspaceId = input.workspaceId || 'ws_wilmington';
  const pool = getDbPool();
  try {
    const scopeKey = buildTombstoneScopeKey({
      workspaceId,
      requestId: input.requestId,
      propertyAddress: input.propertyAddress,
      threadId: input.threadId
    });
    memoryTombstones.delete(scopeKey);
    if (pool) {
      await pool.query(`DELETE FROM intake_tombstones WHERE scope_key = $1`, [scopeKey]);
    }
  } catch {}
}

/** Test helper */
export function _resetTombstonesForTests() {
  memoryTombstones.clear();
}
