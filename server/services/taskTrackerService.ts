import crypto from 'crypto';
import { InboundMarketingCall } from '../integrations/marketingCallsService.js';
import { dispatchEmailViaResend } from '../email/resendDispatchAdapter.js';

export interface TrackerTimelineStage {
  id: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

export interface TrackerNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface TaskTrackerRecord {
  token: string;
  ticketId: string;
  callId: string;
  callerName: string;
  phone: string;
  email: string;
  propertyAddress: string;
  category: string;
  fourPointSummary: {
    callerNeed: string;
    noraAction: string;
    routedTo: string;
    estimatedDelivery: string;
  };
  status: 'received' | 'routed' | 'in_progress' | 'completed';
  currentStepIndex: number;
  stages: TrackerTimelineStage[];
  notes: TrackerNote[];
  callbackRequested: boolean;
  callbackRequestedAt?: string;
  createdAt: string;
  targetSla: string;
  slaRemainingMinutes: number;
}

// In-memory store for task trackers
const TRACKER_STORE = new Map<string, TaskTrackerRecord>();
const CALL_TO_TRACKER_MAP = new Map<string, string>();

function generateToken(_callId: string): string {
  return `trk_${crypto.randomBytes(32).toString('hex')}`;
}

function deriveFourPointSummary(call: InboundMarketingCall): TaskTrackerRecord['fourPointSummary'] {
  const category = call.departmentCategory || 'marketing_collateral';
  const lead = call.assignedLead || 'Ann (Operations Lead)';
  const address = call.propertyAddress || 'Wilmington Listing';

  let callerNeed = `Process request regarding ${address}.`;
  let noraAction = `Created operational ticket, parsed call transcript, and queued dispatch.`;
  let routedTo = lead;
  let estimatedDelivery = 'Today within 2 hours (3:00 PM EST)';

  if (category === 'sign_vendor') {
    callerNeed = `Install yard sign post & custom rider at ${address} before upcoming open house.`;
    noraAction = `Logged Sign Post work order, verified property coordinates, and dispatched vendor ticket to Coastal Sign Post Co.`;
    routedTo = 'Ann (Operations & Vendor Lead)';
    estimatedDelivery = 'Today by 3:00 PM EST (2 hours)';
  } else if (category === 'compliance_contract') {
    callerNeed = `Review Form 2-T Due Diligence Fee and WWREA signed agency disclosure for ${address}.`;
    noraAction = `Ran automated BIC compliance audit, flagged DDF payment timeline, and created BIC review item.`;
    routedTo = 'Ryan Crecelius (Broker-in-Charge)';
    estimatedDelivery = 'Today by 1:00 PM EST (1 hour)';
  } else if (category === 'commission_finance') {
    callerNeed = `Commission disbursement ledger settlement and 1099 accounting split for ${address}.`;
    noraAction = `Checked settlement statement against brokerage ledger and scheduled commission wire packet.`;
    routedTo = 'James (Finance Lead)';
    estimatedDelivery = 'Next Business Day 10:00 AM EST';
  } else if (category === 'facilities_tech') {
    callerNeed = `Conference room booking & Supra lockbox access for ${address}.`;
    noraAction = `Reserved conference facility and synced lockbox shackle codes to agent profile.`;
    routedTo = 'Marcus Aman (Tech & Facilities Lead)';
    estimatedDelivery = 'Immediate (Completed)';
  } else {
    callerNeed = `Produce full luxury marketing collateral package (Flyer, Social Graphic, Postcard) for ${address}.`;
    noraAction = `Ingested listing details into design engine, generated branded print & digital draft assets, and staged for review.`;
    routedTo = 'Melissa Jenkins (Marketing Director)';
    estimatedDelivery = 'Today by 5:00 PM EST';
  }

  return {
    callerNeed,
    noraAction,
    routedTo,
    estimatedDelivery
  };
}

export function createOrGetTrackerForCall(call: InboundMarketingCall): TaskTrackerRecord {
  if (CALL_TO_TRACKER_MAP.has(call.id)) {
    const existingToken = CALL_TO_TRACKER_MAP.get(call.id)!;
    const existing = TRACKER_STORE.get(existingToken);
    if (existing) {
      // Update with any newer call data
      existing.fourPointSummary = deriveFourPointSummary(call);
      existing.propertyAddress = call.propertyAddress;
      existing.callerName = call.callerName;
      existing.phone = call.phone;
      return existing;
    }
  }

  const token = generateToken(call.id);
  const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fourPoints = deriveFourPointSummary(call);

  const stages: TrackerTimelineStage[] = [
    {
      id: 'stg_1',
      label: 'Call Ingested by Nora',
      description: `Inbound voice call analyzed & 4-point action plan drafted at ${timeStr}.`,
      timestamp: `${timeStr} Today`,
      completed: true
    },
    {
      id: 'stg_2',
      label: `Dispatched to ${fourPoints.routedTo.split('(')[0].trim()}`,
      description: `Assigned to department lead with SLA target of ${fourPoints.estimatedDelivery}.`,
      timestamp: `${timeStr} Today`,
      completed: true,
      current: true
    },
    {
      id: 'stg_3',
      label: 'Department / Vendor Execution',
      description: `Work order active with assigned team lead.`,
      completed: false
    },
    {
      id: 'stg_4',
      label: 'Delivery & Confirmation',
      description: `Final deliverable proofed and confirmed with broker.`,
      completed: false
    }
  ];

  const tracker: TaskTrackerRecord = {
    token,
    ticketId,
    callId: call.id,
    callerName: call.callerName,
    phone: call.phone,
    email: call.brokerDetails?.email || 'broker@nestrealty.com',
    propertyAddress: call.propertyAddress,
    category: call.departmentCategory || 'marketing_collateral',
    fourPointSummary: fourPoints,
    status: 'in_progress',
    currentStepIndex: 1,
    stages,
    notes: [
      {
        id: `note_init_${Date.now()}`,
        author: 'Nora (AI Ops Assistant)',
        content: `Initial intake logged from caller ${call.callerName}. Auto-routed to ${fourPoints.routedTo}.`,
        createdAt: new Date().toISOString()
      }
    ],
    callbackRequested: false,
    createdAt: new Date().toISOString(),
    targetSla: fourPoints.estimatedDelivery,
    slaRemainingMinutes: 118
  };

  TRACKER_STORE.set(token, tracker);
  CALL_TO_TRACKER_MAP.set(call.id, token);

  return tracker;
}

export function getTrackerByToken(token: string): TaskTrackerRecord | null {
  return TRACKER_STORE.get(token) || null;
}

export function appendTrackerNote(token: string, author: string, content: string): TaskTrackerRecord | null {
  const tracker = TRACKER_STORE.get(token);
  if (!tracker) return null;

  tracker.notes.push({
    id: `note_${Date.now()}`,
    author: author || 'Caller / Broker',
    content,
    createdAt: new Date().toISOString()
  });

  return tracker;
}

export function requestTrackerCallback(token: string, phone?: string): TaskTrackerRecord | null {
  const tracker = TRACKER_STORE.get(token);
  if (!tracker) return null;

  tracker.callbackRequested = true;
  tracker.callbackRequestedAt = new Date().toISOString();
  tracker.notes.push({
    id: `note_cb_${Date.now()}`,
    author: 'Caller (Callback Request)',
    content: `🚨 Caller requested priority callback at ${phone || tracker.phone}.`,
    createdAt: new Date().toISOString()
  });

  return tracker;
}

export function formatFourPointSms(tracker: TaskTrackerRecord, baseUrl = 'https://shapework-574544976572.us-central1.run.app'): string {
  const firstName = tracker.callerName.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'there';
  const url = `${baseUrl}/tracker/${tracker.token}`;

  return `Hi ${firstName}, here is your Nest Ops follow-up with Nora:

1️⃣ What You Need: ${tracker.fourPointSummary.callerNeed}
2️⃣ What I'm Doing: ${tracker.fourPointSummary.noraAction}
3️⃣ Routed To: ${tracker.fourPointSummary.routedTo}
4️⃣ Estimated Delivery: ${tracker.fourPointSummary.estimatedDelivery}

📍 Track live progress & add notes:
${url}`;
}

export function formatFourPointEmailHtml(tracker: TaskTrackerRecord, baseUrl = 'https://shapework-574544976572.us-central1.run.app'): string {
  const firstName = tracker.callerName.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'there';
  const url = `${baseUrl}/tracker/${tracker.token}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #00635C; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 20px; font-weight: 800; color: #00635C; letter-spacing: -0.5px; }
    .ticket-badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; font-family: monospace; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .item-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .item-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .item-1 { color: #0284c7; }
    .item-2 { color: #00635C; }
    .item-3 { color: #7c3aed; }
    .item-4 { color: #059669; }
    .item-body { font-size: 14px; font-weight: 500; line-height: 1.5; color: #334155; }
    .btn-container { text-align: center; margin: 28px 0 16px 0; }
    .btn { display: inline-block; background-color: #00635C; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">NEST OPS · CALL FOLLOW-UP</div>
      <div class="ticket-badge">${tracker.ticketId}</div>
    </div>

    <div class="greeting">Hi ${firstName},</div>
    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
      Thank you for speaking with Nora. Below is your 4-point operational action summary for <strong>${tracker.propertyAddress}</strong>:
    </p>

    <div class="item-box">
      <div class="item-title item-1">1️⃣ What You Need</div>
      <div class="item-body">${tracker.fourPointSummary.callerNeed}</div>
    </div>

    <div class="item-box">
      <div class="item-title item-2">2️⃣ What I'm Doing (Nora)</div>
      <div class="item-body">${tracker.fourPointSummary.noraAction}</div>
    </div>

    <div class="item-box">
      <div class="item-title item-3">3️⃣ Assigned Department Lead</div>
      <div class="item-body"><strong>${tracker.fourPointSummary.routedTo}</strong></div>
    </div>

    <div class="item-box">
      <div class="item-title item-4">4️⃣ Estimated Time for Delivery</div>
      <div class="item-body"><strong>${tracker.fourPointSummary.estimatedDelivery}</strong></div>
    </div>

    <div class="btn-container">
      <a href="${url}" class="btn" target="_blank">View Live Task Tracker →</a>
    </div>

    <div class="footer">
      Nest Realty Wilmington · Ask Nora Operations Hub<br>
      Questions? Call our direct hotline anytime: +1 (910) 507-2047
    </div>
  </div>
</body>
</html>
`;
}

export async function sendFourPointFollowUp(
  call: InboundMarketingCall,
  baseUrl = 'https://shapework-574544976572.us-central1.run.app'
): Promise<{ success: boolean; smsSent: boolean; emailSent: boolean; tracker: TaskTrackerRecord }> {
  const tracker = createOrGetTrackerForCall(call);
  const smsBody = formatFourPointSms(tracker, baseUrl);
  const emailHtml = formatFourPointEmailHtml(tracker, baseUrl);

  let smsSent = false;
  let emailSent = false;

  // 1. Dispatch SMS with Safety Gate
  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER || '+19105072047';

    const { isAllowedSmsRecipient, recordSmsDispatch } = await import('../security/smsWhitelistGate.js');
    const safetyCheck = isAllowedSmsRecipient(tracker.phone, smsBody);

    if (!safetyCheck.allowed) {
      console.warn(`[SMS Safety Gate TaskTracker] Suppressed SMS to ${safetyCheck.maskedPhone}: ${safetyCheck.reason}`);
      smsSent = false;
    } else if (twilioSid && twilioAuth && !twilioSid.includes('MY_TWILIO') && process.env.NODE_ENV !== 'test') {
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: safetyCheck.cleanPhone,
        From: twilioPhone,
        Body: smsBody
      });

      const smsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      if (smsRes.ok) {
        recordSmsDispatch(safetyCheck.cleanPhone, smsBody);
        smsSent = true;
      }
    } else {
      // In development or test, mock SMS delivery for allowed numbers
      recordSmsDispatch(safetyCheck.cleanPhone, smsBody);
      console.log(`[TaskTracker] Mock SMS dispatched to ${safetyCheck.maskedPhone}:\n${smsBody}`);
      smsSent = true;
    }
  } catch (err) {
    console.warn('[TaskTracker] SMS dispatch failed:', err);
  }

  // 2. Dispatch Email via Resend with Safety Gate
  try {
    const emailRecipient = tracker.email;
    const { isAllowedEmailRecipient } = await import('../email/emailProvider.js');
    if (emailRecipient && isAllowedEmailRecipient(emailRecipient)) {
      const emailResult = await dispatchEmailViaResend({
        to: emailRecipient,
        subject: `[Nest Ops] Action Plan for ${tracker.propertyAddress} (${tracker.ticketId})`,
        html: emailHtml
      });
      emailSent = emailResult.success;
    } else {
      console.warn(`[Email Safety Gate TaskTracker] Suppressed email to ${emailRecipient}`);
    }
  } catch (err) {
    console.warn('[TaskTracker] Email dispatch failed:', err);
  }

  return {
    success: true,
    smsSent,
    emailSent,
    tracker
  };
}

export { resolveMarketingPortalTask as resolveMarketingTrackerTask } from './marketingPortalAccess.js';

export async function generateMarketingTrackerToken(taskId: string): Promise<string> {
  const { ensureMarketingPortalToken } = await import('./marketingPortalAccess.js');
  return ensureMarketingPortalToken(taskId);
}

export async function getMarketingTrackerByToken(token: string): Promise<any | null> {
  const { resolveMarketingPortalTask, hasApprovedCurrentProof, internalAssetFilename, safeExternalAssetUrl } = await import('./marketingPortalAccess.js');
  const task = await resolveMarketingPortalTask(token);
  if (!task) return null;
  const encoded = encodeURIComponent(token);
  const delivered = task.status === 'completed' && Boolean(task.routingSnapshot?.delivery?.messageId);
  const reviewing = task.reviewState === 'awaiting_review' || task.reviewState === 'approved';
  const index = delivered ? 4 : reviewing ? 3 : ['in_progress', 'in_production'].includes(task.status || '') ? 2 : task.status === 'assigned' ? 1 : 0;
  const labels = ['Request Received', 'Intake & Photos', 'Designing & Production', 'Director Review', 'Deliverables Sent'];
  const descriptions = [
    'Your marketing request is with Melissa for intake review.',
    'Listing details and photos are collected for production.',
    'The assigned producer prepares your marketing assets.',
    'Melissa reviews the current version before sending it.',
    'The approved assets have been sent to your email address.',
  ];
  const notes = task.routingSnapshot?.clientNotes || [];
  return {
    token, ticketId: `MK-${task.id.slice(-6).toUpperCase()}`, callId: task.id,
    callerName: task.agentName || 'Agent', phone: task.agentPhone || '', email: task.agentEmail || '',
    propertyAddress: task.propertyAddress || 'Listing property', category: task.category || 'marketing',
    status: delivered ? 'completed' : index >= 2 ? 'in_progress' : 'received',
    currentStepIndex: index,
    stages: labels.map((label, i) => ({ id: `stage_${i}`, label, description: descriptions[i], completed: i < index || delivered, current: i === index })),
    notes, callbackRequested: false, createdAt: task.createdAt, targetSla: task.dueAt || '', slaRemainingMinutes: 0,
    fourPointSummary: {
      callerNeed: task.title,
      noraAction: descriptions[index],
      routedTo: task.assignedTo || 'Melissa Gagliardi',
      estimatedDelivery: task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : 'Timing will be confirmed by marketing.',
    },
    isMarketingRequest: true, deliverables: [task.title], assignedLead: 'Melissa Gagliardi', assignedProducer: task.assignedTo,
    approvedDeliverables: hasApprovedCurrentProof(task) ? [{ name: task.title, url: `/api/track/marketing/${encoded}/deliverable` }] : [],
    canRequestRevision: delivered,
    photos: (task.photos || []).flatMap((photo, i) => {
      const url = internalAssetFilename(photo.url)
        ? `/api/track/marketing/${encoded}/media/${i}` : safeExternalAssetUrl(photo.url);
      return url ? [{ ...photo, url }] : [];
    }),
    externalLinks: task.driveFolderUrl && safeExternalAssetUrl(task.driveFolderUrl)
      ? [{ url: task.driveFolderUrl, title: 'Reference folder', type: 'drive' }] : [],
  };
}

// Each public mutation updates only the fields it owns. Database arrays/JSON are
// appended atomically so two browser requests cannot replace each other's data.
const ACTIVE_PORTAL_TASK_WHERE = `id = $1 AND workspace_id = $2
  AND COALESCE(is_archived, false) = false AND status <> 'archived'
  AND routing_snapshot->'clientPortal'->>'token' = $3
  AND routing_snapshot->'clientPortal'->>'revokedAt' IS NULL
  AND routing_snapshot->'clientPortal'->>'expiresAt' > $4`;
const CLIENT_NOTE_APPEND_SQL = `jsonb_set(COALESCE(routing_snapshot, '{}'::jsonb), '{clientNotes}',
  COALESCE(routing_snapshot->'clientNotes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'id', $5::text, 'author', COALESCE(NULLIF(agent_name, ''), 'Agent'), 'content', $6::text, 'createdAt', $4::text)))`;

export async function appendMarketingTrackerNote(token: string, authorOrNote: string, content?: string): Promise<any | null> {
  const { resolveMarketingPortalTask, getMarketingPortalDbPool, hydrateMarketingPortalTask, refreshMarketingPortalCache } = await import('./marketingPortalAccess.js');
  const { saveCanonicalMarketingTask, persistTaskToDatabase } = await import('../persistence/marketingCampaignsRepository.js');
  const rawNote = content === undefined ? authorOrNote : content;
  if (typeof rawNote !== 'string') return null;
  const note = rawNote.trim();
  if (!note || note.length > 5000) return null;
  const task = await resolveMarketingPortalTask(token);
  if (!task?.workspaceId) return null;
  const createdAt = new Date().toISOString();
  const noteId = crypto.randomUUID();
  const pool = getMarketingPortalDbPool();
  if (pool) {
    const result = await pool.query(`UPDATE canonical_marketing_tasks SET
      routing_snapshot = ${CLIENT_NOTE_APPEND_SQL},
      notes = concat_ws(E'\n\n', NULLIF(notes, ''), '[Agent note]: ' || $6::text), updated_at = NOW()
      WHERE ${ACTIVE_PORTAL_TASK_WHERE} RETURNING *`, [task.id, task.workspaceId, token, createdAt, noteId, note]);
    if (!result.rows[0]) return null;
    refreshMarketingPortalCache(hydrateMarketingPortalTask(result.rows[0]), ['notes', 'routingSnapshot', 'updatedAt']);
  } else {
    task.routingSnapshot = { ...task.routingSnapshot, clientNotes: [...(task.routingSnapshot?.clientNotes || []), {
      id: noteId, author: task.agentName || 'Agent', content: note, createdAt,
    }] };
    task.notes = `${task.notes || ''}\n\n[Agent note]: ${note}`.trim();
    task.updatedAt = createdAt;
    await persistTaskToDatabase(task); saveCanonicalMarketingTask(task);
  }
  return getMarketingTrackerByToken(token);
}

export async function requestMarketingTrackerRevision(token: string, feedback: string): Promise<any | null> {
  const { resolveMarketingPortalTask, getMarketingPortalDbPool, hydrateMarketingPortalTask, refreshMarketingPortalCache } = await import('./marketingPortalAccess.js');
  const { saveCanonicalMarketingTask, persistTaskToDatabase, getCanonicalMarketingRequestById, saveCanonicalMarketingRequest, persistRequestToDatabase } = await import('../persistence/marketingCampaignsRepository.js');
  if (typeof feedback !== 'string' || !feedback.trim() || feedback.length > 5000) return null;
  const task = await resolveMarketingPortalTask(token);
  if (!task?.workspaceId || task.status !== 'completed' || !task.routingSnapshot?.delivery?.messageId) return null;
  const note = feedback.trim();
  const createdAt = new Date().toISOString();
  const noteId = crypto.randomUUID();
  const pool = getMarketingPortalDbPool();
  if (pool) {
    const result = await pool.query(`WITH updated_task AS (
      UPDATE canonical_marketing_tasks SET status = 'in_progress', review_state = 'awaiting_review', completed_at = NULL,
        review_history = COALESCE(review_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'version', GREATEST(COALESCE(proof_version, 1), 1), 'action', 'revisions_requested',
          'reviewerName', COALESCE(NULLIF(agent_name, ''), 'Agent'), 'feedbackNotes', $6::text, 'timestamp', $4::text)),
        routing_snapshot = jsonb_set(${CLIENT_NOTE_APPEND_SQL}, '{revisionRequestedAt}', to_jsonb($4::text)),
        notes = concat_ws(E'\n\n', NULLIF(notes, ''), '[Agent note]: ' || $6::text), updated_at = NOW()
      WHERE ${ACTIVE_PORTAL_TASK_WHERE} AND status = 'completed'
        AND NULLIF(routing_snapshot->'delivery'->>'messageId', '') IS NOT NULL
      RETURNING *
    ), updated_request AS (
      UPDATE canonical_marketing_requests r SET status = 'in_progress', updated_at = NOW()
      FROM updated_task t WHERE r.id = t.request_id AND r.workspace_id = t.workspace_id AND COALESCE(r.is_archived, false) = false
      RETURNING r.id
    ) SELECT * FROM updated_task`, [task.id, task.workspaceId, token, createdAt, noteId, note]);
    if (!result.rows[0]) return null;
    const updated = hydrateMarketingPortalTask(result.rows[0]);
    refreshMarketingPortalCache(updated, ['status', 'reviewState', 'completedAt', 'reviewHistory', 'routingSnapshot', 'notes', 'updatedAt']);
    const request = updated.requestId ? getCanonicalMarketingRequestById(updated.requestId) : null;
    if (request?.workspaceId === updated.workspaceId && !request.isArchived) {
      request.status = 'in_progress'; request.updatedAt = updated.updatedAt;
    }
    return getMarketingTrackerByToken(token);
  }
  // Local development/test persistence uses the same object, without a stale database snapshot.
  task.status = 'in_progress'; task.reviewState = 'awaiting_review'; task.completedAt = undefined;
  task.proofNotes = note; task.updatedAt = createdAt;
  task.reviewHistory = [...(task.reviewHistory || []), {
    version: task.proofVersion || 1, action: 'revisions_requested', reviewerName: task.agentName || 'Agent', feedbackNotes: note, timestamp: createdAt,
  }];
  task.routingSnapshot = { ...task.routingSnapshot, revisionRequestedAt: createdAt };
  await persistTaskToDatabase(task); saveCanonicalMarketingTask(task);
  if (task.requestId) {
    const request = getCanonicalMarketingRequestById(task.requestId);
    if (request?.workspaceId === task.workspaceId) {
      request.status = 'in_progress'; request.updatedAt = createdAt;
      await persistRequestToDatabase(request); saveCanonicalMarketingRequest(request);
    }
  }
  return appendMarketingTrackerNote(token, note);
}

export async function addMarketingTrackerAsset(token: string, input: { filename: string; contentType: string; buffer: Buffer }): Promise<any | null> {
  const { resolveMarketingPortalTask, getMarketingPortalDbPool, hydrateMarketingPortalTask, refreshMarketingPortalCache } = await import('./marketingPortalAccess.js');
  const task = await resolveMarketingPortalTask(token);
  if (!task?.workspaceId) return null;
  const pool = getMarketingPortalDbPool();
  const { saveDurableAssetAsync } = await import('../persistence/durableAssetRepository.js');
  const { saveCanonicalMarketingTask, persistTaskToDatabase, getCanonicalMarketingRequestById, saveCanonicalMarketingRequest, persistRequestToDatabase } = await import('../persistence/marketingCampaignsRepository.js');
  const asset = await saveDurableAssetAsync({ ...input, workspaceId: task.workspaceId, taskId: task.id, metadata: { requestId: task.requestId, source: 'client_portal' } });
  const photo = { id: asset.id, name: asset.filename, url: asset.url, type: asset.contentType, sizeBytes: asset.sizeBytes };
  const createdAt = new Date().toISOString();
  if (pool) {
    const result = await pool.query(`WITH updated_task AS (
      UPDATE canonical_marketing_tasks SET photos = COALESCE(photos, '[]'::jsonb) || $5::jsonb, updated_at = NOW()
      WHERE ${ACTIVE_PORTAL_TASK_WHERE} RETURNING *
    ), updated_request AS (
      UPDATE canonical_marketing_requests r SET photos = COALESCE(r.photos, '[]'::jsonb) || $5::jsonb, updated_at = NOW()
      FROM updated_task t WHERE r.id = t.request_id AND r.workspace_id = t.workspace_id AND COALESCE(r.is_archived, false) = false
      RETURNING r.id
    ) SELECT * FROM updated_task`, [task.id, task.workspaceId, token, createdAt, JSON.stringify([photo])]);
    if (!result.rows[0]) return null;
    const updated = hydrateMarketingPortalTask(result.rows[0]);
    refreshMarketingPortalCache(updated, ['photos', 'updatedAt']);
    const request = updated.requestId ? getCanonicalMarketingRequestById(updated.requestId) : null;
    if (request?.workspaceId === updated.workspaceId && !request.isArchived) {
      request.photos = [...(request.photos || []), photo]; request.updatedAt = updated.updatedAt;
    }
  } else {
    task.photos = [...(task.photos || []), photo]; task.updatedAt = createdAt;
    await persistTaskToDatabase(task); saveCanonicalMarketingTask(task);
    if (task.requestId) {
      const request = getCanonicalMarketingRequestById(task.requestId);
      if (request?.workspaceId === task.workspaceId) {
        request.photos = [...(request.photos || []), photo]; request.updatedAt = createdAt;
        await persistRequestToDatabase(request); saveCanonicalMarketingRequest(request);
      }
    }
  }
  return getMarketingTrackerByToken(token);
}
