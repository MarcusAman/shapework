export const sopDraftPrompt = {
  id: 'sop_draft_generation',
  version: '1.0.0',
  temperature: 0.2,
  maxOutputTokens: 2048,
  template: (roughDescription: string, rolesList: string[]) => `
You are a principal operations architect. Given the following operational policy brief or rough description, draft a comprehensive, structured Standard Operating Procedure (SOP) draft.

Available Roles/Positions in the Organization:
${rolesList.map(r => `- ${r}`).join('\n')}

Operational description:
"${roughDescription}"

Please draft the SOP matching the schema. Follow these compliance guidelines:
1. Suggest logical, actionable steps chronologically.
2. For process ownership, assign roles from the available positions list where possible. Do not make "Ryan" the default fallback unless the context clearly requires it.
3. Suggest required inputs, decisions, exception rules, escalation paths, and completion evidence.
`
};
