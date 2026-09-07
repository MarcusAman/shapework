/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem, NewsSource, DestinationAccuracy, EditorialDecision, EditorialRejectionReason } from './newsTypes';
import { parseRssXml, classifyDestinationAccuracy } from './rssFeedParser';
import { 
  isLowValueNoise, 
  classifyContent, 
  generateCleanSummary, 
  generateWhyWorthKnowing, 
  calculateSimilarity,
  evaluateEditorialDecision,
  EventClusterReference,
  isLowSignalOrGeneric,
  isStaleItem,
  isResourceNotNews,
  isPromotionalOrVendorPitch,
  isTooNicheOrPlumbing,
  isCelebrityOrSensational
} from './noraEditorialCurator';
import { INITIAL_NEWS_SOURCES } from './newsSourceRegistry';
import { verifyUrlHealth } from './urlValidator';

export interface NewsIngestionMetrics {
  discovered: number;
  deterministicRejected: number;
  editorialRejected: number;
  clustersRemoved: number;
  published: number;
  worthYourTimeCount: number;
}

export class NewsIngestionService {
  private sources: NewsSource[] = [...INITIAL_NEWS_SOURCES];
  private isSyncing: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private lastMetrics: NewsIngestionMetrics = {
    discovered: 0,
    deterministicRejected: 0,
    editorialRejected: 0,
    clustersRemoved: 0,
    published: 0,
    worthYourTimeCount: 0
  };

  constructor() {}

  public getSources(): NewsSource[] {
    return this.sources;
  }

  public getSource(id: string): NewsSource | undefined {
    return this.sources.find(s => s.id === id);
  }

  public updateSource(id: string, updates: Partial<NewsSource>): NewsSource | null {
    const idx = this.sources.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.sources[idx] = { ...this.sources[idx], ...updates };
    return this.sources[idx];
  }

  public getLastMetrics(): NewsIngestionMetrics {
    return { ...this.lastMetrics };
  }

  /**
   * Safe feed fetcher with strict timeout, AbortController, and SSRF prevention
   */
  public async fetchFeedWithTimeout(url: string, timeoutMs: number = 7000): Promise<string | null> {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        console.warn(`[News Ingestion] Blocked unsafe protocol: ${parsedUrl.protocol}`);
        return null;
      }

      // Defense against local network SSRF
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        console.warn(`[News Ingestion] Blocked private IP SSRF target: ${hostname}`);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ShapeworkNewsBot/1.0 (+https://shapework.co; editorial curation)',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[News Ingestion] Failed to fetch feed ${url}: HTTP ${response.status}`);
        return null;
      }

      const text = await response.text();
      return text;
    } catch (err: any) {
      console.warn(`[News Ingestion] Network timeout or error fetching ${url}: ${err.message}`);
      return null;
    }
  }

  /**
   * Synchronize single source and process items with strict URL integrity verification
   */
  public async syncSource(
    source: NewsSource, 
    existingItems: NewsItem[],
    workspaceId: string = 'ws_wilmington',
    editorialContext?: {
      publishedBySourceCount?: Map<string, number>;
      existingClusterTitles?: EventClusterReference[];
    }
  ): Promise<{ 
    newItems: NewsItem[]; 
    metrics: {
      discovered: number;
      deterministicRejected: number;
      editorialRejected: number;
      clustersRemoved: number;
      published: number;
    };
    error?: string;
  }> {
    const metrics = {
      discovered: 0,
      deterministicRejected: 0,
      editorialRejected: 0,
      clustersRemoved: 0,
      published: 0
    };

    if (!source.isEnabled) {
      return { newItems: [], metrics };
    }

    const xml = await this.fetchFeedWithTimeout(source.feedUrl);
    if (!xml) {
      source.lastError = 'Network timeout or invalid feed response';
      source.lastSyncedAt = new Date().toISOString();
      return { newItems: [], metrics, error: source.lastError };
    }

    try {
      const parsedFeed = parseRssXml(xml, source.siteUrl);
      source.lastError = undefined;
      source.lastSyncedAt = new Date().toISOString();
      source.itemCount = parsedFeed.items.length;

      const newlyProcessed: NewsItem[] = [];

      for (const rawItem of parsedFeed.items) {
        metrics.discovered++;

        // Minimum title context check
        if (!rawItem.title || rawItem.title.trim().length < 8) {
          metrics.deterministicRejected++;
          continue;
        }

        // Fast hash / URL check against already-ingested items
        const existingExact = existingItems.find(
          item => item.contentHash === rawItem.contentHash || 
                  item.sourceUrl === rawItem.link ||
                  item.canonicalUrl === rawItem.link
        );
        if (existingExact) {
          continue;
        }

        // Fast stale check (stale items don't need URL verification)
        if (rawItem.pubDate && isStaleItem(rawItem.pubDate, 14)) {
          metrics.editorialRejected++;
          continue;
        }

        // Fast noise / low value check
        if (
          isResourceNotNews(rawItem.title, rawItem.excerpt, rawItem.link) ||
          isPromotionalOrVendorPitch(rawItem.title, rawItem.excerpt) ||
          isTooNicheOrPlumbing(rawItem.title, rawItem.excerpt) ||
          isLowSignalOrGeneric(rawItem.title, rawItem.excerpt) ||
          isCelebrityOrSensational(rawItem.title, rawItem.excerpt)
        ) {
          metrics.editorialRejected++;
          continue;
        }

        // URL Health Verification
        const urlValidation = await verifyUrlHealth(rawItem.link, 5000);
        if (urlValidation.status === 'invalid' || urlValidation.status === 'unavailable') {
          metrics.deterministicRejected++;
          continue;
        }

        const canonicalUrl = urlValidation.resolvedUrl || rawItem.link;

        // Content Classification
        const classification = classifyContent(rawItem.title, rawItem.excerpt, source, rawItem);
        const destinationAccuracy = rawItem.destinationAccuracy || classifyDestinationAccuracy(canonicalUrl, classification.contentType, source.siteUrl);

        // Nora Editorial Policy Evaluation
        const editorialEval = evaluateEditorialDecision({
          title: rawItem.title,
          sourceName: source.name,
          sourceExcerpt: rawItem.excerpt,
          canonicalUrl,
          sourceUrl: rawItem.link,
          publishedAt: rawItem.pubDate,
          contentType: classification.contentType,
          category: classification.category,
          geography: classification.geography,
          destinationAccuracy
        }, {
          publishedBySourceCount: editorialContext?.publishedBySourceCount,
          existingClusterTitles: editorialContext?.existingClusterTitles,
          maxDaysStale: 14
        });

        if (editorialEval.decision === 'reject') {
          if (editorialEval.reason === 'duplicate_event') {
            metrics.clustersRemoved++;
            // Attribute coverage to the parent story
            const primaryItem = existingItems.find(i => 
              (editorialEval.eventClusterId && i.eventClusterId === editorialEval.eventClusterId) || 
              calculateSimilarity(i.title, rawItem.title) >= 0.60
            );
            if (primaryItem) {
              if (!primaryItem.alsoCoveredBy) primaryItem.alsoCoveredBy = [];
              if (!primaryItem.alsoCoveredBy.includes(source.name) && primaryItem.sourceName !== source.name) {
                primaryItem.alsoCoveredBy.push(source.name);
              }
            }
          } else {
            metrics.editorialRejected++;
          }
        } else {
          metrics.published++;
          if (editorialContext?.publishedBySourceCount) {
            const current = editorialContext.publishedBySourceCount.get(source.name) || 0;
            editorialContext.publishedBySourceCount.set(source.name, current + 1);
          }
          if (editorialContext?.existingClusterTitles && editorialEval.eventClusterId) {
            editorialContext.existingClusterTitles.push({
              title: rawItem.title,
              clusterId: editorialEval.eventClusterId,
              sourceName: source.name
            });
          }
        }

        const noraSummary = generateCleanSummary(rawItem.title, rawItem.excerpt, classification.category);
        const whyWorthKnowing = generateWhyWorthKnowing(
          rawItem.title, 
          classification.category, 
          classification.geography, 
          classification.contentType
        );

        const duration = rawItem.duration || (classification.contentType === 'video' ? '12 min' : '4 min read');

        const newsItem: NewsItem = {
          id: `news_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          workspaceId,
          title: rawItem.title,
          sourceName: source.name,
          sourceUrl: rawItem.link,
          canonicalUrl,
          originalUrl: rawItem.link,
          resolvedUrl: urlValidation.resolvedUrl || rawItem.link,
          urlStatus: urlValidation.status,
          urlHttpStatus: urlValidation.httpStatus,
          urlLastVerifiedAt: urlValidation.verifiedAt,
          redirectCount: urlValidation.redirectCount,
          destinationAccuracy,
          editorialDecision: editorialEval.decision,
          editorialRejectionReason: editorialEval.reason,
          eventClusterId: editorialEval.eventClusterId,
          author: rawItem.author,
          publishedAt: rawItem.pubDate,
          discoveredAt: new Date().toISOString(),
          contentType: classification.contentType,
          category: classification.category,
          geography: classification.geography,
          imageUrl: rawItem.imageUrl,
          videoUrl: rawItem.videoUrl,
          podcastUrl: rawItem.podcastUrl,
          duration,
          sourceExcerpt: rawItem.excerpt,
          noraSummary,
          whyWorthKnowing,
          tags: [source.name, classification.category.toUpperCase()],
          sourcePriority: source.priority,
          featured: false,
          secondaryRecommendation: null,
          saved: false,
          hidden: false,
          contentHash: rawItem.contentHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        newlyProcessed.push(newsItem);
      }

      return { newItems: newlyProcessed, metrics };
    } catch (parseErr: any) {
      source.lastError = `Parse error: ${parseErr.message}`;
      source.lastSyncedAt = new Date().toISOString();
      return { newItems: [], metrics, error: source.lastError };
    }
  }

  /**
   * Synchronize all sources with concurrency control and deduplication
   */
  public async syncAll(
    existingItems: NewsItem[], 
    workspaceId: string = 'ws_wilmington'
  ): Promise<{ addedCount: number; items: NewsItem[]; metrics: NewsIngestionMetrics }> {
    if (this.isSyncing) {
      return { addedCount: 0, items: existingItems, metrics: this.lastMetrics };
    }

    this.isSyncing = true;
    console.log('[News Ingestion] Starting full background news sync...');

    const itemsMap = new Map<string, NewsItem>();
    const existingClusters: EventClusterReference[] = [];
    const sourceCountMap = new Map<string, number>();

    for (const item of existingItems) {
      itemsMap.set(item.id, item);
      if (item.editorialDecision === 'publish') {
        const cnt = sourceCountMap.get(item.sourceName) || 0;
        sourceCountMap.set(item.sourceName, cnt + 1);
        if (item.eventClusterId) {
          existingClusters.push({
            title: item.title,
            clusterId: item.eventClusterId,
            sourceName: item.sourceName
          });
        }
      }
    }

    const totalMetrics: NewsIngestionMetrics = {
      discovered: 0,
      deterministicRejected: 0,
      editorialRejected: 0,
      clustersRemoved: 0,
      published: 0,
      worthYourTimeCount: 0
    };

    let addedCount = 0;

    // Process sources with max 3 concurrent fetches
    const activeSources = this.sources.filter(s => s.isEnabled);
    const chunkSize = 3;
    for (let i = 0; i < activeSources.length; i += chunkSize) {
      const chunk = activeSources.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map(source => this.syncSource(
          source, 
          Array.from(itemsMap.values()), 
          workspaceId,
          {
            publishedBySourceCount: sourceCountMap,
            existingClusterTitles: existingClusters
          }
        ))
      );

      for (const res of results) {
        totalMetrics.discovered += res.metrics.discovered;
        totalMetrics.deterministicRejected += res.metrics.deterministicRejected;
        totalMetrics.editorialRejected += res.metrics.editorialRejected;
        totalMetrics.clustersRemoved += res.metrics.clustersRemoved;
        totalMetrics.published += res.metrics.published;

        for (const item of res.newItems) {
          itemsMap.set(item.id, item);
          addedCount++;
        }
      }
    }

    // Ensure we designate top Worth Your Time featured and secondary recommendations
    const allItems = Array.from(itemsMap.values());
    this.refreshEditorialHighlights(allItems);

    totalMetrics.worthYourTimeCount = allItems.filter(i => i.featured || i.secondaryRecommendation).length;
    this.lastMetrics = { ...totalMetrics };

    this.isSyncing = false;
    console.log(`[News Ingestion] Sync complete. ${addedCount} new items processed. Metrics:`, totalMetrics);
    return { addedCount, items: allItems, metrics: totalMetrics };
  }

  /**
   * Refreshes featured and secondary recommendation flags strictly from verified valid URLs with exact destinations and published decision
   */
  public refreshEditorialHighlights(items: NewsItem[]): void {
    if (items.length === 0) return;

    // Reset all previous highlights
    for (const item of items) {
      item.featured = false;
      item.secondaryRecommendation = null;
    }

    // Only assign highlights to verified healthy URLs that are PUBLISHED and have EXACT destinations
    const eligibleItems = items.filter(item => {
      if (item.hidden) return false;
      if (item.urlStatus === 'unavailable' || item.urlStatus === 'invalid') return false;
      if (item.destinationAccuracy && item.destinationAccuracy !== 'exact') return false;
      if (item.editorialDecision && item.editorialDecision !== 'publish') return false;
      return true;
    });

    if (eligibleItems.length === 0) return;

    // Sort by priority and recency
    eligibleItems.sort((a, b) => {
      if (a.sourcePriority !== b.sourcePriority) {
        return a.sourcePriority - b.sourcePriority;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    let watchAssigned = false;
    let localAssigned = false;

    // Pick top single featured story (prioritize high-signal brokerage executive relevance)
    const featuredCandidate = eligibleItems.find(i => 
      (i.category === 'brokerage' || i.sourcePriority === 1) && 
      !isLowSignalOrGeneric(i.title, i.sourceExcerpt || '')
    ) || eligibleItems[0];

    if (featuredCandidate) {
      featuredCandidate.featured = true;
    }

    for (const item of eligibleItems) {
      if (item.featured) continue;

      if (!watchAssigned && (item.contentType === 'video' || item.contentType === 'podcast')) {
        item.secondaryRecommendation = 'worth_watching';
        watchAssigned = true;
        continue;
      }

      if (!localAssigned && (item.geography === 'local_wilmington' || item.geography === 'north_carolina' || item.category === 'local')) {
        item.secondaryRecommendation = 'close_to_home';
        localAssigned = true;
        continue;
      }
    }
  }

  /**
   * Initialize background ingestion loop (every 45 minutes)
   */
  public startBackgroundScheduler(
    getItemsFn: () => NewsItem[],
    saveItemsFn: (items: NewsItem[]) => Promise<void>
  ): void {
    if (this.syncTimer) return;

    // Initial sync
    setTimeout(async () => {
      try {
        const { items } = await this.syncAll(getItemsFn());
        await saveItemsFn(items);
      } catch (e: any) {
        console.error('[News Scheduler] Initial sync failed:', e.message);
      }
    }, 3000);

    // Periodic 45-minute sync
    this.syncTimer = setInterval(async () => {
      try {
        const { items } = await this.syncAll(getItemsFn());
        await saveItemsFn(items);
      } catch (e: any) {
        console.error('[News Scheduler] Periodic sync failed:', e.message);
      }
    }, 45 * 60 * 1000);

    console.log('[News Scheduler] Background news sync schedule active (45m interval).');
  }

  public stopBackgroundScheduler(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const newsIngestionService = new NewsIngestionService();
