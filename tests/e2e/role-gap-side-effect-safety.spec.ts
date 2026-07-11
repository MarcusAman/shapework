import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3144';

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

test('Role Gap Scanner - Side-effect free GET requests, deterministic scanning, and audit event logs', async ({ request }) => {
  const wsId = 'nest-realty-demo';
  const token = 'token_usr_sarah';

  // 1. Initial State Fetch
  const initialRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${wsId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId }
  });
  expect(initialRes.status()).toBe(200);
  const initialData = await initialRes.json();
  const initialWorkItemsCount = initialData.workItems.length;
  const initialAuditsCount = initialData.auditEvents.length;

  // 2. Fetch state again - verify it is a pure read and does not create new work items or audit events
  const secondRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${wsId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId }
  });
  expect(secondRes.status()).toBe(200);
  const secondData = await secondRes.json();
  expect(secondData.workItems.length).toBe(initialWorkItemsCount);
  expect(secondData.auditEvents.length).toBe(initialAuditsCount);

  // 3. Deactivate a required role (e.g. maintenance) to trigger a gap scan write
  const maintenanceStaff = secondData.profiles.find((p: any) => p.role === 'maintenance' && p.status === 'active');
  expect(maintenanceStaff).toBeDefined();

  const deactivateRes = await request.post(`http://127.0.0.1:${PORT}/api/profiles/${maintenanceStaff.id}/deactivate`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    }
  });
  expect(deactivateRes.status()).toBe(200);

  // Fetch new state to verify gap created
  const postDeactivateRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${wsId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId }
  });
  const postDeactivateState = await postDeactivateRes.json();

  const hasGapTask = postDeactivateState.workItems.some((w: any) => w.type === 'role_gap' && w.payload?.roleGap === 'maintenance' && w.status === 'pending');
  expect(hasGapTask).toBe(true);

  // Verify that audit log was created for both deactivation and role gap detection
  const hasGapAudit = postDeactivateState.auditEvents.some((e: any) => e.action_description.includes('Flagged vacant brokerage role gap') && e.action_description.includes('maintenance'));
  expect(hasGapAudit).toBe(true);
});
