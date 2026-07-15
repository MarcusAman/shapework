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
  const color = urgency === 'urgent' ? 'text-[var(--danger)]' : urgency === 'attention' ? 'text-[var(--attention)]' : 'text-[var(--accent)]';
  const borderHighlight = urgency === 'urgent' 
    ? 'border-l-4 border-l-[var(--danger)] border-t border-r border-b border-[var(--border-soft)]' 
    : urgency === 'attention' 
    ? 'border-l-4 border-l-[var(--attention)] border-t border-r border-b border-[var(--border-soft)]' 
    : 'border border-[var(--border-soft)]';

  return (
    <div className={`bg-white rounded-[18px] p-5 space-y-2 text-left shadow-sm ${borderHighlight}`}>
      <span className={`text-[32px] font-semibold block ${color}`}>{value}</span>
      <span className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider block">{label}</span>
      {sub && <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed font-medium">{sub}</p>}
    </div>
  );
}

export default function OwnerWeeklyBriefPage({ data }: OwnerWeeklyBriefPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">Owner Weekly Brief</h1>
          <span className="px-2.5 py-1 rounded-full bg-white border border-[var(--border-soft)] text-[var(--accent)] text-[10px] font-mono font-bold">
            {data.weekLabel}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
          A complete summary of what moved through the brokerage this week.
        </p>
      </div>

      {/* 1. Activity Summary */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">This Week at a Glance</h2>
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
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">What Got Handled</h2>
        <div className="bg-white border border-[var(--border-soft)] rounded-[18px] overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[var(--border-soft)] bg-[var(--workspace)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
            <span className="col-span-5">Category</span>
            <span className="col-span-3">Handler</span>
            <span className="col-span-4 text-right">Requests</span>
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            {data.handled.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center text-[13px] hover:bg-[var(--workspace)]/50 transition-colors"
              >
                <span className="col-span-5 text-[var(--text-primary)] font-medium">{row.category}</span>
                <span className="col-span-3 text-[var(--text-secondary)]">{row.handler}</span>
                <div className="col-span-4 flex items-center justify-end gap-3">
                  <div className="w-20 bg-[var(--workspace)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${Math.min((row.count / data.activity.requestsHandled) * 100 * 2, 100)}%` }}
                    />
                  </div>
                  <span className="text-[var(--accent)] font-mono font-bold w-4 text-right">{row.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. What Needed Ryan */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">What Needed Ryan</h2>
        <div className="space-y-3">
          {data.neededRyan.map((row, idx) => (
            <div
              key={idx}
              className="bg-white border border-[var(--border-soft)] border-l-4 border-l-[var(--attention)] rounded-[18px] p-5 flex items-start justify-between gap-6 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--attention)] shrink-0" />
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{row.type}</span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] pl-5">{row.resolution}</p>
              </div>
              <span className="shrink-0 text-2xl font-semibold text-[var(--attention)] font-mono">{row.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. What Got Stuck */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">What Got Stuck</h2>
        {data.stuck.length === 0 ? (
          <div className="bg-white border border-[var(--border-soft)] rounded-[18px] p-8 text-center space-y-2 shadow-sm">
            <CheckCircle className="w-8 h-8 text-[var(--accent)] mx-auto" />
            <p className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Nothing stuck this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.stuck.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[var(--border-soft)] border-l-4 border-l-[var(--attention)] rounded-[18px] p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--attention)] mt-0.5 shrink-0" />
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">{item.item}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[13px] pl-5">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-0.5">Why Stuck</span>
                    <p className="text-[var(--text-secondary)] leading-snug">{item.whyStuck}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-0.5">Current Owner</span>
                    <p className="text-[var(--text-primary)] font-medium">{item.owner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-0.5">Next Step</span>
                    <p className="text-[var(--text-primary)] font-medium">{item.nextStep}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Team Load */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Team Load</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.teamLoad.map((entry, idx) => {
            const cfg = loadConfig[entry.load];
            return (
              <div
                key={idx}
                className="bg-white border border-[var(--border-soft)] rounded-[18px] p-5 space-y-3 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">{entry.name}</span>
                      <span className="text-[12px] text-[var(--text-muted)] block">{entry.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-[var(--border-soft)] bg-[var(--workspace)] ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <div className="w-full bg-[var(--workspace)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${cfg.bar}`}
                      style={{ width: `${cfg.pct}%` }}
                    />
                  </div>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] mt-2">{entry.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Open Role Impact */}
      <section className="space-y-4">
        <h2 className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Open Role Impact</h2>
        <div className="space-y-3">
          {data.roleImpact.map((role, idx) => (
            <div
              key={idx}
              className="bg-white border border-[var(--border-soft)] border-l-4 border-l-[var(--attention)] rounded-[18px] p-5 space-y-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[var(--attention)] shrink-0" />
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{role.role}</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed pl-5">{role.impact}</p>
              <div className="pl-5 pt-1.5 border-t border-[var(--border-soft)] mt-2">
                <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-0.5">Resolution Path</span>
                <p className="text-[13px] text-[var(--text-primary)] font-medium leading-relaxed">{role.resolution}</p>
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
              className={`bg-white border border-[var(--border-soft)] rounded-[18px] p-5 flex items-start justify-between gap-4 shadow-sm ${
                action.priority === 'high' ? 'border-l-4 border-l-[var(--attention)]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  action.priority === 'high' ? 'bg-[var(--attention)]/15 text-[var(--attention)]' : 'bg-[var(--workspace)] text-[var(--text-muted)]'
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
                  : 'border-[var(--border-soft)] text-[var(--text-muted)] bg-[var(--workspace)]'
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
