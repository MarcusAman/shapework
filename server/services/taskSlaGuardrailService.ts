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
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #fef3c7; border-radius: 16px; overflow: hidden;">
          <div style="background: #d97706; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 17px; font-weight: 700;">Nest Ops • SLA Turnaround Warning</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #fef3c7;">Task Approaching Deadline: ${evalResult.badgeLabel}</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p>Hi <strong>${assigneeName}</strong>,</p>
            <p>This is a proactive turnaround notice for <strong>${propertyAddress}</strong> (<em>${task.title}</em>).</p>
            <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">Due: ${evalResult.dueAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${evalResult.badgeLabel})</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">Drive Pack: <a href="${task.driveFolderUrl || 'https://drive.google.com'}" style="color: #d97706; font-weight: 600;">${task.driveFolderUrl || 'Open Google Drive'}</a></p>
          </div>
          <div style="background: #f8fafc; padding: 12px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #fef3c7;">
            Sent by Nora SLA Sentinel • Proactive 4-Hour Warning
          </div>
        </div>
      `;

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
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #fee2e2; border-radius: 16px; overflow: hidden;">
          <div style="background: #dc2626; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 17px; font-weight: 700;">Nest Ops • SLA Deadline Breached</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #fee2e2;">Overdue Escalation: ${evalResult.badgeLabel}</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p>Attention <strong>${assigneeName}</strong>, <strong>${deptOwner.name}</strong>, and Principal Broker:</p>
            <p>The deadline for <strong>${propertyAddress}</strong> (<em>${task.title}</em>) has passed without completion.</p>
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 700;">Status: ${evalResult.badgeLabel} • Assigned: ${assigneeName}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">Please coordinate immediately to complete deliverables or notify the listing agent.</p>
          </div>
          <div style="background: #f8fafc; padding: 12px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #fee2e2;">
            Nora SLA Sentinel • Automatic Escalation to Department Lead & Brokerage BIC
          </div>
        </div>
      `;

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
