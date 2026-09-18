import { describe, it, expect } from 'vitest';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { NoraDatabaseGroundingService } from '../../server/ai/noraDatabaseGroundingService';

describe('Nora Live App & Database Grounding Engine Test Suite', () => {
  it('1. Correctly answers "how many open items or requests does our virtual assistant have right now?" with live workload and NO false SOP dump', async () => {
    const userQuery = 'how many open items or requests does our virtual assistant have right now?';

    // Test Grounding Service directly
    const groundedResult = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: userQuery,
      workspaceId: 'ws_wilmington',
      tenantId: 'tenant_nest_uat'
    });

    expect(groundedResult).not.toBeNull();
    expect(groundedResult!.workloadSummary).toBeDefined();
    expect(groundedResult!.workloadSummary.personName).toContain('Eduardo');
    expect(groundedResult!.workloadSummary.openTaskCount).toBe(4);
    expect(groundedResult!.spokenAnswer).toContain('Eduardo Lovo');
    expect(groundedResult!.spokenAnswer).toContain('open items');
    expect(groundedResult!.displayResponse).not.toContain('Open House Signage & Refreshment Protocol');
    expect(groundedResult!.matchedItems).toBeDefined();
    expect(groundedResult!.matchedItems!.length).toBeGreaterThan(0);
    expect(groundedResult!.matchedItems!.some(i => i.type === 'task')).toBe(true);

    // Test unified context retriever (which handles web/voice turns)
    const contextResult = queryUnifiedContext(userQuery, {
      tenantId: 'tenant_nest_uat',
      workspaceId: 'ws_wilmington'
    });

    expect(contextResult.spokenAnswer).toContain('Eduardo Lovo');
    expect(contextResult.displayResponse).toContain('Workload & Production Queue');
    expect(contextResult.displayResponse).not.toContain('Open House Signage & Refreshment Protocol');
    expect(contextResult.matchedItems).toBeDefined();
    expect(contextResult.matchedItems!.some(i => i.title.includes('Arboretum') || i.title.includes('Ocean Blvd') || i.title.includes('Inspiration'))).toBe(true);
  });

  it('2. Correctly audits department workloads for Melissa, Ann, and Ryan', async () => {
    // Melissa (Marketing Director)
    const melissaRes = queryUnifiedContext("What is on Melissa's plate today?");
    expect(melissaRes.spokenAnswer).toContain('Melissa Gagliardi');
    expect(melissaRes.displayResponse).toContain('Melissa Gagliardi');

    // Ann (Operations Lead / Sign Post)
    const annRes = queryUnifiedContext("Show me Ann's open sign post tickets");
    expect(annRes.spokenAnswer).toContain('Ann Gunn');
    expect(annRes.displayResponse).toContain('Ann Gunn');

    // Ryan (BIC Compliance)
    const ryanRes = queryUnifiedContext("What compliance hold items are on Ryan's plate?");
    expect(ryanRes.spokenAnswer).toContain('Ryan Crecelius');
    expect(ryanRes.displayResponse).toContain('Ryan Crecelius');
  });

  it('3. Correctly retrieves open brokerage operational requests with 1-click deep links', async () => {
    const res = await NoraDatabaseGroundingService.executeGetOpenRequestsAndTasks({}, {
      query: 'Show me all open requests across the brokerage',
      workspaceId: 'ws_wilmington',
      tenantId: 'tenant_nest_uat'
    });

    expect(res.spokenAnswer).toContain('open requests');
    expect(res.matchedItems.length).toBeGreaterThanOrEqual(3);
    expect(res.matchedItems.some(i => i.id === 'req_lumina_mktg')).toBe(true);
    expect(res.matchedItems.some(i => i.id === 'req_sign_vendor')).toBe(true);
    expect(res.matchedItems.some(i => i.id === 'req_emd_audit')).toBe(true);
    expect(res.evidenceCard!.deepLinkUrl).toBe('/app/workboard?subtab=requests');
  });

  it('4. Correctly retrieves Form 2-T transaction terms and BIC compliance audits', async () => {
    const res = await NoraDatabaseGroundingService.executeGetTransactionAndContractDetails(
      { propertyAddress: '312 Mayfaire Way' },
      { query: 'What is the purchase price for 312 Mayfaire Way?' }
    );

    expect(res.spokenAnswer).toContain('$725,000');
    expect(res.spokenAnswer).toContain('Due Diligence Fee of $25,000');
    expect(res.spokenAnswer).toContain('Earnest Money Deposit of $15,000');
    expect(res.displayResponse).toContain('David Miller');
    expect(res.displayResponse).toContain('November 15, 2026');
  });

  it('5. Correctly retrieves vendor orders and Supra lockbox fleet inventory', async () => {
    const res = await NoraDatabaseGroundingService.executeGetVendorOrdersAndFleet({}, {
      query: 'What are the open vendor orders and lockboxes?',
      workspaceId: 'ws_wilmington'
    });

    expect(res.spokenAnswer).toContain('Coastal Sign Post');
    expect(res.spokenAnswer).toContain('Supra lockbox');
    expect(res.evidenceCard!.dataPoints!['Battery Health']).toBe('94% Average');
  });

  it('6. Explicit SOP requests still return the official SOP runbook without ambiguity', () => {
    const res = queryUnifiedContext('What is the listing launch protocol?');

    expect(res.spokenAnswer).toContain('Listing Launch');
    expect(res.displayResponse).toContain('Step-by-Step Execution Checklist');
    expect(res.matchedDomain).toBe('sops');
    expect(res.matchedItems!.some(i => i.type === 'sop')).toBe(true);
  });

  it('7. Correctly maps "virtual agent" to Eduardo Lovo (Virtual Assistant) live task queue', async () => {
    const userQuery = 'how many open requests does the virtual agent have right now';

    // Test Grounding Service
    const groundedResult = await NoraDatabaseGroundingService.resolveGroundedQuery({
      query: userQuery,
      workspaceId: 'ws_wilmington',
      tenantId: 'tenant_nest_uat'
    });

    expect(groundedResult).not.toBeNull();
    expect(groundedResult!.workloadSummary).toBeDefined();
    expect(groundedResult!.workloadSummary.personName).toContain('Eduardo');
    expect(groundedResult!.workloadSummary.openTaskCount).toBe(4);
    expect(groundedResult!.spokenAnswer).toContain('Eduardo Lovo');
    expect(groundedResult!.spokenAnswer).toContain('3 open items in the queue');
    expect(groundedResult!.spokenAnswer).toContain('2 actively in production');
    expect(groundedResult!.spokenAnswer).toContain('1 staged for review');
    expect(groundedResult!.displayResponse).toContain('Workload & Production Queue');
    expect(groundedResult!.matchedItems).toBeDefined();
    expect(groundedResult!.matchedItems!.some(i => i.type === 'task')).toBe(true);

    // Test Unified Context Retriever
    const contextResult = queryUnifiedContext(userQuery, {
      tenantId: 'tenant_nest_uat',
      workspaceId: 'ws_wilmington'
    });

    expect(contextResult.spokenAnswer).toContain('Eduardo Lovo');
    expect(contextResult.spokenAnswer).toContain('3 open items in the queue');
    expect(contextResult.spokenAnswer).toContain('2 actively in production');
    expect(contextResult.spokenAnswer).toContain('1 staged for review');
    expect(contextResult.displayResponse).toContain('Workload & Production Queue');
    expect(contextResult.matchedItems).toBeDefined();
    expect(contextResult.matchedItems!.some(i => i.title.includes('Arboretum'))).toBe(true);
  });
});
