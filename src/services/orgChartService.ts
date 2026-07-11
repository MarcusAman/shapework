export type OrgPositionStatus =
  | 'active'
  | 'open'
  | 'planned'
  | 'wanted'
  | 'fractional'
  | 'outsourced'
  | 'virtual_ai'
  | 'archived';

export type AvatarCropSettings = {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  cropShape?: 'circle' | 'rounded' | 'square';
  objectPosition?: string;
};

export type OrgPosition = {
  id: string;
  workspaceId: string;
  name: string;
  title: string;
  department?: string;
  office?: string;
  email?: string;
  phone?: string;
  reportsToPositionId?: string;
  backupPositionId?: string;
  visibilityLevel?: 'internal' | 'leadership' | 'admin';
  roleIds: string[];
  x?: number;
  y?: number;
  avatarUrl?: string;
  avatarCrop?: AvatarCropSettings;
  createdAt: string;
  updatedAt: string;

  // Future structure planning fields
  status?: OrgPositionStatus;
  isPlanned?: boolean;
  targetHireDate?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  estimatedCost?: string;
  businessCase?: string;
  hiringNotes?: string;
  coverageGap?: string;
};

export type OrgRole = {
  id: string;
  workspaceId: string;
  positionId: string;
  name: string;
  description: string;
  categories: string[];
  defaultSla?: string;
  backupOwnerPositionId?: string;
  sopIds: string[];
  escalationPolicyIds: string[];
  knowledgeDocumentIds?: string[];
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
};

export type OrgSop = {
  id: string;
  workspaceId: string;
  name: string;
  purpose?: string;
  trigger: string;
  ownerPositionId: string;
  roleId?: string;
  steps: string[];
  requiredInformation: string[];
  output?: string;
  tags: string[];
  knowledgeDocumentIds?: string[];
  completionCriteria?: string;
  notificationRules?: string;
  escalationNotes?: string;
  requestCategories?: string[];
  status?: OrgKnowledgeStatus;
  includeInAskNestOps?: boolean;
  includeInRetell?: boolean;
  includeInRouting?: boolean;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;

  // Upgraded knowledge base fields
  sourceType?: OrgKnowledgeSourceType;
  documentType?: 'policy' | 'sop' | 'checklist' | 'template' | 'training_guide' | 'vendor_document' | 'compliance_reference' | 'marketing_reference' | 'accounting_reference' | 'other';
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
  sourceUrl?: string;
  aiSummary?: string;
};

export type OrgConnection = {
  id: string;
  workspaceId: string;
  fromPositionId: string;
  toPositionId: string;
  label?: string;
  sopIds: string[];
  escalationPolicyIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type OrgConnectionType = 'reporting' | 'escalation' | 'sop' | 'ownership';

export type VisualConnection = {
  id: string;
  workspaceId: string;
  type: OrgConnectionType;
  fromPositionId: string;
  toPositionId: string;
  label?: string;
  condition?: string;
  responseWindow?: string;
  sopIds: string[];
  escalationPolicyIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type EscalationPolicy = {
  id: string;
  workspaceId: string;
  name: string;
  trigger: string;
  condition: string;
  fromPositionId?: string;
  escalateToPositionId: string;
  fallbackActivePositionId?: string;
  responseWindow: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  channels: Array<'dashboard' | 'email' | 'sms' | 'phone' | 'slack' | 'teams'>;
  requiredContext: string[];
  recommendedNextAction: string;
  saveToKnowledgeBase: boolean;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
};

export type OrgKnowledgeSourceType =
  | 'manual_sop'
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'txt'
  | 'md'
  | 'link'
  | 'template';

export type OrgKnowledgeStatus =
  | 'draft'
  | 'active'
  | 'needs_review'
  | 'archived';

export type OrgKnowledgeDocument = {
  id: string;
  workspaceId: string;
  title: string;
  sourceType: OrgKnowledgeSourceType;
  documentType?: 'policy' | 'sop' | 'checklist' | 'template' | 'training_guide' | 'vendor_document' | 'compliance_reference' | 'marketing_reference' | 'accounting_reference' | 'other';
  ownerPositionId?: string;
  ownerRoleId?: string;
  requestCategories: string[];
  tags: string[];
  status: OrgKnowledgeStatus;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  sourceUrl?: string;
  extractedText?: string;
  aiSummary?: string;
  suggestedTriggers?: string[];
  suggestedRequiredInformation?: string[];
  suggestedSteps?: string[];
  suggestedEscalationRules?: string[];
  extractionStatus: 'uploaded' | 'pending_extraction' | 'extracting' | 'extracted' | 'needs_review' | 'failed';
  extractionError?: string;
  includeInAskNestOps: boolean;
  includeInRetell: boolean;
  includeInRouting: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrgLogicNodeType = 'logic_split' | 'intake_trigger';

export type OrgLogicNode = {
  id: string;
  workspaceId: string;
  type: OrgLogicNodeType;
  label: string;
  description?: string;
  conditions?: string[];
  branches?: string[];
  defaultPath?: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
};

export type OrgModel = {
  positions: OrgPosition[];
  roles: OrgRole[];
  sops: OrgSop[];
  connections: OrgConnection[];
  visualConnections?: VisualConnection[]; // Visual Connection Map override
  escalationPolicies: EscalationPolicy[];
  routingMatrix?: RoutingMatrixItem[];
  knowledgeDocuments?: OrgKnowledgeDocument[];
  logicNodes?: OrgLogicNode[];
};

export type RoutingMatrixItem = {
  category: string;
  primaryOwnerPositionId: string;
  backupOwnerPositionId: string;
  sla: string;
  escalationPolicyId?: string;
};

// Seed defaults
const DEFAULT_POSITIONS: OrgPosition[] = [
  {
    id: 'pos_ryan',
    workspaceId: 'nest-realty-demo',
    name: 'Ryan Crecelius',
    title: 'Principal Broker',
    department: 'Leadership',
    office: 'Wilmington',
    email: 'ryan@nestrealty.com',
    phone: '910-555-0100',
    visibilityLevel: 'leadership',
    roleIds: ['role_recruiting', 'role_coaching', 'role_leadership_escalation'],
    x: 400,
    y: 50,
    avatarUrl: '/org-avatars/ryan.png',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_ann',
    workspaceId: 'nest-realty-demo',
    name: 'Ann Gunn',
    title: 'Operations Director',
    department: 'Operations',
    office: 'Wilmington',
    email: 'ann@nestrealty.com',
    phone: '910-555-0101',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'internal',
    roleIds: ['role_ops', 'role_agent_setup', 'role_signs_lockboxes', 'role_vendors'],
    x: 150,
    y: 200,
    avatarUrl: '/org-avatars/ann.png',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_james',
    workspaceId: 'nest-realty-demo',
    name: 'James Fort',
    title: 'Firm Finance',
    department: 'Accounting',
    office: 'Wilmington',
    email: 'james.fort@nestrealty.com',
    phone: '910-555-0102',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'internal',
    roleIds: ['role_closings_pay', 'role_bills_receipts', 'role_commission_status', 'role_tax_prep'],
    x: 400,
    y: 200,
    avatarUrl: '/org-avatars/james.png',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_melissa',
    workspaceId: 'nest-realty-demo',
    name: 'Melissa Gagliardi',
    title: 'Marketing',
    department: 'Marketing',
    office: 'Wilmington',
    email: 'melissa.gagliardi@nestrealty.com',
    phone: '910-555-0103',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'internal',
    roleIds: ['role_listing_launch', 'role_social_content', 'role_agent_branding', 'role_business_cards'],
    x: 650,
    y: 200,
    avatarUrl: '/org-avatars/melissa.png',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_bic',
    workspaceId: 'nest-realty-demo',
    name: 'BIC Office',
    title: 'Broker-in-Charge',
    department: 'Compliance',
    office: 'Wilmington',
    email: 'bic@nestrealty.com',
    phone: '910-555-0104',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'admin',
    roleIds: ['role_agent_support', 'role_compliance', 'role_contract_questions', 'role_risk_sensitive'],
    x: 900,
    y: 200,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_eric',
    workspaceId: 'nest-realty-demo',
    name: 'Eric',
    title: 'To Be Assigned',
    department: 'Operations / Support',
    office: 'Wilmington',
    email: 'eric@nestrealty.com',
    phone: '910-555-0105',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'internal',
    roleIds: [],
    x: 1150,
    y: 200,
    avatarUrl: '/org-avatars/eric.png',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_coo',
    workspaceId: 'nest-realty-demo',
    name: 'COO',
    title: 'Chief Operating Officer',
    department: 'Operations',
    office: 'Wilmington',
    reportsToPositionId: 'pos_ryan',
    visibilityLevel: 'internal',
    roleIds: ['role_coo'],
    x: 275,
    y: 125,
    status: 'open',
    priority: 'high',
    coverageGap: 'Operational ownership',
    businessCase: 'Ryan Crecelius currently owns too much operations leadership oversight. This position will own facilities, broker recruitment support, office spaces, staff management, and sponsorships.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_front_desk',
    workspaceId: 'nest-realty-demo',
    name: 'Front Desk',
    title: 'Front Desk / Guest Services',
    department: 'Operations',
    office: 'Wilmington',
    reportsToPositionId: 'pos_coo',
    visibilityLevel: 'internal',
    roleIds: ['role_front_desk'],
    x: 150,
    y: 350,
    status: 'open',
    priority: 'normal',
    coverageGap: 'Front desk guest welcome & lockbox checkouts',
    businessCase: 'Need full-time reception to handle incoming calls, client welcoming, and signage inventory management.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_va',
    workspaceId: 'nest-realty-demo',
    name: 'Virtual Assistant(s)',
    title: 'Virtual Assistant',
    department: 'Marketing',
    office: 'Remote',
    reportsToPositionId: 'pos_melissa',
    visibilityLevel: 'internal',
    roleIds: ['role_va'],
    x: 650,
    y: 350,
    status: 'planned',
    priority: 'normal',
    coverageGap: 'Marketing execution bandwidth support',
    businessCase: 'Provide posting, graphic formatting, and listing launch administrative support to Melissa.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pos_ai_ops',
    workspaceId: 'nest-realty-demo',
    name: 'AI Ops Assistant',
    title: 'AI Coworker',
    department: 'Operations',
    office: 'Cloud',
    reportsToPositionId: 'pos_ann',
    visibilityLevel: 'internal',
    roleIds: ['role_ai_ops'],
    x: -100,
    y: 350,
    status: 'virtual_ai',
    priority: 'normal',
    coverageGap: 'Automated intake triage & knowledge retrieval',
    businessCase: 'An automated agent that parses inbound requests, checks SOP compliance, handles missing info gathering, and suggests routing fallback to Ann.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_ROLES: OrgRole[] = [
  {
    id: 'role_recruiting',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ryan',
    name: 'Recruiting',
    description: 'Recruiting new agents to the brokerage',
    categories: ['Leadership decision'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_coaching',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ryan',
    name: 'Coaching',
    description: 'Mentoring and coaching active agents',
    categories: ['Leadership decision'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_leadership_escalation',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ryan',
    name: 'Leadership Escalation',
    description: 'Resolving complex operational and leadership bottlenecks',
    categories: ['Leadership decision'],
    sopIds: [],
    escalationPolicyIds: ['esc_deal_at_risk', 'esc_overdue_ops', 'esc_repeated_complaint'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_ops',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ann',
    name: 'Office operations',
    description: 'Daily office operations and management',
    categories: ['Office supplies', 'Room reservation'],
    sopIds: ['sop_new_hire'],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_agent_setup',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ann',
    name: 'New-agent setup',
    description: 'Onboarding and setting up new agents',
    categories: ['Office supplies'],
    sopIds: ['sop_new_hire'],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_signs_lockboxes',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ann',
    name: 'Signs and lockboxes',
    description: 'Ordering and managing lockboxes, keys, signs and riders',
    categories: ['Lockboxes / keys', 'Signs / riders'],
    sopIds: ['sop_lockbox'],
    escalationPolicyIds: ['esc_showing_blocked'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_vendors',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ann',
    name: 'Vendor coordination',
    description: 'Coordinating with office vendors and maintenance',
    categories: ['Vendor / maintenance', 'Office supplies'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_closings_pay',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_james',
    name: 'Closings and pay',
    description: 'Processing transaction closings and payouts',
    categories: ['Accounting / commissions'],
    sopIds: ['sop_commission'],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_bills_receipts',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_james',
    name: 'Bills and receipts',
    description: 'Paying office bills and recording receipts',
    categories: ['Payables / bills / receipts'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_commission_status',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_james',
    name: 'Commission status',
    description: 'Tracking commission payments and payouts',
    categories: ['Accounting / commissions'],
    sopIds: ['sop_commission'],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_tax_prep',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_james',
    name: 'Tax prep',
    description: 'Preparing tax and brokerage accounting audits',
    categories: ['Accounting / commissions'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_listing_launch',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_melissa',
    name: 'Listing launch',
    description: 'Assisting agents with launching new listings',
    categories: ['Listing marketing'],
    sopIds: ['sop_listing_launch'],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_social_content',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_melissa',
    name: 'Social content',
    description: 'Managing brokerage social media profiles and content',
    categories: ['Marketing request'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_agent_branding',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_melissa',
    name: 'Agent branding',
    description: 'Designing custom branding and collateral for agents',
    categories: ['Agent branding', 'Business cards / print materials'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_business_cards',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_melissa',
    name: 'Business cards',
    description: 'Ordering business cards and print marketing materials',
    categories: ['Business cards / print materials'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_agent_support',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_bic',
    name: 'Agent support',
    description: 'Supporting agents with day-to-day contract and transaction compliance',
    categories: ['Agent question'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_compliance',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_bic',
    name: 'Compliance',
    description: 'Reviewing transaction files for document compliance',
    categories: ['Compliance'],
    sopIds: ['sop_compliance'],
    escalationPolicyIds: ['esc_compliance_risk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_contract_questions',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_bic',
    name: 'Contract questions',
    description: 'Answering complex contract and regulatory questions',
    categories: ['Contract / transaction issue'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_risk_sensitive',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_bic',
    name: 'Risk-sensitive issues',
    description: 'Mitigating legal, regulatory, and financial risks for the brokerage',
    categories: ['Compliance', 'Contract / transaction issue'],
    sopIds: [],
    escalationPolicyIds: ['esc_compliance_risk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_coo',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_coo',
    name: 'COO Operations & Recruitment',
    description: 'Operational ownership, staff management, broker recruitment, compliance support, office spaces, and sponsorships.',
    categories: ['Leadership decision'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_front_desk',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_front_desk',
    name: 'Guest Services & Upkeep',
    description: 'Reception, hospitality, signs and lockboxes, office stocking, upkeep, facilities maintenance.',
    categories: ['Office supplies', 'Room reservation'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_va',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_va',
    name: 'Administrative Marketing Support',
    description: 'Marketing execution support, posting, formatting, ordering, admin support.',
    categories: ['Marketing request'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role_ai_ops',
    workspaceId: 'nest-realty-demo',
    positionId: 'pos_ai_ops',
    name: 'AI Intake Triage & Lookup',
    description: 'Intake triage, SOP lookup, missing-info collection, routing suggestions, escalation detection.',
    categories: ['AI / Virtual'],
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_SOPS: OrgSop[] = [
  {
    id: 'sop_new_hire',
    workspaceId: 'nest-realty-demo',
    name: 'New-hire setup',
    trigger: 'New agent signs agreement',
    purpose: 'Get a new agent onboarded and active in key tools.',
    ownerPositionId: 'pos_ann',
    roleId: 'role_agent_setup',
    steps: ['Create GSuite email', 'Add to Slack', 'Order starter business cards'],
    requiredInformation: ['Agent Name', 'Start Date', 'Email prefix'],
    output: 'Agent loaded in tools and active.',
    tags: ['onboarding', 'operations'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sop_listing_launch',
    workspaceId: 'nest-realty-demo',
    name: 'Listing launch checklist',
    trigger: 'Listing agreement fully executed',
    purpose: 'Prepare MLS data and marketing assets for a new property.',
    ownerPositionId: 'pos_melissa',
    roleId: 'role_listing_launch',
    steps: ['Upload to MLS', 'Order professional photos', 'Schedule social post'],
    requiredInformation: ['Listing Address', 'Price', 'MLS description'],
    output: 'Listing live on MLS.',
    tags: ['marketing', 'listing'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sop_commission',
    workspaceId: 'nest-realty-demo',
    name: 'Commission request',
    trigger: 'Closing package received',
    purpose: 'Process commission checks for agents post-closing.',
    ownerPositionId: 'pos_james',
    roleId: 'role_closings_pay',
    steps: ['Verify commission structure', 'Draft wire instruction', 'Authorize broker check'],
    requiredInformation: ['Transaction ID', 'Broker amount', 'Settlement statement'],
    output: 'Commissions paid to agent.',
    tags: ['accounting', 'finance'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sop_lockbox',
    workspaceId: 'nest-realty-demo',
    name: 'Lockbox issue',
    trigger: 'Agent reports broken shackle',
    purpose: 'Troubleshoot and replace problematic lockboxes.',
    ownerPositionId: 'pos_ann',
    roleId: 'role_signs_lockboxes',
    steps: ['Lookup lockbox serial', 'Locate master code', 'Issue physical replacement'],
    requiredInformation: ['Lockbox Serial', 'Property Address'],
    output: 'Working replacement lockbox assigned.',
    tags: ['lockbox', 'operations'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sop_compliance',
    workspaceId: 'nest-realty-demo',
    name: 'Compliance question',
    trigger: 'Agent asks about legal addendum',
    purpose: 'Verify compliance on customized addendum forms.',
    ownerPositionId: 'pos_bic',
    roleId: 'role_compliance',
    steps: ['Review standard NCREC guidelines', 'Draft custom addendum language', 'Verify broker signature'],
    requiredInformation: ['Client Name', 'Addendum Type'],
    output: 'Compliant addendum prepared.',
    tags: ['compliance', 'legal'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_CONNECTIONS: OrgConnection[] = [
  {
    id: 'con_ryan_james',
    workspaceId: 'nest-realty-demo',
    fromPositionId: 'pos_james',
    toPositionId: 'pos_ryan',
    label: 'Finance Oversight',
    sopIds: [],
    escalationPolicyIds: ['esc_deal_at_risk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'con_ann_ryan',
    workspaceId: 'nest-realty-demo',
    fromPositionId: 'pos_ann',
    toPositionId: 'pos_ryan',
    label: 'Operations Oversight',
    sopIds: [],
    escalationPolicyIds: ['esc_overdue_ops', 'esc_repeated_complaint'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'con_melissa_ryan',
    workspaceId: 'nest-realty-demo',
    fromPositionId: 'pos_melissa',
    toPositionId: 'pos_ryan',
    label: 'Branding Alignment',
    sopIds: [],
    escalationPolicyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'con_bic_ryan',
    workspaceId: 'nest-realty-demo',
    fromPositionId: 'pos_bic',
    toPositionId: 'pos_ryan',
    label: 'Risk & Compliance Escalation',
    sopIds: [],
    escalationPolicyIds: ['esc_compliance_risk'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_ESCALATIONS: EscalationPolicy[] = [
  {
    id: 'esc_deal_at_risk',
    workspaceId: 'nest-realty-demo',
    name: 'Deal at risk',
    trigger: 'Closing slips',
    condition: 'if closing date slips or finance task overdue',
    fromPositionId: 'pos_james',
    escalateToPositionId: 'pos_ryan',
    responseWindow: 'Same day',
    urgency: 'urgent',
    channels: ['dashboard', 'sms', 'email'],
    requiredContext: ['Transaction reference', 'Client complaint details'],
    recommendedNextAction: 'Contact the closing attorney immediately',
    saveToKnowledgeBase: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'esc_compliance_risk',
    workspaceId: 'nest-realty-demo',
    name: 'Compliance/legal risk',
    trigger: 'Regulatory notice or contract dispute',
    condition: 'if task overdue by 12h or legal risk flag set',
    fromPositionId: 'pos_bic',
    escalateToPositionId: 'pos_ryan',
    responseWindow: '1 hour',
    urgency: 'urgent',
    channels: ['dashboard', 'slack', 'phone'],
    requiredContext: ['Notice description', 'Involved agent'],
    recommendedNextAction: 'Brief the legal counsel and notify BIC',
    saveToKnowledgeBase: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'esc_overdue_ops',
    workspaceId: 'nest-realty-demo',
    name: 'Overdue operations task',
    trigger: 'Administrative tasks unresolved',
    condition: 'if Ann task overdue 48h',
    fromPositionId: 'pos_ann',
    escalateToPositionId: 'pos_ryan',
    responseWindow: '24 hours',
    urgency: 'high',
    channels: ['dashboard', 'email'],
    requiredContext: ['Overdue task description'],
    recommendedNextAction: 'Review coordinator workloads',
    saveToKnowledgeBase: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'esc_repeated_complaint',
    workspaceId: 'nest-realty-demo',
    name: 'Repeated agent complaint',
    trigger: 'Agent files complaint 3rd time',
    condition: 'if task overdue by 24h or repeated complaint status',
    fromPositionId: 'pos_ann',
    escalateToPositionId: 'pos_ryan',
    responseWindow: 'Same day',
    urgency: 'high',
    channels: ['dashboard', 'slack'],
    requiredContext: ['Agent details', 'Previous history'],
    recommendedNextAction: 'Schedule a direct call with the agent',
    saveToKnowledgeBase: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'esc_missing_owner',
    workspaceId: 'nest-realty-demo',
    name: 'Missing owner',
    trigger: 'Unknown category assignment',
    condition: 'if task has no owner',
    escalateToPositionId: 'pos_ryan',
    responseWindow: '24 hours',
    urgency: 'normal',
    channels: ['dashboard', 'email'],
    requiredContext: ['Task name'],
    recommendedNextAction: 'Update routing matrix in Settings',
    saveToKnowledgeBase: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'esc_showing_blocked',
    workspaceId: 'nest-realty-demo',
    name: 'Sign/lockbox blocks showing',
    trigger: 'Lockbox jam or missing sign at listing',
    condition: 'if showing blocks scheduled',
    fromPositionId: 'pos_ann',
    escalateToPositionId: 'pos_ryan',
    responseWindow: '2 hours',
    urgency: 'high',
    channels: ['dashboard', 'sms', 'phone'],
    requiredContext: ['Listing Address', 'Showing time'],
    recommendedNextAction: 'Dispatch local courier to replace device',
    saveToKnowledgeBase: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_ROUTING_MATRIX: RoutingMatrixItem[] = [
  { category: 'Agent question', primaryOwnerPositionId: 'pos_bic', backupOwnerPositionId: 'pos_ryan', sla: '4 hours' },
  { category: 'Compliance', primaryOwnerPositionId: 'pos_bic', backupOwnerPositionId: 'pos_ryan', sla: '24 hours', escalationPolicyId: 'esc_compliance_risk' },
  { category: 'Contract / transaction issue', primaryOwnerPositionId: 'pos_bic', backupOwnerPositionId: 'pos_ryan', sla: '4 hours' },
  { category: 'Accounting / commissions', primaryOwnerPositionId: 'pos_james', backupOwnerPositionId: 'pos_ryan', sla: '24 hours', escalationPolicyId: 'esc_deal_at_risk' },
  { category: 'Payables / bills / receipts', primaryOwnerPositionId: 'pos_james', backupOwnerPositionId: 'pos_ryan', sla: '48 hours' },
  { category: 'Marketing request', primaryOwnerPositionId: 'pos_melissa', backupOwnerPositionId: 'pos_ryan', sla: '24 hours' },
  { category: 'Listing marketing', primaryOwnerPositionId: 'pos_melissa', backupOwnerPositionId: 'pos_ryan', sla: '12 hours' },
  { category: 'Agent branding', primaryOwnerPositionId: 'pos_melissa', backupOwnerPositionId: 'pos_ryan', sla: '72 hours' },
  { category: 'Business cards / print materials', primaryOwnerPositionId: 'pos_melissa', backupOwnerPositionId: 'pos_ann', sla: '48 hours' },
  { category: 'Signs / riders', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_melissa', sla: '24 hours' },
  { category: 'Lockboxes / keys', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_ryan', sla: '12 hours', escalationPolicyId: 'esc_showing_blocked' },
  { category: 'Office supplies', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_ryan', sla: '48 hours' },
  { category: 'Room reservation', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_ryan', sla: '2 hours' },
  { category: 'Vendor / maintenance', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_ryan', sla: '24 hours' },
  { category: 'Event support', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_melissa', sla: '72 hours' },
  { category: 'IT / systems', primaryOwnerPositionId: 'pos_ann', backupOwnerPositionId: 'pos_ryan', sla: '12 hours' },
  { category: 'Leadership decision', primaryOwnerPositionId: 'pos_ryan', backupOwnerPositionId: 'pos_bic', sla: '24 hours' }
];

export const DEFAULT_KNOWLEDGE_DOCUMENTS: OrgKnowledgeDocument[] = [
  {
    id: 'kd_onboarding',
    workspaceId: 'nest-realty-demo',
    title: 'New Agent Onboarding Checklist',
    sourceType: 'pdf',
    documentType: 'checklist',
    ownerPositionId: 'pos_ann',
    ownerRoleId: 'role_agent_setup',
    requestCategories: ['IT / systems', 'Office supplies'],
    tags: ['onboarding', 'checklist'],
    status: 'active',
    fileName: 'new_agent_onboarding.pdf',
    fileSizeBytes: 245000,
    mimeType: 'application/pdf',
    uploadedBy: 'Ann Gunn',
    uploadedAt: new Date().toISOString(),
    aiSummary: 'A comprehensive checklist for onboarding new agents, outlining account creation steps for Slack, email, and Dotloop, plus card printing orders.',
    suggestedSteps: ['Create GSuite email profile', 'Add to Slack workspace', 'Order business cards'],
    extractionStatus: 'extracted',
    includeInAskNestOps: true,
    includeInRetell: true,
    includeInRouting: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kd_listing_marketing',
    workspaceId: 'nest-realty-demo',
    title: 'Listing Launch Checklist',
    sourceType: 'pdf',
    documentType: 'sop',
    ownerPositionId: 'pos_melissa',
    ownerRoleId: 'role_listing_launch',
    requestCategories: ['Listing marketing', 'Marketing request'],
    tags: ['marketing', 'listing'],
    status: 'active',
    fileName: 'listing_launch_guide.pdf',
    fileSizeBytes: 312000,
    mimeType: 'application/pdf',
    uploadedBy: 'Melissa Gagliardi',
    uploadedAt: new Date().toISOString(),
    aiSummary: 'Outlines listing entry instructions in MLS, photographer scheduling, and sign installation rules.',
    extractionStatus: 'extracted',
    includeInAskNestOps: true,
    includeInRetell: false,
    includeInRouting: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kd_commission_policy',
    workspaceId: 'nest-realty-demo',
    title: 'Commission Request Policy',
    sourceType: 'doc',
    documentType: 'policy',
    ownerPositionId: 'pos_james',
    ownerRoleId: 'role_closings_pay',
    requestCategories: ['Accounting / commissions'],
    tags: ['accounting', 'commission'],
    status: 'active',
    fileName: 'commission_payout_policy.doc',
    fileSizeBytes: 185000,
    mimeType: 'application/msword',
    uploadedBy: 'James Fort',
    uploadedAt: new Date().toISOString(),
    aiSummary: 'Details the validation steps required before paying agent commission checks, closing package checks, and wire transfers.',
    extractionStatus: 'extracted',
    includeInAskNestOps: true,
    includeInRetell: true,
    includeInRouting: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kd_compliance_sop',
    workspaceId: 'nest-realty-demo',
    title: 'Compliance Question SOP',
    sourceType: 'manual_sop',
    documentType: 'sop',
    ownerPositionId: 'pos_bic',
    ownerRoleId: 'role_compliance',
    requestCategories: ['Compliance', 'Contract / transaction issue'],
    tags: ['compliance', 'legal'],
    status: 'active',
    fileName: 'compliance_sop.md',
    fileSizeBytes: 95000,
    mimeType: 'text/markdown',
    uploadedBy: 'BIC Office',
    uploadedAt: new Date().toISOString(),
    aiSummary: 'Process for reviewing contract disclosures and escalations for legal review.',
    extractionStatus: 'extracted',
    includeInAskNestOps: true,
    includeInRetell: false,
    includeInRouting: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kd_sign_lockbox_policy',
    workspaceId: 'nest-realty-demo',
    title: 'Sign and Lockbox Policy',
    sourceType: 'pdf',
    documentType: 'policy',
    ownerPositionId: 'pos_ann',
    ownerRoleId: 'role_signs_lockboxes',
    requestCategories: ['Signs / riders', 'Lockboxes / keys'],
    tags: ['lockbox', 'signs'],
    status: 'needs_review',
    fileName: 'signs_and_lockboxes_rules.pdf',
    fileSizeBytes: 412000,
    mimeType: 'application/pdf',
    uploadedBy: 'Ann Gunn',
    uploadedAt: new Date().toISOString(),
    aiSummary: 'Draft sign placement rules and key security access logs.',
    extractionStatus: 'pending_extraction',
    includeInAskNestOps: true,
    includeInRetell: true,
    includeInRouting: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const orgChartService = {
  getOrgChart(workspaceId: string): OrgModel {
    const key = `org_chart_${workspaceId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.knowledgeDocuments) {
          parsed.knowledgeDocuments = DEFAULT_KNOWLEDGE_DOCUMENTS.filter(d => d.workspaceId === workspaceId);
        }
        if (parsed.positions) {
          parsed.positions = parsed.positions.map((p: any) => {
            const seedPos = DEFAULT_POSITIONS.find(dp => dp.id === p.id);
            const status = p.status || seedPos?.status || 'active';
            const avatarCrop = p.avatarCrop || { x: 0, y: 0, scale: 1, rotation: 0, cropShape: 'circle' };
            if (seedPos && !p.avatarUrl) {
              return { ...p, status, avatarCrop, avatarUrl: seedPos.avatarUrl };
            }
            return { ...p, status, avatarCrop };
          });
          
          const requiredPosIds = ['pos_eric', 'pos_coo', 'pos_front_desk', 'pos_va', 'pos_ai_ops'];
          requiredPosIds.forEach(id => {
            if (!parsed.positions.some((p: any) => p.id === id)) {
              const seedPos = DEFAULT_POSITIONS.find(dp => dp.id === id);
              if (seedPos) {
                parsed.positions.push({ ...seedPos, workspaceId });
              }
            }
          });
        }
        if (parsed.roles) {
          const requiredRoleIds = ['role_coo', 'role_front_desk', 'role_va', 'role_ai_ops'];
          requiredRoleIds.forEach(id => {
            if (!parsed.roles.some((r: any) => r.id === id)) {
              const seedRole = DEFAULT_ROLES.find(dr => dr.id === id);
              if (seedRole) {
                parsed.roles.push({ ...seedRole, workspaceId });
              }
            }
          });
        }
        parsed.logicNodes = parsed.logicNodes || [];
        return parsed;
      } catch (e) {
        console.error("Failed to parse cached org chart, using defaults", e);
      }
    }
    
    // Return default model
    return {
      positions: DEFAULT_POSITIONS.map(p => ({
        ...p,
        avatarCrop: p.avatarCrop || { x: 0, y: 0, scale: 1, rotation: 0, cropShape: 'circle' }
      })),
      roles: DEFAULT_ROLES,
      sops: DEFAULT_SOPS,
      connections: DEFAULT_CONNECTIONS,
      escalationPolicies: DEFAULT_ESCALATIONS,
      routingMatrix: DEFAULT_ROUTING_MATRIX,
      knowledgeDocuments: DEFAULT_KNOWLEDGE_DOCUMENTS.filter(d => d.workspaceId === workspaceId),
      logicNodes: []
    };
  },

  saveOrgChart(workspaceId: string, model: OrgModel): void {
    const key = `org_chart_${workspaceId}`;
    localStorage.setItem(key, JSON.stringify(model));
  },

  getTemplate(templateName: string, workspaceId: string): OrgModel {
    const defaultTime = () => new Date().toISOString();
    if (templateName === 'Brokerage Default') {
      return {
        positions: DEFAULT_POSITIONS.map(p => ({ ...p, workspaceId, createdAt: defaultTime(), updatedAt: defaultTime(), avatarCrop: p.avatarCrop || { x: 0, y: 0, scale: 1, rotation: 0, cropShape: 'circle' } })),
        roles: DEFAULT_ROLES.map(r => ({ ...r, workspaceId, createdAt: defaultTime(), updatedAt: defaultTime() })),
        sops: DEFAULT_SOPS.map(s => ({ ...s, workspaceId, createdAt: defaultTime(), updatedAt: defaultTime() })),
        connections: [],
        escalationPolicies: DEFAULT_ESCALATIONS.map(e => ({ ...e, workspaceId, createdAt: defaultTime(), updatedAt: defaultTime() })),
        routingMatrix: DEFAULT_ROUTING_MATRIX,
        knowledgeDocuments: DEFAULT_KNOWLEDGE_DOCUMENTS.filter(d => d.workspaceId === 'nest-realty-demo').map(d => ({ ...d, workspaceId, createdAt: defaultTime(), updatedAt: defaultTime() })),
        logicNodes: []
      };
    }
    
    if (templateName === 'Small Business') {
      const positions: OrgPosition[] = [
        { id: 'pos_sb_ceo', workspaceId, name: 'Founder & CEO', title: 'CEO', department: 'Leadership', office: 'Corporate', visibilityLevel: 'leadership', roleIds: ['role_sb_ceo'], x: 500, y: 50, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_sb_ops', workspaceId, name: 'Operations Manager', title: 'Operations Director', department: 'Operations', office: 'Corporate', reportsToPositionId: 'pos_sb_ceo', visibilityLevel: 'internal', roleIds: ['role_sb_ops'], x: 300, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_sb_finance', workspaceId, name: 'Finance Lead', title: 'Bookkeeper', department: 'Accounting', office: 'Corporate', reportsToPositionId: 'pos_sb_ceo', visibilityLevel: 'internal', roleIds: ['role_sb_finance'], x: 700, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_sb_marketing', workspaceId, name: 'Marketing Specialist', title: 'Marketing', department: 'Marketing', office: 'Corporate', reportsToPositionId: 'pos_sb_ops', visibilityLevel: 'internal', roleIds: ['role_sb_marketing'], x: 200, y: 350, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_sb_support', workspaceId, name: 'Customer Support Lead', title: 'Support Specialist', department: 'Support', office: 'Corporate', reportsToPositionId: 'pos_sb_ops', visibilityLevel: 'internal', roleIds: ['role_sb_support'], x: 400, y: 350, createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const roles: OrgRole[] = [
        { id: 'role_sb_ceo', workspaceId, positionId: 'pos_sb_ceo', name: 'Strategic Direction', description: 'Sets company strategy, vision, and growth milestones', categories: ['Leadership decision'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_sb_ops', workspaceId, positionId: 'pos_sb_ops', name: 'Daily Operations', description: 'Manages workspace configurations, onboarding, and physical assets', categories: ['IT / systems', 'Office supplies'], sopIds: ['sop_sb_onboard'], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_sb_finance', workspaceId, positionId: 'pos_sb_finance', name: 'Finance & Invoicing', description: 'Accounts payable, ledger audits, and payroll processing', categories: ['Payables / bills / receipts', 'Accounting / commissions'], sopIds: ['sop_sb_billing'], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_sb_marketing', workspaceId, positionId: 'pos_sb_marketing', name: 'Lead Campaigns', description: 'Coordinates social campaigns, branding guidelines, and newsletters', categories: ['Marketing request', 'Agent branding'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_sb_support', workspaceId, positionId: 'pos_sb_support', name: 'Ticket Resolution', description: 'First point of contact for customer issue resolution and escalations', categories: ['Room reservation', 'IT / systems'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const sops: OrgSop[] = [
        { id: 'sop_sb_onboard', workspaceId, name: 'New hire accounts setup', trigger: 'Offer letter signed', purpose: 'Provision email and credentials for incoming staff.', ownerPositionId: 'pos_sb_ops', roleId: 'role_sb_ops', steps: ['Create Google Workspace Profile', 'Invite to Slack channels'], requiredInformation: ['Full Name', 'Department'], tags: ['onboarding', 'operations'], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'sop_sb_billing', workspaceId, name: 'Billing dispute verification', trigger: 'Customer flags discrepancy', purpose: 'Verify invoice history against active pricing tables.', ownerPositionId: 'pos_sb_finance', roleId: 'role_sb_finance', steps: ['Retrieve invoice number', 'Audit QB ledger line', 'Submit correction draft'], requiredInformation: ['Invoice ID', 'Reported Amount'], tags: ['billing', 'finance'], createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const escalationPolicies: EscalationPolicy[] = [
        {
          id: 'esc_sb_billing_risk',
          workspaceId,
          name: 'Financial dispute escalation',
          trigger: 'Invoice correction exceeds $500',
          condition: 'if correction exceeds $500 threshold',
          fromPositionId: 'pos_sb_finance',
          escalateToPositionId: 'pos_sb_ceo',
          responseWindow: '12 hours',
          urgency: 'high',
          channels: ['dashboard', 'email'],
          requiredContext: ['Invoice reference', 'Disputed discrepancy value'],
          recommendedNextAction: 'Review transaction ledger and seek Founder approval',
          saveToKnowledgeBase: true,
          createdAt: defaultTime(),
          updatedAt: defaultTime()
        }
      ];

      const routingMatrix: RoutingMatrixItem[] = [
        { category: 'IT / systems', primaryOwnerPositionId: 'pos_sb_ops', backupOwnerPositionId: 'pos_sb_ceo', sla: '12 hours' },
        { category: 'Office supplies', primaryOwnerPositionId: 'pos_sb_ops', backupOwnerPositionId: 'pos_sb_ceo', sla: '48 hours' },
        { category: 'Accounting / commissions', primaryOwnerPositionId: 'pos_sb_finance', backupOwnerPositionId: 'pos_sb_ceo', sla: '24 hours', escalationPolicyId: 'esc_sb_billing_risk' },
        { category: 'Payables / bills / receipts', primaryOwnerPositionId: 'pos_sb_finance', backupOwnerPositionId: 'pos_sb_ceo', sla: '48 hours' },
        { category: 'Marketing request', primaryOwnerPositionId: 'pos_sb_marketing', backupOwnerPositionId: 'pos_sb_ops', sla: '24 hours' },
        { category: 'Leadership decision', primaryOwnerPositionId: 'pos_sb_ceo', backupOwnerPositionId: 'pos_sb_ops', sla: '24 hours' }
      ];

      return { positions, roles, sops, connections: [], escalationPolicies, routingMatrix, knowledgeDocuments: [], logicNodes: [] };
    }

    if (templateName === 'Real Estate Team') {
      const positions: OrgPosition[] = [
        { id: 'pos_ret_leader', workspaceId, name: 'Team Leader', title: 'Lead Agent', department: 'Sales', office: 'Downtown', visibilityLevel: 'leadership', roleIds: ['role_ret_leader'], x: 500, y: 50, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_ret_tc', workspaceId, name: 'Transaction Manager', title: 'TC Coordinator', department: 'Operations', office: 'Downtown', reportsToPositionId: 'pos_ret_leader', visibilityLevel: 'internal', roleIds: ['role_ret_tc'], x: 300, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_ret_agent', workspaceId, name: 'Buyer Agent Partner', title: 'Showing Partner', department: 'Sales', office: 'Downtown', reportsToPositionId: 'pos_ret_leader', visibilityLevel: 'internal', roleIds: ['role_ret_agent'], x: 700, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_ret_marketing', workspaceId, name: 'Marketing Coordinator', title: 'Social Manager', department: 'Marketing', office: 'Downtown', reportsToPositionId: 'pos_ret_tc', visibilityLevel: 'internal', roleIds: ['role_ret_marketing'], x: 300, y: 350, createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const roles: OrgRole[] = [
        { id: 'role_ret_leader', workspaceId, positionId: 'pos_ret_leader', name: 'Rainmaker / Listing', description: 'Attracts new listing inventories, manages principal clients', categories: ['Leadership decision'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_ret_tc', workspaceId, positionId: 'pos_ret_tc', name: 'Contract-to-Close compliance', description: 'Manages escrow transactions, loops, compliance audit checklists', categories: ['Contract / transaction issue', 'Accounting / commissions'], sopIds: ['sop_ret_closing'], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_ret_agent', workspaceId, positionId: 'pos_ret_agent', name: 'Buyer representations', description: 'Assists buyers, shows properties, coordinates feedback forms', categories: ['Agent question'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_ret_marketing', workspaceId, positionId: 'pos_ret_marketing', name: 'Listing launch promotions', description: 'Prepares brochures, flyers, schedules photographer, posts updates', categories: ['Listing marketing', 'Marketing request'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const sops: OrgSop[] = [
        { id: 'sop_ret_closing', workspaceId, name: 'Loop audit compliance', trigger: 'Contract goes under agreement', purpose: 'Verify signature and disclosure files prior to closing.', ownerPositionId: 'pos_ret_tc', roleId: 'role_ret_tc', steps: ['Confirm buyer signature', 'Upload executed contract to transaction system', 'Check lead paint addendum'], requiredInformation: ['Property Address', 'Executed date'], tags: ['compliance', 'operations'], createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const escalationPolicies: EscalationPolicy[] = [
        {
          id: 'esc_ret_missing_docs',
          workspaceId,
          name: 'Missing executed disclosures',
          trigger: 'Closing scheduled in 48 hours and missing signatures',
          condition: 'if missing signature 48h before closing',
          fromPositionId: 'pos_ret_tc',
          escalateToPositionId: 'pos_ret_leader',
          responseWindow: '4 hours',
          urgency: 'urgent',
          channels: ['dashboard', 'sms'],
          requiredContext: ['Property Reference', 'Missing document name'],
          recommendedNextAction: 'Call listing agent immediately to chase signatures',
          saveToKnowledgeBase: true,
          createdAt: defaultTime(),
          updatedAt: defaultTime()
        }
      ];

      const routingMatrix: RoutingMatrixItem[] = [
        { category: 'Contract / transaction issue', primaryOwnerPositionId: 'pos_ret_tc', backupOwnerPositionId: 'pos_ret_leader', sla: '4 hours', escalationPolicyId: 'esc_ret_missing_docs' },
        { category: 'Accounting / commissions', primaryOwnerPositionId: 'pos_ret_tc', backupOwnerPositionId: 'pos_ret_leader', sla: '24 hours' },
        { category: 'Listing marketing', primaryOwnerPositionId: 'pos_ret_marketing', backupOwnerPositionId: 'pos_ret_tc', sla: '12 hours' },
        { category: 'Marketing request', primaryOwnerPositionId: 'pos_ret_marketing', backupOwnerPositionId: 'pos_ret_tc', sla: '24 hours' },
        { category: 'Agent question', primaryOwnerPositionId: 'pos_ret_agent', backupOwnerPositionId: 'pos_ret_leader', sla: '4 hours' },
        { category: 'Leadership decision', primaryOwnerPositionId: 'pos_ret_leader', backupOwnerPositionId: 'pos_ret_tc', sla: '24 hours' }
      ];

      return { positions, roles, sops, connections: [], escalationPolicies, routingMatrix, knowledgeDocuments: [], logicNodes: [] };
    }

    if (templateName === 'Multi-office Brokerage') {
      const positions: OrgPosition[] = [
        { id: 'pos_mob_owner', workspaceId, name: 'Principal Broker Owner', title: 'Managing Partner', department: 'Leadership', office: 'Raleigh', visibilityLevel: 'leadership', roleIds: ['role_mob_owner'], x: 500, y: 50, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_mob_wilm', workspaceId, name: 'Managing Broker - Wilmington', title: 'BIC - Wilmington', department: 'Compliance', office: 'Wilmington', reportsToPositionId: 'pos_mob_owner', visibilityLevel: 'internal', roleIds: ['role_mob_wilm'], x: 250, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_mob_ral', workspaceId, name: 'Managing Broker - Raleigh', title: 'BIC - Raleigh', department: 'Compliance', office: 'Raleigh', reportsToPositionId: 'pos_mob_owner', visibilityLevel: 'internal', roleIds: ['role_mob_ral'], x: 500, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_mob_compliance', workspaceId, name: 'Compliance Director', title: 'Chief Risk Officer', department: 'Compliance', office: 'Raleigh', reportsToPositionId: 'pos_mob_owner', visibilityLevel: 'admin', roleIds: ['role_mob_compliance'], x: 750, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'pos_mob_ops', workspaceId, name: 'Operations Director', title: 'Ops Lead', department: 'Operations', office: 'Raleigh', reportsToPositionId: 'pos_mob_owner', visibilityLevel: 'internal', roleIds: ['role_mob_ops'], x: 950, y: 200, createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const roles: OrgRole[] = [
        { id: 'role_mob_owner', workspaceId, positionId: 'pos_mob_owner', name: 'Regional strategy', description: 'Drives regional growth, legal escalations, and board compliance oversight', categories: ['Leadership decision'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_mob_wilm', workspaceId, positionId: 'pos_mob_wilm', name: 'Wilmington Office Compliance', description: 'Oversees contract reviews, local agent training and licensing in Wilmington', categories: ['Agent question', 'Compliance'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_mob_ral', workspaceId, positionId: 'pos_mob_ral', name: 'Raleigh Office Compliance', description: 'Oversees contract reviews, local agent training and licensing in Raleigh', categories: ['Agent question', 'Compliance'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_mob_compliance', workspaceId, positionId: 'pos_mob_compliance', name: 'Corporate Legal Risk Board', description: 'Resolves complex regulatory notices, audits files and manages corporate insurance', categories: ['Contract / transaction issue'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() },
        { id: 'role_mob_ops', workspaceId, positionId: 'pos_mob_ops', name: 'Centralized services billing', description: 'Centralized invoicing, supply setup, tools integration licenses', categories: ['Accounting / commissions', 'IT / systems'], sopIds: [], escalationPolicyIds: [], createdAt: defaultTime(), updatedAt: defaultTime() }
      ];

      const sops: OrgSop[] = [];
      const escalationPolicies: EscalationPolicy[] = [];
      const routingMatrix: RoutingMatrixItem[] = [
        { category: 'Compliance', primaryOwnerPositionId: 'pos_mob_compliance', backupOwnerPositionId: 'pos_mob_owner', sla: '24 hours' },
        { category: 'Contract / transaction issue', primaryOwnerPositionId: 'pos_mob_compliance', backupOwnerPositionId: 'pos_mob_owner', sla: '4 hours' },
        { category: 'Agent question', primaryOwnerPositionId: 'pos_mob_ral', backupOwnerPositionId: 'pos_mob_wilm', sla: '4 hours' },
        { category: 'IT / systems', primaryOwnerPositionId: 'pos_mob_ops', backupOwnerPositionId: 'pos_mob_owner', sla: '12 hours' },
        { category: 'Accounting / commissions', primaryOwnerPositionId: 'pos_mob_ops', backupOwnerPositionId: 'pos_mob_owner', sla: '24 hours' }
      ];

      return { positions, roles, sops, connections: [], escalationPolicies, routingMatrix, knowledgeDocuments: [], logicNodes: [] };
    }

    // Blank Canvas
    return {
      positions: [
        { id: 'pos_blank_head', workspaceId, name: 'Principal Leader', title: 'CEO / Principal', department: 'Leadership', office: 'Main', visibilityLevel: 'leadership', roleIds: [], x: 500, y: 80, createdAt: defaultTime(), updatedAt: defaultTime() }
      ],
      roles: [],
      sops: [],
      connections: [],
      escalationPolicies: [],
      routingMatrix: [],
      knowledgeDocuments: [],
      logicNodes: []
    };
  },

  exportOrgChartToKnowledgeBase(
    workspaceId: string, 
    model: OrgModel, 
    filter: 'all' | 'ask_nest_ops' | 'retell' | 'active' = 'all'
  ): string {
    let md = `# Workspace Operating Knowledge Base\n\n`;
    md += `**Workspace**: ${workspaceId === 'nest-realty-demo' ? 'Nest Realty' : workspaceId}\n`;
    md += `**Export Target**: ${filter.toUpperCase()}\n`;
    md += `**Generated**: ${new Date().toLocaleDateString()}\n\n`;
    md += `This document serves as the operational source of truth for routing rules, standard operating procedures, and escalation policies.\n\n`;

    // 1. Positions
    md += `## Positions\n\n`;
    model.positions.forEach(pos => {
      const status = pos.status || 'active';
      md += `### Seat: ${pos.title} (${pos.name})\n`;
      md += `- **Department**: ${pos.department || 'N/A'}\n`;
      md += `- **Email**: ${pos.email || 'N/A'}\n`;
      md += `- **Status**: ${status.toUpperCase()}\n`;
      
      if (['open', 'planned', 'wanted'].includes(status)) {
        if (pos.priority) md += `- **Planning Priority**: ${pos.priority.toUpperCase()}\n`;
        if (pos.targetHireDate) md += `- **Target Hire Date**: ${pos.targetHireDate}\n`;
        if (pos.estimatedCost) md += `- **Estimated Budget**: ${pos.estimatedCost}\n`;
        if (pos.coverageGap) md += `- **Coverage Gap**: ${pos.coverageGap}\n`;
      }
      
      if (status === 'virtual_ai') {
        md += `- **AI Tools/Capabilities**: ${pos.phone || 'Integrations'}\n`;
        if (pos.backupPositionId) {
          const fallback = model.positions.find(p => p.id === pos.backupPositionId);
          if (fallback) md += `- **Human Fallback Owner**: ${fallback.name} (${fallback.title})\n`;
        }
      }
      
      if (pos.reportsToPositionId) {
        const reportsTo = model.positions.find(p => p.id === pos.reportsToPositionId);
        if (reportsTo) md += `- **Reports To**: ${reportsTo.title}\n`;
      }
      md += `\n`;
    });

    // 2. Roles
    md += `## Roles\n\n`;
    model.roles.forEach(role => {
      const pos = model.positions.find(p => p.id === role.positionId);
      md += `### Role: ${role.name}\n`;
      md += `- **Owner Seat**: ${pos ? pos.title : 'N/A'}\n`;
      md += `- **Description**: ${role.description}\n`;
      md += `- **Request Categories**: ${role.categories.join(', ')}\n`;
      md += `\n`;
    });

    // 3. Routing Matrix
    md += `## Routing Matrix\n\n`;
    md += `| Request Category | Primary Owner | Backup Owner | Target SLA | Escalation Link |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    if (model.routingMatrix) {
      model.routingMatrix.forEach(row => {
        const primary = model.positions.find(p => p.id === row.primaryOwnerPositionId);
        const backup = model.positions.find(p => p.id === row.backupOwnerPositionId);
        const esc = model.escalationPolicies.find(p => p.id === row.escalationPolicyId);
        md += `| ${row.category} | ${primary ? primary.title : 'Unknown'} | ${backup ? backup.title : 'Unknown'} | ${row.sla} | ${esc ? esc.name : 'None'} |\n`;
      });
    }
    md += `\n`;

    // 4. SOPs
    md += `## SOPs\n\n`;
    const filteredSops = model.sops.filter(sop => {
      if (filter === 'active') return true; // Default active
      return true;
    });

    filteredSops.forEach(sop => {
      const owner = model.positions.find(p => p.id === sop.ownerPositionId);
      md += `### SOP: ${sop.name}\n`;
      md += `- **Trigger**: ${sop.trigger}\n`;
      md += `- **Purpose**: ${sop.purpose || 'N/A'}\n`;
      md += `- **Owner Seat**: ${owner ? owner.title : 'N/A'}\n`;
      md += `- **Required Information**:\n`;
      sop.requiredInformation.forEach(info => {
        md += `  - ${info}\n`;
      });
      md += `- **Execution Steps**:\n`;
      sop.steps.forEach((step, idx) => {
        md += `  ${idx + 1}. ${step}\n`;
      });
      if (sop.output) md += `- **Expected Output**: ${sop.output}\n`;
      md += `\n`;
    });

    // 5. Uploaded Knowledge Documents
    md += `## Uploaded Knowledge Documents\n\n`;
    const docs = model.knowledgeDocuments || [];
    const filteredDocs = docs.filter(doc => {
      if (filter === 'active' && doc.status === 'archived') return false;
      if (filter === 'ask_nest_ops' && !doc.includeInAskNestOps) return false;
      if (filter === 'retell' && !doc.includeInRetell) return false;
      return true;
    });

    if (filteredDocs.length === 0) {
      md += `*No uploaded knowledge documents found for this filter combination.*\n\n`;
    } else {
      filteredDocs.forEach(doc => {
        const ownerPos = model.positions.find(p => p.id === doc.ownerPositionId);
        const ownerRole = model.roles.find(r => r.id === doc.ownerRoleId);
        md += `### Document: ${doc.title}\n`;
        md += `- **File Name**: ${doc.fileName || 'N/A'}\n`;
        md += `- **Type**: ${doc.sourceType.toUpperCase()}\n`;
        md += `- **Document Classification**: ${doc.documentType || 'other'}\n`;
        md += `- **Attached Position**: ${ownerPos ? ownerPos.title : 'N/A'}\n`;
        md += `- **Attached Role**: ${ownerRole ? ownerRole.name : 'N/A'}\n`;
        md += `- **Tags**: ${doc.tags.join(', ') || 'None'}\n`;
        md += `- **AI Summary**: ${doc.aiSummary || 'Not summarized'}\n`;
        if (doc.suggestedSteps && doc.suggestedSteps.length > 0) {
          md += `- **Extracted Steps**:\n`;
          doc.suggestedSteps.forEach(step => {
            md += `  - ${step}\n`;
          });
        }
        md += `- **Ask Nest Ops Integrated**: ${doc.includeInAskNestOps ? 'YES' : 'NO'}\n`;
        md += `- **Retell AI Integrated**: ${doc.includeInRetell ? 'YES' : 'NO'}\n`;
        md += `\n`;
      });
    }

    // 6. Escalation Policies
    md += `## Escalation Policies\n\n`;
    model.escalationPolicies.forEach(policy => {
      const target = model.positions.find(p => p.id === policy.escalateToPositionId);
      md += `### Policy: ${policy.name}\n`;
      md += `- **Trigger Condition**: ${policy.trigger}\n`;
      md += `- **Rule**: ${policy.condition}\n`;
      md += `- **Escalate To**: ${target ? target.title : 'N/A'}\n`;
      if (target && ['open', 'planned', 'wanted'].includes(target.status || '')) {
        const fallback = model.positions.find(p => p.id === policy.fallbackActivePositionId);
        md += `- **Fallback Active Owner**: ${fallback ? fallback.name : 'Ann Gunn'} (${fallback ? fallback.title : 'Operations Lead'})\n`;
      }
      md += `- **Response Window**: ${policy.responseWindow}\n`;
      md += `- **Urgency**: ${policy.urgency.toUpperCase()}\n`;
      md += `- **Notification Channels**: ${policy.channels.join(', ')}\n`;
      md += `- **Recommended Next Action**: ${policy.recommendedNextAction}\n`;
      md += `\n`;
    });

    // 7. Visual Connections Map
    md += `## Visual Connections Map\n\n`;
    const connectionsToExport: any[] = [];

    // Gather reporting connections dynamically
    model.positions.forEach(pos => {
      if (pos.reportsToPositionId) {
        const parent = model.positions.find(p => p.id === pos.reportsToPositionId);
        if (parent) {
          connectionsToExport.push({
            type: 'REPORTING',
            from: `${pos.name} (${pos.title})`,
            to: `${parent.name} (${parent.title})`,
            label: 'Reports To'
          });
        }
      }
    });

    // Gather escalation connections dynamically
    model.escalationPolicies.forEach(policy => {
      if (policy.fromPositionId && policy.escalateToPositionId) {
        const fromPos = model.positions.find(p => p.id === policy.fromPositionId);
        const toPos = model.positions.find(p => p.id === policy.escalateToPositionId);
        if (fromPos && toPos) {
          connectionsToExport.push({
            type: 'ESCALATION',
            from: `${fromPos.name} (${fromPos.title})`,
            to: `${toPos.name} (${toPos.title})`,
            label: `Escalation: ${policy.name} (${policy.condition})`
          });
        }
      }
    });

    // Gather explicit custom connections
    if (model.connections) {
      model.connections.forEach(c => {
        const fromPos = model.positions.find(p => p.id === c.fromPositionId);
        const toPos = model.positions.find(p => p.id === c.toPositionId);
        if (fromPos && toPos) {
          connectionsToExport.push({
            type: 'CUSTOM/SOP',
            from: `${fromPos.name} (${fromPos.title})`,
            to: `${toPos.name} (${toPos.title})`,
            label: c.label || 'SOP Link'
          });
        }
      });
    }

    if (connectionsToExport.length === 0) {
      md += `*No connections mapped.*\n\n`;
    } else {
      connectionsToExport.forEach(conn => {
        md += `- **[${conn.type}]**: From **${conn.from}** to **${conn.to}** -- *${conn.label}*\n`;
      });
      md += `\n`;
    }

    return md;
  },

  exportRetellKB(workspaceId: string, model: OrgModel): string {
    let md = `# RETELL AI CUSTOM VOICE AGENT KNOWLEDGE BASE\n\n`;
    md += `**Workspace**: ${workspaceId === 'nest-realty-demo' ? 'Nest Realty' : workspaceId}\n`;
    md += `**Optimized for**: Conversational NLP & Real-time Live Call Voice Agent Routing\n\n`;
    
    md += `## Voice Agent Routing Rules\n`;
    md += `Below is the primary routing grid. When a client speaks a request matching these categories, state the primary owner and backup owner:\n\n`;
    if (model.routingMatrix) {
      model.routingMatrix.forEach(row => {
        const primary = model.positions.find(p => p.id === row.primaryOwnerPositionId);
        const backup = model.positions.find(p => p.id === row.backupOwnerPositionId);
        md += `- **Request Category**: "${row.category}"\n`;
        
        if (primary) {
          const pStatus = primary.status || 'active';
          if (['open', 'planned', 'wanted'].includes(pStatus)) {
            let fallbackId = primary.backupPositionId || primary.reportsToPositionId || 'pos_ann';
            let fallbackObj = model.positions.find(p => p.id === fallbackId);
            if (!fallbackObj || (fallbackObj.status && fallbackObj.status !== 'active')) {
              fallbackObj = model.positions.find(p => p.id === 'pos_ann') || model.positions.find(p => p.id === 'pos_ryan');
            }
            md += `  - Route to: ${fallbackObj ? fallbackObj.name : 'Unknown'} (${fallbackObj ? fallbackObj.title : 'Unknown'}) [FALLBACK: primary seat ${primary.name} is future/unstaffed]\n`;
          } else {
            md += `  - Route to: ${primary.name} (${primary.title})\n`;
          }
        } else {
          md += `  - Route to: Unknown (Unknown)\n`;
        }

        md += `  - SLA target: ${row.sla}\n`;
        if (backup) {
          const bStatus = backup.status || 'active';
          if (['open', 'planned', 'wanted'].includes(bStatus)) {
            md += `  - Backup route: Ann Gunn (Operations Lead) [FALLBACK: backup seat ${backup.name} is future/unstaffed]\n`;
          } else {
            md += `  - Backup route: ${backup.name} (${backup.title})\n`;
          }
        }
        md += `\n`;
      });
    }

    md += `## Standard Operating Procedures (SOPs)\n\n`;
    model.sops.forEach(sop => {
      md += `### SOP Checklist: ${sop.name}\n`;
      md += `- **Trigger Speech**: "${sop.trigger}"\n`;
      md += `- **Purpose**: ${sop.purpose || 'N/A'}\n`;
      md += `- **Steps voice assistant must verify**:\n`;
      sop.steps.forEach((step, idx) => {
        md += `  - Step ${idx + 1}: ${step}\n`;
      });
      md += `- **Required details from caller**:\n`;
      sop.requiredInformation.forEach(info => {
        md += `  - Confirm: ${info}\n`;
      });
      md += `\n`;
    });

    md += `## Escalation Instructions\n\n`;
    model.escalationPolicies.forEach(policy => {
      const target = model.positions.find(p => p.id === policy.escalateToPositionId);
      md += `### Escalation trigger: ${policy.name}\n`;
      md += `- **Urgency level**: ${policy.urgency.toUpperCase()}\n`;
      md += `- **Rule**: ${policy.condition}\n`;
      
      if (target) {
        const tStatus = target.status || 'active';
        if (['open', 'planned', 'wanted'].includes(tStatus)) {
          const fallback = model.positions.find(p => p.id === policy.fallbackActivePositionId);
          md += `- **Notify**: ${fallback ? fallback.name : 'Ann Gunn'} (${fallback ? fallback.title : 'Operations Lead'}) [FALLBACK: primary escalation target ${target.name} is future/unstaffed]\n`;
        } else {
          md += `- **Notify**: ${target.name} (${target.title})\n`;
        }
      } else {
        md += `- **Notify**: N/A\n`;
      }
      
      md += `- **Next step instruction**: "${policy.recommendedNextAction}"\n`;
      md += `\n`;
    });

    md += `## Reference Document Summaries\n\n`;
    const docs = model.knowledgeDocuments || [];
    const retellDocs = docs.filter(d => d.includeInRetell && d.status !== 'archived');
    
    if (retellDocs.length === 0) {
      md += `*No external files or checklist PDFs synced for Voice Agent context.*\n`;
    } else {
      retellDocs.forEach(doc => {
        md += `### Reference Doc: ${doc.title}\n`;
        md += `- **Document type**: ${doc.documentType || 'other'}\n`;
        if (doc.extractionStatus !== 'extracted') {
          md += `- **Status WARNING**: Document uploaded but not yet extracted.\n`;
        } else {
          md += `- **Conversational Summary**: "${doc.aiSummary}"\n`;
          if (doc.suggestedSteps && doc.suggestedSteps.length > 0) {
            md += `- **Actionable Checklist Items**:\n`;
            doc.suggestedSteps.forEach(step => {
              md += `  - Verify: ${step}\n`;
            });
          }
        }
        md += `\n`;
      });
    }

    return md;
  }
};
