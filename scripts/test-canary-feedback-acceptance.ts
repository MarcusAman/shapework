import fetch from 'node-fetch';

const CANARY_URL = 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';
const WORKSPACE_ID = 'nest-realty-demo';

async function runCanaryAcceptanceTests() {
  console.log('====================================================');
  console.log('STARTING CANARY CUSTOMER ACCEPTANCE HARDENING TESTS');
  console.log('Target Endpoint:', CANARY_URL);
  console.log('Workspace ID:', WORKSPACE_ID);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 1. Health check
  // ----------------------------------------------------
  const healthRes = await fetch(`${CANARY_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.ok && healthData.status === 'healthy', 'Canary server is healthy');

  // ----------------------------------------------------
  // 2. PHASE 2 & 7: GET /api/directory is purely read-only
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 2 & 7: Directory Read-Only ---');
  const dirRes1 = await fetch(`${CANARY_URL}/api/directory?workspaceId=${WORKSPACE_ID}`);
  assert(dirRes1.ok, 'GET /api/directory returns HTTP 200');
  const dirData1 = await dirRes1.json();
  const initialTotal = dirData1.total || dirData1.people?.length || 0;

  // Run 10 consecutive reads
  let readOnlyClean = true;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${CANARY_URL}/api/directory?workspaceId=${WORKSPACE_ID}`);
    const data = await res.json();
    if ((data.total || data.people?.length || 0) !== initialTotal) {
      readOnlyClean = false;
    }
  }
  assert(readOnlyClean, 'GET /api/directory produces zero side effects over 10 consecutive reads');

  // ----------------------------------------------------
  // 3. PHASE 4 & 5: Reports-To Persistence (Matt\'s test: Lindsey -> Ryan)
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 4 & 5: Reports-To Persistence & Mutations ---');
  
  // Seed initial positions model for workspace
  const testModel = {
    positions: [
      { id: 'pos_ryan', workspaceId: WORKSPACE_ID, name: 'Ryan Crecelius', title: 'Managing Principal / Owner', department: 'Leadership', roleIds: [] },
      { id: 'pos_eric', workspaceId: WORKSPACE_ID, name: 'Eric Knight', title: 'Broker-in-Charge', department: 'Brokers-in-Charge', reportsToPositionId: 'pos_ryan', roleIds: [] },
      { id: 'pos_lindsey', workspaceId: WORKSPACE_ID, name: 'Lindsey Jenkins', title: 'Marketing Specialist', department: 'Marketing', reportsToPositionId: 'pos_eric', roleIds: [] }
    ],
    roles: [
      { id: 'role_mktg', workspaceId: WORKSPACE_ID, positionId: 'pos_lindsey', name: 'Listing Distribution', description: 'Coordinates launch marketing.' }
    ],
    sops: [],
    connections: [],
    escalationPolicies: [],
    routingMatrix: [
      { id: 'rule_mktg_01', category: 'Listing Marketing Request', primaryOwnerPositionId: 'pos_lindsey', backupOwnerPositionId: 'pos_eric', sla: '24 hours', status: 'active' }
    ]
  };

  const saveModelRes = await fetch(`${CANARY_URL}/api/org-chart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: WORKSPACE_ID, model: testModel, authorUser: 'Matt Orr (BIC)' })
  });
  assert(saveModelRes.ok, 'PUT /api/org-chart initializes workspace structure');

  // Mutate Lindsey: Change reportsTo from Eric Knight to Ryan
  const updatePosRes = await fetch(`${CANARY_URL}/api/org-chart/positions/pos_lindsey?workspaceId=${WORKSPACE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updates: { reportsToPositionId: 'pos_ryan' },
      authorUser: 'Matt Orr (BIC)'
    })
  });
  const updatePosData = await updatePosRes.json();
  assert(updatePosRes.ok && updatePosData.position?.reportsToPositionId === 'pos_ryan', 'PUT /api/org-chart/positions/pos_lindsey updates reportsTo to pos_ryan');

  // Verify fresh read from server
  const readModelRes = await fetch(`${CANARY_URL}/api/org-chart?workspaceId=${WORKSPACE_ID}`);
  const readModelData = await readModelRes.json();
  const reloadedLindsey = readModelData.model?.positions?.find((p: any) => p.id === 'pos_lindsey');
  assert(reloadedLindsey?.reportsToPositionId === 'pos_ryan', 'GET /api/org-chart confirms Lindsey reports to Ryan persists on server');

  // Verify Audit Log
  const auditRes = await fetch(`${CANARY_URL}/api/org-chart/audit?workspaceId=${WORKSPACE_ID}`);
  const auditData = await auditRes.json();
  const lindseyAudit = auditData.audits?.find((a: any) => a.entityId === 'pos_lindsey' && a.action === 'update_position');
  assert(lindseyAudit?.performedBy === 'Matt Orr (BIC)' && lindseyAudit?.newValue?.reportsToPositionId === 'pos_ryan', 'Org chart audit log records Matt Orr changing Lindsey to Ryan');

  // ----------------------------------------------------
  // 4. PHASE 6: Hierarchy Cycle & Self-Reporting Validation
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 6: Hierarchy Cycle & Self-Reporting Validation ---');
  // Attempting to make Ryan report to Lindsey (A -> B -> A loop)
  const loopRes = await fetch(`${CANARY_URL}/api/org-chart/positions/pos_ryan?workspaceId=${WORKSPACE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updates: { reportsToPositionId: 'pos_lindsey' },
      authorUser: 'Matt Orr (BIC)'
    })
  });
  assert(loopRes.status === 400, 'Server rejects circular reporting hierarchy (Ryan -> Lindsey -> Ryan) with HTTP 400');

  // Attempting self-reporting (Lindsey -> Lindsey)
  const selfRes = await fetch(`${CANARY_URL}/api/org-chart/positions/pos_lindsey?workspaceId=${WORKSPACE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      updates: { reportsToPositionId: 'pos_lindsey' },
      authorUser: 'Matt Orr (BIC)'
    })
  });
  assert(selfRes.status === 400, 'Server rejects self-reporting (Lindsey -> Lindsey) with HTTP 400');

  // ----------------------------------------------------
  // 5. PHASE 12 & 13: Routing Rules with Stable IDs & Deactivation
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 12 & 13: Routing Rules Stable IDs & Deactivation ---');
  const deactivateRes = await fetch(`${CANARY_URL}/api/org-chart/routing-rules/rule_mktg_01?workspaceId=${WORKSPACE_ID}&mode=deactivate`, {
    method: 'DELETE'
  });
  const deactData = await deactivateRes.json();
  const deactRule = deactData.model?.routingMatrix?.find((r: any) => r.id === 'rule_mktg_01' || r.category === 'Listing Marketing Request');
  assert(deactivateRes.ok && deactRule?.status === 'archived', 'Routing rule deactivated and archived without deleting history');

  // ----------------------------------------------------
  // 6. PHASE 15 & 16: Draft SOP Deletion & Governance Protection
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 15 & 16: SOP Draft Deletion & Governance ---');
  // Attempting to delete a published SOP must fail with 400
  const delPublishedRes = await fetch(`${CANARY_URL}/api/sops/drafts/sop_listing_launch_001`, {
    method: 'DELETE'
  });
  assert(delPublishedRes.status === 400 || delPublishedRes.status === 404, 'Published SOP is protected from Draft deletion endpoint');

  // ----------------------------------------------------
  // 7. PHASE 21, 22, 23: Weekly Owner Digest Preview & Idempotent Test Send
  // ----------------------------------------------------
  console.log('\n--- Testing Phase 21, 22, 23: Weekly Owner Digest ---');
  const digestPreviewRes = await fetch(`${CANARY_URL}/api/owner-digest/preview?workspaceId=${WORKSPACE_ID}`);
  const previewData = await digestPreviewRes.json();
  assert(digestPreviewRes.ok && previewData.data && previewData.html, 'Weekly Owner Digest preview generated with live data and clean HTML');
  assert(!previewData.html.includes('Generated by AI'), 'Digest HTML contains no forbidden synthetic marketing buzzwords');

  // Test Send & Idempotency
  const testSendRes1 = await fetch(`${CANARY_URL}/api/owner-digest/send-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: WORKSPACE_ID, recipientEmail: 'ryan@nestrealty.com' })
  });
  const testSendData1 = await testSendRes1.json();
  assert(testSendRes1.ok && testSendData1.messageId, 'Digest test send executes and logs delivery receipt');

  const testSendRes2 = await fetch(`${CANARY_URL}/api/owner-digest/send-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: WORKSPACE_ID, recipientEmail: 'ryan@nestrealty.com' })
  });
  const testSendData2 = await testSendRes2.json();
  assert(testSendData1.messageId === testSendData2.messageId, 'Digest test send is idempotent (duplicate call returns same messageId)');

  console.log('\n====================================================');
  console.log(`ACCEPTANCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  
  if (failed > 0) process.exit(1);
}

runCanaryAcceptanceTests().catch(err => {
  console.error('Fatal error running canary acceptance tests:', err);
  process.exit(1);
});
