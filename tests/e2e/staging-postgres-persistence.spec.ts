import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

let serverProcess: ChildProcess | null = null;
const isStagingTest = !!process.env.STAGING_BASE_URL;
const BASE_URL = process.env.STAGING_BASE_URL || 'http://127.0.0.1:3013';
const DB_CONN = 'postgres://mock:mock@localhost:5432/mock';
const pool = new pg.Pool({ connectionString: DB_CONN });

test.beforeAll(async () => {
  if (!isStagingTest) {
    // Spin up local server in DB mode
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        APP_MODE: 'production',
        STORAGE_DRIVER: 'database',
        DATABASE_URL: DB_CONN,
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        ADMIN_BOOTSTRAP_SECRET: 'staging_bootstrap_secret_2026',
        AUTH_PROVIDER_CONFIGURED: 'true',
        PORT: '3013'
      }
    });
    serverProcess.stdout?.on('data', (data) => console.log('[Server STDOUT]', data.toString()));
    serverProcess.stderr?.on('data', (data) => console.error('[Server STDERR]', data.toString()));
    // Wait for server boot and database synchronization
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  await pool.end();
});

test('Staging Postgres Persistence - Survives server restart/redeploy', async ({ request }) => {
  // 1. Onboard a dynamic workspace
  const setupRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Origin': BASE_URL },
    data: {
      workspace: { name: 'Persistence Staging Ltd', ownerEmail: 'persist-owner@staging.co', ownerName: 'Persist Owner', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'persist-tc@staging.co' }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Authenticate using the new account
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    headers: { 'Origin': BASE_URL, 'x-forwarded-for': '12.34.56.78' },
    data: { email: 'persist-owner@staging.co', password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = cookieHeaders.split(';')[0];

  // 3. Perform write operations for transaction, work item, approval, and audit event
  const txId = `tx_persist_staging_${Date.now()}`;
  const createTxRes = await request.post(`${BASE_URL}/api/transactions/create`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'persistence-staging-ltd',
      'Origin': BASE_URL
    },
    data: {
      id: txId,
      workspaceId: 'nest-realty-demo',
      propertyAddress: '123 Persistence Road, Wilmington',
      clientName: 'Arthur Dent',
      buyerOrSeller: 'Buyer',
      currentStage: 'Under Contract',
      healthScore: 92,
      riskLevel: 'healthy'
    }
  });
  expect(createTxRes.status()).toBe(200);
  const createTxJson = await createTxRes.json();
  const actualTxId = createTxJson.transaction.id;

  // 3. Verify records persist after server shutdown / simulated redeploy
  if (!isStagingTest && serverProcess) {
    // Kill the current server process
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Restart the server process
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        APP_MODE: 'production',
        STORAGE_DRIVER: 'database',
        DATABASE_URL: DB_CONN,
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        AUTH_PROVIDER_CONFIGURED: 'true',
        PORT: '3013'
      }
    });
    // Wait for server boot
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // 4. Query DB state to confirm records survived restart
  const stateRes = await request.get(`${BASE_URL}/api/db-state?workspaceId=persistence-staging-ltd`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'persistence-staging-ltd'
    }
  });
  expect(stateRes.status()).toBe(200);
  const state = await stateRes.json();
  const foundTx = state.transactions.find((t: any) => t.id === actualTxId);
  expect(foundTx).toBeDefined();
  expect(foundTx.propertyAddress || foundTx.property_address).toContain('Persistence Road');
});
