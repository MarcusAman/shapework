import type { DispatchRecipientStatus } from './dispatchVerdict';

/**
 * Confirm Requester persist body.
 * Allowlist-only recipients store the email. A dir_* id is written only when
 * the server verdict says directory and supplies the real directory id.
 */
export function confirmRequesterWrite(
  agent: { id?: string; name: string; email: string; phone?: string | null },
  verdict: { recipientStatus: DispatchRecipientStatus; recipientId?: string | null }
): {
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  requesterEmail: string;
  requesterId: string | null;
  recipientKind: DispatchRecipientStatus;
} {
  const email = String(agent.email || '').trim().toLowerCase();
  const serverId = String(verdict.recipientId || '').trim();
  const directoryId = verdict.recipientStatus === 'directory' && serverId ? serverId : null;
  return {
    agentName: agent.name,
    agentEmail: email,
    agentPhone: agent.phone ? String(agent.phone) : null,
    requesterEmail: email,
    requesterId: directoryId,
    recipientKind: verdict.recipientStatus,
  };
}
