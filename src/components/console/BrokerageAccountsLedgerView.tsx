import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  CreditCard, 
  UserCheck, 
  Plus, 
  ArrowRight, 
  Search, 
  Filter, 
  ShieldAlert, 
  ExternalLink,
  Users,
  DollarSign,
  Send,
  RefreshCw,
  X
} from 'lucide-react';
import { orgChartService } from '../../services/orgChartService';

interface BrokerageAccountsLedgerViewProps {
  state: any;
}

export default function BrokerageAccountsLedgerView({ state }: BrokerageAccountsLedgerViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'past_due'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  // Provisioning form state
  const [sourceWorkspaceId, setSourceWorkspaceId] = useState('nest-realty-demo');
  const [targetBrokerageName, setTargetBrokerageName] = useState('Nest Realty Triangle');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState('nest-realty-triangle');
  const [principalBrokerName, setPrincipalBrokerName] = useState('Ryan Crecelius');
  const [principalBrokerEmail, setPrincipalBrokerEmail] = useState('ryan@nestrealty.com');
  const [officesInput, setOfficesInput] = useState('Raleigh, Durham, Chapel Hill');
  const [clonePositions, setClonePositions] = useState(true);
  const [cloneRoles, setCloneRoles] = useState(true);
  const [cloneSops, setCloneSops] = useState(true);
  const [cloneRouting, setCloneRouting] = useState(true);
  const [cloneResult, setCloneResult] = useState<any>(null);

  const brokerageAccounts = [
    {
      id: 'nest-wilmington',
      name: 'Nest Realty Wilmington',
      workspaceId: 'nest-realty-demo',
      status: 'active',
      statusLabel: 'Active & Paid',
      agreementStatus: 'Signed 2-Year Enterprise SLA',
      billingStatus: 'Active (ACH Direct)',
      billingDate: 'Paid on Jul 1, 2026',
      agentsCount: 76,
      offices: ['Mayfaire', 'Carolina Beach', 'Hampstead', 'Remote'],
      principalBroker: 'Ryan Crecelius (BIC)',
      contactEmail: 'ryan@nestrealty.com',
      monthlyVolume: '$18.5M Vol / Mo',
      signedDate: 'Jan 15, 2026'
    },
    {
      id: 'nest-triangle',
      name: 'Nest Realty Triangle (Raleigh/Durham)',
      workspaceId: 'nest-realty-triangle',
      status: 'active',
      statusLabel: 'Active & Paid',
      agreementStatus: 'Signed Pilot Agreement',
      billingStatus: 'Active (ACH Direct)',
      billingDate: 'Paid on Jul 15, 2026',
      agentsCount: 42,
      offices: ['Raleigh', 'Durham', 'Chapel Hill'],
      principalBroker: 'Ryan Crecelius (BIC)',
      contactEmail: 'ryan@nestrealty.com',
      monthlyVolume: '$12.2M Vol / Mo',
      signedDate: 'May 01, 2026'
    },
    {
      id: 'landmark-realty',
      name: 'Landmark Real Estate Group',
      workspaceId: 'landmark-realty-draft',
      status: 'pending',
      statusLabel: 'Agreement Pending',
      agreementStatus: 'Out for Signature (Draft #2)',
      billingStatus: 'Pending Deployment',
      billingDate: 'Pending Execution',
      agentsCount: 35,
      offices: ['Wilmington Downtown', 'Wrightsville Beach'],
      principalBroker: 'David Vance (Managing Broker)',
      contactEmail: 'david@landmarknc.com',
      monthlyVolume: '$9.8M Vol / Mo (Est)',
      signedDate: 'Sent Jul 22, 2026'
    },
    {
      id: 'cape-fear-luxury',
      name: 'Cape Fear Luxury Collective',
      workspaceId: 'cape-fear-luxury-proposal',
      status: 'pending',
      statusLabel: 'Unsigned Draft',
      agreementStatus: 'Proposal Review Stage',
      billingStatus: 'Unsigned Proposal',
      billingDate: 'Unsigned',
      agentsCount: 18,
      offices: ['Lumina Ave', 'Porters Neck'],
      principalBroker: 'Jessica Keenan (Owner/Broker)',
      contactEmail: 'jessica@capefearluxury.com',
      monthlyVolume: '$6.4M Vol / Mo (Est)',
      signedDate: 'Draft Created Jul 25, 2026'
    },
    {
      id: 'intracoastal-regional',
      name: 'Intracoastal Regional Hub',
      workspaceId: 'intracoastal-regional-hold',
      status: 'past_due',
      statusLabel: 'Past Due / Hold',
      agreementStatus: 'Signed SLA (Billing Issue)',
      billingStatus: 'Past Due 18 Days ($5,200/mo)',
      billingDate: 'Invoice Overdue since Jul 11, 2026',
      agentsCount: 110,
      offices: ['Wilmington', 'Leland', 'Oak Island'],
      principalBroker: 'Marcus Vance (BIC)',
      contactEmail: 'marcus@intracoastalliving.com',
      monthlyVolume: '$26.0M Vol / Mo',
      signedDate: 'Feb 10, 2026'
    }
  ];

  const handleRunClone = (e: React.FormEvent) => {
    e.preventDefault();
    const offices = officesInput.split(',').map(s => s.trim()).filter(Boolean);
    const res = orgChartService.cloneWorkspace(sourceWorkspaceId, {
      brokerageName: targetBrokerageName,
      targetWorkspaceId,
      offices,
      principalBrokerName,
      principalBrokerEmail,
      clonePositions,
      cloneRoles,
      cloneSops,
      cloneRouting
    });
    setCloneResult(res);
  };

  const handleSwitchToTenant = (wsId: string) => {
    state.setWorkspaceId(wsId);
    setTimeout(() => {
      state.fetchState();
    }, 100);
  };

  const filteredAccounts = brokerageAccounts.filter(acc => {
    const matchesStatus = filterStatus === 'all' || acc.status === filterStatus;
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.principalBroker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeCount = brokerageAccounts.filter(a => a.status === 'active').length;
  const pendingCount = brokerageAccounts.filter(a => a.status === 'pending').length;
  const pastDueCount = brokerageAccounts.filter(a => a.status === 'past_due').length;

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 font-sans">Customer Brokerage Accounts & Agreements</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage active paying brokerages, review pending agreements, track past-due billing statuses, and provision new customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 select-none">
          <button 
            onClick={() => setShowProvisionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Setup / Provision Brokerage</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Total Brokerages</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{brokerageAccounts.length}</span>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Tracked</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Total customer accounts in roster</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Active & Paying</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">{activeCount}</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">Healthy</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Signed agreement & current billing</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Pending Agreement</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-amber-700 font-mono">{pendingCount}</span>
            <span className="text-[10px] text-amber-700 font-mono font-bold">Unsigned</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Draft sent / pending execution</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Past Due / Inactive</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-rose-700 font-mono">{pastDueCount}</span>
            <span className="text-[10px] text-rose-700 font-mono font-bold">Action Needed</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Overdue invoices or hold status</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Accounts ({brokerageAccounts.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active & Paying ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Agreement ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('past_due')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'past_due' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Due / Inactive ({pastDueCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by brokerage or BIC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>
      </div>

      {/* Brokerage Accounts List */}
      <div className="space-y-4">
        {filteredAccounts.map(account => (
          <div 
            key={account.id}
            className={`bg-white border rounded-3xl p-6 shadow-sm space-y-4 transition-all ${
              account.status === 'active' 
                ? 'border-slate-200 hover:border-slate-300' 
                : account.status === 'pending'
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-rose-200 bg-rose-50/10'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  account.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : account.status === 'pending'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{account.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                      account.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : account.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {account.statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{account.principalBroker} • {account.contactEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {account.status === 'active' && (
                  <button
                    onClick={() => handleSwitchToTenant(account.workspaceId)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {account.status === 'pending' && (
                  <button
                    onClick={() => alert(`Agreement reminder link dispatched to ${account.contactEmail}`)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Resend Agreement Link</span>
                  </button>
                )}

                {account.status === 'past_due' && (
                  <button
                    onClick={() => alert(`Billing payment notice sent to ${account.contactEmail}`)}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Send Billing Reminder</span>
                  </button>
                )}
              </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Agreement Status</span>
                <span className="font-bold text-slate-900 block">{account.agreementStatus}</span>
                <span className="text-[10px] text-slate-500 block">{account.signedDate}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Billing & Subscription</span>
                <span className={`font-bold block ${account.status === 'past_due' ? 'text-rose-700' : 'text-slate-900'}`}>{account.billingStatus}</span>
                <span className="text-[10px] text-slate-500 block">{account.billingDate}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Brokerage Size & Volume</span>
                <span className="font-bold text-slate-900 block">{account.agentsCount} Active Agents</span>
                <span className="text-[10px] text-slate-500 block">{account.monthlyVolume}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Office Locations</span>
                <span className="font-medium text-slate-900 block truncate">{account.offices.join(', ')}</span>
                <span className="text-[10px] text-slate-500 block font-mono">ID: {account.workspaceId}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PROVISIONING / CLONING MODAL */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 text-xs text-slate-800 text-left animate-scale-in font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Provision & Clone New Brokerage Workspace</h3>
                <p className="text-xs text-slate-500 mt-0.5">Setup a new tenant brokerage with pre-seeded SOPs, org chart, and routing rules.</p>
              </div>
              <button 
                onClick={() => setShowProvisionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cloneResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 font-mono text-xs text-emerald-900">
                <span className="font-bold text-emerald-800 block">✓ Tenant Workspace Provisioned Successfully!</span>
                <p className="text-[11px] font-sans text-slate-700">
                  Target Workspace ID: <strong className="font-mono text-slate-900">{cloneResult.targetWorkspaceId}</strong>
                </p>
                <button
                  onClick={() => handleSwitchToTenant(cloneResult.targetWorkspaceId)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold font-sans transition-all cursor-pointer text-xs"
                >
                  Switch to New Tenant Workspace →
                </button>
              </div>
            )}

            <form onSubmit={handleRunClone} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Source Template</label>
                  <select 
                    value={sourceWorkspaceId}
                    onChange={(e) => setSourceWorkspaceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-sans"
                  >
                    <option value="nest-realty-demo">Nest Realty Wilmington (Master Seed)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Target Brokerage Name *</label>
                  <input 
                    type="text" 
                    required
                    value={targetBrokerageName}
                    onChange={(e) => {
                      setTargetBrokerageName(e.target.value);
                      setTargetWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Target Workspace ID *</label>
                  <input 
                    type="text" 
                    required
                    value={targetWorkspaceId}
                    onChange={(e) => setTargetWorkspaceId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Offices (comma-separated)</label>
                  <input 
                    type="text" 
                    value={officesInput}
                    onChange={(e) => setOfficesInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Broker-in-Charge Name</label>
                  <input 
                    type="text" 
                    value={principalBrokerName}
                    onChange={(e) => setPrincipalBrokerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">BIC Email *</label>
                  <input 
                    type="email" 
                    required
                    value={principalBrokerEmail}
                    onChange={(e) => setPrincipalBrokerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  Provision Tenant Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
