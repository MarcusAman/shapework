import { renderWorkItemAssignedEmail } from './emailTemplates/workItemAssignedEmail.js';
import { renderApprovalNeededEmail } from './emailTemplates/approvalNeededEmail.js';
import { renderMissingInfoNeededEmail } from './emailTemplates/missingInfoNeededEmail.js';
import { renderDueSoonEmail } from './emailTemplates/dueSoonEmail.js';
import { renderOverdueEmail } from './emailTemplates/overdueEmail.js';
import { renderOwnerBriefReadyEmail } from './emailTemplates/ownerBriefReadyEmail.js';
import { renderTaskCompletedEmail } from './emailTemplates/taskCompletedEmail.js';
import { renderIntegrationIssueEmail } from './emailTemplates/integrationIssueEmail.js';
import { renderSmsNotification, SmsTemplateInput } from './smsTemplates.js';

export type NotificationEmailTemplate =
  | 'work_item_assigned'
  | 'approval_needed'
  | 'missing_info_needed'
  | 'due_soon'
  | 'overdue'
  | 'owner_brief_ready'
  | 'task_completed'
  | 'integration_issue';

export interface RenderEmailResult {
  subject: string;
  html: string;
  text: string;
}

export function compileEmailNotification(
  template: NotificationEmailTemplate,
  input: any
): RenderEmailResult {
  const workspaceName = input.workspaceName || 'Nest Realty';
  const actionUrl = input.actionUrl;

  let subject = 'shapework. Notification';
  let html = '';
  let text = '';

  switch (template) {
    case 'approval_needed': {
      const actionTitle = input.actionTitle || 'AI-Prepared release';
      subject = `Approval needed: ${actionTitle}`;
      html = renderApprovalNeededEmail({ ...input, actionTitle });
      text = `Approval needed: ${actionTitle}\n\nshapework prepared this action because ${input.summary || 'human verification is required'}.\n\nWhy it matters: ${input.whyItMatters || 'Process is paused until approved.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Review details and sign-off.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'work_item_assigned': {
      const workItemTitle = input.workItemTitle || 'New task';
      subject = `New shapework task: ${workItemTitle}`;
      html = renderWorkItemAssignedEmail({ ...input, workItemTitle });
      text = `New shapework task: ${workItemTitle}\n\nYou have a brokerage task waiting in shapework.\n\nWhy it matters: ${input.whyItMatters || 'Task resolution ensures timeline accuracy.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Open task to complete it.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'missing_info_needed': {
      const workItemTitle = input.workItemTitle || 'Task';
      subject = `Missing info needed: ${workItemTitle}`;
      html = renderMissingInfoNeededEmail({ ...input, workItemTitle });
      text = `Missing info needed: ${workItemTitle}\n\nThis item is blocked until the missing information is added.\n\nWhy it matters: ${input.whyItMatters || 'Escrow files cannot be cleared without this.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Supply target missing info.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'due_soon': {
      const workItemTitle = input.workItemTitle || 'Task';
      subject = `Due soon: ${workItemTitle}`;
      html = renderDueSoonEmail({ ...input, workItemTitle });
      text = `Due soon: ${workItemTitle}\n\nThis brokerage task is coming due soon.\n\nWhy it matters: ${input.whyItMatters || 'Approaching deadline risk.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Review task details.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'overdue': {
      const workItemTitle = input.workItemTitle || 'Task';
      subject = `Overdue: ${workItemTitle}`;
      html = renderOverdueEmail({ ...input, workItemTitle });
      text = `Overdue: ${workItemTitle}\n\nThis item is past due and needs attention.\n\nWhy it matters: ${input.whyItMatters || 'Critical contract deadline missed.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Resolve now.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'owner_brief_ready': {
      subject = 'Your shapework Owner Brief is ready';
      html = renderOwnerBriefReadyEmail(input);
      text = `Your shapework Owner Brief is ready\n\nHere is what changed across the brokerage.\n\nWhy it matters: ${input.whyItMatters || 'Weekly operational and revenue health pulse digest.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Open Owner Brief.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'task_completed': {
      const workItemTitle = input.workItemTitle || 'Task';
      subject = `Task completed: ${workItemTitle}`;
      html = renderTaskCompletedEmail({ ...input, workItemTitle });
      text = `Task completed: ${workItemTitle}\n\nA task has been completed and resolved.\n\nOpen link securely: ${actionUrl}`;
      break;
    }
    case 'integration_issue': {
      const integrationName = input.integrationName || 'Connection';
      subject = `Integration alert: ${integrationName}`;
      html = renderIntegrationIssueEmail({ ...input, integrationName });
      text = `Integration alert: ${integrationName}\n\nAn issue was detected with one of your connections.\n\nWhy it matters: ${input.whyItMatters || 'Data synchronization is currently interrupted.'}\n\nRecommended Next Action: ${input.recommendedAction || 'Reconnect integration.'}\n\nOpen link securely: ${actionUrl}`;
      break;
    }
  }

  return { subject, html, text };
}

export { renderSmsNotification };
export type { SmsTemplateInput };
