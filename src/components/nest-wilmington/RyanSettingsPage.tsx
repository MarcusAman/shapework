/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Building2, 
  Shield, 
  Phone, 
  Plus, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Download, 
  ExternalLink, 
  Key, 
  Copy, 
  Check, 
  Sliders, 
  Zap, 
  FileText, 
  X,
  UserCheck,
  MapPin,
  Lock,
  Sparkles
} from 'lucide-react';
import { INITIAL_MERCURY_INVOICES } from '../../services/mercuryService';

interface RyanSettingsPageProps {
  state?: any;
}

export default function RyanSettingsPage({ state }: RyanSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'billing' | 'profile' | 'sla' | 'tools'>('team');

  // Team Invites State
  const [teamMembers, setTeamMembers] = useState([
    { id: 'usr_1', name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', role: 'Broker / Owner (BIC)', office: 'Wilmington & Carolina Beach', status: 'active', addedDate: 'Jan 15, 2026' },
    { id: 'usr_2', name: 'Melissa Gagliardi', email: 'melissa@nestrealty.com', role: 'Marketing Manager', office: 'Wilmington', status: 'active', addedDate: 'Feb 01, 2026' },
    { id: 'usr_3', name: 'Ann Gunn', email: 'ann@nestrealty.com', role: 'Operations Lead', office: 'Wilmington', status: 'active', addedDate: 'Feb 10, 2026' },
    { id: 'usr_4', name: 'Jessica Vance', email: 'jessica@nestrealty.com', role: 'Virtual Assistant', office: 'Remote', status: 'active', addedDate: 'Mar 05, 2026' },
    { id: 'usr_5', name: 'Eric Knight', email: 'eric@nestrealty.com', role: 'Broker-in-Charge', office: 'Carolina Beach', status: 'pending', addedDate: 'Just Now' },
  ]);

  // Invite Modal Form
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Operations Lead');
  const [inviteOffice, setInviteOffice] = useState('Wilmington');

  // Brokerage Profile Form
  const [brokerageName, setBrokerageName] = useState('Nest Realty Wilmington');
  const [primaryPhone, setPrimaryPhone] = useState('+1 (910) 507-2047');
  const [marketingHotline, setMarketingHotline] = useState('(910) 555-MKTG');
  const [supportEmail, setSupportEmail] = useState('AskNestOps@nestrealty.com');
  const [mayfaireAddress, setMayfaireAddress] = useState('1055 Military Cutoff Rd, Wilmington, NC 28405');

  // SLA Thresholds Form
  const [slaResponseHours, setSlaResponseHours] = useState('12');
  const [escalateRiskAmount, setEscalateRiskAmount] = useState('5000');
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember = {
      id: `usr_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      office: inviteOffice,
      status: 'pending',
      addedDate: 'Just Now'
    };

    setTeamMembers([newMember, ...teamMembers]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    showToast(`✉️ Invitation sent to ${inviteEmail}! They will receive dashboard login instructions.`);
  };

  return (
    <div className="space-y-6 text-left font-sans text-xs text-[#F6F7F1] animate-fade-in relative min-h-screen pb-12 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#00635C] border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-mono font-bold flex items-center gap-3 animate-bounce max-w-md">
          <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-auto text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#01362D]/60 border border-white/10 rounded-2xl p-1.5 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#00635C] text-white shadow-md border border-emerald-500/30'
                : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Team Access & Invites ({teamMembers.length})
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-[#00635C] text-white shadow-md border border-emerald-500/30'
                : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Billing & Statements
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#00635C] text-white shadow-md border border-emerald-500/30'
                : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Brokerage Profile
          </button>

          <button
            onClick={() => setActiveTab('sla')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'sla'
                ? 'bg-[#00635C] text-white shadow-md border border-emerald-500/30'
                : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            SLA & Escalation Rules
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-[#00635C] text-white shadow-md border border-emerald-500/30'
                : 'text-[#D0D6BB]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Connected Tools
          </button>
        </div>

        {activeTab === 'team' && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md border border-emerald-500/40 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Team Member</span>
          </button>
        )}
      </div>

      {/* TAB 1: TEAM ACCESS & INVITES */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                  Brokerage Dashboard User Access
                </h3>
                <p className="text-xs text-[#D0D6BB] mt-0.5 font-sans">
                  Manage staff and leadership access to Ryan's Nest Brokerage OS Dashboard.
                </p>
              </div>
              <span className="px-3 py-1 bg-[#00635C]/40 border border-emerald-500/30 text-emerald-300 rounded-full font-mono text-[10px] font-bold">
                {teamMembers.filter(m => m.status === 'active').length} Active Users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono uppercase font-bold text-[#D0D6BB]/70">
                    <th className="py-2.5 px-3">Team Member</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-3">Office Scope</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Added Date</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-sans">
                  {teamMembers.map(m => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[11px] text-[#D0D6BB]/70 font-mono">{m.email}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-300 text-[11px]">
                        {m.role}
                      </td>
                      <td className="py-3 px-3 text-[#D0D6BB]">
                        {m.office}
                      </td>
                      <td className="py-3 px-3">
                        {m.status === 'active' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[9px] font-bold uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono text-[9px] font-bold uppercase">
                            Pending Invite
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-[#D0D6BB]/70 font-mono">
                        {m.addedDate}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => showToast(`Resent invitation email to ${m.email}`)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border border-white/10"
                        >
                          Resend Invite
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLING & STATEMENTS */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">Current Plan</span>
              <span className="text-xl font-serif font-black text-white block">Shapework OS Enterprise SLA</span>
              <span className="text-xs text-emerald-400 font-mono font-bold block">TBD</span>
            </div>

            <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">Connected Payment Method</span>
              <span className="text-xl font-serif font-black text-white block">Direct ACH Transfer</span>
              <span className="text-xs text-[#D0D6BB] font-mono block">Primary Checking (TBD)</span>
            </div>

            <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">Next Billing Date</span>
              <span className="text-xl font-serif font-black text-white block">TBD</span>
              <span className="text-xs text-emerald-400 font-mono font-bold block">Auto-Debit (TBD)</span>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                  Billing Receipts & Statements
                </h3>
                <p className="text-xs text-[#D0D6BB] mt-0.5">
                  View paid statements and download official PDF receipts for Nest Realty Wilmington.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {INITIAL_MERCURY_INVOICES.filter(i => i.clientWorkspaceId === 'nest-realty-demo').map(inv => (
                <div key={inv.id} className="bg-black/30 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{inv.invoiceNumber}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[9px] font-bold uppercase">
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#D0D6BB]">{inv.items[0]?.description}</p>
                    <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">Paid on {inv.issueDate} via ACH</span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="text-lg font-serif font-black text-white font-mono">TBD</span>
                    <button
                      onClick={() => showToast(`Downloading receipt ${inv.invoiceNumber}.pdf...`)}
                      className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROKERAGE PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">Brokerage Profile & Offices</h3>
            <p className="text-xs text-[#D0D6BB] mt-0.5">
              Update office locations, marketing hotline routing numbers, and primary contact info.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Brokerage Name
              </label>
              <input
                type="text"
                value={brokerageName}
                onChange={e => setBrokerageName(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={primaryPhone}
                onChange={e => setPrimaryPhone(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Marketing Hotline Phone
              </label>
              <input
                type="text"
                value={marketingHotline}
                onChange={e => setMarketingHotline(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Support & Operations Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('✅ Brokerage profile details saved!')}
            className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Save Brokerage Profile
          </button>
        </div>
      )}

      {/* TAB 4: SLA & ESCALATION RULES */}
      {activeTab === 'sla' && (
        <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">Ryan SLA & Escalation Thresholds</h3>
            <p className="text-xs text-[#D0D6BB] mt-0.5">
              Configure auto-escalation trigger conditions when staff requests remain unacknowledged or exceed risk limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Max SLA Response Window (Hours)
              </label>
              <input
                type="number"
                value={slaResponseHours}
                onChange={e => setSlaResponseHours(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-[#D0D6BB]/70 mt-1 block">Unacknowledged requests exceeding {slaResponseHours}h auto-escalate to Ryan Shield.</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                Financial Risk Limit ($)
              </label>
              <input
                type="number"
                value={escalateRiskAmount}
                onChange={e => setEscalateRiskAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-[#D0D6BB]/70 mt-1 block">Items exceeding ${parseFloat(escalateRiskAmount).toLocaleString()} require Ryan's direct signoff.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('✅ SLA Guardrail Thresholds Updated!')}
            className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Save SLA Guardrails
          </button>
        </div>
      )}

      {/* TAB 5: CONNECTED TOOLS */}
      {activeTab === 'tools' && (
        <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">Connected Brokerage Tools</h3>
            <p className="text-xs text-[#D0D6BB] mt-0.5">
              Live status of external software integrations connected to Shapework OS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'MLS (FlexMLS)', category: 'Listing Data', status: 'Connected (Active Sync)' },
              { name: 'Dotloop', category: 'Compliance & Contracts', status: 'Connected (Active Sync)' },
              { name: 'Rechat', category: 'CRM & Contacts', status: 'Connected (Active Sync)' },
              { name: 'Canva Pro', category: 'Marketing Design', status: 'Connected (1-Click Export)' },
              { name: 'QuickBooks', category: 'Accounting & Payroll', status: 'Connected (Active Sync)' },
              { name: 'Google Drive', category: 'Document Storage', status: 'Connected (Auto-Upload)' },
            ].map((tool, idx) => (
              <div key={idx} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{tool.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <span className="text-[10px] text-[#D0D6BB] font-mono block">{tool.category}</span>
                <span className="text-[11px] text-emerald-300 font-mono font-bold block">{tool.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVITE TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#01362D] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">Invite Team Member</h3>
                <p className="text-xs text-[#D0D6BB]">Send login invitation to Ryan's Brokerage OS Dashboard.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eric Knight"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. eric@nestrealty.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                    Role Preset
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Broker-in-Charge">Broker-in-Charge</option>
                    <option value="Operations Lead">Operations Lead</option>
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Virtual Assistant">Virtual Assistant</option>
                    <option value="REALTOR® / Agent">REALTOR® / Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-[#D0D6BB] mb-1">
                    Office Scope
                  </label>
                  <select
                    value={inviteOffice}
                    onChange={e => setInviteOffice(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Wilmington">Wilmington</option>
                    <option value="Carolina Beach">Carolina Beach</option>
                    <option value="Wilmington & Carolina Beach">All Offices</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#D0D6BB] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
