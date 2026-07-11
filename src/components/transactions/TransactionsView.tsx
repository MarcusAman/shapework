import React, { useState } from 'react';
import { FileText, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Clock, DollarSign, Users, Mail, Link2, Paperclip, X } from 'lucide-react';
import { Transaction, Task } from '../../types/shapework';
import RiskBadge from '../ui/RiskBadge';
import StatusBadge from '../ui/StatusBadge';
import { safeLower } from '../../utils/string';
import ZillowImageWidget from '../ui/ZillowImageWidget';

interface TransactionsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (id: string) => void;
  selectedTransactionId: string | null;
  onCloseDetail: () => void;
  onApproveAction: (id: string) => void;
}

export default function TransactionsView({
  transactions,
  onSelectTransaction,
  selectedTransactionId,
  onCloseDetail,
  onApproveAction
}: TransactionsViewProps) {
  const [detailTab, setDetailTab] = useState<'overview' | 'milestones' | 'documents' | 'history'>('overview');
  const selectedTx = transactions.find(t => t.id === selectedTransactionId) || null;

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">Transactions (Brokerage-Known Ledger)</h2>
            <p className="text-xs text-text-secondary mt-0.5">This is the ledger of deals the brokerage is officially aware of. Listings and buyer agreements sync here once signed.</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-soft text-text-tertiary font-bold uppercase tracking-wider text-[10px] font-mono">
                <th className="pb-3 pr-4 pl-1">Property</th>
                <th className="pb-3 pr-4">Rep</th>
                <th className="pb-3 pr-4">Agent</th>
                <th className="pb-3 pr-4">Coordinator</th>
                <th className="pb-3 pr-4">Stage</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
                <th className="pb-3 pr-4 text-center">Health</th>
                <th className="pb-3 pr-4">Waiting On</th>
                <th className="pb-3 pr-4">Closing Date</th>
                <th className="pb-3 pl-1">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {transactions.map((tx) => {
                const mapStage = (stage: string): string => {
                  const s = safeLower(stage);
                  if (s === 'listing_signed' || s === 'listing signed') return 'Listing Signed';
                  if (s === 'closed') return 'Closed';
                  if (s === 'closing_prep' || s === 'closing prep') return 'Closing Prep';
                  return 'Under Contract';
                };

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx.id)}
                    className={`hover:bg-secondary-surface/75 cursor-pointer transition-all ${
                      selectedTransactionId === tx.id ? 'bg-brand-green-soft/30' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4 pl-1 font-semibold text-text-primary">
                      {tx.property_address.split(',')[0]}
                    </td>
                    <td className="py-3.5 pr-4 text-text-secondary capitalize">{tx.buyer_or_seller}</td>
                    <td className="py-3.5 pr-4 text-text-secondary">Alex Carter</td>
                    <td className="py-3.5 pr-4 text-text-secondary">Diane Ross</td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={mapStage(tx.current_stage)} />
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono font-bold text-text-primary">
                      ${tx.revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.health_score >= 80 ? 'bg-status-healthy-soft text-status-healthy' : tx.health_score >= 50 ? 'bg-status-attention-soft text-status-attention' : 'bg-status-atrisk-soft text-status-atrisk'
                      }`}>
                        {tx.health_score}%
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`font-semibold ${tx.waiting_on !== 'None' ? 'text-status-attention' : 'text-text-tertiary'}`}>
                        {tx.waiting_on}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-text-secondary">{tx.expected_closing_date}</td>
                    <td className="py-3.5 pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx.id);
                        }}
                        className="text-xs text-brand-green font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Detail</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-tertiary select-none">
                    <p className="font-semibold text-xs">No active deals in the brokerage ledger yet.</p>
                    <p className="text-[10px] text-text-tertiary/75 mt-1">Buyer and listing agreements will sync here automatically once signed in Dotloop or Rechat.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Split Inspection Panel when selected */}
      {selectedTx && (
        <div className="bg-surface border border-border-subtle rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in relative">
          <button
            onClick={onCloseDetail}
            className="absolute top-4 right-4 p-1 hover:bg-brand-green-soft text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Transaction Detail</span>
              <RiskBadge level={selectedTx.risk_level} />
            </div>
            <h3 className="font-serif font-bold text-text-primary text-xl mt-1">{selectedTx.property_address}</h3>
            <p className="text-xs text-text-secondary mt-1">Client name: {selectedTx.client_name} ({selectedTx.buyer_or_seller})</p>
          </div>

          {/* Tab Sub-bar for Detail View */}
          <div className="flex border-b border-border-subtle/80 gap-6 text-xs font-semibold">
            {(['overview', 'milestones', 'documents', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`pb-2.5 capitalize border-b-2 transition-all ${
                  detailTab === tab ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* View Tab Contents */}
          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Health Score Explainer */}
              <div className="p-4 bg-secondary-surface rounded-xl border border-border-subtle space-y-3">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Health Score Explainer</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-text-primary">{selectedTx.health_score}%</span>
                  <span className="text-text-tertiary">Operational score</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Health is evaluated dynamically by auditing contingency margins, response speeds, and active document approvals.
                </p>
                {(selectedTx.risk_reasons || []).length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    {(selectedTx.risk_reasons || []).map((r, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[11px] text-status-atrisk">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 items-center text-status-healthy pt-2 text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No scheduling exceptions found.</span>
                  </div>
                )}
              </div>

              {/* Milestone Status Summary */}
              <div className="p-4 bg-secondary-surface rounded-xl border border-border-subtle space-y-3">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Escrow Overview</span>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-border-subtle/50">
                    <span className="text-text-secondary">TC Coordinator:</span>
                    <span className="font-semibold text-text-primary">Diane Ross</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle/50">
                    <span className="text-text-secondary">Brokerage Commission:</span>
                    <span className="font-mono font-bold text-brand-green">${(selectedTx.revenue * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-subtle/50">
                    <span className="text-text-secondary">Expected Closing:</span>
                    <span className="font-mono text-text-primary">{selectedTx.expected_closing_date}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">Waiting On:</span>
                    <span className="font-semibold text-status-attention">{selectedTx.waiting_on}</span>
                  </div>
                </div>
              </div>

              {/* Next Action Actionable Card */}
              <div className="p-4 bg-brand-green-soft/40 rounded-xl border border-brand-green/20 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">Next Task Action</span>
                  <p className="text-xs text-text-primary font-bold mt-2 leading-relaxed">{selectedTx.next_action}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApproveAction(selectedTx.id)}
                    className="px-3 py-1.5 bg-brand-green text-white rounded text-[10px] font-bold shadow-sm hover:bg-brand-green-hover transition-colors"
                  >
                    Confirm Action Completed
                  </button>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'overview' && selectedTx.property_address && (
            <div className="space-y-1 mt-4">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Property Listing Photo</span>
              <ZillowImageWidget address={selectedTx.property_address} height="180px" />
            </div>
          )}

          {detailTab === 'milestones' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Escrow Milestone Timeline</span>
              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-border-subtle pl-1">
                {/* Milestone 1 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-8 h-8 rounded-full bg-status-healthy text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div className="p-3.5 bg-secondary-surface border border-border-subtle rounded-xl flex-1 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-text-primary">Earnest Money Deposited</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">Wire received and confirmed by Robert Vance Law.</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary">Completed June 15</span>
                  </div>
                </div>

                {/* Milestone 2 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-8 h-8 rounded-full bg-status-healthy text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div className="p-3.5 bg-secondary-surface border border-border-subtle rounded-xl flex-1 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-text-primary">Option Period contingency lapse</h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">Lapsed with repair amendments signed by seller.</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary">Completed June 20</span>
                  </div>
                </div>

                {/* Milestone 3 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-8 h-8 rounded-full bg-status-attention text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    !
                  </div>
                  <div className="p-3.5 bg-secondary-surface border border-status-attention/30 rounded-xl flex-1 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-semibold text-text-primary">Financing Contingency Expiry</h4>
                      <p className="text-[11px] text-status-attention mt-0.5 font-medium">Lender outstanding tax transcript. Finance approval deadline approaching.</p>
                    </div>
                    <span className="text-[10px] text-status-attention font-bold font-mono">Expires July 2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'documents' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Uploaded Escrow Files</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Doc 1 */}
                <div className="p-3 bg-secondary-surface border border-border-subtle rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-text-secondary" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Executed Sales Contract.pdf</h4>
                      <p className="text-[10px] text-text-tertiary">Uploaded June 14 by Alex Carter • 2.4 MB</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-status-healthy-soft text-status-healthy rounded text-[10px] font-bold border border-status-healthy/10">
                    Approved
                  </span>
                </div>

                {/* Doc 2 */}
                <div className="p-3 bg-secondary-surface border border-border-subtle rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-text-secondary" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Seller Disclosure Form.pdf</h4>
                      <p className="text-[10px] text-text-tertiary">Uploaded June 22 by Todd Howard • 1.1 MB</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-status-healthy-soft text-status-healthy rounded text-[10px] font-bold border border-status-healthy/10">
                    Approved
                  </span>
                </div>

                {/* Doc 3 (Missing/warning) */}
                {(selectedTx.risk_reasons || []).length > 0 && (
                  <div className="p-3 bg-status-attention-soft/30 border border-status-attention/20 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-status-attention" />
                      <div>
                        <h4 className="font-semibold text-text-primary">Buyer Underwriting Tax Transcripts</h4>
                        <p className="text-[10px] text-status-attention font-medium">Lender request outstanding. Ingest draft email dispatched.</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-status-attention-soft text-status-attention rounded text-[10px] font-bold border border-status-attention/15">
                      Pending Upload
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {detailTab === 'history' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Audit Log Activity</span>
              <div className="bg-secondary-surface border border-border-subtle rounded-xl p-3.5 space-y-3 text-xs max-h-48 overflow-y-auto">
                <div className="flex justify-between py-1 border-b border-border-subtle/30 last:border-none">
                  <div>
                    <span className="font-semibold text-text-primary">Sarah Jenkins (COO)</span>
                    <span className="text-text-secondary"> reassigned coordination file from Diane to Emma.</span>
                  </div>
                  <span className="font-mono text-text-tertiary shrink-0 ml-4">Today 11:45 AM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/30 last:border-none">
                  <div>
                    <span className="font-semibold text-text-primary">shapework AI</span>
                    <span className="text-text-secondary"> ingested lender email and matched tax transcript intent.</span>
                  </div>
                  <span className="font-mono text-text-tertiary shrink-0 ml-4">Today 08:15 AM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/30 last:border-none">
                  <div>
                    <span className="font-semibold text-text-primary">Laura Croft (Compliance)</span>
                    <span className="text-text-secondary"> approved fully executed sales contract PDF.</span>
                  </div>
                  <span className="font-mono text-text-tertiary shrink-0 ml-4">June 15 11:20 AM</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
