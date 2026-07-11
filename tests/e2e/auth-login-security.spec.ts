import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

let serverProcess: ChildProcess;
const PORT = '3009';
const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'database',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      AUTH_PROVIDER_CONFIGURED: 'true',
      ADMIN_BOOTSTRAP_SECRET: 'bootstrap_secret_2026',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log('[Server STDOUT]', data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error('[Server STDERR]', data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 5000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  await pool.end();
});

test('Auth Login Security - Credentials, User States, Rate Limiting, Mismatched Enumeration Checks', async ({ request }) => {
  const workspaceSlug = 'login-security-brokerage';
  const ownerEmail = 'login-owner@brokerage.com';

  // 1. Activate Workspace (Creates owner and seeds user)
  const setupRes = await request.post(`http://127.0.0.1:${PORT}/api/workspaces/activate`, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      workspace: {
        name: 'Login Security Brokerage',
        ownerName: 'Security Lead',
        ownerEmail,
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-sec@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Test successful login
  const loginSuccessRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginSuccessRes.status()).toBe(200);
  const successData = await loginSuccessRes.json();
  expect(successData.success).toBe(true);

  // 3. Test failed login - Mismatched password
  const loginFailPwRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: { email: ownerEmail, password: 'wrongpassword' }
  });
  expect(loginFailPwRes.status()).toBe(401);
  const failPwData = await loginFailPwRes.json();
  expect(failPwData.message).toBe('Invalid email or password.');

  // 4. Test failed login - Fake email (No user enumeration)
  const loginFailEmailRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: { email: 'fake-operator@nonexistent.com', password: 'password123' }
  });
  expect(loginFailEmailRes.status()).toBe(401);
  const failEmailData = await loginFailEmailRes.json();
  expect(failEmailData.message).toBe('Invalid email or password.'); // Must be identical to pw error

  // 5. Test Suspended User State
  // Manually update owner status to suspended in Postgres database
  await pool.query("UPDATE users SET status = 'suspended' WHERE email = $1", [ownerEmail]);

  const loginSuspendedRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: {
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginSuspendedRes.status()).toBe(401);
  const suspendedData = await loginSuspendedRes.json();
  expect(suspendedData.message).toBe('Invalid email or password.'); // Non-revealing error

  // Restore active status
  await pool.query("UPDATE users SET status = 'active' WHERE email = $1", [ownerEmail]);

  // 6. Test Rate Limiter (Trigger max 5 login attempts)
  // Send 10 login requests quickly and assert we eventually receive 429
  let rateLimited = false;
  for (let i = 0; i < 10; i++) {
    const res = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
      headers: {
        'Origin': `http://127.0.0.1:${PORT}`,
        'x-forwarded-for': '12.34.56.78' // Emulate static IP to trigger rate limits
      },
      data: { email: ownerEmail, password: 'wrongpassword' }
    });
    if (res.status() === 429) {
      rateLimited = true;
      break;
    }
  }
  expect(rateLimited).toBe(true);
});
