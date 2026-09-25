/**
 * Display of the server dispatch-check verdict.
 * The allowlist rule itself lives only in evaluateDispatch.
 */
export type DispatchRecipientStatus = 'directory' | 'allowlisted_prove' | 'unresolved';
export type DispatchRecipientBlockReason = 'missing_email' | 'directory_unresolved' | 'test_recipient_policy' | null;
export type DispatchOutboundPolicy = {
  mode: 'disabled' | 'hold' | 'live';
  /** Transport eligibility only; the full dispatch verdict still controls sending. */
  allowed: boolean;
  reason: string;
};

export type DispatchVerdictView = {
  allowed: boolean;
  reason: string;
  recipientStatus: DispatchRecipientStatus;
  recipientId?: string | null;
  effectiveTo?: string[];
  effectiveCc?: string[];
  recipientBlockReason?: DispatchRecipientBlockReason;
  outboundPolicy?: DispatchOutboundPolicy;
};

export function dispatchAssuranceLabel(
  status?: DispatchRecipientStatus | null
): 'Verified Contact' | 'Allowlisted (prove)' | null {
  if (status === 'directory') return 'Verified Contact';
  if (status === 'allowlisted_prove') return 'Allowlisted (prove)';
  return null;
}

/** Drawer Approve & Notify and modal Send: directory or allowlisted prove, from the server. */
export function dispatchRecipientConfirmed(status?: DispatchRecipientStatus | null): boolean {
  return status === 'directory' || status === 'allowlisted_prove';
}
