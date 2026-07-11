import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderOverdueEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'iconHtml'> & { workItemTitle: string }): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #FEE2E2; text-align: center; color: #B42318; font-size: 24px; font-weight: bold;">
      🚨
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Overdue Alert',
    preheader: 'This item is past due and needs attention.',
    headline: `${input.workItemTitle} is overdue`,
    ctaLabel: 'Resolve now'
  }, iconHtml);
}
