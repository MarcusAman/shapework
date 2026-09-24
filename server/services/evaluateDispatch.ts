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
import { isInlineDataProof, resolveDispatchProofAndFolder } from '../../src/lib/proofPrecedence.js';

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
  /** Post-filter To. Outbox recipients must use this array as-is. */
  effectiveTo: string[];
  /** Post-filter CC. Outbox recipients must use this array as-is. */
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
  /**
   * Outbound master mode. Tests inject this so the kill switch does not
   * depend on editing .env. When omitted, the process env is used.
   */
  outboundMode?: string | null;
};

/** Process-wide test injection. Production never sets this. */
let injectedOutboundMode: string | null = null;

export function setDispatchOutboundModeForTests(mode: string | null): void {
  injectedOutboundMode = mode;
}

function cleanList(values?: Array<string | null | undefined> | null): string[] {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/**
 * Final recipient list. A directory person in production keeps every address.
 * Every other mode keeps exact allowlist hits only, so a prove send cannot
 * carry a Nest address in To or CC.
 */
export function filterDispatchRecipients(
  addresses: string[] | null | undefined,
  recipientStatus: DispatchRecipientStatus
): string[] {
  const cleaned = cleanList(addresses);
  if (isProductionApp() && recipientStatus === 'directory') return cleaned;
  const allow = new Set(EXPLICIT_OUTBOUND_ALLOWLIST.map((email) => email.toLowerCase()));
  return cleaned.filter((email) => allow.has(email));
}

/** @deprecated Use filterDispatchRecipients. Same function for To and CC. */
export function filterDispatchCc(
  cc: string[] | null | undefined,
  recipientStatus: DispatchRecipientStatus
): string[] {
  return filterDispatchRecipients(cc, recipientStatus);
}

function readOutboundMode(input: EvaluateDispatchInput): string {
  const injected = input.outboundMode ?? injectedOutboundMode;
  if (injected != null && String(injected).trim() !== '') {
    return String(injected).toLowerCase().trim();
  }
  return String(process.env.OUTBOUND_MASTER_MODE || process.env.OUTBOUND_MODE || 'hold')
    .toLowerCase()
    .trim();
}

function outboundTurnedOff(input: EvaluateDispatchInput): boolean {
  return readOutboundMode(input) === 'disabled';
}

function explicitBadProof(url?: string | null): boolean {
  const value = String(url || '').trim();
  if (!value) return false;
  if (isDurableHttpsProofUrl(value)) return false;
  // A local upload is a file, not a protocol failure.
  if (value.startsWith('/')) return false;
  return true;
}

function isDriveFolderUrl(url?: string | null): boolean {
  const value = String(url || '').trim();
  if (!value || /1DRV_/i.test(value)) return false;
  if (!/\/folders\//i.test(value)) return false;
  return isRealGoogleDriveUrl(value);
}

/** A file is an https file link or a real upload. A folder URL is not a file. data: is never a file. */
function isSendableFileUrl(url?: string | null): boolean {
  const value = String(url || '').trim();
  if (!value || isInlineDataProof(value)) return false;
  if (/\/folders\//i.test(value)) return false;
  if (value.startsWith('/uploads/')) return true;
  return isDurableHttpsProofUrl(value);
}

function attachmentFileUrl(item: unknown): string {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  const record = item as { url?: string; previewUrl?: string; driveUrl?: string; downloadUrl?: string };
  return String(record.driveUrl || record.downloadUrl || record.url || record.previewUrl || '').trim();
}

function hasSendableFile(input: EvaluateDispatchInput, proof: string): boolean {
  if (isSendableFileUrl(proof)) return true;
  if ((input.assetUrls || []).some((url) => isSendableFileUrl(url))) return true;
  const attachments = [...(input.attachments || []), ...(input.task?.attachments || [])];
  return attachments.some((item) => isSendableFileUrl(attachmentFileUrl(item)));
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
    effectiveTo: verdict.effectiveTo,
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

  const effectiveTo = filterDispatchRecipients(email ? [email] : [], recipientStatus);
  const effectiveCc = filterDispatchRecipients(input.cc, recipientStatus);
  const resolved = resolveDispatchProofAndFolder({
    pastedProof: input.proofUrl,
    storedProof: input.task?.proofUrl,
    driveFolderUrl: input.driveFolderUrl,
    storedFolderUrl: input.task?.driveFolderUrl,
  });
  const folderUrl = resolved.driveFolderUrl;
  const suppliedProof = resolved.proofUrl;

  // Fixed order: role, recipient, proof, Drive folder AND a file, kill switch.
  let reason = '';
  if (full && !actorIsTaskReviewer(input.actor, input.task)) {
    reason = DISPATCH_REASON.role;
  } else if (recipientStatus === 'unresolved') {
    reason = DISPATCH_REASON.recipient;
  } else if (full && explicitBadProof(suppliedProof)) {
    reason = DISPATCH_REASON.proof;
  } else if (full && !(isDriveFolderUrl(folderUrl) && hasSendableFile(input, suppliedProof))) {
    reason = DISPATCH_REASON.file;
  } else if (outboundTurnedOff(input)) {
    reason = DISPATCH_REASON.outbound;
  }

  return {
    allowed: reason === '',
    reason,
    recipientStatus,
    recipientId,
    effectiveTo,
    effectiveCc,
  };
}
