/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertCircle, Play, CheckCircle2, FileText } from 'lucide-react';

interface Job {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastErrorRedacted?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOperationsDashboard() {
  const [healthData, setHealthData] = useState<any>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/jobs/health');
      const data = await res.json();
      setHealthData(data);

      const syncRes = await fetch('/api/sync-runs');
      const syncData = await syncRes.json();
      setSyncHistory(syncData);
    } catch (e) {
      console.error('Error fetching admin operations health:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setIsRetrying(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchHealth();
      } else {
        const err = await res.json();
        alert('Retry failed: ' + (err.message || err.error));
      }
    } catch (err: any) {
      alert('Error triggering job retry: ' + err.message);
    } finally {
      setIsRetrying(null);
    }
  };

  const handleExportRedactedLogs = () => {
    if (!healthData?.jobs) return;
    const blob = new Blob([JSON.stringify(healthData.jobs, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `redacted_operations_log_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-xs text-text-tertiary select-none">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-primary mb-1.5" />
        <span>Loading operational health deck...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans text-xs text-text-secondary select-none">
      
      {/* Banner */}
      <div className="bg-stone-50 border border-border-soft rounded-3xl p-5 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-primary" />
          <div>
            <h3 className="font-serif font-bold text-text-primary text-sm">Brokerage Cluster Admin Operations</h3>
            <p className="text-[11px] text-text-tertiary">
              Real-time monitoring of asynchronous background queues, integration sync records, and credentials security flags.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportRedactedLogs}
          className="px-3 py-1.5 border border-border-soft hover:bg-stone-150 text-text-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <FileText className="w-4 h-4 text-text-tertiary" />
          <span>Export Redacted Job Logs</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border-soft bg-white rounded-2xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Failed / Dead-Letter</span>
          <span className={`text-2xl font-serif font-bold block mt-1 ${healthData?.deadLetterCount > 0 ? 'text-red-650' : 'text-text-primary'}`}>
            {healthData?.failedJobsCount || 0}
          </span>
        </div>

        <div className="border border-border-soft bg-white rounded-2xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Active Queue Load</span>
          <span className="text-2xl font-serif font-bold block mt-1 text-text-primary">
            {healthData?.queuedCount || 0}
          </span>
        </div>

        <div className="border border-border-soft bg-white rounded-2xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Succeeded Jobs</span>
          <span className="text-2xl font-serif font-bold block mt-1 text-emerald-600">
            {healthData?.succeededCount || 0}
          </span>
        </div>

        <div className="border border-border-soft bg-white rounded-2xl p-4 shadow-sm">
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Credential Vault</span>
          <span className="text-sm font-bold block mt-2.5 text-emerald-600">
            Vault Encryption Key Set
          </span>
        </div>
      </div>

      {/* Integration Sync Runs */}
      <div className="border border-border-soft rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-border-soft font-serif font-bold text-text-primary text-sm">
          Integration Sync Run Records
        </div>
        <div className="divide-y divide-border-soft">
          {syncHistory.length === 0 ? (
            <div className="p-4 text-text-tertiary italic text-center">No baseline synchronization runs recorded yet.</div>
          ) : (
            syncHistory.map((run) => (
              <div key={run.id} className="p-4 flex items-center justify-between hover:bg-stone-50/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      run.status === 'succeeded' ? 'bg-emerald-500' :
                      run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="font-bold text-text-primary capitalize">{run.provider} {run.syncType} Sync</span>
                    <span className="text-[9px] text-text-tertiary">({run.id})</span>
                  </div>
                  <div className="text-[10px] text-text-tertiary flex gap-3">
                    <span>Records fetched: {run.recordsFetched}</span>
                    <span>Created: {run.recordsCreated}</span>
                    <span>Updated: {run.recordsUpdated}</span>
                    <span>Skipped: {run.recordsSkipped}</span>
                  </div>
                </div>
                <div className="text-[10px] text-text-tertiary text-right">
                  <span>Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
                  {run.completedAt && <span className="block">Completed: {new Date(run.completedAt).toLocaleTimeString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Job Queue Table */}
      <div className="border border-border-soft rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-border-soft font-serif font-bold text-text-primary text-sm flex justify-between items-center">
          <span>Active & Dead-Letter Job Registry</span>
          <span className="text-[10px] text-text-tertiary">Real-time interval polling</span>
        </div>
        <div className="divide-y divide-border-soft">
          {!healthData?.jobs || healthData.jobs.length === 0 ? (
            <div className="p-4 text-text-tertiary italic text-center">No background queue executions monitored.</div>
          ) : (
            healthData.jobs.map((job: Job) => (
              <div key={job.id} className="p-4 hover:bg-stone-50/20 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`w-2 h-2 rounded-full ${
                      job.status === 'succeeded' ? 'bg-emerald-500' :
                      job.status === 'failed' || job.status === 'dead_letter' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="font-bold text-text-primary capitalize">{job.type.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] text-text-tertiary">({job.id})</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 uppercase font-bold text-stone-600">
                      {job.status}
                    </span>
                  </div>
                  {job.lastErrorRedacted && (
                    <div className="bg-red-50 border border-red-150 text-red-800 rounded-xl p-2.5 font-mono text-[10px] flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{job.lastErrorRedacted}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-text-tertiary flex gap-3">
                    <span>Attempts: {job.attempts} / {job.maxAttempts}</span>
                    <span>Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {job.status === 'dead_letter' && (
                  <button
                    onClick={() => handleRetryJob(job.id)}
                    disabled={isRetrying === job.id}
                    className="px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-secondary rounded-xl font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Retry Job</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
