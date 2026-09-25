/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Task Outbound Notification Service
 * Dispatches real outbound emails to assigned staff and requesting agents upon task & request creation.
 * Supported across:
 * - Web UI New Task Modal & Desk Intake
 * - Inbound AskNora Email Intake
 * - Retell AI Voice Phone Call Intake
 * 
 * Includes strict idempotency and anti-duplicate guards.
 */

import {
  sendTaskAssignmentNotificationEmail,
  sendMarketingIntakeConfirmationEmail,
  isAllowedEmailRecipient
} from '../email/emailProvider.js';
import { getAllStaffMembers, resolveStaffMember } from '../persistence/operationsDirectoryRepository.js';
import { recordActivityEvent } from './activityHistoryService.js';
import type { CanonicalMarketingTask, CanonicalMarketingRequest } from '../persistence/marketingCampaignsRepository.js';

// Fallback staff directory emails when database or directory profile is missing
const KNOWN_STAFF_DIRECTORY: Record<string, { email: string; name: string }> = {
  'melissa gagliardi': { email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi' },
  'melissa': { email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi' },
  'ann gunn': { email: 'ann.gunn@nestrealty.com', name: 'Ann Gunn' },
  'ann': { email: 'ann.gunn@nestrealty.com', name: 'Ann Gunn' },
  'eduardo lovo': { email: 'eduardo@nestrealty.com', name: 'Eduardo Lovo' },
  'eduardo': { email: 'eduardo@nestrealty.com', name: 'Eduardo Lovo' },
  'ryan crecelius': { email: 'ryan@nestrealty.com', name: 'Ryan Crecelius' },
  'ryan': { email: 'ryan@nestrealty.com', name: 'Ryan Crecelius' },
  'jessica keenan': { email: 'jessica.keenan@nestrealty.com', name: 'Jessica Keenan' },
  'eric knight': { email: 'eric@nestrealty.com', name: 'Eric Knight' },
  'james fort': { email: 'james.fort@nestrealty.com', name: 'James Fort' },
  'marcus aman': { email: 'marcus.aman@gmail.com', name: 'Marcus Aman' }
};

// Known agent directory emails
const KNOWN_AGENTS_DIRECTORY: Record<string, { email: string; name: string }> = {
  'matt orr': { email: 'matt.orr@nestrealty.com', name: 'Matt Orr' },
  'matt': { email: 'matt.orr@nestrealty.com', name: 'Matt Orr' },
  'jessica keenan': { email: 'jessica.keenan@nestrealty.com', name: 'Jessica Keenan' },
  'eric knight': { email: 'eric@nestrealty.com', name: 'Eric Knight' },
  'eric miller': { email: 'eric.miller@nestrealty.com', name: 'Eric Miller' },
  'julie brown': { email: 'julie.brown@nestrealty.com', name: 'Julie Brown' },
  'dawn': { email: 'dawn@nestrealty.com', name: 'Dawn' },
  'marcus aman': { email: 'marcus.aman@gmail.com', name: 'Marcus Aman' },
  'ryan crecelius': { email: 'ryan@nestrealty.com', name: 'Ryan Crecelius' },
  'ann gunn': { email: 'ann.gunn@nestrealty.com', name: 'Ann Gunn' },
  'melissa gagliardi': { email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi' }
};

// In-memory idempotency sets
const dispatchedTaskAssignmentIds = new Set<string>();
const dispatchedRequestConfirmationIds = new Set<string>();

/**
 * Resolves the email address for an assigned staff lead.
 */
export function resolveStaffEmail(identifier?: string, workspaceId = 'ws_wilmington'): string | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();

  // If already an email address
  if (clean.includes('@') && clean.includes('.')) {
    return clean;
  }

  // 1. Direct dictionary match for known brokerage leaders
  if (KNOWN_STAFF_DIRECTORY[clean]) {
    return KNOWN_STAFF_DIRECTORY[clean].email;
  }

  // 2. Partial / word boundary match in known directory
  for (const [key, val] of Object.entries(KNOWN_STAFF_DIRECTORY)) {
    if (clean === key || clean.startsWith(key) || key.startsWith(clean)) {
      return val.email;
    }
  }

  // 3. Try resolving via Operations Directory Repository
  try {
    const staff = resolveStaffMember(identifier, workspaceId);
    if (staff?.email && staff.email.includes('@')) {
      return staff.email;
    }
  } catch {
    // Graceful fallback to static dictionary
  }

  return undefined;
}

/**
 * Resolves the email address for an agent / requester.
 */
export function resolveAgentEmail(nameOrRaw?: string, fallbackEmail?: string): string | undefined {
  if (fallbackEmail && fallbackEmail.includes('@') && fallbackEmail.includes('.')) {
    return fallbackEmail.trim().toLowerCase();
  }
  if (!nameOrRaw) return undefined;

  // Extract clean name, removing roles like (Broker) or (BIC)
  const clean = nameOrRaw.replace(/\([^)]*\)/g, '').trim().toLowerCase();
  if (clean.includes('@') && clean.includes('.')) {
    return clean;
  }

  if (KNOWN_AGENTS_DIRECTORY[clean]) {
    return KNOWN_AGENTS_DIRECTORY[clean].email;
  }

  for (const [key, val] of Object.entries(KNOWN_AGENTS_DIRECTORY)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val.email;
    }
  }

  return fallbackEmail;
}

/**
 * Dispatches an assignment notification email to the assigned staff member for a task.
 */
export async function dispatchTaskAssignmentNotification(
  task: CanonicalMarketingTask,
  options?: { source?: string; force?: boolean }
): Promise<{ success: boolean; messageId?: string; skipped?: boolean; error?: string }> {
  if (!task.id) {
    return { success: false, skipped: true, error: 'NO_TASK_ID' };
  }

  // Idempotency check: don't dispatch multiple assignment emails for the same task unless forced
  const idempotencyKey = `act:assign_email:${task.id}:${task.assignedTo || 'unassigned'}`;
  if (!options?.force && dispatchedTaskAssignmentIds.has(idempotencyKey)) {
    return { success: true, skipped: true };
  }

  const assigneeName = task.assignedTo || 'Operations Lead';
  const assigneeEmail = resolveStaffEmail(task.assignedToId || task.assignedTo);

  if (!assigneeEmail || !isAllowedEmailRecipient(assigneeEmail)) {
    console.log(`[TaskNotification] Assignment email skipped for ${assigneeName} (no valid/allowed email: ${assigneeEmail})`);
    return { success: true, skipped: true, error: 'NO_VALID_EMAIL' };
  }

  const requesterName = (task.agentName || 'Brokerage Staff').replace(/\([^)]*\)/g, '').trim();
  const propertyAddress = task.propertyAddress || task.requestTitle || 'Property Address Not Specified';
  const taskTitle = task.title || 'Deliverable Task';

  console.log(`[TaskNotification] 📨 Dispatching assignment email to ${assigneeName} <${assigneeEmail}> for task "${taskTitle}" (${propertyAddress})`);

  try {
    const res = await sendTaskAssignmentNotificationEmail({
      toEmail: assigneeEmail,
      assigneeName,
      requesterName,
      propertyAddress,
      taskTitle,
      category: task.category,
      dueAt: task.dueAt,
      notes: task.notes,
      driveFolderUrl: task.driveFolderUrl,
      taskId: task.id
    });

    dispatchedTaskAssignmentIds.add(idempotencyKey);

    // Record audit event
    await recordActivityEvent({
      workspaceId: task.workspaceId || 'ws_wilmington',
      requestId: task.requestId,
      taskId: task.id,
      eventType: 'outreach.delivered',
      actorType: 'nora',
      actorDisplayName: 'Ask Nora',
      channel: 'email',
      direction: 'outbound',
      communicationStatus: 'delivered',
      summary: `NORA notified ${assigneeName} (${assigneeEmail}) of task assignment: "${taskTitle}" for ${propertyAddress}`,
      metadata: {
        taskTitle,
        assigneeName,
        assigneeEmail,
        propertyAddress,
        dueAt: task.dueAt,
        source: options?.source || 'system'
      },
      idempotencyKey
    }).catch(() => {});

    return { success: res.success, messageId: res.messageId };
  } catch (err: any) {
    console.warn(`[TaskNotification] Error dispatching assignment email for task ${task.id}:`, err?.message || err);
    return { success: false, error: err?.message };
  }
}

/**
 * Dispatches a consolidated intake confirmation email to the requesting agent.
 */
export async function dispatchRequestIntakeConfirmation(
  request: CanonicalMarketingRequest,
  tasks: CanonicalMarketingTask[] = [],
  options?: { source?: string; force?: boolean }
): Promise<{ success: boolean; messageId?: string; skipped?: boolean; error?: string }> {
  if (!request.id) {
    return { success: false, skipped: true, error: 'NO_REQUEST_ID' };
  }

  const idempotencyKey = `act:intake_conf:${request.id}`;
  if (!options?.force && dispatchedRequestConfirmationIds.has(idempotencyKey)) {
    return { success: true, skipped: true };
  }

  const agentEmail = resolveAgentEmail(request.agentName, request.agentEmail);
  if (!agentEmail || !isAllowedEmailRecipient(agentEmail)) {
    console.log(`[TaskNotification] Intake confirmation email skipped for ${request.agentName} (no valid/allowed email: ${agentEmail})`);
    return { success: true, skipped: true, error: 'NO_VALID_EMAIL' };
  }

  const agentName = (request.agentName || 'Agent').replace(/\([^)]*\)/g, '').trim();
  const propertyAddress = request.propertyAddress || request.title || 'Property Address Not Specified';
  const assignedLead = request.assignedTo || tasks[0]?.assignedTo || 'Melissa Gagliardi';

  const deliverables = tasks.length > 0
    ? tasks.map(t => t.title)
    : [request.title || 'Marketing Launch Suite'];

  console.log(`[TaskNotification] 📨 Dispatching intake confirmation to ${agentName} <${agentEmail}> for "${propertyAddress}" (${deliverables.length} deliverables)`);

  try {
    const res = await sendMarketingIntakeConfirmationEmail({
      toEmail: agentEmail,
      agentName,
      propertyAddress,
      deliverables,
      assignedLead
    });

    dispatchedRequestConfirmationIds.add(idempotencyKey);

    // Record audit event
    await recordActivityEvent({
      workspaceId: request.workspaceId || 'ws_wilmington',
      requestId: request.id,
      eventType: 'outreach.delivered',
      actorType: 'nora',
      actorDisplayName: 'Ask Nora',
      channel: 'email',
      direction: 'outbound',
      communicationStatus: 'delivered',
      summary: `NORA sent intake confirmation to ${agentName} (${agentEmail}) for ${propertyAddress}`,
      metadata: {
        agentName,
        agentEmail,
        propertyAddress,
        deliverables,
        assignedLead,
        source: options?.source || 'system'
      },
      idempotencyKey
    }).catch(() => {});

    return { success: res.success, messageId: res.messageId };
  } catch (err: any) {
    console.warn(`[TaskNotification] Error dispatching intake confirmation for request ${request.id}:`, err?.message || err);
    return { success: false, error: err?.message };
  }
}
