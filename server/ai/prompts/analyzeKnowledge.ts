export const analyzeKnowledgePrompt = {
  id: 'analyze_knowledge_document',
  version: '1.0.0',
  temperature: 0.1,
  maxOutputTokens: 2048,
  template: (documentText: string) => `
You are a knowledge systems engineer. Analyze the following document text and extract its operational metadata, policies, and procedures.

Document Text:
"""
${documentText}
"""

Please identify:
- Proposed formal title
- A brief summary (2-3 sentences)
- Operational purpose
- Intended audience roles
- Covered topics and tags
- Organizational roles mentioned
- Step-by-step procedures outlined
- Important policies or constraints
- Any forms, deadlines, or escalation instructions
- Related SOPs
- Categories matched
- Clear questions this document can answer
- Any potential conflicts or outdated details
- Warnings regarding sensitive information (PII, financial)
`
};
