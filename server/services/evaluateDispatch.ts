/**
 * One dispatch verdict for Approve & Notify.
 * Drawer, Confirm Requester, the send modal, send-questions, and
 * approve-and-dispatch all use this. Do not reimplement the rule on the client.
 */
import { actorIsTaskReviewer, type MarketingGateActor, type MarketingGateTask } from '../../src/lib/marketingApproveNotifyCapabilities.js';
import {
  EXPLICIT_OUTBOUND_ALLOWLIST,
  isLocalProveAllowlistTo,
  isProductionApp,
} from '../../src/lib/outboundAllowlistGate.js';
import { isDurableHttpsProofUrl, isRealGoogleDriveUrl } from './askNoraDriveDelivery.js';
import { resolveServerCanonicalRecipient } from './canonicalRecipientService.js';

export const DISPATCH_REASON = {
  role: 'Only the task reviewer may approve and notify.',
  proof: 'Proof link must use https.',
  file: 'No Drive folder and no file to send.',
  recipient: 'This recipient is not allowed.',
  outbound: 'Outbound is turned off.',
} as const;

export type DispatchRecipientStatus = 'directory' | 'allowlisted_prove' | 'unresolved';

export type DispatchVerdict = {
  allowed: boolean;
  reason: string;
  recipientStatus: DispatchRecipientStatus;
  /** Real directory id, or null. Never a made-up dir_* for an allowlist-only To. */
  recipientId: string | null;
  effectiveCc: string[];
};

export type DispatchIntent = 'ask_missing' | 'delivery_complete';

export type EvaluateDispatchInput = {
  task: MarketingGateTask & {
    id?: string | null;
    workspaceId?: string | null;
    proofUrl?: string | null;
    driveFolderUrl?: string | null;
    agentEmail?: string | null;
    attachments?: unknown[] | null;
    photos?: unknown[] | null;
  };
  actor: MarketingGateActor | null;
  recipient?: {
    email?: string | null;
    name?: string | null;
    requesterId?: string | null;
    phone?: string | null;
  } | null;
  channel?: 'email' | 'sms' | 'both' | string | null;
  cc?: string[] | null;
  intent?: DispatchIntent | null;
  proofUrl?: string | null;
  driveFolderUrl?: string | null;
  assetUrls?: string[] | null;
  attachments?: unknown[] | null;
};

function cleanList(values?: Array<string | null | undefined> | null): string[] {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/** Prod + a real directory person keeps CC. Every other mode keeps exact allowlist hits only. */
export function filterDispatchCc(
  cc: string[] | null | undefined,
  recipientStatus: DispatchRecipientStatus
): string[] {
  const cleaned = cleanList(cc);
  if (isProductionApp() && recipientStatus === 'directory') return cleaned;
  const allow = new Set(EXPLICIT_OUTBOUND_ALLOWLIST.map((email) => email.toLowerCase()));
  return cleaned.filter((email) => allow.has(email));
}

function outboundTurnedOff(): boolean {
  const mode = String(process.env.OUTBOUND_MASTER_MODE || process.env.OUTBOUND_MODE || 'hold')
    .toLowerCase()
    .trim();
  return mode === 'disabled';
}

function explicitBadProof(url?: string | null): boolean {
  const value = String(url || '').trim();
  if (!value) return false;
  if (isDurableHttpsProofUrl(value)) return false;
  // A local upload is a file, not a protocol failure.
  if (value.startsWith('/')) return false;
  return true;
}

function hasRealFolder(url?: string | null): boolean {
  const value = String(url || '').trim();
  if (!value || /1DRV_/i.test(value)) return false;
  return isRealGoogleDriveUrl(value);
}

function hasSendableFile(input: EvaluateDispatchInput, folderUrl: string): boolean {
  const proofs = [input.proofUrl, input.task?.proofUrl, folderUrl];
  if (proofs.some((url) => isDurableHttpsProofUrl(url))) return true;
  if (proofs.some((url) => String(url || '').trim().startsWith('/uploads/'))) return true;
  const urls = [...(input.assetUrls || [])];
  if (urls.some((url) => {
    const value = String(url || '').trim();
    if (!value || /^data:|^blob:|^file:/i.test(value)) return false;
    return value.startsWith('/') || isDurableHttpsProofUrl(value);
  })) return true;
  const attachments = [...(input.attachments || []), ...(input.task?.attachments || [])];
  return attachments.some((item) => {
    if (!item) return false;
    if (typeof item === 'string') {
      const value = item.trim();
      return Boolean(value) && !/^data:|^blob:/i.test(value);
    }
    const url = String((item as { url?: string }).url || '').trim();
    if (!url) return true;
    return !/^data:|^blob:/i.test(url);
  });
}

export function dispatchBlockStatus(reason: string): number {
  return reason === DISPATCH_REASON.role ? 403 : 400;
}

export function dispatchBlockCode(reason: string): string {
  switch (reason) {
    case DISPATCH_REASON.role:
      return 'FORBIDDEN_NOT_TASK_REVIEWER';
    case DISPATCH_REASON.proof:
      return 'INVALID_PROTOCOL';
    case DISPATCH_REASON.file:
      return 'NO_SENDABLE_FILE';
    case DISPATCH_REASON.recipient:
      return 'RECIPIENT_UNRESOLVED';
    case DISPATCH_REASON.outbound:
      return 'OUTBOUND_DISABLED';
    default:
      return 'DISPATCH_BLOCKED';
  }
}

export function dispatchRejectBody(verdict: DispatchVerdict) {
  return {
    success: false,
    allowed: false,
    reason: verdict.reason,
    gateReason: verdict.reason,
    error: verdict.reason,
    code: dispatchBlockCode(verdict.reason),
    recipientStatus: verdict.recipientStatus,
    recipientId: verdict.recipientId,
    effectiveCc: verdict.effectiveCc,
  };
}

export async function evaluateDispatch(input: EvaluateDispatchInput): Promise<DispatchVerdict> {
  const full = input.intent !== 'ask_missing';
  const email = String(input.recipient?.email || input.task?.agentEmail || '').trim();
  const directory = await resolveServerCanonicalRecipient({
    requesterEmail: email || undefined,
    requesterName: input.recipient?.name,
    workspaceId: input.task?.workspaceId || undefined,
  });

  let recipientStatus: DispatchRecipientStatus = 'unresolved';
  let recipientId: string | null = null;
  if (directory) {
    recipientStatus = 'directory';
    recipientId = directory.id;
  } else if (isLocalProveAllowlistTo(email)) {
    recipientStatus = 'allowlisted_prove';
  }

  const effectiveCc = filterDispatchCc(input.cc, recipientStatus);
  const folderUrl = String(input.driveFolderUrl || input.task?.driveFolderUrl || '').trim();
  const suppliedProof = String(input.proofUrl || '').trim();

  let reason = '';
  if (full && !actorIsTaskReviewer(input.actor, input.task)) {
    reason = DISPATCH_REASON.role;
  } else if (full && explicitBadProof(suppliedProof)) {
    reason = DISPATCH_REASON.proof;
  } else if (full && !hasRealFolder(folderUrl) && !hasSendableFile(input, folderUrl)) {
    reason = DISPATCH_REASON.file;
  } else if (recipientStatus === 'unresolved') {
    reason = DISPATCH_REASON.recipient;
  } else if (outboundTurnedOff()) {
    reason = DISPATCH_REASON.outbound;
  }

  return {
    allowed: reason === '',
    reason,
    recipientStatus,
    recipientId,
    effectiveCc,
  };
}
