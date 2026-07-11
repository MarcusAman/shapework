import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderDueSoonEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'iconHtml'> & { workItemTitle: string }): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #FEF3C7; text-align: center; color: #B7791F; font-size: 24px; font-weight: bold;">
      ⏰
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Due Soon',
    preheader: 'This brokerage task is coming due soon.',
    headline: `${input.workItemTitle} is due soon`,
    ctaLabel: 'Review task'
  }, iconHtml);
}
