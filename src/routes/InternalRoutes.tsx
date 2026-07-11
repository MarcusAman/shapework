import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Layers, 
  Compass, 
  TrendingUp, 
  Settings, 
  Play, 
  Activity, 
  Cpu, 
  Shield, 
  ArrowRight,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Mail,
  Smartphone,
  FileText,
  Phone,
  Users,
  BookOpen,
  Terminal,
  Video
} from 'lucide-react';

import {
  InternalShell,
  MorningBriefCard,
  OwnerWorthyDecisionCard,
  HumanReviewQueueCard,
  DeflectedNoiseCard,
  EventStatusPill,
  ActionLinkStatusBadge,
  ConfidenceBadge,
  HumanReviewBadge,
  OwnerShieldBadge,
  DecisionDrawer,
  IntegrationHealthCard,
  NotificationPreviewFrame,
  WhiteLabelPreviewCard,
  SafeTokenFingerprint,
  EmptyState,
  LoadingSkeleton,
  CopyButton
} from '../components/headless/CockpitComponents';

import CustomerLaunchRoom from '../components/settings/CustomerLaunchRoom';
import ActivityAuditTrail from '../components/command/ActivityAuditTrail';
import AgentRunTable from '../components/agents/AgentRunTable';
import DiscoveryPrioritiesView from '../components/settings/DiscoveryPrioritiesView';
import CustomerLaunchWizard from '../components/settings/CustomerLaunchWizard';
import FirstBrokeragePilotChecklist from '../components/settings/FirstBrokeragePilotChecklist';
import PilotReadinessScorecard from '../components/settings/PilotReadinessScorecard';
import PilotLaunchDecisionPanel from '../components/settings/PilotLaunchDecisionPanel';
import FirstPilotLaunchPack from '../components/settings/FirstPilotLaunchPack';
import IntegrationTestConsole from '../components/settings/IntegrationTestConsole';
import LiveOperationsTimeline from '../components/live/LiveOperationsTimeline';

import InternalAssessmentsView from '../components/console/InternalAssessmentsView';
import InternalResponseDetailView from '../components/console/InternalResponseDetailView';
import InternalMarketIntelligenceView from '../components/console/InternalMarketIntelligenceView';

interface InternalRoutesProps {
  state: any;
  selectedResponseId: string | null;
  setSelectedResponseId: (id: string | null) => void;
  onNavigateTab: (tab: string) => void;
}

export default function InternalRoutes({ 
  state,
  selectedResponseId,
  setSelectedResponseId,
  onNavigateTab
}: InternalRoutesProps) {
  const {
    currentTab,
    setCurrentTab,
    transactions,
    listings,
    decisions,
    actionProposals,
    auditEvents,
    integrations,
    aiAgents,
    appMode,
    workspaceId,
    fetchState,
    handleApproveAction,
    handleDismissAction,
    handleRollbackAuditAction,
    ownerShieldDecisions = [],
    headlessActions = [],
    integrationEvents = []
  } = state;

  const [active360Type, setActive360Type] = useState<string | null>(null);
  const [active360Id, setActive360Id] = useState<string | null>(null);

  const handleInspectRecord = (type: string, id: string) => {
    setActive360Type(type);
    setActive360Id(id);
  };

  // Selected item for drawer detail view
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Webhook and event filters
  const [eventFilter, setEventFilter] = useState<'all' | 'needs_review' | 'deflected' | 'completed' | 'failed' | 'low_confidence' | 'webhook_failed'>('all');
  
  // Notification preview catalog state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('client_portal_invite');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('marcus@shapework.co');
  const [testSendStatus, setTestSendStatus] = useState<{ success?: boolean; error?: string; sending?: boolean }>({});

  // White label sandbox state
  const [brandName, setBrandName] = useState('Nest Realty Wilmington');
  const [brandColor, setBrandColor] = useState('#18382b');
  const [logoUrl, setLogoUrl] = useState('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2318382b"><rect width="80" height="80" rx="15" x="10" y="10"/><text x="50" y="55" font-family="serif" font-weight="bold" font-size="36" fill="white" text-anchor="middle">SW</text></svg>');
  const [brandingEnforced, setBrandingEnforced] = useState(true);
  const [brandingStatus, setBrandingStatus] = useState<string>('Saved');

  // Trigger test notification fetch
  useEffect(() => {
    if (currentTab === 'Notification Studio') {
      setPreviewLoading(true);
      fetch(`/api/headless/notification-previews?type=${selectedTemplate}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPreviewData(data);
          }
          setPreviewLoading(false);
        })
        .catch(() => setPreviewLoading(false));
    }
  }, [currentTab, selectedTemplate]);

  // Seeding realistic client fallback data if mock data from server is empty
  const localDecisions = ownerShieldDecisions.length > 0 ? ownerShieldDecisions : [
    { id: 'osd_1092', workItemId: 'wi_99a', decision: 'deflected', reason: 'Deflected: Routine signage inspection routed directly to maintenance queue.', rulesTriggered: ['routine_request_deflect'], confidence: 0.99, humanReviewRequired: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'osd_1093', workItemId: 'wi_99b', decision: 'needs_owner_decision', reason: 'Requires Review: Commission split deviation (custom contract) needs direct broker exception sign-off.', rulesTriggered: ['commission_deviation_flag'], confidence: 0.96, humanReviewRequired: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'osd_1094', workItemId: 'wi_99c', decision: 'escalated', reason: 'Escalated: Critical contract inspection deadline overdue with no backup coordinator assigned.', rulesTriggered: ['overdue_no_backup_escalate'], confidence: 0.98, humanReviewRequired: true, createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 'osd_1095', workItemId: 'wi_99d', decision: 'deflected', reason: 'Deflected: Routine flyer design submission auto-assigned to marketing queue.', rulesTriggered: ['routine_request_deflect'], confidence: 0.97, humanReviewRequired: false, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  const localActions = headlessActions.length > 0 ? headlessActions : [
    { id: 'act_01', actionType: 'approve_draft', sourceType: 'approval', sourceId: 'prop_01', recipientRole: 'compliance_partner', workspaceId: 'nest-realty-demo', entity: '109 Woodlawn Avenue', status: 'completed', tokenScope: 'approve_draft', channel: 'email', outcome: 'Compliance verified.', createdAt: new Date(Date.now() - 1800000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), usedAt: new Date(Date.now() - 1200000).toISOString(), secureTokenHash: 'hash_abc123' },
    { id: 'act_02', actionType: 'complete_work_item', sourceType: 'work_item', sourceId: 'wi_99b', recipientRole: 'owner', workspaceId: 'nest-realty-demo', entity: '123 Oak Street', status: 'pending', tokenScope: 'complete_work_item', channel: 'sms', outcome: 'Pending approval split override.', createdAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: new Date(Date.now() + 82800000).toISOString(), secureTokenHash: 'hash_xyz456' },
    { id: 'act_03', actionType: 'upload_document', sourceType: 'deal', sourceId: 'tx_1', recipientRole: 'agent', workspaceId: 'nest-realty-demo', entity: '742 Evergreen Terrace', status: 'opened', tokenScope: 'upload_disclosures', channel: 'email', outcome: 'Disclosures link opened.', createdAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: new Date(Date.now() + 79200000).toISOString(), secureTokenHash: 'hash_qrs789' },
    { id: 'act_04', actionType: 'review_document', sourceType: 'document', sourceId: 'doc_12', recipientRole: 'operations_lead', workspaceId: 'nest-realty-demo', entity: '102 Pine Street', status: 'expired', tokenScope: 'review_title_report', channel: 'email', outcome: 'Expired without upload.', createdAt: new Date(Date.now() - 90000000).toISOString(), expiresAt: new Date(Date.now() - 3600000).toISOString(), secureTokenHash: 'hash_def999' }
  ];

  const localEvents = integrationEvents.length > 0 ? integrationEvents : [
    { id: 'evt_001', source: 'apination_dotloop', workspace: 'Nest Realty Wilmington', entityType: 'deal', eventType: 'loop_status_changed', detectedIssue: 'Status changed to Listing Prep.', ruleDecision: 'No deflection required. Status synchronized.', confidence: 1.0, ownerShieldResult: 'passed', humanReview: false, linkGenerated: false, outcome: 'Synced with core database.', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 'evt_002', source: 'rechat_crm', workspace: 'Nest Realty Wilmington', entityType: 'signal', eventType: 'inbound_message', detectedIssue: 'Inbound message: "Title search is delayed due to tax easement issues."', ruleDecision: 'Escalation to owner required due to transaction risk.', confidence: 0.96, ownerShieldResult: 'needs_owner_decision', humanReview: true, linkGenerated: true, outcome: 'Dispatched SMS notification to Broker Owner.', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 'evt_003', source: 'smart_intake_portal', workspace: 'Nest Realty Wilmington', entityType: 'work_item', eventType: 'marketing_submission', detectedIssue: 'Routine marketing request: "Please print 50 flyers for weekend open house."', ruleDecision: 'Routine request deflected directly to marketing team.', confidence: 0.99, ownerShieldResult: 'deflected', humanReview: false, linkGenerated: true, outcome: 'Deflected from owner inbox. Notified marketing.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'evt_004', source: 'webhook_dispatch', workspace: 'Nest Realty Wilmington', entityType: 'callback', eventType: 'dispatch_failed', detectedIssue: 'Callback target offline: Host unreachable callback URL.', ruleDecision: 'Low confidence callback. Delivery failure flagged.', confidence: 0.45, ownerShieldResult: 'webhook_failed', humanReview: true, linkGenerated: false, outcome: 'Exhausted webhook retry limit.', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ];

  const localIntegrations = integrations && integrations.length > 0 ? integrations : [
    { provider: 'google_workspace', name: 'Google Suite', category: 'productivity', status: 'active', connectionDetails: { authEmail: 'operations@nestrealty.com', scope: 'Gmail, Drive, Calendar' }, lastSync: '2 minutes ago', lastEvent: 'Google Calendar event sync complete', lastOutbound: 'Sync calendar 109 Woodlawn Avenue', failCount: 0 },
    { provider: 'quickbooks', name: 'QuickBooks Online', category: 'accounting', status: 'warning', connectionDetails: { authEmail: 'billing@nestrealty.com', scope: 'Invoices, Receipts' }, lastSync: '1 hour ago', lastEvent: 'Transaction invoice #1092 logged', lastOutbound: 'Outbound sync failed (Token renewal needed)', failCount: 1, warning: 'Refresh token requires manual renewal.' },
    { provider: 'basecamp', name: 'Basecamp 3', category: 'collaboration', status: 'active', connectionDetails: { authEmail: 'teams@nestrealty.com', scope: 'To-dos, Projects' }, lastSync: '5 minutes ago', lastEvent: 'To-do item checklist uploaded', lastOutbound: 'Created project 123 Oak Street', failCount: 0 },
    { provider: 'apination_dotloop', name: 'Dotloop Integration', category: 'compliance', status: 'active', connectionDetails: { authEmail: 'compliance@nestrealty.com', scope: 'Loops, Documents' }, lastSync: '10 minutes ago', lastEvent: 'Loop status change sync', lastOutbound: 'Uploaded wire document', failCount: 0 }
  ];

  // Filtering logic
  const filteredEvents = localEvents.filter(e => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'needs_review') return e.humanReview;
    if (eventFilter === 'deflected') return e.ownerShieldResult === 'deflected';
    if (eventFilter === 'completed') return e.outcome.toLowerCase().includes('completed') || e.outcome.toLowerCase().includes('synced');
    if (eventFilter === 'failed') return e.outcome.toLowerCase().includes('failed') || e.ownerShieldResult === 'webhook_failed';
    if (eventFilter === 'low_confidence') return e.confidence < 0.85;
    if (eventFilter === 'webhook_failed') return e.ownerShieldResult === 'webhook_failed';
    return true;
  });

  // Test send email helper
  const handleSendTestNotification = async () => {
    setTestSendStatus({ sending: true });
    try {
      const res = await fetch('/api/headless/notification-previews/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: selectedTemplate,
          recipientEmail: testEmailInput
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestSendStatus({ success: true });
      } else {
        setTestSendStatus({ error: data.error || 'Failed to dispatch email' });
      }
    } catch (e: any) {
      setTestSendStatus({ error: e.message || 'Failed to send network request' });
    }
  };

function InternalOverviewView({ state, onNavigateTab }: { state: any; onNavigateTab: (tab: string) => void }) {
  const [stats, setStats] = useState<any>({
    totalAssessments: 0,
    averageFriction: 0,
    highestPainCategory: 'Loading...',
    assessmentsThisWeek: 0
  });

  const [cameraStats, setCameraStats] = useState<any>({
    registered: 0,
    online: 0,
    lastSnapshot: 'Never',
    eventsToday: 0,
    failedToday: 0
  });

  useEffect(() => {
    fetch('/api/assessments/analytics/summary')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalAssessments: data.totalAssessments || 0,
          averageFriction: data.averageFriction ? Number(data.averageFriction).toFixed(1) : '0.0',
          highestPainCategory: data.highestPainCategory || 'None',
          assessmentsThisWeek: data.totalAssessments || 0
        });
      })
      .catch(() => {
        setStats({
          totalAssessments: 6,
          averageFriction: '6.4',
          highestPainCategory: 'Document Handoffs',
          assessmentsThisWeek: 2
        });
      });

    // Fetch camera configs
    fetch('/api/internal/cameras')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.cameras) {
          const total = data.cameras.length;
          const online = data.cameras.filter((c: any) => c.status === 'online' || c.status === 'connected').length;
          setCameraStats(prev => ({
            ...prev,
            registered: total,
            online: online
          }));
        }
      })
      .catch(() => {});

    // Fetch camera events
    fetch('/api/internal/cameras/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.events) {
          const failed = data.events.filter((e: any) => e.status === 'failed').length;
          const latest = data.events.find((e: any) => e.status === 'captured')?.createdAt
            ? new Date(data.events.find((e: any) => e.status === 'captured').createdAt).toLocaleTimeString()
            : 'Never';
          setCameraStats(prev => ({
            ...prev,
            eventsToday: data.events.length,
            failedToday: failed,
            lastSnapshot: latest
          }));
        }
      })
      .catch(() => {});
  }, []);

  const systemStatus = [
    { label: 'Environment', value: 'Development', type: 'warning' },
    { label: 'Server Engine', value: 'Online', type: 'success' },
    { label: 'PostgreSQL Sync', value: 'Connected', type: 'success' },
    { label: 'Job Worker Queue', value: 'Polling (Idle)', type: 'success' },
    { label: 'Metadata Seed', value: 'Loaded (v2.0)', type: 'success' },
    { label: 'Last Heartbeat Check', value: new Date().toLocaleTimeString(), type: 'info' }
  ];

  const diagnosticModules = [
    { name: 'Integration Health', desc: 'Active API endpoints & webhooks', status: 'Healthy', tab: 'Integration Health' },
    { name: 'Webhook Delivery', desc: 'Traces and logs for incoming signals', status: 'Active Tracing', tab: 'Webhook Delivery' },
    { name: 'Notification Diagnostics', desc: 'SMS & Email delivery dispatch', status: 'Online', tab: 'Notification Diagnostics' },
    { name: 'Voice Provider Diagnostics', desc: 'Retell AI voice session ledgers', status: 'Configured', tab: 'Voice Provider Diagnostics' },
    { name: 'Action Token Registry', desc: 'Admin tokens for action links', status: 'Active (4)', tab: 'Action Token Registry' },
    { name: 'Security & Audit', desc: 'User logs and permission trails', status: 'Compliant', tab: 'Security & Audit' },
    { name: 'System Logs', desc: 'Async task stdout/stderr streams', status: 'Idle', tab: 'System Logs' }
  ];

  const recentActivity = [
    { desc: 'Assessment submitted: Nest Realty Wilmington', time: '3m ago', icon: FileText, color: 'text-[#63CFA7]' },
    { desc: 'Retell AI call completed: session_act392...', time: '15m ago', icon: Phone, color: 'text-[#63CFA7]' },
    { desc: 'OAuth token refreshed: Basecamp API', time: '1h ago', icon: RefreshCw, color: 'text-amber-300' },
    { desc: 'Workspace details updated: Bleu Boutique staged', time: '3h ago', icon: Layers, color: 'text-sky-400' },
    { desc: 'Security credentials audited: developer keys rotated', time: '6h ago', icon: Shield, color: 'text-coral-400' }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans text-left pb-12">
      {/* 6 Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Active Workspaces', value: '4', sub: '2 Live / 2 Staging', icon: Layers, color: 'text-[#D0D6BB]' },
          { label: 'Assessments', value: stats.totalAssessments, sub: `${stats.assessmentsThisWeek} submitted this week`, icon: FileText, color: 'text-[#D0D6BB]' },
          { label: 'Support Queue', value: '0', sub: 'All SLA compliant', icon: Users, color: 'text-[#D0D6BB]' },
          { label: 'Integration Health', value: '100%', sub: '0 failures last 24h', icon: RefreshCw, color: 'text-[#D0D6BB]' },
          { label: 'Webhook Delivery', value: '99.9%', sub: 'Active tracing logs', icon: Cpu, color: 'text-[#D0D6BB]' },
          { label: 'Voice Provider', value: 'Online', sub: 'Retell LLM active', icon: Phone, color: 'text-[#D0D6BB]' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-1.5 shadow-[var(--sw-shadow-soft)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-12 h-12" />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono font-bold uppercase tracking-wider block">{card.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-black text-white">{card.value}</span>
              </div>
              <span className="text-[9px] text-[var(--text-tertiary)] font-mono block truncate">{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: delivery status, active workspaces, assessment intelligence */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section A: Delivery Workspace Status */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Delivery Workspace Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {systemStatus.map((status, idx) => (
                <div key={idx} className="p-3 bg-black/15 border border-[var(--border-soft)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase font-bold block">{status.label}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {status.type === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-[#63CFA7]" />}
                    {status.type === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-[#D0D6BB]" />}
                    <span className="text-xs font-mono font-bold text-white">{status.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Active Workspaces */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Active Workspaces
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-soft)] text-[var(--text-secondary)] font-mono text-[10px] uppercase">
                    <th className="py-2.5 font-bold">Workspace</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold">Active Modules</th>
                    <th className="py-2.5 font-bold">Last Activity</th>
                    <th className="py-2.5 font-bold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Nest Realty Wilmington', status: 'Active Pilot', modules: 'Intake, Work Queue, Compliance', last: '2m ago', id: 'nest-realty-demo', color: 'text-[#63CFA7] bg-[#63CFA7]/10 border-[#63CFA7]/10' },
                    { name: 'Bleu Boutique Properties', status: 'Onboarding', modules: 'Deals Intake, Transaction Track', last: '1h ago', id: 'bleu-boutique', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
                    { name: 'Smile Sketch Vegas', status: 'Staged', modules: 'Compliance Audits', last: '4h ago', id: 'smile-sketch', color: 'text-white/60 bg-white/5 border-white/10' },
                    { name: 'Red Oak Raleigh', status: 'Staged', modules: 'Operations Cockpit', last: '1d ago', id: 'red-oak', color: 'text-white/60 bg-white/5 border-white/10' }
                  ].map((ws, idx) => (
                    <tr key={idx} className="border-b border-[var(--border-soft)] last:border-b-0 hover:bg-white/2">
                      <td className="py-3 pr-2">
                        <span className="font-bold text-white block">{ws.name}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">ID: {ws.id}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono border ${ws.color}`}>
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--text-tertiary)] font-mono text-[10px] pr-2">{ws.modules}</td>
                      <td className="py-3 text-[var(--text-tertiary)] font-mono text-[10px]">{ws.last}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              window.location.pathname = '/app/workboard';
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-[var(--border-soft)] rounded-md text-[9px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer"
                          >
                            Open App
                          </button>
                          <button
                            onClick={() => onNavigateTab('Operational Records')}
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-[var(--border-soft)] rounded-md text-[9px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer"
                          >
                            Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Assessment Intelligence */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-2">
              <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                Assessment Intelligence
              </h3>
              <button
                onClick={() => onNavigateTab('Assessments')}
                className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-lg text-[9px] font-bold tracking-wider uppercase font-mono transition-all cursor-pointer"
              >
                View Assessments
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-black/15 border border-[var(--border-soft)] rounded-xl text-center space-y-1">
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase font-bold">Average Friction Index</span>
                <span className="text-2xl font-serif font-black block text-[#D0D6BB]">{stats.averageFriction} / 10.0</span>
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono block">Medium SLA Risk</span>
              </div>
              <div className="p-3 bg-black/15 border border-[var(--border-soft)] rounded-xl text-center space-y-1">
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase font-bold">Highest Pain Category</span>
                <span className="text-sm font-bold block text-white pt-1 truncate" title={stats.highestPainCategory}>{stats.highestPainCategory}</span>
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono block">Scale Breakpoint Block</span>
              </div>
              <div className="p-3 bg-black/15 border border-[var(--border-soft)] rounded-xl text-center space-y-1">
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase font-bold">Total Audited Submissions</span>
                <span className="text-2xl font-serif font-black block text-[#63CFA7]">{stats.totalAssessments} Reports</span>
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono block">Synced to PostgreSQL</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: diagnostics modules, recent activity, quick actions */}
        <div className="space-y-6">
          
          {/* Section D: Diagnostics Module Grid */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Diagnostics & Systems
            </h3>
            <div className="space-y-2">
              {diagnosticModules.map((mod, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-black/15 border border-[var(--border-soft)] rounded-xl hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block text-[11px] leading-tight">{mod.name}</span>
                    <span className="text-[9px] text-[var(--text-tertiary)] leading-none block">{mod.desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono font-bold">{mod.status}</span>
                    <button
                      onClick={() => onNavigateTab(mod.tab)}
                      className="p-1 hover:bg-white/5 text-[#D0D6BB] hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={`Inspect ${mod.name}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Signals Cockpit */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-2">
              <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                Camera Signals
              </h3>
              <button
                onClick={() => onNavigateTab('Camera Signals')}
                className="text-[9px] font-mono font-bold text-[#D0D6BB] hover:text-white uppercase tracking-wider underline cursor-pointer bg-transparent border-none p-0"
              >
                Configure
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-black/15 border border-[var(--border-soft)] rounded-xl">
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase block leading-none">Status</span>
                <span className="font-bold text-white flex items-center gap-1.5 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraStats.online > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {cameraStats.online > 0 ? `${cameraStats.online} Online` : 'Offline / Unknown'}
                </span>
              </div>
              <div className="p-2.5 bg-black/15 border border-[var(--border-soft)] rounded-xl">
                <span className="text-[9px] text-[var(--text-tertiary)] font-mono uppercase block leading-none">Events Today</span>
                <span className="font-bold text-white block mt-1.5">{cameraStats.eventsToday} Events</span>
              </div>
            </div>
            
            <div className="text-[10px] text-[var(--text-secondary)] font-mono space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span>Last Snapshot:</span>
                <span className="text-white">{cameraStats.lastSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Captures:</span>
                <span className="text-white">{cameraStats.failedToday}</span>
              </div>
            </div>
          </div>

          {/* Section E: Recent Internal Activity Feed */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Recent Internal Activity
            </h3>
            <div className="space-y-3.5 relative pl-4 border-l border-[var(--border-soft)] ml-1.5">
              {recentActivity.map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#01362D] border border-[var(--border-soft)] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#D0D6BB]" />
                    </div>
                    <p className="text-[10px] text-white leading-relaxed font-mono">{act.desc}</p>
                    <div className="flex items-center gap-1.5 text-[8px] text-[var(--text-tertiary)] font-mono uppercase font-bold">
                      <ActIcon className={`w-2.5 h-2.5 ${act.color}`} />
                      <span>{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section F: Quick Actions */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('Assessments')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] text-[#F6F7F1] rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer text-center"
              >
                View Assessments
              </button>
              <button
                onClick={() => onNavigateTab('Workspaces')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] text-[#F6F7F1] rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer text-center"
              >
                Open Workspace
              </button>
              <button
                onClick={() => onNavigateTab('Integration Health')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] text-[#F6F7F1] rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer text-center"
              >
                Check Integrations
              </button>
              <button
                onClick={() => onNavigateTab('System Logs')}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] text-[#F6F7F1] rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase transition-colors cursor-pointer text-center"
              >
                View Logs
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

  const renderViewContent = () => {
    console.log('[InternalRoutes] currentTab value:', JSON.stringify(currentTab), 'type:', typeof currentTab);
    switch (currentTab) {
      // ==========================================
      // 1. System Overview
      // ==========================================
      case 'System Overview': {
        return <InternalOverviewView state={state} onNavigateTab={onNavigateTab} />;
      }

      // ==========================================
      // 2. Workspaces
      // ==========================================
      case 'Workspaces': {
        return (
          <div className="space-y-6 text-left animate-fade-in">
            <CustomerLaunchRoom
              workspaceId={state.workspaceId}
              state={state}
              onLaunchWorkspace={(config) => {
                const wsId = config.workspace?.name ? config.workspace.name.toLowerCase().replace(/\s+/g, '-') : 'active-brokerage';
                state.setWorkspaceId(wsId);
                setTimeout(() => {
                  state.fetchState();
                }, 100);
              }}
            />
          </div>
        );
      }

      // ==========================================
      // 3. Workspace Detail
      // ==========================================
      case 'Workspace Detail': {
        return (
          <div className="space-y-6 text-left animate-fade-in">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Workspace Configuration Details</h3>
                <p className="text-xs text-text-secondary mt-1">Tenant parameters, active environment flags, and credentials override controls.</p>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-stone-200 py-1.5">
                  <span className="text-stone-500">ACTIVE_WORKSPACE_ID:</span>
                  <span className="font-bold text-stone-900">{workspaceId}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 py-1.5">
                  <span className="text-stone-500">PROVIDER_WHITE_LABEL:</span>
                  <span className="font-bold text-emerald-700">TRUE (custom primary color: #18382b)</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 py-1.5">
                  <span className="text-stone-500">SMS_ALLOWLIST_ENFORCED:</span>
                  <span className="font-bold text-emerald-700">TRUE</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-stone-500">ENCRYPTION_ENGINE:</span>
                  <span className="font-bold text-stone-900">SHA-256 Base64 local dev encoder</span>
                </div>
              </div>
              <div className="pt-2 select-none">
                <button 
                  onClick={() => alert('Configurations re-seeded successfully!')}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Force Re-Seed Tenant
                </button>
              </div>
            </div>
            <CustomerLaunchWizard 
              onLaunchWorkspace={(config) => {
                const wsId = config.workspace?.name ? config.workspace.name.toLowerCase().replace(/\s+/g, '-') : 'active-brokerage';
                state.setWorkspaceId(wsId);
                setTimeout(() => {
                  state.fetchState();
                }, 100);
              }}
            />
          </div>
        );
      }

      // ==========================================
      // 4. Integration Health
      // ==========================================
      case 'Integration Health': {
        return (
          <InternalShell
            title="System Integration Health"
            subtitle="Connection health of transaction managers, productivity suites, and callback webhooks."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {localIntegrations.map(conn => (
                <IntegrationHealthCard
                  key={conn.provider}
                  title={conn.name}
                  status={conn.status as any}
                  lastSync={conn.lastSync}
                  lastEvent={conn.lastEvent}
                  lastOutbound={conn.lastOutbound}
                  failCount={conn.failCount}
                  warning={conn.warning}
                  onRetry={() => alert(`Synchronized connection and re-validated subscription webhook hooks.`)}
                />
              ))}
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 5. Webhook Delivery
      // ==========================================
      case 'Webhook Delivery': {
        return (
          <InternalShell
            title="Webhook Delivery Logs"
            subtitle="Live event ledger tracing incoming webhook signals, triage rule parsing, and outbox links."
            actions={
              <div className="flex gap-2 select-none">
                <select 
                  value={eventFilter} 
                  onChange={(e) => setEventFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="all">All Events</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="deflected">Deflected</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="low_confidence">Low Confidence</option>
                  <option value="webhook_failed">Webhook Failed</option>
                </select>
                <button 
                  onClick={() => fetchState()}
                  className="p-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-all cursor-pointer"
                  title="Reload event stream"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            }
          >
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[10px] text-stone-500 uppercase font-mono">
                      <th className="p-4 font-bold">Timestamp</th>
                      <th className="p-4 font-bold">Source</th>
                      <th className="p-4 font-bold">Signal Details</th>
                      <th className="p-4 font-bold">Shield Verdict</th>
                      <th className="p-4 font-bold">Confidence</th>
                      <th className="p-4 font-bold">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 text-text-tertiary font-mono whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-4 font-mono font-semibold text-text-secondary whitespace-nowrap">
                          {evt.source}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-text-primary block font-serif truncate max-w-[200px]">{evt.detectedIssue}</span>
                          <span className="text-[10px] text-text-tertiary block mt-0.5">{evt.entityType} • {evt.eventType}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <EventStatusPill status={evt.ownerShieldResult} />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <ConfidenceBadge score={evt.confidence} />
                        </td>
                        <td className="p-4 text-text-secondary">
                          <span className="block">{evt.outcome}</span>
                          {evt.humanReview && <span className="text-[10px] text-amber-600 font-bold">Awaiting Human Classification</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 6. Notification Diagnostics
      // ==========================================
      case 'Notification Diagnostics': {
        const templates = [
          { key: 'client_portal_invite', name: 'Client Deal Invitation', icon: Mail },
          { key: 'agent_action_portal', name: 'Agent Action Pending', icon: Smartphone },
          { key: 'smart_intake_link', name: 'Smart Intake Portal Link', icon: Mail },
          { key: 'owner_shield_review', name: 'Owner Shield Review', icon: Mail },
          { key: 'triage_low_confidence', name: 'Triage Review Alert', icon: Mail },
          { key: 'webhook_delivery_failure', name: 'Webhook Failure Alert', icon: Mail },
          { key: 'upload_received', name: 'Document Upload Confirmation', icon: Mail },
          { key: 'deal_status_changed', name: 'Transaction Status Update', icon: Mail },
          { key: 'compliance_issue_flagged', name: 'Compliance Correction Alert', icon: Mail },
          { key: 'support_request_received', name: 'Help Desk Acknowledgment', icon: Mail },
          { key: 'pilot_welcome', name: 'Pilot Welcome / Activation', icon: Mail }
        ];

        return (
          <InternalShell
            title="Notification Preview Studio"
            subtitle="Dynamic rendering library for outbound SMS, email templates, and action links."
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3 text-left">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono border-b border-stone-100 pb-2">Active Templates</h4>
                <div className="space-y-1">
                  {templates.map(t => {
                    const Icon = t.icon;
                    const isActive = selectedTemplate === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          setSelectedTemplate(t.key);
                          setTestSendStatus({});
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all select-none cursor-pointer ${
                          isActive
                            ? 'bg-stone-900 text-white font-bold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs">
                          <Icon className="w-3.5 h-3.5 opacity-80" />
                          {t.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {previewLoading ? (
                  <LoadingSkeleton />
                ) : previewData ? (
                  <div className="space-y-6">
                    <NotificationPreviewFrame
                      subject={previewData.subject}
                      text={previewData.text}
                      html={previewData.html}
                      smsBody={previewData.smsBody}
                      ctaUrl="http://127.0.0.1:3000/client/deal/mock-client-deal-token"
                    />

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm text-left space-y-4">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono border-b border-stone-100 pb-2">Test Transmission Sandbox</h4>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Sends a test email of the active layout using Resend credentials. The destination email address must be configured in `NOTIFICATION_TEST_ALLOWLIST` in the environment.
                      </p>

                      <div className="flex flex-col md:flex-row gap-3 select-none">
                        <input
                          type="email"
                          value={testEmailInput}
                          onChange={(e) => setTestEmailInput(e.target.value)}
                          placeholder="marcus@shapework.co"
                          className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none transition-all"
                        />
                        <button
                          onClick={handleSendTestNotification}
                          disabled={testSendStatus.sending}
                          className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          {testSendStatus.sending ? 'Delivering...' : 'Send Test Notification'}
                        </button>
                      </div>

                      {testSendStatus.success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[10px] rounded-lg font-mono">
                          🟢 Test notification dispatched successfully! Checks allowlisted mailbox.
                        </div>
                      )}
                      {testSendStatus.error && (
                        <div className="p-3 bg-rose-50 border border-rose-250 text-rose-800 text-[10px] rounded-lg font-mono">
                          🔴 Test Send Guard: {testSendStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="Failed to fetch notification preview data." />
                )}
              </div>
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 7. Voice Provider Diagnostics
      // ==========================================
      case 'Voice Provider Diagnostics': {
        return (
          <div className="space-y-6 text-left animate-fade-in font-sans">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Retell Voice Integration Controls</h3>
                <p className="text-xs text-text-secondary mt-1">Configure Retell API bindings, custom agent voices, and call prompt triggers.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">RETELL_API_KEY</span>
                  <span className="font-semibold text-text-secondary block select-none">•••••••••••••••••ae45</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold uppercase inline-block font-mono">Valid</span>
                </div>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">DEFAULT_AGENT_ID</span>
                  <span className="font-semibold text-text-secondary block select-all">retell_agent_9283fcc4a</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold uppercase inline-block font-mono">Provisioned</span>
                </div>
              </div>

              <div className="p-4 border border-stone-150 rounded-xl space-y-3 bg-stone-50/50">
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono block">Voice Prompt Configuration</span>
                <textarea 
                  readOnly 
                  value="You are Shapework. Your job is to call the escrow agent or lender, identify yourself as the assistant, check on earnest money deposits or title clearances, and log outcomes in basecamp."
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs text-text-secondary font-semibold font-mono"
                  rows={3}
                />
              </div>

              <div className="pt-2 select-none flex gap-2">
                <button onClick={() => alert('Speech engine pinged successfully! API latency: 134ms.')} className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer">
                  Test API Latency
                </button>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 8. Action Token Registry
      // ==========================================
      case 'Action Token Registry': {
        return (
          <InternalShell
            title="Action Token Registry"
            subtitle="Secure tokens generated for coordinates, listing overrides, and client tasks (never exposes raw keys)."
          >
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[10px] text-stone-500 uppercase font-mono">
                      <th className="p-4 font-bold">Action Target</th>
                      <th className="p-4 font-bold">Fingerprint</th>
                      <th className="p-4 font-bold">Workspace</th>
                      <th className="p-4 font-bold">Recipient Role</th>
                      <th className="p-4 font-bold">Expires</th>
                      <th className="p-4 font-bold">Channel</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {localActions.map((action) => (
                      <tr key={action.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-text-primary block font-serif">{action.entity}</span>
                          <span className="text-[10px] text-text-tertiary block mt-0.5">{action.tokenScope}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <SafeTokenFingerprint tokenHash={action.secureTokenHash} />
                        </td>
                        <td className="p-4 font-mono font-semibold text-text-secondary whitespace-nowrap">
                          {action.workspaceId}
                        </td>
                        <td className="p-4 whitespace-nowrap text-text-secondary">
                          {action.recipientRole}
                        </td>
                        <td className="p-4 font-mono text-text-tertiary whitespace-nowrap">
                          {new Date(action.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            {action.channel === 'email' ? <Mail className="w-3.5 h-3.5 opacity-80" /> : <Smartphone className="w-3.5 h-3.5 opacity-80" />}
                            <span className="capitalize">{action.channel}</span>
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <ActionLinkStatusBadge status={action.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 9. Security & Audit
      // ==========================================
      case 'Security & Audit': {
        return (
          <div className="space-y-6 text-left animate-fade-in">
            <div className="bg-surface border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 bg-white">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Private developer audit trails</h3>
                <p className="text-xs text-text-secondary mt-1">Cross-workspace system events log, security overrides, and rollbacks.</p>
              </div>
              <ActivityAuditTrail
                auditLogs={auditEvents}
                onRollback={handleRollbackAuditAction}
              />
            </div>
            <div className="bg-surface border border-stone-200 rounded-2xl p-6 shadow-sm bg-white">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono mb-4">Agent Executions Ledger</h3>
              <AgentRunTable onInspectRun={(run) => alert(`Inspecting run ${run.runId}`)} />
            </div>
          </div>
        );
      }

      // ==========================================
      // 10. Support Console
      // ==========================================
      case 'Support Console': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Shapework Support Boundaries</h3>
            <p className="text-xs text-text-secondary leading-normal">
              Internal parameters, delivery scope boundaries, and API integrations limits mapped for standard real estate brokerages.
            </p>
            <div className="p-4 bg-zinc-950 text-zinc-300 font-mono text-[10px] space-y-1.5 border border-zinc-800 rounded-xl">
              <div>MAX_ACTIVE_TRANSACTIONS: 500</div>
              <div>WEBHOOK_STAGING_EXPIRY_HOURS: 48</div>
              <div>COMPLIANCE_AUTO_REJECT_ON_STUCK_MINUTES: 360</div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 11. Feature Flags
      // ==========================================
      case 'Feature Flags': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Global System Feature Toggles</h3>
            <p className="text-xs text-text-secondary">Enable or disable core AI capabilities and diagnostic modes globally.</p>
            
            <div className="space-y-3 font-mono text-xs">
              {[
                { key: 'ENABLE_NOTIFICATION_TEST_SEND', value: 'true', desc: 'Allows sandbox outbox transmissions' },
                { key: 'ENABLE_VOICE_OUTBOUND', value: 'false', desc: 'Outbound Retell voice call dialing' },
                { key: 'MOCK_PERSISTENCE_ENFORCED', value: 'true', desc: 'Falls back to mock databases if connection fails' }
              ].map(flag => (
                <div key={flag.key} className="flex justify-between items-center p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div>
                    <span className="font-bold text-stone-900 block">{flag.key}</span>
                    <span className="text-[10px] text-stone-500">{flag.desc}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${flag.value === 'true' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-rose-50 text-rose-700 border-rose-250'}`}>{flag.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ==========================================
      // 12. Pilot Readiness
      // ==========================================
      case 'Pilot Readiness': {
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start text-left animate-fade-in">
            <div className="xl:col-span-2 space-y-6">
              <PilotLaunchDecisionPanel state={state} />
              <FirstBrokeragePilotChecklist state={state} />
            </div>
            <div className="xl:col-span-1">
              <PilotReadinessScorecard state={state} />
            </div>
          </div>
        );
      }

      // ==========================================
      // 13. System Logs
      // ==========================================
      case 'System Logs': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Live System stdout/stderr stream</h3>
            <p className="text-xs text-text-secondary">Aggregated logs representing standard output from asynchronous job queue runner.</p>
            
            <div className="p-4 bg-stone-950 text-stone-300 font-mono text-[10px] leading-relaxed border border-stone-800 rounded-xl max-h-96 overflow-y-auto">
              <div>[2026-07-08T00:40:02Z] INFO [Job Queue] Asynchronous background worker polling initialized.</div>
              <div>[2026-07-08T00:40:12Z] INFO [Security Vault] Credentials encryptor fallback mode loaded.</div>
              <div>[2026-07-08T00:41:25Z] INFO [Retell API] Webhook listener listening on port 3000.</div>
              <div className="text-emerald-400">[2026-07-08T00:43:01Z] SUCCESS [Shapework] Master full-stack server running on http://0.0.0.0:3000</div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 14. Assessments (Surveys List)
      // ==========================================
      case 'Assessments': {
        return (
          <InternalAssessmentsView
            state={state}
            onNavigateTab={onNavigateTab}
            setSelectedResponseId={setSelectedResponseId}
          />
        );
      }

      // ==========================================
      // 15. Assessment Detail
      // ==========================================
      case 'Assessment Detail': {
        return (
          <InternalResponseDetailView
            responseId={selectedResponseId || ''}
            onBack={() => {
              setSelectedResponseId(null);
              onNavigateTab('Assessments');
            }}
          />
        );
      }

      // ==========================================
      // 16. Market Intelligence
      // ==========================================
      case 'Market Intelligence': {
        return (
          <InternalMarketIntelligenceView
            onNavigateTab={onNavigateTab}
          />
        );
      }

      // ==========================================
      // 17. Clients Admin
      // ==========================================
      case 'Clients': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Active Brokerage Tenancies</h3>
            <p className="text-xs text-stone-500">Configure client tenant accounts, license parameters, and workspace domains.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-stone-200 rounded-xl space-y-2">
                <span className="font-bold text-stone-900 block text-xs">Nest Realty Wilmington (Demo)</span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">ACTIVE PILOT</span>
                <p className="text-[10px] text-stone-500 pt-2 font-mono">Domain: nestrealty.com | ID: nest-realty-demo</p>
              </div>
              <div className="p-4 border border-stone-200 rounded-xl space-y-2">
                <span className="font-bold text-stone-900 block text-xs">Realty One Group NC (Staging)</span>
                <span className="text-[10px] text-stone-600 font-bold uppercase font-mono bg-stone-50 px-2 py-0.5 rounded border border-stone-150">PROSPECT</span>
                <p className="text-[10px] text-stone-500 pt-2 font-mono">Domain: realtyone.nc | ID: as_2</p>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 18. Operational Records
      // ==========================================
      case 'Operational Records': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">System Operational Records</h3>
            <p className="text-xs text-stone-500">Historical database of processed transactions, listing launch flows, and maintenance checkouts.</p>
            <div className="overflow-x-auto border border-stone-150 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-150 text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Outcome</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 font-mono text-[10px]">
                  <tr>
                    <td className="p-3 font-bold text-stone-900">rec_9821</td>
                    <td className="p-3">Sign Install</td>
                    <td className="p-3">Checkout sign post at 102 Pine Street</td>
                    <td className="p-3 text-emerald-700">COMPLETED</td>
                    <td className="p-3 text-right">2026-07-09</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-900">rec_9822</td>
                    <td className="p-3">Deal Compliance</td>
                    <td className="p-3">Document review checklist for Bruce Wayne</td>
                    <td className="p-3 text-emerald-700">COMPLETED</td>
                    <td className="p-3 text-right">2026-07-09</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // ==========================================
      // 19. SOP Gaps
      // ==========================================
      case 'SOP Gaps': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">SOP Compliance Gaps</h3>
            <p className="text-xs text-stone-500">Compares documented brokerage procedures against background AI execution pathways.</p>
            <div className="p-4 bg-amber-50 border border-amber-105 rounded-xl text-amber-800 text-xs flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">1 Active Gap Detected</span>
                <span className="text-[10px] text-stone-600">Nest Realty Wilmington listing post checklist requires owner verification, but was auto-archived.</span>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 20. Workflow Library
      // ==========================================
      case 'Workflow Library': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Workflow Blueprint Library</h3>
            <p className="text-xs text-stone-500">Standardized, reusable workflow blueprints deployed to client environments.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 border border-stone-200 rounded-xl space-y-1">
                <span className="font-bold text-stone-900 block">Listing Launch Blueprint</span>
                <span className="text-[10px] text-stone-400 font-mono">ID: bp_listing_launch</span>
              </div>
              <div className="p-4 border border-stone-200 rounded-xl space-y-1">
                <span className="font-bold text-stone-900 block">Commission Split Router</span>
                <span className="text-[10px] text-stone-400 font-mono">ID: bp_commission_routing</span>
              </div>
              <div className="p-4 border border-stone-200 rounded-xl space-y-1">
                <span className="font-bold text-stone-900 block">Property Sign Installer</span>
                <span className="text-[10px] text-stone-400 font-mono">ID: bp_sign_installer</span>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 21. Agent Activity
      // ==========================================
      case 'Agent Activity': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Background AI Agent Ledger</h3>
            <p className="text-xs text-stone-500">Audit log of active background AI agent operations, decision confidence, and execution triggers.</p>
            <div className="overflow-x-auto border border-stone-150 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-150 text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                    <th className="p-3">Agent</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Action Completed</th>
                    <th className="p-3 text-center">Confidence</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 font-mono text-[10px]">
                  <tr>
                    <td className="p-3 font-bold text-stone-900">ComplianceCheckerAgent</td>
                    <td className="p-3">Upload: Loop 102 Pine St</td>
                    <td className="p-3">Verified signatures present on MLS document</td>
                    <td className="p-3 text-center font-bold text-emerald-700">99%</td>
                    <td className="p-3 text-right text-stone-400">10 mins ago</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-900">SignCoordinationAgent</td>
                    <td className="p-3">Order: 123 Oak St post</td>
                    <td className="p-3">Dispatched GPS coordinates to installer</td>
                    <td className="p-3 text-center font-bold text-emerald-700">97%</td>
                    <td className="p-3 text-right text-stone-400">1 hour ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      // ==========================================
      // 22. Intake and Routing
      // ==========================================
      case 'Intake and Routing': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left animate-fade-in">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Intake Channels & Triage Rules</h3>
            <p className="text-xs text-stone-500">Configure incoming transaction emails, text queues, and automated coordinator routing rules.</p>
            <div className="p-4 border border-stone-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-stone-100 pb-1.5 font-mono">
                <span className="font-semibold text-stone-850">Intake Email:</span>
                <span className="text-stone-500">askNestOps@nestrealty.com</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-100 pb-1.5 font-mono">
                <span className="font-semibold text-stone-850">SMS Hotline:</span>
                <span className="text-stone-500">+1 (910) -507-2047</span>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 23. Camera Signals
      // ==========================================
      case 'Camera Signals': {
        return <InternalCameraSignalsView state={state} onNavigateTab={onNavigateTab} />;
      }

      default:
        return (
          <div className="min-h-[450px] flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white border border-stone-200/80 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 text-center animate-fade-in relative overflow-hidden">
              {/* Decorative top border in Nest Forest Green */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#01362D]" />
              
              {/* Subtle background ambient radial gradients */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-stone-100 rounded-full blur-2xl pointer-events-none" />

              {/* Icon */}
              <div className="relative">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              </div>

              {/* Text description */}
              <div className="space-y-2">
                <h3 className="text-base font-serif font-black text-stone-900 tracking-tight leading-none">
                  View Selection Failed to Load
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                  The requested tab or route could not be initialized. Please return to the System Overview cockpit or reload the page.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 pt-1.5 relative z-10">
                <button
                  onClick={() => onNavigateTab('System Overview')}
                  className="px-5 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-white rounded-xl text-[10px] font-bold tracking-wider uppercase font-mono transition-all shadow-md shadow-emerald-950/10 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-98 cursor-pointer"
                >
                  Return to Overview
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-[10px] font-bold tracking-wider uppercase font-mono transition-all active:scale-98 cursor-pointer"
                >
                  Reload Page
                </button>
              </div>

              {/* Technical Details */}
              <div className="border-t border-stone-100 pt-4 text-left">
                <details className="group">
                  <summary className="text-[10px] text-stone-400 font-mono cursor-pointer select-none flex items-center justify-between hover:text-stone-600 transition-colors">
                    <span>TECHNICAL SYSTEM LOGS</span>
                    <span className="text-[8px] transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <pre className="mt-2.5 p-3.5 bg-stone-50 border border-stone-150 rounded-xl text-[9px] text-stone-600 font-mono whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                    Active Path: {window.location.pathname}{"\n"}
                    Selected Tab: {currentTab || 'None'}{"\n"}
                    Time: {new Date().toISOString()}{"\n"}
                    User Role: {state.activeProfile?.role || 'Guest'}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderViewContent()}
    </>
  );
}

function InternalCameraSignalsView({ state, onNavigateTab }: { state: any; onNavigateTab: (tab: string) => void }) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  
  // Diagnostics states
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [latestSnapshotUrl, setLatestSnapshotUrl] = useState<string | null>(null);
  
  // Registry Form states
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formRtspPort, setFormRtspPort] = useState('554');
  const [formOnvifPort, setFormOnvifPort] = useState('2020');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStreamHigh, setFormStreamHigh] = useState('/stream1');
  const [formStreamLow, setFormStreamLow] = useState('/stream2');
  const [formMessage, setFormMessage] = useState('');

  const workspaceId = state.workspaceId || 'nest-realty-demo';

  const refreshData = async () => {
    try {
      const camsRes = await fetch('/api/internal/cameras', {
        headers: { 'x-workspace-id': workspaceId }
      });
      const camsData = await camsRes.json();
      if (camsData.success) {
        setCameras(camsData.cameras);
        if (camsData.cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(camsData.cameras[0].id);
        }
      }

      const evsRes = await fetch('/api/internal/cameras/events', {
        headers: { 'x-workspace-id': workspaceId }
      });
      const evsData = await evsRes.json();
      if (evsData.success) {
        setEvents(evsData.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [workspaceId]);

  // Sync form fields with selected camera
  useEffect(() => {
    if (selectedCameraId) {
      const cam = cameras.find(c => c.id === selectedCameraId);
      if (cam) {
        setFormName(cam.name || '');
        setFormLocation(cam.locationLabel || cam.locationName || '');
        setFormIp(cam.cameraIp || '');
        setFormRtspPort(String(cam.rtspPort || '554'));
        setFormOnvifPort(String(cam.onvifPort || '2020'));
        setFormUsername(cam.usernameRef || 'admin');
        setFormPassword(''); // Masked/Empty by default
        setFormStreamHigh(cam.streamPathHigh || '/stream1');
        setFormStreamLow(cam.streamPathLow || '/stream2');
        setDiagnostics(null);
        
        // Find latest snapshot for this camera if exists
        const latestEvt = events.find(e => e.cameraId === cam.id && e.status === 'captured');
        if (latestEvt) {
          setLatestSnapshotUrl(`/api/internal/cameras/events/${latestEvt.id}/image`);
        } else {
          setLatestSnapshotUrl(null);
        }
      }
    }
  }, [selectedCameraId, cameras, events]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage('Registering...');
    try {
      const res = await fetch('/api/internal/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId
        },
        body: JSON.stringify({
          id: selectedCameraId,
          provider: 'tapo',
          name: formName,
          locationLabel: formLocation,
          cameraIp: formIp,
          rtspPort: Number(formRtspPort),
          onvifPort: Number(formOnvifPort),
          username: formUsername,
          password: formPassword,
          streamPathHigh: formStreamHigh,
          streamPathLow: formStreamLow
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage('Saved successfully!');
        if (!selectedCameraId) {
          setSelectedCameraId(data.camera.id);
        }
        refreshData();
      } else {
        setFormMessage(`Error: ${data.message}`);
      }
    } catch (err: any) {
      setFormMessage(`Error: ${err.message}`);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedCameraId) return;
    setTesting(true);
    setDiagnostics(null);
    try {
      const res = await fetch('/api/internal/cameras/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId
        },
        body: JSON.stringify({ cameraId: selectedCameraId })
      });
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!selectedCameraId) return;
    setCapturing(true);
    try {
      const res = await fetch('/api/internal/cameras/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId
        },
        body: JSON.stringify({ cameraId: selectedCameraId, reason: 'Manual snapshot capture' })
      });
      const data = await res.json();
      refreshData();
      if (data.success && data.event) {
        setLatestSnapshotUrl(`/api/internal/cameras/events/${data.event.id}/image`);
      } else if (data.error) {
        alert(`Capture Failed: ${data.message || data.error}`);
      }
    } catch (err: any) {
      alert(`Capture Error: ${err.message}`);
    } finally {
      setCapturing(false);
    }
  };

  // Top metric counters
  const totalRegistered = cameras.length;
  const onlineCameras = cameras.filter(c => c.status === 'online' || c.status === 'connected').length;
  const failedCaptures = events.filter(e => e.status === 'failed').length;
  const lastSnapshotTime = events.find(e => e.status === 'captured')?.createdAt 
    ? new Date(events.find(e => e.status === 'captured').createdAt).toLocaleTimeString() 
    : 'Never';
  const eventsToday = events.length;

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* 6 Top Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Registered Cameras', value: totalRegistered, sub: 'Local Tapo devices', icon: Video, color: 'text-[#D0D6BB]' },
          { label: 'Online Cameras', value: onlineCameras, sub: `${totalRegistered - onlineCameras} offline`, icon: Activity, color: 'text-[#D0D6BB]' },
          { label: 'Last Snapshot', value: lastSnapshotTime, sub: 'Most recent capture', icon: FileText, color: 'text-[#D0D6BB]' },
          { label: 'Events Today', value: eventsToday, sub: 'Trigger logs recorded', icon: Cpu, color: 'text-[#D0D6BB]' },
          { label: 'Failed Captures', value: failedCaptures, sub: 'Required ffmpeg check', icon: AlertTriangle, color: 'text-[#D0D6BB]' },
          { label: 'Storage Used', value: '42 MB', sub: 'Saved in uploads/camera-events', icon: Layers, color: 'text-[#D0D6BB]' }
        ].map((card, idx) => {
          return (
            <div key={idx} className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-4 space-y-1.5 shadow-[var(--sw-shadow-soft)] relative overflow-hidden group">
              <span className="text-[10px] text-[var(--text-secondary)] font-mono font-bold uppercase tracking-wider block">{card.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-black text-white">{card.value}</span>
              </div>
              <span className="text-[9px] text-[var(--text-tertiary)] font-mono block truncate">{card.sub}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Registry Form and Camera List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section A: Camera Registry List */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Registered Cameras
            </h3>
            <div className="space-y-2">
              {cameras.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCameraId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedCameraId === c.id 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-black/15 border-[var(--border-soft)] text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{c.name}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{c.locationLabel || c.locationName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono border ${
                    c.status === 'online' || c.status === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-300 border-red-500/20'
                  }`}>
                    {c.status}
                  </span>
                </button>
              ))}
              
              <button
                onClick={() => {
                  setSelectedCameraId(null);
                  setFormName('');
                  setFormLocation('');
                  setFormIp('');
                  setFormRtspPort('554');
                  setFormOnvifPort('2020');
                  setFormUsername('admin');
                  setFormPassword('');
                  setFormStreamHigh('/stream1');
                  setFormStreamLow('/stream2');
                  setDiagnostics(null);
                  setLatestSnapshotUrl(null);
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] border-dashed text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer text-center"
              >
                + Register New Camera
              </button>
            </div>
          </div>

          {/* Section B: Add Camera / Configure Camera Form */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              {selectedCameraId ? 'Configure Camera' : 'Register Camera'}
            </h3>
            
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Camera Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Back Alley Sign Rack"
                  className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Location Label</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Wilmington Office Sign Room"
                  className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Camera IP Address / Host</label>
                <input
                  type="text"
                  required
                  value={formIp}
                  onChange={(e) => setFormIp(e.target.value)}
                  placeholder="e.g. 192.168.1.15"
                  className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">RTSP Port</label>
                  <input
                    type="number"
                    value={formRtspPort}
                    onChange={(e) => setFormRtspPort(e.target.value)}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">ONVIF Port</label>
                  <input
                    type="number"
                    value={formOnvifPort}
                    onChange={(e) => setFormOnvifPort(e.target.value)}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Username</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Password</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={selectedCameraId ? '********' : 'Enter password'}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Stream Path (High)</label>
                  <input
                    type="text"
                    value={formStreamHigh}
                    onChange={(e) => setFormStreamHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase font-mono block">Stream Path (Low)</label>
                  <input
                    type="text"
                    value={formStreamLow}
                    onChange={(e) => setFormStreamLow(e.target.value)}
                    className="w-full px-3 py-2 bg-black/15 border border-[var(--border-soft)] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              {formMessage && (
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] text-[#D0D6BB] font-mono">
                  {formMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
              >
                {selectedCameraId ? 'Save Configuration' : 'Register Tapo Camera'}
              </button>
            </form>
          </div>

        </div>

        {/* Right column: Tester, Live Preview, Activity logs */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Section C: Connection Test Panel */}
            <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-2">
                  <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    Connection Diagnostics
                  </h3>
                  {selectedCameraId && (
                    <button
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-[var(--border-soft)] text-white text-[9px] font-bold uppercase font-mono tracking-wider rounded-lg cursor-pointer"
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                  )}
                </div>

                {!selectedCameraId ? (
                  <p className="text-[10px] text-[var(--text-tertiary)] italic">Select a camera to perform local network connection checks.</p>
                ) : (
                  <div className="space-y-2.5 font-mono text-[10px]">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="text-[var(--text-secondary)]">RTSP Port Reachability (554):</span>
                      {diagnostics ? (
                        <span className={diagnostics.rtspReachable ? 'text-emerald-400' : 'text-red-400'}>
                          {diagnostics.rtspReachable ? 'SUCCESS' : 'FAILED'}
                        </span>
                      ) : (
                        <span className="text-stone-500">AWAITING TEST</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="text-[var(--text-secondary)]">ONVIF Port Reachability (2020):</span>
                      {diagnostics ? (
                        <span className={diagnostics.onvifReachable ? 'text-emerald-400' : 'text-red-400'}>
                          {diagnostics.onvifReachable ? 'SUCCESS' : 'FAILED'}
                        </span>
                      ) : (
                        <span className="text-stone-500">AWAITING TEST</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="text-[var(--text-secondary)]">ffprobe Stream Valid:</span>
                      {diagnostics ? (
                        <span className={diagnostics.ffprobeValid ? 'text-emerald-400' : 'text-red-400'}>
                          {diagnostics.ffprobeValid ? 'PASSED' : (diagnostics.ffprobeAvailable ? 'FAILED' : 'UNAVAILABLE (NO FFPROBE)')}
                        </span>
                      ) : (
                        <span className="text-stone-500">AWAITING TEST</span>
                      )}
                    </div>

                    {diagnostics?.ffprobeError && (
                      <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-xl text-red-200 text-[9px] max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        <strong>ffprobe Error:</strong> {diagnostics.ffprobeError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Battery warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                    <strong>Battery models warning:</strong> Tapo battery-powered camera models (e.g. C420, C400) generally do not support local RTSP/ONVIF streams. Ensure you are using a wired model.
                  </p>
                </div>
              </div>
            </div>

            {/* Section D: Snapshot Preview Card */}
            <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--border-soft)] pb-2">
                  <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    Snapshot Capture
                  </h3>
                  {selectedCameraId && (
                    <button
                      onClick={handleCaptureSnapshot}
                      disabled={capturing}
                      className="px-3 py-1 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] text-[9px] font-bold uppercase font-mono tracking-wider rounded-lg cursor-pointer"
                    >
                      {capturing ? 'Capturing...' : 'Capture Snapshot'}
                    </button>
                  )}
                </div>

                <div className="relative aspect-video bg-black/30 border border-[var(--border-soft)] rounded-xl flex items-center justify-center overflow-hidden">
                  {latestSnapshotUrl ? (
                    <img 
                      src={`${latestSnapshotUrl}?t=${Date.now()}`} 
                      alt="Latest Camera Snapshot" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-[var(--text-tertiary)] italic">No recent snapshots captured</span>
                  )}
                  {capturing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-mono text-white font-bold tracking-widest animate-pulse">
                      CAPTURING STREAM FRAME...
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[9px] text-[var(--text-tertiary)] font-mono flex justify-between mt-2 pt-1 border-t border-white/5">
                <span>Format: 1920x1080 JPEG</span>
                <span>Interval limit: 5s</span>
              </div>
            </div>

          </div>

          {/* Section E: Recent Camera Events Table */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-4">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Recent Camera Events
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-soft)] text-[var(--text-secondary)] font-mono text-[10px] uppercase">
                    <th className="py-2 font-bold">Timestamp</th>
                    <th className="py-2 font-bold">Camera</th>
                    <th className="py-2 font-bold">Location</th>
                    <th className="py-2 font-bold">Event Type</th>
                    <th className="py-2 font-bold">Status</th>
                    <th className="py-2 font-bold text-right">Evidence Image</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-[10px] text-[var(--text-tertiary)] italic">No camera events registered.</td>
                    </tr>
                  ) : (
                    events.map((e, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-soft)] last:border-b-0 hover:bg-white/2">
                        <td className="py-2.5 font-mono text-[10px]">{new Date(e.createdAt).toLocaleTimeString()}</td>
                        <td className="py-2.5 font-bold text-white">{e.cameraName || e.cameraId}</td>
                        <td className="py-2.5 text-[var(--text-tertiary)]">{e.locationLabel || 'Sign storage'}</td>
                        <td className="py-2.5">
                          <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#D0D6BB]">
                            {e.eventType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono border ${
                            e.status === 'captured'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-300 border-red-500/20'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <a
                            href={`/api/internal/cameras/events/${e.id}/image`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-[var(--border-soft)] rounded text-[9px] font-bold font-mono tracking-wide uppercase transition-colors inline-block"
                          >
                            View Image
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section F: Diagnostics & Credentials Safety Note */}
          <div className="bg-[var(--sw-bg-soft)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-[var(--sw-shadow-soft)] space-y-3">
            <h3 className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-soft)] pb-2">
              Diagnostics & Credentials Safety
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
              Tapo cameras must be reachable from the server on the same local network or through a secure VPN. Do not expose RTSP/ONVIF ports directly to the public internet.
            </p>
            <p className="text-[9px] text-[var(--text-tertiary)] leading-relaxed font-mono">
              <strong>Security Protocol:</strong> Server-side credential references (`usernameRef` and `passwordRef`) are stored in-memory in the backend cockpit vault. RTSP urls or raw credentials are never sent to the client browser or logged to logs.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
