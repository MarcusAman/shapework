import { describe, it, expect } from 'vitest';
import { queryUnifiedContext, SessionEntityMemory } from '../../server/knowledge/unifiedContextRetriever';

describe('NORA Multi-Turn Conversational Memory & Contextual Slot Filling Suite', () => {
  const tenantId = 'tenant_nest_uat';
  const workspaceId = 'ws_wilmington';

  it('Turn 1 -> Turn 2: Initial contract offer drafting followed by relative Due Diligence fee adjustment', () => {
    let memory: SessionEntityMemory = {};

    // Turn 1: Draft initial offer for 312 Mayfaire Way
    const turn1 = queryUnifiedContext('Draft an offer on 312 Mayfaire Way for David Miller at 725k', {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn1.matchedDomain).toBe('contracts');
    expect(turn1.spokenAnswer).toContain('Drafted NC REALTORS Form 2-T offer for 312 Mayfaire Way');
    expect(turn1.updatedMemory).toBeDefined();
    expect(turn1.updatedMemory?.activeContract?.price).toBe(725000);
    expect(turn1.updatedMemory?.activeContract?.ddFee).toBe(15000);

    // Save memory for Turn 2
    memory = turn1.updatedMemory!;

    // Turn 2: Relative modification without repeating property address
    const turn2 = queryUnifiedContext('Change Due Diligence to 25,000 dollars', {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn2.matchedDomain).toBe('contracts');
    expect(turn2.spokenAnswer).toContain('Updated 312 Mayfaire Way: Due Diligence fee is now 25,000 dollars');
    expect(turn2.spokenAnswer).toContain('3.45%');
    expect(turn2.updatedMemory?.activeContract?.ddFee).toBe(25000);
    expect(turn2.updatedMemory?.activeContract?.price).toBe(725000);
    expect(turn2.updatedMemory?.activeContract?.address).toContain('312 Mayfaire Way');

    // Save memory for Turn 3
    memory = turn2.updatedMemory!;

    // Turn 3: Relative modification to closing/settlement date
    const turn3 = queryUnifiedContext('Set settlement date to November 15', {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn3.matchedDomain).toBe('contracts');
    expect(turn3.updatedMemory?.activeContract?.settlementDate).toBe('November 15, 2026');
  });

  it('Turn 1 -> Turn 2: Query SOP followed by step-by-step navigation', () => {
    let memory: SessionEntityMemory = {};

    // Turn 1: Query listing launch SOP
    const turn1 = queryUnifiedContext("Where is the listing launch SOP?", {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn1.matchedDomain).toBe('sops');
    expect(turn1.updatedMemory?.activeSop).toBeDefined();
    expect(turn1.updatedMemory?.activeSop?.title).toContain('Listing Launch Protocol');

    memory = turn1.updatedMemory!;

    // Turn 2: Query step 2 without repeating SOP title
    const turn2 = queryUnifiedContext('What is step 2?', {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn2.matchedDomain).toBe('sops');
    expect(turn2.spokenAnswer).toContain('Step 2 of Listing Launch Protocol is:');
    expect(turn2.displayResponse).toContain('Step 2 — Listing Launch Protocol');
    expect(turn2.evidenceCard?.deepLinkUrl).toContain('/app/ask-nest-ops?tab=sops&sopId=sop_listing_launch_001');
  });

  it('Turn 1 -> Turn 2: Query team member followed by relative contact info lookup', () => {
    let memory: SessionEntityMemory = {};

    // Turn 1: Query Ryan Crecelius
    const turn1 = queryUnifiedContext('Who is Ryan Crecelius?', {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn1.matchedDomain).toBe('roster');
    expect(turn1.updatedMemory?.activePerson?.name).toBe('Ryan Crecelius');
    expect(turn1.updatedMemory?.activePerson?.phone).toBeDefined();

    memory = turn1.updatedMemory!;

    // Turn 2: Ask for phone number using relative pronoun
    const turn2 = queryUnifiedContext("What's his phone number?", {
      tenantId,
      workspaceId,
      sessionMemory: memory
    });

    expect(turn2.matchedDomain).toBe('roster');
    expect(turn2.spokenAnswer).toContain('Here is the contact information for Ryan Crecelius: Phone number is');
    expect(turn2.evidenceCard?.title).toContain('Contact Details — Ryan Crecelius');
  });
});
