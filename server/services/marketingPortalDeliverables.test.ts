import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ tasks: [] as any[], assets: [] as any[], getAsset: vi.fn() }));
vi.mock('../persistence/repositories.js', () => ({ getDbPool: () => null, getStorageDriver: () => 'memory' }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  getAllCanonicalMarketingTasks: () => state.tasks,
  getCanonicalMarketingTaskById: (id: string) => state.tasks.find(task => task.id === id),
  saveCanonicalMarketingTask: vi.fn(), persistTaskToDatabase: vi.fn(),
}));
vi.mock('../persistence/durableAssetRepository.js', () => ({ getDurableAssetByFilenameAsync: state.getAsset }));
vi.mock('../email/resendDispatchAdapter.js', () => ({ dispatchEmailViaResend: vi.fn() }));
vi.mock('./googleDriveService.js', () => ({ GoogleDriveService: {} }));
import * as tracker from './taskTrackerService.js';

const token = `mpt_${'a'.repeat(64)}`;
function asset(id: string) {
  const bytes = Buffer.from(`Approved file ${id}`);
  return { id, workspaceId: 'workspace', taskId: 'task', filename: `${id}.pdf`, url: `/uploads/${id}.pdf`,
    contentType: 'application/pdf', dataBase64: bytes.toString('base64'), sha256Checksum: createHash('sha256').update(bytes).digest('hex') };
}
const ref = (value: any) => ({ assetId: value.id, url: value.url, filename: value.filename, sha256Checksum: value.sha256Checksum });
const resolve = (query: any = {}, capability = token) => (tracker as any).resolveMarketingTrackerDeliverable(capability, query);

describe('all current approved files in the token-scoped client portal', () => {
  beforeEach(() => {
    state.assets = ['first', 'second', 'third', 'intake', 'historical'].map(asset);
    state.tasks = [{ id: 'task', workspaceId: 'workspace', title: 'Brochure package', status: 'completed',
      proofVersion: 2, proofUrl: state.assets[0].url, reviewState: 'approved', reviewHistory: [{ action: 'approved', version: 2 }],
      photos: [{ url: state.assets[3].url }], attachments: [{ url: state.assets[3].url }],
      proofHistory: [{ version: 1, proofUrl: state.assets[4].url, assets: [ref(state.assets[4])] },
        { version: 2, proofUrl: state.assets[0].url, assets: state.assets.slice(0, 3).map(ref) }],
      routingSnapshot: { clientPortal: { token, expiresAt: '2099-01-01T00:00:00.000Z' } } }];
    state.getAsset.mockReset().mockImplementation(async (filename: string) => state.assets.find(value => value.filename === filename) || null);
  });

  it('lists every current file once using versioned portal URLs without listing intake or history', async () => {
    const result = await tracker.getMarketingTrackerByToken(token);
    expect(result.approvedDeliverables.map((value: any) => value.name)).toEqual(['first.pdf', 'second.pdf', 'third.pdf']);
    for (const [index, link] of result.approvedDeliverables.entries()) {
      const url = new URL(link.url, 'https://portal.test');
      expect(url.pathname).toBe(`/api/track/marketing/${token}/deliverable`);
      expect(url.searchParams.get('version')).toBe('2');
      expect(url.searchParams.get('assetId')).toBe(state.assets[index].id);
    }
  });

  it('downloads each selected verified file with task/workspace scoping', async () => {
    for (const value of state.assets.slice(0, 3)) {
      const result = await resolve({ version: '2', assetId: value.id });
      expect(result.asset.assetId).toBe(value.id);
      expect(result.asset.content.toString()).toBe(`Approved file ${value.id}`);
      expect(state.getAsset).toHaveBeenCalledWith(value.filename, { workspaceId: 'workspace', taskId: 'task' });
    }
  });

  it.each(['intake', 'historical', 'unknown'])('rejects a selector outside the approved package: %s', async id => {
    expect(await resolve({ version: '2', assetId: id })).toBeNull();
  });

  it.each([{ version: '1', assetId: 'first' }, { assetId: 'first' }, { version: ['2'], assetId: 'first' }, { version: '2', assetId: ['first'] }])('rejects stale and malformed selectors %j', async query => {
    expect(await resolve(query)).toBeNull();
  });

  it.each(['forged token', 'expired token', 'revoked token', 'unapproved', 'stale approval', 'archived'])('denies %s before reading bytes', async failure => {
    const task = state.tasks[0];
    if (failure === 'expired token') task.routingSnapshot.clientPortal.expiresAt = '2000-01-01T00:00:00Z';
    if (failure === 'revoked token') task.routingSnapshot.clientPortal.revokedAt = '2026-01-01T00:00:00Z';
    if (failure === 'unapproved') task.reviewState = 'awaiting_review';
    if (failure === 'stale approval') task.reviewHistory[0].version = 1;
    if (failure === 'archived') task.isArchived = true;
    expect(await resolve({ version: '2', assetId: 'second' }, failure === 'forged token' ? 'task' : token)).toBeNull();
    expect(state.getAsset).not.toHaveBeenCalled();
  });

  it.each(['other workspace', 'other task', 'corrupt bytes', 'changed identity', 'missing'])('fails closed for a package with %s', async failure => {
    const second = state.assets[1];
    if (failure === 'other workspace') second.workspaceId = 'other';
    if (failure === 'other task') second.taskId = 'other';
    if (failure === 'corrupt bytes') second.dataBase64 = Buffer.from('different bytes').toString('base64');
    if (failure === 'changed identity') second.id = 'replacement';
    if (failure === 'missing') state.assets.splice(1, 1);
    expect(await resolve({ version: '2', assetId: 'first' })).toBeNull();
  });

  it('preserves the existing primary link and secure external proof redirect', async () => {
    expect((await resolve()).asset.assetId).toBe('first');
    state.tasks[0].proofUrl = 'https://drive.google.com/file/d/approved/view';
    state.tasks[0].proofHistory = [];
    expect(await resolve({ version: '2' })).toEqual({ url: state.tasks[0].proofUrl });
    expect(await resolve({ version: '2', assetId: 'second' })).toBeNull();
  });
});
