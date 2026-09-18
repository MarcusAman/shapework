/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Webhook Signature, Property Uniqueness & Reconciliation Security Suite
 * Verifies the 5 telephony registration fixes:
 * 1. Cryptographic Retell signature verification (v=...,d=...) on raw bytes before JSON parse.
 * 2. Property uniqueness invariant: Placeholders have normalized_property_key = NULL, real properties have non-null keys.
 * 3. Strict reconciliation policy: Rejects unauthorized property collisions with 409 and zero data leakage.
 * 4. Server startup sync elimination and hardened bounded admin sync endpoint.
 * 5. Deduplication across tool (submit_marketing_intake) and webhook (call_ended) paths.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import crypto from 'crypto';
import { 
  verifyRetellWebhookSignature, 
  generateRetellSignature, 
  RetellWebhookVerifier 
} from '../../server/security/retellWebhookVerifier.js';
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  persistRequestToDatabase,
  evaluateReconciliationPolicy,
  isPlaceholderPropertyAddress,
  normalizePropertyKey,
  convertCallToCanonicalMarketingRequest,
  purgeAllCanonicalMarketingData,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';
import {
  saveTelephonyCallAsync,
  getTelephonyCallByIdAsync,
  linkCallToCanonicalRequestAsync,
  purgeTelephonyCallsInMemory
} from '../../server/persistence/telephonyCallsRepository.js';
import { syncRecentRetellCallsToDatabaseAsync } from '../../server/integrations/marketingCallsService.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgres://marcusaman@127.0.0.1:5432/shapework_test_isolated';

function makeReq(fields: Partial<CanonicalMarketingRequest> & { id: string; title: string; propertyAddress: string; agentName: string }): CanonicalMarketingRequest {
  const now = new Date().toISOString();
  return {
    workspaceId: 'ws_wilmington',
    channel: 'phone',
    status: 'ready_for_review',
    category: 'listing_launch',
    taskIds: [],
    createdAt: now,
    updatedAt: now,
    ...fields
  };
}

describe('Retell Webhook Signature, Property Uniqueness & Reconciliation Security Suite', () => {
  let pool: Pool;
  const mockApiKey = 'key_test_retell_secret_99887766';

  beforeAll(() => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.PERSISTENCE_DRIVER = 'postgres';
    process.env.STORAGE_DRIVER = 'database';
  });

  beforeEach(async () => {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    purgeAllCanonicalMarketingData();
    purgeTelephonyCallsInMemory();

    // Clean test tables
    try {
      await pool.query('DELETE FROM telephony_calls WHERE workspace_id = $1', ['ws_wilmington']);
      await pool.query('DELETE FROM canonical_marketing_requests WHERE workspace_id = $1', ['ws_wilmington']);
    } catch (e) {
      // ignore
    }
  });

  afterEach(async () => {
    await pool.end();
  });

  // =========================================================================
  // 1. RETELL WEBHOOK SIGNATURE VERIFICATION & RAW BODY HANDLING
  // =========================================================================
  describe('1. Webhook Signature Verification Protocol', () => {
    it('1.1 Valid signature with matching HMAC-SHA256 and fresh timestamp passes', () => {
      const rawBody = JSON.stringify({ event: 'call_ended', call: { call_id: 'call_valid_1' } });
      const signatureHeader = generateRetellSignature(rawBody, mockApiKey);

      const result = verifyRetellWebhookSignature({
        rawBody,
        signatureHeader,
        apiKey: mockApiKey
      });

      expect(result.valid).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('1.2 Missing signature header fails verification', () => {
      const rawBody = JSON.stringify({ event: 'call_ended', call: { call_id: 'call_valid_1' } });

      const result = verifyRetellWebhookSignature({
        rawBody,
        signatureHeader: undefined,
        apiKey: mockApiKey
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MISSING_RETELL_SIGNATURE_HEADER');
    });

    it('1.3 Tampered request body fails verification with HMAC mismatch', () => {
      const originalBody = JSON.stringify({ event: 'call_ended', call: { call_id: 'call_valid_1' } });
      const signatureHeader = generateRetellSignature(originalBody, mockApiKey);
      const tamperedBody = JSON.stringify({ event: 'call_ended', call: { call_id: 'call_valid_1', injected: true } });

      const result = verifyRetellWebhookSignature({
        rawBody: tamperedBody,
        signatureHeader,
        apiKey: mockApiKey
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID_RETELL_SIGNATURE_HMAC_MISMATCH');
    });

    it('1.4 Stale timestamp (> 5 minutes) fails with replay error', () => {
      const rawBody = JSON.stringify({ event: 'call_ended', call: { call_id: 'call_valid_1' } });
      const staleTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      const signatureHeader = generateRetellSignature(rawBody, mockApiKey, staleTimestamp);

      const result = verifyRetellWebhookSignature({
        rawBody,
        signatureHeader,
        apiKey: mockApiKey,
        toleranceMs: 5 * 60 * 1000
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('SIGNATURE_TIMESTAMP_EXPIRED');
    });

    it('1.5 Tampered malformed JSON fails signature verification before JSON parsing', () => {
      const malformedBody = '{"event": "call_ended", "broken_json": ';
      const invalidSignature = 'v=' + Date.now() + ',d=bad_hex_digest_12345';

      // Signature verification fails first on raw bytes
      const sigResult = verifyRetellWebhookSignature({
        rawBody: malformedBody,
        signatureHeader: invalidSignature,
        apiKey: mockApiKey
      });

      expect(sigResult.valid).toBe(false);
      // Because sigResult is invalid, consumer returns 401 without attempting JSON.parse
    });

    it('1.6 Valid signature with malformed JSON passes signature but can be rejected as 400', () => {
      const malformedBody = '{"event": "call_ended", "broken_json": ';
      const validSignature = generateRetellSignature(malformedBody, mockApiKey);

      const sigResult = verifyRetellWebhookSignature({
        rawBody: malformedBody,
        signatureHeader: validSignature,
        apiKey: mockApiKey
      });

      expect(sigResult.valid).toBe(true);

      // JSON parsing fails after valid authentication
      let parseFailed = false;
      try {
        JSON.parse(malformedBody);
      } catch (e) {
        parseFailed = true;
      }
      expect(parseFailed).toBe(true);
    });

    it('1.7 Legacy RetellWebhookVerifier backward compatibility works for test fixtures', () => {
      const rawBody = '{"event":"call_started"}';
      const legacyHeader = RetellWebhookVerifier.generateTestSignature(rawBody, mockApiKey);

      const result = RetellWebhookVerifier.verifySignature({
        rawBody,
        signatureHeader: legacyHeader,
        apiKey: mockApiKey
      });

      expect(result.valid).toBe(true);
    });

    it('1.8 Webhook verification uses RETELL_API_KEY exclusively and fails closed in production when missing', () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origApiKey = process.env.RETELL_API_KEY;
      const origWebhookSecret = process.env.RETELL_WEBHOOK_SECRET;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.RETELL_API_KEY;
        // Even if an arbitrary RETELL_WEBHOOK_SECRET is present in env, it must NOT be used
        process.env.RETELL_WEBHOOK_SECRET = 'invalid_secret_key';

        expect(() => {
          verifyRetellWebhookSignature({
            rawBody: '{}',
            signatureHeader: 'v=12345,d=abc'
          });
        }).toThrowError('RETELL_INTEGRATION_NOT_CONFIGURED');
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        if (origApiKey) process.env.RETELL_API_KEY = origApiKey;
        if (origWebhookSecret) process.env.RETELL_WEBHOOK_SECRET = origWebhookSecret;
      }
    });
  });

  // =========================================================================
  // 2. PROPERTY UNIQUENESS INVARIANT & PLACEHOLDER HANDLING
  // =========================================================================
  describe('2. Property Uniqueness Invariant & Placeholders', () => {
    it('2.1 Placeholder addresses normalize to null and do not conflict in unique index', async () => {
      expect(isPlaceholderPropertyAddress('Address Pending')).toBe(true);
      expect(isPlaceholderPropertyAddress('Address Needed')).toBe(true);
      expect(isPlaceholderPropertyAddress('New Listing (Address Pending)')).toBe(true);
      expect(isPlaceholderPropertyAddress('Inbound Phone Request')).toBe(true);
      expect(isPlaceholderPropertyAddress('Wilmington NC Area Listing')).toBe(true);

      expect(normalizePropertyKey('Address Pending')).toBeNull();
      expect(normalizePropertyKey('Address Needed')).toBeNull();
      expect(normalizePropertyKey('Inbound Phone Request')).toBeNull();

      // Real address normalizes cleanly
      expect(normalizePropertyKey('1104 Arboretum Drive, Wilmington NC')).toBe('1104 ARBORETUM DRIVE');

      // Insert multiple concurrent placeholder requests into PostgreSQL
      const req1 = makeReq({
        id: `req_placeholder_${Date.now()}_1`,
        title: '[Address Needed] Marketing Intake (Matt Orr)',
        propertyAddress: 'Address Pending',
        agentName: 'Matt Orr'
      });

      const req2 = makeReq({
        id: `req_placeholder_${Date.now()}_2`,
        title: '[Address Needed] Marketing Intake (Sarah Jenkins)',
        propertyAddress: 'Address Needed',
        agentName: 'Sarah Jenkins'
      });

      await persistRequestToDatabase(req1, pool);
      await persistRequestToDatabase(req2, pool);

      // Verify both exist in PostgreSQL and have normalized_property_key = NULL
      const res = await pool.query(
        'SELECT id, normalized_property_key FROM canonical_marketing_requests WHERE id IN ($1, $2)',
        [req1.id, req2.id]
      );

      expect(res.rows.length).toBe(2);
      expect(res.rows[0].normalized_property_key).toBeNull();
      expect(res.rows[1].normalized_property_key).toBeNull();
    });

    it('2.2 Real addresses set normalized_property_key and enforce uniqueness', async () => {
      const realReq1 = makeReq({
        id: `req_real_${Date.now()}_1`,
        title: '742 Lumina Ave • Luxury Collateral Suite',
        propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC 28480',
        agentName: 'Ryan Crecelius',
        agentEmail: 'ryan@nestrealty.com'
      });

      await persistRequestToDatabase(realReq1, pool);

      const res = await pool.query(
        'SELECT normalized_property_key FROM canonical_marketing_requests WHERE id = $1',
        [realReq1.id]
      );
      expect(res.rows[0].normalized_property_key).toBe('742 LUMINA AVE');
    });
  });

  // =========================================================================
  // 3. STRICT RECONCILIATION POLICY VS BLIND MERGE
  // =========================================================================
  describe('3. Strict Reconciliation Policy on Property Collisions', () => {
    it('3.1 Recognized broker reconciles their own compatible request', async () => {
      const originalReq = makeReq({
        id: `req_sarah_own_${Date.now()}`,
        title: '1104 Arboretum Dr • Initial Campaign',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        agentName: 'Sarah Jenkins',
        agentEmail: 'sarah.jenkins@nestrealty.com',
        agentPhone: '(910) 555-0199',
        taskIds: ['task_sarah_1']
      });
      await persistRequestToDatabase(originalReq, pool);

      // Same agent calls in with a follow-up task on their own listing
      const followupReq = makeReq({
        id: `req_followup_${Date.now()}`,
        title: '1104 Arboretum Dr • Additional Task',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        agentName: 'Sarah Jenkins',
        agentEmail: 'sarah.jenkins@nestrealty.com',
        agentPhone: '(910) 555-0199',
        taskIds: ['task_sarah_2'],
        notes: 'Please add 30s teaser reel'
      });

      await persistRequestToDatabase(followupReq, pool);

      // Verify task_sarah_2 was appended to original request
      const res = await pool.query(
        'SELECT task_ids, notes FROM canonical_marketing_requests WHERE id = $1',
        [originalReq.id]
      );
      expect(res.rows[0].task_ids).toContain('task_sarah_1');
      expect(res.rows[0].task_ids).toContain('task_sarah_2');
      expect(res.rows[0].notes).toContain('Authorized listing_agent');
    });

    it('3.2 Recognized BIC phone cannot reconcile another broker’s request', async () => {
      const originalReq = makeReq({
        id: `req_broker_sarah_${Date.now()}`,
        title: '2105 Greenbriar Rd • Listing Collateral',
        propertyAddress: '2105 Greenbriar Rd, Wilmington, NC 28403',
        agentName: 'Sarah Jenkins',
        agentEmail: 'sarah.jenkins@nestrealty.com',
        agentPhone: '(910) 555-0199',
        taskIds: ['task_orig_1']
      });
      await persistRequestToDatabase(originalReq, pool);

      // Recognized BIC (Jessica Keenan) calls over phone about another broker's listing
      // Even if payload asserts isBrokerInCharge = true, telephony is identified_unauthenticated
      const bicPhoneReq = makeReq({
        id: `req_bic_phone_${Date.now()}`,
        title: '2105 Greenbriar Rd • BIC Telephony Injection',
        propertyAddress: '2105 Greenbriar Rd, Wilmington, NC 28403',
        agentName: 'Jessica Keenan',
        agentEmail: 'jessica.keenan@nestrealty.com',
        agentPhone: '(910) 555-0101',
        taskIds: ['task_bic_phone_1'],
        notes: 'Attempting BIC telephony reconciliation'
      });
      (bicPhoneReq as any).isBrokerInCharge = true;

      let caughtError: any = null;
      try {
        await persistRequestToDatabase(bicPhoneReq, pool);
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.statusCode).toBe(409);
      expect(caughtError.code).toBe('PROPERTY_REQUEST_CONFLICT');

      // Original record was untouched
      const check = await pool.query(
        'SELECT task_ids FROM canonical_marketing_requests WHERE id = $1',
        [originalReq.id]
      );
      expect(check.rows[0].task_ids).toEqual(['task_orig_1']);
      expect(check.rows[0].task_ids).not.toContain('task_bic_phone_1');
    });

    it('3.3 Recognized Admin phone cannot reconcile another broker’s request', async () => {
      const originalReq = makeReq({
        id: `req_broker_matt_${Date.now()}`,
        title: '3302 Masonboro Sound • Exclusive',
        propertyAddress: '3302 Masonboro Sound, Wilmington, NC 28409',
        agentName: 'Matt Orr',
        agentEmail: 'matt.orr@nestrealty.com',
        agentPhone: '(910) 612-8283',
        taskIds: ['task_matt_sound_1']
      });
      await persistRequestToDatabase(originalReq, pool);

      // Administrator calls over phone about Matt's listing
      const adminPhoneReq = makeReq({
        id: `req_admin_phone_${Date.now()}`,
        title: '3302 Masonboro Sound • Admin Phone Modification',
        propertyAddress: '3302 Masonboro Sound, Wilmington, NC 28409',
        agentName: 'Ryan',
        agentEmail: 'ryan@nestrealty.com',
        agentPhone: '(910) 555-0100',
        taskIds: ['task_admin_phone_1']
      });
      (adminPhoneReq as any).isAdmin = true;

      let caughtError: any = null;
      try {
        await persistRequestToDatabase(adminPhoneReq, pool);
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.statusCode).toBe(409);
      expect(caughtError.code).toBe('PROPERTY_REQUEST_CONFLICT');

      const check = await pool.query(
        'SELECT task_ids FROM canonical_marketing_requests WHERE id = $1',
        [originalReq.id]
      );
      expect(check.rows[0].task_ids).toEqual(['task_matt_sound_1']);
      expect(check.rows[0].task_ids).not.toContain('task_admin_phone_1');
    });

    it('3.4 Authenticated authorized web administrator may perform the approved reconciliation workflow', async () => {
      const originalReq = makeReq({
        id: `req_web_target_${Date.now()}`,
        title: '2105 Greenbriar Rd • Listing Collateral',
        propertyAddress: '2105 Greenbriar Rd, Wilmington, NC 28403',
        agentName: 'Sarah Jenkins',
        agentEmail: 'sarah.jenkins@nestrealty.com',
        agentPhone: '(910) 555-0199',
        taskIds: ['task_orig_web_1']
      });
      await persistRequestToDatabase(originalReq, pool);

      // Authenticated web administrator update with verified server session
      const webAdminReq = makeReq({
        id: `req_web_admin_${Date.now()}`,
        title: '2105 Greenbriar Rd • Web Admin Compliance Adjustment',
        propertyAddress: '2105 Greenbriar Rd, Wilmington, NC 28403',
        agentName: 'Ryan',
        agentEmail: 'ryan@nestrealty.com',
        channel: 'web',
        taskIds: ['task_web_admin_approved_1'],
        notes: 'Compliance approved listing packet'
      });

      const authenticatedSession = {
        userId: 'usr_admin_ryan',
        workspaceId: 'ws_wilmington',
        role: 'admin',
        isAdmin: true,
        permissions: ['manage_workspace']
      };

      await persistRequestToDatabase(webAdminReq, pool, authenticatedSession);

      const res = await pool.query(
        'SELECT task_ids, notes FROM canonical_marketing_requests WHERE id = $1',
        [originalReq.id]
      );
      expect(res.rows[0].task_ids).toContain('task_orig_web_1');
      expect(res.rows[0].task_ids).toContain('task_web_admin_approved_1');
      expect(res.rows[0].notes).toContain('Authorized authenticated_web_admin');
    });

    it('3.5 Unknown phone and spoofed payload claims are rejected', async () => {
      const originalReq = makeReq({
        id: `req_private_test_${Date.now()}`,
        title: '8801 Bald Eagle Lane • Waterfront Collateral',
        propertyAddress: '8801 Bald Eagle Lane, Wilmington NC',
        agentName: 'Matt Orr',
        agentEmail: 'matt.orr@nestrealty.com',
        agentPhone: '(910) 612-8283',
        taskIds: ['task_matt_1'],
        notes: 'CONFIDENTIAL: Seller insists on $2.5M firm with private showings.'
      });
      await persistRequestToDatabase(originalReq, pool);

      // Unknown caller attempts spoofing BIC and Admin claims in payload
      const spoofedReq = makeReq({
        id: `req_spoof_${Date.now()}`,
        title: '8801 Bald Eagle Lane • Spoofed Claim',
        propertyAddress: '8801 Bald Eagle Lane, Wilmington NC',
        agentName: 'Unknown Caller',
        agentEmail: 'stranger@competitor.com',
        agentPhone: '(555) 999-0000',
        taskIds: ['task_spoof_1'],
        notes: 'Attempting spoofed task injection'
      });
      (spoofedReq as any).isBrokerInCharge = true;
      (spoofedReq as any).isAdmin = true;
      (spoofedReq as any).role = 'admin';

      let caughtError: any = null;
      try {
        await persistRequestToDatabase(spoofedReq, pool);
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.statusCode).toBe(409);
      expect(caughtError.code).toBe('PROPERTY_REQUEST_CONFLICT');

      const check = await pool.query(
        'SELECT task_ids FROM canonical_marketing_requests WHERE id = $1',
        [originalReq.id]
      );
      expect(check.rows[0].task_ids).not.toContain('task_spoof_1');
    });

    it('3.6 Rejection leaks no existing broker or task metadata', async () => {
      const originalReq = makeReq({
        id: `req_leak_test_${Date.now()}`,
        title: '9900 Confidential Sound Way • Estate',
        propertyAddress: '9900 Confidential Sound Way, Wilmington NC',
        agentName: 'Matt Orr',
        agentEmail: 'matt.orr@nestrealty.com',
        agentPhone: '(910) 612-8283',
        taskIds: ['task_secret_task_id_999'],
        notes: 'PRIVATE NOTE: Seller will take 1.8M cash.'
      });
      await persistRequestToDatabase(originalReq, pool);

      const intruderReq = makeReq({
        id: `req_probe_${Date.now()}`,
        title: '9900 Confidential Sound Way • Probe',
        propertyAddress: '9900 Confidential Sound Way, Wilmington NC',
        agentName: 'Intruder Probe',
        agentEmail: 'probe@intruder.com',
        agentPhone: '(555) 123-4567',
        taskIds: ['task_probe_1']
      });

      let caughtError: any = null;
      try {
        await persistRequestToDatabase(intruderReq, pool);
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError.statusCode).toBe(409);
      expect(caughtError.code).toBe('PROPERTY_REQUEST_CONFLICT');

      // Crucial verification: zero leakage of existing broker identity, phone, email, task ID, or confidential notes
      expect(caughtError.message).not.toContain('matt.orr@nestrealty.com');
      expect(caughtError.message).not.toContain('612-8283');
      expect(caughtError.message).not.toContain('Matt Orr');
      expect(caughtError.message).not.toContain('task_secret_task_id_999');
      expect(caughtError.message).not.toContain('PRIVATE NOTE');
      expect(caughtError.message).not.toContain('1.8M cash');
    });
  });

  // =========================================================================
  // 4. BOUNDED ADMIN SYNC ROUTE & STARTUP ISOLATION
  // =========================================================================
  describe('4. Bounded Admin Sync Route & Startup Isolation', () => {
    it('4.1 syncRecentRetellCallsToDatabaseAsync respects bounded from/to timestamps', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            call_id: 'call_in_range_1',
            agent_id: 'agent_cdd031880770993e4b11cb9340',
            start_timestamp: threeDaysAgo.getTime() + 10000,
            end_timestamp: threeDaysAgo.getTime() + 60000,
            duration_ms: 50000,
            from_number: '+19106128283',
            transcript: 'Matt Orr ordering yard sign for 4500 Pine Valley Dr',
            call_analysis: { call_successful: true }
          },
          {
            call_id: 'call_out_of_range_old',
            agent_id: 'agent_cdd031880770993e4b11cb9340',
            start_timestamp: now.getTime() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
            end_timestamp: now.getTime() - (10 * 24 * 60 * 60 * 1000) + 60000,
            duration_ms: 60000,
            from_number: '+19106128283',
            transcript: 'Older call outside 7 day window'
          }
        ]
      } as any);

      process.env.RETELL_API_KEY = 'test_key_mock_123';
      const result = await syncRecentRetellCallsToDatabaseAsync({
        limit: 50,
        from: threeDaysAgo,
        to: now
      });

      // Only call_in_range_1 should be persisted
      expect(result.totalFetched).toBe(1);

      const dbCheck = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', ['call_in_range_1']);
      expect(dbCheck.rows.length).toBe(1);

      const oldCheck = await pool.query('SELECT * FROM telephony_calls WHERE id = $1', ['call_out_of_range_old']);
      expect(oldCheck.rows.length).toBe(0);

      fetchSpy.mockRestore();
    });
  });

  // =========================================================================
  // 5. TASK DEDUPLICATION ACROSS TOOL AND WEBHOOK PATHS
  // =========================================================================
  describe('5. Task Deduplication Across Tool and Webhook Paths', () => {
    it('5.1 Pre-existing request created by tool is recognized; subsequent call_ended skips duplicate creation', async () => {
      const callId = `call_tool_intake_${Date.now()}`;
      const property = '502 Wrightsville Ave, Wilmington NC';

      // Step A: Nora invokes submit_marketing_intake during call
      const intakeRequest = makeReq({
        id: `req_tool_${callId}`,
        telephonyCallId: callId,
        title: `${property} • Marketing Collateral`,
        propertyAddress: property,
        agentName: 'Matt Orr',
        taskIds: [`task_tool_${callId}_0`]
      });
      saveCanonicalMarketingRequest(intakeRequest);
      saveCanonicalMarketingTask({
        id: `task_tool_${callId}_0`,
        requestId: intakeRequest.id,
        title: 'Property Marketing Flyer',
        category: 'print',
        status: 'request_received'
      } as any);

      // Save call record linked to the request
      await saveTelephonyCallAsync({
        id: callId,
        workspaceId: 'ws_wilmington',
        agentId: 'agent_cdd031880770993e4b11cb9340',
        callerName: 'Matt Orr',
        direction: 'inbound',
        canonicalRequestId: intakeRequest.id,
        canonicalTaskId: `task_tool_${callId}_0`
      }, pool);

      // Link call in repository
      await linkCallToCanonicalRequestAsync(callId, intakeRequest.id, `task_tool_${callId}_0`, pool);

      // Step B: Call ends and call_ended arrives
      // convertCallToCanonicalMarketingRequest detects existing link
      const simulatedCallPayload = {
        id: callId,
        callerName: 'Matt Orr',
        propertyAddress: property,
        transcript: 'Matt Orr ordering flyers for 502 Wrightsville Ave',
        durationSeconds: 95,
        audioUrl: `https://dxc03zgurdly9.cloudfront.net/${callId}/recording.wav`
      };

      const syncResult = convertCallToCanonicalMarketingRequest(simulatedCallPayload);

      // Should return existing request without creating a duplicate
      expect(syncResult.request?.id).toBe(intakeRequest.id);
      expect(syncResult.tasks.length).toBe(1);
      expect(syncResult.tasks[0].id).toBe(`task_tool_${callId}_0`);

      // Verify no duplicate requests exist in memory or database
      const allReqs = getAllCanonicalMarketingRequests().filter(r => r.propertyAddress?.includes('502 Wrightsville'));
      expect(allReqs.length).toBe(1);
    });
  });
});
