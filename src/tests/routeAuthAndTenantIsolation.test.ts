import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, setWorkspaceUsersResolver } from '../../server/auth/auth';
import { orgChartRepository } from '../../server/persistence/orgChartRepository';
import { sopRepository } from '../../server/persistence/sopRepository';
import { ownerDigestEngine } from '../../server/notifications/ownerDigestEngine';

describe('Express Boundary Route Security & Tenant Isolation Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());

    // 1. Org Chart Routes
    app.get('/api/org-chart', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('org_chart.read'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const model = orgChartRepository.getOrgChart(wsId);
      res.json({ success: true, model });
    });

    app.put('/api/org-chart', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('org_chart.write'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const authorUser = req.authUser?.name || 'Authorized Lead';
      const model = orgChartRepository.saveOrgChart(wsId, req.body?.model || req.body, authorUser);
      res.json({ success: true, model });
    });

    app.put('/api/org-chart/positions/:id', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('org_chart.write'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const authorUser = req.authUser?.name || 'Authorized Lead';
      const { model, position } = orgChartRepository.updatePosition(wsId, req.params.id, req.body?.updates || req.body, authorUser);
      res.json({ success: true, position, model });
    });

    app.delete('/api/org-chart/positions/:id', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('org_chart.delete'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const authorUser = req.authUser?.name || 'Authorized Lead';
      const model = orgChartRepository.deletePosition(wsId, req.params.id, req.query.reassignToPositionId as string, authorUser);
      res.json({ success: true, model });
    });

    // 2. SOP Deletion Routes
    app.delete('/api/sops/drafts/:id', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('sops.delete'), async (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const performedBy = req.authUser?.name || 'Authorized Lead';
      try {
        await sopRepository.deleteDraft(req.params.id, wsId, performedBy);
        res.json({ success: true, message: 'Draft removed', id: req.params.id });
      } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
      }
    });

    // 3. Owner Digest Routes
    app.get('/api/owner-digest/config', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('owner_digest.read'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const config = ownerDigestEngine.getConfig(wsId);
      res.json({ success: true, config });
    });

    app.put('/api/owner-digest/config', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('owner_digest.configure'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const config = ownerDigestEngine.saveConfig(wsId, req.body, req.authUser?.name || 'Lead');
      res.json({ success: true, config });
    });

    // 4. Directory Route
    app.get('/api/directory', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('directory.read'), (req: any, res) => {
      const wsId = req.workspace?.id;
      if (!wsId) return res.status(403).json({ error: 'Forbidden', message: 'Workspace context missing' });
      const allPeople = [
        { id: 'p1', workspaceId: 'ws_alpha', displayName: 'Alpha Contact' },
        { id: 'p2', workspaceId: 'ws_beta', displayName: 'Beta Contact' },
        { id: 'p3_unscoped', displayName: 'Unscoped Contact (Should never leak)' }
      ];
      const list = allPeople.filter(p => p.workspaceId === wsId);
      res.json({ people: list, total: list.length });
    });

    setWorkspaceUsersResolver(() => [
      { id: 'usr_alpha_owner', email: 'alpha@owner.com', name: 'Alpha Owner', role: 'owner', workspaceId: 'ws_alpha' },
      { id: 'usr_beta_member', email: 'beta@member.com', name: 'Beta Member', role: 'events', workspaceId: 'ws_beta' },
      { id: 'usr_cross_tenant', email: 'cross@tenant.com', name: 'Cross Tenant', role: 'owner', workspaceId: 'ws_gamma' }
    ]);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Unauthenticated Requests Fail Closed (HTTP 401)', () => {
    it('rejects GET /api/org-chart with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });

    it('rejects PUT /api/org-chart with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: {} })
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });

    it('rejects PUT /api/org-chart/positions/:id with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart/positions/pos_1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: {} })
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });

    it('rejects DELETE /api/org-chart/positions/:id with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart/positions/pos_1`, { method: 'DELETE' });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });

    it('rejects DELETE /api/sops/drafts/:id with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/sops/drafts/draft_1`, { method: 'DELETE' });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });

    it('rejects GET /api/owner-digest/config with 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/owner-digest/config`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('authentication_required');
    });
  });

  describe('2. Cross-Tenant Isolation Enforcement (HTTP 403)', () => {
    it('rejects user from Workspace Alpha attempting to access Workspace Beta with 403', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart`, {
        headers: {
          'Authorization': 'Bearer token_usr_alpha_owner',
          'x-workspace-id': 'ws_beta'
        }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.message).toContain('not a member of the requested workspace');
    });

    it('strictly isolates directory records: Workspace Alpha sees only Alpha and zero unscoped records', async () => {
      const res = await fetch(`${baseUrl}/api/directory`, {
        headers: {
          'Authorization': 'Bearer token_usr_alpha_owner',
          'x-workspace-id': 'ws_alpha'
        }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBe(1);
      expect(data.people[0].id).toBe('p1');
      expect(data.people.some((p: any) => p.id === 'p2' || p.id === 'p3_unscoped')).toBe(false);
    });
  });

  describe('3. Role-Based Permissions (RBAC Enforcement)', () => {
    it('rejects events role user attempting to delete a draft SOP with 403', async () => {
      const res = await fetch(`${baseUrl}/api/sops/drafts/draft_test`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer token_usr_beta_member',
          'x-workspace-id': 'ws_beta'
        }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.message).toContain('Insufficient permissions');
    });

    it('allows owner role user with full permissions to read and update org chart', async () => {
      const res = await fetch(`${baseUrl}/api/org-chart`, {
        headers: {
          'Authorization': 'Bearer token_usr_alpha_owner',
          'x-workspace-id': 'ws_alpha'
        }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
