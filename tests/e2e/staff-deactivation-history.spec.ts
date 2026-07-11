import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3143';

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

test('Staff Deactivation - Preserve completed task history and clean up active ones', async ({ request }) => {
  const wsId = 'nest-realty-demo';
  const token = 'token_usr_sarah';

  // 1. Get initial state
  const stateRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${wsId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId }
  });
  expect(stateRes.status()).toBe(200);
  const stateData = await stateRes.json();

  // Find a profile to deactivate, e.g., Ann Gunn
  const annGunn = stateData.profiles.find((p: any) => p.name === 'Ann Gunn');
  expect(annGunn).toBeDefined();

  // Add a completed task assigned to Ann Gunn
  const createItemRes = await request.post(`http://127.0.0.1:${PORT}/api/work-items/create`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      title: 'Completed Compliance File Audit',
      type: 'closing_compliance_risk',
      source: 'system',
      ownerRole: 'operations_lead',
      priority: 'high'
    }
  });
  expect(createItemRes.status()).toBe(200);
  const completedItemData = await createItemRes.json();
  const completedItem = completedItemData.workItem;

  // Update it to completed and assign to Ann Gunn
  const updateCompletedRes = await request.post(`http://127.0.0.1:${PORT}/api/work-items/${completedItem.id}/update`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      status: 'completed',
      assignedStaffMemberId: annGunn.id
    }
  });
  expect(updateCompletedRes.status()).toBe(200);

  // Add a pending task assigned to Ann Gunn
  const createPendingRes = await request.post(`http://127.0.0.1:${PORT}/api/work-items/create`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      title: 'Pending Compliance File Audit',
      type: 'closing_compliance_risk',
      source: 'system',
      ownerRole: 'operations_lead',
      priority: 'high'
    }
  });
  expect(createPendingRes.status()).toBe(200);
  const pendingItemData = await createPendingRes.json();
  const pendingItem = pendingItemData.workItem;

  // Assign it to Ann Gunn
  const updatePendingRes = await request.post(`http://127.0.0.1:${PORT}/api/work-items/${pendingItem.id}/update`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      assignedStaffMemberId: annGunn.id
    }
  });
  expect(updatePendingRes.status()).toBe(200);

  // 2. Deactivate Ann Gunn
  const deactivateRes = await request.post(`http://127.0.0.1:${PORT}/api/profiles/${annGunn.id}/deactivate`, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'x-workspace-id': wsId,
      'Origin': `http://127.0.0.1:${PORT}`
    }
  });
  expect(deactivateRes.status()).toBe(200);

  // 3. Fetch state and check assignments
  const newStateRes = await request.get(`http://127.0.0.1:${PORT}/api/db-state?workspaceId=${wsId}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId }
  });
  const newState = await newStateRes.json();

  const completedTaskAfter = newState.workItems.find((w: any) => w.id === completedItem.id);
  const activeTaskAfter = newState.workItems.find((w: any) => w.id === pendingItem.id);

  // Completed task still retains historical owner details
  expect(completedTaskAfter.assignedStaffMemberId).toBe(annGunn.id);
  expect(completedTaskAfter.assignedOwnerName).toBe(annGunn.name);

  // Active task has been unassigned/reassigned (assignedStaffMemberId should be cleared or reassigned)
  expect(activeTaskAfter.assignedStaffMemberId).not.toBe(annGunn.id);

  // Verify that an audit event was logged
  const hasDeactivateAudit = newState.auditEvents.some((e: any) => e.action_description.includes('Deactivated staff member') && e.action_description.includes('Ann Gunn'));
  expect(hasDeactivateAudit).toBe(true);
});
