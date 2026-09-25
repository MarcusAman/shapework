import crypto from 'crypto';
import {
  saveListingMediaAsset, getListingMediaAsset, getListingMediaAssetById, computeAssetSha256,
  getAssetDbPool, requireAssetScope, purgeListingMediaMemory,
  type AssetScope, type SaveListingMediaAssetParams, type RetrievedMediaAsset
} from '../services/listingMediaStorageService.js';

export { computeAssetSha256 as computeSha256 };
export type { AssetScope };
export type DurableAsset = Omit<RetrievedMediaAsset, 'buffer'> & { sha256Checksum: string; dataBase64: string };
export interface AssetDownloadToken {
  id: string;
  token?: string;
  assetId: string;
  filename: string;
  workspaceId: string;
  taskId?: string;
  expiresAt: string;
  isRevoked: boolean;
  downloadCount: number;
  createdAt: string;
  revokedAt?: string;
  revokedBy?: string;
}
type TokenResult = { valid: true; tokenRecord: AssetDownloadToken; asset: DurableAsset }
  | { valid: false; reason: 'invalid' | 'expired' | 'revoked' | 'asset_missing' };
const memoryTokens = new Map<string, AssetDownloadToken>();
const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');
const validBearer = (token: string): boolean => /^dl_[A-Za-z0-9_-]{43}$/.test(token);

function toDurable(asset: RetrievedMediaAsset): DurableAsset {
  const { buffer, ...rest } = asset;
  return { ...rest, sha256Checksum: asset.sha256, dataBase64: buffer.toString('base64') };
}

export async function saveDurableAssetAsync(input: SaveListingMediaAssetParams): Promise<DurableAsset> {
  const saved = await saveListingMediaAsset(input);
  return { ...saved, sha256Checksum: saved.sha256, dataBase64: input.buffer.toString('base64') };
}
export async function getDurableAssetByFilenameAsync(filename: string, scope?: AssetScope): Promise<DurableAsset | null> {
  const asset = await getListingMediaAsset(filename, scope);
  return asset ? toDurable(asset) : null;
}
export async function getDurableAssetByIdAsync(id: string, scope?: AssetScope): Promise<DurableAsset | null> {
  const asset = await getListingMediaAssetById(id, scope);
  return asset ? toDurable(asset) : null;
}

function tokenFromRow(row: any): AssetDownloadToken {
  return {
    id: row.token, assetId: row.asset_id, filename: row.filename, workspaceId: row.workspace_id,
    taskId: row.task_id || undefined, expiresAt: new Date(row.expires_at).toISOString(),
    isRevoked: row.is_revoked, downloadCount: Number(row.download_count), createdAt: new Date(row.created_at).toISOString(),
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined, revokedBy: row.revoked_by || undefined
  };
}

export async function createAssetDownloadTokenAsync(input: AssetScope & {
  assetId: string; filename?: string; expiresInHours?: number;
}): Promise<AssetDownloadToken & { token: string }> {
  const scope = requireAssetScope(input);
  const hours = input.expiresInHours ?? 24;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 720) throw new Error('INVALID_DOWNLOAD_EXPIRY');
  const asset = await getDurableAssetByIdAsync(input.assetId, scope);
  if (!asset) throw new Error('ASSET_NOT_FOUND_IN_SCOPE');
  const token = `dl_${crypto.randomBytes(32).toString('base64url')}`;
  const record: AssetDownloadToken = {
    id: hashToken(token), assetId: asset.id, filename: asset.filename, workspaceId: scope.workspaceId,
    taskId: scope.taskId || asset.taskId, expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
    isRevoked: false, downloadCount: 0, createdAt: new Date().toISOString()
  };
  const pool = getAssetDbPool();
  if (pool) {
    await pool.query(`INSERT INTO asset_download_tokens
      (token, asset_id, filename, workspace_id, task_id, expires_at, is_revoked, download_count, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,FALSE,0,$7)`,
    [record.id, record.assetId, record.filename, record.workspaceId, record.taskId || null, record.expiresAt, record.createdAt]);
  } else memoryTokens.set(record.id, record);
  // Only this response exposes the bearer secret. Database and staff listings contain its hash.
  return { ...record, token };
}

export async function verifyAndConsumeDownloadTokenAsync(token: string): Promise<TokenResult> {
  if (!validBearer(token)) return { valid: false, reason: 'invalid' };
  const id = hashToken(token);
  const pool = getAssetDbPool();
  let record: AssetDownloadToken | undefined;
  if (pool) {
    const found = await pool.query('SELECT * FROM asset_download_tokens WHERE token = $1', [id]);
    if (found.rows[0]) record = tokenFromRow(found.rows[0]);
  } else record = memoryTokens.get(id);
  if (!record?.workspaceId) return { valid: false, reason: 'invalid' };
  if (record.isRevoked) return { valid: false, reason: 'revoked' };
  if (!Number.isFinite(Date.parse(record.expiresAt)) || Date.parse(record.expiresAt) <= Date.now()) return { valid: false, reason: 'expired' };
  const asset = await getDurableAssetByIdAsync(record.assetId, { workspaceId: record.workspaceId, taskId: record.taskId });
  if (!asset) return { valid: false, reason: 'asset_missing' };
  if (pool) {
    // Recheck expiry/revocation atomically when consuming, including concurrent staff revocation.
    const consumed = await pool.query(`UPDATE asset_download_tokens SET download_count = download_count + 1, last_downloaded_at = NOW()
      WHERE token = $1 AND workspace_id = $2 AND is_revoked = FALSE AND expires_at > NOW() RETURNING *`, [id, record.workspaceId]);
    if (!consumed.rows[0]) return { valid: false, reason: 'invalid' };
    record = tokenFromRow(consumed.rows[0]);
  } else {
    if (record.isRevoked) return { valid: false, reason: 'revoked' };
    if (Date.parse(record.expiresAt) <= Date.now()) return { valid: false, reason: 'expired' };
    record.downloadCount++;
  }
  return { valid: true, tokenRecord: { ...record }, asset };
}

export async function revokeDownloadTokenAsync(tokenOrId: string, by?: string, scope?: AssetScope): Promise<boolean> {
  if (!scope?.workspaceId) return false;
  const cleanScope = requireAssetScope(scope);
  const id = validBearer(tokenOrId) ? hashToken(tokenOrId) : /^[a-f0-9]{64}$/.test(tokenOrId) ? tokenOrId : '';
  if (!id) return false;
  const pool = getAssetDbPool();
  if (pool) {
    const result = await pool.query(`UPDATE asset_download_tokens SET is_revoked = TRUE, revoked_at = NOW(), revoked_by = $3
      WHERE token = $1 AND workspace_id = $2 AND ($4::text IS NULL OR task_id = $4) RETURNING token`,
    [id, cleanScope.workspaceId, by || null, cleanScope.taskId || null]);
    return result.rows.length === 1;
  }
  const record = memoryTokens.get(id);
  if (!record || record.workspaceId !== cleanScope.workspaceId || (cleanScope.taskId && record.taskId !== cleanScope.taskId)) return false;
  record.isRevoked = true;
  record.revokedAt = new Date().toISOString();
  record.revokedBy = by;
  return true;
}

export async function listTokensForTaskAsync(taskId: string, scope?: AssetScope): Promise<AssetDownloadToken[]> {
  if (!scope?.workspaceId || !taskId) return [];
  const cleanScope = requireAssetScope(scope);
  const pool = getAssetDbPool();
  if (pool) {
    const result = await pool.query('SELECT * FROM asset_download_tokens WHERE workspace_id = $1 AND task_id = $2 ORDER BY created_at DESC', [cleanScope.workspaceId, taskId]);
    return result.rows.map(tokenFromRow);
  }
  return [...memoryTokens.values()].filter(r => r.workspaceId === cleanScope.workspaceId && r.taskId === taskId).map(r => ({ ...r }));
}

export function purgeDurableAssetsInMemory(): void { purgeListingMediaMemory(); memoryTokens.clear(); }
