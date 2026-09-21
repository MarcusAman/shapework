import { describe, it, expect } from 'vitest';

describe('Workspace Team Management API Suite', () => {
  const BASE_URL = 'http://localhost:3049';

  it('1. GET /api/workspace/team returns seeded members with correct initial roles and modules', async () => {
    const res = await fetch(`${BASE_URL}/api/workspace/team`, {
      headers: {
        'Authorization': 'Bearer usr_ryan',
        'x-workspace-id': 'nest-realty-wilmington'
      }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.members)).toBe(true);

    const melissa = data.members.find((m: any) => m.id === 'usr_melissa');
    expect(melissa).toBeDefined();
    expect(melissa.email).toBe('Melissa.Gagliardi@nestrealty.com');
    expect(melissa.customModules).toContain('workboard');
    expect(melissa.customModules).toContain('settings_tools');
    expect(melissa.customModules).not.toContain('settings_team');

    const eduardo = data.members.find((m: any) => m.id === 'usr_eduardo');
    expect(eduardo).toBeDefined();
    expect(eduardo.customModules).toEqual(['marketing', 'directory']);
  });

  it('2. PUT /api/workspace/team/:id allows admin to edit user details and custom module permissions', async () => {
    const res = await fetch(`${BASE_URL}/api/workspace/team/usr_eduardo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer usr_ryan',
        'x-admin-override': 'true'
      },
      body: JSON.stringify({
        name: 'Eduardo Lovo',
        email: 'eduardo.lovo@nestrealty.com',
        role: 'Virtual Assistant / Production Specialist',
        office: 'Remote Operations',
        status: 'active',
        customModules: ['marketing', 'directory']
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member.name).toBe('Eduardo Lovo');
    expect(data.member.customModules).toEqual(['marketing', 'directory']);
  });

  it('3. PATCH /api/workspace/team/:id/status toggles user active/inactive status', async () => {
    const res = await fetch(`${BASE_URL}/api/workspace/team/usr_eduardo/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer usr_ryan',
        'x-admin-override': 'true'
      },
      body: JSON.stringify({ status: 'active' })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member.status).toBe('active');
  });
});
