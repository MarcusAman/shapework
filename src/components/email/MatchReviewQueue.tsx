/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Check, AlertTriangle, ShieldCheck, XCircle, Search, UserCheck, ArrowRight, UserPlus, Info } from 'lucide-react';
import { EmailMessage } from '../../types/shapework';

interface MatchReviewQueueProps {
  messages: EmailMessage[];
  onProcessMessage: (id: string, selectProperty?: string) => void;
  onRejectMessage?: (id: string) => void;
}

export default function MatchReviewQueue({
  messages = [],
  onProcessMessage,
  onRejectMessage
}: MatchReviewQueueProps) {
  
  // Filter messages that need manual match review (low_confidence or needs_approval)
  const reviewMessages = messages.filter(
    m => m.status === 'low_confidence' || m.status === 'needs_approval'
  );

  const [selectedMsgId, setSelectedMsgId] = useState<string>(
    reviewMessages[0]?.id || ''
  );
  
  const [differentPropertyInput, setDifferentPropertyInput] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  const selectedMsg = reviewMessages.find(m => m.id === selectedMsgId);

  const handleApprove = () => {
    if (!selectedMsg) return;
    onProcessMessage(selectedMsg.id);
    // Auto select next item in queue
    const nextMsg = reviewMessages.find(m => m.id !== selectedMsg.id);
    if (nextMsg) {
      setSelectedMsgId(nextMsg.id);
    }
  };

  const handleChooseDifferent = (property: string) => {
    if (!selectedMsg) return;
    onProcessMessage(selectedMsg.id, property);
    setShowPropertyPicker(false);
    setDifferentPropertyInput('');
  };

  const handleIgnore = () => {
    if (!selectedMsg) return;
    if (onRejectMessage) {
      onRejectMessage(selectedMsg.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left List of review queue */}
      <div className="lg:col-span-1 bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-sm max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Match Review Queue</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-status-attention-soft text-status-attention font-mono">
            {reviewMessages.length} pending
          </span>
        </div>

        {reviewMessages.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary leading-relaxed space-y-2">
            <ShieldCheck className="w-8 h-8 text-brand-green mx-auto opacity-40" />
            <p className="font-semibold text-text-primary">Match Review Queue Clear</p>
            <p>No low-confidence email signals require human review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviewMessages.map((msg) => {
              const isSelected = msg.id === selectedMsgId;
              const isLowConf = msg.status === 'low_confidence';
              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMsgId(msg.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-brand-green bg-brand-green-soft/20 shadow-sm'
                      : 'border-border-subtle bg-surface hover:bg-secondary-surface'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-bold text-text-primary truncate">
                      {msg.sender}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${
                      isLowConf ? 'bg-status-attention-soft text-status-attention' : 'bg-status-danger-soft text-status-danger'
                    }`}>
                      {Math.round(msg.confidence * 100)}% Conf
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary truncate font-medium">
                    {msg.subject}
                  </p>
                  <div className="flex justify-between items-center text-[9px] text-text-tertiary mt-1 border-t border-border-subtle/30 pt-1.5 font-mono">
                    <span>{msg.intent}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Detail Pane */}
      <div className="lg:col-span-2 space-y-6">
        {selectedMsg ? (
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-6 text-left">
            {/* Header info */}
            <div className="flex justify-between items-center pb-4 border-b border-border-subtle/60">
              <div>
                <h3 className="font-serif font-bold text-sm text-text-primary">
                  Reviewing Signal: {selectedMsg.intent}
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Extracted from email inbox at {new Date(selectedMsg.received_at).toLocaleTimeString()}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-secondary-surface border border-border-subtle text-text-secondary font-mono">
                ID: {selectedMsg.id}
              </span>
            </div>

            {/* Ingested Email body */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Ingested Email</span>
              <div className="p-4 bg-secondary-surface border border-border-subtle rounded-xl text-xs space-y-3 leading-relaxed text-text-primary">
                <div className="grid grid-cols-6 gap-1 font-mono text-[10px] text-text-secondary pb-2 border-b border-border-subtle/40">
                  <span className="col-span-1 font-bold">From:</span>
                  <span className="col-span-5">{selectedMsg.sender} ({selectedMsg.sender_email})</span>
                  <span className="col-span-1 font-bold">Subject:</span>
                  <span className="col-span-5">{selectedMsg.subject}</span>
                </div>
                <p className="whitespace-pre-wrap font-sans text-xs">{selectedMsg.body}</p>
              </div>
            </div>

            {/* Matching Engine Recommendation */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">AI Match Analysis</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proposed target */}
                <div className="p-3.5 bg-brand-green-soft/30 border border-brand-green/10 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block">Proposed Target Property</span>
                  <p className="text-xs font-semibold text-text-primary">
                    {selectedMsg.matched_property}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Matched based on: <span className="font-semibold text-text-primary">{selectedMsg.evidence}</span>
                  </p>
                </div>

                {/* Proposed action */}
                <div className="p-3.5 bg-brand-green-soft/30 border border-brand-green/10 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block">Proposed Action Update</span>
                  <p className="text-xs font-semibold text-text-primary font-mono text-status-atrisk">
                    {selectedMsg.stage_update ? `Move Stage: ${selectedMsg.stage_update}` : 'Draft follow-up action'}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Recommendation: <span className="font-medium text-text-primary">{selectedMsg.recommended_action}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Verification notes / warnings */}
            <div className="p-3.5 bg-status-attention-soft/50 border border-status-attention/10 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-status-attention shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-text-primary leading-normal">
                <span className="font-bold">Human Verification Required</span>
                <p className="text-text-secondary text-[11px]">
                  NLP classifier confidence is <span className="font-bold">{Math.round(selectedMsg.confidence * 100)}%</span>.
                  {selectedMsg.status === 'low_confidence' 
                    ? ' Multiple matching property addresses were found in listing databases. Confirm property before dispatching task updates.'
                    : ' This contains sensitive transaction clauses (contract adjustment or property inspection structural failures). Please review before syncing changes.'
                  }
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-border-subtle/60 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Match & Sync</span>
                </button>
                
                <button
                  onClick={() => setShowPropertyPicker(!showPropertyPicker)}
                  className="flex items-center gap-1.5 border border-border-subtle rounded-lg bg-surface hover:bg-secondary-surface text-text-secondary hover:text-text-primary px-3 py-2 text-xs font-semibold transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Choose Different Property</span>
                </button>

                <button
                  onClick={handleIgnore}
                  className="flex items-center gap-1.5 border border-border-subtle rounded-lg bg-surface hover:bg-secondary-surface text-status-danger px-3 py-2 text-xs font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Ignore Signal</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="text-[10px] text-text-tertiary hover:text-text-secondary underline"
                >
                  Create Compliance Task
                </button>
                <span className="text-text-tertiary text-[10px]">•</span>
                <button
                  onClick={handleIgnore}
                  className="text-[10px] text-text-tertiary hover:text-text-secondary underline"
                >
                  Escalate to Broker
                </button>
              </div>
            </div>

            {/* Floating property search popup panel */}
            {showPropertyPicker && (
              <div className="p-4 bg-secondary-surface border border-border-subtle rounded-xl flex items-center gap-2 mt-4 transition-all">
                <input
                  type="text"
                  value={differentPropertyInput}
                  onChange={(e) => setDifferentPropertyInput(e.target.value)}
                  placeholder="Enter property address (e.g. 102 Pine St)..."
                  className="flex-1 px-3 py-1.5 border border-border-subtle rounded-lg text-xs focus:outline-none bg-surface"
                />
                <button
                  onClick={() => handleChooseDifferent(differentPropertyInput)}
                  className="bg-brand-green text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Submit
                </button>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-surface border border-border-subtle rounded-2xl p-8 shadow-sm text-center text-xs text-text-secondary leading-relaxed">
            Select a transaction communication matching anomaly on the left to verify.
          </div>
        )}
      </div>
    </div>
  );
}
