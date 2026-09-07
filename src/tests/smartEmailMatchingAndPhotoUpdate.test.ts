/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Smart Inbound Email Matching & Auto-Advance Photo Ingest
 */

import { describe, it, expect } from 'vitest';
import {
  processInboundAgentEmail,
  findMatchingExistingTask,
  InboundAgentEmail
} from '../../server/integrations/google/noraEmailIntakeService.js';
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getCanonicalMarketingTaskById,
  getAllCanonicalMarketingTasks,
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Smart Inbound Email Matching & Auto-Advance Photo Engine', () => {
  it('1. Correctly identifies existing active tasks matching the property address', () => {
    const existingReqId = `req_existing_oak_${Date.now()}`;
    const existingTaskId = `tsk_existing_oak_${Date.now()}`;

    const parentReq: CanonicalMarketingRequest = {
      id: existingReqId,
      title: 'Listing Launch for 1104 S Live Oak Pkwy',
      agentName: 'Matt Orr (REALTOR®)',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC',
      category: 'open_house',
      channel: 'phone',
      receivedAt: '2:00 PM · Today',
      taskIds: [existingTaskId],
      status: 'request_received',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestExcerpt: 'Waiting for listing photos'
    };
    saveCanonicalMarketingRequest(parentReq);

    const initialTask: CanonicalMarketingTask = {
      id: existingTaskId,
      requestId: existingReqId,
      requestTitle: 'Listing Launch for 1104 S Live Oak Pkwy',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC',
      agentName: 'Matt Orr (REALTOR®)',
      title: 'Open House Flyer & Information Sheet',
      category: 'open_house',
      status: 'request_received',
      assignedTo: 'Melissa Gagliardi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Initial phone intake logged at 2:00 PM. Awaiting high-res photos.'
    };
    saveCanonicalMarketingTask(initialTask);

    const match = findMatchingExistingTask('1104 S Live Oak Pkwy');
    expect(match.task).toBeDefined();
    expect(match.task?.id).toBe(existingTaskId);
    expect(match.request?.id).toBe(existingReqId);
  });

  it('2. Ingests Matt Orr email at 2:24 PM, matches 1104 S Live Oak Pkwy, and auto-advances to in_progress', async () => {
    const inboundEmail: InboundAgentEmail = {
      id: `eml_matt_224pm_${Date.now()}`,
      messageId: `<msg_matt_224pm_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (REALTOR®)',
      subject: 'Photos attached for 1104 S Live Oak Pkwy open house flyer',
      bodyText: 'Hey Nora, here are the 4 photos and specs for 1104 S Live Oak Pkwy. Please prepare the flyers!',
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'hero.jpg', contentType: 'image/jpeg', sizeBytes: 4200000, url: 'https://example.com/hero.jpg' },
        { filename: 'kitchen.jpg', contentType: 'image/jpeg', sizeBytes: 3800000, url: 'https://example.com/kitchen.jpg' }
      ]
    };

    const result = await processInboundAgentEmail(inboundEmail);

    expect(result.isMarketingRequest).toBe(true);
    expect(result.isExistingTaskUpdated).toBe(true);
    expect(result.extractedPhotosCount).toBe(2);
    expect(result.propertyAddress).toContain('1104 S Live Oak Pkwy');

    // Verify task in repository was updated
    const updatedTask = getCanonicalMarketingTaskById(result.updatedTaskId!);
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.status).toBe('in_progress'); // Auto-advanced from request_received
    expect(updatedTask?.notes).toContain('Inbound email from Matt Orr');
    expect(updatedTask?.notes).toContain('2 photos staged to Drive');
  });

  it('3. Creates a new task assigned to Melissa when no matching property exists', async () => {
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const newPropertyEmail: InboundAgentEmail = {
      id: `eml_new_prop_${Date.now()}`,
      messageId: `<msg_new_prop_${Date.now()}@nestrealty.com>`,
      fromEmail: 'matt.orr@nestrealty.com',
      fromName: 'Matt Orr (REALTOR®)',
      subject: `New Listing Flyer for ${uniqueNum} Inlet View Dr`,
      bodyText: `Nora, please create an open house flyer for our new listing at ${uniqueNum} Inlet View Dr, Wilmington NC.`,
      receivedAt: new Date().toISOString(),
      attachments: [
        { filename: 'front.jpg', contentType: 'image/jpeg', sizeBytes: 5000000, url: 'https://example.com/front.jpg' }
      ]
    };

    const result = await processInboundAgentEmail(newPropertyEmail);

    expect(result.isMarketingRequest).toBe(true);
    expect(result.isExistingTaskUpdated).toBeUndefined();
    expect(result.createdTaskId).toBeDefined();
    expect(result.assignedLead).toBe('Melissa Gagliardi');

    const createdTask = getCanonicalMarketingTaskById(result.createdTaskId!);
    expect(createdTask).toBeDefined();
    expect(createdTask?.assignedTo).toBe('Melissa Gagliardi');
    expect(createdTask?.status).toBe('in_progress');
  });
});
