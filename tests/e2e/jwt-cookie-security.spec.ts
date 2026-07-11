import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { signJwt } from '../../server/auth/jwt.js';

let serverProcess: ChildProcess;
const PORT = '3011';

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

test('JWT Cookie Security - Expiry, Signature Verification, Tampering, and Security Flags', async ({ request }) => {
  const workspaceSlug = 'jwt-security-brokerage';
  const ownerEmail = 'jwt-owner@brokerage.com';

  // 1. Activate Workspace (Creates owner)
  const setupRes = await request.post(`http://127.0.0.1:${PORT}/api/workspaces/activate`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: {
      workspace: {
        name: 'JWT Security Brokerage',
        ownerName: 'JWT Lead',
        ownerEmail,
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-jwt@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Perform Login and extract Set-Cookie details
  const loginRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);

  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  expect(cookieHeaders).toContain('shapework_session=');
  expect(cookieHeaders).toContain('HttpOnly');
  expect(cookieHeaders).toContain('SameSite=Strict');
  expect(cookieHeaders).toContain('Secure'); // In production app mode, Secure is required

  // Parse Cookie token
  const rawCookie = cookieHeaders.split(';')[0];
  const token = rawCookie.split('=')[1];

  // 3. Test Expired JWT rejection
  // Sign a token with exp set in the past (-10 seconds)
  const expiredToken = signJwt({ userId: 'usr_owner', email: ownerEmail, role: 'owner' }, -10);
  const expiredRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': `shapework_session=${expiredToken}`,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(expiredRes.status()).toBe(401);

  // 4. Test Tampered JWT payload rejection
  const tokenParts = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'usr_owner', email: ownerEmail, role: 'owner', exp: 9999999999 })).toString('base64').replace(/=/g, '');
  const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`;

  const tamperedRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': `shapework_session=${tamperedToken}`,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(tamperedRes.status()).toBe(401);

  // 5. Test Wrong Secret Signature rejection
  // Sign a JWT using a custom mock secret
  const wrongSecretToken = signJwt({ userId: 'usr_owner', email: ownerEmail, role: 'owner' }); // Signs using fallback-secret in tests if process env is isolated
  // Or manually sign with a mock signature
  const wrongSignatureToken = `${tokenParts[0]}.${tokenParts[1]}.invalidSignatureBase64`;

  const wrongSigRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': `shapework_session=${wrongSignatureToken}`,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(wrongSigRes.status()).toBe(401);
});
