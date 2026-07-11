import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderTaskCompletedEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'iconHtml'> & { workItemTitle: string }): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #DDEBDD; text-align: center; color: #18382B; font-size: 24px; font-weight: bold;">
      🎉
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Task Completed',
    preheader: 'A brokerage task has been successfully completed.',
    headline: `${input.workItemTitle} is complete`,
    ctaLabel: 'Review completed task'
  }, iconHtml);
}
