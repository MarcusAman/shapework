/**
 * Knowledge Library — interview-first SOP create helpers.
 * Fills the existing SOP Studio form shape (same as handleSelectBlank / templates).
 */

import { NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS } from './listingLaunchSop';

export const SOP_INTERVIEW_TYPES = [
  { id: 'Marketing', label: 'Marketing', hint: 'Flyers, eblasts, Maxa, social, photos' },
  { id: 'Operations', label: 'Operations', hint: 'Yard signs, lockboxes, vendor dispatch' },
  { id: 'Transaction', label: 'Transaction', hint: 'Contracts, Dotloop, closings, Form 2-T' },
  { id: 'Compliance', label: 'Compliance', hint: 'BIC review, disclosures, MLS rules' },
  { id: 'Other', label: 'Other', hint: 'Anything else Nest runs as a checklist' },
] as const;

export type SopInterviewTypeId = (typeof SOP_INTERVIEW_TYPES)[number]['id'];

/** Nest tools commonly named on SOPs / task checklists */
export const SOP_INTERVIEW_TOOLS = [
  { id: 'Dotloop', label: 'Dotloop', types: ['Transaction', 'Compliance', 'Other'] },
  { id: 'Maxa', label: 'Maxa / Nest Design', types: ['Marketing', 'Other'] },
  { id: 'NC Regional MLS', label: 'NC Regional MLS', types: ['Transaction', 'Compliance', 'Other'] },
  { id: 'Supra eKEY', label: 'Supra eKEY', types: ['Operations', 'Transaction', 'Other'] },
  { id: 'ShowingTime', label: 'ShowingTime', types: ['Transaction', 'Operations', 'Other'] },
  { id: 'Google Drive', label: 'Google Drive', types: ['Marketing', 'Operations', 'Transaction', 'Other'] },
  { id: 'Email', label: 'Email (AskNora / Nest)', types: ['Marketing', 'Operations', 'Transaction', 'Compliance', 'Other'] },
  { id: 'SMS / Phone', label: 'SMS / Phone', types: ['Operations', 'Marketing', 'Other'] },
  { id: 'Sign Inventory Desk', label: 'Sign Inventory / yard posts', types: ['Operations', 'Other'] },
  { id: 'Rechat', label: 'Rechat', types: ['Marketing', 'Other'] },
] as const;

export type SopInterviewAnswers = {
  department: SopInterviewTypeId;
  title: string;
  purpose: string;
  trigger: string;
  ownerRole: string;
  /** Tools / systems this SOP runs on */
  systemsUsed: string[];
  /** One checklist line per item */
  stepLines: string[];
  completionEvidence: string;
  /** When true, seed steps from Listing Launch example */
  usedListingLaunchExample: boolean;
};

export const LISTING_LAUNCH_INTERVIEW_EXAMPLE = {
  title: 'Listing Launch Protocol',
  purpose:
    'Take a new Nest listing from signed agreement through MLS Active and Just Listed marketing — with Dotloop, photos, yard sign, BIC MLS approval, and Maxa in the right order.',
  trigger: 'Listing agent or TC marks a new Exclusive Right to Sell as fully executed in Dotloop.',
  ownerRole: 'transaction_coordinator',
  department: 'Transaction' as SopInterviewTypeId,
  completionEvidence:
    'MLS status Active + Just Listed assets live + yard post installed (or pickup confirmed).',
};

export function listingLaunchExampleSystemsUsed(): string[] {
  const set = new Set<string>();
  for (const s of NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS) {
    if (s.systemUsed) set.add(s.systemUsed);
  }
  return Array.from(set);
}

function slugId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listingLaunchExampleStepLines(): string[] {
  return NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS.map((s) => s.label);
}

export function listingLaunchExampleStepsForForm() {
  return NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS.map((s, i) => ({
    id: s.id || `st_${i + 1}`,
    stepNumber: i + 1,
    title: s.label,
    instruction: s.label,
    assignedRole: (s.role || 'listing_agent').toLowerCase().replace(/\s+/g, '_'),
    backupRole: undefined as string | undefined,
    type: 'manual',
    evidenceRequired: '',
    expectedDuration: '1h',
    connectedTool: s.systemUsed || '',
    systemUsed: s.systemUsed || '',
    role: s.role || '',
  }));
}

export function toolsSuggestedForType(department: SopInterviewTypeId): string[] {
  return SOP_INTERVIEW_TOOLS.filter((t) =>
    (t.types as readonly string[]).includes(department)
  ).map((t) => t.id);
}

/** Build a blank-compatible sopForm from interview answers. */
export function buildSopFormFromInterview(
  answers: SopInterviewAnswers,
  workspaceId: string
): Record<string, unknown> {
  const freshSopId = slugId('sop');
  const systemsUsed = (answers.systemsUsed || []).map((s) => s.trim()).filter(Boolean);
  const primaryTool = systemsUsed.length === 1 ? systemsUsed[0] : '';

  const steps = answers.usedListingLaunchExample
    ? listingLaunchExampleStepsForForm()
    : answers.stepLines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => ({
          id: `step_${i + 1}_${Date.now()}`,
          stepNumber: i + 1,
          title: line,
          instruction: line,
          assignedRole: answers.ownerRole || 'operations_lead',
          type: 'manual',
          evidenceRequired: '',
          expectedDuration: '1h',
          connectedTool: primaryTool,
          systemUsed: primaryTool,
        }));

  const derivedSystems = answers.usedListingLaunchExample
    ? Array.from(
        new Set([
          ...systemsUsed,
          ...listingLaunchExampleStepsForForm()
            .map((s) => s.systemUsed)
            .filter(Boolean),
        ])
      )
    : systemsUsed;

  return {
    id: `${freshSopId}_draft`,
    sopId: freshSopId,
    workspaceId,
    title: answers.title.trim(),
    department: answers.department,
    ownerRole: answers.ownerRole || 'operations_lead',
    ownerUserId: '',
    backupRole: 'owner',
    backupUserId: '',
    finalApproverUserId: '',
    escalationRecipientRole: 'owner',
    purpose: answers.purpose.trim(),
    expectedOutcome: answers.purpose.trim(),
    scope: `${answers.department} procedures for Nest Realty`,
    exclusions: '',
    tags: answers.usedListingLaunchExample ? ['listing-launch', 'interview'] : ['interview'],
    triggerType: 'manual_start',
    trigger: answers.trigger.trim(),
    triggerConditions: '',
    requiredInfo: [],
    steps,
    decisions: [],
    systemsUsed: derivedSystems,
    escalationBehavior: {
      expectedResponse: 'Expected Response: 1 hour',
      followUpDue: 'Follow-up Due: 12 hours',
      escalateAfter: 'Escalate After: 24 hours',
      recipientRole: 'owner',
    },
    completionEvidence: {
      type: 'manual',
      description: answers.completionEvidence.trim(),
    },
    governance: {
      reviewFrequencyDays: 90,
      visibility: 'workspace',
      trainingRequired: false,
      acknowledgementRequired: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewers: [],
    },
    status: 'draft',
    version: '1.0',
    versions: [],
    changeSummary: answers.usedListingLaunchExample
      ? 'Interview draft seeded from Listing Launch example — review required'
      : 'Interview draft — review required',
  };
}
