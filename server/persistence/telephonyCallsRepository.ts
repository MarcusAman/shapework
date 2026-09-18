/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent PostgreSQL Ledger for Telephony Calls (Retell & Twilio Gateways)
 * Ensures every incoming/outgoing phone interaction is durably recorded in `telephony_calls`.
 */

import { dbPool, storageDriver, getDbPool, getStorageDriver } from './repositories.js';
import { convertKeysToCamel } from './databaseRepositories.js';

export interface PersistedTelephonyCall {
  id: string;
  workspaceId: string;
  agentId: string;
  callerName?: string;
  callerPhone?: string;
  callerOffice?: string;
  direction: 'inbound' | 'outbound';
  status: string;
  disconnectionReason?: string;
  durationSeconds: number;
  durationFormatted?: string;
  propertyAddress?: string;
  requestType?: string;
  departmentCategory: string;
  assignedLead?: string;
  transcript?: string;
  recordingUrl?: string;
  audioUrl?: string;
  callAnalysis?: any;
  aiExtractedDetails?: any;
  brokerDetails?: any;
  canonicalRequestId?: string;
  canonicalTaskId?: string;
  followUpEmailId?: string;
  followUpStatus?: string;
  followUpSentAt?: string;
  conversationGoal?: string;
  knowledgeUsedSummary?: any[];
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory ledger cache for non-db test environments or fallback
let inMemoryCalls: PersistedTelephonyCall[] = [];

export function purgeTelephonyCallsInMemory(): void {
  inMemoryCalls = [];
}

export function formatDurationSeconds(sec: number): string {
  if (!sec || sec <= 0) return '0 sec';
  if (sec < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m} min ${s} sec` : `${m} min`;
}

function mapRowToPersistedCall(row: any): PersistedTelephonyCall {
  const camel = convertKeysToCamel(row);
  return {
    id: camel.id,
    workspaceId: camel.workspaceId || 'ws_wilmington',
    agentId: camel.agentId || 'agent_cdd031880770993e4b11cb9340',
    callerName: camel.callerName || undefined,
    callerPhone: camel.callerPhone || undefined,
    callerOffice: camel.callerOffice || undefined,
    direction: camel.direction || 'inbound',
    status: camel.status || 'completed',
    disconnectionReason: camel.disconnectionReason || undefined,
    durationSeconds: typeof camel.durationSeconds === 'number' ? camel.durationSeconds : parseInt(camel.durationSeconds || '0', 10),
    durationFormatted: camel.durationFormatted || formatDurationSeconds(camel.durationSeconds || 0),
    propertyAddress: camel.propertyAddress || undefined,
    requestType: camel.requestType || 'General Inbound',
    departmentCategory: camel.departmentCategory || 'general_ops',
    assignedLead: camel.assignedLead || 'Ann Gunn (Operations Lead)',
    transcript: camel.transcript || undefined,
    recordingUrl: camel.recordingUrl || undefined,
    audioUrl: camel.audioUrl || (camel.id ? `/api/marketing/calls/${camel.id}/audio` : undefined),
    callAnalysis: camel.callAnalysis || {},
    aiExtractedDetails: camel.aiExtractedDetails || {},
    brokerDetails: camel.brokerDetails || {},
    canonicalRequestId: camel.canonicalRequestId || undefined,
    canonicalTaskId: camel.canonicalTaskId || undefined,
    followUpEmailId: camel.followUpEmailId || undefined,
    followUpStatus: camel.followUpStatus || undefined,
    followUpSentAt: camel.followUpSentAt ? new Date(camel.followUpSentAt).toISOString() : undefined,
    conversationGoal: camel.conversationGoal || undefined,
    knowledgeUsedSummary: Array.isArray(camel.knowledgeUsedSummary) 
      ? camel.knowledgeUsedSummary 
      : (typeof camel.knowledgeUsedSummary === 'string' ? JSON.parse(camel.knowledgeUsedSummary) : []),
    startedAt: camel.startedAt ? new Date(camel.startedAt).toISOString() : undefined,
    endedAt: camel.endedAt ? new Date(camel.endedAt).toISOString() : undefined,
    createdAt: camel.createdAt ? new Date(camel.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: camel.updatedAt ? new Date(camel.updatedAt).toISOString() : new Date().toISOString()
  };
}

/**
 * Persists a telephony call to PostgreSQL `telephony_calls`.
 * Fails closed in production / staging if DB driver is active and query fails.
 */
export async function saveTelephonyCallAsync(
  call: Partial<PersistedTelephonyCall> & { id: string },
  executor?: any
): Promise<PersistedTelephonyCall> {
  const now = new Date().toISOString();
  const durSec = call.durationSeconds ?? 0;

  const normalized: PersistedTelephonyCall = {
    id: call.id,
    workspaceId: call.workspaceId || 'ws_wilmington',
    agentId: call.agentId || 'agent_cdd031880770993e4b11cb9340',
    callerName: call.callerName,
    callerPhone: call.callerPhone,
    callerOffice: call.callerOffice,
    direction: call.direction || 'inbound',
    status: call.status || 'completed',
    disconnectionReason: call.disconnectionReason,
    durationSeconds: durSec,
    durationFormatted: call.durationFormatted || formatDurationSeconds(durSec),
    propertyAddress: call.propertyAddress,
    requestType: call.requestType || 'General Inbound',
    departmentCategory: call.departmentCategory || 'general_ops',
    assignedLead: call.assignedLead || 'Ann Gunn (Operations Lead)',
    transcript: call.transcript,
    recordingUrl: call.recordingUrl,
    audioUrl: call.audioUrl || `/api/marketing/calls/${call.id}/audio`,
    callAnalysis: call.callAnalysis || {},
    aiExtractedDetails: call.aiExtractedDetails || {},
    brokerDetails: call.brokerDetails || {},
    canonicalRequestId: call.canonicalRequestId,
    canonicalTaskId: call.canonicalTaskId,
    followUpEmailId: call.followUpEmailId,
    followUpStatus: call.followUpStatus,
    followUpSentAt: call.followUpSentAt,
    conversationGoal: call.conversationGoal,
    knowledgeUsedSummary: call.knowledgeUsedSummary || [],
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    createdAt: call.createdAt || now,
    updatedAt: now
  };

  // Always update in-memory cache
  const idx = inMemoryCalls.findIndex(c => c.id === normalized.id);
  if (idx >= 0) {
    inMemoryCalls[idx] = normalized;
  } else {
    inMemoryCalls.unshift(normalized);
  }

  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      const query = `
        INSERT INTO telephony_calls (
          id, workspace_id, agent_id, caller_name, caller_phone, caller_office,
          direction, status, disconnection_reason, duration_seconds, duration_formatted,
          property_address, request_type, department_category, assigned_lead,
          transcript, recording_url, audio_url, call_analysis, ai_extracted_details, broker_details,
          canonical_request_id, canonical_task_id, started_at, ended_at,
          follow_up_email_id, follow_up_status, follow_up_sent_at, conversation_goal, knowledge_used_summary,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19::jsonb, $20::jsonb, $21::jsonb,
          $22, $23, $24, $25,
          $26, $27, $28, $29, $30::jsonb,
          $31, $32
        )
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          agent_id = EXCLUDED.agent_id,
          caller_name = COALESCE(EXCLUDED.caller_name, telephony_calls.caller_name),
          caller_phone = COALESCE(EXCLUDED.caller_phone, telephony_calls.caller_phone),
          caller_office = COALESCE(EXCLUDED.caller_office, telephony_calls.caller_office),
          direction = EXCLUDED.direction,
          status = EXCLUDED.status,
          disconnection_reason = COALESCE(EXCLUDED.disconnection_reason, telephony_calls.disconnection_reason),
          duration_seconds = EXCLUDED.duration_seconds,
          duration_formatted = EXCLUDED.duration_formatted,
          property_address = COALESCE(EXCLUDED.property_address, telephony_calls.property_address),
          request_type = COALESCE(EXCLUDED.request_type, telephony_calls.request_type),
          department_category = EXCLUDED.department_category,
          assigned_lead = COALESCE(EXCLUDED.assigned_lead, telephony_calls.assigned_lead),
          transcript = COALESCE(EXCLUDED.transcript, telephony_calls.transcript),
          recording_url = COALESCE(EXCLUDED.recording_url, telephony_calls.recording_url),
          audio_url = COALESCE(EXCLUDED.audio_url, telephony_calls.audio_url),
          call_analysis = CASE 
            WHEN EXCLUDED.call_analysis IS NOT NULL AND EXCLUDED.call_analysis != '{}'::jsonb 
            THEN EXCLUDED.call_analysis 
            ELSE telephony_calls.call_analysis 
          END,
          ai_extracted_details = CASE 
            WHEN EXCLUDED.ai_extracted_details IS NOT NULL AND EXCLUDED.ai_extracted_details != '{}'::jsonb 
            THEN EXCLUDED.ai_extracted_details 
            ELSE telephony_calls.ai_extracted_details 
          END,
          broker_details = CASE 
            WHEN EXCLUDED.broker_details IS NOT NULL AND EXCLUDED.broker_details != '{}'::jsonb 
            THEN EXCLUDED.broker_details 
            ELSE telephony_calls.broker_details 
          END,
          canonical_request_id = COALESCE(EXCLUDED.canonical_request_id, telephony_calls.canonical_request_id),
          canonical_task_id = COALESCE(EXCLUDED.canonical_task_id, telephony_calls.canonical_task_id),
          started_at = COALESCE(EXCLUDED.started_at, telephony_calls.started_at),
          ended_at = COALESCE(EXCLUDED.ended_at, telephony_calls.ended_at),
          follow_up_email_id = COALESCE(EXCLUDED.follow_up_email_id, telephony_calls.follow_up_email_id),
          follow_up_status = COALESCE(EXCLUDED.follow_up_status, telephony_calls.follow_up_status),
          follow_up_sent_at = COALESCE(EXCLUDED.follow_up_sent_at, telephony_calls.follow_up_sent_at),
          conversation_goal = COALESCE(EXCLUDED.conversation_goal, telephony_calls.conversation_goal),
          knowledge_used_summary = CASE 
            WHEN EXCLUDED.knowledge_used_summary IS NOT NULL AND EXCLUDED.knowledge_used_summary != '[]'::jsonb 
            THEN EXCLUDED.knowledge_used_summary 
            ELSE telephony_calls.knowledge_used_summary 
          END,
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        normalized.id,
        normalized.workspaceId,
        normalized.agentId,
        normalized.callerName || null,
        normalized.callerPhone || null,
        normalized.callerOffice || null,
        normalized.direction,
        normalized.status,
        normalized.disconnectionReason || null,
        normalized.durationSeconds,
        normalized.durationFormatted || null,
        normalized.propertyAddress || null,
        normalized.requestType || null,
        normalized.departmentCategory,
        normalized.assignedLead || null,
        normalized.transcript || null,
        normalized.recordingUrl || null,
        normalized.audioUrl || null,
        JSON.stringify(normalized.callAnalysis || {}),
        JSON.stringify(normalized.aiExtractedDetails || {}),
        JSON.stringify(normalized.brokerDetails || {}),
        normalized.canonicalRequestId || null,
        normalized.canonicalTaskId || null,
        normalized.startedAt ? new Date(normalized.startedAt) : null,
        normalized.endedAt ? new Date(normalized.endedAt) : null,
        normalized.followUpEmailId || null,
        normalized.followUpStatus || null,
        normalized.followUpSentAt ? new Date(normalized.followUpSentAt) : null,
        normalized.conversationGoal || null,
        JSON.stringify(normalized.knowledgeUsedSummary || []),
        normalized.createdAt ? new Date(normalized.createdAt) : new Date(),
        new Date()
      ];

      const res = await db.query(query, values);
      if (res.rows && res.rows.length > 0) {
        return mapRowToPersistedCall(res.rows[0]);
      }
    } catch (dbErr: any) {
      console.error(`[TelephonyRepository] Database error saving call ${call.id}:`, dbErr);
      const appEnv = process.env.APP_ENV || process.env.APP_MODE || '';
      if (appEnv === 'production' || appEnv === 'staging' || process.env.STRICT_PERSISTENCE_GUARD === 'true') {
        throw new Error(`FAIL_CLOSED_PERSISTENCE_ERROR: Failed to save telephony call ${call.id} in ${appEnv}: ${dbErr.message}`);
      }
    }
  }

  return normalized;
}

/**
 * Updates follow-up email details on an existing telephony call record.
 */
export async function updateTelephonyCallFollowUpAsync(
  callId: string,
  followUp: {
    followUpEmailId?: string;
    followUpStatus: string;
    followUpSentAt?: string;
    conversationGoal?: string;
    knowledgeUsedSummary?: any[];
  },
  executor?: any
): Promise<void> {
  const mem = inMemoryCalls.find(c => c.id === callId);
  if (mem) {
    if (followUp.followUpEmailId) mem.followUpEmailId = followUp.followUpEmailId;
    if (followUp.followUpStatus) mem.followUpStatus = followUp.followUpStatus;
    if (followUp.followUpSentAt) mem.followUpSentAt = followUp.followUpSentAt;
    if (followUp.conversationGoal) mem.conversationGoal = followUp.conversationGoal;
    if (followUp.knowledgeUsedSummary) mem.knowledgeUsedSummary = followUp.knowledgeUsedSummary;
  }

  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      await db.query(
        `UPDATE telephony_calls 
         SET follow_up_email_id = COALESCE($2, follow_up_email_id),
             follow_up_status = COALESCE($3, follow_up_status),
             follow_up_sent_at = COALESCE($4, follow_up_sent_at),
             conversation_goal = COALESCE($5, conversation_goal),
             knowledge_used_summary = COALESCE($6::jsonb, knowledge_used_summary),
             updated_at = NOW()
         WHERE id = $1`,
        [
          callId,
          followUp.followUpEmailId || null,
          followUp.followUpStatus,
          followUp.followUpSentAt ? new Date(followUp.followUpSentAt) : null,
          followUp.conversationGoal || null,
          followUp.knowledgeUsedSummary ? JSON.stringify(followUp.knowledgeUsedSummary) : null
        ]
      );
    } catch (err: any) {
      console.warn(`[telephonyCallsRepository] Error updating follow-up status for call ${callId}:`, err.message);
    }
  }
}

/**
 * Retrieves calls for a workspace directly from PostgreSQL ledger.
 * Does NOT poll Retell synchronously.
 */
export async function getTelephonyCallsByWorkspaceAsync(
  workspaceId = 'ws_wilmington',
  limit = 50,
  executor?: any
): Promise<PersistedTelephonyCall[]> {
  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      const res = await db.query(
        `SELECT * FROM telephony_calls 
         WHERE (
           workspace_id = $1 
           OR ($1 = 'ws_wilmington' AND workspace_id IN ('ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'))
           OR ($1 IN ('nest-realty-demo', 'nest-realty-wilmington') AND workspace_id IN ('ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'))
         )
         AND id NOT LIKE 'call_tool_%'
         ORDER BY started_at DESC NULLS LAST, created_at DESC 
         LIMIT $2`,
        [workspaceId, limit]
      );
      return res.rows.map(mapRowToPersistedCall);
    } catch (err: any) {
      console.error(`[TelephonyRepository] Error querying calls for workspace ${workspaceId}:`, err);
      const appEnv = process.env.APP_ENV || process.env.APP_MODE || '';
      if (appEnv === 'production' || appEnv === 'staging' || process.env.STRICT_PERSISTENCE_GUARD === 'true') {
        throw new Error(`FAIL_CLOSED_PERSISTENCE_ERROR: Failed to read telephony calls in ${appEnv}: ${err.message}`);
      }
    }
  }

  return inMemoryCalls.filter(c => {
    if (c.id && c.id.startsWith('call_tool_')) return false;
    if (c.workspaceId === workspaceId) return true;
    if ((workspaceId === 'ws_wilmington' || workspaceId === 'nest-realty-demo') && 
        (c.workspaceId === 'ws_wilmington' || c.workspaceId === 'nest-realty-demo')) return true;
    return false;
  }).slice(0, limit);
}

/**
 * Retrieves a single telephony call by ID.
 */
export async function getTelephonyCallByIdAsync(
  callId: string,
  executor?: any
): Promise<PersistedTelephonyCall | null> {
  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      const res = await db.query(
        `SELECT * FROM telephony_calls WHERE id = $1 LIMIT 1`,
        [callId]
      );
      if (res.rows && res.rows.length > 0) {
        return mapRowToPersistedCall(res.rows[0]);
      }
      return null;
    } catch (err: any) {
      console.error(`[TelephonyRepository] Error fetching call by id ${callId}:`, err);
    }
  }

  return inMemoryCalls.find(c => c.id === callId) || null;
}

/**
 * Retrieves a telephony call by linked canonicalRequestId.
 */
export async function getTelephonyCallByRequestIdAsync(
  canonicalRequestId: string,
  executor?: any
): Promise<PersistedTelephonyCall | null> {
  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      const res = await db.query(
        `SELECT * FROM telephony_calls WHERE canonical_request_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [canonicalRequestId]
      );
      if (res.rows && res.rows.length > 0) {
        return mapRowToPersistedCall(res.rows[0]);
      }
      return null;
    } catch (err: any) {
      console.error(`[TelephonyRepository] Error fetching call by requestId ${canonicalRequestId}:`, err);
    }
  }

  return inMemoryCalls.find(c => c.canonicalRequestId === canonicalRequestId) || null;
}

/**
 * Links a telephony call to its created canonical request and task.
 */
export async function linkCallToCanonicalRequestAsync(
  callId: string,
  canonicalRequestId: string,
  canonicalTaskId?: string,
  executor?: any
): Promise<boolean> {
  // Update in memory
  const call = inMemoryCalls.find(c => c.id === callId);
  if (call) {
    call.canonicalRequestId = canonicalRequestId;
    if (canonicalTaskId) call.canonicalTaskId = canonicalTaskId;
    call.updatedAt = new Date().toISOString();
  }

  const db = executor || getDbPool() || dbPool;
  const isDb = Boolean((storageDriver === 'database' || getStorageDriver() === 'database' || executor) && db);
  if (isDb && db) {
    try {
      await db.query(
        `UPDATE telephony_calls 
         SET canonical_request_id = $2, 
             canonical_task_id = COALESCE($3, canonical_task_id),
             updated_at = NOW() 
         WHERE id = $1`,
        [callId, canonicalRequestId, canonicalTaskId || null]
      );
      return true;
    } catch (err: any) {
      console.error(`[TelephonyRepository] Error linking call ${callId} to request ${canonicalRequestId}:`, err);
      return false;
    }
  }

  return true;
}
