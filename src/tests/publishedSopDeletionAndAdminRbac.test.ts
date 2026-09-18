import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { sopRepository } from '../../server/persistence/sopRepository';
import { ROLE_PERMISSIONS } from '../../server/auth/auth';

describe('Admin Published SOP Deletion & RBAC Governance Suite', () => {
  const tenantId = 'tenant_nest_uat';
  const workspaceId = 'ws_wilmington';
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());

    const mockAuthMiddleware = (req: any, res: any, next: any) => {
      const userHeader = req.headers['x-user-email'] || 'ryan@nestrealty.com';
      const roleHeader = req.headers['x-user-role'] || 'owner';

      req.authUser = {
        email: userHeader,
        name: userHeader.split('@')[0],
        role: roleHeader,
        tenantId
      };
      req.workspace = { id: workspaceId };
      next();
    };

    const requirePermission = (perm: string) => (req: any, res: any, next: any) => {
      const role = req.authUser?.role || 'member';
      const permissions = ROLE_PERMISSIONS[role] || [];
      if (!permissions.includes(perm)) {
        return res.status(403).json({ error: 'Forbidden', message: `Missing required permission: ${perm}` });
      }
      next();
    };

    app.delete(['/api/sops/drafts/:id', '/api/sops/:id', '/api/sops/published/:id'], mockAuthMiddleware, requirePermission('sops.delete'), async (req: any, res) => {
      try {
        const user = req.authUser;
        const userEmail = (user?.email || '').toLowerCase();
        const userName = (user?.name || '').toLowerCase();
        const userRole = (user?.role || '').toLowerCase();

        const isNamedAdmin = ['ryan', 'adam', 'marcus', 'matt'].some(n => userEmail.includes(n) || userName.includes(n));
        const isAdminRole = ['owner', 'admin', 'bic', 'operations_lead'].includes(userRole);
        const isAdmin = isNamedAdmin || isAdminRole;

        const isDraftOnly = req.path.includes('/drafts/');
        const allowPublished = isAdmin && !isDraftOnly;

        await sopRepository.deleteSop(req.params.id, tenantId, user?.name || 'Admin', allowPublished);
        res.json({ success: true, message: `SOP "${req.params.id}" removed successfully.`, id: req.params.id });
      } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
      }
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as any).port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('1. Verifies role permissions allow sops.delete for owner, admin, and bic', () => {
    expect(ROLE_PERMISSIONS['owner']).toContain('sops.delete');
    expect(ROLE_PERMISSIONS['admin']).toContain('sops.delete');
    expect(ROLE_PERMISSIONS['bic']).toContain('sops.delete');
    expect(ROLE_PERMISSIONS['sop_contributor']).not.toContain('sops.delete');
  });

  it('2. Verifies sopRepository.deleteSop deletes published SOP when allowPublished is true', async () => {
    const testSopId = `test_sop_del_${Date.now()}`;
    const testSop = {
      id: testSopId,
      tenantId,
      workspaceId,
      title: 'Temporary Test SOP for Deletion',
      purpose: 'Testing admin deletion of published SOP',
      status: 'published' as const,
      version: 1,
      orderedSteps: [],
      systemsUsed: []
    };

    await sopRepository.saveDraft(testSop as any);
    expect(await sopRepository.getDraftById(testSopId, tenantId)).toBeDefined();

    const success = await sopRepository.deleteSop(testSopId, tenantId, 'Ryan Crecelius (Owner)', true);
    expect(success).toBe(true);

    expect(await sopRepository.getDraftById(testSopId, tenantId)).toBeNull();
  });

  it('3. Verifies non-admin deleteSop call blocks deletion of published SOP when allowPublished is false', async () => {
    const testSopId = `test_sop_pub_block_${Date.now()}`;
    const testSop = {
      id: testSopId,
      tenantId,
      workspaceId,
      title: 'Protected Published SOP',
      purpose: 'Testing protection against non-admin deletion',
      status: 'published' as const,
      version: 1,
      orderedSteps: [],
      systemsUsed: []
    };

    await sopRepository.saveDraft(testSop as any);

    await expect(
      sopRepository.deleteSop(testSopId, tenantId, 'Contributor User', false)
    ).rejects.toThrow(/Governance violation/);

    await sopRepository.deleteSop(testSopId, tenantId, 'System Clean', true);
  });

  it('4. Verifies Express route handles published SOP deletion for authorized admins (Ryan, Adam, Marcus, Matt)', async () => {
    const admins = [
      { email: 'ryan.crecelius@nestrealty.com', role: 'owner' },
      { email: 'adam@shapework.co', role: 'admin' },
      { email: 'marcus@shapework.co', role: 'admin' },
      { email: 'matt.orr@nestrealty.com', role: 'bic' }
    ];

    for (const admin of admins) {
      const sopId = `sop_test_admin_${admin.email.split('@')[0]}_${Date.now()}`;
      await sopRepository.saveDraft({
        id: sopId,
        tenantId,
        workspaceId,
        title: `SOP deleted by ${admin.email}`,
        status: 'published' as const,
        version: 1,
        orderedSteps: [],
        systemsUsed: []
      } as any);

      const res = await fetch(`${baseUrl}/api/sops/${sopId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': admin.email,
          'x-user-role': admin.role
        }
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(await sopRepository.getDraftById(sopId, tenantId)).toBeNull();
    }

    const nonAdminRes = await fetch(`${baseUrl}/api/sops/any_sop`, {
      method: 'DELETE',
      headers: {
        'x-user-email': 'contributor@nestrealty.com',
        'x-user-role': 'sop_contributor'
      }
    });

    expect(nonAdminRes.status).toBe(403);
  });

  it('5. Verifies UI components SOPDocumentView, SOPLibrary, and StaffSOPTemplateModal use useToast and avoid browser alert() popups', () => {
    const docViewPath = path.resolve(process.cwd(), 'src/components/sops/SOPDocumentView.tsx');
    const docContent = fs.readFileSync(docViewPath, 'utf-8');

    expect(docContent).toContain('Delete SOP');
    expect(docContent).toContain('showDeleteConfirm');
    expect(docContent).toContain('Admin Deletion Warning');
    expect(docContent).toContain('Permanently Delete SOP');
    expect(docContent).toContain('onDeleteSop');
    expect(docContent).toContain('useToast');
    expect(docContent).not.toContain('alert(');

    const libraryPath = path.resolve(process.cwd(), 'src/components/sops/SOPLibrary.tsx');
    const libContent = fs.readFileSync(libraryPath, 'utf-8');

    expect(libContent).toContain('sopToDelete');
    expect(libContent).toContain('handleDeleteSopConfirm');
    expect(libContent).toContain('Admin: Delete SOP');
    expect(libContent).toContain('Admin Deletion Warning');
    expect(libContent).toContain('useToast');
    expect(libContent).not.toContain('alert(');

    const staffModalPath = path.resolve(process.cwd(), 'src/components/sops/StaffSOPTemplateModal.tsx');
    const staffContent = fs.readFileSync(staffModalPath, 'utf-8');
    expect(staffContent).toContain('useToast');
    expect(staffContent).not.toContain('alert(');
  });
});
