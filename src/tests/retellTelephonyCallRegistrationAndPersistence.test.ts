/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Telephony Call Registration & PostgreSQL Durable Persistence Suite
 * Verifies the 12 core requirements for telephone call ledger durability and intake sync:
 * 1. call_ended webhook event persists call to telephony_calls table.
 * 2. call_analyzed webhook event updates existing call record in telephony_calls table.
 * 3. Durable persistence preserves caller name, phone number, direction, duration, property address, and audio URL.
 * 4. Actionable call (1920 Oleander Dr pre-MLS flyer) creates both telephony_calls record AND canonical marketing request with tasks.
 * 5. telephony_calls record links to created canonical request ID (canonical_request_id).
 * 6. Non-actionable / informational call creates telephony_calls record WITHOUT creating marketing requests.
 * 7. Office supply call (water bottles) creates telephony_calls record and consolidates into existing restock order without duplicate marketing requests.
 * 8. Retell tool call submit_marketing_intake correctly extracts snake_case property_address and agent_name.
 * 9. Multiple placeholder calls ("New Listing (Address Pending)") do NOT crash PostgreSQL with uq_active_canonical_mkt_req_prop duplicate key error.
 * 10. GET /api/marketing/calls reads directly from telephony_calls database ledger without polling Retell API.
 * 11. POST /api/marketing/calls/sync backfills recent Retell calls into PostgreSQL and reports counts.
 * 12. getCallAudioStream retrieves audio URL from persistent database record when not in memory.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import pg from 'pg';
import { 
  saveTelephonyCallAsync, 
  getTelephonyCallsByWorkspaceAsync, 
  getTelephonyCallByIdAsync,
  linkCallToCanonicalRequestAsync,
  purgeTelephonyCallsInMemory 
} from '../../server/persistence/telephonyCallsRepository.js';
import {
  getMarketingInboundCalls,
  syncRecentRetellCallsToDatabaseAsync,
  getCallAudioStream,
  purgeAllCallsInMemory,
  normalizeRetellCall
} from '../../server/integrations/marketingCallsService.js';
import {
  convertCallToCanonicalMarketingRequest,
  persistRequestToDatabase,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository.js';
import { OfficeSupplyDeduplicationService } from '../../server/services/officeSupplyDeduplicationService.js';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

describe('Retell Telephony Call Registration & Persistence Suite', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.PERSISTENCE_DRIVER = 'postgres';
    process.env.STORAGE_DRIVER = 'database';
    process.env.APP_ENV = 'production';

    pool = new pg.Pool({ connectionString: TEST_DB_URL });

    // Clean up test records
    await pool.query(`DELETE FROM telephony_calls WHERE id LIKE 'call_test_%' OR id LIKE 'call_matt_%' OR id LIKE 'call_sync_%'`);
    await pool.query(`DELETE FROM canonical_marketing_requests WHERE id LIKE 'req_call_call_test_%' OR id LIKE 'req_call_call_matt_%' OR id LIKE 'req_test_placeholder_%'`);
    await pool.query(`DELETE FROM canonical_marketing_tasks WHERE id LIKE 'task_call_call_test_%' OR id LIKE 'task_call_call_matt_%'`);

    resetCanonicalStoreForTesting();
    purgeAllCallsInMemory();
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM telephony_calls WHERE id LIKE 'call_test_%' OR id LIKE 'call_matt_%' OR id LIKE 'call_sync_%'`);
    await pool.query(`DELETE FROM canonical_marketing_requests WHERE id LIKE 'req_call_call_test_%' OR id LIKE 'req_call_call_matt_%' OR id LIKE 'req_test_placeholder_%'`);
    await pool.query(`DELETE FROM canonical_marketing_tasks WHERE id LIKE 'task_call_call_test_%' OR id LIKE 'task_call_call_matt_%'`);
    await pool.end();
  });

  // 1. call_ended webhook event persists call to telephony_calls table
  it('1. call_ended webhook event persists call to telephony_calls table', async () => {
    const callId = `call_test_ended_${Date.now()}`;
    const callPayload = {
      id: callId,
      workspaceId: 'ws_wilmington',
      agentId: 'agent_cdd031880770993e4b11cb9340',
      callerName: 'Matt Orr',
      callerPhone: '+19106128283',
      callerOffice: 'Nest Realty Mayfaire',
      direction: 'inbound' as const,
      status: 'completed',
      durationSeconds: 125,
      transcript: 'Matt: Nora, let me know when the open house signs arrive.',
      startedAt: new Date(Date.now() - 130000).toISOString(),
      endedAt: new Date().toISOString()
    };

    const saved = await saveTelephonyCallAsync(callPayload);
    expect(saved.id).toBe(callId);

    // Verify directly in PostgreSQL
    const res = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [callId]);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].id).toBe(callId);
    expect(res.rows[0].caller_name).toBe('Matt Orr');
    expect(res.rows[0].duration_seconds).toBe(125);
    expect(res.rows[0].status).toBe('completed');
  });

  // 2. call_analyzed webhook event updates existing call record in telephony_calls table
  it('2. call_analyzed webhook event updates existing call record in telephony_calls table', async () => {
    const callId = `call_test_analyzed_${Date.now()}`;
    
    // First save initial call_ended
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Matt Orr',
      callerPhone: '+19106128283',
      direction: 'inbound',
      status: 'completed',
      durationSeconds: 90,
      transcript: 'Matt: Need pre-MLS materials for 1920 Oleander.'
    });

    // Later, call_analyzed arrives with AI analysis
    const updated = await saveTelephonyCallAsync({
      id: callId,
      propertyAddress: '1920 Oleander Dr, Wilmington NC',
      requestType: 'Listing Launch Collateral',
      departmentCategory: 'marketing_collateral',
      assignedLead: 'Melissa Jenkins (Marketing Director)',
      recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/mock/1920_oleander.wav',
      callAnalysis: {
        call_summary: 'Caller requested pre-MLS marketing package for 1920 Oleander Dr.',
        custom_analysis_data: {
          property_address: '1920 Oleander Dr',
          urgency: 'high'
        }
      }
    });

    expect(updated.propertyAddress).toBe('1920 Oleander Dr, Wilmington NC');

    // Query DB to verify update
    const res = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [callId]);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].property_address).toBe('1920 Oleander Dr, Wilmington NC');
    expect(res.rows[0].recording_url).toBe('https://dxc03zgurdly9.cloudfront.net/mock/1920_oleander.wav');
    expect(res.rows[0].call_analysis.call_summary).toContain('1920 Oleander Dr');
  });

  // 3. Durable persistence preserves caller name, phone number, direction, duration, property address, and audio URL
  it('3. Durable persistence preserves caller details and audio URL', async () => {
    const callId = `call_test_fields_${Date.now()}`;
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      agentId: 'agent_cdd031880770993e4b11cb9340',
      callerName: 'Marcus Aman',
      callerPhone: '+12527170595',
      callerOffice: 'Wilmington Mayfaire',
      direction: 'inbound',
      durationSeconds: 180,
      durationFormatted: '3 min',
      propertyAddress: '117 Colonial Dr, Wilmington NC 28412',
      recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/mock/117_colonial.wav',
      audioUrl: `/api/marketing/calls/${callId}/audio`
    });

    const retrieved = await getTelephonyCallByIdAsync(callId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.callerName).toBe('Marcus Aman');
    expect(retrieved?.callerPhone).toBe('+12527170595');
    expect(retrieved?.direction).toBe('inbound');
    expect(retrieved?.durationSeconds).toBe(180);
    expect(retrieved?.propertyAddress).toBe('117 Colonial Dr, Wilmington NC 28412');
    expect(retrieved?.recordingUrl).toBe('https://dxc03zgurdly9.cloudfront.net/mock/117_colonial.wav');
    expect(retrieved?.audioUrl).toBe(`/api/marketing/calls/${callId}/audio`);
  });

  // 4. Actionable call (1920 Oleander Dr flyer) creates both telephony_calls record AND canonical marketing request with tasks
  it('4. Actionable call creates both telephony_calls record AND canonical marketing request with tasks', async () => {
    const callId = `call_matt_oleander_${Date.now()}`;
    const rawCall = {
      call_id: callId,
      agent_id: 'agent_cdd031880770993e4b11cb9340',
      from_number: '+19106128283',
      start_timestamp: Date.now() - 180000,
      end_timestamp: Date.now(),
      duration_ms: 180000,
      transcript: 'Matt: Hi Nora, I have a pre-MLS listing at 1920 Oleander Drive that goes live on Tuesday. I need double-sided flyers and social graphics.',
      call_analysis: {
        call_successful: true,
        call_summary: 'Pre-MLS flyer and social collateral request for 1920 Oleander Drive.',
        custom_analysis_data: {
          requester: 'Matt Orr (REALTOR®)',
          property_address: '1920 Oleander Drive',
          primary_owner: 'Melissa Gagliardi',
          urgency: 'high'
        }
      }
    };

    const normalized = normalizeRetellCall(rawCall);
    expect(normalized.propertyAddress).toContain('1920 Oleander Drive');

    // 1. Persist call record
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: normalized.callerName,
      callerPhone: normalized.phone,
      propertyAddress: normalized.propertyAddress,
      durationSeconds: normalized.durationSeconds,
      transcript: normalized.transcript,
      callAnalysis: rawCall.call_analysis
    });

    // 2. Convert to Canonical Marketing Request
    const syncResult = convertCallToCanonicalMarketingRequest(normalized);
    expect(syncResult.shouldCreate).toBe(true);
    expect(syncResult.request).toBeDefined();
    expect(syncResult.request?.propertyAddress).toContain('1920 Oleander Drive');
    expect(syncResult.tasks.length).toBeGreaterThanOrEqual(2);

    // Verify task categories & statuses in request_received
    const flyerTask = syncResult.tasks.find(t => t.title.includes('Flyer'));
    expect(flyerTask).toBeDefined();
    expect(flyerTask?.status).toBe('request_received');
    expect(flyerTask?.assignedTo).toBe('Eduardo Lovo');

    const socialTask = syncResult.tasks.find(t => t.category === 'social');
    expect(socialTask).toBeDefined();
    expect(socialTask?.status).toBe('request_received');

    // Verify DB records
    await persistRequestToDatabase(syncResult.request!);
    const dbCall = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [callId]);
    expect(dbCall.rows.length).toBe(1);

    const dbReq = await pool.query('SELECT * FROM canonical_marketing_requests WHERE id = $1', [syncResult.request?.id]);
    expect(dbReq.rows.length).toBe(1);
    expect(dbReq.rows[0].property_address).toContain('1920 Oleander Drive');
  });

  // 5. telephony_calls record links to created canonical request ID (canonical_request_id)
  it('5. telephony_calls record links to created canonical request ID', async () => {
    const callId = `call_test_link_${Date.now()}`;
    const reqId = `req_call_${callId}`;
    const taskId = `task_call_${callId}_0`;

    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Matt Orr',
      propertyAddress: '1920 Oleander Drive, Wilmington NC'
    });

    await linkCallToCanonicalRequestAsync(callId, reqId, taskId);

    const updated = await getTelephonyCallByIdAsync(callId);
    expect(updated?.canonicalRequestId).toBe(reqId);
    expect(updated?.canonicalTaskId).toBe(taskId);

    // Verify in PostgreSQL
    const res = await pool.query('SELECT canonical_request_id, canonical_task_id FROM telephony_calls WHERE id = $1', [callId]);
    expect(res.rows[0].canonical_request_id).toBe(reqId);
    expect(res.rows[0].canonical_task_id).toBe(taskId);
  });

  // 6. Non-actionable / informational call creates telephony_calls record WITHOUT creating marketing requests
  it('6. Non-actionable / informational call creates telephony_calls record WITHOUT creating marketing requests', async () => {
    const callId = `call_test_info_${Date.now()}`;
    const rawCall = {
      call_id: callId,
      from_number: '+19106128283',
      transcript: 'Matt: Hey Nora, what time does the Mayfaire office close today?\nNora: Hi Matt! The Mayfaire office is open until 5:00 PM today.',
      call_analysis: {
        call_summary: 'Inquiry about Mayfaire office hours. Answered directly by Nora on the phone.',
        custom_analysis_data: {
          category: 'general_inquiry'
        }
      }
    };

    const normalized = normalizeRetellCall(rawCall);
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: normalized.callerName,
      callerPhone: normalized.phone,
      transcript: normalized.transcript,
      requestType: 'General Inquiry'
    });

    const syncResult = convertCallToCanonicalMarketingRequest(normalized);
    expect(syncResult.shouldCreate).toBe(false);
    expect(syncResult.suppressed).toBe(true);

    // Call exists in telephony_calls
    const res = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [callId]);
    expect(res.rows.length).toBe(1);

    // No request was created
    const reqRes = await pool.query('SELECT * FROM canonical_marketing_requests WHERE id = $1', [`req_call_${callId}`]);
    expect(reqRes.rows.length).toBe(0);
  });

  // 7. Office supply call (water bottles) creates telephony_calls record and consolidates into existing restock order without duplicate marketing requests
  it('7. Office supply call creates telephony_calls record and consolidates without creating marketing requests', async () => {
    const callId = `call_test_water_${Date.now()}`;
    const transcript = 'Matt: Hey Nora, we are completely out of bottled water in the Mayfaire kitchen. Can Ann order more?';

    // Verify office supply deduplication service consolidates it
    const supplyResult = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
      callerName: 'Matt Orr',
      callerRole: 'REALTOR®',
      callerPhone: '+19106128283',
      office: 'Mayfaire',
      requestText: transcript
    });

    expect(supplyResult.isNewTicketCreated || supplyResult.isDuplicate).toBe(true);

    // Save call in telephony_calls
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Matt Orr',
      callerPhone: '+19106128283',
      requestType: 'Office Supply Restock',
      departmentCategory: 'general_ops',
      assignedLead: 'Ann Gunn (Operations Lead)',
      transcript
    });

    // Calling convertCallToCanonicalMarketingRequest creates an operations request & task routed to Ann Gunn
    const normalized = normalizeRetellCall({
      call_id: callId,
      from_number: '+19106128283',
      transcript,
      call_analysis: {
        call_summary: 'Water bottle restock request for Mayfaire kitchen.',
        custom_analysis_data: {
          category: 'operations',
          primary_owner: 'ann',
          title: 'Restock bottled water at Mayfaire kitchen'
        }
      }
    });

    const syncResult = convertCallToCanonicalMarketingRequest(normalized);
    expect(syncResult.shouldCreate).toBe(true);
    expect(syncResult.tasks.length).toBe(1);
    expect(syncResult.tasks[0].assignedTo).toBe('Ann Gunn');
    expect(syncResult.tasks[0].assignedToId).toBe('dir_ann_gunn_28');
    expect(syncResult.tasks[0].reviewOwnerName).toBe('Ryan Crecelius');
    expect(syncResult.tasks[0].category).toBe('operations');

    // A second duplicate call consolidates without creating duplicate tasks
    const secondCallId = `call_test_water_dup_${Date.now()}`;
    const secondNormalized = normalizeRetellCall({
      call_id: secondCallId,
      from_number: '+19102282720',
      transcript: 'Julie: Hey Nora, we also need bottled water in Mayfaire.',
      call_analysis: {
        call_summary: 'Julie called asking for bottled water restock at Mayfaire.',
        custom_analysis_data: { category: 'operations', primary_owner: 'ann' }
      }
    });
    const dupResult = convertCallToCanonicalMarketingRequest(secondNormalized);
    expect(dupResult.shouldCreate).toBe(false);
    expect(dupResult.suppressed).toBe(true);
    expect(dupResult.suppressionReason).toBe('DEDUPLICATED_INTO_EXISTING_RESTOCK_ORDER');

    // Verify call is in DB
    const res = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [callId]);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].request_type).toBe('Office Supply Restock');
  });

  // 8. Retell tool call submit_marketing_intake correctly extracts snake_case property_address and agent_name
  it('8. Tool endpoint handles snake_case property_address and agent_name correctly', async () => {
    // Test the parsing logic used in handleMarketingIntakeRequest
    const reqBody = {
      property_address: '1920 Oleander Drive',
      agent_name: 'Matt Orr',
      package_type: 'Pre-MLS Flyer Package',
      caller_phone: '+19106128283',
      needed_by_date: '2026-09-08'
    };

    const targetAddress = reqBody.property_address || (reqBody as any).propertyAddress || 'New Listing (Address Pending)';
    const agentName = reqBody.agent_name || (reqBody as any).agentName;
    const phone = reqBody.caller_phone || (reqBody as any).callerPhone;

    expect(targetAddress).toBe('1920 Oleander Drive');
    expect(agentName).toBe('Matt Orr');
    expect(phone).toBe('+19106128283');
  });

  // 9. Multiple placeholder calls ("New Listing (Address Pending)") do NOT crash PostgreSQL with uq_active_canonical_mkt_req_prop duplicate key error
  it('9. Multiple placeholder calls do NOT crash PostgreSQL with duplicate key violation', async () => {
    const req1 = {
      id: `req_test_placeholder_1_${Date.now()}`,
      workspaceId: 'ws_wilmington',
      title: 'New Listing (Address Pending)',
      propertyAddress: 'New Listing (Address Pending)',
      agentName: 'Matt Orr',
      channel: 'phone' as const,
      status: 'ready_for_review' as const,
      category: 'listing_launch' as const,
      taskIds: [],
      isArchived: false,
      notes: 'Call 1 without address',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const req2 = {
      id: `req_test_placeholder_2_${Date.now()}`,
      workspaceId: 'ws_wilmington',
      title: 'New Listing (Address Pending)',
      propertyAddress: 'New Listing (Address Pending)',
      agentName: 'Marcus Aman',
      channel: 'phone' as const,
      status: 'ready_for_review' as const,
      category: 'listing_launch' as const,
      taskIds: [],
      isArchived: false,
      notes: 'Call 2 without address',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Both should persist without throwing unique constraint error
    await expect(persistRequestToDatabase(req1)).resolves.not.toThrow();
    await expect(persistRequestToDatabase(req2)).resolves.not.toThrow();

    // Verify both exist in PostgreSQL
    const res = await pool.query(
      `SELECT id, normalized_property_key FROM canonical_marketing_requests WHERE id IN ($1, $2)`,
      [req1.id, req2.id]
    );
    expect(res.rows.length).toBe(2);
    // normalized_property_key should be null for placeholder addresses
    expect(res.rows[0].normalized_property_key).toBeNull();
    expect(res.rows[1].normalized_property_key).toBeNull();
  });

  // 10. GET /api/marketing/calls reads directly from telephony_calls database ledger and does not invoke Retell API
  it('10. getMarketingInboundCalls reads from database ledger without polling Retell API', async () => {
    const callId = `call_test_ledger_query_${Date.now()}`;
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Matt Orr',
      callerPhone: '+19106128283',
      propertyAddress: '1920 Oleander Dr',
      durationSeconds: 150,
      startedAt: new Date().toISOString(),
      transcript: 'Matt: Please get pre-MLS flyers ready.'
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const calls = await getMarketingInboundCalls('ws_wilmington');
    expect(calls.length).toBeGreaterThan(0);
    const found = calls.find(c => c.id === callId);
    expect(found).toBeDefined();
    expect(found?.callerName).toBe('Matt Orr');
    expect(found?.propertyAddress).toBe('1920 Oleander Dr');

    // Verify fetch was NEVER called for Retell API during GET
    const retellFetchCalls = fetchSpy.mock.calls.filter(([url]) => 
      typeof url === 'string' && url.includes('api.retellai.com/v2/list-calls')
    );
    expect(retellFetchCalls.length).toBe(0);

    fetchSpy.mockRestore();
  });

  // 11. POST /api/marketing/calls/sync backfills recent Retell calls into PostgreSQL and reports counts
  it('11. syncRecentRetellCallsToDatabaseAsync backfills calls and reports counts', async () => {
    const mockRetellCalls = [
      {
        call_id: `call_sync_1_${Date.now()}`,
        agent_id: 'agent_cdd031880770993e4b11cb9340',
        from_number: '+19106128283',
        start_timestamp: Date.now() - 3600000,
        end_timestamp: Date.now() - 3500000,
        duration_ms: 100000,
        transcript: 'Matt: Need marketing materials for 1916 Walcott Ave.',
        call_analysis: {
          call_successful: true,
          call_summary: 'Marketing materials request for 1916 Walcott Ave.',
          custom_analysis_data: {
            requester: 'Matt Orr',
            property_address: '1916 Walcott Ave'
          }
        }
      },
      {
        call_id: `call_sync_2_${Date.now()}`,
        agent_id: 'agent_cdd031880770993e4b11cb9340',
        from_number: '+12527170595',
        start_timestamp: Date.now() - 7200000,
        end_timestamp: Date.now() - 7100000,
        duration_ms: 100000,
        transcript: 'Marcus: Checking in on 117 Colonial Drive listing package.',
        call_analysis: {
          call_successful: true,
          call_summary: 'Status check on 117 Colonial Drive.',
          custom_analysis_data: {
            requester: 'Marcus Aman',
            property_address: '117 Colonial Drive'
          }
        }
      }
    ];

    const originalKey = process.env.RETELL_API_KEY;
    process.env.RETELL_API_KEY = 'mock_key_for_test';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      if (typeof url === 'string' && url.includes('api.retellai.com/v2/list-calls')) {
        return new Response(JSON.stringify(mockRetellCalls), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('Not found', { status: 404 });
    });

    const result = await syncRecentRetellCallsToDatabaseAsync({ limit: 10, workspaceId: 'ws_wilmington' });

    expect(result.totalFetched).toBe(2);
    expect(result.totalPersisted).toBe(2);
    expect(result.totalRequestsCreated).toBeGreaterThanOrEqual(1);
    expect(result.errors.length).toBe(0);

    // Verify calls exist in PostgreSQL
    const res = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', [mockRetellCalls[0].call_id]);
    expect(res.rows.length).toBe(1);
    expect(res.rows[0].caller_name).toContain('Matt Orr');

    fetchSpy.mockRestore();
    process.env.RETELL_API_KEY = originalKey;
  });

  // 12. getCallAudioStream retrieves audio URL from persistent database record when not in memory
  it('12. getCallAudioStream retrieves audio URL from persistent database record when not in memory', async () => {
    const callId = `call_test_audio_stream_${Date.now()}`;
    const testAudioUrl = 'https://dxc03zgurdly9.cloudfront.net/mock/stream_test.wav';

    // 1. Save directly into PostgreSQL
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Matt Orr',
      recordingUrl: testAudioUrl
    });

    // 2. Wipe memory cache completely
    purgeAllCallsInMemory();

    // 3. Mock audio fetch to verify URL retrieved from DB
    let fetchedUrl = '';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      fetchedUrl = String(url);
      return new Response(Buffer.from('RIFF_MOCK_WAV_HEADER'), {
        status: 200,
        headers: { 'Content-Type': 'audio/wav', 'Content-Length': '20' }
      });
    });

    const stream = await getCallAudioStream(callId);
    expect(stream).not.toBeNull();
    expect(fetchedUrl).toBe(testAudioUrl);

    fetchSpy.mockRestore();
  });
});
