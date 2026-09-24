/**
 * Voice-Guided SOP Self-Authoring Workflow Types
 */

export type VoiceSessionState =
  | 'idle'
  | 'requesting_permission'
  | 'connecting'
  | 'listening'
  | 'consultant_speaking'
  | 'processing'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'error';

export type SopStatus = 
  | 'draft' 
  | 'for_comment' 
  | 'awaiting_bic_review' 
  | 'awaiting_owner_review' 
  | 'in_review' 
  | 'published' 
  | 'archived';

export type TranscriptRetentionChoice = 'sop_only' | 'sop_and_transcript' | 'sop_and_audio';

export interface StepDurationPolicy {
  preset?: '15m' | '30m' | '45m' | '1h' | '2h' | '4h' | '24h' | '48h' | '72h' | 'custom';
  customMinutes?: number;
  rawDisplay?: string;
}

export interface SopStep {
  id: string;
  stepNumber: number;
  action: string;
  role: string;
  primaryRole?: string;
  secondaryRole?: string;
  durationPolicy?: StepDurationPolicy;
  affirmationCheck?: string;
  assignedRole?: string;
  title?: string;
  instruction?: string;
  systemUsed?: string;
}

export interface SopOwner {
  type: 'person' | 'department';
  name: string;
  id?: string;
}

export interface SopComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
}

export interface StateDisclosure {
  code: string;
  title: string;
  requiredTiming: string;
  statutoryReference?: string;
  affirmationCheck: string;
}

export interface StateStepOverride {
  stepNumber: number;
  actionOverride?: string;
  roleOverride?: string;
  statutoryReference?: string;
  affirmationCheckOverride?: string;
}

export interface StateAddendum {
  stateCode: string;
  stateName: string;
  governingCommission: string;
  statutoryDepositDeadlineHours: number;
  escrowTrustRules: string;
  contingencyTimelineRules: {
    dueDiligenceDaysDefault?: number;
    inspectionContingencyDaysDefault?: number;
    financingContingencyDaysDefault?: number;
    appraisalContingencyDaysDefault?: number;
    settlementGracePeriodDays?: number;
    notes: string;
  };
  mandatoryDisclosures: StateDisclosure[];
  stepOverrides?: StateStepOverride[];
  timelineCalculatorNotes?: string;
  complianceNotes?: string[];
}

export interface SopDocument {
  id: string;
  tenantId: string;
  workspaceId: string;
  title: string;
  purpose: string;
  trigger: string;
  processOwner: string;
  sopOwner?: SopOwner;
  category?: string;
  stateJurisdiction?: string;
  participants: string[];
  prerequisites: string[];
  requiredInputs: string[];
  orderedSteps: SopStep[];
  decisions: string[];
  exceptions: string[];
  escalationPaths: string[];
  completionEvidence: string;
  expectedTiming: string;
  systemsUsed: string[];
  reviewer: string;
  publisher: string;
  effectiveDate: string;
  activationDate?: string;
  reviewDate: string;
  openQuestions: string[];
  comments?: SopComment[];
  status: SopStatus;
  author: string;
  createdBy?: string;
  aiAssisted: true;
  transcriptRetention: TranscriptRetentionChoice;
  transcript?: Array<{ sender: 'ai' | 'user' | 'system'; text: string; timestamp: string }>;
  tags?: string[];
  escalationBehavior?: any;
  expectedOutcome?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  previousVersionId?: string;
  isMasterSop?: boolean;
  masterSopId?: string;
  stateAddenda?: Record<string, StateAddendum>;
}

export interface SopToolPayloads {
  set_sop_title: { title: string };
  set_sop_purpose: { purpose: string };
  set_process_owner: { owner: string };
  add_sop_step: { stepNumber?: number; action: string; role?: string; systemUsed?: string };
  update_sop_step: { stepNumber: number; action?: string; role?: string; systemUsed?: string };
  reorder_sop_steps: { stepOrder: number[] };
  add_decision: { decision: string };
  add_exception: { exception: string };
  add_escalation: { escalation: string };
  add_open_question: { question: string };
  mark_question_resolved: { questionIndex: number };
}

export interface VoiceConsentPreferences {
  permissionGranted: boolean;
  micAccessReason: string;
  retentionChoice: TranscriptRetentionChoice;
  draftVisibility: string;
}

export type SopCategory =
  | 'Agent Onboarding, Training, Support and Retention'
  | 'Marketing'
  | 'Finance'
  | 'Office and Facilities'
  | 'Owner / Leadership'
  | 'Events'
  | 'Transactions and Compliance'
  | 'Vendors & Systems';

export const CANONICAL_SOP_CATEGORIES: readonly SopCategory[] = [
  'Agent Onboarding, Training, Support and Retention',
  'Marketing',
  'Finance',
  'Office and Facilities',
  'Owner / Leadership',
  'Events',
  'Transactions and Compliance',
  'Vendors & Systems'
] as const;

export function normalizeSopCategory(raw?: string | null, fallbackTitle?: string | null): SopCategory {
  const evaluateString = (str?: string | null): SopCategory | null => {
    if (!str) return null;
    const lower = str.trim().toLowerCase();

    if (
      lower.includes('onboard') ||
      lower.includes('retention') ||
      lower.includes('training') ||
      lower.includes('support') ||
      lower.includes('continuing education') ||
      lower.includes('ce renewal') ||
      lower.includes('broker affiliation')
    ) {
      return 'Agent Onboarding, Training, Support and Retention';
    }
    if (
      lower.includes('market') ||
      lower.includes('listing launch') ||
      lower.includes('social') ||
      lower.includes('review') ||
      lower.includes('testimonial') ||
      lower.includes('brand') ||
      lower.includes('media') ||
      lower.includes('maxa') ||
      lower.includes('proof')
    ) {
      return 'Marketing';
    }
    if (
      lower.includes('finan') ||
      lower.includes('payroll') ||
      lower.includes('gospel') ||
      lower.includes('payable') ||
      lower.includes('bill') ||
      lower.includes('credit card') ||
      lower.includes('expense') ||
      lower.includes('commission') ||
      lower.includes('disbursement') ||
      lower.includes('cda') ||
      lower.includes('reimbursement')
    ) {
      return 'Finance';
    }
    if (
      lower.includes('facilit') ||
      lower.includes('front desk') ||
      lower.includes('reception') ||
      lower.includes('meeting room') ||
      lower.includes('maintenance') ||
      lower.includes('repair') ||
      lower.includes('lockbox') ||
      lower.includes('signage') ||
      lower.includes('sign vendor') ||
      lower.includes('office')
    ) {
      return 'Office and Facilities';
    }
    if (
      lower.includes('owner') ||
      lower.includes('recruit') ||
      lower.includes('briefing') ||
      lower.includes('operating agreement') ||
      lower.includes('leadership') ||
      lower.includes('lead')
    ) {
      return 'Owner / Leadership';
    }
    if (lower.includes('event')) {
      return 'Events';
    }
    if (
      lower.includes('transact') ||
      lower.includes('complian') ||
      lower.includes('contract') ||
      lower.includes('closing') ||
      lower.includes('due diligence') ||
      lower.includes('form 2-t') ||
      lower.includes('2-t') ||
      lower.includes('disclosure') ||
      lower.includes('rpoads') ||
      lower.includes('mog') ||
      lower.includes('escrow')
    ) {
      return 'Transactions and Compliance';
    }
    if (
      lower.includes('vendor') ||
      lower.includes('system') ||
      lower.includes('software') ||
      lower.includes('backup') ||
      lower.includes('tech & tools') ||
      lower.includes('account setup') ||
      lower.includes('hardware')
    ) {
      return 'Vendors & Systems';
    }
    return null;
  };

  const primaryMatch = evaluateString(raw);
  if (primaryMatch) return primaryMatch;

  const fallbackMatch = evaluateString(fallbackTitle);
  if (fallbackMatch) return fallbackMatch;

  return 'Office and Facilities';
}

