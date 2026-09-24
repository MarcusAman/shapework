/**
 * Authoritative call recording + transcript panel.
 * Hydrates from GET /api/marketing/calls/:id/media — never shows an empty scrubber.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  Volume2,
  VolumeX
} from 'lucide-react';

export type CallMediaPayload = {
  callId: string;
  recordingUrlAvailable?: boolean;
  audioEndpoint?: string;
  callDurationSeconds?: number;
  recordingDurationSeconds?: number;
  transcript?: string;
  recordingStatus?: 'available' | 'processing' | 'unavailable' | string;
};

type MediaPhase = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

function parseTranscriptTurns(raw: string): Array<{ id: string; speaker: string; text: string }> {
  if (!raw || !raw.trim()) return [];
  const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const turns: Array<{ id: string; speaker: string; text: string }> = [];
  lines.forEach((line, idx) => {
    const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (m) {
      turns.push({ id: `t-${idx}`, speaker: m[1].trim(), text: m[2].trim() });
    } else {
      turns.push({ id: `t-${idx}`, speaker: idx % 2 === 0 ? 'Caller' : 'Agent', text: line });
    }
  });
  return turns;
}

function unavailableReason(status?: string, httpError?: string): string {
  if (httpError) return httpError;
  if (status === 'processing') return 'Recording is still processing from the telephony provider.';
  if (status === 'unavailable') return 'No recording file is stored for this call.';
  return 'Recording not available for this call.';
}

export function CallRecordingPanel({
  callId,
  fallbackAudioUrl,
  fallbackTranscript,
  onOpenInCalls
}: {
  callId?: string | null;
  fallbackAudioUrl?: string | null;
  fallbackTranscript?: string | null;
  onOpenInCalls?: () => void;
}) {
  const [phase, setPhase] = useState<MediaPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [media, setMedia] = useState<CallMediaPayload | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const hydrate = useCallback(async () => {
    if (!callId) {
      setPhase('unavailable');
      setMedia(null);
      setErrorMessage(null);
      return;
    }
    setPhase('loading');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/marketing/calls/${encodeURIComponent(callId)}/media`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.media) {
        // Soft-fallback: try known audio URL before hard error
        if (fallbackAudioUrl) {
          setMedia({
            callId,
            recordingUrlAvailable: true,
            audioEndpoint: fallbackAudioUrl,
            transcript: fallbackTranscript || '',
            recordingStatus: 'available'
          });
          setPhase('ready');
          return;
        }
        setPhase('error');
        setErrorMessage(data?.error || `Could not load media for call ${callId} (HTTP ${res.status}).`);
        return;
      }
      const m = data.media as CallMediaPayload;
      const available = Boolean(m.recordingUrlAvailable && m.audioEndpoint);
      if (!available) {
        setMedia(m);
        setPhase('unavailable');
        return;
      }
      setMedia(m);
      setPhase('ready');
    } catch (err: any) {
      if (fallbackAudioUrl) {
        setMedia({
          callId,
          recordingUrlAvailable: true,
          audioEndpoint: fallbackAudioUrl,
          transcript: fallbackTranscript || '',
          recordingStatus: 'available'
        });
        setPhase('ready');
        return;
      }
      setPhase('error');
      setErrorMessage(err?.message || 'Network error while loading call media.');
    }
  }, [callId, fallbackAudioUrl, fallbackTranscript]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    hydrate();
  }, [hydrate]);

  const turns = parseTranscriptTurns(media?.transcript || fallbackTranscript || '');
  const filteredTurns = transcriptSearch.trim()
    ? turns.filter(t =>
        t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        t.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
      )
    : turns;

  const handleToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setPhase('error');
        setErrorMessage('Audio failed to play. Retry or open this call in Calls.');
        setIsPlaying(false);
      });
    }
  };

  const openCalls = () => {
    if (onOpenInCalls) {
      onOpenInCalls();
      return;
    }
    const url = callId
      ? `/marketing?tab=calls&callId=${encodeURIComponent(callId)}`
      : '/marketing?tab=calls';
    window.location.assign(url);
  };

  if (!callId) {
    return (
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-2" data-testid="call-recording-panel-none">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400" />
          Call Recording &amp; Transcript
        </h3>
        <div className="p-4 bg-slate-800/50 rounded-xl text-center space-y-1">
          <p className="font-bold text-white text-xs">Recording not available</p>
          <p className="text-slate-400 text-[11px]">No telephony call is linked to this record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4" data-testid="call-recording-panel">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-white">Call Recording &amp; Transcript</h3>
            <p className="text-xs text-slate-400 truncate">
              {phase === 'ready' && media?.callDurationSeconds
                ? `${Math.floor((media.callDurationSeconds || 0) / 60)}m ${(media.callDurationSeconds || 0) % 60}s · hydrated from call media`
                : 'Authoritative telephony recording and speaker dialogue'}
            </p>
          </div>
        </div>

        {phase === 'ready' && turns.length > 0 && (
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transcriptSearch}
              onChange={e => setTranscriptSearch(e.target.value)}
              placeholder="Search transcript..."
              className="w-full pl-8 pr-3 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        )}
      </div>

      {phase === 'loading' && (
        <div className="p-4 bg-slate-800/60 rounded-xl text-xs text-slate-300 flex items-center gap-2" data-testid="call-recording-loading">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>Loading recording and transcript…</span>
        </div>
      )}

      {phase === 'error' && (
        <div className="p-4 bg-rose-950/50 border border-rose-700/60 rounded-xl space-y-3" data-testid="call-recording-error">
          <div className="flex items-start gap-2 text-rose-100 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Couldn’t load call recording</p>
              <p className="text-rose-200/90 mt-0.5">{errorMessage || 'Unknown media error.'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => hydrate()}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={openCalls}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Calls
            </button>
          </div>
        </div>
      )}

      {phase === 'unavailable' && (
        <div className="p-4 bg-slate-800/50 rounded-xl text-center space-y-1" data-testid="call-recording-unavailable">
          <p className="font-bold text-white text-xs">Recording not available</p>
          <p className="text-slate-400 text-[11px]">
            {unavailableReason(media?.recordingStatus)}
          </p>
          <button
            type="button"
            onClick={openCalls}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            Open call in Calls
          </button>
        </div>
      )}

      {phase === 'ready' && media?.audioEndpoint && (
        <div className="space-y-3" data-testid="call-recording-ready">
          <audio
            ref={audioRef}
            src={media.audioEndpoint}
            onTimeUpdate={() => {
              if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
                setDuration(audioRef.current.duration);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setPhase('error');
              setErrorMessage('Audio stream failed (missing file or proxy error).');
              setIsPlaying(false);
            }}
            className="hidden"
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleToggle}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition cursor-pointer shadow-sm shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={e => {
                  const val = Number(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !muted;
                  setMuted(!muted);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {filteredTurns.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pt-2 border-t border-slate-800 pr-1 text-xs">
              {filteredTurns.map(turn => {
                const isAgent =
                  turn.speaker.toLowerCase().includes('caller') ||
                  turn.speaker.toLowerCase().includes('agent') ||
                  turn.speaker.toLowerCase().includes('broker');
                return (
                  <div
                    key={turn.id}
                    className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700'
                        : 'bg-emerald-950/60 text-emerald-200 border border-emerald-800/60'
                    }`}
                  >
                    <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5 opacity-70">
                      {turn.speaker}
                    </span>
                    <p className="whitespace-pre-wrap font-sans">{turn.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              Transcript not available for this recording.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
