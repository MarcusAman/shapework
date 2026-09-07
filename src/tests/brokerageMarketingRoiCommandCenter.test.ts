/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Brokerage Marketing ROI & Lead Conversion Command Center Test Suite
 */

import { describe, it, expect } from 'vitest';
import { getBrokerageMarketingRoiMetrics } from '../../server/persistence/marketingCampaignsRepository.js';
import { MARKET_INTELLIGENCE_SUBTABS, MARKET_INTELLIGENCE_ALIASES } from '../components/market-intelligence/marketIntelligenceSubtabs.js';
import fs from 'fs';
import path from 'path';

describe('Brokerage Marketing ROI & Lead Conversion Command Center Suite', () => {
  describe('1. Financial Metrics & ROAS Calculations', () => {
    it('calculates total marketing investment ($8,450) vs influenced GCI ($184,200) for 21.8x ROAS', () => {
      const data = getBrokerageMarketingRoiMetrics();

      expect(data.executiveSummary.totalMarketingInvestment).toBe(8450);
      expect(data.executiveSummary.influencedCommissionGci).toBe(184200);
      expect(data.executiveSummary.roasMultiplier).toBe(21.8);
      expect(data.executiveSummary.activeListingsMarketed).toBe(6);
      expect(data.executiveSummary.averageSpeedToLeadSeconds).toBeLessThan(12.0);
      expect(data.executiveSummary.noraPreQualificationRatePercent).toBeGreaterThan(75.0);
    });

    it('aggregates omnichannel lead acquisition channels with CPL and showings', () => {
      const data = getBrokerageMarketingRoiMetrics();

      expect(data.leadAcquisitionChannels.length).toBe(5);
      const eddm = data.leadAcquisitionChannels.find(c => c.channel.includes('EDDM'))!;
      expect(eddm.spend).toBe(1850);
      expect(eddm.leadsGenerated).toBe(86);
      expect(eddm.showingsBooked).toBe(24);
      expect(eddm.conversionRatePercent).toBe(14.2);

      const signCalls = data.leadAcquisitionChannels.find(c => c.channel.includes('Smart Riders'))!;
      expect(signCalls.conversionRatePercent).toBe(70.4);
    });

    it('ranks agent production leaderboard with Maxa templates and influenced GCI', () => {
      const data = getBrokerageMarketingRoiMetrics();

      expect(data.agentMarketingLeaderboard.length).toBe(4);
      const topAgent = data.agentMarketingLeaderboard[0];
      expect(topAgent.agentName).toBe('Marcus Aman');
      expect(topAgent.roasMultiplier).toBe(26.3);
      expect(topAgent.gciInfluenced).toBe(112000);
      expect(topAgent.maxaProofsGenerated).toBe(18);
    });
  });

  describe('2. Navigation & Subtabs Routing Configuration', () => {
    it('registers roi subtab with label and secondary badge in MARKET_INTELLIGENCE_SUBTABS', () => {
      const roiTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'roi');
      expect(roiTab).toBeDefined();
      expect(roiTab?.label).toBe('Executive ROI');
      expect(roiTab?.secondaryLabel).toBe('21.8x ROAS');
    });

    it('resolves legacy aliases for roi', () => {
      expect(MARKET_INTELLIGENCE_ALIASES['roi']).toBe('roi');
      expect(MARKET_INTELLIGENCE_ALIASES['marketing-roi']).toBe('roi');
      expect(MARKET_INTELLIGENCE_ALIASES['executive-roi']).toBe('roi');
    });
  });

  describe('3. Frontend Component File Integrity', () => {
    it('verifies BrokerageMarketingRoiCommandCenter.tsx exists and renders executive elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/marketing/BrokerageMarketingRoiCommandCenter.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('Brokerage Marketing ROI & Lead Conversion Command');
      expect(content).toContain('Return On Ad Spend (ROAS)');
      expect(content).toContain('Total Marketing Spend');
      expect(content).toContain('Influenced GCI Pipeline');
      expect(content).toContain('Agent Marketing Adoption & Production Leaderboard');
    });
  });
});
