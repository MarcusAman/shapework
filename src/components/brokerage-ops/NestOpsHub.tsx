import React, { useState, useEffect } from 'react';
import { 
  Inbox, HelpCircle, Plus, FileText, ArrowRight, UserCheck, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, User, 
  MapPin, Shield, Activity, ListTodo, Check, X, Mail, Phone, Lock, MessageSquare
} from 'lucide-react';
import MorningBriefing from '../command/MorningBriefing';
import ConnectorLogo from '../ui/ConnectorLogo';
import LocationSelectorDropdown, { getStoredLocation, BrokerageLocation } from '../ui/LocationSelectorDropdown';

interface NestOpsHubProps {
  state: any;
  mode?: 'full' | 'search_only' | 'activity_only';
}

export default function NestOpsHub({ state, mode = 'full' }: NestOpsHubProps) {
  const [currentLocation, setCurrentLocation] = useState<BrokerageLocation>(getStoredLocation);

  useEffect(() => {
    const handleLoc = (e: any) => {
      setCurrentLocation(getStoredLocation());
    };
    window.addEventListener('shapework_location_changed', handleLoc);
    return () => window.removeEventListener('shapework_location_changed', handleLoc);
  }, []);
  const {
    jobs = [],
    steps = [],
    opsAssets = [],
    cameraOffline = false,
    opsCameraEvents = [],
    opsLogs = []
  } = state;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');

  // Integration statuses & Voice Speech recognition state
  const [googleConn, setGoogleConn] = useState<any>({ connected: false });
  const [microsoftConn, setMicrosoftConn] = useState<any>({ connected: false });
  const [slackConn, setSlackConn] = useState<any>({ connected: false });
  const [rechatConn, setRechatConn] = useState<any>({ connected: false });
  const [dotloopConn, setDotloopConn] = useState<any>({ connected: false });
  const [showConnectorPicker, setShowConnectorPicker] = useState(false);
  const [activeAppDetail, setActiveAppDetail] = useState<string | null>(null);

  // Microphone voice recognition
  const [micState, setMicState] = useState<'idle' | 'requesting' | 'listening' | 'processing' | 'error'>('idle');
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [activeHubTab, setActiveHubTab] = useState<'assistant' | 'activity'>('assistant');
  const [activeQuery, setActiveQuery] = useState<{
    prompt: string;
    answer: string;
    actionTitle?: string;
    actionTarget?: string;
    actionDetails?: string;
    executed?: boolean;
  } | null>(null);

  const handleAskPrompt = (promptText: string) => {
    setChatPrompt(promptText);
    const text = promptText.toLowerCase();
    
    if (text.includes('attention') || text.includes('today')) {
      setActiveQuery({
        prompt: promptText,
        answer: 'Cross-analyzing SOP runs, Basecamp task pipeline, and physical sign assets... Found 2 items needing attention: 1 overdue sign installation at 105 Forest Hills Dr, and 1 compliance disclosure review for Taylor Morgan.',
        actionTitle: 'Dispatch Sign Vendor & Escalate File Review',
        actionTarget: 'Vendor Dispatch & Compliance Cockpit',
        actionDetails: 'Assign sign installation to Wilmington Vendor Team and flag file for Ryan.',
        executed: false
      });
    } else if (text.includes('pipeline') || text.includes('stuck')) {
      setActiveQuery({
        prompt: promptText,
        answer: 'Operating pipeline summary: 6 transactions active, 2 items stuck waiting on listing disclosure sign-offs, $45,000 net income logged in QuickBooks ledger (30d).',
        actionTitle: 'Notify Assigned Coordinators for Stuck Items',
        actionTarget: 'Role & Escalation Pipeline',
        actionDetails: 'Send automated reminder pings to Listing Specialist and Office Coordinator.',
        executed: false
      });
    } else if (text.includes('vendor') || text.includes('dispatch') || text.includes('sop')) {
      setActiveQuery({
        prompt: promptText,
        answer: 'Checked 4 published SOP procedures and active vendor dispatches: 3 runs completed on schedule, 1 repair order pending vendor arrival at 804 Chestnut St.',
        actionTitle: 'Approve Repair Vendor Invoice & Log SOP Step',
        actionTarget: 'Vendor Dispatch & SOP Runs',
        actionDetails: 'Log SOP completion and issue payout record to QuickBooks integration.',
        executed: false
      });
    } else {
      setActiveQuery({
        prompt: promptText,
        answer: `Analyzed brokerage operational records for "${promptText}". Synthesized 3 relevant SOP procedures, 2 active listing notes, and current team availability.`,
        actionTitle: `Execute Action for "${promptText}"`,
        actionTarget: 'Brokerage Operations Cockpit',
        actionDetails: 'Create tracked operational task and assign to office coordinator.',
        executed: false
      });
    }
  };

  const fetchConnectionStatuses = async () => {
    try {
      const gRes = await fetch('/api/integrations/google/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (gRes.ok) setGoogleConn(await gRes.json());
    } catch (e) {}

    try {
      const mRes = await fetch('/api/integrations/microsoft/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (mRes.ok) setMicrosoftConn(await mRes.json());
    } catch (e) {}

    try {
      const sRes = await fetch('/api/integrations/slack/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (sRes.ok) setSlackConn(await sRes.json());
    } catch (e) {}

    try {
      const rRes = await fetch('/api/integrations/rechat/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (rRes.ok) setRechatConn(await rRes.json());
    } catch (e) {}

    try {
      const dRes = await fetch('/api/integrations/apination/dotloop/status', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (dRes.ok) setDotloopConn(await dRes.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchConnectionStatuses();
  }, [state.workspaceId]);

  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState('error');
      setMicErrorMsg('Voice input is not supported in this browser.');
      setTimeout(() => {
        setMicState('idle');
        setMicErrorMsg(null);
      }, 4000);
      return;
    }

    setMicState('requesting');
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setMicState('listening');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatPrompt(prev => prev ? prev + ' ' + transcript : transcript);
        }
        setMicState('processing');
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setMicState('error');
        setMicErrorMsg(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition error.');
        setTimeout(() => {
          setMicState('idle');
          setMicErrorMsg(null);
        }, 4000);
      };

      rec.onend = () => {
        setMicState('idle');
      };

      setRecognitionInstance(rec);
      rec.start();
    } catch (err: any) {
      console.error(err);
      setMicState('error');
      setMicErrorMsg('Failed to initialize microphone.');
      setTimeout(() => {
        setMicState('idle');
        setMicErrorMsg(null);
      }, 4000);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setMicState('idle');
    }
  };

  const getConnectionDetails = (appId: string) => {
    switch (appId) {
      case 'google_workspace':
      case 'google_calendar':
      case 'google_drive':
        return {
          id: 'google_workspace',
          displayName: 'Google Workspace',
          shortName: 'Google',
          connected: googleConn.connected,
          scopes: googleConn.scopes || ['Gmail', 'Calendar', 'Drive'],
          lastSync: googleConn.lastSyncedAt ? new Date(googleConn.lastSyncedAt).toLocaleString() : 'Never',
          access: ['Send Gmail notifications', 'Read calendar events to coordinate listing dates', 'Verify document checklists in Google Drive'],
          noAccess: ['Access your Google Account password', 'Modify or delete arbitrary files', 'Access payment credentials'],
          connectUrl: '/api/integrations/google/connect',
          disconnectUrl: '/api/integrations/google/disconnect',
          syncUrl: '/api/integrations/google/sync'
        };
      case 'microsoft_365':
      case 'microsoft_teams':
        return {
          id: 'microsoft_365',
          displayName: 'Microsoft 365 / Outlook',
          shortName: 'Microsoft',
          connected: microsoftConn.connected,
          scopes: microsoftConn.scopes || ['Mail.Read', 'Calendars.Read'],
          lastSync: microsoftConn.lastSyncedAt ? new Date(microsoftConn.lastSyncedAt).toLocaleString() : 'Never',
          access: ['Sync Outlook emails to scan listing contract status', 'Read Outlook calendars'],
          noAccess: ['Access M365 master billing account details', 'Edit Teams channel policies'],
          connectUrl: '/api/integrations/microsoft/connect',
          disconnectUrl: '/api/integrations/microsoft/disconnect',
          syncUrl: '/api/integrations/microsoft/sync'
        };
      case 'slack':
        return {
          id: 'slack',
          displayName: 'Slack Integration',
          shortName: 'Slack',
          connected: slackConn.connected,
          scopes: ['incoming-webhook', 'commands'],
          lastSync: 'Sync active',
          access: ['Post automated alerts on critical transaction exceptions', 'Listen for inline slash commands'],
          noAccess: ['Read private direct messages (DMs)', 'Access channel audit logs'],
          connectUrl: '/api/integrations/slack/connect',
          disconnectUrl: '/api/integrations/slack/disconnect',
          syncUrl: '/api/integrations/slack/sync'
        };
      case 'sms_phone':
        return {
          id: 'sms_phone',
          displayName: 'SMS / Twilio Gateway',
          shortName: 'SMS',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Send SMS texts to listing agents for photography alerts', 'Collect sign install feedback texts'],
          noAccess: ['Read private personal messages'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      case 'rechat':
        return {
          id: 'rechat',
          displayName: 'Rechat CRM',
          shortName: 'Rechat',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Sync contact details & pipeline status', 'Trigger automated workflow campaigns'],
          noAccess: ['Directly modify password database'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      case 'dotloop':
        return {
          id: 'dotloop',
          displayName: 'Dotloop Transactions',
          shortName: 'Dotloop',
          connected: false,
          scopes: [],
          lastSync: 'N/A',
          access: ['Sync transaction loops and folders', 'Validate MLS and compliance sheets'],
          noAccess: ['Sign signature documents on your behalf'],
          connectUrl: null,
          disconnectUrl: null,
          syncUrl: null
        };
      default:
        return null;
    }
  };

  const handleConnectProvider = async (appId: string) => {
    const details = getConnectionDetails(appId);
    if (!details || !details.connectUrl) {
      alert('Setup required: Twilio config routes are planned but not configured in this environment.');
      return;
    }

    try {
      const res = await fetch(details.connectUrl + `?workspaceId=${state.workspaceId || 'nest-realty-demo'}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initiate OAuth flow.');
      }
    } catch (e: any) {
      alert('Error initiating OAuth: ' + e.message);
    }
  };

  const handleDisconnectProvider = async (appId: string) => {
    const details = getConnectionDetails(appId);
    if (!details || !details.disconnectUrl) return;

    if (!window.confirm(`Are you sure you want to disconnect ${details.displayName}?`)) {
      return;
    }

    try {
      const res = await fetch(details.disconnectUrl + `?workspaceId=${state.workspaceId || 'nest-realty-demo'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert(`${details.displayName} disconnected successfully.`);
        await fetchConnectionStatuses();
      } else {
        alert('Failed to disconnect connection.');
      }
    } catch (e: any) {
      alert('Error disconnecting: ' + e.message);
    }
  };

  // Intake Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<any>('normal');
  const [deadline, setDeadline] = useState('');
  const [property, setProperty] = useState('');
  const [requesterName, setRequesterName] = useState(state.activeProfile?.name || 'Sarah Jenkins');
  const [requesterEmail, setRequesterEmail] = useState(state.activeProfile?.email || 'sarah.j@nestrealty.com');
  const [preferredChannel, setPreferredChannel] = useState('dashboard');

  // Request Update State
  const [newStatus, setNewStatus] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Requests from Backend
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/ops/requests', {
        headers: {
          'x-workspace-id': state.workspaceId || 'nest-realty-demo',
          'x-user-role': state.activeProfile?.role || 'regional_leader',
          'x-user-email': state.activeProfile?.email || 'ryan@nestrealty.com'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error('Failed to fetch requests for Nest Ops Hub:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [state.activeProfile, state.workspaceId]);

  // Support Card Trigger Listener
  useEffect(() => {
    const handleOpenIntake = () => {
      setShowIntakeModal(true);
    };
    window.addEventListener('open-intake-modal', handleOpenIntake);
    return () => window.removeEventListener('open-intake-modal', handleOpenIntake);
  }, []);

  // Submit Intake Form
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and Description are required.');
      return;
    }

    try {
      const res = await fetch('/api/ops/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          title,
          description,
          urgency,
          deadline: deadline || undefined,
          requesterName,
          requesterEmail,
          requesterRole: state.activeProfile?.role || 'agent',
          preferredChannel,
          linkedProperty: property || undefined
        })
      });

      if (res.ok) {
        // Reset Form
        setTitle('');
        setDescription('');
        setProperty('');
        setDeadline('');
        setUrgency('normal');
        setPreferredChannel('dashboard');
        setShowIntakeModal(false);
        setChatPrompt('');
        // Refresh List
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to submit intake request:', err);
    }
  };

  // Update Request properties
  const handleRequestUpdate = async () => {
    if (!selectedRequest) return;
    setIsUpdating(true);

    let assignedRole = '';
    if (newOwner === 'Ryan') assignedRole = 'regional_leader';
    else if (newOwner === 'Ann') assignedRole = 'operations_manager';
    else if (newOwner === 'James') assignedRole = 'accounting_manager';
    else if (newOwner === 'Melissa') assignedRole = 'marketing_manager';
    else if (newOwner === 'BIC Demo User') assignedRole = 'bic';
    else assignedRole = 'triage_operator';

    try {
      const res = await fetch(`/api/ops/requests/${selectedRequest.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: newStatus || undefined,
          assignedOwner: newOwner || undefined,
          assignedRole: newOwner ? assignedRole : undefined,
          notes: internalNotes || undefined,
          resolutionSummary: resolutionSummary || undefined,
          escalationLevel: newStatus === 'escalated' ? selectedRequest.escalationLevel + 1 : undefined,
          actorEmail: state.activeProfile?.email || 'sarah.j@nestrealty.com',
          actorName: state.activeProfile?.name || 'Sarah Jenkins'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data.request);
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectRequestForDetail = (req: any) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setNewOwner(req.assignedOwner || '');
    setInternalNotes(req.notes || '');
    setResolutionSummary(req.resolutionSummary || '');
  };

  // Local AI classification simulator details
  const getAIClassificationDetails = (titleText: string, descText: string) => {
    const text = `${titleText} ${descText}`.toLowerCase();
    
    let suggestedOwner = 'Shapework Triage';
    let suggestedRole = 'triage_operator';
    let type = 'General operations';
    let missingInfo = ['No property address specified', 'Awaiting contact confirmation'];
    let sla = '4 business days';

    if (text.includes('sign') || text.includes('rider')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Sign request';
      missingInfo = ['Install location detail', 'Rider text requirements'];
      sla = '2 business days';
    } else if (text.includes('lockbox') || text.includes('keys')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Lockbox request';
      missingInfo = ['Lockbox serial code', 'Access requirements'];
      sla = '2 business days';
    } else if (text.includes('marketing') || text.includes('flyer') || text.includes('postcard')) {
      suggestedOwner = 'Melissa';
      suggestedRole = 'marketing_manager';
      type = 'Marketing request';
      missingInfo = ['Property photos', 'Target audience/listing details'];
      sla = '3 business days';
    } else if (text.includes('compliance') || text.includes('contract') || text.includes('disclosure')) {
      suggestedOwner = 'BIC Demo User';
      suggestedRole = 'bic';
      type = 'Compliance question';
      missingInfo = ['Transaction folder ID', 'Signed checklist link'];
      sla = '1 business day';
    } else if (text.includes('commission') || text.includes('payment') || text.includes('check')) {
      suggestedOwner = 'James';
      suggestedRole = 'accounting_manager';
      type = 'Accounting / commission issue';
      missingInfo = ['Settlement statement (ALTA/CD)', 'QuickBooks invoice ref'];
      sla = '2 business days';
    } else if (text.includes('onboarding') || text.includes('agent')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Agent onboarding';
      missingInfo = ['State license number', 'MLS account details'];
      sla = '2 business days';
    } else if (text.includes('office') || text.includes('room')) {
      suggestedOwner = 'Ann';
      suggestedRole = 'operations_manager';
      type = 'Office issue';
      missingInfo = ['Conference room A/B booking logs'];
      sla = '2 business days';
    }

    return {
      type,
      suggestedOwner,
      suggestedRole,
      missingInfo,
      sla
    };
  };

  const liveClassification = getAIClassificationDetails(title, description);

  // Compute Command Center Metrics
  const openWork = jobs.filter((j: any) => j.status !== 'completed').length;
  const overdueWork = jobs.filter((j: any) => j.status === 'overdue' || j.priority === 'critical').length;
  const needsApproval = steps.filter((s: any) => s.status === 'waiting_approval').length;
  const blockedItems = jobs.filter((j: any) => j.status === 'blocked').length;
  const assetExceptions = opsAssets.filter((a: any) => a.status === 'missing' || a.status === 'overdue').length;
  const complianceRisks = jobs.filter((j: any) => j.status !== 'completed' && (j.workflowKey === 'closing_compliance_risk' || j.workflowKey === 'missing_document' || j.workflowKey === 'compliance_chase')).length;

  return (
    <div className="space-y-6 text-[#F6F7F1] font-sans text-xs text-left pt-0">
      


      {/* Camera Warning Banner */}
      {cameraOffline && (
        <div className="bg-amber-950/40 border border-amber-800 text-amber-250 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs font-sans text-left animate-pulse">
          <div className="space-y-0.5">
            <span className="font-bold text-xs block text-white">Tapo Camera Relay Offline</span>
            <span className="text-[10px] text-amber-300/80">Tapo TCW-61 camera credentials are loaded, but the browser-safe live stream relay is currently unreachable.</span>
          </div>
          <button
            onClick={() => state.setCurrentTab('Camera Signals')}
            className="px-2.5 py-1 bg-amber-800 text-white font-bold rounded-lg hover:bg-amber-900 text-[10px] cursor-pointer"
          >
            Inspect Status
          </button>
        </div>
      )}

      {/* Hero Central Chat Interaction */}
      {(mode === 'search_only' || (mode === 'full' && activeHubTab === 'assistant')) && (
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-2 pb-4">
        <div className="space-y-3">
          {/* Small Nest Ops Hub Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.16)] text-[#D0D6BB] rounded-full text-xs font-semibold uppercase tracking-wider select-none">
            <img src="/nest_n.png" alt="" className="w-3.5 h-3.5 object-contain" />
            <span>Ask Nest Ops</span>
          </div>
          
          <h2 className="font-serif font-black text-5xl text-white tracking-tight leading-none">Ask Nest Ops</h2>
          <p className="text-sm text-[#D0D6BB] font-medium font-sans tracking-wide">One starting point for brokerage operations.</p>
        </div>

        {/* Large Central Prompt Box */}
        <div className={`w-full max-w-[840px] mx-auto relative ask-nest-input-outer ${micState === 'listening' ? 'is-listening' : ''}`}>
          <div className="ask-nest-input-border-run" />
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatPrompt.trim()) return;
              handleAskPrompt(chatPrompt.trim());
            }}
            className="w-full p-4.5 rounded-[30px] flex items-center gap-3.5 relative group transition-all ask-nest-input-inner"
          >
          {/* Plus button to add context / connect apps */}
          <button
            type="button"
            onClick={() => setShowConnectorPicker(true)}
            className="p-2.5 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.16)] hover:border-[rgba(246,247,241,0.24)] rounded-2xl text-[#D0D6BB] hover:text-white hover:bg-[rgba(246,247,241,0.15)] shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            title="Add Context or Connected Apps"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input 
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder={
              micState === 'requesting'
                ? 'Requesting microphone permission...'
                : micState === 'listening'
                  ? 'Listening... Speak now...'
                  : micState === 'processing'
                    ? 'Processing speech...'
                    : micErrorMsg || 'Ask Nest Ops anything across SOPs, Basecamp, QuickBooks, listings, or compliance...'
            }
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-[rgba(246,247,241,0.45)] focus:outline-none py-2 font-sans"
          />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={micState === 'listening' ? stopVoiceInput : startVoiceInput}
              className={`p-2.5 border rounded-2xl text-[#D0D6BB] hover:text-white shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 ${
                micState === 'listening' 
                  ? 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse' 
                  : 'bg-[rgba(246,247,241,0.08)] border-[rgba(246,247,241,0.16)]'
              }`}
              title={micState === 'listening' ? 'Stop Listening' : 'Voice Command (Speech to Text)'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            <button
              type="submit"
              className="p-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl shadow-[0_2px_12px_rgba(0,99,92,0.5)] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>

        {/* Connected App Tray */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 select-none py-1">
          <span className="text-[10px] font-semibold text-[#D0D6BB]/75 mr-1">Connected tools</span>

          {/* Plus icon to add */}
          <button
            type="button"
            onClick={() => setShowConnectorPicker(true)}
            className="flex items-center justify-center w-7 h-7 bg-[rgba(246,247,241,0.05)] border border-[rgba(246,247,241,0.12)] hover:border-[rgba(246,247,241,0.22)] rounded-full hover:bg-[rgba(246,247,241,0.08)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer text-[#D0D6BB] hover:text-white"
            title="Add Context or Connected Apps"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {[
            { id: 'google_workspace', name: 'Gmail', connected: true },
            { id: 'google_calendar', name: 'Calendar', connected: true },
            { id: 'google_drive', name: 'Drive', connected: true },
            { id: 'flex_mls', name: 'FlexMLS', connected: true },
            { id: 'quickbooks', name: 'QuickBooks', connected: true },
            { id: 'dotloop', name: 'Dotloop', connected: true },
            { id: 'rechat', name: 'Rechat', connected: true },
            { id: 'canva_pro', name: 'Canva Pro', connected: true },
          ].map((app) => {
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  if (app.comingSoon) {
                    alert(`${app.name} integration is coming soon! Direct Loop & CRM bridges are under development.`);
                  } else {
                    setActiveAppDetail(app.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer hover:shadow-[0_0_10px_rgba(208,214,187,0.25)] ${
                  app.comingSoon
                    ? 'bg-[rgba(246,247,241,0.01)] border-dashed border-[rgba(246,247,241,0.08)] text-[#F6F7F1]/30 opacity-60 hover:opacity-90'
                    : app.connected
                      ? 'bg-[rgba(0,99,92,0.12)] border-[rgba(0,99,92,0.28)] text-white hover:bg-[rgba(0,99,92,0.2)] shadow-sm'
                      : 'bg-[rgba(246,247,241,0.03)] border-[rgba(246,247,241,0.12)] text-[#F6F7F1]/75 hover:bg-[rgba(246,247,241,0.08)]'
                }`}
                title={app.comingSoon ? `${app.name} (Coming Soon)` : `View ${app.name} Details`}
              >
                <ConnectorLogo provider={app.id} size="sm" className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
                <span>{app.name}</span>
                {app.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {app.comingSoon && <span className="text-[7.5px] px-1 py-0.2 bg-[rgba(208,214,187,0.12)] border border-[rgba(208,214,187,0.18)] text-[#D0D6BB] rounded font-sans uppercase font-bold scale-90">Soon</span>}
              </button>
            );
          })}

          {/* Add app button at the end */}
          <button
            type="button"
            onClick={() => setShowConnectorPicker(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.14)] hover:border-[rgba(246,247,241,0.24)] text-[10px] font-bold text-[#D0D6BB] rounded-full hover:bg-[rgba(246,247,241,0.08)] hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Quick Action Chips - Core Operational Trio & Key Queries */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto select-none pt-2">
          {[
            { label: '⚡ What needs my attention today?', prompt: 'What needs my attention today?' },
            { label: '📊 Summarize brokerage pipeline & stuck items', prompt: 'Summarize brokerage pipeline & stuck items' },
            { label: '🛠️ Check vendor dispatches & open SOP runs', prompt: 'Check vendor dispatches & open SOP runs' },
            { label: '👥 Who handles this transaction?', prompt: 'Who handles this transaction escalation?' },
            { label: '📋 Draft Weekly Owner Briefing', prompt: 'Draft Weekly Owner Briefing summary' },
            { label: '🚨 Show compliance risks', prompt: 'Show compliance risks & missing documents' }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskPrompt(chip.prompt)}
              className="px-3.5 py-1.5 bg-[rgba(246,247,241,0.08)] hover:bg-[#00635C] border border-[rgba(246,247,241,0.22)] hover:border-emerald-500/40 rounded-full text-xs font-semibold text-[#F6F7F1] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 hover:shadow-[0_2px_12px_rgba(0,99,92,0.3)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Active Query AI Response Card & Two-Stage Approval */}
        {activeQuery && (
          <div 
            className="mt-6 max-w-3xl mx-auto rounded-[28px] p-6 text-left space-y-4 shadow-2xl animate-fade-in"
            style={{
              background: 'rgba(246, 247, 241, 0.12)',
              border: '1px solid rgba(246, 247, 241, 0.22)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <img src="/nest_n.png" alt="" className="w-4 h-4 object-contain" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Ask Nest Ops Response</span>
              </div>
              <button
                onClick={() => setActiveQuery(null)}
                className="text-[#D0D6BB]/60 hover:text-white text-xs font-mono"
              >
                Dismiss ✕
              </button>
            </div>

            <p className="text-sm text-white font-medium leading-relaxed font-sans">
              {activeQuery.answer}
            </p>

            {/* Action Card - Two-Stage Approval Preview */}
            {activeQuery.actionTitle && (
              <div className="bg-black/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-serif font-black text-white uppercase tracking-wider block">
                      Recommended Action: {activeQuery.actionTitle}
                    </span>
                    <span className="text-[10px] text-[#D0D6BB] font-mono block">
                      Target: {activeQuery.actionTarget}
                    </span>
                  </div>
                  {activeQuery.executed ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" /> Approved & Executed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                      Pending Two-Stage Approval
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#D0D6BB] leading-relaxed">
                  {activeQuery.actionDetails}
                </p>

                {!activeQuery.executed && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveQuery(prev => prev ? { ...prev, executed: true } : null);
                      }}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-mono font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer uppercase flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Approve & Execute
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* KPI Neumorphic Row / Status Strip */}
      {(mode === 'activity_only' || (mode === 'full' && activeHubTab === 'activity')) && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Tasks', val: openWork, icon: Inbox, trend: 'Active coworker runs' },
          { label: 'Overdue Items', val: overdueWork, icon: Clock, trend: 'Overdue target deadlines', danger: overdueWork > 0 },
          { label: 'Needs Approval', val: needsApproval, icon: UserCheck, trend: 'Human-in-the-loop steps', warning: needsApproval > 0 },
          { label: 'Blocked Runs', val: blockedItems, icon: HelpCircle, trend: 'Requires agent reply', danger: blockedItems > 0 },
          { label: 'Asset Exceptions', val: assetExceptions, icon: AlertTriangle, trend: 'Signs missing/overdue', warning: assetExceptions > 0 },
          { label: 'Compliance Risks', val: complianceRisks, icon: Shield, trend: 'Audits requiring review', warning: complianceRisks > 0 }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="rounded-2xl p-4 flex flex-col justify-between space-y-2.5 transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                boxShadow: '14px 18px 40px rgba(0,0,0,0.22), inset 1px 1px 0 rgba(255,255,255,0.10)'
              }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#D0D6BB]">{kpi.label}</span>
                <div className="p-1.5 rounded-lg bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)]">
                  <Icon className={`w-3.5 h-3.5 ${kpi.danger ? 'text-[#D96B5F]' : kpi.warning ? 'text-[#D8A755]' : 'text-[#D0D6BB]'}`} />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-3xl font-serif font-black text-white leading-none">{kpi.val}</div>
                <span className="text-[9px] text-[rgba(246,247,241,0.48)] block font-semibold">{kpi.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Morning Briefing & Next Actions Layout */}
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

        {/* Suggested Next Actions */}
        <div 
          className="rounded-[28px] p-6 space-y-4 text-left"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <h3 className="font-serif text-base font-black text-white">Suggested Next Actions</h3>
          <div className="divide-y divide-[rgba(246,247,241,0.12)] pr-1 max-h-[300px] overflow-y-auto">
            {opsCameraEvents && opsCameraEvents.filter((e: any) => e.status === 'new' || e.status === 'needs_review').slice(0, 3).map((event: any, idx: number) => (
              <div key={`cam-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-white block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    Camera Signal: {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-[#D0D6BB]">{event.suggestedAction} (Confidence: {((event.confidence || 0.8) * 100).toFixed(0)}%)</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Camera Signals')}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  Review Alert
                </button>
              </div>
            ))}
            {steps && steps.filter((s: any) => s.status === 'waiting_approval').slice(0, 3).map((step: any, idx: number) => (
              <div key={`step-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-white block">{step.step_name}</span>
                  <span className="text-[10px] text-[#D0D6BB]">Requires review for {step.workflowName || 'Workflow'}</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Approvals')}
                  className="px-2.5 py-1 bg-[#00635C] hover:bg-[#007c73] text-white text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  Review
                </button>
              </div>
            ))}
            {opsAssets && opsAssets.filter((a: any) => a.status === 'overdue' || a.status === 'missing').slice(0, 3).map((asset: any, idx: number) => (
              <div key={`asset-${idx}`} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold text-xs text-white block">Asset Alert: {asset.label}</span>
                  <span className="text-[10px] text-[#D0D6BB]">Status is {asset.status} (Holder: {asset.currentHolder || 'Unknown'})</span>
                </div>
                <button
                  onClick={() => state.setCurrentTab('Physical Assets')}
                  className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: My Connections Card */}
        <div 
          className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h3 className="font-serif font-black text-base text-white">My Connections</h3>
                <span className="text-[10px] font-bold text-[#D0D6BB] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  All systems up to date
                </span>
              </div>
              <button
                onClick={() => state.setCurrentTab('My Connections')}
                className="px-2.5 py-1.5 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:border-[rgba(246,247,241,0.3)] text-[#F6F7F1] hover:bg-[rgba(246,247,241,0.15)] rounded-xl text-[9px] font-bold transition-all cursor-pointer"
              >
                Manage
              </button>
            </div>
            <p className="text-[10px] text-[#D0D6BB] leading-relaxed">
              Connect the tools you use. We’ll bring them together.
            </p>
          </div>          <div className="grid grid-cols-2 gap-2.5 text-[10px] select-none">
            {[
              { id: 'gmail', name: 'Gmail / Outlook', desc: 'Email intake & alerts', status: 'connected' },
              { id: 'calendar', name: 'Calendar', desc: 'Availability & meetings', status: 'connected' },
              { id: 'slack', name: 'Slack', desc: 'Team alerts & channels', status: 'connected' },
              { id: 'teams', name: 'Microsoft Teams', desc: 'Team collaboration', status: 'connected' },
              { id: 'sms', name: 'SMS / Phone', desc: 'Urgent mobile texts', status: 'connected' },
              { id: 'drive', name: 'Google Drive', desc: 'Docs & listing assets', status: 'connected' },
              { id: 'rechat', name: 'Rechat', desc: 'CRM & active listings', status: 'coming_soon' },
              { id: 'dotloop', name: 'Dotloop', desc: 'Loops & compliance', status: 'coming_soon' }
            ].map((tool, idx) => {
              const isConnected = tool.status === 'connected';
              const isSoon = tool.status === 'coming_soon';
              return (
                <div 
                  key={idx} 
                  className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
                    isConnected 
                      ? 'bg-[rgba(246,247,241,0.04)] border-[rgba(246,247,241,0.12)] hover:border-[rgba(246,247,241,0.22)] text-white' 
                      : 'bg-transparent border-dashed border-[rgba(246,247,241,0.06)] text-[#F6F7F1]/35'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ConnectorLogo provider={tool.id} size="sm" className="w-6 h-6 rounded-lg bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.08)] flex items-center justify-center p-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="font-bold text-white truncate text-[10px]">{tool.name}</span>
                      <span className="text-[8px] text-[#D0D6BB]/60 truncate leading-tight font-medium font-sans">{tool.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[rgba(246,247,241,0.06)] pt-1.5 mt-0.5 select-none">
                    <span className={`text-[7.5px] font-bold font-mono uppercase tracking-wider ${
                      isConnected ? 'text-emerald-450' : 'text-[#F6F7F1]/30'
                    }`}>
                      {isConnected ? 'Connected' : 'Planned'}
                    </span>
                    {isSoon && (
                      <span className="text-[7.5px] px-1 py-0.2 bg-[rgba(208,214,187,0.08)] text-[#D0D6BB]/70 rounded font-sans uppercase font-bold">Soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-[#D0D6BB]/75 leading-normal border-t border-[rgba(246,247,241,0.1)] pt-3 italic">
            Nest Ops only processes approved channels and connected workflows you authorize.
          </div>
        </div>

        {/* Column 2: Official Intake Channels Card */}
        <div 
          className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base text-white">Official Intake Channels</h3>
            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-[#D0D6BB] block">Every request starts here</span>
          </div>

          {/* Spoke Flow Diagram */}
          <div className="py-4 flex flex-col items-center justify-center relative min-h-[220px]">
            {/* Central Node */}
            <div className="bg-[#00635C] text-white border border-[rgba(246,247,241,0.22)] rounded-2xl px-3.5 py-3 text-center z-10 w-32 space-y-1 shadow-[0_0_25px_rgba(0,99,92,0.8)]">
              <span className="font-serif font-black text-[11px] block leading-none">Ask Nest Ops</span>
              <span className="text-[7px] opacity-90 uppercase tracking-widest font-mono block">Central Hub</span>
            </div>

            {/* Outer Spokes */}
            {[
              { label: 'Email', pos: 'top-2 left-6' },
              { label: 'Call', pos: 'top-2 right-6' },
              { label: 'SMS', pos: 'bottom-2 left-6' },
              { label: 'Dashboard', pos: 'bottom-2 right-6' },
              { label: 'Slack', pos: 'left-2 top-1/2 -translate-y-1/2' },
              { label: 'Teams', pos: 'right-2 top-1/2 -translate-y-1/2' }
            ].map((spoke, idx) => (
              <div 
                key={idx} 
                className={`absolute ${spoke.pos} bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] rounded-lg px-2.5 py-1 text-[9px] font-semibold text-[#F6F7F1] z-10 shadow-sm`}
              >
                {spoke.label}
              </div>
            ))}

            {/* SVG Spoke Line Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[rgba(246,247,241,0.24)] stroke-1 stroke-dasharray-[2,2]">
              <line x1="20%" y1="15%" x2="50%" y2="50%" />
              <line x1="80%" y1="15%" x2="50%" y2="50%" />
              <line x1="20%" y1="85%" x2="50%" y2="50%" />
              <line x1="80%" y1="85%" x2="50%" y2="50%" />
              <line x1="10%" y1="50%" x2="50%" y2="50%" />
              <line x1="90%" y1="50%" x2="50%" y2="50%" />
            </svg>
          </div>

          <div className="text-[9px] text-[#D0D6BB]/75 leading-normal border-t border-[rgba(246,247,241,0.1)] pt-3">
            The Ask Nest Ops pipeline aggregates inputs across channels and routes them automatically to the operations cockpit.
          </div>
        </div>

        {/* Column 3: Recent Requests Card */}
        <div 
          className="rounded-[28px] p-6 flex flex-col justify-between space-y-4 text-left"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="space-y-1.5">
            <div className="flex justify-between items-start">
              <h3 className="font-serif font-black text-base text-white">Recent Requests</h3>
              <button
                onClick={() => state.setCurrentTab('Work Queue')}
                className="text-[9px] text-[#D0D6BB] hover:text-white font-bold hover:underline cursor-pointer"
              >
                View all requests
              </button>
            </div>
            <p className="text-[10px] text-[#D0D6BB] block font-semibold leading-none">
              Active operations tracking desk
            </p>
          </div>

          <div className="divide-y divide-[rgba(246,247,241,0.12)] flex-1 overflow-y-auto max-h-[220px] pr-1 font-sans text-xs">
            {[
              { id: 'mock_1', title: 'Sign request for 123 Oak Island Dr', desc: 'Wilmington, NC', status: 'in_progress', priority: 'high' },
              { id: 'mock_2', title: 'Listing launch assets for 456 River Wynd', desc: 'Marketing', status: 'in_progress', priority: 'medium' },
              { id: 'mock_3', title: 'MLS compliance review – new agent', desc: 'Agent: Taylor Morgan', status: 'needs_info', priority: 'high' },
              { id: 'mock_4', title: 'Lockbox not opening – 789 Pine St', desc: 'Showing issue reported', status: 'in_progress', priority: 'high' },
              { id: 'mock_5', title: 'Agent headshot update', desc: 'New agent asset', status: 'completed', priority: 'low' }
            ].map((req, idx) => {
              const isResolved = req.status === 'completed' || req.status === 'closed';
              const isNeedsInfo = req.status === 'needs_info';
              return (
                <div 
                  key={req.id} 
                  onClick={() => selectRequestForDetail(req as any)}
                  className="py-3 flex justify-between items-center gap-3 hover:bg-[rgba(246,247,241,0.04)] cursor-pointer rounded-lg px-1 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 text-left font-sans text-xs">
                    <span className="font-bold text-[11px] text-white block truncate">{req.title}</span>
                    <span className="text-[9px] text-[#D0D6BB]/75 block truncate">{req.desc}</span>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5 flex flex-col items-end">
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase border ${
                      isResolved 
                        ? 'bg-[rgba(0,99,92,0.15)] text-[#F6F7F1] border-[rgba(0,99,92,0.3)]' 
                        : isNeedsInfo
                          ? 'bg-amber-900/30 text-amber-200 border-amber-800'
                          : 'bg-[rgba(208,214,187,0.1)] text-[#D0D6BB] border-[rgba(208,214,187,0.2)]'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className={`text-[8px] font-mono capitalize ${
                      req.priority === 'high' ? 'text-rose-400' : req.priority === 'medium' ? 'text-amber-400' : 'text-[#D0D6BB]/60'
                    }`}>
                      {req.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[9px] text-[#D0D6BB]/70 leading-normal border-t border-[rgba(246,247,241,0.1)] pt-3">
            Showing 1–5 of 5 requests
          </div>
        </div>

      </div>

      {/* Request Intake Form Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowIntakeModal(false)} />
          {/* Modal Card */}
          <div className="relative bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 animate-scale-in text-xs">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#e4decb]/40 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[var(--sw-green-900)]" />
                <h3 className="font-serif font-black text-sm text-[#1e2520]">Ask Nest Ops Intake</h3>
              </div>
              <button onClick={() => setShowIntakeModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--sw-muted)] leading-relaxed mb-4">
              Submit an issue, question, or help request. Nest Ops will route it to the right person and track it through resolution.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Form Input fields */}
              <form onSubmit={handleIntakeSubmit} className="space-y-4 md:col-span-3">
                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Request Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sign install request for 102 Pine Street"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Description / Details</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full background context, needed items, and specifics..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] min-h-[90px] text-xs leading-normal"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Property Address</label>
                    <input 
                      type="text" 
                      value={property}
                      onChange={(e) => setProperty(e.target.value)}
                      placeholder="e.g. 102 Pine Street"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Needed By Date</label>
                    <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Urgency / Priority</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Preferred Channel</label>
                    <select
                      value={preferredChannel}
                      onChange={(e) => setPreferredChannel(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--sw-green-900)] text-xs cursor-pointer"
                    >
                      <option value="dashboard">Dashboard Request Form</option>
                      <option value="email">Ask Nest Ops Email</option>
                      <option value="sms">SMS Hotline</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 select-none">
                  <button 
                    type="button" 
                    onClick={() => setShowIntakeModal(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 font-bold rounded-lg text-xs hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-700)] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Submit Request
                  </button>
                </div>
              </form>

              {/* AI Triage Classification Simulator preview */}
              <div className="md:col-span-2 bg-[#fcfbf7] border border-[#e4decb] rounded-2xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block flex items-center gap-1.5 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    AI Triage Simulator Preview
                  </span>

                  <div className="space-y-2 leading-relaxed text-[11px] text-stone-600 font-medium">
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">CLASSIFIED CATEGORY:</span>
                      <span className="font-bold text-stone-800 text-xs uppercase">{liveClassification.type}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">SUGGESTED OWNER:</span>
                      <span className="font-bold text-[var(--sw-green-900)]">{liveClassification.suggestedOwner} ({liveClassification.suggestedRole.replace(/_/g, ' ')})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">TARGET SLA RESOLUTION:</span>
                      <span className="font-semibold text-stone-700">{liveClassification.sla}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block font-mono">REQUIRED INFO CHECKLIST:</span>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-stone-500">
                        {liveClassification.missingInfo.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#e4decb]/40 pt-3 text-[9px] text-[#8c887d] leading-normal italic">
                  Note: Real AI routing checks title keywords and description contexts on save, matching them to default staff rules.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Request Detail Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setSelectedRequest(null)}
          />
          {/* Drawer content */}
          <div className="relative w-[520px] bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-left z-50 border-l border-stone-200 text-xs text-stone-600">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#e4decb]/40 pb-4 mb-4 select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#eaf2ee] text-[var(--sw-green-900)] flex items-center justify-center font-bold">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-sm text-[#1e2520]">{selectedRequest.title}</h2>
                  <span className="text-[9px] text-[var(--sw-muted)] uppercase tracking-wider font-bold">Request Detail & Management</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6 flex-1">
              {/* Main request properties */}
              <div className="grid grid-cols-2 gap-4 bg-[#fcfbf7] border border-[#e4decb] rounded-2xl p-4 font-mono text-[10px] text-stone-700">
                <div>
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">REQUESTED BY:</span>
                  <span className="font-sans font-bold text-stone-850 block mt-0.5">{selectedRequest.requesterName}</span>
                  <span className="text-[9px] text-stone-400 block">{selectedRequest.requesterEmail}</span>
                </div>
                <div>
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">PROPERTY ADDRESS:</span>
                  <span className="font-sans font-bold text-[var(--sw-green-900)] block mt-0.5">{selectedRequest.linkedProperty || 'None'}</span>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">SOURCE CHANNEL:</span>
                  <span className="font-sans font-bold text-stone-800 uppercase block mt-0.5">{selectedRequest.source}</span>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[#8c887d] font-bold uppercase tracking-wider block">CURRENT ASSIGNEE:</span>
                  <span className="font-sans font-bold text-[var(--sw-green-900)] block mt-0.5">
                    {selectedRequest.assignedOwner 
                      ? `${selectedRequest.assignedOwner} (${(selectedRequest.assignedRole || '').replace(/_/g, ' ')})` 
                      : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-stone-500 block select-none">Ingested Content</span>
                <div className="bg-stone-50 border border-stone-150 rounded-xl p-3.5 leading-relaxed text-stone-800 font-medium">
                  {selectedRequest.description}
                </div>
              </div>

              {/* Status and Assignment Form (Operations Only) */}
              <div className="border-t border-[#e4decb]/40 pt-4 space-y-4 select-none">
                <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block">OPERATOR ACTION CONTROLS</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Status Override</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="needs_info">Needs Info</option>
                      <option value="waiting_agent">Waiting on Agent</option>
                      <option value="escalated">Escalated</option>
                      <option value="completed">Completed / Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] uppercase text-stone-500 block">Assign Owner</label>
                    <select
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="">Unassigned (Triage)</option>
                      <option value="Ann">Ann (Operations Manager)</option>
                      <option value="Ryan">Ryan (Regional Leader / BIC)</option>
                      <option value="Melissa">Melissa (Marketing Manager)</option>
                      <option value="James">James (Accounting Manager)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Internal Operator Logs</label>
                  <textarea 
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Input timeline logs, follow-up status, or notes..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none min-h-[60px] leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[10px] uppercase text-stone-500 block">Resolution Summary (upon Completion)</label>
                  <input 
                    type="text" 
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="Briefly state how this issue was resolved..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRequestUpdate}
                  disabled={isUpdating}
                  className="w-full py-2 bg-[var(--sw-green-900)] hover:bg-[var(--sw-green-700)] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Save Override Changes'}
                </button>
              </div>

              {/* Timeline & Audit Logs */}
              <div className="border-t border-[#e4decb]/40 pt-4 space-y-3">
                <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#8c887d] block select-none">TIMELINE & ESCALATION PATH</span>
                <div className="relative border-l border-stone-200 pl-4 ml-1.5 space-y-4">
                  <div className="relative text-left">
                    <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-150 border border-emerald-500 flex items-center justify-center font-bold text-emerald-700 text-[8px]">✓</span>
                    <span className="font-bold text-stone-750 block text-[10px]">Ingested from {selectedRequest.source}</span>
                    <span className="text-[9px] text-stone-400 block">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedRequest.notes && (
                    <div className="relative text-left">
                      <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-stone-150 border border-stone-400 flex items-center justify-center font-bold text-stone-600 text-[8px]">•</span>
                      <span className="font-bold text-stone-750 block text-[10px]">Internal Operator Log entry added</span>
                      <p className="text-[9px] text-stone-500 leading-normal mt-0.5 font-medium">{selectedRequest.notes}</p>
                    </div>
                  )}
                  {selectedRequest.resolutionSummary && (
                    <div className="relative text-left">
                      <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-150 border border-emerald-500 flex items-center justify-center font-bold text-emerald-700 text-[8px]">✓</span>
                      <span className="font-bold text-emerald-800 block text-[10px]">Resolution Summary Logged</span>
                      <p className="text-[9px] text-emerald-700 leading-normal mt-0.5 font-medium">{selectedRequest.resolutionSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Connector Picker Modal */}
      {/* Connector Picker Modal */}
      {showConnectorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setShowConnectorPicker(false)} />
          {/* Modal Container */}
          <div className="relative bg-[#01362D] border border-[rgba(246,247,241,0.12)] rounded-3xl p-6 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col z-50 animate-scale-in text-xs text-white">
            <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D0D6BB]" />
                <h3 className="font-serif font-black text-sm text-white">Add Connected Apps & Brokerage Tools</h3>
              </div>
              <button onClick={() => setShowConnectorPicker(false)} className="text-stone-400 hover:text-white transition-colors cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-[#D0D6BB] leading-relaxed mb-4 shrink-0 font-sans font-medium">
              Authorized integrations feed listing launches, signage installs, and compliance pipelines to the Nest Ops hub. Connect your channels below.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-left custom-scrollbar">
              {[
                {
                  title: 'Communication',
                  items: [
                    { id: 'google_workspace', provider: 'gmail', name: 'Gmail', desc: 'Securely sync transaction emails.', connected: googleConn.connected },
                    { id: 'microsoft_365', provider: 'outlook', name: 'Outlook Mail', desc: 'Sync corporate email intake.', connected: microsoftConn.connected },
                    { id: 'slack', provider: 'slack', name: 'Slack', desc: 'Dispatches real-time transaction updates.', connected: slackConn.connected },
                    { id: 'microsoft_365', provider: 'teams', name: 'Microsoft Teams', desc: 'Teams collaborative channels sync.', connected: microsoftConn.connected },
                    { id: 'sms_phone', provider: 'sms', name: 'SMS / Phone', desc: 'Twilio provider notification pipeline.', connected: false }
                  ]
                },
                {
                  title: 'Calendar',
                  items: [
                    { id: 'google_workspace', provider: 'calendar', name: 'Google Calendar', desc: 'Wilmington conference room schedules.', connected: googleConn.connected },
                    { id: 'microsoft_365', provider: 'outlookcalendar', name: 'Outlook Calendar', desc: 'Corporate calendar synchronization.', connected: false }
                  ]
                },
                {
                  title: 'Files',
                  items: [
                    { id: 'google_workspace', provider: 'drive', name: 'Google Drive', desc: 'Hosts shared brokerage templates.', connected: googleConn.connected }
                  ]
                },
                {
                  title: 'Real Estate / Brokerage',
                  items: [
                    { id: 'rechat', provider: 'rechat', name: 'Rechat', desc: 'CRM and active listing data.', connected: false, comingSoon: true },
                    { id: 'dotloop', provider: 'dotloop', name: 'Dotloop', desc: 'Compliance checks and deal folders.', connected: false, comingSoon: true },
                    { id: 'skyslope', provider: 'skyslope', name: 'SkySlope', desc: 'Alternate transaction storage.', connected: false, comingSoon: true },
                    { id: 'brokermint', provider: 'brokermint', name: 'Brokermint', desc: 'Commission management ledger.', connected: false, comingSoon: true },
                    { id: 'mls', provider: 'mls', name: 'MLS Integrations', desc: 'Direct local Wilmington MLS feed.', connected: false, comingSoon: true }
                  ]
                }
              ].map((category) => (
                <div key={category.title} className="space-y-2">
                  <h4 className="font-mono font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB]/60 select-none">
                    {category.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex flex-col justify-between p-3 rounded-2xl bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] hover:bg-[rgba(246,247,241,0.07)] hover:border-[rgba(246,247,241,0.15)] transition-all duration-200"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.1)] flex items-center justify-center font-bold">
                              <ConnectorLogo provider={item.provider} size="sm" className="w-5 h-5" />
                            </div>
                            {item.connected && (
                              <span className="px-1.5 py-0.2 bg-emerald-950/40 text-emerald-350 text-[7.5px] font-bold rounded border border-emerald-850/40 font-mono">
                                ACTIVE
                              </span>
                            )}
                            {item.comingSoon && (
                              <span className="px-1.5 py-0.2 bg-[rgba(208,214,187,0.12)] text-[#D0D6BB] text-[7.5px] font-bold rounded border border-[rgba(208,214,187,0.18)] font-mono">
                                SOON
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-[11px]">{item.name}</span>
                            <p className="text-[10px] text-[#D0D6BB]/70 leading-normal mt-0.5 font-medium">{item.desc}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[rgba(246,247,241,0.06)] mt-3">
                          {item.connected ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowConnectorPicker(false);
                                setActiveAppDetail(item.id);
                              }}
                              className="w-full py-1 bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] text-white hover:bg-[rgba(0,99,92,0.25)] rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                            >
                              Configure
                            </button>
                          ) : item.comingSoon ? (
                            <button
                              disabled
                              type="button"
                              className="w-full py-1 bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.06)] text-white/30 rounded-lg text-[9px] font-bold cursor-not-allowed"
                            >
                              Coming Soon
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setShowConnectorPicker(false);
                                if (item.id === 'sms_phone') {
                                  alert('SMS config is planned but Twilio integration is pending administrative setup.');
                                } else {
                                  handleConnectProvider(item.id);
                                }
                              }}
                              className="w-full py-1 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg text-[9px] font-bold cursor-pointer transition-colors shadow-sm"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connection Detail Drawer */}
      {activeAppDetail && (() => {
        const details = getConnectionDetails(activeAppDetail);
        if (!details) return null;

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setActiveAppDetail(null)}
            />
            {/* Drawer Container */}
            <div className="relative w-[460px] bg-[#01362D] h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-left z-50 border-l border-[rgba(246,247,241,0.12)] text-xs text-white">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-4 mb-4 select-none">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.05)] border border-[rgba(246,247,241,0.1)] flex items-center justify-center font-bold text-white">
                    <Activity className="w-4 h-4 text-[#D0D6BB]" />
                  </div>
                  <div>
                    <h2 className="font-serif font-black text-sm text-white leading-tight">{details.displayName}</h2>
                    <span className="text-[9px] text-[#D0D6BB] uppercase tracking-wider font-bold">App Connector Details</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveAppDetail(null)}
                  className="p-1 rounded-lg hover:bg-[rgba(246,247,241,0.06)] text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status info */}
              <div className="space-y-6 flex-1 text-left">
                <div className="grid grid-cols-2 gap-4 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-2xl p-4 font-mono text-[10px]">
                  <div>
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider block">CONNECTION STATUS:</span>
                    <span className="font-sans font-bold block mt-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${details.connected ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                      {details.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#D0D6BB] font-bold uppercase tracking-wider block">LAST SYNCHRONIZED:</span>
                    <span className="font-sans font-bold text-[#F6F7F1] block mt-0.5">{details.lastSync}</span>
                  </div>
                </div>

                {/* Scopes & Access */}
                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase text-[#D0D6BB] block select-none">What this app can access:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[#F6F7F1]/85 leading-normal">
                    {details.access.map((acc, idx) => (
                      <li key={idx}>{acc}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase text-[#D0D6BB] block select-none">What this app WILL NOT access:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[#F6F7F1]/60 leading-normal">
                    {details.noAccess.map((noAcc, idx) => (
                      <li key={idx}>{noAcc}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-4 space-y-3 select-none">
                  {details.connected ? (
                    <button
                      onClick={() => {
                        setActiveAppDetail(null);
                        handleDisconnectProvider(details.id);
                      }}
                      className="w-full py-2 bg-rose-900/60 hover:bg-rose-900 border border-rose-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center"
                    >
                      Disconnect app connection
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAppDetail(null);
                        handleConnectProvider(details.id);
                      }}
                      disabled={!details.connectUrl}
                      className={`w-full py-2 font-bold rounded-lg text-xs transition-colors text-center ${
                        details.connectUrl
                          ? 'bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.15)] text-white cursor-pointer'
                          : 'bg-[rgba(246,247,241,0.02)] border border-[rgba(246,247,241,0.08)] text-white/40 cursor-not-allowed'
                      }`}
                    >
                      Setup Connection
                    </button>
                  )}
                </div>

                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 text-[9px] text-[#D0D6BB]/75 leading-normal italic">
                  Note: OAuth credentials are never stored locally. Disconnecting revokes all workspace access tokens immediately.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </>
      )}

    </div>
  );
}
