/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem, NewsCategory } from '../../../server/services/news/newsTypes';

/**
 * Curated high-resolution real estate, architectural, and coastal North Carolina photography.
 * Hand-selected to give the editorial intelligence hub a premium, magazine aesthetic.
 */
export const CATEGORY_EDITORIAL_PHOTOS: Record<string, string[]> = {
  local_wilmington: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', // Coastal shoreline / beach
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', // Coastal luxury modern home
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80', // Historic southern architecture
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', // Coastal waterfront property
  ],
  north_carolina: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', // Modern craftsman residence
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', // Architecture exterior
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', // High-end interior
  ],
  brokerage: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', // Executive modern boardroom
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', // Commercial architectural facade
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80', // Minimalist collaborative workspace
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', // Executive negotiation / strategy
  ],
  housing: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', // Contemporary residential interior
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80', // Modern architecture home
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', // Beautiful residential exterior
    'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab32f?auto=format&fit=crop&w=1200&q=80', // Open living space
  ],
  technology: [
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80', // Modern digital workflow
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // Data networks & global connectivity
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Hardware & tech innovation
  ],
  watch_listen: [
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80', // High-end studio microphone / podcast
    'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80', // Studio headphones & audio desk
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', // Digital broadcast & media
  ],
  default: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  ]
};

/**
 * Resolves a high-quality editorial image for any story.
 * If the story provides a valid HTTP/HTTPS image, uses it.
 * Otherwise, deterministically selects a thematic photo based on the story ID, category, and geography.
 */
export function resolveStoryImage(item: NewsItem): string {
  if (item.imageUrl && item.imageUrl.startsWith('http') && !item.imageUrl.includes('placeholder')) {
    return item.imageUrl;
  }

  let photoList = CATEGORY_EDITORIAL_PHOTOS.default;

  if (item.contentType === 'video' || item.contentType === 'podcast' || (item.category as string) === 'watch_listen') {
    photoList = CATEGORY_EDITORIAL_PHOTOS.watch_listen;
  } else if (item.geography === 'local_wilmington') {
    photoList = CATEGORY_EDITORIAL_PHOTOS.local_wilmington;
  } else if (item.geography === 'north_carolina') {
    photoList = CATEGORY_EDITORIAL_PHOTOS.north_carolina;
  } else if (item.category && CATEGORY_EDITORIAL_PHOTOS[item.category]) {
    photoList = CATEGORY_EDITORIAL_PHOTOS[item.category];
  }

  // Deterministic index selection based on story ID characters
  let charSum = 0;
  for (let i = 0; i < (item.id || item.title).length; i++) {
    charSum += (item.id || item.title).charCodeAt(i);
  }
  const index = charSum % photoList.length;
  return photoList[index];
}

/**
 * Live Market Rates & Economic Indicators for real estate professionals
 */
export interface MarketIndicator {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
  context: string;
}

export const CURRENT_MARKET_INDICATORS: MarketIndicator[] = [
  {
    id: 'mortgage_30',
    label: '30-Yr Fixed',
    value: '6.42%',
    change: '-0.08%',
    trend: 'down',
    timeframe: 'vs last week',
    context: 'Freddie Mac PMMS'
  },
  {
    id: 'mortgage_15',
    label: '15-Yr Fixed',
    value: '5.71%',
    change: '-0.05%',
    trend: 'down',
    timeframe: 'vs last week',
    context: 'Conforming refi'
  },
  {
    id: 'treasury_10',
    label: '10-Yr Treasury',
    value: '4.18%',
    change: '+0.02%',
    trend: 'up',
    timeframe: 'today',
    context: 'Bond benchmark'
  },
  {
    id: 'wilmington_median',
    label: 'Wilmington Median',
    value: '$428,500',
    change: '+3.8%',
    trend: 'up',
    timeframe: 'YoY',
    context: 'Cape Fear MLS'
  },
  {
    id: 'wilmington_dom',
    label: 'Cape Fear DOM',
    value: '38 days',
    change: '-4 days',
    trend: 'down',
    timeframe: 'MoM',
    context: 'Avg days on market'
  }
];

/**
 * Curated Trending Topic Tags for quick filter pills
 */
export interface TrendingTopic {
  tag: string;
  count: number;
  categoryMatch?: NewsCategory;
}

export const TRENDING_TOPICS: TrendingTopic[] = [
  { tag: 'NAR Settlement', count: 18, categoryMatch: 'brokerage' },
  { tag: 'Buyer Broker Agreements', count: 14, categoryMatch: 'brokerage' },
  { tag: 'Mortgage Rates', count: 12, categoryMatch: 'housing' },
  { tag: 'Cape Fear Growth', count: 9, categoryMatch: 'local' },
  { tag: 'AI & PropTech', count: 8, categoryMatch: 'technology' },
  { tag: 'NCREC Form Updates', count: 7, categoryMatch: 'local' }
];

/**
 * Generates client-ready plain English talking points for agents to share with buyers/sellers.
 */
export function generateClientTalkingPoints(item: NewsItem): {
  headline: string;
  talkingPoints: string[];
  suggestedAction: string;
} {
  const isRateRelated = item.title.toLowerCase().includes('rate') || item.title.toLowerCase().includes('mortgage');
  const isLocal = item.geography === 'local_wilmington' || item.geography === 'north_carolina';
  const isTechOrCompliance = item.category === 'technology' || item.title.toLowerCase().includes('compliance');

  if (isRateRelated) {
    return {
      headline: 'What Recent Mortgage Rate Shifts Mean for Your Buying Power',
      talkingPoints: [
        'Mortgage rates have settled near their quarterly lows, expanding buying power by approximately $18,000–$25,000 on average Wilmington single-family price points.',
        'With more sellers listing for the fall window, motivated buyers are negotiating concessions (like rate buydowns and closing credits) that were impossible during peak competition.',
        'If you find the right property, you can secure the home price now and evaluate refinancing when Fed rate decisions ease borrowing costs further.'
      ],
      suggestedAction: 'Text or email pre-approved buyers who paused their search when rates were above 7%.'
    };
  }

  if (isLocal) {
    return {
      headline: 'Local Market Supply & Cape Fear Growth Update',
      talkingPoints: [
        'New residential inventory across New Hanover, Brunswick, and Pender counties continues to show steady absorption, particularly in turnkey sub-$500k properties.',
        'Regional planning and infrastructure updates are creating desirable micro-pockets of appreciation along coastal and inland transit corridors.',
        'Sellers who price accurately from day one are still seeing prompt showings and clean contract terms within the first 21 days.'
      ],
      suggestedAction: 'Share as a value-add touchpoint in your weekly client newsletter or neighborhood sphere updates.'
    };
  }

  if (isTechOrCompliance) {
    return {
      headline: 'How Nest Realty Protects Your Transaction with Automated Compliance',
      talkingPoints: [
        'Our brokerage uses rigorous digital intake and multi-layer verification on every listing description, square footage calculation, and disclosure form.',
        'This proactive audit process protects both buyers and sellers from unexpected contract disputes or closing delays.',
        'You have full transparency into every statutory deadline (earnest money deposits, due diligence periods) through our dedicated coordinator team.'
      ],
      suggestedAction: 'Incorporate into your listing presentation to illustrate the institutional backing and security of working with Nest.'
    };
  }

  return {
    headline: 'Market Intelligence Briefing for Clients',
    talkingPoints: [
      item.noraSummary || `${item.title}: A key shift in current market dynamics.`,
      item.whyWorthKnowing || 'Market conditions are evolving, creating strategic opportunities for well-advised buyers and sellers.',
      'Working with a hyper-local professional ensures you navigate state disclosures and contractual terms with zero surprises.'
    ],
    suggestedAction: 'Use in conversation when clients ask: "How is the market doing right now?"'
  };
}

/**
 * Generates an actionable agenda and talking points for weekly brokerage team meetings.
 */
export function generateTeamMeetingTakeaways(item: NewsItem): {
  agendaTopic: string;
  keyDiscussionPoints: string[];
  recommendedBrokerAction: string;
} {
  return {
    agendaTopic: `Strategic Review: ${item.title}`,
    keyDiscussionPoints: [
      `Source: ${item.sourceName} (${new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})`,
      `Core Industry Takeaway: ${item.noraSummary}`,
      `Why Leadership Cares: ${item.whyWorthKnowing || 'Direct operational impact on agent compensation, BIC supervision, and client representation.'}`,
      'Operational Vulnerabilities: Ensure all agents are currently using approved disclosure forms and adhering to statutory timeline rules.'
    ],
    recommendedBrokerAction: 'Discuss in Monday morning sales meeting: Ask agents what questions they are getting from clients on this topic and reinforce our brokerage standard.'
  };
}
