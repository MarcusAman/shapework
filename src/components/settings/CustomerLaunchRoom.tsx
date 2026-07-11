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
      <div className="flex flex-wrap justify-between items-center gap-4 bg-surface border border-border-soft rounded-3xl p-6 shadow-sm select-none">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-primary" />
            <h2 className="font-serif font-bold text-text-primary text-base">Customer Onboarding & Launch Room</h2>
          </div>
          <p className="text-text-tertiary max-w-xl">
            Operational dashboard to orchestrate, analyze, and validate real real estate brokerages setup parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-stone-50 border border-border-soft rounded-2xl px-4 py-2.5 shadow-sm text-center shrink-0">
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Launch Readiness</span>
            <span className="text-lg font-serif font-bold text-text-primary block mt-0.5">{report?.readinessPercentage || 0}%</span>
          </div>

          <div className="bg-stone-50 border border-border-soft rounded-2xl px-4 py-2.5 shadow-sm text-center shrink-0">
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Go-Live Blockers</span>
            <span className={`text-lg font-serif font-bold block mt-0.5 ${
              (report?.blockingFailuresCount || 0) > 0 ? 'text-red-650' : 'text-text-primary'
            }`}>
              {report?.blockingFailuresCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-border-soft pb-2 gap-2 select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'readiness' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Launch Readiness</span>
        </button>

        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'wizard' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Setup Wizard</span>
        </button>

        <button
          onClick={() => setActiveTab('rechat')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rechat' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Rechat Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('dotloop')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'dotloop' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Dotloop Webhooks</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'mapping' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Data Mapping</span>
        </button>

        <button
          onClick={() => setActiveTab('runbook')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'runbook' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Cutover Runbook</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_ops')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'admin_ops' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('golive')}
          className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'golive' ? 'bg-brand-primary text-white shadow-sm' : 'hover:bg-stone-150 text-text-secondary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Go-Live Review</span>
        </button>
      </div>

      {/* Render Active Tab */}
      <div className="bg-surface border border-border-soft rounded-3xl p-6 shadow-sm">
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
