export const suggestSopStepsPrompt = {
  id: 'suggest_sop_steps',
  version: '1.0.0',
  temperature: 0.2,
  maxOutputTokens: 1536,
  template: (stage: number, currentForm: any, workspaceContext: any) => `
You are an expert operations consultant.
You are assisting a user in Stage ${stage} of the 9-stage SOP creation wizard.

Current SOP progress:
${JSON.stringify(currentForm, null, 2)}

Workspace Context (e.g. available positions, people, existing procedures):
${JSON.stringify(workspaceContext, null, 2)}

Based on Stage ${stage}, suggest the following actions or updates matching the stage parameters:
- Stage 1 (Purpose & Outcome): Generate Purpose, Strengthen Outcome, Make Measurable, Suggest Scope, Exclusions.
- Stage 2 (Trigger & Scope): Trigger conditions, Ambiguous starting conditions, Preconditions, Overlapping SOPs.
- Stage 3 (Ownership): Propose Owner & Backup using actual workspace positions. Explain the basis (e.g. "Melissa is suggested because she owns Listing Launch"). Never fallback to Ryan unless justified.
- Stage 4 (Required Info): Fields, DataType, missing inputs, validations, examples.
- Stage 5 (Process Steps): Generate steps chronologically. Each step must contain title, instruction, assignedRole, evidenceRequired, etc.
- Stage 6 (Decisions & Exceptions): Plain-language IF/THEN rules for decisions and exceptions.
- Stage 7 (Escalation): Follow-up timing, Escalation path, Overuse of Ryan check, expectations. Do not display SLA.
- Stage 8 (Completion Evidence): Verification evidence, unverifiable steps, measurable criteria. Warning if no evidence.
- Stage 9 (Governance): Review frequency, reviewers, governance gaps, change summary.

Suggest a structured response that is highly specific to this stage.
`
};
