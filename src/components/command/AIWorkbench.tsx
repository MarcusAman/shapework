import React from 'react';
import { Sparkles, Mail, ShieldAlert, FileText } from 'lucide-react';
import { AIActionProposal } from '../../types/shapework';
import ApprovalControls from '../ui/ApprovalControls';

interface AIWorkbenchProps {
  proposals: AIActionProposal[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewEvidence: (proposal: AIActionProposal) => void;
}

export default function AIWorkbench({
  proposals,
  onApprove,
  onDismiss,
  onViewEvidence
}: AIWorkbenchProps) {
  // Group proposals by state
  const awaitingApproval = (proposals || []).filter((p) => p && (p.state === 'awaiting_approval' || p.state === 'suggested'));
  const completedToday = (proposals || []).filter((p) => p && (p.state === 'approved' || p.state === 'completed'));
  
  return (
    <div className="sw-card p-5 space-y-4 text-left font-sans">
      <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-2 select-none">
        <div>
          <h3 className="text-xs font-mono font-bold text-[var(--sw-text)] uppercase tracking-wider">AI Operations Workspace</h3>
          <p className="text-xs text-[var(--sw-muted)] mt-0.5 font-serif italic">Automated drafts prepared by background sweep agents.</p>
        </div>
        <span className="bg-[var(--sw-mint-100)] text-[var(--sw-green-900)] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[var(--sw-green-700)]/20 flex items-center gap-1 font-mono uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[var(--sw-green-900)]" />
          <span>{awaitingApproval.length} Pending</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        
        {/* Left Col: Ready for Approval (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-3 text-left">
          <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">
            Awaiting Compliance Sync ({awaitingApproval.length})
          </span>
          
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {awaitingApproval.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl space-y-3.5 hover:border-[var(--sw-green-700)] transition-all text-left"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {p.action_type === 'draft_email' ? (
                      <Mail className="w-4 h-4 text-[var(--sw-muted)]" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-[var(--sw-risk)]" />
                    )}
                    <span className="font-bold text-xs text-[var(--sw-text)] uppercase font-mono">{p.title}</span>
                  </div>
                  <span className="text-[9px] font-bold text-[var(--sw-success)] bg-[var(--sw-mint-100)] border border-[var(--sw-green-700)]/10 px-2 py-0.5 rounded-full">
                    Confidence: {Math.round(p.confidence * 100)}%
                  </span>
                </div>

                <p className="text-xs text-[var(--sw-muted)] leading-relaxed font-sans">{p.description}</p>

                <div className="flex flex-wrap gap-1.5 select-none">
                  <span className="px-1.5 py-0.5 bg-[var(--sw-card)] border border-[var(--sw-border)] text-[var(--sw-warning)] text-[9px] font-bold uppercase tracking-wider rounded-md">
                    Approval Required
                  </span>
                  <span className="px-1.5 py-0.5 bg-[var(--sw-card)] border border-[var(--sw-border)] text-[var(--sw-green-700)] text-[9px] font-bold uppercase tracking-wider rounded-md">
                    External Draft
                  </span>
                </div>
                
                <div className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] text-[10px] text-[var(--sw-muted)] space-y-1 leading-normal rounded-xl">
                  <div>• Source: Email Signals Processed</div>
                  <div>• Param: Address match mapping threshold validation</div>
                </div>

                {p.draft_content && (
                  <div className="p-3 bg-[var(--sw-surface)] text-[var(--sw-muted)] text-[10px] border border-[var(--sw-border)] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto rounded-xl text-left font-sans">
                    <div className="text-[var(--sw-green-700)] pb-1.5 border-b border-[var(--sw-border)] mb-2 uppercase text-[8px] tracking-widest font-bold select-none font-mono">
                      Outbound Mail Packet
                    </div>
                    {p.draft_content}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-[var(--sw-border)]">
                  <button
                    onClick={() => onViewEvidence(p)}
                    className="text-[9px] font-bold text-[var(--sw-green-700)] hover:text-[var(--sw-green-900)] hover:underline flex items-center gap-1 uppercase cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ingested Evidence Logs</span>
                  </button>

                  <ApprovalControls
                    onApprove={() => onApprove(p.id)}
                    onDismiss={() => onDismiss(p.id)}
                  />
                </div>
              </div>
            ))}
            {awaitingApproval.length === 0 && (
              <p className="text-xs text-[var(--sw-muted)] italic p-8 text-center bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl">
                All drafted items have been successfully actioned.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Completed/Executing */}
        <div className="space-y-3 lg:border-l lg:border-[var(--sw-border)] lg:pl-5 text-left">
          <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">
            Sync History ({completedToday.length})
          </span>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {completedToday.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl space-y-1.5 flex justify-between items-center"
              >
                <div className="truncate pr-2">
                  <div className="font-bold text-[var(--sw-text)] truncate">{p.title}</div>
                  <div className="text-[9px] text-[var(--sw-muted)]">Dispatched to gateway</div>
                </div>
                <span className="text-[9px] uppercase font-bold text-[var(--sw-success)] bg-[var(--sw-mint-100)] border border-[var(--sw-green-700)]/15 px-2 py-0.5 rounded-full shrink-0">
                  OK
                </span>
              </div>
            ))}
            {completedToday.length === 0 && (
              <p className="text-xs text-[var(--sw-muted)] italic p-8 text-center bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl">
                No automated workflows executed yet today.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
