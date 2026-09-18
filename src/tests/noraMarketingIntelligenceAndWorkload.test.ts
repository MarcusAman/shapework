import { describe, it, expect } from 'vitest';
import { resolveNoraMarketingQuery } from '../../server/ai/noraMarketingIntelligenceService';
import fs from 'fs';
import path from 'path';

const MOCK_CALLS = [
  {
    id: 'call_a27fe5bdf0e973e9cb5147d04e4',
    callerName: 'Matt Orr (REALTOR®)',
    phone: '+19106128283',
    propertyAddress: '1916 Walcott Avenue, Wilmington NC',
    timestamp: 'Jul 28 · 11:15 AM',
    duration: '1 min 50 sec',
    requestType: 'Marketing Package & Property Website',
    transcript: "Agent: Thanks for calling Ask Nest Ops. What's the listing address?\nUser: Nineteen sixteen Walcott Avenue.\nAgent: What do you need in the package?\nUser: Flyer, website, and open house handouts.",
    aiExtractedDetails: {
      price: '$785,000',
      bedrooms: '4 Beds',
      bathrooms: '3 Baths',
      requiredCollateral: ['Property Website', 'Open House Handouts', 'Print Flyer']
    }
  },
  {
    id: 'call_8eef4da45f12d5650ba802900d2',
    callerName: 'Matt Orr (REALTOR®)',
    phone: '+19106128283',
    propertyAddress: '104 Main Street, Wilmington NC',
    timestamp: 'Jul 29 · 2:10 PM',
    duration: '2 min 38 sec',
    requestType: 'Lead-Based Paint Disclosure & BIC Compliance',
    transcript: "User: Can you text me the signed lead based paint disclosure PDF for 104 Main Street?\nAgent: It's a BIC compliance item. I will route it to Ryan.",
    aiExtractedDetails: {
      price: '$495,000',
      requiredCollateral: ['Lead-Based Paint Disclosure PDF', 'BIC Verification']
    }
  }
];

describe('Nora Cross-Tab Marketing & Workload Intelligence Test Suite', () => {
  it('1. resolveNoraMarketingQuery finds calls by address and returns interactive audio card data', async () => {
    const res = await resolveNoraMarketingQuery({
      query: 'Find the call for 1916 Walcott Ave',
      calls: MOCK_CALLS,
      campaigns: [],
      workItems: []
    });

    expect(res.intent).toBe('call_lookup');
    expect(res.matchedCalls).toBeDefined();
    expect(res.matchedCalls!.length).toBeGreaterThan(0);
    expect(res.matchedCalls![0].propertyAddress).toContain('1916 Walcott');
    expect(res.matchedCalls![0].callerName).toContain('Matt Orr');
    expect(res.matchedCalls![0].requestedCollateral).toContain('Property Website');

    // Next steps generated
    expect(res.suggestedNextSteps.length).toBeGreaterThan(0);
    expect(res.suggestedNextSteps.some(s => s.actionType === 'assign_va')).toBe(true);
    expect(res.suggestedNextSteps.some(s => s.actionType === 'open_transcript')).toBe(true);
  });

  it('2. resolveNoraMarketingQuery audits Eduardo (VA) open tasks and provides Gemini next steps', async () => {
    const res = await resolveNoraMarketingQuery({
      query: 'How many open tasks does the virtual assistant have?',
      calls: MOCK_CALLS,
      campaigns: [],
      workItems: []
    });

    expect(res.intent).toBe('workload_audit');
    expect(res.workloadSummary).toBeDefined();
    expect(res.workloadSummary!.personName).toContain('Eduardo');
    expect(res.workloadSummary!.openTaskCount).toBe(4);
    expect(res.workloadSummary!.countsByStatus.inProduction).toBe(2);
    expect(res.workloadSummary!.countsByStatus.proofSubmitted).toBe(1);
    expect(res.workloadSummary!.countsByStatus.completed).toBe(1);

    // Verifies listing tasks present
    const tasks = res.workloadSummary!.tasks;
    expect(tasks.some(t => t.propertyAddress.includes('1104 Arboretum'))).toBe(true);
    expect(tasks.some(t => t.propertyAddress.includes('304 Ocean'))).toBe(true);
    expect(tasks.some(t => t.propertyAddress.includes('990 Inspiration'))).toBe(true);
    expect(tasks.some(t => t.propertyAddress.includes('312 Mayfaire'))).toBe(true);
  });

  it('3. resolveNoraMarketingQuery audits Melissa, Ann, and Ryan department workloads', async () => {
    // Melissa
    const melissaRes = await resolveNoraMarketingQuery({
      query: "What is on Melissa's plate today?",
      calls: MOCK_CALLS,
      campaigns: [],
      workItems: []
    });
    expect(melissaRes.workloadSummary!.personName).toContain('Melissa');

    // Ann (Sign Post Lead)
    const annRes = await resolveNoraMarketingQuery({
      query: "Show me Ann's open sign post tickets",
      calls: MOCK_CALLS,
      campaigns: [],
      workItems: []
    });
    expect(annRes.workloadSummary!.personName).toContain('Ann');
    expect(annRes.workloadSummary!.department).toContain('Sign');

    // Ryan (BIC Compliance)
    const ryanRes = await resolveNoraMarketingQuery({
      query: "Report compliance hold items for Ryan",
      calls: MOCK_CALLS,
      campaigns: [],
      workItems: []
    });
    expect(ryanRes.workloadSummary!.personName).toContain('Ryan');
    expect(ryanRes.workloadSummary!.department).toContain('Compliance');
  });

  it('4. NoraMarketingCopilotDrawer and Nora service contain strictly ZERO sparkles icons', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/marketing/NoraMarketingCopilotDrawer.tsx');
    const drawerContent = fs.readFileSync(drawerPath, 'utf-8');

    expect(drawerContent).not.toContain('<Sparkles');
    expect(drawerContent).not.toContain('<SparklesIcon');

    const servicePath = path.resolve(process.cwd(), 'server/ai/noraMarketingIntelligenceService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');
    expect(serviceContent).not.toContain('sparkles');
  });
});
