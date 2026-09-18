import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Retell Voice Agent Handbook Standards & Audio Speed Suite', () => {
  const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
  const promptContent = fs.readFileSync(promptPath, 'utf-8');

  it('1. Configures voice speed to 1.15 and declares Gemini Flash engine', () => {
    expect(promptContent).toContain('1.15');
    expect(promptContent.toLowerCase()).toContain('gemini');
    expect(promptContent.toLowerCase()).toContain('flash');
  });

  it('2. Includes comprehensive Real Estate Speech Normalization Dictionary', () => {
    const normalizations = ['MLS', 'BIC', 'TC', 'Form 2-T', 'WWREA', 'NCREC', 'EMD', 'DDF', 'SQFT', 'REALTOR®'];
    for (const term of normalizations) {
      expect(promptContent).toContain(term);
    }
  });

  it('3. Specifies Echo Verification Protocol for address, deadlines, and deliverables', () => {
    expect(promptContent.toLowerCase()).toContain('echo verification');
    expect(promptContent).toContain('126 Parkwood Avenue');
  });

  it('4. Embeds NATO Phonetic Alphabet for precise name/email verification', () => {
    expect(promptContent).toContain('Alpha');
    expect(promptContent).toContain('Bravo');
    expect(promptContent).toContain('Charlie');
    expect(promptContent).toContain('Zulu');
  });

  it('5. Enforces AI Disclosure and Scope Boundaries without unprompted SOP citations', () => {
    expect(promptContent.toLowerCase()).toContain('ai disclosure');
    expect(promptContent).toContain('NORA');
    expect(promptContent).not.toContain('sparkles');
  });
});
