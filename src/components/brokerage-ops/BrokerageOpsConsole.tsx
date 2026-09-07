import React, { useState } from 'react';
import { 
  Shield, Settings, Users, Link2, BookOpen, Clipboard, RefreshCw, 
  Layers, CheckCircle2, AlertTriangle, AlertCircle, Clock, Plus, 
  HelpCircle, FileText, ArrowRight, UserCheck, Key, Eye, HelpCircle as QuestionMark
} from 'lucide-react';
import { useBrokerageOpsState } from '../../state/useBrokerageOpsState';

// Curated persona list for pilot simulation
const PERSONAS = [
  { name: 'Ryan', role: 'regional_leader', email: 'ryan@nestrealty.com', label: 'Ryan (Regional Lead)' },
  { name: 'Ann', role: 'operations_manager', email: 'ann@nestrealty.com', label: 'Ann (Operations Lead)' },
  { name: 'James', role: 'accounting_manager', email: 'james@nestrealty.com', label: 'James (Accounting)' },
  { name: 'Melissa', role: 'marketing_manager', email: 'melissa@nestrealty.com', label: 'Melissa (Marketing)' },
  { name: 'BIC Demo User', role: 'bic', email: 'bic@nestrealty.com', label: 'BIC (Compliance)' },
  { name: 'Shapework Triage', role: 'triage_operator', email: 'triage@nestrealty.com', label: 'Triage Desk' },
  { name: 'Agent User', role: 'agent', email: 'agent@nestrealty.com', label: 'Agent' }
];

export default function BrokerageOpsConsole() {
  const state = useBrokerageOpsState();
  const {
    requests,
    assets,
    sops,
    integrations,
    auditLogs,
    currentUserRole,
    currentUserEmail,
    currentUserName,
    activeTab,
    setActiveTab,
    isLoading,
    isSyncing,
    handleSwitchUserRole,
    submitRequest,
    updateRequest,
    checkoutAsset,
    checkinAsset,
    updateAssetStatus,
    toggleIntegration
  } = state;

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<any | null>(null);

  // Intake Form State
  const [intakeTitle, setIntakeTitle] = useState('');
  const [intakeDesc, setIntakeDesc] = useState('');
  const [intakeCategory, setIntakeCategory] = useState<any>('unknown_owner');
  const [intakeUrgency, setIntakeUrgency] = useState<any>('normal');
  const [intakeProperty, setIntakeProperty] = useState('');
  const [intakeDeadline, setIntakeDeadline] = useState('');
  const [intakeChannel, setIntakeChannel] = useState<any>('dashboard');

  // Checkout Form State
  const [checkoutAgent, setCheckoutAgent] = useState('');
  const [checkoutProperty, setCheckoutProperty] = useState('');
  const [checkoutReturnDate, setCheckoutReturnDate] = useState('');

  // Update Request Fields State
  const [newStatus, setNewStatus] = useState<any>('');
  const [newOwner, setNewOwner] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  const handleOpenRequest = (req: any) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setNewOwner(req.assignedOwner || '');
    setRequestNotes(req.notes || '');
    setResolutionText(req.resolutionSummary || '');
  };

  const handleUpdateRequestSubmit = async () => {
    if (!selectedRequest) return;
    
    // Determine target role for selected owner
    let assignedRole = '';
    if (newOwner === 'Ryan') assignedRole = 'regional_leader';
    else if (newOwner === 'Ann') assignedRole = 'operations_manager';
    else if (newOwner === 'James') assignedRole = 'accounting_manager';
    else if (newOwner === 'Melissa') assignedRole = 'marketing_manager';
    else if (newOwner === 'BIC Demo User') assignedRole = 'bic';
    else assignedRole = 'triage_operator';

    const success = await updateRequest(selectedRequest.id, {
      status: newStatus,
      assignedOwner: newOwner || undefined,
      assignedRole: newOwner ? assignedRole : undefined,
      notes: requestNotes || undefined,
      resolutionSummary: resolutionText || undefined,
      escalationLevel: newStatus === 'escalated' ? selectedRequest.escalationLevel + 1 : undefined
    });

    if (success) {
      alert('Request updated successfully.');
      setSelectedRequest(null);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitRequest({
      title: intakeTitle,
      description: intakeDesc,
      urgency: intakeUrgency,
      deadline: intakeDeadline || undefined,
      requesterName: currentUserName,
      requesterEmail: currentUserEmail,
      requesterRole: currentUserRole,
      preferredChannel: intakeChannel,
      linkedProperty: intakeProperty || undefined
    });

    if (success) {
      alert('Your request was captured, classified, and assigned successfully.');
      setShowIntakeModal(false);
      setIntakeTitle('');
      setIntakeDesc('');
      setIntakeProperty('');
      setIntakeDeadline('');
      setIntakeUrgency('normal');
      setIntakeCategory('unknown_owner');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckoutModal) return;
    const success = await checkoutAsset(showCheckoutModal.id, checkoutAgent, checkoutProperty, checkoutReturnDate || undefined);
    if (success) {
      alert('Asset checked out successfully.');
      setShowCheckoutModal(null);
      setCheckoutAgent('');
      setCheckoutProperty('');
      setCheckoutReturnDate('');
    }
  };

  // Metrics computation
  const openRequestsCount = requests.filter(r => r.status !== 'completed' && r.status !== 'closed').length;
  const overdueRequestsCount = requests.filter(r => r.status === 'escalated' || (r.slaDueAt && new Date(r.slaDueAt) < new Date() && r.status !== 'completed' && r.status !== 'closed')).length;
  const needsRyanCount = requests.filter(r => r.assignedOwner === 'Ryan' && r.status !== 'completed').length;
  const unknownOwnerCount = requests.filter(r => r.assignedOwner === 'Shapework Triage' && r.status !== 'completed').length;
  
  const complianceCount = requests.filter(r => r.assignedRole === 'bic' && r.status !== 'completed').length;
  const marketingCount = requests.filter(r => r.assignedRole === 'marketing_manager' && r.status !== 'completed').length;
  const accountingCount = requests.filter(r => r.assignedRole === 'accounting_manager' && r.status !== 'completed').length;
  const operationsCount = requests.filter(r => r.assignedRole === 'operations_manager' && r.status !== 'completed').length;

  const checkedOutAssetsCount = assets.filter(a => a.status === 'checked_out' || a.status === 'overdue').length;
  const overdueAssetsCount = assets.filter(a => a.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans select-none antialiased">
      
      {/* Simulation Persona Bar */}
      <div className="bg-stone-900 text-stone-300 py-2.5 px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono border-b border-stone-850 gap-2 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">PILOT WORKSPACE SANDBOX</span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-300">Active Tenant: <strong className="text-emerald-400 font-sans">Nest Realty (Wilmington)</strong></span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-stone-400">Simulate Persona:</span>
          <select 
            value={`${currentUserRole}:${currentUserEmail}:${currentUserName}`} 
            onChange={(e) => {
              const [role, email, name] = e.target.value.split(':');
              handleSwitchUserRole(role, email, name);
            }}
            className="bg-stone-800 text-stone-200 border border-stone-700 px-2.5 py-1 rounded text-xs focus:outline-none cursor-pointer hover:border-stone-600 transition-all font-sans font-bold"
          >
            {PERSONAS.map(p => (
              <option key={p.role} value={`${p.role}:${p.email}:${p.name}`}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-stone-900 border-r border-stone-850 flex flex-col text-stone-300 shrink-0 select-none shadow-xl">
          <div className="p-6 border-b border-stone-850 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm tracking-tighter">N</div>
            <div>
              <h2 className="font-serif font-bold text-sm text-white tracking-wide leading-tight">Nest Realty</h2>
              <span className="text-[9px] text-stone-500 uppercase tracking-widest font-mono font-bold block">Ops Blueprint Pilot</span>
            </div>
          </div>
          
          <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
            {[
              { id: 'Overview', label: 'Executive Cockpit', icon: Shield, permission: 'dashboard:view:executive' },
              { id: 'Queues', label: 'Role Queues', icon: Layers, permission: 'request:create' },
              { id: 'Assets', label: 'Physical Assets', icon: Key, permission: 'asset:view' },
              { id: 'Sops', label: 'SOP Knowledge Base', icon: BookOpen, permission: 'sop:view' },
              { id: 'Integrations', label: 'Integration Readiness', icon: Link2, permission: 'integration:view' },
              { id: 'Audit', label: 'Security Audit logs', icon: Clipboard, permission: 'audit:view' }
            ].map(item => {
              // Simple check for tab permissions
              if (item.id === 'Overview' && currentUserRole === 'agent') return null;
              if (item.id === 'Audit' && !['platform_admin', 'org_owner', 'brokerage_admin', 'regional_leader'].includes(currentUserRole)) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer tracking-wide transition-all ${
                    activeTab === item.id 
                      ? 'bg-emerald-900/50 text-emerald-400 border-l-4 border-emerald-500 font-bold'
                      : 'hover:bg-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
            
            <div className="pt-4 border-t border-stone-850 mt-4 px-2">
              <button
                onClick={() => {
                  window.location.pathname = '/app/workboard';
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-800 text-stone-500 hover:text-stone-300 rounded-xl text-xs font-semibold cursor-pointer tracking-wide transition-all"
              >
                <ArrowRight className="w-4 h-4 shrink-0 rotate-180" />
                Shapework Console
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-stone-850 space-y-3">
            <button
              onClick={() => setShowIntakeModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Ask Nora
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-stone-500 font-mono animate-pulse">
              Syncing cockpit parameters...
            </div>
          ) : (
            <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6">
              
              {/* Dynamic Tab Switcher content */}
              
              {/* 1. OVERVIEW COCKPIT */}
              {activeTab === 'Overview' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Nest Realty Wilmington Executive Cockpit</h3>
                    <p className="text-xs text-stone-500 mt-1">Brokerage-wide activity, target response times, and physical asset checkouts for Ryan.</p>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Open Requests', val: openRequestsCount, desc: 'Active issues', color: 'border-l-4 border-blue-500 bg-blue-50/20' },
                      { label: 'Overdue / Escalated', val: overdueRequestsCount, desc: 'Past target turnaround', color: 'border-l-4 border-rose-500 bg-rose-50/20 text-rose-700' },
                      { label: 'Needs Ryan Attention', val: needsRyanCount, desc: 'Assigned to Ryan', color: 'border-l-4 border-amber-500 bg-amber-50/20 text-amber-700' },
                      { label: 'Unclassified Triage', val: unknownOwnerCount, desc: 'Awaiting routing', color: 'border-l-4 border-stone-500 bg-stone-50 text-stone-700' },
                      { label: 'Asset Checkouts', val: checkedOutAssetsCount, desc: `${overdueAssetsCount} overdue signs/lockboxes`, color: 'border-l-4 border-emerald-500 bg-emerald-50/20' }
                    ].map((card, i) => (
                      <div key={i} className={`p-4 bg-white border border-stone-200 rounded-xl space-y-1 shadow-sm ${card.color}`}>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold block">{card.label}</span>
                        <span className="text-2xl font-serif font-bold block">{card.val}</span>
                        <span className="text-[9px] text-stone-400 block">{card.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Department Grid status */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-stone-700">Open Requests by Department</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Compliance (BIC)', count: complianceCount, color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                        { label: 'Accounting (James)', count: accountingCount, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                        { label: 'Marketing (Melissa)', count: marketingCount, color: 'bg-purple-50 border-purple-100 text-purple-700' },
                        { label: 'Operations (Ann)', count: operationsCount, color: 'bg-sky-50 border-sky-100 text-sky-700' }
                      ].map((dept, i) => (
                        <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${dept.color}`}>
                          <span className="text-xs font-semibold">{dept.label}</span>
                          <span className="text-lg font-serif font-bold">{dept.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overdue checkouts & critical events */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Today's Escalations & Overdue items
                      </h4>
                      <div className="space-y-2">
                        {requests.filter(r => r.status === 'escalated').map(r => (
                          <div 
                            key={r.id} 
                            onClick={() => handleOpenRequest(r)}
                            className="p-3 border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 rounded-xl flex justify-between items-center text-xs cursor-pointer transition-all"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-stone-900 block font-serif">{r.title}</span>
                              <span className="text-[10px] text-stone-500 block">Past Target Turnaround - Level {r.escalationLevel}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-rose-100 text-rose-800 font-mono">Urgent</span>
                          </div>
                        ))}
                        {requests.filter(r => r.status === 'escalated').length === 0 && (
                          <p className="text-xs text-stone-400 italic">No critical escalations logged today.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-amber-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Overdue Physical Asset Checkouts
                      </h4>
                      <div className="space-y-2">
                        {assets.filter(a => a.status === 'overdue').map(a => (
                          <div 
                            key={a.id} 
                            className="p-3 border border-amber-100 bg-amber-50/20 rounded-xl flex justify-between items-center text-xs"
                          >
                            <div>
                              <span className="font-bold text-stone-900 block font-serif">{a.label}</span>
                              <span className="text-[10px] text-stone-500 block">Checked out by {a.currentHolder} ({a.linkedProperty})</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-800 font-mono">Overdue</span>
                          </div>
                        ))}
                        {assets.filter(a => a.status === 'overdue').length === 0 && (
                          <p className="text-xs text-stone-400 italic">All active checkouts are within target turnaround timelines.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ROLE QUEUES */}
              {activeTab === 'Queues' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">Brokerage Department Role Queues</h3>
                      <p className="text-xs text-stone-500 mt-1">Filtered operations tasks based on simulated role permissions.</p>
                    </div>
                  </div>

                  {/* Active role queue info badge */}
                  <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-mono">
                      Viewing queue: <strong className="text-stone-900 uppercase font-sans font-bold">{currentUserRole.replace('_', ' ')}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase text-[9px] tracking-wide">
                      Scope: Tenant nest-realty
                    </span>
                  </div>

                  {/* Requests list */}
                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden select-none">
                    <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 uppercase font-mono">Open Request Queue ({requests.length})</span>
                    </div>

                    <div className="divide-y divide-stone-150">
                      {requests.map(req => (
                        <div 
                          key={req.id}
                          onClick={() => handleOpenRequest(req)}
                          className="p-4 hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 pr-6 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-sm text-stone-900 hover:text-emerald-800 transition-colors block">{req.title}</span>
                              {req.status === 'escalated' && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9px] font-mono font-bold uppercase">Escalated</span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{req.description}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-400 font-mono">
                              <span>Requester: {req.requesterName} ({req.requesterRole})</span>
                              <span>•</span>
                              <span>Category: {req.category}</span>
                              {req.linkedProperty && (
                                <>
                                  <span>•</span>
                                  <span>Property: {req.linkedProperty}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right font-mono text-[10px] space-y-0.5">
                              <span className="text-stone-500 block">Target Date: {new Date(req.slaDueAt).toLocaleDateString()}</span>
                              <span className="text-stone-400 block">Owner: {req.assignedOwner || 'Unassigned'}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                              req.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              req.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}

                      {requests.length === 0 && (
                        <div className="p-8 text-center text-xs text-stone-400 italic">
                          No requests in this department queue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PHYSICAL ASSETS */}
              {activeTab === 'Assets' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Nest Realty Physical Asset Tracking</h3>
                    <p className="text-xs text-stone-500 mt-1">Manage checkouts, checkins, replacement costs, and inventory location for yard signs, key sets, supra lockboxes, and open house kits.</p>
                  </div>

                  {/* Asset Ledger */}
                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden select-none">
                    <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 uppercase font-mono">Sign & Lockbox Ledger ({assets.length} items)</span>
                    </div>

                    <div className="divide-y divide-stone-150">
                      {assets.map(asset => (
                        <div key={asset.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-serif font-bold text-sm text-stone-900 block">{asset.label}</span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-stone-400 font-mono">
                              <span>Code: {asset.assetCode}</span>
                              <span>•</span>
                              <span>Type: {asset.assetType}</span>
                              <span>•</span>
                              <span>Cost: ${asset.replacementCost}</span>
                              {asset.currentHolder && (
                                <>
                                  <span>•</span>
                                  <span className="text-stone-600 font-bold">Holder: {asset.currentHolder}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                              asset.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                              asset.status === 'checked_out' ? 'bg-blue-50 text-blue-700 border-blue-250' :
                              asset.status === 'overdue' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                              'bg-rose-50 text-rose-700 border-rose-250'
                            }`}>
                              {asset.status}
                            </span>
                            
                            <div className="flex gap-2">
                              {asset.status === 'available' ? (
                                <button 
                                  onClick={() => setShowCheckoutModal(asset)}
                                  className="px-2.5 py-1 bg-stone-900 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-stone-850"
                                >
                                  Checkout
                                </button>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    const success = await checkinAsset(asset.id);
                                    if (success) alert('Asset checked in successfully.');
                                  }}
                                  className="px-2.5 py-1 bg-stone-100 border border-stone-300 text-stone-700 rounded text-[10px] font-bold cursor-pointer hover:bg-stone-50"
                                >
                                  Checkin
                                </button>
                              )}
                              {asset.status !== 'missing' && (
                                <button
                                  onClick={async () => {
                                    const success = await updateAssetStatus(asset.id, 'missing');
                                    if (success) alert('Asset status marked missing.');
                                  }}
                                  className="px-2.5 py-1 text-rose-700 border border-rose-200 rounded text-[10px] font-bold cursor-pointer bg-rose-50/20 hover:bg-rose-50/50"
                                >
                                  Mark Missing
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SOPS */}
              {activeTab === 'Sops' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Standard Operating Procedures (SOPs) Library</h3>
                    <p className="text-xs text-stone-500 mt-1">Cross-role operational templates and guidelines for compliance checkouts, accounting payouts, and marketing campaigns.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sops.map(sop => (
                      <div key={sop.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono block w-fit mb-1">{sop.department}</span>
                            <span className="font-serif font-bold text-base text-stone-900 block">{sop.title}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">Target Turnaround: {sop.sla}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-500 font-bold uppercase font-mono block">Trigger</span>
                          <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-150 leading-relaxed font-mono">{sop.trigger}</p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-stone-500 font-bold uppercase font-mono block">Action Steps</span>
                          <ol className="list-decimal list-inside text-xs text-stone-600 space-y-1 bg-stone-50/30 p-3 rounded-xl border border-stone-100">
                            {sop.steps.map((step, idx) => (
                              <li key={idx} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-t border-stone-100 pt-3">
                          <span>Owner: {sop.ownerRole.replace('_', ' ')}</span>
                          <span>Escalation: {sop.escalationPath}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. INTEGRATIONS */}
              {activeTab === 'Integrations' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Brokerage Core Integrations Readiness</h3>
                    <p className="text-xs text-stone-500 mt-1">Connection scopes, priority adapters, and connection stubs for QuickBooks, Rechat, Google Workspace, and Twilio.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {integrations.map(conn => (
                      <div key={conn.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-serif font-bold text-base text-stone-900 block">{conn.provider}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                            conn.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                            conn.status === 'stubbed' ? 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse' :
                            'bg-stone-100 text-stone-500 border-stone-250'
                          }`}>
                            {conn.status}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 leading-relaxed">{conn.description}</p>

                        <div className="space-y-2">
                          <span className="text-[10px] text-stone-400 font-bold uppercase font-mono block">Priority Scope:</span>
                          <div className="flex flex-wrap gap-1.5 select-none">
                            {conn.supportedActions?.map((act, i) => (
                              <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-mono">{act}</span>
                            )) || <span className="text-[10px] text-stone-400 italic">Pending adapter scopes setup.</span>}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-t border-stone-100 pt-3">
                          <span>Priority: {conn.priority.toUpperCase()}</span>
                          <button
                            onClick={async () => {
                              const targetStatus = conn.status === 'connected' ? 'stubbed' : (conn.status === 'stubbed' ? 'not_connected' : 'connected');
                              const success = await toggleIntegration(conn.id, targetStatus);
                              if (success) alert('Connection state toggled.');
                            }}
                            className="px-2 py-1 bg-stone-100 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 cursor-pointer font-sans font-bold"
                          >
                            Toggle State
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Active Camera View */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-stone-700">Tapo TCW-61 Active Camera Feed</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase text-[9px] tracking-wide">
                        Local Server http://localhost:5000
                      </span>
                    </div>
                    <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-900 aspect-video flex items-center justify-center relative group max-w-xl mx-auto shadow-inner min-h-[300px]">
                      <img 
                        src="http://localhost:5000/video_feed" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const sib = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                          if (sib) {
                            sib.classList.remove('hidden');
                            sib.classList.add('flex');
                          }
                        }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2 bg-stone-950/90">
                        <AlertTriangle className="w-8 h-8 text-stone-500" />
                        <span className="text-xs font-semibold">Tapo Local Stream Server Offline</span>
                        <p className="text-[10px] text-stone-500 leading-normal max-w-xs">
                          Run <code>python stream_server.py</code> under <code>scripts/tapo-ai-worker/</code> to stream the live camera feed directly into this dashboard card.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 6. AUDIT LOGS */}
              {activeTab === 'Audit' && (
                <div className="space-y-6 text-left animate-fade-in">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Operations Control Plane Audit Trail</h3>
                    <p className="text-xs text-stone-500 mt-1">Granular developer logs capturing requests creation, physical checkout events, and integration toggles.</p>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden select-none">
                    <div className="p-4 border-b border-stone-200 bg-stone-50/50">
                      <span className="text-xs font-bold text-stone-700 uppercase font-mono">Control Plane Events Ledger ({auditLogs.length} events)</span>
                    </div>

                    <div className="divide-y divide-stone-150">
                      {auditLogs.map(log => (
                        <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 block">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                              <span className="text-[10px] text-stone-400">(ID: {log.resourceId})</span>
                            </div>
                            <span className="text-stone-500 block">Actor: {log.actorName} ({log.actorUserId})</span>
                          </div>

                          <span className="text-stone-400 shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}

                      {auditLogs.length === 0 && (
                        <div className="p-8 text-center text-xs text-stone-400 italic">
                          No audit events logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* INTAKE FORM MODAL */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full text-left space-y-4 animate-scale-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Ask Nora</h3>
                <p className="text-xs text-stone-500 mt-0.5">Submit operations requests to the automatic classification engine.</p>
              </div>
              <button 
                onClick={() => setShowIntakeModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Request Title *</label>
                <input 
                  type="text" 
                  value={intakeTitle} 
                  onChange={(e) => setIntakeTitle(e.target.value)} 
                  required
                  placeholder="e.g., Earnest money receipt check needed for Arthur Pendragon"
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Description *</label>
                <textarea 
                  value={intakeDesc} 
                  onChange={(e) => setIntakeDesc(e.target.value)} 
                  required
                  rows={3}
                  placeholder="Provide transaction contexts, document links, or specific instructions."
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-600 font-bold block">Category Tag</label>
                  <select 
                    value={intakeCategory} 
                    onChange={(e) => setIntakeCategory(e.target.value)} 
                    className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                  >
                    <option value="unknown_owner">I don't know (Shapework Triage)</option>
                    <option value="compliance">Compliance Checks</option>
                    <option value="accounting_commissions">Accounting & Commission</option>
                    <option value="marketing_request">Listing Marketing</option>
                    <option value="office_supplies">Office Operations</option>
                    <option value="leadership_decision">Leadership Escalate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold block">Urgency / Priority</label>
                  <select 
                    value={intakeUrgency} 
                    onChange={(e) => setIntakeUrgency(e.target.value)} 
                    className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-600 font-bold block">Linked Property</label>
                  <input 
                    type="text" 
                    value={intakeProperty} 
                    onChange={(e) => setIntakeProperty(e.target.value)} 
                    placeholder="e.g. 102 Pine Street"
                    className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-600 font-bold block">Deadline Date</label>
                  <input 
                    type="date" 
                    value={intakeDeadline} 
                    onChange={(e) => setIntakeDeadline(e.target.value)} 
                    className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Preferred Response Channel</label>
                <select 
                  value={intakeChannel} 
                  onChange={(e) => setIntakeChannel(e.target.value)} 
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                >
                  <option value="dashboard">Dashboard Cockpit</option>
                  <option value="email">Email Notification</option>
                  <option value="sms">SMS text alerts</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950/10 cursor-pointer text-center"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-left space-y-4 animate-scale-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Checkout Asset</h3>
                <p className="text-xs text-stone-500 mt-0.5">{showCheckoutModal.label}</p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Assign to Agent *</label>
                <input 
                  type="text" 
                  value={checkoutAgent} 
                  onChange={(e) => setCheckoutAgent(e.target.value)} 
                  required
                  placeholder="e.g. Diane Ross"
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Linked Property *</label>
                <input 
                  type="text" 
                  value={checkoutProperty} 
                  onChange={(e) => setCheckoutProperty(e.target.value)} 
                  required
                  placeholder="e.g. 742 Evergreen Terrace"
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Expected Return Date</label>
                <input 
                  type="date" 
                  value={checkoutReturnDate} 
                  onChange={(e) => setCheckoutReturnDate(e.target.value)} 
                  className="w-full bg-stone-50 border border-stone-250 p-2.5 rounded-lg focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold shadow-lg cursor-pointer text-center"
              >
                Confirm Checkout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-stone-200 z-50 shadow-2xl flex flex-col text-left text-xs animate-slide-in">
          <div className="p-5 border-b border-stone-200 bg-stone-50 flex justify-between items-center shrink-0">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-mono block w-fit mb-0.5">DETAIL DRAWER</span>
              <h3 className="font-serif text-sm font-bold text-stone-900">{selectedRequest.title}</h3>
            </div>
            <button 
              onClick={() => setSelectedRequest(null)}
              className="text-stone-400 hover:text-stone-600 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase font-mono block">Description</span>
              <p className="text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-150 leading-relaxed">{selectedRequest.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              <div>
                <span className="text-stone-400 block font-bold uppercase">Target Resolution Date</span>
                <span className="text-stone-800">{new Date(selectedRequest.slaDueAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-bold uppercase">Requester</span>
                <span className="text-stone-800">{selectedRequest.requesterName} ({selectedRequest.requesterRole})</span>
              </div>
            </div>

            <div className="border-t border-stone-150 pt-4 space-y-3.5">
              <h4 className="text-[10px] font-bold text-stone-700 uppercase font-mono">Update Scope Parameters</h4>
              
              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Status State</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)} 
                  className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg focus:outline-none"
                >
                  <option value="new">new</option>
                  <option value="needs_info">needs_info</option>
                  <option value="assigned">assigned</option>
                  <option value="in_progress">in_progress</option>
                  <option value="waiting_on_requester">waiting_on_requester</option>
                  <option value="waiting_on_vendor">waiting_on_vendor</option>
                  <option value="escalated">escalated (Escalate to BIC)</option>
                  <option value="completed">completed</option>
                  <option value="closed">closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Assign Department Owner</label>
                <select 
                  value={newOwner} 
                  onChange={(e) => setNewOwner(e.target.value)} 
                  className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg focus:outline-none"
                >
                  <option value="">Choose owner...</option>
                  <option value="Ryan">Ryan (Leadership)</option>
                  <option value="Ann">Ann (Operations)</option>
                  <option value="James">James (Accounting)</option>
                  <option value="Melissa">Melissa (Marketing)</option>
                  <option value="BIC Demo User">BIC (Compliance)</option>
                  <option value="Shapework Triage">Triage Operator</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Internals Notes</label>
                <textarea 
                  value={requestNotes} 
                  onChange={(e) => setRequestNotes(e.target.value)} 
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-600 font-bold block">Resolution Summary</label>
                <textarea 
                  value={resolutionText} 
                  onChange={(e) => setResolutionText(e.target.value)} 
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 p-2 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-200 bg-stone-50 shrink-0">
            <button 
              onClick={handleUpdateRequestSubmit}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold shadow-md cursor-pointer text-center"
            >
              Save Update Action
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
