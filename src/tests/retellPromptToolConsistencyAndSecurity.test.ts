import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute';
import { identifyCaller } from '../../server/services/callerIdentificationService';

describe('Retell Voice Agent Prompt, Tool Consistency & Security Test Suite', () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(() => {
    if (server) server.close();
  });

  it('1. Canonical Prompt and Sync Script use identical tool name: lookup_open_tasks_by_property', () => {
    const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
    const promptContent = fs.readFileSync(promptPath, 'utf8');

    const syncScriptPath = path.resolve(process.cwd(), 'scripts/sync_retell_nora_voice_agent.cjs');
    const syncScriptContent = fs.readFileSync(syncScriptPath, 'utf8');

    // Both must define lookup_open_tasks_by_property
    expect(promptContent).toContain('lookup_open_tasks_by_property');
    expect(syncScriptContent).toContain("'lookup_open_tasks_by_property'");
    expect(syncScriptContent).not.toContain("name: 'lookup_open_tasks',");
  });

  it('2. Default Begin Message is strictly canonical failure-safe greeting', () => {
    const syncScriptPath = path.resolve(process.cwd(), 'scripts/sync_retell_nora_voice_agent.cjs');
    const syncScriptContent = fs.readFileSync(syncScriptPath, 'utf8');

    const expectedGreeting = "Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. May I ask who’s calling?";
    expect(syncScriptContent).toContain(expectedGreeting);
    expect(syncScriptContent).not.toContain("Hey there! Thanks for calling Ask Nest Ops");
  });

  it('3. Inbound Webhook dynamically overrides greeting for recognized caller', async () => {
    // Recognize Matt Orr (+19106128283)
    const matchedResult = await identifyCaller({
      fromNumber: '+19106128283',
      toNumber: '+19105072047',
      workspaceId: 'ws_wilmington'
    });

    expect(matchedResult.caller_match_status).toBe('matched');
    expect(matchedResult.caller_first_name).toBe('Matt');
    expect(matchedResult.opening_greeting).toBe("Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. Is this Matt?");

    // Unmatched unknown caller
    const unknownResult = await identifyCaller({
      fromNumber: '+19195559999',
      toNumber: '+19105072047',
      workspaceId: 'ws_wilmington'
    });

    expect(unknownResult.caller_match_status).toBe('unknown');
    expect(unknownResult.opening_greeting).toBe("Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. May I ask who’s calling?");
  });

  it('4. calculate_due_diligence enforces explicit contract inputs and disclaims legal advice / fee estimation', async () => {
    // Valid calculation
    const res = await fetch(`${baseUrl}/api/retell/tools/calculate-due-diligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effectiveDate: '2026-09-08',
        dueDiligenceDays: 20
      })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.schedule.dueDiligenceExpiration).toContain('5:00 PM Eastern Time');
    expect(data.summary).toContain('Due diligence fees and terms are negotiated between the parties');
    expect(data.schedule.legalDisclaimer).toContain('Not legal advice');

    // Missing inputs rejected with 400
    const invalidRes = await fetch(`${baseUrl}/api/retell/tools/calculate-due-diligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(invalidRes.status).toBe(400);
    const invalidData = await invalidRes.json();
    expect(invalidData.success).toBe(false);
    expect(invalidData.error).toContain('Explicit effectiveDate and negotiated dueDiligenceDays');
  });

  it('5. lookup-roster redacts direct personal phone for unverified callers', async () => {
    // Query Chris Brown without verified caller token
    const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Chris Brown', caller_match_status: 'unknown' })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.person.name).toBe('Chris Brown');
    expect(data.person.phone).toBe('(910) 507-2047'); // General office line, not direct cell
  });

  it('6. get-tasks requires explicit search filter', async () => {
    const res = await fetch(`${baseUrl}/api/retell/tools/get-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('MISSING_SEARCH_FILTER');
  });
});
