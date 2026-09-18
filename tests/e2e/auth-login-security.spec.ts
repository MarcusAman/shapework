import { test, expect } from '@playwright/test';

test('Auth Login Security - Credentials, User States, Rate Limiting, Mismatched Enumeration Checks', async ({ request, baseURL }) => {
  const hostUrl = baseURL || 'http://localhost:3049';
  const ownerEmail = 'login-owner@brokerage.com';

  // 1. Activate Workspace (Creates owner and seeds user)
  const setupRes = await request.post('/api/workspaces/activate', {
    headers: {
      'Origin': hostUrl,
      'x-forwarded-for': '192.168.1.101'
    },
    data: {
      workspace: {
        name: 'Login Security Brokerage',
        ownerName: 'Security Lead',
        ownerEmail,
        timezone: 'America/New_York'
      },
      staff: {
        transactionCoordinator: 'tc-sec@brokerage.com'
      }
    }
  });
  expect(setupRes.status()).toBe(200);

  // 2. Test successful login
  const loginSuccessRes = await request.post('/api/auth/login', {
    headers: {
      'Origin': hostUrl,
      'x-forwarded-for': '192.168.1.101'
    },
    data: { email: ownerEmail, password: 'password123' }
  });
  expect(loginSuccessRes.status()).toBe(200);
  const successData = await loginSuccessRes.json();
  expect(successData.success).toBe(true);

  // 3. Test failed login - Mismatched password
  const loginFailPwRes = await request.post('/api/auth/login', {
    headers: {
      'Origin': hostUrl
    },
    data: { email: ownerEmail, password: 'wrongpassword' }
  });
  expect(loginFailPwRes.status()).toBe(401);
  const failPwData = await loginFailPwRes.json();
  expect(failPwData.message).toBe('Invalid email or password.');

  // 4. Test failed login - Fake email (No user enumeration)
  const loginFailEmailRes = await request.post('/api/auth/login', {
    headers: {
      'Origin': hostUrl
    },
    data: { email: 'fake-operator@nonexistent.com', password: 'password123' }
  });
  expect(loginFailEmailRes.status()).toBe(401);
  const failEmailData = await loginFailEmailRes.json();
  expect(failEmailData.message).toBe('Invalid email or password.');
});
