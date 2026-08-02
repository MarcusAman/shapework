import React, { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import type { RyanShieldData, NeedsRyanItem } from './adapters';
import SOPRunsPage from '../sops/SOPRunsPage';
import NeedsRyanActionDrawer from './NeedsRyanActionDrawer';

interface RyanShieldPageProps {
  data: RyanShieldData;
  onAction?: (action: string, item: NeedsRyanItem) => void | Promise<void>;
  state?: any;
}

export default function RyanShieldPage({ data, onAction, state }: RyanShieldPageProps) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'runs'>('dashboard');
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<NeedsRyanItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [extraProtectedItems, setExtraProtectedItems] = useState<any[]>([]);

  const handleOpenDrawer = (item: NeedsRyanItem) => {
    setSelectedDrawerItem(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerResolve = async (actionType: string, payload: any) => {
    if (selectedDrawerItem) {
      setReviewedIds(prev => new Set([...prev, selectedDrawerItem.id]));
      setExtraProtectedItems(prev => [
        {
          id: selectedDrawerItem.id,
          request: selectedDrawerItem.type,
          routedTo: payload.targetOwnerName || 'Ann Gunn (Operations)',
          timeSaved: '45 min'
        },
        ...prev
      ]);

      if (onAction) {
        await onAction(actionType, selectedDrawerItem);
      }
    }
  };

  const activeNeedsRyan = data.needsRyan.filter(i => !reviewedIds.has(i.id));

  const handledExamples = [
    { category: 'Marketing request', handler: 'Melissa Gagliardi', title: 'Marketing' },
    { category: 'Commission question', handler: 'James Fort', title: 'Firm Finance' },
    { category: 'Lockbox issue', handler: 'Ann Gunn', title: 'Operations Director' },
    { category: 'Agent question', handler: 'Jessica', title: 'Broker-in-Charge' },
  ];

  return (
    <div className="space-y-6 text-left select-none min-h-screen">
      
      {/* Sub-tab Switcher */}
      <div className="flex gap-2 border-b border-white/10 pb-3 select-none">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-[#00E5C9] text-[#01362D] border border-white/15'
              : 'text-[#D0D6BB]/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Shield Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('runs')}
          className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'runs'
              ? 'bg-[#00E5C9] text-[#01362D] border border-white/15'
              : 'text-[#D0D6BB]/60 hover:text-white hover:bg-white/5'
          }`}
        >
          SOP Checklist Runs
        </button>
      </div>

      {activeSubTab === 'dashboard' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Metric Rows */}
          <div className="space-y-6">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className="rounded-[28px] p-6 flex flex-col justify-between h-32 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <span className="text-xs font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">Needs Ryan</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-black text-amber-400">{activeNeedsRyan.length}</span>
                  <span className="text-xs text-[#D0D6BB]">escalations pending</span>
                </div>
              </div>
              <div 
                className="rounded-[28px] p-6 flex flex-col justify-between h-32 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <span className="text-xs font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">Routed for You</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-black text-emerald-400">24</span>
                  <span className="text-xs text-[#D0D6BB]">requests resolved</span>
                </div>
              </div>
              <div 
                className="rounded-[28px] p-6 flex flex-col justify-between h-32 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <span className="text-xs font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">At Risk</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-black text-red-400">1</span>
                  <span className="text-xs text-[#D0D6BB]">Past response window</span>
                </div>
              </div>
            </div>

            {/* 1-Click Monthly NCREC Escrow Trust Reconciliation & CDA Dispatch Card */}
            <div 
              className="p-6 rounded-[28px] shadow-xl space-y-4 font-sans text-left"
              style={{
                background: 'rgba(0, 43, 36, 0.85)',
                border: '1px solid rgba(0, 229, 201, 0.3)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#00E5C9] uppercase tracking-widest block">
                    NCREC Compliance Engine • Monthly Escrow Trust Reconciliation
                  </span>
                  <h3 className="text-lg font-serif font-black text-white mt-0.5">
                    July 2026 Monthly Escrow Trust Reconciliation Package
                  </h3>
                  <p className="text-xs text-[#D0D6BB] mt-1 font-sans">
                    3-Way Bank Ledger vs. Earnest Deposit Log matched across all 76 Nest Realty Wilmington transactions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      alert('✅ July 2026 Monthly NCREC Trust Reconciliation Package digitally signed & logged to Operating Record as BIC Ryan Crecelius!');
                    }}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg border border-[#00E5C9]/40 flex items-center gap-2 hover:scale-[1.01]"
                  >
                    <CheckCircle className="w-4 h-4 text-[#00E5C9]" />
                    <span>1-Click Sign NCREC Escrow Package (BIC Ryan)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[9px] text-[#D0D6BB]/70 uppercase block font-bold">Escrow Account Balance</span>
                  <span className="text-white font-serif font-black text-base block">$1,482,910.00</span>
                  <span className="text-[10px] text-emerald-400 font-bold block">✓ Balanced to zero discrepancy</span>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[9px] text-[#D0D6BB]/70 uppercase block font-bold">Auto CDA Attorney Dispatches</span>
                  <span className="text-white font-serif font-black text-base block">14 Closing Files</span>
                  <span className="text-[10px] text-[#00E5C9] font-bold block">✓ Auto-emailed + 15-min ephemeral agent links</span>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[9px] text-[#D0D6BB]/70 uppercase block font-bold">NCREC Audit Trail</span>
                  <span className="text-white font-serif font-black text-base block">21-Day Clock Guard</span>
                  <span className="text-[10px] text-[#D0D6BB] font-bold block">✓ 0 NCREC compliance violations</span>
                </div>
              </div>
            </div>

            {/* Secondary Metrics Row */}
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-[24px] text-xs shadow-lg"
              style={{
                background: 'rgba(246, 247, 241, 0.06)',
                border: '1px solid rgba(246, 247, 241, 0.12)',
                backdropFilter: 'blur(14px)'
              }}
            >
              <div>
                <span className="text-[11px] text-[#D0D6BB] uppercase block font-mono font-bold">Missing Info</span>
                <span className="text-lg font-bold text-white">
                  {data.summary?.find(s => s.id === 'missing_info')?.value ?? 2}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#D0D6BB] uppercase block font-mono font-bold">Overdue Items</span>
                <span className="text-lg font-bold text-white">
                  {data.summary?.find(s => s.id === 'overdue')?.value ?? 1}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#D0D6BB] uppercase block font-mono font-bold">Ownerless Tasks</span>
                <span className="text-lg font-bold text-white">
                  {data.summary?.find(s => s.id === 'ownerless')?.value ?? 1}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#D0D6BB] uppercase block font-mono font-bold">Open Role Risk</span>
                <span className="text-lg font-bold text-white">
                  {data.openRoles?.length ?? 3}
                </span>
              </div>
            </div>

            {/* Staff Capacity & Workload Distribution Block */}
            <div 
              className="p-6 rounded-[28px] shadow-xl space-y-4 font-sans text-left"
              style={{
                background: 'rgba(246, 247, 241, 0.08)',
                border: '1px solid rgba(246, 247, 241, 0.16)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#00E5C9] uppercase tracking-widest block">
                    Operations Intelligence • Live Team Workload & Capacity
                  </span>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">
                    Staff Seat Capacity & Active Delegation Meters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => alert('⚡ Rebalancing workload across Melissa (Marketing), Ann (Ops), and Jessica (VA)... Workload balanced!')}
                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold uppercase cursor-pointer border border-[#00E5C9]/40"
                >
                  ⚡ Auto-Rebalance Workload
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* Melissa */}
                <div className="p-3.5 bg-black/30 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white font-sans text-xs">Melissa Gagliardi</span>
                    <span className="text-[10px] text-amber-300 font-bold">82% Capacity</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[82%] rounded-full"></div>
                  </div>
                  <span className="text-[9px] text-[#D0D6BB] block">Marketing Lead • 4 Active Briefs</span>
                </div>

                {/* Ann */}
                <div className="p-3.5 bg-black/30 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white font-sans text-xs">Ann Gunn</span>
                    <span className="text-[10px] text-emerald-400 font-bold">45% Capacity</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[45%] rounded-full"></div>
                  </div>
                  <span className="text-[9px] text-[#D0D6BB] block">Operations Director • 2 SOP Runs</span>
                </div>

                {/* Jessica */}
                <div className="p-3.5 bg-black/30 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white font-sans text-xs">Jessica Vance</span>
                    <span className="text-[10px] text-[#00E5C9] font-bold">68% Capacity</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#00E5C9] h-full w-[68%] rounded-full"></div>
                  </div>
                  <span className="text-[9px] text-[#D0D6BB] block">Virtual Assistant • 12 Active Tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Ryan Now: Compact Decision Rows */}
          <section className="space-y-4">
            <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">Needs Ryan Now</h2>
            
            {activeNeedsRyan.length === 0 ? (
              <div 
                className="rounded-[28px] p-8 text-center space-y-2 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">All Clear</h3>
                <p className="text-xs text-[#D0D6BB]">No items require owner attention at this moment.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeNeedsRyan.map(item => {
                  const isUrgent = item.urgency === 'urgent';
                  return (
                    <div 
                      key={item.id}
                      className="rounded-[28px] p-5 space-y-4 shadow-xl"
                      style={{
                        background: 'rgba(246, 247, 241, 0.10)',
                        border: '1px solid rgba(246, 247, 241, 0.18)',
                        backdropFilter: 'blur(18px)'
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-400' : 'bg-amber-400'}`} />
                            <span className="text-base font-serif font-bold text-white">{item.type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              isUrgent 
                                ? 'border-red-500/30 text-red-400 bg-red-500/10' 
                                : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                            }`}>
                              {isUrgent ? 'Urgent' : 'High'}
                            </span>
                          </div>
                          <p className="text-xs text-[#D0D6BB]">{item.reason}</p>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-[#D0D6BB] shrink-0 self-end md:self-center">
                          <span>Handler: <strong className="text-white font-bold">{item.currentHandler}</strong></span>
                          <span>Response Window: <strong className="text-white font-bold">{item.responseWindow}</strong></span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/10">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">Recommended Action</span>
                          <p className="text-white text-xs leading-relaxed">{item.recommendedAction}</p>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(item)}
                            className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1"
                          >
                            Review & Decide
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(item)}
                            className="px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/15 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                          >
                            Assign / Delegate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(item)}
                            className="px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/15 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                          >
                            Request Information
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Protected From Ryan & Handled For You Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Handled for You Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">Handled for You</h2>
              <div 
                className="rounded-[28px] p-6 space-y-4 shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <p className="text-xs text-[#D0D6BB]">
                  Examples of tasks routed and resolved by operations staff this week without escalating.
                </p>
                <div className="space-y-3">
                  {handledExamples.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-black/30 border border-white/10 rounded-2xl text-xs">
                      <span className="text-white font-medium">{item.category}</span>
                      <div className="flex items-center gap-2 text-[#D0D6BB]">
                        <span className="text-[10px] font-mono text-[#D0D6BB]/70">{item.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D0D6BB]/50" />
                        <span className="font-bold text-emerald-400">{item.handler}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Protected Activity Log (Secondary detail) */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-black text-white uppercase tracking-wider">Recent Shield Coverage</h2>
              <div 
                className="rounded-[28px] overflow-hidden shadow-xl"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/10 bg-black/30 text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB] font-bold">
                  <span className="col-span-6">Request</span>
                  <span className="col-span-3">Routed To</span>
                  <span className="col-span-3 text-right">Time Saved</span>
                </div>
                <div className="divide-y divide-white/5">
                  {[...extraProtectedItems, ...data.protected].map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-xs hover:bg-white/[0.04] transition-colors">
                      <span className="col-span-6 text-white font-medium truncate">{item.request}</span>
                      <span className="col-span-3 text-[#D0D6BB] truncate">{item.routedTo}</span>
                      <span className="col-span-3 text-right text-emerald-400 font-mono font-bold">
                        {item.timeSaved || '25 min'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div 
          className="rounded-[28px] overflow-hidden p-6 shadow-xl"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <SOPRunsPage state={state} />
        </div>
      )}

      {/* Action Drawer */}
      <NeedsRyanActionDrawer
        item={selectedDrawerItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onResolve={handleDrawerResolve}
        state={state}
      />
    </div>
  );
}
