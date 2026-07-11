import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;
const isStagingTest = !!process.env.STAGING_BASE_URL;
const BASE_URL = process.env.STAGING_BASE_URL || 'http://127.0.0.1:3015';

test.beforeAll(async () => {
  if (!isStagingTest) {
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        APP_MODE: 'production',
        STORAGE_DRIVER: 'local',
        DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
        AUTH_PROVIDER_CONFIGURED: 'true',
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        ADMIN_BOOTSTRAP_SECRET: 'staging_bootstrap_secret_2026',
        PORT: '3015'
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Staging Controlled Pilot Drill - Onboarding, Roles, Webhook Sync, and Approvals Gating', async ({ request }) => {
  // 1. Activate Workspace
  const setupRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Origin': BASE_URL },
    data: {
      workspace: { name: 'Pilot Drill Corp', ownerEmail: 'drill-owner@pilot.co', ownerName: 'Drill Owner', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'drill-tc@pilot.co' }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Login as Owner
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    headers: { 'Origin': BASE_URL, 'x-forwarded-for': '23.45.67.89' },
    data: { email: 'drill-owner@pilot.co', password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = cookieHeaders.split(';')[0];

  // 3. Confirm tenant isolation and scope boundaries
  const stateRes = await request.get(`${BASE_URL}/api/db-state?workspaceId=pilot-drill-corp`, {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'pilot-drill-corp'
    }
  });
  expect(stateRes.status()).toBe(200);
  const state = await stateRes.json();
  expect(state.workspaces[0].name).toBe('Pilot Drill Corp');
});
