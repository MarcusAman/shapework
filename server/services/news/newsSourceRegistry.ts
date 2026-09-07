/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsSource } from './newsTypes';

export const INITIAL_NEWS_SOURCES: NewsSource[] = [
  // 1. National / Brokerage Strategy
  {
    id: 'src_inman',
    name: 'Inman',
    category: 'brokerage',
    feedUrl: 'https://feeds.feedburner.com/inmannews',
    siteUrl: 'https://www.inman.com',
    feedType: 'rss',
    isEnabled: true,
    priority: 1,
    description: 'Independent news and technology reporting for real estate leaders, brokerages, and agents.'
  },
  {
    id: 'src_housingwire',
    name: 'HousingWire',
    category: 'brokerage',
    feedUrl: 'https://www.housingwire.com/feed/',
    siteUrl: 'https://www.housingwire.com',
    feedType: 'rss',
    isEnabled: true,
    priority: 1,
    description: 'Mortgage finance, real estate brokerage, proptech and housing economics.'
  },
  {
    id: 'src_realtrends',
    name: 'RealTrends',
    category: 'brokerage',
    feedUrl: 'https://www.realtrends.com/feed/',
    siteUrl: 'https://www.realtrends.com',
    feedType: 'rss',
    isEnabled: true,
    priority: 2,
    description: 'Brokerage rankings, merger and acquisition intelligence, and executive strategy.'
  },
  {
    id: 'src_real_estate_news',
    name: 'Real Estate News',
    category: 'brokerage',
    feedUrl: 'https://www.realestatenews.com/rss/brokerages',
    siteUrl: 'https://www.realestatenews.com',
    feedType: 'rss',
    isEnabled: true,
    priority: 2,
    description: 'In-depth coverage of residential real estate brokerage business models and tech.'
  },
  {
    id: 'src_rismedia',
    name: 'RISMedia',
    category: 'brokerage',
    feedUrl: 'https://rismedia.com/feed/',
    siteUrl: 'https://rismedia.com',
    feedType: 'rss',
    isEnabled: true,
    priority: 3,
    description: 'Brokerage trends, industry leadership, recruiting, and agent productivity.'
  },

  // 2. Housing / Economy / Official Data
  {
    id: 'src_nar',
    name: 'National Association of REALTORS',
    category: 'housing',
    feedUrl: 'https://www.nar.realtor/rss/news-releases',
    siteUrl: 'https://www.nar.realtor',
    feedType: 'rss',
    isEnabled: false,
    priority: 2,
    description: 'Official existing home sales, pending sales, legal updates, and economic research.'
  },
  {
    id: 'src_freddie_mac',
    name: 'Freddie Mac Research',
    category: 'housing',
    feedUrl: 'https://freddiemac.gcs-web.com/rss/news-releases.xml',
    siteUrl: 'https://www.freddiemac.com/pmms',
    feedType: 'rss',
    isEnabled: false,
    priority: 2,
    description: 'Primary mortgage market surveys, 30-year fixed rate benchmarks, and macro forecast.'
  },

  // 3. North Carolina & Local Cape Fear
  {
    id: 'src_cape_fear_realtors',
    name: 'Cape Fear REALTORS',
    category: 'local',
    feedUrl: 'https://capefear.realtor/feed/',
    siteUrl: 'https://capefear.realtor',
    feedType: 'rss',
    isEnabled: false,
    priority: 1,
    description: 'Wilmington, New Hanover, and Pender County local association developments and market stats.'
  },
  {
    id: 'src_wilmingtonbiz',
    name: 'WilmingtonBiz',
    category: 'local',
    feedUrl: 'https://www.wilmingtonbiz.com/rss',
    siteUrl: 'https://www.wilmingtonbiz.com',
    feedType: 'rss',
    isEnabled: false,
    priority: 1,
    description: 'Greater Wilmington Business Journal real estate, commercial development, and economic growth reporting.'
  },
  {
    id: 'src_nc_realtors',
    name: 'NC REALTORS',
    category: 'local',
    feedUrl: 'https://www.ncrealtors.org/feed/',
    siteUrl: 'https://www.ncrealtors.org',
    feedType: 'rss',
    isEnabled: true,
    priority: 2,
    description: 'Statewide legislative policy, standard form revisions, and North Carolina market developments.'
  },

  // 4. Podcasts & Media
  {
    id: 'src_realtrending_podcast',
    name: 'RealTrending Podcast',
    category: 'brokerage',
    feedUrl: 'https://feeds.megaphone.fm/MDMHI2142790817',
    siteUrl: 'https://www.realtrends.com/podcasts/',
    feedType: 'podcast',
    isEnabled: true,
    priority: 2,
    description: 'Conversations with the most innovative leaders and founders in real estate brokerage.'
  },
  {
    id: 'src_housingwire_daily',
    name: 'HousingWire Daily',
    category: 'housing',
    feedUrl: 'https://feeds.megaphone.fm/MDMHI7346986434',
    siteUrl: 'https://www.housingwire.com/podcast/',
    feedType: 'podcast',
    isEnabled: true,
    priority: 2,
    description: 'Daily briefing on mortgage rates, market shifts, and housing policy.'
  }
];

export const NEWS_SOURCE_REGISTRY = INITIAL_NEWS_SOURCES;
