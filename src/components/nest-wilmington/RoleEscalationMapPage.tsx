/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Role & Escalation Map Page — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState } from 'react';
import { 
  Users, Shield, ArrowRight, Settings, Plus, Check, X, AlertTriangle, 
  ChevronRight, Zap, Layers, Sliders, FileText, CheckCircle2, Clock, UserCheck, Trash2
} from 'lucide-react';
import type { RoleEscalationData, RoleMapCard, RoutingTableRow } from './adapters';
import type { OrgModel } from '../../services/orgChartService';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  Drawer,
  Modal,
  TextInput
} from '../ui';

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

const getAvatarForRole = (name: string, customUrl?: string) => {
  if (customUrl) return customUrl;
  const n = name.toLowerCase();
  if (n.includes('ryan')) return '/org-avatars/ryan.png';
  if (n.includes('melissa')) return '/org-avatars/melissa.png';
  if (n.includes('jessica')) return '/org-avatars/jessica.png';
  if (n.includes('ann')) return '/org-avatars/ann.png';
  if (n.includes('james')) return '/org-avatars/james.png';
  if (n.includes('eric')) return '/org-avatars/eric.png';
  return null;
};

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
      status: 'active',
      avatarUrl: '/org-avatars/ryan.png'
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
      status: 'active',
      avatarUrl: '/org-avatars/jessica.png'
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
      status: 'active',
      avatarUrl: '/org-avatars/melissa.png'
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
      status: 'active',
      avatarUrl: '/org-avatars/ann.png'
    }
  ]);

  const [routingRows, setRoutingRows] = useState<RoutingTableRow[]>(data?.routingTable || []);
  const [selectedRole, setSelectedRole] = useState<RoleMapCard | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOpenAddTeamMember = () => setShowAddRoleModal(true);
    window.addEventListener('open-add-team-member', handleOpenAddTeamMember);
    return () => window.removeEventListener('open-add-team-member', handleOpenAddTeamMember);
  }, []);

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6 text-left select-none pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#00635C] border border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>
              Role & Escalation Map
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">98.4% Handled Without Ryan</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Team Responsibility & Escalation Guardrails
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Configure ownership rules, backup handlers, and strict thresholds for escalating items to Ryan.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddRoleModal(true)}>
          Add Team Member
        </Button>
      </div>

      {/* KPI Tiles */}
      <MetricGroup columns={3}>
        <MetricTile
          label="Ryan Escalation SLA Guardrail"
          value=">24h or >$5k"
          caption="Overdue >24h OR Risk >$5,000"
          status="healthy"
          icon={<Shield className="w-4 h-4 text-emerald-600" />}
        />
        <MetricTile
          label="Team Offload Rate"
          value="98.4%"
          caption="Handled Without Ryan"
          status="healthy"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <MetricTile
          label="Active Role Profiles"
          value={roles.length.toString()}
          caption="Configured Team Roles"
          status="healthy"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
        />
      </MetricGroup>

      {/* Tab Selector */}
      <div className="flex items-center justify-between">
        <SegmentedControl
          value={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          options={[
            { id: 'nodes', label: `Role Cards (${roles.length})` },
            { id: 'matrix', label: `Escalation Matrix (${routingRows.length})` }
          ]}
        />
        <span className="text-xs text-[var(--sw-text-secondary)]">Click any role card to edit delegation rules</span>
      </div>

      {/* TAB 1: ROLE NODES GRID */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="p-5 space-y-4 cursor-pointer hover:border-[var(--brand-primary)] transition-all"
              onClick={() => openDrawerForRole(role)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getAvatarForRole(role.name, role.avatarUrl) ? (
                    <img 
                      src={getAvatarForRole(role.name, role.avatarUrl)!} 
                      alt={role.name} 
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-sm shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#00635C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {role.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[var(--sw-text-primary)]">{role.name}</h3>
                      <StatusBadge status="healthy" size="sm" />
                    </div>
                    <span className="text-xs text-[var(--sw-text-secondary)] font-medium block mt-0.5">{role.title}</span>
                  </div>
                </div>
                <IconButton icon={<Sliders className="w-4 h-4" />} size="sm" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider block">
                  Primary Responsibilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {role.handles.map((h, idx) => (
                    <Badge key={idx} variant="neutral">{h}</Badge>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--sw-canvas)] border border-amber-500/20 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Escalates to Ryan When:</span>
                </div>
                <p className="text-xs text-[var(--sw-text-primary)] font-medium pl-5 leading-relaxed">
                  {role.escalatesToRyanWhen}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--sw-border)] text-xs text-[var(--sw-text-secondary)]">
                <span>Tools: {role.tools.join(', ')}</span>
                <span className="text-[var(--brand-primary)] font-semibold flex items-center gap-1">
                  Configure <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer */}
      {selectedRole && (
        <Drawer
          isOpen={Boolean(selectedRole)}
          onClose={() => setSelectedRole(null)}
          title={`Edit Delegation — ${drawerName}`}
        >
          <div className="space-y-4">
            <TextInput label="Member Name" value={drawerName} onChange={(e) => setDrawerName(e.target.value)} />
            <TextInput label="Role Title" value={drawerTitle} onChange={(e) => setDrawerTitle(e.target.value)} />
            <TextInput label="Department" value={drawerDept} onChange={(e) => setDrawerDept(e.target.value)} />
            <TextInput label="Escalation Threshold" value={drawerEscalation} onChange={(e) => setDrawerEscalation(e.target.value)} />
            
            <div className="pt-4 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelectedRole(null)}>Cancel</Button>
              <Button variant="primary" icon={<Check className="w-3.5 h-3.5" />} onClick={handleSaveRoleDrawer}>Save Rules</Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Modal */}
      {showAddRoleModal && (
        <Modal
          isOpen={showAddRoleModal}
          onClose={() => setShowAddRoleModal(false)}
          title="Add Team Member & Assign Preset"
        >
          <div className="space-y-4">
            <p className="text-xs text-[var(--sw-text-secondary)]">Select a role template preset to onboard a team member.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ROLE_PRESETS.map((preset, idx) => (
                <Card key={idx} className="p-3 cursor-pointer hover:border-[var(--brand-primary)]" onClick={() => {
                  setRoles([...roles, {
                    id: `r_${Date.now()}`,
                    name: preset.title,
                    title: preset.title,
                    department: preset.department,
                    handles: preset.handles,
                    backupFor: preset.backupFor,
                    escalatesToRyanWhen: preset.escalatesToRyanWhen,
                    tools: preset.tools,
                    status: 'active'
                  }]);
                  setShowAddRoleModal(false);
                  triggerToast(`Added role ${preset.title}`);
                }}>
                  <h4 className="font-bold text-xs text-[var(--sw-text-primary)]">{preset.title}</h4>
                  <span className="text-[10px] text-[var(--sw-text-secondary)]">{preset.department}</span>
                </Card>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
