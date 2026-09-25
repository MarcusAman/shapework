/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Brokerage calendar routes. Session plus manage_integrations.
 * Mutating requests also require the CSRF header.
 * The requester is the session user. A body that names someone else is rejected.
 */

import { Router } from 'express';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, AuthenticatedRequest } from '../auth/auth.js';
import { csrfProtection } from '../auth/csrf.js';

type SessionRequester =
  | { ok: true; id: string; name: string; email: string }
  | { ok: false; status: number; error: string };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveSessionRequester(
  authUser: { id?: string | null; name?: string | null; email?: string | null } | null | undefined,
  requested: { userId?: unknown; requesterName?: unknown; requesterEmail?: unknown } | null | undefined,
  queryUserId?: unknown,
): SessionRequester {
  const id = text(authUser?.id);
  const name = text(authUser?.name);
  const email = text(authUser?.email);
  if (!id || !name) {
    return { ok: false, status: 400, error: 'Session user is required' };
  }
  const ids = [requested?.userId, queryUserId].map(text).filter(Boolean);
  if (ids.some((value) => value !== id)) {
    return { ok: false, status: 400, error: 'Requester must be the session user' };
  }
  const askedName = text(requested?.requesterName);
  if (askedName && askedName.toLowerCase() !== name.toLowerCase()) {
    return { ok: false, status: 400, error: 'Requester must be the session user' };
  }
  const askedEmail = text(requested?.requesterEmail);
  if (askedEmail && askedEmail.toLowerCase() !== email.toLowerCase()) {
    return { ok: false, status: 400, error: 'Requester must be the session user' };
  }
  return { ok: true, id, name, email };
}

function requireCalendarAccess(req: any, res: any, next: any) {
  const authed = req as AuthenticatedRequest;
  requireAuth(authed, res, () => {
    void resolveWorkspaceContext(authed, res, () => {
      requireWorkspaceMembership(authed, res, () => {
        requirePermission('manage_integrations')(authed, res, () => {
          csrfProtection(req, res, next);
        });
      });
    });
  });
}

function requesterOrReject(req: any, res: any): Extract<SessionRequester, { ok: true }> | undefined {
  const actor = resolveSessionRequester(req.authUser, req.body, req.query?.userId);
  if (!actor.ok) {
    res.status(actor.status).json({ success: false, error: actor.error });
    return undefined;
  }
  return actor;
}

export function getBrokerageCalendarRouter(
  dbState: any,
  persistState: (targetWorkspaceId?: string) => Promise<void>,
): Router {
  const router = Router();

  // POST /api/calendar/brokerage-meeting - Schedule Brokerage Meeting via AskNora@nestrealty.com
  router.post('/brokerage-meeting', requireCalendarAccess, async (req: any, res) => {
    try {
      const actor = requesterOrReject(req, res);
      if (!actor) return;
      const { scheduleBrokerageMeeting } = await import('../services/brokerageCalendarService.js');
      const workspaceId = req.body?.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const {
        requesterName: _requesterName,
        requesterEmail: _requesterEmail,
        userId: _userId,
        ...rest
      } = req.body || {};
      const result = await scheduleBrokerageMeeting({
        ...rest,
        requesterName: actor.name,
        requesterEmail: actor.email,
        workspaceId,
        dbState
      });
      return res.json({ success: true, meeting: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/calendar/brokerage-meetings - List Scheduled Brokerage Meetings
  router.get('/brokerage-meetings', requireCalendarAccess, async (req: any, res) => {
    try {
      const { CalendarRepository } = await import('../persistence/calendarRepository.js');
      const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const meetings = await CalendarRepository.listScheduledMeetings(String(workspaceId));
      return res.json({ success: true, meetings, count: meetings.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/calendar/diagnostics - Google Calendar Connection & Readiness Diagnostic
  router.get('/diagnostics', requireCalendarAccess, async (req: any, res) => {
    try {
      const { GoogleCalendarDiagnosticService } = await import('../services/googleCalendarDiagnosticService.js');
      const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const report = await GoogleCalendarDiagnosticService.runDiagnostics(String(workspaceId), dbState);
      return res.json({ success: true, diagnostics: report });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/calendar/available-calendars - List Google Calendars for AskNora account
  router.get('/available-calendars', requireCalendarAccess, async (req: any, res) => {
    try {
      const { GoogleCalendarDiagnosticService } = await import('../services/googleCalendarDiagnosticService.js');
      const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const result = await GoogleCalendarDiagnosticService.listAvailableCalendars(String(workspaceId), dbState);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/calendar/select-target - Select and persist target calendar
  router.post('/select-target', requireCalendarAccess, async (req: any, res) => {
    try {
      const { CalendarRepository } = await import('../persistence/calendarRepository.js');
      const { GoogleCalendarDiagnosticService } = await import('../services/googleCalendarDiagnosticService.js');
      const workspaceId = req.body.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const { selectedCalendarId, selectedCalendarName, accessRole, timezone, autoMeetEnabled, isDedicatedNoraCalendar } = req.body;

      if (!selectedCalendarId || !selectedCalendarName) {
        return res.status(400).json({ success: false, error: 'selectedCalendarId and selectedCalendarName are required.' });
      }

      const saved = await CalendarRepository.saveCalendarSettings({
        workspaceId: String(workspaceId),
        selectedCalendarId,
        selectedCalendarName,
        accessRole: accessRole || 'writer',
        timezone: timezone || 'America/New_York',
        autoMeetEnabled: autoMeetEnabled !== false,
        isDedicatedNoraCalendar: isDedicatedNoraCalendar !== false,
        lastVerifiedAt: new Date().toISOString()
      });

      const diagnostics = await GoogleCalendarDiagnosticService.runDiagnostics(String(workspaceId), dbState);
      await persistState(String(workspaceId));

      return res.json({ success: true, calendarSettings: saved, diagnostics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/calendar/pending-action - Retrieve active pending meeting action
  router.get('/pending-action', requireCalendarAccess, async (req: any, res) => {
    try {
      const actor = requesterOrReject(req, res);
      if (!actor) return;
      const { PendingActionManager } = await import('../agent/pendingActionManager.js');
      const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const sessionId = req.query.sessionId || 'default-session';
      const action = PendingActionManager.getPendingAction(String(workspaceId), actor.id, String(sessionId));
      return res.json({ success: true, pendingAction: action });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/calendar/pending-action/confirm - Confirm and dispatch pending meeting
  router.post('/pending-action/confirm', requireCalendarAccess, async (req: any, res) => {
    try {
      const actor = requesterOrReject(req, res);
      if (!actor) return;
      const { PendingActionManager } = await import('../agent/pendingActionManager.js');
      const { scheduleBrokerageMeeting } = await import('../services/brokerageCalendarService.js');
      const { VerifiedLinkService } = await import('../services/verifiedLinkService.js');
      const workspaceId = req.body.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const sessionId = req.body.sessionId || 'default-session';
      const action = PendingActionManager.getPendingAction(String(workspaceId), actor.id, String(sessionId));

      if (!action) {
        return res.status(404).json({ success: false, error: 'No active pending meeting action found to confirm.' });
      }

      const f = action.fields;
      const idempotencyKey = action.idempotencyKey || `gcal_sched_${workspaceId}_${action.id}_${action.version}`;

      const meetingResult = await scheduleBrokerageMeeting({
        title: f.title || `Meeting with ${f.targetAudience || 'Team'}`,
        meetingDate: f.meetingDate,
        startTime: f.startTime,
        durationMinutes: f.durationMinutes || 60,
        location: f.location || (f.locationType === 'google_meet' ? 'Google Meet (Virtual Video Call)' : 'Nest Realty Mayfaire Office'),
        targetAudience: f.targetAudience,
        specificNames: f.attendeeNames,
        requesterName: actor.name,
        notes: f.notes,
        workspaceId: String(workspaceId),
        idempotencyKey,
        pendingActionId: action.id,
        dbState
      });

      if (meetingResult.googleCalendarUrl && meetingResult.mode === 'LIVE') {
        VerifiedLinkService.registerVerifiedResource({
          provider: 'google_calendar',
          resourceId: meetingResult.id,
          url: meetingResult.googleCalendarUrl,
          provenance: 'provider_response',
          verifiedAt: new Date().toISOString(),
          workspaceId: String(workspaceId),
          status: 'available'
        });
      }

      PendingActionManager.clearPendingAction(String(workspaceId), actor.id, String(sessionId));
      return res.json({ success: true, status: 'ACTION_COMPLETED', meeting: meetingResult });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/calendar/pending-action/cancel - Cancel pending meeting action
  router.post('/pending-action/cancel', requireCalendarAccess, async (req: any, res) => {
    try {
      const actor = requesterOrReject(req, res);
      if (!actor) return;
      const { PendingActionManager } = await import('../agent/pendingActionManager.js');
      const workspaceId = req.body.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const sessionId = req.body.sessionId || 'default-session';
      PendingActionManager.clearPendingAction(String(workspaceId), actor.id, String(sessionId));
      return res.json({ success: true, status: 'ACTION_CANCELLED', message: 'Pending meeting action has been cancelled.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/calendar/pending-action - Clear pending meeting action (e.g. New Chat)
  router.delete('/pending-action', requireCalendarAccess, async (req: any, res) => {
    try {
      const actor = requesterOrReject(req, res);
      if (!actor) return;
      const { PendingActionManager } = await import('../agent/pendingActionManager.js');
      const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'] || 'ws_wilmington';
      const sessionId = req.query.sessionId || 'default-session';
      PendingActionManager.clearPendingAction(String(workspaceId), actor.id, String(sessionId));
      return res.json({ success: true, message: 'Pending action store cleared for session.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
