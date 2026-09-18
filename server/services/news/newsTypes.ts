/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContentType = 
  | 'article'
  | 'video'
  | 'podcast'
  | 'report'
  | 'local_development';

export type NewsCategory = 
  | 'all'
  | 'local'
  | 'brokerage'
  | 'housing'
  | 'technology'
  | 'watch_listen'
  | 'saved';

export type FeedType = 'rss' | 'atom' | 'podcast' | 'youtube';

export interface NewsSource {
  id: string;
  name: string;
  category: 'brokerage' | 'housing' | 'local' | 'technology' | 'official';
  feedUrl: string;
  siteUrl: string;
  feedType: FeedType;
  isEnabled: boolean;
  priority: number; // 1 (highest) to 10
  description?: string;
  lastSyncedAt?: string;
  lastError?: string;
  itemCount?: number;
}

export type UrlHealthStatus = 'valid' | 'redirected' | 'unverified' | 'unavailable' | 'invalid' | 'blocked';

export type DestinationAccuracy = 'exact' | 'collection' | 'homepage' | 'unknown';

export type EditorialDecision = 'publish' | 'reject' | 'evergreen_candidate';

export type EditorialRejectionReason = 
  | 'irrelevant'
  | 'low_signal'
  | 'duplicate_event'
  | 'resource_not_news'
  | 'promotional'
  | 'celebrity_lifestyle'
  | 'too_niche'
  | 'stale'
  | 'source_saturation'
  | 'insufficient_context';

export interface NewsItem {
  id: string;
  workspaceId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  canonicalUrl: string;
  originalUrl?: string;
  resolvedUrl?: string;
  urlStatus?: UrlHealthStatus;
  destinationAccuracy?: DestinationAccuracy;
  editorialDecision?: EditorialDecision;
  editorialRejectionReason?: EditorialRejectionReason;
  eventClusterId?: string;
  urlHttpStatus?: number;
  urlLastVerifiedAt?: string;
  redirectCount?: number;
  author?: string;
  publishedAt: string;
  discoveredAt: string;
  contentType: ContentType;
  category: 'brokerage' | 'housing' | 'local' | 'technology';
  geography: 'local_wilmington' | 'north_carolina' | 'national';
  imageUrl?: string;
  videoUrl?: string;
  podcastUrl?: string;
  duration?: string; // e.g. "6 min read", "18 min", "45 min"
  sourceExcerpt?: string;
  noraSummary: string;
  whyWorthKnowing: string;
  tags: string[];
  sourcePriority: number;
  featured: boolean; // 1 primary featured item
  secondaryRecommendation?: 'worth_watching' | 'close_to_home' | 'executive_focus' | null;
  saved?: boolean;
  hidden?: boolean;
  contentHash: string;
  duplicateGroupId?: string;
  alsoCoveredBy?: string[];
  rawSourceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsUserAction {
  id: string;
  userId: string;
  itemId: string;
  actionType: 'save' | 'unsave' | 'hide' | 'open' | 'ask_nora';
  createdAt: string;
}

export interface NewsFilter {
  category?: NewsCategory;
  contentType?: ContentType;
  geography?: string;
  search?: string;
  savedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface WorthYourTimeResponse {
  featured: NewsItem | null;
  secondary: NewsItem[];
}
