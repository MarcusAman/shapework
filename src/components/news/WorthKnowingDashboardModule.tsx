/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';

interface WorthKnowingDashboardModuleProps {
  workspaceId?: string;
  onNavigateNews: () => void;
  onAskNora?: (item: NewsItem) => void;
}

export const WorthKnowingDashboardModule: React.FC<WorthKnowingDashboardModuleProps> = ({
  workspaceId = 'ws_wilmington',
  onNavigateNews,
  onAskNora
}) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTopNews = async () => {
      try {
        const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
        const targetWs = (workspaceId === 'all_locations' || !workspaceId) ? 'ws_wilmington' : workspaceId;
        const res = await fetch(`/api/news/worth-your-time?workspaceId=${encodeURIComponent(targetWs)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-workspace-id': targetWs
          }
        });
        if (res.ok) {
          const data = await res.json();
          const combined: NewsItem[] = [];
          if (data.featured) combined.push(data.featured);
          if (data.secondary && Array.isArray(data.secondary)) {
            combined.push(...data.secondary);
          }
          if (isMounted) {
            setItems(combined.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('[Worth Knowing] Failed to fetch top news:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTopNews();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-left animate-pulse">
        <div className="h-4 w-32 bg-stone-200 rounded mb-2" />
        <div className="h-3 w-48 bg-stone-100 rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#00635C]" />
            <h4 className="font-serif font-bold text-sm text-[#01362D]">Worth Knowing</h4>
          </div>
          <button
            type="button"
            onClick={onNavigateNews}
            className="text-xs font-semibold text-[#00635C] hover:underline cursor-pointer"
          >
            See all news →
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-2 font-sans italic">
          Nothing major is worth flagging right now.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-5 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-stone-200/90 shadow-xs text-left animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3.5 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#01362D] text-[#D0D6BB] flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#01362D]">Worth Knowing</h4>
            <p className="text-[11px] text-stone-500 font-sans">
              {items.length === 1 ? '1 story selected for you' : `${items.length} stories selected for you`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateNews}
          className="text-xs font-bold text-[#00635C] hover:text-[#01362D] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>See all news</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Story List (1-3 items) */}
      <div className="divide-y divide-stone-100">
        {items.map((item, idx) => (
          <div 
            key={item.id || idx}
            onClick={onNavigateNews}
            className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group cursor-pointer hover:bg-stone-50/50 rounded-xl px-2 transition-colors -mx-2"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-stone-500 font-mono">
                  {item.sourceName}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {item.duration || '4 min read'}
                </span>
              </div>
              <h5 className="font-serif font-bold text-xs sm:text-sm text-stone-900 group-hover:text-[#00635C] transition-colors leading-snug line-clamp-1">
                {item.title}
              </h5>
              <p className="text-[11px] text-stone-600 line-clamp-1 font-sans">
                {item.whyWorthKnowing || item.noraSummary}
              </p>
            </div>

            <div className="shrink-0 self-center">
              <span className="text-[11px] font-bold text-[#00635C] group-hover:underline flex items-center gap-1">
                Read →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorthKnowingDashboardModule;
