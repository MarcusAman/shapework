/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GlobalNoraVoiceBar
 * Floating Omnipresent Voice Bar in Apple Light Mode.
 * Docked at the bottom-right of the application across all pages.
 */

import React from 'react';
import { Mic, MicOff, Volume2, ChevronUp, MessageSquare } from 'lucide-react';

interface GlobalNoraVoiceBarProps {
  voiceState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error';
  statusMessage: string;
  audioLevel: number;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onStartVoice: () => void;
  onStopAudio: () => void;
}

export default function GlobalNoraVoiceBar({
  voiceState,
  statusMessage,
  audioLevel,
  isDrawerOpen,
  onToggleDrawer,
  onStartVoice,
  onStopAudio
}: GlobalNoraVoiceBarProps) {
  // If drawer is already open, show a minimized indicator or docked pill
  const isActive = voiceState !== 'idle';
  const isSpeaking = voiceState === 'speaking';
  const isListening = voiceState === 'listening';

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none print:hidden animate-fadeIn">
      {/* Main Floating Voice Pill */}
      <div className={`flex items-center gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-md border ${
        isActive ? 'border-emerald-300 ring-4 ring-emerald-500/10' : 'border-stone-200/90'
      } rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300`}>
        
        {/* NORA Avatar / Live Wave Indicator */}
        <button
          onClick={isActive ? onStopAudio : onStartVoice}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isSpeaking 
              ? 'bg-[#00635C] text-white animate-pulse shadow-md shadow-emerald-700/20' 
              : isListening 
                ? 'bg-emerald-50 text-[#00635C] border border-emerald-300' 
                : 'bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-[#00635C]'
          }`}
          title={isActive ? 'Stop / Interrupt NORA' : 'Talk to NORA'}
        >
          {isSpeaking ? (
            <Volume2 className="w-4 h-4" />
          ) : isListening ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 bg-[#00635C] rounded-full animate-bounce h-3" />
              <span className="w-1 bg-[#00635C] rounded-full animate-bounce h-4 delay-75" />
              <span className="w-1 bg-[#00635C] rounded-full animate-bounce h-2 delay-150" />
            </div>
          ) : (
            <Mic className="w-4 h-4 text-[#00635C]" />
          )}
        </button>

        {/* Status Text & Waveform */}
        <div className="cursor-pointer max-w-[200px] sm:max-w-[260px]" onClick={onToggleDrawer}>
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-bold text-xs text-stone-900">NORA</span>
            <span className="text-[10px] bg-emerald-50 border border-emerald-200/80 text-[#00635C] px-1.5 py-0.2 rounded font-semibold">
              Voice
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
            {statusMessage}
          </p>
        </div>

        {/* Expand / Open Drawer Button */}
        <button
          onClick={onToggleDrawer}
          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
          title={isDrawerOpen ? 'Close Drawer' : 'Expand NORA Canvas'}
        >
          {isDrawerOpen ? <MessageSquare className="w-4 h-4 text-[#00635C]" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
