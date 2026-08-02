/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Database,
  Layers,
  MapPin,
  ClipboardList
} from 'lucide-react';
import CustomerLaunchWizard from './CustomerLaunchWizard';
import LaunchReadinessPanel from './LaunchReadinessPanel';
import RechatLaunchSetupPanel from './RechatLaunchSetupPanel';
import DotloopLaunchSetupPanel from './DotloopLaunchSetupPanel';
import DataMappingCenter from './DataMappingCenter';
import GoLiveReview from './GoLiveReview';
import CustomerCutoverRunbook from './CustomerCutoverRunbook';
import AdminOperationsDashboard from './AdminOperationsDashboard';

interface CustomerLaunchRoomProps {
  workspaceId?: string;
  state?: any;
  onLaunchWorkspace?: (workspaceConfig: any) => void;
}

export default function CustomerLaunchRoom({ 
  workspaceId = 'nest-realty-demo', 
  state = {},
  onLaunchWorkspace 
}: CustomerLaunchRoomProps) {
  const [activeTab, setActiveTab] = useState<'wizard' | 'readiness' | 'rechat' | 'dotloop' | 'mapping' | 'runbook' | 'admin_ops' | 'golive'>('readiness');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReadiness = async () => {
    try {
      const res = await fetch(`/api/launch/readiness?workspaceId=${workspaceId}`);
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error('Error fetching launch readiness report:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-xs text-text-tertiary font-sans">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mb-2" />
        <span>Evaluating customer launch room diagnostics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left max-w-6xl mx-auto">
      
      {/* Launch Room Banner Info */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm select-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-base">Customer Onboarding & Launch Room</h2>
          </div>
          <p className="text-slate-500 max-w-xl text-xs">
            Operational dashboard to orchestrate, analyze, and validate real real estate brokerages setup parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs text-center shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Launch Readiness</span>
            <span className="text-lg font-bold text-slate-900 block mt-0.5 font-mono">{report?.readinessPercentage || 0}%</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs text-center shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Go-Live Blockers</span>
            <span className={`text-lg font-bold block mt-0.5 font-mono ${
              (report?.blockingFailuresCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {report?.blockingFailuresCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 pb-2 gap-2 select-none overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'readiness' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Launch Readiness</span>
        </button>

        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'wizard' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Setup Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('rechat')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rechat' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Rechat Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('dotloop')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'dotloop' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Dotloop Webhooks</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'mapping' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Data Mapping</span>
        </button>

        <button
          onClick={() => setActiveTab('runbook')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'runbook' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Cutover Runbook</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_ops')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'admin_ops' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('golive')}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'golive' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Go-Live Review</span>
        </button>
      </div>

      {/* Render Active Tab */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        {activeTab === 'readiness' && (
          <LaunchReadinessPanel 
            report={report} 
            onFixClick={(tabName) => setActiveTab(tabName as any)}
            onRefresh={fetchReadiness}
          />
        )}

        {activeTab === 'wizard' && (
          <CustomerLaunchWizard 
            onLaunchWorkspace={(config) => {
              if (onLaunchWorkspace) onLaunchWorkspace(config);
              fetchReadiness();
              setActiveTab('readiness');
            }}
          />
        )}

        {activeTab === 'rechat' && (
          <RechatLaunchSetupPanel 
            workspaceId={workspaceId} 
            onConfigChanged={fetchReadiness}
          />
        )}

        {activeTab === 'dotloop' && (
          <DotloopLaunchSetupPanel 
            workspaceId={workspaceId} 
            onConfigChanged={fetchReadiness}
          />
        )}

        {activeTab === 'mapping' && (
          <DataMappingCenter />
        )}

        {activeTab === 'runbook' && (
          <CustomerCutoverRunbook />
        )}

        {activeTab === 'admin_ops' && (
          <AdminOperationsDashboard />
        )}

        {activeTab === 'golive' && (
          <GoLiveReview 
            workspaceId={workspaceId} 
            report={report}
            state={state}
            onLaunched={() => {
              fetchReadiness();
              setActiveTab('readiness');
            }}
          />
        )}
      </div>

    </div>
  );
}
