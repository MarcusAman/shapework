import React, { useState } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Truck, 
  HelpCircle,
  User,
  Plus,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

const initialInventory = [
  { id: 'inv_1', name: 'Yard Sign Post (Classic)', owned: 40, available: 4, assigned: 36, reorderThreshold: 10, monthlySpend: 180, vendor: 'Acme Signs Co.' },
  { id: 'inv_2', name: 'Open House Directionals', owned: 60, available: 12, assigned: 48, reorderThreshold: 15, monthlySpend: 120, vendor: 'Acme Signs Co.' },
  { id: 'inv_3', name: 'Electronic Lockbox (Bluetooth)', owned: 35, available: 2, assigned: 33, reorderThreshold: 8, monthlySpend: 250, vendor: 'SentriLock' }
];

const initialHoarders = [
  { id: 'h_1', agentName: 'Alex Carter', signsRetained: 8, listingsActive: 2, daysSinceUnused: 18, riskLevel: 'high' },
  { id: 'h_2', agentName: 'Todd Howard', signsRetained: 5, listingsActive: 1, daysSinceUnused: 12, riskLevel: 'medium' }
];

const initialActiveInstalls = [
  { id: 'ins_1', propertyAddress: '102 Pine Street', signType: 'Yard Sign Post (Classic)', status: 'delivered', installer: 'Acme Signs Co.', date: '2026-06-25' },
  { id: 'ins_2', propertyAddress: '209 Ridge Court', signType: 'Yard Sign Post (Classic)', status: 'pending_install', installer: 'Acme Signs Co.', date: '2026-07-02' }
];

export default function SignInventoryMonitor() {
  const [inventory, setInventory] = useState(initialInventory);
  const [hoarders, setHoarders] = useState(initialHoarders);
  const [installs, setInstalls] = useState(initialActiveInstalls);

  const handleRequestSign = (itemName: string) => {
    alert(`Yard sign request created. Reserved 1 ${itemName} in active inventory.`);
    setInventory(prev => prev.map(item => {
      if (item.name === itemName && item.available > 0) {
        return {
          ...item,
          available: item.available - 1,
          assigned: item.assigned + 1
        };
      }
      return item;
    }));
  };

  const handleNudgeHoarder = (agentName: string) => {
    alert(`Nudge SMS sent to ${agentName}: "Hi! Our records show you have signs not tied to active listings. Please return any spare posts to the office cabinet."`);
    setHoarders(prev => prev.filter(h => h.agentName !== agentName));
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* Alert indicators */}
      {inventory.some(item => item.available <= item.reorderThreshold) && (
        <div className="p-4 bg-warning-soft border border-warning/15 rounded-2xl flex items-start gap-3 text-xs text-warning leading-normal font-medium select-none">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase text-[10px]">Supply Shortage Warnings:</span>
            Yard signs and Bluetooth lockboxes are near or below the safety thresholds. Reorder tasks have been drafted.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Inventory Status & Installs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Inventory Table Card */}
          <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
            <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Physical Asset Ledger
              </span>
              <span className="text-[10px] text-text-tertiary">Real-time counts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-text-tertiary border-b border-border-soft/60 font-mono text-[9px] uppercase">
                    <th className="p-3">Sign Type</th>
                    <th className="p-3 text-center">Owned</th>
                    <th className="p-3 text-center">Available</th>
                    <th className="p-3 text-center">Assigned</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/60 font-medium">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/40">
                      <td className="p-3 text-text-primary font-bold">{item.name}</td>
                      <td className="p-3 text-center">{item.owned}</td>
                      <td className={`p-3 text-center font-bold ${item.available <= item.reorderThreshold ? 'text-risk-red' : 'text-success'}`}>
                        {item.available}
                      </td>
                      <td className="p-3 text-center">{item.assigned}</td>
                      <td className="p-3 text-text-secondary">{item.vendor}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRequestSign(item.name)}
                          disabled={item.available <= 0}
                          className="px-2.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          Reserve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Installations Tracker */}
          <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
            <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Installation & Field Orders
              </span>
              <span className="text-[10px] text-text-tertiary">Vendor status</span>
            </div>

            <div className="divide-y divide-border-soft">
              {installs.map((inst) => (
                <div key={inst.id} className="p-4 flex items-center justify-between text-xs font-medium">
                  <div className="space-y-0.5">
                    <span className="font-bold text-text-primary">{inst.propertyAddress}</span>
                    <p className="text-[10px] text-text-tertiary">{inst.signType} · Dispatch: {inst.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      inst.status === 'delivered' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning animate-pulse'
                    }`}>
                      {inst.status.replace('_', ' ')}
                    </span>
                    {inst.status === 'pending_install' && (
                      <button
                        onClick={() => {
                          setInstalls(prev => prev.map(i => i.id === inst.id ? { ...i, status: 'delivered' } : i));
                        }}
                        className="px-2.5 py-1 border border-border-medium hover:bg-stone-50 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Confirm Install
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Hoarding Risks */}
        <div className="lg:col-span-1 bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
          <div className="border-b border-border-soft pb-2">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              Asset Hoarding Alerts
            </span>
            <p className="text-[10px] text-text-secondary mt-0.5">Spare signs held in agent garages beyond SLA limits</p>
          </div>

          <div className="space-y-3">
            {hoarders.length > 0 ? (
              hoarders.map((hoarder) => (
                <div key={hoarder.id} className="p-3.5 bg-stone-50 border border-border-subtle rounded-xl text-xs space-y-2 font-medium">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-text-primary">{hoarder.agentName}</span>
                    <span className="text-[8px] font-bold uppercase bg-risk-red-soft text-risk-red px-1.5 py-0.2 rounded">
                      {hoarder.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-text-secondary leading-normal">
                    Retaining <strong className="text-text-primary">{hoarder.signsRetained} yard signs</strong> with only <strong className="text-text-primary">{hoarder.listingsActive} active listing(s)</strong>.
                    Unused for {hoarder.daysSinceUnused} days.
                  </p>
                  <div className="pt-2 border-t border-border-subtle/50 flex justify-end">
                    <button
                      onClick={() => handleNudgeHoarder(hoarder.agentName)}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Nudge Agent for spare signs
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-text-tertiary italic">
                All spares returned. No hoarding warnings detected.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
