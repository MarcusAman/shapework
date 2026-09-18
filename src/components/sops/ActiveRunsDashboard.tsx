/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ActiveRunsDashboard
 * Unified Operations Console for Real-Time SOP Checklist Runs.
 * Features Kanban & Table views, SLA health tracking, and interactive execution drawer.
 */

import React, { useState, useEffect } from 'react';
import {
  Play, CheckCircle2, AlertTriangle, Clock, Search, Filter,
  Building, User, ArrowRight, Plus, ShieldCheck, FileText,
  Layers, LayoutGrid, List, ChevronRight, Sparkles, ExternalLink, X
} from 'lucide-react';
import type { SopRunRecord } from '../../../server/persistence/sopRunRepository';
import { SopDocument } from '../../types/sopWorkflow';
import ActiveRunDrawer from './ActiveRunDrawer';

interface ActiveRunsDashboardProps {
  publishedSops: SopDocument[];
  workspaceId?: string;
  onOpenSopLibraryTab?: (tab: string) => void;
  hideKpis?: boolean;
}

export default function ActiveRunsDashboard({
  publishedSops = [],
  workspaceId = 'nest-realty-wilmington',
  onOpenSopLibraryTab,
  hideKpis = false
}: ActiveRunsDashboardProps) {
  const [runs, setRuns] = useState<SopRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedRun, setSelectedRun] = useState<SopRunRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [newRunSopId, setNewRunSopId] = useState('');
  const [newRunAddress, setNewRunAddress] = useState('');
  const [newRunAssignee, setNewRunAssignee] = useState('Melissa Gagliardi');
  const [newRunPriority, setNewRunPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sops/runs', {
        headers: { 'x-workspace-id': workspaceId }
      });
      const data = await res.json();
      if (data.success && data.runs) {
        setRuns(data.runs);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [workspaceId]);

  const handleOpenRun = (run: SopRunRecord) => {
    setSelectedRun(run);
    setIsDrawerOpen(true);
  };

  const handleStepCompleted = async (runId: string, stepId: string, evidenceData: any) => {
    try {
      const res = await fetch(`/api/sops/runs/${runId}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify(evidenceData)
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRun(data.run);
        setRuns(prev => prev.map(r => r.id === runId ? data.run : r));
        showToast(`Step completed and evidence logged.`);
      }
    } catch (err) {
      console.error('Step completion error:', err);
    }
  };

  const handleStepReopened = async (runId: string, stepId: string) => {
    try {
      const res = await fetch(`/api/sops/runs/${runId}/steps/${stepId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedRun(data.run);
        setRuns(prev => prev.map(r => r.id === runId ? data.run : r));
        showToast('Step reopened.');
      }
    } catch (err) {
      console.error('Step reopen error:', err);
    }
  };

  const handleEscalateBottleneck = async (runId: string, escalateData: any) => {
    try {
      const res = await fetch(`/api/sops/runs/${runId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify(escalateData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Bottleneck ticket created.');
        fetchRuns();
      }
    } catch (err) {
      console.error('Bottleneck escalation error:', err);
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRunSopId || !newRunAddress.trim()) return;

    try {
      const res = await fetch('/api/sops/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({
          sopId: newRunSopId,
          propertyAddress: newRunAddress.trim(),
          assigneeName: newRunAssignee,
          priority: newRunPriority
        })
      });
      const data = await res.json();
      if (data.success && data.run) {
        setRuns(prev => [data.run, ...prev]);
        setShowNewRunModal(false);
        setNewRunAddress('');
        showToast(`Checklist run started for ${data.run.propertyAddress}!`);
        handleOpenRun(data.run);
      }
    } catch (err) {
      console.error('Create run error:', err);
    }
  };

  // Filtered runs
  const filteredRuns = runs.filter(r => {
    const matchesSearch = !searchQuery || 
      r.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const activeCount = runs.filter(r => r.status !== 'completed').length;
  const atRiskCount = runs.filter(r => r.status === 'at_risk').length;
  const completedCount = runs.filter(r => r.status === 'completed').length;
  const avgProgress = runs.length > 0
    ? Math.round(runs.reduce((acc, r) => acc + r.progressPercent, 0) / runs.length)
    : 0;

  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#00635C] text-white px-4 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      {!hideKpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Runs</span>
              <Layers className="w-4 h-4 text-[#00635C]" />
            </div>
            <p className="text-2xl font-serif font-bold text-stone-900">{activeCount}</p>
            <p className="text-[11px] text-stone-500">Live procedures running</p>
          </div>

          <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Needs Attention</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-rose-700">{atRiskCount}</p>
            <p className="text-[11px] text-rose-600/80 font-medium">
              {atRiskCount > 0 ? `${atRiskCount} workflow needs attention` : 'All workflows on track'}
            </p>
          </div>

          <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Avg Progress</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-stone-900">{avgProgress}%</p>
            <p className="text-[11px] text-stone-500">Across active workflows</p>
          </div>

          <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Completed</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-emerald-800">{completedCount}</p>
            <p className="text-[11px] text-emerald-700/80 font-medium">Fully verified procedures</p>
          </div>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runs by property, assignee, or SOP..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#00635C]"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'in_progress' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'at_risk' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-600 hover:text-rose-700'
              }`}
            >
              Needs Attention
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'completed' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-700'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-white text-[#00635C] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-[#00635C] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowNewRunModal(true)}
            className="py-2 px-3.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start Run</span>
          </button>
        </div>
      </div>

      {/* Main Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-stone-200/80">
              <span className="font-bold text-stone-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00635C]" />
                <span>In Progress</span>
              </span>
              <span className="px-2 py-0.5 bg-stone-100 rounded-full font-bold text-[10px] text-stone-600">
                {filteredRuns.filter(r => r.status === 'in_progress').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredRuns.filter(r => r.status === 'in_progress').map(run => (
                <RunCard key={run.id} run={run} onOpen={() => handleOpenRun(run)} />
              ))}
              {filteredRuns.filter(r => r.status === 'in_progress').length === 0 && (
                <div className="p-8 text-center bg-stone-50/70 rounded-2xl border border-dashed border-stone-200 text-stone-400">
                  <p className="text-xs font-semibold text-stone-600">No runs in progress</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Click "Start Run" to track an active procedure.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Needs Attention / Delayed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-rose-200">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Needs Attention</span>
              </span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded-full font-bold text-[10px]">
                {filteredRuns.filter(r => r.status === 'at_risk').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredRuns.filter(r => r.status === 'at_risk').map(run => (
                <RunCard key={run.id} run={run} onOpen={() => handleOpenRun(run)} isAtRisk />
              ))}
              {filteredRuns.filter(r => r.status === 'at_risk').length === 0 && (
                <div className="p-8 text-center bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200 text-emerald-800">
                  <p className="text-xs font-semibold text-emerald-900">All runs on track</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">No overdue steps or delays right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Completed</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[10px]">
                {filteredRuns.filter(r => r.status === 'completed').length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredRuns.filter(r => r.status === 'completed').map(run => (
                <RunCard key={run.id} run={run} onOpen={() => handleOpenRun(run)} isCompleted />
              ))}
              {filteredRuns.filter(r => r.status === 'completed').length === 0 && (
                <div className="p-8 text-center bg-stone-50/70 rounded-2xl border border-dashed border-stone-200 text-stone-400">
                  <p className="text-xs font-semibold text-stone-600">No completed runs yet</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Completed procedures will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F7F8F5] border-b border-stone-200/80 text-[10px] uppercase font-bold text-stone-500">
              <tr>
                <th className="py-3 px-4">Property / Transaction</th>
                <th className="py-3 px-4">SOP Procedure</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Current Step</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60">
              {filteredRuns.map(run => (
                <tr key={run.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => handleOpenRun(run)}>
                  <td className="py-3 px-4 font-bold text-stone-900">{run.propertyAddress}</td>
                  <td className="py-3 px-4 text-stone-700">{run.title}</td>
                  <td className="py-3 px-4 text-stone-600">{run.assigneeName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-stone-200 rounded-full h-1.5">
                        <div className="bg-[#00635C] h-1.5 rounded-full" style={{ width: `${run.progressPercent}%` }} />
                      </div>
                      <span className="font-mono text-[10px]">{run.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    Step {run.currentStepNumber} of {run.totalSteps}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      run.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800'
                        : run.status === 'at_risk'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-emerald-50 text-[#00635C]'
                    }`}>
                      {run.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[#00635C] font-semibold hover:underline flex items-center gap-1 ml-auto">
                      <span>Execute</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Run Execution Drawer */}
      <ActiveRunDrawer
        run={selectedRun}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStepCompleted={handleStepCompleted}
        onStepReopened={handleStepReopened}
        onEscalateBottleneck={handleEscalateBottleneck}
      />

      {/* Start New Run Modal */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Start Active Checklist Run
                </h3>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-600 text-xs">
              Instantiate a live step-by-step standard operating procedure for a property or transaction.
            </p>

            <form onSubmit={handleCreateRun} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Select SOP Template:
                </label>
                <select
                  value={newRunSopId}
                  onChange={(e) => setNewRunSopId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                >
                  <option value="">-- Choose an Approved SOP --</option>
                  {publishedSops.map(sop => (
                    <option key={sop.id} value={sop.id}>
                      {sop.title} (v{sop.version} • {sop.processOwner})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Property Address / Transaction:
                </label>
                <input
                  type="text"
                  value={newRunAddress}
                  onChange={(e) => setNewRunAddress(e.target.value)}
                  required
                  placeholder="e.g. 518 Chestnut St, Wilmington NC"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Assignee:
                  </label>
                  <select
                    value={newRunAssignee}
                    onChange={(e) => setNewRunAssignee(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                  >
                    <option value="Melissa Gagliardi">Melissa Gagliardi (TC)</option>
                    <option value="Ann Gunn">Ann Gunn (Ops Lead)</option>
                    <option value="Jessica Keenan">Jessica Keenan (BIC — Mayfaire)</option>
                    <option value="Eric Knight">Eric Knight (BIC — Carolina Beach)</option>
                    <option value="Matt Orr">Matt Orr (Agent / REALTOR®)</option>
                    <option value="Ryan Crecelius">Ryan Crecelius (Principal Broker / Owner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Priority:
                  </label>
                  <select
                    value={newRunPriority}
                    onChange={(e) => setNewRunPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#00635C]"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewRunModal(false)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRunSopId || !newRunAddress.trim()}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Run</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Individual Run Card in Kanban View
function RunCard({
  run,
  onOpen,
  isAtRisk = false,
  isCompleted = false
}: {
  key?: any;
  run: SopRunRecord;
  onOpen: () => void;
  isAtRisk?: boolean;
  isCompleted?: boolean;
}) {
  const currentStep = run.steps.find(s => s.stepNumber === run.currentStepNumber);

  return (
    <div
      onClick={onOpen}
      className={`p-4 bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 ${
        isCompleted
          ? 'border-emerald-200 hover:border-emerald-300'
          : isAtRisk
            ? 'border-rose-200 hover:border-rose-300 ring-2 ring-rose-500/10'
            : 'border-stone-200/80 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          run.priority === 'urgent' ? 'bg-rose-50 text-rose-800' : 'bg-stone-100 text-stone-700'
        }`}>
          {run.priority}
        </span>
        <span className="text-[10px] text-stone-400 font-mono">v{run.sopVersion}.0</span>
      </div>

      <div>
        <h4 className="font-serif font-bold text-stone-900 text-sm truncate">
          {run.propertyAddress}
        </h4>
        <p className="text-[11px] text-stone-500 truncate mt-0.5">
          {run.title}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-stone-600">
          <span className="font-bold">{run.progressPercent}% Done</span>
          <span>{run.steps.filter(s => s.status === 'completed').length}/{run.totalSteps} Steps</span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all ${
              isCompleted ? 'bg-emerald-600' : isAtRisk ? 'bg-rose-500' : 'bg-[#00635C]'
            }`}
            style={{ width: `${Math.max(5, run.progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Current Step Snippet */}
      {!isCompleted && currentStep && (
        <div className="p-2 bg-[#F7F8F5] rounded-xl border border-stone-200/70 text-[11px]">
          <span className="font-bold text-stone-700 block">Step {currentStep.stepNumber} ({currentStep.role}):</span>
          <p className="text-stone-600 truncate mt-0.5">{currentStep.action}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1 font-medium text-stone-700">
          <User className="w-3.5 h-3.5 text-stone-400" />
          <span>{run.assigneeName}</span>
        </span>
        <span className="text-[#00635C] font-semibold flex items-center gap-0.5">
          <span>Open</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
