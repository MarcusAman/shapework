/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Compass, Play, Database, CheckCircle2, 
  X, ShieldAlert, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

interface Mission {
  id: string;
  name: string;
  purpose: string;
  schedule: string;
  dataSources: string[];
  lastRun: string;
  findings: string;
  actionsPrepared: number;
  approvalsNeeded: number;
}

export default function AICOOMissions() {
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [runningMissionId, setRunningMissionId] = useState<string | null>(null);
  
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'm_1',
      name: 'Daily Operations Briefing Sweep',
      purpose: 'Aggregates overnight activities, risk updates, and coordination delays across all active escrows.',
      schedule: 'Daily, 7:00 AM EST',
      dataSources: ['Rechat Database', 'Gmail API logs', 'Dotloop Loops'],
      lastRun: 'Today, 7:00 AM',
      findings: 'Processed 12 active transactions. Found 3 attention items. Prepared morning briefs.',
      actionsPrepared: 3,
      approvalsNeeded: 1
    },
    {
      id: 'm_2',
      name: 'Closing Risk Sweep',
      purpose: 'Audits escrow files closing within the next 14 days for outstanding documents or lender delays.',
      schedule: 'Every 6 hours',
      dataSources: ['Rechat MLS', 'Gmail API', 'Google Drive'],
      lastRun: '2 hours ago',
      findings: '3 deals audited. Overdue financing detected on Colonial Ave. Suggested agent contact.',
      actionsPrepared: 1,
      approvalsNeeded: 1
    },
    {
      id: 'm_3',
      name: 'Listing Launch Sweep',
      purpose: 'Audits properties launching within 7 days for missing marketing, disclosure, or compliance files.',
      schedule: 'Daily, 8:00 AM EST',
      dataSources: ['Rechat Directory', 'Dotloop PDF folders'],
      lastRun: 'Today, 8:00 AM',
      findings: '4 pending listings inspected. Identified missing seller disclosures on Baker Street.',
      actionsPrepared: 2,
      approvalsNeeded: 0
    },
    {
      id: 'm_4',
      name: 'Agent Follow-Up Sweep',
      purpose: 'Scans deal files to identify agents with overdue task lists or unresolved lender comments.',
      schedule: 'Daily, 9:00 AM EST',
      dataSources: ['Gmail threads', 'shapework Checklist logs'],
      lastRun: 'Today, 9:00 AM',
      findings: 'Roster agents checked. Actions generated to send secure link reminders.',
      actionsPrepared: 2,
      approvalsNeeded: 2
    },
    {
      id: 'm_5',
      name: 'Integration Health Sweep',
      purpose: 'Validates API credentials, webhooks, and rate limits for connected transaction platforms.',
      schedule: 'Every hour',
      dataSources: ['OAuth credentials', 'Webhook Status Check'],
      lastRun: '15 minutes ago',
      findings: 'All connections verified. 4 REST endpoints operational.',
      actionsPrepared: 0,
      approvalsNeeded: 0
    }
  ]);

  const handleRunMission = (id: string) => {
    setRunningMissionId(id);
    setTimeout(() => {
      setRunningMissionId(null);
      setMissions(prev => prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            lastRun: 'Just now',
            findings: `Diagnostic sweep complete. Audited all related channels successfully. Systems verified.`
          };
        }
        return m;
      }));
    }, 1200);
  };

  const recommendedMission = missions.find(m => m.id === 'm_2') || missions[0];
  const otherMissions = missions.filter(m => m.id !== recommendedMission.id);
  const selectedMission = missions.find(m => m.id === selectedMissionId);
  const isRecommendedRunning = runningMissionId === recommendedMission.id;

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-brand-primary">
          <Compass className="w-5 h-5" />
          <h2 className="text-base font-bold uppercase tracking-wider">AI COO Task Directory</h2>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Configure background routines that scan channels, analyze files, and stage necessary approval decisions.
        </p>
      </div>

      {/* Spotlit Recommended Mission */}
      <div className="bg-brand-soft/20 border border-brand-primary/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider bg-brand-soft px-2 py-0.5 rounded">
            ★ RECOMMENDED TASK TO RUN NEXT
          </span>
          <span className="text-[10px] text-text-tertiary font-medium">Schedule: {recommendedMission.schedule}</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-lg text-text-primary">{recommendedMission.name}</h3>
          <p className="text-xs text-text-secondary leading-relaxed max-w-2xl font-medium">
            {recommendedMission.purpose} Why it matters: Prevents missing critical contract deadlines and keeps the closing escrow sequence moving smoothly.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center pt-2">
          <button
            onClick={() => handleRunMission(recommendedMission.id)}
            disabled={isRecommendedRunning}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isRecommendedRunning ? 'animate-spin' : ''}`} />
            <span>{isRecommendedRunning ? 'Running Task...' : 'Run Recommended Task'}</span>
          </button>
          <button
            onClick={() => setSelectedMissionId(recommendedMission.id)}
            className="px-4 py-2.5 border border-border-medium hover:bg-white text-text-secondary rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            View Detailed Logs
          </button>
        </div>
      </div>

      {/* Other Scheduled Sweeps list */}
      <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
        <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted">
          <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
            Scheduled Tasks Directory
          </span>
        </div>

        <div className="divide-y divide-border-soft">
          {otherMissions.map((mission) => {
            const isRunning = runningMissionId === mission.id;
            return (
              <div 
                key={mission.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-text-primary text-sm">{mission.name}</h4>
                    <span className="text-[9px] text-text-tertiary font-mono bg-stone-100 px-1.5 py-0.2 rounded">
                      {mission.schedule}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-normal line-clamp-1 font-medium">{mission.purpose}</p>
                  <p className="text-[10px] text-text-tertiary font-mono">Last Run: {mission.lastRun} • Findings: {mission.findings}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-[10px] text-text-tertiary font-mono text-right hidden sm:block">
                    {mission.actionsPrepared} actions prepared
                  </div>
                  <button
                    onClick={() => handleRunMission(mission.id)}
                    className="bg-stone-100 hover:bg-brand-soft text-text-secondary hover:text-brand-primary p-2 rounded-lg transition-colors flex items-center justify-center"
                    title="Run Sweep"
                  >
                    <Play className={`w-3.5 h-3.5 fill-text-secondary ${isRunning ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setSelectedMissionId(mission.id)}
                    className="p-2 border border-border-soft hover:bg-stone-50 text-text-tertiary rounded-lg text-xs font-mono font-bold transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-out details drawer */}
      {selectedMission && (
        <div className="fixed inset-0 overflow-hidden z-50 flex justify-end">
          <div 
            onClick={() => setSelectedMissionId(null)}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
          />

          <div className="w-full max-w-md bg-surface border-l border-border-subtle shadow-xl flex flex-col h-full relative z-10">
            {/* Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="font-serif font-bold text-sm text-text-primary">{selectedMission.name}</h3>
                  <p className="text-[10px] text-text-secondary">COO Audit logs & operations log</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMissionId(null)}
                className="text-text-secondary hover:text-text-primary border border-border-soft p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content logs */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Task Purpose</span>
                <p className="text-xs text-text-secondary leading-relaxed font-medium bg-stone-50 p-3 rounded-xl border border-border-subtle/50">
                  {selectedMission.purpose}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Data Sources Audited</span>
                <div className="space-y-1.5 text-xs">
                  {selectedMission.dataSources.map((ds, idx) => (
                    <div key={idx} className="flex items-center gap-2 font-medium">
                      <Database className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{ds}</span>
                      <span className="text-[9px] text-success font-bold bg-success-soft px-1.5 py-0.2 rounded ml-auto">Connected</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Execution Logs</span>
                <div className="p-3.5 border border-border-subtle bg-secondary-surface rounded-xl text-[11px] space-y-2 text-text-secondary leading-relaxed">
                  <div>[7:00:01 AM] Starting routine task scan...</div>
                  <div>[7:00:02 AM] Fetching credentials for connected APIs...</div>
                  <div>[7:00:03 AM] Processing active transaction file logs...</div>
                  <div>[7:00:04 AM] Scanning folders...</div>
                  <div className="text-brand-primary font-bold">[7:00:06 AM] Scanning complete. Prepared follow-up actions.</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border-subtle bg-secondary-surface flex gap-3">
              <button
                onClick={() => handleRunMission(selectedMission.id)}
                className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Run Task Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
