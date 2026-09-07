/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NewsItem, NewsSource, NewsFilter, NewsUserAction, WorthYourTimeResponse } from '../services/news/newsTypes';
import { SEED_CURATED_NEWS } from '../services/news/noraEditorialCurator';
import { newsIngestionService } from '../services/news/newsIngestionService';
import { getDbPool } from './repositories';

export class NewsRepository {
  private inMemoryItems: Map<string, NewsItem> = new Map();
  private inMemoryUserActions: NewsUserAction[] = [];

  constructor() {
    // Initialize with seeded curated items
    for (const item of SEED_CURATED_NEWS) {
      this.inMemoryItems.set(item.id, { ...item });
    }
  }

  public async getItems(filter: NewsFilter = {}, userId?: string): Promise<{ items: NewsItem[]; total: number }> {
    const pool = getDbPool();
    let allItems: NewsItem[] = [];

    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM news_items 
           WHERE (editorial_decision IS NULL OR editorial_decision = 'publish') 
           ORDER BY published_at DESC`
        );
        if (res.rows.length > 0) {
          allItems = res.rows.map(r => ({
            id: r.id,
            workspaceId: r.workspace_id,
            title: r.title,
            sourceName: r.source_name,
            sourceUrl: r.source_url,
            canonicalUrl: r.canonical_url,
            author: r.author,
            publishedAt: r.published_at,
            discoveredAt: r.discovered_at,
            contentType: r.content_type,
            category: r.category,
            geography: r.geography,
            imageUrl: r.image_url,
            videoUrl: r.video_url,
            podcastUrl: r.podcast_url,
            duration: r.duration,
            sourceExcerpt: r.source_excerpt,
            noraSummary: r.nora_summary,
            whyWorthKnowing: r.why_worth_knowing,
            tags: r.tags || [],
            sourcePriority: r.source_priority,
            featured: r.featured,
            secondaryRecommendation: r.secondary_recommendation,
            saved: r.saved,
            hidden: r.hidden,
            contentHash: r.content_hash,
            duplicateGroupId: r.duplicate_group_id,
            alsoCoveredBy: r.also_covered_by || [],
            originalUrl: r.original_url || r.source_url,
            resolvedUrl: r.resolved_url || r.canonical_url || r.source_url,
            urlStatus: r.url_status || 'valid',
            urlHttpStatus: r.url_http_status,
            urlLastVerifiedAt: r.url_last_verified_at,
            redirectCount: r.redirect_count || 0,
            destinationAccuracy: r.destination_accuracy || 'exact',
            editorialDecision: r.editorial_decision || 'publish',
            editorialRejectionReason: r.editorial_rejection_reason || undefined,
            eventClusterId: r.event_cluster_id || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }));
        } else {
          // Fallback to in-memory items if table is empty
          allItems = Array.from(this.inMemoryItems.values());
        }
      } catch (err: any) {
        console.warn('[News Repository] Fallback to in-memory store due to DB error:', err.message);
        allItems = Array.from(this.inMemoryItems.values());
      }
    } else {
      allItems = Array.from(this.inMemoryItems.values());
    }

    // Apply user saved/hidden overlay if userId is provided
    if (userId) {
      const userActions = this.inMemoryUserActions.filter(a => a.userId === userId);
      const savedIds = new Set(userActions.filter(a => a.actionType === 'save').map(a => a.itemId));
      const unsavedIds = new Set(userActions.filter(a => a.actionType === 'unsave').map(a => a.itemId));
      const hiddenIds = new Set(userActions.filter(a => a.actionType === 'hide').map(a => a.itemId));

      allItems = allItems.map(item => {
        let isSaved = item.saved;
        if (savedIds.has(item.id)) isSaved = true;
        if (unsavedIds.has(item.id)) isSaved = false;

        let isHidden = item.hidden;
        if (hiddenIds.has(item.id)) isHidden = true;

        return { ...item, saved: isSaved, hidden: isHidden };
      });
    }

    // Filter out hidden items and rejected candidates
    let filtered = allItems.filter(item => !item.hidden && (item.editorialDecision ? item.editorialDecision === 'publish' : true));

    // Apply category filter
    if (filter.category && filter.category !== 'all') {
      if (filter.category === 'saved') {
        filtered = filtered.filter(item => item.saved);
      } else if (filter.category === 'watch_listen') {
        filtered = filtered.filter(item => item.contentType === 'video' || item.contentType === 'podcast');
      } else if (filter.category === 'local') {
        filtered = filtered.filter(item => item.category === 'local' || item.geography === 'local_wilmington' || item.geography === 'north_carolina');
      } else {
        filtered = filtered.filter(item => item.category === filter.category);
      }
    }

    if (filter.savedOnly) {
      filtered = filtered.filter(item => item.saved);
    }

    if (filter.contentType) {
      filtered = filtered.filter(item => item.contentType === filter.contentType);
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      filtered = filtered.filter(
        item => item.title.toLowerCase().includes(q) || 
                item.noraSummary.toLowerCase().includes(q) ||
                item.sourceName.toLowerCase().includes(q) ||
                (item.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort: Featured first, then secondary, then recency
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const total = filtered.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;
    const items = filtered.slice(offset, offset + limit);

    return { items, total };
  }

  public async getWorthYourTime(userId?: string): Promise<WorthYourTimeResponse> {
    const { items } = await this.getItems({}, userId);
    
    // Exactly 0 or 1 primary featured item with high-signal executive relevance and exact destination
    const featured = items.find(i => i.featured && (!i.destinationAccuracy || i.destinationAccuracy === 'exact')) || 
                     items.find(i => (i.category === 'brokerage' || i.sourcePriority === 1) && (!i.destinationAccuracy || i.destinationAccuracy === 'exact')) || 
                     null;

    // Up to 2 secondary recommended items (watch & listen or local development) with exact destinations
    const secondary = items
      .filter(i => i.id !== featured?.id && (!i.destinationAccuracy || i.destinationAccuracy === 'exact') && (i.secondaryRecommendation || i.contentType === 'video' || i.contentType === 'podcast' || i.geography === 'local_wilmington'))
      .slice(0, 2);

    return {
      featured,
      secondary
    };
  }

  public async getItemById(id: string): Promise<NewsItem | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM news_items WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            workspaceId: r.workspace_id,
            title: r.title,
            sourceName: r.source_name,
            sourceUrl: r.source_url,
            canonicalUrl: r.canonical_url,
            author: r.author,
            publishedAt: r.published_at,
            discoveredAt: r.discovered_at,
            contentType: r.content_type,
            category: r.category,
            geography: r.geography,
            imageUrl: r.image_url,
            videoUrl: r.video_url,
            podcastUrl: r.podcast_url,
            duration: r.duration,
            sourceExcerpt: r.source_excerpt,
            noraSummary: r.nora_summary,
            whyWorthKnowing: r.why_worth_knowing,
            tags: r.tags || [],
            sourcePriority: r.source_priority,
            featured: r.featured,
            secondaryRecommendation: r.secondary_recommendation,
            saved: r.saved,
            hidden: r.hidden,
            contentHash: r.content_hash,
            duplicateGroupId: r.duplicate_group_id,
            alsoCoveredBy: r.also_covered_by || [],
            originalUrl: r.original_url || r.source_url,
            resolvedUrl: r.resolved_url || r.canonical_url || r.source_url,
            urlStatus: r.url_status || 'valid',
            urlHttpStatus: r.url_http_status,
            urlLastVerifiedAt: r.url_last_verified_at,
            redirectCount: r.redirect_count || 0,
            destinationAccuracy: r.destination_accuracy || 'exact',
            editorialDecision: r.editorial_decision || 'publish',
            editorialRejectionReason: r.editorial_rejection_reason || undefined,
            eventClusterId: r.event_cluster_id || undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          };
        }
      } catch (err: any) {
        console.warn('[News Repository] Fallback to in-memory get item:', err.message);
      }
    }
    return this.inMemoryItems.get(id) || null;
  }

  public async upsertItem(item: NewsItem): Promise<NewsItem> {
    this.inMemoryItems.set(item.id, { ...item });

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO news_items (
            id, workspace_id, title, source_name, source_url, canonical_url, author,
            published_at, discovered_at, content_type, category, geography,
            image_url, video_url, podcast_url, duration, source_excerpt,
            nora_summary, why_worth_knowing, tags, source_priority,
            featured, secondary_recommendation, saved, hidden,
            content_hash, duplicate_group_id, also_covered_by, created_at, updated_at,
            original_url, resolved_url, url_status, url_http_status, url_last_verified_at, redirect_count,
            destination_accuracy, editorial_decision, editorial_rejection_reason, event_cluster_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            nora_summary = EXCLUDED.nora_summary,
            why_worth_knowing = EXCLUDED.why_worth_knowing,
            featured = EXCLUDED.featured,
            secondary_recommendation = EXCLUDED.secondary_recommendation,
            saved = EXCLUDED.saved,
            hidden = EXCLUDED.hidden,
            also_covered_by = EXCLUDED.also_covered_by,
            resolved_url = EXCLUDED.resolved_url,
            url_status = EXCLUDED.url_status,
            url_http_status = EXCLUDED.url_http_status,
            url_last_verified_at = EXCLUDED.url_last_verified_at,
            redirect_count = EXCLUDED.redirect_count,
            destination_accuracy = EXCLUDED.destination_accuracy,
            editorial_decision = EXCLUDED.editorial_decision,
            editorial_rejection_reason = EXCLUDED.editorial_rejection_reason,
            event_cluster_id = EXCLUDED.event_cluster_id,
            updated_at = NOW()`,
          [
            item.id,
            item.workspaceId,
            item.title,
            item.sourceName,
            item.sourceUrl,
            item.canonicalUrl,
            item.author || null,
            item.publishedAt,
            item.discoveredAt,
            item.contentType,
            item.category,
            item.geography,
            item.imageUrl || null,
            item.videoUrl || null,
            item.podcastUrl || null,
            item.duration || null,
            item.sourceExcerpt || null,
            item.noraSummary,
            item.whyWorthKnowing,
            item.tags,
            item.sourcePriority,
            item.featured,
            item.secondaryRecommendation || null,
            item.saved || false,
            item.hidden || false,
            item.contentHash,
            item.duplicateGroupId || null,
            item.alsoCoveredBy || [],
            item.createdAt,
            item.updatedAt,
            item.originalUrl || item.sourceUrl,
            item.resolvedUrl || item.canonicalUrl || item.sourceUrl,
            item.urlStatus || 'valid',
            item.urlHttpStatus || null,
            item.urlLastVerifiedAt || new Date().toISOString(),
            item.redirectCount || 0,
            item.destinationAccuracy || 'exact',
            item.editorialDecision || 'publish',
            item.editorialRejectionReason || null,
            item.eventClusterId || null
          ]
        );
      } catch (err: any) {
        console.warn('[News Repository] DB upsert failed, stored in memory:', err.message);
      }
    }

    return item;
  }

  public async recordUserAction(userId: string, itemId: string, actionType: 'save' | 'unsave' | 'hide' | 'open' | 'ask_nora'): Promise<void> {
    const action: NewsUserAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      itemId,
      actionType,
      createdAt: new Date().toISOString()
    };
    this.inMemoryUserActions.push(action);

    // Update in-memory item state
    const item = this.inMemoryItems.get(itemId);
    if (item) {
      if (actionType === 'save') item.saved = true;
      if (actionType === 'unsave') item.saved = false;
      if (actionType === 'hide') item.hidden = true;
    }

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO news_user_actions (id, user_id, item_id, action_type, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [action.id, userId, itemId, actionType]
        );
      } catch (e: any) {
        // Fallback silently if table does not exist
      }
    }
  }

  public async getSources(): Promise<NewsSource[]> {
    return newsIngestionService.getSources();
  }

  public async updateSource(id: string, updates: Partial<NewsSource>): Promise<NewsSource | null> {
    return newsIngestionService.updateSource(id, updates);
  }

  public async triggerSync(workspaceId: string = 'ws_wilmington'): Promise<{ addedCount: number }> {
    const { items: currentItems } = await this.getItems({ limit: 500 });
    const { addedCount, items } = await newsIngestionService.syncAll(currentItems, workspaceId);

    for (const item of items) {
      await this.upsertItem(item);
    }

    return { addedCount };
  }
}

export const newsRepository = new NewsRepository();
