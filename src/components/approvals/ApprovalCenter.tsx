/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Edit, Save, Trash, Send } from 'lucide-react';

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
        alert('Action approved and sent successfully.');
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
        alert('Action proposal rejected and dismissed.');
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
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10 text-[#F6F7F1]">
      
      {/* Header */}
      <div 
        className="rounded-2xl p-5 shadow-sm space-y-2 flex justify-between items-center select-none"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h2 className="text-base font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D0D6BB]" />
            <span>Approval Center</span>
          </h2>
          <p className="text-xs text-[#D0D6BB] font-medium font-sans">
            Human-in-the-loop control center. Review, edit, or authorize all proposed agent actions before dispatch.
          </p>
        </div>
        <div className="px-3 py-1 bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)] rounded-xl text-[10px] font-mono text-white font-bold shrink-0">
          {dbApprovals.length} Actions Gated
        </div>
      </div>

      {/* Approvals list */}
      <div className="space-y-4">
        {dbApprovals.map((app: any) => (
          <div 
            key={app.id} 
            className="rounded-[28px] p-6 space-y-4 shadow-xl select-text"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            
            {/* Title / System info */}
            <div className="flex justify-between items-start border-b border-[rgba(246,247,241,0.12)] pb-3 select-none">
              <div>
                <span className="font-mono text-[9px] text-[#D0D6BB] uppercase tracking-wider font-bold block">// GATED OUTBOUND REMINDER</span>
                <h3 className="font-serif font-black text-white text-sm mt-1">{app.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                app.priority === 'critical' 
                  ? 'bg-rose-950/40 text-rose-200 border border-rose-800/60' 
                  : 'bg-amber-950/40 text-amber-250 border border-amber-800/60'
              }`}>
                {app.priority} Risk
              </span>
            </div>

            {/* Explanation grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
              
              <div className="space-y-1">
                <span className="text-[9px] text-[#D0D6BB] uppercase font-bold block select-none">What will happen</span>
                <p className="text-white font-medium">
                  {app.title ? app.title.replace(/^Approve:\s*/, 'Dispatch ') : 'Send secure notification nudge to target recipient.'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-[#D0D6BB] uppercase font-bold block select-none">Recipient & Location</span>
                <p className="text-white font-bold capitalize">
                  {app.recipient_display || app.recipientDisplay || app.relatedLabel || 'Sarah Jenkins'} ({app.channel || 'api'})
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-[#D0D6BB] uppercase font-bold block select-none">Why shapework recommends it</span>
                <p className="text-[#D0D6BB] font-medium">
                  {app.summary || 'Approve outgoing signal before execution.'}
                </p>
              </div>

              <div className="space-y-1 border-t border-[rgba(246,247,241,0.12)] pt-3 md:col-span-3">
                <span className="text-[9px] text-rose-400 uppercase font-bold block select-none">What could go wrong</span>
                <p className="text-[#D0D6BB] leading-relaxed font-medium">
                  {app.what_could_go_wrong || app.whatCouldGoWrong || 'Verify checklist requirements before confirming.'}
                </p>
              </div>

            </div>

            {/* Message payload editor */}
            <div className="bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)] p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center select-none">
                <span className="font-bold text-white text-[10px]">Outbound Outreach Text</span>
                {editingId === app.id ? (
                  <button 
                    onClick={() => handleSaveEdit(app)}
                    className="text-[#D0D6BB] hover:text-white font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStartEdit(app)}
                    className="text-[#D0D6BB]/75 hover:text-white font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                  className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-lg text-xs bg-[#01362D] text-white h-20 focus:outline-none focus:border-emerald-500/50"
                />
              ) : (
                <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium font-serif italic bg-[rgba(246,247,241,0.04)] p-2.5 rounded-lg border border-[rgba(246,247,241,0.08)]">
                  "{app.draft_action_summary || app.draftActionSummary || app.proposedAction || app.recommendedNextAction || 'No draft payload defined.'}"
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2 border-t border-[rgba(246,247,241,0.12)] select-none">
              <button
                onClick={() => handleApprove(app.id)}
                disabled={isProcessing === app.id}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Approve & Dispatch</span>
              </button>
              <button
                onClick={() => handleReject(app.id)}
                disabled={isProcessing === app.id}
                className="px-3.5 py-2 border border-[rgba(246,247,241,0.18)] bg-[rgba(246,247,241,0.08)] hover:bg-[rgba(246,247,241,0.15)] text-white rounded-xl font-bold transition-all cursor-pointer"
              >
                Reject / Dismiss
              </button>
            </div>

          </div>
        ))}
        {dbApprovals.length === 0 && (
          <div 
            className="rounded-2xl p-10 text-center select-none"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60 animate-pulse" />
            <p className="font-bold text-white">No active actions awaiting approval.</p>
            <p className="text-[10px] text-[#D0D6BB] mt-0.5">Outbound reminders are locked and secure.</p>
          </div>
        )}
      </div>

    </div>
  );
}
