/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Link2, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Search, 
  Lock,
  ChevronDown,
  ChevronUp,
  Settings,
  Activity,
  ArrowRight,
  RefreshCw,
  Sliders,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  Mail,
  Globe
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import ToolStackMap from './ToolStackMap';
import MetricCard from '../ui/MetricCard';
import RechatDetailsDrawer from './RechatDetailsDrawer';
import DotloopDetailsDrawer from './DotloopDetailsDrawer';
import EventReceiptLog from './EventReceiptLog';
import BrandIcon from '../ui/BrandIcon';
import IntegrationLogo from './IntegrationLogo';
import { 
  INTEGRATION_REGISTRY, 
  IntegrationRegistryItem, 
  IntegrationImplementationStatus 
} from '../../integrations/integrationRegistry';

interface ConnectorDetail {
  name: string;
  readiness: 'Active' | 'Ready to Config' | 'Future Roadmap';
  whatItPowers: string;
  productionReqs: string;
  dataRead: string[];
  dataWritten: string[];
  approvalGuardrails: string;
  demoStatus: string;
  description: string;
}

const PHASE_1_CONNECTORS: ConnectorDetail[] = [
  {
    name: 'Internal Operating Memory',
    readiness: 'Active',
    whatItPowers: 'Stateful requests, task lists, deals, compliance, and logs',
    productionReqs: 'None (Self-contained cache store)',
    dataRead: ['requests', 'tasks', 'deals', 'checklists'],
    dataWritten: ['audit logs', 'state updates', 'tasks'],
    approvalGuardrails: 'None (Local operation)',
    demoStatus: 'Active Sandbox Storage (Session Synchronized)',
    description: 'Manages core operating states and logs for all shapework operations.'
  },
  {
    name: 'Secure Agent Links',
    readiness: 'Active',
    whatItPowers: 'Intake and clarification loops without platform logins',
    productionReqs: 'Web Server Routing',
    dataRead: ['secure link tokens', 'required field requests'],
    dataWritten: ['form responses', 'completed checklist rows'],
    approvalGuardrails: 'Requires explicit agent submit action',
    demoStatus: 'Active client-side route bypass simulation',
    description: 'Generates tokenized URLs for agents to upload files or clarify vague requests.'
  },
  {
    name: 'Manual CSV Import',
    readiness: 'Active',
    whatItPowers: 'Agent roster, active deals, checklists, and sign inventories',
    productionReqs: 'File System Parsing Utility',
    dataRead: ['raw pasted text streams'],
    dataWritten: ['database registry records', 'audit events'],
    approvalGuardrails: 'Requires coordinator review and manual submit click',
    demoStatus: 'Integrated in settings imports sub-tab',
    description: 'Enables quick bulk data ingestion before active API integrations are configured.'
  },
  {
    name: 'Demo Webhook Ingest',
    readiness: 'Active',
    whatItPowers: 'RESO MLS status events and lender mail notifications',
    productionReqs: 'REST Webhook Gateway Route',
    dataRead: ['POST event body payloads'],
    dataWritten: ['integration event log', 'audit trail'],
    approvalGuardrails: 'Gated by API auth credentials validation',
    demoStatus: 'Supported at POST /api/demo/events',
    description: 'Accepts external system alerts and routes them to shapework triage.'
  }
];

const CATEGORY_GROUPS = [
  {
    key: 'core_brokerage_systems',
    title: 'Core brokerage systems',
    description: 'Verify and sync client transactions, folders, and CRM status.',
  },
  {
    key: 'communication_calendar',
    title: 'Communication & calendar',
    description: 'Surface email, calendar, and team conversation signals.',
  },
  {
    key: 'accounting_finance',
    title: 'Accounting & finance',
    description: 'Track payment, deposit, and commission-readiness signals.',
  },
  {
    key: 'project_task_execution',
    title: 'Project/task execution',
    description: 'Monitor task ownership, overdue work, and team follow-through.',
  },
  {
    key: 'automation_webhooks',
    title: 'Automation & webhooks',
    description: 'Connect and trigger external workflows.',
  },
  {
    key: 'marketing_reviews',
    title: 'Marketing & reviews',
    description: 'Monitor public ratings and growth signals.',
  },
  {
    key: 'email_delivery',
    title: 'Email delivery',
    description: 'Verify Resend and custom SMTP outbox settings.',
  },
  {
    key: 'messaging',
    title: 'Messaging',
    description: 'Configure Twilio or SMS text alert dispatching.',
  }
];

interface IntegrationsHubProps {
  connections?: any[];
  onToggleConnection?: (id: string) => void;
  onTestConnection?: (id: string) => void;
  onTriggerDemoEvent?: (id: string) => void;
  isSyncing?: boolean;
  state?: any;
}

export default function IntegrationsHub({
  connections = [],
  onToggleConnection,
  onTestConnection,
  onTriggerDemoEvent,
  isSyncing: propIsSyncing,
  state
}: IntegrationsHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null);
  
  const fetchWithWorkspace = async (url: string, options: any = {}) => {
    const wsId = state?.workspaceId || state?.activeWorkspaceId || 'nest-realty-demo';
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'x-workspace-id': wsId
      }
    });
  };
  
  // Rechat-specific states
  const [rechatStatus, setRechatStatus] = useState<any>({ connected: false, isSandbox: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dotloopDrawerOpen, setDotloopDrawerOpen] = useState(false);
  const [dbState, setDbState] = useState<any>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dotloop-specific states
  const [dotloopStatus, setDotloopStatus] = useState<any>({ 
    status: 'not_configured', 
    webhookUrl: '', 
    channelsSupported: [], 
    lastEventReceived: null, 
    eventsCountToday: 0 
  });

  // QuickBooks-specific states
  const [quickbooksStatus, setQuickbooksStatus] = useState<any>({ connected: false });
  const [isSyncingQB, setIsSyncingQB] = useState(false);

  // Basecamp-specific states
  const [basecampStatus, setBasecampStatus] = useState<any>({ connected: false });
  const [isSyncingBC, setIsSyncingBC] = useState(false);

  // Google Workspace-specific states
  const [googleStatus, setGoogleStatus] = useState<any>({ connected: false });
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Microsoft 365-specific states
  const [microsoftStatus, setMicrosoftStatus] = useState<any>({ connected: false });
  const [isSyncingMicrosoft, setIsSyncingMicrosoft] = useState(false);

  // Status states for other providers
  const [plaidStatus, setPlaidStatus] = useState<any>({ connected: false, status: 'missing_routes' });
  const [apiNationStatus, setApiNationStatus] = useState<any>({ connected: false, status: 'missing_routes' });
  const [zapierStatus, setZapierStatus] = useState<any>({ connected: false, status: 'missing_routes' });
  const [gbpStatus, setGbpStatus] = useState<any>({ connected: false, status: 'planned' });
  const [smtpStatus, setSmtpStatus] = useState<any>({ connected: false, status: 'available_to_connect' });
  const [smsStatus, setSmsStatus] = useState<any>({ connected: false, status: 'missing_routes' });
  const [resendStatus, setResendStatus] = useState<any>({ connected: false, status: 'available_to_connect' });
  const [slackStatus, setSlackStatus] = useState<any>({ connected: false, status: 'available_to_connect' });
  const [isSyncingSlack, setIsSyncingSlack] = useState(false);

  const fetchQuickBooksStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/quickbooks/status');
      const data = await res.json();
      setQuickbooksStatus(data);
    } catch (e) {
      console.error('Error fetching QuickBooks status:', e);
    }
  };

  const handleConnectQuickBooks = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/quickbooks/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initialize QuickBooks connection.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDisconnectQuickBooks = async () => {
    if (!window.confirm('Are you sure you want to disconnect QuickBooks? This will clear all synced QuickBooks finance signals.')) {
      return;
    }
    try {
      const res = await fetchWithWorkspace('/api/integrations/quickbooks/disconnect', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchQuickBooksStatus();
        await fetchDbState();
        setSyncStatusMsg('QuickBooks Online disconnected successfully.');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncQuickBooks = async () => {
    setIsSyncingQB(true);
    setSyncStatusMsg('Starting QuickBooks Online synchronization...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/quickbooks/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchQuickBooksStatus();
        await fetchDbState();
        setSyncStatusMsg(`Sync completed successfully. Invoices checked: ${data.summary.invoicesChecked}, Payments: ${data.summary.paymentsChecked}, Exceptions raised: ${data.summary.exceptionsCreated}`);
      } else {
        setSyncStatusMsg(`Sync failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingQB(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const fetchBasecampStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/basecamp/status');
      const data = await res.json();
      setBasecampStatus(data);
    } catch (e) {
      console.error('Error fetching Basecamp status:', e);
    }
  };

  const handleConnectBasecamp = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/basecamp/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initialize Basecamp connection.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDisconnectBasecamp = async () => {
    if (!window.confirm('Are you sure you want to disconnect Basecamp? This will clear all synced Basecamp signals and Work Queue items.')) {
      return;
    }
    try {
      const res = await fetchWithWorkspace('/api/integrations/basecamp/disconnect', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchBasecampStatus();
        await fetchDbState();
        setSyncStatusMsg('Basecamp disconnected successfully.');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncBasecamp = async () => {
    setIsSyncingBC(true);
    setSyncStatusMsg('Starting Basecamp synchronization...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/basecamp/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBasecampStatus();
        await fetchDbState();
        setSyncStatusMsg(`Sync completed successfully. Projects checked: ${data.summary.projectsChecked}, Todos: ${data.summary.todosChecked}, Exceptions raised: ${data.summary.exceptionsCreated}`);
      } else {
        setSyncStatusMsg(`Sync failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingBC(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/google/status');
      const data = await res.json();
      setGoogleStatus(data);
    } catch (e) {
      console.error('Error fetching Google status:', e);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/google/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initialize Google Workspace connection.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Workspace? This will clear all synced calendar events.')) {
      return;
    }
    try {
      const res = await fetchWithWorkspace('/api/integrations/google/disconnect', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchGoogleStatus();
        await fetchDbState();
        setSyncStatusMsg('Google Workspace disconnected successfully.');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    setSyncStatusMsg('Starting Google Workspace synchronization...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/google/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchGoogleStatus();
        await fetchDbState();
        setSyncStatusMsg('Google Workspace sync completed successfully.');
      } else {
        setSyncStatusMsg(`Sync failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingGoogle(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const fetchMicrosoftStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/microsoft/status');
      const data = await res.json();
      setMicrosoftStatus(data);
    } catch (e) {
      console.error('Error fetching Microsoft status:', e);
    }
  };

  const fetchPlaidStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/plaid/status');
      if (res.ok) setPlaidStatus(await res.json());
    } catch (e) {}
  };
  const fetchApiNationStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/api-nation/status');
      if (res.ok) setApiNationStatus(await res.json());
    } catch (e) {}
  };
  const fetchZapierStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/zapier/status');
      if (res.ok) setZapierStatus(await res.json());
    } catch (e) {}
  };
  const fetchGbpStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/google-business-profile/status');
      if (res.ok) setGbpStatus(await res.json());
    } catch (e) {}
  };
  const fetchSmtpStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/email/status');
      if (res.ok) setSmtpStatus(await res.json());
    } catch (e) {}
  };
  const fetchSmsStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/sms/status');
      if (res.ok) setSmsStatus(await res.json());
    } catch (e) {}
  };
  const fetchResendStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/resend/status');
      if (res.ok) setResendStatus(await res.json());
    } catch (e) {}
  };

  const handleConnectMicrosoft = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/microsoft/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initialize Microsoft 365 connection.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDisconnectMicrosoft = async () => {
    if (!window.confirm('Are you sure you want to disconnect Microsoft 365? This will clear all synced Outlook messages, calendar events, and Teams alerts.')) {
      return;
    }
    try {
      const res = await fetchWithWorkspace('/api/integrations/microsoft/disconnect', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchMicrosoftStatus();
        await fetchDbState();
        setSyncStatusMsg('Microsoft 365 disconnected successfully.');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncMicrosoft = async () => {
    setIsSyncingMicrosoft(true);
    setSyncStatusMsg('Starting Microsoft 365 synchronization...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/microsoft/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchMicrosoftStatus();
        await fetchDbState();
        setSyncStatusMsg('Microsoft 365 sync completed successfully.');
      } else {
        setSyncStatusMsg(`Sync failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingMicrosoft(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const fetchSlackStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/slack/status');
      const data = await res.json();
      setSlackStatus(data);
    } catch (e) {
      console.error('Error fetching Slack status:', e);
    }
  };

  const handleConnectSlack = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/slack/connect');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initialize Slack connection.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  };

  const handleDisconnectSlack = async () => {
    if (!window.confirm('Are you sure you want to disconnect Slack? This will stop posting automated alerts to your channels.')) {
      return;
    }
    try {
      const res = await fetchWithWorkspace('/api/integrations/slack/disconnect', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchSlackStatus();
        await fetchDbState();
        setSyncStatusMsg('Slack disconnected successfully.');
      } else {
        alert('Failed to disconnect Slack.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const handleSyncSlack = async () => {
    setIsSyncingSlack(true);
    setSyncStatusMsg('Syncing Slack channels and messages...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/slack/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await fetchSlackStatus();
        await fetchDbState();
        setSyncStatusMsg('Slack sync completed successfully.');
      } else {
        setSyncStatusMsg(`Sync failed: ${data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      setSyncStatusMsg(`Sync failed: ${e.message}`);
    } finally {
      setIsSyncingSlack(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/rechat/status');
      const data = await res.json();
      setRechatStatus(data);
    } catch (e) {
      console.error('Error fetching Rechat status:', e);
    }
  };

  const fetchDotloopStatus = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/apination/dotloop/status');
      const data = await res.json();
      setDotloopStatus(data);
    } catch (e) {
      console.error('Error fetching Dotloop status:', e);
    }
  };

  const fetchDbState = async () => {
    try {
      const res = await fetchWithWorkspace('/api/db-state');
      const data = await res.json();
      setDbState(data);
    } catch (e) {
      console.error('Error fetching db-state:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDotloopStatus();
    fetchQuickBooksStatus();
    fetchBasecampStatus();
    fetchGoogleStatus();
    fetchMicrosoftStatus();
    fetchPlaidStatus();
    fetchApiNationStatus();
    fetchZapierStatus();
    fetchGbpStatus();
    fetchSmtpStatus();
    fetchSmsStatus();
    fetchResendStatus();
    fetchSlackStatus();
    fetchDbState();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/integrations/rechat/oauth/start';
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/rechat/disconnect', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
        await fetchDbState();
        setSyncStatusMsg('Rechat disconnected successfully.');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Starting Rechat baseline synchronization...');
    try {
      const res = await fetchWithWorkspace('/api/integrations/rechat/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(`Sync completed! Imported ${data.summary.dealsSynced} deals, ${data.summary.contactsSynced} contacts, and ${data.summary.tasksSynced} tasks.`);
        await fetchDbState();
        await fetchStatus();
      } else {
        setSyncStatusMsg('Sync failed: ' + data.error);
      }
    } catch (e: any) {
      setSyncStatusMsg('Sync failed: ' + e.message);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const handleTestWebhook = async (topic: string, recordId: string) => {
    try {
      const res = await fetchWithWorkspace('/api/integrations/rechat/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, recordId })
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerDotloopTestEvent = async (scenario: string) => {
    let payload: any = {};
    if (scenario === 'loop_created_unmatched') {
      payload = {
        eventType: "loop.created",
        channel: "loop_created_or_updated",
        loopId: `dl_loop_${Date.now()}`,
        loopName: "998 Oak Avenue",
        loopStatus: "Pre-Listing",
        transactionType: "Listing",
        created_at: new Date().toISOString(),
        clientName: "Remus Lupin",
        clientEmail: "remus.lupin@hogwarts.edu"
      };
    } else if (scenario === 'participant_added') {
      payload = {
        eventType: "participant.added",
        channel: "participant_created_or_updated",
        loopId: "dl_loop_901",
        loopName: "204 Birch Lane",
        participantName: "Neville Longbottom",
        participantRole: "Buyer",
        participantEmail: "neville.l@aurors.org",
        participantPhone: "555-0188"
      };
    } else if (scenario === 'document_updated') {
      payload = {
        eventType: "document.updated",
        channel: "document_created_or_updated",
        loopId: "dl_loop_901",
        loopName: "204 Birch Lane",
        documentName: "Seller_Disclosure_Signed.pdf",
        documentStatus: "SIGNED",
        updated_at: new Date().toISOString()
      };
    } else if (scenario === 'ambiguous_name') {
      payload = {
        eventType: "loop.created",
        channel: "loop_created_or_updated",
        loopId: `dl_loop_${Date.now()}`,
        loopName: "Birch Lane Escrow",
        loopStatus: "Pre-Listing",
        transactionType: "Listing",
        created_at: new Date().toISOString(),
        clientName: "Harry Potter",
        clientEmail: "harry.potter@hogwarts.edu"
      };
    }

    try {
      const res = await fetchWithWorkspace('/api/integrations/apination/dotloop/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shapework-webhook-secret': 'test_secret_123'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Mock webhook event triggered successfully!');
        fetchDotloopStatus();
        fetchDbState();
      } else {
        alert('Failed to trigger mock event.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filterConnectors = (list: ConnectorDetail[]) => {
    if (!searchTerm.trim()) return list;
    const query = searchTerm.toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.whatItPowers.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query)
    );
  };

  const isProd = state?.appMode === 'production';

  const fPhase1 = filterConnectors(PHASE_1_CONNECTORS).filter(c => !(isProd && c.name === 'Demo Webhook Ingest'));

  const getEffectiveStatus = (item: IntegrationRegistryItem): IntegrationImplementationStatus => {
    if (item.provider === 'gmail' || item.provider === 'google_calendar' || item.provider === 'google_drive') {
      return googleStatus.connected ? 'connected' : (googleStatus.status || 'available_to_connect');
    }
    if (item.provider === 'outlook_mail' || item.provider === 'outlook_calendar' || item.provider === 'microsoft_teams') {
      return microsoftStatus.connected ? 'connected' : (microsoftStatus.status || 'available_to_connect');
    }
    if (item.provider === 'rechat') {
      return rechatStatus.connected ? 'connected' : (rechatStatus.status || 'available_to_connect');
    }
    if (item.provider === 'slack') {
      return slackStatus.connected ? 'connected' : (slackStatus.status || 'available_to_connect');
    }
    if (item.provider === 'dotloop') {
      return dotloopStatus.status === 'configured' ? 'connected' : (dotloopStatus.status || 'available_to_connect');
    }
    if (item.provider === 'quickbooks_online') {
      return quickbooksStatus.connected ? 'connected' : (quickbooksStatus.status || 'available_to_connect');
    }
    if (item.provider === 'basecamp') {
      return basecampStatus.connected ? 'connected' : (basecampStatus.status || 'available_to_connect');
    }
    if (item.provider === 'google_workspace') {
      return googleStatus.connected ? 'connected' : (googleStatus.status || 'available_to_connect');
    }
    if (item.provider === 'microsoft_365') {
      return microsoftStatus.connected ? 'connected' : (microsoftStatus.status || 'available_to_connect');
    }
    if (item.provider === 'plaid') {
      return plaidStatus.connected ? 'connected' : (plaidStatus.status || 'missing_routes');
    }
    if (item.provider === 'api_nation') {
      return apiNationStatus.connected ? 'connected' : (apiNationStatus.status || 'missing_routes');
    }
    if (item.provider === 'zapier') {
      return zapierStatus.connected ? 'connected' : (zapierStatus.status || 'missing_routes');
    }
    if (item.provider === 'google_business_profile') {
      return gbpStatus.connected ? 'connected' : (gbpStatus.status || 'planned');
    }
    if (item.provider === 'smtp_email') {
      return smtpStatus.connected ? 'connected' : (smtpStatus.status || 'available_to_connect');
    }
    if (item.provider === 'sms_provider') {
      return smsStatus.connected ? 'connected' : (smsStatus.status || 'missing_routes');
    }
    if (item.provider === 'resend') {
      return resendStatus.connected ? 'connected' : (resendStatus.status || 'available_to_connect');
    }
    return item.implementationStatus;
  };

  const getFriendlyStatusLabel = (status: IntegrationImplementationStatus) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'available_to_connect': return 'Ready';
      case 'missing_env': return 'Missing setup';
      case 'missing_routes': return 'Missing routes';
      case 'planned': return 'Planned';
      case 'expired': return 'Expired';
      case 'error': return 'Error';
      case 'disabled': return 'Disabled';
      case 'route_shell_exists': return 'Setup pending';
      default: return (status as any).replace(/_/g, ' ');
    }
  };

  const getStatusBadgeStyle = (status: IntegrationImplementationStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-250';
      case 'available_to_connect':
        return 'bg-[#DDEBDD] text-[#18382B] border border-[#2F5D46]/20';
      case 'route_shell_exists':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'missing_env':
      case 'expired':
        return 'bg-amber-50 text-amber-800 border border-amber-250';
      case 'missing_routes':
        return 'bg-rose-50 text-rose-800 border border-rose-250';
      case 'planned':
        return 'bg-stone-100 text-stone-600 border border-stone-200';
      case 'error':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'disabled':
        return 'bg-stone-50 text-stone-400 border border-stone-200';
      default:
        return 'bg-stone-100 text-stone-600 border border-stone-200';
    }
  };

  const getDataDirection = (item: IntegrationRegistryItem) => {
    if (item.writebackDefault === 'disabled') return 'Read-only';
    if (item.writebackDefault === 'approval_gated') return 'Bidirectional (approval-gated)';
    return 'Bidirectional';
  };

  const getLastSyncOrSetupText = (item: IntegrationRegistryItem, status: IntegrationImplementationStatus) => {
    if (status !== 'connected') return 'Not connected';
    
    if (item.provider === 'google_workspace' && googleStatus.lastSyncedAt) {
      return new Date(googleStatus.lastSyncedAt).toLocaleString();
    }
    if (item.provider === 'microsoft_365' && microsoftStatus.lastSyncedAt) {
      return new Date(microsoftStatus.lastSyncedAt).toLocaleString();
    }
    if (item.provider === 'quickbooks_online' && quickbooksStatus.lastSyncedAt) {
      return new Date(quickbooksStatus.lastSyncedAt).toLocaleString();
    }
    if (item.provider === 'basecamp' && basecampStatus.lastSyncedAt) {
      return new Date(basecampStatus.lastSyncedAt).toLocaleString();
    }
    if (item.provider === 'rechat') {
      const records = dbState?.integrations?.find((i: any) => i.id === 'i_rechat');
      if (records && records.last_sync) {
        return new Date(records.last_sync).toLocaleString();
      }
    }
    if (item.provider === 'slack') {
      const records = dbState?.integrations?.find((i: any) => i.id === 'i_slack');
      if (records && records.last_sync && records.last_sync !== 'Never') {
        return new Date(records.last_sync).toLocaleString();
      }
    }
    return 'Connected';
  };

  // Stats calculation
  const totalConnected = fPhase1.length + 
    (rechatStatus.connected ? 1 : 0) + 
    (quickbooksStatus.connected ? 1 : 0) + 
    (basecampStatus.connected ? 1 : 0) + 
    (googleStatus.connected ? 1 : 0) + 
    (microsoftStatus.connected ? 1 : 0) +
    (slackStatus.connected ? 1 : 0);

  const totalPending = INTEGRATION_REGISTRY.length - totalConnected;

  const rechatRecord = dbState?.integrations?.find((i: any) => i.id === 'i_rechat') || {
    records_synchronized: 0,
    errors_count: 0
  };
  const rechatTasksCreated = dbState?.tasks?.filter((t: any) => t.id.includes('rechat')).length || 0;

  // Filter and search on the registry
  const getFilteredRegistry = () => {
    if (!searchTerm.trim()) return INTEGRATION_REGISTRY;
    const query = searchTerm.toLowerCase();
    return INTEGRATION_REGISTRY.filter(item => 
      item.displayName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.purpose.toLowerCase().includes(query)
    );
  };

  const filteredRegistry = getFilteredRegistry();

  return (
    <div className="integrations-hub space-y-6 text-left animate-fade-in font-sans pb-10">
      
      <PageHeader 
        title="Integrations"
        description="Connect the systems shapework watches for brokerage work, deadlines, documents, payments, and team signals."
      />

      <div className="text-[11px] text-text-tertiary select-none -mt-3">
        Start with calendar, email, transaction systems, and accounting. shapework keeps writeback approval-gated by default.
      </div>

      {/* Support Boundary Banner */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-3 items-start select-none">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-950 text-xs block">Support Boundary &amp; Service Promises</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            shapework. supports the custom workspace dashboards, routing logic, and outbox approvals configured for your team. 
            Service outages or data syncing errors on connected third-party systems (such as Rechat, Dotloop, or Gmail) 
            are managed by their respective providers. For more details, view the 
            <a href="/docs/support-boundaries.md" target="_blank" rel="noopener noreferrer" className="ml-1 font-bold underline hover:text-amber-950">
              Support Boundaries Manual
            </a>.
          </p>
        </div>
      </div>

      {/* Interactive Tool Stack Map */}
      <div className="bg-surface border border-border-soft rounded-2xl p-6 shadow-card">
        <ToolStackMap state={state} />
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <MetricCard label="Active Pipelines" value={`${totalConnected} active`} subtext="Memory, Webhooks, and Rechat integration" icon={CheckCircle2} />
        <MetricCard label="Catalog Systems" value={`${totalPending} remaining`} subtext="Configurable CRM, communication, and finance integrations" icon={Database} />
        <MetricCard label="Safeguards Status" value="100% Gated" subtext="No automated external writes" icon={Lock} />
      </div>

      {/* Sync Status Notifications */}
      {syncStatusMsg && (
        <div className="p-4 bg-brand-soft border border-brand-primary/10 rounded-2xl flex items-center justify-between text-xs text-brand-primary font-mono select-none">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{syncStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Search block */}
      <div className="bg-surface border border-border-soft rounded-2xl p-4 shadow-card">
        <div className="relative">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search integrations, features, or description..."
            className="w-full pl-9 pr-4 py-2 border border-border-soft bg-surface-subtle rounded-lg text-xs focus:outline-none focus:bg-surface focus:border-border-medium transition-all"
          />
        </div>
      </div>

      {/* Registry Categorized Groups */}
      {CATEGORY_GROUPS.map(group => {
        const groupItems = filteredRegistry.filter(item => item.group === group.key);
        if (groupItems.length === 0) return null;

        return (
          <div key={group.key} className="space-y-3">
            <div className="select-none">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {group.title}
              </h3>
              <p className="text-[11px] text-text-tertiary">{group.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groupItems.map(item => {
                const effectiveStatus = getEffectiveStatus(item);
                const isExpanded = expandedConnector === item.provider;
                
                return (
                  <div 
                    key={item.provider}
                    data-provider={item.provider}
                    className="integration-card p-6 flex flex-col justify-between gap-5 transition-all text-text-primary"
                  >
                    <div className="space-y-4">
                      {/* Logo tile, Provider Name, Status Pill */}
                      <div className="flex items-start justify-between gap-3 select-none">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-[16px] border border-border-soft bg-surface flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                            <IntegrationLogo logoKey={item.logoKey} displayName={item.displayName} className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-text-primary leading-tight">{item.displayName}</h4>
                            <span className="text-[10px] text-text-secondary font-mono">{item.shortName}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(effectiveStatus)}`}>
                          {getFriendlyStatusLabel(effectiveStatus)}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {item.description}
                      </p>

                      {/* Content Layout Parameters */}
                      <div className="space-y-2 mt-4 text-xs text-text-secondary select-none">
                        <div className="flex justify-between border-b border-border-soft/45 pb-1.5">
                          <span className="font-medium text-text-tertiary">Purpose</span>
                          <span className="font-semibold text-text-primary text-right">{item.purpose}</span>
                        </div>
                        <div className="flex justify-between border-b border-border-soft/45 pb-1.5">
                          <span className="font-medium text-text-tertiary">Data direction</span>
                          <span className="font-semibold text-text-primary text-right">{getDataDirection(item)}</span>
                        </div>
                        <div className="flex justify-between border-b border-border-soft/45 pb-1.5">
                          <span className="font-medium text-text-tertiary">Writeback</span>
                          <span className="font-semibold text-text-primary text-right capitalize">
                            {item.writebackDefault === 'approval_gated' ? 'Approval-gated' : item.writebackDefault}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border-soft/45 pb-1.5">
                          <span className="font-medium text-text-tertiary">Last sync / setup status</span>
                          <span className="font-semibold text-text-primary text-right">
                            {getLastSyncOrSetupText(item, effectiveStatus)}
                          </span>
                        </div>
                      </div>

                      {/* Custom Active Stats / Endpoint Boxes */}
                      {item.provider === 'rechat' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Events Today</span>
                              <span className="font-mono text-text-primary font-semibold block">{rechatRecord.records_synchronized || 0} events</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Tasks Spawned</span>
                              <span className="font-mono text-text-primary font-semibold block">{rechatTasksCreated} tasks</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.provider === 'slack' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Synced Messages</span>
                              <span className="font-mono text-text-primary font-semibold block">
                                {dbState?.integrations?.find((i: any) => i.id === 'i_slack')?.records_synchronized || 0} messages
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Outbox Alerts</span>
                              <span className="font-mono text-[#18382B] font-bold block">Active</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.provider === 'dotloop' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Webhook Endpoint</span>
                              <code className="font-mono text-text-primary text-[9px] truncate block max-w-[200px]" title={dotloopStatus.webhookUrl || 'http://localhost:3000/api/webhooks/dotloop'}>
                                {dotloopStatus.webhookUrl || 'http://localhost:3000/api/webhooks/dotloop'}
                              </code>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(dotloopStatus.webhookUrl || 'http://localhost:3000/api/webhooks/dotloop');
                                alert('Copied Dotloop webhook URL to clipboard!');
                              }}
                              className="px-2 py-1 bg-white text-text-primary hover:bg-stone-50 border border-border-soft rounded text-[9px] font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {item.provider === 'quickbooks_online' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Last Synchronized</span>
                              <span className="font-mono text-text-primary font-semibold block truncate">
                                {quickbooksStatus.lastSyncedAt ? new Date(quickbooksStatus.lastSyncedAt).toLocaleTimeString() : 'Never'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Writeback Status</span>
                              <span className="font-mono text-text-tertiary font-bold block">Disabled</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.provider === 'basecamp' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Last Synchronized</span>
                              <span className="font-mono text-text-primary font-semibold block truncate">
                                {basecampStatus.lastSyncedAt ? new Date(basecampStatus.lastSyncedAt).toLocaleTimeString() : 'Never'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Writeback Status</span>
                              <span className="font-mono text-text-tertiary font-bold block">Disabled</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.provider === 'resend' && effectiveStatus === 'connected' && (
                        <div className="bg-stone-50 p-3.5 rounded-2xl border border-border-soft text-[10px] space-y-2 select-text">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Verified Domains</span>
                              <span className="font-mono text-text-primary font-semibold block">{resendStatus.verifiedDomainsCount || 1} verified</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-text-tertiary font-bold uppercase font-mono block">Outbox Mode</span>
                              <span className="font-mono text-[#18382B] font-bold block">Production (Active)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Setup details accordion */}
                      <div className="border-t border-border-soft/60 pt-2">
                        <button
                          onClick={() => setExpandedConnector(isExpanded ? null : item.provider)}
                          className="flex items-center justify-between w-full text-[10px] text-text-tertiary font-mono hover:text-text-secondary transition-colors"
                        >
                          <span>Setup details</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border-soft/60 space-y-3.5 text-xs text-text-secondary font-medium leading-normal animate-fade-in select-text">
                            <div className="bg-stone-50 p-3 rounded-xl border border-border-soft space-y-2.5 text-xs text-text-secondary select-text">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Connect Path</span>
                                  <code className="font-mono text-text-primary block truncate" title={item.paths.connectPath}>{item.paths.connectPath || 'None'}</code>
                                </div>
                                <div>
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Status Path</span>
                                  <code className="font-mono text-text-primary block truncate" title={item.paths.statusPath}>{item.paths.statusPath || 'None'}</code>
                                </div>
                                <div>
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Sync Path</span>
                                  <code className="font-mono text-text-primary block truncate" title={item.paths.syncPath}>{item.paths.syncPath || 'None'}</code>
                                </div>
                                {item.paths.webhookPath && (
                                  <div>
                                    <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Webhook Path</span>
                                    <code className="font-mono text-text-primary block truncate" title={item.paths.webhookPath}>{item.paths.webhookPath}</code>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border-soft/60 pt-2">
                                <div>
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Required Config</span>
                                  <span className="text-text-primary font-semibold block truncate" title={item.requiredEnvVars?.join(', ')}>
                                    {item.requiredEnvVars?.join(', ') || 'None'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Implementation Status</span>
                                  <span className="text-text-primary font-semibold block uppercase tracking-wider text-[9px]">{item.implementationStatus.replace(/_/g, ' ')}</span>
                                </div>
                              </div>

                              {/* Display scopes if they are returned by connection status */}
                              {((item.provider === 'google_workspace' && googleStatus.scopes) || 
                                (item.provider === 'microsoft_365' && microsoftStatus.scopes)) && (
                                <div className="border-t border-border-soft/60 pt-2 text-[10px]">
                                  <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Granted Scopes</span>
                                  <p className="font-mono text-text-primary text-[9px] leading-relaxed break-all">
                                    {item.provider === 'google_workspace' ? googleStatus.scopes.join(', ') : microsoftStatus.scopes.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>

                            {item.warnings && item.warnings.length > 0 && (
                              <div className="space-y-1 bg-amber-50 border border-amber-250 p-2.5 rounded-xl">
                                <span className="text-[8px] text-amber-800 font-bold uppercase tracking-wider block">System Warnings</span>
                                <p className="text-amber-900 text-[10px] leading-relaxed font-semibold">{item.warnings.join(', ')}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons footer */}
                    <div className="flex gap-2 border-t border-border-soft/80 pt-3 select-none">
                      {effectiveStatus === 'connected' && (
                        <>
                          <button
                            onClick={
                              item.provider === 'rechat' ? handleSync :
                              item.provider === 'quickbooks_online' ? handleSyncQuickBooks :
                              item.provider === 'basecamp' ? handleSyncBasecamp :
                              item.provider === 'google_workspace' ? handleSyncGoogle :
                              item.provider === 'microsoft_365' ? handleSyncMicrosoft :
                              item.provider === 'slack' ? handleSyncSlack :
                              undefined
                            }
                            disabled={isSyncing || isSyncingQB || isSyncingBC || isSyncingGoogle || isSyncingMicrosoft || isSyncingSlack}
                            className="flex-1 py-2 bg-green-800 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${(isSyncing || isSyncingQB || isSyncingBC || isSyncingGoogle || isSyncingMicrosoft || isSyncingSlack) ? 'animate-spin' : ''}`} />
                            <span>Sync now</span>
                          </button>
                          
                          {item.provider === 'rechat' ? (
                            <button
                              onClick={() => setDrawerOpen(true)}
                              className="flex-1 py-2 border border-border-soft hover:bg-stone-50 text-text-primary bg-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Sliders className="w-3.5 h-3.5 text-text-secondary" />
                              <span>Manage</span>
                            </button>
                          ) : (
                            <button
                              onClick={
                                item.provider === 'quickbooks_online' ? handleDisconnectQuickBooks :
                                item.provider === 'basecamp' ? handleDisconnectBasecamp :
                                item.provider === 'google_workspace' ? handleDisconnectGoogle :
                                item.provider === 'microsoft_365' ? handleDisconnectMicrosoft :
                                item.provider === 'slack' ? handleDisconnectSlack :
                                undefined
                              }
                              className="flex-1 py-2 border border-border-soft hover:bg-stone-50 text-text-primary bg-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <span>Disconnect</span>
                            </button>
                          )}
                        </>
                      )}

                      {effectiveStatus === 'expired' && (
                        <button
                          onClick={
                            item.provider === 'rechat' ? handleConnect :
                            item.provider === 'quickbooks_online' ? handleConnectQuickBooks :
                            item.provider === 'basecamp' ? handleConnectBasecamp :
                            item.provider === 'google_workspace' ? handleConnectGoogle :
                            item.provider === 'microsoft_365' ? handleConnectMicrosoft :
                            undefined
                          }
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Reconnect</span>
                        </button>
                      )}

                      {effectiveStatus === 'available_to_connect' && (
                        <button
                          onClick={
                            item.provider === 'rechat' ? handleConnect :
                            item.provider === 'dotloop' ? () => setDotloopDrawerOpen(true) :
                            item.provider === 'quickbooks_online' ? handleConnectQuickBooks :
                            item.provider === 'basecamp' ? handleConnectBasecamp :
                            item.provider === 'google_workspace' ? handleConnectGoogle :
                            item.provider === 'microsoft_365' ? handleConnectMicrosoft :
                            item.provider === 'slack' ? handleConnectSlack :
                            async () => {
                              try {
                                const res = await fetchWithWorkspace(item.paths.connectPath || `/api/integrations/${item.provider}/connect`);
                                const data = await res.json();
                                if (data.url) {
                                  window.location.href = data.url;
                                } else if (!res.ok) {
                                  alert(data.message || 'Integration connect path not configured.');
                                }
                              } catch (e: any) {
                                alert(`Error connecting: ${e.message}`);
                              }
                            }
                          }
                          className="w-full py-2 bg-green-800 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer group/btn"
                        >
                          <span>Connect {item.displayName} →</span>
                        </button>
                      )}

                      {effectiveStatus === 'route_shell_exists' && (
                        <button
                          disabled
                          className="w-full py-2 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <span>Setup pending</span>
                        </button>
                      )}

                      {effectiveStatus === 'missing_env' && (
                        <div className="w-full">
                          <button
                            disabled
                            className="w-full py-2 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <span>Missing setup</span>
                          </button>
                          <span className="text-[9px] text-amber-600 font-semibold block text-center mt-1">
                            Required env vars missing
                          </span>
                        </div>
                      )}

                      {effectiveStatus === 'missing_routes' && (
                        <button
                          disabled
                          className="w-full py-2 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <span>Route missing</span>
                        </button>
                      )}

                      {effectiveStatus === 'planned' && (
                        <button
                          disabled
                          className="w-full py-2 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <span>Planned</span>
                        </button>
                      )}

                      {effectiveStatus === 'disabled' && (
                        <button
                          disabled
                          className="w-full py-2 bg-stone-50 text-stone-400 border border-stone-200 rounded-lg text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <span>Disabled</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Phase 1 section */}
      {fPhase1.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider select-none">
            Priority 1 — Deep Active Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fPhase1.map((conn) => (
              <ConnectorCard 
                key={conn.name} 
                conn={conn}
                isExpanded={expandedConnector === conn.name}
                onToggle={() => setExpandedConnector(expandedConnector === conn.name ? null : conn.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rechat Detail Sliding Drawer */}
      <RechatDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rechatStatus={rechatStatus}
        onSync={handleSync}
        onDisconnect={handleDisconnect}
        onTestWebhook={handleTestWebhook}
        dbState={dbState}
        refreshDbState={fetchDbState}
        isProd={isProd}
      />

      {/* Dotloop Detail Sliding Drawer */}
      <DotloopDetailsDrawer
        isOpen={dotloopDrawerOpen}
        onClose={() => setDotloopDrawerOpen(false)}
        status={dotloopStatus}
        onTriggerTestEvent={handleTriggerDotloopTestEvent}
        onStatusRefresh={fetchDotloopStatus}
        isProd={isProd}
      />

      {/* Event Ingestion Receipt Log Panel */}
      {!isProd && (
        <div className="border-t border-border-soft pt-8 mt-4">
          <EventReceiptLog />
        </div>
      )}

    </div>
  );
}

function ConnectorCard({ conn, isExpanded, onToggle }: { conn: ConnectorDetail; isExpanded: boolean; onToggle: () => void; key?: string }) {
  const getStatusLabel = (name: string, readiness: string) => {
    if (name === 'Internal Operating Memory' || name === 'Secure Agent Links' || name === 'Manual CSV Import') {
      return { label: 'Manual-first active', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    }
    if (readiness === 'Active') {
      return { label: 'Connected', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    }
    if (readiness === 'Ready to Config') {
      return { label: 'Setup needed', color: 'bg-amber-50 text-amber-700 border border-amber-200' };
    }
    if (readiness === 'Future Roadmap') {
      return { label: 'Coming later', color: 'bg-stone-100 text-text-tertiary border border-border-soft' };
    }
    return { label: 'Not connected', color: 'bg-stone-100 text-text-tertiary border border-border-soft' };
  };

  const status = getStatusLabel(conn.name, conn.readiness);

  return (
    <div className="bg-surface border border-border-soft rounded-2xl shadow-card p-4 hover:border-brand-primary/30 transition-all text-stone-850">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 select-none">
            <h4 className="font-serif font-bold text-sm text-stone-100">{conn.name}</h4>
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-medium leading-relaxed">
            {conn.description}
          </p>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-stone-800 rounded text-text-tertiary transition-colors cursor-pointer"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border-soft space-y-3.5 text-xs text-stone-400 font-medium leading-normal animate-fade-in">
          
          <div className="grid grid-cols-2 gap-3 bg-stone-950 p-2.5 rounded-lg border border-border-subtle">
            <div>
              <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Production Reqs</span>
              <span className="font-bold text-stone-300 text-[10px]">{conn.productionReqs}</span>
            </div>
            <div>
              <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Demo Status</span>
              <span className="font-bold text-brand-primary text-[10px]">{conn.demoStatus}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Powers Workflow</span>
            <p className="text-stone-300 font-bold">{conn.whatItPowers}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Data Objects Read</span>
              <div className="flex flex-wrap gap-1">
                {conn.dataRead.map(d => (
                  <span key={d} className="bg-stone-950 border border-stone-850 px-1.5 py-0.2 rounded text-[9px] font-mono">{d}</span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-wider block">Data Objects Written</span>
              <div className="flex flex-wrap gap-1">
                {conn.dataWritten.map(d => (
                  <span key={d} className="bg-stone-950 border border-stone-850 px-1.5 py-0.2 rounded text-[9px] font-mono">{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1 bg-brand-soft/20 border border-brand-primary/10 p-2 rounded-lg">
            <span className="text-[8px] text-brand-primary font-bold uppercase tracking-wider block">Safeguards & Compliance Guardrails</span>
            <p className="text-stone-300 text-[10px] leading-relaxed">{conn.approvalGuardrails}</p>
          </div>

        </div>
      )}
    </div>
  );
}
