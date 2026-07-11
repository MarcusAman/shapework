/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, ArrowRight, Eye } from 'lucide-react';
import { LiveEvent } from '../../data/demoLiveEvents';
import BrandIcon from '../ui/BrandIcon';

interface LiveEventCardProps {
  event: LiveEvent;
  onViewDetails: (event: LiveEvent) => void;
  key?: any;
}

export default function LiveEventCard({ event, onViewDetails }: LiveEventCardProps) {
  const isHighConfidence = event.confidence >= 0.90;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4.5 hover:border-border-strong hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left font-sans shadow-sm">
      
      {/* Left section: Icon, Timing & Event descriptor */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        
        {/* Connection brand avatar */}
        <div className="w-10 h-10 rounded-xl border border-border-subtle bg-secondary-surface flex items-center justify-center shrink-0 shadow-sm">
          <BrandIcon name={event.source} className="w-5.5 h-5.5" />
        </div>

        {/* Content body */}
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-secondary-surface text-text-secondary text-[9px] font-bold font-mono">
              {event.agentName}
            </span>
            {event.riskLevel === 'blocked' && (
              <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold font-mono flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5" />
                Blocked
              </span>
            )}
            {event.riskLevel === 'at_risk' && (
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold font-mono">
                At Risk
              </span>
            )}
          </div>

          <h4 className="font-bold text-xs text-text-primary leading-tight truncate">
            {event.trigger}
          </h4>

          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
            {event.description}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 text-[10px] text-text-tertiary font-mono">
            <span>
              Record: <strong className="text-text-secondary">{event.recordName}</strong>
            </span>
            <span>•</span>
            <span>
              Confidence: <strong className={isHighConfidence ? 'text-brand-green' : 'text-status-attention'}>
                {Math.round(event.confidence * 100)}%
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Right section: Handoff indicator & Details CTA */}
      <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between border-t md:border-t-0 border-border-subtle pt-3.5 md:pt-0">
        
        {/* Status display */}
        <div className="text-right">
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider ${
            event.status === 'completed' 
              ? 'bg-brand-green-soft text-brand-green' 
              : event.status === 'needs_approval' 
              ? 'bg-status-attention-soft text-status-attention' 
              : event.status === 'failed' 
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {event.status === 'needs_approval' ? 'Awaiting Human' : event.status}
          </span>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(event)}
          className="flex items-center gap-1 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      </div>

    </div>
  );
}
