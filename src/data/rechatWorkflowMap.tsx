/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RechatWorkflowMapping {
  guardName: string;
  rechatTopic: string;
  monitoredFields: string[];
  proposedActions: string[];
  logicDescription: string;
}

export const rechatWorkflowMappings: RechatWorkflowMapping[] = [
  {
    guardName: 'Request Desk',
    rechatTopic: 'Contacts & Tasks',
    monitoredFields: ['tasks.status', 'contacts.owner', 'task_type'],
    proposedActions: [
      'Create coordinated checklist task',
      'Reassign overdue agent task to operations staff',
      'Link CRM contacts to active listing files'
    ],
    logicDescription: 'Monitores CRM tasks. When an agent creates a task requiring back-office coordination, it automatically routes to the Request Desk queue for coordinator triage.'
  },
  {
    guardName: 'Owner Shield',
    rechatTopic: 'Deals & Showings',
    monitoredFields: ['brand', 'roles.agent', 'showing.timestamp'],
    proposedActions: [
      'Create routed agent-alert task',
      'Log owner escalation avoided in shapework audit trail',
      'Associate showing history to transaction'
    ],
    logicDescription: 'Protects principal broker ownership from client-relationship bypass. Flags showings or deal updates done without the designated listing agent, protecting commissions and client alignment.'
  },
  {
    guardName: 'Deal Intake Guard',
    rechatTopic: 'Deals',
    monitoredFields: ['deal_type', 'stage', 'roles.buyer', 'context.intake_form'],
    proposedActions: [
      'Create missing intake form task',
      'Associate task to Rechat deal',
      'Flag coordinator assignment missing exception'
    ],
    logicDescription: 'Runs automatically when a deal changes to "under_contract". Performs a structured intake scan to verify that files, coordinators, and required intake sheets are completed.'
  },
  {
    guardName: 'Closing Compliance Guard',
    rechatTopic: 'Deals & Tasks',
    monitoredFields: ['closing_date', 'context.checklist', 'calendar.events'],
    proposedActions: [
      'Create missing critical document checklist task',
      'Create pre-closing title escrow wiring validation task'
    ],
    logicDescription: 'Triggered when the expected closing date is within 15 days. Scans the transaction attachments to ensure executed disclosure forms and final purchase contracts are present.'
  },
  {
    guardName: 'Review Request Trigger',
    rechatTopic: 'Deals & Contacts',
    monitoredFields: ['stage', 'status', 'roles.buyer.email'],
    proposedActions: [
      'Draft client review request email inside shapework',
      'Awaiting manual override approval before sending request'
    ],
    logicDescription: 'Fires when a Rechat deal is officially updated to "closed". Automatically drafts a review solicitation request email using the masked client contact, keeping writes gated.'
  }
];
