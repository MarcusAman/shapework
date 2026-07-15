/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, User, Calendar, Info, ShieldAlert } from 'lucide-react';

export interface RechatWritebackDetails {
  actionType: string;
  recordId: string;
  recordType: string;
  recordTitle: string;
  taskTitle: string;
  taskDescription: string;
  assigneeName: string;
  dueDate: string;
  whyRecommends: string;
  evidence: string;
}

interface RechatWritebackPreviewProps {
  writeback: RechatWritebackDetails;
}

export default function RechatWritebackPreview({ writeback }: RechatWritebackPreviewProps) {
  return (
    <div className="space-y-3.5 bg-stone-950 border border-stone-800 p-4 rounded-2xl text-stone-300 font-sans text-xs">
      {/* Badge Header */}
      <div className="flex items-center gap-1.5 text-brand-soft font-mono text-[8px] uppercase tracking-widest border-b border-stone-800 pb-2">
        <Database className="w-3.5 h-3.5 text-brand-primary" />
        <span>Outbound Rechat Integration Gated Action</span>
      </div>

      {/* Target Record Info */}
      <div className="space-y-1">
        <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Affected Rechat File</span>
        <div className="flex items-center gap-1.5 font-bold text-stone-100">
          <span>{writeback.recordType}:</span>
          <span className="underline">{writeback.recordTitle}</span>
          <span className="text-[8px] font-mono text-stone-500">({writeback.recordId})</span>
        </div>
      </div>

      {/* Task Specifics */}
      <div className="grid grid-cols-2 gap-3 bg-stone-900/50 p-2.5 rounded-lg border border-stone-900">
        <div>
          <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Action Type</span>
          <span className="font-bold text-stone-200 text-[10px] block mt-0.5">{writeback.actionType}</span>
        </div>
        <div>
          <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Assignee</span>
          <span className="font-bold text-stone-200 text-[10px] flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-stone-400" />
            <span>{writeback.assigneeName}</span>
          </span>
        </div>
        <div>
          <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Task Title</span>
          <span className="font-bold text-stone-200 text-[10px] block mt-0.5">{writeback.taskTitle}</span>
        </div>
        <div>
          <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Due Date</span>
          <span className="font-bold text-brand-soft text-[10px] flex items-center gap-1 mt-0.5 font-mono">
            <Calendar className="w-3 h-3 text-brand-primary" />
            <span>{writeback.dueDate}</span>
          </span>
        </div>
      </div>

      {/* Task Description */}
      <div className="space-y-1 bg-stone-900 p-2.5 rounded-lg border border-stone-900">
        <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider block font-mono">Task Description</span>
        <p className="text-stone-300 text-[10px] leading-relaxed">{writeback.taskDescription}</p>
      </div>

      {/* Why Shapework recommends it */}
      <div className="space-y-1 p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-300/90">
        <div className="flex items-center gap-1.5 text-[8px] font-mono font-bold uppercase tracking-wider">
          <Info className="w-3 h-3 text-amber-500" />
          <span>Why shapework. recommends this</span>
        </div>
        <p className="text-[10px] leading-relaxed mt-0.5">{writeback.whyRecommends}</p>
      </div>

      {/* Ingested Evidence */}
      <div className="space-y-1 p-2.5 bg-stone-900/30 border border-stone-800/40 rounded-lg">
        <div className="flex items-center gap-1.5 text-[8px] font-mono font-bold uppercase tracking-wider text-stone-400">
          <ShieldAlert className="w-3 h-3 text-stone-500" />
          <span>Ingested Telemetry Evidence</span>
        </div>
        <p className="text-[10px] text-stone-400 leading-relaxed mt-0.5 font-mono">{writeback.evidence}</p>
      </div>
    </div>
  );
}
