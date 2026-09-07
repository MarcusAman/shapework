import { describe, it, expect } from 'vitest';
import { NoraBrowserAgentService } from '../../server/services/noraBrowserAgentService.js';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter.js';

describe('Nora Autonomous Virtual Machine Browser Agent Suite', () => {

  describe('1. Sandbox VM Dispatch & Execution Stages', () => {
    it('successfully boots Chromium sandbox VM and completes all 5 execution stages', async () => {
      const session = await NoraBrowserAgentService.dispatchResearch({
        query: 'NCREC Rule 58A earnest money and due diligence requirements'
      });

      expect(session.sessionId).toMatch(/^vm_nora_/);
      expect(session.status).toBe('completed');
      expect(session.progressPercent).toBe(100);
      expect(session.steps.length).toBe(5);
      expect(session.steps.map(s => s.stage)).toEqual(['boot', 'navigate', 'dom_inspect', 'extract', 'synthesize']);
      expect(session.citations.length).toBeGreaterThan(0);
      expect(session.groundedAnswer).toContain('NCREC Rule 58A');
    });

    it('retrieves stored research session by session ID', async () => {
      const session = await NoraBrowserAgentService.dispatchResearch({
        query: 'Cape Fear MLS Wilmington NC median price'
      });

      const fetched = NoraBrowserAgentService.getSession(session.sessionId);
      expect(fetched).not.toBeNull();
      expect(fetched?.sessionId).toBe(session.sessionId);
      expect(fetched?.targetDomain).toBe('mls_market');
    });
  });

  describe('2. Grounded Regulatory & County GIS Research', () => {
    it('executes NCREC regulatory research and extracts Rule 58A & Form 2-T facts with >98% authority score', async () => {
      const session = await NoraBrowserAgentService.dispatchResearch({
        query: 'What are the rules for due diligence and earnest money in North Carolina?'
      });

      expect(session.targetDomain).toBe('ncrec');
      expect(session.pageTitle).toContain('NC Real Estate Commission');
      expect(session.groundedAnswer).toContain('3 banking days');
      expect(session.citations[0].authorityScore).toBeGreaterThanOrEqual(98.0);
      expect(session.screenshotState.extractedKeyFacts.length).toBeGreaterThan(0);
    });

    it('executes New Hanover County GIS research and extracts certified tax assessments and flood maps', async () => {
      const session = await NoraBrowserAgentService.dispatchResearch({
        query: 'Look up New Hanover County GIS parcel tax and FEMA flood zone'
      });

      expect(session.targetDomain).toBe('county_gis');
      expect(session.pageTitle).toContain('New Hanover County GIS');
      expect(session.groundedAnswer).toContain('New Hanover County GIS & Land Records');
      expect(session.citations[0].domain).toBe('nhcgov.com');
      expect(session.citations[0].authorityScore).toBeGreaterThanOrEqual(99.0);
    });

    it('executes Cape Fear MLS market statistics research and extracts median prices', async () => {
      const session = await NoraBrowserAgentService.dispatchResearch({
        query: 'Wilmington NC real estate market comps and average days on market'
      });

      expect(session.targetDomain).toBe('mls_market');
      expect(session.groundedAnswer).toContain('$435,000');
      expect(session.screenshotState.extractedKeyFacts.some(f => f.label.includes('Wilmington'))).toBe(true);
    });
  });

  describe('3. Transcript Intent Router & Conversational Web Research Classification', () => {
    it('classifies "search the web for NCREC rules" as WEB_RESEARCH_BROWSER_VM', () => {
      const result = processUserUtterance('search the web for NCREC earnest money rules', {
        userName: 'Ryan Crecelius'
      } as any);

      expect(result.intentType).toBe('WEB_RESEARCH_BROWSER_VM');
      expect(result.category).toBe('action_request');
      expect(result.spokenResponse).toContain('Chromium virtual machine sandbox');
      expect(result.displayResponse).toContain('Verified via Nora Virtual Machine Browser Agent');
      expect(result.webResearchQuery).toContain('ncrec earnest money rules');
    });

    it('classifies "look up tax parcel in new hanover gis" as WEB_RESEARCH_BROWSER_VM', () => {
      const result = processUserUtterance('look up tax parcel in new hanover gis', {
        userName: 'Ryan Crecelius'
      } as any);

      expect(result.intentType).toBe('WEB_RESEARCH_BROWSER_VM');
      expect(result.webResearchQuery).toContain('tax parcel in new hanover gis');
    });
  });

});
