/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ryan Settings Page — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
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
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  DataTable,
  Modal,
  TextInput
} from '../ui';

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
  const [inviteRole, setInviteRole] = useState('Broker-in-Charge');
  const [inviteOffice, setInviteOffice] = useState('Wilmington');

  // SLA State
  const [slaHours, setSlaHours] = useState(24);
  const [escalationThreshold, setEscalationThreshold] = useState(5000);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;

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
    showToast(`Invitation sent to ${inviteEmail}! They will receive dashboard login instructions.`);
  };

  return (
    <div className="space-y-6 text-left select-none pb-12">
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>
              Workspace Settings
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">Nest Realty Wilmington</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Brokerage Workspace Settings
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Manage brokerage team access, Mercury billing receipts, SLA guardrails, and connected tools.
          </p>
        </div>

        {activeTab === 'team' && (
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowInviteModal(true)}>
            Add Team Member
          </Button>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <SegmentedControl
        value={activeTab}
        onChange={(v) => setActiveTab(v as any)}
        options={[
          { id: 'team', label: `Team Access (${teamMembers.length})` },
          { id: 'billing', label: 'Billing & Statements' },
          { id: 'profile', label: 'Brokerage Profile' },
          { id: 'sla', label: 'SLA & Escalation Rules' },
          { id: 'tools', label: 'Connected Tools' }
        ]}
      />

      {/* TAB 1: TEAM ACCESS & INVITES */}
      {activeTab === 'team' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-3">
            <div>
              <h3 className="font-bold text-base text-[var(--sw-text-primary)]">
                Brokerage Dashboard User Access
              </h3>
              <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5">
                Manage staff and leadership access to Ryan's Nest Brokerage OS Dashboard.
              </p>
            </div>
            <StatusBadge status="healthy" size="sm" />
          </div>

          <DataTable
            data={teamMembers}
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'member',
                header: 'Team Member',
                accessor: (item: any) => (
                  <div>
                    <div className="font-bold text-sm text-[var(--sw-text-primary)]">{item.name}</div>
                    <div className="text-xs text-[var(--sw-text-secondary)]">{item.email}</div>
                  </div>
                )
              },
              {
                key: 'role',
                header: 'Assigned Role',
                accessor: (item: any) => <span className="font-bold text-xs text-[var(--brand-primary)]">{item.role}</span>
              },
              {
                key: 'office',
                header: 'Office Scope',
                accessor: (item: any) => <span className="text-xs text-[var(--sw-text-secondary)]">{item.office}</span>
              },
              {
                key: 'status',
                header: 'Status',
                accessor: (item: any) => <StatusBadge status={item.status === 'active' ? 'healthy' : 'pending'} size="sm" />
              },
              {
                key: 'actions',
                header: 'Actions',
                accessor: (item: any) => (
                  <Button variant="secondary" size="sm" onClick={() => showToast(`Resent invite email to ${item.email}`)}>
                    Resend Invite
                  </Button>
                )
              }
            ]}
          />
        </Card>
      )}

      {/* Modal */}
      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Team Member"
        >
          <form onSubmit={handleSendInvite} className="space-y-4">
            <TextInput label="Full Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
            <TextInput label="Email Address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Send Invite</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
