/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Email Recipient Whitelist Safety Gate
 */

import { describe, it, expect } from 'vitest';
import {
  ALLOWED_TEST_EMAIL_RECIPIENTS,
  isAllowedEmailRecipient,
  sendEmail,
  sendMarketingIntakeConfirmationEmail,
  sendPhotoUploadRequestEmail,
  sendWelcomeInvitationEmail
} from '../../server/email/emailProvider.js';
import { dispatchEmailViaResend } from '../../server/email/resendDispatchAdapter.js';

describe('Strict Outgoing Email Whitelist Safety Gate', () => {
  it('1. Verifies only approved test accounts are in ALLOWED_TEST_EMAIL_RECIPIENTS', () => {
    expect(ALLOWED_TEST_EMAIL_RECIPIENTS).toContain('marcus@shapework.co');
    expect(ALLOWED_TEST_EMAIL_RECIPIENTS).toContain('marcus.aman@gmail.com');
    expect(ALLOWED_TEST_EMAIL_RECIPIENTS.length).toBe(2);
  });

  it('2. Evaluates isAllowedEmailRecipient correctly', () => {
    expect(isAllowedEmailRecipient('marcus@shapework.co')).toBe(true);
    expect(isAllowedEmailRecipient('marcus.aman@gmail.com')).toBe(true);
    expect(isAllowedEmailRecipient('MARCUS.AMAN@GMAIL.COM')).toBe(true);

    // Staff and test agents are safely suppressed tonight per directive
    expect(isAllowedEmailRecipient('matt.orr@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('melissa@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('melissa.gagliardi@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('ann.gunn@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('ryan@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('eduardo@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('julie.brown@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('random.agent@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('')).toBe(false);
    expect(isAllowedEmailRecipient(undefined)).toBe(false);
  });

  it('3. Suppresses outgoing sendEmail for non-whitelisted recipients like Julie Brown', async () => {
    const res = await sendEmail({
      to: 'julie.brown@nestrealty.com',
      subject: 'Test Email',
      text: 'This should be suppressed'
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain('suppressed_safe_mode');
  });

  it('4. Suppresses intake confirmation and photo requests for non-whitelisted recipients', async () => {
    const intakeRes = await sendMarketingIntakeConfirmationEmail({
      toEmail: 'julie.brown@nestrealty.com',
      agentName: 'Julie Brown',
      propertyAddress: '124 Wrightsville Ave',
      deliverables: ['EDDM Postcard'],
      assignedLead: 'Melissa Gagliardi'
    });
    expect(intakeRes.success).toBe(true);
    expect(intakeRes.messageId).toContain('suppressed_safe_mode');

    const photoRes = await sendPhotoUploadRequestEmail({
      toEmail: 'julie.brown@nestrealty.com',
      agentName: 'Julie Brown',
      propertyAddress: '124 Wrightsville Ave',
      driveUploadUrl: 'https://drive.google.com/test'
    });
    expect(photoRes.success).toBe(true);
    expect(photoRes.messageId).toContain('suppressed_safe_mode');
  });

  it('5. Suppresses Resend email dispatch for non-whitelisted recipients', async () => {
    const resendRes = await dispatchEmailViaResend({
      to: 'julie.brown@nestrealty.com',
      subject: 'Resend Test',
      html: '<p>Test</p>'
    });
    expect(resendRes.success).toBe(true);
    expect(resendRes.receipt.resendMessageId).toBe('suppressed_safe_mode');
    expect(resendRes.receipt.status).toBe('demo_sent');
  });

  it('6. Tests In-Progress, Need Info, and Completion lifecycle notifications', async () => {
    const {
      sendTaskInProgressNotificationEmail,
      sendTaskNeedMoreInfoEmail,
      sendTaskCompletionEmail
    } = await import('../../server/email/emailProvider.js');

    const inProgRes = await sendTaskInProgressNotificationEmail({
      toEmail: 'marcus.aman@gmail.com',
      agentName: 'Marcus Aman',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      taskTitle: '1-Page Property Flyer (8.5x11 Print)',
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director',
      ccManagerEmail: 'melissa.gagliardi@nestrealty.com'
    });
    expect(inProgRes.success).toBe(true);

    const needInfoRes = await sendTaskNeedMoreInfoEmail({
      toEmail: 'marcus.aman@gmail.com',
      agentName: 'Marcus Aman',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      taskTitle: '1-Page Property Flyer',
      requestedItems: ['High-res exterior photo', 'MLS Listing ID'],
      staffNotes: 'Please send before Thursday'
    });
    expect(needInfoRes.success).toBe(true);

    const completeRes = await sendTaskCompletionEmail({
      toEmail: 'marcus.aman@gmail.com',
      agentName: 'Marcus Aman',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      taskTitle: '1-Page Property Flyer',
      driveFolderUrl: 'https://drive.google.com/test'
    });
    expect(completeRes.success).toBe(true);
  });

  it('7. Verifies NEST_AGENTS_DIRECTORY in NewMarketingRequestModal', async () => {
    const { NEST_AGENTS_DIRECTORY } = await import('../components/marketing/NewMarketingRequestModal');
    const names = NEST_AGENTS_DIRECTORY.map(a => a.name);
    expect(names).not.toContain('Sarah Jenkins');
    expect(names).toContain('Jessica Keenan');
    expect(names).toContain('Eric Knight');
    expect(names).toContain('James Fort');
    expect(names).toContain('Eric Miller');
    expect(names).toContain('Matt Orr');
    expect(names).toContain('Ryan Crecelius');
    expect(names).toContain('Ann Gunn');
    expect(names).toContain('Melissa Gagliardi');
    expect(names).toContain('Marcus Aman');
  });
});
