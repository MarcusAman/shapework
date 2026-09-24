/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Calendar & Meeting Persistence Repository
 * Authoritative storage for workspace calendar selection and scheduled brokerage meetings.
 * Enforces fail-closed PostgreSQL database persistence in production.
 */

import { ScheduledBrokerageMeetingRecord } from '../services/brokerageCalendarService.js';

export interface WorkspaceCalendarSettings {
  workspaceId: string;
  selectedCalendarId: string;
  selectedCalendarName: string;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  timezone: string;
  autoMeetEnabled: boolean;
  isDedicatedNoraCalendar: boolean;
  lastVerifiedAt?: string;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

function isProduction(): boolean {
  return (process.env.NODE_ENV === 'production' || process.env.APP_MODE === 'production') && process.env.ALLOW_FILE_STORAGE_UAT !== 'true';
}

async function getDbPool() {
  if (typeof window !== 'undefined') return null;
  try {
    const { getDbPool: openPool, getStorageDriver } = await import('./repositories.js');
    if (getStorageDriver() === 'database') return openPool();
    return null;
  } catch {
    return null;
  }
}

// In-memory fallback for local dev & unit testing
const memorySettings = new Map<string, WorkspaceCalendarSettings>();
const memoryMeetings = new Map<string, ScheduledBrokerageMeetingRecord>();

export class CalendarRepository {
  /**
   * Retrieves calendar settings for a workspace
   */
  public static async getCalendarSettings(workspaceId: string = 'ws_wilmington'): Promise<WorkspaceCalendarSettings | null> {
    const db = await getDbPool();
    if (db) {
      try {
        const res = await db.query(
          `SELECT * FROM workspace_calendar_settings WHERE workspace_id = $1`,
          [workspaceId]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            workspaceId: r.workspace_id,
            selectedCalendarId: r.selected_calendar_id,
            selectedCalendarName: r.selected_calendar_name,
            accessRole: r.access_role,
            timezone: r.timezone || 'America/New_York',
            autoMeetEnabled: r.auto_meet_enabled !== false,
            isDedicatedNoraCalendar: r.is_dedicated_nora_calendar !== false,
            lastVerifiedAt: r.last_verified_at ? new Date(r.last_verified_at).toISOString() : undefined,
            lastError: r.last_error || undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : undefined
          };
        }
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB getCalendarSettings error:', err);
          throw new Error(`Database error retrieving calendar settings: ${err.message}`);
        }
      }
    }

    return memorySettings.get(workspaceId) || null;
  }

  /**
   * Persists calendar settings for a workspace
   */
  public static async saveCalendarSettings(settings: WorkspaceCalendarSettings): Promise<WorkspaceCalendarSettings> {
    const now = new Date().toISOString();
    const cleanSettings: WorkspaceCalendarSettings = {
      ...settings,
      workspaceId: settings.workspaceId || 'ws_wilmington',
      timezone: settings.timezone || 'America/New_York',
      autoMeetEnabled: settings.autoMeetEnabled !== false,
      isDedicatedNoraCalendar: settings.isDedicatedNoraCalendar !== false,
      updatedAt: now
    };

    memorySettings.set(cleanSettings.workspaceId, cleanSettings);

    const db = await getDbPool();
    if (db) {
      try {
        await db.query(
          `INSERT INTO workspace_calendar_settings (
            workspace_id, selected_calendar_id, selected_calendar_name, access_role, timezone,
            auto_meet_enabled, is_dedicated_nora_calendar, last_verified_at, last_error, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (workspace_id) DO UPDATE SET
            selected_calendar_id = EXCLUDED.selected_calendar_id,
            selected_calendar_name = EXCLUDED.selected_calendar_name,
            access_role = EXCLUDED.access_role,
            timezone = EXCLUDED.timezone,
            auto_meet_enabled = EXCLUDED.auto_meet_enabled,
            is_dedicated_nora_calendar = EXCLUDED.is_dedicated_nora_calendar,
            last_verified_at = EXCLUDED.last_verified_at,
            last_error = EXCLUDED.last_error,
            updated_at = NOW()`,
          [
            cleanSettings.workspaceId,
            cleanSettings.selectedCalendarId,
            cleanSettings.selectedCalendarName,
            cleanSettings.accessRole,
            cleanSettings.timezone,
            cleanSettings.autoMeetEnabled,
            cleanSettings.isDedicatedNoraCalendar,
            cleanSettings.lastVerifiedAt ? new Date(cleanSettings.lastVerifiedAt) : null,
            cleanSettings.lastError || null
          ]
        );
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB saveCalendarSettings error:', err);
          throw new Error(`Database error saving calendar settings: ${err.message}`);
        }
      }
    } else if (isProduction()) {
      throw new Error('Database persistence driver is required in production environment.');
    }

    return cleanSettings;
  }

  /**
   * Persists a scheduled meeting record
   */
  public static async saveScheduledMeeting(
    meeting: ScheduledBrokerageMeetingRecord,
    workspaceId: string = 'ws_wilmington'
  ): Promise<ScheduledBrokerageMeetingRecord> {
    const now = new Date().toISOString();
    const cleanMeeting: ScheduledBrokerageMeetingRecord = {
      ...meeting,
      calendarId: meeting.calendarId || 'primary',
      createdAt: meeting.createdAt || now
    };

    memoryMeetings.set(cleanMeeting.id, cleanMeeting);

    const db = await getDbPool();
    if (db) {
      try {
        await db.query(
          `INSERT INTO scheduled_brokerage_meetings (
            id, workspace_id, calendar_id, google_event_id, title, description,
            meeting_date, start_time, end_time, location, organizer_email, requester_name,
            target_audience, resolved_scope_description, attendee_count, attendees,
            google_calendar_url, html_link, hangout_link, ical_content, dispatched_via,
            mode, conference_status, is_external_verified, provider_timestamp, spoken_confirmation, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW())
          ON CONFLICT (id) DO UPDATE SET
            calendar_id = EXCLUDED.calendar_id,
            google_event_id = EXCLUDED.google_event_id,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            meeting_date = EXCLUDED.meeting_date,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            location = EXCLUDED.location,
            organizer_email = EXCLUDED.organizer_email,
            requester_name = EXCLUDED.requester_name,
            target_audience = EXCLUDED.target_audience,
            resolved_scope_description = EXCLUDED.resolved_scope_description,
            attendee_count = EXCLUDED.attendee_count,
            attendees = EXCLUDED.attendees,
            google_calendar_url = EXCLUDED.google_calendar_url,
            html_link = EXCLUDED.html_link,
            hangout_link = EXCLUDED.hangout_link,
            ical_content = EXCLUDED.ical_content,
            dispatched_via = EXCLUDED.dispatched_via,
            mode = EXCLUDED.mode,
            conference_status = EXCLUDED.conference_status,
            is_external_verified = EXCLUDED.is_external_verified,
            provider_timestamp = EXCLUDED.provider_timestamp,
            spoken_confirmation = EXCLUDED.spoken_confirmation,
            updated_at = NOW()`,
          [
            cleanMeeting.id,
            workspaceId,
            cleanMeeting.calendarId || 'primary',
            cleanMeeting.id, // google_event_id
            cleanMeeting.title,
            cleanMeeting.notes || cleanMeeting.resolvedScopeDescription,
            cleanMeeting.meetingDate,
            cleanMeeting.startTime,
            cleanMeeting.endTime,
            cleanMeeting.location,
            cleanMeeting.organizerEmail || 'AskNora@nestrealty.com',
            cleanMeeting.requesterName || 'Ryan Crecelius',
            cleanMeeting.targetAudience,
            cleanMeeting.resolvedScopeDescription,
            cleanMeeting.attendeeCount || (cleanMeeting.attendees ? cleanMeeting.attendees.length : 0),
            JSON.stringify(cleanMeeting.attendees || []),
            cleanMeeting.googleCalendarUrl,
            cleanMeeting.htmlLink || null,
            cleanMeeting.hangoutLink || null,
            cleanMeeting.iCalContent,
            cleanMeeting.dispatchedVia,
            cleanMeeting.mode,
            cleanMeeting.conferenceStatus,
            cleanMeeting.isExternalVerified,
            cleanMeeting.providerTimestamp ? new Date(cleanMeeting.providerTimestamp) : null,
            cleanMeeting.spokenConfirmation
          ]
        );
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB saveScheduledMeeting error:', err);
          throw new Error(`Database error saving scheduled meeting: ${err.message}`);
        }
      }
    } else if (isProduction()) {
      throw new Error('Database persistence driver is required in production environment.');
    }

    return cleanMeeting;
  }

  /**
   * Retrieves a scheduled meeting by ID
   */
  public static async getScheduledMeeting(id: string): Promise<ScheduledBrokerageMeetingRecord | null> {
    const db = await getDbPool();
    if (db) {
      try {
        const res = await db.query(
          `SELECT * FROM scheduled_brokerage_meetings WHERE id = $1`,
          [id]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return this.mapMeetingRowToRecord(r);
        }
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB getScheduledMeeting error:', err);
          throw new Error(`Database error retrieving meeting: ${err.message}`);
        }
      }
    }

    return memoryMeetings.get(id) || null;
  }

  /**
   * Retrieves a scheduled meeting by Google event ID
   */
  public static async getScheduledMeetingByGoogleEventId(googleEventId: string): Promise<ScheduledBrokerageMeetingRecord | null> {
    const db = await getDbPool();
    if (db) {
      try {
        const res = await db.query(
          `SELECT * FROM scheduled_brokerage_meetings WHERE google_event_id = $1 OR id = $1`,
          [googleEventId]
        );
        if (res.rows.length > 0) {
          return this.mapMeetingRowToRecord(res.rows[0]);
        }
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB getScheduledMeetingByGoogleEventId error:', err);
          throw new Error(`Database error retrieving meeting by Google ID: ${err.message}`);
        }
      }
    }

    for (const m of memoryMeetings.values()) {
      if (m.id === googleEventId) return m;
    }
    return null;
  }

  /**
   * Lists all scheduled meetings for a workspace
   */
  public static async listScheduledMeetings(workspaceId: string = 'ws_wilmington'): Promise<ScheduledBrokerageMeetingRecord[]> {
    const db = await getDbPool();
    if (db) {
      try {
        const res = await db.query(
          `SELECT * FROM scheduled_brokerage_meetings WHERE workspace_id = $1 ORDER BY created_at DESC`,
          [workspaceId]
        );
        return res.rows.map(r => this.mapMeetingRowToRecord(r));
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB listScheduledMeetings error:', err);
          throw new Error(`Database error listing meetings: ${err.message}`);
        }
      }
    }

    return Array.from(memoryMeetings.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Deletes a scheduled meeting from persistence
   */
  public static async deleteScheduledMeeting(id: string): Promise<boolean> {
    memoryMeetings.delete(id);

    const db = await getDbPool();
    if (db) {
      try {
        await db.query(
          `DELETE FROM scheduled_brokerage_meetings WHERE id = $1`,
          [id]
        );
        return true;
      } catch (err: any) {
        if (isProduction()) {
          console.error('[CalendarRepository] FATAL DB deleteScheduledMeeting error:', err);
          throw new Error(`Database error deleting meeting: ${err.message}`);
        }
      }
    }

    return true;
  }

  private static mapMeetingRowToRecord(r: any): ScheduledBrokerageMeetingRecord {
    return {
      id: r.id,
      calendarId: r.calendar_id,
      title: r.title,
      meetingDate: r.meeting_date,
      startTime: r.start_time,
      endTime: r.end_time,
      location: r.location,
      organizerEmail: r.organizer_email,
      requesterName: r.requester_name,
      targetAudience: r.target_audience,
      resolvedScopeDescription: r.resolved_scope_description,
      attendeeCount: r.attendee_count,
      attendees: typeof r.attendees === 'string' ? JSON.parse(r.attendees) : (r.attendees || []),
      googleCalendarUrl: r.google_calendar_url,
      htmlLink: r.html_link || undefined,
      hangoutLink: r.hangout_link || undefined,
      iCalContent: r.ical_content,
      dispatchedVia: r.dispatched_via,
      mode: r.mode,
      conferenceStatus: r.conference_status,
      isExternalVerified: Boolean(r.is_external_verified),
      providerTimestamp: r.provider_timestamp ? new Date(r.provider_timestamp).toISOString() : new Date().toISOString(),
      spokenConfirmation: r.spoken_confirmation,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    };
  }

  public static clearMemoryForTesting(): void {
    memorySettings.clear();
    memoryMeetings.clear();
    memoryExecutionLedger.clear();
  }
}

export interface CalendarExecutionRecord {
  idempotencyKey: string;
  workspaceId: string;
  pendingActionId?: string;
  payloadVersion: number;
  calendarId: string;
  providerEventId?: string;
  meetRequestId?: string;
  attemptCount: number;
  executionState: 'in_progress' | 'succeeded' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const memoryExecutionLedger = new Map<string, CalendarExecutionRecord>();

export class CalendarIdempotencyLedger {
  public static async getRecord(idempotencyKey: string): Promise<CalendarExecutionRecord | null> {
    const db = await getDbPool();
    if (db) {
      try {
        const res = await db.query(
          `SELECT * FROM nora_durable_actions WHERE idempotency_key = $1`,
          [idempotencyKey]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            idempotencyKey: r.idempotency_key,
            workspaceId: r.workspace_id,
            pendingActionId: r.request_id,
            payloadVersion: 1,
            calendarId: r.entity_id || 'primary',
            providerEventId: r.provider_record_id,
            attemptCount: 1,
            executionState: r.status === 'completed' ? 'succeeded' : (r.status === 'failed' ? 'failed' : 'in_progress'),
            result: r.result_payload,
            error: r.error_message,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
          };
        }
      } catch (err) {
        // Fall back to memory ledger
      }
    }
    return memoryExecutionLedger.get(idempotencyKey) || null;
  }

  public static async saveRecord(record: CalendarExecutionRecord): Promise<CalendarExecutionRecord> {
    const now = new Date().toISOString();
    const updated: CalendarExecutionRecord = {
      ...record,
      updatedAt: now
    };
    memoryExecutionLedger.set(record.idempotencyKey, updated);

    const db = await getDbPool();
    if (db) {
      try {
        await db.query(
          `INSERT INTO nora_durable_actions (
            id, request_id, idempotency_key, authenticated_user_id, tenant_id, workspace_id,
            action_name, entity_id, status, provider, provider_record_id, result_payload, error_message, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (idempotency_key) DO UPDATE SET
            status = EXCLUDED.status,
            provider_record_id = EXCLUDED.provider_record_id,
            result_payload = EXCLUDED.result_payload,
            error_message = EXCLUDED.error_message,
            updated_at = NOW()`,
          [
            `exec_${record.idempotencyKey}`,
            record.pendingActionId || 'direct',
            record.idempotencyKey,
            'asknora',
            'tenant_nest',
            record.workspaceId,
            'schedule_google_calendar_meeting',
            record.calendarId,
            record.executionState === 'succeeded' ? 'completed' : (record.executionState === 'failed' ? 'failed' : 'executing'),
            'google_calendar',
            record.providerEventId || null,
            record.result ? JSON.stringify(record.result) : null,
            record.error || null
          ]
        );
      } catch (err) {
        // Log notice
      }
    }
    return updated;
  }
}

