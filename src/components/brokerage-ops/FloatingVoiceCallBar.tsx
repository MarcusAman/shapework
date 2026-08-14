import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, PhoneOff, Zap } from 'lucide-react';
import { ConvAiStatus } from '../../hooks/useElevenLabsConvAi';

interface FloatingVoiceCallBarProps {
  status: ConvAiStatus;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  frequencyData: number[];
  orbVideoSrc?: string;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onToggleDrawer: () => void;
  onEndCall: () => void;
}

export const FloatingVoiceCallBar: React.FC<FloatingVoiceCallBarProps> = ({
  status,
  isMicMuted,
  isSpeakerMuted,
  frequencyData,
  orbVideoSrc = '/nest_ops_orb.mp4',
  onToggleMic,
  onToggleSpeaker,
  onToggleDrawer,
  onEndCall
}) => {
  if (status === 'idle') return null;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-slide-up"
      data-testid="floating-voice-call-bar"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-[var(--sw-border,#E2E4DA)] shadow-2xl rounded-3xl p-3 flex items-center justify-between gap-4 font-sans text-xs">
        
        {/* Left: Avatar & Live Status Badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[var(--sw-border,#E2E4DA)] shadow-2xs">
            <video
              src={orbVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            {status === 'speaking' && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping pointer-events-none" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-sm text-[var(--brand-primary,#01362D)]">
                Ask Nest Ops Voice
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                status === 'listening' ? 'bg-rose-500 animate-ping' :
                status === 'speaking' ? 'bg-emerald-500 animate-pulse' :
                status === 'thinking' ? 'bg-amber-500 animate-pulse' :
                status === 'interrupted' ? 'bg-rose-600 animate-bounce' : 'bg-slate-400'
              }`} />

              <span className="font-semibold text-[11px] text-[var(--sw-text-primary,#17231F)]">
                {status === 'connecting' && '⚡ Connecting...'}
                {status === 'listening' && '🎙️ Listening to you...'}
                {status === 'thinking' && '🧠 One moment...'}
                {status === 'speaking' && '🔊 Speaking...'}
                {status === 'interrupted' && '⚡ Interrupted'}
                {status === 'error' && '⚠️ Connection Exception'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live 20-Bar WebAudio Frequency Equalizer Canvas */}
        <div className="flex-1 max-w-[140px] h-7 bg-[var(--sw-canvas,#FBF8F0)] border border-[var(--sw-border,#E2E4DA)] rounded-xl px-2 flex items-center justify-between gap-0.5 overflow-hidden">
          {frequencyData.map((val, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-75 ${
                status === 'speaking' ? 'bg-emerald-500' :
                status === 'listening' ? 'bg-rose-500' : 'bg-[var(--brand-primary,#00635C)]'
              }`}
              style={{
                height: `${Math.max(10, val * 100)}%`,
                opacity: status === 'idle' ? 0.3 : 0.9
              }}
            />
          ))}
        </div>

        {/* Right: Quick Action Control Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isMicMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-[var(--sw-canvas,#FBF8F0)] border-[var(--sw-border,#E2E4DA)] text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleSpeaker}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isSpeakerMuted
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-[var(--sw-canvas,#FBF8F0)] border-[var(--sw-border,#E2E4DA)] text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]'
            }`}
            title={isSpeakerMuted ? 'Unmute Lorena Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleDrawer}
            className="p-2.5 rounded-xl border border-[var(--sw-border,#E2E4DA)] bg-[var(--sw-canvas,#FBF8F0)] text-[var(--brand-primary)] hover:bg-[var(--brand-soft)] transition-all cursor-pointer"
            title="Toggle Transcript Drawer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onEndCall}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 transition-all cursor-pointer shadow-2xs"
            title="End Voice Call Session"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
