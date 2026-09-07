/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Row Clickability, 212 Wetland Drive Caller Attribution & Auto-Sync
 */

import { describe, it, expect } from 'vitest';
import {
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  getCanonicalMarketingTaskById
} from '../../server/persistence/marketingCampaignsRepository.js';
import { syncNoraEmailInbox } from '../../server/integrations/google/noraEmailIntakeService.js';

describe('Row Clickability & Caller Attribution Suite', () => {
  it('1. Correctly attributes 212 Wetland Drive call to Marcus Aman and Ann Gunn (Signage Pickup)', () => {
    const marcusCall = {
      id: `call_test_marcus_${Date.now()}`,
      from_number: '+19105072047',
      transcript: "Agent: Thanks for calling Ask Nest Ops. What do you need help with?\nUser: yeah, I need a sign writer for a house next Friday at 212 Wetland Drive, Wilmington NC.\nAgent: And who should I list as the requesting agent?\nUser: Um, Marcus.\nAgent: Okay, Marcus. Do you need it picked up?\nUser: I'll pick it up whenever it's ready.\nAgent: Routing it to Ann...",
      call_analysis: {
        call_summary: 'Marcus requested yard sign rider pickup for 212 Wetland Drive, routed to Ann.'
      }
    };

    const result = convertCallToCanonicalMarketingRequest(marcusCall);

    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);

    const task = result.tasks[0];
    expect(task.agentName).toContain('Marcus Aman');
    expect(task.title).toContain('Yard Sign');
    expect(task.title).toContain('Pickup');
    expect(task.category).toBe('signage');
    expect(task.assignedTo).toBe('Ann Gunn');
    expect(task.propertyAddress).toContain('212 Wetland Drive');
  });

  it('2. Synchronizes Nora Email Inbox without errors', async () => {
    const result = await syncNoraEmailInbox();
    expect(result).toBeDefined();
    expect(result.syncedCount).toBeGreaterThanOrEqual(0);
  });

  it('3. Verifies active canonical store records for 212 Wetland Drive are attributed to Marcus Aman', () => {
    const allTasks = getAllCanonicalMarketingTasks();
    const wetlandTasks = allTasks.filter(t => t.propertyAddress && t.propertyAddress.includes('212 Wetland Drive') && t.category === 'signage');

    expect(wetlandTasks.length).toBeGreaterThan(0);
    for (const t of wetlandTasks) {
      expect(t.agentName).toContain('Marcus Aman');
      expect(t.category).toBe('signage');
      expect(t.assignedTo).toBe('Ann Gunn');
    }
  });
});
