/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Autonomous Voice & Chat Contract Auto-Drafter Integration Test Suite
 */

import { describe, it, expect } from 'vitest';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';

describe('Nora Autonomous Voice & Chat Contract Auto-Drafter Suite', () => {
  describe('1. Natural Language Voice & Prompt Intent Routing', () => {
    it('routes "draft a $1.475M offer on 1104 Arboretum with $25k DD" to the Playwright browser auto-drafter', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, draft a $1.475M offer on 1104 Arboretum with $25k DD',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('contracts');
      expect(res?.confidenceScore).toBe(0.99);

      // Verify Spoken Audio & Telemetry Grounding
      expect(res?.spokenAnswer).toContain('Playwright browser agent');
      expect(res?.spokenAnswer).toContain('Deed Book 6412');
      expect(res?.spokenAnswer).toContain('0842');
      expect(res?.spokenAnswer).toContain('5:00 PM EST');
      expect(res?.spokenAnswer).toContain('1,475,000');

      // Verify Display Markdown & Visual Artifacts
      expect(res?.displayResponse).toContain('84% Auto-Verified');
      expect(res?.displayResponse).toContain('Vance Family Living Trust');
      expect(res?.displayResponse).toContain('NC Form 2-T Paragraph 1(j)');

      // Verify Navigation Deep Links & Suggested Actions
      expect(res?.suggestedActions).toBeDefined();
      expect(res?.suggestedActions?.some(a => a.id === 'act_open_workbench')).toBe(true);
      expect(res?.evidenceCard?.deepLinkUrl).toContain('/app/comps?tab=contract_drafter');
    });

    it('routes "prepare exclusive listing agreement for 702 Lumina" to Form 101 synthesis engine', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'Nora, prepare exclusive listing agreement for 702 Lumina',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('contracts');
      expect(res?.displayResponse).toContain('NC Standard Form 101');
      expect(res?.displayResponse).toContain('Total Commission');
      expect(res?.displayResponse).toContain('RPOADS');
    });

    it('applies intelligent luxury market defaults when financial terms are unspecified', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'draft offer on 1104 Arboretum',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.spokenAnswer).toContain('1,250,000');
      expect(res?.displayResponse).toContain('Due Diligence Fee');
      expect(res?.displayResponse).toContain('5:00 PM EST');
    });
  });
});
