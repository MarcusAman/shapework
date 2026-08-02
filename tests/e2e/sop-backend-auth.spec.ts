import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3081';

test.beforeAll(async () => {
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dbDir = path.join(process.cwd(), `data-${PORT}`);
  if (fs.existsSync(dbDir)) {
    fs.rmSync(dbDir, { recursive: true, force: true });
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server on port ${PORT} failed to start within 25 seconds.`));
    }, 25000);

    serverProcess.stdout?.on('data', (data) => {
      if (data.toString().includes('Master full-stack server running')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

test.describe('SOP Backend API Authorization & Validation', () => {
  const BASE_URL = `http://localhost:${PORT}`;

  const validSopPayload = {
    sopId: 'sop_test_auth_123',
    title: 'Auth Check SOP',
    purpose: 'To verify authorization checks on endpoints.',
    expectedOutcome: 'Check completed.',
    ownerRole: 'operations_lead',
    status: 'draft',
    version: '1.0',
    steps: [
      {
        id: 'step_1',
        title: 'Perform Check',
        instruction: 'Review authorization guidelines.',
        assignedRole: 'operations_lead',
        type: 'manual'
      }
    ],
    completionEvidence: {
      type: 'manual',
      description: 'Checklist completed successfully.'
    },
    governance: {
      reviewFrequencyDays: 90,
      visibility: 'workspace',
      trainingRequired: false,
      acknowledgementRequired: false,
      effectiveDate: '2026-07-18',
      reviewers: []
    }
  };

  test('1. Unauthenticated users cannot create or update SOPs', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ops/sops`, {
      data: { sop: validSopPayload }
    });
    expect(res.status()).toBe(401);
  });

  test('2. Standard agent (steve) cannot create or update SOP drafts', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ops/sops`, {
      headers: {
        'Authorization': 'Bearer token_usr_steve',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: { sop: validSopPayload }
    });
    expect(res.status()).toBe(403);
  });

  test('3. Operations Lead (sarah) can create and update SOP drafts', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ops/sops`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: { sop: validSopPayload }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sop.status).toBe('draft');
  });

  test('4. Standard agent (steve) cannot publish SOP templates', async ({ request }) => {
    const publishPayload = { ...validSopPayload, status: 'published' };
    const res = await request.post(`${BASE_URL}/api/ops/sops`, {
      headers: {
        'Authorization': 'Bearer token_usr_steve',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: { sop: publishPayload }
    });
    expect(res.status()).toBe(403);
  });

  test('5. Operations Lead (sarah) can publish SOP templates', async ({ request }) => {
    const publishPayload = { ...validSopPayload, status: 'published' };
    const res = await request.post(`${BASE_URL}/api/ops/sops`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: { sop: publishPayload }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sop.status).toBe('published');
  });

  test('6. User from another workspace is blocked from starting a run', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ops/sops/sop_test_auth_123/run`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'other-workspace-id'
      },
      data: {
        sopVersionId: 'sop_test_auth_123_v_1_0',
        title: 'Inter-workspace attempt'
      }
    });
    expect(res.status()).toBe(403);
  });

  test('7. Reject unauthenticated/dangerous protocols in evidence URLs', async ({ request }) => {
    // First, start a valid run as operations lead
    const runRes = await request.post(`${BASE_URL}/api/ops/sops/sop_test_auth_123/run`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        sopVersionId: 'sop_test_auth_123_v_1_0',
        title: 'Evidence Validation Run',
        startedBy: 'sarah.j@nestrealty.com'
      }
    });
    expect(runRes.status()).toBe(200);
    const runBody = await runRes.json();
    const runId = runBody.run.id;

    // Update with javascript: XSS scheme - must be rejected
    const xssRes = await request.put(`${BASE_URL}/api/ops/sops/runs/${runId}`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        stepEvidence: {
          step_1: 'javascript:alert(document.cookie)'
        }
      }
    });
    expect(xssRes.status()).toBe(400);

    // Update with data: scheme - must be rejected
    const dataSchemeRes = await request.put(`${BASE_URL}/api/ops/sops/runs/${runId}`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        stepEvidence: {
          step_1: 'data:text/html,<script>alert(1)</script>'
        }
      }
    });
    expect(dataSchemeRes.status()).toBe(400);

    // Update with valid https URL - must succeed
    const validUrlRes = await request.put(`${BASE_URL}/api/ops/sops/runs/${runId}`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        stepEvidence: {
          step_1: 'https://nestrealty.com/compliance/doc.pdf'
        }
      }
    });
    expect(validUrlRes.status()).toBe(200);
  });

  test('8. Standard agent (steve) cannot accept improvement requests', async ({ request }) => {
    // Seed an improvement request first
    const irRes = await request.post(`${BASE_URL}/api/ops/improvement-requests`, {
      headers: {
        'Authorization': 'Bearer token_usr_sarah',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        id: 'ir_test_accept_123',
        sopId: 'sop_test_auth_123',
        sopVersion: '1.0',
        comment: 'Outdated steps.'
      }
    });
    expect(irRes.status()).toBe(200);

    // Standard agent tries to accept it
    const acceptRes = await request.put(`${BASE_URL}/api/ops/improvement-requests/ir_test_accept_123`, {
      headers: {
        'Authorization': 'Bearer token_usr_steve',
        'x-workspace-id': 'nest-realty-demo'
      },
      data: {
        status: 'accepted'
      }
    });
    expect(acceptRes.status()).toBe(403);
  });
});
