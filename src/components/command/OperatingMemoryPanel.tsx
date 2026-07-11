import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { Transaction, Listing, Communication, AuditEvent } from '../../types/shapework';

interface OperatingMemoryPanelProps {
  transactions: Transaction[];
  listings: Listing[];
  communications: Communication[];
  auditLogs: AuditEvent[];
  onNavigateToTab?: (tab: string) => void;
}

export default function OperatingMemoryPanel({
  transactions = [],
  listings = [],
  communications = [],
  auditLogs = [],
  onNavigateToTab
}: OperatingMemoryPanelProps) {
  
  // Calculate states
  const activeTransactions = transactions.filter(t => t.current_stage !== 'closed');
  const activeListings = listings.filter(l => l.status === 'active' || l.status === 'preparing');
  
  // Recent audits for learning feed
  const recentLogs = [...auditLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <div className="sw-card p-5 space-y-6 text-left select-text font-sans">
      
      {/* Header index style */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--sw-border)]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--sw-green-700)]" />
          <h3 className="font-bold text-xs text-[var(--sw-text)] uppercase tracking-wider">Workspace Activity Index</h3>
        </div>
        <span className="text-[10px] font-bold text-[var(--sw-success)] bg-[var(--sw-mint-100)] px-2 py-0.5 rounded-full select-none">
          Sync: Active
        </span>
      </div>

      {/* Layer 1: Transactions */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">Transactions</span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase font-bold">Active Escrows</span>
            <div className="text-xl font-bold text-[var(--sw-text)] mt-1 font-mono">{activeTransactions.length}</div>
            <span className="text-[9px] text-[var(--sw-muted-light)] uppercase mt-1 block">Dotloop Sync</span>
          </div>
          <div className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase font-bold">Active Listings</span>
            <div className="text-xl font-bold text-[var(--sw-text)] mt-1 font-mono">{activeListings.length}</div>
            <span className="text-[9px] text-[var(--sw-muted-light)] uppercase mt-1 block">Rechat Connect</span>
          </div>
        </div>
      </div>

      {/* Layer 2: Documents */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">Documents</span>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
          <div className="p-2 border border-[var(--sw-border)] bg-[var(--sw-card)] rounded-xl">
            <span className="text-[var(--sw-muted)] block font-bold">Emails</span>
            <strong className="text-[var(--sw-text)] block mt-0.5 font-bold font-mono">38 Files</strong>
          </div>
          <div className="p-2 border border-[var(--sw-border)] bg-[var(--sw-card)] rounded-xl">
            <span className="text-[var(--sw-muted)] block font-bold">Disclosures</span>
            <strong className="text-[var(--sw-text)] block mt-0.5 font-bold font-mono">14 Secure</strong>
          </div>
          <div className="p-2 border border-[var(--sw-border)] bg-[var(--sw-card)] rounded-xl">
            <span className="text-[var(--sw-muted)] block font-bold">Sync Logs</span>
            <strong className="text-[var(--sw-success)] block mt-0.5 font-bold font-mono">1,208 OK</strong>
          </div>
        </div>
      </div>

      {/* Layer 3: Exceptions */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">Exceptions</span>
        <div className="space-y-2.5 text-xs">
          
          <div className="alert-card risk p-3 border border-red-200 bg-red-50/30 space-y-1 rounded-xl">
            <div className="flex items-center gap-1.5 font-bold text-[var(--sw-risk)] text-[9px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Missing Compliance File</span>
            </div>
            <p className="text-[11px] text-[var(--sw-muted)] leading-snug">
              Evergreen Folder is missing signed Buyer Agency disclosure agreement.
            </p>
          </div>

          <div className="alert-card warning p-3 border border-amber-200 bg-amber-50/30 space-y-1 rounded-xl">
            <div className="flex items-center gap-1.5 font-bold text-[var(--sw-warning)] text-[9px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Confidence Under Threshold</span>
            </div>
            <p className="text-[11px] text-[var(--sw-muted)] leading-snug">
              Addendum signature match rating for Baker Street (78%) is below safety threshold.
            </p>
          </div>

        </div>
      </div>

      {/* Layer 4: Recent Activity */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block">Recent Activity</span>
        <div className="border border-[var(--sw-border)] rounded-xl divide-y divide-[var(--sw-border)] bg-[var(--sw-card)] overflow-hidden text-[10px]">
          {recentLogs.map((log) => (
            <div key={log.id} className="p-2.5 flex items-start justify-between gap-3 font-sans">
              <div className="space-y-0.5">
                <span className="font-semibold text-[var(--sw-text)] block leading-tight">
                  {log.action_description || log.action}
                </span>
                <span className="text-[8px] text-[var(--sw-muted-light)] uppercase block">
                  Actor: {log.user_name || log.actor} • Verified Ledger
                </span>
              </div>
              <span className="text-[8px] text-[var(--sw-muted)] shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
