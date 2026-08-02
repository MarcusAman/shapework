export const reviewSopPrompt = {
  id: 'review_sop_quality',
  version: '1.0.0',
  temperature: 0.1,
  maxOutputTokens: 1536,
  template: (sop: any, workspaceContext: any) => `
You are a senior compliance auditor and operations officer.
Review the following complete Standard Operating Procedure (SOP) for completeness, safety, and compliance quality.

SOP Details:
${JSON.stringify(sop, null, 2)}

Workspace Context:
${JSON.stringify(workspaceContext, null, 2)}

Identify any issues or gaps and group them as:
1. "critical": E.g. no owner, no completion evidence, invalid step references, no trigger, dead ends.
2. "recommended": E.g. vague instructions, missing backup, unrealistic response times, no manual fallback for tools, over-relying on Ryan.
3. "optional": E.g. clearer wording, better examples, links to knowledge base.

Provide actionable improvements for each finding.
`
};
