import React, { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { RyanShieldData, NeedsRyanItem } from './adapters';

interface RyanShieldPageProps {
  data: RyanShieldData;
  onAction?: (action: string, item: NeedsRyanItem) => void | Promise<void>;
}

export default function RyanShieldPage({ data, onAction }: RyanShieldPageProps) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const handleAction = async (action: string, item: NeedsRyanItem) => {
    if (action === 'reviewed') {
      setReviewedIds(prev => new Set([...prev, item.id]));
    }
    if (onAction) {
      await onAction(action, item);
    } else {
      console.log(`Action: ${action} on item: ${item.id}`);
    }
  };

  const activeNeedsRyan = data.needsRyan.filter(i => !reviewedIds.has(i.id));

  const handledExamples = [
    { category: 'Marketing request', handler: 'Melissa Gagliardi', title: 'Marketing' },
    { category: 'Commission question', handler: 'James Fort', title: 'Firm Finance' },
    { category: 'Lockbox issue', handler: 'Ann Gunn', title: 'Operations Director' },
    { category: 'Agent question', handler: 'Jessica', title: 'Broker-in-Charge' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Hero Summary Header */}
      <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-6 shadow-sm">
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">Good morning, Ryan</h1>
        <p className="text-[var(--text-secondary)] text-[15px] mt-1">
          <span className="text-[var(--danger)] font-semibold">{activeNeedsRyan.length} item{activeNeedsRyan.length !== 1 ? 's' : ''}</span> need you. The team handled <span className="text-[var(--accent)] font-semibold">24</span> without you.
        </p>
      </div>

      {/* Metric Rows */}
      <div className="space-y-6">
        {/* Primary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-6 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Needs Ryan</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold text-[var(--text-primary)]">{activeNeedsRyan.length}</span>
              <span className="text-[12px] text-[var(--text-muted)]">escalations pending</span>
            </div>
          </div>
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-6 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Routed for You</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold text-[var(--text-primary)]">24</span>
              <span className="text-[12px] text-[var(--text-muted)]">requests resolved</span>
            </div>
          </div>
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-6 flex flex-col justify-between h-28 shadow-sm">
            <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">At Risk</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-semibold text-[var(--danger)]">1</span>
              <span className="text-[12px] text-[var(--text-muted)]">Past response window</span>
            </div>
          </div>
        </div>

        {/* Secondary Quieter Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 px-6 bg-[var(--surface-mint)] border border-[var(--border-soft)] rounded-[18px] text-[13px]">
          <div>
            <span className="text-[12px] text-[var(--text-secondary)] uppercase block font-medium">Missing Info</span>
            <span className="text-[18px] font-semibold text-[var(--text-primary)]">
              {data.summary?.find(s => s.id === 'missing_info')?.value ?? 2}
            </span>
          </div>
          <div>
            <span className="text-[12px] text-[var(--text-secondary)] uppercase block font-medium">Overdue Items</span>
            <span className="text-[18px] font-semibold text-[var(--text-primary)]">
              {data.summary?.find(s => s.id === 'overdue')?.value ?? 1}
            </span>
          </div>
          <div>
            <span className="text-[12px] text-[var(--text-secondary)] uppercase block font-medium">Ownerless Tasks</span>
            <span className="text-[18px] font-semibold text-[var(--text-primary)]">
              {data.summary?.find(s => s.id === 'ownerless')?.value ?? 1}
            </span>
          </div>
          <div>
            <span className="text-[12px] text-[var(--text-secondary)] uppercase block font-medium">Open Role Risk</span>
            <span className="text-[18px] font-semibold text-[var(--text-primary)]">
              {data.openRoles?.length ?? 3}
            </span>
          </div>
        </div>
      </div>

      {/* Needs Ryan Now: Compact Decision Rows */}
      <section className="space-y-4">
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Needs Ryan Now</h2>
        
        {activeNeedsRyan.length === 0 ? (
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-8 text-center space-y-2 shadow-sm">
            <CheckCircle className="w-8 h-8 text-[var(--accent)] mx-auto" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">All Clear</h3>
            <p className="text-[13px] text-[var(--text-muted)]">No items require owner attention at this moment.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {activeNeedsRyan.map(item => {
              const isUrgent = item.urgency === 'urgent';
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-[var(--border-soft)] rounded-[16px] p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-[var(--danger)]' : 'bg-[var(--attention)]'}`} />
                        <span className="text-[15px] font-semibold text-[var(--text-primary)]">{item.type}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isUrgent 
                            ? 'border-[var(--danger)]/20 text-[var(--danger)] bg-[var(--danger)]/5' 
                            : 'border-[var(--attention)]/20 text-[var(--attention)] bg-[var(--attention)]/5'
                        }`}>
                          {isUrgent ? 'Urgent' : 'High'}
                        </span>
                      </div>
                      <p className="text-[14px] text-[var(--text-secondary)]">{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-6 text-[13px] text-[var(--text-muted)] shrink-0 self-end md:self-center">
                      <span>Handler: <strong className="text-[var(--text-primary)] font-semibold">{item.currentHandler}</strong></span>
                      <span>Response Window: <strong className="text-[var(--text-primary)] font-semibold">{item.responseWindow}</strong></span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-soft)] space-y-4">
                    <div className="bg-[var(--workspace)] p-4 rounded-xl border border-[var(--border-soft)]">
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block mb-1">Recommended Action</span>
                      <p className="text-[var(--text-primary)] text-[13px] leading-relaxed">{item.recommendedAction}</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => { handleAction('reviewed', item); }}
                        className="px-4 py-2 bg-[var(--accent)] hover:bg-[#004d47] text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('assign', item)}
                        className="px-4 py-2 bg-white hover:bg-[var(--workspace)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('request_info', item)}
                        className="px-4 py-2 bg-white hover:bg-[var(--workspace)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-sm"
                      >
                        Request Information
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Protected From Ryan & Handled For You Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Handled for You Section */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Handled for You</h2>
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-6 space-y-4 shadow-sm">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Examples of tasks routed and resolved by operations staff this week without escalating.
            </p>
            <div className="space-y-3">
              {handledExamples.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-[var(--workspace)] border border-[var(--border-soft)] rounded-xl text-[13px]">
                  <span className="text-[var(--text-primary)] font-medium">{item.category}</span>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">{item.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="font-semibold text-[var(--accent)]">{item.handler}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Protected Activity Log (Secondary detail) */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Recent Shield Coverage</h2>
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[var(--border-soft)] bg-[var(--workspace)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              <span className="col-span-6">Request</span>
              <span className="col-span-3">Routed To</span>
              <span className="col-span-3 text-right">Time Saved</span>
            </div>
            <div className="divide-y divide-[var(--border-soft)]">
              {data.protected.slice(0, 4).map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-[13px]">
                  <span className="col-span-6 text-[var(--text-primary)] font-medium truncate">{item.request}</span>
                  <span className="col-span-3 text-[var(--text-secondary)] truncate">{item.routedTo}</span>
                  <span className="col-span-3 text-right text-[var(--accent)] font-mono font-semibold">
                    {item.timeSaved || '25 min'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
