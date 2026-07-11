import crypto from 'crypto';
import { HeadlessAction, HeadlessActionType, HeadlessChannel, StaffNotificationPreference } from './headlessActionTypes.js';
import { logHeadlessAudit } from './headlessActionAudit.js';

/**
 * Creates a new secure headless action and hashes its token.
 */
export function createHeadlessAction(
  dbState: any,
  workspaceId: string,
  actionType: HeadlessActionType,
  sourceType: HeadlessAction['sourceType'],
  sourceId: string,
  options: {
    recipientStaffMemberId?: string;
    recipientClientId?: string;
    recipientAgentId?: string;
    channel?: HeadlessChannel;
  } = {}
): { token: string; action: HeadlessAction } {
  const token = crypto.randomBytes(32).toString('hex');
  const secureTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour expiry

  const action: HeadlessAction = {
    id: `ha_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    workspaceId,
    actionType,
    sourceType,
    sourceId,
    recipientStaffMemberId: options.recipientStaffMemberId,
    recipientClientId: options.recipientClientId,
    recipientAgentId: options.recipientAgentId,
    channel: options.channel || 'email',
    status: 'queued',
    secureTokenHash,
    expiresAt,
    createdAt: new Date().toISOString()
  };

  if (!dbState.headlessActions) dbState.headlessActions = [];
  dbState.headlessActions.push(action);

  logHeadlessAudit(
    dbState,
    'System',
    'system',
    `Created headless action ${action.id} of type ${actionType}`,
    'security'
  );

  return { token, action };
}

/**
 * Resolves a raw token to a HeadlessAction if valid and not expired.
 */
export function resolveHeadlessAction(dbState: any, token: string): HeadlessAction | null {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const actions = dbState.headlessActions || [];
  const action = actions.find((a: any) => a.secureTokenHash === tokenHash);

  if (!action) return null;

  if (new Date(action.expiresAt).getTime() < Date.now()) {
    action.status = 'expired';
    logHeadlessAudit(
      dbState,
      'System',
      'system',
      `Headless action ${action.id} expired`,
      'security'
    );
    return null;
  }

  if (action.status === 'completed' || action.status === 'expired') {
    return null;
  }

  if (action.status === 'queued' || action.status === 'sent') {
    action.status = 'clicked';
    action.clickedAt = new Date().toISOString();
    logHeadlessAudit(
      dbState,
      'External',
      'external_user',
      `Headless action ${action.id} clicked`,
      'notifications'
    );
  }

  return action;
}

/**
 * Completes a headless action.
 */
export function completeHeadlessAction(dbState: any, token: string): boolean {
  if (!token) return false;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const actions = dbState.headlessActions || [];
  const action = actions.find((a: any) => a.secureTokenHash === tokenHash);

  if (action && action.status !== 'completed') {
    action.status = 'completed';
    action.completedAt = new Date().toISOString();
    logHeadlessAudit(
      dbState,
      'External',
      'external_user',
      `Headless action ${action.id} completed`,
      'notifications'
    );
    return true;
  }

  return false;
}

/**
 * Enforces quiet hours in user timezone.
 */
export function isWithinQuietHours(pref: StaffNotificationPreference, date: Date = new Date()): boolean {
  if (!pref.quietHoursStart || !pref.quietHoursEnd) return false;

  // Convert current time to timezone if specified, simple HH:MM match
  const options: Intl.DateTimeFormatOptions = {
    timeZone: pref.timezone || 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const timeString = formatter.format(date); // e.g. "23:15"

  const parseMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMin = parseMinutes(timeString);
  const startMin = parseMinutes(pref.quietHoursStart);
  const endMin = parseMinutes(pref.quietHoursEnd);

  if (startMin < endMin) {
    return currentMin >= startMin && currentMin <= endMin;
  } else {
    // Overlap midnight (e.g. 22:00 to 07:00)
    return currentMin >= startMin || currentMin <= endMin;
  }
}

/**
 * Resolves the channel for staff member.
 */
export function determineNotificationChannel(pref: StaffNotificationPreference): HeadlessChannel {
  if (!pref.emailEnabled && !pref.smsEnabled) return 'in_app';
  if (pref.preferredChannel === 'both') return 'email'; // V1 fallback preference
  if (pref.preferredChannel === 'sms' && pref.smsEnabled) return 'sms';
  if (pref.preferredChannel === 'email' && pref.emailEnabled) return 'email';
  return pref.emailEnabled ? 'email' : 'sms';
}
