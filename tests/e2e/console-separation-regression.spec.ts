import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3145';

test.beforeAll(async () => {
  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'memory',
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

test('Console Separation Regression - Strictly enforce app, demo, and internal cockpit access controls', async ({ request }) => {
  // 1. Fetching db-state with an unauthorized workspaceId returns 403 (mismatched membership)
  const mismatchRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=another-unauthorized-workspace`, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah',
      'x-workspace-id': 'another-unauthorized-workspace'
    }
  });
  expect(mismatchRes.status()).toBe(403);
  const mismatchData = await mismatchRes.json();
  expect(mismatchData.error).toBe('Access Denied');

  // 2. Cockpit operations (internal developer tools) require access_developer_tools permission
  const cockpitRes = await request.get(`http://127.0.0.1:${PORT}/api/internal/cockpit/health`, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah'
    }
  });
  expect(cockpitRes.status()).toBe(403);

  const developerCockpitRes = await request.get(`http://127.0.0.1:${PORT}/api/internal/cockpit/health`, {
    headers: {
      'Authorization': 'Bearer token_usr_admin' // Platform Admin (admin role) has access_developer_tools
    }
  });
  expect(developerCockpitRes.status()).toBe(200);
});
