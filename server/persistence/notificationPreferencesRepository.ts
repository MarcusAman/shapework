/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * User Notification Preferences Repository
 * Fail-closed PostgreSQL persistence in production/staging with local file fallback in offline dev/test.
 */

import fs from 'fs';
import path from 'path';
import { getStorageDriver } from './repositories.js';

export interface UserNotificationPreferences {
  userId: string;
  workspaceId?: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferredChannel: 'both' | 'email' | 'sms' | 'none';
  quietHoursStart: string; // '17:00' (5:00 PM EST default end of business)
  quietHoursEnd: string;   // '09:00' (9:00 AM EST default start of business)
  timezone: string;        // 'America/New_York'
  /** Agent-facing marketing channels — default OFF until Melissa/ops enables. */
  intakeConfirmedEnabled: boolean;
  photoRequestEnabled: boolean;
  materialsReadyEnabled: boolean;
  missingInfoEnabled: boolean;
  /** Agent-facing digests only. BIC/Ryan ops-critical digests use broker override (not gated here). */
  digestsEnabled: boolean;
  updatedAt: string;
}

export type AgentOutboundMessageType =
  | 'intake_confirmed'
  | 'photo_request'
  | 'materials_ready'
  | 'missing_info'
  | 'address_request'
  | 'intake_missing_info_acknowledgment'
  | 'digest'
  | 'sms';

const DEFAULT_PREFERENCES: Omit<UserNotificationPreferences, 'userId' | 'updatedAt'> = {
  workspaceId: 'ws_wilmington',
  emailEnabled: false,
  smsEnabled: false,
  preferredChannel: 'none',
  quietHoursStart: '17:00',
  quietHoursEnd: '09:00',
  timezone: 'America/New_York',
  intakeConfirmedEnabled: false,
  photoRequestEnabled: false,
  materialsReadyEnabled: false,
  missingInfoEnabled: false,
  digestsEnabled: false,
};

let memoryPreferencesCache: Record<string, UserNotificationPreferences> = {};

export function isDbRequired(): boolean {
  if (getStorageDriver() === 'database') {
    return true;
  }
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  if (isTest) {
    return false;
  }
  const env = (process.env.APP_ENV || process.env.APP_MODE || process.env.NODE_ENV || '').toLowerCase();
  return env === 'production' || env === 'staging' || env === 'uat';
}

function getDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'user_notification_preferences.json');
}

function loadAllPreferencesFromFile(): Record<string, UserNotificationPreferences> {
  const filePath = getDataFilePath();
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function persistAllPreferencesToFile(data: Record<string, UserNotificationPreferences>): void {
  const filePath = getDataFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function getDbPool() {
  if (typeof window !== 'undefined') return null;
  try {
    const { getDbPool: getPool, getStorageDriver: driver } = await import('./repositories.js');
    if (driver() === 'database') {
      return getPool();
    }
    return null;
  } catch {
    return null;
  }
}

export function resetNotificationPreferencesCacheForTesting(): void {
  memoryPreferencesCache = {};
}

/** Distinguish an explicit opt-out from the default returned for an unconfigured requester. */
export async function hasStoredNotificationPreferencesAsync(userId: string, workspaceId: string): Promise<boolean> {
  if (isDbRequired()) {
    const pool = await getDbPool();
    if (!pool) throw new Error('Notification preference storage is unavailable');
    const result = await pool.query(
      'SELECT 1 FROM user_notification_preferences WHERE user_id = $1 AND workspace_id = $2 LIMIT 1',
      [userId, workspaceId]
    );
    return result.rows.length > 0;
  }
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const file = path.join(process.cwd(), tenantDir, 'user_notification_preferences.json');
  if (!fs.existsSync(file)) return false;
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'))[userId];
  return Boolean(stored && stored.workspaceId === workspaceId);
}

export async function getUserNotificationPreferencesAsync(userId: string): Promise<UserNotificationPreferences> {
  if (isDbRequired()) {
    const pool = await getDbPool();
    if (!pool) {
      throw new Error('[NotificationPreferencesRepo] PostgreSQL connection is required in production/staging (fail-closed mode).');
    }
    const res = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [userId]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const pref: UserNotificationPreferences = {
        userId: row.user_id,
        workspaceId: row.workspace_id || 'ws_wilmington',
        emailEnabled: Boolean(row.email_enabled),
        smsEnabled: Boolean(row.sms_enabled),
        preferredChannel: row.preferred_channel || 'none',
        quietHoursStart: row.quiet_hours_start || '17:00',
        quietHoursEnd: row.quiet_hours_end || '09:00',
        timezone: row.timezone || 'America/New_York',
        intakeConfirmedEnabled: row.intake_confirmed_enabled == null ? false : Boolean(row.intake_confirmed_enabled),
        photoRequestEnabled: row.photo_request_enabled == null ? false : Boolean(row.photo_request_enabled),
        materialsReadyEnabled: row.materials_ready_enabled == null ? false : Boolean(row.materials_ready_enabled),
        missingInfoEnabled: row.missing_info_enabled == null ? false : Boolean(row.missing_info_enabled),
        digestsEnabled: row.digests_enabled == null ? false : Boolean(row.digests_enabled),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      };
      memoryPreferencesCache[userId] = pref;
      return pref;
    }
    // Return default preference for unconfigured user
    const def: UserNotificationPreferences = {
      userId,
      ...DEFAULT_PREFERENCES,
      updatedAt: new Date().toISOString()
    };
    memoryPreferencesCache[userId] = def;
    return def;
  }

  // Local/Dev/Offline fallback
  const pool = await getDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM user_notification_preferences WHERE user_id = $1',
        [userId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const pref: UserNotificationPreferences = {
          userId: row.user_id,
          workspaceId: row.workspace_id || 'ws_wilmington',
          emailEnabled: Boolean(row.email_enabled),
          smsEnabled: Boolean(row.sms_enabled),
          preferredChannel: row.preferred_channel || 'none',
          quietHoursStart: row.quiet_hours_start || '17:00',
          quietHoursEnd: row.quiet_hours_end || '09:00',
          timezone: row.timezone || 'America/New_York',
          intakeConfirmedEnabled: row.intake_confirmed_enabled == null ? false : Boolean(row.intake_confirmed_enabled),
          photoRequestEnabled: row.photo_request_enabled == null ? false : Boolean(row.photo_request_enabled),
          materialsReadyEnabled: row.materials_ready_enabled == null ? false : Boolean(row.materials_ready_enabled),
          missingInfoEnabled: row.missing_info_enabled == null ? false : Boolean(row.missing_info_enabled),
          digestsEnabled: row.digests_enabled == null ? false : Boolean(row.digests_enabled),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        };
        memoryPreferencesCache[userId] = pref;
        return pref;
      }
    } catch (err) {
      console.warn('[NotificationPreferencesRepo] DB read error in local mode, falling back to file:', err);
    }
  }

  return getUserNotificationPreferences(userId);
}

export async function saveUserNotificationPreferencesAsync(
  updates: Partial<UserNotificationPreferences> & { userId: string }
): Promise<UserNotificationPreferences> {
  const existing = await getUserNotificationPreferencesAsync(updates.userId);
  const updated: UserNotificationPreferences = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (isDbRequired()) {
    const pool = await getDbPool();
    if (!pool) {
      throw new Error('[NotificationPreferencesRepo] PostgreSQL connection is required in production/staging (fail-closed mode).');
    }
    await pool.query(
      `INSERT INTO user_notification_preferences (
        user_id, workspace_id, email_enabled, sms_enabled, preferred_channel,
        quiet_hours_start, quiet_hours_end, timezone,
        intake_confirmed_enabled, photo_request_enabled, materials_ready_enabled,
        missing_info_enabled, digests_enabled, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        preferred_channel = EXCLUDED.preferred_channel,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        intake_confirmed_enabled = EXCLUDED.intake_confirmed_enabled,
        photo_request_enabled = EXCLUDED.photo_request_enabled,
        materials_ready_enabled = EXCLUDED.materials_ready_enabled,
        missing_info_enabled = EXCLUDED.missing_info_enabled,
        digests_enabled = EXCLUDED.digests_enabled,
        updated_at = NOW()`,
      [
        updated.userId,
        updated.workspaceId || 'ws_wilmington',
        updated.emailEnabled,
        updated.smsEnabled,
        updated.preferredChannel,
        updated.quietHoursStart,
        updated.quietHoursEnd,
        updated.timezone,
        Boolean(updated.intakeConfirmedEnabled),
        Boolean(updated.photoRequestEnabled),
        Boolean(updated.materialsReadyEnabled),
        Boolean(updated.missingInfoEnabled),
        Boolean(updated.digestsEnabled),
      ]
    );
    memoryPreferencesCache[updated.userId] = updated;
    return updated;
  }

  // Local/Dev/Offline mode
  const pool = await getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO user_notification_preferences (
        user_id, workspace_id, email_enabled, sms_enabled, preferred_channel,
        quiet_hours_start, quiet_hours_end, timezone,
        intake_confirmed_enabled, photo_request_enabled, materials_ready_enabled,
        missing_info_enabled, digests_enabled, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        preferred_channel = EXCLUDED.preferred_channel,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        intake_confirmed_enabled = EXCLUDED.intake_confirmed_enabled,
        photo_request_enabled = EXCLUDED.photo_request_enabled,
        materials_ready_enabled = EXCLUDED.materials_ready_enabled,
        missing_info_enabled = EXCLUDED.missing_info_enabled,
        digests_enabled = EXCLUDED.digests_enabled,
        updated_at = NOW()`,
      [
        updated.userId,
        updated.workspaceId || 'ws_wilmington',
        updated.emailEnabled,
        updated.smsEnabled,
        updated.preferredChannel,
        updated.quietHoursStart,
        updated.quietHoursEnd,
        updated.timezone,
        Boolean(updated.intakeConfirmedEnabled),
        Boolean(updated.photoRequestEnabled),
        Boolean(updated.materialsReadyEnabled),
        Boolean(updated.missingInfoEnabled),
        Boolean(updated.digestsEnabled),
      ]
      );
    } catch (err) {
      console.warn('[NotificationPreferencesRepo] DB write error in local mode, persisting to file:', err);
    }
  }

  // Update memory and file store in offline mode
  memoryPreferencesCache[updated.userId] = updated;
  const all = loadAllPreferencesFromFile();
  all[updated.userId] = updated;
  persistAllPreferencesToFile(all);

  return updated;
}

export function getUserNotificationPreferences(userId: string): UserNotificationPreferences {
  if (memoryPreferencesCache[userId]) {
    return memoryPreferencesCache[userId];
  }
  const all = loadAllPreferencesFromFile();
  if (all[userId]) {
    memoryPreferencesCache[userId] = all[userId];
    return all[userId];
  }
  // Return default profile
  const def: UserNotificationPreferences = {
    userId,
    ...DEFAULT_PREFERENCES,
    updatedAt: new Date().toISOString()
  };
  memoryPreferencesCache[userId] = def;
  return def;
}

export function saveUserNotificationPreferences(
  updates: Partial<UserNotificationPreferences> & { userId: string }
): UserNotificationPreferences {
  if (isDbRequired()) {
    throw new Error('[NotificationPreferencesRepo] Synchronous persistence is prohibited when PostgreSQL persistence is required. Use saveUserNotificationPreferencesAsync.');
  }

  const all = loadAllPreferencesFromFile();
  const existing = memoryPreferencesCache[updates.userId] || all[updates.userId] || {
    userId: updates.userId,
    ...DEFAULT_PREFERENCES,
    updatedAt: new Date().toISOString()
  };

  const updated: UserNotificationPreferences = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  memoryPreferencesCache[updates.userId] = updated;
  all[updates.userId] = updated;
  persistAllPreferencesToFile(all);

  // Background DB sync if available
  getDbPool().then(pool => {
    if (pool) {
      pool.query(
        `INSERT INTO user_notification_preferences (
        user_id, workspace_id, email_enabled, sms_enabled, preferred_channel,
        quiet_hours_start, quiet_hours_end, timezone,
        intake_confirmed_enabled, photo_request_enabled, materials_ready_enabled,
        missing_info_enabled, digests_enabled, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        preferred_channel = EXCLUDED.preferred_channel,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        intake_confirmed_enabled = EXCLUDED.intake_confirmed_enabled,
        photo_request_enabled = EXCLUDED.photo_request_enabled,
        materials_ready_enabled = EXCLUDED.materials_ready_enabled,
        missing_info_enabled = EXCLUDED.missing_info_enabled,
        digests_enabled = EXCLUDED.digests_enabled,
        updated_at = NOW()`,
      [
        updated.userId,
        updated.workspaceId || 'ws_wilmington',
        updated.emailEnabled,
        updated.smsEnabled,
        updated.preferredChannel,
        updated.quietHoursStart,
        updated.quietHoursEnd,
        updated.timezone,
        Boolean(updated.intakeConfirmedEnabled),
        Boolean(updated.photoRequestEnabled),
        Boolean(updated.materialsReadyEnabled),
        Boolean(updated.missingInfoEnabled),
        Boolean(updated.digestsEnabled),
      ]
      ).catch(e => console.warn('[NotificationPreferencesRepo] Async DB sync error:', e));
    }
  }).catch(() => {});

  return updated;
}

export function _clearMemoryPreferencesCacheForTesting(): void {
  memoryPreferencesCache = {};
}

/** Map outbox messageType → member pref. Master OUTBOUND_MASTER_MODE is checked upstream. */
export function isAgentOutboundTypeEnabled(
  prefs: UserNotificationPreferences,
  messageType: string,
  channel: 'email' | 'sms' | 'both' = 'email'
): boolean {
  const t = String(messageType || '').toLowerCase();
  if (channel === 'sms' || t === 'sms') {
    return Boolean(prefs.smsEnabled);
  }
  if (t.includes('intake_confirm') || t === 'intake_confirmed') {
    return Boolean(prefs.intakeConfirmedEnabled) && prefs.emailEnabled !== false;
  }
  if (t.includes('photo_request') || t.includes('photos_needed')) {
    return Boolean(prefs.photoRequestEnabled) && prefs.emailEnabled !== false;
  }
  if (t.includes('delivery_complete') || t.includes('materials_ready')) {
    return Boolean(prefs.materialsReadyEnabled) && prefs.emailEnabled !== false;
  }
  if (
    t.includes('missing_info') ||
    t.includes('address_request') ||
    t.includes('ask_missing') ||
    t.includes('intake_missing')
  ) {
    return Boolean(prefs.missingInfoEnabled) && prefs.emailEnabled !== false;
  }
  if (t.includes('digest')) {
    // Agent-facing digests only — BIC/Ryan ops digests must not call this helper without brokerOverride.
    return Boolean(prefs.digestsEnabled) && prefs.emailEnabled !== false;
  }
  // Unknown marketing types: fail closed for agent outbound
  return false;
}

export async function canSendAgentOutbound(args: {
  userId?: string;
  messageType: string;
  channel?: 'email' | 'sms' | 'both';
  brokerOverride?: boolean;
}): Promise<{ allowed: boolean; reason?: string }> {
  if (args.brokerOverride) {
    return { allowed: true, reason: 'broker_override' };
  }
  const userId = args.userId;
  if (!userId) {
    return { allowed: false, reason: 'missing_user' };
  }
  const prefs = await getUserNotificationPreferencesAsync(userId);
  const ok = isAgentOutboundTypeEnabled(prefs, args.messageType, args.channel || 'email');
  return ok
    ? { allowed: true }
    : { allowed: false, reason: `member_pref_disabled:${args.messageType}` };
}
