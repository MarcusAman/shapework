/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldAlert, CheckCircle, Shield, Cpu, Link2, Inbox, Clipboard } from 'lucide-react';
import { Transaction, Listing } from '../../types/shapework';
import RiskBadge from '../ui/RiskBadge';
import StatusBadge from '../ui/StatusBadge';

interface ContextRailProps {
  selectedItem: any;
  type: 'transaction' | 'listing' | 'inbox' | 'work_item' | 'integration' | 'agent' | null;
  onClose: () => void;
  onApproveAction?: (proposalId: string) => void;
  
  auditEvents?: any[];
  decisions?: any[];
  integrations?: any[];
  aiAgents?: any[];
  onNavigateTab?: (tab: string) => void;
}

export default function ContextRail({
  selectedItem,
  type,
  onClose,
  onApproveAction,
  auditEvents = [],
  decisions = [],
  integrations = [],
  aiAgents = [],
  onNavigateTab
}: ContextRailProps) {
  const isAppRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');
  if (!selectedItem || !type) {
    const latestEvent = auditEvents && auditEvents.length > 0 ? auditEvents[0] : null;
    const pendingCount = decisions ? decisions.length : 0;
    const connectedCount = integrations ? integrations.filter(i => i.connected).length : 0;
    
    return (
      <aside className="w-full h-full flex flex-col overflow-y-auto font-sans text-left bg-surface">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-soft shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Operations Pulse</span>
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-text-secondary hover:text-text-primary border border-border-soft transition-colors"
            title="Collapse Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Suggested next demo action */}
          <div className="p-3.5 bg-brand-soft border border-brand-primary/10 rounded-xl space-y-2">
            <div className="flex items-center gap-1 text-brand-primary text-[10px] font-bold uppercase tracking-wider font-mono">
              <span>Next Best Action</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Open the <strong className="text-brand-primary font-bold">Work Queue</strong> tab to resolve priority bottlenecks and authorize AI-prepared contract releases.
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('Work Queue')}
                className="w-full py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded text-[10px] font-mono font-bold transition-all shadow-xs"
              >
                Open Work Queue
              </button>
            )}
          </div>

          {/* System Monitor Overview */}
          <div className="bg-surface border border-border-soft rounded-xl p-3.5 shadow-soft space-y-2.5">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider font-mono">Live Health Diagnostics</span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Active Integrations:</span>
                <span className="font-semibold text-success">{connectedCount} Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pending Approvals:</span>
                <span className="font-semibold text-text-primary font-mono">{pendingCount} Waiting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Agent Status:</span>
                <span className="font-semibold text-text-primary">100% Online</span>
              </div>
            </div>
          </div>

          {/* Active Agents list */}
          {!isAppRoute && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Active Agents Status</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {aiAgents && aiAgents.length > 0 ? (
                  aiAgents.slice(0, 4).map((ag: any) => (
                    <div key={ag.id} className="p-2 border border-border-soft rounded-lg bg-surface flex justify-between items-center text-[10px]">
                      <span className="font-medium text-text-primary truncate max-w-[120px]">{ag.name}</span>
                      <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded-full font-mono uppercase tracking-wider ${
                        ag.status === 'running' 
                          ? 'bg-brand-soft text-success border border-success/5' 
                          : 'bg-stone-50 text-text-tertiary border border-border-soft/60'
                      }`}>
                        {ag.status || 'idle'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-text-tertiary italic">No active agents configured</div>
                )}
              </div>
            </div>
          )}

          {/* Latest Audit Ledger block */}
          {latestEvent && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Latest Audit Event</span>
              <div className="p-3 border border-border-soft rounded-xl bg-surface shadow-soft space-y-2 text-xs">
                <div className="flex justify-between items-center text-[9px] text-text-tertiary font-mono">
                  <span>Actor: {latestEvent.actor || latestEvent.user_name}</span>
                  <span>{new Date(latestEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                  {latestEvent.action_description || latestEvent.action}
                </p>
                <div className="flex justify-between items-center text-[8px] font-bold">
                  <span className="uppercase text-brand-primary bg-brand-soft px-1 py-0.2 rounded font-mono">
                    {latestEvent.impact_area || 'general'}
                  </span>
                  {latestEvent.target_record && (
                    <span className="text-text-tertiary truncate max-w-[120px] font-mono">
                      {latestEvent.target_record}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  const renderTransactionContext = (tx: Transaction) => {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Deal Details</span>
            <RiskBadge level={tx.risk_level} />
          </div>
          <h3 className="font-serif font-bold text-text-primary text-base leading-snug">{tx.property_address}</h3>
          <p className="text-xs text-text-secondary mt-1">Client: {tx.client_name}</p>
        </div>

        {/* Financial info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-surface rounded-lg border border-border-soft">
          <div>
            <span className="text-[10px] text-text-tertiary">Projected Revenue</span>
            <div className="font-mono text-sm font-semibold text-text-primary mt-0.5">
              ${(tx.revenue || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Expected Close</span>
            <div className="font-mono text-xs font-semibold text-text-primary mt-0.5">
              {tx.expected_closing_date}
            </div>
          </div>
        </div>

        {/* Risk Reasons */}
        {(tx.risk_reasons || []).length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Closing Obstacles</span>
            <div className="space-y-1.5">
              {(tx.risk_reasons || []).map((reason, idx) => (
                <div key={idx} className="flex gap-2 items-start p-2 bg-risk-red-soft rounded-lg text-xs border border-risk-red-soft text-text-primary">
                  <ShieldAlert className="w-4 h-4 text-risk-red shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Assigned Team</span>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-surface border border-border-soft rounded-lg">
              <span className="text-text-secondary">Agent:</span>
              <span className="font-medium text-text-primary">Alex Carter</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface border border-border-soft rounded-lg">
              <span className="text-text-secondary">Coordinator:</span>
              <span className="font-medium text-text-primary">Diane Ross</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-surface border border-border-soft rounded-lg">
              <span className="text-text-secondary">Waiting On:</span>
              <span className="font-semibold text-warning">{tx.waiting_on}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-brand-soft rounded-lg border border-brand-primary/10 space-y-2">
          <div className="flex items-center gap-1.5 text-brand-primary font-semibold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Recommended Decision</span>
          </div>
          <p className="text-xs text-text-primary font-medium">{tx.next_action}</p>
        </div>
      </div>
    );
  };

  const renderListingContext = (lst: Listing) => {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Listing Details</span>
            <StatusBadge status={lst.status} />
          </div>
          <h3 className="font-serif font-bold text-text-primary text-base leading-snug">{lst.property_address}</h3>
          <p className="text-xs text-text-secondary mt-1">Price: ${lst.list_price.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 bg-surface rounded-lg border border-border-soft">
          <div>
            <span className="text-[10px] text-text-tertiary">Target Launch</span>
            <div className="font-mono text-xs font-semibold text-text-primary mt-0.5">
              {lst.target_launch_date}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Marketing Prep</span>
            <div className="font-mono text-xs font-semibold text-text-primary mt-0.5 capitalize">
              {(lst.marketing_readiness || 'not_started').replace('_', ' ')}
            </div>
          </div>
        </div>

        {(lst.blocking_items || []).length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Photography & Info Blockers</span>
            <div className="space-y-1.5">
              {(lst.blocking_items || []).map((bl, idx) => (
                <div key={idx} className="flex gap-2 items-start p-2 bg-warning-soft rounded-lg text-xs border border-warning-soft text-text-primary">
                  <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>{bl}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-brand-soft rounded-lg border border-brand-primary/10 space-y-2">
          <div className="flex items-center gap-1.5 text-brand-primary font-semibold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Launch Action Plan</span>
          </div>
          <p className="text-xs text-text-primary font-medium">{lst.next_action}</p>
        </div>
      </div>
    );
  };

  const renderWorkItemContext = (item: any) => {
    return (
      <div className="space-y-6 text-left">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Work Queue Item</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning-soft text-warning font-mono">
              {item.status || 'Pending Review'}
            </span>
          </div>
          <h3 className="font-serif font-bold text-text-primary text-base leading-snug">{item.title || item.record}</h3>
          <p className="text-xs text-text-secondary mt-1">Owner: {item.owner || 'Ann Gunn'}</p>
        </div>

        {item.raw?.before && item.raw?.after && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">Before/After updates</span>
            <div className="p-3 bg-stone-50 border border-border-soft rounded-lg text-xs font-mono space-y-1">
              <div className="line-through text-risk-red">- {item.raw.before}</div>
              <div className="text-success">+ {item.raw.after}</div>
            </div>
          </div>
        )}

        {item.raw?.evidence && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase font-mono">Source Evidence</span>
            <p className="p-3 bg-stone-50 border border-border-soft rounded-lg text-[10px] text-text-secondary font-mono leading-relaxed">
              {item.raw.evidence}
            </p>
          </div>
        )}

        {item.raw?.policy && (
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase block">Approval Policy</span>
            <div className="text-[10px] text-text-secondary italic">{item.raw.policy}</div>
          </div>
        )}

        <div className="p-3 bg-brand-soft border border-brand-primary/10 rounded-lg space-y-1.5">
          <span className="text-[9px] font-mono font-bold text-brand-primary uppercase block">RECOMMENDED NEXT ACTION</span>
          <p className="text-xs text-text-primary font-semibold leading-normal">
            {item.nextAction || item.raw?.recommended_action || 'Execute recommended adjustment.'}
          </p>
        </div>
      </div>
    );
  };

  const renderIntegrationContext = (item: any) => {
    return (
      <div className="space-y-6 text-left">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider font-mono">Integration</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              item.connected ? 'bg-success-soft text-success' : 'bg-stone-100 text-text-secondary'
            }`}>
              {item.connected ? 'CONNECTED' : 'INACTIVE'}
            </span>
          </div>
          <h3 className="font-serif font-bold text-text-primary text-base leading-snug">{item.name}</h3>
          <p className="text-xs text-text-secondary mt-1">{item.purpose}</p>
        </div>

        <div className="space-y-3 p-3 bg-surface rounded-lg border border-border-soft text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Sync Health:</span>
            <span className="font-semibold text-success">Healthy Syncing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Records Synced:</span>
            <span className="font-mono text-text-primary font-bold">{item.records_synchronized || 12} records</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Recent Failures:</span>
            <span className={`font-semibold ${item.errors_count > 0 ? 'text-risk-red' : 'text-success'}`}>
              {item.errors_count} logged
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block font-mono">Sync Capabilities</span>
          <div className="space-y-1">
            {(item.permissions_granted || []).map((perm: string, idx: number) => (
              <div key={idx} className="p-2 border border-border-soft rounded bg-stone-50 text-[10px] text-text-secondary">
                {perm}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAgentContext = (item: any) => {
    return (
      <div className="space-y-6 text-left">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider font-mono">Workforce Agent</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              item.status === 'running' ? 'bg-brand-soft text-brand-primary' : 'bg-stone-100 text-text-secondary'
            }`}>
              {item.status?.toUpperCase() || 'IDLE'}
            </span>
          </div>
          <h3 className="font-serif font-bold text-text-primary text-base leading-snug">{item.name}</h3>
          <p className="text-xs text-text-secondary mt-1">Role: {item.role}</p>
        </div>

        <div className="p-3 bg-surface border border-border-soft rounded-lg text-xs space-y-2">
          <div>
            <span className="text-[9px] text-text-tertiary font-bold block font-mono">AGENT MISSION</span>
            <p className="text-text-primary font-medium mt-0.5">{item.capabilities?.[0] || 'Monitor listings compliance and verify contracts.'}</p>
          </div>
          <div className="flex justify-between border-t border-border-soft/60 pt-1.5">
            <span className="text-text-secondary">Last Run:</span>
            <span className="font-mono text-text-primary">{item.last_run || '15 minutes ago'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Actions Logged:</span>
            <span className="font-mono text-text-primary">{item.actions_completed_today || 0} executed</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block font-mono">Policy Limits</span>
          <p className="text-[10px] text-text-secondary leading-relaxed p-2 bg-stone-50 border border-border-soft rounded">
            Brokerage rules enforce visual COO human authorization before issuing mutual release document links or modifying wires.
          </p>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-full h-full flex flex-col overflow-y-auto font-sans text-left bg-surface">
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
        <span className="font-bold text-xs text-text-primary uppercase tracking-wider">Record Summary</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-stone-100 text-text-secondary hover:text-text-primary border border-border-soft transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {type === 'transaction' && renderTransactionContext(selectedItem)}
        {type === 'listing' && renderListingContext(selectedItem)}
        {type === 'work_item' && renderWorkItemContext(selectedItem)}
        {type === 'integration' && renderIntegrationContext(selectedItem)}
        {type === 'agent' && renderAgentContext(selectedItem)}
      </div>
    </aside>
  );
}
