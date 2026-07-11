import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;

test.beforeAll(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }
  
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT: '3006'
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Server A STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Server A STDERR]', data.toString()));

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('enforces workspace isolation and prevents tenant spoofing', async ({ request }) => {
  // Onboard Workspace A
  const setupRes = await request.post('http://127.0.0.1:3006/api/workspaces/activate', {
    headers: {
      'Origin': 'http://127.0.0.1:3006'
    },
    data: {
      workspace: {
        name: 'Workspace A',
        ownerEmail: 'user-a@prod.co',
        ownerName: 'User A',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'coord-a@prod.co'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // Login as User A to get a cryptographically signed cookie
  const loginRes = await request.post('http://127.0.0.1:3006/api/auth/login', {
    headers: {
      'Origin': 'http://127.0.0.1:3006'
    },
    data: { email: 'user-a@prod.co', password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = cookieHeaders.split(';')[0];

  // Attempt to access ws-b with User A credentials
  const res = await request.get('http://127.0.0.1:3006/api/db-state', {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'workspace-b'
    }
  });
  expect(res.status()).toBe(403);
});
