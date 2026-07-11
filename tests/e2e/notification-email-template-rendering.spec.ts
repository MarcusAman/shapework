import { test, expect } from '@playwright/test';
import { compileEmailNotification, NotificationEmailTemplate } from '../../server/notifications/notificationRenderer.js';

test.describe('Notification Email Template Rendering', () => {
  const templates: NotificationEmailTemplate[] = [
    'work_item_assigned',
    'approval_needed',
    'missing_info_needed',
    'due_soon',
    'overdue',
    'owner_brief_ready',
    'task_completed',
    'integration_issue'
  ];

  const mockInput = {
    recipientName: 'Alice',
    workspaceName: 'Nest Realty',
    actionUrl: 'https://shapework.co/action/test_token_123',
    summary: 'A test email explanation.',
    whyItMatters: 'Important closing blocker.',
    recommendedAction: 'Sign the contract extension.',
    assignedTo: 'Broker Owner',
    dueText: 'Today',
    priority: 'high',
    workItemTitle: 'Earnest wire deposit',
    actionTitle: 'Wire Release Form',
    integrationName: 'Microsoft 365'
  };

  templates.forEach((template) => {
    test(`renders template: ${template}`, async () => {
      const result = compileEmailNotification(template, mockInput);
      
      expect(result.subject).toBeTruthy();
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();

      // Verify shapework brand presence
      expect(result.html).toContain('shapework.');
      expect(result.html).toContain('Manage notification settings');
      expect(result.html).toContain('Privacy Policy');
      expect(result.html).toContain('Terms of Service');

      // Verify fallback link exists
      expect(result.html).toContain(mockInput.actionUrl);
      
      // Verify recipient greeting
      expect(result.html).toContain('Hello Alice');
    });
  });
});
