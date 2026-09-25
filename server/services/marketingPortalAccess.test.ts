import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ tasks: [] as any[], saveAsset: vi.fn(), persist: vi.fn() }));
vi.mock('../persistence/repositories.js', () => ({ getDbPool: () => null, getStorageDriver: () => 'memory' }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  getAllCanonicalMarketingTasks: () => state.tasks,
  getCanonicalMarketingTaskById: (id: string) => state.tasks.find(t => t.id === id),
  saveCanonicalMarketingTask: (task: any) => task,
  persistTaskToDatabase: state.persist,
  getCanonicalMarketingRequestById: () => null,
  saveCanonicalMarketingRequest: vi.fn(), persistRequestToDatabase: vi.fn(),
}));
vi.mock('../persistence/durableAssetRepository.js', () => ({ saveDurableAssetAsync: state.saveAsset }));
vi.mock('../email/resendDispatchAdapter.js', () => ({ dispatchEmailViaResend: vi.fn() }));

import { ensureMarketingPortalToken, resolveMarketingPortalTask, hasApprovedCurrentProof, internalAssetFilename } from './marketingPortalAccess.js';
import { getMarketingTrackerByToken, appendMarketingTrackerNote, requestMarketingTrackerRevision, addMarketingTrackerAsset } from './taskTrackerService.js';

function task(id = 'task_one', workspaceId = 'workspace_one') {
  return { id, workspaceId, title: 'Property flyer', status: 'request_received', assignedTo: 'Melissa Gagliardi', agentName: 'Listing Agent', agentEmail: 'agent@example.test', notes: 'Private staff discussion', photos: [], routingSnapshot: {}, createdAt: new Date().toISOString() } as any;
}

describe('Marketing portal capabilities and workflow', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => { state.tasks = [task(), task('task_two', 'workspace_two')]; vi.clearAllMocks(); });

  it('persists an opaque stable capability; raw IDs, old deterministic tokens, and mutations fail', async () => {
    const token = await ensureMarketingPortalToken('task_one');
    expect(token).toMatch(/^mpt_[a-f0-9]{64}$/);
    expect(token).not.toContain('task_one');
    expect(await ensureMarketingPortalToken('task_one')).toBe(token);
    expect(state.persist).toHaveBeenCalledTimes(1);
    expect((await resolveMarketingPortalTask(token))?.workspaceId).toBe('workspace_one');
    for (const forged of ['task_one', 'trk_task_one_anything', token.slice(0, -1), token + '0']) {
      expect(await resolveMarketingPortalTask(forged)).toBeNull();
      expect(await appendMarketingTrackerNote(forged, 'Fake')).toBeNull();
    }
  });

  it('expires and rotates a portal capability without affecting another task', async () => {
    const token = await ensureMarketingPortalToken('task_one');
    state.tasks[0].routingSnapshot.clientPortal.expiresAt = '2000-01-01T00:00:00.000Z';
    expect(await resolveMarketingPortalTask(token)).toBeNull();
    expect(await ensureMarketingPortalToken('task_one')).not.toBe(token);
    expect(state.tasks[1].routingSnapshot.clientPortal).toBeUndefined();
  });

  it('does not expose internal staff notes and binds public note author to the requester', async () => {
    const token = await ensureMarketingPortalToken('task_one');
    expect((await getMarketingTrackerByToken(token))?.notes).toEqual([]);
    const tracker = await appendMarketingTrackerNote(token, 'Melissa impersonation', 'Please use the kitchen photo.');
    expect(tracker.notes[0].author).toBe('Listing Agent');
    expect(tracker.notes[0].content).toBe('Please use the kitchen photo.');
    expect(state.tasks[1].notes).toBe('Private staff discussion');
  });

  it('validates capability before saving media and keeps photo intake in its existing lane', async () => {
    const input = { filename: 'IMG_0001.jpg', contentType: 'image/jpeg', buffer: Buffer.from('test') };
    expect(await addMarketingTrackerAsset('task_one', input)).toBeNull();
    expect(state.saveAsset).not.toHaveBeenCalled();
    const token = await ensureMarketingPortalToken('task_one');
    state.saveAsset.mockResolvedValue({ id: 'asset_unique', url: '/uploads/unique.jpg', filename: input.filename, contentType: input.contentType, sizeBytes: 4 });
    const tracker = await addMarketingTrackerAsset(token, input);
    expect(state.saveAsset).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'workspace_one', taskId: 'task_one' }));
    expect(state.tasks[0].status).toBe('request_received');
    expect(state.tasks[0].photos).toHaveLength(1);
    expect(tracker.photos[0].url).toContain(`/api/track/marketing/${token}/media/0`);
    expect(state.tasks[1].photos).toHaveLength(0);
  });

  it('exposes current approved proof only and reopens the same delivered task for Melissa', async () => {
    const t = state.tasks[0];
    Object.assign(t, { status: 'completed', reviewState: 'approved', proofVersion: 2, proofUrl: '/uploads/proof.pdf', reviewHistory: [{ action: 'approved', version: 2 }], completedAt: new Date().toISOString() });
    t.routingSnapshot.delivery = { messageId: '<sent@example.test>', proofVersion: 2 };
    const token = await ensureMarketingPortalToken(t.id);
    expect(hasApprovedCurrentProof(t)).toBe(true);
    expect((await getMarketingTrackerByToken(token)).approvedDeliverables).toHaveLength(1);
    const tracker = await requestMarketingTrackerRevision(token, 'Please correct the price.');
    expect(tracker.status).toBe('in_progress');
    expect(t.status).toBe('in_progress');
    expect(t.reviewState).toBe('awaiting_review');
    expect(t.completedAt).toBeUndefined();
    expect(tracker.approvedDeliverables).toEqual([]);
    expect(state.tasks).toHaveLength(2);
  });

  it.each([
    ['APP_ENV', 'production'], ['APP_ENV', 'staging'], ['APP_ENV', 'uat'],
    ['APP_MODE', 'production'], ['NODE_ENV', 'production'], ['K_SERVICE', 'cloud-service'],
  ])('requires durable persistence for %s=%s even with a cached valid token', async (key, value) => {
    const token = await ensureMarketingPortalToken('task_one');
    vi.stubEnv(key, value);
    await expect(ensureMarketingPortalToken('task_one')).rejects.toThrow('Database is required');
    expect(await resolveMarketingPortalTask(token)).toBeNull();
    expect(await addMarketingTrackerAsset(token, { filename: 'photo.jpg', contentType: 'image/jpeg', buffer: Buffer.from('data') })).toBeNull();
    expect(state.saveAsset).not.toHaveBeenCalled();
  });

  it('rejects foreign origin and traversal when interpreting internal asset references', () => {
    expect(internalAssetFilename('/uploads/unique.jpg')).toBe('unique.jpg');
    expect(internalAssetFilename('https://evil.example/uploads/unique.jpg')).toBeNull();
    expect(internalAssetFilename('//evil.example/uploads/unique.jpg')).toBeNull();
    expect(internalAssetFilename('/uploads/%2e%2e%2Fsecret')).toBeNull();
    expect(internalAssetFilename('/uploads/a%5cb')).toBeNull();
  });
});
