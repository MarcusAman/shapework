import { test, expect } from '@playwright/test';
import { renderSmsNotification, SmsTemplateInput } from '../../server/notifications/smsTemplates.js';

test.describe('Notification SMS Templates', () => {
  const mockUrl = 'https://shapework.co/action/sms_tok_123';

  test('compiles work assigned SMS', () => {
    const msg = renderSmsNotification({
      type: 'work_item_assigned',
      actionUrl: mockUrl,
      workItemTitle: 'Utility Hookup'
    });
    expect(msg).toContain('shapework:');
    expect(msg).toContain('Utility Hookup');
    expect(msg).toContain(mockUrl);
    expect(msg.length).toBeLessThan(160);
  });

  test('compiles approval needed SMS', () => {
    const msg = renderSmsNotification({
      type: 'approval_needed',
      actionUrl: mockUrl,
      actionTitle: 'Wire Confirmation'
    });
    expect(msg).toContain('shapework:');
    expect(msg).toContain('Approval needed');
    expect(msg).toContain('Wire Confirmation');
    expect(msg).toContain(mockUrl);
  });

  test('compiles missing info SMS', () => {
    const msg = renderSmsNotification({
      type: 'missing_info_needed',
      actionUrl: mockUrl,
      workItemTitle: 'Harbor Listing'
    });
    expect(msg).toContain('blocked by missing info');
    expect(msg).toContain(mockUrl);
  });
});
