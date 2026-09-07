/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Transcript-Driven Task Naming, Property Address & Channel Badges
 */

import { describe, it, expect } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Transcript-Driven Task Naming & Channel Badges Suite', () => {
  it('1. Extracts exact deliverable "Open House Flyer & Information Sheet" and property address from Matt Orr call transcript', () => {
    const callData = {
      id: `call_test_matt_open_house_${Date.now()}`,
      from_number: '+12527170595',
      agentName: 'Matt Orr (REALTOR®)',
      callerName: 'Matt Orr (REALTOR®)',
      transcript: 'Matt: Hey Nora, can you get some help with an open house flyer and information sheet for an upcoming open house at 1104 S Live Oak Pkwy?',
      call_analysis: {
        call_summary: 'Matt Orr requesting open house flyer and information sheet for 1104 S Live Oak Pkwy.'
      }
    };

    const result = convertCallToCanonicalMarketingRequest(callData);

    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);

    const task = result.tasks[0];
    // Must be exact spoken deliverable, not generic suite
    expect(task.title).toBe('Open House Flyer & Information Sheet');
    expect(task.category).toBe('open_house');
    expect(task.propertyAddress).toContain('1104 S Live Oak Pkwy');
    expect(result.request?.channel).toBe('phone');
  });

  it('2. Extracts yard sign post and custom rider installation from sign call transcript', () => {
    const signCall = {
      id: `call_test_sign_rider_${Date.now()}`,
      from_number: '+12527170595',
      agentName: 'Matt Orr (REALTOR®)',
      transcript: 'Matt: Nora, we need a yard sign post and custom rider installed at 408 Landfall Dr tomorrow.',
      call_analysis: {
        call_summary: 'Matt Orr requesting yard sign post and custom rider installation for 408 Landfall Dr.'
      }
    };

    const result = convertCallToCanonicalMarketingRequest(signCall);

    expect(result.shouldCreate).toBe(true);
    const task = result.tasks[0];
    expect(task.title).toBe('Yard Sign Post & Custom Rider Installation');
    expect(task.category).toBe('signage');
    expect(task.propertyAddress).toContain('408 Landfall Dr');
  });

  it('3. Auto-sanitizes legacy generic tasks on store load', () => {
    const legacyTaskId = `tsk_legacy_test_${Date.now()}`;
    const legacyReqId = `req_legacy_test_${Date.now()}`;

    const req = {
      id: legacyReqId,
      telephonyCallId: 'call_legacy_530236',
      title: '1104 S Live Oak Pkwy, Wilmington NC',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington NC',
      category: 'open_house' as const,
      agentName: 'Matt Orr (REALTOR®)',
      channel: 'phone' as const,
      requestExcerpt: 'Matt Orr called asking for help with an open house flyer and information sheet for 1104 S Live Oak Pkwy.',
      rawExcerpt: 'Matt: Nora, I need an open house flyer and information sheet for 1104 S Live Oak Pkwy.',
      taskIds: [legacyTaskId],
      receivedAt: '1:43 PM · Today',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveCanonicalMarketingRequest(req);

    const legacyTask = {
      id: legacyTaskId,
      requestId: legacyReqId,
      requestTitle: '1104 S Live Oak Pkwy, Wilmington NC',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington NC',
      agentName: 'Matt Orr (REALTOR®)',
      title: 'Open House Flyer & Information Sheet',
      category: 'open_house' as const,
      assignedTo: 'Melissa Gagliardi',
      status: 'request_received' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Inbound call from Matt Orr regarding open house flyer and info sheet.'
    };
    saveCanonicalMarketingTask(legacyTask);

    const retrieved = getCanonicalMarketingTaskById(legacyTaskId);
    expect(retrieved?.title).toBe('Open House Flyer & Information Sheet');
    expect(retrieved?.propertyAddress).toContain('1104 S Live Oak Pkwy');
  });
});
