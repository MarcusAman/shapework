/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository';

describe('Telephony Inbound Phone Call to Marketing Requests Table Sync Suite', () => {
  beforeAll(() => {
    resetCanonicalStoreForTesting();
  });
  it('1. Inbound phone call automatically creates a new Canonical Marketing Request and child tasks in request_received', () => {
    const callPayload = {
      id: 'call_test_lumina_914',
      callerName: 'Matt Orr',
      fromNumber: '+19106128283',
      propertyAddress: '914 South Lumina Ave, Wrightsville Beach, NC',
      transcript: 'Matt: Hi Nora, I have a new luxury listing at 914 South Lumina Ave. We need an 8.5x11 flyer, a yard sign post installed by Coastal Sign Post, and a 3-slide social story carousel.',
      summary: 'New listing collateral intake: 8.5x11 flyer, yard sign post, social story carousel for 914 South Lumina Ave.'
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);

    expect(result.request).toBeDefined();
    expect(result.request.propertyAddress).toBe('914 South Lumina Ave, Wrightsville Beach, NC');
    expect(result.request.channel).toBe('phone');
    expect(result.tasks.length).toBeGreaterThanOrEqual(3);

    // Verify task categories & statuses
    const flyerTask = result.tasks.find(t => t.title.includes('Flyer'));
    expect(flyerTask).toBeDefined();
    expect(flyerTask?.category).toBe('print');
    expect(flyerTask?.status).toBe('request_received');

    const signTask = result.tasks.find(t => t.title.includes('Sign'));
    expect(signTask).toBeDefined();
    expect(signTask?.category).toBe('signage');
    expect(signTask?.vendorName).toBe('Coastal Sign Post Co.');

    const socialTask = result.tasks.find(t => t.category === 'social' || t.title.includes('Social') || t.title.includes('Story'));
    expect(socialTask).toBeDefined();
    expect(socialTask?.category).toBe('social');

    // Verify request is saved in repository
    const allRequests = getAllCanonicalMarketingRequests();
    const saved = allRequests.find(r => r.id === result.request.id);
    expect(saved).toBeDefined();
  });

  it('2. Follow-up phone call for the same property merges into existing request and adds new deliverables without duplicating', () => {
    const followUpCallPayload = {
      id: 'call_test_lumina_914_followup',
      callerName: 'Matt Orr',
      fromNumber: '+19106128283',
      propertyAddress: '914 South Lumina Ave',
      transcript: 'Matt: Hey Nora, for 914 South Lumina Ave, can we also add a 30s video teaser reel and a Google Slides luxury CMA presentation deck?',
      summary: 'Adding video reel and Google Slides CMA presentation deck to 914 South Lumina Ave.'
    };

    const result = convertCallToCanonicalMarketingRequest(followUpCallPayload);

    expect(result.request).toBeDefined();
    // Should match existing request container
    expect(result.request.propertyAddress).toContain('914 South Lumina Ave');
    expect(result.tasks.length).toBeGreaterThanOrEqual(1);

    const videoTask = result.tasks.find(t => t.title.includes('Video') || t.title.includes('Reel'));
    expect(videoTask).toBeDefined();
    expect(videoTask?.requestId).toBe(result.request.id);

    const slidesTask = result.tasks.find(t => t.title.includes('Google Slides') || t.title.includes('Presentation'));
    expect(slidesTask).toBeDefined();
    expect(slidesTask?.requestId).toBe(result.request.id);

    // Verify request taskIds includes all combined tasks
    const allTasksForReq = getAllCanonicalMarketingTasks().filter(t => t.requestId === result.request.id);
    expect(allTasksForReq.length).toBeGreaterThanOrEqual(4);
  });
});
