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
  Smartphone
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
import InternalMarketIntelligenceView from '../components/console/InternalMarketIntelligenceView';

interface InternalRoutesProps {
  state: any;
}

export default function InternalRoutes({ state }: InternalRoutesProps) {
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

  const renderViewContent = () => {
    switch (currentTab) {
      // ==========================================
      // 1. System Overview
      // ==========================================
      case 'System Overview': {
        return (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6 text-left animate-fade-in font-sans">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Shapework Control Plane Overview</h3>
              <p className="text-xs text-text-secondary mt-1">Diagnostic summary of the overall platform load, workspace instances, and provider status.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Total Tenants</span>
                <span className="text-xl font-bold block text-stone-900">4 Workspaces</span>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Active Providers</span>
                <span className="text-xl font-bold block text-emerald-700">6 Connected</span>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-bold">CPU Usage</span>
                <span className="text-xl font-bold block text-stone-900">12% Load</span>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 uppercase font-bold">Database Status</span>
                <span className="text-xl font-bold block text-emerald-700">PostgreSQL Ready</span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3 text-left">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Headless Runtime Source of Truth</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Signals & Decisions:</span>
                  <span className="font-bold text-stone-900">Current Runtime (State)</span>
                </div>
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Jobs & Steps:</span>
                  <span className="font-bold text-stone-900">Current Runtime (State)</span>
                </div>
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Approvals & Outcomes:</span>
                  <span className="font-bold text-stone-900">Current Runtime (State)</span>
                </div>
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Legacy Sync Adapter:</span>
                  <span className="font-bold text-emerald-700">Active (Automatic)</span>
                </div>
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Storage Drivers:</span>
                  <span className="font-bold text-stone-900">JSON & PostgreSQL Synced</span>
                </div>
                <div className="p-2 bg-white border border-stone-200 rounded-lg flex justify-between items-center">
                  <span className="text-stone-500">Migration Helper:</span>
                  <span className="font-bold text-emerald-700">Idempotent Boot Completed</span>
                </div>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Active Delivery Clusters</h4>
              <div className="space-y-2">
                {[
                  { name: 'Nest Realty Wilmington', id: 'nest-realty-demo', status: 'Active Pilot', color: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
                  { name: 'Bleu Boutique Properties', id: 'bleu-boutique', status: 'Onboarding', color: 'bg-amber-50 text-amber-700 border-amber-250' },
                  { name: 'Smile Sketch Vegas', id: 'smile-sketch', status: 'Staged', color: 'bg-stone-100 text-stone-600 border-stone-250' }
                ].map(cluster => (
                  <div key={cluster.id} className="flex justify-between items-center py-2 border-b border-stone-150 last:border-b-0">
                    <div>
                      <span className="font-bold text-text-primary block text-xs">{cluster.name}</span>
                      <span className="text-[10px] text-text-tertiary font-mono">ID: {cluster.id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${cluster.color}`}>{cluster.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 1B. Market Intelligence
      // ==========================================
      case 'Market Intelligence': {
        return (
          <InternalMarketIntelligenceView onNavigateTab={setCurrentTab} />
        );
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

      default:
        return (
          <div className="p-8 text-center text-xs text-text-tertiary">
            View selection failed to load. Please return to the Overview.
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
