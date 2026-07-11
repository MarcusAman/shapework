import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

let serverProcess: ChildProcess;
const PORT = '3141';

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

test('Staff CRUD Security - Authentication, permissions, role limits, and workspace scoping', async ({ request }) => {
  const createUrl = `http://127.0.0.1:${PORT}/api/profiles/create`;

  // 1. Unauthenticated requests are rejected
  const unauthRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer unauthenticated',
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Hacker',
      email: 'hacker@nestrealty.com',
      role: 'agent'
    }
  });
  expect(unauthRes.status()).toBe(401);

  // 2. Access with invalid token is rejected
  const invalidTokenRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer invalid_token_here',
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Hacker',
      email: 'hacker@nestrealty.com',
      role: 'agent'
    }
  });
  expect(invalidTokenRes.status()).toBe(401);

  // 3. Prevent assigning internal shapework roles (restricted role validation)
  const internalRoleRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah',
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Developer Staff',
      email: 'devstaff@nestrealty.com',
      role: 'developer'
    }
  });
  expect(internalRoleRes.status()).toBe(400);
  const internalRoleData = await internalRoleRes.json();
  expect(internalRoleData.error).toBe('Restricted role assignment');

  // 4. Invalid email format is rejected
  const badEmailRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah',
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Bad Email User',
      email: 'invalidemailformat',
      role: 'agent'
    }
  });
  expect(badEmailRes.status()).toBe(400);
  const badEmailData = await badEmailRes.json();
  expect(badEmailData.error).toBe('Invalid email address format');

  // 5. User without manage_users permission is rejected (e.g. transaction coordinator)
  const agentUserRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer token_usr_sarah',
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Test Agent',
      email: 'testagent@nestrealty.com',
      role: 'agent'
    }
  });
  expect(agentUserRes.status()).toBe(200);

  const agentCreateRes = await request.post(createUrl, {
    headers: {
      'Authorization': 'Bearer token_usr_james', // James Fort is a transaction coordinator (no manage_users)
      'x-workspace-id': 'nest-realty-demo',
      'Origin': `http://127.0.0.1:${PORT}`
    },
    data: {
      name: 'Another Agent',
      email: 'anotheragent@nestrealty.com',
      role: 'agent'
    }
  });
  expect(agentCreateRes.status()).toBe(403);
});
