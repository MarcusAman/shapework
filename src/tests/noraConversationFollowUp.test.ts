/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Conversation Follow-Up & Knowledge Email System Test Suite
 * 
 * Validates all 10 mandatory operational scenarios:
 * 1. Trivial Inquiry (Phone number) -> No follow-up email
 * 2. Branding Materials -> Verified brand resources + follow-up email to verified agent
 * 3. Friends of Nest Setup -> Approved instructions, minimums, and portal link
 * 4. Unverified Policy Inquiry -> Epistemic honesty (does not present unverified claims as fact)
 * 5. Assistant calling on behalf of Agent (Jennifer for Marcus Aman) -> Email to Marcus with Jennifer attribution
 * 6. Unknown caller / identity -> Identity safety (no invented identity, no email to guessed address)
 * 7. Support request created -> Request confirmation follow-up email
 * 8. Outbound Gmail failure -> Conversation succeeds, follow-up marked failed, non-blocking
 * 9. Duplicate worker execution -> Idempotency prevents duplicate emails
 * 10. Outdated dynamic knowledge -> Filtered out so outdated values are never presented as fact
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoraFollowUpService } from '../../server/services/nora/noraFollowUpService.js';
import { NoraFollowUpDecisionEngine } from '../../server/services/nora/noraFollowUpDecisionEngine.js';
import { NoraEmailComposer } from '../../server/services/nora/noraEmailComposer.js';
import { purgeFollowUpEmailsInMemory } from '../../server/persistence/noraFollowUpRepository.js';
import { purgeTelephonyCallsInMemory } from '../../server/persistence/telephonyCallsRepository.js';

describe('NORA Conversation Follow-Up & Knowledge Email System', () => {
  beforeEach(() => {
    purgeFollowUpEmailsInMemory();
    purgeTelephonyCallsInMemory();
    vi.restoreAllMocks();
  });

  // TEST 1: Agent asks simple phone-number question
  it('Test 1: Agent asks simple phone-number question -> Nora answers, NO follow-up email', async () => {
    const callId = `call_test_1_${Date.now()}`;
    const fromNumber = '+12527170595'; // Marcus Aman's recognized phone

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Agent: What's the Wilmington office phone number?\nNora: The Wilmington Mayfaire office phone number is (910) 507-2047.",
      summary: "Wilmington office phone number inquiry.",
      durationSeconds: 12
    });

    expect(outcome.agentIdentity.status).toBe('verified');
    expect(outcome.agentIdentity.fullName).toBe('Marcus Aman');
    expect(outcome.followUp.recommended).toBe(false);
    expect(outcome.followUp.followUpType).toBe('NONE');
    expect(outcome.followUp.status).toBe('suppressed');
    expect(outcome.followUp.reason).toContain('Trivial');
  });

  // TEST 2: Agent asks how to create Nest-compliant marketing material
  it('Test 2: Agent asks how to create Nest-compliant marketing material -> Verified brand resources + email sent', async () => {
    const callId = `call_test_2_${Date.now()}`;
    const fromNumber = '+12527170595'; // Marcus Aman

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hey NORA, I'm making my own marketing piece and I want to make sure I'm using the right Nest branding.",
      summary: "Self-created marketing branding standards inquiry.",
      durationSeconds: 52
    });

    expect(outcome.agentIdentity.status).toBe('verified');
    expect(outcome.agentIdentity.email).toBe('marcus@shapework.co');
    expect(outcome.followUp.recommended).toBe(true);
    expect(outcome.followUp.followUpType).toBe('KNOWLEDGE_RESOURCES');
    expect(outcome.followUp.status).toBe('sent');
    expect(outcome.followUp.recipientEmail).toBe('marcus@shapework.co');
    expect(outcome.followUp.subject).toContain('Nest resources');

    // Check knowledge grounding
    const knowledgeTitles = outcome.knowledgeUsed.map(k => k.title);
    expect(knowledgeTitles).toContain('Nest Brand Typography');
    expect(knowledgeTitles).toContain('Vector Logo Library');

    // Check verified resources and links
    const resourceUrls = outcome.resourcesUsed.map(r => r.url);
    expect(resourceUrls).toContain('https://nestrealty.box.com/s/nest-fonts-elza-larken');
    expect(resourceUrls).toContain('https://nestrealty.box.com/s/nest-vector-logos');
    expect(resourceUrls).toContain('https://nest.maxadesigns.com');
  });

  // TEST 3: Agent asks for Friends of Nest (FON) setup instructions
  it('Test 3: Agent asks for Friends of Nest setup instructions -> Follow-up contains steps and approved links', async () => {
    const callId = `call_test_3_${Date.now()}`;
    const fromNumber = '+19106128283'; // Matt Orr

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hi Nora, how do I set up my Friends of Nest campaign in Rechat and what are the order minimums?",
      summary: "Friends of Nest campaign setup and minimum order requirements.",
      durationSeconds: 65
    });

    expect(outcome.agentIdentity.status).toBe('verified');
    expect(outcome.followUp.recommended).toBe(true);
    expect(outcome.followUp.followUpType).toBe('KNOWLEDGE_RESOURCES');
    expect(outcome.followUp.status).toBe('sent');

    // Check FON knowledge
    const minOrderAssertion = outcome.knowledgeUsed.find(k => k.assertionId === 'ka_fon_min_order_02');
    expect(minOrderAssertion).toBeDefined();
    expect(minOrderAssertion?.summary).toContain('50 recipients');

    // Check Campaigns portal resource link
    const campaignLink = outcome.resourcesUsed.find(r => r.url.includes('campaigns.nestrealty.com'));
    expect(campaignLink).toBeDefined();

    // Check warning on missed deadline
    expect(outcome.warnings.some(w => w.includes('50-mailer'))).toBe(true);
  });

  // TEST 4: Agent asks about a policy that is UNVERIFIED
  it('Test 4: Agent asks about an UNVERIFIED policy -> Nora preserves epistemic uncertainty and does not present as fact', async () => {
    const callId = `call_test_4_${Date.now()}`;
    const fromNumber = '+12527170595'; // Marcus Aman

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hey Nora, can I cancel my farming contract after 6 months and what is the exact early termination fee refund?",
      summary: "Farming contract cancellation and early termination penalty inquiry.",
      durationSeconds: 70
    });

    expect(outcome.followUp.recommended).toBe(true);
    expect(outcome.resolutionStatus).toBe('escalated');

    // Cites verified 1-year rule
    const farmingCommitment = outcome.knowledgeUsed.find(k => k.assertionId === 'ka_farming_cancel_01');
    expect(farmingCommitment?.verificationStatus).toBe('VERIFIED');

    // Penalty is UNVERIFIED and flagged
    const unverifiedPenalty = outcome.knowledgeUsed.find(k => k.assertionId === 'ka_farming_penalty_unverified');
    expect(unverifiedPenalty?.verificationStatus).toBe('UNVERIFIED');

    // Generated email does not invent a fee amount
    const composed = NoraEmailComposer.composeFollowUpEmail(outcome);
    expect(composed).toBeDefined();
    expect(composed?.bodyText).not.toContain('$500');
    expect(composed?.bodyText).toContain('escalated');
  });

  // TEST 5: Jennifer calls on behalf of Marcus Aman
  it('Test 5: Jennifer calls on behalf of Marcus Aman -> Email goes to Marcus Aman, referencing Jennifer', async () => {
    const callId = `call_test_5_${Date.now()}`;
    const fromNumber = '+19105559999'; // Unrecognized assistant number

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hi Nora, this is Jennifer. I am calling on behalf of Marcus Aman regarding the brand standards and logo files for his upcoming listing flyer.",
      summary: "Assistant inquiry for Marcus Aman branding standards.",
      durationSeconds: 48
    });

    // Caller is Jennifer, Represented Agent is Marcus Aman
    expect(outcome.callerIdentity.isRepresentingAgent).toBe(true);
    expect(outcome.callerIdentity.name).toBe('Jennifer');
    expect(outcome.agentIdentity.fullName).toBe('Marcus Aman');
    expect(outcome.agentIdentity.email).toBe('marcus@shapework.co');

    // Follow-up email is sent to Marcus Aman (the agent)
    expect(outcome.followUp.recommended).toBe(true);
    expect(outcome.followUp.recipientEmail).toBe('marcus@shapework.co');
    expect(outcome.followUp.status).toBe('sent');

    // The composed email explicitly acknowledges Jennifer's call
    const composed = NoraEmailComposer.composeFollowUpEmail(outcome);
    expect(composed?.bodyText).toContain('Jennifer called earlier on your behalf');
    expect(composed?.bodyText).toContain('Hi Marcus,');
  });

  // TEST 6: Caller gives unknown agent name
  it('Test 6: Caller gives unknown agent name -> No invented identity, NO email sent to guessed address', async () => {
    const callId = `call_test_6_${Date.now()}`;
    const fromNumber = '+19105550000'; // Unknown number

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hi Nora, my name is John Wick and I need marketing materials.",
      summary: "Inbound call from unrecognized caller.",
      durationSeconds: 30
    });

    expect(outcome.agentIdentity.status).toBe('unverified');
    expect(outcome.agentIdentity.email).toBeNull();
    expect(outcome.followUp.recommended).toBe(false);
    expect(outcome.followUp.status).toBe('suppressed');
    expect(outcome.followUp.reason).toContain('Unverified caller identity');
  });

  // TEST 7: NORA creates support request
  it('Test 7: NORA creates support request -> Request confirmation email sent with ticket details', async () => {
    const callId = `call_test_7_${Date.now()}`;
    const fromNumber = '+12527170595'; // Marcus Aman
    const ticketId = 'tkt_rechat_99';

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Nora, can you tell Ann I'm having trouble getting into Rechat? The login is failing this morning.",
      summary: "Rechat login assistance request for Ann Gunn.",
      createdRequestId: ticketId,
      createdTasksCount: 1,
      durationSeconds: 40
    });

    expect(outcome.followUp.recommended).toBe(true);
    expect(outcome.followUp.followUpType).toBe('REQUEST_CONFIRMATION');
    expect(outcome.followUp.status).toBe('sent');
    expect(outcome.requestsCreated.length).toBeGreaterThan(0);

    const composed = NoraEmailComposer.composeFollowUpEmail(outcome);
    expect(composed?.subject).toContain('✓');
    expect(composed?.bodyText).toContain('Ann Gunn');
  });

  // TEST 8: Outbound Gmail request fails
  it('Test 8: Outbound Gmail request fails -> Conversation succeeds, follow-up marked failed, retryable', async () => {
    const callId = `call_test_8_${Date.now()}`;
    const fromNumber = '+12527170595';

    // Mock sendOutboundEmailViaAskNora to simulate Gmail API network timeout
    const sendSpy = vi.spyOn(NoraFollowUpService, 'sendOutboundEmailViaAskNora')
      .mockRejectedValueOnce(new Error('Google Workspace API 503 Service Unavailable'));

    const outcome = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "Hey NORA, I need the Nest branding fonts and logos for a flyer.",
      summary: "Brand collateral request.",
      durationSeconds: 45
    });

    // Call execution succeeds without throwing
    expect(outcome.conversationId).toBe(callId);
    expect(outcome.followUp.recommended).toBe(true);
    // Follow-up status records the failure gracefully
    expect(outcome.followUp.status).toBe('failed');
    expect(outcome.followUp.errorMessage).toContain('503 Service Unavailable');

    sendSpy.mockRestore();
  });

  // TEST 9: Duplicate worker runs
  it('Test 9: Duplicate worker runs -> Idempotency prevents sending duplicate follow-up email', async () => {
    const callId = `call_test_9_${Date.now()}`;
    const fromNumber = '+12527170595';

    // First worker processes call
    const outcome1 = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "I need the branding guidelines and font links for my new flyer.",
      durationSeconds: 35
    });

    expect(outcome1.followUp.status).toBe('sent');
    const firstMessageId = outcome1.followUp.messageId;
    expect(firstMessageId).toBeDefined();

    // Second duplicate worker processes the same callId
    const outcome2 = await NoraFollowUpService.processVoiceCall({
      callId,
      fromNumber,
      transcript: "I need the branding guidelines and font links for my new flyer.",
      durationSeconds: 35
    });

    // Second run is suppressed by idempotency
    expect(outcome2.followUp.status).toBe('suppressed');
    expect(outcome2.followUp.reason).toContain('idempotency');
  });

  // TEST 10: Conversation contains outdated dynamic knowledge
  it('Test 10: Conversation contains outdated dynamic knowledge -> Filtered out so outdated values are not in email', () => {
    const mockOutcome: any = {
      conversationId: 'call_test_10',
      channel: 'voice',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: 45,
      agentIdentity: {
        status: 'verified',
        fullName: 'Marcus Aman',
        email: 'marcus@shapework.co',
        office: 'Wilmington Mayfaire',
        market: 'Wilmington',
        role: 'Broker'
      },
      callerIdentity: {
        name: 'Marcus Aman',
        phone: '+12527170595',
        isRepresentingAgent: false,
        relationshipToAgent: 'self'
      },
      intent: 'SETUP_FRIENDS_OF_NEST',
      goal: 'Friends of Nest Campaign Dates',
      summary: 'Campaign dates inquiry',
      knowledgeUsed: [
        {
          assertionId: 'ka_fon_current_2026',
          title: '2026 Friends of Nest Schedule',
          summary: 'Quarterly campaigns occur in March, June, September, and November 2026.',
          verificationStatus: 'VERIFIED'
        },
        {
          assertionId: 'ka_fon_outdated_2025',
          title: '2025 Historical Campaign Deadlines',
          summary: 'Historical deadline was September 15, 2025.',
          verificationStatus: 'OUTDATED'
        }
      ],
      sopsUsed: [],
      resourcesUsed: [],
      warnings: [],
      requestsCreated: [],
      resolutionStatus: 'resolved',
      followUp: {
        recommended: true,
        reason: 'FON schedule requested',
        followUpType: 'KNOWLEDGE_RESOURCES',
        idempotencyKey: 'call_test_10_KNOWLEDGE_RESOURCES',
        status: 'pending'
      }
    };

    const composed = NoraEmailComposer.composeFollowUpEmail(mockOutcome);
    expect(composed).toBeDefined();

    // Authoritative email contains 2026 verified schedule
    expect(composed?.bodyText).toContain('2026 Friends of Nest Schedule');
    // OUTDATED 2025 entry is strictly omitted from the email
    expect(composed?.bodyText).not.toContain('2025 Historical Campaign Deadlines');
    expect(composed?.bodyText).not.toContain('September 15, 2025');
  });
});
