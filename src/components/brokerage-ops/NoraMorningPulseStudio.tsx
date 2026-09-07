import React, { useState, useEffect } from 'react';
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
  Quote
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
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    fetchMorningPulse();
  }, []);

  const fetchMorningPulse = async () => {
    try {
      const res = await fetch('/api/nora/morning-pulse');
      const data = await res.json();
      if (data.success) setPulse(data.pulse);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayAudio = () => {
    if (!isPlaying && 'speechSynthesis' in window && pulse) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(pulse.audioBriefing.transcript);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };
      window.speechSynthesis.speak(utterance);
    } else if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(!isPlaying);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayAudio}
              className="w-10 h-10 rounded-full bg-[#00635C] hover:bg-[#00524C] text-white flex items-center justify-center shadow-md transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div>
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#00635C]" />
                Nora 60-Second Daily Voice Briefing
              </h4>
              <p className="text-[10px] text-stone-600">
                {pulse.audioBriefing.voiceActor} • {pulse.audioBriefing.durationSeconds}s duration
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-stone-600">
            {isPlaying ? `${Math.round((playbackProgress / 100) * pulse.audioBriefing.durationSeconds)}s` : '0:58'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#00635C] h-full transition-all duration-300 rounded-full"
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
