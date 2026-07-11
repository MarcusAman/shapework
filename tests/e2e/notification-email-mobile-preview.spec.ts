import { test, expect } from '@playwright/test';
import { compileEmailNotification } from '../../server/notifications/notificationRenderer.js';

test.describe('Notification Email Mobile Preview', () => {
  test('email template viewport and structure are responsive friendly', async () => {
    const { html } = compileEmailNotification('approval_needed', {
      recipientName: 'Sarah',
      workspaceName: 'Nest Realty',
      actionUrl: 'https://shapework.co/action/mock',
      summary: 'Preview summary.',
      actionTitle: 'Tax transcript request'
    });

    // Verify presence of viewport meta tags for responsive scaling
    expect(html).toContain('name="viewport"');
    expect(html).toContain('content="width=device-width, initial-scale=1.0"');
    
    // Verify table max-width class styles exist
    expect(html).toContain('email-container');
    expect(html).toContain('max-width: 560px');
  });
});
