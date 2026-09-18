import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, 
  Zap, Link2, Unlink, Activity, Check, Sparkles, X, ChevronRight, HelpCircle
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import ConnectorLogo from '../ui/ConnectorLogo';
import { RechatMcpIntegrationModal } from './RechatMcpIntegrationModal';

export interface ToolIntegrationItem {
  id: string;
  provider: 'google' | 'rechat' | 'dotloop' | 'slack' | 'quickbooks' | 'basecamp' | 'microsoft' | 'canva';
  name: string;
  category: string;
  description: string;
  scopes: string[];
  status?: 'connected' | 'demo_connected' | 'disconnected';
  latencyMs?: number;
  uptime?: string;
}

const TOOLS_CATALOG: ToolIntegrationItem[] = [
  {
    id: 'tool_google',
    provider: 'google',
    name: 'Google Workspace',
    category: 'Core Communication & Storage',
    description: 'Syncs Gmail transaction notices, Wilmington conference room calendar, and Google Drive operating manuals.',
    scopes: ['Gmail Read/Write', 'Google Calendar (Room booking)', 'Google Drive (SOP Docs)']
  },
  {
    id: 'tool_rechat',
    provider: 'rechat',
    name: 'Rechat CRM & MLS Gateway',
    category: 'CRM & Listing Syndication',
    description: 'Direct bi-directional sync of active MLS listings, agent transactions, client address books, and deal pipelines.',
    scopes: ['Read / Write CRM Contacts', 'Sync Active MLS Listings', 'Deals & Commission Stages']
  },
  {
    id: 'tool_dotloop',
    provider: 'dotloop',
    name: 'Dotloop (Wilmington Association)',
    category: 'Contracts & e-Signatures',
    description: 'Syncs executed Form 2-T purchase agreements, WWREA agency disclosures, and compliance audit loops.',
    scopes: ['Loops Read & Write', 'NCREC Form Templates', 'Compliance Audit Signature Trails']
  },
  {
    id: 'tool_slack',
    provider: 'slack',
    name: 'Slack (#ops-dispatch)',
    category: 'Real-Time Dispatch & Escalation',
    description: 'Automated real-time operational pings, SLA breach alerts, and team triage updates directly to Slack channels.',
    scopes: ['Send Ops Notifications', 'Channel Dispatch Webhooks', 'Direct SLA Alert Mentions']
  },
  {
    id: 'tool_quickbooks',
    provider: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'Accounting & Escrow Disbursement',
    description: 'Commission disbursement authorizations, vendor invoicing (Coastal Sign Post), and earnest money deposit tracking.',
    scopes: ['Accounting Ledger Read/Write', 'Vendor Invoices & Bills', 'Commission Disbursement Authorizations']
  },
  {
    id: 'tool_basecamp',
    provider: 'basecamp',
    name: 'Basecamp 3',
    category: 'Team Collaboration & Projects',
    description: 'Automated campfire message relays, team task to-dos, and field marketing schedules.',
    scopes: ['Read / Write Campfire Relays', 'To-Do Project Creation', 'Schedule Event Tracking']
  }
];

interface ConnectedToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function ConnectedToolsDrawer({
  isOpen,
  onClose,
  onStatusChange
}: ConnectedToolsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'credentials'>('tools');
  const [providerStatuses, setProviderStatuses] = useState<Record<string, 'connected' | 'demo_connected' | 'disconnected'>>({});
  const [credentialsList, setCredentialsList] = useState<Array<{ provider: string; hasClientId: boolean; hasClientSecret: boolean; maskedClientId: string; source: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [pingingProvider, setPingingProvider] = useState<string | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});
  const [latencyData, setLatencyData] = useState<Record<string, number>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showRechatMcpModal, setShowRechatMcpModal] = useState<boolean>(false);

  // Form state for editing custom credentials
  const [editCreds, setEditCreds] = useState<Record<string, { clientId: string; clientSecret: string }>>({});
  const [savingCredProvider, setSavingCredProvider] = useState<string | null>(null);

  // Fetch statuses from backend
  const loadStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, credRes] = await Promise.all([
        fetch('/api/auth/providers'),
        fetch('/api/auth/credentials')
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.success && Array.isArray(data.providers)) {
          const map: Record<string, any> = {};
          data.providers.forEach((p: any) => {
            map[p.provider] = p.status;
          });
          setProviderStatuses(map);
        }
      }

      if (credRes.ok) {
        const credData = await credRes.json();
        if (credData.success && Array.isArray(credData.credentials)) {
          setCredentialsList(credData.credentials);
        }
      }
    } catch (err) {
      console.error('Failed to load OAuth provider statuses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStatuses();
    }
  }, [isOpen, loadStatuses]);

  // Listen for OAuth complete postMessage from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_complete') {
        const prov = event.data.provider;
        setSuccessToast(`Successfully connected ${prov.toUpperCase()} via OAuth 2.0!`);
        setTimeout(() => setSuccessToast(null), 4000);
        loadStatuses();
        if (onStatusChange) onStatusChange();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadStatuses, onStatusChange]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Sync Live Data
  const handleSyncData = async (provider: string) => {
    try {
      setSyncingProvider(provider);
      const res = await fetch(`/api/auth/${provider}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setSyncResults(prev => ({ ...prev, [provider]: data.data }));
        showToast(`✓ Synced ${provider.toUpperCase()}: live data records refreshed!`);
      }
    } catch (err) {
      console.error(`Failed to sync ${provider}:`, err);
    } finally {
      setSyncingProvider(null);
    }
  };

  // Save Custom Credentials
  const handleSaveCredentials = async (provider: string) => {
    const cred = editCreds[provider];
    if (!cred?.clientId) {
      showToast(`Please enter a Client ID for ${provider.toUpperCase()}`);
      return;
    }

    try {
      setSavingCredProvider(provider);
      const res = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          clientId: cred.clientId,
          clientSecret: cred.clientSecret || ''
        })
      });
      if (res.ok) {
        showToast(`✓ Production credentials saved for ${provider.toUpperCase()}`);
        await loadStatuses();
      }
    } catch (err) {
      console.error('Failed to save credentials:', err);
    } finally {
      setSavingCredProvider(null);
    }
  };

  // Connect via OAuth
  const handleConnect = async (provider: string) => {
    try {
      setConnectingProvider(provider);
      const url = `/api/auth/${provider}/connect`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.authUrl) {
        // Open OAuth popup window
        const width = 520;
        const height = 680;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          data.authUrl,
          `oauth_${provider}`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );

        // Fallback poller when popup is closed (wrapped in try/catch to satisfy COOP policies)
        let checkCount = 0;
        const checkTimer = setInterval(async () => {
          checkCount++;
          let isClosed = false;
          try {
            isClosed = !popup || popup.closed;
          } catch {
            // COOP cross-origin policy blocks inspecting popup.closed while on accounts.google.com
            isClosed = false;
          }

          if (isClosed || checkCount > 180) {
            clearInterval(checkTimer);
            await loadStatuses();
            if (onStatusChange) onStatusChange();
          }
        }, 1000);
      }
    } catch (err) {
      console.error(`Failed to connect ${provider}:`, err);
    } finally {
      setConnectingProvider(null);
    }
  };

  // Disconnect provider
  const handleDisconnect = async (provider: string) => {
    try {
      setConnectingProvider(provider);
      const res = await fetch(`/api/auth/${provider}/disconnect`, { method: 'POST' });
      if (res.ok) {
        showToast(`Disconnected ${provider.toUpperCase()} OAuth credentials.`);
        await loadStatuses();
        if (onStatusChange) onStatusChange();
      }
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
    } finally {
      setConnectingProvider(null);
    }
  };

  // Test Ping Latency
  const handlePing = async (provider: string) => {
    try {
      setPingingProvider(provider);
      const res = await fetch(`/api/auth/${provider}/ping`);
      const data = await res.json();
      if (data.success) {
        setLatencyData(prev => ({ ...prev, [provider]: data.latencyMs }));
        showToast(`Pinged ${provider.toUpperCase()}: ${data.latencyMs}ms (${data.status === 'connected' ? 'Live Production' : 'Healthy'}).`);
      }
    } catch (err) {
      console.error(`Ping failed for ${provider}:`, err);
    } finally {
      setPingingProvider(null);
    }
  };

  // Quick Connect All (Sandbox Onboarding)
  const handleConnectAll = async () => {
    try {
      setLoading(true);
      for (const item of TOOLS_CATALOG) {
        await fetch(`/api/auth/${item.provider}/authorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      }
      showToast('All 6 primary tools authorized successfully in Sandbox mode!');
      await loadStatuses();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to connect all tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectedCount = Object.values(providerStatuses).filter(s => s === 'connected' || s === 'demo_connected').length;
  const configuredCredsCount = credentialsList.filter(c => c.hasClientId).length;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00635C]/10 text-[#00635C] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-stone-900">Connected Tools & OAuth 2.0</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] text-[10px] font-mono font-bold">
                    {connectedCount} of {TOOLS_CATALOG.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Authorize third-party real estate platforms, communication channels, and MLS gateways.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Live Tools vs API Credentials */}
          <div className="flex items-center gap-2 border-b border-stone-200 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'tools'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              Connected Tools ({connectedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production API Keys ({configuredCredsCount})</span>
            </button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-[#00635C]" />
            <span>Encrypted token storage via AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'tools' && (
              <button
                type="button"
                onClick={handleConnectAll}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Connect All (Quick Setup)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-left font-sans">
        {/* Success Toast */}
        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* TAB 1: TOOLS LIST */}
        {activeTab === 'tools' && (
          <>
            {/* Info Banner */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#00635C]/10 text-[#00635C] flex items-center justify-center shrink-0 mt-0.5">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-stone-600 leading-relaxed">
                <strong className="text-stone-900 font-semibold block mb-0.5">Dual-Mode OAuth Ready</strong>
                Connect using live client credentials or click <strong>Connect via OAuth</strong> to test with sandbox authorization immediately.
              </div>
            </div>

            {/* Tools List */}
            <div className="space-y-3.5">
              {TOOLS_CATALOG.map((tool) => {
                const status = providerStatuses[tool.provider] || 'disconnected';
                const isConnected = status === 'connected' || status === 'demo_connected';
                const isConnecting = connectingProvider === tool.provider;
                const isPinging = pingingProvider === tool.provider;
                const isSyncing = syncingProvider === tool.provider;
                const latency = latencyData[tool.provider];
                const syncData = syncResults[tool.provider];

                return (
                  <div 
                    key={tool.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isConnected 
                        ? 'bg-white border-stone-200 shadow-2xs hover:border-[#00635C]/50' 
                        : 'bg-stone-50/50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/90 flex items-center justify-center shrink-0 shadow-2xs p-2">
                          <ConnectorLogo provider={tool.provider} size="md" className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-stone-900">{tool.name}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/70">
                              {tool.category}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{status === 'demo_connected' ? 'SANDBOX ACTIVE' : 'CONNECTED'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 border border-stone-200 text-[11px] font-medium font-mono">
                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                            <span>DISCONNECTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sync Telemetry Banner if available */}
                    {syncData && (
                      <div className="mt-2.5 p-2 bg-[#E5EFEA]/60 border border-[#00635C]/20 rounded-xl text-[11px] text-[#004742] flex items-center justify-between">
                        <span>
                          {tool.provider === 'dotloop' && `✓ Synced ${syncData.loopsCount} active loops & Form 2-T audit records`}
                          {tool.provider === 'rechat' && `✓ Synced ${syncData.listingsCount} MLS listings & ${syncData.contactsCount} contacts`}
                          {tool.provider === 'quickbooks' && `✓ Synced ${syncData.accountsCount} ledger accounts & ${syncData.recentDisbursements} disbursements`}
                          {tool.provider === 'slack' && `✓ Active channels: ${syncData.activeChannels?.join(', ')}`}
                          {tool.provider === 'google' && `✓ Synced ${syncData.calendarEventsCount} calendar events & ${syncData.roomSchedulesCount} rooms`}
                          {tool.provider === 'basecamp' && `✓ Synced ${syncData.projectsCount} marketing projects`}
                        </span>
                        <span className="font-mono text-[10px] text-[#00635C]">Live</span>
                      </div>
                    )}

                    {/* Scopes & Metrics */}
                    <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-stone-600">Scopes:</span>
                        {tool.scopes.map((s, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100/80 text-stone-700 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {tool.provider === 'rechat' && (
                          <button
                            type="button"
                            onClick={() => setShowRechatMcpModal(true)}
                            className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Configure and Test Rechat MCP (https://mcp.cluster.rechat.com/mcp)"
                          >
                            <span>Rechat MCP</span>
                          </button>
                        )}
                        {isConnected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSyncData(tool.provider)}
                              disabled={isSyncing}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Sync live data now"
                            >
                              <RefreshCw className={`w-3 h-3 text-[#00635C] ${isSyncing ? 'animate-spin' : ''}`} />
                              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePing(tool.provider)}
                              disabled={isPinging}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Test roundtrip ping latency"
                            >
                              <Activity className={`w-3 h-3 text-[#00635C] ${isPinging ? 'animate-spin' : ''}`} />
                              <span>{latency ? `${latency}ms` : 'Ping'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDisconnect(tool.provider)}
                              disabled={isConnecting}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Unlink className="w-3 h-3" />
                              <span>Disconnect</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConnect(tool.provider)}
                            disabled={isConnecting}
                            className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            {isConnecting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5" />
                            )}
                            <span>Connect via OAuth</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: PRODUCTION API CREDENTIALS */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#00635C]/10 text-[#00635C] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-stone-600 leading-relaxed">
                <strong className="text-stone-900 font-semibold block mb-0.5">Production Client Credentials</strong>
                Store your official OAuth 2.0 Client ID and Secret for live production integrations. When set, authorization flows bypass sandbox and connect directly to your vendor portal.
              </div>
            </div>

            <div className="space-y-3.5">
              {TOOLS_CATALOG.map((tool) => {
                const cred = credentialsList.find(c => c.provider === tool.provider);
                const isConfigured = cred?.hasClientId;
                const formVal = editCreds[tool.provider] || { clientId: '', clientSecret: '' };
                const isSaving = savingCredProvider === tool.provider;

                return (
                  <div key={tool.id} className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <ConnectorLogo provider={tool.provider} size="sm" className="w-5 h-5" />
                        <h4 className="font-bold text-sm text-stone-900">{tool.name}</h4>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        isConfigured 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}>
                        {isConfigured ? `CONFIGURED (${cred?.source?.toUpperCase()})` : 'NOT CONFIGURED'}
                      </span>
                    </div>

                    {isConfigured && cred?.maskedClientId && (
                      <div className="mb-3 p-2 bg-stone-50 rounded-xl text-xs text-stone-600 flex items-center justify-between font-mono">
                        <span>Active Client ID: <strong>{cred.maskedClientId}</strong></span>
                        <span className="text-emerald-600 font-semibold text-[10px]">Ready for Live Auth</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">Client ID</label>
                        <input
                          type="text"
                          placeholder={isConfigured ? 'Replace Client ID...' : 'Enter Client ID...'}
                          value={formVal.clientId}
                          onChange={(e) => setEditCreds(prev => ({
                            ...prev,
                            [tool.provider]: { ...prev[tool.provider], clientId: e.target.value, clientSecret: prev[tool.provider]?.clientSecret || '' }
                          }))}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#00635C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">Client Secret</label>
                        <input
                          type="password"
                          placeholder="Enter Client Secret..."
                          value={formVal.clientSecret}
                          onChange={(e) => setEditCreds(prev => ({
                            ...prev,
                            [tool.provider]: { clientId: prev[tool.provider]?.clientId || '', clientSecret: e.target.value }
                          }))}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#00635C]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveCredentials(tool.provider)}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Keys'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RECHAT MODEL CONTEXT PROTOCOL (MCP) INTEGRATION MODAL */}
      <RechatMcpIntegrationModal
        isOpen={showRechatMcpModal}
        onClose={() => setShowRechatMcpModal(false)}
      />
    </Drawer>
  );
}
