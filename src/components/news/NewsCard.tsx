/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bookmark, 
  EyeOff, 
  ExternalLink, 
  Play, 
  Headphones, 
  FileText, 
  Building, 
  Sparkles, 
  Clock,
  Layers
} from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';

interface NewsCardProps {
  item: NewsItem;
  featured?: boolean;
  onAskNora: (item: NewsItem) => void;
  onToggleSave: (item: NewsItem) => void;
  onHide: (item: NewsItem) => void;
  onOpenItem?: (item: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  featured = false,
  onAskNora,
  onToggleSave,
  onHide,
  onOpenItem
}) => {
  const getBadgeIcon = () => {
    switch (item.contentType) {
      case 'video':
        return <Play className="w-3 h-3 fill-current" />;
      case 'podcast':
        return <Headphones className="w-3 h-3" />;
      case 'local_development':
        return <Building className="w-3 h-3" />;
      case 'report':
        return <FileText className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getBadgeLabel = () => {
    if (item.secondaryRecommendation === 'worth_watching') return 'Worth Watching';
    if (item.secondaryRecommendation === 'close_to_home') return 'Close to Home';
    if (item.contentType === 'video') return 'Video';
    if (item.contentType === 'podcast') return 'Podcast';
    if (item.contentType === 'local_development') return 'Local Development';
    if (item.contentType === 'report') return 'Research & Data';
    if (item.geography === 'local_wilmington') return 'Wilmington / Cape Fear';
    if (item.category === 'brokerage') return 'Brokerage Strategy';
    if (item.category === 'technology') return 'Technology & AI';
    if (item.category === 'housing') return 'Housing Economics';
    return 'Article';
  };

  const getActionLabel = () => {
    if (item.contentType === 'video') return 'Watch';
    if (item.contentType === 'podcast') return 'Listen';
    return 'Read';
  };

  const isExactDestination = !item.destinationAccuracy || item.destinationAccuracy === 'exact';
  const isSourceAvailable = item.urlStatus !== 'unavailable' && item.urlStatus !== 'invalid' && isExactDestination;

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSourceAvailable) return;
    if (onOpenItem) onOpenItem(item);
    const targetUrl = item.resolvedUrl || item.canonicalUrl || item.sourceUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (featured) {
    return (
      <article className="group relative bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left">
        <div>
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#01362D] text-[#D0D6BB] rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-3 h-3" />
                <span>Featured</span>
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {item.sourceName}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {item.duration || '5 min read'}
              </span>
            </div>

            {/* Save / Hide Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(item);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  item.saved 
                    ? 'text-[#00635C] bg-[#00635C]/10' 
                    : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                }`}
                title={item.saved ? 'Saved' : 'Save for later'}
              >
                <Bookmark className={`w-4 h-4 ${item.saved ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHide(item);
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Hide this story"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 
            onClick={handleSourceClick}
            className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 hover:text-[#00635C] cursor-pointer transition-colors leading-tight mb-4 tracking-tight"
          >
            {item.title}
          </h3>

          {/* NORA Summary */}
          <p className="text-sm text-stone-600 leading-relaxed mb-5 font-sans">
            {item.noraSummary}
          </p>

          {/* Why It's Worth Knowing Callout */}
          {item.whyWorthKnowing && (
            <div className="p-4 bg-[#F7F8F5] border border-stone-200/80 rounded-2xl mb-6">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-[#01362D]">
                <span>Why it's worth knowing</span>
              </div>
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                {item.whyWorthKnowing}
              </p>
            </div>
          )}

          {/* Deduplication Attribution */}
          {item.alsoCoveredBy && item.alsoCoveredBy.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mb-6 font-medium">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Also covered by: <strong>{item.alsoCoveredBy.join(', ')}</strong></span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isSourceAvailable ? (
              <button
                type="button"
                onClick={handleSourceClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#01362D] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>{getActionLabel()}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 bg-stone-100 text-stone-400 rounded-xl text-xs font-medium italic">
                Source unavailable
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAskNora(item);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#01362D] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#00635C]/20 flex items-center justify-center text-[9px] font-bold text-[#00635C]">
                N
              </div>
              <span>Ask NORA</span>
            </button>
          </div>

          <span className="text-[11px] text-stone-400 font-mono">
            {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left">
      <div>
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full text-[10.5px] font-semibold">
              {getBadgeIcon()}
              <span>{getBadgeLabel()}</span>
            </span>
            <span className="text-xs font-semibold text-stone-600 truncate max-w-[120px]">
              {item.sourceName}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs text-stone-500 font-medium">
              {item.duration || (item.contentType === 'video' ? '12 min' : '4 min read')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(item);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                item.saved 
                  ? 'text-[#00635C] bg-[#00635C]/10' 
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              title={item.saved ? 'Saved' : 'Save'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${item.saved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHide(item);
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Hide"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thumbnail if present (especially for video) */}
        {item.imageUrl && (
          <div 
            onClick={handleSourceClick}
            className="mb-3.5 rounded-xl overflow-hidden aspect-video bg-stone-100 border border-stone-200/60 relative group-hover:opacity-95 transition-opacity cursor-pointer"
          >
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Gracefully hide image if broken
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {item.contentType === 'video' && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h4 
          onClick={handleSourceClick}
          className="font-serif font-bold text-lg text-stone-900 hover:text-[#00635C] cursor-pointer transition-colors leading-snug mb-2.5 tracking-tight"
        >
          {item.title}
        </h4>

        {/* NORA Summary */}
        <p className="text-xs text-stone-600 leading-relaxed mb-3.5 line-clamp-3 font-sans">
          {item.noraSummary}
        </p>

        {/* Why It's Worth Knowing / Watching / Listening */}
        {item.whyWorthKnowing && (
          <div className="p-3 bg-[#F7F8F5] border border-stone-200/70 rounded-xl mb-4 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#01362D] mb-0.5">
              {item.contentType === 'video' ? "Why it's worth watching" : item.contentType === 'podcast' ? "Why it's worth listening" : "Why it's worth knowing"}
            </span>
            <p className="text-[11px] text-stone-700 leading-relaxed font-medium">
              {item.whyWorthKnowing}
            </p>
          </div>
        )}

        {/* Deduplication indicator */}
        {item.alsoCoveredBy && item.alsoCoveredBy.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mb-4 font-medium">
            <Layers className="w-3 h-3 text-stone-400" />
            <span>Also covered by: <strong>{item.alsoCoveredBy.join(', ')}</strong></span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          {isSourceAvailable ? (
            <button
              type="button"
              onClick={handleSourceClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{getActionLabel()}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 bg-stone-100 text-stone-400 rounded-lg text-xs font-medium italic">
              Source unavailable
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAskNora(item);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#01362D] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 rounded-full bg-[#00635C]/20 flex items-center justify-center text-[8px] font-bold text-[#00635C]">
              N
            </div>
            <span>Ask NORA</span>
          </button>
        </div>

        <span className="text-[10px] text-stone-400 font-mono">
          {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </article>
  );
};

export default NewsCard;
