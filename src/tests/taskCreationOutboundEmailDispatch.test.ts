/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Task Creation Outbound Email Dispatch & Whitelist Removal
 * Validates that:
 * 1. Outbound email whitelist is cut off when DISABLE_EMAIL_WHITELIST=true.
 * 2. New tasks trigger assignment alerts to assigned staff leads (Melissa, Ann, Eduardo, etc.).
 * 3. New requests trigger consolidated intake confirmations to requesting agents (Matt Orr, Julie Brown, etc.).
 * 4. Idempotency guards prevent duplicate email dispatches on repeated task saves.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  isAllowedEmailRecipient,
  sendTaskAssignmentNotificationEmail,
  sendMarketingIntakeConfirmationEmail
} from '../../server/email/emailProvider.js';
import {
  resolveStaffEmail,
  resolveAgentEmail,
  dispatchTaskAssignmentNotification,
  dispatchRequestIntakeConfirmation
} from '../../server/services/taskOutboundNotificationService.js';
import type { CanonicalMarketingTask, CanonicalMarketingRequest } from '../../server/persistence/marketingCampaignsRepository.js';

describe('Task Creation Outbound Email Dispatch & Whitelist Bypass', () => {
  const origDisableWhitelist = process.env.DISABLE_EMAIL_WHITELIST;
  const origMasterMode = process.env.OUTBOUND_MASTER_MODE;

  beforeEach(() => {
    process.env.DISABLE_EMAIL_WHITELIST = 'true';
    process.env.OUTBOUND_MASTER_MODE = 'live';
  });

  afterAll(() => {
    process.env.DISABLE_EMAIL_WHITELIST = origDisableWhitelist;
    process.env.OUTBOUND_MASTER_MODE = origMasterMode;
  });

  it('1. Verifies outbound email whitelist is disabled and allows real brokerage accounts', () => {
    expect(isAllowedEmailRecipient('melissa.gagliardi@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('ann.gunn@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('eduardo@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('matt.orr@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('julie.brown@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('ryan@nestrealty.com')).toBe(true);
    expect(isAllowedEmailRecipient('marcus.aman@gmail.com')).toBe(true);
    expect(isAllowedEmailRecipient('marcus@shapework.co')).toBe(true);

    // Malformed or empty strings are safely rejected
    expect(isAllowedEmailRecipient('')).toBe(false);
    expect(isAllowedEmailRecipient('not-an-email')).toBe(false);
    expect(isAllowedEmailRecipient(undefined)).toBe(false);
  });

  it('2. Resolves staff and agent emails from names, IDs, and directory entries', () => {
    expect(resolveStaffEmail('Melissa Gagliardi')).toBe('melissa.gagliardi@nestrealty.com');
    expect(resolveStaffEmail('melissa')).toBe('melissa.gagliardi@nestrealty.com');
    expect(resolveStaffEmail('Ann Gunn')).toBe('ann.gunn@nestrealty.com');
    expect(resolveStaffEmail('Eduardo Lovo')).toBe('eduardo@nestrealty.com');
    expect(resolveStaffEmail('Ryan Crecelius')).toBe('ryan@nestrealty.com');
    expect(resolveStaffEmail('custom.staff@nestrealty.com')).toBe('custom.staff@nestrealty.com');

    expect(resolveAgentEmail('Matt Orr')).toBe('matt.orr@nestrealty.com');
    expect(resolveAgentEmail('Matt Orr (Broker)')).toBe('matt.orr@nestrealty.com');
    expect(resolveAgentEmail('Julie Brown')).toBe('julie.brown@nestrealty.com');
    expect(resolveAgentEmail('Jessica Keenan (BIC)')).toBe('jessica.keenan@nestrealty.com');
    expect(resolveAgentEmail('Custom Agent', 'agent@example.com')).toBe('agent@example.com');
  });

  it('3. Generates and dispatches Dark Forest Hunter Green task assignment email to staff', async () => {
    const res = await sendTaskAssignmentNotificationEmail({
      toEmail: 'melissa.gagliardi@nestrealty.com',
      assigneeName: 'Melissa Gagliardi',
      requesterName: 'Matt Orr',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      taskTitle: '1-Page Property Flyer (8.5x11 Print)',
      category: 'print',
      dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      notes: 'Agent requested highlight on salt-water pool and architectural trim.',
      driveFolderUrl: 'https://drive.google.com/test-drive-folder',
      taskId: 'task_test_flyer_123'
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBeDefined();
    expect(res.messageId).not.toContain('suppressed_safe_mode');
  });

  it('4. Generates and dispatches consolidated intake confirmation email to agent', async () => {
    const res = await sendMarketingIntakeConfirmationEmail({
      toEmail: 'matt.orr@nestrealty.com',
      agentName: 'Matt Orr',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      deliverables: [
        '1-Page Property Flyer (8.5x11 Print)',
        '9:16 Social Story Carousel',
        'Custom Yard Sign & Post Install'
      ],
      assignedLead: 'Melissa Gagliardi'
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBeDefined();
    expect(res.messageId).not.toContain('suppressed_safe_mode');
  });

  it('5. Dispatches task assignment email via taskOutboundNotificationService with idempotency', async () => {
    const taskId = `task_outbound_unit_${Date.now()}`;
    const mockTask: CanonicalMarketingTask = {
      id: taskId,
      title: '9:16 Social Story Carousel',
      category: 'social',
      propertyAddress: '420 Carolina Beach Ave, Carolina Beach, NC',
      assignedTo: 'Eduardo Lovo',
      agentName: 'Jessica Keenan (Broker-in-Charge)',
      dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      notes: 'Prepare animated video reel and Instagram carousel slides.',
      driveFolderUrl: 'https://drive.google.com/test-social',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // First dispatch should succeed
    const firstDispatch = await dispatchTaskAssignmentNotification(mockTask, { source: 'unit_test' });
    expect(firstDispatch.success).toBe(true);
    expect(firstDispatch.skipped).toBeFalsy();

    // Second dispatch for identical task should be skipped by idempotency
    const secondDispatch = await dispatchTaskAssignmentNotification(mockTask, { source: 'unit_test' });
    expect(secondDispatch.success).toBe(true);
    expect(secondDispatch.skipped).toBe(true);
  });

  it('6. Dispatches consolidated request confirmation via taskOutboundNotificationService with idempotency', async () => {
    const reqId = `req_outbound_unit_${Date.now()}`;
    const mockReq: CanonicalMarketingRequest = {
      id: reqId,
      title: '124 Wrightsville Ave — Listing Launch Suite',
      propertyAddress: '124 Wrightsville Ave, Wilmington, NC',
      category: 'listing_launch',
      agentName: 'Julie Brown',
      agentEmail: 'julie.brown@nestrealty.com',
      assignedTo: 'Ann Gunn',
      taskIds: [`${reqId}_t1`, `${reqId}_t2`],
      channel: 'phone',
      requestExcerpt: 'Yard sign and listing brochures needed by Friday.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockTasks: CanonicalMarketingTask[] = [
      {
        id: `${reqId}_t1`,
        requestId: reqId,
        title: 'Yard Sign Post & Open House Rider',
        category: 'signage',
        propertyAddress: '124 Wrightsville Ave',
        assignedTo: 'Ann Gunn',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `${reqId}_t2`,
        requestId: reqId,
        title: '4-Page Listing Presentation Brochure',
        category: 'print',
        propertyAddress: '124 Wrightsville Ave',
        assignedTo: 'Melissa Gagliardi',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // First dispatch sends grouped confirmation
    const firstDispatch = await dispatchRequestIntakeConfirmation(mockReq, mockTasks, { source: 'unit_test' });
    expect(firstDispatch.success).toBe(true);
    expect(firstDispatch.skipped).toBeFalsy();

    // Second dispatch should be skipped by idempotency
    const secondDispatch = await dispatchRequestIntakeConfirmation(mockReq, mockTasks, { source: 'unit_test' });
    expect(secondDispatch.success).toBe(true);
    expect(secondDispatch.skipped).toBe(true);
  });

  it('7. Verifies activity history events are logged with channel email and direction outbound', async () => {
    const { getActivityHistoryForRequest } = await import('../../server/services/activityHistoryService.js');
    const reqId = `req_history_test_${Date.now()}`;
    const testReq: CanonicalMarketingRequest = {
      id: reqId,
      title: '702 S Front St — New Listing',
      propertyAddress: '702 S Front St, Wilmington, NC',
      category: 'listing_launch',
      agentName: 'Jessica Keenan',
      agentEmail: 'jessica.keenan@nestrealty.com',
      assignedTo: 'Melissa Gagliardi',
      taskIds: [`${reqId}_t1`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const testTask: CanonicalMarketingTask = {
      id: `${reqId}_t1`,
      requestId: reqId,
      title: '1-Page Property Flyer',
      category: 'print',
      propertyAddress: '702 S Front St',
      assignedTo: 'Melissa Gagliardi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dispatchRequestIntakeConfirmation(testReq, [testTask], { source: 'audit_test' });
    await dispatchTaskAssignmentNotification(testTask, { source: 'audit_test' });

    const events = await getActivityHistoryForRequest(reqId, 'ws_wilmington');
    const emailEvents = events.filter(e => e.channel === 'email' && e.direction === 'outbound');
    expect(emailEvents.length).toBeGreaterThanOrEqual(1);
    expect(emailEvents.some(e => e.summary.includes('Jessica Keenan') || e.summary.includes('intake confirmation'))).toBe(true);
  });
});
