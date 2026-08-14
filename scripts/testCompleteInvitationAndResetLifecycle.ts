import { signJwt } from '../server/auth/jwt.js';

const CANARY_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

interface StepResult {
  step: string;
  passed: boolean;
  notes?: string;
}

const results: StepResult[] = [];

async function assertStep(step: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${step}`);
    results.push({ step, passed: true });
  } catch (err: any) {
    console.error(`❌ [FAIL] ${step}:`, err.message);
    results.push({ step, passed: false, notes: err.message });
  }
}

export async function runCompleteInvitationAndResetLifecycleSuite() {
  console.log('==================================================================');
  console.log(`Starting Deployed Invitation & Password Reset Lifecycle against ${CANARY_URL}...`);
  console.log('==================================================================\n');

  const adminToken = signJwt({
    userId: 'usr_ryan_bic',
    email: 'ryan@nestrealty.com',
    role: 'owner',
    workspaceId: 'ws_wilmington',
    securityVersion: 1
  });

  const testEmail = `synthetic.agent.${Date.now()}@shapework.invalid`;
  const initialPassword = 'SyntheticPassword2026!Initial';
  const updatedPassword = 'SyntheticPassword2026!Updated';
  let invitationToken = '';
  let activatedSessionToken = '';
  let resetToken = '';

  // 1. Authorized Admin creates an invitation token for a synthetic .invalid user
  await assertStep('1. Authorized Admin creates invitation for synthetic user', async () => {
    const res = await fetch(`${CANARY_URL}/api/auth/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'x-workspace-id': 'ws_wilmington',
        'x-shapework-csrf': 'true'
      },
      body: JSON.stringify({
        email: testEmail,
        name: 'Synthetic Test Agent',
        role: 'agent',
        workspaceId: 'ws_wilmington'
      })
    });

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Invitation creation failed with HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    if (!data.token && !data.invitation?.rawToken && !data.rawToken) {
      throw new Error('Expected rawToken in invitation response');
    }
    invitationToken = data.token || data.invitation?.rawToken || data.rawToken;
  });

  // 2. Account Activation with New Password
  await assertStep('2. Activate account with valid invitation token and new password', async () => {
    const res = await fetch(`${CANARY_URL}/api/auth/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: invitationToken,
        password: initialPassword
      })
    });

    if (res.status !== 200) {
      throw new Error(`Account activation failed with HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    if (!data.success || !data.token) {
      throw new Error('Expected success and session token in activation response');
    }
    activatedSessionToken = data.token;
  });

  // 3. Verify Active Session can query protected endpoints
  await assertStep('3. Activated user can query protected workspace directory', async () => {
    const res = await fetch(`${CANARY_URL}/api/directory`, {
      headers: {
        'Authorization': `Bearer ${activatedSessionToken}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });

    if (res.status !== 200) {
      throw new Error(`Directory query failed with HTTP ${res.status}: ${await res.text()}`);
    }
  });

  // 4. Replay Invitation Token (Must Fail)
  await assertStep('4. Replayed invitation token is strictly rejected', async () => {
    const res = await fetch(`${CANARY_URL}/api/auth/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: invitationToken,
        password: initialPassword
      })
    });

    if (res.status === 200) {
      throw new Error('Replayed invitation token unexpectedly succeeded!');
    }
  });

  // 5. Request Password Reset (Generic non-disclosing 200 response)
  await assertStep('5. Request password reset returns non-disclosing 200 response', async () => {
    const res = await fetch(`${CANARY_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    if (res.status !== 200) {
      throw new Error(`Forgot password failed with HTTP ${res.status}`);
    }
    const data = await res.json();
    // In UAT test mode, rawToken is returned only in secure harness for automated testing
    resetToken = data.rawToken || data.token || '';
  });

  // 6. Execute Password Reset (if resetToken captured)
  if (resetToken) {
    await assertStep('6. Execute password reset with valid reset token', async () => {
      const res = await fetch(`${CANARY_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          password: updatedPassword
        })
      });

      if (res.status !== 200) {
        throw new Error(`Password reset failed with HTTP ${res.status}: ${await res.text()}`);
      }
    });

    // 7. Verify Prior Session is Revoked (Security Version Invalidation)
    await assertStep('7. Prior active session is revoked following password reset (401)', async () => {
      const res = await fetch(`${CANARY_URL}/api/directory`, {
        headers: {
          'Authorization': `Bearer ${activatedSessionToken}`,
          'x-workspace-id': 'ws_wilmington'
        }
      });

      if (res.status !== 401) {
        throw new Error(`Expected HTTP 401 session revocation, got ${res.status}`);
      }
    });

    // 8. Verify Old Password Fails Login
    await assertStep('8. Login with old password fails (401)', async () => {
      const res = await fetch(`${CANARY_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: initialPassword
        })
      });

      if (res.status !== 401) {
        throw new Error(`Expected HTTP 401 login failure for old password, got ${res.status}`);
      }
    });

    // 9. Verify New Password Succeeds Login
    await assertStep('9. Login with new password succeeds (200 OK)', async () => {
      const res = await fetch(`${CANARY_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: updatedPassword
        })
      });

      if (res.status !== 200) {
        throw new Error(`Login with new password failed with HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      if (!data.token) {
        throw new Error('Expected session token in login response');
      }
    });
  }

  console.log('\n==================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Invitation & Reset Lifecycle Results: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('==================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('testCompleteInvitationAndResetLifecycle.ts')) {
  runCompleteInvitationAndResetLifecycleSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
