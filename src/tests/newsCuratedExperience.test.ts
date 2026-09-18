/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseRssOrAtomFeed, sanitizeXml } from '../../server/services/news/rssFeedParser';
import { 
  isLowValueNoise, 
  classifyContent, 
  calculateSimilarity, 
  generateWhyWorthKnowing,
  SEED_CURATED_NEWS
} from '../../server/services/news/noraEditorialCurator';
import { NewsRepository } from '../../server/persistence/newsRepository';
import { getProductProfile } from '../config/productProfiles';
import { NEWS_SOURCE_REGISTRY } from '../../server/services/news/newsSourceRegistry';

describe('Nest Curated Real Estate News Experience', () => {
  let repo: NewsRepository;

  beforeEach(() => {
    repo = new NewsRepository();
  });

  describe('1. RSS & Atom Parser Safety and Media Extraction', () => {
    it('parses standard RSS 2.0 feed items accurately', () => {
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>HousingWire</title>
            <link>https://www.housingwire.com</link>
            <description>Real estate and mortgage news</description>
            <item>
              <title>Mortgage Rates Decline to Lowest Level in Six Months</title>
              <link>https://www.housingwire.com/articles/mortgage-rates-decline/</link>
              <description><![CDATA[Average 30-year fixed mortgage rates eased this week to 6.2%, spurring a mild rebound in purchase loan applications across the Southeast.]]></description>
              <pubDate>Mon, 01 Sep 2025 14:00:00 GMT</pubDate>
              <author>Sarah Wheeler</author>
            </item>
          </channel>
        </rss>`;

      const feed = parseRssOrAtomFeed(sampleXml);
      expect(feed.title).toBe('HousingWire');
      expect(feed.items.length).toBe(1);
      expect(feed.items[0].title).toBe('Mortgage Rates Decline to Lowest Level in Six Months');
      expect(feed.items[0].link).toBe('https://www.housingwire.com/articles/mortgage-rates-decline/');
      expect(feed.items[0].author).toBe('Sarah Wheeler');
      expect(feed.items[0].excerpt).toContain('Average 30-year fixed mortgage rates eased');
    });

    it('neutralizes XML External Entity (XXE) and DoS entity expansion payloads', () => {
      const maliciousXml = `<?xml version="1.0"?>
        <!DOCTYPE foo [
          <!ELEMENT foo ANY >
          <!ENTITY xxe SYSTEM "file:///etc/passwd" >
        ]>
        <rss version="2.0">
          <channel>
            <title>&xxe;</title>
            <item>
              <title>Safe Article</title>
              <link>https://example.com/safe</link>
              <description>&xxe;</description>
            </item>
          </channel>
        </rss>`;

      const sanitized = sanitizeXml(maliciousXml);
      expect(sanitized).not.toContain('<!DOCTYPE');
      expect(sanitized).not.toContain('<!ENTITY');
      expect(sanitized).not.toContain('file:///etc/passwd');

      const feed = parseRssOrAtomFeed(maliciousXml);
      expect(feed.items.length).toBe(1);
      expect(feed.items[0].title).toBe('Safe Article');
      expect(feed.items[0].excerpt).not.toContain('root:');
    });

    it('extracts podcast audio enclosures and duration', () => {
      const podcastXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
          <channel>
            <title>RealTrending Podcast</title>
            <item>
              <title>Executive Brief: Recruiting Brokerage Leaders in Q3</title>
              <link>https://realtrends.com/podcasts/episode-42</link>
              <description>Discussion on retention and recruitment economics.</description>
              <enclosure url="https://cdn.podcasts.com/rt-42.mp3" type="audio/mpeg" length="25000000" />
              <itunes:duration>28:45</itunes:duration>
            </item>
          </channel>
        </rss>`;

      const feed = parseRssOrAtomFeed(podcastXml);
      expect(feed.items.length).toBe(1);
      const ep = feed.items[0];
      expect(ep.podcastUrl).toBe('https://cdn.podcasts.com/rt-42.mp3');
      expect(ep.duration).toBe('28 min');
    });

    it('detects YouTube video URLs and extracts videoId and thumbnail', () => {
      const youtubeXml = `<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>HousingWire Daily Video</title>
          <entry>
            <title>Where Mortgage Rates Are Headed Next Month</title>
            <link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
            <summary>Weekly video overview of macro housing indicators.</summary>
            <published>2025-09-02T12:00:00Z</published>
          </entry>
        </feed>`;

      const feed = parseRssOrAtomFeed(youtubeXml);
      expect(feed.items.length).toBe(1);
      const vid = feed.items[0];
      expect(vid.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(vid.imageUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });
  });

  describe('2. Nora Editorial Curator & Noise Filtering', () => {
    it('filters out celebrity mansions and irrelevant clickbait', () => {
      const noiseTitle = 'Look inside this $45M celebrity mega-mansion with private golf simulator';
      const noiseDesc = 'Celebrity couple lists their Beverly Hills mansion after 3 years.';
      expect(isLowValueNoise(noiseTitle, noiseDesc)).toBe(true);

      const genericTipsTitle = '10 tips to clean and organize your kitchen pantry fast';
      expect(isLowValueNoise(genericTipsTitle, '')).toBe(true);
    });

    it('prioritizes core brokerage operations, commission changes, and NC local developments', () => {
      const brokerageTitle = 'Leading NC Independent Brokerage Merges With Regional Brand';
      const brokerageDesc = 'Acquisition adds 65 productive agents in the Triangle and Coastal markets.';
      expect(isLowValueNoise(brokerageTitle, brokerageDesc)).toBe(false);

      const source = NEWS_SOURCE_REGISTRY[0];
      const rawItem = {
        title: brokerageTitle,
        link: 'https://example.com',
        snippet: brokerageDesc,
        contentHash: 'hash_test_1',
        pubDate: '2026-09-01'
      };

      const classification = classifyContent(brokerageTitle, brokerageDesc, source, rawItem);
      expect(classification.category).toBe('local'); // NC mentions trigger local
      expect(classification.priorityScore).toBeGreaterThanOrEqual(7);

      const localTitle = 'Wilmington City Council Approves Mixed-Use Riverfront Redevelopment Overlay';
      const localClassification = classifyContent(localTitle, 'New zoning standard approved', source, {
        ...rawItem,
        title: localTitle
      });
      expect(localClassification.geography).toBe('local_wilmington');
      expect(localClassification.priorityScore).toBeGreaterThanOrEqual(8);
    });

    it('deduplicates overlapping stories using token similarity calculation', () => {
      const headlineA = 'Freddie Mac 30-Year Mortgage Rate Falls to 6.25 Percent';
      const headlineB = 'Mortgage Rates Drop: Freddie Mac Reports 30-Year at 6.25%';

      const similarity = calculateSimilarity(headlineA, headlineB);
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('generates cliché-free "Why it\'s worth knowing" rationale', () => {
      const localStory = {
        title: 'Cape Fear REALTORS Reports July 2025 Market Stats: Inventory Up 14%',
        excerpt: 'Inventory increased across New Hanover and Brunswick counties while median sale price held firm.',
        category: 'local'
      };

      const why = generateWhyWorthKnowing(localStory.title, localStory.excerpt, localStory.category);
      expect(why).toBeTruthy();
      expect(why.length).toBeGreaterThan(15);
      expect(why).not.toContain('In a world where');
      expect(why).not.toContain('Game-changing');
    });
  });

  describe('3. News Repository, Dual-Mode Storage & Editorial Logic', () => {
    it('seeds and returns curated news items', async () => {
      const { items } = await repo.getItems({ workspaceId: 'nest-realty-wilmington' });
      expect(items.length).toBeGreaterThan(0);
      
      // Ensure seed items contain diverse categories
      const categories = new Set(items.map(i => i.category));
      expect(categories.has('local')).toBe(true);
      expect(categories.has('brokerage')).toBe(true);
    });

    it('supports category filtering and search querying', async () => {
      const { items: localItems } = await repo.getItems({ 
        category: 'local',
        workspaceId: 'nest-realty-wilmington' 
      });
      expect(localItems.every(i => i.category === 'local')).toBe(true);

      const { items: searchResults } = await repo.getItems({
        search: 'Wilmington',
        workspaceId: 'nest-realty-wilmington'
      });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(i => 
        i.title.toLowerCase().includes('wilmington') || 
        i.noraSummary.toLowerCase().includes('wilmington') || 
        (i.tags || []).some(t => t.toLowerCase().includes('wilmington'))
      )).toBe(true);
    });

    it('handles bookmarking (save) and hiding actions with instant persistence', async () => {
      const { items } = await repo.getItems({ workspaceId: 'nest-realty-wilmington' });
      const target = items[0];

      // Save item
      await repo.recordUserAction('usr_ryan', target.id, 'save');

      // Verify it appears in saved items
      const { items: savedItems } = await repo.getItems({
        savedOnly: true,
        workspaceId: 'nest-realty-wilmington'
      }, 'usr_ryan');
      expect(savedItems.some(i => i.id === target.id)).toBe(true);

      // Hide item
      await repo.recordUserAction('usr_ryan', target.id, 'hide');

      // Verify it is excluded from normal view
      const { items: normalItems } = await repo.getItems({
        workspaceId: 'nest-realty-wilmington'
      }, 'usr_ryan');
      expect(normalItems.some(i => i.id === target.id)).toBe(false);
    });

    it('provides "Worth Your Time" featured curation', async () => {
      const worthYourTime = await repo.getWorthYourTime('nest-realty-wilmington');
      expect(worthYourTime).toHaveProperty('featured');
      expect(worthYourTime).toHaveProperty('secondary');
      expect(worthYourTime.secondary.length).toBeLessThanOrEqual(3);
    });
  });

  describe('4. Source Registry Completeness', () => {
    it('contains all required industry and regional sources', () => {
      const sourceIds = NEWS_SOURCE_REGISTRY.map(s => s.id);
      
      // National / Industry
      expect(sourceIds.some(id => id.includes('housingwire'))).toBe(true);
      expect(sourceIds.some(id => id.includes('realtrends'))).toBe(true);
      expect(sourceIds.some(id => id.includes('inman'))).toBe(true);
      expect(sourceIds.some(id => id.includes('real_estate_news'))).toBe(true);
      expect(sourceIds.some(id => id.includes('nar'))).toBe(true);
      
      // NC / Regional
      expect(sourceIds.some(id => id.includes('cape_fear_realtors'))).toBe(true);
      expect(sourceIds.some(id => id.includes('wilmingtonbiz'))).toBe(true);
      expect(sourceIds.some(id => id.includes('nc_realtors'))).toBe(true);
      
      // Multimedia
      expect(sourceIds.some(id => id.includes('realtrending_podcast'))).toBe(true);
      expect(sourceIds.some(id => id.includes('housingwire_daily'))).toBe(true);

      // Verify all sources have valid urls
      NEWS_SOURCE_REGISTRY.forEach(source => {
        expect(source.name).toBeTruthy();
        expect(source.siteUrl.startsWith('http')).toBe(true);
        expect(source.feedUrl.startsWith('http')).toBe(true);
        expect(['brokerage', 'housing', 'local', 'technology']).toContain(source.category);
      });
    });
  });

  describe('5. Product Profiles & Navigation Alignment', () => {
    it('registers News module in ryan_pilot profile directly under Tasks', () => {
      const profile = getProductProfile('ryan@nestrealty.com', 'admin', 'nest-realty-wilmington');
      expect(profile.experience).toBe('ryan_pilot');

      const moduleNames = profile.modules.map(m => m.name);
      expect(moduleNames).toContain('News');
      expect(moduleNames).toContain('Tasks');
      expect(moduleNames).toContain('Market Intelligence');

      const tasksIndex = moduleNames.indexOf('Tasks');
      const newsIndex = moduleNames.indexOf('News');
      expect(newsIndex).toBe(tasksIndex + 1);

      // Market Intelligence and News should be distinct
      const newsModule = profile.modules.find(m => m.name === 'News');
      const miModule = profile.modules.find(m => m.name === 'Market Intelligence');
      expect(newsModule?.tab).toBe('News');
      expect(miModule?.tab).toBe('Market Intelligence');
      expect(newsModule?.tab).not.toBe(miModule?.tab);
    });

    it('registers News module in full_customer profile directly under Tasks', () => {
      const profile = getProductProfile('agent@nestrealty.com', 'agent', 'nest-realty-raleigh');
      const moduleNames = profile.modules.map(m => m.name);
      expect(moduleNames).toContain('News');
      expect(moduleNames).toContain('Tasks');
      expect(moduleNames).toContain('Market Intelligence');

      const tasksIndex = moduleNames.indexOf('Tasks');
      const newsIndex = moduleNames.indexOf('News');
      expect(newsIndex).toBe(tasksIndex + 1);
    });
  });
});
