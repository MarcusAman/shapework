/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Headphones, 
  Check, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';

interface NewsAudioBriefPlayerProps {
  featuredStory?: NewsItem | null;
  secondaryStories?: NewsItem[];
  onOpenStory?: (item: NewsItem) => void;
}

export const NewsAudioBriefPlayer: React.FC<NewsAudioBriefPlayerProps> = ({
  featuredStory,
  secondaryStories = [],
  onOpenStory
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 percentage
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(110); // Initial fallback duration (1:50)
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  // Generate dynamic transcript text based on current featured story & secondary items
  const transcriptSections = useMemo(() => [
    {
      id: 'sec-opening',
      title: 'Opening Bell',
      text: 'Good morning, Nest Realty team. Here is your 2-minute executive intelligence briefing for today.'
    },
    {
      id: 'sec-top-story',
      title: 'Top Story: ' + (featuredStory?.title || 'National Commission & Settlement Updates'),
      text: featuredStory?.noraSummary 
        ? `${featuredStory.sourceName} reports that ${featuredStory.noraSummary} ${featuredStory.whyWorthKnowing || ''}`
        : 'Brokerages nationwide are adapting to cooperative compensation guidelines and strengthening buyer representation protocols.'
    },
    {
      id: 'sec-economics',
      title: 'Market Economics',
      text: 'Conforming 30-year fixed mortgage rates eased slightly to 6.42%, providing renewed momentum for pre-approved buyers entering the fall market. In Cape Fear, median single-family prices remain firm at $428,500 with average days on market holding at 38 days.'
    },
    {
      id: 'sec-action',
      title: 'Action Item for Today',
      text: 'Reach out to active buyer clients who paused during the mid-summer rate spike and verify all buyer agency agreements are signed prior to physical or virtual property tours.'
    }
  ], [featuredStory]);

  const fullTranscriptText = useMemo(() => 
    transcriptSections.map(s => `${s.title}\n${s.text}`).join('\n\n'),
    [transcriptSections]
  );

  // Calculate active section index based on progress percentage and section character weights
  const activeSectionIndex = useMemo(() => {
    const totalChars = transcriptSections.reduce((acc, s) => acc + s.text.length, 0);
    if (!totalChars) return 0;
    const currentProgressFraction = progress / 100;
    let accumulatedChars = 0;
    for (let i = 0; i < transcriptSections.length; i++) {
      accumulatedChars += transcriptSections[i].text.length;
      if (currentProgressFraction <= accumulatedChars / totalChars) {
        return i;
      }
    }
    return transcriptSections.length - 1;
  }, [progress, transcriptSections]);

  // Reset audio when featured story changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setAudioError(null);
  }, [featuredStory?.id]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
    };
  }, []);

  // Primary Play / Pause Toggle with ElevenLabs High-Fidelity Audio
  const togglePlay = async () => {
    setAudioError(null);

    // If currently playing, pause immediately
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // If audio is already loaded and ready in memory
    if (audioRef.current && audioBlobUrlRef.current) {
      try {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.muted = isMuted;
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (playErr: any) {
        console.warn('[Audio Resume Error]:', playErr);
      }
    }

    // Audio needs to be generated / fetched from ElevenLabs TTS endpoint
    setIsLoadingAudio(true);
    try {
      const fullTextToSpeak = transcriptSections.map(s => s.text).join(' ');
      const res = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullTextToSpeak,
          voiceId: 'l006hw6wZaEYAv80cbzj' // Official Nora Custom Real Estate Voice
        })
      });

      if (!res.ok) {
        throw new Error(`ElevenLabs voice stream unavailable (HTTP ${res.status})`);
      }

      const audioBlob = await res.blob();
      const blobUrl = URL.createObjectURL(audioBlob);
      audioBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audio.playbackRate = playbackSpeed;
      audio.muted = isMuted;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const currentPct = (audio.currentTime / audio.duration) * 100;
          setProgress(Math.min(100, Math.max(0, currentPct)));
          setCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setAudioError('ElevenLabs audio stream encountered an error.');
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error('[ElevenLabs Audio Briefing Error]:', err);
      // Strictly NO fallback to robotic browser voice per user directive
      setAudioError(err.message || 'ElevenLabs voice stream failed. Click retry.');
      setIsPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Interactive seek / scrub handler
  const handleSeek = (percentage: number) => {
    const clampedPct = Math.max(0, Math.min(100, percentage));
    setProgress(clampedPct);
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (clampedPct / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else {
      setCurrentTime((clampedPct / 100) * audioDuration);
    }
  };

  // Restart from beginning
  const restartAudio = () => {
    handleSeek(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      }
    }
  };

  // Speed adjustment (1x -> 1.25x -> 1.5x -> 1x)
  const changeSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(fullTranscriptText);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const displaySeconds = Math.round(currentTime || (progress / 100) * audioDuration);
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const totalMin = Math.floor(audioDuration / 60);
  const totalSec = Math.round(audioDuration % 60);
  const formattedTotal = `${totalMin}:${totalSec < 10 ? '0' : ''}${totalSec}`;

  return (
    <div className="bg-gradient-to-br from-[#01362D] via-[#00473E] to-[#012A23] text-white rounded-2xl p-5 shadow-sm border border-[#00635C]/30 relative overflow-hidden text-left">
      {/* Background ambient aesthetic */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#D0D6BB]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D0D6BB] opacity-75 ${isPlaying ? 'block' : 'hidden'}`} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D0D6BB]" />
          </span>
          <span className="text-[10.5px] font-mono uppercase tracking-widest text-[#D0D6BB] font-bold">
            Daily Audio Dispatch
          </span>
          <span className="text-[9.5px] font-mono bg-[#D0D6BB]/20 text-[#D0D6BB] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
            ElevenLabs Nora
          </span>
        </div>

        <span className="text-[11px] font-mono text-[#D0D6BB]/80 bg-white/10 px-2 py-0.5 rounded-md">
          {formattedTime} / {formattedTotal}
        </span>
      </div>

      {/* Title & Description */}
      <div className="mb-4 relative z-10">
        <h4 className="font-serif font-bold text-base text-white leading-snug tracking-tight">
          NORA 2-Minute Morning Brief
        </h4>
        <p className="text-[11.5px] text-stone-200/90 font-sans mt-0.5 line-clamp-2 leading-relaxed">
          {featuredStory ? `Focus: ${featuredStory.title}` : 'Today’s top real estate shifts, rate trends, and actionable takeaways.'}
        </p>
      </div>

      {/* Error Alert Badge (Strict No-Robot Voice Policy) */}
      {audioError && (
        <div className="flex items-center justify-between bg-rose-500/20 border border-rose-400/30 rounded-xl px-3 py-2 mb-3 text-xs text-rose-200 relative z-10 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            <span className="text-[11px] leading-tight">{audioError}</span>
          </div>
          <button
            type="button"
            onClick={togglePlay}
            className="text-[11px] font-bold text-white bg-rose-600/60 hover:bg-rose-600 px-2.5 py-1 rounded-md transition-colors shrink-0 ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Interactive Waveform Visualizer & Scrub Area */}
      <div 
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const pct = (clickX / rect.width) * 100;
          handleSeek(pct);
        }}
        className="h-9 flex items-center justify-center gap-1 mb-2 px-2 py-1 bg-black/25 hover:bg-black/35 rounded-xl relative z-10 cursor-pointer group transition-all"
        title="Click anywhere to seek"
      >
        {[40, 65, 85, 45, 95, 70, 55, 80, 100, 60, 45, 75, 90, 50, 65, 85, 40, 95, 70, 55, 80].map((h, i) => {
          const barPct = (i / 20) * 100;
          const isPassed = progress >= barPct;
          const barHeight = isPlaying 
            ? `${Math.max(18, (h * ((i + (Math.round(progress) % 5)) % 4 + 1)) / 4)}%` 
            : `${Math.max(22, h * 0.35)}%`;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPassed 
                  ? 'bg-gradient-to-t from-[#D0D6BB] to-white shadow-xs' 
                  : 'bg-white/20 group-hover:bg-white/30'
              }`}
              style={{ height: barHeight }}
            />
          );
        })}
      </div>

      {/* Interactive Progress Timeline Slider */}
      <div className="relative z-10 mb-4 px-0.5">
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = (clickX / rect.width) * 100;
            handleSeek(pct);
          }}
          className="w-full h-1.5 bg-black/30 hover:h-2 rounded-full cursor-pointer transition-all overflow-hidden"
          title="Scrub timeline"
        >
          <div 
            className="h-full bg-gradient-to-r from-[#D0D6BB] to-white rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Audio Controls Bar */}
      <div className="flex items-center justify-between gap-3 relative z-10 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Play / Pause / Loading Primary Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className="w-10 h-10 rounded-xl bg-[#D0D6BB] hover:bg-white text-[#01362D] flex items-center justify-center font-bold shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-75 disabled:cursor-wait"
            title={isLoadingAudio ? 'Loading ElevenLabs voice...' : isPlaying ? 'Pause briefing' : 'Play 2-minute briefing with ElevenLabs Nora'}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#01362D]" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={restartAudio}
            className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Restart from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={changeSpeed}
            className="px-2 py-1 text-[11px] font-mono font-bold text-stone-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-all cursor-pointer"
            title="Playback speed"
          >
            {playbackSpeed}x
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-300" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Transcript Drawer Toggle */}
        <button
          type="button"
          onClick={() => setShowTranscript(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            showTranscript 
              ? 'bg-[#D0D6BB]/20 text-[#D0D6BB]' 
              : 'text-stone-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle text transcript"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Transcript</span>
          {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Transcript Drawer with Real-Time Active Section Highlighting */}
      {showTranscript && (
        <div className="mt-4 pt-4 border-t border-white/15 text-stone-200 text-left space-y-3 relative z-10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D0D6BB]">
                Synchronized Audio Transcript
              </span>
              <span className="text-[9px] font-mono text-stone-400">
                (Section follows Nora speech)
              </span>
            </div>
            <button
              type="button"
              onClick={copyTranscript}
              className="inline-flex items-center gap-1 text-[11px] text-stone-300 hover:text-white font-medium cursor-pointer"
            >
              {copiedTranscript ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs leading-relaxed scrollbar-thin">
            {transcriptSections.map((sec, idx) => {
              const isActive = isPlaying && activeSectionIndex === idx;
              return (
                <div 
                  key={sec.id} 
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#00635C]/60 border-[#D0D6BB]/60 shadow-md ring-1 ring-[#D0D6BB]/40' 
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`block font-serif font-bold text-[11.5px] ${isActive ? 'text-[#D0D6BB]' : 'text-white'}`}>
                      {sec.title}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#D0D6BB] bg-[#D0D6BB]/20 px-1.5 py-0.5 rounded animate-pulse">
                        <Volume2 className="w-3 h-3" /> Speaking
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-normal ${isActive ? 'text-white font-medium' : 'text-stone-300'}`}>
                    {sec.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
