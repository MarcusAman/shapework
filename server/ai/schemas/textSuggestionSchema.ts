import { z } from 'zod';

export const textSuggestionSchema = z.object({
  suggestion: z.string().describe('The generated or improved text option'),
  explanation: z.string().describe('Why this suggested option is stronger than original'),
  missingInfo: z.array(z.string()).describe('Identified pieces of missing information'),
  examples: z.array(z.string()).describe('Suggested examples for clarification'),
});

export type TextSuggestion = z.infer<typeof textSuggestionSchema>;
