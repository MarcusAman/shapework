/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BasecampConnection, BasecampSyncSummary, BasecampSignal } from './basecampTypes.js';
import { getAuthenticatedToken } from './basecampOAuth.js';
import { BasecampClient } from './basecampClient.js';
import { mapTodoToSignals, mapMessageToSignals } from './basecampMappers.js';

export async function runBasecampSync(
  connection: BasecampConnection,
  dbState: any,
  saveDbStateCallback: () => Promise<void>
): Promise<BasecampSyncSummary> {
  const workspaceId = connection.workspaceId;
  const accountId = connection.accountId;

  // Log start audit event
  const startAudit = {
    id: `audit_bc_sync_start_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    workspaceId,
    timestamp: new Date().toISOString(),
    user_name: 'System Scheduler',
    user_role: 'System',
    action_description: 'Basecamp synchronization started',
    impact_area: 'Integrations',
    impact_property: 'Basecamp',
    rollback_available: false
  };
  if (!dbState.auditEvents) dbState.auditEvents = [];
  dbState.auditEvents = [startAudit, ...dbState.auditEvents];

  try {
    // 1. Decrypt/Refresh token
    const accessToken = await getAuthenticatedToken(connection, dbState, saveDbStateCallback);
    
    // 2. Instantiate client
    const client = new BasecampClient(accessToken, accountId);

    // 3. Fetch data
    const projects = await client.getProjects();
    const people = await client.getPeople();
    const events = await client.getRecentEvents();

    // 4. Initialize state arrays
    if (!dbState.basecampSignals) dbState.basecampSignals = [];
    if (!dbState.workItems) dbState.workItems = [];

    // Clear previous Basecamp signals for this workspace to prevent stale accumulation
    dbState.basecampSignals = dbState.basecampSignals.filter(
      (s: any) => s.workspaceId !== workspaceId
    );

    const mappedSignals: BasecampSignal[] = [];
    let todosChecked = 0;
    let exceptionsCreated = 0;

    // 5. Query active tools and todos in each project
    for (const proj of projects) {
      try {
        const todos = await client.getTodos(proj.id);
        todosChecked += todos.length;

        for (const todo of todos) {
          const signals = mapTodoToSignals(todo, workspaceId, accountId, proj.id);
          mappedSignals.push(...signals);
        }

        const messages = await client.getRecentMessages(proj.id);
        for (const msg of messages) {
          const signals = mapMessageToSignals(msg, workspaceId, accountId, proj.id);
          mappedSignals.push(...signals);
        }
      } catch (err: any) {
        console.warn(`[Basecamp Sync] Failed to sync project ${proj.id}:`, err.message);
      }
    }

    // Save mapped signals to global state
    dbState.basecampSignals.push(...mappedSignals);

    // Audit logs for mapped signals
    for (const sig of mappedSignals) {
      dbState.auditEvents = [{
        id: `audit_bc_sig_created_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workspaceId,
        timestamp: new Date().toISOString(),
        user_name: 'System Scheduler',
        user_role: 'System',
        action_description: `Basecamp execution signal created: ${sig.signalType} (${sig.id})`,
        impact_area: 'Integrations',
        impact_property: 'Basecamp',
        rollback_available: false
      }, ...dbState.auditEvents];
    }

    // 6. Generate Work Queue Exception items based on signal rules
    for (const signal of mappedSignals) {
      let workItemId = '';
      let assignedOwnerRole: 'operations_lead' | 'owner' = 'operations_lead';
      let title = '';
      let dueDate = 'SLA: 24 Hours';

      if (signal.signalType === 'todo_overdue') {
        workItemId = `basecamp:${accountId}:todo:${signal.sourceRecordId}:overdue`;
        title = `Overdue Basecamp Task — ${signal.title}`;
        assignedOwnerRole = 'operations_lead';
      } else if (signal.signalType === 'todo_unassigned') {
        workItemId = `basecamp:${accountId}:todo:${signal.sourceRecordId}:unassigned`;
        title = `Unassigned Basecamp Task — ${signal.title}`;
        assignedOwnerRole = 'operations_lead';
      } else if (signal.signalType === 'owner_mentioned') {
        workItemId = `basecamp:${accountId}:message:${signal.sourceRecordId}:owner_mentioned`;
        title = `Owner Escalation Mentioned — ${signal.title}`;
        assignedOwnerRole = 'owner';
        dueDate = 'SLA: 12 Hours';
      }

      // If workItemId is set, check if we need to raise a Work Queue item
      if (workItemId) {
        const exists = dbState.workItems.some((wi: any) => wi.id === workItemId);
        if (!exists) {
          dbState.workItems.push({
            id: workItemId,
            workspaceId,
            title,
            description: signal.summary,
            status: 'pending',
            assignedStaffMemberId: 'unassigned',
            assignedOwnerRole,
            dueDate,
            sourceSystem: 'basecamp',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Log Work Queue item created audit
          dbState.auditEvents = [{
            id: `audit_bc_wi_created_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            workspaceId,
            timestamp: new Date().toISOString(),
            user_name: 'System Scheduler',
            user_role: 'System',
            action_description: `Basecamp Work Queue item created: ${workItemId}`,
            impact_area: 'Operations',
            impact_property: 'Work Queue',
            rollback_available: false
          }, ...dbState.auditEvents];

          exceptionsCreated++;
        }
      }
    }

    // Update connection status
    connection.status = 'connected';
    connection.lastSyncedAt = new Date().toISOString();
    delete connection.lastError;

    // Log completion audit event
    const completeAudit = {
      id: `audit_bc_sync_complete_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `Basecamp sync completed successfully (Projects: ${projects.length}, Todos checked: ${todosChecked}, Exceptions: ${exceptionsCreated})`,
      impact_area: 'Integrations',
      impact_property: 'Basecamp',
      rollback_available: false
    };
    dbState.auditEvents = [completeAudit, ...dbState.auditEvents];

    await saveDbStateCallback();

    return {
      accountName: connection.accountName || 'Basecamp Account',
      projectsChecked: projects.length,
      todosChecked,
      eventsChecked: events.length,
      exceptionsCreated,
      lastSyncedAt: connection.lastSyncedAt
    };
  } catch (err: any) {
    console.error(`[Basecamp Sync] Synchronization failed for workspace ${workspaceId}:`, err.message);

    // Log failure audit event
    const failAudit = {
      id: `audit_bc_sync_fail_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `Basecamp sync failed: ${err.message}`,
      impact_area: 'Integrations',
      impact_property: 'Basecamp',
      rollback_available: false
    };
    dbState.auditEvents = [failAudit, ...dbState.auditEvents];

    // Create sync exception item
    const syncErrorId = `basecamp:${accountId}:project:all:sync_error`;
    const exists = dbState.workItems.some((wi: any) => wi.id === syncErrorId);
    if (!exists) {
      dbState.workItems.push({
        id: syncErrorId,
        workspaceId,
        title: 'Basecamp Integration Sync Failed',
        description: `Failed to synchronize Basecamp project data for account ${accountId}: ${err.message}`,
        status: 'pending',
        assignedStaffMemberId: 'unassigned',
        assignedOwnerRole: 'operations_lead',
        dueDate: 'SLA: 24 Hours',
        sourceSystem: 'basecamp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    connection.status = 'error';
    connection.lastError = err.message;

    await saveDbStateCallback();
    throw err;
  }
}
