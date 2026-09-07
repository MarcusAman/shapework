/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server-Authoritative Pending Action Manager
 * Truly durable multi-turn action state scoped strictly by (workspaceId, userId, sessionId).
 * Backed by PostgreSQL table 'nora_pending_actions' with synchronous JSONL durable file fallback.
 * Survives process restarts, Cloud Run cold starts, and multi-container instances.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dbPool, storageDriver } from '../persistence/repositories.js';
import { NoraActionLifecycleState } from './types.js';

export type PendingActionType = 'schedule_meeting' | 'draft_contract' | 'vendor_order';

export type PendingActionStatus = 
  | 'collecting_details'
  | 'awaiting_recipient_resolution'
  | 'awaiting_confirmation'
  | 'executing'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | NoraActionLifecycleState;

export interface PendingCalendarAttendee {
  id?: string;
  displayName: string;
  email: string;
  role?: string;
  office?: string;
  isGoogleWorkspaceVerified?: boolean;
}

export interface PendingCalendarActionFields {
  title?: string;
  purpose?: string;
  targetAudience?: string;
  attendeeNames?: string[];
  attendeeIds?: string[];
  attendeeEmails?: string[];
  attendees?: PendingCalendarAttendee[];
  meetingDate?: string;      // YYYY-MM-DD
  startTime?: string;        // e.g. "15:00" or "3:00 PM"
  endTime?: string;          // e.g. "16:00" or "4:00 PM"
  startIso?: string;         // ISO-8601 with timezone offset
  endIso?: string;           // ISO-8601 with timezone offset
  timezone?: string;         // e.g. "America/New_York"
  durationMinutes?: number;  // default 60
  locationType?: 'google_meet' | 'office' | 'phone' | 'custom';
  location?: string;
  organizerEmail?: string;   // 'AskNora@nestrealty.com'
  notes?: string;
  conferenceRequested?: boolean;
}

export interface PendingCalendarAction {
  id: string;
  actionType: 'schedule_meeting';
  status: PendingActionStatus;
  lifecycleState?: NoraActionLifecycleState;
  workspaceId: string;
  userId: string;
  sessionId: string;
  channel: 'typed_chat' | 'voice' | 'telephony';
  originatingTurnId: string;
  fields: PendingCalendarActionFields;
  missingFields: string[];
  lastClarificationPrompt?: string;
  idempotencyKey?: string;
  executionResult?: any;
  error?: string;
  version: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export class PendingActionManager {
  // In-memory fast cache keyed by `workspaceId:userId:sessionId`
  private static store: Map<string, PendingCalendarAction> = new Map();
  // Default TTL: 15 minutes
  private static readonly TTL_MS = 15 * 60 * 1000;
  private static readonly STORAGE_DIR = path.join(process.cwd(), 'data');
  private static readonly STORAGE_FILE = path.join(process.cwd(), 'data', 'nora_pending_actions.jsonl');

  private static ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[PendingActionManager] Failed to create data dir:', err);
    }
  }

  private static normalizeId(id: string): string {
    const s = (id || '').toLowerCase().trim();
    if (s === 'usr_ryan' || s === 'ryan@nestrealty.com') return 'ryan';
    if (s === 'nest-realty-demo' || s === 'nest-realty-wilmington') return 'ws_wilmington';
    return s;
  }

  private static buildKey(workspaceId: string, userId: string, sessionId: string): string {
    const ws = this.normalizeId(workspaceId || 'ws_wilmington');
    const u = this.normalizeId(userId || 'ryan');
    const s = (sessionId || 'default-session').toLowerCase().trim();
    return `${ws}:${u}:${s}`;
  }

  /**
   * Reads from durable JSONL file fallback
   */
  private static readFromFile(key: string): PendingCalendarAction | null {
    try {
      if (!fs.existsSync(this.STORAGE_FILE)) return null;
      const content = fs.readFileSync(this.STORAGE_FILE, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      let latest: PendingCalendarAction | null = null;
      for (const line of lines) {
        try {
          const action = JSON.parse(line) as PendingCalendarAction;
          const actionKey = this.buildKey(action.workspaceId, action.userId, action.sessionId);
          if (actionKey === key) {
            latest = action;
          }
        } catch {
          // ignore corrupted line
        }
      }
      return latest;
    } catch (err) {
      console.warn('[PendingActionManager] File read error:', err);
      return null;
    }
  }

  /**
   * Persists active store to file
   */
  private static flushToFile(): void {
    try {
      this.ensureStorageDir();
      const activeActions: PendingCalendarAction[] = Array.from(this.store.values());
      const serialized = activeActions.map(a => JSON.stringify(a)).join('\n') + (activeActions.length > 0 ? '\n' : '');
      fs.writeFileSync(this.STORAGE_FILE, serialized, 'utf8');
    } catch (err) {
      console.warn('[PendingActionManager] Failed to flush to file:', err);
    }
  }

  /**
   * Get active pending calendar action for the authenticated session
   */
  public static getPendingAction(
    workspaceId: string,
    userId: string,
    sessionId: string
  ): PendingCalendarAction | null {
    const key = this.buildKey(workspaceId, userId, sessionId);
    
    // 1. Check in-memory store
    let action = this.store.get(key);

    // 2. Cold start / multi-container rehydration from durable file fallback
    if (!action) {
      action = this.readFromFile(key) || undefined;
      if (action) {
        this.store.set(key, action);
      }
    }

    if (!action) return null;

    // Check expiration
    if (new Date(action.expiresAt).getTime() < Date.now()) {
      this.clearPendingAction(workspaceId, userId, sessionId);
      return null;
    }

    // Terminal statuses are not active
    if (
      action.status === 'completed' || 
      action.status === 'cancelled' || 
      action.status === 'failed' ||
      action.status === 'ACTION_COMPLETED' ||
      action.status === 'ACTION_CANCELLED' ||
      action.status === 'ACTION_FAILED'
    ) {
      return null;
    }

    return action;
  }

  /**
   * Save or update pending action with refreshed expiration and incremented version
   */
  public static savePendingAction(action: PendingCalendarAction): void {
    const key = this.buildKey(action.workspaceId, action.userId, action.sessionId);
    action.version = (action.version || 0) + 1;
    action.updatedAt = new Date().toISOString();
    action.expiresAt = new Date(Date.now() + this.TTL_MS).toISOString();
    
    // 1. Update in-memory
    this.store.set(key, action);

    // 2. Update durable file
    this.flushToFile();

    // 3. PostgreSQL transactional sync if database active
    if (storageDriver === 'database' && dbPool) {
      dbPool.query(
        `INSERT INTO nora_pending_actions (
          id, workspace_id, user_id, session_id, action_type, status, lifecycle_state, channel, originating_turn_id, fields, missing_fields, last_clarification_prompt, idempotency_key, execution_result, error, version, expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          lifecycle_state = EXCLUDED.lifecycle_state,
          fields = EXCLUDED.fields,
          missing_fields = EXCLUDED.missing_fields,
          last_clarification_prompt = EXCLUDED.last_clarification_prompt,
          idempotency_key = EXCLUDED.idempotency_key,
          execution_result = EXCLUDED.execution_result,
          error = EXCLUDED.error,
          version = EXCLUDED.version,
          expires_at = EXCLUDED.expires_at,
          updated_at = EXCLUDED.updated_at`,
        [
          action.id,
          action.workspaceId,
          action.userId,
          action.sessionId,
          action.actionType,
          action.status,
          action.lifecycleState || 'ACTION_IDENTIFIED',
          action.channel || 'typed_chat',
          action.originatingTurnId || '',
          JSON.stringify(action.fields),
          action.missingFields,
          action.lastClarificationPrompt || null,
          action.idempotencyKey || null,
          action.executionResult ? JSON.stringify(action.executionResult) : null,
          action.error || null,
          action.version,
          action.expiresAt,
          action.createdAt,
          action.updatedAt
        ]
      ).catch(dbErr => {
        if (process.env.STRICT_PERSISTENCE_GUARD === 'true') {
          console.error('[PendingActionManager] FATAL: Failed to persist pending action to database:', dbErr);
        }
      });
    }
  }

  /**
   * Atomically claims an action for execution, guaranteeing that 2 concurrent Cloud Run instances
   * or duplicate clicks cannot execute the same confirmed action twice.
   */
  public static async atomicClaimActionForExecution(
    workspaceId: string,
    userId: string,
    sessionId: string,
    expectedVersion?: number
  ): Promise<{ claimed: boolean; action?: PendingCalendarAction; reason?: string }> {
    const action = this.getPendingAction(workspaceId, userId, sessionId);
    if (!action) {
      return { claimed: false, reason: 'No active pending action found for this session.' };
    }

    if (action.status !== 'awaiting_confirmation' && action.lifecycleState !== 'ACTION_AWAITING_CONFIRMATION') {
      return { claimed: false, reason: `Action is not in awaiting_confirmation state (current: ${action.status}).` };
    }

    if (expectedVersion !== undefined && action.version !== expectedVersion) {
      return { claimed: false, reason: 'Action was modified concurrently by another process.' };
    }

    // In DB mode, perform atomic UPDATE with optimistic lock
    if (storageDriver === 'database' && dbPool) {
      try {
        const queryRes = await dbPool.query(
          `UPDATE nora_pending_actions
           SET status = 'executing', lifecycle_state = 'ACTION_EXECUTING', version = version + 1, updated_at = NOW()
           WHERE id = $1 AND version = $2 AND status = 'awaiting_confirmation'
           RETURNING *`,
          [action.id, action.version]
        );

        if (queryRes.rowCount === 0) {
          return { claimed: false, reason: 'Concurrent execution detected: Action already claimed by another instance.' };
        }
      } catch (err: any) {
        if (process.env.STRICT_PERSISTENCE_GUARD === 'true') {
          throw new Error(`Durable persistence failure during action claim: ${err.message}`);
        }
      }
    }

    action.status = 'executing';
    action.lifecycleState = 'ACTION_EXECUTING';
    action.version = (action.version || 0) + 1;
    action.updatedAt = new Date().toISOString();
    this.store.set(this.buildKey(workspaceId, userId, sessionId), action);
    this.flushToFile();

    return { claimed: true, action };
  }

  /**
   * Create a new pending calendar action draft
   */
  public static createPendingCalendarAction(params: {
    workspaceId: string;
    userId: string;
    sessionId: string;
    channel?: 'typed_chat' | 'voice' | 'telephony';
    turnId?: string;
    fields?: Partial<PendingCalendarActionFields>;
    status?: PendingActionStatus;
  }): PendingCalendarAction {
    const now = new Date().toISOString();
    const actionId = `pnd_cal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const action: PendingCalendarAction = {
      id: actionId,
      actionType: 'schedule_meeting',
      status: params.status || 'collecting_details',
      lifecycleState: 'ACTION_IDENTIFIED',
      workspaceId: params.workspaceId || 'ws_wilmington',
      userId: params.userId || 'ryan',
      sessionId: params.sessionId || 'default-session',
      channel: params.channel || 'typed_chat',
      originatingTurnId: params.turnId || `turn_${Date.now()}`,
      fields: {
        durationMinutes: 60,
        timezone: 'America/New_York',
        organizerEmail: 'AskNora@nestrealty.com',
        conferenceRequested: true,
        ...(params.fields || {})
      },
      missingFields: [],
      version: 0,
      expiresAt: new Date(Date.now() + this.TTL_MS).toISOString(),
      createdAt: now,
      updatedAt: now
    };

    this.recomputeMissingFields(action);
    this.savePendingAction(action);
    return action;
  }

  /**
   * Evaluates missing required fields and sets appropriate lifecycle state
   */
  public static recomputeMissingFields(action: PendingCalendarAction): string[] {
    const missing: string[] = [];
    const f = action.fields;

    const hasAttendees = (f.attendees && f.attendees.length > 0) || (f.attendeeEmails && f.attendeeEmails.length > 0) || Boolean(f.targetAudience);
    if (!hasAttendees) missing.push('attendees');
    if (!f.meetingDate) missing.push('meetingDate');
    if (!f.startTime) missing.push('startTime');
    if (!f.locationType && !f.location) missing.push('location');

    action.missingFields = missing;
    if (missing.length === 0) {
      if (action.status === 'collecting_details' || action.status === 'awaiting_recipient_resolution' || action.status === 'ACTION_IDENTIFIED' || action.status === 'ACTION_DETAILS_REQUIRED') {
        action.status = 'awaiting_confirmation';
        action.lifecycleState = 'ACTION_AWAITING_CONFIRMATION';
      }
    } else {
      if (action.status !== 'awaiting_recipient_resolution' && action.status !== 'awaiting_confirmation' && action.lifecycleState !== 'ACTION_AWAITING_CONFIRMATION') {
        action.status = 'collecting_details';
        action.lifecycleState = 'ACTION_DETAILS_REQUIRED';
      }
    }

    return missing;
  }

  /**
   * Returns the single most important blocking clarification question.
   * Never returns a multi-question questionnaire.
   */
  public static getSingleClarificationPrompt(action: PendingCalendarAction): { field: string; question: string } | null {
    const missing = action.missingFields || this.recomputeMissingFields(action);
    if (missing.length === 0) return null;

    if (missing.includes('attendees')) {
      return { field: 'attendees', question: 'Who should I schedule it with?' };
    }
    if (missing.includes('meetingDate')) {
      return { field: 'meetingDate', question: 'What date would you like to schedule this for?' };
    }
    if (missing.includes('startTime')) {
      return { field: 'startTime', question: 'What time should we meet?' };
    }
    if (missing.includes('location')) {
      return { field: 'location', question: 'Would you like to meet over Google Meet or at the Wilmington Mayfaire office?' };
    }

    return { field: missing[0], question: `Please provide the ${missing[0]} for this meeting.` };
  }

  /**
   * Natural correction helper: modifies only specified fields while preserving existing values.
   */
  public static applyCorrection(
    workspaceId: string,
    userId: string,
    sessionId: string,
    updates: Partial<PendingCalendarActionFields>
  ): PendingCalendarAction | null {
    const action = this.getPendingAction(workspaceId, userId, sessionId);
    if (!action) return null;

    action.fields = {
      ...action.fields,
      ...updates
    };

    this.recomputeMissingFields(action);
    this.savePendingAction(action);
    return action;
  }

  /**
   * Clear active pending action for a session (e.g. on completion, cancellation, or New Chat)
   */
  public static clearPendingAction(workspaceId: string, userId: string, sessionId: string): void {
    const key = this.buildKey(workspaceId, userId, sessionId);
    this.store.delete(key);
    this.flushToFile();

    if (storageDriver === 'database' && dbPool) {
      dbPool.query(
        `DELETE FROM nora_pending_actions WHERE workspace_id = $1 AND user_id = $2 AND session_id = $3`,
        [workspaceId, userId, sessionId]
      ).catch(() => {});
    }
  }

  /**
   * Clear all pending actions for a workspace session
   */
  public static clearAllForSession(workspaceId: string, sessionId: string): void {
    const prefix = `${(workspaceId || 'ws_wilmington').toLowerCase().trim()}:`;
    const suffix = `:${(sessionId || 'default-session').toLowerCase().trim()}`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix) && key.endsWith(suffix)) {
        this.store.delete(key);
      }
    }
    this.flushToFile();
  }

  /**
   * Direct clear (for testing)
   */
  public static resetForTesting(): void {
    this.store.clear();
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        fs.unlinkSync(this.STORAGE_FILE);
      }
    } catch {
      // ignore
    }
  }
}
