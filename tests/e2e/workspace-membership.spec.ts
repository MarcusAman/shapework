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
      PORT: '3005'
    }
  });

  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 3000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('validates dynamic workspace membership access in production', async ({ request }) => {
  // Onboard new workspace with valid config payload
  const setupRes = await request.post('http://127.0.0.1:3005/api/workspaces/activate', {
    headers: {
      'Origin': 'http://127.0.0.1:3005'
    },
    data: {
      workspace: {
        name: 'My Prod Workspace',
        ownerEmail: 'owner@prod.co',
        ownerName: 'Owner User',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc@prod.co'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // Authenticate by logging in first
  const loginRes = await request.post('http://127.0.0.1:3005/api/auth/login', {
    headers: {
      'Origin': 'http://127.0.0.1:3005'
    },
    data: { email: 'owner@prod.co', password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = cookieHeaders.split(';')[0];

  // Fetch db-state with valid membership
  const successRes = await request.get('http://127.0.0.1:3005/api/db-state', {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'my-prod-workspace'
    }
  });
  expect(successRes.status()).toBe(200);

  // Non-member workspace ID should return 403
  const forbiddenRes = await request.get('http://127.0.0.1:3005/api/db-state', {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'other-workspace-id'
    }
  });
  expect(forbiddenRes.status()).toBe(403);
});
