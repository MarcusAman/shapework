import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderWorkItemAssignedEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'iconHtml'> & { workItemTitle: string }): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #DDEBDD; text-align: center; color: #18382B; font-size: 24px; font-weight: bold;">
      📋
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Task Assigned',
    preheader: 'You have a brokerage task waiting in shapework.',
    headline: input.workItemTitle,
    ctaLabel: 'Open task'
  }, iconHtml);
}
