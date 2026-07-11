import { IntegrationConnection } from '../headless/opsBlueprintTypes';

export const INITIAL_INTEGRATION_CONNECTIONS: IntegrationConnection[] = [
  {
    id: 'int_rechat',
    organizationId: 'nest-realty',
    provider: 'Rechat',
    status: 'connected',
    description: 'Syncs agent directories, active listings, and client contacts.',
    priority: 'high',
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    syncHealth: 'healthy',
    supportedActions: ['fetch_agents', 'fetch_listings', 'create_marketing_task'],
    notes: 'Access token verified. Webhook triggers active.'
  },
  {
    id: 'int_google_drive',
    organizationId: 'nest-realty',
    provider: 'Google Drive',
    status: 'connected',
    description: 'Hosts shared SOP manuals, listing folders, and compliance documents.',
    priority: 'high',
    connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    syncHealth: 'healthy',
    supportedActions: ['upload_files', 'link_sop_folder'],
    notes: 'Google service account auth authenticated.'
  },
  {
    id: 'int_google_calendar',
    organizationId: 'nest-realty',
    provider: 'Google Calendar',
    status: 'connected',
    description: 'Manages conference room bookings, training sessions, and critical deadlines.',
    priority: 'medium',
    connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    syncHealth: 'healthy',
    supportedActions: ['create_event', 'check_room_availability'],
    notes: 'Resource calendars Wilmington-1 and Wilmington-2 mapped.'
  },
  {
    id: 'int_gmail',
    organizationId: 'nest-realty',
    provider: 'Gmail',
    status: 'connected',
    description: 'Shared inbox operations intake integration (ops@nestrealty.com).',
    priority: 'high',
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    syncHealth: 'healthy',
    supportedActions: ['poll_emails', 'send_email_confirmation'],
    notes: 'Shared credentials setup with secure IMAP OAuth.'
  },
  {
    id: 'int_basecamp',
    organizationId: 'nest-realty',
    provider: 'Basecamp',
    status: 'stubbed',
    description: 'Project planning, coordination checklists, and vendor workflows.',
    priority: 'medium',
    notes: 'Oauth credentials pending approval. Run stubbed simulator.'
  },
  {
    id: 'int_quickbooks',
    organizationId: 'nest-realty',
    provider: 'QuickBooks',
    status: 'connected',
    description: 'Read-only financial audit logs, invoice ledger, and accounts payables status.',
    priority: 'high',
    connectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    syncHealth: 'warning',
    supportedActions: ['list_expenses', 'fetch_vendor_balance'],
    notes: 'Sync completed. Warning: sandbox certificate renewal due in 7 days.'
  },
  {
    id: 'int_twilio',
    organizationId: 'nest-realty',
    provider: 'Twilio',
    status: 'planned',
    description: 'Automated SMS intake, critical escalation texts, and status alerts.',
    priority: 'medium',
    supportedActions: ['send_sms', 'receive_sms_intake'],
    notes: 'Awaiting phone number provisioning approval.'
  },
  {
    id: 'int_slack',
    organizationId: 'nest-realty',
    provider: 'Slack',
    status: 'planned',
    description: 'Connect Slack if your team uses it so approved channels can send requests into Nest Ops.',
    priority: 'medium',
    supportedActions: ['ingest_channel_messages', 'post_alerts'],
    notes: 'Slack app credentials pending workspace admin approval.'
  },
  {
    id: 'int_teams',
    organizationId: 'nest-realty',
    provider: 'Microsoft Teams',
    status: 'planned',
    description: 'Connect Teams if your team uses it so approved messages and channels can create Nest Ops requests.',
    priority: 'medium',
    supportedActions: ['ingest_team_messages', 'post_teams_alerts'],
    notes: 'Microsoft Azure tenant authorization required.'
  },
  {
    id: 'int_transactions',
    organizationId: 'nest-realty',
    provider: 'Dotloop/SkySlope/Brokermint',
    status: 'planned',
    description: 'Future connection for Dotloop, SkySlope, Brokermint, or other transaction/compliance platforms.',
    priority: 'high',
    supportedActions: ['fetch_transaction_files', 'sync_checklists'],
    notes: 'Awaiting webhook configuration and API key setup.'
  },
  {
    id: 'int_marketing_systems',
    organizationId: 'nest-realty',
    provider: 'Marketing Systems',
    status: 'planned',
    description: 'Future connection for listing launch assets, social requests, flyers, photography, and campaign materials.',
    priority: 'medium',
    supportedActions: ['fetch_marketing_briefs', 'publish_listings'],
    notes: 'Future API interface placeholder.'
  }
];
