import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function main() {
  const PORT = '3349';
  const apiBase = `http://localhost:${PORT}/api`;
  const dbPath = path.join(process.cwd(), 'data', 'db.json');

  // Terminate any zombie processes on the test port
  try {
    execSync(`kill -9 $(lsof -t -i:${PORT}) 2>/dev/null || true`);
  } catch (e) {}

  // Clear previous test database if exists
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  console.log('--- STARTING MOCK TAPO CAMERA TEST SERVER ---');
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      PORT,
      DATABASE_URL: 'memory',
      STORAGE_DRIVER: 'memory',
      CAMERA_LIVE_RELAY_URL: 'http://localhost:5000/video_feed'
    }
  });

  serverProcess.stdout?.on('data', (data) => {
    if (data.toString().includes('running on')) {
      console.log('[Server Started]', data.toString().trim());
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 6000));

  const authHeaders = {
    'Cookie': 'shapework_session=usr_sarah',
    'x-workspace-id': 'nest-realty-demo',
    'Content-Type': 'application/json'
  };

  try {
    console.log('\n--- TEST 1: GET /api/cameras ---');
    const resCams = await fetch(`${apiBase}/cameras`, { headers: authHeaders });
    const dataCams = await resCams.json();
    if (!resCams.ok || dataCams.cameras.length === 0) {
      throw new Error(`Failed to list cameras. Status: ${resCams.status}`);
    }
    console.log(`✓ Listed ${dataCams.cameras.length} cameras. Name: ${dataCams.cameras[0].name}`);

    const primaryCam = dataCams.cameras[0];

    console.log('\n--- TEST 2: GET /api/cameras/:id/live ---');
    const resLive = await fetch(`${apiBase}/cameras/${primaryCam.id}/live`, { headers: authHeaders });
    const dataLive = await resLive.json();
    if (!resLive.ok || !dataLive.liveRelayUrl) {
      throw new Error(`Failed to fetch safe live relay URL. Status: ${resLive.status}`);
    }
    console.log(`✓ Fetched safe Live Relay URL: ${dataLive.liveRelayUrl}`);

    console.log('\n--- TEST 3: POST /api/cameras/:id/snapshot (Manual Snapshot) ---');
    const resSnap = await fetch(`${apiBase}/cameras/${primaryCam.id}/snapshot`, {
      method: 'POST',
      headers: authHeaders
    });
    const dataSnap = await resSnap.json();
    if (!resSnap.ok || !dataSnap.event) {
      throw new Error(`Failed to trigger manual snapshot. Status: ${resSnap.status}`);
    }
    console.log(`✓ Snapshot event created: ${dataSnap.event.id} (${dataSnap.event.eventType})`);

    console.log('\n--- TEST 4: GET /api/camera-events (List pending events) ---');
    const resEvents = await fetch(`${apiBase}/camera-events?status=needs_review`, { headers: authHeaders });
    const dataEvents = await resEvents.json();
    if (!resEvents.ok || dataEvents.events.length === 0) {
      throw new Error('Failed to retrieve pending review events list.');
    }
    console.log(`✓ Retrieved ${dataEvents.events.length} events needing review.`);

    const checkoutEvent = dataEvents.events.find((e: any) => e.id === 'camev_002');
    if (!checkoutEvent) {
      throw new Error(`Could not find seeded event camev_002 in events list: ${dataEvents.events.map((e: any) => e.id).join(', ')}`);
    }
    console.log(`✓ Target checkout event found: ${checkoutEvent.id}`);

    console.log('\n--- TEST 5: POST /api/camera-events/:id/confirm-checkout ---');
    const resConfirm = await fetch(`${apiBase}/camera-events/${checkoutEvent.id}/confirm-checkout`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assetId: 'ast_1',
        agentName: 'Ryan Crecelius',
        property: '152 Edgewater Lane, Wilmington, NC 28403'
      })
    });
    const dataConfirm = await resConfirm.json();
    if (!resConfirm.ok || dataConfirm.event.status !== 'confirmed') {
      throw new Error(`Failed to confirm checkout. Response: ${JSON.stringify(dataConfirm)}`);
    }
    console.log(`✓ Checkout confirmed for event ${dataConfirm.event.id}. Status set to ${dataConfirm.event.status}.`);

    console.log('\n--- TEST 6: Verify Asset Status Updated in Inventory ---');
    const resAssetCheck = await fetch(`${apiBase}/ops/assets`, { headers: authHeaders });
    const dataAssetCheck = await resAssetCheck.json();
    const updatedAsset = dataAssetCheck.assets.find((a: any) => a.id === 'ast_1');
    if (!updatedAsset || updatedAsset.status !== 'checked_out' || updatedAsset.assignedAgent !== 'Ryan Crecelius') {
      throw new Error(`Asset ast_1 was not updated correctly: ${JSON.stringify(updatedAsset)}`);
    }
    console.log(`✓ Verified Asset ast_1 status updated to: ${updatedAsset.status} (Holder: ${updatedAsset.currentHolder})`);

    console.log('\n--- TEST 7: Verify Asset Ledger Entry Generated ---');
    const resLedger = await fetch(`${apiBase}/ops/assets/ledger`, { headers: authHeaders });
    const dataLedger = await resLedger.json();
    const ledgerEntry = dataLedger.ledger.find((l: any) => l.cameraEventId === 'camev_002');
    if (!ledgerEntry || ledgerEntry.action !== 'checkout' || ledgerEntry.source !== 'camera') {
      throw new Error(`Asset ledger entry is missing or invalid: ${JSON.stringify(ledgerEntry)}`);
    }
    console.log(`✓ Verified Ledger Log generated. Action: ${ledgerEntry.action}, Source: ${ledgerEntry.source}`);

    console.log('\n--- TEST 8: POST /api/camera-events/:id/reject ---');
    const testRejectEvent = dataEvents.events.find((e: any) => e.id === 'camev_003');
    const resReject = await fetch(`${apiBase}/camera-events/${testRejectEvent.id}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'False positive motion trigger' })
    });
    const dataReject = await resReject.json();
    if (!resReject.ok || dataReject.event.status !== 'rejected') {
      throw new Error(`Failed to reject event. Response: ${JSON.stringify(dataReject)}`);
    }
    console.log(`✓ Event ${dataReject.event.id} successfully rejected. Status: ${dataReject.event.status}`);

    console.log('\n--- ALL TAPO CAMERA INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    serverProcess.kill('SIGTERM');
  }
}

main();
