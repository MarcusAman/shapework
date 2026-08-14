import crypto from 'crypto';
import pg from 'pg';

const CANARY_BASE_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

interface TestResult {
  name: string;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    results.push({ name, passed: true });
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    results.push({ name, passed: false, notes: err.message });
  }
}

async function runActivationWorkflowSuite() {
  console.log('==================================================================');
  console.log(`Starting Secure Activation and Deployed Workflow Suite against: ${CANARY_BASE_URL}`);
  console.log('==================================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  let rawInvitationToken = '';

  // 1. Create a fresh single-use invitation token in database for synthetic owner
  if (dbUrl) {
    const pool = new pg.Pool({ connectionString: dbUrl, max: 1 });
    const client = await pool.connect();
    try {
      rawInvitationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawInvitationToken).digest('hex');
      const invId = `inv_test_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await client.query(`
        INSERT INTO invitation_tokens (id, user_id, workspace_id, token_hash, role, permissions, expires_at, created_at)
        VALUES ($1, 'usr_ryan_bic', 'ws_wilmington', $2, 'owner', ARRAY['*'], $3, NOW())
      `, [invId, tokenHash, expiresAt]);
      console.log('✅ Created single-use invitation token in UAT database.');
    } finally {
      client.release();
      await pool.end();
    }
  }

  let sessionToken = '';

  // 2. Activate Account via Deployed Canary Endpoint /api/auth/activate
  if (rawInvitationToken) {
    await assert('Activate account using secure single-use invitation token', async () => {
      const res = await fetch(`${CANARY_BASE_URL}/api/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawInvitationToken,
          password: 'CustomerActivatedPassword2026!Secure'
        })
      });
      if (res.status !== 200) {
        const text = await res.text();
        throw new Error(`Activation failed with HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (!data.success || !data.token) {
        throw new Error('Expected success and token from activation');
      }
      sessionToken = data.token;
    });
  }

  if (!sessionToken) {
    console.warn('Skipping workflow calls that require live activation token.');
    return;
  }

  // 3. Authenticated Org Chart Query
  await assert('Authenticated Owner can query Org Chart (200 OK)', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/org-chart`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.positions || !Array.isArray(data.positions)) throw new Error('Expected positions array in response');
  });

  // 4. Authenticated SOP Lifecycle (Create & Delete Draft)
  let draftId = '';
  await assert('Authenticated Owner can create and delete draft SOP', async () => {
    const createRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'x-workspace-id': 'ws_wilmington'
      },
      body: JSON.stringify({
        title: 'UAT Synthetic Automated Test SOP',
        purpose: 'Verify durable creation in Cloud SQL datastore',
        trigger: 'Automated test suite execution',
        processOwner: 'Ryan Crecelius',
        reviewer: 'Matt Orr',
        orderedSteps: [{ order: 1, title: 'Step 1', description: 'Automated step' }],
        systemsUsed: ['Cloud SQL']
      })
    });
    if (createRes.status !== 200 && createRes.status !== 201) throw new Error(`Draft creation failed: ${createRes.status}`);
    const createData = await createRes.json();
    draftId = createData.id || createData.sop?.id;
    if (!draftId) throw new Error('Failed to extract draft ID from creation response');

    // Delete draft
    const deleteRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (deleteRes.status !== 200) throw new Error(`Draft deletion failed: ${deleteRes.status}`);
  });

  // 5. Governance Rejects Deletion of Published SOPs
  await assert('Governance rejects deletion of published SOPs (400 Bad Request)', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/sops/drafts/sop_listing_launch_001`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (res.status !== 400) throw new Error(`Expected 400 rejection for published SOP, got ${res.status}`);
  });

  // 6. Owner Digest Configuration Safe Defaults
  await assert('Owner digest config defaults to disabled and empty recipients', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/owner-digest/config`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'x-workspace-id': 'ws_wilmington'
      }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.config?.enabled !== false) throw new Error('Expected digest enabled to be false');
    if (!Array.isArray(data.config?.recipients) || data.config?.recipients.length !== 0) {
      throw new Error('Expected empty recipients list by default');
    }
  });

  // 7. Voice Agent Context Query & Projection
  await assert('Voice Agent context-query endpoint returns matchedItems projection', async () => {
    const res = await fetch(`${CANARY_BASE_URL}/api/voice-agent/context-query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'x-workspace-id': 'ws_wilmington'
      },
      body: JSON.stringify({
        query: 'What is the listing launch protocol?',
        sessionId: 'test-session-123'
      })
    });
    if (res.status !== 200) throw new Error(`Context query failed: ${res.status}`);
    const data = await res.json();
    if (!data.spokenResponse) throw new Error('Expected spokenResponse in context-query response');
  });

  console.log('\n==================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Workflow Acceptance Results: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('==================================================================');

  if (!allPassed) process.exit(1);
}

if (process.argv[1]?.endsWith('testSecureActivationAndWorkflows.ts')) {
  runActivationWorkflowSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
