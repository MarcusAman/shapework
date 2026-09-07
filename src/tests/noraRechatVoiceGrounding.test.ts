/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Rechat MCP Real-Time Voice Grounding Test Suite
 */

import { describe, it, expect } from 'vitest';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService';

describe('Nora Real-Time Voice Grounding via Rechat MCP Suite', () => {
  it('1. Grounds MLS listing queries and generates spoken audio answer for 1104 S Live Oak Pkwy', async () => {
    const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'What is the listing price and specs for 1104 S Live Oak Pkwy?'
    });

    expect(res).toBeDefined();
    expect(res?.success).toBe(true);
    expect(res?.spokenAnswer).toContain('Rechat MLS');
    expect(res?.spokenAnswer).toContain('$849,000');
    expect(res?.spokenAnswer).toContain('4 bedrooms');
    expect(res?.spokenAnswer).toContain('3,150 square feet');
    expect(res?.spokenAnswer).toContain('Matt Orr');
    expect(res?.toolsUsed).toContain('rechat_query_live_mls_and_property_specs');
  });

  it('2. Grounds MLS listing queries for 212 Wetland Drive (Marcus Aman)', async () => {
    const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Tell me the specifications for 212 Wetland Drive'
    });

    expect(res).toBeDefined();
    expect(res?.success).toBe(true);
    expect(res?.spokenAnswer).toContain('$625,000');
    expect(res?.spokenAnswer).toContain('Marcus Aman');
  });

  it('3. Grounds Deal and transaction milestone queries with closing dates', async () => {
    const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'When is the closing date for the 1104 S Live Oak Pkwy transaction?'
    });

    expect(res).toBeDefined();
    expect(res?.success).toBe(true);
    expect(res?.spokenAnswer).toContain('September 18, 2026');
    expect(res?.spokenAnswer).toContain('Due Diligence');
    expect(res?.toolsUsed).toContain('rechat_query_deals_and_closing_milestones');
  });

  it('4. Grounds People Center CRM contact lookups for Matt Orr', async () => {
    const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'Look up Matt Orr in Rechat People Center'
    });

    expect(res).toBeDefined();
    expect(res?.success).toBe(true);
    expect(res?.spokenAnswer).toContain('matt.orr@nestrealty.com');
    expect(res?.toolsUsed).toContain('rechat_query_people_center_and_contacts');
  });
});
