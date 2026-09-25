import { renderSlaAlertEmail } from '../email/noraOperationalEmails.js';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CanonicalMarketingTask,
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingRequestById,
  saveCanonicalMarketingTask
} from '../persistence/marketingCampaignsRepository.js';
import {
  sendEmail,
  isAllowedEmailRecipient
} from '../email/emailProvider.js';
import {
  isAllowedSmsRecipient,
  recordSmsDispatch
} from '../security/smsWhitelistGate.js';
import {
  getResponsibleDepartmentOwner
} from '../policies/departmentNotificationPolicyEngine.js';

export interface SlaEvaluationResult {
  status: 'on_track' | 'approaching_overdue' | 'overdue' | 'completed' | 'archived';
  hoursRemaining: number;
  minutesRemaining: number;
  isOverdue: boolean;
  isApproaching: boolean;
  badgeLabel: string;
  badgeColor: 'green' | 'amber' | 'red' | 'slate';
  dueAtDate: Date;
}

// In-memory alert dispatch history cache to prevent duplicate email/SMS spam
const slaAlertHistory = new Map<string, { tier1SentAt?: string; tier2SentAt?: string }>();

// Phone directory for SMS alerts
const TEAM_PHONES: Record<string, string> = {
  'Melissa Gagliardi': '+19105072047',
  'Eduardo Lovo': '+19105072047',
  'Ann Gunn': '+19105072047',
  'Ryan Crecelius': '+19105072047',
  'Marcus Aman': '+19105072047'
};

const TEAM_EMAILS: Record<string, string> = {
  'Melissa Gagliardi': 'melissa.gagliardi@nestrealty.com',
  'Eduardo Lovo': 'eduardo@nestrealty.com',
  'Ann Gunn': 'ann.gunn@nestrealty.com',
  'Ryan Crecelius': 'ryan@nestrealty.com',
  'Marcus Aman': 'marcus.aman@gmail.com'
};

/**
 * Computes the SLA status for a given task
 */
export function evaluateTaskSlaStatus(task: CanonicalMarketingTask, referenceTime: Date = new Date()): SlaEvaluationResult {
  if (task.status === 'completed' || task.status === 'approved') {
    return {
      status: 'completed',
      hoursRemaining: 0,
      minutesRemaining: 0,
      isOverdue: false,
      isApproaching: false,
      badgeLabel: 'Completed On Schedule',
      badgeColor: 'slate',
      dueAtDate: task.dueAt ? new Date(task.dueAt) : referenceTime
    };
  }

  if (task.isArchived || task.status === 'archived') {
    return {
      status: 'archived',
      hoursRemaining: 0,
      minutesRemaining: 0,
      isOverdue: false,
      isApproaching: false,
      badgeLabel: 'Archived',
      badgeColor: 'slate',
      dueAtDate: task.dueAt ? new Date(task.dueAt) : referenceTime
    };
  }

  // Default due date: 48h from creation if not explicitly set
  const dueAt = task.dueAt ? new Date(task.dueAt) : new Date(new Date(task.createdAt || referenceTime).getTime() + 48 * 60 * 60 * 1000);
  const diffMs = dueAt.getTime() - referenceTime.getTime();
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = totalMinutes / 60;

  if (diffMs < 0) {
    const overdueMinutes = Math.abs(totalMinutes);
    const overdueHours = Math.floor(overdueMinutes / 60);
    const overdueMins = overdueMinutes % 60;
    return {
      status: 'overdue',
      hoursRemaining: totalHours,
      minutesRemaining: totalMinutes,
      isOverdue: true,
      isApproaching: false,
      badgeLabel: `🚨 Overdue by ${overdueHours}h ${overdueMins}m`,
      badgeColor: 'red',
      dueAtDate: dueAt
    };
  }

  // Approaching overdue: within 4 hours (240 minutes)
  if (totalHours <= 4.0) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      status: 'approaching_overdue',
      hoursRemaining: totalHours,
      minutesRemaining: totalMinutes,
      isOverdue: false,
      isApproaching: true,
      badgeLabel: `⚠️ Due in ${hrs}h ${mins}m`,
      badgeColor: 'amber',
      dueAtDate: dueAt
    };
  }

  const hrs = Math.floor(totalMinutes / 60);
  return {
    status: 'on_track',
    hoursRemaining: totalHours,
    minutesRemaining: totalMinutes,
    isOverdue: false,
    isApproaching: false,
    badgeLabel: `On Schedule (${hrs}h remaining)`,
    badgeColor: 'green',
    dueAtDate: dueAt
  };
}

/**
 * Task Guardrail Gate: Validates whether a task has the required evidence / deliverables before completion
 */
export function validateTaskCompletionGuardrail(task: CanonicalMarketingTask): { allowed: boolean; reason?: string } {
  const hasPhotos = Array.isArray(task.photos) && task.photos.length > 0;
  const hasAttachments = Array.isArray(task.attachments) && task.attachments.length > 0;
  const hasDrive = Boolean(task.driveFolderUrl);

  // If task has neither photos nor attachments nor drive link, require evidence
  if (!hasPhotos && !hasAttachments && !hasDrive) {
    return {
      allowed: false,
      reason: 'Guardrail Block: Task cannot be finalized without at least one attached photo asset, design proof, or Google Drive folder URL.'
    };
  }

  return { allowed: true };
}

/**
 * Executes a full scan of all tasks, checks SLA deadlines, and dispatches Tier 1 & Tier 2 alerts with deduplication.
 */
export async function runSlaGuardrailCheck(referenceTime: Date = new Date()): Promise<{
  scannedCount: number;
  approachingCount: number;
  overdueCount: number;
  alertsDispatched: number;
}> {
  const tasks = getAllCanonicalMarketingTasks();
  let approachingCount = 0;
  let overdueCount = 0;
  let alertsDispatched = 0;

  for (const task of tasks) {
    const evalResult = evaluateTaskSlaStatus(task, referenceTime);
    const alertState = slaAlertHistory.get(task.id) || {};
    const propertyAddress = task.propertyAddress || task.title || 'Listing Task';
    const assigneeName = task.assignedTo || 'Melissa Gagliardi';
    const assigneeEmail = TEAM_EMAILS[assigneeName] || 'melissa.gagliardi@nestrealty.com';
    const assigneePhone = TEAM_PHONES[assigneeName] || '+19105072047';

    const deptOwner = getResponsibleDepartmentOwner({
      category: task.category || 'marketing',
      title: task.title
    });

    // -------------------------------------------------------------
    // Tier 1: Approaching Overdue (<= 4h remaining)
    // -------------------------------------------------------------
    if (evalResult.isApproaching && !alertState.tier1SentAt) {
      approachingCount++;
      console.log(`[SLA Monitor] Task "${task.title}" for ${propertyAddress} is approaching overdue (${evalResult.badgeLabel}). Dispatching Tier 1 alert.`);

      const emailSubject = `⚠️ Turnaround Warning: "${task.title}" for ${propertyAddress} due in ${Math.round(evalResult.hoursRemaining)}h`;
      const emailHtml = renderSlaAlertEmail({
        overdue: false, assignee: assigneeName, propertyAddress, taskTitle: task.title,
        due: evalResult.dueAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: evalResult.badgeLabel, actionUrl: 'https://shapework.co/app',
      });

      try {
        await sendEmail({
          to: assigneeEmail,
          subject: emailSubject,
          html: emailHtml,
          text: `Proactive SLA Warning: "${task.title}" for ${propertyAddress} is due in ${Math.round(evalResult.hoursRemaining)}h.`
        });

        if (isAllowedSmsRecipient(assigneePhone)) {
          const smsBody = `Nest Ops Warning: "${task.title}" for ${propertyAddress} is due in <4h (${evalResult.badgeLabel}). Drive pack: ${task.driveFolderUrl || 'https://drive.google.com'}`;
          recordSmsDispatch(assigneePhone, smsBody);
        }

        slaAlertHistory.set(task.id, { ...alertState, tier1SentAt: referenceTime.toISOString() });
        alertsDispatched++;
      } catch (err) {
        console.warn('[SLA Monitor] Error sending Tier 1 alert:', err);
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Overdue / SLA Breached
    // -------------------------------------------------------------
    if (evalResult.isOverdue && !alertState.tier2SentAt) {
      overdueCount++;
      console.log(`[SLA Monitor] 🚨 Task "${task.title}" for ${propertyAddress} is OVERDUE (${evalResult.badgeLabel}). Escalating to Department Lead & BIC.`);

      const emailSubject = `🚨 URGENT OVERDUE ESCALATION: "${task.title}" for ${propertyAddress}`;
      const emailHtml = renderSlaAlertEmail({
        overdue: true, departmentOwner: deptOwner.name, assignee: assigneeName, propertyAddress, taskTitle: task.title,
        due: evalResult.dueAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: evalResult.badgeLabel, actionUrl: 'https://shapework.co/app',
      });

      try {
        // Send email to Assignee with CC to Department Lead & BIC
        await sendEmail({
          to: assigneeEmail,
          cc: [deptOwner.email, 'ryan@nestrealty.com', 'marcus.aman@gmail.com'],
          subject: emailSubject,
          html: emailHtml,
          text: `🚨 URGENT OVERDUE: "${task.title}" for ${propertyAddress} has breached its deadline (${evalResult.badgeLabel}).`
        });

        // Dispatch SMS alerts to Assignee and Department Lead
        const overdueSms = `🚨 NEST OPS OVERDUE: "${task.title}" for ${propertyAddress} is ${evalResult.badgeLabel}. Immediate action required.`;
        if (isAllowedSmsRecipient(assigneePhone)) {
          recordSmsDispatch(assigneePhone, overdueSms);
        }
        if (assigneePhone !== TEAM_PHONES[deptOwner.name] && isAllowedSmsRecipient(TEAM_PHONES[deptOwner.name])) {
          recordSmsDispatch(TEAM_PHONES[deptOwner.name], overdueSms);
        }

        slaAlertHistory.set(task.id, { ...alertState, tier2SentAt: referenceTime.toISOString() });
        alertsDispatched++;
      } catch (err) {
        console.warn('[SLA Monitor] Error sending Tier 2 alert:', err);
      }
    }
  }

  return {
    scannedCount: tasks.length,
    approachingCount,
    overdueCount,
    alertsDispatched
  };
}

/**
 * Returns real-time SLA metrics summary
 */
export function getSlaGuardrailSummary(referenceTime: Date = new Date()) {
  const tasks = getAllCanonicalMarketingTasks();
  let onTrack = 0;
  let approaching = 0;
  let overdue = 0;
  let completed = 0;

  for (const t of tasks) {
    const res = evaluateTaskSlaStatus(t, referenceTime);
    if (res.status === 'completed') completed++;
    else if (res.status === 'overdue') overdue++;
    else if (res.status === 'approaching_overdue') approaching++;
    else if (res.status === 'on_track') onTrack++;
  }

  return {
    totalActive: onTrack + approaching + overdue,
    onTrack,
    approaching,
    overdue,
    completed,
    healthScore: onTrack + approaching + overdue > 0 ? Math.round((onTrack / (onTrack + approaching + overdue)) * 100) : 100
  };
}

/**
 * Resets alert history (useful for unit tests)
 */
export function resetSlaAlertHistory() {
  slaAlertHistory.clear();
}
