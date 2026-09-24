/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  SlidersHorizontal, 
  Search, 
  Sparkles, 
  Bookmark, 
  EyeOff, 
  Radio,
  ExternalLink,
  Bot,
  TrendingUp,
  MapPin,
  Briefcase,
  Tv,
  Headphones,
  Compass,
  ArrowRight,
  Filter
} from 'lucide-react';
import { NewsItem, NewsSource, NewsCategory } from '../../../server/services/news/newsTypes';
import { NewsCard } from './NewsCard';
import { NewsAskNoraModal } from './NewsAskNoraModal';
import { NewsSourceDrawer } from './NewsSourceDrawer';
import { NewsMarketPulseSidebar } from './NewsMarketPulseSidebar';
import { NewsAgentActionModal } from './NewsAgentActionModal';
import { CURRENT_MARKET_INDICATORS } from './newsThemeAssets';

interface NewsPageProps {
  state: any;
}

export const NewsPage: React.FC<NewsPageProps> = ({ state }) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [featuredItem, setFeaturedItem] = useState<NewsItem | null>(null);
  const [secondaryItems, setSecondaryItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedAskNoraItem, setSelectedAskNoraItem] = useState<NewsItem | null>(null);
  const [selectedAgentActionItem, setSelectedAgentActionItem] = useState<NewsItem | null>(null);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
    return {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': state?.workspaceId || 'ws_wilmington'
    };
  }, [state?.workspaceId]);

  const fetchNewsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const [itemsRes, wytRes, sourcesRes] = await Promise.all([
        fetch(`/api/news?${params.toString()}`, { headers }),
        fetch('/api/news/worth-your-time', { headers }),
        fetch('/api/news/sources', { headers })
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items || []);
      }

      if (wytRes.ok) {
        const wytData = await wytRes.json();
        setFeaturedItem(wytData.featured || null);
        setSecondaryItems(wytData.secondary || []);
      }

      if (sourcesRes.ok) {
        const srcData = await sourcesRes.json();
        setSources(srcData.sources || []);
      }
    } catch (err) {
      console.warn('[News Page] Failed to fetch news data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, getAuthHeaders]);

  useEffect(() => {
    fetchNewsData();
  }, [fetchNewsData]);

  // Handle Save / Unsave
  const handleToggleSave = async (item: NewsItem) => {
    const nextSaved = !item.saved;
    const actionType = nextSaved ? 'save' : 'unsave';

    // Optimistic UI update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, saved: nextSaved } : i));
    if (featuredItem?.id === item.id) {
      setFeaturedItem(prev => prev ? { ...prev, saved: nextSaved } : null);
    }
    setSecondaryItems(prev => prev.map(i => i.id === item.id ? { ...i, saved: nextSaved } : i));

    try {
      await fetch(`/api/news/${item.id}/action`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionType })
      });
    } catch (e) {
      console.warn('[News Action] Save failed:', e);
    }
  };

  // Handle Hide
  const handleHide = async (item: NewsItem) => {
    // Optimistic UI update
    setItems(prev => prev.filter(i => i.id !== item.id));
    if (featuredItem?.id === item.id) {
      setFeaturedItem(null);
    }
    setSecondaryItems(prev => prev.filter(i => i.id !== item.id));

    try {
      await fetch(`/api/news/${item.id}/action`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actionType: 'hide' })
      });
    } catch (e) {
      console.warn('[News Action] Hide failed:', e);
    }
  };

  // Handle Manual Feed Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('news-sync-started'));
    }
    try {
      const res = await fetch('/api/news/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchNewsData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('news-sync-completed'));
        }
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('news-sync-failed'));
        }
      }
    } catch (e) {
      console.warn('[News Sync] Failed:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('news-sync-failed'));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen for TopBar action events (Sync Feeds, Open Sources)
  useEffect(() => {
    const onTriggerSync = () => {
      handleTriggerSync();
    };
    const onOpenSources = () => {
      setIsSourceDrawerOpen(true);
    };

    window.addEventListener('trigger-news-sync', onTriggerSync);
    window.addEventListener('open-news-sources-drawer', onOpenSources);

    return () => {
      window.removeEventListener('trigger-news-sync', onTriggerSync);
      window.removeEventListener('open-news-sources-drawer', onOpenSources);
    };
  }, []);

  // Toggle Source Enabled
  const handleToggleSource = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/news/sources/${sourceId}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSources(prev => prev.map(s => s.id === sourceId ? data.source : s));
      }
    } catch (e) {
      console.warn('[News Sources] Toggle failed:', e);
    }
  };

  // Transition from Ask NORA Modal to main Ask Nora workspace
  const handleTransitionToMainChat = (prompt: string, contextItem: NewsItem) => {
    if (state?.setCurrentTab) {
      state.setCurrentTab('Workboard');
      setTimeout(() => {
        if (state?.handleSendChatMessage) {
          state.handleSendChatMessage(prompt);
        }
      }, 300);
    }
  };

  // Extract podcasts and complete feed without dropping any stories
  const { podcastStories, feedStories } = useMemo(() => {
    const featuredId = featuredItem?.id;
    const pool = items.filter(i => i.id !== featuredId);

    const podcasts = pool.filter(i => i.contentType === 'podcast' || Boolean(i.podcastUrl));
    const others = pool.filter(i => i.contentType !== 'podcast' && !i.podcastUrl);

    return {
      podcastStories: podcasts,
      feedStories: others
    };
  }, [items, featuredItem]);

  const isBrowsingAll = activeCategory === 'all' && !searchQuery.trim();

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-stone-900 pb-24 font-sans text-left select-text">
      {/* =================================================================== */}
      {/* 1. TOP REAL ESTATE TICKER & PULSE BAR                               */}
      {/* =================================================================== */}
      <div className="bg-[#01362D] text-white border-b border-[#004d47] py-2 px-4 sm:px-6 lg:px-8 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-[#D0D6BB] font-bold">
              Market Pulse
            </span>
          </div>

          <div className="flex items-center gap-6 shrink-0 text-[11px]">
            {CURRENT_MARKET_INDICATORS.map((ind) => (
              <div key={ind.id} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-stone-300 font-medium">{ind.label}:</span>
                <span className="text-white font-bold">{ind.value}</span>
                <span className={`text-[10px] font-bold ${
                  ind.trend === 'down' && ind.label.includes('Mortgage') ? 'text-emerald-400' :
                  ind.trend === 'down' ? 'text-blue-300' : 'text-stone-300'
                }`}>
                  {ind.trend === 'down' ? '▼' : ind.trend === 'up' ? '▲' : '–'} {ind.change}
                </span>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0 text-stone-300 text-[10.5px]">
            <span>Wilmington MLS Benchmark</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. SUB-TOOLBAR: CATEGORY FILTER PILLS & SEARCH                      */}
      {/* =================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-stone-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto select-none pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Intelligence' },
              { id: 'local', label: 'Local & NC' },
              { id: 'brokerage', label: 'Brokerage Strategy' },
              { id: 'housing', label: 'Housing Economics' },
              { id: 'technology', label: 'PropTech & AI' },
              { id: 'watch_listen', label: 'Watch & Listen' },
              { id: 'saved', label: 'Saved' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as any);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer shrink-0 ${
                  activeCategory === cat.id && !searchQuery
                    ? 'bg-[#01362D] text-[#D0D6BB] shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, topics, firms..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#00635C] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. MAIN EDITORIAL CONTENT                                           */}
      {/* =================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-14">
        {/* VIEW A: EXECUTIVE EDITORIAL MAGAZINE (Browsing 'All' without search) */}
        {isBrowsingAll && (
          <>
            {/* TOP BLOCK: LEAD STORY (2 COLS) + MARKET PULSE SIDEBAR (1 COL) */}
            <section aria-label="Lead Story and Market Pulse" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left 2 Cols: Featured Story & Secondary Highlights */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00635C]" />
                  <h2 className="font-serif font-black text-xl text-[#01362D] tracking-tight">
                    Lead Editorial Story
                  </h2>
                </div>

                {featuredItem ? (
                  <NewsCard
                    item={featuredItem}
                    featured={true}
                    onAskNora={(item) => setSelectedAskNoraItem(item)}
                    onToggleSave={handleToggleSave}
                    onHide={handleHide}
                    onOpenAgentActions={(item) => setSelectedAgentActionItem(item)}
                  />
                ) : (
                  <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
                    No lead story currently flagged.
                  </div>
                )}

                {/* Secondary Recommendations Stack */}
                {secondaryItems.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif font-bold text-lg text-[#01362D] tracking-tight">
                        Notable Briefs
                      </h3>
                      <span className="text-xs font-mono text-stone-400">High Relevance</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {secondaryItems.map((sec) => (
                        <NewsCard
                          key={sec.id}
                          item={sec}
                          featured={false}
                          onAskNora={(item) => setSelectedAskNoraItem(item)}
                          onToggleSave={handleToggleSave}
                          onHide={handleHide}
                          onOpenAgentActions={(item) => setSelectedAgentActionItem(item)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right 1 Col: Market Pulse & Audio Dispatch Sidebar */}
              <div className="lg:col-span-1">
                <NewsMarketPulseSidebar
                  featuredStory={featuredItem}
                  secondaryStories={secondaryItems}
                  allStories={items}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  onSearchTopic={(tag) => setSearchQuery(tag)}
                  onOpenStory={(item) => {
                    const targetUrl = item.resolvedUrl || item.canonicalUrl || item.sourceUrl;
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }}
                />
              </div>
            </section>

            {/* SHELF 1: FEATURED PODCASTS & AUDIO DISPATCH */}
            {podcastStories.length > 0 && (
              <section aria-labelledby="podcasts-dispatch-heading" className="space-y-4 pt-4 border-t border-stone-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 
                        id="podcasts-dispatch-heading"
                        className="font-serif font-black text-2xl text-[#01362D] tracking-tight"
                      >
                        Featured Podcasts & Audio Dispatch
                      </h2>
                      <p className="text-xs text-stone-500 font-sans">
                        Stream executive briefings and daily mortgage rate analysis directly with in-card audio controls.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-stone-500">
                    {podcastStories.length} {podcastStories.length === 1 ? 'episode' : 'episodes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {podcastStories.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      featured={false}
                      onAskNora={(it) => setSelectedAskNoraItem(it)}
                      onToggleSave={handleToggleSave}
                      onHide={handleHide}
                      onOpenAgentActions={(it) => setSelectedAgentActionItem(it)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 2: COMPREHENSIVE INTELLIGENCE MASTER FEED */}
            {feedStories.length > 0 && (
              <section aria-labelledby="all-intelligence-heading" className="space-y-4 pt-4 border-t border-stone-200/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00635C]/10 text-[#00635C] flex items-center justify-center">
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 
                        id="all-intelligence-heading"
                        className="font-serif font-black text-2xl text-[#01362D] tracking-tight"
                      >
                        Latest Real Estate Intelligence
                      </h2>
                      <p className="text-xs text-stone-500 font-sans">
                        Curated national brokerage shifts, Cape Fear local developments, and tech analysis.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-stone-500">
                    {feedStories.length} {feedStories.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {feedStories.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      featured={false}
                      onAskNora={(it) => setSelectedAskNoraItem(it)}
                      onToggleSave={handleToggleSave}
                      onHide={handleHide}
                      onOpenAgentActions={(it) => setSelectedAgentActionItem(it)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* VIEW B: FILTERED / SEARCH VIEW */}
        {!isBrowsingAll && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#00635C]" />
                <h2 className="font-serif font-black text-2xl text-[#01362D] tracking-tight">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 
                   activeCategory === 'saved' ? 'Saved Stories' :
                   activeCategory === 'local' ? 'Local & NC Dispatch' :
                   activeCategory === 'brokerage' ? 'Brokerage Strategy' :
                   activeCategory === 'housing' ? 'Housing Economics' :
                   activeCategory === 'technology' ? 'PropTech & AI' :
                   'Filtered Feed'}
                </h2>
              </div>

              <span className="text-xs font-mono text-stone-500">
                {items.length} {items.length === 1 ? 'story' : 'stories'}
              </span>
            </div>

            {/* Empty State */}
            {items.length === 0 && !isLoading && (
              <div className="py-20 text-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-base text-stone-800">
                  No matching stories found.
                </h3>
                <p className="text-xs text-stone-500 font-sans leading-relaxed">
                  {searchQuery 
                    ? `No stories matched "${searchQuery}". Try a different topic or clear your search.`
                    : activeCategory === 'saved'
                    ? 'You have not bookmarked any stories yet. Click the bookmark icon on any card to save it here.'
                    : 'No stories available in this category at this time.'}
                </p>
                {(searchQuery || activeCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-[#01362D] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer mt-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {!isLoading && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    featured={false}
                    onAskNora={(it) => setSelectedAskNoraItem(it)}
                    onToggleSave={handleToggleSave}
                    onHide={handleHide}
                    onOpenAgentActions={(it) => setSelectedAgentActionItem(it)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse pt-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden h-80 space-y-3">
                <div className="h-44 bg-stone-200 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-12 bg-stone-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 4. MODALS & DRAWERS                                                 */}
      {/* =================================================================== */}
      {/* Agent Action Toolkit Modal (Client Talking Points & Meeting Prep) */}
      <NewsAgentActionModal
        item={selectedAgentActionItem}
        isOpen={Boolean(selectedAgentActionItem)}
        onClose={() => setSelectedAgentActionItem(null)}
        onAskNora={(it) => setSelectedAskNoraItem(it)}
      />

      {/* Ask NORA Context Modal */}
      <NewsAskNoraModal
        item={selectedAskNoraItem}
        isOpen={Boolean(selectedAskNoraItem)}
        onClose={() => setSelectedAskNoraItem(null)}
        onTransitionToMainChat={handleTransitionToMainChat}
      />

      {/* Source Registry Drawer */}
      <NewsSourceDrawer
        isOpen={isSourceDrawerOpen}
        onClose={() => setIsSourceDrawerOpen(false)}
        sources={sources}
        onToggleSource={handleToggleSource}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />
    </div>
  );
};

export default NewsPage;
