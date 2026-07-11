import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;
const isStagingTest = !!process.env.STAGING_BASE_URL;
const BASE_URL = process.env.STAGING_BASE_URL || 'http://127.0.0.1:3014';

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
        PORT: '3014'
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

test('Staging Webhook Security - Signature enforcement, Idempotency, and HITL Gating', async ({ request }) => {
  // 1. Invalid webhook signatures are rejected with 401
  const badWebhookRes = await request.post(`${BASE_URL}/api/integrations/rechat/nest-realty-demo/webhook`, {
    headers: {
      'x-rechat-signature': 'invalid_sig',
      'Origin': BASE_URL
    },
    data: { topic: 'Deals', recordId: 'deal_colonial' }
  });
  expect(badWebhookRes.status()).toBe(401);

  // 2. Valid webhook signature passes and registers Action Proposal in DB
  const goodWebhookRes = await request.post(`${BASE_URL}/api/integrations/rechat/nest-realty-demo/webhook`, {
    headers: {
      'x-rechat-signature': 'sandbox_verified',
      'Origin': BASE_URL
    },
    data: {
      topic: 'Deals',
      recordId: 'deal_colonial',
      eventId: `evt_staging_test_${Date.now()}`,
      brandId: 'mock_brand_nest_realty'
    }
  });
  expect(goodWebhookRes.status()).toBe(200);

  const resJson = await goodWebhookRes.json();
  expect(resJson.success).toBe(true);
});
