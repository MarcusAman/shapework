/**
 * Deal triage (Feature Lab):
 * Flag collapsing files (inspection / appraisal / financing / title)
 * → surface Nest playbook from KB (or honest fallback)
 * → BIC/owner alert on the Tasks board
 * Human negotiates. No auto-outbound to clients.
 * Must not affect marketing creative tasks.
 */

export type CollapseKind = 'inspection' | 'appraisal' | 'financing' | 'title';

export type DealTriageAlert = {
  kinds: CollapseKind[];
  propertyAddress?: string;
  agentName?: string;
  playbookTitle: string;
  playbookExcerpt: string;
  cite?: { sopId?: string; title?: string; source: 'kb' | 'nest_playbook_fallback' };
  severity: 'high';
  humanOnly: true;
  clientOutboundBlocked: true;
  createdAt: string;
};

const KIND_PATTERNS: Array<{ kind: CollapseKind; re: RegExp }> = [
  {
    kind: 'inspection',
    re: /\b(failed?\s+inspection|inspection\s+(failed|collapse|issue|problem)|repair\s+request|seller\s+won'?t\s+repair|major\s+defect|home\s+inspection\s+(fail|issue))/i,
  },
  {
    kind: 'appraisal',
    re: /\b(low\s+appraisal|appraisal\s+(came\s+in\s+low|gap|shortfall|issue)|appraised\s+(under|below)|value\s+gap)/i,
  },
  {
    kind: 'financing',
    re: /\b(financing\s+(fell|fall|denied|collapsed|contingency)|loan\s+(denied|declined|fell\s+through)|underwriting\s+(deny|denied|fail)|mortgage\s+contingency|can'?t\s+get\s+financing)/i,
  },
  {
    kind: 'title',
    re: /\b(title\s+(defect|issue|problem|cloud|objection|curative)|cloud\s+on\s+title|lien\s+(issue|problem)|survey\s+dispute)/i,
  },
];

const FALLBACK_PLAYBOOKS: Record<
  CollapseKind,
  { title: string; excerpt: string }
> = {
  inspection: {
    title: 'Nest playbook · Inspection repair / collapse',
    excerpt:
      'Pause client messaging. Confirm inspection report + repair addendum status with the agent. BIC/owner decides repair credit vs terminate vs renegotiate. Document options on the file; human negotiates with parties — Nora does not email clients.',
  },
  appraisal: {
    title: 'Nest playbook · Appraisal gap',
    excerpt:
      'Pause client messaging. Confirm appraised value vs contract price and lender stance. BIC/owner + agent choose gap coverage, price adjust, or terminate under appraisal contingency. Human negotiates — no auto-outbound.',
  },
  financing: {
    title: 'Nest playbook · Financing contingency',
    excerpt:
      'Pause client messaging. Verify denial/underwriting letter and contingency deadlines. BIC/owner + agent evaluate extension, alternate lender, or termination. Human negotiates — Nora does not contact buyer/seller/lender unsolicited.',
  },
  title: {
    title: 'Nest playbook · Title curative',
    excerpt:
      'Pause client messaging. Confirm title commitment exceptions with closing attorney. BIC/owner tracks curative steps and dates. Human negotiates curative path — no client auto-send from Nora.',
  },
};

export function detectCollapseSignals(text: string): CollapseKind[] {
  const found = new Set<CollapseKind>();
  const blob = String(text || '');
  for (const { kind, re } of KIND_PATTERNS) {
    if (re.test(blob)) found.add(kind);
  }
  return Array.from(found);
}

export function buildDealTriageAlert(input: {
  text?: string;
  subject?: string;
  propertyAddress?: string;
  agentName?: string;
  kinds?: CollapseKind[];
  kbMatch?: { sopId?: string; title?: string; purpose?: string } | null;
}): DealTriageAlert | null {
  const blob = [input.subject, input.text].filter(Boolean).join('\n');
  const kinds =
    input.kinds && input.kinds.length > 0 ? input.kinds : detectCollapseSignals(blob);
  if (kinds.length === 0) return null;

  const primary = kinds[0];
  const fallback = FALLBACK_PLAYBOOKS[primary];
  const kb = input.kbMatch;
  const useKb = Boolean(kb?.title);

  return {
    kinds,
    propertyAddress: input.propertyAddress?.trim() || undefined,
    agentName: input.agentName?.trim() || undefined,
    playbookTitle: useKb ? String(kb!.title) : fallback.title,
    playbookExcerpt: useKb
      ? String(kb!.purpose || fallback.excerpt).slice(0, 600)
      : fallback.excerpt,
    cite: useKb
      ? { sopId: kb!.sopId, title: kb!.title, source: 'kb' }
      : { title: fallback.title, source: 'nest_playbook_fallback' },
    severity: 'high',
    humanOnly: true,
    clientOutboundBlocked: true,
    createdAt: new Date().toISOString(),
  };
}

export function formatDealTriageNotes(alert: DealTriageAlert): string {
  return [
    'DEAL TRIAGE — COLLAPSING FILE',
    `Kinds: ${alert.kinds.join(', ')}`,
    alert.propertyAddress ? `Property: ${alert.propertyAddress}` : null,
    alert.agentName ? `Agent: ${alert.agentName}` : null,
    'Severity: HIGH · Human negotiates · No client auto-outbound',
    '',
    `Playbook: ${alert.playbookTitle}`,
    alert.cite?.source === 'kb' && alert.cite.sopId
      ? `Cite: ${alert.cite.sopId}`
      : 'Cite: nest_playbook_fallback (confirm with BIC before acting)',
    '',
    alert.playbookExcerpt,
  ]
    .filter((x) => x != null)
    .join('\n');
}

export function formatDealTriageBoardBadge(alert: DealTriageAlert): string {
  return `Deal risk: ${alert.kinds.join(' · ')} · human only`;
}

type TaskLike = {
  category?: string;
  domain?: string;
  routingSnapshot?: Record<string, any>;
  dealTriage?: DealTriageAlert;
};

export function getDealTriageFromTask(task: TaskLike): DealTriageAlert | null {
  if (task.dealTriage?.kinds?.length) return task.dealTriage;
  const nested = task.routingSnapshot?.dealTriage;
  if (nested?.kinds?.length) return nested as DealTriageAlert;
  return null;
}

/** Marketing creative tasks without deal triage stay untouched. */
export function shouldBlockClientOutbound(task: TaskLike): boolean {
  const alert = getDealTriageFromTask(task);
  if (!alert) return false;
  return alert.clientOutboundBlocked === true || task.routingSnapshot?.clientOutboundBlocked === true;
}

export function dealTriageClientOutboundBlockReason(task: TaskLike): string | null {
  if (!shouldBlockClientOutbound(task)) return null;
  return 'Deal triage active — BIC/owner negotiates; no client auto-outbound.';
}
