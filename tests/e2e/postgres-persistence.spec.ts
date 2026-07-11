import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });

test.beforeAll(async () => {
  // Clear the database workspaces and users to start clean
  await pool.query('DELETE FROM workspace_memberships');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM workspaces');
});

test.afterAll(async () => {
  await pool.end();
});

test('Postgres Relational Persistence - Survival Across Server Restart/Redeploy', async ({ request }) => {
  const workspaceSlug = 'persistence-test-brokerage';
  const ownerEmail = 'persistence-owner@brokerage.com';

  // --- STAGE 1: Start Server A, Activate, and Write Transaction ---
  const portA = '3019';
  const processA = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      ADMIN_BOOTSTRAP_SECRET: 'bootstrap_secret_2026',
      PORT: portA
    }
  });

  // Wait for Server A boot
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 1. Activate Workspace on Server A
  const setupRes = await request.post(`http://127.0.0.1:${portA}/api/workspaces/activate`, {
    headers: { 'Origin': `http://127.0.0.1:${portA}` },
    data: {
      workspace: {
        name: 'Persistence Test Brokerage',
        ownerName: 'Persistence Lead',
        ownerEmail,
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-persist@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Perform Login to obtain valid cookie on Server A
  const loginRes = await request.post(`http://127.0.0.1:${portA}/api/auth/login`, {
    headers: { 'Origin': `http://127.0.0.1:${portA}` },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = cookieHeaders.split(';')[0];

  // 3. Create a transaction on Server A
  const createTxRes = await request.post(`http://127.0.0.1:${portA}/api/transactions/create`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug,
      'Origin': `http://127.0.0.1:${portA}`
    },
    data: {
      propertyAddress: '789 Woodlawn Ave',
      clientName: 'Jane Doe',
      clientEmail: 'jane@doe.com',
      expectedCommission: 13500,
      closingDate: '2026-08-31'
    }
  });
  expect(createTxRes.status()).toBe(200);

  // Assert transaction is in state A
  const stateARes = await request.get(`http://127.0.0.1:${portA}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(stateARes.status()).toBe(200);
  const stateA = await stateARes.json();
  const txA = stateA.transactions.find((t: any) => t.propertyAddress === '789 Woodlawn Ave');
  expect(txA).toBeDefined();

  // Kill Server A to simulate server crash / restart
  processA.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // --- STAGE 2: Start Server B (Redeployment) ---
  const portB = '3021';
  const processB = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      ADMIN_BOOTSTRAP_SECRET: 'bootstrap_secret_2026',
      PORT: portB
    }
  });

  // Wait for Server B boot
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 4. Query Server B state using the same JWT cookie
  // Assert the transaction written on Server A was successfully restored from Postgres
  const stateBRes = await request.get(`http://127.0.0.1:${portB}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(stateBRes.status()).toBe(200);
  const stateB = await stateBRes.json();
  const txB = stateB.transactions.find((t: any) => t.propertyAddress === '789 Woodlawn Ave');
  expect(txB).toBeDefined();
  expect(txB.clientName).toBe('Jane Doe');
  expect(txB.revenue).toBe(13500);

  // Clean up Server B
  processB.kill('SIGTERM');
});
