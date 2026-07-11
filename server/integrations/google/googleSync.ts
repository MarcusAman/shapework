/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchGoogleCalendarEvents } from './googleCalendarClient.js';
import { mapGoogleCalendarEventToSignal } from './googleMappers.js';
import { getGoogleAccessToken } from './googleOAuth.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';

export async function syncGoogleWorkspace(
  workspaceId: string,
  dbState: any,
  saveCallback: () => Promise<void>
): Promise<void> {
  const store = new IntegrationStateStore(dbState);
  const conn = await store.getConnection(workspaceId, 'google_workspace');

  if (!conn || conn.status === 'disconnected') {
    console.log(`[Google Sync] Workspace ${workspaceId} has no active Google connection.`);
    return;
  }

  logIntegrationAudit(
    dbState,
    workspaceId,
    'System Scheduler',
    'System',
    'Google Workspace sync started',
    'Google Workspace'
  );

  try {
    const accessToken = await getGoogleAccessToken(conn, dbState, saveCallback);

    // Sync upcoming 90 days of Calendar events
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const events = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);

    let signalsCreated = 0;

    for (const ev of events) {
      const signal = mapGoogleCalendarEventToSignal(ev, workspaceId);
      await store.addSignal(signal);
      signalsCreated++;

      // Evaluate Work Queue triggers
      // Rule: Calendar event within 72 hours needs prep work
      const startTime = ev.start?.dateTime ? new Date(ev.start.dateTime).getTime() : 0;
      const isWithin72Hours = startTime > 0 && (startTime - Date.now()) < 72 * 3600 * 1000;

      if (isWithin72Hours) {
        const detKey = `google_calendar:${ev.id}:prep_needed`;
        const exists = (dbState.workItems || []).some((wi: any) => wi.relatedId === detKey);

        if (!exists) {
          const newWorkItem = {
            id: `wi_gcal_${ev.id}_${Date.now()}`,
            workspaceId,
            type: 'missing_information',
            title: `Calendar Prep Needed: ${ev.summary || 'Untitled Event'}`,
            source: 'system',
            relatedType: 'google_calendar',
            relatedId: detKey,
            relatedLabel: ev.summary || 'Google Calendar Event',
            ownerRole: 'transaction_coordinator',
            priority: 'high',
            status: 'pending',
            recommendedNextAction: 'Confirm compliant document checklist is completed prior to scheduled meeting.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (!dbState.workItems) dbState.workItems = [];
          dbState.workItems.unshift(newWorkItem);

          logIntegrationAudit(
            dbState,
            workspaceId,
            'System Scheduler',
            'System',
            `Google Calendar prep Work Queue item created for event ${ev.id}`,
            'Google Workspace'
          );
        }
      }
    }

    conn.lastSyncedAt = new Date().toISOString();
    conn.status = 'connected';
    delete conn.lastError;

    // Purge any active sync error work items since it completed successfully
    const syncErrorKey = 'integration:google_workspace:sync_error';
    if (dbState.workItems) {
      dbState.workItems = dbState.workItems.filter((wi: any) => wi.relatedId !== syncErrorKey);
    }

    logIntegrationAudit(
      dbState,
      workspaceId,
      'System Scheduler',
      'System',
      `Google Workspace sync completed successfully. Synced ${signalsCreated} calendar events.`,
      'Google Workspace'
    );

    await saveCallback();
  } catch (err: any) {
    console.error(`[Google Sync] Sync failed for workspace ${workspaceId}:`, err.message);

    conn.lastError = `Sync failed: ${err.message}`;
    conn.status = 'error';

    // Create sync error Work Queue exception
    const syncErrorKey = 'integration:google_workspace:sync_error';
    const hasWorkItem = (dbState.workItems || []).some((wi: any) => wi.relatedId === syncErrorKey);

    if (!hasWorkItem) {
      const errorItem = {
        id: `wi_google_sync_err_${Date.now()}`,
        workspaceId,
        type: 'integration_sync_error',
        title: 'Google Workspace Integration Sync Failed',
        source: 'system',
        relatedType: 'google_workspace',
        relatedId: syncErrorKey,
        relatedLabel: 'Google Workspace Connector',
        ownerRole: 'transaction_coordinator',
        priority: 'critical',
        status: 'pending',
        recommendedNextAction: 'Review Google Workspace OAuth status and re-authenticate connection.',
        approvalRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!dbState.workItems) dbState.workItems = [];
      dbState.workItems.unshift(errorItem);
    }

    logIntegrationAudit(
      dbState,
      workspaceId,
      'System Scheduler',
      'System',
      `Google Workspace sync failed: ${err.message}`,
      'Google Workspace'
    );

    await saveCallback();
  }
}
