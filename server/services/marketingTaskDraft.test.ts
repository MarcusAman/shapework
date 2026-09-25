import { describe, expect, it, vi } from 'vitest';
import { saveMarketingTaskDraft, persistMarketingProofDraft, type MarketingDraftDependencies } from './marketingTaskDraft';

function fixture() {
  const task: any = { id: 'task_a', workspaceId: 'ws_a', title: 'Brochure', status: 'needs_info',
    assignedToId: 'eduardo', assignedTo: 'Eduardo', reviewOwnerId: 'melissa', reviewOwnerName: 'Melissa',
    proofVersion: 0, proofUrl: null, routingSnapshot: { delivery: { key: 'preserve' } } };
  const assets = ['one', 'two'].map(id => ({ id, workspaceId: 'ws_a', taskId: task.id,
    filename: `${id}.png`, url: `/uploads/asset_${id}.png`, contentType: 'image/png', sizeBytes: 10 }));
  const persisted: any[] = [];
  const deps: MarketingDraftDependencies = {
    loadTask: vi.fn(async () => structuredClone(task)),
    getAssetById: vi.fn(async id => assets.find(a => a.id === id) || null),
    getAssetByFilename: vi.fn(async filename => assets.find(a => a.url.endsWith('/' + filename)) || null),
    persistDraft: vi.fn(async (current, draft) => {
      const updated = { ...current, routingSnapshot: { ...current.routingSnapshot, proofDraft: draft } };
      persisted.push(updated); return updated;
    }),
  };
  const args = { taskId: task.id, workspaceId: 'ws_a', actor: { id: 'melissa', name: 'Melissa' },
    input: { notes: 'Keep the blue headline.', proofUrl: '', baseProofVersion: 0, baseProofUrl: '', expectedDraftSavedAt: null,
      stagedAssets: assets.map(a => ({ id: a.id, previewUrl: a.url, deliverableName: 'Brochure' })) } };
  return { task, assets, deps, args, persisted };
}

describe('saving marketing work without approval or recipient confirmation', () => {
  it('persists every durable file and notes while leaving task lifecycle and existing delivery unchanged', async () => {
    const { deps, args, persisted, task } = fixture();
    const saved = await saveMarketingTaskDraft(args, deps);
    expect(saved.routingSnapshot.proofDraft.assets.map((a: any) => a.id)).toEqual(['one', 'two']);
    expect(saved.routingSnapshot.proofDraft.notes).toBe(args.input.notes);
    expect(saved.routingSnapshot.proofDraft.baseProofVersion).toBe(0);
    expect(saved.status).toBe('needs_info');
    expect(saved.reviewState).toBeUndefined();
    expect(saved.proofUrl).toBeNull();
    expect(saved.routingSnapshot.delivery).toEqual(task.routingSnapshot.delivery);
    expect(saved.assignedToId).toBe('eduardo');
    expect(saved.reviewHistory).toBeUndefined();
    expect(persisted).toHaveLength(1);
  });

  it('allows the assigned producer to save a notes-only draft', async () => {
    const { deps, args } = fixture();
    const saved = await saveMarketingTaskDraft({ ...args, actor: { id: 'eduardo', name: 'Eduardo' }, input: { ...args.input, notes: 'Need another photo.', proofUrl: '', stagedAssets: [] } }, deps);
    expect(saved.routingSnapshot.proofDraft.notes).toBe('Need another photo.');
  });

  it('accepts Melissa’s authenticated account alias against her canonical reviewer identity', async () => {
    const { deps, args, task } = fixture();
    task.reviewOwnerId = 'dir_melissa_gagliardi_33'; task.reviewOwnerName = 'Melissa Gagliardi';
    const saved = await saveMarketingTaskDraft({ ...args, actor: {
      id: 'usr_melissa_full', name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com',
    } }, deps);
    expect(saved.routingSnapshot.proofDraft.savedById).toBe('usr_melissa_full');
    expect(saved.reviewOwnerId).toBe('dir_melissa_gagliardi_33');
  });

  it('rejects another workspace and unrelated staff before persistence', async () => {
    const { deps, args } = fixture();
    await expect(saveMarketingTaskDraft({ ...args, workspaceId: 'ws_other' }, deps)).rejects.toMatchObject({ status: 404 });
    await expect(saveMarketingTaskDraft({ ...args, actor: { id: 'other', name: 'Other' } }, deps)).rejects.toMatchObject({ status: 403 });
    expect(deps.persistDraft).not.toHaveBeenCalled();
  });

  it('rejects a file from another task even when it shares the workspace', async () => {
    const { deps, args, assets } = fixture();
    assets[1].taskId = 'other_task';
    await expect(saveMarketingTaskDraft(args, deps)).rejects.toMatchObject({ status: 400 });
    expect(deps.persistDraft).not.toHaveBeenCalled();
  });

  it('rejects missing files and inline browser-only URLs', async () => {
    const { deps, args } = fixture();
    await expect(saveMarketingTaskDraft({ ...args, input: { ...args.input, stagedAssets: [{ id: 'missing' }] } }, deps)).rejects.toMatchObject({ status: 400 });
    await expect(saveMarketingTaskDraft({ ...args, input: { ...args.input, proofUrl: 'blob:temporary', stagedAssets: [] } }, deps)).rejects.toMatchObject({ status: 400 });
  });

  it('propagates a storage failure without reporting success or modifying the task', async () => {
    const { deps, args, task } = fixture();
    deps.persistDraft = vi.fn(async () => { throw new Error('DB unavailable'); });
    await expect(saveMarketingTaskDraft(args, deps)).rejects.toThrow('DB unavailable');
    expect(task.routingSnapshot.proofDraft).toBeUndefined();
  });

  it('does not overwrite a task while it is being completed or archived', async () => {
    const { deps, args, task } = fixture();
    task.status = 'completed';
    await expect(saveMarketingTaskDraft(args, deps)).rejects.toMatchObject({ status: 409 });
    expect(deps.persistDraft).not.toHaveBeenCalled();
  });

  it('rejects an old browser draft after a newer proof was submitted', async () => {
    const { deps, args, task } = fixture();
    task.proofVersion = 1; task.proofUrl = '/uploads/new.png';
    await expect(saveMarketingTaskDraft(args, deps)).rejects.toMatchObject({ status: 409 });
    expect(deps.persistDraft).not.toHaveBeenCalled();
  });

  it('rejects an old browser draft after another editor saves newer notes or assets', async () => {
    const { deps, args, task } = fixture();
    task.routingSnapshot.proofDraft = { savedAt: '2026-09-25T12:00:00Z' };
    await expect(saveMarketingTaskDraft(args, deps)).rejects.toMatchObject({ status: 409 });
    expect(deps.persistDraft).not.toHaveBeenCalled();
  });

  it('updates only the scoped draft JSON key and detects a concurrently changed proof', async () => {
    const { task } = fixture();
    const query = vi.fn(async () => ({ rows: [] }));
    await expect(persistMarketingProofDraft(task, { proofUrl: '', notes: '', assets: [], savedAt: '2026-09-25T00:00:00Z', savedById: 'melissa', baseProofUrl: '', baseProofVersion: 0 }, { query } as any)).rejects.toMatchObject({ status: 409 });
    const [sql, values] = query.mock.calls[0] as any;
    expect(sql).toContain("'{proofDraft}'");
    expect(sql).toContain('workspace_id = $2');
    expect(sql).toContain('proof_version');
    expect(sql).not.toMatch(/SET\s+(?:status|proof_url|review_state|assigned_to)\s*=/i);
    expect(values.slice(0, 2)).toEqual(['task_a', 'ws_a']);
  });
});
