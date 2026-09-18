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

export type SopStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type TranscriptRetentionChoice = 'sop_only' | 'sop_and_transcript' | 'sop_and_audio';

export interface SopStep {
  id: string;
  stepNumber: number;
  action: string;
  role: string;
  assignedRole?: string;
  title?: string;
  instruction?: string;
  systemUsed?: string;
}

export interface SopDocument {
  id: string;
  tenantId: string;
  workspaceId: string;
  title: string;
  purpose: string;
  trigger: string;
  processOwner: string;
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
  reviewDate: string;
  openQuestions: string[];
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
