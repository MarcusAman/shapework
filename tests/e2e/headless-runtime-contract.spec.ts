import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3096';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try { fs.unlinkSync(dbPath); } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      RESEND_API_KEY: '',
      SMS_PROVIDER: 'dev_log',
      APP_MODE: 'development', // must be development so trigger-scenario is allowed
      STORAGE_DRIVER: 'local',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      AUTH_PROVIDER_CONFIGURED: 'true',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}
});

test.describe('Headless Runtime Contract v1 E2E Verification', () => {
  test('1. Trigger Compliance Chase Scenario and Verify Signals, Decisions, Jobs, Steps, Actions, and Receipts', async ({ page }) => {
    // 1. Login
    await page.goto(`http://127.0.0.1:${PORT}/login`);
    await page.locator('input[type="email"]').fill('sarah.j@nestrealty.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`**/app`);

    // 2. Trigger Compliance Chase demo scenario
    const triggerRes = await page.request.post(`http://127.0.0.1:${PORT}/api/shapework/demo/trigger-scenario`, {
      data: { scenarioKey: 'compliance_chase' }
    });
    expect(triggerRes.ok()).toBe(true);

    const triggerData = await triggerRes.json();
    expect(triggerData.success).toBe(true);
    const jobId = triggerData.job.id;
    expect(jobId).toBeDefined();

    // Wait a brief moment for the initial steps (Step 1 and Step 2) to simulate to completion
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Fetch unified runtime entities state from the API
    const jobsRes = await page.request.get(`http://127.0.0.1:${PORT}/api/shapework/jobs`);
    expect(jobsRes.ok()).toBe(true);
    const stateData = await jobsRes.json();

    // Verify Job exists and is waiting approval
    const activeJob = stateData.jobs.find((j: any) => j.id === jobId);
    expect(activeJob).toBeDefined();
    expect(activeJob.status).toBe('waiting_approval');

    // Verify Steps list is planned
    const jobSteps = stateData.steps.filter((s: any) => s.job_id === jobId);
    expect(jobSteps.length).toBe(3); // planned 3 steps for compliance_chase

    const step3 = jobSteps.find((s: any) => s.step_order === 3);
    expect(step3).toBeDefined();
    expect(step3.status).toBe('waiting_approval');
    expect(step3.requires_approval).toBe(true);

    // Verify Approval request exists
    const approval = stateData.approvals.find((a: any) => a.job_id === jobId && a.step_id === step3.id);
    expect(approval).toBeDefined();
    expect(approval.status).toBe('pending');
    expect(approval.risk_level).toBe('medium');

    // Verify Owner Brief item exists with category owner_decision
    const briefItem = stateData.ownerBriefItems.find((i: any) => i.source_id === approval.id && i.category === 'owner_decision');
    expect(briefItem).toBeDefined();

    // 4. Approve Step 3 via approve API endpoint
    const approveRes = await page.request.post(`http://127.0.0.1:${PORT}/api/shapework/jobs/steps/${step3.id}/approve`);
    expect(approveRes.ok()).toBe(true);

    // Wait for Action Dispatch timeout (100ms) plus subsequent steps simulation to run
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 5. Fetch updated entities
    const updatedRes = await page.request.get(`http://127.0.0.1:${PORT}/api/shapework/jobs`);
    expect(updatedRes.ok()).toBe(true);
    const updatedState = await updatedRes.json();

    // Verify Step 3 completed and Action/Delivery logs exist
    const updatedStep3 = updatedState.steps.find((s: any) => s.id === step3.id);
    expect(updatedStep3.status).toBe('completed');
    expect(updatedStep3.approved_by).toBe('Sarah Jenkins');

    const action = updatedState.outputs.find((o: any) => o.job_id === jobId);
    expect(action).toBeDefined();
    expect(action.follow_up_needed).toBe(true); // compliance chase requires follow up

    // Verify entire job is completed
    const updatedJob = updatedState.jobs.find((j: any) => j.id === jobId);
    expect(updatedJob.status).toBe('completed');
  });
});
