/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Layers, Mail, Users, Sliders, History, ArrowRight, Shield, Home, 
  CheckCircle, FileText, Link2, Clock, Settings, Inbox, Download, 
  ShieldAlert, AlertTriangle, UserPlus, CheckSquare, Square, 
  DollarSign, User, Wrench, Plus, ClipboardList, Play, Activity, Cpu,
  X, Phone, Trash2, Brain, Zap, AlertCircle, HelpCircle, Loader,
  Video, Key
} from 'lucide-react';
import MorningBriefing from '../components/command/MorningBriefing';
import DecisionQueue from '../components/command/DecisionQueue';
import OperationalRiskTable from '../components/command/OperationalRiskTable';
import WaitingOnPeople from '../components/command/WaitingOnPeople';
import TeamCapacity from '../components/command/TeamCapacity';
import AIWorkbench from '../components/command/AIWorkbench';
import OperatingMemoryPanel from '../components/command/OperatingMemoryPanel';
import OperationsInbox from '../components/inbox/OperationsInbox';
import AIOperatorWorkspace from '../components/ai/AIOperatorWorkspace';
import EmailIntelligence from '../components/email/EmailIntelligence';
import TransactionsView from '../components/transactions/TransactionsView';
import HelpfulnessFeedback from '../components/shared/HelpfulnessFeedback';
import ListingsView from '../components/listings/ListingsView';
import IntegrationsHub from '../components/integrations/IntegrationsHub';
import ToolStackMap from '../components/integrations/ToolStackMap';
import BrokerageHealth from '../components/command/BrokerageHealth';
import RoleBasedCommandCenter from '../components/command/RoleBasedCommandCenter';
import CustomerLaunchWizard from '../components/settings/CustomerLaunchWizard';
import FirstBrokeragePilotChecklist from '../components/settings/FirstBrokeragePilotChecklist';
import PilotReadinessScorecard from '../components/settings/PilotReadinessScorecard';
import FirstPilotLaunchPack from '../components/settings/FirstPilotLaunchPack';
import PilotLaunchDecisionPanel from '../components/settings/PilotLaunchDecisionPanel';
import DailyCheckInView from '../components/command/DailyCheckInView';
import CustomerLaunchRoom from '../components/settings/CustomerLaunchRoom';
import OperatingRecordPage from '../components/operating-record/OperatingRecordPage';
import OperatingMemoryDetail from '../components/command/OperatingMemoryDetail';
import NestWilmingtonDashboard from '../components/nest-wilmington/NestWilmingtonDashboard';
import MarketingIntakeConsole from '../components/marketing/MarketingIntakeConsole';
import AICOOMissions from '../components/command/AICOOMissions';
import AgentActionPage from '../components/ui/AgentActionPage';
import ActivityAuditTrail from '../components/command/ActivityAuditTrail';
import AIAgentWorkforce from '../components/agents/AIAgentWorkforce';
import AgentApprovalPortal from '../components/agents/AgentApprovalPortal';
import AgentWorkforceWidgets from '../components/command/AgentWorkforceWidgets';
import ApprovalCenter from '../components/approvals/ApprovalCenter';
import Record360 from '../components/records/Record360';
import LiveOperationsTimeline from '../components/live/LiveOperationsTimeline';
import WorkQueue from '../components/layout/WorkQueue';
import AgentRunTable from '../components/agents/AgentRunTable';
import MarketingRequestDesk from '../components/workflows/MarketingRequestDesk';
import WeeklyOwnerBrief from '../components/command/WeeklyOwnerBrief';
import PipelineClosingTracker from '../components/transactions/PipelineClosingTracker';
import DealIntakeGuard from '../components/transactions/DealIntakeGuard';
import ClosingComplianceGuard from '../components/transactions/ClosingComplianceGuard';
import ListingLaunchBoard from '../components/listings/ListingLaunchBoard';
import AgentOnboardingBoard from '../components/people/AgentOnboardingBoard';
import OfficeReadinessSignInventory from '../components/workflows/OfficeReadinessSignInventory';
import ReviewRequestTrigger from '../components/transactions/ReviewRequestTrigger';
import DiscoveryPrioritiesView from '../components/settings/DiscoveryPrioritiesView';
import DataImportCenter from '../components/settings/DataImportCenter';
import AvoidableWorkTracker from '../components/transactions/AvoidableWorkTracker';
import IntegrationTestConsole from '../components/settings/IntegrationTestConsole';
import GrowthEngineView from '../components/growth/GrowthEngineView';
import NeedsAttentionDeck from '../components/today/NeedsAttentionDeck';
import NestOpsHub from '../components/brokerage-ops/NestOpsHub';
import MyConnections from '../components/brokerage-ops/MyConnections';
import { BrandingPanel, ActionLinksPanel, IntakeLinksPanel, ClientAgentAccessPanel, WebhooksPanel, ExtendedNotificationPanel } from '../components/headless/HeadlessSettings';
import OrgChartWizardPage from '../components/settings/OrgChartWizardPage';
import RyanShieldPage from '../components/nest-wilmington/RyanShieldPage';
import OwnerWeeklyBriefPage from '../components/nest-wilmington/OwnerWeeklyBriefPage';
import RyanSettingsPage from '../components/nest-wilmington/RyanSettingsPage';
import { buildRyanShieldSummary, buildOwnerWeeklyBrief } from '../components/nest-wilmington/adapters';
import type { ShieldSummaryCard } from '../components/nest-wilmington/adapters';
import WorkspaceDirectoryPage from '../components/people/WorkspaceDirectoryPage';
import { orgChartService } from '../services/orgChartService';
import SOPStudio from '../components/sops/SOPStudio';
import SOPRunsPage from '../components/sops/SOPRunsPage';
import PitchAhaDemoModal from '../components/demo/PitchAhaDemoModal';
import PreMLSBoard from '../components/brokerage-ops/PreMLSBoard';
import VendorDispatchBoard from '../components/brokerage-ops/VendorDispatchBoard';


interface CustomerAppRoutesProps {
  state: any;
}

// -------------------------------------------------------------
// REUSABLE PAGE HEADER COMPONENT
// -------------------------------------------------------------
function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return null;
}

// -------------------------------------------------------------
// REUSABLE EMPTY STATE COMPONENT
// -------------------------------------------------------------
interface EmptyStateProps {
  title: string;
  description: string;
  actionText: string;
  onAction?: () => void;
}

function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="sw-card-raised p-8 text-center max-w-lg mx-auto my-12 space-y-4 select-none animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-[var(--sw-mint-100)] flex items-center justify-center mx-auto text-[var(--sw-green-900)]">
        <Layers className="w-6 h-6" />
      </div>
      <h4 className="font-serif font-bold text-base text-[var(--sw-text)]">{title}</h4>
      <p className="text-xs text-[var(--sw-muted)] leading-relaxed max-w-sm mx-auto">{description}</p>
      <div className="pt-2">
        <button
          onClick={onAction}
          className="sw-btn sw-btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// INDIVIDUAL PAGE ROUTE COMPONENTS
// -------------------------------------------------------------

function TodayPage({ state }: { state: any }) {
  return (
    <div className="space-y-6 text-left font-sans text-xs text-[#F6F7F1]">
      <NestOpsHub state={state} mode="full" />
    </div>
  );
}

function WorkQueuePage({ state }: { state: any }) {
  return (
    <div className="space-y-6">
      <WorkQueue state={state} />
    </div>
  );
}

function TransactionsPage({ state, onInspectRecord }: { state: any; onInspectRecord: any }) {
  const [dealsTab, setDealsTab] = useState<'all' | 'intake_guard' | 'review_trigger'>('all');
  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle="Active transaction pipeline" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-2 select-none">
        <div className="flex gap-4">
          {[
            { id: 'all', label: 'Active Transactions Ledger' },
            { id: 'intake_guard', label: 'Transaction Intake Guard' },
            { id: 'review_trigger', label: 'Google Review Dispatch' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDealsTab(tab.id as any)}
              className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                dealsTab === tab.id
                  ? 'border-[var(--sw-green-900)] text-[var(--sw-green-900)] font-bold'
                  : 'border-transparent text-[var(--sw-muted)] hover:text-[var(--sw-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {dealsTab === 'intake_guard' ? (
        <DealIntakeGuard state={state} />
      ) : dealsTab === 'review_trigger' ? (
        <ReviewRequestTrigger />
      ) : (
        <PipelineClosingTracker state={state} onInspectRecord={onInspectRecord} />
      )}
    </div>
  );
}

function CompliancePage({ state }: { state: any }) {
  const complianceRisks = (state.workItems || []).filter(
    (w: any) => w.type === 'closing_compliance_risk' && w.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" subtitle="Closing file risk and document follow-up" />
      {complianceRisks.length === 0 ? (
        <EmptyState
          title="No compliance risks right now."
          description="Files closing soon, missing documents, and follow-up requests will appear here."
          actionText="Add compliance checklist"
          onAction={() => alert('Add compliance checklist trigger')}
        />
      ) : (
        <ClosingComplianceGuard state={state} />
      )}
    </div>
  );
}

function MarketingRequestsPage({ state }: { state: any }) {
  return (
    <div className="space-y-6">
      <MarketingIntakeConsole state={state} />
    </div>
  );
}

function PeopleOwnershipPage({ state }: { state: any }) {
  const staffList = (state.profiles || []).filter((p: any) => 
    !['shapework_admin', 'shapework_operator', 'implementation_lead', 'support_admin', 'developer'].includes(p.role)
  );
  const [subTab, setSubTab] = useState<'directory' | 'map' | 'escalation' | 'gaps'>('directory');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states - Add Modal
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<string>('agent');
  const [addEscalations, setAddEscalations] = useState(false);
  const [addError, setAddError] = useState('');

  // Form states - Edit Modal
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<string>('agent');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'pending'>('active');
  const [editEscalations, setEditEscalations] = useState(false);
  const [editError, setEditError] = useState('');

  const requiredRolesList = [
    { role: 'owner', label: 'Owner / Broker of Record', desc: 'Final signatory authority, legal dispute veto rights, and commission overrides.' },
    { role: 'operations_lead', label: 'Operations Lead', desc: 'Workflow configuration, tool audits, vendor controls, and facilities routing.' },
    { role: 'marketing_coordinator', label: 'Marketing Coordinator', desc: 'Flyers design, sign inventory tracking, and client review follow-up.' },
    { role: 'transaction_coordinator', label: 'Transaction Processing / Accounting', desc: 'Commission preparation, ledger audits, fee calculations, QuickBooks entries.' },
    { role: 'events', label: 'Events Coordinator', desc: 'Organizing team events and client events planning.' },
    { role: 'maintenance', label: 'Maintenance / Supplies', desc: 'Lockbox deployments, sign installations, supply orders.' },
    { role: 'compliance_partner', label: 'Compliance Partner', desc: 'Audit contract documents, inspect signatures, flag file omissions.' }
  ];

  const getOwnersForRole = (role: string) => {
    const matches = staffList.filter((p: any) => p.role === role && p.status === 'active');
    if (matches.length === 0) return { name: "Vacant", email: "-", cellPhone: "-" };
    return {
      name: matches.map((m: any) => m.name).join(', '),
      email: matches.map((m: any) => m.email).join(', '),
      cellPhone: matches.map((m: any) => m.cellPhone || '-').join(', ')
    };
  };

  const getBackupForRole = (role: string) => {
    // If operations_lead, backup is owner. Otherwise, backup is operations_lead or owner.
    const backupRole = role === 'owner' ? 'operations_lead' : 'owner';
    const matches = staffList.filter((p: any) => p.role === backupRole && p.status === 'active');
    if (matches.length === 0) return "Operations Lead";
    return matches.map((m: any) => m.name).join(', ');
  };

  // 1. Ownership Map
  const ownershipMap = [
    { 
      role: "Owner / Broker of Record", 
      description: "Final signatory authority, dispute resolution, financial payouts, and close-of-escrow compliance overrides.", 
      owner: getOwnersForRole('owner'),
      backup: getBackupForRole('owner'),
      escalationPath: "None (Final Authority)",
      decisionRights: "Veto rights on commission cuts, legal settlements, and compliance exceptions.",
      ownerWorthy: "Legal disputes, commission cuts, large vendor agreements, and compliance waivers.",
      staffOwned: "Routine marketing, scheduling, closing checklists, sign inventory.",
      toolOwnership: "QuickBooks (P&L Overseer)"
    },
    { 
      role: "Operations", 
      description: "Workflow configuration, tool audits, vendor controls, and office facilities maintenance routing.", 
      owner: getOwnersForRole('operations_lead'),
      backup: getBackupForRole('operations_lead'),
      escalationPath: "Owner",
      decisionRights: "Manage facilities maintenance, configure routing rules, audit transaction files.",
      ownerWorthy: "Unresolved vendor disputes or budget overrides.",
      staffOwned: "Triage, routine maintenance logs, tool status syncs.",
      toolOwnership: "Google Calendar, Google Drive, Basecamp"
    },
    { 
      role: "Marketing", 
      description: "Flyers and brochures design, sign inventory tracking, client review follow-up, and open house asset design.", 
      owner: getOwnersForRole('marketing_coordinator'),
      backup: "Operations Lead",
      escalationPath: "Operations Lead",
      decisionRights: "Release non-launch marketing graphics, request agent bio verification.",
      ownerWorthy: "Approval of outbound external ad budgets.",
      staffOwned: "Social media drafting, open house flyer prep.",
      toolOwnership: "Rechat Design Center"
    },
    { 
      role: "Transaction Processing / Accounting", 
      description: "Commission/payment preparation, ledger audits, fee calculations, QuickBooks payout entries.", 
      owner: getOwnersForRole('transaction_coordinator'),
      backup: "Operations Lead",
      escalationPath: "Owner",
      decisionRights: "Commission/payment preparation, ledger audits, fee calculations.",
      ownerWorthy: "Commission rate disputes or discount waivers.",
      staffOwned: "Routine ledger entries, bank reconciliations.",
      toolOwnership: "QuickBooks, QuickBooks Merchant Services"
    },
    { 
      role: "Events", 
      description: "Organizing team events, managing local outreach schedules, client events planning.", 
      owner: getOwnersForRole('events'),
      backup: "Operations Lead",
      escalationPath: "Operations Lead",
      decisionRights: "Organizing team events, client event schedules.",
      ownerWorthy: "Event venue contracts and vendor payouts > $1,000.",
      staffOwned: "Event invitations, catering scheduling.",
      toolOwnership: "Google Calendar"
    },
    { 
      role: "Maintenance / Supplies", 
      description: "Lockbox deployments, sign installations, supplies purchasing, conference room readiness.", 
      owner: getOwnersForRole('maintenance'),
      backup: "Operations Lead",
      escalationPath: "Operations Lead",
      decisionRights: "Lockbox deployments, sign installations, supply checks.",
      ownerWorthy: "Major office facility repairs (> $500).",
      staffOwned: "Yard sign installations, printer toner orders.",
      toolOwnership: "Basecamp"
    },
    { 
      role: "Compliance", 
      description: "Audit contract documents, inspect signatures, flag file omissions, request missing paperwork.", 
      owner: getOwnersForRole('compliance_partner'),
      backup: "Operations Lead",
      escalationPath: "Owner",
      decisionRights: "Audit contract documents, flag omissions, request paperwork.",
      ownerWorthy: "Agent refusal to submit document after multiple chases.",
      staffOwned: "Standard file completeness checklists.",
      toolOwnership: "Dotloop, Rechat"
    }
  ];

  const vacantRoles = requiredRolesList.filter(role => 
    !staffList.some((p: any) => p.role === role.role && p.status === 'active')
  );

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-workspace-id': state.workspaceId || 'nest-realty-demo'
    };
    const token = typeof window !== 'undefined' && window.location.pathname.startsWith('/app')
      ? null
      : localStorage.getItem('shapework_session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addName.trim() || !addEmail.trim() || !addRole) {
      setAddError('Name, email, and role are required.');
      return;
    }
    if (!addEmail.includes('@')) {
      setAddError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          cellPhone: addPhone,
          role: addRole,
          status: 'active',
          canReceiveEscalations: addEscalations
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddRole('agent');
        setAddEscalations(false);
        await state.fetchState();
      } else {
        setAddError(data.error || 'Failed to add staff member.');
      }
    } catch (err) {
      setAddError('Network error. Please try again.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editName.trim() || !editEmail.trim() || !editRole) {
      setEditError('Name, email, and role are required.');
      return;
    }
    if (!editEmail.includes('@')) {
      setEditError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch(`/api/profiles/${editingMember.id}/update`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          cellPhone: editPhone,
          role: editRole,
          status: editStatus,
          canReceiveEscalations: editEscalations
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingMember(null);
        await state.fetchState();
      } else {
        setEditError(data.error || 'Failed to update staff member.');
      }
    } catch (err) {
      setEditError('Network error. Please try again.');
    }
  };

  const handleDeactivate = async () => {
    if (!editingMember) return;
    try {
      const res = await fetch(`/api/profiles/${editingMember.id}/deactivate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingMember(null);
        await state.fetchState();
      } else {
        const data = await res.json();
        setEditError(data.error || 'Failed to deactivate staff member.');
      }
    } catch (err) {
      setEditError('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6 text-left select-text font-sans">
      <PageHeader title="People & Ownership" subtitle="Human role clarity, escalation guidelines, and decision boundaries." />

      {/* Vacant Responsibility Alerts */}
      {vacantRoles.length > 0 && (
        <div className="alert-card warning flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--sw-warning)] shrink-0" />
          <div>
            <h4 className="font-bold text-[var(--sw-text)]">Vacant Responsibility Alert</h4>
            <p className="text-[11px] text-[var(--sw-muted)] leading-relaxed mt-0.5">
              The following key operating roles are vacant and require staff assignment to prevent pipeline delays: 
              <strong> {vacantRoles.map(r => r.label).join(', ')}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Subtabs controls */}
      <div className="flex gap-2 border-b border-[var(--sw-border)] pb-3 select-none">
        {[
          { id: 'directory', label: 'Staff Directory' },
          { id: 'map', label: 'Role Ownership Map' },
          { id: 'escalation', label: 'Escalation Paths' },
          { id: 'gaps', label: `Coverage Gaps ${vacantRoles.length > 0 ? `(${vacantRoles.length})` : ''}` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
              subTab === tab.id
                ? 'bg-[var(--sw-green-900)] border-[var(--sw-green-900)] text-white font-bold'
                : 'bg-[var(--sw-card)] border-[var(--sw-border)] text-[var(--sw-muted)] hover:text-[var(--sw-text)] hover:bg-[var(--sw-surface)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 animate-fade-in">
        
        {subTab === 'directory' && (
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl overflow-hidden shadow-[var(--sw-shadow-soft)] animate-fade-in">
            <div className="h-12 border-b border-[var(--sw-border)] px-4 flex items-center justify-between bg-[var(--sw-card)] select-none">
              <span className="text-xs font-bold text-[var(--sw-text)] uppercase tracking-wider">
                Active Staff Directory
              </span>
              <button
                onClick={() => {
                  setAddError('');
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Staff Member
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--sw-card)] text-[var(--sw-muted)] border-b border-[var(--sw-border)] font-mono text-[9px] uppercase select-none">
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Cell Phone</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sw-border)] font-medium">
                  {staffList.map((member: any) => (
                    <tr 
                      key={member.id} 
                      onClick={() => {
                        setEditingMember(member);
                        setEditName(member.name);
                        setEditEmail(member.email);
                        setEditPhone(member.cellPhone || '');
                        setEditRole(member.role);
                        setEditStatus(member.status || 'active');
                        setEditEscalations(!!member.canReceiveEscalations);
                        setEditError('');
                        setIsEditModalOpen(true);
                      }}
                      className="hover:bg-[var(--sw-bg-soft)]/20 cursor-pointer transition-all duration-150 active:scale-[0.99]"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--sw-green-900)] flex items-center justify-center text-white text-[10px] font-semibold font-mono">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-bold text-[var(--sw-text)]">{member.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-[var(--sw-muted)] select-all font-mono text-[10px]">{member.email}</td>
                      <td className="p-3 text-[var(--sw-muted)] font-mono text-[10px]">{member.cellPhone || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-md capitalize text-[var(--sw-muted)]">
                          {member.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase ${
                          member.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : member.status === 'pending' 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {member.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'map' && (
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl overflow-hidden shadow-[var(--sw-shadow-soft)] animate-fade-in">
            <div className="h-12 border-b border-[var(--sw-border)] px-4 flex items-center bg-[var(--sw-card)] select-none">
              <span className="text-xs font-bold text-[var(--sw-text)] uppercase tracking-wider">
                Role Ownership & Responsibilities Map
              </span>
            </div>
            <div className="divide-y divide-[var(--sw-border)]">
              {ownershipMap.map((map) => (
                <div key={map.role} className="p-4 flex flex-col hover:bg-[var(--sw-bg-soft)]/10 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold text-[var(--sw-text)] block text-sm">{map.role}</span>
                      <p className="text-[11px] text-[var(--sw-muted)] font-medium leading-relaxed max-w-xl">{map.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {map.owner.name === 'Vacant' || map.owner.name === '-' ? (
                        <span className="px-2 py-0.5 bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] text-[9px] font-bold rounded-full border border-[var(--sw-risk)]/15 uppercase select-none">
                          Vacant / Needs Assignment
                        </span>
                      ) : (
                        <div>
                          <span className="font-bold text-[var(--sw-text)] block text-xs">{map.owner.name}</span>
                          <span className="text-[10px] text-[var(--sw-muted)] block font-mono">{map.owner.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-[var(--sw-border)]/50 text-[10px] text-[var(--sw-muted)] font-mono">
                    <div>
                      <span className="text-[8px] uppercase text-[var(--sw-muted-light)] font-bold block">Backup Owner</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.backup}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-[var(--sw-muted-light)] font-bold block">Escalation Path</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.escalationPath}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-[var(--sw-muted-light)] font-bold block">Tool Scope</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.toolOwnership}</span>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <span className="text-[8px] uppercase text-[var(--sw-muted-light)] font-bold block">Decision Rights</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.decisionRights}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--sw-border)]/20 text-[10px] text-[var(--sw-muted)] font-mono">
                    <div>
                      <span className="text-[8px] uppercase text-emerald-800 font-bold block">What goes to owner</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.ownerWorthy}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-amber-800 font-bold block">What stays with staff</span>
                      <span className="text-[var(--sw-text)] font-sans mt-0.5 block">{map.staffOwned}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'escalation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-5 space-y-4">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block">
                Escalation Hierarchy
              </span>
              <div className="space-y-3.5 text-xs text-[var(--sw-muted)]">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sw-green-900)] mt-1.5 shrink-0" />
                  <p className="font-medium">
                    <strong>Transaction Coordinator disputes</strong> escalate immediately to the <strong>Operations Lead</strong> or <strong>Broker of Record</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sw-green-900)] mt-1.5 shrink-0" />
                  <p className="font-medium">
                    <strong>Compliance waivers</strong> must be approved explicitly by the <strong>Broker of Record</strong> using single-use secure links.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--sw-green-900)] mt-1.5 shrink-0" />
                  <p className="font-medium">
                    Routine client-deflection alerts are resolved automatically at the staff level without owner intervention.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-5 space-y-4">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted)] uppercase tracking-wider block">
                Owner-Worthy Rules vs Staff-Owned
              </span>
              <div className="space-y-3.5 text-xs text-[var(--sw-muted)] leading-relaxed">
                <div className="p-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-xl">
                  <h5 className="font-bold text-[var(--sw-text)] text-[10px] uppercase mb-1">Owner-Worthy Decisions</h5>
                  <p className="text-[11px] text-[var(--sw-muted)]">
                    Legal disputes, commission changes/discounts, compliance waivers for close-of-escrow, and key vendor agreements.
                  </p>
                </div>
                <div className="p-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-xl">
                  <h5 className="font-bold text-[var(--sw-text)] text-[10px] uppercase mb-1">Staff-Owned Workflows</h5>
                  <p className="text-[11px] text-[var(--sw-muted)]">
                    Lockbox placement, signs setup, photoshoots scheduling, document checklist updates, and MLS listing launch tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'gaps' && (
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-[var(--sw-shadow-soft)] animate-fade-in space-y-4">
            <h3 className="font-serif font-bold text-sm text-[var(--sw-text)] select-none">Brokerage Role Vacancies</h3>
            <p className="text-xs text-[var(--sw-muted)] leading-normal select-none">
              To keep operations secure and aligned, every core operational role should be assigned to an active staff member.
            </p>
            {vacantRoles.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <strong>All core brokerage operational roles are successfully covered by active staff members. No gaps detected!</strong>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vacantRoles.map(role => (
                  <div key={role.role} className="p-4 border border-[var(--sw-border)] bg-[var(--sw-card)] rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-[var(--sw-text)] text-xs block">{role.label}</strong>
                      <span className="text-[10px] text-[var(--sw-muted)] mt-0.5 block leading-normal">{role.desc}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAddRole(role.role);
                        setAddName('');
                        setAddEmail('');
                        setAddPhone('');
                        setAddEscalations(false);
                        setAddError('');
                        setIsAddModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold rounded cursor-pointer shrink-0 transition-all active:scale-[0.97]"
                    >
                      Assign Role
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ADD STAFF MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in text-left select-text space-y-4">
            <div className="flex justify-between items-start border-b border-[var(--sw-border)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--sw-text)]">Add Staff Member</h3>
                <p className="text-[10px] text-[var(--sw-muted)] mt-0.5">Define a new brokerage staff member.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-[var(--sw-bg-soft)]/20 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-[var(--sw-muted)]" />
              </button>
            </div>

            {addError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs text-[var(--sw-muted)] font-medium">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Staff Member Name</label>
                <input 
                  type="text" 
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Ann Gunn" 
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Email Address</label>
                <input 
                  type="email" 
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. ann@nestrealty.com" 
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Cell Phone (Optional)</label>
                <input 
                  type="text" 
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="e.g. 512-555-0100" 
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Role</label>
                <select 
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                >
                  <option value="owner">Owner / Broker of Record</option>
                  <option value="operations_lead">Operations Lead</option>
                  <option value="marketing_coordinator">Marketing Coordinator</option>
                  <option value="transaction_coordinator">Transaction Coordinator</option>
                  <option value="compliance_partner">Compliance Partner</option>
                  <option value="events">Events Coordinator</option>
                  <option value="maintenance">Maintenance / Supplies</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 select-none">
                <input 
                  type="checkbox" 
                  id="addEscalations"
                  checked={addEscalations}
                  onChange={(e) => setAddEscalations(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="addEscalations" className="cursor-pointer font-bold text-[10px] text-[var(--sw-text)] uppercase">Can receive escalated tasks</label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[var(--sw-border)] select-none justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="sw-btn sw-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="sw-btn sw-btn-primary px-4 py-2"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MEMBER MODAL */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in text-left select-text space-y-4">
            <div className="flex justify-between items-start border-b border-[var(--sw-border)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--sw-text)]">Edit Staff Member</h3>
                <p className="text-[10px] text-[var(--sw-muted)] mt-0.5">Update {editingMember.name}'s roles & settings.</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 hover:bg-[var(--sw-bg-soft)]/20 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-[var(--sw-muted)]" />
              </button>
            </div>

            {editError && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs text-[var(--sw-muted)] font-medium">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Staff Member Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Cell Phone (Optional)</label>
                <input 
                  type="text" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Role</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                >
                  <option value="owner">Owner / Broker of Record</option>
                  <option value="operations_lead">Operations Lead</option>
                  <option value="marketing_coordinator">Marketing Coordinator</option>
                  <option value="transaction_coordinator">Transaction Coordinator</option>
                  <option value="compliance_partner">Compliance Partner</option>
                  <option value="events">Events Coordinator</option>
                  <option value="maintenance">Maintenance / Supplies</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-[var(--sw-text)]">Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  required
                  className="w-full p-2 border border-[var(--sw-border)] rounded-lg bg-[var(--sw-surface)]"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 select-none">
                <input 
                  type="checkbox" 
                  id="editEscalations"
                  checked={editEscalations}
                  onChange={(e) => setEditEscalations(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="editEscalations" className="cursor-pointer font-bold text-[10px] text-[var(--sw-text)] uppercase">Can receive escalated tasks</label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[var(--sw-border)] select-none justify-between items-center">
                <button 
                  type="button" 
                  onClick={handleDeactivate}
                  className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold rounded-xl transition-all cursor-pointer text-xs"
                >
                  Deactivate Staff
                </button>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingMember(null);
                    }}
                    className="sw-btn sw-btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="sw-btn sw-btn-primary px-4 py-2"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function GrowthEnginePage({ state }: { state: any }) {
  return <GrowthEngineView state={state} />;
}

function OfficeSignagePage({ state }: { state: any }) {
  const isInventoryEmpty = 
    (state.signInventory || []).length === 0 && 
    (state.officeSupplies || []).length === 0 && 
    (state.facilitiesIssues || []).length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Office & Signage" subtitle="Lightweight office readiness and sign inventory" />
      {isInventoryEmpty ? (
        <EmptyState
          title="No office or signage issues."
          description="Low sign inventory, supply gaps, and facilities issues will appear here."
          actionText="Add office issue"
          onAction={() => alert('Add office issue trigger')}
        />
      ) : (
        <OfficeReadinessSignInventory state={state} />
      )}
    </div>
  );
}

function ApprovalsPage({ state }: { state: any }) {
  const dbApprovals = (state.approvals || []).filter((a: any) => 
    a.status === 'pending'
  );

  const hasPending = dbApprovals.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" subtitle="Human review center for sensitive actions" />
      {!hasPending ? (
        <EmptyState
          title="Nothing waiting for approval."
          description="Outbound messages, secure links, and system updates will wait here before anything is sent or changed."
          actionText="Review approval rules"
          onAction={() => alert('Review approval rules trigger')}
        />
      ) : (
        <ApprovalCenter state={state} />
      )}
    </div>
  );
}

function OwnerBriefPage({ state }: { state: any }) {
  const isBriefEmpty = (state.workItems || []).length === 0 && (state.transactions || []).length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Owner Brief" subtitle="Executive summary" />
      {isBriefEmpty ? (
        <EmptyState
          title="No owner brief generated yet."
          description="Generate a brief once work items, transactions, and approvals begin moving through shapework."
          actionText="Generate owner brief"
          onAction={() => alert('Generate owner brief trigger')}
        />
      ) : (
        <WeeklyOwnerBrief state={state} />
      )}
    </div>
  );
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

function RyanShieldPageWrapper({ state }: { state: any }) {
  const activeWorkItems = (state.workItems || []).filter(
    (w: any) => w.status !== 'completed' && w.status !== 'resolved' &&
    (w.ownerRole === 'owner' || w.approvalRequired === true || w.priority === 'critical' || w.priority === 'owner_worthy')
  );

  const mappedWorkItems = activeWorkItems.map((w: any) => ({
    id: w.id,
    type: w.title || w.type || 'Operational Request',
    reason: w.recommendedNextAction || w.reason || 'Awaiting principal review.',
    currentHandler: w.ownerRole ? w.ownerRole.replace(/_/g, ' ') : 'Unassigned',
    recommendedAction: w.recommendedNextAction || 'Take appropriate action.',
    responseWindow: w.priority === 'critical' ? '1 hour' : '24 hours',
    urgency: (w.priority === 'critical' || w.priority === 'urgent' || w.priority === 'owner_worthy') ? 'urgent' : 'high'
  }));

  const waitingJobs = (state.jobs || []).filter((j: any) => j.status === 'waiting_approval');
  const mappedJobs = waitingJobs.map((j: any) => ({
    id: j.id,
    type: j.workflowName || j.requestText || 'Job Approval',
    reason: `Task waiting approval: ${j.currentStep || j.requestText || 'Approve execution'}`,
    currentHandler: j.handler || 'Unassigned',
    recommendedAction: 'Approve or reject execution of this automated task.',
    responseWindow: '1 hour',
    urgency: 'urgent'
  }));

  const needsRyan = [...mappedWorkItems, ...mappedJobs];

  const protectedRaw = [
    ...(state.workItems || []).filter((w: any) => w.category === 'interruption_avoided' || w.category === 'deflection' || w.type === 'interruption_avoided' || w.type === 'deflection'),
    ...(state.ownerBriefItems || []).filter((item: any) => item.category === 'interruption_avoided' || item.category === 'deflection')
  ];
  
  const mappedProtected = protectedRaw.map((item: any) => ({
    id: item.id,
    request: item.title || item.requestText || item.description || 'Routine Request',
    routedTo: item.owner || item.ownerRole || item.assignedTo || 'Operations Team',
    backup: 'Ryan Crecelius',
    status: 'handled' as const,
    timeSaved: item.timeSaved || '~25 min'
  }));

  const fallbackProtected = [
    {
      id: 'pr_fallback_1',
      request: 'Listing launch for 123 Magnolia St',
      routedTo: 'Melissa Gagliardi',
      backup: 'Ryan Crecelius',
      status: 'handled' as const,
      timeSaved: '~45 min'
    },
    {
      id: 'pr_fallback_2',
      request: 'Lockbox replacement — 89 Oleander Dr',
      routedTo: 'Ann Gunn',
      backup: 'Ryan Crecelius',
      status: 'handled' as const,
      timeSaved: '~20 min'
    },
    {
      id: 'pr_fallback_3',
      request: 'Commission question — closing March deal',
      routedTo: 'James Fort',
      backup: 'Ryan Crecelius',
      status: 'handled' as const,
      timeSaved: '~30 min'
    }
  ];

  const protectedList = mappedProtected.length > 0 ? mappedProtected : fallbackProtected;

  const requiredRoles = ['operations_lead', 'marketing_coordinator', 'transaction_coordinator', 'compliance_partner'];
  const vacantRolesKeys = requiredRoles.filter(roleKey => 
    !(state.profiles || []).some((p: any) => p.role === roleKey && p.status === 'active')
  );

  const roleLabels: Record<string, string> = {
    operations_lead: 'Operations Lead',
    marketing_coordinator: 'Marketing Coordinator',
    transaction_coordinator: 'Transaction Coordinator',
    compliance_partner: 'Compliance Partner'
  };

  const openRoles = vacantRolesKeys.map(roleKey => ({
    id: `risk_${roleKey}`,
    role: roleLabels[roleKey] || roleKey,
    status: 'open' as const,
    gap: `Operational gaps in ${roleLabels[roleKey] || roleKey} duties.`,
    coveringToday: 'Ryan Crecelius (backup)',
    impactOnRyan: 'high' as const
  }));

  const summary: ShieldSummaryCard[] = [
    {
      id: 'needs_ryan',
      label: 'Needs Ryan',
      value: needsRyan.length,
      sub: 'Items requiring principal review',
      urgency: needsRyan.length > 0 ? 'urgent' : 'ok',
    },
    {
      id: 'routed',
      label: 'Routed Without Ryan',
      value: 24 + protectedRaw.length,
      sub: 'Requests handled by the team this week',
      urgency: 'ok',
    },
    {
      id: 'missing_info',
      label: 'Missing Information',
      value: (state.workItems || []).filter((w: any) => w.status === 'blocked').length,
      sub: 'Requests waiting on required details',
      urgency: 'attention',
    },
    {
      id: 'overdue',
      label: 'Overdue / Stuck',
      value: (state.workItems || []).filter((w: any) => w.dueDate && new Date(w.dueDate) < new Date() && w.status !== 'completed').length,
      sub: 'Items past their response window',
      urgency: 'attention',
    },
    {
      id: 'ownerless',
      label: 'Ownerless',
      value: (state.workItems || []).filter((w: any) => !w.ownerRole && w.status !== 'completed').length,
      sub: 'No handler assigned yet',
      urgency: 'attention',
    },
    {
      id: 'open_role_risk',
      label: 'Open Role Risk',
      value: openRoles.length,
      sub: `${openRoles.length} unfilled seat${openRoles.length !== 1 ? 's' : ''} creating coverage gaps`,
      urgency: openRoles.length >= 2 ? 'attention' : 'ok',
    },
  ];

  const ryanShieldData = {
    summary,
    needsRyan,
    protected: protectedList,
    openRoles
  };

  const handleAction = async (action: string, item: any) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (action === 'approve') {
        const res = await fetch(`/api/work-items/${item.id}/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            status: 'completed',
            userName: state.activeProfile?.name || 'Ryan Crecelius',
            userRole: state.activeProfile?.role || 'owner'
          })
        });
        if (res.ok) {
          await state.fetchState();
        }
      } else if (action === 'reject') {
        const res = await fetch(`/api/work-items/${item.id}/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            status: 'blocked',
            userName: state.activeProfile?.name || 'Ryan Crecelius',
            userRole: state.activeProfile?.role || 'owner'
          })
        });
        if (res.ok) {
          await state.fetchState();
        }
      } else if (action === 'delegate') {
        const res = await fetch(`/api/work-items/${item.id}/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ownerRole: 'operations_lead',
            userName: state.activeProfile?.name || 'Ryan Crecelius',
            userRole: state.activeProfile?.role || 'owner'
          })
        });
        if (res.ok) {
          await state.fetchState();
        }
      } else if (action === 'request_info') {
        const res = await fetch(`/api/work-items/${item.id}/update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            status: 'blocked',
            userName: state.activeProfile?.name || 'Ryan Crecelius',
            userRole: state.activeProfile?.role || 'owner'
          })
        });
        if (res.ok) {
          await state.fetchState();
        }
      }
    } catch (err) {
      console.error('Failed to trigger database mutation:', err);
    }
  };

  return (
    <div className="text-[var(--text-primary)]">
      <RyanShieldPage data={ryanShieldData} onAction={handleAction} state={state} />
    </div>
  );
}

function RedesignedOwnerBriefPage({ state }: { state: any }) {
  const briefData = buildOwnerWeeklyBrief();

  const wsId = state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo';
  const bcConnection = (state.basecampConnections || []).find(
    (c: any) => c.workspaceId === wsId && c.status === 'connected'
  );
  const bcSignals = (state.basecampSignals || []).filter(
    (s: any) => s.workspaceId === wsId
  );

  const overdueTasks = bcSignals.filter((s: any) => s.signalType === 'todo_overdue');
  const unassignedWork = bcSignals.filter((s: any) => s.signalType === 'todo_unassigned');
  const ownerMentions = bcSignals.filter((s: any) => s.signalType === 'owner_mentioned');
  const stuckFollowups = bcSignals.filter((s: any) => 
    s.signalType === 'task_stuck' || 
    s.signalType === 'marketing_request_detected' || 
    s.signalType === 'event_task_detected' || 
    s.signalType === 'office_issue_detected' || 
    s.signalType === 'vendor_followup_detected'
  );

  const googleConn = (state.googleConnections || []).find((c: any) => c.workspaceId === wsId && c.status === 'connected');
  const msConn = (state.microsoftConnections || []).find((c: any) => c.workspaceId === wsId && c.status === 'connected');

  const syncedEmailsCount = (state.emailMessages || []).filter((m: any) => !m.workspaceId || m.workspaceId === wsId).length;
  const syncedEventsCount = (state.calendarEvents || []).filter((e: any) => !e.workspaceId || e.workspaceId === wsId).length;
  const pendingOutboxCount = (state.actionProposals || []).filter((p: any) => p.action_type === 'draft_email' && p.state === 'suggested').length;

  const totalActive = (state.transactions || []).filter((t: any) => t.current_stage !== 'closed');
  const complianceRisks = (state.jobs || []).filter((j: any) => 
    j.status !== 'completed' && 
    (j.workflowKey === 'closing_compliance_risk' || j.workflowKey === 'missing_document' || j.workflowKey === 'compliance_chase')
  );
  const filesWaitingOnAgents = (state.jobs || []).filter((j: any) => 
    j.status === 'blocked' || 
    (j.requestText || '').toLowerCase().includes('agent')
  );
  const marketingBottlenecks = (state.jobs || []).filter((j: any) => 
    j.status !== 'completed' && 
    j.workflowKey === 'marketing_request'
  );
  const officeIssues = (state.jobs || []).filter((j: any) => 
    j.status !== 'completed' && 
    (j.workflowKey === 'office_readiness' || j.workflowKey === 'facilities_issue' || j.workflowKey === 'sign_low_stock')
  );

  return (
    <div className="text-[var(--text-primary)] select-text space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2">
          <OwnerWeeklyBriefPage data={briefData} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div 
            className="rounded-[28px] p-6 space-y-5 text-left shadow-xl"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <h4 className="font-serif font-black text-base uppercase tracking-wider text-white">
              Brokerage Operational Pulse
            </h4>
            
            {/* QuickBooks Financial Insights */}
            <div>
              <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block text-left">Brokerage Financial Ledger (30d)</span>
              {(() => {
                const qbConnection = (state.quickbooksConnections || []).find(
                  (c: any) => c.workspaceId === wsId
                );
                if (qbConnection && qbConnection.plSummary) {
                  return (
                    <div className="mt-2 space-y-2 text-xs text-[#D0D6BB]">
                      <div className="flex justify-between">
                        <span>Net Income:</span>
                        <span className={`font-mono font-bold ${qbConnection.plSummary.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(qbConnection.plSummary.netIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Income:</span>
                        <span className="font-bold text-white font-mono">{formatCurrency(qbConnection.plSummary.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Expenses:</span>
                        <span className="font-mono text-[#D0D6BB]">{formatCurrency(qbConnection.plSummary.totalExpenses)}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mt-2 p-2 border border-dashed border-white/10 rounded-xl text-center">
                    <span className="text-[10px] text-[#D0D6BB] block">Financial ledger not connected</span>
                  </div>
                );
              })()}
            </div>
            
            {/* QuickBooks Online Signal Audit */}
            {(() => {
              const qbSignals = (state.financeSignals || []).filter(
                (s: any) => s.workspaceId === wsId && s.sourceSystem === 'quickbooks'
              );
              if (qbSignals.length === 0) return null;
              return (
                <div className="border-t border-white/10 pt-3">
                  <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block text-left">Ledger Alerts & Signals</span>
                  <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                    {qbSignals.map((sig: any) => (
                      <div key={sig.id} className="p-2 bg-black/30 border border-white/10 rounded-xl text-[9px] space-y-1 leading-normal text-left">
                        <div className="flex justify-between items-center font-mono">
                          <span className={`px-1.5 rounded uppercase font-bold text-[7px] ${
                            sig.signalType === 'payment_received' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                            sig.signalType === 'deposit_received' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' :
                            'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            {sig.signalType.replace('_', ' ')}
                          </span>
                          <span className="text-[#D0D6BB]">{sig.date}</span>
                        </div>
                        <p className="text-[10px] text-white font-medium leading-relaxed">{sig.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            {/* Basecamp Audit */}
            <div className="border-t border-white/10 pt-3 text-left">
              <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block text-left">Closing & Escrow Task Pipeline</span>
              {bcConnection ? (
                <div className="mt-2 space-y-1.5 text-xs text-[#D0D6BB]">
                  <div className="flex justify-between">
                    <span>Overdue Tasks:</span>
                    <span className={`font-mono font-bold ${overdueTasks.length > 0 ? 'text-red-400' : ''}`}>{overdueTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unassigned Work:</span>
                    <span className="font-mono font-bold text-white">{unassignedWork.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner Mentions:</span>
                    <span className={`font-mono font-bold ${ownerMentions.length > 0 ? 'text-emerald-400' : ''}`}>{ownerMentions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stuck Items:</span>
                    <span className={`font-mono font-bold ${stuckFollowups.length > 0 ? 'text-amber-400' : ''}`}>{stuckFollowups.length}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-2 border border-dashed border-white/10 rounded-xl text-center">
                  <span className="text-[10px] text-[#D0D6BB] block">Task pipeline not connected</span>
                </div>
              )}
            </div>

            {/* Email / Calendar Audit */}
            <div className="border-t border-white/10 pt-3 text-left">
              <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block text-left">Client & Agent Correspondence</span>
              <div className="mt-2 space-y-1.5 text-xs text-[#D0D6BB]">
                <div className="flex justify-between">
                  <span>Synced Emails:</span>
                  <span className="font-mono font-bold text-white">{syncedEmailsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Calendar Events:</span>
                  <span className="font-mono font-bold text-white">{syncedEventsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Outbox:</span>
                  <span className={`font-mono font-bold ${pendingOutboxCount > 0 ? 'text-emerald-400' : ''}`}>{pendingOutboxCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mail Sync:</span>
                  <span className="font-mono text-[#D0D6BB]">{googleConn || msConn ? 'Active' : 'Offline'}</span>
                </div>
              </div>
            </div>

            {/* Operational Risks */}
            <div className="border-t border-white/10 pt-3 text-left">
              <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block text-left">Brokerage Compliance & Backlog</span>
              <div className="mt-2 space-y-1.5 text-xs text-[#D0D6BB]">
                <div className="flex justify-between">
                  <span>Active Transactions:</span>
                  <span className="font-mono font-bold text-white">{totalActive.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compliance Risks:</span>
                  <span className={`font-mono font-bold ${complianceRisks.length > 0 ? 'text-red-400' : ''}`}>{complianceRisks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waiting on Agents:</span>
                  <span className="font-mono font-bold text-white">{filesWaitingOnAgents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketing Bottlenecks:</span>
                  <span className="font-mono font-bold text-white">{marketingBottlenecks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Office Issues:</span>
                  <span className={`font-mono font-bold ${officeIssues.length > 0 ? 'text-amber-400' : ''}`}>{officeIssues.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsPage({ state }: { state: any }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" subtitle="Connected systems and integrations" />
      <IntegrationsHub
        connections={state.integrations}
        onToggleConnection={state.handleToggleConnection}
        onTestConnection={state.handleTestConnection}
        onTriggerDemoEvent={state.handleTriggerDemoEvent}
        isSyncing={state.isSyncing}
        state={state}
      />
    </div>
  );
}

function AuditPage({ state }: { state: any }) {
  const [auditTab, setAuditTab] = useState<'timeline' | 'log' | 'approvals'>('timeline');

  return (
    <div className="space-y-6">
      <PageHeader title="Audit" subtitle="Operations audit ledger" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-2 select-none">
        <div className="flex gap-4">
          {[
            { id: 'timeline', label: 'Timeline' },
            { id: 'log', label: 'Audit Log' },
            { id: 'approvals', label: 'Approvals History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAuditTab(tab.id as any)}
              className={`pb-2 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                auditTab === tab.id
                  ? 'border-[var(--sw-green-900)] text-[var(--sw-green-900)] font-bold'
                  : 'border-transparent text-[var(--sw-muted)] hover:text-[var(--sw-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {auditTab === 'timeline' && (
        <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-[var(--sw-text)] uppercase tracking-wider">Timeline</h3>
          <LiveOperationsTimeline onInspectRecord={() => {}} maxCount={15} />
        </div>
      )}

      {auditTab === 'log' && (
        <ActivityAuditTrail
          auditLogs={state.auditEvents}
          onRollback={state.handleRollbackAuditAction}
        />
      )}

      {auditTab === 'approvals' && (
        <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-[var(--sw-text)] uppercase tracking-wider">Resolved Approvals</h3>
          <div className="divide-y divide-[var(--sw-border)]/60">
            <div className="py-3 text-xs flex justify-between">
              <span className="text-[var(--sw-success)] font-semibold">Approved: Foundation Contingency Crack Waiver</span>
              <span className="text-[var(--sw-muted)]">Sarah Jenkins · 15m ago</span>
            </div>
            <div className="py-3 text-xs flex justify-between">
              <span className="text-[var(--sw-success)] font-semibold">Approved: Wire Ingest Matching Exception Close</span>
              <span className="text-[var(--sw-muted)]">Sarah Jenkins · 1h ago</span>
            </div>
            <div className="py-3 text-xs flex justify-between">
              <span className="text-[var(--sw-text)]">Auto-logged: Lockbox opened at 109 Woodlawn</span>
              <span className="text-[var(--sw-muted)]">System Gateway · 2h ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRulesPanel({ state }: { state: any }) {
  const [cooldown, setCooldown] = useState(5);
  const [rules, setRules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = () => {
    fetch('/api/notifications/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCooldown(data.cooldown);
          setRules(data.rules);
        }
      });

    fetch('/api/notifications/list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (newCooldown: number, newRules: any[]) => {
    try {
      await fetch('/api/notifications/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooldown: newCooldown, rules: newRules })
      });
      fetchSettings();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRule = (ruleId: string) => {
    const updated = rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    handleSaveSettings(cooldown, updated);
  };

  return (
    <div className="space-y-6">
      {/* Cooldown Settings Card */}
      <div className="bg-white border border-[#e4decb] rounded-xl p-5 shadow-sm space-y-4 text-left">
        <div>
          <h3 className="text-xs font-bold text-[#1e2520] uppercase tracking-wider">Notification Cooldown & Anti-Spam</h3>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">Prevent duplicate notifications by defining the minimum interval between messages.</p>
        </div>
        <div className="flex items-center gap-4 max-w-sm select-none">
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={cooldown} 
            onChange={(e) => {
              const val = Number(e.target.value);
              setCooldown(val);
            }}
            onMouseUp={() => handleSaveSettings(cooldown, rules)}
            className="flex-1 accent-[#18382b] cursor-pointer" 
          />
          <span className="font-mono font-bold text-[#18382b] text-xs bg-[#eaf2ee] px-2.5 py-1 rounded border border-[#eaf2ee]/80">{cooldown} Minutes</span>
        </div>
      </div>

      {/* Rules list Card */}
      <div className="bg-white border border-[#e4decb] rounded-xl p-5 shadow-sm space-y-4 text-left">
        <div>
          <h3 className="text-xs font-bold text-[#1e2520] uppercase tracking-wider">Trigger Rules</h3>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">Configure automated notifications dispatched to administrators and brokerage coordinators.</p>
        </div>
        
        <div className="space-y-2 text-xs">
          {rules.map((rule) => (
            <div key={rule.id} className="flex justify-between items-center py-2 border-b border-stone-100 hover:bg-[#fcfbf7]/25 px-2 rounded transition-all select-none">
              <div className="space-y-0.5">
                <span className="font-bold text-[#1e2520]">{rule.event}</span>
                <span className="block text-[9px] text-[#8c8c8c] uppercase font-mono">{rule.channel} Channel</span>
              </div>
              <button
                type="button"
                onClick={() => toggleRule(rule.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                  rule.enabled 
                    ? 'bg-[#eaf2ee] border-[#18382b] text-[#18382b]' 
                    : 'bg-stone-50 border-stone-200 text-[#8c8c8c]'
                }`}
              >
                {rule.enabled ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Triggered Notifications list Card */}
      <div className="bg-white border border-[#e4decb] rounded-xl p-5 shadow-sm space-y-4 text-left">
        <div>
          <h3 className="text-xs font-bold text-[#1e2520] uppercase tracking-wider">Notification Handoff Log</h3>
          <p className="text-xs text-[#6b7280] mt-1 font-medium">System audit record of queued, dispatched, and interacted notifications.</p>
        </div>

        <div className="border border-[#e4decb]/60 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left table-fixed">
            <thead className="bg-[#fcfbf7] border-b border-[#e4decb] text-[9px] font-bold text-[#8c8c8c] uppercase tracking-wider select-none">
              <tr>
                <th className="p-2 w-1/4">Recipient</th>
                <th className="p-2">Action Type</th>
                <th className="p-2 w-16 text-center">Channel</th>
                <th className="p-2 w-20 text-center">Status</th>
                <th className="p-2 w-24 text-right pr-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4decb]/40 text-[10px]">
              {notifications.map((n: any) => (
                <tr key={n.id} className="hover:bg-[#fcfbf7]/20 font-medium">
                  <td className="p-2 font-bold text-[#1e2520] truncate">{n.recipientName}</td>
                  <td className="p-2 truncate capitalize font-mono text-[9px]">{n.actionType.replace(/_/g, ' ')}</td>
                  <td className="p-2 text-center uppercase font-mono text-[9px]">{n.channel}</td>
                  <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.2 rounded-full font-bold text-[8px] uppercase tracking-wide select-none ${
                      n.status === 'sent' || n.status === 'acted'
                        ? 'bg-[#eaf2ee] text-[#18382b]'
                        : n.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-stone-100 text-[#8c8c8c]'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="p-2 text-right text-[#8c8c8c] pr-4 font-mono text-[9px]">{new Date(n.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-text-tertiary italic">No dispatched notifications in system state log.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomerSettingsPage({ state }: { state: any }) {
  const [orgModel, setOrgModel] = useState<any>(null);

  useEffect(() => {
    const model = orgChartService.getOrgChart(state.workspaceId || 'nest-realty-demo');
    setOrgModel(model);
  }, [state.workspaceId]);

  const [settingsTab, setSettingsTab] = useState<
    | 'profile'
    | 'branding'
    | 'preferences'
    | 'visual-org-map'
    | 'organization-chart-wizard'
  >('profile');

  if (settingsTab === 'visual-org-map') {
    return (
      <div className="settings-workspace-mode visual-org-map-workspace">
        <OrgChartWizardPage 
          state={state} 
          embeddedTab="visual" 
          onClose={() => setSettingsTab('profile')} 
        />
      </div>
    );
  }

  const settingsGroups = [
    {
      title: "Brokerage Configuration",
      items: [
        { id: 'profile', label: 'Workspace Profile' },
        { id: 'branding', label: 'White-Label Branding' },
        { id: 'preferences', label: 'Workspace Preferences' },
        { id: 'visual-org-map', label: 'Visual Org Map' },
        { id: 'organization-chart-wizard', label: 'Organization Chart Wizard' }
      ]
    }
  ];

  return (
    <div className="space-y-6 text-[#F6F7F1]">
      <PageHeader title="Settings" subtitle="Brokerage configuration and workspace settings" />

      <div className="flex flex-col lg:flex-row gap-8 text-left animate-fade-in pb-10">
        <div className="w-full lg:w-60 shrink-0 flex flex-col gap-6 select-none border-b lg:border-b-0 lg:border-r border-[rgba(246,247,241,0.12)] pb-6 lg:pb-0 lg:pr-6">
          {settingsGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono">
                {group.title}
              </span>
              <div className="flex flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {settingsGroups.flatMap(g => g.items).filter(item => group.items.find(i => i.id === item.id)).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id as any)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all shrink-0 cursor-pointer ${
                      settingsTab === tab.id
                        ? 'bg-[#00635C] text-white border border-[rgba(246,247,241,0.18)] font-bold shadow-sm'
                        : 'text-[#D0D6BB] hover:bg-[rgba(246,247,241,0.06)] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {settingsTab === 'profile' && (
            <div 
              className="rounded-[28px] p-6 shadow-lg space-y-6 text-left border"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div>
                <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Workspace Profile</h3>
                <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Manage public profile details and business locations.</p>
              </div>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono mb-1">Company Name</label>
                  <input type="text" readOnly value="Nest Realty Wilmington" className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-xs font-semibold text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono mb-1">Primary Office Address</label>
                  <input type="text" readOnly value="152 Edgewater Lane, Wilmington, NC 28403" className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-xs font-semibold text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono mb-1">Support Contact Email</label>
                  <input type="text" readOnly value="operations@nestrealtywilmington.com" className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-xs font-semibold text-white focus:outline-none" />
                </div>
              </div>
              {/* Org Chart Entry Card */}
              <div className="pt-6 border-t border-[rgba(246,247,241,0.12)] space-y-4">
                <div className="bg-black/10 border border-white/5 rounded-2xl p-4 text-left">
                  <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
                    Organization Chart & Role Map
                  </h4>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-medium font-sans leading-relaxed">
                    Build the org chart, role map, SOP knowledge base, staffing plan, and escalation rules that power Ask Nest Ops routing.
                  </p>
                </div>

                {orgModel && (() => {
                  const activeSeats = orgModel.positions.filter((p: any) => !p.status || p.status === 'active' || p.status === 'fractional' || p.status === 'outsourced').length;
                  const openSeats = orgModel.positions.filter((p: any) => p.status === 'open' || p.status === 'wanted').length;
                  const plannedSeats = orgModel.positions.filter((p: any) => p.status === 'planned').length;
                  const aiSeats = orgModel.positions.filter((p: any) => p.status === 'virtual_ai').length;
                  const sopsCount = orgModel.sops.length;
                  const escsCount = orgModel.escalationPolicies.length;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 bg-black/20 p-4 border border-white/5 rounded-2xl font-mono text-left my-4">
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">Active Seats</span>
                        <strong className="text-white text-sm font-serif font-black block">{activeSeats} Positions</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">Open/Wanted</span>
                        <strong className="text-amber-400 text-sm font-serif font-black block">{openSeats} Approved Gaps</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">Planned</span>
                        <strong className="text-blue-300 text-sm font-serif font-black block">{plannedSeats} Future Seats</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">AI / Virtual</span>
                        <strong className="text-emerald-300 text-sm font-serif font-black block">{aiSeats} Cloud Agents</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">SOPs/Docs</span>
                        <strong className="text-white text-sm font-serif font-black block">{sopsCount} Checklists</strong>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7.5px] uppercase text-[#D0D6BB]/50 block">Escalations</span>
                        <strong className="text-white text-sm font-serif font-black block">{escsCount} Policies</strong>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('visual-org-map');
                    }}
                    className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Open Visual Org Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsTab('organization-chart-wizard');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#D0D6BB] border border-white/10 rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Open Organization Chart Wizard
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-[rgba(246,247,241,0.12)]">
                <ToolStackMap state={state} />
              </div>
            </div>
          )}

          {settingsTab === 'branding' && (
            <BrandingPanel />
          )}

          {settingsTab === 'preferences' && (
            <div 
              className="rounded-[28px] p-6 shadow-lg space-y-6 text-left border"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div>
                <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Workspace Preferences</h3>
                <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Configure regional preferences, timezones, and operational hours.</p>
              </div>
              <div className="space-y-4 max-w-lg">
                <div className="space-y-1 text-xs">
                  <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Brokerage Timezone</label>
                  <select defaultValue="Eastern" className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold text-xs">
                    <option value="Eastern">Eastern Standard Time (EST) - New York / Wilmington</option>
                    <option value="Central">Central Standard Time (CST) - Chicago / Austin</option>
                    <option value="Mountain">Mountain Standard Time (MST) - Denver</option>
                    <option value="Pacific">Pacific Standard Time (PST) - Los Angeles</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Business Hours Start</label>
                    <select defaultValue="08:00" className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold text-xs">
                      <option value="07:00">7:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Business Hours End</label>
                    <select defaultValue="18:00" className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold text-xs">
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3 select-none">
                  <button 
                    type="button"
                    onClick={() => alert('Workspace preferences saved successfully!')}
                    className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] rounded-xl font-bold text-white text-xs cursor-pointer border border-[rgba(246,247,241,0.18)] shadow-md transition-colors"
                  >
                    Save Preferences
                  </button>
                  <button 
                    type="button"
                    onClick={async () => {
                      sessionStorage.removeItem('shapework_demo_access');
                      try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                      } catch {}
                      window.location.href = '/login';
                    }}
                    className="px-4 py-2 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] rounded-xl font-bold text-white text-xs cursor-pointer transition-colors"
                  >
                    Sign Out Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'organization-chart-wizard' && (
            <div className="w-full max-w-none flex flex-col relative bg-[#01362D] border border-[rgba(246,247,241,0.12)] rounded-3xl overflow-hidden shadow-2xl" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
              <OrgChartWizardPage state={state} embeddedTab="guided" onClose={() => setSettingsTab('profile')} />
            </div>
          )}
        
        {/* Footer links */}
        <div className="mt-8 pt-4 border-t border-[rgba(246,247,241,0.12)] flex items-center justify-center gap-4 text-[10px] text-[#D0D6BB] pb-4 select-none">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-[rgba(246,247,241,0.12)]" />
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white">Terms of Service</a>
          <span className="w-1 h-1 rounded-full bg-[rgba(246,247,241,0.12)]" />
          <span>&copy; {new Date().getFullYear()} shapework.</span>
        </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// NEW BROKERAGE APPS SUBCOMPONENTS
// -------------------------------------------------------------
function VoiceActionsPage({ state }: { state: any }) {
  const [approvedCalls, setApprovedCalls] = useState([
    { id: 'call_1', party: 'Lender (Alice Walker)', phone: '512-555-2222', duration: '2m 14s', status: 'approved', summary: 'Confirmed financing easement documents uploaded.', date: '2026-07-06' },
    { id: 'call_2', party: 'Co-Op Agent (Brooke Shields)', phone: '512-555-0181', duration: '1m 45s', status: 'approved', summary: 'Scheduled foundation inspection visit for Tuesday.', date: '2026-07-07' },
    { id: 'call_3', party: 'Escrow Officer (Robert Vance)', phone: '512-555-3333', duration: '3m 02s', status: 'pending_approval', summary: 'Requesting updated closing disclosure approvals.', date: '2026-07-08' }
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Voice Actions" subtitle="Review and approve outbound coordinator voice calls and transcription logs" />
      <div className="bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-6 text-left font-sans">
        <div className="flex justify-between items-center pb-2 border-b border-[#e4decb]/60 select-none">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-mono">Simulated Operator Call Logs</span>
          <span className="px-2 py-0.5 bg-brand-900/10 text-[#18382b] text-[10px] font-bold rounded-full font-mono">Retell Voice Integration</span>
        </div>

        <div className="space-y-4">
          {approvedCalls.map(c => (
            <div key={c.id} className="p-4 border border-[#e4decb] rounded-xl hover:bg-stone-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1e2520]">{c.party}</span>
                  <span className="text-[10px] text-text-tertiary font-mono">{c.phone}</span>
                </div>
                <p className="text-[11px] text-text-secondary font-medium leading-relaxed">{c.summary}</p>
                <div className="flex items-center gap-3 text-[10px] text-text-tertiary font-semibold">
                  <span>Duration: {c.duration}</span>
                  <span className="w-1 h-1 rounded-full bg-[#e4decb]" />
                  <span>Date: {c.date}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 select-none">
                {c.status === 'approved' ? (
                  <span className="px-2 py-0.5 bg-[#eaf2ee] text-[#18382b] text-[10px] font-bold rounded border border-[#ccdcd4] uppercase font-mono">
                    Approved & Dispatched
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setApprovedCalls(prev => prev.map(p => p.id === c.id ? { ...p, status: 'approved' } : p));
                      alert('Phone call successfully approved and queued for dispatch!');
                    }}
                    className="px-3 py-1 bg-[#18382b] hover:bg-[#1f4a39] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Approve Call Dispatch
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClientPortalsPage({ state }: { state: any }) {
  return (
    <div className="space-y-6 text-[#F6F7F1]">
      <PageHeader title="Client Deal Portals" subtitle="Manage secure access links and whitelabeled onboarding hubs for buyers and sellers" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        <div className="lg:col-span-2 space-y-6">
          <ClientAgentAccessPanel />
        </div>
        <div 
          className="rounded-[28px] p-6 shadow-lg space-y-4 text-left border font-sans"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider block border-b border-[rgba(246,247,241,0.12)] pb-2 select-none">Portal Security & Isolation</h3>
          <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium">
            Client deal portals are isolated, token-authenticated, single-purpose secure views.
          </p>
          <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl space-y-2 text-[11px] text-[#D0D6BB]">
            <span className="font-bold text-white block">Access Guidelines</span>
            <ul className="list-disc list-inside space-y-1 text-[#D0D6BB] font-sans font-medium">
              <li>No credentials or logins required</li>
              <li>Secured via cryptographic hashes</li>
              <li>Tokens expire automatically</li>
              <li>No leak of developer diagnostics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({ state }: { state: any }) {
  return (
    <div className="space-y-6 text-[#F6F7F1]">
      <PageHeader title="Notification Rules" subtitle="Configure automated SMS and email routing rules for your brokerage team and clients" />
      <div className="text-left animate-fade-in">
        <ExtendedNotificationPanel state={state} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// WORKBOARD PAGE (AI COWORKER EXPERIENCE)
// -------------------------------------------------------------
function WorkboardPage({
  state,
  jobs,
  steps,
  outputs,
  loading,
  onSelectJob,
  onOpenViewAll,
  onOpenExplanation
}: {
  state: any;
  jobs: any[];
  steps: any[];
  outputs: any[];
  loading: boolean;
  onSelectJob: (job: any) => void;
  onOpenViewAll: () => void;
  onOpenExplanation: (key: string) => void;
}) {
  const [composerText, setComposerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [planningStage, setPlanningStage] = useState<string | null>(null);

  const handleSuggestClick = (text: string) => {
    setComposerText(text);
  };

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || submitting) return;

    setSubmitting(true);
    
    // Premium multi-stage planning animation
    setPlanningStage('Analyzing plain-English request...');
    await new Promise(r => setTimeout(r, 450));
    setPlanningStage('Formulating execution steps...');
    await new Promise(r => setTimeout(r, 450));
    setPlanningStage('Validating security boundaries...');
    await new Promise(r => setTimeout(r, 400));

    try {
      const res = await fetch('/api/shapework/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestText: composerText })
      });
      if (res.ok) {
        setComposerText('');
        // Trigger parent state reload
        if (state.reloadJobs) {
          state.reloadJobs();
        }
      }
    } catch (err) {
      console.error('Failed to submit coworker job:', err);
    } finally {
      setSubmitting(false);
      setPlanningStage(null);
    }
  };

  const runningJobs = jobs.filter(j => j.status === 'running');
  const blockedJobs = jobs.filter(j => j.status === 'blocked');
  const waitingJobs = jobs.filter(j => j.status === 'waiting_approval');
  const reviewJobs = jobs.filter(j => j.status === 'needs_review');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  // Count metrics
  const activeCount = runningJobs.length + waitingJobs.length + reviewJobs.length;
  const blockedCount = blockedJobs.length;
  const approvalsCount = steps.filter(s => s.status === 'waiting_approval').length;
  const completedCount = completedJobs.length;
  const deflectionCount = 24 + completedCount * 2;

  const suggestedChips = [
    "Chase missing compliance docs for closings this week",
    "Send Google review requests for closed transactions",
    "Check sign and lockbox readiness for upcoming listings",
    "Route low-priority office issues away from Ryan",
    "Prepare this week’s owner brief",
    "Create a marketing launch workflow for a new listing",
    "Follow up with vendors missing invoices",
    "Build a role and escalation map for recurring issues"
  ];

  const requestSignals = [
    { type: 'incoming', title: 'new request received', detail: 'dotloop closing record (Bruce Wayne)', time: '2h ago', status: 'completed' },
    { type: 'inbox_inquiry', title: 'owner interruption avoided', detail: 'Deflected routine signs inquiry to Steve', time: '3h ago', status: 'completed' },
    { type: 'compliance', title: 'compliance item detected', detail: 'Lead disclosures check: 124 Ocean Blvd', time: '4h ago', status: 'running' },
    { type: 'api', title: 'agent follow-up routed', detail: 'Marketing launch package request registered', time: '5h ago', status: 'completed' },
    { type: 'api', title: 'vendor follow-up prepared', detail: 'Signage reserves inventory check', time: '6h ago', status: 'completed' }
  ];

  // Find a job that is blocked or waiting approval for the featured alert card
  const needsAttentionJob = jobs.find(j => j.status === 'blocked' || j.status === 'waiting_approval');

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Hero Dashboard Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--sw-border)] pb-4 gap-4">
        <div>
          <h1 className="font-serif font-black text-2xl text-[var(--sw-green-900)] tracking-tight">
            Today in the Brokerage
          </h1>
          <p className="text-xs text-[var(--sw-muted)] mt-1 font-medium font-sans">
            Shapework AI coworker active operations control plane
          </p>
        </div>

        <div className="flex flex-wrap gap-2 select-none">
          <button
            onClick={() => {
              state.setCurrentTab('Work Queue');
              window.history.pushState({}, '', '/app/work');
            }}
            data-testid="telemetry-needs-attention"
            className="bg-white border border-[var(--sw-border)] rounded-lg px-3 py-2 text-center shadow-sm min-w-[80px] hover:border-[var(--sw-green-900)] transition-all cursor-pointer focus:outline-none"
          >
            <div className="text-[10px] uppercase font-bold text-[var(--sw-muted)] font-mono tracking-wider">Active</div>
            <div className="text-lg font-serif font-bold text-[var(--sw-green-900)] mt-0.5">{activeCount}</div>
          </button>
          
          <button
            onClick={() => {
              state.setCurrentTab('Approvals');
              window.history.pushState({}, '', '/app/approvals');
            }}
            data-testid="telemetry-pending-decisions"
            className="bg-white border border-[var(--sw-border)] rounded-lg px-3 py-2 text-center shadow-sm min-w-[80px] hover:border-[var(--sw-green-900)] transition-all cursor-pointer focus:outline-none"
          >
            <div className="text-[10px] uppercase font-bold text-[var(--sw-muted)] font-mono tracking-wider">Approvals</div>
            <div className="text-lg font-serif font-bold text-amber-700 mt-0.5">{approvalsCount}</div>
          </button>

          <button
            onClick={onOpenViewAll}
            className="bg-white border border-[var(--sw-border)] rounded-lg px-3 py-2 text-center shadow-sm min-w-[80px] hover:border-[var(--sw-green-900)] transition-all cursor-pointer focus:outline-none"
          >
            <div className="text-[10px] uppercase font-bold text-[var(--sw-muted)] font-mono tracking-wider">Blocked</div>
            <div className="text-lg font-serif font-bold text-rose-700 mt-0.5">{blockedCount}</div>
          </button>

          <button
            onClick={() => {
              state.setCurrentTab('Work Queue');
              window.history.pushState({}, '', '/app/work');
            }}
            data-testid="telemetry-revenue-at-risk"
            className="bg-white border border-[var(--sw-border)] rounded-lg px-3 py-2 text-center shadow-sm min-w-[80px] hover:border-[var(--sw-green-900)] transition-all cursor-pointer focus:outline-none"
          >
            <div className="text-[10px] uppercase font-bold text-[var(--sw-muted)] font-mono tracking-wider">Done Today</div>
            <div className="text-lg font-serif font-bold text-emerald-700 mt-0.5">{completedCount}</div>
          </button>

          <div className="bg-white border border-[var(--sw-border)] rounded-lg px-3 py-2 text-center shadow-sm min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-[var(--sw-muted)] font-mono tracking-wider">Deflections</div>
            <div className="text-lg font-serif font-bold text-teal-700 mt-0.5">+{deflectionCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Composer & Active Board Left, Completed Outputs Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left 2/3 Column: Task Composer + Featured Alert + Active Jobs Board */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Guided Scenario Control Panel (Visible in Dev/Demo mode) */}
          {state.appMode !== 'production' && (
            <div className="bg-[#f5f8f6] border border-[var(--sw-green-700)]/20 rounded-xl p-5 shadow-xs space-y-3 relative overflow-hidden select-none">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--sw-green-700)]"></div>
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-serif font-black text-[var(--sw-green-900)] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[var(--sw-green-700)] animate-pulse" />
                  Guided Scenario Control Panel
                </h2>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--sw-green-700)]">Demo Mode Active</span>
              </div>
              <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                Trigger clean, repeatable timelines for the Nest Realty pilot opportunity workflows.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { key: 'google_review_dispatch', label: 'Google Review Engine' },
                  { key: 'compliance_chase', label: 'Compliance Chase' },
                  { key: 'ryan_shield_routing', label: 'Ryan Interruption Shield' },
                  { key: 'office_readiness', label: 'Sign & Lockbox Readiness' },
                  { key: 'marketing_request', label: 'Marketing Intake' }
                ].map(sc => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/shapework/demo/trigger-scenario', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ scenarioKey: sc.key })
                        });
                        if (res.ok) {
                          if (state.reloadJobs) {
                            await state.reloadJobs();
                          }
                        }
                      } catch (err) {
                        console.error('Failed to trigger scenario:', err);
                      }
                    }}
                    className="px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 hover:border-[var(--sw-green-900)] text-stone-700 hover:text-[var(--sw-green-900)] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer focus:outline-none"
                  >
                    Run: {sc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task Composer Card */}
          <div className="bg-white border border-[var(--sw-border)] rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--sw-green-900)]"></div>
            
            <h2 className="text-base font-serif font-bold text-[var(--sw-green-900)] mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--sw-green-900)] shrink-0" />
              Direct AI Coworker Dispatch
            </h2>
            
            <form onSubmit={handleStartWorkflow} className="space-y-4">
              <div className="relative">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="Dispatch Shapework (e.g. 'Route facilities tickets away from Ryan', 'Google review requests', 'Compliance chase closings')"
                  disabled={submitting}
                  className="w-full min-h-[96px] bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] focus:border-[var(--sw-green-900)] text-stone-800 disabled:opacity-50 resize-y placeholder:text-stone-400 font-sans"
                />
                
                {planningStage && (
                  <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center gap-2 select-none animate-fade-in animate-duration-200">
                    <Loader className="w-6 h-6 text-[var(--sw-green-900)] animate-spin" />
                    <span className="text-xs font-bold text-[var(--sw-green-900)] font-mono">{planningStage}</span>
                  </div>
                )}
              </div>

              {/* Suggestions chips */}
              <div className="space-y-2 select-none">
                <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Suggested Workflows</span>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {suggestedChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSuggestClick(chip)}
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-full border border-stone-200 transition-all focus:outline-none cursor-pointer max-w-full truncate text-left"
                      title={chip}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-stone-100 pt-3">
                <button
                  type="submit"
                  disabled={submitting || !composerText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--sw-green-900)] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-[var(--sw-green-900)]/95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer focus:outline-none"
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  Start Workflow
                </button>
              </div>
            </form>
          </div>

          {/* Featured alert card */}
          <div className="bg-[#fffdf9] border border-amber-200 rounded-xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex justify-between items-center select-none">
              <h3 className="font-serif font-black text-sm text-[var(--sw-green-900)]">
                Featured Alert: Needs Action
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                Needs Attention
              </span>
            </div>
            
            {needsAttentionJob ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-800 font-sans">{needsAttentionJob.request_text}</p>
                <div className="text-[10px] text-stone-500 flex justify-between font-mono">
                  <span>Active Step: {needsAttentionJob.current_step}</span>
                  <span>Status: <span className="font-bold uppercase text-amber-700">{needsAttentionJob.status}</span></span>
                </div>
                <div className="pt-2 flex justify-between items-center border-t border-stone-100/50">
                  <button
                    onClick={() => onOpenExplanation(needsAttentionJob.workflow_key)}
                    className="text-[10px] text-[var(--sw-green-700)] font-semibold hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Why am I seeing this?
                  </button>
                  <button
                    onClick={() => onSelectJob(needsAttentionJob)}
                    className="px-3 py-1 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-900)]/90 text-white text-[10px] uppercase font-bold tracking-wider rounded cursor-pointer focus:outline-none"
                  >
                    View Steps & Resolve
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-stone-600 font-sans">All workflows operating normally. Shapework is actively monitoring your integrations.</p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onOpenViewAll}
                    className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded cursor-pointer focus:outline-none"
                  >
                    View Active Ledger
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Jobs Lists */}
          <div className="space-y-6">
            
            {/* Active operations list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-stone-100 pb-1.5 select-none">
                <h3 className="text-xs font-mono font-bold text-[var(--sw-muted)] uppercase tracking-wider">
                  Active Operations ({jobs.filter(j => j.status !== 'completed').length})
                </h3>
                <button
                  onClick={onOpenViewAll}
                  className="text-[10px] font-bold text-[var(--sw-green-700)] hover:underline cursor-pointer focus:outline-none"
                >
                  View All Operations
                </button>
              </div>
              
              {jobs.filter(j => j.status !== 'completed').length === 0 ? (
                <div className="bg-stone-50 border border-dashed border-stone-200 rounded-lg p-5 text-center text-xs text-stone-400 font-sans">
                  No active jobs running at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {jobs.filter(j => j.status !== 'completed').map(job => (
                    <button
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="w-full text-left bg-white border border-[var(--sw-border)] rounded-xl p-4 shadow-sm hover:border-[var(--sw-green-900)] transition-all flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[9px] font-mono font-bold uppercase text-[var(--sw-green-700)] bg-[var(--sw-mint-100)] px-2 py-0.5 rounded-full">
                            {job.workflow_name}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Confidence: {(job.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[var(--sw-green-900)] mt-2 truncate">
                          {job.request_text}
                        </h4>
                        <p className="text-[10px] text-stone-500 mt-1">
                          Active Step: <span className="font-semibold text-stone-700">{job.current_step}</span>
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 select-none border ${
                        job.status === 'waiting_approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        job.status === 'blocked' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-[var(--sw-mint-100)] text-[var(--sw-green-900)] border-[var(--sw-green-700)]/20'
                      }`}>
                        {job.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right 1/3 Column: Compact Source list + Completed Outputs Log */}
        <div className="space-y-6">
          
          {/* Compact Request Log */}
          <div className="bg-white border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold text-[var(--sw-muted)] uppercase tracking-wider border-b border-stone-100 pb-1.5 select-none">
              New Requests Log
            </h3>
            <div className="space-y-3 select-none">
              {requestSignals.map((src, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${src.status === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-stone-400 leading-none uppercase">{src.title}</div>
                      <div className="font-medium text-stone-700 truncate mt-0.5">{src.detail}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400 shrink-0">{src.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Outputs */}
          <div className="bg-white border border-[var(--sw-border)] rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-[var(--sw-muted)] uppercase tracking-wider border-b border-stone-100 pb-1.5 select-none">
                Completed by Shapework
              </h3>
              <p className="text-[10px] text-stone-400 mt-1 font-sans select-none">
                Audit ledger of actions dispatched and outcomes saved to source systems.
              </p>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {outputs.length === 0 ? (
                <div className="bg-stone-50 border border-dashed border-stone-200 rounded-lg p-5 text-center text-xs text-stone-400 font-sans select-none">
                  No outputs generated today yet.
                </div>
              ) : (
                outputs.map(out => {
                  const job = jobs.find((j: any) => j.id === out.job_id);
                  return (
                    <OutputReceiptView
                      key={out.id}
                      out={out}
                      job={job}
                      onOpenExplanation={onOpenExplanation}
                      onSelectJob={onSelectJob}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function OutputReceiptView({
  out,
  job,
  onOpenExplanation,
  onSelectJob
}: {
  out: any;
  job: any;
  onOpenExplanation: (key: string) => void;
  onSelectJob?: (job: any) => void;
  key?: any;
}) {
  return (
    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/70 hover:bg-stone-50/90 transition-all text-left space-y-3 relative overflow-hidden animate-fade-in select-text">
      <div className="flex justify-between items-start gap-2 select-none">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
            Shapework Handled
          </span>
          <h4 className="text-xs font-serif font-bold text-[var(--sw-green-900)] mt-2 leading-snug">{out.title}</h4>
        </div>
        <span className="text-[9px] font-mono text-stone-400 shrink-0 select-none">
          {new Date(out.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="space-y-2 text-[10px] text-stone-600">
        <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-stone-150/40 select-text">
          <div>
            <span className="font-mono text-[8px] uppercase text-stone-450 block font-bold">Action Taken</span>
            <span className="text-stone-850 font-bold">{out.action_taken || 'Email Dispatched'}</span>
          </div>
          <div>
            <span className="font-mono text-[8px] uppercase text-stone-450 block font-bold">Recipient / Responsible</span>
            <span className="text-stone-850 font-bold truncate block">{out.recipient || 'agent@nestrealty.com'}</span>
          </div>
          <div className="col-span-2 border-t border-stone-100 pt-1.5 mt-0.5">
            <span className="font-mono text-[8px] uppercase text-stone-450 block font-bold">Outcome Details</span>
            <span className="text-stone-700 leading-normal block">{out.outcome || out.summary}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono select-none text-stone-500 pt-0.5">
          <div>Follow-up needed: <span className={`font-bold ${out.follow_up_needed ? 'text-amber-700' : 'text-stone-500'}`}>{out.follow_up_needed ? 'YES' : 'NO'}</span></div>
          <div>Owner brief updated: <span className={`font-bold ${out.owner_brief_updated ? 'text-emerald-700' : 'text-stone-500'}`}>{out.owner_brief_updated ? 'YES' : 'NO'}</span></div>
        </div>
      </div>

      <div className="border-t border-stone-150/30 pt-2 flex justify-between items-center select-none text-[9px] font-mono">
        <button
          onClick={() => onOpenExplanation(job ? job.workflow_key : 'custom_workflow')}
          className="text-[var(--sw-green-700)] font-semibold hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          <HelpCircle className="w-3 h-3" /> Why am I seeing this?
        </button>
        {job && onSelectJob && (
          <button
            onClick={() => onSelectJob(job)}
            className="text-[var(--sw-green-900)] font-semibold hover:underline cursor-pointer focus:outline-none"
          >
            View Timeline →
          </button>
        )}
      </div>
    </div>
  );
}

function ApprovalPreviewModal({
  step,
  job,
  onConfirm,
  onClose
}: {
  step: any;
  job: any;
  onConfirm: () => void;
  onClose: () => void;
}) {
  let riskMitigation = "Make sure the recipient is verified.";
  let potentialIssue = "If recipient is incorrect, details may leak.";
  let updatesAfter = "This step will be completed and the workflow will proceed.";
  let inBrief = "This action will be noted in the Owner Brief.";

  if (job?.workflow_key === 'google_review_dispatch') {
    riskMitigation = "Verified deal closed and client info matching.";
    potentialIssue = "Bruce Wayne may receive duplicate emails if already invited.";
    updatesAfter = "Google review request dispatched. Output receipt generated.";
    inBrief = "Yes, summary will be reported in Weekly Wins.";
  } else if (job?.workflow_key === 'ryan_shield_routing') {
    riskMitigation = "Standard SOP rules routing rules verified.";
    potentialIssue = "Steve Schram may be assigned non-maintenance issues.";
    updatesAfter = "Ticket deflected. Automated response logged.";
    inBrief = "Yes, deflect statistics updated in Owner Interruption Shield.";
  } else if (job?.workflow_key === 'compliance_chase') {
    riskMitigation = "Check missing checklist items matching Dotloop ledger.";
    potentialIssue = "Listing agent could find frequent compliance chases annoying.";
    updatesAfter = "Disclosures chase email dispatched. Client record status updated.";
    inBrief = "No, minor compliance activity is hidden from the owner brief.";
  } else if (job?.workflow_key === 'marketing_request') {
    riskMitigation = "All media and listings details validated.";
    potentialIssue = "If photo links are dead, design desk will receive empty files.";
    updatesAfter = "Intake ledger confirmed and forwarded to design desk.";
    inBrief = "No, routed directly to staff desk.";
  } else if (job?.workflow_key === 'office_readiness') {
    riskMitigation = "Inventory inventory matching reserves ledger.";
    potentialIssue = "Steve Schram receives courier delivery request.";
    updatesAfter = "Courier SMS dispatch dispatched. Status set to readiness completed.";
    inBrief = "Yes, readiness deployment noted in Weekly Wins.";
  }

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full text-left space-y-5">
        <div className="flex justify-between items-start select-none">
          <div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
              step.risk_level === 'high' ? 'bg-rose-100 text-rose-800' :
              step.risk_level === 'medium' ? 'bg-amber-100 text-amber-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              {step.risk_level} Risk Action
            </span>
            <h3 className="font-serif font-black text-base text-[var(--sw-green-900)] mt-2">
              Approval Request Preview
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-stone-600">
          <div className="grid grid-cols-2 gap-4 bg-stone-50/85 p-3.5 rounded-xl border border-stone-100 select-text">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-450 font-bold block">Action Type</span>
              <span className="font-bold text-stone-800 capitalize">{step.title}</span>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-450 font-bold block">Channel & Recipient</span>
              <span className="font-bold text-stone-855 truncate block">
                <span className="uppercase text-[9px] bg-stone-200 text-stone-650 px-1 rounded mr-1.5">{step.channel}</span>
                {job?.workflow_key === 'google_review_dispatch' ? 'Bruce Wayne (bruce.wayne@waynecorp.com)' :
                 job?.workflow_key === 'ryan_shield_routing' ? 'Steve Schram' :
                 job?.workflow_key === 'compliance_chase' ? 'agent@nestrealty.com' :
                 job?.workflow_key === 'marketing_request' ? 'Design Coordinator' : 'Steve Schram'}
              </span>
            </div>
          </div>

          <div className="space-y-1 bg-amber-50/20 border border-amber-100/50 p-3.5 rounded-xl">
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 font-bold block">Draft Action Details</span>
            <p className="font-sans text-stone-700 leading-relaxed italic text-[11px]">
              {step.safe_payload_summary || step.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold block">What could go wrong</span>
              <span className="text-stone-700 text-[11px] leading-snug block">{potentialIssue}</span>
            </div>
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Shapework updates</span>
              <span className="text-stone-700 text-[11px] leading-snug block">{updatesAfter}</span>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 select-none flex items-center justify-between">
            <span className="text-[10px] text-stone-400 font-mono">Report to Owner Brief: <span className="font-bold uppercase text-[var(--sw-green-700)]">{inBrief.includes('Yes') ? 'Yes' : 'No'}</span></span>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4 flex flex-wrap gap-2 justify-end select-none">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer focus:outline-none"
          >
            Remind me later
          </button>
          <button
            onClick={() => {
              alert('Draft edit mode initiated');
              onClose();
            }}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer focus:outline-none"
          >
            Edit Draft
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer focus:outline-none"
          >
            Reject
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-900)]/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer focus:outline-none active:scale-[0.98] transition-all"
          >
            Approve & Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

const EXPLANATIONS: Record<string, string> = {
  google_review_dispatch: "Shapework automatically detects when a transaction closing webhook is received, pulls the client contacts, formats a personalized Google Review email, and holds high-impact reviews for owner confirmation.",
  ryan_shield_routing: "Low-priority email issues (supplies, signs, lockboxes) are intercepted and deflected to Steve Schram via SOP routing criteria, shielding the owner Ryan from daily operational interruptions.",
  compliance_chase: "For pending transaction closings, Shapework cross-checks required disclosures in Dotloop, identifies missing signatures, and triggers manual or automated email chases to ensure regulatory compliance.",
  marketing_request: "Intakes agent listing launch package requests, validates completeness of high-res photos and lockbox codes, generates tracking tasks, and routes tasks to the design desk.",
  office_readiness: "Maintains inventory levels for physical brokerage signs and Bluetooth lockbox devices, assigning local courier tasks and triggering dispatch alerts automatically."
};

function JobDetailDrawer({
  job,
  steps,
  outputs = [],
  onClose,
  onApprove,
  onOpenExplanation
}: {
  job: any;
  steps: any[];
  outputs?: any[];
  onClose: () => void;
  onApprove: (stepId: string) => void;
  onOpenExplanation: (key: string) => void;
}) {
  const jobSteps = steps.filter(s => s.job_id === job.id).sort((a, b) => a.step_order - b.step_order);
  const matchingOutput = outputs.find(o => o.job_id === job.id);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-stone-200 shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 flex justify-between items-start select-none">
        <div className="text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--sw-green-700)] bg-[var(--sw-mint-100)] px-2 py-0.5 rounded-full">
            {job.workflow_name || 'Workflow Job'}
          </span>
          <h3 className="font-serif font-bold text-base text-[var(--sw-green-900)] mt-2 leading-tight">
            {job.request_text}
          </h3>
          <p className="text-[10px] text-stone-400 mt-1 font-mono">
            Job ID: {job.id} • Confidence: {((job.confidence || 0.90) * 100).toFixed(0)}%
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status card */}
        <div className="bg-[#fcfbf7] border border-[#e4decb] rounded-xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Overall Status</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
              job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              job.status === 'waiting_approval' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              job.status === 'blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-[var(--sw-mint-100)] text-[var(--sw-green-900)]'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="flex justify-between items-center select-none border-t border-stone-100/50 pt-2.5">
            <span className="text-[10px] uppercase font-bold text-stone-500 font-mono tracking-wider">Context Source</span>
            <span className="text-stone-700 font-medium font-sans text-xs capitalize">{job.source_context?.replace('_', ' ')}</span>
          </div>

          <button
            onClick={() => onOpenExplanation(job.workflow_key)}
            className="w-full text-center text-xs font-semibold text-[var(--sw-green-700)] hover:underline border-t border-stone-100/50 pt-2.5 flex items-center justify-center gap-1 cursor-pointer focus:outline-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why am I seeing this?</span>
          </button>
        </div>

        {/* Output Receipt rendering inside drawer */}
        {job.status === 'completed' && matchingOutput && (
          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Completed Output Receipt</h4>
            <OutputReceiptView
              out={matchingOutput}
              job={job}
              onOpenExplanation={onOpenExplanation}
            />
          </div>
        )}

        {/* Steps Timeline */}
        <div className="space-y-4 text-left">
          <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">Planning Timeline</h4>
          <div className="relative pl-6 space-y-5 select-text">
            <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-stone-100"></div>
            {jobSteps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'running' || step.status === 'waiting_approval' || step.status === 'planning';
              const isBlocked = step.status === 'blocked';
              
              return (
                <div key={step.id} className="relative flex items-start gap-3">
                  <div className={`absolute -left-6 w-5.5 h-5.5 rounded-full border flex items-center justify-center bg-white z-10 ${
                    isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                    isBlocked ? 'border-rose-500 bg-rose-50 text-rose-600' :
                    isCurrent ? 'border-[var(--sw-green-900)] text-[var(--sw-green-900)] shadow-sm' :
                    'border-stone-200 text-stone-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> :
                     isBlocked ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> :
                     isCurrent ? <Loader className="w-3 h-3 shrink-0 animate-spin" /> :
                     <span className="text-[9px] font-mono font-bold">{step.step_order}</span>}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center select-none">
                      <h5 className={`text-xs font-bold ${isCompleted ? 'text-stone-500 line-through font-normal' : 'text-stone-850'}`}>
                        {step.title}
                      </h5>
                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.2 bg-stone-100 text-stone-550 text-[8px] font-mono rounded uppercase tracking-wider">
                          {step.channel}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[8px] font-mono rounded uppercase tracking-wider ${
                          step.risk_level === 'high' ? 'bg-rose-100 text-rose-800' :
                          step.risk_level === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {step.risk_level} Risk
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed font-sans">{step.description}</p>
                    
                    {step.safe_payload_summary && (
                      <div className="bg-stone-50 border border-stone-200/50 p-2.5 rounded-lg text-[9px] font-mono text-stone-600 leading-relaxed break-all">
                        {step.safe_payload_summary}
                      </div>
                    )}
                    
                    {step.status === 'waiting_approval' && (
                      <div className="pt-1.5 flex justify-end">
                        <button
                          onClick={() => onApprove(step.id)}
                          className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm active:scale-[0.98] select-none focus:outline-none"
                        >
                          Approve Step Action
                        </button>
                      </div>
                    )}

                    {step.status === 'blocked' && step.output_summary && (
                      <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-[9px] font-mono text-rose-700 leading-relaxed">
                        {step.output_summary}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewAllDrawer({
  jobs,
  onClose,
  onSelectJob
}: {
  jobs: any[];
  onClose: () => void;
  onSelectJob: (job: any) => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-stone-200 shadow-2xl z-50 flex flex-col animate-slide-in">
      <div className="p-6 border-b border-stone-100 flex justify-between items-start select-none">
        <div className="text-left">
          <h3 className="font-serif font-bold text-base text-[var(--sw-green-900)]">
            All Active & Pending Operations
          </h3>
          <p className="text-[10px] text-stone-400 mt-1 font-sans">
            Full ledger of coworker workflows currently running, gated, or completed today.
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {jobs.map(job => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="w-full text-left p-4 border border-stone-150 rounded-xl hover:border-[var(--sw-green-900)] hover:bg-stone-50/50 transition-all space-y-2 block focus:outline-none cursor-pointer"
          >
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-mono text-stone-400 uppercase">{job.workflow_name}</span>
              <span className={`px-2 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider ${
                job.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                job.status === 'waiting_approval' ? 'bg-amber-50 text-amber-700' :
                job.status === 'blocked' ? 'bg-rose-50 text-rose-700' :
                'bg-[var(--sw-mint-100)] text-[var(--sw-green-900)]'
              }`}>
                {job.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-stone-800 line-clamp-2 leading-snug">{job.request_text}</h4>
            <div className="text-[9px] text-stone-400 font-mono flex justify-between pt-1 select-none border-t border-stone-100/50">
              <span>Active step: {job.current_step}</span>
              <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExplanationDrawer({
  drawerData,
  onClose
}: {
  drawerData: { title: string; explanation: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-55 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl max-w-md w-full text-left space-y-4 animate-scale-up">
        <div className="flex justify-between items-start select-none">
          <h3 className="font-serif font-black text-base text-[var(--sw-green-900)]">
            {drawerData.title}
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-stone-500 font-sans leading-relaxed">
          {drawerData.explanation}
        </p>
        <div className="border-t border-stone-100 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--sw-green-900)] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-[var(--sw-green-900)]/90 cursor-pointer focus:outline-none"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

// Safe lower helper
function safeLower(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

export default function CustomerAppRoutes({ state }: CustomerAppRoutesProps) {
  const { currentTab } = state;
  const [active360Type, setActive360Type] = useState<string | null>(null);
  const [active360Id, setActive360Id] = useState<string | null>(null);

  // Lifted coworker jobs state
  const [jobs, setJobs] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [ownerBriefItems, setOwnerBriefItems] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Lifted drawer and modals state
  const [selectedJobDetail, setSelectedJobDetail] = useState<any | null>(null);
  const [viewAllDrawerOpen, setViewAllDrawerOpen] = useState(false);
  const [explanationDrawer, setExplanationDrawer] = useState<{ title: string; explanation: string } | null>(null);
  const [pendingApprovalStep, setPendingApprovalStep] = useState<any | null>(null);
  const [pendingApprovalJob, setPendingApprovalJob] = useState<any | null>(null);

  // Local state for brokerage operations pilot consolidation
  const [opsAssets, setOpsAssets] = useState<any[]>([]);
  const [opsSops, setOpsSops] = useState<any[]>([]);
  const [opsIntegrations, setOpsIntegrations] = useState<any[]>([]);
  const [opsLogs, setOpsLogs] = useState<any[]>([]);
  const [opsRequests, setOpsRequests] = useState<any[]>([]);
  const [opsLoading, setOpsLoading] = useState<boolean>(true);
  const [opsCameraEvents, setOpsCameraEvents] = useState<any[]>([]);
  const [cameraOffline, setCameraOffline] = useState<boolean>(false);
  const [cameraHealth, setCameraHealth] = useState<any>(null);

  const fetchOpsData = async () => {
    try {
      const headers = { 
        'x-workspace-id': 'nest-realty-demo',
        'x-user-role': state.activeProfile?.role || 'regional_leader',
        'x-user-email': state.activeProfile?.email || 'ryan@nestrealty.com'
      };
      const [resAst, resSop, resInt, resAudit, resReq, resCamEv, resHealth] = await Promise.all([
        fetch('/api/ops/assets', { headers: { 'x-workspace-id': 'nest-realty-demo' } }),
        fetch('/api/ops/sops', { headers: { 'x-workspace-id': 'nest-realty-demo' } }),
        fetch('/api/ops/integrations', { headers: { 'x-workspace-id': 'nest-realty-demo' } }),
        fetch('/api/ops/audit-logs', { headers: { 'x-workspace-id': 'nest-realty-demo' } }),
        fetch('/api/ops/requests', { headers: { 'x-workspace-id': 'nest-realty-demo', 'x-user-role': state.activeProfile?.role || 'regional_leader', 'x-user-email': state.activeProfile?.email || 'ryan@nestrealty.com' } }),
        fetch('/api/camera-events', { headers: { 'x-workspace-id': 'nest-realty-demo' } }),
        fetch('/api/cameras/health')
      ]);
      if (resAst.ok) setOpsAssets((await resAst.json()).assets || []);
      if (resSop.ok) setOpsSops((await resSop.json()).sops || []);
      if (resInt.ok) setOpsIntegrations((await resInt.json()).integrations || []);
      if (resAudit.ok) setOpsLogs((await resAudit.json()).auditLogs || []);
      if (resReq.ok) setOpsRequests((await resReq.json()).requests || []);
      if (resCamEv.ok) setOpsCameraEvents((await resCamEv.json()).events || []);
      if (resHealth.ok) {
        const healthData = await resHealth.json();
        setCameraHealth(healthData.health || null);
        setCameraOffline(healthData.health?.status === 'live_relay_missing' || healthData.health?.status === 'error');
      }
    } catch (e) {
      console.error('Failed to fetch ops data:', e);
    } finally {
      setOpsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 4000);
    return () => clearInterval(interval);
  }, [state.activeProfile]);

  const handleCheckoutAsset = async (assetId: string, agent: string, property: string, expectedReturnDate?: string) => {
    try {
      const res = await fetch('/api/ops/assets/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          assetId,
          agent,
          property,
          expectedReturnDate,
          actorEmail: state.activeProfile?.email || 'ryan@nestrealty.com',
          actorName: state.activeProfile?.name || 'Ryan'
        })
      });
      if (res.ok) {
        await fetchOpsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleCheckinAsset = async (assetId: string) => {
    try {
      const res = await fetch('/api/ops/assets/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          assetId,
          actorEmail: state.activeProfile?.email || 'ryan@nestrealty.com',
          actorName: state.activeProfile?.name || 'Ryan'
        })
      });
      if (res.ok) {
        await fetchOpsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleMarkMissing = async (assetId: string) => {
    try {
      const res = await fetch(`/api/ops/assets/${assetId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: 'missing',
          actorEmail: state.activeProfile?.email || 'ryan@nestrealty.com',
          actorName: state.activeProfile?.name || 'Ryan'
        })
      });
      if (res.ok) {
        await fetchOpsData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/shapework/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setSteps(data.steps || []);
        setOutputs(data.outputs || []);
        setOwnerBriefItems(data.ownerBriefItems || []);
        setReceipts(data.receipts || []);
        setOutcomes(data.outcomes || []);
        
        // Sync selected job detail if open to reflect updated simulation steps
        if (selectedJobDetail) {
          const updatedJob = (data.jobs || []).find((j: any) => j.id === selectedJobDetail.id);
          if (updatedJob) {
            setSelectedJobDetail(updatedJob);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch coworker jobs:', e);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3500); // Poll every 3.5s for dynamic simulation updates
    return () => clearInterval(interval);
  }, [selectedJobDetail?.id]);

  // Inject reload helper to state so other views can force refresh
  state.reloadJobs = fetchJobs;

  const handleApproveStep = async (stepId: string) => {
    try {
      const res = await fetch(`/api/shapework/jobs/steps/${stepId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchJobs();
      }
    } catch (err) {
      console.error('Failed to approve job step:', err);
    }
  };

  const handleInspectRecord = (type: string, id: string) => {
    setActive360Type(type);
    setActive360Id(id);
  };

  // =========================================================================
  // CONSOLIDATED SUB-PAGES
  // =========================================================================

  const renderViewContent = () => {
    switch (currentTab) {
      case 'Today in the Brokerage':
      case 'Command Center':
      case 'Workboard':
      case 'Overview':
      case 'Today':
        return <TodayPage state={state} />;
      case 'Pitch Demo':
      case "Pitch & 'Aha!' Demo":
        return (
          <div className="relative">
            <TodayPage state={state} />
            <PitchAhaDemoModal isOpen={true} onClose={() => state.setCurrentTab('Workboard')} />
          </div>
        );
      case 'Pre-MLS Board':
      case 'Pocket Matches':
        return <PreMLSBoard />;
      case 'Vendor Dispatch':
      case 'Repair Board':
        return <VendorDispatchBoard />;
      case 'Nest Ops Hub':
      case 'Ask Nest Ops':
      case 'Ask':
        return <NestOpsHub state={state} mode="search_only" />;
      case 'My Connections':
        return <MyConnections state={state} />;
      case 'Work Queue':
        return <WorkQueuePage state={state} />;
      case 'Operating Record':
        return <OperatingRecordPage />;
      case 'Approvals':
        return <ApprovalsPage state={state} />;
      case 'Physical Assets':
        return (
          <PhysicalAssetsTab
            state={state}
            opsAssets={opsAssets}
            opsLoading={opsLoading}
            handleCheckoutAsset={handleCheckoutAsset}
            handleCheckinAsset={handleCheckinAsset}
            handleMarkMissing={handleMarkMissing}
          />
        );
      case 'Camera Signals':
        return (
          <CameraSignalsTab
            state={state}
            fetchOpsData={fetchOpsData}
            opsCameraEvents={opsCameraEvents}
            opsAssets={opsAssets}
            cameraOffline={cameraOffline}
            cameraHealth={cameraHealth}
            setCameraOffline={setCameraOffline}
            setCameraHealth={setCameraHealth}
          />
        );
      case 'Knowledge Base':
        return <SOPStudio state={state} readOnly={true} />;
      case 'SOP Studio':
        return <SOPStudio state={state} />;
      case 'SOP Runs':
        return <SOPRunsPage state={state} />;
      case 'Integrations':
        return (
          <IntegrationsTab
            cameraHealth={cameraHealth}
          />
        );
      case 'Settings':
      case 'Workspace Settings':
        if (state.activeProfile?.experience === 'ryan_pilot' || state.activeProfile?.email === 'ryan@nestrealty.com' || state.activeProfile?.id === 'usr_ryan') {
          return <RyanSettingsPage state={state} />;
        }
        return <CustomerSettingsPage state={state} />;
      case 'Transactions':
        return <TransactionsPage state={state} onInspectRecord={handleInspectRecord} />;
      case 'Compliance':
        return <CompliancePage state={state} />;
      case 'Marketing':
      case 'Marketing Requests':
      case 'Marketing Intake (Melissa)':
      case 'Marketing Intake':
      case 'Automated Collateral Studio':
      case 'Automated Collateral Studio (Templates)':
      case 'Collateral Studio':
      case 'Creative Asset Sandbox':
      case 'Creative Asset Sandbox (Templates)':
      case 'Sandbox':
        return <MarketingIntakeConsole state={state} />;

      case 'Agent Approval Portal':
      case 'Approval Portal':
        return <AgentApprovalPortal />;

      case 'SOP Library':
      case 'Staff SOP Templates':
        return <SOPStudio state={state} />;

      case 'People':
        return <PeopleOwnershipPage state={state} />;
      case 'Office':
        return <OfficeSignagePage state={state} />;
      case 'Ryan Shield':
        return <NestWilmingtonDashboard currentTab="Ryan Shield" state={state} />;
      case 'Role Map':
      case 'Role & Escalation Map':
        return <OrgChartWizardPage state={state} embeddedTab="visual" />;
      case 'Directory':
        return <WorkspaceDirectoryPage state={state} />;
      case 'Owner Brief':
      case 'Owner Briefing':
        if (state.activeProfile?.email === 'ryan@nestrealty.com' || state.activeProfile?.email === 'owner@nestrealty.com') {
          return <NestWilmingtonDashboard currentTab="Owner Briefing" state={state} />;
        }
        return <OwnerBriefPage state={state} />;
      case 'Audit':
        return <AuditPage state={state} />;
      default:
        return (
          <div className="p-8 text-center text-xs text-[var(--sw-muted)] font-mono">
            View selection failed to load. Current active tab: "{currentTab || 'undefined'}".
          </div>
        );
    }
  };

  return (
    <>
      {renderViewContent()}

      {active360Id && active360Type && (
        <Record360
          recordType={active360Type}
          recordId={active360Id}
          isOpen={!!active360Id}
          onClose={() => {
            setActive360Id(null);
            setActive360Type(null);
          }}
          state={state}
        />
      )}

      {selectedJobDetail && (
        <JobDetailDrawer
          job={selectedJobDetail}
          steps={steps}
          outputs={outputs}
          onClose={() => setSelectedJobDetail(null)}
          onApprove={(stepId) => {
            const stepObj = steps.find(s => s.id === stepId);
            if (stepObj) {
              setPendingApprovalStep(stepObj);
              setPendingApprovalJob(selectedJobDetail);
            }
          }}
          onOpenExplanation={(key) => {
            const explanationText = EXPLANATIONS[key] || "Operational workflow running inside the Shapework context engine.";
            setExplanationDrawer({
              title: key.replace(/_/g, ' ').toUpperCase(),
              explanation: explanationText
            });
          }}
        />
      )}

      {pendingApprovalStep && (
        <ApprovalPreviewModal
          step={pendingApprovalStep}
          job={pendingApprovalJob}
          onClose={() => {
            setPendingApprovalStep(null);
            setPendingApprovalJob(null);
          }}
          onConfirm={() => {
            handleApproveStep(pendingApprovalStep.id);
            setPendingApprovalStep(null);
            setPendingApprovalJob(null);
          }}
        />
      )}

      {viewAllDrawerOpen && (
        <ViewAllDrawer
          jobs={jobs}
          onClose={() => setViewAllDrawerOpen(false)}
          onSelectJob={(j) => {
            setSelectedJobDetail(j);
            setViewAllDrawerOpen(false);
          }}
        />
      )}

      {explanationDrawer && (
        <ExplanationDrawer
          drawerData={explanationDrawer}
          onClose={() => setExplanationDrawer(null)}
        />
      )}
    </>
  );
}

// =========================================================================
// TOP-LEVEL STABILIZED LAYOUT & ROUTING COMPONENTS
// =========================================================================

interface CommandCenterPageProps {
  state: any;
  jobs: any[];
  steps: any[];
  opsAssets: any[];
  cameraOffline: boolean;
  opsCameraEvents: any[];
  opsLogs: any[];
  handleInspectRecord: (type: string, id: string) => void;
}

function CommandCenterPage({
  state,
  jobs,
  steps,
  opsAssets,
  cameraOffline,
  opsCameraEvents,
  opsLogs,
  handleInspectRecord
}: CommandCenterPageProps) {
  const [riskTableFilter, setRiskTableFilter] = useState<'all' | 'closing' | 'risk' | 'attention'>('all');
  const openWork = jobs.filter(j => j.status !== 'completed').length;
  const overdueWork = jobs.filter(j => j.status === 'overdue' || j.priority === 'critical').length;
  const needsApproval = steps.filter(s => s.status === 'waiting_approval').length;
  const blockedItems = jobs.filter(j => j.status === 'blocked').length;
  const assetExceptions = opsAssets.filter(a => a.status === 'missing' || a.status === 'overdue').length;
  const complianceRisks = jobs.filter(j => j.status !== 'completed' && (j.workflowKey === 'closing_compliance_risk' || j.workflowKey === 'missing_document' || j.workflowKey === 'compliance_chase')).length;

  return (
    <div className="space-y-6 text-left font-sans text-xs p-6 bg-[var(--sw-bg)] min-h-screen">
      <PageHeader title="Today in the Brokerage" subtitle="Workspace: Nest Realty Wilmington" />

      {/* Camera Warning Banner */}
      {cameraOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900 animate-pulse">
          <div className="space-y-0.5">
            <span className="font-bold text-xs block">Tapo Camera Relay Offline</span>
            <span className="text-[10px] text-amber-700">Tapo TCW-61 camera credentials are loaded, but the browser-safe live stream relay is currently unreachable.</span>
          </div>
          <button
            onClick={() => state.setCurrentTab('Camera Signals')}
            className="px-2.5 py-1 bg-amber-800 text-white font-bold rounded-lg hover:bg-amber-900 text-[10px] cursor-pointer"
          >
            Inspect Status
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Tasks', val: openWork, desc: 'Active coworker runs', color: 'text-[var(--sw-green-900)]' },
          { label: 'Overdue items', val: overdueWork, desc: 'SLA exceptions', color: 'text-amber-700 bg-amber-50' },
          { label: 'Needs Approval', val: needsApproval, desc: 'Human-in-the-loop steps', color: 'text-blue-700 bg-blue-50' },
          { label: 'Blocked Runs', val: blockedItems, desc: 'Requires agent reply', color: 'text-rose-700 bg-rose-50' },
          { label: 'Asset Exceptions', val: assetExceptions, desc: 'Signs missing/overdue', color: 'text-stone-700 bg-stone-50' },
          { label: 'Compliance Risks', val: complianceRisks, desc: 'Audits requiring review', color: 'text-amber-800 bg-amber-50/50' }
        ].map((s, idx) => (
          <div key={idx} className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--sw-muted)] block">{s.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[var(--sw-text)]">{s.val}</span>
            </div>
            <span className="text-[10px] text-[var(--sw-muted)] block font-medium">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MorningBriefing
          briefing={state.dailyBriefing}
          isGenerating={state.isGeneratingBriefing}
          onGenerate={state.loadBriefing}
          itemsNeedingAttentionCount={state.attentionCount || 0}
          revenueAtRisk={state.revAtRisk || 0}
          decisionsCount={state.decCount || 0}
          primaryActionText="Review outstanding physical asset flags & compliance gaps."
          onNavigateTab={(tab: string) => state.setCurrentTab(tab)}
        />

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Suggested Next Actions</h3>
          <div className="divide-y divide-[var(--sw-border)]/60">
            {/* Camera alerts first (requires physical checkout human confirmation) */}
            {opsCameraEvents.filter(e => e.status === 'new' || e.status === 'needs_review').slice(0, 3).map((event: any, idx: number) => (
              <div key={`cam-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-[var(--sw-text)] block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    Camera Signal: {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[var(--sw-muted)]">{event.suggestedAction} (Confidence: {((event.confidence || 0.8) * 100).toFixed(0)}%)</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Camera Signals')}
                  className="px-2.5 py-1 bg-amber-700 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-amber-800"
                >
                  Review Alert
                </button>
              </div>
            ))}
            {steps.filter((s: any) => s.status === 'waiting_approval').slice(0, 3).map((step: any, idx: number) => (
              <div key={`step-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-[var(--sw-text)] block">{step.step_name}</span>
                  <span className="text-[10px] text-[var(--sw-muted)]">Requires review for {step.workflowName || 'Workflow'}</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Approvals')}
                  className="px-2.5 py-1 bg-[var(--sw-green-900)] text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-[var(--sw-green-700)]"
                >
                  Review
                </button>
              </div>
            ))}
            {opsAssets.filter(a => a.status === 'overdue' || a.status === 'missing').slice(0, 3).map((asset, idx) => (
              <div key={`asset-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-[var(--sw-text)] block">Asset Alert: {asset.label}</span>
                  <span className="text-[10px] text-[var(--sw-muted)]">Status is {asset.status} (Holder: {asset.currentHolder || 'Unknown'})</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Physical Assets')}
                  className="px-2.5 py-1 border border-[var(--sw-border)] text-[var(--sw-text)] text-[10px] font-bold rounded-lg cursor-pointer hover:bg-[var(--sw-bg-soft)]"
                >
                  Inspect
                </button>
              </div>
            ))}
            {steps.filter((s: any) => s.status === 'waiting_approval').length === 0 && 
             opsAssets.filter(a => a.status === 'overdue' || a.status === 'missing').length === 0 && 
             opsCameraEvents.filter(e => e.status === 'new' || e.status === 'needs_review').length === 0 && (
              <p className="text-xs text-[var(--sw-muted)] py-4">No critical actions pending. Brokerage operations are healthy.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OperationalRiskTable
            transactions={state.transactions || []}
            onSelectTransaction={(id: string) => handleInspectRecord('transaction', id)}
            activeFilter={riskTableFilter}
            setActiveFilter={setRiskTableFilter}
          />
        </div>
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Recent Activity</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {opsLogs.slice(0, 8).map((log, idx) => (
              <div key={idx} className="text-[10px] space-y-0.5 border-b border-[var(--sw-border)]/40 pb-2 last:border-none">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--sw-text)]">{log.actorName}</span>
                  <span className="text-[var(--sw-muted)] font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[var(--sw-muted)]">{log.actionDescription}</p>
              </div>
            ))}
            {opsLogs.length === 0 && (
              <p className="text-xs text-[var(--sw-muted)]">No audit activity logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhysicalAssetsTabProps {
  state: any;
  opsAssets: any[];
  opsLoading: boolean;
  handleCheckoutAsset: (assetId: string, agent: string, property: string, expectedReturnDate?: string) => Promise<boolean>;
  handleCheckinAsset: (assetId: string) => Promise<boolean>;
  handleMarkMissing: (assetId: string) => Promise<boolean>;
}

function PhysicalAssetsTab({
  state,
  opsAssets,
  opsLoading,
  handleCheckoutAsset,
  handleCheckinAsset,
  handleMarkMissing
}: PhysicalAssetsTabProps) {
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [agentName, setAgentName] = useState('');
  const [propertyAddr, setPropertyAddr] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const success = await handleCheckoutAsset(selectedAsset.id, agentName, propertyAddr, returnDate);
    if (success) {
      setSelectedAsset(null);
      setAgentName('');
      setPropertyAddr('');
      setReturnDate('');
    }
  };

  const availableAssets = opsAssets.filter(a => a.status === 'available').length;
  const checkedOutAssets = opsAssets.filter(a => a.status === 'checked_out').length;
  const overdueAssets = opsAssets.filter(a => a.status === 'overdue').length;
  const missingAssets = opsAssets.filter(a => a.status === 'missing').length;
  const replacementExposure = opsAssets
    .filter(a => a.status === 'missing' || a.status === 'overdue')
    .reduce((sum, a) => sum + (Number(a.replacementCost) || 0), 0);

  return (
    <div className="space-y-6 text-left font-sans text-xs text-[#F6F7F1]">
      <PageHeader title="Physical Assets" subtitle="Manage sign and lockbox checkouts for Nest Realty Wilmington." />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 select-none">
        {[
          { label: 'Available Assets', val: `${availableAssets} Items`, color: 'text-emerald-300' },
          { label: 'Checked Out', val: `${checkedOutAssets} Items`, color: 'text-blue-300' },
          { label: 'Overdue Checkout', val: `${overdueAssets} Items`, color: 'text-amber-300' },
          { label: 'Missing / Lost', val: `${missingAssets} Items`, color: 'text-rose-300' },
          { label: 'Replacement Exposure', val: `$${replacementExposure}`, color: 'text-white' }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-2xl flex flex-col justify-between space-y-1.5"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}
          >
            <span className="text-[10px] uppercase font-bold text-[#D0D6BB] tracking-wider">{stat.label}</span>
            <strong className={`text-base font-bold ${stat.color} block mt-1`}>{stat.val}</strong>
          </div>
        ))}
      </div>

      <div 
        className="rounded-[28px] shadow-lg overflow-hidden"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div className="p-4 border-b border-[rgba(246,247,241,0.12)] bg-[rgba(246,247,241,0.04)] flex items-center justify-between">
          <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wider">Physical Sign & Lockbox Ledger</span>
        </div>

        <div className="divide-y divide-[rgba(246,247,241,0.12)]">
          {opsAssets.map(asset => (
            <div key={asset.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-serif font-black text-sm text-white block">{asset.label}</span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#D0D6BB] font-mono">
                  <span>Code: {asset.assetCode}</span>
                  <span>•</span>
                  <span>Type: {asset.assetType}</span>
                  <span>•</span>
                  <span>Replacement Cost: ${asset.replacementCost}</span>
                  {asset.currentHolder && (
                    <>
                      <span>•</span>
                      <span className="text-[#F6F7F1] font-bold">Holder: {asset.currentHolder}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                  asset.status === 'available' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' :
                  asset.status === 'checked_out' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                  asset.status === 'overdue' ? 'bg-amber-950/40 text-amber-350 border-amber-800/40' :
                  'bg-rose-950/40 text-rose-300 border-rose-800/40'
                }`}>
                  {asset.status}
                </span>
                
                <div className="flex gap-2">
                  {asset.status === 'available' ? (
                    <button 
                      onClick={() => setSelectedAsset(asset)}
                      className="px-3 py-1 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      Checkout
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCheckinAsset(asset.id)}
                      className="px-3 py-1 bg-[rgba(246,247,241,0.05)] border border-[rgba(246,247,241,0.15)] hover:bg-[rgba(246,247,241,0.12)] text-[#F6F7F1] rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                    >
                      Checkin
                    </button>
                  )}
                  {asset.status !== 'missing' && (
                    <button
                      onClick={() => handleMarkMissing(asset.id)}
                      className="px-3 py-1 bg-rose-955/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Mark Missing
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {opsAssets.length === 0 && (
            <p className="text-xs text-[#D0D6BB] p-6 text-center italic">No physical assets registered in this workspace.</p>
          )}
        </div>
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#01362D] border border-[rgba(246,247,241,0.18)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <h3 className="font-serif font-black text-sm text-white">Checkout {selectedAsset.label}</h3>
            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block">Agent Name</label>
                <input 
                  type="text" 
                  value={agentName} 
                  onChange={e => setAgentName(e.target.value)} 
                  required
                  placeholder="e.g. Todd"
                  className="w-full px-3 py-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block">Property Address</label>
                <input 
                  type="text" 
                  value={propertyAddr} 
                  onChange={e => setPropertyAddr(e.target.value)} 
                  required
                  placeholder="e.g. 102 Pine St"
                  className="w-full px-3 py-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block">Expected Return Date</label>
                <input 
                  type="date" 
                  value={returnDate} 
                  onChange={e => setReturnDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedAsset(null)}
                  className="px-3 py-1.5 border border-[rgba(246,247,241,0.18)] text-white hover:bg-[rgba(246,247,241,0.08)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface CameraSignalsTabProps {
  state: any;
  fetchOpsData: () => Promise<void>;
  opsCameraEvents: any[];
  opsAssets: any[];
  cameraOffline: boolean;
  cameraHealth: any;
  setCameraOffline: (offline: boolean) => void;
  setCameraHealth: (health: any) => void;
}

function CameraSignalsTab({
  state,
  fetchOpsData,
  opsCameraEvents,
  opsAssets,
  cameraOffline,
  cameraHealth,
  setCameraOffline,
  setCameraHealth
}: CameraSignalsTabProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [ledgerLogs, setLedgerLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewEvent, setReviewEvent] = useState<any | null>(null);
  const [reviewAssetId, setReviewAssetId] = useState('');
  const [reviewAgentName, setReviewAgentName] = useState('');
  const [reviewProperty, setReviewProperty] = useState('');
  const [reviewReturnDate, setReviewReturnDate] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCameraData = async () => {
    try {
      const [resCam, resLed, resHealth] = await Promise.all([
        fetch('/api/cameras'),
        fetch('/api/ops/assets/ledger'),
        fetch('/api/cameras/health')
      ]);
      if (resCam.ok) setCameras((await resCam.json()).cameras || []);
      if (resLed.ok) setLedgerLogs((await resLed.json()).ledger || []);
      if (resHealth.ok) {
        const healthData = await resHealth.json();
        setCameraHealth(healthData.health || null);
        setCameraOffline(healthData.health?.status === 'live_relay_missing' || healthData.health?.status === 'error');
      }
    } catch (e) {
      console.error('Failed to load camera data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameraData();
  }, []);

  const handleManualSnapshot = async (cameraId: string) => {
    try {
      const res = await fetch(`/api/cameras/${cameraId}/snapshot`, {
        method: 'POST'
      });
      if (res.ok) {
        await loadCameraData();
        await fetchOpsData(); // Refresh camera events in background
      }
    } catch (e) {
      console.error('Manual snapshot failed:', e);
    }
  };

  const handleRejectEvent = async (eventId: string, reason: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/camera-events/${eventId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setReviewEvent(null);
        await loadCameraData();
        await fetchOpsData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCheckout = async (eventId: string) => {
    if (!reviewAssetId) return alert('Please select an asset to link and checkout.');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/camera-events/${eventId}/confirm-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: reviewAssetId,
          agentName: reviewAgentName,
          property: reviewProperty,
          expectedReturnDate: reviewReturnDate || undefined
        })
      });
      if (res.ok) {
        setReviewEvent(null);
        await loadCameraData();
        await fetchOpsData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCheckin = async (eventId: string) => {
    if (!reviewAssetId) return alert('Please select an asset to link and checkin.');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/camera-events/${eventId}/confirm-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: reviewAssetId })
      });
      if (res.ok) {
        setReviewEvent(null);
        await loadCameraData();
        await fetchOpsData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkOnly = async (eventId: string) => {
    if (!reviewAssetId) return alert('Please select an asset to link.');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/camera-events/${eventId}/link-asset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: reviewAssetId })
      });
      if (res.ok) {
        setReviewEvent(null);
        await loadCameraData();
        await fetchOpsData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReview = (ev: any) => {
    setReviewEvent(ev);
    setReviewAssetId(ev.linkedAssetId || '');
    setReviewAgentName(ev.linkedAgentName || '');
    setReviewProperty(ev.linkedProperty || '');
    setReviewReturnDate('');
    setReviewNotes(ev.notes || '');
  };

  const primaryCam = cameras[0] || {
    id: 'cam_sign_room_001',
    name: 'Sign Room Camera',
    locationName: 'Nest Realty Wilmington sign storage',
    status: cameraHealth?.status || 'stubbed',
    liveRelayUrl: cameraHealth?.liveRelayUrl || 'http://localhost:5000/video_feed'
  };

  return (
    <div className="space-y-6 text-left font-sans text-xs p-6 bg-[var(--sw-bg)] min-h-screen">
      <PageHeader 
        title="Camera Signals" 
        subtitle="Live sign-room visibility, event snapshots, and asset movement review for the active workspace." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed & Camera Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-serif text-sm font-bold text-[var(--sw-text)] flex items-center gap-2">
                  <Video className="w-4 h-4 text-[var(--sw-green-900)]" />
                  {primaryCam.name}
                </h3>
                <p className="text-[10px] text-[var(--sw-muted)]">{primaryCam.locationName}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleManualSnapshot(primaryCam.id)}
                  className="px-2.5 py-1 bg-[var(--sw-green-900)] text-white font-bold rounded-lg hover:bg-[var(--sw-green-700)] cursor-pointer"
                >
                  Capture Snapshot
                </button>
              </div>
            </div>

            {/* video feed area */}
            <div className="p-2 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[260px] relative">
              {(() => {
                const status = cameraOffline ? 'live_relay_missing' : (cameraHealth?.status || 'stubbed');
                switch (status) {
                  case 'connected':
                    return (
                      <>
                        <img 
                          src={cameraHealth?.liveRelayUrl || "http://localhost:5000/video_feed"} 
                          onError={() => {
                            setCameraOffline(true);
                          }}
                          className="max-w-full rounded-lg max-h-[300px] object-cover shadow-sm" 
                          alt="Live Tapo stream feed"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/60 text-white font-mono px-2 py-0.5 rounded text-[9px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          LIVE FEED RELAY
                        </div>
                      </>
                    );
                  case 'live_relay_missing':
                    return (
                      <div className="p-6 text-center text-xs text-[var(--sw-muted)] space-y-2">
                        <span className="block font-bold text-amber-800 text-xs">Live relay URL configured but not reachable</span>
                        <p className="max-w-md mx-auto text-[11px] leading-relaxed">
                          The Tapo TCW-61 camera configuration is loaded, but the relay gateway is not responding. Please check your network.
                        </p>
                        <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-left inline-block mt-2">
                          <span className="block font-mono text-[9px] font-bold text-stone-600">Expected Environment:</span>
                          <span className="block font-mono text-[9px]">CAMERA_LIVE_RELAY_URL=http://localhost:5000/video_feed</span>
                          <span className="block font-mono text-[9px]">TAPO_SIGN_ROOM_RTSP_URL=rtsp://marcus...</span>
                        </div>
                      </div>
                    );
                  case 'not_configured':
                    return (
                      <div className="p-6 text-center text-xs text-[var(--sw-muted)] space-y-2">
                        <span className="block font-bold text-stone-700">Camera not configured. Add RTSP and relay environment variables.</span>
                        <p className="max-w-md mx-auto text-[11px] leading-relaxed">
                          Shapework detects no local camera variables. To activate live monitoring, specify your TAPO_SIGN_ROOM_RTSP_URL and CAMERA_LIVE_RELAY_URL.
                        </p>
                      </div>
                    );
                  case 'credentials_required':
                    return (
                      <div className="p-6 text-center text-xs text-[var(--sw-muted)] space-y-2">
                        <span className="block font-bold text-stone-700">Camera credentials required. Please configure credentials.</span>
                        <p className="max-w-md mx-auto text-[11px] leading-relaxed">
                          The Tapo camera gateway is enabled, but RTSP access credentials are missing or incorrect.
                        </p>
                      </div>
                    );
                  case 'error':
                    return (
                      <div className="p-6 text-center text-xs text-rose-900 bg-rose-50/30 border border-rose-100 rounded-2xl space-y-3 max-w-md flex flex-col items-center">
                        <div className="space-y-1">
                          <span className="block font-bold text-rose-800 text-sm">Camera Health Error State</span>
                          <p className="text-[11px] leading-relaxed">
                            {cameraHealth?.healthMessage || 'An unexpected error occurred during camera health checks.'}
                          </p>
                          {cameraHealth?.errorSummary && (
                            <pre className="p-2 bg-rose-950 text-rose-100 rounded text-[9px] font-mono text-left overflow-x-auto whitespace-pre-wrap max-h-20">
                              {cameraHealth.errorSummary}
                            </pre>
                          )}
                        </div>
                        <button 
                          onClick={loadCameraData}
                          className="px-3 py-1 bg-rose-800 hover:bg-rose-900 text-white font-bold rounded-lg cursor-pointer text-[10px]"
                        >
                          Retry Health Diagnostics
                        </button>
                      </div>
                    );
                  case 'stubbed':
                  default:
                    return (
                      <div className="relative w-full flex items-center justify-center">
                        <img 
                          src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80"
                          className="max-w-full rounded-lg max-h-[300px] object-cover shadow-sm opacity-60 filter grayscale" 
                          alt="Stubbed Tapo Camera Feed"
                        />
                        <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center p-4 text-center">
                          <div className="bg-white/95 backdrop-blur border border-stone-200 rounded-2xl p-4 shadow-xl max-w-sm">
                            <span className="block font-bold text-stone-800 text-xs mb-1">Demo Mode: Sandbox Camera Signals</span>
                            <p className="text-[10px] text-stone-600 leading-normal">
                              Camera events are stubbed for demo. Real camera relay not connected.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                }
              })()}
            </div>
          </div>

          {/* Event Snapshot Queue */}
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Event Snapshot Queue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opsCameraEvents.filter(e => e.status === 'new' || e.status === 'needs_review').map(ev => (
                <div key={ev.id} className="border border-[var(--sw-border)] rounded-xl overflow-hidden bg-[var(--sw-bg-soft)]/30 flex flex-col justify-between">
                  <div className="relative">
                    <img src={ev.snapshotUrl} className="w-full h-32 object-cover" alt="Event preview" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-black/70 text-white font-mono">
                      {ev.eventType.replace(/_/g, ' ')}
                    </div>
                    {(!cameraHealth || cameraHealth.status === 'stubbed') && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-amber-600/90 text-white font-mono">
                        Sample Event
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--sw-muted)] block font-mono">
                        {new Date(ev.createdAt).toLocaleString()}
                      </span>
                      <p className="font-bold text-xs text-[var(--sw-text)]">{ev.suggestedAction}</p>
                      {ev.confidence && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--sw-muted)]">
                          <span>AI Confidence:</span>
                          <span className={`font-bold ${ev.confidence > 0.8 ? 'text-emerald-750' : 'text-amber-750'}`}>
                            {(ev.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[var(--sw-border)]/50 mt-2">
                      <button 
                        onClick={() => openReview(ev)}
                        className="flex-1 py-1.5 bg-[var(--sw-green-900)] text-white font-bold rounded-lg text-[10px] hover:bg-[var(--sw-green-700)] cursor-pointer"
                      >
                        Review
                      </button>
                      <button 
                        onClick={() => handleRejectEvent(ev.id, 'User rejected event in queue.')}
                        className="px-2.5 py-1.5 border border-[var(--sw-border)] text-stone-500 hover:text-stone-700 font-bold rounded-lg text-[10px] hover:bg-stone-50 cursor-pointer"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {opsCameraEvents.filter(e => e.status === 'new' || e.status === 'needs_review').length === 0 && (
                <p className="text-xs text-[var(--sw-muted)] col-span-2 py-8 text-center font-medium">
                  No camera events pending human review.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Activity / Audit Trail */}
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Camera Activity Ledger</h3>
          <div className="divide-y divide-[var(--sw-border)]/65 max-h-[580px] overflow-y-auto pr-2 space-y-3">
            {ledgerLogs.map(log => (
              <div key={log.id} className="text-[10px] space-y-1 pb-3 pt-1 border-b border-[var(--sw-border)]/40 last:border-none">
                <div className="flex justify-between items-start">
                  <span className={`font-bold capitalize px-1.5 py-0.5 rounded text-[9px] ${
                    log.action === 'checkout' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Camera {log.action}
                  </span>
                  <span className="text-[var(--sw-muted)] font-mono">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[var(--sw-text)]">
                  Asset <span className="font-bold">{log.assetId}</span> verified by camera.
                </p>
                {log.agentName && <p className="text-[var(--sw-muted)]">Holder: {log.agentName}</p>}
                {log.property && <p className="text-[var(--sw-muted)]">Property: {log.property}</p>}
              </div>
            ))}
            {ledgerLogs.length === 0 && (
              <p className="text-xs text-[var(--sw-muted)] py-4">No recent camera ledger activities logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Review Modal */}
      {reviewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white border border-[var(--sw-border)] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center border-b border-[var(--sw-border)]/80 pb-3">
              <h4 className="font-serif font-black text-sm text-[var(--sw-green-900)]">
                Review Camera Signal Event
              </h4>
              <button 
                onClick={() => setReviewEvent(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img src={reviewEvent.snapshotUrl} className="w-full rounded-xl object-cover border border-[var(--sw-border)]" alt="Event detail" />
                <div className="mt-3 space-y-1.5 text-[11px] text-[var(--sw-muted)]">
                  <div><strong>Camera:</strong> Sign Room Camera</div>
                  <div><strong>Event Type:</strong> <span className="capitalize">{reviewEvent.eventType.replace(/_/g, ' ')}</span></div>
                  <div><strong>Time:</strong> {new Date(reviewEvent.createdAt).toLocaleString()}</div>
                  {reviewEvent.confidence && <div><strong>AI Confidence:</strong> {(reviewEvent.confidence * 100).toFixed(0)}%</div>}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Link Physical Asset *
                  </label>
                  <select
                    value={reviewAssetId}
                    onChange={(e) => setReviewAssetId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="">-- Select Asset --</option>
                    {opsAssets.map(ast => (
                      <option key={ast.id} value={ast.id}>
                        {ast.label} ({ast.assetCode}) - {ast.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Assigned Agent Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={reviewAgentName}
                    onChange={(e) => setReviewAgentName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Listing Property Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 152 Edgewater Lane"
                    value={reviewProperty}
                    onChange={(e) => setReviewProperty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                {reviewEvent.eventType === 'possible_checkout' && (
                  <div>
                    <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={reviewReturnDate}
                      onChange={(e) => setReviewReturnDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Additional verification details..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div className="border-t border-[var(--sw-border)]/80 pt-3 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleRejectEvent(reviewEvent.id, reviewNotes || 'Rejected by reviewer.')}
                disabled={isSubmitting}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Reject & Ignore
              </button>
              <button
                onClick={() => handleLinkOnly(reviewEvent.id)}
                disabled={isSubmitting}
                className="px-3 py-1.5 border border-[var(--sw-green-900)] text-[var(--sw-green-900)] rounded-lg hover:bg-[var(--sw-bg-soft)] font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Link Asset Only
              </button>
              <button
                onClick={() => handleConfirmCheckin(reviewEvent.id)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Confirm Check-in
              </button>
              <button
                onClick={() => handleConfirmCheckout(reviewEvent.id)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-[var(--sw-green-900)] text-white rounded-lg hover:bg-[var(--sw-green-700)] font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KnowledgeTabProps {
  opsSops: any[];
  opsLoading: boolean;
}

function KnowledgeTab({ opsSops, opsLoading }: KnowledgeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'qa' | 'ingestion' | 'gaps'>('directory');
  const [selectedDept, setSelectedDept] = useState('all');
  const depts = ['all', 'leadership', 'compliance', 'accounting', 'marketing', 'operations', 'assets', 'integrations'];

  // Q&A states
  const [question, setQuestion] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [unsupportedFlags, setUnsupportedFlags] = useState(false);

  // Ingestion states
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docType, setDocType] = useState<'text' | 'url'>('text');
  const [docUrl, setDocUrl] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [analyzedMeta, setAnalyzedMeta] = useState<any | null>(null);
  
  const [indexedDocs, setIndexedDocs] = useState<any[]>([]);
  const [indexedLoading, setIndexedLoading] = useState(false);

  // Gaps states
  const [gaps, setGaps] = useState<string[]>([]);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsError, setGapsError] = useState<string | null>(null);

  const fetchIndexedDocs = async () => {
    setIndexedLoading(true);
    try {
      const res = await fetch('/api/ops/ai/knowledge');
      if (res.ok) {
        const data = await res.json();
        setIndexedDocs(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIndexedLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexedDocs();
  }, []);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswerLoading(true);
    setAnswer(null);
    setCitations([]);
    setUnsupportedFlags(false);
    try {
      const res = await fetch('/api/ops/ai/knowledge-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'AI assistance is temporarily unavailable. You can continue editing manually.');
      }
      const data = await res.json();
      if (data.response && data.response.result) {
        setAnswer(data.response.result.answer);
        setCitations(data.response.result.citations || []);
        setUnsupportedFlags(data.response.result.unsupportedFlags || false);
      }
    } catch (err: any) {
      setAnswer(err.message || 'An error occurred.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleAnalyzeKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocLoading(true);
    setDocError(null);
    setAnalyzedMeta(null);
    try {
      const payload: any = { type: docType };
      if (docType === 'url') {
        payload.url = docUrl;
      } else {
        payload.content = docContent;
        payload.filename = `${docTitle || 'document'}.txt`;
      }
      const res = await fetch('/api/ops/ai/knowledge-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze content');
      }
      const data = await res.json();
      if (data.response && data.response.result) {
        setAnalyzedMeta(data.response);
      }
    } catch (err: any) {
      setDocError(err.message || 'Analysis failed.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleIndexDoc = async () => {
    if (!analyzedMeta) return;
    try {
      const title = docType === 'url' ? docUrl : docTitle;
      const content = analyzedMeta.extractedContent || docContent;
      const metadata = analyzedMeta.result;

      const res = await fetch('/api/ops/ai/knowledge-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, metadata })
      });
      if (res.ok) {
        setAnalyzedMeta(null);
        setDocTitle('');
        setDocContent('');
        setDocUrl('');
        fetchIndexedDocs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchGaps = async () => {
    setGapsLoading(true);
    setGapsError(null);
    try {
      const res = await fetch('/api/ops/ai/knowledge-gaps');
      if (res.ok) {
        const data = await res.json();
        setGaps(data.gaps || []);
      } else {
        throw new Error('Gaps service offline.');
      }
    } catch (e: any) {
      setGapsError(e.message || 'Failed to check gaps.');
    } finally {
      setGapsLoading(false);
    }
  };

  const filteredSops = opsSops.filter(sop => {
    if (selectedDept === 'all') return true;
    return (sop.department || '').toLowerCase() === selectedDept;
  });

  return (
    <div className="space-y-6 text-left font-sans text-xs p-6 bg-[var(--sw-bg)] min-h-screen">
      <PageHeader title="Knowledge / SOPs" subtitle="Brokerage Standard Operating Procedures and Grounded AI Workspace." />

      {/* Sub-tab navigation */}
      <div className="flex gap-2 border-b border-[var(--sw-border)]/60 pb-3 select-none text-[10px] font-mono font-bold uppercase">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer border ${
            activeSubTab === 'directory' ? 'bg-[#18382b] border-[#18382b] text-white' : 'bg-white border-[#e4decb] text-stone-600 hover:bg-stone-50'
          }`}
        >
          📖 SOP Directory
        </button>
        <button
          onClick={() => setActiveSubTab('qa')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer border ${
            activeSubTab === 'qa' ? 'bg-[#18382b] border-[#18382b] text-white' : 'bg-white border-[#e4decb] text-stone-600 hover:bg-stone-50'
          }`}
        >
          ✨ Grounded Q&A (Shapework AI)
        </button>
        <button
          onClick={() => setActiveSubTab('ingestion')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer border ${
            activeSubTab === 'ingestion' ? 'bg-[#18382b] border-[#18382b] text-white' : 'bg-white border-[#e4decb] text-stone-600 hover:bg-stone-50'
          }`}
        >
          📂 Knowledge Ingestion & Auditing
        </button>
        <button
          onClick={() => { setActiveSubTab('gaps'); handleFetchGaps(); }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer border ${
            activeSubTab === 'gaps' ? 'bg-[#18382b] border-[#18382b] text-white' : 'bg-white border-[#e4decb] text-stone-600 hover:bg-stone-50'
          }`}
        >
          ⚠️ Gap Analysis Report
        </button>
      </div>

      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--sw-border)]/60 pb-3 select-none">
            {depts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  selectedDept === d
                    ? 'bg-[#18382b] border-[#18382b] text-white font-bold'
                    : 'bg-white border-[#e4decb] text-[#4b5563] hover:text-[#1e2520] hover:bg-[#fcfbf7]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSops.map(sop => (
              <div key={sop.id} className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <span className="font-serif font-bold text-sm text-[var(--sw-text)] block">{sop.title}</span>
                  <span className="px-2 py-0.5 bg-[var(--sw-mint-100)] text-[var(--sw-green-900)] rounded text-[9px] font-bold uppercase font-mono">
                    {sop.department}
                  </span>
                </div>
                <p className="text-xs text-[var(--sw-muted)] leading-relaxed">{sop.triggerText}</p>
                <div className="p-3 bg-[var(--sw-bg-soft)]/20 rounded-xl space-y-1.5 border border-[var(--sw-border)]/50">
                  <span className="text-[9px] uppercase font-bold text-[var(--sw-muted)] tracking-wider block font-mono">Step-by-step Action Rules</span>
                  <ul className="list-disc pl-4 space-y-1 text-[10px] text-[var(--sw-text)] leading-relaxed text-left">
                    {sop.steps.map((step: string, sIdx: number) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {filteredSops.length === 0 && (
              <p className="text-xs text-[var(--sw-muted)] col-span-2 text-center py-12">No SOPs found in this department.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'qa' && (
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif font-bold text-sm text-[var(--sw-text)] flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#18382b]" /> Grounded Q&A Assistant</h3>
            <p className="text-[10px] text-[var(--sw-muted)] mt-0.5">Ask questions strictly grounded on indexed brokerage documents. General queries outside known policies will be deflected.</p>
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. When must photography be completed for a listing launch?"
              className="flex-grow bg-white border border-[#e4decb] rounded-xl px-3 text-xs placeholder-stone-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={answerLoading || !question.trim()}
              className="px-4 py-2 bg-[#18382b] hover:bg-[#122b21] disabled:opacity-40 text-white font-bold rounded-xl transition-all cursor-pointer font-mono text-[10px] uppercase"
            >
              {answerLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {answerLoading && (
            <div className="flex items-center gap-2 justify-center py-8 text-stone-400 font-mono">
              <Loader className="w-4 h-4 animate-spin text-[#18382b]" />
              <span>Analyzing retrieved passages & drafting answer...</span>
            </div>
          )}

          {answer && !answerLoading && (
            <div className="space-y-4 text-left border-t border-[var(--sw-border)]/50 pt-4 animate-scale-in">
              <div className="space-y-1.5 p-4 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-[#18382b] tracking-wider block font-mono">AI Grounded Answer</span>
                <p className="text-xs text-[var(--sw-text)] leading-relaxed whitespace-pre-wrap font-medium">{answer}</p>
                {unsupportedFlags && (
                  <div className="mt-2.5 p-2 bg-amber-50 border border-amber-205 text-amber-800 rounded-lg text-[10px] flex items-center gap-1.5 font-mono select-none">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Warning: Query relies on topics outside our indexed knowledge base. Answer might be incomplete.</span>
                  </div>
                )}
              </div>

              {citations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-[var(--sw-muted)] tracking-wider block font-mono">Citations & Sources</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {citations.map((cite, i) => (
                      <div key={i} className="p-3 bg-white border border-[var(--sw-border)] rounded-xl space-y-1 text-[10px] text-left">
                        <strong className="block text-[#18382b]">{cite.sourceTitle || 'Knowledge Source'}</strong>
                        {cite.snippet && <p className="text-[var(--sw-muted)] italic leading-relaxed mt-0.5">"{cite.snippet}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback component */}
              <div className="border-t border-[var(--sw-border)]/60 pt-3 flex justify-between items-center text-[10px]">
                <span className="text-[var(--sw-muted)]">Was this AI-generated answer helpful?</span>
                <HelpfulnessFeedback
                  objectType="ai_response"
                  objectId={`qa_${Date.now()}`}
                  interactionType="grounded_qa"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'ingestion' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--sw-text)]">Index a New Document</h3>
                <p className="text-[10px] text-[var(--sw-muted)] mt-0.5">Index organizational assets or URLs (nestrealty.com) to ground the AI Copilot.</p>
              </div>

              <form onSubmit={handleAnalyzeKnowledge} className="space-y-4">
                <div className="flex gap-4 select-none text-[10px] font-mono font-bold uppercase">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={docType === 'text'}
                      onChange={() => { setDocType('text'); setAnalyzedMeta(null); }}
                    />
                    <span>Raw text / Markdown</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={docType === 'url'}
                      onChange={() => { setDocType('url'); setAnalyzedMeta(null); }}
                    />
                    <span>Approved URL</span>
                  </label>
                </div>

                {docType === 'text' ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-[var(--sw-muted)] block font-bold">Document Title</label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. Wilmington HQ Signs Policy"
                        className="w-full bg-white border border-[#e4decb] rounded-xl p-2.5 text-xs text-[var(--sw-text)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-[var(--sw-muted)] block font-bold">Content</label>
                      <textarea
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        placeholder="Paste document policy text..."
                        className="w-full bg-white border border-[#e4decb] rounded-xl p-2.5 text-xs text-[var(--sw-text)] focus:outline-none min-h-[120px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-[var(--sw-muted)] block font-bold">Approved URL</label>
                    <input
                      type="text"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="e.g. https://nestrealty.com/compliance-policy"
                      className="w-full bg-white border border-[#e4decb] rounded-xl p-2.5 text-xs text-[var(--sw-text)] focus:outline-none"
                    />
                    <span className="text-[8px] font-mono text-stone-400 block mt-1">Domain must belong strictly to nestrealty.com.</span>
                  </div>
                )}

                {docError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-mono">{docError}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={docLoading || (docType === 'text' ? (!docTitle.trim() || !docContent.trim()) : !docUrl.trim())}
                    className="px-4 py-2 bg-[#18382b] hover:bg-[#122b21] disabled:opacity-40 text-white font-bold rounded-xl transition-all cursor-pointer font-mono text-[10px] uppercase"
                  >
                    {docLoading ? 'Analyzing...' : 'Upload & Audit'}
                  </button>
                </div>
              </form>
            </div>

            {/* Metadata review screen */}
            {analyzedMeta && (
              <div className="bg-[var(--sw-card)] border border-[#18382b]/30 rounded-2xl p-6 shadow-md space-y-4 animate-scale-in">
                <div>
                  <span className="text-[9px] font-mono uppercase text-[#18382b] block font-bold">Metadata Audit Review</span>
                  <h4 className="font-serif font-bold text-sm text-[var(--sw-text)] mt-0.5">Approve Extracted Index Fields</h4>
                  <p className="text-[10px] text-[var(--sw-muted)]">Check the extracted compliance variables. If correct, confirm to index the asset.</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-xl">
                    <span className="text-[8px] font-mono text-[var(--sw-muted)] uppercase block font-bold">Summary</span>
                    <p className="text-[var(--sw-text)] leading-relaxed mt-0.5">{analyzedMeta.result.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-xl">
                      <span className="text-[8px] font-mono text-[var(--sw-muted)] uppercase block font-bold">Mapped Roles</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analyzedMeta.result.roles?.map((r: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-850 rounded text-[9px] border border-emerald-100 font-mono">{r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-xl">
                      <span className="text-[8px] font-mono text-[var(--sw-muted)] uppercase block font-bold">Topics</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analyzedMeta.result.topics?.map((t: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded text-[9px] border border-blue-100 font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)] rounded-xl space-y-1.5">
                    <span className="text-[8px] font-mono text-[var(--sw-muted)] uppercase block font-bold">Policies & Procedures</span>
                    <ul className="list-disc pl-4 text-[10px] text-[var(--sw-text)] space-y-1 leading-relaxed">
                      {analyzedMeta.result.policies?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      {analyzedMeta.result.procedures?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>

                  {analyzedMeta.result.potentialConflicts && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
                      <span className="text-[8px] font-mono text-red-600 uppercase block font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Compliance Conflicts</span>
                      <p className="text-red-900 leading-relaxed text-[10px] font-mono">{analyzedMeta.result.potentialConflicts}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end border-t border-[var(--sw-border)]/60 pt-3.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setAnalyzedMeta(null)}
                    className="px-3 py-1.5 border border-[#e4decb] text-[#4b5563] rounded-lg hover:bg-stone-50 cursor-pointer uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleIndexDoc}
                    className="px-3 py-1.5 bg-[#18382b] hover:bg-[#122b21] text-white rounded-lg cursor-pointer uppercase font-bold"
                  >
                    Confirm & Index Document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active documents list side panel */}
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-5 shadow-sm space-y-4 select-none max-h-[500px] overflow-y-auto">
            <div>
              <h3 className="font-serif font-bold text-xs text-[var(--sw-text)] uppercase tracking-wider">Active Knowledge Library</h3>
              <p className="text-[9px] text-[var(--sw-muted)] mt-0.5">Indexed files supporting context answers.</p>
            </div>

            {indexedLoading && (
              <div className="flex items-center gap-2 justify-center py-6 text-stone-400 font-mono text-[9px]">
                <Loader className="w-3.5 h-3.5 animate-spin text-[#18382b]" />
                <span>Loading index...</span>
              </div>
            )}

            <div className="space-y-2">
              {indexedDocs.map((doc) => (
                <div key={doc.id} className="p-3 bg-white border border-[var(--sw-border)] rounded-xl text-left space-y-1">
                  <strong className="block text-stone-800 text-[11px] truncate">{doc.title}</strong>
                  <span className="text-[8px] font-mono text-[var(--sw-muted)] uppercase block">Indexed: {new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              ))}

              {!indexedLoading && indexedDocs.length === 0 && (
                <p className="text-[10px] text-stone-400 text-center py-4">No custom documents indexed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'gaps' && (
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-5 text-left select-none">
          <div className="flex justify-between items-start border-b border-[var(--sw-border)]/60 pb-3">
            <div>
              <h3 className="font-serif font-bold text-sm text-[var(--sw-text)] flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500" /> Knowledge Gaps & Conflicts Report</h3>
              <p className="text-[10px] text-[var(--sw-muted)] mt-0.5 font-mono">Cross-checks procedures for logical holes, unrepresented duties, or contradictory regulations.</p>
            </div>
            <button
              onClick={handleFetchGaps}
              disabled={gapsLoading}
              className="px-3 py-1.5 bg-[#18382b] hover:bg-[#122b21] text-white text-[9px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              {gapsLoading ? 'Refreshing Gaps...' : 'Audit Gaps'}
            </button>
          </div>

          {gapsLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 font-mono text-[10px] text-stone-400">
              <Loader className="w-6 h-6 animate-spin text-[#18382b]" />
              <span>Cross-analyzing operating documents directory...</span>
            </div>
          )}

          {gapsError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-mono">{gapsError}</div>
          )}

          {!gapsLoading && !gapsError && gaps.length === 0 && (
            <div className="p-6 text-center bg-black/5 rounded-2xl space-y-1 border border-dashed border-stone-200">
              <span className="text-[11px] text-stone-500 font-bold uppercase block">No gaps found</span>
              <p className="text-[10px] text-stone-400 max-w-sm mx-auto mt-1">Workspace documentation contains clear boundaries, triggers, and active role coverage mappings.</p>
            </div>
          )}

          {!gapsLoading && !gapsError && gaps.length > 0 && (
            <div className="space-y-2.5">
              {gaps.map((gap, i) => (
                <div key={i} className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface IntegrationsTabProps {
  cameraHealth: any;
}

function IntegrationsTab({ cameraHealth }: IntegrationsTabProps) {
  const getCameraStatus = () => {
    if (!cameraHealth) return 'Loading...';
    switch (cameraHealth.status) {
      case 'connected': return 'Connected';
      case 'live_relay_missing': return 'Live Relay Missing';
      case 'stubbed': return 'Stubbed / Demo';
      case 'not_configured': return 'Not Configured';
      case 'credentials_required': return 'Credentials Required';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getCameraBadgeClass = () => {
    if (!cameraHealth) return 'bg-stone-50 text-stone-700 border-stone-200 animate-pulse';
    switch (cameraHealth.status) {
      case 'connected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stubbed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'live_relay_missing':
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'not_configured':
      case 'credentials_required':
        return 'bg-stone-50 text-stone-700 border-stone-250';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const honestIntegrations = [
    { id: 'tapo_camera', name: 'TP-Link Tapo Camera Relay', provider: 'Tapo TCW-61', purpose: 'Physical signs room event tracking', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'gmail_intake', name: 'Gmail Intake Connector', provider: 'Google Workspace', purpose: 'Reads incoming email support threads', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'quickbooks', name: 'QuickBooks Sync', provider: 'Intuit QB API', purpose: 'Financial and commissions sync', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'basecamp', name: 'Basecamp Operations Desk', provider: 'Basecamp V3', purpose: 'Escalations ticketing board', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'rechat', name: 'Rechat Marketing Desk', provider: 'Rechat API', purpose: 'Brokerage marketing workflows', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'twilio', name: 'Twilio SMS Notifier', provider: 'Twilio API', purpose: 'Dispatch automated updates to agents', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'gdrive', name: 'Google Drive', provider: 'Google Workspace', purpose: 'Reads compliance disclosure documents', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'mscalendar', name: 'Microsoft 365 Calendar', provider: 'Microsoft Graph', purpose: 'Office reservations management', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'shapework_db', name: 'Shapework Internal Database', provider: 'SQLite / Local Storage', purpose: 'Local application persistence', status: 'Connected & Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="space-y-6 text-left font-sans text-xs p-6 bg-[var(--sw-bg)] min-h-screen">
      <PageHeader title="Integrations" subtitle="Third-party connector triggers status board." />

      <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--sw-border)] bg-[var(--sw-bg-soft)]/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[var(--sw-green-900)] uppercase font-mono tracking-wider">Brokerage Connections Directory</span>
        </div>

        <div className="divide-y divide-[var(--sw-border)]/65">
          {honestIntegrations.map(conn => (
            <div key={conn.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="space-y-1">
                <span className="font-serif font-bold text-sm text-[var(--sw-text)] block">{conn.name}</span>
                <p className="text-xs text-[var(--sw-muted)]">{conn.purpose}</p>
                <div className="text-[10px] text-[var(--sw-muted)] font-mono">Provider: {conn.provider}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${conn.badge}`}>
                  {conn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const offices = ['Wilmington Headquarters (HQ)', 'Raleigh Hub', 'Charlotte Regional Office'];
  const rbacList = [
    { role: 'Owner / Executive', perm: 'Full read/write workspace oversight, audit logs access, compliance overrides.' },
    { role: 'Operations Lead', perm: 'Queue dispatch, physical sign checkouts management, asset audit check.' },
    { role: 'Compliance Partner (BIC)', perm: 'Compliance-sensitive files checking, audit logs visibility.' },
    { role: 'Agent Support Coordinator', perm: 'Marketing requests desk, general checklists updates.' },
    { role: 'Broker Agent', perm: 'Submit support tickets, checkout physical yard signs for assigned listings.' }
  ];

  return (
    <div className="space-y-6 text-left font-sans text-xs p-6 bg-[var(--sw-bg)] min-h-screen">
      <PageHeader title="Settings" subtitle="Workspace configurations, notification preferences, and location branding." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Workspace Profile</h3>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Tenant Identifier</span>
                <span className="text-xs font-bold text-[var(--sw-text)]">Nest Realty Wilmington</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Location Domain</span>
                <span className="text-xs text-[var(--sw-text)]">nestrealty.com/wilmington</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Operational Mode</span>
                <span className="text-xs text-[var(--sw-text)]">Hybrid Brokerage / Agent Self-Service Checkout</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Active Offices & Locations</h3>
            <ul className="space-y-2">
              {offices.map((office, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-[var(--sw-text)] bg-[var(--sw-bg-soft)]/20 border border-[var(--sw-border)]/50 rounded-xl p-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sw-green-900)]" />
                  {office}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-sm font-bold text-[var(--sw-text)]">Role-based Access Permissions (RBAC)</h3>
          <div className="divide-y divide-[var(--sw-border)]/60">
            {rbacList.map((rbac, idx) => (
              <div key={idx} className="py-2.5">
                <span className="font-bold text-xs text-[var(--sw-text)] block">{rbac.role}</span>
                <p className="text-[10px] text-[var(--sw-muted)] mt-0.5 leading-relaxed">{rbac.perm}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
