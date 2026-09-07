/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * User Notification Preferences Repository
 * Fail-closed PostgreSQL persistence in production/staging with local file fallback in offline dev/test.
 */

import fs from 'fs';
import path from 'path';

export interface UserNotificationPreferences {
  userId: string;
  workspaceId?: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferredChannel: 'both' | 'email' | 'sms' | 'none';
  quietHoursStart: string; // '17:00' (5:00 PM EST default end of business)
  quietHoursEnd: string;   // '09:00' (9:00 AM EST default start of business)
  timezone: string;        // 'America/New_York'
  updatedAt: string;
}

const DEFAULT_PREFERENCES: Omit<UserNotificationPreferences, 'userId' | 'updatedAt'> = {
  workspaceId: 'ws_wilmington',
  emailEnabled: true,
  smsEnabled: true,
  preferredChannel: 'both',
  quietHoursStart: '17:00',
  quietHoursEnd: '09:00',
  timezone: 'America/New_York'
};

let memoryPreferencesCache: Record<string, UserNotificationPreferences> = {};

export function isDbRequired(): boolean {
  const driver = (process.env.PERSISTENCE_DRIVER || process.env.STORAGE_DRIVER || '').toLowerCase();
  if (driver === 'postgres' || driver === 'database') {
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
    const { getDbPool: getPool, storageDriver } = await import('./repositories.js');
    if (storageDriver === 'database') {
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
        preferredChannel: row.preferred_channel || 'both',
        quietHoursStart: row.quiet_hours_start || '17:00',
        quietHoursEnd: row.quiet_hours_end || '09:00',
        timezone: row.timezone || 'America/New_York',
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
          preferredChannel: row.preferred_channel || 'both',
          quietHoursStart: row.quiet_hours_start || '17:00',
          quietHoursEnd: row.quiet_hours_end || '09:00',
          timezone: row.timezone || 'America/New_York',
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
        quiet_hours_start, quiet_hours_end, timezone, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        preferred_channel = EXCLUDED.preferred_channel,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()`,
      [
        updated.userId,
        updated.workspaceId || 'ws_wilmington',
        updated.emailEnabled,
        updated.smsEnabled,
        updated.preferredChannel,
        updated.quietHoursStart,
        updated.quietHoursEnd,
        updated.timezone
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
          quiet_hours_start, quiet_hours_end, timezone, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          email_enabled = EXCLUDED.email_enabled,
          sms_enabled = EXCLUDED.sms_enabled,
          preferred_channel = EXCLUDED.preferred_channel,
          quiet_hours_start = EXCLUDED.quiet_hours_start,
          quiet_hours_end = EXCLUDED.quiet_hours_end,
          timezone = EXCLUDED.timezone,
          updated_at = NOW()`,
        [
          updated.userId,
          updated.workspaceId || 'ws_wilmington',
          updated.emailEnabled,
          updated.smsEnabled,
          updated.preferredChannel,
          updated.quietHoursStart,
          updated.quietHoursEnd,
          updated.timezone
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
          quiet_hours_start, quiet_hours_end, timezone, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          email_enabled = EXCLUDED.email_enabled,
          sms_enabled = EXCLUDED.sms_enabled,
          preferred_channel = EXCLUDED.preferred_channel,
          quiet_hours_start = EXCLUDED.quiet_hours_start,
          quiet_hours_end = EXCLUDED.quiet_hours_end,
          timezone = EXCLUDED.timezone,
          updated_at = NOW()`,
        [
          updated.userId,
          updated.workspaceId || 'ws_wilmington',
          updated.emailEnabled,
          updated.smsEnabled,
          updated.preferredChannel,
          updated.quietHoursStart,
          updated.quietHoursEnd,
          updated.timezone
        ]
      ).catch(e => console.warn('[NotificationPreferencesRepo] Async DB sync error:', e));
    }
  }).catch(() => {});

  return updated;
}

export function _clearMemoryPreferencesCacheForTesting(): void {
  memoryPreferencesCache = {};
}
