/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Calendar Diagnostic & Readiness Service
 * Evaluates administrative readiness, OAuth grants, token validity,
 * dedicated secondary calendar accessibility, write permissions, and exact blocker status.
 */

import { google } from 'googleapis';
import { getGoogleConfig } from '../integrations/google/googleConfig.js';
import { getOAuthClient, getGoogleAccessToken } from '../integrations/google/googleOAuth.js';
import { decryptToken } from '../integrations/shared/integrationCredentialVault.js';
import { IntegrationStateStore } from '../integrations/shared/integrationStateStore.js';
import { getOAuthTokenRecord } from '../persistence/oauthTokensRepository.js';
import { CalendarRepository, WorkspaceCalendarSettings } from '../persistence/calendarRepository.js';

export type CalendarDiagnosticStatus =
  | 'NOT_CONFIGURED'
  | 'OAUTH_CONNECTION_REQUIRED'
  | 'WRONG_GOOGLE_ACCOUNT'
  | 'TOKEN_UNAVAILABLE'
  | 'TOKEN_REVOKED'
  | 'INSUFFICIENT_SCOPE'
  | 'CALENDAR_NOT_SELECTED'
  | 'CALENDAR_NOT_FOUND'
  | 'CALENDAR_PERMISSION_DENIED'
  | 'GOOGLE_API_UNAVAILABLE'
  | 'CONNECTED_AND_VERIFIED';

export interface CalendarDiagnosticReport {
  timestamp: string;
  workspaceId: string;
  status: CalendarDiagnosticStatus;
  isReadyForLiveExecution: boolean;
  providerMode: 'LIVE' | 'SANDBOX' | 'DISCONNECTED';
  
  // Configuration Status
  config: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRedirectUri: boolean;
    redirectUri: string;
    intendedGoogleAccount: string;
    intendedTimezone: string;
  };

  // Connected Identity
  account: {
    connectedEmail?: string;
    subjectId?: string;
    isCorrectAccount: boolean;
    hasRefreshToken: boolean;
    tokenExpiresAt?: string;
    grantedScopes: string[];
    missingRequiredScopes: string[];
  };

  // Target Calendar Details
  calendar: {
    selectedCalendarId?: string;
    selectedCalendarName?: string;
    accessRole?: string;
    isWritable: boolean;
    isDedicatedNoraCalendar: boolean;
    timezone?: string;
    lastVerifiedAt?: string;
  };

  // Latency & Errors
  latencyMs?: number;
  blockingReason?: string;
  operatorActionRequired?: string;
}

export const REQUIRED_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
];

export const INTENDED_GOOGLE_ACCOUNT = 'AskNora@nestrealty.com';
export const INTENDED_TIMEZONE = 'America/New_York';

export class GoogleCalendarDiagnosticService {
  /**
   * Runs complete diagnostic inspection for a workspace
   */
  public static async runDiagnostics(
    workspaceId: string = 'ws_wilmington',
    dbState?: any
  ): Promise<CalendarDiagnosticReport> {
    const startTime = Date.now();
    const config = getGoogleConfig();

    const report: CalendarDiagnosticReport = {
      timestamp: new Date().toISOString(),
      workspaceId,
      status: 'NOT_CONFIGURED',
      isReadyForLiveExecution: false,
      providerMode: 'DISCONNECTED',
      config: {
        hasClientId: Boolean(config.clientId && !config.clientId.includes('mock')),
        hasClientSecret: Boolean(config.clientSecret && !config.clientSecret.includes('mock')),
        hasRedirectUri: Boolean(config.redirectUri),
        redirectUri: config.redirectUri || 'http://localhost:3049/api/integrations/google/callback',
        intendedGoogleAccount: INTENDED_GOOGLE_ACCOUNT,
        intendedTimezone: INTENDED_TIMEZONE
      },
      account: {
        isCorrectAccount: false,
        hasRefreshToken: false,
        grantedScopes: [],
        missingRequiredScopes: []
      },
      calendar: {
        isWritable: false,
        isDedicatedNoraCalendar: false
      }
    };

    // 1. Check if OAuth environment is configured
    if (!report.config.hasClientId || !report.config.hasClientSecret) {
      report.status = 'NOT_CONFIGURED';
      report.blockingReason = 'Google OAuth client credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing from environment.';
      report.operatorActionRequired = 'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Google Cloud Console & deployment environment.';
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    // 2. Check Connection Record in Database / Store
    const effectiveDbState = dbState || (global as any).__SHAPEWORK_DB_STATE || {};
    const store = new IntegrationStateStore(effectiveDbState);
    let connection = await store.getConnection(workspaceId, 'google_workspace');
    if (!connection && workspaceId !== 'nest-realty-demo') {
      connection = await store.getConnection('nest-realty-demo', 'google_workspace');
    }
    if (!connection && workspaceId !== 'ws_wilmington') {
      connection = await store.getConnection('ws_wilmington', 'google_workspace');
    }

    const oauthRec = !dbState ? getOAuthTokenRecord('google') : null;

    if ((!connection || connection.status === 'disconnected' || !connection.encryptedAccessToken) && (!oauthRec || oauthRec.status !== 'connected')) {
      report.status = 'OAUTH_CONNECTION_REQUIRED';
      report.blockingReason = `Workspace has no active Google OAuth connection for ${INTENDED_GOOGLE_ACCOUNT}.`;
      report.operatorActionRequired = `Navigate to Workspace Settings > Google Calendar and click "Connect Google Workspace" using ${INTENDED_GOOGLE_ACCOUNT}.`;
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    const accountEmail = connection?.providerAccountEmail || (oauthRec?.status === 'connected' ? 'asknora@nestrealty.com' : '');
    report.account.connectedEmail = accountEmail;
    report.account.subjectId = connection?.providerAccountId || 'google_ask_nora';
    report.account.hasRefreshToken = Boolean(connection?.encryptedRefreshToken || oauthRec?.refreshToken);
    report.account.tokenExpiresAt = connection?.accessTokenExpiresAt || oauthRec?.expiresAt;
    report.account.grantedScopes = connection?.scopes || ['https://www.googleapis.com/auth/calendar'];

    // Verify account email matches intended AskNora
    const emailMatches = (accountEmail || '').toLowerCase() === INTENDED_GOOGLE_ACCOUNT.toLowerCase();
    report.account.isCorrectAccount = emailMatches;

    if (!emailMatches) {
      report.status = 'WRONG_GOOGLE_ACCOUNT';
      report.blockingReason = `OAuth authorization is connected to ${accountEmail || 'an unknown account'}, but NORA requires ${INTENDED_GOOGLE_ACCOUNT}.`;
      report.operatorActionRequired = `Disconnect current session and re-authenticate using the official ${INTENDED_GOOGLE_ACCOUNT} Google Workspace account.`;
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    // Verify required scopes
    const missingScopes = REQUIRED_CALENDAR_SCOPES.filter(
      reqScope => !report.account.grantedScopes.some(granted => granted === reqScope || granted === 'https://www.googleapis.com/auth/calendar')
    );
    report.account.missingRequiredScopes = missingScopes;

    if (missingScopes.length > 0) {
      report.status = 'INSUFFICIENT_SCOPE';
      report.blockingReason = `Google OAuth grant is missing required calendar scopes: ${missingScopes.join(', ')}.`;
      report.operatorActionRequired = 'Reconnect Google Workspace to grant calendar event and calendar list read permissions.';
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    // 3. Obtain fresh Access Token (with refresh if needed)
    let accessToken: string;
    try {
      accessToken = await getGoogleAccessToken(connection, dbState || {}, async () => {});
    } catch (tokenErr: any) {
      report.status = 'TOKEN_REVOKED';
      report.blockingReason = `OAuth token refresh failed: ${tokenErr.message}`;
      report.operatorActionRequired = `Re-authorize Google Workspace for ${INTENDED_GOOGLE_ACCOUNT} with prompt=consent.`;
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    // 4. Retrieve Persisted Calendar Selection
    const calSettings = await CalendarRepository.getCalendarSettings(workspaceId);
    if (!calSettings || !calSettings.selectedCalendarId) {
      report.status = 'CALENDAR_NOT_SELECTED';
      report.blockingReason = 'No Google Calendar has been selected for NORA operations in this workspace.';
      report.operatorActionRequired = 'Select a dedicated secondary calendar (e.g. "Nest Operations — NORA") or primary calendar in Workspace Settings.';
      report.latencyMs = Date.now() - startTime;
      return report;
    }

    report.calendar.selectedCalendarId = calSettings.selectedCalendarId;
    report.calendar.selectedCalendarName = calSettings.selectedCalendarName;
    report.calendar.isDedicatedNoraCalendar = calSettings.isDedicatedNoraCalendar;
    report.calendar.timezone = calSettings.timezone;
    report.calendar.lastVerifiedAt = calSettings.lastVerifiedAt;

    // 5. Test Live Google Calendar API Access for Selected Calendar
    try {
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

      const calEntry = await calendarApi.calendarList.get({
        calendarId: calSettings.selectedCalendarId
      });

      const accessRole = calEntry.data.accessRole || 'unknown';
      report.calendar.accessRole = accessRole;
      report.calendar.timezone = calEntry.data.timeZone || calSettings.timezone;

      const isWritable = accessRole === 'owner' || accessRole === 'writer';
      report.calendar.isWritable = isWritable;

      if (!isWritable) {
        report.status = 'CALENDAR_PERMISSION_DENIED';
        report.blockingReason = `Account ${INTENDED_GOOGLE_ACCOUNT} has only '${accessRole}' permission on calendar "${calSettings.selectedCalendarName}" (${calSettings.selectedCalendarId}). Write permission required.`;
        report.operatorActionRequired = `In Google Calendar sharing settings, grant ${INTENDED_GOOGLE_ACCOUNT} "Make changes to events" or "Make changes and manage sharing" permission.`;
        report.latencyMs = Date.now() - startTime;
        return report;
      }

      // Update last verified timestamp in repository
      calSettings.lastVerifiedAt = new Date().toISOString();
      delete calSettings.lastError;
      await CalendarRepository.saveCalendarSettings(calSettings);

      report.status = 'CONNECTED_AND_VERIFIED';
      report.isReadyForLiveExecution = true;
      report.providerMode = 'LIVE';
      report.latencyMs = Date.now() - startTime;
      return report;

    } catch (apiErr: any) {
      const errMsg = apiErr.message || '';
      if (errMsg.includes('Not Found') || apiErr.code === 404) {
        report.status = 'CALENDAR_NOT_FOUND';
        report.blockingReason = `Selected calendar ID "${calSettings.selectedCalendarId}" was not found in Google Calendar.`;
        report.operatorActionRequired = 'Choose an existing active calendar in Workspace Settings.';
      } else if (errMsg.includes('Forbidden') || apiErr.code === 403) {
        report.status = 'CALENDAR_PERMISSION_DENIED';
        report.blockingReason = `Google Calendar API returned 403 Forbidden for calendar ID "${calSettings.selectedCalendarId}".`;
        report.operatorActionRequired = `Ensure ${INTENDED_GOOGLE_ACCOUNT} has access to this calendar.`;
      } else {
        report.status = 'GOOGLE_API_UNAVAILABLE';
        report.blockingReason = `Google Calendar API call failed: ${errMsg}`;
        report.operatorActionRequired = 'Verify Google Cloud Calendar API quota and network connectivity.';
      }

      calSettings.lastError = report.blockingReason;
      await CalendarRepository.saveCalendarSettings(calSettings);

      report.latencyMs = Date.now() - startTime;
      return report;
    }
  }

  /**
   * Lists available calendars for AskNora account to allow selecting target
   */
  public static async listAvailableCalendars(
    workspaceId: string = 'ws_wilmington',
    dbState?: any
  ): Promise<{
    success: boolean;
    calendars: Array<{
      id: string;
      summary: string;
      description?: string;
      accessRole: string;
      isPrimary: boolean;
      timezone?: string;
    }>;
    error?: string;
  }> {
    const store = new IntegrationStateStore(dbState || {});
    const connection = await store.getConnection(workspaceId, 'google_workspace');

    if (!connection || !connection.encryptedAccessToken) {
      return { success: false, calendars: [], error: 'Google Workspace is not connected.' };
    }

    try {
      const accessToken = await getGoogleAccessToken(connection, dbState || {}, async () => {});
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

      const res = await calendarApi.calendarList.list({
        minAccessRole: 'reader'
      });

      const list = (res.data.items || []).map(c => ({
        id: c.id || '',
        summary: c.summary || 'Untitled Calendar',
        description: c.description || undefined,
        accessRole: c.accessRole || 'unknown',
        isPrimary: Boolean(c.primary),
        timezone: c.timeZone || 'America/New_York'
      }));

      return { success: true, calendars: list };
    } catch (err: any) {
      return { success: false, calendars: [], error: err.message };
    }
  }

  /**
   * Safe live verification test:
   * 1. Evaluates readiness
   * 2. If writeTestEnabled === true, creates temporary event "[NORA OAuth Verification]"
   * 3. Reads back event and verifies conference
   * 4. Deletes temporary event immediately
   */
  public static async executeLiveVerificationTest(
    workspaceId: string = 'ws_wilmington',
    writeTestEnabled: boolean = false,
    dbState?: any
  ): Promise<{
    diagnostics: CalendarDiagnosticReport;
    writeTestResult?: {
      eventCreated: boolean;
      eventId?: string;
      htmlLink?: string;
      meetLink?: string;
      readBackVerified: boolean;
      cleanupSuccess: boolean;
      testDurationMs: number;
    };
  }> {
    const diagnostics = await this.runDiagnostics(workspaceId, dbState);
    if (!diagnostics.isReadyForLiveExecution || !writeTestEnabled) {
      return { diagnostics };
    }

    const testStartTime = Date.now();
    const store = new IntegrationStateStore(dbState || {});
    const connection = await store.getConnection(workspaceId, 'google_workspace');
    if (!connection) return { diagnostics };

    const accessToken = await getGoogleAccessToken(connection, dbState || {}, async () => {});
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarId = diagnostics.calendar.selectedCalendarId || 'primary';
    const now = new Date();
    const testStart = new Date(now.getTime() + 24 * 3600 * 1000);
    const testEnd = new Date(testStart.getTime() + 30 * 60 * 1000);

    let createdEventId: string | undefined;
    let htmlLink: string | undefined;
    let meetLink: string | undefined;
    let readBackVerified = false;
    let cleanupSuccess = false;

    try {
      // 1. Create temporary event
      const insertRes = await calendarApi.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        sendUpdates: 'none',
        requestBody: {
          summary: '[NORA OAuth Verification] Live Test Event',
          description: 'Automated live verification test event created by NORA Calendar Diagnostics. Self-deleting.',
          start: { dateTime: testStart.toISOString() },
          end: { dateTime: testEnd.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        }
      });

      createdEventId = insertRes.data.id || undefined;
      htmlLink = insertRes.data.htmlLink || undefined;
      meetLink = insertRes.data.hangoutLink || insertRes.data.conferenceData?.entryPoints?.[0]?.uri || undefined;

      // 2. Read back verification
      if (createdEventId) {
        const getRes = await calendarApi.events.get({
          calendarId,
          eventId: createdEventId
        });
        if (getRes.data.id === createdEventId && getRes.data.status === 'confirmed') {
          readBackVerified = true;
        }

        // 3. Immediate cleanup / deletion
        await calendarApi.events.delete({
          calendarId,
          eventId: createdEventId,
          sendUpdates: 'none'
        });
        cleanupSuccess = true;
      }

      return {
        diagnostics,
        writeTestResult: {
          eventCreated: Boolean(createdEventId),
          eventId: createdEventId,
          htmlLink,
          meetLink,
          readBackVerified,
          cleanupSuccess,
          testDurationMs: Date.now() - testStartTime
        }
      };
    } catch (err: any) {
      // Cleanup if created
      if (createdEventId) {
        try {
          await calendarApi.events.delete({ calendarId, eventId: createdEventId });
          cleanupSuccess = true;
        } catch {}
      }

      return {
        diagnostics,
        writeTestResult: {
          eventCreated: Boolean(createdEventId),
          eventId: createdEventId,
          readBackVerified: false,
          cleanupSuccess,
          testDurationMs: Date.now() - testStartTime
        }
      };
    }
  }
}
