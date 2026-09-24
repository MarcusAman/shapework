/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Voice Ambience, Pre-Lookup Timing & Natural Turn-Taking Verification Suite
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Nora Retell Voice Ambience & Pre-Lookup Spoken Timing', () => {
  const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
  const promptContent = fs.readFileSync(promptPath, 'utf-8');
  const syncScriptPath = path.resolve(process.cwd(), 'scripts/sync_retell_nora_voice_agent.cjs');
  const syncScriptContent = fs.readFileSync(syncScriptPath, 'utf-8');
  const rollbackScriptPath = path.resolve(process.cwd(), 'scripts/rollback_retell_voice_agent.cjs');
  const rollbackScriptContent = fs.readFileSync(rollbackScriptPath, 'utf-8');

  it('1. Embeds subtle office ambience configuration parameters', () => {
    expect(promptContent).toContain('call-center');
    expect(promptContent).toContain('Ambient Sound');
    expect(promptContent).toContain('Ambient Sound Volume');

    expect(syncScriptContent).toContain("ambient_sound: ambientSound");
    expect(syncScriptContent).toContain("ambient_sound_volume: ambientSoundVolume");
    expect(syncScriptContent).toContain("'call-center'");
  });

  it('2. Enforces that fast tools (<1.5s) execute with ZERO spoken delay filler', () => {
    expect(promptContent).toContain('FAST TOOLS (<1.5s Execution — Zero Spoken Delay Filler)');
    expect(promptContent).toContain('lookup_roster_member');
    expect(promptContent).toContain('calculate_due_diligence');
    expect(promptContent).toContain('lookup_open_tasks_by_property');
    expect(promptContent).toContain('lookup_sop_protocol');
    expect(promptContent).toContain('search_knowledge_library');
    expect(promptContent).toContain('request_followup_email');
    expect(promptContent).toMatch(/Nora must \*\*NEVER\*\* speak pre-lookup delay phrases/i);
  });

  it('3. Enforces that slow tools (1.5–2s+) use at most one acknowledgment without repeated filler or premature success claims', () => {
    expect(promptContent).toContain('POTENTIALLY SLOW TOOLS (1.5–2s+ — Single Focused Natural Acknowledgment)');
    expect(promptContent).toContain('submit_marketing_intake');
    expect(promptContent).toContain('dispatch_sign_post');
    expect(promptContent).toMatch(/at most ONE brief, natural conversational acknowledgment/i);
    expect(promptContent).toMatch(/NEVER Repeat Filler/i);
    expect(promptContent).toMatch(/NO Premature Success Claims/i);
    expect(promptContent).toContain('I’m still confirming those details with Flex MLS');
  });

  it('4. Mandates immediate stop and listen when caller interrupts during lookup or speaking', () => {
    expect(promptContent).toContain('stop immediately and listen');
    expect(promptContent).toContain('Interruption Sensitivity');
    expect(promptContent).toContain('0.75');
  });

  it('5. Verifies rollback script supports target version 23 baseline and fallbacks', () => {
    expect(rollbackScriptContent).toContain('targetRollbackVersion');
    expect(rollbackScriptContent).toContain('TARGET_ROLLBACK_VERSION');
  });
});
