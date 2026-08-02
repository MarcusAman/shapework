import { z } from 'zod';

export const groundedAnswerSchema = z.object({
  answer: z.string().describe('The answering text grounded strictly in provided passages. If unsupported, return the standard fallback.'),
  unsupportedQuestion: z.boolean().describe('Whether the provided passages do not contain the answer to the question'),
  sources: z.array(z.object({
    objectType: z.string().describe('e.g. document, sop'),
    objectId: z.string().describe('Unique identifier'),
    title: z.string().describe('Title of the source document'),
  })).describe('Sources referenced in the text'),
  warnings: z.array(z.string()).describe('Any caveats or warnings about the answer'),
});

export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>;
