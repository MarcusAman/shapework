/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NoraVoiceDrawer
 * Interactive Side Canvas & Omnichannel Voice Workspace for NORA.
 * In Apple Light Mode (#FFFFFF / #F7F8F5).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X, Mic, MicOff, Send, Volume2, Sparkles, RotateCcw, CheckCircle2,
  AlertTriangle, ArrowRight, Play, ExternalLink, HelpCircle, User, ShieldCheck,
  CheckSquare, Square, CornerDownLeft, PhoneCall
} from 'lucide-react';
import { NoraVoiceTurn } from '../../hooks/useNoraOmnichannelSession';
import { KineticGlassCaustics } from '../shared/KineticGlassCaustics';

interface NoraVoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  voiceState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error';
  statusMessage: string;
  audioLevel: number;
  turns: NoraVoiceTurn[];
  activeSopCard: any | null;
  isActionLoading: boolean;
  notification: string | null;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onSendQuery: (query: string) => void;
  onToggleStep: (stepNumber: number) => void;
  onEscalate: (notes?: string, urgent?: boolean) => void;
  onStartRun: (address?: string) => void;
  onReset: () => void;
}

export default function NoraVoiceDrawer({
  isOpen,
  onClose,
  voiceState,
  statusMessage,
  audioLevel,
  turns,
  activeSopCard,
  isActionLoading,
  notification,
  onStartVoice,
  onStopVoice,
  onSendQuery,
  onToggleStep,
  onEscalate,
  onStartRun,
  onReset
}: NoraVoiceDrawerProps) {
  const [typedInput, setTypedInput] = useState('');
  const [escalateNote, setEscalateNote] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState('142 Market St, Wilmington NC');
  const [showStartRunModal, setShowStartRunModal] = useState(false);

  const turnsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, activeSopCard]);

  if (!isOpen) return null;

  const isSpeaking = voiceState === 'speaking';
  const isListening = voiceState === 'listening';

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedInput.trim()) return;
    onSendQuery(typedInput.trim());
    setTypedInput('');
  };

  const handleConfirmEscalate = () => {
    onEscalate(escalateNote);
    setShowEscalateModal(false);
    setEscalateNote('');
  };

  const handleConfirmStartRun = () => {
    onStartRun(propertyAddress);
    setShowStartRunModal(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[480px] lg:w-[540px] bg-white border-l border-stone-200/90 shadow-2xl flex flex-col animate-slideInRight overflow-hidden">
      
      {/* Kinetic Frosted Glass Caustics & Morning Sunlight Refraction */}
      <KineticGlassCaustics variant="drawer" />

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-[#00635C] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{notification}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        </div>
      )}

      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-white/95 border-b border-stone-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#00635C] shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-stone-900">Ask Nora</h2>
              <span className="bg-emerald-50 border border-emerald-200/80 text-[#00635C] text-[10px] px-2 py-0.5 rounded-full font-semibold">
                NORA Voice
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Authoritative policy & step-by-step guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
            title="New Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Voice Status & Live Visualizer Strip */}
      <div className="px-5 py-3 bg-[#F7F8F5] border-b border-stone-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isListening ? onStopVoice : onStartVoice}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-[#00635C] text-white animate-pulse'
                : isListening
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 text-stone-700 hover:bg-[#00635C] hover:text-white'
            }`}
            title={isListening ? 'Mute Microphone' : 'Start Voice'}
          >
            {isListening || isSpeaking ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
          <span className="text-xs text-stone-700 font-medium truncate max-w-[240px]">
            {statusMessage}
          </span>
        </div>

        {/* Live Audio Waveform Bars */}
        <div className="flex items-center gap-1 h-5">
          {[40, 70, 100, 60, 85, 45, 90, 65].map((baseHeight, i) => {
            const dynamicHeight = isListening || isSpeaking 
              ? Math.max(15, Math.min(100, Math.round(baseHeight * (audioLevel / 50 || 0.4))))
              : 20;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isSpeaking ? 'bg-[#00635C]' : isListening ? 'bg-emerald-500' : 'bg-stone-300'
                }`}
                style={{ height: `${dynamicHeight}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Main Conversation & Evidence Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        
        {/* Welcome Banner when no turns */}
        {turns.length === 0 && (
          <div className="p-5 bg-[#F7F8F5] border border-stone-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#00635C] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Welcome to NORA
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              I am grounded exclusively in **approved Nest Realty standard operating procedures**. Ask me anything about listing launches, contract verifications, yard sign dispatch, or marketing intake.
            </p>
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Suggested Questions:</span>
              <button
                onClick={() => onSendQuery("What is the listing launch protocol?")}
                className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50/60 border border-stone-200/80 rounded-xl text-xs text-stone-800 font-medium transition-all"
              >
                "What is the listing launch protocol?"
              </button>
              <button
                onClick={() => onSendQuery("What is the buyer contract verification and EMD audit procedure?")}
                className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50/60 border border-stone-200/80 rounded-xl text-xs text-stone-800 font-medium transition-all"
              >
                "What is the buyer contract verification procedure?"
              </button>
              <button
                onClick={() => onSendQuery("How do we dispatch sign post installations?")}
                className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50/60 border border-stone-200/80 rounded-xl text-xs text-stone-800 font-medium transition-all"
              >
                "How do we dispatch yard signs and riders?"
              </button>
            </div>
          </div>
        )}

        {/* Turn Timeline */}
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex flex-col ${turn.speaker === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center gap-1.5 px-1 text-[10px] text-stone-400 font-medium">
              <span>{turn.speaker === 'user' ? 'You' : 'NORA'}</span>
              <span>•</span>
              <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                turn.speaker === 'user'
                  ? 'bg-[#00635C] text-white rounded-br-sm'
                  : 'bg-stone-100/90 text-stone-800 border border-stone-200/80 rounded-bl-sm space-y-2'
              }`}
            >
              <p className="whitespace-pre-line">{turn.text}</p>
            </div>
          </div>
        ))}

        {/* Interactive Active SOP Card (If Matched) */}
        {activeSopCard && (
          <div className="p-4 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-md space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-50 border border-emerald-200/80 text-[#00635C] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Approved SOP Checklist
              </span>
              <a
                href={`/app/sops?tab=published&sopId=${activeSopCard.id}`}
                className="text-[11px] text-[#00635C] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View Policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <h4 className="font-serif font-bold text-stone-900 text-sm">{activeSopCard.title}</h4>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Process Owner: <strong className="text-stone-700">{activeSopCard.processOwner}</strong>
              </p>
            </div>

            {/* Step-by-Step Checklist */}
            {activeSopCard.steps && activeSopCard.steps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Execution Steps:</span>
                {activeSopCard.steps.map((st: any) => (
                  <div
                    key={st.stepNumber}
                    onClick={() => onToggleStep(st.stepNumber)}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      st.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-stone-500 line-through'
                        : 'bg-stone-50/80 border-stone-200/80 hover:bg-stone-100/80 text-stone-800'
                    }`}
                  >
                    <button className="mt-0.5 text-[#00635C] shrink-0">
                      {st.completed ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-stone-400" />}
                    </button>
                    <div className="text-xs flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px]">Step {st.stepNumber} ({st.role})</span>
                        {st.systemUsed && (
                          <span className="text-[10px] text-stone-400 font-mono">{st.systemUsed}</span>
                        )}
                      </div>
                      <p className="mt-0.5 leading-snug">{st.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar: Start Run + Escalate */}
            <div className="pt-2 border-t border-stone-200/80 flex items-center gap-2">
              <button
                onClick={() => setShowStartRunModal(true)}
                disabled={isActionLoading}
                className="flex-1 py-2 px-3 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Checklist Run</span>
              </button>
              <button
                onClick={() => setShowEscalateModal(true)}
                disabled={isActionLoading}
                className="py-2 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                title="Create clarification ticket for process owner"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Ask {activeSopCard.processOwner?.split(' ')[0] || 'Owner'}</span>
              </button>
            </div>
          </div>
        )}

        <div ref={turnsEndRef} />
      </div>

      {/* Multi-Turn Quick Suggestion Pills */}
      {activeSopCard && (
        <div className="px-5 py-2 bg-[#F7F8F5] border-t border-stone-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Ask Follow-Up:</span>
          <button
            onClick={() => onSendQuery("Who is the owner of this?")}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-stone-200 rounded-lg text-[11px] text-stone-700 font-medium whitespace-nowrap transition-colors"
          >
            "Who owns this?"
          </button>
          <button
            onClick={() => onSendQuery("What is step 2?")}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-stone-200 rounded-lg text-[11px] text-stone-700 font-medium whitespace-nowrap transition-colors"
          >
            "What is step 2?"
          </button>
          <button
            onClick={() => onSendQuery("How long does this process take?")}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-stone-200 rounded-lg text-[11px] text-stone-700 font-medium whitespace-nowrap transition-colors"
          >
            "How long does it take?"
          </button>
        </div>
      )}

      {/* Typed Chat Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-200/80 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={isListening ? onStopVoice : onStartVoice}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isListening ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-[#00635C]'
          }`}
          title={isListening ? 'Stop Voice' : 'Talk with NORA'}
        >
          {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          placeholder="Ask NORA or type a follow-up question..."
          className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] transition-all"
        />

        <button
          type="submit"
          disabled={!typedInput.trim()}
          className="p-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Escalation Modal Dialog */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Ask Process Owner for Clarification</span>
            </div>
            <p className="text-stone-600 text-xs">
              This creates an operational intake ticket assigned to <strong className="text-stone-900">{activeSopCard?.processOwner}</strong> in the Work Queue.
            </p>
            <textarea
              rows={3}
              value={escalateNote}
              onChange={(e) => setEscalateNote(e.target.value)}
              placeholder="What specific question or exception do you need clarified?"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#00635C]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalate}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Run Modal Dialog */}
      {showStartRunModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 w-full max-w-sm shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-[#00635C] font-bold text-sm">
              <Play className="w-4 h-4" />
              <span>Start Active Checklist Run</span>
            </div>
            <p className="text-stone-600 text-xs">
              Spawns an executable procedure run for <strong className="text-stone-900">{activeSopCard?.title}</strong>.
            </p>
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              Property Address / Transaction:
            </label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g. 142 Market St, Wilmington NC"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowStartRunModal(false)}
                className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartRun}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Start Run
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
