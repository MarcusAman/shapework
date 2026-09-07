import { describe, it, expect } from 'vitest';
import { answerFromKnowledgePrompt } from '../../server/ai/prompts/answerFromKnowledge';
import fs from 'fs';
import path from 'path';

describe('Nora Direct Execution-First & No Unprompted SOP Citations Suite', () => {
  it('1. answerFromKnowledgePrompt directs model to provide direct answers without unprompted SOP citations', () => {
    const rendered = answerFromKnowledgePrompt.template(
      'What are the listing launch steps?',
      [{ title: 'Listing Launch SOP', content: 'Step 1: Listing Agreement. Step 2: Photos. Step 3: Yard Sign.' }]
    );

    expect(rendered).toContain('Do NOT say "According to SOP..."');
    expect(rendered).toContain('Deliver direct, practical answers');
  });

  it('2. Retell Agent prompt enforces direct answers without unprompted SOP citations', () => {
    const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
    const promptContent = fs.readFileSync(promptPath, 'utf-8');

    expect(promptContent).toContain('Direct Execution-First Answers');
    expect(promptContent).toContain('Listing Launch Protocol');
    expect(promptContent).toContain('unless the caller explicitly asks');
  });

  it('3. NestOpsHub conversation starter provides direct steps without boilerplate SOP citation', () => {
    const hubPath = path.resolve(process.cwd(), 'src/components/brokerage-ops/NestOpsHub.tsx');
    const hubContent = fs.readFileSync(hubPath, 'utf-8');

    expect(hubContent).toContain('To launch a new listing in Wilmington, complete these 3 mandatory steps before MLS syndication');
    expect(hubContent).not.toContain("Under Nest Realty's Listing Launch Protocol (v2.0)");
  });
});
