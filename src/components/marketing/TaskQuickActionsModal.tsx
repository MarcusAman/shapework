/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TaskQuickActionsModal
 * High-polish centered modal for rapid task operations, proof inspection, team reassignment, and agent inquiries.
 * Completely eliminates clipping and overflow issues from Kanban column card dropdowns.
 */

import React, { useEffect } from 'react';
import {
  X,
  Layers,
  Bot,
  MessageSquare,
  FileText,
  User,
  Users,
  Archive,
  Clock,
  Phone,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { CanonicalMarketingTask } from '../../../server/persistence/marketingCampaignsRepository';

export interface TaskQuickActionsModalProps {
  isOpen: boolean;
  task: CanonicalMarketingTask | null;
  onClose: () => void;
  onOpenProofWorkstation: (task: CanonicalMarketingTask) => void;
  onOpenTranscriptDetail?: (task: CanonicalMarketingTask) => void;
  onDispatchBrowserAgent?: (task: CanonicalMarketingTask) => void;
  onAskRequester?: (task: CanonicalMarketingTask) => void;
  onAssignTeamMember: (taskId: string, assigneeName: string) => void;
  onArchiveTask: (taskId: string) => void;
  /** 'reassign' = people picker only (from card Reassign). Default full sheet. */
  mode?: 'full' | 'reassign';
}

const TEAM_MEMBERS = [
  { name: 'Melissa Gagliardi', role: 'Marketing Director / Reviewer', avatar: 'MG', color: 'bg-[#00635C] text-white' },
  { name: 'Eduardo Lovo', role: 'Virtual Assistant / Maxa Lead', avatar: 'EL', color: 'bg-purple-700 text-white' },
  { name: 'Ann Gunn', role: 'Operations & Signage Lead', avatar: 'AG', color: 'bg-blue-700 text-white' },
  { name: 'Ryan Crecelius', role: 'Owner', avatar: 'RC', color: 'bg-amber-700 text-white' },
];

export const TaskQuickActionsModal: React.FC<TaskQuickActionsModalProps> = ({
  isOpen,
  task,
  onClose,
  onOpenProofWorkstation,
  onOpenTranscriptDetail,
  onDispatchBrowserAgent,
  onAskRequester,
  onAssignTeamMember,
  onArchiveTask,
  mode = 'full',
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const propertyAddr = task.propertyAddress || task.listingDetails?.address || 'Wilmington NC Area Listing';
  const hasPhotos = task.photos && task.photos.length > 0;
  const photoUrl = hasPhotos ? task.photos[0].url : null;
  const currentAssignee = task.assignedTo || 'Unassigned';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Click Backdrop to close */}
      <div 
        className="fixed inset-0 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 z-10 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5 min-w-0">
            {mode === 'reassign' ? (
              <div
                className="w-12 h-12 rounded-2xl bg-[#00635C]/10 border border-[#00635C]/20 shrink-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <Users className="w-5 h-5 text-[#00635C]" />
              </div>
            ) : hasPhotos && photoUrl ? (
              <img
                src={photoUrl}
                alt={propertyAddr}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl bg-[#003831] border border-[#002823] shrink-0 flex items-center justify-center shadow-xs"
                aria-hidden="true"
              >
                <img src="/nest-realty-logo-white.svg" alt="" className="w-8 object-contain" />
              </div>
            )}

            <div className="min-w-0 space-y-1">
              {mode === 'reassign' ? (
                <>
                  <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-tight">
                    {task.deliverableType || 'Marketing Task'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 truncate" title={propertyAddr}>
                    {propertyAddr}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Reassign ownership · {task.title}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-[#00635C] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {task.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-tight">
                      {task.deliverableType || 'Marketing Task'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate" title={propertyAddr}>
                    {propertyAddr}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {task.title} • Agent: <strong>{task.agentName || 'Agent'}</strong>
                  </p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={mode === 'reassign' ? 'Close Reassign' : 'Close Quick Actions'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode !== 'reassign' && (
        <>
        {/* Primary Action Matrix */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h4>

          {/* 1. Open Maxa Proof Workstation */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProofWorkstation(task);
            }}
            className="w-full p-3.5 bg-purple-50/70 hover:bg-purple-100/90 border border-purple-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span>Open Maxa Proof Assets & Workstation</span>
                  <ExternalLink className="w-3 h-3 text-purple-600" />
                </div>
                <p className="text-[11px] text-purple-700/80 truncate">
                  Inspect staged 300 DPI flyers, social stories, and EDDM postcards.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>

          {/* 2. Dispatch Maxa Autonomous Browser Agent */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onDispatchBrowserAgent) onDispatchBrowserAgent(task);
            }}
            className="w-full p-3.5 bg-emerald-50/70 hover:bg-emerald-100/90 border border-emerald-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#00635C] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Dispatch Nora Autonomous Maxa Agent</span>
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-700/80 truncate">
                  Auto-fill templates, inject verified copy, and render proofs in Maxa.com.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>

          {/* 3. Ask Requester via Nora */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onAskRequester) onAskRequester(task);
            }}
            className="w-full p-3.5 bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span>Ask Requester via Nora Hotline</span>
                  <Phone className="w-3 h-3 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-700/80 truncate">
                  Send automated SMS or email request for missing photos or property details.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </button>

          {/* 4. Full Transcript & Audio Detail */}
          {onOpenTranscriptDetail && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTranscriptDetail(task);
              }}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">
                    Inspect Call Audio & Intake Brief
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    Review synchronized audio playback, speaker dialogue, and listing specs.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5 shrink-0" />
            </button>
          )}
        </div>
        </>
        )}

        {/* Reassign Team Member Section */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>{mode === 'reassign' ? 'Choose who owns this task' : 'Reassign Task Lead'}</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              Current: <strong className="text-slate-800">{currentAssignee}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TEAM_MEMBERS.map((member) => {
              const isAssigned = currentAssignee === member.name;
              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => {
                    onAssignTeamMember(task.id, member.name);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer shadow-2xs ${
                    isAssigned
                      ? 'bg-emerald-50 border-emerald-300 ring-1 ring-[#00635C]'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${member.color} flex items-center justify-center font-bold text-[10px] shrink-0`}>
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {member.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  {isAssigned && (
                    <Check className="w-4 h-4 text-emerald-700 stroke-[3] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Archive & Dismiss */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {mode !== 'reassign' && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onArchiveTask(task.id);
            }}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Task</span>
          </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
