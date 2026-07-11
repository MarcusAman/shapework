/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntegrationConnection } from '../types/shapework';

export const initialIntegrations: IntegrationConnection[] = [
  { id: 'i_gmail', name: 'Gmail Workspace', icon: 'gmail', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read mail', 'Draft mail', 'Send mail'], records_synchronized: 1422, errors_count: 0, purpose: 'Sync client & coordinator emails', data_categories: ['Emails', 'Attachments'] },
  { id: 'i_outlook', name: 'Outlook Workspace', icon: 'outlook', connected: false, last_sync: 'Never', permissions_granted: [], records_synchronized: 0, errors_count: 0, purpose: 'Sync alternative brokerage emails', data_categories: ['Emails'] },
  { id: 'i_slack', name: 'Slack Channel Sync', icon: 'slack', connected: false, last_sync: 'Never', permissions_granted: [], records_synchronized: 0, errors_count: 0, purpose: 'Post automated notifications, alerts, and priority briefs', data_categories: ['Channel messages'] },
  { id: 'i_rechat', name: 'Rechat Platform', icon: 'rechat', connected: true, last_sync: '2026-06-27T15:48:00Z', permissions_granted: ['Read deals', 'Update contacts', 'Sync tasks'], records_synchronized: 522, errors_count: 1, purpose: 'Primary agent CRM & task system', data_categories: ['Transactions', 'Listings', 'Tasks'], recent_errors: ['401 Unauthorized token refresh attempt on Agent Charles webhook'] },
  { id: 'i_docusign', name: 'DocuSign Integration', icon: 'docusign', connected: true, last_sync: '2026-06-27T15:40:00Z', permissions_granted: ['Read envelopes', 'Listen webhooks'], records_synchronized: 341, errors_count: 0, purpose: 'Track document executions & download completed PDF contracts', data_categories: ['Documents', 'Signatures'] },
  { id: 'i_gcal', name: 'Google Calendar', icon: 'gcal', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read calendar', 'Write calendar'], records_synchronized: 110, errors_count: 0, purpose: 'Coordinate escrow inspection slots & closing room allocations', data_categories: ['Calendar events'] },
  { id: 'i_gdrive', name: 'Google Drive', icon: 'gdrive', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read drive', 'Write drive'], records_synchronized: 840, errors_count: 0, purpose: 'Archive signed brokerage disclosures & title folders', data_categories: ['Files', 'Folder structures'] },
  { id: 'i_webhook', name: 'Custom Webhooks', icon: 'webhook', connected: true, last_sync: '2026-06-27T15:30:00Z', permissions_granted: ['Post events'], records_synchronized: 88, errors_count: 0, purpose: 'Receive events from MLS boards and escrow systems', data_categories: ['Raw webhook JSON'] }
];
