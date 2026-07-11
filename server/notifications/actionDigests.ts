import { sendSmsNotification } from './smsProvider.js';

export type DigestType =
  | 'morning_action_digest'
  | 'owner_brief_digest'
  | 'end_of_day_blocked_work_digest';

export function renderDigestSms(
  type: DigestType,
  counts: { approvals: number; blocked: number; dueSoon: number; risks?: number; routed?: number },
  actionUrl: string
): string {
  switch (type) {
    case 'morning_action_digest':
      return `shapework: You have ${counts.approvals + counts.blocked + counts.dueSoon} items today — ${counts.approvals} approval, ${counts.blocked} blocked request, ${counts.dueSoon} due soon. Open: ${actionUrl}`;
    case 'owner_brief_digest':
      return `shapework: Owner Brief ready — ${counts.risks || 0} risks, ${counts.routed || 0} routed items, ${counts.approvals} approval needed. Open: ${actionUrl}`;
    case 'end_of_day_blocked_work_digest':
      return `shapework: End of day blocked work digest — ${counts.blocked} items remain blocked by missing info. Open: ${actionUrl}`;
    default:
      return `shapework: Digest notification. Open action board: ${actionUrl}`;
  }
}

export async function triggerDigestSms(
  dbState: any,
  to: string,
  type: DigestType,
  counts: { approvals: number; blocked: number; dueSoon: number; risks?: number; routed?: number },
  actionUrl: string
): Promise<{ success: boolean; message?: string }> {
  const body = renderDigestSms(type, counts, actionUrl);
  const result = await sendSmsNotification(dbState, to, body);
  return { success: result.success, message: result.messageId || result.error };
}
