import React from 'react';
import { DollarSign, Clock, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import ApprovalControls from '../ui/ApprovalControls';
import { formatCurrency } from '../../utils/formatters';
import ZillowImageWidget from '../ui/ZillowImageWidget';

interface DecisionItem {
  id: string;
  title: string;
  description: string;
  financial_impact: number;
  owner: string;
  time_remaining: string;
  why_it_matters: string;
  evidence: string;
  recommended_action: string;
}

interface DecisionQueueProps {
  decisions: DecisionItem[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelegate?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function DecisionQueue({
  decisions,
  onApprove,
  onDismiss,
  onDelegate,
  onEdit
}: DecisionQueueProps) {
  const decList = decisions || [];

  const extractAddress = (title: string, description: string) => {
    if (title.includes(':')) {
      const potential = title.split(':')[1].trim();
      if (/^\d+/.test(potential)) {
        return potential;
      }
    }
    const text = title + " " + description;
    const match = text.match(/(\d+\s+[A-Za-z0-9\s]+(?:Terrace|Terr|St|Street|Rd|Road|Blvd|Boulevard|Lane|Ln|Ave|Avenue|Way|Dr|Drive|Court|Ct|Woodlawn|Pine|Windsor))/i);
    return match ? match[1] : null;
  };

  if (decList.length === 0) {
    return (
      <div className="sw-card p-8 text-center shadow-sm font-sans select-none">
        <h3 className="font-bold text-[var(--sw-text)] text-xs uppercase tracking-wider font-mono">Decision Queue Clear</h3>
        <p className="text-xs text-[var(--sw-muted)] mt-1">No items currently require manual leadership override authorization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left font-sans">
      <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-2 select-none">
        <div>
          <h3 className="text-xs font-mono font-bold text-[var(--sw-text)] uppercase tracking-wider">Decision Intervention Queue</h3>
          <p className="text-xs text-[var(--sw-muted)] mt-0.5 font-serif italic">Pending actions requiring human override authorization.</p>
        </div>
        <span className="bg-[var(--sw-risk)]/10 border border-[var(--sw-risk)]/20 text-[var(--sw-risk)] px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
          {decList.length} Outstanding
        </span>
      </div>

      <div className="space-y-4">
        {decList.map((item) => {
          const address = extractAddress(item.title, item.description);
          return (
            <div
              key={item.id}
              className="sw-card p-5 flex flex-col md:flex-row justify-between gap-5 shadow-sm hover:border-[var(--sw-green-700)] transition-all"
            >
              {/* Left Info Panel */}
              <div className="space-y-2.5 flex-1 text-left">
                <div className="flex items-center gap-3 select-none">
                  <span className="font-mono text-[9px] font-bold bg-[var(--sw-card)] border border-[var(--sw-border)] px-2 py-0.5 rounded text-[var(--sw-muted)]">
                    {item.owner.toUpperCase()}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--sw-risk)] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Expiry: {item.time_remaining.toUpperCase()}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[var(--sw-text)] tracking-tight leading-tight uppercase font-mono">{item.title}</h4>
                <p className="text-xs text-[var(--sw-muted)] leading-relaxed">{item.description}</p>
                
                {/* Evidence and Rationale block */}
                <div className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] font-mono text-[10px] text-[var(--sw-muted)] space-y-1.5 rounded-xl">
                  <div>
                    <span className="text-[var(--sw-muted-light)] font-bold uppercase tracking-wider text-[8px] block">Review Rationale:</span>
                    <span className="text-[var(--sw-text)] leading-normal mt-0.5 block">{item.why_it_matters}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--sw-border)]">
                    <span className="text-[var(--sw-muted-light)] font-bold uppercase tracking-wider text-[8px] block">Ingested Evidence:</span>
                    <span className="text-[var(--sw-text)] leading-normal mt-0.5 block">{item.evidence}</span>
                  </div>
                </div>
              </div>

              {/* Right Action panel with embedded location map */}
              <div className="flex flex-col justify-between items-end gap-4 shrink-0 border-t md:border-t-0 md:border-l border-[var(--sw-border)] pt-4 md:pt-0 md:pl-5 min-w-[240px] w-full md:w-auto">
                <div className="text-right w-full">
                  <span className="text-[9px] font-mono text-[var(--sw-muted)] uppercase tracking-wider font-bold block">Commission Value</span>
                  <span className="text-base font-mono font-bold text-[var(--sw-risk)] mt-0.5 block">
                    {formatCurrency(item.financial_impact)}
                  </span>
                </div>

                {/* Embed Zillow photo in the right action panel if address is found */}
                {address && (
                  <div className="w-full text-left space-y-1 select-none my-1 rounded-lg overflow-hidden border border-[var(--sw-border)]">
                    <ZillowImageWidget address={address} height="110px" />
                  </div>
                )}

                <div className="w-full space-y-3 text-left">
                  <div className="text-[10px] font-mono text-[var(--sw-green-700)] font-bold flex items-start gap-1">
                    <span className="shrink-0">► Recommended Action:</span>
                    <span className="underline leading-tight">{item.recommended_action}</span>
                  </div>
                  
                  <ApprovalControls
                    onApprove={() => onApprove(item.id)}
                    onDismiss={() => onDismiss(item.id)}
                    onDelegate={onDelegate ? () => onDelegate(item.id) : undefined}
                    onEdit={onEdit ? () => onEdit(item.id) : undefined}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
