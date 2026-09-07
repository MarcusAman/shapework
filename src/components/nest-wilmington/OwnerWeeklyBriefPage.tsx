/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Owner Weekly Brief Page — Apple Light Mode Redesign with Click-Through Navigation
 * Resolution for QA Issue ISS-018
 */

import React from 'react';
import { 
  CheckCircle, AlertTriangle, Users, AlertCircle, FileText, ArrowRight, 
  Clock, ShieldCheck, Activity, ChevronRight, ExternalLink 
} from 'lucide-react';
import type { OwnerWeeklyBriefData, TeamLoadEntry } from './adapters';
import {
  Card,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  DataTable,
  ProgressBar
} from '../ui';

interface OwnerWeeklyBriefPageProps {
  data: OwnerWeeklyBriefData;
  onNavigateTab?: (tab: string, subtab?: string) => void;
}

export default function OwnerWeeklyBriefPage({ data, onNavigateTab }: OwnerWeeklyBriefPageProps) {
  const handleNav = (tab: string, subtab?: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab, subtab);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left select-none pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<FileText className="w-3.5 h-3.5" />}>
              Owner Weekly Brief
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">
              {data.weekLabel || 'Current Operating Week'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Weekly Owner Brief
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Reconciled activity across Nest Realty Wilmington — inbound requests, team handling rates, and principal escalations.
          </p>
        </div>

        <Badge variant="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
          92% Handled Without Principal
        </Badge>
      </div>

      {/* 1. Activity Summary Metrics (ISS-018: Clickable to deep-link) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
            This Week at a Glance
          </h2>
          <span className="text-[11px] text-[#00635C] font-semibold">Click any tile to inspect items</span>
        </div>

        <MetricGroup columns={3}>
          <div 
            onClick={() => handleNav('inbox')} 
            className="cursor-pointer group" 
            title="Click to view all requests in Inbox"
          >
            <MetricTile
              label="Total Requests Handled"
              value={data.activity.requestsHandled}
              sublabel="Reconciled across all Wilmington offices"
              variant="success"
              icon={<CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            />
          </div>

          <div 
            onClick={() => handleNav('role_escalation_map')} 
            className="cursor-pointer group" 
            title="Click to view delegation & routing matrix"
          >
            <MetricTile
              label="Routed Without Ryan"
              value={data.activity.routedWithoutRyan}
              sublabel="Team handled without escalating"
              variant="success"
              icon={<Users className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            />
          </div>

          <div 
            onClick={() => handleNav('role_escalation_map')} 
            className="cursor-pointer group" 
            title="Click to review principal escalations"
          >
            <MetricTile
              label="Needed Ryan"
              value={data.activity.neededRyan}
              sublabel="Escalated for principal review"
              variant="warning"
              icon={<AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            />
          </div>

          <div 
            onClick={() => handleNav('inbox')} 
            className="cursor-pointer group" 
            title="Click to view open items"
          >
            <MetricTile
              label="Still Open"
              value={data.activity.stillOpen}
              sublabel="Currently in progress by team"
              variant="default"
            />
          </div>

          <div 
            onClick={() => handleNav('inbox')} 
            className="cursor-pointer group" 
            title="Click to inspect overdue items"
          >
            <MetricTile
              label="Overdue"
              value={data.activity.overdue}
              sublabel="Past response window threshold"
              variant={data.activity.overdue > 0 ? "danger" : "success"}
            />
          </div>

          <div 
            onClick={() => handleNav('inbox')} 
            className="cursor-pointer group" 
            title="Click to view items awaiting information"
          >
            <MetricTile
              label="Missing Information"
              value={data.activity.missingInformation}
              sublabel="Awaiting required document uploads"
              variant="warning"
            />
          </div>
        </MetricGroup>
      </section>

      {/* 2. What Got Handled (ISS-018: Interactive Click-Through) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
            What Got Handled
          </h2>
          <span className="text-[11px] text-stone-500">Click category to inspect procedures</span>
        </div>

        <DataTable
          columns={[
            { 
              key: 'category', 
              header: 'Category', 
              accessor: (r) => (
                <div 
                  onClick={() => handleNav('sops')}
                  className="font-bold text-[var(--sw-text-primary)] hover:text-[#00635C] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{r.category}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </div>
              )
            },
            { 
              key: 'handler', 
              header: 'Primary Handler', 
              accessor: (r) => (
                <span 
                  onClick={() => handleNav('role_escalation_map')}
                  className="text-[var(--sw-text-secondary)] hover:text-stone-900 font-medium cursor-pointer"
                >
                  {r.handler}
                </span>
              )
            },
            {
              key: 'count',
              header: 'Volume Processed',
              accessor: (r) => (
                <div className="flex items-center gap-3 justify-end">
                  <ProgressBar
                    value={r.count}
                    max={data.activity.requestsHandled}
                    showPercentage={false}
                    size="sm"
                    className="w-28"
                  />
                  <span className="font-mono font-bold text-[#00635C]">{r.count}</span>
                </div>
              ),
              align: 'right'
            }
          ]}
          data={data.handled}
          keyExtractor={(r) => r.category}
        />
      </section>

      {/* 3. What Needed Ryan (ISS-018) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          What Needed Ryan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.neededRyan.map((row, idx) => (
            <Card 
              key={idx} 
              onClick={() => handleNav('role_escalation_map')}
              className="border-l-4 border-l-amber-500 p-4 flex items-start justify-between gap-4 shadow-xs hover:border-[#00635C] transition-all cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#00635C] transition-colors">{row.type}</h4>
                </div>
                <p className="text-xs text-stone-600 pl-6">{row.resolution}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xl font-bold font-mono text-amber-700">{row.count}</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#00635C]" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. What Got Stuck (ISS-018) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          What Got Stuck
        </h2>
        {data.stuck.length === 0 ? (
          <Card className="p-6 text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-stone-900">Nothing stuck this week</p>
            <p className="text-[11px] text-stone-500">All team tasks are progressing on time.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.stuck.map((item, idx) => (
              <Card 
                key={idx} 
                onClick={() => handleNav('inbox')}
                className="border-l-4 border-l-rose-500 p-4 space-y-2 shadow-xs hover:border-[#00635C] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-rose-700">{item.item || (item as any).summary}</h4>
                  </div>
                  <Badge variant="neutral">Owner: {item.owner}</Badge>
                </div>
                <p className="text-xs text-stone-600 pl-6">{item.whyStuck || (item as any).detail}</p>
                <div className="text-[11px] text-stone-700 pl-6 border-t border-stone-100 pt-2 font-medium flex justify-between items-center">
                  <span>Next Step: {item.nextStep}</span>
                  <span className="text-[#00635C] font-semibold">Inspect →</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. Team Load & Role Impact (ISS-018) */}
      {data.teamLoad && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
            Team Load & Operational Capacity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.teamLoad.map((member, idx) => (
              <Card 
                key={idx} 
                onClick={() => handleNav('role_escalation_map')}
                className="p-4 space-y-2 shadow-xs hover:border-[#00635C] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">{member.name}</h4>
                  <StatusBadge 
                    status={member.load === 'high' ? 'at_risk' : member.load === 'moderate' ? 'pending' : 'healthy'} 
                    size="sm" 
                  />
                </div>
                <span className="text-xs text-stone-500 block">{member.title}</span>
                <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-2">{member.note}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 6. Recommended Actions */}
      {data.recommendedActions && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
            Recommended Principal Actions
          </h2>
          <div className="space-y-2">
            {data.recommendedActions.map((act) => (
              <div 
                key={act.id} 
                className="p-3.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00635C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-900">{act.action}</h4>
                    <span className="text-[10px] text-stone-500">{act.category}</span>
                  </div>
                </div>
                <Badge variant={act.priority === 'high' ? 'warning' : 'neutral'}>
                  {act.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
