export type SmsTemplateInput = {
  type: 
    | 'work_item_assigned'
    | 'approval_needed'
    | 'missing_info_needed'
    | 'due_soon'
    | 'overdue'
    | 'owner_brief_ready'
    | 'task_completed'
    | 'integration_issue';
  actionUrl: string;
  workItemTitle?: string;
  actionTitle?: string;
  integrationName?: string;
};

export function renderSmsNotification(input: SmsTemplateInput): string {
  const { type, actionUrl, workItemTitle = 'task', actionTitle = 'action', integrationName = 'service' } = input;
  
  switch (type) {
    case 'approval_needed':
      return `shapework: Approval needed — ${actionTitle}. Review: ${actionUrl}`;
    case 'work_item_assigned':
      return `shapework: Task assigned — ${workItemTitle}. Open: ${actionUrl}`;
    case 'missing_info_needed':
      return `shapework: ${workItemTitle} is blocked by missing info. Add info: ${actionUrl}`;
    case 'due_soon':
      return `shapework: Compliance item due today — ${workItemTitle}. Review: ${actionUrl}`;
    case 'overdue':
      return `shapework: Task overdue — ${workItemTitle}. Resolve: ${actionUrl}`;
    case 'owner_brief_ready':
      return `shapework: Your Owner Brief is ready. Open: ${actionUrl}`;
    case 'task_completed':
      return `shapework: Task completed — ${workItemTitle}. View: ${actionUrl}`;
    case 'integration_issue':
      return `shapework: Connection issue with ${integrationName}. Reconnect: ${actionUrl}`;
    default:
      return `shapework: Action alert. Review: ${actionUrl}`;
  }
}
