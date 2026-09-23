/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Bookmark, 
  EyeOff, 
  ExternalLink, 
  Play, 
  Pause,
  Headphones, 
  FileText, 
  Building, 
  Sparkles, 
  Clock,
  Layers,
  MessageSquare,
  Share2,
  Volume2
} from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';
import { resolveStoryImage } from './newsThemeAssets';

interface NewsCardProps {
  item: NewsItem;
  featured?: boolean;
  onAskNora: (item: NewsItem) => void;
  onToggleSave: (item: NewsItem) => void;
  onHide: (item: NewsItem) => void;
  onOpenItem?: (item: NewsItem) => void;
  onOpenAgentActions?: (item: NewsItem) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  featured = false,
  onAskNora,
  onToggleSave,
  onHide,
  onOpenItem,
  onOpenAgentActions
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const storyImage = resolveStoryImage(item);

  const togglePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) el.pause();
      });
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('[Audio Playback] Error playing audio:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const togglePlaybackSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const parsedDurationEstimate = () => {
    if (!item.duration) return 1200; // default 20m
    const match = item.duration.match(/(\d+)\s*min/);
    if (match) return parseInt(match[1], 10) * 60;
    return 1200;
  };

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

  // =========================================================================
  // 1. FEATURED / HERO LEAD STORY LAYOUT
  // =========================================================================
  if (featured) {
    return (
      <article className="group relative bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left">
        <div>
          {/* Hero Photography Banner */}
          <div 
            onClick={handleSourceClick}
            className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden bg-stone-900 cursor-pointer"
          >
            <img 
              src={storyImage} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Overlaid Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#01362D]/90 backdrop-blur-md text-[#D0D6BB] rounded-full text-xs font-semibold tracking-wide border border-[#00635C]/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lead Intelligence</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-white/90 backdrop-blur-md text-stone-900 rounded-full text-xs font-bold shadow-xs">
                  {item.sourceName}
                </span>
              </div>

              {/* Bookmark & Hide Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(item);
                  }}
                  className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                    item.saved 
                      ? 'text-[#D0D6BB] bg-[#01362D]/90' 
                      : 'text-white/80 hover:text-white bg-black/40 hover:bg-black/60'
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
                  className="p-2 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer"
                  title="Hide this story"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Photo Metadata */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-stone-200 font-mono">
              <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                {item.duration || '5 min read'}
              </span>
              <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Story Content Details */}
          <div className="p-6 sm:p-8">
            <h3 
              onClick={handleSourceClick}
              className="font-serif font-black text-2xl sm:text-3xl text-stone-900 hover:text-[#00635C] cursor-pointer transition-colors leading-tight mb-3.5 tracking-tight"
            >
              {item.title}
            </h3>

            {/* NORA Summary */}
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-5 font-sans">
              {item.noraSummary}
            </p>

            {/* Why It's Worth Knowing Callout */}
            {item.whyWorthKnowing && (
              <div className="p-4 sm:p-5 bg-[#FAF7F0] border border-amber-200/60 rounded-2xl mb-6 text-left">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Why It's Worth Knowing</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                  {item.whyWorthKnowing}
                </p>
              </div>
            )}

            {/* Inline Audio Player for Podcasts */}
            {item.contentType === 'podcast' && item.podcastUrl && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="my-5 p-4 bg-stone-900 text-white rounded-2xl border border-stone-800 shadow-md flex flex-col gap-3"
              >
                <audio
                  ref={audioRef}
                  src={item.podcastUrl}
                  preload="none"
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setAudioDuration(audioRef.current.duration);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      aria-label={isPlaying ? 'Pause episode' : 'Play episode'}
                      className="w-10 h-10 rounded-full bg-[#00635C] hover:bg-[#007a71] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-100">
                          {isPlaying ? 'Streaming Episode Audio' : 'Stream Full Episode'}
                        </span>
                        {isPlaying && (
                          <span className="flex items-center gap-0.5">
                            <span className="w-1 h-2.5 bg-emerald-400 animate-pulse rounded-full" />
                            <span className="w-1 h-3.5 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                            <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-stone-400 font-mono">
                        Direct Broadcast • {formatTime(currentTime)} / {formatTime(audioDuration || parsedDurationEstimate())}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={togglePlaybackSpeed}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                    title="Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || parsedDurationEstimate()}
                    value={currentTime}
                    onChange={handleSeek}
                    aria-label="Seek episode audio"
                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
                  />
                  <span className="text-[10px] font-mono text-stone-400 shrink-0">
                    {formatTime(audioDuration || parsedDurationEstimate())}
                  </span>
                </div>
              </div>
            )}

            {/* Also Covered By */}
            {item.alsoCoveredBy && item.alsoCoveredBy.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-6 font-medium">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                <span>Also covered by: <strong>{item.alsoCoveredBy.join(', ')}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 pb-6 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-2.5 flex-wrap">
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

            {/* Agent Actions: Talking Points & Meeting Prep */}
            {onOpenAgentActions && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAgentActions(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Client talking points and meeting prep"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Client Talking Points</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAskNora(item);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00635C]/10 hover:bg-[#00635C]/20 text-[#00635C] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#00635C] text-white flex items-center justify-center text-[8px] font-bold">
                N
              </div>
              <span>Ask NORA</span>
            </button>
          </div>

          <span className="text-xs text-stone-400 font-mono">
            {item.category.toUpperCase()} • {item.geography.toUpperCase()}
          </span>
        </div>
      </article>
    );
  }

  // =========================================================================
  // 2. STANDARD EDITORIAL GRID CARD LAYOUT
  // =========================================================================
  return (
    <article className="group relative bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left">
      <div>
        {/* Story Thumbnail Image */}
        <div 
          onClick={handleSourceClick}
          className="relative aspect-16/10 w-full bg-stone-100 overflow-hidden cursor-pointer"
        >
          <img 
            src={storyImage} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Badge over photo */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-semibold border border-white/20">
              {getBadgeIcon()}
              <span>{getBadgeLabel()}</span>
            </span>

            {/* Bookmark & Hide */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(item);
                }}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                  item.saved 
                    ? 'text-[#D0D6BB] bg-[#01362D]/90' 
                    : 'text-white/80 hover:text-white bg-black/40 hover:bg-black/60'
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
                className="p-1.5 rounded-full text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer"
                title="Hide"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {item.contentType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5 text-[#01362D]" />
              </div>
            </div>
          )}

          {item.contentType === 'podcast' && item.podcastUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#01362D]/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-[#D0D6BB]/40">
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Headphones className="w-4 h-4" />}
              </div>
            </div>
          )}

          {/* Bottom metadata tag */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-stone-200 font-mono">
            <span className="font-semibold text-white drop-shadow-xs truncate max-w-[140px]">
              {item.sourceName}
            </span>
            <span className="bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs">
              {item.duration || '4 min read'}
            </span>
          </div>
        </div>

        {/* Card Text Content */}
        <div className="p-4 sm:p-5">
          {/* Title */}
          <h4 
            onClick={handleSourceClick}
            className="font-serif font-bold text-base sm:text-lg text-stone-900 hover:text-[#00635C] cursor-pointer transition-colors leading-snug mb-2 tracking-tight line-clamp-2"
          >
            {item.title}
          </h4>

          {/* NORA Summary */}
          <p className="text-xs text-stone-600 leading-relaxed mb-3 line-clamp-3 font-sans">
            {item.noraSummary}
          </p>

          {/* Why It's Worth Knowing */}
          {item.whyWorthKnowing && (
            <div className="p-2.5 bg-[#FAF7F0] border border-amber-200/50 rounded-xl mb-3 text-left">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-amber-900 mb-0.5">
                Why It Matters
              </span>
              <p className="text-[11px] text-stone-700 leading-relaxed line-clamp-2 font-medium">
                {item.whyWorthKnowing}
              </p>
            </div>
          )}

          {/* Inline Audio Player for Standard Card */}
          {item.contentType === 'podcast' && item.podcastUrl && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="my-3 p-3 bg-stone-900 text-white rounded-xl border border-stone-800 shadow-xs flex flex-col gap-2"
            >
              <audio
                ref={audioRef}
                src={item.podcastUrl}
                preload="none"
                onTimeUpdate={() => {
                  if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) setAudioDuration(audioRef.current.duration);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              />

              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    aria-label={isPlaying ? 'Pause episode' : 'Play episode'}
                    className="w-8 h-8 rounded-full bg-[#00635C] hover:bg-[#007a71] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex flex-col text-left overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-100 truncate">
                        {isPlaying ? 'Now Playing' : 'Listen to Episode'}
                      </span>
                      {isPlaying && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <span className="w-1 h-2 bg-emerald-400 animate-pulse rounded-full" />
                          <span className="w-1 h-3 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                          <span className="w-1 h-1.5 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] text-stone-400 font-mono">
                      {formatTime(currentTime)} / {formatTime(audioDuration || parsedDurationEstimate())}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={togglePlaybackSpeed}
                  className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[9.5px] font-mono font-semibold transition-colors cursor-pointer shrink-0"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range"
                  min="0"
                  max={audioDuration || parsedDurationEstimate()}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Seek episode audio"
                  className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
                />
              </div>
            </div>
          )}

          {/* Deduplication indicator */}
          {item.alsoCoveredBy && item.alsoCoveredBy.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-stone-500 mb-2 font-medium">
              <Layers className="w-3 h-3 text-stone-400" />
              <span>Also covered by: <strong>{item.alsoCoveredBy.join(', ')}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4 sm:px-5 py-3 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/60">
        <div className="flex items-center gap-1.5">
          {item.contentType === 'podcast' && item.podcastUrl ? (
            <button
              type="button"
              onClick={togglePlayAudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#01362D] hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Listen'}</span>
            </button>
          ) : isSourceAvailable ? (
            <button
              type="button"
              onClick={handleSourceClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{getActionLabel()}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          ) : (
            <span className="inline-flex items-center px-2 py-1 bg-stone-100 text-stone-400 rounded-lg text-xs font-medium italic">
              Source unavailable
            </span>
          )}

          {/* Client Talking Points Trigger */}
          {onOpenAgentActions && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAgentActions(item);
              }}
              className="p-1.5 text-stone-600 hover:text-[#00635C] bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Client Talking Points & Meeting Prep"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAskNora(item);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#00635C]/10 hover:bg-[#00635C]/20 text-[#00635C] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold">NORA</span>
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
