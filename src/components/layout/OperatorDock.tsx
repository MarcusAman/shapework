/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Mic, Link2, X, RefreshCw, Command } from 'lucide-react';
import { ChatMessage } from '../../types/shapework';
import CommandPlanCard from '../ai/CommandPlan';

interface OperatorDockProps {
  minimized: boolean;
  setMinimized: (min: boolean) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: (msg: string) => void;
  chatHistory: ChatMessage[];
  isGeneratingChat: boolean;
  currentContextProperty: string | null;
  onClearContext?: () => void;
  onExecuteCommandPlan?: (planId: string) => void;
  onCancelCommandPlan?: (planId: string) => void;
  isTableHeavy?: boolean;
}

export default function OperatorDock({
  minimized,
  setMinimized,
  chatInput,
  setChatInput,
  onSendMessage,
  chatHistory,
  isGeneratingChat,
  currentContextProperty,
  onClearContext,
  onExecuteCommandPlan,
  onCancelCommandPlan,
  isTableHeavy = false
}: OperatorDockProps) {
  const suggestedPrompts = [
    'What needs attention before noon?',
    'Show me revenue-at-risk breakdown.',
    'Are coordinators near capacity?',
    'Review outstanding appraisal tasks.'
  ];

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bind keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMinimized(!minimized);
      }
      if (e.key === 'Escape' && !minimized) {
        setMinimized(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [minimized, setMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (!minimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [minimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGeneratingChat) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handlePromptClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  // If minimized, hide the floating button completely
  if (minimized) {
    return null;
  }

  // Expanded Centered Command Palette Overlay Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35 backdrop-blur-xs select-none">
      {/* Dismiss backdrop */}
      <div 
        onClick={() => setMinimized(true)}
        className="absolute inset-0"
      />

      {/* Palette Container */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg bg-surface border border-border-soft rounded-2xl shadow-xl flex flex-col h-[480px] overflow-hidden animate-fade-in text-left z-10 font-sans"
      >
        {/* Header bar */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-soft bg-surface-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-brand-soft border border-brand-900/10">
              <video
                src="/Blue_ai.mp4#t=5,10"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">AI Command Center</span>
              {currentContextProperty ? (
                <span className="text-[9px] text-brand-primary font-semibold flex items-center gap-1 font-mono">
                  Scope: {currentContextProperty}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClearContext) onClearContext();
                    }}
                    className="hover:text-risk-red"
                    title="Clear filter context"
                  >
                    <X className="w-2.5 h-2.5 inline" />
                  </button>
                </span>
              ) : (
                <span className="text-[9px] text-text-tertiary">Accessing organization database</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono bg-stone-100 border border-border-soft/60 px-1.5 py-0.5 rounded text-text-tertiary">
              ESC to close
            </span>
            <button
              onClick={() => setMinimized(true)}
              className="text-text-secondary hover:text-text-primary p-1.5 border border-border-soft rounded-lg hover:bg-surface-subtle transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
          {chatHistory.length === 0 ? (
            <div className="space-y-4 text-left">
              <div className="flex flex-col items-center text-center p-2 space-y-2 border-b border-border-soft pb-4">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-brand-soft border border-brand-primary/10">
                  <video
                    src="/Blue_ai.mp4#t=5,10"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-text-primary">Operational Co-Pilot</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed max-w-[320px]">
                    Ask questions or run scripts against listings status indexes, escrow timelines, or coordinator loads.
                  </p>
                </div>
              </div>

              {/* Specialist Agents Participating list */}
              <div className="p-2.5 bg-stone-50 border border-border-soft rounded-lg text-[10px] text-text-secondary flex justify-between">
                <span>Participating Specialists:</span>
                <span className="font-bold text-brand-primary">AI Coordinator, Email Triage</span>
              </div>

              {/* Suggestions prompt buttons grid */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-text-tertiary uppercase">Suggested Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="p-2 text-left text-[10px] text-text-secondary hover:text-text-primary hover:bg-brand-soft/30 border border-border-soft rounded-lg transition-colors leading-snug font-medium"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Commands and Dry-run */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">RECENT RUNS & DRY-RUNS</span>
                <div className="space-y-1 font-mono text-[9px] text-text-secondary">
                  <div className="flex justify-between hover:text-text-primary cursor-pointer" onClick={() => handlePromptClick('Dry-run: Closing Risk Sweep')}>
                    <span>[ Dry-run ] Closing Risk Sweep</span>
                    <span>Success · 2m ago</span>
                  </div>
                  <div className="flex justify-between hover:text-text-primary cursor-pointer" onClick={() => handlePromptClick('Audit commission splitting splits')}>
                    <span>[ Command ] Audit split splits</span>
                    <span>12 files checked · 1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {chatHistory.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-900 text-white shadow-sm font-semibold'
                        : 'bg-surface-subtle border border-border-soft text-text-primary shadow-soft'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* AI Action Proposal card */}
                    {msg.proposal && (
                      <div className="mt-2.5 p-2.5 bg-surface rounded-xl border border-border-soft text-[10px] text-text-primary space-y-2 shadow-sm">
                        <span className="font-bold text-brand-900 block font-mono">PROPOSED ACTION</span>
                        <span className="block font-semibold">{msg.proposal.title}</span>
                        <span className="text-text-secondary block leading-normal">{msg.proposal.description}</span>
                      </div>
                    )}

                    {/* Attached command plan card */}
                    {msg.commandPlan && (
                      <div className="mt-2.5 text-text-primary">
                        <CommandPlanCard
                          plan={msg.commandPlan}
                          onExecute={(id) => onExecuteCommandPlan?.(id)}
                          onCancel={(id) => onCancelCommandPlan?.(id)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isGeneratingChat && (
                <div className="flex justify-start">
                  <div className="bg-surface-subtle border border-border-soft rounded-xl px-3 py-2 text-xs flex items-center gap-2 shadow-soft font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-900" />
                    <span>Executing operational query...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input box form footer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-border-soft bg-surface-subtle flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-border-soft/60 rounded-lg transition-colors"
            title="Upload Document Attachment"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-border-soft/60 rounded-lg transition-colors"
            title="Record Voice Command"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={currentContextProperty ? `Ask about ${currentContextProperty}...` : "Ask shapework. anything..."}
            className="flex-1 px-3 py-2 text-xs bg-surface border border-border-soft rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-900 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isGeneratingChat}
            className="p-2 bg-brand-900 text-white hover:bg-brand-800 disabled:bg-stone-200 disabled:text-stone-400 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
