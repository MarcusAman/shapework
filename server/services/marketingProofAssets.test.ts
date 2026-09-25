import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getAsset: vi.fn() }));
vi.mock('../persistence/durableAssetRepository.js', () => ({ getDurableAssetByFilenameAsync: mocks.getAsset }));
vi.mock('./googleDriveService.js', () => ({ GoogleDriveService: {} }));
import { buildMarketingDispatchKey, resolveDurableDeliveryAssets } from './askNoraDriveDelivery.js';
import { marketingProofPreviewTask, prepareMarketingProofAssets } from './marketingProofAssets.js';

const asset = (id: string) => {
  const content = Buffer.from(`approved ${id}`);
  return { id, filename: `${id}.jpg`, url: `/uploads/${id}.jpg`, workspaceId: 'workspace', taskId: 'task',
    dataBase64: content.toString('base64'), sha256Checksum: createHash('sha256').update(content).digest('hex') };
};
const first = asset('first');
const second = asset('second');
const third = asset('third');
const ref = (value: ReturnType<typeof asset>) => ({ assetId: value.id, url: value.url, filename: value.filename, sha256Checksum: value.sha256Checksum });
const task = () => ({ id: 'task', workspaceId: 'workspace', agentEmail: 'agent@nestrealty.com', proofVersion: 2,
  proofUrl: first.url, proofHistory: [{ version: 2, proofUrl: first.url, assets: [ref(first), ref(second), ref(third)] }] });

describe('all files in the current submitted proof', () => {
  beforeEach(() => {
    mocks.getAsset.mockReset().mockImplementation(async (filename: string) => [first, second, third].find(value => value.filename === filename) || null);
  });

  it('returns every scoped file once, including secondary files', async () => {
    const result = await resolveDurableDeliveryAssets(task());
    expect(result.map(value => value.assetId)).toEqual(['first', 'second', 'third']);
    expect(mocks.getAsset).toHaveBeenCalledWith('second.jpg', { workspaceId: 'workspace', taskId: 'task' });
  });

  it.each(['missing', 'other workspace', 'other task', 'corrupt'])('rejects the complete package when a secondary file is %s', async (failure) => {
    mocks.getAsset.mockImplementation(async (filename: string) => filename === second.filename
      ? failure === 'missing' ? null : { ...second,
        ...(failure === 'other workspace' ? { workspaceId: 'other' } : {}),
        ...(failure === 'other task' ? { taskId: 'other' } : {}),
        ...(failure === 'corrupt' ? { dataBase64: Buffer.from('changed').toString('base64') } : {}),
      } : first);
    expect(await resolveDurableDeliveryAssets(task())).toEqual([]);
  });

  it('ignores stale proof versions and unrelated intake attachments', async () => {
    const input = task();
    input.proofHistory[0].version = 1;
    expect((await resolveDurableDeliveryAssets({ ...input, attachments: [{ url: second.url }] })).map(value => value.assetId)).toEqual(['first']);
  });

  it('does not add the old package to a different proposed primary proof', async () => {
    expect((await resolveDurableDeliveryAssets(task(), second.url)).map(value => value.assetId)).toEqual(['second']);
  });

  it('changes delivery identity when a secondary approved file changes', () => {
    const old = task();
    const revised = task();
    revised.proofHistory[0].assets = [ref(first), ref(third)];
    expect(buildMarketingDispatchKey(old)).not.toBe(buildMarketingDispatchKey(revised));
    expect(buildMarketingDispatchKey(old, 'ask_missing')).toBe(buildMarketingDispatchKey(revised, 'ask_missing'));
  });

  const withDraft = () => ({ ...task(), proofHistory: [], routingSnapshot: { proofDraft: {
    baseProofVersion: 2, baseProofUrl: first.url, proofUrl: first.url,
    savedAt: '2026-09-25T20:00:00.000Z', savedById: 'producer', notes: 'Use all three photos.',
    assets: [first, second, third].map(value => ({ id: value.id, previewUrl: value.url, fileName: value.filename })),
  } } });

  it('promotes every applicable saved draft file into the explicit proof version without mutating or approving the draft', async () => {
    const input = withDraft();
    const before = JSON.stringify(input);
    const prepared = await prepareMarketingProofAssets(input, { proofUrl: first.url });
    expect(prepared.assets.map(value => value.assetId)).toEqual(['first', 'second', 'third']);
    expect(prepared.notes).toBe('Use all three photos.');
    expect(prepared.consumedDraftSavedAt).toBe(input.routingSnapshot.proofDraft.savedAt);
    const submitted = marketingProofPreviewTask(input, prepared);
    expect(submitted.proofVersion).toBe(3);
    expect(submitted.proofHistory.at(-1).assets).toEqual(prepared.assets);
    expect((await resolveDurableDeliveryAssets(submitted)).map(value => value.assetId)).toEqual(['first', 'second', 'third']);
    expect(JSON.stringify(input)).toBe(before);
    expect(submitted.reviewState).toBeUndefined();
  });

  it.each(['version', 'url', 'later approval'])('never promotes a saved draft after its base %s changes', async (change) => {
    const input: any = withDraft();
    if (change === 'version') input.proofVersion++;
    if (change === 'url') input.proofUrl = second.url;
    if (change === 'later approval') input.reviewHistory = [{ action: 'approved', timestamp: '2026-09-25T21:00:00.000Z' }];
    const prepared = await prepareMarketingProofAssets(input);
    expect(prepared.assets).toHaveLength(1);
    expect(prepared.consumedDraftSavedAt).toBeUndefined();
  });

  it('refuses an unrelated unbound durable file and leaves the saved draft unchanged', async () => {
    const input = withDraft();
    const before = JSON.stringify(input);
    mocks.getAsset.mockImplementation(async (filename: string) => filename === second.filename ? { ...second, taskId: null } : first);
    await expect(prepareMarketingProofAssets(input)).rejects.toThrow('unavailable in this task and workspace');
    expect(JSON.stringify(input)).toBe(before);
  });

  it.each([[ref(first)], []])('treats an explicit selection as authoritative without restoring removed draft files', async (...args) => {
    const selected = args[0] ? [args[0]] : [];
    const prepared = await prepareMarketingProofAssets(withDraft(), { proofUrl: first.url, assets: selected });
    expect(prepared.assets.map(value => value.assetId)).toEqual(['first']);
  });
});
