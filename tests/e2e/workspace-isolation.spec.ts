import { test, expect } from '@playwright/test';

test('enforces workspace isolation and prevents tenant spoofing', async ({ request, baseURL }) => {
  const hostUrl = baseURL || 'http://localhost:3049';

  // Onboard Workspace A
  const setupRes = await request.post('/api/workspaces/activate', {
    headers: {
      'Origin': hostUrl,
      'x-forwarded-for': '192.168.1.100'
    },
    data: {
      workspace: {
        name: 'Workspace A',
        ownerEmail: 'user-a@prod.co',
        ownerName: 'User A',
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'coord-a@prod.co'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // Login as User A to get a cryptographically signed cookie
  const loginRes = await request.post('/api/auth/login', {
    headers: {
      'Origin': hostUrl,
      'x-forwarded-for': '192.168.1.100'
    },
    data: { email: 'user-a@prod.co', password: 'password123' }
  });
  expect(loginRes.status()).toBe(200);
  const cookieHeaders = loginRes.headers()['set-cookie'] || '';
  const rawCookie = Array.isArray(cookieHeaders) ? cookieHeaders.join('; ') : cookieHeaders.split(';')[0];

  // Attempt to access workspace-b with User A credentials
  const res = await request.get('/api/db-state', {
    headers: {
      'Cookie': rawCookie,
      'x-workspace-id': 'workspace-b'
    }
  });
  expect(res.status()).toBe(403);
});
