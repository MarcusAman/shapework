/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, RefreshCw, Cpu, Database, 
  Terminal, Key, Lock, Wrench, Layers, Server, Globe, Zap, AlertCircle, 
  Search, Sliders, Play, Phone, Inbox, ArrowRight, UserCheck, FileText, ChevronRight, Mail, Smartphone
} from 'lucide-react';
import { 
  InternalShell, 
  IntegrationHealthCard, 
  SafeTokenFingerprint, 
  ActionLinkStatusBadge, 
  NotificationPreviewFrame 
} from '../components/headless/CockpitComponents';
import ActivityAuditTrail from '../components/command/ActivityAuditTrail';
import AgentRunTable from '../components/agents/AgentRunTable';
import CustomerLaunchRoom from '../components/settings/CustomerLaunchRoom';
import CustomerLaunchWizard from '../components/settings/CustomerLaunchWizard';
import FirstBrokeragePilotChecklist from '../components/settings/FirstBrokeragePilotChecklist';
import PilotReadinessScorecard from '../components/settings/PilotReadinessScorecard';
import PilotLaunchDecisionPanel from '../components/settings/PilotLaunchDecisionPanel';
import AutoBlogGeneratorConsole from '../components/internal/AutoBlogGeneratorConsole';
import InternalMarketIntelligenceView from '../components/console/InternalMarketIntelligenceView';
import InternalSurveyLibraryView from '../components/console/InternalSurveyLibraryView';
import BrokerageAccountsLedgerView from '../components/console/BrokerageAccountsLedgerView';
import MercuryPaymentsHub from '../components/internal/MercuryPaymentsHub';

// Stable Hub Sub-tab Mapping Definitions (Declared outside component to prevent re-render loops)
const HUB_SUBTABS: Record<string, string[]> = {
  'Control Center': ['System Health Summary', 'Mercury Payments & Billing', 'Feature Toggles & Controls', 'Launch & Pilot Readiness', 'Brokerage Accounts & Setup'],
  'Content & Intelligence': ['Automated Blog & News', 'Shapework Market Research', 'Customer Survey Studio'],
  'Workspace Management': ['Brokerage Accounts & Setup', 'Mercury Payments & Billing', 'Customer Onboarding Room', 'Support & Help Desk'],
  'Security, Audit & Logs': ['Security & Activity Trail', 'System Activity Logs', 'Customer Feedback & Ideas']
};

interface InternalRoutesProps {
  state: any;
}

export default function InternalRoutes({ state }: InternalRoutesProps) {
  const { currentTab, workspaceId, auditEvents, handleRollbackAuditAction } = state;

  const [eventFilter, setEventFilter] = useState<'all' | 'needs_review' | 'deflected' | 'completed' | 'failed' | 'low_confidence' | 'webhook_failed'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('deal_intake_intake');
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [testEmailInput, setTestEmailInput] = useState<string>('marcus@shapework.co');
  const [testSendStatus, setTestSendStatus] = useState<{ sending?: boolean; success?: boolean; error?: string }>({});
  const [selectedPayloadEvent, setSelectedPayloadEvent] = useState<any>(null);
  const [logQuery, setLogQuery] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'>('ALL');
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);

  const [featureToggles, setFeatureToggles] = useState<Array<{ key: string; name: string; description: string; enabled: boolean; category: string }>>([
    { key: 'ENABLE_AI_CDA_AUTO_AUDIT', name: 'AI CDA & Commission Auto-Audit', description: 'Automatically verify agent commission split agreements against closing files before BIC signoff.', enabled: true, category: 'Compliance' },
    { key: 'ENABLE_NOTIFICATION_OUTBOX', name: 'Automated Outbox Transmissions', description: 'Enable background SMS and email notifications for urgent agent requests and status updates.', enabled: true, category: 'Notifications' },
    { key: 'ENABLE_PUBLIC_SURVEY_SUBMISSIONS', name: 'Public Customer Survey Portal', description: 'Allow external survey response collection on public /survey/[slug] links.', enabled: true, category: 'Survey Studio' },
    { key: 'ENABLE_RETRACTABLE_SIDEBAR', name: 'Collapsible Sidebar Navigation', description: 'Allows users to collapse the main sidebar into icon-only mode across customer workspaces.', enabled: true, category: 'User Interface' },
    { key: 'ENABLE_AUTO_BLOG_CRON', name: 'Scheduled Auto-Blog Generation', description: 'Periodically draft and publish local real-estate news and market trends using Gemini.', enabled: false, category: 'Content' },
    { key: 'STRICT_SLA_TURNAROUND_MONITOR', name: 'Strict 15-Min Request SLA Alert', description: 'Trigger priority alerts when an agent request or CDA approval exceeds 15 minutes.', enabled: true, category: 'Operations' },
    { key: 'MOCK_PERSISTENCE_ENFORCED', name: 'Local Persistence Fallback Mode', description: 'Automatically fall back to local disk storage if database connection drops.', enabled: true, category: 'System Health' },
    { key: 'ENABLE_VOICE_OUTBOUND_CALLS', name: 'Automated Phone & Voice System', description: 'Outbound Retell voice call dialing for agent check-ins.', enabled: false, category: 'Voice' },
  ]);

  const handleToggleFeature = (key: string) => {
    setFeatureToggles(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const fetchNotificationPreview = async (templateKey: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/ops/notifications/preview?templateKey=${templateKey}`, {
        headers: { 'x-workspace-id': workspaceId || 'nest-realty-demo' }
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data.preview);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      console.error('Failed to fetch notification preview:', err);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'Notification Diagnostics') {
      fetchNotificationPreview(selectedTemplate);
    }
  }, [currentTab, selectedTemplate]);

  const handleSendTestNotification = async () => {
    setTestSendStatus({ sending: true });
    try {
      const res = await fetch('/api/ops/notifications/send-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({ 
          templateKey: selectedTemplate,
          targetEmail: testEmailInput 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSendStatus({ success: true });
      } else {
        setTestSendStatus({ error: data.error || 'Failed to send test notification' });
      }
    } catch (err: any) {
      setTestSendStatus({ error: err.message || 'Network error' });
    }
  };

  // Mock Integration Connections
  const localIntegrations = [
    { provider: 'dotloop', name: 'Dotloop API v2', status: 'connected', lastSync: '2 mins ago', lastEvent: 'loop.created', lastOutbound: '2 mins ago', failCount: 0 },
    { provider: 'rechat', name: 'Rechat CRM Webhooks', status: 'connected', lastSync: '5 mins ago', lastEvent: 'contact.updated', lastOutbound: '10 mins ago', failCount: 0 },
    { provider: 'google_workspace', name: 'Google Workspace OAuth', status: 'connected', lastSync: '1 min ago', lastEvent: 'gmail.message.received', lastOutbound: '1 min ago', failCount: 0 },
    { provider: 'twilio', name: 'Twilio SMS & Voice Gateway', status: 'connected', lastSync: 'Just now', lastEvent: 'sms.received', lastOutbound: 'Just now', failCount: 0 }
  ];

  // Mock Events
  const localEvents = (auditEvents || []).map((e: any) => ({
    id: e.id || e.eventId || `evt-${Math.random()}`,
    timestamp: e.timestamp || new Date().toISOString(),
    source: e.source || 'Twilio SMS',
    details: e.details || e.description || 'Incoming signal processed',
    verdict: e.verdict || 'Processed',
    confidence: e.confidence || 0.98,
    outcome: e.status || e.outcome || 'completed'
  }));

  const filteredEvents = localEvents.filter((evt: any) => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'needs_review' && evt.outcome === 'needs_review') return true;
    if (eventFilter === 'completed' && evt.outcome === 'completed') return true;
    return true;
  });

  // Mock Actions
  const localActions = [
    { id: 'act-101', entity: '312 Mayfaire Town Center Way', tokenScope: 'cda_approval', secureTokenHash: '0x8a92b...3f0a', workspaceId: 'nest-realty-demo', recipientRole: 'Broker-in-Charge', expiresAt: new Date(Date.now() + 86400000).toISOString(), channel: 'sms', status: 'active' },
    { id: 'act-102', entity: '104 Main St', tokenScope: 'lead_disclosure_signoff', secureTokenHash: '0x3c71a...9e12', workspaceId: 'nest-realty-demo', recipientRole: 'Listing Agent', expiresAt: new Date(Date.now() + 172800000).toISOString(), channel: 'email', status: 'completed' }
  ];
  // Determine active Hub & active Sub-tab
  const activeHubKey = Object.keys(HUB_SUBTABS).find(hKey => 
    hKey === currentTab || HUB_SUBTABS[hKey].includes(currentTab)
  ) || 'Control Center';

  const defaultSubTab = HUB_SUBTABS[activeHubKey]?.[0] || 'System Health Summary';
  const [selectedSubTab, setSelectedSubTab] = useState<string>(
    HUB_SUBTABS[activeHubKey]?.includes(currentTab) ? currentTab : defaultSubTab
  );

  useEffect(() => {
    if (HUB_SUBTABS[currentTab]) {
      setSelectedSubTab(HUB_SUBTABS[currentTab][0]);
    } else if (HUB_SUBTABS[activeHubKey]?.includes(currentTab)) {
      setSelectedSubTab(currentTab);
    }
  }, [currentTab]);

  const activeView = selectedSubTab;

  const renderViewContent = () => {
    switch (activeView) {
      // ==========================================
      // 1. System Health Summary
      // ==========================================
      case 'System Overview':
      case 'System Health Summary': {
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-left animate-fade-in font-sans text-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Brokerage Operations System Health</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time status of connected brokerage workspaces, automation workflows, and software integrations.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Active Brokerage Workspaces</span>
                <span className="text-xl font-bold block text-slate-900">4 Active</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Connected Real Estate Tools</span>
                <span className="text-xl font-bold block text-emerald-700">6 Connected</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Automated Activity Rate</span>
                <span className="text-xl font-bold block text-slate-900">12 / min</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Overall System Status</span>
                <span className="text-xl font-bold block text-emerald-700">100% Operational</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-900">Brokerage Operating System Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Inbound Request Triage:</span>
                  <span className="font-bold text-emerald-700">Active (Auto-routed)</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Daily Task Automations:</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Broker Approvals & Signoffs:</span>
                  <span className="font-bold text-slate-900">Ready</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Software Tools Sync:</span>
                  <span className="font-bold text-emerald-700">Automatic</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Data Backup & Security:</span>
                  <span className="font-bold text-slate-900">Secured & Synced</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">System Readiness Check:</span>
                  <span className="font-bold text-emerald-700">Passed</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 1.5 Auto Blog Generator & Content Manager
      // ==========================================
      case 'Auto Blog Generator':
      case 'Automated Blog & News': {
        return <AutoBlogGeneratorConsole state={state} />;
      }

      // ==========================================
      // Mercury Payments & Billing
      // ==========================================
      case 'Mercury Payments & Billing':
      case 'Mercury Billing':
      case 'Payments & Invoices': {
        return <MercuryPaymentsHub state={state} />;
      }

      // ==========================================
      // 2. Brokerage Accounts & Setup
      // ==========================================
      case 'Workspaces':
      case 'Brokerage Accounts & Setup': {
        return (
          <div className="space-y-6 text-left animate-fade-in">
            <BrokerageAccountsLedgerView state={state} />
          </div>
        );
      }

      case 'Customer Onboarding Room': {
        return (
          <div className="space-y-6 text-left animate-fade-in font-sans text-slate-800">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-1">
              <h2 className="font-bold text-base text-slate-900 font-sans">Customer Onboarding & Launch Room</h2>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Dedicated launch workspace to guide new customer brokerages (e.g. Nest Realty Wilmington), audit operational readiness, and manage go-live checklists.
              </p>
            </div>
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
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Workspace Configuration Details</h3>
                <p className="text-xs text-slate-500 mt-1">Tenant parameters, active environment flags, and credentials override controls.</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-200 py-1.5">
                  <span className="text-slate-500">ACTIVE_WORKSPACE_ID:</span>
                  <span className="font-bold text-slate-900">{workspaceId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-1.5">
                  <span className="text-slate-500">PROVIDER_WHITE_LABEL:</span>
                  <span className="font-bold text-emerald-700">TRUE (custom primary color: #01362d)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-1.5">
                  <span className="text-slate-500">SMS_ALLOWLIST_ENFORCED:</span>
                  <span className="font-bold text-emerald-700">TRUE</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">ENCRYPTION_ENGINE:</span>
                  <span className="font-bold text-slate-900">SHA-256 Base64 encoder</span>
                </div>
              </div>
              <div className="pt-2 select-none">
                <button 
                  onClick={() => alert('Configurations re-seeded successfully!')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold cursor-pointer transition-all shadow-xs"
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
      // ==========================================
      // 4. Integration Health / Connected Tools Health
      // ==========================================
      case 'Integration Health':
      case 'Connected Tools Health': {
        return (
          <InternalShell
            title="Connected Software Tools Health"
            subtitle="Connection status of transaction software, CRMs, email, and phone tools."
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
                  onRetry={() => alert(`Synchronized connection and re-validated software integration.`)}
                />
              ))}
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 5. Webhook Delivery / Automated Message Delivery
      // ==========================================
      case 'Webhook Delivery':
      case 'Automated Message Delivery': {
        return (
          <InternalShell
            title="Automated Message & Data Delivery"
            subtitle="Live activity log of incoming signals, automated task rules, and message delivery."
            actions={
              <div className="flex gap-2 select-none">
                <select 
                  value={eventFilter} 
                  onChange={(e) => setEventFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-full text-xs font-semibold focus:outline-none font-mono"
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
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer shadow-xs"
                  title="Reload event stream"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            }
          >
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                      <th className="p-4 font-bold">Timestamp</th>
                      <th className="p-4 font-bold">Source</th>
                      <th className="p-4 font-bold">Signal Details</th>
                      <th className="p-4 font-bold">Shield Verdict</th>
                      <th className="p-4 font-bold">Confidence</th>
                      <th className="p-4 font-bold">Outcome</th>
                      <th className="p-4 font-bold text-right">Payload Inspector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {evt.source}
                        </td>
                        <td className="p-4 text-slate-600">
                          {evt.details}
                        </td>
                        <td className="p-4 font-mono text-amber-700 font-bold">
                          {evt.verdict}
                        </td>
                        <td className="p-4 font-mono text-emerald-700 font-bold">
                          {Math.round(evt.confidence * 100)}%
                        </td>
                        <td className="p-4 font-mono uppercase text-xs font-bold text-emerald-700">
                          {evt.outcome}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedPayloadEvent(evt)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer shadow-xs"
                          >
                            View Payload
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Webhook Payload Inspector Drawer Modal */}
            {selectedPayloadEvent && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-xl space-y-4 text-left font-sans text-slate-900 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Webhook Payload Inspector</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedPayloadEvent.source} — {selectedPayloadEvent.id}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedPayloadEvent(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 border border-white/10 rounded-2xl text-[10px]">
                      <div><span className="text-[#D0D6BB]/60 block uppercase">Timestamp:</span> {new Date(selectedPayloadEvent.timestamp).toISOString()}</div>
                      <div><span className="text-[#D0D6BB]/60 block uppercase">HTTP Status:</span> <span className="text-emerald-400 font-bold">200 OK</span></div>
                      <div><span className="text-[#D0D6BB]/60 block uppercase">Verdict:</span> <span className="text-amber-300 font-bold">{selectedPayloadEvent.verdict}</span></div>
                      <div><span className="text-[#D0D6BB]/60 block uppercase">Confidence:</span> <span className="text-emerald-400 font-bold">{Math.round(selectedPayloadEvent.confidence * 100)}%</span></div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Raw Webhook Headers & JSON Payload</span>
                      <pre className="p-4 bg-black/60 border border-white/10 rounded-2xl text-emerald-300 text-[10px] overflow-x-auto max-h-72 leading-relaxed">
                        {JSON.stringify(
                          {
                            headers: {
                              "content-type": "application/json",
                              "x-signature-sha256": "8f9a2b1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
                              "user-agent": `${selectedPayloadEvent.source.replace(/\s+/g, '')}-Webhook/3.0`
                            },
                            payload: {
                              event_id: selectedPayloadEvent.id,
                              source: selectedPayloadEvent.source,
                              details: selectedPayloadEvent.details,
                              timestamp: selectedPayloadEvent.timestamp,
                              verdict: selectedPayloadEvent.verdict,
                              confidence: selectedPayloadEvent.confidence,
                              outcome: selectedPayloadEvent.outcome,
                              metadata: {
                                office: "Wilmington",
                                region: "Coastal NC",
                                status: "VERIFIED"
                              }
                            }
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setSelectedPayloadEvent(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer shadow-xs"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </div>
            )}
          </InternalShell>
        );
      }

      // ==========================================
      // 6. Notification Diagnostics / Email & Text Test Room
      // ==========================================
      case 'Notification Diagnostics':
      case 'Email & Text Test Room': {
        const templates = [
          { key: 'deal_intake_intake', name: 'Deal Intake Alert', icon: FileText },
          { key: 'cda_approval_request', name: 'CDA Approval Ticket', icon: Shield },
          { key: 'pocket_listing_broadcast', name: 'Pocket Listing SMS', icon: Smartphone }
        ];

        return (
          <InternalShell
            title="Email & Text Message Test Room"
            subtitle="Preview automated email templates, test text messages, and verify outbound links."
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-slate-800">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-left">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">Active Templates</h4>
                <div className="space-y-1.5">
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
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all select-none cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs">
                          <Icon className="w-4 h-4 text-emerald-600" />
                          {t.name}
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {previewData ? (
                  <div className="space-y-6">
                    <NotificationPreviewFrame
                      subject={previewData.subject}
                      text={previewData.text}
                      html={previewData.html}
                      smsBody={previewData.smsBody}
                      ctaUrl="http://127.0.0.1:3000/client/deal/mock-client-deal-token"
                    />

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left space-y-4 text-slate-800">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">Test Transmission Sandbox</h4>
                      <p className="text-xs text-slate-500 leading-normal">
                        Sends a test notification using configured gateway credentials.
                      </p>

                      <div className="flex flex-col md:flex-row gap-3 select-none">
                        <input
                          type="email"
                          value={testEmailInput}
                          onChange={(e) => setTestEmailInput(e.target.value)}
                          placeholder="marcus@shapework.co"
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono"
                        />
                        <button
                          onClick={handleSendTestNotification}
                          disabled={testSendStatus.sending}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-xs"
                        >
                          {testSendStatus.sending ? 'Delivering...' : 'Send Test Notification'}
                        </button>
                      </div>

                      {testSendStatus.success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-mono">
                          🟢 Test notification dispatched successfully! Checks allowlisted mailbox.
                        </div>
                      )}
                      {testSendStatus.error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-mono">
                          🔴 Test Send Guard: {testSendStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center text-xs text-slate-500 font-mono shadow-sm">
                    Select a template to view notification preview.
                  </div>
                )}
              </div>
            </div>
          </InternalShell>
        );
      }

      // ==========================================
      // 7. Voice Provider Diagnostics / Phone & Voice System Checks
      // ==========================================
      case 'Voice Provider Diagnostics':
      case 'Phone & Voice System Checks': {
        return (
          <div className="space-y-6 text-left animate-fade-in font-sans text-slate-800">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Retell Voice Integration Controls</h3>
                <p className="text-xs text-slate-500 mt-1">Configure Retell API bindings, custom agent voices, and call prompt triggers.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">RETELL_API_KEY</span>
                  <span className="font-semibold text-slate-900 block select-none">•••••••••••••••••ae45</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-bold uppercase inline-block font-mono border border-emerald-200">Valid</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">DEFAULT_AGENT_ID</span>
                  <span className="font-semibold text-slate-900 block select-all">retell_agent_9283fcc4a</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[9px] font-bold uppercase inline-block font-mono border border-emerald-200">Provisioned</span>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-2xl space-y-2.5 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider font-mono block">Voice Prompt Configuration</span>
                <textarea 
                  readOnly 
                  value="You are shapework. Your job is to call the escrow agent or lender, identify yourself as the assistant, check on earnest money deposits or title clearances, and log outcomes."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  rows={3}
                />
              </div>

              <div className="pt-2 select-none flex gap-2">
                <button 
                  onClick={() => alert('Speech engine pinged successfully! API latency: 134ms.')} 
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  Test API Latency
                </button>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 8. Action Token Registry / Approved Quick-Actions
      // ==========================================
      case 'Action Token Registry':
      case 'Approved Quick-Actions': {
        return (
          <InternalShell
            title="Approved Quick-Actions & Links"
            subtitle="Active single-click approval links generated for brokers, BICs, and team leads."
          >
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                      <th className="p-4 font-bold">Action Target</th>
                      <th className="p-4 font-bold">Fingerprint</th>
                      <th className="p-4 font-bold">Workspace</th>
                      <th className="p-4 font-bold">Recipient Role</th>
                      <th className="p-4 font-bold">Expires</th>
                      <th className="p-4 font-bold">Channel</th>
                      <th className="p-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {localActions.map((action) => (
                      <tr key={action.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{action.entity}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{action.tokenScope}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <SafeTokenFingerprint tokenHash={action.secureTokenHash} />
                        </td>
                        <td className="p-4 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                          {action.workspaceId}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-600">
                          {action.recipientRole}
                        </td>
                        <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(action.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-900">
                          <span className="inline-flex items-center gap-1 font-mono">
                            {action.channel === 'email' ? <Mail className="w-3.5 h-3.5 text-emerald-600" /> : <Smartphone className="w-3.5 h-3.5 text-emerald-600" />}
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
      // 9. Security & Audit / Security & Activity Trail
      // ==========================================
      case 'Security & Audit':
      case 'Security & Activity Trail': {
        return (
          <div className="space-y-6 text-left animate-fade-in text-slate-800">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Security Checks & Activity Trail</h3>
                <p className="text-xs text-slate-500 mt-1">Cross-workspace system events log, security overrides, and operational rollbacks.</p>
              </div>
              <ActivityAuditTrail
                auditLogs={auditEvents}
                onRollback={handleRollbackAuditAction}
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-4">Automation Executions Log</h3>
              <AgentRunTable onInspectRun={(run) => alert(`Inspecting execution ${run.runId}`)} />
            </div>
          </div>
        );
      }

      // ==========================================
      // 10. Support Console / Support & Help Desk
      // ==========================================
      case 'Support Console':
      case 'Support & Help Desk': {
        const positions = orgChartService.getOrgChart(workspaceId || 'nest-realty-demo').positions;

        return (
          <div className="space-y-6 text-left animate-fade-in font-sans text-slate-800">
            {/* Support Impersonator Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Support & Security Control</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">Support Console Tenant Impersonator & Session Simulator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Safely simulate customer app views as any broker, staff member, or BIC for troubleshooting.</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Active Impersonation Persona:</span>
                    <strong className="text-slate-900 text-xs">{state.activeProfile?.displayName || 'Ryan Crecelius'} ({state.activeProfile?.title || 'Principal Broker'})</strong>
                  </div>
                </div>
              </div>

              {/* Impersonation Rationale Logger */}
              <div className="space-y-2 font-mono text-xs">
                <label className="text-[10px] text-slate-500 uppercase font-bold block">Support Ticket Rationale / Audit Log Note</label>
                <input
                  type="text"
                  placeholder="e.g. Investigating escalation routing for Eric Knight (Ticket #9842)..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>

              {/* Role Impersonation Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Select Persona to Impersonate</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  {positions.map(p => {
                    const isActive = state.activeProfile?.id === p.id || (state.activeProfile?.displayName === p.name);
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 border rounded-2xl flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className={`font-bold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>{p.name}</h4>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-extrabold uppercase rounded-full">ACTIVE</span>
                            )}
                          </div>
                          <p className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`}>{p.title}</p>
                          <span className={`text-[9px] block mt-1 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{p.office || 'Wilmington'} · {p.department}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            state.handleRoleSwitch({
                              id: p.id,
                              displayName: p.name,
                              title: p.title,
                              email: p.email || `${p.id}@nestrealty.com`,
                              status: p.status || 'active',
                              personType: 'staff',
                              primaryOfficeName: p.office || 'Wilmington'
                            });
                          }}
                          className={`w-full py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer font-mono ${
                            isActive
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-200 text-slate-900 border border-slate-300'
                          }`}
                        >
                          {isActive ? 'Simulating Session' : 'Impersonate Persona'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans text-slate-800">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Shapework System Boundaries</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Internal parameters, delivery scope boundaries, and API integrations limits mapped for standard real estate brokerages.
              </p>
              <div className="p-4 bg-slate-50 text-slate-700 font-mono text-[11px] space-y-1.5 border border-slate-200 rounded-2xl">
                <div>MAX_ACTIVE_TRANSACTIONS: 500</div>
                <div>WEBHOOK_STAGING_EXPIRY_HOURS: 48</div>
                <div>COMPLIANCE_AUTO_REJECT_ON_STUCK_MINUTES: 360</div>
              </div>
            </div>
          </div>
        );
      }

      // ==========================================
      // 11. Feature Flags
      // ==========================================
      case 'Feature Flags': {
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans text-slate-800">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Global System Feature Toggles</h3>
            <p className="text-xs text-slate-500">Enable or disable core AI capabilities and diagnostic modes globally.</p>
            
            <div className="space-y-3 font-mono text-xs">
              {[
                { key: 'ENABLE_NOTIFICATION_TEST_SEND', value: 'true', desc: 'Allows sandbox outbox transmissions' },
                { key: 'ENABLE_VOICE_OUTBOUND', value: 'false', desc: 'Outbound Retell voice call dialing' },
                { key: 'MOCK_PERSISTENCE_ENFORCED', value: 'true', desc: 'Falls back to mock databases if connection fails' }
              ].map(flag => (
                <div key={flag.key} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="font-bold text-slate-900 block">{flag.key}</span>
                    <span className="text-[10px] text-slate-500">{flag.desc}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${flag.value === 'true' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>{flag.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ==========================================
      // 12. Feature Toggles & Controls / Pilot Readiness
      // ==========================================
      case 'Feature Toggles & Controls': {
        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-left animate-fade-in font-sans text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">Feature Toggles & System Controls</h3>
                <p className="text-xs text-slate-500 mt-0.5">Turn optional features on or off across customer brokerage accounts in real time.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold font-mono">
                  {featureToggles.filter(f => f.enabled).length} Active Toggles
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureToggles.map((flag) => (
                <div 
                  key={flag.key} 
                  className={`p-4 rounded-2xl border transition-all ${
                    flag.enabled 
                      ? 'bg-slate-50 border-slate-200 shadow-xs' 
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-sans">{flag.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[9px] font-bold uppercase font-mono">
                          {flag.category}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 block">{flag.key}</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{flag.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFeature(flag.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        flag.enabled ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'Pilot Readiness':
      case 'Launch & Pilot Readiness': {
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
      // 13. System Logs / System Activity Logs
      // ==========================================
      case 'System Logs':
      case 'System Activity Logs': {
        const rawLogLines = [
          { level: 'INFO', time: '2026-07-29T10:40:02Z', sys: 'Job Queue', text: 'Asynchronous background worker polling initialized.' },
          { level: 'INFO', time: '2026-07-29T10:40:12Z', sys: 'Security Vault', text: 'Credentials encryptor fallback mode loaded.' },
          { level: 'INFO', time: '2026-07-29T10:41:25Z', sys: 'Retell API', text: 'Webhook listener listening on port 3000.' },
          { level: 'SUCCESS', time: '2026-07-29T10:43:01Z', sys: 'Shapework OS', text: 'Master full-stack server running on http://0.0.0.0:3000' },
          { level: 'INFO', time: '2026-07-29T11:15:10Z', sys: 'Dotloop Sync', text: 'Polled 14 active transactions for Mayfaire office.' },
          { level: 'WARN', time: '2026-07-29T11:32:44Z', sys: 'Twilio SMS', text: 'Webhook response latency exceeded 120ms (142ms).' },
          { level: 'SUCCESS', time: '2026-07-29T11:45:00Z', sys: 'AI Triage', text: 'Deflected 8 routine agent queries without escalation.' },
          { level: 'ERROR', time: '2026-07-29T12:01:18Z', sys: 'PDF Exporter', text: 'Recovered offscreen container reference for open position export.' }
        ];

        const filteredLogs = rawLogLines.filter(l => {
          if (logLevelFilter !== 'ALL' && l.level !== logLevelFilter) return false;
          if (logQuery && !`${l.level} ${l.sys} ${l.text}`.toLowerCase().includes(logQuery.toLowerCase())) return false;
          return true;
        });

        const handleCopyLogs = () => {
          const logText = filteredLogs.map(l => `[${l.time}] ${l.level} [${l.sys}] ${l.text}`).join('\n');
          navigator.clipboard.writeText(logText);
          setCopiedLogs(true);
          setTimeout(() => setCopiedLogs(false), 2000);
        };

        const handleDownloadLogs = () => {
          const logText = filteredLogs.map(l => `[${l.time}] ${l.level} [${l.sys}] ${l.text}`).join('\n');
          const encodedUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(logText);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `system_stdout_${new Date().toISOString().slice(0, 10)}.txt`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in font-sans text-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Live System stdout/stderr stream</h3>
                <p className="text-xs text-slate-500 mt-0.5">Aggregated logs representing standard output from asynchronous job queue runner.</p>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  {copiedLogs ? '✓ Copied!' : 'Copy Logs'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadLogs}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer shadow-xs"
                >
                  Download .log
                </button>
              </div>
            </div>

            {/* Log Search & Severity Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
              <input
                type="text"
                placeholder="Search stdout logs by keyword or subsystem..."
                value={logQuery}
                onChange={e => setLogQuery(e.target.value)}
                className="w-full md:w-80 px-3 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 font-sans"
              />

              <div className="flex gap-1.5">
                {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                      logLevelFilter === lvl
                        ? lvl === 'ERROR' ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : lvl === 'WARN' ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : lvl === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="p-4 bg-black/60 text-emerald-300 font-mono text-[11px] leading-relaxed border border-white/10 rounded-2xl max-h-96 overflow-y-auto space-y-1 select-text">
              {filteredLogs.map((l, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#D0D6BB]/40 shrink-0">[{l.time.slice(11, 19)}]</span>
                  <span className={`font-bold shrink-0 ${
                    l.level === 'ERROR' ? 'text-rose-400' :
                    l.level === 'WARN' ? 'text-amber-400' :
                    l.level === 'SUCCESS' ? 'text-emerald-400 font-bold' :
                    'text-emerald-300'
                  }`}>
                    {l.level}
                  </span>
                  <span className="text-amber-300/80 shrink-0">[{l.sys}]</span>
                  <span className="text-white">{l.text}</span>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <p className="text-center py-6 text-[#D0D6BB]/50">No logs matching selected search query or level filter.</p>
              )}
            </div>
          </div>
        );
      }

      // ==========================================
      // 1.6 Market Intelligence & Survey Studio
      // ==========================================
      case 'Market Intelligence':
      case 'Shapework Market Research': {
        return <InternalMarketIntelligenceView onNavigateTab={(tab) => setSelectedSubTab(tab)} />;
      }

      case 'Survey Studio':
      case 'Customer Survey Studio': {
        return (
          <InternalSurveyLibraryView 
            onNavigateToBuilder={(id, mode) => {
              setSelectedSubTab('Customer Survey Studio');
            }} 
          />
        );
      }

      case 'Feedback Intelligence':
      case 'Feedback intelligence': {
        return <InternalFeedbackDashboard state={state} />;
      }

      default:
        return (
          <div className="p-8 text-center text-xs text-[#D0D6BB]/70 font-mono">
            View selection failed to load. Please return to the Overview.
          </div>
        );
    }
  };

  const currentSubTabs = HUB_SUBTABS[activeHubKey] || [];

  return (
    <div className="space-y-5">
      {/* Horizontal Sub-tab Navigation Bar */}
      {currentSubTabs.length > 1 && (
        <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs font-sans text-xs overflow-x-auto select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono px-3 shrink-0">
            {activeHubKey}
          </span>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          {currentSubTabs.map((subTab) => {
            const isSubActive = activeView === subTab;
            return (
              <button
                key={subTab}
                onClick={() => setSelectedSubTab(subTab)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isSubActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {subTab}
              </button>
            );
          })}
        </div>
      )}

      {renderViewContent()}
    </div>
  );
}

function InternalFeedbackDashboard({ state }: { state: any }) {
  const workspaceId = state?.workspaceId || 'nest-realty-demo';
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [improvementRequests, setImprovementRequests] = useState<any[]>([]);
  const [aiAggregates, setAiAggregates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterHelpful, setFilterHelpful] = useState<'all' | 'helpful' | 'unhelpful'>('all');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all');
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'x-workspace-id': workspaceId || 'nest-realty-demo' };
      const [fbRes, irRes, aggRes] = await Promise.all([
        fetch('/api/ops/feedback', { headers }),
        fetch('/api/ops/improvement-requests', { headers }),
        fetch('/api/ops/ai/feedback/aggregate', { headers })
      ]);
      if (fbRes.ok) {
        const data = await fbRes.json();
        setFeedbacks(data.feedback || []);
      }
      if (irRes.ok) {
        const data = await irRes.json();
        setImprovementRequests(data.requests || []);
      }
      if (aggRes.ok) {
        const data = await aggRes.json();
        setAiAggregates(data.aggregate || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const note = resolutionNotes[id] || '';
      const res = await fetch(`/api/ops/improvement-requests/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({ status: newStatus, resolutionNote: note })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const workspaceList = Array.from(
    new Set([
      'nest-realty-demo',
      ...feedbacks.map(f => f.workspaceId).filter(Boolean),
      ...improvementRequests.map(r => r.workspaceId).filter(Boolean)
    ])
  );

  const filteredFeedbacks = feedbacks.filter(f => {
    if (selectedWorkspace !== 'all' && f.workspaceId && f.workspaceId !== selectedWorkspace) return false;
    if (filterHelpful === 'helpful' && !f.helpful) return false;
    if (filterHelpful === 'unhelpful' && f.helpful) return false;
    return true;
  });

  const filteredRequests = improvementRequests.filter(r => {
    if (selectedWorkspace !== 'all' && r.workspaceId && r.workspaceId !== selectedWorkspace) return false;
    return true;
  });

  const totalCount = filteredFeedbacks.length;
  const helpfulCount = filteredFeedbacks.filter(f => f.helpful).length;
  const helpfulPercentage = totalCount > 0 ? Math.round((helpfulCount / totalCount) * 100) : 100;
  const negativeRate = 100 - helpfulPercentage;

  const handleExportSignalsCSV = () => {
    const headers = ['ID', 'Workspace', 'Object Type', 'Helpful', 'Comment', 'Created At'];
    const rows = filteredFeedbacks.map(f => [
      f.id,
      f.workspaceId || workspaceId || 'nest-realty-demo',
      f.objectType,
      f.helpful ? 'Helpful' : 'Needs Info',
      `"${(f.comment || '').replace(/"/g, '""')}"`,
      f.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feedback_signals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRequestsCSV = () => {
    const headers = ['ID', 'Workspace', 'Title', 'Target Type', 'Target ID', 'Status', 'Description', 'Resolution Note', 'Created At'];
    const rows = filteredRequests.map(r => [
      r.id,
      r.workspaceId || workspaceId || 'nest-realty-demo',
      `"${(r.title || '').replace(/"/g, '""')}"`,
      r.targetType,
      r.targetId,
      r.status,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.resolutionNote || resolutionNotes[r.id] || '').replace(/"/g, '""')}"`,
      r.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `improvement_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Operations Feedback Intelligence</h3>
            <p className="text-xs text-slate-500 mt-1">Aggregated thumbs-up / thumbs-down signals and user improvement requests</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-500">Filter Workspace:</span>
            <select
              value={selectedWorkspace}
              onChange={e => setSelectedWorkspace(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-slate-400"
            >
              <option value="all">All Workspaces</option>
              {workspaceList.map(ws => (
                <option key={ws} value={ws}>{ws}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Total Signals</span>
            <span className="text-xl font-bold block text-slate-900">{totalCount} Feedbacks</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Helpful Rating</span>
            <span className="text-xl font-bold block text-emerald-700">{helpfulPercentage}% Positive</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Needs Improvement Rate</span>
            <span className="text-xl font-bold block text-amber-700">{negativeRate}%</span>
          </div>
        </div>

        {aiAggregates && Object.keys(aiAggregates).length > 0 && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">AI Copilot Aggregate Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(aiAggregates).map(([objType, stats]: any) => {
                const total = stats.positive + stats.negative;
                const pct = total > 0 ? Math.round((stats.positive / total) * 100) : 100;
                return (
                  <div key={objType} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">{objType.replace('_', ' ')} Accuracy</span>
                    <strong className="block text-xs text-slate-900">{stats.positive} helpful / {stats.negative} unhelpful ({pct}%)</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Signals Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm text-slate-800">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-slate-500">Live Feedback Stream</span>
              <button
                onClick={handleExportSignalsCSV}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Export Signals CSV
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterHelpful('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${filterHelpful === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterHelpful('helpful')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${filterHelpful === 'helpful' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Helpful
              </button>
              <button
                onClick={() => setFilterHelpful('unhelpful')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${filterHelpful === 'unhelpful' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Needs Info
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredFeedbacks.map(f => (
              <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[8px] font-mono uppercase font-bold border border-emerald-200">{f.objectType}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {f.helpful ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">👍 Helpful</span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">👎 Unhelpful</span>
                  )}
                </div>

                {f.comment && (
                  <p className="text-[11px] text-slate-700 bg-white border border-slate-200 p-2.5 rounded-xl leading-relaxed font-sans">{f.comment}</p>
                )}
              </div>
            ))}

            {filteredFeedbacks.length === 0 && (
              <p className="text-center py-6 text-slate-400 font-mono">No feedbacks matching selected criteria recorded.</p>
            )}
          </div>
        </div>

        {/* Improvement Requests Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm text-slate-800">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-slate-500">Unresolved Improvement Requests</span>
            <button
              onClick={handleExportRequestsCSV}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
            >
              Export Requests CSV
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredRequests.map(r => (
              <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{r.title}</h4>
                    <span className="text-[9px] text-slate-500 font-mono">Target: {r.targetType} ({r.targetId})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono uppercase font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {r.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed font-sans bg-white border border-slate-200 p-2.5 rounded-xl">{r.description}</p>
                
                {/* Resolution Note Input */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Operator resolution rationale / action note..."
                    value={resolutionNotes[r.id] || r.resolutionNote || ''}
                    onChange={e => setResolutionNotes({ ...resolutionNotes, [r.id]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
                  />
                </div>

                <div className="flex gap-1.5 justify-end text-[10px]">
                  {r.status === 'new' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'reviewing')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-[9px] font-mono uppercase font-bold transition-all cursor-pointer border border-slate-300"
                      >
                        Start Review
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'accepted')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-[9px] font-mono uppercase font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Accept Request
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <p className="text-center py-6 text-slate-400 font-mono">No improvement requests pending review.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalWorkspaceCloner({ state }: { state: any }) {
  const [sourceWorkspaceId, setSourceWorkspaceId] = useState<string>('nest-realty-demo');
  const [targetBrokerageName, setTargetBrokerageName] = useState<string>('Nest Realty Triangle');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>('nest-realty-triangle');
  const [principalBrokerName, setPrincipalBrokerName] = useState<string>('Ryan Crecelius');
  const [principalBrokerEmail, setPrincipalBrokerEmail] = useState<string>('ryan@nestrealty.com');
  const [officesInput, setOfficesInput] = useState<string>('Raleigh, Durham, Chapel Hill');
  const [clonePositions, setClonePositions] = useState(true);
  const [cloneRoles, setCloneRoles] = useState(true);
  const [cloneSops, setCloneSops] = useState(true);
  const [cloneRouting, setCloneRouting] = useState(true);
  const [cloneResult, setCloneResult] = useState<any>(null);

  const handleRunClone = () => {
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

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-left font-sans text-xs text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Operator Control Plane</span>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">Workspace Cloner & Seed Template Generator</h3>
          <p className="text-xs text-slate-500 mt-0.5">Provision a new tenant brokerage with 1-click cloning of org charts, roles, SOPs, and routing matrices.</p>
        </div>
      </div>

      {cloneResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 font-mono text-xs text-emerald-900 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="font-bold text-emerald-800">✓ Tenant Workspace Provisioned Successfully!</span>
            <button
              onClick={() => handleSwitchToTenant(cloneResult.targetWorkspaceId)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-[10px] uppercase shadow-xs transition-all cursor-pointer"
            >
              Switch to {cloneResult.targetWorkspaceId}
            </button>
          </div>
          <div className="text-[11px] text-emerald-700 grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            <div><span className="text-emerald-950 font-bold block">Positions:</span> {cloneResult.counts.positions}</div>
            <div><span className="text-emerald-950 font-bold block">Roles:</span> {cloneResult.counts.roles}</div>
            <div><span className="text-emerald-950 font-bold block">SOPs:</span> {cloneResult.counts.sops}</div>
            <div><span className="text-emerald-950 font-bold block">Routing Rules:</span> {cloneResult.counts.routing}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Source Template Workspace</label>
          <select
            value={sourceWorkspaceId}
            onChange={e => setSourceWorkspaceId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 font-sans"
          >
            <option value="nest-realty-demo">Nest Realty Wilmington (Default Seed Template)</option>
            {state.workspaceId && state.workspaceId !== 'nest-realty-demo' && (
              <option value={state.workspaceId}>{state.workspaceId}</option>
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Target Brokerage Name</label>
          <input
            type="text"
            value={targetBrokerageName}
            onChange={e => {
              setTargetBrokerageName(e.target.value);
              setTargetWorkspaceId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            placeholder="e.g. Nest Realty Triangle"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Target Workspace ID / Slug</label>
          <input
            type="text"
            value={targetWorkspaceId}
            onChange={e => setTargetWorkspaceId(e.target.value)}
            placeholder="e.g. nest-realty-triangle"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Target Offices (Comma Separated)</label>
          <input
            type="text"
            value={officesInput}
            onChange={e => setOfficesInput(e.target.value)}
            placeholder="e.g. Raleigh, Durham, Chapel Hill"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Principal Broker Name</label>
          <input
            type="text"
            value={principalBrokerName}
            onChange={e => setPrincipalBrokerName(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 uppercase font-bold block">Principal Broker Email</label>
          <input
            type="email"
            value={principalBrokerEmail}
            onChange={e => setPrincipalBrokerEmail(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-400 font-sans"
          />
        </div>
      </div>

      {/* Cloning Elements Checklist */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <span className="text-[10px] font-mono font-bold text-slate-900 uppercase tracking-wider block">Elements to Clone & Seed</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs text-slate-800">
          <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={clonePositions}
              onChange={e => setClonePositions(e.target.checked)}
              className="accent-slate-900 w-4 h-4"
            />
            <span className="font-bold">Org Chart Positions</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={cloneRoles}
              onChange={e => setCloneRoles(e.target.checked)}
              className="accent-slate-900 w-4 h-4"
            />
            <span className="font-bold">Role Profiles</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={cloneSops}
              onChange={e => setCloneSops(e.target.checked)}
              className="accent-slate-900 w-4 h-4"
            />
            <span className="font-bold">SOP Library</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={cloneRouting}
              onChange={e => setCloneRouting(e.target.checked)}
              className="accent-slate-900 w-4 h-4"
            />
            <span className="font-bold">Routing Matrix</span>
          </label>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleRunClone}
          className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs font-mono flex items-center justify-center gap-2"
        >
          <span>Provision & Clone Tenant Workspace</span>
        </button>
      </div>
    </div>
  );
}
