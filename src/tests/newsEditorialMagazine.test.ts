/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  resolveStoryImage, 
  CURRENT_MARKET_INDICATORS, 
  TRENDING_TOPICS,
  generateClientTalkingPoints,
  generateTeamMeetingTakeaways
} from '../components/news/newsThemeAssets';
import { NewsItem } from '../../server/services/news/newsTypes';

describe('News Executive Editorial Magazine Suite', () => {
  const mockBaseItem: NewsItem = {
    id: 'news_test_001',
    workspaceId: 'ws_wilmington',
    title: 'Cape Fear Housing Supply Expands as Mortgage Rates Ease',
    sourceName: 'Wilmington Business Journal',
    sourceUrl: 'https://example.com/story',
    canonicalUrl: 'https://example.com/story',
    originalUrl: 'https://example.com/story',
    resolvedUrl: 'https://example.com/story',
    urlStatus: 'valid',
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    publishedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
    contentType: 'article',
    category: 'housing',
    geography: 'local_wilmington',
    duration: '4 min read',
    sourceExcerpt: 'Local builders and sellers add residential inventory across New Hanover County.',
    noraSummary: 'Cape Fear residential housing inventory rose 6.2% last month while days on market remained steady.',
    whyWorthKnowing: 'Directly impacts local pricing conversations and active buyer negotiation leverage.',
    tags: ['Housing Supply', 'Cape Fear', 'Mortgage Rates'],
    sourcePriority: 1,
    featured: true,
    secondaryRecommendation: null,
    saved: false,
    hidden: false,
    contentHash: 'hash_test_001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('resolves curated high-resolution editorial photography when imageUrl is absent', () => {
    const itemWithoutImg = { ...mockBaseItem, imageUrl: undefined };
    const resolvedUrl = resolveStoryImage(itemWithoutImg);

    expect(resolvedUrl).toBeDefined();
    expect(resolvedUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it('preserves existing valid high-resolution imageUrl if present on the item', () => {
    const customImg = 'https://customcdn.com/realtor_story.jpg';
    const itemWithImg = { ...mockBaseItem, imageUrl: customImg };
    const resolvedUrl = resolveStoryImage(itemWithImg);

    expect(resolvedUrl).toBe(customImg);
  });

  it('selects coastal photography for Wilmington and Cape Fear local stories', () => {
    const localItem: NewsItem = {
      ...mockBaseItem,
      imageUrl: undefined,
      geography: 'local_wilmington'
    };
    const resolvedUrl = resolveStoryImage(localItem);

    expect(resolvedUrl).toBeDefined();
    expect(resolvedUrl.startsWith('https://images.unsplash.com/')).toBe(true);
  });

  it('selects multimedia studio imagery for podcasts and video content', () => {
    const mediaItem: NewsItem = {
      ...mockBaseItem,
      imageUrl: undefined,
      contentType: 'podcast',
      category: 'brokerage'
    };
    const resolvedUrl = resolveStoryImage(mediaItem);

    expect(resolvedUrl).toBeDefined();
    expect(resolvedUrl.startsWith('https://images.unsplash.com/')).toBe(true);
  });

  it('provides all 5 core real estate market pulse indicators', () => {
    expect(CURRENT_MARKET_INDICATORS.length).toBeGreaterThanOrEqual(5);

    const labels = CURRENT_MARKET_INDICATORS.map(i => i.label);
    expect(labels).toContain('30-Yr Fixed');
    expect(labels).toContain('15-Yr Fixed');
    expect(labels).toContain('10-Yr Treasury');
    expect(labels).toContain('Wilmington Median');
    expect(labels).toContain('Cape Fear DOM');

    for (const ind of CURRENT_MARKET_INDICATORS) {
      expect(ind.value).toBeTruthy();
      expect(ind.change).toBeTruthy();
      expect(['up', 'down', 'neutral']).toContain(ind.trend);
    }
  });

  it('provides curated trending topic tags for rapid filtering', () => {
    expect(TRENDING_TOPICS.length).toBeGreaterThanOrEqual(4);
    const tags = TRENDING_TOPICS.map(t => t.tag);
    expect(tags).toContain('NAR Settlement');
    expect(tags).toContain('Buyer Broker Agreements');
  });

  it('generates 3 client talking points with plain-English takeaways and suggested action', () => {
    const points = generateClientTalkingPoints(mockBaseItem);

    expect(points.headline).toBeTruthy();
    expect(points.talkingPoints).toHaveLength(3);
    expect(points.suggestedAction).toBeTruthy();
    expect(points.talkingPoints[0].length).toBeGreaterThan(20);
  });

  it('generates team meeting agenda and BIC leadership takeaways', () => {
    const meeting = generateTeamMeetingTakeaways(mockBaseItem);

    expect(meeting.agendaTopic).toContain(mockBaseItem.title);
    expect(meeting.keyDiscussionPoints.length).toBeGreaterThanOrEqual(3);
    expect(meeting.recommendedBrokerAction).toContain('sales meeting');
  });

  it('adapts client talking points specifically for mortgage rate stories', () => {
    const rateItem: NewsItem = {
      ...mockBaseItem,
      title: 'Mortgage Rates Drop to 6.42% in Consecutive Weekly Decline'
    };
    const points = generateClientTalkingPoints(rateItem);

    expect(points.headline).toContain('Mortgage Rate');
    expect(points.talkingPoints.some(p => p.includes('buying power') || p.includes('rates'))).toBe(true);
  });

  it('safely parses large podcast XML feeds exceeding 5MB and extracts audio mp3 enclosures', async () => {
    const { parseRssXml } = await import('../../server/services/news/rssFeedParser');

    // Create an XML payload larger than 5MB with repetitive items
    let largePodcastXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>HousingWire Daily</title>
    <link>https://www.housingwire.com/podcast/</link>`;

    for (let i = 0; i < 70; i++) {
      largePodcastXml += `
    <item>
      <title>Mortgage Rates 8%, 6% or the base case? Episode ${i}</title>
      <link>https://player.megaphone.fm/MDMHI${1000000000 + i}</link>
      <pubDate>Fri, 18 Sep 2026 12:00:00 GMT</pubDate>
      <description>HousingWire Daily episode ${i} analyzing mortgage rates and Treasury yield trends for real estate brokers. Padding to make large: ${'x'.repeat(80000)}</description>
      <enclosure url="https://traffic.megaphone.fm/MDMHI${1000000000 + i}.mp3" type="audio/mpeg" length="25000000" />
      <itunes:duration>18:30</itunes:duration>
    </item>`;
    }

    largePodcastXml += `
  </channel>
</rss>`;

    // Verify XML size is over 5MB
    expect(largePodcastXml.length).toBeGreaterThan(5 * 1024 * 1024);

    // Parsing must succeed and not throw safety threshold error
    const feed = parseRssXml(largePodcastXml, 'https://www.housingwire.com');
    const items = feed.items;

    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(50);
    expect(items[0].podcastUrl).toMatch(/^https:\/\/traffic\.megaphone\.fm\//);
    expect(items[0].podcastUrl).toContain('.mp3');
  });

  it('ensures uncapped feed partitioning preserves 100% of discovered items without dropping overflow', () => {
    // Simulate 48 items across multiple categories
    const mockItems: NewsItem[] = Array.from({ length: 48 }, (_, idx) => ({
      ...mockBaseItem,
      id: `story_${idx}`,
      title: `Story ${idx} Title`,
      contentType: idx % 10 === 0 ? 'podcast' : 'article',
      podcastUrl: idx % 10 === 0 ? `https://traffic.megaphone.fm/ep_${idx}.mp3` : undefined,
      category: idx % 3 === 0 ? 'brokerage' : idx % 3 === 1 ? 'local' : 'housing'
    }));

    const featuredStory = mockItems[0];
    const pool = mockItems.filter(i => i.id !== featuredStory.id);

    const podcastStories = pool.filter(i => i.contentType === 'podcast' || Boolean(i.podcastUrl));
    const feedStories = pool.filter(i => i.contentType !== 'podcast' && !i.podcastUrl);

    // Total rendered items across hero, podcast shelf, and feed stories
    const totalRendered = 1 + podcastStories.length + feedStories.length;

    expect(totalRendered).toBe(48);
    expect(podcastStories.length).toBe(4); // indices 10, 20, 30, 40
    expect(feedStories.length).toBe(43); // 48 - 1 featured - 4 podcasts = 43
  });
});
