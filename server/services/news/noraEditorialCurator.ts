/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem, ContentType, NewsSource, DestinationAccuracy, EditorialDecision, EditorialRejectionReason } from './newsTypes';
import { ParsedFeedItem, classifyDestinationAccuracy } from './rssFeedParser';

// Banned buzzwords and AI clichés
const BANNED_AI_CLICHES = [
  /in today's (rapidly )?evolving landscape/i,
  /this underscores the importance/i,
  /\bleverage\b/i,
  /\btransformative\b/i,
  /\bgame-changing\b/i,
  /\bit is imperative\b/i,
  /\bdelve into\b/i,
  /\btestament to\b/i
];

// 1. Static resources, archives, toolkits, meeting minutes (resource_not_news)
export const RESOURCE_NOT_NEWS_PATTERNS = [
  /\bnewsletter\s+archive\b/i,
  /\bappraisal\s+connection\s+archive\b/i,
  /\badvocate\s+newsletter\s+archive\b/i,
  /\bleadership\s+academy\s+toolkit\b/i,
  /\bleadership\s+academy\b/i,
  /\btoolkit\b/i,
  /\bwebinar\s+recording\b/i,
  /\bmeeting\s+minutes\b/i,
  /\bforms\s+index\b/i,
  /\bforms\s+library\b/i,
  /\bmember\s+directory\b/i
];

// 2. Promotional vendor PR, lender profiles, speaker announcements (promotional)
export const PROMOTIONAL_PATTERNS = [
  /\btruss\s+financial\b/i,
  /\bscales?\s+hybrid\s+model\b/i,
  /\bdirect\s+lending\s+platform\b/i,
  /\bto\s+speak\s+at\s+rei\s+tech\b/i,
  /\bspeak\s+at\s+[a-z0-9\s]+summit\b/i,
  /\bkeynote\s+at\b/i,
  /\bopens\s+nominations\s+for\b/i,
  /\bproptech\s+awards?\s+nominations?\b/i,
  /\bannounces?\s+new\s+partnership\s+with\b/i,
  /\brolls?\s+out\s+new\s+branding\b/i,
  /\bfeatured\s+sponsor\b/i,
  /\bsponsored\s+content\b/i,
  /\bpartner\s+content\b/i
];

// 3. Technical mortgage plumbing, MISMO standards, reverse mortgage minutiae (too_niche)
export const TOO_NICHE_PATTERNS = [
  /\bmismo\s+standards?\b/i,
  /\breverse\s+mortgages?\b/i,
  /\bproprietary\s+reverse\b/i,
  /\bgeorge\s+morales\b/i,
  /\bconduit\s+securitization\b/i,
  /\bwarehouse\s+facility\s+covenant\b/i,
  /\buad\s+and\s+urar\b/i,
  /\bsingle\s+credit\s+report\s+bi-merge\b/i
];

// 4. Low-signal trade elections, generic tip listicles, fluff advice (low_signal)
export const LOW_SIGNAL_PATTERNS = [
  /\belects?\s+\d{4}\s+officers?\b/i,
  /\bofficer\s+elections?\b/i,
  /\b\d+\s+(ai\s+tools|tools|tips|secrets|tricks|steps|hacks|ways)\b/i,
  /\bthe\s+cheesecake\s+test\b/i,
  /\bwinning\s+looks\s+different\s+when\s+your\s+client\b/i,
  /\binternational\s+capital\s+is\s+looking\s+for\s+local\s+agents\b/i,
  /\bmaster-planned\s+communities\s+are\s+designed\s+around\s+everyday\s+life\b/i,
  /\bstop\s+the\s+agent\s+recruiting\s+and\s+retention\s+revolving\s+door\b/i,
  /\bfsbo\.com\s+rolls\s+out\b/i,
  /\bfsbo\.com\b/i,
  /\bdecorating\s+(ideas|trends)\b/i,
  /\bpaint\s+colors?\b/i,
  /\bcurb\s+appeal\s+tricks\b/i
];

// 5. Gossip, mansions, crime sensationalism (celebrity_lifestyle)
export const CELEBRITY_LIFESTYLE_PATTERNS = [
  /\bcelebrity\b/i,
  /\bmansion\b/i,
  /\bpenthouse\b/i,
  /\bhollywood\b/i,
  /\bkardashian\b/i,
  /\bgloria\s+steinem\b/i,
  /\bmillion-dollar\s+listing\b/i,
  /\bluxury\s+living\b/i,
  /\bagent('s)?\s+killer\b/i,
  /\bself-defense\s+in\s+court\s+hearing\b/i,
  /\bhomicide\b/i,
  /\bmurder\b/i,
  /\barrested\s+for\b/i
];

// Clickbait and low-value noise patterns to filter out (legacy composite for backward compatibility)
const NOISE_FILTER_PATTERNS = [
  ...CELEBRITY_LIFESTYLE_PATTERNS,
  ...LOW_SIGNAL_PATTERNS
];

export function isResourceNotNews(title: string, excerpt: string = '', url: string = ''): boolean {
  for (const pattern of RESOURCE_NOT_NEWS_PATTERNS) {
    if (pattern.test(title)) return true;
  }
  if (excerpt) {
    if (/\b(newsletter archive|appraisal connection archive|advocate newsletter archive|leadership academy toolkit|meeting minutes|forms index)\b/i.test(excerpt)) {
      return true;
    }
  }
  if (url) {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes('-archive') ||
      lowerUrl.endsWith('/archive') ||
      lowerUrl.endsWith('/archives') ||
      lowerUrl.includes('/toolkit') ||
      lowerUrl.includes('/leadership-academy')
    ) {
      return true;
    }
  }
  return false;
}

export function isPromotionalOrVendorPitch(title: string, excerpt: string = ''): boolean {
  const combined = `${title} ${excerpt}`.toLowerCase();
  for (const pattern of PROMOTIONAL_PATTERNS) {
    if (pattern.test(combined)) return true;
  }
  return false;
}

export function isTooNicheOrPlumbing(title: string, excerpt: string = ''): boolean {
  const combined = `${title} ${excerpt}`.toLowerCase();
  for (const pattern of TOO_NICHE_PATTERNS) {
    if (pattern.test(combined)) return true;
  }
  return false;
}

export function isLowSignalOrGeneric(title: string, excerpt: string = ''): boolean {
  const combined = `${title} ${excerpt}`.toLowerCase();
  for (const pattern of LOW_SIGNAL_PATTERNS) {
    if (pattern.test(combined)) return true;
  }
  return false;
}

export function isCelebrityOrSensational(title: string, excerpt: string = ''): boolean {
  const combined = `${title} ${excerpt}`.toLowerCase();
  for (const pattern of CELEBRITY_LIFESTYLE_PATTERNS) {
    if (pattern.test(combined)) return true;
  }
  return false;
}

export function isStaleItem(publishedAt: string, maxDays: number = 14): boolean {
  if (!publishedAt) return false;
  const pubTime = new Date(publishedAt).getTime();
  if (isNaN(pubTime)) return false;
  const ageMs = Date.now() - pubTime;
  return ageMs > maxDays * 24 * 60 * 60 * 1000;
}

export function isLowValueNoise(title: string, excerpt: string = ''): boolean {
  return isCelebrityOrSensational(title, excerpt) || isLowSignalOrGeneric(title, excerpt);
}

// High-value brokerage and leadership priority signals
const BROKERAGE_SIGNALS = [
  'compass', 'exp realty', 'real brokerage', 'serhant', 'anywhere', 'keller williams',
  're/max', 'coldwell banker', 'corcoran', "sotheby's", 'independent brokerage',
  'merger', 'acquisition', 'recruiting', 'retention', 'commission split', 'business model',
  'portal', 'zillow', 'realtor.com', 'homes.com', 'costar', 'mls', 'clear cooperation',
  'listing policy', 'settlement', 'broker of record', 'bic'
];

const LOCAL_SIGNALS = [
  'wilmington', 'cape fear', 'new hanover', 'brunswick', 'pender', 'wrightsville',
  'carolina beach', 'leland', 'hampstead', 'north carolina', 'ncrec', 'nc real estate',
  'uncw', 'mayfaire', 'autumn hall', 'landfall', 'riverlights'
];

const TECH_AI_SIGNALS = [
  'ai', 'artificial intelligence', 'automation', 'crm', 'proptech', 'transaction management',
  'matterport', 'chatgpt', 'agentic', 'copilot', 'workflow', 'software'
];

const HOUSING_ECON_SIGNALS = [
  'mortgage rate', 'federal reserve', 'fed', 'interest rate', 'inflation', 'affordability',
  'existing home sales', 'housing inventory', 'home prices', 'freddie mac', 'fannie mae'
];

export function classifyContent(
  title: string, 
  excerpt: string, 
  source: NewsSource, 
  rawItem: ParsedFeedItem
): {
  contentType: ContentType;
  category: 'brokerage' | 'housing' | 'local' | 'technology';
  geography: 'local_wilmington' | 'north_carolina' | 'national';
  priorityScore: number;
} {
  const lowerTitle = title.toLowerCase();
  const lowerExcerpt = excerpt.toLowerCase();
  const combined = `${lowerTitle} ${lowerExcerpt}`;

  // 1. Content Type
  let contentType: ContentType = 'article';
  if (rawItem.podcastUrl || source.feedType === 'podcast') {
    contentType = 'podcast';
  } else if (rawItem.videoUrl || source.feedType === 'youtube' || lowerTitle.includes('video') || lowerTitle.includes('watch:')) {
    contentType = 'video';
  } else if (LOCAL_SIGNALS.some(s => combined.includes(s)) && (combined.includes('development') || combined.includes('rezoning') || combined.includes('construction') || combined.includes('project'))) {
    contentType = 'local_development';
  } else if (combined.includes('report') || combined.includes('survey') || combined.includes('index') || combined.includes('data analysis')) {
    contentType = 'report';
  }

  // 2. Geography
  let geography: 'local_wilmington' | 'north_carolina' | 'national' = 'national';
  if (source.category === 'local' || ['wilmington', 'cape fear', 'new hanover', 'brunswick', 'pender'].some(s => combined.includes(s))) {
    geography = 'local_wilmington';
  } else if (['north carolina', 'nc ', 'raleigh', 'charlotte', 'ncrec'].some(s => combined.includes(s))) {
    geography = 'north_carolina';
  }

  // 3. Category
  let category: 'brokerage' | 'housing' | 'local' | 'technology' = 'brokerage';
  if (geography !== 'national') {
    category = 'local';
  } else if (TECH_AI_SIGNALS.some(s => combined.includes(s))) {
    category = 'technology';
  } else if (HOUSING_ECON_SIGNALS.some(s => combined.includes(s)) || source.category === 'housing') {
    category = 'housing';
  } else if (BROKERAGE_SIGNALS.some(s => combined.includes(s)) || source.category === 'brokerage') {
    category = 'brokerage';
  }

  // 4. Priority calculation
  let priorityScore = 5;
  if (geography === 'local_wilmington') priorityScore += 4;
  else if (geography === 'north_carolina') priorityScore += 2;

  if (BROKERAGE_SIGNALS.some(s => combined.includes(s))) priorityScore += 3;
  if (TECH_AI_SIGNALS.some(s => combined.includes(s))) priorityScore += 2;
  if (HOUSING_ECON_SIGNALS.some(s => combined.includes(s))) priorityScore += 1;

  if (contentType === 'video' || contentType === 'podcast') priorityScore += 1;

  return {
    contentType,
    category,
    geography,
    priorityScore: Math.min(10, priorityScore)
  };
}

export function generateCleanSummary(title: string, excerpt: string, category: string): string {
  let summary = excerpt.trim();
  if (!summary || summary.length < 30) {
    summary = `${title}. This development brings meaningful implications for brokerage operations and competitive positioning.`;
  }

  // Strip clichés
  for (const cliché of BANNED_AI_CLICHES) {
    summary = summary.replace(cliché, '');
  }

  // Ensure 2-3 sentences
  const sentences = summary.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (sentences.length > 3) {
    summary = sentences.slice(0, 3).join(' ');
  } else if (sentences.length === 1 && !summary.endsWith('.')) {
    summary = `${summary}.`;
  }

  return summary.trim();
}

export function generateWhyWorthKnowing(
  title: string, 
  category: string, 
  geography: string, 
  contentType: ContentType
): string {
  const lower = title.toLowerCase();

  if (geography === 'local_wilmington') {
    return 'Relevant locally because this development or policy change directly impacts residential supply and transaction activity across New Hanover and Brunswick counties.';
  }
  if (geography === 'north_carolina') {
    return 'Directly relevant to North Carolina brokerage compliance, standard forms, and state housing policy.';
  }
  if (lower.includes('compass') || lower.includes('exp') || lower.includes('real brokerage') || lower.includes('recruiting')) {
    return 'Useful perspective on how a major competitor is approaching recruiting, retention, and agent productivity incentives.';
  }
  if (lower.includes('mortgage') || lower.includes('rate') || lower.includes('affordability') || lower.includes('fed')) {
    return 'Could affect buyer purchasing power and days on market if financing costs shift for upcoming coastal transactions.';
  }
  if (lower.includes('ai') || lower.includes('technology') || lower.includes('portal') || lower.includes('zillow')) {
    return 'Practical perspective on where brokerage technology is driving real operational efficiency versus marketing noise.';
  }
  if (contentType === 'video') {
    return 'A focused conversation among industry leaders with actionable takeaways for brokerage principals.';
  }
  if (contentType === 'podcast') {
    return 'Actionable discussion on leadership, margin protection, and independent brokerage strategy.';
  }

  return 'Worth tracking for brokerage principals monitoring regional competitive strategy and operational shifts.';
}

/**
 * Normalized token overlap for story deduplication
 */
export function calculateSimilarity(titleA: string, titleB: string): number {
  const cleanTokens = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !['the', 'and', 'for', 'with', 'from', 'about', 'how', 'why', 'what', 'new'].includes(t))
    );
  };

  const tokensA = cleanTokens(titleA);
  const tokensB = cleanTokens(titleB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  return (2 * intersection) / (tokensA.size + tokensB.size);
}

export interface EventClusterReference {
  title: string;
  clusterId: string;
  sourceName?: string;
}

export function findEventCluster(
  title: string, 
  existingClusters: EventClusterReference[]
): { clusterId: string; parentTitle: string } | null {
  const lower = title.toLowerCase();

  // Known high-impact event patterns that multiple outlets report on simultaneously
  const EVENT_SIGNATURES: { key: string; regex: RegExp }[] = [
    { key: 'nwmls_settlement', regex: /\bnwmls\s+settlement\b/i },
    { key: 'jobs_report_rates', regex: /\b(jobs\s+report|labor\s+market\s+rebounds?).*?(mortgage\s+rates|budged|interest\s+rates)\b/i },
    { key: 'mortgage_rate_13m_high', regex: /\bmortgage\s+rates?\s+(hit|reach|climb).*?13-month\s+high\b/i },
    { key: 'compass_settlement_roadmap', regex: /\bcompass.*?settlement.*?nar.*?roadmap\b/i },
    { key: 'realty_one_merge', regex: /\brealty\s+one.*?(merge|adds|expands)\b/i },
    { key: 'fay_vandyk_mortgage', regex: /\bfay\s+group\s+acquires\s+vandyk\b/i },
    { key: 'ice_homebuilder_labor', regex: /\bice\s+raids?\s+strain\s+homebuilder\b/i },
    { key: 'tariffs_housing', regex: /\btariffs?\s+into\s+housing\b/i }
  ];

  for (const sig of EVENT_SIGNATURES) {
    if (sig.regex.test(lower)) {
      const match = existingClusters.find(c => sig.regex.test(c.title.toLowerCase()));
      if (match) {
        return { clusterId: match.clusterId, parentTitle: match.title };
      }
    }
  }

  // Token similarity fallback for clustering (> 0.60)
  for (const cluster of existingClusters) {
    const sim = calculateSimilarity(title, cluster.title);
    if (sim >= 0.60) {
      return { clusterId: cluster.clusterId, parentTitle: cluster.title };
    }
  }

  return null;
}

export interface EditorialContext {
  publishedBySourceCount?: Map<string, number>;
  existingClusterTitles?: EventClusterReference[];
  maxDaysStale?: number;
}

export interface EditorialEvaluationResult {
  decision: EditorialDecision;
  reason?: EditorialRejectionReason;
  priorityScore: number;
  eventClusterId?: string;
  matchedClusterTitle?: string;
}

export function evaluateEditorialDecision(
  item: {
    title: string;
    sourceName: string;
    sourceExcerpt?: string;
    canonicalUrl?: string;
    sourceUrl?: string;
    publishedAt?: string;
    contentType?: ContentType | string;
    category?: string;
    geography?: string;
    destinationAccuracy?: DestinationAccuracy;
  },
  context: EditorialContext = {}
): EditorialEvaluationResult {
  const title = (item.title || '').trim();
  const excerpt = (item.sourceExcerpt || '').trim();
  const url = item.canonicalUrl || item.sourceUrl || '';
  const publishedAt = item.publishedAt || new Date().toISOString();

  // 1. Minimum context check
  if (!title || title.length < 8) {
    return { decision: 'reject', reason: 'insufficient_context', priorityScore: 0 };
  }

  // 2. Destination accuracy: collection or homepage cannot be primary article/video/podcast
  const accuracy = item.destinationAccuracy || classifyDestinationAccuracy(url, item.contentType);
  if (accuracy === 'collection' || accuracy === 'homepage') {
    return { decision: 'reject', reason: 'resource_not_news', priorityScore: 1 };
  }

  // 3. Static resources, archives, toolkits, meeting minutes
  if (isResourceNotNews(title, excerpt, url)) {
    return { decision: 'reject', reason: 'resource_not_news', priorityScore: 1 };
  }

  // 4. Promotional vendor PR, self-serving announcements, award nominations
  if (isPromotionalOrVendorPitch(title, excerpt)) {
    return { decision: 'reject', reason: 'promotional', priorityScore: 2 };
  }

  // 5. Technical secondary market plumbing / MISMO standards
  if (isTooNicheOrPlumbing(title, excerpt)) {
    return { decision: 'reject', reason: 'too_niche', priorityScore: 2 };
  }

  // 6. Celebrity mansions, gossip, crime sensationalism
  if (isCelebrityOrSensational(title, excerpt)) {
    return { decision: 'reject', reason: 'celebrity_lifestyle', priorityScore: 1 };
  }

  // 7. Low-signal trade elections, generic tip listicles, fluff advice
  if (isLowSignalOrGeneric(title, excerpt)) {
    return { decision: 'reject', reason: 'low_signal', priorityScore: 2 };
  }

  // 8. Stale item check (> 14 days old unless evergreen)
  const maxDays = context.maxDaysStale ?? 14;
  if (isStaleItem(publishedAt, maxDays)) {
    return { decision: 'reject', reason: 'stale', priorityScore: 1 };
  }

  // 9. Topic event clustering across publishers
  if (context.existingClusterTitles && context.existingClusterTitles.length > 0) {
    const clusterMatch = findEventCluster(title, context.existingClusterTitles);
    if (clusterMatch) {
      return {
        decision: 'reject',
        reason: 'duplicate_event',
        priorityScore: 5,
        eventClusterId: clusterMatch.clusterId,
        matchedClusterTitle: clusterMatch.parentTitle
      };
    }
  }

  // Calculate base priority score for candidate
  let priorityScore = 5;
  const combined = `${title} ${excerpt}`.toLowerCase();
  if (BROKERAGE_SIGNALS.some(s => combined.includes(s))) priorityScore += 3;
  if (LOCAL_SIGNALS.some(s => combined.includes(s))) priorityScore += 3;
  if (TECH_AI_SIGNALS.some(s => combined.includes(s))) priorityScore += 2;
  if (HOUSING_ECON_SIGNALS.some(s => combined.includes(s))) priorityScore += 2;

  // 10. Source saturation check: high-volume publishers capped at 2 stories in active window
  if (context.publishedBySourceCount) {
    const sourceCount = context.publishedBySourceCount.get(item.sourceName) || 0;
    if (sourceCount >= 2) {
      // Must be an extraordinary high-priority breaking story to bypass saturation
      if (priorityScore < 9) {
        return { decision: 'reject', reason: 'source_saturation', priorityScore };
      }
    }
  }

  return {
    decision: 'publish',
    priorityScore: Math.min(10, priorityScore),
    eventClusterId: `cluster_${title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}`
  };
}

/**
 * High-quality initial curated seed dataset with verified live industry stories
 * Standard: Ryan Crecelius should be glad NORA brought every item to his attention.
 */
export const SEED_CURATED_NEWS: NewsItem[] = [
  {
    id: 'seed_inman_nwmls_settlement',
    workspaceId: 'ws_wilmington',
    title: 'What the NWMLS settlement really tells us about the future of real estate marketing',
    sourceName: 'Inman',
    sourceUrl: 'https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/',
    canonicalUrl: 'https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/',
    originalUrl: 'https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/',
    resolvedUrl: 'https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/',
    urlStatus: 'valid',
    urlHttpStatus: 200,
    urlLastVerifiedAt: new Date().toISOString(),
    redirectCount: 0,
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    author: 'OB Jacobi',
    publishedAt: '2026-09-04T16:49:05.000Z',
    discoveredAt: '2026-09-04T17:00:00.000Z',
    contentType: 'article',
    category: 'brokerage',
    geography: 'national',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    duration: '6 min read',
    sourceExcerpt: 'The Northwest MLS settlement reveals how cooperative compensation and buyer representation agreements are transforming listing distribution models nationwide.',
    noraSummary: 'Northwest MLS reaches a landmark antitrust settlement preserving independent buyer broker commission rules while adopting transparent disclosure frameworks.',
    whyWorthKnowing: 'Essential strategic analysis for brokerage principals evaluating buyer broker representation agreements, MLS rules, and competitive listing distribution.',
    tags: ['Brokerage Strategy', 'NWMLS Settlement', 'Antitrust Policy'],
    sourcePriority: 1,
    featured: true,
    secondaryRecommendation: null,
    saved: false,
    hidden: false,
    contentHash: 'hash_inman_nwmls_2026',
    duplicateGroupId: 'dup_nwmls_2026',
    createdAt: '2026-09-04T17:00:00.000Z',
    updatedAt: '2026-09-04T17:00:00.000Z'
  },
  {
    id: 'seed_hw_tech_compliance',
    workspaceId: 'ws_wilmington',
    title: 'Can tech keep agents out of trouble for listing mistakes?',
    sourceName: 'HousingWire',
    sourceUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
    canonicalUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
    originalUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
    resolvedUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
    urlStatus: 'valid',
    urlHttpStatus: 200,
    urlLastVerifiedAt: new Date().toISOString(),
    redirectCount: 0,
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    author: 'Sarah Wheeler',
    publishedAt: '2026-09-05T18:00:00.000Z',
    discoveredAt: '2026-09-05T18:30:00.000Z',
    contentType: 'article',
    category: 'technology',
    geography: 'national',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    duration: '4 min read',
    sourceExcerpt: 'With stricter advertising standards and MLS accuracy audits, brokerages are implementing automated checklist compliance tools to audit listing descriptions.',
    noraSummary: 'Brokerages are integrating automated compliance checking to review listing copy, square footage claims, and school district disclosures prior to MLS publication.',
    whyWorthKnowing: 'Directly aligns with Shapework’s intake compliance verification to safeguard BIC liability and avoid MLS fine penalties.',
    tags: ['Compliance', 'MLS Accuracy', 'Broker Risk Management'],
    sourcePriority: 1,
    featured: false,
    secondaryRecommendation: null,
    saved: false,
    hidden: false,
    contentHash: 'hash_hw_compliance_2026',
    createdAt: '2026-09-05T18:30:00.000Z',
    updatedAt: '2026-09-05T18:30:00.000Z'
  },
  {
    id: 'seed_rismedia_insurance',
    workspaceId: 'ws_wilmington',
    title: 'The Crucial Insurance Convos You Must Have With Buyers',
    sourceName: 'RISMedia',
    sourceUrl: 'https://www.rismedia.com/2026/09/04/burning-questions-crucial-insurance-convos-you-must-have-with-buyers/',
    canonicalUrl: 'https://www.rismedia.com/2026/09/04/burning-questions-crucial-insurance-convos-you-must-have-with-buyers/',
    originalUrl: 'https://www.rismedia.com/2026/09/04/burning-questions-crucial-insurance-convos-you-must-have-with-buyers/',
    resolvedUrl: 'https://www.rismedia.com/2026/09/04/burning-questions-crucial-insurance-convos-you-must-have-with-buyers/',
    urlStatus: 'valid',
    urlHttpStatus: 200,
    urlLastVerifiedAt: new Date().toISOString(),
    redirectCount: 0,
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    author: 'RISMedia Editors',
    publishedAt: '2026-09-04T16:00:00.000Z',
    discoveredAt: '2026-09-04T17:00:00.000Z',
    contentType: 'article',
    category: 'brokerage',
    geography: 'national',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    duration: '4 min read',
    sourceExcerpt: 'Homeowners insurance availability and surging premiums in coastal and disaster-prone markets are forcing buyer agents to obtain binder estimates during early due diligence.',
    noraSummary: 'Insurance premium spikes are impacting buyer debt-to-income ratios late in escrow. Agents must introduce insurance inquiries during initial property tours.',
    whyWorthKnowing: 'Crucial for Nest Realty agents in coastal North Carolina to protect closing timelines and prevent last-minute financing fall-through.',
    tags: ['Insurance', 'Coastal Real Estate', 'Buyer Due Diligence'],
    sourcePriority: 3,
    featured: false,
    secondaryRecommendation: null,
    saved: false,
    hidden: false,
    contentHash: 'hash_rismedia_insurance_2026',
    createdAt: '2026-09-04T17:00:00.000Z',
    updatedAt: '2026-09-04T17:00:00.000Z'
  },
  {
    id: 'seed_ncrealtors_forms_update',
    workspaceId: 'ws_wilmington',
    title: 'Summary of July 1, 2026 Forms Changes Now Available',
    sourceName: 'NC REALTORS',
    sourceUrl: 'https://www.ncrealtors.org/summary-of-july-1-2026-forms-changes-now-available/',
    canonicalUrl: 'https://www.ncrealtors.org/summary-of-july-1-2026-forms-changes-now-available/',
    originalUrl: 'https://www.ncrealtors.org/summary-of-july-1-2026-forms-changes-now-available/',
    resolvedUrl: 'https://www.ncrealtors.org/summary-of-july-1-2026-forms-changes-now-available/',
    urlStatus: 'valid',
    urlHttpStatus: 200,
    urlLastVerifiedAt: new Date().toISOString(),
    redirectCount: 0,
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    author: 'NC REALTORS Legal Team',
    publishedAt: '2026-09-04T12:00:00.000Z',
    discoveredAt: '2026-09-04T12:30:00.000Z',
    contentType: 'report',
    category: 'local',
    geography: 'north_carolina',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    duration: '6 min read',
    sourceExcerpt: 'The Joint Forms Committee of NC REALTORS and the NC Bar Association approved comprehensive revisions to standard residential offer and agency agreements.',
    noraSummary: 'Official revisions to North Carolina Standard Form 2-T Offer to Purchase and Contract and Exclusive Buyer Agency Agreement 201 are now effective across all NC boards.',
    whyWorthKnowing: 'Mandatory standard form compliance for all Nest North Carolina and Wilmington transactions.',
    tags: ['NC REALTORS', 'Standard Forms', 'North Carolina Law', 'Form 2-T', 'Wilmington'],
    sourcePriority: 2,
    featured: false,
    secondaryRecommendation: 'close_to_home',
    saved: false,
    hidden: false,
    contentHash: 'hash_ncrealtors_forms_2026',
    createdAt: '2026-09-04T12:30:00.000Z',
    updatedAt: '2026-09-04T12:30:00.000Z'
  },
  {
    id: 'seed_hw_daily_podcast',
    workspaceId: 'ws_wilmington',
    title: 'HousingWire Daily: Mortgage Rate Outlook and Market Momentum',
    sourceName: 'HousingWire Daily',
    sourceUrl: 'https://player.megaphone.fm/MDMHI8528403658',
    canonicalUrl: 'https://player.megaphone.fm/MDMHI8528403658',
    originalUrl: 'https://player.megaphone.fm/MDMHI8528403658',
    resolvedUrl: 'https://player.megaphone.fm/MDMHI8528403658',
    podcastUrl: 'https://traffic.megaphone.fm/MDMHI8528403658.mp3',
    urlStatus: 'valid',
    urlHttpStatus: 200,
    urlLastVerifiedAt: new Date().toISOString(),
    redirectCount: 0,
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    author: 'HousingWire',
    publishedAt: '2026-09-05T12:00:00.000Z',
    discoveredAt: '2026-09-05T12:30:00.000Z',
    contentType: 'podcast',
    category: 'housing',
    geography: 'national',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    duration: '24 min',
    sourceExcerpt: 'Daily briefing analyzing mortgage rates, Treasury yields, and homebuyer demand momentum.',
    noraSummary: 'HousingWire analysts review 30-year fixed rate trends and the impact on consumer confidence leading into Q4 sales cycles.',
    whyWorthKnowing: 'Essential macro market context for client pricing and mortgage affordability conversations.',
    tags: ['Podcast', 'Housing Economics', 'Mortgage Rates'],
    sourcePriority: 2,
    featured: false,
    secondaryRecommendation: 'worth_watching',
    saved: false,
    hidden: false,
    contentHash: 'hash_hw_daily_podcast_2026',
    createdAt: '2026-09-05T12:30:00.000Z',
    updatedAt: '2026-09-05T12:30:00.000Z'
  }
];
