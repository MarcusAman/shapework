export type BaseNotificationEmailInput = {
  recipientName?: string;
  workspaceName: string;
  headline: string;
  preheader: string;
  typeLabel: string;
  summary: string;
  whyItMatters?: string;
  recommendedAction?: string;
  assignedTo?: string;
  dueText?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'owner_worthy';
  ctaLabel: string;
  actionUrl: string;
  secondaryUrl?: string;
  notificationSettingsUrl?: string;
};
