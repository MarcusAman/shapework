import { z } from 'zod';

export const knowledgeAnalysisSchema = z.object({
  title: z.string().describe('Proposed formal document title'),
  summary: z.string().describe('A 2-3 sentence high-level overview of the document'),
  purpose: z.string().describe('The primary operational purpose of this document'),
  audience: z.string().describe('The intended audience/role(s) that need to read this'),
  topics: z.array(z.string()).describe('Core topics covered by the document'),
  tags: z.array(z.string()).describe('Metadata search tags to index'),
  rolesMentioned: z.array(z.string()).describe('Any organizational roles or positions mentioned'),
  procedures: z.array(z.string()).describe('Step-by-step procedures outlined in the content'),
  importantPolicies: z.array(z.string()).describe('Crucial policies or rules to be aware of'),
  requiredForms: z.array(z.string()).describe('Any required forms, documents, or files mentioned'),
  deadlines: z.array(z.string()).describe('Key deadlines or timelines specified'),
  escalationInstructions: z.array(z.string()).describe('Escalation procedures or contacts mentioned'),
  relatedSops: z.array(z.string()).describe('Any related Standard Operating Procedures'),
  requestCategories: z.array(z.string()).describe('Matching operational request categories (e.g. compliance, marketing)'),
  questionsAnswered: z.array(z.string()).describe('Specific questions this document can directly answer'),
  potentialConflicts: z.array(z.string()).describe('Any parts that conflict with existing rules or other pages'),
  outdatedWarnings: z.array(z.string()).describe('Any potentially outdated dates, tools, or references'),
  sensitiveContentWarning: z.array(z.string()).describe('Warnings about sensitive customer or financial information'),
});

export type KnowledgeAnalysis = z.infer<typeof knowledgeAnalysisSchema>;
