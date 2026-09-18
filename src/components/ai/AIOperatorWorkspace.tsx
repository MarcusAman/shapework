/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Zap, Send, Mic, Link2, AlertTriangle, UserCheck, DollarSign, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../../types/shapework';
import RiskBadge from '../ui/RiskBadge';
import CommandPlanCard from './CommandPlan';

interface AIOperatorWorkspaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isGenerating: boolean;
  onApproveProposal: (proposalId: string) => void;
  onExecuteCommandPlan?: (planId: string) => void;
  onCancelCommandPlan?: (planId: string) => void;
}

export default function AIOperatorWorkspace({
  chatHistory,
  onSendMessage,
  isGenerating,
  onApproveProposal,
  onExecuteCommandPlan,
  onCancelCommandPlan
}: AIOperatorWorkspaceProps) {
  const [inputValue, setInputValue] = useState('');

  const suggestedPrompts = [
    { text: 'What needs my attention before noon?', subtitle: 'Urgent risks & overdue tasks' },
    { text: 'Analyze current revenue at risk', subtitle: 'Detailed financial blockages' },
    { text: 'Evaluate transaction coordinator capacity', subtitle: 'Workload balancing review' },
    { text: 'Review outstanding lender items', subtitle: 'Milestone tracking checks' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col md:flex-row">
      
      {/* Left Column: Interactive Chat Thread */}
      <div className="flex-1 flex flex-col justify-between h-full border-r border-border-subtle bg-secondary-surface/40">
        
        {/* Chat History Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(chatHistory || []).length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-6">
              <div className="w-12 h-12 rounded-full bg-brand-green-soft flex items-center justify-center text-brand-green">
                <Zap className="w-6 h-6 animate-pulse text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-text-primary text-base">Conversational Operational Partner</h3>
                <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                  Query the entire Nest Realty system. Tell me to pull risk files, evaluate coordinator capacity, or draft contingency follow-ups.
                </p>
              </div>

              {/* Grid of suggest questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(p.text)}
                    className="p-3 text-left border border-border-subtle rounded-xl bg-surface hover:bg-brand-green-soft transition-colors text-xs space-y-1"
                  >
                    <span className="font-semibold text-text-primary block">{p.text}</span>
                    <span className="text-[10px] text-text-tertiary block">{p.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] space-y-2">
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                          {isUser ? 'Ann Gunn (Operations Lead)' : 'shapework AI'}
                        </span>
                        <span className="text-[9px] text-text-tertiary font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-brand-green text-white shadow-sm font-medium'
                          : 'bg-surface border border-border-subtle text-text-primary shadow-sm whitespace-pre-wrap'
                      }`}>
                        <p>{msg.text}</p>

                        {/* Interactive UI card inside chat if proposal is present */}
                        {msg.proposal && (
                          <div className="mt-4 p-3 bg-secondary-surface rounded-xl border border-border-subtle text-text-primary space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider">
                                Proposal Object Actionable
                              </span>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-brand-green-soft text-brand-green">
                                {Math.round(msg.proposal.confidence * 100)}% Match
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h5 className="font-bold text-xs">{msg.proposal.title}</h5>
                              <p className="text-[11px] text-text-secondary">{msg.proposal.description}</p>
                            </div>

                            {msg.proposal.draft_content && (
                              <div className="p-2.5 bg-surface border border-border-subtle rounded-lg text-[10px] font-mono text-text-secondary leading-relaxed max-h-36 overflow-y-auto">
                                {msg.proposal.draft_content}
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1 border-t border-border-subtle/50">
                              <button
                                onClick={() => onApproveProposal(msg.proposal!.id)}
                                className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white rounded text-[10px] font-bold transition-colors shadow-sm"
                              >
                                Approve & Dispatch
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Command Plan Execution Checklists */}
                        {msg.commandPlan && (
                          <div className="mt-4 text-text-primary">
                            <CommandPlanCard
                              plan={msg.commandPlan}
                              onExecute={(id) => onExecuteCommandPlan?.(id)}
                              onCancel={(id) => onCancelCommandPlan?.(id)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm text-xs text-text-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
                    <span>Querying Nest Realty database state...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border-subtle bg-surface flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-brand-green-soft rounded-lg transition-colors"
            title="Attach Document"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-brand-green-soft rounded-lg transition-colors"
            title="Voice Command"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask shapework: 'What are the top risk files?' or 'Show me Todd Howard listings'"
            className="flex-1 px-4 py-2 border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-green"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="p-2 bg-brand-green text-white hover:bg-brand-green-hover disabled:bg-stone-300 disabled:text-stone-500 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Column: Active System Reference Context Panel */}
      <div className="w-80 border-t md:border-t-0 md:border-l border-border-subtle flex flex-col p-4 shrink-0 bg-surface justify-between">
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            System Live Diagnostics
          </span>

          <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">AI Core Connection:</span>
              <span className="font-semibold text-status-healthy">Ready</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Indexed Files:</span>
              <span className="font-mono text-text-primary">18 Escrow/Listings</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Communications Sync:</span>
              <span className="font-semibold text-text-primary">Gmail/Twilio Active</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
              Active Context Indicators
            </span>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              When talking with shapework., the AI auto-ports relevant listings, transaction coordinators, and communications matching the subject.
            </p>
          </div>
        </div>

        <div className="p-3 bg-brand-green-soft text-brand-green rounded-xl border border-brand-green/10 flex items-start gap-2.5 text-[11px]">
          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Every chat interaction audits transaction history and updates the secure executive log trail.
          </p>
        </div>
      </div>
    </div>
  );
}
