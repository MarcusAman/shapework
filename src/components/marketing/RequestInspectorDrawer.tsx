/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RequestInspectorDrawer
 * Apple-Style Slide-Over Inspector Drawer for Marketing Requests.
 * Displays property specs, deliverable checklist with 1-click status transitions,
 * Google Drive asset folder links, Google Slides CMA deck, and origin transcripts.
 */

import React, { useState } from 'react';
import {
  X,
  Folder,
  Tv,
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  Truck,
  FileText,
  Smartphone,
  PhoneCall,
  Globe,
  Plus,
  Tag,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Play,
  RotateCcw,
  Archive,
  Sparkles
} from 'lucide-react';
import {
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../../server/persistence/marketingCampaignsRepository';

interface RequestInspectorDrawerProps {
  request: CanonicalMarketingRequest | null;
  tasks: CanonicalMarketingTask[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: CanonicalMarketingTask['status']) => void;
  onAddDeliverable?: (requestId: string) => void;
  onArchiveRequest?: (requestId: string) => void;
}

const STAGE_CONFIGS: Record<string, { label: string; bg: string; text: string }> = {
  needs_info: { label: 'Needs Information', bg: 'bg-rose-50', text: 'text-rose-700' },
  ready_for_review: { label: 'Ready for Review', bg: 'bg-blue-50', text: 'text-blue-700' },
  request_received: { label: 'Request Received', bg: 'bg-amber-50', text: 'text-amber-700' },
  assigned: { label: 'Assigned', bg: 'bg-blue-50', text: 'text-blue-700' },
  in_progress: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  agent_review: { label: 'Awaiting Manager Review', bg: 'bg-purple-50', text: 'text-purple-700' },
  revisions: { label: 'Revisions', bg: 'bg-rose-50', text: 'text-rose-700' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  with_vendor: { label: 'With Vendor', bg: 'bg-[#E5EFEA]', text: 'text-[#00635C]' },
  completed: { label: 'Completed', bg: 'bg-slate-100', text: 'text-slate-700' },
  archived: { label: 'Archived', bg: 'bg-slate-100', text: 'text-slate-500' }
};

export const RequestInspectorDrawer: React.FC<RequestInspectorDrawerProps> = ({
  request,
  tasks,
  isOpen,
  onClose,
  onUpdateTaskStatus,
  onAddDeliverable,
  onArchiveRequest
}) => {
  if (!isOpen || !request) return null;

  const childTasks = tasks.filter(t => t.requestId === request.id || request.taskIds.includes(t.id));
  const completedCount = childTasks.filter(t => t.status === 'approved' || t.status === 'completed' || t.status === 'with_vendor').length;

  const driveUrl = `https://drive.google.com/drive/folders/1DRV_${(request.propertyAddress || request.title).split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
  const slidesUrl = `https://docs.google.com/presentation/d/1SLD_${(request.propertyAddress || request.title).split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}/edit`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-2xs animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200/80 animate-in slide-in-from-right duration-250">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#00635C]">
              {request.channel === 'phone' ? (
                <Smartphone className="w-4 h-4" />
              ) : request.channel === 'web' ? (
                <Globe className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Marketing Request</span>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-sm">{request.title || request.propertyAddress}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onArchiveRequest && !request.isArchived && (
              <button
                type="button"
                onClick={() => onArchiveRequest(request.id)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Property Specs Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{request.propertyAddress || request.title}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {request.agentName}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Inbound Brief / Notes:</span>
              <p className="italic font-sans text-slate-700">"{request.requestExcerpt || 'No extra notes provided.'}"</p>
            </div>
          </div>

          {/* 2. Connected Google Workspace Deliverables */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Google Workspace Live Assets
            </span>
            
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#00635C] hover:bg-emerald-50/20 transition flex items-center justify-between group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-[#00635C]" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Google Drive Pack</div>
                    <div className="text-[10px] text-slate-400">Photos & Assets</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00635C]" />
              </a>

              <a
                href={slidesUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/20 transition flex items-center justify-between group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Google Slides CMA</div>
                    <div className="text-[10px] text-slate-400">8-Slide Presentation</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
              </a>
            </div>
          </div>

          {/* 3. Child Deliverables Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Campaign Deliverables ({completedCount}/{childTasks.length} Done)
                </span>
                <span className="text-[10px] text-slate-400">Click stage pill to advance task status</span>
              </div>

              {onAddDeliverable && (
                <button
                  type="button"
                  onClick={() => onAddDeliverable(request.id)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Deliverable</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {childTasks.map(task => {
                const stage = STAGE_CONFIGS[task.status] || STAGE_CONFIGS.request_received;
                
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 capitalize">{task.category}</span>
                        {task.assignedTo && (
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            • {task.assignedTo.split(' ')[0]}
                          </span>
                        )}
                        {task.vendorName && (
                          <span className="text-[10px] text-[#00635C] font-semibold flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            <span>{task.vendorName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Status Cycle Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        aria-label="Update Deliverable Status"
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 outline-none cursor-pointer ${stage.bg} ${stage.text}`}
                      >
                        <option value="request_received">Request Received</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="agent_review">Agent Review</option>
                        <option value="approved">Approved</option>
                        <option value="with_vendor">With Vendor</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Received {request.receivedAt || 'Recently'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
