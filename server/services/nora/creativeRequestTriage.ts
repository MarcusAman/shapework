/**
 * Creative request triage (Feature Lab):
 * Ask Nora / email intake → structured brief → marketing task (Melissa → Eduardo)
 * → Maxa status on the same Tasks board. No new page. No auto-send proofs.
 */

export type CreativeIntakeSource = 'ask_nora' | 'email' | 'web' | 'phone' | 'sms' | 'manual';

export type CreativeDeliverableKind =
  | 'flyer'
  | 'postcard'
  | 'social_story'
  | 'social_post'
  | 'brochure'
  | 'eblast'
  | 'other';

export type MaxaBoardStatus =
  | 'not_started'
  | 'brief_ready'
  | 'in_maxa'
  | 'proof_staged'
  | 'needs_revision'
  | 'awaiting_review'
  | 'complete';

export interface CreativeBrief {
  propertyAddress?: string;
  agentName?: string;
  mlsNumber?: string;
  deliverables: CreativeDeliverableKind[];
  copyNotes: string;
  brandNotes?: string;
  dueDate?: string;
  source: CreativeIntakeSource;
  rawExcerpt?: string;
  createdAt: string;
}

export interface CreativeTaskDraft {
  title: string;
  category: 'marketing';
  status: 'request_received';
  assignedTo: 'Melissa Gagliardi';
  reviewOwner: 'Melissa Gagliardi';
  fulfillmentStaffName: 'Eduardo Lovo';
  propertyAddress: string;
  notes: string;
  creativeBrief: CreativeBrief;
  routingSnapshot: Record<string, unknown>;
}

const DELIVERABLE_PATTERNS: Array<{ kind: CreativeDeliverableKind; re: RegExp }> = [
  { kind: 'flyer', re: /\bflyers?\b|\bprint\s+piece\b/i },
  { kind: 'postcard', re: /\bpost\s*cards?\b|\beddm\b|\bdirect\s+mail\b/i },
  { kind: 'social_story', re: /\bstor(y|ies)\b|\b9\s*[:x]\s*16\b|\breels?\b/i },
  { kind: 'social_post', re: /\bsocial\b|\binstagram\b|\bfeed\s+post\b|\b1\s*[:x]\s*1\b/i },
  { kind: 'brochure', re: /\bbrochures?\b|\b4[\s-]?page\b/i },
  { kind: 'eblast', re: /\be-?blasts?\b|\bemail\s+blast\b/i },
];

export function detectCreativeDeliverables(text: string): CreativeDeliverableKind[] {
  const found = new Set<CreativeDeliverableKind>();
  for (const { kind, re } of DELIVERABLE_PATTERNS) {
    if (re.test(text || '')) found.add(kind);
  }
  if (found.size === 0) found.add('flyer');
  return Array.from(found);
}

export function buildCreativeBrief(input: {
  text?: string;
  subject?: string;
  propertyAddress?: string;
  agentName?: string;
  mlsNumber?: string;
  dueDate?: string;
  source: CreativeIntakeSource;
  deliverables?: CreativeDeliverableKind[];
}): CreativeBrief {
  const blob = [input.subject, input.text].filter(Boolean).join('\n').trim();
  const deliverables =
    input.deliverables && input.deliverables.length > 0
      ? input.deliverables
      : detectCreativeDeliverables(blob);

  let copyNotes = blob.slice(0, 1200);
  if (!copyNotes) {
    copyNotes = 'Creative request received — Melissa to confirm scope before Eduardo/Maxa production.';
  }

  return {
    propertyAddress: input.propertyAddress?.trim() || undefined,
    agentName: input.agentName?.trim() || undefined,
    mlsNumber: input.mlsNumber?.trim() || undefined,
    deliverables,
    copyNotes,
    brandNotes: 'Nest Realty brand — Nest Design Center (Maxa) templates only.',
    dueDate: input.dueDate,
    source: input.source,
    rawExcerpt: blob ? blob.slice(0, 280) : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function formatCreativeBriefNotes(brief: CreativeBrief): string {
  const dels = brief.deliverables.join(', ');
  const lines = [
    'CREATIVE BRIEF',
    brief.propertyAddress ? `Property: ${brief.propertyAddress}` : null,
    brief.agentName ? `Agent: ${brief.agentName}` : null,
    brief.mlsNumber ? `MLS#: ${brief.mlsNumber}` : null,
    `Deliverables: ${dels}`,
    brief.dueDate ? `Needed by: ${brief.dueDate}` : null,
    `Source: ${brief.source}`,
    '',
    'Copy / scope:',
    brief.copyNotes,
    brief.brandNotes ? `\nBrand: ${brief.brandNotes}` : null,
  ].filter((x) => x != null);
  return lines.join('\n');
}

export function buildCreativeTaskDraft(input: {
  text?: string;
  subject?: string;
  propertyAddress?: string;
  agentName?: string;
  mlsNumber?: string;
  dueDate?: string;
  source: CreativeIntakeSource;
  title?: string;
}): CreativeTaskDraft {
  const brief = buildCreativeBrief(input);
  const addr = brief.propertyAddress || input.propertyAddress || 'Address TBD';
  const title =
    input.title?.trim() ||
    `Creative · ${brief.deliverables[0] || 'package'} · ${addr}`;

  return {
    title,
    category: 'marketing',
    status: 'request_received',
    assignedTo: 'Melissa Gagliardi',
    reviewOwner: 'Melissa Gagliardi',
    fulfillmentStaffName: 'Eduardo Lovo',
    propertyAddress: addr,
    notes: formatCreativeBriefNotes(brief),
    creativeBrief: brief,
    routingSnapshot: {
      creativeBrief: brief,
      fulfillmentStaffName: 'Eduardo Lovo',
      reviewOwnerName: 'Melissa Gagliardi',
      marketingOwner: 'Melissa Gagliardi',
      triage: 'creative_request_v1',
      outboundUntilComplete: true,
    },
  };
}

type TaskLike = {
  status?: string;
  reviewState?: string;
  proofUrl?: string;
  proofs?: Array<{ url?: string }>;
  proofHistory?: Array<{ proofUrl?: string }>;
  category?: string;
  domain?: string;
  routingSnapshot?: Record<string, any>;
  creativeBrief?: CreativeBrief;
  vendorName?: string;
};

export function getCreativeBriefFromTask(task: TaskLike): CreativeBrief | null {
  if (task.creativeBrief && Array.isArray(task.creativeBrief.deliverables)) {
    return task.creativeBrief;
  }
  const nested = task.routingSnapshot?.creativeBrief;
  if (nested && Array.isArray(nested.deliverables)) return nested as CreativeBrief;
  return null;
}

export function isMarketingCreativeTask(task: TaskLike): boolean {
  if (getCreativeBriefFromTask(task)) return true;
  if (task.routingSnapshot?.triage === 'creative_request_v1') return true;
  const cat = String(task.category || task.domain || '').toLowerCase();
  return ['marketing', 'print', 'social', 'open_house', 'farming'].includes(cat);
}

function hasStagedProof(task: TaskLike): boolean {
  if (String(task.proofUrl || '').trim()) return true;
  if ((task.proofs || []).some((p) => String(p.url || '').trim())) return true;
  if ((task.proofHistory || []).some((p) => String(p.proofUrl || '').trim())) return true;
  return false;
}

/** Derive Maxa / creative production status for the same Tasks board (no Maxa rebuild). */
export function deriveMaxaBoardStatus(task: TaskLike): MaxaBoardStatus {
  const status = String(task.status || '').toLowerCase();
  const review = String(task.reviewState || '').toLowerCase();

  if (status === 'approved' || status === 'completed' || review === 'approved') {
    return 'complete';
  }
  if (status === 'revisions' || review === 'revisions_requested') {
    return 'needs_revision';
  }
  if (status === 'agent_review' || review === 'awaiting_review') {
    return 'awaiting_review';
  }
  if (hasStagedProof(task)) {
    return 'proof_staged';
  }
  if (status === 'with_vendor' || /maxa/i.test(String(task.vendorName || ''))) {
    return 'in_maxa';
  }
  if (getCreativeBriefFromTask(task) || status === 'in_progress' || status === 'assigned') {
    if (getCreativeBriefFromTask(task) && (status === 'request_received' || status === 'needs_info')) {
      return 'brief_ready';
    }
    if (status === 'in_progress' || status === 'assigned' || status === 'with_vendor') {
      return status === 'with_vendor' ? 'in_maxa' : getCreativeBriefFromTask(task) ? 'brief_ready' : 'not_started';
    }
    return 'brief_ready';
  }
  return 'not_started';
}

export function formatMaxaBoardStatus(status: MaxaBoardStatus): string {
  switch (status) {
    case 'not_started':
      return 'Maxa: not started';
    case 'brief_ready':
      return 'Maxa: brief ready';
    case 'in_maxa':
      return 'Maxa: in design';
    case 'proof_staged':
      return 'Maxa: proof staged';
    case 'needs_revision':
      return 'Maxa: needs revision';
    case 'awaiting_review':
      return 'Maxa: awaiting review';
    case 'complete':
      return 'Maxa: complete';
    default:
      return 'Maxa';
  }
}

/**
 * No outbound proofs/notifications until the creative task is complete (approved).
 * Intake confirmations are out of scope — this gates agent/client proof delivery.
 */
export function canSendCreativeOutbound(task: TaskLike): boolean {
  if (!isMarketingCreativeTask(task)) return true; // non-creative: leave existing gates alone
  const maxa = deriveMaxaBoardStatus(task);
  if (maxa !== 'complete') return false;
  return hasStagedProof(task);
}

export function creativeOutboundBlockReason(task: TaskLike): string | null {
  if (!isMarketingCreativeTask(task)) return null;
  if (canSendCreativeOutbound(task)) return null;
  const maxa = deriveMaxaBoardStatus(task);
  if (maxa !== 'complete') {
    return 'No outbound until this creative task is complete (Melissa approve).';
  }
  return 'Stage a finished proof before outbound.';
}
