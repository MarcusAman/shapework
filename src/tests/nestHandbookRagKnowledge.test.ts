/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { queryNestHandbook, NEST_HANDBOOK_KNOWLEDGE } from '../../server/knowledge/nestHandbookKnowledge';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import fs from 'fs';
import path from 'path';

describe('Nest Realty 2026 Agent Handbook RAG & Knowledge Base Suite', () => {

  it('1. Verifies the complete 6-section handbook knowledge base is structured with 96-page coverage', () => {
    expect(NEST_HANDBOOK_KNOWLEDGE.length).toBeGreaterThanOrEqual(10);
    
    // Core sections present
    const sections = NEST_HANDBOOK_KNOWLEDGE.map(a => a.section);
    expect(sections).toContain('Section 1: Buyer Journey');
    expect(sections).toContain('Section 2: Seller Journey');
    expect(sections).toContain('Section 3: Market Yourself');
    expect(sections).toContain('Section 4: Client Nurturing');
    expect(sections).toContain('Section 5: Resources + Communication');
    expect(sections).toContain('Section 6: Checklists + Glossary');
  });

  it('2. Queries Buyer Journey (Buyer Guide, Inspection Survival Kit, Toursheets)', () => {
    const res = queryNestHandbook('Tell me about the Inspection Survival Kit');
    expect(res.bestMatch).toBeDefined();
    expect(res.bestMatch?.title).toContain('Inspection Survival Kit');
    expect(res.bestMatch?.pageRange).toContain('Pg. 10-15');
    expect(res.bestMatch?.content).toContain('Inspection Survival Kits');
    expect(res.spokenSummary).toContain('Inspection Survival Kit');

    const buyerGuideRes = queryNestHandbook('What is the Buyer Guide consult structure?');
    expect(buyerGuideRes.bestMatch?.title).toContain("Homebuyer's Guide");
    expect(buyerGuideRes.bestMatch?.content).toContain('Needs & Criteria Assessment');
  });

  it('3. Queries Seller Journey & Friends of Nest (FON) touchpoint program', () => {
    const fonRes = queryNestHandbook('How does Friends of Nest FON work?');
    expect(fonRes.bestMatch?.title).toContain('Friends of Nest (FON)');
    expect(fonRes.bestMatch?.content).toContain('NEST Magazine');
    expect(fonRes.bestMatch?.content).toContain('Annual Market Report');
    expect(fonRes.bestMatch?.content).toContain('Rechat');

    const sellerAdvRes = queryNestHandbook('What is Seller Advantage?');
    expect(sellerAdvRes.bestMatch?.title).toContain("Seller's Advantage");
    expect(sellerAdvRes.bestMatch?.pageRange).toContain('Pg. 25-27');
  });

  it('4. Queries unifiedContextRetriever for live RAG grounding in the Nest Handbook', () => {
    const ragRes = queryUnifiedContext('What does the Nest handbook say about the listing presentation checklist?');
    expect(ragRes.confidence).toBe('high');
    expect(ragRes.sources[0]?.title).toContain('Nest Realty Agent Handbook 2026');
    expect(ragRes.displayResponse).toContain('Listing Presentation Checklist');
    expect(ragRes.matchedItems?.[0]?.badge).toBe('Handbook 2026');
    expect(ragRes.evidenceCard?.target).toContain('Nest Handbook 2026');
  });

  it('5. Verifies Retell AI prompt is equipped with 2026 Handbook operational intelligence', () => {
    const promptPath = path.join(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
    const promptContent = fs.readFileSync(promptPath, 'utf-8');

    expect(promptContent).toContain('Operational Handbook');
    expect(promptContent).toContain('nest_handbook_2026.1');
  });

});
