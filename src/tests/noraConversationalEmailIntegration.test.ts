/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Inbound Email & Conversational Workflow Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { classifyInboundEmail } from '../../server/services/nora/noraEmailClassifier.js';
import { 
  handleNoraConversationalEmail, 
  composeWorkplaceConcernResponse, 
  composeOperationalQuestionResponse,
  resolveSenderProfile,
  BROKERAGE_LEADERSHIP_CONTACTS
} from '../../server/services/nora/noraConversationalEmailService.js';
import { recordInboundEmail, getInboundEmailRecord, isThreadAlreadyReplied } from '../../server/persistence/inboundEmailLedger.js';

describe('Nora Inbound Email Classifier', () => {
  it('1. Correctly classifies James Fort\'s workplace concern as conversational_question', () => {
    const result = classifyInboundEmail(
      'james.fort@nestrealty.com',
      'Help',
      'Help Nora, A nest agent is talking shit about me in vague Facebook posts and is trying to steal my listing, what should I do?'
    );

    expect(result.intent).toBe('conversational_question');
    expect(result.isWorkplaceConcern).toBe(true);
    expect(result.requiresBicEscalation).toBe(true);
  });

  it('2. Correctly classifies general operational and BIC questions as conversational_question', () => {
    const result = classifyInboundEmail(
      'marcus.aman@gmail.com',
      'Question for Nora',
      'Hi Nora, who is our Broker-in-Charge for contract compliance questions and Form 2-T approval?'
    );

    expect(result.intent).toBe('conversational_question');
    expect(result.requiresBicEscalation).toBe(true);
  });

  it('3. Correctly classifies property marketing requests as marketing_task', () => {
    const result = classifyInboundEmail(
      'matt.orr@nestrealty.com',
      'Listing Collateral for 1916 Wolcott Ave',
      'Hi Nora, please prepare an 8.5x11 flyer and social carousel for my new listing at 1916 Wolcott Ave.'
    );

    expect(result.intent).toBe('marketing_task');
  });

  it('4. Protects against loops and automated system emails', () => {
    const bounce = classifyInboundEmail(
      'mailer-daemon@googlemail.com',
      'Delivery Status Notification (Failure)',
      'The response from the remote server was: 550 5.1.1'
    );
    expect(bounce.intent).toBe('automated_system');

    const selfSent = classifyInboundEmail(
      'asknora@nestrealty.com',
      'Weekly Report',
      'Here is the weekly activity summary.'
    );
    expect(selfSent.intent).toBe('automated_system');

    const outOfOffice = classifyInboundEmail(
      'agent@nestrealty.com',
      'Automatic reply: Out of Office',
      'I am currently out of the office with limited email access.'
    );
    expect(outOfOffice.intent).toBe('automated_system');
  });
});

describe('Nora Conversational Response Engine', () => {
  it('5. Generates measured, policy-grounded guidance for workplace concerns with BIC contact', () => {
    const response = composeWorkplaceConcernResponse('James', 'A nest agent is talking shit about me...');

    // Acknowledges and advises stepping back from social media
    expect(response.plainText).toContain('step away from social media');
    expect(response.plainText).toContain('Do not reply, comment, or post vague counter-statements');

    // Documents facts
    expect(response.plainText).toContain('Document the Facts');
    expect(response.plainText).toContain('screenshots');

    // Directs to Broker-in-Charge
    expect(response.plainText).toContain('Eric Knight');
    expect(response.plainText).toContain('Jessica Keenan');
    expect(response.plainText).toContain('bic@nestrealty.com');
    expect(response.plainText).toContain('(910) 367-2253');
    expect(response.plainText).toContain('Ryan Crecelius');

    // Does not create a marketing task or invent rules
    expect(response.plainText).not.toContain('Flyer');
    expect(response.plainText).not.toContain('Postcard');
  });

  it('6. Resolves sender directory information accurately', () => {
    const jamesProfile = resolveSenderProfile('"James Fort" <james.fort@nestrealty.com>');
    expect(jamesProfile.firstName).toBe('James');
    expect(jamesProfile.email).toBe('james.fort@nestrealty.com');

    const marcusProfile = resolveSenderProfile('marcus.aman@gmail.com');
    expect(marcusProfile.name).toBe('Marcus Aman');
    expect(marcusProfile.firstName).toBe('Marcus');
  });

  it('7. Prevents duplicate responses and respects existing manual replies in threads', async () => {
    const threadId = 'test_thread_manual_' + Date.now();
    const originalMsgId = '<test_orig_' + Date.now() + '@nestrealty.com>';

    // Pre-record that Marcus manually replied to this thread
    await recordInboundEmail({
      messageId: originalMsgId,
      threadId,
      fromEmail: 'james.fort@nestrealty.com',
      subject: 'Help',
      intent: 'conversational_question',
      status: 'manual_reply_detected',
      replyMessageId: '<manual_reply_' + Date.now() + '@gmail.com>'
    });

    const isAnswered = await isThreadAlreadyReplied(threadId);
    expect(isAnswered).toBe(true);

    // Attempt automated processing of the same message
    const outcome = await handleNoraConversationalEmail({
      messageId: originalMsgId,
      threadId,
      from: 'james.fort@nestrealty.com',
      subject: 'Help',
      textContent: 'Help Nora, a nest agent is talking shit...'
    });

    expect(outcome.action).toBe('skipped_manual_reply');
    expect(outcome.success).toBe(true);
  });

  it('8. Deduplicates single message processing (idempotency)', async () => {
    const uniqueMsgId = '<test_unique_' + Date.now() + '@shapework.co>';
    const threadId = 'thread_' + Date.now();

    await recordInboundEmail({
      messageId: uniqueMsgId,
      threadId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Test Idempotency',
      intent: 'conversational_question',
      status: 'replied',
      replyMessageId: '<reply_abc@nestrealty.com>'
    });

    const secondAttempt = await handleNoraConversationalEmail({
      messageId: uniqueMsgId,
      threadId,
      from: 'marcus@shapework.co',
      subject: 'Test Idempotency',
      textContent: 'Just testing deduplication'
    });

    expect(secondAttempt.action).toBe('skipped_duplicate');
    expect(secondAttempt.success).toBe(true);
  });

  it('9. Allows thread continuation for legitimate follow-up messages while preventing duplicate delivery', async () => {
    const threadId = 'thread_continuation_' + Date.now();
    const msg1Id = '<msg1_' + Date.now() + '@shapework.co>';
    const msg2Id = '<msg2_' + Date.now() + '@shapework.co>';

    // 1. First message arrives and is answered
    await recordInboundEmail({
      messageId: msg1Id,
      threadId,
      fromEmail: 'marcus@shapework.co',
      subject: 'Question for Nora',
      intent: 'conversational_question',
      status: 'replied',
      replyMessageId: '<reply_1@nestrealty.com>'
    });

    // 2. Duplicate delivery of msg1 must be skipped
    const dup1Outcome = await handleNoraConversationalEmail({
      messageId: msg1Id,
      threadId,
      from: 'marcus@shapework.co',
      subject: 'Question for Nora',
      textContent: 'Who is BIC?'
    });
    expect(dup1Outcome.action).toBe('skipped_duplicate');

    // 3. Legitimate second message in the same thread should be processed (not blocked by previous reply)
    const prevMaster = process.env.OUTBOUND_MASTER_MODE;
    const prevAuto = process.env.NORA_AUTOMATION_MODE;
    try {
      process.env.OUTBOUND_MASTER_MODE = 'live';
      process.env.NORA_AUTOMATION_MODE = 'live';

      const msg2Outcome = await handleNoraConversationalEmail({
        messageId: msg2Id,
        threadId,
        from: 'marcus@shapework.co',
        subject: 'Re: Question for Nora',
        textContent: 'Thanks! What is the phone number for the BIC desk?'
      });
      expect(msg2Outcome.action).toBe('replied');
      expect(msg2Outcome.success).toBe(true);
    } finally {
      process.env.OUTBOUND_MASTER_MODE = prevMaster;
      process.env.NORA_AUTOMATION_MODE = prevAuto;
    }

    // 4. Duplicate delivery of msg2 must now also be skipped
    const dup2Outcome = await handleNoraConversationalEmail({
      messageId: msg2Id,
      threadId,
      from: 'marcus@shapework.co',
      subject: 'Re: Question for Nora',
      textContent: 'Thanks! What is the phone number for the BIC desk?'
    });
    expect(dup2Outcome.action).toBe('skipped_duplicate');
  });
});
