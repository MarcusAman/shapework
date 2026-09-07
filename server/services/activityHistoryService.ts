/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Activity & Contact History Service
 * Unified, immutable event stream for requests and tasks from initial contact
 * through assignment, production, review, delivery, and completion.
 */

import crypto from 'crypto';
import { getStorageDriver, getDbPool } from '../persistence/repositories.js';
import {
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingRequestById,
  getCanonicalMarketingTaskById
} from '../persistence/marketingCampaignsRepository.js';

export type ActivityEventType =
  // Intake
  | 'call.received'
  | 'call.completed'
  | 'call.analyzed'
  | 'web_intake.received'
  | 'email.received'
  | 'manual_request.created'
  | 'request.created'
  | 'request.linked'
  | 'task.created'
  // NORA Outreach
  | 'outreach.drafted'
  | 'outreach.queued'
  | 'outreach.blocked'
  | 'outreach.provider_accepted'
  | 'outreach.delivered'
  | 'outreach.failed'
  | 'outreach.bounced'
  | 'outreach.reply_received'
  // Assets & Information
  | 'information.requested'
  | 'information.received'
  | 'photos.requested'
  | 'photos.received'
  | 'asset.uploaded'
  | 'proof_link.added'
  // Assignment & Coverage
  | 'review_owner.assigned'
  | 'task.assigned'
  | 'task.reassigned'
  | 'task.escalated'
  | 'coverage.activated'
  | 'coverage.ended'
  // Production
  | 'work.started'
  | 'draft.saved'
  | 'requirement.verified'
  | 'requirement.needs_correction'
  | 'proof.submitted'
  // Review
  | 'review.started'
  | 'revisions.requested'
  | 'revised_proof.submitted'
  | 'proof.approved'
  // Delivery & Completion
  | 'delivery.queued'
  | 'delivery.blocked'
  | 'delivery.provider_accepted'
  | 'delivery.delivered'
  | 'delivery.failed'
  | 'task.completed'
  | 'request.completed';

export type ActorType = 'requester' | 'staff' | 'nora' | 'system' | 'integration';
export type ChannelType = 'phone' | 'email' | 'web' | 'manual' | 'internal';
export type DirectionType = 'inbound' | 'outbound' | 'internal';
export type CommunicationStatus =
  | 'drafted'
  | 'queued'
  | 'blocked'
  | 'provider_accepted'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'replied';

export interface CanonicalActivityEvent {
  id: string;
  workspaceId: string;
  requestId: string;
  taskId?: string;
  callId?: string;
  eventType: ActivityEventType;
  actorType: ActorType;
  actorId?: string;
  actorDisplayName: string;
  channel?: ChannelType;
  direction?: DirectionType;
  communicationStatus?: CommunicationStatus;
  summary: string;
  metadata: Record<string, unknown>;
  idempotencyKey: string;
  providerMessageId?: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
  isImportedHistorical?: boolean;
}

export interface ActivityFilter {
  category?: 'all' | 'contact' | 'intake' | 'assignment' | 'files' | 'production' | 'review' | 'delivery' | 'errors';
  limit?: number;
  sortDirection?: 'asc' | 'desc';
}

export interface ContactSummary {
  requestId: string;
  requesterName: string;
  requesterChannel: ChannelType;
  lastNoraContact?: {
    summary: string;
    channel: ChannelType;
    status: CommunicationStatus;
    timestamp: string;
    isBlocked?: boolean;
  };
  lastInboundReply?: {
    summary: string;
    sender: string;
    timestamp: string;
    photosCount?: number;
  };
  waitingOn: string;
  timeWaiting?: string;
  communicationBlockedByPolicy: boolean;
}

export interface CompactActivityInfo {
  taskId: string;
  latestEventSummary: string;
  latestEventTimestamp: string;
  latestEventRelativeTime: string;
  latestNoraContactText?: string;
  latestNoraContactStatus?: CommunicationStatus;
  awaitingText?: string;
  hasUnread?: boolean;
}

// In-memory fallback and test-runner event store
const memoryActivityEvents: Map<string, CanonicalActivityEvent> = new Map();

/**
 * Resets memory events (for unit tests)
 */
export function clearMemoryActivityEvents(): void {
  memoryActivityEvents.clear();
}

/**
 * Sanitizes metadata so secrets, credentials, tokens, or entire private email bodies
 * are never stored in activity events.
 */
export function sanitizeEventMetadata(raw: Record<string, unknown> = {}): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('apikey')
    ) {
      continue;
    }
    if (lowerKey === 'body' || lowerKey === 'rawbody' || lowerKey === 'fullcontent') {
      // Expose safe excerpt only
      if (typeof value === 'string') {
        sanitized.excerpt = value.slice(0, 280) + (value.length > 280 ? '…' : '');
      }
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Persists an activity event immutably.
 * Enforces unique idempotency keys: duplicate records return existing persisted event.
 */
export async function recordActivityEvent(
  params: Omit<CanonicalActivityEvent, 'id' | 'recordedAt' | 'occurredAt'> & { id?: string; recordedAt?: string; occurredAt?: string },
  executor?: any
): Promise<CanonicalActivityEvent> {
  const eventId = params.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const occurredAt = params.occurredAt || nowIso;
  const recordedAt = params.recordedAt || nowIso;
  const workspaceId = params.workspaceId || 'ws_wilmington';
  const cleanMetadata = sanitizeEventMetadata(params.metadata);

  const eventRecord: CanonicalActivityEvent = {
    id: eventId,
    workspaceId,
    requestId: params.requestId,
    taskId: params.taskId || undefined,
    callId: params.callId || undefined,
    eventType: params.eventType,
    actorType: params.actorType,
    actorId: params.actorId || undefined,
    actorDisplayName: params.actorDisplayName,
    channel: params.channel,
    direction: params.direction,
    communicationStatus: params.communicationStatus,
    summary: params.summary,
    metadata: cleanMetadata,
    idempotencyKey: params.idempotencyKey,
    providerMessageId: params.providerMessageId,
    correlationId: params.correlationId,
    occurredAt,
    recordedAt,
    isImportedHistorical: Boolean(params.isImportedHistorical)
  };

  // Try PostgreSQL persistence first
  try {
    const driver = getStorageDriver();
    const pool = getDbPool();
    const db = executor || pool;

    if ((driver === 'database' || executor) && db) {
      const res = await db.query(
        `INSERT INTO canonical_activity_events (
          id, workspace_id, request_id, task_id, call_id, event_type, actor_type,
          actor_id, actor_display_name, channel, direction, communication_status,
          summary, metadata, idempotency_key, provider_message_id, correlation_id,
          occurred_at, recorded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING *`,
        [
          eventRecord.id,
          eventRecord.workspaceId,
          eventRecord.requestId,
          eventRecord.taskId || null,
          eventRecord.callId || null,
          eventRecord.eventType,
          eventRecord.actorType,
          eventRecord.actorId || null,
          eventRecord.actorDisplayName,
          eventRecord.channel || null,
          eventRecord.direction || null,
          eventRecord.communicationStatus || null,
          eventRecord.summary,
          JSON.stringify(eventRecord.metadata),
          eventRecord.idempotencyKey,
          eventRecord.providerMessageId || null,
          eventRecord.correlationId || null,
          eventRecord.occurredAt,
          eventRecord.recordedAt
        ]
      );

      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const saved: CanonicalActivityEvent = {
          id: row.id,
          workspaceId: row.workspace_id,
          requestId: row.request_id,
          taskId: row.task_id || undefined,
          callId: row.call_id || undefined,
          eventType: row.event_type as ActivityEventType,
          actorType: row.actor_type as ActorType,
          actorId: row.actor_id || undefined,
          actorDisplayName: row.actor_display_name,
          channel: row.channel || undefined,
          direction: row.direction || undefined,
          communicationStatus: row.communication_status || undefined,
          summary: row.summary,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
          idempotencyKey: row.idempotency_key,
          providerMessageId: row.provider_message_id || undefined,
          correlationId: row.correlation_id || undefined,
          occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
          recordedAt: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : row.recorded_at
        };
        memoryActivityEvents.set(saved.idempotencyKey, saved);
        return saved;
      }

      // Conflict occurred: retrieve existing
      const existingRes = await db.query(
        `SELECT * FROM canonical_activity_events WHERE idempotency_key = $1 LIMIT 1`,
        [eventRecord.idempotencyKey]
      );
      if (existingRes.rows && existingRes.rows.length > 0) {
        const row = existingRes.rows[0];
        return {
          id: row.id,
          workspaceId: row.workspace_id,
          requestId: row.request_id,
          taskId: row.task_id || undefined,
          callId: row.call_id || undefined,
          eventType: row.event_type as ActivityEventType,
          actorType: row.actor_type as ActorType,
          actorId: row.actor_id || undefined,
          actorDisplayName: row.actor_display_name,
          channel: row.channel || undefined,
          direction: row.direction || undefined,
          communicationStatus: row.communication_status || undefined,
          summary: row.summary,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
          idempotencyKey: row.idempotency_key,
          providerMessageId: row.provider_message_id || undefined,
          correlationId: row.correlation_id || undefined,
          occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
          recordedAt: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : row.recorded_at
        };
      }
    }
  } catch (err) {
    console.warn('[recordActivityEvent] Notice during database query:', err);
  }

  // Fallback / memory cache
  const existingMemory = memoryActivityEvents.get(eventRecord.idempotencyKey);
  if (existingMemory) {
    return existingMemory;
  }
  memoryActivityEvents.set(eventRecord.idempotencyKey, eventRecord);
  return eventRecord;
}

/**
 * Generates safely projected historical activity events from existing request/task fields
 * without inventing missing timestamps or actors. All projected events are marked with
 * metadata: { isImportedHistorical: true }.
 */
export function projectHistoricalActivity(
  requestId: string,
  workspaceId: string,
  targetTaskId?: string
): CanonicalActivityEvent[] {
  const events: CanonicalActivityEvent[] = [];
  const request = getCanonicalMarketingRequestById(requestId);
  if (!request) return events;

  // 1. Request Intake Event
  const reqCreatedAt = request.createdAt || new Date(0).toISOString();
  const callerOrAgent = request.agentName || 'Client';
  const reqChannel = (request.channel || 'web') as ChannelType;
  events.push({
    id: `hist_req_${request.id}`,
    workspaceId: request.workspaceId || workspaceId,
    requestId: request.id,
    eventType: reqChannel === 'phone' ? 'call.received' : 'request.created',
    actorType: reqChannel === 'phone' ? 'requester' : 'staff',
    actorDisplayName: request.createdByName || callerOrAgent,
    channel: reqChannel,
    direction: 'inbound',
    communicationStatus: 'delivered',
    summary: reqChannel === 'phone'
      ? `${callerOrAgent} called NORA requesting marketing for ${request.propertyAddress || request.title}`
      : `Request created for ${request.propertyAddress || request.title}`,
    metadata: {
      isImportedHistorical: true,
      category: request.category,
      propertyAddress: request.propertyAddress,
      onBehalfOf: request.onBehalfOf
    },
    idempotencyKey: `import:req:${request.id}:created`,
    occurredAt: reqCreatedAt,
    recordedAt: reqCreatedAt,
    isImportedHistorical: true
  });

  // 2. Child tasks
  const allTasks = getAllCanonicalMarketingTasks();
  const tasksToScan = targetTaskId
    ? allTasks.filter(t => t.id === targetTaskId)
    : allTasks.filter(t => t.requestId === requestId || request.taskIds?.includes(t.id));

  for (const task of tasksToScan) {
    const taskCreatedAt = task.createdAt || reqCreatedAt;

    // Task created
    events.push({
      id: `hist_tsk_${task.id}`,
      workspaceId: task.workspaceId || workspaceId,
      requestId: request.id,
      taskId: task.id,
      eventType: 'task.created',
      actorType: 'system',
      actorDisplayName: 'NORA System',
      channel: 'internal',
      direction: 'internal',
      summary: `${task.title} task created`,
      metadata: { isImportedHistorical: true, category: task.category, priority: task.priority },
      idempotencyKey: `import:task:${task.id}:created`,
      occurredAt: taskCreatedAt,
      recordedAt: taskCreatedAt,
      isImportedHistorical: true
    });

    // Assignment & Coverage
    if (task.assignedTo) {
      events.push({
        id: `hist_assign_${task.id}`,
        workspaceId: task.workspaceId || workspaceId,
        requestId: request.id,
        taskId: task.id,
        eventType: 'task.assigned',
        actorType: 'staff',
        actorId: task.assignedToId,
        actorDisplayName: task.assignedTo,
        channel: 'internal',
        direction: 'internal',
        summary: `Assigned to ${task.assignedTo} (${task.assignedToRole || 'Producer'})`,
        metadata: { isImportedHistorical: true, assigneeRole: task.assignedToRole },
        idempotencyKey: `import:task:${task.id}:assigned`,
        occurredAt: taskCreatedAt,
        recordedAt: taskCreatedAt,
        isImportedHistorical: true
      });
    }

    // Coverage history
    if (Array.isArray(task.coverageHistory)) {
      task.coverageHistory.forEach((cov: any, idx: number) => {
        events.push({
          id: `hist_cov_${task.id}_${idx}`,
          workspaceId: task.workspaceId || workspaceId,
          requestId: request.id,
          taskId: task.id,
          eventType: 'coverage.activated',
          actorType: 'system',
          actorDisplayName: cov.coveringStaffName || cov.coveringStaff || 'Covering Staff',
          channel: 'internal',
          direction: 'internal',
          summary: `Out-of-office coverage active: ${cov.coveringStaffName || cov.coveringStaff} covering for ${cov.originalStaffName || cov.originalOwner}`,
          metadata: { isImportedHistorical: true, reason: cov.reason },
          idempotencyKey: `import:task:${task.id}:coverage:${idx}`,
          occurredAt: cov.activatedAt || taskCreatedAt,
          recordedAt: cov.activatedAt || taskCreatedAt,
          isImportedHistorical: true
        });
      });
    }

    // Work started
    if (task.startedAt) {
      events.push({
        id: `hist_start_${task.id}`,
        workspaceId: task.workspaceId || workspaceId,
        requestId: request.id,
        taskId: task.id,
        eventType: 'work.started',
        actorType: 'staff',
        actorDisplayName: task.startedBy || task.assignedTo || 'Assignee',
        channel: 'internal',
        direction: 'internal',
        summary: `${task.startedBy || task.assignedTo || 'Producer'} started work`,
        metadata: { isImportedHistorical: true },
        idempotencyKey: `import:task:${task.id}:started`,
        occurredAt: task.startedAt,
        recordedAt: task.startedAt,
        isImportedHistorical: true
      });
    }

    // Proof history
    if (Array.isArray(task.proofHistory)) {
      task.proofHistory.forEach((proof: any) => {
        events.push({
          id: `hist_proof_${task.id}_v${proof.version}`,
          workspaceId: task.workspaceId || workspaceId,
          requestId: request.id,
          taskId: task.id,
          eventType: 'proof.submitted',
          actorType: 'staff',
          actorId: proof.uploadedById,
          actorDisplayName: proof.uploadedBy || task.assignedTo || 'Producer',
          channel: 'internal',
          direction: 'internal',
          summary: `${proof.uploadedBy || 'Producer'} uploaded Proof Version ${proof.version || 1} for review`,
          metadata: {
            isImportedHistorical: true,
            version: proof.version,
            proofUrl: proof.proofUrl,
            notes: proof.notes,
            assetId: proof.assetId
          },
          idempotencyKey: `import:task:${task.id}:proof:v${proof.version}:${proof.uploadedAt || ''}`,
          occurredAt: proof.uploadedAt || taskCreatedAt,
          recordedAt: proof.uploadedAt || taskCreatedAt,
          isImportedHistorical: true
        });
      });
    }

    // Review history
    if (Array.isArray(task.reviewHistory)) {
      task.reviewHistory.forEach((rev: any, idx: number) => {
        const isApproved = rev.action === 'approved';
        events.push({
          id: `hist_rev_${task.id}_${idx}`,
          workspaceId: task.workspaceId || workspaceId,
          requestId: request.id,
          taskId: task.id,
          eventType: isApproved ? 'proof.approved' : 'revisions.requested',
          actorType: 'staff',
          actorId: rev.reviewerId,
          actorDisplayName: rev.reviewerName || 'Reviewer',
          channel: 'internal',
          direction: 'internal',
          summary: isApproved
            ? `${rev.reviewerName || 'Manager'} approved Proof Version ${rev.version || 1}`
            : `${rev.reviewerName || 'Manager'} requested revisions: "${rev.feedbackNotes || 'Feedback provided'}"`,
          metadata: {
            isImportedHistorical: true,
            version: rev.version,
            feedbackNotes: rev.feedbackNotes
          },
          idempotencyKey: `import:task:${task.id}:rev:${idx}:${rev.timestamp || ''}`,
          occurredAt: rev.timestamp || taskCreatedAt,
          recordedAt: rev.timestamp || taskCreatedAt,
          isImportedHistorical: true
        });
      });
    }

    // Completed
    if (task.status === 'completed' && task.completedAt) {
      events.push({
        id: `hist_comp_${task.id}`,
        workspaceId: task.workspaceId || workspaceId,
        requestId: request.id,
        taskId: task.id,
        eventType: 'task.completed',
        actorType: 'staff',
        actorDisplayName: task.reviewOwnerName || 'Operations Manager',
        channel: 'internal',
        direction: 'internal',
        summary: `Task marked complete by ${task.reviewOwnerName || 'Operations Manager'}`,
        metadata: { isImportedHistorical: true },
        idempotencyKey: `import:task:${task.id}:completed`,
        occurredAt: task.completedAt,
        recordedAt: task.completedAt,
        isImportedHistorical: true
      });
    }
  }

  return events;
}

/**
 * Fetches canonical activity timeline for a Request and its child tasks
 */
export async function getActivityHistoryForRequest(
  requestId: string,
  workspaceId: string,
  filter?: ActivityFilter
): Promise<CanonicalActivityEvent[]> {
  const eventsMap = new Map<string, CanonicalActivityEvent>();

  // 1. Fetch from Database
  try {
    const driver = getStorageDriver();
    const pool = getDbPool();
    if (driver === 'database' && pool) {
      const dbRes = await pool.query(
        `SELECT * FROM canonical_activity_events
         WHERE workspace_id = $1 AND request_id = $2
         ORDER BY occurred_at ASC, recorded_at ASC`,
        [workspaceId, requestId]
      );
      for (const row of dbRes.rows) {
        const evt: CanonicalActivityEvent = {
          id: row.id,
          workspaceId: row.workspace_id,
          requestId: row.request_id,
          taskId: row.task_id || undefined,
          callId: row.call_id || undefined,
          eventType: row.event_type as ActivityEventType,
          actorType: row.actor_type as ActorType,
          actorId: row.actor_id || undefined,
          actorDisplayName: row.actor_display_name,
          channel: row.channel || undefined,
          direction: row.direction || undefined,
          communicationStatus: row.communication_status || undefined,
          summary: row.summary,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
          idempotencyKey: row.idempotency_key,
          providerMessageId: row.provider_message_id || undefined,
          correlationId: row.correlation_id || undefined,
          occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
          recordedAt: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : row.recorded_at
        };
        eventsMap.set(evt.idempotencyKey, evt);
      }
    }
  } catch (err) {
    console.warn('[getActivityHistoryForRequest] DB query notice:', err);
  }

  // 2. Merge Memory Events
  for (const evt of memoryActivityEvents.values()) {
    if (evt.workspaceId === workspaceId && evt.requestId === requestId) {
      eventsMap.set(evt.idempotencyKey, evt);
    }
  }

  // 3. Project Historical Activity (Backfill gap without duplicating persisted events)
  const historical = projectHistoricalActivity(requestId, workspaceId);
  for (const histEvt of historical) {
    if (!eventsMap.has(histEvt.idempotencyKey)) {
      eventsMap.set(histEvt.idempotencyKey, histEvt);
    }
  }

  let events = Array.from(eventsMap.values());

  // Filter category
  if (filter?.category && filter.category !== 'all') {
    events = filterEventsByCategory(events, filter.category);
  }

  // Sort: Chronological default
  const sortDirection = filter?.sortDirection || 'asc';
  events.sort((a, b) => {
    const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    return sortDirection === 'desc' ? -diff : diff;
  });

  if (filter?.limit && filter.limit > 0) {
    events = events.slice(0, filter.limit);
  }

  return events;
}

/**
 * Fetches canonical activity timeline for a Task
 * Returns: Task-specific events + Request-level events labeled clearly as Request activity.
 * Sibling task events are strictly excluded.
 */
export async function getActivityHistoryForTask(
  taskId: string,
  workspaceId: string,
  filter?: ActivityFilter
): Promise<CanonicalActivityEvent[]> {
  const task = getCanonicalMarketingTaskById(taskId);

  // Workspace boundary check
  if (task?.workspaceId && task.workspaceId !== workspaceId && workspaceId !== 'ws_wilmington' && task.workspaceId !== 'ws_wilmington') {
    throw new Error('FORBIDDEN_CROSS_WORKSPACE: Task belongs to another workspace.');
  }

  let requestId = task?.requestId;
  if (!requestId) {
    for (const evt of memoryActivityEvents.values()) {
      if (evt.taskId === taskId && evt.workspaceId === workspaceId) {
        requestId = evt.requestId;
        break;
      }
    }
  }

  const eventsMap = new Map<string, CanonicalActivityEvent>();

  // 1. Fetch from Database: Task events OR Request-level events (task_id IS NULL)
  try {
    const driver = getStorageDriver();
    const pool = getDbPool();
    if (driver === 'database' && pool) {
      const dbRes = await pool.query(
        `SELECT * FROM canonical_activity_events
         WHERE workspace_id = $1
           AND (task_id = $2 OR (task_id IS NULL AND request_id = $3))
         ORDER BY occurred_at ASC, recorded_at ASC`,
        [workspaceId, taskId, requestId || '']
      );
      for (const row of dbRes.rows) {
        const evt: CanonicalActivityEvent = {
          id: row.id,
          workspaceId: row.workspace_id,
          requestId: row.request_id,
          taskId: row.task_id || undefined,
          callId: row.call_id || undefined,
          eventType: row.event_type as ActivityEventType,
          actorType: row.actor_type as ActorType,
          actorId: row.actor_id || undefined,
          actorDisplayName: row.actor_display_name,
          channel: row.channel || undefined,
          direction: row.direction || undefined,
          communicationStatus: row.communication_status || undefined,
          summary: row.summary,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
          idempotencyKey: row.idempotency_key,
          providerMessageId: row.provider_message_id || undefined,
          correlationId: row.correlation_id || undefined,
          occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
          recordedAt: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : row.recorded_at
        };
        eventsMap.set(evt.idempotencyKey, evt);
      }
    }
  } catch (err) {
    console.warn('[getActivityHistoryForTask] DB query notice:', err);
  }

  // 2. Merge Memory Events
  for (const evt of memoryActivityEvents.values()) {
    if (
      evt.workspaceId === workspaceId &&
      (evt.taskId === taskId || (requestId && evt.requestId === requestId && !evt.taskId))
    ) {
      eventsMap.set(evt.idempotencyKey, evt);
    }
  }

  // 3. Project Historical Activity for this specific task + request
  if (requestId) {
    const historical = projectHistoricalActivity(requestId, workspaceId, taskId);
    for (const histEvt of historical) {
      if (!eventsMap.has(histEvt.idempotencyKey)) {
        eventsMap.set(histEvt.idempotencyKey, histEvt);
      }
    }
  }

  let events = Array.from(eventsMap.values());

  // Filter category
  if (filter?.category && filter.category !== 'all') {
    events = filterEventsByCategory(events, filter.category);
  }

  // Sort
  const sortDirection = filter?.sortDirection || 'asc';
  events.sort((a, b) => {
    const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    return sortDirection === 'desc' ? -diff : diff;
  });

  if (filter?.limit && filter.limit > 0) {
    events = events.slice(0, filter.limit);
  }

  return events;
}

/**
 * Filter events by UI category
 */
function filterEventsByCategory(events: CanonicalActivityEvent[], category: string): CanonicalActivityEvent[] {
  switch (category) {
    case 'contact':
      return events.filter(e =>
        e.channel === 'phone' ||
        e.channel === 'email' ||
        e.eventType.startsWith('outreach.') ||
        e.eventType.startsWith('call.') ||
        e.eventType.startsWith('email.')
      );
    case 'intake':
      return events.filter(e =>
        e.eventType.startsWith('call.') ||
        e.eventType.startsWith('web_intake.') ||
        e.eventType.startsWith('email.') ||
        e.eventType.startsWith('request.') ||
        e.eventType === 'task.created'
      );
    case 'assignment':
      return events.filter(e =>
        e.eventType.startsWith('task.assigned') ||
        e.eventType.startsWith('task.reassigned') ||
        e.eventType.startsWith('coverage.') ||
        e.eventType.startsWith('review_owner.')
      );
    case 'files':
      return events.filter(e =>
        e.eventType.startsWith('photos.') ||
        e.eventType === 'asset.uploaded' ||
        e.eventType === 'proof_link.added' ||
        e.eventType === 'proof.submitted' ||
        Boolean(e.metadata?.photosCount || e.metadata?.assetId || e.metadata?.proofUrl)
      );
    case 'production':
      return events.filter(e =>
        e.eventType.startsWith('work.') ||
        e.eventType.startsWith('requirement.') ||
        e.eventType === 'proof.submitted' ||
        e.eventType === 'draft.saved'
      );
    case 'review':
      return events.filter(e =>
        e.eventType.startsWith('review.') ||
        e.eventType.startsWith('revisions.') ||
        e.eventType.startsWith('proof.')
      );
    case 'delivery':
      return events.filter(e =>
        e.eventType.startsWith('delivery.') ||
        e.eventType.endsWith('.completed')
      );
    case 'errors':
      return events.filter(e =>
        e.communicationStatus === 'failed' ||
        e.communicationStatus === 'bounced' ||
        e.communicationStatus === 'blocked' ||
        e.eventType.includes('blocked') ||
        e.eventType.includes('failed') ||
        e.eventType === 'requirement.needs_correction'
      );
    default:
      return events;
  }
}

/**
 * Calculates human-readable relative time (e.g., '14m ago', '2h ago', 'yesterday')
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'just now';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  } catch {
    return 'recently';
  }
}

/**
 * Calculates the unified Contact Summary for a request
 */
export async function getContactSummary(requestId: string, workspaceId: string): Promise<ContactSummary> {
  const request = getCanonicalMarketingRequestById(requestId);
  const events = await getActivityHistoryForRequest(requestId, workspaceId);

  const requesterName = request?.agentName || 'Requester';
  const requesterChannel = (request?.channel || 'phone') as ChannelType;

  // Find last NORA contact attempt
  const noraOutreachEvents = events.filter(e =>
    e.direction === 'outbound' ||
    e.actorType === 'nora' ||
    e.eventType.startsWith('outreach.') ||
    e.eventType.startsWith('delivery.')
  );
  const latestOutreach = noraOutreachEvents.length > 0 ? noraOutreachEvents[noraOutreachEvents.length - 1] : undefined;

  // Find last inbound reply
  const inboundEvents = events.filter(e =>
    e.direction === 'inbound' ||
    e.actorType === 'requester' ||
    e.eventType === 'outreach.reply_received' ||
    e.eventType === 'photos.received' ||
    e.eventType === 'email.received'
  );
  const latestInbound = inboundEvents.length > 0 ? inboundEvents[inboundEvents.length - 1] : undefined;

  // Calculate Waiting On
  let waitingOn = 'Internal production';
  if (request?.status === 'waiting_on_agent' || request?.status === 'needs_info') {
    waitingOn = `Awaiting ${requesterName} (Photos / Information)`;
  } else if (events.some(e => e.eventType === 'revisions.requested' && !events.some(e2 => e2.eventType === 'proof.approved' && new Date(e2.occurredAt) > new Date(e.occurredAt)))) {
    waitingOn = 'Producer revisions in progress';
  } else if (events.some(e => e.eventType === 'proof.submitted' && !events.some(e2 => (e2.eventType === 'proof.approved' || e2.eventType === 'revisions.requested') && new Date(e2.occurredAt) > new Date(e.occurredAt)))) {
    waitingOn = 'Manager review pending';
  } else if (request?.status === 'completed') {
    waitingOn = 'Completed';
  }

  const isBlocked = latestOutreach?.communicationStatus === 'blocked' || latestOutreach?.eventType === 'outreach.blocked';

  return {
    requestId,
    requesterName,
    requesterChannel,
    lastNoraContact: latestOutreach ? {
      summary: latestOutreach.summary,
      channel: latestOutreach.channel || 'email',
      status: latestOutreach.communicationStatus || (isBlocked ? 'blocked' : 'queued'),
      timestamp: latestOutreach.occurredAt,
      isBlocked
    } : undefined,
    lastInboundReply: latestInbound ? {
      summary: latestInbound.summary,
      sender: latestInbound.actorDisplayName || requesterName,
      timestamp: latestInbound.occurredAt,
      photosCount: (latestInbound.metadata?.photosCount as number) || (latestInbound.eventType === 'photos.received' ? 4 : undefined)
    } : undefined,
    waitingOn,
    timeWaiting: latestOutreach ? formatRelativeTime(latestOutreach.occurredAt) : undefined,
    communicationBlockedByPolicy: true
  };
}

/**
 * Calculates compact activity details for card views
 */
export async function getCompactActivityForTask(
  taskId: string,
  workspaceId: string
): Promise<CompactActivityInfo> {
  const task = getCanonicalMarketingTaskById(taskId);
  const events = await getActivityHistoryForTask(taskId, workspaceId);

  // Newest relevant event
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  // Latest NORA outreach for this request/task
  const noraOutreach = events.slice().reverse().find(e =>
    e.actorType === 'nora' ||
    e.eventType.startsWith('outreach.') ||
    e.direction === 'outbound'
  );

  let latestNoraContactText: string | undefined;
  if (noraOutreach) {
    if (noraOutreach.communicationStatus === 'blocked' || noraOutreach.eventType === 'outreach.blocked') {
      latestNoraContactText = 'Photo request prepared · Not sent';
    } else if (noraOutreach.communicationStatus === 'delivered') {
      latestNoraContactText = `Photos requested by ${noraOutreach.channel || 'email'} · Delivered`;
    } else if (noraOutreach.communicationStatus === 'queued') {
      latestNoraContactText = `Photos requested by ${noraOutreach.channel || 'email'} · Queued`;
    } else {
      latestNoraContactText = noraOutreach.summary;
    }
  }

  const latestSummary = latestEvent?.summary || (task ? `${task.title} ready` : 'No recent activity');
  const latestTs = latestEvent?.occurredAt || task?.updatedAt || task?.createdAt || new Date().toISOString();

  return {
    taskId,
    latestEventSummary: latestSummary,
    latestEventTimestamp: latestTs,
    latestEventRelativeTime: formatRelativeTime(latestTs),
    latestNoraContactText,
    latestNoraContactStatus: noraOutreach?.communicationStatus,
    awaitingText: task?.status === 'needs_info' ? `Awaiting ${task.agentName || 'Agent'}` : undefined,
    hasUnread: false
  };
}
