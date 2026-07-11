import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3013';

test.beforeAll(async () => {
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
});

test('CSRF Protection - Reject mismatched, missing, or cross-site origin headers', async ({ request }) => {
  const loginUrl = `http://127.0.0.1:${PORT}/api/auth/login`;

  // 1. Rejected - Mismatched Origin Header (Cross-Site)
  const crossSiteRes = await request.post(loginUrl, {
    headers: {
      'Origin': 'http://malicious-attacker.com'
    },
    data: { email: 'any@domain.com', password: 'password' }
  });
  expect(crossSiteRes.status()).toBe(403);
  const crossSiteData = await crossSiteRes.json();
  expect(crossSiteData.message).toBe('CSRF protection block: origin host mismatch.');

  // 2. Rejected - Missing both Origin and Referer in Production
  const missingRes = await request.post(loginUrl, {
    headers: {},
    data: { email: 'any@domain.com', password: 'password' }
  });
  expect(missingRes.status()).toBe(403);
  const missingData = await missingRes.json();
  expect(missingData.message).toBe('CSRF protection block: Origin or Referer header required.');

  // 3. Accepted - Matching/Valid Localhost Origin
  const validRes = await request.post(loginUrl, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: { email: 'any@domain.com', password: 'password' } // Will be 401 instead of 403 CSRF block
  });
  expect(validRes.status()).toBe(401); // Exits CSRF filter and fails at normal credentials verify
});
