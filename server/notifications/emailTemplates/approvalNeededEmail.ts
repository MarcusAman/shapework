import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderApprovalNeededEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'iconHtml'> & { actionTitle: string }): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #DDEBDD; text-align: center; color: #18382B; font-size: 24px; font-weight: bold;">
      ✓
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Approval Needed',
    preheader: 'A shapework action is waiting for your review.',
    headline: `${input.actionTitle} needs your approval`,
    ctaLabel: 'Review and approve'
  }, iconHtml);
}
