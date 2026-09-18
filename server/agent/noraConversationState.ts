/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Canonical Conversational Working Memory
 * Tracks multi-turn intent, active goals, verified entities, field corrections,
 * pronoun resolution, and operational state with durable PostgreSQL persistence.
 */

import * as fs from 'fs';
import * as path from 'path';
import { dbPool, storageDriver } from '../persistence/repositories.js';

export type NoraConversationChannel = 'typed' | 'voice' | 'telephone' | 'email';

export type NoraGoalStatus =
  | 'understanding'
  | 'collecting'
  | 'planning'
  | 'awaiting_confirmation'
  | 'executing'
  | 'suspended'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type NoraEntityType =
  | 'person'
  | 'property'
  | 'listing'
  | 'transaction'
  | 'task'
  | 'meeting'
  | 'document'
  | 'marketing_request';

export type NoraVerificationStatus =
  | 'verified'
  | 'user_provided'
  | 'ambiguous'
  | 'unverified';

export interface NoraActiveEntity {
  entityType: NoraEntityType;
  entityId?: string;
  displayName: string;
  evidenceId?: string;
  verificationStatus: NoraVerificationStatus;
}

export interface NoraActiveGoal {
  goalType: string;
  status: NoraGoalStatus;
  summary: string;
  originatingTurnId: string;
}

export interface NoraFieldCorrection {
  field: string;
  previousValue: unknown;
  newValue: unknown;
  turnId: string;
}

export interface NoraConversationState {
  workspaceId: string;
  userId: string;
  sessionId: string;
  channel: NoraConversationChannel;

  activeGoal?: NoraActiveGoal;
  activeEntities: NoraActiveEntity[];
  collectedFields: Record<string, unknown>;
  missingFields: string[];
  corrections: NoraFieldCorrection[];
  suspendedGoals: string[];
  recentEvidenceIds: string[];
  version?: number;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export class NoraConversationStateManager {
  private static store: Map<string, NoraConversationState> = new Map();
  private static readonly TTL_MS = 30 * 60 * 1000; // 30 minutes retention
  private static readonly STORAGE_FILE = path.join(process.cwd(), 'data', 'nora_conversation_states.jsonl');

  private static buildKey(workspaceId: string, userId: string, sessionId: string): string {
    const ws = (workspaceId || 'ws_wilmington').toLowerCase().trim();
    const u = (userId || 'ryan').toLowerCase().trim();
    const s = (sessionId || 'default-session').toLowerCase().trim();
    return `${ws}:${u}:${s}`;
  }

  private static ensureStorageDir(): void {
    try {
      const dir = path.dirname(this.STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {}
  }

  private static isProduction(): boolean {
    return (process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production') && process.env.ALLOW_FILE_STORAGE_UAT !== 'true';
  }

  private static flushToFile(): void {
    if (this.isProduction()) return; // Production must NEVER write to local files
    try {
      this.ensureStorageDir();
      const allStates = Array.from(this.store.values());
      const data = allStates.map(s => JSON.stringify(s)).join('\n') + (allStates.length > 0 ? '\n' : '');
      fs.writeFileSync(this.STORAGE_FILE, data, 'utf8');
    } catch {}
  }

  public static getOrCreateConversationState(
    workspaceId: string,
    userId: string,
    sessionId: string,
    channel: NoraConversationChannel = 'typed'
  ): NoraConversationState {
    const key = this.buildKey(workspaceId, userId, sessionId);
    let state = this.store.get(key);

    if (!state && !this.isProduction()) {
      // Rehydrate from file in development only
      try {
        if (fs.existsSync(this.STORAGE_FILE)) {
          const lines = fs.readFileSync(this.STORAGE_FILE, 'utf8').split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line) as NoraConversationState;
              if (this.buildKey(parsed.workspaceId, parsed.userId, parsed.sessionId) === key) {
                state = parsed;
              }
            } catch {}
          }
        }
      } catch {}
    }

    if (!state || new Date(state.expiresAt).getTime() < Date.now()) {
      const now = new Date().toISOString();
      state = {
        workspaceId: (workspaceId || 'ws_wilmington').toLowerCase().trim(),
        userId: (userId || 'ryan').toLowerCase().trim(),
        sessionId: (sessionId || 'default-session').toLowerCase().trim(),
        channel,
        activeEntities: [],
        collectedFields: {},
        missingFields: [],
        corrections: [],
        suspendedGoals: [],
        recentEvidenceIds: [],
        version: 1,
        expiresAt: new Date(Date.now() + this.TTL_MS).toISOString(),
        createdAt: now,
        updatedAt: now
      };
      this.store.set(key, state);
    }

    return state;
  }

  public static saveConversationState(state: NoraConversationState): void {
    const key = this.buildKey(state.workspaceId, state.userId, state.sessionId);
    state.version = (state.version || 0) + 1;
    state.updatedAt = new Date().toISOString();
    state.expiresAt = new Date(Date.now() + this.TTL_MS).toISOString();

    this.store.set(key, state);
    if (!this.isProduction()) {
      this.flushToFile();
    }

    if (storageDriver === 'database' && dbPool) {
      const recordId = `conv_${state.workspaceId}_${state.userId}_${state.sessionId}`;
      const queryPromise = dbPool.query(
        `INSERT INTO nora_conversation_states (
          id, workspace_id, user_id, session_id, channel, active_goal, active_entities,
          collected_fields, missing_fields, corrections, suspended_goals, recent_evidence_ids,
          version, expires_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (workspace_id, user_id, session_id) DO UPDATE SET
          channel = EXCLUDED.channel,
          active_goal = EXCLUDED.active_goal,
          active_entities = EXCLUDED.active_entities,
          collected_fields = EXCLUDED.collected_fields,
          missing_fields = EXCLUDED.missing_fields,
          corrections = EXCLUDED.corrections,
          suspended_goals = EXCLUDED.suspended_goals,
          recent_evidence_ids = EXCLUDED.recent_evidence_ids,
          version = EXCLUDED.version,
          expires_at = EXCLUDED.expires_at,
          updated_at = EXCLUDED.updated_at`,
        [
          recordId,
          state.workspaceId,
          state.userId,
          state.sessionId,
          state.channel,
          state.activeGoal ? JSON.stringify(state.activeGoal) : null,
          JSON.stringify(state.activeEntities || []),
          JSON.stringify(state.collectedFields || {}),
          state.missingFields || [],
          JSON.stringify(state.corrections || []),
          JSON.stringify(state.suspendedGoals || []),
          state.recentEvidenceIds || [],
          state.version,
          state.expiresAt,
          state.createdAt || new Date().toISOString(),
          state.updatedAt
        ]
      );

      if (this.isProduction()) {
        queryPromise.catch(err => {
          console.error('[NoraConversationStateManager] FATAL Database write failure in production:', err);
          throw new Error(`Production database write failed for conversation state: ${err.message}`);
        });
      } else {
        queryPromise.catch(() => {});
      }
    } else if (this.isProduction()) {
      throw new Error('FATAL: Database persistence driver is required in production environment.');
    }
  }

  /**
   * Set or update active goal
   */
  public static setActiveGoal(
    workspaceId: string,
    userId: string,
    sessionId: string,
    goal: NoraActiveGoal
  ): NoraConversationState {
    const state = this.getOrCreateConversationState(workspaceId, userId, sessionId);
    if (state.activeGoal && state.activeGoal.goalType !== goal.goalType && state.activeGoal.status !== 'completed' && state.activeGoal.status !== 'cancelled') {
      state.suspendedGoals = state.suspendedGoals || [];
      state.suspendedGoals.push(`Suspended: ${state.activeGoal.summary || state.activeGoal.goalType}`);
    }
    state.activeGoal = goal;
    this.saveConversationState(state);
    return state;
  }

  /**
   * Track or promote an active entity (person, property, document, etc.)
   */
  public static addOrPromoteEntity(
    workspaceId: string,
    userId: string,
    sessionId: string,
    entity: NoraActiveEntity
  ): NoraConversationState {
    const state = this.getOrCreateConversationState(workspaceId, userId, sessionId);
    state.activeEntities = state.activeEntities.filter(
      e => !(e.entityType === entity.entityType && (e.entityId === entity.entityId || e.displayName.toLowerCase() === entity.displayName.toLowerCase()))
    );
    // Add to front (most recently referenced)
    state.activeEntities.unshift(entity);
    // Keep max 10 recent entities
    if (state.activeEntities.length > 10) {
      state.activeEntities = state.activeEntities.slice(0, 10);
    }
    this.saveConversationState(state);
    return state;
  }

  /**
   * Pronoun Resolution Helper: Resolves pronouns ('her', 'him', 'them', 'it', 'that', 'this')
   * against verified recent entities in working memory.
   */
  public static resolvePronounReference(
    state: NoraConversationState,
    pronoun: string
  ): NoraActiveEntity | null {
    const p = pronoun.toLowerCase().trim();
    if (!state.activeEntities || state.activeEntities.length === 0) return null;

    if (p === 'her' || p === 'she') {
      // Find most recent person entity
      const person = state.activeEntities.find(e => e.entityType === 'person');
      return person || null;
    }

    if (p === 'him' || p === 'he') {
      // Find most recent person entity
      const person = state.activeEntities.find(e => e.entityType === 'person');
      return person || null;
    }

    if (p === 'them' || p === 'they') {
      const person = state.activeEntities.find(e => e.entityType === 'person');
      return person || null;
    }

    if (p === 'it' || p === 'that' || p === 'this' || p === 'the listing' || p === 'the property') {
      // Find most recent non-person entity (property, transaction, task, document)
      const nonPerson = state.activeEntities.find(e => e.entityType !== 'person');
      return nonPerson || null;
    }

    return null;
  }

  /**
   * Natural field correction: Records previous vs new value and applies change specifically
   */
  public static applyFieldCorrection(
    workspaceId: string,
    userId: string,
    sessionId: string,
    field: string,
    newValue: unknown,
    turnId: string = `turn_${Date.now()}`
  ): NoraConversationState {
    const state = this.getOrCreateConversationState(workspaceId, userId, sessionId);
    const prev = state.collectedFields[field];

    state.corrections = state.corrections || [];
    state.corrections.push({
      field,
      previousValue: prev,
      newValue,
      turnId
    });

    state.collectedFields[field] = newValue;
    this.saveConversationState(state);
    return state;
  }

  /**
   * Clear session working memory (Triggered on "New Chat" button or explicit reset)
   */
  public static clearSession(workspaceId: string, userId: string, sessionId: string): void {
    const key = this.buildKey(workspaceId, userId, sessionId);
    this.store.delete(key);
    this.flushToFile();

    if (storageDriver === 'database' && dbPool) {
      dbPool.query(
        `DELETE FROM nora_conversation_states WHERE workspace_id = $1 AND user_id = $2 AND session_id = $3`,
        [workspaceId, userId, sessionId]
      ).catch(() => {});
    }
  }

  public static resetForTesting(): void {
    this.store.clear();
    try {
      if (fs.existsSync(this.STORAGE_FILE)) {
        fs.unlinkSync(this.STORAGE_FILE);
      }
    } catch {}
  }
}
