/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CompactActivityCardBadge — Compact Activity & Contact Preview Badge
 * Rendered on All Tasks cards, Workspace Kanban cards, and Table rows.
 * Shows the newest relevant activity snippet and allows clicking straight into the Activity & Contact tab.
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { CompactActivityInfo, CommunicationStatus } from '../../../server/services/activityHistoryService.js';

export interface CompactActivityCardBadgeProps {
  taskId: string;
  compactActivity?: CompactActivityInfo | null;
  fallbackSummary?: string;
  fallbackTime?: string;
  /** Full timestamp shown on hover (Surface table lock v3). */
  timestampTooltip?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const CompactActivityCardBadge: React.FC<CompactActivityCardBadgeProps> = ({
  taskId,
  compactActivity: initialActivity,
  fallbackSummary,
  fallbackTime,
  timestampTooltip,
  onClick,
  className = ''
}) => {
  const [activity, setActivity] = useState<CompactActivityInfo | null>(initialActivity || null);

  useEffect(() => {
    if (initialActivity) {
      setActivity(initialActivity);
      return;
    }

    let isMounted = true;
    // Lazy-fetch compact activity if not supplied
    fetch(`/api/marketing/tasks/${taskId}/compact-activity`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.compactActivity) {
          setActivity(data.compactActivity);
        }
      })
      .catch(() => {
        // Silently ignore network errors and keep fallback
      });

    return () => {
      isMounted = false;
    };
  }, [taskId, initialActivity]);

  const summary = activity?.latestEventSummary || fallbackSummary || 'Intake recorded';
  const relativeTime = activity?.latestEventRelativeTime || fallbackTime || 'Recently';
  const noraStatus = activity?.latestNoraContactStatus;

  // Visual status pill for NORA outreach if present
  const renderStatusPill = (status?: CommunicationStatus) => {
    if (!status) return null;
    if (status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-sm shrink-0">
          <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
          Blocked
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-sm shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          Delivered
        </span>
      );
    }
    if (status === 'replied') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-sm shrink-0">
          <RotateCcw className="w-2.5 h-2.5 text-teal-600" />
          Replied
        </span>
      );
    }
    if (status === 'drafted') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-sm shrink-0">
          <Clock className="w-2.5 h-2.5 text-amber-600" />
          Drafted
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`group/badge flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-[#E5EFEA]/60 border border-slate-200/80 hover:border-[#00635C]/30 text-xs transition-colors cursor-pointer ${className}`}
      title={timestampTooltip || 'Click to view Activity & Contact History'}
      data-testid="compact-activity-badge"
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Clock className="w-3 h-3 text-slate-400 group-hover/badge:text-[#00635C] shrink-0 transition-colors" />
        <span className="font-semibold text-slate-700 group-hover/badge:text-slate-900 truncate">
          {summary}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {renderStatusPill(noraStatus)}
        <span className="text-[11px] font-medium text-slate-400 group-hover/badge:text-slate-600">
          {relativeTime}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-300 group-hover/badge:text-[#00635C] group-hover/badge:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
