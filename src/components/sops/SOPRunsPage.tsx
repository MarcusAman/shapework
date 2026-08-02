import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, Play, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface SOPRunsPageProps {
  state: any;
}

export default function SOPRunsPage({ state }: SOPRunsPageProps) {
  const wsId = state.workspaceId || 'nest-realty-demo';
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
      const myRole = state.activeProfile?.role;
      const myEmail = state.activeProfile?.email;
      const isAssignedToMe = run.assigneeEmail === myEmail || run.assigneeRole === myRole;
      if (!isAssignedToMe) return false;
    } else if (activeTab === 'active') {
      if (run.status !== 'active' && run.status !== 'running') return false;
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
    // Sync browser URL to let SOPStudio focus this run
    const prefix = window.location.pathname.startsWith('/demo') ? '/demo' : '/app';
    window.history.pushState({}, '', `${prefix}/sops/runs/${run.id}`);
    state.setCurrentTab('SOP Studio');
  };

  return (
    <div className="flex-grow p-4 md:p-6 text-left select-none relative overflow-y-auto min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div 
          className="rounded-[28px] p-6 text-left shadow-xl"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <h2 className="font-serif font-black text-2xl text-white uppercase tracking-wider">SOP Runs</h2>
          <p className="text-xs text-[#D0D6BB] mt-1 font-sans">
            Monitor active runs, exception states, and execution histories of standard operating procedures.
          </p>
        </div>

        {/* Tab switchers & Toolbar */}
        <div 
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-[28px] shadow-xl"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="flex gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
            {[
              { id: 'me', label: 'Assigned to Me' },
              { id: 'active', label: 'Active Runs' },
              { id: 'blocked', label: 'Blocked' },
              { id: 'attention', label: 'Needs Attention' },
              { id: 'completed', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#00635C] text-white shadow-md border border-white/15'
                    : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-black/30 border border-white/10 px-3.5 py-2 rounded-2xl w-60">
            <Search className="w-3.5 h-3.5 text-[#D0D6BB]/70" />
            <input
              type="text"
              placeholder="Search active runs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-[#D0D6BB]/40 w-full"
            />
          </div>
        </div>

        {/* Runs List Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-xs text-[#D0D6BB]/60 font-mono animate-pulse">
              Fetching operational run logs...
            </div>
          ) : filteredRuns.length === 0 ? (
            <p 
              className="text-xs text-[#D0D6BB] py-16 text-center rounded-[28px] font-mono shadow-xl"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              No SOP checklist executions match these filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRuns.map((run) => {
                const currentStepObj = run.steps?.[run.currentStepIdx || 0];
                const overdue = run.status === 'overdue' || run.isOverdue;
                const hasEvidence = run.steps?.some((s: any) => s.evidenceProvided);

                return (
                  <div 
                    key={run.id} 
                    className="rounded-[28px] p-6 hover:shadow-2xl transition-all flex flex-col justify-between h-[220px] text-left"
                    style={{
                      background: 'rgba(246, 247, 241, 0.10)',
                      border: '1px solid rgba(246, 247, 241, 0.18)',
                      backdropFilter: 'blur(18px)'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                            run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300' :
                            run.status === 'blocked' ? 'bg-red-500/10 text-red-300' :
                            overdue || run.isSlaBreached ? 'bg-amber-500/10 text-amber-300' : 'bg-blue-500/10 text-blue-300'
                          }`}>
                            {run.status} {overdue || run.isSlaBreached ? '(SLA Overdue)' : ''}
                          </span>
                          {run.escalationLevel === 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 text-[8px] font-mono uppercase font-bold">
                              Backup Assigned
                            </span>
                          )}
                          {run.escalationLevel === 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[8px] font-mono uppercase font-bold">
                              Needs Ryan
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] font-mono text-[#D0D6BB]/40">v{run.sopVersion || '1.0'}</span>
                      </div>

                      <h4 className="font-serif font-black text-sm text-white mt-2 leading-snug truncate">{run.title}</h4>
                      
                      <div className="mt-3 space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-[#D0D6BB]/40 font-sans">Assignee:</span>
                          <span className="text-white font-medium">{run.assigneeName || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#D0D6BB]/40 font-sans">Current Step:</span>
                          <span className="text-white font-medium truncate max-w-[150px]">
                            {currentStepObj ? `${run.currentStepIdx + 1}. ${currentStepObj.title}` : 'Completed'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#D0D6BB]/40 font-sans">Follow-up due:</span>
                          <span className="text-amber-300 font-semibold">{run.escalationBehavior?.expectedResponse || 'Expected within 24h'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#D0D6BB]/40 font-sans">Evidence:</span>
                          <span className={hasEvidence ? 'text-emerald-400 font-medium font-sans' : 'text-stone-400 font-sans'}>
                            {hasEvidence ? 'Submitted' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 flex justify-between items-center select-none text-[10px]">
                      <span className="text-[8px] font-mono text-[#D0D6BB]/30">
                        Started {new Date(run.startedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleOpenRun(run)}
                        className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg font-mono text-[9px] uppercase cursor-pointer flex items-center gap-1"
                      >
                        Open Checklist <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
