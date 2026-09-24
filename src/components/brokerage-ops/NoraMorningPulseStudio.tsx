import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Volume2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Send,
  CheckCircle2,
  Share2,
  Users,
  Quote,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface MorningPulseData {
  id: string;
  date: string;
  formattedDate: string;
  inspirationalSpark: {
    quote: string;
    author: string;
    actionChallenge: string;
  };
  marketPulse: {
    medianSoldPrice: string;
    newListings24h: number;
    pendingContracts24h: number;
    closedVolume24h: string;
    averageDom: number;
    mortgageRate30Yr: string;
    rateTrend: 'down' | 'up' | 'flat';
  };
  todayAtNest: {
    birthdays: string[];
    workAnniversaries: string[];
    featuredOpenHouses: { address: string; time: string; hostBroker: string }[];
    brokerageEvents: { title: string; time: string; location: string; organizer: string }[];
  };
  audioBriefing: {
    durationSeconds: number;
    voiceActor: string;
    audioUrl: string;
    transcript: string;
  };
  activeAgentCount: number;
}

export const NoraMorningPulseStudio: React.FC = () => {
  const [pulse, setPulse] = useState<MorningPulseData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(58);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchMorningPulse();
  }, []);

  // Cleanup audio on unmount
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

  const fetchMorningPulse = async () => {
    try {
      const res = await fetch('/api/nora/morning-pulse');
      const data = await res.json();
      if (data.success) {
        setPulse(data.pulse);
        if (data.pulse?.audioBriefing?.durationSeconds) {
          setAudioDuration(data.pulse.audioBriefing.durationSeconds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlayAudio = async () => {
    setAudioError(null);

    // If playing, pause
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // If audio already loaded in memory
    if (audioRef.current && audioBlobUrlRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (e) {
        console.warn('[Audio Play Error]:', e);
      }
    }

    if (!pulse?.audioBriefing?.transcript) return;

    setIsLoadingAudio(true);
    try {
      const res = await fetch('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pulse.audioBriefing.transcript,
          voiceId: 'l006hw6wZaEYAv80cbzj' // Official Nora Custom Real Estate Voice
        })
      });

      if (!res.ok) {
        throw new Error(`ElevenLabs audio stream unavailable (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      audioBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const pct = (audio.currentTime / audio.duration) * 100;
          setPlaybackProgress(Math.min(100, Math.max(0, pct)));
          setCurrentAudioTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(100);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setAudioError('ElevenLabs audio stream error. Please retry.');
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error('[ElevenLabs Morning Pulse Error]:', err);
      // Strictly NO fallback to robotic browser voice
      setAudioError(err.message || 'ElevenLabs audio temporarily unavailable. Click retry.');
      setIsPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleSeek = (percentage: number) => {
    const clampedPct = Math.max(0, Math.min(100, percentage));
    setPlaybackProgress(clampedPct);
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (clampedPct / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentAudioTime(newTime);
    } else {
      setCurrentAudioTime((clampedPct / 100) * audioDuration);
    }
  };

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/nora/morning-pulse/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'both' })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!pulse) {
    return (
      <div className="p-8 text-center text-xs text-stone-600 bg-white rounded-xl border border-stone-200">
        Loading Daily Morning Pulse...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner (Apple Light Mode) */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-white to-stone-50 rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full tracking-wider">
              Daily 8:00 AM Edition
            </span>
            <span className="text-xs font-semibold text-stone-600">
              {pulse.formattedDate}
            </span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00635C]" />
            Nora Morning Pulse & Daily Inspiration
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Synchronized Cape Fear MLS market recap, daily mindset spark, and team priorities for {pulse.activeAgentCount} Nest brokers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {broadcastSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Dispatched to 77 Brokers!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isBroadcasting ? 'Dispatching...' : 'Broadcast to Team (SMS & Email)'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Neural Audio Briefing Player */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-3">
        {/* Error Alert Badge (Strict No-Robot Voice Policy) */}
        {audioError && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{audioError}</span>
            </div>
            <button
              type="button"
              onClick={togglePlayAudio}
              className="font-bold underline text-rose-800 hover:text-rose-900 ml-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayAudio}
              disabled={isLoadingAudio}
              className="w-10 h-10 rounded-full bg-[#00635C] hover:bg-[#00524C] text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-75"
              title={isLoadingAudio ? 'Loading ElevenLabs voice...' : isPlaying ? 'Pause briefing' : 'Play briefing with ElevenLabs Nora'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#00635C]" />
                  Nora 60-Second Daily Voice Briefing
                </h4>
                <span className="text-[9px] font-mono bg-emerald-50 text-[#00635C] border border-emerald-200/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  ElevenLabs Nora
                </span>
              </div>
              <p className="text-[10px] text-stone-600 mt-0.5">
                ElevenLabs High-Fidelity Voice • {Math.round(audioDuration)}s duration
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-stone-600">
            {Math.floor((currentAudioTime || (playbackProgress / 100) * audioDuration) / 60)}:
            {Math.round((currentAudioTime || (playbackProgress / 100) * audioDuration) % 60) < 10 ? '0' : ''}
            {Math.round((currentAudioTime || (playbackProgress / 100) * audioDuration) % 60)}
            {' / '}
            {Math.floor(audioDuration / 60)}:{Math.round(audioDuration % 60) < 10 ? '0' : ''}{Math.round(audioDuration % 60)}
          </span>
        </div>

        {/* Interactive Scrub Progress Bar */}
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = (clickX / rect.width) * 100;
            handleSeek(pct);
          }}
          className="w-full bg-stone-100 hover:bg-stone-200 h-2 rounded-full overflow-hidden cursor-pointer transition-all"
          title="Click to seek"
        >
          <div
            className="bg-[#00635C] h-full transition-all duration-150 rounded-full"
            style={{ width: `${playbackProgress}%` }}
          />
        </div>

        {/* Audio Transcript Collapsible */}
        <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-100 text-xs text-stone-700 leading-relaxed italic">
          "{pulse.audioBriefing.transcript}"
        </div>
      </div>

      {/* Main Grid: Mindset Spark & Cape Fear MLS Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Mindset & Spark */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 pb-2 border-b border-stone-100">
              <Quote className="w-4 h-4 text-[#00635C]" />
              Daily Broker Mindset & Philosophy
            </div>
            <blockquote className="text-xs font-medium text-stone-800 leading-relaxed italic bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/60">
              "{pulse.inspirationalSpark.quote}"
            </blockquote>
            <p className="text-[11px] font-bold text-stone-600 text-right">
              — {pulse.inspirationalSpark.author}
            </p>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">
              ⚡ Today's Production Challenge
            </span>
            <p className="text-xs font-semibold text-amber-900">
              {pulse.inspirationalSpark.actionChallenge}
            </p>
          </div>
        </div>

        {/* Cape Fear MLS 24-Hour Market Recap */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Cape Fear MLS 24h Market Stats
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-600 block">Median Sold Price</span>
              <span className="text-sm font-bold text-stone-900">{pulse.marketPulse.medianSoldPrice}</span>
              <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Avg {pulse.marketPulse.averageDom} DOM</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-600 block">30-Yr Fixed Rate</span>
              <span className="text-sm font-bold text-stone-900 flex items-center gap-1">
                {pulse.marketPulse.mortgageRate30Yr}
                <TrendingDown className="w-3 h-3 text-emerald-600" />
              </span>
              <span className="text-[10px] text-stone-600 font-medium block mt-0.5">Conventional Ref</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-600 block">New Listings (24h)</span>
              <span className="text-sm font-bold text-emerald-700">+{pulse.marketPulse.newListings24h} Active</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">Wilmington / Beaches</span>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
              <span className="text-[10px] text-stone-600 block">Closed Volume (24h)</span>
              <span className="text-sm font-bold text-stone-900">{pulse.marketPulse.closedVolume24h}</span>
              <span className="text-[10px] text-stone-600 block mt-0.5">{pulse.marketPulse.pendingContracts24h} Went Pending</span>
            </div>
          </div>
        </div>

        {/* Today at Nest: Celebrations & Masterminds */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Today at Nest Realty
            </span>
            <span className="text-[10px] text-stone-600">Roster Pulse</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-600 uppercase">🎉 Celebrations & Anniversaries</span>
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-stone-800">
                {pulse.todayAtNest.workAnniversaries.concat(pulse.todayAtNest.birthdays).map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span>🎈</span>
                    <span className="font-semibold">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-600 uppercase">🏡 Active Open Houses Today</span>
              {pulse.todayAtNest.featuredOpenHouses.map((oh, i) => (
                <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-stone-900 truncate max-w-[150px]">{oh.address}</span>
                  <span className="text-stone-600">{oh.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
