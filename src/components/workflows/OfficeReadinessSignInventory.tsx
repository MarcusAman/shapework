import React, { useState } from 'react';
import { Play, CheckSquare, AlertTriangle, Plus, ClipboardList, Wrench, ShieldAlert, Search, User } from 'lucide-react';

interface OfficeReadinessSignInventoryProps {
  state?: any;
}

export default function OfficeReadinessSignInventory({ state = {} }: OfficeReadinessSignInventoryProps) {
  const {
    signInventory = [],
    officeSupplies = [],
    facilitiesIssues = [],
    profiles = [],
    fetchState
  } = state;

  const [activeTab, setActiveTab] = useState<'signage' | 'supplies' | 'facilities' | 'vendors'>('signage');
  const [newIssue, setNewIssue] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [vendorQuery, setVendorQuery] = useState('');

  const handleCheckout = async (signId: string, isCheckout: boolean) => {
    setIsProcessing(signId);
    try {
      const res = await fetch('/api/signage/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signId, isCheckout })
      });
      if (res.ok && fetchState) {
        await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleSupplyStatus = async (supplyId: string) => {
    setIsProcessing(supplyId);
    try {
      const res = await fetch('/api/supplies/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplyId })
      });
      if (res.ok && fetchState) {
        await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddFacilitiesIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue) return;
    setIsProcessing('new_issue');
    try {
      const res = await fetch('/api/facilities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: newIssue })
      });
      if (res.ok) {
        setNewIssue('');
        if (fetchState) await fetchState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEscalateFacilities = async (issueId: string) => {
    setIsProcessing(issueId);
    try {
      const res = await fetch(`/api/facilities/${issueId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        if (fetchState) await fetchState();
        alert('Facilities ticket escalated to owner review. Created escalation Work Item.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const vendorsList = [
    { name: "Apex Signs & Posts", usecase: "Sign installation & removal", owner: "Marketing Coordinator", email: "info@apexsigns.com", phone: "(512) 555-0182", notes: "Requires 48h lead time for installs.", lastUsed: "3 days ago" },
    { name: "Vance Title & Settlement", usecase: "Closing Escrows / Legal review", owner: "Operations Lead", email: "vance@vancetitle.local", phone: "(512) 555-0922", notes: "Sarah's primary contact for compliance checks.", lastUsed: "Yesterday" },
    { name: "Precision Photo & Media", usecase: "Listing photos & video flyovers", owner: "Marketing Coordinator", email: "media@precisionphoto.com", phone: "(512) 555-2281", notes: "Integrates with Rechat launcher templates.", lastUsed: "Last week" },
    { name: "CleanOffice Inc.", usecase: "Facilities maintenance & cleaning", owner: "Operations Lead", email: "support@cleanoffice.com", phone: "(512) 555-9383", notes: "Escalated facilities tickets are routed here.", lastUsed: "2 weeks ago" }
  ];

  const filteredVendors = vendorsList.filter(v => 
    v.name.toLowerCase().includes(vendorQuery.toLowerCase()) || 
    v.usecase.toLowerCase().includes(vendorQuery.toLowerCase()) ||
    v.notes.toLowerCase().includes(vendorQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-xs text-[var(--sw-muted)] select-text text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--sw-border)] pb-3 select-none gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--sw-text)] uppercase tracking-wider font-mono select-none">Office Readiness & Signage</h3>
          <p className="mt-1">Yard signs tracking, supplies checkoff checklists, and facilities logs.</p>
        </div>
        <div className="flex bg-[var(--sw-card)] rounded-xl p-0.5 border border-[var(--sw-border)]">
          {[
            { id: 'signage', label: 'Yard Signage' },
            { id: 'supplies', label: 'Office Supplies' },
            { id: 'facilities', label: 'Facilities Issues' },
            { id: 'vendors', label: 'Vendors DB' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-[var(--sw-surface)] text-[var(--sw-green-900)] shadow-sm' : 'text-[var(--sw-muted)] hover:text-[var(--sw-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'signage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center select-none bg-[var(--sw-card)] border border-[var(--sw-border)] p-3.5 rounded-xl text-[10px]">
            <span><strong>Signage Category Owner:</strong> Marketing Coordinator ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'marketing_coordinator' && x.status === 'active');
              return p ? p.name : 'Melissa Gagliardi';
            })()})</span>
            <span><strong>Backup Owner:</strong> Operations Lead ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'operations_lead' && x.status === 'active');
              return p ? p.name : 'Ann Gunn';
            })()})</span>
          </div>
          
          <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block select-none">Signage & Lockbox Inventory</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signInventory.map((sign: any) => {
              const remaining = sign.total - sign.checkedOut;
              const isLow = remaining <= sign.lowStockThreshold;
              return (
                <div key={sign.id} className="sw-card p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[var(--sw-text)] text-sm">{sign.type}</span>
                    {isLow && (
                      <span className="px-1.5 py-0.5 bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] font-bold text-[8px] rounded uppercase tracking-wider animate-pulse select-none">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--sw-muted)]">In Storage Cabinets</span>
                      <span className="font-mono font-bold text-[var(--sw-text)]">{remaining} / {sign.total} remaining</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--sw-muted)]">Checked Out on listings</span>
                      <span className="font-mono text-[var(--sw-muted)]">{sign.checkedOut} deployed</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 select-none border-t border-[var(--sw-border)]">
                    <button
                      onClick={() => handleCheckout(sign.id, false)}
                      disabled={isProcessing === sign.id}
                      className="sw-btn sw-btn-secondary py-1 text-[10px] font-bold flex-1"
                    >
                      Check-In
                    </button>
                    <button
                      onClick={() => handleCheckout(sign.id, true)}
                      disabled={isProcessing === sign.id}
                      className="sw-btn sw-btn-primary py-1 text-[10px] font-bold flex-1"
                    >
                      Check-Out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'supplies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center select-none bg-[var(--sw-card)] border border-[var(--sw-border)] p-3.5 rounded-xl text-[10px]">
            <span><strong>Supplies & Lockboxes Owner:</strong> Operations Lead ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'operations_lead' && x.status === 'active');
              return p ? p.name : 'Ann Gunn';
            })()})</span>
            <span><strong>Backup Owner:</strong> Transaction Coordinator ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'transaction_coordinator' && x.status === 'active');
              return p ? p.name : 'James Fort';
            })()})</span>
          </div>

          <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block select-none">Supply Checklists & Gifts</span>
          <div className="border border-[var(--sw-border)] rounded-2xl overflow-hidden shadow-[var(--sw-shadow-soft)] bg-[var(--sw-surface)]">
            <table className="w-full text-left">
              <thead className="bg-[var(--sw-card)] text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider border-b border-[var(--sw-border)] select-none">
                <tr>
                  <th className="p-3">Supply Item</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Verified</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sw-border)] text-xs select-text">
                {officeSupplies.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-[var(--sw-bg-soft)]/20">
                    <td className="p-3 font-semibold text-[var(--sw-text)]">{sup.item}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        sup.status === 'In Stock' ? 'bg-[var(--sw-mint-100)] text-[var(--sw-success)]' :
                        sup.status === 'Low Stock' ? 'bg-[var(--sw-risk)]/10 text-[var(--sw-warning)]' :
                        'bg-[var(--sw-risk)]/10 text-[var(--sw-risk)]'
                      }`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[var(--sw-muted)]">{sup.lastChecked}</td>
                    <td className="p-3 text-right select-none">
                      <button
                        onClick={() => handleToggleSupplyStatus(sup.id)}
                        disabled={isProcessing === sup.id}
                        className="sw-btn sw-btn-secondary py-1 text-[10px] font-bold"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center select-none bg-[var(--sw-card)] border border-[var(--sw-border)] p-3.5 rounded-xl text-[10px]">
            <span><strong>Facilities Owner:</strong> Operations Lead ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'operations_lead' && x.status === 'active');
              return p ? p.name : 'Ann Gunn';
            })()})</span>
            <span><strong>Backup Owner:</strong> Owner / Broker of Record ({(() => {
              const p = (profiles || []).find((x: any) => x.role === 'owner' && x.status === 'active');
              return p ? p.name : 'Marcus Aman';
            })()})</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Facilities Issues list */}
            <div className="lg:col-span-2 space-y-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block select-none">Maintenance Log</span>
              <div className="space-y-3">
                {facilitiesIssues.map((fac: any) => (
                  <div key={fac.id} className="sw-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-[var(--sw-shadow-soft)] transition-all">
                    <div className="space-y-1.5 flex-1 select-text">
                      <h5 className="font-bold text-[var(--sw-text)] text-xs">{fac.issue}</h5>
                      <div className="flex gap-2 items-center flex-wrap select-none">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          fac.status === 'resolved' ? 'bg-[var(--sw-mint-100)] text-[var(--sw-success)]' : 'bg-[var(--sw-risk)]/10 text-[var(--sw-warning)]'
                        }`}>
                          {fac.status}
                        </span>
                        {fac.isEscalated && (
                          <span className="px-2 py-0.5 bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] font-bold rounded-full text-[9px] flex items-center gap-1 select-none border border-[var(--sw-risk)]/15">
                            <ShieldAlert className="w-3.5 h-3.5 text-[var(--sw-risk)]" />
                            Escalated to Owner
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 select-none">
                      {!fac.isEscalated && fac.status !== 'resolved' && (
                        <button
                          onClick={() => handleEscalateFacilities(fac.id)}
                          disabled={isProcessing === fac.id}
                          className="sw-btn sw-btn-secondary py-1 text-[10px] font-bold"
                        >
                          Escalate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log Issue Form */}
            <div className="sw-card p-5 space-y-4 h-fit">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-green-700)] uppercase tracking-wider block flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-[var(--sw-green-700)]" />
                Log Facilities Issue
              </span>
              <form onSubmit={handleAddFacilitiesIssue} className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--sw-text)] block">Issue Description</label>
                  <input
                    type="text"
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="e.g. Conference room chair broken"
                    className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)] text-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing === 'new_issue'}
                  className="sw-btn sw-btn-primary w-full py-2 font-bold text-center text-xs"
                >
                  Log Ticket
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block select-none">Vendor Knowledge Base Lookup</span>
          
          <div className="flex items-center gap-2 relative max-w-md select-none">
            <Search className="w-4 h-4 text-[var(--sw-muted-light)] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor database by name, usecase, or notes..."
              value={vendorQuery}
              onChange={(e) => setVendorQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-full text-xs text-[var(--sw-text)] placeholder:text-[var(--sw-muted-light)] focus:outline-none focus:border-[var(--sw-green-700)] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-text">
            {filteredVendors.map((vendor, idx) => (
              <div key={idx} className="sw-card p-5 space-y-3 hover:border-[var(--sw-green-700)] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--sw-text)] leading-tight">{vendor.name}</h4>
                    <span className="text-[10px] text-[var(--sw-green-700)] block font-medium mt-0.5">{vendor.usecase}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-md text-[8px] text-[var(--sw-muted)] font-mono font-bold uppercase select-none">
                    Last Used: {vendor.lastUsed}
                  </span>
                </div>
                <p className="text-xs text-[var(--sw-muted)] leading-relaxed font-sans">{vendor.notes}</p>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--sw-border)] text-[10px] text-[var(--sw-muted)] select-none">
                  <div>
                    <span className="text-[8px] text-[var(--sw-muted-light)] uppercase font-bold block">Internal Owner</span>
                    <span className="font-medium text-[var(--sw-text)]">{vendor.owner}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[var(--sw-muted-light)] uppercase font-bold block">Contact Details</span>
                    <span className="block text-[var(--sw-text)] font-semibold">{vendor.phone}</span>
                    <span className="block text-[var(--sw-text)] font-mono">{vendor.email}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredVendors.length === 0 && (
              <div className="col-span-2 p-8 text-center text-[var(--sw-muted)] italic select-none bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl">
                No matching vendors found in the knowledge base.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
