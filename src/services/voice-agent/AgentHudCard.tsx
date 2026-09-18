import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Check, X, PhoneOff } from 'lucide-react';
import { AgentState, PendingProposal } from './agentRuntimeReducer';

interface AgentHudCardProps {
  agentName?: string;
  status: AgentState;
  frequencyBars: number[];
  pendingProposal: PendingProposal | null;
  latestActionCard?: {
    title: string;
    target: string;
    details: string;
    deepLinkUrl?: string;
  } | null;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  orbVideoSrc?: string;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onConfirmProposal: () => void;
  onRejectProposal: () => void;
  onClose: () => void;
}

export const AgentHudCard: React.FC<AgentHudCardProps> = ({
  agentName = 'Ask Nest Ops',
  status,
  frequencyBars,
  pendingProposal,
  latestActionCard,
  isMicMuted,
  isSpeakerMuted,
  orbVideoSrc = '/nest_orb_2.mp4',
  onToggleMic,
  onToggleSpeaker,
  onConfirmProposal,
  onRejectProposal,
  onClose
}) => {
  if (status === 'idle' && !pendingProposal) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-slide-up font-sans text-xs"
      data-testid="agent-hud-card"
    >
      <div className="bg-[#01362D]/95 backdrop-blur-xl border border-[rgba(246,247,241,0.15)] shadow-2xl rounded-2xl p-4 text-white flex flex-col gap-3 max-w-md">
        
        {/* Header: Agent Info & Frequency Equalizer */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-emerald-500/40">
              <video
                src={orbVideoSrc}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              {status === 'speaking' && (
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{agentName}</span>
                <span className="text-[10px] font-mono text-emerald-300/80 uppercase">
                  Voice Agent
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'listening' ? 'bg-rose-500 animate-ping' :
                  status === 'speaking' ? 'bg-emerald-400 animate-pulse' :
                  status === 'thinking' ? 'bg-amber-400 animate-pulse' :
                  status === 'follow_up' ? 'bg-cyan-400 animate-bounce' : 'bg-slate-400'
                }`} />

                <span className="text-[11px] text-slate-200 font-medium">
                  {status === 'listening' && '🎙️ Listening...'}
                  {status === 'thinking' && '🧠 Thinking...'}
                  {status === 'speaking' && '🔊 Speaking...'}
                  {status === 'follow_up' && '⚡ Confirmation Needed'}
                  {status === 'interrupted' && '⚡ Interrupted (Barge-in)'}
                  {status === 'error' && '⚠️ Exception'}
                </span>
              </div>
            </div>
          </div>

          {/* 20-Bar Frequency Visualizer Canvas */}
          <div className="h-6 w-24 bg-black/30 border border-white/10 rounded-lg px-1.5 flex items-center justify-between gap-0.5 overflow-hidden">
            {frequencyBars.map((val, idx) => (
              <div
                key={idx}
                className={`w-0.5 rounded-full transition-all duration-75 ${
                  status === 'speaking' ? 'bg-emerald-400' :
                  status === 'listening' ? 'bg-rose-400' : 'bg-cyan-400'
                }`}
                style={{
                  height: `${Math.max(12, val * 100)}%`
                }}
              />
            ))}
          </div>
        </div>

        {/* Pending Confirmation Proposal Banner */}
        {pendingProposal && (
          <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2 animate-fade-in">
            <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
              Action Proposal Confirmation
            </span>
            <p className="text-xs text-slate-100 leading-relaxed font-sans">
              Would you like to proceed with {pendingProposal.summary}?
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={onConfirmProposal}
                className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>

              <button
                type="button"
                onClick={onRejectProposal}
                className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-200 font-medium rounded-lg text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* On-Screen Data Evidence Card */}
        {latestActionCard && !pendingProposal && (
          <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3 flex flex-col gap-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                {latestActionCard.target}
              </span>
              <span className="text-[9px] font-mono text-emerald-300/80">App Data Evidence</span>
            </div>
            <p className="font-bold text-xs text-white">{latestActionCard.title}</p>
            <p className="text-[11px] text-slate-200 leading-relaxed font-sans">{latestActionCard.details}</p>
          </div>
        )}

        {/* Footer Quick Action Buttons */}
        <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMic}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isMicMuted ? 'bg-rose-900/60 border-rose-500 text-rose-300' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onToggleSpeaker}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSpeakerMuted ? 'bg-amber-900/60 border-amber-500 text-amber-300' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              }`}
              title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>

      </div>
    </div>
  );
};
