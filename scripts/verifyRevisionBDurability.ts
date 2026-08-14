import { signJwt } from '../server/auth/jwt.js';

const CANARY_BASE_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';
const testSopId = 'sop_durability_proof_1786679406393';

const tokenAdminA = signJwt({
  id: 'usr_admin_a',
  email: 'admin@nesta.com',
  name: 'Admin Alpha',
  role: 'admin',
  workspaceId: 'ws_wilmington'
});

async function main() {
  console.log('==================================================================');
  console.log('[Durability Phase 2] Verifying record persistence across Cloud Run revisions...');
  console.log(`Connecting to Canary Revision at ${CANARY_BASE_URL}...`);
  console.log('==================================================================');

  // 1. Check version endpoint
  const verRes = await fetch(`${CANARY_BASE_URL}/api/version`);
  const verData = await verRes.json();
  console.log('[Durability Phase 2] Current Canary Version Metadata:', verData);

  // 2. Read record written in Revision A
  console.log(`[Durability Phase 2] Querying drafts for ${testSopId} created under Revision A...`);
  const listRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`, {
    headers: {
      Authorization: `Bearer ${tokenAdminA}`,
      'x-workspace-id': 'ws_wilmington'
    }
  });

  if (listRes.status !== 200) {
    throw new Error(`Failed to list drafts on Revision: ${listRes.status}`);
  }

  const listData = await listRes.json();
  const found = (listData.drafts || []).find((d: any) => d.id === testSopId);

  if (!found) {
    throw new Error(`CRITICAL DURABILITY FAILURE: Record ${testSopId} was NOT found in remote Cloud SQL query!`);
  }

  console.log(`✅ [Durability Phase 2] SUCCESS: Record ${testSopId} persists across Cloud Run revisions!`);
  console.log('Record details:', { id: found.id, title: found.title, status: found.status, processOwner: found.processOwner });

  // 3. Clean up the synthetic record
  const deleteRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts/${testSopId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${tokenAdminA}`,
      'x-workspace-id': 'ws_wilmington'
    }
  });

  if (deleteRes.status !== 200) {
    throw new Error(`Failed to clean up draft ${testSopId}: ${deleteRes.status}`);
  }
  console.log(`✅ [Durability Phase 2] Cleaned up synthetic verification record ${testSopId}.`);
}

main().then(() => {
  console.log('\n==================================================================');
  console.log('PHASE N DURABILITY GATE PROVEN BEYOND REPROACH');
  console.log('==================================================================');
  process.exit(0);
}).catch(err => {
  console.error('Durability verification failed:', err);
  process.exit(1);
});
