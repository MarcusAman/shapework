/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Conversational Intake Precedence, Turn-Attributed Extraction,
 * Canonical Workflow & Zero-Cloning Task Assignment
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  parseTranscriptTurns,
  parseConversationalQuantity,
  parseConversationalDate,
  extractConversationalMarketingIntake,
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingTask,
  archiveCanonicalMarketingRequestAndTasks
} from '../../server/persistence/marketingCampaignsRepository.js';
import { normalizeSourceChannel } from '../components/marketing/RequestSourceIcon.js';

describe('Conversational Intake Precedence & Canonical Workflow Suite', () => {
  const testIdsToClean: string[] = [];

  afterAll(async () => {
    for (const id of testIdsToClean) {
      archiveCanonicalMarketingRequestAndTasks(id);
    }
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool ? getDbPool() : null;
      if (pool && testIdsToClean.length > 0) {
        await pool.query(`DELETE FROM canonical_marketing_requests WHERE id = ANY($1)`, [testIdsToClean]);
        await pool.query(`DELETE FROM canonical_marketing_tasks WHERE request_id = ANY($1)`, [testIdsToClean]);
      }
    } catch {}
  });

  // 1. Turn-Attributed Speaker Extraction
  it('1. parseTranscriptTurns accurately separates agent vs user turns with multiline utterances', () => {
    const transcript = `
Agent: Thanks for calling Nest. Is this Matt?
User: Yes. It is.
Agent: What can I help you get rolling today?
User: I need a open house flyer for a listing.
Six seventy two Grace Street.
Agent: 672 Grace Street. Did you want that as a tri-fold or a single-page flyer?
User: Single page.
Agent: When do you need it done by?
User: September seventeenth.
`;
    const turns = parseTranscriptTurns(transcript);
    expect(turns.length).toBe(8);
    expect(turns[0]).toEqual({ speaker: 'agent', text: 'Thanks for calling Nest. Is this Matt?' });
    expect(turns[1]).toEqual({ speaker: 'user', text: 'Yes. It is.' });
    expect(turns[3].speaker).toBe('user');
    expect(turns[3].text).toContain('I need a open house flyer for a listing. Six seventy two Grace Street.');
    expect(turns[4]).toEqual({ speaker: 'agent', text: '672 Grace Street. Did you want that as a tri-fold or a single-page flyer?' });
    expect(turns[5]).toEqual({ speaker: 'user', text: 'Single page.' });
    expect(turns[6]).toEqual({ speaker: 'agent', text: 'When do you need it done by?' });
    expect(turns[7]).toEqual({ speaker: 'user', text: 'September seventeenth.' });
  });

  // 2. Caller Intent Precedence: Flyer Format
  it('2. Caller answering "Single page" overrides agent question mentioning "tri-fold"', () => {
    const call = {
      transcript: `
Agent: Did you want that as a tri-fold or a single-page flyer?
User: Single page.
`,
      call_analysis: {
        call_summary: 'Agent requested single-page flyer.'
      }
    };
    const intake = extractConversationalMarketingIntake(call, call.transcript);
    expect(intake.format).toBe('single_page');
  });

  it('3. Caller explicitly requesting "Tri-fold" resolves to tri_fold', () => {
    const call = {
      transcript: `
Agent: Did you want that as a tri-fold or a single-page flyer?
User: Let's do a tri-fold.
`
    };
    const intake = extractConversationalMarketingIntake(call, call.transcript);
    expect(intake.format).toBe('tri_fold');
  });

  // 3. Caller Intent Precedence: Vendor Choice
  it('4. Caller answering "Let\'s use alpha graphics" overrides agent question mentioning "CopyCat"', () => {
    const call = {
      transcript: `
Agent: Okay, fifty. Do you have a preferred print vendor, like CopyCat or AlphaGraphics?
User: Let's use alpha graphics.
Agent: Okay, AlphaGraphics.
`
    };
    const intake = extractConversationalMarketingIntake(call, call.transcript);
    expect(intake.vendorName).toBe('AlphaGraphics');
    expect(intake.isProfessionalPrint).toBe(true);
  });

  it('5. Caller choosing CopyCat resolves to CopyCat', () => {
    const call = {
      transcript: `
Agent: Do you have a preferred print vendor, like CopyCat or AlphaGraphics?
User: Copycat is closer, let's use them.
`
    };
    const intake = extractConversationalMarketingIntake(call, call.transcript);
    expect(intake.vendorName).toBe('CopyCat');
  });

  // 4. Quantity Parsing
  it('6. Spoken "Fifty" parses as 50 copies, not 55 copies', () => {
    expect(parseConversationalQuantity('Fifty.')).toBe(50);
    expect(parseConversationalQuantity('We need fifty copies')).toBe(50);
    expect(parseConversationalQuantity('Fifty-five')).toBe(55);
    expect(parseConversationalQuantity('twenty five')).toBe(25);
    expect(parseConversationalQuantity('one hundred')).toBe(100);
  });

  // 5. Delivery Location
  it('7. Delivery to "Mayfair office" normalizes to "Mayfaire office"', () => {
    const call = {
      transcript: `
Agent: What address should they deliver those fifty flyers to?
User: The Mayfair office.
`
    };
    const intake = extractConversationalMarketingIntake(call, call.transcript);
    expect(intake.deliveryLocation).toBe('Mayfaire office');
  });

  // 6. Deadline / Needed By Date
  it('8. Spoken "September seventeenth" binds to 2026-09-17T00:00:00.000Z and prevents 2001 year bug', () => {
    const dateStr = parseConversationalDate('September seventeenth');
    expect(dateStr).toBe('2026-09-17T00:00:00.000Z');
    expect(dateStr?.startsWith('2026-09-17')).toBe(true);
    expect(dateStr?.includes('2001')).toBe(false);
  });

  // 7. Full E2E Reproduction of call_dc514b5ae71c80239edf28081fc
  it('9. Full conversion of Matt Orr call generates canonical single work item with authoritative caller choices', () => {
    const reproductionCallId = `call_test_repro_${Date.now()}`;
    testIdsToClean.push(`req_call_${reproductionCallId}`);

    const callPayload = {
      id: reproductionCallId,
      agent_id: 'agent_cdd031880770993e4b11cb9340',
      caller_name: 'Matt Orr (REALTOR®)',
      from_number: '+19106128283',
      transcript: `Agent: Thanks for calling Nest. Is this Matt?
User: Yes. It is.
Agent: Hi Matt. What can I help you get rolling today?
User: I need a open house flyer for a listing.
Agent: Awesome, let's get that open house flyer set up. Is the property already live in Flex MLS, or are we getting
User: It's already live.
Agent: the marketing ready before it goes live?
Agent: Okay. What's the property address?
User: Six seventy two Grace Street,
Agent: 672 Grace Street. Did you want that as a tri-fold or a single-page flyer?
User: Single page.
Agent: Single-page flyer for 672 Grace Street, got it. When do you need it done by?
User: September seventeenth.
Agent: September 17th, perfect. Are you printing these yourself, or do you want us to order professional prints?
User: Order professional prints.
Agent: How many copies do
User: Fifty.
Agent: you need?
Agent: Okay, fifty. Do you have a preferred print vendor, like CopyCat or AlphaGraphics?
User: Let's use alpha graphics.
Agent: Okay, AlphaGraphics. What address should they deliver those fifty flyers to?
User: The Mayfair office.
Agent: Okay, the Mayfair office. Melissa will get a quote from AlphaGraphics and get back to you.
User: That should be it. Thank you.
Agent: You're welcome, Matt. Have a great evening, and good luck with the open house!
User: Thank you.
Agent: open house!`,
      call_analysis: {
        call_summary: 'Matt Orr called to request a single-page open house flyer for 672 Grace Street, needed by September 17. The agent submitted the marketing intake, confirmed professional printing of 50 copies via AlphaGraphics, and noted delivery to the Mayfair office with Melissa to follow up on the print quote.',
        custom_analysis_data: {
          title: 'Open house flyer and print order for 672 Grace Street',
          urgency: 'normal',
          category: 'marketing',
          requester: 'Matt Orr',
          description: 'Requester needs a single-page open house flyer for 672 Grace Street by September 17, plus 50 professionally printed copies through AlphaGraphics delivered to the Mayfair office.',
          primary_owner: 'melissa',
          property_address: '672 Grace Street'
        }
      }
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);
    expect(result.shouldCreate).toBe(true);
    expect(result.suppressed).toBe(false);
    expect(result.tasks.length).toBe(1);

    const task = result.tasks[0];
    const request = result.request!;

    // 1. Deliverable Title
    expect(task.title).toBe('Open House Single-Page Flyer — 672 Grace Street');
    expect(task.category).toBe('open_house');

    // 2. Intake Owner vs Downstream Assignee
    expect(task.status).toBe('request_received');
    expect(task.assignedTo).toBe('Melissa Gagliardi');
    expect(task.assignedToId).toBe('dir_melissa_gagliardi_33');
    expect(task.assignedToRole).toBe('Marketing Director');
    expect(task.reviewOwner).toBe('Melissa Gagliardi');
    expect(task.reviewOwnerId).toBe('dir_melissa_gagliardi_33');

    // 3. Vendor Details
    expect(task.vendorName).toBe('AlphaGraphics');
    expect(task.vendorNotes).toBe('Client requested 50 single-page flyers professionally printed with AlphaGraphics. Delivery to Mayfaire office. Melissa to obtain quote and coordinate.');

    // 4. Requirements Array
    expect(task.requirements?.length).toBe(4);
    expect(task.requirements?.[0].title).toBe('Format: Single-page open house flyer');
    expect(task.requirements?.[1].title).toBe('Quantity: 50 copies');
    expect(task.requirements?.[2].title).toBe('Production: Professional printing via AlphaGraphics (Delivery: Mayfaire Office)');
    expect(task.requirements?.[3].title).toContain('Source Assets: Retrieve listing details and photos from Flex MLS');

    // 5. Due Date & Schedule
    expect(task.dueAt).toBe('2026-09-17T00:00:00.000Z');
    expect(task.neededByDate).toBe('2026-09-17T00:00:00.000Z');
    expect(task.eventDate).toBe('09/17');

    // 6. Source Channel Attribution
    expect(task.channel).toBe('phone');
    expect(task.callId).toBe(reproductionCallId);
    expect(task.telephonyCallId).toBe(reproductionCallId);
    expect(request.channel).toBe('phone');
    expect(request.status).toBe('request_received');
    expect(request.eventDate).toBe('09/17');
  });

  // 8. Idempotency: Re-syncing the same call does not duplicate work items
  it('10. Re-running conversion on the same call does not spawn duplicate tasks or requests', () => {
    const testCallId = `call_test_idem_${Date.now()}`;
    testIdsToClean.push(`req_call_${testCallId}`);

    const payload = {
      id: testCallId,
      callerName: 'Matt Orr (REALTOR®)',
      transcript: 'User: I need a single-page flyer for 801 Market St by September 20. 50 copies with AlphaGraphics at Mayfair office.',
      summary: 'Matt Orr requesting 50 single-page flyers via AlphaGraphics for 801 Market St.'
    };

    const firstRun = convertCallToCanonicalMarketingRequest(payload);
    expect(firstRun.tasks.length).toBe(1);
    const initialTaskId = firstRun.tasks[0].id;

    const secondRun = convertCallToCanonicalMarketingRequest(payload);
    expect(secondRun.tasks.length).toBe(1);
    expect(secondRun.tasks[0].id).toBe(initialTaskId);

    const allMatching = getAllCanonicalMarketingTasks().filter(t => t.requestId === `req_call_${testCallId}`);
    expect(allMatching.length).toBe(1);
  });

  // 9. Manual Assignment: Zero Cloning, Updates Same Work Item
  it('11. Melissa manually assigning Eduardo transitions same work item from request_received to assigned without cloning', () => {
    const testCallId = `call_test_assign_${Date.now()}`;
    testIdsToClean.push(`req_call_${testCallId}`);

    const payload = {
      id: testCallId,
      callerName: 'Matt Orr (REALTOR®)',
      transcript: 'User: Single page flyer for 100 Chestnut St needed by September 17. 50 copies via AlphaGraphics.',
      summary: 'Single page flyer for 100 Chestnut St'
    };

    const result = convertCallToCanonicalMarketingRequest(payload);
    const task = result.tasks[0];
    expect(task.status).toBe('request_received');
    expect(task.assignedTo).toBe('Melissa Gagliardi');

    // Simulate Melissa assigning to Eduardo in server endpoint
    task.assignedToId = 'dir_eduardo_lovo_73';
    task.assignedTo = 'Eduardo Lovo';
    task.assignedToRole = 'Virtual Assistant / Production Specialist';
    task.status = 'assigned';
    task.updatedAt = new Date().toISOString();

    const saved = saveCanonicalMarketingTask(task);
    expect(saved.id).toBe(task.id);
    expect(saved.status).toBe('assigned');
    expect(saved.assignedTo).toBe('Eduardo Lovo');
    expect(saved.assignedToId).toBe('dir_eduardo_lovo_73');

    // Verify task count is still exactly 1
    const tasksForReq = getAllCanonicalMarketingTasks().filter(t => t.requestId === `req_call_${testCallId}`);
    expect(tasksForReq.length).toBe(1);
  });

  // 10. Zero-Hardcoding Generic Test (Different Property & Requester)
  it('12. Algorithmic extraction works identically for generic agents and properties without hardcoded addresses', () => {
    const genericCallId = `call_test_generic_${Date.now()}`;
    testIdsToClean.push(`req_call_${genericCallId}`);

    const genericCall = {
      id: genericCallId,
      callerName: 'Sarah Jenkins (Broker)',
      transcript: `Agent: Hi Sarah. What do you need?
User: Open house flyer for 1402 Harbor Point Way.
Agent: Tri-fold or single page?
User: Single page.
Agent: When do you need it by?
User: October twenty-first.
Agent: Professional prints?
User: Yes, twenty five copies.
Agent: Vendor?
User: Let's use AlphaGraphics.
Agent: Delivery?
User: Carolina Beach office.`,
      call_analysis: {
        call_summary: 'Sarah Jenkins requested 25 single-page flyers via AlphaGraphics for 1402 Harbor Point Way by October 21 delivered to Carolina Beach office.'
      }
    };

    const result = convertCallToCanonicalMarketingRequest(genericCall);
    expect(result.shouldCreate).toBe(true);
    const task = result.tasks[0];
    expect(task.title).toBe('Open House Single-Page Flyer — 1402 Harbor Point Way');
    expect(task.vendorName).toBe('AlphaGraphics');
    expect(task.vendorNotes).toContain('25 single-page flyers');
    expect(task.vendorNotes).toContain('Delivery to Carolina Beach office.');
    expect(task.dueAt).toBe('2026-10-21T00:00:00.000Z');
    expect(task.status).toBe('request_received');
    expect(task.assignedTo).toBe('Melissa Gagliardi');
  });

  // 11. Operations Intake Routing (Rule 13 / Ann Gunn)
  it('13. Operations request routes to Ann Gunn as intake owner with request_received status', () => {
    const opsCallId = `call_test_ops_${Date.now()}`;
    testIdsToClean.push(`req_call_${opsCallId}`);

    const opsCall = {
      id: opsCallId,
      callerName: 'David Vance',
      transcript: 'User: Hi Nora, we need a yard sign and post installed at 505 Bradley Creek Dr tomorrow.',
      summary: 'David Vance requested yard sign post installation.'
    };

    const result = convertCallToCanonicalMarketingRequest(opsCall);
    expect(result.shouldCreate).toBe(true);
    const task = result.tasks[0];
    expect(task.category).toBe('signage');
    expect(task.assignedTo).toBe('Ann Gunn');
    expect(task.assignedToId).toBe('dir_ann_gunn_28');
    expect(task.status).toBe('request_received');
    expect(task.channel).toBe('phone');
  });

  // 12. Safe Date Persistence (Preventing 2001 year bug)
  it('14. Safe date logic prevents 2001 year dates across database and store', async () => {
    const { parseSafeDate } = await import('../../server/persistence/marketingCampaignsRepository.js');
    expect(parseSafeDate).toBeDefined();
    
    const d1 = parseSafeDate('09/17');
    expect(d1?.getUTCFullYear()).toBe(2026);
    expect(d1?.getUTCMonth()).toBe(8); // 0-indexed September
    expect(d1?.getUTCDate()).toBe(17);

    const d2 = parseSafeDate('2001-09-17T00:00:00.000Z');
    expect(d2?.getUTCFullYear()).toBe(2026);

    const d3 = parseSafeDate('2026-09-17T00:00:00.000Z');
    expect(d3?.getUTCFullYear()).toBe(2026);
  });

  // 13. Channel Normalization & Source Channel Icons
  it('15. Normalized channel mapping maps phone to Retell Voice with Phone icon', () => {
    const config = normalizeSourceChannel('phone', 'call_123');
    expect(config.type).toBe('phone');
    expect(config.label).toBe('Phone Call Intake (Retell Voice)');
    expect(config.badgeLabel).toBe('Retell Voice');
    expect(config.icon).toBeDefined();

    const emailConfig = normalizeSourceChannel('email');
    expect(emailConfig.type).toBe('email');
    expect(emailConfig.badgeLabel).toBe('Email');

    const chatConfig = normalizeSourceChannel('chat');
    expect(chatConfig.type).toBe('chat');
    expect(chatConfig.badgeLabel).toBe('Chat');
  });

  // 14. OOO Coverage during manual assignment
  it('16. Manual assignment attaches OOO covering staff when assignee is out of office', async () => {
    const testCallId = `call_test_ooo_${Date.now()}`;
    testIdsToClean.push(`req_call_${testCallId}`);

    const payload = {
      id: testCallId,
      callerName: 'Matt Orr (REALTOR®)',
      transcript: 'User: Single page flyer for 920 Market St needed by September 17. 50 copies via AlphaGraphics.',
      summary: 'Single page flyer for 920 Market St'
    };

    const result = convertCallToCanonicalMarketingRequest(payload);
    const task = result.tasks[0];

    const { resolveActiveCoveringStaff } = await import('../../server/persistence/operationsDirectoryRepository.js');
    const { getAllStaffMembers } = await import('../../server/persistence/operationsDirectoryRepository.js');
    const allStaff = getAllStaffMembers();
    const eduardo = allStaff.find(s => s.id === 'dir_eduardo_lovo_73');

    // Temporarily simulate Eduardo as OOO
    if (eduardo) {
      const prevStatus = eduardo.status;
      const prevBackup = eduardo.backupStaffId;
      eduardo.status = 'out_of_office';
      eduardo.backupStaffId = 'dir_ann_gunn_28';

      const covering = resolveActiveCoveringStaff('dir_eduardo_lovo_73', 'ws_wilmington');
      expect(covering?.id).toBe('dir_ann_gunn_28');

      task.assignedToId = 'dir_eduardo_lovo_73';
      task.assignedTo = 'Eduardo Lovo';
      task.coveringStaffId = covering?.id;
      task.coveringStaffName = covering?.fullName;
      task.status = 'assigned';

      const saved = saveCanonicalMarketingTask(task);
      expect(saved.assignedToId).toBe('dir_ann_gunn_28');
      expect(saved.coveringStaffId).toBe('dir_ann_gunn_28');
      expect(saved.coveringStaffName).toBe('Ann Gunn');

      // Restore
      eduardo.status = prevStatus;
      eduardo.backupStaffId = prevBackup;
    }
  });

  // 15. Requirements item state integrity
  it('17. Requirements items start in not_reviewed state and preserve custom deliverable specs', () => {
    const testCallId = `call_test_reqs_${Date.now()}`;
    testIdsToClean.push(`req_call_${testCallId}`);

    const payload = {
      id: testCallId,
      callerName: 'Matt Orr (REALTOR®)',
      propertyAddress: '450 Eastwood Rd, Wilmington NC',
      transcript: `Agent: Open house flyer for 450 Eastwood Rd. Single-page or tri-fold?
User: Single page.
Agent: How many?
User: Fifty.
Agent: Vendor?
User: Let's use AlphaGraphics.
Agent: Delivery?
User: Mayfair office.`,
      summary: 'Single page flyer, 50 copies, AlphaGraphics, Mayfair office'
    };

    const result = convertCallToCanonicalMarketingRequest(payload);
    const task = result.tasks[0];
    expect(task.requirements).toBeDefined();
    for (const req of task.requirements!) {
      expect(req.state).toBe('not_reviewed');
      expect(req.title).toBeTruthy();
    }
  });

  // 16. Single Canonical Work Item constraint
  it('18. Enforces exactly one canonical request and one canonical task per distinct inbound call', () => {
    const testCallId = `call_test_single_${Date.now()}`;
    testIdsToClean.push(`req_call_${testCallId}`);

    const payload = {
      id: testCallId,
      callerName: 'Matt Orr (REALTOR®)',
      transcript: 'User: Single page flyer for 333 Water St. 50 copies via AlphaGraphics.',
      summary: 'Single page flyer for 333 Water St'
    };

    const result = convertCallToCanonicalMarketingRequest(payload);
    expect(result.tasks.length).toBe(1);

    const allRequests = getAllCanonicalMarketingRequests().filter(r => r.telephonyCallId === testCallId);
    expect(allRequests.length).toBe(1);

    const allTasks = getAllCanonicalMarketingTasks().filter(t => t.callId === testCallId || t.telephonyCallId === testCallId);
    expect(allTasks.length).toBe(1);
  });
});
