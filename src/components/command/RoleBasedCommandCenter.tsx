/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Inbox, 
  Zap, 
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Server,
  UserCheck,
  Package
} from 'lucide-react';
import WeeklyOwnerBrief from './WeeklyOwnerBrief';
import EmptyState from '../ui/EmptyState';

interface RoleBasedCommandCenterProps {
  state: any;
  setCurrentTab: (tab: string) => void;
  setSettingsTab?: (tab: string) => void;
  setDealsTab?: (tab: string) => void;
  setWorkQueueTab?: (tab: string) => void;
}

export default function RoleBasedCommandCenter({ 
  state, 
  setCurrentTab,
  setSettingsTab,
  setDealsTab,
  setWorkQueueTab
}: RoleBasedCommandCenterProps) {
  const {
    workItems = [],
    transactions = [],
    integrations = [],
    signInventory = [],
    officeSupplies = [],
    facilitiesIssues = [],
    profiles = [],
    activeProfile,
    handleRoleSwitch
  } = state;

  // Let the user manually swap consoles, defaulting to their profile role
  const [activeConsole, setActiveConsole] = useState<string>('owner');

  useEffect(() => {
    if (activeProfile?.role) {
      if (activeProfile.role === 'owner') setActiveConsole('owner');
      else if (activeProfile.role === 'operations_lead') setActiveConsole('operations_lead');
      else if (activeProfile.role === 'transaction_coordinator') setActiveConsole('transaction_coordinator');
      else setActiveConsole('marketing'); // Default fallback
    }
  }, [activeProfile]);

  // Calculations
  const pendingItems = workItems.filter((w: any) => w.status !== 'completed');
  
  // Owner worthy decisions
  const ownerDecisions = pendingItems.filter((w: any) => 
    w.type === 'owner_escalation' || (w.approvalRequired && w.ownerRole === 'owner')
  );

  // High-risk compliance issues
  const highRiskTxs = transactions.filter((t: any) => t.risk_level === 'blocked' || t.risk_level === 'at_risk');

  // Aging work (> 24 hours old)
  const agingWork = pendingItems.filter((w: any) => {
    const created = new Date(w.createdAt).getTime();
    const diff = Date.now() - created;
    return diff > 24 * 60 * 60 * 1000;
  });

  // Closings within 14 days and at risk
  const upcomingRiskTxs = transactions.filter((t: any) => {
    if (!t.expected_closing_date || t.risk_level === 'healthy') return false;
    const days = (new Date(t.expected_closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 14;
  });

  // Avoided owner interruptions
  const completedCount = workItems.filter((w: any) => w.status === 'completed').length;
  const avoidedCount = workItems.filter((w: any) => w.ownerRole !== 'owner').length + completedCount;

  // Business Impact
  const totalComm = transactions.reduce((acc: number, t: any) => acc + (t.revenue || 0), 0);
  const riskAdjustedComm = transactions.reduce((acc: number, t: any) => {
    let multiplier = 1;
    if (t.risk_level === 'blocked') multiplier = 0.3;
    else if (t.risk_level === 'at_risk') multiplier = 0.7;
    return acc + (t.revenue || 0) * multiplier;
  }, 0);

  // Unresolved role/ownership vacancies
  const rolesNeeded = ['owner', 'operations_lead', 'transaction_coordinator', 'marketing_coordinator'];
  const currentAssignedRoles = profiles.map((p: any) => p.role);
  const vacantRoles = rolesNeeded.filter(r => !currentAssignedRoles.includes(r));

  const isProd = state.appMode === 'production';

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary text-left">
      
      {/* Today in the Brokerage Header */}
      <div className="space-y-1 pb-2 select-none">
        <h1 className="text-xl font-bold font-serif text-text-primary">Today in the Brokerage</h1>
        <p className="text-xs text-text-secondary">
          shapework. is watching active workflows and surfacing what needs attention.
        </p>
      </div>
      
      {/* Selector Console Tabs */}
      {!isProd && (
        <div className="flex justify-between items-center border-b border-border-soft pb-2 select-none flex-wrap gap-2">
          <div className="flex gap-2">
            {[
              { id: 'owner', label: 'Executive Owner Console' },
              { id: 'operations_lead', label: 'Operations Lead Console' },
              { id: 'transaction_coordinator', label: 'TC Console' },
              { id: 'marketing', label: 'Marketing Console' }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConsole(c.id)}
                className={`px-3 py-1.5 font-bold uppercase rounded-lg border text-[10px] tracking-wider transition-all cursor-pointer ${
                  activeConsole === c.id 
                    ? 'bg-brand-primary text-white border-brand-primary' 
                    : 'bg-white border-border-soft text-text-secondary hover:bg-stone-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-text-tertiary">
            Logged in: <strong className="text-text-primary">{activeProfile?.name}</strong> ({activeProfile?.role.replace(/_/g, ' ')})
          </span>
        </div>
      )}

      {/* RENDER ACTIVE CONSOLE */}

      {activeConsole === 'owner' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Owner executive Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-stone-50 border border-border-soft p-4 rounded-xl flex flex-col justify-between space-y-2 select-none text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-tertiary uppercase font-bold block">Pipeline Total Revenue</span>
                <DollarSign className="w-5 h-5 text-brand-primary/20" />
              </div>
              <div>
                <span className="text-lg font-black font-mono text-text-primary block">${totalComm.toLocaleString()}</span>
                <span className="text-[10px] text-text-tertiary block mt-0.5 leading-tight font-medium">Total transaction volume under active management.</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-border-soft p-4 rounded-xl flex flex-col justify-between space-y-2 select-none text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-tertiary uppercase font-bold block">Risk-Adjusted Commission</span>
                <TrendingUp className="w-5 h-5 text-brand-primary/20" />
              </div>
              <div>
                <span className="text-lg font-black font-mono text-brand-primary block">${Math.round(riskAdjustedComm).toLocaleString()}</span>
                <span className="text-[10px] text-text-tertiary block mt-0.5 leading-tight font-medium">Estimated pipeline value after accounting for compliance risks.</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-border-soft p-4 rounded-xl flex flex-col justify-between space-y-2 select-none text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-tertiary uppercase font-bold block">Avoided Interruptions</span>
                <ShieldCheck className="w-5 h-5 text-status-success/20" />
              </div>
              <div>
                <span className="text-lg font-black font-mono text-status-success block">{avoidedCount} items</span>
                <span className="text-[10px] text-text-tertiary block mt-0.5 leading-tight font-medium">Routine tasks handled by automation and operations staff.</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-border-soft p-4 rounded-xl flex flex-col justify-between space-y-2 select-none text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-text-tertiary uppercase font-bold block">Owner Decisions</span>
                <AlertTriangle className="w-5 h-5 text-risk-red/20" />
              </div>
              <div>
                <span className="text-lg font-black font-mono text-risk-red block">{ownerDecisions.length} tasks</span>
                <span className="text-[10px] text-text-tertiary block mt-0.5 leading-tight font-medium">Requires immediate broker-owner review or signature.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Owner decisions & Risk list */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Owner decisions card */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <span className="font-mono font-bold text-[9px] text-brand-primary uppercase tracking-wider block">// Gated Decisions & Escaped Disputes</span>
                
                {ownerDecisions.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="No owner-worthy decisions right now"
                    description="Your team and workflows are running smoothly. All standard actions are routed."
                  />
                ) : (
                  <div className="divide-y divide-border-soft bg-white rounded-xl border border-border-soft overflow-hidden">
                    {ownerDecisions.map((dec: any) => (
                      <div 
                        key={dec.id} 
                        onClick={() => {
                          setCurrentTab('Work Queue');
                          if (setWorkQueueTab) setWorkQueueTab('tasks');
                        }}
                        className="p-4 hover:bg-stone-50/50 flex justify-between items-center gap-4 cursor-pointer transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-text-primary font-bold block">{dec.title}</span>
                          <span className="text-[10px] text-text-tertiary block">{dec.recommendedNextAction}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Closings at risk */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <span className="font-mono font-bold text-[9px] text-risk-red uppercase tracking-wider block">// Upcoming Closings At Risk (T-14)</span>
                
                {upcomingRiskTxs.length === 0 ? (
                  <div className="py-6 text-center text-text-tertiary">
                    <CheckCircle className="w-6 h-6 text-status-success mx-auto mb-1 opacity-30" />
                    <p>No high-risk near-term closings.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-soft bg-white border border-border-soft rounded-xl overflow-hidden">
                    {upcomingRiskTxs.map((t: any) => (
                      <div 
                        key={t.id} 
                        onClick={() => {
                          setCurrentTab('Transactions');
                          if (setDealsTab) setDealsTab('all');
                        }}
                        className="p-3.5 hover:bg-stone-50/50 cursor-pointer transition-all flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-text-primary block">{t.client_name} - {t.property_address}</span>
                          <span className="text-[10px] text-text-tertiary block">Target closing: {t.expected_closing_date} · Status: <span className="font-semibold text-risk-red">{t.risk_level.toUpperCase()}</span></span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right sidebar: Aging work & weekly summary */}
            <div className="space-y-4">
              
              {/* Aging work */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-3">
                <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                  Aging Action Items (&gt;24 Hours)
                </span>
                
                {agingWork.length === 0 ? (
                  <p className="text-[10px] text-text-tertiary">All triage tasks completed within standard timelines.</p>
                ) : (
                  <div className="space-y-2">
                    {agingWork.slice(0, 3).map((w: any) => (
                      <div key={w.id} className="p-2.5 bg-white border border-border-soft rounded-xl text-[10px]">
                        <span className="font-bold text-text-primary block truncate">{w.title}</span>
                        <span className="text-text-tertiary block mt-0.5">Assigned role: {w.ownerRole.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unresolved roles */}
              {vacantRoles.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-250 p-4 rounded-2xl flex gap-3 items-start select-none">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-800 text-xs block">Vacant Roles Mapped</span>
                    <span className="text-[10px] text-amber-700 leading-normal block">
                      The following brokerage roles have no assigned staff member: <span className="font-semibold">{vacantRoles.join(', ')}</span>. Route maps are currently fallback-routing.
                    </span>
                  </div>
                </div>
              )}

              {/* Weekly brief copy */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-2 select-none">
                <span className="font-mono font-bold text-[9px] text-brand-primary uppercase tracking-wider block">Weekly Operating Brief</span>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  The executive summary has compiled metrics avoiding owner interruptions.
                </p>
                <button
                  onClick={() => setCurrentTab('Work Queue')}
                  className="w-full py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl text-[10px] tracking-wide transition-all uppercase"
                >
                  View Full Brief Console
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeConsole === 'operations_lead' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Col 1 & 2: Work queue & unresolved approvals */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Task queue */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center select-none">
                  <span className="font-mono font-bold text-[9px] text-brand-primary uppercase tracking-wider block">// Operations Work Queue</span>
                  <button 
                    onClick={() => {
                      setCurrentTab('Work Queue');
                      if (setWorkQueueTab) setWorkQueueTab('tasks');
                    }}
                    className="text-[10px] text-brand-primary font-bold hover:underline"
                  >
                    Manage Work Queue
                  </button>
                </div>
                
                {pendingItems.length === 0 ? (
                  <div className="py-8 text-center text-text-tertiary">All triages complete.</div>
                ) : (
                  <div className="divide-y divide-border-soft bg-white border border-border-soft rounded-xl overflow-hidden">
                    {pendingItems.slice(0, 5).map((w: any) => (
                      <div key={w.id} className="p-3 hover:bg-stone-50/50 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-text-primary block text-xs">{w.title}</span>
                          <span className="text-[10px] text-text-tertiary block">Owner role: {w.ownerRole.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-[9px] font-mono text-text-tertiary">{new Date(w.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign readiness & stock */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3 select-none">
                <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block">// Signage & Lockbox Readiness</span>
                <div className="grid grid-cols-2 gap-4">
                  {signInventory.map((sign: any) => {
                    const remaining = sign.total - sign.checkedOut;
                    const isLow = remaining <= sign.lowStockThreshold;
                    return (
                      <div key={sign.id} className="p-3 bg-white border border-border-soft rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-bold text-text-primary block">{sign.type}</span>
                          <span className="text-[10px] text-text-tertiary block mt-0.5">{remaining} in storage</span>
                        </div>
                        {isLow ? (
                          <span className="px-1.5 py-0.5 bg-risk-red-soft text-risk-red text-[8px] font-bold rounded uppercase">Low</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-status-success-soft text-status-success text-[8px] font-bold rounded uppercase">OK</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Side: health and connectors */}
            <div className="space-y-4 select-none">
              
              {/* Integration status */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-3">
                <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-text-tertiary" />
                  Integration Connectors Health
                </span>
                <div className="space-y-2">
                  {integrations.map((int: any) => (
                    <div key={int.id} className="flex justify-between items-center p-2 bg-white border border-border-soft rounded-lg text-[10px]">
                      <span className="font-bold text-text-primary">{int.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        int.status === 'connected' ? 'bg-status-success-soft text-status-success' : 'bg-stone-100 text-text-tertiary'
                      }`}>
                        {int.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeConsole === 'transaction_coordinator' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Col 1 & 2: intake gaps and compliance risks */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Missing intake records */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <span className="font-mono font-bold text-[9px] text-brand-primary uppercase tracking-wider block">// Missing Transaction Records</span>
                
                {workItems.filter((w: any) => w.type === 'transaction_intake_gap' && w.status !== 'completed').length === 0 ? (
                  <p className="text-text-tertiary text-center py-6">All active listings have contract intake files created.</p>
                ) : (
                  <div className="divide-y divide-border-soft bg-white border border-border-soft rounded-xl overflow-hidden">
                    {workItems.filter((w: any) => w.type === 'transaction_intake_gap' && w.status !== 'completed').map((w: any) => (
                      <div key={w.id} className="p-3 hover:bg-stone-50/50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-text-primary block text-xs">{w.title}</span>
                          <span className="text-[10px] text-text-tertiary block">{w.recommendedNextAction}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance Risks */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <span className="font-mono font-bold text-[9px] text-risk-red uppercase tracking-wider block">// Compliance Document Risks (T-14 closings)</span>
                
                {workItems.filter((w: any) => w.type === 'closing_compliance_risk' && w.status !== 'completed').length === 0 ? (
                  <p className="text-text-tertiary text-center py-6">All nearing closings comply with mandatory paperwork policies.</p>
                ) : (
                  <div className="divide-y divide-border-soft bg-white border border-border-soft rounded-xl overflow-hidden">
                    {workItems.filter((w: any) => w.type === 'closing_compliance_risk' && w.status !== 'completed').map((w: any) => (
                      <div key={w.id} className="p-3 hover:bg-stone-50/50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-text-primary block text-xs">{w.title}</span>
                          <span className="text-[10px] text-text-tertiary block">{w.recommendedNextAction}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right sidebar: Approaching closings */}
            <div className="space-y-4">
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-3 select-none">
                <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block">Approaching Closings</span>
                <div className="divide-y divide-border-soft">
                  {transactions.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="py-2 flex justify-between text-[10px]">
                      <div>
                        <span className="font-bold text-text-primary block">{t.client_name}</span>
                        <span className="text-[9px] text-text-tertiary block mt-0.5">{t.property_address}</span>
                      </div>
                      <span className="font-mono font-semibold text-text-secondary">{t.expected_closing_date || 'No closing date'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeConsole === 'marketing' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Col 1 & 2: Pending Marketing requests & due dates */}
            <div className="md:col-span-2 space-y-4">
              
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-5 space-y-3">
                <span className="font-mono font-bold text-[9px] text-brand-primary uppercase tracking-wider block">// Pending Collateral Requests</span>
                
                {workItems.filter((w: any) => w.type === 'marketing_request' && w.status !== 'completed').length === 0 ? (
                  <p className="text-text-tertiary text-center py-6">No pending listing brochure or flyer requests logged in database.</p>
                ) : (
                  <div className="divide-y divide-border-soft bg-white border border-border-soft rounded-xl overflow-hidden">
                    {workItems.filter((w: any) => w.type === 'marketing_request' && w.status !== 'completed').map((w: any) => (
                      <div key={w.id} className="p-3 hover:bg-stone-50/50 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-text-primary block text-xs">{w.title}</span>
                          <span className="text-[10px] text-text-tertiary block">{w.recommendedNextAction}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right sidebar: FAQ deflection & checklist */}
            <div className="space-y-4 select-none">
              
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-3">
                <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />
                  Deflection Suggestions Active
                </span>
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Flyers, brochures, and asset templates are stored in Canva shared directories. Deflect manual requests by pointing agents to Canva.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
