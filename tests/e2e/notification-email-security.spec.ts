import { test, expect } from '@playwright/test';
import { compileEmailNotification } from '../../server/notifications/notificationRenderer.js';

test.describe('Notification Email Security Controls', () => {
  const sensitiveInput = {
    recipientName: 'Sarah Jenkins',
    workspaceName: 'Nest Realty',
    actionUrl: 'https://shapework.co/action/sec_tok_xyz12345',
    summary: 'Sensitive operations summary.',
    whyItMatters: 'Critical banking and routing data protection.',
    recommendedAction: 'Verify escrow wire detail confirmation.',
    assignedTo: 'Brokerage Operations',
    dueText: 'Today',
    priority: 'high',
    workItemTitle: 'Earnest wire deposit',
    actionTitle: 'Wire Release Form'
  };

  test('does not expose raw tokens or security secrets in email contents', async () => {
    const result = compileEmailNotification('approval_needed', sensitiveInput);
    
    // The link should contain the actionUrl, but never the database secrets, API keys, or raw hashes
    expect(result.html).toContain(sensitiveInput.actionUrl);
    expect(result.html).not.toContain('mock_jwt_secret');
    expect(result.html).not.toContain('mock_encryption_key');
    
    // Ensure no private financial info placeholder leakage
    expect(result.html).not.toContain('routingNumber');
    expect(result.html).not.toContain('bankAccount');
  });
});
