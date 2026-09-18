/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Inbound Call to Tasks Table Sync & Domain Categorization Test Suite
 * Validates that:
 * 1. Incoming voice telephony calls push to the canonical requests table.
 * 2. Generated child tasks are correctly classified as Marketing vs. Operational.
 * 3. Updates to existing property requests merge cleanly into the Tasks table dataset.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository';
import { isMarketingTask, isOperationalTask } from '../../src/components/marketing/MarketingHomeInbox';

describe('Inbound Call to Tasks Table Sync Suite', () => {
  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  it('1. Ingests inbound marketing call and pushes new entry to requests table with child marketing tasks', () => {
    const inboundMarketingCall = {
      callId: 'call_test_mkt_101',
      callerName: 'Sarah Jenkins',
      callerRole: 'Listing Specialist',
      fromNumber: '+19105550199',
      summary: 'Sarah needs a double-sided print flyer and social media story for 204 Pelican Point.',
      transcript: 'Hi Nora, please prepare a double-sided 8.5x11 flyer and an Instagram story package for 204 Pelican Point Rd. Open house is this weekend.',
      timestamp: new Date().toISOString()
    };

    // 1. Process inbound phone call
    const syncResult = convertCallToCanonicalMarketingRequest(inboundMarketingCall);
    expect(syncResult.shouldCreate).toBe(true);
    expect(syncResult.request).toBeDefined();

    // 2. Verify Request in Canonical Requests Table
    const allRequests = getAllCanonicalMarketingRequests();
    const matchingReq = allRequests.find(r => r.propertyAddress.includes('204 Pelican Point') || r.id === syncResult.request?.id);
    expect(matchingReq).toBeDefined();
    expect(matchingReq?.agentName).toBe('Sarah Jenkins');
    expect(matchingReq?.channel).toBe('phone');

    // 3. Verify Child Tasks in Canonical Tasks Table
    const allTasks = getAllCanonicalMarketingTasks();
    const propertyTasks = allTasks.filter(t => t.propertyAddress?.includes('204 Pelican Point') || t.requestId === syncResult.request?.id);
    expect(propertyTasks.length).toBeGreaterThanOrEqual(1);

    // 4. Verify Marketing Categorization
    const flyerTask = propertyTasks[0];
    expect(isMarketingTask(flyerTask)).toBe(true);
    expect(isOperationalTask(flyerTask)).toBe(false);
  });

  it('2. Ingests inbound operational call (Sign Post Dispatch) and classifies as Operational Task', () => {
    const inboundOpsCall = {
      callId: 'call_test_ops_202',
      callerName: 'Eric Miller',
      callerRole: 'Broker Associate',
      fromNumber: '+19105550244',
      propertyAddress: '105 Forest Hills Dr',
      summary: 'Install yard sign post and custom rider at 105 Forest Hills Dr.',
      transcript: 'Nora, dispatch Coastal Sign Post to install the luxury wood post and agent rider for 105 Forest Hills Dr before Friday.',
      timestamp: new Date().toISOString()
    };

    // 1. Process inbound operational phone call
    const syncResult = convertCallToCanonicalMarketingRequest(inboundOpsCall);
    expect(syncResult.shouldCreate).toBe(true);

    // 2. Verify Request in Canonical Requests Table
    const allRequests = getAllCanonicalMarketingRequests();
    const opsReq = allRequests.find(r => r.propertyAddress.includes('105 Forest Hills Dr'));
    expect(opsReq).toBeDefined();

    // 3. Verify Operational Task in Tasks Table
    const allTasks = getAllCanonicalMarketingTasks();
    const opsTasks = allTasks.filter(t => t.propertyAddress?.includes('105 Forest Hills Dr'));
    expect(opsTasks.length).toBeGreaterThanOrEqual(1);

    const signTask = opsTasks.find(t => t.category === 'signage' || t.title.toLowerCase().includes('sign'));
    expect(signTask).toBeDefined();
    if (signTask) {
      expect(isOperationalTask(signTask)).toBe(true);
      expect(isMarketingTask(signTask)).toBe(false);
    }
  });

  it('3. Merges follow-up phone call updates into existing property request container', () => {
    const initialCall = {
      callId: 'call_initial_303',
      callerName: 'Sarah Jenkins',
      propertyAddress: '820 Soundview Dr',
      summary: 'Flyer for 820 Soundview Dr',
      transcript: 'Flyer for 820 Soundview Dr',
      timestamp: new Date().toISOString()
    };
    convertCallToCanonicalMarketingRequest(initialCall);

    const initialRequestsCount = getAllCanonicalMarketingRequests().length;

    // Follow-up call for same property
    const followUpCall = {
      callId: 'call_followup_304',
      callerName: 'Sarah Jenkins',
      propertyAddress: '820 Soundview Dr',
      summary: 'Add direct mail postcard for 820 Soundview Dr',
      transcript: 'Nora, also add a 6x9 direct mail postcard for 820 Soundview Dr.',
      timestamp: new Date().toISOString()
    };
    const followUpResult = convertCallToCanonicalMarketingRequest(followUpCall);

    // Request count should remain identical (merged into same property container)
    const afterRequests = getAllCanonicalMarketingRequests();
    expect(afterRequests.length).toBe(initialRequestsCount);

    const soundviewReq = afterRequests.find(r => r.propertyAddress.includes('820 Soundview Dr'));
    expect(soundviewReq).toBeDefined();
    expect(soundviewReq?.requestExcerpt).toContain('Phone Update');
  });
});
