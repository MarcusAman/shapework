export type IntegrationProvider =
  | 'google_workspace'
  | 'gmail'
  | 'google_calendar'
  | 'google_drive'
  | 'microsoft_365'
  | 'outlook_mail'
  | 'outlook_calendar'
  | 'microsoft_teams'
  | 'quickbooks_online'
  | 'basecamp'
  | 'plaid'
  | 'rechat'
  | 'dotloop'
  | 'api_nation'
  | 'zapier'
  | 'google_business_profile'
  | 'resend'
  | 'smtp_email'
  | 'sms_provider'
  | 'slack';

export type IntegrationImplementationStatus =
  | 'connected'
  | 'expired'
  | 'available_to_connect'
  | 'route_shell_exists'
  | 'missing_env'
  | 'missing_routes'
  | 'planned'
  | 'error'
  | 'disabled';

export type IntegrationPathConfig = {
  connectPath?: string;
  callbackPath?: string;
  statusPath?: string;
  syncPath?: string;
  disconnectPath?: string;
  webhookPath?: string;
  settingsPath?: string;
};

export type IntegrationRegistryItem = {
  provider: IntegrationProvider;
  group:
    | 'core_brokerage_systems'
    | 'communication_calendar'
    | 'accounting_finance'
    | 'project_task_execution'
    | 'automation_webhooks'
    | 'marketing_reviews'
    | 'email_delivery'
    | 'messaging';
  displayName: string;
  shortName: string;
  logoKey: string;
  description: string;
  purpose: string;
  writebackDefault: 'disabled' | 'approval_gated' | 'enabled';
  implementationStatus: IntegrationImplementationStatus;
  requiredEnvVars: string[];
  paths: IntegrationPathConfig;
  warnings?: string[];
};

export const INTEGRATION_REGISTRY: IntegrationRegistryItem[] = [
  {
    provider: 'rechat',
    group: 'core_brokerage_systems',
    displayName: 'Rechat Partner Integration',
    shortName: 'Rechat',
    logoKey: 'rechat',
    description: 'Connects agent workspaces directly to the shapework ledger to automatically verify client communications, MLS listing launches, and escrow deposits.',
    purpose: 'Verify CRM data, client communications, and deals',
    writebackDefault: 'disabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['RECHAT_CLIENT_ID', 'RECHAT_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/rechat/oauth/start',
      statusPath: '/api/integrations/rechat/status',
      syncPath: '/api/integrations/rechat/sync',
      disconnectPath: '/api/integrations/rechat/disconnect',
      webhookPath: '/api/integrations/rechat/webhook'
    }
  },
  {
    provider: 'dotloop',
    group: 'core_brokerage_systems',
    displayName: 'Dotloop via API Nation',
    shortName: 'Dotloop',
    logoKey: 'dotloop',
    description: 'Receives loop, participant, contact, and document activity through API Nation webhooks to feed deal compliance and escrow monitors.',
    purpose: 'Sync loops, documents, and participant checklists',
    writebackDefault: 'disabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['APINATION_DOTLOOP_WEBHOOK_SECRET'],
    paths: {
      connectPath: '/api/integrations/apination/dotloop/connect',
      callbackPath: '/api/integrations/apination/dotloop/callback',
      statusPath: '/api/integrations/apination/dotloop/status',
      syncPath: '/api/integrations/apination/dotloop/sync',
      disconnectPath: '/api/integrations/apination/dotloop/webhook/revoke',
      webhookPath: '/api/integrations/apination/dotloop/webhook'
    }
  },
  {
    provider: 'google_drive',
    group: 'core_brokerage_systems',
    displayName: 'Google Drive',
    shortName: 'Google Drive',
    logoKey: 'google-drive',
    description: 'Synchronizes uploaded escrow documents to back-office storage.',
    purpose: 'Automated deal document compliance folder sync',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/google/connect',
      statusPath: '/api/integrations/google/status'
    }
  },
  {
    provider: 'google_workspace',
    group: 'communication_calendar',
    displayName: 'Google Workspace',
    shortName: 'Google Workspace',
    logoKey: 'google-workspace',
    description: 'Integrates Gmail and Google Calendar to extract transaction-relevant communications and scheduling signals.',
    purpose: 'Calendar sync, email campaigns, and client tracking',
    writebackDefault: 'approval_gated',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/google/connect',
      callbackPath: '/api/integrations/google/callback',
      statusPath: '/api/integrations/google/status',
      syncPath: '/api/integrations/google/sync',
      disconnectPath: '/api/integrations/google/disconnect'
    }
  },
  {
    provider: 'gmail',
    group: 'communication_calendar',
    displayName: 'Gmail',
    shortName: 'Gmail',
    logoKey: 'gmail',
    description: 'Syncs incoming transactional messages to extract client intent, files, and escrow signals.',
    purpose: 'Cooperative inbox sync and client intent classification',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/google/connect',
      statusPath: '/api/integrations/google/status'
    }
  },
  {
    provider: 'google_calendar',
    group: 'communication_calendar',
    displayName: 'Google Calendar',
    shortName: 'Google Calendar',
    logoKey: 'google-calendar',
    description: 'Monitors calendar events to flag scheduling conflicts and auto-generate preparation checks.',
    purpose: 'Calendar conflict warning and scheduled event monitors',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/google/connect',
      statusPath: '/api/integrations/google/status'
    }
  },
  {
    provider: 'microsoft_365',
    group: 'communication_calendar',
    displayName: 'Microsoft 365',
    shortName: 'Microsoft 365',
    logoKey: 'microsoft-365',
    description: 'Integrates Outlook and Microsoft Teams to synchronize communications and transaction status notifications.',
    purpose: 'Outlook sync, team alert channels, and client tracking',
    writebackDefault: 'approval_gated',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/microsoft/connect',
      callbackPath: '/api/integrations/microsoft/callback',
      statusPath: '/api/integrations/microsoft/status',
      syncPath: '/api/integrations/microsoft/sync',
      disconnectPath: '/api/integrations/microsoft/disconnect',
      webhookPath: '/api/integrations/microsoft/webhooks'
    }
  },
  {
    provider: 'outlook_mail',
    group: 'communication_calendar',
    displayName: 'Outlook Mail',
    shortName: 'Outlook Mail',
    logoKey: 'outlook',
    description: 'Syncs Outlook mailboxes to capture transactional updates and documents.',
    purpose: 'Cooperative inbox sync and client intent classification',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/microsoft/connect',
      statusPath: '/api/integrations/microsoft/status'
    }
  },
  {
    provider: 'outlook_calendar',
    group: 'communication_calendar',
    displayName: 'Outlook Calendar',
    shortName: 'Outlook Calendar',
    logoKey: 'outlook',
    description: 'Monitors appointments, walkthroughs, and key dates in Outlook.',
    purpose: 'Calendar conflict warning and scheduled event monitors',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/microsoft/connect',
      statusPath: '/api/integrations/microsoft/status'
    }
  },
  {
    provider: 'microsoft_teams',
    group: 'communication_calendar',
    displayName: 'Microsoft Teams',
    shortName: 'Microsoft Teams',
    logoKey: 'microsoft-teams',
    description: 'Surfaces owner mentions, stuck team threads, and internal follow-up signals.',
    purpose: 'Sends automated updates and warning alerts to channels',
    writebackDefault: 'disabled',
    implementationStatus: 'route_shell_exists',
    requiredEnvVars: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/microsoft/connect',
      statusPath: '/api/integrations/microsoft/status'
    }
  },
  {
    provider: 'slack',
    group: 'communication_calendar',
    displayName: 'Slack Channel Sync',
    shortName: 'Slack',
    logoKey: 'slack',
    description: 'Post agent notifications, compliance alerts, and priority briefs to internal channels.',
    purpose: 'Post automated notifications, alerts, and priority briefs',
    writebackDefault: 'enabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/slack/connect',
      callbackPath: '/api/integrations/slack/callback',
      statusPath: '/api/integrations/slack/status',
      syncPath: '/api/integrations/slack/sync',
      disconnectPath: '/api/integrations/slack/disconnect',
      webhookPath: '/api/integrations/slack/webhook'
    }
  },
  {
    provider: 'quickbooks_online',
    group: 'accounting_finance',
    displayName: 'QuickBooks Online',
    shortName: 'QuickBooks Online',
    logoKey: 'quickbooks',
    description: 'Surfaces payment, invoice, and commission-readiness signals for owner review.',
    purpose: 'Financial signal synchronization and commission bookkeeping',
    writebackDefault: 'disabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/quickbooks/connect',
      callbackPath: '/api/integrations/quickbooks/callback',
      statusPath: '/api/integrations/quickbooks/status',
      syncPath: '/api/integrations/quickbooks/sync',
      disconnectPath: '/api/integrations/quickbooks/disconnect'
    }
  },
  {
    provider: 'plaid',
    group: 'accounting_finance',
    displayName: 'Plaid Bank Feeds',
    shortName: 'Plaid',
    logoKey: 'plaid',
    description: 'Verifies bank and deposit activity when direct cash-movement signals are needed.',
    purpose: 'Verify earnest money deposits and bank ledger matches',
    writebackDefault: 'disabled',
    implementationStatus: 'missing_routes',
    requiredEnvVars: ['PLAID_CLIENT_ID', 'PLAID_SECRET'],
    paths: {
      connectPath: '/api/integrations/plaid/link-token',
      callbackPath: '/api/integrations/plaid/exchange-public-token',
      statusPath: '/api/integrations/plaid/status',
      syncPath: '/api/integrations/plaid/sync',
      disconnectPath: '/api/integrations/plaid/disconnect',
      webhookPath: '/api/integrations/plaid/webhook'
    }
  },
  {
    provider: 'basecamp',
    group: 'project_task_execution',
    displayName: 'Basecamp',
    shortName: 'Basecamp',
    logoKey: 'basecamp',
    description: 'Watches project tasks and team follow-ups so work does not disappear in threads.',
    purpose: 'Checklist sync, project discussions, and task verification',
    writebackDefault: 'disabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['BASECAMP_CLIENT_ID', 'BASECAMP_CLIENT_SECRET'],
    paths: {
      connectPath: '/api/integrations/basecamp/connect',
      callbackPath: '/api/integrations/basecamp/callback',
      statusPath: '/api/integrations/basecamp/status',
      syncPath: '/api/integrations/basecamp/sync',
      disconnectPath: '/api/integrations/basecamp/disconnect'
    }
  },
  {
    provider: 'zapier',
    group: 'automation_webhooks',
    displayName: 'Zapier Webhooks',
    shortName: 'Zapier',
    logoKey: 'zapier',
    description: 'Dispatches custom event triggers and triggers actions from Zapier workflows.',
    purpose: 'Dispatches custom events and triggers workflows',
    writebackDefault: 'disabled',
    implementationStatus: 'missing_routes',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/zapier/connect',
      statusPath: '/api/integrations/zapier/status',
      disconnectPath: '/api/integrations/zapier/disconnect',
      webhookPath: '/api/webhooks/zapier/:workspaceId/:secret'
    }
  },
  {
    provider: 'api_nation',
    group: 'automation_webhooks',
    displayName: 'API Nation Hub',
    shortName: 'API Nation',
    logoKey: 'api-nation',
    description: 'Enables custom external connections to other tools in the real estate stack.',
    purpose: 'General third-party synchronization triggers',
    writebackDefault: 'disabled',
    implementationStatus: 'missing_routes',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/api-nation/connect',
      statusPath: '/api/integrations/api-nation/status',
      syncPath: '/api/integrations/api-nation/sync',
      disconnectPath: '/api/integrations/api-nation/disconnect'
    }
  },
  {
    provider: 'google_business_profile',
    group: 'marketing_reviews',
    displayName: 'Google Business Profile',
    shortName: 'Google Business',
    logoKey: 'google-business-profile',
    description: 'Pulls reviews, reviews metrics, and updates profile data to power growth reports.',
    purpose: 'Pulls reviews and ratings to power growth metrics',
    writebackDefault: 'disabled',
    implementationStatus: 'planned',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/google-business-profile/connect',
      callbackPath: '/api/integrations/google-business-profile/callback',
      statusPath: '/api/integrations/google-business-profile/status',
      syncPath: '/api/integrations/google-business-profile/sync',
      disconnectPath: '/api/integrations/google-business-profile/disconnect'
    }
  },
  {
    provider: 'resend',
    group: 'email_delivery',
    displayName: 'Resend Email Delivery',
    shortName: 'Resend',
    logoKey: 'resend',
    description: 'Handles verified sending domains and email outreach.',
    purpose: 'Handles verified sending domains and email outreach',
    writebackDefault: 'enabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: ['RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET'],
    paths: {
      connectPath: '/api/integrations/resend/configure-domain',
      statusPath: '/api/integrations/resend/status',
      disconnectPath: '/api/integrations/resend/disconnect',
      webhookPath: '/api/webhooks/resend'
    }
  },
  {
    provider: 'smtp_email',
    group: 'email_delivery',
    displayName: 'SMTP / Custom Email Server',
    shortName: 'SMTP Email',
    logoKey: 'smtp-email',
    description: 'Connects a custom sending domain or mail server for approved outbound messages.',
    purpose: 'Alternative SMTP outbox notification routing',
    writebackDefault: 'enabled',
    implementationStatus: 'available_to_connect',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/email/configure',
      statusPath: '/api/integrations/email/status',
      disconnectPath: '/api/integrations/email/disconnect'
    }
  },
  {
    provider: 'sms_provider',
    group: 'messaging',
    displayName: 'SMS / Text Gateway',
    shortName: 'SMS Provider',
    logoKey: 'sms',
    description: 'Sends approved text alerts and reminders through a configured SMS provider.',
    purpose: 'Dispatches text updates and notifications',
    writebackDefault: 'enabled',
    implementationStatus: 'missing_routes',
    requiredEnvVars: [],
    paths: {
      connectPath: '/api/integrations/sms/configure',
      statusPath: '/api/integrations/sms/status',
      disconnectPath: '/api/integrations/sms/disconnect',
      webhookPath: '/api/integrations/sms/webhook'
    }
  }
];
