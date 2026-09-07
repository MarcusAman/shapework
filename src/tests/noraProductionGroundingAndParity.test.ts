/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Production Grounding, Hybrid Retrieval, Parity & Tenancy Isolation Test Suite
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rawQueryUnifiedContext, UnifiedContextRetriever } from '../../server/knowledge/unifiedContextRetriever.js';
import { sopRepository, canonicalizeWorkspaceId, isWilmingtonWorkspace, CANONICAL_WILMINGTON_WORKSPACE } from '../../server/persistence/sopRepository.js';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService.js';

describe('NORA Production Grounding & Hybrid Retrieval Engine', () => {
  beforeEach(() => {
    // Standard setup
  });

  // 1. Natural Language & Paraphrased SOP Queries
  it('1. Successfully retrieves Listing Launch SOP with natural, paraphrased phrasing', async () => {
    const res = await rawQueryUnifiedContext('Where can I find instructions on how we launch a property to market?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Listing Launch Protocol');
    expect(res.spokenAnswer).toContain('Melissa Gagliardi');
    expect(res.displayResponse).toContain('Listing Launch Protocol');
    expect(res.matchedDomain).toBe('sops');
    expect(res.confidenceScore).toBeGreaterThanOrEqual(50);
    expect(res.sources[0].title).toBe('Listing Launch Protocol');
  });

  // 2. Misspelled Queries / Typo Tolerance
  it('2. Successfully matches Listing Launch Protocol despite typos and misspellings', async () => {
    const res = await rawQueryUnifiedContext('What is the prtokol for listng launch?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Listing Launch Protocol');
    expect(res.matchedDomain).toBe('sops');
    expect(res.sources[0].title).toBe('Listing Launch Protocol');
  });

  // 3. Social Media SOP & Brokerage Name Compliance
  it('3. Answers social media advertisement brokerage naming requirements from SOP-MKT-002', async () => {
    const res = await rawQueryUnifiedContext('Does a social media advertisement need to name the brokerage?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Social Media Reel & Story Campaign Blitz Protocol');
    expect(res.displayResponse).toContain('Nest Realty Wilmington');
  });

  // 4. Nest Handbook RAG: Inspection Survival Kit & Due Diligence
  it('4. Successfully retrieves Inspection Survival Kit guidelines from Nest Handbook', async () => {
    const res = await rawQueryUnifiedContext('What is included in the Nest Inspection Survival Kit for buyers?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Handbook');
    expect(res.spokenAnswer).toContain('Inspection Survival Kit');
    expect(res.displayResponse).toContain('Due Diligence');
  });

  // 5. Nest Handbook RAG: Buyer Consultation Agenda
  it('5. Successfully retrieves Buyer Consultation 4-pillar agenda from Nest Handbook', async () => {
    const res = await rawQueryUnifiedContext('What are the pillars of the initial buyer consultation guide?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Handbook');
    expect(res.spokenAnswer).toContain('Buyer Guide');
    expect(res.displayResponse).toContain('Needs & Criteria Assessment');
  });

  // 6. Multi-Turn Pronoun & Entity Grounding
  it('6. Successfully resolves pronoun follow-up questions using session entity memory', async () => {
    // First turn: Inquire about yard sign posts
    const turn1 = await rawQueryUnifiedContext('Tell me about yard sign posts.');
    expect(turn1.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(turn1.updatedMemory?.activeSop).toBeDefined();

    // Second turn: Follow up with "Who is the lead on that?"
    const turn2 = await rawQueryUnifiedContext('Who is the lead on that?', {
      sessionMemory: turn1.updatedMemory
    });

    expect(turn2.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(turn2.spokenAnswer).toContain('Ann Gunn');
  });

  // 7. Lockbox Protocol (SOP-OPS-003)
  it('7. Successfully retrieves Supra lockbox placement and check-out protocol', async () => {
    const res = await rawQueryUnifiedContext('How do I check out and program a Supra lockbox for a new listing?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Lockbox & Supra eKEY Placement');
    expect(res.spokenAnswer).toContain('Ann Gunn');
    expect(res.displayResponse).toContain('Supra iBox BT LE');
  });

  // 8. Continuing Education & License Renewal (SOP-BIC-004)
  it('8. Answers CE credit and June 10 renewal deadlines from SOP-BIC-004', async () => {
    const res = await rawQueryUnifiedContext('When is the continuing education deadline and license renewal date?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('June 10');
    expect(res.displayResponse).toContain('June 30');
  });

  // 9. Mandatory Property Disclosures (SOP-BIC-003)
  it('9. Grounded on mandatory property disclosures (RPOADS, MOG, Lead-Based Paint)', async () => {
    const res = await rawQueryUnifiedContext('What disclosures must the seller fill out before putting a home on the market?');
    expect(res.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).toContain('Mandatory Property Disclosures Protocol');
    expect(res.displayResponse).toContain('RPOADS');
    expect(res.displayResponse).toContain('MOG');
  });

  // 10. Human/BIC Compliance Block
  it('10. Strictly enforces BIC approval requirement when user asks to bypass compliance', async () => {
    const res = await rawQueryUnifiedContext('Send and finalize this contract without BIC approval');
    expect(res.outcomeCode).toBe('HUMAN_APPROVAL_REQUIRED');
    expect(res.needsEscalation).toBe(true);
    expect(res.spokenAnswer).toContain('Broker-in-Charge approval');
    expect(res.displayResponse).toContain('BIC Compliance Safety Block');
  });

  // 11. No Approved Knowledge Response
  it('11. Returns NO_APPROVED_KNOWLEDGE with invitation to create new SOP when topic is genuinely absent', async () => {
    const res = await rawQueryUnifiedContext('How do we pilot an interstellar rocket ship to Mars?');
    expect(res.outcomeCode).toBe('NO_APPROVED_KNOWLEDGE');
    expect(res.spokenAnswer).toContain("I don't have an approved Nest procedure or established workflow for that yet");
    expect(res.displayResponse).toContain('No Established Workflow Found');
    expect(res.displayResponse).toContain('SOP Studio');
  });

  // 12. Workspace Canonicalization & Aliasing
  it('12. Canonicalizes legacy workspace IDs to ws_wilmington without leaking demo data', () => {
    expect(canonicalizeWorkspaceId('nest-realty-wilmington')).toBe('ws_wilmington');
    expect(canonicalizeWorkspaceId('ws_wilmington')).toBe('ws_wilmington');
    expect(canonicalizeWorkspaceId('tenant_nest')).toBe('ws_wilmington');
    expect(isWilmingtonWorkspace('ws_wilmington')).toBe(true);
    expect(isWilmingtonWorkspace('nest-realty-wilmington')).toBe(true);
    expect(isWilmingtonWorkspace('nest-realty-demo')).toBe(false);
  });

  // 13. Cross-Workspace Access Isolation
  it('13. Strictly prevents nest-realty-demo from querying Wilmington production knowledge', async () => {
    // When querying under isolated demo workspace, production Wilmington drafts are isolated
    const demoSops = sopRepository.listDraftsSync('tenant_demo_isolated', 'nest-realty-demo');
    const wilmSops = demoSops.filter(s => s.workspaceId === CANONICAL_WILMINGTON_WORKSPACE);
    expect(wilmSops.length).toBe(0);
  });

  // 14. Draft SOP Exclusion from Authoritative Answers
  it('14. Never returns unapproved draft SOPs as authoritative policy', async () => {
    // Save an unapproved draft
    await sopRepository.saveDraft({
      id: 'sop_unapproved_secret_draft_099',
      tenantId: 'tenant_nest_uat',
      workspaceId: 'ws_wilmington',
      title: 'Secret Unapproved Draft Policy 99',
      purpose: 'Testing draft exclusion from NORA retrieval.',
      trigger: 'Manual test',
      processOwner: 'Secret Tester',
      participants: [],
      prerequisites: [],
      requiredInputs: [],
      orderedSteps: [{ id: 's1', stepNumber: 1, action: 'Confidential draft action', role: 'Tester' }],
      decisions: [],
      exceptions: [],
      escalationPaths: [],
      completionEvidence: 'None',
      expectedTiming: 'None',
      systemsUsed: [],
      reviewer: 'None',
      publisher: '',
      effectiveDate: '',
      reviewDate: '',
      openQuestions: [],
      status: 'draft',
      author: 'Tester',
      aiAssisted: true,
      transcriptRetention: 'sop_only',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    });

    const res = await rawQueryUnifiedContext('Secret Unapproved Draft Policy 99');
    expect(res.outcomeCode).not.toBe('ANSWER_GROUNDED');
    expect(res.spokenAnswer).not.toContain('Confidential draft action');
  });

  // 15. Real-Time Telephony / Retell Grounding Parity
  it('15. NORA Grounding Service resolves Rechat Deals for 1104 S Live Oak Pkwy', async () => {
    const res = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: 'What is the settlement date and closing milestone for 1104 S Live Oak Pkwy?'
    });

    expect(res).toBeDefined();
    expect(res?.success).toBe(true);
    expect(res?.spokenAnswer).toContain('September 18, 2026');
    expect(res?.displayResponse).toContain('1104 S Live Oak Pkwy');
  });

  // 16. Fast-Path Conversational Controls
  it('16. Answers greetings, mic checks, and navigation instantly with ANSWER_GROUNDED', async () => {
    const helloRes = await rawQueryUnifiedContext('Hello');
    expect(helloRes.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(helloRes.spokenAnswer).toContain('Hello! I am NORA');

    const micRes = await rawQueryUnifiedContext('Can you hear me?');
    expect(micRes.outcomeCode).toBe('ANSWER_GROUNDED');
    expect(micRes.spokenAnswer).toContain('Loud and clear');
  });
});
