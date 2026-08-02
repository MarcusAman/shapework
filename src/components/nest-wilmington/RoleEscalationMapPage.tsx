import React, { useState } from 'react';
import { 
  Users, Shield, ArrowRight, Settings, Plus, Check, X, AlertTriangle, 
  ChevronRight, Zap, Layers, Sliders, FileText, CheckCircle2, Clock, UserCheck, Trash2
} from 'lucide-react';
import type { RoleEscalationData, RoleMapCard, RoutingTableRow } from './adapters';
import type { OrgModel } from '../../services/orgChartService';

interface RoleEscalationMapPageProps {
  data: RoleEscalationData;
  model: OrgModel;
}

const ROLE_PRESETS = [
  {
    title: 'Listing Specialist',
    department: 'Listings',
    handles: ['Pre-MLS Entry', 'Seller Disclosures', 'Yard Sign Dispatch', 'Lockbox Assignment'],
    backupFor: ['Transaction Coordinator'],
    escalatesToRyanWhen: 'Financial risk > $5,000 OR Listing Seller Dispute',
    tools: ['MLS', 'Rechat', 'Dotloop']
  },
  {
    title: 'Transaction Coordinator',
    department: 'Escrow & Closing',
    handles: ['Contract Audit', 'Earnest Money Verification', 'Closing Disclosure Review', 'Title Coordination'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Overdue > 24 hrs OR Compliance Document Exception',
    tools: ['Basecamp', 'Dotloop', 'QuickBooks']
  },
  {
    title: 'Marketing Lead',
    department: 'Marketing',
    handles: ['Just Listed Flyers', 'Social Media Campaign', 'Open House Print Kits', 'Digital Ads'],
    backupFor: ['Office Coordinator'],
    escalatesToRyanWhen: 'Budget overrun > $1,000 OR Brand Exception',
    tools: ['Canva', 'Slack', 'Drive']
  },
  {
    title: 'Field Operator',
    department: 'Physical Assets',
    handles: ['Sign Post Installation', 'Lockbox Code Inspection', 'Property Check-in', 'Asset Maintenance'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Asset missing / stolen OR Damaged property flag',
    tools: ['Tapo Relay', 'SMS', 'Google Maps']
  }
];

export default function RoleEscalationMapPage({ data, model }: RoleEscalationMapPageProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'matrix'>('nodes');
  const [roles, setRoles] = useState<RoleMapCard[]>(data?.roleMap || [
    {
      id: 'r1',
      name: 'Ryan Shield (Principal)',
      title: 'Managing Principal / Owner',
      department: 'Executive',
      handles: ['Brokerage Compliance', 'Financial Approvals', 'High-Risk Seller Disputes'],
      backupFor: ['Managing Broker'],
      escalatesToRyanWhen: 'Direct principal escalation OR Legal risk > $5,000',
      tools: ['QuickBooks', 'Ask Nest Ops', 'Basecamp'],
      status: 'active'
    },
    {
      id: 'r2',
      name: 'Taylor Morgan',
      title: 'Listing Specialist',
      department: 'Listings',
      handles: ['Pre-MLS Entry', 'Yard Sign Dispatch', 'Lockbox Setup', 'Seller Onboarding'],
      backupFor: ['Transaction Coordinator'],
      escalatesToRyanWhen: 'Overdue > 24 hrs OR Seller dispute',
      tools: ['MLS', 'Rechat', 'Dotloop'],
      status: 'active'
    },
    {
      id: 'r3',
      name: 'Melissa Vance',
      title: 'Transaction Coordinator',
      department: 'Closing & Escrow',
      handles: ['Escrow Verification', 'Earnest Money Audit', 'Closing File Review'],
      backupFor: ['Listing Specialist'],
      escalatesToRyanWhen: 'Overdue > 24 hrs OR Missing legal disclosure',
      tools: ['Dotloop', 'Basecamp', 'QuickBooks'],
      status: 'active'
    },
    {
      id: 'r4',
      name: 'Jordan Lee',
      title: 'Marketing & Field Lead',
      department: 'Marketing & Ops',
      handles: ['Property Signs', 'Listing Flyers', 'Social Media Assets', 'Open House Kits'],
      backupFor: ['Listing Specialist'],
      escalatesToRyanWhen: 'Vendor dispatch failure OR Budget exception',
      tools: ['Canva', 'Tapo Relay', 'Slack'],
      status: 'active'
    }
  ]);

  const [routingRows, setRoutingRows] = useState<RoutingTableRow[]>(data?.routingTable || []);
  const [selectedRole, setSelectedRole] = useState<RoleMapCard | null>(null);
  const [deletingRoleCard, setDeletingRoleCard] = useState<RoleMapCard | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOpenAddTeamMember = () => setShowAddRoleModal(true);
    window.addEventListener('open-add-team-member', handleOpenAddTeamMember);
    return () => window.removeEventListener('open-add-team-member', handleOpenAddTeamMember);
  }, []);

  // Form states inside slide-over drawer
  const [drawerName, setDrawerName] = useState('');
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerDept, setDrawerDept] = useState('');
  const [drawerEscalation, setDrawerEscalation] = useState('');
  const [drawerSlaHours, setDrawerSlaHours] = useState('24');
  const [drawerFinancialLimit, setDrawerFinancialLimit] = useState('5000');

  const openDrawerForRole = (role: RoleMapCard) => {
    setSelectedRole(role);
    setDrawerName(role.name);
    setDrawerTitle(role.title);
    setDrawerDept(role.department);
    setDrawerEscalation(role.escalatesToRyanWhen);
    setDrawerSlaHours('24');
    setDrawerFinancialLimit('5000');
  };

  const handleSaveRoleDrawer = () => {
    if (!selectedRole) return;
    const updated = roles.map(r => {
      if (r.id === selectedRole.id) {
        return {
          ...r,
          name: drawerName,
          title: drawerTitle,
          department: drawerDept,
          escalatesToRyanWhen: `${drawerEscalation} (SLA: ${drawerSlaHours}h | Limit: $${drawerFinancialLimit})`
        };
      }
      return r;
    });
    setRoles(updated);
    setSelectedRole(null);
    triggerToast(`Updated delegation & escalation rules for ${drawerName}`);
  };

  const handleApplyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    if (!selectedRole) return;
    setDrawerTitle(preset.title);
    setDrawerDept(preset.department);
    setDrawerEscalation(preset.escalatesToRyanWhen);
    triggerToast(`Applied preset: ${preset.title}`);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6 text-left select-none animate-fade-in relative pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#00635C] border border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMsg}
        </div>
      )}

      {/* SLA Guardrail Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="rounded-[24px] p-4 text-left shadow-lg space-y-1"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <span className="text-[10px] font-mono uppercase font-bold text-[#D0D6BB] block">Ryan Escalation SLA Guardrail</span>
          <p className="text-xs text-white font-serif font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" /> Overdue &gt;24h OR Risk &gt;$5,000
          </p>
        </div>

        <div 
          className="rounded-[24px] p-4 text-left shadow-lg space-y-1"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <span className="text-[10px] font-mono uppercase font-bold text-[#D0D6BB] block">Team Offload Rate</span>
          <p className="text-xs text-white font-serif font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 98.4% Handled Without Ryan
          </p>
        </div>

        <div 
          className="rounded-[24px] p-4 text-left shadow-lg space-y-1"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <span className="text-[10px] font-mono uppercase font-bold text-[#D0D6BB] block">Active Role Profiles</span>
          <p className="text-xs text-white font-serif font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" /> {roles.length} Configured Team Roles
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div 
        className="rounded-[28px] p-2 flex justify-between items-center shadow-xl"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'nodes'
                ? 'bg-[#00635C] text-white shadow-md border border-white/15'
                : 'text-[#D0D6BB] hover:text-white hover:bg-white/5'
            }`}
          >
            Role Cards & Hierarchy ({roles.length})
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#00635C] text-white shadow-md border border-white/15'
                : 'text-[#D0D6BB] hover:text-white hover:bg-white/5'
            }`}
          >
            Escalation Matrix ({routingRows.length})
          </button>
        </div>

        <span className="text-[10px] font-mono text-[#D0D6BB] uppercase pr-3 font-bold">
          Click any role to edit delegation rules
        </span>
      </div>

      {/* TAB 1: ROLE NODES GRID */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => openDrawerForRole(role)}
              className="rounded-[28px] p-6 space-y-4 text-left shadow-xl hover:shadow-2xl hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-serif font-black text-white group-hover:text-emerald-300 transition-colors">
                      {role.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      {role.department}
                    </span>
                  </div>
                  <span className="text-xs text-[#D0D6BB] font-mono font-bold block">{role.title}</span>
                </div>

                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-[#00635C] group-hover:border-emerald-400/40 transition-all">
                  <Sliders className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">
                  Primary Responsibilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {role.handles.map((h, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 text-xs text-white">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Escalation Trigger to Ryan */}
              <div className="bg-black/30 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Escalates to Ryan When:</span>
                </div>
                <p className="text-xs text-white font-medium pl-5 leading-relaxed">
                  {role.escalatesToRyanWhen}
                </p>
              </div>

              {/* Tools */}
              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[10px] font-mono text-[#D0D6BB]">
                <span>Tools: {role.tools.join(', ')}</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Configure Delegation <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ESCALATION MATRIX */}
      {activeTab === 'matrix' && (
        <div 
          className="rounded-[28px] overflow-hidden shadow-xl text-left"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="grid grid-cols-12 gap-2 px-6 py-4 border-b border-white/10 bg-black/40 text-xs font-mono uppercase tracking-wider text-[#D0D6BB] font-bold">
            <span className="col-span-3">Request Type</span>
            <span className="col-span-3">Primary Handler</span>
            <span className="col-span-2">Fallback</span>
            <span className="col-span-4">Escalates to Ryan When</span>
          </div>

          <div className="divide-y divide-white/5">
            {routingRows.map((row) => (
              <div 
                key={row.id}
                className="grid grid-cols-12 gap-2 px-6 py-4 items-center text-xs hover:bg-white/[0.04] transition-colors"
              >
                <div className="col-span-3 font-serif font-bold text-white">
                  {row.requestType}
                </div>
                <div className="col-span-3 text-emerald-300 font-mono font-bold">
                  {row.handler} <span className="text-[10px] text-[#D0D6BB] block font-normal">{row.handlerTitle}</span>
                </div>
                <div className="col-span-2 text-[#D0D6BB]">
                  {row.backup}
                </div>
                <div className="col-span-4 text-amber-300 font-medium">
                  {row.whenRyanInvolved}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER FOR EDITING ROLE */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md h-full p-6 text-left space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between"
            style={{
              background: '#012E27',
              borderLeft: '1px solid rgba(246, 247, 241, 0.2)'
            }}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-serif font-black text-lg text-white uppercase tracking-wider">
                    Edit Delegation Rules
                  </h3>
                  <span className="text-xs text-[#D0D6BB] font-mono">{selectedRole.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-[#D0D6BB] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Onboarding Presets Quick Select */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">
                  Apply Role Preset Template
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 bg-black/30 border border-white/10 hover:border-emerald-500/40 rounded-xl text-left hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <span className="text-xs font-serif font-bold text-white block">{preset.title}</span>
                      <span className="text-[9px] text-[#D0D6BB] block">{preset.department}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono font-bold text-[#D0D6BB] uppercase block mb-1">
                    Team Member / Assignee Name
                  </label>
                  <input
                    type="text"
                    value={drawerName}
                    onChange={(e) => setDrawerName(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-[#D0D6BB] uppercase block mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={drawerTitle}
                    onChange={(e) => setDrawerTitle(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-[#D0D6BB] uppercase block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={drawerDept}
                    onChange={(e) => setDrawerDept(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Escalation Rules & SLA Thresholds */}
                <div className="bg-black/30 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider block">
                    Escalation Guardrail Rules
                  </span>

                  <div>
                    <label className="text-[10px] font-mono text-[#D0D6BB] uppercase block mb-1">
                      Escalation Trigger Condition
                    </label>
                    <input
                      type="text"
                      value={drawerEscalation}
                      onChange={(e) => setDrawerEscalation(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#D0D6BB] uppercase block mb-1">
                        SLA Response Threshold
                      </label>
                      <select
                        value={drawerSlaHours}
                        onChange={(e) => setDrawerSlaHours(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="12">12 Hours</option>
                        <option value="24">24 Hours (Default)</option>
                        <option value="48">48 Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#D0D6BB] uppercase block mb-1">
                        Financial Threshold ($)
                      </label>
                      <select
                        value={drawerFinancialLimit}
                        onChange={(e) => setDrawerFinancialLimit(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="1000">&gt; $1,000</option>
                        <option value="5000">&gt; $5,000 (Default)</option>
                        <option value="10000">&gt; $10,000</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setSelectedRole(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-mono font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoleDrawer}
                className="flex-1 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer uppercase flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROLE ONBOARDING MODAL */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
          <div 
            className="w-full max-w-lg rounded-[28px] p-6 text-left space-y-5 shadow-2xl"
            style={{
              background: '#012E27',
              border: '1px solid rgba(246, 247, 241, 0.2)'
            }}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-black text-lg text-white uppercase tracking-wider">
                Add Team Member & Assign Preset
              </h3>
              <button 
                onClick={() => setShowAddRoleModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#D0D6BB] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#D0D6BB] uppercase block">
                Select Role Template Preset
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newRole: RoleMapCard = {
                        id: `r-${Date.now()}`,
                        name: `New ${preset.title}`,
                        title: preset.title,
                        department: preset.department,
                        handles: preset.handles,
                        backupFor: preset.backupFor,
                        escalatesToRyanWhen: preset.escalatesToRyanWhen,
                        tools: preset.tools,
                        status: 'active'
                      };
                      setRoles([...roles, newRole]);
                      setShowAddRoleModal(false);
                      triggerToast(`Added ${preset.title} role from preset`);
                    }}
                    className="p-3 bg-black/30 border border-white/15 hover:border-emerald-500/40 rounded-2xl text-left hover:bg-white/5 transition-all cursor-pointer space-y-1"
                  >
                    <span className="text-sm font-serif font-bold text-white block">{preset.title}</span>
                    <span className="text-[10px] text-[#D0D6BB] block font-mono">{preset.department}</span>
                    <span className="text-[9px] text-emerald-300 block">Auto-maps SOPs & SLA chain →</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="px-4 py-2 bg-white/10 text-white font-mono font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
