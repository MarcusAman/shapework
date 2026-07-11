import React from 'react';
import { AlertCircle } from 'lucide-react';

interface WaitingOnRole {
  role: string;
  count: number;
  oldest_item: string;
  avg_response: string;
  affected_workflows: number;
  bottleneck_reason: string;
}

export default function WaitingOnPeople() {
  const waitingData: WaitingOnRole[] = [
    {
      role: 'Lenders',
      count: 3,
      oldest_item: '4 days overdue',
      avg_response: '38 hrs',
      affected_workflows: 3,
      bottleneck_reason: 'Underwriter delays at Apex Home Loans'
    },
    {
      role: 'Agents',
      count: 4,
      oldest_item: '2 days overdue',
      avg_response: '14 hrs',
      affected_workflows: 2,
      bottleneck_reason: 'Uploading executed listing initials'
    },
    {
      role: 'Closing Attorneys / Title',
      count: 2,
      oldest_item: '24 hours open',
      avg_response: '8 hrs',
      affected_workflows: 1,
      bottleneck_reason: 'Vance Law scheduling confirmation'
    },
    {
      role: 'Clients',
      count: 1,
      oldest_item: '18 hours open',
      avg_response: '12 hrs',
      affected_workflows: 1,
      bottleneck_reason: 'Arthur Pendragon tax transcripts'
    },
    {
      role: 'Vendors',
      count: 2,
      oldest_item: '48 hours open',
      avg_response: '24 hrs',
      affected_workflows: 1,
      bottleneck_reason: 'Photographer schedule delay'
    }
  ];

  return (
    <div className="sw-card p-5 space-y-4 text-left font-sans select-none shadow-sm">
      <div>
        <h3 className="text-xs font-mono font-bold text-[var(--sw-text)] uppercase tracking-wider">Pending Bottlenecks</h3>
        <p className="text-xs text-[var(--sw-muted)] mt-0.5 font-serif italic">Stakeholder delay times categorized by external role.</p>
      </div>

      <div className="border border-[var(--sw-border)] divide-y divide-[var(--sw-border)] bg-[var(--sw-card)] overflow-hidden text-xs font-mono rounded-xl">
        {/* Table header */}
        <div className="grid grid-cols-5 p-3 text-[9px] uppercase font-bold text-[var(--sw-muted)] tracking-wider bg-[var(--sw-bg-soft)]">
          <div>Stakeholder</div>
          <div>Items Pending</div>
          <div>Max Wait</div>
          <div>Avg Response Time</div>
          <div>Current Block Reason</div>
        </div>
        
        {/* Rows */}
        {waitingData.map((item, idx) => (
          <div key={idx} className="grid grid-cols-5 p-3 items-center hover:bg-[var(--sw-surface)] transition-all border-b border-[var(--sw-border)] last:border-b-0">
            <div className="font-sans font-bold text-[var(--sw-text)]">{item.role}</div>
            <div className="text-[var(--sw-muted)]">{item.count} items</div>
            <div className="text-[var(--sw-risk)] font-bold">{item.oldest_item}</div>
            <div className="text-[var(--sw-muted)]">{item.avg_response}</div>
            <div className="font-sans text-[11px] text-[var(--sw-muted)] leading-snug flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--sw-warning)] shrink-0" />
              <span className="truncate" title={item.bottleneck_reason}>{item.bottleneck_reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
