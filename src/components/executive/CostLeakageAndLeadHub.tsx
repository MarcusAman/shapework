/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CostLeakageAndLeadHub
 * Consolidates:
 * - [15] Cost Leakage Alerts Auditor
 * - [13] Geographic Lead Routing Dispatch Matrix
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign, MapPin, AlertCircle, ShieldAlert, CheckCircle2,
  Users, ToggleLeft, ToggleRight, RefreshCw, X, ArrowUpRight,
  ShieldCheck, Building, UserCheck
} from 'lucide-react';
import type { CostLeakageAlert, LeadRoutingTerritory } from '../../../server/persistence/opportunityRegisterRepository';

export const CostLeakageAndLeadHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leakage' | 'leads'>('leakage');
  const [leakages, setLeakages] = useState<CostLeakageAlert[]>([]);
  const [territories, setTerritories] = useState<LeadRoutingTerritory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispute / Resolve Modal
  const [selectedLeakage, setSelectedLeakage] = useState<CostLeakageAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('Disputed duplicate invoice with vendor billing desk; full credit applied.');
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resLeak, resTerr] = await Promise.all([
        fetch('/api/executive/cost-leakage').then(r => r.json()),
        fetch('/api/leads/routing-matrix').then(r => r.json())
      ]);

      if (resLeak.success) setLeakages(resLeak.leakages);
      if (resTerr.success) setTerritories(resTerr.territories);
    } catch (err) {
      console.error('Failed to load cost leakage & lead data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveLeakage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeakage) return;
    try {
      setResolving(true);
      const res = await fetch(`/api/executive/cost-leakage/${selectedLeakage.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNote })
      });
      const data = await res.json();
      if (data.success) {
        setLeakages(prev => prev.map(l => l.id === selectedLeakage.id ? data.alert : l));
        setSelectedLeakage(null);
      }
    } catch (err) {
      console.error('Failed to resolve cost leakage:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleToggleAgentAvailability = async (submarketId: string, agentId: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/leads/routing-matrix/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submarketId, agentId, isAvailable: !currentVal })
      });
      const data = await res.json();
      if (data.success) {
        setTerritories(prev => prev.map(t => t.submarketId === submarketId ? data.territory : t));
      }
    } catch (err) {
      console.error('Failed to toggle agent availability:', err);
    }
  };

  const totalActiveLeakageAmount = leakages
    .filter(l => l.status === 'active_leakage')
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6 text-left select-none font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 text-[11px] font-semibold tracking-wide">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              <span>Executive Cost & Lead Controls</span>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 mt-1.5">
            Cost Leakage Alerts & Geographic Lead Dispatch
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-3xl leading-relaxed">
            Automated vendor fee anomaly auditing and geographic territory lead dispatch with on-duty agent round-robin.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('leakage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'leakage' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost Leakage Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'leads' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Lead Routing Matrix</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 font-sans space-y-2">
          <RefreshCw className="w-6 h-6 text-stone-400 animate-spin mx-auto" />
          <div className="text-xs font-semibold">Loading Cost Leakage & Territory Controls...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: COST LEAKAGE ALERTS */}
          {activeTab === 'leakage' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F8F5] rounded-2xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-stone-900">Automated Expense Anomaly Engine</div>
                  <div className="text-[11px] text-stone-500">
                    Scans vendor invoices, sign post rental schedules, and co-op splits to flag fee leakage.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-rose-700">${totalActiveLeakageAmount.toFixed(2)}</div>
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">ACTIVE LEAKAGE DETECTED</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {leakages.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 bg-white rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                      alert.status === 'resolved_refunded' ? 'border-stone-200 opacity-70' : 'border-rose-200 ring-1 ring-rose-50'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          alert.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.riskLevel} Risk
                        </span>
                        <span className="font-bold text-stone-900 text-sm truncate">{alert.title}</span>
                        <span className="text-stone-400 font-medium">• {alert.vendorOrService}</span>
                      </div>

                      {alert.propertyAddress && (
                        <div className="text-[11px] text-stone-500 font-medium">
                          Property: {alert.propertyAddress}
                        </div>
                      )}

                      <p className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-100 leading-relaxed font-medium">
                        Root Cause: {alert.rootCause}
                      </p>

                      {alert.resolutionNote && (
                        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{alert.resolutionNote}</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 text-right">
                      <div>
                        <div className="font-mono text-base font-bold text-rose-700">
                          ${alert.amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase font-semibold">
                          {alert.frequency.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {alert.status === 'resolved_refunded' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-[10px] border border-emerald-100">
                          ✓ Settled & Credited
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedLeakage(alert)}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                        >
                          Dispute & Settle
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GEOGRAPHIC LEAD ROUTING MATRIX */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#00635C]" />
                      <span>Submarket Territory Lead Dispatch</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Submarket territory routing with on-duty availability switches and round-robin balancing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {territories.map((terr) => (
                    <div key={terr.submarketId} className="p-4 bg-[#F7F8F5] rounded-2xl border border-stone-200 space-y-3 text-xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {terr.county} County
                          </span>
                          <span className="font-mono text-[11px] font-bold text-stone-700">
                            {terr.monthlyLeadsRoutedCount} Routed
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif font-bold text-sm text-stone-900">{terr.submarketName}</h3>
                          <p className="text-[11px] text-stone-500 uppercase font-semibold mt-0.5">Focus: {terr.leadType.replace(/_/g, ' ')}</p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Agents on Duty:</div>
                          <div className="divide-y divide-stone-200/60 border border-stone-200 rounded-xl bg-white overflow-hidden">
                            {terr.activeAgentsOnDuty.map((agent) => (
                              <div key={agent.agentId} className="p-2 flex items-center justify-between text-[11px]">
                                <div>
                                  <div className="font-semibold text-stone-900">{agent.agentName}</div>
                                  <div className="text-[10px] text-stone-400">{agent.office} • {agent.leadsAssignedMonth} leads this mo</div>
                                </div>
                                <button
                                  onClick={() => handleToggleAgentAvailability(terr.submarketId, agent.agentId, agent.isAvailable)}
                                  className="cursor-pointer text-stone-600 hover:text-stone-900 transition-colors"
                                  title="Toggle Duty Status"
                                >
                                  {agent.isAvailable ? (
                                    <ToggleRight className="w-6 h-6 text-[#00635C]" />
                                  ) : (
                                    <ToggleLeft className="w-6 h-6 text-stone-300" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/60 text-[10px] text-stone-500 font-medium flex items-center justify-between">
                        <span>Mode: {terr.rotationMode.replace(/_/g, ' ')}</span>
                        <span>Last: <strong className="text-stone-800">{terr.lastDispatchedAgentName}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: DISPUTE COST LEAKAGE */}
      {selectedLeakage && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-stone-900">Resolve Cost Anomaly (${selectedLeakage.amount.toFixed(2)})</h3>
              </div>
              <button onClick={() => setSelectedLeakage(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveLeakage} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  ANOMALY DETAILS
                </label>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                  <div className="font-bold text-stone-900">{selectedLeakage.title}</div>
                  <div className="text-stone-600 text-[11px]">Vendor: {selectedLeakage.vendorOrService}</div>
                  <div className="text-rose-700 font-mono font-bold">${selectedLeakage.amount.toFixed(2)} ({selectedLeakage.frequency.replace(/_/g, ' ')})</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  RESOLUTION AUDIT NOTE
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeakage(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {resolving ? 'Settling...' : 'Confirm Settle & Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostLeakageAndLeadHub;
