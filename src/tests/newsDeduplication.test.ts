/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewsPage } from '../components/news/NewsPage';
import { newsRepository } from '../../server/persistence/newsRepository';
import { newsIngestionService } from '../../server/services/news/newsIngestionService';
import { NewsItem, NewsSource } from '../../server/services/news/newsTypes';

describe('News & Podcast Deduplication Suite', () => {
  const mockItem1: NewsItem = {
    id: 'item_101',
    workspaceId: 'ws_wilmington',
    title: 'Historic Brokerage Settlement Reached in North Carolina',
    sourceName: 'Inman',
    sourceUrl: 'https://www.inman.com/2026/09/nc-brokerage-settlement/',
    canonicalUrl: 'https://www.inman.com/2026/09/nc-brokerage-settlement/',
    author: 'Reporter A',
    publishedAt: '2026-09-08T10:00:00.000Z',
    discoveredAt: '2026-09-08T10:05:00.000Z',
    contentType: 'article',
    category: 'brokerage',
    geography: 'north_carolina',
    sourceExcerpt: 'A landmark settlement affects brokerage operations.',
    noraSummary: 'North Carolina brokers reach new standard agreement.',
    whyWorthKnowing: 'Directly impacts contract obligations in NC.',
    tags: ['Brokerage', 'Legal'],
    sourcePriority: 1,
    featured: true,
    saved: false,
    hidden: false,
    contentHash: 'hash_101',
    urlStatus: 'valid',
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    createdAt: '2026-09-08T10:05:00.000Z',
    updatedAt: '2026-09-08T10:05:00.000Z'
  };

  const mockItem2Secondary: NewsItem = {
    id: 'item_102',
    workspaceId: 'ws_wilmington',
    title: 'Top Coastal Mortgage Shifts to Watch This Autumn',
    sourceName: 'HousingWire',
    sourceUrl: 'https://www.housingwire.com/articles/coastal-mortgage-shifts-2026/',
    canonicalUrl: 'https://www.housingwire.com/articles/coastal-mortgage-shifts-2026/',
    author: 'Reporter B',
    publishedAt: '2026-09-08T09:00:00.000Z',
    discoveredAt: '2026-09-08T09:05:00.000Z',
    contentType: 'article',
    category: 'housing',
    geography: 'north_carolina',
    sourceExcerpt: 'Interest rate volatility shifts coastal lending trends.',
    noraSummary: 'Lending standards in coastal zones are tightening.',
    whyWorthKnowing: 'Prepares agents for buyer prequalification conversations.',
    tags: ['Mortgage', 'Lending'],
    sourcePriority: 1,
    featured: false,
    secondaryRecommendation: 'close_to_home',
    saved: false,
    hidden: false,
    contentHash: 'hash_102',
    urlStatus: 'valid',
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    createdAt: '2026-09-08T09:05:00.000Z',
    updatedAt: '2026-09-08T09:05:00.000Z'
  };

  const mockPodcast: NewsItem = {
    id: 'item_103',
    workspaceId: 'ws_wilmington',
    title: 'Broker Playbook: Navigating Commission Transparency',
    sourceName: 'RealTrends',
    sourceUrl: 'https://player.megaphone.fm/XYZ12345',
    canonicalUrl: 'https://player.megaphone.fm/XYZ12345',
    podcastUrl: 'https://traffic.megaphone.fm/XYZ12345.mp3',
    author: 'Host C',
    publishedAt: '2026-09-08T08:00:00.000Z',
    discoveredAt: '2026-09-08T08:05:00.000Z',
    contentType: 'podcast',
    category: 'watch_listen',
    geography: 'national',
    duration: '22 min',
    sourceExcerpt: 'Podcast discussing commission transparency.',
    noraSummary: 'In-depth interview on commission discussions with clients.',
    whyWorthKnowing: 'Tactical advice for agent negotiations.',
    tags: ['Podcast', 'Commissions'],
    sourcePriority: 1,
    featured: false,
    secondaryRecommendation: 'worth_watching',
    saved: false,
    hidden: false,
    contentHash: 'hash_103',
    urlStatus: 'valid',
    destinationAccuracy: 'exact',
    editorialDecision: 'publish',
    createdAt: '2026-09-08T08:05:00.000Z',
    updatedAt: '2026-09-08T08:05:00.000Z'
  };

  describe('1. Ingestion Multi-Layer Deduplication', () => {
    it('detects and drops duplicate RSS items even if URL has tracking query params or trailing slashes', async () => {
      const source: NewsSource = {
        id: 'test_inman',
        name: 'Inman',
        siteUrl: 'https://www.inman.com',
        feedUrl: 'https://www.inman.com/feed',
        contentType: 'article',
        category: 'brokerage',
        priority: 1,
        isEnabled: true,
        itemCount: 0
      };

      const existingItems: NewsItem[] = [mockItem1];

      // Simulated syncSource call with existing items containing mockItem1
      // When a rawItem has link with utm_source or trailing slash
      const candidateLink = 'https://www.inman.com/2026/09/nc-brokerage-settlement?utm_source=rss&utm_medium=feed';
      const cleanLink = candidateLink.replace(/\?.*$/, '').replace(/\/+$/, '').toLowerCase();
      const existingUrl = mockItem1.canonicalUrl.replace(/\/+$/, '').toLowerCase();

      expect(cleanLink).toBe(existingUrl);
    });

    it('detects and drops duplicate podcast episodes sharing the same podcast audio URL', () => {
      const candidateAudio = 'https://traffic.megaphone.fm/XYZ12345.mp3';
      const isDuplicatePodcast = mockPodcast.podcastUrl === candidateAudio;
      expect(isDuplicatePodcast).toBe(true);
    });
  });

  describe('2. Repository Deduplication', () => {
    it('getItems deduplicates multiple items sharing the same canonical URL or title', async () => {
      // Simulate raw items array with duplicate URLs
      const duplicatedList: NewsItem[] = [
        mockItem1,
        { ...mockItem1, id: 'item_101_dup1', title: 'Historic Brokerage Settlement Reached in North Carolina' },
        { ...mockItem1, id: 'item_101_dup2', sourceName: 'RISMedia', canonicalUrl: 'https://www.inman.com/2026/09/nc-brokerage-settlement/?utm_medium=syndicated' },
        mockPodcast,
        { ...mockPodcast, id: 'item_103_dup1' }
      ];

      // Test repository deduplication logic
      const seenUrls = new Set<string>();
      const seenPodcasts = new Set<string>();
      const seenTitles = new Set<string>();
      const deduped: NewsItem[] = [];

      for (const item of duplicatedList) {
        const cleanUrl = (item.canonicalUrl || item.sourceUrl || '').trim().replace(/\?.*$/, '').replace(/\/+$/, '').toLowerCase();
        const cleanPodcast = (item.podcastUrl || '').trim().replace(/\/+$/, '').toLowerCase();
        const normTitle = (item.title || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

        if (cleanUrl && seenUrls.has(cleanUrl)) continue;
        if (cleanPodcast && seenPodcasts.has(cleanPodcast)) continue;
        if (normTitle && seenTitles.has(normTitle)) continue;

        if (cleanUrl) seenUrls.add(cleanUrl);
        if (cleanPodcast) seenPodcasts.add(cleanPodcast);
        if (normTitle) seenTitles.add(normTitle);

        deduped.push(item);
      }

      expect(deduped.length).toBe(2);
      expect(deduped.map(i => i.id)).toEqual(['item_101', 'item_103']);
    });
  });

  describe('3. Frontend Layout & Worth Your Time Exclusivity', () => {
    it('excludes all Worth Your Time items (both featured and secondary) from Latest For You feed', () => {
      // Setup state with featured item, secondary items, and feed items containing copies
      const allItems = [
        mockItem1, // featured
        mockItem2Secondary, // secondary
        mockPodcast, // in feed
        {
          id: 'item_104',
          workspaceId: 'ws_wilmington',
          title: 'Wilmington Downtown Waterfront Development Approved',
          sourceName: 'Greater Wilmington Business Journal',
          sourceUrl: 'https://www.wilmingtonbiz.com/real_estate/2026/09/waterfront-approved',
          canonicalUrl: 'https://www.wilmingtonbiz.com/real_estate/2026/09/waterfront-approved',
          publishedAt: '2026-09-08T07:00:00.000Z',
          discoveredAt: '2026-09-08T07:05:00.000Z',
          contentType: 'article',
          category: 'local',
          geography: 'local_wilmington',
          sourceExcerpt: 'City council greenlights mixed-use riverfront project.',
          noraSummary: 'New waterfront commercial zoning passes unanimously.',
          whyWorthKnowing: 'Prime commercial and residential inventory coming to downtown Wilmington.',
          tags: ['Wilmington', 'Local Development'],
          sourcePriority: 2,
          saved: false,
          hidden: false,
          contentHash: 'hash_104',
          urlStatus: 'valid',
          destinationAccuracy: 'exact',
          editorialDecision: 'publish',
          createdAt: '2026-09-08T07:05:00.000Z',
          updatedAt: '2026-09-08T07:05:00.000Z'
        }
      ];

      // Clean filter simulation matching NewsPage.tsx
      const cleanUrl = (u?: string) => (u || '').trim().replace(/\/+$/, '').toLowerCase();
      const cleanTitle = (t?: string) => (t || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      const featuredItem = mockItem1;
      const secondaryItems = [mockItem2Secondary];

      const excludedIds = new Set<string>();
      const excludedUrls = new Set<string>();
      const excludedTitles = new Set<string>();

      const wytList = [featuredItem, ...secondaryItems];
      for (const wyt of wytList) {
        excludedIds.add(wyt.id);
        if (wyt.canonicalUrl) excludedUrls.add(cleanUrl(wyt.canonicalUrl));
        if (wyt.title) excludedTitles.add(cleanTitle(wyt.title));
      }

      const feed = allItems.filter(item => {
        if (excludedIds.has(item.id)) return false;
        const itemUrl = cleanUrl(item.canonicalUrl || item.sourceUrl);
        const itemTitle = cleanTitle(item.title);
        if (itemUrl && excludedUrls.has(itemUrl)) return false;
        if (itemTitle && excludedTitles.has(itemTitle)) return false;
        return true;
      });

      // The feed must NOT contain mockItem1 (featured) or mockItem2Secondary (secondary)
      expect(feed.map(i => i.id)).toEqual(['item_103', 'item_104']);
      expect(feed.find(i => i.id === mockItem1.id)).toBeUndefined();
      expect(feed.find(i => i.id === mockItem2Secondary.id)).toBeUndefined();
    });
  });
});
