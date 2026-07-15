/**
 * Nest Wilmington Dashboard — Data Adapters
 * 
 * Transforms org model seed data into clean, owner-facing UI objects.
 * No SLA/RAG/Retell/vector terminology. Brokerage language only.
 */

import { orgChartService, OrgModel, OrgPosition, RoutingMatrixItem } from '../../services/orgChartService';

// ─────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────

export type ShieldSummaryCard = {
  id: string;
  label: string;
  value: number | string;
  sub: string;
  urgency: 'ok' | 'attention' | 'urgent';
};

export type NeedsRyanItem = {
  id: string;
  type: string;
  reason: string;
  currentHandler: string;
  recommendedAction: string;
  responseWindow: string;
  urgency: 'high' | 'urgent';
};

export type ProtectedItem = {
  id: string;
  request: string;
  routedTo: string;
  backup: string;
  status: 'handled' | 'in_progress' | 'pending';
  timeSaved?: string;
};

export type OpenRoleRisk = {
  id: string;
  role: string;
  status: 'open' | 'planned' | 'ai_coverage';
  gap: string;
  coveringToday: string;
  impactOnRyan: 'low' | 'moderate' | 'high';
};

export type RyanShieldData = {
  summary: ShieldSummaryCard[];
  needsRyan: NeedsRyanItem[];
  protected: ProtectedItem[];
  openRoles: OpenRoleRisk[];
};

export type RoutingTableRow = {
  id: string;
  requestType: string;
  handler: string;
  handlerTitle: string;
  backup: string;
  backupTitle: string;
  responseWindow: string;
  escalatesTo: string;
  whenRyanInvolved: string;
  status: 'ready' | 'needs_setup' | 'manager_review';
};

export type RoleMapCard = {
  id: string;
  name: string;
  title: string;
  department: string;
  handles: string[];
  backupFor: string[];
  escalatesToRyanWhen: string;
  tools: string[];
  status: 'active' | 'open' | 'planned' | 'ai';
};

export type RoleEscalationData = {
  routingTable: RoutingTableRow[];
  roleMap: RoleMapCard[];
};

export type WeeklyActivity = {
  requestsHandled: number;
  routedWithoutRyan: number;
  neededRyan: number;
  stillOpen: number;
  overdue: number;
  missingInformation: number;
};

export type HandledRow = {
  category: string;
  count: number;
  handler: string;
};

export type NeededRyanRow = {
  type: string;
  count: number;
  resolution: string;
};

export type StuckItem = {
  item: string;
  whyStuck: string;
  owner: string;
  nextStep: string;
};

export type TeamLoadEntry = {
  name: string;
  title: string;
  load: 'light' | 'normal' | 'moderate' | 'high' | 'overloaded';
  note: string;
};

export type RoleImpact = {
  role: string;
  impact: string;
  resolution: string;
};

export type RecommendedAction = {
  id: string;
  action: string;
  priority: 'high' | 'normal';
  category: string;
};

export type OwnerWeeklyBriefData = {
  weekLabel: string;
  activity: WeeklyActivity;
  handled: HandledRow[];
  neededRyan: NeededRyanRow[];
  stuck: StuckItem[];
  teamLoad: TeamLoadEntry[];
  roleImpact: RoleImpact[];
  recommendedActions: RecommendedAction[];
};

// ─────────────────────────────────────────────
// HELPER: Resolve position name by ID
// ─────────────────────────────────────────────

function posName(positions: OrgPosition[], id: string): string {
  return positions.find(p => p.id === id)?.name || 'Unknown';
}

function posTitle(positions: OrgPosition[], id: string): string {
  return positions.find(p => p.id === id)?.title || '';
}

// ─────────────────────────────────────────────
// ADAPTER 1 — Ryan Shield
// ─────────────────────────────────────────────

export function buildRyanShieldSummary(model: OrgModel): RyanShieldData {
  const { positions } = model;

  const openRoles = positions.filter(p => p.status === 'open' || p.status === 'planned');
  const aiRoles = positions.filter(p => p.status === 'virtual_ai');

  const summary: ShieldSummaryCard[] = [
    {
      id: 'needs_ryan',
      label: 'Needs Ryan',
      value: 3,
      sub: 'Items requiring principal review',
      urgency: 'urgent',
    },
    {
      id: 'routed',
      label: 'Routed Without Ryan',
      value: 24,
      sub: 'Requests handled by the team this week',
      urgency: 'ok',
    },
    {
      id: 'missing_info',
      label: 'Missing Information',
      value: 2,
      sub: 'Requests waiting on required details',
      urgency: 'attention',
    },
    {
      id: 'overdue',
      label: 'Overdue / Stuck',
      value: 1,
      sub: 'Items past their response window',
      urgency: 'attention',
    },
    {
      id: 'ownerless',
      label: 'Ownerless',
      value: 1,
      sub: 'No handler assigned yet',
      urgency: 'attention',
    },
    {
      id: 'open_role_risk',
      label: 'Open Role Risk',
      value: openRoles.length,
      sub: `${openRoles.length} unfilled seat${openRoles.length !== 1 ? 's' : ''} creating coverage gaps`,
      urgency: openRoles.length >= 2 ? 'attention' : 'ok',
    },
  ];

  const needsRyan: NeedsRyanItem[] = [
    {
      id: 'nr_1',
      type: 'Compliance / Legal Review',
      reason: 'Agent contract dispute — BIC flagged for principal awareness',
      currentHandler: 'Jessica (BIC)',
      recommendedAction: 'Brief legal counsel and confirm BIC response',
      responseWindow: '1 hour',
      urgency: 'urgent',
    },
    {
      id: 'nr_2',
      type: 'Deal at Risk',
      reason: 'Closing date has slipped. Finance task overdue. Client waiting.',
      currentHandler: 'James Fort',
      recommendedAction: 'Contact closing attorney directly',
      responseWindow: 'Same day',
      urgency: 'urgent',
    },
    {
      id: 'nr_3',
      type: 'Ownerless Request',
      reason: 'Request category has no assigned handler. Routing incomplete.',
      currentHandler: 'Unassigned',
      recommendedAction: 'Assign handler or update routing for this category',
      responseWindow: '24 hours',
      urgency: 'high',
    },
  ];

  const protectedItems: ProtectedItem[] = [
    {
      id: 'pr_1',
      request: 'Listing launch for 123 Magnolia St',
      routedTo: 'Melissa Gagliardi',
      backup: 'Ann Gunn',
      status: 'handled',
      timeSaved: '~45 min',
    },
    {
      id: 'pr_2',
      request: 'Lockbox replacement — 89 Oleander Dr',
      routedTo: 'Ann Gunn',
      backup: 'Ryan Crecelius',
      status: 'handled',
      timeSaved: '~20 min',
    },
    {
      id: 'pr_3',
      request: 'Commission question — closing March deal',
      routedTo: 'James Fort',
      backup: 'Ryan Crecelius',
      status: 'handled',
      timeSaved: '~30 min',
    },
    {
      id: 'pr_4',
      request: 'Agent branding — new headshot package',
      routedTo: 'Melissa Gagliardi',
      backup: 'Ryan Crecelius',
      status: 'in_progress',
    },
    {
      id: 'pr_5',
      request: 'Agent question — addendum language',
      routedTo: 'Jessica (BIC)',
      backup: 'Ryan Crecelius',
      status: 'handled',
      timeSaved: '~25 min',
    },
  ];

  const openRoleRisks: OpenRoleRisk[] = [
    {
      id: 'risk_coo',
      role: 'COO',
      status: 'open',
      gap: 'Operational ownership — facilities, staff, recruitment support',
      coveringToday: 'Ryan Crecelius (backup)',
      impactOnRyan: 'high',
    },
    {
      id: 'risk_front_desk',
      role: 'Front Desk',
      status: 'open',
      gap: 'Reception, guest welcome, lockbox checkouts',
      coveringToday: 'Ann Gunn',
      impactOnRyan: 'moderate',
    },
    {
      id: 'risk_va',
      role: 'Virtual Assistant',
      status: 'planned',
      gap: 'Marketing execution bandwidth',
      coveringToday: 'Melissa Gagliardi',
      impactOnRyan: 'low',
    },
    {
      id: 'risk_ai',
      role: 'AI Ops Assistant',
      status: 'ai_coverage',
      gap: 'Automated intake triage',
      coveringToday: 'AI Ops Assistant (active)',
      impactOnRyan: 'low',
    },
  ];

  return { summary, needsRyan, protected: protectedItems, openRoles: openRoleRisks };
}

// ─────────────────────────────────────────────
// ADAPTER 2 — Role & Escalation Map
// ─────────────────────────────────────────────

export function buildRoleEscalationMap(model: OrgModel): RoleEscalationData {
  const { positions, routingMatrix = [], escalationPolicies } = model;

  const escalationMap: Record<string, string> = {};
  escalationPolicies.forEach(ep => {
    escalationMap[ep.id] = ep.recommendedNextAction || 'Manager review required';
  });

  const windowLabels: Record<string, string> = {
    '4 hours': '4 hours',
    '24 hours': '1 business day',
    '48 hours': '2 business days',
    '72 hours': '3 business days',
    '12 hours': '12 hours',
    '2 hours': '2 hours',
    'Same day': 'Same day',
    '1 hour': '1 hour',
  };

  const routingTable: RoutingTableRow[] = routingMatrix.map((row: RoutingMatrixItem) => {
    const handler = positions.find(p => p.id === row.primaryOwnerPositionId);
    const backup = positions.find(p => p.id === row.backupOwnerPositionId);
    const escalation = row.escalationPolicyId ? escalationPolicies.find(e => e.id === row.escalationPolicyId) : null;

    const isRyanBackup = backup?.id === 'pos_ryan';
    const whenRyan = escalation
      ? escalation.condition.replace(/^if /i, 'When ')
      : isRyanBackup
      ? 'When primary unavailable'
      : 'When all coverage fails';

    return {
      id: row.category,
      requestType: row.category,
      handler: handler?.name || 'Unassigned',
      handlerTitle: handler?.title || '',
      backup: backup?.name || 'Ryan Crecelius',
      backupTitle: backup?.title || 'Principal Broker',
      responseWindow: windowLabels[row.sla] || row.sla,
      escalatesTo: escalation ? posName(positions, escalation.escalateToPositionId) : 'Ryan Crecelius',
      whenRyanInvolved: whenRyan,
      status: handler ? (handler.status === 'active' ? 'ready' : 'needs_setup') : 'needs_setup',
    };
  });

  // Add unknown owner row
  routingTable.push({
    id: 'unknown_owner',
    requestType: 'Unknown / No Category',
    handler: 'AI Ops Assistant',
    handlerTitle: 'AI Coworker',
    backup: 'Ann Gunn',
    backupTitle: 'Operations Director',
    responseWindow: '24 hours',
    escalatesTo: 'Ryan Crecelius',
    whenRyanInvolved: 'When category cannot be identified',
    status: 'manager_review',
  });

  const roleMap: RoleMapCard[] = [
    {
      id: 'pos_ryan',
      name: 'Ryan Crecelius',
      title: 'Principal Broker',
      department: 'Leadership',
      handles: ['Agent recruiting', 'Coaching & culture', 'Deal escalations', 'Compliance final authority'],
      backupFor: ['All open seats'],
      escalatesToRyanWhen: 'Always — this is Ryan',
      tools: ['Gmail', 'Google Calendar', 'Brokerage Dashboard'],
      status: 'active',
    },
    {
      id: 'pos_ann',
      name: 'Ann Gunn',
      title: 'Operations Director',
      department: 'Operations',
      handles: ['Office operations', 'New agent setup', 'Signs & lockboxes', 'Vendor coordination'],
      backupFor: ['Front Desk (open)', 'AI Ops Assistant'],
      escalatesToRyanWhen: 'Operations task overdue 48 hours or vendor/facility issue beyond budget',
      tools: ['Gmail', 'Google Calendar', 'Google Drive', 'Basecamp'],
      status: 'active',
    },
    {
      id: 'pos_james',
      name: 'James Fort',
      title: 'Firm Finance',
      department: 'Accounting',
      handles: ['Commission payouts', 'Bills & receipts', 'Tax preparation', 'Closing financials'],
      backupFor: [],
      escalatesToRyanWhen: 'Closing slips or finance task overdue — deal at risk',
      tools: ['QuickBooks', 'Gmail', 'Google Drive', 'Dotloop'],
      status: 'active',
    },
    {
      id: 'pos_melissa',
      name: 'Melissa Gagliardi',
      title: 'Marketing',
      department: 'Marketing',
      handles: ['Listing launches', 'Social content', 'Agent branding', 'Business cards & print'],
      backupFor: ['Virtual Assistant (planned)'],
      escalatesToRyanWhen: 'Brand direction decision or budget approval required',
      tools: ['Rechat CRM', 'Google Drive', 'Gmail', 'Social / Marketing tools'],
      status: 'active',
    },
    {
      id: 'pos_bic',
      name: 'Jessica',
      title: 'Broker-in-Charge',
      department: 'Compliance',
      handles: ['Agent questions', 'Compliance review', 'Contract questions', 'Legal risk review'],
      backupFor: [],
      escalatesToRyanWhen: 'Legal/regulatory notice, contract dispute, or compliance flag — within 1 hour',
      tools: ['Dotloop', 'Google Drive', 'Gmail'],
      status: 'active',
    },
    {
      id: 'pos_ai_ops',
      name: 'AI Ops Assistant',
      title: 'AI Coworker',
      department: 'Operations',
      handles: ['Intake triage', 'Missing info collection', 'Routing suggestions', 'Escalation detection'],
      backupFor: [],
      escalatesToRyanWhen: 'Cannot identify owner or handler after intake review',
      tools: ['AI Voice & Chat Agents', 'SMS Gateway'],
      status: 'ai',
    },
    {
      id: 'pos_coo',
      name: 'COO (Open)',
      title: 'Chief Operating Officer',
      department: 'Operations',
      handles: ['Staff management', 'Broker recruitment support', 'Office spaces', 'Sponsorships'],
      backupFor: [],
      escalatesToRyanWhen: 'N/A — Ryan is currently covering this seat',
      tools: [],
      status: 'open',
    },
    {
      id: 'pos_front_desk',
      name: 'Front Desk (Open)',
      title: 'Front Desk / Guest Services',
      department: 'Operations',
      handles: ['Reception', 'Guest welcoming', 'Lockbox checkouts', 'Office stocking'],
      backupFor: [],
      escalatesToRyanWhen: 'N/A — Ann Gunn is currently covering this seat',
      tools: [],
      status: 'open',
    },
    {
      id: 'pos_va',
      name: 'Virtual Assistant (Planned)',
      title: 'Virtual Assistant',
      department: 'Marketing',
      handles: ['Content posting', 'Graphic formatting', 'Listing launch admin support'],
      backupFor: [],
      escalatesToRyanWhen: 'N/A — Melissa is currently covering this seat',
      tools: [],
      status: 'planned',
    },
  ];

  return { routingTable, roleMap };
}

// ─────────────────────────────────────────────
// ADAPTER 3 — Owner Weekly Brief
// ─────────────────────────────────────────────

export function buildOwnerWeeklyBrief(): OwnerWeeklyBriefData {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekLabel = `Week of ${fmt(startOfWeek)} – ${fmt(endOfWeek)}`;

  const activity: WeeklyActivity = {
    requestsHandled: 31,
    routedWithoutRyan: 24,
    neededRyan: 5,
    stillOpen: 4,
    overdue: 1,
    missingInformation: 2,
  };

  const handled: HandledRow[] = [
    { category: 'Agent questions', count: 12, handler: 'Jessica (BIC)' },
    { category: 'Marketing requests', count: 5, handler: 'Melissa Gagliardi' },
    { category: 'Finance questions', count: 4, handler: 'James Fort' },
    { category: 'Operations requests', count: 3, handler: 'Ann Gunn' },
    { category: 'Intake triage', count: 7, handler: 'AI Ops Assistant' },
  ];

  const neededRyan: NeededRyanRow[] = [
    { type: 'Compliance / legal review', count: 2, resolution: 'Reviewed and cleared with BIC' },
    { type: 'Repeated agent complaint', count: 1, resolution: 'Direct call scheduled' },
    { type: 'Ownerless request', count: 1, resolution: 'Routing updated for future' },
    { type: 'Deal-at-risk item', count: 1, resolution: 'Closing attorney contacted — resolved' },
  ];

  const stuck: StuckItem[] = [
    {
      item: 'Vendor invoice approval — HVAC service',
      whyStuck: 'Over budget threshold — needs principal sign-off',
      owner: 'Ann Gunn',
      nextStep: 'Ryan to approve or reject invoice this week',
    },
    {
      item: 'Agent branding package — Smith team',
      whyStuck: 'Waiting on agent-submitted headshots',
      owner: 'Melissa Gagliardi',
      nextStep: 'Follow up with agent — 3 day deadline',
    },
  ];

  const teamLoad: TeamLoadEntry[] = [
    { name: 'Ann Gunn', title: 'Operations Director', load: 'moderate', note: 'Front desk gap adds walk-in requests' },
    { name: 'Melissa Gagliardi', title: 'Marketing', load: 'high', note: 'Two listing launches + agent branding backlog' },
    { name: 'James Fort', title: 'Firm Finance', load: 'normal', note: 'Closings on track this week' },
    { name: 'Jessica (BIC)', title: 'Broker-in-Charge', load: 'moderate', note: 'Standard compliance review volume' },
    { name: 'Ryan Crecelius', title: 'Principal Broker', load: 'high', note: 'COO seat open — operational backup overloads schedule' },
  ];

  const roleImpact: RoleImpact[] = [
    {
      role: 'COO (Open)',
      impact: 'Ryan is absorbing operational ownership, staff decisions, and recruitment tasks that should belong to a COO.',
      resolution: 'Interim decision: assign one existing team member as COO point-of-contact, or begin active search.',
    },
    {
      role: 'Front Desk (Open)',
      impact: 'Ann Gunn handles walk-in guest requests and phone coverage on top of her core operations role.',
      resolution: 'Temporary: AI Ops Assistant handles triage. Long-term: hire part-time front desk.',
    },
    {
      role: 'Virtual Assistant (Planned)',
      impact: 'Melissa is manually formatting and posting content that could be handled by a VA.',
      resolution: 'Define VA scope and begin onboarding when marketing backlog exceeds 2 weeks.',
    },
  ];

  const recommendedActions: RecommendedAction[] = [
    {
      id: 'act_1',
      action: 'Assign interim COO coverage — decide this week',
      priority: 'high',
      category: 'Open Role',
    },
    {
      id: 'act_2',
      action: 'Finish missing info for 2 open requests so they can be routed',
      priority: 'high',
      category: 'Missing Information',
    },
    {
      id: 'act_3',
      action: 'Approve or reject the HVAC vendor invoice ($1,800 threshold)',
      priority: 'high',
      category: 'Needs Ryan',
    },
    {
      id: 'act_4',
      action: 'Confirm marketing handoff process while VA is still planned',
      priority: 'normal',
      category: 'Team Load',
    },
    {
      id: 'act_5',
      action: 'Review the one ownerless request category and assign a handler',
      priority: 'normal',
      category: 'Routing Gap',
    },
  ];

  return { weekLabel, activity, handled, neededRyan, stuck, teamLoad, roleImpact, recommendedActions };
}
