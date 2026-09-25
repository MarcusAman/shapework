import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type pg from 'pg';
import { getDbPool, getStorageDriver } from '../persistence/repositories.js';

export interface AssetScope { workspaceId: string; taskId?: string }
export interface SaveListingMediaAssetParams extends AssetScope {
  filename: string;
  contentType: string;
  buffer: Buffer;
  propertyAddress?: string;
  metadata?: Record<string, any>;
}
export interface StoredListingMediaAsset extends AssetScope {
  id: string;
  filename: string;
  storageFilename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  propertyAddress?: string;
  createdAt: string;
  metadata: Record<string, any>;
}
export interface RetrievedMediaAsset extends StoredListingMediaAsset { buffer: Buffer }

// Used only when explicitly running without database persistence outside production.
const memoryAssets = new Map<string, RetrievedMediaAsset>();
export const computeAssetSha256 = (buffer: Buffer): string => crypto.createHash('sha256').update(buffer).digest('hex');

export function requireAssetScope(scope?: AssetScope): AssetScope {
  if (!scope?.workspaceId || !scope.workspaceId.trim()) throw new Error('ASSET_WORKSPACE_REQUIRED');
  return { workspaceId: scope.workspaceId.trim(), ...(scope.taskId ? { taskId: scope.taskId } : {}) };
}

export function getAssetDbPool(): pg.Pool | null {
  const pool = getDbPool();
  if (pool) return pool;
  const mode = (process.env.APP_ENV || process.env.APP_MODE || process.env.NODE_ENV || '').toLowerCase();
  if (getStorageDriver() === 'database' || ['production', 'staging', 'uat'].includes(mode) || process.env.NODE_ENV === 'production' || process.env.K_SERVICE) {
    throw new Error('DURABLE_ASSET_DATABASE_REQUIRED');
  }
  return null;
}

export function isSafeAssetFilename(filename: string): boolean {
  return typeof filename === 'string' && !!filename && filename.length <= 255 && filename !== '.' && filename !== '..'
    && path.basename(filename) === filename && !/[\\/\x00-\x1f\x7f]/.test(filename);
}

function cacheAsset(asset: RetrievedMediaAsset): void {
  if (!isSafeAssetFilename(asset.storageFilename)) throw new Error('INVALID_ASSET_FILENAME');
  // Never cache by the user supplied name: identical names in two tasks must not overwrite.
  for (const dirName of ['public', 'dist']) {
    try {
      const dir = path.join(process.cwd(), dirName, 'uploads');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, asset.storageFilename), asset.buffer);
    } catch (error) {
      console.warn('[ListingMediaStorage] Cache write failed; durable bytes remain available.', error instanceof Error ? error.message : error);
    }
  }
}

function matchesScope(asset: RetrievedMediaAsset, scope: AssetScope): boolean {
  return asset.workspaceId === scope.workspaceId && (!scope.taskId || !asset.taskId || asset.taskId === scope.taskId);
}

function fromRow(row: any): RetrievedMediaAsset {
  const buffer = Buffer.from(row.data_base64, 'base64');
  if (buffer.length !== Number(row.size_bytes) || computeAssetSha256(buffer) !== row.sha256_checksum) {
    throw new Error('ASSET_INTEGRITY_CHECK_FAILED');
  }
  const storageFilename = row.storage_filename || row.filename;
  if (!isSafeAssetFilename(storageFilename)) throw new Error('INVALID_ASSET_FILENAME');
  const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
  return {
    id: row.id, filename: row.filename, storageFilename,
    workspaceId: row.workspace_id, taskId: row.task_id || undefined,
    contentType: row.content_type, sizeBytes: Number(row.size_bytes), sha256: row.sha256_checksum,
    buffer, url: `/uploads/${encodeURIComponent(storageFilename)}`,
    createdAt: new Date(row.created_at).toISOString(), propertyAddress: metadata.propertyAddress || undefined,
    metadata: { ...metadata, workspaceId: row.workspace_id, ...(row.task_id ? { taskId: row.task_id } : {}) }
  };
}

export async function saveListingMediaAsset(params: SaveListingMediaAssetParams): Promise<StoredListingMediaAsset> {
  const scope = requireAssetScope(params);
  if (!isSafeAssetFilename(params.filename)) throw new Error('INVALID_ASSET_FILENAME');
  if (!Buffer.isBuffer(params.buffer) || params.buffer.length === 0) throw new Error('ASSET_BYTES_REQUIRED');
  if (!/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(params.contentType)) throw new Error('INVALID_ASSET_CONTENT_TYPE');
  const id = `asset_${crypto.randomUUID()}`;
  const ext = path.extname(params.filename).slice(0, 16).replace(/[^a-zA-Z0-9.]/g, '');
  const storageFilename = `${id}${ext}`;
  const metadata = { ...params.metadata, ...scope, propertyAddress: params.propertyAddress || params.metadata?.propertyAddress || null };
  const asset: RetrievedMediaAsset = {
    ...scope, id, filename: params.filename, storageFilename, contentType: params.contentType,
    buffer: Buffer.from(params.buffer), sizeBytes: params.buffer.length, sha256: computeAssetSha256(params.buffer),
    url: `/uploads/${storageFilename}`, createdAt: new Date().toISOString(), propertyAddress: params.propertyAddress, metadata
  };
  const pool = getAssetDbPool();
  if (pool) {
    // A failed insert must propagate. Disk and memory are caches, never an acknowledgement of durability.
    await pool.query(`INSERT INTO durable_uploaded_assets
      (id, filename, storage_filename, workspace_id, task_id, content_type, size_bytes, sha256_checksum, data_base64, storage_driver, created_at, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'database',$10,$11::jsonb)`,
    [id, asset.filename, storageFilename, scope.workspaceId, scope.taskId || null, asset.contentType,
      asset.sizeBytes, asset.sha256, asset.buffer.toString('base64'), asset.createdAt, JSON.stringify(metadata)]);
  } else {
    memoryAssets.set(id, asset);
  }
  cacheAsset(asset);
  const { buffer: _buffer, ...stored } = asset;
  return stored;
}

async function retrieveAsset(value: string, byId: boolean, scope?: AssetScope): Promise<RetrievedMediaAsset | null> {
  if (!scope?.workspaceId) return null;
  const cleanScope = requireAssetScope(scope);
  if (!byId && !isSafeAssetFilename(value)) return null;
  const pool = getAssetDbPool();
  let asset: RetrievedMediaAsset | undefined;
  if (pool) {
    // Always authorize against database ownership; an old local file is never authority.
    const res = await pool.query(`SELECT * FROM durable_uploaded_assets
      WHERE workspace_id = $1 AND ($2::text IS NULL OR task_id IS NULL OR task_id = $2)
      AND ${byId ? 'id = $3' : '(storage_filename = $3 OR filename = $3)'} LIMIT 2`,
    [cleanScope.workspaceId, cleanScope.taskId || null, value]);
    // Ambiguous legacy filenames fail closed instead of exposing the most recent upload.
    if (res.rows.length !== 1) return null;
    asset = fromRow(res.rows[0]);
  } else {
    const matches = [...memoryAssets.values()].filter(a => matchesScope(a, cleanScope) &&
      (byId ? a.id === value : a.storageFilename === value || a.filename === value));
    if (matches.length !== 1) return null;
    asset = matches[0];
  }
  if (!matchesScope(asset, cleanScope)) return null;
  cacheAsset(asset);
  return { ...asset, buffer: Buffer.from(asset.buffer) };
}

export const getListingMediaAsset = (filename: string, scope?: AssetScope): Promise<RetrievedMediaAsset | null> => retrieveAsset(filename, false, scope);
export const getListingMediaAssetById = (id: string, scope?: AssetScope): Promise<RetrievedMediaAsset | null> => retrieveAsset(id, true, scope);
export function purgeListingMediaMemory(): void { memoryAssets.clear(); }
