import { z } from 'zod';

export const sopFieldSchema = z.object({
  name: z.string().describe('Short name of the field, e.g. target_launch_date'),
  description: z.string().describe('Purpose or details of the required data'),
  dataType: z.enum(['text', 'long_text', 'number', 'date', 'document', 'choice', 'person', 'address']).describe('The data format'),
  required: z.enum(['yes', 'no', 'conditional']).describe('Whether required to run'),
  conditionalLogic: z.string().optional().describe('Details if required is conditional'),
  example: z.string().optional().describe('An example value'),
});

export const sopStepSchema = z.object({
  title: z.string().describe('Clear action title for the step'),
  instruction: z.string().describe('Step details and instructions'),
  assignedRole: z.string().describe('The position role assigned, e.g. marketing_coordinator, operations_lead'),
  backupRole: z.string().optional().describe('Backup position role'),
  type: z.string().describe('Type of step, e.g. manual, review, tool, approval, complete'),
  evidenceRequired: z.string().optional().describe('Evidence needed for completion signoff'),
  approvalRequired: z.boolean().optional().describe('Whether a broker/manager signature is required'),
  expectedDuration: z.string().optional().describe('Expected completion time, e.g. 15 minutes'),
  connectedTool: z.string().optional().describe('Tools or integrations involved'),
});

export const sopDecisionSchema = z.object({
  title: z.string().describe('Name of the decision path'),
  condition: z.string().describe('Plain language conditional trigger rule (IF)'),
  action: z.string().describe('Action logic to execute (THEN)'),
});

export const sopDraftSchema = z.object({
  title: z.string().describe('Descriptive, actionable SOP title'),
  department: z.string().describe('Primary department responsible, e.g. Marketing, Operations, Compliance'),
  ownerRole: z.string().describe('Primary process owner role'),
  backupRole: z.string().describe('Backup process role'),
  purpose: z.string().describe('Why this process exists and what friction it prevents'),
  expectedOutcome: z.string().describe('Successful final delivery criteria'),
  scope: z.string().describe('Boundaries and what is included in this process'),
  exclusions: z.string().optional().describe('Explicitly excluded scenarios'),
  tags: z.array(z.string()).describe('List of tags, e.g. listing, contract'),
  triggerType: z.string().describe('Type of intake trigger, e.g. request_received, milestone_reached'),
  trigger: z.string().describe('Description of the triggering event or state'),
  requiredInfo: z.array(sopFieldSchema).describe('Prerequisite fields needed to run the process'),
  steps: z.array(sopStepSchema).describe('Checklist steps ordered chronologically'),
  decisions: z.array(sopDecisionSchema).describe('Plain-language conditional rules'),
  escalationBehavior: z.object({
    expectedResponse: z.string().describe('e.g. Expected Response: 2 hours'),
    followUpDue: z.string().describe('e.g. Follow-up Due: 24 hours'),
    escalateAfter: z.string().describe('e.g. Escalate After: 48 hours'),
    recipientRole: z.string().describe('Target escalation role'),
  }),
  completionEvidence: z.object({
    type: z.string().describe('Evidence type, e.g. manual, system'),
    description: z.string().describe('What needs to be uploaded or verified'),
  }),
  governance: z.object({
    reviewFrequencyDays: z.number().describe('How often this SOP should be audited'),
    visibility: z.enum(['workspace', 'public', 'private']).describe('Visibility setting'),
    trainingRequired: z.boolean().describe('Whether staff training is required'),
  }),
});

export type SOPDraft = z.infer<typeof sopDraftSchema>;
