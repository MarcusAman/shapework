import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;
const isStagingTest = !!process.env.STAGING_BASE_URL;
const BASE_URL = process.env.STAGING_BASE_URL || 'http://127.0.0.1:3012';
const ALLOWED_ORIGIN = 'https://trusted-partner.local';
const DISALLOWED_ORIGIN = 'https://malicious-site.local';

test.beforeAll(async () => {
  if (!isStagingTest) {
    // Spawn local server with configured ALLOWED_ORIGINS
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        APP_MODE: 'production',
        STORAGE_DRIVER: 'local',
        DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
        AUTH_PROVIDER_CONFIGURED: 'true',
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        ALLOWED_ORIGINS: ALLOWED_ORIGIN,
        PORT: '3012'
      }
    });
    // Wait for server boot
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Staging CORS and CSRF - Verify origin filtering and CORS headers', async ({ request }) => {
  // 1. Allowed Origin works
  const originToTest = isStagingTest ? BASE_URL : ALLOWED_ORIGIN;
  const allowedRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Origin': originToTest },
    data: {
      workspace: { name: 'Cors Trusted Corp', ownerEmail: 'owner@cors.co', ownerName: 'Cors Owner', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'tc@cors.co' }
    }
  });
  expect(allowedRes.status()).toBe(200);
  expect(allowedRes.headers()['access-control-allow-origin']).toBe(originToTest);
  expect(allowedRes.headers()['access-control-allow-credentials']).toBe('true');

  // 2. Disallowed Origin fails with 403 (CORS or CSRF)
  const disallowedRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Origin': DISALLOWED_ORIGIN },
    data: {
      workspace: { name: 'Cors Bad Corp', ownerEmail: 'owner2@cors.co', ownerName: 'Cors Owner 2', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'tc2@cors.co' }
    }
  });
  expect(disallowedRes.status()).toBe(403);

  // 3. Missing Origin/Referer headers in production mode fails with 403
  const missingHeadersRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: {},
    data: {
      workspace: { name: 'Cors Unknown Corp', ownerEmail: 'owner3@cors.co', ownerName: 'Cors Owner 3', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'tc3@cors.co' }
    }
  });
  expect(missingHeadersRes.status()).toBe(403);

  // 4. Spoofed Referer host fails with 403
  const spoofedRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Referer': 'https://bad-referer-site.co/malicious' },
    data: {
      workspace: { name: 'Cors Spoofed Corp', ownerEmail: 'owner4@cors.co', ownerName: 'Cors Owner 4', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'tc4@cors.co' }
    }
  });
  expect(spoofedRes.status()).toBe(403);
});
