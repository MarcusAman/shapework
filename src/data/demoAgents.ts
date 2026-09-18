/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentDefinition, AgentRun, AgentEvent } from '../types/shapework';

export const demoAgents: AgentDefinition[] = [
  {
    id: 'agent_coo',
    name: 'AI COO Orchestrator',
    role: 'Operations Manager',
    status: 'monitoring',
    watched_sources: ['Gmail Inbox', 'Dotloop API', 'SkySlope Events', 'Audit Logs', 'Integrations Hub'],
    last_run: '10 mins ago',
    next_scheduled_run: 'In 5 mins',
    actions_prepared_today: 4,
    actions_completed_today: 12,
    items_requiring_approval: 0,
    confidence_range: '94% - 99%',
    permission_level: 'full_control',
    mission: 'Classify incoming events, route operational issues to specialized agents, and coordinate overall brokerage status alerts for leadership.',
    can_do_automatically: [
      'Route emails to specialists',
      'Create internal operations brief',
      'Log system activity checkpoints',
      'Update agent load metrics'
    ],
    requires_approval: [
      'Trigger global email sweeps',
      'Override active agent states',
      'Modify operational policies'
    ],
    never_does: [
      'Approve external messages directly',
      'Modify agent commission structures',
      'Change brokerage licensing terms'
    ],
    connected_tools: ['NLP Intent Router', 'Roster Map API', 'Activity Trail Ledger'],
    playbook: {
      trigger: 'Incoming communication, state change, or scheduled cron trigger.',
      conditions: [
        'Signal contains a valid transaction or listing context.',
        'Sender domain is recognized.'
      ],
      recordsToInspect: ['Transactions', 'Listings', 'Communications'],
      toolsAllowed: ['Orchestrator Classifier', 'Signal Dispatcher'],
      confidenceThreshold: 90,
      autoSafeActions: ['Dispatch event to specialized agent', 'Update system monitoring panel'],
      approvalRequiredActions: ['Escalate unhandled signal to managing broker'],
      escalationPath: 'Ann Gunn (Operations Lead)',
      auditRequirements: ['Log classification decision', 'Log specialist handoff details'],
      steps: [
        'Analyze raw event payload (e.g. email subject, body, or API payload).',
        'Extract context identifiers (address, agent, transaction ID).',
        'Determine intent category (stage update, compliance, closing risk, integration error).',
        'Select target specialist agent (e.g. Transaction Stage Agent, Compliance Agent).',
        'Log handoff transition in the Audit Trail and pass control.'
      ]
    }
  },
  {
    id: 'agent_email',
    name: 'Email Triage Agent',
    role: 'Communications Coordinator',
    status: 'idle',
    watched_sources: ['office@nestrealty.com', 'lender-inbox', 'title-inbox'],
    last_run: '2 mins ago',
    next_scheduled_run: 'Real-time Webhook',
    actions_prepared_today: 8,
    actions_completed_today: 22,
    items_requiring_approval: 0,
    confidence_range: '91% - 98%',
    permission_level: 'restricted_write',
    mission: 'Read and classify incoming emails, match them to transaction records, extract attachments, and attach communications to the operating memory.',
    can_do_automatically: [
      'Attach email copy to transaction timeline',
      'Map sender address to brokerage participant directory',
      'Flag unread emails matching active properties'
    ],
    requires_approval: [
      'Assign email to a different transaction owner',
      'Draft automatic replies to unknown senders'
    ],
    never_does: [
      'Delete email messages',
      'Mark emails as read in the primary client client workspace without ingestion'
    ],
    connected_tools: ['Gmail API Reader', 'Participant Ingestion Mapper', 'Operating Memory Sync'],
    playbook: {
      trigger: 'New email arrives via webhooks.',
      conditions: [
        'Email is from an active transaction partner (lender, title, attorney, agent, client).'
      ],
      recordsToInspect: ['Inbox Messages', 'Communications', 'Brokerage Roster'],
      toolsAllowed: ['Email Context Matcher', 'Attachment Parser'],
      confidenceThreshold: 85,
      autoSafeActions: ['Link message thread to transaction', 'Add participant mapping'],
      approvalRequiredActions: ['Resolve low-confidence sender matches'],
      escalationPath: 'Ops Admin Duty Desk',
      auditRequirements: ['Log email ingestion status', 'Log participant match score'],
      steps: [
        'Fetch email content and headers.',
        'Extract property addresses, names, and contact details.',
        'Check database for exact matches (subject line address, sender email address).',
        'Attach message thread with context index to Operating Memory.',
        'Notify AI COO Orchestrator if transaction action is needed.'
      ]
    }
  },
  {
    id: 'agent_stage',
    name: 'Transaction Stage Agent',
    role: 'Escrow Coordinator',
    status: 'needs_approval',
    watched_sources: ['lender-inbox', 'title-inbox', 'Dotloop webhook', 'DocuSign status'],
    last_run: '1 min ago',
    next_scheduled_run: 'Real-time Webhook',
    actions_prepared_today: 3,
    actions_completed_today: 5,
    items_requiring_approval: 1,
    confidence_range: '90% - 97%',
    permission_level: 'restricted_write',
    mission: 'Keep transaction stages current by reading authorized communications and integration events.',
    can_do_automatically: [
      'Add internal stage progress note',
      'Attach communication to transaction file',
      'Mark low-risk milestone complete (e.g. escrow opened confirmation)',
      'Propose stage update',
      'Create internal task'
    ],
    requires_approval: [
      'Change closing date',
      'Send external message',
      'Escalate to managing broker',
      'Modify material deal terms',
      'Interpret legal/compliance language'
    ],
    never_does: [
      'Give legal advice',
      'Change commission split terms',
      'Send client-facing legal language without approval',
      'Modify contracts',
      'Delete records'
    ],
    connected_tools: ['Dotloop Sync API', 'DocuSign Event Tracker', 'CommandPlan Generator'],
    playbook: {
      trigger: 'Lender email contains "clear to close" or signature events.',
      conditions: [
        'Lender or agent has sent confirmation of milestone completion.',
        'Confidence score is above 90%.'
      ],
      recordsToInspect: ['Transactions', 'Communications'],
      toolsAllowed: ['Stage Transition Evaluator', 'Dotloop Status Writer'],
      confidenceThreshold: 90,
      autoSafeActions: ['Mark milestone complete', 'Propose stage transition'],
      approvalRequiredActions: ['Update Transaction stage to Sold/Closed', 'Modify transaction closing date'],
      escalationPath: 'Managing Broker / sarah.jenkins@nestrealty.com',
      auditRequirements: ['Log before and after stage values', 'Log authorizing evidence email extract'],
      steps: [
        'Identify sender of milestone confirmation.',
        'Confirm sender is mapped to lender or transaction participant.',
        'Match email to transaction.',
        'Extract milestone details (e.g. appraisal received, underwriting approved, clear to close).',
        'Check confidence of extraction.',
        'Check current transaction stage.',
        'If confidence > 90% and internal update only, update milestone or propose stage update.',
        'If external notification is needed, draft message and request approval.',
        'Record audit event with evidence links.'
      ]
    }
  },
  {
    id: 'agent_closing',
    name: 'Closing Risk Agent',
    role: 'Risk Analyst',
    status: 'monitoring',
    watched_sources: ['Calendar dates', 'Lender threads', 'Title updates', 'Operating Memory'],
    last_run: '5 mins ago',
    next_scheduled_run: 'Hourly',
    actions_prepared_today: 2,
    actions_completed_today: 4,
    items_requiring_approval: 0,
    confidence_range: '88% - 95%',
    permission_level: 'read_only',
    mission: 'Monitor closing date milestones, calculate revenue slippage risks, identify stuck transaction points, and flag delays.',
    can_do_automatically: [
      'Calculate risk coefficient for deals',
      'Flag overdue finance contingencies',
      'Create internal risk review alerts'
    ],
    requires_approval: [
      'Escalate risk to regional managing broker',
      'Postpone closing checklists'
    ],
    never_does: [
      'Change transaction dates',
      'Notify clients of risk without broker review'
    ],
    connected_tools: ['Risk Assessment Engine', 'Escrow Delay Predictor'],
    playbook: {
      trigger: 'Closing date within 14 days or milestone overdue.',
      conditions: [
        'Financing, appraisal, or repair contingency is overdue by >24 hours.'
      ],
      recordsToInspect: ['Transactions', 'Lender Threads'],
      toolsAllowed: ['Risk Estimator'],
      confidenceThreshold: 80,
      autoSafeActions: ['Flag deal as "at_risk"', 'Calculate revenue impact at risk'],
      approvalRequiredActions: ['Trigger agent notification text'],
      escalationPath: 'Ann Gunn (Operations Lead)',
      auditRequirements: ['Log risk score calculations', 'Create audit alert item'],
      steps: [
        'Scan active transactions closing in the next 14 days.',
        'Inspect contingency milestones (financing, inspection, appraisal).',
        'Check for recent email updates from lenders or title offices in past 48 hours.',
        'If no communications exist, calculate risk score increase.',
        'Write risk alert to Command Center and flag potential revenue at risk.'
      ]
    }
  },
  {
    id: 'agent_listing',
    name: 'Listing Launch Agent',
    role: 'Listing Coordinator',
    status: 'monitoring',
    watched_sources: ['MLS listings feed', 'Listing agreements folder', 'Photography queue', 'Disclosures portal'],
    last_run: '12 mins ago',
    next_scheduled_run: 'Every 30 mins',
    actions_prepared_today: 1,
    actions_completed_today: 3,
    items_requiring_approval: 0,
    confidence_range: '92% - 97%',
    permission_level: 'restricted_write',
    mission: 'Track pre-launch listing preparation checklists, flag launch blockages, and ensure disclosures are signed.',
    can_do_automatically: [
      'Link photography invoices to listing records',
      'Verify MLS draft fields against listing contracts',
      'Flag missing documents in pre-marketing files'
    ],
    requires_approval: [
      'Push listing live on MLS',
      'Update target listing launch date'
    ],
    never_does: [
      'Syndicate listings without active signed listing contracts',
      'Modify pricing on listing agreements'
    ],
    connected_tools: ['MLS API connector', 'Photography Portal Scraper', 'Compliance Memory Core'],
    playbook: {
      trigger: 'Listing Launch Date is within 7 days.',
      conditions: [
        'Listing status is preparing or draft.'
      ],
      recordsToInspect: ['Listings', 'Agent Emails', 'Photography Logs'],
      toolsAllowed: ['Listing Checklist Analyzer', 'MLS Draft Ingester'],
      confidenceThreshold: 90,
      autoSafeActions: ['Verify document presence', 'Update launch readiness index'],
      approvalRequiredActions: ['Trigger agent task alert for missing items'],
      escalationPath: 'Listing Team Lead',
      auditRequirements: ['Log checklist audits', 'Record compliance status'],
      steps: [
        'Inspect listing details (address, agent, listing contract signed).',
        'Check folder for photography files or vendor invoices.',
        'Verify that seller property disclosures have been signed and uploaded.',
        'Calculate listing launch readiness score.',
        'Flag listing to "Blocked" status if photos are missing within 48 hours of target launch.'
      ]
    }
  },
  {
    id: 'agent_compliance',
    name: 'Compliance Agent',
    role: 'Compliance Officer',
    status: 'monitoring',
    watched_sources: ['DocuSign folders', 'Dotloop records', 'Buyer broker contracts', 'Lead disclosure files'],
    last_run: '4 mins ago',
    next_scheduled_run: 'Every 15 mins',
    actions_prepared_today: 5,
    actions_completed_today: 10,
    items_requiring_approval: 0,
    confidence_range: '95% - 99%',
    permission_level: 'restricted_write',
    mission: 'Audit transaction files for mandatory contract disclosures, sign-offs, and compliance checklists.',
    can_do_automatically: [
      'Flag missing buyer broker agreements',
      'Verify lead-paint disclosures match properties built before 1978',
      'Mark checked documents as "Compliance Verified"'
    ],
    requires_approval: [
      'Waive compliance document rules',
      'Flag agent compliance files as approved for payout'
    ],
    never_does: [
      'Alter contract signatures',
      'Delete compliance history records'
    ],
    connected_tools: ['DocuSign Envelope Parser', 'Compliance Rule Evaluator'],
    playbook: {
      trigger: 'New contract signed or file uploaded.',
      conditions: [
        'Document requires review according to regional rules.'
      ],
      recordsToInspect: ['Transactions', 'Listings', 'Uploaded PDF files'],
      toolsAllowed: ['PDF Signature Parser', 'Disclosures Auditor'],
      confidenceThreshold: 95,
      autoSafeActions: ['Validate document signatures', 'Log compliance pass status'],
      approvalRequiredActions: ['Flag compliance exceptions to leadership'],
      escalationPath: 'Managing Broker / compliance@nestrealty.com',
      auditRequirements: ['Log compliance checks', 'Create checklist compliance report'],
      steps: [
        'Trigger on document upload webhook.',
        'Inspect document type (Buyer Broker Agreement, Lead Paint Disclosure, Purchase Contract).',
        'Analyze signatures and date stamps using parser.',
        'Cross-reference compliance checklist regulations.',
        'Flag transaction as "Attention Required" if critical disclosures are missing or unsigned.'
      ]
    }
  },
  {
    id: 'agent_support',
    name: 'Agent Support Agent',
    role: 'Support Specialist',
    status: 'monitoring',
    watched_sources: ['Agent emails', 'SMS channels', 'Operations Inbox', 'Roster lists'],
    last_run: '8 mins ago',
    next_scheduled_run: 'Every 10 mins',
    actions_prepared_today: 3,
    actions_completed_today: 8,
    items_requiring_approval: 0,
    confidence_range: '89% - 96%',
    permission_level: 'restricted_write',
    mission: 'Monitor operational queries from agents, link TCs to overloaded files, and flag high-producer friction points.',
    can_do_automatically: [
      'Generate draft email instructions for agent questions',
      'Track support response timelines',
      'Alert TCs to assist busy agents'
    ],
    requires_approval: [
      'Send automated instructional SMS to agents',
      'Assign transaction coordinators to files'
    ],
    never_does: [
      'Provide licensing advice',
      'Approve agent fee reductions'
    ],
    connected_tools: ['Operations Inbox NLP', 'Support Ticket Resolver'],
    playbook: {
      trigger: 'Agent emails ask for operational support or coordinator assistance.',
      conditions: [
        'Agent is active on the roster.',
        'Message contains operational support indicators (e.g. "who is my TC", "help uploading", "Docusign error").'
      ],
      recordsToInspect: ['Communications', 'Roster'],
      toolsAllowed: ['Agent Support Generator'],
      confidenceThreshold: 85,
      autoSafeActions: ['Create internal support ticket', 'Match request to agent profile'],
      approvalRequiredActions: ['Send prepared email response draft'],
      escalationPath: 'Ann Gunn (Operations Lead)',
      auditRequirements: ['Log agent support queries', 'Track response speed metrics'],
      steps: [
        'Ingest incoming agent support inquiry.',
        'Locate agent record and evaluate active transaction volume.',
        'Analyze issue category (e.g. document setup, sync error).',
        'Draft clear, step-by-step assistance notes using supportive language.',
        'Queue response in the AI Operator dock for COO review.'
      ]
    }
  },
  {
    id: 'agent_draft',
    name: 'Follow-Up Drafting Agent',
    role: 'Communications Assistant',
    status: 'monitoring',
    watched_sources: ['Risk alerts', 'Compliance exceptions', 'Agent secure actions portal'],
    last_run: '6 mins ago',
    next_scheduled_run: 'Every 5 mins',
    actions_prepared_today: 6,
    actions_completed_today: 14,
    items_requiring_approval: 0,
    confidence_range: '91% - 96%',
    permission_level: 'restricted_write',
    mission: 'Draft professional emails and SMS templates for follow-ups, alerts, and contingency warnings.',
    can_do_automatically: [
      'Draft internal email alerts for agents',
      'Log prepared draft templates in communications history'
    ],
    requires_approval: [
      'Send external emails to lenders, attorneys, or title companies',
      'Deliver automated SMS alerts to third parties'
    ],
    never_does: [
      'Send client-facing legal language without approval',
      'Commit brokerage to contracts or payouts'
    ],
    connected_tools: ['Drafting Engine API', 'Email System Connector'],
    playbook: {
      trigger: 'Specialist agent requests follow-up drafting action.',
      conditions: [
        'Target recipient email and contact fields are valid.'
      ],
      recordsToInspect: ['Transactions', 'Communications'],
      toolsAllowed: ['Drafting Template Parser'],
      confidenceThreshold: 90,
      autoSafeActions: ['Format draft template', 'Queue draft in Operations Inbox'],
      approvalRequiredActions: ['Dispatch message to external recipient'],
      escalationPath: 'Ann Gunn (Operations Lead)',
      auditRequirements: ['Log prepared draft copy', 'Log recipient fields'],
      steps: [
        'Identify target recipient (e.g. lender, listing agent, buyer agent).',
        'Select template or generate email content addressing the issue (e.g., missing contingency signature).',
        'Insert transaction values (address, deadline, agent name).',
        'Apply safe, professional formatting.',
        'Place draft directly into the operator approval queue for human check.'
      ]
    }
  },
  {
    id: 'agent_health',
    name: 'Integration Health Agent',
    role: 'Technical System Analyst',
    status: 'monitoring',
    watched_sources: ['Dotloop Credentials', 'SkySlope Webhook health', 'Gmail OAuth status', 'DocuSign API logs'],
    last_run: '15 mins ago',
    next_scheduled_run: 'Every 30 mins',
    actions_prepared_today: 0,
    actions_completed_today: 2,
    items_requiring_approval: 0,
    confidence_range: '96% - 99%',
    permission_level: 'restricted_write',
    mission: 'Monitor connection status of third-party systems, notify admins of sync failures, and flag stale credentials.',
    can_do_automatically: [
      'Log webhook ping responses',
      'Flag credential expiration dates',
      'Disable stale sync routes'
    ],
    requires_approval: [
      'Re-authenticate external OAuth sessions',
      'Test production webhook endpoints with dummy events'
    ],
    never_does: [
      'Bypass security policies',
      'Store client API secrets in plaintext'
    ],
    connected_tools: ['Integration Status Checker', 'Syslog Parser'],
    playbook: {
      trigger: 'Sync failure or credential expiration alert.',
      conditions: [
        'API error code matches expired credentials or sync server timeout (>3 retry failures).'
      ],
      recordsToInspect: ['Integrations Connections', 'Syslogs'],
      toolsAllowed: ['Ping tool', 'Credential Evaluator'],
      confidenceThreshold: 95,
      autoSafeActions: ['Mark connection state as "Watch" or "Stale"', 'Log error logs to audit trail'],
      approvalRequiredActions: ['Trigger admin notification alert', 'De-authorize stale connection'],
      escalationPath: 'Operations Tech Lead',
      auditRequirements: ['Log API failure code', 'Log sync retry stats'],
      steps: [
        'Listen for API sync failures.',
        'Extract error code and affected connector name.',
        'Verify if failure is transient or credential-related.',
        'Write stale integration cost alert to Profitability health score widget.',
        'Queue system warning message in the AI Operator Workspace.'
      ]
    }
  },
  {
    id: 'agent_audit',
    name: 'Audit Agent',
    role: 'Security & Compliance Analyst',
    status: 'monitoring',
    watched_sources: ['Audit Logs', 'State Changes', 'State hooks', 'Database operations'],
    last_run: '1 min ago',
    next_scheduled_run: 'Continuous',
    actions_prepared_today: 0,
    actions_completed_today: 20,
    items_requiring_approval: 0,
    confidence_range: '98% - 100%',
    permission_level: 'full_control',
    mission: 'Log every state operation, index observations with evidentiary proof, track approvals, and manage rollback rules.',
    can_do_automatically: [
      'Record state changes in the audit ledger',
      'Verify transaction before/after hashes',
      'Log system activity reports'
    ],
    requires_approval: [
      'Rollback transaction stage updates',
      'Purge historical audit logs'
    ],
    never_does: [
      'Modify ledger entries (immutable)',
      'Bypass audit logging for any state operations'
    ],
    connected_tools: ['Ledger Writer API', 'State Hash Calculator'],
    playbook: {
      trigger: 'Any system state mutation occurs.',
      conditions: [
        'Event payload contains before_value, after_value, and actor fields.'
      ],
      recordsToInspect: ['Audit Trail Events'],
      toolsAllowed: ['Ledger Cryptographic Logger'],
      confidenceThreshold: 99,
      autoSafeActions: ['Write immutable ledger entry', 'Verify rollback eligibility status'],
      approvalRequiredActions: ['Execute stage rollback on transaction'],
      escalationPath: 'Ann Gunn (Operations Lead)',
      auditRequirements: ['Continuous immutable recording'],
      steps: [
        'Trigger on state change event.',
        'Create cryptographic before/after hash of altered record.',
        'Verify authorizing user identity and active role parameters.',
        'Write record ID, timestamp, before/after values, and proof details into Audit Log.',
        'Determine if rollback is available and mark log entry.'
      ]
    }
  }
];

export const demoAgentRuns: AgentRun[] = [
  {
    runId: 'run_coo_101',
    agentId: 'agent_coo',
    status: 'completed',
    trigger: 'Scheduled Mission (Daily Operations Briefing)',
    startedAt: '2026-06-28T08:00:00Z',
    completedAt: '2026-06-28T08:00:15Z',
    recordsScanned: 24,
    findings: [
      'Detected $42,800 in projected brokerage revenue tied to unresolved risk.',
      'Identified 2 listings delayed by missing photos.',
      'Indexed 12 transaction loops in Compliance memory.'
    ],
    recommendations: [
      'Generate Morning operations briefing report.',
      'Route contingency follow-up drafts to Decision Queue.'
    ],
    actionsPrepared: 2,
    actionsExecuted: 2,
    approvalsRequired: 0,
    evidence: 'Calculated from 3 delayed contingency transaction files (Evergreen, Colonial, Pine St).',
    auditEventsCreated: ['audit_coo_daily_briefing']
  },
  {
    runId: 'run_stage_102',
    agentId: 'agent_stage',
    status: 'completed',
    trigger: 'Lender email: "underwriting approved clear to close" for 102 Pine St',
    startedAt: '2026-06-28T08:42:00Z',
    completedAt: '2026-06-28T08:42:08Z',
    recordsScanned: 3,
    findings: [
      'Lender sent clear to close confirmation for 102 Pine St.',
      'Underwriting stage completed successfully.'
    ],
    recommendations: [
      'Transition stage to closing_prep.',
      'Notify listing agent of clear to close confirmation.'
    ],
    actionsPrepared: 1,
    actionsExecuted: 1,
    approvalsRequired: 0,
    evidence: 'Email from lender-inbox (loan-officer@apexmortgage.com): "Underwriting approved clear to close on Pine Street. Scheduling closing session."',
    auditEventsCreated: ['audit_stage_update_pine_st']
  }
];

export const demoAgentEvents: AgentEvent[] = [
  {
    id: 'evt_1',
    timestamp: '2026-06-28T08:42:00Z',
    trigger: 'Lender email received',
    agentId: 'agent_stage',
    recordsInspected: ['102 Pine St (Transaction ID: tx_102)'],
    findings: ['Found "clear to close" indicator in email body.'],
    recommendedAction: 'Transition transaction stage to Closing Prep.',
    approvalStatus: 'auto-safe',
    auditEventId: 'audit_stage_update_pine_st',
    rollbackAvailable: true
  },
  {
    id: 'evt_2',
    timestamp: '2026-06-28T09:12:00Z',
    trigger: 'Listing Launch target in 48 hours',
    agentId: 'agent_listing',
    recordsInspected: ['104 Maple Ave (Listing ID: lst_104)'],
    findings: ['Listing photos have not been uploaded by vendor.'],
    recommendedAction: 'Flag listing launch as blocked. Draft alert to agent Randy.',
    approvalStatus: 'approval required',
    auditEventId: 'audit_listing_block_maple_ave',
    rollbackAvailable: false
  },
  {
    id: 'evt_3',
    timestamp: '2026-06-28T10:05:00Z',
    trigger: 'Dotloop webhook sync error',
    agentId: 'agent_health',
    recordsInspected: ['Westlake Office dotloop connection'],
    findings: ['API credentials expired. Webhook handshake failed.'],
    recommendedAction: 'Flag integration connection as Stale. Log cost impact ($400).',
    approvalStatus: 'needs human review',
    auditEventId: 'audit_integration_health_dotloop',
    rollbackAvailable: false
  }
];
