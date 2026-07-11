import React from 'react';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { CapacityMetric } from '../../types/shapework';

interface TeamCapacityProps {
  metrics: CapacityMetric[];
  onTriggerReassignment: (coordinator: string, suggestion: string) => void;
}

export default function TeamCapacity({
  metrics,
  onTriggerReassignment
}: TeamCapacityProps) {
  return (
    <div className="sw-card p-5 space-y-4 text-left font-sans select-none shadow-sm">
      <div>
        <h3 className="text-xs font-mono font-bold text-[var(--sw-text)] uppercase tracking-wider">Team Load & Resource Capacity</h3>
        <p className="text-xs text-[var(--sw-muted)] mt-0.5 font-serif italic">Coordinator load percentages and automated load rebalancing suggestions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metrics.map((member, idx) => {
          const isHighCapacity = member.capacity_percentage >= 85;
          return (
            <div
              key={idx}
              className={`p-4 border font-mono text-xs flex flex-col justify-between space-y-4 transition-all rounded-2xl text-left ${
                isHighCapacity
                  ? 'bg-[var(--sw-risk)]/5 border-[var(--sw-risk)]/25'
                  : 'bg-[var(--sw-card)] border-[var(--sw-border)]'
              }`}
            >
              {/* Coordinator Name & Capacity */}
              <div className="flex justify-between items-start text-left">
                <div>
                  <h4 className="font-sans font-bold text-[var(--sw-text)] text-sm leading-none">{member.coordinator_name}</h4>
                  <span className="text-[8px] uppercase tracking-wider text-[var(--sw-muted-light)] mt-1 block">Transaction Coordinator</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-base font-bold font-mono ${isHighCapacity ? 'text-[var(--sw-risk)]' : 'text-[var(--sw-green-700)]'}`}>
                    {member.capacity_percentage}%
                  </span>
                  <span className="text-[8px] text-[var(--sw-muted-light)] uppercase tracking-wider block">Capacity Load</span>
                </div>
              </div>

              {/* Grid of stats */}
              <div className="grid grid-cols-3 gap-1 text-center py-2.5 border-t border-b border-[var(--sw-border)]">
                <div>
                  <span className="text-[8px] text-[var(--sw-muted)] block uppercase">Files</span>
                  <strong className="text-[var(--sw-text)] text-xs font-bold block mt-0.5">{member.assigned_work}</strong>
                </div>
                <div>
                  <span className="text-[8px] text-[var(--sw-muted)] block uppercase">Overdue</span>
                  <strong className={`text-xs font-bold block mt-0.5 ${member.overdue_items > 0 ? 'text-[var(--sw-risk)]' : 'text-[var(--sw-muted)]'}`}>
                    {member.overdue_items}
                  </strong>
                </div>
                <div>
                  <span className="text-[8px] text-[var(--sw-muted)] block uppercase">Avg Res</span>
                  <strong className="text-[var(--sw-text)] text-xs font-bold block mt-0.5">{member.avg_resolution_time.split(' ')[0]}m</strong>
                </div>
              </div>

              {/* Recommendation row if high capacity */}
              {isHighCapacity && member.suggested_reassignment ? (
                <div className="p-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] space-y-2 rounded-xl text-left">
                  <div className="flex items-center gap-1.5 text-[var(--sw-risk)] font-bold text-[9px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reallocation Required</span>
                  </div>
                  <p className="font-sans text-[11px] text-[var(--sw-muted)] leading-normal">{member.suggested_reassignment}</p>
                  <button
                    onClick={() => onTriggerReassignment(member.coordinator_name, member.suggested_reassignment || '')}
                    className="w-full py-1.5 bg-[var(--sw-risk)] hover:bg-red-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Execute Reallocation
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-[var(--sw-surface)] border border-[var(--sw-border)] text-[9px] text-[var(--sw-muted)] leading-normal flex items-start gap-1 rounded-xl text-left">
                  <UserCheck className="w-3.5 h-3.5 text-[var(--sw-success)] shrink-0 mt-0.5" />
                  <span>✓ Load status: available</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
