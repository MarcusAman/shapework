import type { CanonicalMarketingRequest, CanonicalMarketingTask } from '../persistence/marketingCampaignsRepository.js';

export interface EmailConversationIdentity {
  messageId?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string | string[];
}

const emailKey = (value?: string) => String(value || '').trim().toLowerCase();
export function messageIds(value?: string | string[]): string[] {
  return (Array.isArray(value) ? value : [value || '']).flatMap(part =>
    (part.match(/<[^>]+>|[^\s,]+/g) || []).map(id => id.replace(/^<|>$/g, '').trim())
  ).filter(Boolean);
}

/** Stored inside the existing durable routing_snapshot JSON, never in a process-only map. */
export function recordEmailConversation(task: CanonicalMarketingTask, identity: EmailConversationIdentity): void {
  const previous = task.routingSnapshot?.emailConversation || {};
  task.routingSnapshot = {
    ...task.routingSnapshot,
    emailConversation: {
      threadIds: [...new Set([...(previous.threadIds || []), identity.threadId].filter(Boolean))],
      messageIds: [...new Set([...(previous.messageIds || []), ...messageIds(identity.messageId)])],
      references: [...new Set([...(previous.references || []), ...messageIds(identity.inReplyTo), ...messageIds(identity.references)])],
    },
  };
}

/** Ignore quoted history so an old change request does not reopen a later thank-you. */
export function latestReplyText(text: string): string {
  return String(text || '').split(/\n(?:On .+wrote:|From:|_{3,}|-{2,}\s*Original Message)/i)[0]
    .split('\n').filter(line => !/^\s*>/.test(line)).join('\n').trim();
}

export function isRevisionRequest(text: string): boolean {
  const latest = latestReplyText(text);
  return !/\b(?:no|without|don't need|do not need)\s+(?:any\s+)?(?:changes?|revisions?)\b/i.test(latest) &&
    /\b(?:revise|revision|revisions|change|changes|correct|correction|fix|replace|swap|update|adjust|redo)\b/i.test(latest);
}

export function findEmailReplyTarget(input: EmailConversationIdentity & {
  workspaceId: string; senderEmail: string; subject: string; text: string; propertyAddress?: string;
  hasAttachments: boolean; requests: CanonicalMarketingRequest[]; tasks: CanonicalMarketingTask[];
}): { request: CanonicalMarketingRequest; tasks: CanonicalMarketingTask[]; exactConversation: boolean } | null {
  // Explicit new work stays separate even when it names the same property or reuses an old thread.
  if (/\b(?:new|another|separate)\s+(?:marketing\s+)?(?:request|campaign|package|project)\b/i.test(latestReplyText(input.text))) return null;
  const sender = emailKey(input.senderEmail);
  if (!sender || !input.workspaceId) return null;
  const requests = input.requests.filter(r => r.workspaceId === input.workspaceId && emailKey(r.agentEmail) === sender && !r.isArchived && !['archived', 'merged'].includes(r.status));
  const ancestry = new Set([...messageIds(input.inReplyTo), ...messageIds(input.references)]);
  const scopedTasks = (request: CanonicalMarketingRequest) => input.tasks.filter(t => t.workspaceId === input.workspaceId &&
    (t.requestId === request.id || request.taskIds?.includes(t.id)) && !t.isArchived &&
    (!t.agentEmail || emailKey(t.agentEmail) === sender));
  const exact = requests.filter(request => scopedTasks(request).some(task => {
    const conversation = task.routingSnapshot?.emailConversation || {};
    const knownMessages = [...(conversation.messageIds || []), ...(conversation.references || []),
      task.routingSnapshot?.delivery?.messageId, (task as any).deliveryMessageId].flatMap(id => messageIds(id));
    return Boolean(input.threadId && (conversation.threadIds || []).includes(input.threadId)) ||
      knownMessages.some(id => ancestry.has(id));
  }));
  if (exact.length === 1) return { request: exact[0], tasks: scopedTasks(exact[0]), exactConversation: true };
  if (exact.length > 1) return null;
  // A claimed reply identity that does not resolve must never fall through to another conversation.
  if (ancestry.size || input.threadId || !input.propertyAddress) return null;
  if (!input.hasAttachments && !/^\s*re:/i.test(input.subject)) return null;
  const key = (value?: string) => String(value || '').split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const byAddress = requests.filter(r => r.status !== 'completed' && key(r.propertyAddress) === key(input.propertyAddress) &&
    scopedTasks(r).some(t => t.status !== 'completed'));
  return byAddress.length === 1 ? { request: byAddress[0], tasks: scopedTasks(byAddress[0]), exactConversation: false } : null;
}

export function applyEmailReply(task: CanonicalMarketingTask, input: EmailConversationIdentity & {
  photos: any[]; attachments: any[]; text: string; senderName: string; reopen: boolean;
}): void {
  const merge = (existing: any[], incoming: any[]) => {
    const seen = new Set(existing.map(item => item.hash || item.assetId || item.id || item.url));
    return [...existing, ...incoming.filter(item => {
      const key = item.hash || item.assetId || item.id || item.url;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    })];
  };
  task.photos = merge(task.photos || [], input.photos);
  task.attachments = merge(task.attachments || [], input.attachments);
  if (input.reopen) {
    task.status = 'needs_review';
    task.reviewState = 'awaiting_review';
    task.completedAt = undefined;
    task.reviewOwner = task.reviewOwnerName = 'Melissa Gagliardi';
    task.reviewOwnerId = 'dir_melissa_gagliardi_33';
    task.proofNotes = latestReplyText(input.text);
    (task as any).approvedProofVersion = undefined;
    (task as any).approvedChecksum = undefined;
    task.reviewHistory = [...(task.reviewHistory || []), {
      version: task.proofVersion || 1, action: 'revisions_requested', reviewerName: input.senderName,
      feedbackNotes: task.proofNotes, timestamp: new Date().toISOString(),
    }];
  } else if (task.status === 'needs_info' && !task.startedAt) {
    task.status = 'request_received';
  }
  if ((task.photos || []).length) {
    (task as any).missingFields = ((task as any).missingFields || []).filter((field: string) => field !== 'photoReferences');
    task.internalFlags = (task.internalFlags || []).filter(flag => flag.type !== 'missing_photos');
  }
  task.notes = `${task.notes || ''}\n\n[Email reply from ${input.senderName}]: ${latestReplyText(input.text)}`.trim();
  task.updatedAt = new Date().toISOString();
  recordEmailConversation(task, input);
}
