import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  UploadCloud,
  ChevronDown,
  Calendar,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PipelineClosingTrackerProps {
  state?: any;
  onInspectRecord?: (type: string, id: string) => void;
}

export default function PipelineClosingTracker({ state = {}, onInspectRecord }: PipelineClosingTrackerProps) {
  const {
    transactions = [],
    fetchState,
    activeProfile
  } = state;

  const [activeTab, setActiveTab] = useState<'tracker' | 'forecast'>('tracker');
  const [subFilter, setSubFilter] = useState<'all' | 'this_month' | 'next_30' | 'missing_data' | 'at_risk' | 'ready_commission' | 'closed'>('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeal, setNewDeal] = useState({
    clientName: '',
    propertyAddress: '',
    agentName: activeProfile?.name || 'Jessica Keenan',
    closingDate: '',
    salesPrice: 0,
    expectedCommission: 0,
    referralSource: ''
  });

  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // Map backend transactions to ClosingDeal structure
  const deals = transactions.map((t: any) => ({
    id: t.id,
    clientName: t.client_name,
    propertyAddress: t.property_address,
    agentName: t.responsible_agent_id === 'ag_1' ? 'Alex Carter' : 'Jessica Keenan',
    closingDate: t.expected_closing_date || '',
    stage: t.current_stage || 'under_contract',
    salesPrice: t.sales_price || (t.revenue ? Math.round(t.revenue / 0.03) : 0),
    expectedCommission: t.revenue || 0,
    referralSource: t.referral_source || '',
    hasRequiredDocs: t.risk_reasons ? !t.risk_reasons.includes('Missing Docs') : true,
    confidence: t.risk_level === 'blocked' ? 'low' : t.risk_level === 'at_risk' ? 'medium' : 'high',
    isPaid: t.current_stage === 'closed'
  }));

  // Calculations for Summary Cards
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  const isNext30Days = (dateStr: string) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  };

  const closingsThisMonth = deals.filter((d: any) => !d.isPaid && isThisMonth(d.closingDate));
  const expectedCommThisMonth = closingsThisMonth.reduce((acc: number, d: any) => acc + (d.expectedCommission || 0), 0);
  const totalCommission = deals.reduce((acc: number, d: any) => acc + (d.expectedCommission || 0), 0);

  const riskAdjustedCommission = deals.reduce((acc: number, d: any) => {
    let multiplier = 1;
    if (d.confidence === 'low') multiplier = 0.3;
    else if (d.confidence === 'medium') multiplier = 0.7;
    return acc + (d.expectedCommission || 0) * multiplier;
  }, 0);

  const missingDataCount = deals.filter((d: any) => !d.closingDate || !d.expectedCommission || !d.referralSource).length;
  
  // Closings within 7 days with missing compliance docs
  const urgentMissingDocsCount = deals.filter((d: any) => {
    if (d.isPaid || d.hasRequiredDocs) return false;
    if (!d.closingDate) return false;
    const diff = new Date(d.closingDate).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }).length;

  // Filtered rows
  const filteredDeals = deals.filter((d: any) => {
    if (subFilter === 'all') return true;
    if (subFilter === 'this_month') return isThisMonth(d.closingDate);
    if (subFilter === 'next_30') return isNext30Days(d.closingDate);
    if (subFilter === 'missing_data') return !d.closingDate || !d.expectedCommission || !d.referralSource;
    if (subFilter === 'at_risk') return d.confidence === 'low' || d.confidence === 'medium';
    if (subFilter === 'ready_commission') return !d.isPaid && d.hasRequiredDocs === true;
    if (subFilter === 'closed') return d.isPaid === true;
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal)
      });
      if (res.ok) {
        setIsAddOpen(false);
        setNewDeal({
          clientName: '',
          propertyAddress: '',
          agentName: activeProfile?.name || 'Jessica Keenan',
          closingDate: '',
          salesPrice: 0,
          expectedCommission: 0,
          referralSource: ''
        });
        if (fetchState) await fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatedCsvUpload = async () => {
    const importedRows = [
      {
        clientName: 'Gordon Vance',
        propertyAddress: '150 Wall Street #42B',
        agentName: 'Jessica Keenan',
        closingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        salesPrice: 850000,
        expectedCommission: 25500,
        referralSource: 'Co-brokerage split'
      },
      {
        clientName: 'Arthur Pendleton',
        propertyAddress: '344 Clinton Street #3D',
        agentName: 'Alex Carter',
        closingDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        salesPrice: 320000,
        expectedCommission: 9600,
        referralSource: 'Online Portal Match'
      }
    ];

    try {
      for (const row of importedRows) {
        await fetch('/api/transactions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        });
      }
      if (fetchState) await fetchState();
      setCsvFeedback('Successfully parsed CSV spreadsheet: 2 transactions imported, columns matched automatically.');
      setTimeout(() => setCsvFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const isClosingSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  };

  const isSurpriseClosing = (dateStr: string, hasDocs: boolean) => {
    if (!dateStr || hasDocs) return false;
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 3;
  };

  const getNextAction = (deal: any) => {
    if (deal.isPaid) return "Archive transaction";
    if (!deal.hasRequiredDocs) {
      if (isClosingSoon(deal.closingDate)) return "URGENT: Chase missing disclosures";
      return "Request updated disclosures from agent";
    }
    if (!deal.referralSource) return "Update lead source in database";
    if (deal.stage === 'under_contract') return "Perform commission worksheet precheck";
    return "Approve commission payout";
  };

  return (
    <div className="space-y-6 font-sans text-xs text-[var(--sw-muted)] select-text text-left">
      <div className="flex justify-between items-center border-b border-[var(--sw-border)] pb-3 select-none">
        <div>
          <h3 className="text-sm font-bold text-[var(--sw-text)] uppercase tracking-wider font-mono select-none">Pipeline / Closing Tracker</h3>
          <p className="mt-1">Brokerage forecast projections, anticipated closing commissions, and document check milestones.</p>
        </div>
        <div className="flex bg-[var(--sw-card)] rounded-xl p-0.5 border border-[var(--sw-border)]">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'tracker' ? 'bg-[var(--sw-surface)] text-[var(--sw-green-900)] shadow-sm' : 'text-[var(--sw-muted)] hover:text-[var(--sw-text)]'
            }`}
          >
            Ledger View
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'forecast' ? 'bg-[var(--sw-surface)] text-[var(--sw-green-900)] shadow-sm' : 'text-[var(--sw-muted)] hover:text-[var(--sw-text)]'
            }`}
          >
            Forecast Projections
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="sw-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block font-bold">This Month Closings</span>
            <span className="text-lg font-black text-[var(--sw-text)] font-mono">{closingsThisMonth.length} files</span>
          </div>
          <Calendar className="w-7 h-7 text-[var(--sw-green-700)]/20 shrink-0" />
        </div>

        <div className="sw-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block font-bold">Expected Revenue</span>
            <span className="text-lg font-black text-[var(--sw-text)] font-mono">{formatCurrency(expectedCommThisMonth)}</span>
          </div>
          <DollarSign className="w-7 h-7 text-[var(--sw-green-700)]/20 shrink-0" />
        </div>

        <div className="sw-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block font-bold">Risk-Adjusted Payout</span>
            <span className="text-lg font-black text-[var(--sw-green-700)] font-mono">{formatCurrency(riskAdjustedCommission)}</span>
          </div>
          <TrendingUp className="w-7 h-7 text-[var(--sw-green-700)]/20 shrink-0" />
        </div>

        <div className="sw-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block font-bold">Missing Data</span>
            <span className="text-lg font-black text-[var(--sw-risk)] font-mono">{missingDataCount} files</span>
          </div>
          <AlertTriangle className="w-7 h-7 text-[var(--sw-risk)]/20 shrink-0" />
        </div>

        <div className="sw-card p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block font-bold">T-7 Docs Missing</span>
            <span className="text-lg font-black text-[var(--sw-risk)] font-mono animate-pulse">{urgentMissingDocsCount} alerts</span>
          </div>
          <AlertTriangle className="w-7 h-7 text-[var(--sw-risk)]/20 shrink-0" />
        </div>
      </div>

      {activeTab === 'tracker' && (
        <div className="space-y-4">
          
          {/* Sub Filters Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-2 select-none">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Active' },
                { id: 'this_month', label: 'This Month' },
                { id: 'next_30', label: 'Next 30 Days' },
                { id: 'missing_data', label: 'Missing Data' },
                { id: 'at_risk', label: 'At Risk' },
                { id: 'ready_commission', label: 'Ready for Commission' },
                { id: 'closed', label: 'Closed / Paid' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSubFilter(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    subFilter === sub.id 
                      ? 'bg-[var(--sw-green-900)] border-[var(--sw-green-900)] text-white font-bold' 
                      : 'bg-[var(--sw-card)] border-[var(--sw-border)] text-[var(--sw-muted)] hover:bg-[var(--sw-surface)]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimulatedCsvUpload}
                className="sw-btn sw-btn-secondary py-1.5 px-3 flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-[var(--sw-muted)]" />
                <span>Import CSV File</span>
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="sw-btn sw-btn-primary py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Log Transaction</span>
              </button>
            </div>
          </div>

          {csvFeedback && (
            <div className="bg-[var(--sw-mint-100)]/30 border border-[var(--sw-success)]/20 p-3 rounded-xl text-[var(--sw-success)] font-bold text-[10px] animate-fade-in select-text">
              {csvFeedback}
            </div>
          )}

          {isAddOpen && (
            <div className="sw-card p-5 max-w-lg animate-fade-in select-none">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-green-700)] uppercase tracking-wider block">Add Pending Closing File</span>
              <form onSubmit={handleAddSubmit} className="space-y-3 mt-3 select-text">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Client Name</label>
                    <input
                      type="text"
                      value={newDeal.clientName}
                      onChange={(e) => setNewDeal({ ...newDeal, clientName: e.target.value })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Property Address</label>
                    <input
                      type="text"
                      value={newDeal.propertyAddress}
                      onChange={(e) => setNewDeal({ ...newDeal, propertyAddress: e.target.value })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Target Closing Date</label>
                    <input
                      type="date"
                      value={newDeal.closingDate}
                      onChange={(e) => setNewDeal({ ...newDeal, closingDate: e.target.value })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Sales Price ($)</label>
                    <input
                      type="number"
                      value={newDeal.salesPrice}
                      onChange={(e) => setNewDeal({ ...newDeal, salesPrice: Number(e.target.value) })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Expected Commission ($)</label>
                    <input
                      type="number"
                      value={newDeal.expectedCommission}
                      onChange={(e) => setNewDeal({ ...newDeal, expectedCommission: Number(e.target.value) })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[var(--sw-text)] block">Referral split / Lead Source</label>
                    <input
                      type="text"
                      value={newDeal.referralSource}
                      onChange={(e) => setNewDeal({ ...newDeal, referralSource: e.target.value })}
                      className="w-full p-1.5 border border-[var(--sw-border)] rounded bg-[var(--sw-surface)] text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 select-none">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="sw-btn sw-btn-secondary px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="sw-btn sw-btn-primary px-4 py-1.5"
                  >
                    {isSubmitting ? 'Logging...' : 'Log File'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Ledger */}
          <div className="border border-[var(--sw-border)] rounded-2xl overflow-hidden shadow-[var(--sw-shadow-soft)] bg-[var(--sw-surface)]">
            <table className="w-full text-left table-fixed">
              <thead className="bg-[var(--sw-card)] text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider border-b border-[var(--sw-border)] select-none">
                <tr>
                  <th className="p-3 w-[20%]">Client & Address</th>
                  <th className="p-3 w-[10%]">Agent</th>
                  <th className="p-3 w-[10%]">Closing Date</th>
                  <th className="p-3 w-[12%]">Expected Commission</th>
                  <th className="p-3 w-[12%]">Source / Referral</th>
                  <th className="p-3 w-[10%]">Compliance</th>
                  <th className="p-3 w-[14%]">Next Action</th>
                  <th className="p-3 w-[12%]">Gaps / Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sw-border)] text-xs select-text">
                {filteredDeals.map((deal: any) => {
                  const dealBadges = [];
                  if (!deal.referralSource) {
                    dealBadges.push({ text: "Missing source", style: "bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] border border-[var(--sw-risk)]/15" });
                  }
                  if (!deal.hasRequiredDocs) {
                    dealBadges.push({ text: "Missing documents", style: "bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] border border-[var(--sw-risk)]/15" });
                  }
                  if (isClosingSoon(deal.closingDate)) {
                    dealBadges.push({ text: "Closing soon", style: "bg-[var(--sw-warning)]/10 text-[var(--sw-warning)] border border-[var(--sw-warning)]/15" });
                  }
                  if (deal.stage === 'under_contract' && !deal.hasRequiredDocs) {
                    dealBadges.push({ text: "Needs pre-check", style: "bg-blue-50 text-blue-700 border border-blue-100" });
                  }
                  if (deal.hasRequiredDocs && deal.stage !== 'closed') {
                    dealBadges.push({ text: "Ready for commission", style: "bg-[var(--sw-mint-100)] text-[var(--sw-success)] border border-[var(--sw-success)]/10" });
                  }
                  if (isSurpriseClosing(deal.closingDate, deal.hasRequiredDocs)) {
                    dealBadges.push({ text: "Surprise closing risk", style: "bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] font-bold border border-[var(--sw-risk)]/20 animate-pulse" });
                  }

                  // QuickBooks Payout Readiness badge
                  const qbSignals = (state.financeSignals || []).filter(
                    (s: any) => s.relatedTransactionId === deal.id && s.sourceSystem === 'quickbooks'
                  );
                  const hasPayment = qbSignals.some((s: any) => s.signalType === 'payment_received');
                  const hasDeposit = qbSignals.some((s: any) => s.signalType === 'deposit_received');
                  
                  if (deal.stage?.toLowerCase() === 'closed') {
                    if (hasPayment) {
                      dealBadges.push({ text: "QB Payout Ready", style: "bg-emerald-950 text-emerald-400 border border-emerald-900/50 font-mono text-[7px]" });
                    } else {
                      dealBadges.push({ text: "Missing QB Payment", style: "bg-rose-950 text-rose-400 border border-rose-900/50 font-mono text-[7px]" });
                    }
                  } else if (hasPayment) {
                    dealBadges.push({ text: "QB Paid (Pending Close)", style: "bg-amber-950 text-amber-400 border border-amber-900/50 font-mono text-[7px]" });
                  } else if (hasDeposit) {
                    dealBadges.push({ text: "Escrow Deposit Verified", style: "bg-blue-950 text-blue-400 border border-blue-900/50 font-mono text-[7px]" });
                  }

                  return (
                    <tr 
                      key={deal.id} 
                      onClick={() => onInspectRecord && onInspectRecord('Transaction', deal.id)}
                      className={`hover:bg-[var(--sw-bg-soft)]/20 cursor-pointer ${deal.isPaid ? 'opacity-60 bg-[var(--sw-bg-soft)]/5' : ''}`}
                    >
                      <td className="p-3 truncate">
                        <span className="font-bold text-[var(--sw-text)] block truncate">{deal.clientName}</span>
                        <span className="text-[10px] text-[var(--sw-muted)] block mt-0.5 truncate">{deal.propertyAddress}</span>
                      </td>
                      <td className="p-3 font-mono font-medium truncate">{deal.agentName}</td>
                      <td className="p-3">
                        {deal.closingDate ? (
                          <span className={`font-mono ${isClosingSoon(deal.closingDate) ? 'text-[var(--sw-risk)] font-bold' : 'text-[var(--sw-text)]'}`}>
                            {deal.closingDate}
                          </span>
                        ) : (
                          <span className="text-[var(--sw-risk)] font-bold select-none">[MISSING DATE]</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-[var(--sw-text)]">
                        {deal.expectedCommission ? (
                          <span>{formatCurrency(deal.expectedCommission)}</span>
                        ) : (
                          <span className="text-[var(--sw-risk)] font-bold select-none">[MISSING COMM]</span>
                        )}
                      </td>
                      <td className="p-3 truncate">
                        {deal.referralSource ? (
                          <span className="px-2 py-0.5 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-md font-medium truncate inline-block max-w-[120px]">{deal.referralSource}</span>
                        ) : (
                          <span className="text-[var(--sw-warning)] font-bold select-none">[MISSING SOURCE]</span>
                        )}
                      </td>
                      <td className="p-3">
                        {deal.hasRequiredDocs ? (
                          <span className="text-[var(--sw-success)] font-bold flex items-center gap-1 select-none">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Passed
                          </span>
                        ) : (
                          <span className="text-[var(--sw-risk)] font-bold flex items-center gap-1 select-none">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Docs Missing
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-[var(--sw-text)] truncate">
                        {getNextAction(deal)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 select-none">
                          {dealBadges.map((badge, bIdx) => (
                            <span key={bIdx} className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${badge.style}`}>
                              {badge.text}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[var(--sw-muted)] select-none">
                      <FileText className="w-8 h-8 mx-auto text-[var(--sw-muted-light)] mb-2" />
                      <p className="font-bold">Add or import active transactions to start tracking closings, missing data, compliance status, and expected commission.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4 bg-[var(--sw-card)] border border-[var(--sw-border)] p-5 rounded-2xl">
          <span className="font-mono font-bold text-[9px] text-[var(--sw-green-700)] uppercase tracking-wider block select-none">Operational Cash-Flow Forecasting</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-text">
            
            {/* Forecast Month summary */}
            <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] p-4 rounded-xl space-y-3">
              <span className="font-bold text-[var(--sw-text)] block">Expected Commissions Forecast</span>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-[var(--sw-border)] pb-1.5">
                  <span className="text-[var(--sw-muted)]">Current Month Expected (T-30 days)</span>
                  <span className="font-mono font-bold text-[var(--sw-text)]">{formatCurrency(totalCommission * 0.7)}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--sw-border)] pb-1.5">
                  <span className="text-[var(--sw-muted)]">Next Month Expected (T-60 days)</span>
                  <span className="font-mono font-bold text-[var(--sw-text)]">{formatCurrency(totalCommission * 0.3)}</span>
                </div>
                <div className="flex justify-between font-bold text-[var(--sw-green-900)] pt-1">
                  <span>Total Expected Backlog</span>
                  <span className="font-mono">{formatCurrency(totalCommission)}</span>
                </div>
              </div>
            </div>

            {/* Risk adjustment calculations explanations */}
            <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] p-4 rounded-xl space-y-3 select-none">
              <span className="font-bold text-[var(--sw-text)] block">Risk-Adjustment Formula weighting</span>
              <p className="text-[11px] text-[var(--sw-muted)] leading-relaxed">
                We discount forecast expected values by transaction file health ratings:
              </p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--sw-muted)]">High Confidence (Passed Docs)</span>
                  <span className="font-bold text-[var(--sw-success)] font-mono">100% Weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--sw-muted)]">Medium Confidence (Incomplete docs/T-14)</span>
                  <span className="font-bold text-[var(--sw-warning)] font-mono">70% Weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--sw-muted)]">Low Confidence (Missing key date/late uploads)</span>
                  <span className="font-bold text-[var(--sw-risk)] font-mono">30% Weight</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
