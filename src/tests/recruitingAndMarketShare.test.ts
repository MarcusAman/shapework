/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MLS Market Share & Luxury Agent Recruiting Command Center Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { RecruitingAndMarketShareRepository } from '../../server/persistence/recruitingAndMarketShareRepository.js';
import { recruitingRouter } from '../../server/routes/recruitingAndMarketShareRoute.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';
import fs from 'fs';
import path from 'path';

describe('MLS Market Share & Luxury Agent Recruiting Suite', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/recruiting', recruitingRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Repository Market Share & Producer Radar Logic', () => {
    it('returns Cape Fear MLS rankings with Nest Realty market share and luxury metrics', () => {
      const rankings = RecruitingAndMarketShareRepository.getMarketShareRankings();
      expect(rankings.length).toBeGreaterThanOrEqual(4);

      const nest = rankings.find(r => r.isNestRealty);
      expect(nest).toBeDefined();
      expect(nest?.closedVolume12Mo).toBe(142500000);
      expect(nest?.marketSharePercent).toBe(8.4);
      expect(nest?.avgSalePrice).toBe(945000);
    });

    it('retrieves competitor luxury producer candidates with transition readiness scores', () => {
      const candidates = RecruitingAndMarketShareRepository.getCandidates();
      expect(candidates.length).toBeGreaterThanOrEqual(4);

      const sarah = candidates.find(c => c.id === 'cand_sarah_jenkins');
      expect(sarah).toBeDefined();
      expect(sarah?.annualClosedVolume).toBe(24500000);
      expect(sarah?.transitionReadinessScore).toBe(92);
      expect(sarah?.currentEstimatedSplit).toContain('70/30');
    });

    it('calculates financial take-home increase at Nest Realty ($18k cap + zero franchise fees)', () => {
      const savings = RecruitingAndMarketShareRepository.calculateRecruitingSavings('cand_sarah_jenkins');
      expect(savings).toBeDefined();
      expect(savings?.grossCommissionIncome).toBeGreaterThan(600000);
      expect(savings?.nestRealtyTakeHome).toBeGreaterThan(savings?.currentBrokerageTakeHome || 0);
      expect(savings?.totalAnnualFinancialGain).toBeGreaterThan(50000);
      expect(savings?.marketingSavingsWithNestVA).toBe(28000);
    });

    it('generates customized Nora recruiting outreach letter and phone call script', () => {
      const pitch = RecruitingAndMarketShareRepository.generateRecruitingPitch('cand_sarah_jenkins');
      expect(pitch).toBeDefined();
      expect(pitch?.subjectLine).toContain('Confidential note from Ryan Crecelius');
      expect(pitch?.emailBody).toContain('Sarah');
      expect(pitch?.emailBody).toContain('$24.5M');
      expect(pitch?.phoneScript).toContain('Ryan Crecelius from Nest Realty');
    });

    it('updates candidate pipeline status and appends owner contact notes', () => {
      const updated = RecruitingAndMarketShareRepository.updateCandidateStatus(
        'cand_sarah_jenkins',
        'offer_extended',
        'Extended formal $18k cap agreement after lunch at Drift.'
      );
      expect(updated).toBeDefined();
      expect(updated?.pipelineStatus).toBe('offer_extended');
      expect(updated?.notes?.[0]).toContain('Extended formal $18k cap agreement');
    });
  });

  describe('2. REST API Routes Integration', () => {
    it('GET /api/recruiting/market-share returns rankings', async () => {
      const res = await fetch(`${baseUrl}/api/recruiting/market-share`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.rankings.length).toBeGreaterThanOrEqual(4);
    });

    it('GET /api/recruiting/candidates returns candidates with filtering', async () => {
      const res = await fetch(`${baseUrl}/api/recruiting/candidates?brokerage=Sotheby`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.candidates.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/recruiting/candidates/:id/generate-pitch generates pitch payload', async () => {
      const res = await fetch(`${baseUrl}/api/recruiting/candidates/cand_carter_vance/generate-pitch`, {
        method: 'POST'
      });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.pitch.emailBody).toContain('Carter');
      expect(body.pitch.financialGainSummary).toContain('$');
    });
  });

  describe('3. Nora Omnichannel Grounding for Recruiting & Market Share', () => {
    it('routes "Nora, generate a recruiting pitch for Sarah Jenkins at Sotheby\'s" to recruiting tool', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: "Nora, generate a recruiting pitch for Sarah Jenkins at Sotheby's",
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('recruiting');
      expect(res?.spokenAnswer).toContain('Sarah Jenkins');
      expect(res?.spokenAnswer).toContain('24.5M');
      expect(res?.displayResponse).toContain('Competitor Agent Intelligence');
      expect(res?.displayResponse).toContain('Nest Realty Take-Home');
      expect(res?.suggestedActions?.[0].targetUrl).toBe('/app/recruiting');
    });

    it('routes "What is our market share compared to Intracoastal?" to market share overview', async () => {
      const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
        query: 'What is our market share compared to Intracoastal?',
        workspaceId: 'ws_wilmington',
        tenantId: 'tenant_nest_uat'
      });

      expect(res).toBeDefined();
      expect(res?.success).toBe(true);
      expect(res?.matchedDomain).toBe('recruiting');
      expect(res?.spokenAnswer).toContain('8.4%');
      expect(res?.spokenAnswer).toContain('142.5M');
      expect(res?.displayResponse).toContain('Cape Fear MLS Market Share');
    });
  });

  describe('4. Frontend UI Component File Integrity', () => {
    it('verifies RecruitingAndMarketShareCommandCenter.tsx exists and renders key elements', () => {
      const viewPath = path.resolve(process.cwd(), 'src/components/recruiting/RecruitingAndMarketShareCommandCenter.tsx');
      expect(fs.existsSync(viewPath)).toBe(true);

      const content = fs.readFileSync(viewPath, 'utf-8');
      expect(content).toContain('MLS Market Share & Luxury Producer Recruiting Radar');
      expect(content).toContain('Cape Fear MLS Brokerage Market Share Rankings');
      expect(content).toContain('High-Priority Luxury Competitor Producer Radar');
      expect(content).toContain('Nora Tailored Outreach Letter');
    });
  });
});
