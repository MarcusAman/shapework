import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://mock:mock@localhost:5432/mock' });
let serverProcess: ChildProcess;
const PORT = '3027';

test.beforeAll(async () => {
  await pool.query('DELETE FROM workspace_memberships');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM workspaces');

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
  await pool.end();
});

test('External Action Safety - Gate webhooks through Approval proposals', async ({ request }) => {
  const workspaceSlug = 'nest-realty-demo';
  const ownerEmail = 'sarah.j@nest-demo.local';

  // 1. Perform Setup/Activation using admin bootstrap
  const setupRes = await request.post(`http://127.0.0.1:${PORT}/api/workspaces/activate`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: {
      workspace: {
        name: 'Nest Realty Demo Workspace',
        ownerName: 'Sarah Jenkins',
        ownerEmail,
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-safety@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Perform login as owner
  const loginRes = await request.post(`http://127.0.0.1:${PORT}/api/auth/login`, {
    headers: { 'Origin': `http://127.0.0.1:${PORT}` },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const cookie = cookieHeaders.split(';')[0];

  // 3. Trigger Mock Rechat Webhook using sandbox signature bypass
  const webhookUrl = `http://127.0.0.1:${PORT}/api/integrations/rechat/${workspaceSlug}/webhook`;
  const webhookRes = await request.post(webhookUrl, {
    headers: {
      'x-rechat-signature': 'sandbox_verified',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      topic: 'Deals',
      recordId: 'deal_colonial',
      eventId: 'evt_test_webhook_123',
      brandId: 'mock_brand_nest_realty'
    }
  });
  expect(webhookRes.status()).toBe(200);

  // 4. Verify that an Action Proposal was created with status 'awaiting_approval'
  const stateRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${workspaceSlug}`, {
    headers: {
      'Cookie': cookie,
      'x-workspace-id': workspaceSlug
    }
  });
  expect(stateRes.status()).toBe(200);
  const state = await stateRes.json();
  
  // Find the proposed action
  const proposals = state.actionProposals || [];
  const rechatProposal = proposals.find((p: any) => p.isRechatWriteback || p.title?.includes('Submit Brokerage Intake Form'));
  
  expect(rechatProposal).toBeDefined();
  expect(rechatProposal.state).toBe('awaiting_approval'); // Must gate through approval center!
});
