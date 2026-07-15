import { OpsRequest, OwnerRole, AssetInventoryItem, SOP } from './opsBlueprintTypes';

export const SEEDED_OWNER_ROLES: OwnerRole[] = [
  {
    id: 'role_ryan',
    name: 'regional_leader',
    personName: 'Ryan',
    department: 'Leadership & Strategy',
    responsibilities: ['Overall leadership visibility', 'Brokerage decisions', 'Cross-office issues', 'Overdue tasks escalation', 'High-risk compliance review'],
    notificationPreference: { email: true, sms: true, frequency: 'immediate' },
    escalationRules: 'Escalate to Ryan immediately if task remains unassigned or blocked > 24 hours, or has critical/risk flags.'
  },
  {
    id: 'role_ann',
    name: 'operations_manager',
    personName: 'Ann',
    department: 'Office Operations',
    responsibilities: ['Office readiness & keys', 'Signs & riders checkout inventory', 'Vendor maintenance', 'Room reservations coordination', 'Supplies & events planning'],
    notificationPreference: { email: true, sms: false, frequency: 'daily_digest' },
    escalationRules: 'Escalate office issues to Ann if pending vendor scheduling > 48 hours.'
  },
  {
    id: 'role_james',
    name: 'accounting_manager',
    personName: 'James',
    department: 'Accounting & Payroll',
    responsibilities: ['Commissions auditing', 'Accounts payables and vendor billing', 'Receipts & check deposits', 'Tax prep files collection', 'Trust accounts supervision'],
    notificationPreference: { email: true, sms: false, frequency: 'daily_digest' },
    escalationRules: 'Escalate commissions dispute if pending payout approval > 24 hours after closing.'
  },
  {
    id: 'role_melissa',
    name: 'marketing_manager',
    personName: 'Melissa',
    department: 'Marketing & Design',
    responsibilities: ['Listing marketing packages', 'Social campaigns', 'Business cards & stationery', 'Open house promotions', 'A-Frame & rider designs'],
    notificationPreference: { email: true, sms: false, frequency: 'daily_digest' },
    escalationRules: 'Escalate to Melissa if listing package intake remains uncompleted > 5 business days.'
  },
  {
    id: 'role_bic',
    name: 'bic',
    personName: 'BIC Demo User',
    department: 'Compliance & Contract Risk',
    responsibilities: ['Compliance checks & file auditing', 'License CE verification', 'Dispute resolution', 'Contract & transaction advisory'],
    notificationPreference: { email: true, sms: true, frequency: 'immediate' },
    escalationRules: 'Escalate to BIC immediately if agent reports transaction earnest money dispute.'
  },
  {
    id: 'role_triage',
    name: 'triage_operator',
    personName: 'Shapework Triage',
    department: 'Operational Triage Desk',
    responsibilities: ['Classifying unrouted agent inquiries', 'Assigning proper department roles', 'Closing duplicates'],
    notificationPreference: { email: false, sms: false, frequency: 'daily_digest' },
    escalationRules: 'Triage ticket must be routed to a department lead within 4 hours of receipt.'
  }
];

export const SEEDED_OPS_REQUESTS: OpsRequest[] = [
  {
    id: 'req_1',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Agent contract compliance check question',
    description: 'Agent requested guidance on a custom lease-option clause wording to ensure it is compliant with NCREC rules.',
    category: 'compliance',
    source: 'dashboard',
    requesterName: 'Sarah Jenkins',
    requesterEmail: 'sarah.j@nestrealty.com',
    requesterRole: 'operations_lead',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'BIC Demo User',
    assignedRole: 'bic',
    priority: 'high',
    status: 'new',
    slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    linkedAgent: 'Sarah Jenkins',
    linkedProperty: '102 Pine Street',
    linkedListing: 'lst_102_pine',
    notes: 'Awaiting BIC response'
  },
  {
    id: 'req_2',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Commission payroll verification request on recent closing',
    description: 'Agent submitted closing documents for 742 Evergreen Terrace and wants to verify the payout split deduction is correct.',
    category: 'accounting_commissions',
    source: 'email',
    requesterName: 'Diane Ross',
    requesterEmail: 'diane.ross@nestrealty.com',
    requesterRole: 'transaction_coordinator',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'James',
    assignedRole: 'accounting_manager',
    priority: 'normal',
    status: 'assigned',
    slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    linkedAgent: 'Diane Ross',
    linkedProperty: '742 Evergreen Terrace',
    notes: 'James auditing the Rechat ledger.'
  },
  {
    id: 'req_3',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Listing launch promo flyer design',
    description: 'Need listing flyer and social templates created for a brand new $1.2M property listing on Wrightsville Beach.',
    category: 'listing_marketing',
    source: 'rechat',
    requesterName: 'Marcus',
    requesterEmail: 'marcus@shapework.co',
    requesterRole: 'admin',
    officeLocation: 'Wrightsville Office',
    assignedOwner: 'Melissa',
    assignedRole: 'marketing_manager',
    priority: 'high',
    status: 'in_progress',
    slaDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    linkedProperty: '124 Ocean Blvd',
    notes: 'Melissa drafting social collateral'
  },
  {
    id: 'req_4',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Conference room booking scheduling conflict',
    description: 'Double booking detected for Conference Room A between the 2PM Agent Training and a private client closing presentation.',
    category: 'room_reservation',
    source: 'hallway',
    requesterName: 'Sarah Jenkins',
    requesterEmail: 'sarah.j@nestrealty.com',
    requesterRole: 'operations_lead',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'Ann',
    assignedRole: 'operations_manager',
    priority: 'normal',
    status: 'assigned',
    slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    notes: 'Ann checking if training can move to the open lounge.'
  },
  {
    id: 'req_5',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Sign low stock alert in Wilmington storage room',
    description: 'We are completely out of Nest branded A-Frame open house signs in the storage closet. Order immediate replacements.',
    category: 'signs_riders',
    source: 'dashboard',
    requesterName: 'Ann',
    requesterEmail: 'ann@nestrealty.com',
    requesterRole: 'operations_manager',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'Ann',
    assignedRole: 'operations_manager',
    priority: 'high',
    status: 'in_progress',
    slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    notes: 'Invoice drafted in QuickBooks pending approvals'
  },
  {
    id: 'req_6',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Unclear policy regarding agent team splits',
    description: 'Agent team asks if we can support a customized tiered splits model inside the Rechat integration module.',
    category: 'unknown_owner',
    source: 'sms',
    requesterName: 'Adam',
    requesterEmail: 'adam@shapework.co',
    requesterRole: 'admin',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'Shapework Triage',
    assignedRole: 'triage_operator',
    priority: 'normal',
    status: 'new',
    slaDueAt: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    escalationLevel: 0,
    notes: 'Awaiting triage classification assignment.'
  },
  {
    id: 'req_7',
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title: 'Operating expenses and lease cost trends review',
    description: 'Rise in office rent and facilities upkeep costs requires a leadership review for the Wilmington branch.',
    category: 'leadership_decision',
    source: 'dashboard',
    requesterName: 'Ryan',
    requesterEmail: 'ryan@nestrealty.com',
    requesterRole: 'regional_leader',
    officeLocation: 'Wilmington HQ',
    assignedOwner: 'Ryan',
    assignedRole: 'regional_leader',
    priority: 'high',
    status: 'escalated',
    slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    escalationLevel: 1,
    notes: 'Escalated to Ryan'
  }
];

export const SEEDED_ASSETS: AssetInventoryItem[] = [
  {
    id: 'ast_1',
    organizationId: 'nest-realty',
    assetType: 'yard_sign',
    label: 'Nest Realty Yard Sign #001',
    assetCode: 'NS-YS-001',
    qrCodeValue: 'https://shapework.co/qr/NS-YS-001',
    status: 'available',
    officeLocation: 'Wilmington HQ',
    replacementCost: 75.00
  },
  {
    id: 'ast_2',
    organizationId: 'nest-realty',
    assetType: 'yard_sign',
    label: 'Nest Realty Yard Sign #002',
    assetCode: 'NS-YS-002',
    qrCodeValue: 'https://shapework.co/qr/NS-YS-002',
    status: 'checked_out',
    currentHolder: 'Sarah Jenkins',
    assignedAgent: 'Sarah Jenkins',
    linkedProperty: '102 Pine Street',
    officeLocation: 'Wilmington HQ',
    checkoutDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expectedReturnDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    replacementCost: 75.00
  },
  {
    id: 'ast_3',
    organizationId: 'nest-realty',
    assetType: 'rider',
    label: 'Open House Rider #014',
    assetCode: 'NS-RD-014',
    qrCodeValue: 'https://shapework.co/qr/NS-RD-014',
    status: 'available',
    officeLocation: 'Wrightsville Office',
    replacementCost: 20.00
  },
  {
    id: 'ast_4',
    organizationId: 'nest-realty',
    assetType: 'lockbox',
    label: 'Supra Lockbox #022',
    assetCode: 'NS-LB-022',
    qrCodeValue: 'https://shapework.co/qr/NS-LB-022',
    status: 'overdue',
    currentHolder: 'Diane Ross',
    assignedAgent: 'Diane Ross',
    linkedProperty: '742 Evergreen Terrace',
    officeLocation: 'Wilmington HQ',
    checkoutDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expectedReturnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    replacementCost: 150.00,
    notes: 'Overdue by 3 days. Agent nudge sent.'
  },
  {
    id: 'ast_5',
    organizationId: 'nest-realty',
    assetType: 'key',
    label: 'Wrightsville HQ Keys Set #008',
    assetCode: 'NS-KY-008',
    qrCodeValue: 'https://shapework.co/qr/NS-KY-008',
    status: 'checked_out',
    currentHolder: 'Marcus',
    assignedAgent: 'Marcus',
    officeLocation: 'Wrightsville Office',
    checkoutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expectedReturnDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    replacementCost: 15.00
  },
  {
    id: 'ast_6',
    organizationId: 'nest-realty',
    assetType: 'open_house_kit',
    label: 'Premium Open House Kit #004',
    assetCode: 'NS-OHK-004',
    qrCodeValue: 'https://shapework.co/qr/NS-OHK-004',
    status: 'missing',
    officeLocation: 'Wilmington HQ',
    replacementCost: 250.00,
    notes: 'Last seen at 104 Southport closing. Marked missing.'
  }
];

export const SEEDED_SOPS: SOP[] = [
  {
    id: 'sop_1',
    organizationId: 'nest-realty',
    title: 'Leadership Escalation SOP',
    department: 'Leadership',
    ownerRole: 'regional_leader',
    trigger: 'A compliance dispute remains unresolved > 24h, or a client file flags critical risk indices.',
    steps: [
      'Department manager flags request as Escalated and assigns Ryan as owner.',
      'Shapework triggers critical email & SMS alerts to Ryan.',
      'Ryan conducts review and updates resolution notes, or delegates to BIC.'
    ],
    sla: '24 Hours',
    escalationPath: 'Direct review by regional leader.',
    relatedCategories: ['leadership_decision', 'compliance']
  },
  {
    id: 'sop_2',
    organizationId: 'nest-realty',
    title: 'Agent Compliance Intake SOP',
    department: 'Compliance',
    ownerRole: 'bic',
    trigger: 'Agent submits transaction contract questions or NCREC disclosures for review.',
    steps: [
      'Intake system routes request automatically to the BIC Queue.',
      'BIC reviews document provisions and provides contract guidance notes.',
      'Approved resolutions are registered to the compliance archive ledger.'
    ],
    sla: '48 Hours',
    escalationPath: 'Escalate to Ryan / Regional Leader after 48 hours.',
    relatedCategories: ['compliance', 'contract_transaction', 'agent_question']
  },
  {
    id: 'sop_3',
    organizationId: 'nest-realty',
    title: 'Accounting & Payout SOP',
    department: 'Accounting',
    ownerRole: 'accounting_manager',
    trigger: 'Agent submits commission verification splits or trust deposit request.',
    steps: [
      'Triage system routes commission request to James (Accounting).',
      'James audits transaction splits inside Rechat & matches logs in QuickBooks.',
      'James issues check/deposit wire receipt and updates Shapework status to resolved.'
    ],
    sla: '48 Hours',
    escalationPath: 'Escalate splits dispute to BIC or Ryan.',
    relatedCategories: ['accounting_commissions', 'payables_bills_receipts']
  },
  {
    id: 'sop_4',
    organizationId: 'nest-realty',
    title: 'Marketing Launch Request SOP',
    department: 'Marketing',
    ownerRole: 'marketing_manager',
    trigger: 'Agent submits listing launch promotion package intake.',
    steps: [
      'Auto-routes listing request to Melissa (Marketing).',
      'Melissa coordinates templates and designs flyer/social items.',
      'Draft items uploaded to Google Drive folder for agent download approval.'
    ],
    sla: '5 Business Days',
    escalationPath: 'Escalate to Melissa or Operations Lead.',
    relatedCategories: ['marketing_request', 'listing_marketing', 'agent_branding']
  },
  {
    id: 'sop_5',
    organizationId: 'nest-realty',
    title: 'Office Operations SOP',
    department: 'Operations',
    ownerRole: 'operations_manager',
    trigger: 'Inquiry regarding facilities room booking, lockboxes, or keys stock.',
    steps: [
      'Inquiry routed to Ann (Operations).',
      'Ann verifies reserves or resolves booking conflict.',
      'Updates system log once maintenance or supplies are completed.'
    ],
    sla: '24 Hours',
    escalationPath: 'Escalate vendor delay > 48h to Ann.',
    relatedCategories: ['office_supplies', 'room_reservation', 'vendor_maintenance']
  },
  {
    id: 'sop_6',
    organizationId: 'nest-realty',
    title: 'Sign & Lockbox Checkout SOP',
    department: 'Cross-role Operations',
    ownerRole: 'operations_manager',
    trigger: 'Agent checks out sign, key or lockbox for active listing.',
    steps: [
      'Ann logs checkout in the Asset Inventory Ledger with pickup expected return dates.',
      'If expected return date is exceeded, Shapework marks status Overdue.',
      'Weekly summaries bubble overdue items to Ann and Ryan dashboards.'
    ],
    sla: 'None',
    escalationPath: 'Mark as missing after 7 days overdue.',
    relatedCategories: ['signs_riders', 'lockboxes_keys']
  },
  {
    id: 'sop_7',
    organizationId: 'nest-realty',
    title: 'Unknown Owner Triage SOP',
    department: 'Cross-role Operations',
    ownerRole: 'triage_operator',
    trigger: 'Inbound signal with unclear category or department destination.',
    steps: [
      'Ticket routes to Shapework Triage queue.',
      'Triage operator reads description and classifies with a department category.',
      'Assigns appropriate owner role and sets SLA duration.'
    ],
    sla: '4 Hours',
    escalationPath: 'Escalate unassigned triaged tickets to Ann after 4 hours.',
    relatedCategories: ['unknown_owner']
  }
];

export const SEEDED_CAMERAS = [
  {
    id: 'cam_sign_room_001',
    workspaceId: 'nest-realty-demo',
    name: 'Sign Room Camera',
    provider: 'tapo',
    locationName: 'Nest Realty Wilmington sign storage',
    status: 'connected',
    liveRelayUrl: 'http://localhost:5000/video_feed',
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEEDED_CAMERA_EVENTS = [
  {
    id: 'camev_001',
    workspaceId: 'nest-realty-demo',
    cameraId: 'cam_sign_room_001',
    eventType: 'motion_detected',
    status: 'new',
    snapshotUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
    confidence: 0.92,
    suggestedAction: 'Review activity near yard sign rack.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'camev_002',
    workspaceId: 'nest-realty-demo',
    cameraId: 'cam_sign_room_001',
    eventType: 'possible_checkout',
    status: 'needs_review',
    snapshotUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80',
    confidence: 0.88,
    suggestedAction: 'Confirm sign checkout for Agent Ryan.',
    linkedAssetId: 'ast_1',
    linkedAgentName: 'Ryan',
    linkedProperty: '152 Edgewater Lane, Wilmington, NC 28403',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'camev_003',
    workspaceId: 'nest-realty-demo',
    cameraId: 'cam_sign_room_001',
    eventType: 'unmatched_activity',
    status: 'needs_review',
    snapshotUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80',
    confidence: 0.75,
    suggestedAction: 'Unmatched human presence detected near lockbox shelves.',
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'camev_004',
    workspaceId: 'nest-realty-demo',
    cameraId: 'cam_sign_room_001',
    eventType: 'manual_snapshot',
    status: 'needs_review',
    snapshotUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    suggestedAction: 'Manual snapshot captured by Ann.',
    createdAt: new Date(Date.now() - 300000).toISOString()
  }
];

export const SEEDED_ASSET_LEDGER = [
  {
    id: 'ledger_001',
    workspaceId: 'nest-realty-demo',
    assetId: 'ast_1',
    action: 'checkout',
    source: 'manual',
    actorName: 'Ann',
    actorEmail: 'ann@nestrealty.com',
    agentName: 'Ryan',
    property: '152 Edgewater Lane, Wilmington, NC 28403',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Manual inventory checkout'
  }
];
