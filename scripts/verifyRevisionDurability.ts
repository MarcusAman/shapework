import { signJwt } from '../server/auth/jwt.js';

const CANARY_BASE_URL = process.env.CANARY_URL || 'https://canary---shapework-os-3xc3npf56a-uc.a.run.app';

const tokenAdminA = signJwt({
  id: 'usr_admin_a',
  email: 'admin@nesta.com',
  name: 'Admin Alpha',
  role: 'admin',
  workspaceId: 'ws_wilmington'
});

async function main() {
  const testSopId = `sop_durability_proof_${Date.now()}`;
  console.log(`[Durability Phase 1] Creating record ${testSopId} on live canary...`);

  const createRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenAdminA}`,
      'Content-Type': 'application/json',
      'x-workspace-id': 'ws_wilmington'
    },
    body: JSON.stringify({
      id: testSopId,
      title: 'Persistent Cloud SQL Record Across Cloud Run Revisions',
      purpose: 'Proving durable PostgreSQL storage in GCP Cloud SQL',
      trigger: 'Automated durability verification test',
      processOwner: 'Principal Release Engineer',
      status: 'draft'
    })
  });

  if (createRes.status !== 200) {
    throw new Error(`Record creation failed with status ${createRes.status}: ${await createRes.text()}`);
  }
  console.log(`[Durability Phase 1] Successfully wrote record ${testSopId} to remote Cloud SQL datastore.`);

  // Verify it exists in drafts
  const listRes = await fetch(`${CANARY_BASE_URL}/api/sops/drafts`, {
    headers: {
      Authorization: `Bearer ${tokenAdminA}`,
      'x-workspace-id': 'ws_wilmington'
    }
  });

  const listData = await listRes.json();
  const found = (listData.drafts || []).find((d: any) => d.id === testSopId);
  if (!found) {
    throw new Error(`Record ${testSopId} was not found in remote drafts query.`);
  }
  console.log(`[Durability Phase 1] Verified record ${testSopId} read back from remote Cloud SQL.`);

  return { testSopId };
}

main().then(res => {
  console.log(JSON.stringify(res));
  process.exit(0);
}).catch(err => {
  console.error('Durability verification failed:', err);
  process.exit(1);
});
