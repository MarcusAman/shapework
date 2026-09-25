import express from 'express';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMarketingTaskDraftRouter } from './marketingTaskDraftRoute';
import { saveMarketingTaskDraft, type MarketingDraftDependencies } from '../services/marketingTaskDraft';

describe('authenticated draft route without outbound side effects', () => {
  let server: Server; let base: string;
  const task = { id: 'fixture', workspaceId: 'ws_fixture', title: 'Brochure', status: 'needs_info',
    assignedToId: 'producer', reviewOwnerId: 'reviewer', proofVersion: 0, proofUrl: '', routingSnapshot: {} };
  const persistDraft = vi.fn(async (current: any, draft: any) => ({ ...current, routingSnapshot: { proofDraft: draft } }));
  const deps: MarketingDraftDependencies = { loadTask: async () => task, getAssetById: async () => null,
    getAssetByFilename: async () => null, persistDraft };
  beforeAll(async () => {
    const app = express(); app.use(express.json());
    // Only this isolated fixture supplies identities; production mounts real session/membership middleware.
    app.use((req: any, _res, next) => {
      if (req.headers['x-fixture-actor']) {
        req.authUser = { id: req.headers['x-fixture-actor'] };
        req.workspace = { id: req.headers['x-fixture-workspace'] || 'ws_fixture' };
      }
      next();
    });
    app.use('/api/marketing/tasks', createMarketingTaskDraftRouter(args => saveMarketingTaskDraft(args, deps)));
    await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${(server.address() as any).port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  function post(actor?: string, workspace?: string) {
    return fetch(`${base}/api/marketing/tasks/fixture/draft`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(actor ? { 'x-fixture-actor': actor } : {}), ...(workspace ? { 'x-fixture-workspace': workspace } : {}) },
      body: JSON.stringify({ proofUrl: '', notes: 'Persist me without sending.', stagedAssets: [], baseProofVersion: 0, baseProofUrl: '', expectedDraftSavedAt: null, workspaceId: 'spoofed', actor: { id: 'reviewer' } }),
    });
  }
  it('denies anonymous and unrelated staff, ignoring a client supplied actor', async () => {
    expect((await post()).status).toBe(401);
    expect((await post('unrelated')).status).toBe(403);
  });
  it('rejects cross-workspace access', async () => { expect((await post('reviewer', 'ws_other')).status).toBe(404); });
  it('saves a producer draft without requiring a recipient or changing workflow', async () => {
    const response = await post('producer');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.task.status).toBe('needs_info');
    expect(body.task.routingSnapshot.proofDraft.notes).toBe('Persist me without sending.');
    expect(body.task.routingSnapshot.proofDraft.savedById).toBe('producer');
  });
  it('returns a visible failure instead of success on database failure', async () => {
    persistDraft.mockRejectedValueOnce(new Error('private database detail'));
    const response = await post('reviewer');
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Draft could not be saved');
    expect(body.error).not.toContain('private database');
  });
});
