/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nest Realty Hotline (910) 507-2047 — NORA Retell AI Audit & Verification Suite
 * Tests:
 * 1. Retell call_inbound request/response contract
 * 2. Caller identification, normalization, disputed records & privacy
 * 3. Property address normalizer & conservative safety rules
 * 4. Open-task lookup, deduplication & atomic request updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  identifyCaller, 
  normalizePhoneNumber, 
  redactPhoneNumber, 
  NEST_HOTLINE_E164, 
  NEST_HOTLINE_DIGITS, 
  NEST_DEFAULT_WORKSPACE_ID,
  DISPUTED_DIRECTORY_MEMBER_IDS
} from '../../server/services/callerIdentificationService.js';
import { 
  normalizePropertyAddress, 
  matchPropertyAddresses 
} from '../../server/services/propertyAddressNormalizer.js';
import { 
  lookupOpenTasksByProperty 
} from '../../server/services/openTaskLookupService.js';
import { 
  convertCallToCanonicalMarketingRequest, 
  getAllCanonicalMarketingTasks, 
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';
import { RetellWebhookVerifier } from '../../server/contracts/retellWebhookVerifier.js';

describe('1. Retell Inbound Webhook Contract & Caller Identification Suite', () => {
  it('1. Known E.164 number uniquely matches Matt Orr with personalized greeting', async () => {
    const result = await identifyCaller({
      fromNumber: '+19106128283',
      toNumber: NEST_HOTLINE_E164,
      workspaceId: NEST_DEFAULT_WORKSPACE_ID
    });

    expect(result.caller_match_status).toBe('matched');
    expect(result.caller_first_name).toBe('Matt');
    expect(result.caller_full_name).toBe('Matt Orr');
    expect(result.caller_directory_member_id).toBe('dir_matt_orr_10');
    expect(result.caller_office).toBe('Mayfaire');
    expect(result.opening_greeting).toBe("Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. Is this Matt?");
  });

  it('2. Formatted US number normalizes and matches Matt Orr', async () => {
    const result = await identifyCaller({
      fromNumber: '(910) 612-8283',
      toNumber: '(910) 507-2047'
    });

    expect(result.caller_match_status).toBe('matched');
    expect(result.caller_first_name).toBe('Matt');
    expect(result.caller_full_name).toBe('Matt Orr');
  });

  it('3. Unknown phone number receives the generic greeting', async () => {
    const result = await identifyCaller({
      fromNumber: '+19105559999',
      toNumber: NEST_HOTLINE_E164
    });

    expect(result.caller_match_status).toBe('unknown');
    expect(result.caller_first_name).toBe('');
    expect(result.caller_full_name).toBe('');
    expect(result.opening_greeting).toBe("Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. May I ask who’s calling?");
  });

  it('4. Blocked, empty, or missing number receives the generic greeting safely', async () => {
    const emptyResult = await identifyCaller({ fromNumber: '' });
    expect(emptyResult.caller_match_status).toBe('unknown');
    expect(emptyResult.opening_greeting).toContain("May I ask who’s calling?");

    const nullResult = await identifyCaller({ fromNumber: null });
    expect(nullResult.caller_match_status).toBe('unknown');
    expect(nullResult.opening_greeting).toContain("May I ask who’s calling?");
  });

  it('5. The NORA Hotline number itself is NEVER matched as an individual caller', async () => {
    const resultHotline = await identifyCaller({
      fromNumber: '+19105072047',
      toNumber: NEST_HOTLINE_E164
    });

    expect(resultHotline.caller_match_status).toBe('unknown');
    expect(resultHotline.caller_first_name).toBe('');
    expect(resultHotline.caller_full_name).toBe('');
    expect(resultHotline.diagnostics.exclusion_reason).toBe('HOTLINE_SELF_CALL_EXCLUDED');
  });

  it('6. Disputed directory records (Ann Gunn) are excluded from automatic caller identification', async () => {
    expect(DISPUTED_DIRECTORY_MEMBER_IDS.has('dir_ann_gunn_28')).toBe(true);

    // Calling from the number in the CSV export (910-540-3965)
    const resultDisputed = await identifyCaller({
      fromNumber: '+19105403965',
      toNumber: NEST_HOTLINE_E164
    });

    expect(resultDisputed.caller_match_status).toBe('unknown');
    expect(resultDisputed.caller_first_name).toBe('');
    expect(resultDisputed.opening_greeting).toContain("May I ask who’s calling?");
  });

  it('7. Malformed directory phone values (dates, short digits) are excluded from matching', () => {
    expect(normalizePhoneNumber('4/22/2026').valid).toBe(false);
    expect(normalizePhoneNumber('6/18/2026').valid).toBe(false);
    expect(normalizePhoneNumber('3/30/2026').valid).toBe(false);
    expect(normalizePhoneNumber('339007').valid).toBe(false);
    expect(normalizePhoneNumber('234325').valid).toBe(false);
    expect(normalizePhoneNumber('579518144').valid).toBe(false); // 9 digits
  });

  it('8. Caller identification is tenant/workspace scoped', async () => {
    const result = await identifyCaller({
      fromNumber: '+19106128283',
      workspaceId: 'ws_wilmington'
    });
    expect(result.diagnostics.workspace_id).toBe('ws_wilmington');
  });

  it('9. Logs redact phone numbers for caller privacy', () => {
    expect(redactPhoneNumber('+19106128283')).toBe('+1910***8283');
    expect(redactPhoneNumber('(910) 507-2047')).toBe('(910)***2047');
    expect(redactPhoneNumber(null)).toBe('[REDACTED_BLANK]');
  });

  it('10. Cryptographic Retell Webhook signature verifier validates raw request body and rejects tampered bodies', () => {
    const rawBody = JSON.stringify({
      event: 'call_inbound',
      event_timestamp: 1780012672105,
      call_inbound: {
        agent_id: 'agent_cdd031880770993e4b11cb9340',
        from_number: '+19106128283',
        to_number: '+19105072047'
      }
    });
    const fakeKey = 'test_key_secret_12345';
    const validHeader = RetellWebhookVerifier.generateTestSignature(rawBody, fakeKey);

    // Valid
    const resValid = RetellWebhookVerifier.verifySignature({
      rawBody,
      signatureHeader: validHeader,
      apiKey: fakeKey
    });
    expect(resValid.valid).toBe(true);

    // Tampered payload
    const resTampered = RetellWebhookVerifier.verifySignature({
      rawBody: rawBody + 'tampered',
      signatureHeader: validHeader,
      apiKey: fakeKey
    });
    expect(resTampered.valid).toBe(false);
    expect(resTampered.reason).toBe('INVALID_RETELL_SIGNATURE_HMAC_MISMATCH');
  });
});

describe('2. Property Address Normalizer & Open-Task Lookup Suite', () => {
  it('1. Exact normalized address finds an open task', async () => {
    saveCanonicalMarketingTask({
      id: 'task_walcott_test_1',
      requestId: 'req_walcott_test_1',
      title: '1916 Walcott Avenue - 2-Page Flyer',
      propertyAddress: '1916 Walcott Ave, Wilmington NC',
      category: 'print',
      status: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const result = await lookupOpenTasksByProperty({
      address: '1916 Walcott Avenue, Wilmington NC',
      workspaceId: 'ws_wilmington'
    });

    expect(result.has_open_tasks).toBe(true);
    expect(result.match_type).toBe('exact');
    expect(result.spoken_summary).toContain('I found an open request for 1916 Walcott');
    expect(result.spoken_summary).toContain('It looks like it’s already being worked on');
    expect(result.tasks.length).toBeGreaterThan(0);
  });

  it('2. Case, punctuation, and street suffix variations match correctly', () => {
    const match1 = matchPropertyAddresses('1916 Walcott Ave.', '1916 Walcott Avenue, Wilmington, NC');
    expect(match1.matchType).toBe('exact');

    const match2 = matchPropertyAddresses('1104 S. Live Oak Parkway', '1104 S Live Oak Pkwy, Wilmington NC 28403');
    expect(match2.matchType).toBe('exact');
  });

  it('3. Different house numbers MUST NEVER match', () => {
    const evalResult = matchPropertyAddresses('1916 Walcott Ave', '1918 Walcott Ave');
    expect(evalResult.matchType).toBe('no_match');
    expect(evalResult.reason).toContain('HOUSE_NUMBER_MISMATCH');
  });

  it('4. Separate unit numbers do not collapse together', () => {
    const evalResult = matchPropertyAddresses('100 Main St Unit 4A', '100 Main St Unit 4B');
    expect(evalResult.matchType).toBe('no_match');
    expect(evalResult.reason).toContain('UNIT_NUMBER_MISMATCH');
  });

  it('5. Street name without house number is treated as ambiguous candidate requiring clarification', async () => {
    const result = await lookupOpenTasksByProperty({
      address: 'Walcott Avenue'
    });

    expect(result.match_type).toBe('ambiguous');
    expect(result.spoken_summary).toContain('What is the number for that property?');
  });

  it('6. Completed / archived tasks do not masquerade as open tasks', async () => {
    saveCanonicalMarketingTask({
      id: 'task_completed_999',
      requestId: 'req_completed_999',
      title: '999 Finished Court - Open House Kit',
      propertyAddress: '999 Finished Court, Wilmington NC',
      category: 'open_house',
      status: 'completed',
      assignedTo: 'Melissa Gagliardi',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const result = await lookupOpenTasksByProperty({
      address: '999 Finished Court'
    });

    expect(result.has_open_tasks).toBe(false);
    expect(result.spoken_summary).toContain('No open tasks found for 999 Finished Court');
  });

  it('7. Concurrent / repeated call conversion uses idempotency to prevent duplicate task containers', () => {
    const callPayload = {
      id: 'call_idempotent_test_100',
      callerName: 'Matt Orr',
      propertyAddress: '1916 Walcott Ave, Wilmington NC',
      transcript: 'I need a 2-page flyer for 1916 Walcott Ave.',
      notes: 'Initial call turn'
    };

    const firstRun = convertCallToCanonicalMarketingRequest(callPayload);
    expect(firstRun.shouldCreate).toBe(true);
    expect(firstRun.request).toBeDefined();

    // Second repeated conversion attempt (e.g. webhook retry or duplicate turn)
    const secondRun = convertCallToCanonicalMarketingRequest(callPayload);
    expect(secondRun.shouldCreate).toBe(true);
    expect(secondRun.request?.id).toBe(firstRun.request?.id);
  });
});
