import { signJwt } from '../server/auth/jwt.js';

const CANARY_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

interface TestResult {
  name: string;
  expectedStatus: number | number[];
  actualStatus: number;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function runAttack(
  name: string,
  url: string,
  method: string,
  token: string,
  workspaceHeader: string,
  body?: any,
  expectedStatus: number | number[] = [401, 403, 404]
) {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (workspaceHeader) {
      headers['x-workspace-id'] = workspaceHeader;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const expectedList = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const passed = expectedList.includes(res.status);

    results.push({
      name,
      expectedStatus,
      actualStatus: res.status,
      passed,
      notes: `HTTP ${res.status} returned`
    });

    console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name} -> Got ${res.status} (Expected ${expectedList.join('/')})`);
  } catch (err: any) {
    results.push({
      name,
      expectedStatus,
      actualStatus: -1,
      passed: false,
      notes: err.message
    });
    console.log(`❌ [ERROR] ${name}: ${err.message}`);
  }
}

async function runCrossWorkspaceAttackSuite() {
  console.log('==================================================================');
  console.log(`Starting Deployed Cross-Workspace Attack Suite against ${CANARY_URL}...`);
  console.log('==================================================================\n');

  // Token for User in Workspace A
  const tokenUserA = signJwt({
    userId: 'usr_uat_admin',
    email: 'uat-admin@shapework.invalid',
    role: 'admin',
    workspaceId: 'uat_workspace_a',
    securityVersion: 1
  });

  // Token for User in Workspace B
  const tokenUserB = signJwt({
    userId: 'usr_uat_attacker_b',
    email: 'uat-tenant-b@shapework.invalid',
    role: 'admin',
    workspaceId: 'uat_workspace_b',
    securityVersion: 1
  });

  // Expired Token
  const expiredToken = signJwt({
    userId: 'usr_uat_admin',
    email: 'uat-admin@shapework.invalid',
    role: 'admin',
    workspaceId: 'uat_workspace_a',
    securityVersion: 1
  }, -60);

  // 1. Workspace A user tries to query Workspace B directory via header override
  await runAttack(
    'ATTACK 1: Workspace A user attempts to read Workspace B directory via header override',
    `${CANARY_URL}/api/people`,
    'GET',
    tokenUserA,
    'uat_workspace_b',
    undefined,
    [401, 403, 404]
  );

  // 2. Workspace B user tries to read Wilmington Org Chart via header override
  await runAttack(
    'ATTACK 2: Workspace B user attempts to read Wilmington Org Chart via header override',
    `${CANARY_URL}/api/org-chart`,
    'GET',
    tokenUserB,
    'ws_wilmington',
    undefined,
    [401, 403, 404]
  );

  // 3. Workspace B user tries to delete Wilmington SOP
  await runAttack(
    'ATTACK 3: Workspace B user attempts to delete Wilmington SOP draft',
    `${CANARY_URL}/api/sops/drafts/sop_listing_launch_001`,
    'DELETE',
    tokenUserB,
    'ws_wilmington',
    undefined,
    [401, 403, 404]
  );

  // 4. Workspace A user tries to query Lorena context for Workspace B
  await runAttack(
    'ATTACK 4: Workspace A user attempts to query Lorena context for Workspace B',
    `${CANARY_URL}/api/voice-agent/context-query`,
    'POST',
    tokenUserA,
    'uat_workspace_b',
    { query: 'Who is the broker in charge?' },
    [401, 403, 404]
  );

  // 5. Expired token is rejected
  await runAttack(
    'ATTACK 5: Expired token request to Org Chart',
    `${CANARY_URL}/api/org-chart`,
    'GET',
    expiredToken,
    'uat_workspace_a',
    undefined,
    401
  );

  // 6. Forged tampered token request to SOPs
  await runAttack(
    'ATTACK 6: Forged tampered token request to SOPs',
    `${CANARY_URL}/api/sops/drafts`,
    'GET',
    'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhZG1pbiJ9.invalidSignature',
    'ws_wilmington',
    undefined,
    401
  );

  // 7. Cross-tenant manager assignment (User A attempting to update position in Workspace B)
  await runAttack(
    'ATTACK 7: User A attempting to update Org Chart Position in Workspace B',
    `${CANARY_URL}/api/org-chart/positions/pos_ryan_bic`,
    'PUT',
    tokenUserA,
    'uat_workspace_b',
    { reportsToId: 'pos_matt_bic' },
    [401, 403, 404]
  );

  // 8. Cross-tenant owner digest configuration update
  await runAttack(
    'ATTACK 8: User A attempting to change Workspace B Owner Digest configuration',
    `${CANARY_URL}/api/owner-digest/config`,
    'PUT',
    tokenUserA,
    'uat_workspace_b',
    { enabled: true },
    [401, 403, 404]
  );

  console.log('\n==================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Cross-Workspace Attack Results: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('==================================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('testCrossWorkspaceAttack.ts')) {
  runCrossWorkspaceAttackSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
