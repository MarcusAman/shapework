/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mission {
  id: string;
  name: string;
  purpose: string;
  schedule: string;
  dataSources: string[];
  lastRun: string;
  findings: string;
  actionsPrepared: number;
  approvalsNeeded: number;
}

export const initialMissions: Mission[] = [
  {
    id: 'm_1',
    name: 'Daily Operations Briefing Sweep',
    purpose: 'Aggregates overnight activities, risk updates, and coordination delays across all escrows.',
    schedule: 'Daily, 7:00 AM EST',
    dataSources: ['Rechat Database', 'Gmail API logs', 'Dotloop Loops'],
    lastRun: 'Today, 7:00 AM',
    findings: 'Processed 12 active transactions. Found 3 items needing attention (1 foundation Contingency exception, 2 compliance checklist items outstanding). Prepared 1 morning brief draft.',
    actionsPrepared: 3,
    approvalsNeeded: 1
  },
  {
    id: 'm_2',
    name: 'Closing Risk Sweep',
    purpose: 'Audits escrow files closing within the next 14 days for outstanding documents or lender delays.',
    schedule: 'Every 6 hours',
    dataSources: ['Rechat MLS', 'Gmail API', 'Google Drive'],
    lastRun: '2 hours ago',
    findings: '3 deals audited in 14-day window. Identified 1 financing approval overdue on 908 Colonial Ave. Revenue at stake: $16,800. Suggested contact to Buyer Agent.',
    actionsPrepared: 1,
    approvalsNeeded: 1
  },
  {
    id: 'm_3',
    name: 'Listing Launch Sweep',
    purpose: 'Audits properties launching within 7 days for missing marketing, disclosure, or compliance files.',
    schedule: 'Daily, 8:00 AM EST',
    dataSources: ['Rechat Directory', 'Dotloop PDF folders'],
    lastRun: 'Today, 8:00 AM',
    findings: '4 pending listings inspected. Identified missing seller disclosures on Baker Street. Roster agent Todd Howard notified via secure link proposal.',
    actionsPrepared: 2,
    approvalsNeeded: 0
  },
  {
    id: 'm_4',
    name: 'Agent Follow-Up Sweep',
    purpose: 'Scans deal files to identify agents with overdue task lists or unresolved lender comments.',
    schedule: 'Daily, 9:00 AM EST',
    dataSources: ['Gmail threads', 'shapework Checklist logs'],
    lastRun: 'Today, 9:00 AM',
    findings: 'Roster agents checked. Todd Howard (2 overdue tasks, disclosures missing), Alex Carter (1 checklist item outstanding). Actions generated to send action links.',
    actionsPrepared: 2,
    approvalsNeeded: 2
  },
  {
    id: 'm_5',
    name: 'Integration Health Sweep',
    purpose: 'Validates API credentials, webhooks, and rate limits for connected transaction platforms.',
    schedule: 'Every hour',
    dataSources: ['OAuth credentials', 'Webhook heartbeats'],
    lastRun: '15 minutes ago',
    findings: 'All connections verified. 4 REST endpoints operational. 1 minor token rotation warning logged for Dotloop API.',
    actionsPrepared: 0,
    approvalsNeeded: 0
  },
  {
    id: 'm_6',
    name: 'Compliance Exception Sweep',
    purpose: 'Inspects folders for missing seller disclosures, unreviewed checklists, or unsigned documents.',
    schedule: 'Every 12 hours',
    dataSources: ['Dotloop loops', 'Google Drive storage'],
    lastRun: '6 hours ago',
    findings: 'Scanned active PDF loops. Found 1 compliance checklist pending checkoff on 102 Pine Street. Disclosures complete but awaiting coordinator signature confirmation.',
    actionsPrepared: 1,
    approvalsNeeded: 1
  }
];
