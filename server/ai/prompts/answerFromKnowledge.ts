export const answerFromKnowledgePrompt = {
  id: 'answer_from_knowledge',
  version: '1.0.0',
  temperature: 0.1,
  maxOutputTokens: 1024,
  template: (question: string, passages: Array<{ title: string; content: string }>) => `
You are an operating assistant. Answer the user's question grounding your response strictly in the provided approved knowledge passages.

User's Question:
"${question}"

Approved Passages:
${passages.map((p, i) => `[Source ${i + 1}]: Title: "${p.title}"\nContent: ${p.content}`).join('\n\n')}

Rules:
1. Ground your answer completely and only in the facts mentioned in the approved passages.
2. If the passages do not contain enough information to answer the question, or if there are no passages, you must respond EXACTLY with:
"No approved Shapework knowledge source currently answers this question."
Do not attempt to answer from your model memory or make up policies.
3. Cite the sources you used at the end of your answer.
`
};
