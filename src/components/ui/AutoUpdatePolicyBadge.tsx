/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, ShieldAlert, CheckCircle, AlertTriangle, EyeOff } from 'lucide-react';

interface AutoUpdatePolicyBadgeProps {
  status: 'processing' | 'matched' | 'low_confidence' | 'needs_approval' | 'auto_updated' | 'failed' | 'ignored';
  confidence?: number;
}

export default function AutoUpdatePolicyBadge({ status, confidence }: AutoUpdatePolicyBadgeProps) {
  const confidencePct = confidence ? `${Math.round(confidence * 100)}%` : '';

  switch (status) {
    case 'auto_updated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-healthy-soft text-status-healthy border border-status-healthy/10">
          <Zap className="w-3 h-3" />
          <span>Auto-Updated ({confidencePct})</span>
        </span>
      );
    case 'needs_approval':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-attention-soft text-status-attention border border-status-attention/15 animate-pulse">
          <ShieldAlert className="w-3 h-3" />
          <span>Needs Approval ({confidencePct})</span>
        </span>
      );
    case 'low_confidence':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          <span>Low Confidence ({confidencePct})</span>
        </span>
      );
    case 'matched':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">
          <CheckCircle className="w-3 h-3" />
          <span>Matched</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-status-atrisk-soft text-status-atrisk border border-status-atrisk/15">
          <AlertTriangle className="w-3 h-3" />
          <span>Failed Ingest</span>
        </span>
      );
    case 'ignored':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
          <EyeOff className="w-3 h-3" />
          <span>Ignored</span>
        </span>
      );
    case 'processing':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-250 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-ping" />
          <span>Processing...</span>
        </span>
      );
  }
}
