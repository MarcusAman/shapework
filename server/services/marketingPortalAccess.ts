import crypto from 'crypto';
import {
  getAllCanonicalMarketingTasks, getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask, persistTaskToDatabase,
  type CanonicalMarketingTask,
} from '../persistence/marketingCampaignsRepository.js';
import { getDbPool, getStorageDriver } from '../persistence/repositories.js';

const TOKEN_PATTERN = /^mpt_[a-f0-9]{64}$/;
const PORTAL_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

export function marketingPortalRequiresDatabase(): boolean {
  const mode = (process.env.APP_ENV || process.env.APP_MODE || process.env.NODE_ENV || '').toLowerCase();
  return getStorageDriver() === 'database' || ['production', 'staging', 'uat'].includes(mode)
    || process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);
}

export function getMarketingPortalDbPool() {
  const pool = getDbPool();
  if (!pool && marketingPortalRequiresDatabase()) throw new Error('Database is required for marketing portal access.');
  return pool;
}

/** Updating the cache must not trigger another full-row database save. */
export function refreshMarketingPortalCache(task: CanonicalMarketingTask, fields: string[]): void {
  const cached = getCanonicalMarketingTaskById(task.id);
  if (cached?.workspaceId !== task.workspaceId) return;
  for (const field of fields) (cached as any)[field] = (task as any)[field];
}

/** Hydrate persisted task fields without discarding routing metadata on cold start. */
export function hydrateMarketingPortalTask(row: Record<string, any>): CanonicalMarketingTask {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
    value instanceof Date ? value.toISOString() : value,
  ])) as CanonicalMarketingTask;
}

function validPortal(task: CanonicalMarketingTask, token?: string): boolean {
  const portal = task.routingSnapshot?.clientPortal;
  return Boolean(task.workspaceId && !task.isArchived && task.status !== 'archived' &&
    TOKEN_PATTERN.test(portal?.token || '') &&
    (!token || portal.token === token) && !portal.revokedAt &&
    Date.parse(portal.expiresAt) > Date.now());
}

/** A random capability saved before it is included in an email. No public task-ID fallback. */
export async function ensureMarketingPortalToken(taskId: string): Promise<string> {
  let task = getCanonicalMarketingTaskById(taskId);
  const pool = getMarketingPortalDbPool();
  if (pool) {
    const result = await pool.query('SELECT * FROM canonical_marketing_tasks WHERE id = $1', [taskId]);
    task = result.rows[0] ? hydrateMarketingPortalTask(result.rows[0]) : null;
  }
  if (!task?.workspaceId || task.isArchived || task.status === 'archived') throw new Error('A saved, scoped marketing task is required.');
  if (validPortal(task)) return task.routingSnapshot!.clientPortal.token;

  const portal = {
    token: `mpt_${crypto.randomBytes(32).toString('hex')}`,
    expiresAt: new Date(Date.now() + PORTAL_LIFETIME_MS).toISOString(),
  };
  if (pool) {
    // Atomic issuance: a concurrent caller keeps the same already-issued valid capability.
    const result = await pool.query(`UPDATE canonical_marketing_tasks SET routing_snapshot =
      jsonb_set(COALESCE(routing_snapshot, '{}'::jsonb), '{clientPortal}',
        CASE WHEN routing_snapshot->'clientPortal'->>'token' ~ '^mpt_[a-f0-9]{64}$'
          AND COALESCE(routing_snapshot->'clientPortal'->>'expiresAt', '') > $4
          AND routing_snapshot->'clientPortal'->>'revokedAt' IS NULL
        THEN routing_snapshot->'clientPortal' ELSE $3::jsonb END)
      WHERE id = $1 AND workspace_id = $2 AND COALESCE(is_archived, false) = false AND status <> 'archived'
      RETURNING routing_snapshot`, [task.id, task.workspaceId, JSON.stringify(portal), new Date().toISOString()]);
    if (!result.rows[0]) throw new Error('Marketing task is unavailable.');
    task.routingSnapshot = result.rows[0].routing_snapshot;
    // Refresh an existing in-process object without a second stale database write.
    const cached = getCanonicalMarketingTaskById(task.id);
    if (cached?.workspaceId === task.workspaceId) cached.routingSnapshot = task.routingSnapshot;
    return task.routingSnapshot!.clientPortal.token;
  }
  task.routingSnapshot = { ...task.routingSnapshot, clientPortal: portal };
  saveCanonicalMarketingTask(task);
  await persistTaskToDatabase(task);
  return portal.token;
}

export async function resolveMarketingPortalTask(token: string): Promise<CanonicalMarketingTask | null> {
  if (!TOKEN_PATTERN.test(token || '')) return null;
  const pool = getDbPool();
  if (pool) {
    const result = await pool.query(`SELECT * FROM canonical_marketing_tasks
      WHERE routing_snapshot->'clientPortal'->>'token' = $1
        AND COALESCE(is_archived, false) = false LIMIT 1`, [token]);
    const task = result.rows[0] ? hydrateMarketingPortalTask(result.rows[0]) : null;
    return task && validPortal(task, token) ? task : null;
  }
  if (marketingPortalRequiresDatabase()) return null;
  return getAllCanonicalMarketingTasks().find(task => validPortal(task, token)) || null;
}

export function hasApprovedCurrentProof(task: CanonicalMarketingTask): boolean {
  return task.reviewState === 'approved' && Boolean(task.proofUrl) &&
    Boolean(task.reviewHistory?.some(entry => entry.action === 'approved' &&
      entry.version === (task.proofVersion || 1)));
}

export function internalAssetFilename(url: string): string | null {
  try {
    const parsed = new URL(url, 'https://shapework.co');
    // Only our own uploads namespace is an internal asset reference.
    const publicOrigin = new URL(process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://shapework.co').origin;
    if (!['https://shapework.co', publicOrigin].includes(parsed.origin)) return null;
    if (!parsed.pathname.startsWith('/uploads/')) return null;
    const filename = decodeURIComponent(parsed.pathname.slice('/uploads/'.length));
    if (!filename || /[\\/\x00]/.test(filename) || filename === '.' || filename === '..') return null;
    return filename;
  } catch { return null; }
}

export function safeExternalAssetUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}
