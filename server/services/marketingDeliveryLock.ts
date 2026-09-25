import { createHash } from 'node:crypto';
import pg from 'pg';
import { buildMarketingDispatchKey } from './askNoraDriveDelivery.js';
const localLocks = new Set<string>();
const advisoryPools = new WeakMap<pg.Pool, pg.Pool>();

function advisoryPoolFor(applicationPool: pg.Pool): pg.Pool {
  const existing = advisoryPools.get(applicationPool);
  if (existing) return existing;
  // Session locks must not occupy the pool used by receipt queries: otherwise
  // one lock per application connection deadlocks every concurrent delivery.
  const pool = new pg.Pool({
    ...applicationPool.options,
    // pg intentionally makes password non-enumerable on Pool.options.
    password: applicationPool.options?.password,
    max: Math.min(8, Math.max(1, Number(applicationPool.options?.max) || 3)),
    min: 0,
    allowExitOnIdle: true,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 15000,
  });
  pool.on('error', () => {
    // pg removes a disconnected idle client; never log connection options.
    console.error('[MarketingDelivery] Database lock connection lost.');
  });
  advisoryPools.set(applicationPool, pool);
  return pool;
}

/** Shutdown/isolated test cleanup, after all active delivery locks are released. */
export async function closeMarketingDeliveryLockPool(applicationPool: pg.Pool): Promise<void> {
  const pool = advisoryPools.get(applicationPool);
  if (!pool) return;
  advisoryPools.delete(applicationPool);
  await pool.end();
}


async function deliveryDatabase() {
  const { getDbPool, getStorageDriver } = await import('../persistence/repositories.js');
  const db = getDbPool();
  const mode = (process.env.APP_ENV || process.env.APP_MODE || process.env.NODE_ENV || '').toLowerCase();
  if (!db && (getStorageDriver() === 'database' || ['production', 'staging', 'uat'].includes(mode)
      || process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE))) {
    throw new Error('Database is required for delivery persistence and coordination.');
  }
  return db;
}

function applyPersistedTaskRow(task: any, row: Record<string, any>): void {
  for (const [key, value] of Object.entries(row)) {
    const field = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    task[field] = value instanceof Date ? value.toISOString() : value;
  }
}

async function persistLocalTask(task: any): Promise<void> {
  const { saveCanonicalMarketingTask } = await import('../persistence/marketingCampaignsRepository.js');
  saveCanonicalMarketingTask(task);
}

/** Serialize delivery/receipt checks for a task across application instances. */
export async function acquireMarketingDeliveryLock(workspaceId: string, taskId: string): Promise<(() => Promise<void>) | null> {
  if (!workspaceId || !taskId) throw new Error('Delivery requires a workspace and task.');
  const db = await deliveryDatabase();
  const key = `${workspaceId}:${taskId}`;
  if (!db) {
    if (localLocks.has(key)) return null;
    localLocks.add(key);
    return async () => { localLocks.delete(key); };
  }
  const hash = createHash('sha256').update(key).digest();
  const ids = [hash.readInt32BE(0), hash.readInt32BE(4)];
  const client = await advisoryPoolFor(db).connect();
  try {
    const result = await client.query('SELECT pg_try_advisory_lock($1::integer, $2::integer) AS locked', ids);
    if (!result.rows[0]?.locked) { client.release(); return null; }
  } catch (error) {
    client.release(error instanceof Error ? error : new Error('Lock acquisition failed'));
    throw error;
  }
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    try {
      await client.query('SELECT pg_advisory_unlock($1::integer, $2::integer)', ids);
    } catch (error) {
      client.release(error instanceof Error ? error : new Error('Unlock failed'));
      throw error;
    }
    client.release();
  };
}

/** Read durable delivery state after taking the lock, rather than trusting an instance cache. */
export async function refreshMarketingDeliveryState(task: any): Promise<boolean> {
  const db = await deliveryDatabase();
  if (!db) return true;
  const result = await db.query(
    'SELECT * FROM canonical_marketing_tasks WHERE id = $1 AND workspace_id = $2',
    [task.id, task.workspaceId]
  );
  const row = result.rows[0];
  if (!row) return false;
  applyPersistedTaskRow(task, row);
  if (!task.proofUrl) {
    const current = [...(task.proofHistory || [])].reverse().find((proof: any) => proof?.proofUrl && proof.version === task.proofVersion);
    task.proofUrl = current?.proofUrl;
  }
  return true;
}

type DeliverySnapshotPatch = {
  deliveryAttempt?: Record<string, any>;
  delivery?: Record<string, any>;
  emailConversation?: { threadIds?: string[]; messageIds?: string[]; references?: string[] };
};

const requireScope = (task: any) => {
  if (!task.id || !task.workspaceId) throw new Error('Delivery persistence requires a workspace and task.');
};
const mergeConversation = (existing: any = {}, incoming: any = {}) => ({
  ...existing,
  threadIds: [...new Set([...(existing.threadIds || []), ...(incoming.threadIds || [])])],
  messageIds: [...new Set([...(existing.messageIds || []), ...(incoming.messageIds || [])])],
  references: [...new Set([...(existing.references || []), ...(incoming.references || [])])],
});

/** Patch only delivery-owned fields; never write an old task snapshot over uploads or notes. */
export async function persistMarketingDeliverySnapshot(task: any, patch: DeliverySnapshotPatch): Promise<void> {
  requireScope(task);
  const db = await deliveryDatabase();
  const { emailConversation, ...deliveryFields } = patch;
  if (!db) {
    task.routingSnapshot = { ...(task.routingSnapshot || {}), ...deliveryFields,
      ...(emailConversation ? { emailConversation: mergeConversation(task.routingSnapshot?.emailConversation, emailConversation) } : {}) };
    await persistLocalTask(task);
    return;
  }
  const mergedArray = (key: string) => `(SELECT COALESCE(jsonb_agg(DISTINCT item), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(routing_snapshot->'emailConversation'->'${key}', '[]'::jsonb)
      || COALESCE($4::jsonb->'${key}', '[]'::jsonb)) AS values_to_merge(item))`;
  const result = await db.query(
    `/* marketing_delivery_patch */ UPDATE canonical_marketing_tasks
     SET routing_snapshot = COALESCE(routing_snapshot, '{}'::jsonb) || $3::jsonb ||
       CASE WHEN $4::jsonb IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('emailConversation',
         COALESCE(routing_snapshot->'emailConversation', '{}'::jsonb) || jsonb_build_object(
           'threadIds', ${mergedArray('threadIds')}, 'messageIds', ${mergedArray('messageIds')}, 'references', ${mergedArray('references')}
         )) END,
       updated_at = NOW()
     WHERE id = $1 AND workspace_id = $2
     RETURNING *`,
    [task.id, task.workspaceId, JSON.stringify(deliveryFields), emailConversation ? JSON.stringify(emailConversation) : null]
  );
  if (!result.rows[0]) throw new Error('Task not found in this workspace.');
  applyPersistedTaskRow(task, result.rows[0]);
}

/** Complete only the proof that was actually sent, without overwriting a concurrent revision. */
export async function completeMarketingTaskDelivery(task: any): Promise<boolean> {
  requireScope(task);
  const key = buildMarketingDispatchKey(task);
  const receipt = task.routingSnapshot?.delivery;
  if (receipt?.key !== key || !receipt.messageId || !receipt.acceptedAt) return false;
  const db = await deliveryDatabase();
  if (!db) {
    if (task.reviewState !== 'approved' || task.isArchived) return false;
    task.status = 'completed'; task.completedAt = new Date().toISOString();
    await persistLocalTask(task);
    await completeParentRequest(task, null);
    return true;
  }
  const result = await db.query(
    `/* marketing_delivery_complete */ UPDATE canonical_marketing_tasks
     SET status = 'completed', completed_at = COALESCE(completed_at, NOW()), updated_at = NOW()
     WHERE id = $1 AND workspace_id = $2
       AND COALESCE(proof_version, 0) = $3 AND proof_url IS NOT DISTINCT FROM $4
       AND review_state = 'approved' AND COALESCE(is_archived, FALSE) = FALSE
       AND routing_snapshot->'delivery'->>'key' = $5
       AND LOWER(BTRIM(COALESCE(agent_email, ''))) = $6
       AND COALESCE(routing_snapshot->'delivery'->>'messageId', '') <> ''
     RETURNING *`,
    [task.id, task.workspaceId, task.proofVersion || 0, task.proofUrl || null, key, String(task.agentEmail || '').trim().toLowerCase()]
  );
  if (!result.rows[0]) {
    await refreshMarketingDeliveryState(task);
    return false;
  }
  applyPersistedTaskRow(task, result.rows[0]);
  await completeParentRequest(task, db);
  return true;
}

async function completeParentRequest(task: any, db: any): Promise<void> {
  if (!task.requestId) return;
  const { getCanonicalMarketingRequestById, getAllCanonicalMarketingTasks, saveCanonicalMarketingRequest } = await import('../persistence/marketingCampaignsRepository.js');
  const parent = getCanonicalMarketingRequestById(task.requestId);
  if (db) {
    const result = await db.query(
      `/* marketing_delivery_complete_parent */ UPDATE canonical_marketing_requests AS parent
       SET status = 'completed', updated_at = NOW()
       WHERE parent.id = $1 AND parent.workspace_id = $2 AND COALESCE(parent.is_archived, FALSE) = FALSE
         AND parent.status NOT IN ('archived', 'merged')
         AND EXISTS (SELECT 1 FROM canonical_marketing_tasks AS child WHERE child.request_id = parent.id AND child.workspace_id = parent.workspace_id)
         AND NOT EXISTS (SELECT 1 FROM canonical_marketing_tasks AS child WHERE child.request_id = parent.id
           AND child.workspace_id = parent.workspace_id AND COALESCE(child.status, '') NOT IN ('completed', 'archived') AND COALESCE(child.is_archived, FALSE) = FALSE)
       RETURNING parent.status, parent.updated_at`, [task.requestId, task.workspaceId]
    );
    if (result.rows[0] && parent?.workspaceId === task.workspaceId) {
      parent.status = result.rows[0].status;
      parent.updatedAt = result.rows[0].updated_at instanceof Date ? result.rows[0].updated_at.toISOString() : result.rows[0].updated_at;
    }
  } else if (parent?.workspaceId === task.workspaceId && !parent.isArchived && !['archived', 'merged'].includes(parent.status)) {
    const siblings = getAllCanonicalMarketingTasks().filter(child => child.requestId === task.requestId && child.workspaceId === task.workspaceId);
    if (siblings.length && siblings.every(child => child.status === 'completed' || child.status === 'archived' || child.isArchived)) {
      parent.status = 'completed'; saveCanonicalMarketingRequest(parent);
    }
  }
}

/** Persist before SMTP. A crash/timeout must not silently resend an uncertain delivery. */
export async function beginMarketingDeliveryAttempt(task: any, key: string): Promise<boolean> {
  const previous = task.routingSnapshot?.deliveryAttempt;
  if (previous?.key === key && (previous.status === 'sending' || previous.status === 'accepted')) return false;
  await persistMarketingDeliverySnapshot(task, { deliveryAttempt: { key, status: 'sending', startedAt: new Date().toISOString() } });
  return true;
}

export async function finishMarketingDeliveryAttempt(task: any, key: string, status: 'accepted' | 'failed', messageId?: string): Promise<void> {
  await persistMarketingDeliverySnapshot(task, {
    deliveryAttempt: { ...(task.routingSnapshot?.deliveryAttempt || {}), key, status, messageId, finishedAt: new Date().toISOString() },
    ...(status === 'accepted' && task.routingSnapshot?.delivery?.key === key ? { delivery: task.routingSnapshot.delivery } : {}),
    ...(status === 'accepted' && task.routingSnapshot?.emailConversation ? { emailConversation: task.routingSnapshot.emailConversation } : {}),
  });
}
