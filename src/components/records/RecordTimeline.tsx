import React from 'react';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { safeLower } from '../../utils/string';

interface RecordTimelineProps {
  recordType: string;
  recordId: string;
  state: any;
}

export default function RecordTimeline({
  recordType,
  recordId,
  state
}: RecordTimelineProps) {
  const { auditEvents = [] } = state;

  // Filter audit events that relate to this record (matching recordId or address)
  const relatedAudits = (auditEvents || []).filter((audit: any) => {
    if (!audit) return false;
    const target = safeLower(audit.target_record);
    const id = safeLower(recordId);
    return target.includes(id) || id.includes(target) || safeLower(audit.action_description).includes(id);
  });

  return (
    <div className="space-y-3 font-sans text-left">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Ledger History Timeline</span>
      
      {relatedAudits.length > 0 ? (
        <div className="relative border-l border-border-subtle pl-4.5 ml-2.5 space-y-4 py-1">
          {relatedAudits.map((audit: any, index: number) => (
            <div key={audit.id || index} className="relative text-xs space-y-1">
              {/* Bullet circle */}
              <div className="w-2.5 h-2.5 rounded-full bg-brand-green absolute -left-[23.5px] top-1 border-2 border-surface shadow-sm" />
              
              <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono">
                <span>{new Date(audit.timestamp).toLocaleDateString()} {new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-semibold">{audit.user_name}</span>
              </div>
              
              <h5 className="font-bold text-text-primary leading-tight">
                {audit.action_description}
              </h5>

              {audit.metadata && (
                <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary bg-secondary-surface border border-border-subtle/50 px-2 py-1 rounded-lg w-max max-w-full">
                  <span className="truncate">{audit.metadata.before_value}</span>
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-bold text-brand-green truncate">{audit.metadata.after_value}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 border border-border-subtle bg-secondary-surface/40 rounded-2xl text-center text-[11px] text-text-tertiary">
          No ledger audits found matching this transaction. All states currently verified.
        </div>
      )}
    </div>
  );
}
