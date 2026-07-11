import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });
let serverProcess: ChildProcess;
const PORT = '3023';

test.beforeAll(async () => {
  await pool.query('DELETE FROM workspace_memberships');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM workspaces');

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

test('Workspace Isolation - Prevent Cross-Tenant Access and Parameter Tampering', async ({ request }) => {
  // 1. Onboard Workspace Alpha
  const setupAlphaRes = await request.post(`http://127.0.0.1:${PORT}/api/workspaces/activate`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: {
      workspace: {
        name: 'Workspace Alpha',
        ownerName: 'Owner Alpha',
        ownerEmail: 'owner-a@alpha.com',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-a@alpha.com'
      }
    }
  });
  expect(setupAlphaRes.status()).toBe(200);

  // 2. Onboard Workspace Beta
  const setupBetaRes = await request.post(`http://127.0.0.1:${PORT}/api/workspaces/activate`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: {
      workspace: {
        name: 'Workspace Beta',
        ownerName: 'Owner Beta',
        ownerEmail: 'owner-b@beta.com',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-b@beta.com'
      }
    }
  });
  expect(setupBetaRes.status()).toBe(200);

  // 3. Log in as Owner Alpha to obtain Session Alpha Cookie
  const loginAlphaRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: { email: 'owner-a@alpha.com', password: 'password123' }
  });
  expect(loginAlphaRes.status()).toBe(200);
  const cookieHeaders = loginAlphaRes.headers()['set-cookie'] || '';
  const cookieAlpha = cookieHeaders.split(';')[0];

  // 4. Access Workspace Alpha state - Should Succeed
  const accessAlphaRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=workspace-alpha`, {
    headers: {
      'Cookie': cookieAlpha,
      'x-workspace-id': 'workspace-alpha'
    }
  });
  expect(accessAlphaRes.status()).toBe(200);

  // 5. Tampering Attempt - Access Workspace Beta using Session Alpha (Header Tampering) - Should Fail
  const headerTamperingRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state`, {
    headers: {
      'Cookie': cookieAlpha,
      'x-workspace-id': 'workspace-beta'
    }
  });
  expect([401, 403]).toContain(headerTamperingRes.status());

  // 6. Tampering Attempt - Access Workspace Beta via Query Parameters (Bypassing x-workspace-id header) - Should Fail
  const queryTamperingRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=workspace-beta`, {
    headers: {
      'Cookie': cookieAlpha
      // No x-workspace-id header
    }
  });
  expect([400, 401]).toContain(queryTamperingRes.status());
});
