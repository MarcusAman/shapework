import React from 'react';
import { ShieldAlert, ArrowRight, Clock } from 'lucide-react';
import { Transaction } from '../../types/shapework';
import RiskBadge from '../ui/RiskBadge';

interface OperationalRiskTableProps {
  transactions: Transaction[];
  onSelectTransaction: (id: string) => void;
  activeFilter: 'all' | 'closing' | 'risk' | 'attention';
  setActiveFilter: (filter: 'all' | 'closing' | 'risk' | 'attention') => void;
  onApproveAction?: (proposalId: string) => void;
}

export default function OperationalRiskTable({
  transactions,
  onSelectTransaction,
  activeFilter,
  setActiveFilter,
  onApproveAction
}: OperationalRiskTableProps) {
  
  // Filter the items locally based on selected tab filter
  const filteredTransactions = (transactions || []).filter((tx) => {
    if (!tx) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'closing') {
      if (!tx.expected_closing_date) return false;
      const daysDiff = Math.ceil((new Date(tx.expected_closing_date).getTime() - new Date('2026-06-27').getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 10;
    }
    if (activeFilter === 'risk') {
      return tx.risk_level === 'at_risk' || tx.risk_level === 'blocked';
    }
    if (activeFilter === 'attention') {
      return tx.waiting_on !== 'None';
    }
    return true;
  });

  return (
    <div className="sw-card p-5 space-y-4 text-left font-sans shadow-sm">
      
      {/* Header and Filter row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-3 select-none">
        <div>
          <h3 className="text-xs font-mono font-bold text-[var(--sw-text)] uppercase tracking-wider">Active Transactions Audit</h3>
          <p className="text-xs text-[var(--sw-muted)] mt-0.5 font-serif italic">Continuous audit checklist of active escrows.</p>
        </div>

        {/* Pure console text-based filters */}
        <div className="flex border border-[var(--sw-border)] font-mono text-[10px] bg-[var(--sw-card)] overflow-hidden rounded-xl">
          {(['all', 'closing', 'risk', 'attention'] as const).map((filter) => {
            const labels = {
              all: 'All Files',
              closing: 'Closing Soon',
              risk: 'At Risk',
              attention: 'Needs Attn'
            };
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 uppercase font-bold tracking-wider border-r border-[var(--sw-border)] last:border-r-0 transition-all focus:outline-none cursor-pointer ${
                  isActive 
                    ? 'bg-[var(--sw-green-700)] text-white' 
                    : 'text-[var(--sw-muted)] hover:bg-[var(--sw-surface)] hover:text-[var(--sw-text)]'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono select-none">
          <thead>
            <tr className="border-b border-[var(--sw-border)] text-[var(--sw-muted)] font-bold uppercase tracking-wider text-[9px]">
              <th className="pb-2.5">Property Address</th>
              <th className="pb-2.5">Compliance Index</th>
              <th className="pb-2.5">Primary Risk</th>
              <th className="pb-2.5">Commission</th>
              <th className="pb-2.5">Waiting On</th>
              <th className="pb-2.5">Owner / TC</th>
              <th className="pb-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sw-border)] text-[var(--sw-text)]">
            {filteredTransactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => onSelectTransaction(tx.id)}
                className="hover:bg-[var(--sw-card)] cursor-pointer group transition-all"
              >
                {/* Address */}
                <td className="py-3">
                  <div className="font-sans font-bold text-[var(--sw-text)] group-hover:text-[var(--sw-green-700)] transition-colors">
                    {tx.property_address.split(',')[0]}
                  </div>
                  <div className="text-[9px] text-[var(--sw-muted-light)] font-sans mt-0.5">Client: {tx.client_name}</div>
                </td>

                {/* Health Status */}
                <td className="py-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      tx.health_score >= 80 ? 'bg-[var(--sw-success)]' : tx.health_score >= 50 ? 'bg-[var(--sw-warning)] animate-pulse' : 'bg-[var(--sw-risk)] animate-pulse'
                    }`} />
                    <span>{tx.health_score}%</span>
                    <span className="text-[9px] scale-95 origin-left">
                      <RiskBadge level={tx.risk_level} />
                    </span>
                  </div>
                </td>

                {/* Risk reasons */}
                <td className="py-3 max-w-[200px] truncate text-[var(--sw-muted)] font-sans text-xs">
                  {tx.risk_reasons?.[0] || 'Nominal execution'}
                  {tx.risk_reasons && tx.risk_reasons.length > 1 && (
                    <span className="text-[9px] font-bold text-[var(--sw-warning)] font-mono ml-1.5">
                      +{tx.risk_reasons.length - 1} More
                    </span>
                  )}
                </td>

                {/* Revenue */}
                <td className="py-3 font-bold">
                  ${(tx.revenue || 0).toLocaleString()}
                </td>

                {/* Waiting On */}
                <td className="py-3">
                  <span className={`font-bold ${tx.waiting_on !== 'None' ? 'text-[var(--sw-warning)]' : 'text-[var(--sw-muted-light)]'}`}>
                    {tx.waiting_on.toUpperCase()}
                  </span>
                </td>

                {/* Assigned TC */}
                <td className="py-3 text-[var(--sw-muted)] font-sans">
                  <span>Diane Ross</span>
                  <span className="text-[9px] text-[var(--sw-muted-light)] block font-mono">Agent ID: Alex.C</span>
                </td>

                {/* Action details */}
                <td className="py-3 text-right">
                  <span className="text-[10px] text-[var(--sw-green-700)] font-bold group-hover:underline uppercase tracking-wider">
                    Inspect
                  </span>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--sw-muted)] italic">
                  No active escrows mapped to this filter state.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
