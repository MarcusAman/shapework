import { renderBaseEmailLayout } from './baseEmailLayout.js';
import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderOwnerBriefReadyEmail(input: Omit<BaseNotificationEmailInput, 'typeLabel' | 'preheader' | 'ctaLabel' | 'headline' | 'iconHtml'>): string {
  const iconHtml = `
    <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #FEF3C7; text-align: center; color: #B7791F; font-size: 24px; font-weight: bold;">
      📊
    </div>
  `;

  return renderBaseEmailLayout({
    ...input,
    typeLabel: 'Executive Briefing',
    preheader: 'Here is what changed across the brokerage.',
    headline: 'Your Owner Brief is ready',
    ctaLabel: 'Open Owner Brief'
  }, iconHtml);
}
