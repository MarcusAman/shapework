import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileSpreadsheet,
  Mail,
  Video,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Send,
  Sparkles,
  Calculator,
  HardDrive
} from 'lucide-react';

interface DriveVault {
  id: string;
  name: string;
  url: string;
  itemCount: number;
  subfolders: { name: string; url: string; templateCount: number }[];
  propertyAddress: string;
  agentEmail: string;
}

interface NetSheetResult {
  sheetId: string;
  sheetTitle: string;
  exportUrl: string;
  propertyAddress: string;
  listingPrice: number;
  expenses: {
    firstMortgage: number;
    secondMortgage: number;
    totalCommission: number;
    ncExciseTax: number;
    propertyTaxProrationEst: number;
    hoaProrationEst: number;
    repairsAllowance: number;
    attorneyAndWireFees: number;
    totalClosingCosts: number;
  };
  estimatedNetToSeller: number;
  netPercentageOfList: number;
}

interface GmailMessage {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  receivedAt: string;
  category: string;
  urgency: 'high' | 'medium' | 'low';
  summary: string;
  proposedDraft: {
    to: string;
    subject: string;
    body: string;
  };
  attachments: { name: string; type: string; sizeKb: number }[];
}

export const NoraGoogleWorkspaceHub: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'drive' | 'netsheet' | 'gmail' | 'meet'>('drive');
  const [vaults, setVaults] = useState<DriveVault[]>([]);
  const [gmailFeed, setGmailFeed] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Vault Form
  const [newVaultAddress, setNewVaultAddress] = useState('');
  const [newVaultClient, setNewVaultClient] = useState('');
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Net Sheet State
  const [listPrice, setListPrice] = useState(725000);
  const [mortgagePayoff, setMortgagePayoff] = useState(380000);
  const [commissionRate, setCommissionRate] = useState(5.5);
  const [propTaxes, setPropTaxes] = useState(4200);
  const [hoaDues, setHoaDues] = useState(1800);
  const [repairsCredit, setRepairsCredit] = useState(2500);
  const [netSheetResult, setNetSheetResult] = useState<NetSheetResult | null>(null);

  // Google Meet State
  const [meetTitle, setMeetTitle] = useState('Landfall Listing Strategy Session');
  const [generatedMeet, setGeneratedMeet] = useState<{ meetUrl: string; conferenceId: string; phonePin: string } | null>(null);

  useEffect(() => {
    fetchVaults();
    fetchGmail();
    recalculateNetSheet();
  }, []);

  const fetchVaults = async () => {
    try {
      const res = await fetch('/api/nora/google-workspace/vaults');
      const data = await res.json();
      if (data.success) setVaults(data.vaults || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGmail = async () => {
    try {
      const res = await fetch('/api/nora/google-workspace/gmail-triage');
      const data = await res.json();
      if (data.success) setGmailFeed(data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const recalculateNetSheet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nora/google-workspace/generate-net-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: newVaultAddress || '312 Mayfaire Way, Wilmington NC',
          sellerName: 'Michael & Sarah Chang',
          listingPrice: listPrice,
          firstMortgagePayoff: mortgagePayoff,
          totalCommissionPercent: commissionRate,
          annualPropertyTaxes: propTaxes,
          hoaDuesPerYear: hoaDues,
          estimatedRepairsAllowance: repairsCredit
        })
      });
      const data = await res.json();
      if (data.success) setNetSheetResult(data.netSheet);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultAddress) return;
    setIsCreatingVault(true);
    try {
      const res = await fetch('/api/nora/google-workspace/create-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: newVaultAddress,
          clientName: newVaultClient || 'Client File',
          agentEmail: 'ryan@nestrealty.com'
        })
      });
      const data = await res.json();
      if (data.success) {
        setVaults(prev => [data.vault, ...prev]);
        setNewVaultAddress('');
        setNewVaultClient('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingVault(false);
    }
  };

  const handleGenerateMeet = async () => {
    try {
      const res = await fetch('/api/nora/google-workspace/generate-meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingTitle: meetTitle,
          startTime: 'Today, 2:00 PM',
          attendees: ['ryan@nestrealty.com', 'melissa.gagliardi@nestrealty.com']
        })
      });
      const data = await res.json();
      if (data.success) setGeneratedMeet(data.meet);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation (Apple Light Mode) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubtab('drive')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubtab === 'drive'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-[#00635C]" />
            Drive Transaction Vaults ({vaults.length})
          </button>
          <button
            onClick={() => setActiveSubtab('netsheet')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubtab === 'netsheet'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Seller Net Sheet (Sheets Engine)
          </button>
          <button
            onClick={() => setActiveSubtab('gmail')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubtab === 'gmail'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            Gmail Triage (AskNora@nestrealty.com)
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
              {gmailFeed.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubtab('meet')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubtab === 'meet'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-blue-600" />
            Google Meet Video Link
          </button>
        </div>
      </div>

      {/* 1. Drive Transaction Vaults View */}
      {activeSubtab === 'drive' && (
        <div className="space-y-6">
          {/* Create Vault Quick Bar */}
          <form onSubmit={handleCreateVault} className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#00635C]" />
                <h4 className="text-xs font-semibold text-stone-900">1-Click Google Drive Transaction Vault Generator</h4>
              </div>
              <span className="text-[11px] text-stone-700">Pre-copies Form 2-T, RPOADS & Maxa templates</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Property Address (e.g. 504 Soundview Dr)"
                value={newVaultAddress}
                onChange={e => setNewVaultAddress(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
              <input
                type="text"
                placeholder="Client Name (e.g. David & Karen Miller)"
                value={newVaultClient}
                onChange={e => setNewVaultClient(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
              <button
                type="submit"
                disabled={isCreatingVault || !newVaultAddress}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreatingVault ? 'Creating Folder Structure...' : 'Create Drive Vault'}
              </button>
            </div>
          </form>

          {/* Active Vaults Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vaults.map(vault => (
              <div key={vault.id} className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00635C] flex items-center justify-center border border-emerald-100">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900 truncate max-w-[200px]">{vault.propertyAddress}</h5>
                        <p className="text-[10px] text-stone-700">{vault.agentEmail}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-stone-100 text-stone-600 rounded-full">
                      {vault.itemCount} Files
                    </span>
                  </div>

                  <div className="space-y-1.5 my-3 pt-2 border-t border-stone-100">
                    {vault.subfolders.map((sub, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-stone-600">
                        <span className="truncate max-w-[180px]">📁 {sub.name}</span>
                        <span className="text-[10px] text-stone-600">{sub.templateCount} docs</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <a
                    href={vault.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-medium text-[#00635C] hover:underline"
                  >
                    Open in Google Drive
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleCopy(vault.url, vault.id)}
                    className="p-1 text-stone-600 hover:text-stone-600 rounded"
                    title="Copy Drive Link"
                  >
                    {copiedId === vault.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Seller Net Sheet Calculator (Sheets Engine) */}
      {activeSubtab === 'netsheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Calculator className="w-4 h-4 text-[#00635C]" />
              <h4 className="text-xs font-bold text-stone-900">Transaction Financial Parameters</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">Estimated Listing / Sale Price ($)</label>
                <input
                  type="number"
                  value={listPrice}
                  onChange={e => setListPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">First Mortgage Payoff ($)</label>
                <input
                  type="number"
                  value={mortgagePayoff}
                  onChange={e => setMortgagePayoff(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Repairs Credit ($)</label>
                  <input
                    type="number"
                    value={repairsCredit}
                    onChange={e => setRepairsCredit(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                  />
                </div>
              </div>

              <button
                onClick={recalculateNetSheet}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Calculate Net Wire Proceeds
              </button>
            </div>
          </div>

          {/* Net Sheet Display Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm flex flex-col justify-between">
            {netSheetResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Google Sheets Live Model</span>
                    <h3 className="text-sm font-bold text-stone-900">{netSheetResult.sheetTitle}</h3>
                  </div>
                  <a
                    href={netSheetResult.exportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Open in Google Sheets
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="text-[10px] text-stone-700 block">List Price</span>
                    <span className="text-sm font-bold text-stone-900">${netSheetResult.listingPrice.toLocaleString()}</span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="text-[10px] text-stone-700 block">Brokerage Comm (5.5%)</span>
                    <span className="text-sm font-bold text-stone-900">${netSheetResult.expenses.totalCommission.toLocaleString()}</span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="text-[10px] text-stone-700 block">NC Revenue Stamp</span>
                    <span className="text-sm font-bold text-stone-900">${netSheetResult.expenses.ncExciseTax.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-[10px] text-emerald-800 font-bold block">Estimated Net Proceeds</span>
                    <span className="text-base font-extrabold text-emerald-800">${netSheetResult.estimatedNetToSeller.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border border-stone-100 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-700">
                      <tr>
                        <th className="py-2 px-3">Expense Category</th>
                        <th className="py-2 px-3">Statutory / Contract Rule</th>
                        <th className="py-2 px-3 text-right">Estimated Deduction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      <tr>
                        <td className="py-2 px-3 font-medium">First Mortgage Payoff</td>
                        <td className="py-2 px-3 text-stone-600">Principal Balance & Per Diem Interest</td>
                        <td className="py-2 px-3 text-right font-semibold">${netSheetResult.expenses.firstMortgage.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">NC Excise Tax (Revenue Stamps)</td>
                        <td className="py-2 px-3 text-stone-600">NCGS § 105-228.30 ($1.00 per $500)</td>
                        <td className="py-2 px-3 text-right font-semibold">${netSheetResult.expenses.ncExciseTax.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">Closing Attorney & Wire Fees</td>
                        <td className="py-2 px-3 text-stone-600">Craige & Fox PLLC Partner Rate</td>
                        <td className="py-2 px-3 text-right font-semibold">${netSheetResult.expenses.attorneyAndWireFees.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium">Prorated Taxes & HOA Dues</td>
                        <td className="py-2 px-3 text-stone-600">Form 2-T Paragraph 13 Standard Proration</td>
                        <td className="py-2 px-3 text-right font-semibold">${(netSheetResult.expenses.propertyTaxProrationEst + netSheetResult.expenses.hoaProrationEst).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Gmail Triage Assistant */}
      {activeSubtab === 'gmail' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#00635C]" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">AskNora@nestrealty.com • Smart Client Triage Feed</h4>
                <p className="text-[11px] text-stone-700">Autonomous email intake, intent classification, and AI drafted replies ready for broker approval</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              🟢 Connected to Google Workspace
            </span>
          </div>

          <div className="space-y-3">
            {gmailFeed.map(msg => (
              <div key={msg.id} className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        msg.urgency === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {msg.urgency} Urgency
                      </span>
                      <span className="text-xs font-bold text-stone-900">{msg.fromName}</span>
                      <span className="text-[11px] text-stone-600">({msg.from})</span>
                    </div>
                    <h5 className="text-xs font-semibold text-stone-800">{msg.subject}</h5>
                    <p className="text-[11px] text-stone-600 mt-1">{msg.summary}</p>
                  </div>
                  <span className="text-[10px] text-stone-600 whitespace-nowrap">
                    {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* AI Draft Response Box */}
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                    <span className="flex items-center gap-1 text-[#00635C]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Nora AI Proposed Response Draft
                    </span>
                    <button
                      onClick={() => handleCopy(msg.proposedDraft.body, `draft_${msg.id}`)}
                      className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
                    >
                      {copiedId === `draft_${msg.id}` ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Copy Draft
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-700 whitespace-pre-line bg-white p-2.5 rounded border border-stone-100">
                    {msg.proposedDraft.body}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[10px] text-stone-600">
                      <span>📎 Attachments:</span>
                      {msg.attachments.map((att, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded text-[9px]">
                          {att.name} ({(att.sizeKb / 1024).toFixed(1)} MB)
                        </span>
                      ))}
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1 bg-[#00635C] hover:bg-[#00524C] text-white text-[11px] font-medium rounded shadow-sm">
                      <Send className="w-3 h-3" />
                      Dispatch Email
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Google Meet Video Link */}
      {activeSubtab === 'meet' && (
        <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm max-w-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Video className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-stone-900">Instant Google Meet Conference Generator</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block mb-1">Meeting Topic</label>
              <input
                type="text"
                value={meetTitle}
                onChange={e => setMeetTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
              />
            </div>

            <button
              onClick={handleGenerateMeet}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              Generate Google Meet Link
            </button>
          </div>

          {generatedMeet && (
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Google Meet Active Link:</span>
                <button
                  onClick={() => handleCopy(generatedMeet.meetUrl, 'meet_url')}
                  className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
                >
                  {copiedId === 'meet_url' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy URL
                </button>
              </div>
              <a
                href={generatedMeet.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-blue-600 underline block"
              >
                {generatedMeet.meetUrl}
              </a>
              <div className="text-[11px] text-blue-800 pt-1">
                <span>Dial-in PIN: <strong>{generatedMeet.phonePin}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
