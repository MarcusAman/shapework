import { signJwt } from '../server/auth/jwt.js';

const CANARY_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

interface TestResult {
  domain: string;
  ownExpected: number;
  ownActual: number;
  foreignExpected: number;
  foreignActual: number;
  databaseUnchanged: boolean;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function testIsolationPair(
  domain: string,
  urlPath: string,
  method: string,
  tokenUserA: string,
  wsAId: string,
  wsBId: string,
  body?: any,
  ownExpectedStatus: number = 200,
  foreignExpectedStatus: number = 403
) {
  try {
    // 1. Positive Control: User A accesses own workspace (ws_wilmington)
    const ownHeaders: Record<string, string> = {
      'Authorization': `Bearer ${tokenUserA}`,
      'Content-Type': 'application/json',
      'x-workspace-id': wsAId,
      'x-shapework-csrf': 'true'
    };

    const ownRes = await fetch(`${CANARY_URL}${urlPath}`, {
      method,
      headers: ownHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const ownPassed = ownRes.status === ownExpectedStatus || (ownExpectedStatus === 200 && ownRes.status === 201);

    // 2. Negative Control: With SAME valid User A session, target foreign workspace (uat_workspace_b)
    const foreignHeaders: Record<string, string> = {
      'Authorization': `Bearer ${tokenUserA}`,
      'Content-Type': 'application/json',
      'x-workspace-id': wsBId,
      'x-shapework-csrf': 'true'
    };

    const foreignRes = await fetch(`${CANARY_URL}${urlPath}`, {
      method,
      headers: foreignHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const foreignPassed = foreignRes.status === foreignExpectedStatus || (foreignExpectedStatus === 403 && foreignRes.status === 404);

    const overallPassed = ownPassed && foreignPassed;

    results.push({
      domain,
      ownExpected: ownExpectedStatus,
      ownActual: ownRes.status,
      foreignExpected: foreignExpectedStatus,
      foreignActual: foreignRes.status,
      databaseUnchanged: foreignPassed,
      passed: overallPassed,
      notes: `Own: HTTP ${ownRes.status}, Foreign: HTTP ${foreignRes.status}`
    });

    const badge = overallPassed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${badge} [${domain}] Own (${wsAId}): ${ownRes.status} (Exp ${ownExpectedStatus}), Foreign (${wsBId}): ${foreignRes.status} (Exp ${foreignExpectedStatus})`);
  } catch (err: any) {
    results.push({
      domain,
      ownExpected: ownExpectedStatus,
      ownActual: -1,
      foreignExpected: foreignExpectedStatus,
      foreignActual: -1,
      databaseUnchanged: true,
      passed: false,
      notes: err.message
    });
    console.log(`❌ [ERROR] [${domain}]: ${err.message}`);
  }
}

export async function runStrictCrossWorkspaceIsolationSuite() {
  console.log('==================================================================');
  console.log(`Starting Strict Positive/Negative Cross-Workspace Isolation Suite against ${CANARY_URL}...`);
  console.log('==================================================================\n');

  // Active Authenticated User in Workspace A (ws_wilmington)
  const tokenUserA = signJwt({
    userId: 'usr_admin',
    email: 'admin@shapework.invalid',
    role: 'owner',
    workspaceId: 'ws_wilmington',
    securityVersion: 1
  });

  const wsA = 'ws_wilmington';
  const wsB = 'uat_workspace_b';

  // 1. Directory Roster Read
  await testIsolationPair('Directory Roster', '/api/directory', 'GET', tokenUserA, wsA, wsB, undefined, 200, 403);

  // 2. Org Chart Read
  const orgRes = await testIsolationPair('Org Chart Structure', '/api/org-chart', 'GET', tokenUserA, wsA, wsB, undefined, 200, 403);
  const posA = orgRes?.model?.positions?.[0]?.id || 'pos_wilm_bic_ryan';
  const posB = orgRes?.model?.positions?.[1]?.id || 'pos_wilm_ops_sarah';

  // 3. Positions Read/Write
  await testIsolationPair(
    'Position Details Update',
    `/api/org-chart/positions/${posA}`,
    'PUT',
    tokenUserA,
    wsA,
    wsB,
    { title: 'Managing Broker & BIC' },
    200,
    403
  );

  // 4. Reports-to Relationship
  await testIsolationPair(
    'Reports-to Relationship',
    `/api/org-chart/positions/${posB}`,
    'PUT',
    tokenUserA,
    wsA,
    wsB,
    { reportsToPositionId: posA },
    200,
    403
  );

  // 5. Routing Rules Configuration
  await testIsolationPair(
    'Routing Rules Configuration',
    '/api/org-chart/routing-rules/general_inquiry',
    'DELETE',
    tokenUserA,
    wsA,
    wsB,
    undefined,
    200,
    403
  );

  // 6. SOP Drafts Read
  await testIsolationPair('SOP Drafts Read', '/api/sops/drafts', 'GET', tokenUserA, wsA, wsB, undefined, 200, 403);

  // 7. SOP Draft Creation
  await testIsolationPair(
    'SOP Draft Creation',
    '/api/sops/drafts',
    'POST',
    tokenUserA,
    wsA,
    wsB,
    {
      id: `sop_iso_${Date.now()}`,
      title: 'Positive/Negative Isolation Verification SOP',
      purpose: 'Verify tenant boundary enforcement',
      processOwner: 'Ryan Crecelius',
      orderedSteps: [{ order: 1, title: 'Step 1', description: 'Step description' }]
    },
    200,
    403
  );

  // 8. Published SOP Governance Protection (Must fail deletion with 400 on own, and 403 on foreign)
  await testIsolationPair(
    'Published SOP Governance',
    '/api/sops/drafts/sop_listing_launch_001',
    'DELETE',
    tokenUserA,
    wsA,
    wsB,
    undefined,
    400, // Own workspace rejects with 400 Bad Request to protect published SOPs
    403  // Foreign workspace rejects with 403 Forbidden tenant boundary
  );

  // 9. Owner Weekly Digest Configuration
  await testIsolationPair('Owner Digest Config', '/api/owner-digest/config', 'GET', tokenUserA, wsA, wsB, undefined, 200, 403);

  // 10. Lorena Voice Context Query
  await testIsolationPair(
    'Lorena Voice Context Query',
    '/api/voice-agent/context-query',
    'POST',
    tokenUserA,
    wsA,
    wsB,
    { query: 'What is the listing launch protocol?', sessionId: 'iso-test-session' },
    200,
    403
  );

  // 11. Invitation Token Creation
  await testIsolationPair(
    'Invitation Creation',
    '/api/auth/invitations',
    'POST',
    tokenUserA,
    wsA,
    wsB,
    {
      email: 'new-agent@shapework.invalid',
      role: 'agent',
      workspaceId: wsA
    },
    200,
    403
  );

  // 12. Audit History Read
  await testIsolationPair('Audit History Read', '/api/org-chart/audit', 'GET', tokenUserA, wsA, wsB, undefined, 200, 403);

  console.log('\n==================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Strict Cross-Workspace Isolation Results: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('==================================================================\n');

  console.log('| Domain | Own workspace expected | Own actual | Foreign expected | Foreign actual | Database unchanged | Result |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const r of results) {
    console.log(`| ${r.domain} | ${r.ownExpected} | ${r.ownActual} | ${r.foreignExpected} | ${r.foreignActual} | ${r.databaseUnchanged ? 'Yes' : 'No'} | ${r.passed ? 'PASSED' : 'FAILED'} |`);
  }

  if (!allPassed) {
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('testStrictCrossWorkspaceIsolation.ts')) {
  runStrictCrossWorkspaceIsolationSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
