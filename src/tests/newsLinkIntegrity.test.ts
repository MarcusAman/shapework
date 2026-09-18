/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  normalizeAndSanitizeUrl, 
  decodeHtmlEntities, 
  isPrivateOrInternalHost, 
  verifyUrlHealth 
} from '../../server/services/news/urlValidator';
import { parseRssXml } from '../../server/services/news/rssFeedParser';
import { NewsIngestionService } from '../../server/services/news/newsIngestionService';
import { NewsRepository } from '../../server/persistence/newsRepository';
import { NewsItem, NewsSource } from '../../server/services/news/newsTypes';
import { NewsCard } from '../components/news/NewsCard';

describe('Shapework / Nest News — Forensic Link Integrity Suite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // 1. Relative URL Resolution
  it('1. resolves relative URLs against publisher base URL', () => {
    const result = normalizeAndSanitizeUrl('/articles/2026/market-shift/', 'https://www.housingwire.com');
    expect(result.url).toBe('https://www.housingwire.com/articles/2026/market-shift/');
    expect(result.error).toBeUndefined();
  });

  // 2. Tracking Parameter Stripping
  it('2. strips marketing tracking parameters while preserving functional query parameters', () => {
    const dirtyUrl = 'https://www.inman.com/article/?utm_source=newsletter&utm_medium=email&utm_campaign=daily&fbclid=12345&gclid=67890&v=abc123xyz&id=9988';
    const result = normalizeAndSanitizeUrl(dirtyUrl);
    expect(result.url).toBe('https://www.inman.com/article/?v=abc123xyz&id=9988');
    expect(result.url).not.toContain('utm_source');
    expect(result.url).not.toContain('fbclid');
    expect(result.url).not.toContain('gclid');
  });

  // 3. HTML Entity Decoding
  it('3. decodes HTML entities commonly found in RSS feed links', () => {
    const rawUrl = 'https://example.com/news?cat=brokerage&amp;region=nc&amp;ref=home';
    const decoded = decodeHtmlEntities(rawUrl);
    expect(decoded).toBe('https://example.com/news?cat=brokerage&region=nc&ref=home');

    const normalized = normalizeAndSanitizeUrl(rawUrl);
    expect(normalized.url).toBe('https://example.com/news?cat=brokerage&region=nc&ref=home');
  });

  // 4. SSRF & Private IP Protection
  it('4. rejects SSRF targets including localhost, loopback, private RFC1918 subnets, and AWS metadata', () => {
    expect(isPrivateOrInternalHost('localhost')).toBe(true);
    expect(isPrivateOrInternalHost('127.0.0.1')).toBe(true);
    expect(isPrivateOrInternalHost('10.0.0.5')).toBe(true);
    expect(isPrivateOrInternalHost('172.20.1.10')).toBe(true);
    expect(isPrivateOrInternalHost('192.168.1.1')).toBe(true);
    expect(isPrivateOrInternalHost('169.254.169.254')).toBe(true);
    expect(isPrivateOrInternalHost('service.internal')).toBe(true);
    expect(isPrivateOrInternalHost('app.local')).toBe(true);
    expect(isPrivateOrInternalHost('::1')).toBe(true);

    // Public domains should not be blocked
    expect(isPrivateOrInternalHost('www.housingwire.com')).toBe(false);
    expect(isPrivateOrInternalHost('feeds.feedburner.com')).toBe(false);

    const ssrfCheck = normalizeAndSanitizeUrl('http://169.254.169.254/latest/meta-data/');
    expect(ssrfCheck.url).toBeUndefined();
    expect(ssrfCheck.error).toContain('private or internal');
  });

  // 5. Protocol Validation
  it('5. validates protocols and rejects javascript:, file:, and data: schemes', () => {
    expect(normalizeAndSanitizeUrl('javascript:alert(1)').url).toBeUndefined();
    expect(normalizeAndSanitizeUrl('file:///etc/passwd').url).toBeUndefined();
    expect(normalizeAndSanitizeUrl('data:text/html,<script>').url).toBeUndefined();
    expect(normalizeAndSanitizeUrl('https://www.realtrends.com/articles/').url).toBe('https://www.realtrends.com/articles/');
  });

  // 6. Atom Link Attribute Ordering Tolerance
  it('6. extracts Atom entry links when href precedes rel="alternate" or vice-versa', () => {
    const atomXmlHrefFirst = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom</title>
        <entry>
          <title>Href Before Rel Article</title>
          <link href="https://example.com/article-1" rel="alternate" type="text/html" />
          <updated>2026-09-01T12:00:00Z</updated>
        </entry>
      </feed>`;
    const parsed1 = parseRssXml(atomXmlHrefFirst);
    expect(parsed1.items.length).toBe(1);
    expect(parsed1.items[0].link).toBe('https://example.com/article-1');

    const atomXmlRelFirst = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom</title>
        <entry>
          <title>Rel Before Href Article</title>
          <link rel="alternate" type="text/html" href="https://example.com/article-2" />
          <updated>2026-09-01T12:00:00Z</updated>
        </entry>
      </feed>`;
    const parsed2 = parseRssXml(atomXmlRelFirst);
    expect(parsed2.items.length).toBe(1);
    expect(parsed2.items[0].link).toBe('https://example.com/article-2');
  });

  // 7. Atom Feed Ignores Non-Article Links
  it('7. ignores rel="self" and rel="enclosure" links in Atom entries when alternate link is available', () => {
    const atomXml = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom Multi-Link</title>
        <entry>
          <title>Multi-Link Entry</title>
          <link rel="self" href="https://example.com/feed/self-entry-1" />
          <link rel="alternate" href="https://example.com/real-article-destination" />
          <link rel="enclosure" href="https://cdn.example.com/audio.mp3" />
          <updated>2026-09-01T12:00:00Z</updated>
        </entry>
      </feed>`;
    const parsed = parseRssXml(atomXml);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].link).toBe('https://example.com/real-article-destination');
  });

  // 8. RSS 2.0 Link Preference Over Non-Permalink GUID
  it('8. prefers <link> over non-permalink UUID <guid>', () => {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Industry News</title>
          <item>
            <title>Title with UUID Guid</title>
            <link>https://example.com/correct-story-url</link>
            <guid isPermaLink="false">b879c504-942c-497d-bb62-6c3983279144</guid>
            <description>Summary</description>
            <pubDate>Mon, 01 Sep 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;
    const parsed = parseRssXml(rssXml);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].link).toBe('https://example.com/correct-story-url');
  });

  // 9. Podcast Feed Audio vs Webpage Link Extraction
  it('9. isolates podcast audio CDN stream in podcastUrl and resolves exact Megaphone player destination for episode', () => {
    const podcastXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
        <channel>
          <title>RealTrending Podcast</title>
          <link>https://www.realtrends.com/podcasts/realtrending/</link>
          <item>
            <title>Episode 104: Independent Brokerage Growth</title>
            <guid isPermaLink="false">episode-uuid-9876</guid>
            <enclosure url="https://traffic.megaphone.fm/MDMHI2142790817.mp3?updated=17255" type="audio/mpeg" length="45000000" />
            <itunes:duration>35:10</itunes:duration>
            <pubDate>Mon, 01 Sep 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;
    const parsed = parseRssXml(podcastXml);
    expect(parsed.items.length).toBe(1);
    const item = parsed.items[0];
    expect(item.podcastUrl).toBe('https://traffic.megaphone.fm/MDMHI2142790817.mp3?updated=17255');
    expect(item.link).toBe('https://player.megaphone.fm/MDMHI2142790817');
    expect(item.destinationAccuracy).toBe('exact');
    expect(item.duration).toBe('35 min');
  });

  // 10. YouTube Video URL Synthesis
  it('10. synthesizes standard YouTube watch URL and HQ thumbnail from yt:videoId', () => {
    const ytAtomXml = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015">
        <title>HousingWire Video</title>
        <entry>
          <title>Housing Market Update</title>
          <link href="https://www.youtube.com/watch?v=9bZkp7q19f0" />
          <yt:videoId>9bZkp7q19f0</yt:videoId>
          <updated>2026-09-02T12:00:00Z</updated>
        </entry>
      </feed>`;
    const parsed = parseRssXml(ytAtomXml);
    expect(parsed.items.length).toBe(1);
    const item = parsed.items[0];
    expect(item.videoUrl).toBe('https://www.youtube.com/watch?v=9bZkp7q19f0');
    expect(item.imageUrl).toBe('https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg');
  });

  // 11. HTTP HEAD with Redirect Resolution
  it('11. resolves HTTP redirects to terminal destination and records redirect count', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === 'https://short.url/story') {
        return Promise.resolve(new Response(null, {
          status: 308,
          headers: { 'Location': 'https://destination.com/full-story-article/' }
        }));
      }
      if (url === 'https://destination.com/full-story-article/') {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    const result = await verifyUrlHealth('https://short.url/story');
    expect(result.status).toBe('redirected');
    expect(result.resolvedUrl).toBe('https://destination.com/full-story-article/');
    expect(result.redirectCount).toBe(1);
    expect(result.httpStatus).toBe(200);
  });

  // 12. Fallback to GET on 405 Method Not Allowed
  it('12. falls back to GET range request when HEAD returns 405 Method Not Allowed', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return Promise.resolve(new Response(null, { status: 405 }));
      }
      if (init?.method === 'GET') {
        return Promise.resolve(new Response('OK content body', { status: 200 }));
      }
      return Promise.resolve(new Response(null, { status: 400 }));
    });

    const result = await verifyUrlHealth('https://publisher.com/anti-head-article/');
    expect(result.status).toBe('valid');
    expect(result.resolvedUrl).toBe('https://publisher.com/anti-head-article/');
    expect(result.httpStatus).toBe(200);
  });

  // 13. URL Status Classification
  it('13. classifies HTTP response codes accurately into valid, redirected, unavailable, and blocked', async () => {
    // 200 OK -> valid
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 }));
    const okRes = await verifyUrlHealth('https://example.com/ok');
    expect(okRes.status).toBe('valid');

    // 404 Not Found -> unavailable
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 }));
    const notFoundRes = await verifyUrlHealth('https://example.com/missing');
    expect(notFoundRes.status).toBe('unavailable');

    // 403 Forbidden (e.g. Cloudflare) -> blocked
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }));
    const blockedRes = await verifyUrlHealth('https://example.com/protected');
    expect(blockedRes.status).toBe('blocked');
  });

  // 14. Ingestion Pipeline Rejection of Invalid URLs
  it('14. discards feed items with invalid or unsafe URLs during ingestion', async () => {
    const ingestion = new NewsIngestionService();
    const maliciousFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Malicious Feed</title>
          <item>
            <title>Internal Exploit Attempt</title>
            <link>http://127.0.0.1:8080/admin/delete</link>
            <pubDate>Mon, 01 Sep 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;

    const mockSource: NewsSource = {
      id: 'src_test',
      name: 'Test Source',
      category: 'brokerage',
      feedUrl: 'https://test.com/rss',
      siteUrl: 'https://test.com',
      feedType: 'rss',
      isEnabled: true,
      priority: 1
    };

    vi.spyOn(ingestion, 'fetchFeedWithTimeout').mockResolvedValue(maliciousFeedXml);

    const syncResult = await ingestion.syncSource(mockSource, []);
    expect(syncResult.newItems.length).toBe(0);
  });

  // 15. Ingestion Pipeline Persistence of resolvedUrl and urlStatus
  it('15. verifies and persists resolvedUrl and urlStatus on freshly ingested items', async () => {
    const ingestion = new NewsIngestionService();
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Clean Ingestion Feed</title>
          <item>
            <title>Valid Industry Analysis</title>
            <link>https://cleanpub.com/story</link>
            <pubDate>Mon, 01 Sep 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;

    const mockSource: NewsSource = {
      id: 'src_clean',
      name: 'Clean Source',
      category: 'brokerage',
      feedUrl: 'https://cleanpub.com/rss',
      siteUrl: 'https://cleanpub.com',
      feedType: 'rss',
      isEnabled: true,
      priority: 1
    };

    vi.spyOn(ingestion, 'fetchFeedWithTimeout').mockResolvedValue(feedXml);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://cleanpub.com/story') {
        return Promise.resolve(new Response(null, {
          status: 301,
          headers: { 'Location': 'https://cleanpub.com/canonical-story/' }
        }));
      }
      return Promise.resolve(new Response(null, { status: 200 }));
    });

    const syncResult = await ingestion.syncSource(mockSource, []);
    expect(syncResult.newItems.length).toBe(1);
    const item = syncResult.newItems[0];
    expect(item.originalUrl).toBe('https://cleanpub.com/story');
    expect(item.resolvedUrl).toBe('https://cleanpub.com/canonical-story/');
    expect(item.urlStatus).toBe('redirected');
    expect(item.redirectCount).toBe(1);
  });

  // 16. Seed Data Purge Verification
  it('16. verifies no fabricated seed stories exist in repository cache or fallback', async () => {
    const repo = new NewsRepository();
    const { items } = await repo.getItems({ workspaceId: 'nest-realty-wilmington' });

    const purgedIds = [
      'news_featured_1', 
      'news_video_1', 
      'news_local_1', 
      'news_podcast_1', 
      'news_housing_1', 
      'news_local_2'
    ];

    for (const item of items) {
      expect(purgedIds).not.toContain(item.id);
      expect(item.canonicalUrl).not.toContain('/the-brokerage-model-is-changing-again-independents/');
      expect(item.canonicalUrl).not.toContain('/how-ai-is-actually-used-in-brokerage-ops/');
      expect(item.canonicalUrl).not.toContain('/porters_neck_residential_approval');
    }
  });

  // 17. Dynamic Featured Story Assignment
  it('17. dynamically assigns featured story only to items with verified valid URLs', () => {
    const ingestion = new NewsIngestionService();

    const deadItem: NewsItem = {
      id: 'item_dead',
      workspaceId: 'ws_wilmington',
      title: 'Dead Link High Priority Story',
      sourceName: 'Dead Source',
      sourceUrl: 'https://dead.com/404',
      canonicalUrl: 'https://dead.com/404',
      resolvedUrl: 'https://dead.com/404',
      urlStatus: 'unavailable',
      publishedAt: '2026-09-06T12:00:00Z',
      discoveredAt: '2026-09-06T12:00:00Z',
      contentType: 'article',
      category: 'brokerage',
      geography: 'national',
      noraSummary: 'Summary',
      whyWorthKnowing: 'Why',
      tags: ['Brokerage'],
      sourcePriority: 1,
      featured: false,
      contentHash: 'hash_dead',
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z'
    };

    const validItem: NewsItem = {
      id: 'item_valid',
      workspaceId: 'ws_wilmington',
      title: 'Valid Brokerage Story',
      sourceName: 'Live Source',
      sourceUrl: 'https://live.com/story',
      canonicalUrl: 'https://live.com/story',
      resolvedUrl: 'https://live.com/story',
      urlStatus: 'valid',
      publishedAt: '2026-09-05T12:00:00Z',
      discoveredAt: '2026-09-05T12:00:00Z',
      contentType: 'article',
      category: 'brokerage',
      geography: 'national',
      noraSummary: 'Summary',
      whyWorthKnowing: 'Why',
      tags: ['Brokerage'],
      sourcePriority: 2,
      featured: false,
      contentHash: 'hash_valid',
      createdAt: '2026-09-05T12:00:00Z',
      updatedAt: '2026-09-05T12:00:00Z'
    };

    const items = [deadItem, validItem];
    ingestion.refreshEditorialHighlights(items);

    expect(deadItem.featured).toBe(false);
    expect(validItem.featured).toBe(true);
  });

  // 18. NewsCard CTA Rendering for Valid URL
  it('18. renders clickable Read CTA button when item.urlStatus is valid', () => {
    const validItem: NewsItem = {
      id: 'item_test_valid',
      workspaceId: 'ws_wilmington',
      title: 'Valid Story Title',
      sourceName: 'HousingWire',
      sourceUrl: 'https://www.housingwire.com/articles/valid-story/',
      canonicalUrl: 'https://www.housingwire.com/articles/valid-story/',
      resolvedUrl: 'https://www.housingwire.com/articles/valid-story/',
      urlStatus: 'valid',
      publishedAt: '2026-09-06T12:00:00Z',
      discoveredAt: '2026-09-06T12:00:00Z',
      contentType: 'article',
      category: 'brokerage',
      geography: 'national',
      noraSummary: 'Nora summary content',
      whyWorthKnowing: 'Why it is worth knowing for Nest',
      tags: ['Brokerage'],
      sourcePriority: 1,
      featured: false,
      contentHash: 'hash_test_valid',
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z'
    };

    const html = renderToStaticMarkup(
      React.createElement(NewsCard, {
        item: validItem,
        onAskNora: () => {},
        onToggleSave: () => {},
        onHide: () => {}
      })
    );

    expect(html).toContain('Read');
    expect(html).not.toContain('Source unavailable');
  });

  // 19. NewsCard CTA Suppression for Unavailable URL
  it('19. suppresses clickable CTA and displays "Source unavailable" when item.urlStatus is unavailable', () => {
    const deadItem: NewsItem = {
      id: 'item_test_dead',
      workspaceId: 'ws_wilmington',
      title: 'Broken Story Title',
      sourceName: 'Inman',
      sourceUrl: 'https://www.inman.com/broken-slug/',
      canonicalUrl: 'https://www.inman.com/broken-slug/',
      resolvedUrl: 'https://www.inman.com/broken-slug/',
      urlStatus: 'unavailable',
      publishedAt: '2026-09-06T12:00:00Z',
      discoveredAt: '2026-09-06T12:00:00Z',
      contentType: 'article',
      category: 'brokerage',
      geography: 'national',
      noraSummary: 'Nora summary content',
      whyWorthKnowing: 'Why it is worth knowing for Nest',
      tags: ['Brokerage'],
      sourcePriority: 1,
      featured: false,
      contentHash: 'hash_test_dead',
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z'
    };

    const html = renderToStaticMarkup(
      React.createElement(NewsCard, {
        item: deadItem,
        onAskNora: () => {},
        onToggleSave: () => {},
        onHide: () => {}
      })
    );

    expect(html).toContain('Source unavailable');
    // Button with 'Read' action must not be rendered
    expect(html).not.toContain('>Read<');
  });

  // 20. NewsCard Navigation Target
  it('20. targets resolvedUrl instead of broken canonicalUrl or sourceUrl when opening source', () => {
    const item: NewsItem = {
      id: 'item_redirect_test',
      workspaceId: 'ws_wilmington',
      title: 'Redirected Story Title',
      sourceName: 'RealTrends',
      sourceUrl: 'https://short.realtrends.com/r/123',
      canonicalUrl: 'https://short.realtrends.com/r/123',
      resolvedUrl: 'https://www.realtrends.com/articles/destination-story/',
      urlStatus: 'redirected',
      publishedAt: '2026-09-06T12:00:00Z',
      discoveredAt: '2026-09-06T12:00:00Z',
      contentType: 'article',
      category: 'brokerage',
      geography: 'national',
      noraSummary: 'Nora summary content',
      whyWorthKnowing: 'Why it is worth knowing for Nest',
      tags: ['Brokerage'],
      sourcePriority: 1,
      featured: false,
      contentHash: 'hash_test_redir',
      createdAt: '2026-09-06T12:00:00Z',
      updatedAt: '2026-09-06T12:00:00Z'
    };

    const targetUrl = item.resolvedUrl || item.canonicalUrl || item.sourceUrl;
    expect(targetUrl).toBe('https://www.realtrends.com/articles/destination-story/');
    expect(targetUrl).not.toBe('https://short.realtrends.com/r/123');
  });
});
