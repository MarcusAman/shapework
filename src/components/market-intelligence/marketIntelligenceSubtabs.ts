/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MarketIntelligenceSubtab =
  | "comps"
  | "roi"
  | "recruiting"
  | "bic_compliance"
  | "nora_employee";

export const MARKET_INTELLIGENCE_SUBTABS: {
  id: MarketIntelligenceSubtab;
  label: string;
  secondaryLabel?: string;
  iconName?: string;
}[] = [
  { id: "comps", label: "Spatial Comps", secondaryLabel: "Offer Map" },
  { id: "roi", label: "Executive ROI", secondaryLabel: "21.8x ROAS" },
  { id: "recruiting", label: "Recruiting & MLS", secondaryLabel: "$90.1M Target" },
  { id: "bic_compliance", label: "BIC Sentinel", secondaryLabel: "3-Day Banking" },
  { id: "nora_employee", label: "Nora Employee", secondaryLabel: "Autonomous Hub" },
];

export const MARKET_INTELLIGENCE_ALIASES: Record<string, MarketIntelligenceSubtab> = {
  comps: "comps",
  "spatial-comps": "comps",
  spatial_comps: "comps",
  "comp-map": "comps",
  "offer-map": "comps",
  roi: "roi",
  "executive-roi": "roi",
  executive_roi: "roi",
  "marketing-roi": "roi",
  "roi-command-center": "roi",
  recruiting: "recruiting",
  "market-share": "recruiting",
  market_share: "recruiting",
  producers: "recruiting",
  bic_compliance: "bic_compliance",
  "bic-compliance": "bic_compliance",
  bic: "bic_compliance",
  compliance: "bic_compliance",
  trust: "bic_compliance",
  trust_accounts: "bic_compliance",
  nora_employee: "nora_employee",
  "nora-employee": "nora_employee",
  nora: "nora_employee",
  autonomous: "nora_employee",
  nora_hub: "nora_employee",
};
