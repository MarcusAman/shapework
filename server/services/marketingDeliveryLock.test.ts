import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getDbPool: vi.fn(), query: vi.fn(), release: vi.fn(), poolQuery: vi.fn(), applicationConnect: vi.fn(), advisoryConnect: vi.fn(), advisoryEnd: vi.fn(), Pool: vi.fn() }));
vi.mock('pg', () => ({ default: { Pool: mocks.Pool } }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({saveCanonicalMarketingTask: vi.fn()}));
vi.mock('../persistence/repositories.js', () => ({ getDbPool: mocks.getDbPool, getStorageDriver: () => 'memory' }));
import { acquireMarketingDeliveryLock, closeMarketingDeliveryLockPool, refreshMarketingDeliveryState, beginMarketingDeliveryAttempt, finishMarketingDeliveryAttempt } from './marketingDeliveryLock.js';
describe('cross-instance delivery coordination', () => {
  beforeEach(() => {
    mocks.Pool.mockImplementation(function () { return { connect: mocks.advisoryConnect, end: mocks.advisoryEnd, on: vi.fn() }; });
    mocks.advisoryConnect.mockImplementation(async () => ({ query: mocks.query, release: mocks.release }));
    mocks.getDbPool.mockReturnValue({ options: { max: 3, database: 'isolated-test' }, connect: mocks.applicationConnect, query: mocks.poolQuery });
    mocks.query.mockResolvedValue({ rows: [{ locked: true }] });
  });
  afterEach(async () => { if (mocks.getDbPool()) await closeMarketingDeliveryLockPool(mocks.getDbPool()); vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it('takes a PostgreSQL session lock and unlocks exactly once', async () => {
    const release = await acquireMarketingDeliveryLock('ws-1', 'task-1');
    expect(release).not.toBeNull(); expect(mocks.release).not.toHaveBeenCalled();
    await release!(); await release!();
    expect(mocks.query.mock.calls[0][0]).toContain('pg_try_advisory_lock');
    expect(mocks.query.mock.calls[1][0]).toContain('pg_advisory_unlock');
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
  it('caches a bounded separate pool so held locks cannot exhaust application query connections', async () => {
    Object.defineProperty(mocks.getDbPool().options, 'password', { value: 'synthetic-test-password', enumerable: false });
    const releases = await Promise.all([1, 2, 3].map(id => acquireMarketingDeliveryLock('ws-1', `task-${id}`)));
    expect(releases.every(Boolean)).toBe(true);
    expect(mocks.applicationConnect).not.toHaveBeenCalled();
    expect(mocks.Pool).toHaveBeenCalledTimes(1);
    expect(mocks.Pool).toHaveBeenCalledWith(expect.objectContaining({ database: 'isolated-test', password: 'synthetic-test-password', max: 3, min: 0, allowExitOnIdle: true, connectionTimeoutMillis: 10000 }));
    await Promise.all(releases.map(release => release!()));
  });
  it('destroys a connection after an uncertain acquisition error', async () => {
    mocks.query.mockRejectedValueOnce(new Error('Lock query timed out'));
    await expect(acquireMarketingDeliveryLock('ws-1', 'task-1')).rejects.toThrow('Lock query timed out');
    expect(mocks.release).toHaveBeenCalledWith(expect.any(Error));
  });
  it('does not wait or send when another instance holds the task lock', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ locked: false }] });
    expect(await acquireMarketingDeliveryLock('ws-1', 'task-1')).toBeNull();
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
  it('destroys a connection whose advisory unlock failed', async () => {
    const release = await acquireMarketingDeliveryLock('ws-1', 'task-1');
    mocks.query.mockRejectedValueOnce(new Error('Disconnected'));
    await expect(release!()).rejects.toThrow('Disconnected');
    expect(mocks.release).toHaveBeenCalledWith(expect.any(Error));
  });
  it('refreshes the durable receipt and proof before deciding whether to resend', async () => {
    mocks.poolQuery.mockResolvedValue({ rows: [{ routing_snapshot: { delivery: { key: 'sent', messageId: 'm-1' } }, proof_url: '/uploads/v2.pdf', proof_version: 2, status: 'completed', review_state: 'approved', proof_history: [], review_history: [] }] });
    const task: any = { id: 'task-1', workspaceId: 'ws-1', routingSnapshot: {}, proofUrl: '/uploads/v1.pdf' };
    expect(await refreshMarketingDeliveryState(task)).toBe(true);
    expect(task).toMatchObject({ proofVersion: 2, proofUrl: '/uploads/v2.pdf', routingSnapshot: { delivery: { messageId: 'm-1' } } });
    expect(mocks.poolQuery.mock.calls[0][1]).toEqual(['task-1', 'ws-1']);
  });
  it('persists sending before SMTP and blocks an unresolved attempt, but allows a conclusively failed retry', async () => {
    mocks.getDbPool.mockReturnValue(null);
    const task: any = { id: 'task-1', workspaceId: 'ws-1', routingSnapshot: {} };
    expect(await beginMarketingDeliveryAttempt(task, 'key')).toBe(true);
    expect(await beginMarketingDeliveryAttempt(task, 'key')).toBe(false);
    await finishMarketingDeliveryAttempt(task, 'key', 'failed');
    expect(await beginMarketingDeliveryAttempt(task, 'key')).toBe(true);
    await finishMarketingDeliveryAttempt(task, 'key', 'accepted', 'm-1');
    expect(task.routingSnapshot.deliveryAttempt).toMatchObject({status:'accepted',messageId:'m-1'});
  });
  it('fails closed in production if no database lock is available', async () => {
    mocks.getDbPool.mockReturnValue(null); vi.stubEnv('NODE_ENV', 'production');
    await expect(acquireMarketingDeliveryLock('ws-1', 'task-1')).rejects.toThrow('Database is required');
  });
});
