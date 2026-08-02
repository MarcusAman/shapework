/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Send, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  X,
  Sliders,
  Sparkles
} from 'lucide-react';
import { 
  MercuryAccount, 
  MercuryInvoice, 
  MercuryTransaction, 
  INITIAL_MERCURY_ACCOUNTS, 
  INITIAL_MERCURY_INVOICES, 
  INITIAL_MERCURY_TRANSACTIONS 
} from '../../services/mercuryService';

interface MercuryPaymentsHubProps {
  state?: any;
}

export default function MercuryPaymentsHub({ state }: MercuryPaymentsHubProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payouts' | 'ledger' | 'settings'>('invoices');
  const [accounts, setAccounts] = useState<MercuryAccount[]>(INITIAL_MERCURY_ACCOUNTS);
  const [invoices, setInvoices] = useState<MercuryInvoice[]>(INITIAL_MERCURY_INVOICES);
  const [transactions, setTransactions] = useState<MercuryTransaction[]>(INITIAL_MERCURY_TRANSACTIONS);

  // Invoice creation drawer state
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [clientName, setClientName] = useState('Nest Realty Wilmington');
  const [clientEmail, setClientEmail] = useState('ryan@nestrealty.com');
  const [clientWorkspaceId, setClientWorkspaceId] = useState('nest-realty-demo');
  const [invoiceDueDate, setInvoiceDueDate] = useState('2026-08-15');
  const [paymentMethod, setPaymentMethod] = useState<'ach' | 'wire' | 'card'>('ach');
  const [invoiceNotes, setInvoiceNotes] = useState('Thank you for choosing Shapework OS!');
  const [lineItemDesc, setLineItemDesc] = useState('Shapework OS Enterprise Platform License (Monthly)');
  const [lineItemAmount, setLineItemAmount] = useState('4500');

  // Payout drawer state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutRecipient, setPayoutRecipient] = useState('Apex Media & Photography');
  const [payoutEmail, setPayoutEmail] = useState('billing@apexmedia.com');
  const [payoutAmount, setPayoutAmount] = useState('500');
  const [payoutCategory, setPayoutCategory] = useState('Vendor Payout');
  const [payoutNote, setPayoutNote] = useState('Twilight Drone Photography — Lumina Ave Listing');

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'sent' | 'overdue'>('all');

  // Mercury API Key Settings state
  const [apiEnvironment, setApiEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [apiKeyInput, setApiKeyInput] = useState('mercury_live_998124x_shpwk_prod_8819023');
  const [webhookUrl, setWebhookUrl] = useState('https://shapework-os.run.app/api/internal/mercury/webhook');

  const primaryAccount = accounts[0];
  const totalBalance = accounts.reduce((acc, a) => acc + a.availableBalance, 0);
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amountDue, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amountPaid, 0);
  const pendingInbound = invoices.filter(i => i.status === 'sent').reduce((acc, i) => acc + i.amountDue, 0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(lineItemAmount) || 0;
    const invId = `inv_${Date.now()}`;
    const invNum = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice: MercuryInvoice = {
      id: invId,
      invoiceNumber: invNum,
      clientName,
      clientEmail,
      clientWorkspaceId,
      status: 'sent',
      amountDue: amountNum,
      amountPaid: 0,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceDueDate,
      paymentMethod,
      paymentLink: `https://pay.mercury.com/${invId}`,
      items: [
        {
          id: `item_${Date.now()}`,
          description: lineItemDesc,
          quantity: 1,
          unitPrice: amountNum,
          amount: amountNum
        }
      ],
      notes: invoiceNotes
    };

    setInvoices([newInvoice, ...invoices]);
    setShowCreateInvoiceModal(false);
    showToast(`⚡ Mercury Invoice ${invNum} ($${amountNum.toLocaleString()}) created & sent to ${clientEmail}!`);
  };

  const handleSimulatePayment = (invId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        // Add credit transaction
        const newTx: MercuryTransaction = {
          id: `tx_${Date.now()}`,
          amount: inv.amountDue,
          type: 'credit',
          counterpartyName: inv.clientName,
          category: 'Subscription Income',
          status: 'settled',
          postedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          description: `${inv.invoiceNumber} Payment Settled via Mercury ${inv.paymentMethod.toUpperCase()}`,
          referenceNumber: `ACH-${Math.floor(1000000 + Math.random() * 9000000)}`
        };
        setTransactions([newTx, ...transactions]);
        // Update account balance
        setAccounts(accs => accs.map((a, idx) => idx === 0 ? { ...a, availableBalance: a.availableBalance + inv.amountDue } : a));

        return {
          ...inv,
          status: 'paid',
          amountPaid: inv.amountDue
        };
      }
      return inv;
    }));
    showToast(`✅ Payment Settled! Funds credited to Mercury Primary Checking account.`);
  };

  const handleSendPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount) || 0;
    if (amountNum > primaryAccount.availableBalance) {
      showToast(`❌ Insufficient Mercury funds for payout of $${amountNum.toLocaleString()}`);
      return;
    }

    const newTx: MercuryTransaction = {
      id: `tx_${Date.now()}`,
      amount: amountNum,
      type: 'debit',
      counterpartyName: payoutRecipient,
      category: payoutCategory,
      status: 'settled',
      postedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      description: payoutNote || `Payout to ${payoutRecipient}`,
      referenceNumber: `ACH-${Math.floor(1000000 + Math.random() * 9000000)}`
    };

    setTransactions([newTx, ...transactions]);
    setAccounts(accs => accs.map((a, idx) => idx === 0 ? { ...a, availableBalance: a.availableBalance - amountNum } : a));
    setShowPayoutModal(false);
    showToast(`💸 Outbound ACH Payout of $${amountNum.toLocaleString()} dispatched to ${payoutRecipient}!`);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.clientName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-mono font-semibold flex items-center gap-3 animate-bounce max-w-md">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-serif font-black text-base shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-bold text-slate-900 tracking-tight">
                Mercury Banking, Invoices & Payouts
              </h1>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Manage Shapework OS client quotes, send invoices, receive ACH/Card payments, and disburse payouts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowPayoutModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-slate-600" />
            <span>Send ACH Payout</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateInvoiceModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Quote / Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Mercury Total Available</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">Primary Checking (***8841)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Total Invoiced</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900">${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">{invoices.length} Enterprise Quotes / Invoices</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Pending Inbound ACH</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-amber-600">${pendingInbound.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">{invoices.filter(i => i.status === 'sent').length} Unsettled Invoices</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500">Mercury API Integration</span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-bold text-slate-900 uppercase font-mono">{apiEnvironment} API</span>
            </div>
            <span className="block text-[11px] text-slate-500 mt-0.5">Webhook Active (200 OK)</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Invoices & Quotes ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Outbound Payouts
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Live Bank Ledger ({transactions.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Mercury API & Webhooks
          </button>
        </div>
      </div>

      {/* TAB 1: INVOICES & QUOTES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice number, client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[11px] text-slate-500 font-mono font-bold">Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('sent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  statusFilter === 'sent' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Sent / Pending
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Paid & Settled
              </button>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase font-bold text-slate-500">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client / Brokerage</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Issued / Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.clientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{inv.clientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-slate-900 text-sm">
                        ${inv.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold uppercase">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 font-mono">
                        <div>Issue: {inv.issueDate}</div>
                        <div className="text-slate-400">Due: {inv.dueDate}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === 'paid' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PAID & SETTLED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" />
                            SENT / PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(inv.paymentLink, inv.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Copy Mercury Payment Link"
                          >
                            {copiedId === inv.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>Link</span>
                          </button>

                          {inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => handleSimulatePayment(inv.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <span>Mark Paid</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OUTBOUND PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">Outbound Vendor & Agent Commission Payouts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Send direct ACH or Wire payouts to vendors (photographers, sign couriers) or agent commission splits from Mercury.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Recent Vendor Payout</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ACH Settled</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Apex Media & Photography</h4>
                  <p className="text-xs text-slate-500">Twilight Aerial Drone Photography — Lumina Ave</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-mono text-xs">
                  <span className="text-slate-500">Amount Sent:</span>
                  <span className="font-bold text-slate-900">$450.00</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Recent Courier Payout</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ACH Settled</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Wilmington Sign Courier LLC</h4>
                  <p className="text-xs text-slate-500">Yard Sign Rider Installation — 304 Ocean Blvd</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-mono text-xs">
                  <span className="text-slate-500">Amount Sent:</span>
                  <span className="font-bold text-slate-900">$120.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE BANK LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">Mercury Live Transactions Ledger</h3>
              <p className="text-xs text-slate-500">Real-time posting log of credits, debits, and ACH settlements.</p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-mono text-[11px] font-bold border border-slate-200">
              Account ***8841
            </span>
          </div>

          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{tx.counterpartyName}</h4>
                    <p className="text-[11px] text-slate-500">{tx.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-serif font-bold text-sm block ${tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">{tx.postedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MERCURY API & WEBHOOKS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-slate-900 text-base">Mercury API & Webhook Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Mercury API tokens, environment modes, and webhook listener URLs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  API Environment Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setApiEnvironment('sandbox')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      apiEnvironment === 'sandbox'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sandbox Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiEnvironment('production')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      apiEnvironment === 'production'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Production Mode
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Mercury API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Webhook URL Listener
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={() => showToast('✅ Mercury API & Webhook Configuration Saved!')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Save API Keys
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 uppercase text-[11px]">Live Webhook Log</span>
                <span className="text-[10px] text-slate-400">Listening on 200 OK</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-300">
                <p><span className="text-emerald-400">[2026-07-30 15:58:01]</span> POST /api/internal/mercury/webhook — 200 OK</p>
                <p className="text-slate-400">Event: payment.settled (INV-2026-081)</p>
                <p><span className="text-emerald-400">[2026-07-30 14:12:44]</span> POST /api/internal/mercury/webhook — 200 OK</p>
                <p className="text-slate-400">Event: payout.dispatched (ACH-4412091)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Create Mercury Quote / Invoice</h3>
                <p className="text-xs text-slate-500">Issue an invoice with a 1-click Mercury ACH/Card payment link.</p>
              </div>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Client / Brokerage Name
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDueDate}
                    onChange={e => setInvoiceDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Line Item Description
                </label>
                <input
                  type="text"
                  required
                  value={lineItemDesc}
                  onChange={e => setLineItemDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={lineItemAmount}
                    onChange={e => setLineItemAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                  >
                    <option value="ach">ACH Direct Transfer</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="wire">Domestic Wire</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Send Invoice via Mercury
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUTBOUND PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base">Send Outbound Mercury ACH Payout</h3>
                <p className="text-xs text-slate-500">Dispatch ACH or Wire payment to vendor or agent directly from checking.</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendPayout} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Recipient Name / Vendor
                </label>
                <input
                  type="text"
                  required
                  value={payoutRecipient}
                  onChange={e => setPayoutRecipient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={payoutCategory}
                    onChange={e => setPayoutCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-500"
                  >
                    <option value="Vendor Payout">Vendor Payout</option>
                    <option value="Agent Commission Split">Agent Commission Split</option>
                    <option value="Software Expense">Software Expense</option>
                    <option value="Marketing Expense">Marketing Expense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-600 mb-1">
                  Payment Reference / Note
                </label>
                <input
                  type="text"
                  required
                  value={payoutNote}
                  onChange={e => setPayoutNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Dispatch ACH Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
