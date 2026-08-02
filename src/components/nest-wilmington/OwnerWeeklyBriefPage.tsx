import React from 'react';
import { CheckCircle, AlertTriangle, Users, AlertCircle } from 'lucide-react';
import type { OwnerWeeklyBriefData, TeamLoadEntry } from './adapters';

interface OwnerWeeklyBriefPageProps {
  data: OwnerWeeklyBriefData;
}

const loadConfig: Record<TeamLoadEntry['load'], { label: string; bar: string; text: string; pct: number }> = {
  light: { label: 'Light', bar: 'bg-[var(--accent)]', text: 'text-[var(--accent)]', pct: 25 },
  normal: { label: 'Normal', bar: 'bg-[var(--accent)]', text: 'text-[var(--accent)]', pct: 50 },
  moderate: { label: 'Moderate', bar: 'bg-[var(--attention)]', text: 'text-[var(--attention)]', pct: 70 },
  high: { label: 'High', bar: 'bg-[var(--attention)]', text: 'text-[var(--attention)]', pct: 85 },
  overloaded: { label: 'Overloaded', bar: 'bg-[var(--danger)]', text: 'text-[var(--danger)]', pct: 100 },
};

function StatCard({ value, label, sub, urgency }: { value: number | string; label: string; sub?: string; urgency?: 'ok' | 'attention' | 'urgent' }) {
  const color = urgency === 'urgent' ? 'text-red-400' : urgency === 'attention' ? 'text-amber-400' : 'text-emerald-400';
  const borderHighlight = urgency === 'urgent' 
    ? 'border-l-4 border-l-red-400' 
    : urgency === 'attention' 
    ? 'border-l-4 border-l-amber-400' 
    : 'border-l-4 border-l-emerald-400';

  return (
    <div 
      className={`rounded-[28px] p-6 space-y-2 text-left shadow-xl ${borderHighlight}`}
      style={{
        background: 'rgba(246, 247, 241, 0.10)',
        border: '1px solid rgba(246, 247, 241, 0.18)',
        backdropFilter: 'blur(18px)'
      }}
    >
      <span className={`text-3xl font-serif font-black block ${color}`}>{value}</span>
      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">{label}</span>
      {sub && <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium">{sub}</p>}
    </div>
  );
}

export default function OwnerWeeklyBriefPage({ data }: OwnerWeeklyBriefPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 1. Activity Summary */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">This Week at a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard value={data.activity.requestsHandled} label="Total Requests Handled" urgency="ok" />
          <StatCard value={data.activity.routedWithoutRyan} label="Routed Without Ryan" sub="Team handled without escalating" urgency="ok" />
          <StatCard value={data.activity.neededRyan} label="Needed Ryan" sub="Items escalated to principal" urgency="attention" />
          <StatCard value={data.activity.stillOpen} label="Still Open" sub="Not yet resolved" urgency="attention" />
          <StatCard value={data.activity.overdue} label="Overdue" sub="Past response window" urgency="urgent" />
          <StatCard value={data.activity.missingInformation} label="Missing Information" sub="Waiting on required details" urgency="attention" />
        </div>
      </section>

      {/* 2. What Got Handled */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">What Got Handled</h2>
        <div 
          className="rounded-[28px] overflow-hidden shadow-xl"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/10 bg-black/30 text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB] font-bold">
            <span className="col-span-5">Category</span>
            <span className="col-span-3">Handler</span>
            <span className="col-span-4 text-right">Requests</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.handled.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center text-xs hover:bg-white/[0.04] transition-colors"
              >
                <span className="col-span-5 text-white font-medium">{row.category}</span>
                <span className="col-span-3 text-[#D0D6BB]">{row.handler}</span>
                <div className="col-span-4 flex items-center justify-end gap-3">
                  <div className="w-20 bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min((row.count / data.activity.requestsHandled) * 100 * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-emerald-400 font-mono font-bold w-4 text-right">{row.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. What Needed Ryan */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">What Needed Ryan</h2>
        <div className="space-y-3.5">
          {data.neededRyan.map((row, idx) => (
            <div
              key={idx}
              className="rounded-[28px] border-l-4 border-l-amber-400 p-5 flex items-start justify-between gap-6 shadow-xl"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-base font-serif font-bold text-white">{row.type}</span>
                </div>
                <p className="text-xs text-[#D0D6BB] pl-6">{row.resolution}</p>
              </div>
              <span className="shrink-0 text-2xl font-serif font-black text-amber-400 font-mono">{row.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. What Got Stuck */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">What Got Stuck</h2>
        {data.stuck.length === 0 ? (
          <div 
            className="rounded-[28px] p-8 text-center space-y-2 shadow-xl"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white uppercase tracking-wider">Nothing stuck this week</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.stuck.map((item, idx) => (
              <div
                key={idx}
                className="rounded-[28px] border-l-4 border-l-amber-400 p-5 space-y-3 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-base font-serif font-bold text-white">{item.item}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs pl-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D0D6BB] block mb-0.5 font-bold">Why Stuck</span>
                    <p className="text-white leading-relaxed">{item.whyStuck}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D0D6BB] block mb-0.5 font-bold">Current Owner</span>
                    <p className="text-white font-bold">{item.owner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D0D6BB] block mb-0.5 font-bold">Next Step</span>
                    <p className="text-white font-bold">{item.nextStep}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Team Load */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">Team Load</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.teamLoad.map((entry, idx) => {
            const cfg = loadConfig[entry.load];
            return (
              <div
                key={idx}
                className="rounded-[28px] p-6 space-y-3 flex flex-col justify-between shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-base font-serif font-bold text-white">{entry.name}</span>
                      <span className="text-xs text-[#D0D6BB] block">{entry.title}</span>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border border-white/15 bg-black/40 text-emerald-300 uppercase">{cfg.label}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all bg-emerald-400"
                      style={{ width: `${cfg.pct}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#D0D6BB] mt-2">{entry.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Open Role Impact */}
      <section className="space-y-4">
        <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">Open Role Impact</h2>
        <div className="space-y-3.5">
          {data.roleImpact.map((role, idx) => (
            <div
              key={idx}
              className="rounded-[28px] border-l-4 border-l-amber-400 p-5 space-y-2 shadow-xl"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-base font-serif font-bold text-white">{role.role}</span>
              </div>
              <p className="text-xs text-[#D0D6BB] pl-6 leading-relaxed">{role.impact}</p>
              <div className="pl-6 pt-1.5 border-t border-white/10 mt-2">
                <span className="text-[10px] font-mono uppercase text-[#D0D6BB] block mb-0.5 font-bold">Resolution Path</span>
                <p className="text-xs text-white font-bold leading-relaxed">{role.resolution}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Recommended Actions */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Recommended Owner Actions</h2>
        <div className="space-y-3">
          {data.recommendedActions.map((action, idx) => (
            <div
              key={action.id}
              className={`nest-glass-card p-5 flex items-start justify-between gap-4 ${
                action.priority === 'high' ? 'border-l-4 border-l-[var(--attention)]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  action.priority === 'high' ? 'bg-[var(--attention)]/15 text-[var(--attention)]' : 'bg-black/25 text-[var(--text-muted)] border border-white/10'
                }`}>
                  {idx + 1}
                </span>
                <div className="space-y-0.5 text-left">
                  <p className="text-[13px] text-[var(--text-primary)] font-semibold leading-snug">{action.action}</p>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block font-bold mt-0.5">{action.category}</span>
                </div>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border ${
                action.priority === 'high'
                  ? 'border-[var(--attention)]/35 text-[var(--attention)] bg-[var(--attention)]/10'
                  : 'border-white/10 text-[var(--text-muted)] bg-black/25'
              }`}>
                {action.priority === 'high' ? 'Priority' : 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center border-t border-[var(--border-soft)] pt-6">
        <p className="text-[9px] font-mono text-[var(--text-muted)] select-none font-bold">
          Owner Brief compiled weekly · Sample activity — draft model · Nest Wilmington
        </p>
      </div>
    </div>
  );
}
