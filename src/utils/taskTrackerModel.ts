/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Task Tracker 7-Stage Marketing Pipeline Model
 */

export interface TrackerTimelineStage {
  id: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

export interface TrackerNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface MarketingTrackerRecord {
  token: string;
  requestId: string;
  taskId?: string;
  callerName?: string;
  agentName?: string;
  agentEmail?: string;
  propertyAddress: string;
  deliverables: string[];
  assignedLead?: string;
  assignedProducer?: string;
  status: string;
  currentStepIndex: number;
  stages: TrackerTimelineStage[];
  notes: TrackerNote[];
  photos: Array<{ id: string; name: string; url: string; type?: string; sizeBytes?: number }>;
  createdAt: string;
  updatedAt?: string;
  targetSla?: string;
}

export const CANONICAL_MARKETING_STAGES = [
  {
    id: 'received',
    label: 'Request Received',
    description: 'Marketing request logged with Nora and queued for intake review.'
  },
  {
    id: 'intake_review',
    label: 'Intake Review',
    description: 'Marketing Director Melissa Gagliardi reviewing listing specs and assets.'
  },
  {
    id: 'assigned',
    label: 'Assigned to Producer',
    description: 'Assigned to production specialist for collateral generation.'
  },
  {
    id: 'in_production',
    label: 'In Production',
    description: 'High-resolution collateral drafts and layouts being prepared.'
  },
  {
    id: 'marketing_review',
    label: 'Marketing Director Review',
    description: 'Proof submitted to Melissa Gagliardi for brand and compliance sign-off.'
  },
  {
    id: 'agent_review',
    label: 'Agent Review',
    description: 'Proof delivered to agent for review and final approval.'
  },
  {
    id: 'completed',
    label: 'Completed & Delivered',
    description: 'Collateral approved and delivered across all requested channels.'
  }
];

export function deriveMarketingStageIndex(taskStatus?: string, requestStatus?: string, reviewState?: string): number {
  const status = (taskStatus || requestStatus || '').toLowerCase();
  const rev = (reviewState || '').toLowerCase();

  if (status === 'completed' || status === 'delivered' || status === 'closed') {
    return 6;
  }
  if (status === 'agent_review' || rev === 'agent_review') {
    return 5;
  }
  if (status === 'ready_for_review' || rev === 'awaiting_review' || rev === 'marketing_review') {
    return 4;
  }
  if (status === 'in_progress' || status === 'in_production') {
    return 3;
  }
  if (status === 'assigned' || status === 'scheduled') {
    return 2;
  }
  if (status === 'intake_review' || status === 'reviewing' || status === 'triaged') {
    return 1;
  }
  return 0; // received
}

export function buildMarketingTimelineStages(
  currentStageIndex: number,
  createdAt: string = new Date().toISOString(),
  updatedAt?: string
): TrackerTimelineStage[] {
  return CANONICAL_MARKETING_STAGES.map((stageDef, idx) => {
    const isCompleted = idx < currentStageIndex;
    const isCurrent = idx === currentStageIndex;

    let timestamp: string | undefined;
    if (idx === 0) timestamp = createdAt;
    else if (isCurrent && updatedAt) timestamp = updatedAt;
    else if (isCompleted) timestamp = createdAt;

    return {
      id: stageDef.id,
      label: stageDef.label,
      description: stageDef.description,
      completed: isCompleted,
      current: isCurrent,
      timestamp
    };
  });
}
