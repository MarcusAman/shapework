import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3140';

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'production',
      STORAGE_DRIVER: 'local',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      DATABASE_URL: 'postgres://mock:mock@localhost:5432/mock',
      JWT_SECRET: 'test_jwt_signing_secret_at_least_32_chars_long!',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log(`[Server ${PORT} STDOUT]`, data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error(`[Server ${PORT} STDERR]`, data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 12000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Auth Consistency - Cookie-based HttpOnly JWT sessions in production', async ({ request }) => {
  const stateUrl = `http://127.0.0.1:${PORT}/api/db-state`;

  // 1. Plaintext/seeded Bearer tokens are rejected in production mode
  const seededBearerRes = await request.get(stateUrl, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah',
      'x-workspace-id': 'nest-realty-demo'
    }
  });
  expect(seededBearerRes.status()).toBe(401);

  // 2. Random invalid Bearer tokens are rejected
  const fakeBearerRes = await request.get(stateUrl, {
    headers: {
      'Authorization': 'Bearer fake_invalid_bearer_token',
      'x-workspace-id': 'nest-realty-demo'
    }
  });
  expect(fakeBearerRes.status()).toBe(401);

  // 3. Requests without credentials are rejected
  const noCredsRes = await request.get(stateUrl, {
    headers: {
      'x-workspace-id': 'nest-realty-demo'
    }
  });
  expect(noCredsRes.status()).toBe(401);
});
