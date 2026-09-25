import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
const mocks = vi.hoisted(() => ({ getAsset: vi.fn(), list: vi.fn(), recipient: vi.fn() }));
vi.mock('../persistence/durableAssetRepository.js', () => ({ getDurableAssetByFilenameAsync: mocks.getAsset }));
vi.mock('./googleDriveService.js', () => ({ GoogleDriveService: { listFilesInFolder: mocks.list } }));
vi.mock('./canonicalRecipientService.js', () => ({ resolveServerCanonicalRecipient: mocks.recipient }));
import { evaluateDispatch } from './evaluateDispatch.js';
import { buildMarketingDispatchKey, resolveDurableDeliveryAssets } from './askNoraDriveDelivery.js';
const task = { id: 'task-1', workspaceId: 'ws_wilmington', proofUrl: '/uploads/asset-proof.pdf', proofVersion: 1, reviewerId: 'melissa', agentEmail: 'agent@nestrealty.com' };
const bytes = Buffer.from('approved proof');

describe('scoped durable delivery gate', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('APP_MODE', 'production'); vi.stubEnv('OUTBOUND_MASTER_MODE', 'live');
    mocks.recipient.mockResolvedValue({ id: 'agent-1' });
    mocks.getAsset.mockResolvedValue({ id: 'asset-1', filename: 'proof.pdf', workspaceId: task.workspaceId, taskId: task.id, dataBase64: bytes.toString('base64'), sha256Checksum: createHash('sha256').update(bytes).digest('hex') });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  const check = (overrides = {}) => evaluateDispatch({ task, actor: { id: 'melissa' }, cc: ['melissa.gagliardi@nestrealty.com'], intent: 'delivery_complete', ...overrides });
  it('allows a scoped, integrity-checked internal proof without consulting Drive', async () => {
    expect(await check()).toMatchObject({ allowed: true, effectiveCc: ['melissa.gagliardi@nestrealty.com'] });
    expect(mocks.getAsset).toHaveBeenCalledWith('asset-proof.pdf', { workspaceId: 'ws_wilmington', taskId: 'task-1' });
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it('rejects missing assets, cross-workspace records, and corrupt bytes', async () => {
    for (const asset of [null, { workspaceId: 'other' }, { workspaceId: task.workspaceId, taskId: task.id, dataBase64: bytes.toString('base64'), sha256Checksum: 'bad' }]) {
      mocks.getAsset.mockResolvedValue(asset);
      expect((await check()).allowed).toBe(false);
    }
  });
  it('does not approve arbitrary external URLs or a different task upload', async () => {
    expect((await check({ proofUrl: 'https://arbitrary.example/proof.pdf' })).allowed).toBe(false);
    mocks.getAsset.mockResolvedValue({ workspaceId: task.workspaceId, taskId: 'another-task', dataBase64: bytes.toString('base64'), sha256Checksum: createHash('sha256').update(bytes).digest('hex') });
    // Repository must reject an explicitly mismatched task, defense in depth here too.
    expect(await resolveDurableDeliveryAssets(task, '/uploads/other.pdf')).toEqual([]);
  });
  it('keeps reviewer and outbound kill gates', async () => {
    expect((await check({ actor: { id: 'eduardo' } })).allowed).toBe(false);
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'disabled');
    expect((await check()).allowed).toBe(false);
  });
  it('separates information requests, revised proof versions, and tenants', () => {
    const key = buildMarketingDispatchKey(task);
    expect(buildMarketingDispatchKey({ ...task, proofVersion: 2 })).not.toBe(key);
    expect(buildMarketingDispatchKey({ ...task, proofUrl: '/uploads/new.pdf' })).not.toBe(key);
    expect(buildMarketingDispatchKey(task, 'ask_missing')).not.toBe(key);
    expect(buildMarketingDispatchKey({ ...task, workspaceId: 'other' })).not.toBe(key);
    expect(buildMarketingDispatchKey({ ...task, agentEmail: 'new-agent@nestrealty.com' })).not.toBe(key);
    expect(buildMarketingDispatchKey({ ...task, agentEmail: ' Agent@NestRealty.com ' })).toBe(key);
    expect(buildMarketingDispatchKey({ ...task })).toBe(key);
  });
});
