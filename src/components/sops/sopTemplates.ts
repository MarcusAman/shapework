export interface SOPField {
  id: string;
  name: string;
  description: string;
  dataType: 'text' | 'long_text' | 'number' | 'date' | 'document' | 'choice' | 'person' | 'address';
  required: 'yes' | 'no' | 'conditional';
  conditionalLogic?: string;
  example?: string;
  source?: string;
}

export interface SOPStep {
  id: string;
  title: string;
  instruction: string;
  assignedRole: string;
  backupRole?: string;
  type: string;
  evidenceRequired?: string;
  approvalRequired?: boolean;
  expectedDuration?: string;
  connectedTool?: string;
}

export interface SOPDecision {
  id: string;
  title: string;
  condition: string;
  action: string;
}

export interface SOPTemplate {
  id: string;
  title: string;
  department: string;
  ownerRole: string;
  ownerUserId: string;
  backupRole: string;
  backupUserId: string;
  purpose: string;
  expectedOutcome: string;
  scope: string;
  exclusions?: string;
  tags: string[];
  triggerType: string;
  trigger: string;
  requiredInfo: SOPField[];
  steps: SOPStep[];
  decisions: SOPDecision[];
  escalationBehavior: {
    expectedResponse: string;
    followUpDue: string;
    escalateAfter: string;
    recipientRole: string;
  };
  completionEvidence: {
    type: string;
    description: string;
  };
  governance: {
    reviewFrequencyDays: number;
    visibility: 'workspace' | 'public' | 'private';
    trainingRequired: boolean;
  };
  status: 'draft' | 'published';
  version: string;
}

export const SOP_TEMPLATES: SOPTemplate[] = [
  {
    id: 'sop_listing_launch',
    title: 'Listing Launch Checklist',
    department: 'Marketing',
    ownerRole: 'marketing_coordinator',
    ownerUserId: 'u_melissa', // Melissa Gagliardi
    backupRole: 'operations_lead',
    backupUserId: 'u_ann', // Ann Gunn
    purpose: 'Ensure each new listing is prepared, reviewed, and launched consistently.',
    expectedOutcome: 'A high quality listing launched on MLS with marketing materials complete and broker approval.',
    scope: 'All residential listings launched in Nest Wilmington.',
    exclusions: 'Commercial listings or leases.',
    tags: ['listing', 'marketing', 'launch'],
    triggerType: 'request_received',
    trigger: 'Listing agreement is fully executed.',
    requiredInfo: [
      { id: 'info_address', name: 'Property address', description: 'Subject property address', dataType: 'address', required: 'yes' },
      { id: 'info_agent', name: 'Listing agent', description: 'Primary listing agent name', dataType: 'person', required: 'yes' },
      { id: 'info_agreement', name: 'Signed listing agreement', description: 'Fully signed listing agreement document file', dataType: 'document', required: 'yes' },
      { id: 'info_launch_date', name: 'Target launch date', description: 'Desired live MLS launch date', dataType: 'date', required: 'yes' },
      { id: 'info_details', name: 'Property details', description: 'MLS property stats, list price, description', dataType: 'long_text', required: 'yes' },
      { id: 'info_photo_status', name: 'Photo status', description: 'Photography completion status', dataType: 'choice', required: 'yes', example: 'Scheduled / Completed' }
    ],
    steps: [
      { id: 'll_step_1', title: 'Validate required information', instruction: 'Verify all required fields, including signed listing agreement, price, and target launch date.', assignedRole: 'marketing_coordinator', type: 'review', evidenceRequired: 'Information fields validated' },
      { id: 'll_step_2', title: 'Request missing information', instruction: 'Nudge listing agent if listing agreement or key property stats are missing.', assignedRole: 'marketing_coordinator', type: 'request_info' },
      { id: 'll_step_3', title: 'Create listing folder', instruction: 'Initialize Google Drive folder under the listings archive.', assignedRole: 'marketing_coordinator', type: 'manual', evidenceRequired: 'Listing folder URL' },
      { id: 'll_step_4', title: 'Schedule professional photography', instruction: 'Coordinate photographer booking and lockbox codes if photos are not complete.', assignedRole: 'marketing_coordinator', type: 'tool', evidenceRequired: 'Calendar event created' },
      { id: 'll_step_5', title: 'Prepare listing copy', instruction: 'Draft MLS description copy and headlines for review.', assignedRole: 'marketing_coordinator', type: 'manual' },
      { id: 'll_step_6', title: 'Prepare marketing assets', instruction: 'Create brochure, flyers, and social media tiles in design tool.', assignedRole: 'marketing_coordinator', type: 'manual', evidenceRequired: 'Marketing files link' },
      { id: 'll_step_7', title: 'Submit for Broker-in-Charge review', instruction: 'Submit listing file and marketing proofs to Jessica Keenan / Eric Knight for signoff.', assignedRole: 'owner', type: 'approval', evidenceRequired: 'BIC signoff logged' },
      { id: 'll_step_8', title: 'Publish approved listing', instruction: 'Input approved details and photos into MLS and activate.', assignedRole: 'marketing_coordinator', type: 'manual', evidenceRequired: 'MLS number' },
      { id: 'll_step_9', title: 'Confirm launch with the listing agent', instruction: 'Send final launch notification email with marketing pack download links.', assignedRole: 'marketing_coordinator', type: 'manual', evidenceRequired: 'Email confirmation sent' },
      { id: 'll_step_10', title: 'Record completion', instruction: 'Close checklist and record final links in Shapework repository.', assignedRole: 'marketing_coordinator', type: 'complete' }
    ],
    decisions: [
      { id: 'll_dec_1', title: 'Urgently close gap', condition: 'If the launch date is within two business days and photography is not complete', action: 'Notify Melissa Gagliardi immediately and escalate to the Broker-in-Charge.' }
    ],
    escalationBehavior: {
      expectedResponse: 'Expected Response: 1 hour',
      followUpDue: 'Follow-up Due: 12 hours',
      escalateAfter: 'Escalate After: 24 hours',
      recipientRole: 'owner'
    },
    completionEvidence: {
      type: 'manual',
      description: 'Listing link, approved marketing assets, and confirmation email recorded.'
    },
    governance: {
      reviewFrequencyDays: 90,
      visibility: 'workspace',
      trainingRequired: true
    },
    status: 'published',
    version: '1.0'
  },
  {
    id: 'sop_agent_onboarding',
    title: 'New-Agent Onboarding Checklist',
    department: 'Operations',
    ownerRole: 'operations_lead',
    ownerUserId: 'u_ann', // Ann Gunn
    backupRole: 'owner',
    backupUserId: 'u_owner', // Marcus Aman
    purpose: 'Provision systems, establish office access, and trigger licensing setups for onboarding real estate agents.',
    expectedOutcome: 'Agent is fully set up in CRM, MLS access is active, marketing materials are ordered, and desk space is assigned.',
    scope: 'All newly joined brokers (PB and Full BIC) in Wilmington.',
    exclusions: 'Administrative staff onboarding.',
    tags: ['onboarding', 'agent', 'licensing'],
    triggerType: 'request_received',
    trigger: 'Offer letter signed by incoming agent.',
    requiredInfo: [
      { id: 'ob_info_name', name: 'Agent Full Name', description: 'Broker name as listed on license', dataType: 'text', required: 'yes' },
      { id: 'ob_info_lic', name: 'License Number', description: 'NCREC license number', dataType: 'number', required: 'yes' },
      { id: 'ob_info_email', name: 'Personal Email', description: 'Personal contact email for setup links', dataType: 'text', required: 'yes' },
      { id: 'ob_info_start', name: 'Start Date', description: 'First physical day in office', dataType: 'date', required: 'yes' }
    ],
    steps: [
      { id: 'ob_step_1', title: 'Collect broker license details', instruction: 'Retrieve NCREC status and verify no outstanding suspension actions.', assignedRole: 'operations_lead', type: 'review', evidenceRequired: 'NCREC printout uploaded' },
      { id: 'ob_step_2', title: 'Provision G-Suite & MLS accounts', instruction: 'Create corporate email account and submit access request to local MLS.', assignedRole: 'operations_lead', type: 'tool', evidenceRequired: 'Corporate email address' },
      { id: 'ob_step_3', title: 'Order marketing starter kit', instruction: 'Submit headshot and details to Melissa for business cards and signs.', assignedRole: 'marketing_coordinator', type: 'manual', evidenceRequired: 'Print order confirmation' },
      { id: 'ob_step_4', title: 'Schedule orientation session', instruction: 'Book a 1-hour session on Day 1 for workspace overview.', assignedRole: 'operations_lead', type: 'manual', evidenceRequired: 'Calendar event URL' }
    ],
    decisions: [
      { id: 'ob_dec_1', title: 'Provision physical desk', condition: 'If agent is on the full commission plan and office presence is required', action: 'Assign physical desk coordinate in Mayfaire suite.' }
    ],
    escalationBehavior: {
      expectedResponse: 'Expected Response: 2 hours',
      followUpDue: 'Follow-up Due: 24 hours',
      escalateAfter: 'Escalate After: 48 hours',
      recipientRole: 'owner'
    },
    completionEvidence: {
      type: 'manual',
      description: 'System login verification checklist complete.'
    },
    governance: {
      reviewFrequencyDays: 180,
      visibility: 'workspace',
      trainingRequired: false
    },
    status: 'published',
    version: '1.0'
  }
];
