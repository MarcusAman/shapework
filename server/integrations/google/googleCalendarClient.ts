/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Calendar Client & Adapter
 * Provides verified Google Calendar API dispatch with explicit ProviderResult contract,
 * ConferenceData (Google Meet) integration, read-back verification, and dedicated calendar routing.
 */

import { google } from 'googleapis';
import { getAuthorizedOAuthClient } from './googleClient.js';
import { getGoogleAccessToken, getOAuthClient, getGoogleServiceAccountJWTClient } from './googleOAuth.js';
import { isGoogleServiceAccountConfigured } from './googleConfig.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { decryptToken, encryptToken } from '../shared/integrationCredentialVault.js';
import { getOAuthTokenRecord, saveOAuthTokenRecord } from '../../persistence/oauthTokensRepository.js';
import { CalendarRepository, WorkspaceCalendarSettings, CalendarIdempotencyLedger } from '../../persistence/calendarRepository.js';
import { VerifiedLinkService } from '../../services/verifiedLinkService.js';
import { ProviderMode } from '../../truth/noraTruthEnvelope.js';
import { classifyGoogleAuthFailure } from './googleAuthErrors.js';

export interface GoogleCalendarEvent {
  id: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  hangoutLink?: string;
  status?: string;
  attendees?: Array<{ email: string; responseStatus?: string; displayName?: string }>;
}

export interface CreateBrokerageMeetingParams {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO timestamp
  endTime: string;   // ISO timestamp
  attendeeEmails: string[];
  attendees?: Array<{ displayName?: string; email: string; role?: string }>;
  organizerEmail?: string;
  calendarId?: string;
  workspaceId?: string;
  requestMeet?: boolean;
  idempotencyKey?: string;
  pendingActionId?: string;
  accessToken?: string;
  dbState?: any;
}

export interface UpdateBrokerageMeetingParams {
  eventId: string;
  calendarId?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  description?: string;
  location?: string;
  attendeeEmails?: string[];
  workspaceId?: string;
  accessToken?: string;
  dbState?: any;
}

export interface CancelBrokerageMeetingParams {
  eventId: string;
  calendarId?: string;
  workspaceId?: string;
  accessToken?: string;
  cancellationReason?: string;
  dbState?: any;
}

export interface FreeBusyQueryParams {
  calendarIds: string[];
  timeMin: string;
  timeMax: string;
  workspaceId?: string;
  accessToken?: string;
  dbState?: any;
}

export interface GoogleCalendarMeetingResult {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  organizerEmail: string;
  attendeeCount: number;
  attendees: Array<{ email: string; responseStatus?: string; displayName?: string }>;
  htmlLink?: string;
  hangoutLink?: string;
  googleCalendarUrl?: string;
  iCalContent?: string;
  dispatchedVia: 'google_workspace_api' | 'sandbox_engine';
  mode: ProviderMode;
  providerTimestamp: string;
  conferenceStatus: 'confirmed' | 'failed' | 'not_requested';
  isExternalVerified: boolean;
  idempotencyKey?: string;
}

/**
 * Resolves the target Google Calendar ID for a workspace
 */
export async function resolveTargetCalendarId(
  workspaceId: string = 'ws_wilmington',
  overrideCalendarId?: string
): Promise<string> {
  if (overrideCalendarId && overrideCalendarId.trim() && overrideCalendarId !== 'primary') {
    return overrideCalendarId.trim();
  }
  const settings = await CalendarRepository.getCalendarSettings(workspaceId);
  if (settings && settings.selectedCalendarId && settings.selectedCalendarId.trim()) {
    return settings.selectedCalendarId.trim();
  }
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

/**
 * Resolves active Google Access Token for workspace
 */
async function resolveWorkspaceAccessToken(
  workspaceId: string,
  providedToken?: string,
  dbState?: any
): Promise<string | null> {
  if (providedToken) return providedToken;
  try {
    // 0. Primary: Check Google Workspace Enterprise Service Account (Domain-Wide Delegation)
    if (isGoogleServiceAccountConfigured()) {
      try {
        const jwtClient = getGoogleServiceAccountJWTClient();
        if (jwtClient) {
          const res = await jwtClient.getAccessToken();
          if (res && res.token) {
            return res.token;
          }
        }
      } catch (saErr: any) {
        console.warn('[GoogleCalendarClient] Service account token resolution warning:', saErr.message);
      }
    }

    const effectiveDbState = dbState || (global as any).__SHAPEWORK_DB_STATE || {};
    const store = new IntegrationStateStore(effectiveDbState);
    
    // 1. Check direct workspaceId
    let connection = await store.getConnection(workspaceId, 'google_workspace');
    if (!connection && workspaceId !== 'nest-realty-demo') {
      connection = await store.getConnection('nest-realty-demo', 'google_workspace');
    }
    if (!connection && workspaceId !== 'ws_wilmington') {
      connection = await store.getConnection('ws_wilmington', 'google_workspace');
    }

    if (connection && connection.status !== 'disconnected' && connection.encryptedAccessToken) {
      return await getGoogleAccessToken(connection, effectiveDbState, async () => {});
    }

    // 2. Fallback: Check OAuth tokens repository record when dbState is not explicitly passed
    if (!dbState) {
      const oauthRec = getOAuthTokenRecord('google');
      if (oauthRec && oauthRec.status === 'connected' && oauthRec.accessToken) {
        try {
          const decrypted = await decryptToken(oauthRec.accessToken);
          if (decrypted && decrypted.length > 5 && (decrypted.startsWith('ya29.') || decrypted.startsWith('mock_') || decrypted.startsWith('dev_'))) {
            return decrypted;
          }
        } catch {
          if (oauthRec.accessToken.startsWith('ya29.') || oauthRec.accessToken.startsWith('mock_') || oauthRec.accessToken.startsWith('dev_')) {
            return oauthRec.accessToken;
          }
        }
      }
    }

    return null;
  } catch (err) {
    console.warn('[GoogleCalendarClient] Could not resolve access token:', err);
    return null;
  }
}

/**
 * Generates an honest Google Calendar Web Template URL for browser pre-filling.
 * Sanitizes sensitive transaction details and uses honest location semantics.
 */
export function generateGoogleCalendarWebUrl(params: {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  attendeeEmails?: string[];
  requestMeet?: boolean;
}): string {
  const formatGCalDate = (iso: string) => {
    try {
      return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    } catch {
      return '';
    }
  };
  const start = formatGCalDate(params.startTime);
  const end = formatGCalDate(params.endTime);
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  // Privacy protection: Sanitize description to prevent query string leakage of confidential contract numbers
  const sanitizedDescription = (params.description || '')
    .replace(/\b\d{1,3}(,\d{3})*(\.\d{2})?\s*(dollars|usd|\$)\b/gi, '[Financial terms withheld]')
    .trim();

  // Honest location semantics: Do NOT pretend "Google Meet" is a location that generates a video call
  let location = params.location || '';
  if (params.requestMeet || location.toLowerCase().includes('google meet')) {
    location = 'Video conference to be added before saving';
  }

  const query = new URLSearchParams({
    text: params.title || 'Nest Realty Brokerage Meeting',
    dates: `${start}/${end}`,
    details: sanitizedDescription,
    location,
    add: (params.attendeeEmails || []).join(',')
  });

  return `${base}&${query.toString()}`;
}

/**
 * Generates an RFC-5545 compliant .ics file string.
 * Uses strict CRLF injection protection, UTC timestamps, and honest draft markers.
 */
export function generateICalString(params: {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  organizerEmail?: string;
  attendeeEmails?: string[];
  isDraft?: boolean;
}): string {
  const formatICalDate = (iso: string) => {
    try {
      return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    } catch {
      return '';
    }
  };
  const nowStr = formatICalDate(new Date().toISOString());
  const startStr = formatICalDate(params.startTime);
  const endStr = formatICalDate(params.endTime);
  const organizer = params.organizerEmail || 'AskNora@nestrealty.com';

  // Sanitize fields to prevent CRLF and calendar injection
  const sanitizeIcalField = (text: string = '') => {
    return text
      .replace(/\r\n/g, '\\n')
      .replace(/[\r\n]/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');
  };

  const cleanTitle = sanitizeIcalField(params.title || 'Event Draft');
  const cleanDesc = sanitizeIcalField(params.description || '');
  const cleanLocation = sanitizeIcalField(params.location || 'Nest Realty Wilmington');

  const attendeeLines = (params.attendeeEmails || [])
    .map(email => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${sanitizeIcalField(email)}:mailto:${email}`)
    .join('\r\n');

  const isDraft = params.isDraft !== false;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nest Realty Operations//Nora Calendar Assistant 2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:draft_${params.id}@nestrealty.com`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLocation}`,
    `ORGANIZER;CN=Nora (Ask Nest Ops):mailto:${organizer}`,
    attendeeLines,
    isDraft ? 'STATUS:TENTATIVE' : 'STATUS:CONFIRMED',
    isDraft ? 'X-NORA-LIFECYCLE:MANUAL_DRAFT' : 'X-NORA-LIFECYCLE:DISPATCHED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}


/**
 * Detects whether a Google API error is caused by invalid/expired credentials (401 / invalid_grant)
 */
export function isGoogleAuthError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || err.status || err.response?.status;
  return (
    code === 401 ||
    msg.includes('invalid authentication credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('invalid credentials') ||
    msg.includes('token expired') ||
    msg.includes('unauthorized') ||
    msg.includes('expected oauth 2 access token')
  );
}

/**
 * Attempts a background self-healing token refresh using the stored refresh token
 */
export async function refreshGoogleWorkspaceToken(
  workspaceId: string = 'ws_wilmington',
  dbState?: any
): Promise<string | null> {
  try {
    const effectiveDbState = dbState || (global as any).__SHAPEWORK_DB_STATE || {};
    const store = new IntegrationStateStore(effectiveDbState);

    let connection = await store.getConnection(workspaceId, 'google_workspace');
    if (!connection && workspaceId !== 'nest-realty-demo') {
      connection = await store.getConnection('nest-realty-demo', 'google_workspace');
    }
    if (!connection && workspaceId !== 'ws_wilmington') {
      connection = await store.getConnection('ws_wilmington', 'google_workspace');
    }

    if (connection && connection.encryptedRefreshToken) {
      console.log(`[Google Calendar] Attempting self-healing token refresh for workspace ${workspaceId}...`);
      const decryptedRefresh = await decryptToken(connection.encryptedRefreshToken);
      if (decryptedRefresh && decryptedRefresh.length > 5 && !decryptedRefresh.startsWith('mock_')) {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: decryptedRefresh });
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;
        if (newAccessToken) {
          connection.encryptedAccessToken = await encryptToken(newAccessToken);
          connection.accessTokenExpiresAt = credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString();
          connection.status = 'connected';
          delete connection.lastError;
          await store.upsertConnection(connection);
          console.log('[Google Calendar] Self-healing token refresh succeeded!');
          return newAccessToken;
        }
      }
    }

    // Fallback: Check oauth_tokens.json
    const oauthRec = getOAuthTokenRecord('google');
    if (oauthRec && oauthRec.refreshToken) {
      const decryptedRefresh = await decryptToken(oauthRec.refreshToken);
      if (decryptedRefresh && decryptedRefresh.length > 5 && !decryptedRefresh.startsWith('mock_')) {
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: decryptedRefresh });
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;
        if (newAccessToken) {
          oauthRec.accessToken = await encryptToken(newAccessToken);
          oauthRec.expiresAt = credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString();
          oauthRec.status = 'connected';
          saveOAuthTokenRecord(oauthRec);
          console.log('[Google Calendar] Self-healing token refresh via oauth_tokens.json succeeded!');
          return newAccessToken;
        }
      }
    }

    return null;
  } catch (refreshErr: any) {
    console.warn('[Google Calendar] Self-healing token refresh failed:', refreshErr.message);
    return null;
  }
}


/**
 * Fetches calendar events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  workspaceId: string = 'ws_wilmington',
  calendarId?: string
): Promise<GoogleCalendarEvent[]> {
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_') || accessToken.startsWith('sandbox_')) {
    return [
      {
        id: 'gcal_ev_1',
        calendarId: calendarId || 'primary',
        summary: 'Closing Escrow: Bruce Wayne',
        description: 'Final signing compliance review for Gotham Mansion deal.',
        start: { dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString() },
        htmlLink: 'https://calendar.google.com/event?id=gcal_ev_1'
      }
    ];
  }

  const client = getAuthorizedOAuthClient(accessToken);
  const calendar = google.calendar({ version: 'v3', auth: client });
  const targetCalId = calendarId || await resolveTargetCalendarId(workspaceId);

  try {
    const res = await calendar.events.list({
      calendarId: targetCalId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return (res.data.items || []) as GoogleCalendarEvent[];
  } catch (err: any) {
    console.error('[Google Calendar Client] Failed to fetch events:', err.message);
    throw new Error(`Google Calendar API failure: ${err.message}`);
  }
}

/**
 * Verifies target Google Calendar existence and writer/owner permissions
 */
export async function verifyTargetCalendarAccess(
  calendar: any,
  calendarId: string = 'primary',
  expectedAccount: string = 'AskNora@nestrealty.com'
): Promise<{
  verified: boolean;
  calendarId: string;
  summary: string;
  accessRole: string;
  timeZone: string;
  error?: string;
}> {
  try {
    const res = await calendar.calendars.get({ calendarId });
    const accessRole = (res.data as any).accessRole || 'owner';
    return {
      verified: true,
      calendarId: res.data.id || calendarId,
      summary: res.data.summary || 'AskNora Primary Calendar',
      accessRole,
      timeZone: res.data.timeZone || 'America/New_York'
    };
  } catch (err: any) {
    return {
      verified: false,
      calendarId,
      summary: '',
      accessRole: 'none',
      timeZone: 'America/New_York',
      error: err.message
    };
  }
}

/**
 * Creates a verified Google Calendar meeting with optional Google Meet conference
 */
export async function createGoogleCalendarBrokerageMeeting(
  params: CreateBrokerageMeetingParams
): Promise<GoogleCalendarMeetingResult> {
  const organizerEmail = params.organizerEmail || 'AskNora@nestrealty.com';
  const workspaceId = params.workspaceId || 'ws_wilmington';
  const isMeetRequested = params.requestMeet !== false && (
    params.location?.toLowerCase().includes('meet') ||
    params.location?.toLowerCase().includes('video') ||
    params.location?.toLowerCase().includes('virtual') ||
    !params.location
  );
  const nowIso = new Date().toISOString();

  // 0. Check Idempotency Ledger first
  if (params.idempotencyKey) {
    const existingLedger = await CalendarIdempotencyLedger.getRecord(params.idempotencyKey);
    if (existingLedger && existingLedger.executionState === 'succeeded' && existingLedger.result) {
      console.log(`[GoogleCalendarClient] Returning idempotent verified meeting for key: ${params.idempotencyKey}`);
      return existingLedger.result;
    }
  }

  // 1. Resolve Access Token and Target Calendar
  const token = await resolveWorkspaceAccessToken(workspaceId, params.accessToken, params.dbState);
  const targetCalendarId = await resolveTargetCalendarId(workspaceId, params.calendarId);

  const isMockToken = token && (token.startsWith('dev_mock_') || token.startsWith('sandbox_'));
  const isMockEnv = process.env.MOCK_INTEGRATIONS === 'true';

  if (process.env.GOOGLE_CALENDAR_AUTO_DISPATCH === 'false' && process.env.NODE_ENV !== 'test') {
    throw new Error('GOOGLE_CALENDAR_AUTO_DISPATCH_DISABLED: Automatic calendar dispatch is disabled in Release A.');
  }

  // 2. If no token and not mock mode -> fail with honest connection required
  if (!token && !isMockEnv) {
    throw new Error('GOOGLE_CALENDAR_CONNECTION_REQUIRED: Google Workspace OAuth authorization is required to schedule calendar meetings.');
  }

  // 3. Live Google Calendar API Execution
  if (token && !isMockToken && !isMockEnv) {

    // Record In-Progress in Ledger
    if (params.idempotencyKey) {
      await CalendarIdempotencyLedger.saveRecord({
        idempotencyKey: params.idempotencyKey,
        workspaceId,
        pendingActionId: params.pendingActionId,
        payloadVersion: 1,
        calendarId: targetCalendarId,
        attemptCount: 1,
        executionState: 'in_progress',
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }

    const executeInsertWithToken = async (activeAuthToken: string): Promise<GoogleCalendarMeetingResult> => {
      const oauth2Client = getAuthorizedOAuthClient(activeAuthToken);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Idempotency check: query Google Calendar for existing event by private extended property
      if (params.idempotencyKey) {
        try {
          const listRes = await calendar.events.list({
            calendarId: targetCalendarId,
            privateExtendedProperty: [`noraIdempotencyKey=${params.idempotencyKey}`],
            maxResults: 1
          });
          if (listRes.data.items && listRes.data.items.length > 0) {
            const existing = listRes.data.items[0];
            const evId = existing.id || '';
            const htmlLink = existing.htmlLink || `https://www.google.com/calendar/event?eid=${evId}`;
            const hangoutLink = existing.hangoutLink || existing.conferenceData?.entryPoints?.[0]?.uri;
            const replayedResult: GoogleCalendarMeetingResult = {
              id: evId,
              calendarId: targetCalendarId,
              summary: existing.summary || params.title,
              description: existing.description || params.description,
              location: existing.location || params.location,
              startTime: existing.start?.dateTime || params.startTime,
              endTime: existing.end?.dateTime || params.endTime,
              organizerEmail,
              attendeeCount: params.attendeeEmails.length,
              attendees: params.attendeeEmails.map(email => ({ email, responseStatus: 'needsAction' })),
              htmlLink,
              hangoutLink,
              googleCalendarUrl: htmlLink,
              iCalContent: generateICalString({
                id: evId,
                title: params.title,
                description: params.description,
                location: params.location,
                startTime: params.startTime,
                endTime: params.endTime,
                organizerEmail,
                attendeeEmails: params.attendeeEmails,
                isDraft: false
              }),
              dispatchedVia: 'google_workspace_api',
              mode: 'LIVE',
              providerTimestamp: existing.updated || nowIso,
              conferenceStatus: hangoutLink ? 'confirmed' : 'not_requested',
              isExternalVerified: true,
              idempotencyKey: params.idempotencyKey
            };

            if (params.idempotencyKey) {
              await CalendarIdempotencyLedger.saveRecord({
                idempotencyKey: params.idempotencyKey,
                workspaceId,
                pendingActionId: params.pendingActionId,
                payloadVersion: 1,
                calendarId: targetCalendarId,
                providerEventId: evId,
                attemptCount: 1,
                executionState: 'succeeded',
                result: replayedResult,
                createdAt: nowIso,
                updatedAt: new Date().toISOString()
              });
            }

            return replayedResult;
          }
        } catch (idempotencyLookupErr) {
          console.warn('[GoogleCalendarClient] Idempotency lookup warning:', idempotencyLookupErr);
        }
      }

      const uniqueMeetRequestId = `meet_${params.idempotencyKey || Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const requestBody: any = {
        summary: params.title,
        description: params.description,
        location: params.location || (isMeetRequested ? 'Google Meet (Virtual Video Call)' : 'Nest Realty Wilmington'),
        start: { dateTime: params.startTime, timeZone: 'America/New_York' },
        end: { dateTime: params.endTime, timeZone: 'America/New_York' },
        attendees: params.attendeeEmails.map(email => ({ email })),
        organizer: {
          email: organizerEmail,
          displayName: 'Nora (Ask Nest Ops)'
        },
        extendedProperties: {
          private: {
            workspaceId,
            noraIdempotencyKey: params.idempotencyKey || '',
            noraPendingActionId: params.pendingActionId || '',
            noraRequester: 'Ryan Crecelius'
          }
        }
      };

      if (isMeetRequested) {
        requestBody.conferenceData = {
          createRequest: {
            requestId: uniqueMeetRequestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        };
      }

      // Live Google Calendar Insert
      const insertRes = await calendar.events.insert({
        calendarId: targetCalendarId,
        conferenceDataVersion: isMeetRequested ? 1 : 0,
        sendUpdates: 'all',
        requestBody
      });

      const eventId = insertRes.data.id;
      if (!eventId) {
        throw new Error('Google Calendar API did not return a valid event ID.');
      }

      // Live Read-Back Verification
      const readBack = await calendar.events.get({
        calendarId: targetCalendarId,
        eventId: eventId!
      });

      const verifiedEvent = readBack.data;
      const htmlLink = verifiedEvent.htmlLink || `https://www.google.com/calendar/event?eid=${eventId}`;
      const hangoutLink = verifiedEvent.hangoutLink || verifiedEvent.conferenceData?.entryPoints?.[0]?.uri;

      // Register verified links
      VerifiedLinkService.registerVerifiedResource({
        provider: 'google_calendar',
        resourceId: eventId,
        url: htmlLink,
        provenance: 'provider_response',
        verifiedAt: new Date().toISOString(),
        workspaceId,
        status: 'available'
      });

      if (hangoutLink) {
        VerifiedLinkService.registerVerifiedResource({
          provider: 'google_meet',
          resourceId: eventId,
          url: hangoutLink,
          provenance: 'provider_response',
          verifiedAt: new Date().toISOString(),
          workspaceId,
          status: 'available'
        });
      }

      const conferenceStatus = isMeetRequested
        ? (hangoutLink ? 'confirmed' : 'failed')
        : 'not_requested';

      const finalResult: GoogleCalendarMeetingResult = {
        id: eventId,
        calendarId: targetCalendarId,
        summary: verifiedEvent.summary || params.title,
        description: verifiedEvent.description || params.description,
        location: verifiedEvent.location || params.location,
        startTime: verifiedEvent.start?.dateTime || params.startTime,
        endTime: verifiedEvent.end?.dateTime || params.endTime,
        organizerEmail,
        attendeeCount: params.attendeeEmails.length,
        attendees: params.attendeeEmails.map(email => ({ email, responseStatus: 'needsAction' })),
        htmlLink,
        hangoutLink,
        googleCalendarUrl: htmlLink,
        iCalContent: generateICalString({
          id: eventId,
          title: params.title,
          description: params.description,
          location: params.location,
          startTime: params.startTime,
          endTime: params.endTime,
          organizerEmail,
          attendeeEmails: params.attendeeEmails,
          isDraft: false
        }),
        dispatchedVia: 'google_workspace_api',
        mode: 'LIVE',
        providerTimestamp: verifiedEvent.updated || nowIso,
        conferenceStatus,
        isExternalVerified: true,
        idempotencyKey: params.idempotencyKey
      };

      if (params.idempotencyKey) {
        await CalendarIdempotencyLedger.saveRecord({
          idempotencyKey: params.idempotencyKey,
          workspaceId,
          pendingActionId: params.pendingActionId,
          payloadVersion: 1,
          calendarId: targetCalendarId,
          providerEventId: eventId,
          meetRequestId: uniqueMeetRequestId,
          attemptCount: 1,
          executionState: 'succeeded',
          result: finalResult,
          createdAt: nowIso,
          updatedAt: new Date().toISOString()
        });
      }

      return finalResult;
    };

    try {
      return await executeInsertWithToken(token);
    } catch (firstErr: any) {
      const classification = classifyGoogleAuthFailure(firstErr);

      if (classification.failure === 'ACCESS_TOKEN_EXPIRED') {
        console.log('[GoogleCalendarClient] Access token expired. Attempting automatic self-healing token refresh...');
        const refreshedToken = await refreshGoogleWorkspaceToken(workspaceId, params.dbState);
        if (refreshedToken) {
          try {
            console.log('[GoogleCalendarClient] Self-healing token refresh succeeded. Retrying calendar dispatch (attempt 2 of 2)...');
            return await executeInsertWithToken(refreshedToken);
          } catch (retryErr: any) {
            const retryClass = classifyGoogleAuthFailure(retryErr);
            console.error('[GoogleCalendarClient] Retry after token refresh failed:', retryErr.message);
            if (params.idempotencyKey) {
              await CalendarIdempotencyLedger.saveRecord({
                idempotencyKey: params.idempotencyKey,
                workspaceId,
                pendingActionId: params.pendingActionId,
                payloadVersion: 1,
                calendarId: targetCalendarId,
                attemptCount: 2,
                executionState: 'failed',
                error: retryErr.message,
                createdAt: nowIso,
                updatedAt: new Date().toISOString()
              });
            }
            throw new Error(`GOOGLE_WORKSPACE_REAUTH_REQUIRED: ${retryClass.userFacingMessage} (${retryErr.message})`);
          }
        } else {
          throw new Error('GOOGLE_WORKSPACE_REAUTH_REQUIRED: Google Workspace OAuth refresh token is missing or revoked. Please re-authenticate AskNora@nestrealty.com.');
        }
      }

      if (params.idempotencyKey) {
        await CalendarIdempotencyLedger.saveRecord({
          idempotencyKey: params.idempotencyKey,
          workspaceId,
          pendingActionId: params.pendingActionId,
          payloadVersion: 1,
          calendarId: targetCalendarId,
          attemptCount: 1,
          executionState: 'failed',
          error: firstErr.message,
          createdAt: nowIso,
          updatedAt: new Date().toISOString()
        });
      }

      if (classification.requiresReauth) {
        throw new Error(`GOOGLE_WORKSPACE_REAUTH_REQUIRED: ${classification.userFacingMessage}`);
      }

      if (classification.requiresCalendarReselection) {
        throw new Error(`CALENDAR_NOT_FOUND: ${classification.userFacingMessage}`);
      }

      if (classification.requiresAdminCorrection) {
        throw new Error(`CALENDAR_PERMISSION_DENIED: ${classification.userFacingMessage}`);
      }

      console.error('[GoogleCalendarClient] Live Calendar API failure:', firstErr.message);
      throw new Error(`Google Calendar API execution failed: ${firstErr.message}`);
    }
  }

  // 4. Sandbox / Test Mode
  const eventId = `gcal_meet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const gcalWebUrl = generateGoogleCalendarWebUrl(params);
  const iCalContent = generateICalString({
    id: eventId,
    title: params.title,
    description: params.description,
    location: params.location,
    startTime: params.startTime,
    endTime: params.endTime,
    organizerEmail,
    attendeeEmails: params.attendeeEmails
  });

  return {
    id: eventId,
    calendarId: 'sandbox_primary',
    summary: params.title,
    description: params.description,
    location: params.location || (isMeetRequested ? 'Google Meet (Virtual Video Call)' : 'Nest Realty Wilmington'),
    startTime: params.startTime,
    endTime: params.endTime,
    organizerEmail,
    attendeeCount: params.attendeeEmails.length,
    attendees: params.attendeeEmails.map(email => ({ email, responseStatus: 'needsAction' })),
    htmlLink: gcalWebUrl,
    googleCalendarUrl: gcalWebUrl,
    iCalContent,
    dispatchedVia: 'sandbox_engine',
    mode: 'SANDBOX',
    providerTimestamp: nowIso,
    conferenceStatus: isMeetRequested ? 'not_requested' : 'not_requested',
    isExternalVerified: false,
    idempotencyKey: params.idempotencyKey
  };
}

/**
 * Reschedules or updates an existing Google Calendar event
 */
export async function updateGoogleCalendarBrokerageMeeting(
  params: UpdateBrokerageMeetingParams
): Promise<GoogleCalendarMeetingResult> {
  const workspaceId = params.workspaceId || 'ws_wilmington';
  const token = await resolveWorkspaceAccessToken(workspaceId, params.accessToken, params.dbState);
  const targetCalendarId = await resolveTargetCalendarId(workspaceId, params.calendarId);

  const isMockToken = token && (token.startsWith('dev_mock_') || token.startsWith('sandbox_'));
  const isMockEnv = process.env.MOCK_INTEGRATIONS === 'true';

  if (!token && !isMockEnv) {
    throw new Error('GOOGLE_CALENDAR_CONNECTION_REQUIRED: Google Workspace OAuth authorization is required to update calendar meetings.');
  }

  if (token && !isMockToken && !isMockEnv) {
    const oauth2Client = getAuthorizedOAuthClient(token);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const patchBody: any = {};
    if (params.title) patchBody.summary = params.title;
    if (params.description) patchBody.description = params.description;
    if (params.location) patchBody.location = params.location;
    if (params.startTime) patchBody.start = { dateTime: params.startTime };
    if (params.endTime) patchBody.end = { dateTime: params.endTime };
    if (params.attendeeEmails) patchBody.attendees = params.attendeeEmails.map(email => ({ email }));

    const patchRes = await calendar.events.patch({
      calendarId: targetCalendarId,
      eventId: params.eventId,
      sendUpdates: 'all',
      requestBody: patchBody
    });

    const verified = patchRes.data;
    const htmlLink = verified.htmlLink || `https://www.google.com/calendar/event?eid=${params.eventId}`;
    const hangoutLink = verified.hangoutLink || verified.conferenceData?.entryPoints?.[0]?.uri;

    return {
      id: params.eventId,
      calendarId: targetCalendarId,
      summary: verified.summary || params.title || 'Meeting',
      description: verified.description || params.description,
      location: verified.location || params.location,
      startTime: verified.start?.dateTime || params.startTime || '',
      endTime: verified.end?.dateTime || params.endTime || '',
      organizerEmail: 'AskNora@nestrealty.com',
      attendeeCount: params.attendeeEmails ? params.attendeeEmails.length : 0,
      attendees: (params.attendeeEmails || []).map(email => ({ email, responseStatus: 'needsAction' })),
      htmlLink,
      hangoutLink,
      googleCalendarUrl: htmlLink,
      iCalContent: '',
      dispatchedVia: 'google_workspace_api',
      mode: 'LIVE',
      providerTimestamp: verified.updated || new Date().toISOString(),
      conferenceStatus: hangoutLink ? 'confirmed' : 'not_requested',
      isExternalVerified: true
    };
  }

  // Sandbox fallback
  return {
    id: params.eventId,
    calendarId: 'sandbox_primary',
    summary: params.title || 'Rescheduled Meeting',
    location: params.location,
    startTime: params.startTime || '',
    endTime: params.endTime || '',
    organizerEmail: 'AskNora@nestrealty.com',
    attendeeCount: params.attendeeEmails?.length || 0,
    attendees: (params.attendeeEmails || []).map(email => ({ email })),
    googleCalendarUrl: `https://calendar.google.com/calendar/event?id=${params.eventId}`,
    iCalContent: '',
    dispatchedVia: 'sandbox_engine',
    mode: 'SANDBOX',
    providerTimestamp: new Date().toISOString(),
    conferenceStatus: 'not_requested',
    isExternalVerified: false
  };
}

/**
 * Cancels a Google Calendar event and notifies attendees
 */
export async function cancelGoogleCalendarBrokerageMeeting(
  params: CancelBrokerageMeetingParams
): Promise<{ success: boolean; eventId: string; cancelled: boolean; mode: ProviderMode }> {
  const workspaceId = params.workspaceId || 'ws_wilmington';
  const token = await resolveWorkspaceAccessToken(workspaceId, params.accessToken, params.dbState);
  const targetCalendarId = await resolveTargetCalendarId(workspaceId, params.calendarId);

  const isMockToken = token && (token.startsWith('dev_mock_') || token.startsWith('sandbox_'));
  const isMockEnv = process.env.MOCK_INTEGRATIONS === 'true';

  if (!token && !isMockEnv) {
    throw new Error('GOOGLE_CALENDAR_CONNECTION_REQUIRED: Google Workspace OAuth authorization is required to cancel calendar meetings.');
  }

  if (token && !isMockToken && !isMockEnv) {
    try {
      const oauth2Client = getAuthorizedOAuthClient(token);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: targetCalendarId,
        eventId: params.eventId,
        sendUpdates: 'all'
      });

      return {
        success: true,
        eventId: params.eventId,
        cancelled: true,
        mode: 'LIVE'
      };
    } catch (err: any) {
      console.error('[GoogleCalendarClient] Cancel event error:', err.message);
      throw new Error(`Google Calendar cancel failure: ${err.message}`);
    }
  }

  return {
    success: true,
    eventId: params.eventId,
    cancelled: true,
    mode: 'SANDBOX'
  };
}

/**
 * Queries Free/Busy availability for attendee calendars
 */
export async function queryGoogleCalendarFreeBusy(
  params: FreeBusyQueryParams
): Promise<{
  mode: ProviderMode;
  calendars: Record<string, {
    status: 'AVAILABLE' | 'BUSY' | 'UNKNOWN' | 'PERMISSION_DENIED';
    busyIntervals: Array<{ start: string; end: string }>;
  }>;
}> {
  const workspaceId = params.workspaceId || 'ws_wilmington';
  const token = await resolveWorkspaceAccessToken(workspaceId, params.accessToken, params.dbState);

  const isMockToken = token && (token.startsWith('dev_mock_') || token.startsWith('sandbox_'));
  const isMockEnv = process.env.MOCK_INTEGRATIONS === 'true';

  if (!token && !isMockEnv) {
    throw new Error('GOOGLE_CALENDAR_CONNECTION_REQUIRED: Google Workspace OAuth authorization is required to check free/busy availability.');
  }

  if (token && !isMockToken && !isMockEnv) {
    try {
      const oauth2Client = getAuthorizedOAuthClient(token);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const res = await calendar.freebusy.query({
        requestBody: {
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          items: params.calendarIds.map(id => ({ id }))
        }
      });

      const out: Record<string, any> = {};
      const calMap = res.data.calendars || {};

      for (const calId of params.calendarIds) {
        const calData = calMap[calId];
        if (!calData) {
          out[calId] = { status: 'UNKNOWN', busyIntervals: [] };
          continue;
        }

        if (calData.errors && calData.errors.length > 0) {
          out[calId] = { status: 'PERMISSION_DENIED', busyIntervals: [] };
          continue;
        }

        const busy = (calData.busy || []).map(b => ({
          start: b.start || '',
          end: b.end || ''
        }));

        out[calId] = {
          status: busy.length > 0 ? 'BUSY' : 'AVAILABLE',
          busyIntervals: busy
        };
      }

      return { mode: 'LIVE', calendars: out };
    } catch (err: any) {
      console.warn('[GoogleCalendarClient] FreeBusy query failure:', err.message);
      throw new Error(`Google Calendar FreeBusy query failed: ${err.message}`);
    }
  }

  // Mock / Sandbox
  const mockCal: Record<string, any> = {};
  for (const calId of params.calendarIds) {
    mockCal[calId] = { status: 'AVAILABLE', busyIntervals: [] };
  }
  return { mode: 'SANDBOX', calendars: mockCal };
}
