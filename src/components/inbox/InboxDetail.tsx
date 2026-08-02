/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, MessageSquare, Paperclip, Zap, CheckCircle, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';
import { Communication } from '../../types/shapework';
import ChannelBadge from '../ui/ChannelBadge';
import SourceBadge from '../ui/SourceBadge';
import ApprovalControls from '../ui/ApprovalControls';

interface InboxDetailProps {
  item: Communication | null;
  onApproveAction: (id: string) => void;
  onDismissAction: (id: string) => void;
}

export default function InboxDetail({
  item,
  onApproveAction,
  onDismissAction
}: InboxDetailProps) {
  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8 bg-secondary-surface h-full">
        <div className="max-w-xs space-y-2">
          <Mail className="w-8 h-8 text-text-tertiary mx-auto opacity-40 animate-pulse" />
          <h4 className="font-serif font-bold text-text-primary text-sm">No Message Selected</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Select an inbox event to inspect the message text, extracted metadata, and AI recommended checklist items.
          </p>
        </div>
      </div>
    );
  }

  // Find if there is an active proposal linked to this inbox message
  const hasProposal = item.action_proposal_id !== undefined && item.status !== 'completed';

  return (
    <div className="flex-1 flex flex-col h-full bg-surface">
      {/* Header bar info */}
      <div className="p-4 border-b border-border-subtle shrink-0 bg-secondary-surface flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-xs text-text-primary">{item.subject ?? 'No Subject'}</h3>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Sender: <span className="font-bold">{item.sender ?? 'Unknown'}</span> ({item.sender_email ?? 'No email'})
          </p>
        </div>
        <div className="flex gap-2">
          <SourceBadge source={item.source_system || 'gmail'} />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-green-soft text-brand-green border border-brand-green/10">
            {Math.round((item.confidence ?? 0.8) * 100)}% Match
          </span>
        </div>
      </div>

      {/* Main split-screen scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Stepwise AI Extraction Flow pipeline (Visual mapping) */}
        <div className="p-4 bg-brand-green-soft/30 border border-brand-green/10 rounded-xl space-y-3">
          <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block">
            AI Operating Layer Pipeline
          </span>
          <div className="grid grid-cols-5 gap-2 text-center text-[9px] text-text-secondary relative font-medium">
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">1</span>
              <span className="mt-1 font-semibold text-text-primary">Ingested</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">2</span>
              <span className="mt-1 font-semibold text-text-primary">Matched File</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">3</span>
              <span className="mt-1 font-semibold text-text-primary">Intent Found</span>
            </div>
            <div className="flex flex-col items-center text-status-attention">
              <span className="w-5 h-5 rounded-full bg-status-attention text-white flex items-center justify-center font-bold animate-pulse">4</span>
              <span className="mt-1 font-semibold">Action Drafted</span>
            </div>
            <div className="flex flex-col items-center text-text-tertiary">
              <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center font-bold">5</span>
              <span className="mt-1">Dispatched</span>
            </div>
          </div>
        </div>

        {/* Selected Message body */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Message Content</span>
          <div className="bg-stone-50 border border-border-subtle rounded-xl p-4 text-xs leading-relaxed text-text-primary whitespace-pre-wrap font-sans">
            {item.body}
          </div>
        </div>

        {/* AI Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Extracted Intent */}
          <div className="p-3.5 bg-surface border border-border-subtle rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Extracted Intent</span>
            <p className="text-xs text-text-primary font-medium">{item.intent ?? 'No intent identified'}</p>
            <div className="flex justify-between items-center text-[10px] text-text-secondary pt-2 border-t border-border-subtle/40">
              <span>Property:</span>
              <span className="font-semibold text-text-primary">{item.related_property ?? 'Unspecified Property'}</span>
            </div>
          </div>

          {/* Commitment & Deadline */}
          <div className="p-3.5 bg-surface border border-border-subtle rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Commitment / Deadline</span>
            <p className="text-xs text-status-atrisk font-mono font-bold">{item.commitment_deadline || 'No deadline detected'}</p>
            <div className="flex justify-between items-center text-[10px] text-text-secondary pt-2 border-t border-border-subtle/40">
              <span>Agent Partner:</span>
              <span className="font-semibold text-text-primary">{item.related_agent ?? 'Unassigned Agent'}</span>
            </div>
          </div>
        </div>

        {/* Suggested Workflow Update */}
        <div className="p-3.5 bg-surface border border-border-subtle rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Suggested Workflow Milestone Update</span>
          <p className="text-xs text-text-secondary font-medium leading-relaxed">
            {item.suggested_workflow_update ?? 'No workflow updates suggested'}
          </p>
        </div>

        {/* Recommended Action & Approve Controls */}
        {hasProposal && (
          <div className="p-4 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-brand-green font-bold text-xs">
              <Zap className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>Recommended Operational Response Action</span>
            </div>
            
            <p className="text-xs text-text-primary leading-relaxed font-semibold">
              {item.recommended_action ?? 'No operational action proposed'}
            </p>

            {item.original_message && (
              <div className="p-3 bg-surface border border-border-subtle rounded-lg text-[11px] font-mono text-text-secondary max-h-36 overflow-y-auto leading-relaxed">
                {item.original_message}
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[10px] text-text-tertiary italic">Requires operational check</span>
              <ApprovalControls
                onApprove={() => onApproveAction(item.id)}
                onDismiss={() => onDismissAction(item.id)}
              />
            </div>
          </div>
        )}

        {/* Completed status state */}
        {!hasProposal && item.status === 'completed' && (
          <div className="p-4 bg-status-healthy-soft text-status-healthy rounded-xl border border-status-healthy/10 flex items-center gap-2 text-xs">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold">Action Completed</span>
              <span className="text-text-secondary text-[11px] mt-0.5">Approved & synchronized to transaction record by Marcus Aman.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
