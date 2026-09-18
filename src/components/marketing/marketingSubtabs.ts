export type MarketingSubtab =
  | "requests"
  | "calls"
  | "today"
  | "va";

export const MARKETING_SUBTABS: { id: MarketingSubtab; label: string; secondaryLabel?: string }[] = [
  { id: "requests", label: "Tasks" },
  { id: "calls", label: "Calls", secondaryLabel: "(910) 507-2047" },
  { id: "today", label: "Today's Queue" },
  { id: "va", label: "Workspace" },
] satisfies Array<{
  id: MarketingSubtab;
  label: string;
  secondaryLabel?: string;
}>;

export const LEGACY_SUBTAB_ALIASES: Record<string, MarketingSubtab> = {
  today: "today",
  "today-board": "today",
  "today_board": "today",
  tasks: "requests",
  "all-tasks": "requests",
  "marketing-tasks": "requests",
  "operational-tasks": "requests",
  requests: "requests",
  workboard: "requests",
  templates: "requests",
  campaigns: "requests",
  queue: "requests",
  va: "va",
  va_workspace: "va",
  "va-workspace": "va",
  calls: "calls",
  intake: "calls",
  intake_log: "calls",
  "intake-log": "calls",
  "voice-intake": "calls",
  "call-logs": "calls",
  comps: "requests",
  "spatial-comps": "requests",
  "comp-map": "requests",
  "market-map": "requests",
  "offer-map": "requests",
  roi: "requests",
  "executive-roi": "requests",
  "marketing-roi": "requests",
  "roi-command-center": "requests",
  recruiting: "requests",
  "market-share": "requests",
  "market_share": "requests",
  producers: "requests",
  bic_compliance: "requests",
  "bic-compliance": "requests",
  bic: "requests",
  compliance: "requests",
  trust: "requests",
  "trust-accounts": "requests",
  "trust_accounts": "requests",
  nora_employee: "requests",
  "nora-employee": "requests",
  nora: "requests",
  autonomous: "requests",
  "nora-hub": "requests",
  "nora_hub": "requests",
  events_vip: "requests",
  studio: "requests",
  sandbox: "requests",
  workspace: "requests",
};
