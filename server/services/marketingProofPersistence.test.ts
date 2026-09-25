import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pool: vi.fn(), query: vi.fn(), save: vi.fn() }));
vi.mock('./marketingPortalAccess.js', () => ({ getMarketingPortalDbPool: mocks.pool }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({ saveCanonicalMarketingTask: mocks.save }));
import { captureMarketingProofState, persistMarketingProofApproval } from './marketingProofPersistence.js';

const savedAt = '2026-09-25T20:00:00.000Z';
const makeTask = (): any => ({ id: 'task', workspaceId: 'workspace', proofUrl: '/uploads/first.jpg', proofVersion: 3,
  proofHistory: [{ version: 3, proofUrl: '/uploads/first.jpg', assets: [{ assetId: 'first' }, { assetId: 'second' }] }],
  proofNotes: 'Both approved photos', status: 'in_progress', reviewState: 'awaiting_review',
  reviewHistory: [{ version: 3, action: 'proof_submitted' }], approvalHistory: [], reviewOwnerId: 'melissa',
  routingSnapshot: { proofDraft: { savedAt }, clientPortal: { token: 'retained-test-token' } },
});

describe('explicit proof persistence and draft consumption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pool.mockReturnValue({ query: mocks.query });
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('saves every proof reference with workspace/version CAS and only consumes the exact draft', async () => {
    const task = makeTask();
    const persistedSnapshot = { clientPortal: task.routingSnapshot.clientPortal, emailConversation: { messageIds: ['earlier-reply'] } };
    mocks.query.mockResolvedValue({ rows: [{ routing_snapshot: persistedSnapshot }] });
    await persistMarketingProofApproval(task, 2, { submission: true, consumedDraftSavedAt: savedAt });
    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toContain('WHERE id = $1 AND workspace_id = $2 AND COALESCE(proof_version, 0) = $10');
    expect(sql).toContain("routing_snapshot->'proofDraft'->>'savedAt' = $11");
    expect(sql).toContain("THEN routing_snapshot - 'proofDraft' ELSE routing_snapshot END");
    expect(params.slice(0, 2)).toEqual(['task', 'workspace']);
    expect(JSON.parse(params[4])[0].assets).toHaveLength(2);
    expect(params[9]).toBe(2);
    expect(params[10]).toBe(savedAt);
    expect(params[12]).toBe(true);
    expect(params[13]).toBe('in_progress');
    expect(task.routingSnapshot).toEqual(persistedSnapshot);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('keeps a concurrent newer draft returned by the scoped atomic update', async () => {
    const task = makeTask();
    const newer = { savedAt: '2026-09-25T20:01:00.000Z', notes: 'New work while approval was saving' };
    mocks.query.mockResolvedValue({ rows: [{ routing_snapshot: { ...task.routingSnapshot, proofDraft: newer } }] });
    await persistMarketingProofApproval(task, 2, { consumedDraftSavedAt: savedAt });
    expect(task.routingSnapshot.proofDraft).toEqual(newer);
    expect(mocks.query.mock.calls[0][1][12]).toBe(false);
  });

  it('does not consume a draft when proof-version compare-and-set refuses the write', async () => {
    const task = makeTask();
    mocks.query.mockResolvedValue({ rows: [] });
    await expect(persistMarketingProofApproval(task, 2, { submission: true, consumedDraftSavedAt: savedAt })).rejects.toThrow('proof changed');
    expect(task.routingSnapshot.proofDraft.savedAt).toBe(savedAt);
    expect(mocks.save).toHaveBeenCalledWith(task, { persistDatabase: false });
  });

  it('persists local-only draft consumption without a database or transport', async () => {
    mocks.pool.mockReturnValue(null);
    const task = makeTask();
    await persistMarketingProofApproval(task, 2, { submission: true, consumedDraftSavedAt: savedAt });
    expect(task.routingSnapshot.proofDraft).toBeUndefined();
    expect(task.routingSnapshot.clientPortal).toBeDefined();
    expect(mocks.save).toHaveBeenCalledWith(task, { persistDatabase: false });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('restores a failed optimistic submission so the next attempt can use the durable version', async () => {
    const task = makeTask();
    task.proofVersion = 2;
    task.proofHistory = [];
    const before = captureMarketingProofState(task);
    task.proofVersion = 3;
    task.proofHistory = [{ version: 3, proofUrl: task.proofUrl, assets: [{ assetId: 'first' }, { assetId: 'second' }] }];
    mocks.query.mockRejectedValueOnce(new Error('temporary write failure'))
      .mockResolvedValueOnce({ rows: [{ proof_version: 2, proof_history: [], routing_snapshot: task.routingSnapshot }] });
    await expect(persistMarketingProofApproval(task, 2, { submission: true, consumedDraftSavedAt: savedAt, previousProofState: before })).rejects.toThrow('temporary write failure');
    expect(task.proofVersion).toBe(2);
    expect(task.proofHistory).toEqual([]);
    expect(task.routingSnapshot.proofDraft.savedAt).toBe(savedAt);
    const retryBase = task.proofVersion;
    task.proofVersion++;
    mocks.query.mockResolvedValueOnce({ rows: [{ routing_snapshot: { clientPortal: task.routingSnapshot.clientPortal } }] });
    await persistMarketingProofApproval(task, retryBase, { submission: true, consumedDraftSavedAt: savedAt });
    expect(mocks.query.mock.calls.at(-1)?.[1][9]).toBe(2);
    expect(task.proofVersion).toBe(3);
    expect(task.routingSnapshot.proofDraft).toBeUndefined();
  });

  it('uses the pre-transition state when the database is unavailable for both write and refresh', async () => {
    const task = makeTask();
    task.proofVersion = 2;
    const before = captureMarketingProofState(task);
    task.proofVersion = 3;
    task.reviewState = 'approved';
    mocks.query.mockRejectedValue(new Error('database unavailable'));
    await expect(persistMarketingProofApproval(task, 2, { previousProofState: before })).rejects.toThrow('database unavailable');
    expect(task.proofVersion).toBe(2);
    expect(task.reviewState).toBe('awaiting_review');
    expect(mocks.save).toHaveBeenCalledWith(task, { persistDatabase: false });
  });
});
