/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Bot
} from 'lucide-react';
import { NewsItem, NewsSource, NewsCategory } from '../../../server/services/news/newsTypes';
import { NewsCard } from './NewsCard';
import { NewsAskNoraModal } from './NewsAskNoraModal';
import { NewsSourceDrawer } from './NewsSourceDrawer';

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
    try {
      const res = await fetch('/api/news/sync', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchNewsData();
      }
    } catch (e) {
      console.warn('[News Sync] Failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

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

  // Filter latest feed items (exclude featured item so it does not repeat twice on screen)
  const feedItems = items.filter(i => i.id !== featuredItem?.id);

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-stone-900 pb-24 font-sans text-left select-text">
      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-stone-200/70">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00635C]">
                Editorial Intelligence
              </span>
            </div>
            <h1 className="font-serif font-black text-3xl sm:text-4xl text-[#01362D] tracking-tight">
              News
            </h1>
            <p className="text-sm text-stone-600 font-sans mt-1">
              The real estate stories, conversations and ideas worth your time.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Sync latest real estate feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00635C] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSourceDrawerOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Configure News Sources"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Sources</span>
            </button>
          </div>
        </div>

        {/* Search & Simple Filters Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto select-none pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'local', label: 'Local & NC' },
              { id: 'brokerage', label: 'Brokerage' },
              { id: 'housing', label: 'Housing' },
              { id: 'technology', label: 'Technology' },
              { id: 'watch_listen', label: 'Watch & Listen' },
              { id: 'saved', label: 'Saved' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-[#01362D] text-[#D0D6BB] shadow-xs'
                    : 'bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* ================================================================= */}
        {/* 1. WORTH YOUR TIME SECTION (Most Important)                       */}
        {/* ================================================================= */}
        {activeCategory === 'all' && !searchQuery.trim() && (featuredItem || secondaryItems.length > 0) && (
          <section aria-labelledby="worth-your-time-heading" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00635C]" />
              <h2 
                id="worth-your-time-heading"
                className="font-serif font-black text-xl text-[#01362D] tracking-tight"
              >
                Worth Your Time
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Primary Featured Card (Spans 2 columns on large screens) */}
              {featuredItem && (
                <div className="lg:col-span-2 flex">
                  <NewsCard
                    item={featuredItem}
                    featured={true}
                    onAskNora={(item) => setSelectedAskNoraItem(item)}
                    onToggleSave={handleToggleSave}
                    onHide={handleHide}
                  />
                </div>
              )}

              {/* Secondary Recommended Cards (Stacked in 1 column) */}
              {secondaryItems.length > 0 && (
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {secondaryItems.map((sec) => (
                    <NewsCard
                      key={sec.id}
                      item={sec}
                      featured={false}
                      onAskNora={(item) => setSelectedAskNoraItem(item)}
                      onToggleSave={handleToggleSave}
                      onHide={handleHide}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* 2. LATEST FOR YOU SECTION (Chronological / Filtered Feed)         */}
        {/* ================================================================= */}
        <section aria-labelledby="latest-for-you-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-stone-400" />
              <h2 
                id="latest-for-you-heading"
                className="font-serif font-black text-xl text-[#01362D] tracking-tight"
              >
                {activeCategory === 'saved' ? 'Saved Stories' : 'Latest For You'}
              </h2>
            </div>

            <span className="text-xs font-mono text-stone-500">
              {feedItems.length} {feedItems.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {/* Empty State */}
          {feedItems.length === 0 && !isLoading && (
            <div className="py-16 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-800">
                Nothing major is worth flagging right now.
              </h3>
              <p className="text-xs text-stone-500 font-sans leading-relaxed">
                {activeCategory === 'saved' 
                  ? 'You have not bookmarked any stories yet. Click the bookmark icon on any card to save it here.'
                  : 'NORA filters out clickbait and low-value promotion so you only see what matters.'}
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-stone-200/80 rounded-2xl p-6 h-72 space-y-3">
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="h-6 bg-stone-200 rounded w-3/4" />
                  <div className="h-16 bg-stone-100 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Editorial Grid */}
          {!isLoading && feedItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedItems.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  featured={false}
                  onAskNora={(it) => setSelectedAskNoraItem(it)}
                  onToggleSave={handleToggleSave}
                  onHide={handleHide}
                />
              ))}
            </div>
          )}
        </section>
      </main>

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
