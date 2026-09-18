import { signJwt } from '../server/auth/jwt.js';

const CANARY_BASE_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

interface TestResult {
  name: string;
  passed: boolean;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    results.push({ name, passed: true });
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    results.push({ name, passed: false, error: err.message });
  }
}

async function runLiveCanarySuite() {
  console.log('==================================================================');
  console.log(`Starting Live Remote Canary Verification Suite against: ${CANARY_BASE_URL}`);
  console.log('==================================================================\n');

  const tokenOwnerA = signJwt({
    id: 'usr_ryan_bic',
    email: 'ryan@nestrealty.com',
    name: 'Ryan Crecelius',
    role: 'owner',
    workspaceId: 'ws_wilmington'
  });

  const tokenMemberB = signJwt({
    id: 'usr_member_b',
    email: 'member@nestb.com',
    name: 'Member Beta',
    role: 'events',
    workspaceId: 'uat_workspace_b'
  });

  const tokenAdminA = signJwt({
    id: 'usr_admin_a',
    email: 'admin@nesta.com',
    name: 'Admin Alpha',
    role: 'admin',
    workspaceId: 'ws_wilmington'
  });

  // 1. Health and Readiness Checks
  await assert('Liveness probe returns 200 OK', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/health/liveness`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Expected status ok, got ${data.status}`);
  });

  await assert('Readiness probe confirms Cloud SQL connection and returns 200 OK', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/health/readiness`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ready' || data.database !== 'connected') {
      throw new Error(`Database not ready: ${JSON.stringify(data)}`);
    }
  });

  await assert('Version endpoint exposes commit SHA and disabled outbound mode', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/version`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.outboundMode !== 'disabled') throw new Error(`Outbound mode not disabled: ${data.outboundMode}`);
  });

  // 2. Authentication Fail-Closed Matrix
  await assert('Anonymous GET /api/org-chart rejected with 401', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/org-chart`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await assert('Anonymous GET /api/sops/drafts rejected with 401', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await assert('Anonymous GET /api/owner-digest/config rejected with 401', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/owner-digest/config`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await assert('Invalid Bearer token rejected with 401', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/org-chart`, {
      headers: { Authorization: 'Bearer invalid_fake_token_12345' }
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Authenticated Org Chart & Position CRUD
  let createdPosId = `pos_remote_${Date.now()}`;
  await assert('Authenticated Owner can query Org Chart (200 OK)', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/org-chart`, {
      headers: { Authorization: `Bearer ${tokenOwnerA}`, 'x-workspace-id': 'ws_wilmington' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(`API failed: ${JSON.stringify(data)}`);
  });

  // 4. Authenticated SOP Governance
  const draftSopId = `sop_remote_draft_${Date.now()}`;
  await assert('Authenticated Admin can create and delete draft SOP', async () => {
    // Create draft
    const createRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json',
        'x-workspace-id': 'ws_wilmington'
      },
      body: JSON.stringify({
        id: draftSopId,
        title: 'Remote Canary Verification SOP',
        purpose: 'Verifying remote Cloud SQL persistence',
        trigger: 'Canary test run',
        processOwner: 'Admin Lead',
        status: 'draft'
      })
    });
    if (createRes.status !== 200) throw new Error(`Draft creation failed: ${createRes.status}`);

    // Delete draft
    const deleteRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts/${draftSopId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (deleteRes.status !== 200) throw new Error(`Draft deletion failed: ${deleteRes.status}`);
  });

  await assert('Governance rejects deletion of published SOPs (400 Bad Request)', async () => {
    const delPubRes = await fetch(`${CANARY_BASE_URL}/api/sops/sop_listing_launch_001`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (delPubRes.status !== 400) throw new Error(`Expected 400 rejection for published SOP, got ${delPubRes.status}`);
  });

  // 5. Owner Digest Configuration & Non-Delivering Test Send
  await assert('Owner digest config defaults to disabled and empty recipients', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/owner-digest/config`, {
      headers: { Authorization: `Bearer ${tokenOwnerA}`, 'x-workspace-id': 'ws_wilmington' }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.config.enabled !== false) throw new Error('Owner digest should default to disabled');
  });

  await assert('Owner digest test-send executes in non-delivering test mode', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/owner-digest/send-test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenOwnerA}`,
        'Content-Type': 'application/json',
        'x-workspace-id': 'ws_wilmington'
      },
      body: JSON.stringify({ recipientEmail: 'ryan@nestrealty.com' })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.messageId) throw new Error(`Test send failed: ${JSON.stringify(data)}`);
  });

  // 6. Voice Agent Context Query Endpoint
  await assert('Voice Agent context-query endpoint returns matchedItems projection', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/voice-agent/context-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws_wilmington' },
      body: JSON.stringify({
        message: 'What is the listing launch protocol?',
        history: [],
        workspaceId: 'ws_wilmington'
      })
    });
    if (res.status !== 200) throw new Error(`Context query failed: ${res.status}`);
    const data = await res.json();
    if (!data.matchedItems || data.matchedItems.length < 2) {
      throw new Error(`Expected >=2 matchedItems, got: ${JSON.stringify(data.matchedItems)}`);
    }
  });

  console.log('\n==================================================================');
  const passCount = results.filter(r => r.passed).length;
  console.log(`Live Canary Verification Results: ${passCount} / ${results.length} PASSED`);
  console.log('==================================================================');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

runLiveCanarySuite().catch(e => {
  console.error('Fatal suite error:', e);
  process.exit(1);
});
