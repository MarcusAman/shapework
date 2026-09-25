import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createMediaDatabaseFake } from './test/mediaDatabaseFake.js';

const state = vi.hoisted(() => ({ pool: null as any, tasks: new Map<string, any>() }));
vi.mock('./persistence/repositories.js', () => ({ getDbPool: () => state.pool, getStorageDriver: () => 'memory' }));
vi.mock('./persistence/marketingCampaignsRepository.js', () => ({
  saveCanonicalMarketingTask: (task: any) => state.tasks.set(task.id, task),
  getCanonicalMarketingTaskById: (id: string) => state.tasks.get(id),
  getAllCanonicalMarketingTasks: () => [...state.tasks.values()],
  persistTaskToDatabase: vi.fn(async () => {}),
}));
vi.mock('./email/resendDispatchAdapter.js', () => ({ dispatchEmailViaResend: vi.fn(async () => { throw new Error('Outbound is forbidden in this harness'); }) }));
import { saveListingMediaAsset, getListingMediaAsset, purgeListingMediaMemory } from './services/listingMediaStorageService.js';
import { generateMarketingTrackerToken, getMarketingTrackerByToken, appendMarketingTrackerNote } from './services/taskTrackerService.js';
let directory: string;
let cwdSpy: ReturnType<typeof vi.spyOn>;
let database: ReturnType<typeof createMediaDatabaseFake>;
const scope = { workspaceId: 'ws_album_test' };

beforeAll(() => {
  const base = path.join(process.cwd(), 'work', 'media-tests');
  fs.mkdirSync(base, { recursive: true });
  directory = fs.mkdtempSync(path.join(base, 'album-'));
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(directory);
});
beforeEach(() => { database = createMediaDatabaseFake(); state.pool = database.pool; state.tasks.clear(); purgeListingMediaMemory(); });
afterAll(() => { cwdSpy.mockRestore(); fs.rmSync(directory, { recursive: true, force: true }); });

describe('Internal media album and client tracker', () => {
  it('records scoped durable bytes and caches both serving paths', async () => {
    const buffer = Buffer.from('LISTING_PHOTO_BYTES');
    const saved = await saveListingMediaAsset({ ...scope, filename: 'exterior.jpg', contentType: 'image/jpeg', buffer });
    expect(database.assets.get(saved.id)).toMatchObject({ workspace_id: scope.workspaceId, data_base64: buffer.toString('base64') });
    for (const dir of ['public', 'dist']) expect(fs.readFileSync(path.join(directory, dir, 'uploads', saved.storageFilename))).toEqual(buffer);
  });

  it('rehydrates from the SQL boundary with memory and both cache directories empty', async () => {
    const buffer = Buffer.from('COLD_START_LISTING_PHOTO');
    const saved = await saveListingMediaAsset({ ...scope, filename: 'photo.jpg', contentType: 'image/jpeg', buffer });
    for (const dir of ['public', 'dist']) fs.rmSync(path.join(directory, dir), { recursive: true, force: true });
    purgeListingMediaMemory();
    const retrieved = await getListingMediaAsset(saved.storageFilename, scope);
    expect(retrieved?.buffer).toEqual(buffer);
    expect(retrieved?.id).toBe(saved.id);
    expect(database.calls.some(c => c.sql.includes('SELECT * FROM durable_uploaded_assets'))).toBe(true);
  });

  it('issues a stored opaque portal capability and exposes album photos and agent notes', async () => {
    state.pool = null;
    const task = {
      id: 'task_album_test', workspaceId: scope.workspaceId, title: 'Property Brochure', status: 'in_production',
      propertyAddress: '1104 S Live Oak Pkwy', assignedTo: 'Eduardo Lovo', agentName: 'Test Agent',
      photos: [{ id: 'photo_1', name: 'exterior.jpg', url: '/uploads/asset_photo.jpg', type: 'image/jpeg' }],
      notes: 'Internal briefing', createdAt: new Date().toISOString(),
    };
    state.tasks.set(task.id, task);
    const token = await generateMarketingTrackerToken(task.id);
    expect(token).toMatch(/^mpt_[a-f0-9]{64}$/);
    expect(await generateMarketingTrackerToken(task.id)).toBe(token);
    expect(await getMarketingTrackerByToken(task.id)).toBeNull();
    const tracker = await getMarketingTrackerByToken(token);
    expect(tracker).toMatchObject({ propertyAddress: task.propertyAddress, isMarketingRequest: true });
    expect(tracker.stages).toHaveLength(5);
    expect(tracker.photos[0].url).toBe(`/api/track/marketing/${token}/media/0`);
    expect(tracker.notes).toEqual([]);
    const updated = await appendMarketingTrackerNote(token, 'Test Agent', 'Please highlight the dock.');
    expect(updated.notes[0].content).toBe('Please highlight the dock.');
  });
});
