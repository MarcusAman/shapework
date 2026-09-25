import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createMediaDatabaseFake } from '../../server/test/mediaDatabaseFake.js';

const persistence = vi.hoisted(() => ({ pool: null as any, driver: 'database' }));
vi.mock('../../server/persistence/repositories.js', () => ({
  getDbPool: () => persistence.pool,
  getStorageDriver: () => persistence.driver
}));
const scope = { workspaceId: 'ws_media_a', taskId: 'task_a' };
let scratch: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;
let database: ReturnType<typeof createMediaDatabaseFake>;
let media: typeof import('../../server/persistence/durableAssetRepository.js');

beforeAll(() => {
  const base = path.join(process.cwd(), 'work', 'media-tests');
  fs.mkdirSync(base, { recursive: true });
  scratch = fs.mkdtempSync(path.join(base, 'durable-'));
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(scratch);
});
beforeEach(async () => {
  vi.resetModules();
  database = createMediaDatabaseFake();
  persistence.pool = database.pool;
  persistence.driver = 'database';
  media = await import('../../server/persistence/durableAssetRepository.js');
});
afterEach(() => { vi.unstubAllEnvs(); });
afterAll(() => { cwdSpy.mockRestore(); fs.rmSync(scratch, { recursive: true, force: true }); });
const save = (extra = {}) => media.saveDurableAssetAsync({ ...scope, filename: 'listing.pdf', contentType: 'application/pdf', buffer: Buffer.from('approved proof'), ...extra });

describe('Scoped durable media and revocable downloads', () => {
  it('persists ownership, original filename, content type and unique storage name before caching both paths', async () => {
    const asset = await save({ metadata: { requestId: 'request_a' } });
    expect(asset.filename).toBe('listing.pdf');
    expect(asset.storageFilename).not.toBe(asset.filename);
    expect(asset.metadata).toMatchObject({ ...scope, requestId: 'request_a' });
    expect(database.assets.get(asset.id).workspace_id).toBe(scope.workspaceId);
    for (const dir of ['public', 'dist']) expect(fs.readFileSync(path.join(scratch, dir, 'uploads', asset.storageFilename)).toString()).toBe('approved proof');
  });

  it('reconstructs asset ID, MIME and bytes solely from persisted rows after module and disk reset', async () => {
    const asset = await save({ contentType: 'application/vnd.test-document', filename: 'proof.custom' });
    for (const dir of ['public', 'dist']) fs.rmSync(path.join(scratch, dir), { recursive: true, force: true });
    vi.resetModules();
    media = await import('../../server/persistence/durableAssetRepository.js');
    const recovered = await media.getDurableAssetByFilenameAsync(asset.storageFilename, scope);
    expect(recovered).toMatchObject({ id: asset.id, contentType: 'application/vnd.test-document', dataBase64: asset.dataBase64 });
    expect(database.calls.some(c => c.sql.includes('SELECT * FROM durable_uploaded_assets'))).toBe(true);
  });

  it('separates identical filenames across tasks and tenants; rejects ambiguous original-name lookup', async () => {
    const a = await save();
    const b = await save({ taskId: 'task_b', buffer: Buffer.from('second task') });
    const c = await save({ workspaceId: 'ws_media_b', buffer: Buffer.from('other tenant') });
    expect(new Set([a.url, b.url, c.url]).size).toBe(3);
    expect(await media.getDurableAssetByIdAsync(a.id, { workspaceId: 'ws_media_b' })).toBeNull();
    expect(await media.getDurableAssetByIdAsync(a.id, { ...scope, taskId: 'task_b' })).toBeNull();
    expect(await media.getDurableAssetByFilenameAsync('listing.pdf', { workspaceId: scope.workspaceId })).toBeNull();
    expect((await media.getDurableAssetByFilenameAsync(a.storageFilename, scope))?.dataBase64).toBe(a.dataBase64);
    expect(await media.getDurableAssetByIdAsync(a.id)).toBeNull();
  });

  it('does not acknowledge/cache media when database persistence fails', async () => {
    database.failInserts();
    await expect(save()).rejects.toThrow('database unavailable');
    expect(database.assets.size).toBe(0);
  });

  it('requires a database in production even if a local cache or memory driver is present', async () => {
    persistence.pool = null;
    persistence.driver = 'memory';
    vi.stubEnv('APP_ENV', 'production');
    await expect(save()).rejects.toThrow('DURABLE_ASSET_DATABASE_REQUIRED');
  });

  it('rejects path traversal, absent ownership, and corrupt persisted bytes', async () => {
    await expect(save({ filename: '../proof.pdf' })).rejects.toThrow('INVALID_ASSET_FILENAME');
    await expect(save({ filename: '..\\proof.pdf' })).rejects.toThrow('INVALID_ASSET_FILENAME');
    await expect(save({ workspaceId: '' })).rejects.toThrow('ASSET_WORKSPACE_REQUIRED');
    const asset = await save();
    database.assets.get(asset.id).data_base64 = Buffer.from('tampered').toString('base64');
    await expect(media.getDurableAssetByIdAsync(asset.id, scope)).rejects.toThrow('ASSET_INTEGRITY_CHECK_FAILED');
  });

  it('supports an unambiguous legacy filename only after ownership is backfilled', async () => {
    const asset = await save();
    const row = database.assets.get(asset.id);
    row.storage_filename = null;
    expect((await media.getDurableAssetByFilenameAsync(asset.filename, scope))?.id).toBe(asset.id);
    row.workspace_id = null;
    expect(await media.getDurableAssetByFilenameAsync(asset.filename, scope)).toBeNull();
  });

  it('persists only a hash of a random bearer token and resolves its exact asset after reload', async () => {
    const asset = await save();
    const first = await media.createAssetDownloadTokenAsync({ ...scope, assetId: asset.id });
    const second = await media.createAssetDownloadTokenAsync({ ...scope, assetId: asset.id });
    expect(first.token).toMatch(/^dl_[A-Za-z0-9_-]{43}$/);
    expect(first.token).not.toBe(second.token);
    expect(database.tokens.has(first.token)).toBe(false);
    expect(database.tokens.has(first.id)).toBe(true);
    vi.resetModules();
    media = await import('../../server/persistence/durableAssetRepository.js');
    const result = await media.verifyAndConsumeDownloadTokenAsync(first.token);
    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('expected authorized download');
    expect(result.asset.id).toBe(asset.id);
    expect(result.tokenRecord.downloadCount).toBe(1);
    expect(result.tokenRecord.token).toBeUndefined();
  });

  it('rejects forged, expired and revoked links; revocation requires the owning workspace', async () => {
    const asset = await save();
    const token = await media.createAssetDownloadTokenAsync({ ...scope, assetId: asset.id });
    expect(await media.verifyAndConsumeDownloadTokenAsync('dl_forged')).toEqual({ valid: false, reason: 'invalid' });
    expect(await media.revokeDownloadTokenAsync(token.token, 'staff', { workspaceId: 'ws_other' })).toBe(false);
    expect(await media.revokeDownloadTokenAsync(token.token, 'staff')).toBe(false);
    database.tokens.get(token.id).expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await media.verifyAndConsumeDownloadTokenAsync(token.token)).toEqual({ valid: false, reason: 'expired' });
    database.tokens.get(token.id).expires_at = new Date(Date.now() + 60000).toISOString();
    expect(await media.revokeDownloadTokenAsync(token.id, 'Melissa', scope)).toBe(true);
    expect(await media.verifyAndConsumeDownloadTokenAsync(token.token)).toEqual({ valid: false, reason: 'revoked' });
  });

  it('scopes creation and listings and never creates a token for another task or tenant', async () => {
    const asset = await save();
    await expect(media.createAssetDownloadTokenAsync({ workspaceId: 'ws_other', assetId: asset.id })).rejects.toThrow('ASSET_NOT_FOUND_IN_SCOPE');
    await expect(media.createAssetDownloadTokenAsync({ ...scope, taskId: 'task_other', assetId: asset.id })).rejects.toThrow('ASSET_NOT_FOUND_IN_SCOPE');
    const token = await media.createAssetDownloadTokenAsync({ ...scope, assetId: asset.id });
    expect(await media.listTokensForTaskAsync(scope.taskId, { workspaceId: 'ws_other' })).toEqual([]);
    const listed = await media.listTokensForTaskAsync(scope.taskId, scope);
    expect(listed).toEqual([expect.objectContaining({ id: token.id })]);
    expect(listed[0].token).toBeUndefined();
  });
});
