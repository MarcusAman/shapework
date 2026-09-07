import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';
import { initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute';

describe('Nora Comparative Listings, Form 2-T Due Diligence & Action Chips Suite', () => {
  const baseState = { ...initialRuntimeState };

  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

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

  describe('1. Multi-Listing Comparative Intelligence & Filter Engine', () => {
    it('handles "compare 1104 Arboretum and 742 Lumina" with side-by-side comparative table', () => {
      const result = processUserUtterance('Compare 1104 Arboretum and 742 Lumina', baseState, 'Ryan');
      expect(result.intentType).toBe('LISTINGS_COMPARATIVE_QUERY');
      expect(result.category).toBe('knowledge_question');
      expect(result.spokenResponse).toContain('742 Lumina Avenue in Wrightsville Beach at $1.95M');
      expect(result.spokenResponse).toContain('1104 Arboretum Drive in Landfall at $1.25M');
      expect(result.displayResponse).toContain('742 Lumina Ave');
      expect(result.displayResponse).toContain('1104 Arboretum Dr');
      expect(result.displayResponse).toContain('| Property Address |');

      // Suggested Action Chips
      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions?.length).toBeGreaterThanOrEqual(3);
      expect(result.suggestedActions?.some(a => a.label.includes('Inspect 1104 Arboretum Proofs'))).toBe(true);
      expect(result.suggestedActions?.some(a => a.label.includes('Launch Maxa for 742 Lumina'))).toBe(true);
    });

    it('handles "Show all properties over $1,000,000 in Landfall or Wrightsville Beach"', () => {
      const result = processUserUtterance('Show all properties over 1M in Landfall', baseState, 'Sarah');
      expect(result.intentType).toBe('LISTINGS_COMPARATIVE_QUERY');
      expect(result.displayResponse).toContain('Top Luxury Tier (>$1.0M)');
      expect(result.displayResponse).toContain('Landfall');
    });

    it('handles "Which listings have proofs ready to review?"', () => {
      const result = processUserUtterance('Which listings have proofs ready for review?', baseState, 'Melissa');
      expect(result.intentType).toBe('LISTINGS_COMPARATIVE_QUERY');
      expect(result.displayResponse).toContain('1104 Arboretum Dr has 3 vector proofs staged');
    });
  });

  describe('2. NC Form 2-T Due Diligence & Escrow Timeline Calculator', () => {
    it('calculates 14-day Due Diligence period with 5:00 PM EST NCREC rule', () => {
      const result = processUserUtterance('When does the 14-day due diligence period end if contract signed today?', baseState, 'Matt');
      expect(result.intentType).toBe('FORM_2T_DUE_DILIGENCE_CALCULATOR');
      expect(result.category).toBe('action_request');
      expect(result.spokenResponse).toContain('5:00 PM Eastern Standard Time');
      expect(result.displayResponse).toContain('Thursday, Sep 3, 2026 at 5:00 PM EST');
      expect(result.displayResponse).toContain('NCREC Rule 58A.0107 (Escrow Trust Account)');
      expect(result.displayResponse).toContain('Time is of the Essence');

      // Suggested Action Chips
      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions?.some(a => a.label.includes('Draft Form 2-T Offer'))).toBe(true);
      expect(result.suggestedActions?.some(a => a.label.includes('Audit Escrow Trust Deposit'))).toBe(true);
    });

    it('handles "due diligence calculator" generic invocation', () => {
      const result = processUserUtterance('Due diligence calculator', baseState, 'Ryan');
      expect(result.intentType).toBe('FORM_2T_DUE_DILIGENCE_CALCULATOR');
      expect(result.displayResponse).toContain('NC Form 2-T Due Diligence & Escrow Timeline Calculator');
    });
  });

  describe('3. Property Lookups 1-Click Interactive Action Chips', () => {
    it('attaches action chips to 1104 Arboretum property query', () => {
      const result = processUserUtterance('What is the status of 1104 Arboretum Dr?', baseState, 'Sarah');
      expect(result.intentType).toBe('MARKETING_PROPERTY_STATUS');
      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions?.some(a => a.label.includes('Launch Maxa Agent'))).toBe(true);
      expect(result.suggestedActions?.some(a => a.label.includes('Inspect 300 DPI Proofs'))).toBe(true);
      expect(result.suggestedActions?.some(a => a.label.includes('Dispatch Coastal Sign Post'))).toBe(true);
      expect(result.suggestedActions?.some(a => a.label.includes('Text Status to Sarah'))).toBe(true);
    });

    it('attaches action chips to 742 Lumina Ave property query', () => {
      const result = processUserUtterance('Check 742 Lumina Ave', baseState, 'Ryan');
      expect(result.intentType).toBe('MARKETING_PROPERTY_STATUS');
      expect(result.suggestedActions?.some(a => a.label.includes('Calculate Due Diligence Schedule'))).toBe(true);
    });
  });

  describe('4. Retell Telephony Tool: POST /api/retell/tools/calculate-due-diligence', () => {
    it('returns exact 5:00 PM Eastern Time Due Diligence schedule for telephony callers', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/calculate-due-diligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveDate: '2026-08-20',
          dueDiligenceDays: 14
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary).toContain('5:00 PM Eastern Time');
      expect(data.schedule.dueDiligenceExpiration).toContain('5:00 PM Eastern Time');
      expect(data.schedule.governingRule).toContain('Time is of the Essence');
    });
  });
});
