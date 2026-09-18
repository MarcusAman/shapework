/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  CapacityMetric,
  EmailAccount,
  EmailMessage,
  AutomationRule,
  AutomationPolicy
} from '../types/shapework';

export const demoOrganization: Organization = {
  id: 'org_hp',
  name: 'Nest Realty',
  tagline: 'The AI Operations Layer for Brokerage Leadership'
};

export const demoProfiles: Profile[] = [
  { id: 'u_owner', name: 'Marcus Aman', email: 'marcus@nestrealty.com', role: 'owner', organization_id: 'org_hp', cellPhone: '919-555-0101', status: 'active', canReceiveEscalations: true, isBackupOwner: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_ryan', name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', role: 'owner', organization_id: 'org_hp', cellPhone: '919-555-0102', status: 'active', canReceiveEscalations: true, isBackupOwner: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_ann', name: 'Ann Gunn', email: 'ann@nestrealty.com', role: 'operations_lead', organization_id: 'org_hp', cellPhone: '919-555-0103', status: 'active', canReceiveEscalations: true, isBackupOwner: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_melissa', name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator', organization_id: 'org_hp', cellPhone: '919-555-0104', status: 'active', canReceiveEscalations: false, isBackupOwner: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_james', name: 'James Fort', email: 'james.fort@nestrealty.com', role: 'transaction_coordinator', organization_id: 'org_hp', cellPhone: '919-555-0105', status: 'active', canReceiveEscalations: false, isBackupOwner: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_lindsay', name: 'Lindsay Crecelius', email: 'lindsay@nestrealty.com', role: 'events', organization_id: 'org_hp', cellPhone: '919-555-0106', status: 'active', canReceiveEscalations: false, isBackupOwner: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_steve', name: 'Steve Schram', email: 'steve@nestrealty.com', role: 'maintenance', organization_id: 'org_hp', cellPhone: '919-555-0107', status: 'active', canReceiveEscalations: false, isBackupOwner: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' },
  { id: 'u_shapework_op', name: 'Alex Operator', email: 'alex@shapework.co', role: 'shapework_operator', organization_id: 'org_hp', cellPhone: '919-555-0108', status: 'active', canReceiveEscalations: false, isBackupOwner: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), workspaceId: 'active-brokerage' }
];

export const demoAgents: Agent[] = [
  {
    id: 'a_alex',
    name: 'Alex Carter',
    email: 'alex.c@nest-demo.local',
    phone: '512-555-0192',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    active_listings_count: 3,
    active_transactions_count: 4
  },
  {
    id: 'a_brooke',
    name: 'Brooke Shields',
    email: 'brooke.s@nest-demo.local',
    phone: '512-555-0181',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    active_listings_count: 2,
    active_transactions_count: 3
  },
  {
    id: 'a_charles',
    name: 'Charles Xavier',
    email: 'charles.x@nest-demo.local',
    phone: '512-555-0172',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    active_listings_count: 3,
    active_transactions_count: 3
  }
];

export const demoTransactions: Transaction[] = [
  {
    id: 'tx_1',
    property_address: '102 Pine Street, Austin TX 78701',
    client_name: 'Arthur Pendragon',
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'a_alex',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'financing_milestone',
    expected_closing_date: '2026-07-05',
    health_score: 45,
    risk_level: 'at_risk',
    risk_reasons: [
      'Financing contingency expires in five days',
      'Appraisal response has not been received from the lender',
      'Two lender follow-ups are currently unanswered'
    ],
    outstanding_milestones_count: 3,
    latest_update: 'Lender email received requesting tax transcripts.',
    revenue: 15400,
    waiting_on: 'Lender',
    next_action: 'Follow up with Alice Walker (Lender) on appraisal status',
    last_verified_update: '2026-06-26T14:30:00Z'
  },
  {
    id: 'tx_2',
    property_address: '588 Oak Avenue, West Lake Hills TX 78746',
    client_name: 'Guinevere Du Lac',
    buyer_or_seller: 'seller',
    responsible_agent_id: 'a_brooke',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'closing_prep',
    expected_closing_date: '2026-07-02',
    health_score: 95,
    risk_level: 'healthy',
    risk_reasons: [],
    outstanding_milestones_count: 1,
    latest_update: 'Title commitment received and cleared of exceptions.',
    revenue: 28500,
    waiting_on: 'None',
    next_action: 'Confirm closing time with buyer agent',
    last_verified_update: '2026-06-27T10:15:00Z'
  },
  {
    id: 'tx_3',
    property_address: '742 Evergreen Terrace, Austin TX 78704',
    client_name: 'Homer Simpson',
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'a_charles',
    transaction_coordinator_id: 'u_tc2',
    current_stage: 'inspection_and_repair',
    expected_closing_date: '2026-07-15',
    health_score: 35,
    risk_level: 'blocked',
    risk_reasons: [
      'Inspection report indicates significant structural crack in foundation',
      'Buyer is requesting structural engineer exception before signing amendments',
      'Seller response deadline is tomorrow noon'
    ],
    outstanding_milestones_count: 4,
    latest_update: 'Inspector report uploaded; foundation issue flagged.',
    revenue: 11200,
    waiting_on: 'Client',
    next_action: 'Coordinate foundation engineer site visit',
    last_verified_update: '2026-06-27T08:00:00Z'
  },
  {
    id: 'tx_4',
    property_address: '305 Hillside Drive, Austin TX 78746',
    client_name: 'Diana Prince',
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'a_alex',
    transaction_coordinator_id: 'u_tc2',
    current_stage: 'financing_milestone',
    expected_closing_date: '2026-07-08',
    health_score: 50,
    risk_level: 'watch',
    risk_reasons: [
      'Lender credit verification issue triggered re-evaluation',
      'Earnest money receipt not verified by title company'
    ],
    outstanding_milestones_count: 2,
    latest_update: 'Escrow officer confirmed receipt of draft funds, awaiting final stamp.',
    revenue: 32000,
    waiting_on: 'Agent',
    next_action: 'Obtain updated credit authorization form from agent',
    last_verified_update: '2026-06-26T16:00:00Z'
  },
  {
    id: 'tx_5',
    property_address: '1418 Waverly Street, Austin TX 78703',
    client_name: 'Eleanor Vance',
    buyer_or_seller: 'seller',
    responsible_agent_id: 'a_brooke',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'contract_to_close',
    expected_closing_date: '2026-07-20',
    health_score: 90,
    risk_level: 'healthy',
    risk_reasons: [],
    outstanding_milestones_count: 5,
    latest_update: 'Seller disclosures completed and delivered.',
    revenue: 41000,
    waiting_on: 'None',
    next_action: 'Await inspection report schedules',
    last_verified_update: '2026-06-25T11:20:00Z'
  },
  {
    id: 'tx_6',
    property_address: '908 Colonial Avenue, Austin TX 78756',
    client_name: 'Arthur Pendleton',
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'a_charles',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'financing_milestone',
    expected_closing_date: '2026-07-04',
    health_score: 42,
    risk_level: 'at_risk',
    risk_reasons: [
      'Financing approval overdue by 48 hours',
      'Lender unresponsive to status calls for 3 consecutive days'
    ],
    outstanding_milestones_count: 3,
    latest_update: 'Agent contacted lender directly; no response received yet.',
    revenue: 16800,
    waiting_on: 'Lender',
    next_action: 'Escalate to Managing Broker / Send formal finance extension draft',
    last_verified_update: '2026-06-27T09:00:00Z'
  },
  {
    id: 'tx_7',
    property_address: '1204 Lakeview Court, West Lake Hills TX 78746',
    client_name: 'Thomas Miller',
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'a_alex',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'closing_prep',
    expected_closing_date: '2026-06-30',
    health_score: 85,
    risk_level: 'healthy',
    risk_reasons: [],
    outstanding_milestones_count: 1,
    latest_update: 'Closing scheduled at Robert Vance office on June 30 at 2:00 PM.',
    revenue: 29000,
    waiting_on: 'None',
    next_action: 'Verify buyer wired closing funds to escrow',
    last_verified_update: '2026-06-27T11:30:00Z'
  },
  {
    id: 'tx_8',
    property_address: '221 B Baker Street, Austin TX 78704',
    client_name: 'Charles Dupont',
    buyer_or_seller: 'seller',
    responsible_agent_id: 'a_brooke',
    transaction_coordinator_id: 'u_tc2',
    current_stage: 'contract_to_close',
    expected_closing_date: '2026-07-28',
    health_score: 75,
    risk_level: 'watch',
    risk_reasons: [
      'Missing initial earnest money deposit wire confirmation',
      'Agent has not uploaded executed contract signature pages to compliance'
    ],
    outstanding_milestones_count: 6,
    latest_update: 'Contract signed. Awaiting wire confirmation from escrow officer.',
    revenue: 18000,
    waiting_on: 'Agent',
    next_action: 'Remind Brooke to upload executed agreement and get earnest wire confirmation',
    last_verified_update: '2026-06-26T10:00:00Z'
  },
  {
    id: 'tx_9',
    property_address: '805 West Avenue, Austin TX 78701',
    client_name: 'Anthony Sterling',
    buyer_or_seller: 'seller',
    responsible_agent_id: 'a_charles',
    transaction_coordinator_id: 'u_tc1',
    current_stage: 'closed',
    expected_closing_date: '2026-06-25',
    health_score: 100,
    risk_level: 'healthy',
    risk_reasons: [],
    outstanding_milestones_count: 0,
    latest_update: 'Closed & funded. Brokerage commission processed.',
    revenue: 45000,
    waiting_on: 'None',
    next_action: 'Archive file in compliance hub',
    last_verified_update: '2026-06-25T17:00:00Z'
  },
  {
    id: 'tx_10',
    property_address: '445 Ridgewood Hill, West Lake Hills TX 78746',
    client_name: 'Steve Rogers',
    buyer_or_seller: 'seller',
    responsible_agent_id: 'a_alex',
    transaction_coordinator_id: 'u_tc2',
    current_stage: 'inspection_and_repair',
    expected_closing_date: '2026-07-12',
    health_score: 55,
    risk_level: 'watch',
    risk_reasons: [
      'Buyer home inspection conducted; repair amendments drafting in progress',
      'Roof condition report requested by buyer insurance company'
    ],
    outstanding_milestones_count: 3,
    latest_update: 'Inspection response from buyer received via email.',
    revenue: 22500,
    waiting_on: 'Agent',
    next_action: 'Draft repair response and check roof age certification file',
    last_verified_update: '2026-06-27T13:00:00Z'
  }
];

export const demoListings: Listing[] = [
  {
    id: 'l_1',
    property_address: '109 Woodlawn Boulevard, Austin TX 78703',
    responsible_agent_id: 'a_alex',
    status: 'preparing',
    list_price: 875000,
    target_launch_date: '2026-07-02',
    blocking_items: ['Photography overdue by 48 hours', 'Seller disclosures not signed'],
    marketing_readiness: 'in_progress',
    compliance_status: 'pending',
    last_communication: 'Agent emailed seller requesting disclosure signature.',
    next_action: 'Follow up with Kevin Frame (Photographer) and Alex Carter (Agent)',
    owner: 'Todd Howard',
    launch_checklist: [
      { id: 'lc_1', step_name: 'Upload Listing Agreement', status: 'completed', completed_at: '2026-06-24T10:00:00Z' },
      { id: 'lc_2', step_name: 'Order Professional Photography', status: 'overdue' },
      { id: 'lc_3', step_name: 'Collect Signed Seller Disclosures', status: 'pending' },
      { id: 'lc_4', step_name: 'Enter MLS Draft Record', status: 'pending' }
    ]
  },
  {
    id: 'l_2',
    property_address: '1504 Windsor Road, Austin TX 78703',
    responsible_agent_id: 'a_brooke',
    status: 'preparing',
    list_price: 1250000,
    target_launch_date: '2026-07-06',
    blocking_items: ['Utility history statement missing'],
    marketing_readiness: 'ready',
    compliance_status: 'pending',
    last_communication: 'Brooke Shields uploaded draft staging photos.',
    next_action: 'Collect utility history bill from seller',
    owner: 'Todd Howard',
    launch_checklist: [
      { id: 'lc_5', step_name: 'Upload Listing Agreement', status: 'completed', completed_at: '2026-06-25T11:00:00Z' },
      { id: 'lc_6', step_name: 'Order Professional Photography', status: 'completed', completed_at: '2026-06-26T09:00:00Z' },
      { id: 'lc_7', step_name: 'Collect Utility History', status: 'pending' },
      { id: 'lc_8', step_name: 'Enter MLS Draft Record', status: 'completed', completed_at: '2026-06-26T15:00:00Z' }
    ]
  },
  {
    id: 'l_3',
    property_address: '401 E 8th Street, Austin TX 78701',
    responsible_agent_id: 'a_charles',
    status: 'active',
    list_price: 649000,
    target_launch_date: '2026-06-20',
    blocking_items: [],
    marketing_readiness: 'ready',
    compliance_status: 'approved',
    last_communication: 'Listing live in MLS. Synergy syndication validated.',
    next_action: 'Monitor feedback from first open house',
    owner: 'Alex Carter',
    launch_checklist: []
  },
  {
    id: 'l_4',
    property_address: '3206 Highland Avenue, Austin TX 78703',
    responsible_agent_id: 'a_alex',
    status: 'preparing',
    list_price: 1950000,
    target_launch_date: '2026-07-10',
    blocking_items: ['MLS exclusion form signed but not uploaded to board'],
    marketing_readiness: 'in_progress',
    compliance_status: 'rejected',
    last_communication: 'Laura Croft rejected listing agreement due to missing initials on Page 4.',
    next_action: 'Request corrected agreement from agent',
    owner: 'Todd Howard',
    launch_checklist: [
      { id: 'lc_9', step_name: 'Upload Listing Agreement', status: 'overdue' },
      { id: 'lc_10', step_name: 'Collect Signed Seller Disclosures', status: 'completed', completed_at: '2026-06-26T10:00:00Z' },
      { id: 'lc_11', step_name: 'MLS Exclusion Form Upload', status: 'pending' }
    ]
  },
  {
    id: 'l_5',
    property_address: '2209 Pemberton Heights, Austin TX 78703',
    responsible_agent_id: 'a_brooke',
    status: 'under_contract',
    list_price: 2450000,
    target_launch_date: '2026-06-10',
    blocking_items: [],
    marketing_readiness: 'ready',
    compliance_status: 'approved',
    last_communication: 'Under contract event registered in Rechat.',
    next_action: 'Verify files are ported to contract escrow',
    owner: 'Diane Ross',
    launch_checklist: []
  },
  {
    id: 'l_6',
    property_address: '1105 Enfield Road, Austin TX 78703',
    responsible_agent_id: 'a_charles',
    status: 'preparing',
    list_price: 1100000,
    target_launch_date: '2026-07-04',
    blocking_items: ['Lead-based paint disclosure required'],
    marketing_readiness: 'in_progress',
    compliance_status: 'pending',
    last_communication: 'Compliance admin marked Enfield road as requiring Lead disclosure due to 1974 build date.',
    next_action: 'Notify agent Charles to obtain lead disclosure',
    owner: 'Todd Howard',
    launch_checklist: [
      { id: 'lc_12', step_name: 'Upload Listing Agreement', status: 'completed', completed_at: '2026-06-25T09:00:00Z' },
      { id: 'lc_13', step_name: 'Lead Disclosures Collect', status: 'pending' }
    ]
  },
  {
    id: 'l_7',
    property_address: '1701 West Avenue, Austin TX 78701',
    responsible_agent_id: 'a_alex',
    status: 'active',
    list_price: 525000,
    target_launch_date: '2026-06-18',
    blocking_items: [],
    marketing_readiness: 'ready',
    compliance_status: 'approved',
    last_communication: 'MLS record updated with open house schedules.',
    next_action: 'Monitor syndication status',
    owner: 'Alex Carter',
    launch_checklist: []
  },
  {
    id: 'l_8',
    property_address: '904 Shoal Creek Blvd, Austin TX 78757',
    responsible_agent_id: 'a_brooke',
    status: 'draft',
    list_price: 950000,
    target_launch_date: '2026-07-15',
    blocking_items: ['Listing agreement drafting'],
    marketing_readiness: 'not_started',
    compliance_status: 'pending',
    last_communication: 'Brokerage initiated draft in DocuSign.',
    next_action: 'Collect initial agency parameters from seller',
    owner: 'Todd Howard',
    launch_checklist: [
      { id: 'lc_14', step_name: 'Upload Listing Agreement', status: 'pending' }
    ]
  }
];

export const demoCommunications: Communication[] = [
  {
    id: 'comm_1',
    type: 'email',
    sender: 'Alice Walker (Lender)',
    sender_email: 'a.walker@apexhomeloans.com',
    subject: 'RE: 102 Pine Street - Underwriter Question',
    body: "Hi Diane, we are waiting on the buyer's updated tax transcripts to finalize the loan file. Once received, we can issue the clear to close. Can you coordinate with Arthur?",
    received_at: '2026-06-27T08:15:00Z',
    source_system: 'gmail',
    category: 'financing',
    status: 'unread',
    action_proposal_id: 'ap_1',
    related_property: '102 Pine Street',
    related_agent: 'Alex Carter',
    intent: 'Lender requests updated tax transcripts to proceed with underwriting',
    urgency: 'high',
    time: '2 hours ago',
    confidence: 0.96,
    workflow: 'Financing Milestone Verification',
    attachment_indicator: false,
    original_message: 'From: Alice Walker <a.walker@apexhomeloans.com>\nSubject: RE: 102 Pine Street - Underwriter Question\n\nHi Diane, we are waiting on the buyer\'s updated tax transcripts to finalize the loan file...',
    ai_summary: 'Underwriter requires updated buyer tax transcripts to release the financing clear to close.',
    commitment_deadline: '2026-07-02T17:00:00Z',
    suggested_workflow_update: 'Flag "Tax Transcripts Requested" in milestone timeline',
    recommended_action: 'Approve draft email requesting tax transcripts from Arthur Pendragon',
    source_evidence: 'Gmail API sync node [msg_id: x71b29e] matching address 102 Pine St and entity Apex Home Loans.',
    activity_history: [
      { timestamp: '2026-06-27T08:16:00Z', action: 'Ingested and matched to 102 Pine Street transaction file', user: 'shapework AI' },
      { timestamp: '2026-06-27T08:16:05Z', action: 'Drafted follow-up email to client Arthur Pendragon', user: 'shapework AI' }
    ]
  },
  {
    id: 'comm_2',
    type: 'document',
    sender: 'DocuSign System',
    sender_email: 'docusign@docusign.net',
    subject: 'Completed: Seller Disclosures - 1504 Windsor Road',
    body: 'All parties have completed: Seller\'s Disclosure Notice for 1504 Windsor Road. The fully signed document is attached and uploaded to Drive.',
    received_at: '2026-06-27T07:45:00Z',
    source_system: 'docusign',
    category: 'signatures',
    status: 'unread',
    action_proposal_id: 'ap_2',
    related_property: '1504 Windsor Road',
    related_agent: 'Brooke Shields',
    intent: 'Seller disclosures fully executed and signed',
    urgency: 'medium',
    time: '3 hours ago',
    confidence: 0.98,
    workflow: 'Listing Launch Readiness Check',
    attachment_indicator: true,
    original_message: 'DocuSign System Alert: envelope [env_99812] has been completed by Guinevere Du Lac.',
    ai_summary: 'Guinevere Du Lac completed the Seller Disclosures form. File is signed and available in PDF format.',
    commitment_deadline: 'None',
    suggested_workflow_update: 'Mark step "Collect Signed Seller Disclosures" as COMPLETED in listing launch checklist',
    recommended_action: 'Verify signature pages and archive document in transaction repository',
    source_evidence: 'DocuSign webhook payload [envelope_id: env_99812] matching listing 1504 Windsor Rd.',
    activity_history: [
      { timestamp: '2026-06-27T07:45:10Z', action: 'Webhook parsed, document pulled and cataloged to Drive', user: 'shapework AI' }
    ]
  },
  {
    id: 'comm_3',
    type: 'sms',
    sender: 'Alex Carter (Agent)',
    sender_email: 'alex.c@harborpine.com',
    subject: 'Rechat alert response',
    body: 'Just saw the overdue alert on 109 Woodlawn. The photographer Kevin Frame was delayed because of rain. He is rescheduling for Monday morning.',
    received_at: '2026-06-27T09:30:00Z',
    source_system: 'sms',
    category: 'inspection',
    status: 'unread',
    action_proposal_id: 'ap_3',
    related_property: '109 Woodlawn Boulevard',
    related_agent: 'Alex Carter',
    intent: 'Update on overdue photography task due to weather delay',
    urgency: 'high',
    time: '1 hour ago',
    confidence: 0.92,
    workflow: 'Listing Launch Checklist',
    attachment_indicator: false,
    original_message: 'SMS from 512-555-0192: Just saw the overdue alert on 109 Woodlawn. The photographer Kevin Frame...',
    ai_summary: 'Photography delayed for 109 Woodlawn due to weather. Rescheduled to Monday, June 29.',
    commitment_deadline: '2026-06-29T10:00:00Z',
    suggested_workflow_update: 'Adjust photography milestone expected date to June 29',
    recommended_action: 'Update calendar slot and notify marketing department',
    source_evidence: 'Muted SMS integration log synced through Twilio.',
    activity_history: [
      { timestamp: '2026-06-27T09:30:15Z', action: 'Ingested SMS and extracted reschedule commitment date', user: 'shapework AI' }
    ]
  },
  {
    id: 'comm_4',
    type: 'webhook',
    sender: 'MLS Board System',
    sender_email: 'noreply@abor.com',
    subject: 'MLS Listing Alert: 3206 Highland Avenue Rejected',
    body: 'Vince-compliance flagged draft ID 88910: Listing Agreement upload rejected. Document lacks seller signature initials on page 4.',
    received_at: '2026-06-26T17:10:00Z',
    source_system: 'webhook',
    category: 'disclosures',
    status: 'read',
    action_proposal_id: 'ap_4',
    related_property: '3206 Highland Avenue',
    related_agent: 'Alex Carter',
    intent: 'Compliance rejection notice due to missing initials',
    urgency: 'high',
    time: 'Yesterday',
    confidence: 0.99,
    workflow: 'Listing Launch Compliance',
    attachment_indicator: false,
    original_message: 'MLS Compliance: Draft Listing 3206 Highland rejected. Reason: Missing initials Page 4.',
    ai_summary: 'The local MLS rejected the listing agreement upload due to missing seller initials on Page 4.',
    commitment_deadline: '2026-07-02T12:00:00Z',
    suggested_workflow_update: 'Mark compliance status as REJECTED and block publication',
    recommended_action: 'Generate new signature packet for page 4 and send to seller Eleanor Vance',
    source_evidence: 'RESO Webhook API transaction log [tx_99211]',
    activity_history: [
      { timestamp: '2026-06-26T17:10:30Z', action: 'Flagged listing compliance status and created email draft', user: 'shapework AI' }
    ]
  },
  {
    id: 'comm_5',
    type: 'calendar',
    sender: 'Robert Vance (Closing Attorney)',
    sender_email: 'robert@vancelaw.com',
    subject: 'Proposed Closing Schedule - 1204 Lakeview Court',
    body: 'Good morning Todd, we have open spots for closing at our Westlake branch on June 30 at 2:00 PM or 3:30 PM. Please advise which slot works best.',
    received_at: '2026-06-27T11:00:00Z',
    source_system: 'gcal',
    category: 'general',
    status: 'unread',
    action_proposal_id: 'ap_5',
    related_property: '1204 Lakeview Court',
    related_agent: 'Alex Carter',
    intent: 'Request to confirm closing time slot',
    urgency: 'medium',
    time: '30 mins ago',
    confidence: 0.94,
    workflow: 'Closing Prep',
    attachment_indicator: false,
    original_message: 'Proposed Closing spots for 1204 Lakeview on June 30: 2pm or 3:30pm.',
    ai_summary: 'Attorney Robert Vance proposing closing times. Closing date matches June 30.',
    commitment_deadline: '2026-06-29T12:00:00Z',
    suggested_workflow_update: 'Hold 2:00 PM slot on internal calendars',
    recommended_action: 'Select 2:00 PM and reply to Vance Law',
    source_evidence: 'Google Calendar invitation placeholder [id: gc_99182]',
    activity_history: [
      { timestamp: '2026-06-27T11:00:20Z', action: 'Calendar schedule slot recognized, cross-referenced agent schedule', user: 'shapework AI' }
    ]
  }
];

export const demoAIActionProposals: AIActionProposal[] = [
  {
    id: 'ap_1',
    transaction_id: 'tx_1',
    property_address: '102 Pine Street, Austin TX 78701',
    action_type: 'draft_email',
    title: 'Tax transcript request needs approval',
    description: 'Ask buyer Arthur Pendragon for updated tax transcripts requested by lender Alice Walker.',
    state: 'suggested',
    confidence: 0.96,
    created_at: '2026-06-27T08:16:05Z',
    target_recipient: 'Arthur Pendragon',
    draft_content: 'Hi Arthur, Alice Walker (your underwriting lender) has requested updated tax transcript forms to finalize your loan packet and issue the clear to close. Can you sign the attached authorization or upload your 2025 forms here?'
  },
  {
    id: 'ap_2',
    transaction_id: 'tx_3',
    property_address: '742 Evergreen Terrace, Austin TX 78704',
    action_type: 'flag_transaction_risk',
    title: 'Foundation repair contingency needs action',
    description: 'Inspection report identifies severe foundation cracking. Requires coordination of site engineer review.',
    state: 'suggested',
    confidence: 0.92,
    created_at: '2026-06-27T08:00:15Z',
    draft_content: 'System Flag: High operational risk detected on 742 Evergreen Terrace. Core foundation inspection exception has been unresolved for 48 hours. Closing is at risk of cancellation.'
  },
  {
    id: 'ap_3',
    transaction_id: 'tx_4',
    property_address: '305 Hillside Drive, Austin TX 78746',
    action_type: 'request_external_status',
    title: 'Credit verification update needs dispatch',
    description: 'Ask agent Alex Carter to obtain updated credit authorization form from the buyer.',
    state: 'suggested',
    confidence: 0.90,
    created_at: '2026-06-26T16:01:00Z',
    target_recipient: 'Alex Carter',
    draft_content: 'Alex, shapework detected a financing hold on Hillside Drive due to buyer credit re-evaluation. Can you request the signed credit authorization waiver from Diana Prince today?'
  },
  {
    id: 'ap_4',
    transaction_id: 'tx_6',
    property_address: '908 Colonial Avenue, Austin TX 78756',
    action_type: 'prepare_client_update',
    title: 'Financing delay notification needs approval',
    description: 'Prepare notification to buyer Arthur Pendleton regarding lender delay and option to extend financing period.',
    state: 'awaiting_approval',
    confidence: 0.95,
    created_at: '2026-06-27T09:05:00Z',
    target_recipient: 'Arthur Pendleton',
    draft_content: 'Hi Arthur, we are tracking the financing contingency deadline. The lender has been slow to provide final approvals. We recommend drafting a 3-day extension to secure your earnest money deposit.'
  },
  {
    id: 'ap_5',
    transaction_id: 'tx_8',
    property_address: '221 B Baker Street, Austin TX 78704',
    action_type: 'request_external_status',
    title: 'Earnest wire receipt confirmation is ready',
    description: 'Request confirmation of earnest money receipt from escrow officer Bob Vance.',
    state: 'awaiting_approval',
    confidence: 0.94,
    created_at: '2026-06-26T10:05:00Z',
    target_recipient: 'Bob Vance',
    draft_content: 'Hi Bob, we are checking on the escrow status for 221 B Baker Street. Has the initial earnest money deposit wire been received and booked into the escrow ledger?'
  }
];

export const demoAuditEvents: AuditEvent[] = [
  { id: 'au_1', timestamp: '2026-06-27T14:30:00Z', user_name: 'Marcus Aman', user_role: 'Owner', action_description: 'Approved and dispatched draft follow-up to lender Alice Walker', impact_area: '102 Pine Street (Financing)' },
  { id: 'au_2', timestamp: '2026-06-27T11:45:00Z', user_name: 'Ann Gunn', user_role: 'Operations Lead', action_description: 'Reassigned 742 Evergreen Terrace coordinator from Diane Ross to Emma Watson', impact_area: 'Workload Capacity Balancing' },
  { id: 'au_3', timestamp: '2026-06-26T15:20:00Z', user_name: 'Laura Croft', user_role: 'Compliance Admin', action_description: 'Rejected 3206 Highland Avenue listing compliance package', impact_area: '3206 Highland Avenue (Listing Agreement)' },
  { id: 'au_4', timestamp: '2026-06-26T10:00:00Z', user_name: 'System Operator', user_role: 'AI Agent', action_description: 'Auto-flagged 109 Woodlawn Boulevard launch photography task as overdue', impact_area: 'Listing Launch Checklist' }
];

export const demoIntegrations: IntegrationConnection[] = [
  { id: 'i_gmail', name: 'Gmail Workspace', icon: 'gmail', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read mail', 'Draft mail', 'Send mail'], records_synchronized: 1422, errors_count: 0, purpose: 'Sync client & coordinator emails', data_categories: ['Emails', 'Attachments'] },
  { id: 'i_outlook', name: 'Outlook Workspace', icon: 'outlook', connected: false, last_sync: 'Never', permissions_granted: [], records_synchronized: 0, errors_count: 0, purpose: 'Sync alternative brokerage emails', data_categories: ['Emails'] },
  { id: 'i_slack', name: 'Slack Channel Sync', icon: 'slack', connected: false, last_sync: 'Never', permissions_granted: [], records_synchronized: 0, errors_count: 0, purpose: 'Post automated notifications, alerts, and priority briefs', data_categories: ['Channel messages'] },
  { id: 'i_rechat', name: 'Rechat Platform', icon: 'rechat', connected: true, last_sync: '2026-06-27T15:48:00Z', permissions_granted: ['Read deals', 'Update contacts', 'Sync tasks'], records_synchronized: 522, errors_count: 1, purpose: 'Primary agent CRM & task system', data_categories: ['Transactions', 'Listings', 'Tasks'], recent_errors: ['401 Unauthorized token refresh attempt on Agent Charles webhook'] },
  { id: 'i_docusign', name: 'DocuSign Integration', icon: 'docusign', connected: true, last_sync: '2026-06-27T15:40:00Z', permissions_granted: ['Read envelopes', 'Listen webhooks'], records_synchronized: 341, errors_count: 0, purpose: 'Track document executions & download completed PDF contracts', data_categories: ['Documents', 'Signatures'] },
  { id: 'i_gcal', name: 'Google Calendar', icon: 'gcal', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read calendar', 'Write calendar'], records_synchronized: 110, errors_count: 0, purpose: 'Coordinate escrow inspection slots & closing room allocations', data_categories: ['Calendar events'] },
  { id: 'i_gdrive', name: 'Google Drive', icon: 'gdrive', connected: true, last_sync: '2026-06-27T15:45:00Z', permissions_granted: ['Read drive', 'Write drive'], records_synchronized: 840, errors_count: 0, purpose: 'Archive signed brokerage disclosures & title folders', data_categories: ['Files', 'Folder structures'] },
  { id: 'i_webhook', name: 'Custom Webhooks', icon: 'webhook', connected: true, last_sync: '2026-06-27T15:30:00Z', permissions_granted: ['Post events'], records_synchronized: 88, errors_count: 0, purpose: 'Receive events from MLS boards and escrow systems', data_categories: ['Raw webhook JSON'] }
];

export const demoRoiStats = {
  tasksAutomatedCount: 38,
  actionsApprovedCount: 18,
  actionsCompletedCount: 18,
  hoursSaved: 54.5,
  averageResponseTimeMins: 14,
  overdueTasksReducedPercent: 42
};

export const demoDecisions = [
  {
    id: 'dec_1',
    title: 'Approve Inspection Exception Escalation',
    description: '742 Evergreen Terrace inspection shows active structural foundation cracking. Suggest escalating to client Homer Simpson and broker representative.',
    financial_impact: 11200,
    owner: 'Frank Miller (Managing Broker)',
    time_remaining: '22 hours',
    why_it_matters: 'Failure to notify client or request structural inspection waiver before contract contingency deadline will forfeit buyer escape clause.',
    evidence: 'Inspection PDF uploaded: "Severe shear cracking along structural support beams under crawlspace."',
    recommended_action: 'Escalate file to owner and request structural inspector report'
  },
  {
    id: 'dec_2',
    title: 'Delay Listing Launch: 109 Woodlawn',
    description: 'Photography launch task is overdue by 48 hours. Agent has confirmed rain delays, but target MLS publication is scheduled for tomorrow.',
    financial_impact: 26250,
    owner: 'Todd Howard (Listing Coordinator)',
    time_remaining: '4 hours',
    why_it_matters: 'Publishing draft listing records without professional imagery violates Harbor & Pine marketing criteria and lowers listing impression SEO.',
    evidence: 'Alex Carter SMS: "Rescheduled photography to Monday morning due to rain."',
    recommended_action: 'Postpone target MLS launch date to Tuesday, July 7'
  },
  {
    id: 'dec_3',
    title: 'Reassign Escrow Workload',
    description: 'Transaction coordinator Diane Ross is assigned 7 active escrow files and is currently at 95% workload capacity. Emma Watson is at 40% capacity.',
    financial_impact: 0,
    owner: 'Ann Gunn (Operations Lead)',
    time_remaining: '48 hours',
    why_it_matters: 'Diane has 3 transactions closing within 4 days. High workload increases error risk and delays document review timelines.',
    evidence: 'Team Capacity Log: Diane Ross: 7 transactions, 5 overdue tasks. Emma Watson: 3 transactions, 0 overdue.',
    recommended_action: 'Reassign 102 Pine Street (tx_1) escrow coordination to Emma Watson'
  }
];

export const demoCapacityMetrics: CapacityMetric[] = [
  {
    coordinator_name: 'Diane Ross',
    assigned_work: 7,
    overdue_items: 5,
    new_work_today: 2,
    avg_resolution_time: '18 minutes',
    capacity_percentage: 95,
    suggested_reassignment: 'Reassign 102 Pine Street escrow file to Emma Watson'
  },
  {
    coordinator_name: 'Emma Watson',
    assigned_work: 3,
    overdue_items: 0,
    new_work_today: 0,
    avg_resolution_time: '12 minutes',
    capacity_percentage: 40
  },
  {
    coordinator_name: 'Todd Howard',
    assigned_work: 5,
    overdue_items: 2,
    new_work_today: 1,
    avg_resolution_time: '15 minutes',
    capacity_percentage: 65
  }
];

export const demoEmailAccounts: EmailAccount[] = [
  {
    id: 'e_1',
    address: 'operations@nest-demo.local',
    type: 'gmail',
    status: 'connected',
    last_sync: '2026-06-27T15:30:00Z',
    monitored_folders: ['Inbox', 'Transaction Coordination'],
    processed_count: 182,
    matched_count: 142,
    low_confidence_count: 2,
    proposed_actions_count: 8,
    completed_actions_count: 34,
    scope_purpose: 'Nest Realty demo workspace - Synthetic brokerage core mailbox',
    permissions: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']
  },
  {
    id: 'e_2',
    address: 'agent-demo@nest-demo.local',
    type: 'shared_inbox',
    status: 'connected',
    last_sync: '2026-06-27T15:45:00Z',
    monitored_folders: ['Escrow Alerts', 'MLS Notifications'],
    processed_count: 94,
    matched_count: 68,
    low_confidence_count: 1,
    proposed_actions_count: 2,
    completed_actions_count: 15,
    scope_purpose: 'Nest Realty demo workspace - Synthetic agent alerts monitor',
    permissions: ['https://www.googleapis.com/auth/gmail.readonly']
  },
  {
    id: 'e_3',
    address: 'transactions@nest-demo.local',
    type: 'transaction_inbox',
    status: 'connected',
    last_sync: '2026-06-27T15:50:00Z',
    monitored_folders: ['Inbox', 'Escrow Documents'],
    processed_count: 230,
    matched_count: 198,
    low_confidence_count: 0,
    proposed_actions_count: 12,
    completed_actions_count: 86,
    scope_purpose: 'Nest Realty demo workspace - Synthetic transaction files parser',
    permissions: ['https://outlook.office.com/mail.read']
  },
  {
    id: 'e_4',
    address: 'listings@nest-demo.local',
    type: 'shared_inbox',
    status: 'needs_attention',
    last_sync: '2026-06-26T22:00:00Z',
    monitored_folders: ['Inbox', 'MLS-updates'],
    processed_count: 12,
    matched_count: 8,
    low_confidence_count: 4,
    proposed_actions_count: 1,
    completed_actions_count: 3,
    scope_purpose: 'Nest Realty demo workspace - Synthetic listings launch scanner (expired)',
    permissions: ['https://outlook.office.com/mail.read']
  }
];

export const demoEmailMessages: EmailMessage[] = [
  {
    id: 'em_1',
    sender: 'Sarah from Coastal Lending',
    sender_email: 'sarah@coastallending.com',
    subject: '102 Pine Street - Clear to close confirmed!',
    body: 'Good morning Emma, We are clear to close on the Steve Rogers file for 102 Pine Street. The final Closing Disclosure has been signed and funds are ready for release. Please coordinate final buyer CD checks.',
    received_at: '2026-06-27T08:42:00Z',
    matched_property: '102 Pine Street, Austin TX 78704',
    confidence: 0.94,
    intent: 'Clear to Close Confirmation',
    stage_update: 'Clear to Close',
    risk_level: 'healthy',
    recommended_action: 'Update transaction stage from Underwriting to Clear to Close',
    approval_required: false,
    status: 'auto_updated',
    evidence: 'Coastal Lending confirms Steven Robinson file is clear to close and CD is executed.'
  },
  {
    id: 'em_2',
    sender: 'Brooke Agent',
    sender_email: 'brooke.s@nest-demo.local',
    subject: 'Escrow disclosures for Baker Street',
    body: 'Hi Diane, Charles Dupont signed the disclosures this afternoon. I am forwarding the PDF attachment. Please check off the launch list.',
    received_at: '2026-06-27T11:20:00Z',
    matched_property: '221 B Baker Street, Austin TX 78704',
    confidence: 0.62,
    intent: 'Upload signed disclosures',
    stage_update: 'Disclosures Received',
    risk_level: 'watch',
    recommended_action: 'Pick matching property (multiple active listings for Baker Street found)',
    approval_required: true,
    status: 'low_confidence',
    evidence: 'Forwarded email file attachment titles mention Baker disclosures'
  },
  {
    id: 'em_3',
    sender: 'Capital Title Corp',
    sender_email: 'closing@capitaltitle.com',
    subject: 'Closing instructions draft for review',
    body: 'Hello Diane, Attached is the draft closing instruction sheet. Please dispatch this directly to the sellers for electronic signatures.',
    received_at: '2026-06-27T10:15:00Z',
    matched_property: '102 Pine Street, Austin TX 78704',
    confidence: 0.92,
    intent: 'External Email dispatch proposal',
    stage_update: 'Closing Prep',
    risk_level: 'watch',
    recommended_action: 'Draft email to client presenting closing instruction signature packet',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'Capital Title provided signature templates matching escrow deal file #392.'
  },
  {
    id: 'em_4',
    sender: 'James Title Escrow',
    sender_email: 'j.escrow@firsttitle.com',
    subject: 'Escrow closing schedule extension request',
    body: 'Dear Diane, due to seller wire delays, title recommends extending the scheduled closing date on 908 Colonial Ave by 3 business days to July 10th.',
    received_at: '2026-06-27T14:10:00Z',
    matched_property: '908 Colonial Ave, Austin TX 78704',
    confidence: 0.95,
    intent: 'Material closing date change proposal',
    stage_update: 'Under Contract',
    risk_level: 'at_risk',
    recommended_action: 'Extend scheduled closing date by 3 days & update Dotloop calendar',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'Title officer requests 3-day extension due to outstanding seller wiring validation.'
  },
  {
    id: 'em_5',
    sender: 'Alex Roster Agent',
    sender_email: 'alex.c@nest-demo.local',
    subject: 'Escrow deposit slab crack structural exception',
    body: 'Hey Frank, inspection noted severe foundation cracking. Client is refusing to deposit earnest wires until seller remedies slab structural cracks.',
    received_at: '2026-06-27T13:00:00Z',
    matched_property: '742 Evergreen Terr, Austin TX 78704',
    confidence: 0.98,
    intent: 'Sensitive compliance phrase flagged',
    stage_update: 'Inspection and Repair',
    risk_level: 'blocked',
    recommended_action: 'Escalate to Managing Broker Frank Miller & flag structural risk on Evergreen Terrace',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'NLP detected compliance phrases "foundation cracking" and "refusing to deposit earnest funds".'
  },
  {
    id: 'em_6',
    sender: 'Unknown Lender Agent',
    sender_email: 'randy@magnolialending.com',
    subject: 'Colonial Ave file underwriting guidelines update',
    body: 'Hello coordinator, underwriting has approved the finance package for the Colonial Ave escrow. Let me know who the managing broker is.',
    received_at: '2026-06-27T12:05:00Z',
    matched_property: '908 Colonial Ave, Austin TX 78704',
    confidence: 0.74,
    intent: 'Unrecognized sender mapping',
    stage_update: 'Underwriting',
    risk_level: 'watch',
    recommended_action: 'Map Randy (randy@magnolialending.com) to Colonial Ave Buyer Lender Roster Role',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'Inbound domain is a recognized lender, but Randy is not yet in Colonial Ave contacts.'
  },
  {
    id: 'em_7',
    sender: 'Emma Watson',
    sender_email: 'emma.w@nest-demo.local',
    subject: 'FW: 102 Pine Street - Closing checklist update',
    body: 'Diane, forwarding this other thread from title. They already verified the earnest wire. Can we merge these loops?',
    received_at: '2026-06-27T09:12:00Z',
    matched_property: '102 Pine Street, Austin TX 78704',
    confidence: 0.82,
    intent: 'Duplicate thread merge suggestion',
    stage_update: 'Closing Prep',
    risk_level: 'healthy',
    recommended_action: 'Merge email thread with existing Pine Street loop #2214',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'Inbound thread topic is a duplicate of closing checklist thread #2199.'
  },
  {
    id: 'em_8',
    sender: 'Sarah Disclosures Corp',
    sender_email: 'signatures@docusign.net',
    subject: 'Completed: DocuSign envelope for 742 Evergreen',
    body: 'All parties have executed the Lead-Based Paint disclosure. PDF copy is attached.',
    received_at: '2026-06-27T08:15:00Z',
    matched_property: '742 Evergreen Terr, Austin TX 78704',
    confidence: 0.99,
    intent: 'Document attached classification',
    stage_update: 'Active Listing',
    risk_level: 'healthy',
    recommended_action: 'Classify Lead-Based Paint disclosure PDF and upload to Evergreen loop',
    approval_required: false,
    status: 'auto_updated',
    evidence: 'Attachment identified as standard signed disclosures form.'
  },
  {
    id: 'em_9',
    sender: 'Alex Carter',
    sender_email: 'alex.c@nest-demo.local',
    subject: 'disclosures are done',
    body: 'Done.',
    received_at: '2026-06-27T07:45:00Z',
    matched_property: '742 Evergreen Terr, Austin TX 78704',
    confidence: 0.55,
    intent: 'Clarification required',
    stage_update: 'Active Listing',
    risk_level: 'watch',
    recommended_action: 'Send secure link to Alex Carter requesting PDF upload or loop verification',
    approval_required: true,
    status: 'needs_approval',
    evidence: 'Ambiguous short message "Done." does not contain signature hash or attached files.'
  },
  {
    id: 'em_10',
    sender: 'Underwriting Office',
    sender_email: 'underwriting@apexmortgage.com',
    subject: 'Underwriting Clear to Close: Steve Rogers escrow',
    body: 'We are clear to close on the Steve Rogers financing package for 102 Pine Street. Final CD dispatched.',
    received_at: '2026-06-27T07:10:00Z',
    matched_property: '102 Pine Street, Austin TX 78704',
    confidence: 0.97,
    intent: 'Milestone Update: Clear to Close',
    stage_update: 'Clear to Close',
    risk_level: 'healthy',
    recommended_action: 'Update transaction stage to Clear to Close',
    approval_required: false,
    status: 'auto_updated',
    evidence: 'Apex Mortgage lender underwriting office confirms formal Clear to Close clearance.'
  }
];

export const demoAutomationRules: AutomationRule[] = [
  {
    id: 'r_1',
    name: 'Internal Stage Auto-Updates',
    description: 'Allow shapework to update deal workflow stages internally (e.g. Underwriting to Clear to Close) if confidence exceeds threshold.',
    category: 'low',
    enabled: true,
    confidence_threshold: 90
  },
  {
    id: 'r_2',
    name: 'Mark Document Received',
    description: 'Autodetect attachment filenames and check off pending items in transaction checklists.',
    category: 'low',
    enabled: true,
    confidence_threshold: 85
  },
  {
    id: 'r_3',
    name: 'Draft Outbound Emails',
    description: 'Autocraft Gmail responses to agents/clients for missing document reminders.',
    category: 'medium',
    enabled: true,
    confidence_threshold: 80
  },
  {
    id: 'r_4',
    name: 'Reassign Escrow Owner',
    description: 'Automatically balance coordinator assignments when workload caps are exceeded.',
    category: 'medium',
    enabled: false,
    confidence_threshold: 95
  },
  {
    id: 'r_5',
    name: 'Adjust Escrow Closing Date',
    description: 'Modify expected closing date in compliance records based on signed contract addenda.',
    category: 'high',
    enabled: false,
    confidence_threshold: 98
  }
];

export const demoAutomationPolicy: AutomationPolicy = {
  redact_sensitive_data: true,
  business_only: true,
  notify_broker_on_escalation: true,
  external_requires_approval: true
};

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

// Mutate demo arrays in place
demoTransactions.forEach(mapObjectProperties);
demoListings.forEach(mapObjectProperties);
demoCommunications.forEach(mapObjectProperties);
demoAIActionProposals.forEach(mapObjectProperties);
demoAuditEvents.forEach(mapObjectProperties);
demoDecisions.forEach(mapObjectProperties);
demoCapacityMetrics.forEach(mapObjectProperties);
demoEmailMessages.forEach(mapObjectProperties);

