/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  classifyDestinationAccuracy, 
  parseRssXml 
} from '../../server/services/news/rssFeedParser';
import { 
  evaluateEditorialDecision, 
  isResourceNotNews, 
  isPromotionalOrVendorPitch, 
  isTooNicheOrPlumbing, 
  isLowSignalOrGeneric, 
  isCelebrityOrSensational, 
  findEventCluster,
  EventClusterReference 
} from '../../server/services/news/noraEditorialCurator';
import { NewsRepository } from '../../server/persistence/newsRepository';
import { NewsIngestionService } from '../../server/services/news/newsIngestionService';
import { NewsItem } from '../../server/services/news/newsTypes';
import { NewsCard } from '../components/news/NewsCard';

describe('Shapework / Nest News — Editorial Quality & Exact Destination Suite', () => {
  let repo: NewsRepository;

  beforeEach(() => {
    repo = new NewsRepository();
  });

  describe('1. Exact Destination Parsing & Megaphone Podcast Player Resolution', () => {
    it('resolves Megaphone audio enclosure to direct episode player rather than show collection', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>RealTrending</title>
            <link>https://www.housingwire.com/shows/realtrending/</link>
            <item>
              <title>Stephen Kowalchuk on the exit strategy playbook brokers tend to ignore</title>
              <link>https://www.housingwire.com/shows/realtrending/</link>
              <enclosure url="https://traffic.megaphone.fm/MDMHI8345178792.mp3?updated=1725102000" length="35489000" type="audio/mpeg"/>
              <pubDate>Mon, 31 Aug 2026 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>`;

      const feed = parseRssXml(xml, 'https://www.housingwire.com');
      expect(feed.items.length).toBe(1);
      const item = feed.items[0];
      expect(item.link).toBe('https://player.megaphone.fm/MDMHI8345178792');
      expect(item.destinationAccuracy).toBe('exact');
    });

    it('classifies destination URLs accurately across exact, collection, and homepage', () => {
      // Exact destinations
      expect(classifyDestinationAccuracy('https://player.megaphone.fm/MDMHI8345178792', 'podcast')).toBe('exact');
      expect(classifyDestinationAccuracy('https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/', 'article')).toBe('exact');
      expect(classifyDestinationAccuracy('https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/', 'article')).toBe('exact');
      expect(classifyDestinationAccuracy('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'video')).toBe('exact');
      expect(classifyDestinationAccuracy('https://youtu.be/dQw4w9WgXcQ', 'video')).toBe('exact');

      // Collection & directory destinations
      expect(classifyDestinationAccuracy('https://www.housingwire.com/shows/realtrending/', 'podcast')).toBe('collection');
      expect(classifyDestinationAccuracy('https://www.inman.com/category/brokerage/', 'article')).toBe('collection');
      expect(classifyDestinationAccuracy('https://www.housingwire.com/articles', 'article')).toBe('collection');
      expect(classifyDestinationAccuracy('https://www.ncrealtors.org/advocate-newsletter-archive/', 'article')).toBe('collection');
      expect(classifyDestinationAccuracy('https://www.youtube.com/user/InmanNews', 'video')).toBe('collection');

      // Homepage destinations
      expect(classifyDestinationAccuracy('https://www.housingwire.com', 'article')).toBe('homepage');
      expect(classifyDestinationAccuracy('https://www.housingwire.com/', 'article')).toBe('homepage');
      expect(classifyDestinationAccuracy('https://www.inman.com/index.html', 'article')).toBe('homepage');
    });
  });

  describe('2. Nora Editorial Decision Rules & Rejections', () => {
    it('rejects static resources, archives, and toolkits (resource_not_news)', () => {
      expect(isResourceNotNews('Advocate Newsletter Archive')).toBe(true);
      expect(isResourceNotNews('Leadership Academy Toolkit')).toBe(true);
      expect(isResourceNotNews('Appraisal Connection Archive')).toBe(true);
      expect(isResourceNotNews('2026 Forms Index and Change Summary')).toBe(true);

      const decision = evaluateEditorialDecision({
        title: 'Advocate Newsletter Archive - Summer 2026',
        sourceName: 'NC REALTORS',
        canonicalUrl: 'https://www.ncrealtors.org/advocate-archive/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'collection'
      });
      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('resource_not_news');
    });

    it('rejects promotional vendor PR and self-serving profiles (promotional)', () => {
      expect(isPromotionalOrVendorPitch('Truss Financial scales hybrid model with new direct lending platform')).toBe(true);
      expect(isPromotionalOrVendorPitch('PropStream announces new partnership with regional MLS')).toBe(true);
      expect(isPromotionalOrVendorPitch('Brokerage executive to speak at REI Tech Summit')).toBe(true);

      const decision = evaluateEditorialDecision({
        title: 'Truss Financial scales hybrid model with new direct lending platform',
        sourceName: 'HousingWire',
        canonicalUrl: 'https://www.housingwire.com/articles/truss-financial-scales-hybrid/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      });
      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('promotional');
    });

    it('rejects hyper-niche technical mortgage plumbing (too_niche)', () => {
      expect(isTooNicheOrPlumbing('George Morales on proprietary reverse mortgage conduits')).toBe(true);
      expect(isTooNicheOrPlumbing('MISMO updates standards for single credit report bi-merge data')).toBe(true);

      const decision = evaluateEditorialDecision({
        title: 'George Morales on proprietary reverse mortgage conduits and secondary liquidity',
        sourceName: 'HousingWire',
        canonicalUrl: 'https://www.housingwire.com/articles/george-morales-reverse/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      });
      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('too_niche');
    });

    it('rejects low-signal fluff listicles and trade elections (low_signal)', () => {
      expect(isLowSignalOrGeneric('FSBO.com rolls out tech platform to streamline seller listings')).toBe(true);
      expect(isLowSignalOrGeneric('Why the best master-planned communities are designed around everyday life')).toBe(true);
      expect(isLowSignalOrGeneric('Local REALTORS Association Elects 2026 Officers')).toBe(true);
      expect(isLowSignalOrGeneric('7 Tips to Boost Your Spring Curb Appeal')).toBe(true);

      const decision = evaluateEditorialDecision({
        title: '7 AI tools to streamline agent follow-up',
        sourceName: 'RISMedia',
        canonicalUrl: 'https://www.rismedia.com/2026/09/01/7-ai-tools/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      });
      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('low_signal');
    });

    it('rejects celebrity mansions, gossip, and sensationalism (celebrity_lifestyle)', () => {
      expect(isCelebrityOrSensational('Gloria Steinem buys $4.2M Manhattan brownstone')).toBe(true);
      expect(isCelebrityOrSensational('Suspect arrested for murder of South Florida real estate agent')).toBe(true);
      expect(isCelebrityOrSensational('Kardashian purchases $30M Malibu compound')).toBe(true);

      const decision = evaluateEditorialDecision({
        title: 'Gloria Steinem buys $4.2M Manhattan brownstone',
        sourceName: 'Real Estate News',
        canonicalUrl: 'https://www.realestatenews.com/2026/09/01/gloria-steinem-brownstone/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      });
      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('celebrity_lifestyle');
    });

    it('approves high-signal strategic brokerage and policy news (publish)', () => {
      const decision = evaluateEditorialDecision({
        title: 'What the NWMLS settlement really tells us about the future of real estate marketing',
        sourceName: 'Inman',
        canonicalUrl: 'https://www.inman.com/2026/09/04/nwmls-settlement-ob-jacobi/',
        sourceExcerpt: 'The Northwest Multiple Listing Service settlement offers a blueprint for how independent brokerages should structure listing exposure.',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      });
      expect(decision.decision).toBe('publish');
      expect(decision.priorityScore).toBeGreaterThanOrEqual(8);
    });
  });

  describe('3. Topic Event Clustering Across Publishers', () => {
    it('detects and clusters multi-publisher coverage of the same event', () => {
      const existingClusters: EventClusterReference[] = [
        {
          title: 'What the NWMLS settlement really tells us about the future of real estate marketing',
          clusterId: 'cluster_nwmls_settlement',
          sourceName: 'Inman'
        }
      ];

      const match = findEventCluster(
        'Brokerages analyze NWMLS settlement terms and competitive impact',
        existingClusters
      );
      expect(match).not.toBeNull();
      expect(match?.clusterId).toBe('cluster_nwmls_settlement');

      // Nora evaluation should reject duplicate event coverage
      const decision = evaluateEditorialDecision({
        title: 'Brokerages analyze NWMLS settlement terms and competitive impact',
        sourceName: 'HousingWire',
        canonicalUrl: 'https://www.housingwire.com/articles/nwmls-settlement-terms/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      }, { existingClusterTitles: existingClusters });

      expect(decision.decision).toBe('reject');
      expect(decision.reason).toBe('duplicate_event');
    });
  });

  describe('4. Source Saturation Throttling', () => {
    it('caps high-volume publishers at 2 stories in active feed window unless breaking priority >= 9', () => {
      const sourceCountMap = new Map<string, number>();
      sourceCountMap.set('HousingWire', 2);

      // Normal priority story (priority 5-7) rejected due to saturation
      const normalDecision = evaluateEditorialDecision({
        title: 'Fay Group acquires VanDyk Mortgage to expand retail footprint',
        sourceName: 'HousingWire',
        canonicalUrl: 'https://www.housingwire.com/articles/fay-group-vandyk/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      }, { publishedBySourceCount: sourceCountMap });

      expect(normalDecision.decision).toBe('reject');
      expect(normalDecision.reason).toBe('source_saturation');

      // Exceptional breaking story (priority >= 9) can bypass saturation
      const breakingDecision = evaluateEditorialDecision({
        title: 'Cape Fear / Wilmington regional housing inventory plummets 30% amidst coastal rezoning',
        sourceName: 'HousingWire',
        sourceExcerpt: 'Wilmington and Cape Fear residential supply drops sharply under new NCREC compliance rules.',
        canonicalUrl: 'https://www.housingwire.com/articles/wilmington-inventory/',
        publishedAt: new Date().toISOString(),
        destinationAccuracy: 'exact'
      }, { publishedBySourceCount: sourceCountMap });

      expect(breakingDecision.decision).toBe('publish');
    });
  });

  describe('5. Editorial Highlights & Single Featured Constraint', () => {
    it('enforces strictly one primary featured item and at most two secondary recommendations', () => {
      const items: NewsItem[] = [
        {
          id: 'item_1',
          workspaceId: 'ws_wilmington',
          title: 'Can tech keep agents out of trouble for listing mistakes?',
          sourceName: 'HousingWire',
          sourceUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
          canonicalUrl: 'https://www.housingwire.com/articles/tech-avoid-marketing-misrepresentation/',
          contentType: 'article',
          category: 'technology',
          destinationAccuracy: 'exact',
          editorialDecision: 'publish',
          urlStatus: 'valid',
          publishedAt: '2026-09-07T14:00:00Z',
          summary: 'Compliance rules overview.'
        },
        {
          id: 'item_2',
          workspaceId: 'ws_wilmington',
          title: 'Stephen Kowalchuk on the exit strategy playbook',
          sourceName: 'RealTrending Podcast',
          sourceUrl: 'https://player.megaphone.fm/MDMHI8345178792',
          canonicalUrl: 'https://player.megaphone.fm/MDMHI8345178792',
          contentType: 'podcast',
          category: 'brokerage',
          destinationAccuracy: 'exact',
          editorialDecision: 'publish',
          urlStatus: 'valid',
          publishedAt: '2026-08-31T10:00:00Z',
          summary: 'Podcast on brokerage valuation.'
        },
        {
          id: 'item_3',
          workspaceId: 'ws_wilmington',
          title: 'Wilmington Commercial & Residential Development Update',
          sourceName: 'Port City Daily',
          sourceUrl: 'https://portcitydaily.com/development-update',
          canonicalUrl: 'https://portcitydaily.com/development-update',
          contentType: 'local_development',
          category: 'local',
          geography: 'local_wilmington',
          destinationAccuracy: 'exact',
          editorialDecision: 'publish',
          urlStatus: 'valid',
          publishedAt: '2026-08-30T10:00:00Z',
          summary: 'Local Cape Fear market update.'
        }
      ];

      const ingestion = new NewsIngestionService();
      ingestion.refreshEditorialHighlights(items);

      const featuredItems = items.filter(i => i.featured);
      const secondaryItems = items.filter(i => i.secondaryRecommendation);

      expect(featuredItems.length).toBe(1);
      expect(secondaryItems.length).toBeLessThanOrEqual(2);
      expect(featuredItems[0].destinationAccuracy).toBe('exact');
    });
  });

  describe('6. Frontend NewsCard CTA Protection', () => {
    it('suppresses external Read/Watch/Listen CTAs when destinationAccuracy is not exact', () => {
      const collectionItem: NewsItem = {
        id: 'test_col_1',
        workspaceId: 'ws_wilmington',
        title: 'HousingWire RealTrending Show Series',
        sourceName: 'RealTrending Podcast',
        sourceUrl: 'https://www.housingwire.com/shows/realtrending/',
        canonicalUrl: 'https://www.housingwire.com/shows/realtrending/',
        contentType: 'podcast',
        category: 'brokerage',
        destinationAccuracy: 'collection',
        editorialDecision: 'reject',
        urlStatus: 'valid',
        publishedAt: '2026-08-31T10:00:00Z',
        summary: 'Podcast show archive.'
      };

      const html = renderToStaticMarkup(React.createElement(NewsCard, { item: collectionItem }));
      expect(html).not.toContain('>Listen<');
      expect(html).not.toContain('>Read<');
      expect(html).toContain('Source unavailable');
    });

    it('renders external CTAs normally when destinationAccuracy is exact', () => {
      const exactItem: NewsItem = {
        id: 'test_exact_1',
        workspaceId: 'ws_wilmington',
        title: 'Stephen Kowalchuk on the exit strategy playbook',
        sourceName: 'RealTrending Podcast',
        sourceUrl: 'https://player.megaphone.fm/MDMHI8345178792',
        canonicalUrl: 'https://player.megaphone.fm/MDMHI8345178792',
        contentType: 'podcast',
        category: 'brokerage',
        destinationAccuracy: 'exact',
        editorialDecision: 'publish',
        urlStatus: 'valid',
        publishedAt: '2026-08-31T10:00:00Z',
        summary: 'Direct podcast player.'
      };

      const html = renderToStaticMarkup(React.createElement(NewsCard, { item: exactItem }));
      expect(html).toContain('>Listen<');
      expect(html).not.toContain('Source unavailable');
    });
  });
});
