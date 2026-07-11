/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchOutlookCalendarEvents } from './microsoftCalendarClient.js';
import { fetchRecentOutlookMessages } from './outlookClient.js';
import { fetchRecentTeamsMessages } from './teamsClient.js';
import { 
  mapOutlookCalendarEventToSignal, 
  mapOutlookMessageToSignal, 
  mapTeamsMessageToSignal 
} from './microsoftMappers.js';
import { getMicrosoftAccessToken } from './microsoftOAuth.js';
import { IntegrationStateStore } from '../shared/integrationStateStore.js';
import { logIntegrationAudit } from '../shared/integrationAudit.js';

export async function syncMicrosoft365(
  workspaceId: string,
  dbState: any,
  saveCallback: () => Promise<void>
): Promise<void> {
  const store = new IntegrationStateStore(dbState);
  const conn = await store.getConnection(workspaceId, 'microsoft_365');

  if (!conn || conn.status === 'disconnected') {
    console.log(`[Microsoft Sync] Workspace ${workspaceId} has no active Microsoft connection.`);
    return;
  }

  logIntegrationAudit(
    dbState,
    workspaceId,
    'System Scheduler',
    'System',
    'Microsoft 365 sync started',
    'Microsoft 365'
  );

  try {
    const accessToken = await getMicrosoftAccessToken(conn, dbState, saveCallback);

    // 1. Sync Calendar
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const calendarEvents = await fetchOutlookCalendarEvents(accessToken, timeMin, timeMax);
    
    for (const ev of calendarEvents) {
      const signal = mapOutlookCalendarEventToSignal(ev, workspaceId);
      await store.addSignal(signal);

      // Rule: Calendar event within 72 hours needs prep work
      const startTime = ev.start?.dateTime ? new Date(ev.start.dateTime).getTime() : 0;
      const isWithin72Hours = startTime > 0 && (startTime - Date.now()) < 72 * 3600 * 1000;

      if (isWithin72Hours) {
        const detKey = `outlook_calendar:${ev.id}:prep_needed`;
        const exists = (dbState.workItems || []).some((wi: any) => wi.relatedId === detKey);

        if (!exists) {
          const newWorkItem = {
            id: `wi_ocal_${ev.id}_${Date.now()}`,
            workspaceId,
            type: 'missing_information',
            title: `Calendar Prep Needed: ${ev.subject || 'Untitled Event'}`,
            source: 'system',
            relatedType: 'outlook_calendar',
            relatedId: detKey,
            relatedLabel: ev.subject || 'Outlook Calendar Event',
            ownerRole: 'transaction_coordinator',
            priority: 'high',
            status: 'pending',
            recommendedNextAction: 'Review compliance folders before client meeting.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (!dbState.workItems) dbState.workItems = [];
          dbState.workItems.unshift(newWorkItem);
        }
      }
    }

    // 2. Sync Outlook Mail
    const messages = await fetchRecentOutlookMessages(accessToken);
    for (const msg of messages) {
      const signal = mapOutlookMessageToSignal(msg, workspaceId);
      await store.addSignal(signal);

      // Rule: Owner was mentioned in email and should be shielded
      if (signal.signalType === 'owner_mentioned') {
        const detKey = `outlook:${msg.id}:owner_mentioned`;
        const exists = (dbState.workItems || []).some((wi: any) => wi.relatedId === detKey);

        if (!exists) {
          const newWorkItem = {
            id: `wi_out_mention_${msg.id}_${Date.now()}`,
            workspaceId,
            type: 'closing_compliance_risk',
            title: `Owner Shield Alert: ${msg.subject}`,
            source: 'system',
            relatedType: 'outlook',
            relatedId: detKey,
            relatedLabel: msg.subject || 'Outlook Message',
            ownerRole: 'transaction_coordinator',
            priority: 'high',
            status: 'pending',
            recommendedNextAction: 'Triage email request to shield owner from operational loop.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (!dbState.workItems) dbState.workItems = [];
          dbState.workItems.unshift(newWorkItem);
        }
      }
    }

    // 3. Sync Teams Messages
    const teamsMsgs = await fetchRecentTeamsMessages(accessToken);
    for (const tm of teamsMsgs) {
      const signal = mapTeamsMessageToSignal(tm, workspaceId);
      await store.addSignal(signal);

      const teamId = tm.teamId || 'mock-team-123';
      const channelId = tm.channelId || 'mock-channel-456';

      // Rule: Owner mentioned in Teams
      if (signal.signalType === 'owner_mentioned') {
        const detKey = `microsoft_teams:${teamId}:${channelId}:${tm.id}:owner_mentioned`;
        const exists = (dbState.workItems || []).some((wi: any) => wi.relatedId === detKey);

        if (!exists) {
          const newWorkItem = {
            id: `wi_teams_mention_${tm.id}_${Date.now()}`,
            workspaceId,
            type: 'closing_compliance_risk',
            title: `Owner Mentioned on Teams`,
            source: 'system',
            relatedType: 'microsoft_teams',
            relatedId: detKey,
            relatedLabel: 'Teams Thread',
            ownerRole: 'transaction_coordinator',
            priority: 'medium',
            status: 'pending',
            recommendedNextAction: 'Respond to Teams mention or reassign to operator.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (!dbState.workItems) dbState.workItems = [];
          dbState.workItems.unshift(newWorkItem);
        }
      }

      // Rule: Unassigned thread active for > 24 hours
      if (signal.signalType === 'overdue_team_followup') {
        const detKey = `microsoft_teams:${teamId}:${channelId}:${tm.id}:unassigned_thread`;
        const exists = (dbState.workItems || []).some((wi: any) => wi.relatedId === detKey);

        if (!exists) {
          const newWorkItem = {
            id: `wi_teams_unassigned_${tm.id}_${Date.now()}`,
            workspaceId,
            type: 'closing_compliance_risk',
            title: `Unassigned Teams Thread Overdue (>24h)`,
            source: 'system',
            relatedType: 'microsoft_teams',
            relatedId: detKey,
            relatedLabel: 'Overdue Teams Thread',
            ownerRole: 'transaction_coordinator',
            priority: 'high',
            status: 'pending',
            recommendedNextAction: 'Assign operator to active Teams thread to resolve uncoordinated tasks.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (!dbState.workItems) dbState.workItems = [];
          dbState.workItems.unshift(newWorkItem);
        }
      }
    }

    conn.lastSyncedAt = new Date().toISOString();
    conn.status = 'connected';
    delete conn.lastError;

    // Purge active sync error work items
    const syncErrorKey = 'integration:microsoft_365:sync_error';
    if (dbState.workItems) {
      dbState.workItems = dbState.workItems.filter((wi: any) => wi.relatedId !== syncErrorKey);
    }

    logIntegrationAudit(
      dbState,
      workspaceId,
      'System Scheduler',
      'System',
      `Microsoft 365 sync completed successfully. Synced calendar, mail, and Teams.`,
      'Microsoft 365'
    );

    await saveCallback();
  } catch (err: any) {
    console.error(`[Microsoft Sync] Sync failed for workspace ${workspaceId}:`, err.message);

    conn.lastError = `Sync failed: ${err.message}`;
    conn.status = 'error';

    // Create sync error Work Queue item
    const syncErrorKey = 'integration:microsoft_365:sync_error';
    const hasWorkItem = (dbState.workItems || []).some((wi: any) => wi.relatedId === syncErrorKey);

    if (!hasWorkItem) {
      const errorItem = {
        id: `wi_ms_sync_err_${Date.now()}`,
        workspaceId,
        type: 'integration_sync_error',
        title: 'Microsoft 365 Integration Sync Failed',
        source: 'system',
        relatedType: 'microsoft_365',
        relatedId: syncErrorKey,
        relatedLabel: 'Microsoft 365 Connector',
        ownerRole: 'transaction_coordinator',
        priority: 'critical',
        status: 'pending',
        recommendedNextAction: 'Check Microsoft Azure app registration secrets and re-authenticate.',
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
      `Microsoft 365 sync failed: ${err.message}`,
      'Microsoft 365'
    );

    await saveCallback();
  }
}
