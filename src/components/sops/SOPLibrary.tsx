import React, { useState } from 'react';
import { Plus, Search, Filter, Play, Eye, BookOpen, Clock, GitBranch, AlertCircle, Copy, Check, FileText } from 'lucide-react';
import { SOP_TEMPLATES } from './sopTemplates';

interface SOPLibraryProps {
  sops: any[];
  runs: any[];
  onStartCreate: () => void;
  onOpenStaffTemplate?: () => void;
  onSelectSop: (sop: any, tab: 'document' | 'process' | 'run') => void;
  onSelectRun: (run: any) => void;
  onCompareVersions: (verA: any, verB: any) => void;
  onSelectTemplate?: (template: any) => void;
  readOnly?: boolean;
}

export default function SOPLibrary({
  sops,
  runs,
  onStartCreate,
  onOpenStaffTemplate,
  onSelectSop,
  onSelectRun,
  onCompareVersions,
  onSelectTemplate,
  readOnly = false
}: SOPLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<'published' | 'tuesday_review' | 'draft' | 'template' | 'retired'>('published');
  const [deptFilter, setDeptFilter] = useState('all');

  // Multi-version select for comparison
  const [comparisonSopId, setComparisonSopId] = useState<string | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);

  const activeRunsCount = runs.filter(r => r.status === 'active' || r.status === 'running' || r.status === 'blocked').length;

  // Filter and collapse SOPs by logical sopId to prevent duplicate cards in the grid
  const collapsedSopsMap = new Map<string, any>();
  const sourceList = activeLibraryTab === 'template' 
    ? SOP_TEMPLATES 
    : activeLibraryTab === 'tuesday_review'
    ? sops.filter(s => s.status === 'draft' || s.status === 'needs_review' || s.finalApproverUserId === 'usr_ryan')
    : sops.filter(s => s.status === activeLibraryTab);

  const sortedSops = [...sourceList].sort((a, b) => {
    return parseFloat(b.version || '1.0') - parseFloat(a.version || '1.0');
  });

  sortedSops.forEach(sop => {
    const titleText = sop.title || sop.name || '';
    const matchesSearch = titleText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sop.purpose && sop.purpose.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = deptFilter === 'all' || sop.department === deptFilter;

    if (matchesSearch && matchesDept) {
      const key = sop.sopId || sop.id;
      if (!collapsedSopsMap.has(key)) {
        collapsedSopsMap.set(key, sop);
      }
    }
  });

  const uniqueSops = Array.from(collapsedSopsMap.values());

  const handleToggleComparison = (sopId: string, id: string) => {
    if (comparisonSopId !== sopId) {
      setComparisonSopId(sopId);
      setSelectedVersionIds([id]);
    } else {
      if (selectedVersionIds.includes(id)) {
        setSelectedVersionIds(selectedVersionIds.filter(v => v !== id));
      } else {
        if (selectedVersionIds.length < 2) {
          const next = [...selectedVersionIds, id];
          setSelectedVersionIds(next);
          if (next.length === 2) {
            const verA = sops.find(s => s.id === next[0]);
            const verB = sops.find(s => s.id === next[1]);
            onCompareVersions(verA, verB);
            setSelectedVersionIds([]);
            setComparisonSopId(null);
          }
        }
      }
    }
  };

  return (
    <div className="flex-grow p-4 md:p-6 text-left select-none relative overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* SOP vs Knowledge Banner */}
        <div id="sop-vs-knowledge-help" className="bg-[#003830]/90 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left font-sans">
          <div className="space-y-1 max-w-3xl">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>SOP Checklists vs Knowledge Documents</span>
            </h4>
            <p className="text-[11px] text-[#D0D6BB] leading-relaxed">
              <strong>SOP Checklists</strong> are step-by-step executable workflows assigned to team roles with SLAs and completion evidence.<br />
              <strong>Knowledge Documents</strong> are reference guides, PDFs, and policies ingested for AI answers and request routing lookup.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveLibraryTab('published')}
              className="px-3 py-1.5 bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              View Active SOPs ({sops.filter(s => s.status === 'published').length})
            </button>
          </div>
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
          {/* Library Tabs */}
          <div className="flex gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10">
            {[
              { id: 'published', label: 'Published' },
              { id: 'tuesday_review', label: 'Tuesday Review Queue (Ryan)' },
              { id: 'draft', label: 'Drafts' },
              { id: 'template', label: 'Templates' },
              { id: 'retired', label: 'Retired' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveLibraryTab(tab.id as any);
                  setComparisonSopId(null);
                  setSelectedVersionIds([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeLibraryTab === tab.id
                    ? 'bg-[#00635C] text-white shadow-md border border-white/15'
                    : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-black/30 border border-white/10 px-3.5 py-2 rounded-2xl w-60">
              <Search className="w-3.5 h-3.5 text-[#D0D6BB]/70" />
              <input
                type="text"
                placeholder="Search procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-[#D0D6BB]/40 w-full"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-2xl text-[10px] font-mono text-white p-2 outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
              <option value="Accounting">Accounting</option>
            </select>
          </div>
        </div>

        {/* Expanded Grid Cards */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueSops.map((sop) => {
              const needsSetup = sop.needsSetup || (sop.status === 'draft' && !sop.purpose);
              return (
                <div 
                  key={sop.id} 
                  className="rounded-[28px] p-6 hover:shadow-2xl transition-all flex flex-col justify-between h-[200px] text-left"
                  style={{
                    background: 'rgba(246, 247, 241, 0.10)',
                    border: '1px solid rgba(246, 247, 241, 0.18)',
                    backdropFilter: 'blur(18px)'
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                          sop.status === 'published' ? 'bg-emerald-500/10 text-emerald-300' : 
                          sop.status === 'draft' ? 'bg-amber-500/10 text-amber-300' : 'bg-stone-500/10 text-stone-300'
                        }`}>
                          {sop.status} {sop.version ? `v${sop.version}` : ''}
                        </span>
                        {needsSetup && (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-300 text-[8px] font-mono uppercase font-bold flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Needs Setup
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[#D0D6BB]/40 uppercase">{sop.department}</span>
                    </div>

                    <h4 className="font-serif font-black text-sm text-white mt-2 leading-snug truncate">{sop.title || sop.name}</h4>
                    <p className="text-[10px] font-sans text-[#D0D6BB]/60 leading-normal mt-1.5 h-[54px] overflow-hidden whitespace-normal line-clamp-3">
                      {sop.purpose || 'No purpose configured.'}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex justify-between items-center select-none text-[10px]">
                    {/* Compare Option */}
                    {sop.status === 'published' && activeLibraryTab === 'published' ? (
                      <label className="flex items-center gap-1.5 text-[#D0D6BB]/50 hover:text-white cursor-pointer font-mono text-[9px]">
                        <input
                          type="checkbox"
                          checked={comparisonSopId === sop.sopId && selectedVersionIds.includes(sop.id)}
                          onChange={() => handleToggleComparison(sop.sopId, sop.id)}
                          className="rounded border-white/15 bg-black/20"
                        />
                        Compare
                      </label>
                    ) : (
                      <span className="text-[9px] font-mono text-[#D0D6BB]/30">
                        {sop.steps ? `${sop.steps.length} Steps` : 'No steps'}
                      </span>
                    )}

                    <div className="flex gap-2">
                      {activeLibraryTab === 'template' ? (
                        <button
                          onClick={() => onSelectTemplate && onSelectTemplate(sop)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono text-[9px] uppercase cursor-pointer"
                        >
                          Use Template
                        </button>
                      ) : activeLibraryTab === 'draft' ? (
                        <>
                          <button
                            onClick={() => onSelectSop(sop, 'document')}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-mono text-[9px] uppercase cursor-pointer"
                          >
                            View Draft
                          </button>
                          <button
                            onClick={() => onSelectSop(sop, 'document')}
                            className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white font-mono text-[9px] uppercase cursor-pointer"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onSelectSop(sop, 'document')}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-mono text-[9px] uppercase cursor-pointer"
                          >
                            View Doc
                          </button>
                          <button
                            onClick={() => onSelectSop(sop, 'run')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] uppercase cursor-pointer flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" /> Start Run
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {uniqueSops.length === 0 && (
            <p className="text-xs text-[#D0D6BB]/30 py-16 text-center bg-[#012a23] border border-white/10 rounded-3xl font-mono">
              No Standard Operating Procedures found in this tab.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
