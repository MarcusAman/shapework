/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns read/write permissions for a specific connector ID.
 */
export function getConnectorPermissions(connectorId: string): {
  read: string[];
  write: string[];
} {
  const mappings: Record<string, { read: string[]; write: string[] }> = {
    i_gmail: {
      read: ['Read mail threads', 'Ingest attachments', 'Query contacts'],
      write: ['Create email drafts', 'Send system warnings']
    },
    i_outlook: {
      read: ['Read messages', 'Query directories'],
      write: ['Create drafts']
    },
    i_gcal: {
      read: ['Read calendar events', 'Query meeting rooms'],
      write: ['Create calendar events', 'Reschedule closing slot']
    },
    i_gdrive: {
      read: ['Read files', 'List folders'],
      write: ['Create files', 'Upload disclosures']
    },
    i_rechat: {
      read: ['Read deals', 'Update contacts', 'Sync tasks'],
      write: ['Update deal status', 'Write audit trails']
    },
    i_docusign: {
      read: ['Read envelopes', 'Listen webhooks'],
      write: ['Create envelopes', 'Send signature requests']
    },
    i_webhook: {
      read: ['Ingest webhook streams'],
      write: ['Post system signals']
    }
  };

  return mappings[connectorId] || {
    read: ['Query status indices'],
    write: []
  };
}
