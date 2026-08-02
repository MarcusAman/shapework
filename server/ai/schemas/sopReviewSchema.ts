import { z } from 'zod';

export const sopReviewFindingSchema = z.object({
  level: z.enum(['critical', 'recommended', 'optional']),
  section: z.string().describe('The SOP section, e.g. Purpose, Steps, Ownership, Trigger'),
  problem: z.string().describe('Clear description of the issue found'),
  reason: z.string().describe('Why this issue is important or violating compliance guidelines'),
  proposedImprovement: z.string().describe('Actionable steps to resolve the issue'),
  sourceContext: z.string().optional().describe('Contextual quotes or file details showing the issue basis'),
});

export const sopReviewSchema = z.object({
  findings: z.array(sopReviewFindingSchema).describe('List of audit findings categorized by severity'),
});

export type SOPReview = z.infer<typeof sopReviewSchema>;
