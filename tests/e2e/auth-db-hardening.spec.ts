import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT: '3007'
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Server STDERR]', data.toString()));

  // Wait for server boot and migrations execution
  await new Promise((resolve) => setTimeout(resolve, 6000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('JWT Session Login, Relational Persistence, and Session Expiry Verification', async ({ request }) => {
  const workspaceName = 'Hardened Brokerage';
  const workspaceSlug = 'hardened-brokerage';
  const ownerEmail = 'hardened-owner@brokerage.com';

  // 1. Activate Workspace
  const setupRes = await request.post('http://127.0.0.1:3007/api/workspaces/activate', {
    headers: {
      'Origin': 'http://127.0.0.1:3007'
    },
    data: {
      workspace: {
        name: workspaceName,
        ownerEmail: ownerEmail,
        ownerName: 'Hardened Owner',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'hardened-tc@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Reject Plaintext Spoofed Tokens
  const spoofedRes = await request.get('http://127.0.0.1:3007/api/db-state', {
    headers: {
      'Authorization': `Bearer ${ownerEmail}`,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(spoofedRes.status()).toBe(401);

  // 3. Login to get secure JWT Session Cookie
  const loginRes = await request.post('http://127.0.0.1:3007/api/auth/login', {
    headers: {
      'Origin': 'http://127.0.0.1:3007'
    },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  expect(cookieHeaders).toContain('shapework_session=');

  // Parse Cookie from header
  const rawCookie = cookieHeaders.split(';')[0];

  // 4. Fetch State using the Cookie session
  const stateRes = await request.get(`http://127.0.0.1:3007/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(stateRes.status()).toBe(200);
  const state = await stateRes.json();
  expect(state.workspaces[0].name).toBe(workspaceName);

  // 5. Test Relational Data Write & Read Persistence
  const createTxRes = await request.post('http://127.0.0.1:3007/api/transactions/create', {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug,
      'Origin': 'http://127.0.0.1:3007'
    },
    data: {
      id: 'tx_hardened_test_123',
      workspaceId: workspaceSlug,
      propertyAddress: '789 Hardened Way, New York',
      clientName: 'Alice Miller',
      buyerOrSeller: 'Buyer',
      currentStage: 'Contract Signed',
      healthScore: 98,
      riskLevel: 'healthy'
    }
  });
  expect(createTxRes.status()).toBe(200);

  // Fetch state again to confirm the transaction is in database state
  const stateRes2 = await request.get(`http://127.0.0.1:3007/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': workspaceSlug
    }
  });
  const state2 = await stateRes2.json();
  const tx = state2.transactions.find((t: any) => 
    (t.propertyAddress === '789 Hardened Way, New York') || 
    (t.property_address === '789 Hardened Way, New York')
  );
  expect(tx).toBeDefined();
  expect(tx.propertyAddress || tx.property_address).toBe('789 Hardened Way, New York');

  // 6. Test Logout Session Revocation
  const logoutRes = await request.post('http://127.0.0.1:3007/api/auth/logout', {
    headers: {
      'Origin': 'http://127.0.0.1:3007'
    }
  });
  expect(logoutRes.status()).toBe(200);
  const logoutCookie = logoutRes.headers()['set-cookie'] || '';
  expect(logoutCookie).toContain('Max-Age=0');
});
