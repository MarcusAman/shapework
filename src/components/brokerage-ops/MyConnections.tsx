import React, { useState, useEffect } from 'react';
import { 
  Mail, Calendar, Users, Phone, FolderOpen, FileText, Sparkles, 
  MessageSquare, CheckCircle, AlertCircle, X, Shield, Eye, 
  EyeOff, HelpCircle, Lock, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import ConnectorLogo from '../ui/ConnectorLogo';

interface Integration {
  id: string;
  provider: string;
  status: 'connected' | 'stubbed' | 'planned' | 'none';
  description: string;
  priority: string;
  connectedAt?: string;
  lastSyncAt?: string;
  syncHealth?: string;
  notes?: string;
  supportedActions?: string[];
}

interface MyConnectionsProps {
  state: any;
}

export default function MyConnections({ state }: MyConnectionsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState<Integration | null>(null);
  
  // Simulated Notification Preferences
  const [notifPreferences, setNotifPreferences] = useState({
    emailEnabled: true,
    smsEnabled: false,
    dashboardEnabled: true,
    digestEnabled: true,
    urgentOnly: false,
    escalationOnly: true,
    phoneNumber: '+19105072047',
    emailAddress: 'sarah.j@nestrealty.com'
  });  const [savingPrefs, setSavingPrefs] = useState(false);

  // Retell Integration States
  const [retellStatus, setRetellStatus] = useState<{
    hasApiKey: boolean;
    agentId: string | null;
    knowledgeBaseId: string | null;
    phoneNumber: string | null;
    phoneNumberId: string | null;
    inboundCallReady: boolean;
    inboundSmsReady: boolean;
    lastSetupAt: string | null;
    setupErrors: string | null;
  } | null>(null);
  const [retellLoading, setRetellLoading] = useState(true);
  const [retellSettingUp, setRetellSettingUp] = useState(false);
  const [retellTesting, setRetellTesting] = useState<'call' | 'sms' | null>(null);

  // Fetch Integrations
  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/ops/integrations', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (e) {
      console.error('Failed to load integrations for My Connections:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetellStatus = async () => {
    try {
      const res = await fetch('/api/retell/nest-ops/status');
      if (res.ok) {
        const data = await res.json();
        setRetellStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch Retell status:', e);
    } finally {
      setRetellLoading(false);
    }
  };

  const handleRetellSetup = async () => {
    setRetellSettingUp(true);
    try {
      const res = await fetch('/api/retell/nest-ops/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Retell integration setup completed successfully!');
        fetchRetellStatus();
      } else {
        alert('Setup failed: ' + (data.error || 'Unknown error'));
        fetchRetellStatus();
      }
    } catch (err: any) {
      alert('Setup failed: ' + err.message);
    } finally {
      setRetellSettingUp(false);
    }
  };

  const handleTestCallWebhook = async () => {
    setRetellTesting('call');
    try {
      const mockPayload = {
        event: 'call_analyzed',
        call: {
          call_id: `mock_call_${Math.floor(Math.random() * 1000000)}`,
          transcript: "Agent: Thanks for calling Ask Nest Ops. I can help route your request. What's the issue?\nCaller: Hi, I'm an agent. I need some new listing flyers for 105 Forest Hills Dr. The MLS live date is next Tuesday, and Melissa is usually the one who handles this.\nAgent: Got it. I'll route this to Melissa as a listing marketing request.",
          call_analysis: {
            custom_analysis_data: {
              title: "Listing flyers request for 105 Forest Hills Dr",
              category: "marketing request",
              primary_owner: "melissa",
              urgency: "normal",
              property_address: "105 Forest Hills Dr",
              requester: "Sarah Jenkins",
              requester_contact: "+19105072047",
              description: "Listing launch flyer print materials needed for 105 Forest Hills Dr. MLS live date is next Tuesday.",
              recommended_next_action: "Draft and coordinate open house print materials with agent"
            }
          }
        }
      };

      const res = await fetch('/api/retell/nest-ops/call-analysis-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify(mockPayload)
      });
      if (res.ok) {
        alert('Mock Call Webhook triggered successfully! Task "Listing flyers request for 105 Forest Hills Dr" has been added to the Workboard.');
      } else {
        const errText = await res.text();
        alert('Webhook failed: ' + errText);
      }
    } catch (err: any) {
      alert('Webhook failed: ' + err.message);
    } finally {
      setRetellTesting(null);
    }
  };

  const handleTestSmsWebhook = async () => {
    setRetellTesting('sms');
    try {
      const mockPayload = {
        from: "+19105550199",
        to: "+19105712817",
        text: "Need Ann to check conference room projector, it seems the HDMI port is broken and we have a showing starting at 2 PM today."
      };

      const res = await fetch('/api/retell/nest-ops/inbound-sms-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify(mockPayload)
      });
      if (res.ok) {
        alert('Mock Inbound SMS processed successfully! Task "SMS Intake from +19105550199" has been added to the Workboard.');
      } else {
        const errText = await res.text();
        alert('SMS Webhook failed: ' + errText);
      }
    } catch (err: any) {
      alert('SMS Webhook failed: ' + err.message);
    } finally {
      setRetellTesting(null);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchRetellStatus();
  }, [state.workspaceId]);
  // Toggle Integration Status
  const handleToggleConnection = async (integrationId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'connected' ? 'planned' : 'connected';
    try {
      const res = await fetch(`/api/ops/integrations/${integrationId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: nextStatus,
          actorEmail: state.activeProfile?.email || 'sarah.j@nestrealty.com',
          actorName: state.activeProfile?.name || 'Sarah Jenkins'
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state list
        setIntegrations(prev => prev.map(item => item.id === integrationId ? data.integration : item));
        // Update selected if open
        if (selectedConnector?.id === integrationId) {
          setSelectedConnector(data.integration);
        }
      }
    } catch (err) {
      console.error('Failed to toggle connection:', err);
    }
  };

  // Mock connecting planned flows
  const handleSimulateOAuthConnect = (connector: Integration) => {
    alert(`[OAUTH SIMULATION] Redirecting to authorization grant flow for ${connector.provider}...\n(In production, this initiates secure tenant/user OAuth 2.0 flow)`);
    handleToggleConnection(connector.id, connector.status);
  };

  const savePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setTimeout(() => {
      setSavingPrefs(false);
      alert('Notification preferences updated successfully.');
    }, 800);
  };

  // Map Provider Name to Icons
  const getConnectorIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail':
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'google calendar':
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'microsoft teams':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'twilio':
      case 'sms':
        return <Phone className="w-5 h-5" />;
      case 'google drive':
        return <FolderOpen className="w-5 h-5 text-amber-500" />;
      case 'dotloop/skyslope/brokermint':
      case 'transactions':
        return <FileText className="w-5 h-5" />;
      case 'marketing systems':
        return <Sparkles className="w-5 h-5 text-teal-500" />;
      default:
        return <Link2Icon className="w-5 h-5" />;
    }
  };

  const Link2Icon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );

  // Connection Scopes for details drawer
  const getConnectionScopes = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gmail':
        return {
          can: ['Scan emails forwarded or sent to askNestOps@nestrealty.com', 'Monitor emails labeled with "Nest Ops" in your inbox', 'Pre-populate client name and deal notes'],
          cannot: ['Read your entire personal or confidential inbox by default', 'Delete messages', 'Send outbound emails without explicit operator validation']
        };
      case 'google calendar':
        return {
          can: ['Read availability ranges to prevent meeting double-bookings', 'Sync transaction closing deadlines to the shared calendar', 'Create task reminders'],
          cannot: ['Read contents of private event descriptions', 'Modify calendar entries not created by Nest Ops']
        };
      case 'slack':
        return {
          can: ['Listen for messages inside the approved #ask-nest-ops channel', 'Create request records when users tag @NestOps', 'Post alerts to #general when a high-priority request is logged'],
          cannot: ['Scan direct messages (DMs)', 'Listen to unapproved channels', 'View user profile statuses']
        };
      case 'microsoft teams':
        return {
          can: ['Access approved channels for request intake', 'Tag assignees in Teams notifications', 'Provide real-time ticket updates'],
          cannot: ['Read group chat history outside authorized channels', 'Access personal Outlook logs']
        };
      case 'twilio':
        return {
          can: ['Receive SMS queries sent to the hotline: +19105072047', 'Send assignment and SLA escalation text alerts', 'Allow status replies (e.g. reply "RESOLVED" to close a task)'],
          cannot: ['Scan personal SMS logs', 'Initiate unsolicited marketing texts']
        };
      case 'google drive':
        return {
          can: ['Read documents inside the shared "/Nest Realty Operations" folder', 'Link SOP templates and listing files to requests', 'Upload listing photos and marketing assets'],
          cannot: ['Browse your entire personal Google Drive', 'Delete folders', 'Access confidential corporate HR documents']
        };
      case 'dotloop/skyslope/brokermint':
        return {
          can: ['Sync deal milestones and client folders', 'Verify missing documents in compliance checklists', 'Auto-triage closed transactions'],
          cannot: ['Bypass broker compliance review', 'Modify signed contracts']
        };
      case 'marketing systems':
        return {
          can: ['Sync Rechat active listings', 'Retrieve listing photography files', 'Deploy social media templates'],
          cannot: ['Publish social updates without operator approval', 'Spend advertising budget directly']
        };
      default:
        return {
          can: ['Ingest webhook events authorized by the token'],
          cannot: ['Access unauthorized administrative records']
        };
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in p-1 text-[#F6F7F1]">
      {/* Page Header */}
      <div className="border-b border-[rgba(246,247,241,0.12)] pb-4 mb-6">
        <h1 className="font-serif font-black text-xl text-white tracking-tight">
          Connect the tools you already use
        </h1>
        <p className="text-xs text-[#D0D6BB] mt-1 font-medium leading-relaxed font-sans">
          Nest Ops works across email, calendar, calls, texts, and team messaging so operational work can be captured, routed, and tracked without forcing everyone into one new tool.
        </p>
      </div>

      {/* Info Card / Privacy Banner */}
      <div className="bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] rounded-2xl p-4 flex gap-3.5 items-start text-left shadow-lg">
        <Shield className="w-5 h-5 text-emerald-450 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-xs text-white block">Privacy-First Data Isolation</span>
          <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium">
            Nest Ops only processes approved channels, forwarded messages, labeled emails, dashboard requests, and connected workflows you authorize. We do not index your private conversations or scan non-operational folders.
          </p>
        </div>
      </div>

      {/* Connections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[rgba(246,247,241,0.10)] border border-[rgba(246,247,241,0.18)] rounded-2xl h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {integrations.map(connector => {
            const isConnected = connector.status === 'connected';
            const isStubbed = connector.status === 'stubbed';
            const isPlanned = connector.status === 'planned';
            
            return (
              <div 
                key={connector.id}
                onClick={() => setSelectedConnector(connector)}
                className="rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col justify-between space-y-4 text-left border"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="space-y-2.5">
                  {/* Icon & Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.12)] flex items-center justify-center shadow-inner hover:-translate-y-0.5 transition-all duration-200 animate-fade-in">
                      <ConnectorLogo provider={connector.provider} size="sm" className="w-6 h-6" />
                    </div>
                    <div>
                      {isConnected && (
                        <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-300 text-[9px] font-bold rounded-full border border-emerald-800/40 flex items-center gap-1 uppercase select-none font-sans">
                          <Check className="w-2.5 h-2.5" /> Connected
                        </span>
                      )}
                      {isStubbed && (
                        <span className="px-2 py-0.5 bg-amber-955/40 text-amber-350 text-[9px] font-bold rounded-full border border-amber-800/40 flex items-center gap-1 uppercase select-none font-sans">
                          <AlertCircle className="w-2.5 h-2.5 animate-pulse" /> Needs Attention
                        </span>
                      )}
                      {isPlanned && (
                        <span className="px-2 py-0.5 bg-[rgba(246,247,241,0.06)] text-[#D0D6BB] text-[9px] font-bold rounded-full border border-[rgba(246,247,241,0.12)] uppercase select-none font-sans">
                          Not Connected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1">
                    <h3 className="font-serif font-black text-xs text-white">{connector.provider}</h3>
                    <p className="text-[11px] text-[#D0D6BB] leading-relaxed line-clamp-2 font-sans font-medium">
                      {connector.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 flex items-center justify-between text-[10px] select-none">
                  <span className="text-[9px] text-[#D0D6BB] font-bold font-mono uppercase tracking-wider">
                    {isConnected ? 'Sync Active' : (isPlanned ? 'OAuth Setup' : 'Pending API')}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnector(connector);
                      }}
                      className="px-2.5 py-1 text-white hover:text-emerald-300 font-bold hover:bg-[rgba(246,247,241,0.08)] rounded-lg transition-colors cursor-pointer font-sans"
                    >
                      Configure
                    </button>
                    {isConnected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleConnection(connector.id, 'connected');
                        }}
                        className="px-2.5 py-1 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] text-white font-bold rounded-lg transition-all cursor-pointer font-sans"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateOAuthConnect(connector);
                        }}
                        className="px-2.5 py-1 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-lg transition-all cursor-pointer shadow-sm font-sans"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Notifications Preferences Form */}
      <div 
        className="rounded-[28px] p-6 shadow-lg max-w-2xl mt-8 text-left border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <h3 className="font-serif font-black text-sm text-white border-b border-[rgba(246,247,241,0.12)] pb-3 mb-4">
          Global Notification routing
        </h3>
        
        <form onSubmit={savePreferences} className="space-y-5 text-xs text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-[#D0D6BB] block tracking-wider font-mono">Notification Email</label>
              <input 
                type="email"
                value={notifPreferences.emailAddress}
                onChange={(e) => setNotifPreferences(prev => ({ ...prev, emailAddress: e.target.value }))}
                className="w-full bg-[#01362D] border border-[rgba(246,247,241,0.18)] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[9px] uppercase text-[#D0D6BB] block tracking-wider font-mono">hotline phone (SMS alerts)</label>
              <input 
                type="text"
                value={notifPreferences.phoneNumber}
                onChange={(e) => setNotifPreferences(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full bg-[#01362D] border border-[rgba(246,247,241,0.18)] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-bold text-[9px] uppercase text-[#D0D6BB] block tracking-wider font-mono">Route alerts based on severity</label>
            
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={notifPreferences.emailEnabled}
                  onChange={(e) => setNotifPreferences(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                  className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650 mt-1"
                />
                <div>
                  <span className="font-bold text-white block">Email Notifications</span>
                  <span className="text-[10px] text-[#D0D6BB] leading-tight block mt-0.5 font-medium font-sans">Send daily summaries and standard request task assignments to my work email.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={notifPreferences.smsEnabled}
                  onChange={(e) => setNotifPreferences(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                  className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650 mt-1"
                />
                <div>
                  <span className="font-bold text-white block">Urgent SMS hotline</span>
                  <span className="text-[10px] text-[#D0D6BB] leading-tight block mt-0.5 font-medium font-sans">Send immediate text messages for overdue SLA exceptions and critical compliance risks.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={notifPreferences.digestEnabled}
                  onChange={(e) => setNotifPreferences(prev => ({ ...prev, digestEnabled: e.target.checked }))}
                  className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650 mt-1"
                />
                <div>
                  <span className="font-bold text-white block">Send a daily digest</span>
                  <span className="text-[10px] text-[#D0D6BB] leading-tight block mt-0.5 font-medium font-sans">Compile all non-urgent assignments into a single briefing delivered at 8:00 AM.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPrefs}
              className="px-5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl border border-[rgba(246,247,241,0.18)] font-bold shadow-md cursor-pointer transition-colors"
            >
              {savingPrefs ? 'Saving preferences...' : 'Save notification rules'}
            </button>
          </div>
        </form>
      </div>

      {/* Ask Nest Ops Phone Agent Panel */}
      <div 
        className="rounded-[28px] p-6 shadow-lg max-w-2xl mt-8 text-left border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div className="flex items-center gap-3 border-b border-[rgba(246,247,241,0.12)] pb-4 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.12)] flex items-center justify-center shadow-inner text-emerald-400">
            <Phone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm text-white">Ask Nest Ops Phone Agent</h3>
            <span className="text-[9px] text-[#D0D6BB] uppercase tracking-wider font-bold font-mono">Retell AI Telephony & SMS Intake Integration</span>
          </div>
        </div>

        {retellLoading ? (
          <div className="py-6 flex items-center justify-center text-xs text-[#D0D6BB] font-medium font-sans gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            Loading Retell status...
          </div>
        ) : (
          <div className="space-y-5 text-xs text-[#F6F7F1]">
            
            {/* Warning if env variables are missing */}
            {!retellStatus?.hasApiKey && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-rose-250 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold text-xs block">Retell API Configuration Missing</span>
                  <p className="text-[10px] font-sans font-medium">
                    The environment variable <code className="font-mono bg-rose-950/60 px-1 py-0.5 rounded text-rose-200">RETELL_API_KEY</code> is not configured. Please add it to your server configuration or `.env` file to activate the hotline.
                  </p>
                </div>
              </div>
            )}

            {/* Configured Status Grid */}
            {retellStatus?.hasApiKey && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agent & Prompt */}
                <div className="p-4 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-2xl space-y-2 text-left">
                  <span className="text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono block">Voice Agent Brain (LLM)</span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Hotline Agent ID:</span>
                    <span className="font-mono text-emerald-400 font-bold select-all">
                      {retellStatus.agentId ? retellStatus.agentId.substring(0, 14) + '...' : 'Not Provisioned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Knowledge Base:</span>
                    <span className="font-mono text-[#D0D6BB] select-all">
                      {retellStatus.knowledgeBaseId ? retellStatus.knowledgeBaseId.substring(0, 14) + '...' : 'Not Linked'}
                    </span>
                  </div>
                </div>

                {/* Telephony Connection */}
                <div className="p-4 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-2xl space-y-2 text-left">
                  <span className="text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono block">Intake Line (Telephony)</span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Target Number:</span>
                    <span className="font-bold text-white select-all">{retellStatus.phoneNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">Binding Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      retellStatus.phoneNumberId ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-rose-955/40 text-rose-350 border border-rose-800/40'
                    }`}>
                      {retellStatus.phoneNumberId ? 'Bound / Connected' : 'Setup Required'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Setup Status Footer */}
            {retellStatus?.hasApiKey && (
              <div className="flex flex-wrap items-center justify-between text-[10px] bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.04)] rounded-2xl p-3">
                <div className="space-y-0.5">
                  <span className="text-[#D0D6BB]/70 font-semibold block">
                    Last Setup: <span className="font-mono text-white">{retellStatus.lastSetupAt ? new Date(retellStatus.lastSetupAt).toLocaleString() : 'Never'}</span>
                  </span>
                  {retellStatus.setupErrors && (
                    <span className="text-rose-400 font-sans font-medium block">
                      Errors: {retellStatus.setupErrors}
                    </span>
                  )}
                </div>
                <div className="flex gap-2.5 mt-2 sm:mt-0 select-none">
                  {/* Webhook URLs for Agent Level */}
                  {retellStatus.agentId && (
                    <div className="text-[10px] text-[#D0D6BB] font-mono mr-2 flex flex-col items-end justify-center">
                      <span className="text-[8px] uppercase font-bold tracking-wider opacity-60">Inbound Call Webhook URL</span>
                      <span className="text-white text-[9px] select-all bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">{window.location.origin}/api/retell/nest-ops/inbound-webhook</span>
                    </div>
                  )}
                  <button
                    onClick={handleRetellSetup}
                    disabled={retellSettingUp}
                    className="px-4 py-1.5 bg-[#00635C] hover:bg-[#007c73] disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    {retellSettingUp ? 'Deploying...' : 'Provision Agent'}
                  </button>
                </div>
              </div>
            )}

            {/* Diagnostic Webhook Testing Console */}
            {retellStatus?.hasApiKey && retellStatus.agentId && (
              <div className="border-t border-[rgba(246,247,241,0.12)] pt-4 space-y-3">
                <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono block">Interactive Diagnostic Triggers</span>
                <p className="text-[10px] text-[#D0D6BB] font-sans font-medium leading-relaxed">
                  Trigger synthetic webhook payloads locally to verify structured post-call analysis routing, queue mapping, and workspace task generation.
                </p>
                <div className="flex flex-wrap gap-3 select-none">
                  <button
                    onClick={handleTestCallWebhook}
                    disabled={!!retellTesting}
                    className="px-4 py-2 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] disabled:opacity-50 text-white rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {retellTesting === 'call' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Test Call Webhook
                  </button>
                  <button
                    onClick={handleTestSmsWebhook}
                    disabled={!!retellTesting}
                    className="px-4 py-2 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] disabled:opacity-50 text-white rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {retellTesting === 'sms' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Test SMS Webhook
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Connection Detail Drawer */}
      {selectedConnector && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedConnector(null)}
          />
          {/* Drawer content */}
          <div className="relative w-[480px] bg-[#01362D] h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-left z-50 border-l border-[rgba(246,247,241,0.18)] text-left">
            <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.12)] flex items-center justify-center font-bold">
                  <ConnectorLogo provider={selectedConnector.provider} size="sm" className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-sm text-white">{selectedConnector.provider}</h2>
                  <span className="text-[9px] text-[#D0D6BB] uppercase tracking-wider font-bold font-mono">Scope Setup & Privacy Rules</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConnector(null)}
                className="p-1 rounded-lg hover:bg-[rgba(246,247,241,0.08)] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Info */}
            <div className="space-y-6 flex-1 text-xs text-[#F6F7F1]">
              <div className="bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#D0D6BB] font-bold uppercase tracking-wider font-mono">STATUS</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[8px] border ${
                    selectedConnector.status === 'connected' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' :
                    (selectedConnector.status === 'stubbed' ? 'bg-amber-955/40 text-amber-350 border-amber-800/40' : 'bg-[rgba(246,247,241,0.06)] text-[#D0D6BB] border border-[rgba(246,247,241,0.12)]')
                  }`}>
                    {selectedConnector.status === 'connected' ? 'Connected' : (selectedConnector.status === 'stubbed' ? 'Needs Attention' : 'Not Connected')}
                  </span>
                </div>
                {selectedConnector.lastSyncAt && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider font-mono">LAST SYNCHRONIZED</span>
                    <span className="font-mono font-medium text-white">{new Date(selectedConnector.lastSyncAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedConnector.notes && (
                  <div className="space-y-1 text-[10px]">
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider font-mono block">DIAGNOSTIC STATUS NOTES</span>
                    <p className="text-white leading-normal font-sans">{selectedConnector.notes}</p>
                  </div>
                )}
              </div>

              {/* Data Access Scopes */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-xs">Access Authorization & Privacy Scope</h4>
                
                {/* What Nest Ops can access */}
                <div className="space-y-2">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-400 font-mono block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> WHAT NEST OPS CAN SCAN:
                  </span>
                  <ul className="space-y-2 pl-3 font-sans font-medium text-[#D0D6BB]">
                    {getConnectionScopes(selectedConnector.provider).can.map((item, idx) => (
                      <li key={idx} className="list-disc leading-normal pl-1">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* What Nest Ops will NOT access */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-rose-500 font-mono block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> WHAT NEST OPS WILL NOT ACCESS:
                  </span>
                  <ul className="space-y-2 pl-3 font-sans font-medium text-[#D0D6BB]">
                    {getConnectionScopes(selectedConnector.provider).cannot.map((item, idx) => (
                      <li key={idx} className="list-disc leading-normal pl-1">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Privacy Warning */}
              <div className="bg-rose-955/35 border border-rose-900 rounded-2xl p-4 flex gap-3 text-rose-300 text-left">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-450" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[10px] uppercase font-mono tracking-wider block">Security & Token Storage Policy</span>
                  <p className="text-[10px] text-rose-250 leading-relaxed font-medium font-sans">
                    Nest Ops does not store your direct login passwords locally. Authorization is handled via secure, scoped OAuth 2.0 protocol tokens, which are saved in the brokerage's secure database server-side.
                  </p>
                </div>
              </div>

              {/* Sync Logs */}
              {selectedConnector.status === 'connected' && (
                <div className="space-y-2.5">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB] font-mono block">RECENT SYNC LOG</span>
                  <div className="bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl p-3 font-mono text-[9px] text-[#D0D6BB] space-y-1.5 leading-normal text-left">
                    <div className="flex justify-between border-b border-[rgba(246,247,241,0.08)] pb-1">
                      <span>[INFO] Webhook triggers listening...</span>
                      <span className="text-[8px] text-[#D0D6BB]/50">03 Mins ago</span>
                    </div>
                    <div className="flex justify-between border-b border-[rgba(246,247,241,0.08)] pb-1">
                      <span>[INFO] Database diff check completed. 0 updates.</span>
                      <span className="text-[8px] text-[#D0D6BB]/50">10 Mins ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>[INFO] Connection verified successfully.</span>
                      <span className="text-[8px] text-[#D0D6BB]/50">30 Mins ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="border-t border-[rgba(246,247,241,0.12)] pt-4 mt-6 flex justify-end gap-3 select-none">
              <button 
                onClick={() => setSelectedConnector(null)}
                className="px-4 py-2 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              {selectedConnector.status === 'connected' ? (
                <button
                  onClick={() => handleToggleConnection(selectedConnector.id, 'connected')}
                  className="px-4 py-2 bg-rose-950/45 text-rose-250 border border-rose-800/60 hover:bg-rose-900/40 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Disconnect Credentials
                </button>
              ) : (
                <button
                  onClick={() => handleSimulateOAuthConnect(selectedConnector)}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-xl text-xs border border-[rgba(246,247,241,0.18)] shadow-md transition-colors cursor-pointer"
                >
                  Grant OAuth Permission
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
