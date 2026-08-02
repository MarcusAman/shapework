export const improveTextPrompt = {
  id: 'improve_field_text',
  version: '1.0.0',
  temperature: 0.3,
  maxOutputTokens: 1024,
  template: (field: string, value: string, actionType: string, sopContext: string) => `
You are a senior technical writer and operations engineer.
You are helping improve a specific text field in a Standard Operating Procedure (SOP).

SOP Context:
${sopContext}

Field Name: "${field}"
Current Value: "${value}"
Requested Action: "${actionType}" (can be "help_write", "improve_clarity", "make_actionable", "add_detail", "make_shorter", "identify_missing", "suggest_example")

Improve the text matching the action type. Return:
1. The suggested improved text.
2. A brief, clear explanation of why this suggested option is stronger.
3. List any missing information or key questions the writer should answer.
4. Give a concrete example if appropriate.
`
};
