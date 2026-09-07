/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SOP Runs Page — Apple Light Mode Redesign
 * Focuses on active SOP checklist executions, SLA clocks, and operational evidence.
 */

import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, Play, CheckCircle, AlertCircle, ArrowRight, Layers, FileCheck, Users, ShieldAlert } from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  TextInput
} from '../ui';

interface SOPRunsPageProps {
  state?: any;
}

export default function SOPRunsPage({ state }: SOPRunsPageProps) {
  const safeState = state || {};
  const wsId = safeState.workspaceId || 'nest-realty-demo';
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'me' | 'active' | 'blocked' | 'attention' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/sops/runs?workspaceId=${wsId}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [wsId]);

  const filteredRuns = runs.filter((run: any) => {
    // 1. Tab filter
    if (activeTab === 'me') {
      const myRole = safeState.activeProfile?.role;
      const myEmail = safeState.activeProfile?.email;
      const isAssignedToMe = run.assigneeEmail === myEmail || run.assigneeRole === myRole;
      if (!isAssignedToMe) return false;
    } else if (activeTab === 'active') {
      if (run.status !== 'active' && run.status !== 'running' && run.status !== 'in_progress') return false;
    } else if (activeTab === 'blocked') {
      if (run.status !== 'blocked') return false;
    } else if (activeTab === 'attention') {
      const isBlocked = run.status === 'blocked';
      const isOverdue = run.status === 'overdue' || (run.status === 'active' && run.isOverdue);
      if (!isBlocked && !isOverdue) return false;
    } else if (activeTab === 'completed') {
      if (run.status !== 'completed') return false;
    }

    // 2. Search filter
    const matchesSearch = 
      (run.title && run.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (run.sopName && run.sopName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const handleOpenRun = (run: any) => {
    const prefix = window.location.pathname.startsWith('/demo') ? '/demo' : '/app';
    window.history.pushState({}, '', `${prefix}/sops/runs/${run.id}`);
    if (safeState.setCurrentTab) {
      safeState.setCurrentTab('Staff SOP Templates');
    }
  };

  const activeCount = runs.filter(r => r.status === 'active' || r.status === 'in_progress' || r.status === 'running').length;
  const blockedCount = runs.filter(r => r.status === 'blocked').length;
  const completedCount = runs.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 text-left select-none animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Layers className="w-3.5 h-3.5" />}>
              SOP Checklist Runs
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">
              {activeCount} Active Runs • {blockedCount} Blocked
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Operational SOP Checklist Executions
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Live checklist executions, SLA timers, and compliance evidence tracking across Nest Realty Wilmington.
          </p>
        </div>

        <Badge variant={blockedCount > 0 ? "warning" : "success"}>
          {blockedCount > 0 ? `${blockedCount} Action Needed` : 'All Workflows Healthy'}
        </Badge>
      </div>

      {/* Metrics Row */}
      <MetricGroup columns={4}>
        <MetricTile
          label="Active Runs"
          value={activeCount}
          sublabel="Checklists in progress"
          variant="brand"
          icon={<Play className="w-4 h-4" />}
        />
        <MetricTile
          label="Assigned to Me"
          value={runs.filter(r => r.assigneeEmail === safeState.activeProfile?.email).length}
          sublabel="My action queue"
          variant="default"
          icon={<Users className="w-4 h-4" />}
        />
        <MetricTile
          label="Blocked / Needs Attention"
          value={blockedCount}
          sublabel="Pending principal or vendor"
          variant={blockedCount > 0 ? "danger" : "success"}
          icon={<AlertCircle className="w-4 h-4" />}
        />
        <MetricTile
          label="Completed"
          value={completedCount}
          sublabel="Executed & audited"
          variant="success"
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </MetricGroup>

      {/* Toolbar & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--sw-surface)] p-3 rounded-2xl border border-[var(--sw-border)] shadow-xs">
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { id: 'active', label: 'Active Runs' },
            { id: 'me', label: 'Assigned to Me' },
            { id: 'blocked', label: 'Blocked' },
            { id: 'attention', label: 'Needs Attention' },
            { id: 'completed', label: 'Completed' }
          ]}
        />

        <div className="w-full md:w-64">
          <TextInput
            placeholder="Search active runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Runs List Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-xs text-[var(--sw-text-secondary)] font-mono animate-pulse">
            Fetching operational checklist runs...
          </div>
        ) : filteredRuns.length === 0 ? (
          <Card className="py-16 text-center text-xs text-[var(--sw-text-secondary)] space-y-2">
            <Layers className="w-8 h-8 mx-auto text-[var(--sw-text-muted)] mb-2" />
            <p className="font-bold text-[var(--sw-text-primary)] text-sm">No checklist executions found</p>
            <p>No active standard operating procedure runs match your selected filter.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRuns.map((run) => {
              const currentStepObj = run.steps?.[run.currentStepIdx || 0];
              const overdue = run.status === 'overdue' || run.isOverdue;
              const hasEvidence = run.steps?.some((s: any) => s.evidenceProvided);

              return (
                <Card 
                  key={run.id} 
                  className="p-5 flex flex-col justify-between hover:border-[var(--sw-border-strong)] transition-all shadow-xs hover:shadow-md h-[240px]"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <StatusBadge 
                          status={run.status === 'completed' ? 'healthy' : run.status === 'blocked' ? 'at_risk' : 'pending'} 
                          size="sm" 
                        />
                        {overdue && (
                          <Badge variant="danger">
                            SLA Overdue
                          </Badge>
                        )}
                        {run.escalationLevel === 2 && (
                          <Badge variant="warning" icon={<ShieldAlert className="w-3 h-3" />}>
                            Needs Ryan
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[var(--sw-text-muted)]">v{run.sopVersion || '1.0'}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[var(--sw-text-primary)] leading-snug truncate">
                        {run.title || run.sopName || 'SOP Execution'}
                      </h4>
                      <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 line-clamp-1">
                        {run.purpose || 'Standard operating procedure execution checklist.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-[var(--sw-border)] pt-2.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--sw-text-secondary)]">Assignee:</span>
                        <span className="font-semibold text-[var(--sw-text-primary)]">{run.assigneeName || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--sw-text-secondary)]">Current Step:</span>
                        <span className="font-medium text-[var(--sw-text-primary)] truncate max-w-[170px]">
                          {currentStepObj ? `${(run.currentStepIdx || 0) + 1}. ${currentStepObj.title || currentStepObj.action}` : 'All steps completed'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--sw-text-secondary)]">Evidence:</span>
                        <span className={`font-medium ${hasEvidence ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                          {hasEvidence ? '✓ Verified Attached' : 'Pending Upload'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--sw-border)] pt-3 flex justify-between items-center text-xs">
                    <span className="text-[10px] font-mono text-[var(--sw-text-muted)]">
                      Started {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : 'Today'}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight className="w-3 h-3" />}
                      onClick={() => handleOpenRun(run)}
                    >
                      Open Run
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
