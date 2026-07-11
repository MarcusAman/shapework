import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';
import { hashPassword } from '../../server/auth/password.js';

const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });
let serverProcess: ChildProcess;
const PORT = '3025';

test.beforeAll(async () => {
  await pool.query('DELETE FROM workspace_memberships');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM workspaces');

  // Insert workspace
  await pool.query(`
    INSERT INTO workspaces (id, name, slug, industry, status, phase, timezone, launch_mode, launch_owner, created_at, updated_at)
    VALUES ('role-test-brokerage', 'Role Test Brokerage', 'role-test-brokerage', 'real_estate_brokerage', 'active', 'pilot', 'America/New_York', 'integration_first', 'Sarah Jenkins', NOW(), NOW())
  `);

  const roles = ['owner', 'admin', 'operations_lead', 'transaction_coordinator', 'agent', 'client'];
  const hash = hashPassword('password123');

  for (const role of roles) {
    const userId = `usr_${role}_test`;
    const email = `${role}-test@brokerage.com`;

    await pool.query(`
      INSERT INTO users (id, email, name, status, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', $4, NOW(), NOW())
    `, [userId, email, `${role} User`, hash]);

    await pool.query(`
      INSERT INTO workspace_memberships (id, user_id, workspace_id, role, permissions, created_at, updated_at)
      VALUES ($1, $2, 'role-test-brokerage', $3, $4, NOW(), NOW())
    `, [`m_${userId}`, userId, role, []]); // Empty permissions array as they resolve from ROLE_PERMISSIONS in auth
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      ADMIN_BOOTSTRAP_SECRET: 'bootstrap_secret_2026',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  await pool.end();
});

test('Role Permissions - Enforce authorization matrix across all roles', async ({ request }) => {
  const rolesMatrix = [
    { role: 'owner', email: 'owner-test@brokerage.com', expectedStatus: 200 },
    { role: 'admin', email: 'admin-test@brokerage.com', expectedStatus: 200 },
    { role: 'operations_lead', email: 'operations_lead-test@brokerage.com', expectedStatus: 403 },
    { role: 'transaction_coordinator', email: 'transaction_coordinator-test@brokerage.com', expectedStatus: 403 },
    { role: 'agent', email: 'agent-test@brokerage.com', expectedStatus: 403 },
    { role: 'client', email: 'client-test@brokerage.com', expectedStatus: 403 }
  ];

  for (let i = 0; i < rolesMatrix.length; i++) {
    const item = rolesMatrix[i];
    // 1. Authenticate user
    const loginRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
      headers: { 
        'Origin': `http://127.0.0.1:${PORT}`,
        'x-forwarded-for': `12.34.56.${i + 1}`
      },
      data: { email: item.email, password: 'password123' }
    });
    expect(loginRes.status()).toBe(200);

    const cookieHeaders = loginRes.headers()['set-cookie'] || '';
    const cookie = cookieHeaders.split(';')[0];

    // 2. Query operating records router (requires manage_workspace permission)
    const opRecordRes = await request.get(`http://127.0.0.1:${PORT}/api/operating-record`, {
      headers: {
        'Cookie': cookie,
        'x-workspace-id': 'role-test-brokerage'
      }
    });

    expect(opRecordRes.status()).toBe(item.expectedStatus);
  }
});
