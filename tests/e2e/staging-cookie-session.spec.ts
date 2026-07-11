import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;
const isStagingTest = !!process.env.STAGING_BASE_URL;
const BASE_URL = process.env.STAGING_BASE_URL || 'http://127.0.0.1:3011';

test.beforeAll(async () => {
  if (!isStagingTest) {
    // Spawn local server simulating production cookie settings
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: {
        ...process.env,
        APP_MODE: 'production',
        STORAGE_DRIVER: 'local',
        DATABASE_URL: 'mongodb://localhost:27017/shapework-test',
        AUTH_PROVIDER_CONFIGURED: 'true',
        CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
        JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
        COOKIE_SECURE: 'true',
        PORT: '3011'
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

test('Staging Cookie Session - Secure flags, LocalStorage absence, and Session lifecycle', async ({ request, page }) => {
  // 1. Unauthenticated redirect/401 checks
  const authCheck = await request.get(`${BASE_URL}/api/auth/session`);
  if (authCheck.status() !== 401) {
    console.log('[DEBUG] authCheck status:', authCheck.status());
    console.log('[DEBUG] authCheck body:', await authCheck.text());
    console.log('[DEBUG] authCheck headers:', authCheck.headers());
  }
  expect(authCheck.status()).toBe(401);

  // 2. Onboard / Bootstrap workspace user dynamically
  const onboardRes = await request.post(`${BASE_URL}/api/workspaces/activate`, {
    headers: { 'Origin': BASE_URL },
    data: {
      workspace: { name: 'Cookie Staging Ltd', ownerEmail: 'cookie@staging.co', ownerName: 'Cookie Owner', timezone: 'America/New_York' },
      staff: { transactionCoordinator: 'cookie-tc@staging.co' }
    }
  });
  expect(onboardRes.status()).toBe(200);

  const loginEmail = 'cookie@staging.co';

  // 3. Login and inspect Set-Cookie headers
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    headers: { 'Origin': BASE_URL, 'x-forwarded-for': '34.56.78.90' },
    data: { email: loginEmail, password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);

  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  expect(cookieHeaders).toContain('shapework_session=');
  expect(cookieHeaders.toLowerCase()).toContain('httponly');
  expect(cookieHeaders.toLowerCase()).toContain('samesite=strict');
  expect(cookieHeaders.toLowerCase()).toContain('secure');

  // Parse Cookie from header
  const rawCookie = cookieHeaders.split(';')[0];

  // 4. Verify LocalStorage contains no session tokens
  await page.goto(BASE_URL);
  const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
  expect(localStorageKeys).not.toContain('token');
  expect(localStorageKeys).not.toContain('session');

  // 5. Tampered JWT fails
  const tamperedCookie = rawCookie.substring(0, rawCookie.length - 5) + 'xxxxx';
  const tamperedRes = await request.get(`${BASE_URL}/api/auth/session`, {
    headers: { 'Cookie': tamperedCookie }
  });
  expect(tamperedRes.status()).toBe(401);

  // 6. Logout clears cookie
  const logoutRes = await request.post(`${BASE_URL}/api/auth/logout`, {
    headers: { 'Origin': BASE_URL }
  });
  expect(logoutRes.status()).toBe(200);
  const logoutCookie = logoutRes.headers()['set-cookie'] || '';
  expect(logoutCookie).toContain('Max-Age=0');
  expect(logoutCookie.toLowerCase()).toContain('secure');
});
