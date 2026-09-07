/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NoraVoiceGroundingModal
 * Real-Time Voice & Chat Grounding Testbed using Rechat MCP & Retell AI (910-507-2047)
 */

import React, { useState } from 'react';
import {
  X,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  RefreshCw,
  Database,
  Calendar,
  Users,
  CheckCircle2,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';

interface NoraVoiceGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_VOICE_PROMPTS = [
  { label: 'Live Oak MLS Specs', query: 'What is the listing price and specs for 1104 S Live Oak Pkwy?', icon: Building },
  { label: 'Live Oak Closing Date', query: 'When is the closing date for the 1104 S Live Oak Pkwy transaction?', icon: Calendar },
  { label: 'Matt Orr People Center', query: 'Look up Matt Orr in Rechat People Center', icon: Users },
  { label: '212 Wetland Specs', query: 'What are the specifications for 212 Wetland Drive?', icon: Building }
];

export const NoraVoiceGroundingModal: React.FC<NoraVoiceGroundingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [queryInput, setQueryInput] = useState('What is the listing price and specs for 1104 S Live Oak Pkwy?');
  const [isLoading, setIsLoading] = useState(false);
  const [groundedResult, setGroundedResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleRunQuery = async (queryText: string) => {
    const q = queryText || queryInput;
    if (!q.trim()) return;

    setIsLoading(true);
    stopSpeaking();

    try {
      const res = await fetch('/api/nora/voice-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, caller_name: 'Matt Orr', caller_number: '+12527170595' })
      });
      const data = await res.json();
      if (data.success) {
        setGroundedResult(data);
        // Automatically speak response if browser supports SpeechSynthesis
        speakAnswer(data.spokenAnswer);
      }
    } catch (err) {
      console.error('[Nora Voice Grounding Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const speakAnswer = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google US English'));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-[#00635C] to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Nora Real-Time Voice Grounding</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  Rechat MCP + Retell 910-507-2047
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Ask Nora about live MLS listings, closing dates, and contacts — answers spoken in real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Voice Prompts */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Quick Prompts:</span>
          {QUICK_VOICE_PROMPTS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQueryInput(p.query);
                  handleRunQuery(p.query);
                }}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#00635C] border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Icon className="w-3 h-3 text-[#00635C]" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Query Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery(queryInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Mic className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask Nora a question about MLS listings, deals, or contacts..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#00635C] transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !queryInput.trim()}
              className="px-4 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Ask Nora</span>
            </button>
          </form>

          {/* Spoken Answer Banner */}
          {groundedResult?.spokenAnswer && (
            <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#00635C] text-white flex items-center justify-center shadow-2xs">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00635C]">
                      Nora Voice Hotline Response (Spoken Audio)
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Grounded via Rechat MCP Server • Latency: sub-500ms
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else speakAnswer(groundedResult.spokenAnswer);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isSpeaking 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-[#00635C] text-white hover:bg-[#004d47]'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Play Voice'}</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/60 text-slate-900 font-sans text-xs leading-relaxed italic">
                "{groundedResult.spokenAnswer}"
              </div>
            </div>
          )}

          {/* Reasoning Steps */}
          {groundedResult?.reasoningSteps && groundedResult.reasoningSteps.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Multi-Step Reasoning Trace:
              </span>
              <div className="space-y-1.5">
                {groundedResult.reasoningSteps.map((s: any, sIdx: number) => (
                  <div key={sIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">{s.title}</div>
                      <div className="text-slate-500 text-[10px]">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Entities */}
          {groundedResult?.matchedItems && groundedResult.matchedItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Verified Rechat Data Record:
              </span>
              {groundedResult.matchedItems.map((item: any, iIdx: number) => (
                <div key={iIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Retell AI Telephony Agent ID: agent_cdd031880770993e4b11cb9340</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
