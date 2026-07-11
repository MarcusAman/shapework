/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Bridge file to re-export the new modular types and demo data
import {
  demoOrganization,
  demoProfiles,
  demoAgents,
  demoTransactions,
  demoListings,
  demoAIActionProposals,
  demoAuditEvents,
  demoIntegrations,
  demoCapacityMetrics,
  demoRoiStats,
  demoEmailAccounts,
  demoEmailMessages,
  demoAutomationRules,
  demoAutomationPolicy
} from '../data/demoSeedData';

import {
  Organization,
  Profile,
  Agent,
  Transaction,
  Listing,
  WorkflowTemplate,
  Task,
  Communication,
  AIActionProposal,
  AuditEvent,
  IntegrationConnection,
  ChatMessage,
  CapacityMetric,
  CommandPlan,
  EmailAccount,
  EmailMessage,
  AutomationRule,
  AutomationPolicy
} from '../types/shapework';

// Re-export types so both server and old views can import them
export type {
  Organization,
  Profile,
  Agent,
  Transaction,
  Listing,
  WorkflowTemplate,
  Task,
  Communication,
  AIActionProposal,
  AuditEvent,
  IntegrationConnection,
  ChatMessage,
  CapacityMetric,
  CommandPlan,
  EmailAccount,
  EmailMessage,
  AutomationRule,
  AutomationPolicy
};

// Re-export demo instances renamed as seeds for server.ts compatibility
export const seedOrganization = demoOrganization;
export const seedProfiles = demoProfiles;
export const seedAgents = demoAgents;
export const seedTransactions = demoTransactions;
export const seedListings = demoListings;
export const seedActionProposals = demoAIActionProposals;
export const seedAuditEvents = demoAuditEvents;
export const seedIntegrations = demoIntegrations;
export const seedEmailAccounts = demoEmailAccounts;
export const seedEmailMessages = demoEmailMessages;
export const seedAutomationRules = demoAutomationRules;
export const seedAutomationPolicy = demoAutomationPolicy;

export const seedSettings = {
  id: 'set_hp',
  organization_id: 'org_hp',
  labor_hourly_cost: 45,
  minutes_saved_per_task: 20,
  auto_flag_days_inactive: 5
};

export const seedParticipants = [
  { id: 'tp_1', transaction_id: 'tx_1', name: 'Arthur Pendragon', role: 'buyer' as const, email: 'arthur@royalmail.com', phone: '512-555-1111', company: 'Pendragon Holdings' },
  { id: 'tp_2', transaction_id: 'tx_1', name: 'Alice Walker', role: 'lender' as const, email: 'a.walker@apexhomeloans.com', phone: '512-555-2222', company: 'Apex Home Loans' },
  { id: 'tp_3', transaction_id: 'tx_1', name: 'Robert Vance', role: 'escrow_officer' as const, email: 'robert@vancelaw.com', phone: '512-555-3333', company: 'Vance Law & Title' },
];

export const seedMilestones = [
  { id: 'm_1', transaction_id: 'tx_1', name: 'Earnest Money Deposited', due_date: '2026-06-15', status: 'completed' as const, completed_at: '2026-06-14', owner_role: 'Agent' },
  { id: 'm_2', transaction_id: 'tx_1', name: 'Option Period Expiry', due_date: '2026-06-20', status: 'completed' as const, completed_at: '2026-06-19', owner_role: 'Agent' },
  { id: 'm_3', transaction_id: 'tx_1', name: 'Financing Contingency Expiry', due_date: '2026-07-02', status: 'at_risk' as const, owner_role: 'Lender' },
];

export const seedTasks: Task[] = [
  { id: 't_1', transaction_id: 'tx_1', title: 'Collect outstanding tax transcripts', description: 'Underwriter needs signed IRS forms to clear close.', assigned_to_role: 'Transaction Coordinator', assigned_to_name: 'Diane Ross', due_date: '2026-06-28', status: 'pending', is_automated: false, time_saved_minutes: 0 },
  { id: 't_2', transaction_id: 'tx_3', title: 'Coordinate foundation engineer site visit', description: 'Inspection flagged critical slab cracking.', assigned_to_role: 'Transaction Coordinator', assigned_to_name: 'Emma Watson', due_date: '2026-06-28', status: 'pending', is_automated: false, time_saved_minutes: 0 }
];

export const seedWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'w_1',
    name: 'New Listing Launch',
    description: 'Automates sequence from listing agreement sign-off to active MLS syndication.',
    trigger_event: 'Signed Listing Contract Sourced',
    category: 'listing',
    steps: [
      { id: 'ws_1', step_name: 'Verify Disclosures Signature', assigned_role: 'Transaction Coordinator', due_days_offset: 1, requires_approval: false },
      { id: 'ws_2', step_name: 'Order Professional Photography', assigned_role: 'Listing Coordinator', due_days_offset: 2, requires_approval: true },
      { id: 'ws_3', step_name: 'Enter MLS Draft Record', assigned_role: 'Listing Coordinator', due_days_offset: 3, requires_approval: false },
    ]
  },
  {
    id: 'w_2',
    name: 'Contract-to-Close',
    description: 'Drives title, escrow, and milestone validation from executed sales contract.',
    trigger_event: 'Executed Purchase Agreement Sourced',
    category: 'contract',
    steps: [
      { id: 'ws_4', step_name: 'Validate Earnest Money Receipt', assigned_role: 'Transaction Coordinator', due_days_offset: 2, requires_approval: false },
      { id: 'ws_5', step_name: 'Confirm Appraisal Order', assigned_role: 'Transaction Coordinator', due_days_offset: 7, requires_approval: true },
      { id: 'ws_6', step_name: 'Verify Title Commitment Deliverable', assigned_role: 'Operations Manager', due_days_offset: 14, requires_approval: false }
    ]
  }
];

export const seedNormalizedEvents = [
  { id: 'ev_1', timestamp: '2026-06-27T08:15:00Z', source_system: 'gmail', event_type: 'email_received', description: 'Email from Alice Walker: "Apologies, we are waiting on underwriter feedback on the transcripts."', transaction_id: 'tx_1', property_address: '102 Pine Street' },
  { id: 'ev_2', timestamp: '2026-06-27T07:45:00Z', source_system: 'docusign', event_type: 'document_completed', description: 'Seller Disclosures completed for 1504 Windsor Road', transaction_id: 'tx_2', property_address: '1504 Windsor Road' },
  { id: 'ev_3', timestamp: '2026-06-27T09:30:00Z', source_system: 'sms', event_type: 'sms_received', description: 'SMS from Alex Carter: Kevin Frame photography delayed due to weather', transaction_id: 'tx_1', property_address: '109 Woodlawn Boulevard' }
];

// DYNAMIC MAPPING FOR WILMINGTON NEST REALTY ADDRESSES
const addressMap: Record<string, string> = {
  '102 pine street, austin tx 78701': '152 Edgewater Lane, Wilmington, NC 28403',
  '102 pine street, austin tx 78704': '152 Edgewater Lane, Wilmington, NC 28403',
  '102 pine street': '152 Edgewater Lane, Wilmington, NC 28403',
  '588 oak avenue, west lake hills tx 78746': '1826 Montage Lane, Wilmington, NC 28403',
  '588 oak avenue': '1826 Montage Lane, Wilmington, NC 28403',
  '742 evergreen terrace, austin tx 78704': '521 Airlie Road Lot D Riverrun Plan, Wilmington, NC 28403',
  '742 evergreen terrace': '521 Airlie Road Lot D Riverrun Plan, Wilmington, NC 28403',
  'evergreen terrace': '521 Airlie Road Lot D Riverrun Plan, Wilmington, NC 28403',
  '305 hillside drive, austin tx 78746': '521 Airlie Road Lot D Longleaf Plan, Wilmington, NC 28403',
  '305 hillside drive': '521 Airlie Road Lot D Longleaf Plan, Wilmington, NC 28403',
  '1418 waverly street, austin tx 78703': '1805 Trey Court, Wilmington, NC 28403',
  '1418 waverly street': '1805 Trey Court, Wilmington, NC 28403',
  '908 colonial avenue, austin tx 78756': '521 4 Airlie Road, Wilmington, NC 28403',
  '908 colonial avenue, austin tx 78704': '521 4 Airlie Road, Wilmington, NC 28403',
  '908 colonial ave, austin tx 78704': '521 4 Airlie Road, Wilmington, NC 28403',
  '908 colonial avenue': '521 4 Airlie Road, Wilmington, NC 28403',
  '1204 lakeview court, west lake hills tx 78746': '521 Airlie Road, Wilmington, NC 28403',
  '1204 lakeview court': '521 Airlie Road, Wilmington, NC 28403',
  '221 b baker street, austin tx 78704': '132 James Edward Court, Wilmington, NC 28403',
  '221 b baker street': '132 James Edward Court, Wilmington, NC 28403',
  'baker street': '132 James Edward Court, Wilmington, NC 28403',
  '805 west avenue, austin tx 78701': '521 Airlie Road Lot D Park Shore Plan, Wilmington, NC 28403',
  '805 west avenue': '521 Airlie Road Lot D Park Shore Plan, Wilmington, NC 28403',
  '445 ridgewood hill, west lake hills tx 78746': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '445 ridgewood hill': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '445 ridgewood': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '109 woodlawn boulevard, austin tx 78703': '521 Airlie Road Lot D Pine Ridge Plan, Wilmington, NC 28403',
  '109 woodlawn boulevard': '521 Airlie Road Lot D Pine Ridge Plan, Wilmington, NC 28403',
  '109 woodlawn': '521 Airlie Road Lot D Pine Ridge Plan, Wilmington, NC 28403',
  '1504 windsor road, austin tx 78703': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '1504 windsor road': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '1504 windsor': '521 Airlie Road Lot D Valand Plan, Wilmington, NC 28403',
  '401 e 8th street, austin tx 78701': '521 Airlie Road Lot D Park Shore Plan, Wilmington, NC 28403',
  '401 e 8th street': '521 Airlie Road Lot D Park Shore Plan, Wilmington, NC 28403',
  '3206 highland avenue, austin tx 78703': '521 Airlie Road Lot D Santiago Plan, Wilmington, NC 28403',
  '3206 highland avenue': '521 Airlie Road Lot D Santiago Plan, Wilmington, NC 28403',
  '3206 highland': '521 Airlie Road Lot D Santiago Plan, Wilmington, NC 28403'
};

function mapText(text: string): string {
  if (!text) return text;
  let result = text;
  const lowerText = text.toLowerCase();
  for (const [oldAddr, newAddr] of Object.entries(addressMap)) {
    if (lowerText.includes(oldAddr)) {
      const escaped = oldAddr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, newAddr);
    }
  }
  return result;
}

function mapObjectProperties(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = mapText(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((item: any) => {
        if (typeof item === 'string') {
          return mapText(item);
        } else if (item && typeof item === 'object') {
          mapObjectProperties(item);
        }
        return item;
      });
    } else if (obj[key] && typeof obj[key] === 'object') {
      mapObjectProperties(obj[key]);
    }
  }
}

// Mutate seed arrays
seedParticipants.forEach(mapObjectProperties);
seedMilestones.forEach(mapObjectProperties);
seedTasks.forEach(mapObjectProperties);
seedNormalizedEvents.forEach(mapObjectProperties);
