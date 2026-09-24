/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Clock, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { NewsItem, NewsCategory } from '../../../server/services/news/newsTypes';
import { 
  CURRENT_MARKET_INDICATORS, 
  TRENDING_TOPICS, 
  MarketIndicator, 
  TrendingTopic 
} from './newsThemeAssets';
import { NewsAudioBriefPlayer } from './NewsAudioBriefPlayer';

interface NewsMarketPulseSidebarProps {
  featuredStory?: NewsItem | null;
  secondaryStories?: NewsItem[];
  allStories?: NewsItem[];
  activeCategory: NewsCategory;
  onSelectCategory: (cat: NewsCategory) => void;
  onSearchTopic: (query: string) => void;
  onOpenStory?: (item: NewsItem) => void;
}

export const NewsMarketPulseSidebar: React.FC<NewsMarketPulseSidebarProps> = ({
  featuredStory,
  secondaryStories = [],
  allStories = [],
  activeCategory,
  onSelectCategory,
  onSearchTopic,
  onOpenStory
}) => {
  // Extract 3 quick soundbites for the 60-Second Scan
  const quickScanItems = allStories.slice(0, 3);

  return (
    <aside aria-label="Market Pulse and Intelligence Sidebar" className="space-y-6 text-left">
      {/* 1. Daily Audio Briefing Player */}
      <NewsAudioBriefPlayer
        featuredStory={featuredStory}
        secondaryStories={secondaryStories}
        onOpenStory={onOpenStory}
      />

      {/* 2. Today's Market Pulse & Economic Rates */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#00635C]/10 text-[#00635C] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#01362D] tracking-tight">
                Daily Market Pulse
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">Rates & Indicators</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            Live
          </span>
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {CURRENT_MARKET_INDICATORS.map((ind) => (
            <div 
              key={ind.id}
              className="p-3 bg-stone-50/80 hover:bg-stone-100/80 border border-stone-200/60 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium mb-1">
                <span className="truncate pr-1">{ind.label}</span>
                <span className={`inline-flex items-center text-[10px] font-bold ${
                  ind.trend === 'down' && ind.label.includes('Mortgage') ? 'text-emerald-600' :
                  ind.trend === 'down' ? 'text-blue-600' : 'text-stone-700'
                }`}>
                  {ind.trend === 'down' ? '▼' : ind.trend === 'up' ? '▲' : '–'} {ind.change}
                </span>
              </div>
              <div className="font-mono font-bold text-base text-stone-900 tracking-tight">
                {ind.value}
              </div>
              <span className="text-[9.5px] text-stone-400 font-mono block mt-0.5 truncate">
                {ind.context}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Today's 60-Second Scan */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-stone-100">
          <Clock className="w-3.5 h-3.5 text-[#00635C]" />
          <h3 className="font-serif font-bold text-sm text-[#01362D] tracking-tight">
            Today's 60-Second Scan
          </h3>
        </div>

        <ul className="space-y-3">
          {quickScanItems.map((item, idx) => (
            <li 
              key={item.id || idx}
              onClick={() => onOpenStory && onOpenStory(item)}
              className="group cursor-pointer text-left"
            >
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00635C] group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-sans font-medium text-xs text-stone-800 group-hover:text-[#00635C] leading-snug transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400 font-mono">
                    <span>{item.sourceName}</span>
                    <span>•</span>
                    <span>{item.duration || '3 min'}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Trending Industry Topics */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-3">
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          <h3 className="font-serif font-bold text-sm text-[#01362D] tracking-tight">
            Trending Topics
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic.tag}
              type="button"
              onClick={() => onSearchTopic(topic.tag)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-[#00635C]/10 text-stone-700 hover:text-[#00635C] rounded-full text-xs font-medium transition-all cursor-pointer border border-stone-200/60 hover:border-[#00635C]/30"
            >
              <span>#{topic.tag}</span>
              <span className="text-[10px] text-stone-400 font-mono font-bold">
                {topic.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. BIC Compliance Advisory Widget */}
      <div className="bg-[#FAF7F0] border border-amber-200/70 rounded-2xl p-4 text-left">
        <div className="flex items-center gap-2 mb-1.5 text-amber-900">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-serif font-bold text-xs">
            BIC Compliance Nudge
          </span>
        </div>
        <p className="text-[11px] text-stone-700 leading-relaxed font-sans">
          Working With Real Estate Agents (WWREA) disclosures must be reviewed and executed at first substantial contact. Prioritize written buyer agreements before touring any properties.
        </p>
      </div>
    </aside>
  );
};
