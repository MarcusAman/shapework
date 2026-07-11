import { ActionNotification, logNotificationAudit } from './notificationTypes.js';
import { generateSecureActionToken } from './notificationToken.js';
import { DevLogProvider, ResendEmailProvider, SmsProviderStub } from './notificationProvider.js';
import { compileEmailNotification, renderSmsNotification, NotificationEmailTemplate } from './notificationRenderer.js';
import { sendSmsNotification } from './smsProvider.js';

/**
 * Checks if a duplicate notification was recently sent (cooldown window enforcement).
 */
export function isNotificationOnCooldown(
  dbState: any,
  recipientId: string,
  actionType: string,
  workItemId?: string,
  approvalId?: string
): boolean {
  if (!dbState.notifications) dbState.notifications = [];
  
  // 5 minutes default cooldown window
  const cooldownWindowMs = (dbState.settings?.notificationCooldownMinutes || 5) * 60 * 1000;
  
  const now = Date.now();
  return dbState.notifications.some((n: ActionNotification) => {
    if (n.recipientStaffMemberId !== recipientId || n.actionType !== actionType) {
      return false;
    }
    if (workItemId && n.workItemId !== workItemId) {
      return false;
    }
    if (approvalId && n.approvalId !== approvalId) {
      return false;
    }
    
    // Check if status is sent/queued and time is within cooldown
    const age = now - new Date(n.sentAt || n.createdAt).getTime();
    return (n.status === 'sent' || n.status === 'queued') && age < cooldownWindowMs;
  });
}

/**
 * Core engine to trigger, format, queue, and dispatch notifications.
 */
export async function triggerNotification(
  dbState: any,
  workspaceId: string,
  recipientId: string,
  actionType: ActionNotification['actionType'],
  payload: { workItemId?: string; approvalId?: string; contextText?: string }
): Promise<ActionNotification | null> {
  if (!dbState.notifications) dbState.notifications = [];
  
  // Find active recipient profile
  const profiles = dbState.profiles || [];
  const recipient = profiles.find((p: any) => p.id === recipientId);
  if (!recipient || recipient.status === 'inactive') {
    return null;
  }
  
  const { workItemId, approvalId } = payload;
  
  // Cooldown / spam check
  if (isNotificationOnCooldown(dbState, recipientId, actionType, workItemId, approvalId)) {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Supressed notification to ${recipient.name} for ${actionType} (Cooldown active)`,
      'notifications'
    );
    return null;
  }
  
  // Generate secure action token
  const { token, secureToken } = generateSecureActionToken(
    dbState,
    workspaceId,
    recipientId,
    actionType,
    workItemId,
    approvalId
  );
  
  // Determine if action requires login / step-up auth (sensitive action type)
  const isSensitive = [
    'approve_action', 'approve_proposal', 'send_sms', 'send_compliance_nudge',
    'post_to_teams', 'create_calendar_event', 'update_calendar_event',
    'change_assignment', 'view_private_documents', 'view_financial_details',
    'disconnect_integrations', 'change_notification_rules', 'change_workspace_settings'
  ].includes(actionType);

  const PORT = process.env.PORT || '3063';
  const domain = process.env.APP_URL || `http://localhost:${PORT}`;
  const actionUrl = isSensitive
    ? `${domain}/login?returnTo=/action/${token}`
    : `${domain}/action/${token}`;

  // Determine preferred channel based on profile settings or default to email
  const channel = recipient.notificationChannel || 'email';
  
  const newNotification: ActionNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    recipientStaffMemberId: recipientId,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientPhone: recipient.cellPhone || recipient.phone,
    channel,
    status: 'queued',
    actionType,
    secureActionTokenHash: secureToken.tokenHash,
    expiresAt: secureToken.expiresAt,
    createdAt: new Date().toISOString()
  };
  
  if (workItemId) newNotification.workItemId = workItemId;
  if (approvalId) newNotification.approvalId = approvalId;
  
  dbState.notifications.unshift(newNotification);
  
  // Look up work item / approval details for the templates
  const workItem = workItemId ? (dbState.workItems || []).find((w: any) => w.id === workItemId) : null;
  const approval = approvalId ? (
    (dbState.decisions || []).find((d: any) => d.id === approvalId) ||
    (dbState.actionProposals || []).find((p: any) => p.id === approvalId)
  ) : null;

  // Map actionType to specific email/SMS templates
  let template: NotificationEmailTemplate = 'work_item_assigned';
  if (actionType === 'approve_action') {
    template = 'approval_needed';
  } else if (actionType === 'add_missing_info') {
    template = 'missing_info_needed';
  } else if (actionType === 'view_owner_brief') {
    template = 'owner_brief_ready';
  } else if (actionType === 'complete_work_item') {
    if (workItem) {
      if (workItem.status === 'completed') {
        template = 'task_completed';
      } else {
        const isOverdue = workItem.dueDate && new Date(workItem.dueDate) < new Date();
        if (isOverdue) {
          template = 'overdue';
        } else {
          const dueTime = workItem.dueDate ? new Date(workItem.dueDate).getTime() : 0;
          const isDueSoon = dueTime && (dueTime - Date.now() < 2 * 24 * 60 * 60 * 1000);
          if (isDueSoon) {
            template = 'due_soon';
          } else {
            template = 'work_item_assigned';
          }
        }
      }
    } else {
      template = 'work_item_assigned';
    }
  }

  // Populate dynamic template input variables
  const templateInput: any = {
    recipientName: recipient.name,
    workspaceName: 'Nest Realty',
    actionUrl,
    summary: payload.contextText || '',
  };

  if (workItem) {
    templateInput.workItemTitle = workItem.title;
    templateInput.summary = payload.contextText || workItem.description || '';
    templateInput.whyItMatters = workItem.why_it_matters || 'No additional context provided.';
    templateInput.recommendedAction = workItem.recommended_action || 'Review and take appropriate action.';
    templateInput.assignedTo = workItem.assignedToRole || workItem.assignedToStaffMemberId || 'Brokerage Operations';
    templateInput.dueText = workItem.dueDate ? new Date(workItem.dueDate).toLocaleDateString() : 'Today';
    templateInput.priority = workItem.priority || 'medium';
  }

  if (approval) {
    templateInput.actionTitle = approval.title;
    templateInput.summary = payload.contextText || approval.description || '';
    templateInput.whyItMatters = approval.why_it_matters || 'Human authorization is required to execute this step.';
    templateInput.recommendedAction = approval.recommended_action || 'Review proposed draft and authorize.';
    templateInput.assignedTo = approval.owner || 'Frank Miller (Managing Broker)';
    templateInput.dueText = approval.time_remaining || 'Immediate';
    templateInput.priority = 'high';
  }

  if (actionType === 'integration_issue' as any) {
    template = 'integration_issue';
    templateInput.integrationName = payload.contextText || 'Google Workspace';
    templateInput.whyItMatters = 'Data synchronization is currently interrupted.';
    templateInput.recommendedAction = 'Reconnect integration';
    templateInput.summary = 'shapework detected a synchronization failure with your third-party provider.';
  }

  // Perform sending using provider abstraction
  const resendProvider = new ResendEmailProvider();
  const smsProvider = new SmsProviderStub();
  const devProvider = new DevLogProvider();

  templateInput.branding = dbState.branding || {
    brokerageName: 'Nest Realty Wilmington',
    primaryColor: '#18382b'
  };
  
  // Render notification
  const { subject, html: bodyHtml, text: bodyText } = compileEmailNotification(template, templateInput);
  const smsMessage = renderSmsNotification({
    type: template,
    actionUrl,
    workItemTitle: templateInput.workItemTitle,
    actionTitle: templateInput.actionTitle,
    integrationName: templateInput.integrationName
  });
  
  let sendResult;
  if (channel === 'email') {
    if (process.env.RESEND_API_KEY && 
        process.env.RESEND_API_KEY !== 'undefined' && 
        process.env.RESEND_API_KEY !== 'null' && 
        process.env.RESEND_API_KEY !== 're_mock_api_key_for_testing_12345' && 
        process.env.RESEND_API_KEY.trim() !== '') {
      sendResult = await resendProvider.sendEmail({
        to: recipient.email,
        subject,
        html: bodyHtml,
        text: bodyText
      });
    } else {
      sendResult = await devProvider.sendEmail({
        to: recipient.email,
        subject,
        html: bodyHtml,
        text: bodyText
      });
    }
  } else {
    // SMS channel sending
    const smsRes = await sendSmsNotification(
      dbState,
      recipient.cellPhone || recipient.phone,
      smsMessage
    );
    sendResult = {
      success: smsRes.success,
      provider: process.env.SMS_PROVIDER || 'disabled',
      messageId: smsRes.messageId,
      error: smsRes.error
    };
  }
  
  if (sendResult.success) {
    newNotification.status = 'sent';
    newNotification.sentAt = new Date().toISOString();
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Sent ${channel} notification to ${recipient.name} via ${sendResult.provider}`,
      'notifications'
    );
  } else {
    newNotification.status = 'failed';
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Failed to send ${channel} notification to ${recipient.name}: ${sendResult.error}`,
      'notifications'
    );
  }
  
  (newNotification as any).rawToken = token;
  return newNotification;
}

/**
 * Message text templates renderer.
 */
function renderNotificationMessage(
  actionType: string,
  name: string,
  link: string,
  contextText?: string
): { subject: string; bodyText: string; bodyHtml: string } {
  let subject = 'shapework. Action Needed';
  let desc = 'You have a pending task requiring your attention.';
  
  if (actionType === 'approve_action') {
    subject = 'shapework. Approval Required';
    desc = contextText || 'An automated proposal is waiting for your review and sign-off.';
  } else if (actionType === 'complete_work_item') {
    subject = 'shapework. Task Action Request';
    desc = contextText || 'A brokerage work item requires verification or completion.';
  } else if (actionType === 'add_missing_info') {
    subject = 'shapework. Missing Information Request';
    desc = contextText || 'A client file is missing details needed to proceed.';
  } else if (actionType === 'view_owner_brief') {
    subject = 'shapework. Owner Brief Available';
    desc = 'Your weekly brokerage operational brief has been compiled and is ready.';
  }
  
  const bodyText = `${desc} Click here to take action securely: ${link}`;
  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4decb; border-radius: 12px; background-color: #fffdf7;">
      <h2 style="color: #18382b; font-family: serif; margin-top: 0;">shapework.</h2>
      <p style="font-size: 14px; color: #1e2520; line-height: 1.5;">Hello ${name},</p>
      <p style="font-size: 14px; color: #1e2520; line-height: 1.5;">${desc}</p>
      <div style="margin: 24px 0;">
        <a href="${link}" style="background-color: #18382b; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block;">Take Action Now &rarr;</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e4decb; margin: 20px 0;" />
      <p style="font-size: 10px; color: #8c8c8c;">This is a secure, single-use, expiring link. For security, do not share this email or link with others.</p>
    </div>
  `;
  
  return { subject, bodyText, bodyHtml };
}
