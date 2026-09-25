/**
 * One dispatch verdict for Approve & Notify.
 * Drawer, Confirm Requester, the send modal, send-questions, and
 * approve-and-dispatch all use this. Do not reimplement the rule on the client.
 */
import { actorIsTaskReviewer, type MarketingGateActor, type MarketingGateTask } from '../../src/lib/marketingApproveNotifyCapabilities.js';
import {
  EXPLICIT_OUTBOUND_ALLOWLIST,
  isAllowlistedProveRecipient,
  isProductionApp,
} from '../../src/lib/outboundAllowlistGate.js';
import { isDurableHttpsProofUrl, isRealGoogleDriveUrl, internalProofFilename, resolveDurableDeliveryAssets } from './askNoraDriveDelivery.js';
import { resolveServerCanonicalRecipient } from './canonicalRecipientService.js';
import { pastedDriveFolderId, resolveDispatchProofAndFolder } from '../../src/lib/proofPrecedence.js';
import { GoogleDriveService } from './googleDriveService.js';
import { checkOutbound } from '../email/outboundGate.js';
import { GOOGLE_DRIVE_NOT_CONNECTED } from './driveConnectionReason.js';

export { GOOGLE_DRIVE_NOT_CONNECTED } from './driveConnectionReason.js';

export function driveCreateFailureReason(detail?: string | null): string {
  const raw = String(detail || '').trim();
  if (raw === GOOGLE_DRIVE_NOT_CONNECTED) return GOOGLE_DRIVE_NOT_CONNECTED;
  const why = (raw || 'Drive folder create failed').replace(/\.+$/, '');
  return `Couldn't create the Drive folder: ${why}.`;
}

export const DISPATCH_REASON = {
  role: 'Only the task reviewer may approve and notify.',
  proof: 'Proof link must use https.',
  file: 'No Drive folder and no file to send.',
  durable: 'The finished asset is missing or does not belong to this task and workspace.',
  emptyFolder: 'Drive folder is empty.',
  unreadFolder: "Can't read that Drive folder.",
  recipient: 'This recipient is not allowed.',
  outbound: 'Outbound is turned off.',
} as const;

export type DispatchRecipientStatus = 'directory' | 'allowlisted_prove' | 'unresolved';

export type DroppedDispatchAddress = { email: string; reason: string };

export const DROPPED_NOT_ON_ALLOWLIST = 'Not on the outbound allowlist.';

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
  /** Addresses removed from To or CC, with why. */
  dropped: DroppedDispatchAddress[];
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
  if (recipientStatus === 'unresolved') return [];
  if (isProductionApp() && recipientStatus === 'directory') return cleaned;
  const allow = new Set(EXPLICIT_OUTBOUND_ALLOWLIST.map((email) => email.toLowerCase()));
  return cleaned.filter((email) => allow.has(email));
}

export function droppedDispatchAddresses(
  addresses: string[] | null | undefined,
  kept: string[],
  recipientStatus: DispatchRecipientStatus
): DroppedDispatchAddress[] {
  const keep = new Set(kept);
  const reason = recipientStatus === 'unresolved' ? DISPATCH_REASON.recipient : DROPPED_NOT_ON_ALLOWLIST;
  return cleanList(addresses)
    .filter((email) => !keep.has(email))
    .map((email) => ({ email, reason }));
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
  const master = process.env.OUTBOUND_MASTER_MODE;
  if (master == null || String(master).trim() === '') return 'disabled';
  return String(master).toLowerCase().trim();
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

/**
 * Sendable only when this folder id lists at least one file.
 * Task attachments and uploaded photos do not count. They have to be copied into the folder first.
 * A failed list (no credentials, 404, permission, or any other error) stays blocked.
 */
async function folderContentsReason(folderId: string, workspaceId?: string | null): Promise<string> {
  try {
    const listed = await GoogleDriveService.listFilesInFolder(folderId, String(workspaceId || 'ws_wilmington'));
    if (!listed.ok) return DISPATCH_REASON.unreadFolder;
    if (!listed.files.length) return DISPATCH_REASON.emptyFolder;
    return '';
  } catch {
    return DISPATCH_REASON.unreadFolder;
  }
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
    case DISPATCH_REASON.emptyFolder:
      return 'DRIVE_FOLDER_EMPTY';
    case DISPATCH_REASON.unreadFolder:
      return 'DRIVE_FOLDER_UNREADABLE';
    case DISPATCH_REASON.recipient:
      return 'RECIPIENT_UNRESOLVED';
    case DISPATCH_REASON.outbound:
      return 'OUTBOUND_DISABLED';
    default:
      return reason === GOOGLE_DRIVE_NOT_CONNECTED || reason.startsWith("Couldn't create the Drive folder:")
        ? 'DRIVE_FOLDER_CREATE_FAILED'
        : 'DISPATCH_BLOCKED';
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
    dropped: verdict.dropped,
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

  const outboundMode = readOutboundMode(input);
  let recipientStatus: DispatchRecipientStatus = 'unresolved';
  let recipientId: string | null = null;
  if (directory) {
    recipientStatus = 'directory';
    recipientId = directory.id;
  } else if (isAllowlistedProveRecipient(email, outboundMode)) {
    recipientStatus = 'allowlisted_prove';
    recipientId = null;
  }

  const requestedTo = email ? [email] : [];
  const effectiveTo = filterDispatchRecipients(requestedTo, recipientStatus);
  const effectiveCc = filterDispatchRecipients(input.cc, recipientStatus);
  const dropped = [
    ...droppedDispatchAddresses(requestedTo, effectiveTo, recipientStatus),
    ...droppedDispatchAddresses(input.cc, effectiveCc, recipientStatus),
  ];
  const outboundGate = checkOutbound({
    to: effectiveTo.length ? effectiveTo : (email ? [email] : []),
    cc: effectiveCc,
    channel: input.channel || 'email',
    source: 'evaluateDispatch',
    mode: outboundMode,
  });
  // Kill (disabled/unset) always blocks. Hold blocks a send that checkOutbound would
  // not queue for the allowlist. A production directory verdict stays allowed so
  // Approve & Notify can record a held row; the transport still will not deliver it.
  const outboundBlocked = (() => {
    if (outboundMode === 'disabled' || outboundGate.reason === 'outbound_disabled') return true;
    if (outboundMode !== 'hold' || outboundGate.allowed || outboundGate.effectiveTo.length > 0) return false;
    if (isProductionApp() && recipientStatus === 'directory') return false;
    return true;
  })();
  const resolved = resolveDispatchProofAndFolder({
    pastedProof: input.proofUrl,
    storedProof: input.task?.proofUrl,
    driveFolderUrl: input.driveFolderUrl,
    storedFolderUrl: input.task?.driveFolderUrl,
  });
  const folderUrl = resolved.driveFolderUrl;
  const suppliedProof = resolved.proofUrl;
  const pastedFolderId = pastedDriveFolderId(input.proofUrl);
  const explicitFolderId = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '';

  // Internal proofs are verified against durable storage; Drive remains an optional source.
  let reason = '';
  if (full && !actorIsTaskReviewer(input.actor, input.task)) {
    reason = DISPATCH_REASON.role;
  } else if (recipientStatus === 'unresolved') {
    reason = DISPATCH_REASON.recipient;
  } else if (full && explicitBadProof(suppliedProof)) {
    reason = DISPATCH_REASON.proof;
  } else if (full && internalProofFilename(suppliedProof)) {
    reason = (await resolveDurableDeliveryAssets(input.task, suppliedProof)).length ? '' : DISPATCH_REASON.durable;
  } else if (full && suppliedProof && !isRealGoogleDriveUrl(suppliedProof)) {
    reason = DISPATCH_REASON.durable;
  } else if (full && pastedFolderId) {
    reason = await folderContentsReason(pastedFolderId, input.task?.workspaceId);
  } else if (full && isDriveFolderUrl(folderUrl) && explicitFolderId) {
    reason = await folderContentsReason(explicitFolderId, input.task?.workspaceId);
  } else if (full) {
    reason = DISPATCH_REASON.durable;
  } else if (outboundBlocked) {
    reason = DISPATCH_REASON.outbound;
  }

  if (!reason && outboundBlocked) {
    reason = DISPATCH_REASON.outbound;
  }

  return {
    allowed: reason === '',
    reason,
    recipientStatus,
    recipientId,
    effectiveTo,
    effectiveCc,
    dropped,
  };
}
