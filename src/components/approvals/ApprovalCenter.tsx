/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Edit, Save, Trash, Send } from 'lucide-react';
import { useToast } from '../ui';

export interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  proposingAgent?: string;
  targetRecord?: string;
  recordType?: string;
  confidence?: number;
  riskLevel?: string;
  policyReason?: string;
  evidence?: string;
  draftContent?: string;
  beforeValue?: string;
  afterValue?: string;
}

interface ApprovalCenterProps {
  state?: any;
}

export default function ApprovalCenter({ state = {} }: ApprovalCenterProps) {
  const { toast } = useToast();
  const {
    approvals = [],
    fetchState,
    activeProfile
  } = state;

  // Load live approvals from DB
  const dbApprovals = approvals.filter((a: any) => 
    a.status === 'pending'
  );

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedActionText, setEditedActionText] = useState<string>('');

  const handleApprove = async (id: string, customText?: string) => {
    setIsProcessing(id);
    try {
      const approval = dbApprovals.find((a: any) => a.id === id);
      const stepId = approval ? (approval.stepId || approval.step_id) : id;
      const res = await fetch(`/api/shapework/jobs/steps/${stepId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });

      if (res.ok) {
        if (fetchState) await fetchState();
        toast.success({ title: 'Approval Sent', description: 'Action approved and sent successfully.' });
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await fetch(`/api/work-items/${id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (res.ok) {
        if (fetchState) await fetchState();
        toast.info({ title: 'Proposal Rejected', description: 'Action proposal rejected and dismissed.' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditedActionText(item.draft_action_summary || item.draftActionSummary || item.proposedAction || item.recommendedNextAction || '');
  };

  const handleSaveEdit = async (item: any) => {
    try {
      await fetch(`/api/work-items/${item.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendedNextAction: editedActionText,
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (fetchState) await fetchState();
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10 text-[var(--sw-text-primary)]">
      
      {/* Header */}
      <div className="rounded-2xl p-5 shadow-xs space-y-2 flex justify-between items-center select-none bg-[var(--sw-surface)] border border-[var(--sw-border)]">
        <div>
          <h2 className="text-base font-bold text-[var(--sw-text-primary)] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--brand-primary)]" />
            <span>Approval Center</span>
          </h2>
          <p className="text-xs text-[var(--sw-text-secondary)] font-medium font-sans mt-0.5">
            Human-in-the-loop control center. Review, edit, or authorize all proposed agent actions before dispatch.
          </p>
        </div>
        <div className="px-3 py-1 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-xl text-[10px] font-mono text-[var(--sw-text-primary)] font-bold shrink-0">
          {dbApprovals.length} Actions Gated
        </div>
      </div>

      {/* Approvals list */}
      <div className="space-y-4">
        {dbApprovals.map((app: any) => (
          <div 
            key={app.id} 
            className="rounded-[20px] p-6 space-y-4 shadow-xs select-text bg-[var(--sw-surface)] border border-[var(--sw-border)]"
          >
            
            {/* Title / System info */}
            <div className="flex justify-between items-start border-b border-[var(--sw-border)] pb-3 select-none">
              <div>
                <span className="font-mono text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider font-bold block">// GATED OUTBOUND REMINDER</span>
                <h3 className="font-bold text-[var(--sw-text-primary)] text-sm mt-1">{app.title}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                app.priority === 'critical' 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {app.priority} Risk
              </span>
            </div>

            {/* Explanation grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
              
              <div className="space-y-1">
                <span className="text-[9px] text-[var(--sw-text-secondary)] uppercase font-bold block select-none">What will happen</span>
                <p className="text-[var(--sw-text-primary)] font-medium">
                  {app.title ? app.title.replace(/^Approve:\s*/, 'Dispatch ') : 'Send secure notification nudge to target recipient.'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-[var(--sw-text-secondary)] uppercase font-bold block select-none">Recipient & Location</span>
                <p className="text-[var(--sw-text-primary)] font-bold capitalize">
                  {app.recipient_display || app.recipientDisplay || app.relatedLabel || 'Sarah Jenkins'} ({app.channel || 'api'})
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-[var(--sw-text-secondary)] uppercase font-bold block select-none">Why shapework recommends it</span>
                <p className="text-[var(--sw-text-secondary)] font-medium">
                  {app.summary || 'Approve outgoing signal before execution.'}
                </p>
              </div>

              <div className="space-y-1 border-t border-[var(--sw-border)] pt-3 md:col-span-3">
                <span className="text-[9px] text-rose-700 uppercase font-bold block select-none">What could go wrong</span>
                <p className="text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                  {app.what_could_go_wrong || app.whatCouldGoWrong || 'Verify checklist requirements before confirming.'}
                </p>
              </div>

            </div>

            {/* Message payload editor */}
            <div className="bg-[var(--sw-canvas)] border border-[var(--sw-border)] p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center select-none">
                <span className="font-bold text-[var(--sw-text-primary)] text-[10px]">Outbound Outreach Text</span>
                {editingId === app.id ? (
                  <button 
                    onClick={() => handleSaveEdit(app)}
                    className="text-[var(--brand-primary)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStartEdit(app)}
                    className="text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </button>
                )}
              </div>
              
              {editingId === app.id ? (
                <textarea
                  value={editedActionText}
                  onChange={(e) => setEditedActionText(e.target.value)}
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg text-xs bg-[var(--sw-surface)] text-[var(--sw-text-primary)] h-20 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              ) : (
                <p className="text-xs text-[var(--sw-text-primary)] leading-relaxed font-medium font-serif italic bg-[var(--sw-surface)] p-2.5 rounded-lg border border-[var(--sw-border)]">
                  "{app.draft_action_summary || app.draftActionSummary || app.proposedAction || app.recommendedNextAction || 'No draft payload defined.'}"
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2 border-t border-[var(--sw-border)] select-none">
              <button
                onClick={() => handleApprove(app.id)}
                disabled={isProcessing === app.id}
                className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Approve & Dispatch</span>
              </button>
              <button
                onClick={() => handleReject(app.id)}
                disabled={isProcessing === app.id}
                className="px-3.5 py-2 border border-[var(--sw-border)] bg-[var(--sw-canvas)] hover:bg-stone-100 text-[var(--sw-text-primary)] rounded-xl font-bold transition-all cursor-pointer text-xs"
              >
                Reject / Dismiss
              </button>
            </div>

          </div>
        ))}
        {dbApprovals.length === 0 && (
          <div className="rounded-2xl p-10 text-center select-none bg-[var(--sw-surface)] border border-[var(--sw-border)] shadow-xs">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-[var(--sw-text-primary)]">No active actions awaiting approval.</p>
            <p className="text-[10px] text-[var(--sw-text-secondary)] mt-0.5">Outbound reminders are locked and secure.</p>
          </div>
        )}
      </div>

    </div>
  );
}
