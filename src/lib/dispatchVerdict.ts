/**
 * Display of the server dispatch-check verdict.
 * The allowlist rule itself lives only in evaluateDispatch.
 */
export type DispatchRecipientStatus = 'directory' | 'allowlisted_prove' | 'unresolved';

export type DispatchVerdictView = {
  allowed: boolean;
  reason: string;
  recipientStatus: DispatchRecipientStatus;
  recipientId?: string | null;
  effectiveCc?: string[];
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
