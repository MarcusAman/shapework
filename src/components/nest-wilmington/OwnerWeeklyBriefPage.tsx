/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Owner Weekly Brief Page — Phase C Light-Mode Redesign
 * Migrated to canonical Shapework B1/B2/B3 design primitives.
 * Editorial weekly summary for brokerage owners with clear numeric hierarchy.
 */

import React from 'react';
import { CheckCircle, AlertTriangle, Users, AlertCircle, FileText } from 'lucide-react';
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
}

export default function OwnerWeeklyBriefPage({ data }: OwnerWeeklyBriefPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)]">
            Weekly Owner Brief
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5">
            Operational summary for Nest Realty Wilmington — requests handled, escalations, and team load.
          </p>
        </div>
        <Badge variant="brand" icon={<FileText className="w-3.5 h-3.5" />}>
          Weekly Report • July 2026
        </Badge>
      </div>

      {/* 1. Activity Summary Metrics */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          This Week at a Glance
        </h2>
        <MetricGroup columns={3}>
          <MetricTile
            label="Total Requests Handled"
            value={data.activity.requestsHandled}
            sublabel="Reconciled across all Wilmington offices"
            variant="success"
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <MetricTile
            label="Routed Without Ryan"
            value={data.activity.routedWithoutRyan}
            sublabel="Team handled without escalating"
            variant="success"
            trend="92% Team Self-Serve"
            trendDirection="up"
            icon={<Users className="w-4 h-4" />}
          />
          <MetricTile
            label="Needed Ryan"
            value={data.activity.neededRyan}
            sublabel="Escalated for principal review"
            variant="warning"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <MetricTile
            label="Still Open"
            value={data.activity.stillOpen}
            sublabel="Currently in progress by team"
            variant="default"
          />
          <MetricTile
            label="Overdue"
            value={data.activity.overdue}
            sublabel="Past response window threshold"
            variant={data.activity.overdue > 0 ? "danger" : "success"}
          />
          <MetricTile
            label="Missing Information"
            value={data.activity.missingInformation}
            sublabel="Awaiting required document uploads"
            variant="warning"
          />
        </MetricGroup>
      </section>

      {/* 2. What Got Handled */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          What Got Handled
        </h2>
        <DataTable
          columns={[
            { key: 'category', header: 'Category', accessor: (r) => <span className="font-bold text-[var(--sw-text-primary)]">{r.category}</span> },
            { key: 'handler', header: 'Primary Handler', accessor: (r) => <span className="text-[var(--sw-text-secondary)]">{r.handler}</span> },
            {
              key: 'count',
              header: 'Volume Processed',
              accessor: (r) => (
                <div className="flex items-center gap-3">
                  <ProgressBar
                    value={r.count}
                    max={data.activity.requestsHandled}
                    showPercentage={false}
                    size="sm"
                    className="w-32"
                  />
                  <span className="font-mono font-bold text-[var(--brand-secondary)]">{r.count}</span>
                </div>
              ),
              align: 'right'
            }
          ]}
          data={data.handled}
          keyExtractor={(r) => r.category}
        />
      </section>

      {/* 3. What Needed Ryan */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          What Needed Ryan
        </h2>
        <div className="space-y-3">
          {data.neededRyan.map((row, idx) => (
            <Card key={idx} className="border-l-4 border-l-[var(--state-warning)] p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--state-warning)] shrink-0" />
                  <h4 className="text-sm font-bold text-[var(--sw-text-primary)]">{row.type}</h4>
                </div>
                <p className="text-xs text-[var(--sw-text-secondary)] pl-6">{row.resolution}</p>
              </div>
              <span className="text-xl font-bold font-mono text-[var(--state-warning)]">{row.count}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. What Got Stuck */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">
          What Got Stuck
        </h2>
        {data.stuck.length === 0 ? (
          <Card className="p-6 text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-[var(--state-success)] mx-auto" />
            <p className="text-xs font-bold text-[var(--sw-text-primary)]">Nothing stuck this week</p>
            <p className="text-[11px] text-[var(--sw-text-secondary)]">All team tasks are progressing within response SLAs.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.stuck.map((item, idx) => (
              <Card key={idx} className="border-l-4 border-l-[var(--state-danger)] p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--state-danger)] shrink-0" />
                  <h4 className="text-xs font-bold text-[var(--sw-text-primary)]">{item.summary}</h4>
                </div>
                <p className="text-xs text-[var(--sw-text-secondary)] pl-6">{item.detail}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
